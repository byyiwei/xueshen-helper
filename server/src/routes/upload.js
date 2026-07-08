/**
 * Upload 路由 - 图片上传（含自动微信安全审核）
 * 存储路径：uploads/{openid}/YYYY/MM/DD/{prefix}_{timestamp}_{random}.{ext}
 */
const express = require('express')
const router = express.Router()
const { requireAuth } = require('../middleware/auth')
const { uploadSingle, uploadMultiple, getRelativePath, getPublicUrl, submitSecurityCheck } = require('../middleware/upload')
const { success, error } = require('../utils/response')

/** POST /api/upload */
router.post('/', requireAuth, (req, res) => {
  uploadSingle(req, res, async (err) => {
    if (err) return res.json(error(err.message || '上传失败'))
    if (!req.file) return res.json(error('请选择文件'))

    const relativePath = getRelativePath(req.file)
    const publicUrl = getPublicUrl(relativePath)

    // 异步提交微信安全审核
    submitSecurityCheck(relativePath, req.openid, {
      scene: req.body.scene || 'pet',
      bizId: req.body.bizId || ''
    }).catch(() => {})

    return res.json(success({ path: relativePath, url: publicUrl, openid: req.openid }))
  })
})

/** POST /api/upload/multiple */
router.post('/multiple', requireAuth, (req, res) => {
  uploadMultiple(req, res, async (err) => {
    if (err) return res.json(error(err.message || '上传失败'))
    if (!req.files || req.files.length === 0) return res.json(error('请选择文件'))

    const files = req.files.map(file => {
      const rp = getRelativePath(file)
      return { path: rp, url: getPublicUrl(rp) }
    })

    const scene = req.body.scene || 'pet'
    const bizId = req.body.bizId || ''
    Promise.allSettled(files.map(f => submitSecurityCheck(f.path, req.openid, { scene, bizId }))).catch(() => {})

    return res.json(success({ files, openid: req.openid }))
  })
})

module.exports = router
