const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

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

// 从数据库获取管理员列表
async function getAdmins(db) {
  try {
    const result = await db.collection('admins').where({ enabled: true }).get()
    return result.data || []
  } catch (error) {
    console.error('获取管理员列表失败:', error)
    // 如果数据库查询失败，返回默认管理员列表作为备用
    return [
      { openid: 'oZ_NI3YwCXVXO5_WfdcljpaJZz44', name: '管理员张三', enabled: true },
    ]
  }
}

exports.main = async (event, context) => {
  const db = cloud.database()
  const { OPENID, APPID, UNIONID } = cloud.getWXContext()
  const { action, data } = event

  // 检查是否为管理员
  if (action === 'checkAdmin') {
    const admins = await getAdmins(db)
    console.log('管理员列表:', admins)
    console.log('当前用户openid:', OPENID)
    const admin = admins.find(a => a.openid === OPENID)
    const isAdmin = !!admin
    console.log('是否为管理员:', isAdmin, '管理员信息:', admin)
    return successResponse({ 
      isAdmin, 
      openid: OPENID,
      adminName: admin ? admin.name : null,
      debugAdmins: admins // 调试用：返回管理员列表
    })
  }

  // 更新用户信息（头像、昵称）
  if (action === 'updateUserInfo' && data) {
    try {
      const updateData = { updatedAt: db.serverDate() }
      if (data.nickname !== undefined) updateData.nickname = data.nickname
      if (data.avatar !== undefined) updateData.avatar = data.avatar
      if (data.phone !== undefined) updateData.phone = data.phone
      await db.collection('users').where({ openid: OPENID }).update({ data: updateData })
      return successResponse(null, '用户信息已更新')
    } catch (error) {
      return errorResponse('更新用户信息失败', error)
    }
  }

  // 更新公开名片信息（用于公开档案页展示）
  if (action === 'updatePublicProfile' && data) {
    try {
      const updateData = { updatedAt: db.serverDate() }
      if (data.specialty !== undefined) updateData.publicSpecialty = data.specialty
      if (data.wechatId !== undefined) updateData.publicWechatId = data.wechatId
      if (data.wechatPublic !== undefined) updateData.publicWechatPublic = !!data.wechatPublic
      if (data.region !== undefined) updateData.publicRegion = data.region
      if (data.tags !== undefined) updateData.publicTags = Array.isArray(data.tags) ? data.tags : []
      if (data.intro !== undefined) updateData.publicIntro = data.intro
      await db.collection('users').where({ openid: OPENID }).update({ data: updateData })
      return successResponse(null, '公开名片已更新')
    } catch (error) {
      return errorResponse('更新公开名片失败', error)
    }
  }

  try {
    // 先查询用户是否存在
    let user = await db.collection('users').where({ openid: OPENID }).get()

    if (user.data.length === 0) {
      // 新用户，检查是否允许注册
      const configRes = await db.collection('systemConfig').limit(1).get()
      const config = configRes.data.length > 0 ? configRes.data[0] : {}
      const allowRegister = config.allowRegister !== undefined ? config.allowRegister : true

      if (!allowRegister) {
        return errorResponse('当前系统已关闭新用户注册')
      }

      // 创建新用户记录
      try {
        await db.collection('users').add({
          data: {
            openid: OPENID,
            unionid: UNIONID,
            appid: APPID,
            nickname: '',
            avatar: '',
            phone: '',
            createdAt: db.serverDate(),
            updatedAt: db.serverDate()
          }
        })
        // 重新查询获取完整用户信息
        user = await db.collection('users').where({ openid: OPENID }).get()
      } catch (addError) {
        // 如果创建失败（可能集合不存在），返回 openid 让前端继续
        console.error('创建用户记录失败:', addError)
        return successResponse({
          openid: OPENID,
          unionid: UNIONID,
          appid: APPID,
          user: null,
          warning: '用户记录创建失败，请检查数据库集合'
        })
      }
    }

    return successResponse({
      openid: OPENID,
      unionid: UNIONID,
      appid: APPID,
      user: user.data[0] || null
    })
  } catch (error) {
    console.error('登录失败:', error)
    // 即使数据库操作失败，也返回 openid（云开发总能获取到）
    return successResponse({
      openid: OPENID,
      unionid: UNIONID,
      appid: APPID,
      user: null,
      warning: error.message || '数据库操作失败'
    })
  }
}
