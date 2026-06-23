Page({
  data: {
    currentDate: '',
    loading: true,
    stats: {
      totalUsers: 0,
      totalPets: 0,
      totalFootprints: 0,
      todayActive: 0,
      userGrowth: 0,
      petGrowth: 0
    },
    userChartData: [],
    petDistribution: [],
    recentActivities: []
  },

  onLoad: function () {
    this.setCurrentDate()
    this.loadAllData()
  },

  onShow: function () {
    // 每次进入页面都刷新数据
    this.loadAllData()
  },

  setCurrentDate: function () {
    const now = new Date()
    const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`
    this.setData({ currentDate: dateStr })
  },

  // 加载所有数据
  loadAllData: async function () {
    this.setData({ loading: true })
    try {
      const [statsRes, growthRes, distRes, activitiesRes] = await Promise.all([
        this.callAdminAPI('getStats'),
        this.callAdminAPI('getUserGrowth', { days: 7 }),
        this.callAdminAPI('getPetDistribution'),
        this.callAdminAPI('getRecentActivities')
      ])

      const updateData = {}
      
      if (statsRes.success) {
        updateData.stats = {
          totalUsers: statsRes.data.totalUsers,
          totalPets: statsRes.data.totalPets,
          totalFootprints: statsRes.data.totalFootprints,
          todayActive: statsRes.data.todayActive,
          userGrowth: statsRes.data.userGrowth,
          petGrowth: statsRes.data.petGrowth
        }
      }
      
      if (growthRes.success) {
        updateData.userChartData = growthRes.data
      }
      
      if (distRes.success) {
        updateData.petDistribution = distRes.data
      }
      
      if (activitiesRes.success) {
        updateData.recentActivities = activitiesRes.data.map(a => ({
          ...a,
          avatar: '📷',
          type: 'info',
          typeText: '足迹'
        }))
      }
      
      this.setData(updateData)
    } catch (error) {
      console.error('加载数据失败:', error)
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 加载统计数据
  loadStats: function () {
    this.loadAllData()
  },

  // 调用管理员云函数
  callAdminAPI: async function (action, data = {}) {
    return await wx.cloud.callFunction({
      name: 'admin',
      data: { action, data }
    }).then(res => res.result)
  },

  goToConfig: function () {
    wx.navigateTo({ url: '/pages/admin/config' })
  },

  // 返回前端（我的页面）
  onBackToFront: function () {
    wx.navigateBack({
      delta: 1,
      fail: function () {
        wx.switchTab({ url: '/pages/my/index' })
      }
    })
  },

  goToPets: function () {
    wx.navigateTo({ url: '/pages/admin/pets' })
  },

  goToFootprints: function () {
    wx.navigateTo({ url: '/pages/admin/footprints' })
  },

  goToUsers: function () {
    wx.navigateTo({ url: '/pages/admin/users' })
  }
})
