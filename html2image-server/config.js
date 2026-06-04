/**
 * Config loader for html2image-server.
 *
 * Load order (highest priority first):
 *   1. Environment variables with H2I_ prefix
 *        - Nested keys separated by single underscore (_)
 *        - A literal underscore inside a key is written as double underscore (__)
 *        - Examples:
 *            H2I_SERVER_PORT=8080               → config.server.port = 8080
 *            H2I_BROWSER__EXECUTABLE_PATH=/usr/bin/chrome
 *                                              → config.browser.executablePath = '/usr/bin/chrome'
 *            H2I_HTTP__MAX_REQUEST_BODY_BYTES=5242880
 *            H2I_RENDERING__DEFAULT_VIEWPORT__WIDTH=1024
 *   2. config.json (in the project root)
 *   3. Hard-coded defaults below
 *
 * Usage:
 *   const config = require('./config');
 *   console.log(config.server.port, config.browser.launchTimeoutMs);
 */

const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, 'config.json');

// ── Defaults ──────────────────────────────────────────────────────────────────
const DEFAULTS = {
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
  process: {
    pidFile: '.app.pid',
  },
  logging: {
    logDir: 'logs',
    stdoutLog: 'app_output.log',
    startupLog: 'startup.log',
    stopLog: 'stop.log',
  },
  browser: {
    executablePath: '',
    headless: true,
    launchTimeoutMs: 45000,
    protocolTimeoutMs: 30000,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-software-rasterizer',
      '--disable-features=VizDisplayCompositor',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-default-apps',
      '--disable-popup-blocking',
      '--disable-background-networking',
      '--disable-extensions',
    ],
  },
  rendering: {
    defaultViewport: { width: 1280, height: 800, deviceScaleFactor: 2 },
    defaultFormat: 'png',
    defaultQuality: 90,
    loadTimeoutMs: 30000,
    defaultWaitForMs: 0,
    fullPageByDefault: false,
  },
  http: {
    maxRequestBodyBytes: 10 * 1024 * 1024,
    startupWaitSeconds: 15,
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function deepMerge(target, source) {
  if (!source || typeof source !== 'object') return target;
  const out = Array.isArray(target) ? target.slice() : Object.assign({}, target);
  for (const key of Object.keys(source)) {
    const val = source[key];
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      const existing = out[key] && typeof out[key] === 'object' && !Array.isArray(out[key]) ? out[key] : {};
      out[key] = deepMerge(existing, val);
    } else {
      out[key] = val;
    }
  }
  return out;
}

/**
 * Strip // line comments and /* block comments *\/ from a JSON-like string
 * before parsing. String literals ("...") are preserved so things like
 * "http://example.com" inside values won't be broken.
 */
function stripJsonComments(text) {
  if (!text) return text;
  let out = '';
  let inStr = false;
  let quote = '';
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    const next = i + 1 < text.length ? text[i + 1] : '';
    if (inStr) {
      out += ch;
      if (ch === '\\' && next) {
        // Keep the escaped char together so we don't mis-detect quote
        out += next;
        i += 2;
        continue;
      }
      if (ch === quote) inStr = false;
      i++;
      continue;
    }
    // Not in a string — watch for comments
    if (ch === '"' || ch === "'") {
      inStr = true;
      quote = ch;
      out += ch;
      i++;
      continue;
    }
    if (ch === '/' && next === '/') {
      // Line comment — skip until end of line
      i += 2;
      while (i < text.length && text[i] !== '\n') i++;
      continue;
    }
    if (ch === '/' && next === '*') {
      // Block comment — skip until closing marker
      i += 2;
      while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) i++;
      i += 2;
      continue;
    }
    out += ch;
    i++;
  }
  return out;
}

function readConfigFile() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
      const clean = stripJsonComments(raw);
      return JSON.parse(clean);
    }
  } catch (err) {
    process.emitWarning('[config] Failed to parse config.json: ' + err.message);
  }
  return {};
}

/**
 * Convert 'SERVER_PORT' → case-insensitive match into 'server.port' on a config object.
 * The tricky part: 'EXECUTABLE_PATH' must not be split into executable.path because
 * the key 'executablePath' contains an underscore-less camelCase — so we rely on
 * **existing keys in the config object** to match rather than blindly splitting.
 *
 * Algorithm: split on single underscore, collapse double-underscore segments into
 * literal underscores; then descend into the config by matching existing keys.
 */
function findCaseInsensitiveKey(obj, fragment) {
  if (!obj || typeof obj !== 'object') return null;
  const f = String(fragment).toLowerCase();
  const keys = Object.keys(obj);
  const match = keys.find((k) => k.toLowerCase() === f);
  if (match) return match;
  // Attempt camelCase match: "EXECUTABLE_PATH" → "executablePath"
  const camel = fragment
    .toLowerCase()
    .replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
  return keys.find((k) => k === camel) || keys.find((k) => k.toLowerCase() === camel) || null;
}

function setNested(obj, envKey, value) {
  // Step 1: turn "BROWSER__EXECUTABLE_PATH" → ["BROWSER", "EXECUTABLE_PATH"]
  // (double underscore = literal underscore in the key, not a path separator)
  // Simpler rule: split on "_", then merge adjacent empty segments with the next one.
  const parts = envKey.split('_');
  // Collapse pattern: [..., "BROWSER", "", "EXECUTABLE", "", "PATH"] → [..., "BROWSER", "EXECUTABLE_PATH"]
  // So every empty string means "join previous + next with an underscore".
  const segments = [];
  for (let i = 0; i < parts.length; i++) {
    if (parts[i] === '' && segments.length > 0) {
      // Merge the next non-empty into the previous segment with a literal underscore
      i++;
      if (i < parts.length) {
        segments[segments.length - 1] = segments[segments.length - 1] + '_' + parts[i];
      }
    } else {
      segments.push(parts[i]);
    }
  }

  // Step 2: walk the config, case-insensitive key match at each level
  let node = obj;
  for (let i = 0; i < segments.length - 1; i++) {
    const key = findCaseInsensitiveKey(node, segments[i]);
    if (key === null) {
      // Auto-create nested intermediate objects (e.g. custom keys).
      const newKey = segments[i]
        .toLowerCase()
        .replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
      node[newKey] = node[newKey] || {};
      node = node[newKey];
    } else {
      if (!node[key] || typeof node[key] !== 'object') {
        node[key] = {};
      }
      node = node[key];
    }
  }

  const lastSeg = segments[segments.length - 1];
  const leafKey = findCaseInsensitiveKey(node, lastSeg) ||
    lastSeg.toLowerCase().replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
  node[leafKey] = coerceValue(value);
}

function coerceValue(v) {
  if (v === '' || v === undefined || v === null) return v;
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (/^-?\d+$/.test(v)) return parseInt(v, 10);
  if (/^-?\d+\.\d+$/.test(v)) return parseFloat(v);
  return v;
}

function applyEnv(conf) {
  const PREFIX = 'H2I_';
  const out = deepMerge({}, conf);
  for (const key of Object.keys(process.env)) {
    if (!key.startsWith(PREFIX)) continue;
    const rest = key.slice(PREFIX.length);
    setNested(out, rest, process.env[key]);
  }
  return out;
}

// ── Final config ───────────────────────────────────────────────────────────────
let merged = deepMerge(DEFAULTS, readConfigFile());
merged = applyEnv(merged);

// Resolve path-like settings to absolute paths so they don't depend on CWD.
if (merged.logging && merged.logging.logDir) {
  merged.logging.logDir = path.resolve(__dirname, merged.logging.logDir);
}
if (merged.process && merged.process.pidFile) {
  merged.process.pidFile = path.resolve(__dirname, merged.process.pidFile);
}

Object.freeze(merged.server);
Object.freeze(merged.process);
Object.freeze(merged.logging);
Object.freeze(merged.browser);
Object.freeze(merged.rendering);
Object.freeze(merged.rendering.defaultViewport);
Object.freeze(merged.http);
Object.freeze(merged);

module.exports = merged;
module.exports.CONFIG_PATH = CONFIG_PATH;
