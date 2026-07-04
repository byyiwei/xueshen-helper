# 学神助手 - 项目说明

## 项目结构

```
├── src/
│   ├── backend.py          # 后端主程序（HTTP服务、API、AI调用、支付）
│   ├── database.py         # 数据库操作（MySQL、自动迁移）
│   └── run_backend.py      # 后端启动入口
├── config/
│   ├── config.json         # 管理后台配置（已被.gitignore排除，不提交）
│   ├── config.example.json # 配置文件模板
│   ├── providers.json      # AI提供商配置（已被.gitignore排除，不提交）
│   ├── providers.example.json # AI提供商配置模板
│   ├── xs.openget.cn.conf  # Nginx 配置文件
│   └── jwt_secret.key      # JWT 密钥文件
├── scripts/
│   ├── xueshen-gf.js       # 油猴脚本 - GreasyFork版本
│   └── xueshen-sc.js       # 油猴脚本 - ScriptCat版本
├── static/
│   ├── admin.html          # 管理后台页面
│   ├── user.html           # 用户中心页面
│   ├── vue.global.js       # Vue.js运行时
│   └── icon.jpg            # 脚本图标
├── libs/                   # 前端依赖库（本地托管）
├── intro/
│   └── index.html          # 项目首页
├── publish_materials/      # 发布素材
├── docs/                   # 项目文档
├── .env.example            # 环境变量模板
└── README.md               # 项目说明
```

---

## 油猴脚本说明

### xueshen-gf.js（GreasyFork 版本）

- **用途**：发布到 GreasyFork（greasyfork.org）的油猴脚本
- **兼容**：Tampermonkey（Chrome/Edge/Firefox）、Violentmonkey
- **脚本头关键配置**：
  ```javascript
  // @name         🚀学神助手｜学习通｜超星·智慧树全能学习
  // @version      5.0.2
  // @updateURL    https://raw.githubusercontent.com/byyiwei/xueshen-helper/main/scripts/xueshen-gf.js
  // @downloadURL  https://raw.githubusercontent.com/byyiwei/xueshen-helper/main/scripts/xueshen-gf.js
  ```
- **GreasyFork 地址**：在 greasyfork.org 上搜索"学神助手"
- **同步方式**：已配置 GitHub 自动同步（见下方说明）

### xueshen-sc.js（ScriptCat 版本）

- **用途**：发布到 ScriptCat（scriptcat.org）的脚本
- **兼容**：ScriptCat 浏览器扩展
- **脚本头关键配置**：
  ```javascript
  // @name         🚀学神助手｜学习通｜超星·智慧树全能学习
  // @version      5.0.2
  // @updateURL    https://raw.githubusercontent.com/byyiwei/xueshen-helper/main/scripts/xueshen-sc.js
  // @downloadURL  https://raw.githubusercontent.com/byyiwei/xueshen-helper/main/scripts/xueshen-sc.js
  ```
- **ScriptCat 地址**：在 scriptcat.org 上搜索"学神助手"

### 两个版本的区别

| 对比项 | xueshen-gf.js | xueshen-sc.js |
|--------|---------------|---------------|
| 发布平台 | GreasyFork | ScriptCat |
| 脚本管理器 | Tampermonkey/Violentmonkey | ScriptCat |
| GM API兼容 | 完整支持 | 完整支持 |
| 核心功能 | 完全相同 | 完全相同 |
| 代码差异 | 几乎无差异，仅发布平台不同 | 同左 |

---

## GitHub 自动同步说明（重要）

### 仓库信息

- **GitHub 仓库**：https://github.com/byyiwei/xueshen-helper
- **分支**：main
- **可见性**：Public（公开）

### GreasyFork 自动同步配置

GreasyFork 已配置从 GitHub 自动同步脚本，配置信息如下：

| 配置项 | 值 |
|--------|-----|
| 同步链接 | `https://raw.githubusercontent.com/byyiwei/xueshen-helper/main/scripts/xueshen-gf.js` |
| 同步方式 | 自动 |
| Webhook URL | `https://greasyfork.org/zh-CN/users/1618793-ipyiwei/webhook` |
| Webhook 触发事件 | push（推送到 main 分支时） |
| Webhook 状态 | 显示 403（正常现象，实际同步成功） |

### 自动更新链路

```
修改代码 → git push → GitHub Webhook 通知 GreasyFork → GreasyFork 拉取最新代码 → 用户端油猴检测 @version 变化 → 自动更新
```

### 发版操作步骤（每次更新脚本必须执行）

1. **修改脚本代码**

2. **必须改大 @version 版本号**（否则不会触发更新）
   ```javascript
   // 例如 5.0.2 → 5.0.3
   // @version      5.0.3
   ```

3. **提交并推送到 GitHub**
   ```bash
   cd c:\Users\HUAWEI\Desktop\脚本
   git add -A
   git commit -m "更新到 v5.0.3"
   git push
   ```

4. **完成**。GreasyFork 自动同步，用户自动收到更新提示，无需手动操作。

### 注意事项

- **版本号必须改大**：每次更新代码必须把 `@version` 改大（如 5.0.2 → 5.0.3），否则 GreasyFork 和油猴都不会认为有更新
- **Webhook 403 可忽略**：GreasyFork 对 Webhook 请求返回 403 是正常现象，实际同步会成功
- **只推送 main 分支**：Webhook 只监听 main 分支的 push 事件
- **定时检查兜底**：即使 Webhook 失败，GreasyFork 的「自动」模式也会每小时检查一次 GitHub 是否有更新
- **xueshen-sc.js 需手动同步**：ScriptCat 目前没有配置自动同步，需要手动上传更新

---

## Git 代理配置

由于国内访问 GitHub 不稳定，已配置 Git 代理：

```
git config --global http.proxy http://127.0.0.1:7890
git config --global https.proxy http://127.0.0.1:7890
```

如代理端口变更，用以下命令更新：
```bash
git config --global http.proxy http://127.0.0.1:新端口
git config --global https.proxy http://127.0.0.1:新端口
```

---

## 敏感文件说明（已被 .gitignore 排除）

以下文件包含敏感信息，不会被提交到 GitHub：

| 文件 | 说明 |
|------|------|
| config/config.json | 管理后台配置（含管理员密码hash、邮件配置） |
| config/providers.json | AI 提供商配置（含 API Key） |
| .env | 环境变量（含数据库密码） |
| config/jwt_secret.key | JWT 密钥文件 |
| *.pem | 证书文件 |
| jwt_secret.key | JWT 密钥文件 |
| *.db / *.sqlite3 | 数据库文件 |

提交代码前请确认这些文件未被 `git add` 添加。

---

## 宝塔部署指南

### 环境要求

- **操作系统**：Linux（CentOS 7+/Ubuntu 18.04+）
- **Python**：3.10+
- **MySQL**：5.7+ 或 8.0+
- **Nginx**：1.20+（你已装 1.30.3，满足要求）
- **宝塔面板**：已安装「进程守护管理器」3.0.6+

### 1. 上传项目

将 `xueshen-helper.zip` 上传到服务器网站目录（如 `/www/wwwroot/xs.openget.cn`），解压：

```bash
cd /www/wwwroot/xs.openget.cn
unzip xueshen-helper.zip
```

解压后目录结构应为：

```
/www/wwwroot/xs.openget.cn
├── src/              # Python 后端源码
├── config/           # 配置文件
├── scripts/          # 油猴脚本
├── static/           # 静态页面
├── libs/             # 前端库
├── intro/            # 项目首页
├── docs/             # 文档
├── .env.example
└── README.md
```

### 2. 配置环境变量

```bash
cp .env.example .env
vi .env
```

编辑 `.env`，填写数据库连接信息：

```ini
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=xueshen
```

### 3. 安装 Python 依赖

```bash
cd /www/wwwroot/xs.openget.cn/src
pip install -r requirements.txt
```

如果项目没有 `requirements.txt`，手动安装以下依赖：

```bash
pip install pymysql python-dotenv
```

（如果有支付宝/微信支付相关依赖，按需安装）

### 4. 初始化数据库

首次启动时，`database.py` 会自动创建所有表。确保 MySQL 中已创建数据库：

```sql
CREATE DATABASE xueshen CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 5. 配置 Nginx

宝塔面板 -> 网站 -> 对应站点 -> 设置 -> 配置文件

将 `config/xs.openget.cn.conf` 中的内容复制到 Nginx 配置中。**注意修改以下路径为你的实际部署路径**：

```nginx
server {
    listen 80;
    listen 443 ssl;
    server_name xs.openget.cn;
    index index.html;
    root /www/wwwroot/xs.openget.cn;

    # 静态依赖
    location /libs/ {
        alias /www/wwwroot/xs.openget.cn/libs/;
        expires 30d;
        access_log off;
    }

    # 后台/用户中心静态文件
    location /static/ {
        alias /www/wwwroot/xs.openget.cn/static/;
        expires 12h;
        access_log off;
    }

    # 脚本下载（触发浏览器下载）
    location = /xueshen-gf.js {
        alias /www/wwwroot/xs.openget.cn/scripts/xueshen-gf.js;
        default_type application/javascript;
        add_header Content-Disposition 'attachment; filename="xueshen-gf.js"';
        access_log off;
    }
    location = /xueshen-sc.js {
        alias /www/wwwroot/xs.openget.cn/scripts/xueshen-sc.js;
        default_type application/javascript;
        add_header Content-Disposition 'attachment; filename="xueshen-sc.js"';
        access_log off;
    }

    # 所有请求反向代理到 Python 后端
    location / {
        proxy_pass http://127.0.0.1:8360;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 30s;
        proxy_read_timeout 120s;
        proxy_send_timeout 120s;
        client_max_body_size 20m;
    }
}
```

保存后，宝塔面板 -> 服务 -> 重载 Nginx 配置。

### 6. 配置宝塔进程守护管理器

宝塔面板 -> 软件商店 -> 进程守护管理器 -> 添加守护进程

| 配置项 | 值 |
|--------|-----|
| 名称 | 学神助手后端 |
| 启动命令 | `python src/run_backend.py` |
| 运行目录 | `/www/wwwroot/xs.openget.cn` |
| 启动用户 | `root`（或 www） |
| 进程数 | `1` |

**注意**：
- 启动命令中的 `python` 必须是 Python 3.10+ 的路径。如果不是，请使用完整路径，如 `/usr/local/bin/python3.10 src/run_backend.py`
- 运行目录必须是项目根目录（包含 src/、config/ 等文件夹的目录），**不能**设为 `src/` 子目录
- 保存后点击「启动」，状态变为绿色「运行中」即表示成功

### 7. 验证部署

- 首页：`https://xs.openget.cn/`
- 管理后台：`https://xs.openget.cn/admin`
- 用户中心：`https://xs.openget.cn/user`
- 脚本下载：`https://xs.openget.cn/xueshen-gf.js`
- API 测试：`https://xs.openget.cn/api/v1/cx`

### 8. 常见问题

**Q: 进程守护启动失败，提示 ModuleNotFoundError**
A: Python 依赖未安装。在运行目录下执行 `pip install pymysql python-dotenv`。

**Q: 提示数据库连接失败**
A: 检查 `.env` 文件中的数据库配置，确认 MySQL 用户有权限访问对应数据库。

**Q: 端口 8360 被占用**
A: 修改 `src/backend.py` 中的 `PORT = 8360`，同时修改 Nginx 配置中的 `proxy_pass` 端口。

---

## 油猴自动更新说明

**项目结构调整不影响油猴自动更新。**

油猴脚本的 `@updateURL` / `@downloadURL` 指向 **GitHub raw 地址**：

```
https://raw.githubusercontent.com/byyiwei/xueshen-helper/main/scripts/xueshen-gf.js
```

这个地址基于 **GitHub 仓库根目录**，不受本地服务器项目结构影响。只要：

1. GitHub 仓库中 `scripts/xueshen-gf.js` 存在
2. 每次更新时修改 `@version` 版本号
3. 推送到 `main` 分支

用户的油猴插件就会自动检测到更新。

**需要更新的地方**：
- GreasyFork 后台的「同步链接」已改为带 `/scripts/` 的路径（见上方同步配置）
- 如果之前 GreasyFork 配置的是旧路径（不带 `/scripts/`），请在 GreasyFork 后台更新同步链接

本地服务器的 Nginx 配置也已同步更新，直接通过 `https://xs.openget.cn/xueshen-gf.js` 下载脚本不受影响。
