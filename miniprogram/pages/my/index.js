import { LPAPIFactory } from '../../lpapi/index'

const { getAPI } = require('../../utils/api.js')
const { showError, showSuccess, showLoading, hideLoading } = require('../../utils/error.js')
const { getVoiceManager } = require('../../utils/voice.js')
const { getTempUrl, convertSinglePhoto } = require('../../utils/image.js')
const { generateShareHTML } = require('../../utils/theme.js')
const { generateImageFromHTML } = require('../../utils/imageService.js')

const API = getAPI()
const voiceManager = getVoiceManager()

Page({
  data: {
    statusBarHeight: 0,
    totalNavHeight: 120,
    userInfo: {
      nickname: '龟上心',
      avatar: '',
      phone: ''
    },
    activeTab: 'data',
    switchColor: '#3A7CFF',
    provinceCityAreaCustomItem: '全部',
    qrcodeImage: '',
    // 跨宠物提醒汇总
    allReminders: [],
    hasAnyReminder: false,
    nicknameRemaining: 3,
    lpapi: null,
    showBluetoothModal: false,
    isScanning: false,
    bluetoothDevices: [],
    isAdmin: false, // 是否为管理员
    // 打印机配置 - 德佟P1
    printerConfig: {
      enabled: false,
      autoPrint: false,
      autoConnect: false,     // 开机自动连接
      connected: false,
      deviceId: '',
      deviceName: '',
      serviceId: '',
      writeCharacteristicId: '',
      notifyCharacteristicId: '',
      connectFailCount: 0,    // 连续连接失败次数
      qrPrintTypes: {
        jiaopei: true,
        chandan: true,
        chumiao: true,
        jiankang: true
      }
    },
    // 动态统计数据
    refreshing: false,
    stats: {
      petCount: 0,
      eggCount: 0,
      eggEvents: 0,
      pairEvents: 0,
      pendingCount: 0,
      warningCount: 0
    },
    // 分享卡片数据
    shareInfo: {
      cover: '',
      specialty: '',
      hasLicense: false,
      licenseImage: '',
      region: '',
      wechatId: '',
      wechatPublic: false,
      tags: ['宠物档案', '繁育记录'],
      intro: '',
      envImages: [],
      envDesc: '',
      species: []
    },
    showEditShareModal: false,
    showSkeleton: true,
    isLoggedIn: false,
    allReminders: [],
    hasAnyReminder: false,
    // 系统配置
    systemConfig: {
      systemName: '龟上心',
      version: '1.0.0',
      servicePhone: ''
    }
  },

  onLoad: function () {
    const sysInfo = wx.getSystemInfoSync()
    // 获取状态栏高度，确保至少 20px（兜底保护）
    const statusBarHeight = Math.max(sysInfo.statusBarHeight || 20, 20)
    // 获取安全区顶部间距（刘海屏设备）
    const safeAreaTop = sysInfo.safeArea ? (sysInfo.safeArea.top || statusBarHeight) : statusBarHeight
    // 取较大值：状态栏高度 vs 安全区顶部
    const finalStatusBarHeight = Math.max(statusBarHeight, safeAreaTop)
    const rpxRatio = 750 / sysInfo.windowWidth
    // 导航栏高度 = 状态栏高度(rpx) + 导航栏内容区(88rpx)
    const totalNavHeight = Math.round(finalStatusBarHeight * rpxRatio) + 88
    this.setData({ statusBarHeight: finalStatusBarHeight, totalNavHeight })
    // 初始化德佟打印SDK（离屏Canvas模式）
    this.lpapi = LPAPIFactory.getInstance({ showLog: 4 })
    this.setData({ lpapi: this.lpapi })
    // 检查登录状态，已登录才加载数据
    const app = getApp()
    const isLoggedIn = app.globalData.isLoggedIn
    this.setData({ isLoggedIn })
    if (isLoggedIn) {
      this.loadAll()
      this.loadQrcode()
    } else {
      this.setData({ showSkeleton: false })
    }
  },
  
  onShow: function () {
    const app = getApp()
    const isLoggedIn = app.globalData.isLoggedIn
    // 主动更新tabBar选中状态，并确保 tabBar 可见
    const updateTabBar = () => {
      if (typeof this.getTabBar === 'function' && this.getTabBar()) {
        const tabBar = this.getTabBar()
        tabBar.setData({ selected: 2, visible: true })
      }
    }
    updateTabBar()
    setTimeout(updateTabBar, 100)
    // 同步登录状态到页面
    this.setData({ isLoggedIn })
    
    if (!isLoggedIn) return
    
    // 调用云函数检查是否为管理员
    this.checkAdminPermission()
    
    // 登录后返回时加载数据
    if (!this._loadedOnce) {
      this._loadedOnce = true
      this.loadAll()
      this.loadQrcode()
    } else {
      // 每次进入页面都刷新统计数据
      this.loadStats()
      this.loadSystemConfig()
    }
    // 尝试自动连接打印机
    if (this.data.printerConfig.autoConnect && !this.data.printerConfig.connected) {
      this.tryAutoConnect()
    }
  },
  
  goToLogin: function () {
    const app = getApp()
    app.requireLogin()
  },

  onUnload: function () {
    if (this.lpapi) {
      this.lpapi.stopBleDiscovery()
      this.lpapi.closePrinter()
    }
  },

  onHide: function () {
    if (this.lpapi) {
      this.lpapi.stopBleDiscovery()
    }
  },

  // 加载用户打印配置（从数据库，以云端为准）
  loadUserPrintConfig: async function () {
    try {
      const db = wx.cloud.database()
      const openid = wx.getStorageSync('openid')
      if (!openid) {
        console.warn('[userPrintConfig] 未登录，跳过云端加载')
        return
      }
      
      const res = await db.collection('userPrintConfig').where({
        openid: openid
      }).get()
      
      if (res.data && res.data.length > 0) {
        const config = res.data[0]
        let qrPrintTypes = {
          jiaopei: false,
          chandan: false,
          chumiao: false,
          jiankang: false
        }
        if (config.qrPrintTypes && typeof config.qrPrintTypes === 'object') {
          qrPrintTypes.jiaopei = config.qrPrintTypes.jiaopei === true
          qrPrintTypes.chandan = config.qrPrintTypes.chandan === true
          qrPrintTypes.chumiao = config.qrPrintTypes.chumiao === true
          qrPrintTypes.jiankang = config.qrPrintTypes.jiankang === true
        }
        const pc = { ...this.data.printerConfig, qrPrintTypes }
        this.setData({ printerConfig: pc })
        wx.setStorageSync('printerConfig', pc)
        console.log('[userPrintConfig] 从云端加载成功:', qrPrintTypes)
      } else {
        const localConfig = this.data.printerConfig.qrPrintTypes
        if (localConfig) {
          await this.saveUserPrintConfig(localConfig)
        }
      }
    } catch (error) {
      console.error('[userPrintConfig] 加载失败:', error)
    }
  },

  // 保存用户打印配置到数据库（以云端为准，失败则本地也不更新）
  saveUserPrintConfig: async function (qrPrintTypes) {
    const db = wx.cloud.database()
    const openid = wx.getStorageSync('openid')
    if (!openid) {
      console.warn('[userPrintConfig] 未登录，跳过云端保存')
      throw new Error('未登录')
    }
    
    const validConfig = {
      jiaopei: qrPrintTypes.jiaopei === true,
      chandan: qrPrintTypes.chandan === true,
      chumiao: qrPrintTypes.chumiao === true,
      jiankang: qrPrintTypes.jiankang === true
    }
    
    try {
      const res = await db.collection('userPrintConfig').where({
        openid: openid
      }).get()
      
      if (res.data && res.data.length > 0) {
        await db.collection('userPrintConfig').doc(res.data[0]._id).update({
          data: {
            qrPrintTypes: validConfig,
            updatedAt: new Date()
          }
        })
      } else {
        await db.collection('userPrintConfig').add({
          data: {
            openid: openid,
            qrPrintTypes: validConfig,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        })
      }
      
      const pc = { ...this.data.printerConfig, qrPrintTypes: validConfig }
      this.setData({ printerConfig: pc })
      wx.setStorageSync('printerConfig', pc)
      
      console.log('[userPrintConfig] 保存到云端成功:', validConfig)
      return true
    } catch (error) {
      console.error('[userPrintConfig] 云端保存失败:', error)
      throw error
    }
  },

  // 加载系统配置
  loadSystemConfig: async function () {
    try {
      const res = await wx.cloud.callFunction({
        name: 'admin',
        data: { action: 'getConfig' }
      })
      
      if (res.result.success) {
        this.setData({
          systemConfig: {
            systemName: res.result.data.systemName || '龟上心',
            version: res.result.data.version || '1.0.0',
            servicePhone: res.result.data.servicePhone || ''
          }
        })
      }
    } catch (error) {
      console.error('加载系统配置失败:', error)
      // 使用本地存储的配置
      try {
        const saved = wx.getStorageSync('systemConfig')
        if (saved) {
          this.setData({
            systemConfig: {
              systemName: saved.systemName || '龟上心',
              version: saved.version || '1.0.0',
              servicePhone: saved.servicePhone || ''
            }
          })
        }
      } catch (e) {}
    }
  },

  // 拨打电话
  callService: function () {
    const phone = this.data.systemConfig.servicePhone
    if (!phone) return
    
    wx.makePhoneCall({
      phoneNumber: phone,
      fail: () => {
        wx.showToast({ title: '拨打失败', icon: 'none' })
      }
    })
  },

  onUnload: function () {
    this.setData({ refreshing: true })
    this.loadAll().then(() => {
      this.setData({ refreshing: false })
      wx.stopPullDownRefresh()
    }).catch(() => {
      this.setData({ refreshing: false })
      wx.stopPullDownRefresh()
    })
  },

  loadAll: async function () {
    this.setData({ loading: true })
    try {
      await Promise.all([
        this.loadUserInfo(),
        this.loadShareInfo(),
        this.loadPrinterConfig(),
        this.loadStats()
      ])
      // 从数据库加载用户打印配置（会覆盖本地存储）
      await this.loadUserPrintConfig()
      // 骨架屏在核心数据加载后立即关闭
      this.setData({ showSkeleton: false })
      // 非关键数据延迟加载，不阻塞UI
      wx.nextTick(() => {
        this.tryAutoConnect()
      })
    } catch (error) {
      console.error('加载失败:', error)
      this.setData({ showSkeleton: false })
    } finally {
      this.setData({ loading: false })
    }
  },

  loadUserInfo: function () {
    wx.nextTick(() => {
      try {
        const savedUser = wx.getStorageSync('userInfo');
        if (savedUser) {
          if (savedUser.nickname && savedUser.nickname.includes('益玮的龟')) {
            let userIndex = wx.getStorageSync('userIndex') || 0;
            userIndex += 1;
            wx.setStorageSync('userIndex', userIndex);
            savedUser.nickname = '龟上心' + userIndex;
            wx.setStorageSync('userInfo', savedUser);
          }
          this.setData({ userInfo: savedUser });
          // 异步刷新头像临时 URL
          this.refreshUserAvatar(savedUser);
        }
        // 计算本月剩余修改次数
        const nicknameLog = wx.getStorageSync('nicknameLog') || { count: 0, lastReset: Date.now() };
        const now = Date.now();
        const lastMonth = now - 30 * 24 * 60 * 60 * 1000;
        if (nicknameLog.lastReset < lastMonth) {
          nicknameLog.count = 0;
          nicknameLog.lastReset = now;
          wx.setStorageSync('nicknameLog', nicknameLog);
        }
        this.setData({ nicknameRemaining: Math.max(0, 3 - nicknameLog.count) });
      } catch (error) {
        console.error('加载用户信息失败:', error);
      }
    });
  },

  loadQrcode: async function () {
    // 优先从本地缓存读取小程序码（v2 版本：指向 pages/public/index）
    try {
      const qrcodeVersion = wx.getStorageSync('qrcodeImageVersion')
      const cachedQrcode = wx.getStorageSync('qrcodeImage')
      if (cachedQrcode && qrcodeVersion >= 2) {
        this.setData({ qrcodeImage: cachedQrcode })
        return
      }
      // 旧版缓存（指向 pages/pet/index）需清除
      if (cachedQrcode && (!qrcodeVersion || qrcodeVersion < 2)) {
        wx.removeStorageSync('qrcodeImage')
      }
    } catch (e) {}

    // 尝试通过云函数获取小程序码（使用 qrcode 云函数）
    try {
      if (wx.cloud) {
        const result = await wx.cloud.callFunction({
          name: 'qrcode',
          data: {
            action: 'generate',
            data: {
              scene: 'userId=' + (wx.getStorageSync('openid') || 'guest'),
              page: 'pages/public/index'
            }
          }
        })
        if (result && result.result && result.result.success) {
          const fileID = result.result.data
          if (fileID && fileID.startsWith('cloud://')) {
            // 下载到本地
            const tempFileRes = await wx.cloud.downloadFile({ fileID: fileID })
            if (tempFileRes.tempFilePath) {
              this.setData({ qrcodeImage: tempFileRes.tempFilePath })
              wx.setStorageSync('qrcodeImage', tempFileRes.tempFilePath)
              wx.setStorageSync('qrcodeImageVersion', 2)
              return
            }
          }
        }
      }
    } catch (err) {

    }

    // 兜底：等待用户点击保存时再走保存流程（占位状态）
    this.setData({ qrcodeImage: '' })
  },

  previewQrcode: function () {
    if (!this.data.qrcodeImage) {
      wx.showToast({ title: '二维码生成中，请稍候', icon: 'none' })
      return
    }
    wx.previewImage({
      urls: [this.data.qrcodeImage],
      current: this.data.qrcodeImage
    })
  },

  saveQrcodeToAlbum: function () {
    const that = this
    // 如果没有缓存二维码，引导用户
    if (!this.data.qrcodeImage) {
      wx.showModal({
        title: '提示',
        content: '小程序码需在微信后台配置后生成。\n您可以在「微信公众平台 → 设置 → 基本设置 → 小程序码」中获取官方小程序码，或联系开发者通过云函数生成后保存。',
        showCancel: false,
        confirmText: '知道了'
      })
      return
    }

    wx.saveImageToPhotosAlbum({
      filePath: this.data.qrcodeImage,
      success: function () {
        wx.showToast({ title: '已保存到相册', icon: 'success' })
      },
      fail: function (err) {
        if (err.errMsg && err.errMsg.indexOf('auth deny') > -1) {
          wx.showModal({
            title: '需要授权',
            content: '请在设置中打开相册权限，以便保存二维码图片',
            confirmText: '去设置',
            success: function (res) {
              if (res.confirm) {
                wx.openSetting()
              }
            }
          })
        } else {
          wx.showToast({ title: '保存失败', icon: 'none' })
        }
      }
    })
  },

  onQrcodeError: function () {

    this.setData({ qrcodeImage: '' })
  },

  generateShareImage: async function () {
    showLoading('生成图片中...')
    try {
      this.loadShareInfo()

      const { userInfo, shareInfo } = this.data
      const theme = { primary: '#3A7CFF', primaryDark: '#1A5CD6', primaryLight: '#E6F0FF', bg: '#F0F7FF', bgLight: '#FFFFFF', accent: '#FF8C42', text: '#1E293B' }
      const html = generateShareHTML({}, {
        nickname: userInfo.nickname || '龟上心',
        cover: shareInfo.cover || '',
        specialty: shareInfo.specialty || '记录、档案、繁育',
        hasLicense: shareInfo.hasLicense || false,
        region: shareInfo.region || '',
        wechatId: shareInfo.wechatId || '',
        tags: (shareInfo.tags && shareInfo.tags.length > 0) ? shareInfo.tags : ['宠物档案', '繁育记录'],
        intro: shareInfo.intro || '',
        species: shareInfo.species || [],
        envImages: shareInfo.envImages || [],
        envDesc: shareInfo.envDesc || '',
        theme: theme,
      })

      const tempFilePath = await generateImageFromHTML(html, { loadingText: '生成分享图...' })
      hideLoading()
      this.saveImageToAlbum(tempFilePath)
    } catch (err) {
      hideLoading()
      console.error('生成分享图失败:', err)
      showError('生成分享图失败: ' + (err.message || '未知错误'))
    }
  },

  saveImageToAlbum: function (imagePath) {
    wx.saveImageToPhotosAlbum({
      filePath: imagePath,
      success: () => {
        wx.showToast({ title: '保存成功', icon: 'success' })
      },
      fail: (err) => {
        console.error('保存失败:', err)
        wx.showToast({ title: '保存失败', icon: 'none' })
      }
    })
  },

  loadPrinterConfig: function () {
    try {
      const savedConfig = wx.getStorageSync('printerConfig');
      if (savedConfig && savedConfig.deviceId) {
        // 恢复配置但标记为未连接（BLE连接不会跨会话保持）
        savedConfig.connected = false
        // 如果之前开启了"启用打印"，新会话也初始化为未连接状态
        savedConfig.enabled = false
        this.setData({ printerConfig: savedConfig });
      }
    } catch (error) {
      console.error('加载打印机配置失败:', error);
    }
  },

  loadStats: function () {
    // 先本地快速展示
    this.loadLocalStats()
    // 再尝试云端精确数据（静默更新，不阻塞UI）
    this.loadCloudStats()
  },

  loadLocalStats: function () {
    try {
      const pets = wx.getStorageSync('pets') || []
      const records = wx.getStorageSync('records') || []
      this.updateStatsData(pets, records)
    } catch (error) {
      console.error('加载本地统计数据失败:', error)
    }
  },

  loadCloudStats: async function () {
    try {
      const [petResult, recordResult, footResult] = await Promise.all([
        API.getPetList({}),
        API.getRecordList('', ''),
        API.getFootprintList('all').catch(() => ({ success: false }))
      ])
      
      let petList = []
      let recordList = []
      let footList = []
      
      if (petResult.success) {
        petList = petResult.data.list || petResult.data || []
      }
      if (recordResult.success) {
        recordList = recordResult.data.list || recordResult.data || []
      }
      if (footResult.success) {
        footList = footResult.data.list || footResult.data || []
      } else {
        // 从本地存储兜底
        try { footList = wx.getStorageSync('footprints') || [] } catch (e) {}
      }
      
      this.updateStatsData(petList, recordList, footList)
    } catch (error) {
      // 云模式不可用时静默回退，本地数据已展示

    }
  },

  updateStatsData: function (pets, records, footprints) {
    const eggCount = records.filter(r => r.type === '产蛋').length
    const pairEvents = records.filter(r => r.type === '交配' || r.type === '换公').length
    const pendingCount = pets.filter(p => p.status === '待配').length
    const warningCount = pets.filter(p => p.status === '预警').length
    const fpCount = Array.isArray(footprints) ? footprints.length : 0
    
    this.setData({
      stats: {
        petCount: pets.length,
        eggCount,
        eggEvents: eggCount,
        pairEvents,
        pendingCount,
        warningCount
      },
    })
  },

  switchTab: function (e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ activeTab: tab })
    if (tab === 'share') {
      this.loadShareInfo()
    } else if (tab === 'data') {
      this.loadStats()
    }
  },

  chooseCover: function () {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const cover = res.tempFiles[0].tempFilePath
        const shareInfo = { ...this.data.shareInfo, cover }
        this.setData({ shareInfo })
        wx.setStorageSync('shareInfo', shareInfo)
        wx.showToast({ title: '封面已更新', icon: 'success' })
      }
    })
  },

  copyWechat: function (e) {
    const wechat = e.currentTarget.dataset.wechat
    if (!wechat) return
    wx.setClipboardData({
      data: wechat,
      success: () => {
        wx.showToast({ title: '微信号已复制', icon: 'success' })
      }
    })
  },

  chooseEnvImages: function () {
    const that = this
    wx.chooseMedia({
      count: 3,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const newImages = res.tempFiles.map(f => f.tempFilePath)
        const currentImages = this.data.shareInfo.envImages || []
        const combined = [...currentImages, ...newImages].slice(0, 3)
        const shareInfo = { ...this.data.shareInfo, envImages: combined }
        this.setData({ shareInfo })
        wx.setStorageSync('shareInfo', shareInfo)
        wx.showToast({ title: '已上传 ' + combined.length + ' 张', icon: 'success' })
      }
    })
  },

  addSpeciesImage: function () {
    const that = this
    wx.chooseMedia({
      count: 9,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const files = res.tempFiles || []
        if (files.length === 0) return

        // 依次让用户为每张图片填写品种名和数量
        that._addSpeciesWithPrompt(files, 0)
      }
    })
  },

  _addSpeciesWithPrompt: function (files, idx) {
    const that = this
    if (idx >= files.length) {
      wx.showToast({ title: '添加完成', icon: 'success' })
      return
    }
    const image = files[idx].tempFilePath

    wx.showModal({
      title: '第 ' + (idx + 1) + '/' + files.length + ' 张',
      editable: true,
      placeholderText: '请输入品种名（如：巨头）',
      success: (nameRes) => {
        if (!nameRes.confirm || !nameRes.content) {
          // 跳过这张，继续下一张
          that._addSpeciesWithPrompt(files, idx + 1)
          return
        }
        const name = nameRes.content.trim()

        const shareInfo = { ...that.data.shareInfo }
        shareInfo.species = [...(shareInfo.species || []), { name, image }]
        that.setData({ shareInfo })
        wx.setStorageSync('shareInfo', shareInfo)
        // 继续下一张
        that._addSpeciesWithPrompt(files, idx + 1)
      }
    })
  },

  clearSpeciesImages: function () {
    const that = this
    wx.showModal({
      title: '确认',
      content: '确定要清空所有种群图片吗？',
      success: (res) => {
        if (res.confirm) {
          const shareInfo = { ...that.data.shareInfo, species: [] }
          that.setData({ shareInfo })
          wx.setStorageSync('shareInfo', shareInfo)
        }
      }
    })
  },

  showEditShareModal: function () {
    this.setData({ showEditShareModal: true })
    // 隐藏tab-bar，避免遮挡弹窗
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ visible: false })
    }
  },

  hideEditShareModal: function () {
    this.setData({ showEditShareModal: false })
    // 恢复tab-bar显示（即使 onShow 也会兜底保证 visible: true）
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ visible: true })
    }
  },

  stopPropagation: function () {
    // 阻止冒泡
  },

  toggleWechatPublic: function (e) {
    const shareInfo = { ...this.data.shareInfo, wechatPublic: e.detail.value }
    this.setData({ shareInfo })
    wx.setStorageSync('shareInfo', shareInfo)
    this.syncShareInfoToCloud(shareInfo)
  },

  toggleLicense: function (e) {
    const shareInfo = { ...this.data.shareInfo, hasLicense: e.detail.value }
    // 若关闭营业执照开关，同时清空执照图片
    if (!e.detail.value) {
      shareInfo.licenseImage = ''
    }
    this.setData({ shareInfo })
    wx.setStorageSync('shareInfo', shareInfo)
  },

  chooseLicenseImage: function () {
    const that = this
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: function (res) {
        const licenseImage = res.tempFiles[0].tempFilePath
        const shareInfo = { ...that.data.shareInfo, licenseImage }
        that.setData({ shareInfo })
        wx.setStorageSync('shareInfo', shareInfo)
        wx.showToast({ title: '营业执照已更新', icon: 'success' })
      }
    })
  },

  chooseRegion: function (e) {
    const [province, city, district] = e.detail.value
    let region = ''
    // 过滤重复或为空的层级（省市区三级可能有相同值或"全部"占位）
    const parts = []
    if (province) parts.push(province)
    if (city && city !== province) parts.push(city)
    if (district && district !== city) parts.push(district)
    region = parts.join(' ')
    const shareInfo = { ...this.data.shareInfo, region }
    this.setData({ shareInfo })
    wx.setStorageSync('shareInfo', shareInfo)
    this.syncShareInfoToCloud(shareInfo)
  },

  editField: function (e) {
    const { field, title, placeholder } = e.currentTarget.dataset
    const that = this
    let content = this.data.shareInfo[field] || ''

    // tags 需要特殊处理：数组转字符串
    if (field === 'tags' && Array.isArray(content)) {
      content = content.join(',')
    }

    wx.showModal({
      title: title,
      editable: true,
      placeholderText: placeholder,
      content: content,
      success: (res) => {
        if (res.confirm) {
          let newVal = res.content || ''
          const shareInfo = { ...that.data.shareInfo }

          if (field === 'tags') {
            const tags = newVal.split(/[,，]/).map(t => t.trim()).filter(t => t)
            shareInfo.tags = tags
          } else {
            shareInfo[field] = newVal
          }

          that.setData({ shareInfo })
          wx.setStorageSync('shareInfo', shareInfo)
          that.syncShareInfoToCloud(shareInfo)
        }
      }
    })
  },

  loadShareInfo: function () {
    try {
      const saved = wx.getStorageSync('shareInfo')
      if (saved) {
        this.setData({ shareInfo: saved })
        // 异步刷新所有图片 URL（临时签名可能已过期）
        this.refreshShareInfoImages(saved)
      }
    } catch (e) {
      console.error('加载分享信息失败:', e)
    }
  },

  // 将名片公开信息同步到云数据库（供公开档案页使用）
  syncShareInfoToCloud: function (shareInfo) {
    const info = shareInfo || this.data.shareInfo
    if (!info) return
    try {
      wx.cloud.callFunction({
        name: 'login',
        data: {
          action: 'updatePublicProfile',
          data: {
            specialty: info.specialty || '',
            wechatId: info.wechatId || '',
            wechatPublic: !!info.wechatPublic,
            region: info.region || '',
            tags: Array.isArray(info.tags) ? info.tags : [],
            intro: info.intro || ''
          }
        },
        success: (res) => {
          if (res.result && res.result.success) {
            console.log('公开名片已同步到云端')
          }
        },
        fail: (err) => {
          console.error('同步公开名片失败:', err)
        }
      })
    } catch (e) {
      console.error('同步公开名片异常:', e)
    }
  },

  /**
   * 刷新 shareInfo 中所有图片字段的临时 URL
   * TCB 云存储的临时签名（?sign=xxx&t=xxx）有时效，
   * 过期后返回 403，这里统一刷新
   */
  refreshShareInfoImages: async function (info) {
    if (!info) info = this.data.shareInfo
    if (!info) return

    try {
      const newInfo = { ...info }
      let changed = false

      // 封面
      if (info.cover && (info.cover.includes('tcb.qcloud.la') || info.cover.startsWith('cloud://'))) {
        const newUrl = await convertSinglePhoto(info.cover)
        if (newUrl && newUrl !== info.cover) {
          newInfo.cover = newUrl
          changed = true
        }
      }

      // 营业执照
      if (info.licenseImage && (info.licenseImage.includes('tcb.qcloud.la') || info.licenseImage.startsWith('cloud://'))) {
        const newUrl = await convertSinglePhoto(info.licenseImage)
        if (newUrl && newUrl !== info.licenseImage) {
          newInfo.licenseImage = newUrl
          changed = true
        }
      }

      // 环境图片（数组）
      if (info.envImages && info.envImages.length) {
        const envNew = []
        let envChanged = false
        for (let i = 0; i < info.envImages.length; i++) {
          const img = info.envImages[i]
          if (img && (img.includes('tcb.qcloud.la') || img.startsWith('cloud://'))) {
            const newUrl = await convertSinglePhoto(img)
            if (newUrl && newUrl !== img) {
              envNew.push(newUrl)
              envChanged = true
            } else {
              envNew.push(img)
            }
          } else {
            envNew.push(img)
          }
        }
        if (envChanged) {
          newInfo.envImages = envNew
          changed = true
        }
      }

      // 种群图片
      if (info.species && info.species.length) {
        const spNew = []
        let spChanged = false
        for (let i = 0; i < info.species.length; i++) {
          const item = info.species[i]
          if (item.image && (item.image.includes('tcb.qcloud.la') || item.image.startsWith('cloud://'))) {
            const newUrl = await convertSinglePhoto(item.image)
            if (newUrl && newUrl !== item.image) {
              spNew.push({ ...item, image: newUrl })
              spChanged = true
            } else {
              spNew.push(item)
            }
          } else {
            spNew.push(item)
          }
        }
        if (spChanged) {
          newInfo.species = spNew
          changed = true
        }
      }

      if (changed) {
        this.setData({ shareInfo: newInfo })
        try { wx.setStorageSync('shareInfo', newInfo) } catch (e) {}
      }
    } catch (err) {

    }
  },

  /**
   * 刷新头像图片 URL
   */
  refreshUserAvatar: async function (userInfo) {
    if (!userInfo || !userInfo.avatar) return
    const avatar = userInfo.avatar
    if (!avatar.includes('tcb.qcloud.la') && !avatar.startsWith('cloud://')) return
    try {
      const newUrl = await convertSinglePhoto(avatar)
      if (newUrl && newUrl !== avatar) {
        const newInfo = { ...userInfo, avatar: newUrl }
        this.setData({ userInfo: newInfo })
        try { wx.setStorageSync('userInfo', newInfo) } catch (e) {}
      }
    } catch (err) {

    }
  },

  /**
   * 保存用户信息到云端（静默，失败时重试一次）
   */
  _saveUserInfoToCloud: function (data) {
    try {
      wx.cloud.callFunction({
        name: 'login',
        data: { action: 'updateUserInfo', data }
      }).then(res => {
        if (res.result && !res.result.success) {
          console.error('[saveUserInfoToCloud] 云端返回失败:', res.result.message)
        }
      }).catch(err => {
        console.error('[saveUserInfoToCloud] 云端保存失败:', err)
        // 重试一次
        setTimeout(() => {
          wx.cloud.callFunction({
            name: 'login',
            data: { action: 'updateUserInfo', data }
          }).catch(() => {})
        }, 2000)
      })
    } catch (err) {
      console.error('[saveUserInfoToCloud] 调用失败:', err)
    }
  },

  chooseAvatar: function () {
    const app = getApp()
    if (!app.requireLogin()) return
    wx.chooseImage({
      count: 1,
      success: async (res) => {
        const tempPath = res.tempFilePaths[0]
        // 先显示临时图片
        const userInfo = { ...this.data.userInfo, avatar: tempPath }
        this.setData({ userInfo })
        wx.setStorageSync('userInfo', userInfo)
        wx.showToast({ title: '头像已更新', icon: 'success' })

        // 上传到云存储
        try {
          const openid = wx.getStorageSync('openid') || 'unknown'
          const ext = tempPath.split('.').pop() || 'jpg'
          const cloudPath = `avatars/${openid}_${Date.now()}.${ext}`
          const uploadRes = await wx.cloud.uploadFile({ cloudPath, filePath: tempPath })
          if (uploadRes && uploadRes.fileID) {
            const newInfo = { ...this.data.userInfo, avatar: uploadRes.fileID }
            this.setData({ userInfo: newInfo })
            wx.setStorageSync('userInfo', newInfo)
            // 同步到云端数据库
            this._saveUserInfoToCloud({ avatar: uploadRes.fileID })
          }
        } catch (err) {

        }
      }
    })
  },

  handleLogout: function () {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          const app = getApp()
          app.logout()
        }
      }
    })
  },

  // （旧分享相关方法已删除：chooseCoverImage / onCoverSwitchChange / showContactModal / hideContactModal / stopPropagation / onContactSwitchChange / onContactPhoneInput / onContactWechatInput / saveContactInfo / startContactVoiceInput / stopContactVoiceInput）

  // ========== 蓝牙打印（微信 BLE API） ==========

  scanBluetooth: function () {
    const that = this
    // 手动扫描时重置失败计数（用户主动操作，给自动连接一次新的机会）
    const pc = { ...this.data.printerConfig, connectFailCount: 0 }
    this.setData({ printerConfig: pc })
    wx.setStorageSync('printerConfig', pc)
    this.setData({ 
      showBluetoothModal: true, 
      isScanning: true, 
      bluetoothDevices: [] 
    })
    this.lpapi.startBleDiscovery({
      timeout: 0,
      deviceFound: function (devices) {

        if (devices && devices.length > 0) {
          that.setData({ bluetoothDevices: devices })
        }
      },
      adapterStateChange: function (res) {
        if (!res.discovering) {
          that.setData({ isScanning: false })
        }
      }
    })
  },

  hideBluetoothModal: function () {
    this.setData({ showBluetoothModal: false, isScanning: false })
    this.lpapi.stopBleDiscovery()
  },

  connectBluetooth: function (e) {
    const that = this
    const deviceId = e.currentTarget.dataset.deviceId
    const deviceName = e.currentTarget.dataset.deviceName
    wx.showLoading({ title: '连接中...' })
    this.lpapi.stopBleDiscovery()
    this.lpapi.openPrinter({
      name: deviceName,
      deviceId: deviceId,
      success: function () {
        wx.hideLoading()
        that.setData({ showBluetoothModal: false })
        const pc = { ...that.data.printerConfig, enabled: true, connected: true, deviceId, deviceName, connectFailCount: 0 }
        that.setData({ printerConfig: pc })
        wx.setStorageSync('printerConfig', pc)
        wx.showToast({ title: '连接成功', icon: 'success' })
      },
      fail: function (resp) {
        wx.hideLoading()
        console.error('连接失败:', resp)
        wx.showToast({ title: '连接失败', icon: 'none' })
      }
    })
  },

  disconnectPrinter: function () {
    if (!this.data.printerConfig.deviceId) { wx.showToast({ title: '未连接打印机', icon: 'none' }); return }
    wx.showModal({
      title: '提示', content: '确定要断开打印机连接吗？',
      success: (res) => {
        if (res.confirm) {
          this.lpapi.closePrinter()
          const pc = { ...this.data.printerConfig, connected: false }
          this.setData({ printerConfig: pc })
          wx.setStorageSync('printerConfig', pc)
          wx.showToast({ title: '已断开连接', icon: 'success' })
        }
      }
    })
  },

  // 切换二维码打印类型（点击卡片触发）
  toggleQrPrintType: async function (e) {
    const type = e.currentTarget.dataset.type
    const oldConfig = { ...this.data.printerConfig.qrPrintTypes }
    const newConfig = { ...this.data.printerConfig.qrPrintTypes }
    newConfig[type] = !newConfig[type]
    
    try {
      await this.saveUserPrintConfig(newConfig)
    } catch (error) {
      console.error('[userPrintConfig] 保存失败，回滚到旧配置:', error)
      const pc = { ...this.data.printerConfig, qrPrintTypes: oldConfig }
      this.setData({ printerConfig: pc })
      wx.setStorageSync('printerConfig', pc)
      wx.showToast({
        title: '保存失败',
        icon: 'error',
        duration: 2000
      })
    }
  },

  // 二维码打印类型开关变化
  onQrPrintTypeChange: async function (e) {
    const type = e.currentTarget.dataset.type
    const value = e.detail.value
    
    const oldConfig = { ...this.data.printerConfig.qrPrintTypes }
    const newConfig = { ...this.data.printerConfig.qrPrintTypes }
    newConfig[type] = value
    
    try {
      await this.saveUserPrintConfig(newConfig)
    } catch (error) {
      console.error('[userPrintConfig] 保存失败，回滚到旧配置:', error)
      const pc = { ...this.data.printerConfig, qrPrintTypes: oldConfig }
      this.setData({ printerConfig: pc })
      wx.setStorageSync('printerConfig', pc)
      wx.showToast({
        title: '保存失败',
        icon: 'error',
        duration: 2000
      })
    }
  },

  onPrinterSwitchChange: function (e) {
    const pc = { ...this.data.printerConfig, enabled: e.detail.value }
    this.setData({ printerConfig: pc })
    wx.setStorageSync('printerConfig', pc)
    if (e.detail.value) {
      // 开启 → 尝试自动连接
      if (!pc.connected && pc.deviceId) {
        wx.openBluetoothAdapter({
          success: () => { this._doAutoConnect(pc) },
          fail: () => { this.scanBluetooth() }
        })
      } else if (!pc.connected && !pc.deviceId) {
        this.scanBluetooth()
      }
    } else {
      // 关闭 → 断开蓝牙连接
      if (pc.connected) {
        this.lpapi.closePrinter()
        this.lpapi.stopBleDiscovery()
        wx.closeBluetoothAdapter()
        const updated = { ...pc, connected: false }
        this.setData({ printerConfig: updated })
        wx.setStorageSync('printerConfig', updated)
        wx.showToast({ title: '已断开连接', icon: 'success' })
      }
    }
  },

  onAutoConnectSwitchChange: function (e) {
    const pc = { ...this.data.printerConfig, autoConnect: e.detail.value }
    this.setData({ printerConfig: pc })
    wx.setStorageSync('printerConfig', pc)
    // 开启时立即尝试连接
    if (e.detail.value && !pc.connected && pc.deviceId) {
      this.tryAutoConnect()
    }
  },

  // 自动连接打印机（页面初始化时调用）
  tryAutoConnect: function () {
    const pc = this.data.printerConfig
    if (!pc.autoConnect || !pc.deviceId) {

      return
    }
    if (pc.connected) { return }
    if (pc.connectFailCount >= 3) { return }

    const that = this

    // 先初始化蓝牙适配器（关键！没有这一步 openPrinter 会失败）
    wx.openBluetoothAdapter({
      success: function () {

        that._doAutoConnect(pc)
      },
      fail: function (err) {
        console.error('[autoConnect] 蓝牙适配器初始化失败:', err)
        const newCount = (pc.connectFailCount || 0) + 1
        const updated = { ...pc, connectFailCount: newCount }
        that.setData({ printerConfig: updated })
        wx.setStorageSync('printerConfig', updated)
      }
    })
  },

  _doAutoConnect: function (pc) {
    const that = this
    this.lpapi.openPrinter({
      name: pc.deviceName,
      deviceId: pc.deviceId,
      success: function () {

        const updated = { ...pc, connected: true, enabled: true, connectFailCount: 0 }
        that.setData({ printerConfig: updated })
        wx.setStorageSync('printerConfig', updated)
      },
      fail: function (resp) {
        console.error('[autoConnect] 自动连接失败:', resp)
        const newCount = (pc.connectFailCount || 0) + 1
        const updated = { ...pc, connectFailCount: newCount }
        that.setData({ printerConfig: updated })
        wx.setStorageSync('printerConfig', updated)
        if (newCount >= 3) {

        }
      }
    })
  },

  printLabel: function (labelData, success, fail) {
    if (!this.data.printerConfig.connected) { if (fail) fail('打印机未连接'); return }
    const api = this.lpapi
    const result = api.startJob({ width: 40, height: 20, jobName: 'label-print', gapType: 2 })
    if (!result) { if (fail) fail('创建打印任务失败'); return }
    api.drawText({ text: labelData.title || 'GSC', fontHeight: 5, x: 2, y: 2, width: 36 })
    if (labelData.content) {
      const lines = labelData.content.split('\n')
      lines.forEach((line, i) => {
        api.drawText({ text: line, fontHeight: 3, x: 2, y: 10 + i * 5, width: 36 })
      })
    }
    api.commitJob().then(result => {
      if (result.statusCode === 0 && success) success()
      else if (fail) fail('打印失败')
    }).catch(() => { if (fail) fail('打印失败') })
  },

  // （旧分享相关方法已删除：editShareTitle / onShareTitleInput / saveShareTitle / editShareSubtitle / onShareSubtitleInput / saveShareSubtitle / startShareVoiceInput / stopShareVoiceInput）

  editNickname: function () {
    const app = getApp()
    if (!app.requireLogin()) return
    const that = this
    const now = Date.now()
    const lastMonth = now - 30 * 24 * 60 * 60 * 1000

    try {
      const nicknameLog = wx.getStorageSync('nicknameLog') || { count: 0, lastReset: now }
      if (nicknameLog.lastReset < lastMonth) {
        nicknameLog.count = 0
        nicknameLog.lastReset = now
        wx.setStorageSync('nicknameLog', nicknameLog)
      }

      const remaining = 3 - nicknameLog.count
      if (remaining <= 0) {
        wx.showToast({ title: '本月已修改3次，下月再试', icon: 'none' })
        return
      }

      wx.showModal({
        title: '修改昵称',
        content: `本月还可修改 ${remaining} 次，确定要修改吗？`,
        success: (res) => {
          if (!res.confirm) return
          wx.showModal({
            title: '修改昵称',
            editable: true,
            placeholderText: '请输入新昵称',
            content: that.data.userInfo.nickname || '',
            success: (editRes) => {
              if (!editRes.confirm) return
              const newName = (editRes.content || '').trim()
              if (!newName) {
                wx.showToast({ title: '昵称不能为空', icon: 'none' })
                return
              }
              const userInfo = { ...that.data.userInfo, nickname: newName }
              that.setData({ userInfo })
              wx.setStorageSync('userInfo', userInfo)
              // 同步到云端数据库
              that._saveUserInfoToCloud({ nickname: newName })
              try {
                const log = wx.getStorageSync('nicknameLog') || { count: 0, lastReset: now }
                log.count++
                wx.setStorageSync('nicknameLog', log)
                that.setData({ nicknameRemaining: Math.max(0, 3 - log.count) })
              } catch (err) {
                console.error('记录昵称修改次数失败:', err)
              }
              wx.showToast({ title: '修改成功', icon: 'success' })
            }
          })
        }
      })
    } catch (error) {
      console.error('检查昵称修改次数失败:', error)
    }
  },

  onLicenseImageLoad: function () {
    // 营业执照图片加载成功，无需额外处理
  },

  /**
   * 通用图片加载失败处理
   * TCB 云存储临时签名过期 → 403 → 触发此函数
   * 支持类型：avatar / cover / license / env / species
   */
  onPhotoError: async function (e) {
    const { type, index } = e.currentTarget.dataset

    // ---------- 头像 ----------
    if (type === 'avatar') {
      const avatar = this.data.userInfo.avatar
      if (!avatar) return
      try {
        const newUrl = await convertSinglePhoto(avatar)
        if (newUrl && newUrl !== avatar) {
          const userInfo = { ...this.data.userInfo, avatar: newUrl }
          this.setData({ userInfo })
          wx.setStorageSync('userInfo', userInfo)
        } else {
          const userInfo = { ...this.data.userInfo, avatar: '' }
          this.setData({ userInfo })
          wx.setStorageSync('userInfo', userInfo)
        }
      } catch (err) {

        const userInfo = { ...this.data.userInfo, avatar: '' }
        this.setData({ userInfo })
        wx.setStorageSync('userInfo', userInfo)
      }
      return
    }

    // ---------- 其他（cover / license / env / species）统一处理 ----------
    const shareInfo = { ...this.data.shareInfo }
    let imgUrl = null

    if (type === 'cover') {
      imgUrl = shareInfo.cover
    } else if (type === 'license') {
      imgUrl = shareInfo.licenseImage
    } else if (type === 'env' && typeof index === 'number') {
      imgUrl = (shareInfo.envImages || [])[index]
    } else if (type === 'species' && typeof index === 'number') {
      imgUrl = ((shareInfo.species || [])[index] || {}).image
    }

    if (!imgUrl) {
      if (type === 'license') {
        shareInfo.licenseImage = ''
        this.setData({ shareInfo })
        try { wx.setStorageSync('shareInfo', shareInfo) } catch (e) {}
      }
      return
    }

    try {
      const newUrl = await convertSinglePhoto(imgUrl)

      if (newUrl && newUrl !== imgUrl) {
        if (type === 'cover') {
          shareInfo.cover = newUrl
        } else if (type === 'license') {
          shareInfo.licenseImage = newUrl
        } else if (type === 'env' && typeof index === 'number') {
          const env = [...(shareInfo.envImages || [])]
          env[index] = newUrl
          shareInfo.envImages = env
        } else if (type === 'species' && typeof index === 'number') {
          const sp = [...(shareInfo.species || [])]
          sp[index] = { ...(sp[index] || {}), image: newUrl }
          shareInfo.species = sp
        }
        this.setData({ shareInfo })
        try { wx.setStorageSync('shareInfo', shareInfo) } catch (e) {}
      } else {
        // 文件不存在 → 清空对应字段避免无限重试
        if (type === 'cover') {
          shareInfo.cover = ''
        } else if (type === 'license') {
          shareInfo.licenseImage = ''
        } else if (type === 'env' && typeof index === 'number') {
          const env = [...(shareInfo.envImages || [])]
          env.splice(index, 1)
          shareInfo.envImages = env
        } else if (type === 'species' && typeof index === 'number') {
          const sp = [...(shareInfo.species || [])]
          sp.splice(index, 1)
          shareInfo.species = sp
        }
        this.setData({ shareInfo })
        try { wx.setStorageSync('shareInfo', shareInfo) } catch (e) {}
      }
    } catch (err) {

    }
  },

  // 跳转到产蛋报表
  goToEggReport: function () {
    wx.navigateTo({ url: '/pages/egg-report/index' })
  },

  // 跳转到粘缸费用计算器
  goToCalculator: function () {
    wx.navigateTo({ url: '/pages/tools/calculator' })
  },

  // 跳转到宠物公开页面（测试入口）
  goToPublicPage: function () {
    const openid = wx.getStorageSync('openid')
    if (openid) {
      wx.navigateTo({ url: `/pages/public/index?userId=${openid}` })
    } else {
      wx.showToast({ title: '请先登录', icon: 'none' })
    }
  },

  // 跳转到出苗报表
  goToHatchReport: function () {
    wx.navigateTo({ url: '/pages/hatch-report/index' })
  },

  // 检查管理员权限（通过云函数验证openid）
  checkAdminPermission: async function () {
    try {
      const result = await wx.cloud.callFunction({
        name: 'login',
        data: { action: 'checkAdmin' }
      })
      console.log('管理员权限检查结果:', result)
      const isAdmin = result.result.data.isAdmin || false
      const adminName = result.result.data.adminName || '未知'
      console.log('是否为管理员:', isAdmin, '管理员名称:', adminName)
      this.setData({ isAdmin })
      // 保存到本地缓存
      wx.setStorageSync('isAdmin', isAdmin)
    } catch (error) {
      console.error('检查管理员权限失败:', error)
      this.setData({ isAdmin: false })
    }
  },

  // 管理后台入口
  onAdminEntry: function () {
    wx.navigateTo({ url: '/pages/admin/index' })
  },

  // 长按头像 - 显示倒计时提示
  onAvatarLongPress: function () {
    this._clearAvatarLongPressTimer()
    
    // 长按立即触发（bindlongpress默认就是长按）
    if (this.data.isAdmin) {
      // 已是管理员，直接进入
      wx.vibrateShort({ type: 'medium' })
      this.onAdminEntry()
    } else {
      // 非管理员，震动提示但无法进入
      wx.vibrateShort({ type: 'heavy' })
      wx.showToast({
        title: '您不是管理员',
        icon: 'none',
        duration: 2000
      })
    }
  },

  // 触摸开始 - 记录开始时间
  onAvatarTouchStart: function () {
    this._avatarTouchStartTime = Date.now()
  },

  // 触摸结束 - 清理状态
  onAvatarTouchEnd: function () {
    this._avatarTouchStartTime = null
  },

  _clearAvatarLongPressTimer: function () {
    if (this._avatarLongPressTimer) {
      clearTimeout(this._avatarLongPressTimer)
      this._avatarLongPressTimer = null
    }
  }

})