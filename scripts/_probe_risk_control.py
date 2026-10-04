#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""退款风控判别探针（get_risk_users 命中/阈值/白名单）。

    "C:/Users/HUAWEI/AppData/Local/Programs/Python/Python312/python.exe" scripts/_probe_risk_control.py
    ... scripts/_probe_risk_control.py --pre      # 对修复前代码应变红

不连 MySQL：假 pymysql 吞建表，连接换成临时 SQLite（把 TIMESTAMPDIFF/DATE_SUB 翻译成 SQLite 方言）。
判的是风控名单的不变量：短时退款+多次退款要进名单、退款率达标要进名单、
正常低频退款不得误伤、白名单命中也不出、封禁字段真能落库。
--pre：本次新加的 get_risk_users 在修复前不存在，用 hasattr 兜住并判红。
"""
import os
import re
import sys
import sqlite3
import tempfile
import types

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "src"))
PRE = "--pre" in sys.argv

# ---- 假 pymysql，只吞连接，建表交给真 SQLite ----
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
fake.IntegrityError = sqlite3.IntegrityError
fake.OperationalError = sqlite3.OperationalError
sys.modules["pymysql"] = fake
sys.modules["pymysql.cursors"] = fake.cursors

import database  # noqa: E402

db = database.db

DB_PATH = os.path.join(tempfile.gettempdir(), "xs_probe_risk.sqlite3")
if os.path.exists(DB_PATH):
    os.remove(DB_PATH)


def _msq(sql):
    """把 get_risk_users 用到的 MySQL 方言翻成 SQLite。"""
    # TIMESTAMPDIFF(MINUTE, paid_at, refunded_at) -> 分钟差
    sql = re.sub(
        r"TIMESTAMPDIFF\(MINUTE,\s*(\w+),\s*(\w+)\)",
        lambda m: "CAST((julianday(%s)-julianday(%s))*1440 AS INTEGER)" % (m.group(2), m.group(1)),
        sql, flags=re.I)
    # DATE_SUB(NOW(), INTERVAL n DAY) -> datetime('now','-n days')
    sql = re.sub(
        r"DATE_SUB\(NOW\(\),\s*INTERVAL\s+(\d+)\s+DAY\)",
        lambda m: "datetime('now','-%s days')" % m.group(1),
        sql, flags=re.I)
    sql = sql.replace("NOW()", "CURRENT_TIMESTAMP")
    return sql


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
        self.raw.execute(_msq(sql).replace("%s", "?"), params)

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
CREATE TABLE admin_config (
  id INTEGER PRIMARY KEY,
  risk_enabled INTEGER DEFAULT 1, risk_refund_days INTEGER DEFAULT 30,
  risk_refund_count INTEGER DEFAULT 2, risk_refund_rate_pct INTEGER DEFAULT 50,
  risk_refund_rate_min INTEGER DEFAULT 2, risk_quick_minutes INTEGER DEFAULT 120,
  risk_quick_count INTEGER DEFAULT 2, risk_auto_ban INTEGER DEFAULT 0,
  risk_whitelist TEXT DEFAULT '');
INSERT INTO admin_config (id, risk_whitelist) VALUES (1, 'vip_user');

CREATE TABLE users (
  username TEXT PRIMARY KEY, email TEXT, is_verified INTEGER DEFAULT 1,
  points_balance INTEGER DEFAULT 0, member_until TEXT, is_banned INTEGER DEFAULT 0,
  ban_reason TEXT, invite_code TEXT, commission_balance DECIMAL(10,2) DEFAULT 0,
  custom_model_until TEXT, channel TEXT, channel_ref TEXT);

CREATE TABLE payment_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT, order_no TEXT UNIQUE, username TEXT,
  plan_name TEXT, plan_type TEXT, price DECIMAL(10,2), points INTEGER, days INTEGER,
  status TEXT, paid_at TEXT, refunded_at TEXT, refund_amount DECIMAL(10,2),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP);
""")
    _c.commit()

    # 用 SQL 表达式插入相对时间，保证 30 天窗口不随运行日期漂移
    rows = [
        # moli：近30天退2次，其中一次是支付后52分钟（短时）；共3笔退款、3笔已付
        ("m1", "moli123535", "monthly", "refunded", "datetime('now','-2 days')", "datetime('now','-2 days','+1400 minutes')"),
        ("m2", "moli123535", "monthly", "refunded", "datetime('now','-10 days')", "datetime('now','-10 days','+52 minutes')"),
        ("m3", "moli123535", "points", "refunded", "datetime('now','-100 days')", "datetime('now','-100 days','+30 minutes')"),
        # normal：4笔已付仅1笔退款(25%)，近30天1次，无短时 → 不该被误伤
        ("n1", "normal_user", "monthly", "refunded", "datetime('now','-5 days')", "datetime('now','-5 days','+2000 minutes')"),
        ("n2", "normal_user", "monthly", "paid", "datetime('now','-40 days')", None),
        ("n3", "normal_user", "points", "paid", "datetime('now','-60 days')", None),
        ("n4", "normal_user", "points", "paid", "datetime('now','-80 days')", None),
        # quick_abuser：两笔都是支付后30分钟内退（短时≥2），但都超过30天（近端计数0）
        ("q1", "quick_abuser", "monthly", "refunded", "datetime('now','-200 days')", "datetime('now','-200 days','+30 minutes')"),
        ("q2", "quick_abuser", "monthly", "refunded", "datetime('now','-210 days')", "datetime('now','-210 days','+25 minutes')"),
        # vip_user：和 moli 一样的退款画像，但在白名单里 → 绝不出现在名单
        ("v1", "vip_user", "monthly", "refunded", "datetime('now','-2 days')", "datetime('now','-2 days','+40 minutes')"),
        ("v2", "vip_user", "monthly", "refunded", "datetime('now','-10 days')", "datetime('now','-10 days','+45 minutes')"),
    ]
    for no, u, pt, st, paid, ref in rows:
        _c.execute(
            "INSERT INTO payment_orders (order_no,username,plan_name,plan_type,price,status,paid_at,refunded_at) "
            "VALUES (?,?,?,?,9.90,%s,%s,%s)" % ('"refunded"' if st == "refunded" else '"paid"', paid, ref or "NULL"),
            (no, u, "包月", pt))
    _c.commit()
    # 建 users 行，供 get_user_entitlement / 封禁落库
    for u in ["moli123535", "normal_user", "quick_abuser", "vip_user"]:
        _c.execute("INSERT INTO users (username) VALUES (?)", (u,))
    _c.commit()
_c.close()

print("database 来源：", "HEAD（本次改动前）" if PRE else database.__file__)

RED = 0
LINES = []


def check(label, got, want):
    global RED
    if got == want:
        print("  [OK] %s" % label)
    else:
        RED += 1
        LINES.append(label)
        print("  [FAIL] %s  期望=%r 实得=%r" % (label, want, got))


if PRE and not hasattr(db, "get_risk_users"):
    print("  [RED(预期内)] get_risk_users 在修复前不存在 → 判别成立")
    print("\n风控探针：预期红 1 条，实际红 1 条（函数缺失）")
    sys.exit(0)

cfg, users = db.get_risk_users()
by = {u["username"]: u for u in users}

print("== 名单成员 ==")
check("moli 进名单", "moli123535" in by, True)
check("normal_user 不误伤", "normal_user" in by, False)
check("quick_abuser 进名单", "quick_abuser" in by, True)
check("vip_user 白名单不出", "vip_user" in by, False)

print("== moli 计数与命中 ==")
if "moli123535" in by:
    m = by["moli123535"]
    check("moli 历史退款单=3", m["refunded"], 3)
    check("moli 近30天退款=2", m["refunds_recent"], 2)
    check("moli 短时退款(全量)=2", m["quick_refunds"], 2)  # m2(52分钟)+m3(30分钟)
    check("moli 命中退款次数规则", any("天内退款" in h for h in m["hits"]), True)
    check("moli 命中退款率规则", any("退款率" in h for h in m["hits"]), True)
    check("moli 命中短时退款规则", any("分钟内退款" in h for h in m["hits"]), True)
else:
    check("moli 命中详情", "缺席", "在场")

print("== quick_abuser 命中 ==")
if "quick_abuser" in by:
    q = by["quick_abuser"]
    check("quick_abuser 短时退款=2", q["quick_refunds"], 2)
    check("quick_abuser 命中短时退款规则", any("分钟内退款" in h for h in q["hits"]), True)
    check("quick_abuser 近30天退款=0", q["refunds_recent"], 0)
else:
    check("quick_abuser 命中详情", "缺席", "在场")

print("== 封禁落库 ==")
db.set_user_admin_fields("moli123535", is_banned=1, ban_reason="风控：退款次数")
cfg2, users2 = db.get_risk_users()
m2 = {u["username"]: u for u in users2}.get("moli123535")
check("封禁后仍在名单", m2 is not None, True)
check("封禁后状态=已封", (m2 or {}).get("is_banned"), True)
db.set_user_admin_fields("moli123535", is_banned=0, ban_reason="")
m3 = {u["username"]: u for u in db.get_risk_users()[1]}.get("moli123535")
check("解封后状态=风险", (m3 or {}).get("is_banned"), False)

if RED:
    print("\n风控探针：%d 条红" % RED)
    for l in LINES:
        print("   -", l)
    sys.exit(1)
print("\n风控探针：全绿（%s）" % ("pre" if PRE else "post"))
