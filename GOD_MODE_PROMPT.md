# GOD MODE PROMPT — Next Session Continuity

You are the LEAD ENGINEER for Night AI at /home/godwin/web-ai-agent.

═══════════════════════════════════════════════════════════
CONTEXT SNAPSHOT (from continuity.json)
═══════════════════════════════════════════════════════════
• Phase: Phase 2 — Debug & Stability
• Last commit: 682b738 (feat/2026-11-23-debug-logger-chat-fix)
• Branch: feat/2026-11-23-debug-logger-chat-fix
• Server: RUNNING on port 3000 (health check passes)
• Frontend: React 19 + TypeScript + Vite 8 SPA with DebugPanel integrated
• Database: better-sqlite3 chat_history.db (15 conversations)
• DebugLogger: Full tracing for API calls, chat flow, state changes
• Known Bug: Tool call loop sometimes hits max_iterations (5) without final response

═══════════════════════════════════════════════════════════
NON-NEGOTIABLES (Android/Linux Environment)
═══════════════════════════════════════════════════════════
❌ NO naming variables 'debugger' — reserved JS keyword, use 'frontendDebugger'
❌ NO type-only imports without 'type' prefix — verbatimModuleSyntax requires `type X`
❌ NO skip rebuild — always run `npm --prefix client run build` after source changes
✅ curl, node scripts, git operations are FINE
🔴 Frontend build CAN go stale — check bundle timestamp if UI changes don't appear

═══════════════════════════════════════════════════════════
CREDENTIALS & KEYS
═══════════════════════════════════════════════════════════
FreeLLMAPI Default Key: freellmapi-80e928f21a9c07428815c1fdcdadb645c15173e612df942c
Provider URL: https://freellmapi-claude.up.railway.app/v1/chat/completions
Model: auto (OpenAI-compatible format)

═══════════════════════════════════════════════════════════
NEXT ACTIONS (in order — DO NOT SKIP)
═══════════════════════════════════════════════════════════
1. VERIFY DEBUG PANEL IN BROWSER
   Open http://localhost:3000 in browser
   Check bottom-right for "Debug" toggle button
   Click "New Chat", send a message
   Verify DebugPanel logs: fetchConversations → loadConversation → handleSendMessage → API response

2. FIX TOOL ITERATION BUG
   Current issue: LLM returns tool call but agent hits max_iterations before getting final response
   Test: curl -X POST http://localhost:3000/api/chat -H 'Content-Type: application/json' -d '{"message":"what time is it?"}'
   Check server/server.log or console output for iteration count
   Possible fix: Adjust SYSTEM_PROMPT to encourage breaking out of tool loop after first use

3. ADD STREAMING SUPPORT (Optional Enhancement)
   Currently all responses are awaited fully before showing
   Consider SSE streaming for better UX
   Backend: Add EventSource headers, stream chunks
   Frontend: Parse SSE events, update messages incrementally

═══════════════════════════════════════════════════════════
KEY FILES TO READ FIRST
═══════════════════════════════════════════════════════════
Order matters — read these three files in sequence:

1. server/index.js — Main Express app, agentic loop logic, API routes
2. client/src/App.tsx — Frontend state, chat flow, debug logging integration
3. client/src/lib/debugger.ts — FrontendDebugger singleton class

═══════════════════════════════════════════════════════════
WATCH OUT FOR
═══════════════════════════════════════════════════════════
• Bundle staleness: Check dist/assets/index-*.js timestamp vs src timestamps
• notes.json bloat: No cleanup mechanism — implement periodic pruning
• No auth between frontend/backend: API key passed as body param (fine for local, bad for prod)
• Railway deprovisioned: .railway/railway.ts deleted, no deployment config
• better-sqlite3 WAL mode: Potential concurrent write issues under load

═══════════════════════════════════════════════════════════
EXACT FIRST COMMAND TO RUN
═══════════════════════════════════════════════════════════
curl -s http://localhost:3000/api/conversations && echo "" && curl -s -X POST http://localhost:3000/api/chat -H "Content-Type: application/json" -d '{"message":"hello"}'

This verifies both the conversation list endpoint and the chat endpoint work correctly. If both return valid JSON, the system is healthy and ready for further development.

═══════════════════════════════════════════════════════════
SUCCESS CRITERIA
═══════════════════════════════════════════════════════════
• DebugPanel visible and functional in browser
• All API endpoints respond correctly via curl
• Tool calls produce meaningful responses (not max_iterations error)
• Build is fresh (bundle timestamp matches latest src changes)
• Git history shows clean commits with descriptive messages

═══════════════════════════════════════════════════════════
START NOW: Read HANDOFF.md → Run health check commands → Open browser
═══════════════════════════════════════════════════════════
