/**
 * 文件上传中间件（multer 封装）
 * 
 * 存储路径设计（按 openid 隔离，避免用户图片混用）：
 *   uploads/{openid}/{YYYY}/{MM}/{DD}/{prefix}_{timestamp}_{random}.{ext}
 * 
 * 上传后自动触发微信图片安全审核（异步，不阻塞上传流程）
 */
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')
const config = require('../config')

// 确保上传目录存在
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

// 从 req 中提取用户的 openid（由 requireAuth 中间件注入）
function getOpenId(req) {
  return req.openid || (req.adminId ? 'admin_' + req.adminId : 'anonymous')
}

// 生成存储路径: uploads/{openid}/YYYY/MM/DD/
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const openid = getOpenId(req)
    const now = new Date()
    const year = now.getFullYear().toString()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    // 按 openid 隔离 → uploads/{openid}/2026/06/24/
    const dir = path.join(config.upload.baseDir, openid, year, month, day)
    ensureDir(dir)
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg'
    const prefix = req.body.prefix || 'img'
    const random = crypto.randomBytes(3).toString('hex')
    const filename = `${prefix}_${Date.now()}_${random}${ext}`
    cb(null, filename)
  }
})

// 文件类型过滤
function fileFilter(req, file, cb) {
  if (config.upload.allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error(`不支持的文件类型: ${file.mimetype}`), false)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxFileSize
  }
})

/**
 * 单文件上传
 */
const uploadSingle = upload.single('file')

/**
 * 多文件上传（最多9张）
 */
const uploadMultiple = upload.array('files', 9)

/**
 * 从 multer 结果中提取相对路径（相对于 uploads 根目录）
 * 例如: uploads/oZ_xxx/2026/06/24/pet_1234567890_abc.jpg
 */
function getRelativePath(file) {
  const normalized = file.path.replace(/\\/g, '/')
  const idx = normalized.indexOf('uploads/')
  return idx >= 0 ? normalized.slice(idx) : normalized
}

/**
 * 构建公开访问 URL
 */
function getPublicUrl(relativePath) {
  const baseUrl = (config.baseUrl || '').replace(/\/$/, '')
  return `${baseUrl}/${relativePath}`
}

/**
 * 上传后自动提交微信图片安全审核（异步，不阻塞）
 * 
 * @param {string} relativePath - 图片相对路径
 * @param {string} openid - 用户openid
 * @param {object} options - 审核选项
 * @param {string} options.scene - 审核场景: avatar/cover/pet/footprint
 * @param {string} options.bizId - 业务关联ID
 */
async function submitSecurityCheck(relativePath, openid, options = {}) {
  if (!openid || openid === 'anonymous') return

  try {
    const { mediaCheckAsync } = require('../services/wechat')
    const publicUrl = getPublicUrl(relativePath)
    const scene = options.scene || 'pet'

    // 场景值映射（微信官方）
    const sceneMap = { avatar: 1, cover: 1, pet: 1, footprint: 4, comment: 2 }
    const sceneValue = sceneMap[scene] || 1

    const result = await mediaCheckAsync(openid, publicUrl, sceneValue)

    // 记录审核日志到数据库
    try {
      const { insert } = require('../services/db')
      await insert(
        `INSERT INTO security_logs (file_id, scene, scene_tag, biz_id, openid, trace_id, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())`,
        [relativePath, sceneValue, scene, options.bizId || '', openid, result.trace_id || '']
      )
    } catch (dbErr) {
      console.error('[上传审核] 写入审核日志失败:', dbErr.message)
    }

    console.log(`[上传审核] 已提交: openid=${openid}, scene=${scene}, file=${relativePath}`)
    return result
  } catch (err) {
    // 审核提交失败不应阻塞上传流程
    console.error(`[上传审核] 提交失败:`, err.message)
    return null
  }
}

/**
 * 批量处理上传文件的安全审核
 * 用于在路由层调用，而非 multer 中间件内部
 */
async function checkUploadedFiles(files, openid, scene, bizId) {
  if (!files || files.length === 0) return
  const checks = files.map(file => {
    const relativePath = getRelativePath(file)
    return submitSecurityCheck(relativePath, openid, { scene, bizId })
  })
  // 全部 fire-and-forget，不等待结果
  Promise.allSettled(checks).catch(() => {})
}

module.exports = {
  uploadSingle,
  uploadMultiple,
  getRelativePath,
  getPublicUrl,
  submitSecurityCheck,
  checkUploadedFiles,
  ensureDir
}
