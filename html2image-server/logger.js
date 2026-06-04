/**
 * Simple Logger - Console Output
 * Avoid winston complexity and performance issues
 */

const fs = require('fs');
const path = require('path');

// Ensure log directory exists
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Log file path
const logFile = path.join(logDir, `server-${new Date().toISOString().split('T')[0]}.log`);

/**
 * Get current timestamp string
 */
function getTimestamp() {
  const now = new Date();
  return now.toLocaleString('en-US', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace(/\//g, '-');
}

/**
 * Write log to file
 */
function writeToFile(level, message) {
  const line = `[${getTimestamp()}] [${level}] ${message}\n`;
  try {
    fs.appendFileSync(logFile, line);
  } catch (e) {
    // Ignore file write errors
  }
}

/**
 * Console output (with colors)
 */
function log(level, message, color = '') {
  const timestamp = getTimestamp();
  const line = `[${timestamp}] [${level}] ${message}`;
  
  // Console output
  if (color) {
    console.log(color + line + '\x1b[0m');
  } else {
    console.log(line);
  }
  
  // File logging
  writeToFile(level, message);
}

const logger = {
  info: (msg) => log('INFO', msg, ''),
  warn: (msg) => log('WARN', msg, '\x1b[33m'),  // Yellow
  error: (msg) => log('ERROR', msg, '\x1b[31m'), // Red
  debug: (msg) => log('DEBUG', msg, '\x1b[36m'), // Cyan
};

function logRequest(method, url, statusCode, duration) {
  logger.info(`[HTTP] ${method} ${url} ${statusCode} (${duration}ms)`);
}

function logBrowser(event) {
  logger.info(`[Browser] ${event}`);
}

function logRequestStart(reqId) {
  logger.info(`[Request] ${reqId} started`);
}

function logRequestEnd(reqId, duration, success) {
  const status = success ? 'OK' : 'FAIL';
  logger.info(`[Request] ${reqId} ${status} (${duration}ms)`);
}

module.exports = {
  logger,
  logRequest,
  logBrowser,
  logRequestStart,
  logRequestEnd,
};
