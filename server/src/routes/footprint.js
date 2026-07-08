/**
 * Footprint 路由 - 足迹 CRUD
 * 对应原 footprint 云函数
 */
const express = require('express')
const router = express.Router()
const { query, getOne, insert, execute } = require('../services/db')
const { requireAuth } = require('../middleware/auth')
const { success, error, listResult } = require('../utils/response')

/** GET /api/footprints */
router.get('/', requireAuth, async (req, res) => {
  try {
    const { type, pageNum = 1, pageSize = 20 } = req.query
    const conditions = ['openid = ?']
    const params = [req.openid]

    if (type && type !== 'all') { conditions.push('type = ?'); params.push(type) }

    const where = conditions.join(' AND ')
    const offset = (parseInt(pageNum) - 1) * parseInt(pageSize)

    const [totalRow] = await query(`SELECT COUNT(*) as total FROM footprints WHERE ${where}`, params)
    const list = await query(
      `SELECT * FROM footprints WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    )

    return res.json(listResult(list.map(mapFootprint), totalRow.total, parseInt(pageNum), parseInt(pageSize)))
  } catch (err) {
    return res.json(error('获取足迹列表失败'))
  }
})

/** GET /api/footprints/:id */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const fp = await getOne('SELECT * FROM footprints WHERE id = ? AND openid = ?', [req.params.id, req.openid])
    if (!fp) return res.json(error('足迹不存在'))
    return res.json(success(mapFootprint(fp)))
  } catch (err) {
    return res.json(error('获取足迹详情失败'))
  }
})

/** POST /api/footprints */
router.post('/', requireAuth, async (req, res) => {
  try {
    const { type, url, photos, thumbnail, duration, date, time, action, petId, petName, description } = req.body

    // 图片数量限制检查
    const configRow = await getOne('SELECT config_value FROM system_config WHERE config_key = ?', ['maxFootprintImages'])
    const maxImages = parseInt(configRow?.config_value) || 9
    const photoList = photos || []
    if (photoList.length > maxImages) {
      return res.json(error(`每张足迹最多只能上传${maxImages}张图片`))
    }

    const id = await insert(
      `INSERT INTO footprints (openid, pet_id, pet_name, type, url, photos, thumbnail, duration, action, date, time, description, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [req.openid, petId || null, petName || '', type || 'image', url || '',
       JSON.stringify(photoList), thumbnail || '', parseInt(duration) || 0,
       action || '', date || null, time || null, description || null]
    )
    return res.json(success({ id }, '发布成功'))
  } catch (err) {
    console.error('[Footprint] 创建失败:', err)
    return res.json(error(err.message || '发布足迹失败'))
  }
})

/** PUT /api/footprints/:id */
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const fp = await getOne('SELECT * FROM footprints WHERE id = ? AND openid = ?', [req.params.id, req.openid])
    if (!fp) return res.json(error('足迹不存在或无权限'))

    const { type, url, photos, thumbnail, duration, date, time, action, petId, petName, description } = req.body
    const sets = [], params = []
    const add = (col, val) => { sets.push(`${col} = ?`); params.push(val) }

    if (type !== undefined) add('type', type)
    if (url !== undefined) add('url', url)
    if (photos !== undefined) add('photos', JSON.stringify(photos))
    if (thumbnail !== undefined) add('thumbnail', thumbnail)
    if (duration !== undefined) add('duration', parseInt(duration))
    if (date !== undefined) add('date', date)
    if (time !== undefined) add('time', time)
    if (action !== undefined) add('action', action)
    if (petId !== undefined) add('pet_id', petId)
    if (petName !== undefined) add('pet_name', petName)
    if (description !== undefined) add('description', description)
    // updated_at 由 ON UPDATE CURRENT_TIMESTAMP 自动维护，无需手动设置

    params.push(req.params.id)
    await execute(`UPDATE footprints SET ${sets.join(', ')} WHERE id = ?`, params)
    return res.json(success(null, '更新成功'))
  } catch (err) {
    return res.json(error('更新足迹失败'))
  }
})

/** DELETE /api/footprints/:id */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const fp = await getOne('SELECT * FROM footprints WHERE id = ? AND openid = ?', [req.params.id, req.openid])
    if (!fp) return res.json(error('足迹不存在或无权限'))
    await execute('DELETE FROM footprints WHERE id = ?', [req.params.id])
    return res.json(success(null, '删除成功'))
  } catch (err) {
    return res.json(error('删除足迹失败'))
  }
})

function mapFootprint(f) {
  if (!f) return f
  return {
    id: f.id, openid: f.openid, petId: f.pet_id, petName: f.pet_name,
    type: f.type, url: f.url, photos: parseJson(f.photos),
    thumbnail: f.thumbnail, duration: f.duration,
    action: f.action, date: f.date, time: f.time, description: f.description,
    createdAt: f.created_at, updatedAt: f.updated_at
  }
}

function parseJson(val) {
  if (!val) return []
  if (Array.isArray(val)) return val
  try { return JSON.parse(val) } catch (_) { return [] }
}

module.exports = router
