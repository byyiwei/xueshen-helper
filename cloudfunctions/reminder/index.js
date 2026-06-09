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
        return await createReminder(data, openid)
      case 'list':
        return await getReminderList(data, openid)
      case 'listAll':
        return await getAllReminders(openid)
      case 'get':
        return await getReminderById(data.id, openid)
      case 'update':
        return await updateReminder(data, openid)
      case 'delete':
        return await deleteReminder(data.id, openid)
      case 'markDone':
        return await markReminderDone(data, openid)
      default:
        return errorResponse('未知操作')
    }
  } catch (error) {
    console.error('提醒操作失败:', error)
    return errorResponse(error.message || '操作失败', error)
  }
}

// 确保 reminders 集合存在（微信云开发 .add() 不会自动建集合）
async function ensureCollection(db) {
  try {
    await db.createCollection('reminders')

  } catch (e) {
    const msg = String(e.message || e.errMsg || '')
    if (msg.includes('already exist') || msg.includes('ResourceConflict') || msg.includes('-502003')) {
      return // 已存在，正常
    }
    // createCollection 不可用（旧 SDK），不阻塞，交由下方处理

  }
}

// 新增提醒
async function createReminder(data, openid) {
  if (!data.petId) throw new Error('宠物ID不能为空')
  if (!data.type) throw new Error('提醒类型不能为空')
  if (!data.intervalDays || data.intervalDays <= 0) throw new Error('间隔天数不合法')

  // 先确保集合存在
  await ensureCollection(db)

  // 同一宠物 + 同一类型不允许重复
  let existed = { data: [] }
  try {
    existed = await db.collection('reminders').where({ petId: data.petId, type: data.type, openid }).limit(1).get()
  } catch (e) {
    const msg = String(e.message || e.errMsg || '')
    if (msg.includes('DATABASE_COLLECTION_NOT_EXIST')) {
      // 集合仍未创建（旧 SDK 不支持 createCollection），当作无重复继续
    } else {
      throw e
    }
  }
  if (existed.data && existed.data.length > 0) {
    throw new Error('该类型提醒已存在')
  }

  const reminder = {
    petId: data.petId,
    type: data.type,
    intervalDays: Number(data.intervalDays),
    lastDone: data.lastDone || '',
    note: data.note || '',
    openid,
    createdAt: db.serverDate(),
    updatedAt: db.serverDate()
  }

  // .add() 会在集合不存在时自动创建（较新 SDK），兜底异常情况
  let result
  try {
    result = await db.collection('reminders').add({ data: reminder })
  } catch (e) {
    const msg = String(e.message || e.errMsg || '')
    if (msg.includes('DATABASE_COLLECTION_NOT_EXIST')) {
      throw new Error('云数据库 reminders 集合不存在，请在云开发控制台手动创建')
    }
    throw e
  }
  return successResponse({ id: result._id, ...reminder })
}
// 按宠物查询提醒
async function getReminderList(params, openid) {
  if (!params || !params.petId) throw new Error('宠物ID不能为空')

  let result
  try {
    result = await db
      .collection('reminders')
      .where({ petId: params.petId, openid })
      .orderBy('createdAt', 'asc')
      .get()
  } catch (e) {
    // 集合不存在 → 返回空列表
    if (String(e.message || e.errMsg || '').includes('DATABASE_COLLECTION_NOT_EXIST')) {
      return successResponse({ list: [] })
    }
    throw e
  }

  return successResponse({ list: normalizeIds(result.data) })
}

// 查询当前用户所有宠物的提醒（给"我的"页面汇总用）
async function getAllReminders(openid) {
  let result
  try {
    result = await db
      .collection('reminders')
      .where({ openid })
      .orderBy('createdAt', 'asc')
      .get()
  } catch (e) {
    if (String(e.message || e.errMsg || '').includes('DATABASE_COLLECTION_NOT_EXIST')) {
      return successResponse({ list: [] })
    }
    throw e
  }

  return successResponse({ list: normalizeIds(result.data) })
}

async function getReminderById(id, openid) {
  const result = await db.collection('reminders').doc(id).get().catch(() => null)
  if (!result || !result.data) throw new Error('提醒不存在')
  if (result.data.openid !== openid) throw new Error('提醒不存在')
  return successResponse(normalizeId(result.data))
}

async function updateReminder(data, openid) {
  const { id, ...updateData } = data
  if (!id) throw new Error('提醒ID不能为空')

  const recResult = await db.collection('reminders').doc(id).get().catch(() => null)
  if (!recResult || !recResult.data) throw new Error('更新失败，记录不存在或无权限')
  if (recResult.data.openid !== openid) throw new Error('更新失败，记录不存在或无权限')

  // 改类型时检查与其他记录冲突
  if (updateData.type) {
    const conflict = await db.collection('reminders')
      .where({ petId: recResult.data.petId, type: updateData.type, openid })
      .limit(2)
      .get()
    if (conflict && conflict.data && conflict.data.some(d => d._id !== id)) {
      throw new Error('该类型提醒已存在')
    }
  }

  const finalUpdate = {}
  if (updateData.intervalDays !== undefined) finalUpdate.intervalDays = Number(updateData.intervalDays)
  if (updateData.lastDone !== undefined) finalUpdate.lastDone = updateData.lastDone
  if (updateData.note !== undefined) finalUpdate.note = updateData.note
  if (updateData.type !== undefined) finalUpdate.type = updateData.type
  finalUpdate.updatedAt = db.serverDate()

  await db.collection('reminders').doc(id).update({ data: finalUpdate })
  return successResponse(null, '更新成功')
}

async function deleteReminder(id, openid) {
  const recResult = await db.collection('reminders').doc(id).get().catch(() => null)
  if (!recResult || !recResult.data) throw new Error('删除失败，记录不存在或无权限')
  if (recResult.data.openid !== openid) throw new Error('删除失败，记录不存在或无权限')

  await db.collection('reminders').doc(id).remove()
  return successResponse(null, '删除成功')
}

// 标记为已完成
async function markReminderDone(data, openid) {
  const { id, lastDone } = data
  if (!id) throw new Error('提醒ID不能为空')
  if (!lastDone) throw new Error('完成日期不能为空')

  const recResult = await db.collection('reminders').doc(id).get().catch(() => null)
  if (!recResult || !recResult.data) throw new Error('标记完成失败，记录不存在或无权限')
  if (recResult.data.openid !== openid) throw new Error('标记完成失败，记录不存在或无权限')

  await db.collection('reminders').doc(id).update({
    data: { lastDone, updatedAt: db.serverDate() }
  })
  return successResponse({ id, lastDone }, '已标记完成')
}
