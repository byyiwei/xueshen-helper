#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""中控邮件 / 模型网关线上验收（在服务器执行，密钥绝不打印）。

    set -a; eval "$(systemctl show xs-backend -p Environment | sed 's/^Environment=//')"; set +a
    python3 acceptance_hub_mail_model.py [收件邮箱] [模型名]

只读、只发：不翻生产开关、不改任何已有配置。
覆盖验收项：真实发信、非法收件人 400、去掉服务端密钥必失败、发信流水、真实对话、未登记模型 404。
"""
import os
import sys
import json
import time

SRC = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "src")
sys.path.insert(0, SRC)

import backend  # noqa: E402
import database  # noqa: E402

TO = (sys.argv[1] if len(sys.argv) > 1 else "").strip()
MODEL = (sys.argv[2] if len(sys.argv) > 2 else "deepseek-flash").strip()
FAIL = []


def step(label, cond, detail=""):
    print("%s %s%s" % ("[OK]  " if cond else "[FAIL]", label,
                       ("  → " + str(detail)[:300]) if detail else ""))
    if not cond:
        FAIL.append(label)


def mask(secret):
    return "<已设置, 长度 %d, 不打印>" % len(secret) if secret else "<未设置>"


app_key, app_secret, base_url = backend._captcha_hub_creds()
ENV_SECRET = (os.environ.get("HUB_APP_SECRET") or "").strip()
print("== 前置 ==")
print("  base_url=%s app_key=%s" % (base_url, app_key))
print("  服务端密钥可用：%s" % mask(app_secret))
print("  其中来自环境变量 HUB_APP_SECRET：%s" % mask(ENV_SECRET))
step("中控密钥可从服务端取到", bool(app_secret),
     "若为空：请设置 HUB_APP_SECRET，或在后台「系统配置→单点登录」填 App Secret")
_cfg = database.db.get_admin_config() or {}
step("admin_config 已有 email_hub_enabled / model_hub_enabled 两列",
     "email_hub_enabled" in _cfg and "model_hub_enabled" in _cfg,
     "当前值：email=%s model=%s" % (_cfg.get("email_hub_enabled"), _cfg.get("model_hub_enabled")))
step("生产开关保持关闭（本次只验收，不切流量）",
     not _cfg.get("email_hub_enabled") and not _cfg.get("model_hub_enabled"),
     "email=%s model=%s" % (_cfg.get("email_hub_enabled"), _cfg.get("model_hub_enabled")))
if not ENV_SECRET:
    print("  [提示] 服务端密钥当前来自「系统配置→单点登录」的库配置，env HUB_APP_SECRET 未设置")
if not app_secret:
    print("\n无密钥，后续实调无法进行。")
    sys.exit(1)

# ---------- 1. 真实发信 ----------
print("\n== 1. 中控真实发信 ==")
if TO:
    code = "%06d" % (int(time.time()) % 1000000)
    html = ('<p>这是一封「学神助手」的接入验收邮件，经中控统一出口 <code>/open/mail/send</code> 投递，'
            '发件人由中控出口决定。</p>'
            '<p>本次验收码：<b style="font-size:22px">%s</b></p>'
            '<p>应用侧生成时间：%s</p>' % (code, time.strftime("%Y-%m-%d %H:%M:%S")))
    ok, err = backend.hub_send_mail(TO, "【学神助手】中控邮件出口验收 " + code, html)
    step("hub_send_mail 到 %s 返回成功（请查收，确认发件人为中控出口）" % TO, ok, err)
else:
    print("  [SKIP] 未提供收件邮箱，跳过实发")

# ---------- 2. 非法收件人 ----------
print("\n== 2. 非法收件人 → 必须拒（400 语义） ==")
ok, err = backend.hub_send_mail("this-is-not-an-email", "验收负向用例", "<p>x</p>")
step("无 @ 的收件人被拒", not ok and "收件人邮箱格式不对" in str(err), err)
ok, err = backend.hub_send_mail("a@b", "验收负向用例", "<p>x</p>")
step("残缺邮箱同样被拒", not ok, err)

# ---------- 3. 去掉服务端密钥必须失败 ----------
print("\n== 3. 去掉服务端密钥再调，必须失败（证明密钥只从服务端读） ==")
orig_cfg = database.db.get_admin_config


def _no_secret_cfg(*a, **k):
    return {"sso_app_secret": "", "sso_app_key": app_key, "sso_base_url": base_url,
            "email_hub_enabled": 1, "model_hub_enabled": 1}


database.db.get_admin_config = _no_secret_cfg
os.environ.pop("HUB_APP_SECRET", None)
_t_nokey = time.time()
ok, err = backend.hub_send_mail("no-secret-check@example.com", "无密钥必须失败", "<p>x</p>")
step("无密钥时发信失败", not ok, err)
step("无密钥属配置错误：不当 SMTP 故障等 30 秒", time.time() - _t_nokey < 5,
     "耗时 %.1fs" % (time.time() - _t_nokey))
ok, err = backend.hub_mail_records()
step("无密钥时查流水失败", not ok, err)
ans, cerr, _t = backend.do_hub_chat([{"role": "user", "content": "回复两个字：你好"}], MODEL)
step("无密钥时模型调用失败", ans is None, cerr)
step("失败信息点名 HUB_APP_SECRET（可据此排查）",
     "HUB_APP_SECRET" in str(err) and "HUB_APP_SECRET" in str(cerr))

# 只剩服务端库配置（无 env）时应当可用 —— 说明「env 优先、库兜底」的读取顺序成立
database.db.get_admin_config = lambda *a, **k: {"sso_app_secret": app_secret,
                                                "sso_app_key": app_key, "sso_base_url": base_url}
ok, err = backend.hub_mail_records()
step("无 env、只有服务端库配置时可用", ok, err if not ok else "records 正常")
if ENV_SECRET:
    os.environ["HUB_APP_SECRET"] = ENV_SECRET
database.db.get_admin_config = orig_cfg

# ---------- 4. 发信流水 ----------
print("\n== 4. 发信流水（GET 的 rawTarget 含 ?limit=20） ==")
ok, items = backend.hub_mail_records()
step("records 查询成功", ok, items if not ok else "")
if ok:
    print("  最近 %d 条：" % len(items))
    for it in items[:5]:
        print("   -", json.dumps(it, ensure_ascii=False)[:220])

# ---------- 5. 模型网关 ----------
print("\n== 5. 中控模型网关 ==")
t0 = time.time()
ans, err, tok = backend.do_hub_chat([{"role": "user", "content": "只回复四个字：接入成功"}], MODEL)
print("  耗时 %.1fs" % (time.time() - t0))
step("模型 %s 拿到回复" % MODEL, bool(ans), err or ("%s / tokens=%s" % (str(ans)[:60], tok)))
ans2, err2, _ = backend.do_hub_chat([{"role": "user", "content": "hi"}], "no-such-model-xyz")
step("未登记模型名 → 404 / 路由问题", ans2 is None and ("404" in str(err2) or "路由" in str(err2)), err2)
ans3, err3, _ = backend.do_hub_chat([{"role": "user", "content": "只回复两个字：你好"}], "auto")
step("model=auto 由中控自动挑模型", bool(ans3), err3 or str(ans3)[:40])

print("\n== 结论 ==")
print("FAIL=%d %s" % (len(FAIL), "全部通过" if not FAIL else "未通过：" + "; ".join(FAIL)))
sys.exit(1 if FAIL else 0)
