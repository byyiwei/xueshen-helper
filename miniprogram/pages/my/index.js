const { getAPI } = require('../../utils/api.js')
const { showError, showSuccess, showLoading, hideLoading } = require('../../utils/error.js')
const { getVoiceManager } = require('../../utils/voice.js')
const { getTempUrl } = require('../../utils/image.js')
const ThemeManager = require('../../utils/theme.js')
const { generateImageFromHTML } = require('../../utils/imageService.js')

const API = getAPI()
const voiceManager = getVoiceManager()

Page({
  data: {
    userInfo: {
      nickname: '龟上心',
      avatar: '',
      phone: ''
    },
    activeTab: 'account',
    currentTheme: 'gold',
    switchColor: '#B8860B',
    isEditingNickname: false,
    tempNickname: '',
    isRecording: false,
    currentVoiceField: '',
    showBluetoothModal: false,
    isScanning: false,
    bluetoothDevices: [],
    // 打印机配置 - 德佟P1
    printerConfig: {
      enabled: false,
      autoPrint: false,
      connected: false,
      deviceId: '',
      deviceName: '',
      serviceId: '',
      writeCharacteristicId: '',
      notifyCharacteristicId: ''
    },
    // 动态统计数据
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
      region: '',
      wechatId: '',
      tags: ['宠物档案', '繁育记录'],
      intro: '',
      envImages: [],
      envDesc: '',
      species: []
    },
    showEditShareModal: false
  },

  onLoad: function () {
    const app = getApp()
    if (!app.checkLogin()) return
    this.loadTheme()
    this.loadUserInfo()
    this.loadPrinterConfig()
    this.loadShareInfo()
  },

  onShow: function () {
    const app = getApp()
    if (!app.globalData.isLoggedIn) return
    this.loadTheme()
    
    // 主动更新tabBar选中状态和主题色
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      const tabBar = this.getTabBar()
      tabBar.setData({ selected: 2 })
      if (tabBar.applyThemeColor) {
        tabBar.applyThemeColor()
      }
    }
  },

  loadTheme: function () {
    const savedTheme = ThemeManager.getCurrentTheme()
    const switchColor = ThemeManager.getThemeConfig(savedTheme).primary
    this.setData({ currentTheme: savedTheme, switchColor })
  },

  loadUserInfo: function () {
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
      }
    } catch (error) {
      console.error('加载用户信息失败:', error);
    }
  },

  generateShareImage: async function () {
    showLoading('生成图片中...')
    try {
      this.loadShareInfo()

      const { userInfo, shareInfo, currentTheme } = this.data
      const theme = ThemeManager.getThemeConfig(currentTheme)
      const html = ThemeManager.generateShareHTML({}, {
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
      if (savedConfig) {
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
      console.log('云端统计获取失败，使用本地数据:', error.message)
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
  },

  hideEditShareModal: function () {
    this.setData({ showEditShareModal: false })
  },

  stopPropagation: function () {
    // 阻止冒泡
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
        }
      }
    })
  },

  loadShareInfo: function () {
    try {
      const saved = wx.getStorageSync('shareInfo')
      if (saved) {
        this.setData({ shareInfo: saved })
      }
    } catch (e) {
      console.error('加载分享信息失败:', e)
    }
  },

  chooseAvatar: function () {
    wx.chooseImage({
      count: 1,
      success: (res) => {
        const avatar = res.tempFilePaths[0]
        const userInfo = { ...this.data.userInfo, avatar }
        this.setData({ userInfo })
        wx.setStorageSync('userInfo', userInfo)
        wx.showToast({ title: '头像已更新', icon: 'success' })
      }
    })
  },

  selectTheme: function (e) {
    const theme = e.currentTarget.dataset.theme
    const switchColor = ThemeManager.getThemeConfig(theme).primary
    this.setData({ currentTheme: theme, switchColor })

    ThemeManager.setTheme(theme)

    // 更新tabBar主题色
    this.updateTabBarTheme()

    showSuccess(ThemeManager.getThemeName(theme) + '主题已应用')
  },

  // 更新tabBar主题色
  updateTabBarTheme: function () {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      const tabBar = this.getTabBar()
      if (tabBar && tabBar.applyThemeColor) {
        tabBar.applyThemeColor()
      }
    }
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

  scanBluetooth: function () {
    const that = this
    this.setData({ 
      showBluetoothModal: true, 
      isScanning: true, 
      bluetoothDevices: [] 
    })

    wx.openBluetoothAdapter({
      success: function () {
        wx.startBluetoothDevicesDiscovery({
          services: [],
          allowDuplicatesKey: false,
          interval: 0,
          success: function () {
            that.bluetoothDiscovery = setInterval(function () {
              wx.getBluetoothDevices({
                success: function (res) {
                  const devices = res.devices.filter(d => d.name && (d.name.includes('P1') || d.name.includes('Detong') || d.name.includes('德佟')))
                  that.setData({ bluetoothDevices: devices })
                }
              })
            }, 1000)
          },
          fail: function (err) {
            console.error('蓝牙搜索失败:', err)
            that.setData({ isScanning: false })
            wx.showToast({ title: '蓝牙搜索失败', icon: 'none' })
          }
        })
      },
      fail: function (err) {
        console.error('蓝牙适配器打开失败:', err)
        that.setData({ isScanning: false })
        wx.showToast({ title: '请打开蓝牙', icon: 'none' })
      }
    })
  },

  hideBluetoothModal: function () {
    this.setData({ showBluetoothModal: false, isScanning: false })
    if (this.bluetoothDiscovery) {
      clearInterval(this.bluetoothDiscovery)
      this.bluetoothDiscovery = null
    }
    wx.stopBluetoothDevicesDiscovery()
  },

  connectBluetooth: function (e) {
    const that = this
    const deviceId = e.currentTarget.dataset.deviceId
    const deviceName = e.currentTarget.dataset.deviceName
    
    wx.showLoading({ title: '连接中...' })
    
    if (this.bluetoothDiscovery) {
      clearInterval(this.bluetoothDiscovery)
      this.bluetoothDiscovery = null
    }
    wx.stopBluetoothDevicesDiscovery()

    wx.createBLEConnection({
      deviceId: deviceId,
      success: function () {
        wx.getBLEDeviceServices({
          deviceId: deviceId,
          success: function (res) {
            const service = res.services.find(s => s.uuid.startsWith('0000fff0') || s.uuid.startsWith('0000ffe0')) || res.services[0]
            
            wx.getBLEDeviceCharacteristics({
              deviceId: deviceId,
              serviceId: service.uuid,
              success: function (res) {
                let writeChar = null
                let notifyChar = null
                
                res.characteristics.forEach(char => {
                  if (char.properties.write || char.properties.writeWithoutResponse) {
                    writeChar = char.uuid
                  }
                  if (char.properties.notify) {
                    notifyChar = char.uuid
                  }
                })

                if (notifyChar) {
                  wx.notifyBLECharacteristicValueChange({
                    deviceId: deviceId,
                    serviceId: service.uuid,
                    characteristicId: notifyChar,
                    state: true,
                    success: function () {}
                  })
                }

                const printerConfig = {
                  enabled: true,
                  autoPrint: that.data.printerConfig.autoPrint,
                  connected: true,
                  deviceId: deviceId,
                  deviceName: deviceName,
                  serviceId: service.uuid,
                  writeCharacteristicId: writeChar,
                  notifyCharacteristicId: notifyChar
                }

                that.setData({ printerConfig })
                wx.setStorageSync('printerConfig', printerConfig)
                
                wx.hideLoading()
                that.setData({ showBluetoothModal: false })
                wx.showToast({ title: '连接成功', icon: 'success' })
              },
              fail: function (err) {
                console.error('获取特征失败:', err)
                wx.hideLoading()
                wx.showToast({ title: '获取特征失败', icon: 'none' })
              }
            })
          },
          fail: function (err) {
            console.error('获取服务失败:', err)
            wx.hideLoading()
            wx.showToast({ title: '获取服务失败', icon: 'none' })
          }
        })
      },
      fail: function (err) {
        console.error('连接失败:', err)
        wx.hideLoading()
        wx.showToast({ title: '连接失败', icon: 'none' })
      }
    })
  },

  disconnectPrinter: function () {
    if (!this.data.printerConfig.deviceId) {
      wx.showToast({ title: '未连接打印机', icon: 'none' })
      return
    }

    wx.showModal({
      title: '提示',
      content: '确定要断开打印机连接吗？',
      success: (res) => {
        if (res.confirm) {
          wx.closeBLEConnection({
            deviceId: this.data.printerConfig.deviceId,
            success: () => {
              const printerConfig = {
                ...this.data.printerConfig,
                connected: false
              }
              this.setData({ printerConfig })
              wx.setStorageSync('printerConfig', printerConfig)
              wx.showToast({ title: '已断开连接', icon: 'success' })
            },
            fail: () => {
              const printerConfig = {
                ...this.data.printerConfig,
                connected: false
              }
              this.setData({ printerConfig })
              wx.setStorageSync('printerConfig', printerConfig)
              wx.showToast({ title: '已断开连接', icon: 'success' })
            }
          })
        }
      }
    })
  },

  onPrinterSwitchChange: function (e) {
    const printerConfig = { ...this.data.printerConfig, enabled: e.detail.value }
    this.setData({ printerConfig })
    wx.setStorageSync('printerConfig', printerConfig)
    
    if (e.detail.value && !printerConfig.connected) {
      this.scanBluetooth()
    }
  },

  onAutoPrintSwitchChange: function (e) {
    const printerConfig = { ...this.data.printerConfig, autoPrint: e.detail.value }
    this.setData({ printerConfig })
    wx.setStorageSync('printerConfig', printerConfig)
  },

  testPrint: function () {
    if (!this.data.printerConfig.enabled || !this.data.printerConfig.connected) {
      wx.showToast({ title: '请先连接打印机', icon: 'none' })
      return
    }

    wx.showLoading({ title: '正在打印...' })

    const printData = this.generateTestLabel()
    
    this.sendPrintData(printData, () => {
      wx.hideLoading()
      wx.showToast({ title: '打印成功', icon: 'success' })
    }, () => {
      wx.hideLoading()
      wx.showToast({ title: '打印失败', icon: 'none' })
    })
  },

  generateTestLabel: function () {
    const buffer = []
    
    buffer.push(0x1B, 0x40)
    
    buffer.push(0x1B, 0x61, 0x01)
    
    buffer.push(0x1B, 0x21, 0x30)
    
    const title = '龟上心 · 宠物档案'
    for (let i = 0; i < title.length; i++) {
      const charCode = title.charCodeAt(i)
      buffer.push(charCode >> 8, charCode & 0xFF)
    }
    buffer.push(0x0A, 0x0A)
    
    buffer.push(0x1B, 0x21, 0x10)
    
    const content = '测试打印 - 德佟P1'
    for (let i = 0; i < content.length; i++) {
      const charCode = content.charCodeAt(i)
      buffer.push(charCode >> 8, charCode & 0xFF)
    }
    buffer.push(0x0A)
    
    buffer.push(0x1D, 0x56, 0x41, 0x03)
    
    return new Uint8Array(buffer)
  },

  sendPrintData: function (data, success, fail) {
    const that = this
    const config = this.data.printerConfig
    
    const chunkSize = 20
    let offset = 0

    function sendChunk() {
      if (offset >= data.length) {
        if (success) success()
        return
      }

      const chunk = data.slice(offset, Math.min(offset + chunkSize, data.length))
      offset += chunkSize

      wx.writeBLECharacteristicValue({
        deviceId: config.deviceId,
        serviceId: config.serviceId,
        characteristicId: config.writeCharacteristicId,
        value: chunk.buffer,
        success: function () {
          setTimeout(sendChunk, 50)
        },
        fail: function (err) {
          console.error('发送数据失败:', err)
          if (fail) fail()
        }
      })
    }

    sendChunk()
  },

  printLabel: function (labelData, success, fail) {
    if (!this.data.printerConfig.enabled || !this.data.printerConfig.connected) {
      if (fail) fail('打印机未连接')
      return
    }

    const buffer = []
    
    buffer.push(0x1B, 0x40)
    
    buffer.push(0x1B, 0x61, 0x01)
    
    buffer.push(0x1B, 0x21, 0x30)
    
    const title = labelData.title || '龟上心'
    for (let i = 0; i < title.length; i++) {
      const charCode = title.charCodeAt(i)
      buffer.push(charCode >> 8, charCode & 0xFF)
    }
    buffer.push(0x0A, 0x0A)
    
    buffer.push(0x1B, 0x21, 0x10)
    
    if (labelData.content) {
      for (let i = 0; i < labelData.content.length; i++) {
        const charCode = labelData.content.charCodeAt(i)
        buffer.push(charCode >> 8, charCode & 0xFF)
      }
      buffer.push(0x0A)
    }
    
    if (labelData.qrCode) {
      buffer.push(0x1D, 0x6B, 0x04, 0x00, 0x00)
      const qrData = labelData.qrCode
      const qrLen = qrData.length + 3
      buffer.push(qrLen >> 8, qrLen & 0xFF)
      buffer.push(0x49, 0x50, 0x41)
      for (let i = 0; i < qrData.length; i++) {
        const charCode = qrData.charCodeAt(i)
        buffer.push(charCode)
      }
      buffer.push(0x0A)
    }
    
    buffer.push(0x1D, 0x56, 0x41, 0x03)
    
    this.sendPrintData(new Uint8Array(buffer), success, fail)
  },

  // （旧分享相关方法已删除：editShareTitle / onShareTitleInput / saveShareTitle / editShareSubtitle / onShareSubtitleInput / saveShareSubtitle / startShareVoiceInput / stopShareVoiceInput）

  editNickname: function () {
    if (this.data.isEditingNickname) return
    
    const now = Date.now()
    const lastMonth = now - 30 * 24 * 60 * 60 * 1000
    
    try {
      const nicknameLog = wx.getStorageSync('nicknameLog') || {
        count: 0,
        lastReset: now
      }
      
      if (nicknameLog.lastReset < lastMonth) {
        nicknameLog.count = 0
        nicknameLog.lastReset = now
        wx.setStorageSync('nicknameLog', nicknameLog)
      }
      
      if (nicknameLog.count >= 3) {
        wx.showToast({
          title: '本月已修改3次，下月再试',
          icon: 'none'
        })
        return
      }
      
      wx.showModal({
        title: '修改昵称',
        content: `本月还可修改 ${3 - nicknameLog.count} 次，确定要修改吗？`,
        success: (res) => {
          if (res.confirm) {
            this.setData({
              isEditingNickname: true,
              tempNickname: this.data.userInfo.nickname
            })
          }
        }
      })
    } catch (error) {
      console.error('检查昵称修改次数失败:', error)
      this.setData({
        isEditingNickname: true,
        tempNickname: this.data.userInfo.nickname
      })
    }
  },

  onNicknameInput: function (e) {
    this.setData({
      tempNickname: e.detail.value
    })
  },

  saveNickname: function () {
    if (!this.data.tempNickname || this.data.tempNickname.trim() === '') {
      wx.showToast({
        title: '昵称不能为空',
        icon: 'none'
      })
      this.setData({
        tempNickname: this.data.userInfo.nickname
      })
      return
    }

    const userInfo = {
      ...this.data.userInfo,
      nickname: this.data.tempNickname.trim()
    }

    this.setData({
      userInfo,
      isEditingNickname: false
    })

    wx.setStorageSync('userInfo', userInfo)
    
    try {
      const nicknameLog = wx.getStorageSync('nicknameLog') || {
        count: 0,
        lastReset: Date.now()
      }
      nicknameLog.count++
      wx.setStorageSync('nicknameLog', nicknameLog)
    } catch (error) {
      console.error('记录昵称修改次数失败:', error)
    }
  },

  startVoiceInput: function () {
    this.setData({ isRecording: true })
    wx.showToast({
      title: '正在录音...',
      icon: 'none',
      duration: 15000
    })

    if (!this.recorderManager) {
      this.recorderManager = wx.getRecorderManager()

      this.recorderManager.onStop(async (res) => {
        wx.hideToast()
        this.setData({ isRecording: false })

        if (this.voiceTimeout) {
          clearTimeout(this.voiceTimeout)
          this.voiceTimeout = null
        }

        const tempFilePath = res.tempFilePath
        if (!tempFilePath) {
          return
        }

        wx.showLoading({ title: '识别中...' })

        try {
          const cloudPath = 'voice/' + Date.now() + '_' + Math.random().toString(36).slice(2) + '.mp3'
          const uploadResult = await wx.cloud.uploadFile({
            cloudPath: cloudPath,
            filePath: tempFilePath
          })

          const result = await wx.cloud.callFunction({
            name: 'speech',
            data: {
              action: 'recognize',
              data: {
                fileID: uploadResult.fileID
              }
            }
          })

          wx.hideLoading()

          if (result.result && result.result.success && result.result.data.text) {
            const recognizedText = result.result.data.text
            this.setData({ tempNickname: recognizedText })
            
            const userInfo = {
              ...this.data.userInfo,
              nickname: recognizedText.trim()
            }
            this.setData({
              userInfo,
              isEditingNickname: false
            })
            wx.setStorageSync('userInfo', userInfo)
          }
        } catch (error) {
          wx.hideLoading()
          console.error('语音识别失败:', error)
        }
      })

      this.recorderManager.onError((err) => {
        wx.hideToast()
        this.setData({ isRecording: false })
        if (this.voiceTimeout) {
          clearTimeout(this.voiceTimeout)
          this.voiceTimeout = null
        }
        console.error('录音错误:', err)
      })
    }

    this.voiceTimeout = setTimeout(() => {
      if (this.data.isRecording && this.recorderManager) {
        this.recorderManager.stop()
        wx.showToast({ title: '录音超时', icon: 'none' })
      }
    }, 15000)

    this.recorderManager.start({
      duration: 15000,
      sampleRate: 16000,
      numberOfChannels: 1,
      encodeBitRate: 48000,
      format: 'mp3'
    })
  },

  stopVoiceInput: function () {
    if (this.data.isRecording && this.recorderManager) {
      if (this.voiceTimeout) {
        clearTimeout(this.voiceTimeout)
        this.voiceTimeout = null
      }
      this.recorderManager.stop()
    }
  },

  onPhotoError: async function (e) {
    const { type } = e.currentTarget.dataset

    if (type === 'avatar') {
      const avatar = this.data.userInfo.avatar
      if (!avatar) return

      let fileId = null
      if (avatar.startsWith('cloud://')) {
        fileId = avatar
      } else if (avatar.includes('tcb.qcloud.la')) {
        try {
          const match = avatar.match(/^https?:\/\/([^\/]+)(\/[^\?]+)/)
          if (match) {
            const domainPrefix = match[1].replace('.tcb.qcloud.la', '')
            fileId = `cloud://cloud1-d0g853l9d7017ea3b.${domainPrefix}${match[2]}`
          }
        } catch (err) {
          console.error('提取fileID失败:', err)
        }
      }

      if (fileId) {
        console.log('头像加载失败，尝试重新获取URL:', fileId)
        try {
          const newUrl = await getTempUrl(fileId)
          const userInfo = { ...this.data.userInfo, avatar: newUrl }
          this.setData({ userInfo })
          wx.setStorageSync('userInfo', userInfo)
        } catch (err) {
          console.error('重新获取头像URL失败:', err)
          // 文件不存在，清空头像避免无限重试
          const userInfo = { ...this.data.userInfo, avatar: '' }
          this.setData({ userInfo })
          wx.setStorageSync('userInfo', userInfo)
        }
      }
      return
    }
  }

})