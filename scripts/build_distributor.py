#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把主脚本构建成代理商「纯净版」。

用法：
    python3 scripts/build_distributor.py --channel 小明 --code D12 \
        --shop https://example.com/buy --display-name "学神助手 纯净版" \
        --out /tmp/dist scripts/xueshen-sc.js scripts/xueshen-gf.js

主脚本里约定三类标记（都是普通 JS 行注释，官方版行为零变化）：
    // >>> FX-STRIP:<name>   …  // <<< FX-STRIP:<name>     渠道版整段删除
    // >>> FX-INJECT:<name>  …  // <<< FX-INJECT:<name>    渠道版用渠道常量替换段内内容
    // FX-CH:<name>                                          渠道感知表达式，构建时只校验不改动

build() 会被 backend.py 的 /api/distributor/script 直接 import 使用（内存构建，不落盘），
所以这里既不读配置也不碰数据库，纯字符串进、字符串出。
"""
import argparse
import json
import os
import re
import sys

STRIP_RE = re.compile(r"^(\s*)//\s*>>>\s*FX-STRIP:([A-Za-z0-9_-]+)\s*$")
INJECT_RE = re.compile(r"^(\s*)//\s*>>>\s*FX-INJECT:([A-Za-z0-9_-]+)\s*$")
END_RE = re.compile(r"^(\s*)//\s*<<<\s*FX-(STRIP|INJECT):([A-Za-z0-9_-]+)\s*$")
CH_RE = re.compile(r"//\s*FX-CH:([A-Za-z0-9_-]+)")

# 渠道版要抹掉的官方元数据：更新通道、官网指路，以及攒在头部的版本日志
DROP_META_RE = re.compile(r"^\s*//\s*@(updateURL|downloadURL|homepageURL|supportURL|changelog)\b")
FORBIDDEN = (
    "pd.qq.com",
    "scriptcat.org",
    "user?section=promotion",
    "raw.githubusercontent.com",
    "scripts/version.json",
    "@updateURL",
    "@downloadURL",
)
REQUIRED = {
    "strip": {"promo", "qq-channel", "scriptcat-update", "auto-update"},
    "inject": {"dist-channel"},
    "ch": {"basic-info-shop", "remain-billing", "pricing-base-url", "pricing-login-param",
           "card-key-activate", "no-shop-guard", "no-shop-billing"},
}


class BuildError(Exception):
    pass


def _js_str(value):
    """把渠道文案安全地塞进 JS 字符串字面量。"""
    return json.dumps(value if value is not None else "", ensure_ascii=True)


def _one_line(value, limit):
    """渠道名/渠道码会被拼进注释和 @name 元数据行，换行能把注释顶出去，先压成一行。"""
    return re.sub(r"\s+", " ", str(value or "").replace("\x00", " ")).strip()[:limit]


_SHOP_MAX = 255


def shop_url(value):
    """校验并返回渠道购买/续费链接；空值原样返回空串（表示不渠道化）。

    规则的唯一来源：后台保存 distributors.shop_url 时也调这里，
    构建时再兜一次，避免出现「存进去了、构建才炸」。
    首尾空白是粘贴带进来的，去掉；中间空白直接拒绝——悄悄删掉一个空格
    会把链接指向另一个地址。禁 <>"' 反斜杠和控制字符：链接最终落在 JS
    字符串字面量里，而 U+2028/2029 在 JS 源码里等于换行。
    """
    url = str(value or "").strip()
    if not url:
        return ""
    if re.search(r"\s", url):
        raise BuildError("渠道链接中间不能有空格或换行")
    if len(url) > _SHOP_MAX:
        raise BuildError("渠道链接过长（上限 %d 字符）" % _SHOP_MAX)
    if not url.lower().startswith("https://"):
        raise BuildError("渠道链接必须以 https:// 开头")
    if re.search(r"[\"'<>\\]", url) or any(ord(c) < 0x20 or c in "\u2028\u2029" for c in url):
        raise BuildError("渠道链接不能包含引号、尖括号、反斜杠或控制字符")
    return url


def scan(text):
    """返回 (strips, injects, chs)，并校验哨兵成对、不嵌套、不重叠。"""
    lines = text.split("\n")
    strips, injects, chs, stack = {}, {}, set(), []
    for i, line in enumerate(lines):
        m = STRIP_RE.match(line)
        if m:
            stack.append((i, "STRIP", m.group(2)))
            continue
        m = INJECT_RE.match(line)
        if m:
            stack.append((i, "INJECT", m.group(2)))
            continue
        m = END_RE.match(line)
        if m:
            if not stack:
                raise BuildError("第 %d 行哨兵没有起点：%s" % (i + 1, m.group(3)))
            s, kind, name = stack.pop()
            if kind != m.group(2) or name != m.group(3):
                raise BuildError("第 %d 行哨兵与起点不匹配：%s vs %s" % (i + 1, m.group(3), name))
            if stack:
                raise BuildError("哨兵不允许嵌套：%s 包在 %s 里" % (name, stack[-1][1]))
            (strips if kind == "STRIP" else injects)[name] = (s, i)
            continue
        for name in CH_RE.findall(line):
            if name in chs:
                raise BuildError("FX-CH 标记重复：%s" % name)
            chs.add(name)
    if stack:
        raise BuildError("哨兵没有终点：%s" % ", ".join(x[2] for x in stack))
    return strips, injects, chs


def verify_markers(text, where="?"):
    strips, injects, chs = scan(text)
    for kind, got in (("strip", set(strips)), ("inject", set(injects)), ("ch", chs)):
        want = REQUIRED[kind]
        missing, extra = want - got, got - want
        if missing or extra:
            raise BuildError(
                "%s 的 FX-%s 集合不对：缺 %s，多 %s"
                % (where, kind.upper(), sorted(missing) or "-", sorted(extra) or "-"))
    return strips, injects, chs


def build(text, channel, bom=False):
    """channel: {name, code, shop, display_name}。返回纯净版源码。"""
    name = _one_line(channel.get("name"), 64)
    code = _one_line(channel.get("code"), 32)
    display = _one_line(channel.get("display_name"), 40)
    shop = shop_url(channel.get("shop"))
    if not name:
        raise BuildError("缺少渠道名，纯净版必须带水印")
    if not code:
        raise BuildError("缺少渠道码，纯净版必须可追溯")

    strips, injects, chs = verify_markers(text, "主脚本")
    lines = text.split("\n")
    if lines and lines[0].startswith("\ufeff"):
        lines[0] = lines[0].lstrip("\ufeff")

    drop = set()
    for s, e in strips.values():
        drop.update(range(s, e + 1))

    out, i, synth = [], 0, set()
    while i < len(lines):
        if i in drop:
            i += 1
            continue
        line = lines[i]
        m = INJECT_RE.match(line)
        if m and m.group(2) in injects:
            s, e = injects[m.group(2)]
            indent = m.group(1)
            if m.group(2) == "dist-channel":
                line = indent + "var __DIST = { shop: %s, name: %s, code: %s };" % (
                    _js_str(shop), _js_str(name), _js_str(code))
                synth.add(line)
                out.append(line)
            else:
                raise BuildError("未知的 FX-INJECT：%s" % m.group(2))
            i = e + 1
            continue
        if DROP_META_RE.match(line):
            i += 1
            continue
        g = re.match(r"^(\s*//\s*@name\s+)(.*\S)\s*$", line)
        if g:
            line = g.group(1) + (display or g.group(2)) + "｜" + name
            synth.add(line)
            out.append(line)
            i += 1
            continue
        out.append(line)
        i += 1

    # 水印贴在元数据块之后，Tampermonkey 不解析、人一眼能看到是自己那一版
    for k, line in enumerate(out):
        if line.strip() == "// ==/UserScript==":
            marks = ("",
                     "// 本副本由学神助手授权「%s」（渠道码 %s）分发，请勿转存或公开。" % (name, code),
                     "// 已移除官方更新检查与官方推广入口；%s" % (
                         "购买/续费链接指向该渠道自备地址。" if shop
                         else "该渠道未提供购买地址，脚本内的续费与价格入口已停用，"
                              "终端用户只能凭该渠道发放的卡密激活。"))
            for off, mark in enumerate(marks):
                out.insert(k + 1 + off, mark)
                synth.add(mark)
            break

    result = "\n".join(out)
    if bom:
        result = "\ufeff" + result

    # 渠道自备链接可以指向任意 https 站点（有代理商的店就开在 QQ 频道），
    # 所以官方内容只在「非本次注入」的行里查。用逐行 join 而不是从成品里
    # str.replace 渠道文本：replace 会连带删掉字面量中间的片段，能把
    # "@updateURL" 拆成 "@update" + "URL" 从而骗过检查。
    scan_text = "\n".join(l for l in out if l not in synth)
    hit = [f for f in FORBIDDEN if f in scan_text]
    if hit:
        raise BuildError("纯净版仍残留官方内容：%s" % ", ".join(hit))
    if "// >>> FX-" in result or "// <<< FX-" in result:
        raise BuildError("纯净版仍残留哨兵标记")
    return result


def build_file(src_path, channel):
    raw = open(src_path, "rb").read()
    return build(raw.decode("utf-8-sig"), channel, bom=raw[:3] == b"\xef\xbb\xbf")


def main():
    ap = argparse.ArgumentParser(description="构建代理商纯净版脚本")
    ap.add_argument("sources", nargs="+", help="主脚本路径")
    ap.add_argument("--channel", required=True, help="渠道名（代理商名称）")
    ap.add_argument("--code", required=True, help="渠道码，用于追溯")
    ap.add_argument("--shop", default="", help="渠道自己的购买/续费 https 链接，可留空")
    ap.add_argument("--display-name", default="", help="覆盖 @name（后台的纯净版脚本名），留空则沿用官方名")
    ap.add_argument("--out", default="", help="输出目录，留空则只写 <name>.dist.js")
    args = ap.parse_args()
    if hasattr(sys.stdout, "reconfigure"):      # Windows 控制台默认 GBK
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    channel = {"name": args.channel, "code": args.code, "shop": args.shop,
               "display_name": args.display_name}
    for src in args.sources:
        text = build_file(src, channel)
        base = os.path.basename(src)
        if args.out:
            os.makedirs(args.out, exist_ok=True)
            dst = os.path.join(args.out, base)
        else:
            dst = base + ".dist.js"
        with open(dst, "wb") as f:
            f.write(text.encode("utf-8"))
        print("%s -> %s (%d bytes)" % (base, dst, len(text.encode("utf-8"))))
    return 0


if __name__ == "__main__":
    sys.exit(main())
