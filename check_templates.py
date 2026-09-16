import sys
sys.path.insert(0, "/www/wwwroot/xs.openget.cn/src")
import database
db = database.Database()
rows = db.fetchall("SELECT id, scene, subject FROM email_templates ORDER BY id")
for r in rows:
    print(r["id"], r["scene"], r["subject"])
