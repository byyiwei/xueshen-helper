#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""发版后健康检查：新版本上线后跑一遍，确认章节测验真的能解析。

    python tools/check_release_health.py                  # 查 scripts/version.json 里的当前版本，看最近 20 分钟
    python tools/check_release_health.py --minutes 40     # 多给用户一点更新时间
    python tools/check_release_health.py --version 6.1.6  # 指定要盯的版本

判定规则（2026-11-22 6.1.5 事故后加的）：
- 新版本还没人用：正常，只提示「还在等用户更新」，退出码 0
- 新版本「发现测验」有记录，但「成功解析到题目」是 0、同时有「没有解析到题目」：
  判定为坏版本，退出码 2，并打印回滚命令。发版流程里必须看到成功记录才算发完。

数据库不直连：SSH 到生产服务器，用系统里的 /etc/xs-backend.env 连库，
脚本本身不存任何密码。服务器上不留临时文件，查询代码走 stdin。
"""
import argparse
import json
import os
import sys

import paramiko

if hasattr(sys.stdout, "reconfigure"):          # Windows 控制台默认 GBK，别让中文把自己编码搞崩
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SERVER_CONFIG = os.path.join(ROOT, "config", "server.json")
VERSION_JSON = os.path.join(ROOT, "scripts", "version.json")
DEPLOY_DIR = "/www/wwwroot/xs.openget.cn"

REMOTE_CODE = r'''
import json, os
import pymysql

conn = pymysql.connect(
    host=os.environ["MYSQL_HOST"],
    port=int(os.environ.get("MYSQL_PORT") or 3306),
    user=os.environ["MYSQL_USER"],
    password=os.environ["MYSQL_PASSWORD"],
    database=os.environ["MYSQL_DATABASE"],
    charset="utf8mb4",
    ssl_disabled=True,
)
cur = conn.cursor()
cur.execute(
    "SELECT script_version,"
    " SUM(message LIKE %s) AS parsed_ok,"
    " SUM(message LIKE %s) AS parse_fail,"
    " SUM(message LIKE %s) AS discovered,"
    " COUNT(DISTINCT username) AS users,"
    " MAX(created_at) AS last_seen"
    " FROM script_event_logs"
    " WHERE created_at >= NOW() - INTERVAL %s MINUTE"
    " AND script_version IS NOT NULL AND script_version <> ''"
    " GROUP BY script_version"
    " ORDER BY discovered DESC, script_version DESC",
    ("%成功解析到%个题目%", "%没有解析到题目%", "%发现测验%", int(os.environ.get("XS_MINUTES") or 20)),
)
rows = []
for version, parsed_ok, parse_fail, discovered, users, last_seen in cur.fetchall():
    rows.append({
        "version": version,
        "parsed_ok": int(parsed_ok or 0),
        "parse_fail": int(parse_fail or 0),
        "discovered": int(discovered or 0),
        "users": int(users or 0),
        "last_seen": str(last_seen or ""),
    })
conn.close()
print(json.dumps(rows, ensure_ascii=True))
'''


def current_version():
    with open(VERSION_JSON, encoding="utf-8") as f:
        data = json.load(f)
    sc = data.get("xueshen-sc") or {}
    return str(sc.get("version") or "").strip()


def fetch_rows(minutes):
    with open(SERVER_CONFIG, encoding="utf-8") as f:
        cfg = json.load(f)
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(cfg["host"], port=int(cfg.get("port") or 22),
                username=cfg["user"], password=cfg["password"], timeout=20)
    try:
        command = ("set -a; . /etc/xs-backend.env; set +a; "
                   "XS_MINUTES=%d %s/venv/bin/python -" % (minutes, DEPLOY_DIR))
        stdin, stdout, stderr = ssh.exec_command(command, timeout=90)
        stdin.write(REMOTE_CODE)
        stdin.channel.shutdown_write()
        out = stdout.read().decode("utf-8", "replace").strip()
        err = stderr.read().decode("utf-8", "replace").strip()
    finally:
        ssh.close()
    if not out:
        raise SystemExit("查不到线上日志数据，远端没有任何输出。\n%s" % err[-1500:])
    try:
        return json.loads(out.splitlines()[-1])
    except ValueError:
        raise SystemExit("远端返回的不是 JSON：\n%s" % out[-1500:])


def main():
    parser = argparse.ArgumentParser(description="发版后核对章节测验解析情况")
    parser.add_argument("--version", default="", help="要盯的版本号，默认取 scripts/version.json")
    parser.add_argument("--minutes", type=int, default=20, help="回看多少分钟，默认 20")
    args = parser.parse_args()

    target = (args.version or current_version()).lstrip("v")
    if not target:
        raise SystemExit("拿不到当前版本号，用 --version 指定一个")

    rows = fetch_rows(args.minutes)
    print("最近 %d 分钟线上日志（章节测验）：" % args.minutes)
    print("  %-10s %8s %8s %8s %6s   %s" % ("版本", "发现测验", "解析成功", "解析失败", "用户", "最后一条"))
    for row in rows:
        print("  %-10s %8d %8d %8d %6d   %s"
              % (row["version"], row["discovered"], row["parsed_ok"],
                 row["parse_fail"], row["users"], row["last_seen"]))

    mine = next((r for r in rows if r["version"] == target), None)
    if mine is None or mine["discovered"] == 0:
        print("\nOK   %s 还没有「发现测验」记录，可能还在等用户更新。"
              "过一阵再跑一次，或让用户手动检查更新。" % target)
        return 0
    if mine["parsed_ok"] == 0 and mine["parse_fail"] > 0:
        print("\nFAIL %s 发现测验 %d 次、解析成功 0 次、失败 %d 次：章节测验解析坏了，建议立刻回滚。"
              % (target, mine["discovered"], mine["parse_fail"]))
        print("     回滚：重新部署上一个版本的 scripts 三件套 + 重建历史版本库，"
              "并在用户群里提示手动更新。")
        return 2
    print("\nOK   %s 已解析成功 %d 次（失败 %d 次），答题功能正常。"
          % (target, mine["parsed_ok"], mine["parse_fail"]))
    return 0


if __name__ == "__main__":
    sys.exit(main())
