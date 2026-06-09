const { getAPI } = require('../../utils/api.js')
const { getTempUrl } = require('../../utils/image.js')
const API = getAPI()

Page({
  data: {
    footprints: [],
    groupedFootprints: [],
    selectedFootprint: null,
    showPreviewModal: false,
    totalPets: 0,
    totalRecords: 0,
    companyDays: 0,
    isEditMode: false,
    selectedMap: {},
    selectedCount: 0,
    pageNum: 1,
    pageSize: 6,
    hasMore: true,
    loading: false,
    loadingMore: false,
    refreshing: false,
    statusBarHeight: 0,
    totalNavHeight: 120,
    showDescModal: false,
    descValue: '',
    tempFilePaths: [],
    showSkeleton: true,
    isLoggedIn: false
  },

  onLoad: function () {
    const sysInfo = wx.getSystemInfoSync()
    const statusBarHeight = Math.max(sysInfo.statusBarHeight || 20, 20)
    const safeAreaTop = sysInfo.safeArea ? (sysInfo.safeArea.top || statusBarHeight) : statusBarHeight
    const finalStatusBarHeight = Math.max(statusBarHeight, safeAreaTop)
    const rpxRatio = 750 / sysInfo.windowWidth
    const totalNavHeight = Math.round(finalStatusBarHeight * rpxRatio) + 88 + 16
    this.setData({ statusBarHeight: finalStatusBarHeight, totalNavHeight })
    const app = getApp()
    const isLoggedIn = app.globalData.isLoggedIn
    this.setData({ isLoggedIn })
    if (isLoggedIn) {
      this.loadAll()
    } else {
      this.setData({ showSkeleton: false })
    }
  },

  onShow: function () {
    const app = getApp()
    const isLoggedIn = app.globalData.isLoggedIn
    this.setData({ isLoggedIn })
    // 主动更新 tabBar 选中状态，并确保 tabBar 可见
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      const tabBar = this.getTabBar()
      tabBar.setData({ selected: 1, visible: true })
    }
    // 登录后返回时自动加载数据
    if (app.globalData.isLoggedIn && this.data.footprints.length === 0) {
      this.loadAll()
    }
  },

  goToLogin: function () {
    const app = getApp()
    app.requireLogin()
  },

  onReachBottom: function () {

    this.loadMoreFootprints()
  },

  onPullDownRefresh: function () {
    this.setData({ refreshing: true })
    this.loadAll().then(() => {
      this.setData({ refreshing: false })
      wx.stopPullDownRefresh()
    }).catch(() => {
      this.setData({ refreshing: false })
      wx.stopPullDownRefresh()
    })
  },

  loadAll: async function () {
    await Promise.all([
      this.loadFootprints(),
      this.loadStats()
    ])
    this.setData({ showSkeleton: false })
  },

  loadStats: async function () {
    try {
      const petResult = await API.getPetList()

      let totalPets = 0
      let totalRecords = 0

      if (petResult && petResult.success) {
        const pets = petResult.data.list || petResult.data || []
        totalPets = pets.length
        // 累计所有宠物的记录数量
        for (const pet of pets) {
          try {
            const rec = await API.getRecordList(pet._id || pet.id)
            if (rec && rec.success) {
              const records = rec.data.list || rec.data || []
              totalRecords += records.length
            }
          } catch (e) { /* 单个宠物加载失败不影响整体 */ }
        }
      }

      const companyDays = this.calcCompanyDaysFromRegister()

      this.setData({ totalPets, totalRecords, companyDays })
    } catch (error) {
      console.error('加载统计失败:', error)
      this.setData({ companyDays: this.calcCompanyDaysFromRegister() })
    }
  },

  calcCompanyDaysFromRegister: function () {
    try {
      const registerTime = wx.getStorageSync('registerTime')
      if (registerTime) {
        return this.calcDaysDiff(new Date(registerTime), new Date())
      }
      const userInfo = wx.getStorageSync('userInfo')
      if (userInfo && userInfo.createdAt) {
        const createdAt = userInfo.createdAt instanceof Date
          ? userInfo.createdAt
          : new Date(userInfo.createdAt)
        return this.calcDaysDiff(createdAt, new Date())
      }
    } catch (error) {
      console.error('计算陪伴天数失败:', error)
    }
    return 0
  },

  calcDaysDiff: function (date1, date2) {
    const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate())
    const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate())
    const diff = Math.floor((d2 - d1) / (1000 * 60 * 60 * 24))
    return Math.max(diff, 0)
  },

  loadFootprints: async function (reset = true) {

    if (reset) {
      this.setData({ loading: true, pageNum: 1, hasMore: true, footprints: [], groupedFootprints: [] })
    } else {
      if (this.data.loadingMore || !this.data.hasMore) {

        return
      }
      this.setData({ loadingMore: true })
    }

    try {
      const result = await API.getFootprintList('all', this.data.pageNum, this.data.pageSize)

      if (result.success) {
        const newFootprints = (result.data.list || result.data || [])
          .map((f) => {

            return { ...f, id: f._id || f.id || f._id }
          })
          .sort((a, b) => this.compareDate(b, a))

        const footprints = reset ? newFootprints : [...this.data.footprints, ...newFootprints]
        const hasMore = result.data.hasMore !== undefined ? result.data.hasMore : newFootprints.length === this.data.pageSize

        this.setData({
          footprints: footprints || [],
          groupedFootprints: this.groupFootprintsByPeriod(footprints) || [],
          hasMore,
          pageNum: reset ? 2 : this.data.pageNum + 1
        })
      } else {
        if (reset) {
          this.setData({ footprints: [], groupedFootprints: [], hasMore: false })
        }
      }
    } catch (error) {
      console.error('加载足迹失败:', error)
      if (reset) {
        this.setData({ footprints: [], groupedFootprints: [], hasMore: false })
      }
    } finally {
      this.setData({ loading: false, loadingMore: false })
    }
  },

  loadMoreFootprints: async function () {
    await this.loadFootprints(false)
  },

  compareDate: function (a, b) {
    const aTime = (a.date || '') + ' ' + (a.time || '')
    const bTime = (b.date || '') + ' ' + (b.time || '')
    return aTime.localeCompare(bTime)
  },

  /**
   * 将足迹按自然月份分组（如 "2026年6月"）
   * 避免出现"更早"等模糊概念
   */
  groupFootprintsByPeriod: function (footprints) {
    if (!footprints || footprints.length === 0) return []

    const map = new Map() // key: "YYYY年M月", value: { title, items }

    for (const fp of footprints) {
      const fpDate = this.parseFootprintDate(fp)
      if (!fpDate) continue

      const key = `${fpDate.getFullYear()}年${fpDate.getMonth() + 1}月`
      if (!map.has(key)) {
        map.set(key, { key, title: key, items: [] })
      }
      map.get(key).items.push(fp)
    }

    // 按月份倒序（最新的月份在最上面）
    return Array.from(map.values()).sort((a, b) => {
      // 解析 a.key / b.key: "2026年6月" => 2026, 6
      const parseKey = (k) => {
        const m = k.match(/(\d+)年(\d+)月/)
        return m ? { y: +m[1], m: +m[2] } : { y: 0, m: 0 }
      }
      const pa = parseKey(a.key)
      const pb = parseKey(b.key)
      if (pa.y !== pb.y) return pb.y - pa.y
      return pb.m - pa.m
    })
  },

  parseFootprintDate: function (fp) {
    if (!fp) return null
    // 优先使用 date 字段（YYYY-MM-DD，由上传时写入）
    if (fp.date) {
      const parts = String(fp.date).split('-')
      if (parts.length >= 3) {
        const y = parseInt(parts[0], 10)
        const m = parseInt(parts[1], 10) - 1
        const d = parseInt(parts[2], 10)
        if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
          return new Date(y, m, d)
        }
      }
    }
    // 兜底：使用 createdAt（云函数返回的是 ISO 字符串）
    if (fp.createdAt) {
      try {
        const d = fp.createdAt instanceof Date
          ? fp.createdAt
          : new Date(fp.createdAt)
        if (!isNaN(d.getTime())) {
          return new Date(d.getFullYear(), d.getMonth(), d.getDate())
        }
      } catch (e) {}
    }
    return null
  },

  addFootprint: function () {
    // 直接调用微信相册/拍照，只支持图片
    const that = this
    try {
      wx.chooseMedia({
        count: 9,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        sizeType: ['compressed'],
        camera: 'back',
        success: (res) => {
          const files = res.tempFiles || []
          if (!files.length) {
            wx.showToast({ title: '未选择图片', icon: 'none' })
            return
          }
          that.setData({ 
            tempFilePaths: files.map((f) => f.tempFilePath),
            descValue: '',
            showDescModal: true 
          })
        },
        fail: (err) => {
          if (err && err.errMsg && err.errMsg.indexOf('cancel') > -1) {
            return
          }
          // 兜底：老版本 API
          wx.chooseImage({
            count: 9,
            sizeType: ['compressed'],
            sourceType: ['album', 'camera'],
            success: (res2) => {
              that.setData({ 
                tempFilePaths: res2.tempFilePaths || [],
                descValue: '',
                showDescModal: true 
              })
            },
            fail: () => {}
          })
        }
      })
    } catch (error) {
      console.error('选择图片失败:', error)
      wx.showToast({ title: '选择失败', icon: 'none' })
    }
  },

  hideDescModal: function () {
    this.setData({ showDescModal: false, tempFilePaths: [], descValue: '' })
  },

  onDescInput: function (e) {
    this.setData({ descValue: e.detail.value })
  },

  confirmDesc: function () {
    const { tempFilePaths, descValue } = this.data
    this.setData({ showDescModal: false })
    this.uploadImages(tempFilePaths, descValue)
  },

  /**
   * 批量上传图片并保存足迹
   */
  uploadImages: async function (filePaths, description = '') {
    if (!filePaths || filePaths.length === 0) return
    wx.showLoading({ title: '上传中...', mask: true })

    let successCount = 0
    let failCount = 0

    for (let i = 0; i < filePaths.length; i++) {
      const path = filePaths[i]
      try {
        // 1. 上传到云存储
        const fileExt = (path.split('.').pop() || 'jpg').split('?')[0]
        const cloudPath = `footprints/${Date.now()}_${i}.${fileExt}`
        const uploadRes = await wx.cloud.uploadFile({
          cloudPath,
          filePath: path
        })
        if (!uploadRes || !uploadRes.fileID) {
          failCount++
          continue
        }

        // 2. 生成日期时间
        const now = new Date()
        const pad = (n) => String(n).padStart(2, '0')
        const footprintData = {
          type: 'image',
          url: uploadRes.fileID,
          thumbnail: '',
          duration: 0,
          date: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
          time: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
          description: description || ''
        }

        // 3. 调用云函数保存
        const result = await API.createFootprint(footprintData)
        if (result && result.success) {
          successCount++
        } else {
          failCount++
        }
      } catch (uploadErr) {
        console.error('单张图片上传失败:', uploadErr)
        failCount++
      }
    }

    wx.hideLoading()

    if (successCount > 0) {
      wx.showToast({
        title: `已添加 ${successCount} 张`,
        icon: 'success'
      })
      this.loadAll()
    } else {
      wx.showToast({ title: '上传失败，请重试', icon: 'none' })
    }
  },

  previewFootprint: function (e) {
    const fp = e.currentTarget.dataset.footprint
    this.setData({
      selectedFootprint: fp,
      showPreviewModal: true
    })
  },

  hidePreview: function () {
    this.setData({
      showPreviewModal: false,
      selectedFootprint: null
    })
  },

  deleteFootprint: async function (e) {
    const fp = e.currentTarget.dataset.id || (this.data.selectedFootprint && this.data.selectedFootprint.id)
    if (!fp) return
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条足迹吗？',
      success: async (res) => {
        if (!res.confirm) return
        try {
          const result = await API.deleteFootprint(fp)
          if (!result.success) throw new Error(result.message)
          this.onDeleteSuccess()
        } catch (error) {
          console.error('删除失败:', error)
          wx.showToast({ title: '删除失败', icon: 'none' })
        }
      }
    })
  },

  onDeleteSuccess: function () {
    this.setData({ showPreviewModal: false, selectedFootprint: null })
    this.loadAll()
    wx.showToast({ title: '已删除', icon: 'success' })
  },

  onPhotoError: function (e) {
    const { id } = e.currentTarget.dataset
    const { footprints } = this.data
    const fpIndex = footprints.findIndex((f) => f.id === id)
    if (fpIndex < 0) return
    const fp = footprints[fpIndex]
    if (!fp) return
    const url = fp.url || fp.path || fp.thumbnail
    if (!url) return
    if (url.startsWith('cloud://')) {
      getTempUrl(url).then((newUrl) => {
        const updated = [...footprints]
        const field = fp.url === url ? 'url' : fp.path === url ? 'path' : 'thumbnail'
        updated[fpIndex] = { ...fp, [field]: newUrl }
        this.setData({ footprints: updated, groupedFootprints: this.groupFootprintsByPeriod(updated) })
      }).catch(() => {})
    }
  },

  /* ======== 批量管理 ======== */

  enterEditMode: function () {
    this.setData({
      isEditMode: true,
      selectedMap: {},
      selectedCount: 0,
      allSelected: false
    })
  },

  exitEditMode: function () {
    this.setData({ isEditMode: false, selectedMap: {}, selectedCount: 0, allSelected: false })
  },

  onCardTap: function (e) {
    if (this.data.isEditMode) {
      const id = e.currentTarget.dataset.id
      if (id) this.toggleSelectById(id)
    } else {
      const fp = e.currentTarget.dataset.footprint
      this.setData({
        selectedFootprint: fp,
        showPreviewModal: true
      })
    }
  },

  toggleSelectById: function (id) {
    if (!id) return
    const { selectedMap, footprints } = this.data
    const newMap = { ...selectedMap }

    if (newMap[id]) {
      delete newMap[id]
    } else {
      newMap[id] = true
    }

    const selectedCount = Object.keys(newMap).length
    const allSelected = footprints.length > 0 && selectedCount === footprints.length

    this.setData({
      selectedMap: newMap,
      selectedCount,
      allSelected
    })
  },

  toggleSelect: function (e) {
    const id = e.currentTarget.dataset.id
    if (id) this.toggleSelectById(id)
  },

  toggleSelectAll: function () {
    const { footprints, allSelected } = this.data
    const newAllSelected = !allSelected

    if (newAllSelected) {
      const newMap = {}
      for (const fp of footprints) {
        if (fp.id) newMap[fp.id] = true
      }
      this.setData({
        selectedMap: newMap,
        selectedCount: footprints.length,
        allSelected: true
      })
    } else {
      this.setData({
        selectedMap: {},
        selectedCount: 0,
        allSelected: false
      })
    }
  },

  deleteSelected: async function () {
    const { selectedMap } = this.data
    const selectedIds = Object.keys(selectedMap)
    if (selectedIds.length === 0) {
      wx.showToast({ title: '请先选择足迹', icon: 'none' })
      return
    }
    wx.showModal({
      title: '批量删除',
      content: `确定要删除选中的 ${selectedIds.length} 条足迹吗？`,
      success: async (res) => {
        if (!res.confirm) return
        wx.showLoading({ title: '删除中...', mask: true })
        let successCount = 0
        let failCount = 0
        for (const id of selectedIds) {
          try {
            const result = await API.deleteFootprint(id)
            if (result && result.success) {
              successCount++
            } else {
              failCount++
            }
          } catch (err) {
            failCount++
          }
        }
        wx.hideLoading()
        if (successCount > 0) {
          wx.showToast({ title: `已删除 ${successCount} 条`, icon: 'success' })
        } else {
          wx.showToast({ title: '删除失败', icon: 'none' })
        }
        this.setData({ isEditMode: false, selectedMap: {}, selectedCount: 0, allSelected: false })
        if (successCount > 0) {
          this.loadAll()
        }
      }
    })
  }
})
