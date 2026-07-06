#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
数据库模块 - MySQL 数据库模块
"""

import os
import hashlib
import hmac
import json
import time
import threading
from datetime import datetime, timedelta

# ==================== 配置 ====================


# MySQL 配置（从环境变量读取，避免硬编码密码泄露）
MYSQL_CONFIG = {
    "host": os.environ.get("MYSQL_HOST", "127.0.0.1"),
    "port": int(os.environ.get("MYSQL_PORT", "3306")),
    "user": os.environ.get("MYSQL_USER", "xuexitong"),
    "password": os.environ.get("MYSQL_PASSWORD", ""),
    "database": os.environ.get("MYSQL_DATABASE", "xuexitong"),
    "charset": "utf8mb4",
    "connect_timeout": 8,
    "read_timeout": 15,
    "write_timeout": 15
}
# ==============================================


def _ph():
    """返回当前数据库类型的占位符"""
    return "%s"


def _adapt_params(params):
    """适配参数（主要是 datetime 类型）"""
    return tuple(params)


class Database:
    def __init__(self):
        self.conn = None
        self.lock = threading.RLock()
        self._connect()
        self._init_tables()

    def _connect(self):
        # MySQL 多人并发场景下不复用单个连接；每次查询创建短连接，避免 PyMySQL 连接跨线程冲突。
        self.conn = None

    def _new_mysql_conn(self):
        import pymysql
        last_error = None
        for attempt in range(3):
            try:
                return pymysql.connect(
                    **MYSQL_CONFIG,
                    cursorclass=pymysql.cursors.DictCursor,
                    autocommit=False
                )
            except Exception as e:
                last_error = e
                if attempt < 2:
                    time.sleep(1.5 * (attempt + 1))
        raise last_error

    def _ensure_connection(self):
        """确保数据库连接可用，MySQL 断线时自动重连"""
        try:
            self.conn.ping(reconnect=True)
        except Exception:
            self._connect()

    def _init_tables(self):
        """初始化数据表"""
        ph = _ph()

        # 用户表
        self.execute(f"""
            CREATE TABLE IF NOT EXISTS users (
                id INT PRIMARY KEY AUTO_INCREMENT,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                is_verified TINYINT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login_at TIMESTAMP NULL DEFAULT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)
        # 兼容旧表
        try:
            self.execute("ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP NULL DEFAULT NULL")
        except Exception:
            pass

        self._ensure_payment_columns()

        # 用户脚本设置云端记忆
        self.execute("""
            CREATE TABLE IF NOT EXISTS user_settings (
                username VARCHAR(50) PRIMARY KEY,
                settings_json TEXT NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)

        # 验证码表
        self.execute(f"""
            CREATE TABLE IF NOT EXISTS verify_codes (
                id INT PRIMARY KEY AUTO_INCREMENT,
                email VARCHAR(100) NOT NULL,
                code VARCHAR(10) NOT NULL,
                type VARCHAR(20) NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)

        # 登录锁定表：记录当前仍在锁定期的账号，便于后台手动解锁
        self.execute("""
            CREATE TABLE IF NOT EXISTS login_locks (
                id INT PRIMARY KEY AUTO_INCREMENT,
                scope VARCHAR(20) NOT NULL,
                identifier VARCHAR(255) NOT NULL,
                username VARCHAR(50),
                email VARCHAR(100),
                client_ip VARCHAR(64),
                fail_count INT DEFAULT 0,
                locked_until TIMESTAMP NOT NULL,
                reason VARCHAR(255),
                unlocked_at TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_active (scope, unlocked_at, locked_until),
                INDEX idx_identifier (identifier)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)

        # 管理员配置表
        self.execute(f"""
            CREATE TABLE IF NOT EXISTS admin_config (
                id INT PRIMARY KEY,
                password VARCHAR(255) NOT NULL DEFAULT 'admin',
                smtp_host VARCHAR(255),
                smtp_port INT DEFAULT 587,
                smtp_user VARCHAR(255),
                smtp_pass VARCHAR(255),
                from_addr VARCHAR(255),
                test_recipient VARCHAR(255),
                email_enabled TINYINT DEFAULT 0
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)
        # MySQL 的 INSERT IGNORE
        self.execute(f"INSERT IGNORE INTO admin_config (id, password) VALUES ({ph}, 'admin')", (1,))
        col = self.fetchone("SHOW COLUMNS FROM admin_config LIKE 'test_recipient'")
        if not col:
            self.execute("ALTER TABLE admin_config ADD COLUMN test_recipient VARCHAR(255)")
        self._add_column_if_missing("admin_config", "log_retention_days", "log_retention_days INT DEFAULT 0")

        self._ensure_admin_payment_columns()

        # 付费套餐、订单与扣题流水
        self.execute("""
            CREATE TABLE IF NOT EXISTS payment_plans (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(100) NOT NULL,
                plan_type VARCHAR(20) NOT NULL,
                price DECIMAL(10,2) DEFAULT 0,
                points INT DEFAULT 0,
                days INT DEFAULT 0,
                enabled TINYINT DEFAULT 1,
                sort_order INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_type_enabled (plan_type, enabled)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)
        self.execute("""
            CREATE TABLE IF NOT EXISTS payment_orders (
                id INT PRIMARY KEY AUTO_INCREMENT,
                order_no VARCHAR(64) UNIQUE NOT NULL,
                username VARCHAR(50) NOT NULL,
                plan_id INT,
                plan_name VARCHAR(100),
                plan_type VARCHAR(20),
                price DECIMAL(10,2) DEFAULT 0,
                points INT DEFAULT 0,
                days INT DEFAULT 0,
                status VARCHAR(20) DEFAULT 'paid',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_username (username),
                INDEX idx_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)
        self.execute("""
            CREATE TABLE IF NOT EXISTS usage_logs (
                id INT PRIMARY KEY AUTO_INCREMENT,
                username VARCHAR(50) NOT NULL,
                delta_points INT NOT NULL,
                balance_after INT DEFAULT 0,
                reason VARCHAR(100),
                question_hash VARCHAR(64),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_username (username),
                INDEX idx_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)

        self._ensure_order_payment_columns()

        # AI 配置表
        self.execute(f"""
            CREATE TABLE IF NOT EXISTS providers_config (
                id INT PRIMARY KEY,
                data TEXT NOT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)
        # 插入空数据占位，后续 backend 加载会替换为默认值
        self.execute(f"INSERT IGNORE INTO providers_config (id, data) VALUES ({ph}, %s)", (1, json.dumps({})))

        # AI 提供商表：结构化保存，方便直接在 MySQL 里查看
        self.execute("""
            CREATE TABLE IF NOT EXISTS ai_providers (
                provider_key VARCHAR(100) PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                protocol VARCHAR(50) NOT NULL DEFAULT 'openai',
                api_key TEXT,
                base_url TEXT,
                enabled TINYINT DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)
        self.execute("""
            CREATE TABLE IF NOT EXISTS ai_models (
                id INT PRIMARY KEY AUTO_INCREMENT,
                provider_key VARCHAR(100) NOT NULL,
                model_value VARCHAR(255) NOT NULL,
                model_label VARCHAR(255) NOT NULL,
                weight INT DEFAULT 100,
                daily_token_limit INT DEFAULT 0,
                sort_order INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_provider_key (provider_key)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)
        # 兼容旧表：添加列（如果不存在）
        for col, ddl in [("weight", "weight INT DEFAULT 100"), ("daily_token_limit", "daily_token_limit INT DEFAULT 0")]:
            try:
                self.execute(f"ALTER TABLE ai_models ADD COLUMN {ddl}")
            except Exception:
                pass
        self.execute("""
            CREATE TABLE IF NOT EXISTS model_token_usage (
                id INT PRIMARY KEY AUTO_INCREMENT,
                model_name VARCHAR(255) NOT NULL,
                usage_date DATE NOT NULL,
                total_tokens INT DEFAULT 0,
                call_count INT DEFAULT 0,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY uk_model_date (model_name, usage_date),
                INDEX idx_model_date (model_name, usage_date)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)
        self.execute("""
            CREATE TABLE IF NOT EXISTS ai_call_logs (
                id INT PRIMARY KEY AUTO_INCREMENT,
                provider_key VARCHAR(100),
                username VARCHAR(50) DEFAULT '',
                model VARCHAR(255),
                question TEXT,
                answer TEXT,
                status VARCHAR(20) NOT NULL,
                error TEXT,
                duration_ms INT DEFAULT 0,
                client_ip VARCHAR(64),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_created_at (created_at),
                INDEX idx_status (status),
                INDEX idx_model (model),
                INDEX idx_status_created (status, created_at),
                INDEX idx_model_created (model, created_at),
                INDEX idx_username (username)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)
        self._add_column_if_missing("ai_call_logs", "username", "username VARCHAR(50) DEFAULT ''")
        self.execute("""
            CREATE TABLE IF NOT EXISTS script_event_logs (
                id BIGINT PRIMARY KEY AUTO_INCREMENT,
                username VARCHAR(50),
                event_type VARCHAR(50) DEFAULT 'log',
                level VARCHAR(20),
                message TEXT,
                page_url TEXT,
                course_id VARCHAR(100),
                task_id VARCHAR(100),
                client_ip VARCHAR(64),
                user_agent TEXT,
                extra_json JSON NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_created_id (created_at, id),
                INDEX idx_user_created (username, created_at),
                INDEX idx_type_created (event_type, created_at),
                INDEX idx_level_created (level, created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)
        self.execute("""
            CREATE TABLE IF NOT EXISTS question_bank (
                id INT PRIMARY KEY AUTO_INCREMENT,
                question_hash VARCHAR(64) UNIQUE NOT NULL,
                question_text TEXT NOT NULL,
                question_type VARCHAR(50),
                options_text TEXT,
                answer TEXT NOT NULL,
                source_model VARCHAR(255),
                source_provider VARCHAR(100),
                hit_count INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                last_used_at TIMESTAMP NULL,
                INDEX idx_question_hash (question_hash),
                INDEX idx_created_at (created_at),
                INDEX idx_hit_count (hit_count)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)
        # 不在服务启动时执行 ALTER 迁移，避免远程 MySQL 改表阻塞服务启动。
        # 题库索引优化（提升大数据量下的搜索和排序性能）
        self._ensure_index("question_bank", "idx_updated_at", "updated_at")
        self._ensure_index("question_bank", "idx_last_used", "last_used_at")
        self._ensure_index("question_bank", "idx_source_provider", "source_provider")
        # 全文索引（大幅提升关键词搜索性能，MySQL 5.7+ 支持 ngram 分词）
        self._ensure_fulltext_index("question_bank", "ft_question_text", "question_text", "answer")

        # AI 答案持久化缓存
        self.execute("""
            CREATE TABLE IF NOT EXISTS ai_cache (
                cache_key VARCHAR(64) PRIMARY KEY,
                answer TEXT NOT NULL,
                model VARCHAR(255) NOT NULL DEFAULT '',
                provider VARCHAR(100) NOT NULL DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                hit_count INT DEFAULT 0,
                INDEX idx_last_used (last_used_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)

        # 邮件模板表
        self.execute("""
            CREATE TABLE IF NOT EXISTS email_templates (
                id INT AUTO_INCREMENT PRIMARY KEY,
                scene VARCHAR(50) NOT NULL COMMENT '应用场景: user_register/user_reset/admin_reset',
                subject VARCHAR(255) NOT NULL COMMENT '邮件主题',
                content_type VARCHAR(10) NOT NULL DEFAULT 'text' COMMENT '内容格式: text/html',
                body_text TEXT COMMENT '纯文本内容',
                body_html TEXT COMMENT 'HTML内容',
                variables VARCHAR(500) DEFAULT '' COMMENT '变量列表(逗号分隔)',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE INDEX idx_scene (scene)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)
        # 迁移：旧表结构 → 新表结构
        self._migrate_email_templates()
        # 确保每个场景都有默认模板
        self._ensure_default_email_templates()

        # ===== 推广返利 =====
        # 邀请关系表
        self.execute("""
            CREATE TABLE IF NOT EXISTS referrals (
                id INT PRIMARY KEY AUTO_INCREMENT,
                inviter_username VARCHAR(50) NOT NULL COMMENT '邀请人',
                invitee_username VARCHAR(50) NOT NULL COMMENT '被邀请人',
                invite_code VARCHAR(16) NOT NULL COMMENT '使用的邀请码',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY uk_invitee (invitee_username),
                INDEX idx_inviter (inviter_username)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)
        # 佣金记录表
        self.execute("""
            CREATE TABLE IF NOT EXISTS commission_logs (
                id INT PRIMARY KEY AUTO_INCREMENT,
                inviter VARCHAR(50) NOT NULL,
                invitee VARCHAR(50) NOT NULL,
                order_no VARCHAR(64) NOT NULL,
                order_amount DECIMAL(10,2) DEFAULT 0,
                rate DECIMAL(5,4) DEFAULT 0 COMMENT '费率 0.0000-1.0000',
                commission_amount DECIMAL(10,2) DEFAULT 0,
                status VARCHAR(20) DEFAULT 'pending' COMMENT 'pending/paid',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY uk_order (order_no),
                INDEX idx_inviter_status (inviter, status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)
        # 提现申请表
        self.execute("""
            CREATE TABLE IF NOT EXISTS withdrawals (
                id INT PRIMARY KEY AUTO_INCREMENT,
                username VARCHAR(50) NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                pay_method VARCHAR(20) NOT NULL COMMENT 'alipay/wechat',
                pay_account VARCHAR(255) NOT NULL,
                qr_code_path TEXT COMMENT '收款二维码 data-URI',
                status VARCHAR(20) DEFAULT 'pending' COMMENT 'pending/approved/rejected',
                reject_reason VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                reviewed_at TIMESTAMP NULL DEFAULT NULL,
                INDEX idx_username_status (username, status),
                INDEX idx_status_created (status, created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)
        # 用户收款信息表（预存，提现时带入）
        self.execute("""
            CREATE TABLE IF NOT EXISTS user_payment_info (
                username VARCHAR(50) PRIMARY KEY,
                alipay_account VARCHAR(255) DEFAULT '',
                alipay_qr TEXT,
                wechat_account VARCHAR(255) DEFAULT '',
                wechat_qr TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)

    def _ensure_index(self, table, index_name, *columns):
        """确保普通索引存在，不存在则创建"""
        try:
            row = self.fetchone(
                "SELECT COUNT(*) AS cnt FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = %s AND index_name = %s",
                (table, index_name)
            )
            if row and int(row.get("cnt", 0)) == 0:
                cols = ", ".join(columns)
                self.execute(f"CREATE INDEX {index_name} ON {table} ({cols})")
        except Exception:
            pass

    def _ensure_fulltext_index(self, table, index_name, *columns):
        """确保全文索引存在，不存在则创建（MySQL 5.7+）"""
        try:
            row = self.fetchone(
                "SELECT COUNT(*) AS cnt FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = %s AND index_name = %s",
                (table, index_name)
            )
            if row and int(row.get("cnt", 0)) == 0:
                cols = ", ".join(columns)
                self.execute(f"CREATE FULLTEXT INDEX {index_name} ON {table} ({cols}) WITH PARSER ngram")
        except Exception:
            pass

    def execute(self, sql, params=()):
        """执行 SQL"""
        conn = self._new_mysql_conn()
        try:
            cursor = conn.cursor()
            cursor.execute(sql, _adapt_params(params))
            conn.commit()
            return cursor
        finally:
            conn.close()
        with self.lock:
            self._ensure_connection()
            cursor = self.conn.cursor()
            cursor.execute(sql, _adapt_params(params))
            self.conn.commit()
            return cursor

    def fetchone(self, sql, params=()):
        """查询单条"""
        conn = self._new_mysql_conn()
        try:
            cursor = conn.cursor()
            cursor.execute(sql, _adapt_params(params))
            row = cursor.fetchone()
            return dict(row) if row else None
        finally:
            conn.close()
        with self.lock:
            self._ensure_connection()
            cursor = self.conn.cursor()
            cursor.execute(sql, _adapt_params(params))
            row = cursor.fetchone()
            return dict(row) if row else None

    def fetchall(self, sql, params=()):
        """查询多条"""
        conn = self._new_mysql_conn()
        try:
            cursor = conn.cursor()
            cursor.execute(sql, _adapt_params(params))
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
        finally:
            conn.close()
        with self.lock:
            self._ensure_connection()
            cursor = self.conn.cursor()
            cursor.execute(sql, _adapt_params(params))
            rows = cursor.fetchall()
            return [dict(row) for row in rows]

    def _column_exists(self, table, column):
        return bool(self.fetchone(f"SHOW COLUMNS FROM {table} LIKE %s", (column,)))

    def _add_column_if_missing(self, table, column, ddl):
        if not self._column_exists(table, column):
            self.execute(f"ALTER TABLE {table} ADD COLUMN {ddl}")

    def _migrate_email_templates(self):
        """自动迁移 email_templates 表结构（旧 name/is_default → 新 scene/content_type）"""
        # 检查是否存在旧列 name
        has_name = self._column_exists("email_templates", "name")
        # 检查是否存在旧列 is_default
        has_is_default = self._column_exists("email_templates", "is_default")
        # 检查是否缺少新列 scene
        has_scene = self._column_exists("email_templates", "scene")
        # 检查是否缺少新列 content_type
        has_content_type = self._column_exists("email_templates", "content_type")
        # 检查旧唯一索引是否存在
        has_old_unique = self._index_exists("email_templates", "idx_scene")

        if not has_scene or not has_content_type or has_name or has_is_default:
            try:
                # 旧表有数据先备份（如果有 name 列说明是旧结构）
                if has_name:
                    rows = self.fetchall("SELECT * FROM email_templates")
                else:
                    rows = []

                # 删表重建最安全（CREATE TABLE IF NOT EXISTS 会重建）
                self.execute("DROP TABLE IF EXISTS email_templates")
                self.execute("""
                    CREATE TABLE email_templates (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        scene VARCHAR(50) NOT NULL COMMENT '应用场景',
                        subject VARCHAR(255) NOT NULL COMMENT '邮件主题',
                        content_type VARCHAR(10) NOT NULL DEFAULT 'text' COMMENT '内容格式: text/html',
                        body_text TEXT COMMENT '纯文本内容',
                        body_html TEXT COMMENT 'HTML内容',
                        variables VARCHAR(500) DEFAULT '' COMMENT '变量列表',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        UNIQUE INDEX idx_scene (scene)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
                """)
                # 旧数据不恢复（name 无法映射到 scene，旧数据无意义）
                print(f"[DB迁移] email_templates 表已重建为新的 scene/content_type 结构")
            except Exception as e:
                print(f"[DB迁移警告] email_templates 迁移失败（表可能正常工作）: {e}")

    def _ensure_default_email_templates(self):
        """确保每个场景都有默认邮件模板"""
        ph = _ph()
        defaults = [
            {
                "scene": "user_register",
                "subject": "学神助手 - 注册验证码",
                "body_text": "━━━━━━━━━━━━━━━━━━━━\n    学神助手 · {{subject}}\n━━━━━━━━━━━━━━━━━━━━\n\n尊敬的 {{username}}，您好！\n\n欢迎注册学神助手，您的验证码是：\n\n        【 {{code}} 】\n\n⏰ 有效期：10 分钟\n⚠️ 请勿泄露给他人\n\n━━━━━━━━━━━━━━━━━━━━\n如您未进行注册操作，请忽略本邮件。\n本邮件由 {{from_addr}} 发送\n━━━━━━━━━━━━━━━━━━━━",
                "body_html": '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>@keyframes fadeInUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.03)}}@keyframes glow{0%,100%{box-shadow:0 0 5px rgba(59,130,246,0.3)}50%{box-shadow:0 0 20px rgba(59,130,246,0.5)}}.card{animation:fadeInUp 0.6s ease-out}.code-box{animation:pulse 2.5s ease-in-out infinite,glow 2.5s ease-in-out infinite}</style></head><body style="margin:0;padding:0;background:#f0f4f8;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding:40px 20px;"><table class="card" width="480" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;width:100%;background:#ffffff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);overflow:hidden;"><tr><td style="background:linear-gradient(135deg,#3b82f6,#2563eb);padding:28px 32px;text-align:center;"><div style="color:#ffffff;font-size:18px;font-weight:600;letter-spacing:1px;">学神助手</div><div style="color:rgba(255,255,255,0.85);font-size:13px;margin-top:4px;">{{subject}}</div></td></tr><tr><td style="padding:32px;"><p style="margin:0 0 16px;color:#1f2937;font-size:15px;line-height:1.6;">尊敬的 <b>{{username}}</b>，您好！</p><p style="margin:0 0 20px;color:#4b5563;font-size:14px;line-height:1.6;">欢迎注册学神助手，您的验证码是：</p><div style="text-align:center;margin:0 0 24px;"><div class="code-box" style="display:inline-block;background:linear-gradient(135deg,#eff6ff,#dbeafe);border:2px solid #3b82f6;border-radius:12px;padding:18px 36px;"><span style="font-size:34px;font-weight:700;color:#2563eb;letter-spacing:10px;font-family:SF Mono,Courier New,monospace;">{{code}}</span></div></div><p style="margin:0 0 12px;color:#6b7280;font-size:13px;line-height:1.6;">验证码 <b style="color:#dc2626;">10 分钟内</b>有效，请勿泄露给他人。</p><div style="border-top:1px solid #e5e7eb;padding-top:16px;margin-top:20px;"><p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">如您没有进行注册操作，请忽略本邮件。</p><p style="margin:8px 0 0;color:#9ca3af;font-size:12px;line-height:1.6;">本邮件由 <b style="color:#6b7280;">{{from_addr}}</b> 发送</p></div></td></tr></table></td></tr></table></body></html>',
                "variables": "username,code,subject,from_addr"
            },
            {
                "scene": "user_reset",
                "subject": "学神助手 - 密码重置验证码",
                "body_text": "━━━━━━━━━━━━━━━━━━━━\n    学神助手 · {{subject}}\n━━━━━━━━━━━━━━━━━━━━\n\n尊敬的 {{username}}，您好！\n\n您正在重置密码，您的验证码是：\n\n        【 {{code}} 】\n\n⏰ 有效期：10 分钟\n⚠️ 请勿泄露给他人\n\n━━━━━━━━━━━━━━━━━━━━\n如您未进行重置密码操作，请忽略本邮件。\n本邮件由 {{from_addr}} 发送\n━━━━━━━━━━━━━━━━━━━━",
                "body_html": '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>@keyframes fadeInUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.03)}}@keyframes glow{0%,100%{box-shadow:0 0 5px rgba(245,158,11,0.3)}50%{box-shadow:0 0 20px rgba(245,158,11,0.5)}}.card{animation:fadeInUp 0.6s ease-out}.code-box{animation:pulse 2.5s ease-in-out infinite,glow 2.5s ease-in-out infinite}</style></head><body style="margin:0;padding:0;background:#fffbeb;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding:40px 20px;"><table class="card" width="480" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;width:100%;background:#ffffff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);overflow:hidden;"><tr><td style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:28px 32px;text-align:center;"><div style="color:#ffffff;font-size:18px;font-weight:600;letter-spacing:1px;">学神助手</div><div style="color:rgba(255,255,255,0.85);font-size:13px;margin-top:4px;">{{subject}}</div></td></tr><tr><td style="padding:32px;"><p style="margin:0 0 16px;color:#1f2937;font-size:15px;line-height:1.6;">尊敬的 <b>{{username}}</b>，您好！</p><p style="margin:0 0 20px;color:#4b5563;font-size:14px;line-height:1.6;">您正在重置密码，您的验证码是：</p><div style="text-align:center;margin:0 0 24px;"><div class="code-box" style="display:inline-block;background:linear-gradient(135deg,#fffbeb,#fef3c7);border:2px solid #f59e0b;border-radius:12px;padding:18px 36px;"><span style="font-size:34px;font-weight:700;color:#b45309;letter-spacing:10px;font-family:SF Mono,Courier New,monospace;">{{code}}</span></div></div><p style="margin:0 0 12px;color:#6b7280;font-size:13px;line-height:1.6;">验证码 <b style="color:#dc2626;">10 分钟内</b>有效，请勿泄露给他人。</p><div style="border-top:1px solid #e5e7eb;padding-top:16px;margin-top:20px;"><p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">如您没有进行重置密码操作，请忽略本邮件。</p><p style="margin:8px 0 0;color:#9ca3af;font-size:12px;line-height:1.6;">本邮件由 <b style="color:#6b7280;">{{from_addr}}</b> 发送</p></div></td></tr></table></td></tr></table></body></html>',
                "variables": "username,code,subject,from_addr"
            },
            {
                "scene": "admin_reset",
                "subject": "学神助手 - 管理员密码重置验证码",
                "body_text": "━━━━━━━━━━━━━━━━━━━━\n    学神助手 · {{subject}}\n━━━━━━━━━━━━━━━━━━━━\n\n尊敬的管理员 {{username}}，您好！\n\n您正在重置管理员密码，您的验证码是：\n\n        【 {{code}} 】\n\n⏰ 有效期：10 分钟\n⚠️ 请勿泄露给他人\n\n━━━━━━━━━━━━━━━━━━━━\n如您未进行重置密码操作，请忽略本邮件。\n本邮件由 {{from_addr}} 发送\n━━━━━━━━━━━━━━━━━━━━",
                "body_html": '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>@keyframes fadeInUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.03)}}@keyframes glow{0%,100%{box-shadow:0 0 5px rgba(16,185,129,0.3)}50%{box-shadow:0 0 20px rgba(16,185,129,0.5)}}.card{animation:fadeInUp 0.6s ease-out}.code-box{animation:pulse 2.5s ease-in-out infinite,glow 2.5s ease-in-out infinite}</style></head><body style="margin:0;padding:0;background:#ecfdf5;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding:40px 20px;"><table class="card" width="480" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;width:100%;background:#ffffff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);overflow:hidden;"><tr><td style="background:linear-gradient(135deg,#10b981,#059669);padding:28px 32px;text-align:center;"><div style="color:#ffffff;font-size:18px;font-weight:600;letter-spacing:1px;">学神助手 · 管理后台</div><div style="color:rgba(255,255,255,0.85);font-size:13px;margin-top:4px;">{{subject}}</div></td></tr><tr><td style="padding:32px;"><p style="margin:0 0 16px;color:#1f2937;font-size:15px;line-height:1.6;">尊敬的管理员 <b>{{username}}</b>，您好！</p><p style="margin:0 0 20px;color:#4b5563;font-size:14px;line-height:1.6;">您正在重置管理员密码，您的验证码是：</p><div style="text-align:center;margin:0 0 24px;"><div class="code-box" style="display:inline-block;background:linear-gradient(135deg,#ecfdf5,#d1fae5);border:2px solid #10b981;border-radius:12px;padding:18px 36px;"><span style="font-size:34px;font-weight:700;color:#047857;letter-spacing:10px;font-family:SF Mono,Courier New,monospace;">{{code}}</span></div></div><p style="margin:0 0 12px;color:#6b7280;font-size:13px;line-height:1.6;">验证码 <b style="color:#dc2626;">10 分钟内</b>有效，请勿泄露给他人。</p><div style="border-top:1px solid #e5e7eb;padding-top:16px;margin-top:20px;"><p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">如您没有进行重置密码操作，请忽略本邮件。</p><p style="margin:8px 0 0;color:#9ca3af;font-size:12px;line-height:1.6;">本邮件由 <b style="color:#6b7280;">{{from_addr}}</b> 发送</p></div></td></tr></table></td></tr></table></body></html>',
                "variables": "username,code,subject,from_addr"
            },
            {
                "scene": "referral_withdrawal",
                "subject": "学神助手 - 提现审核结果通知",
                "body_text": "━━━━━━━━━━━━━━━━━━━━\n    学神助手 · {{subject}}\n━━━━━━━━━━━━━━━━━━━━\n\n尊敬的 {{username}}，您好！\n\n您的推广返利提现申请有了新进展：\n\n  申请金额：{{amount}} 元\n  审核状态：{{status}}\n{{reason}}\n\n━━━━━━━━━━━━━━━━━━━━\n如有疑问请联系管理员。\n本邮件由 {{from_addr}} 发送\n━━━━━━━━━━━━━━━━━━━━",
                "body_html": '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>@keyframes fadeInUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}.card{animation:fadeInUp 0.6s ease-out}</style></head><body style="margin:0;padding:0;background:#f0f4f8;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding:40px 20px;"><table class="card" width="480" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;width:100%;background:#ffffff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);overflow:hidden;"><tr><td style="background:linear-gradient(135deg,#7c3aed,#5b21b6);padding:28px 32px;text-align:center;"><div style="color:#ffffff;font-size:18px;font-weight:600;letter-spacing:1px;">学神助手</div><div style="color:rgba(255,255,255,0.85);font-size:13px;margin-top:4px;">{{subject}}</div></td></tr><tr><td style="padding:32px;"><p style="margin:0 0 16px;color:#1f2937;font-size:15px;line-height:1.6;">尊敬的 <b>{{username}}</b>，您好！</p><p style="margin:0 0 20px;color:#4b5563;font-size:14px;line-height:1.6;">您的推广返利提现申请审核结果如下：</p><div style="background:#f9fafb;border-radius:12px;padding:20px;margin:0 0 20px;"><p style="margin:0 0 8px;color:#6b7280;font-size:13px;">申请金额</p><p style="margin:0 0 16px;color:#1f2937;font-size:22px;font-weight:700;">¥{{amount}}</p><p style="margin:0 0 8px;color:#6b7280;font-size:13px;">审核状态</p><p style="margin:0;color:#1f2937;font-size:16px;font-weight:600;">{{status}}</p><p style="margin:12px 0 0;color:#6b7280;font-size:13px;line-height:1.6;">{{reason}}</p></div><div style="border-top:1px solid #e5e7eb;padding-top:16px;margin-top:20px;"><p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">如有疑问请联系管理员。</p><p style="margin:8px 0 0;color:#9ca3af;font-size:12px;line-height:1.6;">本邮件由 <b style="color:#6b7280;">{{from_addr}}</b> 发送</p></div></td></tr></table></td></tr></table></body></html>',
                "variables": "username,amount,status,reason,subject,from_addr"
            }
        ]
        for d in defaults:
            exists = self.fetchone(f"SELECT 1 FROM email_templates WHERE scene = {ph}", (d["scene"],))
            if not exists:
                try:
                    self.execute(
                        f"INSERT INTO email_templates (scene, subject, body_text, body_html, content_type, variables) "
                        f"VALUES ({ph}, {ph}, {ph}, {ph}, {ph}, {ph})",
                        (d["scene"], d["subject"], d["body_text"], d["body_html"], "html", d["variables"])
                    )
                    print(f"[DB初始化] 已创建默认邮件模板: {d['scene']}")
                except Exception as e:
                    print(f"[DB初始化警告] 创建默认邮件模板 {d['scene']} 失败: {e}")

    def _index_exists(self, table, index_name):
        """检查索引是否存在"""
        try:
            self.fetchone(f"SHOW INDEX FROM {table} WHERE Key_name = %s", (index_name,))
            return True
        except Exception:
            return False

    def _ensure_payment_columns(self):
        self._add_column_if_missing("users", "points_balance", "points_balance INT DEFAULT 0")
        self._add_column_if_missing("users", "member_until", "member_until TIMESTAMP NULL")
        self._add_column_if_missing("users", "is_banned", "is_banned TINYINT DEFAULT 0")
        self._add_column_if_missing("users", "ban_reason", "ban_reason VARCHAR(255)")
        # 推广返利
        self._add_column_if_missing("users", "invite_code", "invite_code VARCHAR(16)")
        self._add_column_if_missing("users", "commission_balance", "commission_balance DECIMAL(10,2) DEFAULT 0.00")
        try:
            self.execute("ALTER TABLE users ADD UNIQUE INDEX uk_invite_code (invite_code)")
        except Exception:
            pass

    def _ensure_admin_payment_columns(self):
        self._add_column_if_missing("admin_config", "username", "username VARCHAR(50) DEFAULT 'admin'")
        self._add_column_if_missing("admin_config", "admin_email", "admin_email VARCHAR(255)")
        self._add_column_if_missing("admin_config", "avatar_data", "avatar_data LONGTEXT")
        self._add_column_if_missing("admin_config", "gift_type", "gift_type VARCHAR(20) DEFAULT 'none'")
        self._add_column_if_missing("admin_config", "gift_points", "gift_points INT DEFAULT 0")
        self._add_column_if_missing("admin_config", "gift_days", "gift_days INT DEFAULT 0")
        # 支付宝官方接口
        self._add_column_if_missing("admin_config", "alipay_enabled", "alipay_enabled TINYINT DEFAULT 0")
        self._add_column_if_missing("admin_config", "alipay_app_id", "alipay_app_id VARCHAR(128)")
        self._add_column_if_missing("admin_config", "alipay_private_key", "alipay_private_key TEXT")
        self._add_column_if_missing("admin_config", "alipay_public_key", "alipay_public_key TEXT")
        self._add_column_if_missing("admin_config", "alipay_gateway", "alipay_gateway VARCHAR(255) DEFAULT 'https://openapi.alipay.com/gateway.do'")
        # 微信支付官方接口
        self._add_column_if_missing("admin_config", "wechat_enabled", "wechat_enabled TINYINT DEFAULT 0")
        self._add_column_if_missing("admin_config", "wechat_app_id", "wechat_app_id VARCHAR(128)")
        self._add_column_if_missing("admin_config", "wechat_mch_id", "wechat_mch_id VARCHAR(128)")
        self._add_column_if_missing("admin_config", "wechat_api_key", "wechat_api_key TEXT")
        self._add_column_if_missing("admin_config", "wechat_api_v3_key", "wechat_api_v3_key VARCHAR(64)")
        self._add_column_if_missing("admin_config", "wechat_serial_no", "wechat_serial_no VARCHAR(128)")
        self._add_column_if_missing("admin_config", "wechat_private_key", "wechat_private_key TEXT")
        self._add_column_if_missing("admin_config", "wechat_notify_url", "wechat_notify_url VARCHAR(500)")
        # 支付FM
        self._add_column_if_missing("admin_config", "zhifufm_enabled", "zhifufm_enabled TINYINT DEFAULT 0")
        self._add_column_if_missing("admin_config", "zhifufm_api_url", "zhifufm_api_url VARCHAR(255)")
        self._add_column_if_missing("admin_config", "zhifufm_merchant_num", "zhifufm_merchant_num VARCHAR(64)")
        self._add_column_if_missing("admin_config", "zhifufm_secret", "zhifufm_secret VARCHAR(128)")
        self._add_column_if_missing("admin_config", "zhifufm_notify_url", "zhifufm_notify_url VARCHAR(500)")
        self._add_column_if_missing("admin_config", "zhifufm_return_url", "zhifufm_return_url VARCHAR(500)")
        # 杉德河马
        self._add_column_if_missing("admin_config", "sandpay_enabled", "sandpay_enabled TINYINT DEFAULT 0")
        self._add_column_if_missing("admin_config", "sandpay_mid", "sandpay_mid VARCHAR(20)")
        self._add_column_if_missing("admin_config", "sandpay_api_url", "sandpay_api_url VARCHAR(255)")
        self._add_column_if_missing("admin_config", "sandpay_private_key", "sandpay_private_key TEXT")
        self._add_column_if_missing("admin_config", "sandpay_public_key", "sandpay_public_key TEXT")
        self._add_column_if_missing("admin_config", "sandpay_merchant_public_key", "sandpay_merchant_public_key TEXT")
        self._add_column_if_missing("admin_config", "sandpay_notify_url", "sandpay_notify_url VARCHAR(500)")
        self._add_column_if_missing("admin_config", "sandpay_return_url", "sandpay_return_url VARCHAR(500)")
        # 易支付(支付FM兼容模式)
        self._add_column_if_missing("admin_config", "epay_enabled", "epay_enabled TINYINT DEFAULT 0")
        self._add_column_if_missing("admin_config", "epay_api_url", "epay_api_url VARCHAR(255)")
        self._add_column_if_missing("admin_config", "epay_pid", "epay_pid VARCHAR(20)")
        self._add_column_if_missing("admin_config", "epay_key", "epay_key VARCHAR(128)")
        self._add_column_if_missing("admin_config", "epay_notify_url", "epay_notify_url VARCHAR(500)")
        self._add_column_if_missing("admin_config", "epay_return_url", "epay_return_url VARCHAR(500)")
        # 支付通道权重（用于多通道随机分配，默认各100）
        self._add_column_if_missing("admin_config", "alipay_weight", "alipay_weight INT DEFAULT 100")
        self._add_column_if_missing("admin_config", "wechat_weight", "wechat_weight INT DEFAULT 100")
        self._add_column_if_missing("admin_config", "zhifufm_weight", "zhifufm_weight INT DEFAULT 100")
        self._add_column_if_missing("admin_config", "sandpay_weight", "sandpay_weight INT DEFAULT 100")
        self._add_column_if_missing("admin_config", "epay_weight", "epay_weight INT DEFAULT 100")
        # 推广返利配置
        self._add_column_if_missing("admin_config", "referral_enabled", "referral_enabled TINYINT DEFAULT 0")
        self._add_column_if_missing("admin_config", "referral_rate", "referral_rate DECIMAL(5,4) DEFAULT 0.1000")
        self._add_column_if_missing("admin_config", "referral_min_withdraw", "referral_min_withdraw DECIMAL(10,2) DEFAULT 10.00")
        self._add_column_if_missing("admin_config", "referral_settle_days", "referral_settle_days INT DEFAULT 7")

    def _ensure_order_payment_columns(self):
        self._add_column_if_missing("payment_orders", "pay_method", "pay_method VARCHAR(20)")
        self._add_column_if_missing("payment_orders", "pay_channel", "pay_channel VARCHAR(20)")
        self._add_column_if_missing("payment_orders", "trade_no", "trade_no VARCHAR(128)")
        self._add_column_if_missing("payment_orders", "qr_code", "qr_code TEXT")
        self._add_column_if_missing("payment_orders", "pay_url", "pay_url TEXT")
        self._add_column_if_missing("payment_orders", "paid_at", "paid_at TIMESTAMP NULL")

    # ==================== 用户相关 ====================
    def create_user(self, username, email, password_hash, invite_code=None):
        ph = _ph()
        try:
            code = self._gen_unique_invite_code()
            self.execute(
                f"INSERT INTO users (username, email, password_hash, is_verified, invite_code) VALUES ({ph}, {ph}, {ph}, 0, {ph})",
                (username, email, password_hash, code)
            )
            # 绑定邀请关系
            if invite_code:
                self._bind_referral(username, invite_code)
            return True, None
        except Exception as e:
            return False, str(e)

    def _gen_unique_invite_code(self):
        import random as _r
        alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  # 去除 0/O/1/I 防误读
        for _ in range(20):
            code = "".join(_r.choices(alphabet, k=8))
            if not self.fetchone("SELECT 1 FROM users WHERE invite_code = %s", (code,)):
                return code
        raise RuntimeError("生成邀请码失败：碰撞过多")

    def get_or_create_invite_code(self, username):
        ph = _ph()
        row = self.fetchone(f"SELECT invite_code FROM users WHERE username = {ph}", (username,))
        if row and row.get("invite_code"):
            return row["invite_code"]
        code = self._gen_unique_invite_code()
        self.execute(f"UPDATE users SET invite_code = {ph} WHERE username = {ph} AND (invite_code IS NULL OR invite_code = '')", (code, username))
        return code

    def _bind_referral(self, invitee_username, invite_code):
        ph = _ph()
        inviter = self.fetchone(f"SELECT username FROM users WHERE invite_code = {ph}", (invite_code,))
        if not inviter:
            return  # 邀请码无效，静默忽略
        inviter_username = inviter["username"]
        if inviter_username == invitee_username:
            return  # 防自邀
        # 防重复绑定
        if self.fetchone(f"SELECT 1 FROM referrals WHERE invitee_username = {ph}", (invitee_username,)):
            return
        # 链路回溯防环（上限 10 层）
        cur = inviter_username
        for _ in range(10):
            up = self.fetchone(f"SELECT inviter_username FROM referrals WHERE invitee_username = {ph}", (cur,))
            if not up:
                break
            if up["inviter_username"] == invitee_username:
                return  # 成环，拒绝
            cur = up["inviter_username"]
        self.execute(
            f"INSERT INTO referrals (inviter_username, invitee_username, invite_code) VALUES ({ph}, {ph}, {ph})",
            (inviter_username, invitee_username, invite_code)
        )

    def get_user_by_username(self, username):
        ph = _ph()
        return self.fetchone(f"SELECT * FROM users WHERE username = {ph}", (username,))

    def get_user_by_email(self, email):
        ph = _ph()
        return self.fetchone(f"SELECT * FROM users WHERE email = {ph}", (email,))

    # ==================== 登录锁定 ====================
    def save_login_lock(self, scope, identifier, username="", email="", client_ip="", fail_count=0, locked_until=None, reason=""):
        ph = _ph()
        if locked_until is None:
            locked_until = datetime.now()
        self.execute(
            f"UPDATE login_locks SET unlocked_at = CURRENT_TIMESTAMP WHERE scope = {ph} AND identifier = {ph} AND unlocked_at IS NULL",
            (scope, identifier)
        )
        self.execute(
            f"""INSERT INTO login_locks
                (scope, identifier, username, email, client_ip, fail_count, locked_until, reason)
                VALUES ({ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph})""",
            (scope, identifier, username, email, client_ip, int(fail_count or 0), locked_until, reason)
        )

    def get_active_login_lock(self, scope, identifier):
        ph = _ph()
        return self.fetchone(
            f"""SELECT * FROM login_locks
                WHERE scope = {ph} AND identifier = {ph} AND unlocked_at IS NULL AND locked_until > CURRENT_TIMESTAMP
                ORDER BY locked_until DESC, id DESC LIMIT 1""",
            (scope, identifier)
        )

    def list_active_login_locks(self, scope="user"):
        ph = _ph()
        return self.fetchall(
            f"""SELECT id, scope, identifier, username, email, client_ip, fail_count, locked_until, reason, created_at
                FROM login_locks
                WHERE scope = {ph} AND unlocked_at IS NULL AND locked_until > CURRENT_TIMESTAMP
                ORDER BY locked_until DESC, id DESC""",
            (scope,)
        )

    def unlock_login_lock(self, lock_id):
        ph = _ph()
        self.execute(f"UPDATE login_locks SET unlocked_at = CURRENT_TIMESTAMP WHERE id = {ph}", (lock_id,))

    def cleanup_expired_login_locks(self):
        self.execute("UPDATE login_locks SET unlocked_at = CURRENT_TIMESTAMP WHERE unlocked_at IS NULL AND locked_until <= CURRENT_TIMESTAMP")

    def verify_user_email(self, email):
        ph = _ph()
        self.execute(f"UPDATE users SET is_verified = 1 WHERE email = {ph}", (email,))

    def update_password(self, email, password_hash):
        ph = _ph()
        self.execute(f"UPDATE users SET password_hash = {ph} WHERE email = {ph}", (password_hash, email))

    def get_user_settings(self, username):
        ph = _ph()
        row = self.fetchone(f"SELECT settings_json, updated_at FROM user_settings WHERE username = {ph}", (username,))
        if not row:
            return {}, None
        try:
            settings = json.loads(row.get("settings_json") or "{}")
            if not isinstance(settings, dict):
                settings = {}
        except Exception:
            settings = {}
        return settings, row.get("updated_at")

    def save_user_settings(self, username, settings):
        ph = _ph()
        data = json.dumps(settings or {}, ensure_ascii=False)
        self.execute(
            f"""INSERT INTO user_settings (username, settings_json)
                VALUES ({ph}, {ph})
                ON DUPLICATE KEY UPDATE settings_json=VALUES(settings_json), updated_at=CURRENT_TIMESTAMP""",
            (username, data)
        )

    def get_user_entitlement(self, username):
        ph = _ph()
        row = self.fetchone(
            f"SELECT username, email, is_verified, points_balance, member_until, is_banned, ban_reason, invite_code, commission_balance FROM users WHERE username = {ph}",
            (username,)
        )
        if not row:
            return None
        member_until = row.get("member_until")
        active_member = False
        if member_until:
            try:
                if isinstance(member_until, str):
                    member_dt = datetime.strptime(member_until.split(".")[0], "%Y-%m-%d %H:%M:%S")
                else:
                    member_dt = member_until
                active_member = datetime.now() < member_dt
            except Exception:
                active_member = False
        row["points_balance"] = int(row.get("points_balance") or 0)
        row["is_banned"] = bool(row.get("is_banned"))
        row["active_member"] = active_member
        row["commission_balance"] = float(row.get("commission_balance") or 0)
        return row

    def grant_registration_gift(self, username):
        admin = self.get_admin_config() or {}
        gift_type = (admin.get("gift_type") or "none").strip()
        if gift_type == "points":
            points = int(admin.get("gift_points") or 0)
            if points > 0:
                self.adjust_user_points(username, points, "注册赠送点数")
        elif gift_type == "monthly":
            days = int(admin.get("gift_days") or 0)
            if days > 0:
                self.extend_user_membership(username, days, "注册赠送包月")

    def list_payment_plans(self, only_enabled=False):
        where = "WHERE enabled = 1" if only_enabled else ""
        rows = self.fetchall(f"SELECT * FROM payment_plans {where} ORDER BY sort_order ASC, id ASC")
        for row in rows:
            row["enabled"] = bool(row.get("enabled"))
            row["points"] = int(row.get("points") or 0)
            row["days"] = int(row.get("days") or 0)
            row["sort_order"] = int(row.get("sort_order") or 0)
            try:
                row["price"] = float(row.get("price") or 0)
            except Exception:
                row["price"] = 0
        return rows

    def get_payment_plan(self, plan_id):
        ph = _ph()
        return self.fetchone(f"SELECT * FROM payment_plans WHERE id = {ph}", (plan_id,))

    def save_payment_plan(self, plan):
        ph = _ph()
        plan_id = plan.get("id")
        values = (
            plan.get("name", "").strip(),
            plan.get("plan_type", "points"),
            float(plan.get("price") or 0),
            int(plan.get("points") or 0),
            int(plan.get("days") or 0),
            1 if plan.get("enabled", True) else 0,
            int(plan.get("sort_order") or 0)
        )
        if plan_id:
            self.execute(
                f"""UPDATE payment_plans SET name={ph}, plan_type={ph}, price={ph}, points={ph}, days={ph}, enabled={ph}, sort_order={ph}
                    WHERE id={ph}""",
                values + (int(plan_id),)
            )
            return int(plan_id)
        cursor = self.execute(
            f"""INSERT INTO payment_plans (name, plan_type, price, points, days, enabled, sort_order)
                VALUES ({ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph})""",
            values
        )
        try:
            return cursor.lastrowid
        except Exception:
            row = self.fetchone("SELECT MAX(id) AS id FROM payment_plans")
            return int(row.get("id") or 0)

    def delete_payment_plan(self, plan_id):
        ph = _ph()
        self.execute(f"DELETE FROM payment_plans WHERE id = {ph}", (int(plan_id),))

    def set_payment_plan_enabled(self, plan_id, enabled):
        ph = _ph()
        self.execute(f"UPDATE payment_plans SET enabled = {ph} WHERE id = {ph}", (1 if enabled else 0, int(plan_id)))

    def create_paid_order_and_apply(self, username, plan):
        ph = _ph()
        order_no = f"ORD{int(time.time()*1000)}{abs(hash(username)) % 10000:04d}"
        self.execute(
            f"""INSERT INTO payment_orders (order_no, username, plan_id, plan_name, plan_type, price, points, days, status, paid_at)
                VALUES ({ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, 'paid', CURRENT_TIMESTAMP)""",
            (
                order_no, username, int(plan.get("id") or 0), plan.get("name", ""),
                plan.get("plan_type", ""), float(plan.get("price") or 0),
                int(plan.get("points") or 0), int(plan.get("days") or 0)
            )
        )
        self.apply_paid_order(order_no)
        return order_no

    def create_pending_order(self, username, plan, pay_method="alipay", pay_channel="", trade_no="", qr_code="", pay_url="", order_no=None):
        ph = _ph()
        if not order_no:
            order_no = f"ORD{int(time.time()*1000)}{abs(hash(username)) % 10000:04d}"
        self.execute(
            f"""INSERT INTO payment_orders (order_no, username, plan_id, plan_name, plan_type, price, points, days, status, pay_method, pay_channel, trade_no, qr_code, pay_url)
                VALUES ({ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, 'pending', {ph}, {ph}, {ph}, {ph}, {ph})""",
            (
                order_no, username, int(plan.get("id") or 0), plan.get("name", ""),
                plan.get("plan_type", ""), float(plan.get("price") or 0),
                int(plan.get("points") or 0), int(plan.get("days") or 0),
                pay_method, pay_channel, trade_no, qr_code, pay_url
            )
        )
        return order_no

    def get_order(self, order_no):
        ph = _ph()
        return self.fetchone(f"SELECT * FROM payment_orders WHERE order_no = {ph}", (order_no,))

    def update_order_payment(self, order_no, trade_no="", qr_code="", status=None, pay_url=""):
        ph = _ph()
        sets = []
        params = []
        if trade_no:
            sets.append(f"trade_no = {ph}")
            params.append(trade_no)
        if qr_code:
            sets.append(f"qr_code = {ph}")
            params.append(qr_code)
        if pay_url:
            sets.append(f"pay_url = {ph}")
            params.append(pay_url)
        if status:
            sets.append(f"status = {ph}")
            params.append(status)
        if not sets:
            return
        params.append(order_no)
        self.execute(f"UPDATE payment_orders SET {', '.join(sets)} WHERE order_no = {ph}", tuple(params))

    def apply_paid_order(self, order_no):
        ph = _ph()
        order = self.get_order(order_no)
        if not order:
            return False, "订单不存在"
        if order.get("status") == "paid":
            return True, "订单已到账"
        if order.get("status") not in ("pending", "created"):
            return False, "订单状态不可到账"
        # 安全：原子性抢占订单，防止重复回调双倍到账
        cur = self.execute(
            f"UPDATE payment_orders SET status = 'paying', paid_at = CURRENT_TIMESTAMP WHERE order_no = {ph} AND status IN ({ph}, {ph})",
            (order_no, "pending", "created")
        )
        if not cur or cur.rowcount == 0:
            # 被其他请求抢先处理了
            return True, "订单正在处理中"
        if order.get("plan_type") == "monthly":
            self.extend_user_membership(order["username"], int(order.get("days") or 30), f"购买套餐：{order.get('plan_name','包月套餐')}")
        else:
            self.adjust_user_points(order["username"], int(order.get("points") or 0), f"购买套餐：{order.get('plan_name','点数套餐')}")
        self.execute(f"UPDATE payment_orders SET status = 'paid' WHERE order_no = {ph}", (order_no,))
        # 推广返利：首单佣金结算（仅付费订单 price>0 触发）
        try:
            price = float(order.get("price") or 0)
            if price > 0:
                self._settle_first_order_commission(order["username"], order_no, price)
        except Exception as e:
            print(f"[推广返利] 佣金结算失败 order={order_no}: {e}", flush=True)
        return True, "支付成功，权益已到账"

    def adjust_user_points(self, username, delta, reason="", question_hash=""):
        ph = _ph()
        delta = int(delta or 0)
        row = self.get_user_entitlement(username)
        if not row:
            return False, "用户不存在"
        if delta < 0:
            # 安全：扣点用原子操作，防止竞态条件导致超额扣点或免费答题
            cur = self.execute(f"UPDATE users SET points_balance = points_balance + {ph} WHERE username = {ph} AND points_balance >= {ph}",
                               (delta, username, abs(delta)))
            if not cur or cur.rowcount == 0:
                return False, "题数余额不足"
            # 读取扣点后的余额
            row2 = self.get_user_entitlement(username)
            new_balance = int(row2.get("points_balance") or 0) if row2 else 0
        else:
            new_balance = max(0, int(row.get("points_balance") or 0) + delta)
            self.execute(f"UPDATE users SET points_balance = points_balance + {ph} WHERE username = {ph}", (delta, username))
        self.execute(
            f"INSERT INTO usage_logs (username, delta_points, balance_after, reason, question_hash) VALUES ({ph}, {ph}, {ph}, {ph}, {ph})",
            (username, delta, new_balance, reason, question_hash)
        )
        return True, new_balance

    def extend_user_membership(self, username, days, reason=""):
        ph = _ph()
        row = self.get_user_entitlement(username)
        if not row:
            return False, "用户不存在"
        days = int(days or 0)
        base = datetime.now()
        current = row.get("member_until")
        try:
            if current:
                current_dt = datetime.strptime(current.split(".")[0], "%Y-%m-%d %H:%M:%S") if isinstance(current, str) else current
                if current_dt > base:
                    base = current_dt
        except Exception:
            pass
        until = base + timedelta(days=max(0, days))
        self.execute(f"UPDATE users SET member_until = {ph} WHERE username = {ph}", (until, username))
        return True, until

    def set_user_member_until(self, username, member_until):
        ph = _ph()
        value = None
        if member_until:
            if isinstance(member_until, datetime):
                value = member_until
            else:
                text = str(member_until).strip().replace("T", " ")
                if len(text) == 16:
                    text += ":00"
                value = datetime.strptime(text.split(".")[0], "%Y-%m-%d %H:%M:%S")
        self.execute(f"UPDATE users SET member_until = {ph} WHERE username = {ph}", (value, username))
        return True, value

    def set_user_admin_fields(self, username, email=None, password=None, is_banned=None, ban_reason=None):
        ph = _ph()
        updates = []
        params = []
        if email is not None:
            updates.append(f"email = {ph}")
            params.append(email)
        if password:
            updates.append(f"password_hash = {ph}")
            params.append(hash_password(password))
        if is_banned is not None:
            updates.append(f"is_banned = {ph}")
            params.append(1 if is_banned else 0)
        if ban_reason is not None:
            updates.append(f"ban_reason = {ph}")
            params.append(ban_reason)
        if not updates:
            return
        params.append(username)
        self.execute(f"UPDATE users SET {', '.join(updates)} WHERE username = {ph}", tuple(params))

    def list_orders(self, username="", limit=50):
        ph = _ph()
        if username:
            return self.fetchall(f"SELECT * FROM payment_orders WHERE username = {ph} ORDER BY id DESC LIMIT {int(limit)}", (username,))
        return self.fetchall(f"SELECT * FROM payment_orders ORDER BY id DESC LIMIT {int(limit)}")

    def list_payment_orders_admin(self, username="", status="", plan_name="", date_from="", date_to="", sort="created_at", order="desc", page=1, page_size=20):
        """管理员支付明细查询，支持筛选/排序/分页"""
        ph = _ph()
        where = []
        params = []
        if username:
            where.append(f"username LIKE {ph}")
            params.append(f"%{username}%")
        if status:
            where.append(f"status = {ph}")
            params.append(status)
        if plan_name:
            where.append(f"plan_name = {ph}")
            params.append(plan_name)
        if date_from:
            where.append(f"DATE(created_at) >= {ph}")
            params.append(date_from)
        if date_to:
            where.append(f"DATE(created_at) <= {ph}")
            params.append(date_to)
        where_clause = (" WHERE " + " AND ".join(where)) if where else ""
        # 安全排序字段
        allowed_sorts = {"created_at": "created_at", "price": "price", "username": "username", "status": "status", "order_no": "order_no", "id": "id"}
        sort_field = allowed_sorts.get(sort, "created_at")
        order_dir = "ASC" if order.lower() == "asc" else "DESC"
        offset = (max(1, int(page)) - 1) * int(page_size)
        total_row = self.fetchone(f"SELECT COUNT(*) AS cnt FROM payment_orders{where_clause}", params) or {}
        total = int(total_row.get("cnt") or 0)
        rows = self.fetchall(
            f"SELECT * FROM payment_orders{where_clause} ORDER BY {sort_field} {order_dir} LIMIT {int(page_size)} OFFSET {offset}",
            params
        )
        # 统计金额合计
        sum_row = self.fetchone(f"SELECT COALESCE(SUM(price),0) AS total_amount, COUNT(*) AS cnt FROM payment_orders{where_clause}", params) or {}
        return {
            "rows": rows or [],
            "total": total,
            "page": int(page),
            "page_size": int(page_size),
            "total_pages": (total + int(page_size) - 1) // int(page_size),
            "sum_amount": float(sum_row.get("total_amount") or 0),
            "sum_count": int(sum_row.get("cnt") or 0)
        }

    # ==================== 验证码相关 ====================
    def save_verify_code(self, email, code, vtype, expires_minutes=10):
        """保存验证码，默认10分钟过期"""
        ph = _ph()
        expires = datetime.now() + timedelta(minutes=expires_minutes)
        self.execute(
            f"DELETE FROM verify_codes WHERE email = {ph} AND type = {ph}",
            (email, vtype)
        )
        self.execute(
            f"INSERT INTO verify_codes (email, code, type, expires_at) VALUES ({ph}, {ph}, {ph}, {ph})",
            (email, code, vtype, expires)
        )

    def check_verify_code(self, email, code, vtype):
        """验证验证码是否正确且未过期"""
        ph = _ph()
        row = self.fetchone(
            f"SELECT * FROM verify_codes WHERE email = {ph} AND code = {ph} AND type = {ph}",
            (email, code, vtype)
        )
        if not row:
            return False, "验证码错误或已过期"
        expires = row["expires_at"]
        if datetime.now() > expires:
            return False, "验证码已过期"
        # 验证成功后删除
        self.execute(f"DELETE FROM verify_codes WHERE email = {ph} AND type = {ph}", (email, vtype))
        return True, None

    # ==================== 管理员相关 ====================
    def get_admin_config(self):
        return self.fetchone("SELECT * FROM admin_config WHERE id = 1")

    def update_admin_password(self, password_hash):
        ph = _ph()
        self.execute(f"UPDATE admin_config SET password = {ph} WHERE id = 1", (password_hash,))

    def update_admin_account(self, username=None, admin_email=None, avatar_data=None):
        ph = _ph()
        updates = []
        params = []
        if username is not None:
            updates.append(f"username = {ph}")
            params.append((username or "admin").strip() or "admin")
        if admin_email is not None:
            updates.append(f"admin_email = {ph}")
            params.append((admin_email or "").strip())
        if avatar_data is not None:
            updates.append(f"avatar_data = {ph}")
            params.append((avatar_data or "").strip())
        if updates:
            self.execute(f"UPDATE admin_config SET {', '.join(updates)} WHERE id = 1", tuple(params))

    # ==================== 脚本日志 ====================
    def insert_script_event_logs(self, items, username="", client_ip="", user_agent=""):
        if not items:
            return 0
        ph = _ph()
        count = 0
        for item in items[:100]:
            event_type = item.get("event_type", "log")
            level = item.get("level", "")
            message = str(item.get("message", ""))[:4000]
            page_url = str(item.get("page_url", ""))[:1000]
            # 兜底降噪：低价值心跳类日志 60 秒内同用户、同页面、同消息只保留 1 条。
            if event_type in ("heartbeat", "external_page", "reading") and (message in ("直播保活", "直播页面播放/保活中", "阅读页自动浏览中", "新页面媒体任务播放中") or message.startswith("直播保活：")):
                recent = self.fetchone(
                    f"""SELECT id FROM script_event_logs
                        WHERE username = {ph} AND event_type = {ph} AND message = {ph} AND page_url = {ph}
                          AND created_at >= DATE_SUB(NOW(), INTERVAL 60 SECOND)
                        ORDER BY id DESC LIMIT 1""",
                    (username or item.get("username", ""), event_type, message, page_url)
                )
                if recent:
                    continue
            extra = item.get("extra")
            if extra is not None and not isinstance(extra, str):
                extra = json.dumps(extra, ensure_ascii=False)
            self.execute(
                f"""INSERT INTO script_event_logs
                    (username, event_type, level, message, page_url, course_id, task_id, client_ip, user_agent, extra_json)
                    VALUES ({ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph})""",
                (
                    username or item.get("username", ""),
                    event_type,
                    level,
                    message,
                    page_url,
                    str(item.get("course_id", ""))[:100],
                    str(item.get("task_id", ""))[:100],
                    client_ip,
                    user_agent[:500],
                    extra
                )
            )
            count += 1
        return count

    def get_script_event_logs(self, limit=100, page=1, username="", level="", keyword="", date_from="", date_to=""):
        ph = _ph()
        limit = min(max(int(limit or 100), 1), 500)
        page = max(int(page or 1), 1)
        where, params = [], []
        if username:
            where.append(f"username = {ph}")
            params.append(username)
        if level:
            where.append(f"level = {ph}")
            params.append(level)
        if keyword:
            like = f"%{keyword}%"
            where.append(f"(message LIKE {ph} OR page_url LIKE {ph})")
            params.extend([like, like])
        if date_from:
            where.append(f"created_at >= {ph}")
            params.append(date_from)
        if date_to:
            where.append(f"created_at <= {ph}")
            params.append(date_to)
        sql = "SELECT id, username, event_type, level, message, page_url, course_id, task_id, client_ip, extra_json, created_at FROM script_event_logs"
        if where:
            sql += " WHERE " + " AND ".join(where)
        sql += " ORDER BY created_at DESC, id DESC"
        offset = (page - 1) * limit
        sql += f" LIMIT {ph} OFFSET {ph}"
        params.extend([limit, offset])
        return self.fetchall(sql, tuple(params))

    def count_script_event_logs(self, username="", level="", keyword="", date_from="", date_to=""):
        ph = _ph()
        where, params = [], []
        if username:
            where.append(f"username = {ph}")
            params.append(username)
        if level:
            where.append(f"level = {ph}")
            params.append(level)
        if keyword:
            like = f"%{keyword}%"
            where.append(f"(message LIKE {ph} OR page_url LIKE {ph})")
            params.extend([like, like])
        if date_from:
            where.append(f"created_at >= {ph}")
            params.append(date_from)
        if date_to:
            where.append(f"created_at <= {ph}")
            params.append(date_to)
        sql = "SELECT COUNT(*) AS total FROM script_event_logs"
        if where:
            sql += " WHERE " + " AND ".join(where)
        row = self.fetchone(sql, tuple(params))
        return int(row.get("total", 0) if row else 0)

    def update_admin_email(self, cfg):
        ph = _ph()
        self.execute(
            f"""UPDATE admin_config SET
                smtp_host = {ph}, smtp_port = {ph}, smtp_user = {ph},
                smtp_pass = {ph}, from_addr = {ph}, test_recipient = {ph}, email_enabled = {ph}
            WHERE id = 1""",
            (cfg.get("smtp_host", ""), cfg.get("smtp_port", 587),
             cfg.get("smtp_user", ""), cfg.get("smtp_pass", ""),
             cfg.get("from_addr", ""), cfg.get("test_recipient", ""),
             1 if cfg.get("enabled") else 0)
        )

    def get_providers(self):
        ph = _ph()
        provider_rows = self.fetchall("SELECT * FROM ai_providers ORDER BY provider_key ASC")
        if provider_rows:
            model_rows = self.fetchall("SELECT * FROM ai_models ORDER BY provider_key ASC, sort_order ASC, id ASC")
            models_map = {}
            for m in model_rows:
                models_map.setdefault(m["provider_key"], []).append({
                    "value": m.get("model_value", ""),
                    "label": m.get("model_label", ""),
                    "weight": int(m.get("weight", 100) or 100),
                    "daily_token_limit": int(m.get("daily_token_limit", 0) or 0)
                })
            providers = {}
            for p in provider_rows:
                key = p["provider_key"]
                providers[key] = {
                    "enabled": bool(p.get("enabled")),
                    "title": p.get("title", ""),
                    "protocol": p.get("protocol", "openai"),
                    "api_key": p.get("api_key", ""),
                    "base_url": p.get("base_url", ""),
                    "models": models_map.get(key, [])
                }
            return providers

        # 兼容旧版 JSON 配置表
        row = self.fetchone(f"SELECT data FROM providers_config WHERE id = {ph}", (1,))
        if row and row.get("data"):
            try:
                return json.loads(row["data"])
            except Exception:
                return None
        return None

    def save_providers(self, data):
        ph = _ph()
        # 写入结构化 AI 表
        self.execute("DELETE FROM ai_models")
        self.execute("DELETE FROM ai_providers")
        for provider_key, info in (data or {}).items():
            self.execute(
                f"""INSERT INTO ai_providers
                    (provider_key, title, protocol, api_key, base_url, enabled)
                    VALUES ({ph}, {ph}, {ph}, {ph}, {ph}, {ph})""",
                (
                    provider_key,
                    info.get("title", provider_key),
                    info.get("protocol", "openai"),
                    info.get("api_key", ""),
                    info.get("base_url", ""),
                    1 if info.get("enabled") else 0
                )
            )
            for idx, model in enumerate(info.get("models", []) or []):
                if not model.get("value") and not model.get("label"):
                    continue
                self.execute(
                    f"""INSERT INTO ai_models
                        (provider_key, model_value, model_label, weight, daily_token_limit, sort_order)
                        VALUES ({ph}, {ph}, {ph}, {ph}, {ph}, {ph})""",
                    (
                        provider_key,
                        model.get("value", ""),
                        model.get("label", ""),
                        int(model.get("weight", 100) or 100),
                        int(model.get("daily_token_limit", 0) or 0),
                        idx
                    )
                )

        # 兼容保留 JSON 备份表
        self.execute(f"UPDATE providers_config SET data = {ph} WHERE id = 1", (json.dumps(data, ensure_ascii=False),))

    # ==================== AI 调用日志 ====================
    def save_ai_call_log(self, log):
        ph = _ph()
        self.execute(
            f"""INSERT INTO ai_call_logs
                (provider_key, username, model, question, answer, status, error, duration_ms, client_ip)
                VALUES ({ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph})""",
            (
                log.get("provider_key", ""),
                log.get("username", ""),
                log.get("model", ""),
                log.get("question", ""),
                log.get("answer", ""),
                log.get("status", "unknown"),
                log.get("error", ""),
                int(log.get("duration_ms") or 0),
                log.get("client_ip", ""),
            )
        )

    def add_model_token_usage(self, model_name, tokens):
        """记录模型 token 消耗（按天汇总，UPSERT）"""
        ph = _ph()
        today = datetime.now().strftime("%Y-%m-%d")
        self.execute(
            f"""INSERT INTO model_token_usage (model_name, usage_date, total_tokens, call_count)
                VALUES ({ph}, {ph}, {ph}, 1)
                ON DUPLICATE KEY UPDATE
                total_tokens = total_tokens + VALUES(total_tokens),
                call_count = call_count + 1""",
            (model_name, today, int(tokens or 0))
        )

    def get_model_token_usage_today(self):
        """获取今天的模型 token 消耗"""
        rows = self.fetchall(
            "SELECT model_name, total_tokens, call_count FROM model_token_usage WHERE usage_date = CURDATE()"
        )
        return {r["model_name"]: {"tokens": int(r.get("total_tokens") or 0), "calls": int(r.get("call_count") or 0)} for r in rows}

    def get_model_token_usage_range(self, start_date, end_date):
        """获取时间范围内的模型 token 消耗汇总"""
        ph = _ph()
        rows = self.fetchall(
            f"""SELECT model_name,
                       SUM(total_tokens) AS total_tokens,
                       SUM(call_count) AS call_count,
                       MAX(usage_date) AS last_used
                FROM model_token_usage
                WHERE usage_date >= {ph} AND usage_date <= {ph}
                GROUP BY model_name
                ORDER BY total_tokens DESC""",
            (start_date, end_date)
        )
        return rows

    def _build_ai_log_where(self, status="", model="", keyword="", date_from="", date_to=""):
        ph = _ph()
        where = []
        params = []
        if status:
            where.append(f"status = {ph}")
            params.append(status)
        if model:
            where.append(f"model = {ph}")
            params.append(model)
        if keyword:
            like = f"%{keyword}%"
            where.append(f"(question LIKE {ph} OR answer LIKE {ph} OR error LIKE {ph})")
            params.extend([like, like, like])
        if date_from:
            where.append(f"created_at >= {ph}")
            params.append(date_from)
        if date_to:
            where.append(f"created_at <= {ph}")
            params.append(date_to)
        return where, params

    def get_ai_call_logs(self, limit=100, status="", model="", keyword="", date_from="", date_to="", page=1):
        ph = _ph()
        try:
            limit = int(limit)
        except Exception:
            limit = 100
        try:
            page = int(page)
        except Exception:
            page = 1
        limit = max(1, min(limit, 200))
        page = max(1, page)
        offset = (page - 1) * limit
        where, params = self._build_ai_log_where(status, model, keyword, date_from, date_to)
        sql = "SELECT id, provider_key, model, question, answer, status, error, duration_ms, client_ip, created_at FROM ai_call_logs"
        if where:
            sql += " WHERE " + " AND ".join(where)
        sql += " ORDER BY id DESC"
        sql += f" LIMIT {ph} OFFSET {ph}"
        params.extend([limit, offset])
        return self.fetchall(sql, tuple(params))

    def count_ai_call_logs(self, status="", model="", keyword="", date_from="", date_to=""):
        where, params = self._build_ai_log_where(status, model, keyword, date_from, date_to)
        sql = "SELECT COUNT(*) AS total FROM ai_call_logs"
        if where:
            sql += " WHERE " + " AND ".join(where)
        row = self.fetchone(sql, tuple(params))
        return int(row.get("total", 0) if row else 0)

    def clear_ai_call_logs(self, status="", model="", keyword="", date_from="", date_to=""):
        where, params = self._build_ai_log_where(status, model, keyword, date_from, date_to)
        sql = "DELETE FROM ai_call_logs"
        if where:
            sql += " WHERE " + " AND ".join(where)
        self.execute(sql, tuple(params))

    # ==================== 题库中心 ====================
    def get_question_answer_by_hash(self, question_hash):
        ph = _ph()
        row = self.fetchone(f"SELECT * FROM question_bank WHERE question_hash = {ph}", (question_hash,))
        if row:
            self.execute(
                f"UPDATE question_bank SET hit_count = hit_count + 1, last_used_at = CURRENT_TIMESTAMP WHERE id = {ph}",
                (row["id"],)
            )
        return row

    def search_question_bank(self, keyword="", question_hash="", limit=100, page=1):
        ph = _ph()
        try:
            limit = int(limit)
        except Exception:
            limit = 100
        try:
            page = int(page)
        except Exception:
            page = 1
        limit = max(1, min(limit, 200))
        page = max(1, page)
        offset = (page - 1) * limit
        where = []
        params = []
        if question_hash:
            where.append(f"question_hash = {ph}")
            params.append(question_hash)
        if keyword:
            # 优先使用全文索引（MATCH AGAINST），大幅提升大数据量搜索性能
            # ngram 分词器支持中文，2字以上可命中
            kw = keyword.strip()
            if len(kw) >= 2:
                where.append(f"(MATCH(question_text, answer) AGAINST({ph} IN BOOLEAN MODE) OR options_text LIKE {ph})")
                params.extend([kw, f"%{kw}%"])
            else:
                like = f"%{kw}%"
                where.append(f"(question_text LIKE {ph} OR options_text LIKE {ph} OR answer LIKE {ph})")
                params.extend([like, like, like])
        sql = "SELECT id, question_hash, question_text, question_type, options_text, answer, source_model, source_provider, hit_count, created_at, updated_at, last_used_at FROM question_bank"
        if where:
            sql += " WHERE " + " AND ".join(where)
        sql += " ORDER BY updated_at DESC, id DESC"
        sql += f" LIMIT {ph} OFFSET {ph}"
        params.extend([limit, offset])
        return self.fetchall(sql, tuple(params))

    def count_question_bank(self, keyword="", question_hash=""):
        ph = _ph()
        where = []
        params = []
        if question_hash:
            where.append(f"question_hash = {ph}")
            params.append(question_hash)
        if keyword:
            kw = keyword.strip()
            if len(kw) >= 2:
                where.append(f"(MATCH(question_text, answer) AGAINST({ph} IN BOOLEAN MODE) OR options_text LIKE {ph})")
                params.extend([kw, f"%{kw}%"])
            else:
                like = f"%{kw}%"
                where.append(f"(question_text LIKE {ph} OR options_text LIKE {ph} OR answer LIKE {ph})")
                params.extend([like, like, like])
        sql = "SELECT COUNT(*) AS total FROM question_bank"
        if where:
            sql += " WHERE " + " AND ".join(where)
        row = self.fetchone(sql, tuple(params))
        return int(row.get("total", 0) if row else 0)

    def upsert_question_bank(self, item):
        ph = _ph()
        self.execute(
            f"""INSERT INTO question_bank
                (question_hash, question_text, question_type, options_text, answer, source_model, source_provider, hit_count, last_used_at)
                VALUES ({ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, 0, CURRENT_TIMESTAMP)
                ON DUPLICATE KEY UPDATE
                answer=VALUES(answer), source_model=VALUES(source_model), source_provider=VALUES(source_provider),
                options_text=VALUES(options_text), question_type=VALUES(question_type), updated_at=CURRENT_TIMESTAMP""",
            (
                item.get("question_hash", ""), item.get("question_text", ""), item.get("question_type", ""),
                item.get("options_text", ""), item.get("answer", ""), item.get("source_model", ""), item.get("source_provider", "")
            )
        )

    # ==================== AI 持久化缓存 ====================

    def get_ai_cache(self, cache_key):
        """从数据库获取 AI 缓存"""
        ph = _ph()
        row = self.fetchone(
            f"SELECT cache_key, answer, model, provider, hit_count FROM ai_cache WHERE cache_key = {ph}",
            (cache_key,)
        )
        if row:
            self.execute(
                f"UPDATE ai_cache SET hit_count = hit_count + 1, last_used_at = CURRENT_TIMESTAMP WHERE cache_key = {ph}",
                (cache_key,)
            )
            return row
        return None

    def set_ai_cache(self, cache_key, answer, model="", provider=""):
        """写入或更新 AI 缓存到数据库"""
        ph = _ph()
        self.execute(
            f"""INSERT INTO ai_cache (cache_key, answer, model, provider, hit_count)
                VALUES ({ph}, {ph}, {ph}, {ph}, 0)
                ON DUPLICATE KEY UPDATE answer=VALUES(answer), model=VALUES(model), provider=VALUES(provider), hit_count=hit_count+1""",
            (cache_key, answer, model, provider)
        )

    def cleanup_expired_ai_cache(self, days=30):
        """清理过期的 AI 缓存"""
        ph = _ph()
        self.execute(
            f"DELETE FROM ai_cache WHERE last_used_at < DATE_SUB(NOW(), INTERVAL {ph} DAY)",
            (days,)
        )

    # ==================== 邮件模板 ====================

    def list_email_templates(self):
        """列出所有邮件模板"""
        return self.fetchall("SELECT id, scene, subject, body_text, body_html, content_type, variables, created_at, updated_at FROM email_templates ORDER BY updated_at DESC")

    def get_email_template(self, template_id):
        """获取单个邮件模板"""
        ph = _ph()
        row = self.fetchone(f"SELECT * FROM email_templates WHERE id = {ph}", (template_id,))
        return row

    def get_email_template_by_scene(self, scene):
        """根据场景获取邮件模板"""
        ph = _ph()
        return self.fetchone(f"SELECT * FROM email_templates WHERE scene = {ph}", (scene,))

    def create_email_template(self, scene, subject, body_text, body_html, content_type, variables):
        """创建邮件模板（同场景禁止重复）"""
        ph = _ph()
        existing = self.fetchone(f"SELECT id FROM email_templates WHERE scene = {ph}", (scene,))
        if existing:
            raise ValueError("该应用场景的模板已存在，请直接编辑")
        self.execute(
            f"INSERT INTO email_templates (scene, subject, body_text, body_html, content_type, variables) "
            f"VALUES ({ph}, {ph}, {ph}, {ph}, {ph}, {ph})",
            (scene, subject, body_text, body_html, content_type, variables)
        )
        row = self.fetchone(f"SELECT id FROM email_templates WHERE scene = {ph}", (scene,))
        return row["id"] if row else None

    def update_email_template(self, template_id, scene, subject, body_text, body_html, content_type, variables):
        """更新邮件模板"""
        ph = _ph()
        self.execute(
            f"UPDATE email_templates SET scene={ph}, subject={ph}, body_text={ph}, body_html={ph}, content_type={ph}, variables={ph} WHERE id={ph}",
            (scene, subject, body_text, body_html, content_type, variables, template_id)
        )

    def delete_email_template(self, template_id):
        """删除邮件模板"""
        ph = _ph()
        self.execute(f"DELETE FROM email_templates WHERE id = {ph}", (template_id,))

    def cleanup_old_logs(self, days):
        """删除超过指定天数的日志数据，返回各表删除条数"""
        ph = _ph()
        if not days or int(days) <= 0:
            return {}
        days = int(days)
        result = {}
        tables = [
            ("ai_call_logs", "created_at"),
            ("script_event_logs", "created_at"),
            ("usage_logs", "created_at"),
        ]
        for table, col in tables:
            try:
                sql = f"DELETE FROM {table} WHERE {col} < DATE_SUB(NOW(), INTERVAL {ph} DAY)"
                cur = self.execute(sql, (days,))
                result[table] = cur.rowcount if cur else 0
            except Exception as e:
                print(f"[日志清理] 清理 {table} 失败: {e}", flush=True)
                result[table] = -1
        return result

    def get_log_retention_days(self):
        row = self.fetchone("SELECT log_retention_days FROM admin_config WHERE id = 1")
        return int(row.get("log_retention_days") or 0) if row else 0

    def set_log_retention_days(self, days):
        ph = _ph()
        self.execute(f"UPDATE admin_config SET log_retention_days = {ph} WHERE id = 1", (int(days),))

    def clear_question_bank(self, keyword=""):
        ph = _ph()
        if keyword:
            like = f"%{keyword}%"
            self.execute(
                f"DELETE FROM question_bank WHERE question_text LIKE {ph} OR options_text LIKE {ph} OR answer LIKE {ph}",
                (like, like, like)
            )
        else:
            self.execute("DELETE FROM question_bank")

    def get_user_dashboard(self, username):
        ph = _ph()
        result = {}

        # 1. 答题统计（优先从 ai_call_logs，同时合并 script_event_logs 中的答题记录）
        usage_sql = f"""
            SELECT
                COUNT(*) AS total,
                SUM(CASE WHEN status='success' THEN 1 ELSE 0 END) AS success,
                SUM(CASE WHEN status='success' AND COALESCE(provider_key,'')='question_bank' THEN 1 ELSE 0 END) AS bank_hits,
                SUM(CASE WHEN status='success' AND COALESCE(provider_key,'')<>'question_bank' THEN 1 ELSE 0 END) AS ai_answers,
                SUM(CASE WHEN COALESCE(provider_key,'')<>'question_bank' THEN 1 ELSE 0 END) AS ai_calls
            FROM ai_call_logs WHERE username = {ph}
        """
        row = self.fetchone(usage_sql, (username,))
        ai_total = 0
        ai_bank = 0
        ai_ai_ans = 0
        ai_calls = 0
        if row:
            ai_total = int(row.get('total') or 0)
            ai_bank = int(row.get('bank_hits') or 0)
            ai_ai_ans = int(row.get('ai_answers') or 0)
            ai_calls = int(row.get('ai_calls') or 0)
        # 从 script_event_logs 补充答题统计（包含"答题""提交成功"等关键词的日志）
        script_ans_sql = f"""
            SELECT COUNT(*) AS cnt,
                   SUM(CASE WHEN message LIKE '%%题库%%' OR message LIKE '%%命中%%' THEN 1 ELSE 0 END) AS bank_cnt
            FROM script_event_logs
            WHERE username = {ph} AND (message LIKE '%%答题%%' OR message LIKE '%%提交成功%%' OR message LIKE '%%解析%%道题目%%')
        """
        row2 = self.fetchone(script_ans_sql, (username,))
        script_ans = int(row2.get('cnt') or 0) if row2 else 0
        script_bank = int(row2.get('bank_cnt') or 0) if row2 else 0
        total_answers = ai_total + script_ans
        total_bank = ai_bank + script_bank
        total_ai = ai_ai_ans
        result['usage'] = {
            'total_answers': total_answers,
            'bank_hits': total_bank,
            'ai_answers': total_ai,
            'bank_hit_rate': round(total_bank * 100.0 / total_answers, 1) if total_answers > 0 else 0,
            'ai_calls': ai_calls,
            'ai_success': total_ai,
        }

        # 2. 今日活动（从 script_event_logs，按 message 关键词分类）
        # 不使用 CONVERT_TZ，直接用 DATE(created_at) = CURDATE()，兼容所有 MySQL 版本
        today_sql = f"""
            SELECT
                SUM(CASE WHEN message LIKE '%%测验%%' OR message LIKE '%%作业%%' OR message LIKE '%%答题%%' OR message LIKE '%%提交%%' OR message LIKE '%%解析%%道题目%%' THEN 1 ELSE 0 END) AS answers,
                SUM(CASE WHEN message LIKE '%%视频%%' OR message LIKE '%%播放%%' THEN 1 ELSE 0 END) AS videos,
                SUM(CASE WHEN message LIKE '%%直播%%' THEN 1 ELSE 0 END) AS lives,
                SUM(CASE WHEN message LIKE '%%试卷%%' OR message LIKE '%%交卷%%' OR message LIKE '%%考试%%' THEN 1 ELSE 0 END) AS exams,
                SUM(CASE WHEN message LIKE '%%PPT%%' OR message LIKE '%%电子书%%' OR message LIKE '%%阅读%%' THEN 1 ELSE 0 END) AS readings
            FROM script_event_logs
            WHERE username = {ph} AND DATE(created_at) = CURDATE()
        """
        row = self.fetchone(today_sql, (username,))
        if row:
            result['today'] = {
                'answers': int(row.get('answers') or 0),
                'videos': int(row.get('videos') or 0),
                'lives': int(row.get('lives') or 0),
                'exams': int(row.get('exams') or 0),
                'readings': int(row.get('readings') or 0),
            }
        else:
            result['today'] = {'answers': 0, 'videos': 0, 'lives': 0, 'exams': 0, 'readings': 0}

        # 3. 7天答题趋势（合并 ai_call_logs 和 script_event_logs）
        trend_sql = f"""
            SELECT
                DATE(created_at) AS day,
                SUM(CASE WHEN status='success' AND COALESCE(provider_key,'')='question_bank' THEN 1 ELSE 0 END) AS bank,
                SUM(CASE WHEN status='success' AND COALESCE(provider_key,'')<>'question_bank' THEN 1 ELSE 0 END) AS ai
            FROM ai_call_logs
            WHERE username = {ph} AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
            GROUP BY DATE(created_at)
            ORDER BY day ASC
        """
        rows = self.fetchall(trend_sql, (username,))
        result['answers_7d'] = [
            {'date': str(r.get('day', ''))[5:10], 'bank': int(r.get('bank') or 0), 'ai': int(r.get('ai') or 0)}
            for r in (rows or [])
        ]

        # 4. 7天活动趋势
        act_sql = f"""
            SELECT
                DATE(created_at) AS day,
                SUM(CASE WHEN message LIKE '%%测验%%' OR message LIKE '%%作业%%' OR message LIKE '%%答题%%' OR message LIKE '%%提交%%' OR message LIKE '%%解析%%道题目%%' THEN 1 ELSE 0 END) AS answers,
                SUM(CASE WHEN message LIKE '%%视频%%' OR message LIKE '%%播放%%' THEN 1 ELSE 0 END) AS videos,
                SUM(CASE WHEN message LIKE '%%试卷%%' OR message LIKE '%%交卷%%' OR message LIKE '%%考试%%' THEN 1 ELSE 0 END) AS exams,
                SUM(CASE WHEN message LIKE '%%PPT%%' OR message LIKE '%%电子书%%' OR message LIKE '%%阅读%%' THEN 1 ELSE 0 END) AS readings
            FROM script_event_logs
            WHERE username = {ph} AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
            GROUP BY DATE(created_at)
            ORDER BY day ASC
        """
        rows = self.fetchall(act_sql, (username,))
        result['activity_7d'] = [
            {
                'date': str(r.get('day', ''))[5:10],
                'answers': int(r.get('answers') or 0),
                'videos': int(r.get('videos') or 0),
                'exams': int(r.get('exams') or 0),
                'readings': int(r.get('readings') or 0),
            }
            for r in (rows or [])
        ]

        # 5. 消费统计
        pay_sql = f"""
            SELECT
                COALESCE(SUM(CASE WHEN status='paid' THEN price ELSE 0 END), 0) AS total_recharged,
                COUNT(CASE WHEN status='paid' THEN 1 END) AS paid_count
            FROM payment_orders WHERE username = {ph}
        """
        row = self.fetchone(pay_sql, (username,))
        total_recharged = float(row.get('total_recharged') or 0) if row else 0

        spent_sql = f"""
            SELECT
                COALESCE(SUM(CASE WHEN delta_points < 0 THEN ABS(delta_points) ELSE 0 END), 0) AS total_spent,
                reason
            FROM usage_logs WHERE username = {ph}
            GROUP BY reason
            ORDER BY total_spent DESC
            LIMIT 5
        """
        rows = self.fetchall(spent_sql, (username,))
        usage_breakdown = [
            {'reason': r.get('reason') or '其他', 'count': int(r.get('total_spent') or 0)}
            for r in (rows or [])
        ]

        recent_orders_sql = f"""
            SELECT plan_name, price, status, created_at
            FROM payment_orders WHERE username = {ph}
            ORDER BY id DESC LIMIT 5
        """
        rows = self.fetchall(recent_orders_sql, (username,))
        recent_orders = []
        for r in (rows or []):
            ca = r.get('created_at')
            if hasattr(ca, 'strftime'):
                ca = ca.strftime('%Y-%m-%d %H:%M')
            recent_orders.append({
                'plan_name': r.get('plan_name') or '',
                'price': float(r.get('price') or 0),
                'status': r.get('status') or '',
                'created_at': str(ca) if ca else '',
            })

        result['consumption'] = {
            'total_recharged': round(total_recharged, 2),
            'usage_breakdown': usage_breakdown,
            'recent_orders': recent_orders,
        }

        return result

    # ==================== 推广返利 ====================
    def _settle_first_order_commission(self, invitee_username, order_no, order_amount):
        """首单佣金结算：查邀请关系，写 pending 佣金记录"""
        ph = _ph()
        ref = self.fetchone(f"SELECT inviter_username FROM referrals WHERE invitee_username = {ph}", (invitee_username,))
        if not ref:
            return
        inviter = ref["inviter_username"]
        # 防重复：同 order_no 已结算过则跳过
        if self.fetchone(f"SELECT 1 FROM commission_logs WHERE order_no = {ph}", (order_no,)):
            return
        admin = self.get_admin_config() or {}
        if not int(admin.get("referral_enabled") or 0):
            return
        rate = float(admin.get("referral_rate") or 0)
        if rate <= 0:
            return
        commission = round(order_amount * rate, 2)
        if commission <= 0:
            return
        self.execute(
            f"INSERT INTO commission_logs (inviter, invitee, order_no, order_amount, rate, commission_amount, status) "
            f"VALUES ({ph}, {ph}, {ph}, {ph}, {ph}, {ph}, 'pending')",
            (inviter, invitee_username, order_no, order_amount, rate, commission)
        )

    def settle_pending_commissions(self, inviter_username):
        """惰性结算：把超过冷却期的 pending 佣金转 paid 并入余额"""
        ph = _ph()
        admin = self.get_admin_config() or {}
        days = int(admin.get("referral_settle_days") or 0)
        rows = self.fetchall(
            f"SELECT id, commission_amount FROM commission_logs "
            f"WHERE inviter = {ph} AND status = 'pending' "
            f"AND created_at <= (CURRENT_TIMESTAMP - INTERVAL {days} DAY)",
            (inviter_username,)
        )
        for r in (rows or []):
            amount = float(r.get("commission_amount") or 0)
            # 原子加余额
            self.execute(f"UPDATE users SET commission_balance = commission_balance + {ph} WHERE username = {ph}", (amount, inviter_username))
            # 状态转 paid（带条件防并发重复）
            self.execute(f"UPDATE commission_logs SET status = 'paid' WHERE id = {ph} AND status = 'pending'", (r["id"],))

    def get_referral_profile(self, username):
        """返回推广概览"""
        ph = _ph()
        self.settle_pending_commissions(username)
        code = self.get_or_create_invite_code(username)
        invited = self.fetchone(f"SELECT COUNT(*) c FROM referrals WHERE inviter_username = {ph}", (username,)) or {}
        paid = self.fetchone(f"SELECT COALESCE(SUM(commission_amount),0) s FROM commission_logs WHERE inviter = {ph} AND status='paid'", (username,)) or {}
        pend = self.fetchone(f"SELECT COALESCE(SUM(commission_amount),0) s FROM commission_logs WHERE inviter = {ph} AND status='pending'", (username,)) or {}
        bal = self.fetchone(f"SELECT commission_balance FROM users WHERE username = {ph}", (username,)) or {}
        return {
            "invite_code": code,
            "invited_count": int(invited.get("c") or 0),
            "paid_commission": float(paid.get("s") or 0),
            "pending_commission": float(pend.get("s") or 0),
            "balance": float(bal.get("commission_balance") or 0),
        }

    def get_user_payment_info(self, username):
        ph = _ph()
        return self.fetchone(f"SELECT * FROM user_payment_info WHERE username = {ph}", (username,)) or {}

    def save_user_payment_info(self, username, alipay_account="", alipay_qr="", wechat_account="", wechat_qr=""):
        ph = _ph()
        self.execute(
            f"INSERT INTO user_payment_info (username, alipay_account, alipay_qr, wechat_account, wechat_qr) "
            f"VALUES ({ph},{ph},{ph},{ph},{ph}) "
            f"ON DUPLICATE KEY UPDATE alipay_account=VALUES(alipay_account), alipay_qr=VALUES(alipay_qr), "
            f"wechat_account=VALUES(wechat_account), wechat_qr=VALUES(wechat_qr)",
            (username, alipay_account, alipay_qr, wechat_account, wechat_qr)
        )

    def create_withdrawal(self, username, amount, pay_method, pay_account, qr_code):
        ph = _ph()
        # 原子扣余额
        cur = self.execute(
            f"UPDATE users SET commission_balance = commission_balance - {ph} WHERE username = {ph} AND commission_balance >= {ph}",
            (amount, username, amount)
        )
        if not cur or cur.rowcount == 0:
            return False, "余额不足"
        # 防重复 pending
        if self.fetchone(f"SELECT 1 FROM withdrawals WHERE username = {ph} AND status = 'pending'", (username,)):
            # 退还
            self.execute(f"UPDATE users SET commission_balance = commission_balance + {ph} WHERE username = {ph}", (amount, username))
            return False, "已有待审核提现，请等待处理"
        self.execute(
            f"INSERT INTO withdrawals (username, amount, pay_method, pay_account, qr_code_path, status) "
            f"VALUES ({ph},{ph},{ph},{ph},{ph},'pending')",
            (username, amount, pay_method, pay_account, qr_code)
        )
        return True, "提现申请已提交"

    def list_user_withdrawals(self, username, limit=50):
        ph = _ph()
        return self.fetchall(f"SELECT * FROM withdrawals WHERE username = {ph} ORDER BY created_at DESC LIMIT {ph}", (username, limit))

    def list_admin_withdrawals(self, status=None, limit=200):
        if status:
            return self.fetchall("SELECT * FROM withdrawals WHERE status=%s ORDER BY created_at DESC LIMIT %s", (status, limit))
        return self.fetchall("SELECT * FROM withdrawals ORDER BY created_at DESC LIMIT %s", (limit,))

    def get_withdrawal(self, wid):
        ph = _ph()
        return self.fetchone(f"SELECT * FROM withdrawals WHERE id = {ph}", (wid,))

    def approve_withdrawal(self, wid):
        ph = _ph()
        cur = self.execute(f"UPDATE withdrawals SET status='approved', reviewed_at=CURRENT_TIMESTAMP WHERE id={ph} AND status='pending'", (wid,))
        return bool(cur and cur.rowcount > 0)

    def reject_withdrawal(self, wid, reason):
        ph = _ph()
        row = self.fetchone(f"SELECT username, amount FROM withdrawals WHERE id={ph} AND status='pending'", (wid,))
        if not row:
            return False
        self.execute(f"UPDATE withdrawals SET status='rejected', reject_reason={ph}, reviewed_at=CURRENT_TIMESTAMP WHERE id={ph}", (reason, wid))
        # 退还余额
        self.execute(f"UPDATE users SET commission_balance = commission_balance + {ph} WHERE username = {ph}", (row["amount"], row["username"]))
        return True

    def referral_stats(self):
        """管理员统计：top10 邀请人 + 总佣金 + 提现统计"""
        top10 = self.fetchall(
            "SELECT r.inviter_username AS username, COUNT(*) AS invited_count, "
            "COALESCE(SUM(c.commission_amount),0) AS total_commission "
            "FROM referrals r LEFT JOIN commission_logs c ON r.inviter_username = c.inviter "
            "GROUP BY r.inviter_username ORDER BY invited_count DESC LIMIT 10"
        )
        for r in (top10 or []):
            r["invited_count"] = int(r.get("invited_count") or 0)
            r["total_commission"] = float(r.get("total_commission") or 0)
        total = self.fetchone("SELECT COALESCE(SUM(commission_amount),0) AS total, COUNT(*) AS cnt FROM commission_logs") or {}
        # 提现统计
        wd_approved = self.fetchone("SELECT COALESCE(SUM(amount),0) AS total, COUNT(*) AS cnt FROM withdrawals WHERE status='approved'") or {}
        wd_pending = self.fetchone("SELECT COALESCE(SUM(amount),0) AS total, COUNT(*) AS cnt FROM withdrawals WHERE status='pending'") or {}
        return {
            "top10": top10 or [],
            "total_commission": float(total.get("total") or 0),
            "total_logs": int(total.get("cnt") or 0),
            "withdrawn_total": float(wd_approved.get("total") or 0),
            "withdrawn_count": int(wd_approved.get("cnt") or 0),
            "pending_withdraw_total": float(wd_pending.get("total") or 0),
            "pending_withdraw_count": int(wd_pending.get("cnt") or 0)
        }

    def withdrawal_summary(self):
        """提现申请合计：今日申请、已通过金额、待审核金额"""
        today = self.fetchone(
            "SELECT COALESCE(SUM(amount),0) AS total, COUNT(*) AS cnt FROM withdrawals WHERE DATE(created_at)=CURDATE()"
        ) or {}
        approved = self.fetchone("SELECT COALESCE(SUM(amount),0) AS total, COUNT(*) AS cnt FROM withdrawals WHERE status='approved'") or {}
        pending = self.fetchone("SELECT COALESCE(SUM(amount),0) AS total, COUNT(*) AS cnt FROM withdrawals WHERE status='pending'") or {}
        return {
            "today_total": float(today.get("total") or 0),
            "today_count": int(today.get("cnt") or 0),
            "approved_total": float(approved.get("total") or 0),
            "approved_count": int(approved.get("cnt") or 0),
            "pending_total": float(pending.get("total") or 0),
            "pending_count": int(pending.get("cnt") or 0)
        }


def hash_password(password):
    """密码哈希 - 使用 PBKDF2 + 随机盐，格式: pbkdf2$iterations$salt$hash"""
    import secrets as _sec
    salt = _sec.token_hex(16)
    iterations = 100000
    dk = hashlib.pbkdf2_hmac('sha256', (password or '').encode(), salt.encode(), iterations)
    return f"pbkdf2${iterations}${salt}${dk.hex()}"


def verify_password(input_password, stored_hash):
    """验证密码，兼容旧版无盐 SHA-256 和新版 PBKDF2"""
    if not stored_hash:
        return False
    if stored_hash.startswith("pbkdf2$"):
        try:
            parts = stored_hash.split("$")
            iterations = int(parts[1])
            salt = parts[2]
            expected = parts[3]
            dk = hashlib.pbkdf2_hmac('sha256', (input_password or '').encode(), salt.encode(), iterations)
            return hmac.compare_digest(dk.hex(), expected)
        except Exception:
            return False
    # 旧版无盐 SHA-256（仅用于过渡期验证，验证成功后应升级）
    return hmac.compare_digest(hashlib.sha256((input_password or '').encode()).hexdigest(), stored_hash)


def is_legacy_password(stored_hash):
    """判断是否是旧版无盐哈希，需要升级"""
    return stored_hash and not stored_hash.startswith("pbkdf2$")


# 全局数据库实例
db = Database()
