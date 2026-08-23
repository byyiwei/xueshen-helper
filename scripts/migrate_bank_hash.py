#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
迁移脚本：重算 question_bank 的 question_hash(含答案) 与 matching_key。
hash 逻辑必须与 backend.py 中的 make_question_hash / make_matching_key /
normalize_answer_for_hash 保持一致（此处为复制，改动需同步）。

用法：
  设置环境变量 MYSQL_HOST/MYSQL_PORT/MYSQL_USER/MYSQL_PASSWORD（MYSQL_DATABASE 可选，缺省自动探测）
  python migrate_bank_hash.py            # 正式执行（先备份再更新）
  python migrate_bank_hash.py --dry-run  # 只读预检，不写数据
"""
import os
import re
import sys
import json
import time
import hashlib
import argparse
import pymysql
from pymysql.cursors import DictCursor


# ===================== 以下函数复制自 backend.py，保持完全一致 =====================
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
    """用库里存储的题干/题型/选项重建与线上一致的 question 结构。"""
    opts = [o.strip() for o in re.split(r"\s*\|\s*", row.get("options_text") or "") if o.strip()]
    payload = {
        "question": row.get("question_text") or "",
        "type": row.get("question_type") or "",
        "options": opts,
    }
    return json.dumps(payload, ensure_ascii=False)


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

    # 旧 hash 重复预检
    cur.execute("SELECT COUNT(*) AS c FROM (SELECT question_hash FROM question_bank GROUP BY question_hash HAVING COUNT(*)>1) t")
    old_dup = cur.fetchone()["c"]
    print(f"[预检] 旧 question_hash 重复组数: {old_dup}")

    cur.execute("SELECT COUNT(*) AS c FROM question_bank")
    total = cur.fetchone()["c"]
    print(f"[预检] 总行数: {total}")

    if not args.dry_run:
        # 确保列存在（仅正式模式修改结构）
        try:
            cur.execute("ALTER TABLE question_bank ADD COLUMN matching_key VARCHAR(64) NOT NULL DEFAULT '' COMMENT '匹配键'")
            conn.commit()
            print("[info] 已添加 matching_key 列")
        except Exception as e:
            print(f"[info] matching_key 列已存在或添加失败(忽略): {e}")
        try:
            cur.execute("ALTER TABLE question_bank ADD INDEX idx_matching_key (matching_key)")
            conn.commit()
        except Exception as e:
            print(f"[info] idx_matching_key 已存在(忽略): {e}")
        ts = time.strftime("%Y%m%d_%H%M%S")
        backup = f"question_bank_backup_{ts}"
        print(f"[备份] 创建备份表 {backup} ...")
        cur.execute(f"DROP TABLE IF EXISTS `{backup}`")
        cur.execute(f"CREATE TABLE `{backup}` LIKE question_bank")
        cur.execute(f"INSERT INTO `{backup}` SELECT * FROM question_bank")
        conn.commit()
        print("[备份] 完成")

    batch = 500
    offset = 0
    updated = 0
    conflicts = []
    while True:
        cur.execute("SELECT id, question_text, question_type, options_text, answer FROM question_bank LIMIT %s OFFSET %s", (batch, offset))
        rows = cur.fetchall()
        if not rows:
            break
        for r in rows:
            payload = build_payload(r)
            mkey = make_matching_key(payload)
            qhash = make_question_hash(payload, r.get("answer"))
            if args.dry_run:
                updated += 1
                continue
            try:
                cur.execute("UPDATE question_bank SET question_hash=%s, matching_key=%s WHERE id=%s", (qhash, mkey, r["id"]))
                updated += 1
            except Exception as e:
                conflicts.append((r["id"], str(e)))
        if not args.dry_run:
            conn.commit()
        offset += batch
        print(f"[进度] 已处理 {min(offset, total)}/{total}")

    print(f"[完成] 处理行数: {updated}")
    if conflicts:
        print(f"[警告] 更新冲突 {len(conflicts)} 行: {conflicts[:10]}")

    if not args.dry_run:
        cur.execute("SELECT COUNT(*) AS c FROM (SELECT matching_key FROM question_bank GROUP BY matching_key HAVING COUNT(*)>1) t")
        dup_groups = cur.fetchone()["c"]
        cur.execute("SELECT COUNT(DISTINCT question_hash) AS d, COUNT(*) AS t FROM question_bank")
        r2 = cur.fetchone()
        print(f"[校验] 同 matching_key 多答案版本组数: {dup_groups}")
        print(f"[校验] question_hash 去重后 {r2['d']} / 总行数 {r2['t']}")

    cur.close()
    conn.close()


if __name__ == "__main__":
    main()
