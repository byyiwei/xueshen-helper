# 养龟档案 - 项目文档中心

本目录集中存放项目所有文档资料。项目各模块的说明文档、部署指南、设计稿等均统一归档于此。

---

## 一、文档目录结构

```
doc/
├── README.md                  # 本文件 - 文档索引
├── project/                   # 项目级文档
│   └── 项目简介.txt            # 项目简介与定位
├── deployment/                # 部署运维文档
│   └── 宝塔面板部署指南.md      # 宝塔面板环境部署完整流程
├── html2image-server/         # HTML 转图片服务文档
│   ├── README.md              # 服务启动停止工具包说明
│   ├── 使用说明.md             # 详细使用手册（环境要求、配置、API）
│   ├── COMPLETE_SOLUTION.md   # 启动脚本乱码问题完整解决方案
│   └── ENCODING_SOLUTION.md   # 编码问题备选解决方案
├── libraries/                 # 第三方库文档
│   └── detonger-lpapi-README.md  # 德佟蓝牙打印 SDK 说明
└── design/                    # 设计预览稿
    ├── home.html              # 首页设计预览
    ├── index-redesign.html    # 首页改版设计
    ├── my-profile.html        # 个人中心设计预览
    ├── pet-detail.html        # 宠物详情设计预览
    └── pet-list.html          # 宠物列表设计预览
```

---

## 二、项目整体架构

养龟档案是一款专为宠物龟爱好者打造的饲养管理工具，帮助记录龟只日常状态、成长数据、交配产蛋等信息。项目采用多端架构：

| 模块 | 目录 | 技术栈 | 说明 |
|------|------|--------|------|
| 微信小程序 | `miniprogram/` | 原生小程序 + 云开发 | 用户端，含自定义 TabBar、蓝牙打印、语音识别 |
| 云函数后端 | `cloudfunctions/` | 微信云开发 | 小程序配套云函数（登录、宠物、记录、提醒等 12 个） |
| REST API 服务器 | `server/` | Express + MySQL + JWT | 自建服务器 v2.0，提供完整 REST API |
| 管理后台 | `admin-web/` | Vue 3 + Element Plus + ECharts | 独立 Web 管理后台 |
| HTML 转图片服务 | `html2image-server/` | Node.js + Puppeteer | 将 HTML 渲染为图片的 HTTP 服务 |
| Cloudflare Worker | `cloudflare-worker/` | Cloudflare Browser Rendering | HTML 转图片的云端备选方案 |
| 服务器部署配置 | `server-setup/` | Nginx + Shell + SQL | 部署脚本、Nginx 配置、数据库初始化 |
| 第三方库 | `vendor/detonger/` | lpapi-ble-wx | 德佟蓝牙打印 SDK（已编译产物同步至 `miniprogram/lpapi/`） |
| 工具脚本 | `scripts/` | Shell | 项目辅助脚本（如推送 Gitee） |

---

## 三、文档与源码的对应关系

本次整理将原本散落在各子目录的文档统一归入 `doc/`。文档与其对应的源码模块关系如下：

| 文档（doc/ 下） | 对应源码模块 |
|------------------|-------------|
| `html2image-server/*` | `html2image-server/` |
| `libraries/detonger-lpapi-README.md` | `vendor/detonger/` |
| `deployment/宝塔面板部署指南.md` | `server-setup/`、`server/`、`admin-web/` |
| `design/*.html` | `miniprogram/`（小程序页面设计参考） |
| `project/项目简介.txt` | 整个项目 |

---

## 四、快速开始

1. **小程序开发**：用微信开发者工具打开项目根目录（`project.config.json` 所在位置），小程序代码在 `miniprogram/`，云函数在 `cloudfunctions/`。
2. **服务器部署**：参考 `doc/deployment/宝塔面板部署指南.md`，服务器代码在 `server/`。
3. **管理后台**：进入 `admin-web/` 执行 `npm install && npm run dev`。
4. **HTML 转图片服务**：参考 `doc/html2image-server/使用说明.md`，代码在 `html2image-server/`。

---

## 五、整理说明

本次整理执行了以下操作：

1. **文档集中化**：将散落在 `html2image-server/`、`server-setup/`、`detonger/` 的 6 个 Markdown 文档统一归入 `doc/` 并按类别分目录存放。
2. **设计稿归档**：将根目录的 `design-preview/` 5 个 HTML 设计预览稿移至 `doc/design/`。
3. **第三方库归类**：将根目录的 `detonger/`（德佟蓝牙打印 SDK）移至 `vendor/detonger/`，明确其第三方依赖身份。
4. **删除冗余目录**：`server-update/` 中的 3 个文件（`admin-auth.js`、`db.js`、`email.js`）与 `server/src/` 中对应文件完全一致（MD5 校验），属已集成的暂存文件，予以删除。
5. **根目录清理**：`认证简介.txt` 移至 `doc/project/项目简介.txt`；`push-to-gitee.sh` 移至 `scripts/` 并修正路径；删除 8 个 `.DS_Store` 垃圾文件。

> 注：`.qoder/` 目录为 Qoder 工具自动生成的项目知识库，非人工编写文档，未纳入 `doc/` 整理范围。
