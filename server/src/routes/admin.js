/**
 * Admin 路由 - 管理后台（统计、用户管理、配置）
 * 对应原 admin 云函数
 */
const express = require('express')
const router = express.Router()
const { query, getOne, insert, execute, transaction } = require('../services/db')
const { requireAdminAuth } = require('../middleware/admin-auth')
const { success, error } = require('../utils/response')

router.use(requireAdminAuth)

/** GET /api/admin/stats */
router.get('/stats', async (req, res) => {
  try {
    const [usersRow, petsRow, fpRow] = await Promise.all([
      query('SELECT COUNT(*) as total FROM users'),
      query('SELECT COUNT(*) as total FROM pets'),
      query('SELECT COUNT(*) as total FROM footprints')
    ])
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const todayFp = await query('SELECT COUNT(*) as total FROM footprints WHERE created_at >= ?', [today])

    const lastWeek = new Date(); lastWeek.setDate(lastWeek.getDate() - 7)
    const [newUsers, newPets] = await Promise.all([
      query('SELECT COUNT(*) as total FROM users WHERE created_at >= ?', [lastWeek]),
      query('SELECT COUNT(*) as total FROM pets WHERE created_at >= ?', [lastWeek])
    ])
    const oldUsers = usersRow[0].total - newUsers[0].total
    const oldPets = petsRow[0].total - newPets[0].total

    return res.json(success({
      totalUsers: usersRow[0].total, totalPets: petsRow[0].total, totalFootprints: fpRow[0].total,
      todayActive: todayFp[0].total,
      userGrowth: oldUsers > 0 ? parseFloat((newUsers[0].total / oldUsers * 100).toFixed(1)) : 0,
      petGrowth: oldPets > 0 ? parseFloat((newPets[0].total / oldPets * 100).toFixed(1)) : 0
    }))
  } catch (err) {
    return res.json(error('获取统计数据失败'))
  }
})

/** GET /api/admin/users */
router.get('/users', async (req, res) => {
  try {
    const { search, status, page = 1, pageSize = 20, sortField = 'created_at', sortOrder = 'desc' } = req.query
    const conditions = []; const params = []
    if (search) { conditions.push('(nickname LIKE ? OR openid LIKE ?)'); params.push(`%${search}%`, `%${search}%`) }
    if (status) { conditions.push('status = ?'); params.push(status) }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const validSortFields = ['created_at', 'updated_at', 'nickname']
    const orderField = validSortFields.includes(sortField) ? sortField : 'created_at'
    const order = sortOrder === 'asc' ? 'ASC' : 'DESC'
    const offset = (parseInt(page) - 1) * parseInt(pageSize)

    const [totalRow] = await query(`SELECT COUNT(*) as total FROM users ${where}`, params)
    const list = await query(
      `SELECT * FROM users ${where} ORDER BY ${orderField} ${order} LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    )
    return res.json(success({ list: list.map(mapUser), total: totalRow.total }))
  } catch (err) {
    return res.json(error('获取用户列表失败'))
  }
})

/** PUT /api/admin/users/:id */
router.put('/users/:id', async (req, res) => {
  try {
    const { nickname, status, openid } = req.body
    const sets = []; const params = []
    if (nickname !== undefined) { sets.push('nickname = ?'); params.push(nickname) }
    if (status !== undefined) { sets.push('status = ?'); params.push(status) }
    if (sets.length === 0) return res.json(error('没有需要更新的字段'))
    sets.push('updated_at = NOW()')
    params.push(req.params.id)
    await execute(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, params)

    if (status === '封禁' && openid) {
      const banned = await getOne('SELECT id FROM banned_users WHERE openid = ?', [openid])
      if (!banned) await insert('INSERT INTO banned_users (openid, reason, banned_by, banned_at) VALUES (?, ?, ?, NOW())', [openid, '管理员封禁', req.adminUsername])
    }
    if (status === '正常' && openid) {
      await execute('DELETE FROM banned_users WHERE openid = ?', [openid])
    }
    return res.json(success(null, '更新成功'))
  } catch (err) {
    return res.json(error('更新用户失败'))
  }
})

/** DELETE /api/admin/users/:id */
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await getOne('SELECT openid FROM users WHERE id = ?', [req.params.id])
    if (!user) return res.json(error('用户不存在'))
    await transaction(async (conn) => {
      await conn.execute('DELETE FROM users WHERE id = ?', [req.params.id])
      await conn.execute('DELETE FROM pets WHERE openid = ?', [user.openid])
      await conn.execute('DELETE FROM records WHERE openid = ?', [user.openid])
      await conn.execute('DELETE FROM footprints WHERE openid = ?', [user.openid])
      await conn.execute('DELETE FROM reminders WHERE openid = ?', [user.openid])
      await conn.execute('DELETE FROM categories WHERE openid = ?', [user.openid])
    })
    return res.json(success(null, '删除成功'))
  } catch (err) {
    return res.json(error('删除用户失败'))
  }
})

/** GET /api/admin/pets */
router.get('/pets', async (req, res) => {
  try {
    const { search, category, page = 1, pageSize = 20 } = req.query
    const conditions = []; const params = []
    if (search) { conditions.push('p.name LIKE ?'); params.push(`%${search}%`) }
    if (category) { conditions.push('p.category = ?'); params.push(category) }
    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const offset = (parseInt(page) - 1) * parseInt(pageSize)
    const list = await query(
      `SELECT p.*, u.nickname as owner FROM pets p LEFT JOIN users u ON p.openid = u.openid ${where} ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    )
    const [totalRow] = await query(`SELECT COUNT(*) as total FROM pets p ${where}`, params)
    return res.json(success({
      list: list.map(p => ({ id: p.id, name: p.name, category: p.category, owner: p.owner || '未知', avatar: firstPhoto(p.photos), createTime: fmtDate(p.created_at) })),
      total: totalRow.total
    }))
  } catch (err) {
    return res.json(error('获取宠物列表失败'))
  }
})

/** GET /api/admin/footprints */
router.get('/footprints', async (req, res) => {
  try {
    const { date, page = 1, pageSize = 20 } = req.query
    const conditions = []; const params = []
    if (date === 'today') { conditions.push('created_at >= ?'); params.push(new Date(new Date().setHours(0,0,0,0))) }
    else if (date === 'week') { const w = new Date(); w.setDate(w.getDate()-7); conditions.push('created_at >= ?'); params.push(w) }
    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const offset = (parseInt(page) - 1) * parseInt(pageSize)
    const list = await query(`SELECT * FROM footprints ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...params, parseInt(pageSize), offset])
    return res.json(success({ list: list.map(f => ({ id: f.id, content: f.description || '', petName: f.pet_name, photos: parseJson(f.photos), createTime: fmtDate(f.created_at) })), total: list.length }))
  } catch (err) {
    return res.json(error('获取足迹列表失败'))
  }
})

/** GET /api/admin/user-growth */
router.get('/user-growth', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7
    const result = []; const now = new Date()
    const weekDays = ['周日','周一','周二','周三','周四','周五','周六']
    for (let i = days - 1; i >= 0; i--) {
      const start = new Date(now); start.setDate(now.getDate() - i); start.setHours(0,0,0,0)
      const end = new Date(start); end.setHours(23,59,59,999)
      const [row] = await query('SELECT COUNT(*) as cnt FROM users WHERE created_at >= ? AND created_at <= ?', [start, end])
      result.push({ day: weekDays[start.getDay()], count: row.cnt })
    }
    return res.json(success(result))
  } catch (err) {
    return res.json(error('获取增长趋势失败'))
  }
})

/** GET /api/admin/pet-distribution */
router.get('/pet-distribution', async (req, res) => {
  try {
    const rows = await query('SELECT category, COUNT(*) as cnt FROM pets GROUP BY category')
    const total = rows.reduce((s, r) => s + r.cnt, 0)
    return res.json(success(rows.map(r => ({ type: r.category || '其他', count: r.cnt, percentage: total > 0 ? Math.round(r.cnt / total * 100) : 0 }))))
  } catch (err) {
    return res.json(error('获取分布失败'))
  }
})

/** GET /api/admin/config */
router.get('/config', async (req, res) => {
  try {
    const rows = await query('SELECT config_key, config_value FROM system_config')
    const config = {}; rows.forEach(r => { config[r.config_key] = r.config_value })
    return res.json(success(config))
  } catch (err) {
    return res.json(error('获取配置失败'))
  }
})

/** PUT /api/admin/config */
router.put('/config', async (req, res) => {
  try {
    for (const [key, value] of Object.entries(req.body)) {
      if (key === '_id' || key === 'id' || key === 'createdAt' || key === 'updatedAt') continue
      const existing = await getOne('SELECT id FROM system_config WHERE config_key = ?', [key])
      if (existing) {
        await execute('UPDATE system_config SET config_value = ?, updated_by = ?, updated_at = NOW() WHERE config_key = ?', [String(value ?? ''), req.adminUsername, key])
      } else {
        await insert('INSERT INTO system_config (config_key, config_value, updated_by, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())', [key, String(value ?? ''), req.adminUsername])
      }
    }
    return res.json(success(null, '配置已更新'))
  } catch (err) {
    return res.json(error('更新配置失败'))
  }
})

function mapUser(u) { return { id: u.id, openid: u.openid, nickname: u.nickname || '未设置', phone: u.phone || '', avatar: u.avatar || '', status: u.status || '正常', createTime: fmtDate(u.created_at) } }
function fmtDate(d) { if (!d) return ''; const dt = new Date(d); return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}` }
function parseJson(val) { if (!val) return []; if (Array.isArray(val)) return val; try { return JSON.parse(val) } catch (_) { return [] } }
function firstPhoto(photos) { const arr = parseJson(photos); return arr.length > 0 ? arr[0] : '' }

module.exports = router
