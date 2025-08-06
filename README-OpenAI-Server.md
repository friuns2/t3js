# T3Router OpenAI-Compatible API Server

This server provides an OpenAI-compatible API endpoint that wraps the T3Router client, allowing you to use T3Router with any OpenAI-compatible client library or application.

## Features

- **OpenAI-Compatible API**: Implements the OpenAI Chat Completions API format
- **Multiple Model Support**: Access to various AI models through T3Router
- **Streaming Support**: Both streaming and non-streaming responses
- **Easy Integration**: Drop-in replacement for OpenAI API in existing applications
- **Model Mapping**: Automatic mapping from OpenAI model names to T3Router models

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Environment Variables

Create a `.env` file in the project root:

```env
COOKIES=your_t3chat_cookies_here
CONVEX_SESSION_ID=your_convex_session_id_here
PORT=3000
```

### 3. Start the Server

```bash
npm run server
# or
npm start
```

The server will start on `http://localhost:3000` (or the port specified in your environment).

## API Endpoints

### Chat Completions

**POST** `/v1/chat/completions`

OpenAI-compatible chat completions endpoint.

#### Request Format

```json
{
  "model": "gpt-4",
  "messages": [
    {
      "role": "user",
      "content": "Hello, how are you?"
    }
  ],
  "stream": false,
  "temperature": 0.7,
  "max_tokens": 1000
}
```

#### Response Format

```json
{
  "id": "chatcmpl-1234567890",
  "object": "chat.completion",
  "created": 1677652288,
  "model": "gpt-4",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! I'm doing well, thank you for asking. How can I help you today?"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 12,
    "completion_tokens": 19,
    "total_tokens": 31
  }
}
```

### List Models

**GET** `/v1/models`

Returns a list of available models.

#### Response Format

```json
{
  "object": "list",
  "data": [
    {
      "id": "gpt-4",
      "object": "model",
      "created": 1687882411,
      "owned_by": "t3router"
    }
  ]
}
```

### Health Check

**GET** `/health`

Returns server health status.

## Model Mapping

The server automatically maps OpenAI model names to T3Router models:

| OpenAI Model | T3Router Model |
|--------------|----------------|
| gpt-3.5-turbo | gemini-2.5-flash-lite |
| gpt-4 | gemini-2.5-flash |
| gpt-4-turbo | gemini-2.5-flash |
| gpt-4o | gemini-2.5-flash |
| gpt-4o-mini | gemini-2.5-flash-lite |
| claude-3-sonnet | claude-3.5-sonnet |
| claude-3-haiku | claude-3-haiku |
| claude-3-opus | claude-3-opus |

You can also use T3Router model names directly.

## Authentication

The server supports two authentication methods:

### Method 1: Environment Variables (Recommended)

Set `COOKIES` and `CONVEX_SESSION_ID` in your environment, then use any API key in the Authorization header:

```bash
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Authorization: Bearer any-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

### Method 2: API Key Format

Encode your credentials in the API key as `cookies:convexSessionId`:

```bash
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Authorization: Bearer your_cookies:your_convex_session_id" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

## Usage Examples

### Using with OpenAI Python Library

```python
import openai

# Configure the client to use your local server
client = openai.OpenAI(
    api_key="your-api-key",  # Can be any string if using env vars
    base_url="http://localhost:3000/v1"
)

# Use exactly like OpenAI API
response = client.chat.completions.create(
    model="gpt-4",
    messages=[
        {"role": "user", "content": "What is the capital of France?"}
    ]
)

print(response.choices[0].message.content)
```

### Using with Node.js OpenAI Library

```javascript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: 'your-api-key', // Can be any string if using env vars
  baseURL: 'http://localhost:3000/v1',
});

const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [
    { role: 'user', content: 'What is the capital of France?' }
  ],
});

console.log(response.choices[0].message.content);
```

### Using with curl

```bash
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4",
    "messages": [
      {
        "role": "user",
        "content": "Explain quantum computing in simple terms"
      }
    ],
    "stream": false
  }'
```

### Streaming Example

```javascript
const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Tell me a story' }],
  stream: true,
});

for await (const chunk of response) {
  const content = chunk.choices[0]?.delta?.content;
  if (content) {
    process.stdout.write(content);
  }
}
```

## Configuration

### Environment Variables

- `COOKIES`: Your t3.chat session cookies
- `CONVEX_SESSION_ID`: Your Convex session ID
- `PORT`: Server port (default: 3000)

### Getting T3.chat Credentials

1. Go to [t3.chat](https://t3.chat) and log in
2. Open browser developer tools (F12)
3. Go to the Network tab
4. Send a message in the chat
5. Find the request to `/api/chat`
6. Copy the `Cookie` header value for `COOKIES`
7. Copy the `convexSessionId` from the request body for `CONVEX_SESSION_ID`

## Error Handling

The server returns OpenAI-compatible error responses:

```json
{
  "error": {
    "message": "Invalid API key",
    "type": "invalid_request_error",
    "code": "invalid_api_key"
  }
}
```

## Limitations

- **Session Management**: Each API key maintains its own conversation session
- **Rate Limiting**: Inherits rate limits from T3Router
- **Model Availability**: Depends on T3Router's available models
- **Streaming**: Simplified streaming implementation (sends complete response)

## Development

### Running in Development Mode

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# Start the server
npm run server
```

### Testing the API

```bash
# Test health endpoint
curl http://localhost:3000/health

# Test models endpoint
curl http://localhost:3000/v1/models

# Test chat completions
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Authorization: Bearer test-key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

## Deployment

### Docker

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY src/ ./src/

EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:

```bash
docker build -t t3router-openai .
docker run -p 3000:3000 -e COOKIES="your_cookies" -e CONVEX_SESSION_ID="your_session_id" t3router-openai
```

### Production Considerations

- Use a process manager like PM2
- Set up proper logging
- Configure HTTPS/SSL
- Implement rate limiting
- Add monitoring and health checks
- Use environment-specific configurations

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see the LICENSE file for details.