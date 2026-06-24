该项目采用**混合架构**，包含微信小程序前端、微信云函数后端、独立 Node.js 渲染服务以及 Cloudflare Worker 边缘服务。其构建与部署体系呈现出**脚本化、平台依赖性强、缺乏统一 CI/CD** 的特点。

### 1. 核心构建与部署策略

*   **微信小程序 (miniprogram)**:
    *   **构建方式**: 依赖微信开发者工具（WeChat DevTools）进行编译、压缩和上传。`project.config.json` 中配置了 ES6 转译、代码压缩（minified/minifyWXML）及 NPM 包忽略规则。
    *   **依赖管理**: 使用 `npm` 管理第三方库（如 `threejs-miniprogram`），通过 `miniprogram_npm` 目录集成。
    *   **发布流程**: 手动或通过 IDE 插件上传代码至微信平台审核发布，无自动化流水线。

*   **微信云函数 (cloudfunctions)**:
    *   **部署方式**: 每个云函数（如 `pet`, `login`, `admin`）为独立的 Node.js 模块，拥有各自的 `package.json`。
    *   **依赖安装**: 需在本地或云端安装 `wx-server-sdk` 等依赖。通常通过微信开发者工具右键“上传并部署”进行更新。
    *   **配置**: 每个函数包含 `config.json` 用于配置超时时间、内存等运行时参数。

*   **HTML 转图像服务 (html2image-server)**:
    *   **启动机制**: 采用自定义的 Node.js 启动脚本 (`start.js`) 作为入口，通过 `spawn` 以 detached 模式运行 `server.js`，实现后台守护进程效果。
    *   **跨平台支持**: 提供了 `.bat` (Windows), `.sh` (Linux/macOS), `.ps1` (PowerShell) 等多种启动/停止脚本，适配不同服务器环境。
    *   **进程管理**: 虽未强制要求 PM2，但 `server-setup` 中推荐安装 PM2 进行生产环境进程守护。
    *   **依赖检查**: `start.js` 内置了 Node.js 版本检查、`node_modules` 存在性检查及端口占用检测，具备一定的自愈和预检能力。

*   **Cloudflare Worker (cloudflare-worker)**:
    *   **构建工具**: 使用 `wrangler` CLI 进行本地开发 (`wrangler dev`) 和生产部署 (`wrangler deploy`)。
    *   **配置**: `wrangler.toml` 定义了 Worker 名称、入口文件、兼容性日期及环境变量（如默认宽高、Cloudflare Account ID）。
    *   **部署流程**: 通过 `npm run deploy` 触发 Wrangler 将代码推送至 Cloudflare 边缘网络。

### 2. 服务器环境初始化 (server-setup)

*   **自动化脚本**: `setup.sh` 是一个针对 Ubuntu 22.04 的全自动环境配置脚本，执行以下操作：
    *   安装 Node.js 20.x, Nginx, MySQL 8.0, PM2。
    *   配置 UFW 防火墙（开放 SSH, Nginx, MySQL 端口）。
    *   创建项目目录 `/var/www/turtle-archive` 并设置权限。
    *   初始化 MySQL 数据库 `turtle_archive` 及用户 `turtle_user`。
*   **数据库迁移**: `database.sql` 包含了完整的表结构定义（Users, Pets, Records, Footprints 等），需手动导入。
*   **反向代理**: `turtle-archive.nginx` 提供了 Nginx 配置模板，实现了：
    *   静态资源缓存策略（1年过期）。
    *   API 请求转发至本地 Node.js 服务（localhost:3000）。
    *   HTML2Image 服务转发（localhost:3001）。
    *   健康检查端点 `/health`。

### 3. 开发者规范与建议

*   **环境一致性**: 由于缺乏 Docker 容器化，开发者需确保本地与生产环境的 Node.js 版本（推荐 20.x）及系统依赖一致。
*   **部署顺序**: 
    1. 运行 `server-setup/setup.sh` 初始化服务器。
    2. 导入 `database.sql`。
    3. 部署 `html2image-server` 并启动。
    4. 在微信开发者工具中上传云函数。
    5. 配置 Nginx 并重启。
*   **配置管理**: 敏感信息（如数据库密码、API Token）硬编码在脚本或配置文件中（如 `setup.sh` 中的默认密码 `Turtle@2024`），生产环境务必修改并使用环境变量或密钥管理服务。
*   **缺乏自动化测试**: `package.json` 中 `test` 脚本多为空或仅输出错误，表明项目目前缺乏自动化单元测试与集成测试流程。
