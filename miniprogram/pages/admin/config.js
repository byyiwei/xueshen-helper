Page({
  data: {
    loading: true,
    config: {
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
    }
  },

  onLoad: function () {
    this.loadConfig()
  },

  onShow: function () {
    this.loadConfig()
  },

  // 返回前端
  onBackToFront: function () {
    wx.navigateBack({
      delta: 1,
      fail: function () {
        wx.switchTab({ url: '/pages/my/index' })
      }
    })
  },

  loadConfig: async function () {
    this.setData({ loading: true })
    try {
      const res = await wx.cloud.callFunction({
        name: 'admin',
        data: { action: 'getConfig' }
      })
      
      if (res.result.success) {
        this.setData({ 
          config: { ...this.data.config, ...res.result.data },
          loading: false 
        })
      } else {
        this.setData({ loading: false })
        wx.showToast({ title: res.result.message || '加载失败', icon: 'none' })
      }
    } catch (error) {
      console.error('加载配置失败:', error)
      // 使用本地存储作为兜底
      try {
        const saved = wx.getStorageSync('systemConfig')
        if (saved) {
          this.setData({ config: { ...this.data.config, ...saved }, loading: false })
        } else {
          this.setData({ loading: false })
        }
      } catch (e) {
        this.setData({ loading: false })
      }
    }
  },

  saveConfig: async function () {
    wx.showLoading({ title: '保存中...' })
    try {
      console.log('[config] 开始保存配置, config:', JSON.stringify(this.data.config))
      const res = await wx.cloud.callFunction({
        name: 'admin',
        data: { 
          action: 'updateConfig',
          data: this.data.config
        }
      })
      
      wx.hideLoading()
      
      console.log('[config] 云函数返回结果:', JSON.stringify(res))
      
      if (res.result.success) {
        // 同时保存到本地
        try {
          wx.setStorageSync('systemConfig', this.data.config)
        } catch (e) {}
        wx.showToast({ title: '保存成功', icon: 'success' })
      } else {
        console.error('[config] 保存失败, message:', res.result.message, ', error:', res.result.error)
        wx.showToast({ title: res.result.message || '保存失败', icon: 'none' })
      }
    } catch (error) {
      wx.hideLoading()
      console.error('[config] 保存配置异常:', error)
      console.error('[config] 异常详情:', error.message, error.stack)
      wx.showToast({ title: '保存失败: ' + (error.message || '网络错误'), icon: 'none' })
    }
  },

  onInputChange: function (e) {
    const key = e.currentTarget.dataset.key
    this.setData({ [`config.${key}`]: e.detail.value })
  },

  onSwitchChange: function (e) {
    const key = e.currentTarget.dataset.key
    this.setData({ [`config.${key}`]: e.detail.value })
  },

  resetConfig: function () {
    wx.showModal({
      title: '重置配置',
      content: '确定要重置为默认配置吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            config: {
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
            }
          })
          wx.showToast({ title: '已重置', icon: 'success' })
        }
      }
    })
  },

  // 导航到仪表盘
  goToDashboard: function () {
    wx.redirectTo({ url: '/pages/admin/index' })
  },

  // 导航到宠物管理
  goToPets: function () {
    wx.redirectTo({ url: '/pages/admin/pets' })
  },

  // 导航到足迹管理
  goToFootprints: function () {
    wx.redirectTo({ url: '/pages/admin/footprints' })
  },

  // 导航到用户管理
  goToUsers: function () {
    wx.redirectTo({ url: '/pages/admin/users' })
  }
})
