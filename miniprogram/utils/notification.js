/**
 * 前端通知管理类
 * 用于查询和展示审核违规通知
 *
 * 使用示例:
 *   const { getNotificationManager } = require('../../utils/notification.js')
 *   const nm = getNotificationManager()
 *   // 检查是否有未读通知
 *   const hasUnread = await nm.checkUnread()
 *   // 弹窗展示通知
 *   nm.showNotificationDialog(list)
 */
class NotificationManager {
  constructor() {
    this._lastCheckTime = 0
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
        resolve(res.result || { success: false })
      }).catch(err => {
        console.error('[NotificationManager] 云函数调用失败:', err)
        resolve({ success: false, message: '网络异常' })
      })
    })
  }

  /**
   * 获取未读通知列表（带节流，每分钟最多查一次）
   * @param {boolean} force - 是否强制查询（跳过节流）
   * @returns {Promise<{list: Array, total: number}>}
   */
  async getUnreadNotifications(force = false) {
    const now = Date.now()
    if (!force && now - this._lastCheckTime < 60000) {
      // 一分钟内不重复查询
      return { list: [], total: 0 }
    }

    const res = await this._call('getUnreadNotifications')
    if (res.success && res.data) {
      this._lastCheckTime = now
      return res.data
    }
    return { list: [], total: 0 }
  }

  /**
   * 快速检查是否有未读通知
   */
  async checkUnread() {
    const data = await this.getUnreadNotifications()
    return data.total > 0
  }

  /**
   * 标记单条通知为已读
   */
  async markRead(id) {
    const res = await this._call('markNotificationRead', { id })
    return res.success
  }

  /**
   * 标记所有通知为已读
   */
  async markAllRead() {
    const res = await this._call('markAllNotificationsRead')
    return res.success
  }

  /**
   * 弹窗展示审核违规通知
   * @param {Array} list - 通知列表
   */
  showNotificationDialog(list) {
    if (!list || list.length === 0) return

    // 取最新的通知展示
    const item = list[0]

    wx.showModal({
      title: item.title || '内容审核提示',
      content: item.content,
      confirmText: '我知道了',
      showCancel: false,
      success: () => {
        // 标记为已读
        this.markRead(item.id)
        // 如果有更多通知，递归展示下一条
        const remaining = list.slice(1)
        if (remaining.length > 0) {
          setTimeout(() => this.showNotificationDialog(remaining), 500)
        }
      }
    })
  }

  /**
   * 获取待审核（超时）的记录
   * @returns {Promise<Array>}
   */
  async getPendingChecks() {
    const res = await this._call('getPendingChecks')
    if (res.success && res.data) {
      return res.data.pending || []
    }
    return []
  }

  /**
   * 显示待审核超时提示
   */
  showTimeoutToast(count) {
    if (count > 0) {
      wx.showToast({
        title: `有 ${count} 张图片仍在审核中`,
        icon: 'none',
        duration: 3000
      })
    }
  }
}

// 导出单例
let instance = null

function getNotificationManager() {
  if (!instance) {
    instance = new NotificationManager()
  }
  return instance
}

module.exports = {
  NotificationManager,
  getNotificationManager
}