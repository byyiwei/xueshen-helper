#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""填空 / 简答 / 名词解释 三类题：后端到底把答案归一成什么形状（字符串还是数组、多空怎么分）。
脚本端只认数组下标（xueshen-gf.js:8133 answer[index]），所以形状错了就填不进或只填第一空。

    "C:/Program Files/WindowsApps/.../Python312/python.exe" scripts/_probe_fill_blank_shapes.py

不落库、不发网络。
"""
import json
import os
import sys
import types

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "src"))

fake = types.ModuleType("pymysql")
fake.err = types.ModuleType("pymysql.err")


class _FakeCur:
    lastrowid = 0
    rowcount = 0

    def execute(self, *a, **k):
        return self

    def executemany(self, *a, **k):
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
sys.modules["pymysql"] = fake
sys.modules["pymysql.cursors"] = fake.cursors

import backend  # noqa: E402

CASES = [
    # (题型码, 题型名, 题干, 选项, 模型原话, 说明)
    ("2", "填空题 2 空", "中国的首都是___，最大城市是___。", [], "北京，上海", "中文逗号分隔的两个空"),
    ("2", "填空题 2 空", "中国的首都是___，最大城市是___。", [], "北京,上海", "英文逗号分隔的两个空"),
    ("2", "填空题 2 空", "中国的首都是___，最大城市是___。", [], ["北京", "上海"], "模型已经返回数组"),
    ("2", "填空题 1 空带句号", "水的化学式是___。", [], "H2O。", "带中文句号"),
    ("2", "填空题 单词答案", "翻译成英文：苹果 ___", [], "apple", "单个英文词"),
    ("2", "填空题 英文短语", "英译汉：HTTP ___", [], "超文本传输协议", "中文答案，题干含英文"),
    ("4", "简答题", "简述 SWOT 分析法的四个要素。", [], "S 优势、W 劣势、O 机会、T 威胁，四要素缺一不可", "长答案"),
    ("4", "简答题(英文缩写)", "HTTP 的全称是什么？", [], "HyperText Transfer Protocol", "多个英文单词"),
    ("5", "名词解释", "边际效用。", [], "消费者新增一单位商品所获得的额外满足感", "长答案"),
    ("0", "单选题 5 选项", "以下正确的是？", ["甲", "乙", "丙", "丁", "戊"], "A,E", "选项超过 4 个"),
    ("1", "多选题 5 选项", "以下正确的是？", ["甲", "乙", "丙", "丁", "戊"], "A,E", "选项超过 4 个"),
    ("1", "多选题 5 选项", "以下正确的是？", ["甲", "乙", "丙", "丁", "戊"], "E,A", "同样的答案换个顺序"),
]


def payload(text, qtype, options):
    return json.dumps({"question": text, "type": qtype, "options": options}, ensure_ascii=False)


print("=" * 78)
print("后端 normalize_ai_answer 的返回形状（脚本端按数组下标填每空）")
print("=" * 78)
rows = []
for code, label, stem, opts, ai_reply, note in CASES:
    got = backend.normalize_ai_answer(payload(stem, code, opts), ai_reply)
    shape = type(got).__name__
    print(f"\n[{label}] {note}")
    print(f"  AI原话 = {ai_reply!r}")
    print(f"  归一后 = {got!r}   (类型 {shape})")
    rows.append({"type": code, "label": label, "note": note, "ai_reply": ai_reply,
                 "backend_answer": got, "shape": shape, "options": opts})

out = os.path.join(ROOT, "scripts", "_probe_blank_cases.json")
with open(out, "w", encoding="utf-8") as f:
    json.dump(rows, f, ensure_ascii=False, indent=1)
print(f"\n写出 {out}（{len(rows)} 例）→ 再跑 node scripts/_probe_blank_fill.js")
