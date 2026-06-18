#!/usr/bin/env bash
# =============================================================================
# html2image-server - Start script (Linux / macOS)
# Thin wrapper that delegates to `node start.js`.
# Doing the real work in Node avoids shell escaping / encoding issues.
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if ! command -v node >/dev/null 2>&1; then
    echo "[ERROR] Node.js not found in PATH."
    exit 1
fi

node start.js
