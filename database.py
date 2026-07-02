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

    def _ensure_payment_columns(self):
        self._add_column_if_missing("users", "points_balance", "points_balance INT DEFAULT 0")
        self._add_column_if_missing("users", "member_until", "member_until TIMESTAMP NULL")
        self._add_column_if_missing("users", "is_banned", "is_banned TINYINT DEFAULT 0")
        self._add_column_if_missing("users", "ban_reason", "ban_reason VARCHAR(255)")

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
        self._add_column_if_missing("admin_config", "sandpay_notify_url", "sandpay_notify_url VARCHAR(500)")
        self._add_column_if_missing("admin_config", "sandpay_return_url", "sandpay_return_url VARCHAR(500)")
        # 易支付(支付FM兼容模式)
        self._add_column_if_missing("admin_config", "epay_enabled", "epay_enabled TINYINT DEFAULT 0")
        self._add_column_if_missing("admin_config", "epay_api_url", "epay_api_url VARCHAR(255)")
        self._add_column_if_missing("admin_config", "epay_pid", "epay_pid VARCHAR(20)")
        self._add_column_if_missing("admin_config", "epay_key", "epay_key VARCHAR(128)")
        self._add_column_if_missing("admin_config", "epay_notify_url", "epay_notify_url VARCHAR(500)")
        self._add_column_if_missing("admin_config", "epay_return_url", "epay_return_url VARCHAR(500)")

    def _ensure_order_payment_columns(self):
        self._add_column_if_missing("payment_orders", "pay_method", "pay_method VARCHAR(20)")
        self._add_column_if_missing("payment_orders", "pay_channel", "pay_channel VARCHAR(20)")
        self._add_column_if_missing("payment_orders", "trade_no", "trade_no VARCHAR(128)")
        self._add_column_if_missing("payment_orders", "qr_code", "qr_code TEXT")
        self._add_column_if_missing("payment_orders", "pay_url", "pay_url TEXT")
        self._add_column_if_missing("payment_orders", "paid_at", "paid_at TIMESTAMP NULL")

    # ==================== 用户相关 ====================
    def create_user(self, username, email, password_hash):
        ph = _ph()
        try:
            self.execute(
                f"INSERT INTO users (username, email, password_hash, is_verified) VALUES ({ph}, {ph}, {ph}, 0)",
                (username, email, password_hash)
            )
            return True, None
        except Exception as e:
            return False, str(e)

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
            f"SELECT username, email, is_verified, points_balance, member_until, is_banned, ban_reason FROM users WHERE username = {ph}",
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

    def create_pending_order(self, username, plan, pay_method="alipay", pay_channel="", trade_no="", qr_code="", pay_url=""):
        ph = _ph()
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
            like = f"%{keyword}%"
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
            like = f"%{keyword}%"
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
