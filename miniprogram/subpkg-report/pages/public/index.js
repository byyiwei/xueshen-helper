const { getAPI } = require('../../../utils/api')
const { getTempUrl, convertPhotoIdsToUrls } = require('../../../utils/image')
const API = getAPI()

Page({
  data: {
    userId: '',
    isLoggedIn: false,
    userInfo: {},
    avatarInitial: '?',
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

  loadUserInfo: async function (userId) {
    // 尝试从本地获取用户信息（如果是自己的）
    try {
      const openid = wx.getStorageSync('openid')
      if (openid === userId) {
        const userInfo = wx.getStorageSync('userInfo')
        if (userInfo) {
          // 头像可能是 cloud:// 格式，需要转换为临时 URL
          let avatar = userInfo.avatar || ''
          if (avatar && avatar.startsWith('cloud://')) {
            try {
              avatar = await getTempUrl(avatar)
            } catch (err) {
              console.error('本地头像URL转换失败:', err)
              avatar = ''
            }
          }
          this.setData({ userInfo: { ...userInfo, avatar } })
          if (userInfo.nickname) {
            this.setData({ avatarInitial: userInfo.nickname.charAt(0) })
          }
          return
        }
      }
    } catch (e) {}

    // 非本人访问时，userInfo 由 loadPublicPets 返回的 ownerNickname/ownerAvatar 填充
    // 此处不再硬编码默认值，避免覆盖云端真实数据
  },

  loadShareInfo: async function () {
    try {
      const openid = wx.getStorageSync('openid')
      if (this.data.userId === openid) {
        const saved = wx.getStorageSync('shareInfo')
        if (saved) {
          // 如果封面是 cloud:// 格式，转换为临时 URL
          let cover = saved.cover || ''
          if (cover && cover.startsWith('cloud://')) {
            try {
              cover = await getTempUrl(cover)
            } catch (err) {
              console.error('本地封面URL转换失败:', err)
              cover = ''
            }
          }
          this.setData({ shareInfo: { ...saved, cover } })
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
        const ownerAvatar = responseData.ownerAvatar || ''
        const publicShareInfo = responseData.publicShareInfo || {}
        // 用云端返回的真实用户信息填充 userInfo
        if (ownerNickname || ownerAvatar) {
          const nickname = ownerNickname || ''
          // 头像可能是 cloud:// 格式，需要转换为临时 URL
          let avatarUrl = ownerAvatar || ''
          if (avatarUrl && (avatarUrl.startsWith('cloud://') || avatarUrl.includes('tcb.qcloud.la'))) {
            try {
              avatarUrl = await getTempUrl(avatarUrl.startsWith('cloud://') ? avatarUrl : avatarUrl)
            } catch (err) {
              console.error('头像URL转换失败:', err)
              avatarUrl = ''
            }
          }
          // 合并而非覆盖：本地已有的 userInfo 优先（主人访问时头像可能是本地临时URL）
          const existingUserInfo = this.data.userInfo || {}
          this.setData({
            userInfo: {
              ...{ nickname: nickname, avatar: avatarUrl },
              ...existingUserInfo
            },
            avatarInitial: nickname ? nickname.charAt(0) : '?'
          })
        }
        // 计算微信号是否公开显示
        publicShareInfo.showWechat = !!(publicShareInfo.wechatPublic && publicShareInfo.wechatId)
        // 将公开名片信息同步到 shareInfo，使封面等配置对访客可见
        // cover 是 cloud:// 格式，需要转换为临时 URL
        let coverUrl = publicShareInfo.cover || ''
        if (coverUrl && (coverUrl.startsWith('cloud://') || coverUrl.includes('tcb.qcloud.la'))) {
          try {
            coverUrl = await getTempUrl(coverUrl.startsWith('cloud://') ? coverUrl : coverUrl)
          } catch (err) {
            console.error('封面图URL转换失败:', err)
            coverUrl = ''
          }
        }
        // 合并而非覆盖：优先使用本地已有的 shareInfo（主人访问时更完整）
        const cloudShareInfo = {
          cover: coverUrl,
          specialty: publicShareInfo.specialty || '',
          tags: publicShareInfo.tags || []
        }
        const finalShareInfo = { ...cloudShareInfo, ...this.data.shareInfo }
        // 但如果本地没有 cover，用云端的
        if (!finalShareInfo.cover && coverUrl) {
          finalShareInfo.cover = coverUrl
        }
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
          shareInfo: finalShareInfo,
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
    const userId = this.data.userId
    
    // 添加最近浏览记录
    this.addToRecentViews(id, userId)
    
    wx.navigateTo({
      url: `/pages/pet/detail?petId=${id}&isPublic=true&userId=${userId}`
    })
  },

  // 添加最近浏览记录
  addToRecentViews: function (petId, userId) {
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
      const pets = this.data.pets || []
      const pet = pets.find(p => p._id === petId)
      
      // 构建浏览记录
      const viewRecord = {
        _id: petId,
        name: pet ? pet.name : '未命名',
        breed: pet ? pet.breed : '未知品种',
        photos: pet ? pet.photos : [],
        isPublic: true,
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

  // 格式化日期时间
  _formatDateTime: function (date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hour = String(date.getHours()).padStart(2, '0')
    const minute = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day} ${hour}:${minute}`
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

  onShareAppMessage: function () {
    const { userId, ownerNickname, shareInfo } = this.data
    const title = ownerNickname ? `${ownerNickname}的龟档案` : '养龟档案 · 公开档案'
    const path = userId ? `/pages/public/index?userId=${userId}` : '/pages/public/index'
    return {
      title,
      path,
      imageUrl: shareInfo.cover || ''
    }
  },

  onShareTimeline: function () {
    const { userId, ownerNickname, shareInfo } = this.data
    const title = ownerNickname ? `${ownerNickname}的龟档案` : '养龟档案 · 公开档案'
    const query = userId ? `userId=${userId}` : ''
    return {
      title,
      query,
      imageUrl: shareInfo.cover || ''
    }
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
    if (!pet || !pet.photos || !pet.photos[0]) return

    const imgUrl = pet.photos[0]
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
          updatedPets[index] = { ...pet, photos: [newUrl, ...pet.photos.slice(1)] }
          this.setData({ pets: updatedPets })
      } catch (err) {
        console.error('重新获取宠物图片URL失败:', err)
        // 文件不存在，清空该图片避免无限重试
        const updatedPets = [...pets]
        updatedPets[index] = { ...pet, photos: [''] }
        this.setData({ pets: updatedPets })
      }
    }
  }
})