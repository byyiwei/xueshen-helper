/**
 * Speech 路由 - 语音识别
 * 对应原 speech 云函数
 */
const express = require('express')
const router = express.Router()
const { requireAuth } = require('../middleware/auth')
const { getOne } = require('../services/db')
const { success, error } = require('../utils/response')

let asrClient = null, lastSecretId = null, lastSecretKey = null

/** POST /api/speech/recognize */
router.post('/recognize', requireAuth, async (req, res) => {
  try {
    // 从数据库获取 ASR 配置
    const [sidRow, skeyRow, regionRow] = await Promise.all([
      getOne('SELECT config_value FROM system_config WHERE config_key = ?', ['asrSecretId']),
      getOne('SELECT config_value FROM system_config WHERE config_key = ?', ['asrSecretKey']),
      getOne('SELECT config_value FROM system_config WHERE config_key = ?', ['asrRegion'])
    ])
    const secretId = sidRow?.config_value || ''
    const secretKey = skeyRow?.config_value || ''
    const region = regionRow?.config_value || 'ap-guangzhou'

    if (!secretId || !secretKey) {
      return res.json(error('请配置腾讯云语音识别密钥：后台管理 → 系统配置'))
    }

    // 懒初始化客户端
    if (!asrClient || secretId !== lastSecretId || secretKey !== lastSecretKey) {
      const tencentcloud = require('tencentcloud-sdk-nodejs')
      asrClient = new tencentcloud.asr.v20190614.Client({
        credential: { secretId, secretKey },
        region,
        profile: { httpProfile: { endpoint: 'asr.tencentcloudapi.com' } }
      })
      lastSecretId = secretId; lastSecretKey = secretKey
    }

    const { audioBase64 } = req.body
    if (!audioBase64) return res.json(error('缺少音频数据'))

    const resp = await asrClient.SentenceRecognition({
      EngSerViceType: '16k_zh', SourceType: 1, VoiceFormat: 'mp3', Data: audioBase64
    })
    return res.json(success({ text: resp.Result || '' }))
  } catch (err) {
    console.error('[Speech] 识别失败:', err)
    return res.json(error('语音识别失败: ' + err.message))
  }
})

/** GET /api/speech/config */
router.get('/config', requireAuth, async (req, res) => {
  try {
    const [sid, skey] = await Promise.all([
      getOne('SELECT config_value FROM system_config WHERE config_key = ?', ['asrSecretId']),
      getOne('SELECT config_value FROM system_config WHERE config_key = ?', ['asrSecretKey'])
    ])
    return res.json(success({ configured: !!(sid?.config_value && skey?.config_value) }))
  } catch (err) {
    return res.json(error('获取配置失败'))
  }
})

module.exports = router
