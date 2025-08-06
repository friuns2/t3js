import 'dotenv/config';

/**
 * Test script for OpenAI server streaming functionality
 * This tests the /v1/chat/completions endpoint with stream=true
 */

async function testOpenAIStreaming() {
  const serverUrl = 'http://localhost:3000';
  
  console.log('Testing OpenAI server streaming functionality...');
  console.log('Server URL:', serverUrl);
  
  const requestBody = {
    model: 'gpt-4',
    messages: [
      {
        role: 'user',
        content: 'Write a short story about a robot learning to paint. Make it about 3-4 paragraphs long.'
      }
    ],
    stream: true,
    temperature: 0.7
  };
  
  try {
    console.log('\nSending streaming request...');
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
    
    console.log('\n=== Streaming Response ===');
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    console.log('\n--- Stream Content ---');
    
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
          const data = line.slice(6); // Remove 'data: ' prefix
          
          if (data === '[DONE]') {
            console.log('\n[DONE] - Stream finished');
            continue;
          }
          
          try {
            const parsed = JSON.parse(data);
            chunkCount++;
            
            if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta) {
              const delta = parsed.choices[0].delta;
              
              if (delta.role) {
                console.log(`\nChunk ${chunkCount}: Role = ${delta.role}`);
              }
              
              if (delta.content) {
                process.stdout.write(delta.content);
                fullContent += delta.content;
              }
              
              if (parsed.choices[0].finish_reason === 'stop') {
                console.log(`\n\nChunk ${chunkCount}: Finished (${parsed.choices[0].finish_reason})`);
              }
            }
          } catch (parseError) {
            console.log(`\nChunk ${chunkCount}: Parse error -`, parseError.message);
            console.log('Raw data:', data);
          }
        }
      }
    }
    
    console.log('\n=== Summary ===');
    console.log(`Total chunks received: ${chunkCount}`);
    console.log(`Full content length: ${fullContent.length} characters`);
    console.log('\n=== Full Content ===');
    console.log(fullContent);
    
  } catch (error) {
    console.error('\nError testing streaming:', error.message);
    console.error('Make sure the OpenAI server is running on port 3000');
    console.error('Start it with: node src/openai-server.js');
  }
}

// Run the test
testOpenAIStreaming();