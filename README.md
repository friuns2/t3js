# T3Router - Node.js Client

A Node.js client library for interacting with the t3.chat API, supporting both text conversations and image generation.

## Features

- 🤖 **Multi-model support**: Works with GPT, Gemini, and other models available on t3.chat
- 💬 **Conversation management**: Handle multi-turn conversations with context
- ⚙️ **Configurable**: Customize reasoning effort and search inclusion

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