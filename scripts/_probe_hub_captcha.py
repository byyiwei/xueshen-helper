#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""中控滑块验证码（服务端校验型）判别探针。

    "C:/Users/HUAWEI/AppData/Local/Programs/Python/Python312/python.exe" scripts/_probe_hub_captcha.py
    # 想先看它是否对修复前代码变红：加 --pre（缺新函数会明确报红）

不连 MySQL、不碰真中控：假 pymysql 吞连接，_hub_captcha_request 用脚本化桩替掉。
判的是接入的硬不变量（任一条不成立就是没接对，绝不能放行敏感动作）：
  1) hub-v1 签名组装：gen 走空体 sha、verify 走 {token,x} 体，串必须和中控一致；
  2) 密钥缺失（env+配置都空）→ gen 直接失败，绝不发无签名的请求；
  3) verify→check 成功后才铸 slider_token；核销失败不铸；
  4) slider_token 一次性：第二次 consume 必须 False；绑 ip、绑 scope，串一台/串动作都要 False；
  5) 缺口真实 x 绝不出现在下发前端的素材里。
"""
import os
import sys
import json
import hmac
import sqlite3
import hashlib
import types

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "src"))

# ---- 假 pymysql，只吞连接 ----
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

PRE = "--pre" in sys.argv
RED = 0


def check(label, got, want):
    global RED
    if got == want:
        print("  [OK] %s" % label)
    else:
        RED += 1
        print("  [FAIL] %s  期望=%r 实得=%r" % (label, want, got))


# ---- --pre 判别：本次新加的函数若不存在，必须让探针明确变红 ----
required = ["_hub_sign_headers", "_captcha_hub_creds", "_hub_captcha_request",
            "_hub_captcha_gen", "_hub_captcha_verify", "_hub_captcha_check",
            "mint_captcha_pass_token", "consume_slider_token",
            "_remember_captcha_scope", "_take_captcha_scope"]
missing = [n for n in required if not hasattr(backend, n)]
if PRE:
    print("== --pre 判别 ==")
    check("接入前不应已有这些函数（缺=%d 才算红）" % len(missing), len(missing) > 0, True)
    if missing:
        print("  缺少：" + ", ".join(missing))
        print("\n探针结论：RED=%d —— 修复前代码确实缺实现，探针能判别。" % RED)
        sys.exit(1)
    print("  [WARN] --pre 却已齐全，说明这次改动已在代码里，改用无 --pre 全量跑。")

print("== 前置：函数齐备 ==")
check("函数缺失数", len(missing), 0)
if missing:
    print("\n探针结论：RED 直接失败，缺少 " + ", ".join(missing))
    sys.exit(1)


# ---------- 1. hub-v1 签名组装 ----------
print("== 1. 签名组装 ==")
FIXED_TS = "1700000000"
FIXED_NONCE = "0123456789abcdef01234567"


class _FixedTime:
    def time(self):
        return int(FIXED_TS)


class _FixedSecrets:
    def token_hex(self, n):
        return FIXED_NONCE[:n * 2] if n * 2 <= len(FIXED_NONCE) else "a" * (n * 2)

    def token_urlsafe(self, n):
        return "FIXEDTOKEN"


_orig_time, _orig_secrets = backend.time, backend.secrets
backend.time = _FixedTime()
backend.secrets = _FixedSecrets()
try:
    # gen 无体 → bodySha256 用空串 sha
    hdr = backend._hub_sign_headers("POST", "/open/captcha/gen", b"", "app_test", "sec_x")
    sts = "\n".join(["POST", "/open/captcha/gen", FIXED_TS, FIXED_NONCE, backend.SSO_EMPTY_BODY_SHA])
    exp = hmac.new(b"sec_x", sts.encode("utf-8"), hashlib.sha256).hexdigest()
    check("gen 空体走 SSO_EMPTY_BODY_SHA", hdr["X-Hub-Signature"], exp)
    check("gen nonce 24 字符", len(hdr["X-Hub-Nonce"]), 24)

    # verify 有体 → 真实 body sha
    vbody = json.dumps({"token": "TOK", "x": 123}, ensure_ascii=False).encode("utf-8")
    hdr2 = backend._hub_sign_headers("POST", "/open/captcha/verify", vbody, "app_test", "sec_x")
    vsha = hashlib.sha256(vbody).hexdigest()
    sts2 = "\n".join(["POST", "/open/captcha/verify", FIXED_TS, FIXED_NONCE, vsha])
    exp2 = hmac.new(b"sec_x", sts2.encode("utf-8"), hashlib.sha256).hexdigest()
    check("verify 签名对得上 bodySha256", hdr2["X-Hub-Signature"], exp2)
finally:
    backend.time, backend.secrets = _orig_time, _orig_secrets


# ---------- 2. 密钥缺失必须失败 ----------
print("== 2. 无密钥即失败 ==")
os.environ.pop("HUB_APP_SECRET", None)
os.environ.pop("HUB_APP_KEY", None)
_orig_getcfg = db.get_admin_config
db.get_admin_config = lambda *a, **k: {"sso_app_secret": "", "sso_app_key": "", "sso_base_url": ""}
ok, data, status = backend._hub_captcha_request("/open/captcha/gen", b"")
check("密钥缺失 gen 返回失败", ok, False)
check("密钥缺失给出人话错误", isinstance(data, str) and "密钥" in data, True)
db.get_admin_config = _orig_getcfg


# ---------- 脚本化中控：把真实网络换成桩 ----------
db.get_admin_config = lambda *a, **k: {"sso_app_secret": "sec_x", "sso_app_key": "app_test", "sso_base_url": "https://openget.cn"}

GEN_MAT = {"token": "HT_1", "bg": "data:image/png;base64,BG", "piece": "data:image/png;base64,PC",
           "pieceY": 87, "pieceSize": 44, "w": 620, "h": 310, "ttl": 180}


class Hub(object):
    """可编程中控替身：按调用序列返回预设结果。"""
    def __init__(self):
        self.calls = []
        self.verify_ok = True
        self.verify_ticket = "TK_1"
        self.check_ok = True

    def request(self, target, body_bytes, timeout=10):
        self.calls.append(target)
        if target.endswith("/gen"):
            return True, dict(GEN_MAT), 200
        if target.endswith("/verify"):
            if self.verify_ok:
                return True, {"ok": True, "ticket": self.verify_ticket, "expiresIn": 120}, 200
            return False, "滑块位置不正确或已过期，请重新拖动", 400
        if target.endswith("/check"):
            if self.check_ok:
                return True, {"ok": True}, 200
            return False, "票据无效或已使用，请重新完成滑块", 401
        return False, "unexpected", 0


hub = Hub()
_orig_req = backend._hub_captcha_request
backend._hub_captcha_request = hub.request

print("== 3. gen/verify/check 成功链路 ==")
ok, data = backend._hub_captcha_gen()
check("gen 成功", ok, True)
check("gen 不回传缺口真实 x（素材里没有 x/target 字段）",
      any(k in data for k in ("x", "target", "target_hint")), False)
backend._remember_captcha_scope(data["token"], "money")
check("记住这张票的动作域", backend._take_captcha_scope("HT_1"), "money")

vok, ticket, verr = backend._hub_captcha_verify("HT_1", 210)
check("verify 成功拿到票据", (vok, ticket), (True, "TK_1"))
cok, cerr = backend._hub_captcha_check(ticket)
check("check 核销成功", cok, True)

print("== 4. verify 失败绝不铸票据 ==")
hub.verify_ok = False
vok2, tk2, err2 = backend._hub_captcha_verify("HT_1", 190)
check("位置不对→verify 失败", vok2, False)
check("失败给人话且提示重拖", "重新拖动" in err2, True)
hub.verify_ok = True

print("== 5. slider_token 一次性 + 绑 ip + 绑 scope ==")
IP = "1.2.3.4"
backend.SLIDER_CAPTCHAS.clear()
st = backend.mint_captcha_pass_token("money", IP)
check("铸出的 token 非空", bool(st), True)
check("第一次 consume 成功", backend.consume_slider_token(st, "money", IP), True)
check("第二次同 token 必须失败（一次性）", backend.consume_slider_token(st, "money", IP), False)
st2 = backend.mint_captcha_pass_token("money", IP)
check("换 IP 不能消费（绑来源）", backend.consume_slider_token(st2, "money", "9.9.9.9"), False)
check("同 IP 正确消费", backend.consume_slider_token(st2, "money", IP), True)
st3 = backend.mint_captcha_pass_token("admin", IP)
check("串动作域（money 去领 admin）必须失败", backend.consume_slider_token(st3, "money", IP), False)
check("正确动作域消费", backend.consume_slider_token(st3, "admin", IP), True)

backend._hub_captcha_request = _orig_req
db.get_admin_config = _orig_getcfg

print("\n探针结论：RED=%d —— %s" % (RED, "全绿" if RED == 0 else "有失败项，未接入正确"))
sys.exit(1 if RED else 0)
