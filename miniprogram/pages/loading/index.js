const { getAPI } = require('../../utils/api')
const { convertPhotoIdsToUrls } = require('../../utils/image')
const { mergeCategories } = require('../../utils/category')
const API = getAPI()

Page({
  data: {
    loadingText: '正在初始化...'
  },

  onLoad: function () {
    this.startLoading()
  },

  async startLoading() {
    const app = getApp()

    // 步骤1：连接服务
    this.setData({ loadingText: '正在连接服务...' })
    try { await this.initCloud() } catch (e) {}

    // 步骤2：获取身份
    this.setData({ loadingText: '正在获取身份...' })
    try { await this.getOpenid(app) } catch (e) {}

    // 步骤3：加载宠物列表（必须先加载，首页数据依赖它）
    this.setData({ loadingText: '正在加载宠物列表...' })
    try { await this.loadPetData(app) } catch (e) {}

    // 步骤4：加载首页数据（依赖宠物列表）
    this.setData({ loadingText: '正在加载首页数据...' })
    try { await this.loadIndexData(app) } catch (e) {}

    // 步骤5：加载个人中心
    this.setData({ loadingText: '正在加载个人中心...' })
    try { await this.loadMyData(app) } catch (e) {}

    // 确保预加载标记完整（即使某步失败，Tab 页也能识别预加载已完成）
    this._finalizePreload(app)

    // 加载完成，进入首页
    wx.switchTab({ url: '/pages/index/index' })
  },

  _finalizePreload(app) {
    const pets = app.globalData.preloadedPets || wx.getStorageSync('pets') || []
    app.globalData.preloadedPets = pets
    if (app.globalData.preloadedReminders === undefined || app.globalData.preloadedReminders === null) {
      app.globalData.preloadedReminders = []
    }
    if (!app.globalData.preloadedStats) {
      app.globalData.preloadedStats = {
        petCount: pets.length,
        eggCount: 0,
        pairEvents: 0,
        warningCount: 0
      }
    }
    if (!app.globalData.preloadedFeaturedPets) {
      app.globalData.preloadedFeaturedPets = pets.slice(0, 3).map((pet, index) => ({
        id: pet.id || pet._id || index,
        cover: pet.photos && pet.photos.length ? pet.photos[0] : '',
        shortName: String(pet.alias || pet.name || `龟${index + 1}`).slice(0, 1)
      }))
    }
    if (app.globalData.preloadedMyStats === undefined || app.globalData.preloadedMyStats === null) {
      const records = wx.getStorageSync('records') || []
      app.globalData.preloadedMyStats = {
        petCount: pets.length,
        recordCount: records.length
      }
    }
    app.globalData.dataPreloaded = true
  },

  // 初始化云环境
  initCloud() {
    return new Promise((resolve) => {
      if (wx.cloud) {
        wx.cloud.init({ env: 'cloud1-d0g853l9d7017ea3b' })
      }
      setTimeout(resolve, 200)
    })
  },

  // 获取 openid（静默登录）
  async getOpenid(app) {
    let openid = ''
    try { openid = wx.getStorageSync('openid') } catch (e) {}

    if (openid) {
      app.globalData.isLoggedIn = true
      app.globalData.openid = openid
      return
    }

    try {
      const res = await wx.cloud.callFunction({
        name: 'login',
        data: { action: '', data: {} }
      })
      if (res.result && res.result.success && res.result.data && res.result.data.openid) {
        openid = res.result.data.openid
        const user = res.result.data.user
        try { wx.setStorageSync('openid', openid) } catch (e) {}
        app.globalData.isLoggedIn = true
        app.globalData.openid = openid

        if (user) {
          try {
            let localUser = wx.getStorageSync('userInfo') || {}
            if (!localUser.nickname) {
              if (user.nickname && user.nickname !== '') {
                localUser.nickname = user.nickname
              } else {
                let idx = wx.getStorageSync('userIndex') || 0
                idx += 1
                wx.setStorageSync('userIndex', idx)
                localUser.nickname = '养龟档案' + idx
              }
            }
            if (!localUser.avatar && user.avatar && user.avatar !== '') {
              localUser.avatar = user.avatar
            }
            if (!localUser.phone && user.phone && user.phone !== '') {
              localUser.phone = user.phone
            }
            wx.setStorageSync('userInfo', localUser)
            if (user.createdAt) {
              const t = user.createdAt instanceof Date
                ? user.createdAt.toISOString()
                : user.createdAt
              wx.setStorageSync('registerTime', t)
            }
          } catch (e) {}
        }
      }
    } catch (err) {
      console.error('获取 openid 失败:', err)
    }
  },

  // 加载首页数据
  async loadIndexData(app) {
    const userInfo = wx.getStorageSync('userInfo') || {}
    app.globalData.userInfo = userInfo

    // 优先使用预加载的宠物数据（loadPetData 已加载）
    const pets = app.globalData.preloadedPets || wx.getStorageSync('pets') || []
    let allReminders = []
    try {
      const cloudResult = await API.getAllReminders()
      if (cloudResult && cloudResult.success && cloudResult.data) {
        const data = cloudResult.data
        allReminders = Array.isArray(data) ? data : (data.list || [])
      }
    } catch (e) {}

    const localReminders = this._buildLocalReminders(pets)
    const merged = this._mergeReminders(allReminders, localReminders)
    const enriched = merged.map(r => this._computeReminderStatus(r))
    const pending = enriched.filter(r =>
      (r.statusClass === 'overdue' || r.statusClass === 'today' || r.statusClass === 'tomorrow') && !r.doneToday
    )
    const priority = { overdue: 0, today: 1, tomorrow: 2, normal: 3, pending: 4 }
    pending.sort((a, b) => {
      const pa = priority[a.statusClass] || 9
      const pb = priority[b.statusClass] || 9
      if (pa !== pb) return pa - pb
      return (a.daysLeft || 0) - (b.daysLeft || 0)
    })

    app.globalData.preloadedReminders = pending
    app.globalData.preloadedHasReminder = pending.length > 0

    let eggCount = 0
    let pairEvents = 0
    let warningCount = 0
    pets.forEach(p => {
      if (p.status === '预警') warningCount++
    })
    // 产蛋/配对记录存储在独立 records 集合，需从本地缓存统计
    const records = wx.getStorageSync('records') || []
    records.forEach(r => {
      if (r.type === '产蛋') eggCount += parseInt(r.eggCount || 0)
      if (r.type === '配对') pairEvents++
    })
    const featuredPets = pets.slice(0, 3).map((pet, index) => ({
      id: pet.id || pet._id || index,
      cover: pet.photos && pet.photos.length ? pet.photos[0] : '',
      shortName: String(pet.alias || pet.name || `龟${index + 1}`).slice(0, 1)
    }))

    app.globalData.preloadedStats = {
      petCount: pets.length,
      eggCount,
      pairEvents,
      warningCount
    }
    app.globalData.preloadedFeaturedPets = featuredPets
  },

  // 加载宠物数据
  async loadPetData(app) {
    const openid = app.globalData.openid
    if (!openid) return

    try {
      const result = await API.getPetList({}, 1, 20)
      if (result && result.success && result.data) {
        const pets = result.data.list || result.data.pets || []
        for (const pet of pets) {
          if (pet.photos && pet.photos.length > 0) {
            const validPhotoIds = pet.photos.filter(p => p && typeof p === 'string')
            const urls = await convertPhotoIdsToUrls(validPhotoIds)
            pet.photos = urls.filter(u => u)
          }
        }
        wx.setStorageSync('pets', pets)
        app.globalData.preloadedPets = pets
      }
    } catch (e) {
      console.error('加载宠物列表失败:', e)
    }

    try {
      const catResult = await API.getCategories()
      if (catResult && catResult.success && catResult.data && catResult.data.categories) {
        const localCategories = wx.getStorageSync('categories') || []
        const petCategories = (app.globalData.preloadedPets || wx.getStorageSync('pets') || [])
          .map(p => p.category)
          .filter(Boolean)
        const categories = mergeCategories(catResult.data.categories, localCategories, petCategories)
        wx.setStorageSync('categories', categories)
        app.globalData.preloadedCategories = categories
      }
    } catch (e) {
      console.error('加载分类失败:', e)
    }
  },

  // 加载我的页面数据
  async loadMyData(app) {
    const openid = app.globalData.openid
    if (!openid) return

    try {
      const shareRes = await API.getShareInfo()
      if (shareRes && shareRes.success) {
        app.globalData.preloadedShareInfo = shareRes.data
      }
    } catch (e) {}

    // 二维码：优先用缓存
    try {
      const cachedQrcode = wx.getStorageSync('qrcodeImage')
      if (cachedQrcode) {
        app.globalData.preloadedQrcode = cachedQrcode
      } else {
        const result = await wx.cloud.callFunction({
          name: 'qrcode',
          data: {
            action: 'generate',
            data: { scene: 'userId=' + openid, page: 'subpkg-report/pages/public/index' }
          }
        })
        if (result.result && result.result.success && result.result.data) {
          const fileID = result.result.data.fileID || result.result.data
          if (fileID && typeof fileID === 'string' && fileID.startsWith('cloud://')) {
            const tempFileRes = await wx.cloud.downloadFile({ fileID })
            app.globalData.preloadedQrcode = tempFileRes.tempFilePath
            wx.setStorageSync('qrcodeImage', tempFileRes.tempFilePath)
            wx.setStorageSync('qrcodeImageVersion', 2)
          }
        }
      }
    } catch (e) {
      console.error('加载二维码失败:', e)
    }

    try {
      const pets = app.globalData.preloadedPets || wx.getStorageSync('pets') || []
      const records = wx.getStorageSync('records') || []
      app.globalData.preloadedMyStats = {
        petCount: pets.length,
        recordCount: records.length
      }
    } catch (e) {}
  },

  _buildLocalReminders(pets) {
    const reminders = []
    pets.forEach(pet => {
      if (!pet.reminders || pet.reminders.length === 0) return
      pet.reminders.forEach(r => {
        if (!r.date && r.intervalDays === undefined) return
        reminders.push({
          ...r,
          petId: pet.id || pet._id,
          petName: pet.alias || pet.name || '未命名',
          petCategory: pet.category || '',
          _source: 'local'
        })
      })
    })
    return reminders
  },

  _mergeReminders(cloudList, localList) {
    const map = new Map()
    const cloudArr = Array.isArray(cloudList) ? cloudList : []
    const localArr = Array.isArray(localList) ? localList : []
    cloudArr.forEach(r => {
      const key = (r.petId || '') + '|' + (r.type || '')
      map.set(key, { ...r, _source: 'cloud' })
    })
    localArr.forEach(r => {
      const key = (r.petId || '') + '|' + (r.type || '')
      if (!map.has(key)) {
        map.set(key, r)
      }
    })
    return Array.from(map.values())
  },

  // 安全解析 YYYY-MM-DD 格式日期
  _parseDateStr(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return null
    const m = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
    if (!m) return null
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 0, 0, 0, 0)
  },

  _formatDate(d) {
    if (!(d instanceof Date)) d = new Date(d)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  },

  _computeReminderStatus(reminder) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = this._formatDate(today)
    let statusText
    let statusClass
    let daysLeft
    let nextDueDate
    let doneToday = false

    // 周期提醒模型（云端标准格式）：基于 lastDone + intervalDays
    if (reminder.intervalDays !== undefined || reminder.lastDone !== undefined) {
      const interval = Number(reminder.intervalDays) || 1
      if (!reminder.lastDone) {
        const nextDueFromToday = new Date(today)
        nextDueFromToday.setDate(nextDueFromToday.getDate() + interval)
        daysLeft = Math.round((nextDueFromToday.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))
        nextDueDate = nextDueFromToday
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
        const lastDone = this._parseDateStr(reminder.lastDone)
        if (!lastDone) {
          statusText = '数据异常'
          statusClass = 'overdue'
          daysLeft = -999
          nextDueDate = today
        } else {
          const nextDue = new Date(lastDone)
          nextDue.setDate(nextDue.getDate() + interval)
          nextDueDate = nextDue
          const diffMs = nextDue.getTime() - today.getTime()
          daysLeft = Math.round(diffMs / (24 * 60 * 60 * 1000))
          doneToday = (reminder.lastDone === todayStr)
          if (daysLeft < 0) {
            statusText = '超期 ' + Math.abs(daysLeft) + ' 天'
            statusClass = 'overdue'
          } else if (daysLeft === 0) {
            statusText = doneToday ? '已完成' : '今天'
            statusClass = 'today'
          } else if (daysLeft === 1) {
            statusText = doneToday ? '已完成' : '明天'
            statusClass = 'tomorrow'
          } else {
            statusText = daysLeft + ' 天后'
            statusClass = 'normal'
          }
        }
      }
    } else if (reminder.date) {
      // 旧单次提醒模型兼容
      const d = this._parseDateStr(reminder.date)
      if (!d) {
        statusText = '数据异常'
        statusClass = 'overdue'
        daysLeft = -999
        nextDueDate = today
      } else {
        nextDueDate = new Date(d.getFullYear(), d.getMonth(), d.getDate())
        const diff = Math.floor((nextDueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        daysLeft = diff
        doneToday = !!reminder.done
        if (reminder.done) {
          statusText = '已完成'
          statusClass = 'done'
        } else if (diff < 0) {
          statusText = '超期 ' + Math.abs(diff) + ' 天'
          statusClass = 'overdue'
        } else if (diff === 0) {
          statusText = '今天'
          statusClass = 'today'
        } else if (diff === 1) {
          statusText = '明天'
          statusClass = 'tomorrow'
        } else {
          statusText = diff + ' 天后'
          statusClass = 'normal'
        }
      }
    } else {
      statusText = '数据异常'
      statusClass = 'overdue'
      daysLeft = -999
      nextDueDate = today
    }

    return {
      ...reminder,
      id: reminder.id || reminder._id,
      statusText,
      statusClass,
      daysLeft,
      doneToday,
      nextDueDate: this._formatDate(nextDueDate)
    }
  }
})
