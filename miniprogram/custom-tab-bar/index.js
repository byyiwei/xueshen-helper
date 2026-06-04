const ThemeManager = require('../utils/theme')

Component({
  data: {
    selected: 0,
    color: '#999999',
    selectedColor: '#B8860B',
    list: [
      { pagePath: '/pages/pet/index', text: '宠物' },
      { pagePath: '/pages/footprint/index', text: '足迹' },
      { pagePath: '/pages/my/index', text: '我的' }
    ]
  },

  attached() {
    this.applyThemeColor()
    try {
      this.getTabBarInfo()
    } catch (error) {
      console.error('tabBar init error:', error)
    }
  },

  pageLifetimes: {
    show() {
      this.applyThemeColor()
      this.getTabBarInfo()
    }
  },

  methods: {
    applyThemeColor() {
      try {
        const currentTheme = ThemeManager.getCurrentTheme()
        const themeConfig = ThemeManager.getThemeConfig(currentTheme)
        const selectedColor = themeConfig.primary
        const color = this.hexToRgba(selectedColor, 0.45)
        this.setData({ selectedColor, color })
      } catch (error) {
        console.error('tabBar theme error:', error)
      }
    },

    // 将 hex 颜色转换为 rgba
    hexToRgba(hex, alpha) {
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      return `rgba(${r}, ${g}, ${b}, ${alpha})`
    },

    getTabBarInfo() {
      const pages = getCurrentPages()
      if (!pages || pages.length === 0) return
      const currentPage = pages[pages.length - 1]
      if (!currentPage || !currentPage.route) return
      const route = '/' + currentPage.route
      const index = this.data.list.findIndex(item => item.pagePath === route)
      if (index !== -1) {
        this.setData({ selected: index })
      } else {
        console.log('当前页面不在tabBar列表中:', route)
      }
    },

    switchTab(e) {
      try {
        const data = e.currentTarget.dataset
        const url = data.path
        const index = this.data.list.findIndex(item => item.pagePath === url)
        if (index !== -1) {
          this.setData({ selected: index })
        }
        const pages = getCurrentPages()
        const currentPage = pages && pages.length > 0 ? pages[pages.length - 1] : null
        const currentRoute = currentPage && currentPage.route ? '/' + currentPage.route : ''
        if (url !== currentRoute) {
          wx.switchTab({ url })
        }
      } catch (error) {
        console.error('switchTab error:', error)
      }
    }
  }
})
