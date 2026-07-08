-- ============================================
-- 养龟档案 v2.0 - MySQL 数据库完整表结构
-- 适用: MySQL 8.0 / MariaDB 10.5+
-- 执行: mysql -u turtle-records -p turtle-records < database.sql
-- ============================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- 1. 用户表
-- ============================================
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `openid` varchar(100) NOT NULL COMMENT '微信OpenID',
  `nickname` varchar(100) DEFAULT '' COMMENT '用户昵称',
  `avatar` varchar(500) DEFAULT '' COMMENT '用户头像',
  `phone` varchar(20) DEFAULT '' COMMENT '手机号',
  `status` varchar(20) DEFAULT '正常' COMMENT '状态: 正常/封禁',
  -- 公开名片字段
  `public_specialty` varchar(200) DEFAULT '' COMMENT '擅长领域',
  `public_wechat_id` varchar(100) DEFAULT '' COMMENT '微信号',
  `public_wechat_public` tinyint(1) DEFAULT 0 COMMENT '是否公开微信号',
  `public_region` varchar(100) DEFAULT '' COMMENT '所在地区',
  `public_tags` json DEFAULT NULL COMMENT '标签数组',
  `public_intro` text DEFAULT NULL COMMENT '个人简介',
  `public_cover` varchar(500) DEFAULT '' COMMENT '封面图片',
  `last_login_time` datetime DEFAULT NULL COMMENT '最后登录时间',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_openid` (`openid`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ============================================
-- 2. 管理员表（支持两种模式：微信openid关联 / 独立账号密码）
-- ============================================
DROP TABLE IF EXISTS `admins`;
CREATE TABLE `admins` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `openid` varchar(100) DEFAULT NULL COMMENT '关联微信OpenID（通过小程序登录自动识别）',
  `username` varchar(50) DEFAULT NULL COMMENT '管理员用户名（web后台登录用）',
  `password` varchar(255) DEFAULT NULL COMMENT '密码(bcrypt加密，web后台用)',
  `name` varchar(100) DEFAULT NULL COMMENT '管理员显示名称',
  `role` varchar(20) DEFAULT 'admin' COMMENT '角色: admin/super',
  `enabled` tinyint(1) DEFAULT 1 COMMENT '是否启用',
  `last_login_time` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_openid` (`openid`),
  UNIQUE KEY `uk_username` (`username`),
  KEY `idx_enabled` (`enabled`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员表';

-- 默认管理员（web后台: admin / admin123，请在部署后立即修改）
-- 密码: $2b$10$... 需用 bcrypt 生成，此处为占位符，实际部署时替换
INSERT INTO `admins` (`username`, `password`, `name`, `enabled`) VALUES
('admin', '$2b$10$placeholder_change_me', '超级管理员', 1);

-- ============================================
-- 3. 宠物表
-- ============================================
DROP TABLE IF EXISTS `pets`;
CREATE TABLE `pets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `openid` varchar(100) NOT NULL COMMENT '主人OpenID',
  `name` varchar(100) NOT NULL COMMENT '宠物名称',
  `alias` varchar(100) DEFAULT NULL COMMENT '别名（唯一）',
  `category` varchar(50) DEFAULT '无' COMMENT '品种/分类',
  `gender` varchar(10) DEFAULT '未知' COMMENT '性别: 公/母/未知',
  `birth_date` date DEFAULT NULL COMMENT '出生日期',
  `avatar` varchar(500) DEFAULT NULL COMMENT '宠物头像',
  `photos` json DEFAULT NULL COMMENT '相册(数组)',
  `father_id` int(11) DEFAULT NULL COMMENT '父亲ID',
  `mother_id` int(11) DEFAULT NULL COMMENT '母亲ID',
  `father_alias` varchar(100) DEFAULT NULL COMMENT '父亲别名',
  `mother_alias` varchar(100) DEFAULT NULL COMMENT '母亲别名',
  `partner_id` int(11) DEFAULT NULL COMMENT '配偶ID',
  `partner_name` varchar(100) DEFAULT '' COMMENT '配偶名称',
  `price` varchar(50) DEFAULT '' COMMENT '价格',
  `status` varchar(20) DEFAULT '正常' COMMENT '状态: 正常/已售/死亡',
  `is_public` tinyint(1) DEFAULT 0 COMMENT '是否公开档案',
  `remark` text DEFAULT NULL COMMENT '备注',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_openid_alias` (`openid`, `alias`),
  KEY `idx_openid` (`openid`),
  KEY `idx_category` (`category`),
  KEY `idx_is_public` (`is_public`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_father_id` (`father_id`),
  KEY `idx_mother_id` (`mother_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='宠物表';

-- ============================================
-- 4. 记录表
-- ============================================
DROP TABLE IF EXISTS `records`;
CREATE TABLE `records` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `openid` varchar(100) NOT NULL COMMENT '用户OpenID',
  `pet_id` int(11) NOT NULL COMMENT '宠物ID',
  `type` varchar(50) NOT NULL COMMENT '类型: 产蛋/交配/喂食/日常等',
  `text` text DEFAULT NULL COMMENT '记录文本内容',
  `date` date DEFAULT NULL COMMENT '记录日期',
  `time` time DEFAULT NULL COMMENT '记录时间',
  `photos` json DEFAULT NULL COMMENT '图片列表',
  -- 产蛋相关
  `egg_count` int(11) DEFAULT 0 COMMENT '产蛋数量',
  `fertilized_count` int(11) DEFAULT 0 COMMENT '受精数量',
  `hatch_count` int(11) DEFAULT 0 COMMENT '孵化数量',
  `grade_a_count` int(11) DEFAULT 0 COMMENT '精品数量',
  `defect_count` int(11) DEFAULT 0 COMMENT '瑕疵数量',
  -- 交配相关
  `partner_id` int(11) DEFAULT NULL COMMENT '配偶ID',
  `partner_name` varchar(100) DEFAULT '' COMMENT '配偶名称',
  -- 其他
  `weight` decimal(10,2) DEFAULT NULL COMMENT '体重(g)',
  `temperature` decimal(5,2) DEFAULT NULL COMMENT '温度(℃)',
  `humidity` decimal(5,2) DEFAULT NULL COMMENT '湿度(%)',
  `food` varchar(200) DEFAULT NULL COMMENT '食物',
  `quantity` varchar(100) DEFAULT NULL COMMENT '食量',
  `health_status` varchar(50) DEFAULT NULL COMMENT '健康状况',
  `medicine` varchar(200) DEFAULT NULL COMMENT '用药',
  `notes` text DEFAULT NULL COMMENT '备注',
  -- QR码缓存
  `qr_base64` mediumtext DEFAULT NULL COMMENT '小程序码Base64',
  `url_link` varchar(500) DEFAULT NULL COMMENT 'URL Link',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_openid_pet` (`openid`, `pet_id`),
  KEY `idx_pet_type` (`pet_id`, `type`),
  KEY `idx_date` (`date`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='记录表';

-- ============================================
-- 5. 足迹表
-- ============================================
DROP TABLE IF EXISTS `footprints`;
CREATE TABLE `footprints` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `openid` varchar(100) NOT NULL COMMENT '用户OpenID',
  `pet_id` int(11) DEFAULT NULL COMMENT '宠物ID',
  `pet_name` varchar(100) DEFAULT '' COMMENT '宠物名称',
  `type` varchar(20) DEFAULT 'image' COMMENT '类型: image/video',
  `url` varchar(500) DEFAULT NULL COMMENT '视频URL',
  `photos` json DEFAULT NULL COMMENT '图片列表',
  `thumbnail` varchar(500) DEFAULT NULL COMMENT '缩略图',
  `duration` int(11) DEFAULT 0 COMMENT '视频时长(秒)',
  `action` varchar(100) DEFAULT NULL COMMENT '操作动作',
  `date` date DEFAULT NULL COMMENT '日期',
  `time` time DEFAULT NULL COMMENT '时间',
  `description` text DEFAULT NULL COMMENT '描述',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_openid` (`openid`),
  KEY `idx_pet_id` (`pet_id`),
  KEY `idx_date` (`date`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='足迹表';

-- ============================================
-- 6. 提醒表（简化模型：间隔天数 + 最近完成日期）
-- ============================================
DROP TABLE IF EXISTS `reminders`;
CREATE TABLE `reminders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `pet_id` int(11) NOT NULL COMMENT '宠物ID',
  `openid` varchar(100) NOT NULL COMMENT '用户OpenID',
  `type` varchar(50) NOT NULL COMMENT '提醒类型: 喂食/换水/晒太阳/清理等',
  `interval_days` int(11) NOT NULL DEFAULT 7 COMMENT '间隔天数',
  `last_done` varchar(20) DEFAULT '' COMMENT '最近完成日期(YYYY-MM-DD)',
  `note` text DEFAULT NULL COMMENT '备注',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_pet_type` (`pet_id`, `type`, `openid`),
  KEY `idx_openid` (`openid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='提醒表';

-- ============================================
-- 7. 分类表
-- ============================================
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `openid` varchar(100) NOT NULL COMMENT '用户OpenID',
  `name` varchar(100) NOT NULL COMMENT '分类名称',
  `icon` varchar(50) DEFAULT NULL COMMENT '图标',
  `color` varchar(20) DEFAULT NULL COMMENT '颜色',
  `sort_order` int(11) DEFAULT 0 COMMENT '排序',
  `is_default` tinyint(1) DEFAULT 0 COMMENT '是否默认分类',
  `status` tinyint(1) DEFAULT 1 COMMENT '状态: 1=启用 0=禁用',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_openid_name` (`openid`, `name`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='分类表';

-- ============================================
-- 8. 系统配置表
-- ============================================
DROP TABLE IF EXISTS `system_config`;
CREATE TABLE `system_config` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `config_key` varchar(100) NOT NULL COMMENT '配置键',
  `config_value` text DEFAULT NULL COMMENT '配置值',
  `description` varchar(255) DEFAULT NULL COMMENT '描述',
  `updated_by` varchar(100) DEFAULT NULL COMMENT '最后更新人',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_config_key` (`config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表';

-- 默认配置
INSERT INTO `system_config` (`config_key`, `config_value`, `description`) VALUES
('systemName', '养龟档案', '系统名称'),
('version', '2.0.0', '系统版本'),
('maxPetCount', '10', '每用户最大宠物数量'),
('maxFootprintImages', '9', '每足迹最大图片数'),
('maxPetPhotos', '20', '每宠物最大照片数'),
('enableReminder', 'true', '是否启用提醒功能'),
('allowRegister', 'true', '是否允许新用户注册'),
('servicePhone', '', '客服电话');

-- ============================================
-- 9. 微信 access_token 缓存表
-- ============================================
DROP TABLE IF EXISTS `wechat_token`;
CREATE TABLE `wechat_token` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `token` varchar(600) NOT NULL COMMENT 'access_token',
  `expires_at` datetime NOT NULL COMMENT '过期时间',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_expires_at` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='微信access_token缓存';

-- ============================================
-- 10. 内容安全审核日志表
-- ============================================
DROP TABLE IF EXISTS `security_logs`;
CREATE TABLE `security_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `file_id` varchar(500) NOT NULL COMMENT '图片相对路径',
  `scene` int(11) DEFAULT 1 COMMENT '审核场景值',
  `scene_tag` varchar(50) DEFAULT '' COMMENT '场景标签: avatar/pet/footprint',
  `biz_id` varchar(100) DEFAULT '' COMMENT '业务关联ID',
  `openid` varchar(100) NOT NULL COMMENT '用户OpenID',
  `trace_id` varchar(100) DEFAULT '' COMMENT '微信审核trace_id',
  `status` varchar(20) DEFAULT 'pending' COMMENT '审核状态: pending/passed/failed/timeout',
  `suggest` varchar(20) DEFAULT '' COMMENT '微信审核建议: pass/review/block',
  `label` int(11) DEFAULT 0 COMMENT '违规标签编号',
  `errcode` int(11) DEFAULT 0 COMMENT '微信审核错误码',
  `processed` tinyint(1) DEFAULT 0 COMMENT '是否已处理回调',
  `processed_time` datetime DEFAULT NULL COMMENT '回调处理时间',
  `result` json DEFAULT NULL COMMENT '审核结果完整JSON',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_openid` (`openid`),
  KEY `idx_status` (`status`),
  KEY `idx_trace_id` (`trace_id`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='内容安全审核日志';

-- ============================================
-- 11. 违规通知表
-- ============================================
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `openid` varchar(100) NOT NULL COMMENT '用户OpenID',
  `type` varchar(50) DEFAULT 'security' COMMENT '类型: security/system',
  `title` varchar(200) DEFAULT '' COMMENT '标题',
  `content` text DEFAULT NULL COMMENT '内容',
  `scene` varchar(50) DEFAULT '' COMMENT '场景',
  `suggest` varchar(20) DEFAULT '' COMMENT '审核建议: pass/review/block',
  `label` varchar(50) DEFAULT '' COMMENT '违规标签',
  `trace_id` varchar(100) DEFAULT '' COMMENT '审核trace_id',
  `file_id` varchar(500) DEFAULT '' COMMENT '关联图片路径',
  `is_read` tinyint(1) DEFAULT 0 COMMENT '是否已读',
  `read_at` datetime DEFAULT NULL COMMENT '阅读时间',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_openid_unread` (`openid`, `is_read`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通知表';

-- ============================================
-- 12. 用户打印配置表
-- ============================================
DROP TABLE IF EXISTS `user_print_config`;
CREATE TABLE `user_print_config` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `openid` varchar(100) NOT NULL COMMENT '用户OpenID',
  `qr_print_types` json DEFAULT NULL COMMENT '打印类型配置: {jiaopei,chandan,chumiao,jiankang}',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_openid` (`openid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户打印配置表';

-- ============================================
-- 13. 黑名单/封禁表
-- ============================================
DROP TABLE IF EXISTS `banned_users`;
CREATE TABLE `banned_users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `openid` varchar(100) NOT NULL COMMENT '被封禁用户OpenID',
  `reason` varchar(255) DEFAULT NULL COMMENT '封禁原因',
  `banned_by` varchar(100) DEFAULT NULL COMMENT '操作人OpenID',
  `banned_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_openid` (`openid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='黑名单表';

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- 索引优化说明:
--   1. users: uk_openid(唯一) 支持登录查询; idx_status 支持封禁筛选
--   2. admins: uk_openid 支持微信管理员的权限检查; uk_username 支持web登录
--   3. pets: uk_openid_alias 支持别名唯一性; idx_openid + idx_is_public 支持列表查询
--   4. records: idx_openid_pet 覆盖最常见查询(某用户某宠物); idx_pet_type 支持类型筛选
--   5. reminders: uk_pet_type 保证同宠物同类型唯一; 避免重复提醒
--   6. security_logs: idx_openid + idx_trace_id 支持审核查询和回调匹配; processed 列区分已处理/待处理
--   7. notifications: idx_openid_unread 覆盖未读通知查询(最高频操作)
-- ============================================
