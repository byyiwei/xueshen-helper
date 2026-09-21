#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""「一卷一报」后端链路离线探针：脚本上报的原始小结 → sanitize → 落库 → 后台聚合。

    "C:/.../Python312/python.exe" scripts/_probe_answer_summary_stats.py
    "C:/.../Python312/python.exe" scripts/_probe_answer_summary_stats.py --pre

不连 MySQL：假 pymysql 吞掉建表，再把连接换成内存 SQLite，跑的是 backend/database 原文里的 SQL。
判的是口径对不对（按题量加权、脏数据剔掉、卡点拆得开），不是有没有这个函数。
"""
import copy
import glob
import json
import os
import shutil
import sqlite3
import subprocess
import sys
import tempfile
import types

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "src"))

PRE = "--pre" in sys.argv
if PRE:
    _tmp = os.path.join(tempfile.gettempdir(), "xs_probe_pre_src")
    shutil.rmtree(_tmp, ignore_errors=True)
    os.makedirs(_tmp)
    for _p in glob.glob(os.path.join(ROOT, "src", "*.py")):
        shutil.copy2(_p, _tmp)
    _raw = subprocess.run(["git", "show", "HEAD:src/backend.py"], cwd=ROOT, capture_output=True).stdout
    if not _raw:
        raise SystemExit("git show HEAD:src/backend.py 取不到内容")
    with open(os.path.join(_tmp, "backend.py"), "wb") as _f:
        _f.write(_raw)
    sys.path.insert(0, _tmp)

# database.py 末尾有模块级 db = Database()，__init__ 立刻建表 → 先吞掉 pymysql
fake = types.ModuleType("pymysql")
fake.err = types.ModuleType("pymysql.err")


class _FakeCur:
    lastrowid = 0
    rowcount = 0

    def execute(self, *a, **k):
        return self

    def executemany(self, *a, **k):
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
sys.modules["pymysql"] = fake
sys.modules["pymysql.cursors"] = fake.cursors

import database  # noqa: E402
import backend  # noqa: E402

assert backend.db is database.db, "backend 没用上被探针接管的 database"

mem = sqlite3.connect(":memory:")
mem.row_factory = sqlite3.Row
mem.executescript("""
CREATE TABLE users (
  username TEXT PRIMARY KEY, channel TEXT, channel_ref TEXT);
CREATE TABLE script_event_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, event_type TEXT, level TEXT,
  message TEXT, page_url TEXT, course_id TEXT, task_id TEXT, client_ip TEXT,
  user_agent TEXT, extra_json TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
INSERT INTO users (username, channel, channel_ref) VALUES
  ('alice', NULL, NULL), ('boss', 'distributor', 'FX001');
""")


class SqliteCursor(object):
    def __init__(self, raw):
        self.raw = raw

    @property
    def rowcount(self):
        return self.raw.rowcount

    def execute(self, sql, params=()):
        self.raw.execute(sql.replace("%s", "?"), params)

    def fetchone(self):
        return self.raw.fetchone()

    def fetchall(self):
        return self.raw.fetchall()


class SqliteConn(object):
    def cursor(self):
        return SqliteCursor(mem.cursor())

    def commit(self):
        mem.commit()

    def close(self):
        pass


database.db._new_mysql_conn = lambda: SqliteConn()

print("backend 来源：", "HEAD（本次改动前，预期出现红条）" if PRE else backend.__file__)

RED = "\033[31mRED\033[0m"
red = 0
fails = []


def check(label, got, want):
    global red
    ok = got == want
    if not ok:
        red += 1
        fails.append(label)
    print(f"  [{'RED   ' if not ok else 'GREEN '}] {label}\n          得到={got!r}\n          期望={want!r}")


def summary(platform, total, filled, src, unanswered, threshold=80, version="5.3.7"):
    """拼一条和 scripts/xueshen-gf.js 的 buildAnswerSummary 同形状的上报。"""
    return {
        "event_type": "answer_summary", "level": "info", "message": "", "page_url": "https://ananas.chaoxing.com/exam",
        "extra": {
            "platform": platform, "total": total, "filled": filled, "unfilled": total - filled,
            "src": src, "unanswered": unanswered,
            "accuracy": round(filled * 100.0 / max(total, 1), 1), "threshold": threshold, "score": None,
            "time": "2026-09-21 10:00:00", "script_version": version
        }
    }


U = lambda t, c, r, title, h: {"type": t, "code": c, "reason": r, "title": title, "hash": h}

# ---- 三场：10 题填 9、1 题填 0、9 题填 4；外加两条脏数据 ----
PAPERS = [
    ("alice", summary("cx-zy", 10, 9, {"bank": 5, "cache": 2, "ai": 2, "unknown": 0},
                      [U("1", 0, "选项未渲染", "多选：下列说法正确的有", "h-multi")], 80)),
    ("boss", summary("zhs-h5", 1, 0, {"bank": 0, "cache": 0, "ai": 0, "unknown": 0},
                     [U("11", -1, "该题型暂不支持", "把下列国家与其首都连起来", "h-line")], 0)),
    ("alice", summary("olearn", 9, 4, {"bank": 1, "cache": 0, "ai": 3, "unknown": 0}, [
        U("1", -1004, "今日额度已用完", "T1", "h-stuck"),
        U("1", -1004, "今日额度已用完", "T1", "h-stuck"),
        U("1", -1004, "题库没有该题", "T2", "h-t2"),
        U("0", 10003, "HTTP 502", "T3", "h-t3"),
        U("2", 0, "填空没写进去", "T4", "h-stuck"),
    ], 75)),
    ("alice", summary("cx-ks", 5, 7, {}, [])),          # 填上的比总数还多 → 该丢
    ("alice", summary("cx-ks", 0, 0, {}, [])),          # 零题 → 该丢
    ("alice", {"event_type": "answer_summary", "extra": "not-json"},),   # extra 不是对象 → 该丢
]

print("\n" + "=" * 78 + "\n1) sanitize：脏数据必须进不了统计\n" + "=" * 78)
kept = []
if not hasattr(backend, "sanitize_answer_summary"):
    check("HEAD 里有 sanitize_answer_summary（本次要加的入库前清洗，预期红）", False, True)
else:
    for username, entry in PAPERS:
        clean = backend.sanitize_answer_summary(copy.deepcopy(entry)) if isinstance(entry, dict) and "extra" in entry else None
        if clean is None:
            print(f"  丢弃：{json.dumps(entry, ensure_ascii=False)[:70]}")
        else:
            clean["username"] = username
            kept.append(clean)
    check("6 条里只留下 3 条能算的", len(kept), 3)
    check("message 由后端重拼（不信脚本传来的文案）",
          kept[0]["message"], "[答题小结] cx-zy 共10题 填上9题 题库5 缓存2 AI2 未知0")
    check("sanitize 保留 code/reason/title，排查才拆得开「点不上」和「没取到答案」",
          sorted(kept[2]["extra"]["unanswered"][0].keys()), ["code", "hash", "reason", "title", "type"])

print("\n" + "=" * 78 + "\n2) 落库 + 聚合：/admin/answer-stats 的数怎么来的\n" + "=" * 78)
if not hasattr(backend, "get_admin_answer_stats"):
    check("HEAD 里有 get_admin_answer_stats（本次要加的聚合接口，预期红）", False, True)
else:
    days = ["2026-09-21 10:00:00", "2026-09-21 11:00:00", "2026-09-20 09:00:00"]
    for idx, row in enumerate(kept):
        db_rows = backend.db.insert_script_event_logs([row], username=row["username"], client_ip="1.2.3.4", user_agent="probe")
        mem.execute("UPDATE script_event_logs SET created_at=? WHERE id=?", (days[idx % 3], idx + 1))
    # 一条区间外的（8 月）和一条绕过 sanitize 直接塞进来的脏行
    mem.execute("INSERT INTO script_event_logs (username,event_type,extra_json,created_at) VALUES (?,?,?,?)",
                ("alice", "answer_summary", json.dumps({"platform": "cx-zy", "total": 50, "filled": 50, "src": {}}), "2026-08-01 08:00:00"))
    mem.execute("INSERT INTO script_event_logs (username,event_type,extra_json,created_at) VALUES (?,?,?,?)",
                ("alice", "answer_summary", json.dumps({"platform": "cx-zy", "total": 5, "filled": 9, "src": {}}), "2026-09-21 12:00:00"))
    mem.commit()
    check("落库条数与 sanitize 通过数一致", mem.execute("SELECT COUNT(*) c FROM script_event_logs WHERE event_type='answer_summary'").fetchone()["c"], 5)

    backend.ANSWER_STATS_CACHE["data"] = None
    st = backend.get_admin_answer_stats("2026-09-15", "2026-09-21")
    c = st["cards"]
    check("场次：区间内 3 场（8 月那条和 filled>total 的脏行都不算）", c["sessions"], 3)
    check("题目数按场累加", c["questions"], 20)
    check("填上/没填上", (c["filled"], c["unfilled"]), (13, 7))
    check("填充率按题量加权＝13/20，不是三场均值（90/0/44.4 平均会是 44.8）", c["fill_rate"], 65.0)
    check("题库命中率同样按题量加权", c["bank_rate"], 30.0)
    check("缓存/模型占比", (c["cache_rate"], c["ai_rate"]), (10.0, 25.0))
    check("分数采不到：cards 里根本没有 score 这一项，界面就不会拿它当正确率",
          "score" in c, False)
    check("score_note 明说这不是判对率", "判对率" in st["score_note"], True)

    codes = {b["code"]: b for b in st["block_codes"]}
    check("卡点按状态码分类齐全（0/-1/-1004/10003）", sorted(codes.keys()), [-1004, -1, 0, 10003])
    check("-1（题型不支持）也算卡点，否则没填上的 7 题只数得出 6 题", codes.get(-1, {}).get("count"), 1)
    check("-1 有人话名字，不是「状态码 -1」", codes.get(-1, {}).get("name"), "该题型脚本还不支持")
    check("-1004 三条里最多的一条原因写进报表（额度用尽 vs 题库没收录分得开）",
          (codes[-1004]["count"], codes[-1004]["reason"]), (3, "今日额度已用完"))
    check("卡点原因按次数倒序，最多的排第一", st["block_codes"][0]["code"], -1004)

    hashes = {h["hash"]: h for h in st["block_hashes"]}
    check("同一指纹反复卡：h-stuck 计 3 次排第一", (st["block_hashes"][0]["hash"], st["block_hashes"][0]["count"]), ("h-stuck", 3))
    check("反复卡的题带题干片段", hashes["h-stuck"]["title"], "T1")

    types_ = {t["type"]: t for t in st["block_types"]}
    check("卡住的题型按原始 type 归类，且带人话名字", ("1" in types_, types_.get("1", {}).get("name")), (True, "多选题"))
    check("题型计数：多选题 4 次（三场里的 1 类题）", types_.get("1", {}).get("count"), 4)

    chans = {x["channel"]: x for x in st["channels"]}
    check("渠道分开：代理商 boss 那一场归代理商 FX001", sorted(chans.keys()), ["代理商 FX001", "官方直营"])
    check("官方直营按题量 19 题、代理商 1 题", (chans["官方直营"]["questions"], chans["代理商 FX001"]["questions"]), (19, 1))

    plat = {p["platform"]: p for p in st["platforms"]}
    check("平台按填充率从低到高排（表头说「最低就先修哪套」，0% 的必须在第一行）",
          [(p["platform"], p["fill_rate"]) for p in st["platforms"]],
          [("zhs-h5", 0.0), ("olearn", 44.4), ("cx-zy", 90.0)])
    check("每个平台各算自己的填充率", plat["zhs-h5"]["fill_rate"], 0.0)
    check("阈值只取上报过的平台", (plat["cx-zy"]["threshold"], plat["zhs-h5"]["threshold"]), (80.0, 0))

    trend = {t["day"]: t for t in st["trend"]}
    check("趋势补齐区间内每一天（7 天，没数据的日子是 0 而不是缺格）", len(st["trend"]), 7)
    check("2026-09-21 两场共 11 题填 9", (trend["2026-09-21"]["sessions"], trend["2026-09-21"]["questions"], trend["2026-09-21"]["filled"]), (2, 11, 9))
    check("8 月那条没混进区间", "2026-08-01" in trend, False)
    check("最近小结按时间倒序（脏行剔掉后不占位）",
          [(r["username"], r["platform"]) for r in st["recent"]],
          [("boss", "zhs-h5"), ("alice", "cx-zy"), ("alice", "olearn")])
    check("小结里直接列出没填上的题型", {r["platform"]: r["unfilled_types"] for r in st["recent"]}.get("olearn"),
          ["多选题", "多选题", "多选题", "单选题", "填空题"])
    check("小结带脚本版本，排查时能区分是哪一版发的", st["recent"][0]["script_version"], "5.3.7")

    backend.ANSWER_STATS_CACHE["data"] = None
    one_day = backend.get_admin_answer_stats("2026-09-21", "2026-09-21")
    check("单日区间只算当天（2 场 11 题）", (one_day["cards"]["sessions"], one_day["cards"]["questions"]), (2, 11))
    check("结果带缓存键，同参数二次调用不重算",
          backend.get_admin_answer_stats("2026-09-21", "2026-09-21") is one_day, True)

print("\n" + "=" * 78 + f"\n红条数：{red}" + ("\n  → " + " | ".join(fails) if fails else "\n全部通过") + "\n" + "=" * 78)
sys.exit(1 if red else 0)
