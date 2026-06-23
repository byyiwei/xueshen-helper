Component({
  data: {
    selected: -1,
    visible: true,
    color: '#999999',
    selectedColor: '#1A1A1A',
    list: [
      { pagePath: '/pages/index/index', text: '首页' },
      { pagePath: '/pages/pet/index', text: '宠物' },
      { pagePath: '/pages/my/index', text: '我的' }
    ]
  },

  attached() {
    this.getTabBarInfo()
    setTimeout(() => {
      try {
        this.getTabBarInfo()
      } catch (error) {
        console.error('tabBar init error:', error)
      }
    }, 80)
  },

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
        this.setData({ selected: index, visible: true })
      } else {
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
