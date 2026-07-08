-- ============================================================================
-- 养龟档案 v2.0 - MySQL 完整数据库表结构
-- MySQL 8.0 + utf8mb4
-- ============================================================================
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ==================== 用户表 ====================
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `openid` VARCHAR(100) NOT NULL COMMENT '微信OpenID',
  `nickname` VARCHAR(100) DEFAULT '' COMMENT '用户昵称',
  `avatar` VARCHAR(500) DEFAULT '' COMMENT '头像路径',
  `phone` VARCHAR(20) DEFAULT '' COMMENT '手机号',
  `public_specialty` VARCHAR(200) DEFAULT '' COMMENT '公开名片-专长',
  `public_wechat_id` VARCHAR(100) DEFAULT '' COMMENT '公开名片-微信号',
  `public_wechat_public` TINYINT(1) DEFAULT 0 COMMENT '公开名片-微信号是否公开',
  `public_region` VARCHAR(100) DEFAULT '' COMMENT '公开名片-地区',
  `public_tags` JSON DEFAULT NULL COMMENT '公开名片-标签数组',
  `public_intro` TEXT DEFAULT NULL COMMENT '公开名片-简介',
  `public_cover` VARCHAR(500) DEFAULT '' COMMENT '公开名片-封面图',
  `status` VARCHAR(20) DEFAULT '正常' COMMENT '状态: 正常/封禁',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE INDEX `idx_openid` (`openid`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ==================== 管理员表 ====================
DROP TABLE IF EXISTS `admins`;
CREATE TABLE `admins` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `openid` VARCHAR(100) NOT NULL COMMENT '管理员OpenID',
  `name` VARCHAR(100) DEFAULT '' COMMENT '管理员名称',
  `enabled` TINYINT(1) DEFAULT 1 COMMENT '是否启用',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE INDEX `idx_openid` (`openid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员表';

-- 默认管理员
INSERT INTO `admins` (`openid`, `name`, `enabled`) VALUES
('oZ_NI3YwCXVXO5_WfdcljpaJZz44', '管理员', 1);

-- ==================== 宠物表 ====================
DROP TABLE IF EXISTS `pets`;
CREATE TABLE `pets` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `openid` VARCHAR(100) NOT NULL COMMENT '主人OpenID',
  `name` VARCHAR(100) NOT NULL COMMENT '宠物名称',
  `alias` VARCHAR(100) DEFAULT '' COMMENT '别名',
  `category` VARCHAR(50) DEFAULT '无' COMMENT '品种/分类',
  `gender` VARCHAR(10) DEFAULT '未知' COMMENT '性别: 公/母/未知',
  `father_id` INT DEFAULT NULL COMMENT '父亲宠物ID(自引用)',
  `mother_id` INT DEFAULT NULL COMMENT '母亲宠物ID(自引用)',
  `partner_id` INT DEFAULT NULL COMMENT '配对对象宠物ID',
  `partner_name` VARCHAR(100) DEFAULT '' COMMENT '配对对象名称',
  `price` VARCHAR(50) DEFAULT '' COMMENT '价格',
  `status` VARCHAR(20) DEFAULT '正常' COMMENT '状态',
  `is_public` TINYINT(1) DEFAULT 0 COMMENT '是否公开',
  `photos` JSON DEFAULT NULL COMMENT '照片路径数组',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_openid` (`openid`),
  INDEX `idx_category` (`category`),
  INDEX `idx_alias_openid` (`alias`, `openid`),
  INDEX `idx_status` (`status`),
  INDEX `idx_is_public` (`is_public`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='宠物表';

-- ==================== 记录表 ====================
DROP TABLE IF EXISTS `records`;
CREATE TABLE `records` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `pet_id` INT NOT NULL COMMENT '宠物ID',
  `openid` VARCHAR(100) NOT NULL COMMENT '用户OpenID',
  `type` VARCHAR(20) NOT NULL DEFAULT '日常' COMMENT '类型: 日常/产蛋/交配/出苗',
  `text` TEXT DEFAULT NULL COMMENT '文字内容',
  `date` DATE DEFAULT NULL COMMENT '日期',
  `time` TIME DEFAULT NULL COMMENT '时间',
  `photos` JSON DEFAULT NULL COMMENT '照片数组',
  -- 产蛋记录
  `egg_count` INT DEFAULT 0 COMMENT '产蛋数量',
  `fertilized_count` INT DEFAULT 0 COMMENT '受精蛋数量',
  -- 出苗记录
  `hatch_count` INT DEFAULT 0 COMMENT '出苗数量',
  `grade_a_count` INT DEFAULT 0 COMMENT 'A级数量',
  `defect_count` INT DEFAULT 0 COMMENT '缺陷数量',
  -- 交配记录
  `partner_id` INT DEFAULT NULL COMMENT '交配对象宠物ID',
  `partner_name` VARCHAR(100) DEFAULT '' COMMENT '交配对象名称',
  -- QR缓存
  `qr_base64` MEDIUMTEXT DEFAULT NULL COMMENT 'QR码Base64',
  `url_link` VARCHAR(500) DEFAULT '' COMMENT 'URL Link',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_pet_id` (`pet_id`),
  INDEX `idx_openid` (`openid`),
  INDEX `idx_type` (`type`),
  INDEX `idx_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='记录表';

-- ==================== 提醒表 ====================
DROP TABLE IF EXISTS `reminders`;
CREATE TABLE `reminders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `pet_id` INT NOT NULL COMMENT '宠物ID',
  `openid` VARCHAR(100) NOT NULL COMMENT '用户OpenID',
  `type` VARCHAR(50) NOT NULL COMMENT '提醒类型',
  `interval_days` INT NOT NULL DEFAULT 7 COMMENT '间隔天数',
  `last_done` VARCHAR(20) DEFAULT '' COMMENT '上次完成日期',
  `note` VARCHAR(500) DEFAULT '' COMMENT '备注',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_pet_id` (`pet_id`),
  INDEX `idx_openid` (`openid`),
  UNIQUE INDEX `idx_pet_type_openid` (`pet_id`, `type`, `openid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='提醒表';

-- ==================== 足迹表 ====================
DROP TABLE IF EXISTS `footprints`;
CREATE TABLE `footprints` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `openid` VARCHAR(100) NOT NULL COMMENT '用户OpenID',
  `pet_id` INT DEFAULT NULL COMMENT '宠物ID',
  `pet_name` VARCHAR(100) DEFAULT '' COMMENT '宠物名称',
  `type` VARCHAR(20) DEFAULT 'image' COMMENT '类型: image/video',
  `url` VARCHAR(500) DEFAULT '' COMMENT '视频URL',
  `photos` JSON DEFAULT NULL COMMENT '图片数组',
  `thumbnail` VARCHAR(500) DEFAULT '' COMMENT '缩略图',
  `duration` INT DEFAULT 0 COMMENT '视频时长(秒)',
  `action` VARCHAR(100) DEFAULT '' COMMENT '操作动作',
  `date` DATE DEFAULT NULL COMMENT '日期',
  `time` TIME DEFAULT NULL COMMENT '时间',
  `description` TEXT DEFAULT NULL COMMENT '描述',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_openid` (`openid`),
  INDEX `idx_pet_id` (`pet_id`),
  INDEX `idx_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='足迹表';

-- ==================== 分类表 ====================
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `openid` VARCHAR(100) NOT NULL COMMENT '用户OpenID',
  `name` VARCHAR(100) NOT NULL COMMENT '分类名称',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_openid` (`openid`),
  UNIQUE INDEX `idx_openid_name` (`openid`, `name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='分类表';

-- ==================== 系统配置表 ====================
DROP TABLE IF EXISTS `system_config`;
CREATE TABLE `system_config` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `config_key` VARCHAR(100) NOT NULL COMMENT '配置键',
  `config_value` TEXT DEFAULT NULL COMMENT '配置值',
  `updated_by` VARCHAR(100) DEFAULT '' COMMENT '更新人',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE INDEX `idx_config_key` (`config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表';

-- 默认配置
INSERT INTO `system_config` (`config_key`, `config_value`) VALUES
('systemName', '龟上心'),
('version', '2.0.0'),
('maxPetCount', '10'),
('maxFootprintImages', '9'),
('allowRegister', 'true'),
('enablePush', 'false'),
('imageServerUrl', 'http://localhost:3001'),
('imageTimeout', '60000'),
('qcloudSecretId', ''),
('qcloudSecretKey', ''),
('qcloudBucket', ''),
('qcloudRegion', 'ap-guangzhou'),
('asrSecretId', ''),
('asrSecretKey', ''),
('asrRegion', 'ap-guangzhou'),
('wechatAppId', ''),
('wechatAppSecret', '');

-- ==================== 审核日志表 ====================
DROP TABLE IF EXISTS `security_logs`;
CREATE TABLE `security_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `file_id` VARCHAR(500) NOT NULL DEFAULT '' COMMENT '文件标识',
  `scene` INT DEFAULT 1 COMMENT '审核场景值',
  `scene_tag` VARCHAR(50) DEFAULT '' COMMENT '场景标签: avatar/cover/pet/footprint',
  `biz_id` VARCHAR(100) DEFAULT '' COMMENT '业务关联ID',
  `openid` VARCHAR(100) NOT NULL COMMENT '用户OpenID',
  `trace_id` VARCHAR(100) DEFAULT '' COMMENT '微信审核跟踪ID',
  `status` VARCHAR(20) DEFAULT 'pending' COMMENT '状态: pending/passed/failed/timeout',
  `suggest` VARCHAR(20) DEFAULT '' COMMENT '审核建议: pass/review/block',
  `label` INT DEFAULT 0 COMMENT '违规标签',
  `reason` VARCHAR(500) DEFAULT '' COMMENT '失败原因',
  `errcode` INT DEFAULT 0 COMMENT '错误码',
  `processed` TINYINT(1) DEFAULT 0 COMMENT '是否已处理',
  `processed_time` DATETIME DEFAULT NULL COMMENT '处理时间',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_openid` (`openid`),
  INDEX `idx_trace_id` (`trace_id`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='审核日志表';

-- ==================== 通知表 ====================
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `openid` VARCHAR(100) NOT NULL COMMENT '用户OpenID',
  `type` VARCHAR(50) DEFAULT 'security_violation' COMMENT '通知类型',
  `title` VARCHAR(200) DEFAULT '' COMMENT '标题',
  `content` TEXT DEFAULT NULL COMMENT '内容',
  `trace_id` VARCHAR(100) DEFAULT '' COMMENT '关联审核跟踪ID',
  `file_id` VARCHAR(500) DEFAULT '' COMMENT '关联文件',
  `scene` VARCHAR(50) DEFAULT '' COMMENT '业务场景',
  `suggest` VARCHAR(20) DEFAULT '' COMMENT '审核建议',
  `label` INT DEFAULT 0 COMMENT '违规标签',
  `is_read` TINYINT(1) DEFAULT 0 COMMENT '是否已读',
  `read_at` DATETIME DEFAULT NULL COMMENT '阅读时间',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_openid` (`openid`),
  INDEX `idx_is_read` (`is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通知表';

-- ==================== 封禁用户表 ====================
DROP TABLE IF EXISTS `banned_users`;
CREATE TABLE `banned_users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `openid` VARCHAR(100) NOT NULL COMMENT '被禁用户OpenID',
  `reason` VARCHAR(255) DEFAULT '' COMMENT '封禁原因',
  `banned_by` VARCHAR(100) DEFAULT '' COMMENT '操作人',
  `banned_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE INDEX `idx_openid` (`openid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='封禁用户表';

-- ==================== 微信 access_token 缓存表 ====================
DROP TABLE IF EXISTS `wechat_token`;
CREATE TABLE `wechat_token` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `token` VARCHAR(512) NOT NULL COMMENT 'access_token',
  `expires_at` DATETIME NOT NULL COMMENT '过期时间',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='微信access_token缓存';

-- ==================== 药品表 ====================
DROP TABLE IF EXISTS `medicines`;
CREATE TABLE `medicines` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL COMMENT '药品名称',
  `category` VARCHAR(50) NOT NULL DEFAULT '' COMMENT '分类：抗生素/消毒杀菌/驱虫药/维生素/真菌处理/其他',
  `indications` TEXT COMMENT '适应症',
  `form` VARCHAR(50) DEFAULT '' COMMENT '主要剂型描述',
  `notes` TEXT COMMENT '注意事项',
  `usage_dosages` JSON DEFAULT NULL COMMENT '用法用量：[{route,dose,unit,forms[]}]',
  `enabled` TINYINT(1) DEFAULT 1 COMMENT '启用状态',
  `sort_order` INT DEFAULT 0 COMMENT '排序权重',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_category` (`category`),
  INDEX `idx_enabled` (`enabled`),
  INDEX `idx_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='药品表';

-- 初始数据（10种常用龟药）
INSERT INTO `medicines` (`name`, `category`, `indications`, `form`, `notes`, `usage_dosages`, `sort_order`) VALUES
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

-- ==================== 龟缸档案表 ====================
DROP TABLE IF EXISTS `tanks`;
CREATE TABLE `tanks` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL COMMENT '缸名/昵称',
  `size` VARCHAR(100) DEFAULT '' COMMENT '尺寸描述',
  `category` VARCHAR(100) DEFAULT '无' COMMENT '分类',
  `species` VARCHAR(200) DEFAULT '' COMMENT '饲养品种',
  `male_count` INT DEFAULT 0 COMMENT '公龟数',
  `female_count` INT DEFAULT 0 COMMENT '母龟数',
  `notes` TEXT COMMENT '备注',
  `enabled` TINYINT(1) DEFAULT 1,
  `sort_order` INT DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_enabled` (`enabled`),
  INDEX `idx_name` (`name`),
  INDEX `idx_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='龟缸档案表';

DROP TABLE IF EXISTS `tank_water_records`;
CREATE TABLE `tank_water_records` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tank_id` INT NOT NULL,
  `record_date` DATE NOT NULL,
  `water_change` VARCHAR(20) NOT NULL DEFAULT '',
  `notes` VARCHAR(500) DEFAULT '',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_tank_date` (`tank_id`, `record_date` DESC),
  FOREIGN KEY (`tank_id`) REFERENCES `tanks`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='换水记录表';

DROP TABLE IF EXISTS `tank_feeding_records`;
CREATE TABLE `tank_feeding_records` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tank_id` INT NOT NULL,
  `record_date` DATE NOT NULL,
  `food_type` VARCHAR(100) DEFAULT '',
  `amount_g` VARCHAR(50) DEFAULT NULL,
  `additives` VARCHAR(200) DEFAULT '',
  `notes` VARCHAR(500) DEFAULT '',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_tank_date` (`tank_id`, `record_date` DESC),
  FOREIGN KEY (`tank_id`) REFERENCES `tanks`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='喂食记录表';

DROP TABLE IF EXISTS `tank_egg_records`;
CREATE TABLE `tank_egg_records` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tank_id` INT NOT NULL,
  `lay_date` DATE NOT NULL,
  `total_eggs` INT DEFAULT 0,
  `fertilized` INT DEFAULT 0,
  `unfertilized` INT DEFAULT 0,
  `parent_male` VARCHAR(100) DEFAULT '',
  `parent_female` VARCHAR(100) DEFAULT '',
  `notes` VARCHAR(500) DEFAULT '',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_tank_date` (`tank_id`, `lay_date` DESC),
  FOREIGN KEY (`tank_id`) REFERENCES `tanks`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='产蛋记录表';

DROP TABLE IF EXISTS `tank_hatch_records`;
CREATE TABLE `tank_hatch_records` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `egg_record_id` INT NOT NULL,
  `hatch_date` DATE NOT NULL,
  `total_hatched` INT DEFAULT 0,
  `perfect_count` INT DEFAULT 0,
  `imperfect_count` INT DEFAULT 0,
  `notes` VARCHAR(500) DEFAULT '',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_egg` (`egg_record_id`),
  FOREIGN KEY (`egg_record_id`) REFERENCES `tank_egg_records`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='孵化记录表';

DROP TABLE IF EXISTS `tank_reminders`;
CREATE TABLE `tank_reminders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tank_id` INT NOT NULL,
  `type` VARCHAR(20) NOT NULL,
  `interval_days` INT DEFAULT 0,
  `next_remind` DATE DEFAULT NULL,
  `last_remind` DATE DEFAULT NULL,
  `event_name` VARCHAR(100) DEFAULT '',
  `event_date` DATE DEFAULT NULL,
  `enabled` TINYINT(1) DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_tank_type` (`tank_id`, `type`),
  INDEX `idx_next_remind` (`next_remind`),
  FOREIGN KEY (`tank_id`) REFERENCES `tanks`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='龟缸提醒配置表';

SET FOREIGN_KEY_CHECKS = 1;
