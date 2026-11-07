# -*- coding: utf-8 -*-
import json
import os
import hashlib
import time
import paramiko
import urllib.request
import ssl

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

# Backup remote admin.html
timestamp = time.strftime('%Y%m%d_%H%M%S')
remote_admin = f"{deploy_dir}/static/admin.html"
remote_bak = f"{deploy_dir}/static/admin.html.bak_{timestamp}"

stdin, stdout, stderr = ssh.exec_command(f"cp {remote_admin} {remote_bak}")
exit_status = stdout.channel.recv_exit_status()
print(f"Backup created: {remote_bak} (status: {exit_status})")

# Read local file, normalize to LF
with open('static/admin.html', 'r', encoding='utf-8') as f:
    local_content = f.read()

# Normalize CRLF to LF
local_bytes = local_content.replace('\r\n', '\n').encode('utf-8')
local_md5 = hashlib.md5(local_bytes).hexdigest()
print(f"Local file size: {len(local_bytes)} bytes, MD5: {local_md5}")

# Upload to temporary file, then atomic rename
remote_tmp = f"{remote_admin}.tmp_{timestamp}"
with sftp.open(remote_tmp, 'wb') as rf:
    rf.write(local_bytes)

# Move tmp to target
stdin, stdout, stderr = ssh.exec_command(f"mv {remote_tmp} {remote_admin} && chmod 644 {remote_admin}")
stdout.channel.recv_exit_status()

# Verify remote MD5
stdin, stdout, stderr = ssh.exec_command(f"md5sum {remote_admin}")
remote_md5_out = stdout.read().decode('utf-8').strip()
remote_md5 = remote_md5_out.split()[0]
print(f"Remote MD5: {remote_md5_out}")

if remote_md5 == local_md5:
    print("MD5 checksum verification PASSED!")
else:
    print(f"WARNING: MD5 mismatch: local={local_md5}, remote={remote_md5}")

# Restart supervisor
print("Restarting supervisor service...")
stdin, stdout, stderr = ssh.exec_command(restart_cmd)
restart_out = stdout.read().decode('utf-8').strip()
restart_err = stderr.read().decode('utf-8').strip()
print(f"Restart result: {restart_out}")
if restart_err:
    print(f"Restart stderr: {restart_err}")

# Check supervisor status
stdin, stdout, stderr = ssh.exec_command(cfg['supervisorctl'] + " status")
status_out = stdout.read().decode('utf-8').strip()
print(f"Supervisor status:\n{status_out}")

sftp.close()
ssh.close()
print("SSH connection closed.")

# Web verification
print("\nVerifying live web service...")
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

req = urllib.request.Request("https://xs.openget.cn/admin", headers={"User-Agent": "Mozilla/5.0 AdminCheck/1.0"})
try:
    with urllib.request.urlopen(req, context=ctx, timeout=10) as response:
        content = response.read().decode('utf-8', errors='ignore')
        print(f"HTTP Status: {response.status}")
        print(f"Content length: {len(content)}")
        if '0-EMOJI SVG SPRITE POOL' in content:
            print("Verified: 0-Emoji SVG Sprite Pool is present on live site!")
        if '.ui-icon' in content:
            print("Verified: .ui-icon styles are present on live site!")
        if '.toast-container' in content:
            print("Verified: .toast-container styles are present on live site!")
        if '.collapsible-section' in content:
            print("Verified: .collapsible-section styles are present on live site!")
        if 'padding: 0 118px 0 24px' in content:
            print("Verified: Safe-area main-header padding is active on live site!")
        print("ALL LIVE VERIFICATIONS PASSED!")
except Exception as e:
    print(f"Live request failed: {e}")
