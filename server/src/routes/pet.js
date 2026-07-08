/**
 * Pet 路由 - 宠物 CRUD、分类管理、家谱查询、公开档案
 * 对应原 pet 云函数
 */
const express = require('express')
const router = express.Router()
const { query, getOne, insert, execute } = require('../services/db')
const { requireAuth, optionalAuth } = require('../middleware/auth')
const { success, error, listResult } = require('../utils/response')

// ==================== 宠物 CRUD ====================

/**
 * GET /api/pets - 宠物列表（分页+筛选+搜索）
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const { category, gender, search, pageNum = 1, pageSize = 20 } = req.query
    const conditions = ['p.openid = ?']
    const params = [req.openid]

    if (category && category !== '全部') {
      conditions.push('p.category = ?')
      params.push(category)
    }
    if (gender && gender !== '全部') {
      conditions.push('p.gender = ?')
      params.push(gender)
    }
    if (search) {
      conditions.push('(p.name LIKE ? OR p.alias LIKE ?)')
      params.push(`%${search}%`, `%${search}%`)
    }

    const where = conditions.join(' AND ')
    const offset = (parseInt(pageNum) - 1) * parseInt(pageSize)

    const [totalRow] = await query(`SELECT COUNT(*) as total FROM pets p WHERE ${where}`, params)
    const total = totalRow.total

    const list = await query(
      `SELECT * FROM pets p WHERE ${where} ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    )

    // 转换字段名（下划线 → 驼峰）
    const mapped = list.map(p => mapPet(p))

    return res.json(listResult(mapped, total, parseInt(pageNum), parseInt(pageSize)))
  } catch (err) {
    console.error('[Pet] 列表查询失败:', err)
    return res.json(error('获取宠物列表失败'))
  }
})

/**
 * GET /api/pets/:id - 宠物详情
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const pet = await getOne('SELECT * FROM pets WHERE id = ? AND openid = ?', [req.params.id, req.openid])
    if (!pet) return res.json(error('宠物不存在'))
    return res.json(success(mapPet(pet)))
  } catch (err) {
    return res.json(error('获取宠物详情失败'))
  }
})

/**
 * POST /api/pets - 创建宠物
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, alias, category, gender, fatherId, motherId, partnerId, partnerName, price, status, isPublic, photos } = req.body

    if (!name) return res.json(error('宠物名称不能为空'))

    // 数量限制检查
    const configRow = await getOne('SELECT config_value FROM system_config WHERE config_key = ?', ['maxPetCount'])
    const maxPetCount = parseInt(configRow?.config_value) || 10
    const countRow = await getOne('SELECT COUNT(*) as cnt FROM pets WHERE openid = ?', [req.openid])
    if (countRow.cnt >= maxPetCount) {
      return res.json(error(`已达到最大宠物数量限制（${maxPetCount}只），无法继续添加`))
    }

    // 别名唯一性校验
    if (alias && alias.trim()) {
      const existing = await getOne('SELECT id FROM pets WHERE alias = ? AND openid = ?', [alias.trim(), req.openid])
      if (existing) return res.json(error(`别名「${alias.trim()}」已存在，请使用其他别名`))
    }

    const petId = await insert(
      `INSERT INTO pets (openid, name, alias, category, gender, father_id, mother_id, partner_id, partner_name, price, status, is_public, photos, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        req.openid, name, alias || '', category || '无', gender || '未知',
        fatherId || null, motherId || null, partnerId || null, partnerName || '',
        price || '', status || '正常', isPublic ? 1 : 0,
        photos ? JSON.stringify(photos) : null
      ]
    )

    // 同步分类
    if (category && category !== '无') {
      await syncCategory(category, req.openid)
    }

    return res.json(success({ id: petId }, '创建成功'))
  } catch (err) {
    console.error('[Pet] 创建失败:', err)
    return res.json(error(err.message || '创建宠物失败'))
  }
})

/**
 * PUT /api/pets/:id - 更新宠物
 */
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const pet = await getOne('SELECT * FROM pets WHERE id = ? AND openid = ?', [req.params.id, req.openid])
    if (!pet) return res.json(error('宠物不存在或无权限'))

    const { name, alias, category, gender, fatherId, motherId, partnerId, partnerName, price, status, isPublic, photos } = req.body

    // 别名唯一性校验（排除自己）
    if (alias && alias.trim()) {
      const existing = await getOne('SELECT id FROM pets WHERE alias = ? AND openid = ? AND id != ?',
        [alias.trim(), req.openid, req.params.id])
      if (existing) return res.json(error(`别名「${alias.trim()}」已存在，请使用其他别名`))
    }

    const sets = []
    const params = []
    const add = (col, val) => { sets.push(`${col} = ?`); params.push(val) }

    if (name !== undefined) add('name', name)
    if (alias !== undefined) add('alias', alias)
    if (category !== undefined) add('category', category)
    if (gender !== undefined) add('gender', gender)
    if (fatherId !== undefined) add('father_id', fatherId || null)
    if (motherId !== undefined) add('mother_id', motherId || null)
    if (partnerId !== undefined) add('partner_id', partnerId || null)
    if (partnerName !== undefined) add('partner_name', partnerName)
    if (price !== undefined) add('price', price)
    if (status !== undefined) add('status', status)
    if (isPublic !== undefined) add('is_public', isPublic ? 1 : 0)
    if (photos !== undefined) add('photos', JSON.stringify(photos))
    // updated_at 由 ON UPDATE CURRENT_TIMESTAMP 自动维护，无需手动设置

    params.push(req.params.id)
    await execute(`UPDATE pets SET ${sets.join(', ')} WHERE id = ?`, params)

    // 同步分类
    if (category && category !== '无') {
      await syncCategory(category, req.openid)
    }

    return res.json(success(null, '更新成功'))
  } catch (err) {
    console.error('[Pet] 更新失败:', err)
    return res.json(error(err.message || '更新宠物失败'))
  }
})

/**
 * DELETE /api/pets/:id - 删除宠物（级联删除记录）
 */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const pet = await getOne('SELECT * FROM pets WHERE id = ? AND openid = ?', [req.params.id, req.openid])
    if (!pet) return res.json(error('宠物不存在或无权限'))

    await execute('DELETE FROM pets WHERE id = ?', [req.params.id])
    await execute('DELETE FROM records WHERE pet_id = ?', [req.params.id])

    return res.json(success(null, '删除成功'))
  } catch (err) {
    return res.json(error('删除宠物失败'))
  }
})

// ==================== 公开档案 ====================

/**
 * GET /api/pets/public/:userId - 公开宠物列表（含最新产蛋/交配 + 主人名片）
 */
router.get('/public/:userId', async (req, res) => {
  try {
    const { userId } = req.params

    const pets = await query(
      'SELECT * FROM pets WHERE openid = ? AND is_public = 1 ORDER BY created_at DESC',
      [userId]
    )

    // 同时查询主人名片
    const owner = await getOne(
      'SELECT nickname, avatar, public_specialty, public_wechat_id, public_wechat_public, public_region, public_tags, public_intro, public_cover FROM users WHERE openid = ?',
      [userId]
    )

    const publicShareInfo = owner ? {
      specialty: owner.public_specialty || '',
      wechatId: owner.public_wechat_id || '',
      wechatPublic: !!owner.public_wechat_public,
      region: owner.public_region || '',
      tags: owner.public_tags || [],
      intro: owner.public_intro || '',
      cover: owner.public_cover || ''
    } : null

    // 为每个宠物附加最新产蛋和交配记录
    if (pets.length > 0) {
      const petIds = pets.map(p => p.id)
      const placeholders = petIds.map(() => '?').join(',')

      const latestEggs = await query(
        `SELECT r.* FROM records r WHERE r.openid = ? AND r.type = '产蛋' AND r.pet_id IN (${placeholders}) ORDER BY r.date DESC`,
        [userId, ...petIds]
      )
      const latestPairs = await query(
        `SELECT r.* FROM records r WHERE r.openid = ? AND r.type = '交配' AND r.pet_id IN (${placeholders}) ORDER BY r.date DESC`,
        [userId, ...petIds]
      )

      const eggMap = {}, pairMap = {}
      latestEggs.forEach(r => { if (!eggMap[r.pet_id]) eggMap[r.pet_id] = r })
      latestPairs.forEach(r => { if (!pairMap[r.pet_id]) pairMap[r.pet_id] = r })

      const now = new Date()
      pets.forEach(pet => {
        pet.latestEgg = eggMap[pet.id] || null
        pet.latestPairing = pairMap[pet.id] || null
        if (pet.latestEgg && pet.latestEgg.date) {
          const eggDate = new Date(pet.latestEgg.date)
          pet.eggDaysSince = Math.floor((now - eggDate) / 86400000)
        }
      })
    }

    return res.json(success({
      pets: pets.map(p => mapPet(p)),
      ownerNickname: owner?.nickname || '',
      ownerAvatar: owner?.avatar || '',
      publicShareInfo
    }))
  } catch (err) {
    console.error('[Pet] 公开列表查询失败:', err)
    return res.json(error('获取公开宠物列表失败'))
  }
})

/**
 * GET /api/pets/public/detail/:id - 公开宠物详情
 */
router.get('/public/detail/:id', async (req, res) => {
  try {
    const pet = await getOne('SELECT * FROM pets WHERE id = ? AND is_public = 1', [req.params.id])
    if (!pet) return res.json(error('该宠物未公开或不存在'))
    return res.json(success(mapPet(pet)))
  } catch (err) {
    return res.json(error('获取公开宠物详情失败'))
  }
})

// ==================== 家谱 ====================

/**
 * GET /api/pets/:id/pedigree - 家谱树查询
 */
router.get('/:id/pedigree', requireAuth, async (req, res) => {
  try {
    const pet = await getOne('SELECT * FROM pets WHERE id = ? AND openid = ?', [req.params.id, req.openid])
    if (!pet) return res.json(error('宠物不存在或无权限'))

    const maxGeneration = parseInt(req.query.maxGeneration) || 3
    const fullTree = await buildPedigreeTree(pet, req.openid, 0, maxGeneration)

    // 统计
    const stats = { totalAncestors: 0, maleCount: 0, femaleCount: 0, maxDepth: 0 }
    countTree(fullTree, 0, stats)

    return res.json(success({
      current: mapPet(pet),
      fullTree,
      maxGeneration,
      stats
    }))
  } catch (err) {
    console.error('[Pet] 家谱查询失败:', err)
    return res.json(error('获取家谱失败'))
  }
})

async function buildPedigreeTree(pet, openid, generation, maxGeneration) {
  if (!pet || generation >= maxGeneration) return null

  const node = { ...mapPet(pet), generation, father: null, mother: null }

  if (pet.father_id) {
    const father = await getOne('SELECT * FROM pets WHERE id = ? AND openid = ?', [pet.father_id, openid])
    if (father) node.father = await buildPedigreeTree(father, openid, generation + 1, maxGeneration)
  }
  if (pet.mother_id) {
    const mother = await getOne('SELECT * FROM pets WHERE id = ? AND openid = ?', [pet.mother_id, openid])
    if (mother) node.mother = await buildPedigreeTree(mother, openid, generation + 1, maxGeneration)
  }

  return node
}

function countTree(node, depth, stats) {
  if (!node) return
  if (depth > 0) {
    stats.totalAncestors++
    if (node.gender === '公') stats.maleCount++
    if (node.gender === '母') stats.femaleCount++
  }
  stats.maxDepth = Math.max(stats.maxDepth, depth)
  if (node.father) countTree(node.father, depth + 1, stats)
  if (node.mother) countTree(node.mother, depth + 1, stats)
}

// ==================== 辅助函数 ====================

/** 数据库字段 → 前端驼峰 */
function mapPet(p) {
  if (!p) return p
  return {
    id: p.id,
    openid: p.openid,
    name: p.name,
    alias: p.alias,
    category: p.category,
    gender: p.gender,
    fatherId: p.father_id,
    motherId: p.mother_id,
    partnerId: p.partner_id,
    partnerName: p.partner_name,
    price: p.price,
    status: p.status,
    isPublic: !!p.is_public,
    photos: parseJson(p.photos),
    createdAt: p.created_at,
    updatedAt: p.updated_at
  }
}

function parseJson(val) {
  if (!val) return []
  if (Array.isArray(val)) return val
  try { return JSON.parse(val) } catch (_) { return [] }
}

/** 同步分类到 categories 表 */
async function syncCategory(name, openid) {
  const existing = await getOne('SELECT id FROM categories WHERE openid = ? AND name = ?', [openid, name])
  if (!existing) {
    await insert('INSERT INTO categories (openid, name, created_at) VALUES (?, ?, NOW())', [openid, name])
  }
}

module.exports = router
