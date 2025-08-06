import dotenv from 'dotenv';
import { Client, Message, MessageType, Config } from '../src/t3/index.js';

// Load environment variables
dotenv.config();

/**
 * Main entry point for the application.
 * 
 * Demonstrates basic usage of the t3router client including:
 * - Client initialization
 * - Text conversation
 * - Response handling
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

    console.log('=== Sending a Message ===\n');
    const client = new Client(cookies, convexSessionId);

    // Initialize the client and check if initialization was successful
    const initSuccess = await client.init();
    if (initSuccess) {
      console.log('Client initialized successfully');
    } else {
      throw new Error('Failed to initialize client');
    }

    const config = new Config();

    console.log('\n=== Text Conversation Example ===\n');

    client.newConversation();

    // Send a text message
    const userMessage = Message.new(MessageType.USER, 'What are the benefits of renewable energy?');
    const response = await client.send(
      'gemini-2.5-flash-lite',
      userMessage,
      config
    );

    console.log('User: What are the benefits of renewable energy?');
    const textContent = response.contentType.getText();
    console.log(`Assistant: ${textContent}`);

    // Follow-up question
    const followUpResponse = await client.send(
      'gemini-2.5-flash-lite',
      Message.new(MessageType.USER, 'Which renewable energy source is most efficient?'),
      config
    );

    console.log('\nUser: Which renewable energy source is most efficient?');
    const followUpText = followUpResponse.contentType.getText();
    console.log(`Assistant: ${followUpText}`);

    console.log(`\nConversation completed with ${client.getMessages().length} messages.`);
    console.log(`Thread ID: ${client.getThreadId()}`);

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run the main function
main();