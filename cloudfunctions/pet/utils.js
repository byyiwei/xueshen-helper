const cloud = require('wx-server-sdk')

function initCloud() {
  cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV
  })
  return cloud
}

function getDB() {
  const c = initCloud()
  return c.database()
}

function getOpenId(context) {
  const { OPENID } = cloud.getWXContext()
  return OPENID
}

function successResponse(data, message = '操作成功') {
  return {
    success: true,
    data,
    message
  }
}

function errorResponse(message = '操作失败', error = null) {
  console.error('Error:', error)
  return {
    success: false,
    message,
    error: error ? error.message : undefined
  }
}

async function wrapAction(action, params, context) {
  try {
    const result = await action(params, context)
    return successResponse(result)
  } catch (error) {
    return errorResponse(error.message, error)
  }
}

function normalizeId(doc) {
  if (!doc) return doc
  return {
    id: doc._id,
    ...doc
  }
}

function normalizeIds(docs) {
  if (!docs || !Array.isArray(docs)) return docs
  return docs.map(normalizeId)
}

module.exports = {
  initCloud,
  getDB,
  getOpenId,
  successResponse,
  errorResponse,
  wrapAction,
  normalizeId,
  normalizeIds
}
