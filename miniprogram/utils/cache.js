// 缓存管理工具
const CACHE_PREFIX = 'pet_library_'
const CACHE_EXPIRE_KEY = '_expire'

/**
 * 设置缓存
 * @param {string} key - 缓存键
 * @param {any} value - 缓存值
 * @param {number} expireSeconds - 过期时间（秒），0表示永久
 */
function setCache(key, value, expireSeconds = 0) {
  try {
    const data = {
      value,
      [CACHE_EXPIRE_KEY]: expireSeconds > 0 ? Date.now() + expireSeconds * 1000 : 0
    }
    wx.setStorageSync(CACHE_PREFIX + key, data)
  } catch (error) {
    console.error('设置缓存失败:', error)
    // 如果是存储满错误，尝试清理旧缓存
    if (error && (error.message || '').includes('storage')) {

      clearOldCache()
      // 重试一次
      try {
        const data = {
          value,
          [CACHE_EXPIRE_KEY]: expireSeconds > 0 ? Date.now() + expireSeconds * 1000 : 0
        }
        wx.setStorageSync(CACHE_PREFIX + key, data)
      } catch (retryError) {
        console.error('重试设置缓存失败:', retryError)
      }
    }
  }
}

/**
 * 清理过期缓存
 */
function clearOldCache() {
  try {
    const info = wx.getStorageInfoSync()
    const now = Date.now()
    info.keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        try {
          const data = wx.getStorageSync(key)
          // 清理过期缓存
          if (data && data[CACHE_EXPIRE_KEY] > 0 && now > data[CACHE_EXPIRE_KEY]) {
            wx.removeStorageSync(key)
          }
        } catch (e) {
          // 忽略单个缓存项错误
        }
      }
    })
  } catch (error) {
    console.error('清理缓存失败:', error)
  }
}

/**
 * 获取缓存
 * @param {string} key - 缓存键
 * @param {any} defaultValue - 默认值
 * @returns {any} 缓存值
 */
function getCache(key, defaultValue = null) {
  try {
    const data = wx.getStorageSync(CACHE_PREFIX + key)
    if (!data) return defaultValue

    // 检查是否过期
    if (data[CACHE_EXPIRE_KEY] > 0 && Date.now() > data[CACHE_EXPIRE_KEY]) {
      removeCache(key)
      return defaultValue
    }

    return data.value
  } catch (error) {
    console.error('获取缓存失败:', error)
    return defaultValue
  }
}

/**
 * 移除缓存
 * @param {string} key - 缓存键
 */
function removeCache(key) {
  try {
    wx.removeStorageSync(CACHE_PREFIX + key)
  } catch (error) {
    console.error('移除缓存失败:', error)
  }
}

/**
 * 清空所有缓存
 */
function clearCache() {
  try {
    const info = wx.getStorageInfoSync()
    info.keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        wx.removeStorageSync(key)
      }
    })
  } catch (error) {
    console.error('清空缓存失败:', error)
  }
}

module.exports = {
  setCache,
  getCache,
  removeCache,
  clearCache
}
