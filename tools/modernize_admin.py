# -*- coding: utf-8 -*-
import re
import sys

def get_svg_sprites():
    return '''  <!-- ==================== 0-EMOJI SVG SPRITE POOL ==================== -->
  <svg style="position:absolute;width:0;height:0;overflow:hidden;" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <symbol id="i-layout-dashboard" viewBox="0 0 24 24"><rect width="7" height="9" x="3" y="3" rx="1"></rect><rect width="7" height="5" x="14" y="3" rx="1"></rect><rect width="7" height="9" x="14" y="12" rx="1"></rect><rect width="7" height="5" x="3" y="16" rx="1"></rect></symbol>
      <symbol id="i-users" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></symbol>
      <symbol id="i-user" viewBox="0 0 24 24"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></symbol>
      <symbol id="i-user-check" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><polyline points="16 11 18 13 22 9"></polyline></symbol>
      <symbol id="i-user-plus" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="19" x2="19" y1="8" y2="14"></line><line x1="22" x2="16" y1="11" y2="11"></line></symbol>
      <symbol id="i-shield" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></symbol>
      <symbol id="i-shield-alert" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></symbol>
      <symbol id="i-database" viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"></path></symbol>
      <symbol id="i-book-open" viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></symbol>
      <symbol id="i-pie-chart" viewBox="0 0 24 24"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></symbol>
      <symbol id="i-bar-chart" viewBox="0 0 24 24"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></symbol>
      <symbol id="i-trending-up" viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></symbol>
      <symbol id="i-file-text" viewBox="0 0 24 24"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><line x1="10" y1="9" x2="8" y2="9"></line></symbol>
      <symbol id="i-cpu" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></symbol>
      <symbol id="i-bot" viewBox="0 0 24 24"><rect width="18" height="12" x="3" y="6" rx="2"></rect><path d="M9 14v1"></path><path d="M15 14v1"></path><path d="M12 2v4"></path><path d="M2 10h1"></path><path d="M21 10h1"></path></symbol>
      <symbol id="i-activity" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></symbol>
      <symbol id="i-award" viewBox="0 0 24 24"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></symbol>
      <symbol id="i-settings" viewBox="0 0 24 24"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></symbol>
      <symbol id="i-wallet" viewBox="0 0 24 24"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"></path><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"></path></symbol>
      <symbol id="i-message-square" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></symbol>
      <symbol id="i-bell" viewBox="0 0 24 24"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path></symbol>
      <symbol id="i-credit-card" viewBox="0 0 24 24"><rect width="20" height="14" x="2" y="5" rx="2"></rect><line x1="2" x2="22" y1="10" y2="10"></line></symbol>
      <symbol id="i-receipt" viewBox="0 0 24 24"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"></path><path d="M16 8h-8"></path><path d="M16 12h-8"></path><path d="M12 16h-4"></path></symbol>
      <symbol id="i-rotate-ccw" viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></symbol>
      <symbol id="i-refresh-cw" viewBox="0 0 24 24"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path><path d="M3 21v-5h5"></path></symbol>
      <symbol id="i-layers" viewBox="0 0 24 24"><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"></path><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"></path><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"></path></symbol>
      <symbol id="i-zap" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></symbol>
      <symbol id="i-play-circle" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></symbol>
      <symbol id="i-key" viewBox="0 0 24 24"><circle cx="7.5" cy="15.5" r="5.5"></circle><path d="m21 2-9.6 9.6"></path><path d="m15.5 7.5 3 3L22 7l-3-3"></path></symbol>
      <symbol id="i-store" viewBox="0 0 24 24"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"></path><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"></path><path d="M2 7h20"></path></symbol>
      <symbol id="i-ticket" viewBox="0 0 24 24"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"></path><path d="M13 5v2"></path><path d="M13 17v2"></path><path d="M13 11v2"></path></symbol>
      <symbol id="i-flag" viewBox="0 0 24 24"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></symbol>
      <symbol id="i-package" viewBox="0 0 24 24"><path d="m7.5 4.27 9 5.15"></path><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path><path d="m3.3 7 8.7 5 8.7-5"></path><path d="M12 22V12"></path></symbol>
      <symbol id="i-sliders" viewBox="0 0 24 24"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></symbol>
      <symbol id="i-terminal" viewBox="0 0 24 24"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></symbol>
      <symbol id="i-trash-2" viewBox="0 0 24 24"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></symbol>
      <symbol id="i-mail" viewBox="0 0 24 24"><rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></symbol>
      <symbol id="i-message-circle" viewBox="0 0 24 24"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"></path></symbol>
      <symbol id="i-menu" viewBox="0 0 24 24"><line x1="4" y1="12" x2="20" y2="12"></line><line x1="4" y1="6" x2="20" y2="6"></line><line x1="4" y1="18" x2="20" y2="18"></line></symbol>
      <symbol id="i-log-out" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></symbol>
      <symbol id="i-sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path></symbol>
      <symbol id="i-moon" viewBox="0 0 24 24"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path></symbol>
      <symbol id="i-monitor" viewBox="0 0 24 24"><rect width="20" height="14" x="2" y="3" rx="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></symbol>
      <symbol id="i-chevron-right" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"></path></symbol>
      <symbol id="i-chevron-left" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"></path></symbol>
      <symbol id="i-chevron-down" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"></path></symbol>
      <symbol id="i-chevron-up" viewBox="0 0 24 24"><path d="m18 15-6-6-6 6"></path></symbol>
      <symbol id="i-eye" viewBox="0 0 24 24"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></symbol>
      <symbol id="i-eye-off" viewBox="0 0 24 24"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path><line x1="2" y1="2" x2="22" y2="22"></line></symbol>
      <symbol id="i-check" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></symbol>
      <symbol id="i-check-circle" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></symbol>
      <symbol id="i-alert-circle" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></symbol>
      <symbol id="i-alert-triangle" viewBox="0 0 24 24"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></symbol>
      <symbol id="i-info" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></symbol>
      <symbol id="i-x" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></symbol>
      <symbol id="i-x-circle" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></symbol>
      <symbol id="i-image" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect><circle cx="9" cy="9" r="2"></circle><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path></symbol>
      <symbol id="i-flame" viewBox="0 0 24 24"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></symbol>
      <symbol id="i-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></symbol>
      <symbol id="i-gift" viewBox="0 0 24 24"><polyline points="20 12 20 22 4 22 4 12"></polyline><rect width="20" height="5" x="2" y="7"></rect><line x1="12" y1="22" x2="12" y2="7"></line><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path></symbol>
      <symbol id="i-clipboard" viewBox="0 0 24 24"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></symbol>
      <symbol id="i-sparkles" viewBox="0 0 24 24"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path></symbol>
      <symbol id="i-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></symbol>
      <symbol id="i-copy" viewBox="0 0 24 24"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></symbol>
      <symbol id="i-edit" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></symbol>
      <symbol id="i-download" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></symbol>
    </defs>
  </svg>'''

def get_modern_css():
    return """<style>
:root {
  color-scheme: dark;
  --bg: #090d16;
  --bg2: #0f172a;
  --bg3: #182235;
  --bg4: #223048;
  --border: #1e293b;
  --border2: #334155;
  --text: #f8fafc;
  --text2: #94a3b8;
  --text3: #64748b;
  --accent: #3b82f6;
  --accent2: #60a5fa;
  --accent-hover: #2563eb;
  --accent-subtle: rgba(59, 130, 246, 0.12);
  --success: #10b981;
  --success-subtle: rgba(16, 185, 129, 0.12);
  --warn: #f59e0b;
  --warn-subtle: rgba(245, 158, 11, 0.12);
  --warning: #f59e0b;
  --danger: #ef4444;
  --danger-subtle: rgba(239, 68, 68, 0.12);
  --primary: #3b82f6;
  --brand: #3b82f6;
  --card: #0f172a;
  --text1: #f8fafc;
  --chart-grid: rgba(255, 255, 255, 0.06);
  --radius: 12px;
  --radius-sm: 8px;
  --radius-lg: 16px;
  --sidebar-w: 240px;
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.25);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.2);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.35), 0 4px 6px -4px rgba(0, 0, 0, 0.25);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.3);
}

html[data-theme="light"] {
  color-scheme: light;
  --bg: #f8fafc;
  --bg2: #ffffff;
  --bg3: #f1f5f9;
  --bg4: #e2e8f0;
  --border: #e2e8f0;
  --border2: #cbd5e1;
  --text: #0f172a;
  --text2: #475569;
  --text3: #94a3b8;
  --accent: #2563eb;
  --accent2: #1d4ed8;
  --accent-hover: #1e40af;
  --accent-subtle: #eff6ff;
  --success: #059669;
  --success-subtle: #ecfdf5;
  --warn: #d97706;
  --warn-subtle: #fffbeb;
  --warning: #d97706;
  --danger: #dc2626;
  --danger-subtle: #fef2f2;
  --primary: #2563eb;
  --brand: #2563eb;
  --card: #ffffff;
  --text1: #0f172a;
  --chart-grid: rgba(15, 23, 42, 0.08);
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.04);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", sans-serif;
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  min-height: 100dvh;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow: hidden;
}

/* ==================== 0-EMOJI SVG ICONS ==================== */
.ui-icon {
  display: inline-block;
  width: 16px;
  height: 16px;
  stroke-width: 2;
  stroke: currentColor;
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
  vertical-align: -2.5px;
  flex-shrink: 0;
  transition: color 0.15s ease, transform 0.15s ease;
}
.ui-icon.xs { width: 13px; height: 13px; stroke-width: 2.2; }
.ui-icon.sm { width: 15px; height: 15px; }
.ui-icon.md { width: 18px; height: 18px; }
.ui-icon.lg { width: 22px; height: 22px; }
.ui-icon.xl { width: 28px; height: 28px; }

/* ==================== FLOATING TOAST NOTIFICATION ==================== */
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
  max-width: 420px;
  width: calc(100% - 40px);
}
.toast-item {
  pointer-events: auto;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-lg);
  color: var(--text);
  font-size: 13.5px;
  line-height: 1.5;
  animation: toastSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  transition: all 0.2s ease;
}
.toast-item.toast-success { border-left: 4px solid var(--success); }
.toast-item.toast-error, .toast-item.toast-danger { border-left: 4px solid var(--danger); }
.toast-item.toast-warn, .toast-item.toast-warning { border-left: 4px solid var(--warn); }
.toast-item.toast-info { border-left: 4px solid var(--accent); }
.toast-icon { margin-top: 2px; }
.toast-success .toast-icon { color: var(--success); }
.toast-error .toast-icon, .toast-danger .toast-icon { color: var(--danger); }
.toast-warn .toast-icon, .toast-warning .toast-icon { color: var(--warn); }
.toast-info .toast-icon { color: var(--accent); }
.toast-body { flex: 1; word-break: break-word; }
.toast-close {
  border: none;
  background: transparent;
  color: var(--text3);
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}
.toast-close:hover { color: var(--text); background: var(--bg3); }
@keyframes toastSlideIn {
  from { opacity: 0; transform: translateY(-12px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

/* ==================== LAYOUT ==================== */
.app-layout { display: flex; height: 100vh; height: 100dvh; overflow: hidden; }

/* ==================== SIDEBAR ==================== */
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
  padding: 18px 20px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 12px;
}
.sidebar-header .logo {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: var(--accent-subtle);
  border: 1px solid var(--accent);
  color: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.sidebar-header h1 { font-size: 15px; font-weight: 700; color: var(--text); line-height: 1.2; }
.sidebar-header p { font-size: 11.5px; color: var(--text2); margin-top: 2px; }
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
  padding: 12px 10px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--border2) transparent;
}
.sidebar-menu::-webkit-scrollbar { width: 5px; }
.sidebar-menu::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 10px; }

.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: var(--radius-sm);
  color: var(--text2);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  margin-bottom: 2px;
  user-select: none;
}
.menu-item:hover { background: var(--bg3); color: var(--text); }
.menu-item.active {
  background: var(--accent-subtle);
  color: var(--accent2);
  font-weight: 600;
}
.menu-item .ui-icon { color: inherit; }

.menu-group { margin-bottom: 2px; }
.menu-group-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: var(--radius-sm);
  color: var(--text2);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
}
.menu-group-header:hover { background: var(--bg3); color: var(--text); }
.menu-group-header.active { color: var(--accent2); font-weight: 600; }
.menu-group-header .arrow {
  margin-left: auto;
  transition: transform 0.2s ease;
  color: var(--text3);
}
.menu-group.expanded .menu-group-header .arrow { transform: rotate(90deg); color: var(--accent2); }
.menu-group-items { max-height: 0; overflow: hidden; transition: max-height 0.25s ease-out; }
.menu-group.expanded .menu-group-items { max-height: 520px; }
.menu-group-items .menu-item {
  padding-left: 32px;
  font-size: 12.5px;
  padding-top: 7px;
  padding-bottom: 7px;
}

/* ==================== MAIN CONTENT & HEADER ==================== */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  background: var(--bg);
  position: relative;
}

.main-header {
  height: 60px;
  padding: 0 28px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--bg2);
  flex-shrink: 0;
  gap: 16px;
}
.main-header h2 {
  font-size: 17px;
  font-weight: 700;
  color: var(--text);
  margin: 0;
  white-space: nowrap;
}
.breadcrumb-nav {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  color: var(--text3);
}
.breadcrumb-sep { color: var(--border2); }
.breadcrumb-item.active { color: var(--text); font-weight: 600; }
.breadcrumb-item.clickable { cursor: pointer; }
.breadcrumb-item.clickable:hover { color: var(--accent2); }

.main-body {
  flex: 1;
  padding: 24px 28px;
  overflow-y: auto;
  overflow-x: hidden;
}

/* Top Account / Actions */
.top-account {
  position: absolute;
  top: 13px;
  right: 28px;
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 50;
}
.top-avatar {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: var(--bg3);
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  cursor: pointer;
  color: var(--text2);
}
.top-avatar img { width: 100%; height: 100%; object-fit: cover; }
.top-menu {
  position: absolute;
  top: 44px;
  right: 0;
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-lg);
  padding: 6px;
  display: none;
  flex-direction: column;
  min-width: 140px;
  z-index: 100;
}
.top-account:hover .top-menu, .top-menu:hover { display: flex; }
.top-menu button {
  border: none;
  background: transparent;
  padding: 8px 12px;
  text-align: left;
  border-radius: 6px;
  font-size: 13px;
  color: var(--text);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.15s;
}
.top-menu button:hover { background: var(--bg3); color: var(--accent2); }
.top-menu button.danger { color: var(--danger); }
.top-menu button.danger:hover { background: var(--danger-subtle); }

/* Theme toggle */
.theme-toggle {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 1px solid var(--border2);
  background: var(--bg3);
  color: var(--text2);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  flex-shrink: 0;
}
.theme-toggle:hover { color: var(--accent2); border-color: var(--accent); }
.login-theme-toggle { position: fixed; top: 16px; right: 20px; z-index: 10; }

/* ==================== BENTO DASHBOARD ==================== */
.dashboard-hero {
  background: radial-gradient(circle at 10% 10%, rgba(59, 130, 246, 0.18), transparent 40%), linear-gradient(135deg, var(--bg2), var(--bg3));
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 22px 24px;
  margin-bottom: 20px;
  position: relative;
  overflow: hidden;
}
.dashboard-hero h2 {
  font-size: 19px;
  font-weight: 700;
  margin-bottom: 6px;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 10px;
}
.dashboard-hero p {
  color: var(--text2);
  font-size: 13px;
  max-width: 820px;
  line-height: 1.6;
}

.dash-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
}
.date-range {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.date-field {
  display: flex;
  align-items: center;
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 4px 10px;
  gap: 6px;
}
.date-label { font-size: 12px; color: var(--text3); }
.date-input {
  border: none;
  background: transparent;
  color: var(--text);
  font-size: 12.5px;
  outline: none;
  font-family: inherit;
}
.date-sep { color: var(--text3); font-size: 12px; }
.date-quicks {
  display: flex;
  gap: 6px;
  background: var(--bg3);
  padding: 3px;
  border-radius: var(--radius-sm);
}
.date-quick {
  border: none;
  background: transparent;
  color: var(--text2);
  font-size: 12px;
  padding: 5px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
}
.date-quick:hover { color: var(--text); }
.date-quick.active {
  background: var(--accent);
  color: #fff;
  font-weight: 600;
  box-shadow: var(--shadow-sm);
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 14px;
  margin-bottom: 22px;
}
.metric-grid-4 {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
}
.metric-card {
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px 18px;
  position: relative;
  overflow: hidden;
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
}
.metric-card:hover {
  transform: translateY(-2px);
  border-color: var(--accent);
  box-shadow: var(--shadow-md);
}
.metric-card .metric-label {
  font-size: 12px;
  color: var(--text2);
  font-weight: 500;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.metric-card .metric-value {
  font-size: 26px;
  font-weight: 700;
  color: var(--text);
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
  margin-bottom: 6px;
}
.metric-card .metric-sub {
  font-size: 11.5px;
  color: var(--text3);
  margin-top: auto;
  display: flex;
  align-items: center;
  gap: 4px;
}
.metric-card:hover .metric-sub { color: var(--accent2); }

.dash-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(460px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}
.chart-card {
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px;
  box-shadow: var(--shadow-sm);
}
.chart-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.chart-title h3 { font-size: 14px; font-weight: 600; color: var(--text); }
.chart-title span { font-size: 12px; color: var(--text3); }

/* ==================== TABLES ==================== */
.table-container {
  width: 100%;
  overflow-x: auto;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg2);
  box-shadow: var(--shadow-sm);
  margin-bottom: 20px;
  -webkit-overflow-scrolling: touch;
}
.data-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 13px;
  text-align: left;
}
.data-table th {
  background: var(--bg3);
  color: var(--text2);
  font-weight: 600;
  padding: 12px 14px;
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
  position: sticky;
  top: 0;
  z-index: 2;
}
.data-table td {
  padding: 12px 14px;
  border-bottom: 1px solid var(--border);
  color: var(--text);
  vertical-align: middle;
  transition: background 0.12s ease;
}
.data-table tbody tr:hover td { background: var(--bg3); }
.data-table tbody tr:last-child td { border-bottom: none; }

.badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 8px;
  border-radius: 9999px;
  font-size: 11.5px;
  font-weight: 600;
  line-height: 1.3;
  white-space: nowrap;
}
.badge-success { background: var(--success-subtle); color: var(--success); }
.badge-warning { background: var(--warn-subtle); color: var(--warn); }
.badge-danger { background: var(--danger-subtle); color: var(--danger); }
.badge-info { background: var(--accent-subtle); color: var(--accent); }
.badge-neutral { background: var(--bg3); color: var(--text2); border: 1px solid var(--border); }

.scene-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11.5px;
  font-weight: 500;
  background: var(--bg3);
  border: 1px solid var(--border);
  color: var(--text);
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
  font-size: 13px;
  color: var(--text2);
}

/* ==================== BUTTONS & INPUTS ==================== */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.15s ease;
  user-select: none;
  line-height: 1.4;
  white-space: nowrap;
}
.btn:disabled { opacity: 0.55; cursor: not-allowed; }
.btn-primary { background: var(--accent); color: #fff; border-color: var(--accent); }
.btn-primary:hover:not(:disabled) { background: var(--accent-hover); }
.btn-secondary { background: var(--bg3); color: var(--text); border-color: var(--border2); }
.btn-secondary:hover:not(:disabled) { background: var(--bg4); border-color: var(--accent); }
.btn-success { background: var(--success); color: #fff; border-color: var(--success); }
.btn-success:hover:not(:disabled) { filter: brightness(1.08); }
.btn-danger { background: var(--danger); color: #fff; border-color: var(--danger); }
.btn-danger:hover:not(:disabled) { filter: brightness(1.08); }
.btn-sm { padding: 4px 10px; font-size: 12px; border-radius: 6px; }

.form-group { margin-bottom: 14px; }
.form-group label { display: block; font-size: 12.5px; font-weight: 500; color: var(--text2); margin-bottom: 6px; }
.form-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; }
input[type="text"], input[type="password"], input[type="email"], input[type="number"], select, textarea {
  width: 100%;
  background: var(--bg3);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 8px 12px;
  color: var(--text);
  font-size: 13px;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
  font-family: inherit;
}
input:focus, select:focus, textarea:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-subtle);
}

.pwd-wrap { position: relative; }
.pwd-wrap input { padding-right: 36px; }
.pwd-eye {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text3);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.pwd-eye:hover { color: var(--accent2); }

.warn {
  background: var(--warn-subtle);
  border: 1px solid var(--warn);
  color: var(--warn);
  border-radius: var(--radius-sm);
  padding: 10px 14px;
  font-size: 12.5px;
  line-height: 1.5;
  margin-bottom: 14px;
}

/* ==================== MODALS ==================== */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
  animation: fadeIn 0.2s ease;
}
.modal, .modal-card {
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-xl);
  max-width: 95vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: modalScale 0.22s cubic-bezier(0.16, 1, 0.3, 1);
  width: 100%;
}
.modal { padding: 22px; overflow-y: auto; max-width: 520px; }
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.modal-header h3 { font-size: 15px; font-weight: 600; color: var(--text); margin: 0; }
.modal-body { padding: 18px 20px; overflow-y: auto; flex: 1; }
.modal-footer, .modal-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 20px;
  border-top: 1px solid var(--border);
  background: var(--bg3);
  flex-shrink: 0;
}
.modal-actions { margin-top: 18px; padding: 14px 0 0; background: transparent; border-top: 1px solid var(--border); }
.btn-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--text2);
  cursor: pointer;
  transition: all 0.15s;
}
.btn-close:hover { background: var(--bg3); color: var(--text); }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes modalScale { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }

/* ==================== LOGIN ==================== */
.login-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  min-height: 100dvh;
  background: radial-gradient(circle at 50% 30%, rgba(59, 130, 246, 0.12), transparent 50%), var(--bg);
  padding: 20px;
}
.login-card {
  width: 100%;
  max-width: 400px;
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 32px 28px;
  box-shadow: var(--shadow-xl);
}
.login-card h2 { font-size: 20px; font-weight: 700; text-align: center; margin-bottom: 20px; color: var(--text); }
.slider-verify { margin-bottom: 16px; border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 12px; background: var(--bg3); }
.slider-top { display: flex; justify-content: space-between; font-size: 12px; color: var(--text2); margin-bottom: 8px; }
.hub-box { position: relative; width: 100%; height: 140px; background: var(--bg2); border-radius: 6px; overflow: hidden; margin-bottom: 8px; }
.puzzle-bg { width: 100%; height: 100%; object-fit: cover; }
.puzzle-piece-img { position: absolute; z-index: 5; }
.puzzle-track { position: relative; height: 38px; background: var(--bg2); border: 1px solid var(--border); border-radius: 19px; display: flex; align-items: center; justify-content: center; }
.puzzle-progress { position: absolute; left: 0; top: 0; bottom: 0; background: var(--accent-subtle); border-radius: 19px; }
.puzzle-tip { font-size: 12px; color: var(--text3); z-index: 2; pointer-events: none; }
.puzzle-thumb { position: absolute; top: 1px; width: 36px; height: 34px; border-radius: 17px; background: var(--accent); color: #fff; border: none; cursor: grab; display: flex; align-items: center; justify-content: center; font-size: 16px; z-index: 3; }
.footer-links { text-align: center; margin-top: 16px; font-size: 13px; }
.footer-links a { color: var(--accent2); cursor: pointer; text-decoration: none; }
.footer-links a:hover { text-decoration: underline; }

/* Legacy message support */
.msg {
  display: none;
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  margin-bottom: 14px;
}
.msg.show { display: block; }
.msg.success { background: var(--success-subtle); color: var(--success); border: 1px solid var(--success); }
.msg.danger, .msg.error { background: var(--danger-subtle); color: var(--danger); border: 1px solid var(--danger); }
.msg.warn, .msg.warning { background: var(--warn-subtle); color: var(--warn); border: 1px solid var(--warn); }

/* Mobile Menu & Overlays */
.mobile-menu-toggle {
  display: none;
  position: absolute;
  left: 14px;
  top: 11px;
  z-index: 60;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--bg2);
  color: var(--text);
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
}
.mobile-menu-toggle:hover { background: var(--bg3); border-color: var(--accent); }
.mobile-menu-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  -webkit-backdrop-filter: blur(4px);
  backdrop-filter: blur(4px);
  z-index: 95;
}
.mobile-menu-overlay.show { display: block; }

/* ==================== RESPONSIVE RULES ==================== */
@media (max-width: 1024px) {
  .metric-grid { grid-template-columns: repeat(3, 1fr); }
  .dash-grid { grid-template-columns: 1fr; }
}

@media (max-width: 768px) {
  .sidebar-close-btn { display: flex; }
  .mobile-menu-toggle { display: flex !important; }
  .sidebar {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    z-index: 100;
    width: 270px;
    max-width: 82vw;
    background: var(--bg2);
    box-shadow: 8px 0 32px rgba(0, 0, 0, 0.45);
    transform: translateX(-100%);
    transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .sidebar.open { transform: translateX(0); }
  .main-content {
    width: 100%;
    height: 100vh;
    height: 100dvh;
    padding-top: 56px;
  }
  .main-header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 56px;
    padding: 0 16px 0 58px;
    z-index: 55;
  }
  .main-header .breadcrumb-nav { display: none; }
  .top-account {
    position: fixed;
    top: 11px;
    right: 14px;
    z-index: 60;
  }
  .main-body {
    padding: 14px 12px calc(24px + env(safe-area-inset-bottom)) !important;
  }
  .metric-grid {
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 10px;
  }
  .metric-grid-4 {
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 10px;
  }
  .metric-card { padding: 12px 14px; }
  .metric-card .metric-value { font-size: 22px; }
  .dash-toolbar { flex-direction: column; align-items: stretch; }
  .date-range { flex-wrap: wrap; gap: 8px; }
  .date-quicks { width: 100%; overflow-x: auto; display: flex; gap: 6px; }
  .date-quick { flex: 1; text-align: center; white-space: nowrap; }
  .toast-container {
    top: calc(12px + env(safe-area-inset-top));
    left: 16px;
    right: 16px;
    width: auto;
    max-width: none;
  }
}
</style>"""

def modernize_content(content):
    # 1. Replace <style>...</style>
    style_pattern = re.compile(r'<style>.*?</style>', re.DOTALL)
    content = style_pattern.sub(get_modern_css(), content, count=1)
    
    # 2. Inject SVG sprites after <body>
    if '<!-- ==================== 0-EMOJI SVG SPRITE POOL ==================== -->' not in content:
        content = content.replace('<body>', '<body>\n' + get_svg_sprites() + '\n')

    # 3. Toast Container
    toast_html = '''    <!-- Floating Toast Notification Queue -->
    <div class="toast-container" aria-live="polite">
      <div v-for="t in toasts" :key="t.id" :class="['toast-item', 'toast-' + t.type]">
        <div class="toast-icon">
          <svg class="ui-icon sm" v-if="t.type==='success'"><use href="#i-check-circle"></use></svg>
          <svg class="ui-icon sm" v-else-if="t.type==='danger'||t.type==='error'"><use href="#i-alert-circle"></use></svg>
          <svg class="ui-icon sm" v-else-if="t.type==='warn'||t.type==='warning'"><use href="#i-alert-triangle"></use></svg>
          <svg class="ui-icon sm" v-else><use href="#i-info"></use></svg>
        </div>
        <div class="toast-body" v-html="t.text"></div>
        <button class="toast-close" @click="removeToast(t.id)" title="关闭">
          <svg class="ui-icon xs"><use href="#i-x"></use></svg>
        </button>
      </div>
    </div>'''
    if '<!-- Floating Toast Notification Queue -->' not in content:
        content = content.replace('<div v-else class="app-layout">', '<div v-else class="app-layout">\n' + toast_html)

    # 4. Sidebar Header & Logo
    content = content.replace('<div class="logo">◎</div>', '<div class="logo"><svg class="ui-icon md"><use href="#i-shield"></use></svg></div>')
    old_sidebar_header = '''      <div class="sidebar-header">
        <div class="logo"><svg class="ui-icon md"><use href="#i-shield"></use></svg></div>
        <div>
          <h1>后台管理</h1>
          <p>AI 答题服务</p>
        </div>
      </div>'''
    new_sidebar_header = '''      <div class="sidebar-header">
        <div class="logo"><svg class="ui-icon md"><use href="#i-shield"></use></svg></div>
        <div>
          <h1>后台管理</h1>
          <p>AI 答题服务</p>
        </div>
        <button class="sidebar-close-btn" @click="mobileSidebarOpen=false" aria-label="关闭菜单"><svg class="ui-icon sm"><use href="#i-x"></use></svg></button>
      </div>'''
    content = content.replace(old_sidebar_header, new_sidebar_header)

    # 5. Top Bar & Theme Toggles
    content = content.replace('<button class="mobile-menu-toggle" @click="mobileSidebarOpen=!mobileSidebarOpen">☰</button>',
                              '<button class="mobile-menu-toggle" @click="mobileSidebarOpen=!mobileSidebarOpen" aria-label="打开菜单"><svg class="ui-icon md"><use href="#i-menu"></use></svg></button>')
    content = content.replace('<button class="theme-toggle" :title="\'主题：\'+themeLabels[themeMode]" @click="cycleTheme">{{themeIcons[themeMode]}}</button>',
                              '<button class="theme-toggle" :title="\'主题：\'+themeLabels[themeMode]" @click="cycleTheme"><svg class="ui-icon sm"><use :href="themeMode===\'light\'?\'#i-sun\':themeMode===\'dark\'?\'#i-moon\':\'#i-monitor\'"></use></svg></button>')
    content = content.replace('<button class="theme-toggle login-theme-toggle" :title="\'主题：\'+themeLabels[themeMode]" @click="cycleTheme">{{themeIcons[themeMode]}}</button>',
                              '<button class="theme-toggle login-theme-toggle" :title="\'主题：\'+themeLabels[themeMode]" @click="cycleTheme"><svg class="ui-icon sm"><use :href="themeMode===\'light\'?\'#i-sun\':themeMode===\'dark\'?\'#i-moon\':\'#i-monitor\'"></use></svg></button>')
    content = content.replace('<div class="top-avatar"><img v-if="accountConfig.avatar_data" :src="accountConfig.avatar_data"><span v-else>◌</span></div>',
                              '<div class="top-avatar"><img v-if="accountConfig.avatar_data" :src="accountConfig.avatar_data"><svg v-else class="ui-icon sm"><use href="#i-user"></use></svg></div>')

    # 6. Sidebar Menu Items & Arrows
    sidebar_subs = [
        ('<span class="icon">⌂</span>运营概览', '<svg class="ui-icon sm"><use href="#i-layout-dashboard"></use></svg>运营概览'),
        ('<span class="icon">◯</span>用户管理', '<svg class="ui-icon sm"><use href="#i-users"></use></svg>用户管理'),
        ('<span class="icon">◯</span>用户列表', '<svg class="ui-icon sm"><use href="#i-users"></use></svg>用户列表'),
        ('<span class="icon">◉</span>用户分析', '<svg class="ui-icon sm"><use href="#i-bar-chart"></use></svg>用户分析'),
        ('<span class="icon">⚠</span>风控管理', '<svg class="ui-icon sm"><use href="#i-shield-alert"></use></svg>风控管理'),
        ('<span class="icon">▤</span>题库中心', '<svg class="ui-icon sm"><use href="#i-book-open"></use></svg>题库中心'),
        ('<span class="icon">▤</span>题库列表', '<svg class="ui-icon sm"><use href="#i-database"></use></svg>题库列表'),
        ('<span class="icon">▦</span>题库分析', '<svg class="ui-icon sm"><use href="#i-pie-chart"></use></svg>题库分析'),
        ('<span class="icon">◐</span>答题统计', '<svg class="ui-icon sm"><use href="#i-trending-up"></use></svg>答题统计'),
        ('<span class="icon">◎</span>题库日志', '<svg class="ui-icon sm"><use href="#i-file-text"></use></svg>题库日志'),
        ('<span class="icon">◈</span>模型服务', '<svg class="ui-icon sm"><use href="#i-cpu"></use></svg>模型服务'),
        ('<span class="icon">◈</span>模型配置', '<svg class="ui-icon sm"><use href="#i-bot"></use></svg>模型配置'),
        ('<span class="icon">≡</span>模型日志', '<svg class="ui-icon sm"><use href="#i-activity"></use></svg>模型日志'),
        ('<span class="icon">★</span>推广运营', '<svg class="ui-icon sm"><use href="#i-award"></use></svg>推广运营'),
        ('<span class="icon">⚙</span>返利配置', '<svg class="ui-icon sm"><use href="#i-settings"></use></svg>返利配置'),
        ('<span class="icon">¥</span>提现审核', '<svg class="ui-icon sm"><use href="#i-wallet"></use></svg>提现审核'),
        ('<span class="icon">✎</span>问题反馈', '<svg class="ui-icon sm"><use href="#i-message-square"></use></svg>问题反馈'),
        ('<span class="icon">◎</span>公告通知', '<svg class="ui-icon sm"><use href="#i-bell"></use></svg>公告通知'),
        ('<span class="icon">□</span>支付财务', '<svg class="ui-icon sm"><use href="#i-credit-card"></use></svg>支付财务'),
        ('<span class="icon">▤</span>支付明细', '<svg class="ui-icon sm"><use href="#i-receipt"></use></svg>支付明细'),
        ('<span class="icon">↩</span>退款申请', '<svg class="ui-icon sm"><use href="#i-rotate-ccw"></use></svg>退款申请'),
        ('<span class="icon">◈</span>套餐配置', '<svg class="ui-icon sm"><use href="#i-layers"></use></svg>套餐配置'),
        ('<span class="icon">⌁</span>支付接口', '<svg class="ui-icon sm"><use href="#i-zap"></use></svg>支付接口'),
        ('<span class="icon">◎</span>支付测试', '<svg class="ui-icon sm"><use href="#i-play-circle"></use></svg>支付测试'),
        ('<span class="icon">⚷</span>卡密管理', '<svg class="ui-icon sm"><use href="#i-key"></use></svg>卡密管理'),
        ('<span class="icon">●</span>商品配置', '<svg class="ui-icon sm"><use href="#i-store"></use></svg>商品配置'),
        ('<span class="icon">⚑</span>代理商分销', '<svg class="ui-icon sm"><use href="#i-flag"></use></svg>代理商分销'),
        ('<span class="icon">◉</span>代理商<span', '<svg class="ui-icon sm"><use href="#i-users"></use></svg>代理商<span'),
        ('<span class="icon">▤</span>卡密模板', '<svg class="ui-icon sm"><use href="#i-layers"></use></svg>卡密模板'),
        ('<span class="icon">≣</span>批次与卡密', '<svg class="ui-icon sm"><use href="#i-package"></use></svg>批次与卡密'),
        ('<span class="icon">↗</span>收入统计', '<svg class="ui-icon sm"><use href="#i-trending-up"></use></svg>收入统计'),
        ('<span class="icon">⚙</span>分销配置', '<svg class="ui-icon sm"><use href="#i-sliders"></use></svg>分销配置'),
        ('<span class="icon">☰</span>日志监控', '<svg class="ui-icon sm"><use href="#i-terminal"></use></svg>日志监控'),
        ('<span class="icon">⌘</span>脚本日志', '<svg class="ui-icon sm"><use href="#i-terminal"></use></svg>脚本日志'),
        ('<span class="icon">∅</span>日志清理', '<svg class="ui-icon sm"><use href="#i-trash-2"></use></svg>日志清理'),
        ('<span class="icon">⊙</span>每日数据邮件', '<svg class="ui-icon sm"><use href="#i-mail"></use></svg>每日数据邮件'),
        ('<span class="icon">◇</span>系统配置', '<svg class="ui-icon sm"><use href="#i-settings"></use></svg>系统配置'),
        ('<span class="icon">◻</span>QQ频道机器人', '<svg class="ui-icon sm"><use href="#i-message-circle"></use></svg>QQ频道机器人'),
        ('<span class="icon">✉</span>邮箱配置', '<svg class="ui-icon sm"><use href="#i-mail"></use></svg>邮箱配置'),
        ('<span class="icon">⚿</span>单点登录', '<svg class="ui-icon sm"><use href="#i-shield"></use></svg>单点登录'),
        ('<span class="icon">⛁</span>系统设置', '<svg class="ui-icon sm"><use href="#i-database"></use></svg>系统设置'),
        ('<span class="arrow">▶</span>', '<svg class="ui-icon xs arrow"><use href="#i-chevron-right"></use></svg>')
    ]
    for old_s, new_s in sidebar_subs:
        content = content.replace(old_s, new_s)

    # 7. Views replacements
    views_subs = [
        ('<h3><span>⛁</span>数据库连接</h3>', '<h3><svg class="ui-icon sm"><use href="#i-database"></use></svg> 数据库连接</h3>'),
        ('<h3><span>⚿</span>中控单点登录</h3>', '<h3><svg class="ui-icon sm"><use href="#i-shield"></use></svg> 中控单点登录</h3>'),
        ("{{showDbPass?'🙈':'👁'}}", '<svg class="ui-icon sm"><use :href="showDbPass?\'#i-eye-off\':\'#i-eye\'"></use></svg>'),
        ("{{showSsoSecret?'🙈':'👁'}}", '<svg class="ui-icon sm"><use :href="showSsoSecret?\'#i-eye-off\':\'#i-eye\'"></use></svg>'),
        ('<span v-if="enabledCount>0">✓ 已有 {{enabledCount}} 个提供商就绪</span>', '<span v-if="enabledCount>0" style="display:inline-flex;align-items:center;gap:4px;"><svg class="ui-icon sm" style="color:var(--success)"><use href="#i-check-circle"></use></svg> 已有 {{enabledCount}} 个提供商就绪</span>'),
        ('<span v-else>⚠ 暂无模型配置，请添加提供商</span>', '<span v-else style="display:inline-flex;align-items:center;gap:4px;"><svg class="ui-icon sm" style="color:var(--warn)"><use href="#i-alert-triangle"></use></svg> 暂无模型配置，请添加提供商</span>'),
        ('<span>◇</span>{{entry.info.title||entry.key}}', '<svg class="ui-icon sm"><use href="#i-cpu"></use></svg> {{entry.info.title||entry.key}}'),
        ('title="该模型支持图片输入(多模态)；勾选后点“⚡”会实测能不能识图"', 'title="该模型支持图片输入(多模态)；勾选后点测试按钮会实测能不能识图"'),
        (':title="m.vision?\'测试多模态识图与文字连通性\':\'测试纯文本连通性\'">⚡</button>', ':title="m.vision?\'测试多模态识图与文字连通性\':\'测试纯文本连通性\'"><svg class="ui-icon xs"><use href="#i-zap"></use></svg></button>'),
        ('<h3>📋 老用户充值明细（区间内老用户已支付订单）</h3>', '<h3><svg class="ui-icon sm"><use href="#i-clipboard"></use></svg> 老用户充值明细（区间内老用户已支付订单）</h3>'),
        ('<div class="icon">✉</div>', '<div class="icon"><svg class="ui-icon md"><use href="#i-mail"></use></svg></div>'),
        ('<span v-if="s.enabled" style="font-size:12px;color:var(--success)">● 已启用</span>', '<span v-if="s.enabled" style="font-size:12px;color:var(--success);display:inline-flex;align-items:center;gap:3px;"><svg class="ui-icon xs"><use href="#i-check"></use></svg> 已启用</span>'),
        ('<span v-if="paymentPlans.length>0">✓ 已配置 {{paymentPlans.length}} 个套餐', '<span v-if="paymentPlans.length>0" style="display:inline-flex;align-items:center;gap:4px;"><svg class="ui-icon sm" style="color:var(--success)"><use href="#i-check-circle"></use></svg> 已配置 {{paymentPlans.length}} 个套餐'),
        ('<span v-else>⚠ 暂无套餐配置，请新增套餐</span>', '<span v-else style="display:inline-flex;align-items:center;gap:4px;"><svg class="ui-icon sm" style="color:var(--warn)"><use href="#i-alert-triangle"></use></svg> 暂无套餐配置，请新增套餐</span>'),
        ('<h3><span>🎁</span>注册赠送</h3>', '<h3><svg class="ui-icon sm"><use href="#i-gift"></use></svg> 注册赠送</h3>'),
        ('<h3><span>🔑</span>自有模型</h3>', '<h3><svg class="ui-icon sm"><use href="#i-key"></use></svg> 自有模型</h3>'),
        ('<h3><span>✓</span>扣题规则</h3>', '<h3><svg class="ui-icon sm" style="color:var(--success)"><use href="#i-check"></use></svg> 扣题规则</h3>'),
        ('<h3><span>◈</span>套餐配置</h3>', '<h3><svg class="ui-icon sm"><use href="#i-layers"></use></svg> 套餐配置</h3>'),
        ('class="sort-btn" :style="{opacity:idx===0?\'0.3\':\'1\',cursor:idx===0?\'not-allowed\':\'pointer\'}" @click="sortPlan(idx,-1)">▲</button>',
         'class="sort-btn" :style="{opacity:idx===0?\'0.3\':\'1\',cursor:idx===0?\'not-allowed\':\'pointer\'}" @click="sortPlan(idx,-1)"><svg class="ui-icon xs"><use href="#i-chevron-up"></use></svg></button>'),
        ('class="sort-btn sort-btn-bottom" :style="{opacity:idx===paymentPlans.length-1?\'0.3\':\'1\',cursor:idx===paymentPlans.length-1?\'not-allowed\':\'pointer\'}" @click="sortPlan(idx,1)">▼</button>',
         'class="sort-btn sort-btn-bottom" :style="{opacity:idx===paymentPlans.length-1?\'0.3\':\'1\',cursor:idx===paymentPlans.length-1?\'not-allowed\':\'pointer\'}" @click="sortPlan(idx,1)"><svg class="ui-icon xs"><use href="#i-chevron-down"></use></svg></button>'),
        ('<h3>🔎 题库查询</h3>', '<h3><svg class="ui-icon sm"><use href="#i-search"></use></svg> 题库查询</h3>'),
        ('<span v-if="questionHasImage(item)" style="font-size:11px;color:var(--accent2)">🖼</span>', '<span v-if="questionHasImage(item)" style="font-size:11px;color:var(--accent2);display:inline-flex;align-items:center;gap:2px;"><svg class="ui-icon xs"><use href="#i-image"></use></svg> [图]</span>'),
        ('<button class="btn btn-danger" @click="logout">🚪 退出登录</button>', '<button class="btn btn-danger" @click="logout"><svg class="ui-icon sm"><use href="#i-log-out"></use></svg> 退出登录</button>'),
        ('<h3>🔥 调用最多的题目 TOP 10</h3>', '<h3><svg class="ui-icon sm"><use href="#i-flame"></use></svg> 调用最多的题目 TOP 10</h3>'),
        ('<h3>🐌 调用最少的题目 TOP 10</h3>', '<h3><svg class="ui-icon sm"><use href="#i-clock"></use></svg> 调用最少的题目 TOP 10</h3>'),
        ('<tr v-if="!bankAnalysis.never_list.length"><td colspan="3" style="padding:24px;text-align:center;color:var(--text3)">🎉 太棒了！题库中所有题目都被调用过</td></tr>',
         '<tr v-if="!bankAnalysis.never_list.length"><td colspan="3" style="padding:24px;text-align:center;color:var(--text3)"><svg class="ui-icon sm" style="color:var(--success)"><use href="#i-check-circle"></use></svg> 太棒了！题库中所有题目都被调用过</td></tr>'),
        ('<h3>💳 充值构成分析（区间内已支付订单，含闲鱼自动发货）</h3>', '<h3><svg class="ui-icon sm"><use href="#i-credit-card"></use></svg> 充值构成分析（区间内已支付订单，含闲鱼自动发货）</h3>'),
        ('<h3>🔙 回归老用户明细（区间内重新登录的老用户 TOP 20）</h3>', '<h3><svg class="ui-icon sm"><use href="#i-user-check"></use></svg> 回归老用户明细（区间内重新登录的老用户 TOP 20）</h3>'),
        ('<h3>🤖 自有模型答题用户 TOP 20</h3>', '<h3><svg class="ui-icon sm"><use href="#i-bot"></use></svg> 自有模型答题用户 TOP 20</h3>'),
        ('<span v-if="aiPolishing">✨ 优化中...</span>', '<span v-if="aiPolishing" style="display:inline-flex;align-items:center;gap:4px;"><svg class="ui-icon xs"><use href="#i-sparkles"></use></svg> 优化中...</span>'),
        ('<span v-else>✨ AI优化</span>', '<span v-else style="display:inline-flex;align-items:center;gap:4px;"><svg class="ui-icon xs"><use href="#i-sparkles"></use></svg> AI优化</span>'),
        ('<span v-if="announcePolishing">✨ 优化中...</span>', '<span v-if="announcePolishing" style="display:inline-flex;align-items:center;gap:4px;"><svg class="ui-icon xs"><use href="#i-sparkles"></use></svg> 优化中...</span>'),
        ('<span v-else>✨ AI润色</span>', '<span v-else style="display:inline-flex;align-items:center;gap:4px;"><svg class="ui-icon xs"><use href="#i-sparkles"></use></svg> AI润色</span>'),
        ('<span v-else style="font-size:12px;color:var(--warn)">⚠ 未配置管理员邮箱，请在「个人中心 → 绑定找回邮箱」配置，否则无法接收每日数据邮件</span>',
         '<span v-else style="font-size:12px;color:var(--warn);display:inline-flex;align-items:center;gap:4px;"><svg class="ui-icon sm"><use href="#i-alert-triangle"></use></svg> 未配置管理员邮箱，请在「个人中心 → 绑定找回邮箱」配置，否则无法接收每日数据邮件</span>')
    ]
    for old_v, new_v in views_subs:
        content = content.replace(old_v, new_v)

    # 8. Setup Modifications for Toasts and Emojis
    old_show_msg = '''    function showMsg(text,type='success',duration=3000){
      msg.text=text;msg.type=type;msg.show=true;
      if(duration)setTimeout(()=>msg.show=false,duration);
    }'''
    new_show_msg = '''    const toasts = ref([]);
    let toastSeq = 0;
    function addToast(text, type='info', duration=3500) {
      const id = ++toastSeq;
      const t = { id, text, type: (type === 'error' ? 'danger' : type) };
      toasts.value.push(t);
      if (duration) setTimeout(() => removeToast(id), duration);
      return id;
    }
    function removeToast(id) {
      const idx = toasts.value.findIndex(item => item.id === id);
      if (idx !== -1) toasts.value.splice(idx, 1);
    }
    function showMsg(text,type='success',duration=3000){
      msg.text=text;msg.type=type;msg.show=true;
      if(duration)setTimeout(()=>msg.show=false,duration);
      addToast(text, type, duration);
    }'''
    content = content.replace(old_show_msg, new_show_msg)

    # Clean setup strings
    content = content.replace("const cardPayIcon=ref('🔑');", "const cardPayIcon=ref('i-key');")
    content = content.replace("cardPayIcon.value=d.card_pay_icon||'🔑';", "cardPayIcon.value=d.card_pay_icon||'i-key';")
    content = content.replace("const themeIcons={auto:'◐',light:'☀',dark:'☾'};", "const themeIcons={auto:'i-monitor',light:'i-sun',dark:'i-moon'};")
    content = content.replace("{status:'fail',text:'✗ 请先填写模型ID'}", "{status:'fail',text:'请先填写模型ID'}")
    content = content.replace("{status:'fail',text:'✗ 请先填写 Base URL 和 API Key'}", "{status:'fail',text:'请先填写 Base URL 和 API Key'}")
    content = content.replace("{status:'loading',text:vision?'⏳ 识图测试中", "{status:'loading',text:vision?'识图测试中")
    content = content.replace("text:vision?'识图测试中（发一张纯色小图问颜色），最长约 45 秒…':'⏳ 调试中，请稍候…'", "text:vision?'识图测试中（发一张纯色小图问颜色），最长约 45 秒…':'调试中，请稍候…'")
    content = content.replace("{status:'ok',text:'✓ '+escHtml(d.msg)", "{status:'ok',text:escHtml(d.msg)")
    content = content.replace("{status:'fail',text:'✗ '+escHtml(d.msg||'调试失败')", "{status:'fail',text:escHtml(d.msg||'调试失败')")
    content = content.replace("{status:'fail',text:'✗ 调试失败：网络错误'}", "{status:'fail',text:'调试失败：网络错误'}")
    content = content.replace("{status:'fail',text:'✗ 请填写测试模型ID'}", "{status:'fail',text:'请填写测试模型ID'}")
    content = content.replace("{status:'loading',text:'⏳ 调试中，请稍候…'}", "{status:'loading',text:'调试中，请稍候…'}")

    # Email templates text and SCENE_ICONS
    content = content.replace("⏰ 有效期：10 分钟\\n⚠️ 请勿泄露给他人。", "有效期：10 分钟\\n安全提示：请勿泄露给他人。")
    content = content.replace("⏰ 有效期：10 分钟\\n⚠️ 请勿泄露给他人", "有效期：10 分钟\\n安全提示：请勿泄露给他人")
    content = content.replace("const SCENE_ICONS={user_register:'◯',user_reset:'↻',admin_reset:'◈',referral_withdrawal:'¥',feedback_reply:'✎',daily_report:'◉',feedback_new:'⊙',refund_approved:'↩',refund_rejected:'✕',refund_request:'⚠'};",
                              "const SCENE_ICONS={user_register:'i-user-plus',user_reset:'i-rotate-ccw',admin_reset:'i-key',referral_withdrawal:'i-wallet',feedback_reply:'i-message-square',daily_report:'i-bar-chart',feedback_new:'i-bell',refund_approved:'i-check-circle',refund_rejected:'i-x-circle',refund_request:'i-alert-triangle'};")

    # Mobile submenu map
    old_submenu = '''    const MOBILE_SUBMENU_MAP={
      referral:{title:'推广运营',icon:'★',items:[{page:'referral',label:'返利配置',icon:'⚙',load:loadReferralConfig},{page:'referral-withdrawals',label:'提现审核',icon:'¥',load:loadReferralWithdrawals},{page:'feedback',label:'问题反馈',icon:'✎',load:()=>{loadFeedbackList();loadFeedbackAutoClose();loadFeedbackNotify();}},{page:'announce',label:'公告通知',icon:'◎',load:loadAnnounceConfig}]},
      payment:{title:'支付财务',icon:'□',items:[{page:'payment-orders',label:'支付明细',icon:'▤',load:loadPaymentOrders},{page:'payment',label:'套餐配置',icon:'◈',load:loadPaymentConfig},{page:'pay-api',label:'支付接口',icon:'⌁',load:loadPayApiConfig},{page:'pay-test',label:'支付测试',icon:'◎',load:()=>{}},{page:'refund-requests',label:'退款申请',icon:'↩',load:loadRefundRequests}]},
      card:{title:'卡密管理',icon:'⚷',items:[{page:'xianyu',label:'商品配置',icon:'●',load:loadXianyuConfig},{page:'card-keys',label:'卡密管理',icon:'⚷',load:loadCardKeys}]},
      distributor:{title:'代理商分销',icon:'⚑',items:[{page:'distributor',label:'代理商',icon:'◉',load:loadFxList},{page:'distributor-templates',label:'卡密模板',icon:'▤',load:()=>{loadFxOptions();loadFxTemplates();}},{page:'distributor-batches',label:'批次与卡密',icon:'≣',load:()=>{loadFxOptions();loadFxBatches(1);}},{page:'distributor-withdrawals',label:'提现审核',icon:'¥',load:()=>{loadFxOptions();loadFxWds(1);}},{page:'distributor-revenue',label:'收入统计',icon:'↗',load:loadFxRevenue},{page:'distributor-config',label:'分销配置',icon:'⚙',load:loadFxConfig}]},
      logs:{title:'日志监控',icon:'☰',items:[{page:'script-logs',label:'脚本日志',icon:'⌘',load:loadScriptLogs},{page:'log-cleanup',label:'日志清理',icon:'∅',load:loadLogCleanup},{page:'daily-report',label:'每日数据邮件',icon:'⊙',load:()=>{loadDailyReport();loadEmailTemplates();}}]},
      models:{title:'模型服务',icon:'◈',items:[{page:'ai-config',label:'模型配置',icon:'◈',load:loadConfig},{page:'ai-logs',label:'模型日志',icon:'≡',load:loadAiLogs}]},
      config:{title:'系统配置',icon:'◇',items:[{page:'qq-bot',label:'QQ频道机器人',icon:'🤖',load:loadQqBot},{page:'email-config',label:'邮箱配置',icon:'✉',load:()=>{loadEmailConfig();loadEmailTemplates();}},{page:'sso-config',label:'单点登录',icon:'⚿',load:loadSsoConfig},{page:'db-config',label:'系统设置',icon:'⛁',load:loadDbConfig}]}
    };'''
    new_submenu = '''    const MOBILE_SUBMENU_MAP={
      referral:{title:'推广运营',icon:'i-award',items:[{page:'referral',label:'返利配置',icon:'i-settings',load:loadReferralConfig},{page:'referral-withdrawals',label:'提现审核',icon:'i-wallet',load:loadReferralWithdrawals},{page:'feedback',label:'问题反馈',icon:'i-message-square',load:()=>{loadFeedbackList();loadFeedbackAutoClose();loadFeedbackNotify();}},{page:'announce',label:'公告通知',icon:'i-bell',load:loadAnnounceConfig}]},
      payment:{title:'支付财务',icon:'i-credit-card',items:[{page:'payment-orders',label:'支付明细',icon:'i-receipt',load:loadPaymentOrders},{page:'payment',label:'套餐配置',icon:'i-layers',load:loadPaymentConfig},{page:'pay-api',label:'支付接口',icon:'i-zap',load:loadPayApiConfig},{page:'pay-test',label:'支付测试',icon:'i-play-circle',load:()=>{}},{page:'refund-requests',label:'退款申请',icon:'i-rotate-ccw',load:loadRefundRequests}]},
      card:{title:'卡密管理',icon:'i-key',items:[{page:'xianyu',label:'商品配置',icon:'i-store',load:loadXianyuConfig},{page:'card-keys',label:'卡密管理',icon:'i-key',load:loadCardKeys}]},
      distributor:{title:'代理商分销',icon:'i-flag',items:[{page:'distributor',label:'代理商',icon:'i-users',load:loadFxList},{page:'distributor-templates',label:'卡密模板',icon:'i-layers',load:()=>{loadFxOptions();loadFxTemplates();}},{page:'distributor-batches',label:'批次与卡密',icon:'i-package',load:()=>{loadFxOptions();loadFxBatches(1);}},{page:'distributor-withdrawals',label:'提现审核',icon:'i-wallet',load:()=>{loadFxOptions();loadFxWds(1);}},{page:'distributor-revenue',label:'收入统计',icon:'i-trending-up',load:loadFxRevenue},{page:'distributor-config',label:'分销配置',icon:'i-sliders',load:loadFxConfig}]},
      logs:{title:'日志监控',icon:'i-terminal',items:[{page:'script-logs',label:'脚本日志',icon:'i-terminal',load:loadScriptLogs},{page:'log-cleanup',label:'日志清理',icon:'i-trash-2',load:loadLogCleanup},{page:'daily-report',label:'每日数据邮件',icon:'i-mail',load:()=>{loadDailyReport();loadEmailTemplates();}}]},
      models:{title:'模型服务',icon:'i-cpu',items:[{page:'ai-config',label:'模型配置',icon:'i-bot',load:loadConfig},{page:'ai-logs',label:'模型日志',icon:'i-activity',load:loadAiLogs}]},
      config:{title:'系统配置',icon:'i-settings',items:[{page:'qq-bot',label:'QQ频道机器人',icon:'i-message-circle',load:loadQqBot},{page:'email-config',label:'邮箱配置',icon:'i-mail',load:()=>{loadEmailConfig();loadEmailTemplates();}},{page:'sso-config',label:'单点登录',icon:'i-shield',load:loadSsoConfig},{page:'db-config',label:'系统设置',icon:'i-database',load:loadDbConfig}]}
    };'''
    content = content.replace(old_submenu, new_submenu)

    # Views Pass 2: Eliminating all remaining emojis & glyphs
    pass2_subs = [
        # Warning divs
        ('<div class="warn">⚠ 切换数据库请确保目标库已存在对应表结构（系统会自动尝试初始化）。如仅需保留当前密码，请勿修改密码框。</div>',
         '<div class="warn" style="display:flex;align-items:center;gap:8px"><svg class="ui-icon sm" style="flex-shrink:0"><use href="#i-alert-triangle"></use></svg><span>切换数据库请确保目标库已存在对应表结构（系统会自动尝试初始化）。如仅需保留当前密码，请勿修改密码框。</span></div>'),
        ('<div class="warn">⚠ App Secret 仅存服务端，页面只显示掩码 <code>********</code>；留空或保持掩码表示不修改，明文不会回传浏览器。</div>',
         '<div class="warn" style="display:flex;align-items:center;gap:8px"><svg class="ui-icon sm" style="flex-shrink:0"><use href="#i-alert-triangle"></use></svg><span>App Secret 仅存服务端，页面只显示掩码 <code>********</code>；留空或保持掩码表示不修改，明文不会回传浏览器。</span></div>'),
        ('<b style="color:var(--danger,#ef4444)">⚠ {{fxStats.batch_inconsistent}} 个批次钱卡对不上，需人工核对</b>',
         '<b style="color:var(--danger,#ef4444);display:inline-flex;align-items:center;gap:6px"><svg class="ui-icon sm" style="color:var(--danger)"><use href="#i-alert-circle"></use></svg> {{fxStats.batch_inconsistent}} 个批次钱卡对不上，需人工核对</b>'),
        ('<span v-else style="font-size:12px;color:var(--warn)">⚠ 未配置管理员邮箱，请在「个人中心 → 绑定找回邮箱」设置</span>',
         '<span v-else style="font-size:12px;color:var(--warn);display:inline-flex;align-items:center;gap:4px"><svg class="ui-icon sm"><use href="#i-alert-triangle"></use></svg> 未配置管理员邮箱，请在「个人中心 → 绑定找回邮箱」设置</span>'),
        ('<div class="warn">\\n                <span>⚠</span>\\n                <span>注意：请确保 SMTP 配置正确，否则找回密码功能无法使用</span>\\n              </div>',
         '<div class="warn" style="display:flex;align-items:center;gap:8px">\\n                <svg class="ui-icon sm" style="flex-shrink:0"><use href="#i-alert-triangle"></use></svg>\\n                <span>注意：请确保 SMTP 配置正确，否则找回密码功能无法使用</span>\\n              </div>'),
        ("""              <div class="warn">
                <span>⚠</span>
                <span>注意：请确保 SMTP 配置正确，否则找回密码功能无法使用</span>
              </div>""",
         """              <div class="warn" style="display:flex;align-items:center;gap:8px">
                <svg class="ui-icon sm" style="flex-shrink:0"><use href="#i-alert-triangle"></use></svg>
                <span>注意：请确保 SMTP 配置正确，否则找回密码功能无法使用</span>
              </div>"""),

        # Modal standard headers and close buttons
        ('<button v-if="modelSearch" class="search-clear" type="button" @click="modelSearch=\'\'" title="清除">×</button>',
         '<button v-if="modelSearch" class="search-clear" type="button" @click="modelSearch=\'\'" title="清除"><svg class="ui-icon xs"><use href="#i-x"></use></svg></button>'),
        ('<div class="modal-header"><h3>{{mailServerForm.id?\'编辑\':\'添加\'}}邮件服务器</h3><button class="btn-close" @click="showServerForm=false">×</button></div>',
         '<div class="modal-header"><h3><svg class="ui-icon sm" style="margin-right:6px"><use href="#i-mail"></use></svg>{{mailServerForm.id?\'编辑\':\'添加\'}}邮件服务器</h3><button class="btn-close" @click="showServerForm=false" aria-label="关闭"><svg class="ui-icon sm"><use href="#i-x"></use></svg></button></div>'),
        ('<div class="modal-header"><h3>中控发信流水（最近 20 条）</h3><button class="btn-close" @click="showMailHubRecords=false">×</button></div>',
         '<div class="modal-header"><h3><svg class="ui-icon sm" style="margin-right:6px"><use href="#i-activity"></use></svg>中控发信流水（最近 20 条）</h3><button class="btn-close" @click="showMailHubRecords=false" aria-label="关闭"><svg class="ui-icon sm"><use href="#i-x"></use></svg></button></div>'),
        ('<div class="modal-header">\n                <h3>{{ editingTemplateId?\'编辑模板\':\'新建模板\' }}</h3>\n                <button class="btn-close" @click="closeTemplateModal">×</button>\n              </div>',
         '<div class="modal-header">\n                <h3><svg class="ui-icon sm" style="margin-right:6px"><use href="#i-file-text"></use></svg>{{ editingTemplateId?\'编辑模板\':\'新建模板\' }}</h3>\n                <button class="btn-close" @click="closeTemplateModal" aria-label="关闭"><svg class="ui-icon sm"><use href="#i-x"></use></svg></button>\n              </div>'),
        ('<div class="modal-header"><h3>开通代理商</h3><button class="btn-close" @click="fxAddShow=false">×</button></div>',
         '<div class="modal-header"><h3><svg class="ui-icon sm" style="margin-right:6px"><use href="#i-user-plus"></use></svg>开通代理商</h3><button class="btn-close" @click="fxAddShow=false" aria-label="关闭"><svg class="ui-icon sm"><use href="#i-x"></use></svg></button></div>'),
        ('<div class="modal-header"><h3>编辑代理商 · {{fxEditForm.username}}</h3><button class="btn-close" @click="fxEditShow=false">×</button></div>',
         '<div class="modal-header"><h3><svg class="ui-icon sm" style="margin-right:6px"><use href="#i-edit"></use></svg>编辑代理商 · {{fxEditForm.username}}</h3><button class="btn-close" @click="fxEditShow=false" aria-label="关闭"><svg class="ui-icon sm"><use href="#i-x"></use></svg></button></div>'),
        ('<div class="modal-header"><h3>调整余额 · {{fxBalForm.username}}</h3><button class="btn-close" @click="fxBalShow=false">×</button></div>',
         '<div class="modal-header"><h3><svg class="ui-icon sm" style="margin-right:6px"><use href="#i-wallet"></use></svg>调整余额 · {{fxBalForm.username}}</h3><button class="btn-close" @click="fxBalShow=false" aria-label="关闭"><svg class="ui-icon sm"><use href="#i-x"></use></svg></button></div>'),
        ('<h3>代理商详情</h3><button class="btn-close" @click="fxDetailShow=false">×</button>',
         '<h3><svg class="ui-icon sm" style="margin-right:6px"><use href="#i-users"></use></svg>代理商详情</h3><button class="btn-close" @click="fxDetailShow=false" aria-label="关闭"><svg class="ui-icon sm"><use href="#i-x"></use></svg></button>'),
        ('<div class="modal-header"><h3>{{fxTplForm.id?\'编辑模板\':\'新建模板\'}}</h3><button class="btn-close" @click="fxTplShow=false">×</button></div>',
         '<div class="modal-header"><h3><svg class="ui-icon sm" style="margin-right:6px"><use href="#i-layers"></use></svg>{{fxTplForm.id?\'编辑模板\':\'新建模板\'}}</h3><button class="btn-close" @click="fxTplShow=false" aria-label="关闭"><svg class="ui-icon sm"><use href="#i-x"></use></svg></button></div>'),
        ("""          <div v-if="rrQrPreview" class="modal-overlay" @click.self="rrQrPreview=''">
            <div class="modal" style="max-width:340px;text-align:center">
              <h3>收款码</h3>
              <img :src="rrQrPreview" style="max-width:280px;border-radius:8px;margin:12px 0">
              <div><button class="btn btn-secondary" @click="rrQrPreview=''">关闭</button></div>
            </div>
          </div>""",
         """          <div v-if="rrQrPreview" class="modal-overlay" @click.self="rrQrPreview=''">
            <div class="modal" style="max-width:340px;text-align:center">
              <div class="modal-header" style="padding:0 0 12px 0;border-bottom:1px solid var(--border);margin-bottom:12px;">
                <h3><svg class="ui-icon sm" style="margin-right:6px"><use href="#i-image"></use></svg>收款码</h3>
                <button class="btn-close" @click="rrQrPreview=''" aria-label="关闭"><svg class="ui-icon sm"><use href="#i-x"></use></svg></button>
              </div>
              <img :src="rrQrPreview" style="max-width:280px;border-radius:8px;margin:8px 0">
              <div class="modal-actions" style="margin-top:12px;justify-content:center"><button class="btn btn-secondary" @click="rrQrPreview=''">关闭</button></div>
            </div>
          </div>"""),
        ("""          <div v-if="fxWdQr" class="modal-overlay" @click.self="fxWdQr=''">
            <div class="modal" style="text-align:center">
              <h3>收款二维码</h3>
              <img :src="fxWdQr" style="max-width:280px;border-radius:10px;margin:12px 0">
              <div><button class="btn btn-secondary" @click="fxWdQr=''">关闭</button></div>
            </div>
          </div>""",
         """          <div v-if="fxWdQr" class="modal-overlay" @click.self="fxWdQr=''">
            <div class="modal" style="max-width:340px;text-align:center">
              <div class="modal-header" style="padding:0 0 12px 0;border-bottom:1px solid var(--border);margin-bottom:12px;">
                <h3><svg class="ui-icon sm" style="margin-right:6px"><use href="#i-image"></use></svg>收款二维码</h3>
                <button class="btn-close" @click="fxWdQr=''" aria-label="关闭"><svg class="ui-icon sm"><use href="#i-x"></use></svg></button>
              </div>
              <img :src="fxWdQr" style="max-width:280px;border-radius:10px;margin:8px 0">
              <div class="modal-actions" style="margin-top:12px;justify-content:center"><button class="btn btn-secondary" @click="fxWdQr=''">关闭</button></div>
            </div>
          </div>"""),
        ("""          <div v-if="referralQrPreview" class="modal-overlay" @click.self="referralQrPreview=''">
            <div class="modal" style="text-align:center">
              <h3>收款二维码</h3>
              <img :src="referralQrPreview" style="max-width:280px;border-radius:10px;margin:12px 0">
              <div><button class="btn btn-secondary" @click="referralQrPreview=''">关闭</button></div>
            </div>
          </div>""",
         """          <div v-if="referralQrPreview" class="modal-overlay" @click.self="referralQrPreview=''">
            <div class="modal" style="max-width:340px;text-align:center">
              <div class="modal-header" style="padding:0 0 12px 0;border-bottom:1px solid var(--border);margin-bottom:12px;">
                <h3><svg class="ui-icon sm" style="margin-right:6px"><use href="#i-image"></use></svg>收款二维码</h3>
                <button class="btn-close" @click="referralQrPreview=''" aria-label="关闭"><svg class="ui-icon sm"><use href="#i-x"></use></svg></button>
              </div>
              <img :src="referralQrPreview" style="max-width:280px;border-radius:10px;margin:8px 0">
              <div class="modal-actions" style="margin-top:12px;justify-content:center"><button class="btn btn-secondary" @click="referralQrPreview=''">关闭</button></div>
            </div>
          </div>"""),
        ("""        <div v-if="feedbackDetail" class="modal-overlay" @click.self="feedbackDetail=null">
          <div class="modal" style="max-width:620px">
            <h3>反馈详情 #{{feedbackDetail.id}}</h3>""",
         """        <div v-if="feedbackDetail" class="modal-overlay" @click.self="feedbackDetail=null">
          <div class="modal" style="max-width:620px">
            <div class="modal-header" style="padding:0 0 14px 0;border-bottom:1px solid var(--border);margin-bottom:14px;">
              <h3><svg class="ui-icon sm" style="margin-right:6px"><use href="#i-message-square"></use></svg>反馈详情 #{{feedbackDetail.id}}</h3>
              <button class="btn-close" @click="feedbackDetail=null" aria-label="关闭"><svg class="ui-icon sm"><use href="#i-x"></use></svg></button>
            </div>"""),
        ("""    <div v-if="showUserModal" class="modal-overlay" @click.self="showUserModal=false">
      <div class="modal">
        <h3>用户管理：{{userForm.username}}</h3>""",
         """    <div v-if="showUserModal" class="modal-overlay" @click.self="showUserModal=false">
      <div class="modal">
        <div class="modal-header" style="padding:0 0 16px 0;border-bottom:1px solid var(--border);margin-bottom:16px;">
          <h3><svg class="ui-icon sm" style="margin-right:6px"><use href="#i-user"></use></svg>用户管理：{{userForm.username}}</h3>
          <button class="btn-close" @click="showUserModal=false" aria-label="关闭"><svg class="ui-icon sm"><use href="#i-x"></use></svg></button>
        </div>"""),
        ("""          <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal=false">
            <div class="modal">
              <h3>添加自定义提供商</h3>""",
         """          <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal=false">
            <div class="modal">
              <div class="modal-header" style="padding:0 0 16px 0;border-bottom:1px solid var(--border);margin-bottom:16px;">
                <h3><svg class="ui-icon sm" style="margin-right:6px"><use href="#i-cpu"></use></svg>添加自定义提供商</h3>
                <button class="btn-close" @click="showAddModal=false" aria-label="关闭"><svg class="ui-icon sm"><use href="#i-x"></use></svg></button>
              </div>"""),

        # Model testing and deletion
        ("<button class=\"btn-test\" :disabled=\"testingModel===(entry.key+'-'+idx)\" :title=\"(m.vision?'实测能否识图（发一张纯色小图）：':'文本连通性：')+(m.value||'模型')\" @click=\"testModel(entry.info,m,entry.key+'-'+idx)\">{{testingModel===(entry.key+'-'+idx)?'…':'⚡'}}</button>",
         "<button class=\"btn-test\" :disabled=\"testingModel===(entry.key+'-'+idx)\" :title=\"(m.vision?'实测能否识图（发一张纯色小图）：':'文本连通性：')+(m.value||'模型')\" @click=\"testModel(entry.info,m,entry.key+'-'+idx)\"><span v-if=\"testingModel===(entry.key+'-'+idx)\">…</span><svg v-else class=\"ui-icon xs\"><use href=\"#i-zap\"></use></svg></button>"),
        ('<button class="btn-del" @click="removeModel(entry.key,idx)">×</button>',
         '<button class="btn-del" @click="removeModel(entry.key,idx)" aria-label="删除"><svg class="ui-icon xs"><use href="#i-x"></use></svg></button>'),

        # Mail server status
        ('<span v-else style="font-size:12px;color:var(--text3)">○ 已停用</span>',
         '<span v-else style="font-size:12px;color:var(--text3);display:inline-flex;align-items:center;gap:3px;"><svg class="ui-icon xs"><use href="#i-x-circle"></use></svg> 已停用</span>'),

        # Email template scene badge
        ('<span :class="[\'scene-badge\',\'scene-\'+t.scene]" style="flex-shrink:0"><span style="margin-right:4px;opacity:.8">{{SCENE_ICONS[t.scene]||\'◎\'}}</span>{{ templateSceneLabel(t.scene) }}</span>',
         '<span :class="[\'scene-badge\',\'scene-\'+t.scene]" style="flex-shrink:0;display:inline-flex;align-items:center;gap:4px;"><svg class="ui-icon xs" style="opacity:.85"><use :href="\'#\' + (SCENE_ICONS[t.scene]||\'i-mail\')"></use></svg><span>{{ templateSceneLabel(t.scene) }}</span></span>'),

        # Tip checks
        ('<div class="tip-row"><span class="tip-num" style="background:var(--primary);color:#fff">✓</span>',
         '<div class="tip-row"><span class="tip-num" style="background:var(--accent);color:#fff;display:inline-flex;align-items:center;justify-content:center"><svg class="ui-icon xs"><use href="#i-check"></use></svg></span>'),

        # Plan sorting & enabled
        ('<button :disabled="idx===0" class="sort-btn" :style="{opacity:idx===0?\'0.3\':\'1\',cursor:idx===0?\'default\':\'pointer\'}" @click="movePlan(p.id,\'up\')">▲</button>',
         '<button :disabled="idx===0" class="sort-btn" :style="{opacity:idx===0?\'0.3\':\'1\',cursor:idx===0?\'default\':\'pointer\'}" @click="movePlan(p.id,\'up\')" aria-label="上移"><svg class="ui-icon xs"><use href="#i-chevron-up"></use></svg></button>'),
        ('<button :disabled="idx===paymentPlans.length-1" class="sort-btn sort-btn-bottom" :style="{opacity:idx===paymentPlans.length-1?\'0.3\':\'1\',cursor:idx===paymentPlans.length-1?\'default\':\'pointer\'}" @click="movePlan(p.id,\'down\')">▼</button>',
         '<button :disabled="idx===paymentPlans.length-1" class="sort-btn sort-btn-bottom" :style="{opacity:idx===paymentPlans.length-1?\'0.3\':\'1\',cursor:idx===paymentPlans.length-1?\'default\':\'pointer\'}" @click="movePlan(p.id,\'down\')" aria-label="下移"><svg class="ui-icon xs"><use href="#i-chevron-down"></use></svg></button>'),
        ('<td><span :style="{color:p.enabled?\'var(--success)\':\'var(--danger)\',fontWeight:\'700\',fontSize:\'12px\'}">{{p.enabled?\'● 已启用\':\'● 已停用\'}}</span></td>',
         '<td><span class="badge" :class="p.enabled?\'badge-success\':\'badge-danger\'" style="display:inline-flex;align-items:center;gap:4px;"><svg class="ui-icon xs"><use :href="p.enabled?\'#i-check\':\'#i-x-circle\'"></use></svg> {{p.enabled?\'已启用\':\'已停用\'}}</span></td>'),

        # Collapsible section arrows
        ("<span class=\"st-arrow\">{{payApiCollapsed.alipay?'▸ 展开':'▾ 收起'}}</span>",
         "<span class=\"st-arrow\" style=\"display:inline-flex;align-items:center;gap:4px;\"><svg class=\"ui-icon xs\"><use :href=\"payApiCollapsed.alipay?'#i-chevron-right':'#i-chevron-down'\"></use></svg> {{payApiCollapsed.alipay?'展开':'收起'}}</span>"),
        ("<span class=\"st-arrow\">{{payApiCollapsed.wechat?'▸ 展开':'▾ 收起'}}</span>",
         "<span class=\"st-arrow\" style=\"display:inline-flex;align-items:center;gap:4px;\"><svg class=\"ui-icon xs\"><use :href=\"payApiCollapsed.wechat?'#i-chevron-right':'#i-chevron-down'\"></use></svg> {{payApiCollapsed.wechat?'展开':'收起'}}</span>"),
        ("<span class=\"st-arrow\">{{payApiCollapsed.zhifufm?'▸ 展开':'▾ 收起'}}</span>",
         "<span class=\"st-arrow\" style=\"display:inline-flex;align-items:center;gap:4px;\"><svg class=\"ui-icon xs\"><use :href=\"payApiCollapsed.zhifufm?'#i-chevron-right':'#i-chevron-down'\"></use></svg> {{payApiCollapsed.zhifufm?'展开':'收起'}}</span>"),
        ("<span class=\"st-arrow\">{{payApiCollapsed.sandpay?'▸ 展开':'▾ 收起'}}</span>",
         "<span class=\"st-arrow\" style=\"display:inline-flex;align-items:center;gap:4px;\"><svg class=\"ui-icon xs\"><use :href=\"payApiCollapsed.sandpay?'#i-chevron-right':'#i-chevron-down'\"></use></svg> {{payApiCollapsed.sandpay?'展开':'收起'}}</span>"),
        ("<span class=\"st-arrow\">{{payApiCollapsed.epay?'▸ 展开':'▾ 收起'}}</span>",
         "<span class=\"st-arrow\" style=\"display:inline-flex;align-items:center;gap:4px;\"><svg class=\"ui-icon xs\"><use :href=\"payApiCollapsed.epay?'#i-chevron-right':'#i-chevron-down'\"></use></svg> {{payApiCollapsed.epay?'展开':'收起'}}</span>"),
        ("<span class=\"st-arrow\">{{payApiCollapsed.refund?'▸ 展开':'▾ 收起'}}</span>",
         "<span class=\"st-arrow\" style=\"display:inline-flex;align-items:center;gap:4px;\"><svg class=\"ui-icon xs\"><use :href=\"payApiCollapsed.refund?'#i-chevron-right':'#i-chevron-down'\"></use></svg> {{payApiCollapsed.refund?'展开':'收起'}}</span>"),

        # Question bank images
        ('<span v-if="questionHasImage(item)" style="font-size:11px;color:var(--accent2)">🖼 含图片，仅显示视觉模型</span>',
         '<span v-if="questionHasImage(item)" style="font-size:11px;color:var(--accent2);display:inline-flex;align-items:center;gap:3px;"><svg class="ui-icon xs"><use href="#i-image"></use></svg> 含图片，仅显示视觉模型</span>'),
        ("{{m.label}}{{m.vision?' 🖼':''}} ({{m.provider}})",
         "{{m.label}}{{m.vision?' [视觉]':''}} ({{m.provider}})"),

        # Profile avatar
        ('<div class="profile-avatar"><img v-if="accountConfig.avatar_data" :src="accountConfig.avatar_data"><span v-else>◌</span></div>',
         '<div class="profile-avatar"><img v-if="accountConfig.avatar_data" :src="accountConfig.avatar_data"><svg v-else class="ui-icon lg"><use href="#i-user"></use></svg></div>'),

        # Never called questions
        ('<tr v-if="!bankAnalysis.never_list.length"><td colspan="3" style="padding:24px;text-align:center;color:var(--text3)">所有题目均已被调用过 🎉</td></tr>',
         '<tr v-if="!bankAnalysis.never_list.length"><td colspan="3" style="padding:24px;text-align:center;color:var(--text3);display:inline-flex;align-items:center;justify-content:center;gap:6px"><svg class="ui-icon sm" style="color:var(--success)"><use href="#i-check-circle"></use></svg> 所有题目均已被调用过</td></tr>'),

        # Old user recharge toggle
        ('<div class="metric-card" style="cursor:pointer" @click="toggleOldUserRecharge()"><div class="metric-label">老用户充值 {{oldUserRechargeExpanded?\'▲\':\'▼\'}}</div>',
         '<div class="metric-card" style="cursor:pointer" @click="toggleOldUserRecharge()"><div class="metric-label" style="display:flex;align-items:center;justify-content:space-between"><span>老用户充值</span><svg class="ui-icon xs" style="color:var(--text3)"><use :href="oldUserRechargeExpanded?\'#i-chevron-up\':\'#i-chevron-down\'"></use></svg></div>'),

        # Announce button
        ("<button class=\"btn btn-primary\" :disabled=\"announcePolishing\" @click=\"aiPolishAnnounce\" style=\"position:absolute;right:10px;bottom:10px;padding:3px 12px;font-size:12px;border-radius:4px;opacity:.95\">{{announcePolishing?'优化中...':'✨ AI优化'}}</button>",
         "<button class=\"btn btn-primary\" :disabled=\"announcePolishing\" @click=\"aiPolishAnnounce\" style=\"position:absolute;right:10px;bottom:10px;padding:3px 12px;font-size:12px;border-radius:4px;opacity:.95;display:inline-flex;align-items:center;gap:4px\"><svg class=\"ui-icon xs\"><use href=\"#i-sparkles\"></use></svg> <span>{{announcePolishing?'优化中...':'AI优化'}}</span></button>"),

        # Card pay icon display in form
        ("""<span v-if="cardPayIcon" style="font-size:28px;width:40px;height:40px;display:flex;align-items:center;justify-content:center;border:1px solid var(--border);border-radius:8px;background:var(--bg)">
                      <img v-if="cardPayIcon.startsWith('data:image')" :src="cardPayIcon" style="max-width:36px;max-height:36px;border-radius:4px">
                      <span v-else>{{cardPayIcon}}</span>
                    </span>""",
         """<span v-if="cardPayIcon" style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;border:1px solid var(--border);border-radius:8px;background:var(--bg)">
                      <img v-if="cardPayIcon.startsWith('data:image')" :src="cardPayIcon" style="max-width:32px;max-height:32px;border-radius:4px">
                      <svg v-else-if="cardPayIcon.startsWith('i-')" class="ui-icon md"><use :href="'#'+cardPayIcon"></use></svg>
                      <span v-else style="font-size:12px;color:var(--text2)">{{cardPayIcon}}</span>
                    </span>"""),

        # User table sort headers
        ("<th style=\"text-align:left;padding:10px 8px;cursor:pointer\" @click=\"setSort('id')\">ID {{userSortBy==='id'?(userSortOrder==='asc'?'↑':'↓'):''}}</th>",
         "<th style=\"text-align:left;padding:10px 8px;cursor:pointer\" @click=\"setSort('id')\">ID <svg class=\"ui-icon xs\" style=\"display:inline-block;vertical-align:-1px\" v-if=\"userSortBy==='id'\"><use :href=\"userSortOrder==='asc'?'#i-chevron-up':'#i-chevron-down'\"></use></svg></th>"),
        ("<th style=\"text-align:left;padding:10px 8px;cursor:pointer\" @click=\"setSort('username')\">用户名 {{userSortBy==='username'?(userSortOrder==='asc'?'↑':'↓'):''}}</th>",
         "<th style=\"text-align:left;padding:10px 8px;cursor:pointer\" @click=\"setSort('username')\">用户名 <svg class=\"ui-icon xs\" style=\"display:inline-block;vertical-align:-1px\" v-if=\"userSortBy==='username'\"><use :href=\"userSortOrder==='asc'?'#i-chevron-up':'#i-chevron-down'\"></use></svg></th>"),
        ("<th style=\"text-align:left;padding:10px 8px;cursor:pointer\" @click=\"setSort('points_balance')\">权益 {{userSortBy==='points_balance'?(userSortOrder==='asc'?'↑':'↓'):''}}</th>",
         "<th style=\"text-align:left;padding:10px 8px;cursor:pointer\" @click=\"setSort('points_balance')\">权益 <svg class=\"ui-icon xs\" style=\"display:inline-block;vertical-align:-1px\" v-if=\"userSortBy==='points_balance'\"><use :href=\"userSortOrder==='asc'?'#i-chevron-up':'#i-chevron-down'\"></use></svg></th>"),
        ("<th style=\"text-align:left;padding:10px 8px;cursor:pointer\" @click=\"setSort('created_at')\">注册时间 {{userSortBy==='created_at'?(userSortOrder==='asc'?'↑':'↓'):''}}</th>",
         "<th style=\"text-align:left;padding:10px 8px;cursor:pointer\" @click=\"setSort('created_at')\">注册时间 <svg class=\"ui-icon xs\" style=\"display:inline-block;vertical-align:-1px\" v-if=\"userSortBy==='created_at'\"><use :href=\"userSortOrder==='asc'?'#i-chevron-up':'#i-chevron-down'\"></use></svg></th>"),
        ("<th style=\"text-align:left;padding:10px 8px;cursor:pointer\" @click=\"setSort('register_ip')\">注册IP {{userSortBy==='register_ip'?(userSortOrder==='asc'?'↑':'↓'):''}}</th>",
         "<th style=\"text-align:left;padding:10px 8px;cursor:pointer\" @click=\"setSort('register_ip')\">注册IP <svg class=\"ui-icon xs\" style=\"display:inline-block;vertical-align:-1px\" v-if=\"userSortBy==='register_ip'\"><use :href=\"userSortOrder==='asc'?'#i-chevron-up':'#i-chevron-down'\"></use></svg></th>"),
        ("<th style=\"text-align:left;padding:10px 8px;cursor:pointer\" @click=\"setSort('last_login_at')\">最近登录 {{userSortBy==='last_login_at'?(userSortOrder==='asc'?'↑':'↓'):''}}</th>",
         "<th style=\"text-align:left;padding:10px 8px;cursor:pointer\" @click=\"setSort('last_login_at')\">最近登录 <svg class=\"ui-icon xs\" style=\"display:inline-block;vertical-align:-1px\" v-if=\"userSortBy==='last_login_at'\"><use :href=\"userSortOrder==='asc'?'#i-chevron-up':'#i-chevron-down'\"></use></svg></th>"),
        ("<th style=\"text-align:left;padding:10px 8px;cursor:pointer\" @click=\"setSort('last_login_ip')\">登录IP {{userSortBy==='last_login_ip'?(userSortOrder==='asc'?'↑':'↓'):''}}</th>",
         "<th style=\"text-align:left;padding:10px 8px;cursor:pointer\" @click=\"setSort('last_login_ip')\">登录IP <svg class=\"ui-icon xs\" style=\"display:inline-block;vertical-align:-1px\" v-if=\"userSortBy==='last_login_ip'\"><use :href=\"userSortOrder==='asc'?'#i-chevron-up':'#i-chevron-down'\"></use></svg></th>"),

        # Payment table sort headers
        ("<th style=\"padding:8px 10px;cursor:pointer;white-space:nowrap\" @click=\"togglePaymentSort('order_no')\">订单号 {{paymentOrdersSort.field==='order_no'?(paymentOrdersSort.order==='desc'?'↓':'↑'):''}}</th>",
         "<th style=\"padding:8px 10px;cursor:pointer;white-space:nowrap\" @click=\"togglePaymentSort('order_no')\">订单号 <svg class=\"ui-icon xs\" style=\"display:inline-block;vertical-align:-1px\" v-if=\"paymentOrdersSort.field==='order_no'\"><use :href=\"paymentOrdersSort.order==='asc'?'#i-chevron-up':'#i-chevron-down'\"></use></svg></th>"),
        ("<th style=\"padding:8px 10px;cursor:pointer;white-space:nowrap\" @click=\"togglePaymentSort('username')\">用户名 {{paymentOrdersSort.field==='username'?(paymentOrdersSort.order==='desc'?'↓':'↑'):''}}</th>",
         "<th style=\"padding:8px 10px;cursor:pointer;white-space:nowrap\" @click=\"togglePaymentSort('username')\">用户名 <svg class=\"ui-icon xs\" style=\"display:inline-block;vertical-align:-1px\" v-if=\"paymentOrdersSort.field==='username'\"><use :href=\"paymentOrdersSort.order==='asc'?'#i-chevron-up':'#i-chevron-down'\"></use></svg></th>"),
        ("<th style=\"padding:8px 10px;cursor:pointer;white-space:nowrap\" @click=\"togglePaymentSort('price')\">金额 {{paymentOrdersSort.field==='price'?(paymentOrdersSort.order==='desc'?'↓':'↑'):''}}</th>",
         "<th style=\"padding:8px 10px;cursor:pointer;white-space:nowrap\" @click=\"togglePaymentSort('price')\">金额 <svg class=\"ui-icon xs\" style=\"display:inline-block;vertical-align:-1px\" v-if=\"paymentOrdersSort.field==='price'\"><use :href=\"paymentOrdersSort.order==='asc'?'#i-chevron-up':'#i-chevron-down'\"></use></svg></th>"),
        ("<th style=\"padding:8px 10px;cursor:pointer;white-space:nowrap\" @click=\"togglePaymentSort('client_ip')\">下单IP {{paymentOrdersSort.field==='client_ip'?(paymentOrdersSort.order==='desc'?'↓':'↑'):''}}</th>",
         "<th style=\"padding:8px 10px;cursor:pointer;white-space:nowrap\" @click=\"togglePaymentSort('client_ip')\">下单IP <svg class=\"ui-icon xs\" style=\"display:inline-block;vertical-align:-1px\" v-if=\"paymentOrdersSort.field==='client_ip'\"><use :href=\"paymentOrdersSort.order==='asc'?'#i-chevron-up':'#i-chevron-down'\"></use></svg></th>"),
        ("<th style=\"padding:8px 10px;cursor:pointer;white-space:nowrap\" @click=\"togglePaymentSort('status')\">状态 {{paymentOrdersSort.field==='status'?(paymentOrdersSort.order==='desc'?'↓':'↑'):''}}</th>",
         "<th style=\"padding:8px 10px;cursor:pointer;white-space:nowrap\" @click=\"togglePaymentSort('status')\">状态 <svg class=\"ui-icon xs\" style=\"display:inline-block;vertical-align:-1px\" v-if=\"paymentOrdersSort.field==='status'\"><use :href=\"paymentOrdersSort.order==='asc'?'#i-chevron-up':'#i-chevron-down'\"></use></svg></th>"),
        ("<th style=\"padding:8px 10px;cursor:pointer;white-space:nowrap\" @click=\"togglePaymentSort('created_at')\">创建时间 {{paymentOrdersSort.field==='created_at'?(paymentOrdersSort.order==='desc'?'↓':'↑'):''}}</th>",
         "<th style=\"padding:8px 10px;cursor:pointer;white-space:nowrap\" @click=\"togglePaymentSort('created_at')\">创建时间 <svg class=\"ui-icon xs\" style=\"display:inline-block;vertical-align:-1px\" v-if=\"paymentOrdersSort.field==='created_at'\"><use :href=\"paymentOrdersSort.order==='asc'?'#i-chevron-up':'#i-chevron-down'\"></use></svg></th>"),
    ]
    for old_p2, new_p2 in pass2_subs:
        content = content.replace(old_p2, new_p2)

    # Return statement in setup()
    content = content.replace("loading,page,loginMode,themeMode,themeLabels,themeIcons,cycleTheme,breadcrumbItems,navigateBreadcrumb",
                              "loading,page,loginMode,themeMode,themeLabels,themeIcons,cycleTheme,breadcrumbItems,navigateBreadcrumb,toasts,removeToast")

    return content

if __name__ == '__main__':
    with open('static/admin.html', 'r', encoding='utf-8') as f:
        src = f.read()
    
    out = modernize_content(src)
    with open('static/admin.html', 'w', encoding='utf-8') as f:
        f.write(out)
    print("Modernization applied to static/admin.html successfully.")
