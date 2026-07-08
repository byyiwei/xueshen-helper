var apiModule = require('../../../utils/api.js')
var getAPI = apiModule.getAPI

Page({
  data: {
    statusBarHeight: 0,
    totalNavHeight: 120,
    loading: true,
    loadError: false,
    showContent: false,
    stats: {
      count: 0,
      countMale: 0,
      countFemale: 0
    },
    tanks: [],
    eggSummary: [],
    hasEggSummary: false,
    tanksEmpty: true,
    hasTanks: false
  },

  onLoad: function () {
    this.initNavHeight()
    this.loadData()
  },

  initNavHeight: function () {
    var sysInfo = wx.getSystemInfoSync()
    var statusBarHeight = Math.max(sysInfo.statusBarHeight || 20, 20)
    var safeAreaTop = sysInfo.safeArea ? (sysInfo.safeArea.top || statusBarHeight) : statusBarHeight
    var finalStatusBarHeight = Math.max(statusBarHeight, safeAreaTop)
    var rpxRatio = 750 / sysInfo.windowWidth
    var totalNavHeight = Math.round(finalStatusBarHeight * rpxRatio) + 88 + 20
    this.setData({
      statusBarHeight: finalStatusBarHeight,
      totalNavHeight: totalNavHeight
    })
  },

  onPullDownRefresh: function () {
    this.loadData().then(function () {
      wx.stopPullDownRefresh()
    })
  },

  loadData: function () {
    var that = this
    this.setData({ loading: true, loadError: false, showContent: false })
    var api = getAPI()

    return Promise.all([
      api.request('GET', '/api/tanks'),
      api.request('GET', '/api/tanks/stats')
    ]).then(function (results) {
      var tankRes = results[0] || {}
      var statsRes = results[1] || {}
      var rawTanks = tankRes.success && Array.isArray(tankRes.data) ? tankRes.data : []
      var tanks = rawTanks.map(function (item) {
        item = item || {}
        var normalized = {}
        Object.keys(item).forEach(function (key) {
          normalized[key] = item[key]
        })
        normalized.name = item.name || '未命名龟缸'
        normalized.male_count = item.male_count || 0
        normalized.female_count = item.female_count || 0
        return normalized
      })
      var statsData = statsRes.success && statsRes.data ? statsRes.data : {}

      var eggSummary = []
      var eggRequests = tanks.map(function (tank) {
        return api.request('GET', '/api/tanks/' + tank.id + '/eggs')
      })

      return Promise.all(eggRequests).then(function (eggResults) {
        eggResults.forEach(function (eggRes, index) {
          var tank = tanks[index]
          var eggRecords = eggRes.success && Array.isArray(eggRes.data) ? eggRes.data : []
          if (eggRecords.length) {
            var totalEggs = 0
            var totalFertilized = 0
            var hatchedTotal = 0
            eggRecords.forEach(function (egg) {
              totalEggs += egg.total_eggs || 0
              totalFertilized += egg.fertilized || 0
              var hatchRecords = Array.isArray(egg.hatch_records) ? egg.hatch_records : []
              hatchRecords.forEach(function (h) {
                hatchedTotal += h.total_hatched || 0
              })
            })
            var fertilityRate = totalEggs > 0
              ? ((totalFertilized / totalEggs) * 100).toFixed(1) + '%'
              : '-'
            eggSummary.push({
              tankId: tank.id,
              tankName: tank.name,
              eggCount: eggRecords.length,
              totalEggs: totalEggs,
              fertilityRate: fertilityRate,
              hatchedTotal: hatchedTotal
            })
          }
        })

        that.setData({
          loading: false,
          loadError: false,
          showContent: true,
          tanks: tanks,
          tanksEmpty: tanks.length === 0,
          hasTanks: tanks.length > 0,
          stats: {
            count: statsData.count || 0,
            countMale: statsData.totalMale || 0,
            countFemale: statsData.totalFemale || 0
          },
          eggSummary: eggSummary,
          hasEggSummary: eggSummary.length > 0
        })
      })
    }).catch(function (err) {
      console.error('[Dashboard] loadData error:', err)
      that.setData({ loading: false, loadError: true, showContent: false })
    })
  },

  retryLoad: function () {
    this.loadData()
  },

  navigateBack: function () {
    wx.navigateBack()
  },

  goDetail: function (e) {
    var id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/subpkg-tanks/pages/tanks/detail?id=' + id })
  }
})
