/**
 * 统一响应格式
 */
function success(data = null, message = '操作成功') {
  return { success: true, data, message }
}

function error(message = '操作失败', errData = null) {
  return { success: false, message, error: errData }
}

function listResult(list, total, pageNum, pageSize) {
  return {
    success: true,
    data: {
      list,
      total,
      pageNum: pageNum || 1,
      pageSize: pageSize || 20,
      hasMore: (pageNum || 1) * (pageSize || 20) < total
    }
  }
}

module.exports = { success, error, listResult }
