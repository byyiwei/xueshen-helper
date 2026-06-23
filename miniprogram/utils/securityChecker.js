/**
 * 前端内容安全审核公共类
 * 封装对 security 云函数的调用，供所有页面和组件复用
 *
 * 使用示例:
 *   const { getSecurityChecker } = require('../../utils/securityChecker.js')
 *   const checker = getSecurityChecker()
 *   // 异步审核（不阻塞）
 *   checker.checkImage(fileID, 'pet')
 *   // 同步审核（等待结果）
 *   const result = await checker.checkImageSync(fileID, 'pet')
 */
class SecurityChecker {
  constructor() {
    this._ready = true
  }

  /**
   * 调用 security 云函数
   * @private
   */
  _call(action, data = {}) {
    return new Promise((resolve) => {
      wx.cloud.callFunction({
        name: 'security',
        data: { action, data }
      }).then(res => {
        if (res.result && res.result.success) {
          resolve({ success: true, data: res.result.data })
        } else {
          resolve({
            success: false,
            message: res.result?.message || '审核服务调用失败'
          })
        }
      }).catch(err => {
        console.error(`[SecurityChecker] 云函数调用失败:`, err)
        resolve({ success: false, message: '审核服务异常' })
      })
    })
  }

  /**
   * 图片安全审核（异步，不阻塞主流程）
   * 适用于上传后触发的后台审核
   * @param {string} fileID - 云存储文件ID
   * @param {string} scene - 场景: avatar/cover/pet/footprint/comment
   * @param {string} bizId - 业务关联ID
   */
  checkImage(fileID, scene = 'pet', bizId = '') {
    if (!fileID) return
    this._call('checkAndLog', { fileID, scene, bizId }).then(res => {
      if (res.success) {
        console.log(`[SecurityChecker] 图片审核已提交: scene=${scene}, fileID=${fileID}`)
      } else {
        console.warn(`[SecurityChecker] 图片审核提交失败:`, res.message)
      }
    })
  }

  /**
   * 图片安全审核（同步，等待结果）
   * 适用于需要根据审核结果决定业务流程的场景
   * @param {string} fileID - 云存储文件ID
   * @param {string} scene - 场景
   * @returns {Promise<{pass: boolean, trace_id?: string, reason?: string}>}
   */
  async checkImageSync(fileID, scene = 'pet') {
    const res = await this._call('checkImage', { fileID, scene })
    if (res.success) {
      return res.data
    }
    return { pass: false, reason: res.message }
  }

  /**
   * 文本安全审核（同步）
   * @param {string} content - 待检测文本
   * @param {string} scene - 场景
   * @returns {Promise<{pass: boolean, suggest?: string, label?: string}>}
   */
  async checkText(content, scene = 'comment') {
    if (!content) {
      return { pass: true }
    }
    const res = await this._call('checkText', { content, scene })
    if (res.success) {
      return res.data
    }
    // 审核服务不可用时放行，避免影响正常使用
    return { pass: true, suggest: 'pass', label: '正常' }
  }

  /**
   * 批量检查多张图片（异步，各自独立触发）
   * @param {string[]} fileIDs - 云存储文件ID数组
   * @param {string} scene - 场景
   */
  checkImages(fileIDs, scene = 'pet') {
    if (!Array.isArray(fileIDs) || fileIDs.length === 0) return
    fileIDs.forEach(fileID => {
      if (fileID && fileID.startsWith('cloud://')) {
        this.checkImage(fileID, scene)
      }
    })
  }
}

// 导出单例
let instance = null

function getSecurityChecker() {
  if (!instance) {
    instance = new SecurityChecker()
  }
  return instance
}

module.exports = {
  SecurityChecker,
  getSecurityChecker
}