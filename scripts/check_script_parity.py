#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""主脚本体检：哨兵完整、两份脚本主体同源、纯净版构建得出来。

    python3 scripts/check_script_parity.py

改过 scripts/xueshen-sc.js / xueshen-gf.js 之后跑一下；发版前也该跑。
任一检查不过就非零退出，方便挂进发版流程。
"""
import os
import subprocess
import sys
import tempfile
from collections import Counter

if hasattr(sys.stdout, "reconfigure"):          # Windows 控制台默认 GBK，别让中文把自己编码搞崩
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_distributor as bd  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
MASTERS = ("xueshen-sc.js", "xueshen-gf.js")

# 两份脚本的分工就是「同一套代码 + 不同的依赖装载方式」，所以下面这些行不参与同源比对
IGNORE_PREFIX = ("// @require", "// @resource", "// @updateURL", "// @downloadURL")


def read(path):
    with open(path, "rb") as f:
        raw = f.read()
    return raw.decode("utf-8-sig"), raw[:3] == b"\xef\xbb\xbf"


def comparable(text):
    """丢掉两份脚本注定不同的那几处：BOM、依赖装载方式、Greasy Fork 版内嵌的字体表。
    空行也一起忽略——只比代码同源，不比排版。"""
    out, skipping = [], False
    for line in text.lstrip("\ufeff").split("\n"):
        if "内联字体映射表数据" in line:
            skipping = True
            continue
        if skipping:
            if "内联数据结束" in line:
                skipping = False
            continue
        if line.startswith(IGNORE_PREFIX) or not line.strip():
            continue
        out.append(line)
    return out


# 已经知道、但只影响观感的分叉：报警不失败，等着被统一
WARN_DIFF = ("miniBallGlow",)


def drift(a, b):
    """按行多重集比对两份脚本。返回（真分叉行, 仅告警行）：
    字体表装载适配器（Greasy Fork 不能带 @resource）和各自读自己那条 version.json 记录是注定不同的；
    命中 WARN_DIFF 的行只报警。"""
    ca, cb = Counter(a), Counter(b)
    known = ("__TTF_TABLE__", "__TTF2_TABLE__", "data['xueshen-")

    def bucket(xs):
        xs = [x for x in xs if not any(t in x for t in known)]
        warn = [x for x in xs if any(t in x for t in WARN_DIFF)]
        return [x for x in xs if x not in warn], warn

    only_a, warn_a = bucket((ca - cb).elements())
    only_b, warn_b = bucket((cb - ca).elements())
    return (only_a, only_b), (warn_a + warn_b)


def node_check(path):
    r = subprocess.run(["node", "--check", path], capture_output=True)
    if r.returncode != 0:
        raise SystemExit("node --check 失败：%s\n%s" % (path, r.stderr.decode("utf-8", "replace")[:800]))


def main():
    texts, boms = {}, {}
    for fn in MASTERS:
        path = os.path.join(HERE, fn)
        node_check(path)
        texts[fn], boms[fn] = read(path)
        try:
            strips, injects, chs = bd.verify_markers(texts[fn], fn)
        except bd.BuildError as e:
            raise SystemExit("FAIL 哨兵：%s" % e)
        print("OK   %-16s strip=%d inject=%d ch=%d"
              % (fn, len(strips), len(injects), len(chs)))

    a, b = comparable(texts[MASTERS[0]]), comparable(texts[MASTERS[1]])
    (only_sc, only_gf), warn = drift(a, b)
    if warn:
        print("WARN 两份脚本有 %d 处已知的外观差异（悬浮球光晕 CSS），找时间统一掉" % len(warn))
    if only_sc or only_gf:
        sample = ["  仅 sc：%s" % x[:110] for x in only_sc[:5]]
        sample += ["  仅 gf：%s" % x[:110] for x in only_gf[:5]]
        raise SystemExit("FAIL 两份主脚本已经分叉（仅 sc %d 行 / 仅 gf %d 行）：\n%s"
                         % (len(only_sc), len(only_gf), "\n".join(sample)))
    print("OK   两份主脚本同源（%d 行，差异仅字体表装载适配器）" % len(a))

    channel = {"name": "体检渠道", "code": "CHK01", "shop": "https://shop.example.com/buy?plan=1",
               "display_name": "学神助手 纯净版"}
    outdir = tempfile.mkdtemp(prefix="fx-parity-")
    built = {}
    for fn in MASTERS:
        text = bd.build(texts[fn], channel, bom=boms[fn])
        dst = os.path.join(outdir, fn)
        with open(dst, "wb") as f:
            f.write(text.encode("utf-8"))
        node_check(dst)
        built[fn] = text
        print("OK   纯净版 %-16s %d 字节，node --check 通过" % (fn, len(text.encode("utf-8"))))

    (bs, bg), _ = drift(comparable(built[MASTERS[0]]), comparable(built[MASTERS[1]]))
    if bs or bg:
        raise SystemExit("FAIL 构建后两份纯净版分叉了（仅 sc %d 行 / 仅 gf %d 行）" % (len(bs), len(bg)))
    for fn in MASTERS:
        for token in ("__DIST = {", "FX-CH:", "本副本由学神助手授权",
                      '// @name         学神助手 纯净版｜体检渠道',
                      '__DIST = { shop: "https://shop.example.com/buy?plan=1"'):
            if token not in built[fn]:
                raise SystemExit("FAIL %s 纯净版缺少 %s" % (fn, token))
    print("OK   纯净版仍同源，渠道常量、水印与 FX-CH 站点齐备")

    for fn in MASTERS:
        if "__DIST = { shop: \"\", name: \"\", code: \"\" };" not in texts[fn]:
            raise SystemExit("FAIL %s 官方版主脚本的 __DIST 必须是全空串（保证行为零变化）" % fn)
    print("OK   官方版主脚本 __DIST 为空，哨兵不改变现有行为")

    for f in os.listdir(outdir):
        os.remove(os.path.join(outdir, f))
    os.rmdir(outdir)
    print("\n全部通过。")
    return 0


if __name__ == "__main__":
    sys.exit(main())
