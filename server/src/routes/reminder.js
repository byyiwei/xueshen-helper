/**
 * Reminder 路由 - 提醒 CRUD
 * 对应原 reminder 云函数
 */
const express = require('express')
const router = express.Router()
const { query, getOne, insert, execute } = require('../services/db')
const { requireAuth } = require('../middleware/auth')
const { success, error } = require('../utils/response')

/** GET /api/reminders?petId=xx */
router.get('/', requireAuth, async (req, res) => {
  try {
    const { petId } = req.query
    let list
    if (petId) {
      list = await query('SELECT * FROM reminders WHERE pet_id = ? AND openid = ? ORDER BY created_at ASC', [petId, req.openid])
    } else {
      list = await query('SELECT * FROM reminders WHERE openid = ? ORDER BY created_at ASC', [req.openid])
    }
    return res.json(success({ list: list.map(mapReminder) }))
  } catch (err) {
    return res.json(error('获取提醒列表失败'))
  }
})

/** POST /api/reminders */
router.post('/', requireAuth, async (req, res) => {
  try {
    const { petId, type, intervalDays, lastDone, note } = req.body
    if (!petId) return res.json(error('宠物ID不能为空'))
    if (!type) return res.json(error('提醒类型不能为空'))
    if (!intervalDays || intervalDays <= 0) return res.json(error('间隔天数不合法'))

    // 同宠物同类型不可重复
    const existing = await getOne(
      'SELECT id FROM reminders WHERE pet_id = ? AND type = ? AND openid = ?',
      [petId, type, req.openid]
    )
    if (existing) return res.json(error('该类型提醒已存在'))

    const id = await insert(
      'INSERT INTO reminders (pet_id, openid, type, interval_days, last_done, note, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
      [petId, req.openid, type, parseInt(intervalDays), lastDone || '', note || '']
    )
    return res.json(success({ id }, '添加成功'))
  } catch (err) {
    return res.json(error(err.message || '创建提醒失败'))
  }
})

/** PUT /api/reminders/:id */
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const record = await getOne('SELECT * FROM reminders WHERE id = ? AND openid = ?', [req.params.id, req.openid])
    if (!record) return res.json(error('提醒不存在或无权限'))

    const { type, intervalDays, lastDone, note } = req.body

    // 改类型时检查冲突
    if (type && type !== record.type) {
      const conflict = await getOne(
        'SELECT id FROM reminders WHERE pet_id = ? AND type = ? AND openid = ? AND id != ?',
        [record.pet_id, type, req.openid, req.params.id]
      )
      if (conflict) return res.json(error('该类型提醒已存在'))
    }

    const sets = [], params = []
    if (type !== undefined) { sets.push('type = ?'); params.push(type) }
    if (intervalDays !== undefined) { sets.push('interval_days = ?'); params.push(parseInt(intervalDays)) }
    if (lastDone !== undefined) { sets.push('last_done = ?'); params.push(lastDone) }
    if (note !== undefined) { sets.push('note = ?'); params.push(note) }
    sets.push('updated_at = NOW()')
    params.push(req.params.id)

    await execute(`UPDATE reminders SET ${sets.join(', ')} WHERE id = ?`, params)
    return res.json(success(null, '更新成功'))
  } catch (err) {
    return res.json(error('更新提醒失败'))
  }
})

/** DELETE /api/reminders/:id */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const record = await getOne('SELECT * FROM reminders WHERE id = ? AND openid = ?', [req.params.id, req.openid])
    if (!record) return res.json(error('提醒不存在或无权限'))
    await execute('DELETE FROM reminders WHERE id = ?', [req.params.id])
    return res.json(success(null, '删除成功'))
  } catch (err) {
    return res.json(error('删除提醒失败'))
  }
})

/** PUT /api/reminders/:id/done - 标记完成 */
router.put('/:id/done', requireAuth, async (req, res) => {
  try {
    const record = await getOne('SELECT * FROM reminders WHERE id = ? AND openid = ?', [req.params.id, req.openid])
    if (!record) return res.json(error('提醒不存在或无权限'))

    const { lastDone } = req.body
    if (!lastDone) return res.json(error('完成日期不能为空'))

    await execute('UPDATE reminders SET last_done = ?, updated_at = NOW() WHERE id = ?', [lastDone, req.params.id])
    return res.json(success({ id: parseInt(req.params.id), lastDone }, '已标记完成'))
  } catch (err) {
    return res.json(error('标记完成失败'))
  }
})

function mapReminder(r) {
  if (!r) return r
  return {
    id: r.id, petId: r.pet_id, openid: r.openid, type: r.type,
    intervalDays: r.interval_days, lastDone: r.last_done, note: r.note,
    createdAt: r.created_at, updatedAt: r.updated_at
  }
}

module.exports = router
