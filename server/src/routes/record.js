/**
 * Record 路由 - 记录 CRUD、QR 缓存
 * 对应原 record 云函数
 */
const express = require('express')
const router = express.Router()
const { query, getOne, insert, execute } = require('../services/db')
const { requireAuth } = require('../middleware/auth')
const { success, error, listResult } = require('../utils/response')

/** GET /api/records - 列表（按 petId/type 筛选，分页） */
router.get('/', requireAuth, async (req, res) => {
  try {
    const { petId, type, pageNum = 1, pageSize = 20 } = req.query
    const conditions = ['r.openid = ?']
    const params = [req.openid]

    if (petId) { conditions.push('r.pet_id = ?'); params.push(petId) }
    if (type && type !== '全部') { conditions.push('r.type = ?'); params.push(type) }

    const where = conditions.join(' AND ')
    const offset = (parseInt(pageNum) - 1) * parseInt(pageSize)

    const [totalRow] = await query(`SELECT COUNT(*) as total FROM records r WHERE ${where}`, params)
    const list = await query(
      `SELECT * FROM records r WHERE ${where} ORDER BY r.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    )

    return res.json(listResult(list.map(mapRecord), totalRow.total, parseInt(pageNum), parseInt(pageSize)))
  } catch (err) {
    return res.json(error('获取记录列表失败'))
  }
})

/** GET /api/records/:id */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const record = await getOne('SELECT * FROM records WHERE id = ? AND openid = ?', [req.params.id, req.openid])
    if (!record) return res.json(error('记录不存在'))
    return res.json(success(mapRecord(record)))
  } catch (err) {
    return res.json(error('获取记录详情失败'))
  }
})

/** POST /api/records */
router.post('/', requireAuth, async (req, res) => {
  try {
    const { petId, type, text, date, time, photos, eggCount, fertilizedCount, hatchCount, gradeACount, defectCount, partnerId, partnerName } = req.body

    if (!petId) return res.json(error('宠物ID不能为空'))

    const id = await insert(
      `INSERT INTO records (pet_id, openid, type, text, date, time, photos, egg_count, fertilized_count, hatch_count, grade_a_count, defect_count, partner_id, partner_name, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        petId, req.openid, type || '日常', text || null, date || null, time || null,
        photos ? JSON.stringify(photos) : null,
        parseInt(eggCount) || 0, parseInt(fertilizedCount) || 0,
        parseInt(hatchCount) || 0, parseInt(gradeACount) || 0, parseInt(defectCount) || 0,
        partnerId || null, partnerName || ''
      ]
    )
    return res.json(success({ id }, '创建成功'))
  } catch (err) {
    console.error('[Record] 创建失败:', err)
    return res.json(error('创建记录失败'))
  }
})

/** PUT /api/records/:id */
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const record = await getOne('SELECT * FROM records WHERE id = ? AND openid = ?', [req.params.id, req.openid])
    if (!record) return res.json(error('记录不存在或无权限'))

    const { type, text, date, time, photos, eggCount, fertilizedCount, hatchCount, gradeACount, defectCount, partnerId, partnerName } = req.body
    const sets = [], params = []
    const add = (col, val) => { sets.push(`${col} = ?`); params.push(val) }

    if (type !== undefined) add('type', type)
    if (text !== undefined) add('text', text)
    if (date !== undefined) add('date', date)
    if (time !== undefined) add('time', time)
    if (photos !== undefined) add('photos', JSON.stringify(photos))
    if (eggCount !== undefined) add('egg_count', parseInt(eggCount))
    if (fertilizedCount !== undefined) add('fertilized_count', parseInt(fertilizedCount))
    if (hatchCount !== undefined) add('hatch_count', parseInt(hatchCount))
    if (gradeACount !== undefined) add('grade_a_count', parseInt(gradeACount))
    if (defectCount !== undefined) add('defect_count', parseInt(defectCount))
    if (partnerId !== undefined) add('partner_id', partnerId)
    if (partnerName !== undefined) add('partner_name', partnerName)
    // updated_at 由 ON UPDATE CURRENT_TIMESTAMP 自动维护，无需手动设置

    params.push(req.params.id)
    await execute(`UPDATE records SET ${sets.join(', ')} WHERE id = ?`, params)
    return res.json(success(null, '更新成功'))
  } catch (err) {
    return res.json(error('更新记录失败'))
  }
})

/** DELETE /api/records/:id */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const record = await getOne('SELECT * FROM records WHERE id = ? AND openid = ?', [req.params.id, req.openid])
    if (!record) return res.json(error('记录不存在或无权限'))
    await execute('DELETE FROM records WHERE id = ?', [req.params.id])
    return res.json(success(null, '删除成功'))
  } catch (err) {
    return res.json(error('删除记录失败'))
  }
})

/** PUT /api/records/:id/qrcode - 更新 QR 缓存 */
router.put('/:id/qrcode', requireAuth, async (req, res) => {
  try {
    const { qrBase64, urlLink } = req.body
    const record = await getOne('SELECT * FROM records WHERE id = ? AND openid = ?', [req.params.id, req.openid])
    if (!record) return res.json(error('记录不存在或无权限'))
    await execute(
      'UPDATE records SET qr_base64 = ?, url_link = ?, updated_at = NOW() WHERE id = ?',
      [qrBase64 || '', urlLink || '', req.params.id]
    )
    return res.json(success(null, 'QR缓存已更新'))
  } catch (err) {
    return res.json(error('更新QR缓存失败'))
  }
})

function mapRecord(r) {
  if (!r) return r
  return {
    id: r.id, petId: r.pet_id, openid: r.openid, type: r.type,
    text: r.text, date: r.date, time: r.time,
    photos: parseJson(r.photos),
    eggCount: r.egg_count, fertilizedCount: r.fertilized_count,
    hatchCount: r.hatch_count, gradeACount: r.grade_a_count, defectCount: r.defect_count,
    partnerId: r.partner_id, partnerName: r.partner_name,
    qrBase64: r.qr_base64, urlLink: r.url_link,
    createdAt: r.created_at, updatedAt: r.updated_at
  }
}

function parseJson(val) {
  if (!val) return []
  if (Array.isArray(val)) return val
  try { return JSON.parse(val) } catch (_) { return [] }
}

module.exports = router
