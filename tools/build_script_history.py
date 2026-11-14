#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""从 git 历史生成脚本历史版本库。

    python tools/build_script_history.py --out D:/tmp/xs-history

每个版本只保留一份（取最近一次出现的内容），文件名带版本号，后缀保持
.user.js，脚本管理器才会接管安装。同时生成 index.json 给历史版本页读取。
旧版本只存在于 git 提交里，线上不需要保留旧文件就能随时重建。
"""
import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
from datetime import datetime

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRIPTS = {
    "xueshen-sc": {"name": "脚本猫版", "path": "scripts/xueshen-sc.js"},
    "xueshen-gf": {"name": "油猴版", "path": "scripts/xueshen-gf.js"},
}


def run(args):
    return subprocess.run(args, cwd=HERE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True).stdout


def git_commits(path):
    """返回 [(commit, YYYY-MM-DD)]，新提交在前。"""
    out = run(["git", "log", "--format=%H %ad", "--date=short", "--", path]).decode("utf-8", "replace")
    rows = []
    for line in out.splitlines():
        parts = line.split()
        if len(parts) >= 2:
            rows.append((parts[0], parts[1]))
    return rows


def read_commit(commit, path):
    try:
        return run(["git", "show", "%s:%s" % (commit, path)]).decode("utf-8-sig", "replace")
    except subprocess.CalledProcessError:
        return ""


def parse_version(text):
    m = re.search(r"^//\s*@version\s+([0-9][0-9A-Za-z.\-]*)", text, re.M)
    return m.group(1) if m else ""


def parse_changelog(text, version, fallback_date):
    date = fallback_date
    items = []
    current = ""
    for line in text.splitlines()[:600]:
        m = re.match(r"^//\s*@changelog\s+v?([0-9]+\.[0-9]+(?:[.\-][0-9A-Za-z]+)*)\s*(?:\((\d{4}-\d{2}-\d{2})\))?", line)
        if m:
            current = m.group(1)
            if current == version and m.group(2):
                date = m.group(2)
            continue
        m2 = re.match(r"^//\s*@changelog\s+(.+)$", line)
        if m2 and current == version:
            item = m2.group(1).strip()
            if item:
                items.append(item)
    return date, items


def version_key(v):
    parts = []
    for p in v.split("."):
        parts.append(int(p) if p.isdigit() else 0)
    return tuple(parts)


def collect(key, cfg, out_dir):
    seen = set()
    versions = []
    for commit, commit_date in git_commits(cfg["path"]):
        text = read_commit(commit, cfg["path"])
        if not text:
            continue
        version = parse_version(text)
        if not version or version in seen:
            continue
        seen.add(version)
        date, changelog = parse_changelog(text, version, commit_date)
        raw = text.encode("utf-8")
        filename = "%s-%s.user.js" % (key, version)
        with open(os.path.join(out_dir, filename), "wb") as f:
            f.write(raw)
        versions.append({
            "version": version,
            "date": date,
            "changelog": changelog,
            "file": filename,
            "size": len(raw),
            "sha256": hashlib.sha256(raw).hexdigest(),
            "commit": commit[:7],
        })
    versions.sort(key=lambda x: version_key(x["version"]), reverse=True)
    return versions


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True, help="输出目录，会先清空")
    args = ap.parse_args()
    out_dir = os.path.abspath(args.out)
    if os.path.isdir(out_dir):
        shutil.rmtree(out_dir)
    os.makedirs(out_dir, exist_ok=True)

    manifest = {
        "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "scripts": {},
    }
    for key, cfg in SCRIPTS.items():
        versions = collect(key, cfg, out_dir)
        manifest["scripts"][key] = {
            "name": cfg["name"],
            "latest": versions[0]["version"] if versions else "",
            "count": len(versions),
            "versions": versions,
        }
        print("%s: %d 个版本，最新 %s" % (key, len(versions), manifest["scripts"][key]["latest"]))

    with open(os.path.join(out_dir, "index.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
    print("输出目录:", out_dir)


if __name__ == "__main__":
    main()
