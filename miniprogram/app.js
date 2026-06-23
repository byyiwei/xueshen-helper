App({
  onLaunch: function () {
    // 云开发初始化
    wx.cloud.init({
      env: 'cloud1-d0g853l9d7017ea3b'
    }).then(() => {
      this.onCloudReady()
    }).catch(() => {})
  },

  // 云开发就绪后的回调
  onCloudReady: function () {
    this.loadSystemConfig()
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
          this._checkSecurityNotifications()
        }, 500)

        return
      }
    } catch (error) {
      console.error('读取登录状态失败:', error)
    }

    // 本地无 openid，异步获取
    this.asyncLogin()
  },

  // 异步获取 openid 并自动登录
  asyncLogin: function () {
    try {
      wx.cloud.callFunction({
        name: 'login',
        data: { action: '', data: {} },
        success: (res) => {
          if (res.result && res.result.success && res.result.data && res.result.data.openid) {
            const openid = res.result.data.openid
            const user = res.result.data.user
            // 自动登录
            try {
              wx.setStorageSync('openid', openid)
            } catch (e) {}
            this.globalData.isLoggedIn = true
            this.globalData.openid = openid
            if (user) {
              try {
                let localUser = wx.getStorageSync('userInfo') || {}
                if (!localUser.nickname) {
                  if (user.nickname && user.nickname !== '') {
                    localUser.nickname = user.nickname
                  } else {
                    let idx = wx.getStorageSync('userIndex') || 0
                    idx += 1
                    wx.setStorageSync('userIndex', idx)
                    localUser.nickname = '养龟档案' + idx
                  }
                }
                if (!localUser.avatar && user.avatar && user.avatar !== '') {
                  localUser.avatar = user.avatar
                }
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
              this._checkSecurityNotifications()
            }, 500)
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
          page: '/subpkg-report/pages/public/index'
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

  // 检查是否已登录，未登录则跳转登录页（用户可返回继续浏览）
  requireLogin: function () {
    if (!this.globalData.isLoggedIn) {
      this.promptLogin()
      return false
    }
    return true
  },

  // 弹窗提示登录
  promptLogin: function () {
    wx.showModal({
      title: '登录提示',
      content: '登录后才能使用此功能',
      confirmText: '去登录',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.forceLogin()
        }
      }
    })
  },

  // 强制登录（静默获取 openid 并自动登录）
  forceLogin: function () {
    wx.showLoading({ title: '登录中...' })
    wx.cloud.callFunction({
      name: 'login',
      data: { action: '', data: {} },
      success: (res) => {
        if (res.result && res.result.success && res.result.data && res.result.data.openid) {
          const openid = res.result.data.openid
          try { wx.setStorageSync('openid', openid) } catch (e) {}
          this.globalData.isLoggedIn = true
          this.globalData.openid = openid
          // 登录成功后检查审核违规通知
          this._checkSecurityNotifications()
          wx.showToast({ title: '登录成功', icon: 'success' })
        } else {
          wx.hideLoading()
          wx.showToast({ title: '登录失败，请重试', icon: 'none' })
        }
      },
      fail: (err) => {
        wx.hideLoading()
        wx.showToast({ title: '登录失败：' + (err.errMsg || '网络异常'), icon: 'none' })
      }
    })
  },

  // 检查是否启用推送通知
  isPushEnabled: function () {
    const config = this.globalData.systemConfig || {}
    return config.enablePush !== undefined ? config.enablePush : false
  },
  
  // 登出：清理所有登录态
  logout: function () {
    this.globalData.isLoggedIn = false
    this.globalData.openid = null
    this.globalData.userInfo = null
    try {
      wx.removeStorageSync('openid')
      wx.removeStorageSync('userInfo')
      wx.removeStorageSync('registerTime')
      wx.removeStorageSync('isAdmin')
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
    // 每次进入前台时检查是否有审核违规通知
    this._checkSecurityNotifications()
  },

  /**
   * 检查审核违规通知
   * @private
   */
  _checkSecurityNotifications: function () {
    if (!this.globalData.isLoggedIn) return

    const { getNotificationManager } = require('./utils/notification.js')
    const nm = getNotificationManager()

    nm.getUnreadNotifications(true).then(data => {
      if (data.total > 0) {
        // 展示通知弹窗
        nm.showNotificationDialog(data.list)
      }
    }).catch(err => {
      console.error('检查审核通知失败:', err)
    })

    // 同时检查是否有超时未回调的审核记录
    nm.getPendingChecks().then(list => {
      if (list.length > 0) {
        nm.showTimeoutToast(list.length)
      }
    }).catch(() => {})
  },
  onHide: function () {

  },
  globalData: {
    userInfo: null,
    isLoggedIn: false,
    openid: null,
    systemConfig: {
      imageServerUrl: 'http://192.168.110.29:3000'
    },
    // loading 页预加载的数据
    dataPreloaded: false,
    preloadedPets: null,
    preloadedCategories: null,
    preloadedReminders: null,
    preloadedHasReminder: false,
    preloadedStats: null,
    preloadedFeaturedPets: null,
    preloadedMyStats: null,
    preloadedShareInfo: null,
    preloadedQrcode: null
  }
})
