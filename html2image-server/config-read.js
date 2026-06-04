/**
 * Lightweight config reader — used by start-server.bat / .sh etc.
 * to resolve configuration values before launching the server.
 *
 * Usage:
 *   node config-read.js server.port
 *   node config-read.js logging.logDir
 *   node config-read.js process.pidFile
 *
 * Output: the resolved value on stdout. Falls back to the same
 * defaults used by server.js (via config.js).
 */

const config = require('./config');

function getByPath(obj, path) {
  const parts = String(path).split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur === null || cur === undefined) return '';
    cur = cur[p];
  }
  return cur === undefined || cur === null ? '' : String(cur);
}

// Merge a flat default map for keys config.js doesn't cover
const key = process.argv[2];
if (!key) {
  console.error('Usage: node config-read.js <path.to.key>');
  process.exit(1);
}

console.log(getByPath(config, key));
