// 语音输入工具
const { showError, showLoading, hideLoading } = require('./error.js')

class VoiceInputManager {
  constructor() {
    this.recorderManager = null
    this.voiceTimeout = null
    this.isRecording = false
    this.isCancelling = false
    this.currentField = ''
  }

  /**
   * 开始录音
   * @param {string} field - 当前输入字段
   * @param {Function} onResult - 识别结果回调
   */
  startRecording(field, onResult) {
    if (this.isRecording) {

      return
    }

    this.currentField = field
    this.isRecording = true

    wx.showToast({
      title: '正在录音...',
      icon: 'none',
      duration: 15000
    })

    if (!this.recorderManager) {
      this.recorderManager = wx.getRecorderManager()
      this._setupListeners(onResult)
    }

    this._startTimeout()

    this.recorderManager.start({
      duration: 15000,
      sampleRate: 16000,
      numberOfChannels: 1,
      encodeBitRate: 48000,
      format: 'mp3'
    })
  }

  /**
   * 停止录音（正常完成，触发识别）
   */
  stopRecording() {
    if (!this.isRecording || !this.recorderManager) {
      return
    }
    this.isCancelling = false
    this._clearTimeout()
    this.recorderManager.stop()
  }

  /**
   * 取消录音（丢弃结果，不触发识别）
   */
  cancelRecording() {
    if (!this.isRecording || !this.recorderManager) return
    this.isCancelling = true
    this._clearTimeout()
    this.recorderManager.stop()
  }

  /**
   * 设置监听器
   * @param {Function} onResult 
   */
  _setupListeners(onResult) {
    this.recorderManager.onStop(async (res) => {
      wx.hideToast()
      const wasCancelling = this.isCancelling
      this.isRecording = false
      this.isCancelling = false
      this._clearTimeout()

      // 取消模式：丢弃录音，不触发识别
      if (wasCancelling) {
        return
      }

      const tempFilePath = res.tempFilePath
      if (!tempFilePath) {
        return
      }

      showLoading('识别中...')

      try {
        const recognizedText = await this._recognizeVoice(tempFilePath)
        hideLoading()

        if (recognizedText && onResult) {
          onResult(this.currentField, recognizedText)
        }
      } catch (error) {
        hideLoading()
        showError(error, '语音识别失败')
      }
    })

    this.recorderManager.onError((err) => {
      // 忽略短录音的错误，让 onStop 处理结果
      if (err && err.errMsg && err.errMsg.includes('timeout')) {

        return
      }
      wx.hideToast()
      this.isRecording = false
      this._clearTimeout()
      console.error('录音错误:', err)
      showError('录音失败，请重试')
    })
  }

  /**
   * 开始超时计时
   */
  _startTimeout() {
    this.voiceTimeout = setTimeout(() => {
      if (this.isRecording && this.recorderManager) {
        this.recorderManager.stop()
        wx.showToast({ title: '录音超时', icon: 'none' })
      }
    }, 15000)
  }

  /**
   * 清除超时计时
   */
  _clearTimeout() {
    if (this.voiceTimeout) {
      clearTimeout(this.voiceTimeout)
      this.voiceTimeout = null
    }
  }

  /**
   * 识别语音（自建服务器 — base64 直传）
   * @param {string} tempFilePath 
   * @returns {Promise<string>}
   */
  async _recognizeVoice(tempFilePath) {
    return new Promise((resolve, reject) => {
      // 读取录音文件为 base64
      const fs = wx.getFileSystemManager()
      fs.readFile({
        filePath: tempFilePath,
        encoding: 'base64',
        success: async (readRes) => {
          try {
            const app = getApp()
            const config = app?.globalData?.systemConfig || {}
            const baseUrl = config.apiUrl || config.imageServerUrl || 'https://pets.openget.cn'
            const token = wx.getStorageSync('token') || ''

            wx.request({
              url: baseUrl + '/api/speech/recognize',
              method: 'POST',
              header: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
              },
              data: { audioBase64: readRes.data },
              success: (res) => {
                if (res.statusCode === 200 && res.data && res.data.success && res.data.data && res.data.data.text) {
                  resolve(res.data.data.text)
                } else {
                  reject(new Error(res.data?.message || '识别失败'))
                }
              },
              fail: (err) => reject(new Error(err.errMsg || '网络异常'))
            })
          } catch (err) {
            reject(err)
          }
        },
        fail: (err) => reject(new Error('读取音频文件失败'))
      })
    })
  }
}

// 导出单例
let instance = null

function getVoiceManager() {
  if (!instance) {
    instance = new VoiceInputManager()
  }
  return instance
}

module.exports = {
  VoiceInputManager,
  getVoiceManager
}
