/**
 * Client-side logging utility for debugging
 * Sends structured logs to the server for persistent storage
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'user';

interface LogData {
  [key: string]: unknown;
}

class ClientLogger {
  private sessionId: string;
  private sequenceNumber: number = 0;
  private buffer: Array<{
    timestamp: string;
    performanceTime: number;
    sequence: number;
    level: LogLevel;
    component: string;
    message: string;
    data?: LogData;
  }> = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private isEnabled: boolean = true;

  constructor() {
    // Generate a unique session ID for this browser session
    this.sessionId = this.getOrCreateSessionId();

    // Check if logging is enabled (can be disabled via localStorage)
    this.isEnabled = localStorage.getItem('clientLogging') !== 'false';

    // Flush logs before page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.flush());
    }
  }

  private getOrCreateSessionId(): string {
    let sessionId = sessionStorage.getItem('logSessionId');
    if (!sessionId) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem('logSessionId', sessionId);
    }
    return sessionId;
  }

  private async sendLog(
    level: LogLevel,
    component: string,
    message: string,
    data?: LogData
  ): Promise<void> {
    if (!this.isEnabled) return;

    // Use high-precision performance timer and sequence number
    const performanceTime = performance.now();
    const sequence = ++this.sequenceNumber;

    const logEntry = {
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      performanceTime,
      sequence,
      level,
      component,
      message,
      data: data || {}
    };

    // Add to buffer
    this.buffer.push(logEntry);

    // Auto-flush after a delay to batch logs
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
    }
    this.flushTimer = setTimeout(() => this.flush(), 1000);

    // Immediate flush for errors
    if (level === 'error') {
      await this.flush();
    }
  }

  private async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    // Sort buffer by sequence number to ensure order
    const logsToSend = [...this.buffer].sort((a, b) => a.sequence - b.sequence);
    this.buffer = [];

    try {
      // Send logs in batch to maintain order
      await fetch('http://localhost:3000/api/client-logs-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: this.sessionId,
          logs: logsToSend
        }),
      }).catch(err => {
        console.error('Failed to send logs:', err);
        // Fall back to individual sends if batch fails
        return Promise.all(
          logsToSend.map(log =>
            fetch('http://localhost:3000/api/client-log', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(log),
            }).catch(err => {
              console.error('Failed to send log:', err);
            })
          )
        );
      });
    } catch (error) {
      console.error('Failed to flush logs:', error);
    }
  }

  // Public logging methods
  debug(component: string, message: string, data?: LogData): void {
    this.sendLog('debug', component, message, data);
    console.log(`[${component}] ${message}`, data || '');
  }

  info(component: string, message: string, data?: LogData): void {
    this.sendLog('info', component, message, data);
    console.info(`[${component}] ${message}`, data || '');
  }

  warn(component: string, message: string, data?: LogData): void {
    this.sendLog('warn', component, message, data);
    console.warn(`[${component}] ${message}`, data || '');
  }

  error(component: string, message: string, data?: LogData): void {
    this.sendLog('error', component, message, data);
    console.error(`[${component}] ${message}`, data || '');
  }

  // User action logging
  user(component: string, message: string, data?: LogData): void {
    this.sendLog('user', component, message, data);
    console.log(`[USER ACTION] [${component}] ${message}`, data || '');
  }

  // Method to log function entry with arguments
  functionEntry(component: string, functionName: string, args?: LogData): void {
    this.debug(component, `→ ${functionName}`, args);
  }

  // Method to log function exit with return value
  functionExit(component: string, functionName: string, returnValue?: unknown): void {
    this.debug(component, `← ${functionName}`, { returnValue });
  }

  // Method to log state changes
  stateChange(component: string, stateName: string, oldValue: unknown, newValue: unknown): void {
    this.info(component, `State change: ${stateName}`, {
      oldValue,
      newValue,
      diff: this.getDiff(oldValue, newValue)
    });
  }

  // User interaction helpers
  userClick(component: string, element: string, data?: LogData): void {
    this.user(component, `Clicked: ${element}`, data);
  }

  userInput(component: string, field: string, value: string | number | boolean, data?: LogData): void {
    this.user(component, `Input: ${field}`, { value, ...data });
  }

  userNavigate(component: string, to: string, from?: string): void {
    this.user(component, `Navigate to: ${to}`, { from, to });
  }

  userSubmit(component: string, form: string, data?: LogData): void {
    this.user(component, `Submit: ${form}`, data);
  }

  userSelect(component: string, option: string, data?: LogData): void {
    this.user(component, `Selected: ${option}`, data);
  }

  // Helper to get simple diff
  private getDiff(oldValue: unknown, newValue: unknown): string {
    if (typeof oldValue === 'object' && typeof newValue === 'object') {
      const oldKeys = Object.keys(oldValue as object);
      const newKeys = Object.keys(newValue as object);
      const addedKeys = newKeys.filter(k => !oldKeys.includes(k));
      const removedKeys = oldKeys.filter(k => !newKeys.includes(k));
      const changedKeys = oldKeys.filter(k => {
        const oldV = (oldValue as any)[k];
        const newV = (newValue as any)[k];
        return JSON.stringify(oldV) !== JSON.stringify(newV);
      });
      return `Added: [${addedKeys.join(', ')}], Removed: [${removedKeys.join(', ')}], Changed: [${changedKeys.join(', ')}]`;
    }
    return `${oldValue} → ${newValue}`;
  }

  // Get the current session ID
  getSessionId(): string {
    return this.sessionId;
  }

  // Enable/disable logging
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    localStorage.setItem('clientLogging', enabled ? 'true' : 'false');
  }
}

// Create singleton instance
export const clientLogger = new ClientLogger();