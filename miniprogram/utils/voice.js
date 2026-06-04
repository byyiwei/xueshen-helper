// 语音输入工具
const { showError, showLoading, hideLoading } = require('./error.js')

class VoiceInputManager {
  constructor() {
    this.recorderManager = null
    this.voiceTimeout = null
    this.isRecording = false
    this.currentField = ''
  }

  /**
   * 开始录音
   * @param {string} field - 当前输入字段
   * @param {Function} onResult - 识别结果回调
   */
  startRecording(field, onResult) {
    if (this.isRecording) {
      console.warn('正在录音中...')
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
   * 停止录音
   */
  stopRecording() {
    if (!this.isRecording || !this.recorderManager) {
      return
    }

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
      this.isRecording = false
      this._clearTimeout()

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
        console.log('录音时间太短，等待 onStop 结果')
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
   * 识别语音
   * @param {string} tempFilePath 
   * @returns {Promise<string>}
   */
  async _recognizeVoice(tempFilePath) {
    try {
      const cloudPath = 'voice/' + Date.now() + '_' + Math.random().toString(36).slice(2) + '.mp3'
      const uploadResult = await wx.cloud.uploadFile({
        cloudPath: cloudPath,
        filePath: tempFilePath
      })

      const result = await wx.cloud.callFunction({
        name: 'speech',
        data: {
          action: 'recognize',
          data: {
            fileID: uploadResult.fileID
          }
        }
      })

      if (result.result && result.result.success && result.result.data.text) {
        return result.result.data.text
      }
      
      throw new Error(result.result?.message || '识别失败')
    } catch (error) {
      console.error('语音识别失败:', error)
      throw error
    }
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
