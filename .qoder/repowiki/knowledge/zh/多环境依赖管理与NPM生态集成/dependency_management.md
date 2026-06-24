本项目采用基于 NPM 的分散式依赖管理策略，针对微信小程序前端、云函数后端、独立渲染服务及蓝牙打印 SDK 等不同模块分别维护 `package.json`。核心特征如下：

### 1. 依赖声明与版本控制
- **云函数 (Cloud Functions)**：所有云函数（如 `admin`, `pet`, `security`）均统一依赖 `wx-server-sdk` (~2.6.3)，遵循微信云开发的官方推荐版本范围，确保与云端运行环境的兼容性。
- **小程序前端 (Miniprogram)**：通过 `miniprogram_npm` 目录集成第三方库，目前主要依赖 `threejs-miniprogram` (^0.0.8) 用于 3D 渲染功能。项目根目录包含 `package-lock.json` 以锁定依赖树。
- **独立服务 (Standalone Services)**：
  - `html2image-server` 依赖 `puppeteer` (^23.0.0) 实现 HTML 转图片功能，使用锁文件确保 Chromium 版本一致性。
  - `cloudflare-worker` 仅将 `wrangler` (^4.95.0) 作为开发依赖，利用 Cloudflare 的全局运行时环境，无需在生产包中携带重型依赖。

### 2. 私有/自定义 SDK 管理
- **德佟打印 SDK (`detonger`)**：作为一个独立的 NPM 包 (`lpapi-ble-wx`) 进行维护，配置了 `publishConfig` 指向公共 registry。它依赖核心库 `lpapi-ble`，并通过 Rollup 构建工具链生成适用于小程序的 UMD/ESM 产物。在小程序项目中，该 SDK 可能通过本地链接或预编译形式引入。

### 3. 构建与部署约定
- **锁文件策略**：各主要模块（`miniprogram`, `html2image-server`, `cloudflare-worker`）均包含 `package-lock.json`，确保在多开发者协作或 CI/CD 环境中依赖安装的确定性。
- **引擎约束**：`cloudflare-worker` 明确指定了 `node >= 16.13.0` 的引擎要求，以适配 Wrangler 工具的最低运行环境。
- **无全局 Monorepo 工具**：项目未采用 Lerna 或 Yarn Workspaces 等 Monorepo 管理工具，各模块独立安装依赖，简化了单个功能的部署流程，但增加了跨模块依赖同步的管理成本。