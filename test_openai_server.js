import 'dotenv/config';

/**
 * Comprehensive test script for OpenAI server functionality
 * Tests both streaming and non-streaming modes
 */

async function testOpenAIServer() {
  const serverUrl = 'http://localhost:3000';
  
  console.log('🚀 Testing OpenAI Server Functionality');
  console.log('=' .repeat(50));
  console.log(`Server URL: ${serverUrl}`);
  
  // Test 1: Health Check
  console.log('\n📋 Test 1: Health Check');
  try {
    const healthResponse = await fetch(`${serverUrl}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check passed:', healthData.status);
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
    return;
  }
  
  // Test 2: Models Endpoint
  console.log('\n📋 Test 2: Models Endpoint');
  try {
    const modelsResponse = await fetch(`${serverUrl}/v1/models`);
    const modelsData = await modelsResponse.json();
    console.log('✅ Models endpoint working');
    console.log(`   Available models: ${modelsData.data.length}`);
    console.log(`   First model: ${modelsData.data[0]?.id || 'None'}`);
  } catch (error) {
    console.log('❌ Models endpoint failed:', error.message);
  }
  
  // Test 3: Non-Streaming Chat Completion
  console.log('\n📋 Test 3: Non-Streaming Chat Completion');
  try {
    const nonStreamRequest = {
      model: 'gpt-4',
      messages: [{ role: 'user', content: 'Say "Hello from T3Router!" in exactly those words.' }],
      stream: false
    };
    
    const nonStreamResponse = await fetch(`${serverUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nonStreamRequest)
    });
    
    const nonStreamData = await nonStreamResponse.json();
    console.log('✅ Non-streaming completion successful');
    console.log(`   Response: "${nonStreamData.choices[0].message.content}"`);
    console.log(`   Tokens: ${nonStreamData.usage.total_tokens}`);
  } catch (error) {
    console.log('❌ Non-streaming completion failed:', error.message);
  }
  
  // Test 4: Streaming Chat Completion
  console.log('\n📋 Test 4: Streaming Chat Completion');
  try {
    const streamRequest = {
      model: 'gpt-4',
      messages: [{ role: 'user', content: 'Count from 1 to 5, each number on a new line.' }],
      stream: true
    };
    
    const streamResponse = await fetch(`${serverUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(streamRequest)
    });
    
    console.log('✅ Streaming started successfully');
    console.log('   Stream content:');
    
    const reader = streamResponse.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';
    let chunkCount = 0;
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            console.log('   ✅ Stream completed with [DONE]');
            continue;
          }
          
          try {
            const parsed = JSON.parse(data);
            if (parsed.choices?.[0]?.delta?.content) {
              process.stdout.write(parsed.choices[0].delta.content);
              fullContent += parsed.choices[0].delta.content;
              chunkCount++;
            }
          } catch (parseError) {
            // Ignore parse errors for non-JSON chunks
          }
        }
      }
    }
    
    console.log(`\n   ✅ Streaming completed: ${chunkCount} chunks, ${fullContent.length} characters`);
  } catch (error) {
    console.log('❌ Streaming completion failed:', error.message);
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log('🎉 OpenAI Server Testing Complete!');
  console.log('\n💡 Usage Examples:');
  console.log('   • Non-streaming: POST /v1/chat/completions with stream: false');
  console.log('   • Streaming: POST /v1/chat/completions with stream: true');
  console.log('   • Models: GET /v1/models');
  console.log('   • Health: GET /health');
}

// Run the comprehensive test
testOpenAIServer().catch(error => {
  console.error('\n❌ Test suite failed:', error.message);
  console.error('\n🔧 Troubleshooting:');
  console.error('   1. Make sure the server is running: node src/openai-server.js');
  console.error('   2. Check that COOKIES and CONVEX_SESSION_ID are set in .env');
  console.error('   3. Verify the server is accessible at http://localhost:3000');
});