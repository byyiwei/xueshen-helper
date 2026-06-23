const cloud = require('wx-server-sdk')
const { successResponse, errorResponse } = require('./utils')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 管理员openid列表（兜底配置，优先读取数据库）
const ADMIN_OPENIDS = [
  'oZ_NI3YwCXVXO5_WfdcljpaJZz44',
]

// 从数据库获取管理员列表
async function getAdmins() {
  try {
    const result = await db.collection('admins').where({ enabled: true }).get()
    return result.data || []
  } catch (error) {
    console.error('获取管理员列表失败:', error)
    return ADMIN_OPENIDS.map(openid => ({ openid, name: '管理员', enabled: true }))
  }
}

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { action } = event

  // 验证管理员权限
  const admins = await getAdmins()
  const isAdmin = admins.some(a => a.openid === OPENID)
  
  if (!isAdmin) {
    console.error('[admin] 无管理员权限, OPENID:', OPENID)
    return errorResponse('无管理员权限')
  }

  try {
    switch (action) {
      case 'getStats':
        return await getStats()
      case 'getUsers':
        return await getUsers(event)
      case 'getPets':
        return await getPets(event)
      case 'getFootprints':
        return await getFootprints(event)
      case 'getRecentActivities':
        return await getRecentActivities()
      case 'getUserGrowth':
        return await getUserGrowth(event)
      case 'getPetDistribution':
        return await getPetDistribution()
      case 'getConfig':
        return await getConfig()
      case 'updateConfig':
        return await updateConfig(event.data)
      case 'updateUser':
        return await updateUser(event)
      case 'deleteUser':
        return await deleteUser(event)
      default:
        return errorResponse('未知操作')
    }
  } catch (error) {
    console.error('管理员操作失败:', error)
    return errorResponse(error.message, error)
  }
}

// 获取统计数据
async function getStats() {
  const [usersRes, petsRes, footprintsRes] = await Promise.all([
    db.collection('users').count(),
    db.collection('pets').count(),
    db.collection('footprints').count()
  ])

  // 计算今日活跃（今日创建足迹的用户数）
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const todayFootprints = await db.collection('footprints')
    .where({ createdAt: _.gte(today) })
    .count()

  // 计算用户增长率（对比上周）
  const lastWeek = new Date()
  lastWeek.setDate(lastWeek.getDate() - 7)
  const newUsers = await db.collection('users')
    .where({ createdAt: _.gte(lastWeek) })
    .count()

  const oldUsers = usersRes.total - newUsers.total
  const userGrowth = oldUsers > 0 ? ((newUsers.total / oldUsers) * 100).toFixed(1) : 0

  // 计算宠物增长率
  const newPets = await db.collection('pets')
    .where({ createdAt: _.gte(lastWeek) })
    .count()
  const petGrowth = (petsRes.total - newPets) > 0 
    ? ((newPets / (petsRes.total - newPets)) * 100).toFixed(1) 
    : 0

  return successResponse({
    totalUsers: usersRes.total,
    totalPets: petsRes.total,
    totalFootprints: footprintsRes.total,
    todayActive: todayFootprints.total,
    userGrowth: parseFloat(userGrowth),
    petGrowth: parseFloat(petGrowth)
  })
}

// 获取用户列表
async function getUsers(event) {
  const { searchText = '', filterStatus = '', page = 1, pageSize = 20, sortField = 'createdAt', sortOrder = 'desc' } = event
  
  let query = {}
  
  if (searchText) {
    // 支持搜索昵称、用户名或openid
    query.$or = [
      { nickname: db.RegExp({ regexp: searchText, options: 'i' }) },
      { username: db.RegExp({ regexp: searchText, options: 'i' }) },
      { name: db.RegExp({ regexp: searchText, options: 'i' }) },
      { openid: db.RegExp({ regexp: searchText, options: 'i' }) }
    ]
  }
  
  if (filterStatus && filterStatus !== '') {
    query.status = filterStatus
  }
  
  // 验证排序字段
  const validSortFields = ['createdAt', 'updatedAt', 'nickname']
  const field = validSortFields.includes(sortField) ? sortField : 'createdAt'
  const order = sortOrder === 'asc' ? 'asc' : 'desc'
  
  const res = await db.collection('users')
    .where(query)
    .orderBy(field, order)
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .get()
  
  // 统计每个用户的宠物数和足迹数
  const users = res.data.map(u => {
    // 兼容多种字段名
    const nickname = u.nickname || u.username || u.name || '未设置'
    const avatar = u.avatar || u.photo || u.headimg || ''
    const status = u.status || '正常'
    
    return {
      id: u._id,
      openid: u.openid || '',
      nickname: nickname,
      phone: u.phone || u.mobile || u.tel || '',
      avatar: avatar,
      status: status,
      petCount: 0,
      footprintCount: 0,
      createTime: formatDate(u.createdAt || u.createTime || u.updatedAt),
      updateTime: formatDate(u.updatedAt || u.createdAt)
    }
  })

  // 统计总数
  const totalRes = await db.collection('users').where(query).count()

  return successResponse({ list: users, total: totalRes.total })
}

// 更新用户信息
async function updateUser(event) {
  const { userId, nickname, status, openid } = event
  
  if (!userId) {
    return errorResponse('用户ID不能为空')
  }
  
  const updateData = {}
  if (nickname !== undefined) updateData.nickname = nickname
  if (status !== undefined) updateData.status = status
  
  if (Object.keys(updateData).length === 0) {
    return errorResponse('没有需要更新的字段')
  }
  
  await db.collection('users').doc(userId).update({
    data: updateData
  })
  
  // 如果封禁用户，同时更新封禁列表
  if (status === '封禁' && openid) {
    await db.collection('bannedUsers').where({ openid }).get().then(async res => {
      if (res.data.length === 0) {
        await db.collection('bannedUsers').add({
          data: {
            openid,
            bannedAt: new Date(),
            reason: '管理员封禁'
          }
        })
      }
    })
  }
  
  // 如果解封用户，从封禁列表移除
  if (status === '正常' && openid) {
    await db.collection('bannedUsers').where({ openid }).remove()
  }
  
  return successResponse(null, '更新成功')
}

// 删除用户（含所有数据）
async function deleteUser(event) {
  const { userId, openid } = event
  
  if (!userId) {
    return errorResponse('用户ID不能为空')
  }
  
  // 开始事务
  const transaction = await db.startTransaction()
  
  try {
    // 删除用户
    await transaction.collection('users').doc(userId).remove()
    
    // 删除该用户的宠物
    const petsRes = await transaction.collection('pets').where({ openid }).get()
    for (const pet of petsRes.data) {
      await transaction.collection('pets').doc(pet._id).remove()
    }
    
    // 删除该用户的足迹
    await transaction.collection('footprints').where({ openid }).remove()
    
    // 删除该用户的记录
    await transaction.collection('records').where({ openid }).remove()
    
    // 删除该用户的产蛋记录
    await transaction.collection('eggRecords').where({ openid }).remove()
    
    // 提交事务
    await transaction.commit()
    
    return successResponse(null, '删除成功')
  } catch (error) {
    // 回滚事务
    await transaction.rollback()
    return errorResponse('删除失败: ' + error.message, error)
  }
}

// 获取宠物列表
async function getPets(event) {
  const { searchText = '', filterCategory = '', page = 1, pageSize = 20 } = event
  
  let query = {}
  
  if (searchText) {
    query.name = db.RegExp({ regexp: searchText, options: 'i' })
  }
  
  if (filterCategory) {
    query.category = filterCategory
  }
  
  const res = await db.collection('pets')
    .where(query)
    .orderBy('createdAt', 'desc')
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .get()
  
  // 获取所有宠物的openid，批量查询用户信息
  const openids = [...new Set(res.data.map(p => p.openid).filter(Boolean))]
  
  const usersMap = {}
  
  if (openids.length > 0) {
    const usersRes = await db.collection('users').where({
      openid: db.command.in(openids)
    }).get()
    
    usersRes.data.forEach(user => {
      // 优先使用昵称，没有则使用用户名或openid的一部分
      let nickname = user.nickname || user.username || user.name
      if (!nickname || nickname.trim() === '') {
        // 使用openid的后8位作为标识
        nickname = user.openid ? '用户_' + user.openid.slice(-8) : '未知'
      }
      usersMap[user.openid] = nickname
    })
  }
  
  const pets = res.data.map(p => {
    // 获取第一张图片作为头像
    const photos = p.photos || []
    const avatar = photos.length > 0 ? photos[0] : (p.avatar || '')
    // 根据openid获取主人昵称
    const owner = usersMap[p.openid] || '未知'
    
    return {
      id: p._id,
      name: p.name || '未命名',
      category: p.category || '其他',
      owner: owner,
      avatar: avatar,
      createTime: formatDate(p.createdAt)
    }
  })

  return successResponse({ list: pets, total: res.data.length })
}

// 获取足迹列表
async function getFootprints(event) {
  const { searchText = '', filterDate = '', page = 1, pageSize = 20 } = event
  
  let query = {}
  
  if (filterDate === 'today') {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    query.createdAt = _.gte(today)
  } else if (filterDate === 'week') {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    query.createdAt = _.gte(weekAgo)
  }
  
  const res = await db.collection('footprints')
    .where(query)
    .orderBy('createdAt', 'desc')
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .get()
  
  let footprints = res.data.map(f => ({
    id: f._id,
    content: f.text || f.content || '',
    petName: f.petName || '未知',
    owner: f.ownerName || f.nickname || '未知',
    photos: f.photos || [],
    createTime: formatDate(f.createdAt)
  }))
  
  // 搜索过滤
  if (searchText) {
    footprints = footprints.filter(f => 
      f.content.includes(searchText) || f.petName.includes(searchText)
    )
  }

  return successResponse({ list: footprints, total: res.data.length })
}

// 获取最近动态
async function getRecentActivities() {
  const res = await db.collection('footprints')
    .orderBy('createdAt', 'desc')
    .limit(5)
    .get()
  
  const activities = res.data.map(f => ({
    id: f._id,
    title: f.text || f.content || '发布了新足迹',
    time: formatTime(f.createdAt),
    type: 'footprint'
  }))

  return successResponse(activities)
}

// 获取用户增长趋势
async function getUserGrowth(event) {
  const { days = 7 } = event
  
  const result = []
  const now = new Date()
  
  for (let i = days - 1; i >= 0; i--) {
    const dayStart = new Date(now)
    dayStart.setDate(now.getDate() - i)
    dayStart.setHours(0, 0, 0, 0)
    
    const dayEnd = new Date(dayStart)
    dayEnd.setHours(23, 59, 59, 999)
    
    const count = await db.collection('users')
      .where({
        createdAt: _.gte(dayStart).and(_.lte(dayEnd))
      })
      .count()
    
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    result.push({
      day: weekDays[dayStart.getDay()],
      count: count.total
    })
  }
  
  return successResponse(result)
}

// 获取宠物类型分布
async function getPetDistribution() {
  const petsRes = await db.collection('pets').get()
  const pets = petsRes.data
  
  const distribution = {}
  pets.forEach(p => {
    const cat = p.category || '其他'
    distribution[cat] = (distribution[cat] || 0) + 1
  })
  
  const total = pets.length
  const result = Object.keys(distribution).map(key => ({
    type: key,
    count: distribution[key],
    percentage: total > 0 ? ((distribution[key] / total) * 100).toFixed(0) : 0
  }))
  
  return successResponse(result)
}

// 获取系统配置
// 获取系统配置
async function getConfig() {
  try {
    const res = await db.collection('systemConfig').limit(1).get()
    if (res.data.length > 0) {
      return successResponse(res.data[0])
    }
  } catch (error) {
    console.error('获取配置失败:', error)
  }
  
  // 返回默认配置
  return successResponse({
    systemName: '龟上心',
    version: '1.0.0',
    servicePhone: '',
    cloudEnvId: 'guishangxin',
    imageServer: '',
    imageServerUrl: '',
    imageTimeout: 60000,
    apiUrl: '',
    maxPetCount: 10,
    maxFootprintImages: 9,
    allowRegister: true,
    allowAnonymous: false,
    enablePush: false,
    notificationTitle: '',
    notificationContent: '',
    notice: '',
    // 腾讯云 COS 配置
    qcloudSecretId: '',
    qcloudSecretKey: '',
    qcloudBucket: '',
    qcloudRegion: 'ap-guangzhou',
    // 语音识别配置
    asrSecretId: '',
    asrSecretKey: '',
    asrRegion: 'ap-guangzhou'
  })
}

// 更新系统配置
async function updateConfig(config) {
  const { OPENID } = cloud.getWXContext()
  
  try {
    // 删除不能更新的字段（_id、createdAt 等）
    const { _id, createdAt, ...updateData } = config
    
    const res = await db.collection('systemConfig').limit(1).get()
    
    if (res.data.length > 0) {
      await db.collection('systemConfig').doc(res.data[0]._id).update({
        data: {
          ...updateData,
          updatedAt: db.serverDate(),
          updatedBy: OPENID
        }
      })
    } else {
      await db.collection('systemConfig').add({
        data: {
          ...updateData,
          createdAt: db.serverDate(),
          updatedAt: db.serverDate(),
          updatedBy: OPENID
        }
      })
    }
    return successResponse(null, '配置已更新')
  } catch (error) {
    console.error('[updateConfig] 更新配置失败:', error)
    return errorResponse('更新配置失败: ' + error.message, error)
  }
}

// 格式化日期
function formatDate(date) {
  if (!date) return ''
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 格式化时间
function formatTime(date) {
  if (!date) return ''
  const d = new Date(date)
  const now = new Date()
  const diff = now - d
  
  if (diff < 60 * 1000) return '刚刚'
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}分钟前`
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))}小时前`
  if (diff < 7 * 24 * 60 * 60 * 1000) return `${Math.floor(diff / (24 * 60 * 60 * 1000))}天前`
  return formatDate(date)
}
