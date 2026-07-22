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

# 数据库连接的持久化配置文件：运行时在后台「系统设置」中修改后会写入此文件，重启后仍生效。
DB_CONFIG_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "config", "db.json")

# 当前生效的 Database 单例（运行时切换数据库后用于重建表结构）
DB_INSTANCE = None


def _apply_db_config_file():
    """若存在磁盘配置文件，则用其覆盖 MYSQL_CONFIG 的环境变量默认值"""
    if not os.path.exists(DB_CONFIG_FILE):
        return
    try:
        with open(DB_CONFIG_FILE, "r", encoding="utf-8") as _f:
            _data = json.load(_f)
        for _k in ("host", "port", "user", "password", "database"):
            if _k in _data and _data[_k] not in (None, ""):
                MYSQL_CONFIG[_k] = _data[_k]
        if _data.get("port"):
            MYSQL_CONFIG["port"] = int(_data["port"])
        print(f"[数据库配置] 已从配置文件加载连接参数: {MYSQL_CONFIG['host']}:{MYSQL_CONFIG['port']}/{MYSQL_CONFIG['database']}")
    except Exception as _e:
        print(f"[数据库配置] 读取配置文件失败，使用环境变量默认值: {_e}")


_apply_db_config_file()


def _ph():
    """返回当前数据库类型的占位符"""
    return "%s"


def _adapt_params(params):
    """适配参数（主要是 datetime 类型）"""
    return tuple(params)


def get_db_config():
    """返回当前数据库连接配置（密码做掩码处理，避免泄露）"""
    pwd = MYSQL_CONFIG.get("password", "")
    return {
        "host": MYSQL_CONFIG.get("host", "127.0.0.1"),
        "port": int(MYSQL_CONFIG.get("port", 3306)),
        "user": MYSQL_CONFIG.get("user", ""),
        "password": "********" if pwd else "",
        "database": MYSQL_CONFIG.get("database", ""),
    }


def test_db_config(cfg):
    """使用给定参数测试能否连接 MySQL，返回 (ok, error_msg)"""
    import pymysql
    try:
        conn = pymysql.connect(
            host=cfg.get("host", "127.0.0.1"),
            port=int(cfg.get("port", 3306)),
            user=cfg.get("user", ""),
            password=cfg.get("password", ""),
            database=cfg.get("database", ""),
            charset="utf8mb4",
            connect_timeout=8,
        )
        conn.close()
        return True, ""
    except Exception as e:
        return False, str(e)


def save_db_config(cfg):
    """校验连接后持久化到配置文件并热更新当前连接配置。返回 (ok, msg)"""
    host = (cfg.get("host") or "").strip()
    port = int(cfg.get("port", 3306))
    user = (cfg.get("user") or "").strip()
    password = cfg.get("password") or ""
    database = (cfg.get("database") or "").strip()
    if not host or not user or not database:
        return False, "主机、用户名和数据库名均不能为空"
    # 密码框未改动（仍为掩码）时，保留当前密码
    if password == "********":
        password = MYSQL_CONFIG.get("password", "")

    ok, err = test_db_config({"host": host, "port": port, "user": user, "password": password, "database": database})
    if not ok:
        return False, f"连接测试失败：{err}"

    try:
        os.makedirs(os.path.dirname(DB_CONFIG_FILE), exist_ok=True)
        with open(DB_CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump({
                "host": host,
                "port": port,
                "user": user,
                "password": password,
                "database": database,
            }, f, ensure_ascii=False, indent=2)
    except Exception as e:
        return False, f"配置文件写入失败：{e}"

    # 热更新当前连接配置（后续新建连接生效）
    MYSQL_CONFIG["host"] = host
    MYSQL_CONFIG["port"] = port
    MYSQL_CONFIG["user"] = user
    MYSQL_CONFIG["password"] = password
    MYSQL_CONFIG["database"] = database

    # 在新库上重建/校验表结构（best-effort）
    table_msg = ""
    try:
        if DB_INSTANCE is not None:
            DB_INSTANCE._init_tables()
    except Exception as e:
        table_msg = f"（表结构初始化失败：{e}，请确认该数据库已准备就绪）"

    return True, "数据库连接已更新并持久化" + table_msg


class Database:
    def __init__(self):
        global DB_INSTANCE
        self.conn = None
        self.lock = threading.RLock()
        self._connect()
        self._init_tables()
        DB_INSTANCE = self

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

        # 退款相关列
        self._add_column_if_missing("payment_orders", "refunded_at", "refunded_at TIMESTAMP NULL COMMENT '退款时间'")
        self._add_column_if_missing("payment_orders", "refund_reason", "refund_reason VARCHAR(500) DEFAULT '' COMMENT '退款原因'")
        self._add_column_if_missing("payment_orders", "refunded_by", "refunded_by VARCHAR(50) DEFAULT '' COMMENT '退款操作人'")

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
                pay_method VARCHAR(20),
                pay_channel VARCHAR(20),
                trade_no VARCHAR(128),
                bank_order_no VARCHAR(128),
                pay_type VARCHAR(50),
                business_type VARCHAR(50),
                qr_code TEXT,
                pay_url TEXT,
                paid_at TIMESTAMP NULL,
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
        self._ensure_xianyu_tables()

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
        # 每日数据邮件定时发送配置（单行）
        self.execute("""
            CREATE TABLE IF NOT EXISTS daily_report_config (
                id INT PRIMARY KEY DEFAULT 1,
                enabled TINYINT DEFAULT 0 COMMENT '是否启用定时发送',
                send_time VARCHAR(8) DEFAULT '08:00' COMMENT '每天发送时间 HH:MM',
                recipients TEXT COMMENT '收件人邮箱，逗号分隔',
                template_id INT NULL COMMENT '使用的邮件模板ID，为空则按场景 daily_report 取默认模板',
                last_sent_at DATETIME NULL COMMENT '上次实际发送时间',
                last_status VARCHAR(50) DEFAULT '' COMMENT '上次发送结果',
                last_error TEXT COMMENT '上次发送错误信息'
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)
        self.execute("INSERT IGNORE INTO daily_report_config (id, enabled, send_time) VALUES (1, 0, '08:00')")
        # 邮件服务器配置（支持多服务器 + 权重 + 腾讯云SES）
        self.execute("""
            CREATE TABLE IF NOT EXISTS mail_servers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL COMMENT '服务器名称',
                type VARCHAR(20) NOT NULL DEFAULT 'smtp' COMMENT '类型: smtp/tencent_ses',
                enabled TINYINT DEFAULT 0 COMMENT '是否启用',
                weight INT DEFAULT 1 COMMENT '权重(用于随机选择)',
                smtp_host VARCHAR(255) DEFAULT '' COMMENT 'SMTP 服务器地址',
                smtp_port INT DEFAULT 587 COMMENT 'SMTP 端口',
                smtp_user VARCHAR(255) DEFAULT '' COMMENT 'SMTP 用户名',
                smtp_pass VARCHAR(512) DEFAULT '' COMMENT 'SMTP 密码/授权码',
                from_addr VARCHAR(255) DEFAULT '' COMMENT '发件地址',
                from_name VARCHAR(100) DEFAULT '学神助手' COMMENT '发件人名称',
                secret_id VARCHAR(255) DEFAULT '' COMMENT '腾讯云SecretId',
                secret_key VARCHAR(512) DEFAULT '' COMMENT '腾讯云SecretKey',
                ses_region VARCHAR(50) DEFAULT 'ap-guangzhou' COMMENT '腾讯云SES区域',
                ses_template_id INT DEFAULT 0 COMMENT '腾讯云SES模板ID',
                is_resend TINYINT DEFAULT 0 COMMENT '是否作为补发专用服务器',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)
        # 迁移：旧表结构 → 新表结构
        self._migrate_email_templates()
        # 确保邮件模板有补发标记字段
        self._add_column_if_missing("email_templates", "is_resend", "is_resend TINYINT DEFAULT 0 COMMENT '是否作为没收到邮件的补发模板'")
        # 确保 mail_servers 有腾讯云 SES 字段
        for col, dtype, default in [
            ("secret_id", "VARCHAR(255)", "''"),
            ("secret_key", "VARCHAR(512)", "''"),
            ("ses_region", "VARCHAR(50)", "'ap-guangzhou'"),
            ("ses_template_id", "INT", "0"),
            ("is_resend", "TINYINT", "0"),
        ]:
            self._add_column_if_missing("mail_servers", col, f"{col} {dtype} DEFAULT {default}")
        # 将旧版单 SMTP 配置迁移为邮件服务器
        self._migrate_mail_servers()
        # 确保每个场景都有默认模板
        self._ensure_default_email_templates()

        # ===== 用户问题反馈 =====
        self.execute("""
            CREATE TABLE IF NOT EXISTS user_feedback (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) NOT NULL COMMENT '提交用户',
                email VARCHAR(100) DEFAULT '' COMMENT '联系邮箱',
                category VARCHAR(30) NOT NULL DEFAULT 'other' COMMENT '反馈类型: bug/feature/payment/account/other',
                title VARCHAR(200) NOT NULL COMMENT '问题标题',
                content TEXT NOT NULL COMMENT '问题描述',
                status VARCHAR(20) NOT NULL DEFAULT 'pending' COMMENT '状态: pending/processing/resolved/closed',
                admin_reply TEXT COMMENT '管理员回复内容',
                replied_at TIMESTAMP NULL COMMENT '回复时间',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_username (username),
                INDEX idx_status (status),
                INDEX idx_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)

        # 反馈对话记录表（多轮对话）
        self.execute("""
            CREATE TABLE IF NOT EXISTS feedback_replies (
                id INT AUTO_INCREMENT PRIMARY KEY,
                feedback_id INT NOT NULL COMMENT '关联反馈ID',
                sender VARCHAR(10) NOT NULL COMMENT '发送者: user/admin',
                content TEXT NOT NULL COMMENT '回复内容',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_feedback_id (feedback_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)

        # ===== 用户收款信息 =====
        self.execute("""
            CREATE TABLE IF NOT EXISTS user_payment_info (
                username VARCHAR(50) PRIMARY KEY COMMENT '用户名',
                alipay_account VARCHAR(100) DEFAULT '' COMMENT '支付宝账号',
                alipay_qr TEXT COMMENT '支付宝收款码(base64)',
                wechat_account VARCHAR(100) DEFAULT '' COMMENT '微信账号',
                wechat_qr TEXT COMMENT '微信收款码(base64)',
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)
        # ===== 用户退款申请 =====
        self.execute("""
            CREATE TABLE IF NOT EXISTS refund_requests (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) NOT NULL COMMENT '申请用户',
                order_no VARCHAR(64) NOT NULL COMMENT '订单号',
                reason VARCHAR(200) DEFAULT '' COMMENT '退款原因',
                status VARCHAR(20) NOT NULL DEFAULT 'pending' COMMENT 'pending/approved/rejected',
                admin_note TEXT COMMENT '管理员备注',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                processed_at TIMESTAMP NULL COMMENT '处理时间',
                INDEX idx_username (username),
                INDEX idx_order_no (order_no),
                INDEX idx_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)

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
        # ===== 卡密表（闲鱼购买） =====
        self.execute("""
            CREATE TABLE IF NOT EXISTS card_keys (
                id INT AUTO_INCREMENT PRIMARY KEY,
                code VARCHAR(64) NOT NULL UNIQUE COMMENT '卡密',
                plan_id INT NOT NULL COMMENT '关联套餐ID',
                status VARCHAR(20) NOT NULL DEFAULT 'unused' COMMENT 'unused/used',
                created_by VARCHAR(50) DEFAULT '' COMMENT '生成者',
                used_by VARCHAR(50) DEFAULT '' COMMENT '使用者',
                used_at TIMESTAMP NULL COMMENT '使用时间',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_status (status),
                INDEX idx_code (code)
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
            },
            {
                "scene": "feedback_reply",
                "subject": "学神助手 - 问题反馈回复",
                "body_text": "━━━━━━━━━━━━━━━━━━━━\n    学神助手 · {{subject}}\n━━━━━━━━━━━━━━━━━━━━\n\n尊敬的 {{username}}，您好！\n\n您提交的问题反馈「{{title}}」已处理，\n管理员回复如下：\n\n{{reply_text}}\n\n━━━━━━━━━━━━━━━━━━━━\n如有疑问请继续在用户中心提交反馈。\n本邮件由 {{from_addr}} 发送\n━━━━━━━━━━━━━━━━━━━━",
                "body_html": '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>@keyframes fadeInUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}.card{animation:fadeInUp 0.6s ease-out}</style></head><body style="margin:0;padding:0;background:#f0f9ff;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding:40px 20px;"><table class="card" width="480" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;width:100%;background:#ffffff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);overflow:hidden;"><tr><td style="background:linear-gradient(135deg,#0ea5e9,#0284c7);padding:28px 32px;text-align:center;"><div style="color:#ffffff;font-size:18px;font-weight:600;letter-spacing:1px;">学神助手</div><div style="color:rgba(255,255,255,0.85);font-size:13px;margin-top:4px;">{{subject}}</div></td></tr><tr><td style="padding:32px;"><p style="margin:0 0 16px;color:#1f2937;font-size:15px;line-height:1.6;">尊敬的 <b>{{username}}</b>，您好！</p><p style="margin:0 0 8px;color:#4b5563;font-size:14px;line-height:1.6;">您提交的问题反馈已处理：</p><div style="background:#f0f9ff;border-left:4px solid #0ea5e9;border-radius:8px;padding:14px 16px;margin:0 0 20px;"><p style="margin:0 0 6px;color:#6b7280;font-size:12px;">反馈标题</p><p style="margin:0;color:#1f2937;font-size:14px;font-weight:600;">{{title}}</p></div><p style="margin:0 0 8px;color:#4b5563;font-size:14px;line-height:1.6;">管理员回复：</p><div style="background:#f9fafb;border-radius:12px;padding:16px 18px;margin:0 0 20px;"><p style="margin:0;color:#1f2937;font-size:14px;line-height:1.7;white-space:pre-wrap;">{{reply_text}}</p></div><div style="border-top:1px solid #e5e7eb;padding-top:16px;margin-top:20px;"><p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">如有疑问请继续在用户中心提交反馈。</p><p style="margin:8px 0 0;color:#9ca3af;font-size:12px;line-height:1.6;">本邮件由 <b style="color:#6b7280;">{{from_addr}}</b> 发送</p></div></td></tr></table></td></tr></table></body></html>',
                "variables": "username,title,reply_text,subject,from_addr"
            },
            {
                "scene": "feedback_new",
                "subject": "学神助手 - 新问题反馈通知",
                "body_text": "━━━━━━━━━━━━━━━━━━━━\n    学神助手 · 新问题反馈通知\n━━━━━━━━━━━━━━━━━━━━\n\n管理员您好！\n\n收到一条新的用户反馈：\n\n  用户：{{username}}\n  类型：{{category}}\n  标题：{{title}}\n\n  内容摘要：\n{{content}}\n\n━━━━━━━━━━━━━━━━━━━━\n请及时登录管理后台查看处理。\n本邮件由 {{from_addr}} 发送\n━━━━━━━━━━━━━━━━━━━━",
                "body_html": '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>@keyframes fadeInUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}.card{animation:fadeInUp .6s ease-out}</style></head><body style="margin:0;padding:0;background:#f0f4f8;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding:40px 20px;"><table class="card" width="480" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;width:100%;background:#ffffff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);overflow:hidden;"><tr><td style="background:linear-gradient(135deg,#f97316,#ea580c);padding:28px 32px;text-align:center;"><div style="color:#ffffff;font-size:18px;font-weight:600;letter-spacing:1px;">学神助手</div><div style="color:rgba(255,255,255,0.85);font-size:13px;margin-top:4px;">新问题反馈通知</div></td></tr><tr><td style="padding:32px;"><p style="margin:0 0 16px;color:#1f2937;font-size:15px;line-height:1.6;">管理员您好！</p><p style="margin:0 0 20px;color:#4b5563;font-size:14px;line-height:1.6;">收到一条新的用户反馈：</p><table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f9fafb;border-radius:12px;padding:20px;margin:0 0 20px;border:1px solid #e5e7eb"><tr><td style="padding:4px 0"><span style="color:#6b7280;font-size:13px">用户</span></td><td style="padding:4px 0;color:#1f2937;font-size:14px;font-weight:600">{{username}}</td></tr><tr><td style="padding:4px 0"><span style="color:#6b7280;font-size:13px">类型</span></td><td style="padding:4px 0;color:#1f2937;font-size:14px">{{category}}</td></tr><tr><td style="padding:4px 0"><span style="color:#6b7280;font-size:13px">标题</span></td><td style="padding:4px 0;color:#1f2937;font-size:14px;font-weight:600">{{title}}</td></tr></table><p style="margin:0 0 8px;color:#4b5563;font-size:14px;line-height:1.6;">内容摘要：</p><div style="background:#f9fafb;border-left:4px solid #f97316;border-radius:8px;padding:14px 16px;margin:0 0 20px;"><p style="margin:0;color:#1f2937;font-size:14px;line-height:1.7;white-space:pre-wrap">{{content}}</p></div><div style="border-top:1px solid #e5e7eb;padding-top:16px;margin-top:20px"><p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6">请及时登录管理后台查看处理。</p><p style="margin:8px 0 0;color:#9ca3af;font-size:12px;line-height:1.6">本邮件由 <b>{{from_addr}}</b> 发送</p></div></td></tr></table></td></tr></table></body></html>',
                "variables": "username,category,title,content,subject,from_addr"
            },
            {
                "scene": "daily_report",
                "subject": "学神助手 - {{date}} 每日运营数据日报",
                "body_text": "━━━━━━━━━━━━━━━━━━━━\n    学神助手 · 每日运营数据日报\n━━━━━━━━━━━━━━━━━━━━\n\n统计日期：{{date}}\n\n【注册情况】\n    新增注册用户：{{reg_count}} 人\n\n【收入情况】\n    支付订单数：{{order_count}} 笔\n    总收入：{{revenue_total}} 元\n    ├─ 月度会员：{{monthly_count}} 笔 / {{monthly_revenue}} 元\n    └─ 积分套餐：{{points_count}} 笔 / {{points_revenue}} 元\n\n━━━━━━━━━━━━━━━━━━━━\n本邮件由系统定时发送。\n本邮件由 {{from_addr}} 发送\n━━━━━━━━━━━━━━━━━━━━",
                "body_html": '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>@keyframes fadeInUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}.card{animation:fadeInUp .6s ease-out}.metric{background:#f8fafc;border:1px solid #e5e7eb;border-radius:12px;padding:16px 18px}</style></head><body style="margin:0;padding:0;background:#eef2f7;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding:40px 20px;"><table class="card" width="520" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;width:100%;background:#ffffff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);overflow:hidden;"><tr><td style="background:linear-gradient(135deg,#6366f1,#4f46e5);padding:28px 32px;text-align:center;"><div style="color:#ffffff;font-size:18px;font-weight:600;letter-spacing:1px;">学神助手</div><div style="color:rgba(255,255,255,0.85);font-size:13px;margin-top:4px;">{{subject}}</div></td></tr><tr><td style="padding:28px 32px;"><p style="margin:0 0 20px;color:#6b7280;font-size:14px;">统计日期：<b style="color:#1f2937">{{date}}</b></p><h3 style="margin:0 0 12px;color:#4f46e5;font-size:15px;">注册情况</h3><div class="metric" style="margin:0 0 22px;"><p style="margin:0;color:#6b7280;font-size:13px;">新增注册用户</p><p style="margin:4px 0 0;color:#1f2937;font-size:26px;font-weight:700;">{{reg_count}} <span style="font-size:14px;font-weight:400;color:#6b7280;">人</span></p></div><h3 style="margin:0 0 12px;color:#4f46e5;font-size:15px;">收入情况</h3><div class="metric" style="margin:0 0 14px;"><p style="margin:0;color:#6b7280;font-size:13px;">支付订单数 / 总收入</p><p style="margin:4px 0 0;color:#1f2937;font-size:18px;font-weight:700;">{{order_count}} 笔 · ¥{{revenue_total}}</p></div><table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;border-collapse:collapse;"><tr><td class="metric" style="width:50%;border-radius:12px 0 0 12px;"><p style="margin:0;color:#6b7280;font-size:12px;">月度会员</p><p style="margin:4px 0 0;color:#1f2937;font-size:15px;font-weight:600;">{{monthly_count}} 笔</p><p style="margin:2px 0 0;color:#16a34a;font-size:14px;">¥{{monthly_revenue}}</p></td><td class="metric" style="width:50%;border-left:none;border-radius:0 12px 12px 0;"><p style="margin:0;color:#6b7280;font-size:12px;">积分套餐</p><p style="margin:4px 0 0;color:#1f2937;font-size:15px;font-weight:600;">{{points_count}} 笔</p><p style="margin:2px 0 0;color:#16a34a;font-size:14px;">¥{{points_revenue}}</p></td></tr></table></div><div style="border-top:1px solid #e5e7eb;padding:16px 32px;background:#fafafa;"><p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">本邮件由系统定时发送。</p><p style="margin:6px 0 0;color:#9ca3af;font-size:12px;line-height:1.6;">本邮件由 <b>{{from_addr}}</b> 发送</p></div></td></tr></table></td></tr></table></body></html>',
                "variables": "date,reg_count,order_count,revenue_total,monthly_count,monthly_revenue,points_count,points_revenue,subject,from_addr"
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
        self._add_column_if_missing("payment_plans", "xianyu_url", "xianyu_url VARCHAR(255) DEFAULT ''")
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
        self._add_column_if_missing("admin_config", "feedback_auto_close_days", "feedback_auto_close_days INT DEFAULT 7")
        self._add_column_if_missing("admin_config", "feedback_notify_enabled", "feedback_notify_enabled TINYINT DEFAULT 0")
        self._add_column_if_missing("admin_config", "refund_days_limit", "refund_days_limit INT DEFAULT 7 COMMENT '退款时效（天），0=不允许退款'")
        self._add_column_if_missing("admin_config", "xianyu_enabled", "xianyu_enabled TINYINT DEFAULT 0")
        self._add_column_if_missing("admin_config", "xianyu_url", "xianyu_url VARCHAR(255) DEFAULT ''")
        self._add_column_if_missing("admin_config", "card_pay_name", "card_pay_name VARCHAR(50) DEFAULT '卡密激活'")
        self._add_column_if_missing("admin_config", "card_pay_icon", "card_pay_icon VARCHAR(20) DEFAULT '🔑'")

    def _ensure_order_payment_columns(self):
        self._add_column_if_missing("payment_orders", "pay_method", "pay_method VARCHAR(20)")
        self._add_column_if_missing("payment_orders", "pay_channel", "pay_channel VARCHAR(20)")
        self._add_column_if_missing("payment_orders", "trade_no", "trade_no VARCHAR(128)")
        self._add_column_if_missing("payment_orders", "qr_code", "qr_code TEXT")
        self._add_column_if_missing("payment_orders", "pay_url", "pay_url TEXT")
        self._add_column_if_missing("payment_orders", "paid_at", "paid_at TIMESTAMP NULL")
        self._add_column_if_missing("payment_orders", "bank_order_no", "bank_order_no VARCHAR(128)")
        self._add_column_if_missing("payment_orders", "pay_type", "pay_type VARCHAR(50)")
        self._add_column_if_missing("payment_orders", "business_type", "business_type VARCHAR(50)")

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
            int(plan.get("sort_order") or 0),
            (plan.get("xianyu_url") or "").strip()
        )
        if plan_id:
            self.execute(
                f"""UPDATE payment_plans SET name={ph}, plan_type={ph}, price={ph}, points={ph}, days={ph}, enabled={ph}, sort_order={ph}, xianyu_url={ph}
                    WHERE id={ph}""",
                values + (int(plan_id),)
            )
            return int(plan_id)
        cursor = self.execute(
            f"""INSERT INTO payment_plans (name, plan_type, price, points, days, enabled, sort_order, xianyu_url)
                VALUES ({ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph})""",
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

    def create_pending_order(self, username, plan, pay_method="alipay", pay_channel="", trade_no="", qr_code="", pay_url="", order_no=None, bank_order_no="", pay_type="", business_type=""):
        ph = _ph()
        if not order_no:
            order_no = f"ORD{int(time.time()*1000)}{abs(hash(username)) % 10000:04d}"
        self.execute(
            f"""INSERT INTO payment_orders (order_no, username, plan_id, plan_name, plan_type, price, points, days, status, pay_method, pay_channel, trade_no, qr_code, pay_url, bank_order_no, pay_type, business_type)
                VALUES ({ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, 'pending', {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph})""",
            (
                order_no, username, int(plan.get("id") or 0), plan.get("name", ""),
                plan.get("plan_type", ""), float(plan.get("price") or 0),
                int(plan.get("points") or 0), int(plan.get("days") or 0),
                pay_method, pay_channel, trade_no, qr_code, pay_url,
                bank_order_no, pay_type, business_type
            )
        )
        return order_no

    def get_order(self, order_no):
        ph = _ph()
        return self.fetchone(f"SELECT * FROM payment_orders WHERE order_no = {ph}", (order_no,))

    def update_order_payment(self, order_no, trade_no="", qr_code="", status=None, pay_url="", bank_order_no="", pay_type="", paid_at=None):
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
        if bank_order_no:
            sets.append(f"bank_order_no = {ph}")
            params.append(bank_order_no)
        if pay_type:
            sets.append(f"pay_type = {ph}")
            params.append(pay_type)
        if paid_at:
            sets.append(f"paid_at = {ph}")
            params.append(paid_at)
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

    def refund_order(self, order_no, reason="", operator="", user_initiated=False):
        """退款订单：撤销权益，标记 refunded 状态"""
        ph = _ph()
        order = self.get_order(order_no)
        if not order:
            return False, "订单不存在"
        if order.get("status") != "paid":
            return False, "仅已支付订单可退款"
        if order.get("refunded_at"):
            return False, "该订单已退款"
        if user_initiated and order.get("username") != operator:
            return False, "无权操作此订单"
        # 退款时效检查
        admin = self.get_admin_config() or {}
        refund_days = int(admin.get("refund_days_limit") or 7)
        if refund_days > 0:
            paid_at = order.get("paid_at")
            if paid_at:
                if isinstance(paid_at, str):
                    paid_at = datetime.strptime(paid_at.split(".")[0], "%Y-%m-%d %H:%M:%S")
                from datetime import timedelta
                deadline = paid_at + timedelta(days=refund_days)
                if datetime.now() > deadline:
                    return False, f"该订单已超过 {refund_days} 天退款时效，无法退款"
        if order.get("plan_type") == "monthly":
            ok = self._revoke_user_membership(order["username"], int(order.get("days") or 30))
            self.execute(
                f"INSERT INTO usage_logs (username, delta_points, balance_after, reason) VALUES ({ph}, 0, 0, {ph})",
                (order["username"], f"退款撤销包月：{order.get('plan_name','')} ({order_no}) 原因：{reason or '管理员退款'}")
            )
        else:
            points = int(order.get("points") or 0)
            if points > 0:
                row = self.get_user_entitlement(order["username"])
                old_balance = int(row.get("points_balance") or 0) if row else 0
                new_balance = max(0, old_balance - points)
                self.execute(
                    f"UPDATE users SET points_balance = GREATEST(0, points_balance - {ph}) WHERE username = {ph}",
                    (points, order["username"])
                )
                row2 = self.get_user_entitlement(order["username"])
                actual_balance = int(row2.get("points_balance") or 0) if row2 else 0
                self.execute(
                    f"INSERT INTO usage_logs (username, delta_points, balance_after, reason) VALUES ({ph}, {ph}, {ph}, {ph})",
                    (order["username"], -points, actual_balance, f"退款扣回点数：{order.get('plan_name','')} ({order_no}) 原因：{reason or '管理员退款'}")
                )
        # 撤销佣金
        try:
            self._revoke_order_commission(order_no)
        except Exception as e:
            print(f"[退款] 佣金撤销失败 order={order_no}: {e}", flush=True)
        self.execute(
            f"UPDATE payment_orders SET status = 'refunded', refunded_at = CURRENT_TIMESTAMP, refund_reason = {ph}, refunded_by = {ph} WHERE order_no = {ph}",
            (reason or "", operator or "", order_no)
        )
        return True, "退款成功，权益已撤销"

    def get_user_payment_info(self, username):
        ph = _ph()
        row = self.fetchone(f"SELECT * FROM user_payment_info WHERE username = {ph}", (username,))
        return row or {}

    def save_user_payment_info(self, username, data):
        ph = _ph()
        self.execute(f"""
            INSERT INTO user_payment_info (username, alipay_account, alipay_qr, wechat_account, wechat_qr)
            VALUES ({ph}, {ph}, {ph}, {ph}, {ph})
            ON DUPLICATE KEY UPDATE
                alipay_account = VALUES(alipay_account),
                alipay_qr = VALUES(alipay_qr),
                wechat_account = VALUES(wechat_account),
                wechat_qr = VALUES(wechat_qr)
        """, (username, data.get("alipay_account", ""), data.get("alipay_qr", ""),
              data.get("wechat_account", ""), data.get("wechat_qr", "")))

    def create_refund_request(self, username, order_no, reason=""):
        ph = _ph()
        order = self.get_order(order_no)
        if not order:
            return False, "订单不存在"
        if order.get("username") != username:
            return False, "无权操作此订单"
        if order.get("status") != "paid":
            return False, "仅已支付订单可申请退款"
        if order.get("refunded_at"):
            return False, "该订单已退款"
        existing = self.fetchone(f"SELECT id, status FROM refund_requests WHERE order_no = {ph} ORDER BY id DESC LIMIT 1", (order_no,))
        if existing:
            if existing["status"] == "pending":
                return False, "该订单已有待处理的退款申请"
            if existing["status"] == "approved":
                return False, "该订单已退款成功"
            if existing["status"] == "rejected":
                return False, "该订单的退款申请已被拒绝"
        self.execute(
            f"INSERT INTO refund_requests (username, order_no, reason) VALUES ({ph}, {ph}, {ph})",
            (username, order_no, reason)
        )
        return True, "退款申请已提交，请等待管理员处理"

    def list_refund_requests(self, status="", username="", order_no="", page=1, page_size=20):
        ph = _ph()
        where = []
        params = []
        if status:
            where.append(f"r.status = {ph}")
            params.append(status)
        if username:
            where.append(f"r.username LIKE {ph}")
            params.append(f"%{username}%")
        if order_no:
            where.append(f"r.order_no LIKE {ph}")
            params.append(f"%{order_no}%")
        where_sql = (" WHERE " + " AND ".join(where)) if where else ""
        total = self.fetchone(f"SELECT COUNT(*) cnt FROM refund_requests r {where_sql}", params)["cnt"]
        offset = (page - 1) * page_size
        rows = self.fetchall(
            f"SELECT r.*, o.plan_name, o.price, o.created_at order_created_at, "
            f"o.bank_order_no, o.trade_no, "
            f"p.alipay_account, p.alipay_qr, p.wechat_account, p.wechat_qr "
            f"FROM refund_requests r "
            f"LEFT JOIN payment_orders o ON r.order_no = o.order_no "
            f"LEFT JOIN user_payment_info p ON r.username = p.username "
            f"{where_sql} ORDER BY r.created_at DESC LIMIT {ph} OFFSET {ph}",
            params + [page_size, offset]
        )
        return {"total": total, "rows": rows or []}

    def process_refund_request(self, request_id, status, admin_note=""):
        ph = _ph()
        row = self.fetchone(f"SELECT * FROM refund_requests WHERE id = {ph}", (request_id,))
        if not row:
            return False, "申请不存在"
        if row["status"] != "pending":
            return False, "该申请已处理"
        self.execute(
            f"UPDATE refund_requests SET status = {ph}, admin_note = {ph}, processed_at = CURRENT_TIMESTAMP WHERE id = {ph}",
            (status, admin_note, request_id)
        )
        tip = "已批准，退款已处理" if status == "approved" else "已拒绝"
        return True, f"退款申请{tip}"

    # ========== 闲鱼自动发货 ==========
    def _ensure_xianyu_tables(self):
        self.execute("""
            CREATE TABLE IF NOT EXISTS xianyu_orders (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) NOT NULL COMMENT '购买用户',
                plan_id INT NOT NULL COMMENT '套餐ID',
                plan_name VARCHAR(100) DEFAULT '' COMMENT '套餐名',
                price DECIMAL(10,2) DEFAULT 0 COMMENT '金额',
                order_no VARCHAR(64) NOT NULL UNIQUE COMMENT '内部订单号',
                card_code VARCHAR(64) NOT NULL COMMENT '关联卡密',
                buyer_nick VARCHAR(100) DEFAULT '' COMMENT '闲鱼买家昵称',
                status VARCHAR(20) NOT NULL DEFAULT 'pending' COMMENT 'pending/paid/cancelled',
                checked_at TIMESTAMP NULL COMMENT '最近检查时间',
                paid_at TIMESTAMP NULL COMMENT '确认付款时间',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_username (username),
                INDEX idx_status (status),
                INDEX idx_order_no (order_no)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)

    def create_xianyu_order(self, username, plan_id):
        ph = _ph()
        plan = self.get_payment_plan(plan_id)
        if not plan:
            return None, "套餐不存在"
        import secrets, string
        code = "XS" + "".join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(14))
        order_no = f"XY{int(time.time()*1000)}{abs(hash(username)) % 10000:04d}"
        try:
            self.execute(
                f"INSERT INTO card_keys (code, plan_id, status, created_by) VALUES ({ph}, {ph}, 'unused', {ph})",
                (code, plan_id, f"xianyu:{username}")
            )
        except Exception:
            return None, "卡密生成失败"
        self.execute(
            f"""INSERT INTO xianyu_orders (username, plan_id, plan_name, price, order_no, card_code, status)
                VALUES ({ph}, {ph}, {ph}, {ph}, {ph}, {ph}, 'pending')""",
            (username, plan_id, plan.get("name", ""), float(plan.get("price") or 0), order_no, code)
        )
        return {"order_no": order_no, "card_code": code, "price": float(plan.get("price") or 0), "plan_name": plan.get("name", ""), "xianyu_url": (plan.get("xianyu_url") or "")}, None

    def list_xianyu_orders(self, status="", page=1, page_size=20):
        ph = _ph()
        where = []
        params = []
        if status:
            where.append(f"status = {ph}")
            params.append(status)
        where_sql = ("WHERE " + " AND ".join(where)) if where else ""
        total = self.fetchone(f"SELECT COUNT(*) cnt FROM xianyu_orders {where_sql}", params)["cnt"]
        offset = (page - 1) * page_size
        rows = self.fetchall(
            f"SELECT * FROM xianyu_orders {where_sql} ORDER BY id DESC LIMIT {ph} OFFSET {ph}",
            params + [page_size, offset]
        )
        return {"total": total, "rows": rows or []}

    def get_user_xianyu_orders(self, username, page=1, page_size=20):
        ph = _ph()
        total = self.fetchone(f"SELECT COUNT(*) cnt FROM xianyu_orders WHERE username = {ph}", (username,))["cnt"]
        offset = (page - 1) * page_size
        rows = self.fetchall(
            f"SELECT * FROM xianyu_orders WHERE username = {ph} ORDER BY id DESC LIMIT {ph} OFFSET {ph}",
            (username, page_size, offset)
        )
        return {"total": total, "rows": rows or []}

    def get_xianyu_order(self, order_no):
        ph = _ph()
        return self.fetchone(f"SELECT * FROM xianyu_orders WHERE order_no = {ph}", (order_no,))

    def activate_xianyu_order(self, order_id, xianyu_trade_no=""):
        ph = _ph()
        row = self.fetchone(f"SELECT * FROM xianyu_orders WHERE id = {ph} AND status = 'pending'", (order_id,))
        if not row:
            return False, "订单不存在或已处理"
        ok, msg = self.activate_card_key(row["card_code"], row["username"])
        if not ok:
            return False, msg
        self.execute(
            f"UPDATE xianyu_orders SET status = 'paid', paid_at = CURRENT_TIMESTAMP, xianyu_trade_no = {ph} WHERE id = {ph}",
            (xianyu_trade_no or row.get("xianyu_trade_no", "") or "", order_id)
        )
        return True, f"已激活，{msg}"

    def get_pending_xianyu_orders(self):
        return self.fetchall("SELECT * FROM xianyu_orders WHERE status = 'pending' ORDER BY id ASC")

    # ========== 卡密系统 ==========
    def generate_card_keys(self, plan_id, count=1, creator=""):
        ph = _ph()
        plan = self.get_payment_plan(plan_id)
        if not plan:
            return False, "套餐不存在"
        codes = []
        import secrets, string
        for _ in range(count):
            code = "XS" + "".join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(14))
            codes.append(code)
        import pymysql
        try:
            for code in codes:
                self.execute(
                    f"INSERT INTO card_keys (code, plan_id, created_by) VALUES ({ph}, {ph}, {ph})",
                    (code, plan_id, creator)
                )
        except pymysql.IntegrityError:
            return False, "卡密生成失败（重复）"
        return True, f"已生成 {len(codes)} 张卡密"

    def list_card_keys(self, status="", plan_id=0, page=1, page_size=20):
        ph = _ph()
        where = []
        params = []
        if status:
            where.append(f"c.status = {ph}")
            params.append(status)
        if plan_id:
            where.append(f"c.plan_id = {ph}")
            params.append(plan_id)
        where_sql = ("WHERE " + " AND ".join(where)) if where else ""
        total = self.fetchone(f"SELECT COUNT(*) cnt FROM card_keys c {where_sql}", params)["cnt"]
        offset = (page - 1) * page_size
        rows = self.fetchall(
            f"SELECT c.*, p.name plan_name, p.price, p.type plan_type FROM card_keys c "
            f"LEFT JOIN payment_plans p ON c.plan_id = p.id {where_sql} ORDER BY c.id DESC LIMIT {ph} OFFSET {ph}",
            params + [page_size, offset]
        )
        return {"total": total, "rows": rows or []}

    def activate_card_key(self, code, username):
        ph = _ph()
        row = self.fetchone(f"SELECT * FROM card_keys WHERE code = {ph}", (code,))
        if not row:
            return False, "卡密不存在"
        if row["status"] != "unused":
            return False, "卡密已被使用"
        plan_id = row["plan_id"]
        plan = self.get_payment_plan(plan_id)
        if not plan:
            return False, "关联套餐不存在"
        plan_type = plan.get("type") or "points"
        points = int(plan.get("points") or 0)
        days = int(plan.get("days") or 30)
        self.execute("BEGIN")
        try:
            cur = self.execute(
                f"UPDATE card_keys SET status = 'used', used_by = {ph}, used_at = CURRENT_TIMESTAMP WHERE id = {ph} AND status = 'unused'",
                (username, row["id"])
            )
            if cur.rowcount == 0:
                self.execute("ROLLBACK")
                return False, "卡密已被使用"
            if plan_type == "monthly":
                self.extend_user_membership(username, days, f"卡密激活：{code}")
            else:
                self.execute(
                    f"UPDATE users SET points_balance = points_balance + {ph} WHERE username = {ph}",
                    (points, username)
                )
            self.execute("COMMIT")
            name = plan.get("name") or ""
            self.execute(
                f"INSERT INTO usage_logs (username, delta_points, balance_after, reason) VALUES ({ph}, 0, 0, {ph})",
                (username, f"卡密激活：{name} ({code})")
            )
            # 写入支付订单记录，便于用户端消费记录展示
            try:
                order_no = f"CAR{int(time.time()*1000)}{abs(hash(code)) % 10000:04d}"
                self.execute(
                    f"""INSERT IGNORE INTO payment_orders (order_no, username, plan_id, plan_name, plan_type, price, points, days, status, pay_method, paid_at)
                        VALUES ({ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, 'paid', 'card', CURRENT_TIMESTAMP)""",
                    (order_no, username, plan_id, name, plan_type, float(plan.get("price") or 0), points, days)
                )
            except Exception:
                pass
            today = datetime.now().strftime("%Y-%m-%d")
            admin = self.get_admin_config() or {}
            if int(admin.get("referral_enabled") or 0):
                self._settle_first_order_commission(username, f"card_{code}", float(plan.get("price") or 0))
            return True, f"卡密激活成功，已获得「{name}」"
        except Exception as e:
            self.execute("ROLLBACK")
            return False, f"激活失败：{str(e)}"

    def _revoke_user_membership(self, username, days):
        """撤销用户包月天数（从 member_until 向前减少）"""
        ph = _ph()
        row = self.get_user_entitlement(username)
        if not row:
            return False
        current = row.get("member_until")
        if not current:
            return True
        try:
            current_dt = datetime.strptime(current.split(".")[0], "%Y-%m-%d %H:%M:%S") if isinstance(current, str) else current
        except Exception:
            return False
        from datetime import timedelta
        new_until = current_dt - timedelta(days=max(0, days))
        now = datetime.now()
        if new_until <= now:
            self.execute(f"UPDATE users SET member_until = NULL WHERE username = {ph}", (username,))
        else:
            self.execute(f"UPDATE users SET member_until = {ph} WHERE username = {ph}", (new_until, username))
        return True

    def _revoke_order_commission(self, order_no):
        """撤销订单的推广佣金"""
        ph = _ph()
        row = self.fetchone(f"SELECT * FROM commission_logs WHERE order_no = {ph}", (order_no,))
        if not row:
            return
        if row.get("status") == "paid":
            # 已结算的佣金从余额扣回
            amount = float(row.get("commission_amount") or 0)
            inviter = row.get("inviter", "")
            self.execute(
                f"UPDATE users SET commission_balance = GREATEST(0, COALESCE(commission_balance,0) - {ph}) WHERE username = {ph}",
                (amount, inviter)
            )
        self.execute(f"UPDATE commission_logs SET status = 'refunded' WHERE order_no = {ph}", (order_no,))

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

    def list_refunded_orders(self, limit=50):
        ph = _ph()
        return self.fetchall(
            f"SELECT * FROM payment_orders WHERE status = 'refunded' ORDER BY refunded_at DESC LIMIT {int(limit)}"
        )

    def list_payment_orders_admin(self, username="", status="", plan_name="", pay_method="", date_from="", date_to="", sort="created_at", order="desc", page=1, page_size=20):
        """管理员支付明细查询，包含闲鱼订单"""
        ph = _ph()
        # 支付订单 WHERE
        po_where = []
        po_params = []
        if username:
            po_where.append(f"po.username LIKE {ph}")
            po_params.append(f"%{username}%")
        if status:
            po_where.append(f"po.status = {ph}")
            po_params.append(status)
        if plan_name:
            po_where.append(f"po.plan_name = {ph}")
            po_params.append(plan_name)
        if pay_method:
            if pay_method == "xianyu":
                po_where.append("1=0")
            else:
                po_where.append(f"po.pay_method = {ph}")
                po_params.append(pay_method)
        if date_from:
            po_where.append(f"DATE(po.created_at) >= {ph}")
            po_params.append(date_from)
        if date_to:
            po_where.append(f"DATE(po.created_at) <= {ph}")
            po_params.append(date_to)
        po_where_sql = (" WHERE " + " AND ".join(po_where)) if po_where else ""

        # 闲鱼订单 WHERE
        xy_where = []
        xy_params = []
        if username:
            xy_where.append(f"xo.username LIKE {ph}")
            xy_params.append(f"%{username}%")
        if status:
            xy_map = {"paid": "paid", "pending": "pending", "refunded": "none", "cancelled": "none"}
            s = xy_map.get(status, "")
            if s == "none":
                xy_where.append("1=0")
            elif s:
                xy_where.append(f"xo.status = {ph}")
                xy_params.append(s)
        if plan_name:
            xy_where.append(f"xo.plan_name = {ph}")
            xy_params.append(plan_name)
        if pay_method:
            if pay_method != "xianyu":
                xy_where.append("1=0")
        if date_from:
            xy_where.append(f"DATE(xo.created_at) >= {ph}")
            xy_params.append(date_from)
        if date_to:
            xy_where.append(f"DATE(xo.created_at) <= {ph}")
            xy_params.append(date_to)
        xy_where_sql = (" WHERE " + " AND ".join(xy_where)) if xy_where else ""

        allowed_sorts = {"created_at": "created_at", "price": "price", "username": "username", "status": "status", "order_no": "order_no", "id": "id"}
        sort_field = allowed_sorts.get(sort, "created_at")
        order_dir = "ASC" if order.lower() == "asc" else "DESC"
        offset = (max(1, int(page)) - 1) * int(page_size)

        total_sql = f"""
            SELECT COUNT(*) AS cnt FROM (
                SELECT po.id FROM payment_orders po{po_where_sql}
                UNION ALL
                SELECT xo.id FROM xianyu_orders xo{xy_where_sql}
            ) t
        """
        total_row = self.fetchone(total_sql, po_params + xy_params) or {}
        total = int(total_row.get("cnt") or 0)

        data_sql = f"""
            SELECT * FROM (
                SELECT po.id, po.order_no, po.username, po.plan_id, po.plan_name, po.plan_type,
                       po.price, po.points, po.days, po.status, po.pay_method, po.pay_channel,
                       po.trade_no, po.qr_code, po.pay_url, po.created_at, po.paid_at,
                       po.refunded_at, po.refund_reason, po.refunded_by,
                       po.bank_order_no, po.pay_type, po.business_type,
                       'payment' as source
                FROM payment_orders po{po_where_sql}
                UNION ALL
                SELECT xo.id, xo.order_no, xo.username, xo.plan_id, xo.plan_name,
                       COALESCE((SELECT pp.plan_type FROM payment_plans pp WHERE pp.id = xo.plan_id), 'points') as plan_type,
                       xo.price, 0 as points, 0 as days,
                       CASE WHEN xo.status = 'paid' THEN 'paid' ELSE 'pending' END as status,
                       'xianyu' as pay_method, '' as pay_channel,
                       '' as trade_no, '' as qr_code, xo.card_code as pay_url,
                       xo.created_at, xo.paid_at,
                       NULL as refunded_at, '' as refund_reason, '' as refunded_by,
                       '' as bank_order_no, '' as pay_type, '' as business_type,
                       'xianyu' as source
                FROM xianyu_orders xo{xy_where_sql}
            ) combined ORDER BY {sort_field} {order_dir} LIMIT {int(page_size)} OFFSET {offset}
        """
        rows = self.fetchall(data_sql, po_params + xy_params) or []

        sum_sql = f"""
            SELECT COALESCE(SUM(price),0) AS total_amount, COUNT(*) AS cnt FROM (
                SELECT price FROM payment_orders po{po_where_sql}
                UNION ALL
                SELECT price FROM xianyu_orders xo{xy_where_sql}
            ) t
        """
        sum_row = self.fetchone(sum_sql, po_params + xy_params) or {}

        return {
            "rows": rows,
            "total": total,
            "page": int(page),
            "page_size": int(page_size),
            "total_pages": (total + int(page_size) - 1) // int(page_size) if total > 0 else 0,
            "sum_amount": float(sum_row.get("total_amount") or 0),
            "sum_count": int(sum_row.get("cnt") or 0)
        }

    # ==================== 用户问题反馈 ====================
    def create_feedback(self, username, email, category, title, content):
        ph = _ph()
        self.execute(
            f"INSERT INTO user_feedback (username, email, category, title, content) VALUES ({ph},{ph},{ph},{ph},{ph})",
            (username, email, category, title, content)
        )
        return True

    def list_user_feedback(self, username, limit=20):
        ph = _ph()
        return self.fetchall(
            f"SELECT * FROM user_feedback WHERE username={ph} ORDER BY id DESC LIMIT {int(limit)}",
            (username,)
        ) or []

    def list_feedback_admin(self, status="", category="", keyword="", page=1, page_size=20):
        ph = _ph()
        where = []
        params = []
        if status:
            where.append(f"status = {ph}")
            params.append(status)
        if category:
            where.append(f"category = {ph}")
            params.append(category)
        if keyword:
            where.append(f"(title LIKE {ph} OR content LIKE {ph} OR username LIKE {ph})")
            kw = f"%{keyword}%"
            params.extend([kw, kw, kw])
        where_clause = (" WHERE " + " AND ".join(where)) if where else ""
        offset = (max(1, int(page)) - 1) * int(page_size)
        total_row = self.fetchone(f"SELECT COUNT(*) AS cnt FROM user_feedback{where_clause}", params) or {}
        total = int(total_row.get("cnt") or 0)
        rows = self.fetchall(
            f"SELECT * FROM user_feedback{where_clause} ORDER BY id DESC LIMIT {int(page_size)} OFFSET {offset}",
            params
        ) or []
        stats_row = self.fetchone("SELECT COUNT(*) AS cnt FROM user_feedback WHERE status IN ('pending','processing')") or {}
        pending_count = int(stats_row.get("cnt") or 0)
        return {
            "rows": rows,
            "total": total,
            "page": int(page),
            "page_size": int(page_size),
            "total_pages": (total + int(page_size) - 1) // int(page_size),
            "pending_count": pending_count
        }

    def get_feedback_by_id(self, fid):
        ph = _ph()
        return self.fetchone(f"SELECT * FROM user_feedback WHERE id={ph}", (fid,))

    def update_feedback_status(self, fid, status):
        ph = _ph()
        self.execute(f"UPDATE user_feedback SET status={ph} WHERE id={ph}", (status, fid))
        return True

    def reply_feedback(self, fid, reply_text):
        ph = _ph()
        self.execute(f"UPDATE user_feedback SET admin_reply={ph}, replied_at=NOW(), status='resolved' WHERE id={ph}", (reply_text, fid))
        return True

    def add_feedback_reply(self, feedback_id, sender, content):
        """添加一条对话记录"""
        ph = _ph()
        self.execute(
            f"INSERT INTO feedback_replies (feedback_id, sender, content) VALUES ({ph},{ph},{ph})",
            (feedback_id, sender, content)
        )
        return True

    def list_feedback_replies(self, feedback_id):
        """获取反馈的所有对话记录"""
        ph = _ph()
        return self.fetchall(
            f"SELECT * FROM feedback_replies WHERE feedback_id={ph} ORDER BY id ASC",
            (feedback_id,)
        ) or []

    def auto_close_expired_feedback(self, days=7):
        """自动关闭超时的已回复反馈（超过N天无新对话）"""
        try:
            self.execute(
                "UPDATE user_feedback SET status='closed' WHERE status='resolved' "
                "AND replied_at < DATE_SUB(NOW(), INTERVAL %s DAY)",
                (days,)
            )
        except Exception:
            pass

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
        sql = "SELECT id, provider_key, username, model, question, answer, status, error, duration_ms, client_ip, created_at FROM ai_call_logs"
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
        return self.fetchall("SELECT id, scene, subject, body_text, body_html, content_type, variables, is_resend, created_at, updated_at FROM email_templates ORDER BY updated_at DESC")

    def get_email_template(self, template_id):
        """获取单个邮件模板"""
        ph = _ph()
        row = self.fetchone(f"SELECT * FROM email_templates WHERE id = {ph}", (template_id,))
        return row

    def get_email_template_by_scene(self, scene):
        """根据场景获取邮件模板"""
        ph = _ph()
        return self.fetchone(f"SELECT * FROM email_templates WHERE scene = {ph}", (scene,))

    def create_email_template(self, scene, subject, body_text, body_html, content_type, variables, is_resend=0):
        """创建邮件模板（同场景禁止重复）"""
        ph = _ph()
        existing = self.fetchone(f"SELECT id FROM email_templates WHERE scene = {ph}", (scene,))
        if existing:
            raise ValueError("该应用场景的模板已存在，请直接编辑")
        self.execute(
            f"INSERT INTO email_templates (scene, subject, body_text, body_html, content_type, variables, is_resend) "
            f"VALUES ({ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph})",
            (scene, subject, body_text, body_html, content_type, variables, 1 if is_resend else 0)
        )
        row = self.fetchone(f"SELECT id FROM email_templates WHERE scene = {ph}", (scene,))
        return row["id"] if row else None

    def update_email_template(self, template_id, scene, subject, body_text, body_html, content_type, variables, is_resend=0):
        """更新邮件模板"""
        ph = _ph()
        self.execute(
            f"UPDATE email_templates SET scene={ph}, subject={ph}, body_text={ph}, body_html={ph}, content_type={ph}, variables={ph}, is_resend={ph} WHERE id={ph}",
            (scene, subject, body_text, body_html, content_type, variables, 1 if is_resend else 0, template_id)
        )

    def delete_email_template(self, template_id):
        """删除邮件模板"""
        ph = _ph()
        self.execute(f"DELETE FROM email_templates WHERE id = {ph}", (template_id,))

    def get_email_template_resend(self, scene):
        """获取某个场景的补发(没收到邮件)模板"""
        ph = _ph()
        return self.fetchone(f"SELECT * FROM email_templates WHERE scene = {ph} AND is_resend = 1", (scene,))

    # ==================== 每日数据邮件定时配置 ====================
    def get_daily_report_config(self):
        """获取每日数据邮件配置（单行，id=1）"""
        return self.fetchone("SELECT * FROM daily_report_config WHERE id = 1")

    def update_daily_report_config(self, enabled=None, send_time=None, recipients=None, template_id=None):
        """更新每日数据邮件配置"""
        updates = []
        params = []
        if enabled is not None:
            updates.append("enabled = %s")
            params.append(1 if enabled else 0)
        if send_time is not None:
            updates.append("send_time = %s")
            params.append((send_time or "08:00").strip())
        if recipients is not None:
            updates.append("recipients = %s")
            params.append((recipients or "").strip())
        if template_id is not None:
            updates.append("template_id = %s")
            params.append(int(template_id) if template_id else None)
        if not updates:
            return
        self.execute(f"UPDATE daily_report_config SET {', '.join(updates)} WHERE id = 1", tuple(params))

    def set_daily_report_sent_result(self, last_sent_at, last_status, last_error=""):
        """记录上次发送结果"""
        self.execute(
            "UPDATE daily_report_config SET last_sent_at = %s, last_status = %s, last_error = %s WHERE id = 1",
            (last_sent_at, last_status, last_error or "")
        )

    # ==================== 邮件服务器管理 ====================
    def _migrate_mail_servers(self):
        """将旧版 admin_config 中的单 SMTP 配置迁移为 mail_servers 记录"""
        try:
            cnt = self.fetchone("SELECT COUNT(*) AS c FROM mail_servers")
            if cnt and int(cnt.get("c") or 0) > 0:
                return
            admin = self.get_admin_config() or {}
            host = (admin.get("smtp_host") or "").strip()
            user = (admin.get("smtp_user") or "").strip()
            pwd = (admin.get("smtp_pass") or "").strip()
            if not all([host, user, pwd]):
                return
            port = int(admin.get("smtp_port") or 587)
            from_addr = (admin.get("from_addr") or "").strip() or user
            self.execute(
                "INSERT INTO mail_servers (name, type, enabled, weight, smtp_host, smtp_port, smtp_user, smtp_pass, from_addr, from_name) "
                "VALUES (%s, 'smtp', %s, 1, %s, %s, %s, %s, %s, '学神助手')",
                ("默认 SMTP", 1 if admin.get("email_enabled") else 0, host, port, user, pwd, from_addr)
            )
            print("[DB迁移] 已将旧版 SMTP 配置迁移为邮件服务器记录")
        except Exception as e:
            print(f"[DB迁移警告] 迁移邮件服务器失败: {e}")

    def list_mail_servers(self, enabled_only=False):
        ph = _ph()
        sql = "SELECT id, name, type, enabled, weight, smtp_host, smtp_port, smtp_user, smtp_pass, from_addr, from_name, secret_id, secret_key, ses_region, ses_template_id, is_resend, created_at, updated_at FROM mail_servers"
        if enabled_only:
            sql += " WHERE enabled = 1"
        sql += " ORDER BY id ASC"
        return self.fetchall(sql)

    def get_mail_server(self, server_id):
        ph = _ph()
        return self.fetchone(f"SELECT * FROM mail_servers WHERE id = {ph}", (server_id,))

    def create_mail_server(self, data):
        ph = _ph()
        self.execute(
            f"INSERT INTO mail_servers (name, type, enabled, weight, smtp_host, smtp_port, smtp_user, smtp_pass, from_addr, from_name, secret_id, secret_key, ses_region, ses_template_id, is_resend) "
            f"VALUES ({ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph})",
            (data.get("name", ""), data.get("type", "smtp"), 1 if data.get("enabled") else 0,
             int(data.get("weight") or 1), (data.get("smtp_host") or "").strip(),
             int(data.get("smtp_port") or 587), (data.get("smtp_user") or "").strip(),
             data.get("smtp_pass") or "", (data.get("from_addr") or "").strip(),
             (data.get("from_name") or "").strip() or "学神助手",
             (data.get("secret_id") or "").strip(), (data.get("secret_key") or "").strip(),
             (data.get("ses_region") or "ap-guangzhou").strip(), int(data.get("ses_template_id") or 0),
             1 if data.get("is_resend") else 0)
        )
        row = self.fetchone("SELECT LAST_INSERT_ID() AS id")
        return row.get("id") if row else None

    def update_mail_server(self, server_id, data):
        ph = _ph()
        sets = [
            f"name={ph}", f"type={ph}", f"enabled={ph}", f"weight={ph}",
            f"smtp_host={ph}", f"smtp_port={ph}", f"smtp_user={ph}",
            f"from_addr={ph}", f"from_name={ph}",
            f"secret_id={ph}", f"ses_region={ph}", f"ses_template_id={ph}", f"is_resend={ph}"
        ]
        params = [
            data.get("name", ""), data.get("type", "smtp"), 1 if data.get("enabled") else 0,
            int(data.get("weight") or 1), (data.get("smtp_host") or "").strip(),
            int(data.get("smtp_port") or 587), (data.get("smtp_user") or "").strip(),
            (data.get("from_addr") or "").strip(), (data.get("from_name") or "").strip() or "学神助手",
            (data.get("secret_id") or "").strip(), (data.get("ses_region") or "ap-guangzhou").strip(),
            int(data.get("ses_template_id") or 0), 1 if data.get("is_resend") else 0
        ]
        # 密码为空时不更新（保留原值）
        pwd = data.get("smtp_pass")
        if pwd:
            sets.append(f"smtp_pass={ph}")
            params.append(pwd)
        # SecretKey 为空时不更新（保留原值）
        sk = data.get("secret_key")
        if sk:
            sets.append(f"secret_key={ph}")
            params.append(sk)
        params.append(server_id)
        self.execute(f"UPDATE mail_servers SET {', '.join(sets)} WHERE id = {ph}", tuple(params))

    def delete_mail_server(self, server_id):
        ph = _ph()
        self.execute(f"DELETE FROM mail_servers WHERE id = {ph}", (server_id,))

    def set_email_enabled(self, enabled):
        ph = _ph()
        self.execute(f"UPDATE admin_config SET email_enabled = {ph} WHERE id = 1", (1 if enabled else 0,))

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

    def get_feedback_auto_close_days(self):
        row = self.fetchone("SELECT feedback_auto_close_days FROM admin_config WHERE id = 1")
        return int(row.get("feedback_auto_close_days") or 7) if row else 7

    def set_feedback_auto_close_days(self, days):
        ph = _ph()
        self.execute(f"UPDATE admin_config SET feedback_auto_close_days = {ph} WHERE id = 1", (int(days),))

    def get_feedback_notify_enabled(self):
        row = self.fetchone("SELECT feedback_notify_enabled FROM admin_config WHERE id = 1")
        return bool(row.get("feedback_notify_enabled")) if row else False

    def set_feedback_notify_enabled(self, enabled):
        ph = _ph()
        self.execute(f"UPDATE admin_config SET feedback_notify_enabled = {ph} WHERE id = 1", (1 if enabled else 0,))

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
                COALESCE(SUM(CASE WHEN status='refunded' THEN price ELSE 0 END), 0) AS total_refunded,
                COUNT(CASE WHEN status='paid' THEN 1 END) AS paid_count
            FROM payment_orders WHERE username = {ph}
        """
        row = self.fetchone(pay_sql, (username,))
        total_recharged = float(row.get('total_recharged') or 0) if row else 0
        total_refunded = float(row.get('total_refunded') or 0) if row else 0
        total_recharged = round(max(0, total_recharged - total_refunded), 2)

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

        admin = self.get_admin_config() or {}
        refund_days = int(admin.get("refund_days_limit") or 7)
        recent_orders_sql = f"""
            SELECT order_no, plan_name, price, status, created_at, paid_at
            FROM payment_orders WHERE username = {ph}
            ORDER BY id DESC LIMIT 5
        """
        rows = self.fetchall(recent_orders_sql, (username,))
        recent_orders = []
        for r in (rows or []):
            ca = r.get('created_at')
            if hasattr(ca, 'strftime'):
                ca = ca.strftime('%Y-%m-%d %H:%M')
            can_refund = False
            if r.get('status') == 'paid' and refund_days > 0:
                paid_at = r.get('paid_at')
                if paid_at:
                    if isinstance(paid_at, str):
                        paid_at = datetime.strptime(paid_at.split(".")[0], "%Y-%m-%d %H:%M:%S")
                    from datetime import timedelta
                    deadline = paid_at + timedelta(days=refund_days)
                    if datetime.now() <= deadline:
                        can_refund = True
            order_nos = [ri.get('order_no') for ri in rows if ri.get('order_no')]
            refund_req_map = {}
            if order_nos:
                placeholders = ",".join([ph] * len(order_nos))
                req_rows = self.fetchall(
                    f"SELECT r.order_no, r.status FROM refund_requests r WHERE r.order_no IN ({placeholders}) ORDER BY r.id DESC",
                    order_nos
                )
                for rr in (req_rows or []):
                    if rr['order_no'] not in refund_req_map:
                        refund_req_map[rr['order_no']] = rr['status']
            rr_status = refund_req_map.get(r.get('order_no'), '')
            recent_orders.append({
                'order_no': r.get('order_no') or '',
                'plan_name': r.get('plan_name') or '',
                'price': float(r.get('price') or 0),
                'status': r.get('status') or '',
                'created_at': str(ca) if ca else '',
                'can_refund': can_refund and not rr_status,
                'refund_request_status': rr_status,
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
