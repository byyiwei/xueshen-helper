/**
 * QRCode 路由 - 小程序码、URL Link 生成
 * 对应原 qrcode 云函数
 */
const express = require('express')
const router = express.Router()
const path = require('path')
const fs = require('fs')
const { getWxaCode, generateUrlLink } = require('../services/wechat')
const { success, error } = require('../utils/response')
const config = require('../config')

/** POST /api/qrcode/generate */
router.post('/generate', async (req, res) => {
  try {
    const { scene, page } = req.body
    const buffer = await getWxaCode(
      (page || 'pages/login/index') + '?scene=' + encodeURIComponent(scene || 'guest'),
      430
    )
    const dir = path.join(config.upload.baseDir, 'qrcode')
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    const filename = `qrcode_${Date.now()}.png`
    fs.writeFileSync(path.join(dir, filename), buffer)
    return res.json(success(`uploads/qrcode/${filename}`))
  } catch (err) {
    return res.json(error(err.message || '生成小程序码失败'))
  }
})

/** POST /api/qrcode/url-link */
router.post('/url-link', async (req, res) => {
  try {
    const { petId, recordId } = req.body
    if (!petId) return res.json(error('缺少 petId'))

    const pagePath = 'pages/pet/detail'
    const query = `petId=${encodeURIComponent(petId)}` + (recordId ? `&recordId=${encodeURIComponent(recordId)}&from=scan` : '&from=scan')

    let urlLink = ''
    for (const env of ['develop', 'trial', 'release']) {
      if (urlLink) break
      try {
        const result = await generateUrlLink(pagePath, query, env)
        urlLink = result.url_link || ''
      } catch (_) {}
    }
    if (!urlLink) urlLink = 'https://wxapp.page/pet/detail?scene=' + encodeURIComponent('petId=' + petId + (recordId ? '&recordId=' + recordId + '&from=scan' : '&from=scan'))
    return res.json(success({ urlLink }))
  } catch (err) {
    return res.json(error(err.message || '生成URL Link失败'))
  }
})

module.exports = router
