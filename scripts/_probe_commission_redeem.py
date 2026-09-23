#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""佣金核销（兑换题数 / 下单抵扣）资金不变量离线探针。

    "C:/Users/HUAWEI/AppData/Local/Programs/Python/Python312/python.exe" scripts/_probe_commission_redeem.py
    "C:/Users/HUAWEI/AppData/Local/Programs/Python/Python312/python.exe" scripts/_probe_commission_redeem.py --pre

不连 MySQL：假 pymysql 吞掉建表，再把连接换成临时 SQLite 文件 —— 每次 execute 新建/关闭
一条连接，和生产的 Database.execute() 语义一致，所以两个线程抢同一行是真抢。
判的是钱：能不能双扣、能不能超支、能不能白拿题数、能不能既拿题数又把佣金拿回来。
--pre 跑 HEAD（本次改动前）的代码，下面 expect_red 的条目必须变红；红在别处＝探针自己坏了。
"""
import copy
import glob
import os
import re
import shutil
import sqlite3
import subprocess
import sys
import tempfile
import threading
import types

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "src"))

PRE = "--pre" in sys.argv
if PRE:
    _tmp = os.path.join(tempfile.gettempdir(), "xs_probe_commission_pre_src")
    shutil.rmtree(_tmp, ignore_errors=True)
    os.makedirs(_tmp)
    for _p in glob.glob(os.path.join(ROOT, "src", "*.py")):
        shutil.copy2(_p, _tmp)
    for _name in ("database.py", "backend.py"):
        _raw = subprocess.run(["git", "show", "HEAD:src/" + _name], cwd=ROOT, capture_output=True).stdout
        if not _raw:
            raise SystemExit("git show HEAD:src/%s 取不到内容" % _name)
        with open(os.path.join(_tmp, _name), "wb") as _f:
            _f.write(_raw)
    sys.path.insert(0, _tmp)

fake = types.ModuleType("pymysql")
fake.err = types.ModuleType("pymysql.err")


class _FakeCur:
    lastrowid = 0
    rowcount = 0

    def execute(self, *a, **k):
        return self

    def fetchone(self):
        return None

    def fetchall(self):
        return []

    def close(self):
        pass


class _FakeConn:
    def cursor(self):
        return _FakeCur()

    def commit(self):
        pass

    def close(self):
        pass

    def ping(self, reconnect=True):
        pass


fake.connect = lambda *a, **k: _FakeConn()
fake.cursors = types.ModuleType("pymysql.cursors")
fake.cursors.DictCursor = object
fake.err.Error = Exception
# database.py 的 import pymysql 是函数级的，异常类必须别名到 sqlite3 的对应物，
# 否则 except pymysql.IntegrityError 在探针里永远不命中 —— 那是最危险的假绿。
fake.IntegrityError = sqlite3.IntegrityError
fake.OperationalError = sqlite3.OperationalError
sys.modules["pymysql"] = fake
sys.modules["pymysql.cursors"] = fake.cursors

import database  # noqa: E402

db = database.db

DB_PATH = os.path.join(tempfile.gettempdir(), "xs_probe_commission.sqlite3")
if os.path.exists(DB_PATH):
    os.remove(DB_PATH)


def _msq(sql):
    """MySQL 方言 → SQLite：只补时间写法，不改语义。"""
    s = sql.replace("%s", "?")
    s = re.sub(r"CURRENT_TIMESTAMP\s*-\s*INTERVAL\s+(\d+)\s+DAY\b",
               lambda m: "datetime('now','-%s days')" % m.group(1), s, flags=re.I)
    s = re.sub(r"CURRENT_TIMESTAMP\s*-\s*INTERVAL\s+(\d+)\s+MINUTE\b",
               lambda m: "datetime('now','-%s minutes')" % m.group(1), s, flags=re.I)
    s = re.sub(r"CURRENT_TIMESTAMP\s*\+\s*INTERVAL\s+(\d+)\s+DAY\b",
               lambda m: "datetime('now','+%s days')" % m.group(1), s, flags=re.I)
    s = re.sub(r"\bGREATEST\s*\(", "MAX(", s, flags=re.I)
    return s


class SqliteCursor(object):
    def __init__(self, raw):
        self.raw = raw

    @property
    def rowcount(self):
        return self.raw.rowcount

    @property
    def lastrowid(self):
        return self.raw.lastrowid

    def execute(self, sql, params=()):
        self.raw.execute(_msq(sql), params)

    def fetchone(self):
        return self.raw.fetchone()

    def fetchall(self):
        return self.raw.fetchall()

    def close(self):
        self.raw.close()


class SqliteConn(object):
    def __init__(self):
        self.raw = sqlite3.connect(DB_PATH, timeout=15)
        self.raw.row_factory = sqlite3.Row

    def cursor(self):
        return SqliteCursor(self.raw.cursor())

    def commit(self):
        self.raw.commit()

    def close(self):
        self.raw.close()


db._new_mysql_conn = SqliteConn

with sqlite3.connect(DB_PATH) as _c:
    _c.executescript("""
CREATE TABLE users (
  username TEXT PRIMARY KEY, email TEXT, is_verified INTEGER DEFAULT 1,
  points_balance INTEGER DEFAULT 0, member_until TEXT, is_banned INTEGER DEFAULT 0,
  ban_reason TEXT, invite_code TEXT, commission_balance DECIMAL(10,2) DEFAULT 0,
  custom_model_until TEXT, channel TEXT, channel_ref TEXT);
CREATE TABLE admin_config (
  id INTEGER PRIMARY KEY, referral_enabled INTEGER DEFAULT 1,
  referral_rate DECIMAL(5,2) DEFAULT 0.30, referral_min_withdraw DECIMAL(10,2) DEFAULT 0.10,
  referral_settle_days INTEGER DEFAULT 3, referral_points_rate INTEGER DEFAULT 50,
  referral_exchange_enabled INTEGER DEFAULT 1, referral_deduct_enabled INTEGER DEFAULT 1,
  referral_hold_minutes INTEGER DEFAULT 30, refund_days_limit INTEGER DEFAULT 7);
INSERT INTO admin_config (id) VALUES (1);
CREATE TABLE referrals (
  id INTEGER PRIMARY KEY AUTOINCREMENT, inviter_username TEXT, invitee_username TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE commission_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT, inviter TEXT, invitee TEXT, order_no TEXT,
  order_amount DECIMAL(10,2), rate DECIMAL(5,2), commission_amount DECIMAL(10,2),
  status TEXT DEFAULT 'pending', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE commission_redemptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL, kind TEXT NOT NULL,
  request_no TEXT NOT NULL, order_no TEXT NULL, amount DECIMAL(10,2) NOT NULL,
  points INTEGER NOT NULL DEFAULT 0, rate DECIMAL(10,4) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (username, request_no), UNIQUE (order_no));
CREATE TABLE payment_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT, order_no TEXT UNIQUE, username TEXT,
  plan_id INTEGER, plan_name TEXT, plan_type TEXT, price DECIMAL(10,2),
  plan_price DECIMAL(10,2), commission_used DECIMAL(10,2) DEFAULT 0,
  points INTEGER, days INTEGER, status TEXT, paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  pay_method TEXT DEFAULT '', pay_channel TEXT DEFAULT '', trade_no TEXT DEFAULT '',
  qr_code TEXT DEFAULT '', pay_url TEXT DEFAULT '', bank_order_no TEXT DEFAULT '',
  pay_type TEXT DEFAULT '', business_type TEXT DEFAULT '', channel_order_no TEXT DEFAULT '',
  refunded_at TIMESTAMP, refund_reason TEXT, refunded_by TEXT,
  refund_amount DECIMAL(10,2), refund_detail TEXT);
CREATE TABLE point_lots (
  id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, order_no TEXT, source TEXT,
  total_points INTEGER, used_points INTEGER DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE usage_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, delta_points INTEGER,
  balance_after INTEGER, reason TEXT, question_hash TEXT, order_no TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
""")
_c.close()

print("database 来源：", "HEAD（本次改动前）" if PRE else database.__file__)

RED = 0
LINES = []
SEEDS = {}


def step(label, fn, want, expect_red=False):
    global RED
    try:
        got = fn()
    except Exception as e:
        got = "抛异常 %s：%s" % (type(e).__name__, str(e).strip()[:70])
    hit = got == want
    if PRE:
        ok = hit if not expect_red else False
        unexpected_green = expect_red and hit
    else:
        ok = hit
        unexpected_green = False
    if not ok or unexpected_green:
        RED += 1
        LINES.append(label)
    if unexpected_green:
        print(f"  [GREEN(预期它红)] {label}  ← 这条从没守过任何东西")
    elif not ok and PRE and expect_red:
        print(f"  [RED(预期内)] {label}")
        print(f"           旧代码给到={got!r}")
    elif not ok:
        print(f"  [RED] {label}")
        print(f"           得到={got!r}\n           期望={want!r}")
    else:
        print(f"  [GREEN] {label}")
    return got


def seed(user, commission="0.00", points=0):
    db.execute("DELETE FROM users WHERE username = %s", (user,))
    db.execute("INSERT INTO users (username, commission_balance, points_balance) VALUES (%s, %s, %s)",
               (user, commission, points))
    db.execute("DELETE FROM commission_redemptions WHERE username = %s", (user,))
    SEEDS[user] = float(commission)


def bal(user):
    r = db.fetchone("SELECT COALESCE(commission_balance,0) b FROM users WHERE username=%s", (user,))
    return round(float((r or {}).get("b") or 0), 2)


def pts(user):
    r = db.fetchone("SELECT COALESCE(points_balance,0) p FROM users WHERE username=%s", (user,))
    return int((r or {}).get("p") or 0)


def led(user):
    rows = db.fetchall("SELECT kind, amount, status FROM commission_redemptions WHERE username=%s ORDER BY id", (user,))
    return [(r["kind"], round(float(r["amount"]), 2), r["status"]) for r in rows]


def cfg(**kw):
    with sqlite3.connect(DB_PATH) as c:
        c.execute("UPDATE admin_config SET " + ", ".join(f"{k}=?" for k in kw) + " WHERE id=1",
                  list(kw.values()))
        c.commit()


def race2(body, parties=2):
    """两个线程同时冲进 body：body(i) 的返回收进列表。
    hits 只在栅栏成功越过后才计数 —— 没真的重叠过，这条测试就不作数（防假绿）。"""
    bar = threading.Barrier(parties)
    hits = []
    out = []
    lock = threading.Lock()

    def w(i):
        try:
            bar.wait(10)
        except Exception as e:
            hits.append("BROKEN:%s" % type(e).__name__)
            return
        hits.append(1)
        try:
            r = body(i)
        except Exception as e:
            r = "线程抛异常 %s：%s" % (type(e).__name__, str(e)[:60])
        with lock:
            out.append(r)

    ts = [threading.Thread(target=w, args=(i,)) for i in range(parties)]
    for t in ts:
        t.start()
    for t in ts:
        t.join(30)
    return sorted(out, key=repr), hits


def gated_barrier():
    """给「必须在函数体内部某个点重叠」的用例造一道栅栏 + 计数器。"""
    bar = threading.Barrier(2)
    hits = []

    def sync():
        try:
            bar.wait(10)
        except Exception as e:
            hits.append("BROKEN:%s" % type(e).__name__)
            raise
        hits.append(1)
    return sync, hits


def patch(name, make):
    """临时替换 db.<name>，返回 (原函数, 还原动作)。make(orig) 拿到原函数造替身。"""
    orig = getattr(db, name)

    def wrapped(*a, **k):
        return proxy(*a, **k)

    proxy = make(orig)
    setattr(db, name, wrapped)
    return orig, lambda: setattr(db, name, orig)


# ==================== G0 底座自检 ====================
print("\nG0 探针底座（两种模式都必须绿，否则后面全是假绿）")
seed("g0", "3.00")


def _g0():
    cur = db.execute("UPDATE users SET commission_balance = commission_balance - %s "
                     "WHERE username = %s AND commission_balance >= %s", ("3.00", "g0", "3.00"))
    first = [cur.rowcount, bal("g0")]
    cur2 = db.execute("UPDATE users SET commission_balance = commission_balance - %s "
                      "WHERE username = %s AND commission_balance >= %s", ("3.00", "g0", "3.00"))
    return [first, cur2.rowcount, bal("g0"), led("g0")]


step("G0a 条件 UPDATE 扣款：够扣才改、不够扣 rowcount=0（DECIMAL 列对 TEXT 参数按数值比）",
     _g0, [[1, 0.0], 0, 0.0, []])

_a = sqlite3.connect(DB_PATH)
_b = sqlite3.connect(DB_PATH)
_a.execute("UPDATE users SET commission_balance = 7 WHERE username='g0'")
_a.commit()
_cross = _b.execute("SELECT commission_balance FROM users WHERE username='g0'").fetchone()[0]
_a.close()
_b.close()
step("G0b 两条独立连接能看到对方已提交的钱（跨会话抢同一行才是真抢）", lambda: float(_cross), 7.0)

try:
    _b2 = sqlite3.connect(DB_PATH, timeout=0.1)
    _hold = sqlite3.connect(DB_PATH)
    _hold.execute("UPDATE users SET commission_balance = 8 WHERE username='g0'")
    locked_err = None
    try:
        _b2.execute("UPDATE users SET commission_balance = 9 WHERE username='g0'")
        _b2.commit()
    except sqlite3.OperationalError as e:
        locked_err = str(e)[:20]
    _hold.rollback()
    _hold.close()
    _b2.close()
except Exception as e:
    locked_err = None
step("G0c 未提交的写会让另一条会话等待/报错（SQLite 真的在管行锁，不会静默丢更新）",
     lambda: bool(locked_err) or "无冲突", True)


# ==================== G1 冷却期结算不双入账 ====================
print("\nG1 冷却期结算：同一笔佣金只能入账一次")
seed("dave", "0.00")
db.execute("INSERT INTO commission_logs (inviter, invitee, order_no, order_amount, rate, commission_amount, status, created_at) "
           "VALUES ('dave','someone','ORD-D1',10,0.30,3.00,'pending', datetime('now','-10 days'))")
db.settle_pending_commissions("dave")


def _g1_seq():
    db.settle_pending_commissions("dave")
    return [bal("dave"), db.fetchone("SELECT status s FROM commission_logs WHERE order_no='ORD-D1'")["s"]]


step("G1a 结算完再结算一次，余额不动（对照组，两种模式都该绿）", _g1_seq, [3.0, "paid"])

seed("eve", "0.00")
db.execute("INSERT INTO commission_logs (inviter, invitee, order_no, order_amount, rate, commission_amount, status, created_at) "
           "VALUES ('eve','someone','ORD-E1',10,0.30,3.00,'pending', datetime('now','-10 days'))")


def _g1_race():
    sync, hits = gated_barrier()
    seen = []

    def make(orig):
        def spy(sql, params=()):
            if "SELECT id," in sql and "FROM commission_logs" in sql:
                seen.append(1)
                sync()
            return orig(sql, params)
        return spy
    _, restore = patch("fetchall", make)
    try:
        race2(lambda i: db.settle_pending_commissions("eve"))
    finally:
        restore()
    return [sum(1 for h in hits if h == 1), len(seen), bal("eve"),
            db.fetchone("SELECT status s FROM commission_logs WHERE order_no='ORD-E1'")["s"]]


step("G1b 两条会话同时结算同一条 pending → 余额只能变 3.00（不是 6.00）",
     _g1_race, [2, 2, 3.0, "paid"], expect_red=True)


# ==================== G2 兑换题数 ====================
print("\nG2 佣金兑换题数：门槛、取整、幂等、不超支、失败必退")
seed("fiona", "5.00")


def _g2_min():
    ok, msg, row = db.exchange_commission_for_points("fiona", 0.05, "REQ-MIN")
    return [ok, msg, bal("fiona"), led("fiona")]


step("G2a 低于单次最低额：拒绝、一分不扣、台账不留痕", _g2_min,
     [False, "单次最低兑换 0.10 元", 5.0, []], expect_red=True)


def _g2_floor():
    return [db.points_from_commission("0.99", 50), db.points_from_commission(2, 50),
            db.points_from_commission("0.01", 50), db.points_from_commission("1.00", 0)]


step("G2b 折题数向下取整：0.99 元→49 题，不四舍五入送人", _g2_floor, [49, 100, 0, 0], expect_red=True)


def _g2_exchange():
    ok, msg, row = db.exchange_commission_for_points("fiona", 0.99, "REQ-F1")
    lots = [(r["source"], bool(r["order_no"]), r["total_points"])
            for r in db.fetchall("SELECT source, order_no, total_points FROM point_lots WHERE username='fiona' ORDER BY id")]
    return [ok, msg, pts("fiona"), bal("fiona"), led("fiona"), lots]


step("G2c 0.99 元兑换：扣 0.99、得 49 题、批次来源 commission 且不挂订单号", _g2_exchange,
     [True, "兑换成功，49 题已到账", 49, 4.01, [("exchange", 0.99, "done")],
      [("commission", False, 49)]], expect_red=True)


def _g2_dup():
    outs, hits = race2(lambda i: db.exchange_commission_for_points("fiona", 0.99, "REQ-F1")[:1])
    return [sum(1 for h in hits if h == 1), sum(1 for o in outs if o[0] is True),
            bal("fiona"), pts("fiona"), len(led("fiona"))]


step("G2d 同一个幂等号并发点两次：两次都答成功，但钱只扣一次、题只加一次", _g2_dup,
     [2, 2, 4.01, 49, 1], expect_red=True)


def _g2_over():
    seed("gary", "5.00")
    outs, hits = race2(lambda i: db.exchange_commission_for_points("gary", 4.00, "REQ-G%d" % i)[:1])
    return [sum(1 for h in hits if h == 1), sum(1 for o in outs if o[0] is True),
            bal("gary"), pts("gary"), sorted(s for _, _, s in led("gary"))]


step("G2e 余额只够一笔时两个人各用不同幂等号抢：只成一笔、余额不为负", _g2_over,
     [2, 1, 1.0, 200, ["done", "failed"]], expect_red=True)


def _g2_grantfail():
    seed("helen", "5.00")
    _, restore = patch("adjust_user_points", lambda orig: (lambda *a, **k: (False, "模拟题数发放失败")))
    try:
        ok, msg, row = db.exchange_commission_for_points("helen", 1.00, "REQ-H1")
    finally:
        restore()
    return [ok, msg, bal("helen"), pts("helen"), led("helen")]


step("G2f 题数没发放成功：佣金原路退回、台账标 released", _g2_grantfail,
     [False, "题数未到账，佣金已退回：模拟题数发放失败", 5.0, 0, [("exchange", 1.0, "released")]],
     expect_red=True)


def _g2_cap():
    seed("ivan", "20001.00")
    ok, msg, _ = db.exchange_commission_for_points("ivan", 10001, "REQ-I1")
    return [ok, msg[:6], bal("ivan"), len(led("ivan"))]


step("G2g 单次上限之上直接拒绝（防脚本一次刷穿）", _g2_cap,
     [False, "单次兑换金额", 20001.0, 0], expect_red=True)


def _g2_switch():
    cfg(referral_exchange_enabled=0)
    try:
        seed("judith", "5.00")
        ok, msg, _ = db.exchange_commission_for_points("judith", 1.00, "REQ-J1")
        return [ok, msg, bal("judith"), len(led("judith"))]
    finally:
        cfg(referral_exchange_enabled=1)


step("G2h 后台关掉兑换开关：接口拒绝、钱不动", _g2_switch,
     [False, "佣金兑换题数暂未开放", 5.0, 0], expect_red=True)


# ==================== G3 下单抵扣 ====================
print("\nG3 下单抵扣：拆分口径、冻结、核销、超时回收")


def _g3_split():
    rc = db.referral_redemption_cfg()
    seed("kevin", "2.00")
    a = db.commission_deduct_split("kevin", 3.00, rc)
    seed("lisa", "10.00")
    b = db.commission_deduct_split("lisa", 3.00, rc)
    seed("mike", "10.00")
    c = db.commission_deduct_split("mike", 0, rc)
    seed("nina", "0.00")
    d = db.commission_deduct_split("nina", 5.00, rc)
    return [a, b, c, d]


step("G3a 原价=现金+抵扣，抵扣只取 min(余额, 原价)，永不放大", _g3_split,
     [(3.0, 2.0, 1.0), (3.0, 3.0, 0.0), (0.0, 0.0, 0.0), (5.0, 0.0, 5.0)], expect_red=True)


def _g3_split_off():
    cfg(referral_deduct_enabled=0)
    try:
        rc = db.referral_redemption_cfg()
        seed("oscar", "8.00")
        return [db.commission_deduct_split("oscar", 5.00, rc), float(db.max_commission_deduct("oscar", 5.00, rc))]
    finally:
        cfg(referral_deduct_enabled=1)


step("G3b 后台关掉抵扣开关：抵扣恒为 0，现金=原价", _g3_split_off,
     [(5.0, 0.0, 5.0), 0.0], expect_red=True)


def _g3_race():
    seed("peter", "5.00")
    sync, hits = gated_barrier()

    def make(orig):
        def spy(*a, **k):
            sync()
            return orig(*a, **k)
        return spy
    _, restore = patch("lock_commission_for_order", make)
    try:
        outs, n = race2(lambda i: db.lock_commission_for_order("peter", "ORD-P%s" % i, 5.00, "REQ-P%s" % i)[0])
    finally:
        restore()
    return [sum(1 for h in hits if h == 1), [o for o in outs if o is True],
            round(float(db.commission_frozen("peter")), 2), bal("peter")]


step("G3c 两单同时抢同一份余额：只成一单，冻结合计不超过余额", _g3_race,
     [2, [True], 5.0, 0.0], expect_red=True)


def _g3_full_flow():
    seed("quinn", "5.00")
    db.execute("INSERT INTO referrals (inviter_username, invitee_username) VALUES ('sponsor','quinn')")
    rc = db.referral_redemption_cfg()
    gross, deduct, cash = db.commission_deduct_split("quinn", 5.00, rc)
    plan = {"id": 7, "name": "500题", "plan_type": "points", "price": cash,
            "plan_price": gross, "commission_used": deduct, "points": 500, "days": 0}
    order_no = db.new_order_no("quinn")
    ok, msg, row = db.lock_commission_for_order("quinn", order_no, deduct, "REQ-Q1", rc)
    before = db.fetchone("SELECT COUNT(*) c FROM commission_logs")["c"]
    ono, paid, pmsg = db.create_paid_order_and_apply("quinn", plan, order_no=order_no)
    o = db.get_order(order_no)
    again_ok, again_msg = db.apply_paid_order(order_no)
    after = db.fetchone("SELECT COUNT(*) c FROM commission_logs")["c"]
    logs = [(round(float(r["order_amount"]), 2), round(float(r["commission_amount"]), 2))
            for r in db.fetchall("SELECT order_amount, commission_amount FROM commission_logs WHERE order_no=%s", (order_no,))]
    return [ok, paid, o["status"], round(float(o["price"]), 2), round(float(o["plan_price"]), 2),
            round(float(o["commission_used"]), 2), pts("quinn"), bal("quinn"),
            float(db.commission_frozen("quinn")), led("quinn"), [again_ok, again_msg],
            after - before, logs]


step("G3d 全额抵扣单闭环：付 0 现金拿 500 题、抵扣转核销、佣金不回笼、¥0 单不产生新佣金", _g3_full_flow,
     [True, True, "paid", 0.0, 5.0, 5.0, 500, 0.0, 0.0, [("checkout", 5.0, "consumed")],
      [True, "订单已到账"], 0, []], expect_red=True)


def _g3_partial_commission():
    seed("rhona", "2.00")
    db.execute("INSERT INTO referrals (inviter_username, invitee_username) VALUES ('sponsor2','rhona')")
    rc = db.referral_redemption_cfg()
    gross, deduct, cash = db.commission_deduct_split("rhona", 5.00, rc)
    plan = {"id": 7, "name": "500题", "plan_type": "points", "price": cash,
            "plan_price": gross, "commission_used": deduct, "points": 500, "days": 0}
    order_no = db.new_order_no("rhona")
    db.lock_commission_for_order("rhona", order_no, deduct, "REQ-R0", rc)
    db.create_paid_order_and_apply("rhona", plan, order_no=order_no)
    logs = [(round(float(r["order_amount"]), 2), round(float(r["commission_amount"]), 2))
            for r in db.fetchall("SELECT order_amount, commission_amount FROM commission_logs WHERE order_no=%s", (order_no,))]
    return [logs, bal("rhona"), pts("rhona")]


step("G3e 部分抵扣单：佣金只按现金实付 3.00 计提（不按原价 5.00），抵扣掉的 2.00 不再产生佣金",
     _g3_partial_commission, [[(3.0, 0.9)], 0.0, 500], expect_red=True)


def _g3_reap():
    seed("rosa", "5.00")
    rc = db.referral_redemption_cfg()
    order_no = db.new_order_no("rosa")
    db.execute("INSERT INTO payment_orders (order_no, username, plan_id, plan_name, plan_type, price, plan_price, commission_used, points, days, status) "
               "VALUES (%s,'rosa',7,'500题','points',0,5.00,5.00,500,0,'pending')", (order_no,))
    ok, msg, row = db.lock_commission_for_order("rosa", order_no, 5.00, "REQ-R1", rc)
    with sqlite3.connect(DB_PATH) as c:
        c.execute("UPDATE commission_redemptions SET created_at = datetime('now','-2 hours') WHERE order_no=?", (order_no,))
        c.commit()
    n = db.release_expired_commission_holds()
    o = db.get_order(order_no)
    late = db.apply_paid_order(order_no)
    twice = db.release_commission_hold(order_no, "再回收一次")
    return [ok, n, bal("rosa"), o["status"], pts("rosa"), [late[0], late[1]],
            db.fetchone("SELECT status s FROM commission_redemptions WHERE order_no=%s", (order_no,))["s"],
            twice, bal("rosa")]


step("G3f 下单不付→超时回收：佣金退回、¥0 单关掉，之后付款回调拿不到题数，且退不了第二次", _g3_reap,
     [True, 1, 5.0, "cancelled", 0, [False, "订单状态不可到账"], "released", False, 5.0],
     expect_red=True)


def _g3_release_then_consume():
    seed("titan", "3.00")
    order_no = db.new_order_no("titan")
    db.lock_commission_for_order("titan", order_no, 3.00, "REQ-T1")
    db.release_commission_hold(order_no, "网关侧未付")
    consumed = db.consume_commission_hold(order_no)
    return [consumed, bal("titan"),
            db.fetchone("SELECT status s FROM commission_redemptions WHERE order_no=%s", (order_no,))["s"]]


step("G3g 冻结已退回后核销必须失败（同一笔钱不能既回笼又核销）", _g3_release_then_consume,
     [False, 3.0, "released"], expect_red=True)


def _g3_consume_then_release():
    seed("uma", "3.00")
    order_no = db.new_order_no("uma")
    db.lock_commission_for_order("uma", order_no, 3.00, "REQ-U1")
    consumed = db.consume_commission_hold(order_no)
    back = db.release_commission_hold(order_no, "回收线程晚到")
    return [consumed, back, bal("uma"),
            db.fetchone("SELECT status s FROM commission_redemptions WHERE order_no=%s", (order_no,))["s"]]


step("G3h 已核销后回收必须失败（付了钱又把佣金拿回＝白拿）", _g3_consume_then_release,
     [True, False, 0.0, "consumed"], expect_red=True)


def _g3_refund_blocked():
    seed("vera", "3.00")
    rc = db.referral_redemption_cfg()
    order_no = db.new_order_no("vera")
    db.execute("INSERT INTO payment_orders (order_no, username, plan_id, plan_name, plan_type, price, plan_price, commission_used, points, days, status) "
               "VALUES (%s,'vera',7,'300题','points',2.00,5.00,3.00,300,0,'pending')", (order_no,))
    db.lock_commission_for_order("vera", order_no, 3.00, "REQ-V1", rc)
    db.apply_paid_order(order_no)
    ok, res = db.refund_order(order_no, "用户申请", "vera", user_initiated=True)
    return [ok, res if isinstance(res, str) else "旧代码退款成功 ¥%.2f" % res["amount"],
            bal("vera"), pts("vera")]


step("G3i 抵扣单的自助退款必须被挡（现金按实付退、花掉的佣金没人核减＝用户两头亏）", _g3_refund_blocked,
     [False, "该订单用了佣金抵扣，需管理员人工核算（现金按实付退、抵扣掉的佣金另行核减）", 0.0, 300],
     expect_red=True)


# ==================== G4 退款与题数归属 ====================
print("\nG4 退款口径：只认现金实付，兑换来的题数不算进订单批次")
DISC = {"username": "walter", "order_no": "ORD-W1", "plan_type": "points", "plan_name": "500题",
        "price": 1.00, "plan_price": 5.00, "commission_used": 4.00, "points": 500, "days": 0,
        "status": "paid", "pay_method": "alipay"}
PLAIN = {"username": "walter", "order_no": "ORD-W2", "plan_type": "points", "plan_name": "500题",
         "price": 5.00, "plan_price": 5.00, "commission_used": 0.00, "points": 500, "days": 0,
         "status": "paid", "pay_method": "alipay"}

step("G4a 拦截判定只看有没有抵扣（普通单不受影响，对照组）",
     lambda: [bool(db.refund_block_reason(copy.deepcopy(DISC))),
              db.refund_block_reason(copy.deepcopy(PLAIN))],
     [True, ""], expect_red=True)

step("G4b 退款金额只按现金实付折算（抵扣掉的那部分不在退款口径里）",
     lambda: [round(db.calculate_refund(copy.deepcopy(DISC), balance=500)["amount"], 2),
              round(db.calculate_refund(copy.deepcopy(PLAIN), balance=500)["amount"], 2)],
     [1.0, 5.0])


def _g4_lots():
    seed("xena", "2.00")
    plan = {"id": 7, "name": "300题", "plan_type": "points", "price": 3.00, "points": 300, "days": 0}
    order_no, ok, msg = db.create_paid_order_and_apply("xena", plan)
    db.exchange_commission_for_points("xena", 1.00, "REQ-X1")
    remain = db.get_order_remaining_points(order_no)
    calc = db.calculate_refund(dict(db.get_order(order_no)), balance=pts("xena"))
    lots = [(r["source"], bool(r["order_no"]), r["total_points"])
            for r in db.fetchall("SELECT source, order_no, total_points FROM point_lots WHERE username='xena' ORDER BY id")]
    return [ok, pts("xena"), remain, round(calc["amount"], 2), lots]


step("G4c 兑换来的 50 题不进订单批次：不能靠它把 3 元单退成更多，也不会被批次扣回", _g4_lots,
     [True, 350, 300, 3.0, [("order", True, 300), ("commission", False, 50)]], expect_red=True)


def _g4_refund_endtoend():
    seed("wilma", "3.00")
    order_no = "ORD-W9"
    db.execute("UPDATE users SET commission_balance = commission_balance - 3.00 WHERE username='wilma'")
    db.execute("INSERT INTO payment_orders (order_no, username, plan_id, plan_name, plan_type, price, plan_price, commission_used, points, days, status, paid_at) "
               "VALUES (%s,'wilma',7,'300题','points',2.00,5.00,3.00,300,0,'paid', CURRENT_TIMESTAMP)", (order_no,))
    db.execute("INSERT INTO commission_redemptions (username, kind, request_no, order_no, amount, points, rate, status) "
               "VALUES ('wilma','checkout','REQ-W9',%s,3.00,0,1,'consumed')", (order_no,))
    db.execute("INSERT INTO point_lots (username, order_no, source, total_points, used_points) VALUES ('wilma',%s,'order',300,0)", (order_no,))
    db.execute("UPDATE users SET points_balance = 300 WHERE username='wilma'")
    ok, res = db.refund_order(order_no, "用户申请退款", "wilma", user_initiated=True)
    o = db.get_order(order_no)
    return [ok, res if isinstance(res, str) else "旧代码退成 ¥%.2f" % res["amount"],
            o["status"], pts("wilma"), round(float(o["refund_amount"] or 0), 2),
            db.fetchone("SELECT status s FROM commission_redemptions WHERE order_no=%s", (order_no,))["s"]]


step("G4d 端到端：带抵扣的订单自助退款必须整体被挡（旧代码会退 2 元现金、扣光 300 题、烧掉 3 元佣金）",
     _g4_refund_endtoend,
     [False, "该订单用了佣金抵扣，需管理员人工核算（现金按实付退、抵扣掉的佣金另行核减）",
      "paid", 300, 0.0, "consumed"], expect_red=True)


# ==================== G5 配置口径 ====================
print("\nG5 后台配置口径")


def _g5_defaults():
    cfg(referral_points_rate=0, referral_hold_minutes=1, referral_min_withdraw=0.50)
    try:
        c = db.referral_redemption_cfg()
        return [c["referral_on"], c["points_rate"], c["exchange_on"], c["deduct_on"],
                c["hold_minutes"], float(c["min_amount"])]
    finally:
        cfg(referral_points_rate=50, referral_hold_minutes=30, referral_min_withdraw=0.10)


step("G5a 比率/冻结时长取不到时落安全默认（0→50 题/元、1 分钟→30 分钟），最低额跟随提现门槛",
     _g5_defaults, [1, 50, 1, 1, 30, 0.5], expect_red=True)


def _g5_frozen_scope():
    seed("yuri", "6.00")
    db.lock_commission_for_order("yuri", "ORD-Y1", 2.00, "REQ-Y1")
    db.lock_commission_for_order("yuri", "ORD-Y2", 1.00, "REQ-Y2")
    db.exchange_commission_for_points("yuri", 1.00, "REQ-Y3")
    rows = db.list_commission_redemptions("yuri", 10)
    return [float(db.commission_frozen("yuri")), bal("yuri"), [r["kind"] for r in rows],
            [r["status"] for r in rows]]


step("G5b 冻结额只算 locked 的下单抵扣（兑换即时到账不进去）；记录按新→旧返回", _g5_frozen_scope,
     [3.0, 2.0, ["exchange", "checkout", "checkout"], ["done", "locked", "locked"]],
     expect_red=True)


def _g5_referral_off():
    cfg(referral_enabled=0)
    try:
        seed("zack", "5.00")
        rc = db.referral_redemption_cfg()
        ok, msg, _ = db.exchange_commission_for_points("zack", 1.00, "REQ-Z1")
        return [rc["referral_on"], ok, msg, db.commission_deduct_split("zack", 5.00, rc), bal("zack")]
    finally:
        cfg(referral_enabled=1)


step("G5c 推广总开关关掉：兑换拒绝、抵扣恒 0", _g5_referral_off,
     [0, False, "佣金兑换题数暂未开放", (5.0, 0.0, 5.0), 5.0], expect_red=True)


# ==================== G6 全账守恒 ====================
print("\nG6 全账守恒：钱不会凭空多，也不会凭空少")
db.execute("DELETE FROM users WHERE username = 'g0'")
SEEDS.pop("g0", None)


def _g6():
    users = db.fetchall("SELECT username, COALESCE(commission_balance,0) b FROM users")
    seeded = round(sum(SEEDS.get(u, 0.0) for u in [r["username"] for r in users]), 2)
    minted = round(sum(float(r["commission_amount"]) for r in
                        db.fetchall("SELECT commission_amount FROM commission_logs WHERE status='paid'")), 2)
    held = round(sum(float(r["amount"]) for r in db.fetchall(
        "SELECT amount FROM commission_redemptions WHERE status IN ('pending','done','locked','consumed')")), 2)
    now = round(sum(float(r["b"]) for r in users), 2)
    return round(now - (seeded + minted - held), 2)


step("G6a Σ余额 == Σ种子 + Σ已结算佣金 − Σ（兑换/核销/在途冻结）", _g6, 0.0)

step("G6b 没有任何用户余额为负",
     lambda: sorted(r["username"] for r in
                    db.fetchall("SELECT username, commission_balance b FROM users WHERE COALESCE(commission_balance,0) < 0")),
     [])
step("G6c 台账里没有悬空 pending（发放要么 done 要么 failed/released）",
     lambda: [r["id"] for r in db.fetchall("SELECT id FROM commission_redemptions WHERE status='pending'")], [])
step("G6d 一条订单号最多一条抵扣记录（重复回调/重复下单不会叠抵扣）",
     lambda: [r["order_no"] for r in db.fetchall(
         "SELECT order_no FROM commission_redemptions WHERE order_no IS NOT NULL "
         "GROUP BY order_no HAVING COUNT(*) > 1")], [])

print("\n" + "=" * 72)
if PRE:
    print("模式：--pre（HEAD 改动前）。RED(预期内) = 本次改动堵住的钱洞，应当全部命中。")
else:
    print("模式：当前工作区代码")
if RED:
    print(f"结果：{RED} 条不符合预期")
    for x in LINES:
        print("  - " + x)
    sys.exit(1)
print("结果：全部符合预期")
try:
    os.remove(DB_PATH)
except OSError as e:
    print("临时库没删掉（可忽略）：", e)
sys.exit(0)
