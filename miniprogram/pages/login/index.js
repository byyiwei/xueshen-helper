const { getAPI } = require('../../utils/api.js')
const API = getAPI()

Page({
  data: {
    loading: false,
    // 默认不勾选，必须由用户主动勾选后才能登录
    agreed: false,
    autoLogging: false,
    showModal: false,
    modalTitle: '',
    agreementContent: [],
    canGoBack: false  // 是否有页面可以返回
  },

  onLoad: function (options) {
    // 检查是否有页面可以返回
    const pages = getCurrentPages()
    this.setData({ canGoBack: pages.length > 1 })

    const app = getApp()
    if (app.globalData.isLoggedIn) {
      this.navigateToHome()
      return
    }

    // 延迟检查本地登录状态，避免 too early 错误
    wx.nextTick(() => {
      try {
        const openid = wx.getStorageSync('openid')
        if (openid) {
          app.globalData.isLoggedIn = true
          app.globalData.openid = openid
          this.navigateToHome()
          return
        }
      } catch (error) {
        console.error('检查登录状态失败:', error)
      }

      // 没有本地 openid → 尝试自动获取微信 openid 并静默登录
      // 注意：新用户首次登录仍需要手动勾选协议
      this.tryAutoLogin()
    })
  },

  /**
   * 进入小程序后自动获取 openid 并自动登录
   * 若本设备存在 agreedBefore（曾经明确同意过协议），则静默自动登录
   * 否则仅预存 openid，等待用户手动勾选协议后点击登录
   */
  tryAutoLogin: async function () {
    const app = getApp()
    try {
      this.setData({ autoLogging: true })
      const result = await API.login()
      if (result.success && result.data && result.data.openid) {
        const openid = result.data.openid
        const user = result.data.user

        // 预保存 openid（作为已获取凭证）
        app.globalData.pendingOpenid = openid
        app.globalData.pendingUser = user || null

        // 仅以"本设备同意过协议"为依据自动登录，不使用数据库记录判断
        // 否则退出登录后会立刻被自动登回去
        try {
          const agreedBefore = wx.getStorageSync('agreedBefore')
          if (agreedBefore) {
            wx.setStorageSync('openid', openid)
            app.globalData.isLoggedIn = true
            app.globalData.openid = openid
            this.saveUserInfo(user)
            this.navigateToHome()
            return
          }
        } catch (e) {
          console.error('判断老用户失败:', e)
        }

      }
    } catch (error) {
      console.error('自动获取 openid 失败:', error)
    } finally {
      this.setData({ autoLogging: false })
    }
  },

  handleLogin: async function () {
    if (this.data.loading) return

    if (!this.data.agreed) {
      wx.showToast({
        title: '请先同意用户协议和隐私政策',
        icon: 'none'
      })
      return
    }

    this.setData({ loading: true })

    try {
      const app = getApp()
      let result
      // 如果 onLoad 已经静默获取过 openid，直接使用缓存；否则重新调用登录云函数
      if (app.globalData.pendingOpenid) {
        result = {
          success: true,
          data: {
            openid: app.globalData.pendingOpenid,
            user: app.globalData.pendingUser || null
          }
        }
      } else {
        result = await API.login()
      }

      if (result.success) {
        const openid = result.data.openid
        const user = result.data.user

        app.globalData.isLoggedIn = true
        app.globalData.openid = openid
        wx.setStorageSync('openid', openid)
        // 记录用户已同意协议，下次进入小程序可自动登录
        try {
          wx.setStorageSync('agreedBefore', true)
        } catch (e) {}

        this.saveUserInfo(user)

        wx.showToast({
          title: '登录成功',
          icon: 'success'
        })

        setTimeout(() => {
          this.navigateToHome()
        }, 1500)
      } else {
        throw new Error(result.message || '登录失败')
      }
    } catch (error) {
      console.error('登录失败:', error)
      const errMsg = error.message || error.errMsg || '登录失败，请重试'
      wx.showToast({
        title: errMsg.length > 20 ? errMsg.substring(0, 20) + '...' : errMsg,
        icon: 'none',
        duration: 3000
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  /**
   * 保存用户信息到本地存储（本地优先，云端仅补充空白字段）
   * 
   * 策略：用户主动修改过的字段（昵称/头像）以本地为准，
   * 云端只在本地为空时才补充，避免覆盖用户的最新修改。
   */
  saveUserInfo: function (user) {
    let localUser = wx.getStorageSync('userInfo') || {}
    if (user) {
      // 昵称：本地已有则保留（用户主动修改过的优先级最高）
      if (!localUser.nickname) {
        localUser.nickname = (user.nickname && user.nickname !== '')
          ? user.nickname
          : this._generateDefaultNickname()
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
        const registerTime = user.createdAt instanceof Date
          ? user.createdAt.toISOString()
          : user.createdAt
        wx.setStorageSync('registerTime', registerTime)
      }
    } else {
      // 云端无用户数据，保留本地（若无昵称则生成默认）
      if (!localUser.nickname) {
        localUser.nickname = this._generateDefaultNickname()
      }
      if (!localUser.avatar) localUser.avatar = ''
      if (!localUser.phone) localUser.phone = ''
      wx.setStorageSync('userInfo', localUser)
    }
  },

  _generateDefaultNickname: function () {
    let userIndex = wx.getStorageSync('userIndex') || 0
    userIndex += 1
    wx.setStorageSync('userIndex', userIndex)
    return '养龟档案' + userIndex
  },

  toggleAgreement: function () {
    this.setData({ agreed: !this.data.agreed })
  },

  showUserAgreement: function () {
    const content = [
      { type: 'title', content: '用户协议' },
      { type: 'paragraph', content: '欢迎使用「养龟档案」小程序！' },
      { type: 'subtitle', content: '一、服务条款' },
      { type: 'list', items: [
        '用户必须是年满18周岁的成年人，或在监护人的指导下使用本服务。',
        '用户承诺提供的所有信息真实、准确、完整。',
        '用户应妥善保管自己的账号和密码，对账号下的所有行为负责。'
      ], prefix: '' },
      { type: 'subtitle', content: '二、用户权利与义务' },
      { type: 'list', items: [
        '用户有权使用小程序提供的各项功能。',
        '用户不得利用小程序从事违法违规活动。',
        '用户应遵守本协议的各项条款。'
      ], prefix: '' },
      { type: 'subtitle', content: '三、隐私保护' },
      { type: 'list', items: [
        '我们重视用户的隐私保护，不会泄露用户的个人信息。',
        '用户的宠物数据仅用于提供更好的服务。'
      ], prefix: '' },
      { type: 'subtitle', content: '四、服务变更' },
      { type: 'paragraph', content: '我们保留随时变更或终止服务的权利。' },
      { type: 'subtitle', content: '五、免责声明' },
      { type: 'list', items: [
        '我们不对服务的可用性做任何保证。',
        '我们不对用户数据的丢失承担责任。'
      ], prefix: '' },
      { type: 'subtitle', content: '六、协议变更' },
      { type: 'paragraph', content: '我们有权随时更新本协议，用户应定期查看。' },
      { type: 'subtitle', content: '七、联系方式' },
      { type: 'paragraph', content: '如有问题，请通过小程序内的反馈渠道联系我们。' }
    ]
    
    this.setData({
      showModal: true,
      modalTitle: '用户协议',
      agreementContent: content
    })
  },

  showPrivacyPolicy: function () {
    const content = [
      { type: 'title', content: '隐私政策' },
      { type: 'paragraph', content: '「养龟档案」重视用户隐私保护，以下是我们的隐私政策：' },
      { type: 'subtitle', content: '一、收集的信息' },
      { type: 'list', items: [
        '用户信息：包括昵称、头像、手机号码等。',
        '宠物信息：包括宠物名称、品种、性别等。',
        '使用数据：包括使用记录、操作日志等。'
      ], prefix: '' },
      { type: 'subtitle', content: '二、信息使用' },
      { type: 'list', items: [
        '提供服务：使用收集的信息为用户提供服务。',
        '改进服务：根据使用数据改进服务质量。',
        '安全保障：保护用户账号和数据安全。'
      ], prefix: '' },
      { type: 'subtitle', content: '三、信息存储' },
      { type: 'list', items: [
        '数据存储在安全的服务器上。',
        '数据传输采用加密方式。'
      ], prefix: '' },
      { type: 'subtitle', content: '四、信息分享' },
      { type: 'list', items: [
        '不会向第三方分享用户个人信息。',
        '依法配合相关部门的信息查询。'
      ], prefix: '' },
      { type: 'subtitle', content: '五、用户权利' },
      { type: 'list', items: [
        '用户有权查看、修改自己的信息。',
        '用户有权删除自己的账号和数据。'
      ], prefix: '' },
      { type: 'subtitle', content: '六、Cookie政策' },
      { type: 'list', items: [
        '使用Cookie提升用户体验。',
        '用户可以选择禁用Cookie，但可能影响部分功能。'
      ], prefix: '' },
      { type: 'subtitle', content: '七、政策变更' },
      { type: 'paragraph', content: '我们有权更新隐私政策，用户应定期查看。' }
    ]
    
    this.setData({
      showModal: true,
      modalTitle: '隐私政策',
      agreementContent: content
    })
  },

  hideModal: function () {
    this.setData({ showModal: false })
  },

  stopPropagation: function () {},

  // 跳过登录，返回首页浏览
  goBack: function () {
    const pages = getCurrentPages()
    if (pages.length > 1) {
      wx.navigateBack()
    } else {
      wx.switchTab({ url: '/pages/pet/index' })
    }
  },

  navigateToHome: function () {
    const pages = getCurrentPages()
    if (pages.length > 1) {
      wx.navigateBack()
    } else {
      wx.switchTab({
        url: '/pages/pet/index'
      })
    }
  }
})
