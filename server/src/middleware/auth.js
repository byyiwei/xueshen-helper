const jwt = require('jsonwebtoken')
const config = require('../config')
const { error } = require('../utils/response')

/**
 * 必须登录 —— 验证 JWT token，解析出 openid 注入 req
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''

  if (!token) {
    return res.json(error('请先登录'))
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret)
    req.openid = decoded.openid
    next()
  } catch (err) {
    return res.json(error('登录已过期，请重新登录'))
  }
}

/**
 * 可选登录 —— 有 token 就解析，没有也不报错
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''

  if (token) {
    try {
      const decoded = jwt.verify(token, config.jwt.secret)
      req.openid = decoded.openid
    } catch (_) { /* token 无效，忽略 */ }
  }
  next()
}

/**
 * 必须管理员 —— 在 requireAuth 之后使用
 */
async function requireAdmin(req, res, next) {
  if (!req.openid) {
    return res.json(error('请先登录'))
  }
  try {
    const { getOne } = require('../services/db')
    const admin = await getOne(
      'SELECT id FROM admins WHERE openid = ? AND enabled = 1',
      [req.openid]
    )
    if (!admin) {
      return res.json(error('无管理员权限'))
    }
    next()
  } catch (err) {
    return res.json(error('权限校验失败'))
  }
}

/**
 * 签发 JWT
 */
function signToken(openid) {
  return jwt.sign({ openid }, config.jwt.secret, { expiresIn: config.jwt.expiresIn })
}

module.exports = { requireAuth, optionalAuth, requireAdmin, signToken }
