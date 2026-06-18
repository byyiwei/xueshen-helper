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
  loadSystemConfig: function () {
    const db = wx.cloud.database()
    // 先尝试从 systemConfig 集合读取（后台管理配置）
    db.collection('systemConfig').limit(1).get({
      success: (res) => {
        if (res.data && res.data.length > 0) {
          this.globalData.systemConfig = res.data[0]
          console.log('[systemConfig] 从 systemConfig 集合读取成功:', res.data[0])
        } else {
          // 如果 systemConfig 没有数据，尝试从旧的 system 集合读取
          db.collection('system').doc('config').get({
            success: (res) => {
              if (res.data) {
                this.globalData.systemConfig = res.data
                console.log('[systemConfig] 从 system 集合读取成功:', res.data)
              } else {
                console.log('[systemConfig] 文档存在但无数据')
              }
            },
            fail: (err) => {
              console.error('[systemConfig] 读取失败:', err.errMsg || err)
            }
          })
        }
      },
      fail: (err) => {
        console.error('[systemConfig] 从 systemConfig 读取失败:', err.errMsg || err)
        // 降级到旧的 system 集合
        db.collection('system').doc('config').get({
          success: (res) => {
            if (res.data) {
              this.globalData.systemConfig = res.data
              console.log('[systemConfig] 从 system 集合读取成功:', res.data)
            }
          },
          fail: (err) => {
            console.error('[systemConfig] 降级读取也失败:', err.errMsg || err)
          }
        })
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
                  // 合并本地与云端用户信息（本地优先，云端仅补充空白字段）
                  let localUser = wx.getStorageSync('userInfo') || {}
                  // 昵称：本地已有则保留（用户主动修改的优先级最高）
                  if (!localUser.nickname) {
                    if (user.nickname && user.nickname !== '') {
                      localUser.nickname = user.nickname
                    } else {
                      let idx = wx.getStorageSync('userIndex') || 0
                      idx += 1
                      wx.setStorageSync('userIndex', idx)
                      localUser.nickname = '龟上心' + idx
                    }
                  }
                  // 头像：本地已有则保留
                  if (!localUser.avatar && user.avatar && user.avatar !== '') {
                    localUser.avatar = user.avatar
                  }
                  // 手机号：本地已有则保留
                  if (!localUser.phone && user.phone && user.phone !== '') {
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
    // 检查是否允许匿名访问
    const config = this.globalData.systemConfig || {}
    if (config.allowAnonymous) {
      return true // 允许匿名访问，直接返回成功
    }
    
    if (!this.globalData.isLoggedIn) {
      wx.navigateTo({
        url: '/pages/login/index'
      })
      return false
    }
    return true
  },
  
  // 检查是否启用推送通知
  isPushEnabled: function () {
    const config = this.globalData.systemConfig || {}
    return config.enablePush !== undefined ? config.enablePush : false
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
      wx.removeStorageSync('isAdmin') // 清除管理员状态
    } catch (e) {}
    
    wx.reLaunch({
      url: '/pages/pet/index',
      fail: function (err) {
        console.error('页面跳转失败:', err)
        // 如果reLaunch失败，尝试用navigateTo或直接显示提示
        wx.showToast({
          title: '退出成功',
          icon: 'success'
        })
      }
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
