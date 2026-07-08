const { getAPI } = require('../../../utils/api.js')

Page({
  data: {
    statusBarHeight: 0,
    tankId: '',
    submitting: false,
    form: {
      lay_date: new Date().toISOString().slice(0, 10),
      total_eggs: '',
      fertilized: '',
      unfertilized: '0',
      parent_male: '',
      parent_female: '',
      notes: ''
    }
  },

  onLoad(options) {
    const sysInfo = wx.getSystemInfoSync()
    this.setData({
      statusBarHeight: sysInfo.statusBarHeight || 20,
      tankId: options.id || ''
    })
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field
    const form = { ...this.data.form, [field]: e.detail.value }
    // 自动计算未受精数
    if (field === 'total_eggs' || field === 'fertilized') {
      const total = parseInt(form.total_eggs) || 0
      const fert = parseInt(form.fertilized) || 0
      form.unfertilized = Math.max(0, total - fert).toString()
    }
    this.setData({ form })
  },

  onDateChange(e) {
    const form = { ...this.data.form, lay_date: e.detail.value }
    this.setData({ form })
  },

  async submit() {
    if (this.data.submitting) return
    const { form } = this.data
    if (!form.total_eggs || parseInt(form.total_eggs) <= 0) {
      wx.showToast({ title: '请输入产蛋总数', icon: 'none' })
      return
    }

    this.setData({ submitting: true })
    try {
      const api = getAPI()
      const res = await api.request({
        url: `/api/tanks/${this.data.tankId}/eggs`,
        method: 'POST',
        data: {
          lay_date: form.lay_date,
          total_eggs: parseInt(form.total_eggs),
          fertilized: parseInt(form.fertilized) || 0,
          unfertilized: parseInt(form.unfertilized) || 0,
          parent_male: form.parent_male,
          parent_female: form.parent_female,
          notes: form.notes
        }
      })
      if (res.success) {
        wx.showToast({ title: '产蛋记录已保存', icon: 'success' })
        setTimeout(() => wx.navigateBack(), 1200)
      } else {
        wx.showToast({ title: res.message || '保存失败', icon: 'none' })
      }
    } catch (_) {
      wx.showToast({ title: '保存失败', icon: 'none' })
    }
    this.setData({ submitting: false })
  },

  navigateBack() { wx.navigateBack() }
})
