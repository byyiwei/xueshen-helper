// 错误处理工具

/**
 * 统一错误处理
 * @param {Error} error - 错误对象
 * @param {string} fallbackMessage - 兜底错误消息
 */
function handleError(error, fallbackMessage = '操作失败') {
  console.error('错误详情:', error)
  
  let message = fallbackMessage
  
  if (error.message) {
    message = error.message
  } else if (typeof error === 'string') {
    message = error
  }
  
  return message
}

/**
 * 显示错误提示
 * @param {Error|string} error - 错误
 * @param {string} fallbackMessage - 兜底消息
 */
function showError(error, fallbackMessage = '操作失败') {
  const message = handleError(error, fallbackMessage)
  wx.showToast({
    title: message,
    icon: 'none',
    duration: 2000
  })
}

/**
 * 显示成功提示
 * @param {string} message - 提示消息
 */
function showSuccess(message = '操作成功') {
  wx.showToast({
    title: message,
    icon: 'success',
    duration: 1500
  })
}

/**
 * 显示加载状态
 * @param {string} title - 加载标题
 */
function showLoading(title = '加载中...') {
  wx.showLoading({
    title,
    mask: true
  })
}

/**
 * 隐藏加载状态
 */
function hideLoading() {
  wx.hideLoading()
}

/**
 * 确认对话框
 * @param {string} title - 标题
 * @param {string} content - 内容
 * @returns {Promise<boolean>}
 */
function showConfirm(title = '提示', content = '确定要执行此操作吗？') {
  return new Promise((resolve) => {
    wx.showModal({
      title,
      content,
      success: (res) => {
        resolve(res.confirm)
      }
    })
  })
}

module.exports = {
  handleError,
  showError,
  showSuccess,
  showLoading,
  hideLoading,
  showConfirm
}
