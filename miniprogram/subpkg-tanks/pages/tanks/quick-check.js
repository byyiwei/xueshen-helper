const { getAPI } = require('../../../utils/api.js')

Page({
  data: {
    statusBarHeight: 0,
    tankId: '',
    checkType: 'water',
    today: new Date().toISOString().slice(0, 10),
    tankName: '',
    submitting: false,
    // 换水
    waterChange: '1/3',
    waterOptions: ['1/3', '1/2', '全换'],
    // 喂食
    foodType: '',
    amountG: ''
  },

  onLoad(options) {
    const sysInfo = wx.getSystemInfoSync()
    this.setData({
      statusBarHeight: sysInfo.statusBarHeight || 20,
      tankId: options.id || '',
      checkType: options.type || 'water'
    })
    if (options.name) {
      this.setData({ tankName: decodeURIComponent(options.name) })
    }
  },

  onWaterSelect(e) {
    this.setData({ waterChange: e.currentTarget.dataset.value })
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [field]: e.detail.value })
  },

  async submit() {
    if (this.data.submitting) return
    this.setData({ submitting: true })

    try {
      const api = getAPI()
      const body = {
        type: this.data.checkType,
        record_date: new Date().toISOString().slice(0, 10)
      }

      if (this.data.checkType === 'water') {
        body.water_change = this.data.waterChange
      } else {
        body.food_type = this.data.foodType || '龟粮'
        body.amount_g = this.data.amountG ? parseFloat(this.data.amountG) : null
      }

      const res = await api.request({
        url: `/api/tanks/${this.data.tankId}/check`,
        method: 'POST',
        data: body
      })

      if (res.success) {
        wx.showToast({ title: '打卡成功', icon: 'success' })
        setTimeout(() => wx.navigateBack(), 1200)
      } else {
        wx.showToast({ title: res.message || '打卡失败', icon: 'none' })
      }
    } catch (_) {
      wx.showToast({ title: '打卡失败', icon: 'none' })
    }
    this.setData({ submitting: false })
  },

  navigateBack() {
    wx.navigateBack()
  }
})
