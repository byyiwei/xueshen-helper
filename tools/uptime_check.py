#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
学神助手 · 可用性巡检

独立于 xs-backend 运行：后端挂了、数据库机挂了、磁盘满了，都还能发邮件。
只依赖 Python 标准库，配置读 /etc/xs-alert.json，状态存 /var/lib/xs-uptime/state.json。

用法：
    python3 uptime_check.py            # 正常巡检（cron 每 5 分钟跑一次）
    python3 uptime_check.py --test     # 只发一封测试邮件，不写状态
    python3 uptime_check.py --once     # 巡检一次并把结果打印出来，不发邮件
"""

import json
import os
import smtplib
import socket
import ssl
import subprocess
import sys
import time
import urllib.error
import urllib.request
from email.header import Header
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr, formatdate

CONFIG_PATH = "/etc/xs-alert.json"
STATE_DIR = "/var/lib/xs-uptime"
STATE_PATH = os.path.join(STATE_DIR, "state.json")
LOG_PATH = "/var/log/xs-uptime.log"

REPEAT_ALERT_SEC = 30 * 60   # 持续故障时每 30 分钟提醒一次
SILENT_RECOVER_SEC = 0       # 恢复邮件立即发


def log(msg):
    line = "[%s] %s" % (time.strftime("%Y-%m-%d %H:%M:%S"), msg)
    print(line, flush=True)
    try:
        with open(LOG_PATH, "a", encoding="utf-8") as f:
            f.write(line + "\n")
    except Exception:
        pass


def load_config():
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def load_state():
    try:
        with open(STATE_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def save_state(state):
    os.makedirs(STATE_DIR, exist_ok=True)
    tmp = STATE_PATH + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(state, f, ensure_ascii=False, indent=2)
    os.replace(tmp, STATE_PATH)


# ---------------------------------------------------------------- 检查项

def check_http(name, url, expect=200, timeout=12, keyword=None):
    """返回 (ok, detail)。detail 会写进邮件，所以要能看懂。"""
    req = urllib.request.Request(url, headers={"User-Agent": "XS-Uptime/1.0"})
    started = time.time()
    try:
        with urllib.request.urlopen(req, timeout=timeout, context=ssl.create_default_context()) as resp:
            body = resp.read(4096).decode("utf-8", "replace")
            cost = int((time.time() - started) * 1000)
            if resp.status != expect:
                return False, "HTTP %s（耗时 %sms）" % (resp.status, cost)
            if keyword and keyword not in body:
                return False, "HTTP %s 但返回内容不对（缺少 %s）" % (resp.status, keyword)
            return True, "HTTP %s，%sms" % (resp.status, cost)
    except urllib.error.HTTPError as e:
        return False, "HTTP %s" % e.code
    except Exception as e:
        return False, "%s: %s" % (type(e).__name__, e)


def check_tcp(name, host, port, timeout=6):
    started = time.time()
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True, "已连通，%sms" % int((time.time() - started) * 1000)
    except Exception as e:
        return False, "连接失败：%s" % e


def check_service(name, unit):
    try:
        out = subprocess.run(["systemctl", "is-active", unit], capture_output=True, text=True, timeout=10)
        status = (out.stdout or "").strip()
        if status == "active":
            return True, "运行中"
        return False, "状态 %s" % (status or "unknown")
    except Exception as e:
        return False, "查询失败：%s" % e


def check_disk(name, path, max_pct):
    try:
        st = os.statvfs(path)
        used = (st.f_blocks - st.f_bfree) * st.f_frsize
        total = st.f_blocks * st.f_frsize
        pct = used * 100.0 / total
        detail = "已用 %.1f%%（剩余 %.1f GB）" % (pct, (total - used) / 1024 / 1024 / 1024)
        return pct < max_pct, detail
    except Exception as e:
        return False, "读取失败：%s" % e


def check_memory(name, min_available_mb):
    try:
        info = {}
        with open("/proc/meminfo", "r", encoding="utf-8") as f:
            for line in f:
                key = line.split(":", 1)[0]
                if key in ("MemAvailable", "MemTotal"):
                    info[key] = int(line.split()[1]) / 1024.0
        avail = info.get("MemAvailable", 0)
        total = info.get("MemTotal", 1)
        detail = "可用 %.0f MB / 共 %.0f MB" % (avail, total)
        return avail >= min_available_mb, detail
    except Exception as e:
        return False, "读取失败：%s" % e


def run_checks(cfg):
    results = []
    for item in cfg.get("checks", []):
        kind = item.get("type")
        name = item.get("name") or kind
        if kind == "http":
            ok, detail = check_http(name, item["url"], item.get("expect", 200), item.get("timeout", 12), item.get("keyword"))
        elif kind == "tcp":
            ok, detail = check_tcp(name, item["host"], item["port"], item.get("timeout", 6))
        elif kind == "service":
            ok, detail = check_service(name, item["unit"])
        elif kind == "disk":
            ok, detail = check_disk(name, item.get("path", "/"), item.get("max_pct", 85))
        elif kind == "memory":
            ok, detail = check_memory(name, item.get("min_available_mb", 200))
        else:
            ok, detail = False, "未知检查类型 %s" % kind
        results.append({"key": item.get("key") or name, "name": name, "ok": ok, "detail": detail})
    return results


# ---------------------------------------------------------------- 邮件

def send_mail(cfg, subject, text_body, html_body):
    smtp = cfg.get("smtp") or {}
    recipients = [x for x in (cfg.get("recipients") or []) if x]
    if not recipients:
        log("没有配置收件人，跳过发信")
        return False
    if not smtp.get("host") or not smtp.get("user"):
        log("没有配置 SMTP，跳过发信")
        return False

    msg = MIMEMultipart("alternative")
    msg["Subject"] = Header(subject, "utf-8")
    msg["From"] = formataddr((str(Header(smtp.get("from_name") or "学神助手", "utf-8")),
                              smtp.get("from_addr") or smtp.get("user")))
    msg["To"] = ", ".join(recipients)
    msg["Date"] = formatdate(localtime=True)
    msg.attach(MIMEText(text_body, "plain", "utf-8"))
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    host = smtp["host"]
    port = int(smtp.get("port") or 587)
    try:
        if port == 465:
            server = smtplib.SMTP_SSL(host, port, timeout=20, context=ssl.create_default_context())
        else:
            server = smtplib.SMTP(host, port, timeout=20)
            server.ehlo()
            if smtp.get("starttls", True):
                server.starttls(context=ssl.create_default_context())
                server.ehlo()
        server.login(smtp["user"], smtp["pass"])
        server.sendmail(msg["From"], recipients, msg.as_string())
        server.quit()
        log("邮件已发送：%s -> %s" % (subject, ", ".join(recipients)))
        return True
    except Exception as e:
        log("邮件发送失败：%s" % e)
        return False


def build_mail(kind, down_list, up_list, results, now_text):
    """kind: down / recover / test"""
    if kind == "down":
        title = "服务异常，请尽快处理"
        color = "#dc2626"
    elif kind == "recover":
        title = "服务已恢复"
        color = "#059669"
    else:
        title = "巡检测试邮件"
        color = "#2563eb"

    rows = []
    for r in results:
        if kind == "down" and r["ok"]:
            continue
        if kind == "recover" and not r["ok"]:
            continue
        mark = "正常" if r["ok"] else "异常"
        mark_color = "#059669" if r["ok"] else "#dc2626"
        rows.append(
            '<tr><td style="padding:10px 12px;border-bottom:1px solid #eef1f5;color:#374151;font-size:14px;">%s</td>'
            '<td style="padding:10px 12px;border-bottom:1px solid #eef1f5;color:%s;font-size:14px;font-weight:600;">%s</td>'
            '<td style="padding:10px 12px;border-bottom:1px solid #eef1f5;color:#6b7280;font-size:13px;">%s</td></tr>'
            % (r["name"], mark_color, mark, r["detail"])
        )
    if not rows:
        rows.append('<tr><td colspan="3" style="padding:12px;color:#6b7280;font-size:14px;">无</td></tr>')

    html = """<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
<table width="100%%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding:32px 16px;">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%%;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 2px 12px rgba(15,23,42,0.06);">
<tr><td style="padding:24px 28px;border-bottom:1px solid #eef1f5;">
<div style="font-size:13px;color:#9aa3af;letter-spacing:1px;">学神助手 · 可用性巡检</div>
<div style="font-size:20px;font-weight:600;color:%s;margin-top:6px;">%s</div>
<div style="font-size:13px;color:#9aa3af;margin-top:6px;">%s</div>
</td></tr>
<tr><td style="padding:18px 28px 6px;">
<table width="100%%" cellpadding="0" cellspacing="0" border="0">%s</table>
</td></tr>
<tr><td style="padding:16px 28px 26px;">
<div style="font-size:12px;color:#9aa3af;line-height:1.7;">这是服务器自动发出的巡检提醒。持续异常时每 30 分钟提醒一次，恢复后会自动通知。</div>
</td></tr></table></td></tr></table></body></html>""" % (color, title, now_text, "".join(rows))

    text_lines = ["学神助手 · 可用性巡检", title, now_text, ""]
    for r in results:
        if kind == "down" and r["ok"]:
            continue
        if kind == "recover" and not r["ok"]:
            continue
        text_lines.append("[%s] %s - %s" % ("正常" if r["ok"] else "异常", r["name"], r["detail"]))
    text_lines.append("")
    text_lines.append("持续异常时每 30 分钟提醒一次，恢复后会自动通知。")
    subject_prefix = {"down": "【异常】", "recover": "【恢复】", "test": "【测试】"}[kind]
    return subject_prefix + "学神助手巡检：" + title, "\n".join(text_lines), html


# ---------------------------------------------------------------- 主流程

def main():
    argv = sys.argv[1:]
    cfg = load_config()
    results = run_checks(cfg)
    now = time.time()
    now_text = time.strftime("%Y-%m-%d %H:%M:%S")
    down = [r for r in results if not r["ok"]]

    if "--once" in argv:
        for r in results:
            print(("正常" if r["ok"] else "异常"), r["name"], "-", r["detail"])
        return 0

    if "--test" in argv:
        subject, text, html = build_mail("test", down, [], results, now_text)
        ok = send_mail(cfg, subject, text, html)
        return 0 if ok else 1

    state = load_state()
    changed = False

    for r in results:
        prev = state.get(r["key"]) or {}
        was_ok = prev.get("ok", True)
        last_alert = float(prev.get("last_alert") or 0)

        if not r["ok"]:
            if was_ok or now - last_alert >= REPEAT_ALERT_SEC:
                subject, text, html = build_mail("down", down, [], results, now_text)
                if send_mail(cfg, subject, text, html):
                    state[r["key"]] = {"ok": False, "last_alert": now, "detail": r["detail"]}
                    changed = True
                    log("已发送异常提醒：%s（%s）" % (r["name"], r["detail"]))
            else:
                state[r["key"]] = {"ok": False, "last_alert": last_alert, "detail": r["detail"]}
                changed = True
        else:
            if not was_ok and prev:
                subject, text, html = build_mail("recover", [], [], results, now_text)
                send_mail(cfg, subject, text, html)
                log("已发送恢复通知：%s" % r["name"])
            state[r["key"]] = {"ok": True, "last_alert": 0, "detail": r["detail"]}
            changed = True

    if changed:
        state["_updated_at"] = now_text
        save_state(state)

    if not down:
        log("巡检正常 %d/%d" % (len(results) - len(down), len(results)))
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:  # 巡检脚本自己不能把 cron 搞崩，但要把错误写进日志
        log("巡检脚本异常：%s: %s" % (type(exc).__name__, exc))
        sys.exit(1)
