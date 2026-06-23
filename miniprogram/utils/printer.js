/**
 * 蓝牙打印机管理工具类
 * 封装德佟P1打印机的通用逻辑，避免在多个页面中重复代码
 */
class PrinterManager {
  constructor() {
    this.lpapi = null
  }

  /**
   * 初始化打印机SDK
   * @param {Object} options - 配置选项
   * @param {number} options.showLog - 日志级别
   */
  init(options = {}) {
    if (!this.lpapi) {
      const LPAPIFactory = require('./lpapi.js')
      this.lpapi = LPAPIFactory.getInstance(options)
    }
    return this.lpapi
  }

  /**
   * 获取打印机SDK实例
   */
  getAPI() {
    return this.lpapi
  }

  /**
   * 加载打印机配置（从本地存储）
   */
  loadPrinterConfig() {
    try {
      const savedConfig = wx.getStorageSync('printerConfig')
      if (savedConfig) {
        // 恢复配置但标记为未连接（BLE 连接不会跨会话保持）
        savedConfig.connected = false
        savedConfig.enabled = false
        return savedConfig
      }
    } catch (error) {
      console.error('加载打印机配置失败:', error)
    }
    return {
      enabled: false,
      autoPrint: false,
      autoConnect: false,
      connected: false,
      deviceId: '',
      deviceName: '',
      connectFailCount: 0,
      qrPrintTypes: {}
    }
  }

  /**
   * 保存打印机配置到本地存储
   * @param {Object} config - 打印机配置
   */
  savePrinterConfig(config) {
    try {
      wx.setStorageSync('printerConfig', config)
    } catch (error) {
      console.error('保存打印机配置失败:', error)
    }
  }

  /**
   * 扫描蓝牙设备
   * @param {Object} options - 扫描选项
   * @param {Function} options.onDeviceFound - 发现设备的回调
   * @param {Function} options.onStateChange - 状态变化的回调
   */
  scanBluetooth(options = {}) {
    if (!this.lpapi) {
      console.error('打印机SDK未初始化')
      return
    }

    const { onDeviceFound, onStateChange } = options

    this.lpapi.startBleDiscovery({
      timeout: 0,
      deviceFound: function (devices) {
        if (devices && devices.length > 0 && onDeviceFound) {
          onDeviceFound(devices)
        }
      },
      adapterStateChange: function (res) {
        if (onStateChange) {
          onStateChange(res)
        }
      }
    })
  }

  /**
   * 停止扫描蓝牙设备
   */
  stopScan() {
    if (this.lpapi) {
      this.lpapi.stopBleDiscovery()
    }
  }

  /**
   * 连接蓝牙打印机
   * @param {Object} device - 设备信息
   * @param {string} device.deviceId - 设备ID
   * @param {string} device.deviceName - 设备名称
   * @param {Function} options.onSuccess - 成功回调
   * @param {Function} options.onFail - 失败回调
   */
  connectBluetooth(device, options = {}) {
    if (!this.lpapi) {
      console.error('打印机SDK未初始化')
      return
    }

    const { deviceId, deviceName } = device
    const { onSuccess, onFail } = options

    wx.showLoading({ title: '连接中...' })
    this.stopScan()

    this.lpapi.openPrinter({
      name: deviceName,
      deviceId: deviceId,
      success: () => {
        wx.hideLoading()
        if (onSuccess) onSuccess(deviceId, deviceName)
      },
      fail: (resp) => {
        wx.hideLoading()
        console.error('连接失败:', resp)
        if (onFail) onFail(resp)
        else wx.showToast({ title: '连接失败', icon: 'none' })
      }
    })
  }

  /**
   * 断开打印机连接
   * @param {Function} options.onSuccess - 成功回调
   */
  disconnectPrinter(options = {}) {
    if (!this.lpapi) {
      console.error('打印机SDK未初始化')
      return
    }

    wx.showModal({
      title: '提示',
      content: '确定要断开打印机连接吗？',
      success: (res) => {
        if (res.confirm) {
          this.lpapi.closePrinter()
          if (options.onSuccess) options.onSuccess()
          wx.showToast({ title: '已断开连接', icon: 'success' })
        }
      }
    })
  }

  /**
   * 自动连接打印机
   * @param {Object} config - 打印机配置
   * @param {Function} options.onSuccess - 成功回调
   * @param {Function} options.onFail - 失败回调
   */
  tryAutoConnect(config, options = {}) {
    if (!this.lpapi) {
      console.error('打印机SDK未初始化')
      return
    }

    if (!config.autoConnect || !config.deviceId) return
    if (config.connected) return
    if (config.connectFailCount >= 3) return

    const { onSuccess, onFail } = options

    wx.openBluetoothAdapter({
      success: () => {
        this._doAutoConnect(config, { onSuccess, onFail })
      },
      fail: (err) => {
        console.error('[autoConnect] 蓝牙适配器初始化失败:', err)
        const newCount = (config.connectFailCount || 0) + 1
        if (onFail) onFail(newCount)
      }
    })
  }

  /**
   * 执行自动连接
   * @private
   */
  _doAutoConnect(config, options = {}) {
    const { onSuccess, onFail } = options

    this.lpapi.openPrinter({
      name: config.deviceName,
      deviceId: config.deviceId,
      success: () => {
        if (onSuccess) onSuccess()
      },
      fail: (resp) => {
        console.error('[autoConnect] 自动连接失败:', resp)
        const newCount = (config.connectFailCount || 0) + 1
        if (onFail) onFail(newCount)
      }
    })
  }

  /**
   * 打印标签（40×20mm：左侧二维码 + 右侧宠物名/类型内容/时间）
   * @param {Object} options - 打印选项
   * @param {string} options.urlLink - 二维码链接
   * @param {Object} options.pet - 宠物信息
   * @param {Object} options.record - 记录信息
   * @param {string} options.typeKey - 记录类型键
   * @param {Object} options.printerConfig - 打印机配置
   * @param {Function} options.onSuccess - 成功回调
   * @param {Function} options.onFail - 失败回调
   */
  printLabel(options = {}) {
    if (!this.lpapi) {
      console.error('打印机SDK未初始化')
      return
    }

    const { urlLink, pet = {}, record = {}, typeKey, printerConfig, onSuccess, onFail } = options

    if (!printerConfig.enabled || !printerConfig.connected) {
      if (onFail) onFail('打印机未启用或未连接')
      return
    }

    wx.showLoading({ title: '打印中...' })

    try {
      const result = this.lpapi.startJob({ width: 40, height: 20, jobName: 'label', gapType: 2 })
      if (!result) {
        wx.hideLoading()
        if (onFail) onFail('创建打印任务失败')
        return
      }

      // 智能截断：优先显示别名，过长时只显示别名
      let nameLine = pet.alias || pet.name || ''
      if (nameLine.length > 6) nameLine = nameLine.substring(0, 6)

      const typeLine = record.type || ''
      const timeLine = (record.date || '') + ' ' + (record.time || '')

      // 根据配置判断是否打印二维码
      const qrPrintTypes = printerConfig.qrPrintTypes || {}
      const shouldPrintQr = typeKey ? (qrPrintTypes[typeKey] !== false) : true

      if (urlLink && shouldPrintQr) {
        this.lpapi.draw2DQRCode({ text: urlLink, x: 1, y: 2, width: 16 })
      }

      // 右侧文字内容
      this.lpapi.drawText({ text: nameLine, x: 18, y: 2, fontSize: 4, bold: true })
      this.lpapi.drawText({ text: typeLine, x: 18, y: 8, fontSize: 3 })
      this.lpapi.drawText({ text: timeLine, x: 18, y: 13, fontSize: 2.5 })

      this.lpapi.commitJob().then(res => {
        wx.hideLoading()
        if (res.statusCode === 0) {
          if (onSuccess) onSuccess()
        } else {
          if (onFail) onFail('打印失败')
        }
      }).catch(() => {
        wx.hideLoading()
        if (onFail) onFail('打印失败')
      })
    } catch (err) {
      wx.hideLoading()
      console.error('打印异常:', err)
      if (onFail) onFail('打印失败')
    }
  }

  /**
   * 清理资源
   */
  cleanup() {
    if (this.lpapi) {
      this.lpapi.stopBleDiscovery()
      this.lpapi.closePrinter()
    }
  }
}

// 导出单例
let instance = null

function getPrinterManager() {
  if (!instance) {
    instance = new PrinterManager()
  }
  return instance
}

module.exports = {
  PrinterManager,
  getPrinterManager
}
