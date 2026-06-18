const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const { action, data } = event
  const { OPENID } = cloud.getWXContext()

  try {
    switch (action) {
      case 'create':
        return await createFootprint(data, OPENID)
      case 'list':
        return await getFootprintList(data, OPENID)
      case 'get':
        return await getFootprintById(data.id, OPENID)
      case 'update':
        return await updateFootprint(data, OPENID)
      case 'delete':
        return await deleteFootprint(data.id, OPENID)
      default:
        return { success: false, message: '未知操作' }
    }
  } catch (error) {
    console.error('足迹操作失败:', error)
    return { success: false, message: error.message }
  }
}

async function createFootprint(data, openid) {
  // 获取系统配置
  const configRes = await db.collection('systemConfig').limit(1).get()
  const config = configRes.data.length > 0 ? configRes.data[0] : {}
  const maxFootprintImages = parseInt(config.maxFootprintImages) || 9

  // 检查图片数量限制
  const photos = data.photos || []
  if (photos.length > maxFootprintImages) {
    throw new Error(`每张足迹最多只能上传${maxFootprintImages}张图片`)
  }

  const footprint = {
    type: data.type || 'image',
    url: data.url || '',
    photos: photos,
    thumbnail: data.thumbnail || '',
    duration: data.duration || 0,
    date: data.date,
    time: data.time,
    // 操作记录相关字段
    action: data.action || '',
    petId: data.petId || '',
    petName: data.petName || '',
    description: data.description || '',
    openid,
    createdAt: db.serverDate(),
    updatedAt: db.serverDate()
  }

  const result = await db.collection('footprints').add({ data: footprint })
  return {
    success: true,
    data: {
      id: result._id,
      ...footprint
    }
  }
}

async function getFootprintList(params, openid) {
  let query = db.collection('footprints')
  
  let whereConditions = { openid }
  if (params && params.type && params.type !== 'all') {
    whereConditions.type = params.type
  }
  
  query = query.where(whereConditions)

  const pageNum = params && params.pageNum ? parseInt(params.pageNum) : 1
  const pageSize = params && params.pageSize ? parseInt(params.pageSize) : 20
  const offset = (pageNum - 1) * pageSize

  const result = await query.orderBy('createdAt', 'desc').skip(offset).limit(pageSize).get()
  
  const totalResult = await db.collection('footprints').where(whereConditions).count()
  const total = totalResult.total
  const hasMore = offset + result.data.length < total

  return {
    success: true,
    data: {
      list: result.data.map(item => ({
        id: item._id,
        ...item
      })),
      total,
      pageNum,
      pageSize,
      hasMore
    }
  }
}

async function getFootprintById(id, openid) {
  const result = await db.collection('footprints').where({
    _id: id,
    openid
  }).get()

  if (result.data.length === 0) {
    throw new Error('足迹不存在')
  }

  return {
    success: true,
    data: {
      id: result.data[0]._id,
      ...result.data[0]
    }
  }
}

async function updateFootprint(data, openid) {
  const { id, ...updateData } = data
  
  const result = await db.collection('footprints').where({
    _id: id,
    openid
  }).update({
    data: {
      ...updateData,
      updatedAt: db.serverDate()
    }
  })

  if (result.stats.updated === 0) {
    throw new Error('更新失败，足迹不存在或无权限')
  }

  return { success: true, message: '更新成功' }
}

async function deleteFootprint(id, openid) {
  const result = await db.collection('footprints').where({
    _id: id,
    openid
  }).remove()

  if (result.stats.removed === 0) {
    throw new Error('删除失败，足迹不存在或无权限')
  }

  return { success: true, message: '删除成功' }
}
