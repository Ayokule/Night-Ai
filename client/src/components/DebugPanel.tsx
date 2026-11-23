"use client"

import { useState, useEffect, useCallback } from "react"
import { X, Download, Trash2, Filter, ChevronDown } from "lucide-react"
import { frontendDebugger, type DebugLog } from "@/lib/debugger"

const LEVEL_COLORS: Record<DebugLog['level'], string> = {
  debug: 'text-blue-400',
  info: 'text-green-400',
  warn: 'text-yellow-400',
  error: 'text-red-400',
}

const LEVEL_BG: Record<DebugLog['level'], string> = {
  debug: 'bg-blue-900/20',
  info: 'bg-green-900/20',
  warn: 'bg-yellow-900/20',
  error: 'bg-red-900/20',
}

const CATEGORIES = ['ALL', 'API', 'CHAT', 'SIDEBAR', 'STATE', 'ERROR'] as const
type Category = typeof CATEGORIES[number]

export function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [logs, setLogs] = useState<DebugLog[]>([])
  const [filterLevel, setFilterLevel] = useState<DebugLog['level'] | 'ALL'>('ALL')
  const [filterCategory, setFilterCategory] = useState<Category>('ALL')
  const [searchTerm, setSearchTerm] = useState('')

  // Subscribe to debugger updates
  useEffect(() => {
    const unsubscribe = frontendDebugger.subscribe(setLogs)
    setLogs(frontendDebugger.getLogs())
    return unsubscribe
  }, [])

  const filteredLogs = logs.filter(log => {
    if (filterLevel !== 'ALL' && log.level !== filterLevel) return false
    if (filterCategory !== 'ALL' && log.category !== filterCategory) return false
    if (searchTerm && !log.message.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !JSON.stringify(log.data).toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

  const handleExport = useCallback(() => {
    const blob = new Blob([frontendDebugger.export()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `debug-logs-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  const handleClear = useCallback(() => {
    frontendDebugger.clear()
  }, [])

  const errorCount = logs.filter(l => l.level === 'error').length
  const warnCount = logs.filter(l => l.level === 'warn').length

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-4 right-4 z-50 rounded-xl px-3 py-2 text-xs font-medium shadow-lg transition-all ${
          isOpen
            ? 'bg-red-600 text-white'
            : 'bg-card border border-border text-foreground'
        }`}
        aria-label={isOpen ? 'Close debug panel' : 'Open debug panel'}
      >
        <Filter className="h-4 w-4 inline mr-1" />
        Debug
        {(errorCount > 0 || warnCount > 0) && (
          <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] bg-red-500 text-white">
            {errorCount + warnCount}
          </span>
        )}
      </button>

      {/* Debug Panel */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 z-50 w-full max-w-4xl max-h-[70vh] lg:max-w-5xl">
          <div className="bg-card border border-border rounded-xl shadow-xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-border bg-muted/50">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-sm">Frontend Debugger</h3>
                <span className="px-2 py-0.5 text-xs rounded bg-muted text-muted-foreground">
                  {logs.length} logs
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExport}
                  className="p-1.5 hover:bg-muted rounded transition-colors"
                  title="Export logs"
                >
                  <Download className="h-4 w-4" />
                </button>
                <button
                  onClick={handleClear}
                  className="p-1.5 hover:bg-muted rounded transition-colors"
                  title="Clear logs"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-muted rounded transition-colors"
                  title="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="p-3 border-b border-border bg-muted/30 flex flex-wrap gap-2">
              <div className="flex-1 min-w-[200px] relative">
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value as DebugLog['level'] | 'ALL')}
                className="px-3 py-1.5 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="ALL">All Levels</option>
                <option value="error">Errors</option>
                <option value="warn">Warnings</option>
                <option value="info">Info</option>
                <option value="debug">Debug</option>
              </select>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value as Category)}
                className="px-3 py-1.5 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            {/* Log List */}
            <div className="flex-1 overflow-y-auto p-3 max-h-[50vh]">
              {filteredLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Filter className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">No logs match current filters</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredLogs.map((log, index) => (
                    <LogEntry key={index} log={log} />
                  ))}
                </div>
              )}
            </div>

            {/* Summary Footer */}
            <div className="p-2 border-t border-border bg-muted/30 text-xs text-muted-foreground flex items-center justify-between">
              <span>
                Showing {filteredLogs.length} of {logs.length} logs
              </span>
              <div className="flex items-center gap-4">
                <span className="text-red-400">⬤ {errorCount} errors</span>
                <span className="text-yellow-400">⬤ {warnCount} warnings</span>
                <span className="text-green-400">⬤ {logs.filter(l => l.level === 'info').length} info</span>
                <span className="text-blue-400">⬤ {logs.filter(l => l.level === 'debug').length} debug</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function LogEntry({ log }: { log: DebugLog }) {
  const [expanded, setExpanded] = useState(false)
  const time = new Date(log.timestamp).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
  })

  return (
    <div className={`${LEVEL_BG[log.level]} border border-border/50 rounded-lg overflow-hidden`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-muted/50 transition-colors"
      >
        <span className={`font-mono text-xs ${LEVEL_COLORS[log.level]}`}>
          {log.level.toUpperCase()}
        </span>
        <span className="font-mono text-xs text-muted-foreground">{time}</span>
        <span className="px-1.5 py-0.5 text-[10px] bg-muted rounded text-muted-foreground font-medium">
          {log.category}
        </span>
        <span className="flex-1 text-sm text-foreground truncate">{log.message}</span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>
      {expanded && log.data != null && (
        <div className="px-3 pb-3 border-t border-border/50 bg-muted/30">
          <pre className="font-mono text-[11px] text-foreground overflow-x-auto max-h-40 overflow-y-auto">
            {(() => JSON.stringify(log.data, null, 2))()}
          </pre>
        </div>
      )}
    </div>
  )
}