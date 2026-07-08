/**
 * Callback 路由 - 接收微信审核异步回调
 * 对应原 callback 云函数
 * 微信审核结果回调 URL 需配置为: https://your-domain.com/api/callback/security
 */
const express = require('express')
const router = express.Router()
const { getOne, insert, execute, query } = require('../services/db')
const { success, error } = require('../utils/response')

/** POST /api/callback/security - 微信审核回调 */
router.post('/security', async (req, res) => {
  try {
    const { trace_id, errcode, result, ToUserName } = req.body
    console.log('[Callback] 收到审核回调:', JSON.stringify(req.body))

    if (!trace_id) {
      // 可能是微信服务器验证请求
      return res.json({ errcode: 0, errmsg: 'ok' })
    }

    // 查找审核日志
    const log = await getOne('SELECT * FROM security_logs WHERE trace_id = ? LIMIT 1', [trace_id])
    if (!log) {
      console.warn('[Callback] 未找到审核日志, trace_id:', trace_id)
      return res.json({ errcode: 0, errmsg: 'ok' })
    }

    const suggest = result?.suggest || (errcode === 0 ? 'pass' : 'risky')
    const label = result?.label || 0
    const isPass = suggest === 'pass'

    // 更新审核日志
    await execute(
      'UPDATE security_logs SET status = ?, suggest = ?, label = ?, errcode = ?, processed = 1, processed_time = NOW() WHERE id = ?',
      [isPass ? 'passed' : 'failed', suggest, label, errcode || 0, log.id]
    )

    if (isPass) {
      console.log('[Callback] 审核通过, file:', log.file_id)
      return res.json({ errcode: 0, errmsg: 'ok' })
    }

    // 审核不通过 → 清理业务数据
    console.log('[Callback] 审核不通过, 清理文件:', log.file_id)
    await removePhotoFromBusiness(log)

    // 创建违规通知
    await createViolationNotification(log, suggest, label)

    return res.json({ errcode: 0, errmsg: 'ok' })
  } catch (err) {
    console.error('[Callback] 处理失败:', err)
    return res.json({ errcode: -1, errmsg: err.message })
  }
})

/** 从业务数据中移除违规图片 */
async function removePhotoFromBusiness(log) {
  const { file_id, scene_tag, biz_id, openid } = log

  switch (scene_tag) {
    case 'avatar':
      await execute('UPDATE users SET avatar = ? WHERE openid = ?', ['', openid]).catch(() => {})
      break
    case 'cover':
      await execute('UPDATE users SET public_cover = ? WHERE openid = ?', ['', openid]).catch(() => {})
      break
    case 'pet':
      if (biz_id) {
        const pet = await getOne('SELECT photos FROM pets WHERE id = ?', [biz_id]).catch(() => null)
        if (pet) {
          const photos = parseJson(pet.photos).filter(p => p !== file_id)
          await execute('UPDATE pets SET photos = ?, updated_at = NOW() WHERE id = ?', [JSON.stringify(photos), biz_id]).catch(() => {})
        }
      } else {
        // 遍历该用户所有宠物
        const pets = await query('SELECT id, photos FROM pets WHERE openid = ?', [openid]).catch(() => [])
        for (const p of pets) {
          const photos = parseJson(p.photos).filter(ph => ph !== file_id)
          await execute('UPDATE pets SET photos = ?, updated_at = NOW() WHERE id = ?', [JSON.stringify(photos), p.id]).catch(() => {})
        }
      }
      break
    case 'footprint':
      if (biz_id) {
        const fp = await getOne('SELECT photos FROM footprints WHERE id = ?', [biz_id]).catch(() => null)
        if (fp) {
          const photos = parseJson(fp.photos).filter(p => p !== file_id)
          if (photos.length === 0) {
            await execute('DELETE FROM footprints WHERE id = ?', [biz_id]).catch(() => {})
          } else {
            await execute('UPDATE footprints SET photos = ? WHERE id = ?', [JSON.stringify(photos), biz_id]).catch(() => {})
          }
        }
      }
      break
    default:
      // 兜底：在所有宠物中查找
      const pets = await query('SELECT id, photos FROM pets WHERE openid = ?', [openid]).catch(() => [])
      for (const p of pets) {
        const photos = parseJson(p.photos).filter(ph => ph !== file_id)
        await execute('UPDATE pets SET photos = ?, updated_at = NOW() WHERE id = ?', [JSON.stringify(photos), p.id]).catch(() => {})
      }
      break
  }
}

/** 创建违规通知 */
async function createViolationNotification(log, suggest, label) {
  const labelMap = { 100: '正常', 20001: '时政', 20002: '色情', 20006: '违法犯罪', 21000: '其他' }
  const labelText = labelMap[label] || '违规内容'
  const sceneMap = { avatar: '头像', cover: '分享封面', pet: '宠物照片', footprint: '足迹图片' }
  const sceneText = sceneMap[log.scene_tag] || '图片'

  await insert(
    `INSERT INTO notifications (openid, type, title, content, trace_id, file_id, scene, suggest, label, is_read, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NOW())`,
    [
      log.openid, 'security_violation', '图片内容审核不通过',
      `您上传的${sceneText}因涉及"${labelText}"，已被系统自动移除。请遵守社区规范，上传合规内容。`,
      log.trace_id, log.file_id, log.scene_tag, suggest, label
    ]
  ).catch(err => console.error('[Callback] 创建通知失败:', err))
}

function parseJson(val) {
  if (!val) return []
  if (Array.isArray(val)) return val
  try { return JSON.parse(val) } catch (_) { return [] }
}

module.exports = router
