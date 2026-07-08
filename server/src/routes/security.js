/**
 * Security 路由 - 内容安全审核、违规通知
 * 对应原 security 云函数
 */
const express = require('express')
const router = express.Router()
const { query, getOne, insert, execute } = require('../services/db')
const { requireAuth } = require('../middleware/auth')
const { msgSecCheck, mediaCheckAsync } = require('../services/wechat')
const { getPublicUrl } = require('../middleware/upload')
const { success, error } = require('../utils/response')

/** POST /api/security/check-image */
router.post('/check-image', requireAuth, async (req, res) => {
  try {
    const { filePath, scene = 'pet', bizId = '' } = req.body
    if (!filePath) return res.json(error('缺少图片路径'))
    const sceneMap = { avatar: 1, cover: 1, pet: 1, footprint: 4, comment: 2 }
    const sceneValue = sceneMap[scene] || 1
    const publicUrl = getPublicUrl(filePath)

    const result = await mediaCheckAsync(req.openid, publicUrl, sceneValue)
    await insert(
      `INSERT INTO security_logs (file_id, scene, scene_tag, biz_id, openid, trace_id, status, created_at) VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())`,
      [filePath, sceneValue, scene, bizId, req.openid, result.trace_id || '']
    )
    return res.json(success({ trace_id: result.trace_id, suggest: 'pending' }, '已提交审核'))
  } catch (err) {
    return res.json(error(err.message || '审核提交失败'))
  }
})

/** POST /api/security/check-text */
router.post('/check-text', requireAuth, async (req, res) => {
  try {
    const { content, scene = 2 } = req.body
    if (!content) return res.json(success({ pass: true }))
    const result = await msgSecCheck(req.openid, content, scene)
    return res.json(success({ pass: result.suggest === 'pass', suggest: result.suggest, label: result.label }))
  } catch (err) {
    return res.json(success({ pass: true, suggest: 'pass', label: '正常' }))
  }
})

/** GET /api/security/notifications/unread */
router.get('/notifications/unread', requireAuth, async (req, res) => {
  try {
    const list = await query('SELECT * FROM notifications WHERE openid = ? AND is_read = 0 ORDER BY created_at DESC LIMIT 20', [req.openid])
    return res.json(success({ list: list.map(mapNotif), total: list.length }))
  } catch (err) {
    return res.json(error('获取通知失败'))
  }
})

/** PUT /api/security/notifications/:id/read */
router.put('/notifications/:id/read', requireAuth, async (req, res) => {
  try {
    const n = await getOne('SELECT * FROM notifications WHERE id = ? AND openid = ?', [req.params.id, req.openid])
    if (!n) return res.json(error('通知不存在'))
    await execute('UPDATE notifications SET is_read = 1, read_at = NOW() WHERE id = ?', [req.params.id])
    return res.json(success(null))
  } catch (err) {
    return res.json(error('标记已读失败'))
  }
})

/** PUT /api/security/notifications/read-all */
router.put('/notifications/read-all', requireAuth, async (req, res) => {
  try {
    await execute('UPDATE notifications SET is_read = 1, read_at = NOW() WHERE openid = ? AND is_read = 0', [req.openid])
    return res.json(success(null))
  } catch (err) {
    return res.json(error('全部已读失败'))
  }
})

/** GET /api/security/pending */
router.get('/pending', requireAuth, async (req, res) => {
  try {
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000)
    const list = await query('SELECT * FROM security_logs WHERE openid = ? AND status = ? ORDER BY created_at ASC LIMIT 20', [req.openid, 'pending'])
    const timeoutList = list.filter(item => item.created_at && new Date(item.created_at) < tenMinAgo)
      .map(item => ({ id: item.id, fileID: item.file_id, scene: item.scene_tag, bizId: item.biz_id, createTime: item.created_at, status: 'timeout' }))
    for (const item of timeoutList) {
      await execute('UPDATE security_logs SET status = ? WHERE id = ?', ['timeout', item.id]).catch(() => {})
    }
    return res.json(success({ pending: timeoutList, count: timeoutList.length }))
  } catch (err) {
    return res.json(error('获取待审核记录失败'))
  }
})

function mapNotif(n) { return { id: n.id, type: n.type, title: n.title, content: n.content, scene: n.scene, suggest: n.suggest, label: n.label, traceId: n.trace_id, fileID: n.file_id, isRead: !!n.is_read, createdAt: n.created_at } }

module.exports = router
