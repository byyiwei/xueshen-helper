const { getAPI } = require('../../utils/api.js')
const { showError, showLoading, hideLoading } = require('../../utils/error.js')
const { getTempUrl, convertPhotoIdsToUrls } = require('../../utils/image.js')
const ThemeManager = require('../../utils/theme.js')
const { generatePetImage } = require('../../utils/imageService.js')

const API = getAPI()

Page({
  data: {
    petId: '',
    pet: null,
    records: [],
    filteredRecords: [],
    loading: true,
    currentTheme: 'gold',
    qrcodeUrl: '',
    qrcodeFileId: '',
    currentEventTab: '全部事件',
    // 家族谱系
    showPedigree: true,
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

  onLoad: function (options) {
    this.loadTheme()
    
    let petId = ''
    if (options && options.id) {
      petId = options.id
    }
    
    if (petId) {
      this.setData({ petId })
      this.loadPetDetail(petId)
      this.loadRecords(petId)
      this.generatePreviewQrcode(petId)
      this.loadPedigree()
    } else {
      showError('宠物ID不存在')
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }
  },

  loadTheme: function () {
    const currentTheme = ThemeManager.getCurrentTheme()
    this.setData({ currentTheme })
  },

  // 生成预览页面专属小程序码
  generatePreviewQrcode: function (petId) {
    const scene = 'petId=' + petId
    const page = 'pages/pet/preview'
    
    wx.cloud.callFunction({
      name: 'qrcode',
      data: {
        action: 'generate',
        data: {
          scene: scene,
          page: page
        }
      },
      success: (res) => {
        if (res.result && res.result.success) {
          const fileID = res.result.data
          this.setData({ qrcodeFileId: fileID })
          // 将 cloud:// fileID 转为临时 URL
          if (fileID && fileID.startsWith('cloud://')) {
            getTempUrl(fileID).then(tempUrl => {
              this.setData({ qrcodeUrl: tempUrl })
            }).catch(err => {
              console.error('获取小程序码临时URL失败:', err)
            })
          }
        } else {
          console.error('小程序码生成失败:', res.result ? res.result.message : '未知错误')
        }
      },
      fail: (err) => {
        console.error('小程序码云函数调用失败:', err)
      }
    })
  },

  loadPetDetail: async function (petId) {
    try {
      const result = await API.getPetById(petId)
      
      if (result.success) {
        const pet = result.data
        let statusClass = 'normal'
        if (pet.status === '生病') statusClass = 'sick'
        else if (pet.status === '死亡') statusClass = 'dead'
        else if (pet.status === '出售') statusClass = 'sold'
        
        pet.statusClass = statusClass
        
        // 转换图片URL
        if (pet.photos && pet.photos.length > 0) {
          const needsConversion = pet.photos.some(p => 
            p && (p.startsWith('cloud://') || p.includes('tcb.qcloud.la'))
          )
          if (needsConversion) {
            try {
              pet.photos = await convertPhotoIdsToUrls(pet.photos)
              pet.photos = pet.photos.filter(p => p && p.length > 0)
            } catch (err) {
              console.error('图片URL转换失败:', err)
              pet.photos = []
            }
          }
        }
        
        this.setData({ 
          pet,
          loading: false
        })
      } else {
        showError('加载宠物信息失败')
        this.setData({ loading: false })
      }
    } catch (error) {
      console.error('加载宠物详情失败:', error)
      showError('加载失败')
      this.setData({ loading: false })
    }
  },

  loadRecords: async function (petId) {
    try {
      const allRecords = wx.getStorageSync('records') || []
      const petRecords = allRecords
        .filter(r => r.petId === petId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      
      this.setData({ 
        records: petRecords,
        filteredRecords: petRecords
      })
    } catch (error) {
      console.error('加载记录失败:', error)
    }
  },

  // ========== 事件Tab筛选 ==========

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
    let filtered = [...this.data.records]

    if (filterType !== '全部') {
      filtered = filtered.filter(r => r.type === filterType)
    }

    this.setData({ filteredRecords: filtered })
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

    try {
      const result = await API.getPedigree(petId)
      
      if (result.success) {
        const { fullTree, paternalLine, maternalLine, stats } = result.data
        
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
      } else {
        // 使用本地数据构建简单谱系
        this.buildLocalPedigree()
      }
    } catch (error) {
      console.error('加载谱系失败:', error)
      this.buildLocalPedigree()
    }
  },

  // 转换谱系中的图片URL
  convertPedigreePhotos: async function (tree) {
    if (!tree) return
    
    if (tree.photos && tree.photos.length > 0) {
      try {
        tree.photos = await convertPhotoIdsToUrls(tree.photos)
        tree.photos = tree.photos.filter(p => p && p.length > 0)
      } catch (error) {
        tree.photos = []
      }
    }
    
    if (tree.father) {
      await this.convertPedigreePhotos(tree.father)
    }
    
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

  goBack: function () {
    wx.navigateBack()
  },

  previewImage: async function (e) {
    const { url } = e.currentTarget.dataset
    const { pet } = this.data
    if (!pet || !pet.photos || pet.photos.length === 0) return
    
    let urls = pet.photos
    if (urls.some(p => p && (p.startsWith('cloud://') || p.includes('tcb.qcloud.la')))) {
      try {
        urls = await convertPhotoIdsToUrls(urls)
      } catch (err) {
        console.error('转换预览图片URL失败:', err)
      }
    }
    
    wx.previewImage({
      current: url.startsWith('cloud://') ? await getTempUrl(url).catch(() => url) : url,
      urls: urls
    })
  },

  // 保存到相册
  saveToAlbum: async function () {
    showLoading('生成图片中...')

    try {
      const {
        pet, records, qrcodeUrl, pedigreeData, currentTheme,
        paternalLine, maternalLine, showPedigree, bloodlineTab
      } = this.data

      const petData = {
        pet,
        records: this.data.filteredRecords || records,
        qrcodeUrl,
        pedigreeData,
        paternalLine: paternalLine || [],
        maternalLine: maternalLine || [],
        showPedigree: showPedigree,
        bloodlineTab: bloodlineTab || 'paternal'
      }

      const tempFilePath = await generatePetImage(petData, currentTheme)
      this.saveImageToAlbum(tempFilePath)
    } catch (err) {
      hideLoading()
      console.error('生成图片失败:', err)
      showError('生成图片失败: ' + (err.message || '未知错误'))
    }
  },

  /* ====== 以下为旧版 Canvas 生成方案，已停用，改用 imageService.js 公共接口 ======
  // 使用 Canvas 2D 生成预览长图
  generatePreviewImage: function () {
    // ... (Canvas 绘制代码，已屏蔽)
  },

  // 辅助：加载图片到 canvas
  loadCanvasImage: function (canvas, src) {
    // ...
  },

  // 辅助：绘制圆角矩形
  roundRect: function (ctx, x, y, w, h, r) {
    // ...
  },
  ====== 旧版 Canvas 生成方案 END ====== */

  // 保存图片到相册
  saveImageToAlbum: function (imagePath) {
    wx.saveImageToPhotosAlbum({
      filePath: imagePath,
      success: () => {
        wx.showToast({ title: '保存成功', icon: 'success' })
      },
      fail: (err) => {
        console.error('保存失败:', err)
        if (err.errMsg && err.errMsg.indexOf('auth deny') !== -1) {
          wx.showModal({
            title: '提示',
            content: '需要您授权保存到相册',
            confirmText: '去设置',
            success: (modalRes) => {
              if (modalRes.confirm) {
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

  onPhotoError: async function (e) {
    const { index, type } = e.currentTarget.dataset
    const { pet } = this.data

    if (type === 'avatar') {
      const avatar = pet.avatar
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
        } catch (err) {}
      }

      if (fileId) {
        try {
          const newUrl = await getTempUrl(fileId)
          this.setData({ pet: { ...pet, avatar: newUrl } })
        } catch (err) {
          // 文件不存在，清空头像避免无限重试
          this.setData({ pet: { ...pet, avatar: '' } })
        }
      }
      return
    }

    if (type === 'qrcode') {
      const { qrcodeFileId } = this.data
      if (qrcodeFileId && qrcodeFileId.startsWith('cloud://')) {
        try {
          const newUrl = await getTempUrl(qrcodeFileId)
          this.setData({ qrcodeUrl: newUrl })
        } catch (err) {
          this.setData({ qrcodeUrl: '' })
        }
      }
      return
    }

    // 主图轮播
    const photo = pet.photos[index]
    if (!photo) return

    let fileId = null
    if (photo.startsWith('cloud://')) {
      fileId = photo
    } else if (photo.includes('tcb.qcloud.la')) {
      try {
        const match = photo.match(/^https?:\/\/([^\/]+)(\/[^\?]+)/)
        if (match) {
          const domainPrefix = match[1].replace('.tcb.qcloud.la', '')
          fileId = `cloud://cloud1-d0g853l9d7017ea3b.${domainPrefix}${match[2]}`
        }
      } catch (err) {}
    }

    if (fileId) {
      try {
        const newUrl = await getTempUrl(fileId)
        const photos = [...pet.photos]
        photos[index] = newUrl
        this.setData({ pet: { ...pet, photos } })
      } catch (err) {
        // 文件不存在，清空该图片避免无限重试
        const photos = [...pet.photos]
        photos[index] = ''
        this.setData({ pet: { ...pet, photos } })
      }
    }
  }
})
