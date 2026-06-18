Page({
  data: {
    searchText: '',
    filterCategory: '',
    loading: true,
    petList: []
  },

  onLoad: function () {
    this.loadPets()
  },

  onShow: function () {
    this.loadPets()
  },

  // 返回前端
  onBackToFront: function () {
    wx.navigateBack({
      delta: 1,
      fail: function () {
        wx.switchTab({ url: '/pages/my/index' })
      }
    })
  },

  // 加载宠物列表
  loadPets: async function () {
    this.setData({ loading: true })
    try {
      const res = await wx.cloud.callFunction({
        name: 'admin',
        data: {
          action: 'getPets',
          searchText: this.data.searchText,
          filterCategory: this.data.filterCategory
        }
      })
      
      if (res.result.success) {
        this.setData({ 
          petList: res.result.data.list,
          loading: false 
        })
      } else {
        this.setData({ loading: false })
        wx.showToast({ title: res.result.message || '加载失败', icon: 'none' })
      }
    } catch (error) {
      console.error('加载宠物列表失败:', error)
      this.setData({ loading: false })
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  onSearchInput: function (e) {
    this.setData({ searchText: e.detail.value })
    // 防抖：300ms后搜索
    if (this._searchTimer) clearTimeout(this._searchTimer)
    this._searchTimer = setTimeout(() => {
      this.loadPets()
    }, 300)
  },

  setFilterCategory: function (e) {
    const category = e.currentTarget.dataset.category || ''
    this.setData({ filterCategory: category })
    this.loadPets()
  },

  onPetDetail: function (e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/pet/detail?id=' + id })
  },

  // 导航到仪表盘
  goToDashboard: function () {
    wx.redirectTo({ url: '/pages/admin/index' })
  },

  // 导航到配置
  goToConfig: function () {
    wx.redirectTo({ url: '/pages/admin/config' })
  },

  // 导航到足迹管理
  goToFootprints: function () {
    wx.redirectTo({ url: '/pages/admin/footprints' })
  },

  // 导航到用户管理
  goToUsers: function () {
    wx.redirectTo({ url: '/pages/admin/users' })
  }
})
