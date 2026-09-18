# 学神助手 · 脚本发布仓库

本仓库**只用于油猴 / GreasyFork / ScriptCat 自动更新**，不含后端与网站源码。

正式开发仓库在腾讯云 CNB：https://cnb.cool/ipyiwei/XS

## 自动更新文件

| 文件 | 用途 |
|------|------|
| `scripts/xueshen-gf.js` | GreasyFork 同步源（油猴） |
| `scripts/xueshen-sc.js` | ScriptCat / 油猴 `@updateURL` |
| `scripts/jdz-art-study-helper.user.js` | 景德镇艺术职业学院助手 |
| `scripts/jiangxi-open-university-helper.user.js` | 江西开放大学助手 |
| `scripts/version.json` | 脚本内「发现新版本」提示 |

发版时只改这些文件，并提高 `@version`，然后 `git push` 到 `main`。
