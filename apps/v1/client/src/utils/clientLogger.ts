/**
 * Client-side logging utility for debugging
 * Sends structured logs to the server for persistent storage
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogData {
  [key: string]: unknown;
}

class ClientLogger {
  private sessionId: string;
  private buffer: Array<{
    timestamp: string;
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

    const logEntry = {
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
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

    const logsToSend = [...this.buffer];
    this.buffer = [];

    try {
      // Send all buffered logs
      await Promise.all(
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