/**
 * 微信 API 工具层
 * - access_token 自动管理（数据库缓存 + 内存缓存）
 * - 所有微信服务端 API 统一出口
 */
const axios = require('axios')
const { getOne, query, insert, execute } = require('./db')
const config = require('../config')

// 内存缓存
let cachedToken = null
let tokenExpireTime = 0

/**
 * 获取全局 access_token（自动刷新）
 */
async function getAccessToken() {
  const now = Date.now()

  // 内存缓存有效（提前5分钟过期）
  if (cachedToken && now < tokenExpireTime - 5 * 60 * 1000) {
    return cachedToken
  }

  // 尝试从数据库读取未过期的 token
  const dbToken = await getOne(
    'SELECT token, expires_at FROM wechat_token WHERE expires_at > NOW() ORDER BY id DESC LIMIT 1'
  )
  if (dbToken) {
    cachedToken = dbToken.token
    tokenExpireTime = new Date(dbToken.expires_at).getTime()
    if (now < tokenExpireTime - 5 * 60 * 1000) {
      return cachedToken
    }
  }

  // 从微信获取新 token（使用数据库锁简单防止并发刷新）
  const { appId, appSecret } = config.wechat
  if (!appId || !appSecret) {
    throw new Error('未配置微信 AppID/AppSecret，请在系统配置中设置')
  }

  try {
    const res = await axios.get('https://api.weixin.qq.com/cgi-bin/token', {
      params: {
        grant_type: 'client_credential',
        appid: appId,
        secret: appSecret
      }
    })

    if (res.data.errcode) {
      throw new Error(`获取access_token失败: ${res.data.errmsg} (${res.data.errcode})`)
    }

    const token = res.data.access_token
    const expiresIn = res.data.expires_in || 7200
    const expiresAt = new Date(Date.now() + expiresIn * 1000)

    // 存入数据库
    await execute('DELETE FROM wechat_token WHERE expires_at < NOW()')
    await insert(
      'INSERT INTO wechat_token (token, expires_at) VALUES (?, ?)',
      [token, expiresAt]
    )

    cachedToken = token
    tokenExpireTime = expiresAt.getTime()
    return token
  } catch (err) {
    throw new Error(`获取微信access_token失败: ${err.message}`)
  }
}

/**
 * 通用微信 API 调用
 */
async function callWechatApi(url, params = {}, method = 'GET') {
  const token = await getAccessToken()
  const config = {
    method,
    url: `https://api.weixin.qq.com${url}`,
    timeout: 15000
  }
  if (method === 'GET') {
    config.params = { ...params, access_token: token }
  } else {
    config.params = { access_token: token }
    config.data = params
  }
  const res = await axios(config)
  if (res.data.errcode && res.data.errcode !== 0) {
    throw new Error(`微信API错误: ${res.data.errmsg} (code: ${res.data.errcode})`)
  }
  return res.data
}

// ==================== 具体 API ====================

/**
 * code2Session —— 登录换取 openid
 */
async function code2Session(code) {
  const { appId, appSecret } = config.wechat
  const res = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
    params: { appid: appId, secret: appSecret, js_code: code, grant_type: 'authorization_code' }
  })
  if (res.data.errcode) {
    throw new Error(`code2Session失败: ${res.data.errmsg}`)
  }
  return res.data // { openid, session_key, unionid }
}

/**
 * 生成小程序码（有限数量版）
 */
async function getWxaCode(path, width = 430) {
  const token = await getAccessToken()
  const res = await axios.post(
    `https://api.weixin.qq.com/wxa/getwxacode?access_token=${token}`,
    { path, width },
    { responseType: 'arraybuffer' }
  )
  // 检查是否返回了 JSON 错误
  const contentType = res.headers['content-type'] || ''
  if (contentType.includes('application/json')) {
    const text = Buffer.from(res.data).toString('utf8')
    const json = JSON.parse(text)
    throw new Error(`生成小程序码失败: ${json.errmsg}`)
  }
  return Buffer.from(res.data)
}

/**
 * 生成 URL Link
 */
async function generateUrlLink(path, query, envVersion = 'release') {
  return await callWechatApi('/wxa/generate_urllink', {
    path,
    query,
    expire_type: 0, // 永久有效
    env_version: envVersion
  }, 'POST')
}

/**
 * 文本安全审核
 */
async function msgSecCheck(openid, content, scene = 2) {
  return await callWechatApi('/wxa/msg_sec_check', {
    openid,
    content,
    version: 2,
    scene
  }, 'POST')
}

/**
 * 图片安全审核（异步）
 */
async function mediaCheckAsync(openid, mediaUrl, scene = 1) {
  return await callWechatApi('/wxa/media_check_async', {
    openid,
    media_url: mediaUrl,
    media_type: 2,
    version: 2,
    scene
  }, 'POST')
}

/**
 * 发送订阅消息
 */
async function sendSubscribeMessage(openid, templateId, data, page = '') {
  return await callWechatApi('/cgi-bin/message/subscribe/send', {
    touser: openid,
    template_id: templateId,
    page,
    data
  }, 'POST')
}

module.exports = {
  getAccessToken,
  code2Session,
  getWxaCode,
  generateUrlLink,
  msgSecCheck,
  mediaCheckAsync,
  sendSubscribeMessage
}
