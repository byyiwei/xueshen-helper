/**
 * 图片处理工具 v2.0
 * 
 * 适配自建服务器 — 图片存储为 HTTP 相对路径（如 uploads/xxx/xxx.jpg）
 * 不再使用 cloud:// fileID，移除 wx.cloud.getTempFileURL 依赖
 *
 * 迁移兼容：如果数据中仍有 cloud:// 格式的旧图片，
 * 将尝试通过 baseUrl + 去除 cloud:// 前缀来访问
 */
const { getAPI } = require('./api.js')

/** 获取图片服务器基础 URL */
function getImageBaseUrl() {
  const app = getApp()
  const config = app?.globalData?.systemConfig || {}
  return config.imageServerUrl || config.apiUrl || 'https://pets.openget.cn'
}

/**
 * 将相对路径或旧 cloud:// 路径转为完整 HTTP URL
 * @param {string} photo - 图片路径
 * @returns {string} 完整 HTTP URL
 */
function photoToUrl(photo) {
  if (!photo) return photo
  // 已经是完整 HTTP URL 则直接返回
  if (photo.startsWith('http://') || photo.startsWith('https://')) return photo
  // cloud:// 旧格式 → 提取相对路径部分
  if (photo.startsWith('cloud://')) {
    // cloud://env.bucket/path/to/file.jpg → 提取 path/to/file.jpg
    const parts = photo.split('/')
    const idx = parts.findIndex(p => p.includes('.'))  // 找到域名部分
    if (idx >= 0 && idx < parts.length - 1) {
      photo = parts.slice(idx + 1).join('/')
    }
  }
  // 拼接完整 URL
  const base = getImageBaseUrl()
  if (photo.startsWith('/')) return base + photo
  return base + '/' + photo
}

/**
 * 批量转换图片路径为完整 HTTP URL
 * @param {Array<string>} photos - 图片路径列表
 * @returns {Array<string>} 完整 HTTP URL 列表
 */
function convertPhotosToUrls(photos) {
  if (!photos || !Array.isArray(photos)) return photos || []
  return photos.map(p => photoToUrl(p))
}

/**
 * 转换单个图片路径（同步，无需网络请求）
 * @param {string} photo - 图片路径
 * @returns {string}
 */
function convertSinglePhoto(photo) {
  return photoToUrl(photo)
}

/**
 * 批量转换宠物列表中的图片路径为完整 URL
 * @param {Array} pets - 宠物列表
 * @returns {Array}
 */
function convertPetPhotosToUrls(pets) {
  if (!pets || pets.length === 0) return pets
  return pets.map(pet => ({
    ...pet,
    photos: convertPhotosToUrls(pet.photos)
  }))
}

/**
 * 批量转换图片 ID 列表为 URL（兼容旧接口，现在无需异步）
 * @param {Array<string>} photoIDs
 * @returns {Array<string>}
 */
function convertPhotoIdsToUrls(photoIDs) {
  return convertPhotosToUrls(photoIDs)
}

/**
 * 获取图片的 HTTP URL（替代云开发临时链接）
 * v2.0: 不再调用 wx.cloud.getTempFileURL，直接基于 photoToUrl 转换
 * @param {string} fileID - 图片路径（HTTP URL / cloud:// / 相对路径）
 * @returns {Promise<string>}
 */
async function getTempUrl(fileID) {
  if (!fileID) return fileID
  // 直接同步转换为 HTTP URL（无需网络请求）
  return photoToUrl(fileID)
}

/**
 * 净化图片 URL 列表（适配自建服务器，无需转换）
 * @param {Array} photos
 * @returns {Array}
 */
function sanitizePhotoUrls(photos) {
  if (!photos || !Array.isArray(photos)) return []
  return photos.map(photo => {
    if (!photo) return photo
    // 保留 HTTP URL 和相对路径
    return photo
  })
}

/**
 * 净化宠物列表的图片数据
 * @param {Array} pets
 * @returns {Array}
 */
function sanitizePetPhotos(pets) {
  if (!pets || !Array.isArray(pets)) return pets
  return pets.map(pet => ({
    ...pet,
    photos: sanitizePhotoUrls(pet.photos)
  }))
}

module.exports = {
  photoToUrl,
  getImageBaseUrl,
  getTempUrl,
  convertPhotosToUrls,
  convertSinglePhoto,
  convertPetPhotosToUrls,
  convertPhotoIdsToUrls,
  sanitizePhotoUrls,
  sanitizePetPhotos
}
