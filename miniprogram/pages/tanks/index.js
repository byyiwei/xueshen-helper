const { getAPI } = require('../../utils/api.js')
const { mergeCategories, syncMissingCategoriesToCloud } = require('../../utils/category.js')

const EMPTY_FORM = {
  tank_code: '',
  name: '',
  size: '',
  category: '无',
  species: '',
  male_count: '',
  female_count: '',
  notes: ''
}

Page({
  data: {
    statusBarHeight: 0,
    totalNavHeight: 120,
    loading: false,
    tanks: [],
    count: 0,
    totalMale: 0,
    totalFemale: 0,
    // 登录状态
    isLoggedIn: false,
    // 管理员 & 添加弹窗
    isAdmin: false,
    showAddModal: false,
    form: { ...EMPTY_FORM },
    submitting: false,
    // 分类筛选
    activeCategory: '全部',
    categories: ['全部'],
    // 分类管理
    showAddCategoryModal: false,
    newCategoryName: '',
    showEditCategoryModal: false,
    editCategoryOldName: '',
    editCategoryNewName: '',
    // 批量操作
    showBatchModal: false,
    batchType: 'water',
    batchTanks: [],
    batchWaterRatio: '1/3',
    batchFoodType: '',
    batchFoodTypeIndex: 0,
    batchFoodTypeCustom: '',
    batchAmount: '',
    batchAmountIndex: 0,
    batchAdditives: '',
    batchAdditivesIndex: 0,
    batchAdditivesCustom: '',
    batchNotes: '',
    batchSubmitting: false,
    batchSelectedCount: 0,
    waterRatios: ['1/3', '1/2', '全换'],
    foodTypeOptions: ['龟粮', '鱼', '虾', '其他'],
    amountOptions: ['少量', '适中', '较多', '饱喂'],
    additiveOptions: ['无', '钙粉', '维生素', '益生菌', '微量元素', '其他']
  },

  onLoad() {
    const sysInfo = wx.getSystemInfoSync()
    const statusBarHeight = Math.max(sysInfo.statusBarHeight || 20, 20)
    const safeAreaTop = sysInfo.safeArea ? (sysInfo.safeArea.top || statusBarHeight) : statusBarHeight
    const finalStatusBarHeight = Math.max(statusBarHeight, safeAreaTop)
    const rpxRatio = 750 / sysInfo.windowWidth
    const totalNavHeight = Math.round(finalStatusBarHeight * rpxRatio) + 88 + 20
    this.setData({
      statusBarHeight: finalStatusBarHeight,
      totalNavHeight
    })
    this._checkLoginAndLoad()
    this._checkAdmin()
  },

  onShow() {
    const app = getApp()
    const isLoggedIn = app.globalData.isLoggedIn || false
    this.setData({ isLoggedIn })

    if (app.globalData.dataPreloaded && !this._dataApplied) {
      this._applyPreloadedData()
    }
    this._dataApplied = true

    const updateTabBar = () => {
      if (typeof this.getTabBar === 'function' && this.getTabBar()) {
        const tabBar = this.getTabBar()
        tabBar.setData({ selected: 2, visible: true })
      }
    }
    updateTabBar()
    setTimeout(updateTabBar, 100)
  },

  // ====== 检查登录并加载数据 ======
  _checkLoginAndLoad() {
    const app = getApp()
    const isLoggedIn = app.globalData.isLoggedIn || false
    this.setData({ isLoggedIn })

    // 未登录时不调用 API，直接显示空状态
    if (!isLoggedIn) {
      this.setData({ tanks: [], count: 0, totalMale: 0, totalFemale: 0 })
      return
    }

    this._applyPreloadedData()
  },

  // ====== 管理员权限检查 ======
  async _checkAdmin() {
    try {
      const api = getAPI()
      const res = await api.checkAdmin()
      if (res.success && res.data && res.data.isAdmin) {
        this.setData({ isAdmin: true })
      }
    } catch (_) {}
  },

  // ====== 登录 ======
  goToLogin() {
    const app = getApp()
    if (app.requireLogin) {
      app.requireLogin()
    }
  },

  // ====== 数据预加载 ======
  _applyPreloadedData() {
    const app = getApp()
    const rawTanks = app.globalData.preloadedTanks
    const stats = app.globalData.preloadedTankStats

    if (rawTanks && rawTanks.length > 0) {
      const tanks = rawTanks.map(item => {
        const male = parseInt(item.male_count) || 0
        const female = parseInt(item.female_count) || 0
        return {
          ...item,
          displayCode: item.tank_code || ('T' + item.id),
          totalCount: male + female
        }
      })
      this.setData({
        tanks,
        count: stats ? stats.count : tanks.length,
        totalMale: stats ? stats.totalMale : 0,
        totalFemale: stats ? stats.totalFemale : 0,
        loading: false
      })
    } else {
      this.loadTanks()
    }
    this.loadCategories()
  },

  // ====== 加载龟缸列表 ======
  async loadTanks() {
    this.setData({ loading: true })
    try {
      const api = getAPI()
      const res = await api.request('GET', '/api/tanks')
      if (res.success && res.data) {
        const app = getApp()
        app.globalData.preloadedTanks = res.data

        const tanks = res.data.map(item => {
          const male = parseInt(item.male_count) || 0
          const female = parseInt(item.female_count) || 0
          return {
            ...item,
            displayCode: item.tank_code || ('T' + item.id),
            totalCount: male + female
          }
        })

        const statsRes = await api.request('GET', '/api/tanks/stats')
        if (statsRes.success && statsRes.data) {
          app.globalData.preloadedTankStats = statsRes.data
        }
        this.setData({
          tanks,
          count: statsRes.data ? statsRes.data.count : res.data.length,
          totalMale: statsRes.data ? statsRes.data.totalMale : 0,
          totalFemale: statsRes.data ? statsRes.data.totalFemale : 0,
          loading: false
        })
        return
      }
    } catch (err) {
      console.error('[Tank] loadTanks error:', err)
      wx.showToast({ title: '数据加载失败', icon: 'none', duration: 2000 })
    }
    this.setData({ loading: false })
  },

  // ====== 加载分类列表 ======
  async loadCategories() {
    try {
      const api = getAPI()
      const res = await api.getCategories()
      if (res.success && res.data) {
        const list = mergeCategories(res.data.categories)
        this.setData({ categories: ['全部', ...list] })
        await syncMissingCategoriesToCloud(api, list)
      }
    } catch (err) {
      console.error('[Tank] loadCategories error:', err)
    }
  },

  // ====== 分类筛选 ======
  setCategory(e) {
    const category = e.currentTarget.dataset.value
    this.setData({ activeCategory: category })
  },

  // ====== 添加龟缸弹窗 ======
  showAddTank() {
    const { isLoggedIn } = this.data
    if (!isLoggedIn) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      return
    }
    this.setData({ showAddModal: true, form: { ...EMPTY_FORM } })
  },

  hideAddTank() {
    this.setData({ showAddModal: false })
  },

  stopPropagation() {},

  onFormInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [`form.${field}`]: e.detail.value })
  },

  // ====== 表单内分类选择 ======
  selectCategory(e) {
    const category = e.currentTarget.dataset.category
    this.setData({ 'form.category': category })
  },

  // ====== 新增分类 ======
  addCategory() {
    this.setData({ showAddCategoryModal: true, newCategoryName: '' })
  },

  hideAddCategoryModal() {
    this.setData({ showAddCategoryModal: false })
  },

  onCategoryInput(e) {
    this.setData({ newCategoryName: e.detail.value })
  },

  async confirmAddCategory() {
    const name = this.data.newCategoryName.trim()
    if (!name) {
      wx.showToast({ title: '请输入分类名称', icon: 'none' })
      return
    }
    if (name === '无') {
      wx.showToast({ title: '分类名称不能为"无"', icon: 'none' })
      return
    }
    if (this.data.categories.includes(name)) {
      wx.showToast({ title: '分类已存在', icon: 'none' })
      return
    }
    try {
      const api = getAPI()
      const res = await api.addCategory(name)
      if (res.success && res.data && res.data.categories) {
        const categories = res.data.categories
        this.setData({
          categories: ['全部', ...categories],
          showAddCategoryModal: false,
          'form.category': name
        })
        wx.setStorageSync('categories', categories)
        getApp().globalData.preloadedCategories = categories
        wx.showToast({ title: '添加成功', icon: 'success' })
      } else {
        wx.showToast({ title: res?.message || '添加失败', icon: 'none' })
      }
    } catch (err) {
      console.error('添加分类失败:', err)
      wx.showToast({ title: '网络错误', icon: 'none' })
    }
  },

  // ====== 编辑分类（长按） ======
  editCategory(e) {
    const category = e.currentTarget.dataset.category
    if (category === '无') {
      wx.showToast({ title: '不能修改默认分类', icon: 'none' })
      return
    }
    this.setData({
      showEditCategoryModal: true,
      editCategoryOldName: category,
      editCategoryNewName: category
    })
  },

  hideEditCategoryModal() {
    this.setData({ showEditCategoryModal: false })
  },

  onEditCategoryInput(e) {
    this.setData({ editCategoryNewName: e.detail.value })
  },

  async confirmEditCategory() {
    const oldName = this.data.editCategoryOldName
    const newName = this.data.editCategoryNewName.trim()

    if (!newName) {
      wx.showToast({ title: '请输入分类名称', icon: 'none' })
      return
    }
    if (newName === '无') {
      wx.showToast({ title: '分类名称不能为"无"', icon: 'none' })
      return
    }
    if (oldName === newName) {
      this.setData({ showEditCategoryModal: false })
      return
    }
    if (this.data.categories.includes(newName)) {
      wx.showToast({ title: '分类已存在', icon: 'none' })
      return
    }

    // 先更新本地 UI
    const categories = this.data.categories.map(c => c === oldName ? newName : c)
    let newFormCategory = this.data.form.category
    if (newFormCategory === oldName) {
      newFormCategory = newName
    }
    let newActiveCategory = this.data.activeCategory
    if (newActiveCategory === oldName) {
      newActiveCategory = '全部'
    }

    this.setData({
      categories,
      'form.category': newFormCategory,
      activeCategory: newActiveCategory,
      showEditCategoryModal: false
    })

    // 同步到数据库
    try {
      const api = getAPI()
      const res = await api.updateCategory(oldName, newName)
      if (res.success && res.data && res.data.categories) {
        const serverCategories = res.data.categories
        this.setData({ categories: ['全部', ...serverCategories] })
        wx.setStorageSync('categories', serverCategories)
        getApp().globalData.preloadedCategories = serverCategories
        wx.showToast({ title: '修改成功', icon: 'success' })
      } else {
        wx.showToast({ title: res?.message || '修改同步失败', icon: 'none' })
      }
    } catch (err) {
      console.error('修改分类失败:', err)
      wx.showToast({ title: '网络错误', icon: 'none' })
    }
  },

  async deleteCategory() {
    const category = this.data.editCategoryOldName
    if (category === '无') {
      wx.showToast({ title: '不能删除默认分类', icon: 'none' })
      return
    }

    wx.showModal({
      title: '确认删除',
      content: `确定要删除分类"${category}"吗？`,
      confirmColor: '#d32f2f',
      success: async (modalRes) => {
        if (!modalRes.confirm) return

        // 先更新本地 UI
        const categories = this.data.categories.filter(c => c !== category)
        let newFormCategory = this.data.form.category
        if (newFormCategory === category) {
          newFormCategory = '无'
        }
        let newActiveCategory = this.data.activeCategory
        if (newActiveCategory === category) {
          newActiveCategory = '全部'
        }

        this.setData({
          categories,
          'form.category': newFormCategory,
          activeCategory: newActiveCategory,
          showEditCategoryModal: false
        })
        wx.setStorageSync('categories', categories.filter(c => c !== '全部'))
        wx.showToast({ title: '删除成功', icon: 'success' })

        // 同步到数据库
        try {
          const api = getAPI()
          const res = await api.deleteCategory(category)
          if (res.success && res.data && res.data.categories) {
            const serverCategories = res.data.categories
            this.setData({ categories: ['全部', ...serverCategories] })
            wx.setStorageSync('categories', serverCategories)
            getApp().globalData.preloadedCategories = serverCategories
          }
        } catch (err) {
          console.error('删除分类同步失败:', err)
        }
      }
    })
  },

  // ====== 提交创建 ======
  async confirmAddTank() {
    const { form } = this.data
    if (!form.name.trim()) {
      wx.showToast({ title: '请输入龟缸名称', icon: 'none' })
      return
    }
    this.setData({ submitting: true })
    try {
      const api = getAPI()
      const res = await api.request('POST', '/api/tanks', {
        tank_code: form.tank_code.trim(),
        name: form.name.trim(),
        size: form.size.trim(),
        category: form.category || '无',
        species: form.species.trim(),
        male_count: parseInt(form.male_count) || 0,
        female_count: parseInt(form.female_count) || 0,
        notes: form.notes.trim()
      })
      if (res.success) {
        wx.showToast({ title: '龟缸已添加', icon: 'success' })
        this.setData({ showAddModal: false, form: { ...EMPTY_FORM } })
        const app = getApp()
        app.globalData.preloadedTanks = null
        app.globalData.preloadedTankStats = null
        this._dataApplied = false
        this.loadTanks()
      } else {
        wx.showToast({ title: res.message || '添加失败', icon: 'none' })
      }
    } catch (_) {
      wx.showToast({ title: '网络错误', icon: 'none' })
    }
    this.setData({ submitting: false })
  },

  // ====== 导航 ======
  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/subpkg-tanks/pages/tanks/detail?id=${id}` })
  },

  goDashboard() {
    wx.navigateTo({ url: '/subpkg-tanks/pages/tanks/dashboard' })
  },

  // ====== 生成并预览龟缸二维码 ======
  async onTankQR(e) {
    e.stopPropagation && e.stopPropagation()
    const { id, name } = e.currentTarget.dataset
    if (!id) return

    wx.showLoading({ title: '生成中...', mask: true })
    try {
      const api = getAPI()
      const baseUrl = api.getBaseUrl ? api.getBaseUrl() : ''
      const res = await api.request('POST', '/api/qrcode/generate', {
        scene: `tankId=${id}`,
        page: 'subpkg-tanks/pages/tanks/detail'
      })

      if (!res.success || !res.data) {
        throw new Error(res.message || '二维码生成失败')
      }

      const qrPath = typeof res.data === 'string' ? res.data : res.data.data
      if (!qrPath || typeof qrPath !== 'string') {
        throw new Error('二维码路径无效')
      }

      const qrUrl = qrPath.startsWith('http') ? qrPath : baseUrl + '/' + qrPath.replace(/^\/+/, '')
      const downloadRes = await wx.downloadFile({ url: qrUrl })
      if (downloadRes.statusCode !== 200) {
        throw new Error('二维码下载失败')
      }

      wx.previewImage({
        urls: [downloadRes.tempFilePath],
        current: downloadRes.tempFilePath
      })
    } catch (err) {
      console.error('[Tank] 生成二维码失败:', err)
      wx.showToast({ title: err.message || '生成失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  onPullDownRefresh() {
    const app = getApp()
    const isLoggedIn = app.globalData.isLoggedIn || false
    if (!isLoggedIn) {
      wx.stopPullDownRefresh()
      return
    }
    this.loadTanks().then(() => wx.stopPullDownRefresh())
    this.loadCategories()
  },

  // ====== 批量快捷操作 ======
  openBatchModal(e) {
    const type = e.currentTarget.dataset.type
    const batchTanks = this.data.tanks.map(t => ({
      id: t.id,
      name: t.name,
      species: t.species,
      male_count: t.male_count,
      female_count: t.female_count,
      checked: true
    }))
    this.setData({
      showBatchModal: true,
      batchType: type,
      batchTanks,
      batchSelectedCount: batchTanks.length,
      batchWaterRatio: '1/3',
      batchFoodType: '',
      batchFoodTypeIndex: 0,
      batchFoodTypeCustom: '',
      batchAmount: '',
      batchAmountIndex: 0,
      batchAdditives: '',
      batchAdditivesIndex: 0,
      batchAdditivesCustom: '',
      batchNotes: '',
      batchSubmitting: false
    })
  },

  closeBatchModal() {
    this.setData({ showBatchModal: false })
  },

  toggleBatchTank(e) {
    const id = Number(e.currentTarget.dataset.id)
    const batchTanks = this.data.batchTanks.map(t => 
      t.id === id ? { ...t, checked: !t.checked } : t
    )
    this.setData({
      batchTanks,
      batchSelectedCount: batchTanks.filter(t => t.checked).length
    })
  },

  toggleAllBatch() {
    const batchTanks = this.data.batchTanks.map(t => ({ ...t, checked: !t.checked }))
    this.setData({
      batchTanks,
      batchSelectedCount: batchTanks.filter(t => t.checked).length
    })
  },

  setBatchWaterRatio(e) {
    this.setData({ batchWaterRatio: e.currentTarget.dataset.value })
  },

  onBatchFoodTypePick(e) {
    const idx = e.detail.value
    this.setData({
      batchFoodTypeIndex: idx,
      batchFoodType: this.data.foodTypeOptions[idx]
    })
  },

  onBatchFoodTypeCustomInput(e) {
    this.setData({ batchFoodTypeCustom: e.detail.value })
  },

  onBatchAmountPick(e) {
    const idx = e.detail.value
    this.setData({
      batchAmountIndex: idx,
      batchAmount: this.data.amountOptions[idx]
    })
  },

  onBatchAdditivesPick(e) {
    const idx = e.detail.value
    this.setData({
      batchAdditivesIndex: idx,
      batchAdditives: this.data.additiveOptions[idx]
    })
  },

  onBatchAdditivesCustomInput(e) {
    this.setData({ batchAdditivesCustom: e.detail.value })
  },

  onBatchNotesInput(e) {
    this.setData({ batchNotes: e.detail.value })
  },

  async submitBatchCheck() {
    const { batchType, batchTanks, batchWaterRatio, batchFoodType, batchFoodTypeCustom, batchAmount, batchAdditives, batchAdditivesCustom, batchNotes } = this.data
    const selected = batchTanks.filter(t => t.checked)
    if (selected.length === 0) {
      wx.showToast({ title: '请选择龟缸', icon: 'none' })
      return
    }
    if (batchType === 'feeding') {
      if (!batchFoodType) {
        wx.showToast({ title: '请选择食物类型', icon: 'none' })
        return
      }
      if (batchFoodType === '其他' && !batchFoodTypeCustom.trim()) {
        wx.showToast({ title: '请输入食物名称', icon: 'none' })
        return
      }
    }

    this.setData({ batchSubmitting: true })
    const api = getAPI()
    let successCount = 0
    let failCount = 0

    // 计算最终食物类型和营养剂
    const finalFoodType = batchFoodType === '其他' ? batchFoodTypeCustom.trim() : (batchFoodType || '')
    const finalAdditives = batchAdditives === '其他' ? batchAdditivesCustom.trim() : (batchAdditives || '')

    for (const tank of selected) {
      try {
        const body = { type: batchType }
        if (batchType === 'water') {
          body.water_change = batchWaterRatio
          body.notes = batchNotes || ''
        } else {
          body.food_type = finalFoodType
          body.amount_g = batchAmount || ''
          body.additives = finalAdditives
          body.notes = batchNotes || ''
        }
        const res = await api.request('POST', `/api/tanks/${tank.id}/check`, body)
        if (res.success) successCount++
        else failCount++
      } catch (_) {
        failCount++
      }
    }

    this.setData({ batchSubmitting: false })
    if (failCount === 0) {
      wx.showToast({ title: `${successCount}个龟缸已完成`, icon: 'success' })
    } else {
      wx.showToast({ title: `成功${successCount}个，失败${failCount}个`, icon: 'none' })
    }
    this.setData({ showBatchModal: false })
    this.loadTanks()
  }
})
