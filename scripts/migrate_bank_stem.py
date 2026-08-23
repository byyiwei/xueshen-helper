#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
迁移：为 question_bank 现有行填充 match_stem（题面+题型+图片，不含选项）。
hash 逻辑与 backend.py 保持一致。
"""
import os, re, sys, json, hashlib, argparse, pymysql
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
    images = info.get("images") or []
    items = sorted({str(x).strip() for x in images if str(x).strip()})
    img_fp = hashlib.sha256("|".join(items).encode("utf-8")).hexdigest() if items else ""
    return q, t, opts, img_fp


def make_match_stem(question):
    q, t, opts, img_fp = _normalized_components(question)
    normalized = {"q": q}
    if img_fp:
        normalized["img"] = img_fp
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
    p.add_argument("--dry-run", action="store_true")
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
                    args.database = d; break
            except Exception:
                pass
        if not args.database:
            print("未找到库"); sys.exit(1)
        conn.select_db(args.database)
        print(f"[info] 数据库: {args.database}")

    try:
        cur.execute("ALTER TABLE question_bank ADD COLUMN match_stem VARCHAR(64) NOT NULL DEFAULT '' COMMENT '匹配主干'")
        conn.commit(); print("[info] 已加 match_stem 列")
    except Exception as e:
        print(f"[info] 列已存在(忽略): {e}")
    try:
        cur.execute("ALTER TABLE question_bank ADD INDEX idx_match_stem (match_stem)")
        conn.commit()
    except Exception as e:
        print(f"[info] 索引已存在(忽略): {e}")

    cur.execute("SELECT COUNT(*) AS c FROM question_bank")
    total = cur.fetchone()["c"]
    print(f"[info] 全表重算 match_stem: {total} 行")
    if args.dry_run:
        cur.close(); conn.close(); return

    cur.execute("SELECT id, question_text, question_type, options_text FROM question_bank")
    rows = cur.fetchall()
    updated = 0
    for r in rows:
        stem = make_match_stem(build_payload(r))
        cur.execute("UPDATE question_bank SET match_stem=%s WHERE id=%s", (stem, r["id"]))
        updated += 1
        if updated % 500 == 0:
            conn.commit(); print(f"[进度] {updated}/{len(rows)}")
    conn.commit()
    cur.execute("SELECT COUNT(*) AS c FROM question_bank WHERE match_stem=''")
    print(f"[完成] 更新 {updated} 行，剩余空 match_stem: {cur.fetchone()['c']}")
    cur.close(); conn.close()


if __name__ == "__main__":
    main()
