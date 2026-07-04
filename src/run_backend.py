import sys
import os

# Add the script directory to path
script_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, script_dir)

# Run the backend
exec(open(os.path.join(script_dir, 'backend.py'), encoding='utf-8').read())
