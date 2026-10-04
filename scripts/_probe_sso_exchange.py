#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""中控单点登录（Hub SSO）判别探针。

    "C:/Users/HUAWEI/AppData/Local/Programs/Python/Python312/python.exe" scripts/_probe_sso_exchange.py

不连 MySQL：假 pymysql 吞建表，连接换成临时 SQLite。判的是登录门的不变量：
缺票必须 400、未启用必须 404、兑换失败必须 401（绝不静默放行）、viewer 必须 403、
super 才落已登录会话、且兑换出的身份（adminId）绝不回传浏览器、签名串组装必须和中控一致。
"""
import os
import re
import sys
import json
import hmac
import sqlite3
import hashlib
import tempfile
import types

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "src"))

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
import backend  # noqa: E402

db = database.db

DB_PATH = os.path.join(tempfile.gettempdir(), "xs_probe_sso.sqlite3")
if os.path.exists(DB_PATH):
    os.remove(DB_PATH)


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
        self.raw.execute(sql.replace("%s", "?"), params)

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
  id INTEGER PRIMARY KEY, username TEXT DEFAULT 'admin',
  sso_enabled INTEGER DEFAULT 0, sso_app_key TEXT DEFAULT '',
  sso_base_url TEXT DEFAULT '', sso_app_secret TEXT DEFAULT '');
INSERT INTO admin_config (id, sso_enabled, sso_app_key, sso_base_url, sso_app_secret)
VALUES (1, 1, 'app_test', 'https://openget.cn', 'sec_abcdef123456');
""")
    _c.commit()
_c.close()


def set_cfg(**kw):
    cols = ", ".join("%s=?" % k for k in kw)
    db.execute("UPDATE admin_config SET %s WHERE id=1" % cols, tuple(kw.values()))


RED = 0


def check(label, got, want):
    global RED
    if got == want:
        print("  [OK] %s" % label)
    else:
        RED += 1
        print("  [FAIL] %s  期望=%r 实得=%r" % (label, want, got))


# ---------- 1. hub-v1 签名组装 ----------
print("== 签名组装 ==")
FIXED_TS = "1700000000"
FIXED_NONCE = "0123456789abcdef01234567"  # 24 hex = 12 字节


class _FixedTime:
    def time(self):
        return int(FIXED_TS)


class _FixedSecrets:
    def token_hex(self, n):
        return "0" * (n * 2)

    def token_urlsafe(self, n):
        return "FIXEDTOKEN"


_orig_time, _orig_secrets = backend.time, backend.secrets
backend.time = _FixedTime()
backend.secrets = _FixedSecrets()
try:
    body = json.dumps({"ticket": "TICKET_X"}, ensure_ascii=False).encode("utf-8")
    hdr = backend._hub_sign_headers("POST", "/open/sso/exchange", body, "app_test", "sec_abcdef123456")
    body_sha = hashlib.sha256(body).hexdigest()
    expected_sts = "\n".join(["POST", "/open/sso/exchange", FIXED_TS, hdr["X-Hub-Nonce"], body_sha])
    expected_sig = hmac.new(b"sec_abcdef123456", expected_sts.encode("utf-8"), hashlib.sha256).hexdigest()
    check("nonce 为 12 字节 hex（24 字符）", len(hdr["X-Hub-Nonce"]), 24)
    check("时间戳秒级", hdr["X-Hub-Timestamp"], FIXED_TS)
    check("App Key 透传", hdr["X-Hub-App-Key"], "app_test")
    check("签名匹配 hub-v1 stringToSign", hdr["X-Hub-Signature"], expected_sig)
    # 换一个 nonce，签名必须随之改变（一次一换，不能恒定）
    backend.secrets = _FixedSecrets2 = type("S", (), {"token_hex": staticmethod(lambda n: "f" * (n * 2)), "token_urlsafe": staticmethod(lambda n: "X")})
    hdr2 = backend._hub_sign_headers("POST", "/open/sso/exchange", body, "app_test", "sec_abcdef123456")
    check("换 nonce 签名变化", hdr2["X-Hub-Signature"] != expected_sig, True)
finally:
    backend.time, backend.secrets = _orig_time, _orig_secrets

# 空体固定 sha 常量正确
check("空体 sha256 常量", backend.SSO_EMPTY_BODY_SHA,
      hashlib.sha256(b"").hexdigest())


# ---------- 2. 登录门不变量 ----------
print("== 登录门 ==")


def call_route(query, exchange_result=None):
    """用一个裸 Handler 实例跑 _handle_sso_login，捕获返回码与页面。"""
    h = backend.Handler.__new__(backend.Handler)
    captured = {}

    def _send_text(code, text, ct="text/plain; charset=utf-8"):
        captured["code"] = code
        captured["body"] = text

    h._send_text = _send_text
    orig = backend._hub_sso_exchange
    if exchange_result is not None:
        backend._hub_sso_exchange = lambda ticket: exchange_result
    try:
        from urllib.parse import urlparse
        h._handle_sso_login(urlparse("/admin/sso?" + query))
    finally:
        backend._hub_sso_exchange = orig
    return captured


# 未启用 → 404（不影响密码登录，但这条入口关着就该拒）
set_cfg(sso_enabled=0)
r = call_route("hub_ticket=abc")
check("未启用单点登录被拒(404)", r["code"], 404)
set_cfg(sso_enabled=1)

# 缺 hub_ticket → 400，且绝不尝试兑换
hit = {"n": 0}
orig = backend._hub_sso_exchange
backend._hub_sso_exchange = lambda ticket: (hit.__setitem__("n", hit["n"] + 1) or (True, {}))
try:
    r = call_route("")
finally:
    backend._hub_sso_exchange = orig
check("缺 hub_ticket 返回 400", r["code"], 400)
check("缺票时绝不发起兑换", hit["n"], 0)

# 兑换失败 → 401，绝不静默放行（不是 200）
r = call_route("hub_ticket=used", exchange_result=(False, {"message": "票据已使用"}))
check("兑换失败 401", r["code"], 401)
check("兑换失败绝不发会话(非200)", r["code"] != 200, True)
check("兑换失败页面含人话", "回中控" in r["body"] or "无效" in r["body"], True)

# viewer → 403（本后台单层管理员，只认 super）
r = call_route("hub_ticket=v", exchange_result=(True, {"adminId": 7, "username": "boss", "role": "viewer"}))
check("viewer 角色被拒(403)", r["code"], 403)

# super → 200，落地我方自铸会话，且 adminId 不回传浏览器
r = call_route("hub_ticket=s", exchange_result=(True, {"adminId": 91827364, "username": "boss", "role": "super"}))
check("super 落地(200)", r["code"], 200)
m = re.search(r"ne21_admin_token','([^']+)'", r["body"])
token = m.group(1) if m else ""
check("页面写入 localStorage 令牌", bool(token and token.startswith("adm_")), True)
check("令牌真能作为已登录会话", backend.verify_admin_session(token), True)
check("兑换出的 adminId 不回传浏览器", "91827364" in r["body"], False)
check("兑换出的 username 不回传浏览器", "boss" in r["body"], False)

# bootstrap 令牌格式守卫：伪造非 adm_ 令牌应被拒
bad = backend._sso_bootstrap_page("evil\";alert(1)//")
check("非规范令牌不写 bootstrap", "ne21_admin_token" in bad, False)

print("\n结果：" + ("全部通过 ✅" if RED == 0 else "%d 条失败 ❌" % RED))
sys.exit(1 if RED else 0)
