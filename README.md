# T3Router - Node.js Client & OpenAI-Compatible Server

A comprehensive Node.js library for interacting with the t3.chat API, featuring both a native client and an OpenAI-compatible API server.

## Features

### Client Library
- 🤖 **Multi-model support**: Works with GPT, Gemini, and other models available on t3.chat
- 💬 **Conversation management**: Handle multi-turn conversations with context
- 🌊 **Streaming support**: Real-time streaming responses with `sendStream`
- ⚙️ **Configurable**: Customize reasoning effort and search inclusion

### OpenAI-Compatible Server
- 🔌 **OpenAI API compatibility**: Drop-in replacement for OpenAI API
- 🌊 **Streaming & non-streaming**: Both response modes supported
- 🔄 **Model mapping**: Automatic mapping from OpenAI model names
- 🚀 **Easy integration**: Works with existing OpenAI client libraries

## Installation

1. Clone or copy the t3js directory
2. Install dependencies:

```bash
cd t3js
npm install
```

## Setup

1. Copy the environment file:

```bash
cp .env.example .env
```

2. Edit `.env` and add your credentials:

```env
COOKIES=your_cookies_from_t3_chat
CONVEX_SESSION_ID=your_session_id_from_t3_chat
```

### Getting Your Credentials

1. Open your browser and go to [t3.chat](https://t3.chat)
2. Log in to your account
3. Open Developer Tools (F12)
4. Go to the Network tab
5. Send a message or refresh the page
6. Look for requests to `t3.chat` and copy:
   - The `Cookie` header value (for `COOKIES`)
   - The `convexSessionId` from the request payload (for `CONVEX_SESSION_ID`)

## Usage

### Basic Example

```javascript
import { Client, Message, MessageType, Config } from './src/t3/index.js';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client(
  process.env.COOKIES,
  `"${process.env.CONVEX_SESSION_ID}"`
);

// Initialize the client
if (await client.init()) {
  console.log('Client ready!');
}

// Send a message
const config = new Config();
const response = await client.send(
  'gemini-2.5-flash-lite',
  Message.new(MessageType.USER, 'Hello, how are you?'),
  config
);

console.log(response.contentType.getText());
```

### Streaming Responses

```javascript
import { Client, Message, MessageType, Config } from './src/t3/index.js';

const client = new Client(cookies, convexSessionId);
const config = new Config();

// Send a message with streaming
const userMessage = Message.new(MessageType.USER, 'Tell me a story');

for await (const chunk of client.sendStream('gemini-2.5-flash-lite', userMessage, config)) {
  if (chunk.complete) {
    console.log('\nStream complete!');
    console.log(`Full message: ${chunk.fullMessage.contentType.getText()}`);
    break;
  } else {
    // Process each chunk as it arrives
    process.stdout.write(chunk.chunk);
  }
}
```

### Multi-turn Conversations

```javascript
// Start a new conversation
client.newConversation();

// Add messages to build context
client.appendMessage(Message.new(MessageType.USER, 'What is machine learning?'));
const response1 = await client.send('gemini-2.5-flash-lite', null, config);

// Continue the conversation
const response2 = await client.send(
  'gemini-2.5-flash-lite',
  Message.new(MessageType.USER, 'Can you give me a simple example?'),
  config
);
```

## API Reference

### Client

#### Constructor
```javascript
new Client(cookies, convexSessionId)
```

#### Methods

- `async init()` - Initialize the client connection
- `async send(model, message, config)` - Send a message and get response
- `async* sendStream(model, message, config)` - Send a message and get streaming response
- `newConversation()` - Start a new conversation thread
- `appendMessage(message)` - Add a message to the current conversation
- `getMessages()` - Get all messages in the current conversation
- `clearMessages()` - Clear all messages
- `getThreadId()` - Get the current thread ID

### Message

#### Static Methods
```javascript
Message.new(type, content)        // Create text message
Message.newImage(type, url, base64) // Create image message
```

#### Types
- `MessageType.USER` - User message
- `MessageType.ASSISTANT` - Assistant message

### Config

#### Constructor
```javascript
new Config()
```

#### Methods
- `withReasoningEffort(effort)` - Set reasoning effort level
- `withSearchInclusion(include)` - Enable/disable search inclusion

#### Reasoning Effort Levels
- `ReasoningEffort.LOW`
- `ReasoningEffort.MEDIUM` (default)
- `ReasoningEffort.HIGH`

## Available Models

### Text Models
- `gemini-2.5-flash-lite` - Fast Gemini model
- `gemini-2.5-flash` - Standard Gemini model
- `gpt-4o` - GPT-4 Omni
- `claude-3.5-sonnet` - Claude 3.5 Sonnet



## Examples

Run the included examples:

```bash
# Basic usage example
npm run example:basic

# Multi-message conversation examples
npm run example:multi

# Streaming response example
npm run example:streaming

# Start OpenAI-compatible server
npm run start:openai-server

# Test OpenAI server functionality
npm run test:openai-server
```

## OpenAI-Compatible Server

The included OpenAI-compatible server provides a drop-in replacement for the OpenAI API, allowing you to use T3Router with any OpenAI-compatible client library.

### Quick Start

1. **Start the server:**
```bash
npm run start:openai-server
```

2. **Use with any OpenAI client:**
```python
import openai

client = openai.OpenAI(
    api_key="any-key",  # Can be any string if using env vars
    base_url="http://localhost:3000/v1"
)

response = client.chat.completions.create(
    model="gpt-4",
    messages=[{"role": "user", "content": "Hello!"}]
)
```

### API Endpoints

#### Chat Completions
**POST** `/v1/chat/completions`

OpenAI-compatible chat completions with streaming support:

```json
{
  "model": "gpt-4",
  "messages": [
    {"role": "user", "content": "Hello, how are you?"}
  ],
  "stream": true,
  "temperature": 0.7
}
```

#### List Models
**GET** `/v1/models`

Returns available models in OpenAI format.

#### Health Check
**GET** `/health`

Server health status.

### Model Mapping

Automatic mapping from OpenAI model names to T3Router models:

| OpenAI Model | T3Router Model |
|--------------|----------------|
| gpt-3.5-turbo | gemini-2.5-flash-lite |
| gpt-4 | gemini-2.5-flash |
| gpt-4-turbo | gemini-2.5-flash |
| gpt-4o | gemini-2.5-flash |
| gpt-4o-mini | gemini-2.5-flash-lite |
| claude-3-sonnet | claude-3.5-sonnet |

### Authentication

Two methods supported:

1. **Environment Variables (Recommended):**
   Set `COOKIES` and `CONVEX_SESSION_ID` in `.env`, use any API key

2. **API Key Format:**
   Use `cookies:convexSessionId` as the API key

### Usage Examples

#### Node.js with OpenAI Library
```javascript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: 'your-api-key',
  baseURL: 'http://localhost:3000/v1',
});

const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'What is AI?' }],
  stream: true
});

for await (const chunk of response) {
  const content = chunk.choices[0]?.delta?.content;
  if (content) process.stdout.write(content);
}
```

#### Python with OpenAI Library
```python
import openai

client = openai.OpenAI(
    api_key="your-api-key",
    base_url="http://localhost:3000/v1"
)

stream = client.chat.completions.create(
    model="gpt-4",
    messages=[{"role": "user", "content": "Tell me a story"}],
    stream=True
)

for chunk in stream:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="")
```

#### cURL
```bash
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4",
    "messages": [{"role": "user", "content": "Hello!"}],
    "stream": false
  }'
```

### Testing the Server

```bash
# Test all functionality
npm run test:openai-server

# Test streaming only
npm run test:openai-streaming

# Test non-streaming only
npm run test:openai-non-streaming
```

## Error Handling

The library throws errors for various conditions:

```javascript
try {
  const response = await client.send(model, message, config);
} catch (error) {
  console.error('Request failed:', error.message);
}
```

Common errors:
- Missing environment variables
- Invalid credentials
- Network connection issues
- API rate limits



## License

This project is provided as-is for educational and research purposes.