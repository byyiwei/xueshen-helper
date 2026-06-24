该仓库采用基于 JavaScript/Node.js 的通用错误处理模式，主要依赖 `try-catch` 块、统一的响应包装器以及前端 UI 提示工具。系统未定义复杂的自定义 Error 类或全局中间件，而是通过约定俗成的 `{ success, data, message }` 结构在云函数、HTTP 服务和小程序前端之间传递状态。

### 1. 核心架构与组件

*   **云函数层 (Cloud Functions)**:
    *   **统一包装器**: `cloudfunctions/common/utils.js` 提供了 `wrapAction` 和 `errorResponse`。`wrapAction` 自动捕获异步操作中的异常，并将其转换为标准的失败响应对象，防止云函数因未捕获异常而崩溃。
    *   **手动校验与抛出**: 在业务逻辑（如 `cloudfunctions/pet/index.js`）中，开发者倾向于先进行参数校验（如名称非空、数量限制），若不满足则直接 `throw new Error('具体原因')`。这些错误会被外层的 `try-catch` 捕获并返回给前端。
    *   **安全审核容错**: `cloudfunctions/common/securityChecker.js` 在处理微信内容安全接口时，对网络请求或 API 调用失败进行了内部 `try-catch` 处理，确保审核服务的波动不会直接导致主业务流程中断，而是返回特定的 `pass: false` 状态。

*   **独立 HTTP 服务 (html2image-server)**:
    *   **集中式日志**: `html2image-server/logger.js` 实现了一个简单的文件+控制台日志系统，支持 INFO/WARN/ERROR 级别。所有错误均通过 `logger.error` 记录，便于排查 Puppeteer 渲染或浏览器启动问题。
    *   **全局异常兜底**: `html2image-server/server.js` 在路由处理器 `handleRequest` 的最外层使用了 `try-catch`，确保任何未预见的服务器端错误都能返回 `500 Internal Server Error` JSON 响应，而不是让 Node.js 进程退出。
    *   **资源超时控制**: 针对浏览器启动和页面加载设置了明确的超时机制（如 `launchTimeoutMs`），超时即视为错误并抛出，防止资源死锁。

*   **小程序前端 (Miniprogram)**:
    *   **UI 反馈工具**: `miniprogram/utils/error.js` 封装了 `showError`、`showSuccess` 和 `handleError`。它将错误对象转换为适合 `wx.showToast` 显示的字符串，统一了用户界面的错误提示风格。
    *   **API 调用容错**: `miniprogram/utils/api.js` 中的 `callCloudFunction` 方法统一处理云函数调用的网络异常。如果调用失败，它会记录日志并返回包含 `useFallback: true` 标记的对象，允许业务层决定是否启用本地缓存或降级逻辑。

### 2. 关键约定与开发规范

1.  **响应结构标准化**: 所有后端接口（云函数和 HTTP 服务）必须返回包含 `success` 字段的 JSON 对象。成功时 `data` 承载结果，失败时 `message` 或 `error` 承载原因。
2.  **错误信息透传**: 在云函数中，建议直接抛出带有明确中文提示的 `Error`（如 `'宠物名称不能为空'`），这些消息会经由 `errorResponse` 透传给前端，由 `showError` 直接展示给用户。
3.  **异步操作保护**: 任何涉及数据库读写、外部 API 调用（如微信开放接口、Puppeteer 渲染）的代码块都必须包裹在 `try-catch` 中。
4.  **日志记录**: 服务端错误必须记录到日志文件（`html2image-server/logs/`）或云函数控制台。禁止静默吞掉异常（除非是预期的可选操作，如删除不存在的关联记录）。
5.  **前端降级处理**: 前端在调用 `api.js` 后，应检查 `success` 字段。若为 `false`，优先使用返回的 `message` 进行提示；若发生网络级错误，则使用兜底文案。