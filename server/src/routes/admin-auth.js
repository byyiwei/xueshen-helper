/**
 * Admin 认证路由 - 独立 Web 后台登录与账号管理
 * 
 * POST /api/admin/login          - 账号密码登录
 * POST /api/admin/forgot-password - 发送重置邮件
 * POST /api/admin/reset-password  - 验证令牌重置密码
 * GET  /api/admin/profile         - 获取当前管理员信息
 * PUT  /api/admin/profile         - 更新邮箱/密码
 */
const express = require('express')
const router = express.Router()
const crypto = require('crypto')
const bcrypt = require('bcryptjs')
const { getOne, insert, execute, query } = require('../services/db')
const { requireAdminAuth, signAdminToken } = require('../middleware/admin-auth')
const { sendPasswordResetEmail } = require('../services/email')
const { success, error } = require('../utils/response')

/**
 * POST /api/admin/login
 * Body: { username, password }
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body
    if (!username || !password) {
      return res.json(error('请输入账号和密码'))
    }

    const admin = await getOne(
      'SELECT id, username, password, name, role, enabled, email FROM admins WHERE username = ?',
      [username]
    )

    if (!admin) {
      return res.json(error('账号或密码错误'))
    }

    if (!admin.enabled) {
      return res.json(error('该管理员账号已被禁用'))
    }

    // 验证密码
    const passwordValid = await bcrypt.compare(password, admin.password)
    if (!passwordValid) {
      return res.json(error('账号或密码错误'))
    }

    // 更新最后登录时间
    await execute('UPDATE admins SET last_login_time = NOW() WHERE id = ?', [admin.id])

    const token = signAdminToken(admin)

    return res.json(success({
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        name: admin.name,
        role: admin.role,
        email: admin.email || ''
      }
    }, '登录成功'))
  } catch (err) {
    console.error('[AdminAuth] 登录失败:', err)
    return res.json(error('登录失败，请稍后重试'))
  }
})

/**
 * POST /api/admin/forgot-password
 * Body: { email }
 * 向绑定邮箱发送密码重置链接
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body
    if (!email) {
      return res.json(error('请输入绑定的邮箱地址'))
    }

    // 查找绑定了该邮箱的管理员
    const admin = await getOne(
      'SELECT id, username, name FROM admins WHERE email = ? AND enabled = 1',
      [email]
    )

    if (!admin) {
      // 不暴露是否存在该邮箱，统一返回提示
      return res.json(success(null, '如该邮箱已绑定管理员账号，重置链接已发送'))
    }

    // 生成随机令牌
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30分钟有效

    // 保存令牌
    await insert(
      'INSERT INTO password_reset_tokens (admin_id, token, expires_at) VALUES (?, ?, ?)',
      [admin.id, token, expiresAt]
    )

    // 发送邮件
    try {
      await sendPasswordResetEmail(email, token, admin.name || admin.username)
    } catch (emailErr) {
      console.error('[AdminAuth] 发送重置邮件失败:', emailErr)
      // 邮件发送失败，但令牌已创建，给用户提示
      return res.json(error('邮件发送失败，请联系管理员手动重置密码'))
    }

    return res.json(success(null, '重置链接已发送至您的邮箱，请在30分钟内完成重置'))
  } catch (err) {
    console.error('[AdminAuth] 忘记密码处理失败:', err)
    return res.json(error('操作失败，请稍后重试'))
  }
})

/**
 * POST /api/admin/reset-password
 * Body: { token, newPassword }
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body
    if (!token || !newPassword) {
      return res.json(error('缺少必要参数'))
    }

    if (newPassword.length < 6) {
      return res.json(error('新密码长度不能少于6位'))
    }

    // 查找有效令牌
    const resetRecord = await getOne(
      'SELECT id, admin_id, expires_at, used FROM password_reset_tokens WHERE token = ?',
      [token]
    )

    if (!resetRecord) {
      return res.json(error('无效的重置链接'))
    }

    if (resetRecord.used) {
      return res.json(error('该重置链接已被使用'))
    }

    if (new Date() > new Date(resetRecord.expires_at)) {
      return res.json(error('重置链接已过期，请重新申请'))
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // 更新密码并标记令牌已使用
    await execute('UPDATE admins SET password = ? WHERE id = ?', [hashedPassword, resetRecord.admin_id])
    await execute('UPDATE password_reset_tokens SET used = 1 WHERE id = ?', [resetRecord.id])

    return res.json(success(null, '密码重置成功，请使用新密码登录'))
  } catch (err) {
    console.error('[AdminAuth] 重置密码失败:', err)
    return res.json(error('重置密码失败，请稍后重试'))
  }
})

/**
 * GET /api/admin/profile
 * 获取当前管理员信息
 */
router.get('/profile', requireAdminAuth, async (req, res) => {
  try {
    const admin = await getOne(
      'SELECT id, username, name, role, email, last_login_time, created_at FROM admins WHERE id = ?',
      [req.adminId]
    )
    if (!admin) {
      return res.json(error('管理员不存在'))
    }
    return res.json(success(admin))
  } catch (err) {
    return res.json(error('获取信息失败'))
  }
})

/**
 * PUT /api/admin/profile
 * Body: { email, name, oldPassword, newPassword }
 * 更新邮箱、显示名称、修改密码
 */
router.put('/profile', requireAdminAuth, async (req, res) => {
  try {
    const { email, name, oldPassword, newPassword } = req.body

    // 更新邮箱
    if (email !== undefined) {
      // 检查邮箱是否已被其他管理员绑定
      const existing = await getOne(
        'SELECT id FROM admins WHERE email = ? AND id != ?',
        [email || null, req.adminId]
      )
      if (existing) {
        return res.json(error('该邮箱已被其他管理员绑定'))
      }
      await execute('UPDATE admins SET email = ? WHERE id = ?', [email || null, req.adminId])
    }

    // 更新显示名称
    if (name !== undefined && name.trim()) {
      await execute('UPDATE admins SET name = ? WHERE id = ?', [name.trim(), req.adminId])
    }

    // 修改密码
    if (oldPassword && newPassword) {
      if (newPassword.length < 6) {
        return res.json(error('新密码长度不能少于6位'))
      }

      const admin = await getOne('SELECT password FROM admins WHERE id = ?', [req.adminId])
      const valid = await bcrypt.compare(oldPassword, admin.password)
      if (!valid) {
        return res.json(error('原密码错误'))
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12)
      await execute('UPDATE admins SET password = ? WHERE id = ?', [hashedPassword, req.adminId])
    }

    // 返回更新后的信息
    const updated = await getOne(
      'SELECT id, username, name, role, email, last_login_time FROM admins WHERE id = ?',
      [req.adminId]
    )
    return res.json(success(updated, '更新成功'))
  } catch (err) {
    console.error('[AdminAuth] 更新信息失败:', err)
    return res.json(error('更新失败，请稍后重试'))
  }
})

// ─── SMTP 邮箱配置 ───

/**
 * GET /api/admin/smtp-config
 * 获取 SMTP 发件邮箱配置
 */
router.get('/smtp-config', requireAdminAuth, async (req, res) => {
  try {
    const rows = await query("SELECT config_key, config_value FROM system_config WHERE config_key LIKE 'smtp_%'")
    const config = {}
    rows.forEach(r => { config[r.config_key] = r.config_value })
    return res.json(success({
      host: config.smtp_host || '',
      port: config.smtp_port || '465',
      secure: config.smtp_secure !== 'false',
      user: config.smtp_user || '',
      pass: config.smtp_pass || '',
      from: config.smtp_from || ''
    }))
  } catch (err) {
    console.error('[SMTP] 获取配置失败:', err)
    return res.json(error('获取邮箱配置失败'))
  }
})

/**
 * PUT /api/admin/smtp-config
 * Body: { host, port, secure, user, pass, from }
 * 保存 SMTP 发件邮箱配置
 */
router.put('/smtp-config', requireAdminAuth, async (req, res) => {
  try {
    const { host, port, secure, user, pass, from } = req.body

    const fields = {
      smtp_host: host || '',
      smtp_port: String(port || '465'),
      smtp_secure: secure ? 'true' : 'false',
      smtp_user: user || '',
      smtp_pass: pass || '',
      smtp_from: from || user || ''
    }

    for (const [key, value] of Object.entries(fields)) {
      const existing = await getOne('SELECT id FROM system_config WHERE config_key = ?', [key])
      if (existing) {
        await execute(
          'UPDATE system_config SET config_value = ?, updated_by = ?, updated_at = NOW() WHERE config_key = ?',
          [value, req.adminUsername, key]
        )
      } else {
        await insert(
          'INSERT INTO system_config (config_key, config_value, updated_by, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
          [key, value, req.adminUsername]
        )
      }
    }

    return res.json(success(null, '邮箱配置已保存'))
  } catch (err) {
    console.error('[SMTP] 保存配置失败:', err)
    return res.json(error('保存邮箱配置失败'))
  }
})

module.exports = router
