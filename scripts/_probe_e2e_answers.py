#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""端到端用例生成：调 backend.normalize_ai_answer 的真实输出，交给 _probe_e2e_fill.js
用脚本原文的 fillQuestion 跑一遍，看实际勾中哪几个选项。

    "…/Python312/python.exe" scripts/_probe_e2e_answers.py
    node scripts/_probe_e2e_fill.js
"""
import json
import os
import sys
import types

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "src"))

# database.py 末尾有模块级 db = Database()，__init__ 会立刻建表 → 先吞掉 pymysql
fake = types.ModuleType("pymysql")
fake.err = types.ModuleType("pymysql.err")


class _Cur:
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


class _Conn:
    def cursor(self):
        return _Cur()

    def commit(self):
        pass

    def close(self):
        pass

    def ping(self, reconnect=True):
        pass


fake.connect = lambda *a, **k: _Conn()
fake.cursors = types.ModuleType("pymysql.cursors")
fake.cursors.DictCursor = object
fake.err.Error = Exception
sys.modules["pymysql"] = fake
sys.modules["pymysql.cursors"] = fake.cursors

import backend  # noqa: E402

MULTI = ["甲", "乙", "丙", "丁"]
EN = ["apple", "banana", "cat", "dog", "egg"]
IMG = ['<img src="https://c.com/a/aaa111.png"/>', '<img src="https://c.com/a/bbb222.png"/>']


def payload(qtype, options, text="题目正文？"):
    return json.dumps({"question": text, "type": qtype, "options": options}, ensure_ascii=False)


# (标签, 超星题型码, 选项, 模型原话, 页面上「应该」勾中的项)
TABLE = [
    ("多选·模型回 A,B,D", "1", MULTI, "A,B,D", "甲+乙+丁"),
    ("多选·模型回 ABD", "1", MULTI, "ABD", "甲+乙+丁"),
    ("多选·模型回 A、B、D", "1", MULTI, "A、B、D", "甲+乙+丁"),
    ("多选·模型回 正确答案是 B、C", "1", MULTI, "正确答案是 B、C", "乙+丙"),
    ("多选·模型回 AC", "1", MULTI, "AC", "甲+丙"),
    ("多选·模型回选项正文 甲、丙", "1", MULTI, "甲、丙", "甲+丙"),
    ("多选·模型回 'A,C 正确'", "1", MULTI, "A,C 正确", "甲+丙"),
    ("多选·模型回 '选项 A 和 C 正确'", "1", MULTI, "选项 A 和 C 正确", "甲+丙"),
    ("多选·模型回 'A. 甲 C. 丙'", "1", MULTI, "A. 甲 C. 丙", "甲+丙"),
    ("多选·模型回 '应选 A 与 C'（中文连接词）", "1", MULTI, "应选 A 与 C", "甲+丙"),
    ("单选·模型只回 A", "0", MULTI, "A", "甲"),
    ("单选·模型多给 ABD", "0", MULTI, "ABD", "甲"),
    ("单选·英文选项回 cat", "0", EN, "cat", "cat"),
    ("单选·英文选项回 bad", "0", EN, "bad", "一个都没点"),
    ("图片多选·模型回 A,B", "1", IMG, "A,B", IMG[0] + "+" + IMG[1]),
    ("图片单选·模型回图片HTML", "0", IMG,
     '<img src="https://c.com/a/bbb222.png"/>', IMG[1]),
]

cases = []
for label, qtype, options, reply, expect in TABLE:
    ans = backend.normalize_ai_answer(payload(qtype, options), reply)
    cases.append({
        "label": label, "type": qtype, "options": options,
        "ai_reply": reply, "backend_answer": ans, "expect_fill": expect,
    })
    print(f"{label}\n    模型原话={reply!r}\n    后端返回={ans!r}\n    应勾中={expect}")

out = os.path.join(ROOT, "scripts", "_probe_cases.json")
with open(out, "w", encoding="utf-8") as f:
    json.dump(cases, f, ensure_ascii=False, indent=1)
print(f"\n已写出 {out}")
