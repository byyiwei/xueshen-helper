import subprocess
import re

res = subprocess.run(['git', 'show', 'HEAD~1:static/admin.html'], capture_output=True, text=True, encoding='utf-8')
old_html = res.stdout
old_style = old_html.split('<style>')[1].split('</style>')[0]

with open('tools/old_style.css', 'w', encoding='utf-8') as f:
    f.write(old_style)

print(f"Extracted old_style.css: {len(old_style)} chars, {len(old_style.splitlines())} lines")
