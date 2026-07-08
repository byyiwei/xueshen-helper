const { getAPI } = require('../../../utils/api.js')

Page({
  data: {
    statusBarHeight: 0,
    tankId: '',
    eggId: '',
    submitting: false,
    form: {
      hatch_date: new Date().toISOString().slice(0, 10),
      total_hatched: '',
      perfect_count: '',
      imperfect_count: '0',
      notes: ''
    }
  },

  onLoad(options) {
    const sysInfo = wx.getSystemInfoSync()
    this.setData({
      statusBarHeight: sysInfo.statusBarHeight || 20,
      tankId: options.tankId || '',
      eggId: options.eggId || ''
    })
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field
    const form = { ...this.data.form, [field]: e.detail.value }
    if (field === 'total_hatched' || field === 'perfect_count') {
      const total = parseInt(form.total_hatched) || 0
      const perfect = parseInt(form.perfect_count) || 0
      form.imperfect_count = Math.max(0, total - perfect).toString()
    }
    this.setData({ form })
  },

  onDateChange(e) {
    const form = { ...this.data.form, hatch_date: e.detail.value }
    this.setData({ form })
  },

  async submit() {
    if (this.data.submitting) return
    const { form } = this.data
    if (!form.total_hatched || parseInt(form.total_hatched) <= 0) {
      wx.showToast({ title: '请输入出苗总数', icon: 'none' })
      return
    }

    this.setData({ submitting: true })
    try {
      const api = getAPI()
      const res = await api.request({
        url: `/api/tanks/${this.data.tankId}/eggs/${this.data.eggId}/hatch`,
        method: 'POST',
        data: {
          hatch_date: form.hatch_date,
          total_hatched: parseInt(form.total_hatched),
          perfect_count: parseInt(form.perfect_count) || 0,
          imperfect_count: parseInt(form.imperfect_count) || 0,
          notes: form.notes
        }
      })
      if (res.success) {
        wx.showToast({ title: '孵化记录已保存', icon: 'success' })
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
