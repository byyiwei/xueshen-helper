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
    known = (
        "__TTF_TABLE__", "__TTF2_TABLE__", "data['xueshen-",
        # 脚本猫版要按平台规则补 @antifeature / @original-*，并精简 @keywords；
        # 更新日志两边各自描述本次改动，版本号由 check_versions 单独校验。
        "@keywords", "@antifeature", "@original-", "@changelog",
    )

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


def check_versions(texts):
    """版本号五处必须同一个号：两份 @version、两份 @changelog 首条、version.json 两条目、
    docs/script-intro.md 最新一节。漏了 @changelog 或简介日志不会有人报错，所以在这里拦。"""
    import json
    import re

    got = {}
    for fn in MASTERS:
        ver = re.search(r"^//\s*@version\s+(\S+)", texts[fn], re.M)
        got["%s @version" % fn] = ver.group(1) if ver else "（缺 @version）"
        log = re.search(r"^//\s*@changelog\s+v(\d[\w.]*)", texts[fn], re.M)
        got["%s @changelog" % fn] = log.group(1) if log else "（缺 @changelog）"

    try:
        with open(os.path.join(HERE, "version.json"), encoding="utf-8") as f:
            data = json.load(f)
        for key in sorted(data):
            got["version.json:%s" % key] = str(data[key].get("version"))
    except (OSError, ValueError) as e:
        got["version.json"] = "（读不到：%s）" % e

    intro = os.path.join(HERE, os.pardir, "docs", "script-intro.md")
    try:
        with open(intro, "rb") as f:
            body = f.read().decode("utf-8-sig")
        top = re.search(r"^###\s+v(\d[\w.]*)", body, re.M)      # 日志倒序，第一节就是最新
        got["script-intro.md"] = top.group(1) if top else "（没有 ### vX.Y.Z 一节）"
    except OSError as e:
        got["script-intro.md"] = "（读不到：%s）" % e

    nums = set(got.values())
    if len(nums) != 1:
        detail = "\n".join("  %-28s %s" % (k, v) for k, v in sorted(got.items()))
        raise SystemExit("FAIL 版本号没对齐（%d 个不同的号）：\n%s" % (len(nums), detail))
    print("OK   版本号 %s 已在 %d 处对齐（@version / @changelog / version.json / script-intro.md）"
          % (nums.pop(), len(got)))


def check_isolation_gates(texts, channel):
    """门禁自检：故意造一处没挂 FX-CH 的官方收银台链接，构建必须炸；
    代理商把「店铺链接」填成官网也必须被拒。炸不了就等于门禁形同虚设。"""
    import re
    src = texts[MASTERS[0]]
    m = re.search(r"^[ \t]*const __noShop = ", src, re.M)
    if not m:
        raise SystemExit("FAIL 自检锚点丢了：主脚本里没有 const __noShop 那一行")
    probe = src[:m.start()] + '  const __leak = "https://xs.openget.cn/user?section=billing";\n' + src[m.start():]
    try:
        bd.build(probe, channel, bom=False)
    except bd.BuildError as e:
        if "FX-CH" not in str(e):
            raise SystemExit("FAIL 官方入口自检被别的原因拦下，门禁没验证到：%s" % e)
    else:
        raise SystemExit("FAIL 门禁失效：没挂 FX-CH 的官方收银台链接照样构建得出来")

    for bad in ("https://xs.openget.cn/user?section=billing", "https://openget.cn/buy"):
        try:
            bd.shop_url(bad)
        except bd.BuildError:
            pass
        else:
            raise SystemExit("FAIL 店铺链接允许填官网：%s" % bad)
    try:
        bd.shop_url("https://xs.openget.cn.evil.example/buy")
    except bd.BuildError as e:
        raise SystemExit("FAIL 官网域名判定误伤了别的站：%s" % e)
    print("OK   隔离门禁有效：官方收银台未挂哨兵即构建失败，店铺链接不许填官网")


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

    check_versions(texts)
    check_isolation_gates(texts, channel)

    for f in os.listdir(outdir):
        os.remove(os.path.join(outdir, f))
    os.rmdir(outdir)
    print("\n全部通过。")
    return 0


if __name__ == "__main__":
    sys.exit(main())
