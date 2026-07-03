# 学神助手 - 项目说明

## 项目结构

```
├── backend.py              # 后端主程序（HTTP服务、API、AI调用、支付）
├── database.py             # 数据库操作（MySQL、自动迁移）
├── run_backend.py          # 后端启动入口
├── config.json             # 管理后台配置（已被.gitignore排除，不提交）
├── providers.json          # AI提供商配置（已被.gitignore排除，不提交）
├── config.example.json     # 配置文件模板
├── providers.example.json  # AI提供商配置模板
├── .env.example            # 环境变量模板
├── static/
│   ├── admin.html          # 管理后台页面
│   ├── user.html           # 用户中心页面
│   └── vue.global.js       # Vue.js运行时
├── libs/                   # 前端依赖库（本地托管）
├── xueshen-gf.js           # 油猴脚本 - GreasyFork版本
├── xueshen-sc.js           # 油猴脚本 - ScriptCat版本
└── publish_materials/      # 发布素材
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
  // @updateURL    https://raw.githubusercontent.com/byyiwei/xueshen-helper/main/xueshen-gf.js
  // @downloadURL  https://raw.githubusercontent.com/byyiwei/xueshen-helper/main/xueshen-gf.js
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
  // @updateURL    https://raw.githubusercontent.com/byyiwei/xueshen-helper/main/xueshen-sc.js
  // @downloadURL  https://raw.githubusercontent.com/byyiwei/xueshen-helper/main/xueshen-sc.js
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
| 同步链接 | `https://raw.githubusercontent.com/byyiwei/xueshen-helper/main/xueshen-gf.js` |
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
| config.json | 管理后台配置（含管理员密码hash、邮件配置） |
| providers.json | AI 提供商配置（含 API Key） |
| .env | 环境变量（含数据库密码、JWT密钥） |
| *.key | 密钥文件 |
| *.pem | 证书文件 |
| jwt_secret.key | JWT 密钥文件 |
| *.db / *.sqlite3 | 数据库文件 |

提交代码前请确认这些文件未被 `git add` 添加。
