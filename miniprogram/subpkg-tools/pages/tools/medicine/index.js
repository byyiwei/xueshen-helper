const { getAPI } = require('../../../../utils/api.js')

Page({
  data: {
    statusBarHeight: 0,
    totalNavHeight: 120,
    keyword: '',
    activeCategory: 'all',
    loading: false,
    loadError: false,
    medicines: [],
    categories: [{ id: 'all', name: '全部' }],
    filteredMedicines: [],
    showReportModal: false,
    reportSubmitting: false,
    reportForm: {
      medicineName: '',
      email: ''
    }
  },

  onLoad() {
    const sysInfo = wx.getSystemInfoSync()
    const statusBarHeight = Math.max(sysInfo.statusBarHeight || 20, 20)
    const safeAreaTop = sysInfo.safeArea ? (sysInfo.safeArea.top || statusBarHeight) : statusBarHeight
    const finalStatusBarHeight = Math.max(statusBarHeight, safeAreaTop)
    const rpxRatio = 750 / sysInfo.windowWidth
    const totalNavHeight = Math.round(finalStatusBarHeight * rpxRatio) + 88 + 24

    this.setData({ statusBarHeight: finalStatusBarHeight, totalNavHeight })
    this.loadMedicines()
  },

  async loadMedicines() {
    this.setData({ loading: true, loadError: false })
    try {
      const api = getAPI()
      const res = await api.getMedicines()
      if (res.success && Array.isArray(res.data)) {
        const cats = [{ id: 'all', name: '全部' }]
        const seen = new Set()
        for (const m of res.data) {
          if (m.category && !seen.has(m.category)) {
            seen.add(m.category)
            cats.push({ id: m.category, name: m.category })
          }
        }
        this.setData({
          medicines: res.data, filteredMedicines: res.data,
          categories: cats, loading: false
        })
        return
      }
    } catch (_) {}
    this.setData({ loading: false, loadError: true })
  },

  retryLoad() {
    this.loadMedicines()
  },

  goBack() {
    wx.navigateBack()
  },

  goToCalculator(e) {
    const id = e ? e.currentTarget.dataset.id : ''
    wx.navigateTo({ url: `/subpkg-tools/pages/tools/medicine/calculator${id ? '?medicineId=' + id : ''}` })
  },

  onSearchInput(e) {
    this.setData({ keyword: e.detail.value || '' }, () => this.filterMedicines())
  },

  onSearchConfirm() {
    this.filterMedicines()
  },

  clearSearch() {
    this.setData({ keyword: '' }, () => this.filterMedicines())
  },

  switchCategory(e) {
    const categoryId = e.currentTarget.dataset.id
    this.setData({ activeCategory: categoryId }, () => this.filterMedicines())
  },

  filterMedicines() {
    const { keyword, activeCategory, medicines } = this.data
    const lowerKeyword = keyword.trim().toLowerCase()

    const filtered = medicines.filter(item => {
      const matchCategory = activeCategory === 'all' || item.category === activeCategory
      const matchKeyword = !lowerKeyword ||
        item.name.toLowerCase().includes(lowerKeyword) ||
        (item.indications || '').toLowerCase().includes(lowerKeyword) ||
        item.category.toLowerCase().includes(lowerKeyword)
      return matchCategory && matchKeyword
    })
    this.setData({ filteredMedicines: filtered })
  },

  openReportModal() {
    this.setData({
      showReportModal: true,
      reportForm: {
        medicineName: this.data.keyword || '',
        email: ''
      }
    })
  },

  closeReportModal() {
    this.setData({ showReportModal: false })
  },

  stopProp() {},

  onReportNameInput(e) {
    this.setData({ 'reportForm.medicineName': e.detail.value })
  },

  onReportEmailInput(e) {
    this.setData({ 'reportForm.email': e.detail.value })
  },

  async submitReport() {
    const { medicineName, email } = this.data.reportForm
    if (!medicineName.trim()) {
      wx.showToast({ title: '请填写药品名称', icon: 'none' })
      return
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      wx.showToast({ title: '请填写有效邮箱', icon: 'none' })
      return
    }

    this.setData({ reportSubmitting: true })
    try {
      const api = getAPI()
      const res = await api.reportMedicine(medicineName.trim(), email.trim())
      if (res.success) {
        wx.showToast({ title: '上报成功', icon: 'success' })
        this.setData({ showReportModal: false, reportForm: { medicineName: '', email: '' } })
      } else {
        wx.showToast({ title: res.message || '上报失败', icon: 'none' })
      }
    } catch (_) {
      wx.showToast({ title: '网络错误，请重试', icon: 'none' })
    } finally {
      this.setData({ reportSubmitting: false })
    }
  }
})
