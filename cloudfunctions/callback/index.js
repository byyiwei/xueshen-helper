/**
 * 微信异步审核结果回调接收云函数
 * 通过云开发控制台"消息推送"功能配置，由微信自动触发
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  配置步骤（在微信开发者工具或云开发控制台中操作）：
 *
 *  1. 打开微信开发者工具 → 点击顶部"云开发"按钮
 *  2. 进入云开发控制台 → 左侧菜单选"设置"
 *  3. 选"其他设置"标签页 → 找到"推送模式"
 *  4. 将推送模式改为"云函数"
 *  5. 点击"添加消息推送"，填写：
 *     - 消息类型：event
 *     - 事件类型：wxa_media_check
 *     - 云函数：callback（即本云函数的名字）
 *  6. 保存即可
 *
 *  配置完成后，微信审核结果会自动推送到本云函数
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * 接收数据格式（微信推送的 event 对象）：
 *   {
 *     "ToUserName": "gh_xxx",
 *     "FromUserName": "o4_xxx",
 *     "CreateTime": 1626959646,
 *     "MsgType": "event",
 *     "Event": "wxa_media_check",
 *     "appid": "wx8fxxx",
 *     "trace_id": "60f96f1d-3845297a-1976a3ae",
 *     "errcode": 0,
 *     "result": { "suggest": "pass", "label": 100 },
 *     "detail": [{ "strategy": "content_model", "suggest": "pass", "label": 100, "prob": 90 }]
 *   }
 */

const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event, context) => {
  console.log('[callback] 收到推送:', JSON.stringify(event))

  try {
    await processCallbackResult(event)
    return { errcode: 0, errmsg: 'ok' }
  } catch (error) {
    console.error('[callback] 处理回调失败:', error)
    return { errcode: -1, errmsg: error.message }
  }
}

/**
 * 处理审核结果
 */
async function processCallbackResult(data) {
  const { trace_id, errcode, result } = data
  const db = cloud.database()
  const _ = db.command

  // 根据 trace_id 查找审核日志
  const logRes = await db.collection('security_logs')
    .where({ traceId: trace_id })
    .limit(1)
    .get()

  if (!logRes.data || logRes.data.length === 0) {
    console.warn('[callback] 未找到对应的审核日志, trace_id:', trace_id)
    return
  }

  const log = logRes.data[0]
  const suggest = result && result.suggest ? result.suggest : (errcode === 0 ? 'pass' : 'risky')
  const label = result && result.label ? result.label : 0
  const isPass = suggest === 'pass'

  // 更新审核日志状态
  await db.collection('security_logs').doc(log._id).update({
    data: {
      status: isPass ? 'passed' : 'failed',
      suggest,
      label,
      errcode,
      processed: true,
      processedTime: db.serverDate()
    }
  }).catch(err => console.error('[callback] 更新审核日志失败:', err))

  // 审核通过，无需额外处理
  if (isPass) {
    console.log('[callback] 审核通过, fileID:', log.fileID)
    return
  }

  // ── 审核不通过 → 清理违规内容 ──
  console.log('[callback] 审核不通过, 开始清理, fileID:', log.fileID)

  // 1. 删除云存储中的图片
  await cloud.deleteFile({ fileList: [log.fileID] }).catch(err => {
    console.error('[callback] 删除云存储文件失败:', err)
  })

  // 2. 从业务数据中移除违规图片引用
  await removePhotoFromBusiness(db, _, log)

  // 3. 创建用户通知
  await createNotification(db, log, suggest, label)
}

/**
 * 从业务数据中移除违规图片引用
 */
async function removePhotoFromBusiness(db, _, log) {
  const { fileID, sceneTag, bizId, openid } = log

  switch (sceneTag) {
    case 'avatar':
      await db.collection('users').where({ openid }).update({
        data: { avatar: '' }
      }).catch(() => {})
      break

    case 'cover':
      await db.collection('users').where({ openid }).update({
        data: { publicCover: '' }
      }).catch(() => {})
      break

    case 'pet':
      if (bizId) {
        const petRes = await db.collection('pets').doc(bizId).get().catch(() => null)
        if (petRes && petRes.data) {
          const photos = (petRes.data.photos || []).filter(p => p !== fileID)
          await db.collection('pets').doc(bizId).update({
            data: { photos, updatedAt: db.serverDate() }
          }).catch(() => {})
        }
      } else {
        const petsRes = await db.collection('pets')
          .where({ openid, photos: _.elemMatch(_.eq(fileID)) })
          .get().catch(() => null)
        if (petsRes && petsRes.data) {
          for (const pet of petsRes.data) {
            const photos = (pet.photos || []).filter(p => p !== fileID)
            await db.collection('pets').doc(pet._id).update({
              data: { photos, updatedAt: db.serverDate() }
            }).catch(() => {})
          }
        }
      }
      break

    case 'footprint':
      if (bizId) {
        const fpRes = await db.collection('footprints').doc(bizId).get().catch(() => null)
        if (fpRes && fpRes.data) {
          const photos = (fpRes.data.photos || []).filter(p => p !== fileID)
          if (photos.length === 0) {
            await db.collection('footprints').doc(bizId).remove().catch(() => {})
          } else {
            await db.collection('footprints').doc(bizId).update({ data: { photos } }).catch(() => {})
          }
        }
      } else {
        const fpRes = await db.collection('footprints')
          .where({ openid, photos: _.elemMatch(_.eq(fileID)) })
          .get().catch(() => null)
        if (fpRes && fpRes.data) {
          for (const fp of fpRes.data) {
            const photos = (fp.photos || []).filter(p => p !== fileID)
            if (photos.length === 0) {
              await db.collection('footprints').doc(fp._id).remove().catch(() => {})
            } else {
              await db.collection('footprints').doc(fp._id).update({ data: { photos } }).catch(() => {})
            }
          }
        }
      }
      break

    default:
      // 兜底：在所有集合中查找
      const petsRes = await db.collection('pets')
        .where({ openid, photos: _.elemMatch(_.eq(fileID)) })
        .get().catch(() => null)
      if (petsRes && petsRes.data) {
        for (const pet of petsRes.data) {
          const photos = (pet.photos || []).filter(p => p !== fileID)
          await db.collection('pets').doc(pet._id).update({
            data: { photos, updatedAt: db.serverDate() }
          }).catch(() => {})
        }
      }
      break
  }
}

/**
 * 创建违规通知记录
 */
async function createNotification(db, log, suggest, label) {
  const labelMap = { 100: '正常', 20001: '时政', 20002: '色情', 20006: '违法犯罪', 21000: '其他' }
  const labelText = labelMap[label] || '违规内容'
  const sceneMap = { avatar: '头像', cover: '分享封面', pet: '宠物照片', footprint: '足迹图片' }
  const sceneText = sceneMap[log.sceneTag] || '图片'

  await db.collection('notifications').add({
    data: {
      openid: log.openid,
      type: 'security_violation',
      title: '图片内容审核不通过',
      content: `您上传的${sceneText}因涉及"${labelText}"，已被系统自动移除。请遵守社区规范，上传合规内容。`,
      traceId: log.traceId,
      fileID: log.fileID,
      scene: log.sceneTag,
      suggest,
      label,
      isRead: false,
      createdAt: db.serverDate()
    }
  }).catch(err => console.error('[callback] 创建通知失败:', err))
}