该项目的配置系统采用**多环境、多层级**的混合架构，针对不同模块（小程序前端、云函数后端、独立渲染服务）采用了差异化的配置策略。

### 1. 核心配置策略

*   **HTML转图服务 (html2image-server)**：实现了最完善的**三层配置加载机制**。
    *   **优先级**：环境变量 (`H2I_` 前缀) > `config.json` 文件 > 代码硬编码默认值 (`DEFAULTS`)。
    *   **特性**：支持带注释的 JSON 解析；环境变量支持嵌套键映射（如 `H2I_SERVER_PORT` 映射到 `server.port`）；配置对象在加载后被冻结 (`Object.freeze`) 以防止运行时篡改。
*   **微信小程序前端 (miniprogram)**：采用**云端动态配置 + 本地缓存兜底**的模式。
    *   **启动流程**：`app.js` 在云开发初始化后，异步从云数据库 `systemConfig` 集合读取全局配置。
    *   **降级策略**：若云端读取失败，尝试读取旧的 `system` 集合；若仍失败，则使用 `globalData` 中的硬编码默认值（如 `imageServerUrl`）。
    *   **持久化**：部分配置（如管理员设置的参数）会同步保存到 `wx.setStorageSync('systemConfig')`。
*   **云函数后端 (cloudfunctions)**：依赖**微信云开发环境配置**。
    *   **权限控制**：每个云函数根目录下的 `config.json` 用于声明 OpenAPI 权限。
    *   **业务配置**：系统级业务配置（如 COS 密钥、ASR 密钥、最大宠物数）存储在云数据库 `systemConfig` 集合中，通过 `admin` 云函数进行 CRUD 操作。
    *   **敏感信息**：管理员 OID 列表在代码中硬编码作为兜底，优先从 `admins` 集合读取。
*   **Cloudflare Worker**：使用标准的 `wrangler.toml` 进行管理。
    *   **变量管理**：非敏感变量（如默认宽高）定义在 `[vars]` 块中；敏感令牌（如 API Token）通过 `wrangler secret put` 注入环境变量。

### 2. 关键配置文件

*   `html2image-server/config.js` & `config.json`：定义了渲染服务的端口、浏览器路径、超时时间等核心参数。
*   `miniprogram/app.js`：负责前端全局配置的初始化与云端同步逻辑。
*   `miniprogram/subpkg-admin/pages/admin/config.js`：提供了管理员修改系统配置的 UI 交互与云函数调用逻辑。
*   `cloudfunctions/admin/index.js`：实现了 `getConfig` 和 `updateConfig` 接口，是业务配置的中央管理入口。
*   `cloudflare-worker/wrangler.toml`：定义了 Worker 的部署元数据与环境变量。

### 3. 开发者规范

*   **环境变量命名**：在 `html2image-server` 中，新增配置项需遵循 `H2I_` 前缀，嵌套属性使用单下划线分隔（如 `H2I_RENDERING_DEFAULT_WIDTH`）。
*   **配置同步**：前端修改 `systemConfig` 后，需注意 `app.js` 仅在启动时加载一次。若需实时生效，需在相关页面手动触发重新加载或监听全局状态变化。
*   **敏感信息处理**：严禁将腾讯云 SecretId/Key 或 Cloudflare API Token 硬编码在 Git 仓库中。生产环境应通过云开发的“环境变量”功能或 `wrangler secrets` 进行管理。
*   **JSON 注释支持**：`html2image-server` 的 `config.json` 支持 `//` 和 `/* */` 注释，修改时可保留说明文档。