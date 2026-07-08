/**
 * 龟缸模块数据库迁移脚本
 * 用法: node scripts/migrate-tanks.js
 */
const mysql = require('mysql2/promise')
const path = require('path')

// 尝试从 config 读取数据库配置
let dbConfig
try {
  dbConfig = require('../src/config').db
} catch (e) {
  console.error('无法读取 config，使用环境变量')
  dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'turtle_archive'
  }
}

async function migrate() {
  const pool = mysql.createPool(dbConfig)

  try {
    console.log('开始迁移龟缸模块数据库表...')

    // 龟缸档案表
    await pool.execute(`CREATE TABLE IF NOT EXISTS tanks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL COMMENT '缸名/昵称',
      size VARCHAR(100) DEFAULT '' COMMENT '尺寸描述',
      location VARCHAR(200) DEFAULT '' COMMENT '位置区域',
      setup_date DATE DEFAULT NULL COMMENT '建缸日期',
      male_count INT DEFAULT 0 COMMENT '公龟数',
      female_count INT DEFAULT 0 COMMENT '母龟数',
      notes TEXT COMMENT '备注',
      enabled TINYINT(1) DEFAULT 1,
      sort_order INT DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_enabled (enabled),
      INDEX idx_name (name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='龟缸档案表'`)
    console.log('  ✓ tanks')

    // 换水记录表
    await pool.execute(`CREATE TABLE IF NOT EXISTS tank_water_records (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tank_id INT NOT NULL,
      record_date DATE NOT NULL,
      water_change VARCHAR(20) NOT NULL DEFAULT '',
      notes VARCHAR(500) DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_tank_date (tank_id, record_date DESC),
      FOREIGN KEY (tank_id) REFERENCES tanks(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='换水记录表'`)
    console.log('  ✓ tank_water_records')

    // 喂食记录表
    await pool.execute(`CREATE TABLE IF NOT EXISTS tank_feeding_records (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tank_id INT NOT NULL,
      record_date DATE NOT NULL,
      food_type VARCHAR(100) DEFAULT '',
      amount_g DECIMAL(10,2) DEFAULT NULL,
      additives VARCHAR(200) DEFAULT '',
      notes VARCHAR(500) DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_tank_date (tank_id, record_date DESC),
      FOREIGN KEY (tank_id) REFERENCES tanks(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='喂食记录表'`)
    console.log('  ✓ tank_feeding_records')

    // 产蛋记录表
    await pool.execute(`CREATE TABLE IF NOT EXISTS tank_egg_records (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tank_id INT NOT NULL,
      lay_date DATE NOT NULL,
      total_eggs INT DEFAULT 0,
      fertilized INT DEFAULT 0,
      unfertilized INT DEFAULT 0,
      parent_male VARCHAR(100) DEFAULT '',
      parent_female VARCHAR(100) DEFAULT '',
      notes VARCHAR(500) DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_tank_date (tank_id, lay_date DESC),
      FOREIGN KEY (tank_id) REFERENCES tanks(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='产蛋记录表'`)
    console.log('  ✓ tank_egg_records')

    // 孵化记录表
    await pool.execute(`CREATE TABLE IF NOT EXISTS tank_hatch_records (
      id INT AUTO_INCREMENT PRIMARY KEY,
      egg_record_id INT NOT NULL,
      hatch_date DATE NOT NULL,
      total_hatched INT DEFAULT 0,
      perfect_count INT DEFAULT 0,
      imperfect_count INT DEFAULT 0,
      notes VARCHAR(500) DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_egg (egg_record_id),
      FOREIGN KEY (egg_record_id) REFERENCES tank_egg_records(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='孵化记录表'`)
    console.log('  ✓ tank_hatch_records')

    // 提醒配置表
    await pool.execute(`CREATE TABLE IF NOT EXISTS tank_reminders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tank_id INT NOT NULL,
      type VARCHAR(20) NOT NULL,
      interval_days INT DEFAULT 0,
      next_remind DATE DEFAULT NULL,
      last_remind DATE DEFAULT NULL,
      event_name VARCHAR(100) DEFAULT '',
      event_date DATE DEFAULT NULL,
      enabled TINYINT(1) DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_tank_type (tank_id, type),
      INDEX idx_next_remind (next_remind),
      FOREIGN KEY (tank_id) REFERENCES tanks(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='龟缸提醒配置表'`)
    console.log('  ✓ tank_reminders')

    console.log('\n龟缸模块数据库迁移完成!')
  } catch (err) {
    console.error('迁移失败:', err.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

migrate()
