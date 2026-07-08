/**
 * Admin Web 独立后台 - 数据库迁移脚本
 * 用法: cd server && node scripts/migrate-admin.js
 * 特性: 幂等安全，可重复执行
 */
const mysql = require('mysql2/promise')
const path = require('path')

// 复用服务端配置
const config = require('../src/config')

async function migrate() {
  console.log('=== 养龟档案 Admin Web 数据库迁移 ===\n')

  const pool = mysql.createPool(config.db)

  try {
    // 1. 检查并添加 email 字段
    console.log('[1/3] 检查 admins.email 字段...')
    const [columns] = await pool.execute(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'admins' AND COLUMN_NAME = 'email'",
      [config.db.database]
    )

    if (columns.length === 0) {
      await pool.execute(
        "ALTER TABLE admins ADD COLUMN email VARCHAR(100) DEFAULT NULL COMMENT '管理员邮箱' AFTER password"
      )
      console.log('  ✓ admins.email 字段已添加')
    } else {
      console.log('  → admins.email 字段已存在，跳过')
    }

    // 2. 检查并创建 password_reset_tokens 表
    console.log('[2/3] 检查 password_reset_tokens 表...')
    const [tables] = await pool.execute(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'password_reset_tokens'",
      [config.db.database]
    )

    if (tables.length === 0) {
      await pool.execute(`
        CREATE TABLE password_reset_tokens (
          id INT NOT NULL AUTO_INCREMENT,
          admin_id INT NOT NULL COMMENT '管理员ID',
          token VARCHAR(64) NOT NULL COMMENT '重置令牌',
          expires_at DATETIME NOT NULL COMMENT '过期时间',
          used TINYINT(1) DEFAULT 0 COMMENT '是否已使用',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          UNIQUE KEY uk_token (token),
          KEY idx_admin_id (admin_id),
          KEY idx_expires_at (expires_at),
          CONSTRAINT fk_reset_admin FOREIGN KEY (admin_id) REFERENCES admins (id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='密码重置令牌表'
      `)
      console.log('  ✓ password_reset_tokens 表已创建')
    } else {
      console.log('  → password_reset_tokens 表已存在，跳过')
    }

    // 3. 检查默认管理员是否存在
    console.log('[3/3] 检查默认管理员账号...')
    const [admins] = await pool.execute(
      "SELECT id, username, password, email FROM admins WHERE username = 'admin'"
    )

    if (admins.length === 0) {
      // 需要先生成 bcrypt 密码，这里创建一个占位密码 'admin123'
      const bcrypt = require('bcryptjs')
      const hashedPassword = await bcrypt.hash('admin123', 12)

      await pool.execute(
        "INSERT INTO admins (username, password, name, role, enabled, email) VALUES (?, ?, ?, ?, ?, ?)",
        ['admin', hashedPassword, '超级管理员', 'admin', 1, null]
      )
      console.log('  ✓ 默认管理员已创建: admin / admin123')
      console.log('  ⚠️  请立即登录后台修改密码！')
    } else {
      const admin = admins[0]
      if (!admin.password) {
        // 旧管理员有 openid 但没有 password，需要设置初始密码
        const bcrypt = require('bcryptjs')
        const hashedPassword = await bcrypt.hash('admin123', 12)
        await pool.execute('UPDATE admins SET password = ? WHERE id = ?', [hashedPassword, admin.id])
        console.log('  ✓ 管理员 admin 密码已初始化: admin123')
        console.log('  ⚠️  请立即登录后台修改密码！')
      } else {
        console.log('  → 管理员 admin 已存在且有密码，跳过')
      }
    }

    console.log('\n=== 迁移完成 ===')
  } catch (err) {
    console.error('\n❌ 迁移失败:', err.message)
    console.error(err)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

migrate()
