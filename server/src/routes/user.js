/**
 * User 路由 - 用户信息、公开名片更新
 * 对应原 login 云函数中的 updateUserInfo / updatePublicProfile
 */
const express = require('express')
const router = express.Router()
const { execute, getOne } = require('../services/db')
const { requireAuth } = require('../middleware/auth')
const { success, error } = require('../utils/response')

/**
 * PUT /api/user/profile
 * 更新昵称、头像、手机
 */
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const { nickname, avatar, phone } = req.body
    const sets = []
    const params = []

    if (nickname !== undefined) { sets.push('nickname = ?'); params.push(nickname) }
    if (avatar !== undefined) { sets.push('avatar = ?'); params.push(avatar) }
    if (phone !== undefined) { sets.push('phone = ?'); params.push(phone) }

    if (sets.length === 0) {
      return res.json(error('没有需要更新的字段'))
    }

    sets.push('updated_at = NOW()')
    params.push(req.openid)

    await execute(
      `UPDATE users SET ${sets.join(', ')} WHERE openid = ?`,
      params
    )
    return res.json(success(null, '用户信息已更新'))
  } catch (err) {
    console.error('[User] 更新失败:', err)
    return res.json(error('更新用户信息失败'))
  }
})

/**
 * PUT /api/user/public-profile
 * 更新公开名片（specialty/wechatId/region/tags/intro/cover）
 */
router.put('/public-profile', requireAuth, async (req, res) => {
  try {
    const { specialty, wechatId, wechatPublic, region, tags, intro, cover } = req.body
    const sets = []
    const params = []

    if (specialty !== undefined) { sets.push('public_specialty = ?'); params.push(specialty) }
    if (wechatId !== undefined) { sets.push('public_wechat_id = ?'); params.push(wechatId) }
    if (wechatPublic !== undefined) { sets.push('public_wechat_public = ?'); params.push(wechatPublic ? 1 : 0) }
    if (region !== undefined) { sets.push('public_region = ?'); params.push(region) }
    if (tags !== undefined) { sets.push('public_tags = ?'); params.push(JSON.stringify(Array.isArray(tags) ? tags : [])) }
    if (intro !== undefined) { sets.push('public_intro = ?'); params.push(intro) }
    if (cover !== undefined) { sets.push('public_cover = ?'); params.push(cover) }

    if (sets.length === 0) {
      return res.json(error('没有需要更新的字段'))
    }

    sets.push('updated_at = NOW()')
    params.push(req.openid)

    await execute(
      `UPDATE users SET ${sets.join(', ')} WHERE openid = ?`,
      params
    )
    return res.json(success(null, '公开名片已更新'))
  } catch (err) {
    console.error('[User] 更新公开名片失败:', err)
    return res.json(error('更新公开名片失败'))
  }
})

/**
 * GET /api/user/print-config
 * 获取用户打印配置
 */
router.get('/print-config', requireAuth, async (req, res) => {
  try {
    const row = await getOne(
      'SELECT qr_print_types, updated_at FROM user_print_config WHERE openid = ?',
      [req.openid]
    )
    if (row) {
      const types = typeof row.qr_print_types === 'string'
        ? JSON.parse(row.qr_print_types)
        : (row.qr_print_types || {})
      return res.json(success({
        qrPrintTypes: types,
        updatedAt: row.updated_at
      }))
    }
    return res.json(success({ qrPrintTypes: null }))
  } catch (err) {
    console.error('[User] 获取打印配置失败:', err)
    return res.json(error('获取打印配置失败'))
  }
})

/**
 * PUT /api/user/print-config
 * 保存用户打印配置
 */
router.put('/print-config', requireAuth, async (req, res) => {
  try {
    const { qrPrintTypes } = req.body
    if (!qrPrintTypes || typeof qrPrintTypes !== 'object') {
      return res.json(error('打印配置无效'))
    }

    const types = {
      jiaopei: qrPrintTypes.jiaopei === true,
      chandan: qrPrintTypes.chandan === true,
      chumiao: qrPrintTypes.chumiao === true,
      jiankang: qrPrintTypes.jiankang === true
    }

    const existing = await getOne(
      'SELECT id FROM user_print_config WHERE openid = ?',
      [req.openid]
    )

    if (existing) {
      await execute(
        'UPDATE user_print_config SET qr_print_types = ?, updated_at = NOW() WHERE openid = ?',
        [JSON.stringify(types), req.openid]
      )
    } else {
      await execute(
        'INSERT INTO user_print_config (openid, qr_print_types, created_at, updated_at) VALUES (?, ?, NOW(), NOW())',
        [req.openid, JSON.stringify(types)]
      )
    }

    return res.json(success(null, '打印配置已保存'))
  } catch (err) {
    console.error('[User] 保存打印配置失败:', err)
    return res.json(error('保存打印配置失败'))
  }
})

module.exports = router
