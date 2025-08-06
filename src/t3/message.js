import { v4 as uuidv4 } from 'uuid';

/**
 * Represents the role type in a message.
 */
export class MessageType {
  static ASSISTANT = 'assistant';
  static USER = 'user';
}

/**
 * Represents the content type of a message.
 */
export class ContentType {
  constructor(type, data) {
    this.type = type;
    this.data = data;
  }

  static text(content) {
    return new ContentType('text', content);
  }

  static image(url, base64 = null) {
    return new ContentType('image', { url, base64 });
  }

  isText() {
    return this.type === 'text';
  }

  isImage() {
    return this.type === 'image';
  }

  getText() {
    return this.isText() ? this.data : null;
  }

  getImageUrl() {
    return this.isImage() ? this.data.url : null;
  }

  getImageBase64() {
    return this.isImage() ? this.data.base64 : null;
  }
}

/**
 * Represents a message with a role, content, and unique ID.
 */
export class Message {
  constructor(id, role, content, contentType) {
    this.id = id;
    this.role = role;
    this.content = content;
    this.contentType = contentType;
  }

  /**
   * Creates a new text Message with a randomly generated ID.
   * 
   * @param {string} role - The role of the message sender (MessageType.ASSISTANT or MessageType.USER)
   * @param {string} content - The content of the message
   * @returns {Message} A new instance of Message with a unique ID
   */
  static new(role, content) {
    return new Message(
      uuidv4(),
      role,
      content,
      ContentType.text(content)
    );
  }

  /**
   * Creates a new image Message with a randomly generated ID.
   * 
   * @param {string} role - The role of the message sender
   * @param {string} url - The URL of the image
   * @param {string|null} base64 - Optional base64 encoded image data
   * @returns {Message} A new instance of image Message with a unique ID
   */
  static newImage(role, url, base64 = null) {
    return new Message(
      uuidv4(),
      role,
      url,
      ContentType.image(url, base64)
    );
  }

  /**
   * Creates a new Message with a specific ID.
   * 
   * @param {string} id - The specific ID for the message
   * @param {string} role - The role of the message sender
   * @param {string} content - The content of the message
   * @returns {Message} A new instance of Message with the specified ID
   */
  static withId(id, role, content) {
    return new Message(
      id,
      role,
      content,
      ContentType.text(content)
    );
  }
}