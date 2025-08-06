import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { Message, MessageType, ContentType } from './message.js';
import { ReasoningEffort } from './config.js';

/**
 * Main client for interacting with t3.chat API.
 */
export class Client {
  constructor(cookies, convexSessionId) {
    this.cookies = cookies;
    this.convexSessionId = convexSessionId;
    this.threadId = null;
    this.messages = [];
    
    // Configure axios with default headers
    this.client = axios.create({
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
        'accept-language': 'en-US,en;q=0.9',
        'cache-control': 'no-cache',
        'origin': 'https://t3.chat',
        'pragma': 'no-cache',
        'priority': 'u=1, i',
        'sec-ch-ua': '"Not)A;Brand";v="8", "Chromium";v="138", "Google Chrome";v="138"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin'
      }
    });
  }

  /**
   * Initializes the client by testing the connection.
   * 
   * @returns {Promise<boolean>} True if initialization succeeded, false otherwise
   */
  async init() {
    try {
      const response = await this.client.get('https://t3.chat/', {
        headers: {
          'Cookie': this.cookies
        }
      });
      return response.status >= 200 && response.status < 300;
    } catch (error) {
      console.error('Failed to initialize client:', error.message);
      return false;
    }
  }

  /**
   * Parses the response string and extracts content (text or image).
   * 
   * @param {string} response - The response string to parse
   * @returns {Object} Object with content and imageUrl properties
   */
  parseResponse(response) {
    let textResult = '';
    let imageUrl = null;

    const lines = response.split('\n');
    for (const line of lines) {
      const colonPos = line.indexOf(':');
      if (colonPos === -1) continue;

      const code = line.substring(0, colonPos);
      const jsonData = line.substring(colonPos + 1);

      try {
        switch (code) {
          case '0':
            const text = JSON.parse(jsonData);
            if (typeof text === 'string') {
              textResult += text;
            }
            break;
          case '2':
            const dataArray = JSON.parse(jsonData);
            if (Array.isArray(dataArray)) {
              for (const item of dataArray) {
                if (item.type === 'image-gen' && item.content) {
                  try {
                    imageUrl = JSON.parse(item.content);
                  } catch (e) {
                    imageUrl = item.content;
                  }
                }
              }
            }
            break;
        }
      } catch (e) {
        // Skip invalid JSON lines
        continue;
      }
    }

    if (!textResult && !imageUrl) {
      throw new Error('No valid content found in response');
    }

    return {
      content: textResult.trim(),
      imageUrl
    };
  }

  /**
   * Starts a new conversation by resetting the thread ID and clearing messages.
   */
  newConversation() {
    this.threadId = null;
    this.messages = [];
  }

  /**
   * Appends a message to the conversation without sending it.
   * 
   * @param {Message} message - The message to append
   */
  appendMessage(message) {
    this.messages.push(message);
  }

  /**
   * Gets all messages in the current conversation.
   * 
   * @returns {Message[]} Array of messages
   */
  getMessages() {
    return this.messages;
  }

  /**
   * Clears all messages from the current conversation.
   */
  clearMessages() {
    this.messages = [];
  }

  /**
   * Gets the current thread ID.
   * 
   * @returns {string|null} The thread ID or null if no conversation started
   */
  getThreadId() {
    return this.threadId;
  }



  /**
   * Sends a message to the specified model.
   * 
   * @param {string} model - The model to use
   * @param {Message|null} newMessage - Optional new message to append before sending
   * @param {Config} config - Configuration for the request
   * @returns {Promise<Message>} The assistant's response
   */
  async send(model, newMessage = null, config) {
    if (newMessage) {
      this.appendMessage(newMessage);
    }

    const reasoningEffort = config.reasoningEffort || ReasoningEffort.MEDIUM;
    const threadId = this.threadId || uuidv4();
    this.threadId = threadId;

    // Convert messages to API format
    const messagesJson = this.messages.map(msg => ({
      id: msg.id,
      parts: [{
        type: 'text',
        text: msg.content
      }],
      role: msg.role,
      attachments: []
    }));

    const body = {
      messages: messagesJson,
      threadMetadata: {
        id: threadId
      },
      responseMessageId: uuidv4(),
      model: model,
      convexSessionId: this.convexSessionId,
      modelParams: {
        reasoningEffort: reasoningEffort,
        includeSearch: config.includeSearch
      },
      preferences: {
        name: '',
        occupation: '',
        selectedTraits: [],
        additionalInfo: ''
      },
      userInfo: {
        timezone: 'America/New_York'
      }
    };

    try {
      const response = await this.client.post('https://t3.chat/api/chat', body, {
        headers: {
          'Cookie': this.cookies,
          'Content-Type': 'application/json',
          'Referer': `https://t3.chat/chat/${threadId}`
        }
      });

      if (response.status < 200 || response.status >= 300) {
        throw new Error(`Failed to send message: ${response.status}`);
      }

      const parsed = this.parseResponse(response.data);
      
      let responseMessage;
      if (parsed.imageUrl) {
        responseMessage = Message.newImage(MessageType.ASSISTANT, parsed.imageUrl);
      } else {
        responseMessage = Message.new(MessageType.ASSISTANT, parsed.content);
      }

      this.appendMessage(responseMessage);
      return responseMessage;

    } catch (error) {
      throw new Error(`Request failed: ${error.message}`);
    }
  }

  /**
   * Sends a message and returns a stream of response chunks.
   * 
   * @param {string} model - The model to use for the request
   * @param {Message} newMessage - The message to send (optional)
   * @param {Config} config - Configuration options
   * @returns {AsyncGenerator<{chunk: string, complete: boolean, fullMessage?: Message}>} Stream of response chunks
   */
  async* sendStream(model, newMessage = null, config) {
    if (newMessage) {
      this.appendMessage(newMessage);
    }

    const reasoningEffort = config.reasoningEffort || ReasoningEffort.MEDIUM;
    const threadId = this.threadId || uuidv4();
    this.threadId = threadId;

    // Convert messages to API format
    const messagesJson = this.messages.map(msg => ({
      id: msg.id,
      parts: [{
        type: 'text',
        text: msg.content
      }],
      role: msg.role,
      attachments: []
    }));

    const body = {
      messages: messagesJson,
      threadMetadata: {
        id: threadId
      },
      responseMessageId: uuidv4(),
      model: model,
      convexSessionId: this.convexSessionId,
      modelParams: {
        reasoningEffort: reasoningEffort,
        includeSearch: config.includeSearch
      },
      preferences: {
        name: '',
        occupation: '',
        selectedTraits: [],
        additionalInfo: ''
      },
      userInfo: {
        timezone: 'America/New_York'
      }
    };

    try {
      const response = await this.client.post('https://t3.chat/api/chat', body, {
        headers: {
          'Cookie': this.cookies,
          'Content-Type': 'application/json',
          'Referer': `https://t3.chat/chat/${threadId}`
        },
        responseType: 'stream'
      });

      if (response.status < 200 || response.status >= 300) {
        throw new Error(`Failed to send message: ${response.status}`);
      }

      let fullContent = '';
      let buffer = '';
      let isComplete = false;

      for await (const chunk of response.data) {
        buffer += chunk.toString();
        
        // Process complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer
        
        for (const line of lines) {
          if (line.trim() === '') continue;
          
          const colonPos = line.indexOf(':');
          if (colonPos === -1) continue;

          const code = line.substring(0, colonPos);
          const jsonData = line.substring(colonPos + 1);

          try {
            switch (code) {
              case '0':
                // Text content
                const text = JSON.parse(jsonData);
                if (typeof text === 'string') {
                  fullContent += text;
                  yield { chunk: text, complete: false };
                }
                break;
              case '2':
                // Other data (images, completion signals, etc.)
                const dataArray = JSON.parse(jsonData);
                if (Array.isArray(dataArray)) {
                  for (const item of dataArray) {
                    if (item.type === 'completion' || item.type === 'done') {
                      isComplete = true;
                    }
                  }
                }
                break;
            }
          } catch (e) {
            // Skip invalid JSON lines
            continue;
          }
        }
      }
      
      // Create final message
      const responseMessage = Message.new(MessageType.ASSISTANT, fullContent.trim());
      this.appendMessage(responseMessage);
      yield { chunk: '', complete: true, fullMessage: responseMessage };

    } catch (error) {
      throw new Error(`Streaming request failed: ${error.message}`);
    }
  }


}