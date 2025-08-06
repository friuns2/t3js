import dotenv from 'dotenv';
import { Client, Message, MessageType, Config } from '../src/t3/index.js';

// Load environment variables
dotenv.config();

/**
 * Streaming conversation example demonstrating:
 * - Real-time streaming responses
 * - Chunk-by-chunk processing
 * - Complete message handling
 */
async function main() {
  try {
    const cookies = process.env.COOKIES;
    const convexSessionId = `"${process.env.CONVEX_SESSION_ID}"`;

    if (!cookies) {
      throw new Error('COOKIES environment variable not set');
    }
    if (!process.env.CONVEX_SESSION_ID) {
      throw new Error('CONVEX_SESSION_ID environment variable not set');
    }

    console.log('=== Streaming Example ===\n');
    const client = new Client(cookies, convexSessionId);

    // Initialize the client and check if initialization was successful
    const initSuccess = await client.init();
    if (initSuccess) {
      console.log('Client initialized successfully\n');
    } else {
      throw new Error('Failed to initialize client');
    }

    const config = new Config();

    console.log('=== Streaming Text Conversation ===\n');

    client.newConversation();

    // Send a text message with streaming
    const userMessage = Message.new(MessageType.USER, 'Write a short story about a robot learning to paint. Make it creative and engaging.');
    
    console.log('User: Write a short story about a robot learning to paint. Make it creative and engaging.\n');
    console.log('Assistant: ');
    
    let fullResponse = '';
    
    try {
      for await (const chunk of client.sendStream('gemini-2.5-flash-lite', userMessage, config)) {
        if (chunk.complete) {
          // Stream is complete
          console.log('\n\n=== Stream Complete ===');
          console.log(`Full response length: ${fullResponse.length} characters`);
          console.log(`Thread ID: ${client.getThreadId()}`);
          console.log(`Total messages in conversation: ${client.getMessages().length}`);
          break;
        } else {
          // Process each chunk as it arrives
          process.stdout.write(chunk.chunk);
          fullResponse += chunk.chunk;
        }
      }
    } catch (error) {
      console.error('\nStreaming error:', error.message);
    }

    console.log('\n\n=== Follow-up Streaming Message ===\n');
    
    const followUpMessage = Message.new(MessageType.USER, 'Now write a haiku about that robot.');
    console.log('User: Now write a haiku about that robot.\n');
    console.log('Assistant: ');
    
    try {
      for await (const chunk of client.sendStream('gemini-2.5-flash-lite', followUpMessage, config)) {
        if (chunk.complete) {
          console.log('\n\n=== Second Stream Complete ===');
          console.log(`Total messages in conversation: ${client.getMessages().length}`);
          break;
        } else {
          process.stdout.write(chunk.chunk);
        }
      }
    } catch (error) {
      console.error('\nStreaming error:', error.message);
    }

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();