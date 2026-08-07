// ==UserScript==
// @name         景德镇艺术-学习助手
// @namespace    https://github.com/jdzvuacj
// @version      4.1.0
// @description  景德镇艺术职业学院 学习平台助手：自动播放、自定义倍速、自动下一节、考试/作业自动答题、AI云端答题、学习记录、日志面板、账号登录
// @author       IPYIWEI
// @match        *://*.o-learn.cn/*
// @connect      xs.openget.cn
// @connect      *.o-learn.cn
// @connect      stream-*.webtrn.cn
// @connect      *.webtrn.cn
// @connect      *
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @run-at       document-start
// @license      MIT
// @updateURL    https://raw.githubusercontent.com/byyiwei/xueshen-helper/main/scripts/jdz-art-study-helper.user.js
// @downloadURL  https://raw.githubusercontent.com/byyiwei/xueshen-helper/main/scripts/jdz-art-study-helper.user.js
// ==/UserScript==

(function () {
    'use strict';

    /* ======================== 配置 ======================== */
    const CONFIG = {
        defaultSpeed: 2,          // 默认倍速
        autoPlay: true,           // 默认开启自动播放
        autoMute: true,           // 默认静音播放（浏览器策略要求，播放后自动取消）
        autoNext: true,           // 视频结束自动进入下一节
        retryInterval: 3000,      // 定期扫描兜底间隔(ms)
        speedLockInterval: 1000,  // 倍速锁定间隔(ms)
        playRetryMax: 10,         // 自动播放最大重试次数
        playRetryDelay: 1000,     // 自动播放重试间隔(ms)
        quizInterval: 2000,       // 答题轮询间隔(ms)
        logMax: 200,              // 日志面板最大条数
        backendBase: 'https://xs.openget.cn',
    };

    /* ======================== 持久化存储 ======================== */
    const STORE_KEY = 'jdz-art-settings-v4';
    let store = {
        account: { username: '', token: '', scriptKey: '' },
        tasks: { exam: true, quiz: true, video: true },   // 任务开关：考试 / 答题 / 视频
        speed: CONFIG.defaultSpeed,
        autoPlay: CONFIG.autoPlay,
        autoMute: CONFIG.autoMute,
        autoNext: CONFIG.autoNext,
    };
    function loadStore() {
        try {
            const raw = GM_getValue(STORE_KEY, '');
            if (raw) store = Object.assign(store, JSON.parse(raw));
        } catch (e) { /* ignore */ }
    }
    function saveStore() {
        try { GM_setValue(STORE_KEY, JSON.stringify(store)); } catch (e) { /* ignore */ }
    }

    /* ======================== 状态 ======================== */
    let state = {
        currentVideo: null,
        examStarted: false,
        examAnswered: false,
    };

    const SPEED_PRESETS = [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4, 8, 16];

    /* ======================== 日志 ======================== */
    const logStore = { list: [] };
    function log(...args) {
        const msg = args.map(a => {
            if (typeof a === 'string') return a;
            if (a instanceof Element) {
                const id = a.id ? `#${a.id}` : '';
                const cls = typeof a.className === 'string' && a.className.trim() ? `.${a.className.trim().split(/\s+/).join('.')}` : '';
                return `<${a.tagName.toLowerCase()}${id}${cls}>`;
            }
            if (a instanceof Error) return `${a.name}: ${a.message}`;
            if (a && typeof a === 'object') {
                const s = JSON.stringify(a);
                return s && s.length > 120 ? s.slice(0, 120) + '…' : s;
            }
            return String(a);
        }).join(' ');
        logStore.list.push({ time: new Date(), msg });
        if (logStore.list.length > CONFIG.logMax) logStore.list.shift();
        console.log('%c[景德镇艺术助手]', 'color:#4CAF50;font-weight:bold', msg);
        renderLogPanel();
    }

    /* ======================== 学习记录 ======================== */
    const RECORD_KEY = 'jdz-art-records';
    let records = [];
    function loadRecords() {
        try { records = JSON.parse(localStorage.getItem(RECORD_KEY)) || []; }
        catch (e) { records = []; }
    }
    function saveRecords() {
        try { localStorage.setItem(RECORD_KEY, JSON.stringify(records)); }
        catch (e) { /* ignore */ }
    }
    function getRecordKey(video) {
        return video.currentSrc || video.src || location.href;
    }
    function ensureRecord(video) {
        const key = getRecordKey(video);
        let rec = records.find(r => r.key === key);
        if (!rec) {
            rec = {
                key,
                title: document.title || key,
                firstTime: Date.now(),
                watched: 0,
                done: false,
                lastSeen: Date.now(),
            };
            records.unshift(rec);
            saveRecords();
        } else {
            rec.lastSeen = Date.now();
        }
        return rec;
    }
    function formatDuration(sec) {
        sec = Math.floor(sec);
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = sec % 60;
        return h ? `${h}时${m}分` : m ? `${m}分${s}秒` : `${s}秒`;
    }
    function formatTime(ts) {
        const d = new Date(ts);
        return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }
    function safeText(s) {
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    /* ======================== 后端 API ======================== */
    function backendRequest(path, { method = 'GET', data = null, token = '' } = {}) {
        return new Promise((resolve) => {
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = 'Bearer ' + token;
            GM_xmlhttpRequest({
                url: CONFIG.backendBase + path,
                method,
                headers,
                data: data ? JSON.stringify(data) : undefined,
                timeout: 20000,
                onload: (res) => {
                    try { resolve(JSON.parse(res.responseText || '{}')); }
                    catch (e) { resolve({ code: 500, msg: '响应解析失败' }); }
                },
                onerror: () => resolve({ code: 500, msg: '无法连接本地后端' }),
                ontimeout: () => resolve({ code: 500, msg: '后端请求超时' }),
            });
        });
    }
    async function sha256Text(text) {
        const enc = new TextEncoder();
        const buf = await crypto.subtle.digest('SHA-256', enc.encode(text || ''));
        return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    }
    async function backendLogin(username, password) {
        const hash = await sha256Text(password);
        const res = await backendRequest('/api/auth/login', { method: 'POST', data: { username, password_hash: hash } });
        if (res.code !== 200 || !res.token) return { ok: false, msg: res.msg || '登录失败' };
        // 同步脚本密钥
        const keyRes = await backendRequest('/api/user/script-key', { token: res.token });
        if (keyRes.code === 200 && keyRes.script_key) {
            store.account = { username, token: res.token, scriptKey: keyRes.script_key };
            saveStore();
            return { ok: true, msg: '登录成功并已同步密钥', scriptKey: keyRes.script_key };
        }
        return { ok: false, msg: '登录成功但密钥获取失败，请到用户中心手动复制' };
    }
    async function backendProfile() {
        const token = store.account.scriptKey || store.account.token;
        if (!token) return null;
        const res = await backendRequest('/api/user/profile', { token });
        if (res.code === 200 && res.profile) return res.profile;
        return null;
    }
    async function refreshAccountBadge() {
        try {
            const prof = await backendProfile();
            if (prof) {
                store.account.profile = {
                    points_balance: prof.active_member ? null : Number(prof.points_balance || 0),
                    active_member: !!prof.active_member,
                    member_until: prof.member_until || '',
                };
                saveStore();
            }
        } catch (e) { /* ignore */ }
        if (loginStatusEl) updateLoginStatus();
    }
    function formatQuotaText() {
        const p = store.account.profile;
        if (!p) return '';
        if (p.active_member) return ` · 🎉包月不限题数`;
        if (p.points_balance === null || p.points_balance === undefined) return '';
        return ` · 剩余 ${p.points_balance} 题`;
    }
    function callAnswer(questionPayload, { u = '' } = {}) {
        return new Promise((resolve) => {
            const token = store.account.scriptKey || store.account.token || '';
            const data = 'question=' + encodeURIComponent(JSON.stringify(questionPayload))
                + '&u=' + encodeURIComponent(u)
                + '&model_mode=auto';
            GM_xmlhttpRequest({
                url: CONFIG.backendBase + '/api/v1/cx?v=xs-5.0',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
                    'Authorization': token ? 'Bearer ' + token : '',
                },
                data,
                timeout: 180000,
                onload: (res) => {
                    try {
                        const obj = JSON.parse(res.responseText || '{}');
                        if (obj.code === 200 && obj.data) {
                            // 同步权益信息（剩余题数 / 包月状态），无需额外请求
                            if (obj.data.remainCount !== undefined || obj.data.profile) {
                                const prof = obj.data.profile || {};
                                const isActive = !!(prof.active_member !== undefined ? prof.active_member : store.account.profile && store.account.profile.active_member);
                                store.account.profile = {
                                    points_balance: isActive ? null : Number(prof.points_balance !== undefined ? prof.points_balance : obj.data.remainCount),
                                    active_member: isActive,
                                    member_until: prof.member_until || (store.account.profile && store.account.profile.member_until) || '',
                                };
                                saveStore();
                                if (loginStatusEl) updateLoginStatus();
                            }
                            resolve({ ok: true, data: obj.data, msg: obj.msg || (obj.data.bank ? '题库命中' : obj.data.cache ? '缓存命中' : 'AI回答') });
                        } else if (res.status === 401 || obj.code === 401) {
                            resolve({ ok: false, msg: '登录态失效，请重新登录用户中心' });
                        } else {
                            resolve({ ok: false, msg: obj.msg || '未命中' });
                        }
                    } catch (e) {
                        resolve({ ok: false, msg: '响应解析失败' });
                    }
                },
                onerror: () => resolve({ ok: false, msg: '无法连接后端' }),
                ontimeout: () => resolve({ ok: false, msg: '后端请求超时' }),
            });
        });
    }

    /* ======================== 图片转 base64 ======================== */
    function downloadImageAsDataURL(url) {
        return new Promise((resolve) => {
            GM_xmlhttpRequest({
                url,
                method: 'GET',
                responseType: 'arraybuffer',
                timeout: 30000,
                onload: (res) => {
                    try {
                        const bytes = new Uint8Array(res.response);
                        let binary = '';
                        const chunk = 0x8000;
                        for (let i = 0; i < bytes.length; i += chunk) {
                            binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
                        }
                        const type = (res.responseHeaders.match(/content-type:\s*([^\s;\r\n]+)/i) || [])[1] || 'image/jpeg';
                        resolve('data:' + type + ';base64,' + btoa(binary));
                    } catch (e) {
                        resolve(null);
                    }
                },
                onerror: () => resolve(null),
                ontimeout: () => resolve(null),
            });
        });
    }

    /* ======================== 倍速控制 ======================== */
    function applySpeed(video, rate) {
        if (!video) return;
        try {
            if (video.__rateHijacked) restorePlaybackRate(video);
            video.playbackRate = rate;
            video.defaultPlaybackRate = rate;
        } catch (e) { /* ignore */ }
        hijackPlaybackRate(video);
        if (video.__vjsPlayer) {
            try { video.__vjsPlayer.playbackRate(rate); } catch (e) { /* ignore */ }
        }
    }

    let speedLockTimer = null;
    function startSpeedLock(video) {
        stopSpeedLock();
        speedLockTimer = setInterval(() => {
            if (!video || !state.currentVideo) return;
            try {
                if (video.__realRate !== store.speed) {
                    video.__realRate = store.speed;
                    video.defaultPlaybackRate = store.speed;
                    try { video.playbackRate = store.speed; } catch (e) {}
                }
            } catch (e) { /* ignore */ }
        }, CONFIG.speedLockInterval);
    }
    function stopSpeedLock() {
        if (speedLockTimer) { clearInterval(speedLockTimer); speedLockTimer = null; }
    }

    function hijackPlaybackRate(video) {
        if (video.__rateHijacked) return;
        video.__rateHijacked = true;
        video.__realRate = store.speed;
        try {
            const desc = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'playbackRate');
            Object.defineProperty(video, 'playbackRate', {
                configurable: true,
                get: function () { return video.__realRate; },
                set: function (v) {
                    const numV = Number(v);
                    if (isNaN(numV)) return;
                    if (numV !== store.speed) {
                        log('🛡️ 网页想修改倍速，已保持为', store.speed + 'x');
                        if (desc && desc.set) desc.set.call(video, store.speed);
                        video.__realRate = store.speed;
                        return;
                    }
                    if (desc && desc.set) desc.set.call(video, numV);
                    video.__realRate = numV;
                }
            });
        } catch (e) {
            log('⚠️ 倍速锁定遇到小问题，已自动改用备用方式', e);
        }
    }

    function restorePlaybackRate(video) {
        if (!video.__rateHijacked) return;
        try { delete video.playbackRate; } catch (e) { /* ignore */ }
        video.__rateHijacked = false;
    }

    /* ======================== 拦截 pause ======================== */
    function hijackPause(video) {
        if (video.__pauseHijacked) return;
        video.__pauseHijacked = true;
        const originalPause = video.pause.bind(video);
        video.__originalPause = originalPause;
        video.pause = function () {
            if (store.autoPlay && !video.ended && !video.__userPaused) {
                log('🛡️ 网页想暂停视频，已拦截，继续播放');
                return;
            }
            return originalPause();
        };
        video.addEventListener('click', () => {
            video.__userPaused = video.paused;
        });
    }

    /* ======================== 自动播放 ======================== */
    function autoPlayVideo(video, fromUserGesture) {
        if (!video || !store.autoPlay) return;
        let retryCount = 0;
        const allowSound = fromUserGesture || store.autoMute === false;
        function attemptPlay() {
            if (!store.autoPlay || !video || video.ended) return;
            if (retryCount >= CONFIG.playRetryMax) {
                log('⚠️ 自动播放多次失败，请在页面上手动点击一次播放按钮');
                statusEl && (statusEl.textContent = '请手动点击播放一次');
                return;
            }
            retryCount++;
            log(`▶️ 自动播放尝试 #${retryCount}（共 ${CONFIG.playRetryMax} 次）`);
            if (!video.src && !video.currentSrc) {
                log('⏳ 视频还在加载中，稍等一下...');
                return;
            }
            video.muted = !allowSound;
            video.volume = allowSound ? 1 : 0;
            const doPlay = (target) => {
                const p = target.play();
                return p || Promise.reject(new Error('no promise'));
            };
            doPlay(video)
                .then(() => {
                    log('✅ 自动播放成功' + (allowSound ? '(带声)' : '(静音)'));
                    setTimeout(() => {
                        if (allowSound) { video.muted = false; video.volume = 1; }
                    }, 500);
                    applySpeed(video, store.speed);
                    updateUI();
                })
                .catch((e) => {
                    log(`❌ 浏览器阻止了自动播放，正在尝试其他方式...`);
                    if (video.__vjsPlayer) {
                        try {
                            video.__vjsPlayer.play().then(() => {
                                log('✅ 自动播放成功' + (allowSound ? '(带声)' : '(静音)'));
                                applySpeed(video, store.speed);
                                updateUI();
                            }).catch(() => { fallbackMuted(); });
                            return;
                        } catch (err) { /* ignore */ }
                    }
                    fallbackMuted();
                });
            function fallbackMuted() {
                if (!allowSound) { setTimeout(attemptPlay, CONFIG.playRetryDelay); return; }
                video.muted = true;
                video.volume = 0;
                const p = (video.__vjsPlayer ? video.__vjsPlayer.play() : video.play());
                if (p && p.then) {
                    p.then(() => log('✅ 静音播放成功'))
                     .catch(() => { log('静音播放也失败，等待用户交互后重试'); setTimeout(attemptPlay, CONFIG.playRetryDelay); });
                } else {
                    setTimeout(attemptPlay, CONFIG.playRetryDelay);
                }
            }
        }
        const events = ['loadedmetadata', 'loadeddata', 'canplay', 'canplaythrough', 'durationchange'];
        const handler = (e) => {
            if (store.autoPlay && video.paused) { log('▶️ 视频已就绪，自动开始播放'); attemptPlay(); }
        };
        events.forEach(evt => video.addEventListener(evt, handler));
        attemptPlay();
        const retryTimer = setInterval(() => {
            if (video.ended || !store.autoPlay) { clearInterval(retryTimer); return; }
            if (video.paused && video.readyState >= 2) { attemptPlay(); }
            else if (!video.paused) { clearInterval(retryTimer); }
        }, CONFIG.playRetryDelay);
    }

    /* ======================== 绑定视频 ======================== */
    function getVjsPlayer(video) {
        try {
            if (window.videojs) {
                const id = (video.id || '').replace(/_html5_api$/, '');
                if (window.videojs.getPlayer) {
                    const p = window.videojs.getPlayer(id);
                    if (p) return p;
                }
                const players = window.videojs.getAllPlayers ? window.videojs.getAllPlayers() : [];
                for (const p of players) {
                    try {
                        if (p.tech_ && p.tech_.el && p.tech_.el() === video) return p;
                        if (p.el && p.el() && p.el().contains(video)) return p;
                    } catch (e) { /* ignore */ }
                }
            }
        } catch (e) { /* ignore */ }
        return null;
    }

    function bindVideo(video) {
        if (video.__bound) return;
        video.__bound = true;
        state.currentVideo = video;
        video.__vjsPlayer = getVjsPlayer(video);
        video.__record = ensureRecord(video);
        log('🎬 发现视频，开始接管', video.__vjsPlayer ? '' : '', `时长=${video.duration ? formatDuration(video.duration) : '未知'}`);
        video.autoplay = true;
        video.preload = 'auto';
        hijackPause(video);
        hijackPlaybackRate(video);
        applySpeed(video, store.speed);
        startSpeedLock(video);
        if (store.autoPlay) autoPlayVideo(video);
        video.addEventListener('pause', () => {
            if (store.autoPlay && !video.ended && !video.__userPaused) {
                log('🔄 视频被暂停了，马上自动恢复播放');
                setTimeout(() => {
                    if (store.autoPlay && !video.ended) {
                        video.muted = true;
                        video.play().catch(() => {});
                    }
                }, 800);
            }
        });
        video.addEventListener('ended', () => {
            log('🏁 视频播放结束');
            if (video.__record) {
                video.__record.done = true;
                saveRecords();
                renderRecordPanel();
            }
            if (store.autoNext) gotoNextCourseware();
        });
        video.addEventListener('ratechange', () => {
            if (video.__realRate !== store.speed) {
                log('🔁 网页改了播放速度，已自动改回', store.speed + 'x');
                applySpeed(video, store.speed);
            }
        });
        updateUI();
    }

    /* ======================== 自动下一节 ======================== */
    function gotoNextCourseware() {
        log('🔜 视频播完了，正在自动进入下一节...');
        const nextTexts = ['下一节', '下一个', '下一页', '下一章', 'next', 'Next', '继续学习'];
        const allClickable = document.querySelectorAll('button, a, [role="button"], [class*="next"], [class*="Next"]');
        for (const btn of allClickable) {
            const text = (btn.textContent || '').trim();
            if (text && nextTexts.some(t => text.includes(t))) {
                log('📍 找到"下一节"按钮，自动点击:', text);
                btn.click();
                return;
            }
        }
        const outlineItems = document.querySelectorAll(
            '[class*="courseware"] li, [class*="chapter"] li, [class*="lesson"] li, [class*="catalog"] li, [class*="tree"] li, [class*="outline"] li, [class*="menu-item"], [class*="node"]'
        );
        let foundCurrent = false;
        for (const item of outlineItems) {
            if (foundCurrent) {
                log('📍 从课程目录中点击下一项:', item.textContent?.trim()?.substring(0, 20));
                item.click();
                return;
            }
            if (item.classList.contains('active') || item.classList.contains('current') ||
                item.getAttribute('aria-current') === 'page' ||
                item.querySelector('.active, .current, [class*="active"], [class*="current"]')) {
                foundCurrent = true;
            }
        }
        log('⌨️ 没找到"下一节"按钮，尝试用键盘切换');
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', keyCode: 39, bubbles: true }));
    }

    /* ======================== 考试自动答题 ======================== */
    const JUDGE_OPTIONS = { 0: '正确', 1: '错误' };

    function isExamPage() {
        return /examflow_index|examflow|examPaper|examQuestion/i.test(location.href)
            || !!document.getElementById('paperSheet')
            || !!document.querySelector('.exam_page, #examPage');
    }

    /* ---- 答案解析：把后端返回文本解析为 字母列表 或 判断题 目标值 ---- */
    function parseAnswerText(text, type) {
        text = String(text || '').trim();
        if (!text) return null;
        const isJudge = type === '判断题' || type === 'judge';
        if (isJudge) {
            const correct = /正确|true|对|yes|right|^1\b|^1$/.test(text);
            const wrong = /错误|false|错|no|^0\b|^0$/.test(text);
            const target = correct && !wrong ? '0' : wrong ? '1' : null;
            return target === null ? null : { judge: target };
        }
        // 多选题/单选题：提取字母，兼容 "答案：ABC"、"A、文本,B、文本"、"A,B,C"
        const letters = text.match(/[A-F]/gi) || [];
        if (letters.length) {
            const unique = [];
            for (const l of letters) {
                const u = l.toUpperCase();
                if (!unique.includes(u)) unique.push(u);
            }
            return { letters: unique };
        }
        // 数字索引 1,2,3
        const nums = text.match(/\d+/g) || [];
        if (nums.length) return { letters: nums.map(n => String.fromCharCode(64 + parseInt(n, 10))) };
        return null;
    }

    /* ---- 双结构题目解析 ----
       结构A(纯文本): #qContent{N} > .divQuestionTitle .q-title-text + .questionOptions .q_option(input + .a11y-option)
       结构B(图片/旧): #paperSheet > .set-group > .set-item (.score + a.option / label.exam_radio + 题干图片)
    */
    function getExamQuestions() {
        const result = [];
        // 结构A：qContent{N}
        const qContents = document.querySelectorAll('.exam_page .q_content, #examPage .q_content, div.q_content[id^="qContent"]');
        if (qContents.length) {
            qContents.forEach(qc => {
                const idMatch = (qc.id || '').match(/qContent(\d+)/);
                const titleEl = qc.querySelector('.q-title-text');
                const title = titleEl ? (titleEl.textContent || '').replace(/\s+/g, ' ').trim() : '';
                const qidInput = qc.querySelector('input[name="quesId"]');
                const qid = qidInput ? qidInput.value : '';
                const typeEl = qc.querySelector('.divQuestionTitle');
                const typeName = typeEl ? (typeEl.getAttribute('data-q-type-name') || '') : '';
                const opts = [];
                qc.querySelectorAll('.q_option').forEach(op => {
                    const input = op.querySelector('input[type=radio], input[type=checkbox]');
                    const clickable = op.querySelector('.a11y-option') || op.querySelector('.radio_off') || op.querySelector('.checkbox_off') || op;
                    const labelEl = clickable;
                    const labelText = (labelEl.textContent || '').replace(/\s+/g, ' ').trim();
                    const optLetter = clickable.getAttribute && (clickable.getAttribute('data-option-label') || '');
                    const inputVal = input ? input.value : '';
                    const checked = input ? !!input.checked : false;
                    opts.push({ text: labelText, el: clickable, input, value: inputVal, letter: optLetter, checked });
                });
                const imgs = Array.from(qc.querySelectorAll('img'));
                const imgSrcs = imgs.map(img => img.src || img.getAttribute('data-src') || '').filter(Boolean);
                if (idMatch) {
                    result.push({
                        num: parseInt(idMatch[1], 10),
                        type: typeName,
                        title,
                        qid,
                        opts,
                        judges: typeName === '判断题' ? opts.map((o, i) => ({ value: o.value, text: o.text, el: o.el })) : [],
                        stemText: title,
                        imgSrcs,
                        el: qc,
                        mode: 'A',
                        isJudge: typeName === '判断题',
                    });
                }
            });
            if (result.length) return result;
        }
        // 结构B：paperSheet set-item
        const sheet = document.getElementById('paperSheet');
        if (!sheet) return [];
        const items = sheet.querySelectorAll('.set-item');
        items.forEach((item, i) => {
            const scoreEl = item.querySelector('.score');
            const numMatch = scoreEl ? (scoreEl.textContent || '').match(/(\d+)/) : null;
            if (!numMatch) return;
            const num = parseInt(numMatch[1], 10);
            const opts = [];
            item.querySelectorAll('a.option').forEach(o => {
                opts.push({ text: (o.textContent || '').trim(), el: o, letter: (o.getAttribute('data-option-label') || (o.textContent || '').trim()).toUpperCase() });
            });
            const radioEls = item.querySelectorAll('label.exam_radio');
            const judges = [];
            radioEls.forEach(label => {
                const input = label.querySelector('input[type=radio]');
                judges.push({ value: input ? input.value : '', text: (label.textContent || '').trim(), el: label });
            });
            const stemEl = item.querySelector('.stem, [class*="stem"], .fl, .question-content, [class*="question"]');
            const stemText = stemEl ? (stemEl.textContent || '').replace(/\s+/g, ' ').trim() : '';
            const imgs = item.querySelectorAll('img');
            const imgSrcs = Array.from(imgs).map(img => img.src || img.getAttribute('data-src') || '').filter(Boolean);
            result.push({ num, opts, judges, stemText, imgSrcs, el: item, mode: 'B', isJudge: judges.length > 0, type: judges.length ? '判断题' : (opts.length ? '单选题' : '') });
        });
        return result;
    }

    /* ---- 选项文本匹配：模型可能直接返回选项内容（如"发展"）而非字母 ---- */
    function matchOptionTextToLetters(q, answer) {
        const clean = (s) => String(s || '')
            .replace(/^[A-F][、.．)）:：]\s*/i, '')
            .replace(/^答案[:：]\s*/i, '')
            .replace(/^选项[:：]\s*/i, '')
            .replace(/\s+/g, '').trim();
        const ans = clean(answer).toLowerCase();
        if (!ans) return [];
        const isSingle = /单选/.test(q.type || '') || (q.opts[0] && q.opts[0].input && q.opts[0].input.type === 'radio');
        const found = [];
        q.opts.forEach((o, idx) => {
            const optText = clean(o.text || o.textContent || '').toLowerCase();
            if (!optText) return;
            const hit = optText === ans || optText.includes(ans) || (ans.length >= 2 && ans.includes(optText));
            if (hit) {
                const letter = o.letter ? o.letter.toUpperCase() : String.fromCharCode(65 + idx);
                if (!found.includes(letter)) found.push(letter);
            }
        });
        return isSingle ? found.slice(0, 1) : found;
    }

    /* ---- 单题填答：兼容两套结构 ---- */
    function fillExamAnswer(q, answer) {
        const parsed = parseAnswerText(answer, q.type);
        // 判断题
        if (q.isJudge) {
            let targetValue = parsed ? parsed.judge : null;
            // 模型可能返回字母（A=正确/第一个选项，B=错误/第二个选项），按选项顺序映射
            if (targetValue === null) {
                const letterMatch = String(answer || '').match(/\b([A-F])\b/i);
                if (letterMatch) {
                    const idx = letterMatch[1].toUpperCase().charCodeAt(0) - 65;
                    const list = q.mode === 'A' ? q.opts : q.judges;
                    if (list && list[idx] !== undefined) targetValue = String(list[idx].value);
                }
            }
            if (targetValue === null) return false;
            if (q.mode === 'A') {
                // 结构A: 通过全局 renderCheckboxOrRadioByLabel(num, qid, idx) 或点击
                let clicked = false;
                q.opts.forEach((o, idx) => {
                    if (String(o.value) === targetValue && !o.input.checked) {
                        const fn = window.renderCheckboxOrRadioByLabel;
                        if (typeof fn === 'function') {
                            try { fn(String(q.num), q.qid, String(idx)); clicked = true; } catch (e) {}
                        } else {
                            o.el.click();
                            clicked = true;
                        }
                    }
                });
                return clicked;
            }
            // 结构B
            for (const j of q.judges) {
                if (String(j.value) === targetValue) {
                    j.el.classList.add('r_on');
                    if (typeof renderCheckboxOrRadio === 'function') {
                        try { renderCheckboxOrRadio(q.num, q.el.querySelector('.wrap') ? q.el.querySelector('.wrap').id : '', JSON.stringify(targetValue)); } catch (e) {}
                    }
                    const input = j.el.querySelector('input[type=radio]');
                    if (input) input.checked = true;
                    return true;
                }
            }
            return false;
        }
        // 选择题（单选/多选）
        let letters = parsed ? (parsed.letters || []) : [];
        // 答案没含字母时，尝试按选项文本匹配（模型可能直接返回选项内容）
        if (!letters.length) {
            letters = matchOptionTextToLetters(q, answer);
        }
        if (!letters.length) return false;
        let clicked = 0;
        q.opts.forEach((o, idx) => {
            // 计算该选项对应的字母（数据里可能已有 letter，否则用索引）
            const letter = o.letter ? o.letter.toUpperCase() : String.fromCharCode(65 + idx);
            const want = letters.includes(letter);
            if (want && !o.checked) {
                if (q.mode === 'A' && typeof window.renderCheckboxOrRadioByLabel === 'function') {
                    try { window.renderCheckboxOrRadioByLabel(String(q.num), q.qid, String(idx)); clicked++; } catch (e) {}
                } else {
                    o.el.click();
                    clicked++;
                }
            }
        });
        return clicked >= 0;
    }

    function formatAnswerForLog(raw) {
        // 清理答案文本：只保留有效字母（或 正确/错误），去掉 "答案：" 等前缀
        const s = String(raw || '').trim();
        if (!s) return '';
        const judge = s.match(/正确|错误|对|错/);
        if (judge) return judge[0];
        const letters = s.match(/[A-F]/gi);
        if (letters && letters.length) return letters.map(l => l.toUpperCase()).join('');
        return s.slice(0, 20);
    }

    function formatModelForLog(model) {
        const m = String(model || '');
        if (!m) return '';
        // 去掉厂商前缀 tencent/ qwen/ deepseek/ 等，只留模型名
        const seg = m.split('/').pop();
        return seg.slice(0, 24);
    }

    async function answerExamQuestion(q, index) {
        let payload = { question: q.stemText || q.title, type: q.type || (q.isJudge ? 'judge' : 'single') };
        if (q.opts.length) payload.options = q.opts.map(o => o.text);
        // 图片题：下载图片
        const dataURLs = [];
        for (const src of q.imgSrcs) {
            const dataUrl = await downloadImageAsDataURL(src);
            if (dataUrl) dataURLs.push(dataUrl);
        }
        if (dataURLs.length) payload.images = dataURLs;
        if (!q.stemText && !dataURLs.length) return { ok: false, msg: '题目为空' };
        log(`📝 [${q.num}题] 调后端获取答案...`);
        let res = await callAnswer(payload, { u: store.account.username || '' });
        // 超时/网络失败时自动重试一次（后端冷却机制会让下一次换模型）
        if (!res.ok && /超时|无法连接|未命中|响应解析/.test(res.msg || '')) {
            log(`⚠️ [${q.num}题] ${res.msg}，3秒后自动重试...`);
            await new Promise(r => setTimeout(r, 3000));
            res = await callAnswer(payload, { u: store.account.username || '' });
            if (res.ok) log(`✅ [${q.num}题] 重试成功`);
        }
        if (!res.ok) return res;
        return { ok: true, answer: res.data.answer, model: res.data.model, msg: res.msg || '' };
    }

    /* ---- 整页图片试卷模式 ----
       试卷题干是整页大图（#docImagesViewArea 下 .cont > img），一张图含多道题。
       逐张图调用后端视觉模型，返回 JSON: [{"num":1,"answer":"A"}, ...]，再逐题填答。
       扣点按实际 API 调用次数（每张图一次调用扣1点，包月不扣）。
    */
    function extractImagePages() {
        const area = document.getElementById('docImagesViewArea');
        if (!area) return [];
        const srcs = [];
        area.querySelectorAll('img').forEach(img => {
            const s = img.src || img.getAttribute('data-src') || '';
            if (s && /(\.jpe?g|\.png|\.gif|\.webp)(\?|$)/i.test(s)) srcs.push(s);
        });
        // 若 docImagesViewArea 为空，退回找页面里非主题的整页大图
        if (!srcs.length) {
            document.querySelectorAll('img').forEach(img => {
                const s = img.src || '';
                if (s && /preview-office-convert|resourcePath|upload/.test(s) && img.naturalWidth > 300) srcs.push(s);
            });
        }
        return srcs;
    }

    function parseImagePageAnswers(text) {
        // 兼容: [{"num":1,"answer":"A"},...] / {1:"A",...} / 逐行 "1.A"
        const raw = String(text || '').trim();
        if (!raw) return null;
        try {
            const arr = JSON.parse(raw);
            if (Array.isArray(arr)) {
                const map = {};
                arr.forEach(item => {
                    const num = parseInt(item.num !== undefined ? item.num : item.index, 10);
                    if (num && item.answer !== undefined) map[num] = String(item.answer).trim();
                });
                return map;
            }
            if (typeof arr === 'object') {
                const map = {};
                Object.keys(arr).forEach(k => {
                    const num = parseInt(k, 10);
                    if (num) map[num] = String(arr[k]).trim();
                });
                return map;
            }
        } catch (e) { /* not pure json */ }
        const map = {};
        // 兼容 "1.A 2.B 3.C" 或 "1、A" 等
        const re = /(\d{1,3})\s*[.、:：)）]\s*([A-F]+|正确|错误)/gi;
        let m;
        while ((m = re.exec(raw))) map[parseInt(m[1], 10)] = m[2].toUpperCase();
        return Object.keys(map).length ? map : null;
    }

    async function answerImagePages() {
        const pages = extractImagePages();
        if (!pages.length) return false;
        log(`🖼️ 检测到整页图片型试卷，共 ${pages.length} 张整页图，开始识别...`);
        // 等待 set-item 渲染（填答需要）
        let items = [];
        for (let i = 0; i < 10; i++) {
            items = getExamQuestions();
            if (items.length) break;
            await new Promise(r => setTimeout(r, 1000));
        }
        if (!items.length) {
            log('⚠️ 图片已找到但题目选项未渲染');
            return false;
        }
        const byNum = {};
        items.forEach(q => { byNum[q.num] = q; });
        let filledCount = 0;
        for (let p = 0; p < pages.length; p++) {
            log(`🖼️ [第${p + 1}/${pages.length}张图] 下载并识别...`);
            const dataUrl = await downloadImageAsDataURL(pages[p]);
            if (!dataUrl) { log(`❌ 第${p + 1}张图下载失败`); continue; }
            const payload = {
                question: '请识别这张试卷图片中的全部题目（题干、选项），并按题号逐题给出答案。只输出 JSON 数组，格式：[{"num":1,"answer":"A"},{"num":2,"answer":"B,C"},...]。判断题用"正确"或"错误"。不要输出其他任何内容。',
                images: [dataUrl],
                type: 'image',
                platform: 'jdz-exam-image',
                refer: location.href,
            };
            const res = await callAnswer(payload, { u: store.account.username || '' });
            if (!res.ok) { log(`❌ 第${p + 1}张图识别失败: ${res.msg}`); continue; }
            const answers = parseImagePageAnswers(res.data.answer);
            if (!answers) { log(`⚠️ 第${p + 1}张图返回无法解析: ${String(res.data.answer).slice(0, 120)}`); continue; }
            const nums = Object.keys(answers).map(Number);
            log(`✅ 第${p + 1}张图识别出 ${nums.length} 题答案 (${res.msg})`);
            for (const num of nums) {
                const q = byNum[num];
                if (!q) { log(`⚠️ 题${num}未在页面中找到选项，跳过`); continue; }
                const ok = fillExamAnswer(q, answers[num]);
                if (ok) filledCount++;
                log(`${ok ? '✅' : '⚠️'} [${num}题] ${ok ? '已填写' : '未能填写'} 答案=${formatAnswerForLog(answers[num]) || answers[num]}`);
                await new Promise(r => setTimeout(r, 800));
            }
            await new Promise(r => setTimeout(r, 1500));
        }
        log(`🏁 整页图片答题完成，共填写 ${filledCount} 题`);
        return filledCount > 0;
    }

    async function runExamAutoAnswer() {
        if (state.examStarted) return;
        state.examStarted = true;
        log('📖 检测到考试页面，开始自动答题');
        // 整页图片型试卷优先处理
        if (extractImagePages().length) {
            const ok = await answerImagePages();
            state.examStarted = false;
            if (ok && store.tasks.examAutoSubmit) {
                setTimeout(() => { trySubmitExam(); }, 2000);
            }
            return;
        }
        // 等待题目渲染
        for (let i = 0; i < 10; i++) {
            const qs = getExamQuestions();
            if (qs.length >= 1) break;
            await new Promise(r => setTimeout(r, 1000));
        }
        const questions = getExamQuestions();
        if (!questions.length) {
            log('⚠️ 未解析到题目，可能是整页图片型试卷，跳过');
            state.examStarted = false;
            return;
        }
        log(`🔍 解析到 ${questions.length} 道题 (${questions[0].mode === 'A' ? '文本结构' : '图片结构'})`);
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            const answered = q.isJudge ? q.opts.some(o => o.checked) : q.opts.some(o => o.checked);
            if (answered) continue;
            const res = await answerExamQuestion(q, i);
            if (!res.ok) {
                log(`❌ [${q.num}题] 获取失败: ${res.msg}`);
                continue;
            }
            const ok = fillExamAnswer(q, res.answer);
            const ansShow = formatAnswerForLog(res.answer);
            const hit = res.msg && /命中/.test(res.msg) ? ` ${res.msg}` : '';
            log(`${ok ? '✅' : '⚠️'} [${q.num}题] ${ok ? '已填写' : '未能填写'} 答案=${ansShow || '?'}${hit}`);
            await new Promise(r => setTimeout(r, 1500));
        }
        state.examStarted = false;
        log('🏁 考试自动答题完成');
        if (store.tasks.examAutoSubmit) {
            setTimeout(() => { trySubmitExam(); }, 2000);
        }
    }

    function trySubmitExam() {
        const links = document.querySelectorAll('a, button');
        for (const el of links) {
            const t = (el.textContent || '').trim();
            if (t === '交卷') {
                log('📤 自动点击交卷');
                el.click();
                setTimeout(() => {
                    document.querySelectorAll('button').forEach(b => {
                        const bt = (b.textContent || '').trim();
                        if (bt === '交卷') b.click();
                    });
                }, 1000);
                return;
            }
        }
    }

    function setupExamWatcher() {
        setInterval(() => {
            if (!store.tasks.exam) return;
            if (isExamPage() && !state.examStarted) {
                runExamAutoAnswer();
            }
        }, 3000);
    }

    /* ======================== 作业/测验自动答题 ======================== */
    function extractWorkQuestions() {
        // 通用提取：页面上可见的题目容器
        const selectors = [
            '[class*="question"]', '[class*="exam"]', '[class*="work"]', '[class*="quiz"]',
            '.set-item', '[class*="stem"]'
        ];
        const seen = new Set();
        const questions = [];
        document.querySelectorAll(selectors.join(',')).forEach(el => {
            if (seen.has(el)) return;
            seen.add(el);
            const text = (el.textContent || '').trim();
            if (text.length < 4) return;
            // 选项
            const opts = [];
            el.querySelectorAll('input[type=radio], input[type=checkbox]').forEach(inp => {
                const label = inp.closest('label');
                const optText = label ? (label.textContent || '').replace(/\s+/g, ' ').trim() : '';
                if (optText) opts.push({ text: optText, el: label || inp, input: inp });
            });
            questions.push({ el, text, opts });
        });
        return questions;
    }

    async function runWorkAutoAnswer() {
        const questions = extractWorkQuestions();
        if (!questions.length) return;
        log(`📝 检测到作业/测验 ${questions.length} 个题目容器`);
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            const opts = q.opts;
            if (!opts.length) continue;
            const already = opts.some(o => o.input && o.input.checked);
            if (already) continue;
            log(`📝 作业第${i + 1}题 调后端...`);
            const payload = { question: q.text.slice(0, 300), options: opts.map(o => o.text), type: 'single' };
            const res = await callAnswer(payload, { u: store.account.username || '' });
            if (!res.ok) { log(`❌ 作业第${i + 1}题失败: ${res.msg}`); continue; }
            const answer = String(res.data.answer || '').trim();
            const letters = answer.match(/[A-E]/gi) || [];
            let clicked = 0;
            opts.forEach((o, idx) => {
                const letter = String.fromCharCode(65 + idx);
                if (letters.some(l => l.toUpperCase() === letter)) {
                    if (o.input && !o.input.checked) {
                        o.el.click();
                        clicked++;
                    }
                }
            });
            log(`${clicked ? '✅' : '⚠️'} 作业第${i + 1}题 已处理 (${res.msg})`);
            await new Promise(r => setTimeout(r, 1500));
        }
    }

    function setupWorkWatcher() {
        setInterval(() => {
            if (!store.tasks.quiz) return;
            if (/work|homework|quiz|test|作业|测验/.test(location.href)) {
                runWorkAutoAnswer();
            }
        }, 5000);
    }

    /* ======================== 视频检测（含 Shadow DOM） ======================== */
    function findVideosInShadow(root) {
        const results = [];
        try {
            root.querySelectorAll('video').forEach(v => results.push(v));
            root.querySelectorAll('*').forEach(el => {
                if (el.shadowRoot) {
                    el.shadowRoot.querySelectorAll('video').forEach(v => results.push(v));
                    findVideosInShadow(el.shadowRoot).forEach(v => results.push(v));
                }
            });
        } catch (e) { /* ignore */ }
        return results;
    }

    function scanForVideos() {
        if (!store.tasks.video) return;
        let videos = findVideosInShadow(document);
        document.querySelectorAll('iframe').forEach((iframe) => {
            try {
                const iframeVideos = findVideosInShadow(iframe.contentDocument);
                iframeVideos.forEach(v => { if (!videos.includes(v)) videos.push(v); });
            } catch (e) { /* 跨域 */ }
        });
        if (videos.length > 0) {
            videos.forEach(bindVideo);
            if (!state.currentVideo || !document.contains(state.currentVideo)) {
                state.currentVideo = videos[videos.length - 1];
            }
            updateUI();
        }
    }

    /* ======================== SPA 路由监听 ======================== */
    let lastUrl = location.href;
    function watchRouteChange() {
        const check = () => {
            if (location.href !== lastUrl) {
                lastUrl = location.href;
                log('🔀 页面已切换，正在重新检测视频...');
                state.currentVideo = null;
                stopSpeedLock();
                setTimeout(scanForVideos, 1500);
                setTimeout(scanForVideos, 3000);
                setTimeout(scanForVideos, 5000);
            }
        };
        window.addEventListener('hashchange', check);
        window.addEventListener('popstate', check);
        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;
        history.pushState = function (...args) {
            originalPushState.apply(this, args);
            setTimeout(check, 200);
        };
        history.replaceState = function (...args) {
            originalReplaceState.apply(this, args);
            setTimeout(check, 200);
        };
    }

    /* ======================== MutationObserver ======================== */
    function setupGlobalObserver() {
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType !== 1) continue;
                    if (node.tagName === 'VIDEO') {
                        bindVideo(node);
                    } else if (node.querySelector) {
                        try {
                            const vids = node.querySelectorAll('video');
                            vids.forEach(v => { if (!v.__bound) bindVideo(v); });
                        } catch (e) { /* ignore */ }
                    }
                }
            }
        });
        const start = () => {
            observer.observe(document.documentElement, { childList: true, subtree: true });
            log('✅ 视频自动检测已开启，持续监测页面变化');
        };
        if (document.documentElement) start();
        else document.addEventListener('DOMContentLoaded', start);
    }

    /* ======================== Page Visibility ======================== */
    function setupVisibilityHandler() {
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && store.autoPlay && state.currentVideo) {
                if (state.currentVideo.paused && !state.currentVideo.ended) {
                    log('🔄 回到页面了，恢复播放');
                    state.currentVideo.__userPaused = false;
                    state.currentVideo.muted = true;
                    state.currentVideo.play().catch(() => {});
                }
            }
        });
    }

    /* ======================== 用户交互解锁 ======================== */
    function setupUserInteractionUnlock() {
        const unlock = () => {
            if (store.autoPlay && state.currentVideo && state.currentVideo.paused) {
                log('✅ 检测到你的操作，开始播放');
                state.currentVideo.play().catch(() => {});
            }
        };
        document.addEventListener('click', unlock, { once: false });
        document.addEventListener('keydown', unlock, { once: false });
    }

    /* ======================== UI ======================== */
    let panelEl = null;
    let speedDisplayEl = null;
    let statusEl = null;
    let homeTitleEl = null;
    let logListEl = null;
    let recordListEl = null;
    let activePage = 'home';
    let loginStatusEl = null;

    function switchPage(name) {
        activePage = name;
        document.querySelectorAll('.olvh-tab').forEach(t => t.classList.toggle('active', t.dataset.page === name));
        document.querySelectorAll('.olvh-page').forEach(p => p.classList.toggle('active', p.id === 'olvh-page-' + name));
    }

    function renderLogPanel() {
        if (!logListEl) return;
        if (!logStore.list.length) {
            logListEl.innerHTML = '<div class="olvh-empty">暂无日志</div>';
            return;
        }
        const html = logStore.list.slice().reverse().map(item => {
            const t = item.time;
            const ts = `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}:${String(t.getSeconds()).padStart(2, '0')}`;
            return `<div class="olvh-log-item"><span class="t">${ts}</span>${safeText(item.msg)}</div>`;
        }).join('');
        logListEl.innerHTML = html;
        logListEl.scrollTop = 0;
    }

    function renderRecordPanel() {
        if (!recordListEl) return;
        if (!records.length) {
            recordListEl.innerHTML = '<div class="olvh-empty">暂无学习记录</div>';
            return;
        }
        const html = records.map(r => {
            const badge = r.done
                ? '<span class="rd done">已完成</span>'
                : '<span class="rd ing">学习中</span>';
            return `<div class="olvh-record-item">
                <div class="rt">${safeText(r.title)}</div>
                <div class="rs">${badge} · 已学 ${formatDuration(r.watched)} · ${formatTime(r.lastSeen)}</div>
            </div>`;
        }).join('');
        recordListEl.innerHTML = html;
    }

    function updateLoginStatus() {
        if (!loginStatusEl) return;
        if (store.account.scriptKey) {
            loginStatusEl.innerHTML = `✅ 已登录：<b>${safeText(store.account.username || '')}</b>${formatQuotaText()}`;
        } else if (store.account.token) {
            loginStatusEl.innerHTML = `✅ 已登录（未同步密钥）：<b>${safeText(store.account.username || '')}</b>`;
        } else {
            loginStatusEl.innerHTML = '❌ 未登录，请填写账号密码';
        }
    }

    function createPanel() {
        if (window.top !== window.self) return;
        if (document.getElementById('olvh-panel')) return;
        if (!document.body) {
            document.addEventListener('DOMContentLoaded', createPanel);
            return;
        }

        panelEl = document.createElement('div');
        panelEl.id = 'olvh-panel';
        panelEl.innerHTML = `
            <style>
                #olvh-panel {
                    position: fixed; top: 80px; right: 20px; z-index: 999999;
                    font-family: -apple-system, "Microsoft YaHei", sans-serif; font-size: 13px;
                    width: 280px;
                }
                #olvh-header {
                    background: linear-gradient(135deg, #4CAF50, #2E7D32); color: #fff;
                    padding: 8px 12px; border-radius: 8px 8px 0 0; cursor: move;
                    display: flex; align-items: center; justify-content: space-between;
                    font-weight: 600; user-select: none; box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                }
                #olvh-header .title { font-size: 13px; }
                #olvh-toggle {
                    background: rgba(255,255,255,0.2); border: none; color: #fff;
                    width: 22px; height: 22px; border-radius: 50%; cursor: pointer;
                    font-size: 14px; line-height: 1; display: flex; align-items: center; justify-content: center;
                }
                #olvh-toggle:hover { background: rgba(255,255,255,0.35); }
                #olvh-body {
                    background: #fff; border: 1px solid #e0e0e0; border-top: none;
                    border-radius: 0 0 8px 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.15);
                }
                #olvh-body.collapsed { display: none; }
                .olvh-tabs { display: flex; background: #f5f5f5; border-bottom: 1px solid #e0e0e0; }
                .olvh-tab {
                    flex: 1; text-align: center; padding: 8px 0; cursor: pointer;
                    color: #666; font-size: 12px; border-bottom: 2px solid transparent; transition: all 0.15s;
                }
                .olvh-tab:hover { background: #e8f5e9; color: #2E7D32; }
                .olvh-tab.active { color: #4CAF50; font-weight: 700; border-bottom-color: #4CAF50; background: #fff; }
                .olvh-page { display: none; padding: 10px; max-height: 380px; overflow-y: auto; }
                .olvh-page.active { display: block; }
                .olvh-section { margin-bottom: 10px; }
                .olvh-section:last-child { margin-bottom: 0; }
                .olvh-label { color: #666; font-size: 11px; margin-bottom: 5px; display: flex; justify-content: space-between; align-items: center; }
                .olvh-speed-value { font-weight: 700; color: #4CAF50; font-size: 14px; }
                .olvh-speed-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; }
                .olvh-speed-btn {
                    padding: 5px 0; border: 1px solid #ddd; background: #f9f9f9; border-radius: 4px;
                    cursor: pointer; text-align: center; font-size: 12px; color: #333; transition: all 0.15s;
                }
                .olvh-speed-btn:hover { background: #e8f5e9; border-color: #4CAF50; }
                .olvh-speed-btn.active { background: #4CAF50; color: #fff; border-color: #4CAF50; font-weight: 600; }
                .olvh-custom-speed { display: flex; gap: 4px; margin-top: 4px; }
                .olvh-custom-speed input { flex: 1; padding: 4px 6px; border: 1px solid #ddd; border-radius: 4px; font-size: 12px; outline: none; width: 0; }
                .olvh-custom-speed input:focus { border-color: #4CAF50; }
                .olvh-custom-speed button { padding: 4px 10px; background: #4CAF50; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; }
                .olvh-toggle-row { display: flex; justify-content: space-between; align-items: center; padding: 4px 0; }
                .olvh-toggle-row span { color: #555; }
                .olvh-switch { position: relative; width: 36px; height: 20px; background: #ccc; border-radius: 10px; cursor: pointer; transition: background 0.2s; }
                .olvh-switch.on { background: #4CAF50; }
                .olvh-switch::after { content: ''; position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; background: #fff; border-radius: 50%; transition: left 0.2s; }
                .olvh-switch.on::after { left: 18px; }
                .olvh-status { font-size: 11px; color: #999; margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee; }
                .olvh-status .dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 4px; vertical-align: middle; }
                .olvh-status .dot.green { background: #4CAF50; }
                .olvh-status .dot.gray { background: #ccc; }
                .olvh-status .dot.red { background: #f44336; }
                .olvh-force-btn {
                    width: 100%; padding: 6px; margin-top: 6px; background: #ff9800; color: #fff;
                    border: none; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600;
                }
                .olvh-force-btn:hover { background: #f57c00; }
                .olvh-log-list { font-family: Consolas, Monaco, monospace; font-size: 11px; line-height: 1.6; color: #444; }
                .olvh-log-item { padding: 2px 0; border-bottom: 1px dashed #f0f0f0; word-break: break-all; }
                .olvh-log-item .t { color: #aaa; margin-right: 4px; }
                .olvh-record-item { padding: 6px 0; border-bottom: 1px dashed #f0f0f0; }
                .olvh-record-item .rt { font-size: 11px; color: #333; word-break: break-all; margin-bottom: 2px; }
                .olvh-record-item .rs { font-size: 11px; color: #999; }
                .olvh-record-item .rd { display: inline-block; font-size: 10px; padding: 1px 6px; border-radius: 8px; color: #fff; }
                .olvh-record-item .rd.done { background: #4CAF50; }
                .olvh-record-item .rd.ing { background: #ff9800; }
                .olvh-hint { font-size: 11px; color: #999; margin-top: 6px; line-height: 1.5; }
                .olvh-empty { color: #bbb; font-size: 11px; text-align: center; padding: 12px 0; }
                .olvh-title-row { font-size: 11px; color: #333; word-break: break-all; margin-bottom: 6px; }
                .olvh-clear-btn { width: 100%; padding: 4px; margin-top: 6px; background: #eee; color: #666; border: 1px solid #ddd; border-radius: 4px; cursor: pointer; font-size: 11px; }
                .olvh-clear-btn:hover { background: #e0e0e0; }
                .olvh-login-box { border: 1px solid #e0e0e0; border-radius: 6px; padding: 8px; background: #fafafa; }
                .olvh-login-row { display: flex; gap: 4px; margin-bottom: 6px; }
                .olvh-login-row input { flex: 1; padding: 5px 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 12px; outline: none; min-width: 0; }
                .olvh-login-row input:focus { border-color: #4CAF50; }
                .olvh-login-btn { width: 100%; padding: 6px; background: #4CAF50; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600; }
                .olvh-login-btn:hover { background: #388E3C; }
                .olvh-login-btn:disabled { background: #a5d6a7; cursor: not-allowed; }
                .olvh-login-status { font-size: 11px; margin-top: 6px; color: #999; word-break: break-all; }
                .olvh-logout-btn { width: 100%; padding: 4px; margin-top: 6px; background: #eee; color: #d32f2f; border: 1px solid #ddd; border-radius: 4px; cursor: pointer; font-size: 11px; }
                .olvh-logout-btn:hover { background: #f5e3e3; }
                .olvh-task-switch { border: 1px solid #e0e0e0; border-radius: 6px; padding: 8px; background: #fafafa; }
                .olvh-task-desc { font-size: 10px; color: #999; margin-top: 4px; }
            </style>
            <div id="olvh-header">
                <span class="title">🎨 景德镇艺术-学习助手</span>
                <button id="olvh-toggle">−</button>
            </div>
            <div id="olvh-body">
                <div class="olvh-tabs">
                    <div class="olvh-tab active" data-page="home">首页</div>
                    <div class="olvh-tab" data-page="quiz">答题</div>
                    <div class="olvh-tab" data-page="log">日志</div>
                    <div class="olvh-tab" data-page="record">记录</div>
                    <div class="olvh-tab" data-page="settings">设置</div>
                </div>
                <div class="olvh-page active" id="olvh-page-home">
                    <div class="olvh-section">
                        <div class="olvh-title-row">🔑 账号登录</div>
                        <div class="olvh-login-box">
                            <div class="olvh-login-row">
                                <input type="text" id="olvh-login-user" placeholder="用户名/邮箱">
                                <input type="password" id="olvh-login-pwd" placeholder="密码">
                            </div>
                            <button class="olvh-login-btn" id="olvh-login-btn">登录并同步密钥</button>
                            <button class="olvh-logout-btn" id="olvh-logout-btn" style="${store.account.scriptKey ? '' : 'display:none'}">退出登录</button>
                            <div class="olvh-login-status" id="olvh-login-status">${store.account.scriptKey ? '已登录' : '未登录'}</div>
                        </div>
                        <div class="olvh-hint">登录后自动获取脚本密钥，用于云端AI答题。也支持用户名或邮箱登录。</div>
                    </div>
                    <div class="olvh-section">
                        <div class="olvh-title-row" id="olvh-home-title">尚未检测到视频</div>
                        <div class="olvh-status" id="olvh-status">
                            <span class="dot gray" id="olvh-status-dot"></span>
                            <span id="olvh-status-text">等待检测视频...</span>
                        </div>
                        <button class="olvh-force-btn" id="olvh-force-play">▶ 强制播放</button>
                    </div>
                </div>
                <div class="olvh-page" id="olvh-page-quiz">
                    <div class="olvh-section">
                        <div class="olvh-title-row">📋 自动任务</div>
                        <div class="olvh-task-switch">
                            <div class="olvh-toggle-row">
                                <span>📖 考试自动答题</span>
                                <div class="olvh-switch ${store.tasks.exam ? 'on' : ''}" id="olvh-task-exam"></div>
                            </div>
                            <div class="olvh-task-desc">进入考试页自动识别题目并填写答案</div>
                            <div class="olvh-toggle-row">
                                <span>📝 作业/测验自动答题</span>
                                <div class="olvh-switch ${store.tasks.quiz ? 'on' : ''}" id="olvh-task-quiz"></div>
                            </div>
                            <div class="olvh-task-desc">进入作业/测验页自动填写答案</div>
                            <div class="olvh-toggle-row">
                                <span>🎬 视频自动处理</span>
                                <div class="olvh-switch ${store.tasks.video ? 'on' : ''}" id="olvh-task-video"></div>
                            </div>
                            <div class="olvh-task-desc">自动播放、倍速、自动下一节</div>
                        </div>
                        <div class="olvh-hint">勾选的任务才会执行，未勾选则跳过。</div>
                    </div>
                </div>
                <div class="olvh-page" id="olvh-page-log">
                    <div class="olvh-section">
                        <div class="olvh-log-list" id="olvh-log-list"><div class="olvh-empty">暂无日志</div></div>
                        <button class="olvh-clear-btn" id="olvh-log-clear">清空日志</button>
                    </div>
                </div>
                <div class="olvh-page" id="olvh-page-record">
                    <div class="olvh-section">
                        <div id="olvh-record-list"><div class="olvh-empty">暂无学习记录</div></div>
                        <button class="olvh-clear-btn" id="olvh-record-clear">清空记录</button>
                    </div>
                </div>
                <div class="olvh-page" id="olvh-page-settings">
                    <div class="olvh-section">
                        <div class="olvh-label">
                            <span>视频倍数</span>
                            <span class="olvh-speed-value" id="olvh-speed-display">${store.speed}x</span>
                        </div>
                        <div class="olvh-speed-grid" id="olvh-speed-grid">
                            ${SPEED_PRESETS.map(s => `<div class="olvh-speed-btn ${s === store.speed ? 'active' : ''}" data-speed="${s}">${s}x</div>`).join('')}
                        </div>
                        <div class="olvh-custom-speed">
                            <input type="number" id="olvh-custom-input" placeholder="自定义" min="0.1" max="16" step="0.1">
                            <button id="olvh-custom-btn">设置</button>
                        </div>
                    </div>
                    <div class="olvh-section">
                        <div class="olvh-toggle-row">
                            <span>自动播放</span>
                            <div class="olvh-switch ${store.autoPlay ? 'on' : ''}" id="olvh-autoplay-switch"></div>
                        </div>
                        <div class="olvh-toggle-row">
                            <span>静音播放</span>
                            <div class="olvh-switch ${store.autoMute ? 'on' : ''}" id="olvh-mute-switch"></div>
                        </div>
                        <div class="olvh-toggle-row">
                            <span>自动下一节</span>
                            <div class="olvh-switch ${store.autoNext ? 'on' : ''}" id="olvh-autonext-switch"></div>
                        </div>
                        <div class="olvh-toggle-row">
                            <span>考试自动交卷</span>
                            <div class="olvh-switch ${store.tasks.examAutoSubmit ? 'on' : ''}" id="olvh-autosubmit-switch"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(panelEl);

        speedDisplayEl = document.getElementById('olvh-speed-display');
        statusEl = document.getElementById('olvh-status-text');
        homeTitleEl = document.getElementById('olvh-home-title');
        logListEl = document.getElementById('olvh-log-list');
        recordListEl = document.getElementById('olvh-record-list');
        loginStatusEl = document.getElementById('olvh-login-status');

        bindUIEvents();
        makeDraggable();
        renderLogPanel();
        renderRecordPanel();
        updateLoginStatus();
    }

    function bindUIEvents() {
        const toggleBtn = document.getElementById('olvh-toggle');
        const body = document.getElementById('olvh-body');
        toggleBtn.addEventListener('click', () => {
            body.classList.toggle('collapsed');
            toggleBtn.textContent = body.classList.contains('collapsed') ? '+' : '−';
        });

        document.querySelectorAll('.olvh-tab').forEach(tab => {
            tab.addEventListener('click', () => switchPage(tab.dataset.page));
        });

        document.getElementById('olvh-speed-grid').addEventListener('click', (e) => {
            const btn = e.target.closest('.olvh-speed-btn');
            if (!btn) return;
            setSpeed(parseFloat(btn.dataset.speed));
        });

        const customInput = document.getElementById('olvh-custom-input');
        const customBtn = document.getElementById('olvh-custom-btn');
        const applyCustom = () => {
            const val = parseFloat(customInput.value);
            if (val > 0 && val <= 16) setSpeed(val);
            else { customInput.value = ''; customInput.placeholder = '0.1~16'; }
        };
        customBtn.addEventListener('click', applyCustom);
        customInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') applyCustom(); });

        // 登录
        const loginBtn = document.getElementById('olvh-login-btn');
        const userInput = document.getElementById('olvh-login-user');
        const pwdInput = document.getElementById('olvh-login-pwd');
        const doLogin = async () => {
            const u = userInput.value.trim();
            const p = pwdInput.value;
            if (!u || !p) { loginStatusEl.textContent = '请填写用户名和密码'; return; }
            loginBtn.disabled = true;
            loginBtn.textContent = '登录中...';
            const res = await backendLogin(u, p);
            loginStatusEl.textContent = res.msg;
            if (res.ok) {
                userInput.value = '';
                pwdInput.value = '';
                document.getElementById('olvh-logout-btn').style.display = '';
                updateLoginStatus();
                log('🔑', res.msg);
                refreshAccountBadge();
            }
            loginBtn.disabled = false;
            loginBtn.textContent = '登录并同步密钥';
        };
        loginBtn.addEventListener('click', doLogin);
        pwdInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') doLogin(); });
        document.getElementById('olvh-logout-btn').addEventListener('click', () => {
            store.account = { username: '', token: '', scriptKey: '' };
            saveStore();
            document.getElementById('olvh-logout-btn').style.display = 'none';
            updateLoginStatus();
            log('👋 已退出登录');
        });

        // 任务开关
        const bindSwitch = (id, key, logText) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('click', () => {
                store.tasks[key] = !store.tasks[key];
                el.classList.toggle('on', store.tasks[key]);
                saveStore();
                log(logText, store.tasks[key] ? '开启' : '关闭');
            });
        };
        bindSwitch('olvh-task-exam', 'exam', '考试自动答题');
        bindSwitch('olvh-task-quiz', 'quiz', '作业/测验自动答题');
        bindSwitch('olvh-task-video', 'video', '视频自动处理');

        document.getElementById('olvh-autoplay-switch').addEventListener('click', function () {
            store.autoPlay = !store.autoPlay;
            saveStore();
            this.classList.toggle('on', store.autoPlay);
            if (store.autoPlay && state.currentVideo) {
                state.currentVideo.__userPaused = false;
                autoPlayVideo(state.currentVideo);
            }
            log('自动播放:', store.autoPlay);
        });
        document.getElementById('olvh-mute-switch').addEventListener('click', function () {
            store.autoMute = !store.autoMute;
            saveStore();
            this.classList.toggle('on', store.autoMute);
            if (state.currentVideo) {
                state.currentVideo.muted = store.autoMute;
                state.currentVideo.volume = store.autoMute ? 0 : 1;
            }
            log('静音播放:', store.autoMute);
        });
        document.getElementById('olvh-autonext-switch').addEventListener('click', function () {
            store.autoNext = !store.autoNext;
            saveStore();
            this.classList.toggle('on', store.autoNext);
            log('自动下一节:', store.autoNext);
        });
        document.getElementById('olvh-autosubmit-switch').addEventListener('click', function () {
            store.tasks.examAutoSubmit = !store.tasks.examAutoSubmit;
            saveStore();
            this.classList.toggle('on', store.tasks.examAutoSubmit);
            log('考试自动交卷:', store.tasks.examAutoSubmit);
        });

        document.getElementById('olvh-log-clear').addEventListener('click', () => {
            logStore.list = [];
            renderLogPanel();
            log('日志已清空');
        });

        document.getElementById('olvh-record-clear').addEventListener('click', () => {
            records = [];
            saveRecords();
            renderRecordPanel();
            log('学习记录已清空');
        });

        document.getElementById('olvh-force-play').addEventListener('click', () => {
            log('手动触发强制播放');
            if (state.currentVideo) {
                const v = state.currentVideo;
                v.__userPaused = false;
                const wantSound = store.autoMute === false;
                v.muted = !wantSound;
                v.volume = wantSound ? 1 : 0;
                const target = v.__vjsPlayer || v;
                target.play().then(() => {
                    log('✅ 强制播放成功' + (wantSound ? '(带声)' : '(静音)'));
                    if (wantSound) setTimeout(() => { v.muted = false; v.volume = 1; }, 400);
                }).catch(e => {
                    v.muted = true; v.volume = 0;
                    v.play().then(() => log('✅ 备用静音播放成功')).catch(err => log('强制播放失败:', err));
                });
                applySpeed(v, store.speed);
            } else {
                log('未检测到视频，重新扫描...');
                scanForVideos();
            }
        });
    }

    function setSpeed(rate) {
        store.speed = rate;
        saveStore();
        log('设置倍速:', rate);
        if (state.currentVideo) {
            applySpeed(state.currentVideo, rate);
        }
        updateUI();
    }

    function updateUI() {
        if (!panelEl) return;
        if (speedDisplayEl) speedDisplayEl.textContent = store.speed + 'x';
        document.querySelectorAll('.olvh-speed-btn').forEach(btn => {
            btn.classList.toggle('active', parseFloat(btn.dataset.speed) === store.speed);
        });
        if (statusEl) {
            const dot = document.getElementById('olvh-status-dot');
            if (state.currentVideo) {
                const playing = !state.currentVideo.paused;
                const rate = state.currentVideo.__realRate || store.speed;
                statusEl.textContent = playing
                    ? `播放中 · ${rate}x · ${Math.round(state.currentVideo.currentTime)}s`
                    : `已检测 · 暂停中 · ${rate}x`;
                if (dot) dot.className = 'dot ' + (playing ? 'green' : 'red');
            } else {
                statusEl.textContent = '等待检测视频...';
                if (dot) dot.className = 'dot gray';
            }
        }
        if (homeTitleEl) {
            if (state.currentVideo) {
                homeTitleEl.textContent = `📺 ${document.title || '当前视频'}`;
            } else {
                homeTitleEl.textContent = '尚未检测到视频';
            }
        }
    }

    function startUIRefresh() {
        setInterval(() => {
            if (state.currentVideo) {
                if (!state.currentVideo.paused && !state.currentVideo.ended && state.currentVideo.__record) {
                    state.currentVideo.__record.watched += 1;
                    state.currentVideo.__record.lastSeen = Date.now();
                    saveRecords();
                }
                updateUI();
            }
        }, 1000);
    }

    function makeDraggable() {
        const header = document.getElementById('olvh-header');
        const panel = document.getElementById('olvh-panel');
        let isDragging = false, startX, startY, startLeft, startTop;
        header.addEventListener('mousedown', (e) => {
            if (e.target.id === 'olvh-toggle') return;
            isDragging = true;
            startX = e.clientX; startY = e.clientY;
            const rect = panel.getBoundingClientRect();
            startLeft = rect.left; startTop = rect.top;
            panel.style.right = 'auto';
            panel.style.left = startLeft + 'px';
            panel.style.top = startTop + 'px';
            e.preventDefault();
        });
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            panel.style.left = (startLeft + e.clientX - startX) + 'px';
            panel.style.top = (startTop + e.clientY - startY) + 'px';
        });
        document.addEventListener('mouseup', () => { isDragging = false; });
    }

    /* ======================== 启动 ======================== */
    function init() {
        loadStore();
        loadRecords();
        log('景德镇艺术-学习助手 v4.1.0 启动');

        setupExamWatcher();
        setupWorkWatcher();
        setupGlobalObserver();

        const start = () => {
            createPanel();
            watchRouteChange();
            setupVisibilityHandler();
            setupUserInteractionUnlock();
            startUIRefresh();

            if (isExamPage()) {
                log('📖 检测到考试页面');
                if (store.tasks.exam) runExamAutoAnswer();
            }

            scanForVideos();
            setTimeout(scanForVideos, 1500);
            setTimeout(scanForVideos, 3000);
            setTimeout(scanForVideos, 5000);
            setTimeout(scanForVideos, 8000);

            setInterval(scanForVideos, CONFIG.retryInterval);
        };

        if (document.body) start();
        else document.addEventListener('DOMContentLoaded', start);
    }

    init();
})();
