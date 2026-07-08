/**
 * 邮件发送服务
 * 用于管理员密码找回、邮箱验证等场景
 * SMTP 配置优先从数据库 system_config 读取，无配置时回退到环境变量
 */
const nodemailer = require('nodemailer')

/**
 * 从数据库获取 SMTP 配置
 * @returns {object|null} SMTP 配置或 null（需回退环境变量）
 */
async function getSmtpConfigFromDb() {
  try {
    const { getPool } = require('../services/db')
    const pool = getPool()
    const [rows] = await pool.query(
      "SELECT config_key, config_value FROM system_config WHERE config_key LIKE 'smtp_%'"
    )
    const config = {}
    rows.forEach(r => { config[r.config_key] = r.config_value })

    // 必须有 host 和 user 才算有效配置
    if (config.smtp_host && config.smtp_user) {
      return {
        host: config.smtp_host,
        port: parseInt(config.smtp_port, 10) || 465,
        secure: config.smtp_secure !== 'false',
        auth: {
          user: config.smtp_user,
          pass: config.smtp_pass || ''
        },
        from: config.smtp_from || config.smtp_user
      }
    }
    return null
  } catch (err) {
    console.error('[Email] 从数据库读取SMTP配置失败:', err.message)
    return null
  }
}

/**
 * 获取 SMTP 配置（数据库优先，环境变量兜底）
 */
async function loadSmtpConfig() {
  // 优先尝试数据库配置
  const dbConfig = await getSmtpConfigFromDb()
  if (dbConfig) {
    return dbConfig
  }

  // 回退到环境变量
  return {
    host: process.env.SMTP_HOST || 'smtp.qq.com',
    port: parseInt(process.env.SMTP_PORT, 10) || 465,
    secure: process.env.SMTP_SECURE !== 'false',
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || ''
    },
    from: process.env.SMTP_FROM || process.env.SMTP_USER || ''
  }
}

/**
 * 发送密码重置邮件
 * @param {string} to - 收件人邮箱
 * @param {string} token - 重置令牌
 * @param {string} username - 管理员用户名
 */
async function sendPasswordResetEmail(to, token, username) {
  const resetUrl = `${process.env.ADMIN_BASE_URL || 'https://pets.openget.cn/admin'}/reset-password?token=${token}`

  const html = `
    <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;">
      <h2 style="color:#3A7CFF;">养龟档案 - 密码重置</h2>
      <p>管理员 <strong>${username}</strong>，您好：</p>
      <p>您正在请求重置管理后台的登录密码。请点击下方按钮完成重置：</p>
      <div style="text-align:center;margin:30px 0;">
        <a href="${resetUrl}" 
           style="background:#3A7CFF;color:#fff;padding:12px 32px;border-radius:6px;
                  text-decoration:none;font-size:16px;display:inline-block;">
          重置密码
        </a>
      </div>
      <p style="color:#94A3B8;font-size:13px;">此链接有效期为 30 分钟。如非本人操作，请忽略此邮件。</p>
      <hr style="border:none;border-top:1px solid #E5E7EB;margin:24px 0;">
      <p style="color:#94A3B8;font-size:12px;">养龟档案管理系统</p>
    </div>
  `

  const smtp = await loadSmtpConfig()
  if (!smtp.auth.user) {
    throw new Error('SMTP 邮箱未配置，请在管理后台→个人设置中配置发件邮箱')
  }

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: smtp.auth
  })

  await transporter.sendMail({
    from: smtp.from,
    to,
    subject: '养龟档案管理后台 - 密码重置',
    html
  })
}

/**
 * 药品上报处理完成通知邮件
 */
async function sendMedicineReportReply(to, medicineName) {
  const html = `
    <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;">
      <h2 style="color:#E8A400;">养龟档案 - 药品上报处理结果</h2>
      <p>您好：</p>
      <p>您上报的药品 <strong>${medicineName}</strong> 已添加到药品库，现在可以在小程序的"疾病防治"中查看和使用用药计算器了。</p>
      <p>感谢您的支持，让我们共同完善龟龟用药数据库！</p>
      <hr style="border:none;border-top:1px solid #E5E7EB;margin:24px 0;">
      <p style="color:#94A3B8;font-size:12px;">养龟档案管理系统</p>
    </div>
  `

  const smtp = await loadSmtpConfig()
  if (!smtp.auth.user) {
    throw new Error('SMTP 邮箱未配置')
  }

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: smtp.auth
  })

  await transporter.sendMail({
    from: smtp.from,
    to,
    subject: '您上报的药品已添加到药品库',
    html
  })
}

module.exports = { sendPasswordResetEmail, sendMedicineReportReply }
