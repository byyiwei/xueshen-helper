App({
  onLaunch: function () {
    this.initLocalData()
    this.loadSystemConfig()
  },

  // 从自建服务器加载系统配置（替代原 wx.cloud.database()）
  loadSystemConfig: function () {
    const baseUrl = this.getBaseUrl()
    wx.request({
      url: baseUrl + '/api/admin/config',
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200 && res.data && res.data.success) {
          const config = res.data.data || {}
          // 合并默认值，过滤掉 undefined / null / 空字符串，防止覆盖有效值
          const merged = { ...this.globalData.systemConfig }
          Object.keys(config).forEach(key => {
            if (config[key] != null && config[key] !== '') {
              merged[key] = config[key]
            }
          })
          if (!merged.imageServerUrl) merged.imageServerUrl = baseUrl
          if (!merged.apiUrl) merged.apiUrl = baseUrl
          this.globalData.systemConfig = merged
          console.log('[systemConfig] 从服务器加载成功:', this.globalData.systemConfig)
        } else {
          console.warn('[systemConfig] 加载失败，使用默认配置')
        }
      },
      fail: (err) => {
        console.warn('[systemConfig] 请求失败，使用默认配置:', err.errMsg)
      }
    })
  },

  /** 获取 API 基础 URL */
  getBaseUrl: function () {
    return this.globalData.systemConfig.apiUrl ||
      this.globalData.systemConfig.imageServerUrl ||
      'https://pets.openget.cn'
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

  // 异步登录（wx.login → /api/auth/login → 获取 JWT + openid）
  asyncLogin: function () {
    const self = this
    wx.login({
      success: (loginRes) => {
        if (!loginRes.code) {
          console.error('App Launch - wx.login 无 code')
          return
        }
        const baseUrl = self.getBaseUrl()
        wx.request({
          url: baseUrl + '/api/auth/login',
          method: 'POST',
          data: { code: loginRes.code },
          success: (res) => {
            if (res.statusCode === 200 && res.data && res.data.success && res.data.data) {
              const { openid, token, user, isAdmin } = res.data.data
              try {
                wx.setStorageSync('openid', openid)
                wx.setStorageSync('token', token)
              } catch (e) {}
              self.globalData.isLoggedIn = true
              self.globalData.openid = openid
              if (isAdmin) {
                try { wx.setStorageSync('isAdmin', true) } catch (e) {}
              }
              if (user) {
                try {
                  let localUser = wx.getStorageSync('userInfo') || {}
                  if (!localUser.nickname || localUser.nickname === '') {
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
                self.generateQrcode(openid)
                self._checkSecurityNotifications()
              }, 500)
            }
          },
          fail: (err) => {
            console.error('App Launch - 登录请求失败:', err)
          }
        })
      },
      fail: (err) => {
        console.error('App Launch - wx.login 失败:', err)
      }
    })
  },

  // 后台静默生成小程序码，不阻塞用户操作
  generateQrcode: function (openid) {
    try {
      const shareInfo = wx.getStorageSync('shareInfo') || {}
      // 已有有效小程序码路径则跳过
      if (shareInfo.qrcode && typeof shareInfo.qrcode === 'string' && shareInfo.qrcode.length > 20) return
    } catch (e) {}

    const baseUrl = this.getBaseUrl()
    wx.request({
      url: baseUrl + '/api/qrcode/generate',
      method: 'POST',
      data: {
        scene: 'userId=' + openid,
        page: '/subpkg-report/pages/public/index'
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data && res.data.success) {
          const qrcodePath = res.data.data  // HTTP 可访问路径
          if (!qrcodePath || typeof qrcodePath !== 'string') {
            console.error('小程序码生成失败: 返回路径为空')
            return
          }
          const savedShareInfo = wx.getStorageSync('shareInfo') || {}
          savedShareInfo.qrcode = qrcodePath.startsWith('http')
            ? qrcodePath
            : baseUrl + '/' + qrcodePath.replace(/^\/+/, '')
          wx.setStorageSync('shareInfo', savedShareInfo)
        } else {
          console.error('小程序码生成失败:', res.data ? res.data.message : '未知错误')
        }
      },
      fail: (err) => {
        console.error('小程序码请求失败:', err)
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

  // 强制登录
  forceLogin: function () {
    const self = this
    wx.showLoading({ title: '登录中...' })
    wx.login({
      success: (loginRes) => {
        if (!loginRes.code) {
          wx.hideLoading()
          wx.showToast({ title: '登录失败，请重试', icon: 'none' })
          return
        }
        const baseUrl = self.getBaseUrl()
        wx.request({
          url: baseUrl + '/api/auth/login',
          method: 'POST',
          data: { code: loginRes.code },
          success: (res) => {
            wx.hideLoading()
            if (res.statusCode === 200 && res.data && res.data.success && res.data.data) {
              const { openid, token, isAdmin } = res.data.data
              try {
                wx.setStorageSync('openid', openid)
                wx.setStorageSync('token', token)
              } catch (e) {}
              self.globalData.isLoggedIn = true
              self.globalData.openid = openid
              if (isAdmin) {
                try { wx.setStorageSync('isAdmin', true) } catch (e) {}
              }
              self._checkSecurityNotifications()
              wx.showToast({ title: '登录成功', icon: 'success' })
            } else {
              wx.showToast({ title: '登录失败，请重试', icon: 'none' })
            }
          },
          fail: (err) => {
            wx.hideLoading()
            wx.showToast({ title: '登录失败：' + (err.errMsg || '网络异常'), icon: 'none' })
          }
        })
      },
      fail: (err) => {
        wx.hideLoading()
        wx.showToast({ title: '登录失败：' + (err.errMsg || '登录凭证获取失败'), icon: 'none' })
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
      wx.removeStorageSync('token')
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
      imageServerUrl: 'https://pets.openget.cn',
      apiUrl: 'https://pets.openget.cn'
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
    preloadedQrcode: null,
    // 龟缸预加载数据
    preloadedTanks: null,
    preloadedTankStats: null
  }
})
