type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface DebugLog {
  timestamp: string
  level: LogLevel
  category: string
  message: string
  data?: unknown
}

class FrontendDebugger {
  private logs: DebugLog[] = []
  private maxLogs = 500
  private isEnabled = true
  private listeners: ((logs: DebugLog[]) => void)[] = []

  enable() { this.isEnabled = true }
  disable() { this.isEnabled = false }

  subscribe(listener: (logs: DebugLog[]) => void) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  private notify() {
    this.listeners.forEach(l => l(this.logs))
  }

  private log(level: LogLevel, category: string, message: string, data?: unknown) {
    if (!this.isEnabled) return

    const entry: DebugLog = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data,
    }

    this.logs.unshift(entry)
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs)
    }

    // Also log to console
    const prefix = `[${category}]`
    switch (level) {
      case 'debug': console.debug(prefix, message, data ?? ''); break
      case 'info': console.info(prefix, message, data ?? ''); break
      case 'warn': console.warn(prefix, message, data ?? ''); break
      case 'error': console.error(prefix, message, data ?? ''); break
    }

    this.notify()
  }

  debug(category: string, message: string, data?: unknown) { this.log('debug', category, message, data) }
  info(category: string, message: string, data?: unknown) { this.log('info', category, message, data) }
  warn(category: string, message: string, data?: unknown) { this.log('warn', category, message, data) }
  error(category: string, message: string, data?: unknown) { this.log('error', category, message, data) }

  getLogs(): DebugLog[] { return [...this.logs] }
  clear() { this.logs = []; this.notify() }

  // Export logs as JSON
  export(): string {
    return JSON.stringify(this.logs, null, 2)
  }
}

// Singleton instance
export const frontendDebugger = new FrontendDebugger()

// Helper functions for common categories
export const logApi = (level: LogLevel, message: string, data?: unknown) =>
  frontendDebugger[level]('API', message, data)

export const logChat = (level: LogLevel, message: string, data?: unknown) =>
  frontendDebugger[level]('CHAT', message, data)

export const logSidebar = (level: LogLevel, message: string, data?: unknown) =>
  frontendDebugger[level]('SIDEBAR', message, data)

export const logState = (level: LogLevel, message: string, data?: unknown) =>
  frontendDebugger[level]('STATE', message, data)

export const logError = (category: string, message: string, error: unknown) =>
  frontendDebugger.error(category, message, { error: String(error), stack: error instanceof Error ? error.stack : undefined })