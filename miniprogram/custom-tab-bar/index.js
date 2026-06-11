Component({
  data: {
    selected: 0,
    visible: true,
    color: '#94A3B8',
    selectedColor: '#3A7CFF',
    list: [
      { pagePath: '/pages/pet/index', text: '宠物' },
      { pagePath: '/pages/footprint/index', text: '足迹' },
      { pagePath: '/pages/my/index', text: '我的' }
    ]
  },

  attached() {
    wx.nextTick(() => {
      try {
        this.getTabBarInfo()
      } catch (error) {
        console.error('tabBar init error:', error)
      }
    })
  },

  // 关键修复：每次页面显示时重新检查 tabBar 可见性
  pageLifetimes: {
    show() {
      this.getTabBarInfo()
    }
  },

  methods: {
    getTabBarInfo() {
      const pages = getCurrentPages()
      if (!pages || pages.length === 0) return
      const currentPage = pages[pages.length - 1]
      if (!currentPage || !currentPage.route) return
      const route = '/' + currentPage.route
      const index = this.data.list.findIndex(item => 
        item.pagePath === route || 
        item.pagePath === currentPage.route ||
        route.includes(item.pagePath.replace('/', ''))
      )
      if (index !== -1) {
        // 当前页面是 tabBar 页面，显示并更新选中
        this.setData({ selected: index, visible: true })
      } else {
        // 当前页面不在tabBar列表中，隐藏tab-bar
        this.setData({ visible: false })
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
