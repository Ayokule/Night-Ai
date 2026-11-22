// Tool implementations for the AI Agent

const fs = require('fs');
const path = require('path');

const NOTES_FILE = path.join(__dirname, 'notes.json');

// Initialize notes file if it doesn't exist
if (!fs.existsSync(NOTES_FILE)) {
  fs.writeFileSync(NOTES_FILE, JSON.stringify([]));
}

function saveNote(text) {
  try {
    const notes = JSON.parse(fs.readFileSync(NOTES_FILE, 'utf8'));
    const note = {
      id: Date.now(),
      text,
      created_at: new Date().toISOString()
    };
    notes.push(note);
    fs.writeFileSync(NOTES_FILE, JSON.stringify(notes, null, 2));
    return { success: true, note };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function getTime() {
  return {
    success: true,
    time: new Date().toISOString(),
    formatted: new Date().toLocaleString()
  };
}

const tools = {
  save_note: {
    description: 'Save a note to persistent storage',
    parameters: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'The note text to save' }
      },
      required: ['text']
    },
    execute: (args) => saveNote(args.text)
  },
  get_time: {
    description: 'Get the current date and time',
    parameters: {
      type: 'object',
      properties: {}
    },
    execute: () => getTime()
  }
};

function executeTool(toolName, args) {
  const tool = tools[toolName];
  if (!tool) {
    return { success: false, error: `Unknown tool: ${toolName}` };
  }
  return tool.execute(args);
}

function getToolDefinitions() {
  return Object.entries(tools).map(([name, tool]) => ({
    name,
    description: tool.description,
    parameters: tool.parameters
  }));
}

module.exports = {
  tools,
  executeTool,
  getToolDefinitions,
  saveNote,
  getTime
};