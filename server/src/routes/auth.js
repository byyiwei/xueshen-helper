/**
 * Auth 路由 - 登录、管理员检查
 * 对应原 login 云函数
 */
const express = require('express')
const router = express.Router()
const { query, getOne, insert } = require('../services/db')
const { code2Session } = require('../services/wechat')
const { requireAuth, signToken } = require('../middleware/auth')
const { success, error } = require('../utils/response')

/**
 * POST /api/auth/login
 * 微信登录: code2Session → 查/建用户 → 签发 JWT → 返回 token + userInfo
 */
router.post('/login', async (req, res) => {
  try {
    const { code } = req.body
    if (!code) {
      return res.json(error('缺少登录凭证(code)'))
    }

    // 1. 用 code 换取 openid
    const wxSession = await code2Session(code)
    const openid = wxSession.openid
    if (!openid) {
      return res.json(error('获取用户信息失败'))
    }

    // 2. 查询用户是否存在
    let user = await getOne('SELECT * FROM users WHERE openid = ?', [openid])

    // 3. 新用户自动注册
    if (!user) {
      // 检查是否允许注册
      const config = await getOne('SELECT config_value FROM system_config WHERE config_key = ?', ['allowRegister'])
      const allowRegister = config ? config.config_value !== 'false' : true
      if (!allowRegister) {
        return res.json(error('当前系统已关闭新用户注册'))
      }

      // 检查是否被封禁
      const banned = await getOne('SELECT id FROM banned_users WHERE openid = ?', [openid])
      if (banned) {
        return res.json(error('您的账号已被封禁'))
      }

      const userId = await insert(
        'INSERT INTO users (openid, nickname, avatar, phone, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
        [openid, '', '', '']
      )
      user = await getOne('SELECT * FROM users WHERE id = ?', [userId])
    } else {
      // 检查封禁状态
      if (user.status === '封禁') {
        return res.json(error('您的账号已被封禁'))
      }
    }

    // 4. 签发 JWT（存储 openid）
    const token = signToken(openid)

    // 5. 检查是否为管理员
    const admin = await getOne(
      'SELECT id FROM admins WHERE openid = ? AND enabled = 1',
      [openid]
    )

    return res.json(success({
      token,
      openid,
      user: {
        id: user.id,
        nickname: user.nickname || '',
        avatar: user.avatar || '',
        phone: user.phone || '',
        publicSpecialty: user.public_specialty || '',
        publicWechatId: user.public_wechat_id || '',
        publicWechatPublic: !!user.public_wechat_public,
        publicRegion: user.public_region || '',
        publicTags: user.public_tags || [],
        publicIntro: user.public_intro || '',
        publicCover: user.public_cover || '',
        status: user.status,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      },
      isAdmin: !!admin
    }, '登录成功'))
  } catch (err) {
    console.error('[Auth] 登录失败:', err)
    return res.json(error(err.message || '登录失败'))
  }
})

/**
 * POST /api/auth/check-admin
 * 检查当前用户是否为管理员（需登录）
 */
router.post('/check-admin', requireAuth, async (req, res) => {
  try {
    const admin = await getOne(
      'SELECT id, name FROM admins WHERE openid = ? AND enabled = 1',
      [req.openid]
    )
    return res.json(success({
      isAdmin: !!admin,
      adminName: admin ? admin.name : null
    }))
  } catch (err) {
    return res.json(error('管理员检查失败'))
  }
})

module.exports = router
