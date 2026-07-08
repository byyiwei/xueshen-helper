/**
 * 龟缸管理路由
 * - 公开接口: /api/tanks
 * - 管理接口: /api/tanks/admin
 */
const express = require('express')
const router = express.Router()
const { query, getOne, insert, execute } = require('../services/db')
const { requireAdminAuth } = require('../middleware/admin-auth')
const { requireAuth, requireAdmin } = require('../middleware/auth')
const { success, error, listResult } = require('../utils/response')

// ==================== 公开接口 ====================

/** GET /api/tanks/check-code - 校验编号是否可用 */
router.get('/check-code', async (req, res) => {
  try {
    const { code, exclude } = req.query
    if (!code || !code.trim()) {
      return res.json(success({ available: true }))
    }
    const sql = exclude
      ? 'SELECT id FROM tanks WHERE tank_code = ? AND id != ?'
      : 'SELECT id FROM tanks WHERE tank_code = ?'
    const params = exclude ? [code.trim(), parseInt(exclude, 10)] : [code.trim()]
    const rows = await query(sql, params)
    return res.json(success({ available: rows.length === 0 }))
  } catch (err) {
    console.error('[Tank] check-code error:', err)
    return res.json(error('校验失败'))
  }
})

/** GET /api/tanks - 龟缸列表 */
router.get('/', async (req, res) => {
  try {
    const rows = await query(
      'SELECT id, tank_code, name, size, category, species, male_count, female_count, notes FROM tanks WHERE enabled = 1 ORDER BY sort_order ASC, id ASC'
    )
    return res.json(success(rows))
  } catch (err) {
    console.error('[Tank] GET /api/tanks error:', err)
    return res.json(error('获取龟缸列表失败'))
  }
})

/** GET /api/tanks/stats - 统计数据 */
router.get('/stats', async (req, res) => {
  try {
    const tanks = await query('SELECT id, name, male_count, female_count FROM tanks WHERE enabled = 1')
    const count = tanks.length
    const totalMale = tanks.reduce((s, t) => s + (t.male_count || 0), 0)
    const totalFemale = tanks.reduce((s, t) => s + (t.female_count || 0), 0)
    return res.json(success({ count, totalMale, totalFemale, tanks }))
  } catch (err) {
    console.error('[Tank] GET /api/tanks/stats error:', err)
    return res.json(error('获取统计失败'))
  }
})

/** GET /api/tanks/reminders/due - 获取所有到期龟缸提醒 */
router.get('/reminders/due', async (req, res) => {
  try {
    const today = new Date()
    const todayStr = today.toISOString().slice(0, 10)

    // 查询所有启用的、7天内到期的周期提醒（换水/喂食）
    const reminders = await query(
      `SELECT tr.id, tr.tank_id, tr.type, tr.interval_days, tr.next_remind, tr.last_remind,
              tr.event_name, tr.event_date, tr.enabled,
              t.name as tank_name, t.tank_code, t.species
       FROM tank_reminders tr
       JOIN tanks t ON tr.tank_id = t.id
       WHERE tr.enabled = 1 AND t.enabled = 1
         AND tr.type IN ('water', 'feed')
         AND tr.next_remind IS NOT NULL
         AND tr.next_remind <= DATE_ADD(?, INTERVAL 7 DAY)
       ORDER BY tr.next_remind ASC`,
      [todayStr]
    )

    // 计算状态
    const list = reminders.map(r => {
      const nextDate = new Date(r.next_remind)
      nextDate.setHours(0, 0, 0, 0)
      today.setHours(0, 0, 0, 0)
      const diffDays = Math.floor((today - nextDate) / (1000 * 60 * 60 * 24))

      let status, statusText, statusClass
      if (diffDays > 0) {
        status = 'overdue'
        statusText = `超期${diffDays}天`
        statusClass = 'overdue'
      } else if (diffDays === 0) {
        status = 'today'
        statusText = '今天'
        statusClass = 'today'
      } else if (diffDays === -1) {
        status = 'tomorrow'
        statusText = '明天'
        statusClass = 'tomorrow'
      } else if (diffDays === -2) {
        status = 'dayafter'
        statusText = '后天'
        statusClass = 'normal'
      } else {
        status = 'normal'
        statusText = `${Math.abs(diffDays)}天后`
        statusClass = 'normal'
      }

      const typeText = r.type === 'water' ? '换水' : r.type === 'feed' ? '喂食' : r.event_name || '提醒'

      return {
        id: r.id,
        tankId: r.tank_id,
        tankName: r.tank_name,
        tankCode: r.tank_code,
        species: r.species,
        type: r.type,
        typeText,
        intervalDays: r.interval_days,
        nextDueDate: r.next_remind,
        lastDone: r.last_remind,
        status,
        statusText,
        statusClass
      }
    })

    return res.json(success({ list, total: list.length }))
  } catch (err) {
    console.error('[Tank] GET /api/tanks/reminders/due error:', err)
    return res.json(error('获取龟缸提醒失败'))
  }
})

/** POST /api/tanks - 小程序端新增龟缸（需登录） */
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, size, category, species, male_count, female_count, notes, sort_order, tank_code } = req.body
    if (!name) {
      return res.json(error('请输入龟缸名称'))
    }
    // 自动生成编号（用户未填时）
    let finalCode = tank_code ? tank_code.trim() : ''
    if (!finalCode) {
      const [maxRow] = await query('SELECT MAX(id) AS maxId FROM tanks')
      finalCode = 'T' + String((maxRow.maxId || 0) + 1).padStart(3, '0')
    } else {
      // 校验唯一性
      const exist = await query('SELECT id FROM tanks WHERE tank_code = ?', [finalCode])
      if (exist.length > 0) {
        return res.json(error('该编号已被其他龟缸使用'))
      }
    }
    const id = await insert(
      'INSERT INTO tanks (tank_code, name, size, category, species, male_count, female_count, notes, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [finalCode, name, size || '', category || '无', species || '', male_count || 0, female_count || 0, notes || '', sort_order || 0]
    )
    return res.json(success({ id, tank_code: finalCode }, '龟缸已添加'))
  } catch (err) {
    console.error('[Tank] POST /api/tanks error:', err)
    return res.json(error('添加龟缸失败'))
  }
})

// ==================== 管理接口（必须在 /:id 之前注册，否则会被通配路由拦截） ====================
router.use('/admin', requireAdminAuth)

/** GET /api/tanks/admin - 后台列表(含禁用) */
router.get('/admin', async (req, res) => {
  try {
    const { pageNum = 1, pageSize = 20, search } = req.query
    const conditions = ['1=1']
    const params = []
    if (search) { conditions.push('(name LIKE ? OR species LIKE ?)'); params.push(`%${search}%`, `%${search}%`) }
    const where = conditions.join(' AND ')
    const [countRows] = await (await query(`SELECT COUNT(*) AS total FROM tanks WHERE ${where}`, params))
    const rows = await query(
      `SELECT * FROM tanks WHERE ${where} ORDER BY sort_order ASC, id ASC LIMIT ${parseInt(pageSize)} OFFSET ${(parseInt(pageNum) - 1) * parseInt(pageSize)}`,
      params
    )
    return res.json(listResult(rows, countRows.total, parseInt(pageNum), parseInt(pageSize)))
  } catch (err) {
    console.error('[Tank] Admin list error:', err)
    return res.json(error('获取列表失败'))
  }
})

/** POST /api/tanks/admin - 新增 */
router.post('/admin', async (req, res) => {
  try {
    const { name, size, category, species, male_count, female_count, notes, sort_order, tank_code } = req.body
    // 自动生成编号（用户未填时）
    let finalCode = tank_code
    if (!finalCode) {
      const [maxRow] = await query('SELECT MAX(id) AS maxId FROM tanks')
      finalCode = 'T' + String((maxRow.maxId || 0) + 1).padStart(3, '0')
    }
    const id = await insert(
      'INSERT INTO tanks (tank_code, name, size, category, species, male_count, female_count, notes, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [finalCode, name, size || '', category || '无', species || '', male_count || 0, female_count || 0, notes || '', sort_order || 0]
    )
    return res.json(success({ id, tank_code: finalCode }, '龟缸已添加'))
  } catch (err) {
    console.error('[Tank] Admin create error:', err)
    return res.json(error('添加龟缸失败'))
  }
})

/** PUT /api/tanks/admin/:id - 编辑 */
router.put('/admin/:id', async (req, res) => {
  try {
    const { name, size, category, species, male_count, female_count, notes, enabled, sort_order, tank_code } = req.body
    const finalCode = tank_code ? tank_code.trim() : ''
    // 校验编号唯一性（排除自身）
    if (finalCode) {
      const exist = await query('SELECT id FROM tanks WHERE tank_code = ? AND id != ?', [finalCode, parseInt(req.params.id, 10)])
      if (exist.length > 0) {
        return res.json(error('该编号已被其他龟缸使用'))
      }
    }
    await execute(
      'UPDATE tanks SET tank_code=?, name=?, size=?, category=?, species=?, male_count=?, female_count=?, notes=?, enabled=?, sort_order=? WHERE id=?',
      [finalCode, name, size || '', category || '无', species || '', male_count || 0, female_count || 0, notes || '', enabled !== false ? 1 : 0, sort_order || 0, req.params.id]
    )
    return res.json(success(null, '龟缸已更新'))
  } catch (err) {
    console.error('[Tank] Admin update error:', err)
    return res.json(error('更新龟缸失败'))
  }
})

/** DELETE /api/tanks/admin/:id - 删除 */
router.delete('/admin/:id', async (req, res) => {
  try {
    await execute('DELETE FROM tanks WHERE id = ?', [req.params.id])
    return res.json(success(null, '龟缸已删除'))
  } catch (err) {
    console.error('[Tank] Admin delete error:', err)
    return res.json(error('删除龟缸失败'))
  }
})

/** PUT /api/tanks/:id - 小程序端编辑龟缸信息（需登录） */
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { name, size, category, species, male_count, female_count, notes, tank_code } = req.body
    const finalCode = tank_code ? tank_code.trim() : ''
    // 校验编号唯一性（排除自身）
    if (finalCode) {
      const exist = await query('SELECT id FROM tanks WHERE tank_code = ? AND id != ?', [finalCode, parseInt(req.params.id, 10)])
      if (exist.length > 0) {
        return res.json(error('该编号已被其他龟缸使用'))
      }
    }
    await execute(
      'UPDATE tanks SET tank_code=?, name=?, size=?, category=?, species=?, male_count=?, female_count=?, notes=? WHERE id=?',
      [finalCode, name, size || '', category || '无', species || '', male_count || 0, female_count || 0, notes || '', req.params.id]
    )
    return res.json(success(null, '龟缸已更新'))
  } catch (err) {
    console.error('[Tank] PUT /:id error:', err)
    return res.json(error('更新龟缸失败'))
  }
})

/** POST /api/tanks/admin/batch-delete - 批量删除 */
router.post('/admin/batch-delete', async (req, res) => {
  try {
    const { ids } = req.body
    if (!ids || !ids.length) return res.json(error('请选择要删除的龟缸'))
    await execute(`DELETE FROM tanks WHERE id IN (${ids.map(() => '?').join(',')})`, ids)
    return res.json(success(null, `已删除 ${ids.length} 个龟缸`))
  } catch (err) {
    console.error('[Tank] Batch delete error:', err)
    return res.json(error('批量删除失败'))
  }
})

// ==================== 参数路由（/:id 系列必须放在 /admin 等固定路由之后） ====================

/** GET /api/tanks/:id - 龟缸详情 */
router.get('/:id', async (req, res) => {
  try {
    const tank = await getOne(
      'SELECT id, tank_code, name, size, category, species, male_count, female_count, notes FROM tanks WHERE id = ? AND enabled = 1',
      [req.params.id]
    )
    if (!tank) return res.json(error('龟缸不存在'))

    // 种群比例
    const total = (tank.male_count || 0) + (tank.female_count || 0)
    tank.ratio = total > 0 ? `${tank.male_count}:${tank.female_count}` : '-'

    return res.json(success(tank))
  } catch (err) {
    console.error('[Tank] GET /api/tanks/:id error:', err)
    return res.json(error('获取龟缸详情失败'))
  }
})

/** GET /api/tanks/:id/timeline - 时间线 */
router.get('/:id/timeline', async (req, res) => {
  try {
    const tankId = req.params.id
    const items = []

    const water = await query(
      "SELECT id, 'water' AS type, record_date, CONCAT('换水 ', water_change) AS title, notes FROM tank_water_records WHERE tank_id = ? ORDER BY record_date DESC LIMIT 50",
      [tankId]
    )
    water.forEach(r => items.push({ ...r, date: r.record_date }))

    const feeding = await query(
      "SELECT id, 'feeding' AS type, record_date, CONCAT('喂食 ', food_type) AS title, amount_g AS detail, notes FROM tank_feeding_records WHERE tank_id = ? ORDER BY record_date DESC LIMIT 50",
      [tankId]
    )
    feeding.forEach(r => items.push({ ...r, date: r.record_date }))

    const eggs = await query(
      "SELECT id, 'egg' AS type, lay_date AS record_date, CONCAT('产蛋 ', total_eggs, '枚') AS title, CONCAT('受精', fertilized, '/未受精', unfertilized) AS detail, notes FROM tank_egg_records WHERE tank_id = ? ORDER BY lay_date DESC LIMIT 50",
      [tankId]
    )
    eggs.forEach(r => items.push({ ...r, date: r.record_date, record_date: r.record_date }))

    items.sort((a, b) => new Date(b.date) - new Date(a.date))

    return res.json(success(items.slice(0, 50)))
  } catch (err) {
    console.error('[Tank] GET /api/tanks/:id/timeline error:', err)
    return res.json(error('获取时间线失败'))
  }
})

// ==================== 换水记录 ====================

/** GET /api/tanks/:id/water */
router.get('/:id/water', async (req, res) => {
  try {
    const rows = await query(
      'SELECT id, record_date, water_change, notes, created_at FROM tank_water_records WHERE tank_id = ? ORDER BY record_date DESC',
      [req.params.id]
    )
    return res.json(success(rows))
  } catch (err) {
    console.error('[Tank] GET water error:', err)
    return res.json(error('获取换水记录失败'))
  }
})

/** POST /api/tanks/:id/water */
router.post('/:id/water', requireAuth, async (req, res) => {
  try {
    const { record_date, water_change, notes } = req.body
    const id = await insert(
      'INSERT INTO tank_water_records (tank_id, record_date, water_change, notes) VALUES (?, ?, ?, ?)',
      [req.params.id, record_date || new Date().toISOString().slice(0, 10), water_change || '', notes || '']
    )
    return res.json(success({ id }, '换水记录已添加'))
  } catch (err) {
    console.error('[Tank] POST water error:', err)
    return res.json(error('添加换水记录失败'))
  }
})

// ==================== 喂食记录 ====================

/** GET /api/tanks/:id/feeding */
router.get('/:id/feeding', async (req, res) => {
  try {
    const rows = await query(
      'SELECT id, record_date, food_type, amount_g, additives, notes, created_at FROM tank_feeding_records WHERE tank_id = ? ORDER BY record_date DESC',
      [req.params.id]
    )
    return res.json(success(rows))
  } catch (err) {
    console.error('[Tank] GET feeding error:', err)
    return res.json(error('获取喂食记录失败'))
  }
})

/** POST /api/tanks/:id/feeding */
router.post('/:id/feeding', requireAuth, async (req, res) => {
  try {
    const { record_date, food_type, amount_g, additives, notes } = req.body
    const id = await insert(
      'INSERT INTO tank_feeding_records (tank_id, record_date, food_type, amount_g, additives, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [req.params.id, record_date || new Date().toISOString().slice(0, 10), food_type || '', amount_g || null, additives || '', notes || '']
    )
    return res.json(success({ id }, '喂食记录已添加'))
  } catch (err) {
    console.error('[Tank] POST feeding error:', err)
    return res.json(error('添加喂食记录失败'))
  }
})

// ==================== 产蛋记录 ====================

/** GET /api/tanks/:id/eggs */
router.get('/:id/eggs', async (req, res) => {
  try {
    const rows = await query(
      'SELECT id, tank_id, lay_date, total_eggs, fertilized, unfertilized, parent_male, parent_female, notes, created_at FROM tank_egg_records WHERE tank_id = ? ORDER BY lay_date DESC',
      [req.params.id]
    )

    if (rows.length === 0) {
      return res.json(success([]))
    }

    // 一次性查询所有相关孵化记录，避免 N+1
    const eggIds = rows.map(r => r.id)
    const placeholders = eggIds.map(() => '?').join(',')
    const hatchRows = await query(
      `SELECT id, egg_record_id, hatch_date, total_hatched, perfect_count, imperfect_count FROM tank_hatch_records WHERE egg_record_id IN (${placeholders})`,
      eggIds
    )

    const hatchMap = {}
    for (const h of hatchRows) {
      if (!hatchMap[h.egg_record_id]) hatchMap[h.egg_record_id] = []
      hatchMap[h.egg_record_id].push({
        ...h,
        perfect_rate: h.total_hatched > 0 ? ((h.perfect_count / h.total_hatched) * 100).toFixed(1) + '%' : '-'
      })
    }

    for (const r of rows) {
      r.fertility_rate = r.total_eggs > 0 ? ((r.fertilized / r.total_eggs) * 100).toFixed(1) + '%' : '-'
      r.hatch_records = hatchMap[r.id] || []
    }

    return res.json(success(rows))
  } catch (err) {
    console.error('[Tank] GET eggs error:', err)
    return res.json(error('获取产蛋记录失败'))
  }
})

// ==================== 出苗记录（按龟缸） ====================

/** GET /api/tanks/:id/hatch - 获取该龟缸所有出苗记录 */
router.get('/:id/hatch', async (req, res) => {
  try {
    const rows = await query(
      `SELECT h.id, h.egg_record_id, h.hatch_date, h.total_hatched, h.perfect_count, h.imperfect_count, h.notes, h.created_at
       FROM tank_hatch_records h
       INNER JOIN tank_egg_records e ON h.egg_record_id = e.id
       WHERE e.tank_id = ?
       ORDER BY h.hatch_date DESC`,
      [req.params.id]
    )
    for (const r of rows) {
      r.perfect_rate = r.total_hatched > 0 ? ((r.perfect_count / r.total_hatched) * 100).toFixed(1) + '%' : '-'
    }
    return res.json(success(rows))
  } catch (err) {
    console.error('[Tank] GET /:id/hatch error:', err)
    return res.json(error('获取出苗记录失败'))
  }
})

/** POST /api/tanks/:id/eggs */
router.post('/:id/eggs', requireAuth, async (req, res) => {
  try {
    const { lay_date, total_eggs, fertilized, unfertilized, parent_male, parent_female, notes } = req.body
    const id = await insert(
      'INSERT INTO tank_egg_records (tank_id, lay_date, total_eggs, fertilized, unfertilized, parent_male, parent_female, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [req.params.id, lay_date || new Date().toISOString().slice(0, 10), total_eggs || 0, fertilized || 0, unfertilized || 0, parent_male || '', parent_female || '', notes || '']
    )
    return res.json(success({ id }, '产蛋记录已添加'))
  } catch (err) {
    console.error('[Tank] POST egg error:', err)
    return res.json(error('添加产蛋记录失败'))
  }
})

// ==================== 孵化记录 ====================

/** GET /api/tanks/:id/eggs/:eggId/hatch */
router.get('/:id/eggs/:eggId/hatch', async (req, res) => {
  try {
    const rows = await query(
      'SELECT id, hatch_date, total_hatched, perfect_count, imperfect_count, notes, created_at FROM tank_hatch_records WHERE egg_record_id = ? ORDER BY hatch_date DESC',
      [req.params.eggId]
    )
    for (const r of rows) {
      r.perfect_rate = r.total_hatched > 0 ? ((r.perfect_count / r.total_hatched) * 100).toFixed(1) + '%' : '-'
    }
    return res.json(success(rows))
  } catch (err) {
    console.error('[Tank] GET hatch error:', err)
    return res.json(error('获取孵化记录失败'))
  }
})

/** POST /api/tanks/:id/eggs/:eggId/hatch */
router.post('/:id/eggs/:eggId/hatch', requireAuth, async (req, res) => {
  try {
    const { hatch_date, total_hatched, perfect_count, imperfect_count, notes } = req.body
    const id = await insert(
      'INSERT INTO tank_hatch_records (egg_record_id, hatch_date, total_hatched, perfect_count, imperfect_count, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [req.params.eggId, hatch_date || new Date().toISOString().slice(0, 10), total_hatched || 0, perfect_count || 0, imperfect_count || 0, notes || '']
    )
    return res.json(success({ id }, '孵化记录已添加'))
  } catch (err) {
    console.error('[Tank] POST hatch error:', err)
    return res.json(error('添加孵化记录失败'))
  }
})

// ==================== 提醒设置 ====================

/** GET /api/tanks/:id/reminders */
router.get('/:id/reminders', async (req, res) => {
  try {
    const rows = await query(
      'SELECT id, type, interval_days, next_remind, last_remind, event_name, event_date, enabled FROM tank_reminders WHERE tank_id = ?',
      [req.params.id]
    )
    return res.json(success(rows))
  } catch (err) {
    console.error('[Tank] GET reminders error:', err)
    return res.json(error('获取提醒设置失败'))
  }
})

/** PUT /api/tanks/:id/reminders */
router.put('/:id/reminders', requireAuth, async (req, res) => {
  try {
    const items = req.body.items || []
    // 先删后插
    await execute('DELETE FROM tank_reminders WHERE tank_id = ?', [req.params.id])
    for (const item of items) {
      await insert(
        'INSERT INTO tank_reminders (tank_id, type, interval_days, next_remind, event_name, event_date, enabled) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [req.params.id, item.type, item.interval_days || 0, item.next_remind || null, item.event_name || '', item.event_date || null, item.enabled !== false ? 1 : 0]
      )
    }
    return res.json(success(null, '提醒设置已更新'))
  } catch (err) {
    console.error('[Tank] PUT reminders error:', err)
    return res.json(error('更新提醒设置失败'))
  }
})

// ==================== 快速打卡 ====================

/** POST /api/tanks/:id/check - 快捷打卡 (water/feeding) */
router.post('/:id/check', requireAuth, async (req, res) => {
  try {
    const { type, record_date, water_change, food_type, amount_g, additives, notes } = req.body
    const date = record_date || new Date().toISOString().slice(0, 10)

    if (type === 'water') {
      await insert(
        'INSERT INTO tank_water_records (tank_id, record_date, water_change, notes) VALUES (?, ?, ?, ?)',
        [req.params.id, date, water_change || '1/3', notes || '']
      )
      // 更新提醒
      await execute(
        "UPDATE tank_reminders SET last_remind = ?, next_remind = DATE_ADD(?, INTERVAL interval_days DAY) WHERE tank_id = ? AND type = 'water' AND enabled = 1",
        [date, date, req.params.id]
      )
    } else if (type === 'feeding') {
      await insert(
        'INSERT INTO tank_feeding_records (tank_id, record_date, food_type, amount_g, additives, notes) VALUES (?, ?, ?, ?, ?, ?)',
        [req.params.id, date, food_type || '', amount_g || null, additives || '', notes || '']
      )
      await execute(
        "UPDATE tank_reminders SET last_remind = ?, next_remind = DATE_ADD(?, INTERVAL interval_days DAY) WHERE tank_id = ? AND type = 'feed' AND enabled = 1",
        [date, date, req.params.id]
      )
    }
    return res.json(success(null, '打卡成功'))
  } catch (err) {
    console.error('[Tank] POST check error:', err)
    return res.json(error('打卡失败'))
  }
})

module.exports = router
