#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
去重清理：处理迁移后 question_hash UNIQUE 冲突的重复行。
每组(题面+题型+选项+归一化答案)保留 id 最小的一行，删除其余重复行；
随后对剩余行补齐 question_hash 与 matching_key（幂等）。
hash 逻辑与 backend.py / migrate_bank_hash.py 保持一致。
"""
import os
import re
import sys
import json
import hashlib
import argparse
import pymysql
from pymysql.cursors import DictCursor


def normalize_question_text(text):
    text = str(text or "")
    text = re.sub(r"\s+", "", text)
    text = re.sub(r"[A-D]\s*[.、．)]", "", text, flags=re.I)
    text = re.sub(r"[，。！？；：,.!?;:\-—_【】\[\]（）()\"'“”‘’]", "", text)
    return text.lower()


def parse_question_payload(question):
    raw = str(question or "")
    result = {"question_text": raw, "question_type": "", "options": [], "images": []}
    try:
        data = json.loads(raw)
        if isinstance(data, dict):
            result["question_text"] = str(data.get("question") or raw)
            result["question_type"] = str(data.get("type") or "")
            options = data.get("options") or []
            if isinstance(options, list):
                result["options"] = [str(x).strip() for x in options if str(x).strip()]
            images = data.get("images") or []
            if isinstance(images, list):
                result["images"] = [str(x).strip() for x in images if str(x).strip()]
            elif images:
                result["images"] = [str(images).strip()]
    except Exception:
        pass
    return result


def _normalized_components(question):
    info = parse_question_payload(question)
    q = normalize_question_text(info.get("question_text", ""))
    t = normalize_question_text(info.get("question_type", ""))
    opts = sorted({normalize_question_text(x) for x in info.get("options", []) if normalize_question_text(x)})
    return q, t, opts


def make_matching_key(question):
    q, t, opts = _normalized_components(question)
    normalized = {"q": q, "type": t, "options": opts}
    return hashlib.sha256(json.dumps(normalized, ensure_ascii=False, sort_keys=True).encode("utf-8")).hexdigest()


def normalize_answer_for_hash(answer):
    if not answer:
        return ""
    text = str(answer).strip()
    m = re.match(r"^\s*(?:正确答案是?|答案是?|选择?|选|应该选|应该选择?)\s*([A-Da-d])", text, re.I)
    if m:
        return m.group(1).upper()
    clean = re.sub(r"[\s、,，&+与和]+", "", text)
    if re.fullmatch(r"[A-Da-d]+", clean):
        uniq = sorted(set(c.upper() for c in clean))
        return ",".join(uniq)
    low = text[:30].lower()
    if any(k in low for k in ["正确", "对", "true", "√", "right"]):
        return "正确"
    if any(k in low for k in ["错误", "不对", "错", "false", "×", "✗", "wrong"]):
        return "错误"
    t = re.sub(r"\s+", "", text)
    t = re.sub(r"[，。！？；：,.!?;:\-—_【】\[\]（）()\"'“”‘’]", "", t)
    return t.lower()


def make_question_hash(question, answer=None):
    q, t, opts = _normalized_components(question)
    a = normalize_answer_for_hash(answer) if answer is not None else ""
    normalized = {"q": q, "type": t, "options": opts, "answer": a}
    return hashlib.sha256(json.dumps(normalized, ensure_ascii=False, sort_keys=True).encode("utf-8")).hexdigest()


def build_payload(row):
    opts = [o.strip() for o in re.split(r"\s*\|\s*", row.get("options_text") or "") if o.strip()]
    return json.dumps({"question": row.get("question_text") or "", "type": row.get("question_type") or "", "options": opts}, ensure_ascii=False)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--host", default=os.environ.get("MYSQL_HOST", "127.0.0.1"))
    p.add_argument("--port", type=int, default=int(os.environ.get("MYSQL_PORT", "3306")))
    p.add_argument("--user", default=os.environ.get("MYSQL_USER", "root"))
    p.add_argument("--password", default=os.environ.get("MYSQL_PASSWORD", ""))
    p.add_argument("--database", default=os.environ.get("MYSQL_DATABASE", ""))
    p.add_argument("--dry-run", action="store_true", help="只读预检，不写数据")
    args = p.parse_args()

    conn = pymysql.connect(host=args.host, port=args.port, user=args.user,
                           password=args.password, database=args.database or None,
                           charset="utf8mb4", connect_timeout=15, cursorclass=DictCursor)
    cur = conn.cursor()

    if not args.database:
        cur.execute("SHOW DATABASES")
        for d in [r["Database"] for r in cur.fetchall()]:
            try:
                cur.execute(f"SHOW TABLES FROM `{d}` LIKE 'question_bank'")
                if cur.fetchone():
                    args.database = d
                    break
            except Exception:
                pass
        if not args.database:
            print("未找到 question_bank 表所在库"); sys.exit(1)
        conn.select_db(args.database)
        print(f"[info] 自动选定数据库: {args.database}")

    cur.execute("SELECT id, question_text, question_type, options_text, answer FROM question_bank")
    rows = cur.fetchall()
    print(f"[info] 读取 {len(rows)} 行")

    # 计算每行 (id, qhash, mkey)
    records = []  # (id, qhash, mkey)
    for r in rows:
        payload = build_payload(r)
        qhash = make_question_hash(payload, r.get("answer"))
        mkey = make_matching_key(payload)
        records.append((r["id"], qhash, mkey))

    # 按 qhash 分组找重复
    groups = {}
    for (rid, qhash, mkey) in records:
        groups.setdefault(qhash, []).append((rid, mkey))

    to_delete = []
    to_update = []
    dup_groups = 0
    for qhash, items in groups.items():
        items.sort(key=lambda x: x[0])
        keep = items[0]
        for it in items[1:]:
            to_delete.append(it[0])
        if len(items) > 1:
            dup_groups += 1
        to_update.append((keep[0], qhash, keep[1]))

    print(f"[info] 重复 hash 组数: {dup_groups}, 待删除行: {len(to_delete)}")

    if args.dry_run:
        print("[dry-run] 不执行任何写操作")
        cur.close()
        conn.close()
        return

    if to_delete:
        for i in range(0, len(to_delete), 500):
            chunk = to_delete[i:i + 500]
            phs = ",".join(["%s"] * len(chunk))
            cur.execute(f"DELETE FROM question_bank WHERE id IN ({phs})", chunk)
        conn.commit()
        print(f"[完成] 已删除 {len(to_delete)} 行重复数据")

    updated = 0
    for i in range(0, len(to_update), 500):
        chunk = to_update[i:i + 500]
        for (rid, qhash, mkey) in chunk:
            cur.execute("UPDATE question_bank SET question_hash=%s, matching_key=%s WHERE id=%s", (qhash, mkey, rid))
            updated += 1
        conn.commit()
    print(f"[完成] 补齐更新 {updated} 行")

    cur.execute("SELECT COUNT(*) AS c FROM (SELECT matching_key FROM question_bank GROUP BY matching_key HAVING COUNT(*)>1) t")
    print(f"[校验] 同 matching_key 多答案版本组数: {cur.fetchone()['c']}")
    cur.execute("SELECT COUNT(DISTINCT question_hash) AS d, COUNT(*) AS t FROM question_bank")
    r2 = cur.fetchone()
    print(f"[校验] question_hash 去重后 {r2['d']} / 总行数 {r2['t']}")

    cur.close()
    conn.close()


if __name__ == "__main__":
    main()
