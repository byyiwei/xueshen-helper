import { LPAPIFactory } from '../../lpapi/index'

const { getAPI } = require('../../utils/api.js')
const { showError, showSuccess, showLoading, hideLoading, showConfirm } = require('../../utils/error.js')
const { getVoiceManager } = require('../../utils/voice.js')
const { convertPhotoIdsToUrls, getTempUrl, convertPetPhotosToUrls, sanitizePetPhotos } = require('../../utils/image.js')
const { mergeCategories, syncMissingCategoriesToCloud } = require('../../utils/category.js')
const API = getAPI()
const voiceManager = getVoiceManager()

Page({
  data: {
    // Tab / 状态
    currentEventTab: '全部事件',
    eventCollapsed: true,
    pressedTab: '',
    pet: null,
    petId: '',
    loading: true,
    isLoggedIn: false,
    isPublicMode: false,
    statusClass: '',
    showSkeleton: true,

    // 扫码进入模式（只读控制）
    isReadOnly: false,
    scanRecordId: '',

    // 弹窗
    showEditModal: false,
    showDeleteConfirm: false,
    showAddRecordModal: false,
    showFatherModal: false,
    showMotherModal: false,
    showPartnerModal: false,
    partnerList: [],
    partnerSearchText: '',
    selectedPartner: null,
    showTimelineModal: false,
    showRecordModal: false,
    // 打印调试弹窗
    showPrintDebugModal: false,
    printDebugSteps: [],

    // 日期/主题
    selectedDate: '',
    endDate: '',
    today: '',
    switchColor: '#E8A400',

    // 编辑表单
    editForm: {
      name: '',
      category: '',
      gender: '公',
      alias: '',
      father: '',
      fatherName: '',
      mother: '',
      motherName: '',
      status: '正常',
      isPublic: false,
      photos: []
    },
    categories: ['无'],
    showAddCategoryModal: false,
    newCategoryName: '',
    showEditCategoryModal: false,
    editCategoryOldName: '',
    editCategoryNewName: '',
    showEditManual: false,
    selectedFather: null,
    selectedMother: null,
    fatherList: [],
    motherList: [],
    fatherSearchText: '',
    motherSearchText: '',
    editPhotoList: [],
    photoUploading: false,

    // 记录
    records: [],
    filteredRecords: [],
    groupedRecords: [],
    currentRecord: null,
    recordTypes: ['建档', '交配', '产蛋', '出苗', '健康'],
    addRecordTypes: ['交配', '产蛋', '出苗', '健康'],
    newRecord: {
      type: '交配',
      text: ''
    },
    recordPartner: null, // 交配记录的配对对象
    showRecordPartnerModal: false,
    recordPartnerList: [],
    recordPartnerSearchText: '',
    // 换公记录（母龟的交配公龟列表）
    mateMaleList: [],

    // 语音
    currentVoiceField: '',
    tempVoicePath: '',
    isRecording: false,

    // 保存中标记（防止打印+确认重复保存）
    _isSavingRecord: false,

    // 打印机配置
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
    lpapi: null,

    // 家谱/谱系
    showPedigree: false,
    pedigreeData: { fullTree: {}, hasGen1: false, hasGen2: false, hasGen3: false },
    pedigreeStats: {
      totalAncestors: 0,
      maleCount: 0,
      femaleCount: 0,
      maxDepth: 0
    },
    paternalLine: [],
    maternalLine: [],
    bloodlineTab: 'paternal',

    // 提醒事件
    showReminderModal: false,
    showReminderEditModal: false,
    reminders: [],
    upcomingReminders: [],
    allEnrichedReminders: [],
    editingReminder: null,
    reminderForm: {
      type: '换水',
      intervalDays: 1,
      lastDone: ''
    },
    reminderTypes: ['换水', '喂食', '健康', '繁育'],
    reminderTypeIcons: {
      '换水': '💧',
      '喂食': '🍽',
      '健康': '❤',
      '繁育': '🥚'
    }
  },

  // ============================================================
  // 生命周期 / 初始化
  // ============================================================

  onLoad: function (options) {
    // 初始化 today + 当月默认筛选
    const now = new Date()
    const today = this._formatDate(now)
    const monthStart = this._formatDate(new Date(now.getFullYear(), now.getMonth(), 1))
    const monthEnd = this._formatDate(new Date(now.getFullYear(), now.getMonth() + 1, 0))
    this.setData({ today, selectedDate: monthStart, endDate: monthEnd })

    // 打印机配置
    this.loadPrinterConfig()
    // 初始化德佟打印SDK
    this.lpapi = LPAPIFactory.getInstance({ showLog: 4 })
    // 自动连接打印机（如果已开启）
    wx.nextTick(() => { this.tryAutoConnect() })

    // petId
    const petId = (options && options.petId) || ''
    this.setData({ petId })

    // 导航栏高度
    const sysInfo = wx.getSystemInfoSync()
    const navContentHeight = 44
    this.setData({
      statusBarHeight: sysInfo.statusBarHeight,
      totalNavHeight: sysInfo.statusBarHeight + navContentHeight
    })

    // 预览页跳转过来新增记录
    if (options && options.action === 'addRecord') {
      this._pendingAddRecord = true
    }

    // 公开浏览模式（从公开档案或分享链接进入）
    if (options && (options.isPublic === 'true' || options.isPublic === true)) {
      this.setData({
        isReadOnly: true,
        isPublicMode: true
      })
    }

    // 扫码进入模式（from=scan 表示从标签二维码扫码进入）
    if (options && options.from === 'scan') {
      this.setData({
        isReadOnly: true,  // 默认只读，verifiedPetDetail 后再确认
        scanRecordId: options.recordId || ''
      })
    }

    // 主要数据加载
    this.loadPetDetail(petId)
    this.loadRecords(petId)
    this.loadReminders(petId)

    // 谱系
    this.loadPedigree(petId)

    // 添加最近浏览记录
    this.addToRecentViews(petId, options)
  },

  onShow: function () {
    const app = getApp()
    const isLoggedIn = app.globalData.isLoggedIn
    this.setData({ isLoggedIn })
    if (!isLoggedIn) return
    // 再次刷新提醒（避免用户从 my 页修改后未同步）
    if (this.data.petId) {
      this.loadReminders(this.data.petId)
    }
  },

  onHide: function () {
    if (this.lpapi) {
      this.lpapi.stopBleDiscovery()
    }
  },

  onUnload: function () {
    if (this.lpapi) {
      this.lpapi.stopBleDiscovery()
    }
  },

  loadPrinterConfig: function () {
    try {
      const savedConfig = wx.getStorageSync('printerConfig')
      if (savedConfig) {
        // 恢复配置但标记为未连接（BLE 连接不会跨会话保持）
        savedConfig.connected = false
        savedConfig.enabled = false
        this.setData({ printerConfig: savedConfig })
      }
    } catch (error) {
      console.error('加载打印机配置失败:', error)
    }
  },

  // 自动连接打印机（与 my 页逻辑一致）
  tryAutoConnect: function () {
    const pc = this.data.printerConfig
    if (!pc.autoConnect || !pc.deviceId) return
    if (pc.connected) return
    if (pc.connectFailCount >= 3) return

    const that = this
    wx.openBluetoothAdapter({
      success: function () {
        that._doAutoConnect(pc)
      },
      fail: function (err) {
        console.error('[autoConnect] 蓝牙适配器初始化失败:', err)
        const updated = { ...pc, connectFailCount: (pc.connectFailCount || 0) + 1 }
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
        console.error('[autoConnect] 详情页自动连接失败:', resp)
        const newCount = (pc.connectFailCount || 0) + 1
        const updated = { ...pc, connectFailCount: newCount }
        that.setData({ printerConfig: updated })
        wx.setStorageSync('printerConfig', updated)
      }
    })
  },

  // ============================================================
  // 通用工具
  // ============================================================

  pressTab: function (e) {
    const tab = e.currentTarget.dataset.tab
    if (!tab) return
    this.setData({ pressedTab: tab })
  },

  releaseTab: function (e) {
    this.setData({ pressedTab: '' })
  },

  stopPropagation: function () {
    // 阻止冒泡
  },

  _formatDate: function (d) {
    if (!(d instanceof Date)) d = new Date(d)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  },

  goBack: function () {
    const pages = getCurrentPages()
    if (pages.length > 1) {
      wx.navigateBack()
    } else {
      wx.switchTab({ url: '/pages/pet/index' })
    }
  },

  goToLogin: function () {
    const app = getApp()
    app.requireLogin()
  },

  showMore: function () {
    wx.showActionSheet({
      itemList: ['编辑信息', '删除宠物', '添加提醒'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.editInfo()
        } else if (res.tapIndex === 1) {
          this.confirmDelete()
        } else if (res.tapIndex === 2) {
          this.openReminderEdit()
        }
      }
    })
  },

  sharePet: function () {
    if (!this.data.pet) return
    const pet = this.data.pet
    const petId = this.data.petId
    const title = (pet.alias || pet.name || '宠物') + ' - 养龟档案'
    const imageUrl = (pet.photos && pet.photos.length) ? pet.photos[0] : ''
    wx.showShareMenu({ withShareTicket: true })
    wx.shareAppMessage({
      title: title,
      path: '/pages/pet/detail?petId=' + petId + '&isPublic=true',
      imageUrl: imageUrl
    })
  },

  goToEggReport: function () {
    const app = getApp()
    if (!app.requireLogin()) return
    const pet = this.data.pet || {}
    let url = '/subpkg-report/pages/egg-report/index'
    if (pet.gender === '母') {
      const petId = pet._id || pet.id || this.data.petId
      url += '?petId=' + petId
    } else if (pet.gender === '公') {
      url += '?maleId=' + (this.data.petId)
    }
    wx.navigateTo({ url })
  },

  goToHatchReport: function () {
    const app = getApp()
    if (!app.requireLogin()) return
    const pet = this.data.pet || {}
    let url = '/subpkg-report/pages/hatch-report/index'
    if (pet.gender === '母') {
      const petId = pet._id || pet.id || this.data.petId
      url += '?petId=' + petId
    } else if (pet.gender === '公') {
      url += '?maleId=' + (this.data.petId)
    }
    wx.navigateTo({ url })
  },

  onShareAppMessage: function () {
    const pet = this.data.pet || {}
    const photos = pet.photos || []
    const imageUrl = photos.length > 0 ? photos[0] : ''
    return {
      title: `${pet.alias || pet.name || '宠物'}的档案`,
      path: '/pages/pet/detail?petId=' + (this.data.petId || '') + '&isPublic=true',
      imageUrl: imageUrl
    }
  },

  onShareTimeline: function () {
    const pet = this.data.pet || {}
    const photos = pet.photos || []
    const imageUrl = photos.length > 0 ? photos[0] : ''
    return {
      title: `${pet.alias || pet.name || '宠物'}的档案`,
      query: 'petId=' + (this.data.petId || '') + '&isPublic=true',
      imageUrl: imageUrl
    }
  },

  // ============================================================
  // 宠物详情加载（先云端后本地）
  // ============================================================

  loadPetDetail: async function (petId) {
    if (!petId) {
      this.setData({ loading: false })
      return
    }
    this.setData({ loading: true })
    try {
      let result
      if (this.data.isPublicMode) {
        // 公开模式：调用公开接口
        result = await API.callCloudFunction('pet', 'publicGet', { id: petId })
      } else {
        result = await API.getPetById(petId)
      }
      if (result && result.success && result.data) {
        const pet = result.data
        // 规范化 father/mother 名称显示
        if (!pet.fatherName && pet.father) pet.fatherName = '父本'
        if (!pet.motherName && pet.mother) pet.motherName = '母本'
        // 扫码进入时验证所有权
        if (this.data.isReadOnly && !this.data.isPublicMode) {
          const currentOpenid = wx.getStorageSync('openid')
          if (currentOpenid && pet._openid && currentOpenid === pet._openid) {
            this.setData({ isReadOnly: false })
          } else {
            wx.showToast({ title: '仅创建者可编辑', icon: 'none' })
          }
        }
        await this.setPetData(pet)
      } else {
        // 云端失败 → 回退本地
        this.loadLocalPetDetail(petId)
      }
    } catch (error) {
      console.error('加载宠物详情失败:', error)
      this.loadLocalPetDetail(petId)
    } finally {
      this.setData({ loading: false })
    }
  },

  loadLocalPetDetail: function (petId) {
    try {
      // 优先从 pets 缓存查找
      const pets = wx.getStorageSync('pets') || []
      let pet = pets.find(p => (p.id || p._id) === petId)
      // pets 没有则从回收站查找（刚删除又进入详情页的场景）
      if (!pet) {
        const recycleBin = wx.getStorageSync('recycleBin') || []
        pet = recycleBin.find(p => (p.id || p._id) === petId)
      }
      if (pet) {
        this.setPetData(pet)
      } else {
        showError('未找到该宠物信息')
      }
    } catch (error) {
      console.error('读取本地宠物失败:', error)
      showError('加载失败')
    } finally {
      this.setData({ loading: false })
    }
  },

  setPetData: async function (pet) {
    if (!pet) return
    let displayPet = { ...pet }

    // 转换图片 URL（用于展示）
    if (displayPet.photos && displayPet.photos.length > 0) {
      try {
        const photoUrls = await convertPhotoIdsToUrls(displayPet.photos)
        displayPet = { ...displayPet, photos: photoUrls }
      } catch (err) {

      }
    }

    // 状态样式分类
    let statusClass = ''
    if (displayPet.status === '预警') statusClass = 'warning'
    else if (displayPet.status === '待配') statusClass = 'pending'
    else statusClass = 'normal'

    this.setData({ pet: displayPet, statusClass, showSkeleton: false })
    if (this.data.records && this.data.records.length) {
      this.filterAndGroupRecords(this.data.records)
    }

    // 预览页跳转过来时自动打开新增记录弹窗
    if (this._pendingAddRecord) {
      this._pendingAddRecord = false
      wx.nextTick(() => { this.addRecord() })
    }
  },

  onPhotoError: async function (e) {
    const { index, type } = e.currentTarget.dataset
    const pet = this.data.pet
    if (!pet || !pet.photos) return

    if (type === 'hero' && typeof index === 'number') {
      const photo = pet.photos[index]
      if (!photo) return
      try {
        const newUrl = await getTempUrl(photo)
        if (newUrl && newUrl !== photo) {
          const photos = [...pet.photos]
          photos[index] = newUrl
          this.setData({ 'pet.photos': photos })
        }
      } catch (err) {
        // 文件不存在，清空
        const photos = pet.photos.filter((_, i) => i !== index)
        this.setData({ 'pet.photos': photos })
      }
    } else if (type === 'tree') {
      // 谱系树图：统一刷新（简化处理）
      try {
        const newUrl = await getTempUrl(pet.photos[0])
        if (newUrl) {
          const photos = [...pet.photos]
          photos[0] = newUrl
          this.setData({ 'pet.photos': photos })
        }
      } catch (err) {}
    }
  },

  // ============================================================
  // 编辑 / 删除宠物
  // ============================================================

  editInfo: async function () {
    const pet = this.data.pet
    if (!pet) return
    let categories = await this._loadCategoriesFromCloud()
    const petCategory = (pet.category || '').trim()
    if (petCategory && !categories.includes(petCategory)) {
      categories = [...categories, petCategory]
    }
    this.setData({
      categories,
      showEditModal: true,
      editForm: {
        name: pet.name || '',
        category: petCategory || '无',
        gender: pet.gender || '公',
        alias: pet.alias || '',
        price: pet.price || '',
        father: pet.father || '',
        fatherName: pet.fatherName || '',
        mother: pet.mother || '',
        motherName: pet.motherName || '',
        partner: pet.partner || '',
        partnerName: pet.partnerName || '',
        status: pet.status || '正常',
        isPublic: !!pet.isPublic,
        photos: pet.photos && pet.photos.length ? [...pet.photos] : []
      },
      editPhotoList: pet.photos && pet.photos.length ? [...pet.photos] : [],
      selectedFather: pet.father ? { id: pet.father, name: pet.fatherName || '父本' } : null,
      selectedMother: pet.mother ? { id: pet.mother, name: pet.motherName || '母本' } : null,
      selectedPartner: pet.partner ? { id: pet.partner, name: pet.partnerName || '配对', alias: pet.partnerName } : null
    })
  },

  async _loadCategoriesFromCloud() {
    const localCategories = wx.getStorageSync('categories') || []
    const petCategory = (this.data.pet && this.data.pet.category) ? [this.data.pet.category] : []

    try {
      const result = await API.getCategories()
      if (result && result.success && result.data && result.data.categories) {
        let categories = mergeCategories(result.data.categories, localCategories, petCategory)
        categories = await syncMissingCategoriesToCloud(categories, API)
        wx.setStorageSync('categories', categories)
        getApp().globalData.preloadedCategories = categories
        return categories
      }
    } catch (err) {
      console.error('从数据库加载分类失败:', err)
    }
    const savedCategories = wx.getStorageSync('categories')
    return mergeCategories(savedCategories, petCategory)
  },

  loadCategories() {
    this._loadCategoriesFromCloud().then(categories => {
      this.setData({ categories })
    }).catch(() => {
      const savedCategories = wx.getStorageSync('categories')
      if (savedCategories && savedCategories.length > 0) {
        this.setData({ categories: savedCategories })
      }
    })
  },

  hideEditModal: function () {
    this.setData({ showEditModal: false })
  },

  toggleEditManual: function () {
    this.setData({ showEditManual: !this.data.showEditManual })
  },

  onEditNameInput: function (e) {
    this.setData({ 'editForm.name': e.detail.value })
  },

  onEditAliasInput: function (e) {
    this.setData({ 'editForm.alias': e.detail.value })
  },

  onEditPriceInput: function (e) {
    this.setData({ 'editForm.price': e.detail.value })
  },

  selectEditCategory: function (e) {
    const category = e.currentTarget.dataset.category
    if (category === undefined) return
    this.setData({ 'editForm.category': category })
  },

  addCategory: function () {
    this.setData({
      showAddCategoryModal: true,
      newCategoryName: ''
    })
  },

  hideAddCategoryModal: function () {
    this.setData({ showAddCategoryModal: false })
  },

  onCategoryInput: function (e) {
    this.setData({ newCategoryName: e.detail.value })
  },

  confirmAddCategory: async function () {
    const name = (this.data.newCategoryName || '').trim()
    if (!name) {
      showError('请输入分类名称')
      return
    }
    if (name === '无') {
      showError('分类名称不能为"无"')
      return
    }
    if (this.data.categories.includes(name)) {
      showError('分类已存在')
      return
    }

    try {
      const result = await API.addCategory(name)
      if (result && result.success && result.data && result.data.categories) {
        const categories = result.data.categories
        this.setData({
          categories,
          showAddCategoryModal: false,
          'editForm.category': name
        })
        wx.setStorageSync('categories', categories)
        getApp().globalData.preloadedCategories = categories
        showSuccess('添加成功')
      } else {
        showError(result?.message || '添加失败，请重试')
      }
    } catch (err) {
      console.error('分类同步到数据库失败:', err)
      showError('添加失败，请检查网络后重试')
    }
  },

  // 编辑分类名称
  editCategory: function (e) {
    const category = e.currentTarget.dataset.category
    if (category === '无') {
      showError('不能修改默认分类')
      return
    }
    this.setData({
      showEditCategoryModal: true,
      editCategoryOldName: category,
      editCategoryNewName: category
    })
  },

  hideEditCategoryModal: function () {
    this.setData({ showEditCategoryModal: false })
  },

  onEditCategoryInput: function (e) {
    this.setData({ editCategoryNewName: e.detail.value })
  },

  confirmEditCategory: async function () {
    const oldName = this.data.editCategoryOldName
    const newName = this.data.editCategoryNewName.trim()

    if (!newName) {
      showError('请输入分类名称')
      return
    }
    if (newName === '无') {
      showError('分类名称不能为"无"')
      return
    }
    if (oldName === newName) {
      this.setData({ showEditCategoryModal: false })
      return
    }
    if (this.data.categories.includes(newName)) {
      showError('分类已存在')
      return
    }

    // 更新本地UI
    const categories = this.data.categories.map(c => c === oldName ? newName : c)
    let newCategory = this.data.editForm.category
    if (newCategory === oldName) {
      newCategory = newName
    }

    this.setData({
      categories,
      'editForm.category': newCategory,
      showEditCategoryModal: false
    })

    try {
      const result = await API.updateCategory(oldName, newName)
      if (result && result.success && result.data && result.data.categories) {
        const synced = result.data.categories
        this.setData({ categories: synced, 'editForm.category': newCategory })
        wx.setStorageSync('categories', synced)
        getApp().globalData.preloadedCategories = synced
        showSuccess('修改成功')
      } else {
        wx.setStorageSync('categories', categories)
        showError(result?.message || '修改同步失败')
      }
    } catch (err) {
      wx.setStorageSync('categories', categories)
      console.error('分类修改同步到数据库失败:', err)
      showError('修改同步失败，请重试')
    }
  },

  deleteCategory: async function (e) {
    const category = e.currentTarget.dataset.category
    if (category === '无') {
      showError('不能删除默认分类')
      return
    }
    const confirmed = await showConfirm('删除分类', `确定要删除分类"${category}"吗？`)
    if (!confirmed) return
    const categories = (this.data.categories || []).filter(c => c !== category)
    let newCategory = this.data.editForm.category
    if (newCategory === category) {
      newCategory = '无'
    }
    this.setData({
      categories,
      'editForm.category': newCategory
    })

    try {
      const result = await API.deleteCategory(category)
      if (result && result.success && result.data && result.data.categories) {
        const synced = result.data.categories
        this.setData({ categories: synced, 'editForm.category': newCategory })
        wx.setStorageSync('categories', synced)
        getApp().globalData.preloadedCategories = synced
        showSuccess('删除成功')
      } else {
        wx.setStorageSync('categories', categories)
        showSuccess('删除成功')
      }
    } catch (err) {
      wx.setStorageSync('categories', categories)
      console.error('分类删除同步到数据库失败:', err)
      showSuccess('删除成功')
    }
  },

  selectEditGender: function (e) {
    const gender = e.currentTarget.dataset.gender
    if (!gender) return
    this.setData({ 'editForm.gender': gender })
  },

  selectEditStatus: function (e) {
    const status = e.currentTarget.dataset.status
    if (!status) return
    this.setData({ 'editForm.status': status })
  },

  onPublicSwitchChange: function (e) {
    this.setData({ 'editForm.isPublic': e.detail.value })
  },

  // ===== 父本/母本选择 =====

  openFatherModal: async function () {
    this.setData({
      showFatherModal: true,
      fatherSearchText: '',
      fatherList: []
    })
    try {
      const localPets = wx.getStorageSync('pets') || []
      const fathers = localPets
        .filter(p => p.gender === '公' && (p.id || p._id) !== this.data.petId)
        .map(p => ({
          id: p.id || p._id,
          name: p.name,
          alias: p.alias,
          photos: p.photos ? p.photos.slice(0, 1) : []
        }))
      this.setData({ fatherList: fathers })
    } catch (err) {
      console.error('加载父本列表失败:', err)
    }
  },

  hideFatherModal: function () {
    this.setData({ showFatherModal: false })
  },

  selectFather: function (e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    const father = this.data.fatherList.find(p => p.id === id)
    if (!father) return
    this.setData({
      selectedFather: father,
      'editForm.father': father.id,
      'editForm.fatherName': father.alias || father.name,
      showFatherModal: false
    })
  },

  clearFather: function () {
    this.setData({
      selectedFather: null,
      'editForm.father': '',
      'editForm.fatherName': ''
    })
  },

  onFatherSearchInput: function (e) {
    const searchText = (e.detail.value || '').toLowerCase()
    this.setData({ fatherSearchText: searchText })
    try {
      const localPets = wx.getStorageSync('pets') || []
      const list = localPets
        .filter(p =>
          p.gender === '公' &&
          (p.id || p._id) !== this.data.petId &&
          ((p.name || '').toLowerCase().includes(searchText) ||
            (p.alias || '').toLowerCase().includes(searchText))
        )
        .map(p => ({
          id: p.id || p._id,
          name: p.name,
          alias: p.alias,
          photos: p.photos ? p.photos.slice(0, 1) : []
        }))
      this.setData({ fatherList: list })
    } catch (err) {}
  },

  openMotherModal: async function () {
    this.setData({
      showMotherModal: true,
      motherSearchText: '',
      motherList: []
    })
    try {
      const localPets = wx.getStorageSync('pets') || []
      const mothers = localPets
        .filter(p => p.gender === '母' && (p.id || p._id) !== this.data.petId)
        .map(p => ({
          id: p.id || p._id,
          name: p.name,
          alias: p.alias,
          photos: p.photos ? p.photos.slice(0, 1) : []
        }))
      this.setData({ motherList: mothers })
    } catch (err) {
      console.error('加载母本列表失败:', err)
    }
  },

  hideMotherModal: function () {
    this.setData({ showMotherModal: false })
  },

  selectMother: function (e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    const mother = this.data.motherList.find(p => p.id === id)
    if (!mother) return
    this.setData({
      selectedMother: mother,
      'editForm.mother': mother.id,
      'editForm.motherName': mother.alias || mother.name,
      showMotherModal: false
    })
  },

  clearMother: function () {
    this.setData({
      selectedMother: null,
      'editForm.mother': '',
      'editForm.motherName': ''
    })
  },

  onMotherSearchInput: function (e) {
    const searchText = (e.detail.value || '').toLowerCase()
    this.setData({ motherSearchText: searchText })
    try {
      const localPets = wx.getStorageSync('pets') || []
      const list = localPets
        .filter(p =>
          p.gender === '母' &&
          (p.id || p._id) !== this.data.petId &&
          ((p.name || '').toLowerCase().includes(searchText) ||
            (p.alias || '').toLowerCase().includes(searchText))
        )
        .map(p => ({
          id: p.id || p._id,
          name: p.name,
          alias: p.alias,
          photos: p.photos ? p.photos.slice(0, 1) : []
        }))
      this.setData({ motherList: list })
    } catch (err) {}
  },

  // ===== 配对对象选择 =====

  openPartnerModal: async function () {
    const gender = (this.data.pet && this.data.pet.gender) || '公'
    const oppositeGender = gender === '公' ? '母' : '公'
    this.setData({ showPartnerModal: true, partnerSearchText: '', partnerList: [] })
    try {
      const localPets = wx.getStorageSync('pets') || []
      const list = localPets
        .filter(p => p.gender === oppositeGender && (p.id || p._id) !== this.data.petId)
        .map(p => ({
          id: p.id || p._id,
          name: p.name,
          alias: p.alias,
          gender: p.gender,
          photos: p.photos ? p.photos.slice(0, 1) : []
        }))
      this.setData({ partnerList: list })
    } catch (err) {
      console.error('加载配对列表失败:', err)
    }
  },

  hidePartnerModal: function () {
    this.setData({ showPartnerModal: false })
  },

  selectPartner: function (e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    const partner = this.data.partnerList.find(p => p.id === id)
    if (!partner) return
    this.setData({
      selectedPartner: partner,
      'editForm.partner': partner.id,
      'editForm.partnerName': partner.alias || partner.name,
      showPartnerModal: false
    })
  },

  clearPartner: function () {
    this.setData({
      selectedPartner: null,
      'editForm.partner': '',
      'editForm.partnerName': ''
    })
  },

  onPartnerSearchInput: function (e) {
    const searchText = (e.detail.value || '').toLowerCase()
    const gender = (this.data.pet && this.data.pet.gender) || '公'
    const oppositeGender = gender === '公' ? '母' : '公'
    this.setData({ partnerSearchText: searchText })
    try {
      const localPets = wx.getStorageSync('pets') || []
      const list = localPets
        .filter(p =>
          p.gender === oppositeGender &&
          (p.id || p._id) !== this.data.petId &&
          ((p.name || '').toLowerCase().includes(searchText) ||
            (p.alias || '').toLowerCase().includes(searchText))
        )
        .map(p => ({
          id: p.id || p._id,
          name: p.name,
          alias: p.alias,
          gender: p.gender,
          photos: p.photos ? p.photos.slice(0, 1) : []
        }))
      this.setData({ partnerList: list })
    } catch (err) {}
  },

  // ===== 记录配对对象 =====
  openRecordPartnerModal: async function () {
    const gender = (this.data.pet && this.data.pet.gender) || '公'
    const oppositeGender = gender === '公' ? '母' : '公'
    this.setData({ showRecordPartnerModal: true, recordPartnerSearchText: '', recordPartnerList: [] })
    try {
      const localPets = wx.getStorageSync('pets') || []
      const list = localPets
        .filter(p => p.gender === oppositeGender && (p.id || p._id) !== this.data.petId)
        .map(p => ({
          id: p.id || p._id,
          name: p.name,
          alias: p.alias,
          gender: p.gender,
          photos: p.photos || []
        }))
      this.setData({ recordPartnerList: list })
    } catch (err) {
      console.error('加载记录配对列表失败:', err)
    }
  },

  hideRecordPartnerModal: function () {
    this.setData({ showRecordPartnerModal: false })
  },

  selectRecordPartner: function (e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    const partner = this.data.recordPartnerList.find(p => p.id === id)
    if (!partner) return
    this.setData({
      recordPartner: partner,
      showRecordPartnerModal: false
    })
  },

  clearRecordPartner: function () {
    this.setData({ recordPartner: null })
  },

  onRecordPartnerSearch: function (e) {
    const searchText = (e.detail.value || '').toLowerCase()
    const gender = (this.data.pet && this.data.pet.gender) || '公'
    const oppositeGender = gender === '公' ? '母' : '公'
    this.setData({ recordPartnerSearchText: searchText })
    try {
      const localPets = wx.getStorageSync('pets') || []
      const list = localPets
        .filter(p => p.gender === oppositeGender && (p.id || p._id) !== this.data.petId)
        .filter(p => {
          if (!searchText) return true
          return (p.name || '').toLowerCase().includes(searchText) || (p.alias || '').toLowerCase().includes(searchText)
        })
        .map(p => ({
          id: p.id || p._id,
          name: p.name,
          alias: p.alias,
          gender: p.gender
        }))
      this.setData({ recordPartnerList: list })
    } catch (err) {}
  },

  // ===== 图片 =====

  chooseEditPhoto: function () {
    const that = this
    const max = 5
    const current = this.data.editPhotoList.length
    if (current >= max) {
      showError(`最多只能选择 ${max} 张图片`)
      return
    }
    wx.chooseImage({
      count: max - current,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: function (res) {
        const newList = [...that.data.editPhotoList, ...(res.tempFilePaths || [])]
        that.setData({
          editPhotoList: newList,
          'editForm.photos': newList
        })
      },
      fail: function () {
        showError('选择图片失败')
      }
    })
  },

  removeEditPhoto: function (e) {
    const index = e.currentTarget.dataset.index
    if (index === undefined) return
    const list = [...this.data.editPhotoList]
    list.splice(index, 1)
    this.setData({
      editPhotoList: list,
      'editForm.photos': list
    })
  },

  uploadPhotoToCloud: async function (photos) {
    if (!photos || photos.length === 0) return []
    const results = []
    for (const filePath of photos) {
      if (typeof filePath === 'string' && filePath.startsWith('cloud://')) {
        results.push(filePath)
        continue
      }
      // 跳过非本地文件路径
      if (typeof filePath !== 'string' || filePath.startsWith('http://') || filePath.startsWith('https://')) {
        console.warn('跳过非本地文件上传:', filePath)
        continue
      }
      try {
        const res = await API.uploadImage(filePath, 'pets', petId, { scene: 'pet' })
        if (res && res.success && res.fileID) {
          results.push(res.fileID)
        } else if (res && res.fileID) {
          results.push(res.fileID)
        } else {
          results.push(filePath)
        }
      } catch (err) {
        console.error('上传图片失败，跳过该图片:', filePath, err.message)
        results.push(filePath)
      }
    }
    return results
  },

  // ===== 保存编辑 =====

  saveEdit: async function () {
    const app = getApp()
    if (!app.requireLogin()) return

    const form = this.data.editForm
    if (!form.name) {
      showError('请输入宠物名称')
      return
    }

    this.setData({ photoUploading: true })
    try {
      // 上传图片到云端（仅对新上传的本地路径进行上传）
      const localPhotos = this.data.editPhotoList || []
      let photoIdsOrUrls = localPhotos
      try {
        photoIdsOrUrls = await this.uploadPhotoToCloud(localPhotos)
      } catch (err) {

      }

      const payload = {
        id: this.data.petId,
        name: form.name,
        category: form.category,
        gender: form.gender,
        alias: form.alias,
        price: form.price,
        father: form.father,
        fatherName: form.fatherName,
        mother: form.mother,
        motherName: form.motherName,
        partner: form.partner,
        partnerName: form.partnerName,
        status: form.status,
        isPublic: form.isPublic,
        photos: photoIdsOrUrls
      }

      const result = await API.updatePet(payload)
      if (result && result.success) {
        // 更新本地缓存
        this._updateLocalPetCache(payload)
        // 重新加载
        await this.setPetData(payload)
        this.setData({ showEditModal: false })
        this.loadPedigree(this.data.petId)
        showSuccess('保存成功')
      } else {
        throw new Error(result && result.message ? result.message : '保存失败')
      }
    } catch (error) {
      console.error('保存失败:', error)
      // 回退到本地保存
      const payload = {
        id: this.data.petId,
        name: form.name,
        category: form.category,
        gender: form.gender,
        alias: form.alias,
        price: form.price,
        father: form.father,
        fatherName: form.fatherName,
        mother: form.mother,
        motherName: form.motherName,
        partner: form.partner,
        partnerName: form.partnerName,
        status: form.status,
        isPublic: form.isPublic,
        photos: this.data.editPhotoList || []
      }
      this._updateLocalPetCache(payload)
      await this.setPetData(payload)
      this.setData({ showEditModal: false })
      this.loadPedigree(this.data.petId)
      showSuccess('已保存到本地')
    } finally {
      this.setData({ photoUploading: false })
    }
  },

  _updateLocalPetCache: function (petData) {
    try {
      const pets = wx.getStorageSync('pets') || []
      const idx = pets.findIndex(p => (p.id || p._id) === petData.id)
      if (idx >= 0) {
        pets[idx] = { ...pets[idx], ...petData }
      } else {
        pets.unshift({ ...petData, id: petData.id })
      }
      wx.setStorageSync('pets', sanitizePetPhotos(pets))
    } catch (err) {
      console.error('更新本地缓存失败:', err)
    }
  },

  // ===== 删除 =====

  showDeleteConfirm: function () {
    this.setData({ showDeleteConfirm: true })
  },

  hideDeleteConfirm: function () {
    this.setData({ showDeleteConfirm: false })
  },

  confirmDelete: async function () {
    const app = getApp()
    if (!app.requireLogin()) return

    const petId = this.data.petId
    if (!petId) return
    try {
      const confirmed = await showConfirm('删除宠物', '确定要删除此宠物吗？相关记录与提醒也会一并清理。')
      if (!confirmed) {
        this.setData({ showDeleteConfirm: false })
        return
      }
    } catch (e) {}

    try {
      const result = await API.deletePet(petId)
      if (!result || !result.success) {

      }
    } catch (err) {

    }

    // 本地删除，同时放入回收站
    try {
      const allPets = wx.getStorageSync('pets') || []
      const deletedPet = allPets.find(p => (p.id || p._id) === petId)
      const pets = allPets.filter(p => (p.id || p._id) !== petId)
      wx.setStorageSync('pets', sanitizePetPhotos(pets))

      const records = (wx.getStorageSync('records') || []).filter(r => r.petId !== petId)
      wx.setStorageSync('records', records)

      // 放入回收站
      if (deletedPet) {
        let recycleBin = wx.getStorageSync('recycleBin') || []
        deletedPet.deleteTime = this._formatDateTime(new Date())
        recycleBin.unshift(deletedPet)
        if (recycleBin.length > 50) {
          recycleBin = recycleBin.slice(0, 50)
        }
        wx.setStorageSync('recycleBin', recycleBin)
      }
    } catch (err) {
      console.error('本地删除失败:', err)
    }

    this.setData({ showDeleteConfirm: false })
    showSuccess('已删除')
    setTimeout(() => {
      wx.navigateBack()
    }, 600)
  },

  // ============================================================
  // 记录（事件）加载 / 管理
  // ============================================================

  loadRecords: async function (petId) {
    if (!petId) return
    try {
      const result = await API.getRecordList(petId)
      if (result && result.success) {
        let list = Array.isArray(result.data) ? result.data : (result.data && Array.isArray(result.data.list) ? result.data.list : [])
        list = this.sortRecords(list)
        this.setData({ records: list })
        this.filterAndGroupRecords(list)
        // 同步本地缓存
        wx.setStorageSync('records', list)
      } else {
        this.loadLocalRecords(petId)
      }
    } catch (error) {
      console.error('加载记录失败:', error)
      this.loadLocalRecords(petId)
    }
  },

  loadLocalRecords: function (petId) {
    try {
      const all = wx.getStorageSync('records') || []
      const list = all.filter(r => r.petId === petId)
      const sorted = this.sortRecords(list)
      this.setData({ records: sorted })
      this.filterAndGroupRecords(sorted)
    } catch (error) {
      console.error('加载本地记录失败:', error)
    }
  },

  sortRecords: function (records) {
    if (!records || records.length === 0) return []
    return [...records].sort((a, b) => {
      const da = (a.date || '') + ' ' + (a.time || '')
      const db = (b.date || '') + ' ' + (b.time || '')
      if (da < db) return 1
      if (da > db) return -1
      return 0
    })
  },

  // ========== 事件 Tab ==========

  setEventTab: function (e) {
    const tab = e.currentTarget.dataset.tab
    if (!tab) return
    this.setData({ currentEventTab: tab })
    this.filterAndGroupRecords(this.data.records)
  },

  filterAndGroupRecords: function (records) {
    const tab = this.data.currentEventTab
    const start = this.data.selectedDate
    const end = this.data.endDate

    let filtered = records || []
    if (tab && tab !== '全部事件') {
      filtered = filtered.filter(r => r.type === tab)
    }
    if (start) {
      filtered = filtered.filter(r => r.date >= start)
    }
    if (end) {
      filtered = filtered.filter(r => r.date <= end)
    }

    // 分组（按日期）
    const byDate = {}
    filtered.forEach(r => {
      if (!byDate[r.date]) byDate[r.date] = []
      byDate[r.date].push(r)
    })
    const grouped = Object.keys(byDate)
      .sort((a, b) => (a < b ? 1 : -1))
      .map(date => ({
        date,
        count: byDate[date].length,
        records: byDate[date].sort((a, b) => ((a.time || '') < (b.time || '') ? 1 : -1))
      }))

    const decorated = this.decorateTimelineRecords(filtered)

    // 构建换公列表（母龟的交配公龟，去重，按时间倒序）
    this.buildMateMaleList(records)

    this.setData({
      filteredRecords: decorated,
      groupedRecords: grouped
    })
  },

  // 构建换公记录列表
  buildMateMaleList: function (records) {
    const pet = this.data.pet || {}
    if (pet.gender !== '母') {
      this.setData({ mateMaleList: [] })
      return
    }

    // 提取所有交配记录，按时间倒序
    const mateRecords = (records || [])
      .filter(r => r.type === '交配' && r.partnerId)
      .sort((a, b) => {
        const da = (a.date || '') + ' ' + (a.time || '')
        const db = (b.date || '') + ' ' + (b.time || '')
        return da < db ? 1 : -1
      })

    // 去重：同一公龟只保留最新一次
    const seen = new Set()
    const uniqueMales = []
    mateRecords.forEach(r => {
      if (!seen.has(r.partnerId)) {
        seen.add(r.partnerId)
        uniqueMales.push({
          partnerId: r.partnerId,
          partnerName: r.partnerName || '未知',
          date: r.date,
          time: r.time
        })
      }
    })

    // 从本地缓存获取公龟照片
    const localPets = wx.getStorageSync('pets') || []
    const photoMap = {}
    localPets.forEach(p => {
      const pid = p.id || p._id
      if (pid && p.photos && p.photos.length) {
        photoMap[pid] = p.photos[0]
        if (p.id && p._id && p.id !== p._id) {
          photoMap[p._id] = p.photos[0]
          photoMap[p.id] = p.photos[0]
        }
      }
    })

    const mateMaleList = uniqueMales.map((m, index) => ({
      ...m,
      photo: photoMap[m.partnerId] || '',
      isLatest: index === 0
    }))

    this.setData({ mateMaleList })
  },

  decorateTimelineRecords: function (records) {
    const pet = this.data.pet || {}
    const petCover = pet.photos && pet.photos.length ? pet.photos[0] : ''
    // 构建配对对象照片索引（用 id 和 _id 双重匹配）
    const localPets = wx.getStorageSync('pets') || []
    const partnerPhotoMap = {}
    localPets.forEach(p => {
      const pid = p.id || p._id
      if (pid) {
        // photos 可能是 cloud:// ID 或已转换的 URL，直接取第一张
        const photo = (p.photos && p.photos.length) ? p.photos[0] : ''
        partnerPhotoMap[pid] = photo
        // 同时用 _id 和 id 互为 key，确保匹配
        if (p.id && p._id && p.id !== p._id) {
          partnerPhotoMap[p._id] = photo
          partnerPhotoMap[p.id] = photo
        }
      }
    })
    let lastYear = ''

    return (records || []).map((record) => {
      const date = record.date || ''
      const dateParts = date.split('-')
      const year = dateParts[0] || '未知'
      const displayDate = dateParts.length >= 3 ? `${dateParts[1]}-${dateParts[2]}` : (date || '')
      const recordPhotos = record.photos || record.images || []
      // 交配记录优先显示配对对象的图片
      let coverImage = ''
      if (record.type === '交配' && record.partnerId) {
        coverImage = partnerPhotoMap[record.partnerId] || ''
      }
      // 其次用记录自带的照片
      if (!coverImage) {
        coverImage = (Array.isArray(recordPhotos) && recordPhotos.length ? recordPhotos[0] : '') || record.photo || record.image || ''
      }
      // 最后回退到当前宠物封面
      if (!coverImage) {
        coverImage = petCover
      }
      const displayText = record.text || (record.type === '建档' ? '宠物档案已创建' : `${record.type || '事件'}记录`)
      const showYear = year !== lastYear
      lastYear = year

      return {
        ...record,
        displayYear: year,
        displayDate,
        displayText,
        coverImage,
        showYear,
        recordIcon: this.getRecordIcon(record.type)
      }
    })
  },

  onDateChange: function (e) {
    this.setData({ selectedDate: e.detail.value || '' })
    this.filterAndGroupRecords(this.data.records)
  },

  onEndDateChange: function (e) {
    this.setData({ endDate: e.detail.value || '' })
    this.filterAndGroupRecords(this.data.records)
  },

  clearDateFilter: function () {
    this.setData({ selectedDate: '', endDate: '' })
    this.filterAndGroupRecords(this.data.records)
  },

  toggleEventCollapsed: function () {
    this.setData({ eventCollapsed: !this.data.eventCollapsed })
  },

  expandTimeline: function () {
    this.filterAndGroupRecords(this.data.records)
    this.setData({ showTimelineModal: true })
  },

  hideTimelineModal: function () {
    this.setData({ showTimelineModal: false })
  },

  // 获取记录类型图标
  getRecordIcon: function (type) {
    const iconMap = {
      '建档': '📁',
      '交配': '💕',
      '产蛋': '🥚',
      '出苗': '🐣',
      '健康': '💊'
    }
    return iconMap[type] || '📝'
  },

  // 长按事件卡片
  onEventCardLongPress: function (e) {
    const recordId = e.currentTarget.dataset.id
    const record = this.data.records.find(r => (r.id || r._id) === recordId)
    
    if (!record) return
    
    // 建档记录不允许删除
    if (record.type === '建档') {
      wx.showToast({ title: '建档记录不允许删除', icon: 'none' })
      return
    }
    
    wx.showActionSheet({
      itemList: ['删除记录'],
      itemColor: '#E76F51',
      success: (res) => {
        if (res.tapIndex === 0) {
          // 调用删除记录函数
          this.deleteRecord(e)
        }
      }
    })
  },

  // 删除记录
  deleteRecord: function (e) {
    const recordId = e.currentTarget.dataset.id
    const record = this.data.records.find(r => (r.id || r._id) === recordId)
    if (!record) return
    
    // 建档记录不允许删除
    if (record.type === '建档') {
      wx.showToast({ title: '建档记录不允许删除', icon: 'none' })
      return
    }
    
    wx.showModal({
      title: '确认删除',
      content: `确定删除「${record.type}」记录吗？`,
      confirmColor: '#E76F51',
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({ title: '删除中...' })
            await API.deleteRecord(recordId)
            
            // 从本地数据中移除
            const newRecords = this.data.records.filter(r => (r.id || r._id) !== recordId)
            const sorted = this.sortRecords(newRecords)
            this.setData({ records: sorted })
            
            // 更新筛选后的记录和时间线分组
            this.filterAndGroupRecords(sorted)
            
            // 同步本地缓存
            wx.setStorageSync('records', sorted)
            
            wx.hideLoading()
            wx.showToast({ title: '删除成功', icon: 'success' })
          } catch (error) {
            wx.hideLoading()
            console.error('删除记录失败:', error)
            wx.showToast({ title: '删除失败', icon: 'none' })
          }
        }
      }
    })
  },

  // ========== 新增 / 查看记录 ==========

  addRecord: function () {
    const app = getApp()
    if (!app.requireLogin()) return

    // 根据性别过滤记录类型：公龟不能添加产蛋/出苗
    const gender = (this.data.pet && this.data.pet.gender) || ''
    const femaleOnlyTypes = ['产蛋', '出苗']
    const addRecordTypes = gender === '母'
      ? this.data.addRecordTypes
      : this.data.addRecordTypes.filter(t => !femaleOnlyTypes.includes(t))

    this.setData({
      showAddRecordModal: true,
      addRecordTypes: addRecordTypes,
      newRecord: { type: addRecordTypes[0] || '交配', text: '', eggCount: '', fertilizedCount: '', hatchCount: '', gradeACount: '', defectCount: '' },
      recordPartner: null,
      currentVoiceField: '',
      isRecording: false
    })
  },

  hideAddRecordModal: function () {
    this.setData({ showAddRecordModal: false })
  },

  selectRecordType: function (e) {
    const type = e.currentTarget.dataset.type
    if (!type) return
    this.setData({ 'newRecord.type': type })
  },

  onRecordTextInput: function (e) {
    this.setData({ 'newRecord.text': e.detail.value })
  },

  onEggCountInput: function (e) {
    this.setData({ 'newRecord.eggCount': e.detail.value })
    this._updateEggRate()
  },

  onFertilizedCountInput: function (e) {
    this.setData({ 'newRecord.fertilizedCount': e.detail.value })
    this._updateEggRate()
  },

  onHatchCountInput: function (e) {
    this.setData({ 'newRecord.hatchCount': e.detail.value })
    this._updateGradeRate()
  },

  onGradeAInput: function (e) {
    this.setData({ 'newRecord.gradeACount': e.detail.value })
    this._updateGradeRate()
  },

  onDefectInput: function (e) {
    this.setData({ 'newRecord.defectCount': e.detail.value })
  },

  _updateEggRate: function () {
    const egg = parseInt(this.data.newRecord.eggCount) || 0
    const fert = parseInt(this.data.newRecord.fertilizedCount) || 0
    if (egg > 0) {
      const rate = Math.round(fert / egg * 100)
      this.setData({ eggRateText: rate + '%', eggRateLow: rate < 50 })
    } else {
      this.setData({ eggRateText: '0%', eggRateLow: false })
    }
  },

  _updateGradeRate: function () {
    const hatch = parseInt(this.data.newRecord.hatchCount) || 0
    const gradeA = parseInt(this.data.newRecord.gradeACount) || 0
    if (hatch > 0) {
      const rate = Math.round(gradeA / hatch * 100)
      this.setData({ gradeRateText: rate + '%', gradeRateLow: rate < 50 })
    } else {
      this.setData({ gradeRateText: '0%', gradeRateLow: false })
    }
  },

  confirmAddRecord: async function () {
    // 防止打印已触发保存时的重复保存
    if (this.data._isSavingRecord) return
    this.setData({ _isSavingRecord: true })

    const record = this.data.newRecord
    // 产蛋记录允许内容为空（必须有产蛋数据）
    if (!record.text && record.type !== '产蛋' && record.type !== '出苗') {
      showError('请输入记录内容')
      this.setData({ _isSavingRecord: false })
      return
    }
    const now = new Date()
    const payload = {
      petId: this.data.petId,
      type: record.type,
      text: record.text,
      date: this._formatDate(now),
      time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    }
    // 产蛋记录追加产蛋数据
    if (record.type === '产蛋') {
      payload.eggCount = parseInt(record.eggCount) || 0
      payload.fertilizedCount = parseInt(record.fertilizedCount) || 0
    }
    // 出苗记录追加出苗数据
    if (record.type === '出苗') {
      payload.hatchCount = parseInt(record.hatchCount) || 0
      payload.gradeACount = parseInt(record.gradeACount) || 0
      payload.defectCount = parseInt(record.defectCount) || 0
    }
    // 交配记录关联配对对象
    if (record.type === '交配') {
      const rp = this.data.recordPartner
      if (rp) {
        payload.partnerId = rp.id
        payload.partnerName = rp.alias || rp.name
      } else {
        const pet = this.data.pet || {}
        if (pet.partner) {
          payload.partnerId = pet.partner
          payload.partnerName = pet.partnerName || ''
        }
      }
    }

    try {
      console.log('[addRecord] payload:', JSON.stringify(payload))
      const result = await API.createRecord(payload)
      console.log('[addRecord] result:', JSON.stringify(result))
      if (result && result.success) {
        const recordId = (result.data && (result.data.id || result.data._id)) || Date.now().toString()
        const newRecords = [{ ...payload, id: recordId }, ...this.data.records]
        const sorted = this.sortRecords(newRecords)
        this.setData({ records: sorted })
        this.filterAndGroupRecords(sorted)
        wx.setStorageSync('records', sorted)
        this.setData({ showAddRecordModal: false, _isSavingRecord: false })
        // 交配记录保存后更新当前配对为最新
        if (record.type === '交配' && payload.partnerId) {
          this._updateLatestPartner(payload.partnerId, payload.partnerName)
        }
        showSuccess('记录已添加')
        return
      }
      throw new Error(result && result.message ? result.message : '云端保存失败')
    } catch (err) {
      console.error('云端保存记录失败:', err.message || err)
      wx.hideLoading()
      // 本地回退
      const recordId = Date.now().toString()
      const newRecords = [{ ...payload, id: recordId }, ...this.data.records]
      const sorted = this.sortRecords(newRecords)
      this.setData({ records: sorted })
      this.filterAndGroupRecords(sorted)
      wx.setStorageSync('records', sorted)
      this.setData({ showAddRecordModal: false, _isSavingRecord: false })
      // 交配记录本地回退也更新配对
      if (record.type === '交配' && payload.partnerId) {
        this._updateLatestPartner(payload.partnerId, payload.partnerName)
      }
      showSuccess('云端保存失败，已存本地')
    }
  },

  // 更新当前配对为最新（本地+云端）
  _updateLatestPartner: function (partnerId, partnerName) {
    const petId = this.data.petId
    // 更新本地显示
    this.setData({
      'pet.partner': partnerId,
      'pet.partnerName': partnerName
    })
    // 更新本地存储
    try {
      const pets = wx.getStorageSync('pets') || []
      const idx = pets.findIndex(p => (p.id || p._id) === petId)
      if (idx >= 0) {
        pets[idx].partner = partnerId
        pets[idx].partnerName = partnerName
        wx.setStorageSync('pets', pets)
      }
    } catch (err) {}
    // 静默更新云端
    API.updatePet({ id: petId, partner: partnerId, partnerName: partnerName || '' })
      .catch(err => console.error('更新配对字段失败:', err.message))
  },

  showRecordDetail: function (e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    const record = this.data.records.find(r => (r.id || r._id) === id)
    if (!record) return
    const detailRecord = { ...record, recordIcon: this.getRecordIcon(record.type) }
    // 产蛋记录预计算受精率
    if (detailRecord.type === '产蛋' && detailRecord.eggCount > 0) {
      const rate = Math.round((parseInt(detailRecord.fertilizedCount) || 0) / parseInt(detailRecord.eggCount) * 100)
      detailRecord.eggRateText = rate + '%'
      detailRecord.eggRateLow = rate < 50
    }
    // 出苗记录预计算全品率
    if (detailRecord.type === '出苗' && detailRecord.hatchCount > 0) {
      const rate = Math.round((parseInt(detailRecord.gradeACount) || 0) / parseInt(detailRecord.hatchCount) * 100)
      detailRecord.gradeRateText = rate + '%'
    }
    this.setData({
      currentRecord: detailRecord,
      showRecordModal: true
    })
  },

  hideRecordModal: function () {
    this.setData({ showRecordModal: false, currentRecord: null })
  },

  // 预览记录照片
  previewRecordPhoto: function (e) {
    const url = e.currentTarget.dataset.url
    const photos = (this.data.currentRecord && this.data.currentRecord.photos) || []
    if (url && photos.length > 0) {
      wx.previewImage({ current: url, urls: photos })
    }
  },

  // ============================================================
  // 打印
  // ============================================================

  // 打印记录标签（40×20mm：左二维码 + 右侧宠物名/类型内容/时间，带缓存 + 调试）
  printRecord: async function () {
    const debug = []
    debug.push('✅ 步骤1: 进入打印流程')

    if (!this.data.printerConfig.enabled || !this.data.printerConfig.connected) {
      debug.push('❌ 步骤1: 打印机未启用或未连接')
      debug.push('  enabled=' + this.data.printerConfig.enabled + ' connected=' + this.data.printerConfig.connected)
      showError('请先连接打印机')
      return
    }

    const record = this.data.currentRecord
    if (!record) {
      debug.push('❌ 步骤1: currentRecord 为空')
      showError('记录数据异常')
      return
    }
    debug.push('  record.id=' + record.id + ' record.text=' + (record.text || '').substring(0, 20))

    // 1. 获取 urlLink（优先缓存）
    let urlLink = record.urlLink || ''

    // 清除旧版坏缓存（petId=xxx 格式的 fallback）
    if (urlLink && urlLink.indexOf('petId=') === 0 && urlLink.indexOf('https://') === -1) {
      debug.push('⚠️ 步骤2: 检测到旧版坏缓存，清除: ' + urlLink.substring(0, 30))
      urlLink = ''
    }
    debug.push('✅ 步骤2: urlLink 缓存=' + (urlLink ? ('已命中(' + urlLink.substring(0, 40) + '...)') : '未命中'))

    if (!urlLink) {
      debug.push('✅ 步骤3: 静默调用云函数 qrcode.generateUrlLink')
      try {
        debug.push('  请求参数: petId=' + this.data.petId + ' recordId=' + record.id)
        const qrResult = await API.callCloudFunction('qrcode', 'generateUrlLink', {
          petId: this.data.petId,
          recordId: record.id
        })
        debug.push('  云函数返回: ' + JSON.stringify(qrResult).substring(0, 200))
        if (!qrResult.success) {
          debug.push('❌ 步骤3: 云函数返回 success=false')
          urlLink = 'wxapp://pet/' + this.data.petId.substring(0, 8) + '/' + record.id.substring(0, 8)
        } else {
          urlLink = qrResult.data.urlLink
          debug.push('✅ 步骤3: urlLink=' + (urlLink || '').substring(0, 60))
        }
        if (qrResult.success && urlLink && urlLink.indexOf('https://') === 0) {
          this._saveQrCache(record.id, '', urlLink)
        }
      } catch (e) {
        debug.push('❌ 步骤3: 云函数调用异常: ' + (e.message || ''))
        urlLink = 'wxapp://pet/' + this.data.petId.substring(0, 8) + '/' + record.id.substring(0, 8)
      }
    }

    // 2. 打印二维码标签（LPAPI 支持 draw2DQRCode）
    wx.showLoading({ title: '打印中...' })
    debug.push('✅ 步骤4: 打印二维码标签')
    debug.push('  最终 urlLink=' + urlLink.substring(0, 60))
    // this._showDebug(debug)  // 调试弹窗已屏蔽
    this._printLabel(urlLink, record)
  },

  // 显示调试弹窗
  _showDebug: function (steps) {
    this.setData({
      showPrintDebugModal: true,
      printDebugSteps: steps
    })
  },

  hidePrintDebugModal: function () {
    this.setData({ showPrintDebugModal: false, printDebugSteps: [] })
  },

  // 打印标签（40×20mm：左侧二维码 + 右侧宠物名/类型内容/时间）
  _printLabel: function (urlLink, record) {
    wx.showLoading({ title: '打印中...' })
    try {
      const api = this.lpapi
      const result = api.startJob({ width: 40, height: 20, jobName: 'event-label', gapType: 2 })
      if (!result) { wx.hideLoading(); showError('创建打印任务失败'); return }

      const pet = this.data.pet || {}
      // 智能截断：优先显示别名，过长时只显示别名
      let nameLine = ''
      if (pet.alias && pet.name && pet.alias !== pet.name) {
        nameLine = pet.alias + '(' + pet.name + ')'
      } else {
        nameLine = pet.name || pet.alias || ''
      }
      if (nameLine.length > 10) {
        nameLine = pet.alias || pet.name || ''
        if (nameLine.length > 10) nameLine = nameLine.substring(0, 9) + '…'
      }

      // 类型 emoji + 类型名 + 内容（截断适配右侧宽度）
      const typeIcons = { '建档': '📁', '交配': '💕', '产蛋': '🥚', '出苗': '🐣', '健康': '💊' }
      const typeMap = { '交配': 'jiaopei', '产蛋': 'chandan', '出苗': 'chumiao', '健康': 'jiankang' }
      const icon = typeIcons[record.type] || '📝'
      const typeKey = typeMap[record.type]
      let detail = (record.text || '').substring(0, 18)
      if ((record.text || '').length > 18) detail += '…'
      const typeLine = (icon + (record.type || '') + '·' + detail).substring(0, 22)

      const timeLine = (record.date || '') + ' ' + (record.time || '')

      // ---- 左侧：二维码 ----
      // 根据配置判断是否打印二维码
      const qrPrintTypes = this.data.printerConfig.qrPrintTypes || {}
      const shouldPrintQr = typeKey ? (qrPrintTypes[typeKey] !== false) : true
      if (urlLink && shouldPrintQr) {
        api.draw2DQRCode({ text: urlLink, x: 1, y: 2, width: 16 })
      }

      // ---- 右侧：信息行 ----
      // 第1行：宠物名称(别名) y=1, 较大字体
      api.drawText({ text: nameLine, fontHeight: 3.5, x: 19, y: 1, width: 19, height: 4 })

      // 产蛋记录：4行布局（名称 / 产蛋数据 / 内容 / 时间）
      if (record.type === '产蛋' && record.eggCount > 0) {
        const rate = Math.round((parseInt(record.fertilizedCount) || 0) / parseInt(record.eggCount) * 100)
        const eggLine = '🥚产蛋 ' + record.eggCount + '-' + (record.fertilizedCount || 0) + '枚 ' + rate + '%'
        api.drawText({ text: eggLine.substring(0, 22), fontHeight: 2.5, x: 19, y: 5.5, width: 19, height: 3 })
        if (detail) {
          api.drawText({ text: detail, fontHeight: 2, x: 19, y: 9.5, width: 19, height: 3 })
        }
        api.drawText({ text: timeLine.trim(), fontHeight: 2, x: 19, y: detail ? 13.5 : 9.5, width: 19, height: 3 })
      } else if (record.type === '出苗' && record.hatchCount > 0) {
        // 出苗记录：4行布局（名称 / 出苗数据 / 内容 / 时间）
        const gradeRate = Math.round((parseInt(record.gradeACount) || 0) / parseInt(record.hatchCount) * 100)
        const hatchLine = '🐣出苗 ' + record.hatchCount + '只 全品' + (record.gradeACount || 0) + ' ' + gradeRate + '%'
        api.drawText({ text: hatchLine.substring(0, 22), fontHeight: 2.5, x: 19, y: 5.5, width: 19, height: 3 })
        if (detail) {
          api.drawText({ text: detail, fontHeight: 2, x: 19, y: 9.5, width: 19, height: 3 })
        }
        api.drawText({ text: timeLine.trim(), fontHeight: 2, x: 19, y: detail ? 13.5 : 9.5, width: 19, height: 3 })
      } else {
        // 普通记录：3行布局
        api.drawText({ text: typeLine, fontHeight: 2.5, x: 19, y: 5.5, width: 19, height: 8 })
        api.drawText({ text: timeLine.trim(), fontHeight: 2, x: 19, y: 16, width: 19, height: 3 })
      }

      api.commitJob().then(res => {
        wx.hideLoading()
        res.statusCode === 0 ? showSuccess('打印成功') : showError('打印失败')
      }).catch(() => { wx.hideLoading(); showError('打印失败') })
    } catch (err) {
      wx.hideLoading()
      console.error('打印异常:', err)
      showError('打印失败')
    }
  },

  // 保存 urlLink 缓存（只存链接文本，QR 图按需客户端生成）
  _saveQrCache: function (recordId, qrBase64, urlLink) {
    // 更新本地 records 中的缓存
    const records = this.data.records.map(r => {
      if (r.id === recordId) {
        return { ...r, urlLink: urlLink }
      }
      return r
    })
    this.setData({ records: records })
    wx.setStorageSync('records', records)

    // 更新 currentRecord 的缓存
    if (this.data.currentRecord && this.data.currentRecord.id === recordId) {
      this.setData({
        currentRecord: { ...this.data.currentRecord, urlLink: urlLink }
      })
    }

    // 异步更新云端记录（静默，不阻塞）
    if (urlLink) {
      API.callCloudFunction('record', 'updateQrBase64', {
        id: recordId,
        qrBase64: '',
        urlLink: urlLink
      }).catch(() => {

      })
    }
  },

  // 打印新记录（先保存再打印，40×20mm 标签，左二维码右文字）
  printNewRecord: async function () {
    if (!this.data.printerConfig.enabled || !this.data.printerConfig.connected) {
      showError('请先连接打印机')
      return
    }
    if (!this.data.newRecord || (!this.data.newRecord.text && this.data.newRecord.type !== '产蛋' && this.data.newRecord.type !== '出苗')) {
      showError('记录内容为空')
      return
    }
    // 防止重复保存
    if (this.data._isSavingRecord) return
    this.setData({ _isSavingRecord: true })

    const record = this.data.newRecord
    const now = new Date()
    const dateStr = this._formatDate(now)
    const timeStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0')

    const payload = {
      petId: this.data.petId,
      type: record.type,
      text: record.text,
      date: dateStr,
      time: timeStr
    }
    if (record.type === '产蛋') {
      payload.eggCount = parseInt(record.eggCount) || 0
      payload.fertilizedCount = parseInt(record.fertilizedCount) || 0
    }
    if (record.type === '出苗') {
      payload.hatchCount = parseInt(record.hatchCount) || 0
      payload.gradeACount = parseInt(record.gradeACount) || 0
      payload.defectCount = parseInt(record.defectCount) || 0
    }
    // 交配记录关联配对对象
    if (record.type === '交配') {
      const rp = this.data.recordPartner
      if (rp) {
        payload.partnerId = rp.id
        payload.partnerName = rp.alias || rp.name
      } else {
        const pet = this.data.pet || {}
        if (pet.partner) {
          payload.partnerId = pet.partner
          payload.partnerName = pet.partnerName || ''
        }
      }
    }

    // 1. 先保存记录到云端
    wx.showLoading({ title: '保存记录...' })
    let recordId
    try {
      const saveResult = await API.createRecord(payload)
      if (!saveResult || !saveResult.success) {
        wx.hideLoading()
        showError(saveResult.message || '保存记录失败')
        this.setData({ _isSavingRecord: false })
        return
      }
      recordId = (saveResult.data && (saveResult.data.id || saveResult.data._id)) || Date.now().toString()
      payload.id = recordId

      // 更新本地记录列表
      const newRecords = [{ ...payload, id: recordId }, ...this.data.records]
      const sorted = this.sortRecords(newRecords)
      this.setData({ records: sorted })
      this.filterAndGroupRecords(sorted)
      wx.setStorageSync('records', sorted)
      // 交配记录保存后更新当前配对为最新
      if (record.type === '交配' && payload.partnerId) {
        this._updateLatestPartner(payload.partnerId, payload.partnerName)
      }
    } catch (err) {
      console.error('打印-保存记录失败:', err.message || err)
      wx.hideLoading()
      // 本地回退
      const recordId = Date.now().toString()
      const newRecords = [{ ...payload, id: recordId }, ...this.data.records]
      const sorted = this.sortRecords(newRecords)
      this.setData({ records: sorted })
      this.filterAndGroupRecords(sorted)
      wx.setStorageSync('records', sorted)
      // 交配记录本地回退也更新配对
      if (record.type === '交配' && payload.partnerId) {
        this._updateLatestPartner(payload.partnerId, payload.partnerName)
      }
      this.setData({ _isSavingRecord: false })
      showError('保存失败: ' + (err.message || '请检查云函数部署'))
      return
    }

    // 2. 获取 urlLink（静默后台，不弹 loading）
    let urlLink = ''
    try {
      const qrResult = await API.callCloudFunction('qrcode', 'generateUrlLink', {
        petId: this.data.petId,
        recordId: recordId
      })
      if (qrResult.success && qrResult.data && qrResult.data.urlLink) {
        urlLink = qrResult.data.urlLink
      }
    } catch { /* ignore */ }
    if (!urlLink) {
      urlLink = 'wxapp://pet/' + this.data.petId.substring(0, 8) + '/' + recordId.substring(0, 8)
    }

    // 2.5 保存 urlLink 缓存（仅缓存真实 HTTPS 链接）
    if (urlLink.indexOf('https://') === 0) {
      this._saveQrCache(recordId, '', urlLink)
    }

    // 3. 打印标签（40×20mm：左侧二维码 + 右侧宠物名/类型内容/时间）
    wx.showLoading({ title: '打印中...' })
    try {
      const api = this.lpapi
      const startResult = api.startJob({ width: 40, height: 20, jobName: 'new-record-label', gapType: 2 })
      if (!startResult) { wx.hideLoading(); showError('创建打印任务失败'); this.setData({ showAddRecordModal: false, _isSavingRecord: false }); return }

      const pet = this.data.pet || {}
      let nameLine = ''
      if (pet.alias && pet.name && pet.alias !== pet.name) {
        nameLine = pet.alias + '(' + pet.name + ')'
      } else {
        nameLine = pet.name || pet.alias || ''
      }
      if (nameLine.length > 10) {
        nameLine = pet.alias || pet.name || ''
        if (nameLine.length > 10) nameLine = nameLine.substring(0, 9) + '…'
      }

      const typeIcons = { '建档': '📁', '交配': '💕', '产蛋': '🥚', '出苗': '🐣', '健康': '💊' }
      const typeMap = { '交配': 'jiaopei', '产蛋': 'chandan', '出苗': 'chumiao', '健康': 'jiankang' }
      const icon = typeIcons[payload.type] || '📝'
      const typeKey = typeMap[payload.type]
      let detail = (payload.text || '').substring(0, 18)
      if ((payload.text || '').length > 18) detail += '…'
      const typeLine = (icon + (payload.type || '') + '·' + detail).substring(0, 22)

      const timeLine = dateStr + ' ' + timeStr

      // 左侧：二维码（根据配置判断是否打印）
      const qrPrintTypes = this.data.printerConfig.qrPrintTypes || {}
      const shouldPrintQr = typeKey ? (qrPrintTypes[typeKey] !== false) : true
      if (urlLink && shouldPrintQr) {
        api.draw2DQRCode({ text: urlLink, x: 1, y: 2, width: 16 })
      }

      // 右侧：信息行
      api.drawText({ text: nameLine, fontHeight: 3.5, x: 19, y: 1, width: 19, height: 4 })

      // 产蛋记录：4行布局
      if (payload.type === '产蛋' && payload.eggCount > 0) {
        const rate = Math.round((parseInt(payload.fertilizedCount) || 0) / parseInt(payload.eggCount) * 100)
        const eggLine = '🥚产蛋 ' + payload.eggCount + '-' + (payload.fertilizedCount || 0) + '枚 ' + rate + '%'
        api.drawText({ text: eggLine.substring(0, 22), fontHeight: 2.5, x: 19, y: 5.5, width: 19, height: 3 })
        if (detail) {
          api.drawText({ text: detail, fontHeight: 2, x: 19, y: 9.5, width: 19, height: 3 })
        }
        api.drawText({ text: timeLine.trim(), fontHeight: 2, x: 19, y: detail ? 13.5 : 9.5, width: 19, height: 3 })
      } else if (payload.type === '出苗' && payload.hatchCount > 0) {
        // 出苗记录：4行布局
        const gradeRate = Math.round((parseInt(payload.gradeACount) || 0) / parseInt(payload.hatchCount) * 100)
        const hatchLine = '🐣出苗 ' + payload.hatchCount + '只 全品' + (payload.gradeACount || 0) + ' ' + gradeRate + '%'
        api.drawText({ text: hatchLine.substring(0, 22), fontHeight: 2.5, x: 19, y: 5.5, width: 19, height: 3 })
        if (detail) {
          api.drawText({ text: detail, fontHeight: 2, x: 19, y: 9.5, width: 19, height: 3 })
        }
        api.drawText({ text: timeLine.trim(), fontHeight: 2, x: 19, y: detail ? 13.5 : 9.5, width: 19, height: 3 })
      } else {
        api.drawText({ text: typeLine, fontHeight: 2.5, x: 19, y: 5.5, width: 19, height: 8 })
        api.drawText({ text: timeLine, fontHeight: 2, x: 19, y: 16, width: 19, height: 3 })
      }

      api.commitJob().then(res => {
        wx.hideLoading()
        this.setData({ showAddRecordModal: false, _isSavingRecord: false })
        res.statusCode === 0 ? showSuccess('打印成功') : showError('打印失败')
      }).catch(() => {
        wx.hideLoading()
        showError('打印失败')
        this.setData({ showAddRecordModal: false, _isSavingRecord: false })
      })
    } catch (err) {
      wx.hideLoading()
      console.error('打印异常:', err)
      showError('打印失败')
      this.setData({ _isSavingRecord: false })
    }
  },

  // ============================================================
  // 语音输入（点击切换模式）
  // ============================================================

  toggleVoice: function (e) {
    const field = e.currentTarget.dataset.field || 'editName'
    console.log('[toggleVoice] 点击, field:', field, 'isRecording:', this.data.isRecording)
    if (this.data.isRecording) {
      // 已在录音 → 停止并识别
      voiceManager.stopRecording()
      this.setData({ isRecording: false, currentVoiceField: '' })
    } else {
      // 未在录音 → 开始录音
      this.setData({ currentVoiceField: field, isRecording: true })
      voiceManager.startRecording(field, (fieldName, text) => {
        if (fieldName === 'editName') {
          this.setData({ 'editForm.name': text })
        } else if (fieldName === 'editAlias') {
          this.setData({ 'editForm.alias': text })
        } else if (fieldName === 'recordText') {
          this.setData({ 'newRecord.text': text })
        }
        this.setData({ isRecording: false, currentVoiceField: '' })
      })
    }
  },

  cancelVoice: function () {
    if (!this.data.isRecording) return
    voiceManager.cancelRecording()
    this.setData({ isRecording: false, currentVoiceField: '' })
    wx.showToast({ title: '已取消', icon: 'none' })
  },

  // ============================================================
  // 家谱 / 谱系
  // ============================================================

  // 格式化日期时间
  _formatDateTime: function (date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hour = String(date.getHours()).padStart(2, '0')
    const minute = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day} ${hour}:${minute}`
  },

  // 添加最近浏览记录
  addToRecentViews: function (petId, options) {
    if (!petId) return

    try {
      let recentViews = wx.getStorageSync('recentViews') || []
      
      // 检查是否已存在该宠物的浏览记录
      const existIndex = recentViews.findIndex(item => item._id === petId)
      if (existIndex > -1) {
        // 如果已存在，移除旧的记录
        recentViews.splice(existIndex, 1)
      }

      // 获取宠物信息
      const pets = wx.getStorageSync('pets') || []
      let pet = pets.find(p => p._id === petId)
      
      // 如果是公开模式，尝试从公开数据获取
      let isPublic = false
      let userId = ''
      if (options && (options.isPublic === 'true' || options.isPublic === true)) {
        isPublic = true
        userId = options.userId || ''
      }

      // 构建浏览记录
      const viewRecord = {
        _id: petId,
        name: pet ? pet.name : '未命名',
        breed: pet ? pet.breed : '未知品种',
        photos: pet ? pet.photos : [],
        isPublic: isPublic,
        userId: userId,
        viewTime: this._formatDateTime(new Date())
      }

      // 添加到列表开头
      recentViews.unshift(viewRecord)
      
      // 只保留最近20条记录
      if (recentViews.length > 20) {
        recentViews = recentViews.slice(0, 20)
      }

      wx.setStorageSync('recentViews', recentViews)
    } catch (e) {
      console.error('添加最近浏览记录失败:', e)
    }
  },

  loadPedigree: async function (petId) {
    if (!petId) return
    try {
      const result = await API.getPedigree(petId, 3)
      if (result && result.success && result.data) {
        await this._setPedigreeData(result.data)
      } else {
        this._loadLocalPedigree(petId)
      }
    } catch (error) {
      console.error('加载谱系失败:', error)
      this._loadLocalPedigree(petId)
    }
  },

  _buildLocalPedigreeNode: function (pet, byId, depth = 0) {
    if (!pet || depth >= 3) return null
    const id = pet.id || pet._id
    const fatherPet = pet.father ? byId[pet.father] : null
    const motherPet = pet.mother ? byId[pet.mother] : null
    return {
      id,
      name: pet.name,
      alias: pet.alias,
      gender: pet.gender,
      photos: pet.photos ? pet.photos.slice(0, 1) : [],
      father: this._buildLocalPedigreeNode(fatherPet, byId, depth + 1),
      mother: this._buildLocalPedigreeNode(motherPet, byId, depth + 1)
    }
  },

  _loadLocalPedigree: async function (petId) {
    try {
      const pets = wx.getStorageSync('pets') || []
      const self = pets.find(p => (p.id || p._id) === petId)
      if (!self) return
      const byId = {}
      pets.forEach(p => { byId[p.id || p._id] = p })

      const father = self.father ? this._buildLocalPedigreeNode(byId[self.father], byId) : null
      const mother = self.mother ? this._buildLocalPedigreeNode(byId[self.mother], byId) : null

      await this._setPedigreeData({
        fullTree: { father, mother }
      })
    } catch (err) {
      console.error('加载本地谱系失败:', err)
    }
  },

  _convertPedigreePhotos: async function (node) {
    if (!node) return null
    const copy = { ...node }
    if (copy.photos && copy.photos.length) {
      try {
        copy.photos = await convertPhotoIdsToUrls(copy.photos.slice(0, 1))
      } catch (err) {}
    }
    if (copy.father) copy.father = await this._convertPedigreePhotos(copy.father)
    if (copy.mother) copy.mother = await this._convertPedigreePhotos(copy.mother)
    return copy
  },

  _setPedigreeData: async function (data) {
    let tree = (data && data.fullTree) || {}
    if (tree.father || tree.mother) {
      tree = {
        father: await this._convertPedigreePhotos(tree.father),
        mother: await this._convertPedigreePhotos(tree.mother)
      }
    }
    const hasGen1 = !!(tree.father || tree.mother)
    const hasGen2 = !!(
      (tree.father && (tree.father.father || tree.father.mother)) ||
      (tree.mother && (tree.mother.father || tree.mother.mother))
    )
    const hasGen3 = !!(
      (tree.father && tree.father.father && (tree.father.father.father || tree.father.father.mother)) ||
      (tree.father && tree.father.mother && (tree.father.mother.father || tree.father.mother.mother)) ||
      (tree.mother && tree.mother.father && (tree.mother.father.father || tree.mother.father.mother)) ||
      (tree.mother && tree.mother.mother && (tree.mother.mother.father || tree.mother.mother.mother))
    )

    // 统计
    const counters = { total: 0, male: 0, female: 0, depth: 0 }
    const countNodes = (node, depth) => {
      if (!node) return
      counters.total++
      if (node.gender === '公' || node.gender === '雄性') counters.male++
      else if (node.gender === '母' || node.gender === '雌性') counters.female++
      if (depth > counters.depth) counters.depth = depth
      countNodes(node.father, depth + 1)
      countNodes(node.mother, depth + 1)
    }
    countNodes(tree.father, 1)
    countNodes(tree.mother, 1)

    // 父系主线 / 母系主线（仅沿着同性血亲上溯）
    const buildLine = (node, targetGender, depth, acc) => {
      if (!node) return
      acc.push({
        id: node.id || node._id,
        name: node.name,
        alias: node.alias,
        category: node.category,
        photos: node.photos ? node.photos.slice(0, 1) : [],
        generation: depth
      })
      const next = targetGender === 'paternal' ? node.father : node.mother
      if (next) buildLine(next, targetGender, depth + 1, acc)
    }
    const paternal = []
    const maternal = []
    if (tree.father) buildLine(tree.father, 'paternal', 1, paternal)
    if (tree.mother) buildLine(tree.mother, 'maternal', 1, maternal)

    this.setData({
      pedigreeData: { fullTree: tree, hasGen1, hasGen2, hasGen3 },
      pedigreeStats: {
        totalAncestors: counters.total,
        maleCount: counters.male,
        femaleCount: counters.female,
        maxDepth: counters.depth
      },
      paternalLine: paternal,
      maternalLine: maternal
    })
  },

  togglePedigree: function () {
    this.setData({ showPedigree: !this.data.showPedigree })
  },

  switchBloodlineTab: function (e) {
    const tab = e.currentTarget.dataset.tab
    if (!tab) return
    this.setData({ bloodlineTab: tab })
  },

  viewAncestorDetail: function (e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    if (id === this.data.petId) return
    wx.navigateTo({
      url: '/pages/pet/detail?petId=' + id,
      fail: () => {
        wx.showToast({ title: '无法查看该祖先', icon: 'none' })
      }
    })
  },

  onFatherTreeTap: function () {
    const father = this.data.pedigreeData && this.data.pedigreeData.fullTree && this.data.pedigreeData.fullTree.father
    if (father && father.id) {
      this.viewAncestorDetail({ currentTarget: { dataset: { id: father.id } } })
      return
    }
    if (!this.data.isReadOnly) this.openFatherModal()
  },

  onMotherTreeTap: function () {
    const mother = this.data.pedigreeData && this.data.pedigreeData.fullTree && this.data.pedigreeData.fullTree.mother
    if (mother && mother.id) {
      this.viewAncestorDetail({ currentTarget: { dataset: { id: mother.id } } })
      return
    }
    if (!this.data.isReadOnly) this.openMotherModal()
  },

  // ============================================================
  // 提醒事件（重点：先云端后本地，CRUD 完整）
  // ============================================================

  loadReminders: async function (petId) {
    if (!petId) return
    try {
      const result = await API.getReminderList(petId)
      if (result && result.success) {
        const list = Array.isArray(result.data) ? result.data : (result.data && Array.isArray(result.data.list) ? result.data.list : [])
        this._setReminders(list)
      } else {
        this._setReminders([])
      }
    } catch (error) {
      console.error('加载提醒失败:', error)
      this._setReminders([])
    }
  },

  _setReminders: function (list) {
    const enriched = this._computeUpcomingReminders(list)
    this.setData({
      reminders: list || [],
      upcomingReminders: enriched.focused,
      allEnrichedReminders: enriched.all
    })
  },

  saveReminders: async function (newList) {
    const petId = this.data.petId
    const existing = Array.isArray(this.data.reminders) ? this.data.reminders : []
    const safeNewList = Array.isArray(newList) ? newList : []

    const existingIds = new Set(existing.map(r => String(r.id || r._id)))
    const newIds = new Set(safeNewList.map(r => String(r.id || r._id)))

    // 删除：在 existing 中不在 newList 中
    for (const r of existing) {
      const key = String(r.id || r._id)
      if (!newIds.has(key)) {
        try {
          if (API.deleteReminder) await API.deleteReminder(r.id || r._id)
        } catch (err) {

        }
      }
    }

    // 新增/更新
    for (const r of safeNewList) {
      const key = String(r.id || r._id)
      try {
        if (!existingIds.has(key)) {
          if (API.createReminder) {
            const payload = { ...r, petId }
            delete payload.id     // 新建时不传 id，让云端生成
            delete payload._id
            const res = await API.createReminder(payload)
            if (res && res.success && res.data && (res.data.id || res.data._id)) {
              r.id = res.data.id || res.data._id
            }
          }
        } else {
          if (API.updateReminder) {
            await API.updateReminder({ ...r, petId })
          }
        }
      } catch (err) {

      }
    }

    // 云端同步完成，刷新列表
    await this.loadReminders(petId)
    return true
  },

  // 安全解析 YYYY-MM-DD 格式日期（避免 new Date("YYYY-MM-DD") 在小程序中解析异常）
  _parseDateStr: function (dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return null
    const m = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
    if (!m) return null
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 0, 0, 0, 0)
  },

  _computeStatus: function (r) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = this._formatDate(today)
    let statusText
    let statusClass
    let daysLeft
    const interval = Number(r.intervalDays) || 1

    if (!r.lastDone) {
      // 从未执行过 → 从今天开始算 nextDue
      const nextDueFromToday = new Date(today)
      nextDueFromToday.setDate(nextDueFromToday.getDate() + interval)
      daysLeft = Math.round((nextDueFromToday.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))
      if (daysLeft < 0) {
        statusText = '超期 ' + Math.abs(daysLeft) + ' 天'
        statusClass = 'overdue'
      } else if (daysLeft === 0) {
        statusText = '今天'
        statusClass = 'today'
      } else if (daysLeft === 1) {
        statusText = '明天'
        statusClass = 'tomorrow'
      } else {
        statusText = daysLeft + ' 天后'
        statusClass = 'normal'
      }
    } else {
      const lastDone = this._parseDateStr(r.lastDone)
      if (!lastDone) {
        statusText = '数据异常'
        statusClass = 'overdue'
        daysLeft = -999
      } else {
        const nextDue = new Date(lastDone)
        nextDue.setDate(nextDue.getDate() + interval)
        const diffMs = nextDue.getTime() - today.getTime()
        daysLeft = Math.round(diffMs / (24 * 60 * 60 * 1000))
        const isJustDone = (r.lastDone === todayStr)

        if (daysLeft < 0) {
          statusText = '超期 ' + Math.abs(daysLeft) + ' 天'
          statusClass = 'overdue'
        } else if (daysLeft === 0) {
          statusText = isJustDone ? '已完成' : '今天'
          statusClass = 'today'
        } else if (daysLeft === 1) {
          statusText = isJustDone ? '已完成' : '明天'
          statusClass = 'tomorrow'
        } else {
          statusText = daysLeft + ' 天后'
          statusClass = 'normal'
        }
      }
    }

    // next due date：基于 lastDone + intervalDays 计算
    const baseDate = r.lastDone ? this._parseDateStr(r.lastDone) : new Date(today)
    const nextDueDate = new Date(baseDate || today)
    nextDueDate.setDate(nextDueDate.getDate() + interval)

    return {
      ...r,
      id: r.id || r._id,  // 确保 id 字段存在（兼容云端 _id）
      statusText,
      statusClass,
      daysLeft,
      doneToday: r.lastDone === todayStr,  // 今天已完成标识
      nextDueDate: this._formatDate(nextDueDate)
    }
  },

  _computeUpcomingReminders: function (reminders) {
    if (!reminders || reminders.length === 0) {
      return { all: [], focused: [] }
    }
    const all = reminders.map(r => this._computeStatus(r))
    const priority = { overdue: 0, today: 1, tomorrow: 2, normal: 3, pending: 4 }
    all.sort((a, b) => {
      const pa = priority[a.statusClass] ?? 9
      const pb = priority[b.statusClass] ?? 9
      if (pa !== pb) return pa - pb
      return (a.daysLeft || 0) - (b.daysLeft || 0)
    })
    // 只显示超期、当天和明天需完成的（排除已完成、未来）
    const focused = all.filter(r =>
      (r.statusClass === 'overdue' || r.statusClass === 'today' || r.statusClass === 'tomorrow') && !r.doneToday
    )
    return { all, focused }
  },

  // ========= 弹窗/CRUD =========

  tapUpcomingReminder: function () {
    if (this.data.isReadOnly) return
    this.openReminderModal()
  },

  openReminderModal: function () {
    this.setData({ showReminderModal: true })
  },

  closeReminderModal: function () {
    this.setData({ showReminderModal: false })
  },

  openReminderEdit: function (e) {
    const id = e && e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.id
    let editing = null
    let defaultForm = { type: '换水', intervalDays: 1, lastDone: '' }

    if (id) {
      editing = this.data.reminders.find(r => String(r.id || r._id) === String(id))
      if (editing) {
        defaultForm = {
          type: editing.type || '换水',
          intervalDays: editing.intervalDays || 1,
          lastDone: editing.lastDone || ''
        }
      }
    }

    this.setData({
      showReminderEditModal: true,
      editingReminder: editing,
      reminderForm: defaultForm
    })
  },

  closeReminderEdit: function () {
    this.setData({ showReminderEditModal: false, editingReminder: null })
  },

  selectReminderType: function (e) {
    const type = e.currentTarget.dataset.type
    if (!type) return
    this.setData({ 'reminderForm.type': type })
  },

  onReminderIntervalInput: function (e) {
    const raw = e.detail.value
    // 允许清空
    if (raw === '' || raw === undefined || raw === null) {
      this.setData({ 'reminderForm.intervalDays': '' })
      return
    }
    const val = parseInt(raw, 10)
    this.setData({ 'reminderForm.intervalDays': isNaN(val) ? raw : val })
  },

  onReminderLastDoneChange: function (e) {
    this.setData({ 'reminderForm.lastDone': e.detail.value || '' })
  },

  submitReminder: async function () {
    const form = this.data.reminderForm
    if (!form.type) {
      showError('请选择提醒类型')
      return
    }
    const interval = Number(form.intervalDays)
    if (!interval || interval <= 0) {
      showError('间隔天数需大于 0')
      return
    }

    // 避免同一类型重复
    const current = this.data.reminders || []
    const editingId = this.data.editingReminder
      ? String(this.data.editingReminder.id || this.data.editingReminder._id)
      : null
    const duplicated = current.some(r =>
      String(r.id || r._id) !== editingId && r.type === form.type
    )
    if (duplicated) {
      showError('该类型提醒已存在')
      return
    }

    const petId = this.data.petId
    const payload = {
      type: form.type,
      intervalDays: interval,
      lastDone: form.lastDone || '',
      petId
    }

    try {
      let res
      if (editingId) {
        if (API.updateReminder) {
          res = await API.updateReminder({ id: editingId, ...payload })
        }
      } else {
        if (API.createReminder) {
          res = await API.createReminder(payload)
        }
      }
      if (res && res.success) {
        this.setData({ showReminderEditModal: false, editingReminder: null })
        await this.loadReminders(petId)
        showSuccess('保存成功')
      } else {
        showError(res && res.message || '保存失败，请重试')
      }
    } catch (err) {

      showError('保存失败，请重试')
    }
  },

  markReminderDone: async function (e) {
    const datasetId = (e && e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.id) || null

    // 从 enriched 数据中拿真实数据，确保 _id / id 都对得上
    const allEnriched = this.data.allEnrichedReminders || []
    const upcoming = this.data.upcomingReminders || []
    const enrichedItem = allEnriched.find(r => String(r.id) === String(datasetId))
      || upcoming.find(r => String(r.id) === String(datasetId))
      || allEnriched[0]
      || upcoming[0]

    if (!enrichedItem) {
      showError('未找到该提醒')
      return
    }

    const cloudId = enrichedItem._id || enrichedItem.id
    const interval = Number(enrichedItem.intervalDays) || 1
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = this._formatDate(today)

    // 两步切换：doneToday=false → 标记今天完成 / doneToday=true → 推进下一周期
    const isDoneToday = enrichedItem.lastDone === todayStr
    const newLastDone = isDoneToday
      ? this._formatDate(new Date(today.getTime() + interval * 86400000))
      : todayStr

    // 1. 云端更新
    let cloudOk = false
    try {
      if (API.markReminderDone) {
        const res = await API.markReminderDone(cloudId, newLastDone)
        cloudOk = !!(res && res.success)
      }
    } catch (err) {

    }

    if (!cloudOk) {
      showError('云端更新失败，请重试')
      return
    }

    // 2. 本地立即更新
    const updatedList = (this.data.reminders || []).map(r => {
      if (String(r._id) === String(cloudId)) {
        return { ...r, lastDone: newLastDone }
      }
      return r
    })
    this._setReminders(updatedList)
    showSuccess(isDoneToday ? '已推进' : '已标记完成')
  },

  deleteReminder: async function (e) {
    const id = e && e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.id
    if (!id) return
    const current = this.data.reminders || []
    const newList = current.filter(r => String(r.id || r._id) !== String(id))
    await this.saveReminders(newList)
    showSuccess('已删除')
  }

})
