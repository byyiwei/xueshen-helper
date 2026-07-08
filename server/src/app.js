/**
 * 养龟档案 v2.0 - 自建服务器 REST API 入口
 * Express + JWT + MySQL + 微信 API
 */
const express = require('express')
const cors = require('cors')
const path = require('path')
const config = require('./config')
const { requireAuth, optionalAuth } = require('./middleware/auth')
const { uploadSingle } = require('./middleware/upload')
const { getPool } = require('./services/db')

const app = express()

// ─── 全局中间件 ───
app.use(cors({
  origin: (origin, callback) => {
    // 允许小程序请求（无 origin 头）和指定域名
    const allowed = ['https://pets.openget.cn', 'https://servicewechat.com']
    if (!origin || allowed.includes(origin)) {
      callback(null, true)
    } else {
      callback(null, true) // 生产环境可改为 callback(new Error('Not allowed'))
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400
}))
app.use(express.json({ limit: '20mb' }))
app.use(express.urlencoded({ extended: true, limit: '20mb' }))

// 静态文件服务（图片）
app.use('/uploads', express.static(path.resolve(config.upload.baseDir), {
  maxAge: '30d',
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'public, immutable')
    res.setHeader('Access-Control-Allow-Origin', '*')
  }
}))

// ─── 路由挂载 ───
app.use('/api/auth', require('./routes/auth'))
app.use('/api/user', require('./routes/user'))
app.use('/api/pets', require('./routes/pet'))
app.use('/api/records', require('./routes/record'))
app.use('/api/reminders', require('./routes/reminder'))
app.use('/api/footprints', require('./routes/footprint'))
app.use('/api/admin', require('./routes/admin-auth'))
app.use('/api/admin', require('./routes/admin'))
app.use('/api/qrcode', require('./routes/qrcode'))
app.use('/api/security', require('./routes/security'))
app.use('/api/speech', require('./routes/speech'))
app.use('/api/upload', require('./routes/upload'))
app.use('/api/callback', require('./routes/callback'))
app.use('/api/categories', require('./routes/category'))
app.use('/api/medicines', require('./routes/medicine'))
app.use('/api/medicine-reports', require('./routes/medicine-report'))
app.use('/api/tanks', require('./routes/tank'))

// ─── 健康检查 ───
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: '养龟档案 API 运行中', version: '2.0.0' })
})

// ─── 全局错误处理 ───
app.use((err, req, res, next) => {
  console.error('[API Error]', err)
  if (err.type === 'entity.too.large') {
    return res.json({ success: false, message: '文件大小超过限制（最大20MB）' })
  }
  res.status(err.status || 500).json({ success: false, message: err.message || '服务器内部错误' })
})

// ─── 启动服务 ───
const PORT = config.port
app.listen(PORT, config.host, () => {
  console.log(`✅ 养龟档案 API 服务已启动`)
  console.log(`   公网地址: ${config.baseUrl}/api/health`)
  console.log(`   内网监听: http://${config.host}:${PORT}`)

  // 预热数据库连接池，消除首次请求冷启动延迟
  const pool = getPool()
  pool.query('SELECT 1').then(() => {
    console.log('   数据库连接池预热完成')
  }).catch(err => {
    console.warn('   数据库连接池预热失败:', err.message)
  })

  // 启动龟缸提醒定时任务
  try {
    const tankReminderCron = require('./cron/tank-reminder-cron')
    tankReminderCron.start()
  } catch (err) {
    console.warn('[App] 龟缸提醒定时任务启动失败:', err.message)
  }
})

module.exports = app
