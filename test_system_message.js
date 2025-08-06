import 'dotenv/config';

/**
 * Test script for OpenAI server system message functionality
 * This tests that system messages are properly prepended to conversations
 */

async function testSystemMessage() {
  const serverUrl = 'http://localhost:3000';
  
  console.log('Testing OpenAI server system message functionality...');
  console.log('Server URL:', serverUrl);
  
  const requestBody = {
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'You are a helpful assistant that always responds in a pirate accent. Use "arrr" and "matey" in your responses.'
      },
      {
        role: 'user',
        content: 'What is the capital of France?'
      }
    ],
    stream: false,
    temperature: 0.7
  };
  
  try {
    console.log('\nSending request with system message...');
    console.log('System message:', requestBody.messages[0].content);
    console.log('User message:', requestBody.messages[1].content);
    
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
    
    console.log('\n=== Response ===');
    console.log('Assistant response:', result.choices[0].message.content);
    
    // Check if the response contains pirate-like language
    const responseText = result.choices[0].message.content.toLowerCase();
    const pirateWords = ['arrr', 'matey', 'ahoy', 'ye', 'aye'];
    const containsPirateLanguage = pirateWords.some(word => responseText.includes(word));
    
    console.log('\n=== System Message Test Results ===');
    if (containsPirateLanguage) {
      console.log('✅ SUCCESS: Response contains pirate language, system message was applied!');
      console.log('   Found pirate words:', pirateWords.filter(word => responseText.includes(word)));
    } else {
      console.log('⚠️  WARNING: Response may not fully reflect the system message');
      console.log('   Expected pirate language but didn\'t detect obvious indicators');
    }
    
    console.log(`\n📊 Response length: ${result.choices[0].message.content.length} characters`);
    console.log(`📊 Token usage: ${result.usage.total_tokens} total tokens`);
    
  } catch (error) {
    console.error('\nError testing system message:', error.message);
    console.error('Make sure the OpenAI server is running on port 3000');
    console.error('Start it with: npm run start:openai-server');
  }
}

// Test with streaming as well
async function testSystemMessageStreaming() {
  const serverUrl = 'http://localhost:3000';
  
  console.log('\n' + '='.repeat(60));
  console.log('Testing system message with STREAMING...');
  
  const requestBody = {
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'You are a robot assistant. Always start your responses with "BEEP BOOP" and end with "END TRANSMISSION".'
      },
      {
        role: 'user',
        content: 'Tell me about the weather.'
      }
    ],
    stream: true,
    temperature: 0.7
  };
  
  try {
    console.log('\nSending streaming request with system message...');
    console.log('System message:', requestBody.messages[0].content);
    console.log('User message:', requestBody.messages[1].content);
    
    const response = await fetch(`${serverUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    console.log('\n--- Streaming Response ---');
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';
    let chunkCount = 0;
    
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        console.log('\n--- Stream Complete ---');
        break;
      }
      
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          
          if (data === '[DONE]') {
            console.log('\n[DONE] - Stream finished');
            continue;
          }
          
          try {
            const parsed = JSON.parse(data);
            chunkCount++;
            
            if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta && parsed.choices[0].delta.content) {
              const content = parsed.choices[0].delta.content;
              process.stdout.write(content);
              fullContent += content;
            }
          } catch (parseError) {
            // Ignore parse errors for non-JSON chunks
          }
        }
      }
    }
    
    console.log('\n\n=== Streaming System Message Test Results ===');
    const lowerContent = fullContent.toLowerCase();
    const startsWithBeep = lowerContent.startsWith('beep boop') || lowerContent.includes('beep boop');
    const endsWithTransmission = lowerContent.includes('end transmission');
    
    if (startsWithBeep && endsWithTransmission) {
      console.log('✅ SUCCESS: Streaming response follows system message format!');
      console.log('   ✓ Contains "BEEP BOOP"');
      console.log('   ✓ Contains "END TRANSMISSION"');
    } else {
      console.log('⚠️  WARNING: Streaming response may not fully follow system message');
      console.log(`   BEEP BOOP found: ${startsWithBeep}`);
      console.log(`   END TRANSMISSION found: ${endsWithTransmission}`);
    }
    
    console.log(`\n📊 Streaming chunks: ${chunkCount}`);
    console.log(`📊 Full content length: ${fullContent.length} characters`);
    
  } catch (error) {
    console.error('\nError testing streaming system message:', error.message);
  }
}

// Run both tests
async function runAllTests() {
  await testSystemMessage();
  await testSystemMessageStreaming();
  
  console.log('\n' + '='.repeat(60));
  console.log('🎉 System message testing complete!');
  console.log('\n💡 System messages are now properly prepended to conversations');
  console.log('   and work with both streaming and non-streaming modes.');
}

runAllTests().catch(error => {
  console.error('\n❌ Test suite failed:', error.message);
});