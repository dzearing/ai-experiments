const fs = require('fs');
const PATHS = require('./paths');

// Use centralized log file paths
const LOG_FILES = PATHS.logs;

// Initialize log files on server start
function initializeLogs() {
  const timestamp = new Date().toISOString();
  
  try {
    fs.writeFileSync(LOG_FILES.client, `=== Client Messages Log Started at ${timestamp} ===\n\n`);
    fs.writeFileSync(LOG_FILES.claude, `=== Claude Messages Log Started at ${timestamp} ===\n\n`);
    fs.writeFileSync(LOG_FILES.events, `=== Events Log Started at ${timestamp} ===\n\n`);
    fs.writeFileSync(LOG_FILES.debug, `=== Debug Log Started at ${timestamp} ===\n\n`);
    fs.writeFileSync(LOG_FILES.errors, `=== Errors Log Started at ${timestamp} ===\n\n`);
    fs.writeFileSync(LOG_FILES.toolExecutions, `=== Tool Executions Log Started at ${timestamp} ===\n\n`);
    console.log('Log files initialized in:', PATHS.logsDir);
  } catch (err) {
    console.error('Failed to initialize log files:', err);
  }
}

// Generic log writer
function writeLog(logFile, ...args) {
  const timestamp = new Date().toISOString();
  const message = `[${timestamp}] ${args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
  ).join(' ')}\n`;
  
  try {
    fs.appendFileSync(logFile, message);
  } catch (err) {
    console.error(`Failed to write to ${logFile}:`, err);
  }
}

// Log client requests and responses
function logClient(action, data) {
  writeLog(LOG_FILES.client, `[${action}]`, data);
  
  // Also log high-level event
  if (action === 'REQUEST') {
    logEvent('CLIENT_REQUEST', `${data.method} ${data.url}`, { sessionId: data.sessionId });
  } else if (action === 'RESPONSE') {
    logEvent('CLIENT_RESPONSE', `Status: ${data.status}`, { sessionId: data.sessionId });
  }
}

// Log Claude interactions
function logClaude(action, data) {
  writeLog(LOG_FILES.claude, `[${action}]`, data);
  
  // Also log high-level event
  if (action === 'REQUEST') {
    logEvent('CLAUDE_REQUEST', data.mode || 'default', { 
      sessionId: data.sessionId,
      messageId: data.messageId,
      tools: data.tools?.length || 0
    });
  } else if (action === 'RESPONSE') {
    logEvent('CLAUDE_RESPONSE', data.success ? 'Success' : 'Error', {
      sessionId: data.sessionId,
      messageId: data.messageId,
      hasText: !!data.text,
      toolExecutions: data.toolExecutions || 0,
      error: data.error
    });
  }
}

// Log tool executions
function logToolExecution(action, data) {
  const timestamp = new Date().toISOString();
  const {
    sessionId,
    messageId,
    toolId,
    toolName,
    status,
    executionTime,
    args,
    result,
    error
  } = data;
  
  // Format the log entry
  const logEntry = {
    timestamp,
    action,
    sessionId,
    messageId,
    toolId,
    toolName,
    status,
    executionTime,
    ...(args && { args }),
    ...(result && { result: typeof result === 'string' && result.length > 200 ? result.substring(0, 200) + '...' : result }),
    ...(error && { error })
  };
  
  writeLog(LOG_FILES.toolExecutions, `[${action}]`, logEntry);
  
  // Also log high-level event
  if (action === 'START') {
    logEvent('TOOL_START', `${toolName} (${toolId})`, { sessionId, messageId, status });
  } else if (action === 'END') {
    logEvent('TOOL_END', `${toolName} (${toolId})`, { 
      sessionId, 
      messageId, 
      status, 
      executionTime: executionTime ? `${executionTime}ms` : 'unknown' 
    });
  }
}

// Log high-level system events
function logEvent(eventType, description, metadata = {}) {
  const timestamp = new Date().toISOString();
  const metaStr = Object.keys(metadata).length > 0 
    ? ` | ${Object.entries(metadata).map(([k, v]) => `${k}:${v}`).join(' ')}` 
    : '';
  
  const message = `[${timestamp}] ${eventType.padEnd(20)} | ${description}${metaStr}\n`;
  
  try {
    fs.appendFileSync(LOG_FILES.events, message);
  } catch (err) {
    console.error('Failed to write to events.log:', err);
  }
}

// Debug logger function that replaces console.log
function debug(...args) {
  writeLog(LOG_FILES.debug, ...args);
}

// Error logger function that replaces console.error
function error(...args) {
  // Write to both errors log and console for critical visibility
  writeLog(LOG_FILES.errors, ...args);
  console.error(...args);
}

// Info logger function for general information
function info(...args) {
  writeLog(LOG_FILES.debug, ...args);
  console.log(...args);
}

// Export functions
module.exports = {
  initializeLogs,
  logClient,
  logClaude,
  logToolExecution,
  logEvent,
  debug,
  error,
  info,
  // Direct log writers for custom usage
  writeClientLog: (...args) => writeLog(LOG_FILES.client, ...args),
  writeClaudeLog: (...args) => writeLog(LOG_FILES.claude, ...args),
  writeEventLog: (...args) => writeLog(LOG_FILES.events, ...args),
  writeDebugLog: (...args) => writeLog(LOG_FILES.debug, ...args),
  writeErrorLog: (...args) => writeLog(LOG_FILES.errors, ...args),
  writeToolExecutionLog: (...args) => writeLog(LOG_FILES.toolExecutions, ...args)
};