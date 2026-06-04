/**
 * html2image-server - Start script (Node.js).
 * Launches "node server.js" as a detached background process and waits for
 * it to write its PID file. Reads port from config.json.
 *
 * This is the authoritative start mechanism — start-server.bat / .sh are
 * thin wrappers that simply call `node start.js`. Doing it in Node avoids
 * all shell encoding issues on Windows (non-ASCII paths, codepage, etc.).
 *
 * Usage:  node start.js
 */

const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');

const PROJECT_DIR = __dirname;
const LOG_DIR = path.join(PROJECT_DIR, 'logs');
const LOG_FILE = path.join(LOG_DIR, 'app_output.log');
const PID_FILE = path.join(PROJECT_DIR, '.app.pid');

function readConfigKey(key) {
    try {
        const raw = execSync('node config-read.js ' + key, {
            cwd: PROJECT_DIR, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore']
        }).trim();
        return raw;
    } catch (_) { return ''; }
}

function ensureLogDir() {
    try { if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true }); } catch (_) {}
}

function waitForPidFile(maxSeconds) {
    return new Promise((resolve) => {
        let elapsed = 0;
        const timer = setInterval(() => {
            elapsed++;
            if (fs.existsSync(PID_FILE)) {
                clearInterval(timer);
                const pid = parseInt(fs.readFileSync(PID_FILE, 'utf8').trim(), 10);
                resolve(Number.isFinite(pid) && pid > 0 ? pid : null);
            } else if (elapsed >= maxSeconds) {
                clearInterval(timer);
                resolve(null);
            }
        }, 1000);
    });
}

async function main() {
    const PORT = parseInt(readConfigKey('server.port'), 10) || 3000;
    const WAIT = parseInt(readConfigKey('http.startupWaitSeconds'), 10) || 30;

    console.log('================================================');
    console.log('  html2image-server - Start');
    console.log('  Port     : ' + PORT);
    console.log('  Timeout  : ' + WAIT + 's');
    console.log('================================================');
    console.log();

    // ---- 1) Node check
    console.log('[1/4] Checking Node.js ...');
    try {
        const v = execSync('node --version', { encoding: 'utf8' }).trim();
        console.log('[ OK ] Node.js ' + v);
    } catch (e) {
        console.log('[FAIL] Node.js not installed or not on PATH.');
        process.exit(1);
    }

    // ---- 2) Dependencies check
    console.log('[2/4] Checking dependencies ...');
    if (!fs.existsSync(path.join(PROJECT_DIR, 'node_modules'))) {
        console.log('[WARN] node_modules missing — running npm install ...');
        try {
            execSync('npm install --no-audit --no-fund', { cwd: PROJECT_DIR, stdio: 'inherit' });
            console.log('[ OK ] Dependencies installed.');
        } catch (e) {
            console.log('[FAIL] npm install failed.');
            process.exit(1);
        }
    } else {
        console.log('[ OK ] Dependencies present.');
    }

    // ---- 3) Port check
    console.log('[3/4] Checking port ' + PORT + ' ...');
    let portBusy = false;
    try {
        if (process.platform === 'win32') {
            const out = execSync('netstat -ano 2>nul', { encoding: 'utf8' });
            portBusy = out.split(/\r?\n/).some((line) => new RegExp(':' + PORT + '\\s+.*LISTENING').test(line));
        } else {
            const out = execSync('(ss -ltn 2>/dev/null || netstat -ltn 2>/dev/null)', { encoding: 'utf8' });
            portBusy = out.split(/\r?\n/).some((line) => new RegExp(':' + PORT + '\\b').test(line));
        }
    } catch (_) {}
    if (portBusy) console.log('[WARN] Port ' + PORT + ' is already in use (another server may be running).');
    else console.log('[ OK ] Port ' + PORT + ' is free.');

    // ---- 4) Launch detached
    console.log('[4/4] Launching server (node server.js) ...');
    ensureLogDir();

    // Clean up stale PID so the wait loop actually detects the new one.
    try { if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE); } catch (_) {}

    const out = fs.openSync(LOG_FILE, 'a');
    let child;
    if (process.platform === 'win32') {
        // On Windows, `spawn` with `detached: true` + `unref()` is the only
        // reliable way to detach from the parent console.
        child = spawn('node', [path.join(PROJECT_DIR, 'server.js')], {
            cwd: PROJECT_DIR, detached: true, stdio: ['ignore', out, out], windowsHide: true
        });
    } else {
        child = spawn('node', [path.join(PROJECT_DIR, 'server.js')], {
            cwd: PROJECT_DIR, detached: true, stdio: ['ignore', out, out]
        });
    }
    child.unref();
    const launchedPid = child.pid;
    console.log('        Detached node process started (pid ' + launchedPid + ').');
    console.log('        Log file : logs' + path.sep + 'app_output.log');
    console.log('        Waiting up to ' + WAIT + 's for server to report its PID ...');

    const pid = await waitForPidFile(WAIT);

    console.log();
    if (pid) {
        console.log('================================================');
        console.log('  Server started successfully.');
        console.log('  PID     : ' + pid);
        console.log('  URL     : http://localhost:' + PORT);
        console.log('  Docs    : http://localhost:' + PORT + '/api-docs');
        console.log('  Health  : http://localhost:' + PORT + '/health');
        console.log('  Config  : http://localhost:' + PORT + '/config');
        console.log('================================================');
        console.log();
        console.log('To stop the server, run:  node stop.js  (or  stop-server.bat / stop-server.sh)');
        process.exit(0);
    } else {
        console.log('[ERROR] Server did not report a PID within ' + WAIT + ' seconds.');
        console.log('        Check logs' + path.sep + 'app_output.log for startup errors.');
        console.log('        Trying to clean up the launched process (pid ' + launchedPid + ') ...');
        try { if (process.platform === 'win32') execSync('taskkill /F /PID ' + launchedPid, { stdio: 'ignore' }); else process.kill(launchedPid, 'SIGKILL'); } catch (_) {}
        process.exit(1);
    }
}

main().catch((err) => {
    console.log('[FATAL] ' + err.message);
    process.exit(1);
});
