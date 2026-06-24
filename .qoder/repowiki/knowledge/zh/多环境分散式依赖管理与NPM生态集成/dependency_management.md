本项目采用基于 NPM 的**分散式（Multi-root）依赖管理策略**。由于项目包含微信小程序前端、微信云函数后端、独立 Node.js 渲染服务以及 Cloudflare Worker 等多种异构运行环境，各模块独立维护 `package.json` 和锁文件，未采用 Monorepo 工具统一管理。

### 1. 核心依赖体系
- **微信云开发生态**：所有云函数（如 `pet`, `admin`, `login`）均统一依赖 `wx-server-sdk` (~2.6.3)。该版本范围经过严格测试，以确保与腾讯云开发云端运行环境的兼容性。
- **小程序前端生态**：通过 `miniprogram_npm` 机制集成第三方库。目前核心依赖为 `threejs-miniprogram` (^0.0.8)，用于实现 3D 龟缸预览等可视化功能。构建配置中通过 `packOptions.ignore` 排除无关文件以优化包体积。
- **独立渲染服务**：`html2image-server` 依赖重型库 `puppeteer` (^23.0.0) 驱动无头 Chromium。通过 `package-lock.json` 锁定底层 Chromium 版本，防止因浏览器内核升级导致的渲染差异。
- **边缘计算环境**：`cloudflare-worker` 仅将 `wrangler` (^4.95.0) 作为开发依赖 (`devDependencies`)。生产环境利用 Cloudflare 的全局运行时，实现了极小的部署包体积。

### 2. 私有/自定义 SDK 管理
- **德佟打印 SDK (`detonger`)**：作为一个独立的 NPM 包 (`lpapi-ble-wx`) 进行维护。它依赖核心逻辑库 `lpapi-ble`，并通过 Rollup 构建工具链生成适用于小程序环境的 UMD/ESM 产物。其 `publishConfig` 指向公共 registry，但在项目内部通常通过本地路径或预编译形式引入。

### 3. 版本控制与锁文件策略
- **确定性构建**：各主要模块（`miniprogram`, `html2image-server`, `cloudflare-worker`）均包含 `package-lock.json`。在 CI/CD 或多开发者协作时，必须提交并同步锁文件，以确保依赖树的完全一致。
- **引擎约束**：部分模块（如 `cloudflare-worker`）在 `package.json` 中明确指定了 `engines` 字段（如 `node >= 16.13.0`），以规避因本地开发环境与目标平台版本不匹配引发的构建错误。

### 4. 开发者规范
- **禁止跨模块手动同步版本**：由于缺乏 Workspace 支持，修改某个通用依赖版本时，需手动检查并更新所有相关模块的 `package.json`。
- **云函数依赖精简**：云函数受限于上传包体积限制，严禁在 `cloudfunctions/*` 目录下安装与业务无关的开发依赖。
- **小程序 NPM 构建**：修改 `miniprogram/package.json` 后，必须在微信开发者工具中执行“构建 npm”操作，才能将依赖同步至 `miniprogram_npm` 目录供小程序运行时加载。