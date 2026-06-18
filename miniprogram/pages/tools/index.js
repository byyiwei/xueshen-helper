Page({
  data: {
    statusBarHeight: 0,
    totalNavHeight: 120,
    isLoggedIn: false
  },

  onLoad() {
    const sysInfo = wx.getSystemInfoSync()
    const statusBarHeight = Math.max(sysInfo.statusBarHeight || 20, 20)
    const safeAreaTop = sysInfo.safeArea ? (sysInfo.safeArea.top || statusBarHeight) : statusBarHeight
    const finalStatusBarHeight = Math.max(statusBarHeight, safeAreaTop)
    const rpxRatio = 750 / sysInfo.windowWidth
    const totalNavHeight = Math.round(finalStatusBarHeight * rpxRatio) + 88 + 24
    this.setData({ statusBarHeight: finalStatusBarHeight, totalNavHeight })
  },

  onShow() {
    const app = getApp()
    this.setData({ isLoggedIn: app.globalData.isLoggedIn })
    
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      const tabBar = this.getTabBar()
      tabBar.setData({ selected: 3, visible: true })
    }
  },

  goToLogin: function () {
    const app = getApp()
    app.requireLogin()
  },

  goToCalculator() {
    wx.navigateTo({
      url: '/pages/tools/calculator'
    })
  }
})