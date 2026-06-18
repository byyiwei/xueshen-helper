const { getAPI } = require('../../utils/api.js')
const { showError, showSuccess } = require('../../utils/error.js')

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
    stats: {
      petCount: 0,
      eggCount: 0,
      pairEvents: 0,
      warningCount: 0
    },
    showSkeleton: false
  },

  onLoad: function () {
    this.setNavHeight()
    this.setGreetingText()
    const app = getApp()
    const isLoggedIn = app.globalData.isLoggedIn
    this.setData({ isLoggedIn })
    this.loadUserData()
    if (isLoggedIn) {
      this.loadReminders()
      this.loadStats()
    }
  },

  onShow: function () {
    const app = getApp()
    const isLoggedIn = app.globalData.isLoggedIn
    const loginFromIndex = app.globalData.loginFromIndex
    
    if (isLoggedIn && loginFromIndex) {
      app.globalData.loginFromIndex = false
      this.setData({ isLoggedIn: true, showSkeleton: true })
      setTimeout(async () => {
        await this.loadReminders()
        await this.loadStats()
        await this.loadUserData()
        this.setData({ showSkeleton: false })
      }, 800)
    } else {
      this.setData({ isLoggedIn })
      if (isLoggedIn) {
        this.loadReminders()
        this.loadStats()
      } else {
        this.setData({
          allReminders: [],
          hasAnyReminder: false,
          stats: {
            petCount: 0,
            eggCount: 0,
            pairEvents: 0,
            warningCount: 0
          }
        })
      }
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
    } catch (error) {
      console.error('加载用户信息失败:', error)
    }
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

      this.setData({
        allReminders: pending,
        hasAnyReminder: pending.length > 0
      })
    } catch (error) {
      console.error('加载提醒失败:', error)
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
    wx.showToast({ title: '龟缸功能开发中', icon: 'none' })
  },

  goToDiseasePrevention: function () {
    wx.navigateTo({ url: '/pages/tools/calculator' })
  },

  goToEggReport: function () {
    wx.navigateTo({ url: '/pages/egg-report/index' })
  },

  goToHatchReport: function () {
    wx.navigateTo({ url: '/pages/hatch-report/index' })
  },

  goToCalculator: function () {
    wx.navigateTo({ url: '/pages/tools/calculator' })
  },

  goToPublic: function () {
    wx.navigateTo({ url: '/pages/public/index' })
  },

  goToLogin: function () {
    const app = getApp()
    app.globalData.loginFromIndex = true
    wx.navigateTo({
      url: '/pages/login/index'
    })
  },

  // ========== 加载统计 ==========
  async loadStats() {
    try {
      const pets = wx.getStorageSync('pets') || []
      const records = wx.getStorageSync('records') || []

      let eggCount = 0
      let pairEvents = 0
      let warningCount = 0

      pets.forEach(pet => {
        if (pet.status === '预警') warningCount++
      })

      records.forEach(record => {
        if (record.type === '产蛋') {
          eggCount += parseInt(record.eggCount) || 0
        } else if (record.type === '交配') {
          pairEvents++
        }
      })

      this.setData({
        stats: {
          petCount: pets.length,
          eggCount,
          pairEvents,
          warningCount
        }
      })
    } catch (error) {
      console.error('加载统计数据失败:', error)
    }
  }
})
