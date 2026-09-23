#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""只读校验：确认推广返利兑换/抵扣所需的表和列在生产库已落地。

    cd /www/wwwroot/xs.openget.cn && python3 scripts/_verify_redeem_schema.py

只连只读查询，不写任何资金数据，不打印任何连接口令。Database() 构造本身会跑
一次幂等迁移（_init_tables），所以直接用它读回结构即可。
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "src"))
import database  # noqa: E402

TABLES = ["commission_redemptions"]
ADMIN_COLS = ["referral_points_rate", "referral_exchange_enabled",
              "referral_deduct_enabled", "referral_hold_minutes"]
ORDER_COLS = ["plan_price", "commission_used"]

fail = 0
db = database.Database()

have_tables = {r[list(r.keys())[0]] for r in db.fetchall("SHOW TABLES")}
for t in TABLES:
    ok = t in have_tables
    fail += 0 if ok else 1
    print(("PASS" if ok else "FAIL"), "table", t)

for col in ADMIN_COLS:
    rows = db.fetchall(f"SHOW COLUMNS FROM admin_config LIKE '{col}'")
    ok = bool(rows)
    default = rows[0].get("Default") if ok else None
    fail += 0 if ok else 1
    print(("PASS" if ok else "FAIL"), "admin_config", col, "default=", default)

for col in ORDER_COLS:
    rows = db.fetchall(f"SHOW COLUMNS FROM payment_orders LIKE '{col}'")
    ok = bool(rows)
    default = rows[0].get("Default") if ok else None
    fail += 0 if ok else 1
    print(("PASS" if ok else "FAIL"), "payment_orders", col, "default=", default)

# 台账表的资金不变量索引：幂等号与订单号必须唯一，否则并发能塞进重复行
idx = {r.get("Non_unique", 1) == 0 and r.get("Column_name") for r in
       db.fetchall("SHOW INDEX FROM commission_redemptions")}
uniq_cols = {c for c in idx if c}
for c in ("request_no", "order_no"):
    ok = c in uniq_cols
    fail += 0 if ok else 1
    print(("PASS" if ok else "FAIL"), "commission_redemptions unique idx on", c)

print("RESULT", "ALL_PASS" if fail == 0 else f"{fail}_MISSING")
sys.exit(0 if fail == 0 else 1)
