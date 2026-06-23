Page({
  data: {
    recycleBin: [],
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
      this.loadRecycleBin()
    }
  },

  onShow: function () {
    if (this.data.isLoggedIn) {
      this.loadRecycleBin()
    }
  },

  // 加载回收站数据
  loadRecycleBin: function () {
    try {
      const recycleBin = wx.getStorageSync('recycleBin') || []
      this.setData({ recycleBin })
    } catch (e) {
      console.error('加载回收站数据失败:', e)
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  // 恢复宠物
  restorePet: function (e) {
    const index = e.currentTarget.dataset.index
    const pet = this.data.recycleBin[index]
    
    if (!pet) return

    wx.showModal({
      title: '恢复宠物',
      content: `确定要恢复"${pet.name || '未命名'}"吗？`,
      success: (res) => {
        if (res.confirm) {
          try {
            // 从回收站移除
            const recycleBin = this.data.recycleBin
            recycleBin.splice(index, 1)
            
            // 恢复到宠物列表
            let pets = wx.getStorageSync('pets') || []
            pets.push(pet)
            
            // 保存数据
            wx.setStorageSync('recycleBin', recycleBin)
            wx.setStorageSync('pets', pets)
            
            this.setData({ recycleBin })
            wx.showToast({ title: '恢复成功', icon: 'success' })
          } catch (err) {
            console.error('恢复宠物失败:', err)
            wx.showToast({ title: '恢复失败', icon: 'none' })
          }
        }
      }
    })
  },

  // 永久删除宠物
  permanentDelete: function (e) {
    const index = e.currentTarget.dataset.index
    const pet = this.data.recycleBin[index]
    
    if (!pet) return

    wx.showModal({
      title: '永久删除',
      content: `确定要永久删除"${pet.name || '未命名'}"吗？此操作不可恢复！`,
      confirmColor: '#E53935',
      success: (res) => {
        if (res.confirm) {
          try {
            const recycleBin = this.data.recycleBin
            recycleBin.splice(index, 1)
            wx.setStorageSync('recycleBin', recycleBin)
            this.setData({ recycleBin })
            wx.showToast({ title: '已删除', icon: 'success' })
          } catch (err) {
            console.error('删除宠物失败:', err)
            wx.showToast({ title: '删除失败', icon: 'none' })
          }
        }
      }
    })
  },

  // 清空回收站
  clearRecycleBin: function () {
    if (this.data.recycleBin.length === 0) {
      wx.showToast({ title: '回收站已是空的', icon: 'none' })
      return
    }

    wx.showModal({
      title: '清空回收站',
      content: '确定要清空回收站吗？所有数据将永久删除！',
      confirmColor: '#E53935',
      success: (res) => {
        if (res.confirm) {
          try {
            wx.setStorageSync('recycleBin', [])
            this.setData({ recycleBin: [] })
            wx.showToast({ title: '回收站已清空', icon: 'success' })
          } catch (err) {
            console.error('清空回收站失败:', err)
            wx.showToast({ title: '清空失败', icon: 'none' })
          }
        }
      }
    })
  },

  // 查看宠物详情
  viewPetDetail: function (e) {
    const pet = e.currentTarget.dataset.pet
    if (pet && pet._id) {
      wx.navigateTo({
        url: `/pages/pet/detail?petId=${pet._id}&fromRecycleBin=true`
      })
    }
  },

  // 返回上一页
  goBack: function () {
    wx.navigateBack({ delta: 1 })
  }
})
