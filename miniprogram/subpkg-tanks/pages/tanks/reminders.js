const { getAPI } = require('../../../utils/api.js')

const TYPE_OPTIONS = [
  { value: 'water', label: '💧 换水', desc: '定期换水提醒' },
  { value: 'feed', label: '🍽 喂食', desc: '定期喂食提醒' },
  { value: 'event', label: '📌 事件', desc: '一次性事件提醒' }
]

// 格式化日期为 YYYY-MM-DD（处理 ISO 字符串和 Date 对象）
function fmtDate(d) {
  if (!d) return ''
  const date = new Date(d)
  if (isNaN(date.getTime())) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// 获取今天的本地日期（不受时区影响）
function todayStr() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

Page({
  data: {
    statusBarHeight: 0,
    tankId: '',
    loading: true,
    saving: false,
    reminders: [],
    typeOptions: TYPE_OPTIONS,
    typeLabels: TYPE_OPTIONS.map(t => t.label)
  },

  onLoad(options) {
    const sysInfo = wx.getSystemInfoSync()
    this.setData({
      statusBarHeight: sysInfo.statusBarHeight || 20,
      tankId: options.id || ''
    })
    this.loadReminders()
  },

  async loadReminders() {
    this.setData({ loading: true })
    try {
      const api = getAPI()
      const res = await api.request({ url: `/api/tanks/${this.data.tankId}/reminders`, method: 'GET' })
      if (res.success && res.data) {
        // 给每条提醒加上 typeLabel 和 typeIndex，格式化日期
        const reminders = (res.data || []).map(r => {
          const idx = TYPE_OPTIONS.findIndex(t => t.value === r.type)
          return {
            ...r,
            typeLabel: idx >= 0 ? TYPE_OPTIONS[idx].label : '💧 换水',
            typeIndex: idx >= 0 ? idx : 0,
            next_remind: fmtDate(r.next_remind),
            event_date: fmtDate(r.event_date)
          }
        })
        this.setData({ reminders })
      }
    } catch (_) {}
    this.setData({ loading: false })
  },

  // 添加提醒项
  addReminder() {
    // 找出尚未添加的类型
    const usedTypes = this.data.reminders.map(r => r.type)
    const available = TYPE_OPTIONS.find(t => !usedTypes.includes(t.value))
    if (!available) {
      wx.showToast({ title: '换水、喂食、事件各只能添加一次', icon: 'none' })
      return
    }

    const today = todayStr()
    const reminders = [...this.data.reminders, {
      type: available.value,
      typeLabel: available.label,
      typeIndex: TYPE_OPTIONS.indexOf(available),
      interval_days: 7,
      next_remind: today,
      event_name: '',
      event_date: today,
      enabled: true
    }]
    this.setData({ reminders })
  },

  // 删除提醒项
  removeReminder(e) {
    const idx = e.currentTarget.dataset.index
    wx.showModal({
      title: '删除提醒',
      content: '确定删除这条提醒吗？',
      success: (res) => {
        if (res.confirm) {
          const reminders = [...this.data.reminders]
          reminders.splice(idx, 1)
          this.setData({ reminders })
        }
      }
    })
  },

  // 类型选择
  onTypeChange(e) {
    const idx = e.currentTarget.dataset.index
    const typeIdx = parseInt(e.detail.value)
    const typeOpt = TYPE_OPTIONS[typeIdx]

    // 检查该类型是否已被其他提醒占用
    const duplicate = this.data.reminders.some((r, i) => i !== idx && r.type === typeOpt.value)
    if (duplicate) {
      const label = typeOpt.label.replace(/^\S+\s/, '')
      wx.showToast({ title: `${label}提醒已存在，不可重复添加`, icon: 'none' })
      return
    }

    const reminders = [...this.data.reminders]
    reminders[idx] = {
      ...reminders[idx],
      type: typeOpt.value,
      typeLabel: typeOpt.label,
      typeIndex: typeIdx
    }
    this.setData({ reminders })
  },

  // 输入框变化
  onInput(e) {
    const { index, field } = e.currentTarget.dataset
    const value = e.detail.value
    const reminders = [...this.data.reminders]
    reminders[index] = { ...reminders[index], [field]: value }

    // 修改间隔天数时，自动重新计算下次提醒日期
    if (field === 'interval_days' && reminders[index].type !== 'event') {
      const interval = parseInt(value) || 0
      if (interval > 0) {
        const base = reminders[index].last_remind
          ? new Date(reminders[index].last_remind)
          : new Date()
        if (!isNaN(base.getTime())) {
          base.setDate(base.getDate() + interval)
          reminders[index].next_remind = `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, '0')}-${String(base.getDate()).padStart(2, '0')}`
        }
      }
    }

    this.setData({ reminders })
  },

  // 日期选择
  onDateChange(e) {
    const { index, field } = e.currentTarget.dataset
    const value = e.detail.value
    const reminders = [...this.data.reminders]
    reminders[index] = { ...reminders[index], [field]: value }
    this.setData({ reminders })
  },

  // 开关切换
  onSwitch(e) {
    const idx = e.currentTarget.dataset.index
    const value = e.detail.value
    const reminders = [...this.data.reminders]
    reminders[idx] = { ...reminders[idx], enabled: value }
    this.setData({ reminders })
  },

  async save() {
    if (this.data.saving) return
    if (this.data.reminders.length === 0) {
      wx.showToast({ title: '请先添加提醒', icon: 'none' })
      return
    }

    // 验证
    for (let i = 0; i < this.data.reminders.length; i++) {
      const r = this.data.reminders[i]
      if (r.type === 'event') {
        if (!r.event_name || !r.event_name.trim()) {
          wx.showToast({ title: `第${i + 1}条：请填写事件名称`, icon: 'none' })
          return
        }
        if (!r.event_date) {
          wx.showToast({ title: `第${i + 1}条：请选择事件日期`, icon: 'none' })
          return
        }
      } else {
        if (!r.interval_days || parseInt(r.interval_days) <= 0) {
          wx.showToast({ title: `第${i + 1}条：间隔天数需大于0`, icon: 'none' })
          return
        }
      }
    }

    this.setData({ saving: true })
    try {
      const today = todayStr()
      const items = this.data.reminders.map(r => {
        const interval = r.type === 'event' ? 0 : parseInt(r.interval_days) || 0

        // 周期提醒：如果间隔变了或没有下次提醒日期，重新计算
        let nextRemind = null
        if (r.type === 'event') {
          nextRemind = r.event_date || null
        } else if (interval > 0) {
          // 如果有上次打卡日期，基于上次打卡 + 间隔计算
          if (r.last_remind) {
            const lastDate = new Date(r.last_remind)
            if (!isNaN(lastDate.getTime())) {
              lastDate.setDate(lastDate.getDate() + interval)
              nextRemind = `${lastDate.getFullYear()}-${String(lastDate.getMonth() + 1).padStart(2, '0')}-${String(lastDate.getDate()).padStart(2, '0')}`
            }
          }
          // 如果没有上次打卡，或计算失败，用当前 next_remind 或今天
          if (!nextRemind) {
            nextRemind = r.next_remind || today
          }
        }

        return {
          type: r.type,
          interval_days: interval,
          next_remind: nextRemind,
          event_name: r.event_name || '',
          event_date: r.type === 'event' ? r.event_date : null,
          enabled: r.enabled !== false
        }
      })

      const api = getAPI()
      const res = await api.request({
        url: `/api/tanks/${this.data.tankId}/reminders`,
        method: 'PUT',
        data: { items }
      })

      if (res.success) {
        wx.showToast({ title: '保存成功', icon: 'success' })
        setTimeout(() => wx.navigateBack(), 800)
      } else {
        wx.showToast({ title: res.message || '保存失败', icon: 'none' })
      }
    } catch (err) {
      wx.showToast({ title: '保存失败', icon: 'none' })
    }
    this.setData({ saving: false })
  },

  navigateBack() { wx.navigateBack() }
})
