const app = getApp()

Page({
  data: {
    isLoggedIn: false,
    startDate: '',
    endDate: '',
    femaleIndex: 0,
    femaleOptions: ['全部'],
    femaleMap: {},
    sortBy: 'date',
    sortDesc: true,
    records: [],
    groupedRecords: [],
    hasData: true,
    stats: {
      totalHatches: 0,
      totalHatchCount: 0,
      totalGradeA: 0,
      totalDefect: 0,
      gradeARate: '0.00'
    }
  },

  onLoad: function (options) {
    wx.setNavigationBarTitle({ title: '出苗报表' })

    const today = new Date()
    const y = today.getFullYear()
    const m = String(today.getMonth() + 1).padStart(2, '0')
    const d = String(today.getDate()).padStart(2, '0')
    const endDate = `${y}-${m}-${d}`
    const startDate = `${y - 1}-${m}-${d}`

    this.setData({ startDate, endDate })

    if (options.petId) {
      this._preFilterPetId = options.petId
    }
    if (options.maleId) {
      this._maleId = options.maleId
    }

    this.loadFemales()
  },

  goBack: function () {
    wx.navigateBack()
  },

  onShow: function () {
    const app = getApp()
    this.setData({ isLoggedIn: app.globalData.isLoggedIn })
  },

  goToLogin: function () {
    const app = getApp()
    app.requireLogin()
  },

  // 加载种母选项
  loadFemales: function () {
    const db = wx.cloud.database()
    db.collection('pets').where({ gender: '母' }).get().then(res => {
      const options = ['全部']
      const femaleMap = {}
      res.data.forEach(pet => {
        const displayName = pet.alias || pet.name || pet.tag
        options.push(displayName)
        const pid = pet._id || pet.id
        if (pid) femaleMap[pid] = displayName
        if (pet.id && pet.id !== pid) femaleMap[pet.id] = displayName
      })
      this.setData({ femaleOptions: options, femaleMap })
      if (this._preFilterPetId && femaleMap[this._preFilterPetId]) {
        const idx = options.indexOf(femaleMap[this._preFilterPetId])
        if (idx > 0) this.setData({ femaleIndex: idx })
        delete this._preFilterPetId
        this.loadHatchRecords()
      } else if (this._maleId) {
        this._findPairedFemales(this._maleId, res.data, options, femaleMap)
      } else {
        this.loadHatchRecords()
      }
    }).catch(err => {
      console.error('加载种母列表失败', err)
      this.loadHatchRecords()
    })
  },

  // 根据公龟ID查找配对母龟并预选
  _findPairedFemales: function (maleId, femalePets, options, femaleMap) {
    const db = wx.cloud.database()
    db.collection('pets').doc(maleId).get().then(res => {
      const partnerId = res.data && (res.data.partner || '')
      if (!partnerId) {
        this._findByMatingText(maleId, femalePets, options)
        return
      }
      const displayName = femaleMap[partnerId]
      if (displayName) {
        const idx = options.indexOf(displayName)
        if (idx > 0) {
          this.setData({ femaleIndex: idx })
          wx.showToast({ title: '已筛选配对母龟', icon: 'none', duration: 1500 })
        }
      }
      this.loadHatchRecords()
    }).catch(() => {
      this._findByMatingText(maleId, femalePets, options)
    })
  },

  _findByMatingText: function (maleId, femalePets, options) {
    const db = wx.cloud.database()
    db.collection('records').where({ petId: maleId, type: '交配' }).get().then(res => {
      const matingTexts = (res.data || []).map(r => r.text || '').filter(Boolean)
      if (matingTexts.length === 0) {
        this.loadHatchRecords()
        return
      }
      let matchedIdx = -1
      for (let i = 0; i < femalePets.length; i++) {
        const pet = femalePets[i]
        const names = [pet.name, pet.alias, pet.tag].filter(Boolean)
        for (const name of names) {
          if (name && matingTexts.some(t => t.includes(name))) {
            const displayName = pet.alias || pet.name || pet.tag
            const idx = options.indexOf(displayName)
            if (idx > 0 && matchedIdx === -1) { matchedIdx = idx; break }
          }
        }
        if (matchedIdx > 0) break
      }
      if (matchedIdx > 0) {
        this.setData({ femaleIndex: matchedIdx })
        wx.showToast({ title: '已筛选配对母龟', icon: 'none', duration: 1500 })
      }
      this.loadHatchRecords()
    }).catch(() => {
      this.loadHatchRecords()
    })
  },

  // 加载出苗记录
  loadHatchRecords: function () {
    const db = wx.cloud.database()
    const _ = db.command

    let whereCondition = { type: '出苗' }

    if (this.data.startDate && this.data.endDate) {
      whereCondition.date = _.gte(this.data.startDate).and(_.lte(this.data.endDate))
    } else if (this.data.startDate) {
      whereCondition.date = _.gte(this.data.startDate)
    } else if (this.data.endDate) {
      whereCondition.date = _.lte(this.data.endDate)
    }

    if (this.data.femaleIndex > 0) {
      const femaleName = this.data.femaleOptions[this.data.femaleIndex]
      const petIds = Object.keys(this.data.femaleMap).filter(id => this.data.femaleMap[id] === femaleName)
      if (petIds.length > 0) {
        whereCondition.petId = _.in(petIds)
      }
    }

    const sortDesc = this.data.sortDesc
    db.collection('records').where(whereCondition).orderBy('date', sortDesc ? 'desc' : 'asc').limit(100).get().then(res => {
      console.log('出苗记录原始数据(云端):', JSON.stringify(res.data))
      if (res.data && res.data.length > 0) {
        this.processRecords(res.data)
      } else {
        // 云端无数据，尝试从本地缓存加载
        this._loadLocalHatchRecords(whereCondition)
      }
    }).catch(err => {
      console.error('加载出苗记录失败', err)
      // 云端查询失败，回退到本地
      this._loadLocalHatchRecords(whereCondition)
    })
  },

  // 本地回退加载
  _loadLocalHatchRecords: function (whereCondition) {
    try {
      const allRecords = wx.getStorageSync('records') || []
      let filtered = allRecords.filter(r => r.type === '出苗')
      // 日期范围过滤
      if (whereCondition.date) {
        // 简化处理：用字符串比较
        filtered = filtered.filter(r => {
          if (!r.date) return false
          if (this.data.startDate && r.date < this.data.startDate) return false
          if (this.data.endDate && r.date > this.data.endDate) return false
          return true
        })
      }
      // 种母过滤
      if (this.data.femaleIndex > 0) {
        const femaleName = this.data.femaleOptions[this.data.femaleIndex]
        const petIds = Object.keys(this.data.femaleMap).filter(id => this.data.femaleMap[id] === femaleName)
        if (petIds.length > 0) {
          filtered = filtered.filter(r => petIds.includes(r.petId))
        }
      }
      console.log('出苗记录原始数据(本地):', JSON.stringify(filtered))
      if (filtered.length === 0) {
        console.warn('云端和本地均无出苗记录，请确认：1)出苗记录已添加 2)云函数record已重新部署')
      }
      this.processRecords(filtered)
    } catch (err) {
      console.error('本地加载出苗记录失败', err)
      this.setData({ hasData: false, groupedRecords: [] })
    }
  },

  // 处理记录数据
  processRecords: function (records) {
    if (!records || records.length === 0) {
      this.setData({
        hasData: false,
        groupedRecords: [],
        stats: { totalHatches: 0, totalHatchCount: 0, totalGradeA: 0, totalDefect: 0, gradeARate: '0.00' }
      })
      return
    }

    const sortBy = this.data.sortBy
    const sortDesc = this.data.sortDesc
    let sortedRecords = [...records]

    if (sortBy === 'hatch') {
      sortedRecords.sort((a, b) => {
        const ha = parseInt(a.hatchCount) || 0
        const hb = parseInt(b.hatchCount) || 0
        return sortDesc ? hb - ha : ha - hb
      })
    } else if (sortBy === 'gradeRate') {
      sortedRecords.sort((a, b) => {
        const ha = parseInt(a.hatchCount) || 0
        const ga = parseInt(a.gradeACount) || 0
        const hb = parseInt(b.hatchCount) || 0
        const gb = parseInt(b.gradeACount) || 0
        const rateA = ha > 0 ? ga / ha : 0
        const rateB = hb > 0 ? gb / hb : 0
        return sortDesc ? rateB - rateA : rateA - rateB
      })
    }

    // 按年份分组
    const groups = {}
    sortedRecords.forEach((record, index) => {
      const year = record.date ? record.date.substring(0, 4) : new Date().getFullYear().toString()
      if (!groups[year]) groups[year] = []
      const femaleName = this.data.femaleMap[record.petId] || record.femaleName || '-'
      // 兼容多种字段名（与产蛋报表一致）
      const hatchCount = this._getInt(record, ['hatchCount', 'hatch_count', 'hatchNum', 'hatch_num', 'shellCount', 'shell_count'])
      const gradeACount = this._getInt(record, ['gradeACount', 'gradeA', 'grade_a', 'gradeACount', 'perfectCount'])
      const defectCount = this._getInt(record, ['defectCount', 'defect', 'defect_count', 'flawCount'])
      const gradeARate = hatchCount > 0 ? (gradeACount / hatchCount * 100).toFixed(1) : '0.0'

      groups[year].push({
        serial: index + 1,
        date: record.date || '-',
        femaleName,
        hatchCount,
        gradeACount,
        defectCount,
        gradeARate: gradeARate + '%',
        remark: record.text || ''
      })
    })

    const groupedRecords = Object.keys(groups).sort((a, b) => b - a).map(year => ({
      year,
      records: groups[year]
    }))

    // 统计数据
    let totalHatches = 0
    let totalHatchCount = 0
    let totalGradeA = 0
    let totalDefect = 0

    records.forEach(record => {
      totalHatches++
      totalHatchCount += this._getInt(record, ['hatchCount', 'hatch_count', 'hatchNum', 'shellCount'])
      totalGradeA += this._getInt(record, ['gradeACount', 'gradeA', 'grade_a', 'perfectCount'])
      totalDefect += this._getInt(record, ['defectCount', 'defect', 'defect_count', 'flawCount'])
    })

    const gradeARate = totalHatchCount > 0 ? ((totalGradeA / totalHatchCount) * 100).toFixed(2) : '0.00'

    this.setData({
      records,
      groupedRecords,
      hasData: true,
      stats: { totalHatches, totalHatchCount, totalGradeA, totalDefect, gradeARate }
    })
  },

  onStartDateChange: function (e) {
    this.setData({ startDate: e.detail.value })
  },

  onEndDateChange: function (e) {
    this.setData({ endDate: e.detail.value })
  },

  onFemaleChange: function (e) {
    this.setData({ femaleIndex: parseInt(e.detail.value) })
  },

  onSortDate: function () {
    if (this.data.sortBy === 'date') {
      this.setData({ sortDesc: !this.data.sortDesc })
    } else {
      this.setData({ sortBy: 'date', sortDesc: true })
    }
    this.loadHatchRecords()
  },

  onSortHatch: function () {
    if (this.data.sortBy === 'hatch') {
      this.setData({ sortDesc: !this.data.sortDesc })
    } else {
      this.setData({ sortBy: 'hatch', sortDesc: true })
    }
    this.loadHatchRecords()
  },

  onSortGradeRate: function () {
    if (this.data.sortBy === 'gradeRate') {
      this.setData({ sortDesc: !this.data.sortDesc })
    } else {
      this.setData({ sortBy: 'gradeRate', sortDesc: true })
    }
    this.loadHatchRecords()
  },

  onQuery: function () {
    this.loadHatchRecords()
  },

  onMonthStats: function () {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    this.setData({
      startDate: `${year}-${month}-01`,
      endDate: today.toISOString().split('T')[0]
    })
    this.loadHatchRecords()
  },

  // 兼容多种字段名取值
  _getInt: function (record, fields) {
    for (const field of fields) {
      if (record[field] !== undefined && record[field] !== null && record[field] !== '') {
        const value = parseInt(record[field])
        if (!isNaN(value)) return value
      }
    }
    return 0
  }
})
