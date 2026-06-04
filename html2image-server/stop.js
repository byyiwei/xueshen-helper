/**
 * html2image-server - Cross-platform stop script.
 *
 * Terminates the server by reading its PID from .app.pid and using
 * the appropriate platform command (taskkill on Windows, kill on *nix).
 * Also performs a process-name scan (node.exe + "server.js") as a
 * fallback so orphaned processes are cleaned up even without a PID file.
 *
 * Usage:
 *   node stop.js              # normal stop (read .app.pid + scan)
 *   node stop.js --pid 12345  # override: kill a specific PID
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_DIR = __dirname;
const PID_FILE = path.join(PROJECT_DIR, '.app.pid');
const PORT_FILE_OVERRIDE = null; // port comes from config.json

function readPort() {
    try {
        const raw = execSync('node config-read.js server.port', { cwd: PROJECT_DIR, encoding: 'utf8' }).trim();
        const n = parseInt(raw, 10);
        return Number.isFinite(n) ? n : 3000;
    } catch (_) { return 3000; }
}

function killByPid(pid, force) {
    if (!pid) return false;
    const p = Number(pid);
    if (!Number.isFinite(p) || p <= 0) return false;
    try {
        if (process.platform === 'win32') {
            execSync(`taskkill /F /PID ${p}`, { stdio: 'ignore' });
        } else {
            process.kill(p, force ? 'SIGKILL' : 'SIGTERM');
        }
        return true;
    } catch (_) { return false; }
}

function isAlive(pid) {
    const p = Number(pid);
    if (!Number.isFinite(p) || p <= 0) return false;
    try {
        if (process.platform === 'win32') {
            const out = execSync(`tasklist /FI "PID eq ${p}" /NH`, { encoding: 'utf8' });
            return /node\.exe/i.test(out);
        }
        process.kill(p, 0); // signal 0 = existence probe
        return true;
    } catch (_) { return false; }
}

function scanAndKillByCommandLine() {
    const killed = [];
    try {
        if (process.platform === 'win32') {
            // wmic outputs pairs like "CommandLine=...\nProcessId=12345"
            const out = execSync('wmic process where "name=\'node.exe\'" get ProcessId,CommandLine /FORMAT:list 2>nul', { encoding: 'utf8' });
            const blocks = out.split(/\r?\n\s*\r?\n/); // split by blank lines = one process per block
            for (const block of blocks) {
                let pid = null; let cmd = null;
                for (const line of block.split(/\r?\n/)) {
                    const m = line.match(/^(CommandLine|ProcessId)\s*=\s*(.*)$/);
                    if (!m) continue;
                    if (m[1] === 'CommandLine') cmd = m[2];
                    if (m[1] === 'ProcessId') pid = m[2];
                }
                if (pid && cmd && /server\.js/i.test(cmd)) {
                    if (killByPid(pid.trim(), true)) killed.push(pid.trim());
                }
            }
        } else {
            // Linux / macOS: `pgrep -f "node.*server.js"` -> newline separated PIDs
            const pids = execSync('pgrep -f "node.*server\\.js" 2>/dev/null || true', { encoding: 'utf8' }).trim();
            if (pids) {
                for (const p of pids.split(/\s+/)) {
                    if (killByPid(p, true)) killed.push(p);
                }
            }
        }
    } catch (e) { /* ignore scan errors */ }
    return killed;
}

function scanAndKillByPort(port) {
    if (!port) return [];
    const killed = [];
    try {
        if (process.platform === 'win32') {
            const out = execSync('netstat -ano 2>nul', { encoding: 'utf8' });
            for (const line of out.split(/\r?\n/)) {
                if (!new RegExp(':' + port + '\\s').test(line)) continue;
                const parts = line.trim().split(/\s+/);
                const last = parts[parts.length - 1];
                if (/^\d+$/.test(last) && Number(last) > 0) {
                    if (killByPid(last, true)) killed.push(last);
                }
            }
        } else if (process.platform === 'darwin') {
            const out = execSync(`lsof -t -i:${port} 2>/dev/null || true`, { encoding: 'utf8' }).trim();
            for (const p of out.split(/\s+/)) if (p && killByPid(p, true)) killed.push(p);
        } else {
            const out = execSync(`ss -ltnp 2>/dev/null || netstat -ltnp 2>/dev/null`, { encoding: 'utf8' });
            const pidRe = new RegExp(':' + port + '\\b.*?(?:pid=|,)(\\d+)');
            for (const line of out.split(/\r?\n/)) {
                const m = line.match(/:(\d+)\b.*?pid[=:](\d+)/) || line.match(/:(\d+)\b.*?(\d+)\/node/);
                if (m && m[1] === String(port) && /^\d+$/.test(m[2])) {
                    if (killByPid(m[2], true)) killed.push(m[2]);
                }
            }
        }
    } catch (e) { /* ignore */ }
    return killed;
}

async function main() {
    const args = process.argv.slice(2);
    const hasForceFlag = args.includes('--force');

    // --pid <number> override
    let explicitPid = null;
    const pidIdx = args.indexOf('--pid');
    if (pidIdx !== -1 && args[pidIdx + 1]) {
        const n = parseInt(args[pidIdx + 1], 10);
        if (Number.isFinite(n)) explicitPid = n;
    }

    const port = readPort();

    console.log('================================================');
    console.log('  html2image-server - Stop');
    console.log('  PID file : .app.pid (project folder)');
    console.log('  Port     : ' + port);
    console.log('================================================');
    console.log();

    // ---- 1) Stop by explicit --pid or PID file
    console.log('[1/3] Stopping via PID file ...');
    if (explicitPid) {
        console.log('        Using --pid ' + explicitPid + ' from command line ...');
        if (killByPid(explicitPid, true)) console.log('        PID ' + explicitPid + ' terminated.');
        else console.log('        PID ' + explicitPid + ' not running.');
        if (fs.existsSync(PID_FILE)) {
            const filePid = parseInt(fs.readFileSync(PID_FILE, 'utf8').trim(), 10);
            if (filePid !== explicitPid) console.log('        (Note: .app.pid contained ' + filePid + ', cleaning up.)');
            fs.unlinkSync(PID_FILE);
        }
    } else if (fs.existsSync(PID_FILE)) {
        const pid = parseInt(fs.readFileSync(PID_FILE, 'utf8').trim(), 10);
        if (Number.isFinite(pid) && pid > 0) {
            console.log('        Found PID ' + pid + ' in .app.pid ...');
            if (isAlive(pid)) {
                if (killByPid(pid, hasForceFlag)) console.log('        PID ' + pid + ' terminated.');
                else console.log('        Failed to kill PID ' + pid + '.');
            } else {
                console.log('        PID ' + pid + ' not running (stale file).');
            }
        }
        try { fs.unlinkSync(PID_FILE); } catch (_) { /* noop */ }
    } else {
        console.log('        No .app.pid found - skipping.');
    }

    // ---- 2) Scan by command line (node.exe ... server.js)
    console.log('[2/3] Scanning for "node server.js" processes ...');
    const scanned = scanAndKillByCommandLine();
    if (scanned.length) console.log('        Killed: ' + scanned.join(', '));
    else console.log('        None found.');

    // ---- 3) Port sweep (safety net)
    console.log('[3/3] Port ' + port + ' sweep (safety net) ...');
    const portKilled = scanAndKillByPort(port);
    if (portKilled.length) console.log('        Killed PID(s) holding port ' + port + ': ' + portKilled.join(', '));
    else console.log('        Port ' + port + ' is free.');

    console.log();
    console.log('================================================');
    console.log('  Stop sequence completed.');
    console.log('  Logs available in logs/ directory.');
    console.log('================================================');
    process.exit(0);
}

main().catch((err) => {
    console.error('[FATAL]', err.message);
    process.exit(1);
});
