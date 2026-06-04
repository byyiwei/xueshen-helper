const { handleError } = require('./error.js')

class APIManager {
  constructor() {
    this.cloudAvailable = true
  }

  /**
   * 统一调用云函数
   */
  async callCloudFunction(name, action, data = {}) {
    try {
      console.log(`调用云函数 ${name}, action: ${action}, data:`, data)
      const result = await wx.cloud.callFunction({
        name,
        data: { action, data }
      })
      
      console.log(`云函数 ${name} 返回:`, result)
      
      if (result.result && result.result.success) {
        this.cloudAvailable = true
        return { success: true, data: result.result.data }
      } else {
        return { success: false, message: result.result?.message || result.result?.warning || '操作失败' }
      }
    } catch (error) {
      console.error(`云函数 ${name} 调用失败:`, error)
      console.error('错误详情:', error.errMsg, error.message)
      this.cloudAvailable = false
      return { 
        success: false, 
        message: error.errMsg || error.message || '网络错误，请稍后重试', 
        error,
        useFallback: true 
      }
    }
  }

  /**
   * 宠物相关API
   */
  async getPetList(filter = {}) {
    return await this.callCloudFunction('pet', 'list', { filter })
  }

  async getPetById(id) {
    return await this.callCloudFunction('pet', 'get', { id })
  }

  async createPet(data) {
    return await this.callCloudFunction('pet', 'create', data)
  }

  async updatePet(data) {
    return await this.callCloudFunction('pet', 'update', data)
  }

  async deletePet(id) {
    return await this.callCloudFunction('pet', 'delete', { id })
  }

  async getPedigree(id, maxGeneration = 3) {
    return await this.callCloudFunction('pet', 'getPedigree', { id, maxGeneration })
  }

  /**
   * 记录相关API
   */
  async getRecordList(petId, type = '') {
    return await this.callCloudFunction('record', 'list', { petId, type })
  }

  async createRecord(data) {
    return await this.callCloudFunction('record', 'create', data)
  }

  async deleteRecord(id) {
    return await this.callCloudFunction('record', 'delete', { id })
  }

  /**
   * 足迹相关API
   */
  async getFootprintList(type = 'all') {
    return await this.callCloudFunction('footprint', 'list', { type })
  }

  async createFootprint(data) {
    return await this.callCloudFunction('footprint', 'create', data)
  }

  async deleteFootprint(id) {
    return await this.callCloudFunction('footprint', 'delete', { id })
  }

  /**
   * 登录API
   */
  async login() {
    return await this.callCloudFunction('login', '', {})
  }

  /**
   * 上传图片到云存储
   */
  async uploadImage(filePath, prefix = 'pets') {
    try {
      const cloudPath = `${prefix}/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`
      const result = await wx.cloud.uploadFile({
        cloudPath,
        filePath
      })
      return { success: true, fileID: result.fileID }
    } catch (error) {
      console.error('上传图片失败:', error)
      return { success: false, message: handleError(error, '上传失败') }
    }
  }

  /**
   * 批量上传图片
   */
  async uploadImages(filePaths, prefix = 'pets') {
    const results = []
    for (const filePath of filePaths) {
      const result = await this.uploadImage(filePath, prefix)
      results.push(result)
    }
    return results
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

module.exports = {
  APIManager,
  getAPI
}

