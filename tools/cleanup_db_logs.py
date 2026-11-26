#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""清理学神数据库里的日志表：先归档再删，只保留最近 N 天。

    /www/wwwroot/xs.openget.cn/venv/bin/python cleanup_db_logs.py --days 14
    /www/wwwroot/xs.openget.cn/venv/bin/python cleanup_db_logs.py --days 14 --dry-run

只动日志表，不碰用户、题库、订单、答题记录：
  - script_event_logs  脚本日志/异常页数据
  - bank_call_logs     题库查询记录
  - ai_call_logs       AI 调用记录

删除前先把要删的行按表导出为 gzip CSV，放 /www/backup/xs-logs，
归档超过 --keep-archive-days 天自动删掉。数据库连接信息从
/etc/xs-backend.env 读取（由 cron 在执行前 source）。
"""
import argparse
import csv
import gzip
import os
import sys
import time
from datetime import datetime, timedelta

import pymysql

TABLES = ("script_event_logs", "bank_call_logs", "ai_call_logs")


def connect():
    return pymysql.connect(
        host=os.environ["MYSQL_HOST"],
        port=int(os.environ.get("MYSQL_PORT") or 3306),
        user=os.environ["MYSQL_USER"],
        password=os.environ["MYSQL_PASSWORD"],
        database=os.environ["MYSQL_DATABASE"],
        charset="utf8mb4",
        ssl_disabled=True,
        autocommit=True,
    )


def log(msg):
    print("[%s] %s" % (datetime.now().strftime("%Y-%m-%d %H:%M:%S"), msg), flush=True)


def archive_rows(cur, table, cutoff, archive_dir):
    path = os.path.join(archive_dir, "%s_%s.csv.gz" % (table, datetime.now().strftime("%Y%m%d_%H%M%S")))
    n = 0
    cur.execute("SELECT * FROM %s WHERE created_at < %%s ORDER BY id" % table, (cutoff,))
    cols = [d[0] for d in cur.description]
    with gzip.open(path, "wt", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(cols)
        while True:
            rows = cur.fetchmany(2000)
            if not rows:
                break
            for row in rows:
                w.writerow(["" if v is None else str(v) for v in row])
                n += 1
    return path, n


def cleanup_table(conn, table, cutoff, archive_dir, batch, dry_run):
    cur = conn.cursor(pymysql.cursors.SSCursor)
    cur.execute("SELECT COUNT(*) FROM %s WHERE created_at < %%s" % table, (cutoff,))
    total = int(cur.fetchone()[0])
    cur.close()
    if total == 0:
        log("%s: 0 条过期，跳过" % table)
        return 0
    log("%s: 待清理 %d 条（早于 %s）" % (table, total, cutoff))
    if dry_run:
        return total
    try:
        path, archived = archive_rows(conn.cursor(pymysql.cursors.SSCursor), table, cutoff, archive_dir)
        log("%s: 已归档 %d 条 -> %s" % (table, archived, path))
    except Exception as e:
        log("%s: 归档失败，本次不删：%s" % (table, e))
        return 0
    deleted = 0
    while True:
        cur = conn.cursor()
        cur.execute("DELETE FROM %s WHERE created_at < %%s LIMIT %d" % (table, int(batch)), (cutoff,))
        n = cur.rowcount
        cur.close()
        deleted += n
        if n < batch:
            break
        time.sleep(0.1)
    log("%s: 已删除 %d 条" % (table, deleted))
    return deleted


def prune_archives(archive_dir, keep_days):
    if not os.path.isdir(archive_dir):
        return
    cutoff = time.time() - keep_days * 86400
    for name in os.listdir(archive_dir):
        path = os.path.join(archive_dir, name)
        try:
            if os.path.getmtime(path) < cutoff:
                os.remove(path)
                log("删除过期归档 %s" % path)
        except OSError as e:
            log("清理归档失败 %s: %s" % (path, e))


def main():
    ap = argparse.ArgumentParser(description="归档并清理数据库日志表")
    ap.add_argument("--days", type=int, default=14, help="保留最近多少天，默认 14")
    ap.add_argument("--batch", type=int, default=5000, help="每次删除行数，默认 5000")
    ap.add_argument("--archive-dir", default="/www/backup/xs-logs", help="归档目录")
    ap.add_argument("--keep-archive-days", type=int, default=60, help="归档保留天数，默认 60")
    ap.add_argument("--dry-run", action="store_true", help="只看数量，不归档不删除")
    args = ap.parse_args()

    cutoff = (datetime.now() - timedelta(days=args.days)).strftime("%Y-%m-%d %H:%M:%S")
    os.makedirs(args.archive_dir, exist_ok=True)
    conn = connect()
    deleted_total = 0
    try:
        for table in TABLES:
            deleted_total += cleanup_table(conn, table, cutoff, args.archive_dir, args.batch, args.dry_run)
    finally:
        conn.close()
    if not args.dry_run:
        prune_archives(args.archive_dir, args.keep_archive_days)
        log("完成，共删除 %d 条" % deleted_total)
    else:
        log("dry-run 结束，共预计删除 %d 条" % deleted_total)
    return 0


if __name__ == "__main__":
    sys.exit(main())