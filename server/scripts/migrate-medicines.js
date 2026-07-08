/**
 * 药品表迁移脚本
 * 用法: node scripts/migrate-medicines.js
 */
const mysql = require('mysql2/promise')

const DB_CONFIG = {
  host: '127.0.0.1',
  port: 3306,
  user: 'turtle',
  password: 'Turtle@2024',
  database: 'turtle-records',
  charset: 'utf8mb4'
}

const SQL = `
DROP TABLE IF EXISTS \`medicines\`;
CREATE TABLE \`medicines\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`name\` VARCHAR(100) NOT NULL COMMENT '药品名称',
  \`category\` VARCHAR(50) NOT NULL DEFAULT '' COMMENT '分类',
  \`indications\` TEXT COMMENT '适应症',
  \`form\` VARCHAR(50) DEFAULT '' COMMENT '主要剂型描述',
  \`notes\` TEXT COMMENT '注意事项',
  \`usage_dosages\` JSON DEFAULT NULL COMMENT '用法用量',
  \`enabled\` TINYINT(1) DEFAULT 1 COMMENT '启用状态',
  \`sort_order\` INT DEFAULT 0 COMMENT '排序权重',
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX \`idx_category\` (\`category\`),
  INDEX \`idx_enabled\` (\`enabled\`),
  INDEX \`idx_name\` (\`name\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='药品表';

INSERT INTO \`medicines\` (\`name\`, \`category\`, \`indications\`, \`form\`, \`notes\`, \`usage_dosages\`, \`sort_order\`) VALUES
('阿莫西林', '抗生素', '细菌感染、腐皮、烂甲、肺炎初期', '粉剂', '疗程 5-7 天，用药期间水温保持 28-30℃，药浴后适当补电解多维。', '[{"route":"口服","dose":75,"unit":"mg/kg","forms":["片剂","粉剂"]},{"route":"药浴","dose":15,"unit":"mg/L","forms":["片剂","粉剂"]}]', 1),
('恩诺沙星', '抗生素', '顽固性肠胃炎、呼吸道感染、败血症', '粉剂/口服液', '避免与含钙、镁药物同用，疗程一般 3-5 天。', '[{"route":"口服","dose":7.5,"unit":"mg/kg","forms":["片剂","粉剂"]},{"route":"药浴","dose":3.5,"unit":"mg/L","forms":["粉剂"]},{"route":"注射","dose":5,"unit":"mg/kg","forms":["注射液"]}]', 2),
('甲硝唑', '抗生素', '厌氧菌感染、肠胃炎、口腔炎、鞭毛虫', '片剂/粉剂', '对厌氧菌效果好，用药期间停食或少量喂食。', '[{"route":"口服","dose":37.5,"unit":"mg/kg","forms":["片剂","粉剂"]},{"route":"药浴","dose":7.5,"unit":"mg/L","forms":["片剂","粉剂"]}]', 3),
('聚维酮碘', '消毒杀菌', '外伤消毒、腐皮、烂甲、龟壳表面杀菌', '溶液', '药浴浓度不宜过高，每次 15-30 分钟，每日 1-2 次。', '[{"route":"药浴","dose":1.5,"unit":"ml/L","forms":["注射液"]}]', 4),
('高锰酸钾', '消毒杀菌', '体表消毒、龟缸环境杀菌、腐皮辅助治疗', '晶体', '浓度不可过高，浸泡 10-15 分钟后清水冲洗，避免接触眼睛。', '[{"route":"药浴","dose":7.5,"unit":"mg/L","forms":["粉剂"]}]', 5),
('阿苯达唑', '驱虫药', '体内线虫、绦虫等寄生虫感染', '片剂', '口服给药，每 2 周一次，连用 2-3 次，用药后观察排便。', '[{"route":"口服","dose":37.5,"unit":"mg/kg","forms":["片剂","粉剂"]}]', 6),
('芬苯达唑', '驱虫药', '体内线虫、吸虫等寄生虫', '粉剂', '口服或混入饲料，用药期间停食 24 小时后再喂药。', '[{"route":"口服","dose":75,"unit":"mg/kg","forms":["粉剂"]}]', 7),
('电解多维', '维生素', '应激、病后恢复、食欲低下、补充营养', '粉剂', '可作为日常保健，新龟到家、换环境、病后恢复期使用。', '[{"route":"药浴","dose":0.75,"unit":"g/L","forms":["粉剂"]}]', 8),
('钙粉 + D3', '维生素', '软甲、骨骼发育不良、产卵前后补钙', '粉剂', '配合 UVB 晒背效果更佳，产卵期母龟可适当加量。', '[{"route":"口服","dose":15,"unit":"g/kg","forms":["粉剂"]}]', 9),
('制霉菌素', '真菌处理', '水霉病、真菌感染、白色棉絮状病灶', '片剂', '真菌感染需保持水质清洁，治疗期间适当提高水温。', '[{"route":"口服","dose":7.5,"unit":"万单位/kg","forms":["片剂","粉剂"]},{"route":"药浴","dose":3,"unit":"万单位/L","forms":["片剂","粉剂"]}]', 10),
('亚甲基蓝', '真菌处理', '水霉、白点、体表寄生虫辅助治疗', '溶液', '药浴 20-30 分钟，水体呈淡蓝色即可，避免阳光直射。', '[{"route":"药浴","dose":1.5,"unit":"mg/L","forms":["注射液"]}]', 11),
('葡萄糖', '其他', '体弱、拒食、病后补能、应激缓解', '粉剂', '可与其他药物配合使用，帮助病龟恢复体力。', '[{"route":"药浴","dose":7.5,"unit":"g/L","forms":["粉剂"]}]', 12);
`

async function migrate() {
  let conn
  try {
    conn = await mysql.createConnection(DB_CONFIG)
    console.log('✅ 数据库已连接')

    // 按分号拆分语句执行
    const statements = SQL.split(';').filter(s => s.trim())
    for (const stmt of statements) {
      const trimmed = stmt.trim()
      if (!trimmed) continue
      if (trimmed.startsWith('--')) continue
      try {
        await conn.execute(trimmed)
      } catch (e) {
        console.log('  ⚠ 跳过:', e.message.substring(0, 80))
      }
    }

    // 验证
    const [rows] = await conn.query('SELECT COUNT(*) as cnt FROM medicines')
    console.log(`✅ 迁移完成，共 ${rows[0].cnt} 条药品数据`)
  } catch (err) {
    console.error('❌ 迁移失败:', err.message)
  } finally {
    if (conn) await conn.end()
  }
}

migrate()
