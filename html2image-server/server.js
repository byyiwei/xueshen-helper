/**
 * HTML-to-Image Server
 * Converts HTML content to PNG/JPEG/WebP images using Puppeteer + headless Chromium.
 *
 * Configuration is read from ./config.json and can be overridden by
 * environment variables with the H2I_ prefix. See config.js for details.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const config = require('./config');
const { logger, logRequest, logRequestStart, logRequestEnd } = require('./logger');

const API_DOCS_PATH = path.join(__dirname, 'api-docs.html');
const PID_FILE = config.process.pidFile;
const PORT = config.server.port;
const HOST = config.server.host;

// ── Browser pool ────────────────────────────────────────────────────────────────
let browser = null;
let browserLaunching = null;

// Look for a system Chrome/Chromium binary as a fallback if config.browser.executablePath is empty.
function findSystemChrome() {
  if (config.browser.executablePath && fs.existsSync(config.browser.executablePath)) {
    return config.browser.executablePath;
  }
  // 1. puppeteer's own bundled chromium
  try {
    // @puppeteer/browsers / legacy puppeteer.executablePath support
    if (typeof puppeteer.executablePath === 'function') {
      const exe = puppeteer.executablePath();
      if (exe && fs.existsSync(exe)) return exe;
    }
  } catch (_) { /* ignore */ }

  // 2. common system locations
  const candidates = [
    // Windows
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Google/Chrome/Application/chrome.exe').replace(/\\/g, '/') : null,
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    // macOS
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    // Linux
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/snap/bin/chromium',
  ].filter(Boolean);

  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return p;
    } catch (_) { /* ignore */ }
  }
  return null;
}

async function getBrowser() {
  if (browser) return browser;
  if (browserLaunching) return browserLaunching;

  const exe = findSystemChrome();
  logger.info('[Browser] Resolved executable: ' + (exe || '(none — will try puppeteer default)'));

  const launchOpts = {
    headless: config.browser.headless === 'new' || config.browser.headless === true
      ? (typeof config.browser.headless === 'boolean' ? 'new' : config.browser.headless)
      : 'new',
    args: Array.isArray(config.browser.args) ? config.browser.args : [],
    protocolTimeout: config.browser.protocolTimeoutMs,
  };
  if (exe) launchOpts.executablePath = exe;

  const LAUNCH_TIMEOUT = config.browser.launchTimeoutMs;
  browserLaunching = Promise.race([
    puppeteer.launch(launchOpts),
    new Promise((_, rej) =>
      setTimeout(() => rej(new Error('Browser launch timeout (' + LAUNCH_TIMEOUT + 'ms)')),
        LAUNCH_TIMEOUT)
    ),
  ]).then((b) => {
    browser = b;
    logger.info('[Browser] Launched (pid=' + (b.process() ? b.process().pid : 'unknown') + ')');
    b.on('disconnected', () => {
      logger.warn('[Browser] disconnected. Will re-launch on next request.');
      browser = null;
      browserLaunching = null;
    });
    return b;
  }).catch((err) => {
    logger.error('[Browser] Launch failed: ' + err.message);
    browser = null;
    browserLaunching = null;
    throw err;
  });

  return browserLaunching;
}

async function closeBrowser() {
  if (browser) {
    try { await browser.close(); } catch (_) { /* ignore */ }
    browser = null;
    browserLaunching = null;
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────────
function readBody(req, limitBytes) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > limitBytes) {
        reject(new Error('Request body too large (max ' + Math.round(limitBytes / 1024 / 1024) + ' MB)'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function sendJSON(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body, 'utf8'),
  });
  res.end(body);
}

function sendHTML(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      sendJSON(res, 404, { success: false, error: 'Documentation not found' });
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(data);
  });
}

// ── Image generation ───────────────────────────────────────────────────────────
const VP = config.rendering.defaultViewport;

async function generateImage(html, opts = {}) {
  if (!html || typeof html !== 'string') {
    throw new Error('Field "html" must be a non-empty string');
  }
  const b = await getBrowser();
  const page = await b.newPage();
  try {
    const width = Math.max(100, Math.min(10000, parseInt(opts.width, 10) || VP.width));
    const height = Math.max(100, Math.min(10000, parseInt(opts.height, 10) || VP.height));
    const deviceScaleFactor = Math.max(1, Math.min(5, parseFloat(opts.deviceScaleFactor) || VP.deviceScaleFactor));
    await page.setViewport({ width, height, deviceScaleFactor });

    const loadTimeout = Math.max(5000, parseInt(opts.loadTimeout, 10) || config.rendering.loadTimeoutMs);
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: loadTimeout });

    if (opts.waitFor && parseInt(opts.waitFor, 10) > 0) {
      await page.waitForTimeout(Math.min(parseInt(opts.waitFor, 10), 30000));
    }

    const format = ['png', 'jpeg', 'webp'].includes(String(opts.format).toLowerCase())
      ? String(opts.format).toLowerCase()
      : config.rendering.defaultFormat;

    const screenshotOpts = {
      type: format,
      encoding: 'base64',
      fullPage: opts.fullPage !== undefined ? Boolean(opts.fullPage) : config.rendering.fullPageByDefault,
    };
    if (format !== 'png') {
      screenshotOpts.quality = Math.max(1, Math.min(100, parseInt(opts.quality, 10) || config.rendering.defaultQuality));
    }
    if (opts.clip && typeof opts.clip === 'object') {
      const { x = 0, y = 0, width: cw, height: ch } = opts.clip;
      if (cw && ch) {
        screenshotOpts.clip = {
          x: parseInt(x, 10) || 0,
          y: parseInt(y, 10) || 0,
          width: parseInt(cw, 10),
          height: parseInt(ch, 10),
        };
      }
    }

    const base64 = await page.screenshot(screenshotOpts);
    return { image: base64, format };
  } finally {
    try { await page.close(); } catch (_) { /* noop */ }
  }
}

// ── Route handler ───────────────────────────────────────────────────────────────
async function handleRequest(req, res) {
  const reqId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const start = Date.now();
  logRequestStart(reqId);

  const url = new URL(req.url, 'http://' + (req.headers.host || 'localhost'));
  const method = req.method.toUpperCase();

  try {
    // GET /health
    if (method === 'GET' && url.pathname === '/health') {
      const alive = Boolean(browser && browser.process() && browser.process().connected);
      sendJSON(res, 200, {
        success: true,
        status: 'ok',
        browser: alive ? 'running' : 'idle',
        uptime: Math.floor(process.uptime()) + 's',
        config: { port: config.server.port, host: config.server.host },
      });
      logRequest(method, '/health', 200, Date.now() - start);
      logRequestEnd(reqId, Date.now() - start, true);
      return;
    }

    // GET /api-docs
    if (method === 'GET' && url.pathname === '/api-docs') {
      sendHTML(res, API_DOCS_PATH);
      logRequest(method, '/api-docs', 200, Date.now() - start);
      logRequestEnd(reqId, Date.now() - start, true);
      return;
    }

    // GET /config (readonly summary — useful for debugging)
    if (method === 'GET' && url.pathname === '/config') {
      sendJSON(res, 200, {
        success: true,
        server: config.server,
        rendering: config.rendering,
        http: { maxRequestBodyBytes: config.http.maxRequestBodyBytes },
        browser: {
          headless: config.browser.headless,
          launchTimeoutMs: config.browser.launchTimeoutMs,
          protocolTimeoutMs: config.browser.protocolTimeoutMs,
          args: config.browser.args,
          executablePath: config.browser.executablePath || '(auto-detected)',
        },
      });
      logRequest(method, '/config', 200, Date.now() - start);
      logRequestEnd(reqId, Date.now() - start, true);
      return;
    }

    // GET /
    if (method === 'GET' && url.pathname === '/') {
      sendJSON(res, 200, {
        success: true,
        name: 'html2image-server',
        version: '1.0.0',
        docs: '/api-docs',
        health: '/health',
        config: '/config',
        usage: 'POST / with JSON body { html, options }',
      });
      logRequest(method, '/', 200, Date.now() - start);
      logRequestEnd(reqId, Date.now() - start, true);
      return;
    }

    // POST /
    if (method === 'POST' && url.pathname === '/') {
      let body;
      try {
        body = await readBody(req, config.http.maxRequestBodyBytes);
      } catch (e) {
        sendJSON(res, 413, { success: false, error: e.message });
        logRequest(method, '/', 413, Date.now() - start);
        logRequestEnd(reqId, Date.now() - start, false);
        return;
      }

      let payload;
      try {
        payload = JSON.parse(body || '{}');
      } catch (e) {
        sendJSON(res, 400, { success: false, error: 'Invalid JSON body' });
        logRequest(method, '/', 400, Date.now() - start);
        logRequestEnd(reqId, Date.now() - start, false);
        return;
      }

      try {
        const { image, format } = await generateImage(payload.html, payload.options || {});
        sendJSON(res, 200, {
          success: true,
          image,
          format,
          time: Date.now() - start,
        });
        logRequest(method, '/', 200, Date.now() - start);
        logRequestEnd(reqId, Date.now() - start, true);
      } catch (err) {
        logger.error('[Generate] ' + err.message);
        sendJSON(res, 500, {
          success: false,
          error: err.message || 'Image generation failed',
        });
        logRequest(method, '/', 500, Date.now() - start);
        logRequestEnd(reqId, Date.now() - start, false);
      }
      return;
    }

    sendJSON(res, 404, { success: false, error: 'Not found: ' + method + ' ' + url.pathname });
    logRequest(method, url.pathname, 404, Date.now() - start);
    logRequestEnd(reqId, Date.now() - start, false);
  } catch (err) {
    logger.error('[Server] Unhandled error: ' + (err && err.message ? err.message : String(err)));
    try {
      sendJSON(res, 500, { success: false, error: 'Internal server error' });
    } catch (_) { /* noop */ }
    logRequestEnd(reqId, Date.now() - start, false);
  }
}

// ── Startup ─────────────────────────────────────────────────────────────────────
const server = http.createServer(handleRequest);

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

function gracefulShutdown() {
  logger.info('[Server] Shutdown signal received — closing server + browser.');
  server.close(async () => {
    await closeBrowser();
    try { if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE); } catch (_) { /* noop */ }
    process.exit(0);
  });
  setTimeout(() => process.exit(0), 10000).unref();
}

try {
  fs.writeFileSync(PID_FILE, String(process.pid), 'utf8');
  logger.info('[Server] PID ' + process.pid + ' written to ' + PID_FILE);
} catch (e) {
  logger.warn('[Server] Could not write PID file: ' + e.message);
}

server.listen(PORT, HOST, () => {
  logger.info('================================================');
  logger.info('  HTML-to-Image Server is running');
  logger.info('  Host:     ' + HOST);
  logger.info('  Port:     ' + PORT);
  logger.info('  Docs:     http://localhost:' + PORT + '/api-docs');
  logger.info('  Health:   http://localhost:' + PORT + '/health');
  logger.info('  Config:   http://localhost:' + PORT + '/config');
  logger.info('================================================');
});
