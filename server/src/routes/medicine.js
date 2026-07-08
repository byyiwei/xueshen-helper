/**
 * 药品管理路由
 * - 公开接口: GET /api/medicines
 * - 管理接口: /api/admin/medicines (CRUD + 批量操作)
 */
const express = require('express')
const router = express.Router()
const { query, getOne, insert, execute } = require('../services/db')
const { requireAdminAuth } = require('../middleware/admin-auth')
const { success, error } = require('../utils/response')
const { uploadSingle, getRelativePath, getPublicUrl } = require('../middleware/upload')

// ==================== 公开接口 ====================

/** GET /api/medicines - 小程序拉取药品列表 */
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query
    const conditions = ['enabled = 1']
    const params = []

    if (category) {
      conditions.push('category = ?')
      params.push(category)
    }
    if (search) {
      conditions.push('(name LIKE ? OR indications LIKE ?)')
      params.push(`%${search}%`, `%${search}%`)
    }

    const where = `WHERE ${conditions.join(' AND ')}`
    const rows = await query(
      `SELECT id, name, category, indications, form, notes, image, usage_dosages FROM medicines ${where} ORDER BY sort_order ASC, id ASC`,
      params
    )

    // 解析 JSON 字段
    const list = rows.map(r => ({
      id: r.id,
      name: r.name,
      category: r.category,
      indications: r.indications,
      form: r.form,
      notes: r.notes,
      image: r.image || '',
      usageDosages: parseJson(r.usage_dosages)
    }))

    return res.json(success(list))
  } catch (err) {
    console.error('[Medicine] GET /api/medicines error:', err)
    return res.json(error('获取药品列表失败'))
  }
})

// ==================== 管理接口（需管理员登录） ====================

router.use('/admin', requireAdminAuth)

/** GET /api/admin/medicines - 分页列表 */
router.get('/admin', async (req, res) => {
  try {
    const { search, category, page = 1, pageSize = 20 } = req.query
    const conditions = []; const params = []

    if (search) {
      conditions.push('(name LIKE ? OR indications LIKE ?)')
      params.push(`%${search}%`, `%${search}%`)
    }
    if (category) {
      conditions.push('category = ?')
      params.push(category)
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const offset = (parseInt(page) - 1) * parseInt(pageSize)

    const [totalRow] = await query(`SELECT COUNT(*) as total FROM medicines ${where}`, params)
    const list = await query(
      `SELECT * FROM medicines ${where} ORDER BY sort_order ASC, id ASC LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    )

    return res.json(success({
      list: list.map(mapMedicine),
      total: totalRow.total
    }))
  } catch (err) {
    console.error('[Medicine] List error:', err)
    return res.json(error('获取药品列表失败'))
  }
})

/** GET /api/admin/medicines/:id - 单条详情 */
router.get('/admin/:id', async (req, res) => {
  try {
    const row = await getOne('SELECT * FROM medicines WHERE id = ?', [req.params.id])
    if (!row) return res.json(error('药品不存在'))
    return res.json(success(mapMedicine(row)))
  } catch (err) {
    return res.json(error('获取药品详情失败'))
  }
})

/** POST /api/admin/medicines - 新增 */
router.post('/admin', async (req, res) => {
  try {
    const { name, category, indications, form, notes, image, usageDosages, sortOrder } = req.body
    if (!name || !category) {
      return res.json(error('药品名称和分类不能为空'))
    }

    const id = await insert(
      `INSERT INTO medicines (name, category, indications, form, notes, image, usage_dosages, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, category, indications || '', form || '', notes || '', image || '', JSON.stringify(usageDosages || []), sortOrder || 0]
    )
    return res.json(success({ id }, '新增成功'))
  } catch (err) {
    console.error('[Medicine] Create error:', err)
    return res.json(error('新增药品失败'))
  }
})

/** PUT /api/admin/medicines/:id - 编辑 */
router.put('/admin/:id', async (req, res) => {
  try {
    const { name, category, indications, form, notes, image, usageDosages, sortOrder, enabled } = req.body
    const existing = await getOne('SELECT id FROM medicines WHERE id = ?', [req.params.id])
    if (!existing) return res.json(error('药品不存在'))

    const sets = []; const params = []
    if (name !== undefined) { sets.push('name = ?'); params.push(name) }
    if (category !== undefined) { sets.push('category = ?'); params.push(category) }
    if (indications !== undefined) { sets.push('indications = ?'); params.push(indications) }
    if (form !== undefined) { sets.push('form = ?'); params.push(form) }
    if (notes !== undefined) { sets.push('notes = ?'); params.push(notes) }
    if (image !== undefined) { sets.push('image = ?'); params.push(image) }
    if (usageDosages !== undefined) { sets.push('usage_dosages = ?'); params.push(JSON.stringify(usageDosages)) }
    if (sortOrder !== undefined) { sets.push('sort_order = ?'); params.push(sortOrder) }
    if (enabled !== undefined) { sets.push('enabled = ?'); params.push(enabled ? 1 : 0) }

    if (sets.length === 0) return res.json(error('没有需要更新的字段'))
    params.push(req.params.id)
    await execute(`UPDATE medicines SET ${sets.join(', ')} WHERE id = ?`, params)
    return res.json(success(null, '更新成功'))
  } catch (err) {
    console.error('[Medicine] Update error:', err)
    return res.json(error('更新药品失败'))
  }
})

/** POST /api/medicines/admin/:id/image - 上传药品图片 */
router.post('/admin/:id/image', requireAdminAuth, (req, res) => {
  getOne('SELECT id FROM medicines WHERE id = ?', [req.params.id]).then(existing => {
    if (!existing) return res.json(error('药品不存在'))
    uploadSingle(req, res, async (err) => {
      if (err) return res.json(error(err.message || '上传失败'))
      if (!req.file) return res.json(error('请选择文件'))
      const relativePath = getRelativePath(req.file)
      const publicUrl = getPublicUrl(relativePath)
      await execute('UPDATE medicines SET image = ? WHERE id = ?', [relativePath, req.params.id])
      return res.json(success({ path: relativePath, url: publicUrl }, '上传成功'))
    })
  }).catch(() => res.json(error('上传失败')))
})

/** DELETE /api/admin/medicines/:id - 删除 */
router.delete('/admin/:id', async (req, res) => {
  try {
    const existing = await getOne('SELECT id FROM medicines WHERE id = ?', [req.params.id])
    if (!existing) return res.json(error('药品不存在'))
    await execute('DELETE FROM medicines WHERE id = ?', [req.params.id])
    return res.json(success(null, '删除成功'))
  } catch (err) {
    return res.json(error('删除药品失败'))
  }
})

/** POST /api/admin/medicines/batch-delete - 批量删除 */
router.post('/admin/batch-delete', async (req, res) => {
  try {
    const { ids } = req.body
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.json(error('请选择要删除的药品'))
    }
    const placeholders = ids.map(() => '?').join(',')
    await execute(`DELETE FROM medicines WHERE id IN (${placeholders})`, ids)
    return res.json(success({ deleted: ids.length }, `已删除 ${ids.length} 条药品`))
  } catch (err) {
    console.error('[Medicine] Batch delete error:', err)
    return res.json(error('批量删除失败'))
  }
})

/** GET /api/admin/medicines/export - 导出全部为 JSON */
router.get('/admin/export', async (req, res) => {
  try {
    const rows = await query('SELECT * FROM medicines ORDER BY sort_order ASC, id ASC')
    const list = rows.map(mapMedicine)
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Disposition', 'attachment; filename=medicines-export.json')
    return res.json(success(list))
  } catch (err) {
    return res.json(error('导出失败'))
  }
})

/** POST /api/admin/medicines/import - 批量导入 JSON */
router.post('/admin/import', async (req, res) => {
  try {
    const { data } = req.body
    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.json(error('导入数据为空'))
    }

    let imported = 0; let skipped = 0
    for (const item of data) {
      if (!item.name || !item.category) { skipped++; continue }

      // 去重：同名同分类跳过
      const existing = await getOne(
        'SELECT id FROM medicines WHERE name = ? AND category = ?',
        [item.name, item.category]
      )
      if (existing) { skipped++; continue }

      await insert(
        `INSERT INTO medicines (name, category, indications, form, notes, usage_dosages, enabled, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.name, item.category,
          item.indications || '', item.form || '', item.notes || '',
          JSON.stringify(item.usageDosages || []),
          item.enabled !== false ? 1 : 0,
          item.sortOrder || 0
        ]
      )
      imported++
    }

    return res.json(success({ imported, skipped }, `导入完成：新增 ${imported} 条，跳过 ${skipped} 条（重复或无效）`))
  } catch (err) {
    console.error('[Medicine] Import error:', err)
    return res.json(error('导入失败'))
  }
})

// ==================== Helpers ====================

function mapMedicine(r) {
  return {
    id: r.id,
    name: r.name,
    category: r.category,
    indications: r.indications || '',
    form: r.form || '',
    notes: r.notes || '',
    image: r.image || '',
    usageDosages: parseJson(r.usage_dosages),
    enabled: r.enabled === 1,
    sortOrder: r.sort_order || 0,
    createTime: fmtDate(r.created_at),
    updateTime: fmtDate(r.updated_at)
  }
}

function parseJson(val) {
  if (!val) return []
  if (Array.isArray(val)) return val
  try { return JSON.parse(val) } catch (_) { return [] }
}

function fmtDate(d) {
  if (!d) return ''
  const dt = new Date(d)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}

module.exports = router
