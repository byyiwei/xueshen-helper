#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""答题链路离线探针：只调 backend.py 原文里的纯函数，判定 多选/图片/简答 三类题的真实返回。

    "C:/.../Python312/python.exe" scripts/_probe_answer_types.py

不落库、不发网络（图片一律用 data: URL）。
"""
import json
import os
import sys
import types

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "src"))

# database.py 末尾有模块级 db = Database()，__init__ 会立刻建表 → 必须先吞掉 pymysql
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


def q(text, qtype, options=None, images=None):
    payload = {"question": text, "type": qtype}
    if options is not None:
        payload["options"] = options
    if images is not None:
        payload["images"] = images
    return json.dumps(payload, ensure_ascii=False)


RED = "\033[31mRED\033[0m"
GREEN = "\033[32mGREEN\033[0m"
findings = []


def check(label, got, want, kind=""):
    ok = got == want
    if not ok:
        findings.append((label, got, want, kind))
    print(f"  [{'RED   ' if not ok else 'GREEN '}] {label}\n          得到={got!r}\n          期望={want!r}")


def section(title):
    print("\n" + "=" * 78 + f"\n{title}\n" + "=" * 78)


# ---------------------------------------------------------------- 1. 多选题
section("1) 多选题：答案是否被完整保留（type=1）")
MULTI4 = ["甲", "乙", "丙", "丁"]
for ai_reply in ["A,B,D", "ABD", "A、B、D", "正确答案是 B、C", "选项 A 和 C 正确"]:
    got = backend.normalize_ai_answer(q("以下哪些是正确的？", "1", MULTI4), ai_reply)
    print(f"  AI={ai_reply!r:24} → {got!r}")

print("\n  -- 单选被当成多选展开？（type=0，模型多给了字母）")
check("单选题 AI 回 'ABD' 应只取首项或原样，不该展开成 3 项",
      backend.normalize_ai_answer(q("以下正确的是？", "0", MULTI4), "ABD"),
      "ABD", "multi-expand-on-single")

print("\n  -- 英文选项文本被误当字母序列")
opts_en = ["apple", "banana", "cat", "dog", "egg"]
got = backend.normalize_ai_answer(q("哪个是猫？", "0", opts_en), "cat")
check("单选题答案 'cat' 应原样返回 'cat'", got, "cat", "english-word-as-letters")
got2 = backend.normalize_ai_answer(q("哪个是猫？", "0", opts_en), "bad")
check("单选题答案 'bad' 应原样返回 'bad'", got2, "bad", "english-word-as-letters")

print("\n  -- 截断的多选答案能不能入库/复用")
for a in ["A", "甲", "A,B", '["甲","乙"]', "ABCD"]:
    print(f"  answer={a!r:14} _is_truncated_multi={backend._is_truncated_multi_answer(q('多选？', '1', MULTI4), a)!r}")

print("\n  -- 选项 ≥5 时 E 参与的答案指纹")
five = ["a1", "b1", "c1", "d1", "e1"]
h_ae = backend.normalize_answer_for_hash("AE")
h_ea = backend.normalize_answer_for_hash("EA")
check("'AE' 与 'EA' 是同一答案集合，指纹应相同", (h_ae, h_ea), ("A,E", "A,E"), "hash-E")
h_ab = backend.normalize_answer_for_hash("AB")
print(f"  对照：'AB'/'BA' → {backend.normalize_answer_for_hash('BA')!r} / {h_ab!r}")

# ---------------------------------------------------------------- 2. 判断题
section("2) 判断题：关键词子串顺序（type=3）")
JUDGE = ["正确", "错误"]
for reply in ["错误", "正确", "不对", "不正确", "这种说法不对", "绝对", "错，正确的说法是…"]:
    got = backend.normalize_ai_answer(q("该说法对吗？", "3", JUDGE), reply)
    print(f"  AI={reply!r:18} → {got!r}")
check("AI 回「不对」应判为 错误",
      backend.normalize_ai_answer(q("该说法对吗？", "3", JUDGE), "不对"), "错误", "judge-substring")
check("AI 回「这种说法不对」应判为 错误",
      backend.normalize_ai_answer(q("该说法对吗？", "3", JUDGE), "这种说法不对"), "错误", "judge-substring")

# ---------------------------------------------------------------- 3. 图片题
section("3) 图片题：能否走到多模态、图从哪来、答案怎么落回字母")
PNG = "data:image/png;base64,iVBORw0KGgo="
img_q = q("看图作答", "1", [f'<img src="https://ananas.chaoxing.com/image/aaa111.png">',
                            f'<img src="https://ananas.chaoxing.com/image/bbb222.png">'],
          images=[PNG, PNG])
print("  is_multimodal =", backend.is_multimodal_question(img_q))
print("  is_pure_image =", backend.is_pure_image_question(img_q))
msgs = backend.build_ai_messages(img_q)
content = msgs[1]["content"]
print("  消息类型 =", "多模态数组" if isinstance(content, list) else "纯文本")
if isinstance(content, list):
    for part in content:
        if part.get("type") == "text":
            print("  text 部分 =", repr(part["text"]))
        else:
            print("  image 部分 = dataURL 前缀", part["image_url"]["url"][:30], "是否标明对应选项:",
                  any(f"选项{chr(65+i)}" in str(p.get("text", "")) or f"{chr(65+i)}=" in str(p.get("text", ""))
                      for p in content if p.get("type") == "text" for i in [0]))
print("  模型回 'A,B' →", backend.normalize_ai_answer(img_q, "A,B"))
print("  模型回图片HTML →", backend.normalize_ai_answer(
    img_q, '<img src="https://ananas.chaoxing.com/image/bbb222.png">'))

print("\n  -- 相对路径图片（脚本 title 里残留 /xxx.png 时后端的行为）")
rel_q = q('图片题 <img src="/image/only-relative.png">', "0", ["甲", "乙"])
print("  is_multimodal =", backend.is_multimodal_question(rel_q), "（会触发下载相对路径）")
print("  _collect_html_image_urls =", backend._collect_html_image_urls(backend.parse_question_payload(rel_q)))

print("\n  -- 纯 base64 上传时，题干/选项里的 <img> URL 是否被丢弃")
mixed = q('题干带图 <img src="https://a.com/opt999.png">', "0", ["甲", "乙"], images=[PNG])
mb = backend.build_ai_messages(mixed)
c = mb[1]["content"]
n_img = len([p for p in c if isinstance(p, dict) and p.get("type") == "image_url"]) if isinstance(c, list) else 0
print(f"  上传了 1 张 base64 + 题干另有 1 个 URL 图 → 实际发给模型 {n_img} 张")
check("题干 URL 图应一并发给模型（共 2 张）", n_img, 2, "b64-drops-url-images")

print("\n  -- 图片答案映射不到选项时")
no_match = q("看图", "0", ['<img src="https://a.com/x1.png">', '<img src="https://a.com/x2.png">'])
print("  模型回不可匹配的图 →", repr(backend.normalize_ai_answer(
    no_match, '<img src="https://a.com/other999.png">'))[:120])

# ---------------------------------------------------------------- 4. 简答/填空
section("4) 简答题 / 填空题（type=4 / type=2，无选项）")
sa = q("简述马克思主义中国化的含义", "4")
print("  normalize 长文本 →", repr(backend.normalize_ai_answer(
    sa, "马克思主义中国化就是把马克思主义基本原理同中国具体实际相结合。"))[:160])
print("  normalize 英文单词答案 →", repr(backend.normalize_ai_answer(q("HTTP 的中文全称?", "4"), "Hypertext Transfer Protocol"))[:160])
print("  is_multimodal(简答) =", backend.is_multimodal_question(sa))
fill = q("Python 的缩写是 ____", "2")
print("  填空题答案 'Python' →", repr(backend.normalize_ai_answer(fill, "Python")))
print("  系统提示对简答题的要求：见 build_ai_messages 的 '不超过50字'")
long_ans = "答案" * 300
print(f"  超长简答({len(long_ans)}字) 是否判为垃圾答案(不可入库) →", backend._is_garbage_bank_answer(long_ans, fill))

section("结论")
print(f"  不达标项 {len(findings)} 条：")
for label, got, want, kind in findings:
    print(f"   · [{kind}] {label}\n       got={got!r}\n       want={want!r}")
sys.exit(1 if findings else 0)
