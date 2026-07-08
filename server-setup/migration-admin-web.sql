-- ============================================
-- 养龟档案 - Admin Web 独立后台 数据库迁移
-- 执行: mysql -u turtle-records -p turtle-records < migration-admin-web.sql
-- ============================================

SET NAMES utf8mb4;

-- 1. admins 表新增 email 字段（用于找回密码）
ALTER TABLE `admins` 
  ADD COLUMN `email` VARCHAR(100) DEFAULT NULL COMMENT '管理员邮箱' AFTER `password`;

-- 2. 新建密码重置令牌表
DROP TABLE IF EXISTS `password_reset_tokens`;
CREATE TABLE `password_reset_tokens` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `admin_id` INT NOT NULL COMMENT '管理员ID',
  `token` VARCHAR(64) NOT NULL COMMENT '重置令牌',
  `expires_at` DATETIME NOT NULL COMMENT '过期时间',
  `used` TINYINT(1) DEFAULT 0 COMMENT '是否已使用',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_token` (`token`),
  KEY `idx_admin_id` (`admin_id`),
  KEY `idx_expires_at` (`expires_at`),
  CONSTRAINT `fk_reset_admin` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='密码重置令牌表';
