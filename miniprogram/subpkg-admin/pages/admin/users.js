Page({
  data: {
    searchText: '',
    filterStatus: '',
    loading: true,
    userList: [],
    sortField: 'createdAt',
    sortOrder: 'desc'
  },

  onLoad: function () {
    this.loadUsers()
  },

  onShow: function () {
    this.loadUsers()
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

  // 加载用户列表
  loadUsers: async function () {
    this.setData({ loading: true })
    try {
      const res = await wx.cloud.callFunction({
        name: 'admin',
        data: {
          action: 'getUsers',
          searchText: this.data.searchText,
          filterStatus: this.data.filterStatus,
          sortField: this.data.sortField,
          sortOrder: this.data.sortOrder
        }
      })
      
      if (res.result.success) {
        this.setData({ 
          userList: res.result.data.list,
          loading: false 
        })
      } else {
        this.setData({ loading: false })
        wx.showToast({ title: res.result.message || '加载失败', icon: 'none' })
      }
    } catch (error) {
      console.error('加载用户列表失败:', error)
      this.setData({ loading: false })
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  onSearchInput: function (e) {
    this.setData({ searchText: e.detail.value })
    // 防抖
    if (this._searchTimer) clearTimeout(this._searchTimer)
    this._searchTimer = setTimeout(() => {
      this.loadUsers()
    }, 300)
  },

  setFilterStatus: function (e) {
    const status = e.currentTarget.dataset.status || ''
    this.setData({ filterStatus: status })
    this.loadUsers()
  },

  // 设置排序
  setSort: function (e) {
    const field = e.currentTarget.dataset.field
    const currentField = this.data.sortField
    const currentOrder = this.data.sortOrder
    
    let newOrder = 'desc'
    if (currentField === field) {
      newOrder = currentOrder === 'desc' ? 'asc' : 'desc'
    }
    
    this.setData({
      sortField: field,
      sortOrder: newOrder
    })
    this.loadUsers()
  },

  // 复制openid
  onCopyOpenid: function (e) {
    const openid = e.currentTarget.dataset.openid
    if (!openid) return
    
    wx.setClipboardData({
      data: openid,
      success: () => {
        wx.showToast({ title: '已复制', icon: 'success' })
      },
      fail: () => {
        wx.showToast({ title: '复制失败', icon: 'none' })
      }
    })
  },

  // 头像加载失败处理
  onAvatarError: function (e) {
    console.log('头像加载失败:', e.detail.errMsg)
  },

  // 编辑用户
  onEditUser: function (e) {
    const id = e.currentTarget.dataset.id
    const user = this.data.userList.find(u => u.id === id)
    
    wx.showModal({
      title: '编辑用户',
      editable: true,
      placeholderText: '输入新用户名',
      success: (res) => {
        if (res.confirm && res.content) {
          this.updateUserName(id, res.content)
        }
      }
    })
  },

  // 更新用户名
  updateUserName: function (userId, newName) {
    wx.showLoading({ title: '保存中...' })
    
    wx.cloud.callFunction({
      name: 'admin',
      data: {
        action: 'updateUser',
        userId: userId,
        nickname: newName
      }
    }).then(res => {
      wx.hideLoading()
      if (res.result.success) {
        wx.showToast({ title: '修改成功', icon: 'success' })
        this.loadUsers()
      } else {
        wx.showToast({ title: res.result.message || '修改失败', icon: 'none' })
      }
    }).catch(err => {
      wx.hideLoading()
      console.error('更新用户失败:', err)
      wx.showToast({ title: '更新失败', icon: 'none' })
    })
  },

  // 封禁用户
  onBanUser: function (e) {
    const id = e.currentTarget.dataset.id
    const openid = e.currentTarget.dataset.openid
    
    wx.showModal({
      title: '封禁用户',
      content: '确定要封禁该用户吗？封禁后用户将无法登录。',
      success: (res) => {
        if (res.confirm) {
          this.setUserStatus(id, openid, '封禁')
        }
      }
    })
  },

  // 解封用户
  onUnbanUser: function (e) {
    const id = e.currentTarget.dataset.id
    const openid = e.currentTarget.dataset.openid
    
    wx.showModal({
      title: '解封用户',
      content: '确定要解封该用户吗？',
      success: (res) => {
        if (res.confirm) {
          this.setUserStatus(id, openid, '正常')
        }
      }
    })
  },

  // 设置用户状态
  setUserStatus: function (userId, openid, status) {
    wx.showLoading({ title: '处理中...' })
    
    wx.cloud.callFunction({
      name: 'admin',
      data: {
        action: 'updateUser',
        userId: userId,
        openid: openid,
        status: status
      }
    }).then(res => {
      wx.hideLoading()
      if (res.result.success) {
        wx.showToast({ title: status === '封禁' ? '已封禁' : '已解封', icon: 'success' })
        this.loadUsers()
      } else {
        wx.showToast({ title: res.result.message || '操作失败', icon: 'none' })
      }
    }).catch(err => {
      wx.hideLoading()
      console.error('设置用户状态失败:', err)
      wx.showToast({ title: '操作失败', icon: 'none' })
    })
  },

  // 删除用户
  onDeleteUser: function (e) {
    const id = e.currentTarget.dataset.id
    const openid = e.currentTarget.dataset.openid
    
    wx.showModal({
      title: '删除用户',
      content: '⚠️ 危险操作！删除后将清除该用户的所有数据（包括宠物、足迹、记录等），此操作不可恢复！',
      confirmColor: '#ef4444',
      success: (res) => {
        if (res.confirm) {
          wx.showModal({
            title: '再次确认',
            content: '确定要删除该用户及其所有数据吗？',
            confirmColor: '#ef4444',
            success: (res2) => {
              if (res2.confirm) {
                this.deleteUser(id, openid)
              }
            }
          })
        }
      }
    })
  },

  // 删除用户（含所有数据）
  deleteUser: function (userId, openid) {
    wx.showLoading({ title: '删除中...' })
    
    wx.cloud.callFunction({
      name: 'admin',
      data: {
        action: 'deleteUser',
        userId: userId,
        openid: openid
      }
    }).then(res => {
      wx.hideLoading()
      if (res.result.success) {
        wx.showToast({ title: '删除成功', icon: 'success' })
        this.loadUsers()
      } else {
        wx.showToast({ title: res.result.message || '删除失败', icon: 'none' })
      }
    }).catch(err => {
      wx.hideLoading()
      console.error('删除用户失败:', err)
      wx.showToast({ title: '删除失败', icon: 'none' })
    })
  },

  // 导航到仪表盘
  goToDashboard: function () {
    wx.redirectTo({ url: '/pages/admin/index' })
  },

  // 导航到配置
  goToConfig: function () {
    wx.redirectTo({ url: '/pages/admin/config' })
  },

  // 导航到宠物管理
  goToPets: function () {
    wx.redirectTo({ url: '/pages/admin/pets' })
  },

  // 导航到足迹管理
  goToFootprints: function () {
    wx.redirectTo({ url: '/pages/admin/footprints' })
  }
})
