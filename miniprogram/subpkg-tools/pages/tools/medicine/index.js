const { medicines: medicineList } = require('./medicines.js')

Page({
  data: {
    statusBarHeight: 0,
    totalNavHeight: 120,
    keyword: '',
    activeCategory: 'all',
    selectedMedicineId: '',
    calcValue: '',
    calcResult: null,

    categories: [
      { id: 'all', name: '全部' },
      { id: 'antibiotic', name: '抗生素' },
      { id: 'disinfectant', name: '消毒杀菌' },
      { id: 'antiparasite', name: '驱虫药' },
      { id: 'vitamin', name: '维生素' },
      { id: 'fungus', name: '真菌处理' },
      { id: 'other', name: '其他' }
    ],

    medicines: medicineList,

    filteredMedicines: []
  },

  onLoad() {
    const sysInfo = wx.getSystemInfoSync()
    const statusBarHeight = Math.max(sysInfo.statusBarHeight || 20, 20)
    const safeAreaTop = sysInfo.safeArea ? (sysInfo.safeArea.top || statusBarHeight) : statusBarHeight
    const finalStatusBarHeight = Math.max(statusBarHeight, safeAreaTop)
    const rpxRatio = 750 / sysInfo.windowWidth
    const totalNavHeight = Math.round(finalStatusBarHeight * rpxRatio) + 88 + 24

    this.setData({
      statusBarHeight: finalStatusBarHeight,
      totalNavHeight,
      filteredMedicines: this.data.medicines
    })
  },

  goBack() {
    wx.navigateBack()
  },

  goToCalculator() {
    wx.navigateTo({ url: '/subpkg-tools/pages/tools/medicine/calculator' })
  },

  onSearchInput(e) {
    this.setData({ keyword: e.detail.value || '' }, () => {
      this.filterMedicines()
    })
  },

  onSearchConfirm() {
    this.filterMedicines()
  },

  clearSearch() {
    this.setData({ keyword: '' }, () => {
      this.filterMedicines()
    })
  },

  switchCategory(e) {
    const categoryId = e.currentTarget.dataset.id
    this.setData({ activeCategory: categoryId }, () => {
      this.filterMedicines()
    })
  },

  filterMedicines() {
    const { keyword, activeCategory, medicines } = this.data
    const lowerKeyword = keyword.trim().toLowerCase()

    const filtered = medicines.filter(item => {
      const matchCategory = activeCategory === 'all' || item.categoryId === activeCategory
      const matchKeyword = !lowerKeyword ||
        item.name.toLowerCase().includes(lowerKeyword) ||
        item.indications.toLowerCase().includes(lowerKeyword) ||
        item.category.toLowerCase().includes(lowerKeyword)
      return matchCategory && matchKeyword
    })

    this.setData({ filteredMedicines: filtered })
  },

  selectMedicine(e) {
    const id = e.currentTarget.dataset.id
    const selected = id === this.data.selectedMedicineId ? '' : id
    this.setData({
      selectedMedicineId: selected,
      calcValue: '',
      calcResult: null
    })
  },

  onCalcInput(e) {
    this.setData({ calcValue: e.detail.value || '' })
  },

  calcByWater() {
    const medicine = this.getSelectedMedicine()
    if (!medicine || !medicine.waterDose) return

    const volume = parseFloat(this.data.calcValue)
    if (!volume || volume <= 0) {
      wx.showToast({ title: '请输入有效水体体积', icon: 'none' })
      return
    }

    const dose = medicine.waterDose.value
    const totalAmount = volume * dose
    this.setData({ calcResult: { mode: 'water', volume, dose, totalAmount, unit: medicine.waterDose.unit } })
  },

  calcByWeight() {
    const medicine = this.getSelectedMedicine()
    if (!medicine || !medicine.weightDose) return

    const weight = parseFloat(this.data.calcValue)
    if (!weight || weight <= 0) {
      wx.showToast({ title: '请输入有效体重', icon: 'none' })
      return
    }

    const dose = medicine.weightDose.value
    const totalAmount = weight * dose
    this.setData({ calcResult: { mode: 'weight', weight, dose, totalAmount, unit: medicine.weightDose.unit } })
  },

  getSelectedMedicine() {
    return this.data.medicines.find(item => item.id === this.data.selectedMedicineId)
  },

  noop() {}
})
