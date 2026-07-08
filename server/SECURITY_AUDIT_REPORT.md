# 后端代码安全审核报告

**审核范围**: `e:\Code\pets\server`  
**审核日期**: 2026-07-08  
**项目**: 养龟档案 (turtle-archive-server) v2.0  
**技术栈**: Express + JWT + MySQL + 微信 API

---

## 审核摘要

| 严重级别 | 数量 |
|---------|------|
| 高危    | 12   |
| 中危    | 11   |
| 低危    | 6    |
| **合计** | **29** |

**上线结论**: 存在多项高危安全问题，**不建议直接上线**，需优先修复所有高危项。

---

## 一、硬编码敏感信息 (高危)

这是本次审核中发现的最严重问题。大量生产环境密钥以明文形式硬编码在源码中，且这些文件未被 `.gitignore` 排除，会被提交到版本控制。

### 1.1 `src/config.js`

| 行号 | 问题描述 | 严重级别 |
|------|---------|---------|
| 13 | 硬编码数据库公网 IP `43.138.147.202` | 高 |
| 15 | 硬编码数据库用户名 `turtle-records` | 高 |
| 16 | 硬编码数据库密码 `199975yiwei` | 高 |
| 17 | 硬编码数据库名 `turtle-records` | 高 |
| 29 | JWT 密钥回退值 `dev-secret-key-change-in-production`（弱密钥） | 高 |
| 30 | 管理员 JWT 密钥回退值 `dev-admin-secret-key-change-in-production`（弱密钥） | 高 |
| 49 | 硬编码微信 appId `wx587a284c068dea2c` | 高 |
| 50 | 硬编码微信 appSecret `6ce4cf713b73379ce262eee1fe475320` | 高 |

### 1.2 `src/config/index.js`

| 行号 | 问题描述 | 严重级别 |
|------|---------|---------|
| 14 | 硬编码数据库用户名 `turtle-records` | 高 |
| 15 | 硬编码数据库密码 `199975yiwei` | 高 |
| 28 | 硬编码 JWT 密钥 `DBpxjbHQG3TrZhWRCpHr6iGtgsVePIqhvZKZ3edaBs4=` | 高 |
| 29 | 硬编码管理员 JWT 密钥 `turtle-admin-2024-secure-key-x9kM2vLpQr7` | 高 |
| 35 | 硬编码微信 appId `wx587a284c068dea2c` | 高 |
| 36 | 硬编码微信 appSecret `6ce4cf713b73379ce262eee1fe475320` | 高 |
| 38 | 硬编码微信消息推送 token `199975yiwei` | 高 |
| 39 | 硬编码微信 EncodingAESKey `oQrWmlgUecX17Z9JqhdyAUPpTgh8H8p5XwiBkyR8rBw` | 高 |

### 1.3 `ecosystem.config.js` (PM2 配置)

| 行号 | 问题描述 | 严重级别 |
|------|---------|---------|
| 21 | 硬编码 DB_PASSWORD `199975yiwei` | 高 |
| 23 | 硬编码 JWT_SECRET `DBpxjbHQG3TrZhWRCpHr6iGtgsVePIqhvZKZ3edaBs4=` | 高 |
| 25 | 硬编码 WECHAT_APPID `wx587a284c068dea2c` | 高 |
| 26 | 硬编码 WECHAT_APPSECRET `6ce4cf713b73379ce262eee1fe475320` | 高 |
| 28 | 硬编码 WECHAT_TOKEN `199975yiwei` | 高 |
| 29 | 硬编码 WECHAT_AES_KEY `oQrWmlgUecX17Z9JqhdyAUPpTgh8H8p5XwiBkyR8rBw` | 高 |
| 31 | 硬编码完整的 SM2 公钥 PEM | 中 |

### 1.4 `.gitignore` 缺失关键条目

`.gitignore` 文件仅排除了 `*.env` 和 `.env.*`，但**未排除**以下含密钥的文件：
- `config.js`
- `config/index.js`
- `ecosystem.config.js`

这意味着所有硬编码的密钥都会被提交到 Git 仓库，造成永久泄露风险。

**修复建议**:
1. 将所有密钥迁移到 `.env` 文件（已被 `.gitignore` 排除），配置文件仅读取 `process.env`，不设回退默认值
2. 在 `.gitignore` 中添加 `ecosystem.config.js`，或使用 `ecosystem.config.example.js` 作为模板
3. 立即轮换所有已泄露的密钥（数据库密码、JWT 密钥、微信 appSecret 等），因为它们可能已在 Git 历史中
4. 使用 `git filter-branch` 或 BFG Repo-Cleaner 清理 Git 历史中的密钥

---

## 二、CORS 配置 (高危)

### 2.1 `src/app.js`

| 行号 | 问题描述 | 严重级别 |
|------|---------|---------|
| 16 | `app.use(cors())` 无任何配置，默认 `origin: '*'`，允许任意来源跨域访问 | 高 |
| 26 | 静态文件服务手动设置 `Access-Control-Allow-Origin: '*'` | 中 |

**代码片段**:
```javascript
// app.js:16 - 允许所有来源
app.use(cors())

// app.js:21-27 - 静态文件也允许所有来源
app.use('/uploads', express.static(path.resolve(config.upload.baseDir), {
  setHeaders: (res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
  }
}))
```

**修复建议**:
```javascript
app.use(cors({
  origin: ['https://pets.openget.cn', 'https://admin.pets.openget.cn'], // 白名单
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400
}))
```
对于静态文件，由于小程序需要直接访问图片 URL，可以保留 `*`，但建议通过 Referer 校验或 CDN 配置来限制。

---

## 三、认证中间件 (高危/中危)

### 3.1 `src/middleware/auth.js`

| 行号 | 问题描述 | 严重级别 |
|------|---------|---------|
| 17 | JWT 密钥来自 `config.jwt.secret`，存在硬编码回退值 | 高 |
| 13 | `requireAuth` 认证失败返回 HTTP 200 而非 401 | 中 |
| 17 | `jwt.verify` 未指定 `algorithms` 参数，理论上存在算法混淆风险 | 中 |
| 21 | token 过期/无效返回 200 而非 401 | 中 |

**代码片段**:
```javascript
// auth.js:8-23
function requireAuth(req, res, next) {
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!token) {
    return res.json(error('请先登录'))  // 返回 200，应为 401
  }
  try {
    const decoded = jwt.verify(token, config.jwt.secret)  // 未指定 algorithms
    req.openid = decoded.openid
    next()
  } catch (err) {
    return res.json(error('登录已过期，请重新登录'))  // 返回 200，应为 401
  }
}
```

### 3.2 `src/middleware/admin-auth.js`

| 行号 | 问题描述 | 严重级别 |
|------|---------|---------|
| 22 | JWT 密钥来自 `config.jwt.adminSecret`，存在硬编码回退值 | 高 |
| 22 | `jwt.verify` 未指定 `algorithms` 参数 | 中 |

**修复建议**:
1. 在 `jwt.verify` 中显式指定算法: `jwt.verify(token, secret, { algorithms: ['HS256'] })`
2. 认证失败时返回正确的 HTTP 状态码 (401/403)
3. 密钥仅从环境变量读取，移除所有硬编码回退值

---

## 四、文件上传安全 (中危)

### 4.1 `src/middleware/upload.js`

| 行号 | 问题描述 | 严重级别 |
|------|---------|---------|
| 42 | `prefix` 来自 `req.body.prefix`，直接用于文件名拼接，未过滤路径分隔符，可能导致路径遍历 | 高 |
| 41 | 文件扩展名从 `file.originalname` 获取，未与 `allowedTypes` 交叉验证 | 中 |
| 51 | 文件类型验证仅检查 `mimetype`（可被伪造），未验证文件头 magic bytes | 中 |

**问题代码 - 路径遍历**:
```javascript
// upload.js:40-46
filename: (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase() || '.jpg'
  const prefix = req.body.prefix || 'img'  // 用户可控，未过滤
  const random = crypto.randomBytes(3).toString('hex')
  const filename = `${prefix}_${Date.now()}_${random}${ext}`
  // 若 prefix = "../../etc/cron.d/evil"，则 filename = "../../etc/cron.d/evil_123_abc.jpg"
  cb(null, filename)
}
```

**修复建议**:
```javascript
// 1. 过滤 prefix 中的危险字符
const prefix = (req.body.prefix || 'img').replace(/[^a-zA-Z0-9_-]/g, '')

// 2. 验证扩展名与 mimetype 一致
const ext = path.extname(file.originalname).toLowerCase()
const allowedExts = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/gif': '.gif', 'image/webp': '.webp', 'image/bmp': '.bmp' }
if (allowedExts[file.mimetype] !== ext) {
  return cb(new Error('文件扩展名与类型不匹配'), false)
}

// 3. 可选：使用 file-type 库检查 magic bytes
```

### 4.2 `src/routes/upload.js`

| 行号 | 问题描述 | 严重级别 |
|------|---------|---------|
| 26 | 上传响应中返回 `openid`，属于不必要的敏感信息泄露 | 低 |

---

## 五、SQL 注入 (低危 - 大部分安全)

### 5.1 整体评价

项目整体采用了参数化查询（`?` 占位符），SQL 注入风险较低。动态 WHERE 子句、SET 子句、IN 子句均使用了占位符，安全。

### 5.2 `src/routes/tank.js`

| 行号 | 问题描述 | 严重级别 |
|------|---------|---------|
| 181 | LIMIT/OFFSET 直接拼接进 SQL 字符串，虽用 `parseInt()` 缓解，但仍属不良实践 | 低 |

**问题代码**:
```javascript
// tank.js:181
const rows = await query(
  `SELECT * FROM tanks WHERE ${where} ORDER BY sort_order ASC, id ASC 
   LIMIT ${parseInt(pageSize)} OFFSET ${(parseInt(pageNum) - 1) * parseInt(pageSize)}`,
  params  // LIMIT/OFFSET 未使用占位符
)
```

对比其他路由（如 `pet.js:42`）的正确写法:
```javascript
// pet.js:42 - 正确：LIMIT/OFFSET 使用占位符
`SELECT * FROM pets p WHERE ${where} ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
[...params, parseInt(pageSize), offset]
```

### 5.3 `src/routes/admin.js`

| 行号 | 问题描述 | 严重级别 |
|------|---------|---------|
| 52-54 | ORDER BY 字段使用白名单验证 (`validSortFields`)，处理得当 | 安全 |
| 59 | `ORDER BY ${orderField} ${order}` 拼接，但字段已白名单校验，排序方向已限定 ASC/DESC | 安全 |

**修复建议**:
- `tank.js:181` 改为使用 `?` 占位符传参，与其他路由保持一致

---

## 六、错误处理 (中危)

### 6.1 `src/app.js` 全局错误处理

| 行号 | 问题描述 | 严重级别 |
|------|---------|---------|
| 59 | 直接返回 `err.message` 给客户端，可能泄露数据库错误、文件路径等内部信息 | 中 |

**问题代码**:
```javascript
// app.js:54-60
app.use((err, req, res, next) => {
  console.error('[API Error]', err)
  if (err.type === 'entity.too.large') {
    return res.json({ success: false, message: '文件大小超过限制（最大20MB）' })
  }
  // 直接把 err.message 返回给客户端
  res.status(err.status || 500).json({ success: false, message: err.message || '服务器内部错误' })
})
```

### 6.2 各路由文件返回 `err.message`

以下路由在 catch 块中将原始错误消息返回给客户端:

| 文件 | 行号 | 问题描述 | 严重级别 |
|------|------|---------|---------|
| `routes/auth.js` | 92 | `return res.json(error(err.message \|\| '登录失败'))` | 中 |
| `routes/speech.js` | 50 | `return res.json(error('语音识别失败: ' + err.message))` | 中 |
| `routes/callback.js` | 54 | `return res.json({ errcode: -1, errmsg: err.message })` | 中 |
| `routes/pet.js` | 111, 161 | 返回 `err.message` | 中 |
| `routes/qrcode.js` | 27, 51 | 返回 `err.message` | 中 |
| `routes/footprint.js` | 69 | 返回 `err.message` | 中 |
| `routes/category.js` | 33, 62 | 返回 `err.message` | 中 |
| `routes/reminder.js` | 48 | 返回 `err.message` | 中 |
| `routes/security.js` | 29 | 返回 `err.message` | 中 |

**修复建议**:
```javascript
// 全局错误处理应区分已知错误和未知错误
app.use((err, req, res, next) => {
  console.error('[API Error]', err)
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ success: false, message: '文件大小超过限制' })
  }
  // 生产环境不返回原始错误信息
  const message = process.env.NODE_ENV === 'production' 
    ? '服务器内部错误' 
    : err.message
  res.status(err.status || 500).json({ success: false, message })
})
```
各路由的 catch 块应返回固定错误提示，而非 `err.message`。

---

## 七、依赖安全 (中危)

### 7.1 已安装依赖版本

| 依赖 | 声明版本 | 安装版本 | 已知问题 | 严重级别 |
|------|---------|---------|---------|---------|
| multer | ^1.4.5-lts.1 | 1.4.5-lts.2 | CVE-2024-4068 (DoS)，建议升级到 2.x | 中 |
| express | ^4.21.0 | 4.22.2 | 依赖 path-to-regexp 0.x (CVE-2024-45296) | 中 |
| body-parser | (express 依赖) | 1.20.5 | CVE-2024-45590 (DoS) | 中 |
| cookie | (express 依赖) | 0.7.1 | CVE-2024-47764 (原型链污染)，需升级到 0.7.2+ | 中 |
| jsonwebtoken | ^9.0.2 | 9.0.3 | 当前版本相对安全 | 低 |
| nodemailer | ^6.9.0 | - | 6.x 已停止维护，建议升级到 7.x | 低 |

**修复建议**:
1. 升级 multer 到 2.x（注意 API 可能不兼容）
2. 升级 express 到 4.22.x 最新或迁移到 5.x
3. 运行 `npm audit` 检查所有已知漏洞
4. 定期执行 `npm audit fix`

---

## 八、授权缺陷 - 路由缺少认证 (高危)

这是除硬编码密钥外最严重的问题。多个数据修改路由完全没有认证。

### 8.1 `src/routes/tank.js` - 龟缸数据操作无认证

以下路由允许任何未认证用户操作龟缸数据:

| 行号 | 路由 | 问题描述 | 严重级别 |
|------|------|---------|---------|
| 340 | `GET /api/tanks/:id/water` | 无认证，任何人可查看换水记录 | 高 |
| 354 | `POST /api/tanks/:id/water` | 无认证，任何人可添加换水记录 | 高 |
| 371 | `GET /api/tanks/:id/feeding` | 无认证，任何人可查看喂食记录 | 高 |
| 385 | `POST /api/tanks/:id/feeding` | 无认证，任何人可添加喂食记录 | 高 |
| 402 | `GET /api/tanks/:id/eggs` | 无认证，任何人可查看产蛋记录 | 高 |
| 466 | `POST /api/tanks/:id/eggs` | 无认证，任何人可添加产蛋记录 | 高 |
| 445 | `GET /api/tanks/:id/hatch` | 无认证 | 高 |
| 483 | `GET /api/tanks/:id/eggs/:eggId/hatch` | 无认证 | 高 |
| 500 | `POST /api/tanks/:id/eggs/:eggId/hatch` | 无认证，任何人可添加孵化记录 | 高 |
| 517 | `GET /api/tanks/:id/reminders` | 无认证 | 高 |
| 531 | `PUT /api/tanks/:id/reminders` | 无认证，任何人可修改提醒设置 | 高 |
| 552 | `POST /api/tanks/:id/check` | 无认证，任何人可打卡 | 高 |
| 247 | `PUT /api/tanks/:id` | 有 `requireAuth` 但无所有权检查，任何登录用户可编辑任何龟缸 | 高 |
| 285 | `GET /api/tanks/:id/timeline` | 无认证 | 中 |

### 8.2 `src/routes/qrcode.js` - 完全无认证

| 行号 | 路由 | 问题描述 | 严重级别 |
|------|------|---------|---------|
| 14 | `POST /api/qrcode/generate` | 无认证，任何人可生成小程序码（消耗微信 API 配额） | 高 |
| 32 | `POST /api/qrcode/url-link` | 无认证，任何人可生成 URL Link | 高 |

**修复建议**:
1. 所有数据修改路由必须添加 `requireAuth` 中间件
2. 对于龟缸操作，如果是公共资源，至少需要登录认证；如果是私有资源，需要添加所有权检查
3. qrcode 路由添加 `requireAuth`，并考虑添加速率限制防止滥用

---

## 九、微信回调签名验证缺失 (高危)

### 9.1 `src/routes/callback.js`

| 行号 | 问题描述 | 严重级别 |
|------|---------|---------|
| 12-56 | `POST /api/callback/security` 未验证微信回调签名，任何人可伪造审核回调 | 高 |

**问题描述**: 微信内容安全审核的异步回调应包含签名验证（通过 `token` 和 `encodingAESKey` 解密消息）。当前代码直接信任 `req.body` 中的 `trace_id`、`errcode`、`result` 等字段，攻击者可以构造请求:
- 将正常图片标记为违规，触发自动删除用户图片
- 发送虚假违规通知给用户
- 清除业务数据中的图片引用

**修复建议**:
实现微信消息签名验证，参考微信官方文档:
```javascript
const crypto = require('crypto')
const { decrypt } = require('wechat-crypto') // 或类似库

router.post('/security', (req, res) => {
  const { signature, timestamp, nonce, encrypt } = req.query
  // 1. 验证签名
  const sha1 = crypto.createHash('sha1')
    .update([token, timestamp, nonce].sort().join(''))
    .digest('hex')
  if (sha1 !== signature) {
    return res.json({ errcode: -1, errmsg: 'invalid signature' })
  }
  // 2. 解密消息体
  // ...
})
```

---

## 十、其他安全问题

### 10.1 安全审核 fail-open (中危)

| 文件 | 行号 | 问题描述 | 严重级别 |
|------|------|---------|---------|
| `routes/security.js` | 41 | `check-text` 接口在微信审核 API 出错时返回 `pass: true`，即审核失败时放行内容 | 中 |

**问题代码**:
```javascript
// security.js:34-43
router.post('/check-text', requireAuth, async (req, res) => {
  try {
    const result = await msgSecCheck(req.openid, content, scene)
    return res.json(success({ pass: result.suggest === 'pass', ... }))
  } catch (err) {
    // 审核 API 出错时，直接返回 pass: true —— fail-open 设计
    return res.json(success({ pass: true, suggest: 'pass', label: '正常' }))
  }
})
```

**修复建议**: 改为 fail-close（默认拒绝）或返回"审核服务暂时不可用"提示。

### 10.2 缺少速率限制 (中危)

| 位置 | 问题描述 | 严重级别 |
|------|---------|---------|
| `routes/admin-auth.js:23` | 管理员登录无暴力破解防护 | 中 |
| `routes/admin-auth.js:75` | 忘记密码接口无速率限制，可被滥用发送大量重置邮件 | 中 |
| 全局 | 所有 API 无速率限制，易受暴力破解和 DoS 攻击 | 中 |

**修复建议**: 添加 `express-rate-limit` 中间件:
```javascript
const rateLimit = require('express-rate-limit')
const loginLimiter = rateLimit({ windowMs: 15*60*1000, max: 5 })
router.post('/login', loginLimiter, ...)
```

### 10.3 缺少安全 HTTP 头 (中危)

| 位置 | 问题描述 | 严重级别 |
|------|---------|---------|
| `app.js` | 未使用 `helmet` 等安全头中间件，缺少 `X-Content-Type-Options`、`X-Frame-Options`、`Strict-Transport-Security` 等安全头 | 中 |

**修复建议**: 添加 `helmet` 中间件:
```javascript
const helmet = require('helmet')
app.use(helmet())
```

### 10.4 数据库 Schema 不一致 (中危)

| 文件 | 问题描述 | 严重级别 |
|------|---------|---------|
| `database/schema.sql:32-39` | `admins` 表仅有 `id, openid, name, enabled, created_at` 字段，但 `admin-auth.js` 查询 `username, password, role, email, last_login_time` 等字段 | 中 |

**说明**: schema.sql 中的 admins 表结构与实际代码使用不符，说明 schema 文件未及时更新，或缺少数据库迁移脚本。上线前需确保数据库结构与代码一致。

### 10.5 JWT Token 过期时间过长 (低危)

| 文件 | 行号 | 问题描述 | 严重级别 |
|------|------|---------|---------|
| `config/index.js` | 30 | JWT 有效期 `30d`（30天），token 泄露后窗口期过长 | 低 |
| `config.js` | 31 | JWT 有效期 `7d`（7天） | 低 |

**修复建议**: 用户端 token 建议缩短到 1-7 天，配合 refresh token 机制；管理员 token 已为 12 小时（`admin-auth.js:50`），较合理。

### 10.6 两套配置文件并存 (低危)

| 文件 | 问题描述 | 严重级别 |
|------|---------|---------|
| `src/config.js` + `src/config/index.js` | 存在两个配置文件，`require('./config')` 会优先加载 `config/index.js`，`config.js` 实际未被使用，容易造成混淆 | 低 |

**修复建议**: 删除未使用的 `src/config.js`，统一使用 `src/config/index.js`。

### 10.7 敏感信息日志输出 (低危)

| 文件 | 行号 | 问题描述 | 严重级别 |
|------|------|---------|---------|
| `routes/callback.js` | 15 | `console.log('[Callback] 收到审核回调:', JSON.stringify(req.body))` 可能记录敏感信息 | 低 |
| `app.js` | 55 | `console.error('[API Error]', err)` 在生产环境输出完整错误堆栈 | 低 |

**修复建议**: 生产环境使用结构化日志库（如 winston/pino），按日志级别输出，避免记录完整请求体。

---

## 修复优先级建议

### P0 - 上线前必须修复 (阻断性)
1. **移除所有硬编码密钥**，迁移到环境变量，更新 `.gitignore`
2. **轮换所有已泄露的密钥**（数据库密码、JWT 密钥、微信 appSecret）
3. **修复 CORS 配置**，限制为已知域名白名单
4. **为 tank.js 和 qrcode.js 路由添加认证中间件**
5. **实现微信回调签名验证**

### P1 - 上线前强烈建议修复
6. 修复文件上传路径遍历漏洞（过滤 `prefix` 参数）
7. 修复错误处理，生产环境不返回 `err.message`
8. 添加速率限制（登录、密码重置等敏感接口）
9. 添加 `helmet` 安全头中间件
10. 升级有漏洞的依赖包（multer、express 相关）

### P2 - 上线后尽快修复
11. JWT 验证指定 `algorithms: ['HS256']`
12. 认证失败返回正确的 HTTP 状态码
13. 修复 `security.js` 的 fail-open 问题
14. 统一配置文件，删除冗余的 `config.js`
15. 缩短 JWT 过期时间，引入 refresh token 机制

---

*报告结束*
