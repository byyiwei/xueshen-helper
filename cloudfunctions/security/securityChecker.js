const cloud = require('wx-server-sdk')

/**
 * 内容审核场景映射
 * 1: 资料（头像、昵称等）
 * 2: 评论
 * 3: 论坛
 * 4: 社交日志（足迹动态）
 */
const SCENE_MAP = {
  avatar: 1,
  cover: 1,
  pet: 1,
  footprint: 4,
  comment: 2,
  nickname: 1
}

/**
 * 检测结果标签映射
 */
const LABEL_MAP = {
  100: '正常',
  20001: '时政',
  20002: '色情',
  20006: '违法犯罪',
  21000: '其他'
}

class SecurityChecker {
  constructor() {
    this._db = null
  }

  /** 获取数据库实例 */
  get db() {
    if (!this._db) {
      this._db = cloud.database()
    }
    return this._db
  }

  /** 数字场景值 */
  _getSceneValue(scene) {
    return SCENE_MAP[scene] || 1
  }

  /**
   * 将 cloud:// fileID 转为临时 HTTP URL
   */
  async getTempFileURL(fileID) {
    try {
      const result = await cloud.getTempFileURL({
        fileList: [fileID]
      })
      if (result.fileList && result.fileList.length > 0) {
        return result.fileList[0].tempFileURL
      }
      return null
    } catch (error) {
      console.error('[SecurityChecker] 获取临时文件URL失败:', error)
      return null
    }
  }

  /**
   * 图片安全审核（异步）
   * 调用 security.mediaCheckAsync 接口
   */
  async checkMedia(mediaUrl, openid, scene = 1) {
    if (!mediaUrl) {
      return { pass: false, reason: '缺少媒体文件URL' }
    }

    const sceneValue = typeof scene === 'number' ? scene : this._getSceneValue(scene)

    try {
      const result = await cloud.openapi.security.mediaCheckAsync({
        media_url: mediaUrl,
        media_type: 2,
        openid,
        scene: sceneValue,
        version: 2
      })

      if (result.errcode !== 0) {
        console.error('[SecurityChecker] mediaCheckAsync 调用失败:', result)
        return { pass: false, reason: `审核接口错误: ${result.errmsg || '未知错误'}`, errcode: result.errcode }
      }

      return {
        pass: true,
        trace_id: result.trace_id,
        suggest: 'pending',
        message: '已提交审核，结果将通过异步回调返回'
      }
    } catch (error) {
      console.error('[SecurityChecker] 图片审核异常:', error)
      return { pass: false, reason: `审核服务异常: ${error.message}` }
    }
  }

  /**
   * 文本内容安全审核
   * 调用 security.msgSecCheck 接口
   */
  async checkText(content, openid, scene = 2) {
    if (!content || typeof content !== 'string') {
      return { pass: false, reason: '缺少待检测文本' }
    }

    const sceneValue = typeof scene === 'number' ? scene : this._getSceneValue(scene)

    try {
      const result = await cloud.openapi.security.msgSecCheck({
        content,
        version: 2,
        scene: sceneValue,
        openid
      })

      if (result.errcode !== 0) {
        console.error('[SecurityChecker] msgSecCheck 调用失败:', result)
        return { pass: false, reason: `文本审核接口错误: ${result.errmsg || '未知错误'}`, errcode: result.errcode }
      }

      const checkResult = result.result || {}
      const suggest = checkResult.suggest || 'pass'
      const label = checkResult.label || 100

      return {
        pass: suggest === 'pass',
        suggest,
        label: LABEL_MAP[label] || label,
        labelCode: label
      }
    } catch (error) {
      console.error('[SecurityChecker] 文本审核异常:', error)
      return { pass: false, reason: `文本审核服务异常: ${error.message}` }
    }
  }

  /**
   * 对已上传到云存储的图片进行审核
   * 自动完成 fileID->URL 转换 + 调用审核
   */
  async checkFile(fileID, openid, scene = 1) {
    if (!fileID || !fileID.startsWith('cloud://')) {
      return { pass: false, reason: '无效的云存储文件ID' }
    }

    const mediaUrl = await this.getTempFileURL(fileID)
    if (!mediaUrl) {
      return { pass: false, reason: '无法获取文件临时访问URL' }
    }

    return await this.checkMedia(mediaUrl, openid, scene)
  }

  /**
   * 审核并记录日志到数据库
   */
  async checkAndLog(fileID, openid, scene = 1, bizId = '') {
    if (!fileID) {
      return { pass: false, reason: '缺少文件ID' }
    }

    const checkResult = await this.checkFile(fileID, openid, scene)

    // 记录审核日志
    try {
      await this.db.collection('security_logs').add({
        data: {
          fileID,
          scene: typeof scene === 'number' ? scene : this._getSceneValue(scene),
          sceneTag: typeof scene === 'string' ? scene : '',
          bizId,
          openid,
          traceId: checkResult.trace_id || '',
          status: checkResult.pass ? 'pending' : 'failed',
          reason: checkResult.reason || '',
          createTime: this.db.serverDate()
        }
      })
    } catch (err) {
      console.error('[SecurityChecker] 写入审核日志失败:', err)
    }

    return checkResult
  }
}

// 导出单例
let instance = null

function getSecurityChecker() {
  if (!instance) {
    instance = new SecurityChecker()
  }
  return instance
}

module.exports = {
  SecurityChecker,
  getSecurityChecker
}