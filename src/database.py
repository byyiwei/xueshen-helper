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
from dbutils.pooled_db import PooledDB
from datetime import datetime, timedelta
from decimal import Decimal, ROUND_HALF_UP

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


# —— 地域归一化（用户画像统计用）——
# 归属地有两种来源格式，同一个地方会写成两样，不先归一的话排名会碎成两条重复项：
#   pconline（国内） : "广东省广州市" / "西藏拉萨市"
#   ip-api/ipwho.is  : "中国 广东 广州市" / "中国 江苏省 南京"（空格分隔、末段可不带“市”）
#   海外/港澳台       : "美国 佛罗里达州 迈阿密" / "香港 北區 古洞"
_CN_PROVINCE_CANON = {
    "北京": "北京市", "天津": "天津市", "上海": "上海市", "重庆": "重庆市",
    "河北": "河北省", "山西": "山西省", "辽宁": "辽宁省", "吉林": "吉林省", "黑龙江": "黑龙江省",
    "江苏": "江苏省", "浙江": "浙江省", "安徽": "安徽省", "福建": "福建省", "江西": "江西省",
    "山东": "山东省", "河南": "河南省", "湖北": "湖北省", "湖南": "湖南省", "广东": "广东省",
    "海南": "海南省", "四川": "四川省", "贵州": "贵州省", "云南": "云南省", "陕西": "陕西省",
    "甘肃": "甘肃省", "青海": "青海省", "台湾": "台湾省",
    "内蒙古": "内蒙古", "广西": "广西", "西藏": "西藏", "宁夏": "宁夏", "新疆": "新疆",
    "香港": "香港", "澳门": "澳门",
}
# 长名优先，保证 "黑龙江/内蒙古" 这类多字省名不被短名抢先匹配
_CN_PROVINCE_KEYS = sorted(_CN_PROVINCE_CANON, key=len, reverse=True)


def _province_of(addr):
    """归属地 → 省级名称；海外/港澳台取第一段（国家或地区名），分不出就原样返回。"""
    a = (addr or "").strip()
    if not a:
        return ""
    parts = a.split()
    if len(parts) >= 2 and parts[0] not in ("中国", "中国大陆"):
        return parts[0]
    cand = parts[1] if len(parts) >= 2 else parts[0]
    for name in _CN_PROVINCE_KEYS:
        if cand.startswith(name):
            return _CN_PROVINCE_CANON[name]
    return cand


def _strip_admin_suffix(s):
    """去掉一个市/区后缀："广州市"→"广州"，"北京市"→"北京"。"""
    for suf in ("市", "区"):
        if s.endswith(suf) and len(s) > len(suf):
            return s[:-len(suf)]
    return s


def _city_of(addr):
    """归属地 → 市级名称（归一后两种格式会合并），取不到就用省级兜底。"""
    a = (addr or "").strip()
    if not a:
        return ""
    parts = a.split()
    if len(parts) >= 2:
        city = parts[-1]
    else:
        t = parts[0]
        if "省" in t:
            city = t.split("省", 1)[1] or t
        else:
            city = t
            for name in _CN_PROVINCE_KEYS:
                if t.startswith(name) and len(t) > len(name):
                    city = t[len(name):]
                    break
    city = city.strip()
    if city in ("市", "区", "省"):   # 只剩行政级别字，说明本身是直辖市/省名
        city = ""
    city = _strip_admin_suffix(city)
    return city or _strip_admin_suffix(_province_of(a))


def _model_expire_date(value):
    """模型到期日期只认 YYYY-MM-DD：留空写 NULL（永久有效）。
    写成别的直接报错，不悄悄当空处理——静默丢掉日期等于把「到期停用」这句话撤销了。
    """
    text = str(value or "").strip()[:10]
    if not text:
        return None
    try:
        datetime.strptime(text, "%Y-%m-%d")
    except ValueError:
        raise ValueError("模型到期日期格式不对：%s（应填 2026-12-31 这种 YYYY-MM-DD，留空表示永久有效）" % value)
    return text


def _dedupe_model_items(models):
    """同一提供商下的模型按 ID 去重。

    前端历史上允许重复添加同一个模型，而 ai_models 是一行一条。重复项里
    只要有一条到期日期为空，过期检查就会被绕过（空日期永远判为永久有效），
    所以读写两侧都收敛成一条，到期日期取最早的非空值。
    """
    merged = []
    positions = {}
    for model in models or []:
        if not isinstance(model, dict):
            continue
        key = str(model.get("value") or "").strip().lower()
        if not key:
            merged.append(dict(model))
            continue
        if key not in positions:
            positions[key] = len(merged)
            merged.append(dict(model))
            continue
        kept = merged[positions[key]]
        expire = str(model.get("expire_date") or "")[:10]
        kept_expire = str(kept.get("expire_date") or "")[:10]
        if expire and (not kept_expire or expire < kept_expire):
            kept["expire_date"] = expire
        # 权重取大值：重复项不能把仍在用的模型意外降成 0（0 表示关闭）
        try:
            kept["weight"] = max(int(kept.get("weight") or 0), int(model.get("weight") or 0))
        except (TypeError, ValueError):
            pass
        if model.get("label") and not kept.get("label"):
            kept["label"] = model["label"]
        if model.get("vision"):
            kept["vision"] = True
        for limit_key in ("daily_token_limit", "total_token_limit"):
            try:
                cur = int(kept.get(limit_key) or 0)
                new = int(model.get(limit_key) or 0)
            except (TypeError, ValueError):
                continue
            # 0 = 不限；有具体额度时取更严格的非零值
            if new > 0 and (cur <= 0 or new < cur):
                kept[limit_key] = new
    return merged


def _dec(value, default="0"):
    """把 DECIMAL/None/空串统一转成 Decimal。金额运算禁止走 float。"""
    try:
        if value is None or value == "":
            return Decimal(str(default))
        return Decimal(str(value))
    except Exception:
        return Decimal(str(default))


CENT = Decimal("0.01")


# ==================== 题型归一化 ====================
# 题库中的题型存在多种编码：数字(0/1/2...)、英文(single/multiple)、中文(单选题) 等，
# 统一归一化到语义名称，用于题型分布合并与题库查询筛选。
QUESTION_TYPE_NAME_TO_VALUES = {
    "单选题": ["0", "single", "单选题", "单项选择题", "单项选择", "单选", "A1型选择题", "A1型题", "A1型"],
    "多选题": ["1", "multiple", "多选题", "多项选择题", "多项选择", "多选", "X型题", "X型", "X型选择题", "不定项", "不定项选择题"],
    "判断题": ["3", "judge", "判断题", "是非题", "判断"],
    "填空题": ["2", "fill", "填空题", "填空", "思政元素", "完型填空", "完形填空题", "完形填空", "14"],
    "简答题": ["4", "short", "简答题", "简答"],
    "名词解释": ["5", "名词解释"],
    "论述题": ["6", "论述题", "论述"],
    "计算题": ["7", "计算题", "计算"],
    "连线题": ["11", "连线题", "匹配题", "匹配"],
    "阅读理解": ["15", "阅读理解", "阅读"],
}


def _question_type_values(name):
    """根据归一化题型名返回对应的 question_type 原值列表；无法识别时返回空列表。"""
    if name == "_image_":
        return []
    if name == "未分类":
        return [""]
    return QUESTION_TYPE_NAME_TO_VALUES.get(name, [])


def _normalize_question_type_name(t):
    t = str(t or "").strip()
    if not t:
        return "未分类"
    for name, values in QUESTION_TYPE_NAME_TO_VALUES.items():
        if t in values:
            return name
    if t in ("999",):
        return "未知"
    return t


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
        # 使用线程安全的连接池：连接在查询结束后归还池中复用。
        # 既保留「避免 PyMySQL 单连接跨线程冲突」的原有意图，又省去每次查询的完整握手。
        import pymysql
        self.conn = None
        self._pool = PooledDB(
            creator=pymysql,
            maxconnections=12,   # 池内最大连接数（须小于 MySQL max_connections）
            mincached=2,         # 启动时预热连接
            maxcached=8,
            blocking=True,       # 池满时等待，而非直接报错
            ping=1,              # 取连接时探活，自动重连失效连接
            **MYSQL_CONFIG,
            cursorclass=pymysql.cursors.DictCursor,
            autocommit=False
        )

    def _new_mysql_conn(self):
        # 从连接池取连接；调用方 close() 即归还池中复用
        return self._pool.connection()

    # 连接被服务端掐断时 pymysql 会抛 InterfaceError (0, '') / 2006 / 2013。
    # pooling 的 ping=1 只能探活「取连接时」，取到之后、语句真正执行前仍可能被断，
    # 这时语句根本没落地，整体重取连接重试一次是安全的（读操作更是幂等）。
    _CONN_LOST_CODES = (0, 2006, 2013, 2055)

    @classmethod
    def _is_conn_lost(cls, exc):
        args = getattr(exc, "args", ()) or ()
        if args and args[0] in cls._CONN_LOST_CODES:
            return True
        msg = str(exc).lower()
        return ("lost connection" in msg or "server has gone away" in msg
                or "connection already closed" in msg or "broken pipe" in msg)

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
        # 注册/登录 IP 与归属地：历史行为空，新增记录起开始采集；
        # 归属地由 backend 的后台线程异步回填（见 set_ip_geo）
        self._add_column_if_missing("users", "register_ip", "register_ip VARCHAR(64) DEFAULT '' COMMENT '注册IP'")
        self._add_column_if_missing("users", "register_ip_addr", "register_ip_addr VARCHAR(200) DEFAULT '' COMMENT '注册IP归属地'")
        self._add_column_if_missing("users", "last_login_ip", "last_login_ip VARCHAR(64) DEFAULT '' COMMENT '最后登录IP'")
        self._add_column_if_missing("users", "last_login_ip_addr", "last_login_ip_addr VARCHAR(200) DEFAULT '' COMMENT '最后登录IP归属地'")

        self._ensure_payment_columns()

        # 退款相关列
        self._add_column_if_missing("payment_orders", "refunded_at", "refunded_at TIMESTAMP NULL COMMENT '退款时间'")
        self._add_column_if_missing("payment_orders", "refund_reason", "refund_reason VARCHAR(500) DEFAULT '' COMMENT '退款原因'")
        self._add_column_if_missing("payment_orders", "refunded_by", "refunded_by VARCHAR(50) DEFAULT '' COMMENT '退款操作人'")
        self._add_column_if_missing("payment_orders", "refund_amount", "refund_amount DECIMAL(10,2) DEFAULT 0 COMMENT '实际退款金额'")
        self._add_column_if_missing("payment_orders", "refund_detail", "refund_detail TEXT COMMENT '退款计算说明'")

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
        self._add_column_if_missing("admin_config", "log_cleanup_last_at", "log_cleanup_last_at DATETIME NULL COMMENT '上次日志清理时间（用于24小时定时判断，持久化避免重启重置）'")

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

        # 用户做过的题：同一用户同一道题只扣一次题数
        # 题目身份用「题面+题型+选项+图片指纹」的匹配键，**不含答案** ——
        # 答案换了一般还是同一道题，不该二次收费；含答案的指纹会随答案变化，不能当身份用。
        self.execute(f"""
            CREATE TABLE IF NOT EXISTS user_question_history (
                id INT PRIMARY KEY AUTO_INCREMENT,
                username VARCHAR(50) NOT NULL,
                question_key CHAR(64) NOT NULL COMMENT '题目身份: 题面+题型+选项+图片指纹(不含答案)',
                ask_count INT NOT NULL DEFAULT 1 COMMENT '这道题被该用户问了几次',
                charged_count INT NOT NULL DEFAULT 0 COMMENT '其中实际扣了几次题数',
                first_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY uk_user_question (username, question_key),
                INDEX idx_username (username)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)

        self._ensure_order_payment_columns()
        self._ensure_xianyu_tables()
        self._ensure_distributor_tables()
        self._ensure_distributor_columns()

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
                total_token_limit INT DEFAULT 0,
                sort_order INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_provider_key (provider_key)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)
        # 兼容旧表：添加列（如果不存在）
        for col, ddl in [("weight", "weight INT DEFAULT 100"), ("daily_token_limit", "daily_token_limit INT DEFAULT 0"), ("total_token_limit", "total_token_limit INT DEFAULT 0"), ("vision", "vision TINYINT DEFAULT 0"), ("expire_date", "expire_date DATE NULL")]:
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
                final_model VARCHAR(255) DEFAULT '' COMMENT '最终成功调用的模型(auto切换失败后)',
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
        self._add_column_if_missing("ai_call_logs", "final_model", "final_model VARCHAR(255) DEFAULT ''")
        # 写入时快照：调用记录里的「剩余/到期」应是该次写入时的值，不能每次列表 JOIN 当前余额
        self._add_column_if_missing("ai_call_logs", "points_balance", "points_balance INT NULL COMMENT '写入时题数快照'")
        self._add_column_if_missing("ai_call_logs", "member_until", "member_until TIMESTAMP NULL COMMENT '写入时包月到期快照'")
        # 题库调用日志
        self.execute("""
            CREATE TABLE IF NOT EXISTS bank_call_logs (
                id INT PRIMARY KEY AUTO_INCREMENT,
                username VARCHAR(50) DEFAULT '' COMMENT '用户',
                question_hash VARCHAR(64) NOT NULL COMMENT '题目hash',
                question_text TEXT NOT NULL COMMENT '题目内容',
                question_type VARCHAR(50) DEFAULT '' COMMENT '题型',
                options_text TEXT COMMENT '选项',
                matched TINYINT DEFAULT 0 COMMENT '是否命中',
                matched_hash VARCHAR(64) DEFAULT '' COMMENT '命中题目的hash',
                match_method VARCHAR(20) DEFAULT '' COMMENT '命中方式: hash/standard/fuzzy/none',
                duration_ms INT DEFAULT 0 COMMENT '匹配耗时(毫秒)',
                client_ip VARCHAR(64) DEFAULT '' COMMENT '客户端IP',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_created_at (created_at),
                INDEX idx_matched (matched),
                INDEX idx_username (username),
                INDEX idx_question_hash (question_hash)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)
        self._add_column_if_missing("bank_call_logs", "points_balance", "points_balance INT NULL COMMENT '写入时题数快照'")
        self._add_column_if_missing("bank_call_logs", "member_until", "member_until TIMESTAMP NULL COMMENT '写入时包月到期快照'")
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
        self._add_column_if_missing("script_event_logs", "points_balance", "points_balance INT NULL COMMENT '写入时题数快照'")
        self._add_column_if_missing("script_event_logs", "member_until", "member_until TIMESTAMP NULL COMMENT '写入时包月到期快照'")
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
        self._add_column_if_missing("question_bank", "matching_key", "matching_key VARCHAR(64) NOT NULL DEFAULT '' COMMENT '匹配键: 题面+题型+选项'")
        self._ensure_index("question_bank", "idx_matching_key", "matching_key")
        self._add_column_if_missing("question_bank", "is_image", "is_image TINYINT NOT NULL DEFAULT 0 COMMENT '是否图片题'")
        self._ensure_index("question_bank", "idx_is_image", "is_image")
        self._add_column_if_missing("question_bank", "match_stem", "match_stem VARCHAR(64) NOT NULL DEFAULT '' COMMENT '匹配主干: 题面+题型+图片(不含选项)'")
        self._ensure_index("question_bank", "idx_match_stem", "match_stem")
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
        # 退款金额与计算说明（历史表补列）
        self._add_column_if_missing("refund_requests", "refund_amount", "refund_amount DECIMAL(10,2) DEFAULT 0 COMMENT '应退金额'")
        self._add_column_if_missing("refund_requests", "refund_detail", "refund_detail TEXT COMMENT '退款计算说明'")
        # 申请时客户端 IP 与归属地（后台线程异步回填归属地）
        self._add_column_if_missing("refund_requests", "client_ip", "client_ip VARCHAR(64) DEFAULT '' COMMENT '申请IP'")
        self._add_column_if_missing("refund_requests", "client_ip_addr", "client_ip_addr VARCHAR(200) DEFAULT '' COMMENT '申请IP归属地'")

        # ===== 题数批次（用于精确核算单笔订单的剩余题数）=====
        # 每次充值/发放生成一个批次；答题扣点按 FIFO 消耗批次，
        # 使每笔订单"还剩多少题"可精确计算，退款不再用用户总余额近似。
        self.execute("""
            CREATE TABLE IF NOT EXISTS point_lots (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) NOT NULL COMMENT '用户',
                order_no VARCHAR(64) DEFAULT '' COMMENT '来源订单号（空=非订单来源）',
                source VARCHAR(20) NOT NULL DEFAULT 'order' COMMENT 'order/register/admin/other',
                total_points INT NOT NULL DEFAULT 0 COMMENT '批次总题数',
                used_points INT NOT NULL DEFAULT 0 COMMENT '本批次已消耗题数',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_user (username),
                INDEX idx_order (order_no)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)
        # 流水表补订单号便于对账（历史数据留空）
        self._add_column_if_missing("usage_logs", "order_no", "order_no VARCHAR(64) DEFAULT '' COMMENT '关联订单号'")

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
        # 佣金核销台账：兑换题数与下单抵扣共用一张表。
        # request_no 唯一 = 重复提交只会有一次扣款；order_no 唯一 = 一个订单只可能有一条抵扣记录。
        self.execute("""
            CREATE TABLE IF NOT EXISTS commission_redemptions (
                id INT PRIMARY KEY AUTO_INCREMENT,
                username VARCHAR(50) NOT NULL,
                kind VARCHAR(20) NOT NULL COMMENT 'exchange=兑换题数, checkout=下单抵扣',
                request_no VARCHAR(64) NOT NULL COMMENT '客户端幂等号',
                order_no VARCHAR(64) NULL COMMENT '下单抵扣关联订单号，兑换为空',
                amount DECIMAL(10,2) NOT NULL COMMENT '消耗佣金（元）',
                points INT NOT NULL DEFAULT 0 COMMENT '兑换所得题数',
                rate DECIMAL(10,4) NOT NULL DEFAULT 0 COMMENT '成交比率快照（题/元）',
                status VARCHAR(20) NOT NULL DEFAULT 'pending' COMMENT 'pending/locked/done/consumed/released/failed',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY uk_request (username, request_no),
                UNIQUE KEY uk_order (order_no),
                INDEX idx_user_status (username, status),
                INDEX idx_status_created (status, created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)
        # 订单价拆成两列记账：price 恒为「现金实付」，退款、收入统计、佣金结算三条口径都只认它。
        self._add_column_if_missing("payment_orders", "plan_price", "plan_price DECIMAL(10,2) DEFAULT 0 COMMENT '档位原价（抵扣前）'")
        self._add_column_if_missing("payment_orders", "commission_used", "commission_used DECIMAL(10,2) DEFAULT 0 COMMENT '本单抵扣掉的佣金（元）'")
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

        # 首页免费搜题每日计数表（按 用户+日期 记录当天搜索次数）
        self.execute("""
            CREATE TABLE IF NOT EXISTS web_search_daily (
                id INT PRIMARY KEY AUTO_INCREMENT,
                username VARCHAR(100) NOT NULL,
                search_date DATE NOT NULL,
                search_count INT DEFAULT 0,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE INDEX idx_user_date (username, search_date)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)

        # 题库工具：个人（私人）题库。按 username 隔离，命中不入公共题库。
        self.execute("""
            CREATE TABLE IF NOT EXISTS user_question_bank (
                id INT PRIMARY KEY AUTO_INCREMENT,
                username VARCHAR(100) NOT NULL,
                item_hash VARCHAR(64) NOT NULL,
                question_text TEXT NOT NULL,
                question_type VARCHAR(50) DEFAULT '',
                options_text TEXT,
                answer TEXT NOT NULL,
                source VARCHAR(32) DEFAULT 'import',
                hit_count INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE INDEX idx_user_item (username, item_hash),
                INDEX idx_user_created (username, created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)

        # 题库工具：答案有误上报。同一题被报 2 次即给公共题库打降级标记。
        self.execute("""
            CREATE TABLE IF NOT EXISTS question_answer_reports (
                id INT PRIMARY KEY AUTO_INCREMENT,
                username VARCHAR(100) NOT NULL,
                question_hash VARCHAR(64) NOT NULL DEFAULT '',
                question_text TEXT,
                answer_text TEXT,
                reason VARCHAR(200) DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_hash (question_hash),
                INDEX idx_user_created (username, created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)
        # 答案降级标记表：被多次上报有误的题记在这里。
        # 刻意不动 question_bank（生产表很大，ALTER 会长时间占连接，2C/2G 上还可能超时），
        # 改用一张小表 + 进程内缓存过滤，加表是瞬时操作。
        self.execute("""
            CREATE TABLE IF NOT EXISTS question_answer_flags (
                question_hash VARCHAR(64) PRIMARY KEY,
                report_count INT DEFAULT 0,
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
        """执行 SQL（连接被服务端掐断时自动重取连接重试一次）"""
        for attempt in range(2):
            conn = self._new_mysql_conn()
            try:
                cursor = conn.cursor()
                cursor.execute(sql, _adapt_params(params))
                conn.commit()
                return cursor
            except Exception as e:
                if attempt == 0 and self._is_conn_lost(e):
                    print(f"[DB] 连接已被服务端断开，重取连接重试一次: {e}", flush=True)
                    continue
                raise
            finally:
                conn.close()

    def fetchone(self, sql, params=()):
        """查询单条（连接被服务端掐断时自动重试一次）"""
        for attempt in range(2):
            conn = self._new_mysql_conn()
            try:
                cursor = conn.cursor()
                cursor.execute(sql, _adapt_params(params))
                row = cursor.fetchone()
                return dict(row) if row else None
            except Exception as e:
                if attempt == 0 and self._is_conn_lost(e):
                    print(f"[DB] 连接已被服务端断开，重取连接重试一次: {e}", flush=True)
                    continue
                raise
            finally:
                conn.close()

    def fetchall(self, sql, params=()):
        """查询多条（连接被服务端掐断时自动重试一次）"""
        for attempt in range(2):
            conn = self._new_mysql_conn()
            try:
                cursor = conn.cursor()
                cursor.execute(sql, _adapt_params(params))
                rows = cursor.fetchall()
                return [dict(row) for row in rows]
            except Exception as e:
                if attempt == 0 and self._is_conn_lost(e):
                    print(f"[DB] 连接已被服务端断开，重取连接重试一次: {e}", flush=True)
                    continue
                raise
            finally:
                conn.close()

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
                "body_text": "━━━━━━━━━━━━━━━━━━━━\n    学神助手 · 每日运营数据日报\n━━━━━━━━━━━━━━━━━━━━\n\n统计日期：{{date}}\n\n【注册情况】\n    新增注册用户：{{reg_count}} 人\n\n【收入情况】\n    支付订单数：{{order_count}} 笔\n    总收入：{{revenue_total}} 元\n    ├─ 月度会员：{{monthly_count}} 笔 / {{monthly_revenue}} 元\n    ├─ 积分套餐：{{points_count}} 笔 / {{points_revenue}} 元\n    └─ 自有模型：{{custom_model_count}} 笔 / {{custom_model_revenue}} 元\n\n━━━━━━━━━━━━━━━━━━━━\n本邮件由系统定时发送。\n本邮件由 {{from_addr}} 发送\n━━━━━━━━━━━━━━━━━━━━",
                "body_html": '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>@keyframes fadeInUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}.card{animation:fadeInUp .6s ease-out}.metric{background:#f8fafc;border:1px solid #e5e7eb;border-radius:12px;padding:16px 18px}</style></head><body style="margin:0;padding:0;background:#eef2f7;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding:40px 20px;"><table class="card" width="520" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;width:100%;background:#ffffff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);overflow:hidden;"><tr><td style="background:linear-gradient(135deg,#6366f1,#4f46e5);padding:28px 32px;text-align:center;"><div style="color:#ffffff;font-size:18px;font-weight:600;letter-spacing:1px;">学神助手</div><div style="color:rgba(255,255,255,0.85);font-size:13px;margin-top:4px;">{{subject}}</div></td></tr><tr><td style="padding:28px 32px;"><p style="margin:0 0 20px;color:#6b7280;font-size:14px;">统计日期：<b style="color:#1f2937">{{date}}</b></p><h3 style="margin:0 0 12px;color:#4f46e5;font-size:15px;">注册情况</h3><div class="metric" style="margin:0 0 22px;"><p style="margin:0;color:#6b7280;font-size:13px;">新增注册用户</p><p style="margin:4px 0 0;color:#1f2937;font-size:26px;font-weight:700;">{{reg_count}} <span style="font-size:14px;font-weight:400;color:#6b7280;">人</span></p></div><h3 style="margin:0 0 12px;color:#4f46e5;font-size:15px;">收入情况</h3><div class="metric" style="margin:0 0 14px;"><p style="margin:0;color:#6b7280;font-size:13px;">支付订单数 / 总收入</p><p style="margin:4px 0 0;color:#1f2937;font-size:18px;font-weight:700;">{{order_count}} 笔 · ¥{{revenue_total}}</p></div><table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;border-collapse:collapse;"><tr><td class="metric" style="width:33%;border-radius:12px 0 0 12px;"><p style="margin:0;color:#6b7280;font-size:12px;">月度会员</p><p style="margin:4px 0 0;color:#1f2937;font-size:15px;font-weight:600;">{{monthly_count}} 笔</p><p style="margin:2px 0 0;color:#16a34a;font-size:14px;">¥{{monthly_revenue}}</p></td><td class="metric" style="width:33%;border-left:none;"><p style="margin:0;color:#6b7280;font-size:12px;">积分套餐</p><p style="margin:4px 0 0;color:#1f2937;font-size:15px;font-weight:600;">{{points_count}} 笔</p><p style="margin:2px 0 0;color:#16a34a;font-size:14px;">¥{{points_revenue}}</p></td><td class="metric" style="width:33%;border-left:none;border-radius:0 12px 12px 0;"><p style="margin:0;color:#6b7280;font-size:12px;">自有模型</p><p style="margin:4px 0 0;color:#1f2937;font-size:15px;font-weight:600;">{{custom_model_count}} 笔</p><p style="margin:2px 0 0;color:#16a34a;font-size:14px;">¥{{custom_model_revenue}}</p></td></tr></table></div><div style="border-top:1px solid #e5e7eb;padding:16px 32px;background:#fafafa;"><p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">本邮件由系统定时发送。</p><p style="margin:6px 0 0;color:#9ca3af;font-size:12px;line-height:1.6;">本邮件由 <b>{{from_addr}}</b> 发送</p></div></td></tr></table></td></tr></table></body></html>',
                "variables": "date,reg_count,order_count,revenue_total,monthly_count,monthly_revenue,points_count,points_revenue,custom_model_count,custom_model_revenue,subject,from_addr"
            },
            {
                "scene": "refund_approved",
                "subject": "学神助手 - 退款已通过",
                "body_text": "━━━━━━━━━━━━━━━━━━━━\n    学神助手 · {{subject}}\n━━━━━━━━━━━━━━━━━━━━\n\n尊敬的 {{username}}，您好！\n\n您的退款申请已通过，详细信息如下：\n\n    订单号：{{order_no}}\n    套餐：{{plan_name}}\n    金额：¥{{price}}\n    退款原因：{{reason}}\n    管理员备注：{{note}}\n\n退款将在1-3个工作日内到账。\n\n━━━━━━━━━━━━━━━━━━━━\n如有疑问请联系管理员。\n本邮件由 {{from_addr}} 发送\n━━━━━━━━━━━━━━━━━━━━",
                "body_html": '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>@keyframes fadeInUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}.card{animation:fadeInUp .6s ease-out}</style></head><body style="margin:0;padding:0;background:#fef2f2;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding:40px 20px;"><table class="card" width="480" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;width:100%;background:#ffffff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);overflow:hidden;"><tr><td style="background:linear-gradient(135deg,#ef4444,#dc2626);padding:28px 32px;text-align:center;"><div style="color:#ffffff;font-size:18px;font-weight:600;letter-spacing:1px;">学神助手</div><div style="color:rgba(255,255,255,0.85);font-size:13px;margin-top:4px;">{{subject}}</div></td></tr><tr><td style="padding:32px;"><p style="margin:0 0 16px;color:#1f2937;font-size:15px;line-height:1.6;">尊敬的 <b>{{username}}</b>，您好！</p><p style="margin:0 0 20px;color:#4b5563;font-size:14px;line-height:1.6;">您的退款申请已通过，详细信息如下：</p><div style="background:#fef2f2;border-radius:12px;padding:20px;margin:0 0 20px;border:1px solid #fecaca;"><table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:14px;"><tr><td style="padding:4px 0;color:#6b7280;">订单号</td><td style="padding:4px 0;color:#1f2937;font-weight:600;text-align:right;">{{order_no}}</td></tr><tr><td style="padding:4px 0;color:#6b7280;">套餐</td><td style="padding:4px 0;color:#1f2937;text-align:right;">{{plan_name}}</td></tr><tr><td style="padding:4px 0;color:#6b7280;">金额</td><td style="padding:4px 0;color:#1f2937;font-weight:700;text-align:right;">¥{{price}}</td></tr><tr><td style="padding:4px 0;color:#6b7280;">退款原因</td><td style="padding:4px 0;color:#1f2937;text-align:right;">{{reason}}</td></tr><tr><td style="padding:4px 0;color:#6b7280;">管理员备注</td><td style="padding:4px 0;color:#1f2937;text-align:right;">{{note}}</td></tr></table></div><p style="margin:0 0 12px;color:#6b7280;font-size:13px;line-height:1.6;">退款将在1-3个工作日内到账。</p><div style="border-top:1px solid #e5e7eb;padding-top:16px;margin-top:20px;"><p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">如有疑问请联系管理员。</p><p style="margin:8px 0 0;color:#9ca3af;font-size:12px;line-height:1.6;">本邮件由 <b style="color:#6b7280;">{{from_addr}}</b> 发送</p></div></td></tr></table></td></tr></table></body></html>',
                "variables": "username,order_no,plan_name,price,reason,note,subject,from_addr"
            },
            {
                "scene": "refund_rejected",
                "subject": "学神助手 - 退款申请已拒绝",
                "body_text": "━━━━━━━━━━━━━━━━━━━━\n    学神助手 · {{subject}}\n━━━━━━━━━━━━━━━━━━━━\n\n尊敬的 {{username}}，您好！\n\n您的退款申请已被拒绝，详细信息如下：\n\n    订单号：{{order_no}}\n    套餐：{{plan_name}}\n    金额：¥{{price}}\n    退款原因：{{reason}}\n    管理员备注：{{note}}\n\n━━━━━━━━━━━━━━━━━━━━\n如有疑问请联系管理员。\n本邮件由 {{from_addr}} 发送\n━━━━━━━━━━━━━━━━━━━━",
                "body_html": '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>@keyframes fadeInUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}.card{animation:fadeInUp .6s ease-out}</style></head><body style="margin:0;padding:0;background:#fffbeb;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding:40px 20px;"><table class="card" width="480" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;width:100%;background:#ffffff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);overflow:hidden;"><tr><td style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:28px 32px;text-align:center;"><div style="color:#ffffff;font-size:18px;font-weight:600;letter-spacing:1px;">学神助手</div><div style="color:rgba(255,255,255,0.85);font-size:13px;margin-top:4px;">{{subject}}</div></td></tr><tr><td style="padding:32px;"><p style="margin:0 0 16px;color:#1f2937;font-size:15px;line-height:1.6;">尊敬的 <b>{{username}}</b>，您好！</p><p style="margin:0 0 20px;color:#4b5563;font-size:14px;line-height:1.6;">您的退款申请已被拒绝，详细信息如下：</p><div style="background:#fffbeb;border-radius:12px;padding:20px;margin:0 0 20px;border:1px solid #fde68a;"><table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:14px;"><tr><td style="padding:4px 0;color:#6b7280;">订单号</td><td style="padding:4px 0;color:#1f2937;font-weight:600;text-align:right;">{{order_no}}</td></tr><tr><td style="padding:4px 0;color:#6b7280;">套餐</td><td style="padding:4px 0;color:#1f2937;text-align:right;">{{plan_name}}</td></tr><tr><td style="padding:4px 0;color:#6b7280;">金额</td><td style="padding:4px 0;color:#1f2937;font-weight:700;text-align:right;">¥{{price}}</td></tr><tr><td style="padding:4px 0;color:#6b7280;">退款原因</td><td style="padding:4px 0;color:#1f2937;text-align:right;">{{reason}}</td></tr><tr><td style="padding:4px 0;color:#6b7280;">管理员备注</td><td style="padding:4px 0;color:#1f2937;text-align:right;">{{note}}</td></tr></table></div><div style="border-top:1px solid #e5e7eb;padding-top:16px;margin-top:20px;"><p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">如有疑问请联系管理员。</p><p style="margin:8px 0 0;color:#9ca3af;font-size:12px;line-height:1.6;">本邮件由 <b style="color:#6b7280;">{{from_addr}}</b> 发送</p></div></td></tr></table></td></tr></table></body></html>',
                "variables": "username,order_no,plan_name,price,reason,note,subject,from_addr"
            },
            {
                "scene": "refund_request",
                "subject": "学神助手 - 新退款申请通知",
                "body_text": "━━━━━━━━━━━━━━━━━━━━\n    学神助手 · 新退款申请通知\n━━━━━━━━━━━━━━━━━━━━\n\n管理员您好！\n\n收到一条新的用户退款申请：\n\n    用户：{{username}}\n    订单号：{{order_no}}\n    套餐：{{plan_name}}\n    金额：¥{{price}}\n    退款原因：{{reason}}\n\n━━━━━━━━━━━━━━━━━━━━\n请及时登录管理后台审核处理。\n本邮件由 {{from_addr}} 发送\n━━━━━━━━━━━━━━━━━━━━",
                "body_html": '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>@keyframes fadeInUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}.card{animation:fadeInUp .6s ease-out}</style></head><body style="margin:0;padding:0;background:#fef2f2;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding:40px 20px;"><table class="card" width="480" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;width:100%;background:#ffffff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);overflow:hidden;"><tr><td style="background:linear-gradient(135deg,#ef4444,#dc2626);padding:28px 32px;text-align:center;"><div style="color:#ffffff;font-size:18px;font-weight:600;letter-spacing:1px;">学神助手</div><div style="color:rgba(255,255,255,0.85);font-size:13px;margin-top:4px;">新退款申请通知</div></td></tr><tr><td style="padding:32px;"><p style="margin:0 0 16px;color:#1f2937;font-size:15px;line-height:1.6;">管理员您好！</p><p style="margin:0 0 20px;color:#4b5563;font-size:14px;line-height:1.6;">收到一条新的用户退款申请：</p><div style="background:#fef2f2;border-radius:12px;padding:20px;margin:0 0 20px;border:1px solid #fecaca;"><table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:14px;"><tr><td style="padding:4px 0;color:#6b7280;">用户</td><td style="padding:4px 0;color:#1f2937;font-weight:600;text-align:right;">{{username}}</td></tr><tr><td style="padding:4px 0;color:#6b7280;">订单号</td><td style="padding:4px 0;color:#1f2937;font-weight:600;text-align:right;">{{order_no}}</td></tr><tr><td style="padding:4px 0;color:#6b7280;">套餐</td><td style="padding:4px 0;color:#1f2937;text-align:right;">{{plan_name}}</td></tr><tr><td style="padding:4px 0;color:#6b7280;">金额</td><td style="padding:4px 0;color:#1f2937;font-weight:700;text-align:right;">¥{{price}}</td></tr><tr><td style="padding:4px 0;color:#6b7280;">退款原因</td><td style="padding:4px 0;color:#1f2937;text-align:right;">{{reason}}</td></tr></table></div><div style="border-top:1px solid #e5e7eb;padding-top:16px;margin-top:20px;"><p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">请及时登录管理后台审核处理。</p><p style="margin:8px 0 0;color:#9ca3af;font-size:12px;line-height:1.6;">本邮件由 <b style="color:#6b7280;">{{from_addr}}</b> 发送</p></div></td></tr></table></td></tr></table></body></html>',
                "variables": "username,order_no,plan_name,price,reason,subject,from_addr"
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
        # 自有模型权限到期时间（NULL=未开通，9999-12-31=永久）
        self._add_column_if_missing("users", "custom_model_until", "custom_model_until DATETIME NULL")
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
        # 自有模型开关与定价
        self._add_column_if_missing("admin_config", "custom_model_enabled", "custom_model_enabled TINYINT DEFAULT 0")
        self._add_column_if_missing("admin_config", "custom_model_price", "custom_model_price DECIMAL(10,2) DEFAULT 0")
        self._add_column_if_missing("admin_config", "custom_model_period", "custom_model_period VARCHAR(20) DEFAULT 'permanent'")
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
        self._add_column_if_missing("admin_config", "referral_points_rate", "referral_points_rate INT DEFAULT 50 COMMENT '佣金兑换题数比率（题/元）'")
        self._add_column_if_missing("admin_config", "referral_exchange_enabled", "referral_exchange_enabled TINYINT DEFAULT 1 COMMENT '允许佣金直接兑换题数'")
        self._add_column_if_missing("admin_config", "referral_deduct_enabled", "referral_deduct_enabled TINYINT DEFAULT 1 COMMENT '允许下单时用佣金抵扣现金'")
        self._add_column_if_missing("admin_config", "dedup_question_enabled", "dedup_question_enabled TINYINT DEFAULT 1 COMMENT '同一用户同一道题只扣一次题数'")
        self._add_column_if_missing("admin_config", "referral_hold_minutes", "referral_hold_minutes INT DEFAULT 30 COMMENT '下单抵扣冻结时长（分钟），超时退回'")
        self._add_column_if_missing("admin_config", "feedback_auto_close_days", "feedback_auto_close_days INT DEFAULT 7")
        self._add_column_if_missing("admin_config", "feedback_notify_enabled", "feedback_notify_enabled TINYINT DEFAULT 0")
        self._add_column_if_missing("admin_config", "refund_days_limit", "refund_days_limit INT DEFAULT 7 COMMENT '退款时效（天），0=不允许退款'")
        self._add_column_if_missing("admin_config", "xianyu_enabled", "xianyu_enabled TINYINT DEFAULT 0")
        self._add_column_if_missing("admin_config", "xianyu_url", "xianyu_url VARCHAR(255) DEFAULT ''")
        self._add_column_if_missing("admin_config", "card_pay_name", "card_pay_name VARCHAR(50) DEFAULT '卡密激活'")
        self._add_column_if_missing("admin_config", "card_pay_icon", "card_pay_icon TEXT")
        # 公告通知配置
        self._add_column_if_missing("admin_config", "announce_enabled", "announce_enabled TINYINT DEFAULT 0")
        self._add_column_if_missing("admin_config", "announce_text", "announce_text TEXT")
        self._add_column_if_missing("admin_config", "announce_title", "announce_title VARCHAR(200) DEFAULT ''")
        # 分销/代理商配置
        self._add_column_if_missing("admin_config", "distributor_enabled", "distributor_enabled TINYINT DEFAULT 0 COMMENT '分销总开关'")
        self._add_column_if_missing("admin_config", "distributor_apply_enabled", "distributor_apply_enabled TINYINT DEFAULT 0 COMMENT '是否允许自助申请开通'")
        self._add_column_if_missing("admin_config", "distributor_generate_enabled", "distributor_generate_enabled TINYINT DEFAULT 1 COMMENT '是否允许生成卡密'")
        self._add_column_if_missing("admin_config", "distributor_withdraw_enabled", "distributor_withdraw_enabled TINYINT DEFAULT 0 COMMENT '是否允许提现'")
        self._add_column_if_missing("admin_config", "distributor_base_price_points", "distributor_base_price_points DECIMAL(10,4) DEFAULT 0.0010 COMMENT '官方基准单价 元/题'")
        self._add_column_if_missing("admin_config", "distributor_base_price_days", "distributor_base_price_days DECIMAL(10,4) DEFAULT 0.5000 COMMENT '官方基准单价 元/包月天'")
        self._add_column_if_missing("admin_config", "distributor_default_discount", "distributor_default_discount DECIMAL(5,4) DEFAULT 1.0000 COMMENT '新代理商默认折扣率 0.0001-1.0000'")
        self._add_column_if_missing("admin_config", "distributor_min_recharge", "distributor_min_recharge DECIMAL(10,2) DEFAULT 50.00 COMMENT '最低充值金额'")
        self._add_column_if_missing("admin_config", "distributor_min_withdraw", "distributor_min_withdraw DECIMAL(10,2) DEFAULT 50.00 COMMENT '最低提现金额'")
        self._add_column_if_missing("admin_config", "distributor_max_batch", "distributor_max_batch INT DEFAULT 500 COMMENT '单次生成张数上限'")
        self._add_column_if_missing("admin_config", "distributor_daily_card_max", "distributor_daily_card_max INT DEFAULT 2000 COMMENT '每代理商每日生成张数上限，0=不限'")
        self._add_column_if_missing("admin_config", "distributor_script_name", "distributor_script_name VARCHAR(100) DEFAULT '学神助手 纯净版' COMMENT '纯净版脚本名称'")
        # 中控单点登录（Hub SSO）配置：密钥只在服务端，GET 永不回传明文
        self._add_column_if_missing("admin_config", "sso_enabled", "sso_enabled TINYINT DEFAULT 0 COMMENT '中控单点登录总开关'")
        self._add_column_if_missing("admin_config", "sso_app_key", "sso_app_key VARCHAR(128) DEFAULT '' COMMENT 'Hub 分配的 App Key（标识，非密钥）'")
        self._add_column_if_missing("admin_config", "sso_base_url", "sso_base_url VARCHAR(255) DEFAULT '' COMMENT 'Hub 中控基址，默认 https://openget.cn'")
        self._add_column_if_missing("admin_config", "sso_app_secret", "sso_app_secret VARCHAR(255) DEFAULT '' COMMENT 'Hub App Secret，仅服务端持有，界面只显示掩码'")
        # 中控统一出口开关：邮件走 /open/mail/send，模型走 /open/v1/chat/completions；密钥复用上面 Hub 配置
        self._add_column_if_missing("admin_config", "email_hub_enabled", "email_hub_enabled TINYINT DEFAULT 0 COMMENT '邮件走中控统一发信出口开关'")
        self._add_column_if_missing("admin_config", "model_hub_enabled", "model_hub_enabled TINYINT DEFAULT 0 COMMENT '模型调用走中控网关开关'")
        # —— 风控管理（只判退款行为：次数 / 退款率 / 下单后短时退款）——
        self._add_column_if_missing("admin_config", "risk_enabled", "risk_enabled TINYINT DEFAULT 1 COMMENT '风控判定总开关'")
        self._add_column_if_missing("admin_config", "risk_refund_days", "risk_refund_days INT DEFAULT 30 COMMENT '退款次数统计窗口（天）'")
        self._add_column_if_missing("admin_config", "risk_refund_count", "risk_refund_count INT DEFAULT 2 COMMENT '窗口内退款次数达此值判风险，0=关闭该规则'")
        self._add_column_if_missing("admin_config", "risk_refund_rate_pct", "risk_refund_rate_pct INT DEFAULT 50 COMMENT '退款率阈值百分数，0=关闭该规则'")
        self._add_column_if_missing("admin_config", "risk_refund_rate_min", "risk_refund_rate_min INT DEFAULT 2 COMMENT '算退款率所需最小已付单量，低于此不计率，避免单笔即百分百误伤'")
        self._add_column_if_missing("admin_config", "risk_quick_minutes", "risk_quick_minutes INT DEFAULT 120 COMMENT '下单支付后此时长内退款算短时退款（分钟）'")
        self._add_column_if_missing("admin_config", "risk_quick_count", "risk_quick_count INT DEFAULT 2 COMMENT '短时退款次数达此值判风险，0=关闭该规则'")
        self._add_column_if_missing("admin_config", "risk_auto_ban", "risk_auto_ban TINYINT DEFAULT 0 COMMENT '命中即自动封总开关，默认关＝只出名单等人工一键封'")
        self._add_column_if_missing("admin_config", "risk_whitelist", "risk_whitelist TEXT COMMENT '风控白名单用户名，逗号/换行分隔，命中也不处理'")

    def _ensure_order_payment_columns(self):
        self._add_column_if_missing("payment_orders", "pay_method", "pay_method VARCHAR(20)")
        self._add_column_if_missing("payment_orders", "pay_channel", "pay_channel VARCHAR(20)")
        self._add_column_if_missing("payment_orders", "trade_no", "trade_no VARCHAR(128)")
        self._add_column_if_missing("payment_orders", "qr_code", "qr_code TEXT")
        self._add_column_if_missing("payment_orders", "pay_url", "pay_url TEXT")
        self._add_column_if_missing("payment_orders", "paid_at", "paid_at TIMESTAMP NULL")
        self._add_column_if_missing("payment_orders", "bank_order_no", "bank_order_no VARCHAR(128)")
        self._add_column_if_missing("payment_orders", "channel_order_no", "channel_order_no VARCHAR(128) COMMENT '商户订单号(签约类型支付方式有值)'")
        self._add_column_if_missing("payment_orders", "pay_type", "pay_type VARCHAR(50)")
        self._add_column_if_missing("payment_orders", "business_type", "business_type VARCHAR(50)")
        # 下单 IP 与归属地（后台线程异步回填归属地）
        self._add_column_if_missing("payment_orders", "client_ip", "client_ip VARCHAR(64) DEFAULT '' COMMENT '下单IP'")
        self._add_column_if_missing("payment_orders", "client_ip_addr", "client_ip_addr VARCHAR(200) DEFAULT '' COMMENT '下单IP归属地'")

    # ==================== 用户相关 ====================
    def create_user(self, username, email, password_hash, invite_code=None, client_ip=""):
        ph = _ph()
        try:
            code = self._gen_unique_invite_code()
            # 注册只记 register_ip；last_login_ip 留给首次登录，
            # 否则「最近登录」列会出现一个有 IP 却没有登录时间的账号
            self.execute(
                f"INSERT INTO users (username, email, password_hash, is_verified, invite_code, register_ip) VALUES ({ph}, {ph}, {ph}, 0, {ph}, {ph})",
                (username, email, password_hash, code, (client_ip or "")[:64])
            )
            # 绑定邀请关系
            if invite_code:
                self._bind_referral(username, invite_code)
            return True, None
        except Exception as e:
            return False, str(e)

    def touch_user_login(self, username, client_ip=""):
        """记一次登录时间与登录 IP。IP 为空时不覆盖已有值。"""
        ph = _ph()
        if client_ip:
            self.execute(
                f"UPDATE users SET last_login_at = NOW(), last_login_ip = {ph} WHERE username = {ph}",
                ((client_ip or "")[:64], username)
            )
        else:
            self.execute(f"UPDATE users SET last_login_at = NOW() WHERE username = {ph}", (username,))

    # 归属地回写的合法目标：表名 + IP 列 + 归属地列，全部写死，
    # 杜绝把外部传入的标识符拼进 SQL 的注入面。
    # users 有两对 IP/归属地列（注册、登录），必须用不同的键区分，
    # 否则「按登录 IP 查归属地」会去比 register_ip 列，永远匹配 0 行。
    _IP_GEO_TARGETS = {
        "users": ("register_ip", "register_ip_addr"),
        "users_login": ("last_login_ip", "last_login_ip_addr"),
        "payment_orders": ("client_ip", "client_ip_addr"),
        "refund_requests": ("client_ip", "client_ip_addr"),
    }

    def set_ip_geo(self, table, ip, addr):
        """回写某个 IP 的归属地。由 backend 的后台线程在解析成功后调用。

        只更新「IP 相同、归属地为空」的行，重复调用安全；表名/列名走白名单，
        不接受外部传入的标识符。返回受影响行数。
        """
        target = self._IP_GEO_TARGETS.get(table)
        ip = (ip or "").strip()[:64]
        addr = (addr or "").strip()[:200]
        if not target or not ip or not addr:
            return 0
        ip_col, addr_col = target
        # users 的两个键都落在 users 表上
        real_table = "users" if table.startswith("users") else table
        cur = self.execute(
            f"UPDATE {real_table} SET {addr_col} = %s WHERE {ip_col} = %s AND ({addr_col} IS NULL OR {addr_col} = '')",
            (addr, ip)
        )
        return cur.rowcount if cur is not None else 0

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
            f"SELECT username, email, is_verified, points_balance, member_until, is_banned, ban_reason, invite_code, commission_balance, custom_model_until, channel, channel_ref FROM users WHERE username = {ph}",
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
        custom_model_until = row.get("custom_model_until")
        custom_model_active = False
        if custom_model_until:
            try:
                if isinstance(custom_model_until, str):
                    cm_dt = datetime.strptime(custom_model_until.split(".")[0], "%Y-%m-%d %H:%M:%S")
                else:
                    cm_dt = custom_model_until
                custom_model_active = datetime.now() < cm_dt
            except Exception:
                custom_model_active = False
        row["points_balance"] = int(row.get("points_balance") or 0)
        row["is_banned"] = bool(row.get("is_banned"))
        row["active_member"] = active_member
        row["commission_balance"] = float(row.get("commission_balance") or 0)
        row["custom_model_active"] = custom_model_active
        return row

    def grant_registration_gift(self, username):
        admin = self.get_admin_config() or {}
        gift_type = (admin.get("gift_type") or "none").strip()
        if gift_type == "points":
            points = int(admin.get("gift_points") or 0)
            if points > 0:
                self.adjust_user_points(username, points, "注册赠送点数", lot_source="register")
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

    def reorder_payment_plan(self, plan_id, direction):
        ph = _ph()
        plans = self.fetchall("SELECT id, sort_order FROM payment_plans ORDER BY sort_order ASC, id ASC")
        if len(plans) < 2:
            return
        idx = next((i for i, p in enumerate(plans) if int(p["id"]) == int(plan_id)), -1)
        if idx < 0:
            return
        swap_idx = idx - 1 if direction == "up" else idx + 1
        if swap_idx < 0 or swap_idx >= len(plans):
            return
        cur = int(plans[idx]["sort_order"] or 0)
        nxt = int(plans[swap_idx]["sort_order"] or 0)
        if cur == nxt:
            nxt = cur + (1 if direction == "down" else -1)
        self.execute(f"UPDATE payment_plans SET sort_order = {ph} WHERE id = {ph}", (nxt, int(plans[idx]["id"])))
        self.execute(f"UPDATE payment_plans SET sort_order = {ph} WHERE id = {ph}", (cur, int(plans[swap_idx]["id"])))

    def new_order_no(self, username):
        """订单号只在这里生成：下单抵扣要先把佣金冻结到一个还没落库的订单号上。"""
        return f"ORD{int(time.time() * 1000)}{abs(hash(username)) % 10000:04d}"

    def create_paid_order_and_apply(self, username, plan, order_no=None, client_ip=""):
        ph = _ph()
        if not order_no:
            order_no = self.new_order_no(username)
        business_type = (plan.get("business_type") or "")[:50]
        # 建单只能落 pending：apply_paid_order 见 paid 会直接早退「订单已到账」，
        # 于是 ¥0 套餐/自有模型白拿一个已支付订单，权益一分没发，还永久卡住「限领一次」
        self.execute(
            f"""INSERT INTO payment_orders (order_no, username, plan_id, plan_name, plan_type, price, plan_price, commission_used, points, days, status, paid_at, business_type, client_ip)
                VALUES ({ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, 'pending', NULL, {ph}, {ph})""",
            (
                order_no, username, int(plan.get("id") or 0), plan.get("name", ""),
                plan.get("plan_type", ""), float(plan.get("price") or 0),
                float(plan.get("plan_price") or plan.get("price") or 0),
                float(plan.get("commission_used") or 0),
                int(plan.get("points") or 0), int(plan.get("days") or 0), business_type,
                (client_ip or "")[:64]
            )
        )
        ok, msg = self.apply_paid_order(order_no)
        return order_no, ok, msg

    def create_pending_order(self, username, plan, pay_method="alipay", pay_channel="", trade_no="", qr_code="", pay_url="", order_no=None, bank_order_no="", pay_type="", business_type="", client_ip=""):
        ph = _ph()
        if not order_no:
            order_no = self.new_order_no(username)
        self.execute(
            f"""INSERT INTO payment_orders (order_no, username, plan_id, plan_name, plan_type, price, plan_price, commission_used, points, days, status, pay_method, pay_channel, trade_no, qr_code, pay_url, bank_order_no, pay_type, business_type, client_ip)
                VALUES ({ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, 'pending', {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph})""",
            (
                order_no, username, int(plan.get("id") or 0), plan.get("name", ""),
                plan.get("plan_type", ""), float(plan.get("price") or 0),
                float(plan.get("plan_price") or plan.get("price") or 0),
                float(plan.get("commission_used") or 0),
                int(plan.get("points") or 0), int(plan.get("days") or 0),
                pay_method, pay_channel, trade_no, qr_code, pay_url,
                bank_order_no, pay_type, business_type,
                (client_ip or "")[:64]
            )
        )
        return order_no

    def get_order(self, order_no):
        ph = _ph()
        return self.fetchone(f"SELECT * FROM payment_orders WHERE order_no = {ph}", (order_no,))

    def update_order_payment(self, order_no, trade_no="", qr_code="", status=None, pay_url="", bank_order_no="", pay_type="", paid_at=None, channel_order_no=""):
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
        if channel_order_no:
            sets.append(f"channel_order_no = {ph}")
            params.append(channel_order_no)
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
        if order.get("plan_type") == "dist_recharge":
            # 代理商余额充值单独走：这笔是「钱换余额」，不能像别的分支那样发放失败只
            # print 一句就标成 paid——那是收了钱不给货。失败退回 pending，钱和货都
            # 还在原地，管理员补单或用户重新下单都有依据。也不走下面的推广返利。
            ok_recharge, msg_recharge = self._apply_distributor_recharge(order_no)
            if not ok_recharge:
                return False, msg_recharge
            price = float(order.get("price") or 0)
            if price > 0:
                try:
                    self._settle_first_order_commission(order["username"], order_no, price)
                except Exception as e:
                    print(f"[推广返利] 佣金结算失败 order={order_no}: {e}", flush=True)
            return True, msg_recharge
        # 三个发放函数「用户不存在」时是 return (False, msg) 不是 raise，只抓异常会漏掉
        # 这条正常路径；统一收口成 ok 三态，没发出货就不许标 paid。
        ok, msg = False, "未知套餐类型"
        try:
            if order.get("plan_type") == "monthly":
                ok, msg = self.extend_user_membership(order["username"], int(order.get("days") or 30), f"购买套餐：{order.get('plan_name','包月套餐')}")
            elif order.get("plan_type") == "custom_model":
                # 自有模型权限：business_type 编码 period => custom_model_monthly / custom_model_lifetime
                period = "permanent"
                bt = order.get("business_type") or ""
                if "monthly" in bt:
                    period = "monthly"
                ok, msg = self.grant_custom_model_access(order["username"], period)
            elif order.get("plan_type") == "points":
                ok, msg = self.adjust_user_points(order["username"], int(order.get("points") or 0),
                                                  f"购买套餐：{order.get('plan_name','点数套餐')}",
                                                  order_no=order_no, lot_source="order")
        except Exception as e:
            ok, msg = False, str(e)
            print(f"[支付到账] 权益发放异常 order={order_no}: {e}", flush=True)
        if not ok:
            self.execute(
                f"UPDATE payment_orders SET status = 'pending', paid_at = NULL "
                f"WHERE order_no = {ph} AND status = 'paying'",
                (order_no,)
            )
            print(f"[支付到账] 未发放，订单退回待支付 order={order_no} user={order.get('username')} "
                  f"类型={order.get('plan_type')} 原因={msg}", flush=True)
            return False, "权益未发放：%s" % msg
        # 佣金抵扣核销：钱已到账才把冻结的抵扣结掉。抢不到说明它已被超时回收、佣金
        # 退回了余额，而用户付的确实是折后现金——货照发，只大声记日志；把已付款的订单
        # 卡在待支付是比让出这点折扣更重的事故。
        if float(order.get("commission_used") or 0) > 0 and not self.consume_commission_hold(order_no):
            print(f"[下单抵扣][WARN] 冻结已退回但订单已付款，按抵扣价发货 order={order_no} "
                  f"user={order.get('username')} 抵扣=¥{order.get('commission_used')} "
                  f"实付现金=¥{order.get('price')}，请核对该用户佣金余额", flush=True)
        self.execute(f"UPDATE payment_orders SET status = 'paid' WHERE order_no = {ph}", (order_no,))
        # 推广返利：首单佣金结算（仅付费订单 price>0 触发）。返利失败不影响已发放的权益
        try:
            price = float(order.get("price") or 0)
            if price > 0:
                self._settle_first_order_commission(order["username"], order_no, price)
        except Exception as e:
            print(f"[推广返利] 佣金结算失败 order={order_no}: {e}", flush=True)
        return True, "支付成功，权益已到账"

    def _apply_distributor_recharge(self, order_no):
        """dist_recharge 订单的到账分支：入账成功才标 paid，失败退回 pending。

        调用方（apply_paid_order）已经用条件 UPDATE 把订单抢成 paying，
        所以这里不需要再考虑并发重复入账。
        """
        ph = _ph()
        order = self.get_order(order_no) or {}
        try:
            ok, msg = self.credit_distributor_recharge(order)
        except Exception as e:
            ok, msg = False, str(e)
            print(f"[充值到账] 入账异常 order={order_no}: {e}", flush=True)
        if not ok:
            self.execute(
                f"UPDATE payment_orders SET status = 'pending', paid_at = NULL "
                f"WHERE order_no = {ph} AND status = 'paying'",
                (order_no,)
            )
            print(f"[充值到账] 失败，订单退回待支付 order={order_no} user={order.get('username')} "
                  f"金额={order.get('price')} 原因={msg}", flush=True)
            return False, "余额充值未入账：%s" % msg
        self.execute(f"UPDATE payment_orders SET status = 'paid' WHERE order_no = {ph}", (order_no,))
        return True, msg

    # 自有模型"永久"按 1 年（365 天）折算退款
    CUSTOM_MODEL_LIFETIME_DAYS = 365

    def _user_points_balance(self, username, default=0):
        """安全获取用户题数余额，查不到时返回 default（不抛异常）。"""
        if not username:
            return default
        try:
            row = self.get_user_entitlement(username)
            return int(row.get("points_balance") or 0) if row else default
        except Exception:
            return default

    def calculate_refund(self, order, now=None, balance=None):
        """退款金额与扣减量计算（唯一真源）。

        规则：
          - monthly（包月/季卡/年卡）：按剩余时间比例退款，退款额 = 价格 × 剩余天数/总天数
          - custom_model（自有模型）：按 365 天折算剩余时间比例
          - points（题数包）：按剩余题数比例退款，退款额 = 价格 × 剩余题数/订单题数
          - 注册赠送点数不参与退款计算（不计入可退金额）

        balance：题数包折算所需的用户当前题数余额。
          **调用方若已知余额应显式传入**；未传时才按 order['username'] 查库。
          （dashboard 的行数据不含 username，靠查库会拿到 None→余额判成 0，
            曾导致刚购买的订单被误判为"已无可退金额"。）

        返回 dict：amount(应退金额) / revoke_days / revoke_points / lines(计算说明) / summary
        本函数只做计算、不写库，便于退款前预览与退款后展示保持一致。
        """
        now = now or datetime.now()
        price = float(order.get("price") or 0)
        if price <= 0:
            return {
                "amount": 0.0, "revoke_days": 0, "revoke_points": 0,
                "refundable": False,
                "lines": ["该订单金额为 0，无可退金额。", "注册赠送的点数不计入退款。"],
                "summary": "订单金额为 ¥0.00，无可退金额。",
            }

        plan_type = (order.get("plan_type") or "points").strip()
        plan_name = order.get("plan_name") or ""
        paid_at = order.get("paid_at")
        if isinstance(paid_at, str):
            try:
                paid_at = datetime.strptime(paid_at.split(".")[0], "%Y-%m-%d %H:%M:%S")
            except Exception:
                paid_at = None

        lines = [f"订单：{plan_name}　实付：¥{price:.2f}"]
        revoke_days = 0
        revoke_points = 0
        amount = price

        if plan_type in ("monthly", "custom_model"):
            # ===== 按时间比例退款 =====
            if plan_type == "custom_model":
                total_days = self.CUSTOM_MODEL_LIFETIME_DAYS
                basis = f"自有模型按 1 年（{total_days} 天）计"
            else:
                total_days = int(order.get("days") or 0)
                if total_days <= 0:
                    total_days = 30
                basis = f"套餐周期 {total_days} 天"

            if not paid_at:
                lines.append(f"{basis}，但缺少支付时间，无法按时间折算。")
                lines.append("按全额退款处理。")
                amount = price
                revoke_days = total_days
            else:
                elapsed = (now - paid_at).total_seconds() / 86400.0
                elapsed = max(0.0, elapsed)
                used_days = min(elapsed, float(total_days))
                remain_days = max(0.0, float(total_days) - used_days)
                ratio = remain_days / float(total_days)
                amount = round(price * ratio, 2)
                # 只撤销尚未使用的时间，已使用部分不退
                revoke_days = int(remain_days)
                lines.append(
                    f"{basis}，已使用 {used_days:.1f} 天，剩余 {remain_days:.1f} 天"
                )
                lines.append(
                    f"退款比例 = 剩余 {remain_days:.1f} ÷ 总 {total_days} = {ratio * 100:.1f}%"
                )
                lines.append(f"应退金额 = ¥{price:.2f} × {ratio * 100:.1f}% = ¥{amount:.2f}")
                if revoke_days > 0:
                    lines.append(f"同时撤销剩余 {revoke_days} 天权益。")

        else:
            # ===== 按剩余题数比例退款 =====
            total_points = int(order.get("points") or 0)
            if total_points <= 0:
                lines.append("该题数套餐未配置题数，无法按题数折算。")
                lines.append("按全额退款处理。")
                amount = price
            else:
                # 优先用批次精确核算该订单的剩余题数（本次改造的核心）
                remain_from_lot = None
                try:
                    remain_from_lot = self.get_order_remaining_points(order.get("order_no"))
                except Exception as e:
                    print(f"[退款] 批次查询失败 order={order.get('order_no')}: {e}", flush=True)

                if remain_from_lot is not None:
                    refundable_points = max(0, min(total_points, remain_from_lot))
                    used_points = max(0, total_points - refundable_points)
                    lines.append(f"套餐题数 {total_points} 题，本单剩余 {refundable_points} 题")
                    lines.append(f"已消耗 {used_points} 题（已消耗部分不予退款）")
                else:
                    # 无批次记录（改造前的历史订单）：回退到按用户总余额近似
                    if balance is not None:
                        balance = int(balance)
                    else:
                        uname = order.get("username")
                        row = self.get_user_entitlement(uname) if uname else None
                        balance = int(row.get("points_balance") or 0) if row else 0
                    refundable_points = max(0, min(total_points, balance))
                    used_points = max(0, total_points - refundable_points)
                    lines.append(f"套餐题数 {total_points} 题，当前余额 {balance} 题")
                    lines.append(f"已消耗 {used_points} 题（已消耗部分不予退款）")
                    lines.append("（该订单无批次记录，按账户余额近似折算）")

                ratio = refundable_points / float(total_points)
                amount = round(price * ratio, 2)
                revoke_points = refundable_points
                lines.append(
                    f"退款比例 = 剩余 {refundable_points} ÷ 总 {total_points} = {ratio * 100:.1f}%"
                )
                lines.append(f"应退金额 = ¥{price:.2f} × {ratio * 100:.1f}% = ¥{amount:.2f}")
                if revoke_points > 0:
                    lines.append(f"同时扣回剩余 {revoke_points} 题。")

        lines.append("注：注册赠送的点数不作为退款金额计算依据。")

        if plan_type in ("monthly", "custom_model"):
            summary = f"已使用部分不退，按剩余时间折算应退 ¥{amount:.2f}"
        else:
            summary = f"已消耗题数不退，按剩余题数折算应退 ¥{amount:.2f}"

        return {
            "amount": amount,
            "revoke_days": revoke_days,
            "revoke_points": revoke_points,
            "refundable": amount > 0,
            "lines": lines,
            "summary": summary,
        }

    def refund_block_reason(self, order):
        """三类订单绝不能走自动退款，退了钱东西还在。

        卡密兑换行一分钱没付，却挂着卡密面额 price（pay_method='card' 与 CAR 前缀
        只在 activate_card_key 一处产生，不会误伤真实订单）。
        余额充值是「钱换余额」，而 calculate_refund 对 points=0 的套餐按全额退、
        refund_order 只扣题数 —— 充完值、把余额花在卡密上、再申请退款就是凭空造币。
        真要退得线下打款 + 后台「余额调整」同步扣回，别的入口一律堵死。
        """
        if str(order.get("pay_method") or "") == "card" or str(order.get("order_no") or "").startswith("CAR"):
            return "卡密兑换记录不支持退款"
        if _dec(order.get("commission_used")) > 0:
            return "该订单用了佣金抵扣，需管理员人工核算（现金按实付退、抵扣掉的佣金另行核减）"
        if str(order.get("plan_type") or "") == "dist_recharge":
            return "代理商余额充值不支持自助退款，请联系管理员（需线下退款并同步扣回余额）"
        return ""

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
        blocked = self.refund_block_reason(order)
        if blocked:
            return False, blocked
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
        calc = self.calculate_refund(order, balance=self._user_points_balance(order.get("username")))
        refund_amount = float(calc["amount"])
        if order.get("plan_type") == "monthly":
            # 按剩余时间撤销：已使用的天数不退，只收回未使用的部分
            revoke_days = int(calc.get("revoke_days") or 0)
            if revoke_days > 0:
                self._revoke_user_membership(order["username"], revoke_days)
            self.execute(
                f"INSERT INTO usage_logs (username, delta_points, balance_after, reason) VALUES ({ph}, 0, 0, {ph})",
                (order["username"], f"退款撤销包月剩余 {revoke_days} 天：{order.get('plan_name','')} ({order_no}) 退款 ¥{refund_amount:.2f}")
            )
        elif order.get("plan_type") == "custom_model":
            revoke_days = int(calc.get("revoke_days") or 0)
            self.execute(
                f"UPDATE users SET custom_model_until = NULL WHERE username = {ph}",
                (order["username"],)
            )
            self.execute(
                f"INSERT INTO usage_logs (username, delta_points, balance_after, reason) VALUES ({ph}, 0, 0, {ph})",
                (order["username"], f"退款撤销自有模型剩余 {revoke_days} 天：{order.get('plan_name','')} ({order_no}) 退款 ¥{refund_amount:.2f}")
            )
        else:
            # 题数套餐：只扣回剩余未使用的题数（注册赠送点数保留、不动）
            revoke_points = int(calc.get("revoke_points") or 0)
            if revoke_points > 0:
                self.execute(
                    f"UPDATE users SET points_balance = GREATEST(0, points_balance - {ph}) WHERE username = {ph}",
                    (revoke_points, order["username"])
                )
                row2 = self.get_user_entitlement(order["username"])
                actual_balance = int(row2.get("points_balance") or 0) if row2 else 0
                self.execute(
                    f"INSERT INTO usage_logs (username, delta_points, balance_after, reason, order_no) "
                    f"VALUES ({ph}, {ph}, {ph}, {ph}, {ph})",
                    (order["username"], -revoke_points, actual_balance,
                     f"退款扣回剩余 {revoke_points} 题：{order.get('plan_name','')} ({order_no}) 退款 ¥{refund_amount:.2f}",
                     order_no)
                )
                # 该订单批次全部标记为已消耗，避免退款后批次仍记着未用、被重复退款
                self.execute(
                    f"UPDATE point_lots SET used_points = total_points WHERE order_no = {ph}",
                    (order_no,)
                )
        # 撤销佣金
        try:
            self._revoke_order_commission(order_no)
        except Exception as e:
            print(f"[退款] 佣金撤销失败 order={order_no}: {e}", flush=True)
        self.execute(
            f"UPDATE payment_orders SET status = 'refunded', refunded_at = CURRENT_TIMESTAMP, "
            f"refund_reason = {ph}, refunded_by = {ph}, refund_amount = {ph}, refund_detail = {ph} "
            f"WHERE order_no = {ph}",
            (reason or "", operator or "", refund_amount,
             "\n".join(calc["lines"]), order_no)
        )
        return True, {"msg": "退款成功，权益已撤销", "amount": refund_amount,
                      "detail": calc["lines"], "summary": calc["summary"]}

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

    def create_refund_request(self, username, order_no, reason="", client_ip=""):
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
        blocked = self.refund_block_reason(order)
        if blocked:
            return False, blocked
        existing = self.fetchone(f"SELECT id, status FROM refund_requests WHERE order_no = {ph} ORDER BY id DESC LIMIT 1", (order_no,))
        if existing:
            if existing["status"] == "pending":
                return False, "该订单已有待处理的退款申请"
            if existing["status"] == "approved":
                return False, "该订单已退款成功"
            if existing["status"] == "rejected":
                return False, "该订单的退款申请已被拒绝"
        # 与 refund_order 保持一致的退款时效校验，避免用户提交后管理员无法批准
        admin = self.get_admin_config() or {}
        refund_days = int(admin.get("refund_days_limit") or 0)
        if refund_days > 0:
            paid_at = order.get("paid_at")
            if paid_at:
                if isinstance(paid_at, str):
                    try:
                        paid_at = datetime.strptime(paid_at.split(".")[0], "%Y-%m-%d %H:%M:%S")
                    except Exception:
                        paid_at = None
                if paid_at and datetime.now() > paid_at + timedelta(days=refund_days):
                    return False, f"该订单已超过 {refund_days} 天退款时效，无法申请退款"
        # 记录申请时的应退金额与计算说明，便于审核与向用户展示
        calc = self.calculate_refund(order, balance=self._user_points_balance(username))
        if float(calc["amount"]) <= 0:
            return False, "该订单已无可退金额（已使用部分不予退款）"
        self.execute(
            f"INSERT INTO refund_requests (username, order_no, reason, refund_amount, refund_detail, client_ip) "
            f"VALUES ({ph}, {ph}, {ph}, {ph}, {ph}, {ph})",
            (username, order_no, reason, float(calc["amount"]), "\n".join(calc["lines"]), (client_ip or "")[:64])
        )
        return True, "退款申请已提交，请等待管理员处理"

    def list_refund_requests(self, status="", username="", order_no="", page=1, page_size=20, ip=""):
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
        if ip:
            # 精确匹配申请时的客户端 IP；也允许用前缀查整段（如 112.47.）
            where.append(f"r.client_ip LIKE {ph}")
            params.append(f"{ip}%" if not ip.endswith("%") else ip)
        where_sql = (" WHERE " + " AND ".join(where)) if where else ""
        total = self.fetchone(f"SELECT COUNT(*) cnt FROM refund_requests r {where_sql}", params)["cnt"]
        offset = (page - 1) * page_size
        rows = self.fetchall(
            f"SELECT r.*, o.plan_name, o.price, o.created_at order_created_at, "
            f"o.bank_order_no, o.trade_no, o.channel_order_no, "
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

    # ==================== 风控管理（退款行为） ====================
    def get_risk_config(self):
        c = self.get_admin_config() or {}

        def _i(k, d):
            v = c.get(k)
            try:
                return int(v) if v not in (None, "") else d
            except Exception:
                return d

        raw = (c.get("risk_whitelist") or "").replace("\n", ",").replace("，", ",")
        wl = sorted({p.strip() for p in raw.split(",") if p.strip()})
        return {
            "enabled": _i("risk_enabled", 1),
            "refund_days": _i("risk_refund_days", 30),
            "refund_count": _i("risk_refund_count", 2),
            "refund_rate_pct": _i("risk_refund_rate_pct", 50),
            "refund_rate_min": _i("risk_refund_rate_min", 2),
            "quick_minutes": _i("risk_quick_minutes", 120),
            "quick_count": _i("risk_quick_count", 2),
            "auto_ban": _i("risk_auto_ban", 0),
            "whitelist": wl,
        }

    def get_risk_users(self):
        """按退款行为扫描全站，返回 (config, 命中风险的用户列表)。

        只读，不改库；是否封禁由调用方（后台/自动封开关）决定。
        聚合口径全部来自 payment_orders：
          refunded     历史退款成功单数
          paid_ever    已付过款过的单数（paid + refunded，作为退款率分母）
          quick_refunds 支付后 quick_minutes 分钟内即退款的单数（买了就用、用完就退）
          refunds_recent 近 refund_days 天内的退款单数
        """
        cfg = self.get_risk_config()
        rd = max(1, cfg["refund_days"])
        qm = max(0, cfg["quick_minutes"])
        rows = self.fetchall(
            f"""SELECT username,
                  SUM(CASE WHEN status='refunded' THEN 1 ELSE 0 END) refunded,
                  SUM(CASE WHEN status IN ('paid','refunded') THEN 1 ELSE 0 END) paid_ever,
                  SUM(CASE WHEN status='refunded' AND paid_at IS NOT NULL AND refunded_at IS NOT NULL
                           AND TIMESTAMPDIFF(MINUTE, paid_at, refunded_at) <= {qm} THEN 1 ELSE 0 END) quick_refunds,
                  SUM(CASE WHEN status='refunded' AND refunded_at >= DATE_SUB(NOW(), INTERVAL {rd} DAY) THEN 1 ELSE 0 END) refunds_recent
                FROM payment_orders
                WHERE username IS NOT NULL AND username <> ''
                GROUP BY username
                HAVING refunded > 0
                ORDER BY refunded DESC
                LIMIT 500""",
            ()
        ) or []
        wl = set(cfg["whitelist"])
        out = []
        for r in rows:
            uname = r.get("username")
            if not uname or uname in wl:
                continue
            refunded = int(r.get("refunded") or 0)
            paid_ever = int(r.get("paid_ever") or 0)
            quick = int(r.get("quick_refunds") or 0)
            recent = int(r.get("refunds_recent") or 0)
            hits = []
            if cfg["refund_count"] > 0 and recent >= cfg["refund_count"]:
                hits.append(f"{rd} 天内退款 {recent} 次（阈值 {cfg['refund_count']}）")
            if (cfg["refund_rate_pct"] > 0 and paid_ever >= cfg["refund_rate_min"]
                    and refunded * 100.0 / paid_ever >= cfg["refund_rate_pct"]):
                rate = round(refunded * 100.0 / paid_ever)
                hits.append(f"退款率 {rate}%（退款 {refunded}/已付 {paid_ever}，阈值 {cfg['refund_rate_pct']}%）")
            if cfg["quick_count"] > 0 and quick >= cfg["quick_count"]:
                hits.append(f"支付后 {qm} 分钟内退款 {quick} 次（阈值 {cfg['quick_count']}）")
            if not hits:
                continue
            ent = self.get_user_entitlement(uname) or {}
            out.append({
                "username": uname,
                "refunded": refunded,
                "paid_ever": paid_ever,
                "quick_refunds": quick,
                "refunds_recent": recent,
                "hits": hits,
                "is_banned": bool(ent.get("is_banned")),
                "ban_reason": ent.get("ban_reason") or "",
            })
        out.sort(key=lambda x: (len(x["hits"]), x["refunded"]), reverse=True)
        return cfg, out

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
        """闲鱼单建单：当场铸一张 source='xianyu' 的未使用卡密并回给下单人。

        这条链上没有任何付款凭据，所以「谁调用谁白拿」：面向买家的建单/自确认两个口已下线。
        要重新接回界面，必须先有服务端能核验的到账凭据，不能由下单人自己确认已付款。
        """
        ph = _ph()
        plan = self.get_payment_plan(plan_id)
        if not plan:
            return None, "套餐不存在"
        code = self._make_card_codes("XS", 1)[0]
        order_no = f"XY{int(time.time()*1000)}{abs(hash(username)) % 10000:04d}"
        try:
            self.execute(
                f"INSERT INTO card_keys (code, plan_id, status, created_by, source) VALUES ({ph}, {ph}, 'unused', {ph}, 'xianyu')",
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

    # ==================== 分销/代理商 ====================
    def _ensure_distributor_tables(self):
        """代理商账号、卡密模板、余额流水、生成批次、提现单。"""
        self.execute("""
            CREATE TABLE IF NOT EXISTS distributors (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) NOT NULL UNIQUE COMMENT '代理商登录账号，关联 users.username',
                name VARCHAR(100) NOT NULL DEFAULT '' COMMENT '代理商名称',
                contact VARCHAR(100) DEFAULT '' COMMENT '联系方式（QQ/微信/手机）',
                balance DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '预存余额（元）',
                discount_rate DECIMAL(5,4) NOT NULL DEFAULT 1.0000 COMMENT '折扣率 0.0001-1.0000，1=按官方基准价',
                status VARCHAR(20) NOT NULL DEFAULT 'pending' COMMENT 'pending/approved/rejected/suspended',
                support_note VARCHAR(255) DEFAULT '' COMMENT '展示给终端用户的售后/充值引导文案',
                shop_url VARCHAR(255) NOT NULL DEFAULT '' COMMENT '纯净版脚本里的购买/续费跳转地址，必须 https',
                apply_reason VARCHAR(500) DEFAULT '' COMMENT '申请理由',
                audit_note VARCHAR(500) DEFAULT '' COMMENT '审核备注',
                audited_by VARCHAR(50) DEFAULT '' COMMENT '审核人',
                audited_at TIMESTAMP NULL COMMENT '审核时间',
                reject_reason VARCHAR(255) DEFAULT '' COMMENT '驳回原因',
                recharge_total DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '累计充值（元）',
                spent_total DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '累计生成扣款（元）',
                withdraw_total DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '累计提现成功（元）',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)
        self.execute("""
            CREATE TABLE IF NOT EXISTS distributor_templates (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE COMMENT '模板名称，如 100题/包月/季度',
                price_type VARCHAR(20) NOT NULL DEFAULT 'points' COMMENT 'points/monthly',
                points INT NOT NULL DEFAULT 0 COMMENT '单张题数，price_type=points 时生效',
                days INT NOT NULL DEFAULT 0 COMMENT '单张包月天数，price_type=monthly 时生效',
                code_prefix VARCHAR(8) NOT NULL DEFAULT 'FX' COMMENT '卡密前缀，固定2字符（卡密总长锁定16）',
                enabled TINYINT DEFAULT 1 COMMENT '是否启用',
                sort_order INT DEFAULT 0 COMMENT '排序',
                remark VARCHAR(255) DEFAULT '' COMMENT '说明',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_enabled (enabled, sort_order)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)
        self.execute("""
            CREATE TABLE IF NOT EXISTS distributor_balance_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                distributor_id INT NOT NULL COMMENT '代理商ID',
                username VARCHAR(50) NOT NULL COMMENT '代理商账号',
                type VARCHAR(20) NOT NULL COMMENT 'recharge/generate/withdraw/withdraw_reject/refund/adjust',
                amount DECIMAL(10,2) NOT NULL COMMENT '变动金额，正=入账，负=出账',
                balance_after DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '变动后余额',
                order_no VARCHAR(64) NOT NULL DEFAULT '' COMMENT '关联支付订单号',
                batch_no VARCHAR(64) NOT NULL DEFAULT '' COMMENT '关联生成批次号',
                withdraw_id INT NOT NULL DEFAULT 0 COMMENT '关联提现单ID',
                operator VARCHAR(50) DEFAULT '' COMMENT '操作人，系统触发为空',
                remark VARCHAR(255) DEFAULT '' COMMENT '备注',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_dist (distributor_id, id),
                INDEX idx_type_created (type, created_at),
                INDEX idx_order_no (order_no),
                INDEX idx_batch (batch_no)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)
        # status='pending' 是崩溃标记：扣了钱但卡未落地时，由 reconcile_distributor_batches 收敛
        self.execute("""
            CREATE TABLE IF NOT EXISTS distributor_batches (
                id INT AUTO_INCREMENT PRIMARY KEY,
                batch_no VARCHAR(64) NOT NULL UNIQUE COMMENT '批次号 FXG+毫秒+md5前4位',
                distributor_id INT NOT NULL COMMENT '代理商ID',
                username VARCHAR(50) NOT NULL COMMENT '代理商账号',
                template_id INT NOT NULL COMMENT '模板ID',
                template_name VARCHAR(100) DEFAULT '' COMMENT '模板名快照',
                price_type VARCHAR(20) DEFAULT 'points' COMMENT '计价方式快照',
                points INT NOT NULL DEFAULT 0 COMMENT '单张题数快照',
                days INT NOT NULL DEFAULT 0 COMMENT '单张天数快照',
                card_count INT NOT NULL DEFAULT 0 COMMENT '本批张数',
                base_price DECIMAL(10,4) NOT NULL DEFAULT 0.0000 COMMENT '基准单价快照 元/题或元/天',
                discount_rate DECIMAL(5,4) NOT NULL DEFAULT 1.0000 COMMENT '折扣率快照',
                unit_settle DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '单张结算价（元）',
                settle_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '本批总扣款（元）',
                status VARCHAR(20) NOT NULL DEFAULT 'pending' COMMENT 'pending/generated/failed',
                error_note VARCHAR(255) DEFAULT '' COMMENT '失败/异常原因',
                created_by VARCHAR(50) DEFAULT '' COMMENT '操作人',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_dist (distributor_id, id),
                INDEX idx_status_created (status, created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)
        # 独立于推广提现表：reject_withdrawal 会无条件给 users.commission_balance 加钱，
        # 两拨钱共用一张表时漏改一处分支就是凭空造币，故结构上分开。
        # uk_open(distributor_id, open_flag) 用「处理完置 NULL」实现数据库级的单笔在途约束。
        self.execute("""
            CREATE TABLE IF NOT EXISTS distributor_withdrawals (
                id INT AUTO_INCREMENT PRIMARY KEY,
                distributor_id INT NOT NULL COMMENT '代理商ID',
                username VARCHAR(50) NOT NULL COMMENT '代理商账号',
                amount DECIMAL(10,2) NOT NULL COMMENT '提现金额',
                pay_method VARCHAR(20) NOT NULL COMMENT 'alipay/wechat',
                pay_account VARCHAR(255) NOT NULL COMMENT '收款账号',
                qr_code_path TEXT COMMENT '收款二维码 data-URI',
                open_flag TINYINT DEFAULT 1 COMMENT '在途占位标记，审核后置 NULL',
                status VARCHAR(20) DEFAULT 'pending' COMMENT 'pending/approved/rejected',
                reject_reason VARCHAR(255) DEFAULT '' COMMENT '驳回原因',
                reviewed_by VARCHAR(50) DEFAULT '' COMMENT '审核人',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                reviewed_at TIMESTAMP NULL DEFAULT NULL,
                UNIQUE KEY uk_open (distributor_id, open_flag),
                INDEX idx_dist (distributor_id, id),
                INDEX idx_status_created (status, created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)

    def _ensure_distributor_columns(self):
        """卡密增列：让代理卡在生成瞬间冻结成本与权益，激活时不回查任何价目表。"""
        self._add_column_if_missing("card_keys", "source", "source VARCHAR(20) NOT NULL DEFAULT 'platform' COMMENT 'platform/xianyu/distributor'")
        self._add_column_if_missing("card_keys", "distributor_id", "distributor_id INT NOT NULL DEFAULT 0 COMMENT '代理商ID，0=非代理卡'")
        self._add_column_if_missing("card_keys", "batch_id", "batch_id INT NOT NULL DEFAULT 0 COMMENT '生成批次ID'")
        self._add_column_if_missing("card_keys", "template_id", "template_id INT NOT NULL DEFAULT 0 COMMENT '代理模板ID'")
        self._add_column_if_missing("card_keys", "settle_amount", "settle_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '单张结算成本快照（元）'")
        self._add_column_if_missing("card_keys", "grant_type", "grant_type VARCHAR(20) NOT NULL DEFAULT '' COMMENT '冻结权益类型 points/monthly'")
        self._add_column_if_missing("card_keys", "grant_points", "grant_points INT NOT NULL DEFAULT 0 COMMENT '冻结题数'")
        self._add_column_if_missing("card_keys", "grant_days", "grant_days INT NOT NULL DEFAULT 0 COMMENT '冻结天数'")
        self._add_column_if_missing("card_keys", "activated_order_no", "activated_order_no VARCHAR(64) NOT NULL DEFAULT '' COMMENT '激活时生成的订单号'")
        self._ensure_index("card_keys", "idx_distributor_status", "distributor_id", "status")
        self._ensure_index("card_keys", "idx_batch", "batch_id")
        self._ensure_index("card_keys", "idx_used_by", "used_by", "source")
        # 渠道标记只用于选择服务端提示文案，绝不参与权益、额度或计价判定
        self._add_column_if_missing("users", "channel", "channel VARCHAR(20) NOT NULL DEFAULT 'platform' COMMENT '文案渠道 platform/distributor'")
        self._add_column_if_missing("users", "channel_ref", "channel_ref VARCHAR(50) DEFAULT '' COMMENT '归属代理商账号'")
        self._add_column_if_missing("distributors", "shop_url", "shop_url VARCHAR(255) NOT NULL DEFAULT '' COMMENT '纯净版脚本里的购买/续费跳转地址，必须 https'")

    # ---------- 分销配置与计价 ----------
    DIST_CODE_LEN = 16        # 用户中心硬校验卡密长度 === 16，改长度会让已发卡密全部无法兑换
    DIST_PREFIX_LEN = 2       # 前缀定长，其余用随机字符补足
    DIST_BATCH_HARD_CAP = 500  # 单次生成张数硬上限，后台配置只能比它更严

    def _dist_cfg(self):
        """读取分销开关与基准价，统一成 Decimal/int，避免调用方各自处理 None 和 float。"""
        cfg = self.get_admin_config() or {}
        max_batch = int(cfg.get("distributor_max_batch") or 0)
        return {
            "enabled": int(cfg.get("distributor_enabled") or 0),
            "apply_enabled": int(cfg.get("distributor_apply_enabled") or 0),
            "generate_enabled": int(cfg.get("distributor_generate_enabled") or 0),
            "withdraw_enabled": int(cfg.get("distributor_withdraw_enabled") or 0),
            "base_points": _dec(cfg.get("distributor_base_price_points"), "0.0010"),
            "base_days": _dec(cfg.get("distributor_base_price_days"), "0.5000"),
            "default_discount": _dec(cfg.get("distributor_default_discount"), "1"),
            "min_recharge": _dec(cfg.get("distributor_min_recharge"), "50"),
            "min_withdraw": _dec(cfg.get("distributor_min_withdraw"), "50"),
            "max_batch": min(max_batch, self.DIST_BATCH_HARD_CAP) if max_batch > 0 else self.DIST_BATCH_HARD_CAP,
            "daily_card_max": int(cfg.get("distributor_daily_card_max") or 0),
            "script_name": (cfg.get("distributor_script_name") or "学神助手 纯净版").strip(),
        }

    def _dist_unit_price(self, base, qty, rate):
        """单张结算价（元，精确 2 位）。返回 (Decimal | None, 错误原因 | None)。

        金额守恒的唯一来源：qty 是整数、rate 定存 4 位，所以只要 base×rate 本身
        落在 2 位小数上，任意面额都精确，总扣款 = 单张价 × 张数 完全不需要舍入，
        「10 张 100 题」与「1 张 1000 题」因此必然等价。
        只把最终结果四舍五入到分是拦不住的：0.001×100×0.3333=0.03333→0.03，
        十张合计 0.30，而单算一张 1000 题是 0.33 —— 必须靠下面的精确性断言拒绝。
        """
        base, rate, qty = _dec(base), _dec(rate), int(qty or 0)
        if base <= 0 or qty <= 0:
            return None, "基准单价与模板面额都必须大于 0"
        if rate <= 0 or rate > 1:
            return None, "折扣率必须大于 0 且不超过 1（1 表示按官方基准价）"
        raw = base * Decimal(qty) * rate
        per_card = raw.quantize(CENT, rounding=ROUND_HALF_UP)
        if per_card != raw:
            return None, "折扣率与基准单价组合后无法精确到分，请调整折扣率或模板面额"
        if per_card < CENT:
            return None, "单张成本低于 0.01 元，请增大题数或天数"
        return per_card, None

    def _dist_tpl_price(self, tpl, discount_rate, cfg=None):
        """模板 × 折扣率 → (单张价, 基准单价, 面额, 错误原因)。"""
        cfg = cfg or self._dist_cfg()
        monthly = (tpl.get("price_type") or "points") == "monthly"
        base = cfg["base_days"] if monthly else cfg["base_points"]
        qty = int(tpl.get("days") or 0) if monthly else int(tpl.get("points") or 0)
        per_card, err = self._dist_unit_price(base, qty, discount_rate)
        return per_card, base, qty, err

    def validate_distributor_pricing(self, templates=None, distributors=None):
        """改折扣 / 改基准单价 / 改模板之前的 dry-run。

        计价参数一改，既有模板可能突然无法精确到分；不拦就会让代理商在活动途中
        突然生成不了卡密且查不出原因。返回 None 表示通过，否则为指名模板的中文原因。
        templates / distributors 传 None 表示「全部启用模板 / 全部已过审代理商」。
        """
        ph = _ph()
        cfg = self._dist_cfg()
        if templates is None:
            templates = self.fetchall("SELECT * FROM distributor_templates WHERE enabled = 1") or []
        if distributors is None:
            distributors = list(self.fetchall(
                "SELECT id, username, discount_rate FROM distributors WHERE status = 'approved'"
            ) or [])
            # 默认折扣也要自检：新建的每个代理商都从它起步，自检不过就是渠道一开即瘫
            distributors.append({"id": 0, "username": "默认折扣", "discount_rate": cfg["default_discount"]})
        for dist in distributors:
            rate = _dec(dist.get("discount_rate"), "1")
            for tpl in templates:
                _per_card, _base, _qty, err = self._dist_tpl_price(tpl, rate, cfg)
                if err:
                    return f"模板「{tpl.get('name')}」在 {dist.get('username') or '默认折扣'} 的折扣下无法生成：{err}"
        return None

    # ---------- 分销配置 ----------
    DIST_CFG_SPEC = (
        ("enabled", "distributor_enabled", "flag"),
        ("apply_enabled", "distributor_apply_enabled", "flag"),
        ("generate_enabled", "distributor_generate_enabled", "flag"),
        ("withdraw_enabled", "distributor_withdraw_enabled", "flag"),
        ("base_price_points", "distributor_base_price_points", "dec4"),
        ("base_price_days", "distributor_base_price_days", "dec4"),
        ("default_discount", "distributor_default_discount", "dec4"),
        ("min_recharge", "distributor_min_recharge", "money"),
        ("min_withdraw", "distributor_min_withdraw", "money"),
        ("max_batch", "distributor_max_batch", "int"),
        ("daily_card_max", "distributor_daily_card_max", "int"),
        ("script_name", "distributor_script_name", "text"),
    )

    def _dist_cfg_cast(self, kind, value):
        if kind == "flag":
            return 1 if str(value if value is not None else "").strip().lower() in ("1", "true", "on", "yes") else 0
        if kind in ("dec4", "money"):
            d = _dec(value)
            if d < 0:
                raise ValueError("不能为负数")
            return str(d.quantize(Decimal("0.0001") if kind == "dec4" else CENT, rounding=ROUND_HALF_UP))
        if kind == "int":
            return max(0, int(float(value or 0)))
        return str(value or "").strip()[:100]

    def save_distributor_config(self, data=None, operator=""):
        """写分销配置。基准单价或默认折扣一改，既有模板可能突然无法精确到分，
        所以先落库、再对全部启用模板 dry-run，不通过就整体回滚成旧值——
        绝不能让代理商在活动途中突然生成不了卡密。
        """
        ph = _ph()
        data = data or {}
        old = self.get_admin_config() or {}
        sets, params, rollback = [], [], []
        for key, col, kind in self.DIST_CFG_SPEC:
            if key not in data:
                continue
            try:
                val = self._dist_cfg_cast(kind, data.get(key))
            except Exception:
                return False, f"{col} 取值格式错误"
            if col == "distributor_max_batch":
                val = min(int(val), self.DIST_BATCH_HARD_CAP) if int(val) > 0 else self.DIST_BATCH_HARD_CAP
            if col == "distributor_default_discount" and not (Decimal("0") < Decimal(val) <= 1):
                return False, "默认折扣率必须大于 0 且不超过 1（0.5 表示五折）"
            sets.append(f"{col} = {ph}")
            params.append(val)
            prev = old.get(col)
            rollback.append((col, "" if (kind == "text" and prev is None) else (prev if prev is not None else 0)))
        if not sets:
            return False, "没有需要修改的内容"
        self.execute(f"UPDATE admin_config SET {', '.join(sets)} WHERE id = 1", tuple(params))
        err = self.validate_distributor_pricing()
        if err:
            rb_sets = [f"{c} = {ph}" for c, _ in rollback]
            rb_params = [v for _, v in rollback]
            self.execute(f"UPDATE admin_config SET {', '.join(rb_sets)} WHERE id = 1", tuple(rb_params))
            return False, f"配置已回滚：{err}"
        return True, "配置已保存"

    def distributor_stats(self):
        """后台概览：各状态代理商数、余额合计、卡密消化率、待对账批次。"""
        row = self.fetchone(
            "SELECT "
            "SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) pending_cnt, "
            "SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) approved_cnt, "
            "SUM(CASE WHEN status = 'suspended' THEN 1 ELSE 0 END) suspended_cnt, "
            "COALESCE(SUM(balance), 0) balance_total, "
            "COALESCE(SUM(spent_total), 0) spent_total "
            "FROM distributors"
        ) or {}
        cards = self.fetchone(
            "SELECT SUM(CASE WHEN status = 'unused' THEN 1 ELSE 0 END) unused_cnt, "
            "SUM(CASE WHEN status = 'used' THEN 1 ELSE 0 END) used_cnt "
            "FROM card_keys WHERE source = 'distributor'"
        ) or {}
        pending_batch = int((self.fetchone(
            "SELECT COUNT(*) cnt FROM distributor_batches WHERE status = 'pending'"
        ) or {}).get("cnt") or 0)
        # 「需人工核对」是钱和卡对不上的批次，必须置顶告警而不是埋在列表里
        inconsistent_batch = int((self.fetchone(
            "SELECT COUNT(*) cnt FROM distributor_batches WHERE status = 'inconsistent'"
        ) or {}).get("cnt") or 0)
        # 待审核提现也放概览：钱在代理商申请那一刻就离开余额了，压着不审就是欠账
        wd = self.distributor_withdrawal_summary()
        return {
            "pending": int(row.get("pending_cnt") or 0),
            "approved": int(row.get("approved_cnt") or 0),
            "suspended": int(row.get("suspended_cnt") or 0),
            "balance_total": str(_dec(row.get("balance_total"))),
            "spent_total": str(_dec(row.get("spent_total"))),
            "card_unused": int(cards.get("unused_cnt") or 0),
            "card_used": int(cards.get("used_cnt") or 0),
            "batch_pending": pending_batch,
            "batch_inconsistent": inconsistent_batch,
            "wd_pending": wd["pending_count"],
            "wd_pending_amount": str(wd["pending_amount"]),
        }

    # ---------- 分销收入统计 ----------
    def distributor_revenue_stats(self, start_date, end_date_exclusive):
        """分销收入统计。只读 distributor_balance_logs，不碰官网直营的 payment_orders。

        分成两套口径是必须的：充值是代理压在平台的预存款（我们欠他的额度），
        生成卡密时扣掉的钱才是真收入。混在一个数里会把负债当营收。
        """
        ph = _ph()

        def signed(rows):
            out = {}
            for r in rows or []:
                out[str(r.get("type") or "")] = {
                    "count": int(r.get("cnt") or 0),
                    "amount": float(_dec(r.get("amt")).quantize(CENT, rounding=ROUND_HALF_UP)),
                }
            return out

        def load(where, params):
            return signed(self.fetchall(
                f"SELECT type, COUNT(*) cnt, COALESCE(SUM(amount),0) amt FROM distributor_balance_logs "
                f"{where} GROUP BY type", params))

        period = load(f"WHERE created_at >= {ph} AND created_at < {ph}", (start_date, end_date_exclusive))
        totals = load("", ())

        def val(src, kind):
            return float((src.get(kind) or {}).get("amount") or 0)

        def stat(src, kind):
            return {
                "count": int((src.get(kind) or {}).get("count") or 0),
                "amount": round(abs(val(src, kind)), 2),
            }

        def build(src):
            recharge = val(src, "recharge")
            consume = -val(src, "generate")
            paid_out = -val(src, "withdraw") - val(src, "withdraw_reject")
            back = val(src, "refund") + val(src, "adjust")
            delta = sum(val(src, t) for t in
                        ("recharge", "generate", "withdraw", "withdraw_reject", "refund", "adjust"))
            # 取负会把 0 变成 -0.0，JSON 出去就是 "-0.0"，前端显示成 -¥0.00
            money = lambda v: round(v, 2) or 0.0  # noqa: E731
            return {
                "recharge": money(recharge),
                "consume": money(consume),
                "withdraw_paid": money(paid_out),
                "give_back": money(back),
                "balance_delta": money(delta),
                "net_income": money(consume - back),
                "net_cash": money(recharge - paid_out),
            }

        # 按日拆三条线：充值进、消耗掉、提现出（提现净额含驳回回补）
        trend_rows = self.fetchall(
            f"SELECT DATE(created_at) d, type, COALESCE(SUM(amount),0) amt FROM distributor_balance_logs "
            f"WHERE created_at >= {ph} AND created_at < {ph} GROUP BY DATE(created_at), type",
            (start_date, end_date_exclusive)) or []
        by_day = {}
        for r in trend_rows:
            day = str(r.get("d") or "")[:10]
            t = by_day.setdefault(day, {"recharge": 0.0, "consume": 0.0, "withdraw": 0.0})
            typ = str(r.get("type") or "")
            amt = float(_dec(r.get("amt")))
            if typ == "recharge":
                t["recharge"] += amt
            elif typ == "generate":
                t["consume"] += -amt
            elif typ in ("withdraw", "withdraw_reject"):
                t["withdraw"] += -amt

        from datetime import datetime as _dt, timedelta as _td
        trend = []
        try:
            cur = _dt.strptime(start_date, "%Y-%m-%d")
            last = _dt.strptime(end_date_exclusive, "%Y-%m-%d") - _td(days=1)
            while cur <= last:
                day = cur.strftime("%Y-%m-%d")
                t = by_day.get(day, {})
                trend.append({
                    "day": day, "label": day[5:],
                    "recharge": round(float(t.get("recharge") or 0), 2),
                    "consume": round(float(t.get("consume") or 0), 2),
                    "withdraw": round(float(t.get("withdraw") or 0), 2),
                })
                cur += _td(days=1)
        except Exception:
            trend = [{"day": d, "label": d[5:], "recharge": round(v["recharge"], 2),
                      "consume": round(v["consume"], 2), "withdraw": round(v["withdraw"], 2)}
                     for d, v in sorted(by_day.items())]

        # 排行：区间消耗和全量档位放在一张表里看，代理数量级很小，直接 LEFT JOIN 聚合
        rows = self.fetchall(
            f"""SELECT d.id, d.username, d.name, d.status, d.discount_rate,
                       d.balance, d.recharge_total, d.spent_total, d.withdraw_total,
                       COALESCE(SUM(CASE WHEN l.type='generate' AND l.created_at >= {ph} AND l.created_at < {ph}
                                         THEN -l.amount ELSE 0 END), 0) period_consume,
                       COALESCE(SUM(CASE WHEN l.created_at >= {ph} AND l.created_at < {ph}
                                         THEN l.amount ELSE 0 END), 0) period_delta
                FROM distributors d
                LEFT JOIN distributor_balance_logs l ON l.distributor_id = d.id
                GROUP BY d.id, d.username, d.name, d.status, d.discount_rate,
                         d.balance, d.recharge_total, d.spent_total, d.withdraw_total
                ORDER BY period_consume DESC, d.spent_total DESC
                LIMIT 100""",
            (start_date, end_date_exclusive, start_date, end_date_exclusive)) or []
        cards = self.fetchone(
            f"SELECT COUNT(*) total, SUM(status='used') used FROM card_keys "
            f"WHERE source='distributor' AND created_at >= {ph} AND created_at < {ph}",
            (start_date, end_date_exclusive)) or {}
        batches = self.fetchone(
            f"SELECT COUNT(*) cnt, COALESCE(SUM(card_count),0) cards, COALESCE(SUM(settle_amount),0) settle "
            f"FROM distributor_batches WHERE status='generated' AND created_at >= {ph} AND created_at < {ph}",
            (start_date, end_date_exclusive)) or {}
        dist_totals = self.fetchone(
            "SELECT COUNT(*) n, COALESCE(SUM(balance),0) balance, COALESCE(SUM(recharge_total),0) recharge, "
            "COALESCE(SUM(spent_total),0) spent, COALESCE(SUM(withdraw_total),0) withdraw "
            "FROM distributors", ()) or {}
        # 真核对：余额应当恒等于该代理全部流水之和。不等就是绕过流水改了余额（或直接动了库），
        # 上面那套区间口径里 recharge−withdraw−Δbalance 与 net_income 是恒等式，查不出问题。
        drift_rows = self.fetchall(
            f"SELECT d.id, d.username, d.balance, "
            f"COALESCE(l.s, 0) ledger FROM distributors d "
            f"LEFT JOIN (SELECT distributor_id, SUM(amount) s FROM distributor_balance_logs "
            f"            GROUP BY distributor_id) l ON l.distributor_id = d.id", ()) or []
        drift_list = []
        drift_balance = Decimal("0")
        drift_ledger = Decimal("0")
        for r in drift_rows:
            bal, led = _dec(r.get("balance")), _dec(r.get("ledger"))
            drift_balance += bal
            drift_ledger += led
            gap = bal - led
            if abs(gap) > Decimal("0.004"):
                drift_list.append({
                    "id": int(r.get("id") or 0),
                    "username": r.get("username") or "",
                    "balance": round(float(bal), 2),
                    "ledger": round(float(led), 2),
                    "drift": round(float(gap), 2),
                })
        drift_list.sort(key=lambda x: abs(x["drift"]), reverse=True)
        drift = {
            "balance": round(float(drift_balance), 2),
            "ledger": round(float(drift_ledger), 2),
            "gap": round(float(drift_balance - drift_ledger), 2),
            "count": len(drift_list),
            "top": drift_list[:20],
        }

        return {
            "period": {"summary": build(period), "by_type": {
                k: stat(period, k) for k in ("recharge", "generate", "withdraw",
                                             "withdraw_reject", "refund", "adjust")}},
            "all_time": {"summary": build(totals), "by_type": {
                k: stat(totals, k) for k in ("recharge", "generate", "withdraw",
                                             "withdraw_reject", "refund", "adjust")}},
            "trend": trend,
            "rows": [{"id": int(r.get("id") or 0), "username": r.get("username") or "",
                      "name": r.get("name") or "", "status": r.get("status") or "",
                      "discount_rate": float(_dec(r.get("discount_rate"), "1")),
                      "balance": round(float(_dec(r.get("balance"))), 2),
                      "recharge_total": round(float(_dec(r.get("recharge_total"))), 2),
                      "spent_total": round(float(_dec(r.get("spent_total"))), 2),
                      "withdraw_total": round(float(_dec(r.get("withdraw_total"))), 2),
                      "period_consume": round(float(_dec(r.get("period_consume"))), 2),
                      "period_delta": round(float(_dec(r.get("period_delta"))), 2)} for r in rows],
            "cards": {"generated": int(cards.get("total") or 0), "activated": int(cards.get("used") or 0)},
            "batches": {"count": int(batches.get("cnt") or 0), "cards": int(batches.get("cards") or 0),
                        "settle": round(float(_dec(batches.get("settle"))), 2)},
            "stock": {"distributors": int(dist_totals.get("n") or 0),
                      "balance": round(float(_dec(dist_totals.get("balance"))), 2),
                      "recharge": round(float(_dec(dist_totals.get("recharge"))), 2),
                      "spent": round(float(_dec(dist_totals.get("spent"))), 2),
                      "withdraw": round(float(_dec(dist_totals.get("withdraw"))), 2)},
            "drift": drift,
        }

    # ---------- 分销账号 ----------
    def get_distributor(self, distributor_id):
        ph = _ph()
        return self.fetchone(f"SELECT * FROM distributors WHERE id = {ph}", (int(distributor_id or 0),))

    def get_distributor_by_username(self, username):
        ph = _ph()
        return self.fetchone(f"SELECT * FROM distributors WHERE username = {ph}", (username,))

    def apply_distributor(self, username, name, contact="", reason=""):
        """自助申请 / 驳回后重新提交。approved、suspended 不走这条路径。"""
        ph = _ph()
        cfg = self._dist_cfg()
        if not cfg["enabled"]:
            return False, "分销渠道尚未开放"
        if not cfg["apply_enabled"]:
            return False, "当前不允许自助申请，请联系管理员开通"
        name = (name or "").strip()
        if len(name) < 2:
            return False, "请填写代理商名称（至少 2 个字）"
        if not self.get_user_by_username(username):
            return False, "账号不存在，请先注册"
        contact = (contact or "").strip()[:100]
        reason = (reason or "").strip()[:500]
        exist = self.get_distributor_by_username(username)
        if exist:
            if exist["status"] == "approved":
                return False, "该账号已是代理商，无需重复申请"
            if exist["status"] == "suspended":
                return False, "账号已被停用，请联系管理员"
            cur = self.execute(
                f"UPDATE distributors SET name = {ph}, contact = {ph}, apply_reason = {ph}, "
                f"status = 'pending', reject_reason = '' WHERE username = {ph} AND status IN ({ph}, {ph})",
                (name, contact, reason, username, "pending", "rejected")
            )
            if not cur or cur.rowcount == 0:
                return False, "申请状态已变化，请刷新后重试"
            return True, "已重新提交申请，等待审核"
        try:
            self.execute(
                f"INSERT INTO distributors (username, name, contact, discount_rate, apply_reason) "
                f"VALUES ({ph}, {ph}, {ph}, {ph}, {ph})",
                (username, name, contact, str(cfg["default_discount"]), reason)
            )
        except Exception:
            return False, "申请提交失败，请稍后重试"
        return True, "申请已提交，等待审核"

    def admin_add_distributor(self, username, name="", contact="", discount_rate=None,
                              initial_balance=0, operator=""):
        """后台直接开通代理商。

        没有自助申请入口时这是唯一的建档路径。已存在记录时只把 pending/rejected 转成
        approved，不覆盖 approved/suspended 的现状——管理员顺手改个折扣不该把停用账号解禁。
        """
        ph = _ph()
        username = str(username or "").strip()
        if not username:
            return False, "请填写代理商账号"
        if not self.get_user_by_username(username):
            return False, "该账号不存在，请先让用户注册"
        name = str(name or "").strip()[:100] or username
        contact = str(contact or "").strip()[:100]
        cfg = self._dist_cfg()
        rate = cfg["default_discount"] if discount_rate in (None, "") else _dec(discount_rate)
        rate = rate.quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP)
        if not (Decimal("0") < rate <= 1):
            return False, "折扣率必须大于 0 且不超过 1（0.5 表示五折）"
        err = self.validate_distributor_pricing(distributors=[{"id": 0, "username": username, "discount_rate": rate}])
        if err:
            return False, f"未创建：{err}"

        exist = self.get_distributor_by_username(username)
        if exist:
            if exist["status"] == "suspended":
                return False, "该账号已被停用，请先在列表里恢复状态"
            self.execute(
                f"UPDATE distributors SET name = {ph}, contact = {ph}, discount_rate = {ph}, "
                f"status = 'approved', reject_reason = '', audited_by = {ph}, audited_at = CURRENT_TIMESTAMP "
                f"WHERE id = {ph} AND status IN ({ph}, {ph})",
                (name, contact, str(rate), operator, int(exist["id"]), "pending", "rejected")
            )
            dist_id = int(exist["id"])
        else:
            cur = self.execute(
                f"INSERT INTO distributors (username, name, contact, discount_rate, status, apply_reason, audited_by, audited_at) "
                f"VALUES ({ph}, {ph}, {ph}, {ph}, 'approved', {ph}, {ph}, CURRENT_TIMESTAMP)",
                (username, name, contact, str(rate), "后台直接开通", operator)
            )
            dist_id = int(getattr(cur, "lastrowid", 0) or 0)
            if not dist_id:
                return False, "创建失败，请重试"

        amount = _dec(initial_balance).quantize(CENT, rounding=ROUND_HALF_UP)
        if amount > 0:
            ok, msg = self.adjust_distributor_balance(dist_id, amount, operator=operator, remark="开通时预存")
            if not ok:
                return False, f"代理商已开通，但预存失败：{msg}"
            return True, f"已开通代理商 {username}，预存 {amount} 元"
        return True, f"已开通代理商 {username}"

    def list_distributors(self, status="", keyword="", page=1, page_size=20):
        ph = _ph()
        where, params = [], []
        if status:
            where.append(f"status = {ph}")
            params.append(status)
        if keyword:
            where.append(f"(username LIKE {ph} OR name LIKE {ph} OR contact LIKE {ph})")
            kw = f"%{keyword}%"
            params += [kw, kw, kw]
        where_sql = ("WHERE " + " AND ".join(where)) if where else ""
        total = int((self.fetchone(f"SELECT COUNT(*) cnt FROM distributors {where_sql}", params) or {}).get("cnt") or 0)
        page_size = max(1, min(int(page_size or 20), 200))
        offset = (max(1, int(page or 1)) - 1) * page_size
        rows = self.fetchall(
            f"SELECT * FROM distributors {where_sql} "
            f"ORDER BY (status = 'pending') DESC, id DESC LIMIT {ph} OFFSET {ph}",
            params + [page_size, offset]
        ) or []
        return {"total": total, "rows": rows}

    def audit_distributor(self, distributor_id, approve, note="", operator="", reject_reason=""):
        """审核申请。`AND status='pending'` 保证两个管理员只有一个能生效。"""
        ph = _ph()
        distributor_id = int(distributor_id or 0)
        note = (note or "").strip()[:500]
        if not self.get_distributor(distributor_id):
            return False, "申请不存在"
        if approve:
            cur = self.execute(
                f"UPDATE distributors SET status = 'approved', audit_note = {ph}, reject_reason = '', "
                f"audited_by = {ph}, audited_at = CURRENT_TIMESTAMP WHERE id = {ph} AND status = 'pending'",
                (note, operator, distributor_id)
            )
            if not cur or cur.rowcount == 0:
                return False, "该申请已被处理"
            return True, "已通过审核，代理商可登录门户"
        reason = (reject_reason or note).strip()[:255]
        if not reason:
            return False, "驳回必须填写原因"
        cur = self.execute(
            f"UPDATE distributors SET status = 'rejected', audit_note = {ph}, reject_reason = {ph}, "
            f"audited_by = {ph}, audited_at = CURRENT_TIMESTAMP WHERE id = {ph} AND status = 'pending'",
            (note, reason, operator, distributor_id)
        )
        if not cur or cur.rowcount == 0:
            return False, "该申请已被处理"
        return True, "已驳回"

    def update_distributor(self, distributor_id, fields=None, operator=""):
        """后台编辑代理商资料。折扣改动会先对全部启用模板做 dry-run。"""
        ph = _ph()
        fields = fields or {}
        dist = self.get_distributor(distributor_id)
        if not dist:
            return False, "代理商不存在"
        sets, params = [], []
        # shop_url 的 https 校验在调用方做（后台编辑与门户自助都走 build_distributor.shop_url），
        # 这里不重复一份：两处正则迟早会漂移，而漏判的代价是把非法串注入进脚本。
        for key, col, limit in (("name", "name", 100), ("contact", "contact", 100),
                                ("support_note", "support_note", 255), ("audit_note", "audit_note", 500),
                                ("shop_url", "shop_url", 255)):
            if key in fields:
                sets.append(f"{col} = {ph}")
                params.append(str(fields.get(key) or "").strip()[:limit])
        if fields.get("discount_rate") not in (None, ""):
            rate = _dec(fields["discount_rate"]).quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP)
            if rate <= 0 or rate > 1:
                return False, "折扣率必须大于 0 且不超过 1（0.5 表示五折）"
            err = self.validate_distributor_pricing(distributors=[dict(dist, discount_rate=rate)])
            if err:
                return False, f"折扣已保留原值：{err}"
            sets.append(f"discount_rate = {ph}")
            params.append(str(rate))
        if not sets:
            return False, "没有需要修改的内容"
        params.append(int(dist["id"]))
        self.execute(f"UPDATE distributors SET {', '.join(sets)} WHERE id = {ph}", tuple(params))
        return True, "已保存"

    def set_distributor_status(self, distributor_id, status, operator=""):
        ph = _ph()
        if status not in ("pending", "approved", "rejected", "suspended"):
            return False, "状态不合法"
        dist = self.get_distributor(distributor_id)
        if not dist:
            return False, "代理商不存在"
        if dist["status"] == status:
            return True, "状态未变化"
        self.execute(
            f"UPDATE distributors SET status = {ph}, audited_by = {ph}, audited_at = CURRENT_TIMESTAMP WHERE id = {ph}",
            (status, operator, int(dist["id"]))
        )
        return True, "状态已更新"

    # ---------- 余额流水 ----------
    def distributor_add_log(self, distributor_id, username, log_type, amount, balance_after,
                            order_no="", batch_no="", withdraw_id=0, operator="", remark=""):
        """记一笔余额流水。流水只做审计，不做幂等依据（幂等靠 apply_paid_order 的抢占）。"""
        ph = _ph()
        try:
            self.execute(
                f"""INSERT INTO distributor_balance_logs
                    (distributor_id, username, type, amount, balance_after, order_no, batch_no, withdraw_id, operator, remark)
                    VALUES ({ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph})""",
                (int(distributor_id), username or "", log_type, str(_dec(amount)), str(_dec(balance_after)),
                 order_no or "", batch_no or "", int(withdraw_id or 0), operator or "", str(remark or "")[:255])
            )
            return True
        except Exception as e:
            print(f"[分销流水] 写入失败 dist={distributor_id} type={log_type} amount={amount}: {e}", flush=True)
            return False

    def distributor_has_log(self, distributor_id, log_type, order_no="", batch_no=""):
        ph = _ph()
        if order_no:
            return bool(self.fetchone(
                f"SELECT id FROM distributor_balance_logs WHERE distributor_id = {ph} AND type = {ph} AND order_no = {ph} LIMIT 1",
                (int(distributor_id), log_type, order_no)))
        if batch_no:
            return bool(self.fetchone(
                f"SELECT id FROM distributor_balance_logs WHERE distributor_id = {ph} AND type = {ph} AND batch_no = {ph} LIMIT 1",
                (int(distributor_id), log_type, batch_no)))
        return False

    def list_distributor_logs(self, distributor_id, page=1, page_size=20):
        ph = _ph()
        distributor_id = int(distributor_id or 0)
        total = int((self.fetchone(
            f"SELECT COUNT(*) cnt FROM distributor_balance_logs WHERE distributor_id = {ph}", (distributor_id,)) or {}).get("cnt") or 0)
        page_size = max(1, min(int(page_size or 20), 200))
        offset = (max(1, int(page or 1)) - 1) * page_size
        rows = self.fetchall(
            f"SELECT * FROM distributor_balance_logs WHERE distributor_id = {ph} ORDER BY id DESC LIMIT {ph} OFFSET {ph}",
            (distributor_id, page_size, offset)
        ) or []
        return {"total": total, "rows": rows}

    def adjust_distributor_balance(self, distributor_id, amount, operator="", remark=""):
        """管理员手工增减余额。正数入账；出账走余额守卫，绝不允许扣成负数。"""
        ph = _ph()
        try:
            amount = _dec(amount).quantize(CENT, rounding=ROUND_HALF_UP)
        except Exception:
            return False, "金额格式错误"
        if amount == 0:
            return False, "调整金额不能为 0"
        dist = self.get_distributor(distributor_id)
        if not dist:
            return False, "代理商不存在"
        if amount > 0:
            cur = self.execute(
                f"UPDATE distributors SET balance = balance + {ph} WHERE id = {ph}", (str(amount), int(dist["id"])))
        else:
            cur = self.execute(
                f"UPDATE distributors SET balance = balance + {ph} WHERE id = {ph} AND balance >= {ph}",
                (str(amount), int(dist["id"]), str(-amount))
            )
        if not cur or cur.rowcount == 0:
            return False, "余额不足"
        after = _dec((self.get_distributor(int(dist["id"])) or {}).get("balance"))
        self.distributor_add_log(int(dist["id"]), dist.get("username", ""), "adjust", amount, after,
                                 operator=operator, remark=remark or "管理员手工调整")
        return True, f"已调整 {amount} 元，当前余额 {after} 元"

    # ---------- 充值与提现 ----------
    RECHARGE_MAX = Decimal("20000")  # 单笔上限：挡手滑，也挡拿门户当免费收银台过账

    def distributor_recharge_plan(self, username, amount):
        """校验充值金额，返回一张内存合成套餐给既有下单通道。

        金额是代理商自己填的，不能做成 payment_plans 行——那张表 /api/payment/plans
        公开可见、任何登录用户都能拿 plan_id 买。照自有模型的做法造 plan：
        id=0、points/days 全 0，只有 price 有意义，而 price 就是稍后要入账的金额。
        """
        cfg = self._dist_cfg()
        try:
            amt = _dec(amount).quantize(CENT, rounding=ROUND_HALF_UP)
        except Exception:
            return False, "充值金额格式错误", None
        floor = _dec(cfg.get("min_recharge"), "50").quantize(CENT)
        if amt < floor:
            return False, "单次最低充值 %s 元" % floor, None
        if amt > self.RECHARGE_MAX:
            return False, "单次最多充值 %s 元" % self.RECHARGE_MAX.quantize(CENT), None
        dist = self.get_distributor_by_username(username)
        if not dist or str(dist.get("status")) != "approved":
            return False, "账号未通过审核或已被停用", None
        plan = {
            "id": 0, "name": "代理商余额充值", "plan_type": "dist_recharge",
            "price": float(amt), "points": 0, "days": 0, "enabled": True,
        }
        return True, "", plan

    def credit_distributor_recharge(self, order):
        """把一笔已核验的充值订单变成代理商余额。只在 apply_paid_order 抢占之后调用。"""
        ph = _ph()
        username = order.get("username") or ""
        dist = self.get_distributor_by_username(username)
        if not dist:
            return False, "代理商档案不存在"
        status = str(dist.get("status"))
        if status != "approved":
            return False, "代理商状态为 %s" % status
        amount = _dec(order.get("price"))
        if amount <= 0:
            return False, "订单金额异常"
        did = int(dist["id"])
        order_no = order.get("order_no") or ""
        if self.distributor_has_log(did, "recharge", order_no=order_no):
            return True, "该订单已入账"
        cur = self.execute(
            f"UPDATE distributors SET balance = balance + {ph}, recharge_total = recharge_total + {ph} "
            f"WHERE id = {ph}",
            (str(amount), str(amount), did)
        )
        if not cur or cur.rowcount == 0:
            return False, "余额入账失败"
        after = _dec((self.get_distributor(did) or {}).get("balance"))
        self.distributor_add_log(did, username, "recharge", amount, after, order_no=order_no,
                                 remark="自助充值，当前余额 %s 元" % after)
        return True, "已充值 %s 元" % amount

    def create_distributor_withdrawal(self, distributor_id, username, amount,
                                      pay_method, pay_account, qr_code=""):
        """提现：申请时就把钱划出余额，审核通过只是确认线下已打款。

        先扣款、后插单：插单撞 uk_open(distributor_id, open_flag) 说明已有一单在途，
        原路退回即可。反过来（先插单再扣款）在扣款失败时会留下一张挂着在途标记的
        空单，把后面所有提现都堵死。
        """
        ph = _ph()
        try:
            amt = _dec(amount).quantize(CENT, rounding=ROUND_HALF_UP)
        except Exception:
            return False, "提现金额格式错误", 0
        cfg = self._dist_cfg()
        if not cfg["withdraw_enabled"]:
            return False, "提现功能当前未开放，请联系管理员", 0
        floor = _dec(cfg.get("min_withdraw"), "50").quantize(CENT)
        if amt < floor:
            return False, "单次最低提现 %s 元" % floor, 0
        did = int(distributor_id or 0)
        dist = self.get_distributor(did)
        if not dist or str(dist.get("status")) != "approved":
            return False, "账号未通过审核或已被停用", 0
        cur = self.execute(
            f"UPDATE distributors SET balance = balance - {ph} WHERE id = {ph} AND status = 'approved' AND balance >= {ph}",
            (str(amt), did, str(amt))
        )
        if not cur or cur.rowcount == 0:
            return False, "余额不足（可提现余额 %s 元）" % _dec(dist.get("balance")).quantize(CENT), 0
        try:
            ins = self.execute(
                f"INSERT INTO distributor_withdrawals "
                f"(distributor_id, username, amount, pay_method, pay_account, qr_code_path, open_flag, status) "
                f"VALUES ({ph}, {ph}, {ph}, {ph}, {ph}, {ph}, 1, 'pending')",
                (did, username or "", str(amt), pay_method, pay_account, qr_code or "")
            )
        except pymysql.IntegrityError:
            back = self.execute(f"UPDATE distributors SET balance = balance + {ph} WHERE id = {ph}", (str(amt), did))
            if not back or back.rowcount == 0:
                print(f"[提现][ERROR] 在途冲突退款失败 dist={did} amount={amt}，需人工补回余额", flush=True)
            return False, "已有待审核提现，请等待处理", 0
        wid = int(getattr(ins, "lastrowid", 0) or 0)
        after = _dec((self.get_distributor(did) or {}).get("balance"))
        self.distributor_add_log(did, username or "", "withdraw", -amt, after, withdraw_id=wid,
                                 operator=username or "", remark="提现 %s 元至 %s" % (amt, pay_method))
        return True, "提现申请已提交，等待审核", wid

    def get_distributor_withdrawal(self, wid):
        ph = _ph()
        return self.fetchone(f"SELECT * FROM distributor_withdrawals WHERE id = {ph}", (int(wid or 0),))

    def list_distributor_withdrawals(self, distributor_id=0, status="", page=1, page_size=20):
        ph = _ph()
        where, params = [], []
        if int(distributor_id or 0):
            where.append(f"w.distributor_id = {ph}")
            params.append(int(distributor_id))
        if status in ("pending", "approved", "rejected"):
            where.append(f"w.status = {ph}")
            params.append(status)
        clause = ("WHERE " + " AND ".join(where)) if where else ""
        total = int((self.fetchone(
            f"SELECT COUNT(*) cnt FROM distributor_withdrawals w {clause}", tuple(params)) or {}).get("cnt") or 0)
        page_size = max(1, min(int(page_size or 20), 200))
        offset = (max(1, int(page or 1)) - 1) * page_size
        rows = self.fetchall(
            f"SELECT w.*, d.name AS dist_name FROM distributor_withdrawals w "
            f"LEFT JOIN distributors d ON d.username = w.username "
            f"{clause} ORDER BY w.id DESC LIMIT {ph} OFFSET {ph}",
            tuple(params) + (page_size, offset)
        ) or []
        return {"total": total, "rows": rows}

    def distributor_withdrawal_summary(self):
        row = self.fetchone(
            "SELECT COUNT(*) total, "
            "COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) pending_amount, "
            "COALESCE(SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END), 0) pending_count, "
            "COALESCE(SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END), 0) approved_amount "
            "FROM distributor_withdrawals", ())
        return {
            "total": int((row or {}).get("total") or 0),
            "pending_amount": _dec((row or {}).get("pending_amount")).quantize(CENT),
            "pending_count": int((row or {}).get("pending_count") or 0),
            "approved_amount": _dec((row or {}).get("approved_amount")).quantize(CENT),
        }

    def approve_distributor_withdrawal(self, wid, operator=""):
        """确认已打款。钱在申请时就离开余额了，这里只关单 + 累加「累计提现」。"""
        ph = _ph()
        row = self.get_distributor_withdrawal(wid)
        if not row:
            return False, "提现单不存在"
        cur = self.execute(
            f"UPDATE distributor_withdrawals SET status = 'approved', open_flag = NULL, reviewed_by = {ph}, "
            f"reviewed_at = CURRENT_TIMESTAMP WHERE id = {ph} AND status = 'pending'",
            (str(operator or "")[:50], int(wid))
        )
        if not cur or cur.rowcount == 0:
            return False, "该提现单已被处理"
        amount = _dec(row.get("amount")).quantize(CENT)
        acc = self.execute(f"UPDATE distributors SET withdraw_total = withdraw_total + {ph} WHERE id = {ph}",
                           (str(amount), int(row.get("distributor_id") or 0)))
        if not acc or acc.rowcount == 0:
            print(f"[提现] 关单成功但累计提现未累加 wid={wid} dist={row.get('distributor_id')} "
                  f"amount={amount}，需人工核对", flush=True)
        return True, "已通过，请线下打款 %s 元" % amount

    def reject_distributor_withdrawal(self, wid, reason="", operator=""):
        ph = _ph()
        row = self.get_distributor_withdrawal(wid)
        if not row:
            return False, "提现单不存在"
        # 抢占只认这条 UPDATE 的 rowcount：先读后改会让两个管理员各退一次钱
        cur = self.execute(
            f"UPDATE distributor_withdrawals SET status = 'rejected', open_flag = NULL, reject_reason = {ph}, "
            f"reviewed_by = {ph}, reviewed_at = CURRENT_TIMESTAMP WHERE id = {ph} AND status = 'pending'",
            (str(reason or "")[:255], str(operator or "")[:50], int(wid))
        )
        if not cur or cur.rowcount == 0:
            return False, "该提现单已被处理"
        amount = _dec(row.get("amount")).quantize(CENT)
        did = int(row.get("distributor_id") or 0)
        back = self.execute(f"UPDATE distributors SET balance = balance + {ph} WHERE id = {ph}", (str(amount), did))
        if not back or back.rowcount == 0:
            # 单子已判 rejected 但钱没退回余额，只有人工补；静默返回 True 会把漏洞藏起来
            print(f"[提现][ERROR] 驳回退款失败 withdrawal={wid} dist={did} "
                  f"amount={amount}，需人工补回余额", flush=True)
            return True, "已驳回，但退款未入账，请人工补回余额"
        after = _dec((self.get_distributor(did) or {}).get("balance"))
        self.distributor_add_log(did, row.get("username") or "", "withdraw_reject", amount, after,
                                 withdraw_id=int(wid), operator=operator or "",
                                 remark=str(reason or "")[:255] or "提现驳回退回")
        return True, "已驳回，%s 元已退回余额" % amount

    # ---------- 卡密模板 ----------
    def list_distributor_templates(self, only_enabled=False, discount_rate=None):
        """模板列表；给了折扣率就顺带算出单张结算价，门户与后台直接展示。"""
        rows = self.fetchall(
            "SELECT * FROM distributor_templates" + (" WHERE enabled = 1" if only_enabled else "") +
            " ORDER BY sort_order ASC, id ASC"
        ) or []
        cfg = self._dist_cfg()
        if discount_rate is None:
            discount_rate = cfg["default_discount"]
        out = []
        for tpl in rows:
            per_card, base, qty, err = self._dist_tpl_price(tpl, discount_rate, cfg)
            item = dict(tpl)
            item["base_price"] = str(base)
            item["quantity"] = qty
            item["unit_settle"] = str(per_card) if per_card else ""
            item["price_error"] = err or ""
            out.append(item)
        return out

    def get_distributor_template(self, template_id):
        ph = _ph()
        return self.fetchone(f"SELECT * FROM distributor_templates WHERE id = {ph}", (int(template_id or 0),))

    def save_distributor_template(self, data=None, operator=""):
        """新增/修改模板：面额自洽校验 + 计价 dry-run，两个管理员改不动坏配置。"""
        ph = _ph()
        data = data or {}
        template_id = int(data.get("id") or 0)
        name = str(data.get("name") or "").strip()
        price_type = str(data.get("price_type") or "points").strip()
        points = int(data.get("points") or 0)
        days = int(data.get("days") or 0)
        prefix = str(data.get("code_prefix") or "FX").strip().upper()
        if len(name) < 2:
            return False, "模板名称至少 2 个字"
        if price_type not in ("points", "monthly"):
            return False, "计价方式只能是题数或包月"
        if price_type == "points":
            if points <= 0:
                return False, "题数模板必须填写题数"
            if days:
                return False, "题数模板不能同时填写天数"
        else:
            if days <= 0:
                return False, "包月模板必须填写天数"
            if points:
                return False, "包月模板不能同时填空题数"
        if len(prefix) != self.DIST_PREFIX_LEN or not prefix.isalnum():
            return False, f"卡密前缀必须是 {self.DIST_PREFIX_LEN} 位字母或数字（卡密总长固定 {self.DIST_CODE_LEN}）"
        err = self.validate_distributor_pricing(
            templates=[{"name": name, "price_type": price_type, "points": points, "days": days}])
        if err:
            return False, err
        enabled = 0 if str(data.get("enabled", 1)).strip().lower() in ("0", "", "false", "none") else 1
        if self.fetchone(f"SELECT id FROM distributor_templates WHERE name = {ph} AND id <> {ph}", (name, template_id)):
            return False, "已存在同名模板"
        sort_order = int(data.get("sort_order") or 0)
        remark = str(data.get("remark") or "").strip()[:255]
        try:
            if template_id:
                self.execute(
                    f"UPDATE distributor_templates SET name = {ph}, price_type = {ph}, points = {ph}, days = {ph}, "
                    f"code_prefix = {ph}, enabled = {ph}, sort_order = {ph}, remark = {ph} WHERE id = {ph}",
                    (name, price_type, points, days, prefix, enabled, sort_order, remark, template_id)
                )
            else:
                self.execute(
                    f"""INSERT INTO distributor_templates
                        (name, price_type, points, days, code_prefix, enabled, sort_order, remark)
                        VALUES ({ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph})""",
                    (name, price_type, points, days, prefix, enabled, sort_order, remark)
                )
        except Exception as e:
            return False, f"保存失败：{e}"
        return True, "模板已保存"

    def toggle_distributor_template(self, template_id, enabled):
        ph = _ph()
        if not self.get_distributor_template(template_id):
            return False, "模板不存在"
        self.execute(
            f"UPDATE distributor_templates SET enabled = {ph} WHERE id = {ph}",
            (1 if enabled else 0, int(template_id or 0))
        )
        return True, "已启用" if enabled else "已停用"

    def delete_distributor_template(self, template_id):
        """已发卡模板只能停用：删掉会让历史批次失去参照。"""
        ph = _ph()
        template_id = int(template_id or 0)
        used = int((self.fetchone(
            f"SELECT COUNT(*) cnt FROM card_keys WHERE template_id = {ph}", (template_id,)) or {}).get("cnt") or 0)
        if used:
            return False, f"该模板已生成 {used} 张卡密，只能停用不能删除"
        self.execute(f"DELETE FROM distributor_templates WHERE id = {ph}", (template_id,))
        return True, "已删除"

    # ---------- 生成与对账 ----------
    def _make_card_codes(self, prefix, count):
        """生成 count 个互不重复卡密：定长前缀 + 随机字符补齐到 DIST_CODE_LEN。"""
        import secrets
        import string
        prefix = (prefix or "XS").strip().upper()[:self.DIST_CODE_LEN - 1]
        rand_len = self.DIST_CODE_LEN - len(prefix)
        alphabet = string.ascii_uppercase + string.digits
        codes, seen = [], set()
        while len(codes) < count:
            code = prefix + "".join(secrets.choice(alphabet) for _ in range(rand_len))
            if code in seen:
                continue
            seen.add(code)
            codes.append(code)
        return codes

    def _dist_batch_no(self):
        """批次号。刻意不用内置 hash()：str 的 hash 每进程随机化，编号事后无法复原。"""
        import secrets
        return f"FXG{int(time.time() * 1000)}{secrets.token_hex(2)}"

    def distributor_today_card_count(self, distributor_id):
        ph = _ph()
        row = self.fetchone(
            f"SELECT COALESCE(SUM(card_count), 0) cnt FROM distributor_batches "
            f"WHERE distributor_id = {ph} AND status <> 'failed' AND created_at >= CURDATE()",
            (int(distributor_id),)
        )
        return int((row or {}).get("cnt") or 0)

    def distributor_price_quote(self, distributor_id, template_id, count, cfg=None):
        """报价（只读，不动钱）。返回 (ok, msg, data)。"""
        ph = _ph()
        cfg = cfg or self._dist_cfg()
        try:
            count = int(count)
        except Exception:
            return False, "张数必须是整数", None
        dist = self.get_distributor(distributor_id)
        if not dist:
            return False, "代理商不存在", None
        tpl = self.get_distributor_template(template_id)
        if not tpl:
            return False, "模板不存在", None
        if not int(tpl.get("enabled") or 0):
            return False, "该模板已停用，不能生成卡密", None
        if count < 1:
            return False, "至少生成 1 张", None
        if count > cfg["max_batch"]:
            return False, f"单次最多生成 {cfg['max_batch']} 张", None
        per_card, base, qty, err = self._dist_tpl_price(tpl, _dec(dist.get("discount_rate"), "1"), cfg)
        if err:
            return False, err, None
        settle = per_card * count
        balance = _dec(dist.get("balance"))
        return True, None, {
            "distributor_id": int(dist["id"]),
            "username": dist.get("username") or "",
            "status": dist.get("status") or "",
            "discount_rate": str(_dec(dist.get("discount_rate"), "1")),
            "template_id": int(tpl["id"]),
            "template_name": tpl.get("name") or "",
            "price_type": tpl.get("price_type") or "points",
            "quantity": qty,
            "base_price": str(base),
            "unit_settle": str(per_card),
            "count": count,
            "settle_amount": str(settle),
            "balance": str(balance),
            "balance_after": str(balance - settle),
            "enough": balance >= settle,
        }

    def _dist_insert_cards(self, codes, batch_id, distributor_id, tpl, unit_settle, created_by):
        """一条多行 INSERT 落全部卡密。

        单条语句在 InnoDB 里天然原子：撞 UNIQUE 就整条失败、零行残留，
        不会像逐张插入那样中途 abort 留下半批。
        """
        ph = _ph()
        monthly = (tpl.get("price_type") or "points") == "monthly"
        row = f"({', '.join([ph] * 12)})"
        params = []
        for code in codes:
            params += [
                code, 0, "unused", created_by[:50], "distributor",
                int(distributor_id), int(batch_id), int(tpl.get("id") or 0), str(unit_settle),
                "monthly" if monthly else "points",
                0 if monthly else int(tpl.get("points") or 0),
                int(tpl.get("days") or 0) if monthly else 0,
            ]
        self.execute(
            "INSERT INTO card_keys (code, plan_id, status, created_by, source, distributor_id, batch_id, "
            "template_id, settle_amount, grant_type, grant_points, grant_days) VALUES " +
            ", ".join([row] * len(codes)),
            tuple(params)
        )

    def _dist_refund(self, distributor_id, amount, batch_id, batch_no, operator, reason):
        """生成失败时把已扣的钱退回。

        先用批次行的 pending→failed 抢占作为「谁负责退钱」的唯一裁决，
        输的一方直接返回，避免与对账器各退一次。
        """
        ph = _ph()
        amount = _dec(amount)
        cur = self.execute(
            f"UPDATE distributor_batches SET status = 'failed', error_note = {ph} WHERE id = {ph} AND status = 'pending'",
            (str(reason)[:255], int(batch_id))
        )
        if not cur or cur.rowcount == 0:
            print(f"[分销退款] 批次 {batch_no} 已被他方处理，跳过退款", flush=True)
            return False
        self.execute(
            f"UPDATE distributors SET balance = balance + {ph}, spent_total = GREATEST(0, spent_total - {ph}) WHERE id = {ph}",
            (str(amount), str(amount), int(distributor_id))
        )
        dist = self.get_distributor(distributor_id) or {}
        # 扣款和退款都要留在流水里。只记退款那一条，「流水合计 vs 余额」会永久差一笔，
        # 对账告警于是每次都空响，管理员学会忽略它就真出事。
        now_balance = _dec(dist.get("balance"))
        if not self.distributor_has_log(int(distributor_id), "generate", batch_no=batch_no):
            self.distributor_add_log(int(distributor_id), dist.get("username", ""), "generate", -amount,
                                     now_balance - amount, batch_no=batch_no, operator=operator,
                                     remark="补记本批扣款（生成未成功）")
        self.distributor_add_log(int(distributor_id), dist.get("username", ""), "refund", amount,
                                 now_balance, batch_no=batch_no, operator=operator, remark=reason)
        return True

    def distributor_generate_cards(self, distributor_id, template_id, count, operator=""):
        """批量生成卡密并扣款。返回 (ok, msg, data)。

        顺序固定：报价校验 → pending 意图行 → 条件扣款 → 单条多行 INSERT → 批次收敛。
        Database.execute() 每次调用都新建并关闭连接，BEGIN/COMMIT 跨调用彻底无效，
        所以「单条条件 UPDATE + rowcount」是全系统唯一可信的串行点。
        """
        import pymysql
        ph = _ph()
        cfg = self._dist_cfg()
        if not cfg["enabled"] or not cfg["generate_enabled"]:
            return False, "分销渠道未开放生成卡密", None
        ok, msg, quote = self.distributor_price_quote(distributor_id, template_id, count, cfg)
        if not ok:
            return False, msg, None
        if quote["status"] != "approved":
            return False, "账号未通过审核或已被停用", None
        if not quote["enough"]:
            return False, f"余额不足：本批需 {quote['settle_amount']} 元，当前余额 {quote['balance']} 元", None
        distributor_id = quote["distributor_id"]
        settle = _dec(quote["settle_amount"])
        per_card = _dec(quote["unit_settle"])
        tpl = self.get_distributor_template(template_id)
        prefix = str(tpl.get("code_prefix") or "").strip().upper()
        if len(prefix) != self.DIST_PREFIX_LEN:
            return False, "模板卡密前缀非法，请联系管理员修正", None
        if cfg["daily_card_max"] > 0:
            today = self.distributor_today_card_count(distributor_id)
            if today + int(count) > cfg["daily_card_max"]:
                return False, f"今日已生成 {today} 张，再生成 {count} 张将超出每日上限 {cfg['daily_card_max']} 张", None

        batch_no = self._dist_batch_no()
        cur = self.execute(
            f"""INSERT INTO distributor_batches
                (batch_no, distributor_id, username, template_id, template_name, price_type, points, days,
                 card_count, base_price, discount_rate, unit_settle, settle_amount, status, created_by)
                VALUES ({ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, 'pending', {ph})""",
            (batch_no, distributor_id, quote["username"], int(tpl["id"]), quote["template_name"],
             quote["price_type"], int(tpl.get("points") or 0), int(tpl.get("days") or 0), int(count),
             quote["base_price"], quote["discount_rate"], str(per_card), str(settle), operator)
        )
        batch_id = int(getattr(cur, "lastrowid", 0) or 0)
        if not batch_id:
            return False, "批次登记失败，未扣款", None

        # 唯一原子扣款：余额不足、账号被停用、并发抢扣，全部由这一条语句挡下
        cur = self.execute(
            f"UPDATE distributors SET balance = balance - {ph}, spent_total = spent_total + {ph} "
            f"WHERE id = {ph} AND status = 'approved' AND balance >= {ph}",
            (str(settle), str(settle), distributor_id, str(settle))
        )
        if not cur or cur.rowcount == 0:
            self.execute(
                f"UPDATE distributor_batches SET status = 'failed', error_note = '扣款未生效（余额不足或状态变化）' "
                f"WHERE id = {ph} AND status = 'pending'", (batch_id,)
            )
            return False, "余额不足或账号状态已变化，本批未扣款", None
        balance_after = _dec((self.get_distributor(distributor_id) or {}).get("balance"))

        created_by = f"fx:{quote['username']}"
        codes = []
        for _attempt in range(3):
            codes = self._make_card_codes(prefix, int(count))
            try:
                self._dist_insert_cards(codes, batch_id, distributor_id, tpl, per_card, created_by)
                break
            except pymysql.IntegrityError:
                continue
            except Exception as e:
                refunded = self._dist_refund(distributor_id, settle, batch_id, batch_no, operator, f"生成失败：{str(e)[:120]}")
                return False, ("生成失败，已退回余额" if refunded else "生成失败，退款已由对账接管，请稍后核对余额"), None
        else:
            refunded = self._dist_refund(distributor_id, settle, batch_id, batch_no, operator, "卡密重复，生成失败")
            return False, ("卡密撞号导致生成失败，已退回余额，请重试" if refunded else "卡密撞号导致生成失败，退款已由对账接管，请稍后核对余额"), None

        cur = self.execute(
            f"UPDATE distributor_batches SET status = 'generated' WHERE id = {ph} AND status = 'pending'", (batch_id,)
        )
        if not cur or cur.rowcount == 0:
            # 卡已在库、钱已扣，是一致状态；对账器按「卡数满额」把批次补成 generated，
            # 此处绝不能退款，否则就是白送卡密。只大声报错。
            print(f"[分销生成] 批次 {batch_no} 状态被对账器改写，请人工核对（卡已生成 {count} 张）", flush=True)
        self.distributor_add_log(distributor_id, quote["username"], "generate", -settle, balance_after,
                                 batch_no=batch_no, operator=operator,
                                 remark=f"{quote['template_name']}×{count}")
        return True, f"已生成 {count} 张，扣款 {settle} 元", {
            "batch_no": batch_no,
            "batch_id": batch_id,
            "codes": codes,
            "count": int(count),
            "unit_settle": str(per_card),
            "settle_amount": str(settle),
            "balance_after": str(balance_after),
        }

    def reconcile_distributor_batches(self, stale_minutes=5):
        """收敛崩溃残留的 pending 批次。判定依据只有「批次下真实卡数」。

        由后台线程定时调用，不在启动时跑；退款同样靠 pending→failed 的 rowcount 抢占，
        所以重复调用不会重复退钱。
        """
        ph = _ph()
        rows = self.fetchall(
            f"SELECT * FROM distributor_batches WHERE status = 'pending' "
            f"AND created_at < (NOW() - INTERVAL {ph} MINUTE) ORDER BY id ASC",
            (max(1, int(stale_minutes or 5)),)
        ) or []
        out = {"repaired": [], "refunded": [], "inconsistent": [], "backfilled": []}
        for batch in rows:
            batch_id = int(batch["id"])
            want = int(batch.get("card_count") or 0)
            have = int((self.fetchone(
                f"SELECT COUNT(*) cnt FROM card_keys WHERE batch_id = {ph}", (batch_id,)) or {}).get("cnt") or 0)
            if want > 0 and have >= want:
                # 钱已扣、卡已全：只是没来得及翻状态，补齐即可
                cur = self.execute(
                    f"UPDATE distributor_batches SET status = 'generated', error_note = {ph} "
                    f"WHERE id = {ph} AND status = 'pending'", ("对账补齐", batch_id))
                if cur and cur.rowcount:
                    out["repaired"].append(batch["batch_no"])
                    if not self.distributor_has_log(batch["distributor_id"], "generate", batch_no=batch["batch_no"]):
                        dist = self.get_distributor(batch["distributor_id"]) or {}
                        self.distributor_add_log(int(batch["distributor_id"]), dist.get("username", ""), "generate",
                                                 -_dec(batch.get("settle_amount")), _dec(dist.get("balance")),
                                                 batch_no=batch["batch_no"], operator="reconcile", remark="对账补记")
                continue
            if have == 0:
                # 抢占与退款都由 _dist_refund 的 pending→failed rowcount 单点裁决；
                # 这里先抢一次会让它抢不到自己，钱就静默留在已扣状态。
                if self._dist_refund(int(batch["distributor_id"]), _dec(batch.get("settle_amount")),
                                     batch_id, batch["batch_no"], "reconcile", "对账退回：无卡密"):
                    out["refunded"].append(batch["batch_no"])
                continue
            out["inconsistent"].append(batch["batch_no"])
            self.execute(
                f"UPDATE distributor_batches SET error_note = {ph} WHERE id = {ph} AND status = 'pending'",
                (f"数据不一致：应有 {want} 张，实有 {have} 张", batch_id)
            )
            print(f"[分销对账] 不一致批次 {batch['batch_no']}：期望 {want} 张，实际 {have} 张，需人工处理", flush=True)

        # 另一类残留：批次已经 generated、钱也扣了，但崩在第 5 步之前，流水没落下。
        # 不补记的话「流水合计 vs 余额」会一直对不上，而这个缺口只能靠对账器收。
        orphans = self.fetchall(
            f"SELECT b.* FROM distributor_batches b "
            f"LEFT JOIN distributor_balance_logs l ON l.distributor_id = b.distributor_id "
            f"AND l.type = 'generate' AND l.batch_no = b.batch_no "
            f"WHERE b.status = 'generated' AND l.id IS NULL "
            f"AND b.created_at > (NOW() - INTERVAL 7 DAY) ORDER BY b.id ASC LIMIT 200"
        ) or []
        for batch in orphans:
            dist = self.get_distributor(int(batch["distributor_id"])) or {}
            self.distributor_add_log(int(batch["distributor_id"]), dist.get("username", ""), "generate",
                                     -_dec(batch.get("settle_amount")), _dec(dist.get("balance")),
                                     batch_no=batch["batch_no"], operator="reconcile", remark="对账补记扣款")
            out["backfilled"].append(batch["batch_no"])
        if out["backfilled"]:
            print(f"[分销对账] 补记缺失扣款流水：{out['backfilled']}", flush=True)
        return out

    # ---------- 查询与概览 ----------
    def list_distributor_batches(self, distributor_id=0, page=1, page_size=20):
        ph = _ph()
        where, params = [], []
        if distributor_id:
            where.append(f"distributor_id = {ph}")
            params.append(int(distributor_id))
        where_sql = ("WHERE " + " AND ".join(where)) if where else ""
        total = int((self.fetchone(
            f"SELECT COUNT(*) cnt FROM distributor_batches {where_sql}", params) or {}).get("cnt") or 0)
        page_size = max(1, min(int(page_size or 20), 200))
        offset = (max(1, int(page or 1)) - 1) * page_size
        rows = self.fetchall(
            f"SELECT * FROM distributor_batches {where_sql} ORDER BY id DESC LIMIT {ph} OFFSET {ph}",
            params + [page_size, offset]
        ) or []
        return {"total": total, "rows": rows}

    def list_distributor_cards(self, distributor_id=0, status="", batch_no="", page=1, page_size=20):
        ph = _ph()
        where = [f"c.source = {ph}"]
        params = ["distributor"]
        if distributor_id:
            where.append(f"c.distributor_id = {ph}")
            params.append(int(distributor_id))
        if status:
            where.append(f"c.status = {ph}")
            params.append(status)
        if batch_no:
            where.append(f"c.batch_id = (SELECT id FROM distributor_batches WHERE batch_no = {ph})")
            params.append(batch_no)
        where_sql = "WHERE " + " AND ".join(where)
        total = int((self.fetchone(f"SELECT COUNT(*) cnt FROM card_keys c {where_sql}", params) or {}).get("cnt") or 0)
        page_size = max(1, min(int(page_size or 20), 500))
        offset = (max(1, int(page or 1)) - 1) * page_size
        rows = self.fetchall(
            f"SELECT c.*, b.batch_no, b.template_name FROM card_keys c "
            f"LEFT JOIN distributor_batches b ON c.batch_id = b.id {where_sql} "
            f"ORDER BY c.id DESC LIMIT {ph} OFFSET {ph}",
            params + [page_size, offset]
        ) or []
        return {"total": total, "rows": rows}

    def distributor_summary(self, distributor_id):
        """门户概览：余额、累计、未用卡密数、当日已生成、流水对账差额。"""
        ph = _ph()
        distributor_id = int(distributor_id or 0)
        dist = self.get_distributor(distributor_id)
        if not dist:
            return None
        stat = self.fetchone(
            f"SELECT "
            f"SUM(CASE WHEN status = 'unused' THEN 1 ELSE 0 END) unused_cnt, "
            f"SUM(CASE WHEN status = 'used' THEN 1 ELSE 0 END) used_cnt, "
            f"SUM(CASE WHEN status = 'unused' THEN grant_points ELSE 0 END) unused_points, "
            f"SUM(CASE WHEN status = 'unused' THEN grant_days ELSE 0 END) unused_days "
            f"FROM card_keys WHERE distributor_id = {ph} AND source = 'distributor'",
            (distributor_id,)
        ) or {}
        ledger = _dec((self.fetchone(
            f"SELECT COALESCE(SUM(amount), 0) s FROM distributor_balance_logs WHERE distributor_id = {ph}",
            (distributor_id,)) or {}).get("s"))
        balance = _dec(dist.get("balance"))
        return {
            "distributor": dist,
            "balance": str(balance),
            "unused_count": int(stat.get("unused_cnt") or 0),
            "used_count": int(stat.get("used_cnt") or 0),
            "unused_points": int(stat.get("unused_points") or 0),
            "unused_days": int(stat.get("unused_days") or 0),
            "today_cards": self.distributor_today_card_count(distributor_id),
            "ledger_sum": str(ledger),
            # 流水合计与余额对不上说明有旁路改钱，必须让后台看见
            "ledger_drift": str(balance - ledger),
        }

    # 门户只回这些列。distributors / card_keys 都是 SELECT * 读的，
    # 将来加内部字段（成本口径、风控备注）不会被顺手带给代理商。
    # 故意不含 id：前端拿不到代理商 ID，也就没有「把 id 传回来」这条越权路径。
    DIST_PORTAL_FIELDS = ("username", "name", "contact", "balance", "discount_rate", "status",
                          "support_note", "shop_url", "apply_reason", "audit_note", "reject_reason",
                          "recharge_total", "spent_total", "withdraw_total", "created_at")

    def distributor_portal_me(self, username):
        """门户 /api/distributor/me：白名单列 + 概览。pending/rejected 也要能渲染，所以不抛错。"""
        dist = self.get_distributor_by_username((username or "").strip())
        if not dist:
            return None
        me = {k: dist.get(k) for k in self.DIST_PORTAL_FIELDS}
        for money in ("balance", "recharge_total", "spent_total", "withdraw_total"):
            me[money] = str(_dec(me.get(money)))
        # 只给推导出来的渠道码，不给 id 本身：门户拿不到主键，就没有「把 id 传回来」这条路
        me["script_code"] = self.distributor_script_code(dist)
        return {"distributor": me, "summary": self.distributor_summary(int(dist["id"] or 0))}

    @staticmethod
    def distributor_script_code(dist):
        """纯净版水印里的渠道码。构建和门户展示共用这一处推导，免得两边数字对不上。"""
        return "D%d" % int((dist or {}).get("id") or 0)

    def distributor_portal_cfg(self):
        """门户可见的配置子集。基准单价不在其中：它只能从模板报价间接推出，
        单列一份等于多一个「以后不该暴露的东西」的出口。"""
        cfg = self._dist_cfg()
        return {
            "enabled": bool(cfg["enabled"]),
            "apply_enabled": bool(cfg["apply_enabled"]),
            "generate_enabled": bool(cfg["generate_enabled"]),
            "withdraw_enabled": bool(cfg["withdraw_enabled"]),
            "max_batch": cfg["max_batch"],
            "daily_card_max": cfg["daily_card_max"],
            "min_recharge": str(cfg["min_recharge"]),
            "min_withdraw": str(cfg["min_withdraw"]),
            "script_name": cfg["script_name"],
        }

    # ========== 卡密系统 ==========
    def generate_card_keys(self, plan_id, count=1, creator=""):
        ph = _ph()
        plan = self.get_payment_plan(plan_id)
        if not plan:
            return False, "套餐不存在"
        count = max(1, min(int(count or 1), 1000))
        codes = self._make_card_codes("XS", count)
        import pymysql
        # 单条多行 INSERT：逐张插入时中途撞号会留下半批已生成的卡。
        # 占位符个数必须和列数一致，少一个会让整条 INSERT 参数错位。
        row = f"({ph}, {ph}, {ph}, {ph})"
        try:
            self.execute(
                "INSERT INTO card_keys (code, plan_id, created_by, source) VALUES " + ", ".join([row] * count),
                tuple(v for code in codes for v in (code, plan_id, creator, "platform"))
            )
        except pymysql.IntegrityError:
            return False, "卡密生成失败（重复）"
        return True, f"已生成 {count} 张卡密"

    def list_card_keys(self, status="", plan_id=0, page=1, page_size=20, source=""):
        ph = _ph()
        where = []
        params = []
        if status:
            where.append(f"c.status = {ph}")
            params.append(status)
        if plan_id:
            where.append(f"c.plan_id = {ph}")
            params.append(plan_id)
        if source:
            where.append(f"c.source = {ph}")
            params.append(source)
        where_sql = ("WHERE " + " AND ".join(where)) if where else ""
        total = self.fetchone(f"SELECT COUNT(*) cnt FROM card_keys c {where_sql}", params)["cnt"]
        offset = (page - 1) * page_size
        # 分销卡 plan_id=0，只 join payment_plans 会显示成空套餐名，必须同时取批次/代理商名
        rows = self.fetchall(
            f"SELECT c.*, p.name plan_name, p.price, p.plan_type, b.template_name, b.batch_no, du.name distributor_name "
            f"FROM card_keys c "
            f"LEFT JOIN payment_plans p ON c.plan_id = p.id "
            f"LEFT JOIN distributor_batches b ON c.batch_id = b.id "
            f"LEFT JOIN distributors du ON c.distributor_id = du.id {where_sql} "
            f"ORDER BY c.id DESC LIMIT {ph} OFFSET {ph}",
            params + [page_size, offset]
        )
        return {"total": total, "rows": rows or []}

    def activate_card_key(self, code, username):
        """卡密激活。权益只读卡密行上的快照，绝不回查任何价目表。

        Database.execute() 每次调用独立开关连接，跨调用的 BEGIN/COMMIT 是彻底无效的 no-op，
        因此并发串行只靠「status='unused' 的 CAS + rowcount」，失败后用显式补偿回退。
        """
        ph = _ph()
        row = self.fetchone(f"SELECT * FROM card_keys WHERE code = {ph}", (code,))
        if not row:
            return False, "卡密不存在"
        if row["status"] != "unused":
            return False, "卡密已被使用"

        source = row.get("source") or "platform"
        is_fx = source == "distributor"
        plan_id = int(row.get("plan_id") or 0)

        if is_fx:
            me = self.get_distributor_by_username(username)
            if me and int(me.get("id") or 0) == int(row.get("distributor_id") or 0):
                return False, "不能兑换自己生成的卡密"
            batch = self.fetchone(
                f"SELECT template_name FROM distributor_batches WHERE id = {ph}",
                (int(row.get("batch_id") or 0),)
            ) or {}
            name = batch.get("template_name") or "卡密"
            plan_type = row.get("grant_type") or "points"
            points = int(row.get("grant_points") or 0)
            days = int(row.get("grant_days") or 0)
            # 代理卡的成交价是代理商与平台的私事，不进入面向终端用户的订单金额，
            # 也顺带让漏判的退款算成 ¥0。
            price = 0.00
        else:
            plan = self.get_payment_plan(plan_id)
            if not plan:
                return False, "关联套餐不存在"
            name = plan.get("name") or ""
            # 列名是 plan_type；原先读 plan.get("type") 恒为 None，包月卡一直掉进题数分支发 0 题
            plan_type = plan.get("plan_type") or "points"
            points = int(plan.get("points") or 0)
            days = int(plan.get("days") or 30)
            price = float(plan.get("price") or 0)

        # 订单号带毫秒才可能被 calculate_refund 精确归属；hash() 按进程随机化，故用 md5 前 4 位。
        # 历史 CAR 行的毫秒已丢失无法回填，那批继续走近似退款，不为它加启动迁移。
        order_no = f"CAR{int(time.time() * 1000)}{hashlib.md5(str(code).encode('utf-8')).hexdigest()[:4].upper()}"

        cur = self.execute(
            f"UPDATE card_keys SET status = 'used', used_by = {ph}, used_at = CURRENT_TIMESTAMP, "
            f"activated_order_no = {ph} WHERE id = {ph} AND status = 'unused'",
            (username, order_no, row["id"])
        )
        if not cur or cur.rowcount == 0:
            return False, "卡密已被使用"

        # 先落订单行：权益发放抛异常时才有对象可标 cancelled
        try:
            self.execute(
                f"""INSERT IGNORE INTO payment_orders (order_no, username, plan_id, plan_name, plan_type, price, points, days, status, pay_method, paid_at)
                    VALUES ({ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, 'paid', 'card', CURRENT_TIMESTAMP)""",
                (order_no, username, plan_id, name, plan_type, price, points, days)
            )
        except Exception as e:
            self._revert_card_activation(row["id"], username, order_no)
            return False, f"激活失败，卡密未消耗：{str(e)[:80]}"

        try:
            if plan_type == "monthly":
                ok, msg = self.extend_user_membership(username, days, f"卡密激活：{name}")
                if not ok:
                    raise RuntimeError(msg)
                # extend_user_membership 不写流水，包月这分支自己补一行
                self.execute(
                    f"INSERT INTO usage_logs (username, delta_points, balance_after, reason, question_hash, order_no) "
                    f"VALUES ({ph}, 0, 0, {ph}, {ph}, {ph})",
                    (username, f"卡密激活：{name}", "", order_no)
                )
            else:
                # 走统一入口：自动记流水、建批次，并把 order_no 传给 point_lots 以便按批次追溯
                ok, msg = self.adjust_user_points(
                    username, points, f"卡密激活：{name}", order_no=order_no, lot_source="card"
                )
                if not ok:
                    raise RuntimeError(msg)
        except Exception as e:
            self._revert_card_activation(row["id"], username, order_no)
            return False, f"激活失败，卡密未消耗：{str(e)[:80]}"

        if is_fx:
            dist = self.get_distributor(int(row.get("distributor_id") or 0)) or {}
            dist_username = dist.get("username") or ""
            # 渠道标记只用于选服务端提示文案，不参与权益/额度/计价；单向粘住，不覆盖人工纠正过的值
            self.execute(
                f"UPDATE users SET channel = 'distributor', channel_ref = {ph} "
                f"WHERE username = {ph} AND channel = 'platform'",
                (dist_username, username)
            )

        if price > 0 and not is_fx:
            admin = self.get_admin_config() or {}
            if int(admin.get("referral_enabled") or 0):
                self._settle_first_order_commission(username, f"card_{code}", price)
        return True, f"卡密激活成功，已获得「{name}」"

    def _revert_card_activation(self, card_id, username, order_no):
        """权益发放失败后的补偿：把卡放回未使用、合成订单作废。

        两条语句各自带条件守门，重放安全，不依赖事务。
        """
        ph = _ph()
        self.execute(
            f"UPDATE card_keys SET status = 'unused', used_by = '', used_at = NULL, activated_order_no = '' "
            f"WHERE id = {ph} AND status = 'used' AND used_by = {ph}",
            (card_id, username)
        )
        self.execute(
            f"UPDATE payment_orders SET status = 'cancelled' WHERE order_no = {ph} AND status = 'paid'",
            (order_no,)
        )

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

    def adjust_user_points(self, username, delta, reason="", question_hash="", order_no="", lot_source="order"):
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
            # 按 FIFO 消耗批次，记录本题实际扣的是哪笔订单的点数
            try:
                order_no = self._consume_lots(username, abs(delta)) or order_no
            except Exception as e:
                print(f"[批次] 消耗批次失败 user={username}: {e}", flush=True)
        else:
            new_balance = max(0, int(row.get("points_balance") or 0) + delta)
            self.execute(f"UPDATE users SET points_balance = points_balance + {ph} WHERE username = {ph}", (delta, username))
            # 充值/发放时建立批次（注册赠送来源不计入可退）
            if delta > 0:
                try:
                    self._create_point_lot(username, order_no, lot_source, delta)
                except Exception as e:
                    print(f"[批次] 建立批次失败 user={username}: {e}", flush=True)
        self.execute(
            f"INSERT INTO usage_logs (username, delta_points, balance_after, reason, question_hash, order_no) "
            f"VALUES ({ph}, {ph}, {ph}, {ph}, {ph}, {ph})",
            (username, delta, new_balance, reason, question_hash, order_no or "")
        )
        return True, new_balance

    # ==================== 同一用户同一道题只扣一次题数 ====================
    def claim_user_question(self, username, question_key):
        """登记「这个用户做过这道题」。

        返回 True  = 第一次做，需要扣点。
        返回 False = 之前做过，本次免费。

        并发安全靠唯一索引 + INSERT IGNORE：同一瞬间来两个相同请求，只有一个能插进去，
        另一个自然拿到 False。不需要额外加锁。
        """
        if not username or not question_key:
            return True   # 拿不到题目标识时按"没做过"处理：宁可扣点，也不能白送
        ph = _ph()
        cur = self.execute(
            f"INSERT IGNORE INTO user_question_history (username, question_key, ask_count, charged_count) "
            f"VALUES ({ph}, {ph}, 1, 0)", (username, question_key)
        )
        return bool(cur and cur.rowcount > 0)

    def mark_question_charged(self, username, question_key):
        """扣点成功后调用，记录这道题确实收过钱（包月用户不调用，他们没扣点）"""
        if not username or not question_key:
            return
        ph = _ph()
        self.execute(
            f"UPDATE user_question_history SET charged_count = charged_count + 1 "
            f"WHERE username = {ph} AND question_key = {ph}", (username, question_key)
        )

    def touch_user_question(self, username, question_key):
        """做过的题又被问了一次：只累加被问次数，便于后台看重复情况"""
        if not username or not question_key:
            return
        ph = _ph()
        self.execute(
            f"UPDATE user_question_history SET ask_count = ask_count + 1 "
            f"WHERE username = {ph} AND question_key = {ph}", (username, question_key)
        )

    def release_user_question(self, username, question_key):
        """扣点失败（余额不足等）时撤回登记，避免「没收钱却算他做过」白送一道题。

        只删 charged_count = 0 的行 —— 已付过费的记录不能被删掉。
        """
        if not username or not question_key:
            return
        ph = _ph()
        self.execute(
            f"DELETE FROM user_question_history WHERE username = {ph} AND question_key = {ph} "
            f"AND charged_count = 0", (username, question_key)
        )

    def count_user_questions(self, username):
        """这个用户做过多少道不同的题（后台用户画像用）"""
        ph = _ph()
        row = self.fetchone(
            f"SELECT COUNT(*) AS c FROM user_question_history WHERE username = {ph}", (username,)
        )
        return int(row.get("c") or 0) if row else 0

    def _create_point_lot(self, username, order_no, source, points):
        """建立题数批次（充值/发放时调用）"""
        ph = _ph()
        points = int(points or 0)
        if points <= 0:
            return
        self.execute(
            f"INSERT INTO point_lots (username, order_no, source, total_points, used_points) "
            f"VALUES ({ph}, {ph}, {ph}, {ph}, 0)",
            (username, order_no or "", source or "other", points)
        )

    def _consume_lots(self, username, points):
        """按 FIFO 消耗批次，返回本次实际消耗的批次订单号（无法归属则返回空串）"""
        ph = _ph()
        points = int(points or 0)
        if points <= 0:
            return ""
        remain = points
        last_order_no = ""
        lots = self.fetchall(
            f"SELECT id, order_no, total_points, used_points FROM point_lots "
            f"WHERE username = {ph} AND used_points < total_points ORDER BY id ASC",
            (username,)
        ) or []
        for lot in lots:
            if remain <= 0:
                break
            avail = int(lot["total_points"] or 0) - int(lot["used_points"] or 0)
            if avail <= 0:
                continue
            take = min(avail, remain)
            self.execute(
                f"UPDATE point_lots SET used_points = used_points + {ph} WHERE id = {ph}",
                (take, lot["id"])
            )
            remain -= take
            last_order_no = lot["order_no"] or last_order_no
        return last_order_no

    def get_order_remaining_points(self, order_no):
        """某订单批次尚未消耗的题数；无批次记录时返回 None（调用方回退旧口径）"""
        ph = _ph()
        row = self.fetchone(
            f"SELECT COALESCE(SUM(total_points - used_points), 0) AS remain, COUNT(*) AS cnt "
            f"FROM point_lots WHERE order_no = {ph}",
            (order_no,)
        )
        if not row or int(row.get("cnt") or 0) == 0:
            return None
        return max(0, int(row.get("remain") or 0))

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

    def grant_custom_model_access(self, username, period="permanent"):
        """发放自有模型使用权限。period: monthly(自现有到期顺延30天) / permanent(永久)"""
        ph = _ph()
        row = self.get_user_entitlement(username)
        if not row:
            return False, "用户不存在"
        if period == "monthly":
            base = datetime.now()
            current = row.get("custom_model_until")
            try:
                if current:
                    current_dt = datetime.strptime(current.split(".")[0], "%Y-%m-%d %H:%M:%S") if isinstance(current, str) else current
                    if current_dt > base:
                        base = current_dt
            except Exception:
                pass
            until = base + timedelta(days=30)
        else:
            until = datetime(2099, 12, 31, 23, 59, 59)
        self.execute(f"UPDATE users SET custom_model_until = {ph} WHERE username = {ph}", (until, username))
        return True, until

    def get_custom_model_config(self):
        """读取自有模型开关与定价配置"""
        admin = self.get_admin_config() or {}
        enabled = bool(admin.get("custom_model_enabled"))
        price = float(admin.get("custom_model_price") or 0)
        period = (admin.get("custom_model_period") or "permanent").strip() or "permanent"
        return {"enabled": enabled, "price": price, "period": period}

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

    def list_payment_orders_admin(self, username="", status="", plan_name="", pay_method="", date_from="", date_to="", order_no="", sort="created_at", order="desc", page=1, page_size=20):
        """管理员支付明细查询，包含闲鱼订单"""
        ph = _ph()
        # 单号搜索：既支持整串粘贴，也支持只记得片段时模糊查找。
        # 转义 LIKE 通配符，免得用户输进来的 % 被当成通配符。
        _ono_like = ""
        if order_no:
            _ono_like = "%" + order_no.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%"
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
            if plan_name == "__custom_model__":
                po_where.append(f"po.plan_type = 'custom_model'")
            else:
                po_where.append(f"po.plan_name = {ph}")
                po_params.append(plan_name)
        if pay_method:
            if pay_method == "xianyu":
                po_where.append("1=0")
            else:
                po_where.append(f"po.pay_method = {ph}")
                po_params.append(pay_method)
        # 订单号/渠道单号：整串粘贴或片段模糊都能命中
        if order_no:
            po_where.append(f"(po.order_no LIKE {ph} OR po.channel_order_no LIKE {ph})")
            po_params.append(_ono_like)
            po_params.append(_ono_like)
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
            if plan_name == "__custom_model__":
                xy_where.append("1=0")
            else:
                xy_where.append(f"xo.plan_name = {ph}")
                xy_params.append(plan_name)
        if pay_method:
            if pay_method != "xianyu":
                xy_where.append("1=0")
        # 闲鱼订单也有订单号：按单号搜索时要一并列出来（它没有渠道单号）
        if order_no:
            xy_where.append(f"xo.order_no LIKE {ph}")
            xy_params.append(_ono_like)
        if date_from:
            xy_where.append(f"DATE(xo.created_at) >= {ph}")
            xy_params.append(date_from)
        if date_to:
            xy_where.append(f"DATE(xo.created_at) <= {ph}")
            xy_params.append(date_to)
        xy_where_sql = (" WHERE " + " AND ".join(xy_where)) if xy_where else ""

        allowed_sorts = {"created_at": "created_at", "price": "price", "username": "username", "status": "status", "order_no": "order_no", "id": "id", "client_ip": "client_ip"}
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
                        po.refund_amount, po.refund_detail,
                        po.bank_order_no, po.pay_type, po.business_type,
                        po.channel_order_no,
                        po.client_ip, po.client_ip_addr,
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
                        0 as refund_amount, '' as refund_detail,
                        '' as bank_order_no, '' as pay_type, '' as business_type,
                        '' as channel_order_no,
                        '' as client_ip, '' as client_ip_addr,
                        'xianyu' as source
                FROM xianyu_orders xo{xy_where_sql}
            ) combined ORDER BY {sort_field} {order_dir} LIMIT {int(page_size)} OFFSET {offset}
        """
        rows = self.fetchall(data_sql, po_params + xy_params) or []

        # 附带退款申请状态：订单仍是 paid 但用户已申请退款时，列表需要能看出来
        pay_order_nos = [r.get("order_no") for r in rows
                         if r.get("source") == "payment" and r.get("order_no")]
        if pay_order_nos:
            req_ph = ",".join([ph] * len(pay_order_nos))
            req_rows = self.fetchall(
                f"SELECT order_no, status FROM refund_requests "
                f"WHERE order_no IN ({req_ph}) ORDER BY id DESC",
                pay_order_nos
            ) or []
            req_map = {}
            for rr in req_rows:
                if rr["order_no"] not in req_map:
                    req_map[rr["order_no"]] = rr["status"]
            for r in rows:
                r["refund_request_status"] = req_map.get(r.get("order_no"), "")
        else:
            for r in rows:
                r.setdefault("refund_request_status", "")

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
            uname = username or item.get("username", "") or ""
            points, member_until = self._quota_snapshot(
                uname, item.get("points_balance"), item.get("member_until")
            )
            self.execute(
                f"""INSERT INTO script_event_logs
                    (username, event_type, level, message, page_url, course_id, task_id, client_ip, user_agent, extra_json, points_balance, member_until)
                    VALUES ({ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph})""",
                (
                    uname,
                    event_type,
                    level,
                    message,
                    page_url,
                    str(item.get("course_id", ""))[:100],
                    str(item.get("task_id", ""))[:100],
                    client_ip,
                    user_agent[:500],
                    extra,
                    points,
                    member_until,
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
            where.append(f"s.username = {ph}")
            params.append(username)
        if level:
            where.append(f"s.level = {ph}")
            params.append(level)
        if keyword:
            like = f"%{keyword}%"
            where.append(f"(s.message LIKE {ph} OR s.page_url LIKE {ph})")
            params.extend([like, like])
        if date_from:
            where.append(f"s.created_at >= {ph}")
            params.append(date_from)
        if date_to:
            where.append(f"s.created_at <= {ph}")
            params.append(date_to)
        sql = ("SELECT s.id, s.username, s.event_type, s.level, s.message, s.page_url, s.course_id, s.task_id, "
               "s.client_ip, s.extra_json, s.created_at, "
               "COALESCE(s.points_balance, u.points_balance) AS points_balance, "
               "COALESCE(s.member_until, u.member_until) AS member_until "
               "FROM script_event_logs s LEFT JOIN users u ON u.username = s.username")
        if where:
            sql += " WHERE " + " AND ".join(where)
        sql += " ORDER BY s.created_at DESC, s.id DESC"
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

    def list_answer_summaries(self, date_from="", date_to="", username="", limit=3000):
        """取「一卷一报」的答题小结原始行（event_type=answer_summary）。

        明细在 extra_json 里，MySQL 5.7 没有 JSON_TABLE，所以这里只限量取原文，
        聚合放到 backend 的 Python 里做；limit 是防止有人刷接口时把后台拖死。
        """
        ph = _ph()
        limit = min(max(int(limit or 3000), 1), 5000)
        where = [f"s.event_type = {ph}"]
        params = ["answer_summary"]
        if username:
            where.append(f"s.username = {ph}")
            params.append(username)
        if date_from:
            where.append(f"s.created_at >= {ph}")
            params.append(date_from)
        if date_to:
            where.append(f"s.created_at <= {ph}")
            params.append(date_to)
        sql = ("SELECT s.username, s.page_url, s.extra_json, s.created_at, u.channel, u.channel_ref "
               "FROM script_event_logs s LEFT JOIN users u ON u.username = s.username")
        sql += " WHERE " + " AND ".join(where)
        sql += f" ORDER BY s.created_at DESC, s.id DESC LIMIT {ph}"
        params.append(limit)
        return self.fetchall(sql, tuple(params))

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
                    "daily_token_limit": int(m.get("daily_token_limit", 0) or 0),
                    "total_token_limit": int(m.get("total_token_limit", 0) or 0),
                    "vision": bool(m.get("vision")),
                    # MySQL 给的是 date 对象，JSON 备份里给的是字符串，统一成 'YYYY-MM-DD' 或空串
                    "expire_date": str(m.get("expire_date") or "")[:10]
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
                    "models": _dedupe_model_items(models_map.get(key, []))
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
        # 先收敛重复模型、再整体校验到期日期：这个函数是「全删再全插」，
        # 中途抛错会留下一份被删了一半的模型配置，比保存失败严重得多。
        for provider_key, info in (data or {}).items():
            if not isinstance(info, dict):
                continue
            models = _dedupe_model_items(info.get("models") or [])
            info["models"] = models
            for model in models:
                _model_expire_date(model.get("expire_date"))
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
                        (provider_key, model_value, model_label, weight, daily_token_limit, total_token_limit, vision, expire_date, sort_order)
                        VALUES ({ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph})""",
                    (
                        provider_key,
                        model.get("value", ""),
                        model.get("label", ""),
                        int(model.get("weight", 100) or 100),
                        int(model.get("daily_token_limit", 0) or 0),
                        int(model.get("total_token_limit", 0) or 0),
                        1 if (model.get("vision") is True or model.get("vision") == 1 or str(model.get("vision")).lower() in ("1", "true", "yes", "on")) else 0,
                        _model_expire_date(model.get("expire_date")),
                        idx
                    )
                )

        # 兼容保留 JSON 备份表
        self.execute(f"UPDATE providers_config SET data = {ph} WHERE id = 1", (json.dumps(data, ensure_ascii=False),))

    # ==================== AI 调用日志 ====================
    def _quota_snapshot(self, username, points_balance=None, member_until=None):
        """取用户题数/包月到期快照。调用方可传入已算好的值；缺省字段再读库补齐。"""
        need_db = points_balance is None or member_until is None
        row = None
        uname = (username or "").strip()
        if need_db and uname:
            ph = _ph()
            row = self.fetchone(
                f"SELECT points_balance, member_until FROM users WHERE username = {ph}",
                (uname,),
            )
        if points_balance is None:
            points_balance = int(row.get("points_balance") or 0) if row else None
        else:
            points_balance = int(points_balance)
        if member_until is None:
            member_until = row.get("member_until") if row else None
        return points_balance, member_until

    def save_ai_call_log(self, log):
        ph = _ph()
        username = log.get("username", "") or ""
        points, member_until = self._quota_snapshot(
            username, log.get("points_balance"), log.get("member_until")
        )
        self.execute(
            f"""INSERT INTO ai_call_logs
                (provider_key, username, model, final_model, question, answer, status, error, duration_ms, client_ip, points_balance, member_until)
                VALUES ({ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph})""",
            (
                log.get("provider_key", ""),
                username,
                log.get("model", ""),
                log.get("final_model", ""),
                log.get("question", ""),
                log.get("answer", ""),
                log.get("status", "unknown"),
                log.get("error", ""),
                int(log.get("duration_ms") or 0),
                log.get("client_ip", ""),
                points,
                member_until,
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

    def get_model_token_usage_total(self):
        """获取所有模型的历史累计 token 消耗总额"""
        rows = self.fetchall(
            """SELECT model_name, SUM(total_tokens) AS total_tokens
               FROM model_token_usage
               GROUP BY model_name"""
        )
        return {r["model_name"]: int(r.get("total_tokens") or 0) for r in rows}

    def clear_model_token_usage(self, model_name):
        """清空指定模型的 token 用量（每日 + 历史总额归零，模型恢复可调用）"""
        ph = _ph()
        self.execute(f"DELETE FROM model_token_usage WHERE model_name = {ph}", (model_name,))

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

    def _build_ai_log_where(self, status="", model="", keyword="", date_from="", date_to="", source="", username=""):
        ph = _ph()
        where = []
        params = []
        if username:
            where.append(f"a.username = {ph}")
            params.append(username)
        if status:
            where.append(f"a.status = {ph}")
            params.append(status)
        if model:
            where.append(f"a.model = {ph}")
            params.append(model)
        if source == "custom":
            where.append(f"a.provider_key = {ph}")
            params.append("custom")
        elif source == "platform":
            where.append(f"(a.provider_key IS NULL OR a.provider_key <> {ph})")
            params.append("custom")
        if keyword:
            like = f"%{keyword}%"
            where.append(f"(a.question LIKE {ph} OR a.answer LIKE {ph} OR a.error LIKE {ph})")
            params.extend([like, like, like])
        if date_from:
            where.append(f"a.created_at >= {ph}")
            params.append(date_from)
        if date_to:
            where.append(f"a.created_at <= {ph}")
            params.append(date_to)
        return where, params

    def get_ai_call_logs(self, limit=100, status="", model="", keyword="", date_from="", date_to="", page=1, source="", username=""):
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
        where, params = self._build_ai_log_where(status, model, keyword, date_from, date_to, source, username)
        sql = ("SELECT a.id, a.provider_key, a.username, a.model, a.final_model, a.question, a.answer, a.status, a.error, "
               "a.duration_ms, a.client_ip, a.created_at, "
               "COALESCE(a.points_balance, u.points_balance) AS points_balance, "
               "COALESCE(a.member_until, u.member_until) AS member_until "
               "FROM ai_call_logs a LEFT JOIN users u ON u.username = a.username")
        if where:
            sql += " WHERE " + " AND ".join(where)
        sql += " ORDER BY id DESC"
        sql += f" LIMIT {ph} OFFSET {ph}"
        params.extend([limit, offset])
        return self.fetchall(sql, tuple(params))

    def count_ai_call_logs(self, status="", model="", keyword="", date_from="", date_to="", source="", username=""):
        where, params = self._build_ai_log_where(status, model, keyword, date_from, date_to, source, username)
        sql = "SELECT COUNT(*) AS total FROM ai_call_logs a"
        if where:
            sql += " WHERE " + " AND ".join(where)
        row = self.fetchone(sql, tuple(params))
        return int(row.get("total", 0) if row else 0)

    def get_qq_bot_logs(self, limit=50):
        """获取 QQ 频道机器人产生的调用日志（username='qq_bot'）"""
        ph = _ph()
        sql = ("SELECT id, provider_key, username, model, final_model, question, answer, status, error, "
               "duration_ms, client_ip, created_at FROM ai_call_logs "
               "WHERE username = 'qq_bot' ORDER BY id DESC LIMIT " + ph)
        try:
            return self.fetchall(sql, (limit,))
        except Exception as e:
            print(f"[QQ机器人日志] 查询失败: {e}", flush=True)
            return []

    def clear_ai_call_logs(self, status="", model="", keyword="", date_from="", date_to="", source="", username=""):
        where, params = self._build_ai_log_where(status, model, keyword, date_from, date_to, source, username)
        sql = "DELETE a FROM ai_call_logs a"
        if where:
            sql += " WHERE " + " AND ".join(where)
        self.execute(sql, tuple(params))

    # ==================== 题库调用日志 ====================
    def save_bank_call_log(self, log):
        ph = _ph()
        username = log.get("username", "") or ""
        points, member_until = self._quota_snapshot(
            username, log.get("points_balance"), log.get("member_until")
        )
        self.execute(
            f"""INSERT INTO bank_call_logs
                (username, question_hash, question_text, question_type, options_text,
                 matched, matched_hash, match_method, duration_ms, client_ip, points_balance, member_until)
                VALUES ({ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph})""",
            (
                username,
                log.get("question_hash", ""),
                log.get("question_text", ""),
                log.get("question_type", ""),
                log.get("options_text", ""),
                1 if log.get("matched") else 0,
                log.get("matched_hash", ""),
                log.get("match_method", ""),
                int(log.get("duration_ms") or 0),
                log.get("client_ip", ""),
                points,
                member_until,
            )
        )

    def _build_bank_log_where(self, matched="", keyword="", date_from="", date_to=""):
        ph = _ph()
        where = []
        params = []
        if matched:
            where.append(f"b.matched = {ph}")
            params.append(1 if matched in ("1", "true", "yes", "命中") else 0)
        if keyword:
            like = f"%{keyword}%"
            where.append(f"(b.question_text LIKE {ph} OR b.question_hash LIKE {ph} OR b.match_method LIKE {ph})")
            params.extend([like, like, like])
        if date_from:
            where.append(f"b.created_at >= {ph}")
            params.append(date_from)
        if date_to:
            where.append(f"b.created_at <= {ph}")
            params.append(date_to)
        return where, params

    def get_bank_call_logs(self, limit=100, matched="", keyword="", date_from="", date_to="", page=1):
        ph = _ph()
        try: limit = int(limit)
        except: limit = 100
        try: page = int(page)
        except: page = 1
        limit = max(1, min(limit, 200))
        page = max(1, page)
        offset = (page - 1) * limit
        where, params = self._build_bank_log_where(matched, keyword, date_from, date_to)
        sql = """SELECT b.id, b.username, b.question_hash, b.question_text, b.question_type, b.options_text,
                        b.matched, b.matched_hash, b.match_method, b.duration_ms, b.client_ip, b.created_at,
                        COALESCE(b.points_balance, u.points_balance) AS points_balance,
                        COALESCE(b.member_until, u.member_until) AS member_until
                 FROM bank_call_logs b
                 LEFT JOIN users u ON u.username = b.username"""
        if where:
            sql += " WHERE " + " AND ".join(where)
        sql += " ORDER BY id DESC"
        sql += f" LIMIT {ph} OFFSET {ph}"
        params.extend([limit, offset])
        return self.fetchall(sql, tuple(params))

    def count_bank_call_logs(self, matched="", keyword="", date_from="", date_to=""):
        where, params = self._build_bank_log_where(matched, keyword, date_from, date_to)
        sql = "SELECT COUNT(*) AS total FROM bank_call_logs b"
        if where:
            sql += " WHERE " + " AND ".join(where)
        row = self.fetchone(sql, tuple(params))
        return int(row.get("total", 0) if row else 0)

    def clear_bank_call_logs(self, matched="", keyword="", date_from="", date_to=""):
        where, params = self._build_bank_log_where(matched, keyword, date_from, date_to)
        sql = "DELETE b FROM bank_call_logs b"
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

    def get_question_bank_by_matching_key(self, matching_key):
        ph = _ph()
        rows = self.fetchall(
            f"SELECT * FROM question_bank WHERE matching_key = {ph} ORDER BY id ASC",
            (matching_key,)
        )
        return rows or []

    def get_question_bank_by_match_stem(self, match_stem):
        ph = _ph()
        rows = self.fetchall(
            f"SELECT * FROM question_bank WHERE match_stem = {ph} ORDER BY id ASC",
            (match_stem,)
        )
        return rows or []

    def search_question_bank(self, keyword="", question_hash="", limit=100, page=1, question_type="", is_image=None, source_model=""):
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
        if question_type:
            type_values = _question_type_values(question_type)
            if type_values:
                where.append(f"question_type IN ({','.join([ph] * len(type_values))})")
                params.extend(type_values)
            elif question_type != "_image_":
                where.append(f"question_type = {ph}")
                params.append(question_type)
        if is_image is not None and is_image != "":
            where.append(f"is_image = {ph}")
            params.append(1 if str(is_image) in ("1", "true", "图片", "__image__") else 0)
        if source_model:
            where.append(f"source_model = {ph}")
            params.append(source_model)
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

    def count_question_bank(self, keyword="", question_hash="", question_type="", is_image=None, source_model=""):
        ph = _ph()
        where = []
        params = []
        if question_hash:
            where.append(f"question_hash = {ph}")
            params.append(question_hash)
        if question_type:
            type_values = _question_type_values(question_type)
            if type_values:
                where.append(f"question_type IN ({','.join([ph] * len(type_values))})")
                params.extend(type_values)
            elif question_type != "_image_":
                where.append(f"question_type = {ph}")
                params.append(question_type)
        if is_image is not None and is_image != "":
            where.append(f"is_image = {ph}")
            params.append(1 if str(is_image) in ("1", "true", "图片", "__image__") else 0)
        if source_model:
            where.append(f"source_model = {ph}")
            params.append(source_model)
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

    def list_question_bank_models(self):
        """题库中出现过的来源模型及其题量，用于后台按模型筛选题库。"""
        try:
            rows = self.fetchall(
                "SELECT COALESCE(source_model,'') AS model, COUNT(*) AS cnt FROM question_bank "
                "GROUP BY COALESCE(source_model,'') ORDER BY cnt DESC, model ASC"
            )
            return [{"model": r.get("model") or "", "count": int(r.get("cnt") or 0)} for r in rows]
        except Exception as e:
            print(f"[题库模型列表] 查询失败: {e}", flush=True)
            return []

    def get_web_search_count(self, username):
        """获取用户今日首页免费搜题已用次数"""
        ph = _ph()
        row = self.fetchone(
            f"SELECT search_count FROM web_search_daily WHERE username = {ph} AND search_date = CURDATE()",
            (username,)
        )
        return int(row.get("search_count") or 0) if row else 0

    def increment_web_search_count(self, username):
        """用户今日首页免费搜题次数 +1，返回最新次数"""
        ph = _ph()
        self.execute(
            f"""INSERT INTO web_search_daily (username, search_date, search_count)
                VALUES ({ph}, CURDATE(), 1)
                ON DUPLICATE KEY UPDATE search_count = search_count + 1""",
            (username,)
        )
        return self.get_web_search_count(username)

    # ==================== 题库工具：个人题库 / 答案报错 ====================

    @staticmethod
    def private_item_hash(question, options=None):
        """个人题库的去重指纹：题面 + 排序后选项（忽略空白差异）。"""
        def _n(s):
            return "".join(str(s or "").split())
        payload = {"q": _n(question), "o": sorted(_n(o) for o in (options or []) if _n(o))}
        return hashlib.sha256(json.dumps(payload, ensure_ascii=False, sort_keys=True).encode("utf-8")).hexdigest()

    def add_user_bank_items(self, username, items, source="import"):
        """写入个人题库，同题（指纹相同）覆盖答案。返回 {added, updated, skipped}。"""
        added = updated = skipped = 0
        ph = _ph()
        for item in items or []:
            question = str((item or {}).get("question") or "").strip()
            answer = str((item or {}).get("answer") or "").strip()
            if not question or not answer:
                skipped += 1
                continue
            options = [str(o).strip() for o in (item.get("options") or []) if str(o).strip()]
            qtype = str(item.get("type") or "").strip()
            item_hash = self.private_item_hash(question, options)
            exists = self.fetchone(
                f"SELECT id FROM user_question_bank WHERE username = {ph} AND item_hash = {ph}",
                (username, item_hash)
            )
            try:
                if exists:
                    self.execute(
                        f"""UPDATE user_question_bank
                               SET answer = {ph}, question_type = {ph}, options_text = {ph}, source = {ph}
                             WHERE username = {ph} AND item_hash = {ph}""",
                        (answer, qtype, "|".join(options), source, username, item_hash)
                    )
                    updated += 1
                else:
                    self.execute(
                        f"""INSERT INTO user_question_bank
                               (username, item_hash, question_text, question_type, options_text, answer, source)
                            VALUES ({ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph})""",
                        (username, item_hash, question[:2000], qtype, "|".join(options), answer, source)
                    )
                    added += 1
            except Exception as e:
                print(f"[个人题库] 写入失败 user={username}: {e}", flush=True)
                skipped += 1
        return {"added": added, "updated": updated, "skipped": skipped}

    def list_user_bank(self, username, keyword="", page=1, limit=20):
        ph = _ph()
        try:
            limit = max(1, min(int(limit), 100))
        except Exception:
            limit = 20
        try:
            page = max(1, int(page))
        except Exception:
            page = 1
        where = [f"username = {ph}"]
        params = [username]
        kw = str(keyword or "").strip()
        if kw:
            where.append(f"(question_text LIKE {ph} OR answer LIKE {ph})")
            like = f"%{kw}%"
            params.extend([like, like])
        sql = ("SELECT id, question_text, question_type, options_text, answer, source, hit_count, created_at "
               "FROM user_question_bank WHERE " + " AND ".join(where) +
               f" ORDER BY id DESC LIMIT {ph} OFFSET {ph}")
        params.extend([limit, (page - 1) * limit])
        return self.fetchall(sql, tuple(params))

    def count_user_bank(self, username, keyword=""):
        ph = _ph()
        where = [f"username = {ph}"]
        params = [username]
        kw = str(keyword or "").strip()
        if kw:
            where.append(f"(question_text LIKE {ph} OR answer LIKE {ph})")
            like = f"%{kw}%"
            params.extend([like, like])
        row = self.fetchone("SELECT COUNT(*) AS c FROM user_question_bank WHERE " + " AND ".join(where), tuple(params))
        return int(row.get("c") or 0) if row else 0

    def search_user_bank(self, username, keyword, limit=20):
        """个人题库召回：LIKE 命中题面/答案，排序交给上层相似度重排。"""
        ph = _ph()
        kw = str(keyword or "").strip()
        if not kw:
            return []
        try:
            limit = max(1, min(int(limit), 100))
        except Exception:
            limit = 20
        sql = (f"SELECT id, question_text, question_type, options_text, answer, hit_count FROM user_question_bank "
               f"WHERE username = {ph} AND (question_text LIKE {ph} OR options_text LIKE {ph}) "
               f"ORDER BY id DESC LIMIT {limit}")
        like = f"%{kw[:200]}%"
        return self.fetchall(sql, (username, like, like))

    def delete_user_bank(self, username, ids=None, delete_all=False):
        ph = _ph()
        if delete_all:
            cur = self.execute(f"DELETE FROM user_question_bank WHERE username = {ph}", (username,))
            return int(getattr(cur, "rowcount", 0) or 0)
        clean = []
        for i in ids or []:
            try:
                clean.append(int(i))
            except Exception:
                continue
        if not clean:
            return 0
        marks = ",".join([ph] * len(clean))
        cur = self.execute(
            f"DELETE FROM user_question_bank WHERE username = {ph} AND id IN ({marks})",
            tuple([username] + clean)
        )
        return int(getattr(cur, "rowcount", 0) or 0)

    def touch_user_bank_hit(self, username, item_id):
        ph = _ph()
        try:
            self.execute(
                f"UPDATE user_question_bank SET hit_count = hit_count + 1 WHERE username = {ph} AND id = {ph}",
                (username, int(item_id))
            )
        except Exception:
            pass

    def add_answer_report(self, username, question_hash, question_text, answer_text, reason=""):
        """记录一次「答案有误」。同一题累计 2 次即降级公共题库答案。返回 (count, flagged)。"""
        ph = _ph()
        self.execute(
            f"""INSERT INTO question_answer_reports (username, question_hash, question_text, answer_text, reason)
                VALUES ({ph}, {ph}, {ph}, {ph}, {ph})""",
            (username, question_hash or "", str(question_text or "")[:2000], str(answer_text or "")[:2000], str(reason or "")[:200])
        )
        count = self.count_answer_reports(question_hash)
        flagged = False
        if question_hash and count >= 2:
            try:
                self.execute(
                    f"""INSERT INTO question_answer_flags (question_hash, report_count)
                        VALUES ({ph}, {ph})
                        ON DUPLICATE KEY UPDATE report_count = {ph}""",
                    (question_hash, count, count)
                )
                flagged = True
            except Exception as e:
                print(f"[答案上报] 降级标记失败 hash={question_hash[:12]}: {e}", flush=True)
        return count, flagged

    def get_flagged_question_hashes(self, limit=20000):
        """被上报有误而停用的题目指纹列表（供检索层过滤，量大也不该超过几千条）。"""
        try:
            rows = self.fetchall(
                f"SELECT question_hash FROM question_answer_flags ORDER BY updated_at DESC LIMIT {int(limit)}"
            )
            return [r.get("question_hash") for r in rows if r.get("question_hash")]
        except Exception as e:
            print(f"[答案上报] 读取标记失败: {e}", flush=True)
            return []

    def count_answer_reports(self, question_hash):
        ph = _ph()
        row = self.fetchone(
            f"SELECT COUNT(*) AS c FROM question_answer_reports WHERE question_hash = {ph}",
            (question_hash or "",)
        )
        return int(row.get("c") or 0) if row else 0

    def get_random_bank_questions(self, count=6):
        """从题库随机抽取有答案的题目，供首页展示"""
        try:
            count = int(count)
        except Exception:
            count = 6
        count = max(1, min(count, 12))
        sql = """SELECT question_hash, question_text, question_type, options_text, answer, hit_count
                 FROM question_bank
                 WHERE answer IS NOT NULL AND answer <> ''
                   AND CHAR_LENGTH(question_text) >= 6 AND CHAR_LENGTH(question_text) <= 300
                 ORDER BY RAND() LIMIT """ + str(count)
        return self.fetchall(sql)

    def get_question_bank_stats(self, new_from="", new_to=""):
        """题库分析：总题数、调用最多/最少、新加入占比、题型分布（按时间范围）"""
        ph = _ph()
        overview = {"total": 0, "hit_questions": 0, "never_hit": 0, "total_hits": 0, "new_questions": 0}
        try:
            # 总题目数：截至 new_to 当天的累计存量
            if new_to:
                row = self.fetchone(
                    f"SELECT COUNT(*) AS total FROM question_bank WHERE created_at < {ph}",
                    (new_to + " 23:59:59",)
                )
            else:
                row = self.fetchone("SELECT COUNT(*) AS total FROM question_bank")
            if row:
                overview["total"] = int(row.get("total") or 0)
            if new_from and new_to:
                nd = new_to + " 23:59:59"
                # 已调用题目：区间内被命中过的不同题目（库题 hash）
                row = self.fetchone(
                    f"SELECT COUNT(DISTINCT matched_hash) AS c FROM bank_call_logs WHERE matched = 1 AND matched_hash <> '' AND created_at >= {ph} AND created_at < {ph}",
                    (new_from, nd)
                )
                overview["hit_questions"] = int(row.get("c") or 0) if row else 0
                # 累计调用次数：区间内命中次数
                row = self.fetchone(
                    f"SELECT COUNT(*) AS c FROM bank_call_logs WHERE matched = 1 AND created_at >= {ph} AND created_at < {ph}",
                    (new_from, nd)
                )
                overview["total_hits"] = int(row.get("c") or 0) if row else 0
                # 新加入题目：区间内新增
                row = self.fetchone(
                    f"SELECT COUNT(*) AS c FROM question_bank WHERE created_at >= {ph} AND created_at < {ph}",
                    (new_from, nd)
                )
                overview["new_questions"] = int(row.get("c") or 0) if row else 0
                # 从未调用：截至 new_to 的存量中，区间内未被调用过的
                overview["never_hit"] = max(0, overview["total"] - overview["hit_questions"])
            else:
                row = self.fetchone("SELECT COUNT(*) AS c FROM question_bank WHERE hit_count > 0")
                overview["hit_questions"] = int(row.get("c") or 0) if row else 0
                row = self.fetchone("SELECT COALESCE(SUM(hit_count), 0) AS s FROM question_bank")
                overview["total_hits"] = int(row.get("s") or 0) if row else 0
                overview["never_hit"] = max(0, overview["total"] - overview["hit_questions"])
        except Exception as e:
            print(f"[题库分析] 概览统计失败: {e}", flush=True)
        top_list = self.fetchall(
            "SELECT question_hash, question_text, question_type, hit_count, last_used_at, created_at "
            "FROM question_bank ORDER BY hit_count DESC, id DESC LIMIT 10"
        ) or []
        least_list = self.fetchall(
            "SELECT question_hash, question_text, question_type, hit_count, last_used_at, created_at "
            "FROM question_bank WHERE hit_count > 0 ORDER BY hit_count ASC, id DESC LIMIT 10"
        ) or []
        never_list = self.fetchall(
            "SELECT question_hash, question_text, question_type, hit_count, created_at "
            "FROM question_bank WHERE hit_count = 0 ORDER BY id DESC LIMIT 10"
        ) or []
        type_rows = self.fetchall(
            "SELECT question_type, COUNT(*) AS c, COALESCE(SUM(hit_count), 0) AS hits "
            "FROM question_bank GROUP BY question_type"
        ) or []
        total = overview["total"] or 1
        agg = {}
        for r in type_rows:
            name = _normalize_question_type_name(r.get("question_type"))
            c = int(r.get("c") or 0)
            h = int(r.get("hits") or 0)
            item = agg.setdefault(name, {"count": 0, "hits": 0})
            item["count"] += c
            item["hits"] += h
        type_dist = [
            {
                "question_type": name,
                "count": item["count"],
                "hits": item["hits"],
                "percent": round(item["count"] * 100.0 / total, 1),
            }
            for name, item in sorted(agg.items(), key=lambda kv: kv[1]["count"], reverse=True)
        ]
        return {"overview": overview, "top_list": top_list, "least_list": least_list, "never_list": never_list, "type_dist": type_dist}

    def get_user_analysis(self, date_from="", date_to=""):
        """用户分析：新老用户、回归老用户、充值构成（payment_orders + 闲鱼订单）"""
        ph = _ph()
        result = {"overview": {}, "orders": {}, "returning_users": []}
        if not date_from:
            date_from = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
        if not date_to:
            date_to = datetime.now().strftime("%Y-%m-%d")
        try:
            row = self.fetchone("SELECT COUNT(*) AS total FROM users")
            total_users = int(row.get("total") or 0) if row else 0
            row = self.fetchone(
                f"SELECT COUNT(*) AS c FROM users WHERE DATE(created_at) >= {ph} AND DATE(created_at) <= {ph}",
                (date_from, date_to)
            )
            new_users = int(row.get("c") or 0) if row else 0
            row = self.fetchone(f"SELECT COUNT(*) AS c FROM users WHERE DATE(created_at) < {ph}", (date_from,))
            old_users = int(row.get("c") or 0) if row else 0
            row = self.fetchone(
                f"SELECT COUNT(*) AS c FROM users WHERE last_login_at IS NOT NULL AND DATE(last_login_at) >= {ph} AND DATE(last_login_at) <= {ph}",
                (date_from, date_to)
            )
            active_users = int(row.get("c") or 0) if row else 0
            row = self.fetchone(
                f"SELECT COUNT(*) AS c FROM users WHERE DATE(created_at) < {ph} AND last_login_at IS NOT NULL AND DATE(last_login_at) >= {ph} AND DATE(last_login_at) <= {ph}",
                (date_from, date_from, date_to)
            )
            returned_users = int(row.get("c") or 0) if row else 0
            result["overview"] = {
                "total_users": total_users,
                "new_users": new_users,
                "old_users": old_users,
                "active_users": active_users,
                "returned_users": returned_users,
                "new_rate": round(new_users * 100.0 / max(total_users, 1), 1),
                "returned_rate": round(returned_users * 100.0 / max(old_users, 1), 1),
                "active_rate": round(active_users * 100.0 / max(total_users, 1), 1),
                "returned_share_active": round(returned_users * 100.0 / max(active_users, 1), 1),
            }
        except Exception as e:
            print(f"[用户分析] 概览统计失败: {e}", flush=True)

        def _recharge_sql(from_sql, where_sql, params):
            return self.fetchone(
                f"SELECT COUNT(*) AS c, COALESCE(SUM(price), 0) AS amt FROM {from_sql} WHERE {where_sql}",
                tuple(params)
            ) or {}

        try:
            po_join = f"payment_orders po JOIN users u ON u.username = po.username"
            xy_join = f"xianyu_orders xo JOIN users u ON u.username = xo.username"
            po_w = f"po.status = {ph} AND DATE(po.created_at) >= {ph} AND DATE(po.created_at) <= {ph}"
            xy_w = f"xo.status = {ph} AND DATE(xo.created_at) >= {ph} AND DATE(xo.created_at) <= {ph}"
            r1 = _recharge_sql(po_join, po_w, ["paid", date_from, date_to])
            r2 = _recharge_sql(xy_join, xy_w, ["paid", date_from, date_to])
            total_orders = int(r1.get("c") or 0) + int(r2.get("c") or 0)
            total_amount = round(float(r1.get("amt") or 0) + float(r2.get("amt") or 0), 2)
            old_po_w = po_w + f" AND DATE(u.created_at) < {ph}"
            old_xy_w = xy_w + f" AND DATE(u.created_at) < {ph}"
            r1o = _recharge_sql(po_join, old_po_w, ["paid", date_from, date_to, date_from])
            r2o = _recharge_sql(xy_join, old_xy_w, ["paid", date_from, date_to, date_from])
            old_orders = int(r1o.get("c") or 0) + int(r2o.get("c") or 0)
            old_amount = round(float(r1o.get("amt") or 0) + float(r2o.get("amt") or 0), 2)
            result["orders"] = {
                "total_orders": total_orders,
                "total_amount": total_amount,
                "old_orders": old_orders,
                "old_amount": old_amount,
                "new_orders": total_orders - old_orders,
                "new_amount": round(total_amount - old_amount, 2),
                "old_order_rate": round(old_orders * 100.0 / max(total_orders, 1), 1),
                "old_amount_rate": round(old_amount * 100.0 / max(total_amount, 1), 1),
                "new_order_rate": round((total_orders - old_orders) * 100.0 / max(total_orders, 1), 1),
                "new_amount_rate": round((total_amount - old_amount) * 100.0 / max(total_amount, 1), 1),
            }
        except Exception as e:
            print(f"[用户分析] 充值统计失败: {e}", flush=True)

        # —— 自有模型使用统计 ——
        try:
            row = self.fetchone(
                f"""SELECT COUNT(DISTINCT username) AS users, COUNT(*) AS calls
                    FROM ai_call_logs
                    WHERE provider_key = {ph}
                      AND DATE(created_at) >= {ph} AND DATE(created_at) <= {ph}""",
                ("custom", date_from, date_to)
            ) or {}
            custom_users = int(row.get("users") or 0)
            custom_calls = int(row.get("calls") or 0)
            result["overview"]["custom_model_users"] = custom_users
            result["overview"]["custom_model_calls"] = custom_calls
            result["overview"]["custom_user_rate"] = round(custom_users * 100.0 / max(active_users, 1), 1)
            # 自有模型 TOP 用户
            result["custom_model_top_users"] = self.fetchall(
                f"""SELECT a.username, COUNT(*) AS calls,
                           u.created_at, u.last_login_at
                    FROM ai_call_logs a
                    LEFT JOIN users u ON u.username = a.username
                    WHERE a.provider_key = {ph}
                      AND DATE(a.created_at) >= {ph} AND DATE(a.created_at) <= {ph}
                    GROUP BY a.username ORDER BY calls DESC LIMIT 20""",
                ("custom", date_from, date_to)
            ) or []
        except Exception as e:
            print(f"[用户分析] 自有模型统计失败: {e}", flush=True)
            result["overview"]["custom_model_users"] = 0
            result["overview"]["custom_model_calls"] = 0
            result["overview"]["custom_user_rate"] = 0
            result["custom_model_top_users"] = []

        # —— 用户画像：地域分布（按注册地 / 按登录地）——
        # 注意：IP 归属地是「上线后才开始记录」的，老用户没有数据 —— 必须把覆盖率一起返回，
        # 否则用户看到总数只有几十会以为功能坏了。pct 以「已解析」为分母。
        try:
            def _geo_block(addr_col, time_col):
                where = (f"WHERE u.{time_col} IS NOT NULL "
                         f"AND DATE(u.{time_col}) >= {ph} AND DATE(u.{time_col}) <= {ph}")
                rows = self.fetchall(
                    f"SELECT u.{addr_col} AS addr, COUNT(*) AS c FROM users u {where} "
                    f"GROUP BY u.{addr_col}", (date_from, date_to)
                ) or []
                total = covered = 0
                prov, city = {}, {}
                for r in rows:
                    c = int(r.get("c") or 0)
                    addr = (r.get("addr") or "").strip()
                    total += c
                    if not addr:
                        continue
                    covered += c
                    p = _province_of(addr)
                    if p:
                        prov[p] = prov.get(p, 0) + c
                    ci = _city_of(addr)
                    if ci:
                        city[ci] = city.get(ci, 0) + c

                def _rank(d, limit):
                    items = sorted(d.items(), key=lambda kv: (-kv[1], kv[0]))[:limit]
                    return [{"name": k, "users": v,
                             "pct": round(v * 100.0 / max(covered, 1), 1)} for k, v in items]

                return {
                    "total": total,
                    "covered": covered,
                    "pending": total - covered,
                    "provinces": _rank(prov, 40),   # 省级行政区就三十来个，全列出来不截断（截断会让合计小于覆盖数）
                    "cities": _rank(city, 30),
                }

            result["geo"] = {
                "register": _geo_block("register_ip_addr", "created_at"),
                "login": _geo_block("last_login_ip_addr", "last_login_at"),
            }
        except Exception as e:
            print(f"[用户分析] 地域分布统计失败: {e}", flush=True)
            result["geo"] = {}

        result["returning_users"] = self.fetchall(
            f"""SELECT username, created_at, last_login_at FROM users
                WHERE DATE(created_at) < {ph} AND last_login_at IS NOT NULL
                  AND DATE(last_login_at) >= {ph} AND DATE(last_login_at) <= {ph}
                ORDER BY last_login_at DESC LIMIT 20""",
            (date_from, date_from, date_to)
        ) or []
        return result

    def get_old_user_recharge_details(self, date_from="", date_to="", page=1, page_size=15):
        """老用户充值明细：查询指定区间内老用户的已支付订单"""
        ph = _ph()
        if not date_from:
            date_from = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
        if not date_to:
            date_to = datetime.now().strftime("%Y-%m-%d")
        page = max(1, int(page))
        page_size = max(1, min(100, int(page_size)))
        offset = (page - 1) * page_size

        # 老用户定义：注册时间在区间起始之前
        # payment_orders 筛选条件
        po_where = [
            f"po.status = {ph}",
            f"DATE(po.created_at) >= {ph}",
            f"DATE(po.created_at) <= {ph}",
            f"DATE(u.created_at) < {ph}"
        ]
        po_params = ["paid", date_from, date_to, date_from]

        # xianyu_orders 筛选条件
        xy_where = [
            f"xo.status = {ph}",
            f"DATE(xo.created_at) >= {ph}",
            f"DATE(xo.created_at) <= {ph}",
            f"DATE(u.created_at) < {ph}"
        ]
        xy_params = ["paid", date_from, date_to, date_from]

        po_where_sql = " AND ".join(po_where)
        xy_where_sql = " AND ".join(xy_where)

        # 总数查询
        total_sql = f"""
            SELECT COUNT(*) AS cnt FROM (
                SELECT po.id FROM payment_orders po JOIN users u ON u.username = po.username WHERE {po_where_sql}
                UNION ALL
                SELECT xo.id FROM xianyu_orders xo JOIN users u ON u.username = xo.username WHERE {xy_where_sql}
            ) t
        """
        total_row = self.fetchone(total_sql, po_params + xy_params) or {}
        total = int(total_row.get("cnt") or 0)

        # 数据查询
        data_sql = f"""
            SELECT * FROM (
                SELECT po.id, po.order_no, po.username, po.plan_name, po.plan_type,
                       po.price, po.points, po.days, po.pay_method, po.pay_type, po.business_type,
                       po.created_at, 'payment' as source
                FROM payment_orders po JOIN users u ON u.username = po.username
                WHERE {po_where_sql}
                UNION ALL
                SELECT xo.id, xo.order_no, xo.username, xo.plan_name,
                       COALESCE((SELECT pp.plan_type FROM payment_plans pp WHERE pp.id = xo.plan_id), 'points') as plan_type,
                       xo.price, 0 as points, 0 as days,
                       'xianyu' as pay_method, '' as pay_type, '' as business_type,
                       xo.created_at, 'xianyu' as source
                FROM xianyu_orders xo JOIN users u ON u.username = xo.username
                WHERE {xy_where_sql}
            ) combined ORDER BY created_at DESC LIMIT {page_size} OFFSET {offset}
        """
        rows = self.fetchall(data_sql, po_params + xy_params) or []

        # 合计查询
        sum_sql = f"""
            SELECT COALESCE(SUM(price),0) AS total_amount, COUNT(*) AS cnt FROM (
                SELECT po.price FROM payment_orders po JOIN users u ON u.username = po.username WHERE {po_where_sql}
                UNION ALL
                SELECT xo.price FROM xianyu_orders xo JOIN users u ON u.username = xo.username WHERE {xy_where_sql}
            ) t
        """
        sum_row = self.fetchone(sum_sql, po_params + xy_params) or {}

        return {
            "rows": rows,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size if total > 0 else 0,
            "sum_amount": float(sum_row.get("total_amount") or 0),
            "sum_count": int(sum_row.get("cnt") or 0)
        }

    def upsert_question_bank(self, item):
        ph = _ph()
        self.execute(
            f"""INSERT INTO question_bank
                (question_hash, matching_key, match_stem, question_text, question_type, options_text, answer, source_model, source_provider, hit_count, last_used_at, is_image)
                VALUES ({ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, 0, CURRENT_TIMESTAMP, {ph})
                ON DUPLICATE KEY UPDATE
                answer=VALUES(answer), source_model=VALUES(source_model), source_provider=VALUES(source_provider),
                options_text=VALUES(options_text), question_type=VALUES(question_type), matching_key=VALUES(matching_key),
                match_stem=VALUES(match_stem), is_image=VALUES(is_image), updated_at=CURRENT_TIMESTAMP""",
            (
                item.get("question_hash", ""), item.get("matching_key", ""), item.get("match_stem", ""),
                item.get("question_text", ""), item.get("question_type", ""),
                item.get("options_text", ""), item.get("answer", ""), item.get("source_model", ""), item.get("source_provider", ""),
                item.get("is_image", 0)
            )
        )

    def update_question_bank_answer(self, old_hash, new_hash, answer, model_name="", provider_name="",
                                    matching_key="", match_stem="", is_image=None):
        """重训练专用：在**原记录上原地更新**答案。

        题库指纹含答案，答案变化会产生新指纹。若沿用 upsert 会变成「插入一条新记录 + 旧记录原封不动」，
        因此这里显式按旧指纹定位并 UPDATE，指纹同步刷新。
        若新指纹已被同题的另一条记录占用，则更新那条并删除旧记录，避免重复。
        返回 'updated' | 'merged' | 'missing'。
        """
        ph = _ph()
        row = self.fetchone(f"SELECT id FROM question_bank WHERE question_hash = {ph}", (old_hash,))
        if not row:
            return "missing"
        dup = self.fetchone(
            f"SELECT id FROM question_bank WHERE question_hash = {ph} AND id <> {ph}",
            (new_hash, row.get("id"))
        )
        sets = [f"answer = {ph}", f"source_model = {ph}", f"source_provider = {ph}"]
        params = [answer, model_name, provider_name]
        if matching_key:
            sets.append(f"matching_key = {ph}")
            params.append(matching_key)
        if match_stem:
            sets.append(f"match_stem = {ph}")
            params.append(match_stem)
        if is_image is not None:
            sets.append(f"is_image = {ph}")
            params.append(is_image)
        sets.append("updated_at = CURRENT_TIMESTAMP")
        if dup:
            # 新指纹已存在：更新它，删除旧记录，避免同一题留下两条
            params.append(new_hash)
            self.execute(f"UPDATE question_bank SET {', '.join(sets)} WHERE question_hash = {ph}", tuple(params))
            self.execute(f"DELETE FROM question_bank WHERE question_hash = {ph}", (old_hash,))
        else:
            sets.append(f"question_hash = {ph}")
            params.append(new_hash)
            params.append(old_hash)
            self.execute(f"UPDATE question_bank SET {', '.join(sets)} WHERE question_hash = {ph}", tuple(params))
        # 兜底：重训练后，同一题(matching_key) 只能留一条权威记录。
        # 必须保住「本次重训练产出的那条」即 question_hash = new_hash 的行：
        # 重训练是原地 UPDATE（id 不变，可能是旧小 id），不能简单地 ORDER BY id DESC 取最高 id，
        # 否则会误删刚更新的权威行、留下旧重复版本，导致「答案漂移 / 匹配轮空」。
        # 旧版 retrain 用 upsert 插入新行产生多版本，这里是最终收敛手段。
        if matching_key:
            cur = self.fetchone(
                f"SELECT id FROM question_bank WHERE matching_key = {ph} AND question_hash = {ph} ORDER BY id DESC LIMIT 1",
                (matching_key, new_hash)
            )
            keep_id = cur.get("id") if cur else None
            if keep_id is not None:
                self.execute(
                    f"DELETE FROM question_bank WHERE matching_key = {ph} AND id <> {ph}",
                    (matching_key, keep_id)
                )
        return "merged" if dup else "updated"

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

    def cleanup_old_logs(self, days, batch_size=5000, max_batches=200, target_table=None):
        """删除超过指定天数的日志数据（若 days=0 则清空全部历史日志），返回各表删除条数。

        分批删除：单次 DELETE 大量数据（如 script_event_logs 积压 20 万行/200MB）
        会超过 MySQL net_read_timeout(30s) 导致 "Lost connection during query"。
        改为每批删 batch_size 行并循环，保证每批都在超时阈值内完成，
        同时避免长时间持锁阻塞线上查询。单批失败即停止该表，已删部分保留，
        下次调用可继续（幂等）。
        """
        ph = _ph()
        if days is None:
            return {}
        try:
            days = int(days)
        except Exception:
            return {}
        if days < 0:
            return {}

        result = {}
        all_tables = [
            ("script_event_logs", "created_at"),
            ("ai_call_logs", "created_at"),
            ("bank_call_logs", "created_at"),
            ("usage_logs", "created_at"),
        ]
        tables = [t for t in all_tables if t[0] == target_table] if target_table else all_tables
        if not tables:
            return {}

        total_deleted = 0
        for table, col in tables:
            deleted = 0
            try:
                for _ in range(max_batches):
                    # 若 days==0 则无时间限制全量清空；否则删除超过保留天数的数据
                    if days == 0:
                        sql = f"DELETE FROM {table} LIMIT {int(batch_size)}"
                        cur = self.execute(sql)
                    else:
                        sql = (f"DELETE FROM {table} WHERE {col} < DATE_SUB(NOW(), INTERVAL {ph} DAY) "
                               f"LIMIT {int(batch_size)}")
                        cur = self.execute(sql, (days,))
                    n = cur.rowcount if cur and cur.rowcount and cur.rowcount > 0 else 0
                    deleted += n
                    if n < batch_size:
                        break  # 已删完，没有更多过期数据
                    # 每批之间短暂让出，缓解主从延迟与锁竞争
                    time.sleep(0.05)
                result[table] = deleted
                total_deleted += deleted
            except Exception as e:
                print(f"[日志清理] 清理 {table} 失败（已删 {deleted} 行）: {e}", flush=True)
                # 已成功删除的部分仍然算数，便于观察进度；失败标记为负数
                result[table] = -1 if deleted == 0 else deleted

        if total_deleted > 0 or days == 0:
            try:
                self.set_log_cleanup_last_at()
            except Exception:
                pass

        return result

    def get_log_stats(self, days=None):
        """获取各日志表的统计信息：总记录数、最早/最晚记录时间、以及按指定天数预计清理条数"""
        ph = _ph()
        tables_meta = [
            ("script_event_logs", "脚本事件日志", "created_at"),
            ("ai_call_logs", "AI调用日志", "created_at"),
            ("bank_call_logs", "题库接口日志", "created_at"),
            ("usage_logs", "功能使用日志", "created_at"),
        ]
        retention = self.get_log_retention_days()
        result = {
            "tables": {},
            "total_count": 0,
            "total_to_delete": 0,
            "retention_days": retention,
            "last_cleanup_at": None
        }
        last_at = self.get_log_cleanup_last_at()
        if last_at:
            result["last_cleanup_at"] = str(last_at)[:19]

        calc_days = days if days is not None else retention
        try:
            calc_days = int(calc_days)
        except Exception:
            calc_days = 0

        for table, label, col in tables_meta:
            try:
                row = self.fetchone(f"SELECT COUNT(*) as cnt, MIN({col}) as earliest, MAX({col}) as latest FROM {table}")
                cnt = int(row.get("cnt") or 0) if row else 0
                earliest = str(row.get("earliest"))[:19] if row and row.get("earliest") else None
                latest = str(row.get("latest"))[:19] if row and row.get("latest") else None

                to_delete = 0
                if calc_days == 0:
                    to_delete = cnt
                elif calc_days > 0:
                    del_row = self.fetchone(f"SELECT COUNT(*) as cnt FROM {table} WHERE {col} < DATE_SUB(NOW(), INTERVAL {ph} DAY)", (calc_days,))
                    to_delete = int(del_row.get("cnt") or 0) if del_row else 0

                result["tables"][table] = {
                    "label": label,
                    "count": cnt,
                    "earliest": earliest,
                    "latest": latest,
                    "to_delete": to_delete
                }
                result["total_count"] += cnt
                result["total_to_delete"] += to_delete
            except Exception as e:
                result["tables"][table] = {
                    "label": label,
                    "count": -1,
                    "error": str(e)
                }
        return result

    def get_log_retention_days(self):
        row = self.fetchone("SELECT log_retention_days FROM admin_config WHERE id = 1")
        return int(row.get("log_retention_days") or 0) if row else 0

    def set_log_retention_days(self, days):
        ph = _ph()
        self.execute(f"UPDATE admin_config SET log_retention_days = {ph} WHERE id = 1", (int(days),))

    def get_log_cleanup_last_at(self):
        """上次日志清理时间。返回 datetime 或 None（从未清理过）。"""
        try:
            row = self.fetchone("SELECT log_cleanup_last_at FROM admin_config WHERE id = 1")
            if row:
                return row.get("log_cleanup_last_at")
        except Exception:
            pass
        return None

    def set_log_cleanup_last_at(self, when=None):
        """记录本次清理时间，用于下次 24 小时判断。"""
        try:
            ph = _ph()
            self.execute(
                f"UPDATE admin_config SET log_cleanup_last_at = COALESCE({ph}, NOW()) WHERE id = 1",
                (when,)
            )
        except Exception as e:
            print(f"[日志清理] 记录清理时间失败: {e}", flush=True)

    def is_log_cleanup_due(self, interval_hours=24):
        """判断是否到了该清理的时间。
        从未清理过 -> 需要清理；
        距上次清理 >= interval_hours -> 需要清理；
        否则不需要。时间戳持久化在数据库，服务重启不会重置计时。
        """
        last = self.get_log_cleanup_last_at()
        if not last:
            return True
        try:
            if isinstance(last, str):
                last = datetime.strptime(last[:19], "%Y-%m-%d %H:%M:%S")
            return (datetime.now() - last).total_seconds() >= interval_hours * 3600
        except Exception:
            return True  # 解析失败时宁可清理一次

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

    def delete_question_bank_item(self, question_hash):
        ph = _ph()
        return self.execute(f"DELETE FROM question_bank WHERE question_hash = {ph}", (question_hash,))

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
        # 消费记录只展示真正付过钱的订单（paid/refunded）。
        # 未支付(pending)的下单记录会随时间大量堆积（全站曾达 201 笔），
        # 若一并展示会把付费记录挤出 LIMIT 5 的窗口，用户看不到自己的真实消费。
        recent_orders_sql = f"""
            SELECT order_no, plan_name, price, status, created_at, paid_at, plan_type, points, days
            FROM payment_orders WHERE username = {ph} AND status IN ('paid', 'refunded')
            ORDER BY id DESC LIMIT 5
        """
        rows = self.fetchall(recent_orders_sql, (username,))
        # 当前题数余额：退款折算用，循环外只查一次
        cur_balance = self._user_points_balance(username)
        # 退款申请状态只需查一次（原先写在循环里导致每行重复查库）
        order_nos = [ri.get('order_no') for ri in (rows or []) if ri.get('order_no')]
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
            rr_status = refund_req_map.get(r.get('order_no'), '')
            # 退款预览：可退金额与折算说明（与实际退款同源，保证一致）
            # 余额在循环外查一次后显式传入：本行数据不含 username，靠函数内部查库会得到 0。
            refund_preview = {'amount': 0.0, 'lines': [], 'summary': ''}
            if r.get('status') == 'paid' and not rr_status:
                try:
                    calc = self.calculate_refund(r, balance=cur_balance)
                    refund_preview = {
                        'amount': float(calc['amount']),
                        'lines': calc['lines'],
                        'summary': calc['summary'],
                    }
                except Exception:
                    pass
            # 可退金额为 0（如题数已全部用完）时不允许提交，避免产生必然被拒的申请
            no_refund_left = (refund_preview['amount'] <= 0 and not rr_status
                              and r.get('status') == 'paid')
            recent_orders.append({
                'order_no': r.get('order_no') or '',
                'plan_name': r.get('plan_name') or '',
                'price': float(r.get('price') or 0),
                'status': r.get('status') or '',
                'created_at': str(ca) if ca else '',
                'can_refund': can_refund and not rr_status and not no_refund_left,
                'no_refund_left': no_refund_left,
                'refund_request_status': rr_status,
                'refund_amount': refund_preview['amount'],
                'refund_lines': refund_preview['lines'],
                'refund_summary': refund_preview['summary'],
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
            # 先抢占状态、再入账：反过来时页面惰性结算和后台定时结算会各加一次余额，
            # 凭空多出可提现的钱（后面的兑换/抵扣就是花这个池子）。
            cur = self.execute(f"UPDATE commission_logs SET status = 'paid' WHERE id = {ph} AND status = 'pending'", (r["id"],))
            if not cur or cur.rowcount == 0:
                continue
            back = self.execute(
                f"UPDATE users SET commission_balance = COALESCE(commission_balance, 0) + {ph} WHERE username = {ph}",
                (amount, inviter_username)
            )
            if not back or back.rowcount == 0:
                print(f"[佣金结算][ERROR] 已标 paid 但未入账 user={inviter_username} "
                      f"log={r['id']} amount={amount}，需人工补回佣金余额", flush=True)

    def settle_all_pending_commissions(self):
        """批量结算所有推广人的待结算佣金，供后台定时任务调用"""
        rows = self.fetchall("SELECT DISTINCT inviter FROM commission_logs WHERE status = 'pending'") or []
        for r in rows:
            try:
                self.settle_pending_commissions(r["inviter"])
            except Exception as e:
                print(f"[佣金结算] 批量结算失败 inviter={r.get('inviter')}: {e}", flush=True)
        return len(rows)

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
        row = self.fetchone(f"SELECT username, amount FROM withdrawals WHERE id={ph}", (wid,))
        if not row:
            return False
        # 抢占只认这条 UPDATE 的 rowcount：先读后改会让两个管理员各退一次钱
        cur = self.execute(
            f"UPDATE withdrawals SET status='rejected', reject_reason={ph}, reviewed_at=CURRENT_TIMESTAMP "
            f"WHERE id={ph} AND status='pending'", (reason, wid)
        )
        if not cur or cur.rowcount == 0:
            return False
        back = self.execute(
            f"UPDATE users SET commission_balance = commission_balance + {ph} WHERE username = {ph}",
            (row["amount"], row["username"])
        )
        if not back or back.rowcount == 0:
            # 单子已判 rejected 但钱没退回佣金余额，只有人工补；静默返回 True 会把漏洞藏起来
            print(f"[提现][ERROR] 驳回退款失败 withdrawal={wid} user={row['username']} "
                  f"amount={row['amount']}，需人工补回佣金余额", flush=True)
        return True

    # ==================== 佣金核销（兑换题数 / 下单抵扣） ====================
    def referral_redemption_cfg(self, admin=None):
        """兑换与抵扣的口径只在这里算一次，界面拿到的数字全部来自它。"""
        admin = admin or self.get_admin_config() or {}
        try:
            rate = int(admin.get("referral_points_rate") or 0)
        except Exception:
            rate = 0
        try:
            hold = int(admin.get("referral_hold_minutes") or 0)
        except Exception:
            hold = 0
        return {
            "referral_on": int(admin.get("referral_enabled") or 0),
            "points_rate": rate if rate > 0 else 50,
            "exchange_on": int(admin.get("referral_exchange_enabled") or 0),
            "deduct_on": int(admin.get("referral_deduct_enabled") or 0),
            "hold_minutes": hold if hold >= 5 else 30,
            "min_amount": _dec(admin.get("referral_min_withdraw"), "10").quantize(CENT),
        }

    def commission_balance(self, username):
        ph = _ph()
        row = self.fetchone(f"SELECT commission_balance FROM users WHERE username = {ph}", (username,))
        return _dec((row or {}).get("commission_balance")).quantize(CENT)

    def commission_frozen(self, username):
        """下单抵扣里已划出、还没付也没过期的佣金"""
        ph = _ph()
        row = self.fetchone(
            f"SELECT COALESCE(SUM(amount), 0) s FROM commission_redemptions "
            f"WHERE username = {ph} AND kind = 'checkout' AND status = 'locked'",
            (username,)
        )
        return _dec((row or {}).get("s")).quantize(CENT)

    def _debit_commission(self, username, amount):
        """扣佣金：只认这条条件 UPDATE 的 rowcount，余额不足必然返回 0 行。"""
        ph = _ph()
        amt = _dec(amount).quantize(CENT)
        cur = self.execute(
            f"UPDATE users SET commission_balance = commission_balance - {ph} "
            f"WHERE username = {ph} AND commission_balance >= {ph}",
            (str(amt), username, str(amt))
        )
        return bool(cur and cur.rowcount > 0)

    def _credit_commission(self, username, amount):
        ph = _ph()
        amt = _dec(amount).quantize(CENT)
        cur = self.execute(
            f"UPDATE users SET commission_balance = COALESCE(commission_balance, 0) + {ph} WHERE username = {ph}",
            (str(amt), username)
        )
        if not cur or cur.rowcount == 0:
            print(f"[佣金核销][ERROR] 退回失败 user={username} amount={amt}，需人工补回佣金余额", flush=True)
            return False
        return True

    @staticmethod
    def points_from_commission(amount, rate):
        """折题数一律向下取整：凑不成整题的零头留在余额里，不四舍五入送人。"""
        return int(_dec(amount).quantize(CENT) * int(rate or 0))

    def exchange_commission_for_points(self, username, amount, request_no=""):
        """佣金兑换题数：即时到账、不可退现。

        台账先落 pending 撞 uk_request 就是重复点击，把上一次的真实结果还回去；
        扣款和加题任一步失败都不留「钱没了题没到」——失败即退回并标 released。
        """
        import pymysql
        ph = _ph()
        cfg = self.referral_redemption_cfg()
        if not cfg["referral_on"] or not cfg["exchange_on"]:
            return False, "佣金兑换题数暂未开放", None
        try:
            amt = _dec(amount).quantize(CENT, rounding=ROUND_HALF_UP)
        except Exception:
            return False, "兑换金额格式错误", None
        if amt < cfg["min_amount"]:
            return False, f"单次最低兑换 {cfg['min_amount']} 元", None
        if amt > Decimal("10000"):
            return False, "单次兑换金额过高，请分次操作或联系管理员", None
        points = self.points_from_commission(amt, cfg["points_rate"])
        if points < 1:
            return False, "兑换金额不足 1 题，请提高金额", None
        req = (request_no or "").strip()[:64] or f"EX{int(time.time() * 1000)}{abs(hash(username)) % 10000:04d}"
        try:
            self.execute(
                f"INSERT INTO commission_redemptions (username, kind, request_no, order_no, amount, points, rate, status) "
                f"VALUES ({ph}, {ph}, {ph}, NULL, {ph}, {ph}, {ph}, 'pending')",
                (username, "exchange", req, str(amt), points, cfg["points_rate"])
            )
        except pymysql.IntegrityError:
            row = self.fetchone(
                f"SELECT * FROM commission_redemptions WHERE username = {ph} AND request_no = {ph}",
                (username, req)
            )
            st = (row or {}).get("status")
            if st == "done":
                return True, f"已兑换 {int((row or {}).get('points') or 0)} 题", row
            if st == "pending":
                # 上一次点击还在这儿处理，钱可能刚扣题可能没到；只说事实，不替它报成功
                return True, "兑换处理中，请稍后在兑换记录里确认", row
            return False, "本次兑换未成功，请重新发起", row
        if not self._debit_commission(username, amt):
            self.execute(
                f"UPDATE commission_redemptions SET status = 'failed' WHERE username = {ph} AND request_no = {ph} AND status = 'pending'",
                (username, req)
            )
            return False, f"可提现佣金不足（当前 ¥{self.commission_balance(username)}）", None
        ok, msg = self.adjust_user_points(username, points, f"佣金兑换题数 ¥{amt}", lot_source="commission")
        if not ok:
            self._credit_commission(username, amt)
            self.execute(
                f"UPDATE commission_redemptions SET status = 'released' WHERE username = {ph} AND request_no = {ph} AND status = 'pending'",
                (username, req)
            )
            print(f"[佣金兑换][ERROR] 题数未到账已退款 user={username} amount={amt} points={points} 原因={msg}", flush=True)
            return False, f"题数未到账，佣金已退回：{msg}", None
        self.execute(
            f"UPDATE commission_redemptions SET status = 'done' WHERE username = {ph} AND request_no = {ph} AND status = 'pending'",
            (username, req)
        )
        row = self.fetchone(
            f"SELECT * FROM commission_redemptions WHERE username = {ph} AND request_no = {ph}",
            (username, req)
        )
        return True, f"兑换成功，{points} 题已到账", row

    def max_commission_deduct(self, username, gross_price, cfg=None):
        """这一单最多能抵扣多少：只取「余额」和「订单原价」的较小值，永不放大。"""
        cfg = cfg or self.referral_redemption_cfg()
        gross = _dec(gross_price).quantize(CENT)
        if gross <= 0 or not cfg["referral_on"] or not cfg["deduct_on"]:
            return Decimal("0.00")
        bal = self.commission_balance(username)
        return bal if bal < gross else gross

    def commission_deduct_split(self, username, gross_price, cfg=None):
        """把档位原价拆成「现金 + 佣金抵扣」。两段都由服务端算，相加严格等于原价。"""
        cfg = cfg or self.referral_redemption_cfg()
        gross = _dec(gross_price).quantize(CENT)
        deduct = self.max_commission_deduct(username, gross, cfg)
        return float(gross), float(deduct), float(gross - deduct)

    def lock_commission_for_order(self, username, order_no, amount, request_no="", cfg=None):
        """下单抵扣：建单前把佣金划出并冻结在台账上。

        先扣钱后插单（同提现）：反过来会在插单失败时留下一条挂着订单号的空记录，
        uk_order 让这一单再也无法抵扣。
        """
        import pymysql
        ph = _ph()
        cfg = cfg or self.referral_redemption_cfg()
        amt = _dec(amount).quantize(CENT)
        if amt <= 0:
            return False, "抵扣金额为 0", None
        if not self._debit_commission(username, amt):
            return False, "可提现佣金不足", None
        req = (request_no or "").strip()[:64] or f"DK{int(time.time() * 1000)}{abs(hash(username)) % 10000:04d}"
        try:
            self.execute(
                f"INSERT INTO commission_redemptions (username, kind, request_no, order_no, amount, points, rate, status) "
                f"VALUES ({ph}, {ph}, {ph}, {ph}, {ph}, 0, 1, 'locked')",
                (username, "checkout", req, order_no, str(amt))
            )
        except pymysql.IntegrityError as e:
            self._credit_commission(username, amt)
            print(f"[下单抵扣][ERROR] 台账写入失败已退款 order={order_no} user={username} amount={amt}: {e}", flush=True)
            return False, "该订单已登记佣金抵扣，请勿重复提交", None
        return True, "抵扣已锁定", self.fetchone(f"SELECT * FROM commission_redemptions WHERE order_no = {ph}", (order_no,))

    def consume_commission_hold(self, order_no):
        """订单真正付款成功：冻结的抵扣转为已核销。返回 False 表示这条已被回收线程退回。"""
        ph = _ph()
        cur = self.execute(
            f"UPDATE commission_redemptions SET status = 'consumed' WHERE order_no = {ph} AND status = 'locked'",
            (order_no,)
        )
        return bool(cur and cur.rowcount > 0)

    def release_commission_hold(self, order_no, reason=""):
        """建单失败/超时未付：把冻结的佣金退回余额。抢占失败说明回调已核销。"""
        ph = _ph()
        row = self.fetchone(
            f"SELECT username, amount, status FROM commission_redemptions WHERE order_no = {ph}",
            (order_no,)
        )
        if not row or row.get("status") != "locked":
            return False
        cur = self.execute(
            f"UPDATE commission_redemptions SET status = 'released' WHERE order_no = {ph} AND status = 'locked'",
            (order_no,)
        )
        if not cur or cur.rowcount == 0:
            return False
        if not self._credit_commission(row["username"], row["amount"]):
            return False
        print(f"[下单抵扣] 已退回冻结佣金 order={order_no} user={row['username']} "
              f"amount={row['amount']} 原因={reason}", flush=True)
        return True

    def release_expired_commission_holds(self):
        """回收超时未付的下单抵扣，避免用户随手下单就把佣金冻死。"""
        ph = _ph()
        cfg = self.referral_redemption_cfg()
        rows = self.fetchall(
            f"SELECT order_no FROM commission_redemptions "
            f"WHERE kind = 'checkout' AND status = 'locked' "
            f"AND created_at < (CURRENT_TIMESTAMP - INTERVAL {int(cfg['hold_minutes'])} MINUTE)"
        ) or []
        n = 0
        for r in rows:
            order_no = r.get("order_no") or ""
            if not order_no:
                continue
            if self.release_commission_hold(order_no, f"超过 {cfg['hold_minutes']} 分钟未支付"):
                order = self.get_order(order_no) or {}
                # 全额抵扣的 0 元单没有网关可等，冻结退回后必须关掉，否则留着一条
                # 还能被 apply_paid_order 捡起来发货的白单
                if float(order.get("price") or 0) <= 0 and order.get("status") in ("pending", "created"):
                    self.execute(
                        f"UPDATE payment_orders SET status = 'cancelled' WHERE order_no = {ph} AND status IN ({ph}, {ph})",
                        (order_no, "pending", "created")
                    )
                n += 1
        return n

    def list_commission_redemptions(self, username, limit=50):
        ph = _ph()
        return self.fetchall(
            f"SELECT * FROM commission_redemptions WHERE username = {ph} ORDER BY id DESC LIMIT {int(limit or 50)}",
            (username,)
        ) or []

    def referral_stats(self):
        """管理员统计：top10 邀请人 + 总佣金 + 提现统计"""
        top10 = self.fetchall(
            "SELECT r.inviter_username AS username, COUNT(*) AS invited_count, "
            "COALESCE(SUM(CASE WHEN c.status != 'refunded' THEN c.commission_amount ELSE 0 END),0) AS total_commission "
            "FROM referrals r LEFT JOIN commission_logs c ON r.inviter_username = c.inviter "
            "GROUP BY r.inviter_username ORDER BY invited_count DESC LIMIT 10"
        )
        for r in (top10 or []):
            r["invited_count"] = int(r.get("invited_count") or 0)
            r["total_commission"] = float(r.get("total_commission") or 0)
        total = self.fetchone("SELECT COALESCE(SUM(CASE WHEN status != 'refunded' THEN commission_amount ELSE 0 END),0) AS total, COUNT(*) AS cnt FROM commission_logs WHERE status != 'refunded'") or {}
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

    def get_referral_details(self, inviter_username, limit=200):
        """查看某个推广人邀请的所有用户明细，含充值金额和佣金"""
        ph = _ph()
        self.settle_pending_commissions(inviter_username)
        rows = self.fetchall(
            f"""SELECT r.invitee_username, r.created_at AS referred_at,
                       COALESCE(po.total_paid, 0) AS total_recharge,
                       COALESCE(cl.commission_amount, 0) AS commission_amount,
                       cl.status AS commission_status, cl.order_no, cl.order_amount
                FROM referrals r
                LEFT JOIN (
                    SELECT username, SUM(price) AS total_paid
                    FROM payment_orders WHERE status = 'paid'
                    GROUP BY username
                ) po ON po.username = r.invitee_username
                LEFT JOIN commission_logs cl ON cl.invitee = r.invitee_username AND cl.inviter = r.inviter_username
                WHERE r.inviter_username = {ph}
                ORDER BY r.created_at DESC
                LIMIT {ph}""",
            (inviter_username, limit)
        )
        result = []
        for row in (rows or []):
            result.append({
                "invitee": row.get("invitee_username", ""),
                "referred_at": str(row.get("referred_at") or ""),
                "total_recharge": float(row.get("total_recharge") or 0),
                "commission_amount": float(row.get("commission_amount") or 0),
                "commission_status": row.get("commission_status") or "",
                "order_no": row.get("order_no") or "",
                "order_amount": float(row.get("order_amount") or 0)
            })
        return result

    def get_all_referrers(self, page=1, per_page=20):
        """分页获取所有推广人及其推广统计"""
        ph = _ph()
        offset = (max(1, page) - 1) * per_page
        for r in (self.fetchall(f"SELECT DISTINCT inviter_username FROM referrals LIMIT {ph} OFFSET {ph}", (per_page, offset)) or []):
            self.settle_pending_commissions(r["inviter_username"])
        rows = self.fetchall(
            f"""SELECT r.inviter_username AS username,
                       COUNT(*) AS invited_count,
                       COALESCE(SUM(CASE WHEN c.status != 'refunded' THEN c.commission_amount ELSE 0 END), 0) AS total_commission,
                       COALESCE(SUM(CASE WHEN c.status = 'paid' THEN c.commission_amount ELSE 0 END), 0) AS paid_commission,
                       COALESCE(SUM(CASE WHEN c.status = 'pending' THEN c.commission_amount ELSE 0 END), 0) AS pending_commission
                FROM referrals r
                LEFT JOIN commission_logs c ON c.inviter = r.inviter_username
                GROUP BY r.inviter_username
                ORDER BY invited_count DESC
                LIMIT {ph} OFFSET {ph}""",
            (per_page, offset)
        )
        total_row = self.fetchone("SELECT COUNT(DISTINCT inviter_username) AS cnt FROM referrals") or {}
        total = int(total_row.get("cnt") or 0)
        result = []
        for row in (rows or []):
            result.append({
                "username": row.get("username", ""),
                "invited_count": int(row.get("invited_count") or 0),
                "total_commission": float(row.get("total_commission") or 0),
                "paid_commission": float(row.get("paid_commission") or 0),
                "pending_commission": float(row.get("pending_commission") or 0)
            })
        return {"list": result, "total": total, "page": page, "per_page": per_page}


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
