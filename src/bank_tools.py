# -*- coding: utf-8 -*-
"""题库工具：文档解析 / 智能切题 / 题库文件生成。

只用标准库。生产是 2C/2G 且禁止编译，本机与线上都没装 openpyxl / python-docx / pypdf，
所以 xlsx / docx 直接按「zip + xml」解析，csv 用 csv 模块，PDF 明确不支持（提示用户转
docx / txt，别偷偷返回半截文本让用户以为转成功了）。

对外主要入口：
    parse_document(name, data)      -> {"questions": [...], "raw_text": str, "source": str}
    split_text_questions(text)      -> [{"question","type","options","answer"}]
    parse_rows_to_questions(rows)   -> 同上（表格类）
    questions_to_csv(items)         -> str（Excel 可直接打开的 CSV）
    question_payload(item)          -> 题库匹配接口认的 JSON 字符串
"""

import csv
import io
import json
import re
import zipfile
from xml.etree import ElementTree as ET

MAX_UPLOAD_BYTES = 8 * 1024 * 1024
MAX_QUESTIONS = 300
MIN_QUESTION_LEN = 4

SUPPORTED_EXTS = (".txt", ".csv", ".xlsx", ".docx", ".md", ".json")

DOCX_NS = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
SHEET_NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"


class BankToolError(Exception):
    """可以直接回给用户看的解析错误。"""


# ---------------------------------------------------------------- 文本解码

def decode_text(data):
    if isinstance(data, str):
        return data
    if not data:
        return ""
    for enc in ("utf-8-sig", "utf-8", "gb18030", "big5"):
        try:
            return data.decode(enc)
        except Exception:
            continue
    return data.decode("utf-8", "ignore")


# ---------------------------------------------------------------- docx / xlsx

def extract_docx_text(data):
    """word/document.xml -> 纯文本。段落一行；表格不进正文（用 extract_docx_tables 单独取）。"""
    text, _tables = _read_docx(data)
    return text


def extract_docx_tables(data):
    _text, tables = _read_docx(data)
    return tables


def _read_docx(data):
    try:
        zf = zipfile.ZipFile(io.BytesIO(data))
    except Exception:
        raise BankToolError("这个文件不是有效的 docx（可能只是把 .doc 改了后缀），请另存为 .docx 再上传")
    try:
        xml = zf.read("word/document.xml")
    except KeyError:
        raise BankToolError("docx 里找不到正文（word/document.xml），文件可能已损坏")
    try:
        root = ET.fromstring(xml)
    except Exception:
        raise BankToolError("docx 正文解析失败，请另存为 .docx 后重试")
    body = root.find(DOCX_NS + "body")
    if body is None:
        return "", []
    lines, tables = [], []
    for node in list(body):
        tag = node.tag
        if tag == DOCX_NS + "p":
            lines.append(_docx_paragraph_text(node))
        elif tag == DOCX_NS + "tbl":
            rows = []
            for row in node.iter(DOCX_NS + "tr"):
                cells = []
                for cell in row.findall(DOCX_NS + "tc"):
                    cell_text = " ".join(
                        _docx_paragraph_text(p).strip()
                        for p in cell.findall(DOCX_NS + "p")
                    ).strip()
                    cells.append(cell_text)
                if any(cells):
                    rows.append(cells)
            if rows:
                tables.append(rows)
        elif tag == DOCX_NS + "sdt":
            # 内容控件：内容藏在 sdtContent 里
            content = node.find(DOCX_NS + "sdtContent")
            if content is not None:
                for sub in list(content):
                    if sub.tag == DOCX_NS + "p":
                        lines.append(_docx_paragraph_text(sub))
                    elif sub.tag == DOCX_NS + "tbl":
                        rows = []
                        for row in sub.iter(DOCX_NS + "tr"):
                            cells = [
                                " ".join(_docx_paragraph_text(p).strip() for p in cell.findall(DOCX_NS + "p")).strip()
                                for cell in row.findall(DOCX_NS + "tc")
                            ]
                            if any(cells):
                                rows.append(cells)
                        if rows:
                            tables.append(rows)
    return "\n".join(ln for ln in lines if ln is not None).strip(), tables


def _docx_paragraph_text(p):
    parts = []
    for node in p.iter():
        if node.tag == DOCX_NS + "t" and node.text:
            parts.append(node.text)
        elif node.tag == DOCX_NS + "tab":
            parts.append("\t")
        elif node.tag in (DOCX_NS + "br", DOCX_NS + "cr"):
            parts.append("\n")
    return "".join(parts)


_CELL_REF_RE = re.compile(r"^([A-Z]+)(\d+)$")


def _col_index(ref):
    m = _CELL_REF_RE.match(str(ref or "").upper())
    if not m:
        return None
    idx = 0
    for ch in m.group(1):
        idx = idx * 26 + (ord(ch) - 64)
    return idx - 1


def extract_xlsx_rows(data, max_rows=4000):
    """取工作簿第一个工作表，返回 [[cell, ...], ...]。合并单元格只保留左上角值。"""
    try:
        zf = zipfile.ZipFile(io.BytesIO(data))
    except Exception:
        raise BankToolError("这个文件不是有效的 xlsx，请用 Excel「另存为 .xlsx」后重试")
    names = zf.namelist()
    shared = []
    if "xl/sharedStrings.xml" in names:
        try:
            sroot = ET.fromstring(zf.read("xl/sharedStrings.xml"))
            for si in sroot.findall(SHEET_NS + "si"):
                texts = [t.text or "" for t in si.iter(SHEET_NS + "t")]
                shared.append("".join(texts))
        except Exception:
            shared = []
    sheet_files = sorted(n for n in names if n.startswith("xl/worksheets/sheet") and n.endswith(".xml"))
    if not sheet_files:
        raise BankToolError("xlsx 里没有工作表")
    try:
        root = ET.fromstring(zf.read(sheet_files[0]))
    except Exception:
        raise BankToolError("xlsx 工作表解析失败，请另存为 .xlsx 后重试")
    rows = []
    data_node = root.find(SHEET_NS + "sheetData")
    if data_node is None:
        return rows
    for row_node in data_node.findall(SHEET_NS + "row"):
        values = []
        for cell in row_node.findall(SHEET_NS + "c"):
            ctype = cell.get("t") or ""
            raw = ""
            if ctype == "inlineStr":
                inline = cell.find(SHEET_NS + "is")
                if inline is not None:
                    raw = "".join(t.text or "" for t in inline.iter(SHEET_NS + "t"))
            else:
                v = cell.find(SHEET_NS + "v")
                if v is not None and v.text is not None:
                    raw = v.text
                    if ctype == "s":
                        try:
                            raw = shared[int(raw)]
                        except Exception:
                            raw = ""
            idx = _col_index(cell.get("r"))
            if idx is None:
                idx = len(values)
            while len(values) < idx:
                values.append("")
            values.append(str(raw).replace("\r", " ").strip())
        if any(values):
            rows.append(values)
        if len(rows) >= max_rows:
            break
    return rows


def extract_csv_rows(data):
    text = decode_text(data)
    if not text.strip():
        return []
    sample = text[:4000]
    delimiter = ","
    for cand in ("\t", ",", ";", "|"):
        if sample.count(cand) > sample.count(delimiter):
            delimiter = cand
    try:
        return [[str(c).strip() for c in row] for row in csv.reader(io.StringIO(text), delimiter=delimiter) if any(str(c).strip() for c in row)]
    except Exception:
        raise BankToolError("CSV 解析失败，请另存为 UTF-8 编码的 CSV 再上传")


# ---------------------------------------------------------------- 切题规则

_OPTION_RE = re.compile(r"^[\s　]*[\(（]?\s*([A-Ha-h])\s*[\.、\)）:：]\s*(.+)$")
_QNUM_RE = re.compile(
    r"^[\s　]*(?:[\(（]\s*(\d{1,3})\s*[\)）]|(\d{1,3})\s*[\.、\)）]|第\s*(\d{1,3})\s*[题小])\s*"
)
_ANSWER_RE = re.compile(r"^[\s　]*(?:参考答案|正确答案|标准答案|答案)\s*[:：]?\s*(.*)$")
_INLINE_ANSWER_RE = re.compile(r"[\(（]\s*(?:参考答案|答案)\s*[:：]\s*([^)）]+)[\)）]")
_TYPE_HINT_RE = re.compile(r"[\[【(（]\s*(单选题?|多选题?|判断题?|填空题?|简答题?|名词解释|论述题?|计算题?|阅读理解)\s*[\]】)）]")
_JUDGE_WORDS = {"对", "错", "正确", "错误", "是", "否", "√", "×", "T", "F", "true", "false", "×"}
_OPTION_SPLIT_RE = re.compile(r"(?:^|\s)(?=[A-H][\.、\)）])")
_TYPE_PREFIX_RE = re.compile(r"^[\s　]*(?:判断|单选|多选|填空|简答|名词解释|论述|计算)\s*[:：]\s*")


def _split_option_cell(raw):
    """一个单元格里塞了多个选项（"A.1|B.2|C.3" / "1|2|3"）时拆开。"""
    text = str(raw or "").strip()
    if not text:
        return []
    parts = [p for p in re.split(r"[|｜;；\n]+", text) if p.strip()]
    if len(parts) <= 1:
        inline = _split_inline_options(text)
        parts = inline if inline else [text]
    return [
        re.sub(r"^[\(（]?\s*[A-Ha-h]\s*[\.、\)）:：]\s*", "", p).strip()
        for p in parts if p.strip()
    ]


def _clean(text):
    return re.sub(r"[\s　]+", " ", str(text or "")).strip()


def _infer_type(stem, options, answer):
    hint = _TYPE_HINT_RE.search(stem or "")
    if hint:
        name = hint.group(1)
        for full in ("单选题", "多选题", "判断题", "填空题", "简答题", "名词解释", "论述题", "计算题", "阅读理解"):
            if name.startswith(full[:2]):
                return full
    if options:
        letters = re.findall(r"[A-Ha-h]", str(answer or ""))
        return "多选题" if len(set(letters)) > 1 else "单选题"
    ans = _clean(answer)
    if ans and ans.rstrip("。.") in _JUDGE_WORDS:
        return "判断题"
    if re.search(r"_{2,}|（\s*）|\(\s*\)", stem or ""):
        return "填空题"
    return "简答题"


def _make_item(stem, options, answer, raw=""):
    stem = _clean(stem)
    # 去掉行首题号与题型标签，只留纯题面（题号留在展示层，不进指纹）
    stem = _QNUM_RE.sub("", stem, count=1)
    prefix_type = ""
    prefix_match = _TYPE_PREFIX_RE.match(stem or "")
    if prefix_match:
        word = prefix_match.group(0).strip(":： ").strip()
        prefix_type = {"判断": "判断题", "单选": "单选题", "多选": "多选题", "填空": "填空题", "简答": "简答题", "论述": "论述题", "计算": "计算题", "名词解释": "名词解释"}.get(word, "")
        stem = _TYPE_PREFIX_RE.sub("", stem, count=1)
    stem = _TYPE_HINT_RE.sub("", stem).strip()
    options = [_clean(o) for o in (options or []) if _clean(o)]
    answer = str(answer or "").strip()
    if len(stem) < MIN_QUESTION_LEN and not options:
        return None
    qtype = _infer_type(("【%s】%s" % (prefix_type, stem)) if prefix_type else stem, options, answer)
    return {
        "question": stem,
        "type": qtype,
        "options": options,
        "answer": answer,
        "raw": _clean(raw) if raw else "",
    }


def _split_inline_options(line):
    """把 "A.北京 B.上海 C.广州" 这种一行多选项拆开。"""
    parts = [p.strip() for p in _OPTION_SPLIT_RE.split(line) if p.strip()]
    if len(parts) >= 2 and all(_OPTION_RE.match(p) for p in parts):
        return [re.sub(r"^[\(（]?\s*[A-Ha-h]\s*[\.、\)）:：]\s*", "", p) for p in parts]
    return []


def split_text_questions(text):
    """把纯文本切成题目列表。支持「1. 题干 / A. 选项 / 答案：X」这类块状格式。"""
    text = decode_text(text).replace("\r\n", "\n").replace("\r", "\n")
    if not text.strip():
        return []
    lines = [ln.strip("\n") for ln in text.split("\n")]
    blocks = []
    current = []
    saw_numbering = False
    for raw_line in lines:
        line = raw_line.strip()
        if not line:
            continue
        is_start = bool(_QNUM_RE.match(line))
        if is_start:
            saw_numbering = True
            if current:
                blocks.append(current)
            current = [line]
            continue
        if current:
            current.append(line)
        else:
            current = [line]
    if current:
        blocks.append(current)

    if not saw_numbering:
        # 没有题号：按空行分段再切，比整篇当一道题有用
        blocks = [[ln.strip()] for ln in text.split("\n\n") if ln.strip()]

    items = []
    for block in blocks:
        item = _parse_block(block)
        if item:
            items.append(item)
        if len(items) >= MAX_QUESTIONS:
            break
    return items


def _parse_block(block):
    if not block:
        return None
    stem_parts = []
    options = []
    answer = ""
    for idx, line in enumerate(block):
        ans_match = _ANSWER_RE.match(line)
        if ans_match and (options or stem_parts or idx > 0):
            answer = ans_match.group(1).strip()
            continue
        inline = _split_inline_options(line)
        if inline:
            options.extend(inline)
            continue
        opt_match = _OPTION_RE.match(line)
        if opt_match and (stem_parts or options):
            options.append(opt_match.group(2).strip())
            continue
        if options and not opt_match:
            # 选项后的续行：并入最后一个选项
            options[-1] = (options[-1] + " " + line).strip()
            continue
        stem_parts.append(line)
    if not stem_parts and not options:
        return None
    stem = " ".join(stem_parts)
    inline_ans = _INLINE_ANSWER_RE.search(stem)
    if inline_ans and not answer:
        answer = inline_ans.group(1).strip()
        stem = _INLINE_ANSWER_RE.sub("", stem).strip()
    if not answer:
        # 末行只有答案没有选项时（题干 + 答案两行）答句常以「答案」开头，上面已处理；
        # 这里兜底「题干……正确答案是X」
        m = re.search(r"(?:正确答案|答案是|答案为)\s*[:：]?\s*([A-Ha-h]{1,4}|对|错|正确|错误)\s*$", stem)
        if m:
            answer = m.group(1)
            stem = stem[:m.start()].strip()
    return _make_item(stem, options, answer, raw="\n".join(block))


# ---------------------------------------------------------------- 表格类题库

_HEADER_ALIASES = {
    "question": ("题目", "题干", "试题", "问题", "question", "题目内容", "题面"),
    "options": ("选项", "options", "option", "备选答案"),
    "answer": ("答案", "正确答案", "参考答案", "answer", "ans"),
    "type": ("题型", "类型", "type", "题类"),
}
_OPTION_HEADERS = {
    "a": ("选项a", "a选项", "选项1", "a"),
    "b": ("选项b", "b选项", "选项2", "b"),
    "c": ("选项c", "c选项", "选项3", "c"),
    "d": ("选项d", "d选项", "选项4", "d"),
    "e": ("选项e", "e选项", "选项5", "e"),
    "f": ("选项f", "f选项", "选项6", "f"),
}


def _norm_header(cell):
    return re.sub(r"[\s　]+", "", str(cell or "")).strip().lower()


def _detect_header(row):
    """返回 {字段: 列号}；认不出题目列就返回空 dict。"""
    mapping = {}
    for idx, cell in enumerate(row):
        key = _norm_header(cell)
        if not key:
            continue
        for field, aliases in _HEADER_ALIASES.items():
            if field in mapping:
                continue
            if any(key == a.lower() or key.startswith(a.lower()) for a in aliases):
                mapping[field] = idx
                break
        if "options" not in mapping:
            for letter, aliases in _OPTION_HEADERS.items():
                if key in aliases:
                    mapping.setdefault("option_" + letter, idx)
                    break
    return mapping if "question" in mapping else {}


def _cell(row, idx):
    if idx is None or idx >= len(row):
        return ""
    return _clean(row[idx])


def parse_rows_to_questions(rows):
    if not rows:
        return []
    header = _detect_header(rows[0])
    items = []
    if header:
        body = rows[1:]
        for row in body:
            stem = _cell(row, header.get("question"))
            if len(stem) < MIN_QUESTION_LEN:
                continue
            options = []
            if "options" in header:
                options.extend(_split_option_cell(_cell(row, header["options"])))
            for letter in ("a", "b", "c", "d", "e", "f"):
                val = _cell(row, header.get("option_" + letter))
                if val:
                    options.append(re.sub(r"^[\(（]?\s*[A-Ha-h]\s*[\.、\)）:：]\s*", "", val).strip())
            answer = _cell(row, header.get("answer"))
            type_hint = _cell(row, header.get("type"))
            item = _make_item(stem, options, answer, raw=" | ".join(row))
            if item:
                if type_hint:
                    hinted = _infer_type("【%s】%s" % (type_hint, stem), options, answer)
                    item["type"] = hinted
                items.append(item)
            if len(items) >= MAX_QUESTIONS:
                break
        return items

    # 没有表头：按列数猜
    wide = [r for r in rows if any(str(c).strip() for c in r)]
    if not wide:
        return []
    max_cols = max(len(r) for r in wide)
    if max_cols == 1:
        return split_text_questions("\n".join(_cell(r, 0) for r in wide))
    for row in wide:
        stem = _cell(row, 0)
        if len(stem) < MIN_QUESTION_LEN:
            continue
        if max_cols == 2:
            answer = _cell(row, 1)
            item = _make_item(stem, [], answer, raw=" | ".join(row))
        else:
            options = []
            for i in range(1, max_cols - 1):
                options.extend(_split_option_cell(_cell(row, i)))
            answer = _cell(row, max_cols - 1)
            item = _make_item(stem, options, answer, raw=" | ".join(row))
        if item:
            items.append(item)
        if len(items) >= MAX_QUESTIONS:
            break
    return items


# ---------------------------------------------------------------- 统一入口

def parse_document(name, data):
    """name 带扩展名，data 是 bytes。返回 {questions, raw_text, source, truncated}。"""
    if not data:
        raise BankToolError("文件是空的")
    if len(data) > MAX_UPLOAD_BYTES:
        raise BankToolError("文件超过 8MB，请拆分后再上传")
    lower = str(name or "").lower()
    ext = ""
    for cand in SUPPORTED_EXTS:
        if lower.endswith(cand):
            ext = cand
            break
    if not ext:
        if lower.endswith(".doc"):
            raise BankToolError("暂不支持老版 .doc，请在 Word 里另存为 .docx")
        if lower.endswith(".pdf"):
            raise BankToolError("暂不支持 PDF：请把 PDF 另存为 .docx 或复制成 .txt 再上传（PDF 中文常是图片/缺字体映射，硬抽会得到乱码）")
        raise BankToolError("支持 .txt / .csv / .xlsx / .docx / .md")

    if ext == ".docx":
        text, tables = _read_docx(data)
        items = []
        for rows in tables:
            if len(rows) >= 1 and max(len(r) for r in rows) >= 2:
                items.extend(parse_rows_to_questions(rows))
        items.extend(split_text_questions(text))
        source = "docx"
    elif ext == ".xlsx":
        rows = extract_xlsx_rows(data)
        items = parse_rows_to_questions(rows)
        text = "\n".join("\t".join(r) for r in rows[:400])
        source = "xlsx"
    elif ext == ".csv":
        rows = extract_csv_rows(data)
        items = parse_rows_to_questions(rows)
        text = "\n".join("\t".join(r) for r in rows[:400])
        source = "csv"
    elif ext == ".json":
        text = decode_text(data)
        try:
            payload = json.loads(text)
        except Exception:
            raise BankToolError("JSON 格式不正确")
        items = parse_json_questions(payload)
        source = "json"
    else:
        text = decode_text(data)
        items = []
        source = "text"

    if not items and source == "text":
        items = split_text_questions(text)

    items = [i for i in items if i and len(i.get("question") or "") >= MIN_QUESTION_LEN][:MAX_QUESTIONS]
    return {
        "questions": items,
        "raw_text": (text or "")[:4000],
        "source": source,
        "truncated": len(items) >= MAX_QUESTIONS,
    }


def parse_json_questions(payload):
    if isinstance(payload, dict):
        for key in ("questions", "data", "items", "list"):
            if isinstance(payload.get(key), list):
                payload = payload[key]
                break
    if not isinstance(payload, list):
        return []
    items = []
    for raw in payload:
        if isinstance(raw, str):
            found = split_text_questions(raw)
            items.extend(found)
            continue
        if not isinstance(raw, dict):
            continue
        stem = raw.get("question") or raw.get("stem") or raw.get("题目") or raw.get("题干") or ""
        options = raw.get("options") or raw.get("选项") or []
        if isinstance(options, str):
            options = [p for p in re.split(r"[|｜;；\n]+", options) if p.strip()]
        options = [re.sub(r"^[\(（]?\s*[A-Ha-h]\s*[\.、\)）:：]\s*", "", str(o)).strip() for o in options if str(o).strip()]
        answer = raw.get("answer") or raw.get("答案") or ""
        if isinstance(answer, list):
            answer = "".join(str(a) for a in answer)
        item = _make_item(str(stem), options, str(answer), raw=json.dumps(raw, ensure_ascii=False)[:400])
        if item:
            items.append(item)
    return items


# ---------------------------------------------------------------- 输出

CSV_HEADER = ("题目", "题型", "选项", "答案")


def questions_to_csv(items):
    buf = io.StringIO(newline="")
    writer = csv.writer(buf, lineterminator="\n")
    writer.writerow(CSV_HEADER)
    for item in items or []:
        options = item.get("options") or []
        if isinstance(options, str):
            options = [options]
        writer.writerow([
            item.get("question") or item.get("question_text") or "",
            item.get("type") or "",
            "|".join(str(o) for o in options),
            item.get("answer") or "",
        ])
    return buf.getvalue()


def question_payload(item):
    """题库匹配接口认的题目字符串（parse_question_payload 支持这个 JSON 形态）。"""
    payload = {
        "question": item.get("question") or "",
        "type": item.get("type") or "",
        "options": item.get("options") or [],
    }
    return json.dumps(payload, ensure_ascii=False)


def split_questions_from_any(text):
    """粘贴的文本 → 题目列表（前端「批量搜题」粘贴用）。"""
    return split_text_questions(text or "")
