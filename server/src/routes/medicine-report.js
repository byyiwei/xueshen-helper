const express = require('express')
const router = express.Router()
const { query, getOne, insert, execute } = require('../services/db')
const { requireAdminAuth } = require('../middleware/admin-auth')
const { success, error } = require('../utils/response')

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function fmtDate(d) {
  if (!d) return ''
  const dt = new Date(d)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')} ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`
}

function mapReport(r) {
  return {
    id: r.id,
    medicineName: r.medicine_name,
    email: r.email,
    status: r.status,
    adminNote: r.admin_note || '',
    createTime: fmtDate(r.created_at),
    updateTime: fmtDate(r.updated_at)
  }
}

// ==================== 公开接口 ====================

/** POST /api/medicine-reports - 用户上报缺失药品 */
router.post('/', async (req, res) => {
  try {
    const { medicineName, email } = req.body
    if (!medicineName || !medicineName.trim()) {
      return res.json(error('请填写药品名称'))
    }
    if (!email || !isValidEmail(email)) {
      return res.json(error('请填写有效的邮箱地址'))
    }

    const existing = await getOne(
      'SELECT id FROM medicine_reports WHERE medicine_name = ? AND email = ? AND status = ?',
      [medicineName.trim(), email.trim(), 'pending']
    )
    if (existing) {
      return res.json(error('您已上报过该药品，我们正在处理中'))
    }

    const id = await insert(
      'INSERT INTO medicine_reports (medicine_name, email, status) VALUES (?, ?, ?)',
      [medicineName.trim(), email.trim(), 'pending']
    )
    return res.json(success({ id }, '上报成功，我们会尽快处理'))
  } catch (err) {
    console.error('[MedicineReport] Create error:', err)
    return res.json(error('上报失败，请稍后重试'))
  }
})

// ==================== 管理接口 ====================

router.use('/admin', requireAdminAuth)

/** GET /api/medicine-reports/admin - 分页列表 */
router.get('/admin', async (req, res) => {
  try {
    const { status, search, page = 1, pageSize = 20 } = req.query
    const conditions = []; const params = []

    if (status) {
      conditions.push('status = ?')
      params.push(status)
    }
    if (search) {
      conditions.push('(medicine_name LIKE ? OR email LIKE ?)')
      params.push(`%${search}%`, `%${search}%`)
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const offset = (parseInt(page) - 1) * parseInt(pageSize)

    const totalRows = await query(`SELECT COUNT(*) as total FROM medicine_reports ${where}`, params)
    const list = await query(
      `SELECT * FROM medicine_reports ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    )

    return res.json(success({
      list: list.map(mapReport),
      total: totalRows[0].total
    }))
  } catch (err) {
    console.error('[MedicineReport] List error:', err)
    return res.json(error('获取上报列表失败'))
  }
})

/** PUT /api/medicine-reports/admin/:id - 更新状态/备注 */
router.put('/admin/:id', async (req, res) => {
  try {
    const { status, adminNote } = req.body
    const existing = await getOne('SELECT * FROM medicine_reports WHERE id = ?', [req.params.id])
    if (!existing) return res.json(error('上报记录不存在'))

    const sets = []; const params = []
    if (status !== undefined) { sets.push('status = ?'); params.push(status) }
    if (adminNote !== undefined) { sets.push('admin_note = ?'); params.push(adminNote) }

    if (sets.length === 0) return res.json(error('没有需要更新的字段'))
    params.push(req.params.id)
    await execute(`UPDATE medicine_reports SET ${sets.join(', ')} WHERE id = ?`, params)

    // 状态变为 completed 时发送邮件通知
    if (status === 'completed' && existing.status !== 'completed') {
      try {
        const { sendMedicineReportReply } = require('../services/email')
        await sendMedicineReportReply(existing.email, existing.medicine_name)
      } catch (emailErr) {
        console.error('[MedicineReport] 邮件发送失败:', emailErr.message)
      }
    }

    return res.json(success(null, '更新成功'))
  } catch (err) {
    console.error('[MedicineReport] Update error:', err)
    return res.json(error('更新失败'))
  }
})

module.exports = router
