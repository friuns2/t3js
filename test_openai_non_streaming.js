import 'dotenv/config';

/**
 * Test script for OpenAI server non-streaming functionality
 * This tests the /v1/chat/completions endpoint with stream=false
 */

async function testOpenAINonStreaming() {
  const serverUrl = 'http://localhost:3000';
  
  console.log('Testing OpenAI server non-streaming functionality...');
  console.log('Server URL:', serverUrl);
  
  const requestBody = {
    model: 'gpt-4',
    messages: [
      {
        role: 'user',
        content: 'Write a haiku about artificial intelligence.'
      }
    ],
    stream: false,
    temperature: 0.7
  };
  
  try {
    console.log('\nSending non-streaming request...');
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(`${serverUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add Authorization header if needed when env vars are not set
        // 'Authorization': 'Bearer your-api-key-here'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    
    console.log('\n=== Non-Streaming Response ===');
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    console.log('\n--- Response Data ---');
    console.log(JSON.stringify(result, null, 2));
    
    console.log('\n=== Content ===');
    if (result.choices && result.choices[0] && result.choices[0].message) {
      console.log(result.choices[0].message.content);
    }
    
    console.log('\n=== Summary ===');
    console.log(`Response ID: ${result.id}`);
    console.log(`Model: ${result.model}`);
    console.log(`Finish reason: ${result.choices[0].finish_reason}`);
    if (result.usage) {
      console.log(`Token usage: ${result.usage.prompt_tokens} prompt + ${result.usage.completion_tokens} completion = ${result.usage.total_tokens} total`);
    }
    
  } catch (error) {
    console.error('\nError testing non-streaming:', error.message);
    console.error('Make sure the OpenAI server is running on port 3000');
    console.error('Start it with: node src/openai-server.js');
  }
}

// Run the test
testOpenAINonStreaming();