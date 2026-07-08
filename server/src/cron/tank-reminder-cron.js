/**
 * 龟缸提醒定时任务
 * 每小时检查一次，到期提醒通过日志输出（后续可对接微信订阅消息推送）
 */

const { query, execute } = require('../services/db')

const CHECK_INTERVAL_MS = 60 * 60 * 1000 // 1 小时

let timer = null

async function checkReminders() {
  try {
    const today = new Date().toISOString().slice(0, 10)

    // 查找到期且启用的提醒
    const dueReminders = await query(
      `SELECT tr.id, tr.tank_id, tr.type, tr.interval_days, tr.next_remind, tr.event_name, tr.event_date,
              t.name AS tank_name
       FROM tank_reminders tr
       JOIN tanks t ON t.id = tr.tank_id
       WHERE tr.enabled = 1
         AND (
           (tr.type IN ('water', 'feed') AND tr.next_remind IS NOT NULL AND tr.next_remind <= ?)
           OR
           (tr.type = 'event' AND tr.event_date IS NOT NULL AND tr.event_date <= ?)
         )`,
      [today, today]
    )

    if (dueReminders.length === 0) return

    console.log(`[TankReminder] 发现 ${dueReminders.length} 条到期提醒`)

    for (const r of dueReminders) {
      const desc = r.type === 'water' ? '换水' : r.type === 'feed' ? '喂食' : (r.event_name || '事件')
      console.log(`[TankReminder] ⏰ 提醒：${r.tank_name} - ${desc}`)

      // 非事件类型：自动计算下一次提醒日期
      if (r.type !== 'event' && r.interval_days > 0) {
        await execute(
          'UPDATE tank_reminders SET last_remind = ?, next_remind = DATE_ADD(?, INTERVAL ? DAY) WHERE id = ?',
          [today, today, r.interval_days, r.id]
        )
      }

      // 事件类型：提醒后禁用（一次性事件）
      if (r.type === 'event') {
        await execute('UPDATE tank_reminders SET enabled = 0 WHERE id = ?', [r.id])
      }

      // TODO: 接入微信订阅消息推送
      // await sendSubscribeMessage(r.tank_id, desc)
    }
  } catch (err) {
    console.error('[TankReminder] 检查提醒失败:', err)
  }
}

function start() {
  console.log('[TankReminder] 定时任务已启动，检查间隔:', CHECK_INTERVAL_MS / 3600000, '小时')
  // 启动时立即检查一次
  checkReminders()
  timer = setInterval(checkReminders, CHECK_INTERVAL_MS)
}

function stop() {
  if (timer) {
    clearInterval(timer)
    timer = null
    console.log('[TankReminder] 定时任务已停止')
  }
}

module.exports = { start, stop, checkReminders }
