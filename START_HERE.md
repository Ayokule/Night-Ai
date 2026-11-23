# START_HERE.md — Night AI Quickstart Guide

## Project at a Glance

| Aspect | Detail |
|--------|--------|
| **Name** | Night AI |
| **Type** | React SPA + Express 5 backend (monorepo) |
| **Stack** | Node.js / Express 5 / better-sqlite3 / React 19 / TypeScript / Vite 8 / Tailwind CSS v4 |
| **API Provider** | FreeLLMAPI (OpenAI-compatible) at `https://freellmapi-claude.up.railway.app/v1/chat/completions` |
| **Default Key** | `freellmapi-80e928f21a9c07428815c1fdcdadb645c15173e612df942c` |
| **Running Port** | 3000 |

## Current Roadmap Phase

**Phase 2 — Debug & Stability**: Frontend debugging logger implemented. Fixing tool-call agentic loop reliability.

## Quick-Start Commands

```bash
# Start server (from project root)
node server/index.js

# Or use npm script
npm start

# Rebuild frontend only
npm --prefix client run build

# Test chat API directly
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"hello"}'
```

## Key Files to Read (Ordered)

1. **`server/index.js`** — Main Express app, API routes, agentic loop logic
2. **`client/src/App.tsx`** — Frontend state management, chat flow, debug integration
3. **`client/src/lib/debugger.ts`** — Debug singleton class with subscribe/logs/export

## Architecture Overview

```
client/               # React SPA (Vite 8, ESM)
  src/
    App.tsx           # Main component, state, API calls
    components/
      ChatPage.tsx    # Message display + input
      Sidebar.tsx     # Conversation list
      DebugPanel.tsx  # Floating debug viewer ⭐ NEW
    lib/
      debugger.ts     # FrontendLogger singleton ⭐ NEW
  dist/               # Built assets (served by Express)

server/
  index.js            # Express 5 server, API routes
  database.js         # better-sqlite3 wrapper
  tools.js            # save_note / get_time implementations
  notes.json          # Persistent note storage
```

## Known Landmines

- ⚠️ **`debugger` is a reserved JavaScript keyword** — variable must be named differently (e.g., `frontendDebugger`)
- ⚠️ **TypeScript `verbatimModuleSyntax`** requires `type X` import syntax for type-only imports
- ⚠️ **Tool call agentic loop** sometimes gets stuck — LLM may keep calling tools without producing final response
- ⚠️ **Frontend build can go stale** — always check bundle timestamp if UI changes aren't reflecting
- ⚠️ **No CSP headers** — Express serves raw static files; consider adding security middleware

## Environment Constraints

- Linux (Andronix/Bterm environment on Android phone)
- limited disk space — watch notes.json growth
- better-sqlite3 needs Python/build tools installed (already in Dockerfile)

## Test Credentials / Keys

No auth system yet — API key stored in localStorage under `freellm_api_key`. Default backend key is hardcoded.

---
*Last updated: 2026-11-23*
