const { getAPI } = require('../../../utils/api.js')

function today() {
  return new Date().toISOString().slice(0, 10)
}

Page({
  data: {
    statusBarHeight: 0,
    totalNavHeight: 120,
    tankId: '',
    tank: { displayName: '龟缸详情' },
    loading: true,
    loadError: false,
    activeTab: 'water',
    // 龟缸提醒
    tankReminders: [],
    hasTankReminder: false,
    // 记录列表
    waterRecords: [],
    feedingRecords: [],
    eggRecords: [],
    hatchRecords: [],
    // 弹窗控制
    showWaterForm: false,
    showFeedingForm: false,
    showEggForm: false,
    showHatchForm: false,
    showEggSelector: false,
    showEditTankForm: false,
    submitting: false,
    // 选项数组
    waterChangeOptions: ['1/4', '1/3', '1/2', '2/3', '全换'],
    foodTypeOptions: ['龟粮', '鱼', '虾', '其他'],
    amountOptions: ['少量', '适中', '较多', '饱喂'],
    additiveOptions: ['无', '钙粉', '维生素', '益生菌', '微量元素', '其他'],
    // 表单数据
    waterForm: { record_date: '', water_change: '', water_change_index: 0, notes: '' },
    feedingForm: { record_date: '', food_type: '', food_type_index: 0, food_type_custom: '', amount_g: '', amount_index: 0, additives: '', additives_index: 0, additives_custom: '', notes: '' },
    eggForm: { lay_date: '', total_eggs: '', fertilized: '', unfertilized: 0, notes: '' },
    hatchForm: { hatch_date: '', total_hatched: '', perfect_count: '', imperfect_count: 0, notes: '' },
    editForm: { tank_code: '', name: '', size: '', species: '', notes: '' },
    selectedEggId: null,
    selectedEggDate: ''
  },

  onLoad(options) {
    const sysInfo = wx.getSystemInfoSync()
    const statusBarHeight = Math.max(sysInfo.statusBarHeight || 20, 20)
    const safeAreaTop = sysInfo.safeArea ? (sysInfo.safeArea.top || statusBarHeight) : statusBarHeight
    const finalStatusBarHeight = Math.max(statusBarHeight, safeAreaTop)
    const rpxRatio = 750 / sysInfo.windowWidth
    const totalNavHeight = Math.round(finalStatusBarHeight * rpxRatio) + 88 + 20
    this.setData({ statusBarHeight: finalStatusBarHeight, totalNavHeight })
    if (options.id) {
      this.setData({ tankId: options.id })
      this.loadAll()
    }
  },

  async loadAll() {
    this.setData({ loading: true, loadError: false })
    try {
      await this.loadTank()
      await Promise.all([
        this.loadWaterRecords(),
        this.loadFeedingRecords(),
        this.loadEggRecords(),
        this.loadHatchRecords(),
        this.loadTankReminders()
      ])
      this.setData({ loading: false })
    } catch (err) {
      console.error('[Detail] loadAll error:', err)
      this.setData({ loading: false, loadError: true })
    }
  },

  async loadTank() {
    try {
      const api = getAPI()
      const res = await api.request('GET', `/api/tanks/${this.data.tankId}`)
      if (res.success && res.data) {
        const tank = res.data
        const male = parseInt(tank.male_count) || 0
        const female = parseInt(tank.female_count) || 0
        const totalCount = male + female
        let ratio = '-'
        if (male > 0 && female > 0) {
          const g = this.gcd(male, female)
          ratio = `${male / g}:${female / g}`
        } else if (male > 0) {
          ratio = `${male}:0`
        } else if (female > 0) {
          ratio = `0:${female}`
        }
        tank.displayName = tank.name || '龟缸详情'
        tank.displayCode = tank.tank_code || ('T' + tank.id)
        tank.maleCount = male
        tank.femaleCount = female
        tank.totalCount = totalCount
        tank.ratio = ratio
        this.setData({ tank })
      } else {
        throw new Error(res.message || '获取龟缸详情失败')
      }
    } catch (err) {
      console.error('[Detail] loadTank error:', err)
      throw err
    }
  },

  gcd(a, b) {
    return b === 0 ? a : this.gcd(b, a % b)
  },

  // 加载龟缸提醒
  async loadTankReminders() {
    try {
      const api = getAPI()
      const res = await api.request('GET', `/api/tanks/${this.data.tankId}/reminders`)
      if (res.success && Array.isArray(res.data)) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const list = res.data.filter(r => r.enabled !== false).map(r => {
          const typeText = r.type === 'water' ? '换水' : r.type === 'feed' ? '喂食' : (r.event_name || '事件')
          const interval = Number(r.interval_days) || 0
          let nextDate = null
          let statusText = ''
          let statusClass = 'normal'
          let daysLeft = 0

          if (r.type === 'event' && r.event_date) {
            nextDate = new Date(r.event_date)
            nextDate.setHours(0, 0, 0, 0)
            daysLeft = Math.round((nextDate.getTime() - today.getTime()) / 86400000)
          } else if (r.next_remind) {
            nextDate = new Date(r.next_remind)
            nextDate.setHours(0, 0, 0, 0)
            daysLeft = Math.round((nextDate.getTime() - today.getTime()) / 86400000)
          }

          if (daysLeft < 0) {
            statusText = '超期' + Math.abs(daysLeft) + '天'
            statusClass = 'overdue'
          } else if (daysLeft === 0) {
            statusText = '今天'
            statusClass = 'today'
          } else if (daysLeft === 1) {
            statusText = '明天'
            statusClass = 'tomorrow'
          } else {
            statusText = daysLeft + '天后'
            statusClass = 'normal'
          }

          const fmtNext = nextDate ? `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(nextDate.getDate()).padStart(2, '0')}` : ''

          return {
            id: r.id,
            type: r.type,
            typeText,
            intervalDays: interval,
            nextDueDate: fmtNext,
            statusText,
            statusClass
          }
        })

        const priority = { overdue: 0, today: 1, tomorrow: 2, normal: 3 }
        list.sort((a, b) => (priority[a.statusClass] || 9) - (priority[b.statusClass] || 9))

        this.setData({
          tankReminders: list,
          hasTankReminder: list.length > 0
        })
      } else {
        this.setData({ tankReminders: [], hasTankReminder: false })
      }
    } catch (err) {
      console.error('[Detail] loadTankReminders error:', err)
      this.setData({ tankReminders: [], hasTankReminder: false })
    }
  },

  async loadWaterRecords() {
    try {
      const api = getAPI()
      const res = await api.request('GET', `/api/tanks/${this.data.tankId}/water`)
      if (res.success && Array.isArray(res.data)) {
        this.setData({ waterRecords: res.data })
      }
    } catch (err) {
      console.error('[Detail] loadWaterRecords error:', err)
    }
  },

  async loadFeedingRecords() {
    try {
      const api = getAPI()
      const res = await api.request('GET', `/api/tanks/${this.data.tankId}/feeding`)
      if (res.success && Array.isArray(res.data)) {
        this.setData({ feedingRecords: res.data })
      }
    } catch (err) {
      console.error('[Detail] loadFeedingRecords error:', err)
    }
  },

  async loadEggRecords() {
    try {
      const api = getAPI()
      const res = await api.request('GET', `/api/tanks/${this.data.tankId}/eggs`)
      if (res.success && Array.isArray(res.data)) {
        this.setData({ eggRecords: res.data })
      }
    } catch (err) {
      console.error('[Detail] loadEggRecords error:', err)
    }
  },

  async loadHatchRecords() {
    try {
      const api = getAPI()
      const res = await api.request('GET', `/api/tanks/${this.data.tankId}/hatch`)
      if (res.success && Array.isArray(res.data)) {
        this.setData({ hatchRecords: res.data })
      }
    } catch (err) {
      console.error('[Detail] loadHatchRecords error:', err)
    }
  },

  retryLoad() { this.loadAll() },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ activeTab: tab })
  },

  stopPropagation() {},

  // ====== 编辑龟缸信息 ======
  showEditForm() {
    const t = this.data.tank || {}
    this.setData({
      showEditTankForm: true,
      editForm: {
        tank_code: t.tank_code || '',
        name: t.name || '',
        size: t.size || '',
        species: t.species || '',
        notes: t.notes || ''
      }
    })
  },
  hideEditForm() { this.setData({ showEditTankForm: false }) },
  onEditInput(e) { this.setData({ ['editForm.' + e.currentTarget.dataset.field]: e.detail.value }) },
  async submitEditTank() {
    const f = this.data.editForm
    if (!f.name || !f.name.trim()) { wx.showToast({ title: '请输入名称', icon: 'none' }); return }
    this.setData({ submitting: true })
    try {
      const api = getAPI()
      const res = await api.request('PUT', `/api/tanks/${this.data.tankId}`, {
        tank_code: f.tank_code.trim(),
        name: f.name.trim(),
        size: f.size.trim(),
        species: f.species.trim(),
        notes: f.notes.trim()
      })
      if (res.success) {
        wx.showToast({ title: '保存成功', icon: 'success' })
        this.setData({ showEditTankForm: false })
        this.loadTank()
      } else {
        wx.showToast({ title: res.message || '保存失败', icon: 'none' })
      }
    } catch (err) {
      wx.showToast({ title: '网络错误', icon: 'none' })
    }
    this.setData({ submitting: false })
  },

  // ====== 换水弹窗 ======
  showWaterForm() {
    this.setData({ showWaterForm: true, waterForm: { record_date: today(), water_change: '', water_change_index: 0, notes: '' } })
  },
  hideWaterForm() { this.setData({ showWaterForm: false }) },
  onWaterDateChange(e) { this.setData({ 'waterForm.record_date': e.detail.value }) },
  onWaterChangePick(e) {
    const idx = e.detail.value
    this.setData({ 'waterForm.water_change_index': idx, 'waterForm.water_change': this.data.waterChangeOptions[idx] })
  },
  onWaterInput(e) { this.setData({ ['waterForm.' + e.currentTarget.dataset.field]: e.detail.value }) },
  async submitWater() {
    const f = this.data.waterForm
    if (!f.record_date) { wx.showToast({ title: '请选择日期', icon: 'none' }); return }
    if (!f.water_change) { wx.showToast({ title: '请选择换水量', icon: 'none' }); return }
    this.setData({ submitting: true })
    try {
      const api = getAPI()
      const res = await api.request('POST', `/api/tanks/${this.data.tankId}/water`, {
        record_date: f.record_date, water_change: f.water_change, notes: f.notes
      })
      if (res.success) {
        wx.showToast({ title: '保存成功', icon: 'success' })
        this.setData({ showWaterForm: false })
        this.loadWaterRecords()
      } else {
        wx.showToast({ title: res.message || '保存失败', icon: 'none' })
      }
    } catch (err) {
      wx.showToast({ title: '网络错误', icon: 'none' })
    }
    this.setData({ submitting: false })
  },

  // ====== 喂食弹窗 ======
  showFeedingForm() {
    this.setData({ showFeedingForm: true, feedingForm: { record_date: today(), food_type: '', food_type_index: 0, food_type_custom: '', amount_g: '', amount_index: 0, additives: '', additives_index: 0, additives_custom: '', notes: '' } })
  },
  hideFeedingForm() { this.setData({ showFeedingForm: false }) },
  onFeedingDateChange(e) { this.setData({ 'feedingForm.record_date': e.detail.value }) },
  onFoodTypePick(e) {
    const idx = e.detail.value
    const val = this.data.foodTypeOptions[idx]
    this.setData({ 'feedingForm.food_type_index': idx, 'feedingForm.food_type': val })
  },
  onAmountPick(e) {
    const idx = e.detail.value
    this.setData({ 'feedingForm.amount_index': idx, 'feedingForm.amount_g': this.data.amountOptions[idx] })
  },
  onAdditivesPick(e) {
    const idx = e.detail.value
    const val = this.data.additiveOptions[idx]
    this.setData({ 'feedingForm.additives_index': idx, 'feedingForm.additives': val })
  },
  onFeedingInput(e) { this.setData({ ['feedingForm.' + e.currentTarget.dataset.field]: e.detail.value }) },
  async submitFeeding() {
    const f = this.data.feedingForm
    if (!f.record_date) { wx.showToast({ title: '请选择日期', icon: 'none' }); return }
    let foodType = f.food_type
    if (foodType === '其他') {
      foodType = f.food_type_custom ? f.food_type_custom.trim() : ''
      if (!foodType) { wx.showToast({ title: '请输入食物名称', icon: 'none' }); return }
    }
    let additives = f.additives
    if (additives === '其他') {
      additives = f.additives_custom ? f.additives_custom.trim() : ''
      if (!additives) { wx.showToast({ title: '请输入营养剂名称', icon: 'none' }); return }
    } else if (additives === '无') {
      additives = ''
    }
    this.setData({ submitting: true })
    try {
      const api = getAPI()
      const res = await api.request('POST', `/api/tanks/${this.data.tankId}/feeding`, {
        record_date: f.record_date, food_type: foodType, amount_g: f.amount_g, additives: additives, notes: f.notes
      })
      if (res.success) {
        wx.showToast({ title: '保存成功', icon: 'success' })
        this.setData({ showFeedingForm: false })
        this.loadFeedingRecords()
      } else {
        wx.showToast({ title: res.message || '保存失败', icon: 'none' })
      }
    } catch (err) {
      wx.showToast({ title: '网络错误', icon: 'none' })
    }
    this.setData({ submitting: false })
  },

  // ====== 捡蛋弹窗 ======
  showEggForm() {
    this.setData({ showEggForm: true, eggForm: { lay_date: today(), total_eggs: '', fertilized: '', unfertilized: 0, notes: '' } })
  },
  hideEggForm() { this.setData({ showEggForm: false }) },
  onEggDateChange(e) { this.setData({ 'eggForm.lay_date': e.detail.value }) },
  onEggInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ ['eggForm.' + field]: e.detail.value })
    if (field === 'total_eggs' || field === 'fertilized') {
      const total = parseInt(this.data.eggForm.total_eggs) || 0
      const fertilized = parseInt(this.data.eggForm.fertilized) || 0
      this.setData({ 'eggForm.unfertilized': Math.max(0, total - fertilized) })
    }
  },
  async submitEgg() {
    const f = this.data.eggForm
    if (!f.lay_date) { wx.showToast({ title: '请选择日期', icon: 'none' }); return }
    this.setData({ submitting: true })
    try {
      const api = getAPI()
      const res = await api.request('POST', `/api/tanks/${this.data.tankId}/eggs`, {
        lay_date: f.lay_date, total_eggs: parseInt(f.total_eggs) || 0, fertilized: parseInt(f.fertilized) || 0,
        unfertilized: f.unfertilized, notes: f.notes
      })
      if (res.success) {
        wx.showToast({ title: '保存成功', icon: 'success' })
        this.setData({ showEggForm: false })
        this.loadEggRecords()
      } else {
        wx.showToast({ title: res.message || '保存失败', icon: 'none' })
      }
    } catch (err) {
      wx.showToast({ title: '网络错误', icon: 'none' })
    }
    this.setData({ submitting: false })
  },

  // ====== 出苗弹窗 ======
  goHatchFromTab() {
    if (this.data.eggRecords.length === 0) {
      wx.showToast({ title: '请先记录捡蛋', icon: 'none' })
      return
    }
    this.setData({ showEggSelector: true })
  },
  hideEggSelector() { this.setData({ showEggSelector: false }) },
  onSelectEggForHatch(e) {
    const eggId = e.currentTarget.dataset.id
    const eggDate = e.currentTarget.dataset.date
    this.setData({
      showEggSelector: false,
      showHatchForm: true,
      selectedEggId: eggId,
      selectedEggDate: eggDate,
      hatchForm: { hatch_date: today(), total_hatched: '', perfect_count: '', imperfect_count: 0, notes: '' }
    })
  },
  hideHatchForm() { this.setData({ showHatchForm: false, selectedEggId: null, selectedEggDate: '' }) },
  onHatchDateChange(e) { this.setData({ 'hatchForm.hatch_date': e.detail.value }) },
  onHatchInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ ['hatchForm.' + field]: e.detail.value })
    if (field === 'total_hatched' || field === 'perfect_count') {
      const total = parseInt(this.data.hatchForm.total_hatched) || 0
      const perfect = parseInt(this.data.hatchForm.perfect_count) || 0
      this.setData({ 'hatchForm.imperfect_count': Math.max(0, total - perfect) })
    }
  },
  async submitHatch() {
    const f = this.data.hatchForm
    if (!f.hatch_date) { wx.showToast({ title: '请选择日期', icon: 'none' }); return }
    if (!this.data.selectedEggId) { wx.showToast({ title: '请选择产蛋记录', icon: 'none' }); return }
    this.setData({ submitting: true })
    try {
      const api = getAPI()
      const res = await api.request('POST', `/api/tanks/${this.data.tankId}/eggs/${this.data.selectedEggId}/hatch`, {
        hatch_date: f.hatch_date, total_hatched: parseInt(f.total_hatched) || 0,
        perfect_count: parseInt(f.perfect_count) || 0, imperfect_count: f.imperfect_count, notes: f.notes
      })
      if (res.success) {
        wx.showToast({ title: '保存成功', icon: 'success' })
        this.setData({ showHatchForm: false, selectedEggId: null, selectedEggDate: '' })
        this.loadHatchRecords()
      } else {
        wx.showToast({ title: res.message || '保存失败', icon: 'none' })
      }
    } catch (err) {
      wx.showToast({ title: '网络错误', icon: 'none' })
    }
    this.setData({ submitting: false })
  },

  onPullDownRefresh() {
    this.loadAll().then(() => wx.stopPullDownRefresh())
  },

  navigateBack() { wx.navigateBack() },

  gotoReminders() {
    wx.navigateTo({
      url: `/subpkg-tanks/pages/tanks/reminders?id=${this.data.tankId}`
    })
  }
})
