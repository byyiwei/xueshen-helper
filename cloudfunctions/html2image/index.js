const cloud = require('wx-server-sdk')
const qcloud = require('cos-nodejs-sdk-v5')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const rp = require('request-promise')

// 默认配置
const DEFAULT_SERVICE_URL = 'http://192.168.110.29:3000'

exports.main = async (event, context) => {
  const { action, data } = event

  switch (action) {
    case 'generate':
      return await generateImage(data)
    case 'getConfig':
      return await getServiceConfig()
    case 'uploadToCloud':
      return await uploadToCloud(data)
    default:
      return { success: false, message: '未知操作' }
  }
}

/**
 * 获取图片生成服务配置
 */
async function getServiceConfig() {
  try {
    const configRes = await db.collection('systemConfig').limit(1).get()
    const config = configRes.data.length > 0 ? configRes.data[0] : {}
    
    return {
      success: true,
      data: {
        imageServerUrl: config.imageServerUrl || DEFAULT_SERVICE_URL,
        imageTimeout: config.imageTimeout || 60000,
        qcloudSecretId: config.qcloudSecretId || '',
        qcloudSecretKey: config.qcloudSecretKey || '',
        qcloudBucket: config.qcloudBucket || '',
        qcloudRegion: config.qcloudRegion || 'ap-guangzhou'
      }
    }
  } catch (error) {
    console.error('获取配置失败:', error)
    return {
      success: false,
      message: error.message
    }
  }
}

/**
 * 生成图片
 * @param {Object} data
 * @param {string} data.html - HTML 内容
 * @param {number} data.width - 宽度
 * @param {number} data.deviceScaleFactor - 缩放倍数
 * @param {string} data.format - 图片格式
 * @param {number} data.quality - 质量
 */
async function generateImage(data) {
  const { html, width = 750, deviceScaleFactor = 2, format = 'png', quality = 90 } = data

  if (!html) {
    return { success: false, message: '缺少 html 参数' }
  }

  try {
    // 获取服务配置
    const configRes = await db.collection('systemConfig').limit(1).get()
    const config = configRes.data.length > 0 ? configRes.data[0] : {}
    const serviceUrl = config.imageServerUrl || DEFAULT_SERVICE_URL
    const timeout = config.imageTimeout || 60000

    console.log('调用图片生成服务:', serviceUrl)

    const result = await rp({
      url: serviceUrl,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        html: html,
        options: {
          width: width,
          deviceScaleFactor: deviceScaleFactor,
          fullPage: true,
          format: format,
          quality: quality
        }
      },
      timeout: timeout,
      json: true
    })

    if (result.success) {
      // 如果配置了腾讯云 COS，上传到 COS
      if (config.qcloudSecretId && config.qcloudSecretKey && config.qcloudBucket) {
        try {
          const uploadResult = await uploadToCOS(result.image, format, config)
          if (uploadResult.success) {
            return {
              success: true,
              image: result.image,
              format: result.format,
              cosUrl: uploadResult.url,
              time: result.time
            }
          }
        } catch (cosError) {
          console.error('上传 COS 失败:', cosError)
          // 继续返回本地生成的图片，不影响主流程
        }
      }

      return {
        success: true,
        image: result.image,
        format: result.format,
        time: result.time
      }
    } else {
      return {
        success: false,
        error: result.error || '生成图片失败'
      }
    }
  } catch (error) {
    console.error('图片生成失败:', error)
    return {
      success: false,
      message: error.message || '调用图片服务失败',
      detail: error.toString()
    }
  }
}

/**
 * 上传图片到腾讯云 COS
 */
async function uploadToCOS(base64Image, format, config) {
  const cos = new qcloud.COS({
    SecretId: config.qcloudSecretId,
    SecretKey: config.qcloudSecretKey
  })

  const buffer = Buffer.from(base64Image, 'base64')
  const key = `images/${Date.now()}.${format}`

  return new Promise((resolve) => {
    cos.putObject({
      Bucket: config.qcloudBucket,
      Region: config.qcloudRegion || 'ap-guangzhou',
      Key: key,
      Body: buffer,
      ContentType: `image/${format}`,
      ACL: 'public-read'
    }, (err, data) => {
      if (err) {
        console.error('COS 上传失败:', err)
        resolve({ success: false, error: err.message })
      } else {
        const url = `https://${config.qcloudBucket}.cos.${config.qcloudRegion}.myqcloud.com/${key}`
        resolve({ success: true, url: url })
      }
    })
  })
}

/**
 * 上传图片到云开发存储
 */
async function uploadToCloud(data) {
  const { base64Image, format = 'png' } = data

  if (!base64Image) {
    return { success: false, message: '缺少 base64Image 参数' }
  }

  try {
    const buffer = Buffer.from(base64Image, 'base64')
    const cloudPath = `share/${Date.now()}.${format}`

    const result = await cloud.uploadFile({
      cloudPath: cloudPath,
      fileContent: buffer
    })

    return {
      success: true,
      fileID: result.fileID,
      cloudPath: cloudPath
    }
  } catch (error) {
    console.error('上传云存储失败:', error)
    return {
      success: false,
      message: error.message
    }
  }
}