require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const { createConversation, getConversations, getConversation, addMessage, getMessages, deleteConversation, updateConversationTitle } = require('./database');
const { executeTool, getToolDefinitions } = require('./tools');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/dist')));

// System prompt for the AI Agent
const SYSTEM_PROMPT = `You are an AI Agent. You have these tools: save_note(text) and get_time(). If you want to use a tool, respond ONLY with a JSON object: {"tool": "tool_name", "args": "value"}. Otherwise, chat normally.`;

// Call FreeLLMAPI
async function callLLM(messages, apiKey) {
  const response = await fetch('http://freellmapi-claude.up.railway.app/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      messages,
      temperature: 0.7,
      max_tokens: 2000
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`LLM API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// Check if response is a tool call
function isToolCall(response) {
  try {
    const parsed = JSON.parse(response);
    return parsed.tool && typeof parsed.tool === 'string';
  } catch {
    return false;
  }
}

// Parse tool call
function parseToolCall(response) {
  try {
    return JSON.parse(response);
  } catch {
    return null;
  }
}

// Agentic loop
async function runAgenticLoop(conversationId, userMessage, apiKey) {
  // Add user message to history
  addMessage(conversationId, 'user', userMessage);

  // Get conversation history
  const history = getMessages(conversationId);

  // Build messages for LLM
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.map(msg => ({
      role: msg.role === 'tool' ? 'assistant' : msg.role,
      content: msg.content
    }))
  ];

  let finalResponse = '';
  let maxIterations = 5; // Prevent infinite loops
  let iteration = 0;

  while (iteration < maxIterations) {
    iteration++;
    const response = await callLLM(messages, apiKey);

    if (isToolCall(response)) {
      const toolCall = parseToolCall(response);
      if (toolCall) {
        // Add tool call to history
        addMessage(conversationId, 'assistant', '', toolCall.tool, JSON.stringify(toolCall.args));

        // Execute tool
        const result = executeTool(toolCall.tool, toolCall.args);

        // Add tool result to history
        addMessage(conversationId, 'tool', JSON.stringify(result), toolCall.tool, null, JSON.stringify(result));

        // Add to messages for next iteration
        messages.push({ role: 'assistant', content: response });
        messages.push({ role: 'tool', content: JSON.stringify(result), tool_call_id: toolCall.tool });
      }
    } else {
      // Final response from AI
      finalResponse = response;
      addMessage(conversationId, 'assistant', finalResponse);
      break;
    }
  }

  if (!finalResponse) {
    finalResponse = 'I apologize, but I reached the maximum number of tool iterations. Please try again.';
    addMessage(conversationId, 'assistant', finalResponse);
  }

  return finalResponse;
}

// API Routes
app.post('/api/chat', async (req, res) => {
  try {
    const { message, conversationId, apiKey } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const key = apiKey || process.env.FREELLM_API_KEY || 'freellmapi-80e928f21a9c07428815c1fdcdadb645c15173e612df942c';

    let convId = conversationId;
    if (!convId) {
      convId = createConversation(message.slice(0, 50));
    }

    const response = await runAgenticLoop(convId, message, key);

    res.json({
      response,
      conversationId: convId
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/conversations', (req, res) => {
  try {
    const conversations = getConversations();
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/conversations/:id', (req, res) => {
  try {
    const conversation = getConversation(req.params.id);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    const messages = getMessages(req.params.id);
    res.json({ ...conversation, messages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/conversations/:id', (req, res) => {
  try {
    deleteConversation(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/conversations/:id', (req, res) => {
  try {
    const { title } = req.body;
    updateConversationTitle(req.params.id, title);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tools', (req, res) => {
  res.json(getToolDefinitions());
});

// Execute a tool
app.post('/api/tools/execute', (req, res) => {
  try {
    const { name, arguments: args } = req.body;
    const result = executeTool(name, args);
    res.json({ result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API Key management endpoints
app.post('/api/keys/rotate', (req, res) => {
  // In a real app, this would call the FreeLLMAPI to rotate the key
  // For now, generate a mock new key
  const newKey = 'freellmapi-' + require('crypto').randomBytes(32).toString('hex');
  res.json({ newKey });
});

app.post('/api/keys/revoke', (req, res) => {
  // In a real app, this would call the FreeLLMAPI to revoke the key
  res.json({ success: true });
});

// Account deletion endpoint
app.delete('/api/account/delete', (req, res) => {
  // In a real app, this would delete the user account
  res.json({ success: true });
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});