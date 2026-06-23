-- 养龟档案 - MySQL 数据库表结构
-- 适用于 MySQL 8.0
-- 执行方法: mysql -u turtle_user -p turtle_archive < database.sql

-- 设置字符集
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ==================== 用户表 ====================
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `openid` varchar(100) NOT NULL COMMENT '微信OpenID',
  `nickname` varchar(100) DEFAULT NULL COMMENT '用户昵称',
  `avatar` varchar(500) DEFAULT NULL COMMENT '用户头像',
  `phone` varchar(20) DEFAULT NULL COMMENT '手机号',
  `role` varchar(20) DEFAULT 'user' COMMENT '角色: user/admin',
  `status` tinyint(1) DEFAULT 1 COMMENT '状态: 1=正常, 0=禁用',
  `last_login_time` datetime DEFAULT NULL COMMENT '最后登录时间',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_openid` (`openid`),
  KEY `idx_phone` (`phone`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ==================== 管理员表 ====================
DROP TABLE IF EXISTS `admins`;
CREATE TABLE `admins` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL COMMENT '管理员用户名',
  `password` varchar(255) NOT NULL COMMENT '密码(加密)',
  `nickname` varchar(100) DEFAULT NULL COMMENT '管理员昵称',
  `role` varchar(20) DEFAULT 'admin' COMMENT '角色',
  `enabled` tinyint(1) DEFAULT 1 COMMENT '是否启用: 1=是, 0=否',
  `last_login_time` datetime DEFAULT NULL COMMENT '最后登录时间',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员表';

-- 插入默认管理员 (用户名: admin, 密码: admin123)
-- 注意: 实际部署时请修改密码!
INSERT INTO `admins` (`username`, `password`, `nickname`, `enabled`) VALUES
('admin', '$2b$10$8K1p/a0dL3LzWPVFZ0OVuO1vZGvY1vZGvY1vZGvY1vZGvY1vZG', '超级管理员', 1);

-- ==================== 宠物表 ====================
DROP TABLE IF EXISTS `pets`;
CREATE TABLE `pets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `pet_id` varchar(50) NOT NULL COMMENT '宠物唯一ID',
  `openid` varchar(100) NOT NULL COMMENT '主人OpenID',
  `name` varchar(100) NOT NULL COMMENT '宠物名称',
  `alias` varchar(100) DEFAULT NULL COMMENT '别名',
  `category` varchar(50) DEFAULT NULL COMMENT '品种/分类',
  `gender` varchar(10) DEFAULT NULL COMMENT '性别: male/female/unknown',
  `birth_date` date DEFAULT NULL COMMENT '出生日期',
  `avatar` varchar(500) DEFAULT NULL COMMENT '宠物头像',
  `photos` json DEFAULT NULL COMMENT '相册(数组)',
  `father_id` varchar(50) DEFAULT NULL COMMENT '父亲ID',
  `mother_id` varchar(50) DEFAULT NULL COMMENT '母亲ID',
  `father_alias` varchar(100) DEFAULT NULL COMMENT '父亲别名',
  `mother_alias` varchar(100) DEFAULT NULL COMMENT '母亲别名',
  `status` varchar(20) DEFAULT 'active' COMMENT '状态: active/archived(deleted)',
  `remark` text DEFAULT NULL COMMENT '备注',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_pet_id` (`pet_id`),
  KEY `idx_openid` (`openid`),
  KEY `idx_category` (`category`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='宠物表';

-- ==================== 记录表 ====================
DROP TABLE IF EXISTS `records`;
CREATE TABLE `records` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `record_id` varchar(50) NOT NULL COMMENT '记录唯一ID',
  `openid` varchar(100) NOT NULL COMMENT '用户OpenID',
  `pet_id` varchar(50) NOT NULL COMMENT '宠物ID',
  `type` varchar(50) NOT NULL COMMENT '记录类型: egg/breeding/health/feeding/custom',
  `title` varchar(200) DEFAULT NULL COMMENT '记录标题',
  `content` text DEFAULT NULL COMMENT '记录内容',
  `date` date NOT NULL COMMENT '记录日期',
  `time` time DEFAULT NULL COMMENT '记录时间',
  `photos` json DEFAULT NULL COMMENT '图片列表(数组)',
  `weight` decimal(10,2) DEFAULT NULL COMMENT '体重(g)',
  `temperature` decimal(5,2) DEFAULT NULL COMMENT '温度(℃)',
  `humidity` decimal(5,2) DEFAULT NULL COMMENT '湿度(%)',
  `food` varchar(200) DEFAULT NULL COMMENT '食物',
  `quantity` varchar(100) DEFAULT NULL COMMENT '食量',
  `health_status` varchar(50) DEFAULT NULL COMMENT '健康状况',
  `medicine` varchar(200) DEFAULT NULL COMMENT '用药',
  `notes` text DEFAULT NULL COMMENT '备注',
  `custom_fields` json DEFAULT NULL COMMENT '自定义字段',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_record_id` (`record_id`),
  KEY `idx_openid` (`openid`),
  KEY `idx_pet_id` (`pet_id`),
  KEY `idx_type` (`type`),
  KEY `idx_date` (`date`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='记录表';

-- ==================== 足迹表 ====================
DROP TABLE IF EXISTS `footprints`;
CREATE TABLE `footprints` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `footprint_id` varchar(50) NOT NULL COMMENT '足迹唯一ID',
  `openid` varchar(100) NOT NULL COMMENT '用户OpenID',
  `pet_id` varchar(50) DEFAULT NULL COMMENT '宠物ID',
  `pet_name` varchar(100) DEFAULT NULL COMMENT '宠物名称',
  `type` varchar(20) DEFAULT 'image' COMMENT '类型: image/video',
  `url` varchar(500) DEFAULT NULL COMMENT '视频URL',
  `photos` json DEFAULT NULL COMMENT '图片列表(数组)',
  `thumbnail` varchar(500) DEFAULT NULL COMMENT '缩略图',
  `duration` int(11) DEFAULT 0 COMMENT '视频时长(秒)',
  `action` varchar(100) DEFAULT NULL COMMENT '操作动作',
  `date` date NOT NULL COMMENT '日期',
  `time` time DEFAULT NULL COMMENT '时间',
  `description` text DEFAULT NULL COMMENT '描述',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_footprint_id` (`footprint_id`),
  KEY `idx_openid` (`openid`),
  KEY `idx_pet_id` (`pet_id`),
  KEY `idx_date` (`date`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='足迹表';

-- ==================== 提醒表 ====================
DROP TABLE IF EXISTS `reminders`;
CREATE TABLE `reminders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `reminder_id` varchar(50) NOT NULL COMMENT '提醒唯一ID',
  `openid` varchar(100) NOT NULL COMMENT '用户OpenID',
  `pet_id` varchar(50) DEFAULT NULL COMMENT '宠物ID',
  `type` varchar(50) NOT NULL COMMENT '提醒类型: feeding/health/custom',
  `title` varchar(200) NOT NULL COMMENT '提醒标题',
  `content` text DEFAULT NULL COMMENT '提醒内容',
  `remind_time` datetime NOT NULL COMMENT '提醒时间',
  `repeat_type` varchar(20) DEFAULT 'none' COMMENT '重复类型: none/daily/weekly/monthly',
  `repeat_interval` int(11) DEFAULT 0 COMMENT '重复间隔',
  `status` varchar(20) DEFAULT 'active' COMMENT '状态: active/completed/expired',
  `notified` tinyint(1) DEFAULT 0 COMMENT '是否已通知: 0=否, 1=是',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_reminder_id` (`reminder_id`),
  KEY `idx_openid` (`openid`),
  KEY `idx_pet_id` (`pet_id`),
  KEY `idx_remind_time` (`remind_time`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='提醒表';

-- ==================== 分类表 ====================
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `category_id` varchar(50) NOT NULL COMMENT '分类唯一ID',
  `openid` varchar(100) NOT NULL COMMENT '用户OpenID',
  `name` varchar(100) NOT NULL COMMENT '分类名称',
  `icon` varchar(50) DEFAULT NULL COMMENT '图标',
  `color` varchar(20) DEFAULT NULL COMMENT '颜色',
  `sort_order` int(11) DEFAULT 0 COMMENT '排序',
  `is_default` tinyint(1) DEFAULT 0 COMMENT '是否默认分类: 0=否, 1=是',
  `status` tinyint(1) DEFAULT 1 COMMENT '状态: 1=启用, 0=禁用',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_category_id` (`category_id`),
  KEY `idx_openid` (`openid`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='分类表';

-- ==================== 系统配置表 ====================
DROP TABLE IF EXISTS `system_config`;
CREATE TABLE `system_config` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `config_key` varchar(100) NOT NULL COMMENT '配置键',
  `config_value` text DEFAULT NULL COMMENT '配置值',
  `description` varchar(255) DEFAULT NULL COMMENT '描述',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_config_key` (`config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表';

-- 插入默认配置
INSERT INTO `system_config` (`config_key`, `config_value`, `description`) VALUES
('maxFootprintImages', '9', '每张足迹最多上传图片数'),
('maxPetPhotos', '20', '每只宠物最多照片数'),
('enableReminder', 'true', '是否启用提醒功能'),
('version', '1.0.0', '系统版本');

-- ==================== 黑名单表 ====================
DROP TABLE IF EXISTS `banned_users`;
CREATE TABLE `banned_users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `openid` varchar(100) NOT NULL COMMENT '被禁用户OpenID',
  `reason` varchar(255) DEFAULT NULL COMMENT '封禁原因',
  `banned_by` varchar(100) DEFAULT NULL COMMENT '操作人',
  `banned_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_openid` (`openid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='黑名单表';

-- 恢复外键检查
SET FOREIGN_KEY_CHECKS = 1;

-- 完成提示
SELECT '数据库表结构创建完成!' as Message;
