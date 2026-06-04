const { getAPI } = require('../../utils/api.js')
const { showError, showSuccess, showLoading, hideLoading, showConfirm } = require('../../utils/error.js')
const { getVoiceManager } = require('../../utils/voice.js')
const { convertPhotoIdsToUrls, getTempUrl, convertPetPhotosToUrls, sanitizePetPhotos } = require('../../utils/image.js')
const ThemeManager = require('../../utils/theme.js')

const API = getAPI()
const voiceManager = getVoiceManager()

Page({
  data: {
    currentEventTab: '全部事件',
    pressedTab: '',
    pet: null,
    petId: '',
    loading: true,
    showEditModal: false,
    showDeleteConfirm: false,
    showAddRecordModal: false,
    showFatherModal: false,
    showMotherModal: false,
    showTimelineModal: false,
    showRecordModal: false,
    currentRecord: null,
    selectedDate: '',
    endDate: '',
    today: '',
    switchColor: '#B8860B',
    editForm: {
      name: '',
      category: '',
      gender: '',
      alias: '',
      father: '',
      fatherName: '',
      mother: '',
      motherName: '',
      status: '正常',
      isPublic: false,
      photos: []
    },
    selectedFather: null,
    selectedMother: null,
    fatherList: [],
    motherList: [],
    fatherSearchText: '',
    motherSearchText: '',
    editPhotoList: [],    // 编辑弹窗中的图片列表（含临时路径和cloud路径）
    photoUploading: false,
    records: [],
    filteredRecords: [],
    groupedRecords: [],
    recordType: '全部',
    recordTypes: ['全部', '建档', '交配', '产蛋', '日常', '健康', '繁育', '换公'],
    newRecord: {
      type: '日常',
      text: ''
    },
    currentTheme: 'gold',
    // 语音输入相关
    currentVoiceField: '',
    tempVoicePath: '',
    isRecording: false,
    // 语音按钮拖动位置
    voiceBtnX: 300,
    voiceBtnY: 400,
    voiceBtnStartX: 0,
    voiceBtnStartY: 0,
    voiceBtnTouchStartX: 0,
    voiceBtnTouchStartY: 0,
    // 公开模式 - 仅查看权限
    isPublicMode: false,
    // 打印机配置
    printerConfig: {
      enabled: false,
      autoPrint: false,
      connected: false,
      deviceId: '',
      deviceName: ''
    },
    // 家族谱系
    showPedigree: false,
    pedigreeData: null,
    pedigreeStats: {
      totalAncestors: 0,
      maleCount: 0,
      femaleCount: 0,
      maxDepth: 0
    },
    paternalLine: [],
    maternalLine: [],
    bloodlineTab: 'paternal'
  },

  pressTab: function (e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ pressedTab: tab })
  },

  releaseTab: function (e) {
    this.setData({ pressedTab: '' })
  },

  onLoad: function (options) {
    const app = getApp()
    const isPublic = options && options.public === '1'
    
    this.setData({ isPublicMode: isPublic })
    
    // 初始化 today 供 picker 使用（WXML 不支持调用 JS 函数）
    const now = new Date()
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    this.setData({ today: today })
    
    // 加载打印机配置
    this.loadPrinterConfig()
    
    if (!isPublic) {
      if (!app.checkLogin()) return
    }
    
    this.loadTheme()
    
    let petId = ''
    if (options && options.petId) {
      petId = options.petId
    } else if (options && options.id) {
      petId = options.id
    }
    
    if (petId) {
      this.setData({ petId })
      this.loadPetDetail(petId)
      this.loadRecords(petId)
      // 静默加载谱系数据（用于收起状态预览），只在首次加载
      if (!this.data.pedigreeData) {
        this.loadPedigree()
      }
    } else {
      showError('宠物ID不存在')
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }
  },

  onShow: function () {
    const app = getApp()
    if (!app.globalData.isLoggedIn) return
    this.loadTheme()
  },

  loadTheme: function () {
    const currentTheme = ThemeManager.getCurrentTheme()
    const switchColor = ThemeManager.getThemeConfig(currentTheme).primary
    this.setData({ currentTheme, switchColor })
  },

  loadPrinterConfig: function () {
    try {
      const savedConfig = wx.getStorageSync('printerConfig')
      if (savedConfig) {
        this.setData({ printerConfig: savedConfig })
      }
    } catch (error) {
      console.error('加载打印机配置失败:', error)
    }
  },

  printRecord: function () {
    const { printerConfig, currentRecord, pet } = this.data
    
    if (!printerConfig.enabled || !printerConfig.connected) {
      showError('打印机未连接')
      return
    }
    
    if (!printerConfig.autoPrint) {
      showError('未开启自动打印')
      return
    }
    
    showLoading('正在打印...')
    
    // 生成打印内容
    const printContent = this.generateRecordPrintContent(currentRecord, pet)
    
    // 发送打印数据
    this.sendPrintData(printContent, () => {
      hideLoading()
      showSuccess('打印成功')
    }, (error) => {
      hideLoading()
      showError('打印失败: ' + error)
    })
  },

  printNewRecord: function () {
    const { printerConfig, newRecord, pet } = this.data
    
    if (!printerConfig.enabled || !printerConfig.connected) {
      showError('打印机未连接')
      return
    }
    
    if (!printerConfig.autoPrint) {
      showError('未开启自动打印')
      return
    }

    if (!newRecord.text) {
      showError('请先输入记录内容')
      return
    }
    
    showLoading('正在打印...')
    
    // 生成打印内容
    const now = new Date()
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    
    const record = {
      type: newRecord.type,
      text: newRecord.text,
      date: date,
      time: time
    }
    
    const printContent = this.generateRecordPrintContent(record, pet)
    
    // 发送打印数据
    this.sendPrintData(printContent, () => {
      hideLoading()
      showSuccess('打印成功')
    }, (error) => {
      hideLoading()
      showError('打印失败: ' + error)
    })
  },

  generateRecordPrintContent: function (record, pet) {
    const lines = []
    lines.push('========================')
    lines.push('种龟事件记录')
    lines.push('========================')
    lines.push('')
    lines.push('宠物名称: ' + (pet ? pet.name : '未知'))
    lines.push('事件类型: ' + record.type)
    lines.push('事件内容: ' + record.text)
    lines.push('记录时间: ' + record.date + (record.time ? ' ' + record.time : ''))
    lines.push('')
    lines.push('========================')
    return lines.join('\n')
  },

  sendPrintData: function (content, success, fail) {
    const { printerConfig } = this.data
    
    if (!printerConfig.deviceId) {
      if (fail) fail('未连接打印机')
      return
    }
    
    // 使用蓝牙发送打印数据
    wx.writeBLECharacteristicValue({
      deviceId: printerConfig.deviceId,
      serviceId: printerConfig.serviceId || '0000FF00-0000-1000-8000-00805F9B34FB',
      characteristicId: printerConfig.writeCharacteristicId || '0000FF02-0000-1000-8000-00805F9B34FB',
      value: this.stringToBuffer(content),
      success: (res) => {
        if (success) success(res)
      },
      fail: (err) => {
        console.error('打印失败:', err)
        if (fail) fail(err.errMsg || '发送失败')
      }
    })
  },

  stringToBuffer: function (str) {
    const buffer = new ArrayBuffer(str.length)
    const dataView = new DataView(buffer)
    for (let i = 0; i < str.length; i++) {
      dataView.setUint8(i, str.charCodeAt(i))
    }
    return buffer
  },

  loadPetDetail: async function (petId) {
    this.setData({ loading: true })
    
    try {
      const result = await API.getPetById(petId)
      
      if (result.success) {
        const petData = result.data
        
        // 如果云函数返回的数据缺少 fatherName/motherName，根据 father/mother ID 查询
        if (petData.father && !petData.fatherName) {
          try {
            const fatherResult = await API.getPetById(petData.father)
            if (fatherResult.success && fatherResult.data) {
              const fatherData = fatherResult.data
              // 优先显示别名，没有别名则显示名称
              petData.fatherName = fatherData.alias || fatherData.name
              petData.fatherGender = fatherData.gender
            }
          } catch (e) {
            console.error('查询父本失败:', e)
          }
        }
        
        if (petData.mother && !petData.motherName) {
          try {
            const motherResult = await API.getPetById(petData.mother)
            if (motherResult.success && motherResult.data) {
              const motherData = motherResult.data
              // 优先显示别名，没有别名则显示名称
              petData.motherName = motherData.alias || motherData.name
              petData.motherGender = motherData.gender
            }
          } catch (e) {
            console.error('查询母本失败:', e)
          }
        }
        
        this.setPetData(petData)
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error('云函数调用失败，使用本地数据:', error)
      this.loadLocalPetDetail(petId)
    } finally {
      this.setData({ loading: false })
    }
  },

  loadLocalPetDetail: function (petId) {
    try {
      const pets = wx.getStorageSync('pets') || []
      console.log('本地存储的所有宠物:', pets)
      const pet = pets.find(p => String(p.id) === String(petId))
      console.log('找到的本地宠物:', pet)
      
      if (pet) {
        this.setPetData(pet)
      } else {
        showError('宠物不存在')
        setTimeout(() => {
          wx.navigateBack()
        }, 2000)
      }
    } catch (error) {
      console.error('获取宠物详情失败:', error)
      showError('加载失败')
      setTimeout(() => {
        wx.navigateBack()
      }, 2000)
    }
  },

  setPetData: async function (pet) {
    console.log('setPetData 接收到的宠物数据:', pet)
    console.log('father:', pet.father, 'fatherName:', pet.fatherName)
    console.log('mother:', pet.mother, 'motherName:', pet.motherName)
    
    const statusMap = {
      '正常': 'normal',
      '待配': 'pending',
      '预警': 'warning'
    }
    
    // 转换云存储图片URL
    let convertedPhotos = pet.photos || []
    if (convertedPhotos.length > 0) {
      // 检查是否有需要转换的图片（cloud:// 或过期的临时URL）
      const needsConversion = convertedPhotos.some(p => 
        p && (p.startsWith('cloud://') || p.includes('tcb.qcloud.la'))
      )
      if (needsConversion) {
        try {
          convertedPhotos = await convertPhotoIdsToUrls(convertedPhotos)
        } catch (error) {
          console.error('图片URL转换失败:', error)
        }
      }
      // 过滤掉转换失败的空值
      convertedPhotos = convertedPhotos.filter(p => p && p.length > 0)
    }
    
    this.setData({ 
      pet: { ...pet, photos: convertedPhotos },
      statusClass: statusMap[pet.status] || 'normal',
      editForm: {
        name: pet.name,
        category: pet.category,
        gender: pet.gender,
        alias: pet.alias || '',
        father: pet.father || '',
        fatherName: pet.fatherName || '',
        mother: pet.mother || '',
        motherName: pet.motherName || '',
        status: pet.status,
        isPublic: pet.isPublic || false,
        photos: convertedPhotos
      },
      editPhotoList: convertedPhotos
    })
  },

  // 图片加载失败处理
  onImageError: function (e) {
    const { id } = e.currentTarget.dataset
    console.error('图片加载失败, petId:', id)
    
    // 尝试重新转换URL
    const { pet } = this.data
    if (pet && pet.photos && pet.photos.length > 0) {
      // 清除缓存并重新获取临时URL
      const { getCache, setCache } = require('../../utils/cache.js')
      const URL_CACHE_KEY = 'cloud_url_cache'
      const urlCache = getCache(URL_CACHE_KEY, {})
      
      // 清除所有该宠物的图片缓存
      pet.photos.forEach(photo => {
        if (photo.startsWith('cloud://')) {
          delete urlCache[photo]
        }
      })
      setCache(URL_CACHE_KEY, urlCache, 300)
      
      // 重新加载宠物数据
      this.loadPetDetail(this.data.petId)
    }
  },

  loadRecords: async function (petId) {
    try {
      const result = await API.getRecordList(petId)
      
      if (result.success) {
        // 适配分页数据结构
        const recordList = result.data.list || result.data || []
        const sortedRecords = this.sortRecords(recordList)
        this.setData({ 
          records: sortedRecords,
          filteredRecords: sortedRecords,
          groupedRecords: this.groupRecordsByDate(sortedRecords)
        })
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error('云函数调用失败，使用本地数据:', error)
      this.loadLocalRecords(petId)
    }
  },

  loadLocalRecords: function (petId) {
    try {
      const allRecords = wx.getStorageSync('records') || []
      const petRecords = allRecords.filter(r => r.petId === petId)
      const sortedRecords = this.sortRecords(petRecords)
      this.setData({ 
        records: sortedRecords,
        filteredRecords: sortedRecords,
        groupedRecords: this.groupRecordsByDate(sortedRecords)
      })
    } catch (error) {
      console.error('加载记录失败:', error)
    }
  },
  
  sortRecords: function (records) {
    return [...records].sort((a, b) => {
      const dateA = a.date + ' ' + a.time
      const dateB = b.date + ' ' + b.time
      return dateB.localeCompare(dateA)
    })
  },
  
  groupRecordsByDate: function (records) {
    const groups = {}
    
    records.forEach(record => {
      if (!groups[record.date]) {
        groups[record.date] = []
      }
      groups[record.date].push(record)
    })
    
    const result = Object.keys(groups).map(date => ({
      date: date,
      count: groups[date].length,
      records: groups[date]
    }))
    
    result.sort((a, b) => b.date.localeCompare(a.date))
    
    return result
  },

  setEventTab: function (e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ currentEventTab: tab })
    this.filterRecords()
  },

  filterRecords: function () {
    const tabMap = {
      '全部事件': '全部',
      '交配': '交配',
      '产蛋': '产蛋',
      '换公': '换公'
    }
    const filterType = tabMap[this.data.currentEventTab] || '全部'
    const selectedDate = this.data.selectedDate
    const endDate = this.data.endDate

    let filtered = [...this.data.records]

    if (filterType !== '全部') {
      filtered = filtered.filter(r => r.type === filterType)
    }

    if (selectedDate && endDate) {
      filtered = filtered.filter(r => r.date >= selectedDate && r.date <= endDate)
    } else if (selectedDate) {
      filtered = filtered.filter(r => r.date === selectedDate)
    }

    this.setData({
      filteredRecords: filtered,
      groupedRecords: this.groupRecordsByDate(filtered)
    })
  },
  
  selectDate: function () {
    const today = new Date()
    const currentDate = this.data.selectedDate || today.toISOString().split('T')[0]
    
    wx.showActionSheet({
      itemList: this.getDateOptions(),
      success: (res) => {
        const options = this.getDateOptions()
        const selectedOption = options[res.tapIndex]
        
        if (selectedOption === '全部时间') {
          this.setData({ selectedDate: '' })
        } else {
          this.setData({ selectedDate: this.parseDateOption(selectedOption) })
        }
        this.filterRecords()
      }
    })
  },
  
  getDateOptions: function () {
    const options = ['全部时间']
    const today = new Date()
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const month = date.getMonth() + 1
      const day = date.getDate()
      let label = ''
      
      if (i === 0) {
        label = '今天'
      } else if (i === 1) {
        label = '昨天'
      } else if (i === 2) {
        label = '前天'
      } else {
        label = `${month}月${day}日`
      }
      
      options.push(label)
    }
    
    return options
  },
  
  parseDateOption: function (option) {
    if (option === '今天') {
      return new Date().toISOString().split('T')[0]
    } else if (option === '昨天') {
      const date = new Date()
      date.setDate(date.getDate() - 1)
      return date.toISOString().split('T')[0]
    } else if (option === '前天') {
      const date = new Date()
      date.setDate(date.getDate() - 2)
      return date.toISOString().split('T')[0]
    } else {
      const match = option.match(/(\d+)月(\d+)日/)
      if (match) {
        const date = new Date()
        date.setMonth(parseInt(match[1]) - 1)
        date.setDate(parseInt(match[2]))
        return date.toISOString().split('T')[0]
      }
      return new Date().toISOString().split('T')[0]
    }
  },

  goBack: function () {
    wx.navigateBack({ delta: 1 })
  },

  // 图片加载失败时自动重新获取URL
  onPhotoError: async function (e) {
    const { index, type } = e.currentTarget.dataset
    const { pet } = this.data
    
    if (type === 'hero') {
      const photo = pet.photos[index]
      if (!photo) return
      
      let fileId = null
      
      // 如果是 cloud:// 格式，直接使用
      if (photo.startsWith('cloud://')) {
        fileId = photo
      } 
      // 如果是过期的临时URL，尝试提取fileID
      else if (photo.includes('tcb.qcloud.la')) {
        try {
          const match = photo.match(/^https?:\/\/([^\/]+)(\/[^\?]+)/)
          if (match) {
            const domainPrefix = match[1].replace('.tcb.qcloud.la', '')
            fileId = `cloud://cloud1-d0g853l9d7017ea3b.${domainPrefix}${match[2]}`
          }
        } catch (err) {
          console.error('提取fileID失败:', err)
        }
      }
      
      if (fileId) {
        console.log('图片加载失败，尝试重新获取URL:', fileId)
        try {
          const newUrl = await getTempUrl(fileId)
          const photos = [...pet.photos]
          photos[index] = newUrl
          this.setData({ pet: { ...pet, photos } })
        } catch (err) {
          console.error('重新获取图片URL失败:', err)
          // 文件不存在，清空该图片避免无限重试
          const photos = [...pet.photos]
          photos[index] = ''
          this.setData({ pet: { ...pet, photos } })
        }
      }
    }
  },

  showRecordDetail: function (e) {
    const recordId = e.currentTarget.dataset.id
    if (recordId) {
      const record = this.data.records.find(r => r.id === recordId)
      if (record) {
        this.setData({ 
          showRecordModal: true,
          currentRecord: record
        })
      }
    }
  },
  
  hideRecordModal: function () {
    this.setData({ showRecordModal: false })
  },

  expandTimeline: function () {
    this.setData({ showTimelineModal: true })
  },
  
  hideTimelineModal: function () {
    this.setData({ showTimelineModal: false })
  },
  
  formatDateForPicker: function () {
    const today = new Date()
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  },
  
  onDateChange: function (e) {
    const date = e.detail.value
    this.setData({ selectedDate: date })
    this.filterRecords()
  },

  onEndDateChange: function (e) {
    const date = e.detail.value
    this.setData({ endDate: date })
    this.filterRecords()
  },

  clearDateFilter: function () {
    this.setData({ selectedDate: '', endDate: '' })
    this.filterRecords()
  },

  editInfo: function () {
    if (!this.data.pet) return
    
    const { pet } = this.data
    
    // 根据 father 和 mother ID 或名称加载对应的宠物对象
    let selectedFather = null
    let selectedMother = null
    
    const pets = wx.getStorageSync('pets') || []
    
    if (pet.father) {
      // 先尝试按ID查找，如果没找到再按名称查找（兼容旧数据）
      selectedFather = pets.find(p => p.id === pet.father || p._id === pet.father)
      if (!selectedFather && pet.fatherName) {
        selectedFather = pets.find(p => p.name === pet.fatherName)
      }
    }
    
    if (pet.mother) {
      // 先尝试按ID查找，如果没找到再按名称查找（兼容旧数据）
      selectedMother = pets.find(p => p.id === pet.mother || p._id === pet.mother)
      if (!selectedMother && pet.motherName) {
        selectedMother = pets.find(p => p.name === pet.motherName)
      }
    }
    
    this.setData({ 
      showEditModal: true,
      selectedFather,
      selectedMother
    })
  },

  hideEditModal: function () {
    this.setData({ 
      showEditModal: false,
      selectedFather: null,
      selectedMother: null
    })
  },

  stopPropagation: function () {},

  onEditNameInput: function (e) {
    this.setData({ 'editForm.name': e.detail.value })
  },

  onEditAliasInput: function (e) {
    this.setData({ 'editForm.alias': e.detail.value })
  },

  selectEditCategory: function (e) {
    this.setData({ 'editForm.category': e.currentTarget.dataset.category })
  },

  selectEditGender: function (e) {
    this.setData({ 'editForm.gender': e.currentTarget.dataset.gender })
  },

  selectEditStatus: function (e) {
    this.setData({ 'editForm.status': e.currentTarget.dataset.status })
  },

  onPublicSwitchChange: function (e) {
    this.setData({ 'editForm.isPublic': e.detail.value })
  },

  onEditFatherInput: function (e) {
    this.setData({ 'editForm.father': e.detail.value })
  },

  onEditMotherInput: function (e) {
    this.setData({ 'editForm.mother': e.detail.value })
  },

  openFatherModal: function () {
    this.setData({ showFatherModal: true, fatherSearchText: '', fatherList: [] })
    this.loadParentsAsync('father')
  },

  openMotherModal: function () {
    this.setData({ showMotherModal: true, motherSearchText: '', motherList: [] })
    this.loadParentsAsync('mother')
  },

  hideFatherModal: function () {
    this.setData({ showFatherModal: false })
  },

  hideMotherModal: function () {
    this.setData({ showMotherModal: false })
  },

  loadParentsAsync: async function (type) {
    try {
      // 先尝试从本地缓存加载，快速显示
      const localPets = wx.getStorageSync('pets') || []
      if (localPets.length > 0) {
        // 转换本地缓存的图片URL
        const convertedLocalPets = await this.convertParentPhotos(localPets)
        if (type === 'father') {
          const fatherList = convertedLocalPets.filter(p => p.gender === '公' && (p.id || p._id) !== this.data.petId)
          this.setData({ fatherList })
        } else {
          const motherList = convertedLocalPets.filter(p => p.gender === '母' && (p.id || p._id) !== this.data.petId)
          this.setData({ motherList })
        }
      }
      
      // 后台异步从云端获取最新数据
      const result = await API.getPetList()
      if (result.success) {
        // 适配分页数据结构
        let pets = result.data.list || result.data || []
        
        // 补充本地缓存的图片信息
        const localMap = {}
        localPets.forEach(p => { localMap[p.id || p._id] = p })
        
        pets = pets.map(pet => {
          const id = pet.id || pet._id
          const local = localMap[id]
          if ((!pet.photos || pet.photos.length === 0) && local && local.photos && local.photos.length > 0) {
            return { ...pet, photos: local.photos }
          }
          return pet
        })
        
        // 转换云存储URL
        pets = await this.convertParentPhotos(pets)
        
        if (type === 'father') {
          const fatherList = pets.filter(p => p.gender === '公' && (p.id || p._id) !== this.data.petId)
          this.setData({ fatherList })
        } else {
          const motherList = pets.filter(p => p.gender === '母' && (p.id || p._id) !== this.data.petId)
          this.setData({ motherList })
        }
      }
    } catch (error) {
      console.error('加载父母列表失败:', error)
    }
  },

  loadParentsFromLocal: function (type) {
    const localPets = wx.getStorageSync('pets') || []
    if (type === 'father') {
      const fatherList = localPets.filter(p => p.gender === '公' && (p.id || p._id) !== this.data.petId)
      this.setData({ fatherList })
    } else {
      const motherList = localPets.filter(p => p.gender === '母' && (p.id || p._id) !== this.data.petId)
      this.setData({ motherList })
    }
  },

  convertParentPhotos: async function (pets) {
    try {
      return await convertPetPhotosToUrls(pets)
    } catch (error) {
      console.error('转换父母图片URL失败:', error)
      return pets
    }
  },

  onFatherSearchInput: function (e) {
    const searchText = e.detail.value
    this.setData({ fatherSearchText: searchText })
    this.filterFatherList(searchText)
  },

  onMotherSearchInput: function (e) {
    const searchText = e.detail.value
    this.setData({ motherSearchText: searchText })
    this.filterMotherList(searchText)
  },

  filterFatherList: function (searchText) {
    if (!searchText) {
      this.loadParents('father')
      return
    }
    const allPets = wx.getStorageSync('pets') || []
    const filtered = allPets.filter(p => 
      p.gender === '公' && 
      p.name && p.name.includes(searchText) &&
      p.id !== this.data.petId
    )
    this.setData({ fatherList: filtered })
  },

  filterMotherList: function (searchText) {
    if (!searchText) {
      this.loadParents('mother')
      return
    }
    const allPets = wx.getStorageSync('pets') || []
    const filtered = allPets.filter(p => 
      p.gender === '母' && 
      p.name && p.name.includes(searchText) &&
      p.id !== this.data.petId
    )
    this.setData({ motherList: filtered })
  },

  selectFather: function (e) {
    const petId = e.currentTarget.dataset.id
    const pet = this.data.fatherList.find(p => p.id === petId)
    if (pet) {
      this.setData({ 
        selectedFather: pet,
        'editForm.father': pet.id,
        'editForm.fatherName': pet.name,
        showFatherModal: false 
      })
    }
  },

  selectMother: function (e) {
    const petId = e.currentTarget.dataset.id
    const pet = this.data.motherList.find(p => p.id === petId)
    if (pet) {
      this.setData({ 
        selectedMother: pet,
        'editForm.mother': pet.id,
        'editForm.motherName': pet.name,
        showMotherModal: false 
      })
    }
  },

  clearFather: function () {
    this.setData({ selectedFather: null, 'editForm.father': '' })
  },

  clearMother: function () {
    this.setData({ selectedMother: null, 'editForm.mother': '' })
  },

  // 选择图片（编辑弹窗）
  chooseEditPhoto: function () {
    const current = this.data.editPhotoList || []
    if (current.length >= 5) {
      showError('最多上传5张')
      return
    }
    wx.chooseMedia({
      count: 5 - current.length,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const newPaths = res.tempFiles.map(f => f.tempFilePath)
        this.setData({ editPhotoList: [...current, ...newPaths] })
      }
    })
  },

  // 删除图片（编辑弹窗）
  removeEditPhoto: function (e) {
    const index = e.currentTarget.dataset.index
    const list = [...this.data.editPhotoList]
    list.splice(index, 1)
    this.setData({ editPhotoList: list })
  },

  startVoice: function (e) {
    const field = e.currentTarget.dataset.field
    this.setData({ currentVoiceField: field, isRecording: true })
    
    voiceManager.startRecording(field, (voiceField, recognizedText) => {
      this.setData({ isRecording: false })
      
      if (recognizedText) {
        if (voiceField === 'editName') {
          this.setData({ 'editForm.name': recognizedText })
        } else if (voiceField === 'editAlias') {
          this.setData({ 'editForm.alias': recognizedText })
        } else if (voiceField === 'recordText') {
          // 记录内容语音输入
          const currentText = this.data.newRecord.text || ''
          const newText = currentText ? currentText + recognizedText : recognizedText
          this.setData({ 'newRecord.text': newText })
        }
        showSuccess('识别成功')
      } else {
        // 识别失败，弹出输入框让用户手动输入
        const fieldMap = {
          'editName': '宠物名称',
          'editAlias': '宠物别名',
          'recordText': '记录内容'
        }
        wx.showModal({
          title: '语音输入',
          content: '请输入' + (fieldMap[voiceField] || '内容'),
          editable: true,
          placeholderText: '请输入内容',
          success: (res) => {
            if (res.confirm && res.content) {
              if (voiceField === 'editName') {
                this.setData({ 'editForm.name': res.content })
              } else if (voiceField === 'editAlias') {
                this.setData({ 'editForm.alias': res.content })
              } else if (voiceField === 'recordText') {
                const currentText = this.data.newRecord.text || ''
                const newText = currentText ? currentText + res.content : res.content
                this.setData({ 'newRecord.text': newText })
              }
              showSuccess('输入成功')
            }
          }
        })
      }
    })
  },

  stopVoice: function () {
    if (!this.data.isRecording) return
    this.setData({ isRecording: false })
    voiceManager.stopRecording()
  },

  // 语音悬浮按钮拖动
  onVoiceBtnTouchStart: function (e) {
    const touch = e.touches[0]
    this.setData({
      voiceBtnStartX: this.data.voiceBtnX,
      voiceBtnStartY: this.data.voiceBtnY,
      voiceBtnTouchStartX: touch.clientX,
      voiceBtnTouchStartY: touch.clientY
    })
    
    // 开始录音
    const field = e.currentTarget.dataset.field
    this.setData({ currentVoiceField: field, isRecording: true })
    
    voiceManager.startRecording(field, (voiceField, recognizedText) => {
      this.setData({ isRecording: false })
      
      if (recognizedText) {
        if (voiceField === 'recordText') {
          const currentText = this.data.newRecord.text || ''
          const newText = currentText ? currentText + recognizedText : recognizedText
          this.setData({ 'newRecord.text': newText })
        }
        showSuccess('识别成功')
      } else {
        wx.showModal({
          title: '语音输入',
          content: '请输入记录内容',
          editable: true,
          placeholderText: '请输入内容',
          success: (res) => {
            if (res.confirm && res.content) {
              const currentText = this.data.newRecord.text || ''
              const newText = currentText ? currentText + res.content : res.content
              this.setData({ 'newRecord.text': newText })
              showSuccess('输入成功')
            }
          }
        })
      }
    })
  },

  onVoiceBtnTouchMove: function (e) {
    const touch = e.touches[0]
    const deltaX = touch.clientX - this.data.voiceBtnTouchStartX
    const deltaY = touch.clientY - this.data.voiceBtnTouchStartY
    
    this.setData({
      voiceBtnX: this.data.voiceBtnStartX + deltaX,
      voiceBtnY: this.data.voiceBtnStartY + deltaY
    })
  },

  onVoiceBtnTouchEnd: function (e) {
    // 停止录音
    if (this.data.isRecording) {
      this.setData({ isRecording: false })
      voiceManager.stopRecording()
    }
  },

  saveEdit: async function () {
    const { editForm, petId, editPhotoList } = this.data
    if (!editForm.name) {
      showError('请输入宠物名称')
      return
    }

    this.setData({ photoUploading: true })

    try {
      // 上传临时路径图片（cloud路径直接保留）
      let finalPhotos = []
      for (const path of editPhotoList) {
        if (path.startsWith('cloud://')) {
          finalPhotos.push(path)
        } else if (path.startsWith('http://tmp/') || path.startsWith('wxfile://') || path.startsWith('file://')) {
          // 本地临时路径，上传到云存储
          try {
            // 检查文件是否存在
            const fs = wx.getFileSystemManager()
            try {
              fs.accessSync(path)
            } catch (err) {
              console.error('临时文件已失效:', path)
              wx.showToast({ title: '图片已过期，请重新选择', icon: 'none' })
              this.setData({ photoUploading: false })
              return
            }
            const cloudPath = 'pets/' + Date.now() + '_' + Math.random().toString(36).slice(2) + '.jpg'
            const uploadRes = await wx.cloud.uploadFile({ cloudPath, filePath: path })
            finalPhotos.push(uploadRes.fileID)
          } catch (e) {
            console.error('图片上传失败:', e)
            wx.showToast({ title: '图片上传失败', icon: 'none' })
            this.setData({ photoUploading: false })
            return
          }
        } else {
          // 其他路径，跳过
          console.warn('未知路径类型:', path)
        }
      }

      const result = await API.updatePet({ 
        id: petId, 
        ...editForm,
        photos: finalPhotos
      })
      
      if (result.success) {
        // 更新本地缓存
        const pets = wx.getStorageSync('pets') || []
        const index = pets.findIndex(p => String(p.id || p._id) === String(petId))
        if (index !== -1) {
          pets[index] = { ...pets[index], ...editForm, photos: finalPhotos }
          wx.setStorageSync('pets', sanitizePetPhotos(pets))
        }
        // 乐观更新当前页面
        this.setData({ 
          pet: { ...this.data.pet, ...editForm, photos: finalPhotos },
          showEditModal: false 
        })
        showSuccess('修改成功')
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error('云函数调用失败，使用本地数据:', error)
      this.saveLocalEdit()
    } finally {
      this.setData({ photoUploading: false })
    }
  },

  saveLocalEdit: function () {
    const { editForm, petId } = this.data
    try {
      const pets = wx.getStorageSync('pets') || []
      const index = pets.findIndex(p => String(p.id) === String(petId))
      
      if (index !== -1) {
        pets[index] = {
          ...pets[index],
          name: editForm.name,
          category: editForm.category,
          gender: editForm.gender,
          alias: editForm.alias,
          father: editForm.father,
          fatherName: editForm.fatherName,
          mother: editForm.mother,
          motherName: editForm.motherName,
          status: editForm.status,
          isPublic: editForm.isPublic
        }
        
        wx.setStorageSync('pets', sanitizePetPhotos(pets))
        this.setData({ 
          pet: pets[index],
          showEditModal: false 
        })
        showSuccess('修改成功')
      }
    } catch (error) {
      console.error('保存失败:', error)
      showError('保存失败')
    }
  },

  showDeleteConfirm: function () {
    this.setData({ showDeleteConfirm: true })
  },

  hideDeleteConfirm: function () {
    this.setData({ showDeleteConfirm: false })
  },

  confirmDelete: async function () {
    const { petId } = this.data
    
    try {
      const result = await API.deletePet(petId)
      
      if (result.success) {
        showSuccess('删除成功')
        setTimeout(() => {
          wx.navigateBack({ delta: 1 })
        }, 1500)
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error('云函数调用失败，使用本地数据:', error)
      this.deleteLocalPet()
    }
  },

  deleteLocalPet: function () {
    const { petId } = this.data
    try {
      let pets = wx.getStorageSync('pets') || []
      pets = pets.filter(p => String(p.id) !== String(petId))
      wx.setStorageSync('pets', sanitizePetPhotos(pets))
      
      let records = wx.getStorageSync('records') || []
      records = records.filter(r => r.petId !== petId)
      wx.setStorageSync('records', records)
      
      showSuccess('删除成功')
      setTimeout(() => {
        wx.navigateBack({ delta: 1 })
      }, 1500)
    } catch (error) {
      console.error('删除失败:', error)
      showError('删除失败')
    }
  },

  showMore: function () {
    wx.showActionSheet({
      itemList: ['编辑信息', '删除宠物', '预览页面'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.editInfo()
        } else if (res.tapIndex === 1) {
          this.showDeleteConfirm()
        } else if (res.tapIndex === 2) {
          this.previewPet()
        }
      }
    })
  },

  previewPet: function () {
    const { petId } = this.data
    if (!petId) {
      showError('宠物ID不存在')
      return
    }
    // 跳转到预览页面
    wx.navigateTo({
      url: `/pages/pet/preview?id=${petId}`
    })
  },

  addRecord: function () {
    // 根据当前选中的事件类型设置记录类型
    const tab = this.data.currentEventTab
    let recordType = '日常'
    
    // 事件类型与记录类型的映射
    const typeMap = {
      '交配': '交配',
      '产蛋': '产蛋',
      '换公': '换公',
      '全部事件': '日常'
    }
    
    if (typeMap[tab]) {
      recordType = typeMap[tab]
    }
    
    this.setData({ 
      showAddRecordModal: true,
      'newRecord.type': recordType
    })
  },

  hideAddRecordModal: function () {
    this.setData({ showAddRecordModal: false })
  },

  selectRecordType: function (e) {
    this.setData({ 'newRecord.type': e.currentTarget.dataset.type })
  },

  onRecordTextInput: function (e) {
    this.setData({ 'newRecord.text': e.detail.value })
  },

  confirmAddRecord: async function () {
    const { newRecord, petId } = this.data
    if (!newRecord.text) {
      showError('请输入记录内容')
      return
    }

    const now = new Date()
    const recordData = {
      petId: petId,
      type: newRecord.type,
      text: newRecord.text,
      date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
      time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    }

    try {
      const result = await API.createRecord(recordData)
      
      if (result.success) {
        this.loadRecords(petId)
        this.setData({
          showAddRecordModal: false,
          newRecord: { type: '日常', text: '' }
        })
        showSuccess('记录成功')
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error('云函数调用失败，使用本地数据:', error)
      this.addLocalRecord(recordData)
    }
  },

  addLocalRecord: function (recordData) {
    try {
      const records = wx.getStorageSync('records') || []
      const record = {
        id: Date.now().toString(),
        ...recordData
      }
      
      records.unshift(record)
      wx.setStorageSync('records', records)
      
      this.setData({
        records: records
      })
      
      this.filterRecords()
      
      this.setData({
        showAddRecordModal: false,
        newRecord: { type: '日常', text: '' }
      })
      
      showSuccess('记录成功')
    } catch (error) {
      console.error('添加记录失败:', error)
      showError('添加失败')
    }
  },

  // ========== 家族谱系相关方法 ==========

  // 切换谱系展开/收起
  togglePedigree: async function () {
    const showPedigree = !this.data.showPedigree
    this.setData({ showPedigree })

    // 只在首次展开时加载，避免重复请求
    if (showPedigree && !this.data.pedigreeData) {
      this.loadPedigree()
    } else if (showPedigree && this.data.pedigreeData) {
      // 已加载过，重新转换图片URL（临时URL可能过期）
      await this.refreshPedigreePhotos()
    }
  },

  // 刷新谱系图片URL（解决临时URL过期问题）
  refreshPedigreePhotos: async function () {
    const { pedigreeData } = this.data
    if (!pedigreeData || !pedigreeData.fullTree) return

    try {
      // 深拷贝避免直接修改原数据
      const newData = JSON.parse(JSON.stringify(pedigreeData))
      await this.convertPedigreePhotos(newData.fullTree)
      this.setData({ pedigreeData: newData })
    } catch (error) {
      console.error('刷新谱系图片失败:', error)
    }
  },

  // 加载家族谱系
  loadPedigree: async function () {
    const { petId } = this.data
    if (!petId) return

    showLoading('加载谱系中...')

    try {
      const result = await API.getPedigree(petId)
      
      if (result.success) {
        const { current, fullTree, paternalLine, maternalLine, stats } = result.data
        
        // 转换图片URL
        if (fullTree) {
          await this.convertPedigreePhotos(fullTree)
        }
        
        // 计算各代是否有数据
        const hasGen1 = fullTree && (fullTree.father || fullTree.mother)
        const hasGen2 = fullTree && (
          (fullTree.father && (fullTree.father.father || fullTree.father.mother)) ||
          (fullTree.mother && (fullTree.mother.father || fullTree.mother.mother))
        )
        const hasGen3 = fullTree && (
          (fullTree.father && fullTree.father.father && (fullTree.father.father.father || fullTree.father.father.mother)) ||
          (fullTree.mother && fullTree.mother.father && (fullTree.mother.father.father || fullTree.mother.father.mother))
        )
        
        result.data.hasGen1 = hasGen1
        result.data.hasGen2 = hasGen2
        result.data.hasGen3 = hasGen3
        
        this.setData({
          pedigreeData: result.data,
          pedigreeStats: stats,
          paternalLine: paternalLine || [],
          maternalLine: maternalLine || []
        })
        
        console.log('谱系数据加载成功:', result.data)
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error('加载谱系失败:', error)
      // 使用本地数据构建简单谱系
      this.buildLocalPedigree()
    } finally {
      hideLoading()
    }
  },

  // 转换谱系中的图片URL
  convertPedigreePhotos: async function (tree) {
    if (!tree) return
    
    // 转换当前节点
    if (tree.photos && tree.photos.length > 0) {
      try {
        tree.photos = await convertPhotoIdsToUrls(tree.photos)
        tree.photos = tree.photos.filter(p => p && p.length > 0)
      } catch (error) {
        tree.photos = []
      }
    }
    
    // 递归转换父系
    if (tree.father) {
      await this.convertPedigreePhotos(tree.father)
    }
    
    // 递归转换母系
    if (tree.mother) {
      await this.convertPedigreePhotos(tree.mother)
    }
  },

  // 使用本地数据构建简单谱系
  buildLocalPedigree: function () {
    const { pet } = this.data
    if (!pet) return

    const pets = wx.getStorageSync('pets') || []
    const paternalLine = []
    const maternalLine = []

    // 构建父系主线
    let currentFatherId = pet.father
    let generation = 1
    while (currentFatherId && generation <= 3) {
      const father = pets.find(p => p.id === currentFatherId || p._id === currentFatherId)
      if (father) {
        paternalLine.push({
          id: father.id || father._id,
          name: father.name,
          alias: father.alias,
          gender: father.gender,
          category: father.category,
          photos: father.photos,
          generation
        })
        currentFatherId = father.father
        generation++
      } else {
        break
      }
    }

    // 构建母系主线
    let currentMotherId = pet.mother
    generation = 1
    while (currentMotherId && generation <= 3) {
      const mother = pets.find(p => p.id === currentMotherId || p._id === currentMotherId)
      if (mother) {
        maternalLine.push({
          id: mother.id || mother._id,
          name: mother.name,
          alias: mother.alias,
          gender: mother.gender,
          category: mother.category,
          photos: mother.photos,
          generation
        })
        currentMotherId = mother.mother
        generation++
      } else {
        break
      }
    }

    this.setData({
      paternalLine,
      maternalLine,
      pedigreeStats: {
        totalAncestors: paternalLine.length + maternalLine.length,
        maleCount: paternalLine.length,
        femaleCount: maternalLine.length,
        maxDepth: Math.max(paternalLine.length, maternalLine.length)
      }
    })
  },

  // 切换血缘主线标签
  switchBloodlineTab: function (e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ bloodlineTab: tab })
  },

  // 查看祖先详情
  viewAncestorDetail: function (e) {
    const id = e.currentTarget.dataset.id
    if (!id) return

    // 跳转到该宠物的详情页
    wx.navigateTo({
      url: `/pages/pet/detail?id=${id}`
    })
  },
})