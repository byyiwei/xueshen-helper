const cloud = require('wx-server-sdk')
const { getSecurityChecker } = require('./securityChecker.js')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

/**
 * 内容安全审核云函数 - 薄包装层
 * 核心逻辑委托给 common/securityChecker.js 公共类
 */
exports.main = async (event, context) => {
  const { action, data = {} } = event
  const { OPENID } = cloud.getWXContext()

  const checker = getSecurityChecker()

  try {
    switch (action) {
      case 'checkImage':
        return {
          success: true,
          data: await checker.checkFile(data.fileID, OPENID, data.scene || 1)
        }

      case 'checkText':
        return {
          success: true,
          data: await checker.checkText(data.content, OPENID, data.scene || 2)
        }

      case 'checkAndLog':
        return {
          success: true,
          data: await checker.checkAndLog(data.fileID, OPENID, data.scene || 1, data.bizId || '')
        }

      // ─── 用户通知相关 ───

      case 'getUnreadNotifications':
        return await getUnreadNotifications(OPENID)

      case 'markNotificationRead':
        return await markNotificationRead(data.id, OPENID)

      case 'markAllNotificationsRead':
        return await markAllNotificationsRead(OPENID)

      // ─── 未处理审核记录（回调还未收到） ───

      case 'getPendingChecks':
        return await getPendingChecks(OPENID)

      default:
        return { success: false, message: '未知操作: ' + action }
    }
  } catch (error) {
    console.error('security 云函数执行失败:', error)
    return { success: false, message: error.message }
  }
}

/**
 * 获取当前用户未读的审核违规通知
 */
async function getUnreadNotifications(openid) {
  if (!openid) {
    return { success: false, message: '用户未登录' }
  }

  try {
    const result = await db.collection('notifications')
      .where({ openid, isRead: false })
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get()

    // 将日期格式化为可读时间
    const list = (result.data || []).map(item => ({
      id: item._id,
      type: item.type,
      title: item.title,
      content: item.content,
      scene: item.scene,
      suggest: item.suggest,
      label: item.label,
      createdAt: item.createdAt
    }))

    return { success: true, data: { list, total: list.length } }
  } catch (error) {
    console.error('获取未读通知失败:', error)
    return { success: false, message: error.message }
  }
}

/**
 * 标记单条通知为已读
 */
async function markNotificationRead(id, openid) {
  if (!id) {
    return { success: false, message: '缺少通知ID' }
  }

  try {
    // 验证该通知属于当前用户
    const notif = await db.collection('notifications').doc(id).get().catch(() => null)
    if (!notif || !notif.data) {
      return { success: false, message: '通知不存在' }
    }
    if (notif.data.openid !== openid) {
      return { success: false, message: '无权限' }
    }

    await db.collection('notifications').doc(id).update({
      data: { isRead: true, readAt: db.serverDate() }
    })

    return { success: true, data: null }
  } catch (error) {
    console.error('标记通知已读失败:', error)
    return { success: false, message: error.message }
  }
}

/**
 * 标记所有通知为已读
 */
async function markAllNotificationsRead(openid) {
  try {
    await db.collection('notifications')
      .where({ openid, isRead: false })
      .update({
        data: { isRead: true, readAt: db.serverDate() }
      })
    return { success: true, data: null }
  } catch (error) {
    console.error('标记全部已读失败:', error)
    return { success: false, message: error.message }
  }
}

/**
 * 获取当前用户"等待回调结果"的审核记录
 * 这些记录在异步回调未返回前处于 pending 状态
 * 如果超过合理时间（如 10 分钟）仍未收到回调，返回给前端提示
 */
async function getPendingChecks(openid) {
  if (!openid) {
    return { success: false, message: '用户未登录' }
  }

  try {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)

    const result = await db.collection('security_logs')
      .where({
        openid,
        status: 'pending'
      })
      .orderBy('createTime', 'asc')
      .limit(20)
      .get()

    // 筛选出超时的记录（超过 10 分钟仍为 pending）
    const timeoutList = (result.data || []).filter(item => {
      if (!item.createTime) return false
      const createTime = new Date(item.createTime)
      return createTime < tenMinutesAgo
    }).map(item => ({
      id: item._id,
      fileID: item.fileID,
      scene: item.sceneTag,
      bizId: item.bizId,
      createTime: item.createTime,
      status: 'timeout'
    }))

    // 对于超时记录，标记状态为 timeout
    for (const item of timeoutList) {
      await db.collection('security_logs').doc(item.id).update({
        data: { status: 'timeout' }
      }).catch(() => {})
    }

    return {
      success: true,
      data: {
        pending: timeoutList.length > 0 ? timeoutList : [],
        count: timeoutList.length
      }
    }
  } catch (error) {
    console.error('获取待审核记录失败:', error)
    return { success: false, message: error.message }
  }
}