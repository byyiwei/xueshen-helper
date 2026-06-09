const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event, context) => {
  const { action, data } = event

  if (action === 'generate') {
    return await generateQrcode(data)
  }

  if (action === 'generateUrlLink') {
    return await generateUrlLink(data)
  }

  return {
    success: false,
    message: '未知操作'
  }
}

async function generateQrcode(data) {
  const { scene, page } = data
  const sceneStr = scene || 'guest'
  const pagePath = page || 'pages/login/index'

  try {

    // 使用 get() 而非 getUnlimited()，开发阶段未发布也可生成
    const result = await cloud.openapi.wxacode.get({
      path: pagePath + '?scene=' + encodeURIComponent(sceneStr),
      width: 430,
      isHyaline: false
    })

    // 上传到云存储
    const uploadResult = await cloud.uploadFile({
      cloudPath: 'qrcode/' + Date.now() + '.png',
      fileContent: result.buffer
    })

    return {
      success: true,
      data: uploadResult.fileID
    }

  } catch (error) {
    console.error('生成小程序码失败:', error)
    console.error('错误代码:', error.errCode)
    console.error('错误信息:', error.errMsg)

    return {
      success: false,
      errCode: error.errCode,
      message: error.errMsg || error.message || '生成失败',
      detail: JSON.stringify(error)
    }
  }
}

// 生成 URL Link（用于标签二维码，永久有效）
// 返回 urlLink 文本，QR 码图片由客户端本地生成
async function generateUrlLink(data) {
  const { petId, recordId } = data
  if (!petId) {
    return { success: false, message: '缺少 petId' }
  }

  try {
    const pagePath = 'pages/pet/detail'
    const query = `petId=${encodeURIComponent(petId)}` +
                 (recordId ? `&recordId=${encodeURIComponent(recordId)}&from=scan` : '&from=scan')

    let urlLink = ''

    // 多环境尝试生成 URL Link（预览/体验/正式）
    const envVersions = ['develop', 'trial', 'release']
    for (const envVersion of envVersions) {
      if (urlLink) break
      try {
        const result = await cloud.openapi.urlLink.generate({
          path: pagePath,
          query: query,
          expire_type: 0,
          env_version: envVersion
        })
        urlLink = result.urlLink
      } catch (urlErr) {
        console.error('urlLink.generate 失败 (env=' + envVersion + ', errCode:', urlErr.errCode, ')')
      }
    }

    // 全部失败，使用纯文本 fallback
    if (!urlLink) {
      const scene = 'petId=' + petId + (recordId ? '&recordId=' + recordId + '&from=scan' : '&from=scan')
      urlLink = 'https://wxapp.page/pet/detail?scene=' + encodeURIComponent(scene)

    }

    return {
      success: true,
      data: {
        urlLink: urlLink
      }
    }

  } catch (error) {
    console.error('generateUrlLink 整体失败:', error)
    return {
      success: false,
      errCode: error.errCode,
      message: error.errMsg || error.message || '生成失败'
    }
  }
}