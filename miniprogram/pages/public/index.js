const { getAPI } = require('../../utils/api')
const { getTempUrl, convertPhotoIdsToUrls } = require('../../utils/image')
const API = getAPI()

Page({
  data: {
    userId: '',
    isLoggedIn: false,
    userInfo: {},
    shareInfo: {},
    pets: [],
    categories: [],
    ownerNickname: '',
    publicShareInfo: {},
    isPublicMode: true,
    loading: true
  },

  onLoad: function (options) {
    let userId = ''

    console.log('public/index onLoad options:', options)
    
    if (options && options.scene) {
      const scene = decodeURIComponent(options.scene)
      // scene 格式: userId=xxx
      const match = scene.match(/userId=([^&]+)/)
      userId = match ? match[1] : scene
    } else if (options && options.userId) {
      userId = options.userId
    }

    console.log('public/index userId extracted:', userId)

    if (userId) {
      this.setData({ userId, isPublicMode: true })
      this.loadUserInfo(userId)
      this.loadShareInfo()
      this.loadPublicPets(userId)
    } else {
      this.setData({ loading: false })
    }
  },

  loadUserInfo: function (userId) {
    // 尝试从本地获取用户信息（如果是自己的）
    try {
      const openid = wx.getStorageSync('openid')
      if (openid === userId) {
        const userInfo = wx.getStorageSync('userInfo')
        if (userInfo) {
          this.setData({ userInfo })
          return
        }
      }
    } catch (e) {}

    // 默认用户信息
    this.setData({
      userInfo: {
        nickname: '龟上心',
        avatar: ''
      }
    })
  },

  loadShareInfo: function () {
    try {
      const openid = wx.getStorageSync('openid')
      if (this.data.userId === openid) {
        const saved = wx.getStorageSync('shareInfo')
        if (saved) {
          this.setData({ shareInfo: saved })
        }
      }
    } catch (e) {
      console.error('加载分享信息失败:', e)
    }
  },

  loadPublicPets: async function (userId) {
    this.setData({ loading: true })
    
    console.log('loadPublicPets called with userId:', userId)
    
    try {
      // 调用云函数获取公开宠物
      const result = await API.callCloudFunction('pet', 'publicList', { userId })
      console.log('loadPublicPets API result:', result)
      
      if (result.success) {
        const responseData = result.data || {}
        let pets = responseData.pets || []
        const ownerNickname = responseData.ownerNickname || ''
        const publicShareInfo = responseData.publicShareInfo || {}
        // 计算微信号是否公开显示
        publicShareInfo.showWechat = !!(publicShareInfo.wechatPublic && publicShareInfo.wechatId)
        // 格式化产蛋/配对日期为 MM-DD，并处理记录数据
        for (const pet of pets) {
          if (pet.latestEgg && pet.latestEgg.date) {
            const parts = pet.latestEgg.date.split('-')
            if (parts.length >= 3) {
              pet.latestEgg.date = parts[1] + '-' + parts[2]
            }
          }
          if (pet.latestPairing && pet.latestPairing.date) {
            const parts = pet.latestPairing.date.split('-')
            if (parts.length >= 3) {
              pet.latestPairing.date = parts[1] + '-' + parts[2]
            }
          }
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
        }
        const categories = [...new Set(pets.map(p => p.category).filter(c => c))]
        this.setData({ 
          pets: pets,
          categories: categories,
          ownerNickname: ownerNickname,
          publicShareInfo: publicShareInfo,
          loading: false
        })
      } else {
        console.error('获取公开宠物失败:', result.message)
        this.setData({ pets: [], categories: [], ownerNickname: '', publicShareInfo: {}, loading: false })
      }
    } catch (error) {
      console.error('获取公开宠物失败:', error)
      this.setData({ pets: [], categories: [], ownerNickname: '', publicShareInfo: {}, loading: false })
    }
  },

  viewDetail: function (e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/pet/preview?petId=${id}&isPublic=true`
    })
  },

  goBack: function () {
    wx.navigateBack({
      delta: 1
    })
  },

  onShow: function () {
    const app = getApp()
    this.setData({ isLoggedIn: app.globalData.isLoggedIn })
  },

  goToLogin: function () {
    const app = getApp()
    app.requireLogin()
  },

  onPhotoError: async function (e) {
    const { index, type } = e.currentTarget.dataset

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

        try {
          const newUrl = await getTempUrl(fileId)
          const userInfo = { ...this.data.userInfo, avatar: newUrl }
          this.setData({ userInfo })
        } catch (err) {
          console.error('重新获取头像URL失败:', err)
          // 文件不存在，清空头像避免无限重试
          const userInfo = { ...this.data.userInfo, avatar: '' }
          this.setData({ userInfo })
        }
      }
      return
    }

    // 宠物列表图片
    const { pets } = this.data
    const pet = pets[index]
    if (!pet || !pet.images || !pet.images[0]) return

    const imgUrl = pet.images[0]
    if (imgUrl.startsWith('/images/')) return // 本地静态图片不处理

    let fileId = null
    if (imgUrl.startsWith('cloud://')) {
      fileId = imgUrl
    } else if (imgUrl.includes('tcb.qcloud.la')) {
      try {
        const match = imgUrl.match(/^https?:\/\/([^\/]+)(\/[^\?]+)/)
        if (match) {
          const domainPrefix = match[1].replace('.tcb.qcloud.la', '')
          fileId = `cloud://cloud1-d0g853l9d7017ea3b.${domainPrefix}${match[2]}`
        }
      } catch (err) {
        console.error('提取fileID失败:', err)
      }
    }

    if (fileId) {

      try {
        const newUrl = await getTempUrl(fileId)
        const updatedPets = [...pets]
        updatedPets[index] = { ...pet, images: [newUrl, ...pet.images.slice(1)] }
        this.setData({ pets: updatedPets })
      } catch (err) {
        console.error('重新获取宠物图片URL失败:', err)
        // 文件不存在，清空该图片避免无限重试
        const updatedPets = [...pets]
        updatedPets[index] = { ...pet, images: [''] }
        this.setData({ pets: updatedPets })
      }
    }
  }
})