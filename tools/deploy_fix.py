# -*- coding: utf-8 -*-
import json
import os
import hashlib
import time
import paramiko

with open('config/server.json', 'r', encoding='utf-8') as f:
    cfg = json.load(f)

host = cfg['host']
port = cfg.get('port', 22)
user = cfg['user']
password = cfg['password']
deploy_dir = cfg['deploy_dir']
restart_cmd = cfg['restart_cmd']

print(f"Connecting to {host}:{port} as {user}...")
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(host, port=port, username=user, password=password, timeout=15)
sftp = ssh.open_sftp()
print("Connected successfully!")

timestamp = time.strftime('%Y%m%d_%H%M%S')

files_to_deploy = [
    ('src/database.py', f"{deploy_dir}/src/database.py"),
    ('src/backend.py', f"{deploy_dir}/src/backend.py"),
    ('static/admin.html', f"{deploy_dir}/static/admin.html")
]

for local_path, remote_path in files_to_deploy:
    print(f"\n--- Deploying {local_path} -> {remote_path} ---")
    # 1. Backup
    remote_bak = f"{remote_path}.bak_{timestamp}"
    stdin, stdout, stderr = ssh.exec_command(f"cp {remote_path} {remote_bak}")
    stdout.channel.recv_exit_status()
    print(f"Backed up to {remote_bak}")

    # 2. Local content normalize LF
    with open(local_path, 'r', encoding='utf-8') as f:
        local_content = f.read()
    local_bytes = local_content.replace('\r\n', '\n').encode('utf-8')
    local_md5 = hashlib.md5(local_bytes).hexdigest()

    # 3. Upload to tmp
    remote_tmp = f"{remote_path}.tmp_{timestamp}"
    with sftp.open(remote_tmp, 'wb') as rf:
        rf.write(local_bytes)

    # 4. Atomic mv
    stdin, stdout, stderr = ssh.exec_command(f"mv {remote_tmp} {remote_path} && chmod 644 {remote_path}")
    stdout.channel.recv_exit_status()

    # 5. Check MD5
    stdin, stdout, stderr = ssh.exec_command(f"md5sum {remote_path}")
    remote_md5_out = stdout.read().decode('utf-8').strip()
    remote_md5 = remote_md5_out.split()[0]
    print(f"Local MD5:  {local_md5}")
    print(f"Remote MD5: {remote_md5}")
    assert local_md5 == remote_md5, f"MD5 mismatch for {local_path}!"

# 6. Syntax check remote python files
print("\n--- Verifying Remote Python Syntax ---")
py_check_cmd = f"/www/server/panel/pyenv/bin/python3 -m py_compile {deploy_dir}/src/database.py {deploy_dir}/src/backend.py"
stdin, stdout, stderr = ssh.exec_command(py_check_cmd)
err = stderr.read().decode('utf-8').strip()
if err:
    print(f"Python compile warnings/errors:\n{err}")
else:
    print("Remote Python compilation verified successfully!")

# 7. Restart supervisor
print(f"\n--- Restarting Supervisor: {restart_cmd} ---")
stdin, stdout, stderr = ssh.exec_command(restart_cmd)
print("Restart output:", stdout.read().decode('utf-8').strip())
print("Restart error:", stderr.read().decode('utf-8').strip())

time.sleep(3)

# 8. Check supervisor status
status_cmd = "/www/server/panel/pyenv/bin/supervisorctl -c /etc/supervisor/supervisord.conf status xs-backend:xs-backend_00"
stdin, stdout, stderr = ssh.exec_command(status_cmd)
status_out = stdout.read().decode('utf-8').strip()
print(f"Supervisor status: {status_out}")

# 9. Verify remote get_log_stats() execution directly
print("\n--- Testing remote get_log_stats() ---")
test_cmd = f'''
/www/server/panel/pyenv/bin/python3 -c "
import os, sys, json
sys.path.insert(0, '{deploy_dir}/src')
os.environ['MYSQL_HOST'] = '127.0.0.1'
os.environ['MYSQL_PORT'] = '3306'
os.environ['MYSQL_USER'] = 'xuexitong'
os.environ['MYSQL_PASSWORD'] = '199975yiwei'
os.environ['MYSQL_DATABASE'] = 'xuexitong'

from database import Database
db = Database()
stats = db.get_log_stats(days=7)
print(json.dumps(stats, ensure_ascii=False, indent=2))
"
'''
stdin, stdout, stderr = ssh.exec_command(test_cmd)
print("Log stats output:\n", stdout.read().decode('utf-8').strip())

sftp.close()
ssh.close()
print("\nAll files deployed and verified successfully!")
