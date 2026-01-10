import { API_URL } from '../config';

interface LogEntry {
  level: 'log' | 'warn' | 'error';
  tag: string;
  message: string;
  data?: unknown;
  timestamp: number;
}

// Buffer to batch logs before sending
let logBuffer: LogEntry[] = [];
let flushTimeout: ReturnType<typeof setTimeout> | null = null;
const FLUSH_INTERVAL = 500; // ms
const MAX_BUFFER_SIZE = 50;

/**
 * Flush buffered logs to server
 */
async function flushLogs(): Promise<void> {
  if (logBuffer.length === 0) return;

  const logsToSend = logBuffer;
  logBuffer = [];

  try {
    await fetch(`${API_URL}/api/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logs: logsToSend }),
    });
  } catch {
    // Silently fail - don't want logging to break the app
  }
}

/**
 * Schedule a flush
 */
function scheduleFlush(): void {
  if (flushTimeout) return;

  flushTimeout = setTimeout(() => {
    flushTimeout = null;
    flushLogs();
  }, FLUSH_INTERVAL);
}

/**
 * Add a log entry
 */
function addLog(level: LogEntry['level'], tag: string, message: string, data?: unknown): void {
  const entry: LogEntry = {
    level,
    tag,
    message,
    data,
    timestamp: Date.now(),
  };

  logBuffer.push(entry);

  // Also log locally for immediate visibility
  const localMsg = `[${tag}] ${message}`;
  if (level === 'error') {
    console.error(localMsg, data ?? '');
  } else if (level === 'warn') {
    console.warn(localMsg, data ?? '');
  } else {
    console.log(localMsg, data ?? '');
  }

  // Flush immediately if buffer is full
  if (logBuffer.length >= MAX_BUFFER_SIZE) {
    flushLogs();
  } else {
    scheduleFlush();
  }
}

/**
 * Create a logger for a specific component/tag
 */
export function createLogger(tag: string) {
  return {
    log: (message: string, data?: unknown) => addLog('log', tag, message, data),
    warn: (message: string, data?: unknown) => addLog('warn', tag, message, data),
    error: (message: string, data?: unknown) => addLog('error', tag, message, data),
  };
}

// Flush on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (logBuffer.length > 0) {
      // Use sendBeacon for reliable delivery on unload
      const blob = new Blob([JSON.stringify({ logs: logBuffer })], { type: 'application/json' });
      navigator.sendBeacon(`${API_URL}/api/log`, blob);
    }
  });
}
