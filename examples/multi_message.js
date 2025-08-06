import dotenv from 'dotenv';
import { Client, Message, MessageType, Config } from '../src/t3/index.js';

// Load environment variables
dotenv.config();

/**
 * Multi-message conversation examples demonstrating:
 * - Single message exchange
 * - Multi-turn conversations
 * - Pre-populated conversation history
 * - Thread persistence
 */
async function main() {
  try {
    const cookies = process.env.COOKIES;
    const convexSessionId = process.env.CONVEX_SESSION_ID;

    if (!cookies) {
      throw new Error('COOKIES environment variable not set');
    }
    if (!convexSessionId) {
      throw new Error('CONVEX_SESSION_ID environment variable not set');
    }

    // Create a new client
    const client = new Client(cookies, convexSessionId);

    // Initialize the client
    const initSuccess = await client.init();
    if (initSuccess) {
      console.log('Client initialized successfully\n');
    } else {
      throw new Error('Failed to initialize client');
    }

    // Create config
    const config = new Config();

    // Example 1: Single message
    console.log('=== Example 1: Single Message ===');
    const response = await client.send(
      'gemini-2.5-flash-lite',
      Message.new(MessageType.USER, 'What is the capital of France?'),
      config
    );

    console.log('User: What is the capital of France?');
    const textContent = response.contentType.getText();
    console.log(`Assistant: ${textContent}\n`);

    // Example 2: Multi-turn conversation using append_message
    console.log('=== Example 2: Multi-turn Conversation ===');

    // Start a new conversation
    client.newConversation();

    // First message
    client.appendMessage(Message.new(MessageType.USER, "I'm planning a trip to Paris. What are the top 3 attractions?"));
    const response1 = await client.send('gemini-2.5-flash-lite', null, config);
    console.log("User: I'm planning a trip to Paris. What are the top 3 attractions?");
    const textContent1 = response1.contentType.getText();
    console.log(`Assistant: ${textContent1}`);

    // Follow-up question
    const response2 = await client.send(
      'gemini-2.5-flash-lite',
      Message.new(MessageType.USER, 'Tell me more about the first one.'),
      config
    );
    console.log('\nUser: Tell me more about the first one.');
    const textContent2 = response2.contentType.getText();
    console.log(`Assistant: ${textContent2}`);

    // Another follow-up
    const response3 = await client.send(
      'gemini-2.5-flash-lite',
      Message.new(MessageType.USER, "What's the best time to visit?"),
      config
    );
    console.log("\nUser: What's the best time to visit?");
    const textContent3 = response3.contentType.getText();
    console.log(`Assistant: ${textContent3}\n`);

    // Example 3: Pre-populated conversation
    console.log('=== Example 3: Pre-populated Conversation ===');

    // Start fresh
    client.newConversation();

    // Build a conversation history
    client.appendMessage(Message.new(MessageType.USER, "Let's play a word association game. I'll say a word, you respond with the first word that comes to mind."));
    client.appendMessage(Message.new(MessageType.ASSISTANT, "Great! I love word association games. I'm ready to play. Go ahead and say your first word!"));
    client.appendMessage(Message.new(MessageType.USER, 'Ocean'));
    client.appendMessage(Message.new(MessageType.ASSISTANT, 'Waves'));
    client.appendMessage(Message.new(MessageType.USER, 'Beach'));

    // Send the conversation with the last user message
    const response4 = await client.send('gemini-2.5-flash-lite', null, config);

    // Display the conversation
    console.log('Conversation history:');
    for (const msg of client.getMessages()) {
      const role = msg.role === MessageType.USER ? 'User' : 'Assistant';
      const content = msg.contentType.getText();
      console.log(`${role}: ${content}`);
    }

    // Example 4: Check thread persistence
    console.log('\n=== Example 4: Thread Information ===');
    console.log(`Thread ID: ${client.getThreadId()}`);
    console.log(`Total messages in conversation: ${client.getMessages().length}`);

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run the main function
main();