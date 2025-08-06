import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { Client } from './t3/client.js';
import { Message, MessageType } from './t3/message.js';
import { Config } from './t3/config.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Store active clients by API key or session
const clients = new Map();

/**
 * Initialize a T3Router client for a given API key/session
 */
async function getOrCreateClient(apiKey = 'default') {
  if (clients.has(apiKey)) {
    return clients.get(apiKey);
  }

  let cookies, convexSessionId;
  
  // Priority 1: Use environment variables if available
  if (process.env.COOKIES && process.env.CONVEX_SESSION_ID) {
    cookies = process.env.COOKIES;
    convexSessionId = process.env.CONVEX_SESSION_ID;
  }
  // Priority 2: Parse from API key if env vars not available
  else if (apiKey && apiKey !== 'default' && apiKey.includes(':')) {
    const parts = apiKey.split(':');
    cookies = parts[0];
    convexSessionId = parts[1];
  }
  else {
    throw new Error('No credentials available. Either set COOKIES and CONVEX_SESSION_ID environment variables or provide API key in format: cookies:convexSessionId');
  }

  if (!cookies || !convexSessionId) {
    throw new Error('Invalid credentials. Ensure COOKIES and CONVEX_SESSION_ID are properly set.');
  }

  const client = new Client(cookies, convexSessionId);
  const initSuccess = await client.init();
  
  if (!initSuccess) {
    throw new Error('Failed to initialize T3Router client');
  }

  clients.set(apiKey, client);
  return client;
}

/**
 * Convert OpenAI messages format to T3Router messages format
 */
function convertOpenAIMessagesToT3(openaiMessages) {
  return openaiMessages.map(msg => {
    const role = msg.role === 'system' ? MessageType.USER : 
                msg.role === 'user' ? MessageType.USER : 
                MessageType.ASSISTANT;
    
    let content = '';
    if (typeof msg.content === 'string') {
      content = msg.content;
    } else if (Array.isArray(msg.content)) {
      // Handle multi-modal content (text + images)
      content = msg.content
        .filter(part => part.type === 'text')
        .map(part => part.text)
        .join('\n');
    }
    
    return Message.new(role, content);
  });
}

/**
 * Convert T3Router model names to OpenAI-compatible names
 */
function mapModelName(openaiModel) {
  const modelMap = {
    'gpt-3.5-turbo': 'gemini-2.5-flash-lite',
    'gpt-4': 'gemini-2.5-flash',
    'gpt-4-turbo': 'gemini-2.5-flash',
    'gpt-4o': 'gemini-2.5-flash',
    'gpt-4o-mini': 'gemini-2.5-flash-lite',
    'claude-3-sonnet': 'claude-3.5-sonnet',
    'claude-3-haiku': 'claude-3-haiku',
    'claude-3-opus': 'claude-3-opus'
  };
  
  return modelMap[openaiModel] || openaiModel;
}

/**
 * OpenAI Chat Completions endpoint
 */
app.post('/v1/chat/completions', async (req, res) => {
  try {
    const { messages, model, stream = false, temperature, max_tokens, ...otherParams } = req.body;
    
    // Get API key from Authorization header (optional if env vars are set)
    let apiKey = 'default';
    const authHeader = req.headers.authorization;
    
    // If environment variables are not set, require Authorization header
    if (!process.env.COOKIES || !process.env.CONVEX_SESSION_ID) {
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          error: {
            message: 'Authorization header required when COOKIES and CONVEX_SESSION_ID environment variables are not set',
            type: 'invalid_request_error',
            code: 'invalid_api_key'
          }
        });
      }
      apiKey = authHeader.substring(7); // Remove 'Bearer ' prefix
    } else if (authHeader && authHeader.startsWith('Bearer ')) {
      // Use provided API key if available, even when env vars are set
      apiKey = authHeader.substring(7);
    }
    
    // Get or create T3Router client
    const client = await getOrCreateClient(apiKey);
    
    // Convert OpenAI messages to T3Router format
    const t3Messages = convertOpenAIMessagesToT3(messages);
    
    // Map model name
    const t3Model = mapModelName(model);
    
    // Create config
    const config = new Config();
    
    // Start new conversation and add messages
    client.newConversation();
    t3Messages.forEach(msg => client.appendMessage(msg));
    
    if (stream) {
      // Real-time streaming response using sendStream
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');
      
      const chatId = `chatcmpl-${Date.now()}`;
      const created = Math.floor(Date.now() / 1000);
      
      try {
        // Send initial chunk with role
        const initialChunk = {
          id: chatId,
          object: 'chat.completion.chunk',
          created: created,
          model: model,
          choices: [{
            index: 0,
            delta: {
              role: 'assistant'
            },
            finish_reason: null
          }]
        };
        res.write(`data: ${JSON.stringify(initialChunk)}\n\n`);
        
        // Stream the response
        for await (const chunk of client.sendStream(t3Model, null, config)) {
          if (chunk.complete) {
            // Send final chunk
            const finalChunk = {
              id: chatId,
              object: 'chat.completion.chunk',
              created: created,
              model: model,
              choices: [{
                index: 0,
                delta: {},
                finish_reason: 'stop'
              }]
            };
            res.write(`data: ${JSON.stringify(finalChunk)}\n\n`);
            res.write('data: [DONE]\n\n');
            res.end();
            break;
          } else if (chunk.chunk) {
            // Send content chunk
            const contentChunk = {
              id: chatId,
              object: 'chat.completion.chunk',
              created: created,
              model: model,
              choices: [{
                index: 0,
                delta: {
                  content: chunk.chunk
                },
                finish_reason: null
              }]
            };
            res.write(`data: ${JSON.stringify(contentChunk)}\n\n`);
          }
        }
      } catch (streamError) {
        console.error('Streaming error:', streamError);
        res.write(`data: {"error": "${streamError.message}"}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
      }
    } else {
      // Send the last message and get response
      const response = await client.send(t3Model, null, config);
      // Non-streaming response
      const openaiResponse = {
        id: `chatcmpl-${Date.now()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: model,
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: response.contentType.getText() || response.content
          },
          finish_reason: 'stop'
        }],
        usage: {
          prompt_tokens: messages.reduce((acc, msg) => acc + (typeof msg.content === 'string' ? msg.content.length : 0), 0) / 4,
          completion_tokens: (response.contentType.getText() || response.content).length / 4,
          total_tokens: 0
        }
      };
      
      openaiResponse.usage.total_tokens = openaiResponse.usage.prompt_tokens + openaiResponse.usage.completion_tokens;
      
      res.json(openaiResponse);
    }
    
  } catch (error) {
    console.error('Error in chat completions:', error);
    res.status(500).json({
      error: {
        message: error.message,
        type: 'internal_server_error',
        code: 'internal_error'
      }
    });
  }
});

/**
 * OpenAI Models endpoint
 */
app.get('/v1/models', (req, res) => {
  const models = [
    {
      id: 'gpt-3.5-turbo',
      object: 'model',
      created: 1677610602,
      owned_by: 't3router',
      permission: [],
      root: 'gpt-3.5-turbo',
      parent: null
    },
    {
      id: 'gpt-4',
      object: 'model',
      created: 1687882411,
      owned_by: 't3router',
      permission: [],
      root: 'gpt-4',
      parent: null
    },
    {
      id: 'gpt-4-turbo',
      object: 'model',
      created: 1712361441,
      owned_by: 't3router',
      permission: [],
      root: 'gpt-4-turbo',
      parent: null
    },
    {
      id: 'gpt-4o',
      object: 'model',
      created: 1715367049,
      owned_by: 't3router',
      permission: [],
      root: 'gpt-4o',
      parent: null
    },
    {
      id: 'gpt-4o-mini',
      object: 'model',
      created: 1721172741,
      owned_by: 't3router',
      permission: [],
      root: 'gpt-4o-mini',
      parent: null
    },
    {
      id: 'claude-3-sonnet',
      object: 'model',
      created: 1709251200,
      owned_by: 't3router',
      permission: [],
      root: 'claude-3-sonnet',
      parent: null
    },
    {
      id: 'claude-3-haiku',
      object: 'model',
      created: 1709251200,
      owned_by: 't3router',
      permission: [],
      root: 'claude-3-haiku',
      parent: null
    },
    {
      id: 'claude-3-opus',
      object: 'model',
      created: 1709251200,
      owned_by: 't3router',
      permission: [],
      root: 'claude-3-opus',
      parent: null
    }
  ];
  
  res.json({
    object: 'list',
    data: models
  });
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Root endpoint with API information
 */
app.get('/', (req, res) => {
  res.json({
    message: 'T3Router OpenAI-Compatible API Server',
    version: '1.0.0',
    endpoints: {
      'POST /v1/chat/completions': 'Chat completions endpoint',
      'GET /v1/models': 'List available models',
      'GET /health': 'Health check'
    },
    documentation: 'https://platform.openai.com/docs/api-reference/chat'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`T3Router OpenAI-Compatible API Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Models endpoint: http://localhost:${PORT}/v1/models`);
  console.log(`Chat completions: POST http://localhost:${PORT}/v1/chat/completions`);
});

export default app;