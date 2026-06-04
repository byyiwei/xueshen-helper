const ThemeManager = require('./utils/theme.js')

App({
  onLaunch: function () {
    try {
      wx.cloud.init({
        env: 'cloud1-d0g853l9d7017ea3b'
      })
      console.log('云开发初始化成功')
    } catch (error) {
      console.log('云开发初始化失败，使用本地数据模式:', error)
    }

    try {
      const savedTheme = ThemeManager.initTheme()
      this.globalData.theme = savedTheme
    } catch (error) {
      console.error('读取主题失败:', error)
    }

    // 1. 本地已存在 openid → 视为已登录，直接恢复会话
    try {
      const openid = wx.getStorageSync('openid')
      if (openid) {
        this.globalData.isLoggedIn = true
        this.globalData.openid = openid
        this.generateQrcode(openid)
        console.log('App Launch - 已登录用户恢复会话')
        return
      }
    } catch (error) {
      console.error('读取登录状态失败:', error)
    }

    // 2. 本地没有 openid → 静默调用登录云函数获取 openid
    //    - 老用户（本设备之前同意过协议 agreedBefore = true）：自动登录
    //    - 新用户 / 主动退出过的用户：只预存 openid，等待用户在登录页勾选协议后再登录
    //    说明：不使用"数据库有用户记录"作为自动登录依据，否则退出登录后又会被立刻自动登回去
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
              // 老用户（本设备同意过协议）→ 静默自动登录
              try {
                wx.setStorageSync('openid', openid)
              } catch (e) {}
              this.globalData.isLoggedIn = true
              this.globalData.openid = openid
              // 补齐默认用户信息
              if (user) {
                try {
                  if (!user.nickname) {
                    let idx = wx.getStorageSync('userIndex') || 0
                    idx += 1
                    wx.setStorageSync('userIndex', idx)
                    user.nickname = '龟上心' + idx
                  }
                  wx.setStorageSync('userInfo', user)
                  if (user.createdAt) {
                    const t = user.createdAt instanceof Date
                      ? user.createdAt.toISOString()
                      : user.createdAt
                    wx.setStorageSync('registerTime', t)
                  }
                } catch (e) {}
              }
              this.generateQrcode(openid)
              console.log('App Launch - 老用户自动登录成功, openid:', openid)
            } else {
              // 新用户 或 主动退出过的用户 → 预存 openid，交给登录页
              this.globalData.pendingOpenid = openid
              this.globalData.pendingUser = user || null
              console.log('App Launch - 静默获取 openid 成功（等待用户勾选协议后登录）')
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

    console.log('App Launch')
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
          console.log('小程序码生成成功, fileID:', fileID)
        } else {
          console.error('小程序码生成失败:', res.result ? res.result.message : '未知错误')
        }
      },
      fail: (err) => {
        console.error('小程序码云函数调用失败:', err)
      }
    })
  },

  // 检查是否已登录，未登录跳转到登录页
  checkLogin: function () {
    if (!this.globalData.isLoggedIn) {
      wx.reLaunch({
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
      url: '/pages/login/index'
    })
  },
  
  // 兼容旧代码 - 委托给 ThemeManager
  getThemeConfig: function (theme) {
    return ThemeManager.getThemeConfig(theme)
  },
  
  // 兼容旧代码 - 委托给 ThemeManager
  setTheme: function (theme) {
    ThemeManager.setTheme(theme)
  },
  
  onShow: function () {
    console.log('App Show')
  },
  onHide: function () {
    console.log('App Hide')
  },
  globalData: {
    userInfo: null,
    theme: ThemeManager.DEFAULT_THEME,
    isLoggedIn: false,
    openid: null
  }
})
