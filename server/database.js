const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'chat_history.db'));

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL DEFAULT 'New Chat',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
    content TEXT NOT NULL,
    tool_name TEXT,
    tool_args TEXT,
    tool_result TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
`);

// Helper functions
function createConversation(title = 'New Chat') {
  const stmt = db.prepare('INSERT INTO conversations (title) VALUES (?)');
  const result = stmt.run(title);
  return result.lastInsertRowid;
}

function getConversations() {
  const stmt = db.prepare('SELECT * FROM conversations ORDER BY updated_at DESC');
  return stmt.all();
}

function getConversation(id) {
  const stmt = db.prepare('SELECT * FROM conversations WHERE id = ?');
  return stmt.get(id);
}

function updateConversationTimestamp(id) {
  const stmt = db.prepare('UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?');
  stmt.run(id);
}

function addMessage(conversationId, role, content, toolName = null, toolArgs = null, toolResult = null) {
  const stmt = db.prepare(`
    INSERT INTO messages (conversation_id, role, content, tool_name, tool_args, tool_result)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(conversationId, role, content, toolName, toolArgs, toolResult);
  updateConversationTimestamp(conversationId);
  return result.lastInsertRowid;
}

function getMessages(conversationId) {
  const stmt = db.prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC');
  return stmt.all(conversationId);
}

function deleteConversation(id) {
  const stmt = db.prepare('DELETE FROM conversations WHERE id = ?');
  return stmt.run(id);
}

function updateConversationTitle(id, title) {
  const stmt = db.prepare('UPDATE conversations SET title = ? WHERE id = ?');
  return stmt.run(id, title);
}

module.exports = {
  db,
  createConversation,
  getConversations,
  getConversation,
  addMessage,
  getMessages,
  deleteConversation,
  updateConversationTitle,
};