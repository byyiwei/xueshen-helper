// ==UserScript==
// @name         学习通学神助手｜超星·智慧树全能学习助手｜学神助手｜AI智能辅助学习｜自动刷课｜视频倍速｜作业考试
// @namespace    IPYIWEI
// @version      5.0.3
// @updateURL    https://raw.githubusercontent.com/byyiwei/xueshen-helper/main/scripts/xueshen-sc.js
// @downloadURL  https://raw.githubusercontent.com/byyiwei/xueshen-helper/main/scripts/xueshen-sc.js
// @author       IPYIWEI
// @description  超星学习通/智慧树自动学习助手｜DeepSeek AI智能辅助学习｜视频倍速学习｜自动切换任务点｜作业考试全自动｜字体加密解析｜海量题库每日更新
// @description:zh-CN 超星学习通/智慧树自动学习助手｜DeepSeek AI智能辅助学习｜视频倍速学习｜自动切换任务点｜作业考试全自动｜字体加密解析｜海量题库每日更新
// @homepageURL  https://xs.openget.cn/
// @supportURL   https://xs.openget.cn/user.html
// @license      Proprietary
// @icon         https://xs.openget.cn/static/icon.jpg
// @match        *://*.chaoxing.com/*
// @match        *://*.neauce.com/*
// @match        *://*.zhihuishu.com/*
// @match        *://*.edu.cn/*
// @require      https://xs.openget.cn/libs/vue/3.4.31/vue.global.prod.js
// @require      https://xs.openget.cn/libs/vue-demi/0.14.7/index.iife.js
// @require      data:application/javascript,window.Vue%3DVue%3B
// @require      https://xs.openget.cn/libs/pinia/2.1.7/pinia.iife.min.js
// @require      https://xs.openget.cn/libs/dayjs/1.11.10/dayjs.min.js
// @require      https://xs.openget.cn/libs/dompurify/3.1.6/purify.min.js
// @require      https://xs.openget.cn/libs/dayjs/1.11.10/plugin/customParseFormat.js
// @require      https://xs.openget.cn/libs/dayjs/1.11.10/plugin/weekday.js
// @require      https://xs.openget.cn/libs/dayjs/1.11.10/plugin/localeData.js
// @require      https://xs.openget.cn/libs/dayjs/1.11.10/plugin/weekOfYear.js
// @require      https://xs.openget.cn/libs/dayjs/1.11.10/plugin/weekYear.js
// @require      https://xs.openget.cn/libs/dayjs/1.11.10/plugin/advancedFormat.js
// @require      https://xs.openget.cn/libs/dayjs/1.11.10/plugin/quarterOfYear.js
// @require      https://xs.openget.cn/libs/ant-design-vue/4.2.6/antd.min.js
// @require      https://xs.openget.cn/libs/blueimp-md5/2.19.0/js/md5.min.js
// @require      https://xs.openget.cn/libs/rxjs/7.8.1/rxjs.umd.min.js
// @require      https://xs.openget.cn/libs/marked/16.1.1/lib/marked.umd.min.js
// @resource     ttf   https://xs.openget.cn/libs/ttf/table.json
// @resource     ttf2  https://xs.openget.cn/libs/ttf2/table.json
// @connect      chaoxing.com
// @connect      zhihuishu.com
// @connect      xs.openget.cn
// @connect      127.0.0.1
// @connect      localhost
// @grant        GM_getResourceText
// @grant        GM_getValue
// @grant        GM_info
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @run-at       document-start
// @tag          自动学习
// @tag          AI答题
// @tag          超星学习通
// @tag          智慧树
// @tag          网课
// ==/UserScript==

(e=>{document.__abcHelperCSS=e})(' .theme-light{--t-bg:#f5f6f8;--t-surface:#fff;--t-surface2:#f0f2f5;--t-border:#e2e5ea;--t-border2:#d1d5db;--t-text:#1a1a2e;--t-text2:#4b5563;--t-text3:#9ca3af;--t-primary:#2563eb;--t-primary-bg:#eff6ff;--t-primary-border:#bfdbfe;--t-accent:#7c3aed;--t-success:#16a34a;--t-warning:#d97706;--t-danger:#dc2626;--t-info:#0891b2;--t-pink:#db2777;--t-shadow:rgba(0,0,0,.08);--t-shadow2:rgba(0,0,0,.04)}.theme-dark{--t-bg:#0d1117;--t-surface:#161b22;--t-surface2:#1c2330;--t-border:#30363d;--t-border2:#484f58;--t-text:#e6edf3;--t-text2:#9198a1;--t-text3:#6e7681;--t-primary:#3b82f6;--t-primary-bg:rgba(59,130,246,.1);--t-primary-border:rgba(59,130,246,.3);--t-accent:#a78bfa;--t-success:#3fb950;--t-warning:#d29922;--t-danger:#f85149;--t-info:#22d3ee;--t-pink:#f472b6;--t-shadow:rgba(0,0,0,.3);--t-shadow2:rgba(0,0,0,.15)}.log-wrap{font:13px "Segoe UI",system-ui,-apple-system,sans-serif}.log-wrap{display:flex;flex-direction:column;height:100%}.log-wrap .console{flex:1;min-height:200px;max-height:calc(100vh - 120px);width:100%;box-sizing:border-box;overflow-y:scroll;background:var(--t-surface2);padding:10px;color:var(--t-text2);font-size:12px;border-radius:6px;border:1px solid var(--t-border)}.log-wrap .console div{padding:2px 0}.log-wrap .console div span{margin:0 3px}.log-wrap .console div span .module{background:var(--t-primary);color:#fff;padding:1px 5px;border-radius:3px;font-size:10px;font-weight:600}.log-wrap .console .log{color:var(--t-text3)}.log-wrap .console .warning{color:var(--t-warning)}.home-wrap[data-v-137ea562]{font:14px "Segoe UI",system-ui,-apple-system,sans-serif;color:var(--t-text)}.home-wrap a{color:var(--t-primary);text-decoration:none}.home-wrap a:hover{text-decoration:underline}.home-wrap ol li{line-height:26px;list-style-type:decimal;list-style-position:inside;color:var(--t-text2)}.home-wrap .tips ul li span{color:var(--t-warning)}.home-wrap .hero{padding:16px 14px;margin:8px;background:linear-gradient(135deg,var(--t-primary),var(--t-accent));border-radius:8px;color:#fff;text-align:center}.home-wrap .hero .hero-title{font-size:18px;font-weight:700;margin-bottom:4px}.home-wrap .hero .hero-sub{font-size:12px;opacity:.85}.home-wrap .home-section{margin:8px;padding:12px 14px;background:var(--t-surface);border:1px solid var(--t-border);border-radius:6px}.home-wrap .home-section .section-title{font-size:13px;font-weight:700;color:var(--t-text);margin-bottom:8px;display:flex;align-items:center;gap:4px}.home-wrap .home-section ul{list-style:none;padding:0;margin:0}.home-wrap .home-section ul li{list-style:none;padding:4px 0;color:var(--t-text2);font-size:12px;line-height:1.6}.collapsible-section{cursor:pointer;user-select:none;transition:background .15s}.collapsible-section:hover{background:var(--t-surface2)}.collapsible-section .section-title{justify-content:space-between;gap:8px;margin-bottom:0}.collapse-icon{font-size:14px;color:var(--t-text3);font-weight:700;width:22px;height:22px;display:flex;align-items:center;justify-content:center;border-radius:4px;background:var(--t-surface2);transition:all .15s}.collapsible-section:hover .collapse-icon{background:var(--t-primary-bg);color:var(--t-primary)}.home-card-btn{display:block;margin-top:8px;padding:10px 12px;background:linear-gradient(135deg,var(--t-primary),var(--t-accent));border-radius:6px;color:#fff!important;text-align:center;font-size:13px;font-weight:600;cursor:pointer;text-decoration:none;transition:opacity .15s,transform .15s}.home-card-btn:hover{opacity:.9;transform:translateY(-1px);color:#fff!important}.home-wrap .login-box{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-bottom:8px}.home-wrap .login-box input{height:30px;width:140px;padding:0 8px;border:1px solid var(--t-border2);border-radius:4px;background:var(--t-surface);color:var(--t-text);font-size:12px;outline:none}.home-wrap .login-box input:focus{border-color:var(--t-primary)}.home-wrap .login-box button{height:30px;padding:0 12px;border:none;border-radius:4px;font-size:12px;cursor:pointer;font-weight:500;transition:opacity .15s}.home-wrap .login-box button:hover{opacity:.85}.home-wrap .login-box .btn-primary{background:var(--t-primary);color:#fff}.home-wrap .login-box .btn-ghost{background:var(--t-surface2);color:var(--t-text2);border:1px solid var(--t-border2)}.home-wrap .login-box .btn-outline{background:transparent;color:var(--t-primary);border:1px solid var(--t-primary)}.home-wrap .login-meta{display:flex;gap:8px;align-items:center;margin-top:6px;color:var(--t-text3);font-size:11px;flex-wrap:wrap}.home-wrap .login-msg{margin-top:6px;font-size:12px}.answer-wrap .search-info{-webkit-user-select:none;user-select:none;box-sizing:border-box;display:flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:4px;border:1px solid var(--t-border2);margin-right:4px;font-weight:600;font-size:11px;background:var(--t-surface2);color:var(--t-text3);flex-shrink:0}.answer-wrap .search-info.default{box-shadow:none}.answer-wrap .search-info.searching{box-shadow:0 0 6px 1px var(--t-primary-border);border-color:var(--t-primary);color:var(--t-primary);animation:pulse 1.2s ease infinite}.answer-wrap .search-info.success{color:#fff;border:0;background:var(--t-success)}.answer-wrap .search-info.ai-success{color:#fff;border:0;background:var(--t-accent)}.answer-wrap .search-info.warning{color:var(--t-warning);border:1px solid var(--t-warning)}.answer-wrap .answer-tips{font-size:12px;color:var(--t-text3)}.answer-wrap .answer-tips span{margin-right:4px}.answer-wrap .answer-tips .box-tips{display:flex;align-items:center}.answer-wrap .answer-tips .box-tips div{margin:0 4px 0 0!important}.answer-wrap .answer-tips .box-tips span{margin-right:8px}.answer-wrap .answer-list{flex-wrap:wrap;color:var(--t-text);display:flex}.answer-wrap .answer-list .search-info{cursor:pointer!important}.answer-wrap .answer-list div{margin:0 8px 8px 0!important;cursor:pointer!important}.answer-wrap .answer-detail{position:relative;max-height:200px;overflow-y:scroll;scroll-behavior:smooth}.answer-wrap .answer-detail .answer-item{margin-bottom:8px}.answer-wrap .answer-detail .answer-content{margin-top:4px;padding:8px 10px;border-radius:4px;background:var(--t-surface2);font-weight:600;color:var(--t-text);border-left:2px solid var(--t-primary);font-size:13px}.answer-wrap .answer-detail .answer-content .module{padding:1px 4px;border-radius:3px;color:var(--t-text3);border:1px solid var(--t-border2);font-size:10px}.ant-tooltip,.ant-select-dropdown{z-index:99999!important}.config-wrap{min-width:420px!important;width:420px!important;max-width:480px;color:var(--t-text);font-size:13px;padding:10px 16px;box-sizing:border-box}.config-wrap .config{margin-bottom:14px;display:flex;align-items:flex-start;gap:12px;min-height:32px}.config-wrap .config .config-name{display:flex;align-items:flex-start;width:120px;flex-shrink:0;font-size:12px;color:var(--t-text2);line-height:1.5;padding-top:6px}.config-wrap .config .config-input{flex:1;display:flex;align-items:center;justify-content:flex-start;gap:6px;min-width:0;padding-top:2px}.config-wrap .config .config-input .ant-select{width:100%!important;max-width:260px}.config-wrap .config .config-input .ant-input{width:100%!important;max-width:260px}.config-wrap .config .config-input .ant-input-number{width:100px!important}.config-wrap .config .config-input .ant-slider{flex:1;max-width:180px!important;margin:0 10px 0 0}.config-wrap .buy-btn{background:var(--t-primary);padding:5px 12px;border-radius:4px;height:28px;color:#fff;cursor:pointer;font-weight:600;border:none;font-size:12px;white-space:nowrap}.config-wrap .buy-btn a{color:#fff}.config-wrap .switch-item{display:inline-flex!important;width:calc(50% - 6px)!important;margin-right:12px;margin-bottom:12px!important;vertical-align:top;box-sizing:border-box;gap:8px}.config-wrap .switch-item .config-name{flex:1;width:auto!important;padding-top:0;line-height:1.5;word-break:break-word}.config-wrap .switch-item .config-input{width:auto!important;flex:none;padding-top:0}.config-wrap .switch-item .ant-switch{margin-top:0!important}.config-wrap .switch-item:nth-of-type(2n){margin-right:0}.ant-message{z-index:999999!important}.online-search-wrap{color:var(--t-text);width:420px;box-sizing:border-box}.online-search-wrap .config{padding:8px 10px 4px;display:flex}.online-search-wrap .config .config-name{width:150px}.online-search-wrap .config .config-input{display:flex;justify-content:right;flex:1}.online-search-wrap .searth-input-wrap{padding:8px 10px 4px;display:flex}.online-search-wrap .searth-input-wrap .title{padding-top:5px}.online-search-wrap .searth-input-wrap .searth-input{margin-left:16px;flex:1}.online-search-wrap .search-btn{padding-right:10px;display:flex;justify-content:right}.online-search-wrap .result-list{margin-top:8px;max-height:calc(100vh - 200px);overflow:auto}.online-search-wrap .result-list .result-item{margin-bottom:8px}.online-search-wrap .result-list .result-item em{font-weight:600;color:var(--t-warning)}.online-search-wrap .result-list .result-answer{margin-top:4px;padding:8px 10px;border-radius:4px;background:var(--t-surface2);font-weight:600;color:var(--t-text);border-left:2px solid var(--t-primary)}div{margin:0}.ai-wrapper{width:420px}.ai-message-role-avatar{margin:0}.ai-message-content{margin:0;padding:8px 10px;border-radius:6px;background:var(--t-surface2);font-size:14px;-webkit-user-select:text;user-select:text;word-break:break-word;border:1px solid var(--t-border);position:relative;transition:all .2s ease}.ai-message-content pre{white-space:pre-wrap;background:var(--t-bg);color:var(--t-text);padding:10px;border-radius:4px;border:1px solid var(--t-border);font-size:13px}.ai-message-container{display:flex;flex-direction:column;align-items:flex-start}.ai-message-container.user-message{align-items:flex-end}.ai-message-list{height:calc(100vh - 160px);max-height:360px;min-height:200px;overflow-y:auto;display:flex;flex-direction:column;gap:8px}.ai-message-item{width:100%}.user-avatar{display:flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:4px;border:1px solid var(--t-border);background:var(--t-primary-bg);margin-bottom:4px;font-size:13px}.ai-input-wrapper{padding:8px;margin-top:8px;border-radius:6px;border:1px solid var(--t-border);display:flex;align-items:center;justify-content:center;background:var(--t-surface)}.ai-input-wrapper textarea{flex:1;height:46px;border:none;margin-right:8px;background:transparent;color:var(--t-text);resize:none;outline:none}.send-message-btn{display:flex;align-items:center;justify-content:center;height:34px;border-radius:4px;border:none;padding:0 12px;background:var(--t-primary);color:#fff;cursor:pointer!important;gap:4px;font-weight:600;font-size:13px}.send-message-btn:hover{opacity:.85}.loading-container{display:flex;align-items:center;justify-content:center;gap:4px}.record-wrap{padding-bottom:6px}.record-tip{display:flex;align-items:center;justify-content:space-between;padding:0 8px 6px;color:var(--t-text3);font-size:11px}.record-filter{display:flex;gap:6px;padding:0 8px 8px;flex-wrap:wrap}.filter-btn{padding:3px 8px;color:var(--t-text2);background:var(--t-surface2);border:1px solid var(--t-border);border-radius:3px;cursor:pointer;transition:all .15s ease;font-size:11px}.filter-btn:hover{color:var(--t-primary);border-color:var(--t-primary-border);background:var(--t-primary-bg)}.filter-btn.active{color:var(--t-primary);border-color:var(--t-primary);background:var(--t-primary-bg)}.record-list{display:flex;flex-direction:column;gap:6px;padding:0 8px 6px;max-height:calc(100vh - 160px);overflow-y:auto}.clear-btn{color:var(--t-text2);border-color:var(--t-border);background:var(--t-surface2);border-radius:3px;font-size:12px}.clear-btn:hover,.clear-btn:focus{color:var(--t-danger);border-color:var(--t-danger);background:rgba(220,38,38,.06)}.record-item{padding:8px 10px;border:1px solid var(--t-border);border-radius:4px;background:var(--t-surface);transition:border-color .15s}.record-item:hover{border-color:var(--t-border2)}.record-row{display:flex;align-items:flex-start;line-height:20px;font-size:12px}.record-label{width:60px;flex-shrink:0;color:var(--t-primary);font-weight:600;font-size:11px}.record-value{flex:1;color:var(--t-text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.tab-content{flex:1!important;min-width:420px!important;width:420px!important;min-height:320px;max-width:480px;max-height:calc(100vh - 96px);overflow-y:auto;padding:8px 12px;box-sizing:border-box}.ant-tabs-nav-operations{display:none!important}.box-content{min-width:300px;display:flex!important;flex-direction:row!important;gap:0!important}.separator{display:flex;align-items:center;padding:14px 0 10px;font-size:13px;font-weight:700;color:var(--t-text);border-top:1px solid var(--t-border);margin-top:6px}.separator:first-child{border-top:none;margin-top:0}.tips{padding:10px 12px;background:rgba(217,119,6,.06);border:1px solid rgba(217,119,6,.15);border-radius:6px;width:-webkit-fill-available;margin:4px 0 14px;line-height:22px;letter-spacing:.2px;color:var(--t-warning);font-size:12px;box-sizing:border-box}.tips button{background:var(--t-warning)!important;border-color:var(--t-warning)!important;color:#fff!important}.tips a{color:var(--t-primary);text-decoration:underline}.backend-dropdown-overlay{z-index:100001!important}.ant-dropdown-menu{background:var(--t-surface)!important;border:1px solid var(--t-border)!important;border-radius:4px!important;box-shadow:0 4px 16px var(--t-shadow)!important;padding:4px 0!important}.ant-dropdown-menu-item{color:var(--t-text)!important;font-size:12px!important;padding:6px 12px!important}.ant-dropdown-menu-item:hover{background:var(--t-primary-bg)!important;color:var(--t-primary)!important}.ant-dropdown-menu-item-divider{background-color:var(--t-border)!important}.main-wrap{position:fixed;top:0;z-index:99999!important;user-select:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;pointer-events:auto}.message-container{margin-bottom:4px;position:absolute;bottom:100%;left:50%;width:100%;transform:translate(-50%);min-width:280px}.main-box{padding:0;font:13px "Segoe UI",system-ui,-apple-system,sans-serif;color:var(--t-text);background:var(--t-bg);box-shadow:0 8px 32px var(--t-shadow),0 0 0 1px var(--t-border);border-radius:8px;letter-spacing:0;overflow:hidden;transition:box-shadow .2s;display:flex;flex-direction:column;max-height:calc(100vh - 60px)}.main-box:hover{box-shadow:0 12px 32px var(--t-shadow),0 0 0 1px var(--t-border2)}.main-box .box-header{display:flex;justify-content:space-between;align-items:center;height:36px;cursor:move;padding:0 10px;background:var(--t-surface);border-bottom:1px solid var(--t-border);flex-shrink:0}.main-box .box-header div{margin:0}.main-box .box-header .header-left{display:flex;align-items:center;gap:6px}.main-box .box-header .script-info{-webkit-user-select:none!important;user-select:none!important;font-weight:700;color:var(--t-primary);letter-spacing:0;font-size:13px;display:flex;align-items:center;gap:4px}.main-box .box-header .script-info:before{content:"";display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--t-success);box-shadow:0 0 4px var(--t-success);margin-right:2px}.main-box .box-header .backend-entry{text-decoration:none;color:var(--t-text2);padding:3px 8px;border-radius:4px;cursor:pointer;-webkit-user-select:none!important;user-select:none!important;transition:all .15s ease;font-size:11px;background:var(--t-surface2);border:1px solid var(--t-border)}.main-box .box-header .backend-entry.active,.main-box .box-header .backend-entry:hover{color:var(--t-primary);background:var(--t-primary-bg);border-color:var(--t-primary-border)}.main-box .box-header .theme-toggle{width:28px;height:28px;border-radius:4px;border:1px solid var(--t-border);background:var(--t-surface2);color:var(--t-text2);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:14px;transition:all .15s ease}.main-box .box-header .theme-toggle:hover{color:var(--t-primary);border-color:var(--t-primary-border);background:var(--t-primary-bg)}.main-box .box-header .shrink-btn{width:28px;height:28px;border-radius:4px;border:1px solid var(--t-border);background:var(--t-surface2);color:var(--t-text2);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:14px;transition:all .15s ease}.main-box .box-header .shrink-btn:hover{color:var(--t-danger);border-color:var(--t-danger)}.main-box .box-content{display:flex;flex:1;overflow:hidden;min-height:0}.main-box .box-content.mini{display:none}.mini-ball{position:fixed;display:flex;align-items:center;gap:16px;height:82px;padding:0 38px 0 14px;border-radius:41px;background:linear-gradient(135deg,#0d1117 0%,#161b22 20%,#1a1a2e 40%,#2d1b4e 60%,#1a1a2e 80%,#0d1117 100%);background-size:400% 400%;box-shadow:0 12px 36px rgba(0,0,0,.6),0 0 0 2px rgba(139,92,246,.25),0 0 14px rgba(139,92,246,.2),0 0 28px rgba(124,58,237,.15),0 0 48px rgba(139,92,246,.1),inset 0 1px 2px rgba(255,255,255,.08);cursor:pointer;z-index:9999999;user-select:none;transition:transform .3s cubic-bezier(.34,1.56,.64,1),box-shadow .3s ease;animation:miniBallGradient 5s ease infinite,miniBallGlow 2.5s ease-in-out infinite}.mini-ball:hover{transform:scale(1.1) translateY(-4px);box-shadow:0 16px 44px rgba(0,0,0,.65),0 0 0 3px rgba(139,92,246,.35),0 0 20px rgba(139,92,246,.25),0 0 40px rgba(124,58,237,.2),0 0 64px rgba(139,92,246,.15),inset 0 1px 2px rgba(255,255,255,.12)}.mini-ball:active{transform:scale(.94)}.mini-ball-icon{width:62px;height:62px;border-radius:50%;background:rgba(139,92,246,.15);display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;font-size:17px;font-weight:800;letter-spacing:1px;backdrop-filter:blur(10px);box-shadow:inset 0 1px 2px rgba(255,255,255,.15),0 0 18px rgba(139,92,246,.15);animation:miniBallIconPulse 2s ease-in-out infinite;gap:1px}.mini-ball-count{font-size:9px;font-weight:700;color:#a78bfa;text-shadow:0 0 6px rgba(167,139,250,.5);line-height:1}.mini-ball:hover .mini-ball-icon{animation:miniBallIconWiggle .5s ease}.mini-ball-body{display:flex;flex-direction:column;align-items:flex-start;gap:3px}.mini-ball-text{color:#fff;font-size:18px;font-weight:800;white-space:nowrap;text-shadow:0 1px 4px rgba(0,0,0,.3);animation:miniBallTextSlide .5s cubic-bezier(.22,1,.36,1)}.mini-ball-sub{color:rgba(255,255,255,.88);font-size:13px;font-weight:500;white-space:nowrap;text-shadow:0 1px 3px rgba(0,0,0,.25);animation:miniBallTextSlide .5s .1s cubic-bezier(.22,1,.36,1) both}.mini-ball-shine{position:absolute;inset:0;border-radius:41px;overflow:hidden;pointer-events:none}.mini-ball-shine:before{content:"";position:absolute;top:0;left:-100%;width:80%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.2),transparent);transform:skewX(-20deg);animation:miniBallShine 3.5s ease-in-out infinite}.mini-ball-glow{position:absolute;inset:-8px;border-radius:49px;background:linear-gradient(135deg,#1a1a2e,#2d1b4e,#533483,#7c3aed);filter:blur(16px);opacity:.25;z-index:-1;animation:miniBallGlowRotate 6s linear infinite}.mini-ball-orbits{position:absolute;inset:0;border-radius:41px;overflow:hidden;pointer-events:none}.mini-ball-orbits i{position:absolute;width:7px;height:7px;border-radius:50%;background:#a78bfa;box-shadow:0 0 10px #a78bfa;opacity:.65}.mini-ball-orbits i:first-child{top:10px;right:20px;animation:miniBallOrbit1 2.5s linear infinite}.mini-ball-orbits i:last-child{bottom:10px;left:24px;animation:miniBallOrbit2 3s linear infinite}@keyframes miniBallGradient{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}@keyframes miniBallGlow{0%,100%{box-shadow:0 10px 30px rgba(0,0,0,.5),0 0 0 2px rgba(139,92,246,.2),0 0 14px rgba(139,92,246,.15),0 0 28px rgba(124,58,237,.12),0 0 44px rgba(139,92,246,.08),inset 0 1px 2px rgba(255,255,255,.06)}50%{box-shadow:0 12px 36px rgba(0,0,0,.55),0 0 0 2px rgba(139,92,246,.25),0 0 20px rgba(139,92,246,.2),0 0 38px rgba(139,92,246,.15),0 0 56px rgba(124,58,237,.12),inset 0 1px 2px rgba(255,255,255,.08)}}@keyframes miniBallGlowRotate{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}@keyframes miniBallIconPulse{0%,100%{box-shadow:inset 0 1px 2px rgba(255,255,255,.15),0 0 0 0 rgba(139,92,246,.2)}50%{box-shadow:inset 0 1px 2px rgba(255,255,255,.15),0 0 0 14px rgba(139,92,246,0)}}@keyframes miniBallIconWiggle{0%,100%{transform:rotate(0)}25%{transform:rotate(-12deg)}75%{transform:rotate(12deg)}}@keyframes miniBallTextSlide{0%{opacity:0;transform:translateX(-14px)}100%{opacity:1;transform:translateX(0)}}@keyframes miniBallShine{0%,100%{left:-100%}50%,70%{left:150%}}@keyframes miniBallOrbit1{0%{transform:translate(0,0) scale(1);opacity:.6}50%{transform:translate(-18px,14px) scale(.6);opacity:.2}100%{transform:translate(0,0) scale(1);opacity:.6}}@keyframes miniBallOrbit2{0%{transform:translate(0,0) scale(.6);opacity:.2}50%{transform:translate(14px,-12px) scale(1);opacity:.6}100%{transform:translate(0,0) scale(.6);opacity:.2}}.ant-btn{border-radius:4px!important;font-size:12px!important}.ant-btn-primary{background:var(--t-primary)!important;border-color:var(--t-primary)!important}.ant-btn-primary:hover{opacity:.85!important}.ant-input,.ant-input-affix-wrapper{background:var(--t-surface)!important;border-color:var(--t-border2)!important;border-radius:4px!important;color:var(--t-text)!important;font-size:12px!important}.ant-input:focus,.ant-input-affix-wrapper-focused{border-color:var(--t-primary)!important;box-shadow:0 0 0 2px var(--t-primary-border)!important}.ant-input:hover,.ant-input-affix-wrapper:hover{border-color:var(--t-border2)!important}.ant-input-number{background:var(--t-surface)!important;border-color:var(--t-border2)!important;border-radius:4px!important;color:var(--t-text)!important;font-size:12px!important}.ant-input-number-input{color:var(--t-text)!important;background:transparent!important}.ant-input-number-focused{border-color:var(--t-primary)!important;box-shadow:0 0 0 2px var(--t-primary-border)!important}.ant-input-number-handler-wrap{background:var(--t-surface2)!important;border-left-color:var(--t-border)!important}.ant-input-number-handler span{color:var(--t-text2)!important}.ant-select-selector{background:var(--t-surface)!important;border-color:var(--t-border2)!important;border-radius:4px!important;color:var(--t-text)!important;font-size:12px!important;min-height:30px!important}.config-wrap .ant-select{width:100%!important;max-width:220px}.ant-select-selection-item{color:var(--t-text)!important}.ant-select-arrow{color:var(--t-text3)!important}.ant-switch-checked{background:var(--t-primary)!important}.config-wrap .ant-switch{margin-top:2px}.ant-card{background:var(--t-surface)!important;border-color:var(--t-border)!important;border-radius:6px!important;color:var(--t-text)!important;font-size:12px!important}.ant-modal-content{background:var(--t-surface)!important;border:1px solid var(--t-border)!important;border-radius:6px!important}.ant-modal-header{background:var(--t-surface)!important;border-bottom:1px solid var(--t-border)!important}.ant-modal-title{color:var(--t-text)!important;font-size:14px!important}.ant-modal-close-icon{color:var(--t-text3)!important}.ant-modal-body{color:var(--t-text)!important}.ant-checkbox-checked .ant-checkbox-inner{background:var(--t-primary)!important;border-color:var(--t-primary)!important}.ant-radio-checked .ant-radio-inner{border-color:var(--t-primary)!important}.ant-radio-inner:after{background:var(--t-primary)!important}.ant-message-notice-content{background:var(--t-surface)!important;border:1px solid var(--t-border)!important;border-radius:4px!important;box-shadow:0 4px 16px var(--t-shadow)!important;color:var(--t-text)!important}.ant-tooltip-inner{background:var(--t-surface)!important;border:1px solid var(--t-border)!important;border-radius:3px!important;font-size:11px!important;color:var(--t-text)!important}.ant-alert{border-radius:6px!important;font-size:12px!important;margin-bottom:12px!important;padding:10px 12px!important}.ant-alert-message{color:var(--t-text)!important;line-height:1.8!important}.ant-alert .ant-btn-primary{background:var(--t-warning)!important;border-color:var(--t-warning)!important}.ant-tabs{display:flex!important;flex-direction:column!important;width:80px!important;flex-shrink:0;border-right:1px solid var(--t-border)!important;background:var(--t-surface)!important;margin:0!important;height:auto!important}.ant-tabs-nav{margin:0!important;width:80px!important;border:none!important}.ant-tabs-nav::before{border:none!important}.ant-tabs-nav-wrap{width:80px!important}.ant-tabs-nav-list{flex-direction:column!important;width:80px!important;gap:0!important}.ant-tabs-tab{padding:10px 4px!important;margin:0!important;justify-content:center!important;width:80px!important;font-size:12px!important;border:none!important;background:transparent!important;border-radius:0!important}.ant-tabs-tab .ant-tabs-tab-btn{font-size:12px!important;text-align:center!important;padding:0!important;color:var(--t-text)!important}.ant-tabs-tab:hover{background:var(--t-primary-bg)!important}.ant-tabs-tab-active{background:var(--t-primary-bg)!important;position:relative}.ant-tabs-tab-active:after{content:"";position:absolute;left:0;top:0;bottom:0;width:2px;background:var(--t-primary)}.ant-tabs-tab-active .ant-tabs-tab-btn{color:var(--t-primary)!important;font-weight:600!important}.ant-tabs-ink-bar{display:none!important}.ant-tabs-content-holder{display:none!important}.ant-tabs-content{display:none!important}.ant-tabs-top>.ant-tabs-nav::before{border:none!important}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}@keyframes floatPulse{0%,100%{box-shadow:0 4px 16px var(--t-shadow),0 0 0 1px rgba(255,255,255,.1)}50%{box-shadow:0 4px 24px var(--t-shadow),0 0 0 3px var(--t-primary-border)}}@keyframes floatRing{0%{opacity:.6;transform:scale(1)}100%{opacity:0;transform:scale(1.3)}} ');

(function (vue, Antd, pinia, marked, rxjs, md5, DOMPurify) {
  'use strict';

  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  function bound01(n, max) {
    if (isOnePointZero(n)) {
      n = "100%";
    }
    var isPercent = isPercentage(n);
    n = max === 360 ? n : Math.min(max, Math.max(0, parseFloat(n)));
    if (isPercent) {
      n = parseInt(String(n * max), 10) / 100;
    }
    if (Math.abs(n - max) < 1e-6) {
      return 1;
    }
    if (max === 360) {
      n = (n < 0 ? n % max + max : n % max) / parseFloat(String(max));
    } else {
      n = n % max / parseFloat(String(max));
    }
    return n;
  }
  function isOnePointZero(n) {
    return typeof n === "string" && n.indexOf(".") !== -1 && parseFloat(n) === 1;
  }
  function isPercentage(n) {
    return typeof n === "string" && n.indexOf("%") !== -1;
  }
  function boundAlpha(a) {
    a = parseFloat(a);
    if (isNaN(a) || a < 0 || a > 1) {
      a = 1;
    }
    return a;
  }
  function convertToPercentage(n) {
    if (n <= 1) {
      return "".concat(Number(n) * 100, "%");
    }
    return n;
  }
  function pad2(c) {
    return c.length === 1 ? "0" + c : String(c);
  }
  function rgbToRgb(r, g, b) {
    return {
      r: bound01(r, 255) * 255,
      g: bound01(g, 255) * 255,
      b: bound01(b, 255) * 255
    };
  }
  function hue2rgb(p, q, t) {
    if (t < 0) {
      t += 1;
    }
    if (t > 1) {
      t -= 1;
    }
    if (t < 1 / 6) {
      return p + (q - p) * (6 * t);
    }
    if (t < 1 / 2) {
      return q;
    }
    if (t < 2 / 3) {
      return p + (q - p) * (2 / 3 - t) * 6;
    }
    return p;
  }
  function hslToRgb(h2, s, l) {
    var r;
    var g;
    var b;
    h2 = bound01(h2, 360);
    s = bound01(s, 100);
    l = bound01(l, 100);
    if (s === 0) {
      g = l;
      b = l;
      r = l;
    } else {
      var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      var p = 2 * l - q;
      r = hue2rgb(p, q, h2 + 1 / 3);
      g = hue2rgb(p, q, h2);
      b = hue2rgb(p, q, h2 - 1 / 3);
    }
    return { r: r * 255, g: g * 255, b: b * 255 };
  }
  function rgbToHsv(r, g, b) {
    r = bound01(r, 255);
    g = bound01(g, 255);
    b = bound01(b, 255);
    var max = Math.max(r, g, b);
    var min = Math.min(r, g, b);
    var h2 = 0;
    var v = max;
    var d = max - min;
    var s = max === 0 ? 0 : d / max;
    if (max === min) {
      h2 = 0;
    } else {
      switch (max) {
        case r:
          h2 = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h2 = (b - r) / d + 2;
          break;
        case b:
          h2 = (r - g) / d + 4;
          break;
      }
      h2 /= 6;
    }
    return { h: h2, s, v };
  }
  function hsvToRgb(h2, s, v) {
    h2 = bound01(h2, 360) * 6;
    s = bound01(s, 100);
    v = bound01(v, 100);
    var i = Math.floor(h2);
    var f = h2 - i;
    var p = v * (1 - s);
    var q = v * (1 - f * s);
    var t = v * (1 - (1 - f) * s);
    var mod = i % 6;
    var r = [v, q, p, p, t, v][mod];
    var g = [t, v, v, q, p, p][mod];
    var b = [p, p, t, v, v, q][mod];
    return { r: r * 255, g: g * 255, b: b * 255 };
  }
  function rgbToHex(r, g, b, allow3Char) {
    var hex = [
      pad2(Math.round(r).toString(16)),
      pad2(Math.round(g).toString(16)),
      pad2(Math.round(b).toString(16))
    ];
    return hex.join("");
  }
  function convertHexToDecimal(h2) {
    return parseIntFromHex(h2) / 255;
  }
  function parseIntFromHex(val) {
    return parseInt(val, 16);
  }
  var names = {
    aliceblue: "#f0f8ff",
    antiquewhite: "#faebd7",
    aqua: "#00ffff",
    aquamarine: "#7fffd4",
    azure: "#f0ffff",
    beige: "#f5f5dc",
    bisque: "#ffe4c4",
    black: "#000000",
    blanchedalmond: "#ffebcd",
    blue: "#0000ff",
    blueviolet: "#8a2be2",
    brown: "#a52a2a",
    burlywood: "#deb887",
    cadetblue: "#5f9ea0",
    chartreuse: "#7fff00",
    chocolate: "#d2691e",
    coral: "#ff7f50",
    cornflowerblue: "#6495ed",
    cornsilk: "#fff8dc",
    crimson: "#dc143c",
    cyan: "#00ffff",
    darkblue: "#00008b",
    darkcyan: "#008b8b",
    darkgoldenrod: "#b8860b",
    darkgray: "#a9a9a9",
    darkgreen: "#006400",
    darkgrey: "#a9a9a9",
    darkkhaki: "#bdb76b",
    darkmagenta: "#8b008b",
    darkolivegreen: "#556b2f",
    darkorange: "#ff8c00",
    darkorchid: "#9932cc",
    darkred: "#8b0000",
    darksalmon: "#e9967a",
    darkseagreen: "#8fbc8f",
    darkslateblue: "#483d8b",
    darkslategray: "#2f4f4f",
    darkslategrey: "#2f4f4f",
    darkturquoise: "#00ced1",
    darkviolet: "#9400d3",
    deeppink: "#ff1493",
    deepskyblue: "#00bfff",
    dimgray: "#696969",
    dimgrey: "#696969",
    dodgerblue: "#1e90ff",
    firebrick: "#b22222",
    floralwhite: "#fffaf0",
    forestgreen: "#228b22",
    fuchsia: "#ff00ff",
    gainsboro: "#dcdcdc",
    ghostwhite: "#f8f8ff",
    goldenrod: "#daa520",
    gold: "#ffd700",
    gray: "#808080",
    green: "#008000",
    greenyellow: "#adff2f",
    grey: "#808080",
    honeydew: "#f0fff0",
    hotpink: "#ff69b4",
    indianred: "#cd5c5c",
    indigo: "#4b0082",
    ivory: "#fffff0",
    khaki: "#f0e68c",
    lavenderblush: "#fff0f5",
    lavender: "#e6e6fa",
    lawngreen: "#7cfc00",
    lemonchiffon: "#fffacd",
    lightblue: "#add8e6",
    lightcoral: "#f08080",
    lightcyan: "#e0ffff",
    lightgoldenrodyellow: "#fafad2",
    lightgray: "#d3d3d3",
    lightgreen: "#90ee90",
    lightgrey: "#d3d3d3",
    lightpink: "#ffb6c1",
    lightsalmon: "#ffa07a",
    lightseagreen: "#20b2aa",
    lightskyblue: "#87cefa",
    lightslategray: "#778899",
    lightslategrey: "#778899",
    lightsteelblue: "#b0c4de",
    lightyellow: "#ffffe0",
    lime: "#00ff00",
    limegreen: "#32cd32",
    linen: "#faf0e6",
    magenta: "#ff00ff",
    maroon: "#800000",
    mediumaquamarine: "#66cdaa",
    mediumblue: "#0000cd",
    mediumorchid: "#ba55d3",
    mediumpurple: "#9370db",
    mediumseagreen: "#3cb371",
    mediumslateblue: "#7b68ee",
    mediumspringgreen: "#00fa9a",
    mediumturquoise: "#48d1cc",
    mediumvioletred: "#c71585",
    midnightblue: "#191970",
    mintcream: "#f5fffa",
    mistyrose: "#ffe4e1",
    moccasin: "#ffe4b5",
    navajowhite: "#ffdead",
    navy: "#000080",
    oldlace: "#fdf5e6",
    olive: "#808000",
    olivedrab: "#6b8e23",
    orange: "#ffa500",
    orangered: "#ff4500",
    orchid: "#da70d6",
    palegoldenrod: "#eee8aa",
    palegreen: "#98fb98",
    paleturquoise: "#afeeee",
    palevioletred: "#db7093",
    papayawhip: "#ffefd5",
    peachpuff: "#ffdab9",
    peru: "#cd853f",
    pink: "#ffc0cb",
    plum: "#dda0dd",
    powderblue: "#b0e0e6",
    purple: "#800080",
    rebeccapurple: "#663399",
    red: "#ff0000",
    rosybrown: "#bc8f8f",
    royalblue: "#4169e1",
    saddlebrown: "#8b4513",
    salmon: "#fa8072",
    sandybrown: "#f4a460",
    seagreen: "#2e8b57",
    seashell: "#fff5ee",
    sienna: "#a0522d",
    silver: "#c0c0c0",
    skyblue: "#87ceeb",
    slateblue: "#6a5acd",
    slategray: "#708090",
    slategrey: "#708090",
    snow: "#fffafa",
    springgreen: "#00ff7f",
    steelblue: "#4682b4",
    tan: "#d2b48c",
    teal: "#008080",
    thistle: "#d8bfd8",
    tomato: "#ff6347",
    turquoise: "#40e0d0",
    violet: "#ee82ee",
    wheat: "#f5deb3",
    white: "#ffffff",
    whitesmoke: "#f5f5f5",
    yellow: "#ffff00",
    yellowgreen: "#9acd32"
  };
  function inputToRGB(color) {
    var rgb = { r: 0, g: 0, b: 0 };
    var a = 1;
    var s = null;
    var v = null;
    var l = null;
    var ok = false;
    var format = false;
    if (typeof color === "string") {
      color = stringInputToObject(color);
    }
    if (typeof color === "object") {
      if (isValidCSSUnit(color.r) && isValidCSSUnit(color.g) && isValidCSSUnit(color.b)) {
        rgb = rgbToRgb(color.r, color.g, color.b);
        ok = true;
        format = String(color.r).substr(-1) === "%" ? "prgb" : "rgb";
      } else if (isValidCSSUnit(color.h) && isValidCSSUnit(color.s) && isValidCSSUnit(color.v)) {
        s = convertToPercentage(color.s);
        v = convertToPercentage(color.v);
        rgb = hsvToRgb(color.h, s, v);
        ok = true;
        format = "hsv";
      } else if (isValidCSSUnit(color.h) && isValidCSSUnit(color.s) && isValidCSSUnit(color.l)) {
        s = convertToPercentage(color.s);
        l = convertToPercentage(color.l);
        rgb = hslToRgb(color.h, s, l);
        ok = true;
        format = "hsl";
      }
      if (Object.prototype.hasOwnProperty.call(color, "a")) {
        a = color.a;
      }
    }
    a = boundAlpha(a);
    return {
      ok,
      format: color.format || format,
      r: Math.min(255, Math.max(rgb.r, 0)),
      g: Math.min(255, Math.max(rgb.g, 0)),
      b: Math.min(255, Math.max(rgb.b, 0)),
      a
    };
  }
  var CSS_INTEGER = "[-\\+]?\\d+%?";
  var CSS_NUMBER = "[-\\+]?\\d*\\.\\d+%?";
  var CSS_UNIT = "(?:".concat(CSS_NUMBER, ")|(?:").concat(CSS_INTEGER, ")");
  var PERMISSIVE_MATCH3 = "[\\s|\\(]+(".concat(CSS_UNIT, ")[,|\\s]+(").concat(CSS_UNIT, ")[,|\\s]+(").concat(CSS_UNIT, ")\\s*\\)?");
  var PERMISSIVE_MATCH4 = "[\\s|\\(]+(".concat(CSS_UNIT, ")[,|\\s]+(").concat(CSS_UNIT, ")[,|\\s]+(").concat(CSS_UNIT, ")[,|\\s]+(").concat(CSS_UNIT, ")\\s*\\)?");
  var matchers = {
    CSS_UNIT: new RegExp(CSS_UNIT),
    rgb: new RegExp("rgb" + PERMISSIVE_MATCH3),
    rgba: new RegExp("rgba" + PERMISSIVE_MATCH4),
    hsl: new RegExp("hsl" + PERMISSIVE_MATCH3),
    hsla: new RegExp("hsla" + PERMISSIVE_MATCH4),
    hsv: new RegExp("hsv" + PERMISSIVE_MATCH3),
    hsva: new RegExp("hsva" + PERMISSIVE_MATCH4),
    hex3: /^#?([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
    hex6: /^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/,
    hex4: /^#?([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
    hex8: /^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/
  };
  function stringInputToObject(color) {
    color = color.trim().toLowerCase();
    if (color.length === 0) {
      return false;
    }
    var named = false;
    if (names[color]) {
      color = names[color];
      named = true;
    } else if (color === "transparent") {
      return { r: 0, g: 0, b: 0, a: 0, format: "name" };
    }
    var match = matchers.rgb.exec(color);
    if (match) {
      return { r: match[1], g: match[2], b: match[3] };
    }
    match = matchers.rgba.exec(color);
    if (match) {
      return { r: match[1], g: match[2], b: match[3], a: match[4] };
    }
    match = matchers.hsl.exec(color);
    if (match) {
      return { h: match[1], s: match[2], l: match[3] };
    }
    match = matchers.hsla.exec(color);
    if (match) {
      return { h: match[1], s: match[2], l: match[3], a: match[4] };
    }
    match = matchers.hsv.exec(color);
    if (match) {
      return { h: match[1], s: match[2], v: match[3] };
    }
    match = matchers.hsva.exec(color);
    if (match) {
      return { h: match[1], s: match[2], v: match[3], a: match[4] };
    }
    match = matchers.hex8.exec(color);
    if (match) {
      return {
        r: parseIntFromHex(match[1]),
        g: parseIntFromHex(match[2]),
        b: parseIntFromHex(match[3]),
        a: convertHexToDecimal(match[4]),
        format: named ? "name" : "hex8"
      };
    }
    match = matchers.hex6.exec(color);
    if (match) {
      return {
        r: parseIntFromHex(match[1]),
        g: parseIntFromHex(match[2]),
        b: parseIntFromHex(match[3]),
        format: named ? "name" : "hex"
      };
    }
    match = matchers.hex4.exec(color);
    if (match) {
      return {
        r: parseIntFromHex(match[1] + match[1]),
        g: parseIntFromHex(match[2] + match[2]),
        b: parseIntFromHex(match[3] + match[3]),
        a: convertHexToDecimal(match[4] + match[4]),
        format: named ? "name" : "hex8"
      };
    }
    match = matchers.hex3.exec(color);
    if (match) {
      return {
        r: parseIntFromHex(match[1] + match[1]),
        g: parseIntFromHex(match[2] + match[2]),
        b: parseIntFromHex(match[3] + match[3]),
        format: named ? "name" : "hex"
      };
    }
    return false;
  }
  function isValidCSSUnit(color) {
    return Boolean(matchers.CSS_UNIT.exec(String(color)));
  }
  var hueStep = 2;
  var saturationStep = 0.16;
  var saturationStep2 = 0.05;
  var brightnessStep1 = 0.05;
  var brightnessStep2 = 0.15;
  var lightColorCount = 5;
  var darkColorCount = 4;
  var darkColorMap = [{
    index: 7,
    opacity: 0.15
  }, {
    index: 6,
    opacity: 0.25
  }, {
    index: 5,
    opacity: 0.3
  }, {
    index: 5,
    opacity: 0.45
  }, {
    index: 5,
    opacity: 0.65
  }, {
    index: 5,
    opacity: 0.85
  }, {
    index: 4,
    opacity: 0.9
  }, {
    index: 3,
    opacity: 0.95
  }, {
    index: 2,
    opacity: 0.97
  }, {
    index: 1,
    opacity: 0.98
  }];
  function toHsv(_ref) {
    var r = _ref.r, g = _ref.g, b = _ref.b;
    var hsv = rgbToHsv(r, g, b);
    return {
      h: hsv.h * 360,
      s: hsv.s,
      v: hsv.v
    };
  }
  function toHex(_ref2) {
    var r = _ref2.r, g = _ref2.g, b = _ref2.b;
    return "#".concat(rgbToHex(r, g, b));
  }
  function mix(rgb1, rgb2, amount) {
    var p = amount / 100;
    var rgb = {
      r: (rgb2.r - rgb1.r) * p + rgb1.r,
      g: (rgb2.g - rgb1.g) * p + rgb1.g,
      b: (rgb2.b - rgb1.b) * p + rgb1.b
    };
    return rgb;
  }
  function getHue(hsv, i, light) {
    var hue;
    if (Math.round(hsv.h) >= 60 && Math.round(hsv.h) <= 240) {
      hue = light ? Math.round(hsv.h) - hueStep * i : Math.round(hsv.h) + hueStep * i;
    } else {
      hue = light ? Math.round(hsv.h) + hueStep * i : Math.round(hsv.h) - hueStep * i;
    }
    if (hue < 0) {
      hue += 360;
    } else if (hue >= 360) {
      hue -= 360;
    }
    return hue;
  }
  function getSaturation(hsv, i, light) {
    if (hsv.h === 0 && hsv.s === 0) {
      return hsv.s;
    }
    var saturation;
    if (light) {
      saturation = hsv.s - saturationStep * i;
    } else if (i === darkColorCount) {
      saturation = hsv.s + saturationStep;
    } else {
      saturation = hsv.s + saturationStep2 * i;
    }
    if (saturation > 1) {
      saturation = 1;
    }
    if (light && i === lightColorCount && saturation > 0.1) {
      saturation = 0.1;
    }
    if (saturation < 0.06) {
      saturation = 0.06;
    }
    return Number(saturation.toFixed(2));
  }
  function getValue(hsv, i, light) {
    var value;
    if (light) {
      value = hsv.v + brightnessStep1 * i;
    } else {
      value = hsv.v - brightnessStep2 * i;
    }
    if (value > 1) {
      value = 1;
    }
    return Number(value.toFixed(2));
  }
  function generate$1(color) {
    var opts = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    var patterns = [];
    var pColor = inputToRGB(color);
    for (var i = lightColorCount; i > 0; i -= 1) {
      var hsv = toHsv(pColor);
      var colorString = toHex(inputToRGB({
        h: getHue(hsv, i, true),
        s: getSaturation(hsv, i, true),
        v: getValue(hsv, i, true)
      }));
      patterns.push(colorString);
    }
    patterns.push(toHex(pColor));
    for (var _i = 1; _i <= darkColorCount; _i += 1) {
      var _hsv = toHsv(pColor);
      var _colorString = toHex(inputToRGB({
        h: getHue(_hsv, _i),
        s: getSaturation(_hsv, _i),
        v: getValue(_hsv, _i)
      }));
      patterns.push(_colorString);
    }
    if (opts.theme === "dark") {
      return darkColorMap.map(function(_ref3) {
        var index = _ref3.index, opacity = _ref3.opacity;
        var darkColorString = toHex(mix(inputToRGB(opts.backgroundColor || "#141414"), inputToRGB(patterns[index]), opacity * 100));
        return darkColorString;
      });
    }
    return patterns;
  }
  var presetPrimaryColors = {
    red: "#F5222D",
    volcano: "#FA541C",
    orange: "#FA8C16",
    gold: "#FAAD14",
    yellow: "#FADB14",
    lime: "#A0D911",
    green: "#52C41A",
    cyan: "#13C2C2",
    blue: "#1890FF",
    geekblue: "#2F54EB",
    purple: "#722ED1",
    magenta: "#EB2F96",
    grey: "#666666"
  };
  var presetPalettes = {};
  var presetDarkPalettes = {};
  Object.keys(presetPrimaryColors).forEach(function(key) {
    presetPalettes[key] = generate$1(presetPrimaryColors[key]);
    presetPalettes[key].primary = presetPalettes[key][5];
    presetDarkPalettes[key] = generate$1(presetPrimaryColors[key], {
      theme: "dark",
      backgroundColor: "#141414"
    });
    presetDarkPalettes[key].primary = presetDarkPalettes[key][5];
  });
  var blue = presetPalettes.blue;
  var contextKey = Symbol("iconContext");
  var useInjectIconContext = function useInjectIconContext2() {
    return vue.inject(contextKey, {
      prefixCls: vue.ref("anticon"),
      rootClassName: vue.ref(""),
      csp: vue.ref()
    });
  };
  function canUseDom() {
    return !!(typeof window !== "undefined" && window.document && window.document.createElement);
  }
  function contains(root, n) {
    if (!root) {
      return false;
    }
    if (root.contains) {
      return root.contains(n);
    }
    return false;
  }
  var APPEND_ORDER = "data-vc-order";
  var MARK_KEY = "vc-icon-key";
  var containerCache = /* @__PURE__ */ new Map();
  function getMark() {
    var _ref = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {}, mark = _ref.mark;
    if (mark) {
      return mark.startsWith("data-") ? mark : "data-".concat(mark);
    }
    return MARK_KEY;
  }
  function getContainer(option) {
    if (option.attachTo) {
      return option.attachTo;
    }
    var head = document.querySelector("head");
    return head || document.body;
  }
  function getOrder(prepend) {
    if (prepend === "queue") {
      return "prependQueue";
    }
    return prepend ? "prepend" : "append";
  }
  function findStyles(container) {
    return Array.from((containerCache.get(container) || container).children).filter(function(node) {
      return node.tagName === "STYLE";
    });
  }
  function injectCSS(css) {
    var option = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    if (!canUseDom()) {
      return null;
    }
    var csp = option.csp, prepend = option.prepend;
    var styleNode = document.createElement("style");
    styleNode.setAttribute(APPEND_ORDER, getOrder(prepend));
    if (csp && csp.nonce) {
      styleNode.nonce = csp.nonce;
    }
    styleNode.innerHTML = css;
    var container = getContainer(option);
    var firstChild = container.firstChild;
    if (prepend) {
      if (prepend === "queue") {
        var existStyle = findStyles(container).filter(function(node) {
          return ["prepend", "prependQueue"].includes(node.getAttribute(APPEND_ORDER));
        });
        if (existStyle.length) {
          container.insertBefore(styleNode, existStyle[existStyle.length - 1].nextSibling);
          return styleNode;
        }
      }
      container.insertBefore(styleNode, firstChild);
    } else {
      container.appendChild(styleNode);
    }
    return styleNode;
  }
  function findExistNode(key) {
    var option = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    var container = getContainer(option);
    return findStyles(container).find(function(node) {
      return node.getAttribute(getMark(option)) === key;
    });
  }
  function syncRealContainer(container, option) {
    var cachedRealContainer = containerCache.get(container);
    if (!cachedRealContainer || !contains(document, cachedRealContainer)) {
      var placeholderStyle = injectCSS("", option);
      var parentNode = placeholderStyle.parentNode;
      containerCache.set(container, parentNode);
      container.removeChild(placeholderStyle);
    }
  }
  function updateCSS(css, key) {
    var option = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
    var container = getContainer(option);
    syncRealContainer(container, option);
    var existNode = findExistNode(key, option);
    if (existNode) {
      if (option.csp && option.csp.nonce && existNode.nonce !== option.csp.nonce) {
        existNode.nonce = option.csp.nonce;
      }
      if (existNode.innerHTML !== css) {
        existNode.innerHTML = css;
      }
      return existNode;
    }
    var newNode = injectCSS(css, option);
    newNode.setAttribute(getMark(option), key);
    return newNode;
  }
  function _objectSpread$8(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i] != null ? Object(arguments[i]) : {};
      var ownKeys = Object.keys(source);
      if (typeof Object.getOwnPropertySymbols === "function") {
        ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
          return Object.getOwnPropertyDescriptor(source, sym).enumerable;
        }));
      }
      ownKeys.forEach(function(key) {
        _defineProperty$8(target, key, source[key]);
      });
    }
    return target;
  }
  function _defineProperty$8(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
    } else {
      obj[key] = value;
    }
    return obj;
  }
  function warning(valid, message2) {
  }
  function isIconDefinition(target) {
    return typeof target === "object" && typeof target.name === "string" && typeof target.theme === "string" && (typeof target.icon === "object" || typeof target.icon === "function");
  }
  function generate(node, key, rootProps) {
    if (!rootProps) {
      return vue.h(node.tag, _objectSpread$8({
        key
      }, node.attrs), (node.children || []).map(function(child, index) {
        return generate(child, "".concat(key, "-").concat(node.tag, "-").concat(index));
      }));
    }
    return vue.h(node.tag, _objectSpread$8({
      key
    }, rootProps, node.attrs), (node.children || []).map(function(child, index) {
      return generate(child, "".concat(key, "-").concat(node.tag, "-").concat(index));
    }));
  }
  function getSecondaryColor(primaryColor) {
    return generate$1(primaryColor)[0];
  }
  function normalizeTwoToneColors(twoToneColor) {
    if (!twoToneColor) {
      return [];
    }
    return Array.isArray(twoToneColor) ? twoToneColor : [twoToneColor];
  }
  var iconStyles = "\n.anticon {\n  display: inline-block;\n  color: inherit;\n  font-style: normal;\n  line-height: 0;\n  text-align: center;\n  text-transform: none;\n  vertical-align: -0.125em;\n  text-rendering: optimizeLegibility;\n  -webkit-font-smoothing: antialiased;\n  -moz-osx-font-smoothing: grayscale;\n}\n\n.anticon > * {\n  line-height: 1;\n}\n\n.anticon svg {\n  display: inline-block;\n}\n\n.anticon::before {\n  display: none;\n}\n\n.anticon .anticon-icon {\n  display: block;\n}\n\n.anticon[tabindex] {\n  cursor: pointer;\n}\n\n.anticon-spin::before,\n.anticon-spin {\n  display: inline-block;\n  -webkit-animation: loadingCircle 1s infinite linear;\n  animation: loadingCircle 1s infinite linear;\n}\n\n@-webkit-keyframes loadingCircle {\n  100% {\n    -webkit-transform: rotate(360deg);\n    transform: rotate(360deg);\n  }\n}\n\n@keyframes loadingCircle {\n  100% {\n    -webkit-transform: rotate(360deg);\n    transform: rotate(360deg);\n  }\n}\n";
  function getRoot(ele) {
    return ele && ele.getRootNode && ele.getRootNode();
  }
  function inShadow(ele) {
    if (!canUseDom()) {
      return false;
    }
    return getRoot(ele) instanceof ShadowRoot;
  }
  function getShadowRoot(ele) {
    return inShadow(ele) ? getRoot(ele) : null;
  }
  var useInsertStyles = function useInsertStyles2() {
    var _useInjectIconContext = useInjectIconContext(), prefixCls = _useInjectIconContext.prefixCls, csp = _useInjectIconContext.csp;
    var instance = vue.getCurrentInstance();
    var mergedStyleStr = iconStyles;
    if (prefixCls) {
      mergedStyleStr = mergedStyleStr.replace(/anticon/g, prefixCls.value);
    }
    vue.nextTick(function() {
      if (!canUseDom()) {
        return;
      }
      var ele = instance.vnode.el;
      var shadowRoot = getShadowRoot(ele);
      updateCSS(mergedStyleStr, "@ant-design-vue-icons", {
        prepend: true,
        csp: csp.value,
        attachTo: shadowRoot
      });
    });
  };
  var _excluded$1 = ["icon", "primaryColor", "secondaryColor"];
  function _objectWithoutProperties$1(source, excluded) {
    if (source == null) return {};
    var target = _objectWithoutPropertiesLoose$1(source, excluded);
    var key, i;
    if (Object.getOwnPropertySymbols) {
      var sourceSymbolKeys = Object.getOwnPropertySymbols(source);
      for (i = 0; i < sourceSymbolKeys.length; i++) {
        key = sourceSymbolKeys[i];
        if (excluded.indexOf(key) >= 0) continue;
        if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;
        target[key] = source[key];
      }
    }
    return target;
  }
  function _objectWithoutPropertiesLoose$1(source, excluded) {
    if (source == null) return {};
    var target = {};
    var sourceKeys = Object.keys(source);
    var key, i;
    for (i = 0; i < sourceKeys.length; i++) {
      key = sourceKeys[i];
      if (excluded.indexOf(key) >= 0) continue;
      target[key] = source[key];
    }
    return target;
  }
  function _objectSpread$7(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i] != null ? Object(arguments[i]) : {};
      var ownKeys = Object.keys(source);
      if (typeof Object.getOwnPropertySymbols === "function") {
        ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
          return Object.getOwnPropertyDescriptor(source, sym).enumerable;
        }));
      }
      ownKeys.forEach(function(key) {
        _defineProperty$7(target, key, source[key]);
      });
    }
    return target;
  }
  function _defineProperty$7(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
    } else {
      obj[key] = value;
    }
    return obj;
  }
  var twoToneColorPalette = vue.reactive({
    primaryColor: "#333",
    secondaryColor: "#E6E6E6",
    calculated: false
  });
  function setTwoToneColors(_ref) {
    var primaryColor = _ref.primaryColor, secondaryColor = _ref.secondaryColor;
    twoToneColorPalette.primaryColor = primaryColor;
    twoToneColorPalette.secondaryColor = secondaryColor || getSecondaryColor(primaryColor);
    twoToneColorPalette.calculated = !!secondaryColor;
  }
  function getTwoToneColors() {
    return _objectSpread$7({}, twoToneColorPalette);
  }
  var IconBase = function IconBase2(props, context) {
    var _props$context$attrs = _objectSpread$7({}, props, context.attrs), icon = _props$context$attrs.icon, primaryColor = _props$context$attrs.primaryColor, secondaryColor = _props$context$attrs.secondaryColor, restProps = _objectWithoutProperties$1(_props$context$attrs, _excluded$1);
    var colors = twoToneColorPalette;
    if (primaryColor) {
      colors = {
        primaryColor,
        secondaryColor: secondaryColor || getSecondaryColor(primaryColor)
      };
    }
    warning(isIconDefinition(icon));
    if (!isIconDefinition(icon)) {
      return null;
    }
    var target = icon;
    if (target && typeof target.icon === "function") {
      target = _objectSpread$7({}, target, {
        icon: target.icon(colors.primaryColor, colors.secondaryColor)
      });
    }
    return generate(target.icon, "svg-".concat(target.name), _objectSpread$7({}, restProps, {
      "data-icon": target.name,
      width: "1em",
      height: "1em",
      fill: "currentColor",
      "aria-hidden": "true"
    }));
  };
  IconBase.props = {
    icon: Object,
    primaryColor: String,
    secondaryColor: String,
    focusable: String
  };
  IconBase.inheritAttrs = false;
  IconBase.displayName = "IconBase";
  IconBase.getTwoToneColors = getTwoToneColors;
  IconBase.setTwoToneColors = setTwoToneColors;
  function _slicedToArray$1(arr, i) {
    return _arrayWithHoles$1(arr) || _iterableToArrayLimit$1(arr, i) || _unsupportedIterableToArray$1(arr, i) || _nonIterableRest$1();
  }
  function _nonIterableRest$1() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  function _unsupportedIterableToArray$1(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _arrayLikeToArray$1(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(o);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray$1(o, minLen);
  }
  function _arrayLikeToArray$1(arr, len) {
    if (len == null || len > arr.length) len = arr.length;
    for (var i = 0, arr2 = new Array(len); i < len; i++) {
      arr2[i] = arr[i];
    }
    return arr2;
  }
  function _iterableToArrayLimit$1(arr, i) {
    var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"];
    if (_i == null) return;
    var _arr = [];
    var _n = true;
    var _d = false;
    var _s, _e;
    try {
      for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);
        if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;
      _e = err;
    } finally {
      try {
        if (!_n && _i["return"] != null) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }
    return _arr;
  }
  function _arrayWithHoles$1(arr) {
    if (Array.isArray(arr)) return arr;
  }
  function setTwoToneColor(twoToneColor) {
    var _normalizeTwoToneColo = normalizeTwoToneColors(twoToneColor), _normalizeTwoToneColo2 = _slicedToArray$1(_normalizeTwoToneColo, 2), primaryColor = _normalizeTwoToneColo2[0], secondaryColor = _normalizeTwoToneColo2[1];
    return IconBase.setTwoToneColors({
      primaryColor,
      secondaryColor
    });
  }
  function getTwoToneColor() {
    var colors = IconBase.getTwoToneColors();
    if (!colors.calculated) {
      return colors.primaryColor;
    }
    return [colors.primaryColor, colors.secondaryColor];
  }
  var InsertStyles = vue.defineComponent({
    name: "InsertStyles",
    setup: function setup() {
      useInsertStyles();
      return function() {
        return null;
      };
    }
  });
  var _excluded = ["class", "icon", "spin", "rotate", "tabindex", "twoToneColor", "onClick"];
  function _slicedToArray(arr, i) {
    return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest();
  }
  function _nonIterableRest() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  function _unsupportedIterableToArray(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _arrayLikeToArray(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(o);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
  }
  function _arrayLikeToArray(arr, len) {
    if (len == null || len > arr.length) len = arr.length;
    for (var i = 0, arr2 = new Array(len); i < len; i++) {
      arr2[i] = arr[i];
    }
    return arr2;
  }
  function _iterableToArrayLimit(arr, i) {
    var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"];
    if (_i == null) return;
    var _arr = [];
    var _n = true;
    var _d = false;
    var _s, _e;
    try {
      for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);
        if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;
      _e = err;
    } finally {
      try {
        if (!_n && _i["return"] != null) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }
    return _arr;
  }
  function _arrayWithHoles(arr) {
    if (Array.isArray(arr)) return arr;
  }
  function _objectSpread$6(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i] != null ? Object(arguments[i]) : {};
      var ownKeys = Object.keys(source);
      if (typeof Object.getOwnPropertySymbols === "function") {
        ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
          return Object.getOwnPropertyDescriptor(source, sym).enumerable;
        }));
      }
      ownKeys.forEach(function(key) {
        _defineProperty$6(target, key, source[key]);
      });
    }
    return target;
  }
  function _defineProperty$6(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
    } else {
      obj[key] = value;
    }
    return obj;
  }
  function _objectWithoutProperties(source, excluded) {
    if (source == null) return {};
    var target = _objectWithoutPropertiesLoose(source, excluded);
    var key, i;
    if (Object.getOwnPropertySymbols) {
      var sourceSymbolKeys = Object.getOwnPropertySymbols(source);
      for (i = 0; i < sourceSymbolKeys.length; i++) {
        key = sourceSymbolKeys[i];
        if (excluded.indexOf(key) >= 0) continue;
        if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;
        target[key] = source[key];
      }
    }
    return target;
  }
  function _objectWithoutPropertiesLoose(source, excluded) {
    if (source == null) return {};
    var target = {};
    var sourceKeys = Object.keys(source);
    var key, i;
    for (i = 0; i < sourceKeys.length; i++) {
      key = sourceKeys[i];
      if (excluded.indexOf(key) >= 0) continue;
      target[key] = source[key];
    }
    return target;
  }
  setTwoToneColor(blue.primary);
  var Icon = function Icon2(props, context) {
    var _classObj;
    var _props$context$attrs = _objectSpread$6({}, props, context.attrs), cls = _props$context$attrs["class"], icon = _props$context$attrs.icon, spin = _props$context$attrs.spin, rotate = _props$context$attrs.rotate, tabindex = _props$context$attrs.tabindex, twoToneColor = _props$context$attrs.twoToneColor, onClick = _props$context$attrs.onClick, restProps = _objectWithoutProperties(_props$context$attrs, _excluded);
    var _useInjectIconContext = useInjectIconContext(), prefixCls = _useInjectIconContext.prefixCls, rootClassName = _useInjectIconContext.rootClassName;
    var classObj = (_classObj = {}, _defineProperty$6(_classObj, rootClassName.value, !!rootClassName.value), _defineProperty$6(_classObj, prefixCls.value, true), _defineProperty$6(_classObj, "".concat(prefixCls.value, "-").concat(icon.name), Boolean(icon.name)), _defineProperty$6(_classObj, "".concat(prefixCls.value, "-spin"), !!spin || icon.name === "loading"), _classObj);
    var iconTabIndex = tabindex;
    if (iconTabIndex === void 0 && onClick) {
      iconTabIndex = -1;
    }
    var svgStyle = rotate ? {
      msTransform: "rotate(".concat(rotate, "deg)"),
      transform: "rotate(".concat(rotate, "deg)")
    } : void 0;
    var _normalizeTwoToneColo = normalizeTwoToneColors(twoToneColor), _normalizeTwoToneColo2 = _slicedToArray(_normalizeTwoToneColo, 2), primaryColor = _normalizeTwoToneColo2[0], secondaryColor = _normalizeTwoToneColo2[1];
    return vue.createVNode("span", _objectSpread$6({
      "role": "img",
      "aria-label": icon.name
    }, restProps, {
      "onClick": onClick,
      "class": [classObj, cls],
      "tabindex": iconTabIndex
    }), [vue.createVNode(IconBase, {
      "icon": icon,
      "primaryColor": primaryColor,
      "secondaryColor": secondaryColor,
      "style": svgStyle
    }, null), vue.createVNode(InsertStyles, null, null)]);
  };
  Icon.props = {
    spin: Boolean,
    rotate: Number,
    icon: Object,
    twoToneColor: [String, Array]
  };
  Icon.displayName = "AntdIcon";
  Icon.inheritAttrs = false;
  Icon.getTwoToneColor = getTwoToneColor;
  Icon.setTwoToneColor = setTwoToneColor;
  var BulbOutlined$1 = { "icon": { "tag": "svg", "attrs": { "viewBox": "64 64 896 896", "focusable": "false" }, "children": [{ "tag": "path", "attrs": { "d": "M632 888H392c-4.4 0-8 3.6-8 8v32c0 17.7 14.3 32 32 32h192c17.7 0 32-14.3 32-32v-32c0-4.4-3.6-8-8-8zM512 64c-181.1 0-328 146.9-328 328 0 121.4 66 227.4 164 284.1V792c0 17.7 14.3 32 32 32h264c17.7 0 32-14.3 32-32V676.1c98-56.7 164-162.7 164-284.1 0-181.1-146.9-328-328-328zm127.9 549.8L604 634.6V752H420V634.6l-35.9-20.8C305.4 568.3 256 484.5 256 392c0-141.4 114.6-256 256-256s256 114.6 256 256c0 92.5-49.4 176.3-128.1 221.8z" } }] }, "name": "bulb", "theme": "outlined" };
  function _objectSpread$5(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i] != null ? Object(arguments[i]) : {};
      var ownKeys = Object.keys(source);
      if (typeof Object.getOwnPropertySymbols === "function") {
        ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
          return Object.getOwnPropertyDescriptor(source, sym).enumerable;
        }));
      }
      ownKeys.forEach(function(key) {
        _defineProperty$5(target, key, source[key]);
      });
    }
    return target;
  }
  function _defineProperty$5(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
    } else {
      obj[key] = value;
    }
    return obj;
  }
  var BulbOutlined = function BulbOutlined2(props, context) {
    var p = _objectSpread$5({}, props, context.attrs);
    return vue.createVNode(Icon, _objectSpread$5({}, p, {
      "icon": BulbOutlined$1
    }), null);
  };
  BulbOutlined.displayName = "BulbOutlined";
  BulbOutlined.inheritAttrs = false;
  var ExpandOutlined$1 = { "icon": { "tag": "svg", "attrs": { "viewBox": "64 64 896 896", "focusable": "false" }, "children": [{ "tag": "defs", "attrs": {}, "children": [{ "tag": "style", "attrs": {} }] }, { "tag": "path", "attrs": { "d": "M342 88H120c-17.7 0-32 14.3-32 32v224c0 8.8 7.2 16 16 16h48c8.8 0 16-7.2 16-16V168h174c8.8 0 16-7.2 16-16v-48c0-8.8-7.2-16-16-16zm578 576h-48c-8.8 0-16 7.2-16 16v176H682c-8.8 0-16 7.2-16 16v48c0 8.8 7.2 16 16 16h222c17.7 0 32-14.3 32-32V680c0-8.8-7.2-16-16-16zM342 856H168V680c0-8.8-7.2-16-16-16h-48c-8.8 0-16 7.2-16 16v224c0 17.7 14.3 32 32 32h222c8.8 0 16-7.2 16-16v-48c0-8.8-7.2-16-16-16zM904 88H682c-8.8 0-16 7.2-16 16v48c0 8.8 7.2 16 16 16h174v176c0 8.8 7.2 16 16 16h48c8.8 0 16-7.2 16-16V120c0-17.7-14.3-32-32-32z" } }] }, "name": "expand", "theme": "outlined" };
  function _objectSpread$4(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i] != null ? Object(arguments[i]) : {};
      var ownKeys = Object.keys(source);
      if (typeof Object.getOwnPropertySymbols === "function") {
        ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
          return Object.getOwnPropertyDescriptor(source, sym).enumerable;
        }));
      }
      ownKeys.forEach(function(key) {
        _defineProperty$4(target, key, source[key]);
      });
    }
    return target;
  }
  function _defineProperty$4(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
    } else {
      obj[key] = value;
    }
    return obj;
  }
  var ExpandOutlined = function ExpandOutlined2(props, context) {
    var p = _objectSpread$4({}, props, context.attrs);
    return vue.createVNode(Icon, _objectSpread$4({}, p, {
      "icon": ExpandOutlined$1
    }), null);
  };
  ExpandOutlined.displayName = "ExpandOutlined";
  ExpandOutlined.inheritAttrs = false;
  var LoadingOutlined$1 = { "icon": { "tag": "svg", "attrs": { "viewBox": "0 0 1024 1024", "focusable": "false" }, "children": [{ "tag": "path", "attrs": { "d": "M988 548c-19.9 0-36-16.1-36-36 0-59.4-11.6-117-34.6-171.3a440.45 440.45 0 00-94.3-139.9 437.71 437.71 0 00-139.9-94.3C629 83.6 571.4 72 512 72c-19.9 0-36-16.1-36-36s16.1-36 36-36c69.1 0 136.2 13.5 199.3 40.3C772.3 66 827 103 874 150c47 47 83.9 101.8 109.7 162.7 26.7 63.1 40.2 130.2 40.2 199.3.1 19.9-16 36-35.9 36z" } }] }, "name": "loading", "theme": "outlined" };
  function _objectSpread$3(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i] != null ? Object(arguments[i]) : {};
      var ownKeys = Object.keys(source);
      if (typeof Object.getOwnPropertySymbols === "function") {
        ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
          return Object.getOwnPropertyDescriptor(source, sym).enumerable;
        }));
      }
      ownKeys.forEach(function(key) {
        _defineProperty$3(target, key, source[key]);
      });
    }
    return target;
  }
  function _defineProperty$3(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
    } else {
      obj[key] = value;
    }
    return obj;
  }
  var LoadingOutlined = function LoadingOutlined2(props, context) {
    var p = _objectSpread$3({}, props, context.attrs);
    return vue.createVNode(Icon, _objectSpread$3({}, p, {
      "icon": LoadingOutlined$1
    }), null);
  };
  LoadingOutlined.displayName = "LoadingOutlined";
  LoadingOutlined.inheritAttrs = false;
  var SendOutlined$1 = { "icon": { "tag": "svg", "attrs": { "viewBox": "64 64 896 896", "focusable": "false" }, "children": [{ "tag": "defs", "attrs": {}, "children": [{ "tag": "style", "attrs": {} }] }, { "tag": "path", "attrs": { "d": "M931.4 498.9L94.9 79.5c-3.4-1.7-7.3-2.1-11-1.2a15.99 15.99 0 00-11.7 19.3l86.2 352.2c1.3 5.3 5.2 9.6 10.4 11.3l147.7 50.7-147.6 50.7c-5.2 1.8-9.1 6-10.3 11.3L72.2 926.5c-.9 3.7-.5 7.6 1.2 10.9 3.9 7.9 13.5 11.1 21.5 7.2l836.5-417c3.1-1.5 5.6-4.1 7.2-7.1 3.9-8 .7-17.6-7.2-21.6zM170.8 826.3l50.3-205.6 295.2-101.3c2.3-.8 4.2-2.6 5-5 1.4-4.2-.8-8.7-5-10.2L221.1 403 171 198.2l628 314.9-628.2 313.2z" } }] }, "name": "send", "theme": "outlined" };
  function _objectSpread$2(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i] != null ? Object(arguments[i]) : {};
      var ownKeys = Object.keys(source);
      if (typeof Object.getOwnPropertySymbols === "function") {
        ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
          return Object.getOwnPropertyDescriptor(source, sym).enumerable;
        }));
      }
      ownKeys.forEach(function(key) {
        _defineProperty$2(target, key, source[key]);
      });
    }
    return target;
  }
  function _defineProperty$2(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
    } else {
      obj[key] = value;
    }
    return obj;
  }
  var SendOutlined = function SendOutlined2(props, context) {
    var p = _objectSpread$2({}, props, context.attrs);
    return vue.createVNode(Icon, _objectSpread$2({}, p, {
      "icon": SendOutlined$1
    }), null);
  };
  SendOutlined.displayName = "SendOutlined";
  SendOutlined.inheritAttrs = false;
  var SettingOutlined$1 = { "icon": { "tag": "svg", "attrs": { "viewBox": "64 64 896 896", "focusable": "false" }, "children": [{ "tag": "path", "attrs": { "d": "M924.8 625.7l-65.5-56c3.1-19 4.7-38.4 4.7-57.8s-1.6-38.8-4.7-57.8l65.5-56a32.03 32.03 0 009.3-35.2l-.9-2.6a443.74 443.74 0 00-79.7-137.9l-1.8-2.1a32.12 32.12 0 00-35.1-9.5l-81.3 28.9c-30-24.6-63.5-44-99.7-57.6l-15.7-85a32.05 32.05 0 00-25.8-25.7l-2.7-.5c-52.1-9.4-106.9-9.4-159 0l-2.7.5a32.05 32.05 0 00-25.8 25.7l-15.8 85.4a351.86 351.86 0 00-99 57.4l-81.9-29.1a32 32 0 00-35.1 9.5l-1.8 2.1a446.02 446.02 0 00-79.7 137.9l-.9 2.6c-4.5 12.5-.8 26.5 9.3 35.2l66.3 56.6c-3.1 18.8-4.6 38-4.6 57.1 0 19.2 1.5 38.4 4.6 57.1L99 625.5a32.03 32.03 0 00-9.3 35.2l.9 2.6c18.1 50.4 44.9 96.9 79.7 137.9l1.8 2.1a32.12 32.12 0 0035.1 9.5l81.9-29.1c29.8 24.5 63.1 43.9 99 57.4l15.8 85.4a32.05 32.05 0 0025.8 25.7l2.7.5a449.4 449.4 0 00159 0l2.7-.5a32.05 32.05 0 0025.8-25.7l15.7-85a350 350 0 0099.7-57.6l81.3 28.9a32 32 0 0035.1-9.5l1.8-2.1c34.8-41.1 61.6-87.5 79.7-137.9l.9-2.6c4.5-12.3.8-26.3-9.3-35zM788.3 465.9c2.5 15.1 3.8 30.6 3.8 46.1s-1.3 31-3.8 46.1l-6.6 40.1 74.7 63.9a370.03 370.03 0 01-42.6 73.6L721 702.8l-31.4 25.8c-23.9 19.6-50.5 35-79.3 45.8l-38.1 14.3-17.9 97a377.5 377.5 0 01-85 0l-17.9-97.2-37.8-14.5c-28.5-10.8-55-26.2-78.7-45.7l-31.4-25.9-93.4 33.2c-17-22.9-31.2-47.6-42.6-73.6l75.5-64.5-6.5-40c-2.4-14.9-3.7-30.3-3.7-45.5 0-15.3 1.2-30.6 3.7-45.5l6.5-40-75.5-64.5c11.3-26.1 25.6-50.7 42.6-73.6l93.4 33.2 31.4-25.9c23.7-19.5 50.2-34.9 78.7-45.7l37.9-14.3 17.9-97.2c28.1-3.2 56.8-3.2 85 0l17.9 97 38.1 14.3c28.7 10.8 55.4 26.2 79.3 45.8l31.4 25.8 92.8-32.9c17 22.9 31.2 47.6 42.6 73.6L781.8 426l6.5 39.9zM512 326c-97.2 0-176 78.8-176 176s78.8 176 176 176 176-78.8 176-176-78.8-176-176-176zm79.2 255.2A111.6 111.6 0 01512 614c-29.9 0-58-11.7-79.2-32.8A111.6 111.6 0 01400 502c0-29.9 11.7-58 32.8-79.2C454 401.6 482.1 390 512 390c29.9 0 58 11.6 79.2 32.8A111.6 111.6 0 01624 502c0 29.9-11.7 58-32.8 79.2z" } }] }, "name": "setting", "theme": "outlined" };
  function _objectSpread$1(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i] != null ? Object(arguments[i]) : {};
      var ownKeys = Object.keys(source);
      if (typeof Object.getOwnPropertySymbols === "function") {
        ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
          return Object.getOwnPropertyDescriptor(source, sym).enumerable;
        }));
      }
      ownKeys.forEach(function(key) {
        _defineProperty$1(target, key, source[key]);
      });
    }
    return target;
  }
  function _defineProperty$1(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
    } else {
      obj[key] = value;
    }
    return obj;
  }
  var SettingOutlined = function SettingOutlined2(props, context) {
    var p = _objectSpread$1({}, props, context.attrs);
    return vue.createVNode(Icon, _objectSpread$1({}, p, {
      "icon": SettingOutlined$1
    }), null);
  };
  SettingOutlined.displayName = "SettingOutlined";
  SettingOutlined.inheritAttrs = false;
  var ShrinkOutlined$1 = { "icon": { "tag": "svg", "attrs": { "viewBox": "64 64 896 896", "focusable": "false" }, "children": [{ "tag": "path", "attrs": { "d": "M881.7 187.4l-45.1-45.1a8.03 8.03 0 00-11.3 0L667.8 299.9l-54.7-54.7a7.94 7.94 0 00-13.5 4.7L576.1 439c-.6 5.2 3.7 9.5 8.9 8.9l189.2-23.5c6.6-.8 9.3-8.8 4.7-13.5l-54.7-54.7 157.6-157.6c3-3 3-8.1-.1-11.2zM439 576.1l-189.2 23.5c-6.6.8-9.3 8.9-4.7 13.5l54.7 54.7-157.5 157.5a8.03 8.03 0 000 11.3l45.1 45.1c3.1 3.1 8.2 3.1 11.3 0l157.6-157.6 54.7 54.7a7.94 7.94 0 0013.5-4.7L447.9 585a7.9 7.9 0 00-8.9-8.9z" } }] }, "name": "shrink", "theme": "outlined" };
  function _objectSpread(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i] != null ? Object(arguments[i]) : {};
      var ownKeys = Object.keys(source);
      if (typeof Object.getOwnPropertySymbols === "function") {
        ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
          return Object.getOwnPropertyDescriptor(source, sym).enumerable;
        }));
      }
      ownKeys.forEach(function(key) {
        _defineProperty(target, key, source[key]);
      });
    }
    return target;
  }
  function _defineProperty(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
    } else {
      obj[key] = value;
    }
    return obj;
  }
  var ShrinkOutlined = function ShrinkOutlined2(props, context) {
    var p = _objectSpread({}, props, context.attrs);
    return vue.createVNode(Icon, _objectSpread({}, p, {
      "icon": ShrinkOutlined$1
    }), null);
  };
  ShrinkOutlined.displayName = "ShrinkOutlined";
  ShrinkOutlined.inheritAttrs = false;
  var _GM_getValue = /* @__PURE__ */ (() => typeof GM_getValue != "undefined" ? GM_getValue : void 0)();
  var _GM_info = /* @__PURE__ */ (() => typeof GM_info != "undefined" ? GM_info : void 0)();
  var _GM_setValue = /* @__PURE__ */ (() => typeof GM_setValue != "undefined" ? GM_setValue : void 0)();
  var _unsafeWindow = /* @__PURE__ */ (() => typeof unsafeWindow != "undefined" ? unsafeWindow : void 0)();
  const getScriptInfo = () => {
    return {
      name: _GM_info.script.name,
      author: _GM_info.script.author,
      namespace: _GM_info.script.namespace,
      version: _GM_info.script.version,
      description: _GM_info.script.description
    };
  };
  const LOCAL_USER_CENTER_URL = "https://xs.openget.cn/user?section=account";
  const localBackendJson = (url, data, token) => {
    return new Promise((resolve) => {
      GM_xmlhttpRequest({
        url,
        method: data ? "POST" : "GET",
        headers: {
          "Content-Type": "application/json",
          ...token ? { "Authorization": "Bearer " + token } : {}
        },
        data: data ? JSON.stringify(data) : void 0,
        timeout: 2e4,
        onload: (response) => {
          try {
            resolve(JSON.parse(response.responseText || "{}"));
          } catch (_) {
            resolve({ code: 500, msg: "本地后端响应解析失败" });
          }
        },
        onerror: () => resolve({ code: 500, msg: "无法连接本地后端" }),
        ontimeout: () => resolve({ code: 500, msg: "本地后端请求超时" })
      });
    });
  };
  const sha256Text = async (text) => {
    const encoder = new TextEncoder();
    const hashBuf = await crypto.subtle.digest("SHA-256", encoder.encode(text || ""));
    return Array.from(new Uint8Array(hashBuf)).map((b) => b.toString(16).padStart(2, "0")).join("");
  };
  const getRememberedLogin = () => {
    try {
      return JSON.parse(_GM_getValue("localBackendLogin") || "{}") || {};
    } catch (_) {
      return {};
    }
  };
  const setRememberedLogin = (data) => {
    try {
      _GM_setValue("localBackendLogin", JSON.stringify(data || {}));
    } catch (_) {
    }
  };
  const syncLoginTokenToScriptKey = async (setting, loginToken) => {
    const keyRes = await localBackendJson("https://xs.openget.cn/api/user/script-key", null, loginToken);
    if (keyRes.code !== 200 || !keyRes.script_key) {
      return { ok: false, msg: keyRes.msg || "脚本密钥获取失败" };
    }
    setting.config.basicConfig.token.value = keyRes.script_key;
    try {
      abcCloudApplying = true;
      await fetchAndApplyAbcCloudConfig(setting, keyRes.script_key);
    } catch (_) {
    } finally {
      abcCloudApplying = false;
    }
    const profileRes = await localBackendJson("https://xs.openget.cn/api/user/profile", null, keyRes.script_key);
    setting.userInfo.remainCount = profileRes.code === 200 && profileRes.profile ? getProfileRemainingCount(profileRes.profile) : "已配置";
    if (profileRes.code === 200 && profileRes.profile) {
      setting.userInfo.activeMember = !!profileRes.profile.active_member;
      setting.userInfo.memberUntil = profileRes.profile.member_until || "";
      setting.userInfo.pointsBalance = Number(profileRes.profile.points_balance || 0);
    }
    persistSettingState(setting);
    return { ok: true, msg: "已自动登录并同步密钥" };
  };
  const persistSettingState = (setting) => {
    try {
      _GM_setValue("setting", JSON.stringify(setting.$state || setting));
    } catch (_) {
    }
  };
  const serializeAbcCloudConfig = (setting) => {
    const config = {};
    ["basicConfig", "examConfig", "cxConfig", "searchConfig"].forEach((section) => {
      config[section] = {};
      const group = setting.config && setting.config[section] || {};
      Object.keys(group).forEach((key) => {
        if (key === "token") return;
        if (group[key] && Object.prototype.hasOwnProperty.call(group[key], "value")) {
          config[section][key] = group[key].value;
        }
      });
    });
    return config;
  };
  const applyAbcCloudConfig = (setting, cloudConfig) => {
    if (!cloudConfig || typeof cloudConfig !== "object") return false;
    let changed = false;
    ["basicConfig", "examConfig", "cxConfig", "searchConfig"].forEach((section) => {
      const group = setting.config && setting.config[section];
      const source = cloudConfig[section] || {};
      if (!group || !source) return;
      Object.keys(source).forEach((key) => {
        if (key === "token") return;
        if (group[key] && Object.prototype.hasOwnProperty.call(group[key], "value") && group[key].value !== source[key]) {
          group[key].value = source[key];
          changed = true;
        }
      });
    });
    return changed;
  };
  const fetchAndApplyAbcCloudConfig = async (setting, token) => {
    if (!token) return false;
    const res = await localBackendJson("https://xs.openget.cn/api/user/settings", null, token);
    if (res.code === 200 && res.settings && res.settings.abcConfig) {
      const changed = applyAbcCloudConfig(setting, res.settings.abcConfig);
      if (changed) persistSettingState(setting);
      return changed;
    }
    return false;
  };
  let abcCloudSaveTimer = null;
  let abcCloudApplying = false;
  const scheduleSaveAbcCloudConfig = (setting, token) => {
    if (!token || abcCloudApplying) return;
    if (abcCloudSaveTimer) clearTimeout(abcCloudSaveTimer);
    abcCloudSaveTimer = setTimeout(async () => {
      const current = await localBackendJson("https://xs.openget.cn/api/user/settings", null, token);
      const settings = current.code === 200 && current.settings && typeof current.settings === "object" ? current.settings : {};
      settings.abcConfig = serializeAbcCloudConfig(setting);
      await localBackendJson("https://xs.openget.cn/api/user/settings", { settings }, token);
    }, 800);
  };
  let scriptLogQueue = [];
  let scriptLogFlushTimer = null;
  const plainLogText = (text) => {
    const div = document.createElement("div");
    div.innerHTML = String(text || "");
    return (div.textContent || div.innerText || String(text || "")).slice(0, 4000);
  };
  const getScriptLogToken = () => {
    try {
      const setting = useSettingStore();
      const scriptKey = setting.config && setting.config.basicConfig && setting.config.basicConfig.token && setting.config.basicConfig.token.value || "";
      if (scriptKey) return scriptKey;
      const remembered = getRememberedLogin();
      if (remembered && remembered.token) return remembered.token;
      return "";
    } catch (_) {
      try {
        const remembered = getRememberedLogin();
        if (remembered && remembered.token) return remembered.token;
      } catch (e2) {}
      return "";
    }
  };
  const flushScriptLogs = async () => {
    const token = getScriptLogToken();
    if (!token || !scriptLogQueue.length) return;
    const logs = scriptLogQueue.splice(0, 80);
    const res = await localBackendJson("https://xs.openget.cn/api/script-logs", { logs }, token);
    if (!res || res.code !== 200) {
      scriptLogQueue = logs.concat(scriptLogQueue).slice(-200);
    }
  };
  const enqueueScriptLog = (logItem) => {
    scriptLogQueue.push({
      event_type: logItem.type === "warning" ? "warning" : "log",
      level: logItem.type === "warning" ? "warning" : "info",
      message: plainLogText(logItem.text),
      page_url: location.href,
      extra: {
        tabIndex: logItem.tabIndex,
        time: logItem.time,
        script_version: getScriptInfo().version,
        raw_html: String(logItem.text || "").slice(0, 1000)
      },
      timestamp: Date.now()
    });
    if (scriptLogQueue.length > 200) scriptLogQueue = scriptLogQueue.slice(-200);
    if (scriptLogFlushTimer) clearTimeout(scriptLogFlushTimer);
    scriptLogFlushTimer = setTimeout(flushScriptLogs, 1200);
  };
  const formatDateTime = (dt) => {
    dt.getFullYear();
    dt.getMonth() + 1;
    dt.getDate();
    let hours = dt.getHours();
    let minutes = dt.getMinutes();
    let seconds = dt.getSeconds();
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };
  const pad = (n) => {
    return n < 10 ? "0" + n : n.toString();
  };
  const getDateTime = () => {
    let now = /* @__PURE__ */ new Date();
    return formatDateTime(now);
  };
  const useLogStore = pinia.defineStore("log", {
    state: () => ({
      logList: []
    }),
    actions: {
      insertLog(text, type = null, tabIndex = null) {
        const logItem = {
          text,
          time: getDateTime(),
          type,
          tabIndex
        };
        this.logList.push(logItem);
        enqueueScriptLog(logItem);
      }
    }
  });
  const _hoisted_1$8 = { class: "log-wrap" };
  const _hoisted_2$7 = ["innerHTML"];
  const _hoisted_3$6 = { key: 0 };
  const _sfc_main$9 = {
    __name: "UserLog",
    setup(__props) {
      const log = useLogStore();
      const logList = vue.ref(log.logList);
      const logDom = vue.ref(null);
      vue.watch(
        () => log.logList,
        () => {
          vue.nextTick(() => {
            logDom.value.scrollTop = logDom.value.scrollHeight;
          });
        },
        { deep: true }
      );
      return (_ctx, _cache) => {
        return vue.openBlock(), vue.createElementBlock("div", _hoisted_1$8, [
          vue.createElementVNode("div", {
            class: "console",
            ref_key: "logDom",
            ref: logDom
          }, [
            (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList(logList.value, (item, index) => {
              return vue.openBlock(), vue.createElementBlock("div", { key: index }, [
                vue.createElementVNode("span", null, vue.toDisplayString(item.time), 1),
                vue.createElementVNode("span", {
                  class: vue.normalizeClass(item.type == null ? "log" : "warning")
                }, "[" + vue.toDisplayString(item.type == null ? "日志" : "警告") + "]", 3),
                vue.createElementVNode("span", {
                  innerHTML: item.text
                }, null, 8, _hoisted_2$7)
              ]);
            }), 128)),
            logList.value.length == 0 ? (vue.openBlock(), vue.createElementBlock("div", _hoisted_3$6, _cache[0] || (_cache[0] = [
              vue.createElementVNode("span", { class: "log" }, "[日志]", -1),
              vue.createElementVNode("span", null, "等待用户进入正确页面..", -1)
            ]))) : vue.createCommentVNode("", true)
          ], 512)
        ]);
      };
    }
  };
  function deepMerge(target, source) {
    const result = { ...target };
    for (const key of Object.keys(target)) {
      if (!(key in source)) continue;
      const tVal = target[key];
      const sVal = source[key];
      if (tVal !== null && typeof tVal === "object" && !Array.isArray(tVal) && sVal !== null && typeof sVal === "object" && !Array.isArray(sVal)) {
        result[key] = deepMerge(tVal, sVal);
      } else {
        result[key] = sVal;
      }
    }
    return result;
  }
  const useSettingStore = pinia.defineStore("setting", {
    state: () => {
      const scriptInfo = getScriptInfo();
      const defaultTop = typeof window !== "undefined" ? `${Math.round(window.innerHeight * 0.2)}px` : "120px";
      const defaultSetting = {
        tabIndex: "0",
        version: scriptInfo.version,
        position: {
          right: "0px",
          top: defaultTop
        },
        shopLink: "",
        latestVersion: "",
        chatWebUrl: "",
        config: {
          cxConfig: {
            showCustomEditor: {
              text: "编辑时显示自定义编辑框",
              value: true,
              type: "switch",
              tips: "开启后，编辑时会显示自定义编辑框"
            },
            faceRecognitionNotify: {
              text: "出现人脸识别时通知我",
              value: true,
              type: "switch",
              tips: "开启后，出现人脸识别时会发送通知"
            }
          },
          basicConfig: {
            token: {
              text: "本地后端密钥",
              value: "",
              type: "input",
              tips: "点击上方“点我获取密钥”打开用户中心，登录后复制脚本密钥并填入这里；填写后刷新页面生效。",
              placeholder: "请粘贴用户中心生成的脚本密钥"
            },
            answerMode: {
              text: "答题模式",
              value: "questionBankAndAI",
              type: "select",
              tips: "纯题库：仅题库搜索；纯AI：仅AI答题；题库+AI：题库优先，无结果时AI答题",
              options: [
                { value: "questionBank", label: "纯题库" },
                { value: "ai", label: "纯AI" },
                { value: "questionBankAndAI", label: "题库+AI" }
              ]
            },
            videoPlayrate: {
              text: "视频倍速",
              value: 2,
              type: "select",
              tips: "❗❗❗视频观看倍速，高倍速可能面临进度清空风险，请慎重选择，建议（1-2倍速）",
              options: [
                { value: 1, label: "1 x" },
                { value: 1.5, label: "1.5 x" },
                { value: 2, label: "2 x" }
              ]
            },
            reqIntervalTime: {
              text: "搜题间隔（秒）",
              value: 2,
              type: "input-number",
              min: 1,
              max: 3,
              tips: "每题搜题间隔，不建议太低，避免服务器压力过大"
            },
            accuracy: {
              text: "正确率",
              value: 80,
              type: "slider",
              tips: "作业、测验、考试满足设定的正确率才会提交，不满足自动保存,建议80%"
            },
            autoSubmit: {
              text: "章节、作业自动提交",
              value: true,
              type: "switch",
              tips: "（建议开启）开启后，满足正确率则自动提交作业、章节，手动答题时建议关闭此功能"
            },
            autoChangeChapter: {
              text: "自动切换章节",
              value: true,
              type: "switch",
              tips: "（建议开启）开启后，自动切换章节，手动答题时，建议关闭"
            },
            autoAnswer: {
              text: "自动答题",
              value: true,
              type: "switch",
              tips: "手动答题时，建议关闭，学习时，建议开启"
            },
            autoRefresh: {
              text: "定时刷新（防卡死）",
              value: true,
              type: "switch",
              tips: "（建议开启）每30分钟刷新页面，防止脚本卡死"
            }
          },
          examConfig: {
            autoSubmit: {
              value: false,
              text: "自动交卷",
              type: "switch",
              tips: "手动考试时建议关闭；自动考试答题完成后，将自动点击交卷。"
            }
          },
          searchConfig: {
            searchBySelectedText: {
              value: false,
              text: "划词搜题"
            }
          }
        },
        userInfo: {
          remainCount: 0,
          activeMember: false,
          memberUntil: "",
          pointsBalance: 0
        }
      };
      try {
        const localStore = JSON.parse(_GM_getValue("setting"));
        if (localStore) {
          const merged = deepMerge(defaultSetting, localStore);
          merged.version = scriptInfo.version;
          return merged;
        }
      } catch (error) {
        console.log("localStore error:", error);
      }
      return defaultSetting;
    }
  });
  const _export_sfc = (sfc, props) => {
    const target = sfc.__vccOpts || sfc;
    for (const [key, val] of props) {
      target[key] = val;
    }
    return target;
  };
  const _hoisted_1$7 = { class: "home-wrap" };
  const _hoisted_2$6 = { class: "tips" };
  const _hoisted_3$5 = { key: 0 };
  const _hoisted_4$5 = ["innerHTML"];
  const _sfc_main$8 = {
    __name: "ScriptHome",
    setup(__props) {
      const scriptInfo = getScriptInfo();
      const setting = useSettingStore();
      const { latestVersion, chatWebUrl, shopLink } = pinia.storeToRefs(setting);
      const remembered = getRememberedLogin();
      const loginUser = vue.ref(remembered.username || "");
      const loginPwd = vue.ref("");
      const loginMsg = vue.ref("");
      const loginBusy = vue.ref(false);
      const rememberLogin = vue.ref(remembered.remember !== false);
      const isAutoLoggedIn = vue.ref(!!remembered.token);
      const openUserCenter = () => {
        const token = (remembered && remembered.token) || "";
        const user = (remembered && remembered.user) || "";
        const userStr = typeof user === "string" ? user : JSON.stringify(user);
        const url = token
          ? `${LOCAL_USER_CENTER_URL}&token=${encodeURIComponent(token)}&user=${encodeURIComponent(userStr)}`
          : setting.shopLink || LOCAL_USER_CENTER_URL;
        window.open(url, "_blank");
      };
      const openPricing = () => {
        const token = (remembered && remembered.token) || "";
        const user = (remembered && remembered.user) || "";
        const userStr = typeof user === "string" ? user : JSON.stringify(user);
        const baseUrl = "https://xs.openget.cn/user?section=billing";
        const url = token
          ? `${baseUrl}&token=${encodeURIComponent(token)}&user=${encodeURIComponent(userStr)}`
          : baseUrl;
        window.open(url, "_blank");
      };
      const openRegister = () => {
        window.open("https://xs.openget.cn/register", "_blank");
      };
      const openForgot = () => {
        window.open("https://xs.openget.cn/forgot", "_blank");
      };
      const loginLocalBackend = async () => {
        if (!loginUser.value.trim() || !loginPwd.value.trim()) {
          loginMsg.value = "请填写用户名/邮箱和密码";
          return;
        }
        loginBusy.value = true;
        loginMsg.value = "正在登录用户中心...";
        try {
          const password_hash = await sha256Text(loginPwd.value.trim());
          const loginRes = await localBackendJson("https://xs.openget.cn/api/auth/login", {
            username: loginUser.value.trim(),
            password_hash
          });
          if (loginRes.code !== 200 || !loginRes.token) {
            loginMsg.value = loginRes.msg || "登录失败";
            return;
          }
          const syncRes = await syncLoginTokenToScriptKey(setting, loginRes.token);
          if (syncRes.ok) {
            if (rememberLogin.value) {
              setRememberedLogin({
                remember: true,
                username: loginUser.value.trim(),
                token: loginRes.token,
                savedAt: Date.now()
              });
            } else {
              setRememberedLogin({ remember: false, username: loginUser.value.trim() });
            }
            isAutoLoggedIn.value = true;
            loginMsg.value = "登录成功，已记住登录状态并同步密钥";
          } else {
            loginMsg.value = syncRes.msg || "登录成功，但脚本密钥获取失败，请点用户中心手动复制";
          }
        } catch (e) {
          loginMsg.value = "登录失败，请检查本地后端是否运行";
        } finally {
          loginBusy.value = false;
        }
      };
      const autoLoginByRememberedToken = async () => {
        if (!remembered.token) return;
        loginBusy.value = true;
        loginMsg.value = "正在恢复上次登录状态...";
        const profile = await localBackendJson("https://xs.openget.cn/api/user/profile", null, remembered.token);
        if (profile.code !== 200) {
          loginMsg.value = "登录状态已过期，请重新登录";
          setRememberedLogin({ remember: rememberLogin.value, username: remembered.username || "" });
          isAutoLoggedIn.value = false;
          loginBusy.value = false;
          return;
        }
        const syncRes = await syncLoginTokenToScriptKey(setting, remembered.token);
        loginMsg.value = syncRes.ok ? "已恢复登录状态并同步密钥" : syncRes.msg || "自动登录失败";
        loginBusy.value = false;
      };
      const clearRememberedLogin = () => {
        setRememberedLogin({ remember: rememberLogin.value, username: loginUser.value.trim() });
        isAutoLoggedIn.value = false;
        loginMsg.value = "已清除脚本页登录记忆";
      };
      const showLogin = vue.ref(true);
      const showTips = vue.ref(false);
      const showTutorial = vue.ref(false);
      vue.onMounted(autoLoginByRememberedToken);
      return (_ctx, _cache) => {
        return vue.openBlock(), vue.createElementBlock("div", _hoisted_1$7, [
          vue.createElementVNode("div", { class: "home-section", style: {"margin-top":"8px"} }, [
            vue.createElementVNode("div", { class: "section-title" }, "🏠 官网首页"),
            vue.createElementVNode("a", {
              class: "home-card-btn",
              href: vue.unref(shopLink) || "https://xs.openget.cn/",
              target: "_blank"
            }, "访问学神助手官网", 8, ["href"])
          ]),
          !showLogin.value ? (vue.openBlock(), vue.createElementBlock("div", {
            key: "login-collapsed",
            class: "home-section collapsible-section",
            style: {"margin-top":"8px"}
          }, [
            vue.createElementVNode("div", {
              class: "section-title",
              title: "点击展开"
            }, [
              vue.createTextVNode("🔑 账号登录"),
              vue.createElementVNode("span", {
                class: "collapse-icon",
                onClick: ($event) => showLogin.value = true
              }, "+")
            ])
          ])) : vue.createCommentVNode("", true),
          showLogin.value ? (vue.openBlock(), vue.createElementBlock("div", {
            key: "login",
            class: "home-section collapsible-section",
            style: {"margin-top":"8px"}
          }, [
            vue.createElementVNode("div", {
              class: "section-title",
              title: "点击收起"
            }, [
              vue.createTextVNode("🔑 账号登录"),
              vue.createElementVNode("span", {
                class: "collapse-icon",
                onClick: ($event) => showLogin.value = false
              }, "−")
            ]),
            vue.createElementVNode("div", {
              style: { "padding": "10px 12px", "margin-top": "8px", "background": "var(--t-surface)", "border": "1px solid var(--t-border)", "border-radius": "6px" }
            }, [
            vue.createElementVNode("div", { style: { "display": "flex", "gap": "8px", "flex-wrap": "wrap", "align-items": "center" } }, [
              vue.createElementVNode("input", {
                value: loginUser.value,
                onInput: ($event) => loginUser.value = $event.target.value,
                placeholder: "用户名/邮箱",
                style: { "height": "30px", "width": "140px", "padding": "0 8px", "border": "1px solid var(--t-border2)", "border-radius": "4px", "background": "var(--t-surface)", "color": "var(--t-text)" }
              }, null, 40, ["value"]),
              vue.createElementVNode("input", {
                value: loginPwd.value,
                onInput: ($event) => loginPwd.value = $event.target.value,
                onKeydown: vue.withKeys(loginLocalBackend, ["enter"]),
                type: "password",
                placeholder: "密码",
                style: { "height": "30px", "width": "140px", "padding": "0 8px", "border": "1px solid var(--t-border2)", "border-radius": "4px", "background": "var(--t-surface)", "color": "var(--t-text)" }
              }, null, 40, ["value"]),
              vue.createElementVNode("button", {
                onClick: loginLocalBackend,
                disabled: loginBusy.value,
                style: { "height": "30px", "padding": "0 12px", "border": "none", "border-radius": "4px", "background": "var(--t-primary)", "color": "#fff", "cursor": "pointer", "font-size": "12px", "font-weight": "500" }
              }, vue.toDisplayString(loginBusy.value ? "登录中..." : "登录"), 9, ["disabled"]),
              vue.createElementVNode("button", {
                onClick: openForgot,
                style: { "height": "30px", "padding": "0 10px", "border": "1px solid var(--t-border2)", "border-radius": "4px", "background": "var(--t-surface2)", "color": "var(--t-text2)", "cursor": "pointer", "font-size": "12px" }
              }, "找回密码"),
              vue.createElementVNode("button", {
                onClick: openRegister,
                style: { "height": "30px", "padding": "0 10px", "border": "1px solid var(--t-border2)", "border-radius": "4px", "background": "var(--t-surface2)", "color": "var(--t-text2)", "cursor": "pointer", "font-size": "12px" }
              }, "注册账号"),
              vue.createElementVNode("button", {
                onClick: openPricing,
                style: { "height": "30px", "padding": "0 10px", "border": "1px solid var(--t-primary)", "border-radius": "4px", "background": "var(--t-primary-bg)", "color": "var(--t-primary)", "cursor": "pointer", "font-size": "12px" }
              }, "套餐购买")
            ]),
            vue.createElementVNode("div", { style: { "display": "flex", "gap": "10px", "align-items": "center", "margin-top": "8px", "color": "var(--t-text3)", "font-size": "11px", "line-height": "1.6", "flex-wrap": "wrap" } }, [
              vue.createElementVNode("label", { style: { "display": "inline-flex", "align-items": "center", "gap": "4px", "cursor": "pointer" } }, [
                vue.createElementVNode("input", {
                  type: "checkbox",
                  checked: rememberLogin.value,
                  onChange: ($event) => {
                    rememberLogin.value = $event.target.checked;
                    if (!rememberLogin.value) clearRememberedLogin();
                  }
                }, null, 40, ["checked"]),
                vue.createTextVNode("记住登录状态")
              ]),
              isAutoLoggedIn.value ? (vue.openBlock(), vue.createElementBlock("button", {
                key: 0,
                onClick: clearRememberedLogin,
                style: { "height": "24px", "padding": "0 8px", "border": "1px solid var(--t-danger)", "border-radius": "4px", "background": "var(--t-surface2)", "color": "var(--t-danger)", "cursor": "pointer", "font-size": "11px" }
              }, "清除记忆")) : vue.createCommentVNode("", true),
              vue.createElementVNode("span", null, "登录会自动获取并配置你自己的密钥；也可以到设置页手动粘贴别人的密钥。")
            ]),
            loginMsg.value ? (vue.openBlock(), vue.createElementBlock("div", {
              key: 2,
              style: { "margin-top": "8px", "color": loginMsg.value.includes("成功") ? "var(--t-success)" : "var(--t-danger)" }
            }, vue.toDisplayString(loginMsg.value), 5)) : vue.createCommentVNode("", true)
          ])
          ])) : vue.createCommentVNode("", true),
          vue.createElementVNode("div", {
            class: "home-section collapsible-section",
            style: {"margin-top":"8px"}
          }, [
            vue.createElementVNode("div", {
              class: "section-title",
              title: "点击展开/收起"
            }, [
              vue.createTextVNode("📌 使用提示"),
              vue.createElementVNode("span", {
                class: "collapse-icon",
                onClick: () => showTips.value = !showTips.value
              }, vue.toDisplayString(showTips.value ? "−" : "+"), 1)
            ])
          ]),
          showTips.value ? (vue.openBlock(), vue.createElementBlock("div", {
            key: "tips-content",
            style: { "margin": "0 8px 10px", "padding": "10px 12px", "background": "var(--t-surface)", "border": "1px solid var(--t-border)", "border-radius": "6px" }
          }, [
            vue.createElementVNode("ul", null, [
              vue.unref(scriptInfo).version !== vue.unref(latestVersion) ? (vue.openBlock(), vue.createElementBlock("li", _hoisted_3$5, _cache[0] || (_cache[0] = [
                vue.createTextVNode("检测到脚本非最新版本，"),
                vue.createElementVNode("a", {
                  href: "https://scriptcat.org/zh-CN/script-show-page/2827",
                  target: "_blank"
                }, "点我更新", -1)
              ]))) : vue.createCommentVNode("", true),
              _cache[1] || (_cache[1] = vue.createElementVNode("li", null, "请手动进入视频、作业、考试页面，脚本会自动运行。", -1)),
              _cache[2] || (_cache[2] = vue.createElementVNode("li", null, [
                vue.createTextVNode("如脚本无法正常运行，请使用 "),
                vue.createElementVNode("a", {
                  target: "_blank",
                  href: "https://www.google.com/intl/zh-CN/chrome/"
                }, "Chrome"),
                vue.createTextVNode(" 、 "),
                vue.createElementVNode("a", {
                  target: "_blank",
                  href: "https://www.firefox.com/"
                }, "火狐浏览器")
              ], -1)),
              vue.unref(chatWebUrl) ? (vue.openBlock(), vue.createElementBlock("li", {
                key: 1,
                innerHTML: vue.unref(chatWebUrl)
              }, null, 8, _hoisted_4$5)) : vue.createCommentVNode("", true)
            ])
          ])) : vue.createCommentVNode("", true),
          vue.createElementVNode("div", {
            class: "home-section collapsible-section",
            style: {"margin-top":"8px"}
          }, [
            vue.createElementVNode("div", {
              class: "section-title",
              title: "点击展开/收起"
            }, [
              vue.createTextVNode("📋 使用教程"),
              vue.createElementVNode("span", {
                class: "collapse-icon",
                onClick: () => showTutorial.value = !showTutorial.value
              }, vue.toDisplayString(showTutorial.value ? "−" : "+"), 1)
            ])
          ]),
          showTutorial.value ? (vue.openBlock(), vue.createElementBlock("div", {
            key: "tutorial-content",
            style: { "margin": "0 8px 10px", "padding": "10px 12px", "background": "var(--t-surface)", "border": "1px solid var(--t-border)", "border-radius": "6px" }
          }, [
            vue.createElementVNode("ol", null, [
              vue.createElementVNode("li", null, "打开任意网课平台，等待脚本加载。"),
              vue.createElementVNode("li", null, "如果自动答题搜索不到，可尝试在线搜索，答案基本都有。"),
              vue.createElementVNode("li", null, "如果不支持当前网课，则不会有相应的提示以及设置面板。"),
              vue.createElementVNode("li", null, [
                vue.createElementVNode("span", null, "最后温馨提示: "),
                vue.createElementVNode("div", null, "- 禁止与其他脚本一起使用，否则出现答案选不上或者页面卡死，无限刷新，等问题一律后果自负。"),
                vue.createElementVNode("div", null, "- 请将浏览器页面保持最大化，或者缩小窗口，不能最小化，否则可能导致脚本卡死！")
              ])
            ])
          ])) : vue.createCommentVNode("", true),
        ]);
      };
    }
  };
  const ScriptHome = /* @__PURE__ */ _export_sfc(_sfc_main$8, [["__scopeId", "data-v-137ea562"]]);
  const useQuestionStore = pinia.defineStore("questionStore", {
    state: () => ({
      questionList: [],
      currentQuestionIndex: 0,
      accuracy: -1,
      searchText: "",
      fuzzySearchResult: []
    }),
    actions: {
      clearQuestion() {
        this.questionList = [];
      },
      clearFuzzySearchResult() {
        this.fuzzySearchResult = [];
      }
    }
  });
  const _hoisted_1$6 = { class: "answer-wrap" };
  const _hoisted_2$5 = { class: "tips" };
  const _hoisted_3$4 = { class: "answer-tips" };
  const _hoisted_4$4 = { style: { "margin-bottom": "10px" } };
  const _hoisted_5$4 = { key: 0 };
  const _hoisted_6$4 = { key: 1 };
  const _hoisted_7$4 = { key: 2 };
  const _hoisted_8$4 = {
    key: 0,
    style: { "text-align": "center" }
  };
  const _hoisted_9$4 = { key: 1 };
  const _hoisted_10$2 = { class: "answer-list" };
  const _hoisted_11$2 = ["onClick"];
  const _hoisted_12$2 = { key: 0 };
  const _hoisted_13$1 = ["innerHTML"];
  const _hoisted_14$1 = { class: "answer-content" };
  const _hoisted_15 = ["innerHTML"];
  const _hoisted_16 = {
    key: 0,
    style: { "color": "#f94f17" }
  };
  const _sfc_main$7 = {
    __name: "AutoAnswer",
    emits: ["changeTab"],
    setup(__props, { emit: __emit }) {
      const codeMap = {
        1: "success",
        "-1": "default",
        2: "ai-success"
      };
      const questionStore = useQuestionStore();
      const selectedIndex = vue.ref(0);
      const answerDom = vue.ref(null);
      const setting = useSettingStore();
      const {
        questionList,
        currentQuestionIndex: currentIndex,
        accuracy
      } = pinia.storeToRefs(questionStore);
      const {
        userInfo
      } = pinia.storeToRefs(setting);
      const emit = __emit;
      const goSetting = () => {
        window.open(setting.shopLink || "https://xs.openget.cn/user?section=account", "_blank");
      };
      const tokenReady = vue.computed(() => {
        const remain = String(setting.userInfo.remainCount || "");
        return !!setting.config.basicConfig.token.value && remain && !["密钥未配置", "密钥无效", "null"].includes(remain);
      });
      const checkAnswer = (index) => {
        if (index > currentIndex.value) return;
        const dom = answerDom.value.getElementsByClassName("answer-item")[index];
        answerDom.value.scrollTo({ top: dom.offsetTop });
        selectedIndex.value = index;
      };
      return (_ctx, _cache) => {
        const _component_a_button = vue.resolveComponent("a-button");
        return vue.openBlock(), vue.createElementBlock("div", _hoisted_1$6, [
          vue.createElementVNode("div", _hoisted_2$5, [
            vue.createElementVNode("ul", null, [
              vue.createElementVNode("li", null, [
                _cache[1] || (_cache[1] = vue.createTextVNode(" 使用自动答题功能，请先 ")),
                vue.createVNode(_component_a_button, {
                  onClick: goSetting,
                  size: "small",
                  type: "primary",
                  danger: tokenReady.value
                }, {
                  icon: vue.withCtx(() => [
                    vue.createVNode(vue.unref(SettingOutlined))
                  ]),
                  default: vue.withCtx(() => [
                    vue.createTextVNode(vue.toDisplayString(tokenReady.value ? "已配置密钥" : "登录用户中心获取密钥"), 1)
                  ]),
                  _: 1
                })
              ]),
              _cache[2] || (_cache[2] = vue.createElementVNode("li", null, "如需手动答题，建议关闭自动切换功能", -1)),
              _cache[3] || (_cache[3] = vue.createElementVNode("li", null, "每次自动答题开始前，都会清空上一次的搜索结果", -1))
            ])
          ]),
          _cache[10] || (_cache[10] = vue.createElementVNode("div", {
            class: "separator",
            style: { "margin": "5px 0" }
          }, null, -1)),
          vue.createElementVNode("div", _hoisted_3$4, [
            vue.createElementVNode("div", _hoisted_4$4, [
              vue.createElementVNode("span", null, "答题进度：" + vue.toDisplayString(vue.unref(currentIndex)) + " / " + vue.toDisplayString(vue.unref(questionList).length), 1),
              _cache[5] || (_cache[5] = vue.createElementVNode("span", null, "｜", -1)),
              vue.createElementVNode("span", null, [
                _cache[4] || (_cache[4] = vue.createTextVNode(" 准确率： ")),
                vue.unref(questionList).length == 0 ? (vue.openBlock(), vue.createElementBlock("span", _hoisted_5$4, "未答题")) : vue.unref(accuracy) != -1 ? (vue.openBlock(), vue.createElementBlock("span", _hoisted_6$4, vue.toDisplayString(vue.unref(accuracy)) + "%", 1)) : (vue.openBlock(), vue.createElementBlock("span", _hoisted_7$4, "作业中.."))
              ]),
              _cache[6] || (_cache[6] = vue.createElementVNode("span", null, "｜", -1)),
              vue.createElementVNode("span", null, "剩余次数：" + vue.toDisplayString(vue.unref(userInfo).remainCount), 1)
            ]),
            _cache[7] || (_cache[7] = vue.createStaticVNode('<div class="box-tips"><div class="search-info searching"></div><span>搜索中</span><div class="search-info success"></div><span>题库答案</span><div class="search-info ai-success"></div><span>AI答案</span><div class="search-info warning"></div><span>异常</span></div>', 1))
          ]),
          _cache[11] || (_cache[11] = vue.createElementVNode("div", {
            class: "separator",
            style: { "margin": "5px 0" }
          }, null, -1)),
          vue.unref(questionList).length == 0 ? (vue.openBlock(), vue.createElementBlock("div", _hoisted_8$4, " ❗️ 未检测到试题 ")) : (vue.openBlock(), vue.createElementBlock("div", _hoisted_9$4, [
            vue.createElementVNode("div", _hoisted_10$2, [
              (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList(vue.unref(questionList), (question, index) => {
                var _a;
                return vue.openBlock(), vue.createElementBlock("div", {
                  onClick: ($event) => checkAnswer(index),
                  class: vue.normalizeClass(`search-info ${index === vue.unref(currentIndex) ? "searching" : ""} ${codeMap[(_a = question.answer) == null ? void 0 : _a.code] || "warning"}`),
                  key: index
                }, vue.toDisplayString(index + 1), 11, _hoisted_11$2);
              }), 128))
            ]),
            _cache[9] || (_cache[9] = vue.createElementVNode("div", {
              class: "separator",
              style: { "margin": "5px 0" }
            }, null, -1)),
            vue.unref(questionList).length != 0 ? (vue.openBlock(), vue.createElementBlock("div", {
              key: 0,
              ref_key: "answerDom",
              ref: answerDom,
              class: "answer-detail"
            }, [
              (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList(vue.unref(currentIndex), (index) => {
                var _a, _b, _c;
                return vue.openBlock(), vue.createElementBlock("div", {
                  class: "answer-item",
                  key: index
                }, [
                  index <= vue.unref(questionList).length ? (vue.openBlock(), vue.createElementBlock("div", _hoisted_12$2, [
                    vue.createElementVNode("div", null, [
                      vue.createElementVNode("span", null, vue.toDisplayString(index) + ".", 1),
                      vue.createElementVNode("div", {
                        style: { "display": "inline-block" },
                        innerHTML: vue.unref(questionList)[index - 1].title
                      }, null, 8, _hoisted_13$1)
                    ]),
                    vue.createElementVNode("div", _hoisted_14$1, [
                      _cache[8] || (_cache[8] = vue.createElementVNode("span", null, "答案：", -1)),
                      vue.createElementVNode("div", {
                        innerHTML: (_b = (_a = vue.unref(questionList)[index - 1].answer) == null ? void 0 : _a.answer) == null ? void 0 : _b.join()
                      }, null, 8, _hoisted_15),
                      ((_c = vue.unref(questionList)[index - 1].answer) == null ? void 0 : _c.code) === 0 ? (vue.openBlock(), vue.createElementBlock("div", _hoisted_16, "有答案（不完全匹配），请手动选择")) : vue.createCommentVNode("", true)
                    ])
                  ])) : vue.createCommentVNode("", true)
                ]);
              }), 128))
            ], 512)) : vue.createCommentVNode("", true)
          ]))
        ]);
      };
    }
  };
  const _hoisted_1$5 = { class: "config-wrap" };
  const _hoisted_2$4 = { class: "tips" };
  const _hoisted_3$3 = { class: "buy-btn" };
  const _hoisted_4$3 = ["href"];
  const _hoisted_5$3 = { class: "separator" };
  const _hoisted_6$3 = {
    key: 0,
    class: "config"
  };
  const _hoisted_7$3 = { class: "config-name" };
  const _hoisted_8$3 = { class: "config-input" };
  const _hoisted_9$3 = { key: 5 };
  const _sfc_main$6 = {
    __name: "UserConfig",
    emits: ["autoRefreshPage"],
    setup(__props, { emit: __emit }) {
      const setting = useSettingStore();
      const { shopLink } = pinia.storeToRefs(setting);
      const emit = __emit;
      const configSections = vue.computed(() => [
        { label: "基本设置", configs: setting.config.basicConfig, showRemainCount: true },
        { label: "考试设置", configs: setting.config.examConfig },
        { label: "超星设置", configs: setting.config.cxConfig }
      ]);
      const remainDisplay = vue.computed(() => {
        const ui = setting.userInfo;
        if (ui.activeMember && ui.memberUntil) {
          return { label: "包月到期：", value: ui.memberUntil.split(" ")[0], isMember: true };
        }
        const balance = Number(ui.pointsBalance || ui.remainCount || 0);
        if (balance >= 999999 || String(ui.remainCount) === "无限") {
          return { label: "剩余次数：", value: "无限", isMember: false };
        }
        return { label: "剩余次数：", value: balance + " 次", isMember: false };
      });
      vue.watch(
        () => setting.config.basicConfig.token,
        (newVal) => {
          try {
            _GM_setValue("setting", JSON.stringify(setting.$state || setting));
          } catch (_) {
          }
          setTimeout(() => window.location.reload(), 350);
        },
        {
          deep: true
        }
      );
      vue.watch(
        () => setting.config.basicConfig.videoPlayrate,
        (newVal) => {
          window.location.reload();
        },
        {
          deep: true
        }
      );
      vue.watch(
        () => setting.config.basicConfig.autoRefresh,
        (newVal) => {
          emit("autoRefreshPage");
        },
        {
          deep: true
        }
      );
      const formatter = (value) => {
        return `${value}%`;
      };
      const closeAllAuto = () => {
        const hasAnyEnabled = setting.config.basicConfig.autoSubmit.value || setting.config.basicConfig.autoChangeChapter.value || setting.config.basicConfig.autoAnswer.value || setting.config.examConfig.autoSubmit.value;
        const newState = !hasAnyEnabled;
        setting.config.basicConfig.autoSubmit.value = newState;
        setting.config.basicConfig.autoChangeChapter.value = newState;
        setting.config.basicConfig.autoAnswer.value = newState;
        setting.config.examConfig.autoSubmit.value = newState;
      };
      return (_ctx, _cache) => {
        const _component_a_slider = vue.resolveComponent("a-slider");
        const _component_a_input_number = vue.resolveComponent("a-input-number");
        const _component_a_switch = vue.resolveComponent("a-switch");
        const _component_a_input = vue.resolveComponent("a-input");
        const _component_a_select = vue.resolveComponent("a-select");
        return vue.openBlock(), vue.createElementBlock("div", _hoisted_1$5, [
          vue.createElementVNode("div", _hoisted_2$4, [
            vue.createElementVNode("ul", null, [
              vue.createElementVNode("li", null, [
                _cache[0] || (_cache[0] = vue.createTextVNode("自动答题功能需填写密钥， ")),
                vue.createElementVNode("span", _hoisted_3$3, [
                  vue.createVNode(vue.unref(BulbOutlined), { style: { "color": "#fff", "margin-right": "2px" } }),
                  vue.createElementVNode("a", {
                    href: vue.unref(shopLink),
                    target: "_blank"
                  }, "点我登录用户中心获取密钥 ", 8, _hoisted_4$3)
                ])
              ]),
              _cache[6] || (_cache[6] = vue.createElementVNode("li", null, "设置后进入章节测试，作业，考试页面即可自动答题", -1)),
              vue.createElementVNode("li", null, [
                _cache[1] || (_cache[1] = vue.createTextVNode("使用")),
                _cache[2] || (_cache[2] = vue.createElementVNode("span", { style: { "color": "#ef4444" } }, "AI、在线搜题", -1)),
                _cache[3] || (_cache[3] = vue.createTextVNode("，")),
                _cache[4] || (_cache[4] = vue.createElementVNode("span", { style: { "color": "#ef4444" } }, "关闭所有自动操作", -1)),
                _cache[5] || (_cache[5] = vue.createTextVNode("，防止冲突。 ")),
                vue.createElementVNode("span", {
                  onClick: closeAllAuto,
                  class: "buy-btn"
                }, "一键关闭/开启")
              ]),
              _cache[7] || (_cache[7] = vue.createElementVNode("li", null, [
                vue.createTextVNode("⚠️视频中出现题目，可以忽略，"),
                vue.createElementVNode("span", { style: { "color": "#ef4444" } }, "不影响学习进度")
              ], -1))
            ])
          ]),
          (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList(configSections.value, (section) => {
            return vue.openBlock(), vue.createElementBlock(vue.Fragment, {
              key: section.label
            }, [
              vue.createElementVNode("div", _hoisted_5$3, vue.toDisplayString(section.label), 1),
              vue.createElementVNode("div", null, [
                section.showRemainCount ? (vue.openBlock(), vue.createElementBlock("div", _hoisted_6$3, [
                  vue.createElementVNode("div", { style: { "color": "var(--t-text2)" } }, vue.toDisplayString(remainDisplay.value.label), 1),
                  vue.createElementVNode("a", {
                    href: "https://xs.openget.cn/user?section=billing",
                    target: "_blank",
                    style: { "color": remainDisplay.value.isMember ? "var(--t-primary)" : "var(--t-text)", "text-decoration": "none" }
                  }, vue.toDisplayString(remainDisplay.value.value), 1)
                ])) : vue.createCommentVNode("", true),
                (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList(section.configs, (config2) => {
                  return vue.openBlock(), vue.createElementBlock("div", { key: config2 }, [
                    vue.createElementVNode("div", {
                      class: vue.normalizeClass(["config", config2.type === "switch" ? "switch-item" : ""])
                    }, [
                      vue.createElementVNode("div", _hoisted_7$3, vue.toDisplayString(config2.text), 1),
                      vue.createElementVNode("div", _hoisted_8$3, [
                        config2.type === "slider" ? (vue.openBlock(), vue.createBlock(_component_a_slider, {
                          key: 0,
                          value: config2.value,
                          "onUpdate:value": ($event) => config2.value = $event,
                          "tip-formatter": formatter
                        }, null, 8, ["value", "onUpdate:value"])) : config2.type === "input-number" ? (vue.openBlock(), vue.createBlock(_component_a_input_number, {
                          key: 1,
                          precision: 0,
                          value: config2.value,
                          "onUpdate:value": ($event) => config2.value = $event,
                          min: config2.min,
                          max: config2.max
                        }, null, 8, ["value", "onUpdate:value", "min", "max"])) : config2.type === "switch" ? (vue.openBlock(), vue.createBlock(_component_a_switch, {
                          key: 2,
                          size: "small",
                          checked: config2.value,
                          "onUpdate:checked": ($event) => config2.value = $event
                        }, null, 8, ["checked", "onUpdate:checked"])) : config2.type === "input" ? (vue.openBlock(), vue.createBlock(_component_a_input, {
                          key: 3,
                          value: config2.value,
                          "onUpdate:value": ($event) => config2.value = $event,
                          valueModifiers: { lazy: true, trim: true },
                          placeholder: config2.placeholder
                        }, null, 8, ["value", "onUpdate:value", "placeholder"])) : config2.type === "select" ? (vue.openBlock(), vue.createBlock(_component_a_select, {
                          key: 4,
                          style: { "width": "100px" },
                          ref_for: true,
                          ref: "select",
                          value: config2.value,
                          "onUpdate:value": ($event) => config2.value = $event,
                          options: config2.options
                        }, null, 8, ["value", "onUpdate:value", "options"])) : (vue.openBlock(), vue.createElementBlock("span", _hoisted_9$3, vue.toDisplayString(config2.value), 1))
                      ])
                    ], 2)
                  ]);
                }), 128))
              ])
            ], 64);
          }), 128))
        ]);
      };
    }
  };
  const sleep = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms * 1e3));
  };
  const STORAGE_KEY = "answerRecords";
  const MAX_RECORDS = 200;
  const normalizeText = (value = "") => String(value).replace(/\s+/g, " ").trim();
  const normalizeOptions = (options = []) => [...Array.isArray(options) ? options : []].map((item) => normalizeText(item)).filter(Boolean).sort();
  const formatRequestTime = (timestamp) => {
    const date = new Date(timestamp);
    const pad3 = (value) => String(value).padStart(2, "0");
    return `${date.getFullYear()}-${pad3(date.getMonth() + 1)}-${pad3(date.getDate())} ${pad3(date.getHours())}:${pad3(date.getMinutes())}:${pad3(date.getSeconds())}`;
  };
  const createAnswerRecordCacheKey = (question) => JSON.stringify({
    title: normalizeText(question == null ? void 0 : question.title),
    type: normalizeText(question == null ? void 0 : question.type),
    optionsText: normalizeOptions(question == null ? void 0 : question.optionsText)
  });
  const loadRecords = () => {
    try {
      const records = JSON.parse(_GM_getValue(STORAGE_KEY) || "[]");
      return Array.isArray(records) ? records : [];
    } catch (error) {
      console.log("load answer records error:", error);
      return [];
    }
  };
  const useAnswerRecordStore = pinia.defineStore("answerRecord", {
    state: () => ({
      records: loadRecords()
    }),
    getters: {
      displayRecords: (state) => state.records
    },
    actions: {
      persistRecords() {
        _GM_setValue(STORAGE_KEY, JSON.stringify(this.records));
      },
      insertRecord({ question, answer, token, source }) {
        const timestamp = Date.now();
        const record = {
          cacheKey: createAnswerRecordCacheKey(question),
          token: token || "",
          title: (question == null ? void 0 : question.title) || "",
          requestTime: formatRequestTime(timestamp),
          timestamp,
          answer: Array.isArray(answer) ? answer : [],
          type: (question == null ? void 0 : question.type) || "",
          optionsText: Array.isArray(question == null ? void 0 : question.optionsText) ? question.optionsText : [],
          workType: (question == null ? void 0 : question.workType) || "",
          refer: (question == null ? void 0 : question.refer) || "",
          source: source || "accurate"
        };
        this.records.unshift(record);
        this.records = this.records.slice(0, MAX_RECORDS);
        this.persistRecords();
        return record;
      },
      clearRecords() {
        this.records = [];
        this.persistRecords();
      }
    }
  });
  const getApiBaseUrl = () => {
    return "https://xs.openget.cn";
  };
  const LOCAL_BACKEND_ANSWER_URL = "https://xs.openget.cn/api/v1/cx";
  const TIMEOUT_ERROR_MSG$1 = "请求超时，请前往设置尝试切换节点..";
  const SERVER_MAINTENANCE_ERROR_MSG$1 = "服务器维护中，请前往设置尝试切换节点，自动学习功能正常使用..";
  const handleError$1 = (msg) => ({
    code: 10003,
    data: {
      answer: [],
      num: "",
      usenum: ""
    },
    msg
  });
  const getCookieValue = (name) => {
    const pageWindow = _unsafeWindow || window;
    if (typeof pageWindow.getCookie === "function") {
      return pageWindow.getCookie(name) || "";
    }
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : "";
  };
  const getLocalBackendToken = () => {
    const keys = [
      "GPTJsSetting.token",
      "chaoxing.com:GPTJsSetting.token",
      "mooc1.chaoxing.com:GPTJsSetting.token"
    ];
    for (const key of keys) {
      try {
        const v = localStorage.getItem(key);
        if (v) return v;
      } catch (_) {
      }
      try {
        const v = _GM_getValue ? _GM_getValue(key) : "";
        if (v) return v;
      } catch (_) {
      }
    }
    try {
      const raw = localStorage.getItem("GPTJsSetting.userInfo") || localStorage.getItem("chaoxing.com:GPTJsSetting.userInfo");
      const obj = raw ? JSON.parse(raw) : null;
      if (obj && obj.token) return obj.token;
    } catch (_) {
    }
    return "";
  };
  const normalizeLocalBackendAnswers = (answer) => {
    if (Array.isArray(answer)) return answer.map((x) => String(x).trim()).filter(Boolean);
    const text = String(answer || "").replace(/。$/, "").trim();
    if (!text) return [];
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) return parsed.map((x) => String(x).trim()).filter(Boolean);
    } catch (_) {
    }
    if (/^[A-Z](?:[\s,，、;；|]+[A-Z])+$/.test(text.toUpperCase())) {
      return text.toUpperCase().split(/[\s,，、;；|]+/).filter(Boolean);
    }
    return text.split(/\s*\|\s*|\s*；\s*|\s*;\s*/).map((x) => x.trim()).filter(Boolean);
  };
  const buildLocalBackendQuestionPayload = (question) => {
    return JSON.stringify({
      question: question.title || "",
      options: question.optionsText || [],
      type: question.type || "",
      platform: "abc-helper",
      refer: question.refer || location.href
    });
  };
  const getProfileRemainingCount = (profile) => {
    if (!profile) return 0;
    if (profile.active_member) return "无限";
    return Number(profile.points_balance || profile.remaining || 0);
  };
  const updateUserInfoFromProfile = (profile) => {
    try {
      const setting = useSettingStore();
      if (profile) {
        setting.userInfo.activeMember = !!profile.active_member;
        setting.userInfo.memberUntil = profile.member_until || "";
        setting.userInfo.pointsBalance = Number(profile.points_balance || 0);
      }
    } catch (_) {}
  };
  const formatLocalRemainCount = (value) => {
    if (value === "无限") return "无限";
    const n = Number(value || 0);
    return n >= 999999 ? "无限" : n;
  };
  const fetchLocalBackendProfile = async (token) => {
    token = token || "";
    if (!token) return null;
    return new Promise((resolve) => {
      GM_xmlhttpRequest({
        url: "https://xs.openget.cn/api/user/profile?v=xs-5.0",
        method: "GET",
        headers: {
          "Authorization": "Bearer " + token
        },
        timeout: 15e3,
        onload: (response) => {
          try {
            const obj = JSON.parse(response.responseText || "{}");
            resolve(obj.code === 200 ? obj.profile : null);
          } catch (_) {
            resolve(null);
          }
        },
        onerror: () => resolve(null),
        ontimeout: () => resolve(null)
      });
    });
  };
  const callLocalBackendAnswer = async (question) => {
    const setting = useSettingStore();
    const token = setting.config.basicConfig.token.value || getLocalBackendToken() || "";
    const payload = buildLocalBackendQuestionPayload(question);
    const data = "question=" + encodeURIComponent(payload)
      + "&u=" + encodeURIComponent(getCookieValue("_uid") || getCookieValue("UID") || "")
      + "&model_mode=auto";
    await sleep(setting.config.basicConfig.reqIntervalTime.value);
    return new Promise((resolve) => {
      GM_xmlhttpRequest({
        url: LOCAL_BACKEND_ANSWER_URL + "?v=xs-5.0",
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          "Authorization": token ? "Bearer " + token : ""
        },
        data,
        timeout: 12e4,
        onload: (response) => {
          try {
            const obj = JSON.parse(response.responseText || "{}");
            if (obj.code === 200 && obj.data && obj.data.answer) {
              resolve({
                code: 1,
                data: {
                  answer: normalizeLocalBackendAnswers(obj.data.answer),
                  remainCount: obj.data.remainCount !== void 0 ? formatLocalRemainCount(obj.data.remainCount) : getProfileRemainingCount(obj.data.profile)
                },
                msg: obj.msg || (obj.data.bank ? "题库命中" : obj.data.cache ? "缓存命中" : "本地后端返回")
              });
              if (obj.data.profile) updateUserInfoFromProfile(obj.data.profile);
            } else if (response.status === 401 || obj.code === 401) {
              resolve(handleError$1("本地后端未登录或登录态失效，请先登录用户中心"));
            } else {
              resolve({ code: -1004, data: { answer: [], remainCount: 0 }, msg: obj.msg || "本地题库未命中" });
            }
          } catch (e) {
            resolve(handleError$1("本地后端响应解析失败"));
          }
        },
        onerror: () => resolve(handleError$1("无法连接本地后端 https://xs.openget.cn")),
        ontimeout: () => resolve(handleError$1("本地后端请求超时，请检查后端模型配置或稍后重试"))
      });
    });
  };
  const saveAnswerRecord = ({ question, answer, source = "accurate" }) => {
    const setting = useSettingStore();
    const answerRecordStore = useAnswerRecordStore();
    return answerRecordStore.insertRecord({
      question,
      answer,
      token: setting.config.basicConfig.token.value,
      source
    });
  };
  const getAccurateAnswer = async (question) => {
    return callLocalBackendAnswer(question);
  };
  const fetchFuzzySearch = async (question) => {
    const res = await callLocalBackendAnswer({
      title: question,
      optionsText: [],
      type: ""
    });
    if (res.code === 1) {
      return {
        code: 1,
        data: {
          items: [{
            title: question,
            options: "[]",
            answer: JSON.stringify(res.data.answer || []),
            type: "8"
          }]
        },
        msg: res.msg || "success"
      };
    }
    return { code: res.code, data: { items: [] }, msg: res.msg || "未查询到答案" };
  };
  const getAIAnswer = async (question) => {
    return callLocalBackendAnswer(question);
  };
  const _hoisted_1$4 = { class: "online-search-wrap" };
  const _hoisted_2$3 = { class: "tips" };
  const _hoisted_3$2 = { class: "config" };
  const _hoisted_4$2 = { class: "config-input" };
  const _hoisted_5$2 = { class: "searth-input-wrap" };
  const _hoisted_6$2 = { class: "searth-input" };
  const _hoisted_7$2 = { class: "search-btn" };
  const _hoisted_8$2 = { class: "result-list" };
  const _hoisted_9$2 = ["innerHTML"];
  const _hoisted_10$1 = ["innerHTML"];
  const _hoisted_11$1 = ["innerHTML"];
  const _hoisted_12$1 = {
    key: 0,
    style: { "text-align": "center", "font-size": "15px" }
  };
  const _sfc_main$5 = {
    __name: "OnlineSearch",
    emits: ["changeTab"],
    setup(__props, { emit: __emit }) {
      const [messageApi, contextHolder] = Antd.message.useMessage();
      const setting = useSettingStore();
      const questionStore = useQuestionStore();
      const { searchText } = pinia.storeToRefs(questionStore);
      const errInfo = vue.ref("");
      const isLoading = vue.ref(false);
      const isComposing = vue.ref(false);
      const emit = __emit;
      const goSetting = () => {
        window.open(setting.shopLink || "https://xs.openget.cn/user?section=account", "_blank");
      };
      const tokenReady = vue.computed(() => {
        const remain = String(setting.userInfo.remainCount || "");
        return !!setting.config.basicConfig.token.value && remain && !["密钥未配置", "密钥无效", "null"].includes(remain);
      });
      const typeMap = {
        单选题: "0",
        多选题: "1",
        填空题: "2",
        判断题: "3",
        简答题: "4",
        问答题: "4",
        名词解释: "5",
        论述题: "6",
        计算题: "7",
        分录题: "9",
        资料题: "10",
        连线题: "11",
        匹配题: "11",
        排序题: "13",
        完型填空: "14",
        完形填空题: "14",
        阅读理解: "15",
        程序题: "17",
        口语题: "18",
        听力题: "19",
        共用选项题: "20",
        测评题: "21",
        钟表题: "23",
        选词填空: "24",
        选做题: "25",
        其它: "8"
      };
      const getTypeByCode = vue.computed(() => {
        return function(type) {
          let key = Object.keys(typeMap).find((key2) => typeMap[key2] === String(type));
          return key || "";
        };
      });
      const answerJoin = vue.computed(() => {
        return function(answerList) {
          try {
            return JSON.parse(answerList).join(";");
          } catch {
            return answerList;
          }
        };
      });
      const { fuzzySearchResult } = pinia.storeToRefs(questionStore);
      const fuzzySearch = async (e) => {
        e.preventDefault();
        if (!setting.config.basicConfig.token.value) {
          messageApi.info("未配置密钥，请先前往“设置”模块填写密钥..");
          return;
        }
        if (!searchText.value || isComposing.value) return;
        if (searchText.value) {
          errInfo.value = "";
          questionStore.clearFuzzySearchResult();
          isLoading.value = true;
          const res = await fetchFuzzySearch(searchText.value);
          isLoading.value = false;
          if (res.code === 1) {
            const {
              data: { items }
            } = res;
            questionStore.fuzzySearchResult = items;
          } else {
            errInfo.value = res.msg;
          }
        } else {
          messageApi.info("请输入题目..");
        }
      };
      return (_ctx, _cache) => {
        const _component_a_button = vue.resolveComponent("a-button");
        const _component_a_switch = vue.resolveComponent("a-switch");
        const _component_a_textarea = vue.resolveComponent("a-textarea");
        return vue.openBlock(), vue.createElementBlock("div", _hoisted_1$4, [
          vue.createVNode(vue.unref(contextHolder)),
          vue.createElementVNode("div", _hoisted_2$3, [
            vue.createElementVNode("ul", null, [
              vue.createElementVNode("li", null, [
                _cache[5] || (_cache[5] = vue.createTextVNode(" 使用在线搜题前，请先前往 ")),
                vue.createVNode(_component_a_button, {
                  onClick: goSetting,
                  size: "small",
                  type: "primary",
                  danger: tokenReady.value
                }, {
                  icon: vue.withCtx(() => [
                    vue.createVNode(vue.unref(SettingOutlined))
                  ]),
                  default: vue.withCtx(() => [
                    vue.createTextVNode(vue.toDisplayString(tokenReady.value ? "已配置密钥" : "登录用户中心获取密钥"), 1)
                  ]),
                  _: 1
                })
              ]),
              _cache[6] || (_cache[6] = vue.createElementVNode("li", null, "如需手动答题，建议关闭自动切换功能，防止操作冲突", -1))
            ])
          ]),
          vue.createElementVNode("div", _hoisted_3$2, [
            _cache[7] || (_cache[7] = vue.createElementVNode("div", { class: "config-name" }, "划词搜题", -1)),
            vue.createElementVNode("div", _hoisted_4$2, [
              vue.createVNode(_component_a_switch, {
                size: "small",
                checked: vue.unref(setting).config.searchConfig.searchBySelectedText.value,
                "onUpdate:checked": _cache[0] || (_cache[0] = ($event) => vue.unref(setting).config.searchConfig.searchBySelectedText.value = $event)
              }, null, 8, ["checked"])
            ])
          ]),
          vue.createElementVNode("div", _hoisted_5$2, [
            _cache[8] || (_cache[8] = vue.createElementVNode("div", { class: "title" }, "搜索题目", -1)),
            vue.createElementVNode("div", _hoisted_6$2, [
              vue.createVNode(_component_a_textarea, {
                onKeydown: vue.withKeys(vue.withModifiers(fuzzySearch, ["exact"]), ["enter"]),
                onCompositionstart: _cache[1] || (_cache[1] = ($event) => isComposing.value = true),
                onCompositionend: _cache[2] || (_cache[2] = ($event) => isComposing.value = false),
                value: vue.unref(searchText),
                "onUpdate:value": _cache[3] || (_cache[3] = ($event) => vue.isRef(searchText) ? searchText.value = $event : null),
                placeholder: "请输入题目",
                rows: 4
              }, null, 8, ["onKeydown", "value"])
            ])
          ]),
          vue.createElementVNode("div", _hoisted_7$2, [
            vue.createVNode(_component_a_button, {
              onClick: fuzzySearch,
              style: { "width": "120px" },
              type: "primary",
              size: "small"
            }, {
              default: vue.withCtx(() => _cache[9] || (_cache[9] = [
                vue.createTextVNode("搜索")
              ])),
              _: 1
            })
          ]),
          vue.createElementVNode("div", _hoisted_8$2, [
            vue.createElementVNode("div", { innerHTML: errInfo.value }, null, 8, _hoisted_9$2),
            (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList(vue.unref(fuzzySearchResult), (result, index) => {
              return vue.openBlock(), vue.createElementBlock("div", {
                class: "result-item",
                key: index
              }, [
                vue.createElementVNode("div", null, [
                  vue.createElementVNode("span", null, vue.toDisplayString(`${index + 1}.【${getTypeByCode.value(result.type)}】`), 1),
                  vue.createElementVNode("span", {
                    innerHTML: result.title
                  }, null, 8, _hoisted_10$1)
                ]),
                vue.createElementVNode("div", null, [
                  (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList(JSON.parse(result.options), (option, index2) => {
                    return vue.openBlock(), vue.createElementBlock("div", { key: index2 }, [
                      vue.createElementVNode("span", null, vue.toDisplayString(String.fromCharCode(65 + index2)) + ".", 1),
                      vue.createElementVNode("span", null, vue.toDisplayString(option), 1)
                    ]);
                  }), 128))
                ]),
                vue.createElementVNode("div", {
                  class: "result-answer",
                  innerHTML: answerJoin.value(result.answer)
                }, null, 8, _hoisted_11$1)
              ]);
            }), 128)),
            isLoading.value ? (vue.openBlock(), vue.createElementBlock("div", _hoisted_12$1, [
              _cache[10] || (_cache[10] = vue.createElementVNode("span", { style: { "margin-right": "10px" } }, "搜索中", -1)),
              vue.createVNode(vue.unref(LoadingOutlined))
            ])) : vue.createCommentVNode("", true)
          ])
        ]);
      };
    }
  };
  const _hoisted_1$3 = { class: "ai-wrapper" };
  const _hoisted_2$2 = { class: "ai-message-role-avatar" };
  const _hoisted_3$1 = {
    key: 0,
    fill: "#333",
    "fill-rule": "evenodd",
    height: "30",
    style: { "flex": "0 0 auto", "line-height": "1" },
    viewBox: "0 0 30 30",
    width: "30",
    xmlns: "http://www.w3.org/2000/svg",
    class: "user-avatar"
  };
  const _hoisted_4$1 = {
    key: 1,
    class: "user-avatar"
  };
  const _hoisted_5$1 = { class: "ai-message-content" };
  const _hoisted_6$1 = {
    key: 0,
    class: "loading-container"
  };
  const _hoisted_7$1 = ["innerHTML"];
  const _hoisted_8$1 = { class: "ai-input-wrapper" };
  const _hoisted_9$1 = ["onKeydown"];
  const _sfc_main$4 = {
    __name: "AiHome",
    setup(__props) {
      const [messageApi, contextHolder] = Antd.message.useMessage();
      const setting = useSettingStore();
      const currentAbortController = vue.ref(null);
      const isLoading = vue.ref(false);
      const messages = vue.ref([{
        role: "system",
        content: "你好，有什么可以帮你的吗？"
      }]);
      const input = vue.ref("");
      const messageContainer = vue.ref(null);
      const isComposing = vue.ref(false);
      const scrollToBottom = () => {
        vue.nextTick(() => {
          if (messageContainer.value) {
            messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
          }
        });
        setTimeout(() => {
          if (messageContainer.value) {
            messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
          }
        }, 100);
      };
      const formatMessage = (message2) => {
        return marked.marked(message2);
      };
      const triggerAi = async (event) => {
        event.preventDefault();
        if (isLoading.value) return;
        if (!input.value || isComposing.value) return;
        if (!setting.config.basicConfig.token.value) {
          messageApi.info("未配置密钥，请先前往“设置”模块填写密钥..");
          return;
        }
        const inputValue = input.value;
        input.value = "";
        messages.value.push({
          role: "user",
          content: inputValue
        });
        messages.value.push({
          role: "system",
          content: "思考中"
        });
        scrollToBottom();
        try {
          const requestData = {
            content: inputValue,
            token: setting.config.basicConfig.token.value
          };
          const controller = new AbortController();
          const signal = controller.signal;
          currentAbortController.value = controller;
          isLoading.value = true;
          const response = await fetch("https://she.aichathelper.top/ai/ds", {
            method: "POST",
            signal,
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(requestData)
          });
          if (!response.ok) {
            messages.value[messages.value.length - 1].content = "发送消息失败，请重试";
            currentAbortController.value = null;
            isLoading.value = false;
            return;
          }
          const reader = response.body.getReader();
          const decoder = new TextDecoder("utf-8");
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            console.log("收到数据块:", chunk);
            const lines = chunk.split("\n").filter((line) => line.trim() !== "");
            const jsonStr = lines.find((line) => line.startsWith("{") && line.endsWith("}"));
            if (jsonStr) {
              const { code, msg } = JSON.parse(jsonStr);
              if (code) {
                messages.value[messages.value.length - 1].content = msg;
                currentAbortController.value = null;
                isLoading.value = false;
                return;
              }
            }
            for (const line of lines) {
              if (line.startsWith("0:")) {
                const jsonStr2 = line.slice(2);
                try {
                  const content = JSON.parse(jsonStr2);
                  console.log("解析的内容:", content);
                  const lastMessage = messages.value[messages.value.length - 1];
                  lastMessage.content = lastMessage.content === "思考中" ? content : lastMessage.content + content;
                  scrollToBottom();
                } catch (e) {
                  console.error("解析错误:", e, "行内容:", line);
                }
              }
            }
          }
          isLoading.value = false;
        } catch (error) {
          if (error.name === "AbortError") {
            console.log("请求被终止");
          } else {
            console.error("发送消息错误:", error);
            messages.value[messages.value.length - 1].content = "发送消息失败，请重试";
          }
          currentAbortController.value = null;
          isLoading.value = false;
        }
      };
      return (_ctx, _cache) => {
        return vue.openBlock(), vue.createElementBlock("div", _hoisted_1$3, [
          vue.createVNode(vue.unref(contextHolder)),
          vue.createElementVNode("div", {
            class: "ai-message-list",
            ref_key: "messageContainer",
            ref: messageContainer
          }, [
            (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList(messages.value, (m, index) => {
              return vue.openBlock(), vue.createElementBlock("div", {
                class: "ai-message-item",
                key: index
              }, [
                vue.createElementVNode("div", {
                  class: vue.normalizeClass(["ai-message-container", { "user-message": m.role === "user" }])
                }, [
                  vue.createElementVNode("div", _hoisted_2$2, [
                    m.role === "system" ? (vue.openBlock(), vue.createElementBlock("svg", _hoisted_3$1, _cache[3] || (_cache[3] = [
                      vue.createElementVNode("rect", {
                        width: "30",
                        height: "30",
                        fill: "#E7F8FF",
                        rx: "6"
                      }, null, -1),
                      vue.createElementVNode("path", { d: "M24.55 13.004a5.416 5.416 0 0 0-.478-4.501c-1.217-2.09-3.662-3.166-6.05-2.66A5.59 5.59 0 0 0 13.831 4c-2.441-.005-4.607 1.546-5.358 3.838a5.553 5.553 0 0 0-3.713 2.658 5.487 5.487 0 0 0 .691 6.5 5.416 5.416 0 0 0 .477 4.502c1.217 2.09 3.662 3.165 6.05 2.66A5.586 5.586 0 0 0 16.168 26c2.443.006 4.61-1.546 5.361-3.84a5.553 5.553 0 0 0 3.715-2.66 5.488 5.488 0 0 0-.693-6.497v.001zm-8.381 11.558a4.199 4.199 0 0 1-2.675-.954c.034-.018.093-.05.132-.074l4.44-2.53a.71.71 0 0 0 .364-.623v-6.176l1.877 1.069c.02.01.033.029.036.05v5.115c-.003 2.274-1.87 4.118-4.174 4.123zM7.192 20.78a4.059 4.059 0 0 1-.498-2.763c.032.02.09.055.131.078l4.44 2.53c.225.13.504.13.73 0l5.42-3.088v2.138a.068.068 0 0 1-.027.057L12.9 22.288c-1.999 1.136-4.552.46-5.707-1.51h-.001zm-1.169-9.564A4.15 4.15 0 0 1 8.198 9.41l-.002.151v5.06a.711.711 0 0 0 .364.624l5.42 3.087-1.876 1.07a.067.067 0 0 1-.063.005l-4.489-2.559c-1.995-1.14-2.679-3.658-1.53-5.63h.001zm15.417 3.54-5.42-3.088 1.876-1.068a.067.067 0 0 1 .063-.006l4.489 2.557c1.998 1.14 2.683 3.662 1.529 5.633a4.163 4.163 0 0 1-2.174 1.807V15.38a.71.71 0 0 0-.363-.623zm1.867-2.773a6.04 6.04 0 0 0-.132-.078l-4.44-2.53a.731.731 0 0 0-.729 0l-5.42 3.088v-2.138a.068.068 0 0 1 .027-.057L17.1 7.713c2-1.137 4.555-.46 5.707 1.513.487.833.664 1.809.499 2.757h.001zm-11.741 3.81-1.877-1.068a.065.065 0 0 1-.036-.051V9.559c.001-2.277 1.873-4.122 4.181-4.12.976 0 1.92.338 2.671.954-.034.018-.092.05-.131.073l-4.44 2.53a.71.71 0 0 0-.365.623l-.003 6.173v.002zm1.02-2.168L15 12.25l2.414 1.375v2.75L15 17.75l-2.415-1.375v-2.75z" }, null, -1)
                    ]))) : (vue.openBlock(), vue.createElementBlock("div", _hoisted_4$1, " 🙂 "))
                  ]),
                  vue.createElementVNode("div", _hoisted_5$1, [
                    m.content === "思考中" ? (vue.openBlock(), vue.createElementBlock("div", _hoisted_6$1, [
                      _cache[4] || (_cache[4] = vue.createElementVNode("span", null, "思考中", -1)),
                      vue.createVNode(vue.unref(LoadingOutlined), { class: "loading-icon" })
                    ])) : (vue.openBlock(), vue.createElementBlock("div", {
                      key: 1,
                      innerHTML: formatMessage(m.content)
                    }, null, 8, _hoisted_7$1))
                  ])
                ], 2)
              ]);
            }), 128))
          ], 512),
          vue.createElementVNode("div", _hoisted_8$1, [
            vue.withDirectives(vue.createElementVNode("textarea", {
              "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => input.value = $event),
              placeholder: "请输入你的问题...",
              rows: "2",
              onKeydown: vue.withKeys(vue.withModifiers(triggerAi, ["exact"]), ["enter"]),
              maxlength: "500",
              onCompositionstart: _cache[1] || (_cache[1] = ($event) => isComposing.value = true),
              onCompositionend: _cache[2] || (_cache[2] = ($event) => isComposing.value = false)
            }, null, 40, _hoisted_9$1), [
              [vue.vModelText, input.value]
            ]),
            vue.createElementVNode("div", {
              class: "send-message-btn",
              onClick: triggerAi
            }, [
              _cache[5] || (_cache[5] = vue.createElementVNode("span", null, "发送", -1)),
              vue.createVNode(vue.unref(SendOutlined))
            ])
          ])
        ]);
      };
    }
  };
  const _hoisted_1$2 = { class: "record-wrap" };
  const _hoisted_2$1 = { class: "record-tip" };
  const _hoisted_3 = { class: "record-filter" };
  const _hoisted_4 = ["onClick"];
  const _hoisted_5 = {
    key: 0,
    class: "record-list"
  };
  const _hoisted_6 = { class: "record-row" };
  const _hoisted_7 = ["title"];
  const _hoisted_8 = { class: "record-row" };
  const _hoisted_9 = ["title"];
  const _hoisted_10 = { class: "record-row" };
  const _hoisted_11 = ["title"];
  const _hoisted_12 = { class: "record-row" };
  const _hoisted_13 = ["title"];
  const _hoisted_14 = {
    key: 1,
    class: "tips"
  };
  const _sfc_main$3 = {
    __name: "AnswerRecord",
    setup(__props) {
      const answerRecordStore = useAnswerRecordStore();
      const { displayRecords } = pinia.storeToRefs(answerRecordStore);
      const activeFilter = vue.ref("all");
      const filterOptions = [
        { label: "所有", value: "all" },
        { label: "今天", value: "today" },
        { label: "昨天", value: "yesterday" },
        { label: "近一周", value: "week" },
        { label: "近一月", value: "month" }
      ];
      const getDayStart = (date = /* @__PURE__ */ new Date()) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
      const filteredRecords = vue.computed(() => {
        const now = Date.now();
        const todayStart = getDayStart();
        const yesterdayStart = todayStart - 24 * 60 * 60 * 1e3;
        return displayRecords.value.filter((record) => {
          const timestamp = record.timestamp || 0;
          if (activeFilter.value === "all") {
            return true;
          }
          if (activeFilter.value === "today") {
            return timestamp >= todayStart;
          }
          if (activeFilter.value === "yesterday") {
            return timestamp >= yesterdayStart && timestamp < todayStart;
          }
          if (activeFilter.value === "week") {
            return timestamp >= now - 7 * 24 * 60 * 60 * 1e3;
          }
          if (activeFilter.value === "month") {
            return timestamp >= now - 30 * 24 * 60 * 60 * 1e3;
          }
          return true;
        });
      });
      const clearRecords = () => {
        answerRecordStore.clearRecords();
      };
      const formatAnswer = (answer) => {
        if (!Array.isArray(answer) || answer.length === 0) return "-";
        return answer.join("；");
      };
      return (_ctx, _cache) => {
        const _component_a_button = vue.resolveComponent("a-button");
        return vue.openBlock(), vue.createElementBlock("div", _hoisted_1$2, [
          _cache[5] || (_cache[5] = vue.createElementVNode("div", { class: "separator" }, "▤ 记录", -1)),
          vue.createElementVNode("div", _hoisted_2$1, [
            vue.createElementVNode("span", null, "最多保留 200 条答题记录，当前 " + vue.toDisplayString(filteredRecords.value.length) + " 条", 1),
            vue.createVNode(_component_a_button, {
              class: "clear-btn",
              size: "small",
              onClick: clearRecords
            }, {
              default: vue.withCtx(() => _cache[0] || (_cache[0] = [
                vue.createTextVNode("清空记录")
              ])),
              _: 1
            })
          ]),
          vue.createElementVNode("div", _hoisted_3, [
            (vue.openBlock(), vue.createElementBlock(vue.Fragment, null, vue.renderList(filterOptions, (item) => {
              return vue.createElementVNode("button", {
                key: item.value,
                class: vue.normalizeClass(["filter-btn", { active: activeFilter.value === item.value }]),
                onClick: ($event) => activeFilter.value = item.value
              }, vue.toDisplayString(item.label), 11, _hoisted_4);
            }), 64))
          ]),
          filteredRecords.value.length ? (vue.openBlock(), vue.createElementBlock("div", _hoisted_5, [
            (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList(filteredRecords.value, (record) => {
              return vue.openBlock(), vue.createElementBlock("div", {
                key: `${record.cacheKey}-${record.timestamp}`,
                class: "record-item"
              }, [
                vue.createElementVNode("div", _hoisted_6, [
                  _cache[1] || (_cache[1] = vue.createElementVNode("span", { class: "record-label" }, "密钥", -1)),
                  vue.createElementVNode("span", {
                    class: "record-value",
                    title: record.token || "未配置"
                  }, vue.toDisplayString(record.token || "未配置"), 9, _hoisted_7)
                ]),
                vue.createElementVNode("div", _hoisted_8, [
                  _cache[2] || (_cache[2] = vue.createElementVNode("span", { class: "record-label" }, "题目", -1)),
                  vue.createElementVNode("span", {
                    class: "record-value",
                    title: record.title
                  }, vue.toDisplayString(record.title), 9, _hoisted_9)
                ]),
                vue.createElementVNode("div", _hoisted_10, [
                  _cache[3] || (_cache[3] = vue.createElementVNode("span", { class: "record-label" }, "答案", -1)),
                  vue.createElementVNode("span", {
                    class: "record-value",
                    title: formatAnswer(record.answer)
                  }, vue.toDisplayString(formatAnswer(record.answer)), 9, _hoisted_11)
                ]),
                vue.createElementVNode("div", _hoisted_12, [
                  _cache[4] || (_cache[4] = vue.createElementVNode("span", { class: "record-label" }, "请求时间", -1)),
                  vue.createElementVNode("span", {
                    class: "record-value",
                    title: record.requestTime
                  }, vue.toDisplayString(record.requestTime), 9, _hoisted_13)
                ])
              ]);
            }), 128))
          ])) : (vue.openBlock(), vue.createElementBlock("div", _hoisted_14, " 当前筛选条件下暂无答题记录。成功搜到答案并扣次后，会自动写入本地缓存。 "))
        ]);
      };
    }
  };
  const useMessageStore = pinia.defineStore("messageStore", {
    state: () => ({
      messageList: []
    }),
    actions: {
      insertMessage(text, type = "success") {
        const message2 = {
          text,
          type
        };
        this.messageList.push(message2);
      },
      clearMessage() {
        this.messageList = [];
      }
    }
  });
  const TIMEOUT_ERROR_MSG = "请求超时，请前往设置尝试切换节点..";
  const SERVER_MAINTENANCE_ERROR_MSG = "服务器维护中，请前往设置尝试切换节点，自动学习功能正常使用..";
  const handleError = (msg) => ({
    code: 10003,
    data: {
      answer: [],
      num: "",
      usenum: ""
    },
    msg
  });
  const fetchBasicInfo = async () => {
    const scriptInfo = getScriptInfo();
    return {
      code: 1,
      data: {
        shopLink: "https://xs.openget.cn/user?section=account",
        version: scriptInfo.version,
        chatWebUrl: "已接入 AI 智能答题云服务"
      }
    };
  };
  const getTokenInfo = async () => {
    let token = "";
    try {
      const setting = useSettingStore();
      token = setting.config.basicConfig.token.value || getLocalBackendToken() || "";
    } catch (_) {
      token = getLocalBackendToken() || "";
    }
    const profile = await fetchLocalBackendProfile(token);
    const remainCount = getProfileRemainingCount(profile);
    return {
      code: profile ? 1 : 10003,
      data: {
        count: remainCount,
        usedCount: 0,
        remainCount
      },
      msg: profile ? "本地后端已同步题数" : "密钥无效或已过期，请到用户中心重新生成脚本密钥"
    };
  };
  const selectTextSearchLogic = async (iframeDocument, iframeWindow) => {
    const questionStore = useQuestionStore();
    const setting = useSettingStore();
    _unsafeWindow.document.getSelection = function() {
      return {
        removeAllRanges: function() {
        }
      };
    };
    _unsafeWindow.document.onselectstart = true;
    _unsafeWindow.document.oncontextmenu = true;
    _unsafeWindow.document.oncut = true;
    _unsafeWindow.document.oncopy = true;
    _unsafeWindow.document.onpaste = true;
    const getSelectedText = () => {
      if (!setting.config.searchConfig.searchBySelectedText.value) return;
      let selectedText = "";
      if (iframeWindow.getSelection) {
        selectedText = iframeWindow.getSelection().toString();
      } else if (iframeDocument.selection) {
        selectedText = iframeDocument.selection.createRange().text;
      }
      if (selectedText != "") {
        questionStore.searchText = selectedText;
        setting.tabIndex = "3";
      }
    };
    iframeDocument.addEventListener("mouseup", getSelectedText);
  };
  var Typr$1 = {};
  var Typr = {};
  Typr.parse = function(buff) {
    var bin = Typr._bin;
    var data = new Uint8Array(buff);
    var tag = bin.readASCII(data, 0, 4);
    if (tag == "ttcf") {
      var offset = 4;
      bin.readUshort(data, offset);
      offset += 2;
      bin.readUshort(data, offset);
      offset += 2;
      var numF = bin.readUint(data, offset);
      offset += 4;
      var fnts = [];
      for (var i = 0; i < numF; i++) {
        var foff = bin.readUint(data, offset);
        offset += 4;
        fnts.push(Typr._readFont(data, foff));
      }
      return fnts;
    } else
      return [Typr._readFont(data, 0)];
  };
  Typr._readFont = function(data, offset) {
    var bin = Typr._bin;
    var ooff = offset;
    bin.readFixed(data, offset);
    offset += 4;
    var numTables = bin.readUshort(data, offset);
    offset += 2;
    bin.readUshort(data, offset);
    offset += 2;
    bin.readUshort(data, offset);
    offset += 2;
    bin.readUshort(data, offset);
    offset += 2;
    var tags = [
      "cmap",
      "head",
      "hhea",
      "maxp",
      "hmtx",
      "name",
      "OS/2",
      "post",
      //"cvt",
      //"fpgm",
      "loca",
      "glyf",
      "kern",
      //"prep"
      //"gasp"
      "CFF ",
      "GPOS",
      "GSUB",
      "SVG "
      //"VORG",
    ];
    var obj = { _data: data, _offset: ooff };
    var tabs = {};
    for (var i = 0; i < numTables; i++) {
      var tag = bin.readASCII(data, offset, 4);
      offset += 4;
      bin.readUint(data, offset);
      offset += 4;
      var toffset = bin.readUint(data, offset);
      offset += 4;
      var length = bin.readUint(data, offset);
      offset += 4;
      tabs[tag] = { offset: toffset, length };
    }
    for (var i = 0; i < tags.length; i++) {
      var t = tags[i];
      if (tabs[t])
        obj[t.trim()] = Typr[t.trim()].parse(data, tabs[t].offset, tabs[t].length, obj);
    }
    return obj;
  };
  Typr._tabOffset = function(data, tab, foff) {
    var bin = Typr._bin;
    var numTables = bin.readUshort(data, foff + 4);
    var offset = foff + 12;
    for (var i = 0; i < numTables; i++) {
      var tag = bin.readASCII(data, offset, 4);
      offset += 4;
      bin.readUint(data, offset);
      offset += 4;
      var toffset = bin.readUint(data, offset);
      offset += 4;
      bin.readUint(data, offset);
      offset += 4;
      if (tag == tab)
        return toffset;
    }
    return 0;
  };
  Typr._bin = {
    readFixed: function(data, o) {
      return (data[o] << 8 | data[o + 1]) + (data[o + 2] << 8 | data[o + 3]) / (256 * 256 + 4);
    },
    readF2dot14: function(data, o) {
      var num = Typr._bin.readShort(data, o);
      return num / 16384;
    },
    readInt: function(buff, p) {
      return Typr._bin._view(buff).getInt32(p);
    },
    readInt8: function(buff, p) {
      return Typr._bin._view(buff).getInt8(p);
    },
    readShort: function(buff, p) {
      return Typr._bin._view(buff).getInt16(p);
    },
    readUshort: function(buff, p) {
      return Typr._bin._view(buff).getUint16(p);
    },
    readUshorts: function(buff, p, len) {
      var arr = [];
      for (var i = 0; i < len; i++)
        arr.push(Typr._bin.readUshort(buff, p + i * 2));
      return arr;
    },
    readUint: function(buff, p) {
      return Typr._bin._view(buff).getUint32(p);
    },
    readUint64: function(buff, p) {
      return Typr._bin.readUint(buff, p) * (4294967295 + 1) + Typr._bin.readUint(buff, p + 4);
    },
    readASCII: function(buff, p, l) {
      var s = "";
      for (var i = 0; i < l; i++)
        s += String.fromCharCode(buff[p + i]);
      return s;
    },
    readUnicode: function(buff, p, l) {
      var s = "";
      for (var i = 0; i < l; i++) {
        var c = buff[p++] << 8 | buff[p++];
        s += String.fromCharCode(c);
      }
      return s;
    },
    _tdec: typeof window !== "undefined" && window["TextDecoder"] ? new window["TextDecoder"]() : null,
    readUTF8: function(buff, p, l) {
      var tdec = Typr._bin._tdec;
      if (tdec && p == 0 && l == buff.length)
        return tdec["decode"](buff);
      return Typr._bin.readASCII(buff, p, l);
    },
    readBytes: function(buff, p, l) {
      var arr = [];
      for (var i = 0; i < l; i++)
        arr.push(buff[p + i]);
      return arr;
    },
    readASCIIArray: function(buff, p, l) {
      var s = [];
      for (var i = 0; i < l; i++)
        s.push(String.fromCharCode(buff[p + i]));
      return s;
    },
    _view: function(buff) {
      return buff._dataView || (buff._dataView = buff.buffer ? new DataView(buff.buffer, buff.byteOffset, buff.byteLength) : new DataView(new Uint8Array(buff).buffer));
    }
  };
  Typr._lctf = {};
  Typr._lctf.parse = function(data, offset, length, font, subt) {
    var bin = Typr._bin;
    var obj = {};
    var offset0 = offset;
    bin.readFixed(data, offset);
    offset += 4;
    var offScriptList = bin.readUshort(data, offset);
    offset += 2;
    var offFeatureList = bin.readUshort(data, offset);
    offset += 2;
    var offLookupList = bin.readUshort(data, offset);
    offset += 2;
    obj.scriptList = Typr._lctf.readScriptList(data, offset0 + offScriptList);
    obj.featureList = Typr._lctf.readFeatureList(data, offset0 + offFeatureList);
    obj.lookupList = Typr._lctf.readLookupList(data, offset0 + offLookupList, subt);
    return obj;
  };
  Typr._lctf.readLookupList = function(data, offset, subt) {
    var bin = Typr._bin;
    var offset0 = offset;
    var obj = [];
    var count = bin.readUshort(data, offset);
    offset += 2;
    for (var i = 0; i < count; i++) {
      var noff = bin.readUshort(data, offset);
      offset += 2;
      var lut = Typr._lctf.readLookupTable(data, offset0 + noff, subt);
      obj.push(lut);
    }
    return obj;
  };
  Typr._lctf.readLookupTable = function(data, offset, subt) {
    var bin = Typr._bin;
    var offset0 = offset;
    var obj = { tabs: [] };
    obj.ltype = bin.readUshort(data, offset);
    offset += 2;
    obj.flag = bin.readUshort(data, offset);
    offset += 2;
    var cnt = bin.readUshort(data, offset);
    offset += 2;
    var ltype = obj.ltype;
    for (var i = 0; i < cnt; i++) {
      var noff = bin.readUshort(data, offset);
      offset += 2;
      var tab = subt(data, ltype, offset0 + noff, obj);
      obj.tabs.push(tab);
    }
    return obj;
  };
  Typr._lctf.numOfOnes = function(n) {
    var num = 0;
    for (var i = 0; i < 32; i++)
      if ((n >>> i & 1) != 0)
        num++;
    return num;
  };
  Typr._lctf.readClassDef = function(data, offset) {
    var bin = Typr._bin;
    var obj = [];
    var format = bin.readUshort(data, offset);
    offset += 2;
    if (format == 1) {
      var startGlyph = bin.readUshort(data, offset);
      offset += 2;
      var glyphCount = bin.readUshort(data, offset);
      offset += 2;
      for (var i = 0; i < glyphCount; i++) {
        obj.push(startGlyph + i);
        obj.push(startGlyph + i);
        obj.push(bin.readUshort(data, offset));
        offset += 2;
      }
    }
    if (format == 2) {
      var count = bin.readUshort(data, offset);
      offset += 2;
      for (var i = 0; i < count; i++) {
        obj.push(bin.readUshort(data, offset));
        offset += 2;
        obj.push(bin.readUshort(data, offset));
        offset += 2;
        obj.push(bin.readUshort(data, offset));
        offset += 2;
      }
    }
    return obj;
  };
  Typr._lctf.getInterval = function(tab, val) {
    for (var i = 0; i < tab.length; i += 3) {
      var start = tab[i], end = tab[i + 1];
      tab[i + 2];
      if (start <= val && val <= end)
        return i;
    }
    return -1;
  };
  Typr._lctf.readCoverage = function(data, offset) {
    var bin = Typr._bin;
    var cvg = {};
    cvg.fmt = bin.readUshort(data, offset);
    offset += 2;
    var count = bin.readUshort(data, offset);
    offset += 2;
    if (cvg.fmt == 1)
      cvg.tab = bin.readUshorts(data, offset, count);
    if (cvg.fmt == 2)
      cvg.tab = bin.readUshorts(data, offset, count * 3);
    return cvg;
  };
  Typr._lctf.coverageIndex = function(cvg, val) {
    var tab = cvg.tab;
    if (cvg.fmt == 1)
      return tab.indexOf(val);
    if (cvg.fmt == 2) {
      var ind = Typr._lctf.getInterval(tab, val);
      if (ind != -1)
        return tab[ind + 2] + (val - tab[ind]);
    }
    return -1;
  };
  Typr._lctf.readFeatureList = function(data, offset) {
    var bin = Typr._bin;
    var offset0 = offset;
    var obj = [];
    var count = bin.readUshort(data, offset);
    offset += 2;
    for (var i = 0; i < count; i++) {
      var tag = bin.readASCII(data, offset, 4);
      offset += 4;
      var noff = bin.readUshort(data, offset);
      offset += 2;
      var feat = Typr._lctf.readFeatureTable(data, offset0 + noff);
      feat.tag = tag.trim();
      obj.push(feat);
    }
    return obj;
  };
  Typr._lctf.readFeatureTable = function(data, offset) {
    var bin = Typr._bin;
    var offset0 = offset;
    var feat = {};
    var featureParams = bin.readUshort(data, offset);
    offset += 2;
    if (featureParams > 0) {
      feat.featureParams = offset0 + featureParams;
    }
    var lookupCount = bin.readUshort(data, offset);
    offset += 2;
    feat.tab = [];
    for (var i = 0; i < lookupCount; i++)
      feat.tab.push(bin.readUshort(data, offset + 2 * i));
    return feat;
  };
  Typr._lctf.readScriptList = function(data, offset) {
    var bin = Typr._bin;
    var offset0 = offset;
    var obj = {};
    var count = bin.readUshort(data, offset);
    offset += 2;
    for (var i = 0; i < count; i++) {
      var tag = bin.readASCII(data, offset, 4);
      offset += 4;
      var noff = bin.readUshort(data, offset);
      offset += 2;
      obj[tag.trim()] = Typr._lctf.readScriptTable(data, offset0 + noff);
    }
    return obj;
  };
  Typr._lctf.readScriptTable = function(data, offset) {
    var bin = Typr._bin;
    var offset0 = offset;
    var obj = {};
    var defLangSysOff = bin.readUshort(data, offset);
    offset += 2;
    if (defLangSysOff > 0) {
      obj["default"] = Typr._lctf.readLangSysTable(data, offset0 + defLangSysOff);
    }
    var langSysCount = bin.readUshort(data, offset);
    offset += 2;
    for (var i = 0; i < langSysCount; i++) {
      var tag = bin.readASCII(data, offset, 4);
      offset += 4;
      var langSysOff = bin.readUshort(data, offset);
      offset += 2;
      obj[tag.trim()] = Typr._lctf.readLangSysTable(data, offset0 + langSysOff);
    }
    return obj;
  };
  Typr._lctf.readLangSysTable = function(data, offset) {
    var bin = Typr._bin;
    var obj = {};
    bin.readUshort(data, offset);
    offset += 2;
    obj.reqFeature = bin.readUshort(data, offset);
    offset += 2;
    var featureCount = bin.readUshort(data, offset);
    offset += 2;
    obj.features = bin.readUshorts(data, offset, featureCount);
    return obj;
  };
  Typr.CFF = {};
  Typr.CFF.parse = function(data, offset, length) {
    var bin = Typr._bin;
    data = new Uint8Array(data.buffer, offset, length);
    offset = 0;
    data[offset];
    offset++;
    data[offset];
    offset++;
    data[offset];
    offset++;
    data[offset];
    offset++;
    var ninds = [];
    offset = Typr.CFF.readIndex(data, offset, ninds);
    var names2 = [];
    for (var i = 0; i < ninds.length - 1; i++)
      names2.push(bin.readASCII(data, offset + ninds[i], ninds[i + 1] - ninds[i]));
    offset += ninds[ninds.length - 1];
    var tdinds = [];
    offset = Typr.CFF.readIndex(data, offset, tdinds);
    var topDicts = [];
    for (var i = 0; i < tdinds.length - 1; i++)
      topDicts.push(Typr.CFF.readDict(data, offset + tdinds[i], offset + tdinds[i + 1]));
    offset += tdinds[tdinds.length - 1];
    var topdict = topDicts[0];
    var sinds = [];
    offset = Typr.CFF.readIndex(data, offset, sinds);
    var strings = [];
    for (var i = 0; i < sinds.length - 1; i++)
      strings.push(bin.readASCII(data, offset + sinds[i], sinds[i + 1] - sinds[i]));
    offset += sinds[sinds.length - 1];
    Typr.CFF.readSubrs(data, offset, topdict);
    if (topdict.CharStrings) {
      offset = topdict.CharStrings;
      var sinds = [];
      offset = Typr.CFF.readIndex(data, offset, sinds);
      var cstr = [];
      for (var i = 0; i < sinds.length - 1; i++)
        cstr.push(bin.readBytes(data, offset + sinds[i], sinds[i + 1] - sinds[i]));
      topdict.CharStrings = cstr;
    }
    if (topdict.ROS) {
      offset = topdict.FDArray;
      var fdind = [];
      offset = Typr.CFF.readIndex(data, offset, fdind);
      topdict.FDArray = [];
      for (var i = 0; i < fdind.length - 1; i++) {
        var dict = Typr.CFF.readDict(data, offset + fdind[i], offset + fdind[i + 1]);
        Typr.CFF._readFDict(data, dict, strings);
        topdict.FDArray.push(dict);
      }
      offset += fdind[fdind.length - 1];
      offset = topdict.FDSelect;
      topdict.FDSelect = [];
      var fmt = data[offset];
      offset++;
      if (fmt == 3) {
        var rns = bin.readUshort(data, offset);
        offset += 2;
        for (var i = 0; i < rns + 1; i++) {
          topdict.FDSelect.push(bin.readUshort(data, offset), data[offset + 2]);
          offset += 3;
        }
      } else
        throw fmt;
    }
    if (topdict.Encoding)
      topdict.Encoding = Typr.CFF.readEncoding(data, topdict.Encoding, topdict.CharStrings.length);
    if (topdict.charset)
      topdict.charset = Typr.CFF.readCharset(data, topdict.charset, topdict.CharStrings.length);
    Typr.CFF._readFDict(data, topdict, strings);
    return topdict;
  };
  Typr.CFF._readFDict = function(data, dict, ss) {
    var offset;
    if (dict.Private) {
      offset = dict.Private[1];
      dict.Private = Typr.CFF.readDict(data, offset, offset + dict.Private[0]);
      if (dict.Private.Subrs)
        Typr.CFF.readSubrs(data, offset + dict.Private.Subrs, dict.Private);
    }
    for (var p in dict)
      if (["FamilyName", "FontName", "FullName", "Notice", "version", "Copyright"].indexOf(p) != -1)
        dict[p] = ss[dict[p] - 426 + 35];
  };
  Typr.CFF.readSubrs = function(data, offset, obj) {
    var bin = Typr._bin;
    var gsubinds = [];
    offset = Typr.CFF.readIndex(data, offset, gsubinds);
    var bias, nSubrs = gsubinds.length;
    if (nSubrs < 1240)
      bias = 107;
    else if (nSubrs < 33900)
      bias = 1131;
    else
      bias = 32768;
    obj.Bias = bias;
    obj.Subrs = [];
    for (var i = 0; i < gsubinds.length - 1; i++)
      obj.Subrs.push(bin.readBytes(data, offset + gsubinds[i], gsubinds[i + 1] - gsubinds[i]));
  };
  Typr.CFF.tableSE = [
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    11,
    12,
    13,
    14,
    15,
    16,
    17,
    18,
    19,
    20,
    21,
    22,
    23,
    24,
    25,
    26,
    27,
    28,
    29,
    30,
    31,
    32,
    33,
    34,
    35,
    36,
    37,
    38,
    39,
    40,
    41,
    42,
    43,
    44,
    45,
    46,
    47,
    48,
    49,
    50,
    51,
    52,
    53,
    54,
    55,
    56,
    57,
    58,
    59,
    60,
    61,
    62,
    63,
    64,
    65,
    66,
    67,
    68,
    69,
    70,
    71,
    72,
    73,
    74,
    75,
    76,
    77,
    78,
    79,
    80,
    81,
    82,
    83,
    84,
    85,
    86,
    87,
    88,
    89,
    90,
    91,
    92,
    93,
    94,
    95,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    96,
    97,
    98,
    99,
    100,
    101,
    102,
    103,
    104,
    105,
    106,
    107,
    108,
    109,
    110,
    0,
    111,
    112,
    113,
    114,
    0,
    115,
    116,
    117,
    118,
    119,
    120,
    121,
    122,
    0,
    123,
    0,
    124,
    125,
    126,
    127,
    128,
    129,
    130,
    131,
    0,
    132,
    133,
    0,
    134,
    135,
    136,
    137,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    138,
    0,
    139,
    0,
    0,
    0,
    0,
    140,
    141,
    142,
    143,
    0,
    0,
    0,
    0,
    0,
    144,
    0,
    0,
    0,
    145,
    0,
    0,
    146,
    147,
    148,
    149,
    0,
    0,
    0,
    0
  ];
  Typr.CFF.glyphByUnicode = function(cff, code) {
    for (var i = 0; i < cff.charset.length; i++)
      if (cff.charset[i] == code)
        return i;
    return -1;
  };
  Typr.CFF.glyphBySE = function(cff, charcode) {
    if (charcode < 0 || charcode > 255)
      return -1;
    return Typr.CFF.glyphByUnicode(cff, Typr.CFF.tableSE[charcode]);
  };
  Typr.CFF.readEncoding = function(data, offset, num) {
    Typr._bin;
    var array = [".notdef"];
    var format = data[offset];
    offset++;
    if (format == 0) {
      var nCodes = data[offset];
      offset++;
      for (var i = 0; i < nCodes; i++)
        array.push(data[offset + i]);
    } else
      throw "error: unknown encoding format: " + format;
    return array;
  };
  Typr.CFF.readCharset = function(data, offset, num) {
    var bin = Typr._bin;
    var charset = [".notdef"];
    var format = data[offset];
    offset++;
    if (format == 0) {
      for (var i = 0; i < num; i++) {
        var first = bin.readUshort(data, offset);
        offset += 2;
        charset.push(first);
      }
    } else if (format == 1 || format == 2) {
      while (charset.length < num) {
        var first = bin.readUshort(data, offset);
        offset += 2;
        var nLeft = 0;
        if (format == 1) {
          nLeft = data[offset];
          offset++;
        } else {
          nLeft = bin.readUshort(data, offset);
          offset += 2;
        }
        for (var i = 0; i <= nLeft; i++) {
          charset.push(first);
          first++;
        }
      }
    } else
      throw "error: format: " + format;
    return charset;
  };
  Typr.CFF.readIndex = function(data, offset, inds) {
    var bin = Typr._bin;
    var count = bin.readUshort(data, offset) + 1;
    offset += 2;
    var offsize = data[offset];
    offset++;
    if (offsize == 1)
      for (var i = 0; i < count; i++)
        inds.push(data[offset + i]);
    else if (offsize == 2)
      for (var i = 0; i < count; i++)
        inds.push(bin.readUshort(data, offset + i * 2));
    else if (offsize == 3)
      for (var i = 0; i < count; i++)
        inds.push(bin.readUint(data, offset + i * 3 - 1) & 16777215);
    else if (count != 1)
      throw "unsupported offset size: " + offsize + ", count: " + count;
    offset += count * offsize;
    return offset - 1;
  };
  Typr.CFF.getCharString = function(data, offset, o) {
    var bin = Typr._bin;
    var b0 = data[offset], b1 = data[offset + 1];
    data[offset + 2];
    data[offset + 3];
    data[offset + 4];
    var vs = 1;
    var op = null, val = null;
    if (b0 <= 20) {
      op = b0;
      vs = 1;
    }
    if (b0 == 12) {
      op = b0 * 100 + b1;
      vs = 2;
    }
    if (21 <= b0 && b0 <= 27) {
      op = b0;
      vs = 1;
    }
    if (b0 == 28) {
      val = bin.readShort(data, offset + 1);
      vs = 3;
    }
    if (29 <= b0 && b0 <= 31) {
      op = b0;
      vs = 1;
    }
    if (32 <= b0 && b0 <= 246) {
      val = b0 - 139;
      vs = 1;
    }
    if (247 <= b0 && b0 <= 250) {
      val = (b0 - 247) * 256 + b1 + 108;
      vs = 2;
    }
    if (251 <= b0 && b0 <= 254) {
      val = -(b0 - 251) * 256 - b1 - 108;
      vs = 2;
    }
    if (b0 == 255) {
      val = bin.readInt(data, offset + 1) / 65535;
      vs = 5;
    }
    o.val = val != null ? val : "o" + op;
    o.size = vs;
  };
  Typr.CFF.readCharString = function(data, offset, length) {
    var end = offset + length;
    var bin = Typr._bin;
    var arr = [];
    while (offset < end) {
      var b0 = data[offset], b1 = data[offset + 1];
      data[offset + 2];
      data[offset + 3];
      data[offset + 4];
      var vs = 1;
      var op = null, val = null;
      if (b0 <= 20) {
        op = b0;
        vs = 1;
      }
      if (b0 == 12) {
        op = b0 * 100 + b1;
        vs = 2;
      }
      if (b0 == 19 || b0 == 20) {
        op = b0;
        vs = 2;
      }
      if (21 <= b0 && b0 <= 27) {
        op = b0;
        vs = 1;
      }
      if (b0 == 28) {
        val = bin.readShort(data, offset + 1);
        vs = 3;
      }
      if (29 <= b0 && b0 <= 31) {
        op = b0;
        vs = 1;
      }
      if (32 <= b0 && b0 <= 246) {
        val = b0 - 139;
        vs = 1;
      }
      if (247 <= b0 && b0 <= 250) {
        val = (b0 - 247) * 256 + b1 + 108;
        vs = 2;
      }
      if (251 <= b0 && b0 <= 254) {
        val = -(b0 - 251) * 256 - b1 - 108;
        vs = 2;
      }
      if (b0 == 255) {
        val = bin.readInt(data, offset + 1) / 65535;
        vs = 5;
      }
      arr.push(val != null ? val : "o" + op);
      offset += vs;
    }
    return arr;
  };
  Typr.CFF.readDict = function(data, offset, end) {
    var bin = Typr._bin;
    var dict = {};
    var carr = [];
    while (offset < end) {
      var b0 = data[offset], b1 = data[offset + 1];
      data[offset + 2];
      data[offset + 3];
      data[offset + 4];
      var vs = 1;
      var key = null, val = null;
      if (b0 == 28) {
        val = bin.readShort(data, offset + 1);
        vs = 3;
      }
      if (b0 == 29) {
        val = bin.readInt(data, offset + 1);
        vs = 5;
      }
      if (32 <= b0 && b0 <= 246) {
        val = b0 - 139;
        vs = 1;
      }
      if (247 <= b0 && b0 <= 250) {
        val = (b0 - 247) * 256 + b1 + 108;
        vs = 2;
      }
      if (251 <= b0 && b0 <= 254) {
        val = -(b0 - 251) * 256 - b1 - 108;
        vs = 2;
      }
      if (b0 == 255) {
        val = bin.readInt(data, offset + 1) / 65535;
        vs = 5;
        throw "unknown number";
      }
      if (b0 == 30) {
        var nibs = [];
        vs = 1;
        while (true) {
          var b = data[offset + vs];
          vs++;
          var nib0 = b >> 4, nib1 = b & 15;
          if (nib0 != 15)
            nibs.push(nib0);
          if (nib1 != 15)
            nibs.push(nib1);
          if (nib1 == 15)
            break;
        }
        var s = "";
        var chars = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, ".", "e", "e-", "reserved", "-", "endOfNumber"];
        for (var i = 0; i < nibs.length; i++)
          s += chars[nibs[i]];
        val = parseFloat(s);
      }
      if (b0 <= 21) {
        var keys = [
          "version",
          "Notice",
          "FullName",
          "FamilyName",
          "Weight",
          "FontBBox",
          "BlueValues",
          "OtherBlues",
          "FamilyBlues",
          "FamilyOtherBlues",
          "StdHW",
          "StdVW",
          "escape",
          "UniqueID",
          "XUID",
          "charset",
          "Encoding",
          "CharStrings",
          "Private",
          "Subrs",
          "defaultWidthX",
          "nominalWidthX"
        ];
        key = keys[b0];
        vs = 1;
        if (b0 == 12) {
          var keys = [
            "Copyright",
            "isFixedPitch",
            "ItalicAngle",
            "UnderlinePosition",
            "UnderlineThickness",
            "PaintType",
            "CharstringType",
            "FontMatrix",
            "StrokeWidth",
            "BlueScale",
            "BlueShift",
            "BlueFuzz",
            "StemSnapH",
            "StemSnapV",
            "ForceBold",
            0,
            0,
            "LanguageGroup",
            "ExpansionFactor",
            "initialRandomSeed",
            "SyntheticBase",
            "PostScript",
            "BaseFontName",
            "BaseFontBlend",
            0,
            0,
            0,
            0,
            0,
            0,
            "ROS",
            "CIDFontVersion",
            "CIDFontRevision",
            "CIDFontType",
            "CIDCount",
            "UIDBase",
            "FDArray",
            "FDSelect",
            "FontName"
          ];
          key = keys[b1];
          vs = 2;
        }
      }
      if (key != null) {
        dict[key] = carr.length == 1 ? carr[0] : carr;
        carr = [];
      } else
        carr.push(val);
      offset += vs;
    }
    return dict;
  };
  Typr.cmap = {};
  Typr.cmap.parse = function(data, offset, length) {
    data = new Uint8Array(data.buffer, offset, length);
    offset = 0;
    var bin = Typr._bin;
    var obj = {};
    bin.readUshort(data, offset);
    offset += 2;
    var numTables = bin.readUshort(data, offset);
    offset += 2;
    var offs = [];
    obj.tables = [];
    for (var i = 0; i < numTables; i++) {
      var platformID = bin.readUshort(data, offset);
      offset += 2;
      var encodingID = bin.readUshort(data, offset);
      offset += 2;
      var noffset = bin.readUint(data, offset);
      offset += 4;
      var id = "p" + platformID + "e" + encodingID;
      var tind = offs.indexOf(noffset);
      if (tind == -1) {
        tind = obj.tables.length;
        var subt;
        offs.push(noffset);
        var format = bin.readUshort(data, noffset);
        if (format == 0)
          subt = Typr.cmap.parse0(data, noffset);
        else if (format == 4)
          subt = Typr.cmap.parse4(data, noffset);
        else if (format == 6)
          subt = Typr.cmap.parse6(data, noffset);
        else if (format == 12)
          subt = Typr.cmap.parse12(data, noffset);
        else
          console.warn("unknown format: " + format, platformID, encodingID, noffset);
        obj.tables.push(subt);
      }
      if (obj[id] != null)
        throw "multiple tables for one platform+encoding";
      obj[id] = tind;
    }
    return obj;
  };
  Typr.cmap.parse0 = function(data, offset) {
    var bin = Typr._bin;
    var obj = {};
    obj.format = bin.readUshort(data, offset);
    offset += 2;
    var len = bin.readUshort(data, offset);
    offset += 2;
    bin.readUshort(data, offset);
    offset += 2;
    obj.map = [];
    for (var i = 0; i < len - 6; i++)
      obj.map.push(data[offset + i]);
    return obj;
  };
  Typr.cmap.parse4 = function(data, offset) {
    var bin = Typr._bin;
    var offset0 = offset;
    var obj = {};
    obj.format = bin.readUshort(data, offset);
    offset += 2;
    var length = bin.readUshort(data, offset);
    offset += 2;
    bin.readUshort(data, offset);
    offset += 2;
    var segCountX2 = bin.readUshort(data, offset);
    offset += 2;
    var segCount = segCountX2 / 2;
    obj.searchRange = bin.readUshort(data, offset);
    offset += 2;
    obj.entrySelector = bin.readUshort(data, offset);
    offset += 2;
    obj.rangeShift = bin.readUshort(data, offset);
    offset += 2;
    obj.endCount = bin.readUshorts(data, offset, segCount);
    offset += segCount * 2;
    offset += 2;
    obj.startCount = bin.readUshorts(data, offset, segCount);
    offset += segCount * 2;
    obj.idDelta = [];
    for (var i = 0; i < segCount; i++) {
      obj.idDelta.push(bin.readShort(data, offset));
      offset += 2;
    }
    obj.idRangeOffset = bin.readUshorts(data, offset, segCount);
    offset += segCount * 2;
    obj.glyphIdArray = [];
    while (offset < offset0 + length) {
      obj.glyphIdArray.push(bin.readUshort(data, offset));
      offset += 2;
    }
    return obj;
  };
  Typr.cmap.parse6 = function(data, offset) {
    var bin = Typr._bin;
    var obj = {};
    obj.format = bin.readUshort(data, offset);
    offset += 2;
    bin.readUshort(data, offset);
    offset += 2;
    bin.readUshort(data, offset);
    offset += 2;
    obj.firstCode = bin.readUshort(data, offset);
    offset += 2;
    var entryCount = bin.readUshort(data, offset);
    offset += 2;
    obj.glyphIdArray = [];
    for (var i = 0; i < entryCount; i++) {
      obj.glyphIdArray.push(bin.readUshort(data, offset));
      offset += 2;
    }
    return obj;
  };
  Typr.cmap.parse12 = function(data, offset) {
    var bin = Typr._bin;
    var obj = {};
    obj.format = bin.readUshort(data, offset);
    offset += 2;
    offset += 2;
    bin.readUint(data, offset);
    offset += 4;
    bin.readUint(data, offset);
    offset += 4;
    var nGroups = bin.readUint(data, offset);
    offset += 4;
    obj.groups = [];
    for (var i = 0; i < nGroups; i++) {
      var off = offset + i * 12;
      var startCharCode = bin.readUint(data, off + 0);
      var endCharCode = bin.readUint(data, off + 4);
      var startGlyphID = bin.readUint(data, off + 8);
      obj.groups.push([startCharCode, endCharCode, startGlyphID]);
    }
    return obj;
  };
  Typr.glyf = {};
  Typr.glyf.parse = function(data, offset, length, font) {
    var obj = [];
    for (var g = 0; g < font.maxp.numGlyphs; g++)
      obj.push(null);
    return obj;
  };
  Typr.glyf._parseGlyf = function(font, g) {
    var bin = Typr._bin;
    var data = font._data;
    var offset = Typr._tabOffset(data, "glyf", font._offset) + font.loca[g];
    if (font.loca[g] == font.loca[g + 1])
      return null;
    var gl = {};
    gl.noc = bin.readShort(data, offset);
    offset += 2;
    gl.xMin = bin.readShort(data, offset);
    offset += 2;
    gl.yMin = bin.readShort(data, offset);
    offset += 2;
    gl.xMax = bin.readShort(data, offset);
    offset += 2;
    gl.yMax = bin.readShort(data, offset);
    offset += 2;
    if (gl.xMin >= gl.xMax || gl.yMin >= gl.yMax)
      return null;
    if (gl.noc > 0) {
      gl.endPts = [];
      for (var i = 0; i < gl.noc; i++) {
        gl.endPts.push(bin.readUshort(data, offset));
        offset += 2;
      }
      var instructionLength = bin.readUshort(data, offset);
      offset += 2;
      if (data.length - offset < instructionLength)
        return null;
      gl.instructions = bin.readBytes(data, offset, instructionLength);
      offset += instructionLength;
      var crdnum = gl.endPts[gl.noc - 1] + 1;
      gl.flags = [];
      for (var i = 0; i < crdnum; i++) {
        var flag = data[offset];
        offset++;
        gl.flags.push(flag);
        if ((flag & 8) != 0) {
          var rep = data[offset];
          offset++;
          for (var j = 0; j < rep; j++) {
            gl.flags.push(flag);
            i++;
          }
        }
      }
      gl.xs = [];
      for (var i = 0; i < crdnum; i++) {
        var i8 = (gl.flags[i] & 2) != 0, same = (gl.flags[i] & 16) != 0;
        if (i8) {
          gl.xs.push(same ? data[offset] : -data[offset]);
          offset++;
        } else {
          if (same)
            gl.xs.push(0);
          else {
            gl.xs.push(bin.readShort(data, offset));
            offset += 2;
          }
        }
      }
      gl.ys = [];
      for (var i = 0; i < crdnum; i++) {
        var i8 = (gl.flags[i] & 4) != 0, same = (gl.flags[i] & 32) != 0;
        if (i8) {
          gl.ys.push(same ? data[offset] : -data[offset]);
          offset++;
        } else {
          if (same)
            gl.ys.push(0);
          else {
            gl.ys.push(bin.readShort(data, offset));
            offset += 2;
          }
        }
      }
      var x = 0, y = 0;
      for (var i = 0; i < crdnum; i++) {
        x += gl.xs[i];
        y += gl.ys[i];
        gl.xs[i] = x;
        gl.ys[i] = y;
      }
    } else {
      var ARG_1_AND_2_ARE_WORDS = 1 << 0;
      var ARGS_ARE_XY_VALUES = 1 << 1;
      var WE_HAVE_A_SCALE = 1 << 3;
      var MORE_COMPONENTS = 1 << 5;
      var WE_HAVE_AN_X_AND_Y_SCALE = 1 << 6;
      var WE_HAVE_A_TWO_BY_TWO = 1 << 7;
      var WE_HAVE_INSTRUCTIONS = 1 << 8;
      gl.parts = [];
      var flags;
      do {
        flags = bin.readUshort(data, offset);
        offset += 2;
        var part = { m: { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 }, p1: -1, p2: -1 };
        gl.parts.push(part);
        part.glyphIndex = bin.readUshort(data, offset);
        offset += 2;
        if (flags & ARG_1_AND_2_ARE_WORDS) {
          var arg1 = bin.readShort(data, offset);
          offset += 2;
          var arg2 = bin.readShort(data, offset);
          offset += 2;
        } else {
          var arg1 = bin.readInt8(data, offset);
          offset++;
          var arg2 = bin.readInt8(data, offset);
          offset++;
        }
        if (flags & ARGS_ARE_XY_VALUES) {
          part.m.tx = arg1;
          part.m.ty = arg2;
        } else {
          part.p1 = arg1;
          part.p2 = arg2;
        }
        if (flags & WE_HAVE_A_SCALE) {
          part.m.a = part.m.d = bin.readF2dot14(data, offset);
          offset += 2;
        } else if (flags & WE_HAVE_AN_X_AND_Y_SCALE) {
          part.m.a = bin.readF2dot14(data, offset);
          offset += 2;
          part.m.d = bin.readF2dot14(data, offset);
          offset += 2;
        } else if (flags & WE_HAVE_A_TWO_BY_TWO) {
          part.m.a = bin.readF2dot14(data, offset);
          offset += 2;
          part.m.b = bin.readF2dot14(data, offset);
          offset += 2;
          part.m.c = bin.readF2dot14(data, offset);
          offset += 2;
          part.m.d = bin.readF2dot14(data, offset);
          offset += 2;
        }
      } while (flags & MORE_COMPONENTS);
      if (flags & WE_HAVE_INSTRUCTIONS) {
        var numInstr = bin.readUshort(data, offset);
        offset += 2;
        gl.instr = [];
        for (var i = 0; i < numInstr; i++) {
          gl.instr.push(data[offset]);
          offset++;
        }
      }
    }
    return gl;
  };
  Typr.GPOS = {};
  Typr.GPOS.parse = function(data, offset, length, font) {
    return Typr._lctf.parse(data, offset, length, font, Typr.GPOS.subt);
  };
  Typr.GPOS.subt = function(data, ltype, offset, ltable) {
    var bin = Typr._bin, offset0 = offset, tab = {};
    tab.fmt = bin.readUshort(data, offset);
    offset += 2;
    if (ltype == 1 || ltype == 2 || ltype == 3 || ltype == 7 || ltype == 8 && tab.fmt <= 2) {
      var covOff = bin.readUshort(data, offset);
      offset += 2;
      tab.coverage = Typr._lctf.readCoverage(data, covOff + offset0);
    }
    if (ltype == 1 && tab.fmt == 1) {
      var valFmt1 = bin.readUshort(data, offset);
      offset += 2;
      var ones1 = Typr._lctf.numOfOnes(valFmt1);
      if (valFmt1 != 0)
        tab.pos = Typr.GPOS.readValueRecord(data, offset, valFmt1);
    } else if (ltype == 2 && tab.fmt >= 1 && tab.fmt <= 2) {
      var valFmt1 = bin.readUshort(data, offset);
      offset += 2;
      var valFmt2 = bin.readUshort(data, offset);
      offset += 2;
      var ones1 = Typr._lctf.numOfOnes(valFmt1);
      var ones2 = Typr._lctf.numOfOnes(valFmt2);
      if (tab.fmt == 1) {
        tab.pairsets = [];
        var psc = bin.readUshort(data, offset);
        offset += 2;
        for (var i = 0; i < psc; i++) {
          var psoff = offset0 + bin.readUshort(data, offset);
          offset += 2;
          var pvc = bin.readUshort(data, psoff);
          psoff += 2;
          var arr = [];
          for (var j = 0; j < pvc; j++) {
            var gid2 = bin.readUshort(data, psoff);
            psoff += 2;
            var value1, value2;
            if (valFmt1 != 0) {
              value1 = Typr.GPOS.readValueRecord(data, psoff, valFmt1);
              psoff += ones1 * 2;
            }
            if (valFmt2 != 0) {
              value2 = Typr.GPOS.readValueRecord(data, psoff, valFmt2);
              psoff += ones2 * 2;
            }
            arr.push({ gid2, val1: value1, val2: value2 });
          }
          tab.pairsets.push(arr);
        }
      }
      if (tab.fmt == 2) {
        var classDef1 = bin.readUshort(data, offset);
        offset += 2;
        var classDef2 = bin.readUshort(data, offset);
        offset += 2;
        var class1Count = bin.readUshort(data, offset);
        offset += 2;
        var class2Count = bin.readUshort(data, offset);
        offset += 2;
        tab.classDef1 = Typr._lctf.readClassDef(data, offset0 + classDef1);
        tab.classDef2 = Typr._lctf.readClassDef(data, offset0 + classDef2);
        tab.matrix = [];
        for (var i = 0; i < class1Count; i++) {
          var row = [];
          for (var j = 0; j < class2Count; j++) {
            var value1 = null, value2 = null;
            if (valFmt1 != 0) {
              value1 = Typr.GPOS.readValueRecord(data, offset, valFmt1);
              offset += ones1 * 2;
            }
            if (valFmt2 != 0) {
              value2 = Typr.GPOS.readValueRecord(data, offset, valFmt2);
              offset += ones2 * 2;
            }
            row.push({ val1: value1, val2: value2 });
          }
          tab.matrix.push(row);
        }
      }
    } else if (ltype == 9 && tab.fmt == 1) {
      var extType = bin.readUshort(data, offset);
      offset += 2;
      var extOffset = bin.readUint(data, offset);
      offset += 4;
      if (ltable.ltype == 9) {
        ltable.ltype = extType;
      } else if (ltable.ltype != extType) {
        throw "invalid extension substitution";
      }
      return Typr.GPOS.subt(data, ltable.ltype, offset0 + extOffset);
    } else
      console.warn("unsupported GPOS table LookupType", ltype, "format", tab.fmt);
    return tab;
  };
  Typr.GPOS.readValueRecord = function(data, offset, valFmt) {
    var bin = Typr._bin;
    var arr = [];
    arr.push(valFmt & 1 ? bin.readShort(data, offset) : 0);
    offset += valFmt & 1 ? 2 : 0;
    arr.push(valFmt & 2 ? bin.readShort(data, offset) : 0);
    offset += valFmt & 2 ? 2 : 0;
    arr.push(valFmt & 4 ? bin.readShort(data, offset) : 0);
    offset += valFmt & 4 ? 2 : 0;
    arr.push(valFmt & 8 ? bin.readShort(data, offset) : 0);
    offset += valFmt & 8 ? 2 : 0;
    return arr;
  };
  Typr.GSUB = {};
  Typr.GSUB.parse = function(data, offset, length, font) {
    return Typr._lctf.parse(data, offset, length, font, Typr.GSUB.subt);
  };
  Typr.GSUB.subt = function(data, ltype, offset, ltable) {
    var bin = Typr._bin, offset0 = offset, tab = {};
    tab.fmt = bin.readUshort(data, offset);
    offset += 2;
    if (ltype != 1 && ltype != 4 && ltype != 5 && ltype != 6)
      return null;
    if (ltype == 1 || ltype == 4 || ltype == 5 && tab.fmt <= 2 || ltype == 6 && tab.fmt <= 2) {
      var covOff = bin.readUshort(data, offset);
      offset += 2;
      tab.coverage = Typr._lctf.readCoverage(data, offset0 + covOff);
    }
    if (ltype == 1 && tab.fmt >= 1 && tab.fmt <= 2) {
      if (tab.fmt == 1) {
        tab.delta = bin.readShort(data, offset);
        offset += 2;
      } else if (tab.fmt == 2) {
        var cnt = bin.readUshort(data, offset);
        offset += 2;
        tab.newg = bin.readUshorts(data, offset, cnt);
        offset += tab.newg.length * 2;
      }
    } else if (ltype == 4) {
      tab.vals = [];
      var cnt = bin.readUshort(data, offset);
      offset += 2;
      for (var i = 0; i < cnt; i++) {
        var loff = bin.readUshort(data, offset);
        offset += 2;
        tab.vals.push(Typr.GSUB.readLigatureSet(data, offset0 + loff));
      }
    } else if (ltype == 5 && tab.fmt == 2) {
      if (tab.fmt == 2) {
        var cDefOffset = bin.readUshort(data, offset);
        offset += 2;
        tab.cDef = Typr._lctf.readClassDef(data, offset0 + cDefOffset);
        tab.scset = [];
        var subClassSetCount = bin.readUshort(data, offset);
        offset += 2;
        for (var i = 0; i < subClassSetCount; i++) {
          var scsOff = bin.readUshort(data, offset);
          offset += 2;
          tab.scset.push(scsOff == 0 ? null : Typr.GSUB.readSubClassSet(data, offset0 + scsOff));
        }
      }
    } else if (ltype == 6 && tab.fmt == 3) {
      if (tab.fmt == 3) {
        for (var i = 0; i < 3; i++) {
          var cnt = bin.readUshort(data, offset);
          offset += 2;
          var cvgs = [];
          for (var j = 0; j < cnt; j++)
            cvgs.push(Typr._lctf.readCoverage(data, offset0 + bin.readUshort(data, offset + j * 2)));
          offset += cnt * 2;
          if (i == 0)
            tab.backCvg = cvgs;
          if (i == 1)
            tab.inptCvg = cvgs;
          if (i == 2)
            tab.ahedCvg = cvgs;
        }
        var cnt = bin.readUshort(data, offset);
        offset += 2;
        tab.lookupRec = Typr.GSUB.readSubstLookupRecords(data, offset, cnt);
      }
    } else if (ltype == 7 && tab.fmt == 1) {
      var extType = bin.readUshort(data, offset);
      offset += 2;
      var extOffset = bin.readUint(data, offset);
      offset += 4;
      if (ltable.ltype == 9) {
        ltable.ltype = extType;
      } else if (ltable.ltype != extType) {
        throw "invalid extension substitution";
      }
      return Typr.GSUB.subt(data, ltable.ltype, offset0 + extOffset);
    } else
      console.warn("unsupported GSUB table LookupType", ltype, "format", tab.fmt);
    return tab;
  };
  Typr.GSUB.readSubClassSet = function(data, offset) {
    var rUs = Typr._bin.readUshort, offset0 = offset, lset = [];
    var cnt = rUs(data, offset);
    offset += 2;
    for (var i = 0; i < cnt; i++) {
      var loff = rUs(data, offset);
      offset += 2;
      lset.push(Typr.GSUB.readSubClassRule(data, offset0 + loff));
    }
    return lset;
  };
  Typr.GSUB.readSubClassRule = function(data, offset) {
    var rUs = Typr._bin.readUshort, rule = {};
    var gcount = rUs(data, offset);
    offset += 2;
    var scount = rUs(data, offset);
    offset += 2;
    rule.input = [];
    for (var i = 0; i < gcount - 1; i++) {
      rule.input.push(rUs(data, offset));
      offset += 2;
    }
    rule.substLookupRecords = Typr.GSUB.readSubstLookupRecords(data, offset, scount);
    return rule;
  };
  Typr.GSUB.readSubstLookupRecords = function(data, offset, cnt) {
    var rUs = Typr._bin.readUshort;
    var out = [];
    for (var i = 0; i < cnt; i++) {
      out.push(rUs(data, offset), rUs(data, offset + 2));
      offset += 4;
    }
    return out;
  };
  Typr.GSUB.readChainSubClassSet = function(data, offset) {
    var bin = Typr._bin, offset0 = offset, lset = [];
    var cnt = bin.readUshort(data, offset);
    offset += 2;
    for (var i = 0; i < cnt; i++) {
      var loff = bin.readUshort(data, offset);
      offset += 2;
      lset.push(Typr.GSUB.readChainSubClassRule(data, offset0 + loff));
    }
    return lset;
  };
  Typr.GSUB.readChainSubClassRule = function(data, offset) {
    var bin = Typr._bin, rule = {};
    var pps = ["backtrack", "input", "lookahead"];
    for (var pi = 0; pi < pps.length; pi++) {
      var cnt = bin.readUshort(data, offset);
      offset += 2;
      if (pi == 1)
        cnt--;
      rule[pps[pi]] = bin.readUshorts(data, offset, cnt);
      offset += rule[pps[pi]].length * 2;
    }
    var cnt = bin.readUshort(data, offset);
    offset += 2;
    rule.subst = bin.readUshorts(data, offset, cnt * 2);
    offset += rule.subst.length * 2;
    return rule;
  };
  Typr.GSUB.readLigatureSet = function(data, offset) {
    var bin = Typr._bin, offset0 = offset, lset = [];
    var lcnt = bin.readUshort(data, offset);
    offset += 2;
    for (var j = 0; j < lcnt; j++) {
      var loff = bin.readUshort(data, offset);
      offset += 2;
      lset.push(Typr.GSUB.readLigature(data, offset0 + loff));
    }
    return lset;
  };
  Typr.GSUB.readLigature = function(data, offset) {
    var bin = Typr._bin, lig = { chain: [] };
    lig.nglyph = bin.readUshort(data, offset);
    offset += 2;
    var ccnt = bin.readUshort(data, offset);
    offset += 2;
    for (var k = 0; k < ccnt - 1; k++) {
      lig.chain.push(bin.readUshort(data, offset));
      offset += 2;
    }
    return lig;
  };
  Typr.head = {};
  Typr.head.parse = function(data, offset, length) {
    var bin = Typr._bin;
    var obj = {};
    bin.readFixed(data, offset);
    offset += 4;
    obj.fontRevision = bin.readFixed(data, offset);
    offset += 4;
    bin.readUint(data, offset);
    offset += 4;
    bin.readUint(data, offset);
    offset += 4;
    obj.flags = bin.readUshort(data, offset);
    offset += 2;
    obj.unitsPerEm = bin.readUshort(data, offset);
    offset += 2;
    obj.created = bin.readUint64(data, offset);
    offset += 8;
    obj.modified = bin.readUint64(data, offset);
    offset += 8;
    obj.xMin = bin.readShort(data, offset);
    offset += 2;
    obj.yMin = bin.readShort(data, offset);
    offset += 2;
    obj.xMax = bin.readShort(data, offset);
    offset += 2;
    obj.yMax = bin.readShort(data, offset);
    offset += 2;
    obj.macStyle = bin.readUshort(data, offset);
    offset += 2;
    obj.lowestRecPPEM = bin.readUshort(data, offset);
    offset += 2;
    obj.fontDirectionHint = bin.readShort(data, offset);
    offset += 2;
    obj.indexToLocFormat = bin.readShort(data, offset);
    offset += 2;
    obj.glyphDataFormat = bin.readShort(data, offset);
    offset += 2;
    return obj;
  };
  Typr.hhea = {};
  Typr.hhea.parse = function(data, offset, length) {
    var bin = Typr._bin;
    var obj = {};
    bin.readFixed(data, offset);
    offset += 4;
    obj.ascender = bin.readShort(data, offset);
    offset += 2;
    obj.descender = bin.readShort(data, offset);
    offset += 2;
    obj.lineGap = bin.readShort(data, offset);
    offset += 2;
    obj.advanceWidthMax = bin.readUshort(data, offset);
    offset += 2;
    obj.minLeftSideBearing = bin.readShort(data, offset);
    offset += 2;
    obj.minRightSideBearing = bin.readShort(data, offset);
    offset += 2;
    obj.xMaxExtent = bin.readShort(data, offset);
    offset += 2;
    obj.caretSlopeRise = bin.readShort(data, offset);
    offset += 2;
    obj.caretSlopeRun = bin.readShort(data, offset);
    offset += 2;
    obj.caretOffset = bin.readShort(data, offset);
    offset += 2;
    offset += 4 * 2;
    obj.metricDataFormat = bin.readShort(data, offset);
    offset += 2;
    obj.numberOfHMetrics = bin.readUshort(data, offset);
    offset += 2;
    return obj;
  };
  Typr.hmtx = {};
  Typr.hmtx.parse = function(data, offset, length, font) {
    var bin = Typr._bin;
    var obj = {};
    obj.aWidth = [];
    obj.lsBearing = [];
    var aw = 0, lsb = 0;
    for (var i = 0; i < font.maxp.numGlyphs; i++) {
      if (i < font.hhea.numberOfHMetrics) {
        aw = bin.readUshort(data, offset);
        offset += 2;
        lsb = bin.readShort(data, offset);
        offset += 2;
      }
      obj.aWidth.push(aw);
      obj.lsBearing.push(lsb);
    }
    return obj;
  };
  Typr.kern = {};
  Typr.kern.parse = function(data, offset, length, font) {
    var bin = Typr._bin;
    var version = bin.readUshort(data, offset);
    offset += 2;
    if (version == 1)
      return Typr.kern.parseV1(data, offset - 2, length, font);
    var nTables = bin.readUshort(data, offset);
    offset += 2;
    var map2 = { glyph1: [], rval: [] };
    for (var i = 0; i < nTables; i++) {
      offset += 2;
      var length = bin.readUshort(data, offset);
      offset += 2;
      var coverage = bin.readUshort(data, offset);
      offset += 2;
      var format = coverage >>> 8;
      format &= 15;
      if (format == 0)
        offset = Typr.kern.readFormat0(data, offset, map2);
      else
        throw "unknown kern table format: " + format;
    }
    return map2;
  };
  Typr.kern.parseV1 = function(data, offset, length, font) {
    var bin = Typr._bin;
    bin.readFixed(data, offset);
    offset += 4;
    var nTables = bin.readUint(data, offset);
    offset += 4;
    var map2 = { glyph1: [], rval: [] };
    for (var i = 0; i < nTables; i++) {
      bin.readUint(data, offset);
      offset += 4;
      var coverage = bin.readUshort(data, offset);
      offset += 2;
      bin.readUshort(data, offset);
      offset += 2;
      var format = coverage >>> 8;
      format &= 15;
      if (format == 0)
        offset = Typr.kern.readFormat0(data, offset, map2);
      else
        throw "unknown kern table format: " + format;
    }
    return map2;
  };
  Typr.kern.readFormat0 = function(data, offset, map2) {
    var bin = Typr._bin;
    var pleft = -1;
    var nPairs = bin.readUshort(data, offset);
    offset += 2;
    bin.readUshort(data, offset);
    offset += 2;
    bin.readUshort(data, offset);
    offset += 2;
    bin.readUshort(data, offset);
    offset += 2;
    for (var j = 0; j < nPairs; j++) {
      var left = bin.readUshort(data, offset);
      offset += 2;
      var right = bin.readUshort(data, offset);
      offset += 2;
      var value = bin.readShort(data, offset);
      offset += 2;
      if (left != pleft) {
        map2.glyph1.push(left);
        map2.rval.push({ glyph2: [], vals: [] });
      }
      var rval = map2.rval[map2.rval.length - 1];
      rval.glyph2.push(right);
      rval.vals.push(value);
      pleft = left;
    }
    return offset;
  };
  Typr.loca = {};
  Typr.loca.parse = function(data, offset, length, font) {
    var bin = Typr._bin;
    var obj = [];
    var ver = font.head.indexToLocFormat;
    var len = font.maxp.numGlyphs + 1;
    if (ver == 0)
      for (var i = 0; i < len; i++)
        obj.push(bin.readUshort(data, offset + (i << 1)) << 1);
    if (ver == 1)
      for (var i = 0; i < len; i++)
        obj.push(bin.readUint(data, offset + (i << 2)));
    return obj;
  };
  Typr.maxp = {};
  Typr.maxp.parse = function(data, offset, length) {
    var bin = Typr._bin;
    var obj = {};
    var ver = bin.readUint(data, offset);
    offset += 4;
    obj.numGlyphs = bin.readUshort(data, offset);
    offset += 2;
    if (ver == 65536) {
      obj.maxPoints = bin.readUshort(data, offset);
      offset += 2;
      obj.maxContours = bin.readUshort(data, offset);
      offset += 2;
      obj.maxCompositePoints = bin.readUshort(data, offset);
      offset += 2;
      obj.maxCompositeContours = bin.readUshort(data, offset);
      offset += 2;
      obj.maxZones = bin.readUshort(data, offset);
      offset += 2;
      obj.maxTwilightPoints = bin.readUshort(data, offset);
      offset += 2;
      obj.maxStorage = bin.readUshort(data, offset);
      offset += 2;
      obj.maxFunctionDefs = bin.readUshort(data, offset);
      offset += 2;
      obj.maxInstructionDefs = bin.readUshort(data, offset);
      offset += 2;
      obj.maxStackElements = bin.readUshort(data, offset);
      offset += 2;
      obj.maxSizeOfInstructions = bin.readUshort(data, offset);
      offset += 2;
      obj.maxComponentElements = bin.readUshort(data, offset);
      offset += 2;
      obj.maxComponentDepth = bin.readUshort(data, offset);
      offset += 2;
    }
    return obj;
  };
  Typr.name = {};
  Typr.name.parse = function(data, offset, length) {
    var bin = Typr._bin;
    var obj = {};
    bin.readUshort(data, offset);
    offset += 2;
    var count = bin.readUshort(data, offset);
    offset += 2;
    bin.readUshort(data, offset);
    offset += 2;
    var names2 = [
      "copyright",
      "fontFamily",
      "fontSubfamily",
      "ID",
      "fullName",
      "version",
      "postScriptName",
      "trademark",
      "manufacturer",
      "designer",
      "description",
      "urlVendor",
      "urlDesigner",
      "licence",
      "licenceURL",
      "---",
      "typoFamilyName",
      "typoSubfamilyName",
      "compatibleFull",
      "sampleText",
      "postScriptCID",
      "wwsFamilyName",
      "wwsSubfamilyName",
      "lightPalette",
      "darkPalette"
    ];
    var offset0 = offset;
    for (var i = 0; i < count; i++) {
      var platformID = bin.readUshort(data, offset);
      offset += 2;
      var encodingID = bin.readUshort(data, offset);
      offset += 2;
      var languageID = bin.readUshort(data, offset);
      offset += 2;
      var nameID = bin.readUshort(data, offset);
      offset += 2;
      var slen = bin.readUshort(data, offset);
      offset += 2;
      var noffset = bin.readUshort(data, offset);
      offset += 2;
      var cname = names2[nameID];
      var soff = offset0 + count * 12 + noffset;
      var str;
      if (platformID == 0)
        str = bin.readUnicode(data, soff, slen / 2);
      else if (platformID == 3 && encodingID == 0)
        str = bin.readUnicode(data, soff, slen / 2);
      else if (encodingID == 0)
        str = bin.readASCII(data, soff, slen);
      else if (encodingID == 1)
        str = bin.readUnicode(data, soff, slen / 2);
      else if (encodingID == 3)
        str = bin.readUnicode(data, soff, slen / 2);
      else if (platformID == 1) {
        str = bin.readASCII(data, soff, slen);
        console.warn("reading unknown MAC encoding " + encodingID + " as ASCII");
      } else
        throw "unknown encoding " + encodingID + ", platformID: " + platformID;
      var tid = "p" + platformID + "," + languageID.toString(16);
      if (obj[tid] == null)
        obj[tid] = {};
      obj[tid][cname !== void 0 ? cname : nameID] = str;
      obj[tid]._lang = languageID;
    }
    for (var p in obj)
      if (obj[p].postScriptName != null && obj[p]._lang == 1033)
        return obj[p];
    for (var p in obj)
      if (obj[p].postScriptName != null && obj[p]._lang == 0)
        return obj[p];
    for (var p in obj)
      if (obj[p].postScriptName != null && obj[p]._lang == 3084)
        return obj[p];
    for (var p in obj)
      if (obj[p].postScriptName != null)
        return obj[p];
    var tname;
    for (var p in obj) {
      tname = p;
      break;
    }
    console.warn("returning name table with languageID " + obj[tname]._lang);
    return obj[tname];
  };
  Typr["OS/2"] = {};
  Typr["OS/2"].parse = function(data, offset, length) {
    var bin = Typr._bin;
    var ver = bin.readUshort(data, offset);
    offset += 2;
    var obj = {};
    if (ver == 0)
      Typr["OS/2"].version0(data, offset, obj);
    else if (ver == 1)
      Typr["OS/2"].version1(data, offset, obj);
    else if (ver == 2 || ver == 3 || ver == 4)
      Typr["OS/2"].version2(data, offset, obj);
    else if (ver == 5)
      Typr["OS/2"].version5(data, offset, obj);
    else
      throw "unknown OS/2 table version: " + ver;
    return obj;
  };
  Typr["OS/2"].version0 = function(data, offset, obj) {
    var bin = Typr._bin;
    obj.xAvgCharWidth = bin.readShort(data, offset);
    offset += 2;
    obj.usWeightClass = bin.readUshort(data, offset);
    offset += 2;
    obj.usWidthClass = bin.readUshort(data, offset);
    offset += 2;
    obj.fsType = bin.readUshort(data, offset);
    offset += 2;
    obj.ySubscriptXSize = bin.readShort(data, offset);
    offset += 2;
    obj.ySubscriptYSize = bin.readShort(data, offset);
    offset += 2;
    obj.ySubscriptXOffset = bin.readShort(data, offset);
    offset += 2;
    obj.ySubscriptYOffset = bin.readShort(data, offset);
    offset += 2;
    obj.ySuperscriptXSize = bin.readShort(data, offset);
    offset += 2;
    obj.ySuperscriptYSize = bin.readShort(data, offset);
    offset += 2;
    obj.ySuperscriptXOffset = bin.readShort(data, offset);
    offset += 2;
    obj.ySuperscriptYOffset = bin.readShort(data, offset);
    offset += 2;
    obj.yStrikeoutSize = bin.readShort(data, offset);
    offset += 2;
    obj.yStrikeoutPosition = bin.readShort(data, offset);
    offset += 2;
    obj.sFamilyClass = bin.readShort(data, offset);
    offset += 2;
    obj.panose = bin.readBytes(data, offset, 10);
    offset += 10;
    obj.ulUnicodeRange1 = bin.readUint(data, offset);
    offset += 4;
    obj.ulUnicodeRange2 = bin.readUint(data, offset);
    offset += 4;
    obj.ulUnicodeRange3 = bin.readUint(data, offset);
    offset += 4;
    obj.ulUnicodeRange4 = bin.readUint(data, offset);
    offset += 4;
    obj.achVendID = [bin.readInt8(data, offset), bin.readInt8(data, offset + 1), bin.readInt8(data, offset + 2), bin.readInt8(data, offset + 3)];
    offset += 4;
    obj.fsSelection = bin.readUshort(data, offset);
    offset += 2;
    obj.usFirstCharIndex = bin.readUshort(data, offset);
    offset += 2;
    obj.usLastCharIndex = bin.readUshort(data, offset);
    offset += 2;
    obj.sTypoAscender = bin.readShort(data, offset);
    offset += 2;
    obj.sTypoDescender = bin.readShort(data, offset);
    offset += 2;
    obj.sTypoLineGap = bin.readShort(data, offset);
    offset += 2;
    obj.usWinAscent = bin.readUshort(data, offset);
    offset += 2;
    obj.usWinDescent = bin.readUshort(data, offset);
    offset += 2;
    return offset;
  };
  Typr["OS/2"].version1 = function(data, offset, obj) {
    var bin = Typr._bin;
    offset = Typr["OS/2"].version0(data, offset, obj);
    obj.ulCodePageRange1 = bin.readUint(data, offset);
    offset += 4;
    obj.ulCodePageRange2 = bin.readUint(data, offset);
    offset += 4;
    return offset;
  };
  Typr["OS/2"].version2 = function(data, offset, obj) {
    var bin = Typr._bin;
    offset = Typr["OS/2"].version1(data, offset, obj);
    obj.sxHeight = bin.readShort(data, offset);
    offset += 2;
    obj.sCapHeight = bin.readShort(data, offset);
    offset += 2;
    obj.usDefault = bin.readUshort(data, offset);
    offset += 2;
    obj.usBreak = bin.readUshort(data, offset);
    offset += 2;
    obj.usMaxContext = bin.readUshort(data, offset);
    offset += 2;
    return offset;
  };
  Typr["OS/2"].version5 = function(data, offset, obj) {
    var bin = Typr._bin;
    offset = Typr["OS/2"].version2(data, offset, obj);
    obj.usLowerOpticalPointSize = bin.readUshort(data, offset);
    offset += 2;
    obj.usUpperOpticalPointSize = bin.readUshort(data, offset);
    offset += 2;
    return offset;
  };
  Typr.post = {};
  Typr.post.parse = function(data, offset, length) {
    var bin = Typr._bin;
    var obj = {};
    obj.version = bin.readFixed(data, offset);
    offset += 4;
    obj.italicAngle = bin.readFixed(data, offset);
    offset += 4;
    obj.underlinePosition = bin.readShort(data, offset);
    offset += 2;
    obj.underlineThickness = bin.readShort(data, offset);
    offset += 2;
    return obj;
  };
  Typr.SVG = {};
  Typr.SVG.parse = function(data, offset, length) {
    var bin = Typr._bin;
    var obj = { entries: [] };
    var offset0 = offset;
    bin.readUshort(data, offset);
    offset += 2;
    var svgDocIndexOffset = bin.readUint(data, offset);
    offset += 4;
    bin.readUint(data, offset);
    offset += 4;
    offset = svgDocIndexOffset + offset0;
    var numEntries = bin.readUshort(data, offset);
    offset += 2;
    for (var i = 0; i < numEntries; i++) {
      var startGlyphID = bin.readUshort(data, offset);
      offset += 2;
      var endGlyphID = bin.readUshort(data, offset);
      offset += 2;
      var svgDocOffset = bin.readUint(data, offset);
      offset += 4;
      var svgDocLength = bin.readUint(data, offset);
      offset += 4;
      var sbuf = new Uint8Array(data.buffer, offset0 + svgDocOffset + svgDocIndexOffset, svgDocLength);
      var svg = bin.readUTF8(sbuf, 0, sbuf.length);
      for (var f = startGlyphID; f <= endGlyphID; f++) {
        obj.entries[f] = svg;
      }
    }
    return obj;
  };
  Typr.SVG.toPath = function(str) {
    var pth = { cmds: [], crds: [] };
    if (str == null)
      return pth;
    var prsr = new DOMParser();
    var doc = prsr["parseFromString"](str, "image/svg+xml");
    var svg = doc.firstChild;
    while (svg.tagName != "svg")
      svg = svg.nextSibling;
    var vb = svg.getAttribute("viewBox");
    if (vb)
      vb = vb.trim().split(" ").map(parseFloat);
    else
      vb = [0, 0, 1e3, 1e3];
    Typr.SVG._toPath(svg.children, pth);
    for (var i = 0; i < pth.crds.length; i += 2) {
      var x = pth.crds[i], y = pth.crds[i + 1];
      x -= vb[0];
      y -= vb[1];
      y = -y;
      pth.crds[i] = x;
      pth.crds[i + 1] = y;
    }
    return pth;
  };
  Typr.SVG._toPath = function(nds, pth, fill) {
    for (var ni = 0; ni < nds.length; ni++) {
      var nd = nds[ni], tn = nd.tagName;
      var cfl = nd.getAttribute("fill");
      if (cfl == null)
        cfl = fill;
      if (tn == "g")
        Typr.SVG._toPath(nd.children, pth, cfl);
      else if (tn == "path") {
        pth.cmds.push(cfl ? cfl : "#000000");
        var d = nd.getAttribute("d");
        var toks = Typr.SVG._tokens(d);
        Typr.SVG._toksToPath(toks, pth);
        pth.cmds.push("X");
      } else if (tn == "defs") ;
      else
        console.warn(tn, nd);
    }
  };
  Typr.SVG._tokens = function(d) {
    var ts = [], off = 0, rn = false, cn = "";
    while (off < d.length) {
      var cc = d.charCodeAt(off), ch = d.charAt(off);
      off++;
      var isNum = 48 <= cc && cc <= 57 || ch == "." || ch == "-";
      if (rn) {
        if (ch == "-") {
          ts.push(parseFloat(cn));
          cn = ch;
        } else if (isNum)
          cn += ch;
        else {
          ts.push(parseFloat(cn));
          if (ch != "," && ch != " ")
            ts.push(ch);
          rn = false;
        }
      } else {
        if (isNum) {
          cn = ch;
          rn = true;
        } else if (ch != "," && ch != " ")
          ts.push(ch);
      }
    }
    if (rn)
      ts.push(parseFloat(cn));
    return ts;
  };
  Typr.SVG._toksToPath = function(ts, pth) {
    var i = 0, x = 0, y = 0, ox = 0, oy = 0;
    var pc = { "M": 2, "L": 2, "H": 1, "V": 1, "S": 4, "C": 6 };
    var cmds = pth.cmds, crds = pth.crds;
    while (i < ts.length) {
      var cmd = ts[i];
      i++;
      if (cmd == "z") {
        cmds.push("Z");
        x = ox;
        y = oy;
      } else {
        var cmu = cmd.toUpperCase();
        var ps = pc[cmu], reps = Typr.SVG._reps(ts, i, ps);
        for (var j = 0; j < reps; j++) {
          var xi = 0, yi = 0;
          if (cmd != cmu) {
            xi = x;
            yi = y;
          }
          if (cmu == "M") {
            x = xi + ts[i++];
            y = yi + ts[i++];
            cmds.push("M");
            crds.push(x, y);
            ox = x;
            oy = y;
          } else if (cmu == "L") {
            x = xi + ts[i++];
            y = yi + ts[i++];
            cmds.push("L");
            crds.push(x, y);
          } else if (cmu == "H") {
            x = xi + ts[i++];
            cmds.push("L");
            crds.push(x, y);
          } else if (cmu == "V") {
            y = yi + ts[i++];
            cmds.push("L");
            crds.push(x, y);
          } else if (cmu == "C") {
            var x1 = xi + ts[i++], y1 = yi + ts[i++], x2 = xi + ts[i++], y2 = yi + ts[i++], x3 = xi + ts[i++], y3 = yi + ts[i++];
            cmds.push("C");
            crds.push(x1, y1, x2, y2, x3, y3);
            x = x3;
            y = y3;
          } else if (cmu == "S") {
            var co = Math.max(crds.length - 4, 0);
            var x1 = x + x - crds[co], y1 = y + y - crds[co + 1];
            var x2 = xi + ts[i++], y2 = yi + ts[i++], x3 = xi + ts[i++], y3 = yi + ts[i++];
            cmds.push("C");
            crds.push(x1, y1, x2, y2, x3, y3);
            x = x3;
            y = y3;
          } else
            console.warn("Unknown SVG command " + cmd);
        }
      }
    }
  };
  Typr.SVG._reps = function(ts, off, ps) {
    var i = off;
    while (i < ts.length) {
      if (typeof ts[i] == "string")
        break;
      i += ps;
    }
    return (i - off) / ps;
  };
  if (Typr == null)
    Typr = {};
  if (Typr.U == null)
    Typr.U = {};
  Typr.U.codeToGlyph = function(font, code) {
    var cmap = font.cmap;
    for (var _i = 0, _a = [cmap.p0e4, cmap.p3e1, cmap.p3e10, cmap.p0e3, cmap.p1e0]; _i < _a.length; _i++) {
      var tind = _a[_i];
      if (tind == null)
        continue;
      var tab = cmap.tables[tind];
      if (tab.format == 0) {
        if (code >= tab.map.length)
          continue;
        return tab.map[code];
      } else if (tab.format == 4) {
        var sind = -1;
        for (var i = 0; i < tab.endCount.length; i++) {
          if (code <= tab.endCount[i]) {
            sind = i;
            break;
          }
        }
        if (sind == -1)
          continue;
        if (tab.startCount[sind] > code)
          continue;
        var gli = 0;
        if (tab.idRangeOffset[sind] != 0) {
          gli = tab.glyphIdArray[code - tab.startCount[sind] + (tab.idRangeOffset[sind] >> 1) - (tab.idRangeOffset.length - sind)];
        } else {
          gli = code + tab.idDelta[sind];
        }
        return gli & 65535;
      } else if (tab.format == 12) {
        if (code > tab.groups[tab.groups.length - 1][1])
          continue;
        for (var i = 0; i < tab.groups.length; i++) {
          var grp = tab.groups[i];
          if (grp[0] <= code && code <= grp[1])
            return grp[2] + (code - grp[0]);
        }
        continue;
      } else {
        throw "unknown cmap table format " + tab.format;
      }
    }
    return 0;
  };
  Typr.U.glyphToPath = function(font, gid) {
    var path = { cmds: [], crds: [] };
    if (font.SVG && font.SVG.entries[gid]) {
      var p = font.SVG.entries[gid];
      if (p == null)
        return path;
      if (typeof p == "string") {
        p = Typr.SVG.toPath(p);
        font.SVG.entries[gid] = p;
      }
      return p;
    } else if (font.CFF) {
      var state = { x: 0, y: 0, stack: [], nStems: 0, haveWidth: false, width: font.CFF.Private ? font.CFF.Private.defaultWidthX : 0, open: false };
      var cff = font.CFF, pdct = font.CFF.Private;
      if (cff.ROS) {
        var gi = 0;
        while (cff.FDSelect[gi + 2] <= gid)
          gi += 2;
        pdct = cff.FDArray[cff.FDSelect[gi + 1]].Private;
      }
      Typr.U._drawCFF(font.CFF.CharStrings[gid], state, cff, pdct, path);
    } else if (font.glyf) {
      Typr.U._drawGlyf(gid, font, path);
    }
    return path;
  };
  Typr.U._drawGlyf = function(gid, font, path) {
    var gl = font.glyf[gid];
    if (gl == null)
      gl = font.glyf[gid] = Typr.glyf._parseGlyf(font, gid);
    if (gl != null) {
      if (gl.noc > -1) {
        Typr.U._simpleGlyph(gl, path);
      } else {
        Typr.U._compoGlyph(gl, font, path);
      }
    }
  };
  Typr.U._simpleGlyph = function(gl, p) {
    for (var c = 0; c < gl.noc; c++) {
      var i0 = c == 0 ? 0 : gl.endPts[c - 1] + 1;
      var il = gl.endPts[c];
      for (var i = i0; i <= il; i++) {
        var pr = i == i0 ? il : i - 1;
        var nx = i == il ? i0 : i + 1;
        var onCurve = gl.flags[i] & 1;
        var prOnCurve = gl.flags[pr] & 1;
        var nxOnCurve = gl.flags[nx] & 1;
        var x = gl.xs[i], y = gl.ys[i];
        if (i == i0) {
          if (onCurve) {
            if (prOnCurve) {
              Typr.U.P.moveTo(p, gl.xs[pr], gl.ys[pr]);
            } else {
              Typr.U.P.moveTo(p, x, y);
              continue;
            }
          } else {
            if (prOnCurve) {
              Typr.U.P.moveTo(p, gl.xs[pr], gl.ys[pr]);
            } else {
              Typr.U.P.moveTo(p, (gl.xs[pr] + x) / 2, (gl.ys[pr] + y) / 2);
            }
          }
        }
        if (onCurve) {
          if (prOnCurve)
            Typr.U.P.lineTo(p, x, y);
        } else {
          if (nxOnCurve) {
            Typr.U.P.qcurveTo(p, x, y, gl.xs[nx], gl.ys[nx]);
          } else {
            Typr.U.P.qcurveTo(p, x, y, (x + gl.xs[nx]) / 2, (y + gl.ys[nx]) / 2);
          }
        }
      }
      Typr.U.P.closePath(p);
    }
  };
  Typr.U._compoGlyph = function(gl, font, p) {
    for (var j = 0; j < gl.parts.length; j++) {
      var path = { cmds: [], crds: [] };
      var prt = gl.parts[j];
      Typr.U._drawGlyf(prt.glyphIndex, font, path);
      var m = prt.m;
      for (var i = 0; i < path.crds.length; i += 2) {
        var x = path.crds[i], y = path.crds[i + 1];
        p.crds.push(x * m.a + y * m.b + m.tx);
        p.crds.push(x * m.c + y * m.d + m.ty);
      }
      for (var i = 0; i < path.cmds.length; i++) {
        p.cmds.push(path.cmds[i]);
      }
    }
  };
  Typr.U._getGlyphClass = function(g, cd) {
    var intr = Typr._lctf.getInterval(cd, g);
    return intr == -1 ? 0 : cd[intr + 2];
  };
  Typr.U.getPairAdjustment = function(font, g1, g2) {
    var hasGPOSkern = false;
    if (font.GPOS) {
      var gpos = font["GPOS"];
      var llist = gpos.lookupList, flist = gpos.featureList;
      var tused = [];
      for (var i = 0; i < flist.length; i++) {
        var fl = flist[i];
        if (fl.tag != "kern")
          continue;
        hasGPOSkern = true;
        for (var ti = 0; ti < fl.tab.length; ti++) {
          if (tused[fl.tab[ti]])
            continue;
          tused[fl.tab[ti]] = true;
          var tab = llist[fl.tab[ti]];
          for (var j = 0; j < tab.tabs.length; j++) {
            if (tab.tabs[j] == null)
              continue;
            var ltab = tab.tabs[j], ind;
            if (ltab.coverage) {
              ind = Typr._lctf.coverageIndex(ltab.coverage, g1);
              if (ind == -1)
                continue;
            }
            if (tab.ltype == 1) ;
            else if (tab.ltype == 2) {
              var adj = null;
              if (ltab.fmt == 1) {
                var right = ltab.pairsets[ind];
                for (var i = 0; i < right.length; i++) {
                  if (right[i].gid2 == g2)
                    adj = right[i];
                }
              } else if (ltab.fmt == 2) {
                var c1 = Typr.U._getGlyphClass(g1, ltab.classDef1);
                var c2 = Typr.U._getGlyphClass(g2, ltab.classDef2);
                adj = ltab.matrix[c1][c2];
              }
              if (adj) {
                var offset = 0;
                if (adj.val1 && adj.val1[2])
                  offset += adj.val1[2];
                if (adj.val2 && adj.val2[0])
                  offset += adj.val2[0];
                return offset;
              }
            }
          }
        }
      }
    }
    if (font.kern && !hasGPOSkern) {
      var ind1 = font.kern.glyph1.indexOf(g1);
      if (ind1 != -1) {
        var ind2 = font.kern.rval[ind1].glyph2.indexOf(g2);
        if (ind2 != -1)
          return font.kern.rval[ind1].vals[ind2];
      }
    }
    return 0;
  };
  Typr.U.stringToGlyphs = function(font, str) {
    var gls = [];
    for (var i = 0; i < str.length; i++) {
      var cc = str.codePointAt(i);
      if (cc > 65535)
        i++;
      gls.push(Typr.U.codeToGlyph(font, cc));
    }
    for (var i = 0; i < str.length; i++) {
      var cc = str.codePointAt(i);
      if (cc == 2367) {
        var t = gls[i - 1];
        gls[i - 1] = gls[i];
        gls[i] = t;
      }
      if (cc > 65535)
        i++;
    }
    var gsub = font["GSUB"];
    if (gsub == null)
      return gls;
    var llist = gsub.lookupList, flist = gsub.featureList;
    var cligs = [
      "rlig",
      "liga",
      "mset",
      "isol",
      "init",
      "fina",
      "medi",
      "half",
      "pres",
      "blws"
      /* Tibetan fonts like Himalaya.ttf */
    ];
    var tused = [];
    for (var fi = 0; fi < flist.length; fi++) {
      var fl = flist[fi];
      if (cligs.indexOf(fl.tag) == -1)
        continue;
      for (var ti = 0; ti < fl.tab.length; ti++) {
        if (tused[fl.tab[ti]])
          continue;
        tused[fl.tab[ti]] = true;
        var tab = llist[fl.tab[ti]];
        for (var ci = 0; ci < gls.length; ci++) {
          var feat = Typr.U._getWPfeature(str, ci);
          if ("isol,init,fina,medi".indexOf(fl.tag) != -1 && fl.tag != feat)
            continue;
          Typr.U._applySubs(gls, ci, tab, llist);
        }
      }
    }
    return gls;
  };
  Typr.U._getWPfeature = function(str, ci) {
    var wsep = '\n	" ,.:;!?()  ،';
    var R = "آأؤإاةدذرزوٱٲٳٵٶٷڈډڊڋڌڍڎڏڐڑڒړڔڕږڗژڙۀۃۄۅۆۇۈۉۊۋۍۏےۓەۮۯܐܕܖܗܘܙܞܨܪܬܯݍݙݚݛݫݬݱݳݴݸݹࡀࡆࡇࡉࡔࡧࡩࡪࢪࢫࢬࢮࢱࢲࢹૅેૉ૊૎૏ૐ૑૒૝ૡ૤૯஁ஃ஄அஉ஌எஏ஑னப஫஬";
    var L = "ꡲ્૗";
    var slft = ci == 0 || wsep.indexOf(str[ci - 1]) != -1;
    var srgt = ci == str.length - 1 || wsep.indexOf(str[ci + 1]) != -1;
    if (!slft && R.indexOf(str[ci - 1]) != -1)
      slft = true;
    if (!srgt && R.indexOf(str[ci]) != -1)
      srgt = true;
    if (!srgt && L.indexOf(str[ci + 1]) != -1)
      srgt = true;
    if (!slft && L.indexOf(str[ci]) != -1)
      slft = true;
    var feat = null;
    if (slft) {
      feat = srgt ? "isol" : "init";
    } else {
      feat = srgt ? "fina" : "medi";
    }
    return feat;
  };
  Typr.U._applySubs = function(gls, ci, tab, llist) {
    var rlim = gls.length - ci - 1;
    for (var j = 0; j < tab.tabs.length; j++) {
      if (tab.tabs[j] == null)
        continue;
      var ltab = tab.tabs[j], ind;
      if (ltab.coverage) {
        ind = Typr._lctf.coverageIndex(ltab.coverage, gls[ci]);
        if (ind == -1)
          continue;
      }
      if (tab.ltype == 1) {
        gls[ci];
        if (ltab.fmt == 1)
          gls[ci] = gls[ci] + ltab.delta;
        else
          gls[ci] = ltab.newg[ind];
      } else if (tab.ltype == 4) {
        var vals = ltab.vals[ind];
        for (var k = 0; k < vals.length; k++) {
          var lig = vals[k], rl = lig.chain.length;
          if (rl > rlim)
            continue;
          var good = true, em1 = 0;
          for (var l = 0; l < rl; l++) {
            while (gls[ci + em1 + (1 + l)] == -1)
              em1++;
            if (lig.chain[l] != gls[ci + em1 + (1 + l)])
              good = false;
          }
          if (!good)
            continue;
          gls[ci] = lig.nglyph;
          for (var l = 0; l < rl + em1; l++)
            gls[ci + l + 1] = -1;
          break;
        }
      } else if (tab.ltype == 5 && ltab.fmt == 2) {
        var cind = Typr._lctf.getInterval(ltab.cDef, gls[ci]);
        var cls = ltab.cDef[cind + 2], scs = ltab.scset[cls];
        for (var i = 0; i < scs.length; i++) {
          var sc = scs[i], inp = sc.input;
          if (inp.length > rlim)
            continue;
          var good = true;
          for (var l = 0; l < inp.length; l++) {
            var cind2 = Typr._lctf.getInterval(ltab.cDef, gls[ci + 1 + l]);
            if (cind == -1 && ltab.cDef[cind2 + 2] != inp[l]) {
              good = false;
              break;
            }
          }
          if (!good)
            continue;
          var lrs = sc.substLookupRecords;
          for (var k = 0; k < lrs.length; k += 2) {
            lrs[k];
            lrs[k + 1];
          }
        }
      } else if (tab.ltype == 6 && ltab.fmt == 3) {
        if (!Typr.U._glsCovered(gls, ltab.backCvg, ci - ltab.backCvg.length))
          continue;
        if (!Typr.U._glsCovered(gls, ltab.inptCvg, ci))
          continue;
        if (!Typr.U._glsCovered(gls, ltab.ahedCvg, ci + ltab.inptCvg.length))
          continue;
        var lr = ltab.lookupRec;
        for (var i = 0; i < lr.length; i += 2) {
          var cind = lr[i], tab2 = llist[lr[i + 1]];
          Typr.U._applySubs(gls, ci + cind, tab2, llist);
        }
      }
    }
  };
  Typr.U._glsCovered = function(gls, cvgs, ci) {
    for (var i = 0; i < cvgs.length; i++) {
      var ind = Typr._lctf.coverageIndex(cvgs[i], gls[ci + i]);
      if (ind == -1)
        return false;
    }
    return true;
  };
  Typr.U.glyphsToPath = function(font, gls, clr) {
    var tpath = { cmds: [], crds: [] };
    var x = 0;
    for (var i = 0; i < gls.length; i++) {
      var gid = gls[i];
      if (gid == -1)
        continue;
      var gid2 = i < gls.length - 1 && gls[i + 1] != -1 ? gls[i + 1] : 0;
      var path = Typr.U.glyphToPath(font, gid);
      for (var j = 0; j < path.crds.length; j += 2) {
        tpath.crds.push(path.crds[j] + x);
        tpath.crds.push(path.crds[j + 1]);
      }
      if (clr)
        tpath.cmds.push(clr);
      for (var j = 0; j < path.cmds.length; j++)
        tpath.cmds.push(path.cmds[j]);
      if (clr)
        tpath.cmds.push("X");
      x += font.hmtx.aWidth[gid];
      if (i < gls.length - 1)
        x += Typr.U.getPairAdjustment(font, gid, gid2);
    }
    return tpath;
  };
  Typr.U.pathToSVG = function(path, prec) {
    if (prec == null)
      prec = 5;
    var out = [], co = 0, lmap = { "M": 2, "L": 2, "Q": 4, "C": 6 };
    for (var i = 0; i < path.cmds.length; i++) {
      var cmd = path.cmds[i], cn = co + (lmap[cmd] ? lmap[cmd] : 0);
      out.push(cmd);
      while (co < cn) {
        var c = path.crds[co++];
        out.push(parseFloat(c.toFixed(prec)) + (co == cn ? "" : " "));
      }
    }
    return out.join("");
  };
  Typr.U.pathToContext = function(path, ctx) {
    var c = 0, crds = path.crds;
    for (var j = 0; j < path.cmds.length; j++) {
      var cmd = path.cmds[j];
      if (cmd == "M") {
        ctx.moveTo(crds[c], crds[c + 1]);
        c += 2;
      } else if (cmd == "L") {
        ctx.lineTo(crds[c], crds[c + 1]);
        c += 2;
      } else if (cmd == "C") {
        ctx.bezierCurveTo(crds[c], crds[c + 1], crds[c + 2], crds[c + 3], crds[c + 4], crds[c + 5]);
        c += 6;
      } else if (cmd == "Q") {
        ctx.quadraticCurveTo(crds[c], crds[c + 1], crds[c + 2], crds[c + 3]);
        c += 4;
      } else if (cmd.charAt(0) == "#") {
        ctx.beginPath();
        ctx.fillStyle = cmd;
      } else if (cmd == "Z") {
        ctx.closePath();
      } else if (cmd == "X") {
        ctx.fill();
      }
    }
  };
  Typr.U.P = {};
  Typr.U.P.moveTo = function(p, x, y) {
    p.cmds.push("M");
    p.crds.push(x, y);
  };
  Typr.U.P.lineTo = function(p, x, y) {
    p.cmds.push("L");
    p.crds.push(x, y);
  };
  Typr.U.P.curveTo = function(p, a, b, c, d, e, f) {
    p.cmds.push("C");
    p.crds.push(a, b, c, d, e, f);
  };
  Typr.U.P.qcurveTo = function(p, a, b, c, d) {
    p.cmds.push("Q");
    p.crds.push(a, b, c, d);
  };
  Typr.U.P.closePath = function(p) {
    p.cmds.push("Z");
  };
  Typr.U._drawCFF = function(cmds, state, font, pdct, p) {
    var stack = state.stack;
    var nStems = state.nStems, haveWidth = state.haveWidth, width = state.width, open = state.open;
    var i = 0;
    var x = state.x, y = state.y, c1x = 0, c1y = 0, c2x = 0, c2y = 0, c3x = 0, c3y = 0, c4x = 0, c4y = 0, jpx = 0, jpy = 0;
    var o = { val: 0, size: 0 };
    while (i < cmds.length) {
      Typr.CFF.getCharString(cmds, i, o);
      var v = o.val;
      i += o.size;
      if (v == "o1" || v == "o18") {
        var hasWidthArg;
        hasWidthArg = stack.length % 2 !== 0;
        if (hasWidthArg && !haveWidth) {
          width = stack.shift() + pdct.nominalWidthX;
        }
        nStems += stack.length >> 1;
        stack.length = 0;
        haveWidth = true;
      } else if (v == "o3" || v == "o23") {
        var hasWidthArg;
        hasWidthArg = stack.length % 2 !== 0;
        if (hasWidthArg && !haveWidth) {
          width = stack.shift() + pdct.nominalWidthX;
        }
        nStems += stack.length >> 1;
        stack.length = 0;
        haveWidth = true;
      } else if (v == "o4") {
        if (stack.length > 1 && !haveWidth) {
          width = stack.shift() + pdct.nominalWidthX;
          haveWidth = true;
        }
        if (open)
          Typr.U.P.closePath(p);
        y += stack.pop();
        Typr.U.P.moveTo(p, x, y);
        open = true;
      } else if (v == "o5") {
        while (stack.length > 0) {
          x += stack.shift();
          y += stack.shift();
          Typr.U.P.lineTo(p, x, y);
        }
      } else if (v == "o6" || v == "o7") {
        var count = stack.length;
        var isX = v == "o6";
        for (var j = 0; j < count; j++) {
          var sval = stack.shift();
          if (isX) {
            x += sval;
          } else {
            y += sval;
          }
          isX = !isX;
          Typr.U.P.lineTo(p, x, y);
        }
      } else if (v == "o8" || v == "o24") {
        var count = stack.length;
        var index = 0;
        while (index + 6 <= count) {
          c1x = x + stack.shift();
          c1y = y + stack.shift();
          c2x = c1x + stack.shift();
          c2y = c1y + stack.shift();
          x = c2x + stack.shift();
          y = c2y + stack.shift();
          Typr.U.P.curveTo(p, c1x, c1y, c2x, c2y, x, y);
          index += 6;
        }
        if (v == "o24") {
          x += stack.shift();
          y += stack.shift();
          Typr.U.P.lineTo(p, x, y);
        }
      } else if (v == "o11") {
        break;
      } else if (v == "o1234" || v == "o1235" || v == "o1236" || v == "o1237") {
        if (v == "o1234") {
          c1x = x + stack.shift();
          c1y = y;
          c2x = c1x + stack.shift();
          c2y = c1y + stack.shift();
          jpx = c2x + stack.shift();
          jpy = c2y;
          c3x = jpx + stack.shift();
          c3y = c2y;
          c4x = c3x + stack.shift();
          c4y = y;
          x = c4x + stack.shift();
          Typr.U.P.curveTo(p, c1x, c1y, c2x, c2y, jpx, jpy);
          Typr.U.P.curveTo(p, c3x, c3y, c4x, c4y, x, y);
        }
        if (v == "o1235") {
          c1x = x + stack.shift();
          c1y = y + stack.shift();
          c2x = c1x + stack.shift();
          c2y = c1y + stack.shift();
          jpx = c2x + stack.shift();
          jpy = c2y + stack.shift();
          c3x = jpx + stack.shift();
          c3y = jpy + stack.shift();
          c4x = c3x + stack.shift();
          c4y = c3y + stack.shift();
          x = c4x + stack.shift();
          y = c4y + stack.shift();
          stack.shift();
          Typr.U.P.curveTo(p, c1x, c1y, c2x, c2y, jpx, jpy);
          Typr.U.P.curveTo(p, c3x, c3y, c4x, c4y, x, y);
        }
        if (v == "o1236") {
          c1x = x + stack.shift();
          c1y = y + stack.shift();
          c2x = c1x + stack.shift();
          c2y = c1y + stack.shift();
          jpx = c2x + stack.shift();
          jpy = c2y;
          c3x = jpx + stack.shift();
          c3y = c2y;
          c4x = c3x + stack.shift();
          c4y = c3y + stack.shift();
          x = c4x + stack.shift();
          Typr.U.P.curveTo(p, c1x, c1y, c2x, c2y, jpx, jpy);
          Typr.U.P.curveTo(p, c3x, c3y, c4x, c4y, x, y);
        }
        if (v == "o1237") {
          c1x = x + stack.shift();
          c1y = y + stack.shift();
          c2x = c1x + stack.shift();
          c2y = c1y + stack.shift();
          jpx = c2x + stack.shift();
          jpy = c2y + stack.shift();
          c3x = jpx + stack.shift();
          c3y = jpy + stack.shift();
          c4x = c3x + stack.shift();
          c4y = c3y + stack.shift();
          if (Math.abs(c4x - x) > Math.abs(c4y - y)) {
            x = c4x + stack.shift();
          } else {
            y = c4y + stack.shift();
          }
          Typr.U.P.curveTo(p, c1x, c1y, c2x, c2y, jpx, jpy);
          Typr.U.P.curveTo(p, c3x, c3y, c4x, c4y, x, y);
        }
      } else if (v == "o14") {
        if (stack.length > 0 && !haveWidth) {
          width = stack.shift() + font.nominalWidthX;
          haveWidth = true;
        }
        if (stack.length == 4) {
          var adx = stack.shift();
          var ady = stack.shift();
          var bchar = stack.shift();
          var achar = stack.shift();
          var bind2 = Typr.CFF.glyphBySE(font, bchar);
          var aind = Typr.CFF.glyphBySE(font, achar);
          Typr.U._drawCFF(font.CharStrings[bind2], state, font, pdct, p);
          state.x = adx;
          state.y = ady;
          Typr.U._drawCFF(font.CharStrings[aind], state, font, pdct, p);
        }
        if (open) {
          Typr.U.P.closePath(p);
          open = false;
        }
      } else if (v == "o19" || v == "o20") {
        var hasWidthArg;
        hasWidthArg = stack.length % 2 !== 0;
        if (hasWidthArg && !haveWidth) {
          width = stack.shift() + pdct.nominalWidthX;
        }
        nStems += stack.length >> 1;
        stack.length = 0;
        haveWidth = true;
        i += nStems + 7 >> 3;
      } else if (v == "o21") {
        if (stack.length > 2 && !haveWidth) {
          width = stack.shift() + pdct.nominalWidthX;
          haveWidth = true;
        }
        y += stack.pop();
        x += stack.pop();
        if (open)
          Typr.U.P.closePath(p);
        Typr.U.P.moveTo(p, x, y);
        open = true;
      } else if (v == "o22") {
        if (stack.length > 1 && !haveWidth) {
          width = stack.shift() + pdct.nominalWidthX;
          haveWidth = true;
        }
        x += stack.pop();
        if (open)
          Typr.U.P.closePath(p);
        Typr.U.P.moveTo(p, x, y);
        open = true;
      } else if (v == "o25") {
        while (stack.length > 6) {
          x += stack.shift();
          y += stack.shift();
          Typr.U.P.lineTo(p, x, y);
        }
        c1x = x + stack.shift();
        c1y = y + stack.shift();
        c2x = c1x + stack.shift();
        c2y = c1y + stack.shift();
        x = c2x + stack.shift();
        y = c2y + stack.shift();
        Typr.U.P.curveTo(p, c1x, c1y, c2x, c2y, x, y);
      } else if (v == "o26") {
        if (stack.length % 2) {
          x += stack.shift();
        }
        while (stack.length > 0) {
          c1x = x;
          c1y = y + stack.shift();
          c2x = c1x + stack.shift();
          c2y = c1y + stack.shift();
          x = c2x;
          y = c2y + stack.shift();
          Typr.U.P.curveTo(p, c1x, c1y, c2x, c2y, x, y);
        }
      } else if (v == "o27") {
        if (stack.length % 2) {
          y += stack.shift();
        }
        while (stack.length > 0) {
          c1x = x + stack.shift();
          c1y = y;
          c2x = c1x + stack.shift();
          c2y = c1y + stack.shift();
          x = c2x + stack.shift();
          y = c2y;
          Typr.U.P.curveTo(p, c1x, c1y, c2x, c2y, x, y);
        }
      } else if (v == "o10" || v == "o29") {
        var obj = v == "o10" ? pdct : font;
        if (stack.length == 0) {
          console.warn("error: empty stack");
        } else {
          var ind = stack.pop();
          var subr = obj.Subrs[ind + obj.Bias];
          state.x = x;
          state.y = y;
          state.nStems = nStems;
          state.haveWidth = haveWidth;
          state.width = width;
          state.open = open;
          Typr.U._drawCFF(subr, state, font, pdct, p);
          x = state.x;
          y = state.y;
          nStems = state.nStems;
          haveWidth = state.haveWidth;
          width = state.width;
          open = state.open;
        }
      } else if (v == "o30" || v == "o31") {
        var count, count1 = stack.length;
        var index = 0;
        var alternate = v == "o31";
        count = count1 & ~2;
        index += count1 - count;
        while (index < count) {
          if (alternate) {
            c1x = x + stack.shift();
            c1y = y;
            c2x = c1x + stack.shift();
            c2y = c1y + stack.shift();
            y = c2y + stack.shift();
            if (count - index == 5) {
              x = c2x + stack.shift();
              index++;
            } else {
              x = c2x;
            }
            alternate = false;
          } else {
            c1x = x;
            c1y = y + stack.shift();
            c2x = c1x + stack.shift();
            c2y = c1y + stack.shift();
            x = c2x + stack.shift();
            if (count - index == 5) {
              y = c2y + stack.shift();
              index++;
            } else {
              y = c2y;
            }
            alternate = true;
          }
          Typr.U.P.curveTo(p, c1x, c1y, c2x, c2y, x, y);
          index += 4;
        }
      } else if ((v + "").charAt(0) == "o") {
        console.warn("Unknown operation: " + v, cmds);
        throw v;
      } else
        stack.push(v);
    }
    state.x = x;
    state.y = y;
    state.nStems = nStems;
    state.haveWidth = haveWidth;
    state.width = width;
    state.open = open;
  };
  Typr$1.Typr = Typr;
  var Typr_js_1 = Typr$1;
  var friendlyTags = { "aalt": "Access All Alternates", "abvf": "Above-base Forms", "abvm": "Above - base Mark Positioning", "abvs": "Above - base Substitutions", "afrc": "Alternative Fractions", "akhn": "Akhands", "blwf": "Below - base Forms", "blwm": "Below - base Mark Positioning", "blws": "Below - base Substitutions", "calt": "Contextual Alternates", "case": "Case - Sensitive Forms", "ccmp": "Glyph Composition / Decomposition", "cfar": "Conjunct Form After Ro", "cjct": "Conjunct Forms", "clig": "Contextual Ligatures", "cpct": "Centered CJK Punctuation", "cpsp": "Capital Spacing", "cswh": "Contextual Swash", "curs": "Cursive Positioning", "c2pc": "Petite Capitals From Capitals", "c2sc": "Small Capitals From Capitals", "dist": "Distances", "dlig": "Discretionary Ligatures", "dnom": "Denominators", "dtls": "Dotless Forms", "expt": "Expert Forms", "falt": "Final Glyph on Line Alternates", "fin2": "Terminal Forms #2", "fin3": "Terminal Forms #3", "fina": "Terminal Forms", "flac": "Flattened accent forms", "frac": "Fractions", "fwid": "Full Widths", "half": "Half Forms", "haln": "Halant Forms", "halt": "Alternate Half Widths", "hist": "Historical Forms", "hkna": "Horizontal Kana Alternates", "hlig": "Historical Ligatures", "hngl": "Hangul", "hojo": "Hojo Kanji Forms(JIS X 0212 - 1990 Kanji Forms)", "hwid": "Half Widths", "init": "Initial Forms", "isol": "Isolated Forms", "ital": "Italics", "jalt": "Justification Alternates", "jp78": "JIS78 Forms", "jp83": "JIS83 Forms", "jp90": "JIS90 Forms", "jp04": "JIS2004 Forms", "kern": "Kerning", "lfbd": "Left Bounds", "liga": "Standard Ligatures", "ljmo": "Leading Jamo Forms", "lnum": "Lining Figures", "locl": "Localized Forms", "ltra": "Left - to - right alternates", "ltrm": "Left - to - right mirrored forms", "mark": "Mark Positioning", "med2": "Medial Forms #2", "medi": "Medial Forms", "mgrk": "Mathematical Greek", "mkmk": "Mark to Mark Positioning", "mset": "Mark Positioning via Substitution", "nalt": "Alternate Annotation Forms", "nlck": "NLC Kanji Forms", "nukt": "Nukta Forms", "numr": "Numerators", "onum": "Oldstyle Figures", "opbd": "Optical Bounds", "ordn": "Ordinals", "ornm": "Ornaments", "palt": "Proportional Alternate Widths", "pcap": "Petite Capitals", "pkna": "Proportional Kana", "pnum": "Proportional Figures", "pref": "Pre - Base Forms", "pres": "Pre - base Substitutions", "pstf": "Post - base Forms", "psts": "Post - base Substitutions", "pwid": "Proportional Widths", "qwid": "Quarter Widths", "rand": "Randomize", "rclt": "Required Contextual Alternates", "rkrf": "Rakar Forms", "rlig": "Required Ligatures", "rphf": "Reph Forms", "rtbd": "Right Bounds", "rtla": "Right - to - left alternates", "rtlm": "Right - to - left mirrored forms", "ruby": "Ruby Notation Forms", "rvrn": "Required Variation Alternates", "salt": "Stylistic Alternates", "sinf": "Scientific Inferiors", "size": "Optical size", "smcp": "Small Capitals", "smpl": "Simplified Forms", "ssty": "Math script style alternates", "stch": "Stretching Glyph Decomposition", "subs": "Subscript", "sups": "Superscript", "swsh": "Swash", "titl": "Titling", "tjmo": "Trailing Jamo Forms", "tnam": "Traditional Name Forms", "tnum": "Tabular Figures", "trad": "Traditional Forms", "twid": "Third Widths", "unic": "Unicase", "valt": "Alternate Vertical Metrics", "vatu": "Vattu Variants", "vert": "Vertical Writing", "vhal": "Alternate Vertical Half Metrics", "vjmo": "Vowel Jamo Forms", "vkna": "Vertical Kana Alternates", "vkrn": "Vertical Kerning", "vpal": "Proportional Alternate Vertical Metrics", "vrt2": "Vertical Alternates and Rotation", "vrtr": "Vertical Alternates for Rotation", "zero": "Slashed Zero" };
  var Font = (
    /** @class */
    function() {
      function Font2(data) {
        var obj = Typr_js_1.Typr.parse(data);
        if (!obj.length || typeof obj[0] !== "object" || typeof obj[0].hasOwnProperty !== "function") {
          throw "unable to parse font";
        }
        for (var n in obj[0]) {
          this[n] = obj[0][n];
        }
        this.enabledGSUB = {};
      }
      Font2.prototype.getFamilyName = function() {
        return this.name && (this.name.typoFamilyName || this.name.fontFamily) || "";
      };
      Font2.prototype.getSubFamilyName = function() {
        return this.name && (this.name.typoSubfamilyName || this.name.fontSubfamily) || "";
      };
      Font2.prototype.glyphToPath = function(gid) {
        return Typr_js_1.Typr.U.glyphToPath(this, gid);
      };
      Font2.prototype.getPairAdjustment = function(gid1, gid2) {
        return Typr_js_1.Typr.U.getPairAdjustment(this, gid1, gid2);
      };
      Font2.prototype.stringToGlyphs = function(str) {
        return Typr_js_1.Typr.U.stringToGlyphs(this, str);
      };
      Font2.prototype.glyphsToPath = function(gls) {
        return Typr_js_1.Typr.U.glyphsToPath(this, gls);
      };
      Font2.prototype.pathToSVG = function(path, prec) {
        return Typr_js_1.Typr.U.pathToSVG(path, prec);
      };
      Font2.prototype.pathToContext = function(path, ctx) {
        return Typr_js_1.Typr.U.pathToContext(path, ctx);
      };
      Font2.prototype.lookupFriendlyName = function(table, feature) {
        if (this[table] !== void 0) {
          var tbl = this[table];
          var feat = tbl.featureList[feature];
          return this.featureFriendlyName(feat);
        }
        return "";
      };
      Font2.prototype.featureFriendlyName = function(feature) {
        if (friendlyTags[feature.tag]) {
          return friendlyTags[feature.tag];
        }
        if (feature.tag.match(/ss[0-2][0-9]/)) {
          var name_1 = "Stylistic Set " + Number(feature.tag.substr(2, 2)).toString();
          if (feature.featureParams) {
            var version = Typr_js_1.Typr._bin.readUshort(this._data, feature.featureParams);
            if (version === 0) {
              var nameID = Typr_js_1.Typr._bin.readUshort(this._data, feature.featureParams + 2);
              if (this.name && this.name[nameID] !== void 0) {
                return name_1 + " - " + this.name[nameID];
              }
            }
          }
          return name_1;
        }
        if (feature.tag.match(/cv[0-9][0-9]/)) {
          return "Character Variant " + Number(feature.tag.substr(2, 2)).toString();
        }
        return "";
      };
      Font2.prototype.enableGSUB = function(featureNumber) {
        if (this.GSUB) {
          var feature = this.GSUB.featureList[featureNumber];
          if (feature) {
            for (var i = 0; i < feature.tab.length; ++i) {
              this.enabledGSUB[feature.tab[i]] = (this.enabledGSUB[feature.tab[i]] || 0) + 1;
            }
          }
        }
      };
      Font2.prototype.disableGSUB = function(featureNumber) {
        if (this.GSUB) {
          var feature = this.GSUB.featureList[featureNumber];
          if (feature) {
            for (var i = 0; i < feature.tab.length; ++i) {
              if (this.enabledGSUB[feature.tab[i]] > 1) {
                --this.enabledGSUB[feature.tab[i]];
              } else {
                delete this.enabledGSUB[feature.tab[i]];
              }
            }
          }
        }
      };
      Font2.prototype.codeToGlyph = function(code) {
        var g = Typr_js_1.Typr.U.codeToGlyph(this, code);
        if (this.GSUB) {
          var gls = [g];
          for (var n in this.enabledGSUB) {
            var l = this.GSUB.lookupList[n];
            Typr_js_1.Typr.U._applySubs(gls, 0, l, this.GSUB.lookupList);
          }
          if (gls.length === 1)
            return gls[0];
        }
        return g;
      };
      return Font2;
    }()
  );
  var Font_1 = Font;
  const base64ToUint8Array = (base64) => {
    const data = window.atob(base64);
    const buffer = new Uint8Array(data.length);
    for (let i = 0; i < data.length; i++) {
      buffer[i] = data.charCodeAt(i);
    }
    return buffer;
  };
  const parseResourceText = (resourceName) => {
    try {
      return JSON.parse(GM_getResourceText(resourceName));
    } catch (e) {
      console.log("parseResourceText error:", e);
      return null;
    }
  };
  const findEncryptedFontStyle = (document2) => {
    const styles = Array.from(document2.querySelectorAll("style"));
    return styles.find((style) => {
      var _a;
      return (_a = style.textContent) == null ? void 0 : _a.includes("font-cxsecret");
    });
  };
  const buildDecryptionTable = (font, lookupTable) => {
    const match = {};
    const CHINESE_CHAR_START = 19968;
    const CHINESE_CHAR_END = 40870;
    for (let charCode = CHINESE_CHAR_START; charCode < CHINESE_CHAR_END; charCode++) {
      const glyph = font.codeToGlyph(charCode);
      if (!glyph) continue;
      const path = font.glyphToPath(glyph);
      const hash = md5(JSON.stringify(path)).slice(24);
      match[charCode] = lookupTable[hash];
    }
    return match;
  };
  const replaceEncryptedText = (elements, decryptionTable) => {
    elements.forEach((el) => {
      let html = el.innerHTML;
      Object.entries(decryptionTable).forEach(([key, value]) => {
        const encryptedChar = String.fromCharCode(Number(key));
        const decryptedChar = String.fromCharCode(value);
        html = html.replace(new RegExp(encryptedChar, "g"), decryptedChar);
      });
      el.classList.remove("font-cxsecret");
      el.innerHTML = html;
    });
  };
  function decrypt(iframeDocument) {
    var _a, _b;
    const fontStyle = findEncryptedFontStyle(iframeDocument);
    if (!fontStyle) return;
    const fontData = (_b = (_a = fontStyle.textContent) == null ? void 0 : _a.match(/base64,([\w\W]+?)'/)) == null ? void 0 : _b[1];
    if (!fontData) return;
    const fontArray = base64ToUint8Array(fontData);
    const font = new Font_1(fontArray);
    const lookupTable = parseResourceText("ttf") || parseResourceText("ttf2");
    if (!lookupTable) return;
    const decryptionTable = buildDecryptionTable(font, lookupTable);
    const elements = iframeDocument.querySelectorAll(".font-cxsecret");
    replaceEncryptedText(elements, decryptionTable);
  }
  function isFunction(value) {
    return typeof value === "function";
  }
  function hasLift(source) {
    return isFunction(source === null || source === void 0 ? void 0 : source.lift);
  }
  function operate(init) {
    return function(source) {
      if (hasLift(source)) {
        return source.lift(function(liftedSource) {
          try {
            return init(liftedSource, this);
          } catch (err) {
            this.error(err);
          }
        });
      }
      throw new TypeError("Unable to lift unknown Observable type");
    };
  }
  var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
      d2.__proto__ = b2;
    } || function(d2, b2) {
      for (var p in b2) if (Object.prototype.hasOwnProperty.call(b2, p)) d2[p] = b2[p];
    };
    return extendStatics(d, b);
  };
  function __extends(d, b) {
    if (typeof b !== "function" && b !== null)
      throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
    extendStatics(d, b);
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  }
  function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P ? value : new P(function(resolve) {
        resolve(value);
      });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, [])).next());
    });
  }
  function __generator(thisArg, body) {
    var _ = { label: 0, sent: function() {
      if (t[0] & 1) throw t[1];
      return t[1];
    }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() {
      return this;
    }), g;
    function verb(n) {
      return function(v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError("Generator is already executing.");
      while (g && (g = 0, op[0] && (_ = 0)), _) try {
        if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
        if (y = 0, t) op = [op[0] & 2, t.value];
        switch (op[0]) {
          case 0:
          case 1:
            t = op;
            break;
          case 4:
            _.label++;
            return { value: op[1], done: false };
          case 5:
            _.label++;
            y = op[1];
            op = [0];
            continue;
          case 7:
            op = _.ops.pop();
            _.trys.pop();
            continue;
          default:
            if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
              _ = 0;
              continue;
            }
            if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
              _.label = op[1];
              break;
            }
            if (op[0] === 6 && _.label < t[1]) {
              _.label = t[1];
              t = op;
              break;
            }
            if (t && _.label < t[2]) {
              _.label = t[2];
              _.ops.push(op);
              break;
            }
            if (t[2]) _.ops.pop();
            _.trys.pop();
            continue;
        }
        op = body.call(thisArg, _);
      } catch (e) {
        op = [6, e];
        y = 0;
      } finally {
        f = t = 0;
      }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  }
  function __values(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
      next: function() {
        if (o && i >= o.length) o = void 0;
        return { value: o && o[i++], done: !o };
      }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
  }
  function __read(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
      while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    } catch (error) {
      e = { error };
    } finally {
      try {
        if (r && !r.done && (m = i["return"])) m.call(i);
      } finally {
        if (e) throw e.error;
      }
    }
    return ar;
  }
  function __spreadArray(to, from2, pack) {
    if (arguments.length === 2) for (var i = 0, l = from2.length, ar; i < l; i++) {
      if (ar || !(i in from2)) {
        if (!ar) ar = Array.prototype.slice.call(from2, 0, i);
        ar[i] = from2[i];
      }
    }
    return to.concat(ar || Array.prototype.slice.call(from2));
  }
  function __await(v) {
    return this instanceof __await ? (this.v = v, this) : new __await(v);
  }
  function __asyncGenerator(thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = Object.create((typeof AsyncIterator === "function" ? AsyncIterator : Object).prototype), verb("next"), verb("throw"), verb("return", awaitReturn), i[Symbol.asyncIterator] = function() {
      return this;
    }, i;
    function awaitReturn(f) {
      return function(v) {
        return Promise.resolve(v).then(f, reject);
      };
    }
    function verb(n, f) {
      if (g[n]) {
        i[n] = function(v) {
          return new Promise(function(a, b) {
            q.push([n, v, a, b]) > 1 || resume(n, v);
          });
        };
        if (f) i[n] = f(i[n]);
      }
    }
    function resume(n, v) {
      try {
        step(g[n](v));
      } catch (e) {
        settle(q[0][3], e);
      }
    }
    function step(r) {
      r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r);
    }
    function fulfill(value) {
      resume("next", value);
    }
    function reject(value) {
      resume("throw", value);
    }
    function settle(f, v) {
      if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]);
    }
  }
  function __asyncValues(o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function() {
      return this;
    }, i);
    function verb(n) {
      i[n] = o[n] && function(v) {
        return new Promise(function(resolve, reject) {
          v = o[n](v), settle(resolve, reject, v.done, v.value);
        });
      };
    }
    function settle(resolve, reject, d, v) {
      Promise.resolve(v).then(function(v2) {
        resolve({ value: v2, done: d });
      }, reject);
    }
  }
  typeof SuppressedError === "function" ? SuppressedError : function(error, suppressed, message2) {
    var e = new Error(message2);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
  };
  var isArrayLike = function(x) {
    return x && typeof x.length === "number" && typeof x !== "function";
  };
  function isPromise(value) {
    return isFunction(value === null || value === void 0 ? void 0 : value.then);
  }
  function createErrorClass(createImpl) {
    var _super = function(instance) {
      Error.call(instance);
      instance.stack = new Error().stack;
    };
    var ctorFunc = createImpl(_super);
    ctorFunc.prototype = Object.create(Error.prototype);
    ctorFunc.prototype.constructor = ctorFunc;
    return ctorFunc;
  }
  var UnsubscriptionError = createErrorClass(function(_super) {
    return function UnsubscriptionErrorImpl(errors) {
      _super(this);
      this.message = errors ? errors.length + " errors occurred during unsubscription:\n" + errors.map(function(err, i) {
        return i + 1 + ") " + err.toString();
      }).join("\n  ") : "";
      this.name = "UnsubscriptionError";
      this.errors = errors;
    };
  });
  function arrRemove(arr, item) {
    if (arr) {
      var index = arr.indexOf(item);
      0 <= index && arr.splice(index, 1);
    }
  }
  var Subscription = function() {
    function Subscription2(initialTeardown) {
      this.initialTeardown = initialTeardown;
      this.closed = false;
      this._parentage = null;
      this._finalizers = null;
    }
    Subscription2.prototype.unsubscribe = function() {
      var e_1, _a, e_2, _b;
      var errors;
      if (!this.closed) {
        this.closed = true;
        var _parentage = this._parentage;
        if (_parentage) {
          this._parentage = null;
          if (Array.isArray(_parentage)) {
            try {
              for (var _parentage_1 = __values(_parentage), _parentage_1_1 = _parentage_1.next(); !_parentage_1_1.done; _parentage_1_1 = _parentage_1.next()) {
                var parent_1 = _parentage_1_1.value;
                parent_1.remove(this);
              }
            } catch (e_1_1) {
              e_1 = { error: e_1_1 };
            } finally {
              try {
                if (_parentage_1_1 && !_parentage_1_1.done && (_a = _parentage_1.return)) _a.call(_parentage_1);
              } finally {
                if (e_1) throw e_1.error;
              }
            }
          } else {
            _parentage.remove(this);
          }
        }
        var initialFinalizer = this.initialTeardown;
        if (isFunction(initialFinalizer)) {
          try {
            initialFinalizer();
          } catch (e) {
            errors = e instanceof UnsubscriptionError ? e.errors : [e];
          }
        }
        var _finalizers = this._finalizers;
        if (_finalizers) {
          this._finalizers = null;
          try {
            for (var _finalizers_1 = __values(_finalizers), _finalizers_1_1 = _finalizers_1.next(); !_finalizers_1_1.done; _finalizers_1_1 = _finalizers_1.next()) {
              var finalizer = _finalizers_1_1.value;
              try {
                execFinalizer(finalizer);
              } catch (err) {
                errors = errors !== null && errors !== void 0 ? errors : [];
                if (err instanceof UnsubscriptionError) {
                  errors = __spreadArray(__spreadArray([], __read(errors)), __read(err.errors));
                } else {
                  errors.push(err);
                }
              }
            }
          } catch (e_2_1) {
            e_2 = { error: e_2_1 };
          } finally {
            try {
              if (_finalizers_1_1 && !_finalizers_1_1.done && (_b = _finalizers_1.return)) _b.call(_finalizers_1);
            } finally {
              if (e_2) throw e_2.error;
            }
          }
        }
        if (errors) {
          throw new UnsubscriptionError(errors);
        }
      }
    };
    Subscription2.prototype.add = function(teardown) {
      var _a;
      if (teardown && teardown !== this) {
        if (this.closed) {
          execFinalizer(teardown);
        } else {
          if (teardown instanceof Subscription2) {
            if (teardown.closed || teardown._hasParent(this)) {
              return;
            }
            teardown._addParent(this);
          }
          (this._finalizers = (_a = this._finalizers) !== null && _a !== void 0 ? _a : []).push(teardown);
        }
      }
    };
    Subscription2.prototype._hasParent = function(parent) {
      var _parentage = this._parentage;
      return _parentage === parent || Array.isArray(_parentage) && _parentage.includes(parent);
    };
    Subscription2.prototype._addParent = function(parent) {
      var _parentage = this._parentage;
      this._parentage = Array.isArray(_parentage) ? (_parentage.push(parent), _parentage) : _parentage ? [_parentage, parent] : parent;
    };
    Subscription2.prototype._removeParent = function(parent) {
      var _parentage = this._parentage;
      if (_parentage === parent) {
        this._parentage = null;
      } else if (Array.isArray(_parentage)) {
        arrRemove(_parentage, parent);
      }
    };
    Subscription2.prototype.remove = function(teardown) {
      var _finalizers = this._finalizers;
      _finalizers && arrRemove(_finalizers, teardown);
      if (teardown instanceof Subscription2) {
        teardown._removeParent(this);
      }
    };
    Subscription2.EMPTY = function() {
      var empty = new Subscription2();
      empty.closed = true;
      return empty;
    }();
    return Subscription2;
  }();
  Subscription.EMPTY;
  function isSubscription(value) {
    return value instanceof Subscription || value && "closed" in value && isFunction(value.remove) && isFunction(value.add) && isFunction(value.unsubscribe);
  }
  function execFinalizer(finalizer) {
    if (isFunction(finalizer)) {
      finalizer();
    } else {
      finalizer.unsubscribe();
    }
  }
  var config = {
    Promise: void 0,
    useDeprecatedNextContext: false
  };
  var timeoutProvider = {
    setTimeout: function(handler, timeout) {
      var args = [];
      for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
      }
      return setTimeout.apply(void 0, __spreadArray([handler, timeout], __read(args)));
    },
    clearTimeout: function(handle) {
      return clearTimeout(handle);
    },
    delegate: void 0
  };
  function reportUnhandledError(err) {
    timeoutProvider.setTimeout(function() {
      {
        throw err;
      }
    });
  }
  function noop() {
  }
  function errorContext(cb) {
    {
      cb();
    }
  }
  var Subscriber = function(_super) {
    __extends(Subscriber2, _super);
    function Subscriber2(destination) {
      var _this = _super.call(this) || this;
      _this.isStopped = false;
      if (destination) {
        _this.destination = destination;
        if (isSubscription(destination)) {
          destination.add(_this);
        }
      } else {
        _this.destination = EMPTY_OBSERVER;
      }
      return _this;
    }
    Subscriber2.create = function(next, error, complete) {
      return new SafeSubscriber(next, error, complete);
    };
    Subscriber2.prototype.next = function(value) {
      if (this.isStopped) ;
      else {
        this._next(value);
      }
    };
    Subscriber2.prototype.error = function(err) {
      if (this.isStopped) ;
      else {
        this.isStopped = true;
        this._error(err);
      }
    };
    Subscriber2.prototype.complete = function() {
      if (this.isStopped) ;
      else {
        this.isStopped = true;
        this._complete();
      }
    };
    Subscriber2.prototype.unsubscribe = function() {
      if (!this.closed) {
        this.isStopped = true;
        _super.prototype.unsubscribe.call(this);
        this.destination = null;
      }
    };
    Subscriber2.prototype._next = function(value) {
      this.destination.next(value);
    };
    Subscriber2.prototype._error = function(err) {
      try {
        this.destination.error(err);
      } finally {
        this.unsubscribe();
      }
    };
    Subscriber2.prototype._complete = function() {
      try {
        this.destination.complete();
      } finally {
        this.unsubscribe();
      }
    };
    return Subscriber2;
  }(Subscription);
  var _bind = Function.prototype.bind;
  function bind(fn, thisArg) {
    return _bind.call(fn, thisArg);
  }
  var ConsumerObserver = function() {
    function ConsumerObserver2(partialObserver) {
      this.partialObserver = partialObserver;
    }
    ConsumerObserver2.prototype.next = function(value) {
      var partialObserver = this.partialObserver;
      if (partialObserver.next) {
        try {
          partialObserver.next(value);
        } catch (error) {
          handleUnhandledError(error);
        }
      }
    };
    ConsumerObserver2.prototype.error = function(err) {
      var partialObserver = this.partialObserver;
      if (partialObserver.error) {
        try {
          partialObserver.error(err);
        } catch (error) {
          handleUnhandledError(error);
        }
      } else {
        handleUnhandledError(err);
      }
    };
    ConsumerObserver2.prototype.complete = function() {
      var partialObserver = this.partialObserver;
      if (partialObserver.complete) {
        try {
          partialObserver.complete();
        } catch (error) {
          handleUnhandledError(error);
        }
      }
    };
    return ConsumerObserver2;
  }();
  var SafeSubscriber = function(_super) {
    __extends(SafeSubscriber2, _super);
    function SafeSubscriber2(observerOrNext, error, complete) {
      var _this = _super.call(this) || this;
      var partialObserver;
      if (isFunction(observerOrNext) || !observerOrNext) {
        partialObserver = {
          next: observerOrNext !== null && observerOrNext !== void 0 ? observerOrNext : void 0,
          error: error !== null && error !== void 0 ? error : void 0,
          complete: complete !== null && complete !== void 0 ? complete : void 0
        };
      } else {
        var context_1;
        if (_this && config.useDeprecatedNextContext) {
          context_1 = Object.create(observerOrNext);
          context_1.unsubscribe = function() {
            return _this.unsubscribe();
          };
          partialObserver = {
            next: observerOrNext.next && bind(observerOrNext.next, context_1),
            error: observerOrNext.error && bind(observerOrNext.error, context_1),
            complete: observerOrNext.complete && bind(observerOrNext.complete, context_1)
          };
        } else {
          partialObserver = observerOrNext;
        }
      }
      _this.destination = new ConsumerObserver(partialObserver);
      return _this;
    }
    return SafeSubscriber2;
  }(Subscriber);
  function handleUnhandledError(error) {
    {
      reportUnhandledError(error);
    }
  }
  function defaultErrorHandler(err) {
    throw err;
  }
  var EMPTY_OBSERVER = {
    closed: true,
    next: noop,
    error: defaultErrorHandler,
    complete: noop
  };
  var observable = function() {
    return typeof Symbol === "function" && Symbol.observable || "@@observable";
  }();
  function identity(x) {
    return x;
  }
  function pipeFromArray(fns) {
    if (fns.length === 0) {
      return identity;
    }
    if (fns.length === 1) {
      return fns[0];
    }
    return function piped(input) {
      return fns.reduce(function(prev, fn) {
        return fn(prev);
      }, input);
    };
  }
  var Observable = function() {
    function Observable2(subscribe) {
      if (subscribe) {
        this._subscribe = subscribe;
      }
    }
    Observable2.prototype.lift = function(operator) {
      var observable2 = new Observable2();
      observable2.source = this;
      observable2.operator = operator;
      return observable2;
    };
    Observable2.prototype.subscribe = function(observerOrNext, error, complete) {
      var _this = this;
      var subscriber = isSubscriber(observerOrNext) ? observerOrNext : new SafeSubscriber(observerOrNext, error, complete);
      errorContext(function() {
        var _a = _this, operator = _a.operator, source = _a.source;
        subscriber.add(operator ? operator.call(subscriber, source) : source ? _this._subscribe(subscriber) : _this._trySubscribe(subscriber));
      });
      return subscriber;
    };
    Observable2.prototype._trySubscribe = function(sink) {
      try {
        return this._subscribe(sink);
      } catch (err) {
        sink.error(err);
      }
    };
    Observable2.prototype.forEach = function(next, promiseCtor) {
      var _this = this;
      promiseCtor = getPromiseCtor(promiseCtor);
      return new promiseCtor(function(resolve, reject) {
        var subscriber = new SafeSubscriber({
          next: function(value) {
            try {
              next(value);
            } catch (err) {
              reject(err);
              subscriber.unsubscribe();
            }
          },
          error: reject,
          complete: resolve
        });
        _this.subscribe(subscriber);
      });
    };
    Observable2.prototype._subscribe = function(subscriber) {
      var _a;
      return (_a = this.source) === null || _a === void 0 ? void 0 : _a.subscribe(subscriber);
    };
    Observable2.prototype[observable] = function() {
      return this;
    };
    Observable2.prototype.pipe = function() {
      var operations = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        operations[_i] = arguments[_i];
      }
      return pipeFromArray(operations)(this);
    };
    Observable2.prototype.toPromise = function(promiseCtor) {
      var _this = this;
      promiseCtor = getPromiseCtor(promiseCtor);
      return new promiseCtor(function(resolve, reject) {
        var value;
        _this.subscribe(function(x) {
          return value = x;
        }, function(err) {
          return reject(err);
        }, function() {
          return resolve(value);
        });
      });
    };
    Observable2.create = function(subscribe) {
      return new Observable2(subscribe);
    };
    return Observable2;
  }();
  function getPromiseCtor(promiseCtor) {
    var _a;
    return (_a = promiseCtor !== null && promiseCtor !== void 0 ? promiseCtor : config.Promise) !== null && _a !== void 0 ? _a : Promise;
  }
  function isObserver(value) {
    return value && isFunction(value.next) && isFunction(value.error) && isFunction(value.complete);
  }
  function isSubscriber(value) {
    return value && value instanceof Subscriber || isObserver(value) && isSubscription(value);
  }
  function isInteropObservable(input) {
    return isFunction(input[observable]);
  }
  function isAsyncIterable(obj) {
    return Symbol.asyncIterator && isFunction(obj === null || obj === void 0 ? void 0 : obj[Symbol.asyncIterator]);
  }
  function createInvalidObservableTypeError(input) {
    return new TypeError("You provided " + (input !== null && typeof input === "object" ? "an invalid object" : "'" + input + "'") + " where a stream was expected. You can provide an Observable, Promise, ReadableStream, Array, AsyncIterable, or Iterable.");
  }
  function getSymbolIterator() {
    if (typeof Symbol !== "function" || !Symbol.iterator) {
      return "@@iterator";
    }
    return Symbol.iterator;
  }
  var iterator = getSymbolIterator();
  function isIterable(input) {
    return isFunction(input === null || input === void 0 ? void 0 : input[iterator]);
  }
  function readableStreamLikeToAsyncGenerator(readableStream) {
    return __asyncGenerator(this, arguments, function readableStreamLikeToAsyncGenerator_1() {
      var reader, _a, value, done;
      return __generator(this, function(_b) {
        switch (_b.label) {
          case 0:
            reader = readableStream.getReader();
            _b.label = 1;
          case 1:
            _b.trys.push([1, , 9, 10]);
            _b.label = 2;
          case 2:
            return [4, __await(reader.read())];
          case 3:
            _a = _b.sent(), value = _a.value, done = _a.done;
            if (!done) return [3, 5];
            return [4, __await(void 0)];
          case 4:
            return [2, _b.sent()];
          case 5:
            return [4, __await(value)];
          case 6:
            return [4, _b.sent()];
          case 7:
            _b.sent();
            return [3, 2];
          case 8:
            return [3, 10];
          case 9:
            reader.releaseLock();
            return [7];
          case 10:
            return [2];
        }
      });
    });
  }
  function isReadableStreamLike(obj) {
    return isFunction(obj === null || obj === void 0 ? void 0 : obj.getReader);
  }
  function innerFrom(input) {
    if (input instanceof Observable) {
      return input;
    }
    if (input != null) {
      if (isInteropObservable(input)) {
        return fromInteropObservable(input);
      }
      if (isArrayLike(input)) {
        return fromArrayLike(input);
      }
      if (isPromise(input)) {
        return fromPromise(input);
      }
      if (isAsyncIterable(input)) {
        return fromAsyncIterable(input);
      }
      if (isIterable(input)) {
        return fromIterable(input);
      }
      if (isReadableStreamLike(input)) {
        return fromReadableStreamLike(input);
      }
    }
    throw createInvalidObservableTypeError(input);
  }
  function fromInteropObservable(obj) {
    return new Observable(function(subscriber) {
      var obs = obj[observable]();
      if (isFunction(obs.subscribe)) {
        return obs.subscribe(subscriber);
      }
      throw new TypeError("Provided object does not correctly implement Symbol.observable");
    });
  }
  function fromArrayLike(array) {
    return new Observable(function(subscriber) {
      for (var i = 0; i < array.length && !subscriber.closed; i++) {
        subscriber.next(array[i]);
      }
      subscriber.complete();
    });
  }
  function fromPromise(promise) {
    return new Observable(function(subscriber) {
      promise.then(function(value) {
        if (!subscriber.closed) {
          subscriber.next(value);
          subscriber.complete();
        }
      }, function(err) {
        return subscriber.error(err);
      }).then(null, reportUnhandledError);
    });
  }
  function fromIterable(iterable) {
    return new Observable(function(subscriber) {
      var e_1, _a;
      try {
        for (var iterable_1 = __values(iterable), iterable_1_1 = iterable_1.next(); !iterable_1_1.done; iterable_1_1 = iterable_1.next()) {
          var value = iterable_1_1.value;
          subscriber.next(value);
          if (subscriber.closed) {
            return;
          }
        }
      } catch (e_1_1) {
        e_1 = { error: e_1_1 };
      } finally {
        try {
          if (iterable_1_1 && !iterable_1_1.done && (_a = iterable_1.return)) _a.call(iterable_1);
        } finally {
          if (e_1) throw e_1.error;
        }
      }
      subscriber.complete();
    });
  }
  function fromAsyncIterable(asyncIterable) {
    return new Observable(function(subscriber) {
      process(asyncIterable, subscriber).catch(function(err) {
        return subscriber.error(err);
      });
    });
  }
  function fromReadableStreamLike(readableStream) {
    return fromAsyncIterable(readableStreamLikeToAsyncGenerator(readableStream));
  }
  function process(asyncIterable, subscriber) {
    var asyncIterable_1, asyncIterable_1_1;
    var e_2, _a;
    return __awaiter(this, void 0, void 0, function() {
      var value, e_2_1;
      return __generator(this, function(_b) {
        switch (_b.label) {
          case 0:
            _b.trys.push([0, 5, 6, 11]);
            asyncIterable_1 = __asyncValues(asyncIterable);
            _b.label = 1;
          case 1:
            return [4, asyncIterable_1.next()];
          case 2:
            if (!(asyncIterable_1_1 = _b.sent(), !asyncIterable_1_1.done)) return [3, 4];
            value = asyncIterable_1_1.value;
            subscriber.next(value);
            if (subscriber.closed) {
              return [2];
            }
            _b.label = 3;
          case 3:
            return [3, 1];
          case 4:
            return [3, 11];
          case 5:
            e_2_1 = _b.sent();
            e_2 = { error: e_2_1 };
            return [3, 11];
          case 6:
            _b.trys.push([6, , 9, 10]);
            if (!(asyncIterable_1_1 && !asyncIterable_1_1.done && (_a = asyncIterable_1.return))) return [3, 8];
            return [4, _a.call(asyncIterable_1)];
          case 7:
            _b.sent();
            _b.label = 8;
          case 8:
            return [3, 10];
          case 9:
            if (e_2) throw e_2.error;
            return [7];
          case 10:
            return [7];
          case 11:
            subscriber.complete();
            return [2];
        }
      });
    });
  }
  function createOperatorSubscriber(destination, onNext, onComplete, onError, onFinalize) {
    return new OperatorSubscriber(destination, onNext, onComplete, onError, onFinalize);
  }
  var OperatorSubscriber = function(_super) {
    __extends(OperatorSubscriber2, _super);
    function OperatorSubscriber2(destination, onNext, onComplete, onError, onFinalize, shouldUnsubscribe) {
      var _this = _super.call(this, destination) || this;
      _this.onFinalize = onFinalize;
      _this.shouldUnsubscribe = shouldUnsubscribe;
      _this._next = onNext ? function(value) {
        try {
          onNext(value);
        } catch (err) {
          destination.error(err);
        }
      } : _super.prototype._next;
      _this._error = onError ? function(err) {
        try {
          onError(err);
        } catch (err2) {
          destination.error(err2);
        } finally {
          this.unsubscribe();
        }
      } : _super.prototype._error;
      _this._complete = onComplete ? function() {
        try {
          onComplete();
        } catch (err) {
          destination.error(err);
        } finally {
          this.unsubscribe();
        }
      } : _super.prototype._complete;
      return _this;
    }
    OperatorSubscriber2.prototype.unsubscribe = function() {
      var _a;
      if (!this.shouldUnsubscribe || this.shouldUnsubscribe()) {
        var closed_1 = this.closed;
        _super.prototype.unsubscribe.call(this);
        !closed_1 && ((_a = this.onFinalize) === null || _a === void 0 ? void 0 : _a.call(this));
      }
    };
    return OperatorSubscriber2;
  }(Subscriber);
  function map(project, thisArg) {
    return operate(function(source, subscriber) {
      var index = 0;
      source.subscribe(createOperatorSubscriber(subscriber, function(value) {
        subscriber.next(project.call(thisArg, value, index++));
      }));
    });
  }
  function mergeInternals(source, subscriber, project, concurrent, onBeforeNext, expand, innerSubScheduler, additionalFinalizer) {
    var buffer = [];
    var active = 0;
    var index = 0;
    var isComplete = false;
    var checkComplete = function() {
      if (isComplete && !buffer.length && !active) {
        subscriber.complete();
      }
    };
    var outerNext = function(value) {
      return active < concurrent ? doInnerSub(value) : buffer.push(value);
    };
    var doInnerSub = function(value) {
      active++;
      var innerComplete = false;
      innerFrom(project(value, index++)).subscribe(createOperatorSubscriber(subscriber, function(innerValue) {
        {
          subscriber.next(innerValue);
        }
      }, function() {
        innerComplete = true;
      }, void 0, function() {
        if (innerComplete) {
          try {
            active--;
            var _loop_1 = function() {
              var bufferedValue = buffer.shift();
              if (innerSubScheduler) ;
              else {
                doInnerSub(bufferedValue);
              }
            };
            while (buffer.length && active < concurrent) {
              _loop_1();
            }
            checkComplete();
          } catch (err) {
            subscriber.error(err);
          }
        }
      }));
    };
    source.subscribe(createOperatorSubscriber(subscriber, outerNext, function() {
      isComplete = true;
      checkComplete();
    }));
    return function() {
    };
  }
  function mergeMap(project, resultSelector, concurrent) {
    if (concurrent === void 0) {
      concurrent = Infinity;
    }
    if (isFunction(resultSelector)) {
      return mergeMap(function(a, i) {
        return map(function(b, ii) {
          return resultSelector(a, b, i, ii);
        })(innerFrom(project(a, i)));
      }, concurrent);
    } else if (typeof resultSelector === "number") {
      concurrent = resultSelector;
    }
    return operate(function(source, subscriber) {
      return mergeInternals(source, subscriber, project, concurrent);
    });
  }
  function mergeAll(concurrent) {
    return mergeMap(identity, concurrent);
  }
  function concatAll() {
    return mergeAll(1);
  }
  function concatMap(project, resultSelector) {
    return isFunction(resultSelector) ? mergeMap(project, resultSelector, 1) : mergeMap(project, 1);
  }
  class BasicQuestionHandler {
    constructor() {
      this._document = document;
      this._window = _unsafeWindow;
      this.questions = [];
      this.correctNum = 0;
      this.setting = useSettingStore();
      this.log = useLogStore();
      this.questionStore = useQuestionStore();
      this.parseHtml = () => {
        throw new Error("请使用继承类的重写方法");
      };
      this.fillQuestion = (question) => {
        throw new Error("请使用继承类的重写方法");
      };
      this.questionType = {
        "A1型选择题": "0",
        "X型选择题": "0",
        "单选题": "0",
        "单项选择题": "0",
        "单项选择": "0",
        "A1型题": "0",
        "多选题": "1",
        "多项选择题": "1",
        "多项选择": "1",
        "X型题": "1",
        "填空题": "2",
        "判断题": "3",
        "是非题": "3",
        "简答题": "4",
        "名词解释": "5",
        "论述题": "6",
        "计算题": "7",
        "连线题": "11",
        "匹配题": "11",
        "完型填空": "14",
        "完形填空题": "14",
        "阅读理解": "15",
        "单选": "0",
        "A1型": "0",
        "多选": "1",
        "填空": "2",
        "判断": "3",
        "简答": "4",
        "论述": "6",
        "计算": "7",
        "思政元素": "2"
      };
      this.questionTypeKeywordRules = [
        {
          keywords: ["单项选择", "单选"],
          type: "0"
        },
        {
          keywords: ["多项选择", "多选"],
          type: "1"
        },
        {
          keywords: ["填空", "思政元素"],
          type: "2"
        },
        {
          keywords: ["判断", "是非"],
          type: "3"
        },
        {
          keywords: ["简答"],
          type: "4"
        },
        {
          keywords: ["名词解释"],
          type: "5"
        },
        {
          keywords: ["论述"],
          type: "6"
        },
        {
          keywords: ["计算"],
          type: "7"
        },
        {
          keywords: ["连线", "匹配"],
          type: "11"
        },
        {
          keywords: ["完型填空", "完形填空"],
          type: "14"
        },
        {
          keywords: ["阅读理解"],
          type: "15"
        }
      ];
      this.removeHtml = (htmlStr, replacen = true) => {
        const textArea = document.createElement("textarea");
        textArea.innerHTML = htmlStr;
        htmlStr = textArea.value;
        htmlStr = htmlStr.replace(/[\t\r\xa0]/g, " ");
        htmlStr = htmlStr.replace(/[\u2000-\u200a]/g, " ");
        htmlStr = htmlStr.replace(/<br\s*\/?>/g, "\n");
        if (replacen) {
          htmlStr = htmlStr.replace(/<(\/)?(p|div).*?>/g, "\n");
        }
        htmlStr = htmlStr.replace(/ {2,}/g, " ");
        htmlStr = htmlStr.replace(/\n{2,}/g, "\n");
        htmlStr = htmlStr.replace(/<xmp.*?>/g, "<pre>");
        htmlStr = htmlStr.replace(/<\/xmp>/g, "</pre>");
        htmlStr = DOMPurify.sanitize(htmlStr, { ALLOWED_TAGS: ["img", "br", "sub", "sup"], ALLOWED_ATTR: ["src", "href"], ALLOW_DATA_ATTR: false, KEEP_CONTENT: true });
        htmlStr = htmlStr.replace(/<((?!img|sub|sup|br)[^>]+)>/g, "").replace(/<br\s*\/?>/g, "\n");
        let imgReg = /<img.*?src="(.*?)".*?>/g;
        let imgArr = htmlStr.match(imgReg);
        if (imgArr) {
          htmlStr = htmlStr.replace(new RegExp("<img([^>]*)(?<!\\/)>", "g"), "<img$1/>");
          imgArr.forEach((item) => {
            let src = item.match(/src="(.*?)"/);
            if (src) {
              if (src[1].indexOf("http") == -1 && !src[1].includes("data:image")) {
                if (src[1].startsWith("/")) {
                  htmlStr = htmlStr.replace(src[1], location.origin + src[1]);
                } else {
                  const fullURL = new URL(src[1], document.baseURI).href;
                  htmlStr = htmlStr.replace(src[1], fullURL);
                }
              }
            }
          });
        }
        return htmlStr.trim();
      };
      this.removeAllTags = (htmlStr) => {
        htmlStr = DOMPurify.sanitize(htmlStr, { ALLOWED_TAGS: ["img"], ALLOWED_ATTR: ["src", "href"], ALLOW_DATA_ATTR: false, KEEP_CONTENT: true });
        let imgReg = /<img.*?src="(.*?)".*?>/g;
        let imgArr = htmlStr.match(imgReg);
        if (imgArr) {
          htmlStr = htmlStr.replace(new RegExp("<img([^>]*)(?<!\\/)>", "g"), "<img$1/>");
          imgArr.forEach((item) => {
            let src = item.match(/src="(.*?)"/);
            if (src) {
              if (src[1].indexOf("http") == -1 && !src[1].includes("data:image")) {
                if (src[1].startsWith("/")) {
                  htmlStr = htmlStr.replace(src[1], location.origin + src[1]);
                } else {
                  const fullURL = new URL(src[1], document.baseURI).href;
                  htmlStr = htmlStr.replace(src[1], fullURL);
                }
              }
            }
          });
        } else {
          htmlStr = htmlStr.replace(/[\p{P}\s]/gu, "").toLowerCase();
        }
        htmlStr = htmlStr.replace(/&nbsp;|nbsp/g, "");
        return htmlStr.trim();
      };
      this.clean = (str) => {
        return str.replace(/^【.*?】\s*/, "").replace(/\s*（\d+\.\d+分）$/, "");
      };
      this.normalizeQuestionTypeText = (text = "") => {
        let normalizedText = String(text).normalize("NFKC").trim();
        normalizedText = normalizedText.replace(/<[^>]+>/g, "").replace(/[【】\[\]（）()]/g, "").replace(/[:：]/g, "").replace(/\s+/g, "").replace(/第\s*\d+\s*题/g, "").replace(/共\s*\d+(?:\.\d+)?\s*分/g, "").replace(/本题/g, "").replace(/题型/g, "").trim();
        const canonicalQuestionTypeMap = {
          "单项选择题": "单项选择",
          "单项选择": "单项选择",
          "单选题": "单项选择",
          "单选": "单项选择",
          "多项选择题": "多项选择",
          "多项选择": "多项选择",
          "多选题": "多项选择",
          "多选": "多项选择",
          "判断题": "判断",
          "判断": "判断",
          "是非题": "判断",
          "是非": "判断",
          "填空题": "填空",
          "填空": "填空",
          "简答题": "简答",
          "简答": "简答",
          "论述题": "论述",
          "论述": "论述",
          "计算题": "计算",
          "计算": "计算",
          "连线题": "连线",
          "连线": "连线",
          "匹配题": "匹配",
          "匹配": "匹配",
          "完型填空": "完形填空",
          "完形填空题": "完形填空",
          "完形填空": "完形填空",
          "阅读理解": "阅读理解"
        };
        return canonicalQuestionTypeMap[normalizedText] || normalizedText;
      };
      this.resolveQuestionType = (text = "") => {
        const normalizedText = this.normalizeQuestionTypeText(text);
        const exactQuestionTypeMap = Object.entries(this.questionType).reduce((result, [key, value]) => {
          result[this.normalizeQuestionTypeText(key)] = value;
          return result;
        }, {});
        if (exactQuestionTypeMap[normalizedText]) {
          return exactQuestionTypeMap[normalizedText];
        }
        const matchedRule = this.questionTypeKeywordRules.find(
          (rule) => rule.keywords.some((keyword) => normalizedText.includes(keyword))
        );
        return (matchedRule == null ? void 0 : matchedRule.type) || "999";
      };
      this.similarCharMap = {
        "ɑ": "α",
        // 国际音标 ɑ (U+0251) → 希腊字母 α (U+03B1)
        "Α": "A",
        // 希腊大写 Α → 拉丁大写 A
        "Β": "B",
        // 希腊大写 Β → 拉丁大写 B
        "Ε": "E",
        // 希腊大写 Ε → 拉丁大写 E
        "Ζ": "Z",
        // 希腊大写 Ζ → 拉丁大写 Z
        "Η": "H",
        // 希腊大写 Η → 拉丁大写 H
        "Ι": "I",
        // 希腊大写 Ι → 拉丁大写 I
        "Κ": "K",
        // 希腊大写 Κ → 拉丁大写 K
        "Μ": "M",
        // 希腊大写 Μ → 拉丁大写 M
        "Ν": "N",
        // 希腊大写 Ν → 拉丁大写 N
        "Ο": "O",
        // 希腊大写 Ο → 拉丁大写 O
        "Ρ": "P",
        // 希腊大写 Ρ → 拉丁大写 P
        "Τ": "T",
        // 希腊大写 Τ → 拉丁大写 T
        "Υ": "Y",
        // 希腊大写 Υ → 拉丁大写 Y
        "Χ": "X",
        // 希腊大写 Χ → 拉丁大写 X
        "ο": "o",
        // 希腊小写 ο → 拉丁小写 o
        "ν": "v"
        // 希腊小写 ν → 拉丁小写 v (有时相似)
      };
      this.clearMark = (str) => {
        let result = str;
        for (const [similar, standard] of Object.entries(this.similarCharMap)) {
          result = result.replace(new RegExp(similar, "g"), standard);
        }
        return result.replace(/[\p{P}\p{S}]/gu, "");
      };
    }
  }
  let QuestionHandler$1 = class QuestionHandler extends BasicQuestionHandler {
    constructor(type, iframe) {
      super();
      __publicField(this, "type");
      __publicField(this, "AI_ALLOW_QUESTION_TYPE", ["0", "1", "2", "3", "4", "5"]);
      __publicField(this, "answerSeparators", ["===", "#", "---", "###", "|", ";", "；"]);
      __publicField(this, "init", async () => {
        var _that = this;
        this.parseHtml();
        if (this.questions.length) {
          this.log.insertLog(
            `成功解析到${this.questions.length}个题目，开始答题..`
          );
          setTimeout(() => {
            _that.setting.tabIndex = "2";
          }, 1e3);
          const { answerMode } = this.setting.config.basicConfig;
          const mode = answerMode.value;
          for (const [index, question] of this.questions.entries()) {
            this.questionStore.currentQuestionIndex = index;
            if (mode !== "ai") {
              const answerData = await getAccurateAnswer(question);
              if (answerData.code === 1) {
                question.answer = {
                  code: 1,
                  answer: answerData.data.answer
                };
                this.setting.userInfo.remainCount = formatLocalRemainCount(answerData.data.remainCount);
                saveAnswerRecord({
                  question,
                  answer: answerData.data.answer,
                  source: "accurate"
                });
                const fillSuccess = this.fillQuestion(question);
                if (!fillSuccess) {
                  question.answer.code = 0;
                  continue;
                }
                this.correctNum += 1;
                continue;
              }
              if (mode === "questionBank" || answerData.code !== -1004) {
                question.answer = {
                  code: answerData.code,
                  answer: [answerData.msg]
                };
                continue;
              }
            }
            if (this.AI_ALLOW_QUESTION_TYPE.includes(question.type)) {
              const answerData = await getAIAnswer(question);
              if (answerData.code === 1) {
                question.answer = {
                  code: 2,
                  answer: answerData.data.answer
                };
                this.setting.userInfo.remainCount = formatLocalRemainCount(answerData.data.remainCount);
                saveAnswerRecord({
                  question,
                  answer: answerData.data.answer,
                  source: "ai"
                });
                const fillSuccess = this.fillQuestion(question);
                if (!fillSuccess) {
                  question.answer.code = 0;
                  continue;
                }
                this.correctNum += 1;
              } else {
                question.answer = {
                  code: answerData.code,
                  answer: [answerData.msg]
                };
              }
            } else {
              question.answer = {
                code: -1,
                answer: ["该题型不支持AI答题"]
              };
            }
          }
          this.questionStore.currentQuestionIndex += 1;
        } else
          this.log.insertLog(
            "没有解析到题目，请检查是否进入正确页面...",
            "warning"
          );
        setTimeout(() => {
          _that.setting.tabIndex = "1";
        }, 2e3);
        if (this.questions.length === 0) return Promise.resolve("0");
        return Promise.resolve(
          (this.correctNum / this.questions.length * 100).toFixed(1)
        );
      });
      __publicField(this, "parseHtml", () => {
        this.questionStore.currentQuestionIndex = 0;
        if (!this._document) return [];
        if (["zj"].includes(this.type)) {
          const questionElements = this._document.querySelectorAll(".TiMu");
          this.addQuestions(questionElements);
        } else if (["zy", "ks"].includes(this.type)) {
          const questionElements = this._document.querySelectorAll(".questionLi");
          this.addQuestions(questionElements);
        }
        this.questionStore.questionList = this.questions;
      });
      __publicField(this, "getChoiceOptionContainer", (optionElement) => {
        if (!optionElement) return null;
        if (["ks"].includes(this.type)) {
          return optionElement.closest(".answerBg") || optionElement;
        }
        return optionElement;
      });
      __publicField(this, "getCxQuestionTypeFromCode", (code) => {
        if (Number.isNaN(code)) return "";
        if (code === 0) return "0";
        if (code === 1) return "1";
        if (code === 3) return "3";
        if ([2, 4, 5, 6, 7, 8, 9, 10].includes(code)) return "2";
        if (code === 11) return "11";
        if (code === 14) return "14";
        if (code === 15) return "15";
        return "";
      });
      __publicField(this, "getCxQuestionTypeInput", (element) => {
        if (!element) return null;
        if (["ks"].includes(this.type)) {
          return element.querySelector('input[name^="type"]');
        }
        return element.querySelector('input[id^="answertype"]');
      });
      __publicField(this, "resolveCxQuestionType", (element, questionTypeText) => {
        const typeInput = this.getCxQuestionTypeInput(element);
        const typeFromCode = this.getCxQuestionTypeFromCode(
          Number.parseInt((typeInput == null ? void 0 : typeInput.value) || "", 10)
        );
        if (typeFromCode) return typeFromCode;
        return this.resolveQuestionType(questionTypeText);
      });
      __publicField(this, "isChoiceOptionSelected", (optionElement) => {
        const optionContainer = this.getChoiceOptionContainer(optionElement);
        if (!optionContainer) return false;
        if (["zj", "zy"].includes(this.type)) {
          return optionContainer.getAttribute("aria-checked") === "true";
        }
        if (["ks"].includes(this.type)) {
          return Boolean(
            optionContainer.querySelector(".check_answer, .check_answer_dx")
          );
        }
        return false;
      });
      __publicField(this, "selectChoiceOption", (optionElement) => {
        const optionContainer = this.getChoiceOptionContainer(optionElement);
        if (!optionContainer) return false;
        if (this.isChoiceOptionSelected(optionContainer)) return true;
        optionContainer == null ? void 0 : optionContainer.click();
        return true;
      });
      __publicField(this, "splitAnswer", (answer = "") => {
        const normalizedAnswer = String(answer || "").trim();
        if (!normalizedAnswer) return [];
        for (const separator of this.answerSeparators) {
          if (normalizedAnswer.includes(separator)) {
            return normalizedAnswer.split(separator).map((item) => item.trim()).filter(Boolean);
          }
        }
        return [normalizedAnswer];
      });
      __publicField(this, "buildAnswerGroups", (answers = []) => {
        if (!Array.isArray(answers)) return [this.splitAnswer(answers)];
        if (answers.length === 1) return [this.splitAnswer(answers[0])];
        const normalizedAnswers = answers.map((answer) => String(answer || "").trim()).filter(Boolean);
        const groups = [normalizedAnswers];
        normalizedAnswers.forEach((answer) => {
          const splitAnswers = this.splitAnswer(answer);
          if (splitAnswers.length > 1) groups.push(splitAnswers);
        });
        return groups;
      });
      __publicField(this, "findElementByAttr", (root, selector, attrName, attrValue) => {
        return [...root.querySelectorAll(selector)].find(
          (element) => element.getAttribute(attrName) === attrValue
        );
      });
      __publicField(this, "fillLineQuestion", (question) => {
        const answerGroups = this.buildAnswerGroups(question.answer.answer);
        const selectBoxes = question.element.querySelectorAll(
          ".line_answer_ct .selectBox, .thirdUlList .dept_select"
        );
        const answerInputs = question.element.querySelectorAll(
          ".line_answer input[name^='answer']"
        );
        if (!selectBoxes.length) return false;
        for (const answers of answerGroups) {
          if (!answers.length) continue;
          if (answerInputs.length && answers.length !== selectBoxes.length) continue;
          if (!answerInputs.length && answers.length !== selectBoxes.length) continue;
          let filledCount = 0;
          selectBoxes.forEach((box, index) => {
            var _a, _b;
            const answer = answers[index];
            if (!answer) return;
            const optionItem = this.findElementByAttr(box, "li[data]", "data", answer);
            const optionLink = optionItem == null ? void 0 : optionItem.querySelector("a");
            if (optionLink) {
              optionLink.click();
              filledCount += 1;
              return;
            }
            const selectOption = this.findElementByAttr(
              box,
              "option[value]",
              "value",
              answer
            );
            if (!selectOption) return;
            (_a = box.querySelector("option[selected]")) == null ? void 0 : _a.removeAttribute("selected");
            selectOption.setAttribute("selected", "");
            box.value = answer;
            const selectedText = (_b = box.parentElement) == null ? void 0 : _b.querySelector(".chosen-single span");
            if (selectedText) selectedText.textContent = answer;
            filledCount += 1;
          });
          if (filledCount === selectBoxes.length) return true;
        }
        return false;
      });
      __publicField(this, "fillCompositeChoiceQuestion", (question, containerSelector) => {
        const answerGroups = this.buildAnswerGroups(question.answer.answer);
        const containers = question.element.querySelectorAll(containerSelector);
        if (!containers.length) return false;
        for (const answers of answerGroups) {
          if (!answers.length) continue;
          let filledCount = 0;
          answers.forEach((answer, index) => {
            const container = containers[index];
            if (!container || !answer) return;
            const option = this.findElementByAttr(
              container,
              "span.saveSingleSelect[data]",
              "data",
              answer
            );
            if (!option) return;
            option.click();
            filledCount += 1;
          });
          if (filledCount > 0) return true;
        }
        return false;
      });
      __publicField(this, "fillQuestion", (question) => {
        var _a;
        if (!this._window) return false;
        let filled = false;
        if (question.type === "0" || question.type === "1") {
          question.answer.answer.forEach((answer) => {
            const clearAnswer = this.removeHtml(answer);
            let isSelected = false;
            for (const key in question.options) {
              if (key === clearAnswer) {
                isSelected = this.selectChoiceOption(question.options[key]);
                break;
              }
            }
            if (!isSelected) {
              for (const key in question.options) {
                const clearKey = this.clearMark(key);
                if (clearKey === this.clearMark(clearAnswer)) {
                  isSelected = this.selectChoiceOption(question.options[key]);
                  break;
                }
              }
            }
            if (isSelected) filled = true;
          });
        } else if (question.type === "2") {
          const textareaElements = question.element.querySelectorAll("textarea");
          if (textareaElements.length === 0) return false;
          textareaElements.forEach((textareaElement, index) => {
            try {
              const ueditor = this._window.UE.getEditor(textareaElement.name);
              ueditor.setContent(question.answer.answer[index]);
              filled = true;
            } catch (e) {
              textareaElement.value = "";
            }
          });
        } else if (question.type === "3") {
          let answer = "true";
          if (question.answer.answer[0].match(
            /(^|,)(正确|是|对|√|T|ri|right|true)(,|$)/
          )) {
            answer = "true";
          } else if (question.answer.answer[0].match(
            /(^|,)(错误|否|错|×|F|wr|wrong|false)(,|$)/
          )) {
            answer = "false";
          }
          const trueOrFalse = {
            true: "对",
            false: "错"
          };
          for (const key in question.options) {
            if (["zj", "zy"].includes(this.type)) {
              if ((_a = question.options[key].getAttribute("aria-label")) == null ? void 0 : _a.includes(`${trueOrFalse[answer]}选择`)) {
                filled = this.selectChoiceOption(question.options[key]);
                break;
              }
            } else if (["ks"].includes(this.type)) {
              const optionElement = question.options[key].querySelector(
                `span[data='${answer}']`
              );
              if (!optionElement) continue;
              filled = this.selectChoiceOption(optionElement);
              break;
            }
          }
        } else if (question.type === "4" || question.type === "5" || question.type === "6") {
          const textareaElement = question.element.querySelector("textarea");
          if (!textareaElement) return false;
          const ueditor = this._window.UE.getEditor(textareaElement.name);
          ueditor.setContent(question.answer.answer[0]);
          filled = true;
        } else if (question.type === "11") {
          filled = this.fillLineQuestion(question);
        } else if (question.type === "14") {
          filled = this.fillCompositeChoiceQuestion(question, ".filling_answer");
        } else if (question.type === "15") {
          filled = this.fillCompositeChoiceQuestion(question, ".reading_answer");
        } else {
          this.log.insertLog(
            `异常题型:type:${question.type}，请联系客服..`,
            "warning"
          );
          this.setting.tabIndex = "1";
          return false;
        }
        return filled;
      });
      __publicField(this, "addQuestions", (questionElements) => {
        questionElements.forEach((element) => {
          var _a, _b, _c, _d;
          let questionTitle = "";
          let questionTypeText = "";
          let optionElements;
          let optionsObject = {};
          let optionTexts = [];
          if (["zj"].includes(this.type)) {
            questionTitle = this.removeHtml(
              ((_a = element.querySelector(".fontLabel")) == null ? void 0 : _a.innerHTML) || ""
            );
            questionTypeText = this.removeHtml(
              ((_b = element.querySelector(".newZy_TItle")) == null ? void 0 : _b.innerHTML) || ""
            );
            optionElements = element.querySelectorAll('[class*="before-after"]');
            [optionsObject, optionTexts] = this.extractOptions(
              optionElements,
              ".fl.after"
            );
          } else if (["zy", "ks"].includes(this.type)) {
            const titleElement = ((_c = element == null ? void 0 : element.querySelector("h3")) == null ? void 0 : _c.innerHTML) || "";
            const colorShallowElement = ((_d = element.querySelector(".colorShallow")) == null ? void 0 : _d.outerHTML) || "";
            if (["zy"].includes(this.type)) {
              questionTypeText = (element == null ? void 0 : element.getAttribute("typename")) || "";
            } else if (["ks"].includes(this.type)) {
              questionTypeText = this.removeHtml(colorShallowElement).slice(1, 4) || "";
            }
            questionTitle = this.removeHtml(
              titleElement.split(colorShallowElement || "")[1] || ""
            );
            optionElements = element.querySelectorAll(".answerBg");
            [optionsObject, optionTexts] = this.extractOptions(
              optionElements,
              ".answer_p"
            );
          }
          const resolvedQuestionType = this.resolveCxQuestionType(
            element,
            questionTypeText
          );
          if (["14", "15"].includes(resolvedQuestionType)) {
            [optionsObject, optionTexts] = this.extractCompositeChoiceOptions(
              element,
              resolvedQuestionType
            );
          }
          if (resolvedQuestionType === "999") {
            this.log.insertLog(
              `未识别题型：${questionTypeText || "空题型"}，请反馈给开发者补充规则..`,
              "warning"
            );
          }
          this.questions.push({
            element,
            type: resolvedQuestionType,
            title: this.clean(questionTitle),
            optionsText: optionTexts,
            options: optionsObject,
            answer: { code: -1, answer: [] },
            workType: this.type,
            refer: this._window.location.href
          });
        });
      });
      this.type = type;
      if (iframe) {
        this._document = iframe.contentDocument;
        this._window = iframe.contentWindow;
      }
    }
    extractOptions(optionElements, optionSelector) {
      const optionsObject = {};
      const optionTexts = [];
      optionElements.forEach((optionElement) => {
        var _a;
        const optionTextContent = this.removeHtml(
          ((_a = optionElement.querySelector(optionSelector)) == null ? void 0 : _a.innerHTML) || ""
        );
        optionsObject[optionTextContent] = optionElement;
        optionTexts.push(optionTextContent);
      });
      return [optionsObject, optionTexts];
    }
    extractCompositeChoiceOptions(element, questionType) {
      const optionsObject = {};
      const optionTexts = [];
      const containerSelector = questionType === "14" ? ".filling_answer" : ".reading_answer";
      const optionElements = element.querySelectorAll(
        `${containerSelector} span.saveSingleSelect`
      );
      optionElements.forEach((optionElement) => {
        const optionTextContent = this.removeHtml(optionElement.innerHTML || "");
        if (!optionTextContent) return;
        optionsObject[optionTextContent] = optionElement;
        optionTexts.push(optionTextContent);
      });
      return [optionsObject, optionTexts];
    }
  };
  class IframeUtils {
    static getIframes(element) {
      return Array.from(element.querySelectorAll("iframe"));
    }
    static getAllNestedIframes(element) {
      const iframes = IframeUtils.getIframes(element);
      if (iframes.length === 0) {
        return rxjs.of([]);
      } else {
        return rxjs.from(iframes).pipe(
          mergeMap(
            (iframe) => new rxjs.Observable((subscriber) => {
              if (iframe.contentDocument) {
                const iframeDocument = iframe.contentDocument;
                const nestedIframes = IframeUtils.getAllNestedIframes(
                  iframeDocument.documentElement
                );
                nestedIframes.subscribe((nestedIframes2) => {
                  subscriber.next([iframe, ...nestedIframes2]);
                  subscriber.complete();
                });
              } else {
                subscriber.next([]);
                subscriber.complete();
              }
            })
          ),
          concatAll(),
          rxjs.toArray()
        );
      }
    }
  }
  const hookVedio = (video, playbackRate = 2) => {
    const log = useLogStore();
    function applyHookToVideo(video2) {
      try {
        video2.playbackRate = playbackRate;
      } catch (e) {
        log.insertLog(`[hook] 设置播放速度失败: ${e.message}`);
      }
      try {
        Object.defineProperty(video2, "playbackRate", {
          configurable: true,
          get: () => playbackRate,
          set: () => {
          }
          // 阻止外部修改
        });
      } catch (e) {
        log.insertLog(`[hook] 无法锁定 playbackRate: ${e.message}`);
      }
    }
    applyHookToVideo(video);
  };
  const FACE_CHECK_INTERVAL_SECONDS = 3;
  const FACE_RECOGNITION_TEXTS = [
    "人脸信息采集",
    "采集人脸信息",
    "请使用手机APP采集人脸信息后继续学习",
    "请扫描下方二维码进入"
  ];
  const GENERIC_FACE_RECOGNITION_TEXTS = [
    "人脸识别",
    "继续学习"
  ];
  let activeWaitPromise = null;
  const getTopDocument = () => {
    var _a, _b;
    try {
      return ((_a = window.top) == null ? void 0 : _a.document) || document;
    } catch {
      try {
        if (typeof unsafeWindow !== "undefined") {
          return ((_b = unsafeWindow.top) == null ? void 0 : _b.document) || document;
        }
      } catch {
        return document;
      }
    }
    return document;
  };
  const isVisible$1 = (element) => {
    var _a;
    if (!element) return false;
    const style = (_a = element.ownerDocument.defaultView) == null ? void 0 : _a.getComputedStyle(element);
    if (style && (style.display === "none" || style.visibility === "hidden")) {
      return false;
    }
    return element.offsetParent !== null || element.getClientRects().length > 0;
  };
  const getSearchDocuments = (extraDocuments = []) => {
    const docs = [];
    const queue = [getTopDocument(), document, ...extraDocuments].filter(Boolean);
    const seen = /* @__PURE__ */ new Set();
    while (queue.length) {
      const doc = queue.shift();
      if (!doc || seen.has(doc)) continue;
      seen.add(doc);
      docs.push(doc);
      try {
        Array.from(doc.querySelectorAll("iframe")).forEach((iframe) => {
          if (iframe.contentDocument) queue.push(iframe.contentDocument);
        });
      } catch {
      }
    }
    return docs;
  };
  const hasLegacyFaceRecognition = (doc) => {
    return Array.from(doc.querySelectorAll("#fcqrimg")).some((element) => {
      return Boolean(element.getAttribute("src")) && isVisible$1(element);
    });
  };
  const hasNewFaceRecognition = (doc) => {
    return Array.from(doc.querySelectorAll(".chapterVideoFaceMaskDiv")).some(isVisible$1);
  };
  const hasFaceRecognitionText = (doc) => {
    var _a, _b;
    const bodyText = ((_a = doc.body) == null ? void 0 : _a.innerText) || ((_b = doc.body) == null ? void 0 : _b.textContent) || "";
    if (FACE_RECOGNITION_TEXTS.some((keyword) => bodyText.includes(keyword))) {
      return true;
    }
    const visibleElements = Array.from(
      doc.querySelectorAll("div, section, article, body")
    ).filter(isVisible$1);
    return visibleElements.some((element) => {
      const text = element.innerText || element.textContent || "";
      const hasFaceText = GENERIC_FACE_RECOGNITION_TEXTS.some(
        (keyword) => text.includes(keyword)
      );
      const hasQRCode = Boolean(element.querySelector("canvas, img, svg"));
      return hasFaceText && (hasQRCode || text.includes("人脸"));
    });
  };
  const hasCxFaceRecognition = (extraDocuments = []) => {
    return getSearchDocuments(extraDocuments).some((doc) => {
      return hasLegacyFaceRecognition(doc) || hasNewFaceRecognition(doc) || hasFaceRecognitionText(doc);
    });
  };
  const waitForCxFaceRecognition = async ({
    log,
    setting,
    messageStore,
    extraDocuments = []
  } = {}) => {
    if (!hasCxFaceRecognition(extraDocuments)) return;
    if (activeWaitPromise) return activeWaitPromise;
    activeWaitPromise = (async () => {
      var _a, _b, _c;
      const message2 = "检测到人脸识别，请手动完成后脚本会继续运行。";
      log == null ? void 0 : log.insertLog(message2, "warning", 4);
      if ((_c = (_b = (_a = setting == null ? void 0 : setting.config) == null ? void 0 : _a.cxConfig) == null ? void 0 : _b.faceRecognitionNotify) == null ? void 0 : _c.value) {
        messageStore == null ? void 0 : messageStore.insertMessage(message2, "warning");
      }
      while (hasCxFaceRecognition(extraDocuments)) {
        await sleep(FACE_CHECK_INTERVAL_SECONDS);
      }
      log == null ? void 0 : log.insertLog("人脸识别已完成，继续处理当前任务。");
    })();
    try {
      return await activeWaitPromise;
    } finally {
      activeWaitPromise = null;
    }
  };
  const cxChapterLogic = () => {
    const log = useLogStore();
    const init = () => {
      const currentUrl = window.location.href;
      if (!currentUrl.includes("&mooc2=1")) {
        window.location.href = currentUrl + "&mooc2=1";
      }
    };
    log.insertLog("进入学习页面，脚本开始工作中..");
    const setting = useSettingStore();
    const questionStore = useQuestionStore();
    const messageStore = useMessageStore();
    const setupFaceRecognitionWatcher = () => {
      setInterval(async () => {
        await waitForCxFaceRecognition({
          log,
          setting,
          messageStore
        });
      }, 3e3);
    };
    const processIframeTask = () => {
      const documentElement = document.documentElement;
      const iframe = documentElement.querySelector("iframe");
      if (!iframe) {
        console.warn("No iframe found.");
        return;
      }
      watchIframe(documentElement);
      iframe.addEventListener("load", function() {
        watchIframe(documentElement);
      });
    };
    const waitIframeLoad = async (iframe) => {
      return new Promise((resolve) => {
        const intervalId = setInterval(async () => {
          var _a;
          if (iframe.contentDocument && ((_a = iframe.contentDocument) == null ? void 0 : _a.readyState) == "complete") {
            resolve();
            clearInterval(intervalId);
          }
        }, 500);
      });
    };
    const hideCxWorkConfirmPopup = () => {
      var _a, _b, _c;
      try {
        const topWindow = typeof unsafeWindow !== "undefined" ? unsafeWindow.top : window.top;
        const topDocument = (topWindow == null ? void 0 : topWindow.document) || document;
        (_c = (_b = (_a = topWindow == null ? void 0 : topWindow.$) == null ? void 0 : _a.call(topWindow, "#workpop")) == null ? void 0 : _b.hide) == null ? void 0 : _c.call(_b);
        const workPopup = topDocument.querySelector("#workpop");
        if (workPopup) {
          workPopup.style.display = "none";
        }
      } catch (error) {
        console.warn("hide work popup failed.", error);
      }
    };
    const processWork = async (iframe, iframeDocument, iframeWindow) => {
      var _a;
      const workName = ((_a = iframeDocument.documentElement.querySelector(
        "#RightCon > div.radiusBG > div > div.ceyan_name>h3"
      )) == null ? void 0 : _a.innerText) || "未知测验";
      log.insertLog(`发现测验：${workName}，正在解析..`);
      return new Promise(async (resolve) => {
        if (!iframeDocument) return resolve();
        if (iframeDocument.documentElement.innerText.includes("已完成") || iframeDocument.documentElement.innerText.includes("待批阅")) {
          log.insertLog("测验已经完成，跳转中..");
          return resolve();
        }
        decrypt(iframeDocument);
        if (!setting.config.basicConfig.autoAnswer.value) {
          log.insertLog(
            `自动答题已关闭，请前往<span class='module'>设置</span>模块中更改`
          );
          return resolve();
        }
        questionStore.accuracy = -1;
        const accuracy = await new QuestionHandler$1("zj", iframe).init();
        questionStore.accuracy = accuracy;
        iframeWindow.alert = () => {
        };
        if (setting.config.basicConfig.autoSubmit.value) {
          log.insertLog("自动提交已开启，提交中...");
          if (accuracy < Number(setting.config.basicConfig.accuracy.value)) {
            log.insertLog(
              `正确率小于${setting.config.basicConfig.accuracy.value}%，暂存，如需调整正确率请前往<span class='module'>设置</span>模块中更改`,
              "warning",
              4
            );
            await iframeWindow.noSubmit();
          } else {
            log.insertLog(
              `正确率大于${setting.config.basicConfig.accuracy.value}%，提交中...`
            );
            await iframeWindow.btnBlueSubmit();
            await sleep(setting.config.basicConfig.reqIntervalTime.value / 2);
            await iframeWindow.submitCheckTimes();
            hideCxWorkConfirmPopup();
            log.insertLog("提交成功");
          }
        } else {
          log.insertLog(
            "自动提交未开启，已暂存，可前往<span class='module'>设置</span>模块中更改",
            "warning",
            4
          );
          await iframeWindow.noSubmit();
        }
        return resolve();
      });
    };
    const setupInterceptor = () => {
      let currentUrl = window.location.href;
      setInterval(() => {
        if (currentUrl !== window.location.href) {
          currentUrl = window.location.href;
          processIframeTask();
        }
      }, 2e3);
    };
    const changeToNextChapter = async (documentElement) => {
      var _a, _b;
      const nextBtn = documentElement.querySelector("#prevNextFocusNext");
      if (!nextBtn || nextBtn.style.display === "none") {
        log.insertLog(`已是最后一个章节，无法跳转`);
        return;
      }
      await sleep(setting.config.basicConfig.reqIntervalTime.value);
      try {
        const topWindow = (unsafeWindow == null ? void 0 : unsafeWindow.top) || window.top;
        const topDocument = (topWindow == null ? void 0 : topWindow.document) || document;
        const curCourseId = topDocument.querySelector("#curCourseId");
        const curChapterId = topDocument.querySelector("#curChapterId");
        const curClazzId = topDocument.querySelector("#curClazzId");
        const taskTabs = topDocument.querySelectorAll("#prev_tab .prev_ul li");
        if (((_a = topWindow == null ? void 0 : topWindow.PCount) == null ? void 0 : _a.next) && (curCourseId == null ? void 0 : curCourseId.value) && (curChapterId == null ? void 0 : curChapterId.value) && (curClazzId == null ? void 0 : curClazzId.value)) {
          topWindow._preChapterId = curChapterId.value;
          (_b = topDocument.querySelector(".posCatalog_active")) == null ? void 0 : _b.scrollIntoView({ behavior: "smooth", block: "center" });
          await sleep(0.2);
          topWindow.PCount.next(
            taskTabs.length.toString(),
            curChapterId.value,
            curCourseId.value,
            curClazzId.value,
            ""
          );
          return;
        }
      } catch (error) {
        console.warn("PCount.next failed, fallback to nextChapter button.", error);
      }
      const nextChapterBtn = document.querySelector(
        ".jb_btn.jb_btn_92.fr.fs14.nextChapter"
      );
      if (nextChapterBtn) {
        nextChapterBtn.click();
      } else {
        log.insertLog(`未找到下一章节按钮，请尝试手动切换`, "warning", 4);
      }
    };
    let currentWatchIframeTaskId = 0;
    const watchIframe = (documentElement) => {
      const thisTaskId = ++currentWatchIframeTaskId;
      IframeUtils.getAllNestedIframes(documentElement).subscribe((allIframes) => {
        rxjs.from(allIframes).pipe(concatMap((iframe) => processIframe(iframe))).subscribe({
          complete: async () => {
            var _a, _b;
            const chapterName = ((_a = documentElement.querySelector(
              ".posCatalog_select.posCatalog_active>.posCatalog_name"
            )) == null ? void 0 : _a.innerText) || "未知章节";
            const currentTaskName = ((_b = document.querySelector(".prev_ul > li.active .spanText")) == null ? void 0 : _b.textContent.trim()) || "";
            if (thisTaskId === currentWatchIframeTaskId) {
              log.insertLog(`任务点 ${chapterName}-${currentTaskName} 已完成，即将跳转`);
              if (setting.config.basicConfig.autoChangeChapter.value) {
                await changeToNextChapter(documentElement);
              } else {
                log.insertLog(
                  `自动切换章节未开启，前往<span class='module'>设置</span>模块中更改`,
                  "warning",
                  4
                );
              }
            }
          }
        });
      });
    };
    const processPpt = (iframeWindow) => {
      return new Promise((resolve) => {
        const iframe = iframeWindow.document.querySelector("#panView");
        log.insertLog("发现一个PPT，正在解析...");
        const startScrolling = async () => {
          const pptWindow = iframe.contentWindow;
          const scrollHeight = pptWindow.document.body.scrollHeight;
          await pptWindow.scrollTo({
            top: scrollHeight,
            behavior: "smooth"
          });
          log.insertLog("阅读完成");
          resolve();
        };
        const checkReadyState = () => {
          if (iframe.contentWindow.document.readyState === "complete") {
            startScrolling();
          } else {
            setTimeout(checkReadyState, 100);
          }
        };
        checkReadyState();
      });
    };
    const processBook = async (iframeWindow) => {
      log.insertLog("发现一个电子书，正在解析");
      unsafeWindow.top.onchangepage(iframeWindow.getFrameAttr("end"));
      log.insertLog("阅读完成");
      return Promise.resolve();
    };
    const setupVideoQuizHandler = (iframeDocument) => {
      const intervalId = setInterval(() => {
        const quizContainer = iframeDocument.querySelector(".ans-timelineobjects");
        if (!quizContainer || quizContainer.offsetParent === null) return;
        const submitBtn = iframeDocument.querySelector("#videoquiz-submit");
        if (!submitBtn || submitBtn.style.display === "none" || submitBtn.offsetParent === null) return;
        quizContainer.style.display = "none";
        const quizBg = iframeDocument.querySelector(".ans-timelineobjectsbg");
        if (quizBg) quizBg.style.display = "none";
        log.insertLog("检测到视频弹题，已跳过。");
        const video = iframeDocument.querySelector("video");
        if (video) video.play();
      }, 2e3);
      return intervalId;
    };
    const isVideoPlaybackRateDisabled = (iframeDocument) => {
      const menuItems = iframeDocument.querySelectorAll(
        ".vjs-playback-rate .vjs-menu-content .vjs-menu-item"
      );
      return menuItems.length === 0;
    };
    const processMedia = async (mediaType, iframeDocument, iframe) => {
      return new Promise((resolve) => {
        const userRate = setting.config.basicConfig.videoPlayrate.value;
        const isRateDisabled = mediaType === "video" && isVideoPlaybackRateDisabled(iframeDocument);
        const finalRate = isRateDisabled ? 1 : userRate;
        log.insertLog(`发现一个${mediaType},正在播放${mediaType}..`);
        let isExecuted = false;
        let isSpeedRestored = false;
        let hasPlaybackEnded = false;
        let isResolved = false;
        let observer = null;
        let quizHandlerId = null;
        if (isRateDisabled && userRate > 1) {
          log.insertLog(
            "视频禁止倍速，已临时调整为1倍速，强制倍速回导致任务点无法完成。"
          );
        }
        log.insertLog(`播放成功，当前视频播放倍速为${finalRate}x.`);
        const intervalId = setInterval(async () => {
          const mediaElement = iframeDocument.documentElement.querySelector(mediaType);
          if (mediaElement && !isExecuted) {
            isExecuted = true;
            await waitForCxFaceRecognition({
              log,
              setting,
              messageStore,
              extraDocuments: [iframeDocument]
            });
            await mediaElement.pause();
            mediaElement.muted = true;
            await mediaElement.play();
            hookVedio(mediaElement, finalRate);
            if (mediaType === "video") {
              quizHandlerId = setupVideoQuizHandler(iframeDocument);
            }
            const listener = async () => {
              if (hasPlaybackEnded || isResolved) return;
              await waitForCxFaceRecognition({
                log,
                setting,
                messageStore,
                extraDocuments: [iframeDocument]
              });
              await sleep(1);
              await mediaElement.play();
            };
            mediaElement.addEventListener("pause", listener);
            const timeUpdateHandler = () => {
              if (!isSpeedRestored && mediaElement.duration - mediaElement.currentTime < 10) {
                isSpeedRestored = true;
                delete mediaElement.playbackRate;
                hookVedio(mediaElement, 1);
              }
            };
            if (finalRate > 1) {
              mediaElement.addEventListener("timeupdate", timeUpdateHandler);
            }
            const cleanup = () => {
              mediaElement.removeEventListener("pause", listener);
              mediaElement.removeEventListener("timeupdate", timeUpdateHandler);
              if (quizHandlerId) {
                clearInterval(quizHandlerId);
                quizHandlerId = null;
              }
              if (observer) {
                observer.disconnect();
                observer = null;
              }
            };
            const finishTask = () => {
              if (isResolved) return;
              isResolved = true;
              cleanup();
              resolve();
            };
            mediaElement.addEventListener("ended", async () => {
              hasPlaybackEnded = true;
              log.insertLog(`${mediaType}已播放完成，等待任务点完成`);
            });
            if (iframe && iframe.parentElement) {
              observer = new MutationObserver(() => {
                const parentElement = iframe.parentElement;
                if (parentElement.classList.contains("ans-job-finished")) {
                  log.insertLog(`${mediaType}任务点已完成，停止播放`);
                  mediaElement.pause();
                  finishTask();
                }
              });
              observer.observe(iframe.parentElement, {
                attributes: true,
                attributeFilter: ["class"],
                subtree: true
              });
              if (iframe.parentElement.classList.contains("ans-job-finished")) {
                log.insertLog(`${mediaType}任务点已完成，停止播放`);
                mediaElement.pause();
                finishTask();
              }
            }
            clearInterval(intervalId);
          }
        }, 2500);
      });
    };
    const processIframe = async (iframe) => {
      var _a, _b;
      const iframeSrc = iframe.src;
      const iframeDocument = iframe.contentDocument;
      const iframeWindow = iframe.contentWindow;
      if (!iframeDocument || !iframeWindow) return Promise.resolve();
      if (iframeSrc.includes("javascript:")) return Promise.resolve();
      await waitIframeLoad(iframe);
      const parentClass = ((_a = iframe.parentElement) == null ? void 0 : _a.className) || "";
      if (parentClass.includes("ans-job-finished")) ;
      else {
        if (iframeSrc.includes("api/work")) {
          selectTextSearchLogic(iframeDocument, iframeWindow);
          return processWork(iframe, iframeDocument, iframeWindow);
        }
        const ansJobIcon = (_b = iframe.parentElement) == null ? void 0 : _b.querySelector(".ans-job-icon");
        if (ansJobIcon) {
          if (iframeSrc.includes("video")) {
            return processMedia("video", iframeDocument, iframe);
          } else if (iframeSrc.includes("audio")) {
            return processMedia("audio", iframeDocument, iframe);
          } else if (["ppt", "doc", "pptx", "docx", "pdf"].some(
            (type) => iframeSrc.includes("modules/" + type)
          )) {
            return processPpt(iframeWindow);
          } else if (["innerbook"].some((type) => iframeSrc.includes("modules/" + type))) {
            return processBook(iframeWindow);
          }
        }
      }
      return Promise.resolve();
    };
    init();
    setupFaceRecognitionWatcher();
    processIframeTask();
    setupInterceptor();
  };
  const cxHomeworkLogic = async () => {
    const log = useLogStore();
    const questionStore = useQuestionStore();
    const setting = useSettingStore();
    log.insertLog(`进入新版作业页面，开始准备答题..`);
    if (!setting.config.basicConfig.autoAnswer.value) {
      log.insertLog(
        `自动答题已关闭，请前往<span class='module'>设置</span>模块中更改`
      );
      return;
    }
    questionStore.accuracy = -1;
    const accuracy = await new QuestionHandler$1("zy").init();
    questionStore.accuracy = accuracy;
    log.insertLog(
      `答题完毕,正确率为${accuracy}%,详情请前往<span class='module'>答题</span>模块查看..`
    );
  };
  const isPreviewDisabled = () => {
    var _a, _b;
    return (_b = (_a = document.querySelector(".mark_info")) == null ? void 0 : _a.textContent) == null ? void 0 : _b.includes("不允许整卷预览");
  };
  const isVisible = (element) => {
    if (!element) return false;
    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
  };
  const getVisibleElement = (selector) => [...document.querySelectorAll(selector)].find(isVisible);
  const getNextQuestionBtn = () => getVisibleElement('[onclick="getTheNextQuestion(1)"]');
  const getSubmitConfirmBtn = () => {
    const selectors = [
      ".popBottom a[onclick*='answerDirectSubmit']",
      "a[onclick*='answerDirectSubmit']",
      "a.confirm[onclick*='finalSubmit']"
    ];
    for (const selector of selectors) {
      const confirmBtn = getVisibleElement(selector);
      if (confirmBtn) return confirmBtn;
    }
    return null;
  };
  const waitForSubmitConfirmBtn = async () => {
    for (let i = 0; i < 10; i++) {
      const confirmBtn = getSubmitConfirmBtn();
      if (confirmBtn) return confirmBtn;
      await sleep(0.5);
    }
    return null;
  };
  const submitCxExam = async (log, setting) => {
    if (!setting.config.examConfig.autoSubmit.value) {
      log.insertLog(
        "自动交卷未开启，请前往<span class='module'>设置</span>模块中更改",
        "warning",
        4
      );
      return;
    }
    log.insertLog("自动交卷已开启，正在提交试卷");
    await sleep(setting.config.basicConfig.reqIntervalTime.value);
    const submitBtn = getVisibleElement("div.sub-button.fr a.completeBtn");
    if (!submitBtn) {
      log.insertLog("未找到交卷按钮，请手动交卷", "warning", 4);
      return;
    }
    submitBtn.click();
    const confirmBtn = await waitForSubmitConfirmBtn();
    if (confirmBtn) {
      confirmBtn.click();
      log.insertLog("已确认提交试卷");
      return;
    }
    log.insertLog("未找到提交确认按钮，请手动确认交卷", "warning", 4);
  };
  const runSingleQuestionExamLogic = async (log, setting) => {
    log.insertLog(
      "当前考试不允许整卷预览，将按单题页面顺序处理，请勿手动切换题目",
      "warning",
      4
    );
    while (true) {
      await new QuestionHandler$1("ks").init();
      const nextBtn = getNextQuestionBtn();
      if (!nextBtn) break;
      nextBtn.click();
      log.insertLog("已切换到下一题，继续处理..");
      await sleep(1);
    }
    await submitCxExam(log, setting);
  };
  const enterCxExamPreviewLogic = async () => {
    const log = useLogStore();
    const setting = useSettingStore();
    if (!setting.config.basicConfig.autoAnswer.value) {
      log.insertLog(
        `自动答题已关闭，请前往<span class='module'>设置</span>模块中更改`
      );
      return;
    }
    if (isPreviewDisabled()) {
      await runSingleQuestionExamLogic(log, setting);
      return;
    }
    log.insertLog("进入考试开始页，正在切换到整卷预览..");
    for (let i = 0; i < 10; i++) {
      const previewBtn = document.querySelector("div.sub-button a");
      if (previewBtn) {
        previewBtn.click();
        log.insertLog("已点击整卷预览，正在进入答题页面..");
        return;
      }
      await sleep(0.5);
    }
    log.insertLog("未找到整卷预览按钮，请手动点击", "warning", 4);
  };
  const cxExamLogic = async () => {
    const log = useLogStore();
    const setting = useSettingStore();
    log.insertLog(`进入新版考试页面，开始准备答题..`);
    if (!setting.config.basicConfig.autoAnswer.value) {
      log.insertLog(
        `自动答题已关闭，请前往<span class='module'>设置</span>模块中更改`
      );
      return;
    }
    await new QuestionHandler$1("ks").init();
    await submitCxExam(log, setting);
  };
  const cxRoutes = {
    match: [
      { keyword: "/base", tab: "0" },
      { keyword: "/space/index", tab: "0" },
      // 积分课程
      { keyword: "/plaza/?courseId", tab: "0" },
      { keyword: "mycourse/stu?courseid", tab: "0" },
      { keyword: "/mycourse/studentstudy", tab: "1", logic: cxChapterLogic },
      { keyword: "/mooc2/work/dowork", tab: "1", logic: cxHomeworkLogic },
      { keyword: "/examcode/examnotes", tab: "0", log: "等待用户进入答题页面中.." },
      { keyword: "exam-ans/exam/test/reVersionTestStartNew", tab: "1", logic: enterCxExamPreviewLogic },
      { keyword: "mooc-ans/exam/test/reVersionTestStartNew", tab: "1", logic: enterCxExamPreviewLogic },
      { keyword: "/exam/test/reVersionTestStartNew", tab: "1", logic: enterCxExamPreviewLogic },
      { keyword: "/mooc2/exam/preview", tab: "1", logic: cxExamLogic },
      { keyword: "exam/preview", tab: "1", logic: cxExamLogic }
    ],
    defaultRoute: {
      show: true,
      tab: "0"
    }
  };
  class QuestionHandler2 extends BasicQuestionHandler {
    constructor(type, iframe) {
      super();
      __publicField(this, "type");
      __publicField(this, "AI_ALLOW_QUESTION_TYPE", ["单选题", "多选题", "判断题"]);
      __publicField(this, "init", async () => {
        var _that = this;
        this.questions = [];
        this.parseHtml();
        if (this.questions.length) {
          this.log.insertLog(
            `成功解析到${this.questions.length}个题目，开始答题..`
          );
          setTimeout(() => {
            _that.setting.tabIndex = "2";
          }, 1e3);
          const { answerMode } = this.setting.config.basicConfig;
          const mode = answerMode.value;
          for (const [index, question] of this.questions.entries()) {
            this.questionStore.currentQuestionIndex = index;
            let fillFailed = false;
            let handled = false;
            if (mode !== "ai") {
              const answerData = await getAccurateAnswer(question);
              if (answerData.code === 1) {
                question.answer = {
                  code: 1,
                  answer: answerData.data.answer
                };
                this.setting.userInfo.remainCount = formatLocalRemainCount(answerData.data.remainCount);
                saveAnswerRecord({
                  question,
                  answer: answerData.data.answer,
                  source: "accurate"
                });
                const errorStatus = !this.fillQuestion(question, index);
                if (errorStatus) {
                  question.answer.code = 0;
                  fillFailed = true;
                } else {
                  this.correctNum += 1;
                }
                handled = true;
              } else if (mode === "questionBank" || answerData.code !== -1004) {
                question.answer = {
                  code: answerData.code,
                  answer: [answerData.msg]
                };
                handled = true;
              }
            }
            if (!handled) {
              if (this.AI_ALLOW_QUESTION_TYPE.includes(question.type)) {
                const aiQuestion = {
                  ...question,
                  type: this.questionType[question.type] || question.type
                };
                const aiAnswerData = await getAIAnswer(aiQuestion);
                if (aiAnswerData.code === 1) {
                  question.answer = {
                    code: 2,
                    answer: aiAnswerData.data.answer
                  };
                  this.setting.userInfo.remainCount = formatLocalRemainCount(aiAnswerData.data.remainCount);
                  saveAnswerRecord({
                    question,
                    answer: aiAnswerData.data.answer,
                    source: "ai"
                  });
                  const errorStatus = !this.fillQuestion(question, index);
                  if (errorStatus) {
                    question.answer.code = 0;
                    fillFailed = true;
                  } else {
                    this.correctNum += 1;
                  }
                } else {
                  question.answer = {
                    code: aiAnswerData.code,
                    answer: [aiAnswerData.msg]
                  };
                }
              } else {
                question.answer = {
                  code: -1,
                  answer: ["该题型不支持AI答题"]
                };
              }
            }
            if (!fillFailed && this.type == "zy") {
              const nextBtn = this._document.querySelectorAll(
                "div.switch-btn-box > button:nth-child(2) > span"
              )[0];
              if (nextBtn.innerText === "下一题") {
                nextBtn.click();
              }
            }
          }
          this.questionStore.currentQuestionIndex += 1;
        } else
          this.log.insertLog(
            "没有解析到题目，请检查是否进入正确页面...",
            "warning"
          );
        setTimeout(() => {
          _that.setting.tabIndex = "1";
        }, 2e3);
        return Promise.resolve(
          (this.correctNum / this.questions.length * 100).toFixed(1)
        );
      });
      __publicField(this, "parseHtml", () => {
        this.questionStore.currentQuestionIndex = 0;
        if (!this._document) return [];
        this.addQuestions(this.questionStore.questionList);
        this.questionStore.questionList = this.questions;
      });
      __publicField(this, "fillQuestion", (question, index) => {
        let isSelected = false;
        if (!this._window) return;
        const optionsDOM = document.querySelectorAll(".subject_node")[index].querySelectorAll(".node_detail");
        if (question.type === "单选题" || question.type === "多选题") {
          question.answer.answer.forEach((answer) => {
            optionsDOM.forEach((optionDOM) => {
              if (answer == this.removeHtml(optionDOM.innerHTML)) {
                isSelected = true;
                optionDOM.click();
              } else if (this.removeAllTags(answer) == this.removeAllTags(optionDOM.innerHTML)) {
                isSelected = true;
                optionDOM.click();
              }
            });
          });
        } else if (question.type === "判断题") {
          let answer = "对";
          if (question.answer.answer[0].match(
            /(^|,)(正确|是|对|√|T|ri|right|true)(,|$)/
          )) {
            answer = "对";
          } else if (question.answer.answer[0].match(
            /(^|,)(错误|否|错|×|F|wr|wrong|false)(,|$)/
          )) {
            answer = "错";
          }
          optionsDOM.forEach((optionDOM) => {
            if (answer == this.removeHtml(optionDOM.innerHTML)) {
              isSelected = true;
              optionDOM.click();
            }
          });
        } else ;
        return isSelected;
      });
      __publicField(this, "extractOptions", (questionOptions, questionType) => {
        const optionsObject = {};
        const optionTexts = [];
        if (!questionOptions) return [optionsObject, optionTexts];
        questionOptions.forEach((questionOption) => {
          const optionTextContent = this.removeHtml(questionOption.content);
          optionsObject[optionTextContent] = questionOption.content;
          if (questionType !== "判断题") optionTexts.push(optionTextContent);
        });
        return [optionsObject, optionTexts];
      });
      __publicField(this, "addQuestions", (questions) => {
        questions.forEach((question) => {
          const questionTitle = this.removeHtml(question.name);
          const questionType = question.questionType.name;
          const [optionsObject, optionTexts] = this.extractOptions(
            question.questionOptions,
            questionType
          );
          this.questions.push({
            element: JSON.stringify(questions),
            type: questionType,
            title: questionTitle,
            optionsText: optionTexts,
            options: optionsObject,
            answer: { code: -1, answer: [] },
            workType: "zhs",
            refer: this._window.location.href,
            id: "zhs"
          });
        });
      });
      this.type = type;
      if (iframe) {
        this._document = iframe.contentDocument;
        this._window = iframe.contentWindow;
      }
    }
  }
  const ANSWER_SHEET_EVENT = "ABC_ZHS_ANSWER_SHEET";
  const ANSWER_SHEET_URL = "getAnswerSheetInformation";
  const saveAnswerSheetPayload = (payload) => {
    const pageWindow = _unsafeWindow || window;
    pageWindow.__ABC_ZHS_ANSWER_SHEET__ = payload;
    pageWindow.dispatchEvent(new CustomEvent(ANSWER_SHEET_EVENT, { detail: payload }));
  };
  const parseResponseText = (text) => {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  };
  const getRequestUrl = (input) => {
    if (typeof input === "string") return input;
    if (input == null ? void 0 : input.url) return input.url;
    return input ? String(input) : "";
  };
  const installAnswerSheetHook = () => {
    const pageWindow = _unsafeWindow || window;
    if (pageWindow.__ABC_ZHS_ANSWER_SHEET_HOOKED__) return;
    pageWindow.__ABC_ZHS_ANSWER_SHEET_HOOKED__ = true;
    const originalFetch = pageWindow.fetch;
    if (typeof originalFetch === "function") {
      pageWindow.fetch = async function(...args) {
        const response = await originalFetch.apply(this, args);
        const requestUrl = getRequestUrl(args[0]);
        if (requestUrl.includes(ANSWER_SHEET_URL)) {
          response.clone().text().then((text) => {
            console.info("[ABC] 捕获智慧树考试接口(fetch):", requestUrl);
            saveAnswerSheetPayload(parseResponseText(text));
          }).catch(() => {
          });
        }
        return response;
      };
    }
    const OriginalXHR = pageWindow.XMLHttpRequest;
    if (typeof OriginalXHR === "function" && !OriginalXHR.__ABC_ZHS_ANSWER_SHEET_HOOKED__) {
      const originalOpen = OriginalXHR.prototype.open;
      const originalSend = OriginalXHR.prototype.send;
      OriginalXHR.__ABC_ZHS_ANSWER_SHEET_HOOKED__ = true;
      OriginalXHR.prototype.open = function(method, url2, ...rest) {
        this.__abcRequestUrl = url2 || "";
        return originalOpen.call(this, method, url2, ...rest);
      };
      OriginalXHR.prototype.send = function(...args) {
        this.addEventListener("load", function() {
          const requestUrl = getRequestUrl(this.responseURL || this.__abcRequestUrl);
          if (requestUrl.includes(ANSWER_SHEET_URL)) {
            console.info("[ABC] 捕获智慧树考试接口(xhr):", requestUrl);
            saveAnswerSheetPayload(parseResponseText(this.responseText));
          }
        });
        return originalSend.apply(this, args);
      };
    }
  };
  const fetchHook = (url2, callback) => {
    const questionStore = useQuestionStore();
    function addXMLRequestCallback(callback2) {
      var oldSend, i;
      if (XMLHttpRequest.callbacks) {
        XMLHttpRequest.callbacks.push(callback2);
      } else {
        XMLHttpRequest.callbacks = [callback2];
        oldSend = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.send = function() {
          for (i = 0; i < XMLHttpRequest.callbacks.length; i++) {
            XMLHttpRequest.callbacks[i](this);
          }
          oldSend.apply(this, arguments);
        };
      }
    }
    addXMLRequestCallback(function(xhr) {
      xhr.addEventListener("load", function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
          if (xhr.responseURL.includes(url2)) {
            const keywords = ["doExam", "doHomework"];
            if (keywords.some((keyword) => xhr.responseURL.includes(keyword))) {
              let questions = [];
              const questionsParts = JSON.parse(xhr.response).rt.examBase.workExamParts;
              questionsParts.forEach((part) => {
                console.log("part", part.questionDtos);
                questions = questions.concat(part.questionDtos);
              });
              questionStore.questionList = questions;
            }
            callback();
          }
        }
      });
    });
  };
  const autoAnswerLogic = async () => {
    const log = useLogStore();
    const questionStore = useQuestionStore();
    log.insertLog("进入作业页面，脚本开始工作中..");
    questionStore.accuracy = -1;
    const handleFetchHook = async () => {
      const accuracy = await new QuestionHandler2("zy").init();
      questionStore.accuracy = accuracy;
      log.insertLog(`答题完毕,正确率为${accuracy}%,详情请前往<span class='module'>答题</span>模块查看..`);
    };
    ["doHomework", "doExam"].forEach((type) => {
      fetchHook(type, () => handleFetchHook());
    });
  };
  const videoStudyLogic = () => {
    const log = useLogStore();
    const setting = useSettingStore();
    let videoEl = null;
    let pollIntervalId = null;
    let isAnsweringQuiz = false;
    const injectQuizHelper = () => {
      const script = document.createElement("script");
      script.textContent = `
      (function() {
        window.addEventListener("message", function(e) {
          if (!e.data || e.data.type !== "ABC_ZHS_QUIZ_ANSWER") return;
          try {
            var dialog = document.querySelector("#playTopic-dialog");
            if (!dialog || !dialog.__vue__) {
              window.postMessage({ type: "ABC_ZHS_QUIZ_RESULT", success: false }, "*");
              return;
            }
            var vm = dialog.__vue__.$parent.$parent;
            if (!vm || !vm.topicInfo) {
              window.postMessage({ type: "ABC_ZHS_QUIZ_RESULT", success: false }, "*");
              return;
            }
            var dto = vm.topicInfo.lessonTestQuestionUseInterfaceDtos;
            if (!dto || !dto[0]) {
              window.postMessage({ type: "ABC_ZHS_QUIZ_RESULT", success: false }, "*");
              return;
            }
            var options = dto[0].testQuestion.questionOptions;
            var answers = dto[0].answerUs;
            if (!options || !answers) {
              window.postMessage({ type: "ABC_ZHS_QUIZ_RESULT", success: false }, "*");
              return;
            }
            var count = 0;
            options.forEach(function(opt, i) {
              if (answers.indexOf(opt.sortUs) !== -1) {
                setTimeout(function() { vm.topicClickQot(options[i]); }, 800 * count);
                count++;
              }
            });
            var closeDelay = Math.max(count * 800 + 2000, 5000);
            setTimeout(function() {
              vm.testDialog = false;
              window.postMessage({ type: "ABC_ZHS_QUIZ_RESULT", success: true, count: count }, "*");
            }, closeDelay);
          } catch (err) {
            window.postMessage({ type: "ABC_ZHS_QUIZ_RESULT", success: false, error: err.message }, "*");
          }
        });
      })();
    `;
      (document.head || document.documentElement).appendChild(script);
      script.remove();
    };
    const clearOverlays = () => {
      var _a, _b;
      (_a = document.querySelector(".v-modal")) == null ? void 0 : _a.remove();
      (_b = document.querySelector(".brush-warning")) == null ? void 0 : _b.remove();
    };
    const isChapterCompleted = (el) => !!(el == null ? void 0 : el.querySelector(".time_icofinish"));
    const waitForVideo = (timeout = 15e3) => {
      return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const check = setInterval(() => {
          const video = document.querySelector("video");
          if (video) {
            clearInterval(check);
            resolve(video);
            return;
          }
          if (Date.now() - startTime > timeout) {
            clearInterval(check);
            reject(new Error("等待视频元素超时"));
          }
        }, 500);
      });
    };
    const clickEl = (el) => {
      if (el) {
        el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      }
    };
    const getCurrentChapterTitle = () => {
      var _a, _b;
      return ((_b = (_a = document.querySelector("li.video.current_play .catalogue_title")) == null ? void 0 : _a.innerText) == null ? void 0 : _b.trim()) || "未知小节";
    };
    const getChapterLabel = (chapterEl) => {
      var _a, _b, _c, _d;
      const title = ((_b = (_a = chapterEl.querySelector(".catalogue_title")) == null ? void 0 : _a.innerText) == null ? void 0 : _b.trim()) || "";
      const num = ((_d = (_c = chapterEl.querySelector(".hour")) == null ? void 0 : _c.textContent) == null ? void 0 : _d.trim()) || "";
      return num ? `${num} ${title}` : title;
    };
    const playVideo = () => {
      clearOverlays();
      videoEl = document.querySelector("#vjs_container_html5_api");
      if (!videoEl) return;
      videoEl.muted = true;
      videoEl.play().catch(() => {
      });
    };
    const startVideo = () => {
      playVideo();
      if (!videoEl) return;
      videoEl.addEventListener("play", () => {
        const title = getCurrentChapterTitle();
        log.insertLog(`${title} - 视频开始播放`);
        hookVedio(videoEl, 1.5);
        log.insertLog(`已设置播放倍速: 1.5x`);
      }, { once: true });
      videoEl.addEventListener("playing", () => {
        clearOverlays();
      });
      videoEl.addEventListener("pause", () => {
        if (videoEl.ended || isAnsweringQuiz) return;
        const dialog = document.querySelector("#playTopic-dialog");
        if (!dialog) {
          log.insertLog("视频被暂停，将在下次轮询中恢复..");
        }
      });
      videoEl.addEventListener("ended", () => {
        log.insertLog("当前视频播放完毕");
        nextTask();
      });
    };
    const handlePopupQuiz = async () => {
      var _a;
      if (isAnsweringQuiz) return;
      isAnsweringQuiz = true;
      await sleep(1);
      const dialog = document.querySelector("#playTopic-dialog");
      if (!dialog) {
        isAnsweringQuiz = false;
        return;
      }
      const headerText = ((_a = dialog.querySelector(".el-dialog__header h4")) == null ? void 0 : _a.innerText) || "";
      if (!headerText.includes("给你出题啦") && !headerText.includes("弹题测验")) {
        isAnsweringQuiz = false;
        return;
      }
      const radioEl = dialog.querySelector(".radio");
      const topicTitle = radioEl == null ? void 0 : radioEl.querySelector(".topic-title");
      if (topicTitle && (topicTitle.querySelector(".right") || topicTitle.querySelector(".error"))) {
        log.insertLog("弹题已作答过，关闭弹窗..");
        await sleep(2);
        closeQuizDialog();
        isAnsweringQuiz = false;
        await sleep(1);
        playVideo();
        return;
      }
      log.insertLog("检测到弹题测验，尝试自动作答..");
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          window.removeEventListener("message", handler);
          log.insertLog("弹题自动作答超时，关闭弹窗..", "warning");
          closeQuizDialog();
          isAnsweringQuiz = false;
          setTimeout(playVideo, 1e3);
          resolve();
        }, 2e4);
        const handler = (e) => {
          var _a2;
          if (((_a2 = e.data) == null ? void 0 : _a2.type) !== "ABC_ZHS_QUIZ_RESULT") return;
          clearTimeout(timeout);
          window.removeEventListener("message", handler);
          if (e.data.success) {
            log.insertLog(`弹题已自动作答完成（${e.data.count}题），继续播放视频`);
          } else {
            log.insertLog(
              `弹题自动作答失败${e.data.error ? ": " + e.data.error : ""}，关闭弹窗..`,
              "warning"
            );
            closeQuizDialog();
          }
          isAnsweringQuiz = false;
          setTimeout(playVideo, 1e3);
          resolve();
        };
        window.addEventListener("message", handler);
        window.postMessage({ type: "ABC_ZHS_QUIZ_ANSWER" }, "*");
      });
    };
    const closeQuizDialog = () => {
      const dialog = document.querySelector("#playTopic-dialog");
      const closeBtn = dialog == null ? void 0 : dialog.querySelector(".el-dialog__headerbtn");
      clickEl(closeBtn);
    };
    const handleMidwayDialogs = () => {
      const dialogs = document.querySelectorAll(".el-dialog");
      const visibleDialog = Array.from(dialogs).find(
        (d) => {
          var _a;
          return ((_a = d == null ? void 0 : d.parentElement) == null ? void 0 : _a.style.display) !== "none";
        }
      );
      if (!visibleDialog) {
        clearOverlays();
        return;
      }
      if (visibleDialog.ariaLabel === "温馨提示") {
        const btn = visibleDialog.querySelector(".el-button.btn");
        if ((btn == null ? void 0 : btn.textContent) === "我知道了") {
          clickEl(btn);
          log.insertLog("已关闭「温馨提示」弹窗");
          setTimeout(playVideo, 500);
          return;
        }
      }
      if (visibleDialog.ariaLabel === "弹题测验") {
        handlePopupQuiz();
      }
    };
    const findNextChapter = () => {
      const allChapters = Array.from(document.querySelectorAll("li.video"));
      const currentChapter = document.querySelector("li.video.current_play");
      if (!currentChapter || allChapters.length === 0) return null;
      const currentIndex = allChapters.indexOf(currentChapter);
      const ordered = [
        ...allChapters.slice(currentIndex + 1),
        ...allChapters.slice(0, currentIndex)
      ];
      return ordered.find((el) => !isChapterCompleted(el));
    };
    const nextTask = async () => {
      var _a;
      if (!setting.config.basicConfig.autoChangeChapter.value) {
        log.insertLog(
          "自动切换章节未开启，前往<span class='module'>设置</span>模块中更改",
          "warning"
        );
        return;
      }
      const currentTitle = ((_a = document.querySelector("li.video.current_play .catalogue_title")) == null ? void 0 : _a.innerText) || "当前章节";
      log.insertLog(`「${currentTitle}」已完成`);
      const next = findNextChapter();
      if (next) {
        const nextLabel = getChapterLabel(next);
        log.insertLog(`跳转到: ${nextLabel}`);
        clickEl(next);
        await sleep(5);
        initVideoTask();
      } else {
        log.insertLog("所有章节视频已完成！");
        clearPollInterval();
      }
    };
    const startPolling = () => {
      let lastHour = null;
      pollIntervalId = setInterval(() => {
        var _a;
        const currentEl = document.querySelector(".video.current_play");
        if (!currentEl) return;
        const hour = (_a = currentEl.querySelector(".hour")) == null ? void 0 : _a.textContent;
        if (hour && lastHour !== null && hour !== lastHour) {
          lastHour = hour;
          setTimeout(startVideo, 3e3);
        }
        if (hour) lastHour = hour;
        if (isChapterCompleted(currentEl)) {
          nextTask();
          return;
        }
        const video = document.querySelector("#vjs_container_html5_api");
        if ((video == null ? void 0 : video.paused) && !video.ended && !isAnsweringQuiz) {
          handleMidwayDialogs();
        }
      }, 2e3);
    };
    const clearPollInterval = () => {
      if (pollIntervalId) {
        clearInterval(pollIntervalId);
        pollIntervalId = null;
      }
    };
    const initVideoTask = async () => {
      try {
        await waitForVideo();
        startVideo();
      } catch (e) {
        log.insertLog(`${e.message}，尝试跳转下一节..`, "warning");
        nextTask();
      }
    };
    const start = async () => {
      var _a;
      log.insertLog("进入智慧树视频学习页面，脚本开始工作..");
      setting.tabIndex = "1";
      injectQuizHelper();
      await sleep(5);
      const noteClose = document.querySelector(".dialog-read .iconguanbi");
      if (noteClose) {
        const parent = (_a = noteClose.closest) == null ? void 0 : _a.call(noteClose, ".dialog-read");
        if (parent && getComputedStyle(parent).display !== "none") {
          clickEl(noteClose);
          log.insertLog("已关闭阅读提示弹窗");
        }
      }
      handleMidwayDialogs();
      startPolling();
      initVideoTask();
    };
    start();
  };
  const learnPageLogic = () => {
    const log = useLogStore();
    const setting = useSettingStore();
    let videoEl = null;
    let currentResourceIndex = 0;
    let resourceItems = [];
    const waitFor = (selector, timeout = 1e4) => {
      return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const check = setInterval(() => {
          const el = document.querySelector(selector);
          if (el) {
            clearInterval(check);
            resolve(el);
            return;
          }
          if (Date.now() - startTime > timeout) {
            clearInterval(check);
            reject(new Error(`等待元素 ${selector} 超时`));
          }
        }, 300);
      });
    };
    const clickEl = (el) => {
      if (el) el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    };
    const RESOURCE_TYPES = { VIDEO: "video", BOOK: "book", PPT: "other" };
    const getResourceType = (resourceEl) => {
      const iconBox = resourceEl == null ? void 0 : resourceEl.querySelector(".icon-box");
      if (!iconBox) return "unknown";
      const classes = iconBox.className;
      if (classes.includes("video")) return RESOURCE_TYPES.VIDEO;
      if (classes.includes("book")) return RESOURCE_TYPES.BOOK;
      if (classes.includes("other") || classes.includes("ppt")) return RESOURCE_TYPES.PPT;
      return "unknown";
    };
    const getAllResourceEls = () => Array.from(document.querySelectorAll(".resources-list .resources-item"));
    const getCurrentResourceEl = () => {
      const items = getAllResourceEls();
      const idx = resourceItems[currentResourceIndex];
      return items[idx] ?? null;
    };
    const detectCurrentResourceType = () => {
      const el = getCurrentResourceEl();
      el ? getResourceType(el) : "unknown";
    };
    const onResourceComplete = async () => {
      currentResourceIndex++;
      detectCurrentResourceType();
      await processNextResource();
    };
    const processVideo = async () => {
      log.insertLog("发现视频资源，正在播放..");
      try {
        await sleep(5);
        videoEl = document.querySelector(".preview-section .video-player-wrapper video") || document.querySelector(".preview-section video");
        if (!videoEl) {
          log.insertLog("未找到视频元素，跳过..", "warning");
          onResourceComplete();
          return;
        }
        videoEl.muted = true;
        videoEl.play().catch(() => {
        });
        const rates = [2, 1.75, 1.5, 1.25];
        for (const rate of rates) {
          try {
            videoEl.playbackRate = rate;
            if (videoEl.playbackRate === rate) {
              log.insertLog(`已设置播放倍速: ${rate}x`);
              break;
            }
          } catch {
          }
        }
        videoEl.addEventListener("pause", () => {
          if (videoEl.ended) return;
          if (videoEl.duration > 0 && videoEl.duration - videoEl.currentTime <= 1) {
            log.insertLog("视频播放完毕");
            onResourceComplete();
            return;
          }
          setTimeout(() => {
            if (videoEl && !videoEl.ended && videoEl.paused) {
              videoEl.play().catch(() => {
              });
            }
          }, 2e3);
        });
        videoEl.addEventListener("ended", () => {
          log.insertLog("视频播放完毕");
          onResourceComplete();
        }, { once: true });
      } catch (e) {
        log.insertLog(`视频处理出错: ${e.message}`, "warning");
        onResourceComplete();
      }
    };
    const processPpt = async () => {
      var _a;
      log.insertLog("发现PPT资源，正在自动翻页..");
      try {
        await sleep(2);
        const totalText = (_a = document.querySelector(
          ".preview-section .ppt-preview-container .page-total"
        )) == null ? void 0 : _a.innerText;
        const totalPages = parseInt(totalText, 10) || 0;
        if (!totalPages) {
          log.insertLog("无法获取PPT页数，跳过..", "warning");
          onResourceComplete();
          return;
        }
        const containers = document.querySelectorAll(
          ".catalogue-container .div-img-container"
        );
        let currentPage = Array.from(containers).findIndex((c) => c.classList.contains("choose")) + 1 || 1;
        log.insertLog(`PPT共 ${totalPages} 页，从第 ${currentPage} 页开始`);
        const flipPage = async (page) => {
          if (page >= totalPages) {
            log.insertLog("PPT翻页完成");
            onResourceComplete();
            return;
          }
          const nextBtn = document.querySelector(
            ".preview-section .ppt-preview-container .next-page-btn"
          );
          clickEl(nextBtn);
          await sleep(5);
          flipPage(page + 1);
        };
        flipPage(currentPage);
      } catch (e) {
        log.insertLog(`PPT处理出错: ${e.message}`, "warning");
        onResourceComplete();
      }
    };
    const processBook = async () => {
      log.insertLog("发现电子书资源，正在自动阅读..");
      try {
        await waitFor(".preview-section .book-mark .book-content");
        await waitFor(".preview-section .book-mark .canvas-wrapper");
        const pages = document.querySelectorAll(
          ".preview-section .book-mark .canvas-wrapper"
        );
        if (!pages.length) {
          log.insertLog("未找到电子书页面，跳过..", "warning");
          onResourceComplete();
          return;
        }
        const firstRect = pages[0].getBoundingClientRect();
        const marginTop = parseInt(getComputedStyle(pages[0]).marginTop, 10) || 0;
        const pageHeight = Math.max(firstRect.height + marginTop, 100);
        const container = document.querySelector(
          ".preview-section .book-mark .book-container"
        );
        if (!container) {
          log.insertLog("未找到电子书滚动容器，跳过..", "warning");
          onResourceComplete();
          return;
        }
        const scrollStep = async () => {
          const target = Math.min(
            container.scrollTop + pageHeight,
            container.scrollHeight - container.clientHeight
          );
          container.scrollTo({ top: target, behavior: "smooth" });
          await sleep(1.5);
          if (container.scrollTop + container.clientHeight >= container.scrollHeight - 2) {
            log.insertLog("电子书阅读完成");
            onResourceComplete();
          } else {
            scrollStep();
          }
        };
        scrollStep();
      } catch (e) {
        log.insertLog(`电子书处理出错: ${e.message}`, "warning");
        onResourceComplete();
      }
    };
    const processNextResource = async () => {
      if (currentResourceIndex >= resourceItems.length) {
        log.insertLog("当前小节所有资源已完成");
        nextSection();
        return;
      }
      const el = getCurrentResourceEl();
      if (!el) {
        log.insertLog("未找到资源元素，跳过..", "warning");
        onResourceComplete();
        return;
      }
      if (currentResourceIndex > 0) {
        const clickTarget = el.querySelector(".basic-info-video-card-container");
        clickEl(clickTarget || el);
        await sleep(3);
      }
      const type = getResourceType(el);
      log.insertLog(
        `处理资源 [${currentResourceIndex + 1}/${resourceItems.length}] 类型: ${type}`
      );
      switch (type) {
        case RESOURCE_TYPES.VIDEO:
          processVideo();
          break;
        case RESOURCE_TYPES.BOOK:
          processBook();
          break;
        case RESOURCE_TYPES.PPT:
          processPpt();
          break;
        default:
          log.insertLog(`不支持的资源类型 (${type})，跳过`);
          onResourceComplete();
      }
    };
    const nextSection = async () => {
      var _a, _b, _c, _d;
      if (!setting.config.basicConfig.autoChangeChapter.value) {
        log.insertLog(
          "自动切换章节未开启，前往<span class='module'>设置</span>模块中更改",
          "warning"
        );
        return;
      }
      const sections = document.querySelectorAll(".section-item-collapse-info");
      const active = document.querySelector(".section-item-collapse-info.active");
      if (!active) {
        log.insertLog("未找到当前活跃章节");
        return;
      }
      const currentTitle = ((_b = (_a = active.querySelector(".section-item-collapse-title")) == null ? void 0 : _a.innerText) == null ? void 0 : _b.trim()) || "当前章节";
      log.insertLog(`「${currentTitle}」所有资源已完成`);
      const arr = Array.from(sections);
      const nextIdx = arr.indexOf(active) + 1;
      if (nextIdx < arr.length) {
        const next = arr[nextIdx];
        const nextTitle = ((_d = (_c = next.querySelector(".section-item-collapse-title")) == null ? void 0 : _c.innerText) == null ? void 0 : _d.trim()) || "下一节";
        log.insertLog(`跳转到: ${nextTitle}`);
        clickEl(next);
        await sleep(5);
        initResources();
      } else {
        log.insertLog("所有章节已完成！");
      }
    };
    const initResources = async () => {
      currentResourceIndex = 0;
      resourceItems = [];
      videoEl = null;
      try {
        await waitFor(".resources-detail-card .resources-list .resources-item", 15e3);
        const items = getAllResourceEls();
        if (!items.length) {
          log.insertLog("未找到学习资源，尝试跳转下一节..", "warning");
          nextSection();
          return;
        }
        resourceItems = items.map((_, i) => i);
        log.insertLog(`发现 ${resourceItems.length} 个学习资源`);
        detectCurrentResourceType();
        await processNextResource();
      } catch (e) {
        log.insertLog(`初始化资源列表失败: ${e.message}`, "warning");
        nextSection();
      }
    };
    const watchUrlChange = () => {
      let prevUrl = location.href;
      setInterval(() => {
        if (location.href === prevUrl) return;
        const wasLearnPage = prevUrl.includes("/learnPage");
        prevUrl = location.href;
        if (location.href.includes("/learnPage") && !wasLearnPage) {
          log.insertLog("检测到页面切换，重新初始化..");
          setTimeout(initResources, 3e3);
        }
      }, 1500);
    };
    const start = async () => {
      log.insertLog("进入智慧树新版学习页面，脚本开始工作..");
      setting.tabIndex = "1";
      await sleep(6);
      const noteDialog = document.querySelector(".read-note-dialog");
      if (noteDialog && getComputedStyle(noteDialog).display !== "none") {
        const btn = noteDialog.querySelector("button");
        if (btn) {
          clickEl(btn);
          log.insertLog("已关闭阅读提示弹窗");
        }
      }
      try {
        await waitFor(".preview-content", 15e3);
      } catch {
        log.insertLog("等待页面内容加载超时..", "warning");
      }
      watchUrlChange();
      initResources();
    };
    start();
  };
  const aiSmartLogic = () => {
    const log = useLogStore();
    const setting = useSettingStore();
    let videoEl = null;
    let currentResourceIndex = 0;
    let resourceItems = [];
    let currentResourceType = "";
    let isStopped = false;
    let chapterObserver = null;
    let resourceObserver = null;
    const waitFor = (selector, timeout = 1e4) => {
      return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const check = setInterval(() => {
          const el = document.querySelector(selector);
          if (el) {
            clearInterval(check);
            resolve(el);
            return;
          }
          if (Date.now() - startTime > timeout) {
            clearInterval(check);
            reject(new Error(`等待元素 ${selector} 超时`));
          }
        }, 300);
      });
    };
    const waitForHeight = (selector, timeout = 15e3) => {
      return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const check = () => {
          const el = document.querySelector(selector);
          if (el && el.offsetHeight > 0) {
            resolve(el);
            return;
          }
          if (Date.now() - startTime > timeout) {
            reject(new Error("等待元素高度超时"));
            return;
          }
          setTimeout(check, 100);
        };
        check();
      });
    };
    const clickEl = (el) => {
      if (el) el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    };
    const RESOURCE_TYPES = { VIDEO: "video", PPT: "ppt" };
    const getResourceType = (resourceEl) => {
      var _a;
      const fileType = resourceEl == null ? void 0 : resourceEl.querySelector(".file-type");
      if (!fileType) return "unknown";
      const secondClass = fileType.classList[1];
      if (!secondClass) return "unknown";
      const type = (_a = secondClass.split("-")) == null ? void 0 : _a[1];
      if (type === "video") return RESOURCE_TYPES.VIDEO;
      if (type === "ppt" || type === "other") return RESOURCE_TYPES.PPT;
      return type || "unknown";
    };
    const getAllResourceEls = () => Array.from(document.querySelectorAll(".resources-list .resources-item"));
    const getCurrentResourceEl = () => {
      const items = getAllResourceEls();
      const idx = resourceItems[currentResourceIndex];
      return items[idx] ?? null;
    };
    const detectCurrentResourceType = () => {
      const el = getCurrentResourceEl();
      currentResourceType = el ? getResourceType(el) : "unknown";
    };
    const findVideoElement = async (retries = 3, interval = 500) => {
      for (let i = 0; i < retries; i++) {
        const video = document.querySelector("#container #vjs_container video");
        if (video) return video;
        await new Promise((r) => setTimeout(r, interval));
      }
      return null;
    };
    const cleanupVideo = () => {
      if (videoEl) {
        videoEl.removeEventListener("ended", onVideoEnded);
        videoEl.removeEventListener("playing", onVideoPlaying);
        videoEl.removeEventListener("pause", onVideoPause);
        videoEl = null;
      }
    };
    const onVideoPlaying = () => {
      log.insertLog("视频正在播放中..");
    };
    const onVideoEnded = () => {
      log.insertLog("视频播放完毕");
      currentResourceIndex++;
      detectCurrentResourceType();
      processNextResource();
    };
    const onVideoPause = () => {
      if (!videoEl || videoEl.ended) return;
      log.insertLog("视频被暂停，尝试恢复..");
      setTimeout(() => {
        if (videoEl && !videoEl.ended && videoEl.paused) {
          videoEl.play().catch(() => {
          });
        }
      }, 2e3);
    };
    const processVideo = async () => {
      var _a, _b;
      log.insertLog("发现视频资源，正在播放..");
      try {
        cleanupVideo();
        videoEl = await findVideoElement();
        if (!videoEl) {
          log.insertLog("未找到视频元素，跳过..", "warning");
          currentResourceIndex++;
          detectCurrentResourceType();
          processNextResource();
          return;
        }
        videoEl.muted = true;
        const muteHandler = () => {
          if (videoEl) videoEl.muted = false;
        };
        (_a = document.body) == null ? void 0 : _a.addEventListener("click", muteHandler, { once: true });
        (_b = document.querySelector("#container")) == null ? void 0 : _b.addEventListener("click", muteHandler, { once: true });
        const rates = [2, 1.75, 1.5, 1.25];
        for (const rate of rates) {
          try {
            videoEl.playbackRate = rate;
            if (videoEl.playbackRate === rate) {
              log.insertLog(`已设置播放倍速: ${rate}x`);
              break;
            }
          } catch {
          }
        }
        videoEl.play().catch(() => {
          videoEl.muted = true;
          videoEl.play().catch(() => {
          });
        });
        videoEl.addEventListener("playing", onVideoPlaying, { once: true });
        videoEl.addEventListener("pause", onVideoPause);
        videoEl.addEventListener("ended", onVideoEnded, { once: true });
      } catch (e) {
        log.insertLog(`视频处理出错: ${e.message}`, "warning");
        currentResourceIndex++;
        detectCurrentResourceType();
        processNextResource();
      }
    };
    const getPptPageInfo = () => {
      var _a, _b;
      const container = document.querySelector(".ppt-btn-container");
      if (!container) return [];
      const current = parseInt(
        (_a = container.querySelector(".page-content .page-current")) == null ? void 0 : _a.innerText,
        10
      ) || 0;
      const total = parseInt(
        (_b = container.querySelector(".page-content .page-total")) == null ? void 0 : _b.innerText,
        10
      ) || 0;
      return current && total ? [current, total] : [];
    };
    const processPpt = async () => {
      log.insertLog("发现PPT资源，正在自动翻页..");
      try {
        const pptContainer = document.querySelector(
          ".ppt-box .ppt-preview-container"
        );
        if (!pptContainer) {
          log.insertLog("未找到PPT容器，跳过..", "warning");
          currentResourceIndex++;
          detectCurrentResourceType();
          processNextResource();
          return;
        }
        let [currentPage, totalPages] = getPptPageInfo();
        if (!currentPage || !totalPages) {
          log.insertLog("无法获取PPT页数，跳过..", "warning");
          currentResourceIndex++;
          detectCurrentResourceType();
          processNextResource();
          return;
        }
        if (currentPage >= totalPages) {
          log.insertLog("PPT已翻到最后一页");
          await sleep(2);
          currentResourceIndex++;
          detectCurrentResourceType();
          processNextResource();
          return;
        }
        log.insertLog(`PPT共 ${totalPages} 页，从第 ${currentPage} 页开始`);
        while (currentPage < totalPages) {
          if (isStopped) break;
          const nextBtn = pptContainer.querySelector(".next-page-btn");
          clickEl(nextBtn);
          await sleep(4);
          const [newCurrent, newTotal] = getPptPageInfo();
          currentPage = newCurrent;
          totalPages = newTotal;
          if (currentPage >= totalPages) {
            log.insertLog("PPT翻页完成");
            await sleep(2);
            currentResourceIndex++;
            detectCurrentResourceType();
            processNextResource();
            return;
          }
        }
      } catch (e) {
        log.insertLog(`PPT处理出错: ${e.message}`, "warning");
        currentResourceIndex++;
        detectCurrentResourceType();
        processNextResource();
      }
    };
    const processNextResource = async () => {
      if (currentResourceIndex >= resourceItems.length) {
        log.insertLog("当前小节所有资源已完成");
        nextSection();
        return;
      }
      const el = getCurrentResourceEl();
      if (!el) {
        log.insertLog("未找到资源元素，跳过..", "warning");
        currentResourceIndex++;
        detectCurrentResourceType();
        processNextResource();
        return;
      }
      if (currentResourceIndex > 0) {
        const type = getResourceType(el);
        if (!["video", "ppt"].includes(type)) {
          log.insertLog(`不支持的资源类型 (${type})，跳过`);
          currentResourceIndex++;
          detectCurrentResourceType();
          processNextResource();
          return;
        }
        const clickTarget = el.querySelector(".basic-info-video-card-container");
        clickEl(clickTarget || el);
        await sleep(3);
      }
      detectCurrentResourceType();
      log.insertLog(
        `处理资源 [${currentResourceIndex + 1}/${resourceItems.length}] 类型: ${currentResourceType}`
      );
      switch (currentResourceType) {
        case RESOURCE_TYPES.VIDEO:
          processVideo();
          break;
        case RESOURCE_TYPES.PPT:
          processPpt();
          break;
        default:
          log.insertLog(`不支持的资源类型 (${currentResourceType})，跳过`);
          currentResourceIndex++;
          detectCurrentResourceType();
          processNextResource();
      }
    };
    const getAllChapters = () => Array.from(document.querySelectorAll(".inner-li li.clearfix")).filter(
      (el) => !el.classList.contains("child-chapter") && !el.classList.contains("forbidClick")
    );
    const nextSection = async () => {
      var _a, _b, _c, _d;
      if (!setting.config.basicConfig.autoChangeChapter.value) {
        log.insertLog(
          "自动切换章节未开启，前往<span class='module'>设置</span>模块中更改",
          "warning"
        );
        return;
      }
      const chapters = getAllChapters();
      const active = document.querySelector(".clearfix.video.activeNode");
      if (!active) {
        log.insertLog("未找到当前活跃章节");
        return;
      }
      const currentTitle = ((_b = (_a = active.querySelector(".title")) == null ? void 0 : _a.innerText) == null ? void 0 : _b.trim()) || "当前章节";
      log.insertLog(`「${currentTitle}」所有资源已完成`);
      const currentIdx = chapters.indexOf(active);
      const next = chapters[currentIdx + 1];
      if (next) {
        const nextTitle = ((_d = (_c = next.querySelector(".title")) == null ? void 0 : _c.innerText) == null ? void 0 : _d.trim()) || "下一节";
        log.insertLog(`跳转到: ${nextTitle}`);
        next.click();
        next.scrollIntoView({ behavior: "smooth" });
      } else {
        log.insertLog("所有章节已完成！");
      }
    };
    const observeChapterList = () => {
      const listEl = document.querySelector(".chapterList-box .list");
      if (!listEl) return;
      chapterObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.type !== "attributes" || mutation.attributeName !== "class")
            continue;
          const target = mutation.target;
          const isActive = target.classList.contains("activeNode") || target.classList.contains("active");
          if (isActive) {
            onChapterChange();
          }
        }
      });
      chapterObserver.observe(listEl, {
        attributes: true,
        attributeFilter: ["class"],
        subtree: true,
        childList: false
      });
    };
    const observeResourceList = () => {
      const resourceListEl = document.querySelector(
        ".resource-warp .resources-list"
      );
      if (!resourceListEl) return;
      resourceObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.type !== "attributes" || mutation.attributeName !== "class")
            continue;
          const target = mutation.target;
          const isActive = target.classList.contains("active");
          if (isActive) {
            onChapterChange();
          }
        }
      });
      resourceObserver.observe(resourceListEl, {
        attributes: true,
        attributeFilter: ["class"],
        subtree: true,
        childList: false
      });
    };
    const onChapterChange = async (isActive) => {
      {
        await sleep(5);
        isStopped = false;
        await initResourcesFromDom();
      }
    };
    const initResourcesFromDom = async () => {
      if (resourceObserver) resourceObserver.disconnect();
      try {
        await waitFor(".resource-warp .resources-list .resources-item", 15e3);
        const items = getAllResourceEls();
        if (!items.length) {
          log.insertLog("未找到学习资源，尝试跳转下一节..", "warning");
          nextSection();
          return;
        }
        const activeIdx = Array.from(items).findIndex(
          (el) => el.classList.contains("active")
        );
        currentResourceIndex = activeIdx >= 0 ? activeIdx : 0;
        resourceItems = items.map((_, i) => i);
        log.insertLog(`发现 ${resourceItems.length} 个学习资源`);
        observeResourceList();
        detectCurrentResourceType();
        await processNextResource();
      } catch (e) {
        log.insertLog(`初始化资源列表失败: ${e.message}`, "warning");
        nextSection();
      }
    };
    const dismissPopups = () => {
      const popup = document.querySelector(".courseRemind.khfaPop");
      const closeBtn = popup == null ? void 0 : popup.querySelector(
        ".header-slot-box .el-icon-error"
      );
      if (closeBtn) {
        closeBtn.click();
        log.insertLog("已关闭课程提醒弹窗");
      }
    };
    const watchUrlChange = () => {
      let prevUrl = location.href;
      setInterval(() => {
        if (location.href === prevUrl) return;
        prevUrl = location.href;
        if (location.href.includes("ai-smart-course-student-pro.zhihuishu.com") || location.href.includes("fusioncourseh5.zhihuishu.com") || location.href.includes("smartcoursestudent.zhihuishu.com")) {
          log.insertLog("检测到页面切换，重新初始化..");
          setTimeout(() => initAll(), 3e3);
        }
      }, 1500);
    };
    const initAll = async () => {
      try {
        await waitForHeight(".preview-warp");
      } catch {
        log.insertLog("等待页面内容加载超时..", "warning");
      }
      dismissPopups();
      observeChapterList();
      await sleep(5);
      await initResourcesFromDom();
    };
    const start = async () => {
      log.insertLog("进入智慧树AI智慧课学习页面，脚本开始工作..");
      setting.tabIndex = "1";
      await sleep(6);
      watchUrlChange();
      await initAll();
    };
    start();
  };
  const smartStudyLogic = () => {
    const log = useLogStore();
    const setting = useSettingStore();
    const RESOURCE_TYPES = {
      VIDEO: "video",
      BOOK: "book",
      PPT: "ppt",
      TEXT: "text",
      LINK: "link",
      UNKNOWN: "unknown"
    };
    let currentRunId = 0;
    let videoEl = null;
    let urlWatcher = null;
    const waitFor = (selector, timeout = 1e4) => {
      return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const check = setInterval(() => {
          const el = document.querySelector(selector);
          if (el) {
            clearInterval(check);
            resolve(el);
            return;
          }
          if (Date.now() - startTime > timeout) {
            clearInterval(check);
            reject(new Error(`等待元素 ${selector} 超时`));
          }
        }, 300);
      });
    };
    const waitForMedia = (timeout = 5e3) => {
      return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const check = setInterval(() => {
          const media = document.querySelector("video,audio");
          if (media && media.src) {
            clearInterval(check);
            resolve(media);
            return;
          }
          if (Date.now() - startTime > timeout) {
            clearInterval(check);
            reject(new Error("未找到音视频元素"));
          }
        }, 200);
      });
    };
    const clickEl = (el) => {
      if (!el) return;
      if (typeof el.click === "function") {
        el.click();
        return;
      }
      el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    };
    const getVideoRate = () => {
      const rate = Number(setting.config.basicConfig.videoPlayrate.value);
      return Math.min(rate || 1, 1.5);
    };
    const getResourceCards = () => Array.from(document.querySelectorAll('[class*="card-container"]'));
    const getActiveCard = () => getResourceCards().find((card) => card.classList.contains("active")) || null;
    const getCardTitleEl = (card) => (card == null ? void 0 : card.querySelector(".common-text")) || (card == null ? void 0 : card.querySelector(".video-title")) || (card == null ? void 0 : card.querySelector(".basic-info-video-card-container")) || card;
    const getResourceType = (card) => {
      const iconBox = card == null ? void 0 : card.querySelector(".icon-box");
      const classes = (iconBox == null ? void 0 : iconBox.className) || "";
      if (classes.includes("video")) return RESOURCE_TYPES.VIDEO;
      if (classes.includes("book")) return RESOURCE_TYPES.BOOK;
      if (classes.includes("ppt") || classes.includes("other")) return RESOURCE_TYPES.PPT;
      if (classes.includes("text")) return RESOURCE_TYPES.TEXT;
      if (classes.includes("link")) return RESOURCE_TYPES.LINK;
      return RESOURCE_TYPES.UNKNOWN;
    };
    const isCardFinished = (card) => {
      var _a;
      const finishedIcon = card == null ? void 0 : card.querySelector(".finished-icon");
      if (!finishedIcon) return false;
      const text = ((_a = finishedIcon.textContent) == null ? void 0 : _a.trim()) || "";
      return !text || text.includes("已完成");
    };
    const getCurrentChapterName = () => {
      var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
      const sectionTitle = ((_b = (_a = document.querySelector(".point-title-text")) == null ? void 0 : _a.textContent) == null ? void 0 : _b.trim()) || ((_d = (_c = document.querySelector(".section-item-collapse-info.active .section-item-collapse-title")) == null ? void 0 : _c.textContent) == null ? void 0 : _d.trim()) || "未知章节";
      const cardTitle = ((_g = (_f = (_e = getActiveCard()) == null ? void 0 : _e.querySelector(".video-title")) == null ? void 0 : _f.textContent) == null ? void 0 : _g.trim()) || ((_j = (_i = (_h = getActiveCard()) == null ? void 0 : _h.querySelector(".common-text")) == null ? void 0 : _i.textContent) == null ? void 0 : _j.trim()) || "未知小节";
      return `${sectionTitle}-${cardTitle}`;
    };
    const getNextCard = () => {
      const cards = getResourceCards();
      if (!cards.length) return null;
      const activeIndex = cards.findIndex((card) => card.classList.contains("active"));
      const startIndex = activeIndex >= 0 ? activeIndex + 1 : 0;
      for (let index = startIndex; index < cards.length; index++) {
        const card = cards[index];
        if (!isCardFinished(card)) return card;
      }
      return null;
    };
    const parseRequiredProgress = (section) => {
      var _a;
      const text = ((_a = section == null ? void 0 : section.querySelector(".collapse-info-progress .progress-text")) == null ? void 0 : _a.textContent) || "";
      const match = text.replace(/\s/g, "").match(/(\d+)\/(\d+)/);
      if (!match) return null;
      const progress = parseInt(match[1], 10);
      const total = parseInt(match[2], 10);
      if (Number.isNaN(progress) || Number.isNaN(total)) return null;
      return { progress, total };
    };
    const getNextSection = () => {
      var _a;
      const sections = Array.from(
        document.querySelectorAll(".section-item-collapse-info")
      );
      const active = sections.find((section) => section.classList.contains("active"));
      const unfinishedSections = sections.map((section) => ({ section, progress: parseRequiredProgress(section) })).filter(({ progress }) => progress && progress.progress < progress.total);
      if (!unfinishedSections.length) return null;
      const activeIndex = unfinishedSections.findIndex(
        ({ section }) => section === active
      );
      if (activeIndex >= 0) {
        return ((_a = unfinishedSections[activeIndex + 1]) == null ? void 0 : _a.section) || null;
      }
      return unfinishedSections[0].section;
    };
    const setCardActive = (card) => {
      getResourceCards().forEach((item) => item.classList.remove("active"));
      card == null ? void 0 : card.classList.add("active");
    };
    const clickResourceCard = async (card) => {
      const type = getResourceType(card);
      const target = getCardTitleEl(card);
      if (type !== RESOURCE_TYPES.UNKNOWN) {
        clickEl(target);
        return;
      }
      setCardActive(card);
      const pageWindow = globalThis.unsafeWindow || window;
      const originalOpen = pageWindow.open;
      try {
        pageWindow.open = () => null;
        clickEl(target);
        await sleep(3);
      } finally {
        pageWindow.open = originalOpen;
      }
    };
    const cleanupVideo = () => {
      if (!videoEl) return;
      videoEl.onpause = null;
      videoEl.onended = null;
      videoEl = null;
    };
    const processNext = async (runId) => {
      var _a, _b, _c, _d;
      if (runId !== currentRunId) return;
      const nextCard = getNextCard();
      if (nextCard) {
        const title = ((_b = (_a = nextCard.querySelector(".common-text")) == null ? void 0 : _a.textContent) == null ? void 0 : _b.trim()) || ((_d = (_c = nextCard.querySelector(".video-title")) == null ? void 0 : _c.textContent) == null ? void 0 : _d.trim()) || "下一资源";
        log.insertLog(`跳转到资源: ${title}`);
        await clickResourceCard(nextCard);
        await sleep(3);
        await doWork();
        return;
      }
      await nextSection(runId);
    };
    const processVideo = async (runId) => {
      try {
        const wrapper = document.querySelector(".video-player-wrapper");
        if (!wrapper || wrapper.style.display === "none") {
          throw new Error("视频未加载");
        }
        videoEl = await waitForMedia();
        if (runId !== currentRunId) return;
        videoEl.currentTime = Math.max(videoEl.currentTime, 1);
        videoEl.volume = 0;
        videoEl.muted = true;
        videoEl.playbackRate = getVideoRate();
        log.insertLog(`已设置播放倍速: ${videoEl.playbackRate}x`);
        videoEl.play().catch(() => {
          videoEl.muted = true;
          videoEl.play().catch(() => {
          });
        });
        log.insertLog(`正在学习: ${getCurrentChapterName()}`);
        videoEl.onpause = async () => {
          if (runId !== currentRunId || !videoEl || videoEl.ended) return;
          await sleep(1);
          videoEl == null ? void 0 : videoEl.play().catch(() => {
          });
        };
        videoEl.onended = async () => {
          if (runId !== currentRunId) return;
          log.insertLog("视频播放完毕，即将跳转下一资源");
          await sleep(3);
          await processNext(runId);
        };
      } catch (e) {
        log.insertLog(`未找到学习视频，即将跳转下一资源: ${e.message}`, "warning");
        await sleep(3);
        await processNext(runId);
      }
    };
    const processPpt = async (runId) => {
      try {
        const container = document.querySelector(".preview-section .ppt-preview-container");
        if (!container) {
          await processPassiveResource(runId, "PPT资源");
          return;
        }
        const getPageInfo = () => {
          var _a, _b;
          const current2 = parseInt((_a = container.querySelector(".page-current")) == null ? void 0 : _a.textContent, 10) || 0;
          const total2 = parseInt((_b = container.querySelector(".page-total")) == null ? void 0 : _b.textContent, 10) || 0;
          return [current2, total2];
        };
        let [current, total] = getPageInfo();
        if (!current || !total) {
          await processPassiveResource(runId, "PPT资源");
          return;
        }
        log.insertLog(`PPT共 ${total} 页，从第 ${current} 页开始`);
        while (runId === currentRunId && current < total) {
          clickEl(container.querySelector(".next-page-btn"));
          await sleep(4);
          [current, total] = getPageInfo();
        }
        log.insertLog("PPT翻页完成");
        await processNext(runId);
      } catch (e) {
        log.insertLog(`PPT处理出错: ${e.message}`, "warning");
        await processNext(runId);
      }
    };
    const processBook = async (runId) => {
      try {
        await waitFor(".preview-section .book-mark .book-container", 5e3);
        const container = document.querySelector(
          ".preview-section .book-mark .book-container"
        );
        if (!container) {
          await processPassiveResource(runId, "电子书资源");
          return;
        }
        log.insertLog("发现电子书资源，正在阅读..");
        while (runId === currentRunId && container.scrollTop + container.clientHeight < container.scrollHeight - 2) {
          container.scrollTo({
            top: Math.min(
              container.scrollTop + Math.max(container.clientHeight * 0.8, 200),
              container.scrollHeight
            ),
            behavior: "smooth"
          });
          await sleep(1.5);
        }
        log.insertLog("电子书阅读完成");
        await processNext(runId);
      } catch {
        await processPassiveResource(runId, "电子书资源");
      }
    };
    const processPassiveResource = async (runId, label) => {
      if (runId !== currentRunId) return;
      log.insertLog(`${label}已处理，即将跳转下一资源`);
      await sleep(3);
      await processNext(runId);
    };
    async function doWork() {
      const runId = ++currentRunId;
      cleanupVideo();
      await sleep(5);
      if (runId !== currentRunId) return;
      let card = getActiveCard();
      if (card && isCardFinished(card)) {
        log.insertLog("当前资源已完成，跳过..");
        card = getNextCard();
        if (!card) {
          await nextSection(runId);
          return;
        }
        await clickResourceCard(card);
        await sleep(3);
        card = getActiveCard() || card;
      }
      if (!card) {
        card = getNextCard();
        if (!card && getResourceCards().length) {
          await nextSection(runId);
          return;
        }
        if (card) {
          await clickResourceCard(card);
          await sleep(3);
          card = getActiveCard() || card;
        }
      }
      if (!card) {
        log.insertLog("未找到学习资源，尝试跳转下一章节..", "warning");
        await nextSection(runId);
        return;
      }
      const type = getResourceType(card);
      log.insertLog(`处理资源类型: ${type}`);
      switch (type) {
        case RESOURCE_TYPES.VIDEO:
          await processVideo(runId);
          break;
        case RESOURCE_TYPES.BOOK:
          await processBook(runId);
          break;
        case RESOURCE_TYPES.PPT:
          await processPpt(runId);
          break;
        case RESOURCE_TYPES.TEXT:
          await processPassiveResource(runId, "文本资源");
          break;
        case RESOURCE_TYPES.LINK:
        case RESOURCE_TYPES.UNKNOWN:
        default:
          await processPassiveResource(runId, "当前资源");
      }
    }
    async function nextSection(runId) {
      var _a, _b;
      if (runId !== currentRunId) return;
      const next = getNextSection();
      if (!next) {
        log.insertLog("所有必学章节已完成！");
        return;
      }
      const title = ((_b = (_a = next.querySelector(".section-item-collapse-title")) == null ? void 0 : _a.textContent) == null ? void 0 : _b.trim()) || "下一章节";
      log.insertLog(`跳转到: ${title}`);
      clickEl(next);
      await sleep(5);
      await doWork();
    }
    const dismissPopups = () => {
      const noteDialog = document.querySelector(".read-note-dialog");
      if (noteDialog && getComputedStyle(noteDialog).display !== "none") {
        const btn = noteDialog.querySelector("button");
        if (btn) {
          clickEl(btn);
          log.insertLog("已关闭阅读提示弹窗");
        }
      }
    };
    const watchUrlChange = () => {
      if (urlWatcher) clearInterval(urlWatcher);
      let prevUrl = location.href;
      urlWatcher = setInterval(() => {
        if (location.href === prevUrl) return;
        prevUrl = location.href;
        if (location.href.includes("/learnPage")) {
          log.insertLog("检测到页面切换，重新初始化..");
          doWork();
        }
      }, 1500);
    };
    const start = async () => {
      log.insertLog("进入智慧树新形态课程学习页面，脚本开始工作..");
      setting.tabIndex = "1";
      if (location.href.includes("/singleCourse")) {
        log.insertLog("请点击任意章节开始学习，进入学习页后将自动处理..", "warning");
        return;
      }
      await sleep(6);
      dismissPopups();
      try {
        await waitFor(".section-item-collapse-info", 15e3);
      } catch {
        log.insertLog("等待章节列表加载超时..", "warning");
      }
      watchUrlChange();
      await doWork();
    };
    start();
  };
  const studyPlusLogic = () => {
    const log = useLogStore();
    const setting = useSettingStore();
    let videoEl = null;
    let quizTimer = null;
    let finishTimer = null;
    let visibilityTimer = null;
    let isSwitching = false;
    let isHandlingQuiz = false;
    let visibilityWarned = false;
    const waitFor = (target, timeout = 1e4, interval = 300) => {
      return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const check = setInterval(() => {
          const result = typeof target === "function" ? target() : document.querySelector(target);
          if (result) {
            clearInterval(check);
            resolve(result);
            return;
          }
          if (Date.now() - startTime > timeout) {
            clearInterval(check);
            reject(new Error("等待页面内容加载超时"));
          }
        }, interval);
      });
    };
    const clickEl = async (el) => {
      var _a, _b, _c;
      if (!el) return false;
      (_a = el.scrollIntoView) == null ? void 0 : _a.call(el, { behavior: "smooth", block: "center" });
      await sleep(0.2);
      (_b = el.click) == null ? void 0 : _b.call(el);
      (_c = el.dispatchEvent) == null ? void 0 : _c.call(el, new MouseEvent("click", { bubbles: true }));
      return true;
    };
    const getRate = () => {
      const rate = Number(setting.config.basicConfig.videoPlayrate.value);
      return Math.min(rate || 1, 1.5);
    };
    const getCourseName = () => {
      var _a, _b;
      const text = (_b = (_a = document.querySelector(".top-back-box > span:nth-child(2), .course-name")) == null ? void 0 : _a.textContent) == null ? void 0 : _b.trim();
      return (text == null ? void 0 : text.replace(/^课程名称[:：]\s*/, "")) || "未知课程";
    };
    const getChapterItems = () => Array.from(document.querySelectorAll(".child-main")).filter(
      (el) => {
        var _a;
        return (_a = el.parentElement) == null ? void 0 : _a.querySelector(".child-time");
      }
    );
    const getCurrentChapter = () => getChapterItems().find((el) => el.classList.contains("current"));
    const getChapterName = (item) => {
      var _a, _b;
      return ((_b = (_a = item == null ? void 0 : item.parentElement) == null ? void 0 : _a.textContent) == null ? void 0 : _b.replace(/\s+/g, " ").trim()) || "未知章节";
    };
    const isChapterFinished = (item) => {
      var _a;
      return !!((_a = item == null ? void 0 : item.parentElement) == null ? void 0 : _a.querySelector(".finish-icon"));
    };
    const getNextChapter = () => {
      const items = getChapterItems().filter((item) => !isChapterFinished(item));
      if (!items.length) return null;
      const current = getCurrentChapter();
      const currentIndex = items.indexOf(current);
      return currentIndex >= 0 ? items[currentIndex + 1] : items[0];
    };
    const cleanupVideo = () => {
      if (!videoEl) return;
      videoEl.onpause = null;
      videoEl.onended = null;
      videoEl = null;
    };
    const handleQuizDialog = async () => {
      if (isHandlingQuiz) return;
      const dialog = document.querySelector(".ai-test-question-wrapper");
      if (!dialog) return;
      isHandlingQuiz = true;
      try {
        const done = dialog.querySelector(".done");
        const closeBtn = dialog.querySelector(".close-box");
        if (done) {
          await clickEl(closeBtn);
          return;
        }
        const options = Array.from(dialog.querySelectorAll(".options .option"));
        if (options.length) {
          const option = options[Math.floor(Math.random() * options.length)];
          await clickEl(option);
          await sleep(1);
        }
        await clickEl(document.querySelector(".submit-btn .submits"));
        await sleep(1);
        await clickEl(closeBtn);
        log.insertLog("随堂练习弹窗已处理");
      } finally {
        await sleep(1);
        isHandlingQuiz = false;
      }
    };
    const fixControls = () => {
      const bar = document.querySelector(".controlsBar");
      if (!bar) return;
      bar.style.display = "block";
      bar.style.zIndex = "2";
    };
    const playVideo = async () => {
      cleanupVideo();
      try {
        fixControls();
        videoEl = await waitFor(() => {
          const media = document.querySelector("video, audio");
          return (media == null ? void 0 : media.src) ? media : null;
        }, 15e3);
        videoEl.currentTime = Math.max(videoEl.currentTime, 1);
        videoEl.volume = 0;
        videoEl.muted = true;
        videoEl.playbackRate = getRate();
        log.insertLog(`正在学习：${getChapterName(getCurrentChapter())}`);
        log.insertLog(`已设置播放倍速: ${videoEl.playbackRate}x`);
        videoEl.play().catch(() => {
        });
        videoEl.onpause = () => {
          if (!videoEl || videoEl.ended || isSwitching || isHandlingQuiz) return;
          setTimeout(() => {
            var _a;
            return (_a = videoEl == null ? void 0 : videoEl.play) == null ? void 0 : _a.call(videoEl).catch(() => {
            });
          }, 1e3);
        };
        videoEl.onended = async () => {
          if (isSwitching) return;
          await sleep(2);
          await nextChapter();
        };
      } catch (error) {
        log.insertLog(`${error.message || "视频加载失败"}，尝试切换下一节..`, "warning");
        await sleep(2);
        await nextChapter();
      }
    };
    const nextChapter = async () => {
      if (isSwitching) return;
      if (!setting.config.basicConfig.autoChangeChapter.value) {
        log.insertLog(
          "自动切换章节未开启，前往<span class='module'>设置</span>模块中更改",
          "warning"
        );
        return;
      }
      isSwitching = true;
      cleanupVideo();
      const next = getNextChapter();
      if (!next) {
        log.insertLog("所有章节视频已完成！");
        isSwitching = false;
        return;
      }
      log.insertLog(`跳转到: ${getChapterName(next)}`);
      await clickEl(next);
      await sleep(5);
      isSwitching = false;
      playVideo();
    };
    const startPolling = () => {
      quizTimer = setInterval(handleQuizDialog, 3e3);
      finishTimer = setInterval(() => {
        if (isSwitching) return;
        const current = getCurrentChapter();
        if (current && isChapterFinished(current)) nextChapter();
      }, 2e3);
      visibilityTimer = setInterval(() => {
        if (document.visibilityState === "hidden" && !visibilityWarned) {
          visibilityWarned = true;
          log.insertLog("页面未保持前台，学习流程可能无法正常推进..", "warning");
        } else if (document.visibilityState === "visible") {
          visibilityWarned = false;
        }
      }, 1e3);
    };
    const start = async () => {
      log.insertLog(`进入智慧树新共享课学习页面（${getCourseName()}），脚本开始工作..`);
      setting.tabIndex = "1";
      await sleep(5);
      try {
        await waitFor(".child-main", 2e4);
      } catch {
        log.insertLog("等待章节列表加载超时，尝试继续处理..", "warning");
      }
      document.querySelectorAll(".el-overlay,.el-dialog").forEach((dialog) => {
        dialog.style.display = "none";
      });
      startPolling();
      playVideo();
    };
    start();
    return () => {
      cleanupVideo();
      if (quizTimer) clearInterval(quizTimer);
      if (finishTimer) clearInterval(finishTimer);
      if (visibilityTimer) clearInterval(visibilityTimer);
    };
  };
  const TYPE_TEXT_MAP = [
    { keywords: ["多选", "多项"], type: "多选题" },
    { keywords: ["判断", "是非"], type: "判断题" },
    { keywords: ["填空"], type: "填空题" },
    { keywords: ["简答"], type: "简答题" },
    { keywords: ["论述"], type: "论述题" },
    { keywords: ["计算"], type: "计算题" },
    { keywords: ["单选", "单项"], type: "单选题" }
  ];
  const QUESTION_TYPE_CODE_MAP = {
    单选题: "0",
    单项选择题: "0",
    单选: "0",
    多选题: "1",
    多项选择题: "1",
    多选: "1",
    填空题: "2",
    填空: "2",
    判断题: "3",
    判断: "3",
    是非题: "3",
    简答题: "4",
    简答: "4",
    名词解释: "5",
    论述题: "6",
    论述: "6",
    计算题: "7",
    计算: "7"
  };
  const PROFILES = [
    {
      name: "新形态正式考试",
      root: ".question-area-content",
      type: [
        "div.flex.items-center.mb-\\[16px\\]",
        "[class*='question-type']",
        "[class*='mb-[16px]']"
      ],
      title: [
        "div.flex-1 .mb-\\[32px\\] .text-mainText.font-medium",
        ".text-mainText.font-medium",
        "[class*='text-mainText'][class*='font-medium']",
        "[class*='question'][class*='title']"
      ],
      options: [
        "label.user-select.group",
        "label[class*='user-select']",
        "label.group",
        "[role='radio']",
        "[role='checkbox']"
      ],
      beforeParse: async () => {
        var _a;
        const firstButton = document.querySelector(".grid.grid-cols-7 > button") || Array.from(document.querySelectorAll("button")).find(
          (button) => {
            var _a2;
            return ((_a2 = button.textContent) == null ? void 0 : _a2.trim()) === "1";
          }
        );
        if (firstButton) {
          firstButton.click();
        }
        const startTime = Date.now();
        while (Date.now() - startTime < 1e4) {
          const root = document.querySelector(".question-area-content");
          if ((_a = root == null ? void 0 : root.textContent) == null ? void 0 : _a.trim()) return;
          await sleep(0.3);
        }
      },
      nextButton: () => Array.from(document.querySelectorAll("button")).find(
        (button) => {
          var _a;
          return (_a = button.textContent) == null ? void 0 : _a.includes("下一题");
        }
      ),
      useAnswerSheet: true
    },
    {
      name: "新形态作业考试",
      root: ".questionBox",
      type: ".questionTit",
      title: ".questionContent",
      options: ".optionUl label",
      nextButton: "span.Topicswitchingbtn:nth-child(2)"
    },
    {
      name: "新形态掌握度",
      root: ".questionContent",
      type: ".questionName",
      title: ".questionName .centent-pre",
      options: ".radio-view li.clearfix, .checkbox-views label.el-checkbox, .fillAnswer"
    },
    {
      name: "AI掌握度",
      root: ".exam-item",
      type: ".quest-type",
      title: ".quest-title .option-name",
      options: "label"
    }
  ];
  const smartAnswerLogic = async () => {
    var _a, _b;
    const log = useLogStore();
    const setting = useSettingStore();
    const questionStore = useQuestionStore();
    if (!setting.config.basicConfig.autoAnswer.value) {
      log.insertLog(
        `自动答题已关闭，请前往<span class='module'>设置</span>模块中更改`
      );
      return;
    }
    const cleanText = (text = "") => String(text ?? "").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
    const normalize = (text = "") => cleanText(text).replace(/^[A-Z][.、．]\s*/i, "").replace(/[^\p{L}\p{N}√×]/gu, "").toLowerCase();
    const htmlOf = (el) => (el == null ? void 0 : el.innerHTML) || (el == null ? void 0 : el.textContent) || "";
    const getByKeys = (obj, keys) => {
      if (!obj || typeof obj !== "object") return "";
      const key = keys.find((item) => obj[item] != null && obj[item] !== "");
      return key ? obj[key] : "";
    };
    const parseJsonLike = (value) => {
      if (typeof value !== "string") return value;
      const text = value.trim();
      if (!/^[\[{]/.test(text)) return value;
      try {
        return JSON.parse(text);
      } catch {
        return value;
      }
    };
    const normalizePayload = (payload) => {
      const visited = /* @__PURE__ */ new WeakSet();
      const normalizeNode = (node) => {
        const parsed = parseJsonLike(node);
        if (!parsed || typeof parsed !== "object") return parsed;
        if (visited.has(parsed)) return parsed;
        visited.add(parsed);
        if (Array.isArray(parsed)) return parsed.map(normalizeNode);
        Object.keys(parsed).forEach((key) => {
          parsed[key] = normalizeNode(parsed[key]);
        });
        return parsed;
      };
      return normalizeNode(payload);
    };
    const normalizeOption = (option) => ({
      text: cleanText(
        getByKeys(option, [
          "option",
          "content",
          "optionContent",
          "optionText",
          "optionName",
          "optionTitle",
          "answer",
          "answerContent",
          "answerText",
          "name",
          "text",
          "title",
          "label",
          "value"
        ])
      ),
      html: String(
        getByKeys(option, ["content", "optionContent", "optionName", "name", "text"]) || ""
      )
    });
    const extractOptionList = (obj) => {
      const optionList = getByKeys(obj, [
        "questionOptions",
        "questionOption",
        "options",
        "optionList",
        "questionOptionList",
        "questionOptionDTOList",
        "questionOptionsList",
        "optionContentList",
        "answerOptions",
        "answerOptionList",
        "answerList",
        "answerDtos",
        "answerDTOList",
        "answers",
        "optionVos",
        "optionVOList",
        "items"
      ]);
      if (!Array.isArray(optionList)) return [];
      return optionList.map(normalizeOption).filter((option) => option.text);
    };
    const normalizeApiType = (typeText) => {
      const text = String(typeText || "");
      const matched = TYPE_TEXT_MAP.find(
        ({ keywords }) => keywords.some((keyword) => text.includes(keyword))
      );
      if (matched) return matched.type;
      if (QUESTION_TYPE_CODE_MAP[text]) return text;
      const codeMap = {
        1: "单选题",
        2: "多选题",
        3: "判断题",
        4: "填空题",
        5: "简答题",
        14: "判断题"
      };
      return codeMap[text] || "单选题";
    };
    const collectAnswerSheetMetaQuestions = (payload) => {
      var _a2;
      const normalizedPayload = normalizePayload(payload);
      const parts = (_a2 = normalizedPayload == null ? void 0 : normalizedPayload.data) == null ? void 0 : _a2.partSheetVos;
      if (!Array.isArray(parts)) return [];
      return parts.flatMap(
        (part) => (part.questionSheetVos || []).map((question) => ({
          type: normalizeApiType(question.questionType || part.name),
          sort: Number(question.sort) || 0,
          questionId: question.questionId,
          version: question.version,
          partName: part.name
        }))
      ).sort((a, b) => a.sort - b.sort);
    };
    const collectAnswerSheetQuestions = (payload) => {
      const metaQuestions = collectAnswerSheetMetaQuestions(payload);
      if (metaQuestions.length) return metaQuestions;
      const questions2 = [];
      const visited = /* @__PURE__ */ new WeakSet();
      const normalizedPayload = normalizePayload(payload);
      const titleKeys = [
        "questionName",
        "questionTitle",
        "questionContent",
        "questionContentText",
        "questionText",
        "questionStem",
        "questionStemContent",
        "questionStemRich",
        "questionStemRichText",
        "questionDescribe",
        "questionDesc",
        "questionBody",
        "stemContent",
        "stemText",
        "stem",
        "title",
        "name",
        "content",
        "contentText",
        "topicContent",
        "topicName"
      ];
      const typeKeys = [
        "questionTypeName",
        "questionType",
        "questionTypeStr",
        "questionTypeText",
        "questionTypeCode",
        "questionTypeId",
        "questionTypeDto",
        "questionTypeDTO",
        "typeName",
        "type"
      ];
      const walk = (node) => {
        if (!node || typeof node !== "object") return;
        if (visited.has(node)) return;
        visited.add(node);
        if (Array.isArray(node)) {
          node.forEach(walk);
          return;
        }
        const rawTitle = getByKeys(node, titleKeys);
        const title = cleanText(
          typeof rawTitle === "object" ? getByKeys(rawTitle, ["name", "title", "content", "text", "value"]) : rawTitle
        );
        const options = extractOptionList(node);
        if (title && (options.length || title.length > 6)) {
          const optionsObject = {};
          options.forEach((option) => {
            optionsObject[option.text] = option.html || option.text;
          });
          questions2.push({
            type: normalizeApiType(
              (() => {
                const typeValue = getByKeys(node, typeKeys);
                return typeof typeValue === "object" ? getByKeys(typeValue, ["name", "title", "text", "value", "code", "id"]) : typeValue;
              })()
            ),
            title,
            optionsText: options.map((option) => option.text),
            options: optionsObject
          });
        }
        Object.values(node).forEach(walk);
      };
      walk(normalizedPayload);
      const seen = /* @__PURE__ */ new Set();
      return questions2.filter((question) => {
        const key = `${question.title}|${question.optionsText.join("|")}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    };
    const waitForAnswerSheetQuestions = async () => {
      const pageWindow = _unsafeWindow || window;
      if (pageWindow.__ABC_ZHS_ANSWER_SHEET__) {
        return collectAnswerSheetQuestions(pageWindow.__ABC_ZHS_ANSWER_SHEET__);
      }
      return new Promise((resolve) => {
        const timer = setTimeout(() => resolve([]), 1e4);
        pageWindow.addEventListener(
          "ABC_ZHS_ANSWER_SHEET",
          (event) => {
            clearTimeout(timer);
            resolve(collectAnswerSheetQuestions(event.detail));
          },
          { once: true }
        );
      });
    };
    const describePayloadShape = (payload) => {
      const normalizedPayload = normalizePayload(payload);
      const topKeys = normalizedPayload && typeof normalizedPayload === "object" ? Object.keys(normalizedPayload).slice(0, 12) : [];
      const candidateKeys = [];
      const visited = /* @__PURE__ */ new WeakSet();
      const walk = (node) => {
        if (!node || typeof node !== "object" || candidateKeys.length >= 5) return;
        if (visited.has(node)) return;
        visited.add(node);
        if (Array.isArray(node)) {
          node.slice(0, 5).forEach(walk);
          return;
        }
        const keys = Object.keys(node);
        if (keys.some((key) => /question|option|answer|stem|title|content/i.test(key))) {
          candidateKeys.push(keys.slice(0, 16).join(","));
        }
        Object.values(node).forEach(walk);
      };
      walk(normalizedPayload);
      return {
        topKeys,
        candidateKeys
      };
    };
    const toSelectorList = (selectors) => Array.isArray(selectors) ? selectors : [selectors].filter(Boolean);
    const queryAllSafe = (root, selectors) => {
      const results = [];
      toSelectorList(selectors).forEach((selector) => {
        try {
          results.push(...root.querySelectorAll(selector));
        } catch {
        }
      });
      return Array.from(new Set(results));
    };
    const queryOneSafe = (root, selectors) => queryAllSafe(root, selectors)[0] || null;
    const resolveType = (root, profile2) => {
      var _a2;
      const rawText = ((_a2 = queryOneSafe(root, profile2.type)) == null ? void 0 : _a2.textContent) || root.textContent || "";
      const matched = TYPE_TEXT_MAP.find(
        ({ keywords }) => keywords.some((keyword) => rawText.includes(keyword))
      );
      return (matched == null ? void 0 : matched.type) || "单选题";
    };
    const toApiQuestion = (question) => ({
      ...question,
      type: QUESTION_TYPE_CODE_MAP[question.type] || question.type || "999"
    });
    const getActiveProfile = async () => {
      const startTime = Date.now();
      while (Date.now() - startTime < 2e4) {
        const profile2 = PROFILES.find((item) => document.querySelector(item.root));
        if (profile2) return profile2;
        await sleep(0.3);
      }
      return null;
    };
    const parseQuestions = (profile2) => {
      const roots = Array.from(document.querySelectorAll(profile2.root));
      return roots.map((root) => {
        const optionEls = queryAllSafe(root, profile2.options).filter(
          (option) => cleanText(option.textContent)
        );
        const optionsText = optionEls.map((option) => cleanText(option.textContent));
        const options = {};
        optionEls.forEach((option, index) => {
          options[optionsText[index]] = htmlOf(option);
        });
        const titleEl = queryOneSafe(root, profile2.title);
        let title = cleanText(htmlOf(titleEl));
        if (!title) {
          const optionTextSet = new Set(optionsText.map((option) => normalize(option)));
          title = queryAllSafe(root, "div, p, span").map((el) => cleanText(el.textContent)).filter((text) => text.length > 4).filter((text) => !optionTextSet.has(normalize(text))).filter(
            (text) => !TYPE_TEXT_MAP.some(
              ({ keywords }) => keywords.some((keyword) => text === keyword || text === `${keyword}题`)
            )
          ).sort((a, b) => b.length - a.length)[0] || "";
        }
        return {
          element: root,
          type: resolveType(root, profile2),
          title,
          optionsText,
          options,
          optionEls,
          answer: { code: -1, answer: [] },
          workType: "zhs",
          refer: location.href,
          id: "zhs"
        };
      });
    };
    const isChoiceType = (type) => ["单选题", "多选题", "判断题"].includes(type);
    const fillBlank = (question, answers) => {
      const inputs = Array.from(
        question.element.querySelectorAll("input, textarea, .fillAnswer input, .fillAnswer textarea")
      );
      if (!inputs.length) return false;
      inputs.forEach((input, index) => {
        const value = answers[index] || answers[0] || "";
        input.value = value;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
      });
      return true;
    };
    const fillChoice = (question, answers) => {
      var _a2;
      const optionEls = ((_a2 = question.optionEls) == null ? void 0 : _a2.length) ? question.optionEls : Array.from(
        question.element.querySelectorAll(
          ".optionUl label, label.user-select.group, .radio-view li.clearfix, .checkbox-views label.el-checkbox, label, [role='radio'], [role='checkbox']"
        )
      ).filter((option) => cleanText(option.textContent));
      let selected = false;
      const normalizedAnswers = answers.map((answer) => normalize(answer));
      const judgementAnswer = normalizedAnswers[0];
      optionEls.forEach((option) => {
        const optionText = normalize(option.textContent);
        const isJudgementMatched = question.type === "判断题" && (/^(正确|是|对|√|t|true|right)$/i.test(judgementAnswer) && /^(正确|是|对|√|t|true|right)$/i.test(optionText) || /^(错误|否|错|×|f|false|wrong)$/i.test(judgementAnswer) && /^(错误|否|错|×|f|false|wrong)$/i.test(optionText));
        if (normalizedAnswers.includes(optionText) || isJudgementMatched) {
          selected = true;
          option.click();
          option.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        }
      });
      return selected;
    };
    const fillQuestion = (question) => {
      var _a2;
      const answers = ((_a2 = question.answer) == null ? void 0 : _a2.answer) || [];
      if (!answers.length) return false;
      if (isChoiceType(question.type)) return fillChoice(question, answers);
      return fillBlank(question, answers);
    };
    const searchAndFill = async (question) => {
      const { answerMode } = setting.config.basicConfig;
      const mode = answerMode.value;
      let handled = false;
      const apiQuestion = toApiQuestion(question);
      if (mode !== "ai") {
        const answerData = await getAccurateAnswer(apiQuestion);
        if (answerData.code === 1) {
          question.answer = { code: 1, answer: answerData.data.answer };
          setting.userInfo.remainCount = formatLocalRemainCount(answerData.data.remainCount);
          saveAnswerRecord({
            question: apiQuestion,
            answer: answerData.data.answer,
            source: "accurate"
          });
          handled = true;
        } else if (mode === "questionBank" || answerData.code !== -1004) {
          question.answer = { code: answerData.code, answer: [answerData.msg] };
          handled = true;
        }
      }
      if (!handled) {
        if (isChoiceType(question.type)) {
          const aiAnswerData = await getAIAnswer(apiQuestion);
          if (aiAnswerData.code === 1) {
            question.answer = { code: 2, answer: aiAnswerData.data.answer };
            setting.userInfo.remainCount = formatLocalRemainCount(aiAnswerData.data.remainCount);
            saveAnswerRecord({
              question: apiQuestion,
              answer: aiAnswerData.data.answer,
              source: "ai"
            });
          } else {
            question.answer = { code: aiAnswerData.code, answer: [aiAnswerData.msg] };
          }
        } else {
          question.answer = { code: -1, answer: ["该题型不支持AI答题"] };
        }
      }
      if ([1, 2].includes(question.answer.code)) {
        const filled = fillQuestion(question);
        if (!filled) question.answer.code = 0;
        return filled;
      }
      return false;
    };
    const profile = await getActiveProfile();
    if (!profile) {
      log.insertLog("未识别到支持的题目区域，请确认页面已加载完成..", "warning");
      return;
    }
    log.insertLog(`进入${profile.name}页面，脚本开始工作..`);
    setting.tabIndex = "1";
    questionStore.accuracy = -1;
    await ((_a = profile.beforeParse) == null ? void 0 : _a.call(profile));
    const answerSheetQuestions = profile.useAnswerSheet ? await waitForAnswerSheetQuestions() : [];
    if (answerSheetQuestions.length) {
      log.insertLog(`已从接口读取到${answerSheetQuestions.length}个题目元信息..`);
    } else if (profile.useAnswerSheet) {
      const answerSheetPayload = (_unsafeWindow || window).__ABC_ZHS_ANSWER_SHEET__;
      const { topKeys, candidateKeys } = answerSheetPayload ? describePayloadShape(answerSheetPayload) : { topKeys: [], candidateKeys: [] };
      log.insertLog(
        answerSheetPayload ? `已捕获考试接口但未提取到题目，顶层字段：${topKeys.join(",") || "无"}；候选字段：${candidateKeys.join(" | ") || "无"}` : "未捕获到考试题目信息接口，将回退到页面 DOM 解析..",
        "warning"
      );
    }
    const questions = [];
    let correctNum = 0;
    const handleCurrentPage = async () => {
      var _a2;
      let rawQuestions = parseQuestions(profile);
      if (answerSheetQuestions.length) {
        const apiQuestion = answerSheetQuestions[questions.length];
        const domQuestion = rawQuestions[0] || {};
        rawQuestions = apiQuestion ? [
          {
            ...domQuestion,
            ...apiQuestion,
            title: apiQuestion.title || domQuestion.title,
            optionsText: ((_a2 = apiQuestion.optionsText) == null ? void 0 : _a2.length) ? apiQuestion.optionsText : domQuestion.optionsText || [],
            options: Object.keys(apiQuestion.options || {}).length ? apiQuestion.options : domQuestion.options || {},
            element: domQuestion.element || document,
            optionEls: domQuestion.optionEls || [],
            answer: { code: -1, answer: [] },
            workType: "zhs",
            refer: location.href,
            id: apiQuestion.questionId || "zhs"
          }
        ] : [];
      }
      const pageQuestions = rawQuestions.filter((question) => question.title);
      if (!pageQuestions.length) {
        const rootTexts = Array.from(document.querySelectorAll(profile.root)).map(
          (root) => {
            var _a3;
            return (_a3 = root.textContent) == null ? void 0 : _a3.replace(/\s+/g, " ").trim().slice(0, 80);
          }
        );
        const buttons = Array.from(document.querySelectorAll("button")).map((button) => {
          var _a3;
          return (_a3 = button.textContent) == null ? void 0 : _a3.replace(/\s+/g, " ").trim();
        }).filter(Boolean).slice(0, 20);
        log.insertLog(
          `题目区域数量：${rawQuestions.length}，选项数量：${rawQuestions.reduce(
          (sum, question) => sum + question.optionsText.length,
          0
        )}，题目区域文本：${rootTexts.join(" | ") || "空"}，按钮：${buttons.join(" / ") || "无"}`,
          "warning"
        );
      }
      if (!pageQuestions.length) return false;
      questions.push(...pageQuestions);
      questionStore.questionList = [...questions];
      log.insertLog(`当前页面解析到${pageQuestions.length}个题目..`);
      for (const question of pageQuestions) {
        const questionIndex = questions.indexOf(question);
        questionStore.currentQuestionIndex = questionIndex;
        questionStore.questionList = [...questions];
        const filled = await searchAndFill(question);
        if (filled) correctNum += 1;
        questionStore.currentQuestionIndex = questionIndex + 1;
        questionStore.questionList = [...questions];
        await sleep(0.5);
      }
      return true;
    };
    setting.tabIndex = "2";
    let previousTitle = "";
    while (true) {
      const parsed = await handleCurrentPage();
      if (!parsed) break;
      if (!profile.nextButton) break;
      const nextButton = typeof profile.nextButton === "function" ? profile.nextButton() : document.querySelector(profile.nextButton);
      if (!nextButton || nextButton.classList.contains("disabled")) break;
      const currentTitle = ((_b = questions[questions.length - 1]) == null ? void 0 : _b.title) || "";
      if (currentTitle && currentTitle === previousTitle) break;
      previousTitle = currentTitle;
      nextButton.click();
      await sleep(1);
    }
    if (!questions.length) {
      log.insertLog("没有解析到题目，请检查是否进入正确页面...", "warning");
      return;
    }
    questionStore.currentQuestionIndex = questions.length;
    questionStore.accuracy = (correctNum / questions.length * 100).toFixed(1);
    log.insertLog(
      `答题完毕,正确率为${questionStore.accuracy}%,详情请前往<span class='module'>答题</span>模块查看..`
    );
    setTimeout(() => {
      setting.tabIndex = "1";
    }, 2e3);
  };
  const specialStudyLogic = () => {
    const log = useLogStore();
    const setting = useSettingStore();
    let videoEl = null;
    let finishTimer = null;
    let visibilityTimer = null;
    let isSwitching = false;
    let visibilityWarned = false;
    const pageProfiles = [
      {
        name: "校内课",
        list: ".file-item",
        current: ".file-item.active",
        title: "#sourceTit",
        done: ".icon-finish",
        media: "#mediaPlayer, video, audio",
        needsStudy: (item) => !item.querySelector(".icon-finish")
      },
      {
        name: "教学空间AI智慧课程",
        list: ".source-icon",
        current: ".active-file",
        title: ".active-file",
        done: "i.select",
        media: "video, audio",
        mapItem: (icon) => {
          var _a;
          return (_a = icon.parentElement) == null ? void 0 : _a.parentElement;
        },
        needsStudy: (item) => !item.querySelector("i.select")
      },
      {
        name: "教学空间AI智慧课程",
        list: ".el-tree-node",
        current: ".el-tree-node.is-current",
        title: ".file-name",
        done: "label.success",
        media: "video, audio",
        filter: (item) => {
          var _a;
          return !((_a = item.querySelector(".el-tree-node__children")) == null ? void 0 : _a.children.length);
        },
        needsStudy: (item) => !item.querySelector("label.success")
      }
    ];
    const waitFor = (target, timeout = 1e4, interval = 300) => {
      return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const check = setInterval(() => {
          const result = typeof target === "function" ? target() : document.querySelector(target);
          if (result) {
            clearInterval(check);
            resolve(result);
            return;
          }
          if (Date.now() - startTime > timeout) {
            clearInterval(check);
            reject(new Error("等待页面内容加载超时"));
          }
        }, interval);
      });
    };
    const clickEl = async (el) => {
      var _a, _b, _c;
      if (!el) return false;
      (_a = el.scrollIntoView) == null ? void 0 : _a.call(el, { behavior: "smooth", block: "center" });
      await sleep(0.2);
      (_b = el.click) == null ? void 0 : _b.call(el);
      (_c = el.dispatchEvent) == null ? void 0 : _c.call(el, new MouseEvent("click", { bubbles: true }));
      return true;
    };
    const getProfile = () => pageProfiles.find((profile) => document.querySelector(profile.list));
    const getItems = (profile) => Array.from(document.querySelectorAll(profile.list)).map((item) => {
      var _a;
      return ((_a = profile.mapItem) == null ? void 0 : _a.call(profile, item)) || item;
    }).filter(Boolean).filter((item) => !profile.filter || profile.filter(item));
    const getCurrentItem = (profile) => {
      var _a;
      return ((_a = document.querySelector(profile.current)) == null ? void 0 : _a.closest(profile.list)) || getItems(profile).find((item) => {
        var _a2;
        return (_a2 = item.matches) == null ? void 0 : _a2.call(item, profile.current);
      }) || null;
    };
    const getTitle = (item, profile) => {
      var _a, _b, _c, _d, _e;
      return ((_b = (_a = item == null ? void 0 : item.querySelector(profile.title)) == null ? void 0 : _a.textContent) == null ? void 0 : _b.trim()) || ((_d = (_c = document.querySelector(profile.title)) == null ? void 0 : _c.textContent) == null ? void 0 : _d.trim()) || ((_e = item == null ? void 0 : item.textContent) == null ? void 0 : _e.trim()) || "未知章节";
    };
    const getReadableDocuments = () => {
      const docs = [document];
      Array.from(document.querySelectorAll("iframe")).forEach((iframe) => {
        try {
          if (iframe.contentDocument) docs.push(iframe.contentDocument);
        } catch {
        }
      });
      return docs;
    };
    const isMediaElement = (el) => ["VIDEO", "AUDIO"].includes(el == null ? void 0 : el.tagName);
    const hasPlayableSource = (media) => {
      var _a;
      return Boolean(
        (media == null ? void 0 : media.currentSrc) || (media == null ? void 0 : media.src) || ((_a = media == null ? void 0 : media.querySelector) == null ? void 0 : _a.call(media, "source")) || (media == null ? void 0 : media.readyState) > 0
      );
    };
    const findMediaElement = (selector) => {
      var _a;
      for (const doc of getReadableDocuments()) {
        const candidates = Array.from(doc.querySelectorAll(selector));
        for (const candidate of candidates) {
          const media = isMediaElement(candidate) ? candidate : (_a = candidate.querySelector) == null ? void 0 : _a.call(candidate, "video, audio");
          if (media && (hasPlayableSource(media) || isMediaElement(media))) {
            return media;
          }
        }
        const fallback = doc.querySelector("video, audio");
        if (fallback && (hasPlayableSource(fallback) || isMediaElement(fallback))) {
          return fallback;
        }
      }
      return null;
    };
    const getNextItem = (profile) => {
      const items = getItems(profile).filter((item) => profile.needsStudy(item));
      if (!items.length) return null;
      const current = getCurrentItem(profile);
      const currentIndex = items.indexOf(current);
      return currentIndex >= 0 ? items[currentIndex + 1] : items[0];
    };
    const cleanupVideo = () => {
      if (!videoEl) return;
      videoEl.onpause = null;
      videoEl.onended = null;
      videoEl = null;
    };
    const playMedia = async (profile) => {
      var _a;
      cleanupVideo();
      try {
        videoEl = await waitFor(() => {
          return findMediaElement(profile.media);
        }, 15e3);
        videoEl.volume = 0;
        videoEl.muted = true;
        log.insertLog(`正在学习：${getTitle(getCurrentItem(profile), profile)}`);
        (_a = videoEl.play) == null ? void 0 : _a.call(videoEl).catch(() => {
        });
        videoEl.onpause = () => {
          if (!videoEl || videoEl.ended || isSwitching) return;
          setTimeout(() => {
            var _a2;
            return (_a2 = videoEl == null ? void 0 : videoEl.play) == null ? void 0 : _a2.call(videoEl).catch(() => {
            });
          }, 1e3);
        };
        videoEl.onended = async () => {
          await sleep(3);
          await nextItem(profile);
        };
      } catch (error) {
        log.insertLog(`${error.message || "未找到音视频"}，尝试切换下一节..`, "warning");
        await sleep(3);
        await nextItem(profile);
      }
    };
    const nextItem = async (profile) => {
      if (isSwitching) return;
      if (!setting.config.basicConfig.autoChangeChapter.value) {
        log.insertLog(
          "自动切换章节未开启，前往<span class='module'>设置</span>模块中更改",
          "warning"
        );
        return;
      }
      isSwitching = true;
      cleanupVideo();
      const next = getNextItem(profile);
      if (!next) {
        log.insertLog("所有章节视频已完成！");
        isSwitching = false;
        return;
      }
      log.insertLog(`跳转到: ${getTitle(next, profile)}`);
      await clickEl(next);
      await sleep(5);
      isSwitching = false;
      await playMedia(profile);
    };
    const startPolling = (profile) => {
      finishTimer = setInterval(() => {
        if (isSwitching) return;
        const current = getCurrentItem(profile);
        if (current && !profile.needsStudy(current)) nextItem(profile);
      }, 2e3);
      visibilityTimer = setInterval(() => {
        if (document.visibilityState === "hidden" && !visibilityWarned) {
          visibilityWarned = true;
          log.insertLog("页面未保持前台，学习流程可能无法正常推进..", "warning");
        } else if (document.visibilityState === "visible") {
          visibilityWarned = false;
        }
      }, 1e3);
    };
    const start = async () => {
      setting.tabIndex = "1";
      if (location.href.includes("ai-course-center") || !location.href.includes("resource") && location.href.includes("tools-hike")) {
        log.insertLog("请手动进入具体学习资源页面，进入后将自动处理..", "warning");
        return;
      }
      await sleep(5);
      const profile = getProfile();
      if (!profile) {
        log.insertLog("未识别到支持的章节列表，请确认页面已加载完成..", "warning");
        return;
      }
      log.insertLog(`进入智慧树${profile.name}学习页面，脚本开始工作..`);
      startPolling(profile);
      await playMedia(profile);
    };
    start();
    return () => {
      cleanupVideo();
      if (finishTimer) clearInterval(finishTimer);
      if (visibilityTimer) clearInterval(visibilityTimer);
    };
  };
  const wisdomStudyLogic = () => {
    const log = useLogStore();
    const setting = useSettingStore();
    let videoEl = null;
    let videoCheckTimer = null;
    let quizCheckTimer = null;
    let progressBarTimer = null;
    let visibilityTimer = null;
    let finishMonitorTimer = null;
    let lastReplayAt = 0;
    let visibilityWarned = false;
    let isSwitching = false;
    let isHandlingQuiz = false;
    let isStoppedByStudyTimeWarn = false;
    let hasLoggedPlaybackRate = false;
    const RELOAD_COUNT_KEY = "abc-zhs-wisdom-study-reload-count";
    const waitFor = (target, timeout = 1e4, interval = 300) => {
      return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const check = setInterval(() => {
          const result = typeof target === "function" ? target() : document.querySelector(target);
          if (result) {
            clearInterval(check);
            resolve(result);
            return;
          }
          if (Date.now() - startTime > timeout) {
            clearInterval(check);
            reject(new Error("等待页面内容加载超时"));
          }
        }, interval);
      });
    };
    const clickEl = async (el) => {
      var _a;
      if (!el) return false;
      (_a = el.scrollIntoView) == null ? void 0 : _a.call(el, { behavior: "smooth", block: "center" });
      await sleep(0.2);
      const rect = el.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const target = document.elementFromPoint(x, y) || el;
      const eventOptions = {
        bubbles: true,
        cancelable: true,
        clientX: x,
        clientY: y,
        button: 0,
        buttons: 1
      };
      target.dispatchEvent(new MouseEvent("mousemove", eventOptions));
      target.dispatchEvent(new MouseEvent("mousedown", eventOptions));
      target.dispatchEvent(new MouseEvent("mouseup", { ...eventOptions, buttons: 0 }));
      target.dispatchEvent(new MouseEvent("click", { ...eventOptions, buttons: 0 }));
      return true;
    };
    const clickNativeFirst = async (el) => {
      var _a, _b, _c;
      if (!el) return false;
      (_a = el.scrollIntoView) == null ? void 0 : _a.call(el, { behavior: "smooth", block: "center" });
      await sleep(0.2);
      const beforeClass = el.className;
      const beforeChecked = (_b = el.querySelector("input")) == null ? void 0 : _b.checked;
      el.click();
      await sleep(0.2);
      const afterChecked = (_c = el.querySelector("input")) == null ? void 0 : _c.checked;
      if (el.className !== beforeClass || afterChecked !== beforeChecked) return true;
      return clickEl(el);
    };
    const getConfiguredRate = () => {
      const rate = Number(setting.config.basicConfig.videoPlayrate.value);
      return Math.min(rate || 1, 1.5);
    };
    const getReloadCount = () => Number(sessionStorage.getItem(RELOAD_COUNT_KEY) || 0);
    const setReloadCount = (count) => {
      sessionStorage.setItem(RELOAD_COUNT_KEY, String(count));
    };
    const fixProcessBar = () => {
      const bar = document.querySelector(".controlsBar");
      if (!bar) return;
      bar.style.display = "block";
      bar.style.zIndex = "2";
      bar.style.overflow = "";
    };
    const waitForCaptcha = async () => {
      if (!document.querySelector(".yidun_popup")) return true;
      log.insertLog("检测到验证码，请完成验证后继续..", "warning");
      try {
        await waitFor(() => !document.querySelector(".yidun_popup"), 5 * 60 * 1e3, 1e3);
        log.insertLog("验证码已完成，继续学习..");
        return true;
      } catch {
        log.insertLog("等待验证码完成超时，请手动刷新页面后继续..", "warning");
        return false;
      }
    };
    const getCourseName = () => {
      var _a, _b;
      const text = (_b = (_a = document.querySelector(".course-name")) == null ? void 0 : _a.textContent) == null ? void 0 : _b.trim();
      return (text == null ? void 0 : text.replace(/^课程名称[:：]\s*/, "")) || "未知课程";
    };
    const getChapterName = (item) => {
      var _a;
      return ((_a = item == null ? void 0 : item.textContent) == null ? void 0 : _a.trim()) || "未知章节";
    };
    const getChapterItems = () => {
      let items = Array.from(document.querySelectorAll(".chapter-content .chapter-item"));
      items = items.map((el) => {
        const children = el.querySelectorAll(".chapter-content-second");
        return children.length ? Array.from(children) : [el];
      }).flat();
      return items.filter((el) => !el.querySelector(".finish-icon"));
    };
    const getCurrentChapter = () => document.querySelector(".chapter-content-second.current, .chapter-item.current");
    const getNextChapter = () => {
      const items = getChapterItems();
      if (!items.length) return null;
      const current = getCurrentChapter();
      const currentIndex = items.indexOf(current);
      return currentIndex >= 0 ? items[currentIndex + 1] : items[0];
    };
    const closeMasteryDialog = async () => {
      const dialog = document.querySelector(".masterylevel-body");
      if (!dialog) return false;
      await clickEl(document.querySelector(".header-box .close-box"));
      try {
        await waitFor(() => !document.querySelector(".masterylevel-body"), 1e4, 200);
      } catch {
        log.insertLog("等待掌握度弹窗关闭超时，尝试继续切换..", "warning");
      }
      return true;
    };
    const hasStudyTimeWarnDialog = () => Array.from(document.querySelectorAll(".el-overlay .content")).some(
      (el) => {
        var _a;
        return (_a = el.textContent) == null ? void 0 : _a.includes("保持良好的学习习惯");
      }
    );
    const handleStudyTimeWarnDialog = () => {
      if (!hasStudyTimeWarnDialog()) return false;
      isStoppedByStudyTimeWarn = true;
      log.insertLog(
        "检测到学习习惯提示弹窗，已暂停自动切换，请手动处理后刷新页面继续..",
        "warning"
      );
      return true;
    };
    const handleQuizDialog = async () => {
      if (isHandlingQuiz) return;
      const dialog = document.querySelector(".ai-class-exercise-dialog");
      if (!dialog) return;
      isHandlingQuiz = true;
      try {
        const options = Array.from(dialog.querySelectorAll(".ques-list .item .option"));
        log.insertLog(`检测到随堂练习弹窗`);
        if (options.length) {
          const captchaPassed = await waitForCaptcha();
          if (!captchaPassed) return;
          const optionIndex = Math.floor(Math.random() * options.length);
          const option = options[optionIndex];
          await clickNativeFirst(option);
          await sleep(1);
        }
        const submitBtn = dialog.querySelector(".el-dialog__footer .el-button.btn");
        if (submitBtn) {
          await clickNativeFirst(submitBtn);
          await sleep(1);
        }
        const closeBtn = dialog.querySelector(".header-icon");
        if (closeBtn) await clickNativeFirst(closeBtn);
        log.insertLog("随堂练习弹窗已完成");
      } finally {
        await sleep(1);
        isHandlingQuiz = false;
      }
    };
    const switchPlaybackRate = async (rate) => {
      if (!videoEl) return;
      videoEl.playbackRate = rate;
      if (!hasLoggedPlaybackRate) {
        hasLoggedPlaybackRate = true;
        log.insertLog(`已设置播放倍速: ${rate}x`);
      }
    };
    const switchDefinition = async () => {
      const controlsBar = document.querySelector(".controlsBar");
      if (controlsBar) controlsBar.style.display = "block";
    };
    const cleanupVideo = () => {
      if (videoCheckTimer) {
        clearInterval(videoCheckTimer);
        videoCheckTimer = null;
      }
      if (videoEl) {
        videoEl.onpause = null;
        videoEl.onended = null;
        videoEl = null;
      }
    };
    const replayCurrentVideo = async () => {
      if (!(videoEl == null ? void 0 : videoEl.isConnected) || !videoEl.ended) return;
      const now = Date.now();
      if (now - lastReplayAt < 8e3) return;
      lastReplayAt = now;
      try {
        videoEl.currentTime = 1;
        await switchPlaybackRate(getConfiguredRate());
        await videoEl.play();
        log.insertLog("当前节点尚未出现完成标记，已重新播放当前视频..", "warning");
      } catch {
        log.insertLog("重新播放当前视频失败，等待下次检查..", "warning");
      }
    };
    const handleLoadFailure = async (error) => {
      log.insertLog(`${error.message || "视频加载失败"}，即将刷新页面重试..`, "warning");
      const reloadCount = getReloadCount();
      if (reloadCount >= 3) {
        setReloadCount(0);
        log.insertLog("视频加载多次失败，请检查网络或手动刷新页面..", "warning");
        return;
      }
      setReloadCount(reloadCount + 1);
      setTimeout(() => {
        location.reload();
      }, 3e3);
    };
    const playVideo = async () => {
      if (isStoppedByStudyTimeWarn) return;
      const captchaPassed = await waitForCaptcha();
      if (!captchaPassed) return;
      cleanupVideo();
      try {
        fixProcessBar();
        await switchDefinition();
        await sleep(1);
        videoEl = await waitFor(() => {
          const media = document.querySelector("video, audio");
          return (media == null ? void 0 : media.src) ? media : null;
        }, 15e3, 300);
        setReloadCount(0);
        lastReplayAt = 0;
        videoEl.currentTime = Math.max(videoEl.currentTime, 1);
        videoEl.volume = 0;
        videoEl.muted = true;
        await switchPlaybackRate(getConfiguredRate());
        const current = getCurrentChapter();
        log.insertLog(`正在学习：${getChapterName(current)}`);
        videoEl.play().catch(() => {
        });
        videoCheckTimer = setInterval(() => {
          if (!(videoEl == null ? void 0 : videoEl.isConnected)) {
            cleanupVideo();
            setTimeout(playVideo, 1500);
          }
        }, 3e3);
        videoEl.onpause = () => {
          if (!videoEl || videoEl.ended || isSwitching) return;
          setTimeout(() => {
            var _a;
            return (_a = videoEl == null ? void 0 : videoEl.play) == null ? void 0 : _a.call(videoEl).catch(() => {
            });
          }, 1e3);
        };
        videoEl.onended = async () => {
          if (isSwitching) return;
          log.insertLog("当前视频播放完毕，等待平台标记完成..");
        };
      } catch (error) {
        await handleLoadFailure(error);
      }
    };
    const nextChapter = async () => {
      if (isSwitching || isStoppedByStudyTimeWarn) return;
      if (!setting.config.basicConfig.autoChangeChapter.value) {
        log.insertLog(
          "自动切换章节未开启，前往<span class='module'>设置</span>模块中更改",
          "warning"
        );
        return;
      }
      isSwitching = true;
      cleanupVideo();
      const hidden = document.querySelector(".chapter-wrapper.hidden");
      if (hidden) await clickEl(document.querySelector(".collapse-box") || hidden);
      document.querySelectorAll(".el-collapse-item__wrap").forEach((el) => {
        el.style.display = "";
      });
      await sleep(0.2);
      if (handleStudyTimeWarnDialog()) {
        isSwitching = false;
        return;
      }
      await closeMasteryDialog();
      const next = getNextChapter();
      if (!next) {
        log.insertLog("所有章节视频已完成！");
        isSwitching = false;
        return;
      }
      await clickEl(next);
      next.scrollIntoView({ behavior: "smooth", block: "center" });
      await sleep(5);
      isSwitching = false;
      playVideo();
    };
    const startPolling = () => {
      quizCheckTimer = setInterval(async () => {
        await closeMasteryDialog();
        await handleQuizDialog();
      }, 3e3);
      progressBarTimer = setInterval(fixProcessBar, 1e3);
      finishMonitorTimer = setInterval(() => {
        if (isSwitching || isStoppedByStudyTimeWarn) return;
        const current = getCurrentChapter();
        if (!(current == null ? void 0 : current.querySelector(".finish-icon"))) {
          replayCurrentVideo();
          return;
        }
        nextChapter();
      }, 2e3);
      visibilityTimer = setInterval(() => {
        if (document.visibilityState === "hidden" && !visibilityWarned) {
          visibilityWarned = true;
          log.insertLog("页面未保持前台，学习流程可能无法正常推进..", "warning");
        } else if (document.visibilityState === "visible") {
          visibilityWarned = false;
        }
      }, 1e3);
    };
    const start = async () => {
      log.insertLog(`进入智慧树新智慧学习页面（${getCourseName()}），脚本开始工作..`);
      setting.tabIndex = "1";
      await sleep(5);
      try {
        await waitFor(".video-play", 2e4);
      } catch {
        log.insertLog("等待视频区域加载超时，尝试继续处理..", "warning");
      }
      document.querySelectorAll(".el-overlay,.el-dialog").forEach((dialog) => {
        dialog.style.display = "none";
      });
      startPolling();
      playVideo();
    };
    start();
    return () => {
      cleanupVideo();
      if (quizCheckTimer) clearInterval(quizCheckTimer);
      if (progressBarTimer) clearInterval(progressBarTimer);
      if (finishMonitorTimer) clearInterval(finishMonitorTimer);
      if (visibilityTimer) clearInterval(visibilityTimer);
    };
  };
  const zhsRoutes = {
    match: [
      { keyword: "/studyvideoh5.zhihuishu.com", tab: "1", logic: videoStudyLogic },
      { keyword: "ai-smart-course-student-pro.zhihuishu.com/learnPage", tab: "1", logic: smartStudyLogic },
      { keyword: "ai-smart-course-student-pro.zhihuishu.com/singleCourse", tab: "1", logic: smartStudyLogic },
      { keyword: "smartcoursestudent.zhihuishu.com/learnPage", tab: "1", logic: smartStudyLogic },
      { keyword: "smartcoursestudent.zhihuishu.com/singleCourse", tab: "1", logic: smartStudyLogic },
      { keyword: "studyplush5.zhihuishu.com", tab: "1", logic: studyPlusLogic },
      { keyword: "studywisdomh5.zhihuishu.com/study/index", tab: "1", logic: studyPlusLogic },
      { keyword: "smartcourseexam.zhihuishu.com/ReviewExam", tab: "1", logic: smartAnswerLogic },
      { keyword: "studentexamcomh5.zhihuishu.com/studentReviewTestOrExam", tab: "1", logic: smartAnswerLogic },
      { keyword: "fusioncourseh5.zhihuishu.com/exam", tab: "1", logic: smartAnswerLogic },
      { keyword: "studywisdomh5.zhihuishu.com/exam", tab: "1", logic: smartAnswerLogic },
      { keyword: "wisdom-mooc.zhihuishu.com/exam", tab: "1", logic: smartAnswerLogic },
      { keyword: "examloop.zhihuishu.com/exam", tab: "1", logic: smartAnswerLogic },
      { keyword: "zhihuishu.com/atHomeworkExam/stu/homeworkQ/exerciseList", tab: "1", logic: smartAnswerLogic },
      { keyword: "zhihuishu.com/atHomeworkExam/stu/examQ/examexercise", tab: "1", logic: smartAnswerLogic },
      { keyword: "zhihuishu.com/aidedteaching/sourceLearning", tab: "1", logic: specialStudyLogic },
      { keyword: "hike-teaching-center.polymas.com/stu-hike/agent-course-hike/ai-course-center", tab: "1", logic: specialStudyLogic },
      { keyword: "tools-hike/studentStudyResource", tab: "1", logic: specialStudyLogic },
      { keyword: "fusioncourseh5.zhihuishu.com", tab: "1", logic: aiSmartLogic },
      { keyword: "zhihuishu.com/learnPage", tab: "1", logic: learnPageLogic },
      { keyword: "wisdom-mooc.zhihuishu.com/study/index", tab: "1", logic: wisdomStudyLogic },
      { keyword: "/webExamList?", tab: "0" },
      { keyword: "/stuExamWeb.html", tab: "1", logic: autoAnswerLogic }
    ],
    defaultRoute: {
      show: true,
      tab: "0"
    }
  };
  const _hoisted_1$1 = { class: "box-content" };
  const _sfc_main$2 = {
    __name: "index",
    emits: ["customEvent"],
    setup(__props, { emit: __emit }) {
      const isShow = vue.ref(false);
      const log = useLogStore();
      const setting = useSettingStore();
      const emit = __emit;
      const url2 = window.location.href;
      const hostname = window.location.hostname;
      const messageStore = useMessageStore();
      const platformConfigs = [
        {
          key: "cx",
          name: "超星学习通",
          domains: [
            "chaoxing.com",
            "edu.cn",
            "org.cn",
            "xueyinonline.com",
            "hnsyu.net",
            "qutjxjy.cn",
            "ynny.cn",
            "hnvist.cn",
            "fjlecb.cn",
            "gdhkmooc.com",
            "cugbonline.cn",
            "zjelib.cn",
            "cqrspx.cn",
            "neauce.com",
            "zhihui-yun.com",
            "cqie.cn",
            "ccqmxx.com",
            "jxgmxy.com",
            "sslibrary.com"
          ],
          routes: cxRoutes,
          showAi: true
        },
        {
          key: "zhs",
          name: "智慧树",
          domains: ["zhihuishu.com", "polymas.com"],
          routes: zhsRoutes,
          showAi: false
        }
      ];
      const currentPlatform = platformConfigs.find(
        (item) => item.domains.some((domain) => hostname === domain || hostname.endsWith("." + domain))
      ) ?? null;
      const settingTabKey = "4";
      const contentMap = [
        {
          key: "0",
          tab: "◉ 首页",
          component: ScriptHome
        },
        {
          key: "1",
          tab: "▤ 日志",
          component: _sfc_main$9
        },
        {
          key: "record",
          tab: "▣ 记录",
          component: _sfc_main$3
        },
        {
          key: "2",
          tab: "◈ 答题",
          component: _sfc_main$7
        },
        {
          key: "3",
          tab: "◎ 搜题",
          component: _sfc_main$5
        },
        {
          key: settingTabKey,
          tab: "◆ 设置",
          component: _sfc_main$6
        }
      ];
      const availableKeys = contentMap.map((item) => item.key);
      const normalizeTabKey = (tabKey) => availableKeys.includes(tabKey) ? tabKey : "0";
      const activeKey = vue.ref(normalizeTabKey(setting.tabIndex));
      const visibleContentMap = vue.computed(() => contentMap.filter((item) => !item.hidden));
      const currentContent = vue.computed(() => contentMap.find((item) => item.key === activeKey.value));
      const refreshTimer = vue.ref(null);
      const examIframeTimer = vue.ref(null);
      const examIframeKeywords = [
        "/examcode/examnotes",
        "/exam/test/examcode",
        "/exam/test/reVersionTestStartNew",
        "exam-ans/exam/test/reVersionTestStartNew",
        "mooc-ans/exam/test/reVersionTestStartNew",
        "/mooc2/exam/preview",
        "exam/preview"
      ];
      const normalizeIframeUrl = (iframeSrc) => {
        if (!iframeSrc) return "";
        try {
          return new URL(iframeSrc, window.location.href).href;
        } catch (error) {
          return iframeSrc;
        }
      };
      const tryOpenExamIframe = () => {
        if (!url2.includes("/base")) return false;
        const examIframeUrl = Array.from(document.querySelectorAll("iframe")).map((iframe) => normalizeIframeUrl(iframe.getAttribute("src") || iframe.src)).find(
          (iframeUrl) => examIframeKeywords.some((keyword) => iframeUrl.includes(keyword))
        );
        if (!examIframeUrl) return false;
        const storageKey = `abc-opened-exam-iframe:${examIframeUrl}`;
        if (sessionStorage.getItem(storageKey)) return true;
        sessionStorage.setItem(storageKey, "1");
        window.open(examIframeUrl, "_blank");
        log.insertLog("检测到考试页面已嵌入 iframe，已尝试在新窗口打开..");
        return true;
      };
      const startExamIframeWatcher = () => {
        if (!url2.includes("/base") || examIframeTimer.value) return;
        tryOpenExamIframe();
        examIframeTimer.value = setInterval(() => {
          tryOpenExamIframe();
        }, 1e3);
      };
      const chooseLogicByUrl = () => {
        var _a;
        const platformRoutes = currentPlatform == null ? void 0 : currentPlatform.routes;
        if (!platformRoutes) {
          isShow.value = false;
          return;
        }
        const route = platformRoutes.match.find((item) => url2.includes(item.keyword));
        const shouldShow = route || ((_a = platformRoutes.defaultRoute) == null ? void 0 : _a.show);
        if (!shouldShow) {
          isShow.value = false;
          return;
        }
        fetchBasicInfo().then((res) => {
          console.log("fetchBasicInfo", res);
          if (res.code) {
            const { shopLink, version } = res.data;
            setting.shopLink = shopLink;
            setting.latestVersion = version;
          }
        });
        updateTokenInfo();
        startExamIframeWatcher();
        if (route) {
          if (!setting.config.basicConfig.token.value) {
            messageStore.insertMessage(
              "检测到未配置密钥，无法使用自动答题功能，请前往 “设置” 模块配置",
              "warning"
            );
          }
          setting.tabIndex = route.tab;
          if (route.log) log.insertLog(route.log);
          if (route.logic) route.logic();
          if (setting.config.searchConfig.searchBySelectedText.value) {
            log.insertLog("划词搜题已开启..");
          }
          autoRefreshPage();
          selectTextSearchLogic(document, window);
        } else {
          setting.tabIndex = platformRoutes.defaultRoute.tab;
        }
        isShow.value = true;
      };
      const updateTokenInfo = () => {
        if (setting.config.basicConfig.token.value) {
          getTokenInfo().then((res) => {
            if (res.code && res.code === 1) {
              const { count, usedCount, remainCount } = res.data;
              console.log("getTokenInfo", res.data);
              setting.userInfo.remainCount = remainCount !== void 0 ? formatLocalRemainCount(remainCount) : formatLocalRemainCount(count - usedCount);
            } else {
              setting.userInfo.remainCount = "密钥无效";
              messageStore.insertMessage(
                (res && res.msg) || "密钥无效或已过期，请到用户中心重新生成脚本密钥",
                "warning"
              );
            }
          });
        } else {
          setting.userInfo.remainCount = "密钥未配置";
        }
      };
      const changeTabIndex = (newActiveKey) => {
        const nextTabKey = normalizeTabKey(newActiveKey);
        activeKey.value = nextTabKey;
        setting.tabIndex = nextTabKey;
      };
      vue.watch(
        () => setting.tabIndex,
        (newVal) => {
          const nextTabKey = normalizeTabKey(newVal);
          activeKey.value = nextTabKey;
          if (nextTabKey === settingTabKey) {
            updateTokenInfo();
          }
        }
      );
      const getPageContexts = () => {
        const contexts = [{ document, window }];
        const collectIframeContexts = (rootDocument) => {
          const iframes = Array.from(rootDocument.querySelectorAll("iframe"));
          for (const iframe of iframes) {
            try {
              if (iframe.contentDocument && iframe.contentWindow) {
                contexts.push({
                  document: iframe.contentDocument,
                  window: iframe.contentWindow
                });
                collectIframeContexts(iframe.contentDocument);
              }
            } catch (error) {
              console.warn("读取页面框架失败", error);
            }
          }
        };
        collectIframeContexts(document);
        return contexts;
      };
      const tryChangeNewVersion = () => {
        var _a;
        for (const pageContext of getPageContexts()) {
          const changeBtn = pageContext.document.querySelector("a.experience");
          if (!changeBtn) continue;
          const onclickText = changeBtn.getAttribute("onclick") || "";
          const isNewVersionBtn = ((_a = changeBtn.textContent) == null ? void 0 : _a.trim().includes("体验新版")) || onclickText.includes("toNewFyCourseList");
          if (!isNewVersionBtn) continue;
          const pageWindow = pageContext.window;
          if (typeof pageWindow.toNewFyCourseList === "function") {
            pageWindow.toNewFyCourseList();
          } else if (typeof changeBtn.onclick === "function") {
            changeBtn.onclick.call(changeBtn);
          } else {
            changeBtn.click();
          }
          return true;
        }
        return false;
      };
      const changeNewVersion = async () => {
        for (let i = 0; i < 10; i++) {
          if (tryChangeNewVersion()) return;
          await sleep(0.5);
        }
      };
      const autoRefreshPage = () => {
        const timerStatus = setting.config.basicConfig.autoRefresh.value;
        if (timerStatus) {
          refreshTimer.value = setInterval(() => {
            window.location.reload();
          }, 18e5);
        } else {
          clearInterval(refreshTimer.value);
        }
      };
      changeNewVersion();
      chooseLogicByUrl();
      emit("customEvent", isShow.value);
      return (_ctx, _cache) => {
        const _component_a_tab_pane = vue.resolveComponent("a-tab-pane");
        const _component_a_tabs = vue.resolveComponent("a-tabs");
        return vue.openBlock(), vue.createElementBlock("div", _hoisted_1$1, [
          vue.createVNode(_component_a_tabs, {
            activeKey: activeKey.value,
            "onUpdate:activeKey": _cache[0] || (_cache[0] = ($event) => activeKey.value = $event),
            onChange: changeTabIndex
          }, {
            default: vue.withCtx(() => [
              (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList(visibleContentMap.value, (item) => {
                return vue.openBlock(), vue.createBlock(_component_a_tab_pane, {
                  tab: item.tab,
                  key: item.key
                }, null, 8, ["tab"]);
              }), 128))
            ]),
            _: 1
          }, 8, ["activeKey"]),
          currentContent.value ? (vue.openBlock(), vue.createBlock(vue.resolveDynamicComponent(currentContent.value.component), {
            key: 0,
            class: "tab-content",
            onAutoRefreshPage: autoRefreshPage,
            onChangeTab: changeTabIndex
          }, null, 32)) : vue.createCommentVNode("", true)
        ]);
      };
    }
  };
  const _hoisted_1 = {
    key: 0,
    class: "message-container"
  };
  const _hoisted_2 = { class: "script-info" };
  const _sfc_main$1 = {
    __name: "index",
    setup(__props) {
      const scriptInfo = getScriptInfo();
      const isMini = vue.ref(false);
      const mainWrapRef = vue.ref(null);
      const headerLeftRef = vue.ref(null);
      const boxSize = vue.ref({ width: 400, height: 700 });
      const setting = useSettingStore();
      const isShow = vue.ref(true);
      const messageStore = useMessageStore();
      const messageList = vue.ref(messageStore.messageList);
      const backendTabKeys = ["1", "record"];
      const isBackendActive = vue.computed(() => backendTabKeys.includes(setting.tabIndex));
      const themeMode = vue.ref(GM_getValue("themeMode") || "dark");
      const toggleTheme = () => {
        themeMode.value = themeMode.value === "dark" ? "light" : "dark";
        GM_setValue("themeMode", themeMode.value);
      };
      const themeClass = vue.computed(() => themeMode.value === "dark" ? "theme-dark" : "theme-light");
      const isPinned = vue.ref(GM_getValue("isPinned") || false);
      const togglePin = () => {
        isPinned.value = !isPinned.value;
        GM_setValue("isPinned", isPinned.value);
      };
      const getPopupContainer = () => {
        return headerLeftRef.value || mainWrapRef.value || document.body;
      };
      const handleBackendMenuClick = ({ key }) => {
        if (key === "log") {
          setting.tabIndex = "1";
          return;
        }
        if (key === "record") {
          setting.tabIndex = "record";
        }
      };
      vue.watch(
        setting,
        (newVal) => {
          GM_setValue("setting", JSON.stringify(newVal));
          const token = setting.config && setting.config.basicConfig && setting.config.basicConfig.token && setting.config.basicConfig.token.value;
          scheduleSaveAbcCloudConfig(setting, token);
        },
        { deep: true }
      );
      const position = vue.ref({
        right: setting.position.right || "0px",
        top: setting.position.top || "0px"
      });
      const isDragging = vue.ref(false);
      const dragOffset = vue.ref({ x: 0, y: 0 });
      const persistPosition = () => {
        setting.position.right = position.value.right;
        setting.position.top = position.value.top;
      };
      const syncPositionWithRect = () => {
        if (!mainWrapRef.value) return;
        const rect = mainWrapRef.value.getBoundingClientRect();
        position.value = {
          right: Math.max(0, window.innerWidth - rect.right) + "px",
          top: Math.max(0, rect.top) + "px"
        };
      };
      const changeBoxSize = () => {
        isMini.value = !isMini.value;
      };
      const miniBallStatus = vue.ref({ text: "待命中", icon: "💤" });
      const miniBallLogSummary = vue.ref("暂无日志");
      const updateMiniBallInfo = () => {
        let lastLogText = "";
        try {
          const logStore2 = useLogStore();
          const logs = logStore2.logList;
          if (logs.length > 0) {
            const last = logs[logs.length - 1];
            lastLogText = String(last.text || "");
            miniBallLogSummary.value = lastLogText.length > 18 ? lastLogText.slice(0, 18) + "..." : lastLogText;
          } else {
            miniBallLogSummary.value = "暂无日志";
          }
        } catch (e) {
          miniBallLogSummary.value = "暂无日志";
        }
        try {
          if (/视频|播放|倍速|video/.test(lastLogText)) {
            miniBallStatus.value = { text: "视频播放中", icon: "🎬" };
          } else if (/答题|测验|作业|考试|交卷|提交答案|quiz|homework|exam/.test(lastLogText)) {
            miniBallStatus.value = { text: "答题中", icon: "✏️" };
          } else if (/直播|live|zhibo/.test(lastLogText)) {
            miniBallStatus.value = { text: "直播中", icon: "📡" };
          } else if (/阅读|PPT|电子书|document|ebook/.test(lastLogText)) {
            miniBallStatus.value = { text: "阅读中", icon: "📖" };
          } else {
            const url = location.href;
            if (/zhibo\.chaoxing\.com/.test(url)) {
              miniBallStatus.value = { text: "直播中", icon: "📡" };
            } else if (/chaoxing\.com/.test(url)) {
              miniBallStatus.value = { text: "学习中", icon: "📚" };
            } else {
              miniBallStatus.value = { text: "待命中", icon: "💤" };
            }
          }
        } catch (e) {
          miniBallStatus.value = { text: "待命中", icon: "💤" };
        }
      };
      let miniBallTimer = null;
      vue.onMounted(() => {
        updateMiniBallInfo();
        miniBallTimer = setInterval(updateMiniBallInfo, 1500);
      });
      vue.onUnmounted(() => {
        if (miniBallTimer) clearInterval(miniBallTimer);
      });
      const miniBallRemainCount = vue.computed(() => {
        try {
          const rc = setting.userInfo.remainCount;
          if (rc === "无限" || rc === Infinity) return "∞";
          const n = Number(rc);
          if (isNaN(n) || n <= 0) return String(rc || "");
          return n > 9999 ? "∞" : String(n);
        } catch (e) {
          return "";
        }
      });
      const startDrag = (event) => {
        if (isPinned.value) return;
        event.preventDefault();
        if (!mainWrapRef.value) return;
        const rect = mainWrapRef.value.getBoundingClientRect();
        boxSize.value = { width: rect.width, height: rect.height };
        isDragging.value = true;
        dragOffset.value = {
          x: rect.right - event.clientX,
          y: event.clientY - rect.top
        };
        document.addEventListener("mousemove", drag);
        document.addEventListener("mouseup", endDrag);
      };
      const drag = (e) => {
        if (!isDragging.value) return;
        let newRight = window.innerWidth - e.clientX - dragOffset.value.x;
        let newY = e.clientY - dragOffset.value.y;
        if (newRight < 0) {
          newRight = 0;
        }
        if (newRight + boxSize.value.width > window.innerWidth) {
          newRight = window.innerWidth - boxSize.value.width;
        }
        if (newY < 0) {
          newY = 0;
        }
        if (newY + boxSize.value.height > window.innerHeight) {
          newY = window.innerHeight - boxSize.value.height;
        }
        position.value = {
          right: newRight + "px",
          top: newY + "px"
        };
      };
      const endDrag = () => {
        isDragging.value = false;
        persistPosition();
        document.removeEventListener("mousemove", drag);
        document.removeEventListener("mouseup", endDrag);
      };
      const updateBoxSize = () => {
        if (mainWrapRef.value) {
          const rect = mainWrapRef.value.getBoundingClientRect();
          boxSize.value = {
            width: rect.width,
            height: rect.height
          };
        }
      };
      const checkAndFixPosition = () => {
        if (!mainWrapRef.value) return;
        const rect = mainWrapRef.value.getBoundingClientRect();
        const currentRight = parseInt(position.value.right) || 0;
        const currentTop = parseInt(position.value.top) || 0;
        let needFix = false;
        let newRight = currentRight;
        let newTop = currentTop;
        if (currentRight + rect.width > window.innerWidth) {
          newRight = Math.max(0, window.innerWidth - rect.width);
          needFix = true;
        }
        if (currentRight < 0) {
          newRight = 0;
          needFix = true;
        }
        if (currentTop < 0) {
          newTop = 0;
          needFix = true;
        }
        if (currentTop + rect.height > window.innerHeight) {
          newTop = Math.max(0, window.innerHeight - rect.height);
          needFix = true;
        }
        if (needFix) {
          position.value = {
            right: newRight + "px",
            top: newTop + "px"
          };
          persistPosition();
          console.log("位置已修正，防止超出屏幕边界");
        }
      };
      vue.onMounted(async () => {
        await vue.nextTick();
        const token = setting.config && setting.config.basicConfig && setting.config.basicConfig.token && setting.config.basicConfig.token.value;
        if (token) {
          abcCloudApplying = true;
          await fetchAndApplyAbcCloudConfig(setting, token);
          abcCloudApplying = false;
        }
        updateBoxSize();
        syncPositionWithRect();
        persistPosition();
        checkAndFixPosition();
        if (window.ResizeObserver) {
          const resizeObserver = new ResizeObserver(() => {
            updateBoxSize();
            checkAndFixPosition();
          });
          if (mainWrapRef.value) {
            resizeObserver.observe(mainWrapRef.value);
          }
        }
      });
      return (_ctx, _cache) => {
        const _component_a_alert = vue.resolveComponent("a-alert");
        const _component_a_menu_item = vue.resolveComponent("a-menu-item");
        const _component_a_menu = vue.resolveComponent("a-menu");
        const _component_a_dropdown = vue.resolveComponent("a-dropdown");
        return isShow.value ? (vue.openBlock(), vue.createElementBlock("div", {
          key: 0,
          class: "main-wrap",
          style: vue.normalizeStyle(position.value),
          ref_key: "mainWrapRef",
          ref: mainWrapRef
        }, [
          isMini.value ? (vue.openBlock(), vue.createElementBlock("div", {
            key: 0,
            class: "mini-ball",
            onClick: vue.withModifiers(changeBoxSize, ["stop"]),
            onMousedown: _cache[2] || (_cache[2] = vue.withModifiers(startDrag, ["stop"]))
          }, [
            vue.createElementVNode("div", { class: "mini-ball-icon" }, [
              miniBallRemainCount.value ? (vue.openBlock(), vue.createElementBlock("span", {
                key: 0,
                class: "mini-ball-count"
              }, vue.toDisplayString(miniBallRemainCount.value), 1)) : vue.createCommentVNode("", true),
              vue.createTextVNode(" 学神")
            ]),
            vue.createElementVNode("div", { class: "mini-ball-body" }, [
              vue.createElementVNode("span", { class: "mini-ball-text" }, vue.toDisplayString(miniBallStatus.value.icon + " " + miniBallStatus.value.text), 1),
              vue.createElementVNode("span", { class: "mini-ball-sub" }, vue.toDisplayString(miniBallLogSummary.value), 1)
            ]),
            vue.createElementVNode("div", { class: "mini-ball-shine" }),
            vue.createElementVNode("div", { class: "mini-ball-glow" }),
            vue.createElementVNode("div", { class: "mini-ball-orbits" }, [
              vue.createElementVNode("i", null, " "),
              vue.createElementVNode("i", null, " ")
            ])
          ], 32)) : (vue.openBlock(), vue.createElementBlock("div", {
            key: 1,
            class: vue.normalizeClass(["main-box", themeClass.value])
          }, [
            vue.createElementVNode("div", {
              class: "box-header",
              onMousedown: startDrag
            }, [
              vue.createElementVNode("div", {
                class: "header-left",
                ref_key: "headerLeftRef",
                ref: headerLeftRef
              }, [
                vue.createElementVNode("span", _hoisted_2, "学神助手 " + vue.toDisplayString(vue.unref(scriptInfo).version), 1),
                !isMini.value ? (vue.openBlock(), vue.createBlock(_component_a_dropdown, {
                  key: 0,
                  placement: "bottomLeft",
                  trigger: ["hover"],
                  overlayClassName: "backend-dropdown-overlay",
                  getPopupContainer
                }, {
                  overlay: vue.withCtx(() => [
                    vue.createVNode(_component_a_menu, { onClick: handleBackendMenuClick }, {
                      default: vue.withCtx(() => [
                        vue.createVNode(_component_a_menu_item, { key: "log" }, {
                          default: vue.withCtx(() => _cache[4] || (_cache[4] = [
                            vue.createTextVNode("≡ 日志")
                          ])),
                          _: 1
                        }),
                        vue.createVNode(_component_a_menu_item, { key: "record" }, {
                          default: vue.withCtx(() => _cache[5] || (_cache[5] = [
                            vue.createTextVNode("▤ 记录")
                          ])),
                          _: 1
                        })
                      ]),
                      _: 1
                    })
                  ]),
                  default: vue.withCtx(() => [
                    vue.createElementVNode("span", {
                      class: vue.normalizeClass(["backend-entry", { active: isBackendActive.value }]),
                      onClick: _cache[0] || (_cache[0] = vue.withModifiers(() => {
                      }, ["stop"])),
                      onMousedown: _cache[1] || (_cache[1] = vue.withModifiers(() => {
                      }, ["stop"]))
                    }, " ▤ ", 34)
                  ]),
                  _: 1
                })) : vue.createCommentVNode("", true)
              ], 512),
              vue.createElementVNode("div", { style: { "display": "flex", "gap": "4px", "align-items": "center" } }, [
                vue.createElementVNode("div", {
                  class: vue.normalizeClass(["pin-btn", { pinned: isPinned.value }]),
                  onClick: vue.withModifiers(togglePin, ["stop"]),
                  onMousedown: _cache[6] || (_cache[6] = vue.withModifiers(() => {
                  }, ["stop"])),
                  title: isPinned.value ? "解除固定" : "固定位置"
                }, vue.toDisplayString(isPinned.value ? "📌" : "📍"), 9, ["title"]),
                vue.createElementVNode("div", {
                  class: "theme-toggle",
                  onClick: vue.withModifiers(toggleTheme, ["stop"]),
                  onMousedown: _cache[6] || (_cache[6] = vue.withModifiers(() => {
                  }, ["stop"])),
                  title: themeMode.value === "dark" ? "切换亮色" : "切换暗色"
                }, vue.toDisplayString(themeMode.value === "dark" ? "☀" : "☾"), 9, ["title"]),
                vue.createElementVNode("div", {
                  class: "shrink-btn",
                  onClick: vue.withModifiers(changeBoxSize, ["stop"]),
                  onMousedown: _cache[7] || (_cache[7] = vue.withModifiers(() => {
                  }, ["stop"])),
                  title: "收起"
                }, "—")
              ]),
            ], 32),
            vue.createVNode(_sfc_main$2, {
              class: vue.normalizeClass(`box-content ${isMini.value ? "mini" : ""}`),
              onCustomEvent: _cache[8] || (_cache[8] = (newValue) => isShow.value = newValue)
            }, null, 8, ["class"])
          ], 2))
        ], 4)) : vue.createCommentVNode("", true);
      };
    }
  };
  const _sfc_main = /* @__PURE__ */ vue.defineComponent({
    __name: "App",
    setup(__props) {
      const shadowRoot = vue.inject("shadowRoot");
      const getPopupContainer = () => {
        var _a;
        return ((_a = shadowRoot == null ? void 0 : shadowRoot.querySelector) == null ? void 0 : _a.call(shadowRoot, "#abc-helper-app")) ?? document.body;
      };
      return (_ctx, _cache) => {
        const _component_a_style_provider = vue.resolveComponent("a-style-provider");
        const _component_a_config_provider = vue.resolveComponent("a-config-provider");
        return vue.openBlock(), vue.createBlock(_component_a_config_provider, { getPopupContainer }, {
          default: vue.withCtx(() => [
            vue.createVNode(_component_a_style_provider, { container: vue.unref(shadowRoot) }, {
              default: vue.withCtx(() => [
                vue.createVNode(_sfc_main$1)
              ]),
              _: 1
            }, 8, ["container"])
          ]),
          _: 1
        });
      };
    }
  });
  const hookError = () => {
    console.log("hookError");
    const oldset = _unsafeWindow.setInterval;
    const oldout = _unsafeWindow.setTimeout;
    _unsafeWindow.setInterval = function(...args) {
      const err = new Error("");
      if (err.stack && err.stack.indexOf("checkoutNotTrustScript") !== -1) {
        return -1;
      }
      return oldset.call(this, ...args);
    };
    _unsafeWindow.setTimeout = function(...args) {
      const err = new Error("");
      if (err.stack && err.stack.indexOf("checkoutNotTrustScript") !== -1) {
        return -1;
      }
      return oldout.call(this, ...args);
    };
  };
  const url = _unsafeWindow.location.href;
  const isTopWindow = _unsafeWindow.self === _unsafeWindow.top;
  if (_unsafeWindow.__abcHelperLoaded) ;
  else {
    let injectCSSIntoShadow = function(shadow) {
      const pendingCSS = document.__abcHelperCSS;
      if (pendingCSS) {
        const style = document.createElement("style");
        style.textContent = pendingCSS;
        shadow.appendChild(style);
        delete document.__abcHelperCSS;
      }
    }, observeHeadStyles = function(shadow) {
      const clonedMap = /* @__PURE__ */ new WeakMap();
      const cloneStyle = (node) => {
        if (!(node instanceof HTMLStyleElement)) return;
        if (node.dataset.abcIgnore) return;
        if (clonedMap.has(node)) return;
        const clone = node.cloneNode(true);
        clone.dataset.abcIgnore = "true";
        shadow.appendChild(clone);
        clonedMap.set(node, clone);
        new MutationObserver(() => {
          clone.textContent = node.textContent;
        }).observe(node, { childList: true, characterData: true, subtree: true });
      };
      new MutationObserver((mutations) => {
        for (const m of mutations) {
          for (const node of m.addedNodes) cloneStyle(node);
        }
      }).observe(document.head, { childList: true });
    };
    _unsafeWindow.__abcHelperLoaded = true;
    if (url.includes("zhihuishu.com") && isTopWindow) {
      hookError();
      installAnswerSheetHook();
    }
    const timer = setInterval(() => {
      if (document.readyState === "complete") {
        clearInterval(timer);
        if (!isTopWindow) return;
        if (document.getElementById("abc-helper-root")) return;
        const container = document.createElement("div");
        container.id = "abc-helper-root";
        container.style.cssText = "all:initial!important;position:static!important;display:block!important;width:0!important;height:0!important;overflow:visible!important;opacity:1!important;visibility:visible!important;transform:none!important;filter:none!important;pointer-events:none!important";
        document.body.appendChild(container);
        const shadow = container.attachShadow({ mode: "open" });
        const resetStyle = document.createElement("style");
        resetStyle.textContent = [
          ":host{all:initial!important;display:block!important}",
          ".no-select{-webkit-user-select:none!important;-moz-user-select:none!important;user-select:none!important}",
          "input{outline:none;border:none}",
          "div{box-sizing:border-box}",
          "ul,ol{padding-inline-start:20px}",
          ".pin-btn{width:28px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:4px;cursor:pointer;font-size:14px;opacity:0.5;transition:all 0.2s;user-select:none}",
          ".pin-btn:hover{opacity:0.8}",
          ".pin-btn.pinned{opacity:1;color:var(--t-primary,#1677ff)}"
        ].join("\n");
        shadow.appendChild(resetStyle);
        injectCSSIntoShadow(shadow);
        observeHeadStyles(shadow);
        const appDiv = document.createElement("div");
        appDiv.id = "abc-helper-app";
        shadow.appendChild(appDiv);
        const app = vue.createApp(_sfc_main);
        const pinia$1 = pinia.createPinia();
        app.provide("shadowRoot", shadow);
        app.use(pinia$1);
        app.use(Antd);
        app.mount(appDiv);
      }
    }, 100);
  }

})(Vue, antd, Pinia, marked, rxjs, md5, DOMPurify);
