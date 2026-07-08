/**
 * Admin JWT 认证中间件
 * 用于独立 Web 后台的账号密码登录认证，与微信登录 JWT 解耦
 */
const jwt = require('jsonwebtoken')
const config = require('../config')
const { error } = require('../utils/response')

/**
 * Admin JWT 验证中间件
 * token 中存储: { adminId, username, role }
 */
function requireAdminAuth(req, res, next) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''

  if (!token) {
    return res.json(error('请先登录管理后台'))
  }

  try {
    const decoded = jwt.verify(token, config.jwt.adminSecret)
    if (!decoded.adminId) {
      return res.json(error('无效的登录凭证'))
    }
    req.adminId = decoded.adminId
    req.adminUsername = decoded.username
    req.adminRole = decoded.role
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.json(error('登录已过期，请重新登录'))
    }
    return res.json(error('无效的登录凭证'))
  }
}

/**
 * 签发 Admin JWT
 * @param {object} admin - { id, username, role }
 */
function signAdminToken(admin) {
  return jwt.sign(
    {
      adminId: admin.id,
      username: admin.username,
      role: admin.role || 'admin'
    },
    config.jwt.adminSecret,
    { expiresIn: '12h' }
  )
}

module.exports = { requireAdminAuth, signAdminToken }
