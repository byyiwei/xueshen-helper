#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
学神助手 - 自建后端（用户系统 + AI 配置 + 邮箱服务）
MySQL 数据库
管理后台: https://xs.openget.cn/admin
"""

import json
import os
import re
import time
import hashlib
import uuid
import random
import string
import smtplib
import threading
import queue
import base64
import secrets
from concurrent.futures import ThreadPoolExecutor, as_completed
from difflib import SequenceMatcher
from urllib.parse import parse_qs, urlparse, urlencode
from urllib.request import urlopen
from email.mime.text import MIMEText
from email.utils import formataddr
from datetime import datetime, timedelta

from database import db, hash_password, verify_password, is_legacy_password

# ==================== 全局配置 ====================
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ADMIN_HTML_FILE = os.path.join(BASE_DIR, "static", "admin.html")
USER_HTML_FILE = os.path.join(BASE_DIR, "static", "user.html")
USER_SCRIPT_FILE = os.path.join(BASE_DIR, "scripts", "xueshen.js")
XUESHEN_GF_FILE = os.path.join(BASE_DIR, "scripts", "xueshen-gf.js")
XUESHEN_SC_FILE = os.path.join(BASE_DIR, "scripts", "xueshen-sc.js")
INTRO_HTML_FILE = os.path.join(BASE_DIR, "intro", "index.html")
USER_SESSION_FILE = os.path.join(BASE_DIR, "config", "user_session.json")
JWT_SECRET_FILE = os.path.join(BASE_DIR, "config", "jwt_secret.key")
PORT = 8360

# 密码重置 token 临时存储 {token: email}
RESET_TOKENS = {}

# 自动模型失败冷却：404/模型不存在的模型短时间内跳过，避免每题都浪费一次失败调用
MODEL_FAIL_COOLDOWN = {}
MODEL_FAIL_COOLDOWN_SECONDS = 600
# 429 限流冷却：{model_name: expire_timestamp}
MODEL_429_COOLDOWN = {}
MODEL_429_DEFAULT_SECONDS = 60  # 默认冷却60秒
DASHBOARD_CACHE = {"time": 0, "data": None}
DASHBOARD_CACHE_SECONDS = 5
REVOKED_USER_TOKENS = set()
USER_LOGOUT_AFTER = {}
CURRENT_USER_SESSION = {}
POWER_KEEP_AWAKE_ENABLED = False
ADMIN_SESSIONS = {}
ADMIN_SESSION_TTL = 86400
LOGIN_ATTEMPTS = {}
LOGIN_ATTEMPT_WINDOW = 600
LOGIN_MAX_FAILURES = 5
LOGIN_LOCK_SECONDS = 900
SLIDER_CAPTCHAS = {}
SLIDER_CAPTCHA_TTL = 300
SLIDER_TOLERANCE = 20

# 异步日志队列：高并发时请求先返回，日志由后台线程写库
AI_LOG_QUEUE = queue.Queue(maxsize=10000)

def ai_log_worker():
    while True:
        item = AI_LOG_QUEUE.get()
        try:
            db.save_ai_call_log(item)
        except Exception as e:
            print(f"[AI日志错误] {e}", flush=True)
        finally:
            AI_LOG_QUEUE.task_done()

threading.Thread(target=ai_log_worker, daemon=True).start()

def enqueue_ai_log(item):
    try:
        AI_LOG_QUEUE.put_nowait(item)
        DASHBOARD_CACHE["data"] = None
    except queue.Full:
        print("[AI日志队列] 队列已满，丢弃一条日志", flush=True)

def set_system_keep_awake(enabled=True):
    """Windows 系统级防休眠/防息屏。开启后只要后端进程运行，系统会尽量保持唤醒。"""
    global POWER_KEEP_AWAKE_ENABLED
    if os.name != "nt":
        POWER_KEEP_AWAKE_ENABLED = False
        return False, "当前系统不支持系统级防休眠"
    try:
        import ctypes
        ES_CONTINUOUS = 0x80000000
        ES_SYSTEM_REQUIRED = 0x00000001
        ES_DISPLAY_REQUIRED = 0x00000002
        flags = ES_CONTINUOUS | ES_SYSTEM_REQUIRED | ES_DISPLAY_REQUIRED if enabled else ES_CONTINUOUS
        result = ctypes.windll.kernel32.SetThreadExecutionState(flags)
        if result == 0:
            POWER_KEEP_AWAKE_ENABLED = False
            return False, "Windows 电源接口调用失败"
        POWER_KEEP_AWAKE_ENABLED = bool(enabled)
        return True, "系统级防休眠/防息屏已开启" if enabled else "系统级防休眠/防息屏已关闭"
    except Exception as e:
        POWER_KEEP_AWAKE_ENABLED = False
        return False, f"系统级防休眠设置失败: {e}"

def build_user_profile(username):
    ent = db.get_user_entitlement(username)
    if not ent:
        return None
    member_until = ent.get("member_until")
    if isinstance(member_until, datetime):
        member_until = member_until.strftime("%Y-%m-%d %H:%M:%S")
    return {
        "username": ent.get("username"),
        "email": ent.get("email"),
        "is_verified": bool(ent.get("is_verified")),
        "points_balance": int(ent.get("points_balance") or 0),
        "member_until": member_until or "",
        "active_member": bool(ent.get("active_member")),
        "is_banned": bool(ent.get("is_banned")),
        "ban_reason": ent.get("ban_reason") or "",
        "commission_balance": float(ent.get("commission_balance") or 0)
    }

def consume_answer_quota(username, question_hash=""):
    ent = db.get_user_entitlement(username)
    if not ent:
        return False, "用户不存在", None
    if ent.get("is_banned"):
        return False, "账号已被封禁：" + (ent.get("ban_reason") or "请联系管理员"), ent
    if ent.get("active_member"):
        return True, "包月权益生效，本题不扣点", ent
    if int(ent.get("points_balance") or 0) <= 0:
        return False, "题数余额不足，请到用户中心购买点数或包月套餐", ent
    ok, balance = db.adjust_user_points(username, -1, "答题扣点", question_hash)
    ent["points_balance"] = balance if ok else int(ent.get("points_balance") or 0)
    return ok, "已扣除 1 点题数", ent

def verify_admin_password(input_password, stored_password):
    stored = stored_password or "admin"
    if stored.startswith("sha256$"):
        return "sha256$" + hash_password(input_password or "") == stored
    if stored.startswith("pbkdf2$"):
        return verify_password(input_password or "", stored)
    return (input_password or "") == stored

def make_admin_password(input_password):
    return "pbkdf2$" + hash_password(input_password or "").split("$", 1)[1] if hash_password(input_password or "").startswith("pbkdf2$") else "sha256$" + hash_password(input_password or "")

def create_admin_session(username):
    token = "adm_" + secrets.token_urlsafe(32)
    ADMIN_SESSIONS[token] = {"username": username, "expires": time.time() + ADMIN_SESSION_TTL}
    return token

def verify_admin_session(token):
    if not token or not token.startswith("adm_"):
        return False
    info = ADMIN_SESSIONS.get(token)
    if not info:
        return False
    if float(info.get("expires") or 0) < time.time():
        ADMIN_SESSIONS.pop(token, None)
        return False
    info["expires"] = time.time() + ADMIN_SESSION_TTL
    return True

def revoke_admin_session(token):
    if token:
        ADMIN_SESSIONS.pop(token, None)

def login_rate_key(scope, client_ip, username):
    return f"{scope}:{client_ip or 'unknown'}:{(username or '').strip().lower()}"

def login_identifier(username):
    return (username or "").strip().lower()

def seconds_until(value):
    if not value:
        return 0
    try:
        if isinstance(value, str):
            dt = datetime.strptime(value.split(".")[0], "%Y-%m-%d %H:%M:%S")
        else:
            dt = value
        return max(0, int((dt - datetime.now()).total_seconds()))
    except Exception:
        return 0

def check_login_rate(scope, client_ip, username):
    identifier = login_identifier(username)
    try:
        row = db.get_active_login_lock(scope, identifier)
        if row:
            retry = seconds_until(row.get("locked_until"))
            if retry > 0:
                return False, retry
    except Exception as e:
        print(f"[登录锁定] 查询失败: {e}", flush=True)
    key = login_rate_key(scope, client_ip, username)
    now = time.time()
    item = LOGIN_ATTEMPTS.get(key) or {"fails": [], "locked_until": 0}
    locked_until = float(item.get("locked_until") or 0)
    if locked_until > now:
        return False, int(locked_until - now)
    item["fails"] = [t for t in item.get("fails", []) if now - float(t) <= LOGIN_ATTEMPT_WINDOW]
    LOGIN_ATTEMPTS[key] = item
    return True, 0


# ==================== 通用 API 限流 ====================
# 格式: { "ip:path": {"count": N, "window_start": ts} }
_API_RATE_BUCKETS = {}

def check_api_rate(client_ip, path, max_count=30, window_sec=60):
    """通用 API 限流：每个 IP 在 window_sec 秒内对同一 path 最多 max_count 次"""
    key = f"{client_ip}:{path}"
    now = time.time()
    bucket = _API_RATE_BUCKETS.get(key)
    if not bucket or now - bucket["window_start"] > window_sec:
        _API_RATE_BUCKETS[key] = {"count": 1, "window_start": now}
        return True, 0
    bucket["count"] += 1
    if bucket["count"] > max_count:
        retry = int(window_sec - (now - bucket["window_start"]))
        return False, max(retry, 1)
    return True, 0

# 验证码发送限流：同一 IP 60 秒内最多 3 次，同一邮箱 60 秒内最多 1 次
_VERIFY_CODE_BUCKETS = {}

def check_verify_code_rate(client_ip, email):
    """验证码发送限流，防止邮件轰炸"""
    now = time.time()
    ip_key = f"ip:{client_ip}"
    email_key = f"email:{email.lower()}"
    ip_bucket = _VERIFY_CODE_BUCKETS.get(ip_key)
    if ip_bucket and now - ip_bucket < 60:
        return False, "发送过于频繁，请 60 秒后再试"
    email_bucket = _VERIFY_CODE_BUCKETS.get(email_key)
    if email_bucket and now - email_bucket < 60:
        return False, "该邮箱已发送验证码，请 60 秒后再试"
    _VERIFY_CODE_BUCKETS[ip_key] = now
    _VERIFY_CODE_BUCKETS[email_key] = now
    return True, ""

def record_login_failure(scope, client_ip, username, user=None):
    key = login_rate_key(scope, client_ip, username)
    now = time.time()
    item = LOGIN_ATTEMPTS.get(key) or {"fails": [], "locked_until": 0}
    fails = [t for t in item.get("fails", []) if now - float(t) <= LOGIN_ATTEMPT_WINDOW]
    fails.append(now)
    item["fails"] = fails
    retry_after = 0
    if len(fails) >= LOGIN_MAX_FAILURES:
        locked_until_ts = now + LOGIN_LOCK_SECONDS
        item["locked_until"] = locked_until_ts
        item["fails"] = []
        retry_after = LOGIN_LOCK_SECONDS
        try:
            db.save_login_lock(
                scope=scope,
                identifier=login_identifier(username),
                username=(user or {}).get("username") or (username if scope == "admin" else ""),
                email=(user or {}).get("email") or (username if "@" in (username or "") else ""),
                client_ip=client_ip or "",
                fail_count=LOGIN_MAX_FAILURES,
                locked_until=datetime.fromtimestamp(locked_until_ts),
                reason=f"{LOGIN_ATTEMPT_WINDOW//60} 分钟内密码错误 {LOGIN_MAX_FAILURES} 次"
            )
        except Exception as e:
            print(f"[登录锁定] 写入数据库失败: {e}", flush=True)
    LOGIN_ATTEMPTS[key] = item
    return retry_after

def clear_login_failures(scope, client_ip, username):
    LOGIN_ATTEMPTS.pop(login_rate_key(scope, client_ip, username), None)

def create_slider_captcha(scope, client_ip):
    captcha_id = secrets.token_urlsafe(18)
    target = secrets.randbelow(146) + 72
    SLIDER_CAPTCHAS[captcha_id] = {
        "scope": scope,
        "client_ip": client_ip or "",
        "target": target,
        "expires": time.time() + SLIDER_CAPTCHA_TTL,
        "verified": False
    }
    return {"id": captcha_id, "target_hint": target, "min": 0, "max": 260, "expires_in": SLIDER_CAPTCHA_TTL}

def verify_slider_captcha(captcha_id, x, scope, client_ip):
    item = SLIDER_CAPTCHAS.get(captcha_id or "")
    if not item:
        return None, "滑块验证已失效，请重试"
    if float(item.get("expires") or 0) < time.time():
        SLIDER_CAPTCHAS.pop(captcha_id, None)
        return None, "滑块验证已过期，请重试"
    if item.get("scope") != scope or item.get("client_ip") != (client_ip or ""):
        return None, "滑块验证来源不一致，请刷新后重试"
    try:
        delta = abs(int(float(x)) - int(item.get("target") or 0))
    except Exception:
        return None, "滑块位置无效"
    if delta > SLIDER_TOLERANCE:
        return None, "滑块位置不正确，请重试"
    token = "sld_" + secrets.token_urlsafe(24)
    item["verified"] = True
    item["token"] = token
    item["token_expires"] = time.time() + 120
    return token, ""

def consume_slider_token(token, scope, client_ip):
    if not token:
        return False
    now = time.time()
    for cid, item in list(SLIDER_CAPTCHAS.items()):
        if float(item.get("expires") or 0) < now or float(item.get("token_expires") or 0) < now:
            SLIDER_CAPTCHAS.pop(cid, None)
            continue
        if item.get("token") == token and item.get("scope") == scope and item.get("client_ip") == (client_ip or ""):
            SLIDER_CAPTCHAS.pop(cid, None)
            return True
    return False

def normalize_pem_key(key_text, key_type="PRIVATE KEY"):
    text = (key_text or "").strip().replace("\\n", "\n")
    if not text:
        return ""
    if "BEGIN " in text:
        return text
    # 自动检测密钥格式：PKCS#1 以 0x30 0x82 开头，PKCS#8 以 0x30 0x82...0x02 0x01 0x00 开头
    # 对于杉德河马，私钥通常是 PKCS#1 格式（RSA PRIVATE KEY）
    width = 64
    body = "\n".join(text[i:i + width] for i in range(0, len(text), width))
    return f"-----BEGIN {key_type}-----\n{body}\n-----END {key_type}-----"

def load_private_key_smart(key_text):
    """智能加载私钥，自动尝试 PKCS#8 和 PKCS#1 格式"""
    from cryptography.hazmat.primitives import serialization
    raw = (key_text or "").strip().replace("\\n", "\n")
    if not raw:
        raise RuntimeError("私钥为空")
    # 如果已经是 PEM 格式，直接加载
    if "BEGIN " in raw:
        pem = raw.encode("utf-8")
    else:
        # 纯 base64 字符串，尝试两种格式
        width = 64
        body = "\n".join(raw[i:i + width] for i in range(0, len(raw), width))
        pem = f"-----BEGIN PRIVATE KEY-----\n{body}\n-----END PRIVATE KEY-----".encode("utf-8")
    # 先尝试 PKCS#8
    try:
        return serialization.load_pem_private_key(pem, password=None)
    except Exception:
        pass
    # 再尝试 PKCS#1 (RSA PRIVATE KEY)
    if "BEGIN PRIVATE KEY" in pem.decode("utf-8"):
        pem_pkcs1 = pem.decode("utf-8").replace("PRIVATE KEY", "RSA PRIVATE KEY").encode("utf-8")
    elif "BEGIN " not in raw:
        pem_pkcs1 = f"-----BEGIN RSA PRIVATE KEY-----\n{body}\n-----END RSA PRIVATE KEY-----".encode("utf-8")
    else:
        pem_pkcs1 = pem
    try:
        return serialization.load_pem_private_key(pem_pkcs1, password=None)
    except Exception as e:
        raise RuntimeError(f"私钥格式无法识别（已尝试PKCS#8和PKCS#1）：{e}")

def rsa2_sign(params, private_key_text):
    try:
        from cryptography.hazmat.primitives import hashes, serialization
        from cryptography.hazmat.primitives.asymmetric import padding
    except Exception:
        raise RuntimeError("缺少 cryptography 依赖，无法生成支付宝 RSA2 签名，请先安装 cryptography")
    private_key = load_private_key_smart(private_key_text)
    sign_content = "&".join(f"{k}={params[k]}" for k in sorted(params) if params[k] not in (None, "") and k != "sign")
    signature = private_key.sign(sign_content.encode("utf-8"), padding.PKCS1v15(), hashes.SHA256())
    return base64.b64encode(signature).decode("utf-8")

def rsa2_sign_raw(content_str, private_key_text):
    """直接对原始字符串做 SHA256WithRSA 签名（用于杉德报文签名）"""
    return rsa_sign_raw(content_str, private_key_text, "sha256")

def rsa_sign_raw(content_str, private_key_text, hash_algo="sha256"):
    """直接对原始字符串做 RSA 签名，支持 sha1 和 sha256"""
    try:
        from cryptography.hazmat.primitives import hashes
        from cryptography.hazmat.primitives.asymmetric import padding
    except Exception:
        raise RuntimeError("缺少 cryptography 依赖，无法生成签名")
    private_key = load_private_key_smart(private_key_text)
    hash_obj = hashes.SHA1() if hash_algo == "sha1" else hashes.SHA256()
    signature = private_key.sign(content_str.encode("utf-8"), padding.PKCS1v15(), hash_obj)
    return base64.b64encode(signature).decode("utf-8")

def alipay_api_call(method, biz_content, skip_enabled_check=False):
    admin = db.get_admin_config() or {}
    if not skip_enabled_check and not admin.get("alipay_enabled"):
        raise RuntimeError("支付宝接口未启用")
    app_id = (admin.get("alipay_app_id") or "").strip()
    private_key = admin.get("alipay_private_key") or ""
    gateway = (admin.get("alipay_gateway") or "https://openapi.alipay.com/gateway.do").strip()
    if not app_id or not private_key:
        raise RuntimeError("支付宝 APPID 或应用私钥未配置")
    params = {
        "app_id": app_id,
        "method": method,
        "charset": "utf-8",
        "sign_type": "RSA2",
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "version": "1.0",
        "biz_content": json.dumps(biz_content, ensure_ascii=False, separators=(",", ":"))
    }
    params["sign"] = rsa2_sign(params, private_key)
    data = urlencode(params).encode("utf-8")
    with urlopen(gateway, data=data, timeout=15) as resp:
        payload = json.loads(resp.read().decode("utf-8"))
    response_key = method.replace(".", "_") + "_response"
    res = payload.get(response_key) or {}
    if res.get("code") not in ("10000", "10003"):
        raise RuntimeError(res.get("sub_msg") or res.get("msg") or "支付宝接口调用失败")
    return res

def create_alipay_precreate_order(username, plan, skip_enabled_check=False):
    order_no = db.create_pending_order(username, plan, pay_method="alipay", pay_channel="alipay")
    subject = f"学神助手-{plan.get('name')}"
    res = alipay_api_call("alipay.trade.precreate", {
        "out_trade_no": order_no,
        "total_amount": f"{float(plan.get('price') or 0):.2f}",
        "subject": subject[:256]
    }, skip_enabled_check=skip_enabled_check)
    qr_code = res.get("qr_code") or ""
    trade_no = res.get("trade_no") or ""
    db.update_order_payment(order_no, trade_no=trade_no, qr_code=qr_code, status="pending")
    return order_no, qr_code

def query_and_apply_alipay_order(order_no):
    order = db.get_order(order_no)
    if not order:
        return False, "订单不存在", None
    if order.get("status") == "paid":
        return True, "支付成功，权益已到账", order
    res = alipay_api_call("alipay.trade.query", {"out_trade_no": order_no})
    trade_status = res.get("trade_status") or ""
    if trade_status in ("TRADE_SUCCESS", "TRADE_FINISHED"):
        ok, msg = db.apply_paid_order(order_no)
        return ok, msg, db.get_order(order_no)
    if trade_status in ("WAIT_BUYER_PAY", ""):
        return False, "等待付款", order
    return False, "订单状态：" + trade_status, order

# ==================== 支付FM ====================
def create_zhifufm_order(username, plan, pay_type="alipay", skip_enabled_check=False):
    admin = db.get_admin_config() or {}
    if not skip_enabled_check and not admin.get("zhifufm_enabled"):
        raise RuntimeError("支付FM未启用")
    api_url = (admin.get("zhifufm_api_url") or "").strip().rstrip("/")
    merchant_num = (admin.get("zhifufm_merchant_num") or "").strip()
    secret = (admin.get("zhifufm_secret") or "").strip()
    notify_url = (admin.get("zhifufm_notify_url") or "").strip()
    return_url = (admin.get("zhifufm_return_url") or "").strip()
    if not api_url or not merchant_num or not secret:
        raise RuntimeError("支付FM配置不完整")
    order_no = db.create_pending_order(username, plan, pay_method=pay_type, pay_channel="zhifufm")
    amount = f"{float(plan.get('price') or 0):.2f}"
    # 按支付FM文档：待签名字符串=商户号+商户订单号+支付金额+异步通知地址+接入密钥
    sign_str = merchant_num + order_no + amount + notify_url + secret
    sign = hashlib.md5(sign_str.encode("utf-8")).hexdigest()
    params = {
        "merchantNum": merchant_num,
        "orderNo": order_no,
        "amount": amount,
        "notifyUrl": notify_url,
        "payType": pay_type,
        "sign": sign,
        "returnType": "json"
    }
    if return_url:
        params["returnUrl"] = return_url
    qs = urlencode(params)
    # 支付FM接口：用户实际接口地址为 /api/startOrder
    base = api_url.rstrip("/")
    if base.endswith("/startOrder"):
        base = base[:-len("/startOrder")]
    if base.endswith("/api"):
        base = base[:-len("/api")]
    # 只用 /api/startOrder（curl 验证可行的路径）
    url = f"{base}/api/startOrder?{qs}"
    print(f"[支付FM] 请求URL: {url[:150]}", flush=True)
    print(f"[支付FM] 商户号: {merchant_num}, 订单号: {order_no}, 金额: {amount}, payType: {pay_type}", flush=True)
    # 支付FM文档：参数传递 Query，body 为空
    req = urllib.request.Request(url, method="POST", data=b"", headers={
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "XueShenHelper/1.0"
    })
    try:
        with urlopen(req, timeout=15) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
            print(f"[支付FM] 响应: {raw[:300]}", flush=True)
            if not raw or not raw.strip():
                raise RuntimeError(f"支付FM返回空响应。请求URL: {url[:120]}")
            data = json.loads(raw)
    except json.JSONDecodeError:
        raise RuntimeError(f"支付FM返回非JSON: {raw[:300]}")
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        print(f"[支付FM] HTTP错误 {e.code}: {body[:300]}", flush=True)
        raise RuntimeError(f"支付FM HTTP {e.code}: {body[:300]}")
    if not data.get("success"):
        raise RuntimeError(data.get("msg") or "支付FM创建订单失败")
    pay_url = (data.get("data") or {}).get("payUrl") or ""
    db.update_order_payment(order_no, pay_url=pay_url, status="pending")
    return order_no, pay_url

def verify_zhifufm_notify(params):
    admin = db.get_admin_config() or {}
    secret = (admin.get("zhifufm_secret") or "").strip()
    merchant_num = (admin.get("zhifufm_merchant_num") or "").strip()
    state = params.get("state", "")
    order_no = params.get("orderNo", "")
    amount = params.get("amount", "")
    sign_str = state + merchant_num + order_no + amount + secret
    expected = hashlib.md5(sign_str.encode("utf-8")).hexdigest()
    return params.get("sign", "") == expected

# ==================== 杉德河马 ====================
def create_sandpay_order(username, plan, pay_type="alipay", skip_enabled_check=False, product_id=None, custom_head=None, custom_body=None):
    admin = db.get_admin_config() or {}
    if not skip_enabled_check and not admin.get("sandpay_enabled"):
        raise RuntimeError("杉德支付未启用")
    api_url = (admin.get("sandpay_api_url") or "").strip().rstrip("/")
    mid = (admin.get("sandpay_mid") or "").strip()
    notify_url = (admin.get("sandpay_notify_url") or "").strip()
    private_key_text = admin.get("sandpay_private_key") or ""
    if not api_url or not mid:
        raise RuntimeError("杉德支付配置不完整")
    # 若传入了自定义body且含orderCode，则使用该orderCode作为数据库订单号
    custom_order_no = (custom_body or {}).get("orderCode", "") if custom_body else ""
    if custom_order_no:
        order_no = custom_order_no
        # 将自定义订单写入数据库（如果不存在则创建）
        existing = db.get_order(order_no)
        if not existing:
            db.create_pending_order(username, plan, pay_method=pay_type, pay_channel="sandpay", order_no=order_no)
    else:
        order_no = db.create_pending_order(username, plan, pay_method=pay_type, pay_channel="sandpay")
    amount_yuan = float(plan.get('price') or 0)
    # 杉德金额格式：12位数字，单位分，如 000000000001 = 0.01元
    amount_fen = int(round(amount_yuan * 100))
    total_amount = f"{amount_fen:012d}"
    # 聚合码模式：payTool=0403，一个二维码微信/支付宝/银联都能扫
    # productId=00002000（杉德收银台/聚合码）
    pay_tool = "0403"
    if not product_id:
        product_id = "00002000"
    # 构造报文 head + body
    req_time = datetime.now().strftime("%Y%m%d%H%M%S")
    head = {
        "version": "1.0",
        "method": "sandpay.trade.precreate",
        "productId": product_id,
        "accessType": "1",
        "mid": mid,
        "plMid": "",
        "channelType": "07",
        "reqTime": req_time,
    }
    body = {
        "payTool": pay_tool,
        "orderCode": order_no,
        "totalAmount": total_amount,
        "subject": f"学神助手-{plan.get('name', '')}"[:40],
        "body": f"学神助手-{plan.get('name', '')}",
        "storeCode": "",
        "notifyUrl": notify_url,
        "extend": "",
        "accsplitInfo": "",
        "clearCycle": "",
        "txnTimeOut": "",
    }
    # 自定义参数覆盖默认值
    if custom_head and isinstance(custom_head, dict):
        head.update(custom_head)
    if custom_body and isinstance(custom_body, dict):
        body.update(custom_body)
    data_obj = {"head": head, "body": body}
    # 杉德老版API signType="01" 对应 SHA1WithRSA，对 data JSON 字符串签名
    data_str = json.dumps(data_obj, separators=(',', ':'), ensure_ascii=False)
    sign = rsa_sign_raw(data_str, private_key_text, "sha1") if private_key_text else ""
    payload = {
        "charset": "utf-8",
        "signType": "01",
        "data": data_obj,
        "sign": sign,
    }
    req_data = json.dumps(payload, separators=(',', ':'), ensure_ascii=False).encode("utf-8")
    full_url = f"{api_url}/qr/api/order/create"
    # 杉德老版API需要 form-urlencoded 格式，不是JSON
    form_data = urllib.parse.urlencode({
        "charset": "utf-8",
        "signType": "01",
        "data": data_str,
        "sign": sign,
    }).encode("utf-8")
    req = urllib.request.Request(full_url, data=form_data, headers={"Content-Type": "application/x-www-form-urlencoded"})
    try:
        with urlopen(req, timeout=20) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
            print(f"[杉德] 响应: {raw[:500]}", flush=True)
            # 杉德返回URL编码的表单格式，需要先URL解码再解析
            # 格式: charset=UTF-8&signType=01&sign=xxx&data={"head":{},"body":{}}
            if raw.startswith("{"):
                res = json.loads(raw)
            else:
                # 先URL解码整个响应
                from urllib.parse import unquote, parse_qs as _pqs
                decoded = unquote(raw)
                parsed_form = _pqs(decoded)
                res = {}
                for k, v in parsed_form.items():
                    res[k] = v[0]
                # data 字段是JSON字符串，需要再解析
                if "data" in res and isinstance(res["data"], str):
                    try:
                        res["data"] = json.loads(res["data"])
                    except Exception:
                        pass
    except Exception as e:
        raise RuntimeError(f"杉德接口请求失败: {e}")
    resp_head = (res.get("data") or {}).get("head") or {}
    resp_code = resp_head.get("respCode", "")
    if resp_code != "000000":
        raise RuntimeError(f"杉德创建订单失败: {resp_head.get('respMsg', '')} (code={resp_code})")
    resp_body = (res.get("data") or {}).get("body") or {}
    pay_url = resp_body.get("qrCode") or ""
    if not pay_url:
        raise RuntimeError("杉德创建订单成功但未返回二维码")
    db.update_order_payment(order_no, pay_url=pay_url, status="pending")
    return order_no, pay_url

def load_public_key_smart(key_text):
    """智能加载公钥，自动尝试 PUBLIC KEY 和 RSA PUBLIC KEY 格式"""
    from cryptography.hazmat.primitives import serialization
    raw = (key_text or "").strip().replace("\\n", "\n")
    if not raw:
        raise RuntimeError("公钥为空")
    if "BEGIN " in raw:
        pem = raw.encode("utf-8")
    else:
        width = 64
        body = "\n".join(raw[i:i + width] for i in range(0, len(raw), width))
        pem = f"-----BEGIN PUBLIC KEY-----\n{body}\n-----END PUBLIC KEY-----".encode("utf-8")
    try:
        return serialization.load_pem_public_key(pem)
    except Exception:
        pass
    # 尝试 RSA PUBLIC KEY (PKCS#1)
    if "BEGIN PUBLIC KEY" in pem.decode("utf-8"):
        pem_pkcs1 = pem.decode("utf-8").replace("PUBLIC KEY", "RSA PUBLIC KEY").encode("utf-8")
    elif "BEGIN " not in raw:
        pem_pkcs1 = f"-----BEGIN RSA PUBLIC KEY-----\n{body}\n-----END RSA PUBLIC KEY-----".encode("utf-8")
    else:
        pem_pkcs1 = pem
    return serialization.load_pem_public_key(pem_pkcs1)

def verify_sandpay_notify(params):
    """验证杉德回调通知，老版API格式：{charset, signType, data:{head,body}, sign}"""
    admin = db.get_admin_config() or {}
    public_key_text = admin.get("sandpay_public_key") or ""
    sign = params.get("sign", "")
    if not sign or not public_key_text:
        return False
    try:
        from cryptography.hazmat.primitives import hashes
        from cryptography.hazmat.primitives.asymmetric import padding
        pub_key = load_public_key_smart(public_key_text)
        # 老版API回调也是 data + sign 结构，signType="01" 对应 SHA1WithRSA
        data_obj = params.get("data", "")
        if isinstance(data_obj, dict):
            data_str = json.dumps(data_obj, separators=(',', ':'), ensure_ascii=False)
        else:
            data_str = str(data_obj)
        hash_obj = hashes.SHA1()  # signType="01" = SHA1WithRSA
        pub_key.verify(base64.b64decode(sign), data_str.encode("utf-8"), padding.PKCS1v15(), hash_obj)
        return True
    except Exception:
        return False

# ==================== 易支付（支付FM兼容模式） ====================
def create_epay_order(username, plan, pay_type="alipay", skip_enabled_check=False):
    admin = db.get_admin_config() or {}
    if not skip_enabled_check and not admin.get("epay_enabled"):
        raise RuntimeError("易支付未启用")
    api_url = (admin.get("epay_api_url") or "").strip().rstrip("/")
    pid = (admin.get("epay_pid") or "").strip()
    key = (admin.get("epay_key") or "").strip()
    notify_url = (admin.get("epay_notify_url") or "").strip()
    return_url = (admin.get("epay_return_url") or "").strip()
    if not api_url or not pid or not key:
        raise RuntimeError("易支付配置不完整")
    order_no = db.create_pending_order(username, plan, pay_method=pay_type, pay_channel="epay")
    amount = f"{float(plan.get('price') or 0):.2f}"
    name = f"学神助手-{plan.get('name', '')}"
    # 按照易支付标准签名：参数排序拼接 + 密钥直接追加
    sign_params = {"pid": pid, "type": pay_type, "out_trade_no": order_no, "notify_url": notify_url, "return_url": return_url, "name": name, "money": amount}
    sorted_keys = sorted(sign_params.keys())
    sign_str = "&".join(f"{k}={sign_params[k]}" for k in sorted_keys if sign_params[k]) + key
    sign = hashlib.md5(sign_str.encode("utf-8")).hexdigest()
    params = {**sign_params, "sign": sign, "sign_type": "MD5"}
    qs = urlencode(params)
    pay_url = f"{api_url}/submit.php?{qs}"
    db.update_order_payment(order_no, pay_url=pay_url, status="pending")
    return order_no, pay_url

def verify_epay_notify(params):
    admin = db.get_admin_config() or {}
    key = (admin.get("epay_key") or "").strip()
    sign = params.get("sign", "")
    if not sign or not key:
        return False
    # 排除 sign 和 sign_type，按 key 升序拼接
    filtered = {k: v for k, v in params.items() if k not in ("sign", "sign_type") and v}
    sorted_keys = sorted(filtered.keys())
    sign_str = "&".join(f"{k}={filtered[k]}" for k in sorted_keys) + key
    expected = hashlib.md5(sign_str.encode("utf-8")).hexdigest()
    return sign == expected

# AI 答案内存缓存，避免同一题重复调用慢模型
AI_CACHE = {}
AI_CACHE_LOCK = threading.Lock()
AI_CACHE_TTL_SECONDS = 3600
AI_CACHE_MAX_SIZE = 1000

# AI 提供商配置（内存缓存，可通过管理界面修改）
DEFAULT_PROVIDERS = {
    "deepseek": {
        "enabled": True,
        "title": "DeepSeek",
        "protocol": "openai",
        "api_key": "",
        "base_url": "https://api.deepseek.com/v1",
        "models": [
            {"value": "deepseek-chat", "label": "DeepSeek-V3 (通用｜推荐)"},
            {"value": "deepseek-reasoner", "label": "DeepSeek-R1 (思考｜强推理)"}
        ]
    }
}

# 加载 providers 配置（优先从数据库读取，数据库为空则回退到文件/默认）
PROVIDERS_FILE = os.path.join(BASE_DIR, "config", "providers.json")

def load_providers():
    # 优先从数据库读取
    db_data = db.get_providers()
    if db_data:
        return db_data
    # 兼容旧文件
    if os.path.exists(PROVIDERS_FILE):
        try:
            with open(PROVIDERS_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
            db.save_providers(data)
            return data
        except Exception:
            pass
    db.save_providers(DEFAULT_PROVIDERS)
    return DEFAULT_PROVIDERS.copy()

def has_provider_models(providers):
    return bool(providers) and any((info.get("models") or []) for info in providers.values())

def is_provider_enabled(info):
    enabled = info.get("enabled")
    return enabled is True or enabled == 1 or str(enabled).lower() in ("1", "true", "yes", "on")

def provider_ready_count(providers):
    total = 0
    for info in (providers or {}).values():
        if is_provider_enabled(info) and (info.get("api_key") or "").strip() and (info.get("models") or []):
            total += 1
    return total

def recover_providers_if_empty(current=None):
    data = current if current is not None else PROVIDERS
    if has_provider_models(data):
        return data
    fresh = db.get_providers()
    if has_provider_models(fresh):
        return fresh
    if os.path.exists(PROVIDERS_FILE):
        try:
            with open(PROVIDERS_FILE, "r", encoding="utf-8") as f:
                file_data = json.load(f)
            if has_provider_models(file_data):
                db.save_providers(file_data)
                return file_data
        except Exception as e:
            print(f"[AI配置恢复] 读取文件失败: {e}", flush=True)
    db.save_providers(DEFAULT_PROVIDERS)
    return DEFAULT_PROVIDERS.copy()

def refresh_providers_from_storage():
    fresh = db.get_providers()
    return recover_providers_if_empty(fresh)

def save_providers(providers):
    if not has_provider_models(providers) and has_provider_models(PROVIDERS):
        raise ValueError("拒绝保存空模型配置：当前请求没有任何模型，已保留原配置")
    db.save_providers(providers)
    # 同时保留文件备份
    try:
        with open(PROVIDERS_FILE, "w", encoding="utf-8") as f:
            json.dump(providers, f, ensure_ascii=False, indent=2)
    except Exception:
        pass

PROVIDERS = load_providers()

import re as _re

EMAIL_VAR_PATTERN = _re.compile(r"\{\{([a-zA-Z0-9_]+)\}\}")

def _render_email_template(text, variables):
    """替换邮件模板中的变量 {{var_name}}"""
    if not text:
        return text
    def _repl(m):
        key = m.group(1)
        val = variables.get(key, "")
        return str(val) if val is not None else ""
    return EMAIL_VAR_PATTERN.sub(_repl, text)


def _html_to_plain(html):
    """将 HTML 转为纯文本（用于邮件纯文本兜底，避免 multipart/alternative 仅含 HTML 单部分时被客户端当作纯文本显示）"""
    if not html:
        return ""
    h = _re.sub(r'(?is)<(script|style).*?</\1>', '', html)
    h = _re.sub(r'(?i)<(br|/p|/div|/tr|/li|/h[1-6]|/td)[^>]*>', '\n', h)
    h = _re.sub(r'(?s)<[^>]+>', '', h)
    try:
        from html import unescape as _hu
        h = _hu(h)
    except Exception:
        pass
    h = _re.sub(r'[ \t]+\n', '\n', h)
    h = _re.sub(r'\n{3,}', '\n\n', h)
    return h.strip()

# ==================== 邮件发送 ====================
def _weighted_pick(servers):
    """按权重随机选择一个邮件服务器"""
    total = sum(int(s.get("weight") or 1) for s in servers)
    if total <= 0:
        return servers[0] if servers else None
    r = random.randint(1, total)
    upto = 0
    for s in servers:
        upto += int(s.get("weight") or 1)
        if r <= upto:
            return s
    return servers[-1]


def _pick_mail_server(resend=False):
    """选择一个可用的邮件服务器。resend=True 时优先选择标记为补发专用的服务器"""
    servers = db.list_mail_servers(enabled_only=True)
    if not servers:
        return None
    if resend:
        # 优先选择标记为补发专用的服务器
        resend_servers = [s for s in servers if s.get("is_resend")]
        if resend_servers:
            return _weighted_pick(resend_servers)
    return _weighted_pick(servers)


def _tencent_ses_send(server, to_addr, subject, body_html=None, body_text=None):
    """通过腾讯云 SES API 发送邮件"""
    import hmac
    import hashlib
    import time
    import random
    from datetime import datetime

    secret_id = (server.get("secret_id") or "").strip()
    secret_key = (server.get("secret_key") or "").strip()
    region = (server.get("ses_region") or "ap-guangzhou").strip()
    template_id = int(server.get("ses_template_id") or 0)
    from_addr = (server.get("from_addr") or "").strip()
    from_name = (server.get("from_name") or "").strip() or "学神助手"

    if not all([secret_id, secret_key, from_addr]):
        return False, "腾讯云 SES 配置不完整（缺少 secret_id/secret_key/from_addr）"

    service = "ses"
    host = "ses.tencentcloudapi.com"
    action = "SendEmail"
    version = "2020-10-02"
    algorithm = "HMAC-SHA256"
    timestamp = int(time.time())
    nonce = random.randint(1, 2147483647)

    # 构建请求参数
    from_email = f"{from_name} <{from_addr}>" if from_name else from_addr
    params = {
        "Action": action,
        "Version": version,
        "Region": region,
        "FromEmailAddress": from_email,
        "Subject": subject,
        "Destination.N": [to_addr],
    }
    # 使用模板或直接内容
    if template_id:
        params["Template"] = {"TemplateID": template_id, "TemplateData": "{}"}
    elif body_html:
        import base64 as b64
        params["Simple"] = {"Html": b64.b64encode(body_html.encode("utf-8")).decode("utf-8")}
    elif body_text:
        import base64 as b64
        params["Simple"] = {"Text": b64.b64encode(body_text.encode("utf-8")).decode("utf-8")}

    # TC3-HMAC-SHA256 签名
    def _sha256(data):
        return hashlib.sha256(data.encode("utf-8")).hexdigest()

    def _hmac_sha256(key, msg):
        return hmac.new(key, msg.encode("utf-8"), hashlib.sha256).digest()

    # Step 1: 拼接规范请求串
    http_request_method = "POST"
    canonical_uri = "/"
    canonical_querystring = ""
    content_type = "application/json; charset=utf-8"
    payload = json.dumps(params)
    canonical_headers = f"content-type:{content_type}\nhost:{host}\nx-tc-action:{action.lower()}\n"
    signed_headers = "content-type;host;x-tc-action"
    hashed_request_payload = _sha256(payload)
    canonical_request = f"{http_request_method}\n{canonical_uri}\n{canonical_querystring}\n{canonical_headers}\n{signed_headers}\n{hashed_request_payload}"

    # Step 2: 拼接待签名字符串
    credential_scope = f"{datetime.utcfromtimestamp(timestamp).strftime('%Y-%m-%d')}/{service}/tc3_request"
    string_to_sign = f"{algorithm}\n{timestamp}\n{credential_scope}\n{_sha256(canonical_request)}"

    # Step 3: 计算签名
    secret_date = _hmac_sha256(("TC3" + secret_key).encode("utf-8"), datetime.utcfromtimestamp(timestamp).strftime("%Y-%m-%d"))
    secret_service = _hmac_sha256(secret_date, service)
    secret_signing = _hmac_sha256(secret_service, "tc3_request")
    signature = hmac.new(secret_signing, string_to_sign.encode("utf-8"), hashlib.sha256).hexdigest()

    # Step 4: 拼接 Authorization
    authorization = f"{algorithm} Credential={secret_id}/{credential_scope}, SignedHeaders={signed_headers}, Signature={signature}"

    # 发送请求
    req_data = payload.encode("utf-8")
    req = __import__("urllib.request", fromlist=["Request"]).Request(
        f"https://{host}",
        data=req_data,
        headers={
            "Content-Type": content_type,
            "Host": host,
            "X-TC-Action": action,
            "X-TC-Version": version,
            "X-TC-Timestamp": str(timestamp),
            "X-TC-Nonce": str(nonce),
            "X-TC-Region": region,
            "Authorization": authorization,
        },
        method="POST",
    )
    try:
        with __import__("urllib.request", fromlist=["urlopen"]).urlopen(req, timeout=15) as resp:
            result = json.loads(resp.read().decode("utf-8"))
            if result.get("Response", {}).get("Error"):
                err = result["Response"]["Error"]
                return False, f"腾讯云 SES 错误: {err.get('Code', 'Unknown')} - {err.get('Message', '')}"
            return True, None
    except Exception as e:
        return False, f"腾讯云 SES 请求失败: {str(e)}"


def send_email(to_addr, subject, body_text=None, body_html=None, template_id=None, scene=None, variables=None, resend=False):
    """发送邮件，支持模板和变量替换
    template_id: 使用指定模板ID
    scene: 使用指定场景的模板（user_register/user_reset/admin_reset）
    variables: 变量字典，如 {"code": "123456"}
    resend: 是否为"没收到邮件"补发，True 时强制走腾讯云邮件服务器
    """
    admin = db.get_admin_config()
    if not admin or not admin.get("email_enabled"):
        return False, "邮箱功能未启用"
    server = _pick_mail_server(resend=resend)
    if not server:
        if resend:
            return False, "未配置已启用的邮件服务器，无法补发"
        return False, "未配置可用的邮件服务器"

    variables = variables or {}
    from_addr_val = (server.get("from_addr") or "").strip() or (server.get("smtp_user") or "").strip()
    variables["from_addr"] = from_addr_val

    # 补发场景：优先使用标记为"补发"的模板，否则使用对应场景模板
    if resend and scene and not template_id:
        tpl = db.get_email_template_resend(scene) or db.get_email_template_by_scene(scene)
        if tpl:
            template_id = tpl.get("id")

    # 如果使用模板
    if template_id:
        template = db.get_email_template(template_id)
        if not template:
            return False, "模板不存在"
        subject = _render_email_template(template.get("subject", ""), variables)
        variables["subject"] = subject
        body_text = _render_email_template(template.get("body_text", ""), variables)
        body_html = _render_email_template(template.get("body_html", ""), variables)
    elif scene:
        template = db.get_email_template_by_scene(scene)
        if template:
            subject = _render_email_template(template.get("subject", ""), variables)
            variables["subject"] = subject
            body_text = _render_email_template(template.get("body_text", ""), variables)
            body_html = _render_email_template(template.get("body_html", ""), variables)

    if not subject:
        return False, "邮件主题不能为空"

    # 腾讯云 SES API 发信
    if server.get("type") == "tencent_ses":
        return _tencent_ses_send(server, to_addr, subject, body_html=body_html, body_text=body_text)

    # SMTP 发信
    smtp_host = (server.get("smtp_host") or "").strip()
    smtp_port = int(server.get("smtp_port") or 587)
    smtp_user = (server.get("smtp_user") or "").strip()
    smtp_pass = (server.get("smtp_pass") or "").strip()
    from_addr = (server.get("from_addr") or "").strip() or smtp_user
    from_name = (server.get("from_name") or "").strip() or "学神助手"
    if not all([smtp_host, smtp_user, smtp_pass]):
        return False, "邮件服务器配置不完整"

    # 纯文本兜底：若只有 HTML 内容，自动生成纯文本，保证 multipart/alternative 同时含两部分，
    # 否则部分邮件客户端/服务商（如腾讯云中转）会把仅含 HTML 的邮件按纯文本显示
    if body_html and not body_text:
        body_text = _html_to_plain(body_html)

    # 构建 multipart 邮件（同时支持纯文本和 HTML）
    from email.mime.multipart import MIMEMultipart
    msg = MIMEMultipart("alternative")
    msg["From"] = formataddr((from_name, from_addr))
    msg["To"] = to_addr
    msg["Subject"] = subject

    if body_text:
        msg.attach(MIMEText(body_text, "plain", "utf-8"))
    if body_html:
        msg.attach(MIMEText(body_html, "html", "utf-8"))
    if not body_text and not body_html:
        return False, "邮件内容不能为空"

    try:
        server_conn = smtplib.SMTP(smtp_host, smtp_port, timeout=10)
        server_conn.starttls()
        server_conn.login(smtp_user, smtp_pass)
        server_conn.sendmail(from_addr, [to_addr], msg.as_string())
        server_conn.quit()
        return True, None
    except Exception as e:
        return False, f"邮件发送失败: {str(e)}"


# ==================== 每日数据邮件（定时发送） ====================
def get_daily_report_stats(stat_date):
    """统计某一天（YYYY-MM-DD）的注册用户数与收入情况"""
    try:
        conn = db._new_mysql_conn()
        try:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT COUNT(*) AS c FROM users WHERE DATE(created_at) = %s", (stat_date,)
            )
            row = cursor.fetchone() or {}
            reg_count = int(row.get("c") or 0)
            cursor.execute(
                """
                SELECT
                    COUNT(*) AS order_count,
                    COALESCE(SUM(price), 0) AS total_revenue,
                    SUM(CASE WHEN plan_type='monthly' THEN 1 ELSE 0 END) AS monthly_count,
                    SUM(CASE WHEN plan_type='monthly' THEN price ELSE 0 END) AS monthly_revenue,
                    SUM(CASE WHEN plan_type='points' THEN 1 ELSE 0 END) AS points_count,
                    SUM(CASE WHEN plan_type='points' THEN price ELSE 0 END) AS points_revenue
                FROM payment_orders
                WHERE status='paid' AND DATE(created_at) = %s
                """,
                (stat_date,),
            )
            rev = cursor.fetchone() or {}
            return {
                "date": stat_date,
                "reg_count": reg_count,
                "order_count": int(rev.get("order_count") or 0),
                "revenue_total": round(float(rev.get("total_revenue") or 0), 2),
                "monthly_count": int(rev.get("monthly_count") or 0),
                "monthly_revenue": round(float(rev.get("monthly_revenue") or 0), 2),
                "points_count": int(rev.get("points_count") or 0),
                "points_revenue": round(float(rev.get("points_revenue") or 0), 2),
            }
        finally:
            conn.close()
    except Exception as e:
        print(f"[每日数据邮件] 统计失败: {e}", flush=True)
        return {
            "date": stat_date,
            "reg_count": 0,
            "order_count": 0,
            "revenue_total": 0,
            "monthly_count": 0,
            "monthly_revenue": 0,
            "points_count": 0,
            "points_revenue": 0,
        }


def send_daily_report(stat_date=None):
    """执行一次每日数据邮件发送。stat_date 为 None 时默认取昨天。
    返回 (success, msg)
    """
    import datetime as _dt
    _td = _dt.timedelta
    cfg = db.get_daily_report_config()
    if not cfg:
        return False, "未找到每日数据邮件配置"
    if not cfg.get("enabled"):
        return False, "定时发送未启用"
    recipients = (cfg.get("recipients") or "").strip()
    if not recipients:
        return False, "未配置收件人邮箱"
    if not stat_date:
        stat_date = (_dt.date.today() - _td(days=1)).strftime("%Y-%m-%d")
    stats = get_daily_report_stats(stat_date)
    variables = dict(stats)
    variables["subject"] = f"学神助手 - {stat_date} 每日运营数据日报"
    template_id = cfg.get("template_id")
    sent_ok = 0
    errors = []
    for addr in [a.strip() for a in recipients.split(",") if a.strip()]:
        try:
            if template_id:
                ok, err = send_email(addr, variables["subject"], template_id=template_id, variables=variables)
            else:
                ok, err = send_email(addr, variables["subject"], scene="daily_report", variables=variables)
        except Exception as e:
            ok, err = False, str(e)
        if ok:
            sent_ok += 1
        else:
            errors.append(f"{addr}: {err}")
    now = _dt.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    if sent_ok > 0:
        status = "success" if not errors else "partial"
        msg = f"已发送给 {sent_ok} 个收件人" + (f"，{len(errors)} 个失败" if errors else "")
        db.set_daily_report_sent_result(now, status, "; ".join(errors))
        return True, msg
    db.set_daily_report_sent_result(now, "failed", "; ".join(errors))
    return False, "发送失败: " + "; ".join(errors)


def _daily_report_worker():
    """后台线程：每分钟检查是否到达设定的发送时间，按天去重发送"""
    import time as _time
    import datetime as _dt
    last_sent_day = ""
    while True:
        try:
            cfg = db.get_daily_report_config()
            if cfg and cfg.get("enabled"):
                now = _dt.datetime.now()
                send_time = (cfg.get("send_time") or "08:00").strip() or "08:00"
                if now.strftime("%H:%M") == send_time and now.strftime("%Y-%m-%d") != last_sent_day:
                    last_sent_day = now.strftime("%Y-%m-%d")
                    try:
                        ok, msg = send_daily_report()
                        print(f"[每日数据邮件] 定时发送: {'成功' if ok else '失败'} - {msg}", flush=True)
                    except Exception as e:
                        print(f"[每日数据邮件] 定时发送异常: {e}", flush=True)
        except Exception as e:
            print(f"[每日数据邮件] 线程异常: {e}", flush=True)
        _time.sleep(30)


def _start_daily_report_thread():
    import threading
    t = threading.Thread(target=_daily_report_worker, daemon=True)
    t.start()
    print("[每日数据邮件] 定时发送线程已启动", flush=True)


def _send_feedback_notify(feedback_id, notify_type="new", username="", category="", title="", content=""):
    """向管理员发送反馈通知邮件（新反馈/用户追问）"""
    try:
        if not db.get_feedback_notify_enabled():
            return
        admin = db.get_admin_config()
        admin_email = (admin or {}).get("admin_email") or ""
        if not admin_email:
            return
        variables = {
            "username": username,
            "category": category or "其他",
            "title": title,
            "content": (content or "")[:500],
            "subject": f"学神助手 - 新问题反馈通知" if notify_type == "new" else f"学神助手 - 用户追问通知",
            "from_addr": ""
        }
        send_email(admin_email, variables["subject"], scene="feedback_new", variables=variables)
    except Exception as e:
        print(f"[反馈通知] 邮件发送异常: {e}", flush=True)


def generate_code(length=6):
    """生成数字验证码"""
    return "".join(random.choices(string.digits, k=length))


# ==================== AI 调用 ====================
import urllib.request
import urllib.error

def make_ai_cache_key(question, model_mode, model_name="", custom_cfg=None):
    custom_cfg = custom_cfg or {}
    payload = {
        "question": question,
        "mode": model_mode or "auto",
        "model": model_name or "",
        "protocol": custom_cfg.get("protocol", ""),
        "base_url": custom_cfg.get("base_url", ""),
        "custom_model": custom_cfg.get("model", ""),
        "api_key_hash": hashlib.sha256((custom_cfg.get("api_key", "") or "").encode()).hexdigest() if custom_cfg.get("api_key") else ""
    }
    return hashlib.sha256(json.dumps(payload, ensure_ascii=False, sort_keys=True).encode("utf-8")).hexdigest()

def get_ai_cache(cache_key):
    now = time.time()
    with AI_CACHE_LOCK:
        item = AI_CACHE.get(cache_key)
        if not item:
            pass  # 内存未命中，查数据库
        elif now - item.get("ts", 0) > AI_CACHE_TTL_SECONDS:
            AI_CACHE.pop(cache_key, None)
            pass  # 内存过期，查数据库
        else:
            return item
    # 内存未命中，查 MySQL 持久化缓存
    try:
        row = db.get_ai_cache(cache_key)
        if row and row.get("answer"):
            db_item = {
                "answer": row["answer"],
                "model": row.get("model") or "",
                "provider": row.get("provider") or "",
                "ts": time.time()
            }
            with AI_CACHE_LOCK:
                AI_CACHE[cache_key] = db_item
            return db_item
    except Exception as e:
        print(f"[AI缓存] 数据库查询失败: {e}", flush=True)
    return None

def set_ai_cache(cache_key, answer, model_name="", provider_name=""):
    item = {
        "answer": answer,
        "model": model_name or "",
        "provider": provider_name or "",
        "ts": time.time()
    }
    with AI_CACHE_LOCK:
        if len(AI_CACHE) >= AI_CACHE_MAX_SIZE:
            oldest_key = min(AI_CACHE, key=lambda k: AI_CACHE[k].get("ts", 0))
            AI_CACHE.pop(oldest_key, None)
        AI_CACHE[cache_key] = item
    # 异步写入 MySQL 持久化缓存
    try:
        threading.Thread(target=lambda: db.set_ai_cache(cache_key, answer, model_name, provider_name), daemon=True).start()
    except Exception as e:
        print(f"[AI缓存] 数据库写入失败: {e}", flush=True)

def normalize_question_text(text):
    text = str(text or "")
    text = re.sub(r"\s+", "", text)
    text = re.sub(r"[A-D]\s*[.、．)]", "", text, flags=re.I)
    text = re.sub(r"[，。！？；：,.!?;:\-—_【】\[\]（）()\"'“”‘’]", "", text)
    return text.lower()

def parse_question_payload(question):
    raw = str(question or "")
    result = {"question_text": raw, "question_type": "", "options": []}
    try:
        data = json.loads(raw)
        if isinstance(data, dict):
            result["question_text"] = str(data.get("question") or raw)
            result["question_type"] = str(data.get("type") or "")
            options = data.get("options") or []
            if isinstance(options, list):
                result["options"] = [str(x).strip() for x in options if str(x).strip()]
    except Exception:
        pass
    return result

def make_question_hash(question):
    info = parse_question_payload(question)
    normalized = {
        "q": normalize_question_text(info.get("question_text", "")),
        "type": normalize_question_text(info.get("question_type", "")),
        "options": [normalize_question_text(x) for x in info.get("options", [])]
    }
    return hashlib.sha256(json.dumps(normalized, ensure_ascii=False, sort_keys=True).encode("utf-8")).hexdigest()

def _strip_option_prefix(text):
    """去除选项前缀，如 'A. xxx' -> 'xxx', 'B、xxx' -> 'xxx'"""
    text = str(text or "").strip()
    # 匹配 A. A、 A) A： A: 等
    m = re.match(r"^\s*[A-Za-z][\.\、\)\）:：．]\s*(.*)$", text)
    if m:
        return m.group(1).strip()
    # 匹配 1. 1、 1) 等
    m = re.match(r"^\s*\d+[\.\、\)\）:：．]\s*(.*)$", text)
    if m:
        return m.group(1).strip()
    return text

def options_match(input_options, bank_options_text):
    """匹配选项：输入选项是题库选项的子集即可（允许题库有更多选项）"""
    input_clean = [_strip_option_prefix(x) for x in (input_options or [])]
    input_set = {normalize_question_text(x) for x in input_clean if normalize_question_text(x)}
    if not input_set:
        return True  # 无选项视为通配
    bank_options = re.split(r"\s*\|\s*|\n+", str(bank_options_text or ""))
    bank_clean = [_strip_option_prefix(x) for x in bank_options]
    bank_set = {normalize_question_text(x) for x in bank_clean if normalize_question_text(x)}
    if not bank_set:
        return True  # 题库无选项视为通配
    # 放宽：输入选项是题库选项的子集即可（允许题库有额外选项）
    return input_set.issubset(bank_set)

def is_test_question_for_bank(question):
    info = parse_question_payload(question)
    q_text = (info.get("question_text") or "").strip()
    q_norm = normalize_question_text(q_text)
    raw = str(question or "")
    test_patterns = [
        "测试题",
        "1+1等于几",
        "1加1等于几",
        "测试封禁",
        "测试题库",
    ]
    if any(p in raw or p in q_text for p in test_patterns):
        return True
    if q_norm in ("11等于几", "1加1等于几", "测试题11等于几"):
        return True
    return False

def find_existing_bank_duplicate(info):
    q_norm = normalize_question_text(info.get("question_text", ""))
    keyword = (info.get("question_text", "") or "")[:80]
    if not q_norm or not keyword:
        return None
    try:
        candidates = db.search_question_bank(keyword=keyword, limit=30, page=1)
        for item in candidates:
            item_q_norm = normalize_question_text(item.get("question_text", ""))
            if item_q_norm == q_norm and options_match(info.get("options", []), item.get("options_text", "")):
                # 题型也要匹配才算重复（避免同题不同类型被覆盖）
                if question_type_matches(info.get("question_type", ""), item.get("question_type", "")):
                    return item
    except Exception as e:
        print(f"[题库去重] 查询失败: {e}", flush=True)
    return None

def question_type_matches(t1, t2):
    """判断两个题型是否匹配（空值视为通配，但有值时必须一致）"""
    t1 = (t1 or "").strip().lower()
    t2 = (t2 or "").strip().lower()
    if not t1 and not t2:
        return True  # 都为空，视为匹配
    if not t1 or not t2:
        return False  # 一个有值一个没值，不匹配
    return t1 == t2

def get_question_bank_match(question):
    info = parse_question_payload(question)
    current_type = info.get("question_type", "")
    qhash = make_question_hash(question)
    row = db.get_question_answer_by_hash(qhash)
    if row and row.get("answer"):
        print(f"[题库匹配] hash 精确命中 {qhash[:12]} type={current_type}", flush=True)
        return row, qhash
    q_norm = normalize_question_text(info.get("question_text", ""))
    keyword = (info.get("question_text", "") or "")[:80]
    if keyword:
        try:
            candidates = db.search_question_bank(keyword=keyword, limit=20, page=1)
            for item in candidates:
                item_q_norm = normalize_question_text(item.get("question_text", ""))
                if not item.get("answer") or not item_q_norm:
                    continue
                # 精确匹配
                if item_q_norm == q_norm or item_q_norm in q_norm or q_norm in item_q_norm:
                    if options_match(info.get("options", []), item.get("options_text", "")):
                        db.get_question_answer_by_hash(item.get("question_hash", ""))
                        print(f"[题库匹配] 标准化兜底命中 {item.get('question_hash', '')[:12]} type={item.get('question_type','')}", flush=True)
                        return item, item.get("question_hash", qhash)
                # 模糊匹配：相似度>=0.85 且选项匹配（不再限制题型）
                if len(q_norm) >= 4 and len(item_q_norm) >= 4:
                    ratio = SequenceMatcher(None, q_norm, item_q_norm).ratio()
                    if ratio >= 0.85 and options_match(info.get("options", []), item.get("options_text", "")):
                        db.get_question_answer_by_hash(item.get("question_hash", ""))
                        print(f"[题库匹配] 模糊匹配命中(相似度={ratio:.2f}) {item.get('question_hash', '')[:12]} type={item.get('question_type','')}", flush=True)
                        return item, item.get("question_hash", qhash)
        except Exception as e:
            print(f"[题库匹配] 兜底查询失败: {e}", flush=True)
    print(f"[题库匹配] 未命中 {qhash[:12]} type={current_type}", flush=True)
    return None, qhash

def save_question_bank_answer(question, answer, model_name="", provider_name=""):
    if not answer:
        return
    if is_test_question_for_bank(question):
        print("[题库入库] 测试题已跳过，不写入题库", flush=True)
        return
    info = parse_question_payload(question)
    qhash = make_question_hash(question)
    duplicate = find_existing_bank_duplicate(info)
    if duplicate and duplicate.get("question_hash"):
        qhash = duplicate.get("question_hash")
        print(f"[题库去重] 已存在相同题目，仅更新 {qhash[:12]}", flush=True)
    db.upsert_question_bank({
        "question_hash": qhash,
        "question_text": info.get("question_text", ""),
        "question_type": info.get("question_type", ""),
        "options_text": " | ".join(info.get("options", [])),
        "answer": answer,
        "source_model": model_name or "",
        "source_provider": provider_name or ""
    })

def extract_options_from_question(question):
    try:
        data = json.loads(question)
        options = data.get("options") or []
        return [str(x).strip() for x in options if str(x).strip()]
    except Exception:
        return []

def normalize_ai_answer(question, answer):
    """把模型返回清洗成适合脚本匹配的最终答案，避免返回 Thinking Process。"""
    if not answer:
        return answer
    text = str(answer).strip()
    options = extract_options_from_question(question)

    if options:
        # 匹配各种 "答案格式": "A" "答案是A" "正确答案是A" "选A" "选择A" "A. xxx" "A：xxx" 等
        m = re.match(r"^\s*(?:正确答案是?|答案是?|选择?|选|应该选|应该选择?)([A-D])", text, re.I)
        if m:
            idx = ord(m.group(1).upper()) - ord("A")
            if 0 <= idx < len(options):
                return options[idx]
            return m.group(1).upper()
        # "A" or "A. xxx" or "A：xxx" or "A、xxx"
        m = re.match(r"^\s*([A-D])(?:\s*[:：.．、)\）]|[\s]+)(.*)$", text, re.I)
        if m:
            idx = ord(m.group(1).upper()) - ord("A")
            rest = m.group(2).strip()
            if 0 <= idx < len(options):
                return options[idx]
            if rest:
                return rest
        # 纯字母答案 "AB" "A,B" "A、B" "A和B"
        clean = re.sub(r"[\s、,，&+]+", "", text).upper()
        if re.match(r"^[A-D]{1,4}$", clean) and len(clean) <= len(options):
            result = []
            for c in clean:
                idx = ord(c) - ord("A")
                if 0 <= idx < len(options):
                    result.append(options[idx])
            if result:
                return ",".join(result) if len(result) > 1 else result[0]
        # 判断题特殊处理
        if any(kw in text[:20].lower() for kw in ["正确", "对", "true", "√", "right"]):
            return "正确"
        if any(kw in text[:20].lower() for kw in ["错误", "不对", "错", "false", "×", "✗", "wrong"]):
            return "错误"

    # 日日新有时会把最终答案藏在 reasoning/Thinking Process 里，这里从尾部结论区提取。
    if re.search(r"Thinking Process|Analyze the Request|Final Answer|Construct Output|Therefore|最逻辑|最可能|Final Output|Final decision|Decoded question|最终答案", text, re.I):
        tail = text[-2000:]
        letter = None
        for pattern in [
            r"(?:Final Answer|Answer|答案|Construct Output|Therefore|因此|所以|最终答案|最终)[\s\S]{0,200}?\b([A-D])\b",
            r"(?:Option|选项)\s*([A-D])\b",
            r"\b([A-D])\s*[:：、.．)]",
            r"Answer:\s*([A-D])\b",
            r"答案[：:]\s*([A-D])\b",
            r"(?:正确答案是?|答案是?|选择?|选|应该选)\s*([A-D])\b",
        ]:
            m = re.search(pattern, tail, re.I)
            if m:
                letter = m.group(1).upper()
                break
        if letter and options:
            idx = ord(letter) - ord("A")
            if 0 <= idx < len(options):
                return options[idx]
            return letter
        if letter and not options:
            return letter

        # 优先从结论区匹配选项文本，避免匹配到开头列出的所有选项。
        if options:
            for opt in options:
                if opt and opt in tail:
                    return opt

        # 没有 options 时，尝试从尾部提取《》书名号内容或最后的结论行
        if not options:
            # 尝试提取书名号内容（如《论十大关系》）
            book_match = re.findall(r"《[^》]+》", tail)
            if book_match:
                return book_match[-1]
            # 尝试提取 "Answer: xxx" 或 "答案：xxx" 格式
            ans_match = re.search(r"(?:Final Answer|Answer|答案)[：:]\s*(.+?)(?:\n|$)", tail, re.I)
            if ans_match:
                return ans_match.group(1).strip()
            # 尝试提取最后一个 "Answer: xxx" 行
            ans_lines = re.findall(r"(?:Answer|答案|Final)[：:]\s*(.+?)(?:\n|$)", text, re.I)
            if ans_lines:
                return ans_lines[-1].strip()

    # 普通返回：去掉可能的选项字母前缀，但不要误删 Thinking 的首字母。
    text = re.sub(r"^\s*[A-D]\s*[:：、.．)]\s*", "", text).strip()
    return text

def do_openai_compatible_chat(messages, model, api_key, base_url):
    if not api_key:
        return None, "API Key 为空，请先在管理后台配置 AI 提供商的 API Key", 0
    if not base_url:
        return None, "Base URL 为空，请先在管理后台配置 AI 提供商的接口地址", 0

    def _try_request(msgs, use_temp=True, use_max_tokens=True):
        payload = {"model": model, "messages": msgs}
        if use_temp:
            payload["temperature"] = 0.1
        if use_max_tokens:
            payload["max_tokens"] = 4096
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            f"{base_url.rstrip('/')}/chat/completions",
            data=data,
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=180) as resp:
            return json.loads(resp.read().decode("utf-8"))

    # 第1次尝试：标准请求（system + user, temperature, max_tokens）
    for attempt, (msgs, use_temp, use_max_tokens, label) in enumerate([
        (messages, True, True, "标准请求"),
        # 第2次：去掉 system 消息，合并到 user 中（部分提供商不支持 system role）
        ([{"role": "user", "content": "\n".join(m["content"] for m in messages)}], False, False, "简化请求(无system)"),
        # 第3次：最小化请求，只保留 model + messages
        ([{"role": "user", "content": "\n".join(m["content"] for m in messages)}], False, False, "最小请求"),
    ]):
        try:
            result = _try_request(msgs, use_temp, use_max_tokens)
            if "error" in result:
                err_msg = result["error"].get("message", json.dumps(result["error"]))
                if attempt < 2:
                    continue  # 降级重试
                return None, f"API 错误: {err_msg}", 0
            if "choices" not in result or not result["choices"]:
                return None, f"API 返回异常: 无 choices 字段，响应: {json.dumps(result, ensure_ascii=False)[:200]}", 0
            choice = result["choices"][0]
            message = choice.get("message") or {}
            content = (
                message.get("content")
                or message.get("reasoning_content")
                or message.get("reasoning")
                or choice.get("text")
                or ""
            )
            if isinstance(content, list):
                content = "".join(
                    item.get("text", "") if isinstance(item, dict) else str(item)
                    for item in content
                )
            content = str(content).strip()
            if not content:
                return None, f"API 返回异常: 未找到 content 字段，响应: {json.dumps(result, ensure_ascii=False)[:500]}", 0
            usage = result.get("usage") or {}
            total_tokens = int(usage.get("total_tokens") or 0)
            return content, None, total_tokens
        except urllib.error.HTTPError as e:
            body = e.read().decode('utf-8')
            retry_after = e.headers.get("Retry-After", "") if hasattr(e, 'headers') else ""
            try:
                err = json.loads(body)
                err_msg = err.get("error", {}).get("message", body)
            except:
                err_msg = body
            if e.code == 429:
                cooldown = MODEL_429_DEFAULT_SECONDS
                if retry_after:
                    try:
                        cooldown = min(int(retry_after), 300)
                    except:
                        pass
                return None, f"__429__:{cooldown}:{err_msg}", 0
            # 400 错误：内容审核类错误不重试，其他错误降级重试
            if e.code == 400 and attempt < 2:
                # DeepSeek 内容审核错误，重试也没用，直接返回
                if "Output data may contain" in err_msg or "content_filter" in err_msg.lower():
                    return None, f"内容审核拦截(模型:{model}): AI 生成的回复可能包含敏感内容，请手动编辑回复", 0
                continue
            return None, f"API HTTP {e.code} (模型:{model}): {err_msg}", 0
        except Exception as e:
            if attempt < 2:
                continue
            return None, f"API 异常: {str(e)}", 0
    return None, "API 请求失败：所有重试均被拒绝，请检查模型名称和接口配置", 0

def do_claude_chat(messages, model, api_key, base_url):
    system = ""
    claude_messages = []
    for m in messages:
        if m["role"] == "system":
            system = m["content"]
        else:
            claude_messages.append({"role": m["role"], "content": m["content"]})
    data = json.dumps({"model": model, "max_tokens": 2048, "system": system, "messages": claude_messages}).encode("utf-8")
    req = urllib.request.Request(
        f"{base_url.rstrip('/')}/messages",
        data=data,
        headers={"x-api-key": api_key, "anthropic-version": "2023-06-01", "Content-Type": "application/json"},
        method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            result = json.loads(resp.read().decode("utf-8"))
            usage = result.get("usage") or {}
            total_tokens = int(usage.get("input_tokens", 0)) + int(usage.get("output_tokens", 0))
            return result["content"][0]["text"].strip(), None, total_tokens
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        if e.code == 429:
            retry_after = e.headers.get("Retry-After", "") if hasattr(e, 'headers') else ""
            cooldown = MODEL_429_DEFAULT_SECONDS
            if retry_after:
                try:
                    cooldown = min(int(retry_after), 300)
                except:
                    pass
            return None, f"__429__:{cooldown}:{body}", 0
        return None, f"Claude HTTP {e.code}: {body}", 0
    except Exception as e:
        return None, f"Claude 异常: {str(e)}", 0

def do_gemini_chat(messages, model, api_key, base_url):
    prompt = ""
    for m in messages:
        prefix = "用户" if m["role"] == "user" else "系统"
        prompt += f"{prefix}: {m['content']}\n"
    data = json.dumps({"contents": [{"parts": [{"text": prompt}]}], "generationConfig": {"temperature": 0.3, "maxOutputTokens": 2048}}).encode("utf-8")
    req = urllib.request.Request(
        f"{base_url.rstrip('/')}/models/{model}:generateContent?key={api_key}",
        data=data, headers={"Content-Type": "application/json"}, method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            result = json.loads(resp.read().decode("utf-8"))
            usage = result.get("usageMetadata") or {}
            total_tokens = int(usage.get("totalTokenCount", 0) or 0)
            return result["candidates"][0]["content"]["parts"][0]["text"].strip(), None, total_tokens
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        if e.code == 429:
            retry_after = e.headers.get("Retry-After", "") if hasattr(e, 'headers') else ""
            cooldown = MODEL_429_DEFAULT_SECONDS
            if retry_after:
                try:
                    cooldown = min(int(retry_after), 300)
                except:
                    pass
            return None, f"__429__:{cooldown}:{body}", 0
        return None, f"Gemini HTTP {e.code}: {body}", 0
    except Exception as e:
        return None, f"Gemini 异常: {str(e)}", 0

def get_enabled_providers():
    result = []
    for name, info in PROVIDERS.items():
        if info.get("enabled") and info.get("api_key"):
            result.append((name, info))
    return result

def get_enabled_model_candidates():
    candidates = []
    for pname, pinfo in get_enabled_providers():
        if not pinfo.get("base_url"):
            continue
        for m in pinfo.get("models", []):
            if m.get("value"):
                weight = int(m.get("weight") or 100)
                if weight < 0:
                    weight = 0
                candidates.append((pname, pinfo, m.get("value"), weight))
    return candidates

def weighted_pick(candidates):
    """按权重随机选择一个候选模型，返回排序后的列表（选中的排第一）"""
    if not candidates:
        return []
    weights = [max(0, item[3]) for item in candidates]
    total = sum(weights)
    if total <= 0:
        # 所有权重为0，随机选
        result = list(candidates)
        random.shuffle(result)
        return result
    # 加权随机选择
    r = random.uniform(0, total)
    cumulative = 0
    selected_idx = 0
    for i, w in enumerate(weights):
        cumulative += w
        if r <= cumulative:
            selected_idx = i
            break
    # 选中的排第一，其余按权重降序排列作为备选
    result = [candidates[selected_idx]]
    rest = [item for i, item in enumerate(candidates) if i != selected_idx]
    rest.sort(key=lambda x: x[3], reverse=True)
    result.extend(rest)
    return result

def build_models_html():
    options = []
    for name, info in PROVIDERS.items():
        if info.get("enabled") and info.get("api_key") and info.get("base_url") and info.get("models"):
            for m in info["models"]:
                if m.get("value") and m.get("label"):
                    options.append(f'<option value="{m["value"]}">{m["label"]}</option>')
    return "".join(options) if options else '<option value="">请先配置 AI 提供商</option>'

def find_provider_by_model(model_name):
    model_lower = model_name.lower() if model_name else ""
    for pname, pinfo in PROVIDERS.items():
        if not pinfo.get("enabled") or not pinfo.get("api_key"):
            continue
        for m in pinfo.get("models", []):
            if m.get("value", "").lower() == model_lower:
                return pname, pinfo
    return None, None

def resolve_model_name(model_name):
    if model_name and model_name not in ("__auto__", "auto"):
        return model_name
    candidates = get_enabled_model_candidates()
    if candidates:
        picked = weighted_pick(candidates)
        return picked[0][2]
    return ""

def build_ai_question_text(question_payload_str):
    """将题目JSON格式化为简洁文本，减少token消耗"""
    info = parse_question_payload(question_payload_str)
    q_text = info.get("question_text", "").strip()
    q_type = info.get("question_type", "").strip()
    options = info.get("options", [])
    parts = []
    if q_type:
        type_map = {"single": "单选题", "multiple": "多选题", "judge": "判断题", "fill": "填空题", "short": "简答题"}
        type_label = type_map.get(q_type, q_type)
        parts.append(f"[{type_label}]")
    parts.append(q_text)
    if options:
        parts.append("选项：")
        for i, opt in enumerate(options):
            letter = chr(65 + i)
            parts.append(f"{letter}. {opt}")
    return "\n".join(parts)

def call_provider_chat(question, model_name, provider_info):
    system_prompt = (
        "你是答题助手，只输出最终答案，禁止输出任何解释、分析、思考过程或中间步骤。\n"
        "规则：\n"
        "- 选择题：只输出选项字母，多选用逗号分隔（如 A 或 A,B）\n"
        "- 判断题：只输出 正确 或 错误\n"
        "- 填空题：只输出填空内容\n"
        "- 简答题：输出简洁答案，不超过50字\n"
        "- 不要输出题目、不要重复选项内容、不要输出分析过程"
    )
    # 将题目JSON格式化为简洁文本，减少输入token
    question_text = build_ai_question_text(question)
    messages = [{"role": "system", "content": system_prompt}, {"role": "user", "content": question_text}]
    api_key = provider_info.get("api_key", "")
    base_url = provider_info.get("base_url", "")
    protocol = provider_info.get("protocol", "openai")
    if protocol == "openai":
        return do_openai_compatible_chat(messages, model_name, api_key, base_url)
    elif protocol == "claude":
        return do_claude_chat(messages, model_name, api_key, base_url)
    elif protocol == "gemini":
        return do_gemini_chat(messages, model_name, api_key, base_url)
    else:
        return None, f"不支持的协议: {protocol}", 0

# Token 限额缓存：{model_name: {"date": "2026-07-02", "tokens": 12345, "limit": 100000}}
MODEL_TOKEN_CACHE = {}

def get_model_daily_limit(model_name):
    """从 providers 配置中获取模型的每日 token 限额"""
    for pname, pinfo in PROVIDERS.items():
        for m in pinfo.get("models", []):
            if m.get("value") == model_name:
                return int(m.get("daily_token_limit") or 0)
    return 0

def is_model_token_exhausted(model_name):
    """检查模型当日 token 是否已耗尽"""
    limit = get_model_daily_limit(model_name)
    if limit <= 0:
        return False  # 未设限额
    today = datetime.now().strftime("%Y-%m-%d")
    cache = MODEL_TOKEN_CACHE.get(model_name)
    if not cache or cache.get("date") != today:
        # 从数据库加载
        try:
            usage = db.get_model_token_usage_today()
            used = usage.get(model_name, {}).get("tokens", 0)
        except:
            used = 0
        MODEL_TOKEN_CACHE[model_name] = {"date": today, "tokens": used, "limit": limit}
        cache = MODEL_TOKEN_CACHE[model_name]
    return cache["tokens"] >= cache["limit"]

def record_model_token_usage(model_name, tokens):
    """记录模型 token 消耗"""
    if tokens <= 0:
        return
    today = datetime.now().strftime("%Y-%m-%d")
    cache = MODEL_TOKEN_CACHE.get(model_name)
    if not cache or cache.get("date") != today:
        cache = {"date": today, "tokens": 0, "limit": get_model_daily_limit(model_name)}
        MODEL_TOKEN_CACHE[model_name] = cache
    cache["tokens"] += tokens
    try:
        db.add_model_token_usage(model_name, tokens)
    except Exception as e:
        print(f"[Token统计] 写入失败: {e}", flush=True)

def ask_ai_auto(question):
    candidates = get_enabled_model_candidates()
    if not candidates:
        return None, "没有可自动选择的 AI 模型", "", ""
    now = time.time()
    # 过滤掉冷却中的模型（包括404冷却、429限流冷却、token限额耗尽）
    active = []
    cooling_429 = []  # 429冷却中的模型，记录(模型, 剩余秒)
    skipped_404 = []
    skipped_token = []
    for item in candidates:
        model_name = item[2]
        until_404 = MODEL_FAIL_COOLDOWN.get(model_name, 0)
        until_429 = MODEL_429_COOLDOWN.get(model_name, 0)
        if until_404 and until_404 > now:
            skipped_404.append(model_name)
            continue
        if until_429 and until_429 > now:
            cooling_429.append((model_name, int(until_429 - now)))
            continue
        if is_model_token_exhausted(model_name):
            skipped_token.append(model_name)
            continue
        active.append(item)
    if skipped_404:
        print(f"[自动模型] 404冷却跳过: {', '.join(sorted(set(skipped_404)))}", flush=True)
    if cooling_429:
        print(f"[自动模型] 429限流冷却中: {', '.join(f'{m}({s}s)' for m,s in cooling_429)}", flush=True)
    if skipped_token:
        print(f"[自动模型] Token限额耗尽: {', '.join(sorted(set(skipped_token)))}", flush=True)
    if not active:
        if cooling_429:
            return None, "所有模型429限流冷却中，请稍后重试", "", ""
        return None, "所有模型均不可用（404冷却中）", "", ""
    # 按权重排序，串行依次尝试，权重高的优先调用
    ordered = weighted_pick(active)
    print(f"[自动模型] 串行尝试 {len(ordered)} 个模型，顺序: {', '.join(f'{m[2]}(w={m[3]})' for m in ordered)}", flush=True)
    errors = []

    for provider_name, provider_info, model_name, weight in ordered:
        print(f"[自动模型] 尝试 provider={provider_name}, model={model_name}, weight={weight}", flush=True)
        attempt_start = time.time()
        try:
            answer, err, tokens = call_provider_chat(question, model_name, provider_info)
        except Exception as e:
            err = str(e)
            answer = None
        if answer:
            MODEL_FAIL_COOLDOWN.pop(model_name, None)
            MODEL_429_COOLDOWN.pop(model_name, None)
            record_model_token_usage(model_name, tokens)
            return answer, None, model_name, provider_name
        elif err:
            if err.startswith("__429__:"):
                parts = err.split(":", 2)
                cooldown_sec = int(parts[1]) if len(parts) > 1 and parts[1].isdigit() else MODEL_429_DEFAULT_SECONDS
                MODEL_429_COOLDOWN[model_name] = time.time() + cooldown_sec
                print(f"[自动模型] 模型 {model_name} 触发429限流，冷却 {cooldown_sec}s", flush=True)
            else:
                enqueue_ai_log({
                    "provider_key": provider_name or "",
                    "username": "",
                    "model": model_name,
                    "question": question,
                    "answer": "",
                    "status": "error",
                    "error": err,
                    "duration_ms": int((time.time() - attempt_start) * 1000),
                    "client_ip": ""
                })
                if "HTTP 404" in err or "model is not found" in err.lower() or "模型" in err and "不存在" in err:
                    MODEL_FAIL_COOLDOWN[model_name] = time.time() + MODEL_FAIL_COOLDOWN_SECONDS
                    print(f"[自动模型] 模型不可用，进入冷却 {MODEL_FAIL_COOLDOWN_SECONDS}s: {model_name}，原因：{err}", flush=True)
            errors.append(f"{model_name}: {err}")

    # 所有模型都失败
    last = ordered[-1] if ordered else (None, None, "", "")
    return None, "自动模型全部尝试失败；" + "；".join(errors[-5:]), last[2], last[0]

def ask_ai_custom(question, custom_cfg):
    model_name = (custom_cfg.get("model") or "").strip()
    provider_info = {
        "protocol": (custom_cfg.get("protocol") or "openai").strip(),
        "api_key": (custom_cfg.get("api_key") or "").strip(),
        "base_url": (custom_cfg.get("base_url") or "").strip()
    }
    if not model_name:
        return None, "自有模型未配置模型 ID"
    if not provider_info["api_key"]:
        return None, "自有模型未配置 API Key"
    if not provider_info["base_url"]:
        return None, "自有模型未配置 Base URL"
    answer, err, _tokens = call_provider_chat(question, model_name, provider_info)
    return answer, err

def ask_ai(question, model_name):
    model_name = resolve_model_name(model_name)
    if not model_name:
        return None, "未指定模型，且没有可自动选择的 AI 模型"
    provider_name, provider_info = find_provider_by_model(model_name)
    print(f"[DEBUG] ask_ai model={model_name!r}, provider={provider_name!r}, providers={list(PROVIDERS.keys())}", flush=True)
    for pname, pinfo in PROVIDERS.items():
        models = [m.get('value') for m in pinfo.get('models', [])]
        print(f"[DEBUG]   {pname}: enabled={pinfo.get('enabled')}, has_key={bool(pinfo.get('api_key'))}, models={models}", flush=True)
    if not provider_name:
        return None, f"模型 '{model_name}' 不可用。该模型对应的提供商未配置 API Key 或已被禁用。请在管理后台检查配置，或选择其他模型。"
    answer, err, tokens = call_provider_chat(question, model_name, provider_info)
    if answer:
        record_model_token_usage(model_name, tokens)
    return answer, err


# ==================== AI Agent 决策系统 ====================

def call_provider_chat_with_messages(messages, model_name, provider_info):
    """使用自定义消息列表调用 LLM（不含硬编码 system prompt）"""
    api_key = provider_info.get("api_key", "")
    base_url = provider_info.get("base_url", "")
    protocol = provider_info.get("protocol", "openai")
    if protocol == "openai":
        return do_openai_compatible_chat(messages, model_name, api_key, base_url)
    elif protocol == "claude":
        return do_claude_chat(messages, model_name, api_key, base_url)
    elif protocol == "gemini":
        return do_gemini_chat(messages, model_name, api_key, base_url)
    else:
        return None, f"不支持的协议: {protocol}", 0


def call_agent_llm(messages):
    """自动选择启用的模型调用 LLM，返回 (answer, err, model_name, provider_name)"""
    candidates = get_enabled_model_candidates()
    if not candidates:
        return None, "没有可用的 AI 模型，请先在管理后台配置并启用至少一个 AI 提供商", "", ""
    now = time.time()
    active = []
    cooling_429 = []
    for item in candidates:
        model_name = item[2]
        if MODEL_FAIL_COOLDOWN.get(model_name, 0) > now:
            continue
        if MODEL_429_COOLDOWN.get(model_name, 0) > now:
            cooling_429.append((model_name, int(MODEL_429_COOLDOWN[model_name] - now)))
            continue
        if is_model_token_exhausted(model_name):
            continue
        active.append(item)
    if active:
        ordered = weighted_pick(active)
    elif cooling_429:
        min_wait = min(s for _, s in cooling_429)
        print(f"[Agent] 所有模型429限流，等待 {min_wait}s 后重试", flush=True)
        time.sleep(min_wait + 1)
        now = time.time()
        active = [item for item in candidates if MODEL_429_COOLDOWN.get(item[2], 0) <= now and MODEL_FAIL_COOLDOWN.get(item[2], 0) <= now and not is_model_token_exhausted(item[2])]
        if not active:
            return None, "Agent 所有模型429限流冷却后仍无可用模型", "", ""
        ordered = weighted_pick(active)
    else:
        return None, "Agent 所有模型均不可用（404冷却中或Token限额耗尽）", "", ""
    errors = []
    for provider_name, provider_info, model_name, weight in ordered:
        print(f"[Agent] 尝试 provider={provider_name}, model={model_name}, weight={weight}", flush=True)
        answer, err, tokens = call_provider_chat_with_messages(messages, model_name, provider_info)
        if answer:
            MODEL_FAIL_COOLDOWN.pop(model_name, None)
            MODEL_429_COOLDOWN.pop(model_name, None)
            record_model_token_usage(model_name, tokens)
            return answer, None, model_name, provider_name
        if err:
            if err.startswith("__429__:"):
                parts = err.split(":", 2)
                cooldown_sec = int(parts[1]) if len(parts) > 1 and parts[1].isdigit() else MODEL_429_DEFAULT_SECONDS
                MODEL_429_COOLDOWN[model_name] = time.time() + cooldown_sec
                print(f"[Agent] 模型 {model_name} 触发429限流，冷却 {cooldown_sec}s", flush=True)
                errors.append(f"{model_name}: 429限流(冷却{cooldown_sec}s)")
                continue
            if "HTTP 404" in err or "model is not found" in err.lower() or ("模型" in err and "不存在" in err):
                MODEL_FAIL_COOLDOWN[model_name] = time.time() + MODEL_FAIL_COOLDOWN_SECONDS
                print(f"[Agent] 模型不可用，进入冷却 {MODEL_FAIL_COOLDOWN_SECONDS}s: {model_name}", flush=True)
            errors.append(f"{model_name}: {err}")
    return None, "Agent 所有模型尝试失败: " + "; ".join(errors[-3:]), "", ""


def build_agent_system_prompt(tools):
    """构建 Agent System Prompt（含工具描述 + 学习通知识 + 响应格式）
    融合 page-agent-main 的结构化提示词模式，提升 AI 决策质量。"""
    tool_desc_lines = []
    for t in tools:
        name = t.get("name", "")
        desc = t.get("description", "")
        params = t.get("params", {})
        tool_desc_lines.append(f"- {name}: {desc}")
        if isinstance(params, dict):
            for pname, pdesc in params.items():
                tool_desc_lines.append(f"    {pname}: {pdesc}")

    tool_desc = "\n".join(tool_desc_lines) if tool_desc_lines else "（无可用工具）"

    return f"""你是学习通（超星）课程自动化 AI Agent，遵循 ReAct（推理+行动）模式自主操作网页。

<intro>
你精通以下能力：
1. 理解学习通平台的页面结构和交互模式
2. 通过索引化的可交互元素列表理解页面状态
3. 制定分步计划并通过工具操作自主完成任务
4. 根据操作结果动态调整策略
</intro>

<language_settings>
工作语言：中文。所有分析、记忆、目标描述均使用中文。
</language_settings>

<input>
每一步你将收到以下信息：
1. 历史步骤：之前各步骤的分析、执行动作和结果
2. 任务目标：用户的最终任务描述（始终可见，最高优先级）
3. 脚本设置：用户在脚本浮窗中勾选的功能选项和执行约束（优先级高于默认任务点处理习惯）
4. 当前进度：第几步 / 总步数限制
5. 页面状态：当前 URL、标题、页面头部信息、可交互元素列表（含索引）、页面底部信息
</input>

<script_setting_rules>
- 必须严格遵守用户脚本设置。
- 如果设置中要求跳过视频/音频/直播，就不要点击播放按钮、不要等待播放进度、不要把音视频任务作为必须完成目标。
- 如果设置中要求跳过答题，就不要选择答案、不要填写题目、不要提交测验/作业/考试。
- 如果未开启自动提交，答题后不要点击提交或确认提交。
- 如果设置与通用学习通平台知识冲突，以脚本设置为准。
</script_setting_rules>

<browser_state>
页面可交互元素以简化 HTML 格式提供，格式为 [索引]<标签 属性>文本 />，例如：
[12]<button>开始播放</button>
\t[15]<input type="text" placeholder="请输入答案">

注意：
- 只有带数字索引 [N] 的元素才可交互
- 缩进（制表符）表示元素的 HTML 父子嵌套关系
- 纯文本（无索引）不可交互
- 如果页面内容被截断，使用 scroll 工具查看更多内容
</browser_state>

<browser_rules>
操作浏览器时严格遵循以下规则：
- 只能点击/操作带有数字索引 [N] 的元素
- 只能使用明确提供的索引号，不要猜测索引
- 页面变化后（如弹窗出现、内容刷新），重新分析元素，可能需要与新元素交互
- 默认只列出可视区域内的元素；如果怀疑目标在视口外，使用 scroll 工具滚动查找
- 滚动时注意页面信息中的"pages above/below"提示，只在有内容可滚动时滚动
- 不要对同一操作重复超过 3 次，除非条件发生了变化
- 如果输入文本后操作被打断，可能是下拉建议弹出等干扰，重新观察页面
- 如果页面未完全加载，使用 wait 工具等待
- 遇到验证码或无法处理的情况，如实报告并结束任务
</browser_rules>

<platform_knowledge>
## 学习通（超星）平台专用知识

### 页面类型识别
- 课程学习页（URL含 studentstudy）：包含课程章节列表，需逐个完成
- 任务点页（URL含 knowledge/cards）：包含视频、文档、章节测验等任务点
- 作业页（URL含 work/doHomeWork）：包含作业题目，需答题后提交
- 考试页（URL含 exam/test）：包含考试题目，有时间限制
- 直播页（URL含 zhibo）：直播视频，需保持观看

### 任务点处理规则
- 视频任务点：点击播放按钮 → 等待视频播放完成（任务点自动标记完成）
- 文档任务点：滚动浏览文档内容，确保阅读进度
- 章节测验：通常在 iframe 中，需要先点击"章节测验"标签切换视图 → 逐题作答 → 提交并确认
- 如果当前页面已经显示“单选题/多选题/判断题/填空题/简答题/章节测验”等题目内容，第一优先级是调用 handle_visible_quiz 工具处理当前可见测验，不要先 scroll 探索章节列表
- 提交测验：先点击提交按钮，再在弹出的确认对话框中点击确认
- 任务点完成后页面会自动跳转或刷新

### 答题规则
- 选择题：根据题目关键词在页面中搜索答案线索，或运用知识推理
- 填空题：在页面内容中查找对应信息填入
- 判断题：根据题目描述和页面内容判断对错
- 提交前检查所有题目是否已作答
- 有些按钮文字可能是乱码（字体加密），结合位置和上下文判断

### 导航规则
- 完成当前章节任务后，使用 next_chapter 工具跳转到下一章节
- 章节间切换后需要重新观察页面状态
</platform_knowledge>

<capability>
- 你只能操作当前页面，不要尝试跳转到其他页面
- 任务失败是可以接受的：
  - 用户的要求可能不合理或无法实现，此时应如实说明
  - 网页可能有 bug 或异常，导致无法正常操作
  - 过度尝试可能产生不良后果，适可而止比反复重试更好
- 如果反复尝试（5次以上）仍无法完成，应停止并报告情况
- 不要在没有凭据的情况下尝试登录
</capability>

<task_completion_rules>
必须在以下情况调用 done 工具：
- 完全完成了用户的任务目标 → success=true
- 达到最大步数限制，即使任务未完成 → success=false，说明完成情况
- 感到无法继续或任务目标不明确 → success=false，说明原因
- done 只能作为单独的动作调用，不要与其他操作同时调用
- success=true 仅当任务目标的所有部分都已完成
</task_completion_rules>

<reasoning_rules>
遵循以下推理模式：
- 分析历史步骤，追踪任务进度
- 分析最近一步的"目标"和"结果"，明确判断上一步是否成功
- 不要假设操作自动成功——如果预期的页面变化没有出现，标记为失败并规划恢复方案
- 判断是否陷入僵局（重复相同操作无进展），考虑替代方案
- 如果发现与任务相关的重要信息，记录到 memory 中
- 始终对照任务目标，确认当前轨迹是否正确
</reasoning_rules>

<tools>
## 可用工具
{tool_desc}
</tools>

<output>
## 响应格式（严格遵守）
你必须**只输出**一个 JSON 对象，不要包含任何其他文字、解释或 markdown 标记：

{{
  "evaluation": "对上一步操作的简短分析，明确判断成功/失败/不确定（中文，1-2句话）",
  "memory": "1-3句关键进度记忆，用于追踪任务完成情况（中文）",
  "next_goal": "下一步要实现的具体目标（中文，一句话）",
  "action": {{
    "tool_name": "工具名称",
    "params": {{}}
  }}
}}

## 好的输出示例
"evaluation": "成功点击了视频播放按钮，视频已开始播放。判定：成功"
"evaluation": "尝试点击提交按钮但未找到目标元素，可能页面尚未加载完成。判定：失败"
"memory": "已完成第1章视频观看，当前在第2章任务点页，待完成1个视频和1个章节测验。"
"next_goal": "等待视频播放5秒后检查播放状态"
</output>"""


def build_agent_user_message(task, step, max_steps, history, browser_state, script_settings=None):
    """构建发送给 LLM 的用户消息（含页面状态 + 历史 + 任务）
    使用结构化 XML 标签，与 system prompt 风格一致。"""
    url = browser_state.get("url", "")
    title = browser_state.get("title", "")
    header = browser_state.get("header", "")
    content = browser_state.get("content", "")
    footer = browser_state.get("footer", "")
    script_settings = script_settings or {}

    # 截断过长的内容（保留前 8000 字符，确保不超 token 限制）
    if len(content) > 8000:
        content = content[:8000] + "\n\n[... 内容过长已截断，请使用 scroll 工具查看更多 ...]"

    # 历史摘要（使用 page-agent-main 风格的 step 格式）
    history_text = ""
    if history:
        for h in history[-10:]:
            h_step = h.get("step", "?")
            h_eval = h.get("evaluation", "")
            h_memory = h.get("memory", "")
            h_goal = h.get("next_goal", "")
            h_action = h.get("action", "")
            h_params = h.get("action_params", {})
            h_result = h.get("result", {})
            history_text += f"<step_{h_step}>\n"
            history_text += f"Evaluation of Previous Step: {h_eval}\n"
            if h_memory:
                history_text += f"Memory: {h_memory}\n"
            history_text += f"Next Goal: {h_goal}\n"
            history_text += f"Action: {h_action}({json.dumps(h_params, ensure_ascii=False)})\n"
            if h_result:
                result_str = json.dumps(h_result, ensure_ascii=False)
                if len(result_str) > 300:
                    result_str = result_str[:300] + "..."
                history_text += f"Action Result: {result_str}\n"
            history_text += f"</step_{h_step}>\n\n"

    # 剩余步数警告
    remaining = max_steps - step - 1
    step_warning = ""
    if remaining <= 5:
        step_warning = f"\n<sys>警告：仅剩 {remaining} 步可用。如果任务尚未完成，请尽快使用 done 工具总结当前进度。</sys>\n"

    # URL 变化检测
    url_changed = ""
    if history and len(history) > 0:
        last_url = history[-1].get("url_after", "")
        if last_url and last_url != url:
            url_changed = f"\n<sys>注意：URL 已从上一步发生变化（{last_url} → {url}），页面可能已导航到新位置。</sys>\n"

    # 脚本设置约束：来自用户在浮窗中勾选的功能选项，优先级高于通用 Agent 习惯。
    rules = script_settings.get("rules", [])
    if isinstance(rules, list):
        rules_text = "\n".join([f"- {str(r)}" for r in rules if str(r).strip()])
    else:
        rules_text = str(script_settings.get("rulesText") or rules or "").strip()
    settings_json = json.dumps(script_settings, ensure_ascii=False) if script_settings else "{}"

    return f"""<user_request>
{task}
</user_request>

<script_settings>
这些是用户在脚本浮窗中勾选的功能选项，必须严格遵守；如果与通用学习通任务处理规则冲突，以这里为准。
原始设置: {settings_json}
执行约束:
{rules_text if rules_text else "（无额外约束）"}
</script_settings>

<step_info>
当前步骤: {step + 1} / {max_steps}
</step_info>

<agent_history>
{history_text if history_text.strip() else "（这是第一步，尚无历史记录）"}
</agent_history>
{step_warning}{url_changed}
<browser_state>
Current URL: {url}
Title: {title}

{header}

{content}

{footer}
</browser_state>

请分析页面状态，结合历史步骤和任务目标，决定下一步操作。只返回 JSON 格式的决策结果。"""


def parse_agent_decision(response_text):
    """从 LLM 响应中提取 Agent 决策 JSON，带容错回退"""
    import re

    json_str = None

    # 策略1: 提取 ```json ... ``` 代码块
    match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', response_text)
    if match:
        json_str = match.group(1).strip()

    # 策略2: 查找第一个完整的 JSON 对象
    if not json_str:
        # 找到第一个 { 和匹配的 }
        depth = 0
        start = -1
        for i, ch in enumerate(response_text):
            if ch == '{':
                if depth == 0:
                    start = i
                depth += 1
            elif ch == '}':
                depth -= 1
                if depth == 0 and start >= 0:
                    json_str = response_text[start:i + 1]
                    break

    # 策略3: 整个响应作为 JSON
    if not json_str:
        json_str = response_text.strip()

    try:
        decision = json.loads(json_str)
        if not isinstance(decision, dict):
            raise ValueError("响应不是 JSON 对象")
    except (json.JSONDecodeError, ValueError):
        # 回退：将整个响应作为 done 动作
        print(f"[Agent] JSON 解析失败，使用回退策略。原始响应前200字符: {response_text[:200]}", flush=True)
        return {
            "evaluation": "AI 响应格式异常，自动终止",
            "memory": "",
            "next_goal": "结束任务（解析失败）",
            "action": {
                "tool_name": "done",
                "params": {"text": response_text[:300], "success": False}
            }
        }

    # 补全缺失字段
    if "action" not in decision or not isinstance(decision.get("action"), dict):
        decision["action"] = {"tool_name": "done", "params": {"text": "无有效动作", "success": False}}
    if "tool_name" not in decision["action"]:
        decision["action"]["tool_name"] = "done"
    if "params" not in decision["action"] or not isinstance(decision["action"]["params"], dict):
        decision["action"]["params"] = {}
    if "evaluation" not in decision:
        decision["evaluation"] = ""
    if "memory" not in decision:
        decision["memory"] = ""
    if "next_goal" not in decision:
        decision["next_goal"] = ""

    return decision


def _get_token_usage_data(start_date, end_date):
    """获取模型 token 消耗数据"""
    try:
        rows = db.get_model_token_usage_range(start_date, end_date)
        # 获取每个模型的每日限额
        today_usage = db.get_model_token_usage_today()
        result = []
        for r in rows:
            model_name = r.get("model_name", "")
            limit = get_model_daily_limit(model_name)
            today_tokens = today_usage.get(model_name, {}).get("tokens", 0)
            result.append({
                "model": model_name,
                "total_tokens": int(r.get("total_tokens") or 0),
                "call_count": int(r.get("call_count") or 0),
                "daily_limit": limit,
                "today_tokens": today_tokens,
                "today_remaining": max(0, limit - today_tokens) if limit > 0 else -1,
            })
        return result
    except Exception as e:
        print(f"[Token统计] 获取数据失败: {e}", flush=True)
        return []

def get_admin_dashboard_stats(start_date=None, end_date=None):
    from datetime import datetime as _dt, timedelta as _td
    today = _dt.now().strftime("%Y-%m-%d")
    sd = start_date or today
    ed = end_date or today
    try:
        ed_dt = _dt.strptime(ed, "%Y-%m-%d") + _td(days=1)
        ed_next = ed_dt.strftime("%Y-%m-%d")
    except Exception:
        ed_next = ed
    cache_key = sd + "_" + ed
    now_ts = time.time()
    if DASHBOARD_CACHE.get("data") and DASHBOARD_CACHE.get("key") == cache_key and now_ts - DASHBOARD_CACHE.get("time", 0) < DASHBOARD_CACHE_SECONDS:
        return DASHBOARD_CACHE["data"]
    ph = "%s"
    card_sql = f"""
        SELECT
          (SELECT COUNT(*) FROM users) AS users,
          (SELECT COUNT(*) FROM question_bank) AS question_bank,
          COUNT(DISTINCT CASE
            WHEN COALESCE(username,'') <> '' THEN username
            WHEN COALESCE(client_ip,'') <> '' THEN client_ip
            ELSE NULL END) AS active,
          COUNT(*) AS calls,
          SUM(CASE WHEN status='success' THEN 1 ELSE 0 END) AS success,
          SUM(CASE WHEN status='error' THEN 1 ELSE 0 END) AS error,
          SUM(CASE WHEN status='success' AND provider_key='question_bank' THEN 1 ELSE 0 END) AS bank_hits
        FROM ai_call_logs
        WHERE created_at >= {ph} AND created_at < {ph}
    """

    trend_sql = """
        SELECT DATE(created_at) AS day,
               COUNT(*) AS total,
               SUM(CASE WHEN status='success' THEN 1 ELSE 0 END) AS success,
               SUM(CASE WHEN status='error' THEN 1 ELSE 0 END) AS error
        FROM ai_call_logs
        WHERE created_at >= %s AND created_at < %s
        GROUP BY DATE(created_at)
        ORDER BY day ASC
    """
    model_sql = """
        SELECT model AS model, COUNT(*) AS total
        FROM ai_call_logs
        WHERE status = 'success'
          AND COALESCE(provider_key, '') <> 'question_bank'
          AND COALESCE(model, '') <> ''
          AND created_at >= %s AND created_at < %s
        GROUP BY model
        ORDER BY total DESC
        LIMIT 8
    """
    revenue_sql = """
        SELECT
            COUNT(*) AS order_count,
            COALESCE(SUM(price), 0) AS total_revenue,
            SUM(CASE WHEN plan_type='monthly' THEN 1 ELSE 0 END) AS monthly_count,
            SUM(CASE WHEN plan_type='monthly' THEN price ELSE 0 END) AS monthly_revenue,
            SUM(CASE WHEN plan_type='points' THEN 1 ELSE 0 END) AS points_count,
            SUM(CASE WHEN plan_type='points' THEN price ELSE 0 END) AS points_revenue
        FROM payment_orders
        WHERE status='paid' AND created_at >= %s AND created_at < %s
    """
    revenue_trend_sql = """
        SELECT DATE(created_at) AS day,
               COUNT(*) AS orders,
               COALESCE(SUM(price), 0) AS revenue
        FROM payment_orders
        WHERE status='paid' AND created_at >= %s AND created_at < %s
        GROUP BY DATE(created_at)
        ORDER BY day ASC
    """
    conn = db._new_mysql_conn()
    try:
        cursor = conn.cursor()
        cursor.execute(card_sql, (sd, ed_next))
        card_stats = cursor.fetchone() or {}
        cursor.execute(trend_sql, (sd, ed_next))
        trend_rows = cursor.fetchall()
        cursor.execute(model_sql, (sd, ed_next))
        model_rows = cursor.fetchall()
        cursor.execute(revenue_sql, (sd, ed_next))
        rev_stats = cursor.fetchone() or {}
        cursor.execute(revenue_trend_sql, (sd, ed_next))
        rev_trend_rows = cursor.fetchall()
    finally:
        conn.close()
    trend_map = {str(r.get("day"))[:10]: r for r in trend_rows}
    rev_trend_map = {str(r.get("day"))[:10]: r for r in rev_trend_rows}
    trend = []
    rev_trend = []
    try:
        cur = _dt.strptime(sd, "%Y-%m-%d")
        end = _dt.strptime(ed, "%Y-%m-%d")
        while cur <= end:
            day = cur.strftime("%Y-%m-%d")
            r = trend_map.get(day, {})
            rv = rev_trend_map.get(day, {})
            trend.append({
                "day": day,
                "label": day[5:],
                "total": int(r.get("total") or 0),
                "success": int(r.get("success") or 0),
                "error": int(r.get("error") or 0),
            })
            rev_trend.append({
                "day": day,
                "label": day[5:],
                "orders": int(rv.get("orders") or 0),
                "revenue": round(float(rv.get("revenue") or 0), 2),
            })
            cur += _td(days=1)
    except Exception:
        pass

    data = {
        "cards": {
            "users": int(card_stats.get("users") or 0),
            "active": int(card_stats.get("active") or 0),
            "question_bank": int(card_stats.get("question_bank") or 0),
            "calls": int(card_stats.get("calls") or 0),
            "success": int(card_stats.get("success") or 0),
            "error": int(card_stats.get("error") or 0),
            "bank_hits": int(card_stats.get("bank_hits") or 0),
            "bank_hit_rate": round((int(card_stats.get("bank_hits") or 0) / max(1, int(card_stats.get("success") or 0))) * 100, 1),
        },
        "trend": trend,
        "models": [{"model": r.get("model"), "total": int(r.get("total") or 0)} for r in model_rows if r.get("model")],
        "revenue": {
            "total": round(float(rev_stats.get("total_revenue") or 0), 2),
            "orders": int(rev_stats.get("order_count") or 0),
            "monthly_revenue": round(float(rev_stats.get("monthly_revenue") or 0), 2),
            "monthly_orders": int(rev_stats.get("monthly_count") or 0),
            "points_revenue": round(float(rev_stats.get("points_revenue") or 0), 2),
            "points_orders": int(rev_stats.get("points_count") or 0),
            "trend": rev_trend,
        },
        "token_usage": _get_token_usage_data(sd, ed_next),
    }
    DASHBOARD_CACHE["time"] = now_ts
    DASHBOARD_CACHE["key"] = cache_key
    DASHBOARD_CACHE["data"] = data
    return data


# ==================== JWT 简易实现 ====================
# 安全：JWT secret 优先从环境变量读取，其次从本地文件读取，最后自动生成
def load_jwt_secret():
    # 优先从环境变量读取
    env_secret = os.environ.get("JWT_SECRET", "").strip()
    if len(env_secret) >= 32:
        return env_secret
    try:
        if os.path.exists(JWT_SECRET_FILE):
            with open(JWT_SECRET_FILE, "r", encoding="utf-8") as f:
                secret = f.read().strip()
                if len(secret) >= 32:
                    return secret
        secret = secrets.token_urlsafe(48)
        with open(JWT_SECRET_FILE, "w", encoding="utf-8") as f:
            f.write(secret)
        return secret
    except Exception:
        return secrets.token_urlsafe(48)

_JWT_SECRET = load_jwt_secret()

def jwt_encode(payload, secret=None):
    """简易 JWT 编码"""
    if secret is None:
        secret = _JWT_SECRET
    header = base64_urlencode(json.dumps({"alg": "HS256", "typ": "JWT"}))
    body = base64_urlencode(json.dumps(payload))
    signature = hashlib.sha256(f"{header}.{body}.{secret}".encode()).hexdigest()
    return f"{header}.{body}.{signature}"

def jwt_decode(token, secret=None):
    """简易 JWT 解码"""
    if secret is None:
        secret = _JWT_SECRET
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        expected = hashlib.sha256(f"{parts[0]}.{parts[1]}.{secret}".encode()).hexdigest()
        if parts[2] != expected:
            return None
        payload = json.loads(base64_urldecode(parts[1]))
        # 检查过期
        if payload.get("exp") and time.time() > payload["exp"]:
            return None
        return payload
    except:
        return None

def base64_urlencode(data):
    import base64
    return base64.urlsafe_b64encode(data.encode()).rstrip(b"=").decode()

def base64_urldecode(data):
    import base64
    padding = 4 - len(data) % 4
    if padding != 4:
        data += "=" * padding
    return base64.urlsafe_b64decode(data).decode()

def set_current_user_session(token, user):
    if not token or not user:
        return
    session = {
        "token": token,
        "user": {
            "username": user.get("username"),
            "email": user.get("email"),
            "is_verified": bool(user.get("is_verified", True))
        }
    }
    CURRENT_USER_SESSION.clear()
    CURRENT_USER_SESSION.update(session)
    try:
        with open(USER_SESSION_FILE, "w", encoding="utf-8") as f:
            json.dump(session, f, ensure_ascii=False)
    except Exception as e:
        print(f"[用户会话] 保存失败: {e}", flush=True)

def load_current_user_session():
    if CURRENT_USER_SESSION.get("token") and CURRENT_USER_SESSION.get("user"):
        return CURRENT_USER_SESSION
    try:
        if not os.path.exists(USER_SESSION_FILE):
            return CURRENT_USER_SESSION
        with open(USER_SESSION_FILE, "r", encoding="utf-8") as f:
            session = json.load(f)
        token = session.get("token")
        user = session.get("user")
        if token and user and jwt_decode(token):
            CURRENT_USER_SESSION.clear()
            CURRENT_USER_SESSION.update({"token": token, "user": user})
    except Exception as e:
        print(f"[用户会话] 读取失败: {e}", flush=True)
    return CURRENT_USER_SESSION

def clear_current_user_session():
    CURRENT_USER_SESSION.clear()
    try:
        if os.path.exists(USER_SESSION_FILE):
            os.remove(USER_SESSION_FILE)
    except Exception as e:
        print(f"[用户会话] 清理失败: {e}", flush=True)


# ==================== HTTP 服务 ====================
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler

class Handler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        print(f"[{time.strftime('%H:%M:%S')}] {args[0]}")

    def _client_ip(self):
        forwarded = (self.headers.get("X-Forwarded-For") or "").split(",")[0].strip()
        return forwarded or (self.client_address[0] if self.client_address else "")

    def _allow_origin(self):
        origin = self.headers.get("Origin", "")
        if not origin:
            return "*"
        parsed = urlparse(origin)
        host = parsed.hostname or ""
        if host in ("127.0.0.1", "localhost") or host.endswith("openget.cn"):
            return origin
        return "https://xs.openget.cn"

    def _send_json(self, code, data, extra_headers=None):
        try:
            body = json.dumps(data, ensure_ascii=False, default=str).encode("utf-8")
            self.send_response(code)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Access-Control-Allow-Origin", self._allow_origin())
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Login-Client")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.send_header("X-Frame-Options", "SAMEORIGIN")
            self.send_header("Referrer-Policy", "no-referrer")
            self.send_header("Cache-Control", "no-store")
            if extra_headers:
                for k, v in extra_headers.items():
                    self.send_header(k, v)
            self.end_headers()
            self.wfile.write(body)
        except (BrokenPipeError, ConnectionAbortedError, ConnectionResetError):
            print("[连接中断] 客户端在响应返回前断开连接", flush=True)

    def _send_text(self, code, text, content_type="text/plain; charset=utf-8"):
        try:
            body = text.encode("utf-8")
            self.send_response(code)
            self.send_header("Content-Type", content_type)
            self.send_header("Access-Control-Allow-Origin", self._allow_origin())
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Login-Client")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.send_header("X-Frame-Options", "SAMEORIGIN")
            self.send_header("Referrer-Policy", "no-referrer")
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(body)
        except (BrokenPipeError, ConnectionAbortedError, ConnectionResetError):
            print("[连接中断] 客户端在响应返回前断开连接", flush=True)

    def _send_file(self, code, filepath, content_type, disposition=None):
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()
            self.send_response(code)
            if "charset" not in content_type.lower():
                content_type = content_type + "; charset=utf-8"
            self.send_header("Content-Type", content_type)
            if disposition:
                self.send_header("Content-Disposition", disposition)
            self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
            self.send_header("Pragma", "no-cache")
            self.send_header("Expires", "0")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.send_header("X-Frame-Options", "SAMEORIGIN")
            self.send_header("Referrer-Policy", "no-referrer")
            self.end_headers()
            self.wfile.write(content.encode("utf-8"))
        except Exception as e:
            self._send_json(500, {"code": 500, "msg": f"文件读取失败: {str(e)}"})

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", self._allow_origin())
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Login-Client")
        self.send_header("Access-Control-Max-Age", "600")
        self.end_headers()

    def _read_body(self):
        length = int(self.headers.get("Content-Length", 0))
        return self.rfile.read(length).decode("utf-8") if length > 0 else "{}"

    def _get_user_from_token(self):
        """从请求头解析用户 Token"""
        auth = self.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
            if token in REVOKED_USER_TOKENS:
                return None
            payload = jwt_decode(token)
            if payload and payload.get("uid"):
                logout_after = USER_LOGOUT_AFTER.get(payload["uid"], 0)
                if logout_after and float(payload.get("iat") or 0) <= logout_after:
                    return None
                user = db.get_user_by_username(payload["uid"])
                return user
        return None

    def _check_admin(self):
        """验证管理员会话 Token"""
        auth = self.headers.get("Authorization", "")
        return verify_admin_session(auth)

    def do_GET(self):
        global PROVIDERS
        parsed = urlparse(self.path)
        path = parsed.path

        if path == "/":
            self._send_file(200, INTRO_HTML_FILE, "text/html; charset=utf-8")
        elif path == "/user" or path == "/user/" or path == "/login" or path == "/register" or path == "/forgot":
            self._send_file(200, USER_HTML_FILE, "text/html; charset=utf-8")
        elif path == "/admin" or path == "/admin/":
            self._send_file(200, ADMIN_HTML_FILE, "text/html; charset=utf-8")
        elif path == "/invite":
            # 推广邀请链接跳转到注册页，携带邀请码
            qs = parse_qs(parsed.query)
            code = qs.get("code", [""])[0]
            location = f"/register?code={code}" if code else "/register"
            self.send_response(302)
            self.send_header("Location", location)
            self.end_headers()
            return
        elif path in ("/script.user.js", "/xueshen.user.js", "/xueshen.js"):
            self._send_file(200, USER_SCRIPT_FILE, "application/javascript; charset=utf-8")
        elif path == "/xueshen-gf.js":
            self._send_file(200, XUESHEN_GF_FILE, "application/javascript; charset=utf-8", disposition='attachment; filename="xueshen-gf.js"')
        elif path == "/xueshen-sc.js":
            self._send_file(200, XUESHEN_SC_FILE, "application/javascript; charset=utf-8", disposition='attachment; filename="xueshen-sc.js"')
        elif path.startswith("/static/") or path.startswith("/libs/"):
            # 安全：防止路径穿越攻击（如 /static/../database.py）
            requested = os.path.normpath(os.path.join(BASE_DIR, path.lstrip("/")))
            base_real = os.path.realpath(BASE_DIR)
            requested_real = os.path.realpath(requested)
            if not requested_real.startswith(base_real + os.sep) and requested_real != base_real:
                self._send_json(403, {"code": 403, "msg": "forbidden"})
                return
            # 禁止访问 Python 源码和数据库文件（table.json 除外，脚本需要通过 @resource 加载）
            dangerous_exts = ('.py', '.db', '.sqlite', '.sqlite3', '.json', '.env', '.cfg', '.ini', '.key', '.pem')
            if requested_real.lower().endswith(dangerous_exts) and not requested_real.endswith('table.json'):
                self._send_json(403, {"code": 403, "msg": "forbidden"})
                return
            if os.path.exists(requested_real) and os.path.isfile(requested_real):
                content_type = "application/javascript" if requested_real.endswith(".js") else "text/plain"
                if requested_real.endswith(".css"):
                    content_type = "text/css"
                elif requested_real.endswith(".html"):
                    content_type = "text/html; charset=utf-8"
                elif requested_real.endswith(".json"):
                    content_type = "application/json"
                self._send_file(200, requested_real, content_type)
            else:
                self._send_json(404, {"code": 404, "msg": "not found"})
        elif path == "/api/slider-captcha/start":
            qs = parse_qs(parsed.query)
            scope = qs.get("scope", ["user"])[0]
            if scope not in ("user", "admin"):
                scope = "user"
            self._send_json(200, {"code": 200, "captcha": create_slider_captcha(scope, self._client_ip())})
        elif path == "/api/config":
            PROVIDERS = recover_providers_if_empty(PROVIDERS)
            self._send_json(200, {"code": 200, "models": build_models_html(), "providers": list(PROVIDERS.keys())})
        elif path == "/api/promotion/profile":
            user = self._get_user_from_token()
            if not user:
                self._send_json(401, {"code": 401, "msg": "未登录"})
                return
            p = db.get_referral_profile(user["username"])
            cfg = db.get_admin_config() or {}
            rate_val = float(cfg.get("referral_rate") or 0.1)
            days_val = int(cfg.get("referral_settle_days") or 7)
            min_w_val = float(cfg.get("referral_min_withdraw") or 10)
            print(f"[promo/profile] cfg raw: rate={cfg.get('referral_rate')} days={cfg.get('referral_settle_days')} min_w={cfg.get('referral_min_withdraw')} | parsed: rate={rate_val} days={days_val} min_w={min_w_val}")
            self._send_json(200, {"code": 200, "profile": {
                "invite_code": p["invite_code"],
                "invite_link": f"https://xs.openget.cn/invite?code={p['invite_code']}",
                "invited_count": p["invited_count"],
                "paid_commission": p["paid_commission"],
                "pending_commission": p["pending_commission"],
                "balance": p["balance"],
                "min_withdraw": min_w_val,
                "referral_rate": rate_val,
                "referral_settle_days": days_val,
                "enabled": bool(cfg.get("referral_enabled"))
            }})
        elif path == "/api/promotion/withdrawals":
            user = self._get_user_from_token()
            if not user:
                self._send_json(401, {"code": 401, "msg": "未登录"})
                return
            self._send_json(200, {"code": 200, "withdrawals": db.list_user_withdrawals(user["username"])})
        elif path == "/api/promotion/payment-info":
            user = self._get_user_from_token()
            if not user:
                self._send_json(401, {"code": 401, "msg": "未登录"})
                return
            info = db.get_user_payment_info(user["username"]) or {}
            self._send_json(200, {"code": 200, "info": {
                "alipay_account": info.get("alipay_account") or "",
                "alipay_qr": info.get("alipay_qr") or "",
                "wechat_account": info.get("wechat_account") or "",
                "wechat_qr": info.get("wechat_qr") or ""
            }})
        elif path == "/api/v1/auth":
            self._send_json(200, {"code": 200, "msg": "ok", "data": {"status": "running", "models": build_models_html()}})
        elif path == "/api/auth/current-session":
            session = load_current_user_session()
            token = session.get("token")
            session_user = session.get("user") or {}
            payload = jwt_decode(token) if token else None
            if not token or not payload or not payload.get("uid"):
                clear_current_user_session()
                self._send_json(403, {"code": 403, "msg": "请先登录后使用"})
                return
            if token in REVOKED_USER_TOKENS:
                clear_current_user_session()
                self._send_json(401, {"code": 401, "msg": "登录已退出，请重新登录"})
                return
            user = db.get_user_by_username(payload["uid"])
            if not user:
                clear_current_user_session()
                self._send_json(401, {"code": 401, "msg": "用户不存在或登录已失效"})
                return
            if user.get("is_banned"):
                clear_current_user_session()
                self._send_json(403, {"code": 403, "msg": "账号已被封禁：" + (user.get("ban_reason") or "请联系管理员")})
                return
            real_user = {
                "username": user["username"],
                "email": user["email"],
                "is_verified": bool(user.get("is_verified"))
            }
            if session_user != real_user:
                set_current_user_session(token, real_user)
            self._send_json(200, {"code": 200, "token": token, "user": real_user, "profile": build_user_profile(user["username"])})
        elif path == "/api/user/settings":
            user = self._get_user_from_token()
            if not user:
                self._send_json(401, {"code": 401, "msg": "未登录或 Token 已过期"})
                return
            try:
                settings, updated_at = db.get_user_settings(user["username"])
                self._send_json(200, {"code": 200, "settings": settings, "updated_at": updated_at})
            except Exception as e:
                self._send_json(500, {"code": 500, "msg": str(e)})
        elif path == "/api/user/profile":
            user = self._get_user_from_token()
            if not user:
                self._send_json(401, {"code": 401, "msg": "未登录或 Token 已过期"})
                return
            profile = build_user_profile(user["username"])
            self._send_json(200, {"code": 200, "profile": profile})
        elif path == "/api/user/dashboard":
            user = self._get_user_from_token()
            if not user:
                self._send_json(401, {"code": 401, "msg": "未登录或登录已过期"})
                return
            try:
                dashboard = db.get_user_dashboard(user["username"])
                profile = build_user_profile(user["username"])
                self._send_json(200, {"code": 200, "dashboard": dashboard, "profile": profile})
            except Exception as e:
                self._send_json(500, {"code": 500, "msg": str(e)})
        elif path == "/api/payment/plans":
            try:
                self._send_json(200, {"code": 200, "plans": db.list_payment_plans(only_enabled=True)})
            except Exception as e:
                self._send_json(500, {"code": 500, "msg": str(e)})

        elif path == "/api/user/script-key":
            user = self._get_user_from_token()
            if not user:
                self._send_json(401, {"code": 401, "msg": "未登录或 Token 已过期"})
                return
            try:
                username = user.get("username") or ""
                now = time.time()
                # 脚本密钥本质是给外部脚本使用的长期 Bearer Token，仍走同一套用户鉴权和权益扣减。
                script_key = jwt_encode({"uid": username, "typ": "script_key", "iat": now, "exp": now + 86400 * 180})
                self._send_json(200, {
                    "code": 200,
                    "msg": "脚本密钥已生成",
                    "script_key": script_key,
                    "expires_in_days": 180,
                    "user": {"username": username, "email": user.get("email") or ""}
                })
            except Exception as e:
                self._send_json(500, {"code": 500, "msg": str(e)})

        elif path == "/api/user/script-key/regenerate":
            user = self._get_user_from_token()
            if not user:
                self._send_json(401, {"code": 401, "msg": "未登录或 Token 已过期"})
                return
            try:
                username = user.get("username") or ""
                now = time.time()
                script_key = jwt_encode({"uid": username, "typ": "script_key", "iat": now, "exp": now + 86400 * 180})
                self._send_json(200, {
                    "code": 200,
                    "msg": "已重新生成脚本密钥",
                    "script_key": script_key,
                    "expires_in_days": 180,
                    "user": {"username": username, "email": user.get("email") or ""}
                })
            except Exception as e:
                self._send_json(500, {"code": 500, "msg": str(e)})

        # ===== 用户问题反馈 =====
        elif path == "/api/user/feedback":
            user = self._get_user_from_token()
            if not user:
                self._send_json(401, {"code": 401, "msg": "请先登录"})
                return
            feedback = db.list_user_feedback(user["username"])
            for r in feedback:
                r["created_at"] = str(r.get("created_at") or "")
                r["replied_at"] = str(r.get("replied_at") or "") if r.get("replied_at") else ""
                replies = db.list_feedback_replies(r["id"])
                for rp in replies:
                    rp["created_at"] = str(rp.get("created_at") or "")
                r["replies"] = replies
            self._send_json(200, {"code": 200, "feedback": feedback})

        elif path == "/api/payment/methods":
            try:
                admin = db.get_admin_config() or {}
                # 收集所有可用通道，按支付方式(支付宝/微信)分组
                alipay_channels = []  # [{"channel":"zhifufm","pay_type":"sandpayh5"}, ...]
                wechat_channels = []
                # 支付宝官方
                if admin.get("alipay_enabled") and admin.get("alipay_app_id") and admin.get("alipay_private_key"):
                    alipay_channels.append({"channel": "alipay", "pay_type": "alipay"})
                # 微信支付官方
                if admin.get("wechat_enabled") and admin.get("wechat_app_id") and admin.get("wechat_mch_id"):
                    wechat_channels.append({"channel": "wechat", "pay_type": "wechat"})
                # 支付FM-杉德支付（sandpayh5同时支持支付宝和微信）
                if admin.get("zhifufm_enabled") and admin.get("zhifufm_api_url") and admin.get("zhifufm_merchant_num") and admin.get("zhifufm_secret"):
                    alipay_channels.append({"channel": "zhifufm", "pay_type": "sandpayh5"})
                    wechat_channels.append({"channel": "zhifufm", "pay_type": "sandpayh5"})
                # 杉德河马
                if admin.get("sandpay_enabled") and admin.get("sandpay_mid") and admin.get("sandpay_api_url"):
                    alipay_channels.append({"channel": "sandpay", "pay_type": "alipay"})
                    wechat_channels.append({"channel": "sandpay", "pay_type": "wxpay"})
                # 易支付
                if admin.get("epay_enabled") and admin.get("epay_api_url") and admin.get("epay_pid") and admin.get("epay_key"):
                    alipay_channels.append({"channel": "epay", "pay_type": "alipay"})
                    wechat_channels.append({"channel": "epay", "pay_type": "wxpay"})
                # 返回扁平的支付方式列表
                methods = []
                if wechat_channels:
                    methods.append({"value": "wechat", "label": "微信支付", "channels": wechat_channels})
                if alipay_channels:
                    methods.append({"value": "alipay", "label": "支付宝支付", "channels": alipay_channels})
                self._send_json(200, {"code": 200, "methods": methods})
            except Exception as e:
                self._send_json(500, {"code": 500, "msg": str(e)})
        elif path == "/api/payment/order-status":
            user = self._get_user_from_token()
            if not user:
                self._send_json(401, {"code": 401, "msg": "未登录或 Token 已过期"})
                return
            try:
                qs = parse_qs(parsed.query)
                order_no = qs.get("order_no", [""])[0]
                order = db.get_order(order_no)
                if not order or order.get("username") != user["username"]:
                    self._send_json(404, {"code": 404, "msg": "订单不存在"})
                    return
                paid = order.get("status") == "paid"
                msg = "支付成功，权益已到账" if paid else "等待付款"
                # 支付宝官方通道支持主动查询
                if not paid and (order.get("pay_channel") == "alipay" or (not order.get("pay_channel") and order.get("pay_method") == "alipay")):
                    try:
                        paid, msg, order = query_and_apply_alipay_order(order_no)
                    except Exception:
                        pass
                self._send_json(200, {"code": 200, "paid": bool(paid), "status": (order or {}).get("status"), "msg": msg, "pay_url": (order or {}).get("pay_url"), "qr_code": (order or {}).get("qr_code"), "profile": build_user_profile(user["username"]) if paid else None})
            except Exception as e:
                self._send_json(500, {"code": 500, "msg": str(e)})
        elif path == "/api/payment/notify/zhifufm":
            # 支付FM异步回调
            try:
                qs = parse_qs(parsed.query)
                params = {k: v[0] for k, v in qs.items()}
                if verify_zhifufm_notify(params) and params.get("state") == "1":
                    order_no = params.get("orderNo", "")
                    order = db.get_order(order_no)
                    if order and order.get("status") != "paid":
                        db.apply_paid_order(order_no)
                    self._send_text(200, "success")
                else:
                    self._send_text(200, "fail")
            except Exception:
                self._send_text(200, "fail")
        elif path == "/api/payment/notify/sandpay":
            # 杉德河马异步回调（老版API格式：表单 charset=UTF-8&signType=01&sign=xxx&data={...}）
            try:
                body_raw = self.rfile.read(int(self.headers.get("Content-Length", 0))).decode("utf-8") if self.headers.get("Content-Length") else ""
                if body_raw:
                    # 优先尝试JSON
                    if body_raw.strip().startswith("{"):
                        params = json.loads(body_raw)
                    else:
                        # 表单格式解析（先URL解码）
                        from urllib.parse import parse_qs as _pqs, unquote as _unq
                        decoded = _unq(body_raw)
                        parsed_form = _pqs(decoded)
                        params = {}
                        for k, v in parsed_form.items():
                            params[k] = v[0]
                        # data字段再解析为JSON
                        if "data" in params and isinstance(params["data"], str):
                            try:
                                params["data"] = json.loads(params["data"])
                            except Exception:
                                pass
                else:
                    qs = parse_qs(parsed.query)
                    params = {k: v[0] for k, v in qs.items()}
                    if "data" in params and isinstance(params["data"], str):
                        try:
                            params["data"] = json.loads(params["data"])
                        except Exception:
                            pass
                if verify_sandpay_notify(params):
                    data_obj = params.get("data", {})
                    if isinstance(data_obj, str):
                        data_obj = json.loads(data_obj)
                    body_obj = data_obj.get("body", {}) if isinstance(data_obj, dict) else {}
                    head_obj = data_obj.get("head", {}) if isinstance(data_obj, dict) else {}
                    order_status = body_obj.get("orderStatus", "")
                    resp_code = head_obj.get("respCode", "")
                    order_no = body_obj.get("orderCode", "")
                    # 成功条件：respCode=000000 且 orderStatus=paid/success
                    if resp_code == "000000" and order_status in ("paid", "success"):
                        order = db.get_order(order_no)
                        if order and order.get("status") != "paid":
                            db.apply_paid_order(order_no)
                        self._send_text(200, "success")
                    else:
                        self._send_text(200, "fail")
                else:
                    self._send_text(200, "fail")
            except Exception:
                self._send_text(200, "fail")
        elif path == "/api/payment/notify/epay":
            # 易支付异步回调
            try:
                qs = parse_qs(parsed.query)
                params = {k: v[0] for k, v in qs.items()}
                if verify_epay_notify(params) and params.get("trade_status") == "TRADE_SUCCESS":
                    order_no = params.get("out_trade_no", "")
                    order = db.get_order(order_no)
                    if order and order.get("status") != "paid":
                        db.apply_paid_order(order_no)
                    self._send_text(200, "success")
                else:
                    self._send_text(200, "fail")
            except Exception:
                self._send_text(200, "fail")
        elif path.startswith("/admin/dashboard"):
            if not self._check_admin():
                self._send_json(403, {"code": 403, "msg": "未登录或 Token 失效"})
                return
            try:
                q = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
                sd = q.get("start", [""])[0]
                ed = q.get("end", [""])[0]
                self._send_json(200, {"code": 200, "data": get_admin_dashboard_stats(sd, ed)})
            except Exception as e:
                self._send_json(500, {"code": 500, "msg": str(e)})
        elif path == "/admin/config":
            if not self._check_admin():
                self._send_json(403, {"code": 403, "msg": "未登录或 Token 失效"})
                return
            PROVIDERS = refresh_providers_from_storage()
            self._send_json(200, {"code": 200, "config": {"providers": PROVIDERS}, "ready_count": provider_ready_count(PROVIDERS), "provider_count": len(PROVIDERS or {})})
        elif path == "/admin/email-config":
            if not self._check_admin():
                self._send_json(403, {"code": 403, "msg": "未登录或 Token 失效"})
                return
            admin = db.get_admin_config()
            servers = db.list_mail_servers()
            self._send_json(200, {"code": 200, "config": {
                "enabled": bool(admin.get("email_enabled")),
                "test_recipient": admin.get("test_recipient") or "",
                "servers": servers
            }})

        elif path == "/admin/account-config":
            if not self._check_admin():
                self._send_json(403, {"code": 403, "msg": "未登录或 Token 失效"})
                return
            admin = db.get_admin_config()
            self._send_json(200, {"code": 200, "config": {
                "username": admin.get("username") or "admin",
                "admin_email": admin.get("admin_email") or "",
                "avatar_data": admin.get("avatar_data") or ""
            }})
        elif path == "/admin/log-cleanup":
            if not self._check_admin():
                self._send_json(403, {"code": 403, "msg": "未登录或 Token 失效"})
                return
            try:
                retention = db.get_log_retention_days()
                self._send_json(200, {"code": 200, "retention_days": retention})
            except Exception as e:
                self._send_json(500, {"code": 500, "msg": str(e)})
        elif path == "/admin/payment-config":
            if not self._check_admin():
                self._send_json(403, {"code": 403, "msg": "未登录或 Token 失效"})
                return
            admin = db.get_admin_config()
            self._send_json(200, {"code": 200, "config": {
                "gift_type": admin.get("gift_type") or "none",
                "gift_points": int(admin.get("gift_points") or 0),
                "gift_days": int(admin.get("gift_days") or 0)
            }, "plans": db.list_payment_plans(False)})
        elif path == "/admin/pay-api-config":
            if not self._check_admin():
                self._send_json(403, {"code": 403, "msg": "未登录或 Token 失效"})
                return
            admin = db.get_admin_config()
            self._send_json(200, {"code": 200, "config": {
                "alipay_enabled": bool(admin.get("alipay_enabled")),
                "alipay_app_id": admin.get("alipay_app_id") or "",
                "alipay_private_key": admin.get("alipay_private_key") or "",
                "alipay_public_key": admin.get("alipay_public_key") or "",
                "alipay_gateway": admin.get("alipay_gateway") or "https://openapi.alipay.com/gateway.do",
                "wechat_enabled": bool(admin.get("wechat_enabled")),
                "wechat_app_id": admin.get("wechat_app_id") or "",
                "wechat_mch_id": admin.get("wechat_mch_id") or "",
                "wechat_api_key": admin.get("wechat_api_key") or "",
                "wechat_api_v3_key": admin.get("wechat_api_v3_key") or "",
                "wechat_serial_no": admin.get("wechat_serial_no") or "",
                "wechat_private_key": admin.get("wechat_private_key") or "",
                "wechat_notify_url": admin.get("wechat_notify_url") or "",
                "zhifufm_enabled": bool(admin.get("zhifufm_enabled")),
                "zhifufm_api_url": admin.get("zhifufm_api_url") or "",
                "zhifufm_merchant_num": admin.get("zhifufm_merchant_num") or "",
                "zhifufm_secret": admin.get("zhifufm_secret") or "",
                "zhifufm_notify_url": admin.get("zhifufm_notify_url") or "",
                "zhifufm_return_url": admin.get("zhifufm_return_url") or "",
                "sandpay_enabled": bool(admin.get("sandpay_enabled")),
                "sandpay_mid": admin.get("sandpay_mid") or "",
                "sandpay_api_url": admin.get("sandpay_api_url") or "",
                "sandpay_private_key": admin.get("sandpay_private_key") or "",
                "sandpay_public_key": admin.get("sandpay_public_key") or "",
                "sandpay_merchant_public_key": admin.get("sandpay_merchant_public_key") or "",
                "sandpay_notify_url": admin.get("sandpay_notify_url") or "",
                "sandpay_return_url": admin.get("sandpay_return_url") or "",
                "epay_enabled": bool(admin.get("epay_enabled")),
                "epay_api_url": admin.get("epay_api_url") or "",
                "epay_pid": admin.get("epay_pid") or "",
                "epay_key": admin.get("epay_key") or "",
                "epay_notify_url": admin.get("epay_notify_url") or "",
                "epay_return_url": admin.get("epay_return_url") or "",
                "alipay_weight": int(admin.get("alipay_weight") or 100),
                "wechat_weight": int(admin.get("wechat_weight") or 100),
                "zhifufm_weight": int(admin.get("zhifufm_weight") or 100),
                "sandpay_weight": int(admin.get("sandpay_weight") or 100),
                "epay_weight": int(admin.get("epay_weight") or 100)
            }})
        elif path.startswith("/admin/users"):
            if not self._check_admin():
                self._send_json(403, {"code": 403, "msg": "未登录或 Token 失效"})
                return
            try:
                # 解析查询参数
                query_params = urllib.parse.parse_qs(parsed.query)
                search = (query_params.get("search", [""])[0] or "").strip()
                sort_by = (query_params.get("sort_by", ["created_at"])[0] or "created_at").strip()
                sort_order = (query_params.get("sort_order", ["desc"])[0] or "desc").strip().lower()
                # 白名单校验排序字段
                allowed_sort = {"created_at", "last_login_at", "id", "username", "points_balance"}
                if sort_by not in allowed_sort:
                    sort_by = "created_at"
                if sort_order not in ("asc", "desc"):
                    sort_order = "desc"
                # 处理 last_login_at 排序时 NULL 值问题
                sort_expr = f"{'COALESCE(last_login_at, created_at)' if sort_by == 'last_login_at' else sort_by} {sort_order}" if sort_by == 'last_login_at' else f"{sort_by} {sort_order}"
                # 构建查询
                sql = "SELECT id, username, email, is_verified, points_balance, member_until, is_banned, ban_reason, created_at, last_login_at FROM users"
                params_list = []
                if search:
                    sql += " WHERE username LIKE %s OR email LIKE %s"
                    like = f"%{search}%"
                    params_list = [like, like]
                sql += f" ORDER BY {sort_expr} LIMIT 500"
                users_list = db.fetchall(sql, tuple(params_list)) if params_list else db.fetchall(sql)
                self._send_json(200, {"code": 200, "users": users_list})
            except Exception as e:
                self._send_json(500, {"code": 500, "msg": str(e)})
        elif path == "/admin/login-locks":
            if not self._check_admin():
                self._send_json(403, {"code": 403, "msg": "未登录或 Token 失效"})
                return
            try:
                db.cleanup_expired_login_locks()
                locks = db.list_active_login_locks("user")
                self._send_json(200, {"code": 200, "locks": locks})
            except Exception as e:
                self._send_json(500, {"code": 500, "msg": str(e)})
        elif path == "/admin/ai-logs":
            if not self._check_admin():
                self._send_json(403, {"code": 403, "msg": "未登录或 Token 失效"})
                return
            try:
                qs = parse_qs(parsed.query)
                limit = qs.get("limit", ["100"])[0]
                page = qs.get("page", ["1"])[0]
                status = qs.get("status", [""])[0]
                model = qs.get("model", [""])[0]
                keyword = qs.get("keyword", [""])[0]
                date_from = qs.get("date_from", [""])[0]
                date_to = qs.get("date_to", [""])[0]
                logs = db.get_ai_call_logs(limit=limit, status=status, model=model, keyword=keyword, date_from=date_from, date_to=date_to, page=page)
                total = db.count_ai_call_logs(status=status, model=model, keyword=keyword, date_from=date_from, date_to=date_to)
                self._send_json(200, {"code": 200, "logs": logs, "total": total, "page": int(page or 1), "limit": int(limit or 100)})
            except Exception as e:
                self._send_json(500, {"code": 500, "msg": str(e)})
        elif path == "/api/script-logs/recent":
            try:
                user = self._get_user_from_token()
                if not user:
                    self._send_json(401, {"code": 401, "msg": "未登录"})
                    return
                qs = parse_qs(parsed.query)
                limit = int(qs.get("limit", ["50"])[0])
                level = qs.get("level", [""])[0]
                keyword = qs.get("keyword", [""])[0]
                if limit > 200:
                    limit = 200
                logs = db.get_script_event_logs(limit=limit, page=1, username=user.get("username", ""), level=level, keyword=keyword)
                self._send_json(200, {"code": 200, "logs": logs})
            except Exception as e:
                self._send_json(500, {"code": 500, "msg": str(e)})
        elif path == "/admin/script-logs":
            if not self._check_admin():
                self._send_json(403, {"code": 403, "msg": "未登录或 Token 失效"})
                return
            try:
                qs = parse_qs(parsed.query)
                limit = qs.get("limit", ["100"])[0]
                page = qs.get("page", ["1"])[0]
                username = qs.get("username", [""])[0]
                level = qs.get("level", [""])[0]
                keyword = qs.get("keyword", [""])[0]
                date_from = qs.get("date_from", [""])[0]
                date_to = qs.get("date_to", [""])[0]
                logs = db.get_script_event_logs(limit=limit, page=page, username=username, level=level, keyword=keyword, date_from=date_from, date_to=date_to)
                total = db.count_script_event_logs(username=username, level=level, keyword=keyword, date_from=date_from, date_to=date_to)
                self._send_json(200, {"code": 200, "logs": logs, "total": total, "page": int(page or 1), "limit": int(limit or 100)})
            except Exception as e:
                self._send_json(500, {"code": 500, "msg": str(e)})
        elif path == "/admin/question-bank":
            if not self._check_admin():
                self._send_json(403, {"code": 403, "msg": "未登录或 Token 失效"})
                return
            try:
                qs = parse_qs(parsed.query)
                limit = qs.get("limit", ["100"])[0]
                page = qs.get("page", ["1"])[0]
                keyword = qs.get("keyword", [""])[0]
                rows = db.search_question_bank(keyword=keyword, limit=limit, page=page)
                total = db.count_question_bank(keyword=keyword)
                self._send_json(200, {"code": 200, "items": rows, "total": total, "page": int(page or 1), "limit": int(limit or 100)})
            except Exception as e:
                self._send_json(500, {"code": 500, "msg": str(e)})

        # ==================== 推广返利管理（GET） ====================
        elif path == "/admin/referral/config":
            if not self._check_admin():
                self._send_json(403, {"code": 403, "msg": "未登录或 Token 失效"})
                return
            a = db.get_admin_config() or {}
            self._send_json(200, {"code": 200, "config": {
                "referral_enabled": bool(a.get("referral_enabled")),
                "referral_rate": float(a.get("referral_rate") or 0.1),
                "referral_min_withdraw": float(a.get("referral_min_withdraw") or 10),
                "referral_settle_days": int(a.get("referral_settle_days") or 7)
            }})
        elif path == "/admin/referral/withdrawals":
            if not self._check_admin():
                self._send_json(403, {"code": 403, "msg": "未登录或 Token 失效"})
                return
            qs = parse_qs(parsed.query)
            status = qs.get("status", [""])[0]
            rows = db.list_admin_withdrawals(status if status in ("pending", "approved", "rejected") else None)
            self._send_json(200, {"code": 200, "withdrawals": rows, "summary": db.withdrawal_summary()})
        elif path == "/admin/referral/stats":
            if not self._check_admin():
                self._send_json(403, {"code": 403, "msg": "未登录或 Token 失效"})
                return
            self._send_json(200, {"code": 200, "stats": db.referral_stats()})

        # ==================== 支付明细管理 ====================
        elif path == "/admin/payment-orders":
            if not self._check_admin():
                self._send_json(403, {"code": 403, "msg": "未登录或 Token 失效"})
                return
            qs = parse_qs(parsed.query)
            result = db.list_payment_orders_admin(
                username=qs.get("username", [""])[0],
                status=qs.get("status", [""])[0],
                plan_name=qs.get("plan_name", [""])[0],
                date_from=qs.get("date_from", [""])[0],
                date_to=qs.get("date_to", [""])[0],
                sort=qs.get("sort", ["created_at"])[0],
                order=qs.get("order", ["desc"])[0],
                page=int(qs.get("page", ["1"])[0] or 1),
                page_size=int(qs.get("page_size", ["20"])[0] or 20)
            )
            for r in result["rows"]:
                r["price"] = float(r.get("price") or 0)
                r["created_at"] = str(r.get("created_at") or "")
            self._send_json(200, {"code": 200, "data": result})

        # ==================== 问题反馈管理（GET） ====================
        elif path == "/admin/feedback":
            if not self._check_admin():
                self._send_json(403, {"code": 403, "msg": "未登录或 Token 失效"})
                return
            db.auto_close_expired_feedback(db.get_feedback_auto_close_days() or 7)
            qs = parse_qs(parsed.query)
            result = db.list_feedback_admin(
                status=qs.get("status", [""])[0],
                category=qs.get("category", [""])[0],
                keyword=qs.get("keyword", [""])[0],
                page=int(qs.get("page", ["1"])[0] or 1),
                page_size=int(qs.get("page_size", ["20"])[0] or 20)
            )
            for r in result["rows"]:
                r["created_at"] = str(r.get("created_at") or "")
                r["replied_at"] = str(r.get("replied_at") or "") if r.get("replied_at") else ""
            self._send_json(200, {"code": 200, "data": result})

        elif path == "/admin/feedback-auto-close":
            if not self._check_admin():
                self._send_json(403, {"code": 403, "msg": "未登录或 Token 失效"})
                return
            try:
                self._send_json(200, {"code": 200, "days": db.get_feedback_auto_close_days()})
            except Exception as e:
                self._send_json(500, {"code": 500, "msg": str(e)})

        elif path.startswith("/admin/feedback/"):
            if not self._check_admin():
                self._send_json(403, {"code": 403, "msg": "未登录或 Token 失效"})
                return
            fid = path.split("/")[-1]
            if not fid.isdigit():
                self._send_json(400, {"code": 400, "msg": "反馈ID无效"})
                return
            fb = db.get_feedback_by_id(int(fid))
            if not fb:
                self._send_json(404, {"code": 404, "msg": "反馈不存在"})
                return
            fb["created_at"] = str(fb.get("created_at") or "")
            fb["replied_at"] = str(fb.get("replied_at") or "") if fb.get("replied_at") else ""
            replies = db.list_feedback_replies(int(fid))
            for rp in replies:
                rp["created_at"] = str(rp.get("created_at") or "")
            fb["replies"] = replies
            self._send_json(200, {"code": 200, "feedback": fb})

        # ==================== 邮件模板管理（GET） ====================
        elif path == "/admin/email-templates":
            if not self._check_admin():
                self._send_json(403, {"code": 403, "msg": "未登录或 Token 失效"})
                return
            self._send_json(200, {"code": 200, "templates": db.list_email_templates()})

        # ==================== 每日数据邮件（GET） ====================
        elif path == "/admin/daily-report/config":
            if not self._check_admin():
                self._send_json(403, {"code": 403, "msg": "未登录或 Token 失效"})
                return
            self._send_json(200, {"code": 200, "config": db.get_daily_report_config() or {}})

        elif path == "/admin/feedback-notify/config":
            if not self._check_admin():
                self._send_json(403, {"code": 403, "msg": "未登录或 Token 失效"})
                return
            self._send_json(200, {"code": 200, "enabled": db.get_feedback_notify_enabled()})

        elif path == "/admin/daily-report/preview":
            if not self._check_admin():
                self._send_json(403, {"code": 403, "msg": "未登录或 Token 失效"})
                return
            import datetime as _dt
            stat_date = (_dt.date.today() - _dt.timedelta(days=1)).strftime("%Y-%m-%d")
            self._send_json(200, {"code": 200, "date": stat_date, "stats": get_daily_report_stats(stat_date)})

        elif path.startswith("/admin/email-template/"):
            if not self._check_admin():
                self._send_json(403, {"code": 403, "msg": "未登录或 Token 失效"})
                return
            tid = path.split("/")[-1]
            if not tid.isdigit():
                self._send_json(400, {"code": 400, "msg": "模板ID无效"})
                return
            template = db.get_email_template(int(tid))
            if template:
                self._send_json(200, {"code": 200, "template": template})
            else:
                self._send_json(404, {"code": 404, "msg": "模板不存在"})

        else:
            self._send_json(404, {"code": 404, "msg": "not found"})

    def do_POST(self):
        global PROVIDERS
        parsed = urlparse(self.path)
        path = parsed.path
        body = self._read_body()

        if path == "/api/slider-captcha/verify":
            try:
                data = json.loads(body or "{}")
                scope = data.get("scope") or "user"
                if scope not in ("user", "admin"):
                    scope = "user"
                token, err = verify_slider_captcha(data.get("id"), data.get("x"), scope, self._client_ip())
                if not token:
                    self._send_json(400, {"code": 400, "msg": err})
                    return
                self._send_json(200, {"code": 200, "token": token, "msg": "验证通过"})
            except Exception as e:
                self._send_json(500, {"code": 500, "msg": str(e)})

        # ========== 用户认证接口 ==========
        elif path == "/api/auth/register":
            try:
                data = json.loads(body)
                username = data.get("username", "").strip()
                email = data.get("email", "").strip()
                # 安全：优先使用前端加密的 password_hash，兼容旧版明文 password
                password = (data.get("password_hash") or data.get("password") or "").strip()
                code = data.get("code", "").strip()
                if not all([username, email, password, code]):
                    self._send_json(400, {"code": 400, "msg": "请填写完整信息"})
                    return
                if len(password) < 6:
                    self._send_json(400, {"code": 400, "msg": "密码至少6位"})
                    return
                # 验证验证码
                ok, err = db.check_verify_code(email, code, "register")
                if not ok:
                    self._send_json(400, {"code": 400, "msg": err})
                    return
                # 创建用户
                invite_code = (data.get("invite_code") or "").strip()
                success, err = db.create_user(username, email, hash_password(password), invite_code=invite_code or None)
                if not success:
                    self._send_json(400, {"code": 400, "msg": "用户名或邮箱已被注册"})
                    return
                db.verify_user_email(email)
                db.grant_registration_gift(username)
                token = jwt_encode({"uid": username, "iat": time.time(), "exp": time.time() + 86400 * 7})
                session_user = {"username": username, "email": email, "is_verified": True}
                set_current_user_session(token, session_user)
                self._send_json(200, {"code": 200, "msg": "注册成功", "token": token, "user": session_user, "profile": build_user_profile(username)})
            except Exception as e:
                self._send_json(500, {"code": 500, "msg": str(e)})

        elif path == "/api/auth/login":
            try:
                data = json.loads(body)
                username = data.get("username", "").strip()
                # 安全：优先使用前端加密的 password_hash，兼容旧版明文 password
                password = (data.get("password_hash") or data.get("password") or "").strip()
                if not all([username, password]):
                    self._send_json(400, {"code": 400, "msg": "请填写用户名/邮箱和密码"})
                    return
                if data.get("login_scene") == "web" and not consume_slider_token(data.get("slider_token"), "user", self._client_ip()):
                    self._send_json(400, {"code": 400, "msg": "请先完成滑块验证"})
                    return
                allowed, retry_after = check_login_rate("user", self._client_ip(), username)
                if not allowed:
                    self._send_json(429, {"code": 429, "msg": f"登录失败次数过多，请 {retry_after} 秒后再试"}, {"Retry-After": str(retry_after)})
                    return
                user = db.get_user_by_email(username) if "@" in username else db.get_user_by_username(username)
                if not user and "@" not in username:
                    user = db.get_user_by_email(username)
                if not user or not verify_password(password, user["password_hash"]):
                    retry_after = record_login_failure("user", self._client_ip(), username, user)
                    if retry_after:
                        self._send_json(429, {"code": 429, "msg": f"登录失败次数过多，请 {retry_after} 秒后再试"}, {"Retry-After": str(retry_after)})
                        return
                    self._send_json(401, {"code": 401, "msg": "用户名或密码错误"})
                    return
                # 安全：如果密码是旧版无盐哈希，登录成功后自动升级为 PBKDF2
                if is_legacy_password(user.get("password_hash")):
                    try:
                        db.update_password(user["email"], hash_password(password))
                    except Exception:
                        pass
                if user.get("is_banned"):
                    self._send_json(403, {"code": 403, "msg": "账号已被封禁：" + (user.get("ban_reason") or "请联系管理员")})
                    return
                if not user.get("is_verified"):
                    self._send_json(401, {"code": 401, "msg": "账号未验证邮箱，请先验证"})
                    return
                real_username = user["username"]
                token = jwt_encode({"uid": real_username, "iat": time.time(), "exp": time.time() + 86400 * 7})
                session_user = {"username": real_username, "email": user["email"], "is_verified": bool(user.get("is_verified"))}
                set_current_user_session(token, session_user)
                clear_login_failures("user", self._client_ip(), username)
                try:
                    ph = "%s"
                    db.execute(f"UPDATE users SET last_login_at = NOW() WHERE username = {ph}", (real_username,))
                except Exception:
                    pass
                self._send_json(200, {"code": 200, "msg": "登录成功", "token": token, "user": session_user, "profile": build_user_profile(real_username)})
            except Exception as e:
                self._send_json(500, {"code": 500, "msg": str(e)})

        elif path == "/api/auth/send-verify":
            try:
                data = json.loads(body)
                email = data.get("email", "").strip()
                vtype = data.get("type", "register")  # register or reset
                req_username = (data.get("username") or "").strip()  # 注册时前端传来的用户名
                if not email:
                    self._send_json(400, {"code": 400, "msg": "请输入邮箱"})
                    return
                # 安全：验证码发送限流，防止邮件轰炸
                ok, err_msg = check_verify_code_rate(self._client_ip(), email)
                if not ok:
                    self._send_json(429, {"code": 429, "msg": err_msg})
                    return
                admin = db.get_admin_config()
                if not admin or not admin.get("email_enabled"):
                    self._send_json(400, {"code": 400, "msg": "邮件服务未启用，请联系管理员"})
                    return
                # 如果是注册，检查邮箱是否已被注册
                if vtype == "register" and db.get_user_by_email(email):
                    self._send_json(400, {"code": 400, "msg": "该邮箱已被注册"})
                    return
                # 生成验证码
                code = generate_code(6)
                db.save_verify_code(email, code, vtype, expires_minutes=10)
                # 发送邮件（优先使用模板，无模板则使用默认内容）
                scene = "user_register" if vtype == "register" else "user_reset"
                if vtype == "register":
                    fallback_subject = "学神助手 - 注册验证码"
                    fallback_html = f"<p>您的注册验证码是：<b style='font-size:24px;color:#3b82f6;'>{code}</b></p><p>验证码10分钟内有效，请勿泄露给他人。</p>"
                else:
                    fallback_subject = "学神助手 - 密码重置验证码"
                    fallback_html = f"<p>您的密码重置验证码是：<b style='font-size:24px;color:#3b82f6;'>{code}</b></p><p>验证码10分钟内有效，请勿泄露给他人。</p>"
                # 获取真实用户名：注册用前端传入，重置查数据库，都没有才用邮箱前缀回退
                if vtype == "register":
                    username_fallback = req_username
                elif vtype == "reset":
                    existing_user = db.get_user_by_email(email)
                    username_fallback = (existing_user.get("username") or "").strip() if existing_user else ""
                else:
                    username_fallback = ""
                if not username_fallback:
                    username_fallback = email.split("@")[0] if email and "@" in email else email
                success, err = send_email(email, fallback_subject, body_html=fallback_html, scene=scene, variables={"username": username_fallback, "code": code, "subject": fallback_subject})
                if success:
                    self._send_json(200, {"code": 200, "msg": "验证码已发送"})
                else:
                    self._send_json(500, {"code": 500, "msg": err})
            except Exception as e:
                self._send_json(500, {"code": 500, "msg": str(e)})

        elif path == "/api/auth/resend-verify":
            try:
                data = json.loads(body)
                email = data.get("email", "").strip()
                vtype = data.get("type", "register")  # register or reset
                if not email:
                    self._send_json(400, {"code": 400, "msg": "请输入邮箱"})
                    return
                # 安全：验证码发送限流，防止邮件轰炸
                ok, err_msg = check_verify_code_rate(self._client_ip(), email)
                if not ok:
                    self._send_json(429, {"code": 429, "msg": err_msg})
                    return
                admin = db.get_admin_config()
                if not admin or not admin.get("email_enabled"):
                    self._send_json(400, {"code": 400, "msg": "邮件服务未启用，请联系管理员"})
                    return
                # 注册场景仍校验邮箱是否已被注册
                if vtype == "register" and db.get_user_by_email(email):
                    self._send_json(400, {"code": 400, "msg": "该邮箱已被注册"})
                    return
                # 重新生成验证码并通过腾讯云邮件服务器补发
                code = generate_code(6)
                db.save_verify_code(email, code, vtype, expires_minutes=10)
                scene = "user_register" if vtype == "register" else "user_reset"
                if vtype == "register":
                    fallback_subject = "学神助手 - 注册验证码（补发）"
                else:
                    fallback_subject = "学神助手 - 密码重置验证码（补发）"
                if vtype == "reset":
                    existing_user = db.get_user_by_email(email)
                    username_fallback = (existing_user.get("username") or "").strip() if existing_user else ""
                else:
                    username_fallback = (data.get("username") or "").strip()
                if not username_fallback:
                    username_fallback = email.split("@")[0] if email and "@" in email else email
                success, err = send_email(email, fallback_subject, scene=scene, variables={"username": username_fallback, "code": code, "subject": fallback_subject}, resend=True)
                if success:
                    self._send_json(200, {"code": 200, "msg": "补发邮件已通过腾讯云发送，请查收"})
                else:
                    self._send_json(500, {"code": 500, "msg": err})
            except Exception as e:
                self._send_json(500, {"code": 500, "msg": str(e)})

        elif path == "/api/auth/reset-password":
            try:
                data = json.loads(body)
                email = data.get("email", "").strip()
                code = data.get("code", "").strip()
                # 安全：优先使用前端加密的 new_password_hash，兼容旧版明文 new_password
                new_password = (data.get("new_password_hash") or data.get("new_password") or "").strip()
                if not all([email, code, new_password]):
                    self._send_json(400, {"code": 400, "msg": "请填写完整信息"})
                    return
                if len(new_password) < 6:
                    self._send_json(400, {"code": 400, "msg": "密码至少6位"})
                    return
                ok, err = db.check_verify_code(email, code, "reset")
                if not ok:
                    self._send_json(400, {"code": 400, "msg": err})
                    return
                db.update_password(email, hash_password(new_password))
                self._send_json(200, {"code": 200, "msg": "密码重置成功"})
            except Exception as e:
                self._send_json(500, {"code": 500, "msg": str(e)})

        elif path == "/api/auth/me":
            user = self._get_user_from_token()
            if not user:
                self._send_json(401, {"code": 401, "msg": "未登录或 Token 已过期"})
                return
            self._send_json(200, {"code": 200, "user": {"username": user["username"], "email": user["email"], "is_verified": bool(user.get("is_verified"))}})

        elif path == "/api/auth/sync-session":
            auth = self.headers.get("Authorization", "")
            user = self._get_user_from_token()
            if not user or not auth.startswith("Bearer "):
                self._send_json(401, {"code": 401, "msg": "未登录或 Token 已过期"})
                return
            session_user = {"username": user["username"], "email": user["email"], "is_verified": bool(user.get("is_verified"))}
            set_current_user_session(auth[7:], session_user)
            self._send_json(200, {"code": 200, "msg": "会话已同步", "token": auth[7:], "user": session_user})

        elif path == "/api/power/keep-awake":
            user = self._get_user_from_token()
            if not user:
                self._send_json(401, {"code": 401, "msg": "未登录或 Token 已过期"})
                return
            try:
                data = json.loads(body or "{}")
                enabled = bool(data.get("enabled"))
                ok, msg = set_system_keep_awake(enabled)
                self._send_json(200 if ok else 500, {
                    "code": 200 if ok else 500,
                    "msg": msg,
                    "enabled": POWER_KEEP_AWAKE_ENABLED
                })
            except Exception as e:
                self._send_json(500, {"code": 500, "msg": str(e), "enabled": POWER_KEEP_AWAKE_ENABLED})

        elif path == "/api/auth/logout":
            auth = self.headers.get("Authorization", "")
            if auth.startswith("Bearer "):
                token = auth[7:]
                REVOKED_USER_TOKENS.add(token)
                payload = jwt_decode(token)
                if payload and payload.get("uid"):
                    USER_LOGOUT_AFTER[payload["uid"]] = time.time()
                    if CURRENT_USER_SESSION.get("user", {}).get("username") == payload["uid"]:
                        clear_current_user_session()
            self._send_json(200, {"code": 200, "msg": "已退出登录"})

        elif path == "/api/user/settings":
            user = self._get_user_from_token()
            if not user:
                self._send_json(401, {"code": 401, "msg": "未登录或 Token 已过期"})
                return
            try:
                data = json.loads(body or "{}")
                settings = data.get("settings") or {}
                if not isinstance(settings, dict):
                    self._send_json(400, {"code": 400, "msg": "settings 必须是对象"})
                    return
                db.save_user_settings(user["username"], settings)
                self._send_json(200, {"code": 200, "msg": "设置已同步"})
            except Exception as e:
                self._send_json(500, {"code": 500, "msg": str(e)})

        # ===== 用户问题反馈 POST =====
        elif path == "/api/user/feedback":
            user = self._get_user_from_token()
            if not user:
                self._send_json(401, {"code": 401, "msg": "请先登录"})
                return
            try:
                data = json.loads(body or "{}")
                category = (data.get("category") or "other").strip()
                title = (data.get("title") or "").strip()
                content = (data.get("content") or "").strip()
                if not title or not content:
                    self._send_json(400, {"code": 400, "msg": "标题和内容不能为空"})
                    return
                if len(title) > 200:
                    self._send_json(400, {"code": 400, "msg": "标题不能超过200字"})
                    return
                if len(content) > 5000:
                    self._send_json(400, {"code": 400, "msg": "内容不能超过5000字"})
                    return
                allowed_categories = {"bug", "feature", "payment", "account", "other"}
                if category not in allowed_categories:
                    category = "other"
                email = user.get("email") or ""
                db.create_feedback(user["username"], email, category, title, content)
                threading.Thread(target=_send_feedback_notify, args=(None, "new", user["username"], category, title, content), daemon=True).start()
                self._send_json(200, {"code": 200, "msg": "提交成功"})
            except Exception as e:
                self._send_json(500, {"code": 500, "msg": str(e)})

        # 用户追问回复
        elif path == "/api/user/feedback/reply":
            user = self._get_user_from_token()
            if not user:
                self._send_json(401, {"code": 401, "msg": "请先登录"})
                return
            try:
                data = json.loads(body or "{}")
                feedback_id = int(data.get("feedback_id") or 0)
                content = (data.get("content") or "").strip()
                if not feedback_id or not content:
                    self._send_json(400, {"code": 400, "msg": "反馈ID和内容不能为空"})
                    return
                if len(content) > 5000:
                    self._send_json(400, {"code": 400, "msg": "内容不能超过5000字"})
                    return
                fb = db.get_feedback_by_id(feedback_id)
                if not fb or fb.get("username") != user["username"]:
                    self._send_json(403, {"code": 403, "msg": "无权操作此反馈"})
                    return
                if fb.get("status") == "closed":
                    self._send_json(400, {"code": 400, "msg": "该反馈已关闭，无法继续回复"})
                    return
                db.add_feedback_reply(feedback_id, "user", content)
                db.update_feedback_status(feedback_id, "processing")
                threading.Thread(target=_send_feedback_notify, args=(feedback_id, "reply", fb.get("username",""), fb.get("category",""), fb.get("title",""), content), daemon=True).start()
                self._send_json(200, {"code": 200, "msg": "回复成功"})
            except Exception as e:
                self._send_json(500, {"code": 500, "msg": str(e)})

        # ========== 推广返利（用户端 POST） ==========
        elif path == "/api/promotion/withdraw":
            user = self._get_user_from_token()
            if not user:
                self._send_json(401, {"code": 401, "msg": "未登录"})
                return
            try:
                data = json.loads(body or "{}")
                cfg = db.get_admin_config() or {}
                if not int(cfg.get("referral_enabled") or 0):
                    self._send_json(400, {"code": 400, "msg": "推广返利未开启"})
                    return
                amount = round(float(data.get("amount") or 0), 2)
                min_w = float(cfg.get("referral_min_withdraw") or 10)
                if amount < min_w:
                    self._send_json(400, {"code": 400, "msg": f"最低提现 {min_w} 元"})
                    return
                pay_method = (data.get("pay_method") or "").strip()
                if pay_method not in ("alipay", "wechat"):
                    self._send_json(400, {"code": 400, "msg": "收款方式无效"})
                    return
                pay_account = (data.get("pay_account") or "").strip()
                qr = (data.get("qr_code") or "").strip()
                if not pay_account:
                    self._send_json(400, {"code": 400, "msg": "请填写收款账号"})
                    return
                if qr and (not qr.startswith("data:image/") or len(qr) > 1024 * 1024):
                    self._send_json(400, {"code": 400, "msg": "二维码格式不正确或过大"})
                    return
                ok, msg = db.create_withdrawal(user["username"], amount, pay_method, pay_account, qr)
                self._send_json(200 if ok else 400, {"code": 200 if ok else 400, "msg": msg})
            except Exception as e:
                self._send_json(500, {"code": 500, "msg": str(e)})

        elif path == "/api/promotion/payment-info":
            user = self._get_user_from_token()
            if not user:
                self._send_json(401, {"code": 401, "msg": "未登录"})
                return
            try:
                data = json.loads(body or "{}")
                def _clean_qr(v):
                    v = (v or "").strip()
                    if v and (not v.startswith("data:image/") or len(v) > 1024 * 1024):
                        raise ValueError("二维码格式不正确或过大")
                    return v
                alipay_account = (data.get("alipay_account") or "").strip()
                alipay_qr = _clean_qr(data.get("alipay_qr"))
                wechat_account = (data.get("wechat_account") or "").strip()
                wechat_qr = _clean_qr(data.get("wechat_qr"))
                db.save_user_payment_info(user["username"], alipay_account, alipay_qr, wechat_account, wechat_qr)
                self._send_json(200, {"code": 200, "msg": "收款信息已保存"})
            except ValueError as e:
                self._send_json(400, {"code": 400, "msg": str(e)})
            except Exception as e:
                self._send_json(500, {"code": 500, "msg": str(e)})

        elif path == "/api/payment/purchase":
            user = self._get_user_from_token()
            if not user:
                self._send_json(401, {"code": 401, "msg": "未登录或 Token 已过期"})
                return
            try:
                ent = db.get_user_entitlement(user["username"])
                if ent and ent.get("is_banned"):
                    self._send_json(403, {"code": 403, "msg": "账号已被封禁，无法购买"})
                    return
                data = json.loads(body or "{}")
                plan = db.get_payment_plan(int(data.get("plan_id") or 0))
                if not plan or not plan.get("enabled"):
                    self._send_json(404, {"code": 404, "msg": "套餐不存在或未启用"})
                    return
                if float(plan.get("price") or 0) <= 0:
                    # 安全：免费套餐每人限领一次，防止重复领取
                    existing = db.fetchall(
                        "SELECT id FROM payment_orders WHERE username = %s AND plan_id = %s AND status = 'paid'",
                        (user["username"], int(plan.get("id") or 0))
                    )
                    if existing:
                        self._send_json(400, {"code": 400, "msg": "该免费套餐已领取过，不可重复领取"})
                        return
                    order_no = db.create_paid_order_and_apply(user["username"], plan)
                    self._send_json(200, {"code": 200, "msg": "免费套餐已到账", "order_no": order_no, "profile": build_user_profile(user["username"])})
                    return
                pay_method = (data.get("pay_method") or "wechat").strip()
                # 前端只传 pay_method=wechat/alipay，后端根据权重随机选择通道
                admin = db.get_admin_config() or {}
                # 收集该支付方式的所有可用通道及权重
                available = []  # [(channel, pay_type, weight), ...]
                if pay_method == "wechat":
                    if admin.get("wechat_enabled") and admin.get("wechat_app_id") and admin.get("wechat_mch_id"):
                        available.append(("wechat", "wechat", int(admin.get("wechat_weight") or 100)))
                    if admin.get("zhifufm_enabled") and admin.get("zhifufm_api_url") and admin.get("zhifufm_merchant_num") and admin.get("zhifufm_secret"):
                        available.append(("zhifufm", "sandpayh5", int(admin.get("zhifufm_weight") or 100)))
                    if admin.get("sandpay_enabled") and admin.get("sandpay_mid") and admin.get("sandpay_api_url"):
                        available.append(("sandpay", "wxpay", int(admin.get("sandpay_weight") or 100)))
                    if admin.get("epay_enabled") and admin.get("epay_api_url") and admin.get("epay_pid") and admin.get("epay_key"):
                        available.append(("epay", "wxpay", int(admin.get("epay_weight") or 100)))
                elif pay_method == "alipay":
                    if admin.get("alipay_enabled") and admin.get("alipay_app_id") and admin.get("alipay_private_key"):
                        available.append(("alipay", "alipay", int(admin.get("alipay_weight") or 100)))
                    if admin.get("zhifufm_enabled") and admin.get("zhifufm_api_url") and admin.get("zhifufm_merchant_num") and admin.get("zhifufm_secret"):
                        available.append(("zhifufm", "sandpayh5", int(admin.get("zhifufm_weight") or 100)))
                    if admin.get("sandpay_enabled") and admin.get("sandpay_mid") and admin.get("sandpay_api_url"):
                        available.append(("sandpay", "alipay", int(admin.get("sandpay_weight") or 100)))
                    if admin.get("epay_enabled") and admin.get("epay_api_url") and admin.get("epay_pid") and admin.get("epay_key"):
                        available.append(("epay", "alipay", int(admin.get("epay_weight") or 100)))
                if not available:
                    self._send_json(400, {"code": 400, "msg": "该支付方式暂无可用通道，请联系管理员配置"})
                    return
                # 按权重随机选择通道（权重为0则不参与）
                weighted = [(ch, pt) for ch, pt, w in available if w > 0]
                if not weighted:
                    # 所有权重都为0，降级为等概率
                    weighted = [(ch, pt) for ch, pt, _ in available]
                weights = [w for _, _, w in available if w > 0] or [1] * len(weighted)
                pay_channel, pay_type = random.choices(weighted, weights=weights, k=1)[0]
                # 根据通道创建订单
                if pay_channel == "alipay":
                    order_no, qr_code = create_alipay_precreate_order(user["username"], plan)
                    self._send_json(200, {"code": 200, "msg": "订单已创建，请扫码付款", "paying": True, "pay_channel": "alipay", "order_no": order_no, "qr_code": qr_code})
                    return
                if pay_channel == "zhifufm":
                    order_no, pay_url = create_zhifufm_order(user["username"], plan, pay_type=pay_type)
                    self._send_json(200, {"code": 200, "msg": "订单已创建，请跳转付款", "paying": True, "pay_channel": "zhifufm", "order_no": order_no, "pay_url": pay_url})
                    return
                if pay_channel == "sandpay":
                    order_no, pay_url = create_sandpay_order(user["username"], plan, pay_type=pay_type)
                    self._send_json(200, {"code": 200, "msg": "订单已创建，请跳转付款", "paying": True, "pay_channel": "sandpay", "order_no": order_no, "pay_url": pay_url})
                    return
                if pay_channel == "epay":
                    order_no, pay_url = create_epay_order(user["username"], plan, pay_type=pay_type)
                    self._send_json(200, {"code": 200, "msg": "订单已创建，请跳转付款", "paying": True, "pay_channel": "epay", "order_no": order_no, "pay_url": pay_url})
                    return
                self._send_json(400, {"code": 400, "msg": "请选择可用支付方式"})
            except Exception as e:
                err_str = str(e)
                # 友好处理网络/DNS错误
                if "Name or service not known" in err_str or "Temporary failure in name resolution" in err_str:
                    # 尝试判断是哪个通道
                    ch = pay_channel if 'pay_channel' in dir() else ""
                    if ch == "zhifufm":
                        self._send_json(500, {"code": 500, "msg": "支付FM接口地址无法访问，请检查接口地址配置是否正确"})
                    elif ch == "sandpay":
                        self._send_json(500, {"code": 500, "msg": "杉德支付接口地址无法访问，请检查接口地址配置是否正确"})
                    elif ch == "epay":
                        self._send_json(500, {"code": 500, "msg": "易支付接口地址无法访问，请检查接口地址配置是否正确"})
                    else:
                        self._send_json(500, {"code": 500, "msg": "支付接口地址无法访问，请检查服务器网络和接口配置"})
                elif "Connection refused" in err_str or "Connection timed out" in err_str:
                    self._send_json(500, {"code": 500, "msg": "支付接口连接失败，请检查接口地址是否正确"})
                else:
                    self._send_json(500, {"code": 500, "msg": err_str})

        # ========== 管理后台接口 ==========
        elif path == "/admin/login":
            try:
                data = json.loads(body)
                username = (data.get("username") or "").strip()
                pwd = data.get("password", "")
                admin = db.get_admin_config()
                expected_user = (admin.get("username") or "admin").strip()
                if not username or not pwd:
                    self._send_json(400, {"code": 400, "msg": "请输入管理员用户名和密码"})
                    return
                if not consume_slider_token(data.get("slider_token"), "admin", self._client_ip()):
                    self._send_json(400, {"code": 400, "msg": "请先完成滑块验证"})
                    return
                allowed, retry_after = check_login_rate("admin", self._client_ip(), username)
                if not allowed:
                    self._send_json(429, {"code": 429, "msg": f"登录失败次数过多，请 {retry_after} 秒后再试"}, {"Retry-After": str(retry_after)})
                    return
                if username == expected_user and verify_admin_password(pwd, admin.get("password", "admin")):
                    token = create_admin_session(username)
                    clear_login_failures("admin", self._client_ip(), username)
                    self._send_json(200, {"code": 200, "token": token, "user": {"username": username}})
                    return
                retry_after = record_login_failure("admin", self._client_ip(), username, {"username": username})
                if retry_after:
                    self._send_json(429, {"code": 429, "msg": f"登录失败次数过多，请 {retry_after} 秒后再试"}, {"Retry-After": str(retry_after)})
                    return
                self._send_json(401, {"code": 401, "msg": "用户名或密码错误"})
            except Exception as e:
                self._send_json(400, {"code": 400, "msg": str(e)})

        elif path == "/admin/forgot-password":
            try:
                data = json.loads(body or "{}")
                email = (data.get("email") or "").strip()
                admin = db.get_admin_config() or {}
                bound_email = (admin.get("admin_email") or "").strip()
                if not bound_email:
                    self._send_json(400, {"code": 400, "msg": "管理员尚未绑定找回邮箱，请登录后在个人中心绑定"})
                    return
                if not email or email.lower() != bound_email.lower():
                    self._send_json(400, {"code": 400, "msg": "邮箱与管理员绑定邮箱不一致"})
                    return
                if not admin.get("email_enabled"):
                    self._send_json(400, {"code": 400, "msg": "SMTP 邮箱服务未启用，无法发送验证码"})
                    return
                code = generate_code(6)
                db.save_verify_code(bound_email, code, "admin_reset", expires_minutes=10)
                fallback_subject = "后台管理 - 管理员密码重置验证码"
                # 优先使用管理员真实用户名，查不到再用邮箱前缀回退
                admin_username = (admin.get("username") or "").strip()
                username_fallback = admin_username or (bound_email.split("@")[0] if bound_email and "@" in bound_email else bound_email)
                success, err = send_email(
                    bound_email,
                    fallback_subject,
                    body_html=f"<p>您的管理员密码重置验证码是：<b style='font-size:24px;color:#3b82f6;'>{code}</b></p><p>验证码 10 分钟内有效。如果不是您本人操作，请忽略本邮件。</p>",
                    scene="admin_reset",
                    variables={"username": username_fallback, "code": code, "subject": fallback_subject}
                )
                if success:
                    self._send_json(200, {"code": 200, "msg": "验证码已发送到绑定邮箱"})
                else:
                    self._send_json(500, {"code": 500, "msg": err})
            except Exception as e:
                self._send_json(500, {"code": 500, "msg": str(e)})

        elif path == "/admin/reset-password":
            try:
                data = json.loads(body or "{}")
                email = (data.get("email") or "").strip()
                code = (data.get("code") or "").strip()
                new_pwd = data.get("new_password", "")
                admin = db.get_admin_config() or {}
                bound_email = (admin.get("admin_email") or "").strip()
                if not bound_email or email.lower() != bound_email.lower():
                    self._send_json(400, {"code": 400, "msg": "邮箱与管理员绑定邮箱不一致"})
                    return
                if len(new_pwd) < 6:
                    self._send_json(400, {"code": 400, "msg": "新密码至少 6 位"})
                    return
                ok, err = db.check_verify_code(bound_email, code, "admin_reset")
                if not ok:
                    self._send_json(400, {"code": 400, "msg": err})
                    return
                db.update_admin_password(make_admin_password(new_pwd))
                ADMIN_SESSIONS.clear()
                self._send_json(200, {"code": 200, "msg": "管理员密码已重置，请重新登录"})
            except Exception as e:
                self._send_json(500, {"code": 500, "msg": str(e)})

        elif path == "/admin/logout":
            auth = self.headers.get("Authorization", "")
            revoke_admin_session(auth)
            self._send_json(200, {"code": 200, "msg": "已退出登录"})

        elif path == "/admin/config":
            if not self._check_admin():
                self._send_json(403, {"code": 403, "msg": "未登录或 Token 失效"})
                return
            PROVIDERS = refresh_providers_from_storage()
            self._send_json(200, {"code": 200, "config": {"providers": PROVIDERS}, "ready_count": provider_ready_count(PROVIDERS), "provider_count": len(PROVIDERS or {})})

        elif path == "/admin/save":
            if not self._check_admin():
                self._send_json(403, {"code": 403, "msg": "未登录或 Token 失效"})
                return
            try:
                data = json.loads(body)
                print(f"[保存AI配置] 收到数据: {json.dumps(data, ensure_ascii=False)[:500]}")
                if "providers" in data:
                    PROVIDERS = data["providers"]
                    save_providers(PROVIDERS)
                    print(f"[保存AI配置] 已持久化到数据库")
                self._send_json(200, {"code": 200, "msg": "保存成功"})
            except Exception as e:
                print(f"[保存AI配置] 错误: {str(e)}")
                self._send_json(500, {"code": 500, "msg": str(e)})

        elif path == "/admin/log-cleanup":
            if not self._check_admin():
                self._send_json(403, {"code": 403, "msg": "未登录或 Token 失效"})
                return
            try:
                data = json.loads(body)
                days = int(data.get("retention_days", 0))
                if days < 0:
                    days = 0
                db.set_log_retention_days(days)
                self._send_json(200, {"code": 200, "msg": "保存成功"})
            except Exception as e:
                self._send_json(500, {"code": 500, "msg": str(e)})

        elif path == "/admin/feedback-auto-close":
            if not self._check_admin():
                self._send_json(403, {"code": 403, "msg": "未登录或 Token 失效"})
                return
            try:
                data = json.loads(body)
                days = int(data.get("days", 7))
                if days < 1:
                    days = 1
                db.set_feedback_auto_close_days(days)
                self._send_json(200, {"code": 200, "msg": "保存成功"})
            except Exception as e:
                self._send_json(500, {"code": 500, "msg": str(e)})

        elif path == "/admin/log-cleanup/run":
            if not self._check_admin():
                self._send_json(403, {"code": 403, "msg": "未登录或 Token 失效"})
                return
            try:
                retention = db.get_log_retention_days()
                if retention <= 0:
                    self._send_json(200, {"code": 200, "msg": "未启用自动清理（保留天数为0）", "result": {}})
                    return
                result = db.cleanup_old_logs(retention)
                self._send_json(200, {"code": 200, "msg": "清理完成", "result": result})
            except Exception as e:
                self._send_json(500, {"code": 500, "msg": str(e)})

        elif path == "/admin/provider/add":
            if not self._check_admin():
                self._send_json(403, {"code": 403, "msg": "未登录或 Token 失效"})
                return
            try:
                data = json.loads(body)
                key = (data.get("key") or "").strip()
                if not key:
                    self._send_json(400, {"code": 400, "msg": "缺少提供商唯一标识"})
                    return
                if key in PROVIDERS:
                    self._send_json(400, {"code": 400, "msg": "该提供商标识已存在"})
                    return
                PROVIDERS[key] = {
                    "enabled": bool(data.get("enabled", True)),
                    "title": data.get("title") or key,
                    "protocol": data.get("protocol") or "openai",
                    "api_key": data.get("api_key") or "",
                    "base_url": data.get("base_url") or "",
                    "models": data.get("models") or []
                }
                save_providers(PROVIDERS)
                print(f"[添加AI提供商] {key} 已写入数据库")
                self._send_json(200, {"code": 200, "msg": "添加成功", "config": {"providers": PROVIDERS}})
            except Exception as e:
                print(f"[添加AI提供商] 错误: {str(e)}")
                self._send_json(500, {"code": 500, "msg": str(e)})

        elif path == "/admin/provider/delete":
            if not self._check_admin():
                self._send_json(403, {"code": 403, "msg": "未登录或 Token 失效"})
                return
            try:
                data = json.loads(body)
                key = (data.get("key") or "").strip()
                if not key:
                    self._send_json(400, {"code": 400, "msg": "缺少提供商唯一标识"})
                    return
                if key not in PROVIDERS:
                    self._send_json(404, {"code": 404, "msg": "提供商不存在"})
                    return
                del PROVIDERS[key]
                save_providers(PROVIDERS)
                print(f"[删除AI提供商] {key} 已从数据库删除")
                self._send_json(200, {"code": 200, "msg": "删除成功", "config": {"providers": PROVIDERS}})
            except Exception as e:
                print(f"[删除AI提供商] 错误: {str(e)}")
                self._send_json(500, {"code": 500, "msg": str(e)})

        elif path == "/admin/model/delete":
            if not self._check_admin():
                self._send_json(403, {"code": 403, "msg": "未登录或 Token 失效"})
                return
            try:
                data = json.loads(body)
                key = (data.get("key") or "").strip()
                idx = int(data.get("idx", -1))
                if key not in PROVIDERS:
                    self._send_json(404, {"code": 404, "msg": "提供商不存在"})
                    return
                models = PROVIDERS[key].get("models") or []
                if idx < 0 or idx >= len(models):
                    self._send_json(400, {"code": 400, "msg": "模型索引无效"})
                    return
                removed = models.pop(idx)
                PROVIDERS[key]["models"] = models
                save_providers(PROVIDERS)
                print(f"[删除AI模型] {key}/{removed.get('value', '')} 已从数据库删除")
                self._send_json(200, {"code": 200, "msg": "删除成功", "config": {"providers": PROVIDERS}})
            except Exception as e:
                print(f"[删除AI模型] 错误: {str(e)}")
                self._send_json(500, {"code": 500, "msg": str(e)})

        elif path == "/admin/email-config":
            if not self._check_admin():
                self._send_json(403, {"code": 403, "msg": "未登录或 Token 失效"})
                return
            try:
                data = json.loads(body or "{}")
                if "enabled" in data:
                    db.set_email_enabled(bool(data.get("enabled")))
                if "test_recipient" in data:
                    db.update_admin_email({"test_recipient": (data.get("test_recipient") or "").strip()})
                self._send_json(200, {"code": 200, "msg": "保存成功"})
            except Exception as e:
                self._send_json(500, {"code": 500, "msg": str(e)})

        elif path == "/admin/mail-server":
            if not self._check_admin():
                self._send_json(403, {"code": 403, "msg": "未登录或 Token 失效"})
                return
            try:
                data = json.loads(body or "{}")
                sid = data.get("id")
                if sid:
                    db.update_mail_server(int(sid), data)
                    self._send_json(200, {"code": 200, "msg": "保存成功"})
                else:
                    new_id = db.create_mail_server(data)
                    self._send_json(200, {"code": 200, "msg": "添加成功", "id": new_id})
            except Exception as e:
                self._send_json(500, {"code": 500, "msg": str(e)})

        elif path.startswith("/admin/mail-server/") and path.endswith("/delete"):
            if not self._check_admin():
                self._send_json(403, {"code": 403, "msg": "未登录或 Token 失效"})
                return
            try:
                sid = int(path.split("/")[-2])
                db.delete_mail_server(sid)
                self._send_json(200, {"code": 200, "msg": "删除成功"})
            except Exception as e:
                self._send_json(500, {"code": 500, "msg": str(e)})

        elif path == "/admin/save-email":
            if not self._check_admin():
                self._send_json(403, {"code": 403, "msg": "未登录或 Token 失效"})
                return
            try:
                data = json.loads(body)
                db.update_admin_email(data)
                self._send_json(200, {"code": 200, "msg": "保存成功"})
            except Exception as e:
                self._send_json(500, {"code": 500, "msg": str(e)})

        elif path == "/admin/save-account-config":
            if not self._check_admin():
                self._send_json(403, {"code": 403, "msg": "未登录或 Token 失效"})
                return
            try:
                data = json.loads(body or "{}")
                username = (data.get("username") or "admin").strip()
                admin_email = (data.get("admin_email") or "").strip()
                avatar_data = (data.get("avatar_data") or "").strip()
                if not username:
                    self._send_json(400, {"code": 400, "msg": "管理员用户名不能为空"})
                    return
                if admin_email and not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", admin_email):
                    self._send_json(400, {"code": 400, "msg": "管理员邮箱格式不正确"})
                    return
                if avatar_data and (not avatar_data.startswith("data:image/") or len(avatar_data) > 1024 * 1024):
                    self._send_json(400, {"code": 400, "msg": "头像格式不正确或图片过大，请控制在 1MB 内"})
                    return
                db.update_admin_account(username=username, admin_email=admin_email, avatar_data=avatar_data)
                self._send_json(200, {"code": 200, "msg": "管理员账号信息已保存"})
            except Exception as e:
                self._send_json(500, {"code": 500, "msg": str(e)})

        elif path == "/api/script-logs":
            try:
                user = self._get_user_from_token()
                if not user:
                    self._send_json(401, {"code": 401, "msg": "未登录"})
                    return
                data = json.loads(body or "{}")
                items = data.get("logs") or []
                if not isinstance(items, list):
                    items = []
                saved = db.insert_script_event_logs(items, username=user.get("username", ""), client_ip=self._client_ip(), user_agent=self.headers.get("User-Agent", ""))
                self._send_json(200, {"code": 200, "saved": saved})
            except Exception as e:
                self._send_json(500, {"code": 500, "msg": str(e)})

        elif path == "/api/debug-dump":
            try:
                user = self._get_user_from_token()
                if not user:
                    self._send_json(401, {"code": 401, "msg": "未登录"})
                    return
                data = json.loads(body or "{}")
                content = data.get("content") or ""
                page_url = data.get("page_url") or ""
                if not content:
                    self._send_json(400, {"code": 400, "msg": "content不能为空"})
                    return
                # 存为文件（os和time已在文件顶部导入）
                dump_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "debug_dumps")
                os.makedirs(dump_dir, exist_ok=True)
                filename = f"dump_{user.get('username','unknown')}_{int(time.time())}.txt"
                filepath = os.path.join(dump_dir, filename)
                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(content)
                # 同时写入script_event_logs
                db.insert_script_event_logs([{
                    "message": content[:8000],
                    "level": "debug",
                    "eventType": "debug_dump",
                    "extra": {"page_url": page_url, "file": filename},
                    "timestamp": int(time.time() * 1000),
                    "url": page_url
                }], username=user.get("username", ""), client_ip=self._client_ip(), user_agent=self.headers.get("User-Agent", ""))
                self._send_json(200, {"code": 200, "saved": True, "file": filename})
            except Exception as e:
                self._send_json(500, {"code": 500, "msg": str(e)})

        elif path == "/admin/pay-test":
            # 管理员支付通道测试接口（不影响正式环境）
            if not self._check_admin():
                self._send_json(403, {"code": 403, "msg": "未登录或 Token 失效"})
                return
            try:
                data = json.loads(body or "{}")
                channel = (data.get("channel") or "").strip()
                pay_type = (data.get("pay_type") or "alipay").strip()
                amount = float(data.get("amount") or 0.01)
                if amount < 0.01 or amount > 100:
                    self._send_json(400, {"code": 400, "msg": "测试金额需在 0.01~100 元之间"})
                    return
                # 创建一个测试用的临时套餐
                test_plan = {"id": 0, "name": "测试订单", "price": amount, "plan_type": "points", "points": 0, "days": 0}
                admin_cfg = db.get_admin_config() or {}
                admin_user = admin_cfg.get("username") or "admin"
                if channel == "sandpay":
                    product_id = (data.get("productId") or "").strip()
                    sandpay_params = data.get("sandpayParams")
                    custom_head = (sandpay_params or {}).get("head") if sandpay_params else None
                    custom_body = (sandpay_params or {}).get("body") if sandpay_params else None
                    order_no, pay_url = create_sandpay_order(admin_user, test_plan, pay_type=pay_type, skip_enabled_check=True, product_id=product_id or None, custom_head=custom_head, custom_body=custom_body)
                    self._send_json(200, {"code": 200, "msg": "杉德河马订单创建成功", "order_no": order_no, "pay_url": pay_url})
                elif channel == "zhifufm":
                    order_no, pay_url = create_zhifufm_order(admin_user, test_plan, pay_type=pay_type, skip_enabled_check=True)
                    self._send_json(200, {"code": 200, "msg": "支付FM订单创建成功", "order_no": order_no, "pay_url": pay_url})
                elif channel == "epay":
                    order_no, pay_url = create_epay_order(admin_user, test_plan, pay_type=pay_type, skip_enabled_check=True)
                    self._send_json(200, {"code": 200, "msg": "易支付订单创建成功", "order_no": order_no, "pay_url": pay_url})
                elif channel == "alipay":
                    order_no, qr_code = create_alipay_precreate_order(admin_user, test_plan, skip_enabled_check=True)
                    self._send_json(200, {"code": 200, "msg": "支付宝订单创建成功", "order_no": order_no, "qr_code": qr_code})
                else:
                    self._send_json(400, {"code": 400, "msg": "不支持的支付通道: " + channel})
            except Exception as e:
                self._send_json(500, {"code": 500, "msg": str(e)})

        elif path == "/admin/save-pay-api-config":
            if not self._check_admin():
                self._send_json(403, {"code": 403, "msg": "未登录或 Token 失效"})
                return
            try:
                data = json.loads(body or "{}")
                ph = "%s"
                db.execute(
                    f"""UPDATE admin_config SET
                        alipay_enabled = {ph}, alipay_app_id = {ph}, alipay_private_key = {ph},
                        alipay_public_key = {ph}, alipay_gateway = {ph},
                        wechat_enabled = {ph}, wechat_app_id = {ph}, wechat_mch_id = {ph}, wechat_api_key = {ph},
                        wechat_api_v3_key = {ph}, wechat_serial_no = {ph}, wechat_private_key = {ph}, wechat_notify_url = {ph},
                        zhifufm_enabled = {ph}, zhifufm_api_url = {ph}, zhifufm_merchant_num = {ph}, zhifufm_secret = {ph},
                        zhifufm_notify_url = {ph}, zhifufm_return_url = {ph},
                        sandpay_enabled = {ph}, sandpay_mid = {ph}, sandpay_api_url = {ph}, sandpay_private_key = {ph},
                        sandpay_public_key = {ph}, sandpay_merchant_public_key = {ph}, sandpay_notify_url = {ph}, sandpay_return_url = {ph},
                        epay_enabled = {ph}, epay_api_url = {ph}, epay_pid = {ph}, epay_key = {ph},
                        epay_notify_url = {ph}, epay_return_url = {ph},
                        alipay_weight = {ph}, wechat_weight = {ph}, zhifufm_weight = {ph}, sandpay_weight = {ph}, epay_weight = {ph}
                    WHERE id = 1""",
                    (
                        1 if data.get("alipay_enabled") else 0,
                        data.get("alipay_app_id") or "",
                        data.get("alipay_private_key") or "",
                        data.get("alipay_public_key") or "",
                        data.get("alipay_gateway") or "https://openapi.alipay.com/gateway.do",
                        1 if data.get("wechat_enabled") else 0,
                        data.get("wechat_app_id") or "",
                        data.get("wechat_mch_id") or "",
                        data.get("wechat_api_key") or "",
                        data.get("wechat_api_v3_key") or "",
                        data.get("wechat_serial_no") or "",
                        data.get("wechat_private_key") or "",
                        data.get("wechat_notify_url") or "",
                        1 if data.get("zhifufm_enabled") else 0,
                        data.get("zhifufm_api_url") or "",
                        data.get("zhifufm_merchant_num") or "",
                        data.get("zhifufm_secret") or "",
                        data.get("zhifufm_notify_url") or "",
                        data.get("zhifufm_return_url") or "",
                        1 if data.get("sandpay_enabled") else 0,
                        data.get("sandpay_mid") or "",
                        data.get("sandpay_api_url") or "",
                        data.get("sandpay_private_key") or "",
                        data.get("sandpay_public_key") or "",
                        data.get("sandpay_merchant_public_key") or "",
                        data.get("sandpay_notify_url") or "",
                        data.get("sandpay_return_url") or "",
                        1 if data.get("epay_enabled") else 0,
                        data.get("epay_api_url") or "",
                        data.get("epay_pid") or "",
                        data.get("epay_key") or "",
                        data.get("epay_notify_url") or "",
                        data.get("epay_return_url") or "",
                        max(0, min(1000, int(data.get("alipay_weight") or 100))),
                        max(0, min(1000, int(data.get("wechat_weight") or 100))),
                        max(0, min(1000, int(data.get("zhifufm_weight") or 100))),
                        max(0, min(1000, int(data.get("sandpay_weight") or 100))),
                        max(0, min(1000, int(data.get("epay_weight") or 100)))
                    )
                )
                self._send_json(200, {"code": 200, "msg": "支付接口配置已保存"})
            except Exception as e:
                self._send_json(500, {"code": 500, "msg": str(e)})

        elif path == "/admin/save-payment-config":
            if not self._check_admin():
                self._send_json(403, {"code": 403, "msg": "未登录或 Token 失效"})
                return
            try:
                data = json.loads(body or "{}")
                gift_type = data.get("gift_type", "none")
                gift_points = int(data.get("gift_points") or 0)
                gift_days = int(data.get("gift_days") or 0)
                db.execute(
                    "UPDATE admin_config SET gift_type = %s, gift_points = %s, gift_days = %s WHERE id = 1",
                    (gift_type, gift_points, gift_days)
                )
                self._send_json(200, {"code": 200, "msg": "注册赠送配置已保存"})
            except Exception as e:
                self._send_json(500, {"code": 500, "msg": str(e)})

        elif path == "/admin/payment-plan/save":
            if not self._check_admin():
                self._send_json(403, {"code": 403, "msg": "未登录或 Token 失效"})
                return
            try:
                data = json.loads(body or "{}")
                if not data.get("name"):
                    self._send_json(400, {"code": 400, "msg": "请填写套餐名称"})
                    return
                if data.get("plan_type") not in ("monthly", "points"):
                    self._send_json(400, {"code": 400, "msg": "套餐类型无效"})
                    return
                db.save_payment_plan(data)
                self._send_json(200, {"code": 200, "msg": "套餐已保存", "plans": db.list_payment_plans(False)})
            except Exception as e:
                self._send_json(500, {"code": 500, "msg": str(e)})

        elif path == "/admin/payment-plan/delete":
            if not self._check_admin():
                self._send_json(403, {"code": 403, "msg": "未登录或 Token 失效"})
                return
            try:
                data = json.loads(body or "{}")
                db.delete_payment_plan(int(data.get("id") or 0))
                self._send_json(200, {"code": 200, "msg": "套餐已删除", "plans": db.list_payment_plans(False)})
            except Exception as e:
                self._send_json(500, {"code": 500, "msg": str(e)})

        elif path == "/admin/payment-plan/toggle":
            if not self._check_admin():
                self._send_json(403, {"code": 403, "msg": "未登录或 Token 失效"})
                return
            try:
                data = json.loads(body or "{}")
                plan_id = int(data.get("id") or 0)
                enabled = bool(data.get("enabled"))
                if not plan_id:
                    self._send_json(400, {"code": 400, "msg": "缺少套餐 ID"})
                    return
                db.set_payment_plan_enabled(plan_id, enabled)
                self._send_json(200, {"code": 200, "msg": "套餐已" + ("启用" if enabled else "停用"), "plans": db.list_payment_plans(False)})
            except Exception as e:
                self._send_json(500, {"code": 500, "msg": str(e)})

        elif path == "/admin/user/update":
            if not self._check_admin():
                self._send_json(403, {"code": 403, "msg": "未登录或 Token 失效"})
                return
            try:
                data = json.loads(body or "{}")
                username = data.get("username", "").strip()
                if not username:
                    self._send_json(400, {"code": 400, "msg": "缺少用户名"})
                    return
                db.set_user_admin_fields(
                    username,
                    email=data.get("email") if "email" in data else None,
                    password=data.get("password") or None,
                    is_banned=data.get("is_banned") if "is_banned" in data else None,
                    ban_reason=data.get("ban_reason") if "ban_reason" in data else None
                )
                if int(data.get("points_delta") or 0) != 0:
                    db.adjust_user_points(username, int(data.get("points_delta") or 0), data.get("reason") or "管理员调整点数")
                if int(data.get("member_days_delta") or 0) > 0:
                    db.extend_user_membership(username, int(data.get("member_days_delta") or 0), data.get("reason") or "管理员充值包月")
                if "member_until" in data:
                    db.set_user_member_until(username, data.get("member_until") or None)
                self._send_json(200, {"code": 200, "msg": "用户已更新", "profile": build_user_profile(username)})
            except Exception as e:
                self._send_json(500, {"code": 500, "msg": str(e)})

        elif path == "/admin/test-email":
            if not self._check_admin():
                self._send_json(403, {"code": 403, "msg": "未登录或 Token 失效"})
                return
            admin = db.get_admin_config()
            to_addr = (admin.get("test_recipient") or "").strip()
            if not to_addr:
                self._send_json(400, {"code": 400, "msg": "请先配置测试收件邮箱"})
                return
            data = json.loads(body or "{}")
            template_id = data.get("template_id")
            variables = data.get("variables", {})
            if template_id:
                success, err = send_email(to_addr, "", template_id=template_id, variables=variables)
            else:
                success, err = send_email(
                    to_addr, "学神助手 - 邮件测试",
                    body_html=f"<p>这是一封测试邮件。</p><p>如果您的邮箱收到了这封邮件，说明 SMTP 配置正确。</p><p>发送时间：{time.strftime('%Y-%m-%d %H:%M:%S')}</p>"
                )
            if success:
                self._send_json(200, {"code": 200, "msg": "测试邮件已发送"})
            else:
                self._send_json(500, {"code": 500, "msg": err})

        # ==================== 推广返利管理（POST） ====================
        elif path == "/admin/referral/config":
            if not self._check_admin():
                self._send_json(403, {"code": 403, "msg": "未登录或 Token 失效"})
                return
            try:
                data = json.loads(body or "{}")
                enabled = 1 if data.get("referral_enabled") else 0
                rate = round(float(data.get("referral_rate") or 0), 4)
                if rate < 0 or rate > 1:
                    self._send_json(400, {"code": 400, "msg": "费率须在 0~1 之间"})
                    return
                min_w = round(float(data.get("referral_min_withdraw") or 10), 2)
                days = int(data.get("referral_settle_days") or 7)
                db.execute(
                    "UPDATE admin_config SET referral_enabled=%s, referral_rate=%s, referral_min_withdraw=%s, referral_settle_days=%s WHERE id=1",
                    (enabled, rate, min_w, days)
                )
                self._send_json(200, {"code": 200, "msg": "配置已保存"})
            except Exception as e:
                self._send_json(500, {"code": 500, "msg": str(e)})

        elif path == "/admin/referral/withdrawal/approve":
            if not self._check_admin():
                self._send_json(403, {"code": 403, "msg": "未登录或 Token 失效"})
                return
            try:
                data = json.loads(body or "{}")
                wid = int(data.get("id") or 0)
                ok = db.approve_withdrawal(wid)
                if ok:
                    w = db.get_withdrawal(wid)
                    if w:
                        u = db.get_user_by_username(w["username"])
                        if u and u.get("email"):
                            send_email(u["email"], "", scene="referral_withdrawal",
                                       variables={"username": w["username"], "amount": str(w["amount"]),
                                                  "status": "已通过", "reason": "", "subject": "提现审核结果通知"})
                    self._send_json(200, {"code": 200, "msg": "已通过，请人工转账"})
                else:
                    self._send_json(400, {"code": 400, "msg": "该提现已处理或不存在"})
            except Exception as e:
                self._send_json(500, {"code": 500, "msg": str(e)})

        elif path == "/admin/referral/withdrawal/reject":
            if not self._check_admin():
                self._send_json(403, {"code": 403, "msg": "未登录或 Token 失效"})
                return
            try:
                data = json.loads(body or "{}")
                wid = int(data.get("id") or 0)
                reason = (data.get("reason") or "").strip()
                ok = db.reject_withdrawal(wid, reason)
                if ok:
                    w = db.get_withdrawal(wid)
                    if w:
                        u = db.get_user_by_username(w["username"])
                        if u and u.get("email"):
                            send_email(u["email"], "", scene="referral_withdrawal",
                                       variables={"username": w["username"], "amount": str(w["amount"]),
                                                  "status": "已驳回", "reason": reason, "subject": "提现审核结果通知"})
                    self._send_json(200, {"code": 200, "msg": "已驳回，余额已退还"})
                else:
                    self._send_json(400, {"code": 400, "msg": "该提现已处理或不存在"})
            except Exception as e:
                self._send_json(500, {"code": 500, "msg": str(e)})

        # ==================== 问题反馈管理（POST） ====================
        elif path == "/admin/feedback/reply":
            if not self._check_admin():
                self._send_json(403, {"code": 403, "msg": "未登录或 Token 失效"})
                return
            try:
                data = json.loads(body or "{}")
                fid = int(data.get("id") or 0)
                reply_text = (data.get("reply_text") or "").strip()
                if not fid or not reply_text:
                    self._send_json(400, {"code": 400, "msg": "反馈ID和回复内容不能为空"})
                    return
                fb = db.get_feedback_by_id(fid)
                if not fb:
                    self._send_json(404, {"code": 404, "msg": "反馈不存在"})
                    return
                # 发送邮件（使用 feedback_reply 模板，模板不存在时用 fallback）
                user_email = fb.get("email") or ""
                if not user_email:
                    user = db.get_user_by_username(fb.get("username") or "")
                    user_email = (user or {}).get("email") or ""
                if not user_email:
                    self._send_json(400, {"code": 400, "msg": "用户未绑定邮箱，无法发送邮件"})
                    return
                # 检查模板是否存在，不存在则用 fallback
                tpl = db.get_email_template_by_scene("feedback_reply")
                if tpl:
                    ok, err = send_email(
                        to_addr=user_email,
                        subject=None,
                        body_text=None,
                        body_html=None,
                        scene="feedback_reply",
                        variables={
                            "username": fb.get("username", ""),
                            "title": fb.get("title", ""),
                            "reply_text": reply_text
                        }
                    )
                else:
                    # 模板不存在时的 fallback
                    fb_subject = f"学神助手 - 问题反馈回复：{fb.get('title','')}"
                    fb_html = f"""<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#f0f9ff;font-family:sans-serif;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px;"><table width="480" cellpadding="0" cellspacing="0" style="max-width:480px;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,.08);overflow:hidden;"><tr><td style="background:linear-gradient(135deg,#0ea5e9,#0284c7);padding:28px 32px;text-align:center;color:#fff;font-size:18px;font-weight:600;">学神助手</td></tr><tr><td style="padding:32px;"><p style="margin:0 0 16px;color:#1f2937;font-size:15px;">您好 <b>{fb.get('username','')}</b>，</p><p style="margin:0 0 8px;color:#4b5563;font-size:14px;">您提交的问题反馈已处理：</p><div style="background:#f0f9ff;border-left:4px solid #0ea5e9;border-radius:8px;padding:14px 16px;margin:0 0 20px;"><p style="margin:0 0 6px;color:#6b7280;font-size:12px;">反馈标题</p><p style="margin:0;color:#1f2937;font-size:14px;font-weight:600;">{fb.get('title','')}</p></div><p style="margin:0 0 8px;color:#4b5563;font-size:14px;">管理员回复：</p><div style="background:#f9fafb;border-radius:12px;padding:16px 18px;margin:0 0 20px;"><p style="margin:0;color:#1f2937;font-size:14px;line-height:1.7;white-space:pre-wrap;">{reply_text}</p></div><p style="margin:0;color:#9ca3af;font-size:12px;">如有疑问请继续在用户中心提交反馈。</p></td></tr></table></td></tr></table></body></html>"""
                    ok, err = send_email(user_email, fb_subject, body_text=reply_text, body_html=fb_html)
                if not ok:
                    self._send_json(500, {"code": 500, "msg": f"邮件发送失败：{err}"})
                    return
                # 保存回复（兼容旧字段 + 新对话表）
                db.reply_feedback(fid, reply_text)
                db.add_feedback_reply(fid, "admin", reply_text)
                self._send_json(200, {"code": 200, "msg": "回复成功，邮件已发送"})
            except Exception as e:
                self._send_json(500, {"code": 500, "msg": str(e)})

        # AI 优化回复内容
        elif path == "/admin/feedback/ai-polish":
            if not self._check_admin():
                self._send_json(403, {"code": 403, "msg": "未登录或 Token 失效"})
                return
            try:
                data = json.loads(body or "{}")
                raw_text = (data.get("text") or "").strip()
                feedback_title = (data.get("title") or "").strip()
                feedback_content = (data.get("content") or "").strip()
                if not raw_text:
                    self._send_json(400, {"code": 400, "msg": "请输入回复内容后再优化"})
                    return
                system_prompt = (
                    "你是一位专业的客服回复专家。请将用户输入的回复内容优化得更加专业、礼貌、清晰。"
                    "要求：\n"
                    "1. 保持原意不变，不要添加用户未提及的承诺\n"
                    "2. 语气专业、友善、有耐心\n"
                    "3. 逻辑清晰，分段分明\n"
                    "4. 只输出优化后的回复内容，不要输出任何解释或前缀\n"
                    "5. 如果原文已经很好，可以做轻微润色"
                )
                user_prompt = f"用户反馈标题：{feedback_title}\n用户反馈内容：{feedback_content}\n\n待优化的回复内容：\n{raw_text}\n\n请优化这段回复："
                messages = [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ]
                answer, err, _model, _provider = call_agent_llm(messages)
                # 内容审核拦截时，用简化 prompt 重试一次
                if not answer and err and "内容审核拦截" in err:
                    simple_prompt = f"请将以下客服回复内容润色得更加专业、礼貌、清晰，只输出润色后的内容：\n\n{raw_text}"
                    answer, err2, _model, _provider = call_agent_llm([
                        {"role": "user", "content": simple_prompt}
                    ])
                    if not answer:
                        self._send_json(500, {"code": 500, "msg": "AI 内容审核拦截，请手动编辑回复内容"})
                        return
                if answer:
                    self._send_json(200, {"code": 200, "text": answer.strip()})
                else:
                    self._send_json(500, {"code": 500, "msg": err or "AI 优化失败"})
            except Exception as e:
                self._send_json(500, {"code": 500, "msg": str(e)})

        elif path == "/admin/feedback/status":
            if not self._check_admin():
                self._send_json(403, {"code": 403, "msg": "未登录或 Token 失效"})
                return
            try:
                data = json.loads(body or "{}")
                fid = int(data.get("id") or 0)
                status = (data.get("status") or "").strip()
                if not fid or status not in ("pending", "processing", "resolved", "closed"):
                    self._send_json(400, {"code": 400, "msg": "参数无效"})
                    return
                db.update_feedback_status(fid, status)
                self._send_json(200, {"code": 200, "msg": "状态更新成功"})
            except Exception as e:
                self._send_json(500, {"code": 500, "msg": str(e)})

        # ==================== 邮件模板管理（POST） ====================
        elif path == "/admin/email-template":
            if not self._check_admin():
                self._send_json(403, {"code": 403, "msg": "未登录或 Token 失效"})
                return
            data = json.loads(body or "{}")
            template_id = data.get("id")
            scene = (data.get("scene") or "").strip()
            subject = (data.get("subject") or "").strip()
            body_text = data.get("body_text", "")
            body_html = data.get("body_html", "")
            content_type = (data.get("content_type") or "text").strip()
            variables = (data.get("variables") or "").strip()
            is_resend = 1 if data.get("is_resend") else 0
            if not scene or scene not in ("user_register", "user_reset", "admin_reset", "referral_withdrawal", "feedback_reply", "daily_report", "feedback_new"):
                self._send_json(400, {"code": 400, "msg": "请选择有效的应用场景"})
                return
            if not subject:
                self._send_json(400, {"code": 400, "msg": "邮件主题不能为空"})
                return
            if variables and not _re.match(r"^[a-zA-Z0-9_,\s]*$", variables):
                self._send_json(400, {"code": 400, "msg": "变量名仅支持大小写字母、数字和下划线"})
                return
            try:
                if template_id:
                    db.update_email_template(template_id, scene, subject, body_text, body_html, content_type, variables, is_resend)
                    self._send_json(200, {"code": 200, "msg": "模板已更新"})
                else:
                    tid = db.create_email_template(scene, subject, body_text, body_html, content_type, variables, is_resend)
                    self._send_json(200, {"code": 200, "msg": "模板已保存", "id": tid})
            except ValueError as e:
                self._send_json(400, {"code": 400, "msg": str(e)})
            except Exception as e:
                self._send_json(500, {"code": 500, "msg": str(e)})

        elif path.startswith("/admin/email-template/"):
            if not self._check_admin():
                self._send_json(403, {"code": 403, "msg": "未登录或 Token 失效"})
                return
            tid = path.split("/")[-1]
            if not tid.isdigit():
                self._send_json(400, {"code": 400, "msg": "模板ID无效"})
                return
            if method == "DELETE":
                self._send_json(400, {"code": 400, "msg": "邮件模板不允许删除，每个场景必须保留一个模板"})
            else:
                self._send_json(405, {"code": 405, "msg": "方法不支持"})

        # ==================== 每日数据邮件（POST） ====================
        elif path == "/admin/daily-report/config":
            if not self._check_admin():
                self._send_json(403, {"code": 403, "msg": "未登录或 Token 失效"})
                return
            data = json.loads(body or "{}")
            enabled = data.get("enabled")
            send_time = (data.get("send_time") or "").strip()
            recipients = data.get("recipients")
            template_id = data.get("template_id")
            if send_time and not _re.match(r"^\d{1,2}:\d{2}$", send_time):
                self._send_json(400, {"code": 400, "msg": "发送时间格式应为 HH:MM"})
                return
            if recipients is not None:
                for a in [x.strip() for x in recipients.split(",") if x.strip()]:
                    if not _re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", a):
                        self._send_json(400, {"code": 400, "msg": f"收件人邮箱格式不正确: {a}"})
                        return
            if template_id in ("", None):
                template_id = None
            else:
                try:
                    template_id = int(template_id)
                except Exception:
                    self._send_json(400, {"code": 400, "msg": "模板ID无效"})
                    return
            try:
                db.update_daily_report_config(
                    enabled=bool(enabled) if enabled is not None else None,
                    send_time=send_time or None,
                    recipients=recipients,
                    template_id=template_id,
                )
                self._send_json(200, {"code": 200, "msg": "配置已保存"})
            except Exception as e:
                self._send_json(500, {"code": 500, "msg": str(e)})

        elif path == "/admin/feedback-notify/config":
            if not self._check_admin():
                self._send_json(403, {"code": 403, "msg": "未登录或 Token 失效"})
                return
            try:
                data = json.loads(body or "{}")
                enabled = bool(data.get("enabled"))
                db.set_feedback_notify_enabled(enabled)
                self._send_json(200, {"code": 200, "msg": "配置已保存"})
            except Exception as e:
                self._send_json(500, {"code": 500, "msg": str(e)})

        elif path == "/admin/daily-report/send-now":
            if not self._check_admin():
                self._send_json(403, {"code": 403, "msg": "未登录或 Token 失效"})
                return
            try:
                ok, msg = send_daily_report()
                self._send_json(200, {"code": 200 if ok else 400, "msg": msg})
            except Exception as e:
                self._send_json(500, {"code": 500, "msg": str(e)})

        elif path == "/admin/change-password":
            if not self._check_admin():
                self._send_json(403, {"code": 403, "msg": "未登录或 Token 失效"})
                return
            try:
                data = json.loads(body)
                old_pwd = data.get("old_password", "")
                new_pwd = data.get("new_password", "")
                admin = db.get_admin_config()
                if not verify_admin_password(old_pwd, admin.get("password", "admin")):
                    self._send_json(401, {"code": 401, "msg": "旧密码错误"})
                    return
                if len(new_pwd) < 6:
                    self._send_json(400, {"code": 400, "msg": "新密码至少 6 位"})
                    return
                db.update_admin_password(make_admin_password(new_pwd))
                revoke_admin_session(self.headers.get("Authorization", ""))
                self._send_json(200, {"code": 200, "msg": "密码修改成功"})
            except Exception as e:
                self._send_json(500, {"code": 500, "msg": str(e)})

        elif path == "/admin/ai-logs/clear":
            if not self._check_admin():
                self._send_json(403, {"code": 403, "msg": "未登录或 Token 失效"})
                return
            try:
                data = json.loads(body or "{}")
                db.clear_ai_call_logs(
                    status=data.get("status", ""),
                    model=data.get("model", ""),
                    keyword=data.get("keyword", ""),
                    date_from=data.get("date_from", ""),
                    date_to=data.get("date_to", "")
                )
                self._send_json(200, {"code": 200, "msg": "清空成功"})
            except Exception as e:
                self._send_json(500, {"code": 500, "msg": str(e)})

        elif path == "/admin/question-bank/clear":
            if not self._check_admin():
                self._send_json(403, {"code": 403, "msg": "未登录或 Token 失效"})
                return
            try:
                data = json.loads(body or "{}")
                db.clear_question_bank(keyword=data.get("keyword", ""))
                self._send_json(200, {"code": 200, "msg": "清空成功"})
            except Exception as e:
                self._send_json(500, {"code": 500, "msg": str(e)})

        elif path == "/admin/login-locks/unlock":
            if not self._check_admin():
                self._send_json(403, {"code": 403, "msg": "未登录或 Token 失效"})
                return
            try:
                data = json.loads(body or "{}")
                lock_id = int(data.get("id") or 0)
                if not lock_id:
                    self._send_json(400, {"code": 400, "msg": "缺少锁定记录 ID"})
                    return
                db.unlock_login_lock(lock_id)
                self._send_json(200, {"code": 200, "msg": "已解除锁定"})
            except Exception as e:
                self._send_json(500, {"code": 500, "msg": str(e)})

        # ========== AI 答题接口 ==========
        elif path == "/api/v1/cx":
            start_ts = time.time()
            question = ""
            model = ""
            resolved_model = ""
            provider_name = ""
            answer = ""
            err = ""
            status = "error"
            try:
                # 安全：答题接口限流，每 IP 每分钟最多 30 次
                ok_rate, retry_rate = check_api_rate(self._client_ip(), "/api/v1/cx", 30, 60)
                if not ok_rate:
                    self._send_json(429, {"code": 429, "msg": f"请求过于频繁，请 {retry_rate} 秒后再试"}, {"Retry-After": str(retry_rate)})
                    return
                user = self._get_user_from_token()
                if not user:
                    err = "请先登录后再使用模型搜题"
                    self._send_json(401, {"code": 401, "msg": err})
                    return
                params = parse_qs(body)
                question = params.get("question", [""])[0]
                model = params.get("model", [""])[0]
                model_mode = params.get("model_mode", ["auto"])[0] or "auto"
                custom_cfg = {}
                if not question:
                    self._send_json(400, {"code": 400, "msg": "缺少 question 参数"})
                    return
                ent = db.get_user_entitlement(user["username"])
                if ent and ent.get("is_banned"):
                    err = "账号已被封禁：" + (ent.get("ban_reason") or "请联系管理员")
                    self._send_json(403, {"code": 403, "msg": err})
                    return
                if not ent or (not ent.get("active_member") and int(ent.get("points_balance") or 0) <= 0):
                    err = "题数余额不足，请到用户中心购买点数或包月套餐"
                    status = "insufficient_quota"
                    self._send_json(402, {"code": 402, "msg": err})
                    return
                if model_mode == "custom":
                    custom_cfg = {
                        "protocol": params.get("custom_protocol", ["openai"])[0],
                        "base_url": params.get("custom_base_url", [""])[0],
                        "api_key": params.get("custom_api_key", [""])[0],
                        "model": params.get("custom_model", [""])[0],
                    }
                    resolved_model = custom_cfg["model"]
                    provider_name = "custom"
                bank_row, question_hash = get_question_bank_match(question)
                if bank_row:
                    answer = normalize_ai_answer(question, bank_row.get("answer", ""))
                    resolved_model = bank_row.get("source_model") or "题库"
                    provider_name = "question_bank"
                    status = "success"
                    ok_quota, quota_msg, ent_after = consume_answer_quota(user["username"], question_hash)
                    if not ok_quota:
                        err = quota_msg
                        self._send_json(402, {"code": 402, "msg": quota_msg})
                        return
                    print(f"[题库命中] hash={question_hash[:12]}, question={question[:60]}...", flush=True)
                    profile_after = build_user_profile(user["username"])
                    self._send_json(200, {"code": 200, "msg": quota_msg, "data": {"answer": answer, "model": resolved_model, "mode": "question_bank", "bank": True, "cache": True, "profile": profile_after, "remainCount": 999999 if profile_after and profile_after.get("active_member") else int((profile_after or {}).get("points_balance") or 0)}})
                    return
                cache_key = make_ai_cache_key(question, model_mode, model, custom_cfg)
                cached = get_ai_cache(cache_key)
                if cached:
                    answer = cached.get("answer", "")
                    resolved_model = cached.get("model") or resolved_model or model
                    provider_name = cached.get("provider") or provider_name
                    status = "success"
                    ok_quota, quota_msg, ent_after = consume_answer_quota(user["username"], question_hash)
                    if not ok_quota:
                        err = quota_msg
                        self._send_json(402, {"code": 402, "msg": quota_msg})
                        return
                    print(f"[AI缓存命中] mode={model_mode}, model={resolved_model}, question={question[:60]}...", flush=True)
                    profile_after = build_user_profile(user["username"])
                    self._send_json(200, {"code": 200, "msg": quota_msg, "data": {"answer": answer, "model": resolved_model, "mode": model_mode, "cache": True, "profile": profile_after, "remainCount": 999999 if profile_after and profile_after.get("active_member") else int((profile_after or {}).get("points_balance") or 0)}})
                    return
                if model_mode == "custom":
                    print(f"[AI请求] mode=custom, model={resolved_model}, question={question[:60]}...", flush=True)
                    answer, err = ask_ai_custom(question, custom_cfg)
                else:
                    enabled = get_enabled_providers()
                    if not enabled:
                        self._send_json(500, {"code": 500, "msg": "没有启用的 AI 提供商，请先配置"})
                        return
                    print(f"[AI请求] mode=auto, question={question[:60]}...", flush=True)
                    answer, err, resolved_model, provider_name = ask_ai_auto(question)
                if model_mode != "custom" and not resolved_model:
                    self._send_json(500, {"code": 500, "msg": "没有启用的 AI 提供商，请先配置"})
                    return
                if answer:
                    answer = normalize_ai_answer(question, answer)
                    status = "success"
                    set_ai_cache(cache_key, answer, resolved_model, provider_name)
                    save_question_bank_answer(question, answer, resolved_model, provider_name)
                    ok_quota, quota_msg, ent_after = consume_answer_quota(user["username"], question_hash)
                    if not ok_quota:
                        err = quota_msg
                        self._send_json(402, {"code": 402, "msg": quota_msg})
                        return
                    profile_after = build_user_profile(user["username"])
                    self._send_json(200, {"code": 200, "msg": quota_msg, "data": {"answer": answer, "model": resolved_model, "mode": model_mode, "cache": False, "profile": profile_after, "remainCount": 999999 if profile_after and profile_after.get("active_member") else int((profile_after or {}).get("points_balance") or 0)}})
                else:
                    print(f"[AI错误] {err}", flush=True)
                    self._send_json(500, {"code": 500, "msg": err or "AI 请求失败"})
            except Exception as e:
                err = str(e)
                self._send_json(500, {"code": 500, "msg": str(e)})
            finally:
                if question or resolved_model or model:
                    enqueue_ai_log({
                        "provider_key": provider_name or "",
                        "username": user.get("username", "") if user else "",
                        "model": resolved_model or model,
                        "question": question,
                        "answer": answer or "",
                        "status": status,
                        "error": err or "",
                        "duration_ms": int((time.time() - start_ts) * 1000),
                        "client_ip": self.client_address[0] if self.client_address else ""
                    })

        # ========== AI Agent 决策接口 ==========
        elif path == "/api/agent/decide":
            start_ts = time.time()
            try:
                # 限流：每分钟最多 20 次 agent 决策请求
                ok_rate, retry_rate = check_api_rate(self._client_ip(), "/api/agent/decide", 20, 60)
                if not ok_rate:
                    self._send_json(429, {"code": 429, "msg": f"请求过于频繁，请 {retry_rate} 秒后再试"}, {"Retry-After": str(retry_rate)})
                    return
                user = self._get_user_from_token()
                if not user:
                    self._send_json(401, {"code": 401, "msg": "AIAGENT 登录态未同步，请稍后重试或点击用户中心确认登录状态"})
                    return

                data = json.loads(body or "{}")
                task = data.get("task", "")
                step = data.get("step", 0)
                max_steps = data.get("max_steps", 30)
                history = data.get("history", [])
                browser_state = data.get("browser_state", {})
                script_settings = data.get("script_settings", {})
                tools = data.get("tools", [])

                if not task:
                    self._send_json(400, {"code": 400, "msg": "缺少 task 参数"})
                    return
                if not tools:
                    self._send_json(400, {"code": 400, "msg": "缺少 tools 参数"})
                    return

                # 构建消息
                system_prompt = build_agent_system_prompt(tools)
                user_message = build_agent_user_message(task, step, max_steps, history, browser_state, script_settings)
                messages = [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ]

                print(f"[Agent] Step {step + 1}/{max_steps}, task={task[:60]}...", flush=True)

                # 调用 LLM
                answer, err, resolved_model, provider_name = call_agent_llm(messages)

                if err:
                    print(f"[Agent] LLM 调用失败: {err}", flush=True)
                    self._send_json(500, {"code": 500, "msg": err})
                    return

                # 解析决策
                decision = parse_agent_decision(answer)
                print(f"[Agent] 决策: tool={decision.get('action', {}).get('tool_name', '?')}, "
                      f"goal={decision.get('next_goal', '')[:60]}", flush=True)

                self._send_json(200, {
                    "code": 200,
                    "data": decision,
                    "model": resolved_model,
                    "provider": provider_name
                })

            except Exception as e:
                print(f"[Agent] 异常: {str(e)}", flush=True)
                self._send_json(500, {"code": 500, "msg": str(e)})
            finally:
                duration_ms = int((time.time() - start_ts) * 1000)
                if duration_ms > 5000:
                    print(f"[Agent] 决策耗时 {duration_ms}ms", flush=True)

        else:
            self._send_json(404, {"code": 404, "msg": "not found"})


def _log_cleanup_worker():
    """后台线程：每天检查并清理过期日志和AI缓存"""
    import time as _time
    while True:
        try:
            retention = db.get_log_retention_days()
            if retention > 0:
                result = db.cleanup_old_logs(retention)
                total = sum(v for v in result.values() if v > 0)
                if total > 0:
                    print(f"[日志清理] 保留{retention}天，已清理 {total} 条记录: {result}", flush=True)
            # 清理超过30天未使用的AI缓存
            try:
                db.cleanup_expired_ai_cache(30)
            except Exception:
                pass
        except Exception as e:
            print(f"[日志清理] 异常: {e}", flush=True)
        _time.sleep(86400)  # 24小时

def _start_log_cleanup_thread():
    import threading
    t = threading.Thread(target=_log_cleanup_worker, daemon=True)
    t.start()
    print("[日志清理] 定时清理线程已启动", flush=True)


if __name__ == "__main__":
    print("=" * 60)
    print("  学神助手 - 自建后端已启动")
    print(f"  数据库:    MySQL")
    print(f"  AI 接口:   http://127.0.0.1:{PORT}/api/v1/cx")
    print(f"  Agent接口: http://127.0.0.1:{PORT}/api/agent/decide")
    print(f"  用户注册:  http://127.0.0.1:{PORT}/api/auth/register")
    print(f"  用户登录:  http://127.0.0.1:{PORT}/api/auth/login")
    print(f"  用户页面:  http://127.0.0.1:{PORT}/user")
    print(f"  管理后台:  http://127.0.0.1:{PORT}/admin")
    print("=" * 60)
    enabled_count = len(get_enabled_providers())
    if enabled_count == 0:
        print("  ⚠️  当前没有启用的 AI 提供商")
    else:
        print(f"  ✓ 已有 {enabled_count} 个提供商就绪")
    print("=" * 60)
    _start_log_cleanup_thread()
    _start_daily_report_thread()
    server = ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n服务已停止")
