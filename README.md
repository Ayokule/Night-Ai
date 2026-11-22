# Nova AI Agent

A production-ready web-based AI agent with agentic capabilities, featuring a premium dark theme UI built with React/Vite and a robust Express/SQLite backend.

## Features

- **Agentic Loop**: LLM → tool call detection → execution → feedback cycle
- **Premium UI**: Dark/light theme with glass morphism, custom animations
- **Chat History**: Date-grouped conversations with search
- **Tool System**: extensible tools (save_note, get_time) via function calling
- **Responsive Design**: Mobile sidebar overlay, touch-friendly interactions
- **SQLite Backend**: Local persistence for conversations and messages
- **API Key Management**: Rotate/revoke keys in settings

## Tech Stack

### Frontend
- React 19 + Vite
- TypeScript
- Tailwind CSS v4
- Shadcn UI (Radix UI primitives)
- date-fns for formatting

### Backend
- Node.js + Express
- better-sqlite3
- FreeLLMAPI integration

## Installation

```bash
# Clone the repository
git clone https://github.com/Ayokule/web-ai-agent.git
cd web-ai-agent

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

## Configuration

Create a `.env` file in the `server/` directory:

```env
FREELM_API_KEY=your-api-key-here
FREELM_API_URL=https://freellmapi-claude.up.railway.app/v1/chat/completions
PORT=3000
```

## Running the Application

### Development Mode

```bash
# Terminal 1: Start the backend server
cd server
npm run dev

# Terminal 2: Start the frontend development server
cd client
npm run dev
```

The application will be available at http://localhost:5173

### Production Build

```bash
# Build the client
cd client
npm run build

# Start the server (serves static files)
cd ../server
npm start
```

## API Endpoints

### Conversations
- `GET /api/conversations` - List all conversations
- `POST /api/conversations` - Create new conversation
- `GET /api/conversations/:id` - Get conversation details with messages
- `DELETE /api/conversations/:id` - Delete conversation
- `PATCH /api/conversations/:id` - Update conversation title

### Chat
- `POST /api/chat` - Send message and get response (agentic loop)

### Tools
- `GET /api/tools` - List available tools
- `POST /api/tools/execute` - Execute a tool

### API Keys
- `POST /api/keys/rotate` - Rotate API key
- `POST /api/keys/revoke` - Revoke API key

### Account
- `DELETE /api/account/delete` - Delete account

## Project Structure

```
web-ai-agent/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── ui/        # Shadcn UI components
│   │   │   ├── Sidebar.tsx
│   │   │   ├── ChatPage.tsx
│   │   │   └── SettingsPage.tsx
│   │   ├── lib/           # Utilities
│   │   └── assets/        # Static assets
│   ├── public/
│   └── index.html
├── server/                 # Backend Express application
│   ├── database.js        # SQLite setup
│   ├── tools.js           # Tool definitions
│   └── index.js           # Main server entry
└── package.json
```

## License

MIT
