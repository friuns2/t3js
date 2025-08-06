import dotenv from 'dotenv';
import { Client, Message, MessageType, Config } from './src/t3/index.js';

// Load environment variables
dotenv.config();

/**
 * Simple test to verify streaming functionality
 */
async function testStreaming() {
  try {
    const cookies = process.env.COOKIES;
    const convexSessionId = `"${process.env.CONVEX_SESSION_ID}"`;

    if (!cookies || !process.env.CONVEX_SESSION_ID) {
      throw new Error('Environment variables not set');
    }

    console.log('Testing streaming functionality...');
    const client = new Client(cookies, convexSessionId);

    const initSuccess = await client.init();
    if (!initSuccess) {
      throw new Error('Failed to initialize client');
    }

    const config = new Config();
    client.newConversation();

    const userMessage = Message.new(MessageType.USER, 'Count from 1 to 10 with a brief description of each number.');
    
    console.log('\nUser: Count from 1 to 10 with a brief description of each number.\n');
    console.log('Assistant: ');
    
    let chunkCount = 0;
    let totalLength = 0;
    
    for await (const chunk of client.sendStream('gemini-2.5-flash-lite', userMessage, config)) {
      if (chunk.complete) {
        console.log('\n\n✅ Streaming test completed successfully!');
        console.log(`📊 Received ${chunkCount} chunks`);
        console.log(`📏 Total response length: ${totalLength} characters`);
        console.log(`🧵 Thread ID: ${client.getThreadId()}`);
        console.log(`💬 Messages in conversation: ${client.getMessages().length}`);
        return true;
      } else {
        process.stdout.write(chunk.chunk);
        chunkCount++;
        totalLength += chunk.chunk.length;
      }
    }
    
  } catch (error) {
    console.error('❌ Streaming test failed:', error.message);
    return false;
  }
}

// Run the test
testStreaming().then(success => {
  process.exit(success ? 0 : 1);
});