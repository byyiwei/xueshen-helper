/**
 * 前端通知管理类 v2.0
 * 适配自建服务器 REST API（/api/security/notifications/*）
 *
 * 使用示例:
 *   const { getNotificationManager } = require('../../utils/notification.js')
 *   const nm = getNotificationManager()
 *   const hasUnread = await nm.checkUnread()
 *   nm.showNotificationDialog(list)
 */
const { getAPI } = require('./api.js')

class NotificationManager {
  constructor() {
    this._lastCheckTime = 0
  }

  /**
   * 获取未读通知列表（带节流，每分钟最多查一次）
   * @param {boolean} force - 是否强制查询（跳过节流）
   * @returns {Promise<{list: Array, total: number}>}
   */
  async getUnreadNotifications(force = false) {
    const now = Date.now()
    if (!force && now - this._lastCheckTime < 60000) {
      return { list: [], total: 0 }
    }
    const api = getAPI()
    const res = await api.getUnreadNotifications()
    if (res.success && res.data) {
      this._lastCheckTime = now
      return res.data
    }
    return { list: [], total: 0 }
  }

  /** 快速检查是否有未读通知 */
  async checkUnread() {
    const data = await this.getUnreadNotifications()
    return data.total > 0
  }

  /** 标记单条通知为已读 */
  async markRead(id) {
    const api = getAPI()
    const res = await api.markNotificationRead(id)
    return res.success
  }

  /** 标记所有通知为已读 */
  async markAllRead() {
    const api = getAPI()
    const res = await api.markAllNotificationsRead()
    return res.success
  }

  /**
   * 弹窗展示审核违规通知
   * @param {Array} list - 通知列表
   */
  showNotificationDialog(list) {
    if (!list || list.length === 0) return
    const item = list[0]
    wx.showModal({
      title: item.title || '内容审核提示',
      content: item.content || '',
      confirmText: '我知道了',
      showCancel: false,
      success: () => {
        this.markRead(item.id)
        const remaining = list.slice(1)
        if (remaining.length > 0) {
          setTimeout(() => this.showNotificationDialog(remaining), 500)
        }
      }
    })
  }

  /** 获取待审核（超时）的记录 */
  async getPendingChecks() {
    const api = getAPI()
    const baseUrl = this._getBaseUrl()
    const token = wx.getStorageSync('token') || ''
    return new Promise((resolve) => {
      wx.request({
        url: baseUrl + '/api/security/pending',
        method: 'GET',
        header: { 'Authorization': 'Bearer ' + token },
        success: (res) => {
          if (res.statusCode === 200 && res.data && res.data.success) {
            resolve(res.data.data.pending || [])
          } else {
            resolve([])
          }
        },
        fail: () => resolve([])
      })
    })
  }

  /** 显示待审核超时提示 */
  showTimeoutToast(count) {
    if (count > 0) {
      wx.showToast({
        title: `有 ${count} 张图片仍在审核中`,
        icon: 'none',
        duration: 3000
      })
    }
  }

  _getBaseUrl() {
    const app = getApp()
    const config = app?.globalData?.systemConfig || {}
    return config.apiUrl || config.imageServerUrl || 'https://pets.openget.cn'
  }
}

let instance = null

function getNotificationManager() {
  if (!instance) {
    instance = new NotificationManager()
  }
  return instance
}

module.exports = { NotificationManager, getNotificationManager }
