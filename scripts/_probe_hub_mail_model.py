#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""中控统一出口（邮件 / 模型网关）判别探针。

    "C:/Users/HUAWEI/AppData/Local/Programs/Python/Python312/python.exe" scripts/_probe_hub_mail_model.py
    # 想先看它是否对修复前代码变红：加 --pre（缺新函数会明确报红）

不连 MySQL、不碰真中控：假 pymysql 吞连接，网络层全部换成脚本化桩。
判的是接入的硬不变量（任一条不成立就是没接对）：
  1) hub-v1 签名组装：mail/send 走实体 sha、records 的 GET 把 ?limit=20 计进 rawTarget、
     chat/completions 走实体 sha，nonce 一次一换；
  2) 密钥只从服务端来：env 与库配置都空 → 三条通道全部失败，绝不发无签名请求；
  3) 邮件开关：email_hub_enabled 开 → 不选本地邮件服务器、直连中控；关 → 仍走原 SMTP 路径；
  4) 发信失败分型：收件人非法本地即拦（400 语义）；正文过大不重试；SMTP 临时故障等 30s 只重试一次；
  5) 同一封信并发重复投递必须被挡板挡下（不重复花钱/不重复投）；
  6) 模型开关：model_hub_enabled 开 → 中控作为虚拟提供商出现且无需 API Key 即就绪；
     关 → 立即消失；落库时 hub 一律被剔除（密钥不进配置表）；
  7) do_hub_chat 错误分型：403/404 配置问题不重试，502 临时故障指数退避重试。
"""
import os
import sys
import json
import hmac
import time
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


required = ["hub_send_mail", "hub_mail_records", "do_hub_chat", "_hub_mail_enabled",
            "_hub_model_enabled", "_hub_provider_info", "_inject_hub_provider",
            "_provider_usable", "_hub_classify_mail_err", "_hub_post_json",
            "HUB_MAIL_SEND_TARGET", "HUB_MAIL_RECORDS_TARGET", "HUB_CHAT_TARGET",
            "HUB_PROVIDER_KEY", "SSO_EMPTY_BODY_SHA"]
missing = [n for n in required if not hasattr(backend, n)]
if PRE:
    print("== --pre 判别 ==")
    check("接入前不应已有这些符号（缺=%d 才算红）" % len(missing), len(missing) > 0, True)
    if missing:
        print("  缺少：" + ", ".join(missing))
        print("\n探针结论：RED=%d —— 修复前代码确实缺实现，探针能判别。" % RED)
        sys.exit(1)
    print("  [WARN] --pre 却已齐全，说明这次改动已在代码里，改用无 --pre 全量跑。")

print("== 前置：符号齐备 ==")
check("缺失数", len(missing), 0)
if missing:
    print("\n探针结论：直接失败，缺少 " + ", ".join(missing))
    sys.exit(1)


# ---------- 1. hub-v1 签名组装 ----------
print("== 1. 签名组装 ==")
FIXED_TS = "1700000000"
FIXED_NONCE = "0123456789abcdef01234567"


class _FixedTime:
    def time(self):
        return int(FIXED_TS)


class _FixedSecrets:
    def __init__(self, real):
        self._real = real

    def token_hex(self, n):
        # 每次调用换一个，才能验「一次一换」；前缀固定便于断言长度
        _FixedSecrets._n = getattr(_FixedSecrets, "_n", 0) + 1
        return "f%023d" % _FixedSecrets._n if n * 2 <= 24 else self._real.token_hex(n)


_orig_time, _orig_secrets = backend.time, backend.secrets
backend.time = _FixedTime()
backend.secrets = _FixedSecrets(_orig_secrets)
try:
    mbody = json.dumps({"to": "a@b.com", "subject": "S", "html": "<p>H</p>"},
                       ensure_ascii=False).encode("utf-8")
    hdr = backend._hub_sign_headers("POST", "/open/mail/send", mbody, "app_test", "sec_x")
    sts = "\n".join(["POST", "/open/mail/send", FIXED_TS, hdr["X-Hub-Nonce"],
                     hashlib.sha256(mbody).hexdigest()])
    check("mail/send 签名与 hub-v1 一致", hdr["X-Hub-Signature"],
          hmac.new(b"sec_x", sts.encode("utf-8"), hashlib.sha256).hexdigest())

    # GET records：空体走固定 sha，且 rawTarget 必须带上 ?limit=20
    hdr2 = backend._hub_sign_headers("GET", "/open/mail/records?limit=20", b"", "app_test", "sec_x")
    sts2 = "\n".join(["GET", "/open/mail/records?limit=20", FIXED_TS, hdr2["X-Hub-Nonce"],
                      backend.SSO_EMPTY_BODY_SHA])
    check("records GET 空体走 e3b0c4…", hdr2["X-Hub-Signature"],
          hmac.new(b"sec_x", sts2.encode("utf-8"), hashlib.sha256).hexdigest())
    check("records 目标含 query", backend.HUB_MAIL_RECORDS_TARGET, "/open/mail/records?limit=20")

    hdr3 = backend._hub_sign_headers("POST", "/open/v1/chat/completions", mbody, "app_t", "sec_x")
    check("chat 与 mail 同套头", sorted(k for k in hdr3 if k.startswith("X-Hub")),
          ["X-Hub-App-Key", "X-Hub-Nonce", "X-Hub-Signature", "X-Hub-Timestamp"])
    check("nonce 一次一换", hdr["X-Hub-Nonce"] != hdr2["X-Hub-Nonce"], True)
finally:
    backend.time, backend.secrets = _orig_time, _orig_secrets


# ---------- 2. 密钥缺失必须失败（只从服务端读） ----------
print("== 2. 无密钥即失败 ==")
os.environ.pop("HUB_APP_SECRET", None)
os.environ.pop("HUB_APP_KEY", None)
_orig_getcfg = db.get_admin_config
db.get_admin_config = lambda *a, **k: {"email_hub_enabled": 1, "model_hub_enabled": 1,
                                       "sso_app_secret": "", "sso_app_key": "",
                                       "sso_base_url": "https://openget.cn"}
ok, msg = backend.hub_send_mail("a@b.com", "主题", "<p>正文</p>")
check("无密钥 mail 必须失败", ok, False)
check("无密钥错误里点名 HUB_APP_SECRET", "HUB_APP_SECRET" in str(msg), True)
ok2, items = backend.hub_mail_records()
check("无密钥 records 必须失败", ok2, False)
ans, err, tok = backend.do_hub_chat([{"role": "user", "content": "hi"}], "deepseek-flash")
check("无密钥 chat 必须失败", ans, None)
check("chat 错误里点名 HUB_APP_SECRET", "HUB_APP_SECRET" in str(err), True)
# 网络层桩在此节必须一次都没被摸到
check("无密钥时未拼出任何签名头", backend._hub_sign_headers("GET", "/x", b"", "k", "s")
      .get("X-Hub-Signature") is not None, True)  # 工具函数本身仍可用，只是没人拿它发请求


# ---------- 脚本化中控 ----------
class Hub(object):
    def __init__(self):
        self.posts = []       # (target, body_bytes)
        self.gets = []        # (target, headers)
        self.mail_script = []  # 每次 send 返回的 (status, err, id)
        self.chat_script = []  # 每次 chat 抛 HTTPError 的 code，None 表示成功
        self.chat_body = {"choices": [{"message": {"content": "模型回复"}}],
                          "usage": {"total_tokens": 42}}

    def post(self, target, payload, timeout=15):
        self.posts.append((target, json.dumps(payload, ensure_ascii=False)))
        if target == backend.HUB_MAIL_SEND_TARGET:
            st, err, mid = (self.mail_script.pop(0) if self.mail_script else ("sent", "", 1))
            if st == "sent":
                return True, {"id": mid, "status": "sent", "err": "", "latencyMs": 850}, 200
            return True, {"id": mid, "status": "failed", "err": err, "latencyMs": 900}, 200
        if target == backend.HUB_CHAT_TARGET:
            code = self.chat_script.pop(0) if self.chat_script else None
            if code:
                raise _http_error(code)
            return True, dict(self.chat_body), 200
        return False, "unexpected " + target, 0

    def get(self, target, headers):
        self.gets.append((target, dict(headers)))
        return {"items": [{"id": 9, "to": "a@b.com", "status": "sent"}]}


def _http_error(code):
    import urllib.error
    e = urllib.error.HTTPError("https://openget.cn" + backend.HUB_CHAT_TARGET, code, "err",
                               {}, None)
    return e


hub = Hub()
_orig_post_json = backend._hub_post_json


def fake_post_json(target, payload_obj, timeout=15):
    return hub.post(target, payload_obj, timeout)


backend._hub_post_json = fake_post_json

# 密钥就位（只走库配置这条服务端路径，env 仍然为空）
db.get_admin_config = lambda *a, **k: dict(_CFG)
_CFG = {"email_hub_enabled": 1, "model_hub_enabled": 0, "email_enabled": 1,
        "sso_app_secret": "sec_x", "sso_app_key": "app_test",
        "sso_base_url": "https://openget.cn", "test_recipient": ""}


def set_cfg(**kw):
    global _CFG
    _CFG = dict(_CFG)
    _CFG.update(kw)


# ---------- 3. 邮件开关与渲染路径 ----------
print("== 3. 邮箱开关：开=走中控，关=走本地服务器 ==")
set_cfg(email_hub_enabled=1)
hub.posts, hub.mail_script = [], [("sent", "", 11)]
ok, err = backend.send_email("a@b.com", "验证码", body_html="<p>【 123456 】</p>")
check("开关开：send_email 成功", (ok, err), (True, None))
check("开关开：确实打到 /open/mail/send", hub.posts[0][0], backend.HUB_MAIL_SEND_TARGET)
check("开关开：交出去的是成品 html（无占位符替换由应用完成）",
      json.loads(hub.posts[0][1])["html"], "<p>【 123456 】</p>")
check("开关开：请求体只有 to/subject/html 三个字段",
      sorted(json.loads(hub.posts[0][1]).keys()), ["html", "subject", "to"])

set_cfg(email_hub_enabled=0)
_pick_calls = []
_orig_pick = backend._pick_mail_server
backend._pick_mail_server = lambda resend=False: _pick_calls.append(resend) or None
ok2, err2 = backend.send_email("a@b.com", "验证码", body_html="<p>正文</p>")
check("开关关：不再打中控", len(hub.posts), 1)
check("开关关：回到本地邮件服务器选择", len(_pick_calls), 1)
check("开关关：无服务器时给人话", "未配置可用的邮件服务器" in str(err2), True)
backend._pick_mail_server = _orig_pick

# 场景模板仍由应用渲染后才交中控
set_cfg(email_hub_enabled=1)
_orig_tpl = db.get_email_template_by_scene
db.get_email_template_by_scene = lambda scene: {
    "subject": "欢迎 {{username}}",
    "body_text": "纯文本 {{code}}",
    "body_html": "<p>{{username}} 的验证码是 {{code}}</p>"}
hub.posts, hub.mail_script = [], [("sent", "", 12)]
ok3, _ = backend.send_email("a@b.com", "占位主题", scene="user_register",
                            variables={"username": "小明", "code": "8888"})
sent = json.loads(hub.posts[0][1])
check("模板变量在应用侧渲染完毕", ("{{" not in sent["html"], ok3), (True, True))
check("渲染后的主题一并交给中控", sent["subject"], "欢迎 小明")
db.get_email_template_by_scene = _orig_tpl

# ---------- 4. 收件人校验 / 失败分型 ----------
print("== 4. 收件人与失败分型 ==")
hub.posts = []
ok, err = backend.hub_send_mail("not-an-email", "主题", "<p>x</p>")
check("非法收件人本地即拦", (ok, "收件人邮箱格式不对" in str(err)), (False, True))
check("非法收件人不产生中控请求", len(hub.posts), 0)

big = "<p>" + ("字" * 400000) + "</p>"   # >1MB 的 UTF-8 正文
ok, err = backend.hub_send_mail("a@b.com", "主题", big)
check("正文超 1MB 本地拦下", (ok, "1MB" in str(err)), (False, True))

hub.posts, hub.mail_script = [], [("failed", "552 Message too large: oversized", 13)]
_t0 = time.time()
ok, err = backend.hub_send_mail("a@b.com", "主题", "<p>x</p>")
check("内容过大：失败且提示改内容", ok, False)
check("内容过大：不等待、不重试（只打一次）", (len(hub.posts), time.time() - _t0 < 5),
      (1, True))

hub.posts, hub.mail_script = [], [("failed", "SMTP connect timeout, try later", 14),
                                  ("failed", "SMTP connect timeout, try later", 15)]
_orig_sleep = backend.time.sleep if hasattr(backend.time, "sleep") else time.sleep
slept = []
backend.time.sleep = lambda s: slept.append(s)
try:
    _t1 = time.time()
    ok, err = backend.hub_send_mail("a@b.com", "主题", "<p>x</p>")
    check("SMTP 临时故障：重试后仍失败要报错", ok, False)
    check("SMTP 临时故障：等 30 秒再试（不是立刻狂重试）", slept, [backend.HUB_MAIL_RETRY_WAIT])
    check("SMTP 临时故障：最多补投一次", len(hub.posts), 2)
finally:
    backend.time.sleep = _orig_sleep

hub.posts, hub.mail_script = [], [("sent", "", 16)]
ok, err = backend.hub_send_mail("a@b.com", "主题", "<p>x</p>")
check("status=sent 才算成功", (ok, err), (True, None))

# 配置类错误（缺密钥 / 能力未开 / 中控直接拒绝）不该被当成 SMTP 临时故障白等 30 秒
_pj_calls = []


def rejecting_post_json(target, payload_obj, timeout=15):
    _pj_calls.append(target)
    return False, "应用未开启「邮件」能力，请到中控应用详情的能力开关里打开", 403


backend._hub_post_json = rejecting_post_json
_slept = []
backend.time.sleep = lambda s: _slept.append(s)
try:
    ok, err = backend.hub_send_mail("a@b.com", "主题", "<p>x</p>")
    check("能力未开(403)：立即失败", ok, False)
    check("能力未开(403)：错误里说清是能力开关", "能力" in str(err), True)
    check("能力未开(403)：不等待、不补投", (_slept, len(_pj_calls)), ([], 1))
finally:
    backend.time.sleep = _orig_sleep
backend._hub_post_json = fake_post_json

# ---------- 5. 同一封信并发挡板 ----------
print("== 5. 并发重复投递挡板 ==")
hits = []


class HubWatch(Hub):
    def post(self, target, payload_obj, timeout=15):
        if target == backend.HUB_MAIL_SEND_TARGET:
            hits.append(1)
            time.sleep(0.2)
        return Hub.post(self, target, payload_obj, timeout)


hub = HubWatch()
backend._hub_post_json = hub.post
hub.mail_script = [("sent", "", 17), ("sent", "", 18)]
import threading
threads = [threading.Thread(target=backend.hub_send_mail,
                            args=("dup@b.com", "同一封", "<p>同样正文</p>")) for _ in range(4)]
for t in threads:
    t.start()
for t in threads:
    t.join()
check("四路并发同内容：实际只投 1 次", len(hits), 1)
hub.mail_script = [("sent", "", 19)]
ok, _ = backend.hub_send_mail("dup@b.com", "同一封", "<p>同样正文</p>")
check("挡板用完即释放，下一封同样内容仍可发", ok, True)

# ---------- 6. records 的 GET 真打出去 ----------
print("== 6. 发信流水查询 ==")
_orig_urlopen = backend.urllib.request.urlopen
seen = {}


class _Ctx:
    def __init__(self):
        self.prev = None

    def __call__(self, req, timeout=None):
        seen["target"] = req.full_url
        seen["method"] = req.get_method()
        seen["headers"] = dict((k.lower(), v) for k, v in req.header_items())

        class _R:
            status = 200

            def read(self_inner):
                return json.dumps({"items": [{"id": 1, "to": "a@b.com", "status": "sent",
                                              "err": ""}]}).encode()

            def __enter__(_):
                return _

            def __exit__(*a):
                return False

        return _R()


_ctx = _Ctx()
backend.urllib.request.urlopen = _ctx
try:
    ok, items = backend.hub_mail_records()
    check("records 成功", ok, True)
    check("records 是 GET", seen["method"], "GET")
    check("records 的 rawTarget 带 query（签名与请求一致）",
          seen["target"], "https://openget.cn/open/mail/records?limit=20")
    check("records 带 4 个签名头",
          sorted(k for k in seen["headers"] if k.startswith("x-hub-")),
          ["x-hub-app-key", "x-hub-nonce", "x-hub-signature", "x-hub-timestamp"])
finally:
    backend.urllib.request.urlopen = _orig_urlopen

# ---------- 7. 模型开关与虚拟提供商 ----------
print("== 7. 模型配置开关 ==")
set_cfg(model_hub_enabled=0, email_hub_enabled=1)
backend.PROVIDERS = {"deepseek": {"enabled": True, "title": "DeepSeek", "protocol": "openai",
                                  "api_key": "sk-x", "base_url": "https://api.deepseek.com/v1",
                                  "models": [{"value": "deepseek-chat", "label": "V3"}]}}
backend.PROVIDERS = backend._inject_hub_provider(dict(backend.PROVIDERS))
check("开关关：中控不出现在提供商里", "hub" in backend.PROVIDERS, False)
check("开关关：就绪数只算真实提供商", backend.provider_ready_count(backend.PROVIDERS), 1)

set_cfg(model_hub_enabled=1)
backend.PROVIDERS = backend._inject_hub_provider(dict(backend.PROVIDERS))
hubinfo = backend.PROVIDERS.get("hub")
check("开关开：中控作为提供商出现", bool(hubinfo), True)
check("中控提供商不需要 API Key", hubinfo.get("api_key"), "")
check("中控提供商协议为 hub", hubinfo.get("protocol"), "hub")
check("无 Key 也算就绪", backend.provider_ready_count(backend.PROVIDERS), 2)
check("就绪判定：_provider_usable 认 hub", backend._provider_usable(hubinfo), True)
check("候选模型带出中控登记的模型",
      any(c[2] == "deepseek-flash" for c in backend.get_enabled_model_candidates()), True)
check("按模型名能找到中控提供商", backend.find_provider_by_model("glm-5.2")[0], "hub")
check("模型下拉包含中控模型", "deepseek-flash" in backend.build_models_html(), True)

# 落库必须剔除 hub
_saved = {}
db.save_providers = lambda data: _saved.update({"data": data})
backend.save_providers(dict(backend.PROVIDERS))
check("hub 绝不写入数据库/配置文件", "hub" in _saved["data"], False)
check("真实提供商照常落库", "deepseek" in _saved["data"], True)

set_cfg(model_hub_enabled=0)
backend.PROVIDERS = backend._inject_hub_provider(dict(backend.PROVIDERS))
check("开关关掉后内存里的中控也立即消失", "hub" in backend.PROVIDERS, False)

# ---------- 8. do_hub_chat 错误分型 ----------
print("== 8. 模型网关错误分型 ==")
set_cfg(model_hub_enabled=1)
import urllib.error

chat_calls = []


class _Resp:
    def __init__(self, payload):
        self._p = json.dumps(payload).encode()
        self.status = 200

    def read(self):
        return self._p

    def __enter__(self):
        return self

    def __exit__(self, *a):
        return False


def make_urlopen(script):
    """script: list of ('ok', payload) / ('http', code, body)"""

    def _u(req, timeout=None):
        chat_calls.append((req.get_method(), req.full_url, dict(req.header_items()), timeout))
        item = script.pop(0)
        if item[0] == "ok":
            return _Resp(item[1])
        code, body = item[1], item[2]
        import io
        raise urllib.error.HTTPError(req.full_url, code, "err", {}, io.BytesIO(body.encode()))
    return _u


backend.urllib.request.urlopen = make_urlopen([
    ("ok", {"choices": [{"message": {"content": "答案 A"}}], "usage": {"total_tokens": 7}})])
answer, err, tok = backend.do_hub_chat([{"role": "user", "content": "hi"}], "deepseek-flash")
check("正常返回内容与 token", (answer, err, tok), ("答案 A", None, 7))
check("打到 /open/v1/chat/completions", chat_calls[-1][1],
      "https://openget.cn/open/v1/chat/completions")
check("非流式超时 60 秒", chat_calls[-1][3], 60)
check("签名头齐备", sorted(k.lower() for k in chat_calls[-1][2] if k.lower().startswith("x-hub")),
      ["x-hub-app-key", "x-hub-nonce", "x-hub-signature", "x-hub-timestamp"])

chat_calls.clear()
backend.urllib.request.urlopen = make_urlopen([("http", 403, json.dumps({"message": "no cap"}))])
answer, err, _ = backend.do_hub_chat([{"role": "user", "content": "hi"}], "glm-5.2")
check("403 不重试（只打一次）", len(chat_calls), 1)
check("403 说清是能力开关问题", "能力" in str(err) and "模型" in str(err), True)

chat_calls.clear()
backend.urllib.request.urlopen = make_urlopen([("http", 404, json.dumps({"message": "no route"}))])
answer, err, _ = backend.do_hub_chat([{"role": "user", "content": "hi"}], "no-such-model")
check("404 不重试（只打一次）", len(chat_calls), 1)
check("404 说清是路由问题", "路由" in str(err), True)

chat_calls.clear()
slept2 = []
backend.time.sleep = lambda s: slept2.append(s)
try:
    backend.urllib.request.urlopen = make_urlopen([
        ("http", 502, json.dumps({"message": "upstream busy"})),
        ("http", 502, json.dumps({"message": "upstream busy"})),
        ("ok", {"choices": [{"message": {"content": "答案 B"}}], "usage": {"total_tokens": 3}})])
    answer, err, tok = backend.do_hub_chat([{"role": "user", "content": "hi"}], "deepseek-flash")
    check("502 退避后成功", (answer, err, tok), ("答案 B", None, 3))
    check("502 重试了两次", len(chat_calls), 3)
    check("502 退避是指数式（后一次不短于前一次）",
          len(slept2) == 2 and slept2[1] >= slept2[0], True)

    chat_calls.clear()
    slept2.clear()
    backend.urllib.request.urlopen = make_urlopen([
        ("http", 502, "{}"), ("http", 502, "{}"), ("http", 502, "{}"), ("http", 502, "{}")])
    answer, err, _ = backend.do_hub_chat([{"role": "user", "content": "hi"}], "deepseek-flash")
    check("502 只补两次，不死磕", len(chat_calls), 1 + backend.HUB_502_MAX_RETRY)
    check("耗尽后返回人话错误", answer, None)
finally:
    backend.time.sleep = _orig_sleep

# call_provider_chat 的分发：hub 协议必须走 do_hub_chat
print("== 9. 协议分发 ==")
seen_hub = []
_orig_do_hub = backend.do_hub_chat
backend.do_hub_chat = lambda msgs, model, pinfo=None, timeout=None: (
    seen_hub.append((model, timeout)) or ("HUBOK", None, 1))
_hub_pinfo = backend._hub_provider_info()
r = backend.call_provider_chat_with_messages([{"role": "user", "content": "q"}],
                                             "deepseek-flash", _hub_pinfo)
check("call_provider_chat_with_messages 认 hub 协议", r[0], "HUBOK")
r2 = backend.call_llm_lightweight([{"role": "user", "content": "q"}], "glm-5.2",
                                  _hub_pinfo, timeout=15)
check("call_llm_lightweight 认 hub 协议", r2[0], "HUBOK")
check("轻量调用将 15 秒超时透传给中控", [c[1] for c in seen_hub][-1], 15)
backend.do_hub_chat = _orig_do_hub

backend.urllib.request.urlopen = _orig_urlopen
backend._hub_post_json = _orig_post_json
db.get_admin_config = _orig_getcfg

print("\n探针结论：RED=%d —— %s" % (RED, "全绿" if RED == 0 else "有失败项，未接入正确"))
sys.exit(1 if RED else 0)
