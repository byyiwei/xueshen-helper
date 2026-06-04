const cloud = require('wx-server-sdk')
const { getDB, getOpenId, successResponse, errorResponse, normalizeId, normalizeIds } = require('./utils.js')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = getDB()

exports.main = async (event, context) => {
  const { action, data } = event
  const openid = getOpenId(context)

  try {
    switch (action) {
      case 'create':
        return await createRecord(data, openid)
      case 'list':
        return await getRecordList(data, openid)
      case 'get':
        return await getRecordById(data.id, openid)
      case 'update':
        return await updateRecord(data, openid)
      case 'delete':
        return await deleteRecord(data.id, openid)
      default:
        return errorResponse('未知操作')
    }
  } catch (error) {
    console.error('记录操作失败:', error)
    return errorResponse(error.message || '操作失败', error)
  }
}

async function createRecord(data, openid) {
  if (!data.petId) {
    throw new Error('宠物ID不能为空')
  }

  const record = {
    petId: data.petId,
    type: data.type || '日常',
    text: data.text,
    date: data.date,
    time: data.time,
    openid,
    createdAt: db.serverDate(),
    updatedAt: db.serverDate()
  }

  const result = await db.collection('records').add({ data: record })
  return successResponse({
    id: result._id,
    ...record
  })
}

async function getRecordList(params, openid) {
  let query = db.collection('records').where({ openid })

  if (params && params.petId) {
    query = query.where({ petId: params.petId })
  }

  if (params && params.type && params.type !== '全部') {
    query = query.where({ type: params.type })
  }

  // 添加分页支持
  const pageSize = params && params.pageSize ? params.pageSize : 20
  const pageNum = params && params.pageNum ? params.pageNum : 1
  const skip = (pageNum - 1) * pageSize

  const countResult = await query.count()
  const total = countResult.total

  const result = await query.orderBy('createdAt', 'desc').skip(skip).limit(pageSize).get()
  return successResponse({
    list: normalizeIds(result.data),
    total,
    pageNum,
    pageSize,
    hasMore: skip + result.data.length < total
  })
}

async function getRecordById(id, openid) {
  const result = await db.collection('records').doc(id).get().catch(() => null)
  if (!result || !result.data) {
    throw new Error('记录不存在')
  }
  if (result.data.openid !== openid) {
    throw new Error('记录不存在')
  }
  return successResponse(normalizeId(result.data))
}

async function updateRecord(data, openid) {
  const { id, ...updateData } = data

  // 先验证权限
  const recResult = await db.collection('records').doc(id).get().catch(() => null)
  if (!recResult || !recResult.data) {
    throw new Error('更新失败，记录不存在或无权限')
  }
  if (recResult.data.openid !== openid) {
    throw new Error('更新失败，记录不存在或无权限')
  }

  await db.collection('records').doc(id).update({
    data: {
      ...updateData,
      updatedAt: db.serverDate()
    }
  })

  return successResponse(null, '更新成功')
}

async function deleteRecord(id, openid) {
  // 先验证权限
  const recResult = await db.collection('records').doc(id).get().catch(() => null)
  if (!recResult || !recResult.data) {
    throw new Error('删除失败，记录不存在或无权限')
  }
  if (recResult.data.openid !== openid) {
    throw new Error('删除失败，记录不存在或无权限')
  }

  await db.collection('records').doc(id).remove()

  return successResponse(null, '删除成功')
}
