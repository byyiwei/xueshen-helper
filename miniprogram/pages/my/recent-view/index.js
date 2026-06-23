Page({
  data: {
    recentViews: [],
    isLoggedIn: false,
    statusBarHeight: 0,
    totalNavHeight: 88
  },

  onLoad: function () {
    const app = getApp()
    const isLoggedIn = app.globalData.isLoggedIn
    const sysInfo = wx.getSystemInfoSync()
    const statusBarHeight = sysInfo.statusBarHeight || 20
    const navContentHeight = 44
    const totalNavHeight = statusBarHeight + navContentHeight
    this.setData({ 
      isLoggedIn,
      statusBarHeight,
      totalNavHeight
    })
    if (isLoggedIn) {
      this.loadRecentViews()
    }
  },

  onShow: function () {
    if (this.data.isLoggedIn) {
      this.loadRecentViews()
    }
  },

  // 加载最近浏览数据
  loadRecentViews: function () {
    try {
      let recentViews = wx.getStorageSync('recentViews') || []
      // 只保留最近20条记录
      recentViews = recentViews.slice(0, 20)
      this.setData({ recentViews })
    } catch (e) {
      console.error('加载最近浏览数据失败:', e)
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  // 查看宠物详情
  viewPetDetail: function (e) {
    const pet = e.currentTarget.dataset.pet
    if (pet && pet._id) {
      // 如果是公开档案，跳转到公开档案页面
      if (pet.isPublic) {
        wx.navigateTo({
          url: `/subpkg-report/pages/public/index?userId=${pet.userId}&petId=${pet._id}`
        })
      } else {
        wx.navigateTo({
          url: `/pages/pet/detail?petId=${pet._id}`
        })
      }
    }
  },

  // 清空最近浏览
  clearRecentViews: function () {
    if (this.data.recentViews.length === 0) {
      wx.showToast({ title: '最近浏览已是空的', icon: 'none' })
      return
    }

    wx.showModal({
      title: '清空最近浏览',
      content: '确定要清空最近浏览记录吗？',
      success: (res) => {
        if (res.confirm) {
          try {
            wx.setStorageSync('recentViews', [])
            this.setData({ recentViews: [] })
            wx.showToast({ title: '已清空', icon: 'success' })
          } catch (err) {
            console.error('清空最近浏览失败:', err)
            wx.showToast({ title: '清空失败', icon: 'none' })
          }
        }
      }
    })
  },

  // 返回上一页
  goBack: function () {
    wx.navigateBack({ delta: 1 })
  }
})
