/**
 * Category 路由 - 用户自定义分类管理
 */
const express = require('express')
const router = express.Router()
const { query, getOne, insert, execute } = require('../services/db')
const { requireAuth } = require('../middleware/auth')
const { success, error } = require('../utils/response')

/** GET /api/categories */
router.get('/', requireAuth, async (req, res) => {
  try {
    const list = await buildCategoryList(req.openid)
    return res.json(success({ categories: list }))
  } catch (err) {
    return res.json(error('获取分类列表失败'))
  }
})

/** POST /api/categories */
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name } = req.body
    if (!name || !name.trim()) return res.json(error('分类名称不能为空'))

    const existing = await getOne('SELECT id FROM categories WHERE openid = ? AND name = ?', [req.openid, name.trim()])
    if (existing) return res.json(error(`分类「${name.trim()}」已存在`))

    await insert('INSERT INTO categories (openid, name, created_at) VALUES (?, ?, NOW())', [req.openid, name.trim()])
    const list = await buildCategoryList(req.openid)
    return res.json(success({ categories: list }, '添加成功'))
  } catch (err) {
    return res.json(error(err.message || '添加分类失败'))
  }
})

/** PUT /api/categories */
router.put('/', requireAuth, async (req, res) => {
  try {
    const { oldName, newName } = req.body
    if (!oldName || !newName) return res.json(error('分类名称不能为空'))
    if (oldName === '无') return res.json(error('不能修改默认分类'))
    if (newName === '无') return res.json(error('分类名称不能为"无"'))
    if (oldName === newName) {
      const list = await buildCategoryList(req.openid)
      return res.json(success({ categories: list }))
    }

    const existing = await getOne('SELECT id FROM categories WHERE openid = ? AND name = ?', [req.openid, newName.trim()])
    if (existing) return res.json(error(`分类「${newName.trim()}」已存在`))

    // 更新 categories 表
    await execute('UPDATE categories SET name = ? WHERE openid = ? AND name = ?', [newName.trim(), req.openid, oldName.trim()])
    // 同步更新 pets 表
    await execute('UPDATE pets SET category = ?, updated_at = NOW() WHERE openid = ? AND category = ?', [newName.trim(), req.openid, oldName.trim()])
    // 同步更新 tanks 表
    await execute('UPDATE tanks SET category = ? WHERE category = ?', [newName.trim(), oldName.trim()])

    const list = await buildCategoryList(req.openid)
    return res.json(success({ categories: list }, '修改成功'))
  } catch (err) {
    return res.json(error(err.message || '更新分类失败'))
  }
})

/** DELETE /api/categories */
router.delete('/', requireAuth, async (req, res) => {
  try {
    const { name } = req.body
    if (!name) return res.json(error('分类名称不能为空'))

    await execute('DELETE FROM categories WHERE openid = ? AND name = ?', [req.openid, name])
    await execute('UPDATE pets SET category = ?, updated_at = NOW() WHERE openid = ? AND category = ?', ['无', req.openid, name])
    await execute('UPDATE tanks SET category = ? WHERE category = ?', ['无', name])

    const list = await buildCategoryList(req.openid)
    return res.json(success({ categories: list }, '删除成功'))
  } catch (err) {
    return res.json(error('删除分类失败'))
  }
})

async function buildCategoryList(openid) {
  const [catRows, petRows] = await Promise.all([
    query('SELECT name FROM categories WHERE openid = ? ORDER BY created_at ASC', [openid]),
    query('SELECT DISTINCT category as name FROM pets WHERE openid = ?', [openid])
  ])
  const seen = new Set()
  const ordered = []
  const add = (n) => {
    const name = String(n || '').trim()
    if (!name || seen.has(name)) return
    seen.add(name)
    ordered.push(name)
  }
  add('无')
  catRows.forEach(r => add(r.name))
  petRows.forEach(r => { if (r.name && r.name !== '无') add(r.name) })
  return ordered.length > 0 ? ordered : ['无']
}

module.exports = router
