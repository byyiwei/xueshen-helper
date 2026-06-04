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

exports.main = async (event, context) => {
  const db = cloud.database()
  const { OPENID, APPID, UNIONID } = cloud.getWXContext()

  try {
    // 先查询用户是否存在
    let user = await db.collection('users').where({ openid: OPENID }).get()

    if (user.data.length === 0) {
      // 新用户，创建记录
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
