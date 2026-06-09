const { getAPI } = require('../../utils/api.js')
const { showError, showSuccess, showLoading, hideLoading, showConfirm } = require('../../utils/error.js')
const { getVoiceManager } = require('../../utils/voice.js')
const { convertPetPhotosToUrls, convertPhotoIdsToUrls, sanitizePetPhotos, getTempUrl } = require('../../utils/image.js')
const { getCache, setCache } = require('../../utils/cache.js')
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
    switchColor: '#2D6A4F',
    showSkeleton: true,
    filter: {
      series: '全部',
      gender: '全部',
      status: '全部'
    },
    petForm: {
      name: '',
      category: '无',
      gender: '公',
      alias: '',
      father: '',
      mother: '',
      isPublic: false,
      photos: []
    },
    categories: ['无'],
    showAddCategoryModal: false,
    newCategoryName: '',
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
    fatherList: [],
    motherList: [],
    fatherSearchText: '',
    motherSearchText: '',
    selectedFather: null,
    selectedMother: null,
    isEditingCategories: false,
    pageNum: 1,
    pageSize: 4,
    hasMore: true,
    total: 0,
    refreshing: false
  },

  onLoad() {
    const sysInfo = wx.getSystemInfoSync()
    const statusBarHeight = Math.max(sysInfo.statusBarHeight || 20, 20)
    const safeAreaTop = sysInfo.safeArea ? (sysInfo.safeArea.top || statusBarHeight) : statusBarHeight
    const finalStatusBarHeight = Math.max(statusBarHeight, safeAreaTop)
    const rpxRatio = 750 / sysInfo.windowWidth
    const totalNavHeight = Math.round(finalStatusBarHeight * rpxRatio) + 88 + 24
    this.setData({ statusBarHeight: finalStatusBarHeight, totalNavHeight })
    this.loadCategories()
    this.loadPets()
  },

  onShow() {
    const app = getApp()
    // 主动更新tabBar选中状态，并确保 tabBar 可见
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      const tabBar = this.getTabBar()
      tabBar.setData({ selected: 0, visible: true })
    }
    // 只在没有数据时显示骨架屏，避免频繁显示
    if (this.data.pets.length === 0) {
      this.setData({ showSkeleton: true })
    }
    // 始终加载最新数据
    this.loadPets()
  },

  onReachBottom() {
    this.loadMorePets()
  },

  onPullDownRefresh() {
    this.setData({ refreshing: true })
    this.loadPets(true).then(() => {
      this.setData({ refreshing: false })
      wx.stopPullDownRefresh()
    }).catch(() => {
      this.setData({ refreshing: false })
      wx.stopPullDownRefresh()
    })
  },

  loadCategories() {
    try {
      const savedCategories = wx.getStorageSync('categories')
      if (savedCategories && savedCategories.length > 0) {
        this.setData({ categories: savedCategories })
      }
    } catch (error) {
      console.error('加载分类失败:', error)
    }
  },

  async loadPets(reset = true) {
    if (reset) {
      this.setData({ loading: true, pageNum: 1, hasMore: true, pets: [], filteredPets: [] })
    } else {
      if (this.data.loadingMore || !this.data.hasMore) return
      this.setData({ loadingMore: true })
    }

    try {
      const result = await API.getPetList(this.data.filter, this.data.pageNum, this.data.pageSize)

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
          if ((!pet.photos || pet.photos.length === 0) && local && local.photos && local.photos.length > 0) {
            return { ...pet, photos: local.photos }
          }
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
        let newPets = reset ? validPetsWithUrls : [...(this.data.pets || []), ...validPetsWithUrls]
        
        // 存入缓存时净化图片URL，确保只存储cloud://fileID
        try {
          wx.setStorageSync('pets', sanitizePetPhotos(newPets))
        } catch (e) {
          console.error('缓存宠物数据失败:', e)
        }
        
        this.setData({
          pets: newPets || [],
          cloudAvailable: true,
          hasMore: result.data.hasMore !== undefined ? result.data.hasMore : petList.length === this.data.pageSize,
          total: result.data.total || (newPets || []).length,
          pageNum: reset ? 2 : this.data.pageNum + 1,
          showSkeleton: false
        })
        this.computePetStatuses()
        this.updateFilteredPets()
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error('云函数调用失败，使用本地数据:', error)
      if (reset) {
        this.loadLocalPets()
      }
    } finally {
      this.setData({ loading: false, loadingMore: false })
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

      this.setData({ pets: pets || [], filteredPets: pets || [], cloudAvailable: false, showSkeleton: false })
    } catch (error) {
      console.error('加载宠物列表失败:', error)
      this.setData({ pets: [], filteredPets: [], showSkeleton: false })
    }
  },

  updateFilteredPets() {
    const pets = this.data.pets || []
    let result = [...pets]

    if (this.data.filter.series !== '全部') {
      result = result.filter(pet => pet.category === this.data.filter.series)
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

  showAddModal() {
    const app = getApp()
    if (!app.requireLogin()) return

    // 从本地存储读取用户的手动配置展开/收起习惯
    let savedShowManual = false
    try {
      savedShowManual = wx.getStorageSync('showManual')
    } catch (error) {
      console.error('读取手动配置状态失败:', error)
    }
    
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
        father: '',
        fatherName: '',
        mother: '',
        motherName: '',
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

  selectCategory(e) {
    this.setData({ 'petForm.category': e.currentTarget.dataset.category })
  },

  selectGender(e) {
    this.setData({ 'petForm.gender': e.currentTarget.dataset.gender })
  },

  onPublicSwitchChange: function (e) {
    this.setData({ 'petForm.isPublic': e.detail.value })
  },

  selectParent(e) {
    const parent = e.currentTarget.dataset.parent
    if (parent === 'father') {
      this.setData({ showFatherModal: true, fatherSearchText: '', fatherList: [] })
      this.loadParentsAsync('father')
    } else {
      this.setData({ showMotherModal: true, motherSearchText: '', motherList: [] })
      this.loadParentsAsync('mother')
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
        } else {
          const motherList = petsWithUrls.filter(p => p.gender === '母')
          this.setData({ motherList })
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

  clearFather() {
    this.setData({ selectedFather: null, 'petForm.father': '', 'petForm.fatherName': '' })
  },

  clearMother() {
    this.setData({ selectedMother: null, 'petForm.mother': '', 'petForm.motherName': '' })
  },

  onFatherSearch(e) {
    const searchText = e.detail.value
    this.setData({ fatherSearchText: searchText })
    const localPets = wx.getStorageSync('pets') || []
    const fatherList = localPets.filter(p => p.gender === '公' &&
      (p.name && p.name.includes(searchText)))
    this.setData({ fatherList })
  },

  onMotherSearch(e) {
    const searchText = e.detail.value
    this.setData({ motherSearchText: searchText })
    const localPets = wx.getStorageSync('pets') || []
    const motherList = localPets.filter(p => p.gender === '母' &&
      (p.name && p.name.includes(searchText)))
    this.setData({ motherList })
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

  confirmAddCategory() {
    const name = this.data.newCategoryName.trim()

    if (!name) {
      showError('请输入分类名称')
      return
    }

    if (this.data.categories.includes(name)) {
      showError('分类已存在')
      return
    }

    const categories = [...this.data.categories, name]
    this.setData({
      categories,
      showAddCategoryModal: false,
      'petForm.category': name
    })

    wx.setStorageSync('categories', categories)
    showSuccess('添加成功')
  },

  startEditCategories() {
    this.setData({ isEditingCategories: true })
    wx.vibrateShort()
  },

  exitEditCategories() {
    this.setData({ isEditingCategories: false })
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

    if (categories.length <= 1) {
      this.setData({ isEditingCategories: false })
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
    wx.chooseImage({
      count: maxCount,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: function (res) {
        const tempFilePaths = res.tempFilePaths
        const newPhotos = [...that.data.petForm.photos, ...tempFilePaths]
        that.setData({ 'petForm.photos': newPhotos })
      },
      fail: function (error) {
        console.error('选择图片失败:', error)
        showError('选择图片失败')
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

  startVoice(e) {
    const field = e.currentTarget.dataset.field
    voiceManager.startRecording(field, (fieldName, text) => {
      if (fieldName === 'name') {
        this.setData({ 'petForm.name': text })
      } else if (fieldName === 'alias') {
        this.setData({ 'petForm.alias': text })
      }
    })
  },

  stopVoice() {
    voiceManager.stopRecording()
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
              const result = await API.uploadImage(filePath)
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
          alias: this.data.petForm.alias,
          father: this.data.petForm.father,
          fatherName: this.data.petForm.fatherName,
          mother: this.data.petForm.mother,
          motherName: this.data.petForm.motherName,
          status: '正常',
          photos: finalPhotos
        }

        const updatedPets = [newPet, ...this.data.pets]
        wx.setStorageSync('pets', sanitizePetPhotos(updatedPets))
        this.setData({ pets: updatedPets })
        this.updateFilteredPets()

        showSuccess('创建成功')
        this.setData({ showModal: false })

        // 创建默认"建档"记录
        await this.createArchiveRecord(petId, newPet.name, finalPhotos)
        
        // 创建操作足迹
        await this.createActionFootprint('建档', petId, newPet.name, `为「${newPet.name}」建立了档案`)

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
        father: this.data.petForm.father,
        fatherName: this.data.petForm.fatherName,
        mother: this.data.petForm.mother,
        motherName: this.data.petForm.motherName,
        status: '正常',
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
      this.createLocalActionFootprint('建档', petId, newPet.name, `为「${newPet.name}」建立了档案`)
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
        photos: photos && photos.length > 0 ? [photos[0]] : []
      }
      records.unshift(newRecord)
      wx.setStorageSync('records', records)
    } catch (error) {
      console.error('创建本地建档记录失败:', error)
    }
  },

  // 本地创建操作足迹
  createLocalActionFootprint(action, petId, petName, description) {
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
      itemColor: '#2D6A4F',
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
    const touch = e.touches[0]
    const index = this.data.filteredPets.findIndex(p => p.id === id)
    if (index < 0) return

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
        offsetY: 0
      }
    })
  },

  onDragMove(e) {
    if (!this._dragData) return
    const touch = e.touches[0]
    const dy = touch.clientY - this._dragData.startY
    this._dragData.offsetY = dy

    // Update drag position
    const index = this._dragData.index
      const filteredPets = this.data.filteredPets || []
      const pets = [...filteredPets]
    pets[index]._dragOffset = dy
    this.setData({ filteredPets: pets })

    // Calculate target index based on displacement
    const cardH = this._cardHeight || 200
    const offsetIndex = Math.round(dy / cardH)
    const targetIndex = Math.max(0, Math.min(pets.length - 1, index + offsetIndex))

    // Swap if target differs and hasn't been applied yet
    if (targetIndex !== index && targetIndex !== this._dragData.lastSwapped) {
      // Swap items
      const [moved] = pets.splice(index, 1)
      pets.splice(targetIndex, 0, moved)
      // Reset offset and update indices
      moved._dragOffset = 0
      this._dragData.index = targetIndex
      this._dragData.lastSwapped = targetIndex
      this._dragData.startY = touch.clientY
      this.setData({ filteredPets: pets })
    }
  },

  onDragEnd() {
    if (!this._dragData) return
    const filteredPets = this.data.filteredPets || []
    const pets = [...filteredPets]
    const idx = this._dragData.index
    if (pets[idx]) {
      pets[idx]._dragging = false
      pets[idx]._dragOffset = 0
    }
    this.setData({
      filteredPets: pets,
      pets: pets
    })
    wx.setStorageSync('pets', sanitizePetPhotos(pets))
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
        photos: photos && photos.length > 0 ? [photos[0]] : []
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
  async createActionFootprint(action, petId, petName, description) {
    try {
      const now = new Date()
      const footprintData = {
        type: 'action',
        action: action,
        petId: petId,
        petName: petName,
        description: description,
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

})
