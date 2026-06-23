Page({
  data: {
    statusBarHeight: 0,
    totalNavHeight: 120,
    isLoggedIn: false,
    mode: 'edge',
    unit: 'mm',
    frontGlassMode: 'full',
    warning: '',
    showResult: true,
    params: {
      tankLength: 800,
      tankWidth: 400,
      tankHeight: 400,
      sideThickness: 8,
      bottomThickness: 10,
      tankCount: '1',
      frontHeight: 200,
      sidePrice: '80',
      bottomPrice: '100',
      grindPrice: '3',
      glueCount: '2',
      gluePrice: '25'
    },
    displayParams: {
      tankLength: '800',
      tankWidth: '400',
      tankHeight: '400',
      sideThickness: '8',
      bottomThickness: '10',
      frontHeight: '200'
    },
    glassDetails: [],
    results: {
      glassMaterial: 0,
      grindTotal: 0,
      glueTotal: 0,
      total: 0,
      totalWeight: 0,
      totalArea: 0,
      totalGrind: 0
    },
    // 3D 示意图已移除，使用 3D 模型页面查看
  },

  onLoad() {
    const sysInfo = wx.getSystemInfoSync()
    const statusBarHeight = Math.max(sysInfo.statusBarHeight || 20, 20)
    const safeAreaTop = sysInfo.safeArea ? (sysInfo.safeArea.top || statusBarHeight) : statusBarHeight
    const finalStatusBarHeight = Math.max(statusBarHeight, safeAreaTop)
    const rpxRatio = 750 / sysInfo.windowWidth
    const totalNavHeight = Math.round(finalStatusBarHeight * rpxRatio) + 88 + 24
    this.setData({ statusBarHeight: finalStatusBarHeight, totalNavHeight })
    
    // 页面加载时自动计算一次，显示默认结果
    this.calculate()
  },

  onUnload() {},

  goBack() {
    wx.navigateBack()
  },

  onShow() {
    const app = getApp()
    this.setData({ isLoggedIn: app.globalData.isLoggedIn })
  },

  goToLogin: function () {
    const app = getApp()
    app.requireLogin()
  },

  goToTank3D() {
    const { params, frontGlassMode } = this.data
    const length = params.tankLength || 800
    const width = params.tankWidth || 400
    const height = params.tankHeight || 400
    const frontHeight = params.frontHeight || 200
    wx.navigateTo({
      url: `/subpkg-tools/pages/tools/tank3d/index?length=${length}&width=${width}&height=${height}&frontMode=${frontGlassMode}&frontHeight=${frontHeight}`
    })
  },

  copyDetails() {
    const { glassDetails } = this.data
    if (!glassDetails || glassDetails.length === 0) {
      wx.showToast({
        title: '暂无数据',
        icon: 'none',
        duration: 2000
      })
      return
    }

    let text = '材料\t规格(mm)\t数量\n'
    text += '--------\t--------\t--------\n'
    glassDetails.forEach(item => {
      text += `${item.name}\t${item.size}\t${item.count}\n`
    })

    wx.setClipboardData({
      data: text,
      success: () => {
        wx.showToast({
          title: '复制成功',
          icon: 'success',
          duration: 2000
        })
      },
      fail: () => {
        wx.showToast({
          title: '复制失败',
          icon: 'error',
          duration: 2000
        })
      }
    })
  },

  setMode(e) {
    const mode = e.currentTarget.dataset.mode
    this.setData({ mode, showResult: false, warning: '' })
  },

  setFrontGlassMode(e) {
    const mode = e.currentTarget.dataset.mode
    if (mode === this.data.frontGlassMode) return
    this.setData({ frontGlassMode: mode, showResult: false, warning: '' })
  },

  setUnit(e) {
    const unit = e.currentTarget.dataset.unit
    this.setData({ unit, showResult: false, warning: '' })
    this.updateDisplayParams()
  },

  updateDisplayParams() {
    const { params, unit } = this.data
    const displayParams = {}
    const sizeKeys = ['tankLength', 'tankWidth', 'tankHeight', 'sideThickness', 'bottomThickness', 'frontHeight']
    
    sizeKeys.forEach(key => {
      const mmValue = params[key] || 0
      let displayValue
      switch(unit) {
        case 'mm':
          displayValue = mmValue.toString()
          break
        case 'cm':
          displayValue = (mmValue / 10).toString()
          break
        case 'm':
          displayValue = (mmValue / 1000).toString()
          break
        default:
          displayValue = mmValue.toString()
      }
      displayParams[key] = displayValue
    })
    
    this.setData({ displayParams })
  },

  onInputChange(e) {
    const key = e.currentTarget.dataset.key
    const value = e.detail.value
    const { unit } = this.data
    
    if (['tankLength', 'tankWidth', 'tankHeight', 'sideThickness', 'bottomThickness', 'frontHeight'].includes(key)) {
      const numValue = parseFloat(value) || 0
      let mmValue = numValue
      switch(unit) {
        case 'mm':
          mmValue = numValue
          break
        case 'cm':
          mmValue = numValue * 10
          break
        case 'm':
          mmValue = numValue * 1000
          break
      }
      this.setData({ 
        [`params.${key}`]: mmValue,
        [`displayParams.${key}`]: value,
        showResult: false,
        warning: ''
      })
    } else {
      this.setData({ 
        [`params.${key}`]: value,
        showResult: false,
        warning: ''
      })
    }
  },

  calculate() {
    console.log('=== calculate 函数开始 ===')
    try {
      this.setData({ warning: '' })
      
      const params = this.data.params
      console.log('params:', params)
      
      // 解析输入值（尺寸已存储为mm）
      const tankLength = Number(params.tankLength) || 800
      const tankWidth = Number(params.tankWidth) || 400
      const tankHeight = Number(params.tankHeight) || 400
      const sideThickness = Number(params.sideThickness) || 8
      const bottomThickness = Number(params.bottomThickness) || 10
      const tankCount = Math.max(1, Number(params.tankCount) || 1)
      const sidePrice = Number(params.sidePrice) || 80
      const bottomPrice = Number(params.bottomPrice) || 100
      const grindPrice = Number(params.grindPrice) || 3
      const glueCount = Number(params.glueCount) || 2
      const gluePrice = Number(params.gluePrice) || 25
      
      console.log('解析后的值:', {
        tankLength, tankWidth, tankHeight,
        sideThickness, bottomThickness, tankCount,
        sidePrice, bottomPrice, grindPrice, glueCount, gluePrice
      })

      // 输入验证
      if (tankLength <= 0 || tankWidth <= 0 || tankHeight <= 0) {
        this.setData({ warning: '请输入有效的缸体尺寸' })
        return
      }
      
      if (sideThickness <= 0 || bottomThickness <= 0) {
        this.setData({ warning: '请输入有效的玻璃厚度' })
        return
      }

      // 尺寸合理性检查
      if (tankLength < sideThickness * 4) {
        this.setData({ warning: '缸长过小，无法满足边包底工艺要求' })
        return
      }
      
      if (tankWidth < sideThickness * 4) {
        this.setData({ warning: '缸宽过小，无法满足边包底工艺要求' })
        return
      }

      // 根据模式计算下料尺寸
      let bottomLength, bottomWidth
      let frontBackHeight, leftRightHeight, leftRightLength

      if (this.data.mode === 'edge') {
        // 边包底模式
        bottomLength = tankLength - 2 * sideThickness
        bottomWidth = tankWidth - 2 * sideThickness
        frontBackHeight = tankHeight
        leftRightHeight = tankHeight
        leftRightLength = tankWidth - 2 * sideThickness
      } else {
        // 底包边模式
        bottomLength = tankLength
        bottomWidth = tankWidth
        frontBackHeight = tankHeight - bottomThickness
        leftRightHeight = tankHeight - bottomThickness
        leftRightLength = tankWidth - 2 * sideThickness
      }

      // 根据正面玻璃模式调整前玻璃高度
      const frontHeight = this.data.frontGlassMode === 'full' ? frontBackHeight : Math.min(Number(params.frontHeight) || frontBackHeight, frontBackHeight)

      // 计算各块玻璃的详细信息
      const glassDetails = []
      let totalArea = 0
      let totalGrind = 0
      let totalWeight = 0
      let totalMaterial = 0

      // 底部玻璃
      const bottomArea = (bottomLength * bottomWidth) / 1000000
      const bottomVolume = bottomArea * (bottomThickness / 1000)
      const bottomWeight = bottomVolume * 2500
      const bottomGrind = (bottomLength + bottomWidth) * 2 / 1000
      const bottomMaterial = bottomArea * bottomPrice

      glassDetails.push({
        name: '底部玻璃',
        size: `${bottomLength}×${bottomWidth}×${bottomThickness}`,
        count: 1,
        area: bottomArea,
        volume: bottomVolume,
        weight: bottomWeight,
        grind: bottomGrind,
        material: bottomMaterial,
        thickness: bottomThickness,
        isSide: false
      })

      totalArea += bottomArea
      totalGrind += bottomGrind
      totalWeight += bottomWeight
      totalMaterial += bottomMaterial

      // 前玻璃（单独计算，可能是半截高度）
      const frontArea = (tankLength * frontHeight) / 1000000
      const frontVolume = frontArea * (sideThickness / 1000)
      const frontWeight = frontVolume * 2500
      const frontGrind = (tankLength + frontHeight) * 2 / 1000
      const frontMaterial = frontArea * sidePrice

      glassDetails.push({
        name: '前玻璃',
        size: `${tankLength}×${frontHeight}×${sideThickness}`,
        count: 1,
        area: frontArea,
        volume: frontVolume,
        weight: frontWeight,
        grind: frontGrind,
        material: frontMaterial,
        thickness: sideThickness,
        isSide: true
      })

      // 后玻璃（使用完整高度）
      const backArea = (tankLength * frontBackHeight) / 1000000
      const backVolume = backArea * (sideThickness / 1000)
      const backWeight = backVolume * 2500
      const backGrind = (tankLength + frontBackHeight) * 2 / 1000
      const backMaterial = backArea * sidePrice

      glassDetails.push({
        name: '后玻璃',
        size: `${tankLength}×${frontBackHeight}×${sideThickness}`,
        count: 1,
        area: backArea,
        volume: backVolume,
        weight: backWeight,
        grind: backGrind,
        material: backMaterial,
        thickness: sideThickness,
        isSide: true
      })

      totalArea += frontArea + backArea
      totalGrind += frontGrind + backGrind
      totalWeight += frontWeight + backWeight
      totalMaterial += frontMaterial + backMaterial

      // 左右玻璃（2块）
      const leftRightArea = (leftRightLength * leftRightHeight) / 1000000
      const leftRightVolume = leftRightArea * (sideThickness / 1000)
      const leftRightWeight = leftRightVolume * 2500
      const leftRightGrind = (leftRightLength + leftRightHeight) * 2 / 1000
      const leftRightMaterial = leftRightArea * sidePrice

      glassDetails.push({
        name: '左玻璃',
        size: `${leftRightLength}×${leftRightHeight}×${sideThickness}`,
        count: 1,
        area: leftRightArea,
        volume: leftRightVolume,
        weight: leftRightWeight,
        grind: leftRightGrind,
        material: leftRightMaterial,
        thickness: sideThickness,
        isSide: true
      })

      glassDetails.push({
        name: '右玻璃',
        size: `${leftRightLength}×${leftRightHeight}×${sideThickness}`,
        count: 1,
        area: leftRightArea,
        volume: leftRightVolume,
        weight: leftRightWeight,
        grind: leftRightGrind,
        material: leftRightMaterial,
        thickness: sideThickness,
        isSide: true
      })

      totalArea += leftRightArea * 2
      totalGrind += leftRightGrind * 2
      totalWeight += leftRightWeight * 2
      totalMaterial += leftRightMaterial * 2

      // 计算胶水费用（单个缸）
      const singleGlueTotal = glueCount * gluePrice

      // 计算磨边总费用（单个缸）
      const singleGrindTotal = totalGrind * grindPrice

      // 计算单个缸总价
      const singleTotal = totalMaterial + singleGrindTotal + singleGlueTotal

      // 根据缸数量计算总费用
      const totalGlassMaterial = totalMaterial * tankCount
      const totalGrindTotal = singleGrindTotal * tankCount
      const totalGlueTotal = singleGlueTotal * tankCount
      const resultTotalWeight = totalWeight * tankCount
      const resultTotalArea = totalArea * tankCount
      const resultTotalGrind = totalGrind * tankCount
      const finalTotal = singleTotal * tankCount

      // 更新结果（包含格式化后的字符串）
      const resultsData = {
        glassMaterial: totalGlassMaterial,
        grindTotal: totalGrindTotal,
        glueTotal: totalGlueTotal,
        total: finalTotal,
        totalWeight: resultTotalWeight,
        totalArea: resultTotalArea,
        totalGrind: resultTotalGrind,
        // 格式化后的字符串，用于WXML显示
        glassMaterialText: totalGlassMaterial.toFixed(2),
        grindTotalText: totalGrindTotal.toFixed(2),
        glueTotalText: totalGlueTotal.toFixed(2),
        totalText: finalTotal.toFixed(2),
        totalWeightText: resultTotalWeight.toFixed(2),
        totalAreaText: resultTotalArea.toFixed(4),
        totalGrindText: resultTotalGrind.toFixed(2)
      }
      
      console.log('计算结果:', resultsData)
      console.log('glassDetails长度:', glassDetails.length)
      
      this.setData({
        glassDetails,
        tankCount: tankCount,
        results: resultsData,
        showResult: true
      })
      
      console.log('setData完成后 results:', this.data.results)
    } catch (error) {
      console.error('calculate 函数执行异常:', error)
      wx.showToast({
        title: '计算失败',
        icon: 'error',
        duration: 2000
      })
    }
  }
})