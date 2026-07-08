const { getAPI } = require('../../utils/api.js')
const { showError, showSuccess, showLoading, hideLoading, showConfirm } = require('../../utils/error.js')
const { getVoiceManager } = require('../../utils/voice.js')
const { convertPetPhotosToUrls, convertPhotoIdsToUrls, sanitizePetPhotos, getTempUrl } = require('../../utils/image.js')
const { getCache, setCache } = require('../../utils/cache.js')
const { mergeCategories, syncMissingCategoriesToCloud } = require('../../utils/category.js')
const API = getAPI()
const voiceManager = getVoiceManager()

Page({
  data: {
    statusBarHeight: 0,
    totalNavHeight: 120,
    pets: [],
    filteredPets: [],
    showModal: false,
    isEditMode: false,
    selectedIds: [],
    allSelected: false,
    dragItem: null,
    showManual: false,
    showFilters: false,
    searchText: '',
    searchPlaceholder: '搜索别名 / 扫码搜索',
    switchColor: '#E8A400',
    showSkeleton: true,
    filter: {
      category: '全部',
      gender: '全部',
      status: '全部'
    },
    petForm: {
      name: '',
      category: '无',
      gender: '公',
      alias: '',
      price: '',
      status: '正常',
      father: '',
      fatherName: '',
      mother: '',
      motherName: '',
      partner: '',
      partnerName: '',
      isPublic: false,
      photos: []
    },
    isRecording: false,
    currentVoiceField: '',
    categories: ['无'],
    showAddCategoryModal: false,
    newCategoryName: '',
    showEditCategoryModal: false,
    editCategoryOldName: '',
    editCategoryNewName: '',
    loading: false,
    loadingMore: false,
    cloudAvailable: true,
    showRecordModal: false,
    currentPet: null,
    recordTab: '全部',
    currentRecords: [],
    allRecords: [],
    showFatherModal: false,
    showMotherModal: false,
    showPartnerModal: false,
    fatherList: [],
    motherList: [],
    partnerList: [],
    fatherSearchText: '',
    motherSearchText: '',
    partnerSearchText: '',
    selectedFather: null,
    selectedMother: null,
    selectedPartner: null,
    isEditingCategories: false,
    pageNum: 1,
    pageSize: 12,
    hasMore: true,
    total: 0,
    refreshing: false,
    isLoggedIn: false
  },

  onLoad() {
    const sysInfo = wx.getSystemInfoSync()
    const statusBarHeight = Math.max(sysInfo.statusBarHeight || 20, 20)
    const safeAreaTop = sysInfo.safeArea ? (sysInfo.safeArea.top || statusBarHeight) : statusBarHeight
    const finalStatusBarHeight = Math.max(statusBarHeight, safeAreaTop)
    const rpxRatio = 750 / sysInfo.windowWidth
    const totalNavHeight = Math.round(finalStatusBarHeight * rpxRatio) + 88 + 24
    this.setData({ statusBarHeight: finalStatusBarHeight, totalNavHeight })
    // 不在 onLoad 中加载数据，由 onShow 统一控制
    // 避免 Tab 页面预创建时提前加载导致骨架屏消失
  },

  onShow() {
    const app = getApp()
    const isLoggedIn = app.globalData.isLoggedIn
    this.setData({ isLoggedIn })

    const updateTabBar = () => {
      if (typeof this.getTabBar === 'function' && this.getTabBar()) {
        const tabBar = this.getTabBar()
        tabBar.setData({ selected: 1, visible: true })
      }
    }
    updateTabBar()
    setTimeout(updateTabBar, 100)

    // loading 页完成后首次进入：直接展示预加载数据，后台静默同步
    if (app.globalData.dataPreloaded && !this._preloadedApplied) {
      const pets = app.globalData.preloadedPets || wx.getStorageSync('pets') || []
      const categories = app.globalData.preloadedCategories || wx.getStorageSync('categories') || this.data.categories
      this.setData({
        pets,
        filteredPets: pets,
        categories,
        showSkeleton: false
      })
      this.computePetStatuses()
      this.updateFilteredPets()
      this._preloadedApplied = true
      this.loadCategories()
      this.loadPets(true, { background: true })
      return
    }

    // Tab 页预创建时尚未加载完成，跳过避免空数据覆盖
    if (!this._preloadedApplied && !app.globalData.dataPreloaded) {
      return
    }

    // 后续返回宠物页时正常刷新
    this.loadCategories()
    this.setData({ showSkeleton: true })
    this._skeletonShowTime = Date.now()
    this.loadPets(true)
  },

  onHide() {
    // 提前设置骨架屏，这样下次页面显示时微信渲染的初始状态就是骨架屏
    this.setData({ showSkeleton: true })
  },

  // 确保骨架屏至少展示 600ms，防止一闪而过
  _hideSkeleton() {
    const elapsed = Date.now() - (this._skeletonShowTime || 0)
    const minDuration = 600
    const delay = Math.max(0, minDuration - elapsed)
    setTimeout(() => {
      this.setData({ showSkeleton: false })
    }, delay)
  },

  onReachBottom() {
    this.loadMorePets()
  },

  onPullDownRefresh() {
    if (this.data.refreshing) return
    this.setData({ refreshing: true })
    this.loadPets(true).finally(() => {
      this.setData({ refreshing: false })
      wx.stopPullDownRefresh()
    })
  },

  async loadCategories() {
    const localCategories = wx.getStorageSync('categories') || []
    const petCategories = (this.data.pets || wx.getStorageSync('pets') || [])
      .map(p => p.category)
      .filter(Boolean)

    try {
      const result = await API.getCategories()
      if (result && result.success && result.data && result.data.categories) {
        let categories = mergeCategories(result.data.categories, localCategories, petCategories)
        categories = await syncMissingCategoriesToCloud(categories, API)
        this.setData({ categories })
        wx.setStorageSync('categories', categories)
        const app = getApp()
        app.globalData.preloadedCategories = categories
        return
      }
      const savedCategories = wx.getStorageSync('categories')
      if (savedCategories && savedCategories.length > 0) {
        this.setData({ categories: mergeCategories(savedCategories, petCategories) })
      }
    } catch (error) {
      console.error('加载分类失败:', error)
      const savedCategories = wx.getStorageSync('categories')
      if (savedCategories && savedCategories.length > 0) {
        this.setData({ categories: mergeCategories(savedCategories, petCategories) })
      }
    }
  },

  async loadPets(reset = true, options = {}) {
    const { background = false } = options || {}

    if (reset && !background) {
      this.setData({ loading: true, pageNum: 1, hasMore: true })
    } else if (!reset) {
      if (this.data.loadingMore || !this.data.hasMore) return
      this.setData({ loadingMore: true })
    }

    // 为本次加载生成唯一序号，防止并发请求导致旧数据覆盖新数据
    this._loadSeq = (this._loadSeq || 0) + 1
    const currentSeq = this._loadSeq

    // 检查登录状态，未登录用户不显示任何数据
    // 同时检查 globalData 和本地缓存的 openid，避免异步初始化竞态
    const app = getApp()
    let isLoggedIn = app.globalData.isLoggedIn
    if (!isLoggedIn) {
      try {
        const openid = wx.getStorageSync('openid')
        if (openid) {
          isLoggedIn = true
          app.globalData.isLoggedIn = true
          app.globalData.openid = openid
        }
      } catch (e) {}
    }
    if (!isLoggedIn) {
      if (this._loadSeq !== currentSeq) return
      this.setData({
        pets: [],
        filteredPets: [],
        loading: false,
        loadingMore: false,
        cloudAvailable: false,
        hasMore: false,
        total: 0,
        pageNum: 1
      })
      if (!background) this._hideSkeleton()
      return
    }

    try {
      const result = await API.getPetList(this.data.filter, this.data.pageNum, this.data.pageSize)

      // 若已有更新的请求，丢弃本次过期结果
      if (this._loadSeq !== currentSeq) {
        console.log('[loadPets] 丢弃过期请求结果')
        return
      }

      if (result.success && result.data) {
        // 合并云端数据与本地缓存的photos
        const localPets = wx.getStorageSync('pets') || []
        const localMap = {}
        localPets.forEach(p => { localMap[p.id || p._id] = p })

        // 适配分页数据结构: { list, total, pageNum, pageSize, hasMore }
        const rawData = result.data
        const petList = Array.isArray(rawData.list) ? rawData.list : (Array.isArray(rawData) ? rawData : [])
        const mergedData = petList.map(pet => {
          const id = pet.id || pet._id
          const local = localMap[id]
          // 优先使用本地缓存中有效的图片URL（临时URL可直接显示）
          if (local && local.photos && local.photos.length > 0) {
            const validLocalPhotos = local.photos.filter(p => p && p.startsWith('http'))
            if (validLocalPhotos.length > 0) {
              return { ...pet, photos: validLocalPhotos }
            }
          }
          // 本地没有有效图片，使用云端返回的photos（cloud://格式，后续会转换）
          return pet
        })

        // 转换云存储URL（仅用于展示）
        let petsWithUrls = []
        try {
          petsWithUrls = await convertPetPhotosToUrls(mergedData)
        } catch (err) {

          petsWithUrls = mergedData
        }

        // 新数据 - 确保始终是数组
        const validPetsWithUrls = Array.isArray(petsWithUrls) ? petsWithUrls : []
        
        // 去重处理：合并新数据时避免重复
        let newPets = []
        if (reset) {
          newPets = validPetsWithUrls
        } else {
          // 将新数据与已有数据合并，去除重复项
          const existingIds = new Set((this.data.pets || []).map(p => p.id || p._id))
          const uniqueNewPets = validPetsWithUrls.filter(p => !existingIds.has(p.id || p._id))
          newPets = [...(this.data.pets || []), ...uniqueNewPets]
        }
        
        // 存入缓存时净化图片URL，确保只存储cloud://fileID
        try {
          wx.setStorageSync('pets', sanitizePetPhotos(newPets))
        } catch (e) {
          console.error('缓存宠物数据失败:', e)
        }
        
        this.setData({
          pets: newPets || [],
          cloudAvailable: true,
          hasMore: (result.data.hasMore !== undefined ? result.data.hasMore : petList.length === this.data.pageSize) && petList.length >= this.data.pageSize,
          total: result.data.total || (newPets || []).length,
          pageNum: reset ? 2 : this.data.pageNum + 1,
          loading: false,
          loadingMore: false
        })
        if (!background) {
          this._hideSkeleton()
        }
        this.computePetStatuses()
        this.updateFilteredPets()
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      // 若已有更新的请求，丢弃本次过期错误
      if (this._loadSeq !== currentSeq) {
        console.log('[loadPets] 丢弃过期请求错误')
        return
      }
      console.error('加载数据失败，使用本地缓存:', error)
      if (reset) {
        this.loadLocalPets()
      }
    } finally {
      // 只有最新请求才重置加载状态，避免覆盖后续请求的 loading
      if (this._loadSeq === currentSeq) {
        this.setData({ loading: false, loadingMore: false })
      }
    }
  },

  async loadMorePets() {
    await this.loadPets(false)
  },

  loadLocalPets() {
    try {
      const localPets = wx.getStorageSync('pets') || []
      let pets = localPets
      
      if (!Array.isArray(localPets) || localPets.length === 0) {
        pets = [
          { id: '1', name: '小金', category: '豹纹', gender: '公', alias: '', father: '', mother: '', status: '正常' },
          { id: '2', name: '糖糖', category: '豹纹', gender: '母', alias: '', father: '', mother: '', status: '待配' },
          { id: '3', name: '豆豆', category: '无', gender: '公', alias: '', father: '', mother: '', status: '正常' },
          { id: '4', name: '花花', category: '豹纹', gender: '母', alias: '', father: '', mother: '', status: '预警' }
        ]
        try {
          wx.setStorageSync('pets', pets)
        } catch (e) {
          console.error('缓存默认宠物失败:', e)
        }
      }

      this.setData({ pets: pets || [], filteredPets: pets || [], cloudAvailable: false, hasMore: false, total: (pets || []).length })
      this._hideSkeleton()
    } catch (error) {
      console.error('加载宠物列表失败:', error)
      this.setData({ pets: [], filteredPets: [] })
      this._hideSkeleton()
    }
  },

  updateFilteredPets() {
    const pets = this.data.pets || []
    let result = [...pets]

    if (this.data.filter.category !== '全部') {
      result = result.filter(pet => pet.category === this.data.filter.category)
    }

    if (this.data.filter.gender !== '全部') {
      result = result.filter(pet => pet.gender === this.data.filter.gender)
    }

    if (this.data.filter.status !== '全部') {
      result = result.filter(pet => (pet.computedStatus || pet.status) === this.data.filter.status)
    }

    if (this.data.searchText) {
      const search = this.data.searchText.toLowerCase()
      result = result.filter(pet =>
        (pet.name && pet.name.toLowerCase().includes(search)) ||
        (pet.alias && pet.alias.toLowerCase().includes(search)) ||
        (pet.id && pet.id.toString().includes(search))
      )
    }

    this.setData({ filteredPets: result })
  },

  // 计算所有宠物的动态状态
  computePetStatuses() {
    const pets = this.data.pets || []
    const allRecords = wx.getStorageSync('records') || []
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const statusMap = {}

    pets.forEach(pet => {
      const petId = pet.id || pet._id
      // 保留手动设置的特殊状态
      if (pet.status === '出售' || pet.status === '死亡') {
        statusMap[petId] = pet.status
        return
      }

      const petRecords = allRecords.filter(r => r.petId === petId)
      if (petRecords.length === 0) {
        // 母性宠物无记录 → 待配，其他 → 正常
        statusMap[petId] = pet.gender === '母' ? '待配' : '正常'
        return
      }

      const latestRecord = petRecords.sort((a, b) => {
        const dateA = new Date(a.date + 'T' + (a.time || '00:00'))
        const dateB = new Date(b.date + 'T' + (b.time || '00:00'))
        return dateB - dateA
      })[0]

      // 健康记录在近 30 天内 → 预警
      const hasRecentHealth = petRecords.some(r => {
        if (r.type !== '健康') return false
        const rDate = new Date(r.date + 'T' + (r.time || '00:00'))
        return rDate >= thirtyDaysAgo
      })
      if (hasRecentHealth) {
        statusMap[petId] = '预警'
        return
      }

      // 母性 + 近 30 天内无交配/产蛋记录 → 待配
      if (pet.gender === '母') {
        const recentBreedRecords = petRecords.filter(r => {
          if (r.type !== '交配' && r.type !== '产蛋') return false
          const rDate = new Date(r.date + 'T' + (r.time || '00:00'))
          return rDate >= thirtyDaysAgo
        })
        if (recentBreedRecords.length === 0) {
          statusMap[petId] = '待配'
          return
        }
        // 近 30 天内有产蛋记录但受精率低于 50% → 待配
        const recentEggRecords = recentBreedRecords.filter(r => r.type === '产蛋' && r.eggCount > 0)
        if (recentEggRecords.length > 0) {
          const totalEggs = recentEggRecords.reduce((sum, r) => sum + (parseInt(r.eggCount) || 0), 0)
          const totalFertilized = recentEggRecords.reduce((sum, r) => sum + (parseInt(r.fertilizedCount) || 0), 0)
          if (totalEggs > 0 && (totalFertilized / totalEggs) < 0.5) {
            statusMap[petId] = '待配'
            return
          }
        }
      }

      statusMap[petId] = pet.status || '正常'
    })

    this._statusMap = statusMap
    // 将计算状态写回 pet 数据以便 WXML 渲染
    const statusClassMap = { '正常': 'normal', '待配': 'waiting', '预警': 'warning', '出售': 'sold', '死亡': 'dead' }
    const updatedPets = pets.map(pet => {
      const petId = pet.id || pet._id
      const status = statusMap[petId] || pet.status || '正常'
      return { ...pet, computedStatus: status, statusClass: statusClassMap[status] || 'normal' }
    })
    this.setData({ pets: updatedPets })
  },

  // 获取宠物当前状态
  _getPetStatus(pet) {
    const petId = pet.id || pet._id
    if (this._statusMap && this._statusMap[petId]) {
      return this._statusMap[petId]
    }
    return pet.status || '正常'
  },

  setFilter(e) {
    const { key, value } = e.currentTarget.dataset
    if (!key || value === undefined) return
    const filter = { ...this.data.filter, [key]: value }
    this.setData({ filter })
    this.loadPets(true)
  },

  toggleFilters() {
    this.setData({ showFilters: !this.data.showFilters })
  },

  onSearchInput(e) {
    const searchText = e.detail.value
    this.setData({ searchText })
    // 如果搜索清空了，重新加载全部
    if (!searchText) {
      this.loadPets(true)
    } else {
      this.setData({ 
        'filter.searchText': searchText 
      })
      this.loadPets(true)
    }
  },

  onSearchFocus() {
    if (this._blurTimer) {
      clearTimeout(this._blurTimer)
      this._blurTimer = null
    }
    this.setData({ searchPlaceholder: '' })
  },

  onSearchBlur() {
    if (this.data.searchText) return
    this._blurTimer = setTimeout(() => {
      this.setData({ searchPlaceholder: '搜索编号 / 别名' })
      this._blurTimer = null
    }, 250)
  },

  // 扫码跳转宠物详情（扫描打印标签二维码）
  scanQrCode() {
    wx.scanCode({
      onlyFromCamera: false,
      scanType: ['qrCode', 'barCode', 'datamatrix', 'pdf417'],
      success: (res) => {
        const scanned = (res.result || '').trim()

        if (!scanned) {
          showError('扫码结果为空')
          return
        }

        let petId = ''

        // 策略 1：正则提取 petId=xxx（兼容 URL、scene、任意参数格式）
        const petIdMatch = scanned.match(/[?&]petId=([^&\s]+)/) || scanned.match(/petId=([^&\s]+)/)
        if (petIdMatch) {
          petId = decodeURIComponent(petIdMatch[1])
        }

        // 策略 2：解析本地 fallback 格式 wxapp://pet/petId
        if (!petId && scanned.indexOf('wxapp://pet/') === 0) {
          // wxapp://pet/petId 或 wxapp://pet/petId/recordId
          const parts = scanned.replace('wxapp://pet/', '').split('/')
          if (parts[0]) petId = parts[0]
        }

        // 策略 3：如果扫到的是 scene 参数格式（petId=xxx&from=scan）
        if (!petId && scanned.indexOf('petId=') !== -1) {
          const m = scanned.match(/petId=([^&\s]+)/)
          if (m) petId = decodeURIComponent(m[1])
        }

        if (petId) {
          wx.navigateTo({ url: '/pages/pet/detail?petId=' + petId })
        } else {
          // 显示扫码原始内容，便于调试排查
          wx.showModal({
            title: '无法识别该二维码',
            content: '扫码内容：' + scanned.substring(0, 120),
            confirmText: '知道了',
            showCancel: false
          })
        }
      },
      fail: (err) => {
        console.error('[scan] 扫码失败:', err)
        if (err.errMsg && err.errMsg.indexOf('cancel') === -1) {
          showError('扫码失败：' + (err.errMsg || ''))
        }
      }
    })
  },

  async showAddModal() {
    const app = getApp()
    if (!app.requireLogin()) return

    // 从本地存储读取用户的手动配置展开/收起习惯
    let savedShowManual = false
    try {
      savedShowManual = wx.getStorageSync('showManual')
    } catch (error) {
      console.error('读取手动配置状态失败:', error)
    }
    
    await this.loadCategories()
    this.setData({
      showModal: true,
      showManual: savedShowManual === true,
      selectedFather: null,
      selectedMother: null,
      petForm: {
        name: '',
        category: this.data.categories[1] || '无',
        gender: '公',
        alias: '',
        price: '',
        status: '正常',
        father: '',
        fatherName: '',
        mother: '',
        motherName: '',
        partner: '',
        partnerName: '',
        isPublic: false,
        photos: []
      }
    })
  },

  hideAddModal() {
    this.setData({ showModal: false })
  },

  stopPropagation() {},

  toggleManual() {
    const newShowManual = !this.data.showManual
    this.setData({ showManual: newShowManual })
    // 保存用户的展开/收起习惯到本地存储
    try {
      wx.setStorageSync('showManual', newShowManual)
    } catch (error) {
      console.error('保存手动配置状态失败:', error)
    }
  },

  onNameInput(e) {
    this.setData({ 'petForm.name': e.detail.value })
  },

  onAliasInput(e) {
    this.setData({ 'petForm.alias': e.detail.value })
  },

  onPriceInput(e) {
    this.setData({ 'petForm.price': e.detail.value })
  },

  selectCategory(e) {
    this.setData({ 'petForm.category': e.currentTarget.dataset.category })
  },

  selectGender(e) {
    this.setData({ 'petForm.gender': e.currentTarget.dataset.gender })
  },

  selectStatus(e) {
    this.setData({ 'petForm.status': e.currentTarget.dataset.status })
  },

  onPublicSwitchChange: function (e) {
    this.setData({ 'petForm.isPublic': e.detail.value })
  },

  selectParent(e) {
    const parent = e.currentTarget.dataset.parent
    if (parent === 'father') {
      this.setData({ showFatherModal: true, fatherSearchText: '', fatherList: [] })
      this.loadParentsAsync('father')
    } else if (parent === 'mother') {
      this.setData({ showMotherModal: true, motherSearchText: '', motherList: [] })
      this.loadParentsAsync('mother')
    } else if (parent === 'partner') {
      this.setData({ showPartnerModal: true, partnerSearchText: '', partnerList: [] })
      this.loadParentsAsync('partner')
    }
  },

  async loadParentsAsync(type) {
    try {
      const localPets = wx.getStorageSync('pets') || []
      if (localPets.length > 0) {
        // 转换图片URL
        const petsWithUrls = await Promise.all(
          localPets.map(async (pet) => {
            if (pet.photos && pet.photos.length > 0) {
              const urls = await convertPhotoIdsToUrls(pet.photos)
              return { ...pet, photos: urls }
            }
            return pet
          })
        )
        
        if (type === 'father') {
          const fatherList = petsWithUrls.filter(p => p.gender === '公')
          this.setData({ fatherList })
        } else if (type === 'mother') {
          const motherList = petsWithUrls.filter(p => p.gender === '母')
          this.setData({ motherList })
        } else if (type === 'partner') {
          const partnerList = petsWithUrls
          this.setData({ partnerList })
        }
      }
    } catch (error) {
      console.error('加载父母列表失败:', error)
    }
  },

  hideFatherModal() {
    this.setData({ showFatherModal: false })
  },

  hideMotherModal() {
    this.setData({ showMotherModal: false })
  },

  hidePartnerModal() {
    this.setData({ showPartnerModal: false })
  },

  selectFather(e) {
    const petId = e.currentTarget.dataset.id
    const pet = this.data.fatherList.find(p => (p.id || p._id) === petId)
    if (pet) {
      this.setData({
        selectedFather: pet,
        'petForm.father': pet.id || pet._id,
        'petForm.fatherName': pet.name,
        showFatherModal: false
      })
    }
  },

  selectMother(e) {
    const petId = e.currentTarget.dataset.id
    const pet = this.data.motherList.find(p => (p.id || p._id) === petId)
    if (pet) {
      this.setData({
        selectedMother: pet,
        'petForm.mother': pet.id || pet._id,
        'petForm.motherName': pet.name,
        showMotherModal: false
      })
    }
  },

  selectPartner(e) {
    const petId = e.currentTarget.dataset.id
    const pet = this.data.partnerList.find(p => (p.id || p._id) === petId)
    if (pet) {
      this.setData({
        selectedPartner: pet,
        'petForm.partner': pet.id || pet._id,
        'petForm.partnerName': pet.name,
        showPartnerModal: false
      })
    }
  },

  clearFather() {
    this.setData({ selectedFather: null, 'petForm.father': '', 'petForm.fatherName': '' })
  },

  clearMother() {
    this.setData({ selectedMother: null, 'petForm.mother': '', 'petForm.motherName': '' })
  },

  clearPartner() {
    this.setData({ selectedPartner: null, 'petForm.partner': '', 'petForm.partnerName': '' })
  },

  async onFatherSearch(e) {
    const searchText = e.detail.value
    this.setData({ fatherSearchText: searchText })
    const localPets = wx.getStorageSync('pets') || []
    const filtered = localPets.filter(p => p.gender === '公' &&
      ((p.name && p.name.includes(searchText)) || (p.alias && p.alias.includes(searchText))))
    const fatherList = await Promise.all(filtered.map(async (pet) => {
      if (pet.photos && pet.photos.length > 0) {
        const urls = await convertPhotoIdsToUrls(pet.photos)
        return { ...pet, photos: urls }
      }
      return pet
    }))
    this.setData({ fatherList })
  },

  async onMotherSearch(e) {
    const searchText = e.detail.value
    this.setData({ motherSearchText: searchText })
    const localPets = wx.getStorageSync('pets') || []
    const filtered = localPets.filter(p => p.gender === '母' &&
      ((p.name && p.name.includes(searchText)) || (p.alias && p.alias.includes(searchText))))
    const motherList = await Promise.all(filtered.map(async (pet) => {
      if (pet.photos && pet.photos.length > 0) {
        const urls = await convertPhotoIdsToUrls(pet.photos)
        return { ...pet, photos: urls }
      }
      return pet
    }))
    this.setData({ motherList })
  },

  async onPartnerSearch(e) {
    const searchText = e.detail.value
    this.setData({ partnerSearchText: searchText })
    const localPets = wx.getStorageSync('pets') || []
    const filtered = localPets.filter(p =>
      ((p.name && p.name.includes(searchText)) || (p.alias && p.alias.includes(searchText))))
    const partnerList = await Promise.all(filtered.map(async (pet) => {
      if (pet.photos && pet.photos.length > 0) {
        const urls = await convertPhotoIdsToUrls(pet.photos)
        return { ...pet, photos: urls }
      }
      return pet
    }))
    this.setData({ partnerList })
  },

  addCategory() {
    this.setData({
      showAddCategoryModal: true,
      newCategoryName: ''
    })
  },

  hideAddCategoryModal() {
    this.setData({ showAddCategoryModal: false })
  },

  onCategoryInput(e) {
    this.setData({ newCategoryName: e.detail.value })
  },

  async confirmAddCategory() {
    const name = this.data.newCategoryName.trim()

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
          'petForm.category': name
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
  editCategory(e) {
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

  hideEditCategoryModal() {
    this.setData({ showEditCategoryModal: false })
  },

  onEditCategoryInput(e) {
    this.setData({ editCategoryNewName: e.detail.value })
  },

  async confirmEditCategory() {
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
    let newCategory = this.data.petForm.category
    if (newCategory === oldName) {
      newCategory = newName
    }

    this.setData({
      categories,
      'petForm.category': newCategory,
      showEditCategoryModal: false
    })

    // 同步到数据库
    try {
      const result = await API.updateCategory(oldName, newName)
      if (result && result.success && result.data && result.data.categories) {
        const categories = result.data.categories
        this.setData({ categories, 'petForm.category': newCategory })
        wx.setStorageSync('categories', categories)
        getApp().globalData.preloadedCategories = categories
        showSuccess('修改成功')
      } else {
        showError(result?.message || '修改同步失败')
      }
    } catch (err) {
      console.error('分类修改同步到数据库失败:', err)
      showError('修改同步失败，请重试')
    }
  },

  async deleteCategory(e) {
    const category = e.currentTarget.dataset.category
    if (category === '无') {
      showError('不能删除默认分类')
      return
    }

    const confirmed = await showConfirm('删除分类', `确定要删除分类"${category}"吗？`)
    if (!confirmed) return

    const categories = (this.data.categories || []).filter(c => c !== category)
    let newCategory = this.data.petForm.category

    if (newCategory === category) {
      newCategory = '无'
    }

    this.setData({
      categories,
      'petForm.category': newCategory
    })

    wx.setStorageSync('categories', categories)
    showSuccess('删除成功')

    // 同步删除到数据库
    try {
      const result = await API.deleteCategory(category)
      if (result && result.success && result.data && result.data.categories) {
        const synced = result.data.categories
        this.setData({ categories: synced, 'petForm.category': newCategory })
        wx.setStorageSync('categories', synced)
        getApp().globalData.preloadedCategories = synced
      }
    } catch (err) {
      console.error('分类删除同步到数据库失败:', err)
    }
  },

  chooseImage() {
    const currentCount = this.data.petForm.photos.length
    const maxCount = 9 - currentCount

    if (maxCount <= 0) {
      showError('最多只能选择9张图片')
      return
    }

    const that = this
    wx.chooseMedia({
      count: maxCount,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      success: function (res) {
        const tempFilePaths = res.tempFiles.map(f => f.tempFilePath)
        const newPhotos = [...that.data.petForm.photos, ...tempFilePaths]
        that.setData({ 'petForm.photos': newPhotos })
      },
      fail: function (error) {
        console.error('选择图片失败:', error)
        if (error.errMsg && !error.errMsg.includes('cancel')) {
          showError('选择图片失败')
        }
      }
    })
  },

  deletePhoto(e) {
    const index = e.currentTarget.dataset.index
    const photos = [...this.data.petForm.photos]
    photos.splice(index, 1)
    this.setData({ 'petForm.photos': photos })
  },

  async onImageError(e) {
    const { index } = e.currentTarget.dataset
    const { filteredPets } = this.data
    const pet = filteredPets[index]
    if (!pet || !pet.photos) return

    const photo = pet.photos[0]
    if (!photo) return

    let fileId = null
    if (photo.startsWith('cloud://')) {
      fileId = photo
    } else if (photo.includes('tcb.qcloud.la')) {
      const match = photo.match(/^https?:\/\/([^\/]+)(\/[^\?]+)/)
      if (match) {
        const domainPrefix = match[1].replace('.tcb.qcloud.la', '')
        fileId = 'cloud://cloud1-d0g853l9d7017ea3b.' + domainPrefix + match[2]
      }
    }

    if (fileId) {
      try {
        const newUrl = await getTempUrl(fileId)
        const key = 'filteredPets[' + index + '].photos[0]'
        this.setData({ [key]: newUrl })
      } catch (err) {
        // 文件不存在，清空图片
        const key = 'filteredPets[' + index + '].photos'
        this.setData({ [key]: [] })
      }
    }
  },

  toggleVoice(e) {
    const field = e.currentTarget.dataset.field
    if (this.data.isRecording) {
      voiceManager.stopRecording()
      this.setData({ isRecording: false, currentVoiceField: '' })
    } else {
      this.setData({ isRecording: true, currentVoiceField: field })
      voiceManager.startRecording(field, (fieldName, text) => {
        if (fieldName === 'name') {
          this.setData({ 'petForm.name': text })
        } else if (fieldName === 'alias') {
          this.setData({ 'petForm.alias': text })
        }
        this.setData({ isRecording: false, currentVoiceField: '' })
      })
    }
  },

  cancelVoice() {
    if (!this.data.isRecording) return
    voiceManager.cancelRecording()
    this.setData({ isRecording: false, currentVoiceField: '' })
    wx.showToast({ title: '已取消', icon: 'none' })
  },

  async confirmCreate() {
    const app = getApp()
    if (!app.requireLogin()) return

    if (!this.data.petForm.name) {
      showError('请输入宠物名称')
      return
    }

    // 别名唯一性校验
    const newAlias = (this.data.petForm.alias || '').trim()
    if (newAlias) {
      const existingPet = this.data.pets.find(p => (p.alias || '').trim() === newAlias)
      if (existingPet) {
        showError('别名「' + newAlias + '」已存在，请使用其他别名')
        return
      }
    }

    this.setData({ loading: true })

    try {
      let photoIDs = []
      const photos = this.data.petForm.photos || []

      if (photos.length > 0 && this.data.cloudAvailable) {
        showLoading('上传图片中...')
        try {
          const uploadResults = []
          for (const filePath of photos) {
            if (filePath.startsWith('cloud://')) {
              uploadResults.push({ success: true, fileID: filePath })
            } else {
              const result = await API.uploadImage(filePath, 'pets', '', { scene: 'pet' })
              uploadResults.push(result)
            }
          }
          
          photoIDs = uploadResults
            .filter(r => r.success)
            .map(r => r.fileID)
          
          hideLoading()
        } catch (uploadError) {
          hideLoading()
          console.error('图片上传失败:', uploadError)
        }
      } else if (photos.length > 0) {
        photoIDs = photos
      }

      const result = await API.createPet({
        ...this.data.petForm,
        photos: photoIDs.length > 0 ? photoIDs : photos
      })

      if (result.success) {
        let finalPhotos = photoIDs.length > 0 ? photoIDs : photos

        if (photoIDs.length > 0) {
          finalPhotos = await convertPhotoIdsToUrls(photoIDs)
        }

        const petId = result.data ? result.data.id : Date.now().toString()
        const newPet = {
          id: petId,
          name: this.data.petForm.name,
          category: this.data.petForm.category,
          gender: this.data.petForm.gender,
          price: this.data.petForm.price,
          status: this.data.petForm.status || '正常',
          father: this.data.petForm.father,
          fatherName: this.data.petForm.fatherName,
          mother: this.data.petForm.mother,
          motherName: this.data.petForm.motherName,
          partner: this.data.petForm.partner,
          partnerName: this.data.petForm.partnerName,
          photos: finalPhotos
        }

        // 创建操作足迹
        await this.createActionFootprint('建档', petId, newPet.name, `为「${newPet.name}」建立了档案`, finalPhotos)

        const updatedPets = [newPet, ...this.data.pets]
        wx.setStorageSync('pets', sanitizePetPhotos(updatedPets))
        this.setData({ pets: updatedPets })
        this.updateFilteredPets()

        showSuccess('创建成功')
        this.setData({ showModal: false })

        // 创建默认"建档"记录
        await this.createArchiveRecord(petId, newPet.name, finalPhotos)

        setTimeout(() => { this.loadPets() }, 500)
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error('创建宠物失败:', error)
      const errMsg = error.message || ''
      if (errMsg.indexOf('别名') !== -1 && errMsg.indexOf('已存在') !== -1) {
        showError(errMsg)
      } else {
        this.createLocalPet()
      }
    } finally {
      this.setData({ loading: false })
    }
  },

  createLocalPet() {
    try {
      const petId = Date.now().toString()
      const newPet = {
        id: petId,
        name: this.data.petForm.name,
        category: this.data.petForm.category,
        gender: this.data.petForm.gender,
        alias: this.data.petForm.alias,
        price: this.data.petForm.price,
        status: this.data.petForm.status || '正常',
        father: this.data.petForm.father,
        fatherName: this.data.petForm.fatherName,
        mother: this.data.petForm.mother,
        motherName: this.data.petForm.motherName,
        partner: this.data.petForm.partner,
        partnerName: this.data.petForm.partnerName,
        photos: this.data.petForm.photos || []
      }
      const pets = [...this.data.pets, newPet]
      wx.setStorageSync('pets', sanitizePetPhotos(pets))
      this.setData({ pets })
      this.updateFilteredPets()
      this.setData({ showModal: false })
      showSuccess('创建成功')

      // 本地创建建档记录
      this.createLocalArchiveRecord(petId, newPet.name, newPet.photos)
      // 本地创建操作足迹
      this.createLocalActionFootprint('建档', petId, newPet.name, `为「${newPet.name}」建立了档案`, newPet.photos)
    } catch (error) {
      console.error('创建宠物失败:', error)
      showError('创建失败')
    }
  },

  // 本地创建建档记录
  createLocalArchiveRecord(petId, petName, photos) {
    try {
      const now = new Date()
      const records = wx.getStorageSync('records') || []
      const newRecord = {
        id: Date.now().toString(),
        petId: petId,
        type: '建档',
        date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
        weight: '',
        length: '',
        temperature: '',
        humidity: '',
        food: '',
        defecation: '',
        state: '正常',
        notes: `${petName}成功建档，开启陪伴之旅！`,
        photos: photos && photos.length > 0 ? photos : []
      }
      records.unshift(newRecord)
      wx.setStorageSync('records', records)
    } catch (error) {
      console.error('创建本地建档记录失败:', error)
    }
  },

  // 本地创建操作足迹
  createLocalActionFootprint(action, petId, petName, description, photos) {
    try {
      const now = new Date()
      const footprints = wx.getStorageSync('footprints') || []
      const newFootprint = {
        id: Date.now().toString(),
        type: 'action',
        action: action,
        petId: petId,
        petName: petName,
        description: description,
        photos: photos && photos.length > 0 ? photos : [],
        date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
        time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      }
      footprints.unshift(newFootprint)
      wx.setStorageSync('footprints', footprints)
    } catch (error) {
      console.error('创建本地操作足迹失败:', error)
    }
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id
    if (id) {
      wx.navigateTo({
        url: '/pages/pet/detail?petId=' + id
      })
    }
  },

  showRecordModal(e) {
    const pet = e.currentTarget.dataset.pet
    if (!pet) return

    this.setData({
      showRecordModal: true,
      currentPet: pet,
      recordTab: '全部'
    })
    this.loadPetRecords(pet.id || pet._id)
  },

  hideRecordModal() {
    this.setData({
      showRecordModal: false,
      currentPet: null
    })
  },

  setRecordTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ recordTab: tab })
    this.filterRecordsByTab(tab)
  },

  async loadPetRecords(petId) {
    try {
      const result = await API.getRecordList(petId)
      if (result.success) {
        this.setData({ allRecords: result.data })
        this.filterRecordsByTab(this.data.recordTab)
      } else {
        this.setData({ allRecords: [], currentRecords: [] })
      }
    } catch (error) {
      console.error('加载记录失败:', error)
      const allRecords = wx.getStorageSync('records') || []
      const petRecords = allRecords.filter(r => r.petId === petId)
      this.setData({ allRecords: petRecords })
      this.filterRecordsByTab(this.data.recordTab)
    }
  },

  filterRecordsByTab(tab) {
    const all = this.data.allRecords || []
    if (tab === '全部') {
      this.setData({ currentRecords: all })
    } else {
      this.setData({ currentRecords: all.filter(r => r.type === tab) })
    }
  },

  goAddRecord() {
    const pet = this.data.currentPet
    if (!pet) return
    this.setData({ showRecordModal: false })
    wx.navigateTo({
      url: '/pages/pet/detail?petId=' + (pet.id || pet._id)
    })
  },

  // ========== 长按卡片 ==========
  onCardLongPress(e) {
    const pet = e.currentTarget.dataset.pet
    if (!pet) return

    wx.vibrateShort({ type: 'medium' })

    wx.showActionSheet({
      itemList: ['进入编辑模式', '删除该宠物'],
      itemColor: '#E8A400',
      success: (res) => {
        if (res.tapIndex === 0) {
          // 进入编辑模式并选中当前卡片
          this.setData({
            isEditMode: true,
            selectedIds: [pet.id],
            allSelected: false
          })
        } else if (res.tapIndex === 1) {
          // 删除单个宠物
          wx.showModal({
            title: '确认删除',
            content: `确定删除「${pet.alias || pet.name}」吗？`,
            confirmColor: '#E76F51',
            success: (res) => {
              if (res.confirm) {
                this.doDeletePets([pet.id])
              }
            }
          })
        }
      }
    })
  },

  // ========== 编辑模式 ==========
  enterEditMode() {
    this.setData({
      isEditMode: true,
      selectedIds: [],
      allSelected: false
    })
  },

  exitEditMode() {
    this.setData({
      isEditMode: false,
      selectedIds: [],
      allSelected: false
    })
  },

  toggleSelect(e) {
    const id = e.currentTarget.dataset.id
    const { selectedIds } = this.data
    const filteredPets = this.data.filteredPets || []
    const index = selectedIds.indexOf(id)

    if (index === -1) {
      selectedIds.push(id)
    } else {
      selectedIds.splice(index, 1)
    }

    this.setData({
      selectedIds,
      allSelected: selectedIds.length === filteredPets.length
    })
  },

  toggleSelectAll() {
    const { filteredPets, allSelected } = this.data
    if (allSelected) {
      this.setData({ selectedIds: [], allSelected: false })
    } else {
      this.setData({
        selectedIds: (filteredPets || []).map(p => p.id),
        allSelected: true
      })
    }
  },

  // ========== 拖拽排序 ==========
  onDragStart(e) {
    const id = e.currentTarget.dataset.id
    const index = e.currentTarget.dataset.index
    const touch = e.touches[0]
    
    // 立即振动反馈
    wx.vibrateShort({ type: 'light' })

    // Measure card height once
    const query = wx.createSelectorQuery()
    query.select('.pet-card').boundingClientRect()
    query.exec((res) => {
      const rect = res[0]
      const cardHeight = rect ? rect.height : 200 // fallback in px
      this._cardHeight = cardHeight

      // Mark dragging
      const filteredPets = this.data.filteredPets || []
      const pets = [...filteredPets]
      pets[index]._dragging = true
      this.setData({ filteredPets: pets })

      this._dragData = {
        id,
        index,
        startX: touch.clientX,
        startY: touch.clientY,
        offsetY: 0,
        lastSwapped: -1,
        lastSwapTime: Date.now()
      }
    })
  },

  onDragMove(e) {
    if (!this._dragData) return
    
    const touch = e.touches[0]
    const dy = touch.clientY - this._dragData.startY
    this._dragData.offsetY = dy

    const filteredPets = this.data.filteredPets || []
    const pets = [...filteredPets]
    const currentIndex = this._dragData.index
    
    // 更新当前拖动项的偏移
    pets[currentIndex]._dragOffset = dy
    this.setData({ filteredPets: pets })

    // 计算目标位置
    const cardH = this._cardHeight || 200
    const offsetIndex = Math.round(dy / cardH)
    const targetIndex = Math.max(0, Math.min(pets.length - 1, currentIndex + offsetIndex))

    // 限制交换频率，提升流畅度
    const now = Date.now()
    if (targetIndex !== currentIndex && 
        targetIndex !== this._dragData.lastSwapped && 
        now - this._dragData.lastSwapTime > 80) {
      
      // 交换项
      const [moved] = pets.splice(currentIndex, 1)
      pets.splice(targetIndex, 0, moved)
      
      // 重置偏移并更新索引
      moved._dragOffset = 0
      this._dragData.index = targetIndex
      this._dragData.lastSwapped = targetIndex
      this._dragData.lastSwapTime = now
      this._dragData.startY = touch.clientY
      
      // 交换时振动反馈
      wx.vibrateShort({ type: 'light' })
      
      this.setData({ filteredPets: pets })
    }
  },

  onDragEnd() {
    if (!this._dragData) return
    
    const filteredPets = this.data.filteredPets || []
    const pets = [...filteredPets]
    const idx = this._dragData.index
    
    // 重置所有拖动状态
    pets.forEach((pet) => {
      pet._dragging = false
      pet._dragOffset = 0
    })
    
    // 只更新 filteredPets，不要覆盖原始 pets 数组
    this.setData({
      filteredPets: pets
    })
    
    // 根据 filteredPets 的排序更新完整的 pets 数组
    const allPets = [...this.data.pets] || []
    const petIdOrder = pets.map(p => p.id || p._id)
    
    // 按照 filteredPets 的顺序重新排列 allPets
    const sortedPets = allPets.sort((a, b) => {
      const idA = a.id || a._id
      const idB = b.id || b._id
      const indexA = petIdOrder.indexOf(idA)
      const indexB = petIdOrder.indexOf(idB)
      // 在排序中的排在前面，不在排序中的放在后面
      return (indexA === -1 ? petIdOrder.length : indexA) - (indexB === -1 ? petIdOrder.length : indexB)
    })
    
    // 保存排序到本地存储
    wx.setStorageSync('pets', sanitizePetPhotos(sortedPets))
    
    // 排序完成振动反馈
    wx.vibrateShort({ type: 'medium' })
    
    this._dragData = null
    this._cardHeight = null
  },

  clearDragState() {
    this._dragData = null
    this._cardHeight = null
  },

  // ========== 删除 ==========
  deleteSelected() {
    const { selectedIds } = this.data
    if (selectedIds.length === 0) {
      wx.showToast({ title: '请先选择宠物', icon: 'none' })
      return
    }

    wx.showModal({
      title: '确认删除',
      content: `确定删除选中的 ${selectedIds.length} 个宠物吗？`,
      confirmColor: '#E76F51',
      success: (res) => {
        if (res.confirm) {
          this.doDeletePets(selectedIds)
        }
      }
    })
  },

  doDeletePets(ids) {
    const app = getApp()
    if (!app.requireLogin()) return

    const pets = this.data.pets || []
    const filteredPets = this.data.filteredPets || []
    const idSet = new Set(ids)

    // 将删除的宠物添加到回收站
    try {
      let recycleBin = wx.getStorageSync('recycleBin') || []
      const deletedPets = pets.filter(p => idSet.has(p.id))
      
      deletedPets.forEach(pet => {
        // 添加删除时间
        pet.deleteTime = this._formatDateTime(new Date())
        recycleBin.unshift(pet)
      })
      
      // 只保留最近50条记录
      if (recycleBin.length > 50) {
        recycleBin = recycleBin.slice(0, 50)
      }
      
      wx.setStorageSync('recycleBin', recycleBin)
    } catch (e) {
      console.error('添加到回收站失败:', e)
    }

    // 更新本地数据
    const newPets = pets.filter(p => !idSet.has(p.id))
    const newFiltered = filteredPets.filter(p => !idSet.has(p.id))

    this.setData({
      pets: newPets,
      filteredPets: newFiltered,
      selectedIds: [],
      allSelected: false,
      isEditMode: false
    })

    wx.setStorageSync('pets', sanitizePetPhotos(newPets))
    wx.showToast({ title: '删除成功', icon: 'success' })

    // 尝试调用云函数删除
    ids.forEach(id => {
      API.deletePet(id).catch(err => console.error('云端删除失败:', err))
    })
  },

  // 格式化日期时间
  _formatDateTime: function (date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hour = String(date.getHours()).padStart(2, '0')
    const minute = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day} ${hour}:${minute}`
  },

  // 创建建档记录
  async createArchiveRecord(petId, petName, photos) {
    try {
      const now = new Date()
      const recordData = {
        petId: petId,
        type: '建档',
        date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
        weight: '',
        length: '',
        temperature: '',
        humidity: '',
        food: '',
        defecation: '',
        state: '正常',
        notes: `${petName}成功建档，开启陪伴之旅！`,
        photos: photos && photos.length > 0 ? photos : []
      }

      const result = await API.createRecord(recordData)
      
      if (result.success) {
        // 更新本地记录缓存
        const records = wx.getStorageSync('records') || []
        const newRecord = {
          id: result.data ? result.data.id : Date.now().toString(),
          ...recordData
        }
        records.unshift(newRecord)
        wx.setStorageSync('records', records)
      }
    } catch (error) {
      console.error('创建建档记录失败:', error)
    }
  },

  // 创建操作足迹
  async createActionFootprint(action, petId, petName, description, photos) {
    try {
      const now = new Date()
      const footprintData = {
        type: 'action',
        action: action,
        petId: petId,
        petName: petName,
        description: description,
        photos: photos && photos.length > 0 ? photos : [],
        date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
        time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      }

      const result = await API.createFootprint(footprintData)
      
      if (result.success) {
        // 更新本地足迹缓存
        const footprints = wx.getStorageSync('footprints') || []
        const newFootprint = {
          id: result.data ? result.data.id : Date.now().toString(),
          ...footprintData
        }
        footprints.unshift(newFootprint)
        wx.setStorageSync('footprints', footprints)
      }
    } catch (error) {
      console.error('创建操作足迹失败:', error)
    }
  },

  goToCalculator: function () {
    wx.navigateTo({ url: '/subpkg-tools/pages/tools/calculator' })
  },

  goToLogin: function () {
    const app = getApp()
    app.requireLogin()
  },

})
