# -*- coding: utf-8 -*-
"""
build_complete_style.py
Constructs the unified modern Clean SaaS stylesheet for static/admin.html
guaranteeing 100% class coverage for all 218 secondary page classes,
0-emoji SVG scaling classes, floating toast notification system,
safe-area header paddings, and mobile responsive adaptations.
"""
import re

css_code = """
/* ==================== CLEAN SAAS DESIGN TOKENS ==================== */
:root {
  color-scheme: dark;
  --bg: #090d16;
  --bg2: #0f172a;
  --bg3: #182235;
  --bg4: #1e293b;
  --border: #1e293b;
  --border2: #334155;
  --text: #f8fafc;
  --text1: #f8fafc;
  --text2: #94a3b8;
  --text3: #64748b;
  --accent: #3b82f6;
  --accent2: #60a5fa;
  --accent-subtle: rgba(59, 130, 246, 0.12);
  --accent-hover: #2563eb;
  --success: #10b981;
  --success-subtle: rgba(16, 185, 129, 0.12);
  --warn: #f59e0b;
  --warning: #f59e0b;
  --warn-subtle: rgba(245, 158, 11, 0.12);
  --danger: #ef4444;
  --danger-subtle: rgba(239, 68, 68, 0.12);
  --primary: #3b82f6;
  --brand: #3b82f6;
  --chart-grid: rgba(255, 255, 255, 0.06);
  --card: #0f172a;
  --radius: 12px;
  --radius-sm: 8px;
  --radius-lg: 16px;
  --sidebar-w: 240px;
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", sans-serif;
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  line-height: 1.6;
  overflow: hidden;
  font-variant-numeric: tabular-nums;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* ==================== 0-EMOJI SVG ICONS ==================== */
.ui-icon {
  width: 16px;
  height: 16px;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  fill: none;
  display: inline-block;
  vertical-align: middle;
  flex-shrink: 0;
  transition: color 0.15s ease, transform 0.15s ease;
}
.ui-icon.xs { width: 13px; height: 13px; stroke-width: 2.2; }
.ui-icon.sm { width: 15px; height: 15px; stroke-width: 2; }
.ui-icon.md { width: 18px; height: 18px; stroke-width: 2; }
.ui-icon.lg { width: 22px; height: 22px; stroke-width: 1.8; }
.ui-icon.xl { width: 28px; height: 28px; stroke-width: 1.6; }

/* ==================== TOAST NOTIFICATION CENTER ==================== */
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
  max-width: 380px;
}
.toast-item {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.35);
  color: var(--text);
  font-size: 13px;
  animation: toastSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.toast-item.toast-success { border-color: rgba(16, 185, 129, 0.3); background: rgba(16, 185, 129, 0.12); color: var(--success); }
.toast-item.toast-danger, .toast-item.toast-error { border-color: rgba(239, 68, 68, 0.3); background: rgba(239, 68, 68, 0.12); color: var(--danger); }
.toast-item.toast-warn, .toast-item.toast-warning { border-color: rgba(245, 158, 11, 0.3); background: rgba(245, 158, 11, 0.12); color: var(--warn); }
.toast-item.toast-info { border-color: rgba(59, 130, 246, 0.3); background: rgba(59, 130, 246, 0.12); color: var(--accent); }
.toast-icon { display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.toast-body { flex: 1; word-break: break-word; font-size: 13px; line-height: 1.5; }
.toast-close {
  background: transparent;
  border: none;
  color: currentColor;
  opacity: 0.6;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
}
.toast-close:hover { opacity: 1; }
@keyframes toastSlideIn { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }

/* ==================== LAYOUT & SIDEBAR ==================== */
.app-layout { display: flex; height: 100vh; height: 100dvh; overflow: hidden; }

.sidebar {
  width: var(--sidebar-w);
  background: var(--bg2);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  z-index: 100;
}
.sidebar-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 12px;
}
.sidebar-header .logo {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--bg3);
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent2);
}
.sidebar-header h1 { font-size: 15px; font-weight: 700; color: var(--text); }
.sidebar-header p { font-size: 11px; color: var(--text2); margin-top: 1px; }

.sidebar-close-btn {
  display: none;
  margin-left: auto;
  border: none;
  background: transparent;
  color: var(--text2);
  width: 32px;
  height: 32px;
  border-radius: 8px;
  cursor: pointer;
  align-items: center;
  justify-content: center;
}
.sidebar-close-btn:hover { background: var(--bg3); color: var(--text); }

.sidebar-menu {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(148, 163, 184, 0.25) transparent;
}
.sidebar-menu::-webkit-scrollbar { width: 5px; height: 5px; }
.sidebar-menu::-webkit-scrollbar-track { background: transparent; margin: 4px 0; }
.sidebar-menu::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.25); border-radius: 10px; }
.sidebar-menu::-webkit-scrollbar-thumb:hover { background: rgba(148, 163, 184, 0.4); }

.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  color: var(--text2);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 4px;
}
.menu-item:hover { background: var(--bg3); color: var(--text); }
.menu-item.active { background: rgba(59, 130, 246, 0.12); color: var(--accent2); font-weight: 600; }
.menu-item .icon { width: 20px; text-align: center; font-size: 14px; color: currentColor; }

.menu-group { margin-bottom: 4px; }
.menu-group-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  color: var(--text2);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
}
.menu-group-header:hover { background: var(--bg3); color: var(--text); }
.menu-group-header .icon { width: 20px; text-align: center; font-size: 14px; color: currentColor; }
.menu-group-header .arrow { margin-left: auto; transition: transform 0.2s; color: var(--text3); }
.menu-group.expanded .menu-group-header .arrow { transform: rotate(90deg); }
.menu-group-items { max-height: 0; overflow: hidden; transition: max-height 0.25s ease; }
.menu-group.expanded .menu-group-items { max-height: 600px; }
.menu-group-items .menu-item { padding-left: 36px; font-size: 12.5px; padding-top: 8px; padding-bottom: 8px; }

.filter-tab-group { display: inline-flex; background: var(--bg3); border-radius: 10px; padding: 4px; gap: 2px; }
.filter-tab { border: none; background: transparent; color: var(--text2); font-size: 13px; padding: 6px 14px; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
.filter-tab:hover { color: var(--text); }
.filter-tab.active { background: var(--accent2); color: #fff; font-weight: 500; box-shadow: 0 2px 6px rgba(59, 130, 246, 0.25); }

/* ==================== MAIN CONTENT & HEADER ==================== */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  position: relative;
  background: var(--bg);
}

/* Header with padding preventing top-account and toggle collision */
.main-header {
  height: 56px;
  background: var(--bg2);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 118px 0 24px;
  flex-shrink: 0;
  position: relative;
  gap: 16px;
}
.main-header h2 { font-size: 15px; font-weight: 600; display: flex; align-items: center; gap: 8px; color: var(--text); margin: 0; white-space: nowrap; }
.breadcrumb-nav { display: flex; align-items: center; gap: 0; font-size: 13px; color: var(--text3); flex-wrap: wrap; }
.breadcrumb { display: flex; align-items: center; }
.breadcrumb-item { color: var(--text2); transition: color 0.2s; }
.breadcrumb-item.clickable { cursor: pointer; color: var(--accent2); }
.breadcrumb-item.clickable:hover { color: var(--accent); text-decoration: underline; }
.breadcrumb-item.active { color: var(--text); font-weight: 500; cursor: default; }
.breadcrumb-sep { margin: 0 8px; color: var(--text3); font-size: 11px; }

.main-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  scrollbar-width: thin;
  scrollbar-color: rgba(148, 163, 184, 0.3) transparent;
}
.main-body::-webkit-scrollbar { width: 8px; height: 8px; }
.main-body::-webkit-scrollbar-track { background: transparent; margin: 4px 0; }
.main-body::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.3); border-radius: 10px; border: 2px solid transparent; background-clip: content-box; }
.main-body::-webkit-scrollbar-thumb:hover { background: rgba(148, 163, 184, 0.5); background-clip: content-box; }

.top-account {
  position: fixed;
  right: 22px;
  top: 9px;
  z-index: 80;
  padding-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.top-avatar {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--accent), #2563eb);
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  color: #fff;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  transition: transform 0.18s, box-shadow 0.18s;
}
.top-avatar:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3); }
.profile-avatar img, .top-avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
.profile-avatar { width: 72px; height: 72px; border-radius: 20px; background: var(--bg3); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; overflow: hidden; font-size: 24px; color: var(--text2); }
.avatar-row { display: flex; gap: 16px; align-items: center; margin-bottom: 16px; }

.top-menu {
  position: absolute;
  right: 0;
  top: 48px;
  min-width: 156px;
  padding: 8px;
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: 14px;
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.35);
  display: none;
}
.top-menu::before {
  content: '';
  position: absolute;
  right: 14px;
  top: -6px;
  width: 10px;
  height: 10px;
  background: var(--bg2);
  border-left: 1px solid var(--border);
  border-top: 1px solid var(--border);
  transform: rotate(45deg);
}
.top-account:hover .top-menu, .top-avatar:hover ~ .top-menu, .top-menu:hover { display: block; }
.top-menu button {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  padding: 9px 12px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--text2);
  cursor: pointer;
  font-size: 13px;
  transition: all 0.15s;
}
.top-menu button:hover { background: var(--bg3); color: var(--text); }
.top-menu .danger { color: #f87171; }
.top-menu .danger:hover { background: rgba(239, 68, 68, 0.12); color: #ef4444; }

/* ==================== CARDS & CONTAINERS ==================== */
.card {
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  margin-bottom: 20px;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}
.card:hover { border-color: var(--border2); }
.card-header {
  padding: 16px 20px;
  background: var(--bg3);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.card-header h3 { font-size: 15px; font-weight: 700; display: flex; align-items: center; gap: 8px; margin: 0; color: var(--text); }
.card-body {
  padding: 20px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.provider-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; justify-content: flex-end; }
.provider-card { transition: border-color 0.2s, box-shadow 0.2s; }
.provider-card:hover { border-color: var(--border2); }
.weight-card {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px;
  margin-bottom: 20px;
}

.card-body [style*="overflow-x:auto"], [style*="overflow-x: auto"] {
  scrollbar-width: thin;
  scrollbar-color: rgba(148, 163, 184, 0.3) transparent;
  width: 100%;
}
.card-body [style*="overflow-x:auto"]::-webkit-scrollbar, [style*="overflow-x: auto"]::-webkit-scrollbar { width: 8px; height: 8px; }
.card-body [style*="overflow-x:auto"]::-webkit-scrollbar-track, [style*="overflow-x: auto"]::-webkit-scrollbar-track { background: transparent; }
.card-body [style*="overflow-x:auto"]::-webkit-scrollbar-thumb, [style*="overflow-x: auto"]::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.3); border-radius: 10px; border: 2px solid transparent; background-clip: content-box; }
.card-body [style*="overflow-x:auto"]::-webkit-scrollbar-thumb:hover, [style*="overflow-x: auto"]::-webkit-scrollbar-thumb:hover { background: rgba(148, 163, 184, 0.5); background-clip: content-box; }

/* ==================== FORMS & CONTROLS ==================== */
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
.form-group { margin-bottom: 14px; }
.form-group label { display: block; font-size: 13px; font-weight: 500; color: var(--text2); margin-bottom: 6px; }
.form-group input, .form-group select, .form-group textarea, .form-control {
  width: 100%;
  padding: 9px 12px;
  background: var(--bg4);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text);
  font-size: 13.5px;
  box-sizing: border-box;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.form-group input:focus, .form-group select:focus, .form-group textarea:focus, .form-control:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}
.form-group input::placeholder, .form-control::placeholder { color: var(--text3); }
.form-group textarea { min-height: 80px; resize: vertical; }
.form-actions { display: flex; gap: 10px; margin-top: 14px; align-items: center; }

.pwd-wrap { position: relative; }
.pwd-wrap input { padding-right: 36px; }
.pwd-eye { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); cursor: pointer; color: var(--text3); font-size: 16px; line-height: 1; user-select: none; }
.pwd-eye:hover { color: var(--text2); }

/* ==================== SWITCHES & TOGGLES ==================== */
.toggle {
  width: 44px;
  height: 24px;
  border-radius: 12px;
  background: var(--border2);
  position: relative;
  cursor: pointer;
  transition: background 0.25s;
}
.toggle.on { background: var(--accent); }
.toggle::after {
  content: '';
  position: absolute;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  top: 3px;
  left: 3px;
  transition: left 0.25s;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
}
.toggle.on::after { left: 23px; }

.switch { position: relative; display: inline-block; width: 42px; height: 24px; vertical-align: middle; }
.switch input { opacity: 0; width: 0; height: 0; }
.switch .slider { position: absolute; cursor: pointer; top: 0; right: 0; bottom: 0; left: 0; background: var(--border2); border-radius: 24px; transition: 0.25s; }
.switch .slider:before { content: ""; position: absolute; height: 18px; width: 18px; left: 3px; bottom: 3px; background: #fff; border-radius: 50%; transition: 0.25s; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3); }
.switch input:checked + .slider { background: var(--success); }
.switch input:checked + .slider:before { transform: translateX(18px); }

/* ==================== BUTTONS ==================== */
.btn {
  padding: 8px 16px;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  text-decoration: none;
}
.btn:active { transform: scale(0.98); }
.btn-primary { background: linear-gradient(135deg, var(--accent), #2563eb); color: #fff; box-shadow: 0 2px 8px rgba(59, 130, 246, 0.25); }
.btn-primary:hover { opacity: 0.92; box-shadow: 0 4px 14px rgba(59, 130, 246, 0.35); }
.btn-secondary { background: var(--bg3); color: var(--text2); border: 1px solid var(--border); }
.btn-secondary:hover { border-color: var(--border2); color: var(--text); background: var(--bg4); }
.btn-success { background: var(--success); color: #fff; }
.btn-success:hover { opacity: 0.92; }
.btn-warning { background: var(--warn); color: #111827; }
.btn-warning:hover { opacity: 0.92; }
.btn-danger { background: var(--danger); color: #fff; }
.btn-danger:hover { opacity: 0.92; }
.btn-sm { padding: 5px 10px; font-size: 12px; }

.btn-add {
  width: 100%;
  padding: 10px;
  border: 1px dashed var(--border2);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text2);
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
  margin-top: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
.btn-add:hover { border-color: var(--accent); color: var(--accent); background: rgba(59, 130, 246, 0.05); }

.btn-del {
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--danger);
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  flex: none;
}
.btn-del:hover { background: rgba(239, 68, 68, 0.12); }

.btn-test {
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #8b5cf6;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  flex: none;
}
.btn-test:hover { background: rgba(139, 92, 246, 0.12); }
.btn-test:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-quota-clear {
  border: none;
  background: transparent;
  color: var(--text3);
  cursor: pointer;
  font-size: 10px;
  line-height: 1;
  padding: 0;
}
.btn-quota-clear:hover { color: var(--danger); }

/* ==================== DATA TABLE ==================== */
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table thead th {
  text-align: left;
  padding: 10px 14px;
  color: var(--text2);
  font-weight: 600;
  font-size: 12px;
  border-bottom: 1px solid var(--border);
  background: var(--bg3);
  white-space: nowrap;
}
.data-table tbody tr { border-bottom: 1px solid var(--border); transition: background 0.15s; }
.data-table tbody tr:hover { background: rgba(59, 130, 246, 0.04); }
.data-table tbody td { padding: 12px 14px; vertical-align: middle; color: var(--text); }
.data-table tbody td .actions { display: flex; gap: 6px; flex-wrap: nowrap; align-items: center; }

/* Copy cell */
.copy-cell { position: relative; display: block; cursor: pointer; min-width: 0; padding-right: 0; }
.copy-cell-text { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding-right: 38px; }
.copy-cell-btn {
  position: absolute;
  right: 2px;
  top: 50%;
  transform: translateY(-50%);
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 10px;
  line-height: 16px;
  color: var(--text3);
  background: var(--card);
  border: 1px solid var(--border);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.12s, color 0.12s, border-color 0.12s;
}
.copy-cell:hover .copy-cell-btn { opacity: 1; }
.copy-cell:hover .copy-cell-text { color: var(--accent2); }
.copy-cell-btn.done { opacity: 1; color: var(--success); border-color: var(--success); }

.order-link { cursor: pointer; color: var(--primary); text-decoration: underline; text-underline-offset: 2px; }
.order-link:hover { color: var(--accent2); }
.order-link:active { opacity: 0.7; }

/* IP Cell */
.ip-cell { display: flex; flex-direction: column; gap: 2px; line-height: 1.35; }
.ip-cell .ip-val { font-family: monospace; font-size: 12px; color: var(--text2); cursor: pointer; word-break: break-all; }
.ip-cell .ip-val:hover { color: var(--accent2); }
.ip-cell .ip-addr { font-size: 11px; color: var(--text3); word-break: break-all; }
.ip-badge {
  display: inline-block;
  padding: 1px 7px;
  border-radius: 5px;
  font-size: 11px;
  font-weight: 600;
  background: rgba(59, 130, 246, 0.12);
  color: #60a5fa;
  border: 1px solid rgba(59, 130, 246, 0.2);
  white-space: nowrap;
}
.ip-badge.flag { background: rgba(245, 158, 11, 0.12); color: #fbbf24; border-color: rgba(245, 158, 11, 0.22); }
html[data-theme="light"] .ip-badge { color: #1d4ed8; }
html[data-theme="light"] .ip-badge.flag { color: #b45309; }

/* Scene Badges */
.scene-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.3px;
  white-space: nowrap;
  transition: transform 0.15s, box-shadow 0.15s;
}
.scene-badge:hover { transform: translateY(-1px); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12); }
.scene-user_register { background: rgba(59, 130, 246, 0.12); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.2); }
.scene-user_reset { background: rgba(245, 158, 11, 0.12); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.2); }
.scene-admin_reset { background: rgba(16, 185, 129, 0.12); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.2); }
.scene-referral_withdrawal { background: rgba(168, 85, 247, 0.12); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.2); }
.scene-feedback_reply { background: rgba(14, 165, 233, 0.12); color: #38bdf8; border: 1px solid rgba(14, 165, 233, 0.2); }
.scene-feedback_new { background: rgba(249, 115, 22, 0.12); color: #fb923c; border: 1px solid rgba(249, 115, 22, 0.2); }
.scene-daily_report { background: rgba(99, 102, 241, 0.12); color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.2); }
.scene-refund_approved { background: rgba(239, 68, 68, 0.12); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.2); }
.scene-refund_rejected { background: rgba(245, 158, 11, 0.12); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.2); }
.scene-refund_request { background: rgba(168, 85, 247, 0.12); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.2); }
.format-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  background: var(--bg);
  border: 1px solid var(--border);
  color: var(--text2);
}

.badge { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 6px; font-size: 11.5px; font-weight: 600; white-space: nowrap; }
.badge-success { background: rgba(16, 185, 129, 0.12); color: var(--success); border: 1px solid rgba(16, 185, 129, 0.25); }
.badge-danger { background: rgba(239, 68, 68, 0.12); color: var(--danger); border: 1px solid rgba(239, 68, 68, 0.25); }
.badge-warning { background: rgba(245, 158, 11, 0.12); color: var(--warn); border: 1px solid rgba(245, 158, 11, 0.25); }
.badge-info { background: rgba(59, 130, 246, 0.12); color: var(--accent); border: 1px solid rgba(59, 130, 246, 0.25); }

/* ==================== FILTERS & CONTROLS ==================== */
.filter-grid { display: grid; grid-template-columns: repeat(5, minmax(120px, 1fr)); gap: 10px; margin-bottom: 14px; }
.filter-grid input, .filter-grid select { padding: 8px 10px; background: var(--bg4); border: 1px solid var(--border); border-radius: 8px; color: var(--text); font-size: 12px; }
.pager { display: flex; gap: 8px; align-items: center; justify-content: flex-end; margin-top: 14px; color: var(--text2); font-size: 12px; }
.log-detail { margin-top: 8px; padding: 10px; background: var(--bg4); border: 1px solid var(--border); border-radius: 8px; white-space: pre-wrap; word-break: break-word; color: var(--text2); }
.chip { display: inline-flex; align-items: center; padding: 3px 8px; border-radius: 999px; background: rgba(59, 130, 246, 0.12); color: var(--accent2); font-size: 11px; }

/* Plan config */
.sort-btn { border: 1px solid var(--border); background: var(--bg2); color: var(--text2); width: 24px; height: 20px; border-radius: 4px 4px 0 0; cursor: pointer; font-size: 10px; display: flex; align-items: center; justify-content: center; }
.sort-btn.sort-btn-bottom { border-top: none; border-radius: 0 0 4px 4px; }
.plan-type-badge { display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; }
.plan-type-badge.monthly { background: rgba(6, 182, 212, 0.15); color: #22d3ee; }
.plan-type-badge.points { background: rgba(16, 185, 129, 0.15); color: #10b981; }

/* ==================== COLLAPSIBLE SECTIONS ==================== */
.section-title { font-size: 14px; font-weight: 600; color: var(--text); margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid var(--border); }
.collapsible-section { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); margin-bottom: 18px; overflow: hidden; }
.collapsible-section:hover { border-color: var(--border2); }
.collapsible-section .section-title { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 0; padding: 16px 20px; border-bottom: none; cursor: pointer; user-select: none; background: var(--bg3); }
.collapsible-section .section-title:hover { background: var(--bg4); }
.collapsible-section .section-title .st-text { display: flex; align-items: center; gap: 10px; font-size: 15px; font-weight: 700; }
.collapsible-section .section-title .st-right { display: flex; align-items: center; gap: 12px; }
.collapsible-section .section-title .st-arrow { font-size: 12px; color: var(--text3); min-width: 56px; text-align: right; white-space: nowrap; }
.collapsible-section .section-body { padding: 20px; }

/* ==================== AI MODELS & PROVIDERS ==================== */
.models-title { font-size: 13px; font-weight: 500; color: var(--text2); margin: 16px 0 10px; }
.model-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; }
.model-row input { padding: 8px 12px; background: var(--bg4); border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text); font-size: 13px; box-sizing: border-box; }
.model-row input:focus { outline: none; border-color: var(--accent); }
.model-search-bar { display: flex; align-items: center; gap: 8px; margin: 0 0 14px; }
.search-input { flex: 1; max-width: 360px; padding: 9px 14px; background: var(--bg4); border: 1px solid var(--border); border-radius: 10px; color: var(--text); font-size: 13px; box-sizing: border-box; }
.search-input:focus { outline: none; border-color: var(--accent); }
.search-clear { border: none; background: var(--bg4); color: var(--text3); cursor: pointer; font-size: 18px; width: 32px; height: 32px; border-radius: 8px; flex: none; display: flex; align-items: center; justify-content: center; }
.search-clear:hover { color: var(--danger); }

.model-test-result { margin: -2px 4px 8px; padding: 7px 12px; border-radius: 6px; font-size: 12px; line-height: 1.6; word-break: break-all; animation: slideUp 0.2s; }
.model-test-result.ok { background: rgba(34, 197, 94, 0.1); color: #16a34a; border: 1px solid rgba(34, 197, 94, 0.25); }
.model-test-result.fail { background: rgba(239, 68, 68, 0.1); color: #dc2626; border: 1px solid rgba(239, 68, 68, 0.25); }
.model-test-result.loading { background: var(--bg3); color: var(--text2); border: 1px solid var(--border); }

.provider-tag { display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 500; }
.tag-openai { background: rgba(59, 130, 246, 0.1); color: var(--accent2); border: 1px solid rgba(59, 130, 246, 0.2); }
.tag-claude { background: rgba(245, 158, 11, 0.1); color: var(--warn); border: 1px solid rgba(245, 158, 11, 0.2); }
.tag-hub { background: rgba(16, 185, 129, 0.1); color: var(--success); border: 1px solid rgba(16, 185, 129, 0.25); }
.tag-gemini { background: rgba(16, 185, 129, 0.1); color: var(--success); border: 1px solid rgba(16, 185, 129, 0.2); }
.tag-tencent_ses { background: rgba(59, 130, 246, 0.1); color: var(--accent2); border: 1px solid rgba(59, 130, 246, 0.2); }
.tag-custom { background: rgba(148, 163, 184, 0.1); color: var(--text2); border: 1px solid var(--border); }

.quota-badge { font-size: 11px; font-weight: 600; padding: 2px 7px; border-radius: 10px; white-space: nowrap; line-height: 1.6; }
.quota-badge.exhausted { background: rgba(239, 68, 68, 0.12); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); }
.quota-badge.daily { background: rgba(245, 158, 11, 0.12); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); }
.quota-badge.ok { background: rgba(34, 197, 94, 0.1); color: #16a34a; border: 1px solid rgba(34, 197, 94, 0.25); }
.quota-badge.none { background: var(--bg4); color: var(--text3); border: 1px solid var(--border); }
.quota-badge.expired { background: rgba(148, 163, 184, 0.14); color: var(--text3); border: 1px solid rgba(148, 163, 184, 0.35); }

.weight-chart { margin: 14px 4px 4px; padding: 12px 14px; background: var(--bg2); border: 1px solid var(--border); border-radius: 12px; }
.weight-chart-title { font-size: 12px; color: var(--text3); font-weight: 600; margin-bottom: 10px; }
.weight-chart-body { display: flex; gap: 18px; align-items: center; flex-wrap: wrap; }
.weight-legend { display: flex; flex-direction: column; gap: 5px; flex: 1; min-width: 160px; }
.legend-item { display: flex; align-items: center; gap: 8px; font-size: 12px; }
.legend-dot { width: 10px; height: 10px; border-radius: 3px; flex: none; }
.legend-label { color: var(--text2); flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.legend-pct { color: var(--text); font-weight: 600; font-variant-numeric: tabular-nums; }
.weight-empty { color: var(--text3); font-size: 12px; padding: 6px 0; }

/* ==================== INFO TIPS & LISTS ==================== */
.info-tips { font-size: 13px; color: var(--text2); line-height: 1.8; }
.info-tips .tip-row { display: flex; gap: 10px; align-items: flex-start; margin-bottom: 8px; }
.info-tips .tip-num {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--bg4);
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  color: var(--text2);
  flex-shrink: 0;
  margin-top: 1px;
}
.info-tips .tip-text { flex: 1; }
.info-tips .warn { color: var(--warn); margin-top: 8px; display: flex; align-items: center; gap: 6px; }

.info-list .info-row { display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--border); }
.info-list .info-row:last-child { border-bottom: none; }
.info-list .info-label { color: var(--text2); font-size: 13px; width: 120px; flex-shrink: 0; }
.info-list .info-value { flex: 1; font-size: 13px; color: var(--text); word-break: break-all; }
.info-list .info-value .mask { color: var(--text3); font-family: monospace; }

/* ==================== MESSAGES & STATUS ==================== */
.msg { padding: 10px 14px; border-radius: var(--radius-sm); font-size: 13px; margin-bottom: 16px; display: none; animation: slideIn 0.3s ease; }
.msg.show { display: block; }
.msg.success { background: rgba(16, 185, 129, 0.1); color: var(--success); border: 1px solid rgba(16, 185, 129, 0.2); }
.msg.error { background: rgba(239, 68, 68, 0.1); color: var(--danger); border: 1px solid rgba(239, 68, 68, 0.2); }
.msg.warn { background: rgba(245, 158, 11, 0.1); color: var(--warn); border: 1px solid rgba(245, 158, 11, 0.2); }
@keyframes slideIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }

.status-bar { display: flex; align-items: center; gap: 8px; padding: 10px 14px; background: var(--bg3); border-radius: var(--radius-sm); margin-bottom: 16px; font-size: 13px; }
.status-dot { width: 8px; height: 8px; border-radius: 50%; }
.status-dot.on { background: var(--success); box-shadow: 0 0 8px rgba(16, 185, 129, 0.4); }
.status-dot.off { background: var(--text3); }

.empty-state { text-align: center; padding: 36px 20px; color: var(--text3); }
.empty-state .icon { font-size: 32px; margin-bottom: 10px; opacity: 0.5; }
.empty-state p { font-size: 13px; margin: 0; }

/* ==================== DASHBOARD ==================== */
.dashboard-hero { position: relative; overflow: hidden; border: 1px solid rgba(96, 165, 250, 0.16); border-radius: 18px; padding: 22px; margin-bottom: 18px; background: radial-gradient(circle at 12% 10%, rgba(59, 130, 246, 0.28), transparent 32%), linear-gradient(135deg, #0f1724, #111827 62%, #0b1120); }
.dashboard-hero::after { content: ''; position: absolute; top: 0; right: 0; bottom: 0; left: 0; background: linear-gradient(120deg, transparent, rgba(255, 255, 255, 0.06), transparent); transform: translateX(-70%); animation: dashSweep 5s infinite; }
.dashboard-hero h2 { position: relative; font-size: 24px; margin-bottom: 6px; letter-spacing: 0.5px; }
.dashboard-hero p { position: relative; color: var(--text2); font-size: 13px; }
@keyframes dashSweep { 50%, 100% { transform: translateX(120%); } }

.metric-grid { display: grid; grid-template-columns: repeat(6, minmax(120px, 1fr)); gap: 14px; margin-bottom: 18px; }
.metric-grid-4 { display: grid; grid-template-columns: repeat(4, minmax(120px, 1fr)); gap: 14px; margin-bottom: 18px; }
.note-bar { background: rgba(96, 165, 250, 0.08); border: 1px solid rgba(96, 165, 250, 0.18); border-radius: 12px; padding: 10px 14px; font-size: 12px; line-height: 1.7; color: var(--text2); margin-bottom: 18px; }
.metric-card { position: relative; overflow: hidden; background: linear-gradient(180deg, rgba(26, 35, 50, 0.92), rgba(15, 23, 36, 0.92)); border: 1px solid rgba(96, 165, 250, 0.12); border-radius: 16px; padding: 16px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18); }
.metric-card::before { content: ''; position: absolute; right: -28px; top: -28px; width: 72px; height: 72px; border-radius: 50%; background: rgba(96, 165, 250, 0.1); }
.metric-label { font-size: 12px; color: var(--text2); margin-bottom: 8px; }
.metric-value { font-size: 28px; font-weight: 800; letter-spacing: 0.5px; }
.metric-sub { font-size: 11px; color: var(--text3); margin-top: 4px; }
.dash-grid { display: grid; grid-template-columns: 1.45fr 0.9fr; gap: 18px; }
.dash-toolbar { margin-bottom: 18px; }

.date-range { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; background: var(--bg2); border: 1px solid var(--border); border-radius: 12px; padding: 12px 16px; }
.date-field { display: flex; align-items: center; gap: 6px; }
.date-label { font-size: 12px; color: var(--text3); font-weight: 600; white-space: nowrap; }
.date-input { background: var(--bg); color: var(--text); border: 1px solid var(--border); border-radius: 8px; padding: 6px 12px; font-size: 13px; cursor: pointer; outline: none; transition: border-color 0.2s; color-scheme: dark; min-width: 130px; }
.date-input::-webkit-calendar-picker-indicator { filter: invert(0.7); cursor: pointer; opacity: 0.8; transition: opacity 0.2s; }
.date-input::-webkit-calendar-picker-indicator:hover { opacity: 1; }
.date-input:hover { border-color: var(--accent); }
.date-input:focus { border-color: var(--accent); box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15); }
.date-sep { color: var(--text3); font-size: 14px; }
.date-quicks { display: flex; gap: 6px; margin-left: 8px; padding-left: 12px; border-left: 1px solid var(--border); }
.date-quick { background: transparent; color: var(--text2); border: 1px solid var(--border); border-radius: 8px; padding: 6px 14px; font-size: 12px; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
.date-quick:hover { border-color: var(--accent); color: var(--accent); background: rgba(59, 130, 246, 0.06); }
.date-quick.active { background: var(--accent); color: #fff; border-color: var(--accent); }

.revenue-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
.revenue-card { background: var(--bg); border: 1px solid var(--border); border-radius: 12px; padding: 16px; text-align: center; }
.revenue-label { font-size: 12px; color: var(--text3); margin-bottom: 6px; }
.revenue-value { font-size: 26px; font-weight: 800; letter-spacing: 0.5px; }
.revenue-sub { font-size: 11px; color: var(--text3); margin-top: 4px; }

.chart-card { background: var(--bg2); border: 1px solid var(--border); border-radius: 16px; padding: 18px; overflow: hidden; }
.chart-title { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.chart-title h3 { font-size: 15px; }
.chart-title span { font-size: 12px; color: var(--text3); }
.line-chart { width: 100%; height: 240px; background: linear-gradient(180deg, rgba(59, 130, 246, 0.06), transparent); border-radius: 14px; }
.bar-list { display: flex; flex-direction: column; gap: 12px; }
.bar-row { display: grid; grid-template-columns: 130px 1fr 44px; align-items: center; gap: 10px; font-size: 12px; }
.bar-name { color: var(--text2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bar-track { height: 10px; border-radius: 999px; background: var(--bg4); overflow: hidden; }
.bar-fill { height: 100%; border-radius: 999px; background: linear-gradient(90deg, var(--accent), var(--success)); }
.stack-bars { display: flex; align-items: end; gap: 10px; height: 190px; padding-top: 12px; }
.stack-item { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; }
.stack-col { height: 145px; width: 100%; display: flex; align-items: end; gap: 2px; justify-content: center; }
.stack-ok, .stack-bad { width: 18px; border-radius: 8px 8px 3px 3px; min-height: 3px; }
.stack-ok { background: var(--success); }
.stack-bad { background: var(--danger); }
.stack-label { font-size: 11px; color: var(--text3); }
.analysis-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-bottom: 18px; }

/* ==================== MODALS ==================== */
.modal-overlay {
  position: fixed; top: 0; right: 0; bottom: 0; left: 0; background: rgba(0, 0, 0, 0.65);
  display: flex; align-items: center; justify-content: center; z-index: 9999;
  padding: 16px; overflow: auto; animation: fadeIn 0.2s; -webkit-backdrop-filter: blur(4px); backdrop-filter: blur(4px);
}
.modal {
  background: var(--bg2); border: 1px solid var(--border);
  border-radius: var(--radius); width: min(480px, calc(100vw - 32px)); max-width: 480px; padding: 24px;
  animation: slideUp 0.3s; box-shadow: 0 20px 48px rgba(0, 0, 0, 0.4);
}
.modal h3 { margin-bottom: 16px; font-size: 17px; }
.modal .form-row { grid-template-columns: 1fr; }
.modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 16px; }

.modal-card {
  background: var(--bg2); border: 1px solid var(--border);
  border-radius: var(--radius); width: min(540px, calc(100vw - 32px)); max-width: 540px; padding: 0;
  animation: slideUp 0.3s; overflow: hidden; display: flex; flex-direction: column; max-height: calc(100vh - 32px);
  box-shadow: 0 20px 48px rgba(0, 0, 0, 0.4);
}
.modal-card .modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; border-bottom: 1px solid var(--border); background: var(--bg3);
}
.modal-card .modal-header h3 { margin: 0; font-size: 16px; font-weight: 600; }
.modal-card .modal-header .btn-close {
  width: 30px; height: 30px; border-radius: 8px; border: 1px solid var(--border);
  background: var(--bg2); color: var(--text2); font-size: 20px; line-height: 1;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all 0.2s; flex-shrink: 0; margin-left: 12px;
}
.modal-card .modal-header .btn-close:hover { background: rgba(239, 68, 68, 0.15); border-color: rgba(239, 68, 68, 0.4); color: var(--danger); }
.modal-card .modal-body { padding: 20px; overflow-y: auto; scrollbar-width: thin; scrollbar-color: rgba(148, 163, 184, 0.25) transparent; }
.modal-card .modal-body::-webkit-scrollbar { width: 5px; height: 5px; }
.modal-card .modal-body::-webkit-scrollbar-track { background: transparent; margin: 4px 0; }
.modal-card .modal-body::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.25); border-radius: 10px; }
.modal-card .modal-body::-webkit-scrollbar-thumb:hover { background: rgba(148, 163, 184, 0.4); }
.modal-card .modal-body .form-group { margin-bottom: 16px; }
.modal-card .modal-body .form-group:last-child { margin-bottom: 0; }
.modal-card .modal-body label { font-size: 13px; color: var(--text2); margin-bottom: 6px; display: block; }
.modal-card .modal-body input, .modal-card .modal-body select, .modal-card .modal-body textarea {
  width: 100%; padding: 10px 12px; border: 1px solid var(--border); border-radius: 8px;
  background: var(--bg); color: var(--text); font-size: 13px; outline: none; transition: border-color 0.2s;
}
.modal-card .modal-body input:focus, .modal-card .modal-body select:focus, .modal-card .modal-body textarea:focus { border-color: var(--brand); }
.modal-card .modal-body textarea { resize: vertical; min-height: 120px; line-height: 1.6; }
.modal-card .modal-footer {
  display: flex; gap: 10px; justify-content: flex-end;
  padding: 14px 20px; border-top: 1px solid var(--border); background: var(--bg3);
}
.modal-card .format-tabs { display: flex; gap: 8px; }
.modal-card .format-tabs .btn { flex: 1; justify-content: center; }
.modal-card .var-tag {
  display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 6px;
  background: var(--bg); border: 1px solid var(--border); font-family: monospace; font-size: 12px; color: var(--brand); cursor: pointer;
  transition: all 0.2s;
}
.modal-card .var-tag:hover { border-color: var(--brand); background: rgba(59, 130, 246, 0.1); }
.html-preview-container { margin-top: 12px; border: 1px solid var(--border); border-radius: 8px; overflow: hidden; background: #fff; }
.html-preview-header { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: var(--bg3); border-bottom: 1px solid var(--border); font-size: 12px; color: var(--text2); }
.html-preview-tip { font-size: 11px; color: var(--text3); }
.html-preview-frame { width: 100%; min-height: 300px; border: none; background: #fff; }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

/* ==================== LOGIN & VERIFICATION ==================== */
.login-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; background: var(--bg); }
.login-card { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); width: 100%; max-width: 380px; padding: 36px; box-shadow: var(--shadow-lg); }
.login-card h2 { text-align: center; margin-bottom: 24px; font-size: 20px; display: flex; align-items: center; justify-content: center; gap: 8px; }
.login-card input { width: 100%; margin-bottom: 14px; }
.login-card .footer-links { display: flex; justify-content: space-between; margin-top: 12px; font-size: 12px; }
.login-card .footer-links a { color: var(--accent2); cursor: pointer; text-decoration: none; }
.login-card .footer-links a:hover { text-decoration: underline; }

.slider-verify { margin: 4px 0 14px; padding: 12px; border: 1px solid var(--border); border-radius: 12px; background: var(--bg4); user-select: none; }
.slider-verify .slider-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; font-size: 12px; color: var(--text2); }
.slider-verify .slider-state { color: var(--text3); }
.slider-verify.done { border-color: rgba(16, 185, 129, 0.45); background: rgba(16, 185, 129, 0.08); }
.slider-verify.done .slider-state { color: var(--success); }
.hub-box, .puzzle-box { position: relative; height: auto; overflow: hidden; background: #0f1724; border: 1px solid rgba(96, 165, 250, 0.16); border-radius: 12px; margin-bottom: 10px; }
.hub-box .puzzle-bg { display: block; width: 100%; height: auto; user-select: none; -webkit-user-drag: none; }
.hub-box .puzzle-piece-img, .puzzle-piece { position: absolute; left: 0; top: 0; max-width: none; user-select: none; -webkit-user-drag: none; box-shadow: 0 8px 20px rgba(59, 130, 246, 0.32); border-radius: 4px; }
.hub-box.busy { opacity: 0.6; }
.hub-skeleton { color: var(--text3); font-size: 12px; text-align: center; padding: 22px 0; }
.puzzle-gap { position: absolute; border: 2px dashed rgba(255,255,255,0.4); border-radius: 4px; }
.puzzle-track { position: relative; height: 42px; border-radius: 999px; background: rgba(15, 23, 36, 0.9); border: 1px solid var(--border); overflow: hidden; }
.puzzle-progress { position: absolute; left: 0; top: 0; height: 100%; background: linear-gradient(90deg, rgba(59, 130, 246, 0.25), rgba(16, 185, 129, 0.18)); }
.puzzle-thumb { position: absolute; left: 0; top: 3px; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: #fff; color: #0f1724; cursor: grab; font-weight: 900; box-shadow: 0 5px 14px rgba(0, 0, 0, 0.25); touch-action: none; }
.puzzle-thumb:active { cursor: grabbing; }
.puzzle-tip { position: absolute; top: 0; right: 0; bottom: 0; left: 0; display: flex; align-items: center; justify-content: center; color: var(--text3); font-size: 12px; pointer-events: none; }

.theme-toggle {
  width: 34px; height: 34px; border-radius: 10px; border: 1px solid var(--border2);
  background: var(--bg3); color: var(--text2); cursor: pointer; font-size: 15px;
  display: flex; align-items: center; justify-content: center; transition: all 0.2s;
  flex-shrink: 0; line-height: 1;
}
.theme-toggle:hover { color: var(--accent2); border-color: var(--accent); }
.login-theme-toggle { position: fixed; top: 16px; right: 22px; z-index: 10; }

/* Submenu & Dock fallback classes */
.dock-item { display: inline-flex; align-items: center; }
.mobile-submenu, .mobile-submenu-close, .mobile-submenu-header, .mobile-submenu-item, .mobile-submenu-overlay { display: none; }
.code-box { display: inline-block; background: var(--bg3); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 8px 12px; font-family: monospace; }

/* ==================== RESPONSIVE (MOBILE) ==================== */
.mobile-menu-toggle {
  display: none;
  position: absolute;
  left: 12px;
  top: 10px;
  z-index: 85;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--bg2);
  color: var(--text);
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.mobile-menu-overlay {
  display: none;
  position: fixed;
  top: 0; right: 0; bottom: 0; left: 0;
  background: rgba(0, 0, 0, 0.55);
  z-index: 90;
  -webkit-backdrop-filter: blur(3px); backdrop-filter: blur(3px);
}

@media (max-width: 768px) {
  .app-layout { display: flex; flex-direction: column; height: 100vh; height: 100dvh; }
  .sidebar {
    position: fixed; left: 0; top: 0; bottom: 0; z-index: 100;
    width: 260px; max-width: 84vw; overflow: hidden;
    border-right: 1px solid var(--border2);
    background: var(--bg2);
    -webkit-backdrop-filter: blur(18px); backdrop-filter: blur(18px);
    box-shadow: 4px 0 24px rgba(0, 0, 0, 0.45);
    transform: translateX(-100%); transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .sidebar.open { transform: translateX(0); }
  .sidebar-close-btn { display: flex; }
  .sidebar-header { display: flex; }
  .mobile-menu-toggle { display: flex !important; }
  .mobile-menu-overlay.show { display: block; }

  .main-content { height: 100vh; height: 100dvh; width: 100%; }
  .main-header { padding: 0 108px 0 54px; height: 56px; }
  .main-header .breadcrumb, .main-header .breadcrumb-nav { display: none !important; }
  .main-body { padding: 14px 12px calc(24px + env(safe-area-inset-bottom)) !important; }

  .top-account { right: 12px; top: 9px; }
  .theme-toggle { width: 32px; height: 32px; font-size: 13px; }

  .card-body { padding: 14px 12px; }
  .form-row { grid-template-columns: 1fr; gap: 10px; }
  .model-row { flex-wrap: wrap; }
  .model-row input { flex: 1 1 100% !important; width: 100% !important; }
  .model-row .btn-del { width: 100%; height: 34px; }
  .status-bar { align-items: flex-start; flex-wrap: wrap; }
  .status-bar > span:last-child { margin-left: 0 !important; width: 100%; justify-content: flex-start; }
  .card-header { align-items: flex-start; flex-direction: column; gap: 8px; }
  .provider-actions { width: 100%; justify-content: flex-start; }
  .metric-grid, .dash-grid { grid-template-columns: 1fr; }
  .metric-grid-4 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .analysis-cols { grid-template-columns: 1fr !important; }
  .revenue-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .filter-grid { grid-template-columns: 1fr 1fr; gap: 8px; }
  .data-table { font-size: 12px; }
  .data-table th, .data-table td { padding: 8px 8px; }
  .filter-tab-group { width: 100%; overflow-x: auto; flex-wrap: nowrap; }
  .filter-tab { flex: 0 0 auto; white-space: nowrap; }
}

/* ==================== LIGHT THEME OVERRIDES ==================== */
html[data-theme="light"] {
  color-scheme: light;
  --bg: #f8fafc;
  --bg2: #ffffff;
  --bg3: #f1f5f9;
  --bg4: #e2e8f0;
  --border: #e2e8f0;
  --border2: #cbd5e1;
  --text: #0f172a;
  --text1: #0f172a;
  --text2: #475569;
  --text3: #64748b;
  --accent: #2563eb;
  --accent2: #3b82f6;
  --accent-subtle: rgba(37, 99, 235, 0.1);
  --success: #059669;
  --success-subtle: rgba(5, 150, 105, 0.1);
  --warn: #b45309;
  --warning: #b45309;
  --warn-subtle: rgba(180, 83, 9, 0.1);
  --danger: #dc2626;
  --danger-subtle: rgba(220, 38, 38, 0.1);
  --primary: #2563eb;
  --brand: #2563eb;
  --card: #ffffff;
  --chart-grid: rgba(15, 23, 42, 0.08);
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04);
}
html[data-theme="light"] body { background: var(--bg); color: var(--text); }
html[data-theme="light"] .top-menu, html[data-theme="light"] .top-menu::before { background: #ffffff; border-color: var(--border); }
html[data-theme="light"] .top-menu { box-shadow: 0 20px 48px rgba(15, 23, 42, 0.16); }
html[data-theme="light"] .top-menu .danger { color: var(--danger); }
html[data-theme="light"] .mobile-menu-toggle { background: #ffffff; border-color: var(--border); color: var(--text); }
html[data-theme="light"] .sidebar { background: var(--bg2); }
html[data-theme="light"] .hub-box { background: #dbeafe; border-color: rgba(59, 130, 246, 0.3); }
html[data-theme="light"] .puzzle-box { background: linear-gradient(135deg, #dbeafe, #eef2f7); border-color: rgba(59, 130, 246, 0.3); }
html[data-theme="light"] .puzzle-track { background: rgba(148, 163, 184, 0.35); border-color: var(--border); }
html[data-theme="light"] .puzzle-thumb { color: #1f2937; }
html[data-theme="light"] .dashboard-hero { background: radial-gradient(circle at 12% 10%, rgba(59, 130, 246, 0.14), transparent 32%), linear-gradient(135deg, #ffffff, #f4f6fa 62%, #eef2f7); }
html[data-theme="light"] .dashboard-hero::after { background: linear-gradient(120deg, transparent, rgba(255, 255, 255, 0.5), transparent); }
html[data-theme="light"] .metric-card { background: linear-gradient(180deg, #ffffff, #f8fafc); border-color: var(--border); box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06); }
html[data-theme="light"] .metric-card::before { background: rgba(59, 130, 246, 0.08); }
html[data-theme="light"] .date-input { color-scheme: light; }
html[data-theme="light"] .date-input::-webkit-calendar-picker-indicator { filter: none; }
html[data-theme="light"] .data-table .scene-user_register { color: #2563eb; }
html[data-theme="light"] .data-table .scene-user_reset { color: #b45309; }
html[data-theme="light"] .data-table .scene-admin_reset { color: #047857; }
html[data-theme="light"] .data-table .scene-referral_withdrawal { color: #7c3aed; }
html[data-theme="light"] .data-table .scene-feedback_reply { color: #0369a1; }
html[data-theme="light"] .data-table .scene-feedback_new { color: #c2410c; }
html[data-theme="light"] .data-table .scene-daily_report { color: #4f46e5; }
html[data-theme="light"] .data-table .scene-refund_approved { color: #dc2626; }
html[data-theme="light"] .data-table .scene-refund_rejected { color: #b45309; }
html[data-theme="light"] .data-table .scene-refund_request { color: #9333ea; }
html[data-theme="light"] .model-test-result.ok { color: #16a34a; }
html[data-theme="light"] .model-test-result.fail { color: #dc2626; }
"""

# Let's verify class coverage against old_style.css
with open('tools/old_style.css', 'r', encoding='utf-8') as f:
    old_css = f.read()

old_classes = set(re.findall(r'\.([a-zA-Z_][a-zA-Z0-9_-]*)', old_css))
new_classes = set(re.findall(r'\.([a-zA-Z_][a-zA-Z0-9_-]*)', css_code))

missing = old_classes - new_classes
print(f"Total old classes: {len(old_classes)}")
print(f"Total new classes: {len(new_classes)}")
print(f"Missing classes: {len(missing)}")
if missing:
    print("Missing classes list:", sorted(list(missing)))
    exit(1)
else:
    print("SUCCESS: 100% of old classes are covered!")

# Now let's inject this stylesheet into static/admin.html
with open('static/admin.html', 'r', encoding='utf-8') as f:
    html = f.read()

style_start = html.find('<style>')
style_end = html.find('</style>')

updated_html = html[:style_start + len('<style>')] + '\n' + css_code.strip() + '\n' + html[style_end:]

with open('static/admin.html', 'w', encoding='utf-8') as f:
    f.write(updated_html)

print("Updated static/admin.html successfully!")
