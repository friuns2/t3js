import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Example demonstrating how to use the T3Router OpenAI-compatible server
 * with the official OpenAI client library.
 * 
 * Prerequisites:
 * 1. Install OpenAI client: npm install openai
 * 2. Start the T3Router OpenAI server: npm run server
 * 3. Set up your .env file with COOKIES and CONVEX_SESSION_ID
 */

// Configure OpenAI client to use local T3Router server
const openai = new OpenAI({
  apiKey: 'demo-key', // Can be any string when using environment variables
  baseURL: 'http://localhost:3000/v1', // Point to our local server
});

async function demonstrateBasicChat() {
  console.log('=== Basic Chat Example ===\n');
  
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'user',
          content: 'What are the main benefits of renewable energy?'
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    console.log('User: What are the main benefits of renewable energy?');
    console.log(`Assistant: ${response.choices[0].message.content}\n`);
    console.log(`Tokens used: ${response.usage.total_tokens}\n`);
    
  } catch (error) {
    console.error('Error in basic chat:', error.message);
  }
}

async function demonstrateMultiTurnConversation() {
  console.log('=== Multi-turn Conversation Example ===\n');
  
  try {
    const messages = [
      {
        role: 'user',
        content: 'Can you explain what machine learning is?'
      }
    ];

    // First message
    let response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: messages
    });

    console.log('User: Can you explain what machine learning is?');
    console.log(`Assistant: ${response.choices[0].message.content}\n`);

    // Add assistant's response to conversation
    messages.push({
      role: 'assistant',
      content: response.choices[0].message.content
    });

    // Follow-up question
    messages.push({
      role: 'user',
      content: 'What are some practical applications of machine learning?'
    });

    response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: messages
    });

    console.log('User: What are some practical applications of machine learning?');
    console.log(`Assistant: ${response.choices[0].message.content}\n`);
    
  } catch (error) {
    console.error('Error in multi-turn conversation:', error.message);
  }
}

async function demonstrateStreamingChat() {
  console.log('=== Streaming Chat Example ===\n');
  
  try {
    const stream = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'user',
          content: 'Tell me a short story about a robot learning to paint.'
        }
      ],
      stream: true
    });

    console.log('User: Tell me a short story about a robot learning to paint.');
    console.log('Assistant: ');
    
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        process.stdout.write(content);
      }
    }
    
    console.log('\n\n');
    
  } catch (error) {
    console.error('Error in streaming chat:', error.message);
  }
}

async function demonstrateDifferentModels() {
  console.log('=== Different Models Example ===\n');
  
  const models = ['gpt-3.5-turbo', 'gpt-4', 'claude-3-sonnet'];
  const question = 'What is the meaning of life in one sentence?';
  
  for (const model of models) {
    try {
      console.log(`Testing model: ${model}`);
      
      const response = await openai.chat.completions.create({
        model: model,
        messages: [
          {
            role: 'user',
            content: question
          }
        ],
        max_tokens: 100
      });

      console.log(`Response: ${response.choices[0].message.content}\n`);
      
    } catch (error) {
      console.error(`Error with model ${model}:`, error.message);
    }
  }
}

async function listAvailableModels() {
  console.log('=== Available Models ===\n');
  
  try {
    const models = await openai.models.list();
    
    console.log('Available models:');
    models.data.forEach(model => {
      console.log(`- ${model.id} (owned by: ${model.owned_by})`);
    });
    console.log('\n');
    
  } catch (error) {
    console.error('Error listing models:', error.message);
  }
}

async function demonstrateSystemMessage() {
  console.log('=== System Message Example ===\n');
  
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that always responds in the style of a pirate.'
        },
        {
          role: 'user',
          content: 'How do I make a good cup of coffee?'
        }
      ]
    });

    console.log('System: You are a helpful assistant that always responds in the style of a pirate.');
    console.log('User: How do I make a good cup of coffee?');
    console.log(`Assistant: ${response.choices[0].message.content}\n`);
    
  } catch (error) {
    console.error('Error with system message:', error.message);
  }
}

async function main() {
  console.log('T3Router OpenAI Client Examples\n');
  console.log('Make sure the T3Router OpenAI server is running on http://localhost:3000\n');
  console.log('Starting in 2 seconds...\n');
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  try {
    // Test server availability
    await fetch('http://localhost:3000/health');
    console.log('✅ Server is running\n');
  } catch (error) {
    console.error('❌ Server is not running. Please start it with: npm run server\n');
    return;
  }
  
  // Run examples
  await listAvailableModels();
  await demonstrateBasicChat();
  await demonstrateSystemMessage();
  await demonstrateMultiTurnConversation();
  await demonstrateDifferentModels();
  await demonstrateStreamingChat();
  
  console.log('All examples completed!');
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error.message);
  process.exit(1);
});

// Run the examples
main().catch(console.error);