/**
 * API 管理器 v2.0 - 自建服务器 REST API
 * 
 * 改造要点：
 * - wx.cloud.callFunction() → wx.request()
 * - 统一携带 JWT token（Authorization: Bearer xxx）
 * - 图片上传：wx.cloud.uploadFile() → wx.uploadFile({ url: BASE_URL + '/api/upload' })
 * - 图片 URL：直接使用 HTTP URL，无需 getTempFileURL
 * 
 * BASE_URL 配置优先级：
 *   1. globalData.systemConfig.apiUrl
 *   2. globalData.systemConfig.imageServerUrl
 *   3. 默认值 'https://pets.openget.cn'
 */
const { handleError } = require('./error.js')

class APIManager {
  constructor() {
    this._ready = true
    this._reloginPromise = null  // 重登锁，防止并发重登
  }

  /** 获取 API 基础 URL */
  getBaseUrl() {
    const app = getApp()
    const config = app?.globalData?.systemConfig || {}
    return config.apiUrl || config.imageServerUrl || 'https://pets.openget.cn'
  }

  /** 获取当前用户的 JWT token */
  getToken() {
    try {
      return wx.getStorageSync('token') || ''
    } catch (_) {
      return ''
    }
  }

  /**
   * 统一 HTTP 请求（带超时重试）
   * @param {string} method - GET/POST/PUT/DELETE
   * @param {string} path - API 路径，如 '/api/pets'
   * @param {object} data - 请求体（GET 时转为 query params）
   * @returns {Promise<{success: boolean, data?: any, message?: string}>}
   */
  request(method, path, data = {}) {
    // 兼容对象参数调用：API.request({ url: '/api/xxx', method: 'GET', data: {} })
    if (method && typeof method === 'object') {
      const options = method
      method = options.method || 'GET'
      path = options.url || options.path || ''
      data = options.data || {}
    }
    return this._requestWithRetry(method, path, data, 2)
  }

  _requestWithRetry(method, path, data, retryLeft, isRetry = false) {
    const baseUrl = this.getBaseUrl()
    const token = this.getToken()

    return new Promise((resolve) => {
      const config = {
        url: baseUrl + path,
        method,
        header: {
          'Content-Type': 'application/json',
          'Authorization': token ? 'Bearer ' + token : ''
        },
        timeout: 15000,
        success: (res) => {
          if (res.statusCode === 200 && res.data) {
            // 检测 token 过期，自动重登一次
            if (!isRetry && res.data.success === false && res.data.message && res.data.message.includes('登录已过期')) {
              console.log('[API] token过期，自动重新登录...')
              this._ensureRelogin().then(() => {
                // 重登完成后，用新 token 重试原请求
                this._requestWithRetry(method, path, data, retryLeft, true).then(resolve)
              }).catch(() => {
                resolve({ success: false, message: '登录已过期，请重新进入小程序' })
              })
              return
            }
            resolve(res.data)
          } else {
            resolve({ success: false, message: `服务器错误(${res.statusCode})` })
          }
        },
        fail: (err) => {
          console.error(`[API] ${method} ${path} 失败(剩余重试${retryLeft}):`, err)
          if (retryLeft > 0 && /timeout|fail/i.test(err.errMsg || '')) {
            setTimeout(() => {
              this._requestWithRetry(method, path, data, retryLeft - 1, isRetry).then(resolve)
            }, 500)
          } else {
            resolve({
              success: false,
              message: err.errMsg || '网络错误，请稍后重试',
              useFallback: true
            })
          }
        }
      }

      // GET 请求参数用 data 拼接
      if (method === 'GET' && data && Object.keys(data).length > 0) {
        const params = Object.keys(data)
          .filter(k => data[k] !== undefined && data[k] !== '')
          .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(data[k])}`)
          .join('&')
        if (params) config.url += '?' + params
      } else if (method !== 'GET') {
        config.data = data
      }

      wx.request(config)
    })
  }

  // 确保只重登一次（并发请求共享同一个重登 Promise）
  _ensureRelogin() {
    if (this._reloginPromise) {
      return this._reloginPromise
    }

    this._reloginPromise = (async () => {
      try {
        // 清除旧 token
        try { wx.removeStorageSync('token') } catch (_) {}

        const loginRes = await new Promise((resolve, reject) => {
          wx.login({ success: resolve, fail: reject })
        })

        const result = await this._requestWithRetry('POST', '/api/auth/login', { code: loginRes.code }, 2, true)

        if (result && result.success && result.data && result.data.token) {
          try {
            wx.setStorageSync('token', result.data.token)
            wx.setStorageSync('openid', result.data.openid)
          } catch (_) {}
          console.log('[API] 重新登录成功')
          return
        }
        console.error('[API] 重新登录失败:', result)
        throw new Error('重登失败')
      } catch (err) {
        console.error('[API] 自动重登失败:', err)
        throw err
      } finally {
        // 重登完成后释放锁，允许后续重登
        this._reloginPromise = null
      }
    })()

    return this._reloginPromise
  }

  // ==================== 宠物 API ====================

  async getPetList(filter = {}, pageNum = 1, pageSize = 20) {
    const params = { pageNum, pageSize }
    if (filter.category && filter.category !== '全部') params.category = filter.category
    if (filter.gender && filter.gender !== '全部') params.gender = filter.gender
    if (filter.searchText) params.search = filter.searchText
    return await this.request('GET', '/api/pets', params)
  }

  async getPetById(id) {
    return await this.request('GET', `/api/pets/${id}`)
  }

  async createPet(data) {
    return await this.request('POST', '/api/pets', data)
  }

  async updatePet(data) {
    return await this.request('PUT', `/api/pets/${data.id}`, data)
  }

  async deletePet(id) {
    return await this.request('DELETE', `/api/pets/${id}`)
  }

  async getPedigree(id, maxGeneration = 3) {
    return await this.request('GET', `/api/pets/${id}/pedigree`, { maxGeneration })
  }

  async getCategories() {
    return await this.request('GET', '/api/categories')
  }

  async addCategory(name) {
    return await this.request('POST', '/api/categories', { name })
  }

  async updateCategory(oldName, newName) {
    return await this.request('PUT', '/api/categories', { oldName, newName })
  }

  async deleteCategory(name) {
    return await this.request('DELETE', '/api/categories', { name })
  }

  async getPublicPets(userId) {
    return await this.request('GET', `/api/pets/public/${userId}`)
  }

  // ==================== 记录 API ====================

  async getRecordList(petId, type = '') {
    return await this.request('GET', '/api/records', { petId, type })
  }

  async createRecord(data) {
    return await this.request('POST', '/api/records', data)
  }

  async deleteRecord(id) {
    return await this.request('DELETE', `/api/records/${id}`)
  }

  async updateRecordQrCode(id, qrBase64, urlLink) {
    return await this.request('PUT', `/api/records/${id}/qrcode`, { qrBase64, urlLink })
  }

  // ==================== 提醒 API ====================

  async getReminderList(petId) {
    return await this.request('GET', '/api/reminders', { petId })
  }

  async getAllReminders() {
    return await this.request('GET', '/api/reminders')
  }

  async createReminder(data) {
    return await this.request('POST', '/api/reminders', data)
  }

  async updateReminder(data) {
    return await this.request('PUT', `/api/reminders/${data.id}`, data)
  }

  async deleteReminder(id) {
    return await this.request('DELETE', `/api/reminders/${id}`)
  }

  async markReminderDone(id, lastDone) {
    return await this.request('PUT', `/api/reminders/${id}/done`, { lastDone })
  }

  // ==================== 龟缸提醒 API ====================

  async getTankRemindersDue() {
    return await this.request('GET', '/api/tanks/reminders/due')
  }

  // ==================== 足迹 API ====================

  async getFootprintList(type = 'all', pageNum = 1, pageSize = 20) {
    return await this.request('GET', '/api/footprints', { type, pageNum, pageSize })
  }

  async createFootprint(data) {
    return await this.request('POST', '/api/footprints', data)
  }

  async deleteFootprint(id) {
    return await this.request('DELETE', `/api/footprints/${id}`)
  }

  // ==================== 登录 API ====================

  /**
   * 微信登录（获取 JWT token）
   * 对应原 callCloudFunction('login')
   */
  async login(code) {
    if (!code) {
      // 先获取微信登录 code
      try {
        const loginRes = await new Promise((resolve, reject) => {
          wx.login({ success: resolve, fail: reject })
        })
        code = loginRes.code
      } catch (err) {
        return { success: false, message: '获取微信登录凭证失败' }
      }
    }

    const result = await this.request('POST', '/api/auth/login', { code })

    if (result.success && result.data && result.data.token) {
      // 存储 token 和 openid
      try {
        wx.setStorageSync('token', result.data.token)
        wx.setStorageSync('openid', result.data.openid)
      } catch (_) {}
    }

    return result
  }

  async checkAdmin() {
    return await this.request('POST', '/api/auth/check-admin')
  }

  // ==================== 用户信息 API ====================

  async updateUserInfo(data) {
    return await this.request('PUT', '/api/user/profile', data)
  }

  async updatePublicProfile(data) {
    return await this.request('PUT', '/api/user/public-profile', data)
  }

  // ==================== 图片上传 API ====================

  /**
   * 上传图片到自建服务器（含自动微信安全审核）
   * 
   * 存储路径格式：uploads/{openid}/YYYY/MM/DD/{prefix}_{timestamp}_{random}.{ext}
   * 审核在后端自动触发（异步，不阻塞上传）
   * 
   * @param {string} filePath - 本地文件路径
   * @param {string} prefix - 文件前缀，如 'pet'、'avatar'、'footprint'
   * @param {object} options
   * @param {string} options.scene - 审核场景：avatar/cover/pet/footprint
   * @param {string} options.bizId - 业务关联ID
   */
  uploadImage(filePath, prefix = 'pet', options = {}) {
    const baseUrl = this.getBaseUrl()
    const token = this.getToken()

    return new Promise((resolve) => {
      wx.uploadFile({
        url: baseUrl + '/api/upload',
        filePath,
        name: 'file',
        formData: {
          prefix,
          scene: options.scene || prefix,
          bizId: options.bizId || ''
        },
        header: {
          'Authorization': token ? 'Bearer ' + token : ''
        },
        success: (res) => {
          try {
            const data = JSON.parse(res.data)
            if (data.success) {
              // 返回 HTTP URL 替代 cloud:// fileID
              resolve({
                success: true,
                fileID: data.data.path,    // 兼容旧字段名
                path: data.data.path,
                url: data.data.url,
                openid: data.data.openid   // 可追踪图片所属用户
              })
            } else {
              resolve({ success: false, message: data.message || '上传失败' })
            }
          } catch (_) {
            resolve({ success: false, message: '解析上传结果失败' })
          }
        },
        fail: (err) => {
          console.error('[API] 上传图片失败:', err)
          resolve({ success: false, message: err.errMsg || '上传失败' })
        }
      })
    })
  }

  /**
   * 批量上传图片
   */
  async uploadImages(filePaths, prefix = 'pet') {
    const results = []
    for (const filePath of filePaths) {
      const result = await this.uploadImage(filePath, prefix)
      results.push(result)
    }
    return results
  }

  // ==================== 管理员 API ====================

  async getAdminStats() {
    return await this.request('GET', '/api/admin/stats')
  }

  async getAdminUserGrowth(days = 7) {
    return await this.request('GET', '/api/admin/user-growth', { days })
  }

  async getAdminPetDistribution() {
    return await this.request('GET', '/api/admin/pet-distribution')
  }

  async getAdminFootprints(params = {}) {
    return await this.request('GET', '/api/admin/footprints', params)
  }

  async getAdminUsers(params = {}) {
    return await this.request('GET', '/api/admin/users', params)
  }

  async getAdminPets(params = {}) {
    return await this.request('GET', '/api/admin/pets', params)
  }

  async updateAdminUser(userId, data) {
    return await this.request('PUT', `/api/admin/users/${userId}`, data)
  }

  async deleteAdminUser(userId) {
    return await this.request('DELETE', `/api/admin/users/${userId}`)
  }

  async getAdminConfig() {
    return await this.request('GET', '/api/admin/config')
  }

  async updateAdminConfig(config) {
    return await this.request('PUT', '/api/admin/config', config)
  }

  // ==================== 安全审核 API ====================

  async checkImage(filePath, scene = 'pet', bizId = '') {
    return await this.request('POST', '/api/security/check-image', { filePath, scene, bizId })
  }

  async checkText(content, scene = 2) {
    return await this.request('POST', '/api/security/check-text', { content, scene })
  }

  async getUnreadNotifications() {
    return await this.request('GET', '/api/security/notifications/unread')
  }

  async markNotificationRead(id) {
    return await this.request('PUT', `/api/security/notifications/${id}/read`)
  }

  async markAllNotificationsRead() {
    return await this.request('PUT', '/api/security/notifications/read-all')
  }

  // ==================== 二维码 API ====================

  async generateQrcode(scene, page) {
    return await this.request('POST', '/api/qrcode/generate', { scene, page })
  }

  async generateUrlLink(petId, recordId) {
    return await this.request('POST', '/api/qrcode/url-link', { petId, recordId })
  }

  // ==================== 语音识别 API ====================

  async recognizeSpeech(audioBase64) {
    return await this.request('POST', '/api/speech/recognize', { audioBase64 })
  }

  // ==================== 药品 API ====================

  /** 获取药品列表（支持分类筛选和关键词搜索） */
  async getMedicines(params = {}) {
    return await this.request('GET', '/api/medicines', params)
  }

  // ==================== 药品上报 API ====================

  async reportMedicine(medicineName, email) {
    return await this.request('POST', '/api/medicine-reports', { medicineName, email })
  }
}

// 导出单例
let instance = null

function getAPI() {
  if (!instance) {
    instance = new APIManager()
  }
  return instance
}

module.exports = { APIManager, getAPI }

