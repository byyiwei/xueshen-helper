// 图片处理工具

// 云开发环境ID（与app.js中wx.cloud.init的env保持一致）
const CLOUD_ENV_ID = 'cloud1-d0g853l9d7017ea3b'

/**
 * 从临时URL中提取fileID
 * 临时URL: https://636c-cloud1-d0g853l9d7017ea3b-1437722068.tcb.qcloud.la/pets/xxx.jpg?sign=xxx
 * fileID:   cloud://cloud1-d0g853l9d7017ea3b.636c-cloud1-d0g853l9d7017ea3b-1437722068/pets/xxx.jpg
 */
function extractFileIdFromTempUrl(url) {
  if (!url || !url.includes('tcb.qcloud.la')) return null
  
  try {
    // 提取域名前缀和文件路径
    const match = url.match(/^https?:\/\/([^\/]+)(\/[^\?]+)/)
    if (!match) return null
    
    const domain = match[1] // 636c-cloud1-d0g853l9d7017ea3b-1437722068.tcb.qcloud.la
    const filePath = match[2] // /pets/xxx.jpg
    
    // 去掉 .tcb.qcloud.la 后缀，得到域名前缀
    const domainPrefix = domain.replace('.tcb.qcloud.la', '') // 636c-cloud1-d0g853l9d7017ea3b-1437722068
    
    // fileID格式: cloud://环境ID.域名前缀/文件路径
    return `cloud://${CLOUD_ENV_ID}.${domainPrefix}${filePath}`
  } catch (error) {
    console.error('提取fileID失败:', error)
    return null
  }
}

/**
 * 批量转换云存储URL为临时访问链接（无缓存，每次获取最新链接）
 * @param {Array} pets - 宠物列表
 * @returns {Promise<Array>}
 */
async function convertPetPhotosToUrls(pets) {
  if (!pets || pets.length === 0) return pets

  const result = []

  for (const pet of pets) {
    if (pet.photos && pet.photos.length > 0) {
      const convertedPhotos = []
      for (const photo of pet.photos) {
        const convertedPhoto = await convertSinglePhoto(photo)
        convertedPhotos.push(convertedPhoto)
      }
      result.push({ ...pet, photos: convertedPhotos })
    } else {
      result.push(pet)
    }
  }

  return result
}

/**
 * 获取单个云文件的临时链接
 * @param {string} fileID 
 * @returns {Promise<string>}
 */
async function getTempUrl(fileID) {
  try {
    const result = await wx.cloud.getTempFileURL({
      fileList: [fileID]
    })
    const file = result.fileList && result.fileList[0]
    if (file && file.tempFileURL) {
      return file.tempFileURL
    }
    // fileID 可能无效，打印详细信息
    const errMsg = file ? (file.status + ' ' + (file.errMsg || '')) : 'fileList为空'
    console.warn('获取临时链接失败:', errMsg, 'fileID:', fileID)
    return fileID
  } catch (error) {
    // 网络错误（如 Failed to fetch）直接返回原 fileID，不抛出不阻塞
    console.error('获取临时URL失败:', error.message || error, 'fileID:', fileID)
    return fileID
  }
}

/**
 * 转换单个图片URL
 * @param {string} photo - 图片URL（可能是cloud://或临时URL）
 * @returns {Promise<string>}
 */
async function convertSinglePhoto(photo) {
  if (!photo) return photo

  // 如果已经是临时URL（非cloud://），直接返回
  if (photo.startsWith('http')) {
    return photo
  }

  // 如果是 cloud:// 格式，转换为临时URL
  if (photo.startsWith('cloud://')) {
    try {
      return await getTempUrl(photo)
    } catch (error) {
      console.error('转换cloud://图片失败:', photo, error)
      // 转换失败时保留原始fileID，不返回空字符串
      return photo
    }
  }

  // 其他格式直接返回
  return photo
}

/**
 * 批量转换图片ID列表为URL（无缓存，每次获取最新临时链接）
 * @param {Array} photoIDs 
 * @returns {Promise<Array>}
 */
async function convertPhotoIdsToUrls(photoIDs) {
  if (!photoIDs || photoIDs.length === 0) return []

  const result = []

  for (const photo of photoIDs) {
    const convertedPhoto = await convertSinglePhoto(photo)
    result.push(convertedPhoto)
  }

  return result
}

/**
 * 净化图片URL列表，将临时URL转为cloud://fileID，确保存入缓存的数据不会过期
 * @param {Array} photos - 图片URL列表
 * @returns {Array} 只包含cloud://fileID的列表
 */
function sanitizePhotoUrls(photos) {
  if (!photos || !Array.isArray(photos)) return []
  return photos.map(photo => {
    if (!photo) return photo
    if (photo.startsWith('cloud://')) return photo
    if (photo.includes('tcb.qcloud.la')) {
      const fileId = extractFileIdFromTempUrl(photo)
      return fileId || photo
    }
    return photo
  })
}

/**
 * 净化宠物列表的图片数据，确保存入缓存的数据不会过期
 * @param {Array} pets - 宠物列表
 * @returns {Array} photos字段只包含cloud://fileID的宠物列表
 */
function sanitizePetPhotos(pets) {
  if (!pets || !Array.isArray(pets)) return pets
  return pets.map(pet => {
    if (pet.photos && pet.photos.length > 0) {
      return { ...pet, photos: sanitizePhotoUrls(pet.photos) }
    }
    return pet
  })
}

module.exports = {
  convertPetPhotosToUrls,
  convertPhotoIdsToUrls,
  getTempUrl,
  convertSinglePhoto,
  extractFileIdFromTempUrl,
  sanitizePhotoUrls,
  sanitizePetPhotos
}
