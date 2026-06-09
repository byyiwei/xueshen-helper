App({
  onLaunch: function () {
    // 云开发初始化（异步完成，不阻塞后续逻辑）
    wx.cloud.init({
      env: 'cloud1-d0g853l9d7017ea3b'
    }).then(() => {

      // 初始化完成后再执行需要云能力的操作
      this.onCloudReady()
    }).catch((error) => {

    })

    // 延迟执行本地数据恢复，避免 too early 错误
    wx.nextTick(() => {
      this.initLocalData()
    })
  },

  // 云开发就绪后的回调
  onCloudReady: function () {
    // 加载系统配置（图片服务器地址等）
    this.loadSystemConfig()

    // 只有已登录用户才需要恢复云端会话
    wx.nextTick(() => {
      try {
        const openid = wx.getStorageSync('openid')
        if (openid && !this.globalData.openid) {
          this.globalData.isLoggedIn = true
          this.globalData.openid = openid
          this.generateQrcode(openid)

        }
      } catch (error) {
        console.error('恢复会话失败:', error)
      }
    })
  },

  // 从云数据库加载系统配置
  // 集合: system  文档 _id: config
  // 字段: imageServerUrl（图片服务器地址）
  loadSystemConfig: function () {
    const db = wx.cloud.database()
    db.collection('system').doc('config').get({
      success: (res) => {
        if (res.data) {
          this.globalData.systemConfig = res.data
          console.log('[systemConfig] 读取成功:', res.data)
        } else {
          console.log('[systemConfig] 文档存在但无数据')
        }
      },
      fail: (err) => {
        console.error('[systemConfig] 读取失败:', err.errMsg || err)
      }
    })
  },

  // 初始化本地数据（同步执行，不依赖云开发）
  initLocalData: function () {
    try {
      const openid = wx.getStorageSync('openid')
      if (openid) {
        this.globalData.isLoggedIn = true
        this.globalData.openid = openid
        // 延迟执行需要云环境的操作
        setTimeout(() => {
          this.generateQrcode(openid)
        }, 500)

        return
      }
    } catch (error) {
      console.error('读取登录状态失败:', error)
    }

    // 本地无 openid，异步获取
    this.asyncLogin()
  },

  // 异步登录流程
  asyncLogin: function () {
    try {
      wx.cloud.callFunction({
        name: 'login',
        data: { action: '', data: {} },
        success: (res) => {
          if (res.result && res.result.success && res.result.data && res.result.data.openid) {
            const openid = res.result.data.openid
            const user = res.result.data.user
            let agreedBefore = false
            try {
              agreedBefore = wx.getStorageSync('agreedBefore')
            } catch (e) {}

            if (agreedBefore) {
              // 老用户自动登录
              try {
                wx.setStorageSync('openid', openid)
              } catch (e) {}
              this.globalData.isLoggedIn = true
              this.globalData.openid = openid
              if (user) {
                try {
                  // 合并本地与云端用户信息（本地优先，云端补充）
                  let localUser = wx.getStorageSync('userInfo') || {}
                  // 云端有昵称则用云端，否则保留本地
                  if (user.nickname && user.nickname !== '') {
                    localUser.nickname = user.nickname
                  } else if (!localUser.nickname) {
                    // 云端和本地都没有昵称，生成默认
                    let idx = wx.getStorageSync('userIndex') || 0
                    idx += 1
                    wx.setStorageSync('userIndex', idx)
                    localUser.nickname = '龟上心' + idx
                  }
                  // 云端有头像则用云端，否则保留本地
                  if (user.avatar && user.avatar !== '') {
                    localUser.avatar = user.avatar
                  }
                  // 云端有手机则用云端
                  if (user.phone && user.phone !== '') {
                    localUser.phone = user.phone
                  }
                  wx.setStorageSync('userInfo', localUser)
                  if (user.createdAt) {
                    const t = user.createdAt instanceof Date
                      ? user.createdAt.toISOString()
                      : user.createdAt
                    wx.setStorageSync('registerTime', t)
                  }
                } catch (e) {}
              }
              setTimeout(() => {
                this.generateQrcode(openid)
              }, 500)

            } else {
              // 新用户预存 openid
              this.globalData.pendingOpenid = openid
              this.globalData.pendingUser = user || null

            }
          }
        },
        fail: (err) => {
          console.error('App Launch - 静默获取 openid 失败:', err)
        }
      })
    } catch (error) {
      console.error('App Launch - 静默登录流程异常:', error)
    }
  },

  // 后台静默生成小程序码，不阻塞用户操作
  generateQrcode: function (openid) {
    try {
      const shareInfo = wx.getStorageSync('shareInfo') || {}
      // 已有云端小程序码（cloud:// fileID）则跳过；旧数据存的是临时URL需重新生成
      if (shareInfo.qrcode && shareInfo.qrcode.startsWith('cloud://')) return
    } catch (e) {}

    wx.cloud.callFunction({
      name: 'qrcode',
      data: {
        action: 'generate',
        data: {
          scene: 'userId=' + openid,
          page: '/pages/public/index'
        }
      },
      success: (res) => {
        if (res.result && res.result.success) {
          const fileID = res.result.data  // cloud:// 格式，永久有效
          const savedShareInfo = wx.getStorageSync('shareInfo') || {}
          savedShareInfo.qrcode = fileID
          wx.setStorageSync('shareInfo', savedShareInfo)

        } else {
          console.error('小程序码生成失败:', res.result ? res.result.message : '未知错误')
        }
      },
      fail: (err) => {
        console.error('小程序码云函数调用失败:', err)
      }
    })
  },

  // 检查是否已登录，未登录则跳转登录页（用户可返回）
  requireLogin: function () {
    if (!this.globalData.isLoggedIn) {
      wx.navigateTo({
        url: '/pages/login/index'
      })
      return false
    }
    return true
  },
  
  // 登出：清理所有登录态与自动登录相关标记
  logout: function () {
    this.globalData.isLoggedIn = false
    this.globalData.openid = null
    this.globalData.pendingOpenid = null
    this.globalData.pendingUser = null
    this.globalData.userInfo = null
    try {
      wx.removeStorageSync('openid')
      wx.removeStorageSync('agreedBefore')
      wx.removeStorageSync('userInfo')
      wx.removeStorageSync('registerTime')
    } catch (e) {}
    wx.reLaunch({
      url: '/pages/pet/index'
    })
  },
  
  onShow: function () {

  },
  onHide: function () {

  },
  globalData: {
    userInfo: null,
    isLoggedIn: false,
    openid: null,
    systemConfig: {
      imageServerUrl: 'http://192.168.110.29:3000'
    }
  }
})
