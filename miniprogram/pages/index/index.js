const { getAPI } = require('../../utils/api.js')
const { showError, showSuccess } = require('../../utils/error.js')
const { convertSinglePhoto } = require('../../utils/image.js')

const API = getAPI()

Page({
  data: {
    statusBarHeight: 0,
    totalNavHeight: 120,
    greetingText: '',
    userInfo: {},
    isLoggedIn: false,
    allReminders: [],
    hasAnyReminder: false,
    tankReminders: [],
    hasTankReminder: false,
    tankRemindersToday: [],
    tankRemindersFuture: [],
    hasFutureReminders: false,
    futureGroups: [],
    collapsedGroups: {},
    todoTab: 'pet', // pet | tank
    featuredPets: [],
    stats: {
      petCount: 0,
      eggCount: 0,
      pairEvents: 0,
      warningCount: 0
    },
    showSkeleton: false,
    tankCount: 0
  },

  onLoad: function () {
    this.setNavHeight()
    this.setGreetingText()
    const app = getApp()
    this.setData({ isLoggedIn: app.globalData.isLoggedIn })
    // Tab 页会被预创建，数据加载统一在 onShow 中处理
  },

  _applyPreloadedData: function (app) {
    const tankStats = app.globalData.preloadedTankStats || {}
    const tanks = app.globalData.preloadedTanks || []
    this.setData({
      allReminders: app.globalData.preloadedReminders || [],
      hasAnyReminder: !!app.globalData.preloadedHasReminder,
      stats: app.globalData.preloadedStats || {
        petCount: 0,
        eggCount: 0,
        pairEvents: 0,
        warningCount: 0
      },
      featuredPets: app.globalData.preloadedFeaturedPets || [],
      tankCount: tankStats.count !== undefined ? tankStats.count : tanks.length
    })
  },

  onShow: function () {
    const app = getApp()
    const isLoggedIn = app.globalData.isLoggedIn
    this.setData({ isLoggedIn })

    // loading 页完成后首次进入：直接使用预加载数据
    if (app.globalData.dataPreloaded && !this._preloadedApplied) {
      this._applyPreloadedData(app)
      this._preloadedApplied = true
      this.loadUserData()
      // 龟缸提醒未预加载，需主动获取
      this.loadTankReminders()
      // 如果预加载的宠物提醒为空（可能 token 过期导致预加载失败），重新加载
      if (!app.globalData.preloadedReminders || app.globalData.preloadedReminders.length === 0) {
        this.loadReminders()
      }
    } else if (this._preloadedApplied && isLoggedIn) {
      // 后续返回首页时刷新
      this.loadReminders()
      this.loadTankReminders()
      this.loadStats()
      this.loadUserData()
      this.refreshTankCount()
    } else if (!this._preloadedApplied && !app.globalData.dataPreloaded && isLoggedIn) {
      // 未经过 loading 页的直接进入（兜底）
      this.loadReminders()
      this.loadTankReminders()
      this.loadStats()
      this.loadUserData()
      this._preloadedApplied = true
    }

    const updateTabBar = () => {
      if (typeof this.getTabBar === 'function' && this.getTabBar()) {
        const tabBar = this.getTabBar()
        tabBar.setData({ selected: 0, visible: true })
      }
    }
    updateTabBar()
    setTimeout(updateTabBar, 100)
  },

  setNavHeight: function () {
    const sysInfo = wx.getSystemInfoSync()
    const statusBarHeight = sysInfo.statusBarHeight || 20
    const navBarHeight = 44
    this.setData({
      statusBarHeight: statusBarHeight,
      totalNavHeight: (statusBarHeight + navBarHeight) * 2
    })
  },

  setGreetingText: function () {
    const hour = new Date().getHours()
    let greeting = '你好'
    if (hour < 6) greeting = '夜深了'
    else if (hour < 12) greeting = '早上好'
    else if (hour < 14) greeting = '中午好'
    else if (hour < 18) greeting = '下午好'
    else greeting = '晚上好'
    this.setData({ greetingText: greeting })
  },

  async loadUserData() {
    try {
      const userInfo = wx.getStorageSync('userInfo') || {}
      this.setData({ userInfo })
      // 异步刷新头像临时 URL（云存储签名可能已过期）
      if (userInfo.avatar) {
        this.refreshUserAvatar(userInfo)
      }
    } catch (error) {
      console.error('加载用户信息失败:', error)
    }
  },

  /**
   * 刷新头像图片 URL
   * TCB 云存储的临时签名有时效，过期后返回 403，这里统一刷新
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
      console.error('刷新头像 URL 失败:', err)
    }
  },

  /**
   * 头像图片加载失败处理
   * 尝试刷新临时 URL，若仍失败则清空头像显示默认占位
   */
  onAvatarError: async function () {
    const avatar = this.data.userInfo.avatar
    if (!avatar) return
    try {
      const newUrl = await convertSinglePhoto(avatar)
      if (newUrl && newUrl !== avatar) {
        const userInfo = { ...this.data.userInfo, avatar: newUrl }
        this.setData({ userInfo })
        wx.setStorageSync('userInfo', userInfo)
        return
      }
    } catch (err) {}
    // 刷新仍失败，清空头像显示默认占位
    const userInfo = { ...this.data.userInfo, avatar: '' }
    this.setData({ userInfo })
    wx.setStorageSync('userInfo', userInfo)
  },

  onPullDown: async function () {
    if (this.data.isLoggedIn) {
      await Promise.all([
        this.loadReminders(),
        this.loadStats(),
        this.loadUserData()
      ])
    } else {
      await this.loadUserData()
    }
    wx.stopPullDownRefresh()
  },

  // ========== 日期工具 ==========
  _parseDateStr: function (dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return null
    const m = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
    if (!m) return null
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 0, 0, 0, 0)
  },

  _formatDate: function (d) {
    if (!(d instanceof Date)) d = new Date(d)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  },

  // ========== 提醒状态计算（与详情页 _computeStatus 完全一致） ==========
  _computeReminderStatus: function (r) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = this._formatDate(today)
    let statusText
    let statusClass
    let daysLeft
    const interval = Number(r.intervalDays) || 1

    if (!r.lastDone) {
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

    // nextDueDate 计算（与详情页一致）
    const baseDate = r.lastDone ? this._parseDateStr(r.lastDone) : new Date(today)
    const nextDueDate = new Date(baseDate || today)
    nextDueDate.setDate(nextDueDate.getDate() + interval)

    return {
      ...r,
      id: r.id || r._id,
      statusText,
      statusClass,
      daysLeft,
      doneToday: r.lastDone === todayStr,
      nextDueDate: this._formatDate(nextDueDate)
    }
  },

  // ========== 加载提醒（云端 + 本地） ==========
  async loadReminders() {
    const loadId = ++this._reminderLoadId
    try {
      const pets = wx.getStorageSync('pets') || []

      let cloudResult = null
      try {
        cloudResult = API.getAllReminders ? await API.getAllReminders() : null
      } catch (e) {
        console.warn('[首页] 获取云端提醒失败:', e)
      }

      let reminderListByPet = {}

      if (cloudResult && cloudResult.success) {
        const list = Array.isArray(cloudResult.data)
          ? cloudResult.data
          : (cloudResult.data && Array.isArray(cloudResult.data.list) ? cloudResult.data.list : [])

        for (let i = 0; i < list.length; i++) {
          const r = list[i]
          const key = r.petId
          if (!key) continue
          if (!reminderListByPet[key]) reminderListByPet[key] = []
          reminderListByPet[key].push(r)
        }
      }

      const result = []
      for (let i = 0; i < pets.length; i++) {
        const pet = pets[i]
        const petId = pet.id || pet._id
        if (!petId) continue

        const reminders = reminderListByPet[petId] || pet.reminders || []

        for (let j = 0; j < reminders.length; j++) {
          const computed = this._computeReminderStatus(reminders[j])
          result.push({
            ...computed,
            petId: petId,
            // 【修复】别名优先：alias > name > 未命名
            petName: pet.alias || pet.name || '未命名',
            petCategory: pet.category || ''
          })
        }
      }

      // 只显示需处理的待办（超期/今天/明天，排除已完成）
      const pending = result.filter(r =>
        (r.statusClass === 'overdue' ||
          r.statusClass === 'today' ||
          r.statusClass === 'tomorrow') && !r.doneToday
      )

      const priority = { overdue: 0, today: 1, tomorrow: 2, normal: 3, pending: 4 }
      pending.sort((a, b) => {
        const pa = priority[a.statusClass] || 9
        const pb = priority[b.statusClass] || 9
        if (pa !== pb) return pa - pb
        return (a.daysLeft || 0) - (b.daysLeft || 0)
      })

      if (loadId !== this._reminderLoadId) return

      this.setData({
        allReminders: pending,
        hasAnyReminder: pending.length > 0
      })
    } catch (error) {
      console.error('加载提醒失败:', error)
    }
  },

  // 加载龟缸提醒
  async loadTankReminders() {
    try {
      const res = await API.getTankRemindersDue()
      if (res.success && res.data) {
        const list = (res.data.list || []).map(r => {
          let dateStr = r.nextDueDate || ''
          if (dateStr) {
            const d = new Date(dateStr)
            if (!isNaN(d.getTime())) {
              dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
            }
          }
          return { ...r, nextDueDate: dateStr }
        })
        const priority = { overdue: 0, today: 1, tomorrow: 2, dayafter: 3, normal: 4 }
        list.sort((a, b) => {
          const pa = priority[a.statusClass] || 9
          const pb = priority[b.statusClass] || 9
          return pa - pb
        })
        const todayList = list.filter(r => r.statusClass === 'overdue' || r.statusClass === 'today')
        const futureList = list.filter(r => r.statusClass !== 'overdue' && r.statusClass !== 'today')

        // 按日期标签分组，并按类型拆分子组
        const groupMap = {}
        futureList.forEach(r => {
          const label = r.statusText
          if (!groupMap[label]) {
            groupMap[label] = { label, items: [], typeBreakdown: [] }
          }
          groupMap[label].items.push(r)
        })
        // 计算每个分组的类型明细
        Object.values(groupMap).forEach(g => {
          const typeMap = {}
          g.items.forEach(r => {
            const t = r.typeText
            if (!typeMap[t]) typeMap[t] = { type: r.type, typeText: t, count: 0 }
            typeMap[t].count++
          })
          g.typeBreakdown = Object.values(typeMap)
        })
        const futureGroups = Object.values(groupMap)

        // 默认折叠状态：超过3个缸的分组折叠
        const collapsedGroups = {}
        futureGroups.forEach((g, i) => {
          collapsedGroups[g.label] = g.items.length > 3
        })

        this.setData({
          tankReminders: list,
          hasTankReminder: list.length > 0,
          tankRemindersToday: todayList,
          tankRemindersFuture: futureList,
          hasFutureReminders: futureList.length > 0,
          futureGroups,
          collapsedGroups
        })
      } else {
        this.setData({ tankReminders: [], hasTankReminder: false, tankRemindersToday: [], tankRemindersFuture: [], hasFutureReminders: false, futureGroups: [], collapsedGroups: {} })
      }
    } catch (error) {
      console.error('加载龟缸提醒失败:', error)
      this.setData({ tankReminders: [], hasTankReminder: false, tankRemindersToday: [], tankRemindersFuture: [], hasFutureReminders: false, futureGroups: [], collapsedGroups: {} })
    }
  },

  toggleFutureGroup(e) {
    const label = e.currentTarget.dataset.label
    if (!label) return
    const collapsedGroups = { ...this.data.collapsedGroups }
    collapsedGroups[label] = !collapsedGroups[label]
    this.setData({ collapsedGroups })
  },

  // 切换待办 tab
  switchTodoTab: function (e) {
    const tab = e.currentTarget.dataset.tab
    if (tab && tab !== this.data.todoTab) {
      this.setData({ todoTab: tab })
    }
  },

  // 从龟缸提醒跳转到龟缸详情
  gotoTankDetailFromReminder: function (e) {
    const tankId = e.currentTarget.dataset.tankId
    if (tankId) {
      wx.navigateTo({
        url: `/subpkg-tanks/pages/tanks/detail?id=${tankId}`
      })
    }
  },

  // ========== 标记完成（与详情页 markReminderDone 逻辑一致） ==========
  markReminderDoneFromIndex: async function (e) {
    const { petId, reminderId } = e.currentTarget.dataset
    if (!reminderId) return

    // 从当前列表中查找该提醒
    const item = (this.data.allReminders || []).find(
      r => String(r.id) === String(reminderId)
    )
    if (!item) {
      showError('未找到该提醒')
      return
    }

    const cloudId = item._id || item.id
    const interval = Number(item.intervalDays) || 1
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = this._formatDate(today)

    // 两步切换（与详情页一致）：
    // 第1次点击 → 标记今天完成（lastDone = today）
    // 第2次点击 → 推进下一周期（lastDone = today + interval）
    const isDoneToday = item.lastDone === todayStr
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
      console.warn('云端标记完成失败:', err)
    }

    if (!cloudOk) {
      showError('云端更新失败，请重试')
      return
    }

    // 2. 本地立即更新
    showSuccess(isDoneToday ? '已推进至下一周期' : '已标记完成')
    this.loadReminders()
  },

  // ========== 导航跳转 ==========
  gotoPetDetailFromReminder: function (e) {
    const { petId } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/pet/detail?petId=${petId}`
    })
  },

  goToPetList: function () {
    wx.switchTab({ url: '/pages/pet/index' })
  },

  goToTank: function () {
    wx.switchTab({ url: '/pages/tanks/index' })
  },

  refreshTankCount: function () {
    const app = getApp()
    const tankStats = app.globalData.preloadedTankStats
    const tanks = app.globalData.preloadedTanks
    if (tankStats && tankStats.count !== undefined) {
      this.setData({ tankCount: tankStats.count })
    } else if (tanks) {
      this.setData({ tankCount: tanks.length })
    }
  },

  goToDiseasePrevention: function () {
    wx.navigateTo({ url: '/subpkg-tools/pages/tools/medicine/index' })
  },

  goToEggReport: function () {
    wx.navigateTo({ url: '/subpkg-report/pages/egg-report/index' })
  },

  goToHatchReport: function () {
    wx.navigateTo({ url: '/subpkg-report/pages/hatch-report/index' })
  },

  goToTankDashboard: function () {
    wx.navigateTo({ url: '/subpkg-tanks/pages/tanks/dashboard' })
  },

  goToCalculator: function () {
    wx.navigateTo({ url: '/subpkg-tools/pages/tools/calculator' })
  },

  goToPublic: function () {
    const openid = wx.getStorageSync('openid')
    if (openid) {
      wx.navigateTo({ url: `/subpkg-report/pages/public/index?userId=${openid}` })
    } else {
      const app = getApp()
      app.promptLogin()
    }
  },

  goToLogin: function () {
    const app = getApp()
    app.requireLogin()
  },

  // ========== 加载统计 ==========
  async loadStats() {
    const loadId = ++this._statsLoadId
    try {
      const pets = wx.getStorageSync('pets') || []
      const records = wx.getStorageSync('records') || []

      let eggCount = 0
      let pairEvents = 0
      let warningCount = 0

      pets.forEach(pet => {
        if (pet.status === '预警') warningCount++
      })

      const featuredPets = pets.slice(0, 3).map((pet, index) => {
        const name = pet.alias || pet.name || `龟${index + 1}`
        return {
          id: pet.id || pet._id || index,
          cover: pet.photos && pet.photos.length ? pet.photos[0] : '',
          shortName: String(name).slice(0, 1)
        }
      })

      records.forEach(record => {
        if (record.type === '产蛋') {
          eggCount += parseInt(record.eggCount) || 0
        } else if (record.type === '交配') {
          pairEvents++
        }
      })

      if (loadId !== this._statsLoadId) return

      this.setData({
        stats: {
          petCount: pets.length,
          eggCount,
          pairEvents,
          warningCount
        },
        featuredPets
      })
    } catch (error) {
      console.error('加载统计数据失败:', error)
    }
  }
})
