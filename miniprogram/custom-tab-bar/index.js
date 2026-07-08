Component({
  data: {
    selected: -1,
    visible: true,
    color: '#999999',
    selectedColor: '#1A1A1A',
    list: [
      { pagePath: '/pages/index/index', text: '首页' },
      { pagePath: '/pages/pet/index', text: '宠物' },
      { pagePath: '/pages/tanks/index', text: '龟缸' },
      { pagePath: '/pages/my/index', text: '我的' }
    ]
  },

  // 选中态由各 Tab 页面 onShow 显式设置，组件不再自动匹配路由
  // 避免组件 pageLifetimes.show 与页面 onShow 双控制源冲突
  _pendingTabIndex: -1,
  _pendingTimer: null,

  attached() {
    // 仅首次附加时尝试匹配一次（页面 onShow 尚未运行时的兜底）
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
    // 不在此处调用 getTabBarInfo，选中态由各页面 onShow 全权负责
    show() {}
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
        // 如果用户刚点击了某个 tab，短期内不允许 pageLifetimes.show 覆盖
        if (this._pendingTabIndex === index) {
          return
        }
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
          // 锁定当前选中的 tab，300ms 内禁止 pageLifetimes.show 覆盖
          this._pendingTabIndex = index
          if (this._pendingTimer) clearTimeout(this._pendingTimer)
          this._pendingTimer = setTimeout(() => {
            this._pendingTabIndex = -1
            this._pendingTimer = null
          }, 300)
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
