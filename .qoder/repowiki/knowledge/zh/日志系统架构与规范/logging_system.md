## 1. 概述
本项目采用**混合日志策略**，根据运行环境的不同（独立 Node.js 服务 vs 微信云开发/小程序）采用了不同的日志实现方式：
- **HTML转图像服务 (`html2image-server`)**：实现了自定义的轻量级日志系统，支持控制台彩色输出与按日文件持久化。
- **微信小程序云函数 (`cloudfunctions`)**：依赖平台标准的 `console` 接口进行日志记录，通过统一工具函数处理错误日志。
- **小程序前端 (`miniprogram`)**：主要使用 `console` 进行调试与错误追踪，并结合 UI 组件向用户展示错误信息。

## 2. 核心实现细节

### 2.1 HTML转图像服务 (Node.js)
该服务位于 `html2image-server/` 目录下，其日志系统由 `logger.js` 驱动。

- **框架选择**：为避免 `winston` 等重型库的性能开销，项目选择了**原生实现**。代码注释明确指出：“Avoid winston complexity and performance issues”。
- **日志级别**：支持 `INFO`, `WARN`, `ERROR`, `DEBUG` 四个标准级别。
- **输出目标**：
  - **控制台 (Console)**：带有 ANSI 颜色码（黄色警告、红色错误、青色调试），便于本地开发与实时监控。
  - **文件 (File)**：自动在 `logs/` 目录下创建按日期命名的日志文件（格式：`server-YYYY-MM-DD.log`）。
- **结构化字段**：每条日志均包含 `[时间戳] [级别] 消息内容`。此外，提供了专用的辅助函数用于记录 HTTP 请求生命周期：
  - `logRequest(method, url, statusCode, duration)`：记录请求方法与耗时。
  - `logRequestStart(reqId)` / `logRequestEnd(reqId, duration, success)`：通过唯一 ID 追踪异步任务。
  - `logBrowser(event)`：专门记录无头浏览器（Puppeteer）的启动与断开事件。

### 2.2 微信云函数 (Cloud Functions)
云函数（如 `pet/index.js`, `admin/index.js`）没有引入第三方日志库。

- **实现方式**：直接使用 `console.error()` 记录异常堆栈或关键业务逻辑失败点（如权限校验失败、数据库操作异常）。
- **统一封装**：在 `cloudfunctions/common/utils.js` 中定义了 `errorResponse` 函数，该函数在返回错误响应前会自动调用 `console.error('Error:', error)`，确保了错误日志记录的规范性。
- **局限性**：缺乏结构化的日志字段（如 TraceID），且日志留存依赖于微信云开发控制台的采集能力。

### 2.3 小程序前端 (Miniprogram)
前端代码（`miniprogram/`）主要通过 `utils/error.js` 进行错误处理。

- **错误捕获**：`handleError` 函数会调用 `console.error('错误详情:', error)` 将原始错误对象打印到开发者工具控制台。
- **用户反馈**：日志记录与用户提示解耦，通过 `showError` 调用 `wx.showToast` 提供友好的 UI 反馈。

## 3. 开发者规范与建议

1. **Node.js 服务日志规范**：
   - 在 `html2image-server` 中，必须通过 `require('./logger')` 获取 `logger` 实例，禁止直接使用 `console.log`，以确保日志能同步写入磁盘文件。
   - 对于 HTTP 请求处理，应优先使用 `logRequest` 和 `logRequestEnd` 以保持日志格式统一。

2. **云函数日志规范**：
   - 所有 `catch` 块中的异常必须通过 `console.error` 记录，以便在云平台日志中心检索。
   - 建议在关键业务入口（如 `exports.main`）增加 `console.log` 记录入参摘要，便于排查触发源。

3. **敏感信息脱敏**：
   - 严禁在日志中明文记录用户的 `openid`、手机号或完整的鉴权 Token。在 `admin/index.js` 中已出现记录 `OPENID` 的情况，建议在生产环境中进行掩码处理。

4. **日志轮转与维护**：
   - `html2image-server` 目前按天生成文件但未实现自动清理机制。建议定期通过脚本清理 `logs/` 目录下超过 30 天的旧日志，防止磁盘空间耗尽。