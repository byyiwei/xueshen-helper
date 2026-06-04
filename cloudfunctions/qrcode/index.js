const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event, context) => {
  const { action, data } = event

  if (action === 'generate') {
    return await generateQrcode(data)
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
    console.log('开始生成小程序码, scene:', sceneStr, 'page:', pagePath)

    // 使用 get() 而非 getUnlimited()，开发阶段未发布也可生成
    const result = await cloud.openapi.wxacode.get({
      path: pagePath + '?scene=' + encodeURIComponent(sceneStr),
      width: 430,
      isHyaline: false
    })

    console.log('小程序码生成成功, buffer类型:', typeof result.buffer)

    // 上传到云存储
    const uploadResult = await cloud.uploadFile({
      cloudPath: 'qrcode/' + Date.now() + '.png',
      fileContent: result.buffer
    })

    console.log('上传成功, fileID:', uploadResult.fileID)

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