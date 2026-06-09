const cloud = require('wx-server-sdk')
const { getDB, getOpenId, successResponse, errorResponse, normalizeId, normalizeIds } = require('./utils.js')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = getDB()
const _ = db.command

/**
 * 净化图片URL，将过期的临时URL转为cloud://fileID
 * 临时URL: https://xxx.tcb.qcloud.la/pets/xxx.jpg?sign=xxx
 * fileID:   cloud://cloud1-d0g853l9d7017ea3b.xxx/pets/xxx.jpg
 */
function sanitizePhotoUrl(url) {
  if (!url || typeof url !== 'string') return url
  if (url.startsWith('cloud://')) return url
  if (url.includes('tcb.qcloud.la')) {
    const match = url.match(/^https?:\/\/([^\/]+)(\/[^\?]+)/)
    if (match) {
      const domainPrefix = match[1].replace('.tcb.qcloud.la', '')
      return 'cloud://cloud1-d0g853l9d7017ea3b.' + domainPrefix + match[2]
    }
  }
  return url
}

function sanitizePhotos(photos) {
  if (!Array.isArray(photos)) return photos
  return photos.map(sanitizePhotoUrl)
}

/**
 * 净化宠物数据的photos字段
 */
function sanitizePetData(pet) {
  if (!pet) return pet
  if (pet.photos) {
    pet.photos = sanitizePhotos(pet.photos)
  }
  return pet
}

exports.main = async (event, context) => {
  const { action, data } = event
  const openid = getOpenId(context)

  try {
    switch (action) {
      case 'create':
        return await createPet(data, openid)
      case 'list':
        return await getPetList(data, openid)
      case 'get':
        return await getPetById(data.id, openid)
      case 'update':
        return await updatePet(data, openid)
      case 'delete':
        return await deletePet(data.id, openid)
      case 'publicList':
        return await getPublicPets(data.userId)
      case 'getPedigree':
        return await getPedigree(data.id, openid, data.maxGeneration || 3)
      case 'publicGet':
        return await getPublicPetById(data.id)
      default:
        return errorResponse('未知操作')
    }
  } catch (error) {
    console.error('宠物操作失败:', error)
    return errorResponse(error.message || '操作失败', error)
  }
}

async function createPet(data, openid) {
  if (!data.name) {
    throw new Error('宠物名称不能为空')
  }

  // 别名唯一性校验（非空时检查）
  if (data.alias && data.alias.trim()) {
    const existingAlias = await db.collection('pets').where({
      alias: data.alias.trim(),
      openid
    }).limit(1).get()
    if (existingAlias.data && existingAlias.data.length > 0) {
      throw new Error('别名「' + data.alias.trim() + '」已存在，请使用其他别名')
    }
  }

  const pet = {
    name: data.name,
    category: data.category || '无',
    gender: data.gender || '未知',
    alias: data.alias || '',
    father: data.father || '',
    mother: data.mother || '',
    status: data.status || '正常',
    isPublic: data.isPublic || false,
    photos: data.photos || [],
    openid,
    createdAt: db.serverDate(),
    updatedAt: db.serverDate()
  }

  const result = await db.collection('pets').add({ data: pet })
  return successResponse({ id: result._id, ...pet })
}

async function getPetList(params, openid) {
  // 构建统一的查询条件对象（避免连续 .where() 覆盖问题）
  const conditions = { openid }

  if (params && params.filter) {
    const { series, gender, searchText } = params.filter

    if (series && series !== '全部') {
      conditions.category = series
    }
    if (gender && gender !== '全部') {
      conditions.gender = gender
    }
    // 状态筛选在客户端计算（基于事件记录动态推导）
    if (searchText) {
      const search = searchText.toLowerCase()
      // 搜索用 nameOR 字段实现 OR 匹配
      conditions.name = db.RegExp({ regexp: search, options: 'i' })
    }
  }

  let query = db.collection('pets').where(conditions)

  // 添加分页支持
  const pageSize = params && params.pageSize ? params.pageSize : 20
  const pageNum = params && params.pageNum ? params.pageNum : 1
  const skip = (pageNum - 1) * pageSize

  const countResult = await query.count()
  const total = countResult.total

  const result = await query.orderBy('createdAt', 'desc').skip(skip).limit(pageSize).get()
  const list = normalizeIds(result.data).map(sanitizePetData)
  return successResponse({
    list: list,
    total,
    pageNum,
    pageSize,
    hasMore: skip + result.data.length < total
  })
}

async function getPetById(id, openid) {
  const result = await db.collection('pets').doc(id).get().catch(() => null)
  if (!result || !result.data) {
    throw new Error('宠物不存在')
  }
  if (result.data.openid !== openid) {
    throw new Error('宠物不存在')
  }
  return successResponse(sanitizePetData(normalizeId(result.data)))
}

async function updatePet(data, openid) {
  const { id, ...updateData } = data

  // 先验证权限
  const petResult = await db.collection('pets').doc(id).get().catch(() => null)
  if (!petResult || !petResult.data) {
    throw new Error('更新失败，宠物不存在或无权限')
  }
  if (petResult.data.openid !== openid) {
    throw new Error('更新失败，宠物不存在或无权限')
  }

  // 别名唯一性校验（更新时排除自己）
  if (updateData.alias && updateData.alias.trim()) {
    const existingAlias = await db.collection('pets').where({
      alias: updateData.alias.trim(),
      openid,
      _id: _.neq(id)
    }).limit(1).get()
    if (existingAlias.data && existingAlias.data.length > 0) {
      throw new Error('别名「' + updateData.alias.trim() + '」已存在，请使用其他别名')
    }
  }

  await db.collection('pets').doc(id).update({
    data: { ...updateData, updatedAt: db.serverDate() }
  })
  return successResponse(null, '更新成功')
}

async function deletePet(id, openid) {
  // 先用 doc(id) 查找文档，验证其存在且属于当前用户
  const petResult = await db.collection('pets').doc(id).get().catch(() => null)
  if (!petResult || !petResult.data) {
    throw new Error('删除失败，宠物不存在或无权限')
  }
  if (petResult.data.openid !== openid) {
    throw new Error('删除失败，宠物不存在或无权限')
  }

  // 用 doc(id) 删除宠物文档
  await db.collection('pets').doc(id).remove()

  // 删除该宠物的所有关联记录（records 里有 openid 字段）
  await db.collection('records').where({ petId: id }).remove().catch(() => null)

  return successResponse(null, '删除成功')
}

// 获取指定用户的公开宠物列表
async function getPublicPets(userId) {
  if (!userId) {
    throw new Error('缺少用户ID')
  }

  // 直接查询该用户公开的宠物
  const result = await db.collection('pets')
    .where({ openid: userId, isPublic: true })
    .orderBy('createdAt', 'desc')
    .get()

  return successResponse(normalizeIds(result.data).map(sanitizePetData))
}

// 获取公开宠物详情（不需要权限验证）
async function getPublicPetById(petId) {
  if (!petId) {
    throw new Error('缺少宠物ID')
  }

  const result = await db.collection('pets').doc(petId).get().catch(() => null)
  if (!result || !result.data) {
    throw new Error('宠物不存在')
  }

  // 只允许访问公开的宠物
  if (!result.data.isPublic) {
    throw new Error('该宠物未公开')
  }

  return successResponse(sanitizePetData(normalizeId(result.data)))
}

/**
 * 获取宠物家族谱系
 * @param {string} petId - 宠物ID
 * @param {string} openid - 用户openid
 * @param {number} maxGeneration - 最大查询代数（默认3代）
 */
async function getPedigree(petId, openid, maxGeneration = 3, envId) {
  if (!petId) {
    throw new Error('宠物ID不能为空')
  }

  // 获取当前宠物信息
  const petResult = await db.collection('pets').doc(petId).get().catch(() => null)
  if (!petResult || !petResult.data) {
    throw new Error('宠物不存在')
  }
  if (petResult.data.openid !== openid) {
    throw new Error('无权限查看')
  }

  const currentPet = normalizeId(petResult.data)
  
  // 递归构建家谱树
  const fullTree = await buildFamilyTree(currentPet, openid, 0, maxGeneration, envId)
  
  // 提取父系主线
  const paternalLine = extractPaternalLine(fullTree)
  
  // 提取母系主线
  const maternalLine = extractMaternalLine(fullTree)
  
  // 统计谱系信息
  const stats = countPedigree(fullTree)

  return successResponse({
    current: currentPet,
    fullTree,
    paternalLine,
    maternalLine,
    maxGeneration,
    stats
  })
}

/**
 * 递归构建家谱树
 */
async function buildFamilyTree(pet, openid, generation, maxGeneration) {
  if (!pet || generation >= maxGeneration) {
    return null
  }

  const node = {
    ...sanitizePetData(pet),
    generation,
    father: null,
    mother: null
  }

  // 查询父本
  if (pet.father) {
    const fatherResult = await db.collection('pets')
      .where({ 
        _id: pet.father,
        openid
      })
      .get()
    
    if (fatherResult.data.length > 0) {
      node.father = await buildFamilyTree(
        normalizeId(fatherResult.data[0]),
        openid,
        generation + 1,
        maxGeneration
      )
    }
  }

  // 查询母本
  if (pet.mother) {
    const motherResult = await db.collection('pets')
      .where({ 
        _id: pet.mother,
        openid
      })
      .get()
    
    if (motherResult.data.length > 0) {
      node.mother = await buildFamilyTree(
        normalizeId(motherResult.data[0]),
        openid,
        generation + 1,
        maxGeneration
      )
    }
  }

  return node
}

/**
 * 提取父系主线
 */
function extractPaternalLine(tree) {
  const line = []
  let current = tree
  
  while (current && current.father) {
    line.push({
      id: current.father.id,
      name: current.father.name,
      alias: current.father.alias,
      gender: current.father.gender,
      category: current.father.category,
      photos: current.father.photos,
      generation: current.father.generation
    })
    current = current.father
  }
  
  return line
}

/**
 * 提取母系主线
 */
function extractMaternalLine(tree) {
  const line = []
  let current = tree
  
  while (current && current.mother) {
    line.push({
      id: current.mother.id,
      name: current.mother.name,
      alias: current.mother.alias,
      gender: current.mother.gender,
      category: current.mother.category,
      photos: current.mother.photos,
      generation: current.mother.generation
    })
    current = current.mother
  }
  
  return line
}

/**
 * 统计谱系信息
 */
function countPedigree(tree) {
  let totalAncestors = 0
  let maleCount = 0
  let femaleCount = 0
  let maxDepth = 0

  function traverse(node, depth) {
    if (!node) return
    
    if (depth > 0) {
      totalAncestors++
      if (node.gender === '公') maleCount++
      if (node.gender === '母') femaleCount++
    }
    
    maxDepth = Math.max(maxDepth, depth)
    
    if (node.father) traverse(node.father, depth + 1)
    if (node.mother) traverse(node.mother, depth + 1)
  }

  traverse(tree, 0)

  return {
    totalAncestors,
    maleCount,
    femaleCount,
    maxDepth
  }
}
