/**
 * 服务器配置 - 生产环境
 * 所有敏感信息通过环境变量注入，.env 文件不提交到 Git
 */
require('dotenv').config()

module.exports = {
  // 服务监听
  port: parseInt(process.env.PORT, 10) || 3004,
  host: process.env.HOST || '0.0.0.0',

  // 数据库
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'turtle-records',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'turtle-records',
    waitForConnections: true,
    connectionLimit: 20,
    queueLimit: 0,
    charset: 'utf8mb4',
    connectTimeout: 10000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000
  },

  // JWT 密钥（必须通过环境变量设置）
  jwt: {
    secret: process.env.JWT_SECRET,
    adminSecret: process.env.ADMIN_JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES || '30d'
  },

  // 文件上传
  upload: {
    baseDir: process.env.UPLOAD_DIR || './uploads',
    allowedTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/bmp'
    ],
    maxFileSize: 20 * 1024 * 1024 // 20MB
  },

  // 微信小程序
  wechat: {
    appId: process.env.WX_APPID,
    appSecret: process.env.WX_APPSECRET
  },

  // 邮件（可选）
  smtp_host: process.env.SMTP_HOST || '',
  smtp_port: process.env.SMTP_PORT || '465',
  smtp_secure: process.env.SMTP_SECURE !== 'false',
  smtp_user: process.env.SMTP_USER || '',
  smtp_pass: process.env.SMTP_PASS || '',
  smtp_from: process.env.SMTP_FROM || '',

  // 公开资源基础URL
  baseUrl: process.env.BASE_URL || 'https://pets.openget.cn'
}
