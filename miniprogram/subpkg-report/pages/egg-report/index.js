const { getAPI } = require('../../../utils/api')
const API = getAPI()
const app = getApp()

Page({
  data: {
    isLoggedIn: false,
    startDate: '',
    endDate: '',
    femaleIndex: 0,
    femaleOptions: ['全部'],
    femaleMap: {}, // 宠物ID到名称的映射
    sortBy: 'date', // 排序字段: date, egg, fertilization
    sortDesc: true, // 是否降序
    records: [],
    groupedRecords: [],
    hasData: true,
    stats: {
      totalNests: 0,
      totalEggs: 0,
      fertilizedNests: 0,
      fertilizedEggs: 0,
      fertilizationRate: '0.00'
    }
  },

  onLoad: function (options) {
    // 设置导航栏标题
    wx.setNavigationBarTitle({
      title: '产蛋报表'
    })
    
    const today = new Date()
    const y = today.getFullYear()
    const m = String(today.getMonth() + 1).padStart(2, '0')
    const d = String(today.getDate()).padStart(2, '0')
    const endDate = `${y}-${m}-${d}`
    const startDate = `${y - 1}-${m}-${d}`
    
    this.setData({
      startDate: startDate,
      endDate: endDate
    })
    
    // 支持从详情页带入种母筛选
    if (options.petId) {
      this._preFilterPetId = options.petId
    }
    // 支持公龟带入，查找配对母龟
    if (options.maleId) {
      this._maleId = options.maleId
    }
    
    this.loadFemales()
  },

  // 加载完成后再加载产蛋记录
  onFemalesLoaded: function () {
    this.loadEggRecords()
  },

  // 返回
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
    API.request('GET', '/api/pets', { gender: '母', pageSize: 999 }).then(res => {
      if (!res || !res.success) {
        console.error('加载种母列表失败', res && res.message)
        // 即使种母加载失败，也尝试加载产蛋记录
        this.loadEggRecords()
        return
      }
      // 兼容 {success, data: {list, total}} 与 {success, data: [...]} 两种返回
      const list = Array.isArray(res.data) ? res.data : (res.data && Array.isArray(res.data.list) ? res.data.list : [])
      const options = ['全部']
      const femaleMap = {}
      list.forEach(pet => {
        // 优先使用别名，如果没有别名则使用名字
        const displayName = pet.alias || pet.name || pet.tag
        options.push(displayName)
        // REST API 统一使用 id 字段（不再是 _id）
        const pid = pet.id
        if (pid) femaleMap[pid] = displayName
      })
      this.setData({
        femaleOptions: options,
        femaleMap: femaleMap
      })

      // 如果有预选种母，设置索引
      if (this._preFilterPetId && femaleMap[this._preFilterPetId]) {
        const idx = options.indexOf(femaleMap[this._preFilterPetId])
        if (idx > 0) {
          this.setData({ femaleIndex: idx })
        }
        delete this._preFilterPetId
        this.loadEggRecords()
      } else if (this._maleId) {
        // 公龟进入：查找配对母龟并预选
        this._findPairedFemales(this._maleId, list, options, femaleMap)
      } else {
        this.loadEggRecords()
      }
    }).catch(err => {
      console.error('加载种母列表失败', err)
      // 即使种母加载失败，也尝试加载产蛋记录
      this.loadEggRecords()
    })
  },

  // 根据公龟ID查找配对母龟并预选
  _findPairedFemales: function (maleId, femalePets, options, femaleMap) {
    // 查询公龟详情，获取 partnerId 字段
    API.request('GET', '/api/pets/' + maleId).then(res => {
      if (!res || !res.success) {
        // 查询失败，回退到查交配记录文字匹配
        this._findByMatingText(maleId, femalePets, options)
        return
      }
      const petData = res.data || {}
      // REST API 使用 partnerId（不再是 partner）
      const partnerId = petData.partnerId || ''
      if (!partnerId) {
        // 无配对关系，回退到查交配记录文字匹配
        this._findByMatingText(maleId, femalePets, options)
        return
      }
      // 在母龟列表中找到配对对象
      const displayName = femaleMap[partnerId]
      if (displayName) {
        const idx = options.indexOf(displayName)
        if (idx > 0) {
          this.setData({ femaleIndex: idx })
          wx.showToast({ title: '已筛选配对母龟', icon: 'none', duration: 1500 })
        }
      }
      this.loadEggRecords()
    }).catch(err => {
      console.error('查询配对关系失败', err)
      this._findByMatingText(maleId, femalePets, options)
    })
  },

  // 回退方案：通过交配记录文字匹配母龟
  _findByMatingText: function (maleId, femalePets, options) {
    API.request('GET', '/api/records', { petId: maleId, type: '交配', pageSize: 999 }).then(res => {
      if (!res || !res.success) {
        this.loadEggRecords()
        return
      }
      const list = Array.isArray(res.data) ? res.data : (res.data && Array.isArray(res.data.list) ? res.data.list : [])
      const matingTexts = list.map(r => r.text || '').filter(Boolean)
      if (matingTexts.length === 0) {
        this.loadEggRecords()
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
      this.loadEggRecords()
    }).catch(() => {
      this.loadEggRecords()
    })
  },

  // 加载产蛋记录
  loadEggRecords: function () {
    // REST API 不支持 db.command 复杂查询，改为拉取全部产蛋记录后客户端过滤
    API.request('GET', '/api/records', { type: '产蛋', pageSize: 999 }).then(res => {
      if (!res || !res.success) {
        console.error('加载产蛋记录失败', res && res.message)
        this._loadLocalEggRecords()
        return
      }
      const list = Array.isArray(res.data) ? res.data : (res.data && Array.isArray(res.data.list) ? res.data.list : [])
      console.log('产蛋记录原始数据(云端):', list)

      // 客户端过滤：日期范围
      let filtered = list
      if (this.data.startDate) {
        filtered = filtered.filter(r => r.date >= this.data.startDate)
      }
      if (this.data.endDate) {
        filtered = filtered.filter(r => r.date <= this.data.endDate)
      }

      // 客户端过滤：种母筛选
      if (this.data.femaleIndex > 0) {
        const femaleName = this.data.femaleOptions[this.data.femaleIndex]
        // 通过宠物名称查找对应的宠物ID
        const petIds = Object.keys(this.data.femaleMap).filter(id => this.data.femaleMap[id] === femaleName)
        if (petIds.length > 0) {
          filtered = filtered.filter(r => petIds.includes(r.petId))
        }
      }

      // 客户端排序：按日期排序（产蛋/受精率排序由 processRecords 二次处理）
      const sortBy = this.data.sortBy
      const sortDesc = this.data.sortDesc
      if (sortBy === 'date') {
        filtered.sort((a, b) => {
          const dateA = a.date || ''
          const dateB = b.date || ''
          if (dateA < dateB) return sortDesc ? 1 : -1
          if (dateA > dateB) return sortDesc ? -1 : 1
          return 0
        })
      }

      if (filtered.length > 0) {
        this.processRecords(filtered)
      } else {
        this._loadLocalEggRecords()
      }
    }).catch(err => {
      console.error('加载产蛋记录失败', err)
      this._loadLocalEggRecords()
    })
  },

  // 本地回退加载产蛋记录
  _loadLocalEggRecords: function () {
    try {
      const allRecords = wx.getStorageSync('records') || []
      let filtered = allRecords.filter(r => r.type === '产蛋')
      // 日期范围过滤
      if (this.data.startDate) {
        filtered = filtered.filter(r => r.date >= this.data.startDate)
      }
      if (this.data.endDate) {
        filtered = filtered.filter(r => r.date <= this.data.endDate)
      }
      // 种母过滤
      if (this.data.femaleIndex > 0) {
        const femaleName = this.data.femaleOptions[this.data.femaleIndex]
        const petIds = Object.keys(this.data.femaleMap).filter(id => this.data.femaleMap[id] === femaleName)
        if (petIds.length > 0) {
          filtered = filtered.filter(r => petIds.includes(r.petId))
        }
      }
      console.log('产蛋记录原始数据(本地):', filtered)
      this.processRecords(filtered)
    } catch (err) {
      console.error('本地加载产蛋记录失败', err)
      this.setData({ hasData: false, groupedRecords: [] })
    }
  },

  // 处理记录数据
  processRecords: function (records) {
    if (!records || records.length === 0) {
      this.setData({
        hasData: false,
        groupedRecords: [],
        stats: {
          totalNests: 0,
          totalEggs: 0,
          fertilizedNests: 0,
          fertilizedEggs: 0,
          fertilizationRate: '0.00'
        }
      })
      return
    }

    console.log('处理产蛋记录:', records)

    // 根据排序方式进行客户端排序
    const sortBy = this.data.sortBy
    const sortDesc = this.data.sortDesc
    let sortedRecords = [...records]
    
    if (sortBy === 'egg') {
      // 按产蛋数量排序
      sortedRecords.sort((a, b) => {
        const eggA = this._getEggCount(a)
        const eggB = this._getEggCount(b)
        return sortDesc ? eggB - eggA : eggA - eggB
      })
    } else if (sortBy === 'fertilization') {
      // 按受精率排序
      sortedRecords.sort((a, b) => {
        const eggA = this._getEggCount(a)
        const fertA = this._getFertilizedCount(a)
        const eggB = this._getEggCount(b)
        const fertB = this._getFertilizedCount(b)
        const rateA = eggA > 0 ? fertA / eggA : 0
        const rateB = eggB > 0 ? fertB / eggB : 0
        return sortDesc ? rateB - rateA : rateA - rateB
      })
    }

    // 按年份分组
    const groups = {}
    sortedRecords.forEach((record, index) => {
      const year = record.date ? record.date.substring(0, 4) : new Date().getFullYear().toString()
      if (!groups[year]) {
        groups[year] = []
      }
      // 获取种母名称
      const femaleName = this.data.femaleMap[record.petId] || record.femaleName || '-'
      // 获取产蛋数据（支持多种字段名）
      const eggCount = this._getEggCount(record)
      const fertilizedCount = this._getFertilizedCount(record)
      
      console.log(`记录[${index}]: eggCount=${eggCount}, fertilizedCount=${fertilizedCount}, 原始数据=`, record)
      
      groups[year].push({
        serial: index + 1,
        date: record.date || '-',
        femaleName: femaleName,
        eggCount: eggCount,
        fertilizedCount: fertilizedCount,
        remark: record.remark || record.text || ''
      })
    })

    const groupedRecords = Object.keys(groups).sort((a, b) => b - a).map(year => ({
      year: year,
      records: groups[year]
    }))

    // 计算统计数据
    let totalNests = 0
    let totalEggs = 0
    let fertilizedNests = 0
    let fertilizedEggs = 0

    records.forEach(record => {
      totalNests++
      const eggCount = this._getEggCount(record)
      const fertilizedCount = this._getFertilizedCount(record)
      totalEggs += eggCount
      if (fertilizedCount > 0) {
        fertilizedNests++
      }
      fertilizedEggs += fertilizedCount
    })

    const fertilizationRate = totalEggs > 0 ? ((fertilizedEggs / totalEggs) * 100).toFixed(2) : '0.00'

    console.log('统计结果:', { totalNests, totalEggs, fertilizedNests, fertilizedEggs, fertilizationRate })

    this.setData({
      records: records,
      groupedRecords: groupedRecords,
      hasData: true,
      stats: {
        totalNests,
        totalEggs,
        fertilizedNests,
        fertilizedEggs,
        fertilizationRate
      }
    })
  },

  // 获取产蛋数量（支持多种字段名）
  _getEggCount: function (record) {
    const possibleFields = ['eggCount', 'eggs', 'egg_num', 'eggNum', 'totalEggs', 'egg_count', 'layCount']
    for (const field of possibleFields) {
      if (record[field] !== undefined && record[field] !== null && record[field] !== '') {
        const value = parseInt(record[field])
        if (!isNaN(value)) {
          return value
        }
      }
    }
    return 0
  },

  // 获取受精数量（支持多种字段名）
  _getFertilizedCount: function (record) {
    const possibleFields = ['fertilizedCount', 'fertilized', 'fertilized_num', 'fertilizedNum', 'fertileEggs', 'fertilized_count', 'fertilizeCount']
    for (const field of possibleFields) {
      if (record[field] !== undefined && record[field] !== null && record[field] !== '') {
        const value = parseInt(record[field])
        if (!isNaN(value)) {
          return value
        }
      }
    }
    return 0
  },

  // 开始日期选择
  onStartDateChange: function (e) {
    this.setData({
      startDate: e.detail.value
    })
  },

  // 结束日期选择
  onEndDateChange: function (e) {
    this.setData({
      endDate: e.detail.value
    })
  },

  // 种母选择
  onFemaleChange: function (e) {
    this.setData({
      femaleIndex: parseInt(e.detail.value)
    })
  },

  // 点击日期排序
  onSortDate: function () {
    const currentSortBy = this.data.sortBy
    const currentSortDesc = this.data.sortDesc
    
    if (currentSortBy === 'date') {
      // 如果当前已经是按日期排序，则切换升降序
      this.setData({
        sortDesc: !currentSortDesc
      })
    } else {
      // 切换到日期排序，默认降序（最新）
      this.setData({
        sortBy: 'date',
        sortDesc: true
      })
    }
    this.loadEggRecords()
  },

  // 点击产蛋-受精排序
  onSortEgg: function () {
    const currentSortBy = this.data.sortBy
    const currentSortDesc = this.data.sortDesc
    
    if (currentSortBy === 'egg') {
      // 如果当前已经是按产蛋排序，则切换升降序
      this.setData({
        sortDesc: !currentSortDesc
      })
    } else {
      // 切换到产蛋数量排序，默认降序（产蛋最多）
      this.setData({
        sortBy: 'egg',
        sortDesc: true
      })
    }
    this.loadEggRecords()
  },

  // 查询
  onQuery: function () {
    this.loadEggRecords()
  },

  // 月统计
  onMonthStats: function () {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const startDate = `${year}-${month}-01`
    const endDate = today.toISOString().split('T')[0]
    
    this.setData({
      startDate: startDate,
      endDate: endDate
    })
    
    this.loadEggRecords()
  }
})