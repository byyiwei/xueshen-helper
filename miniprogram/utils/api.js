const { handleError } = require('./error.js')
const { getSecurityChecker } = require('./securityChecker.js')

class APIManager {
  constructor() {
    this.cloudAvailable = true
  }

  /**
   * 统一调用云函数
   */
  async callCloudFunction(name, action, data = {}) {
    try {

      const result = await wx.cloud.callFunction({
        name,
        data: { action, data }
      })

      if (result.result && result.result.success) {
        this.cloudAvailable = true
        return { success: true, data: result.result.data }
      } else {
        const message = result.result?.message || result.result?.warning || '操作失败'
        return { success: false, message }
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
  async getPetList(filter = {}, pageNum = 1, pageSize = 20) {
    return await this.callCloudFunction('pet', 'list', { filter, pageNum, pageSize })
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

  async getCategories() {
    return await this.callCloudFunction('pet', 'getCategories', {})
  }

  async addCategory(name) {
    return await this.callCloudFunction('pet', 'addCategory', { name })
  }

  async updateCategory(oldName, newName) {
    return await this.callCloudFunction('pet', 'updateCategory', { oldName, newName })
  }

  async deleteCategory(name) {
    return await this.callCloudFunction('pet', 'deleteCategory', { name })
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
   * 提醒事件相关API
   */
  async getReminderList(petId) {
    return await this.callCloudFunction('reminder', 'list', { petId })
  }

  async getAllReminders() {
    return await this.callCloudFunction('reminder', 'listAll', {})
  }

  async createReminder(data) {
    return await this.callCloudFunction('reminder', 'create', data)
  }

  async updateReminder(data) {
    return await this.callCloudFunction('reminder', 'update', data)
  }

  async deleteReminder(id) {
    return await this.callCloudFunction('reminder', 'delete', { id })
  }

  async markReminderDone(id, lastDone) {
    return await this.callCloudFunction('reminder', 'markDone', { id, lastDone })
  }

  /**
   * 足迹相关API
   */
  async getFootprintList(type = 'all', pageNum = 1, pageSize = 20) {
    return await this.callCloudFunction('footprint', 'list', { type, pageNum, pageSize })
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
   * 上传图片到云存储（含安全审核）
   * @param {string} filePath - 本地文件路径
   * @param {string} prefix - 路径前缀，如 'pets'、'covers'、'avatars'
   * @param {string} subPath - 子目录，如宠物ID、用户ID等，用于分类存储
   * @param {object} options - 可选参数
   * @param {string} options.scene - 审核场景：avatar/cover/pet/footprint
   * @param {boolean} options.skipCheck - 是否跳过审核（默认false）
   */
  async uploadImage(filePath, prefix = 'pets', subPath = '', options = {}) {
    try {
      const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`
      const cloudPath = subPath
        ? `${prefix}/${subPath}/${filename}`
        : `${prefix}/${filename}`
      const result = await wx.cloud.uploadFile({
        cloudPath,
        filePath
      })

      // 上传成功后进行图片安全审核（异步，不阻塞上传流程）
      if (!options.skipCheck && result.fileID) {
        const checker = getSecurityChecker()
        checker.checkImage(result.fileID, options.scene || prefix)
      }

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

