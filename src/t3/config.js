/**
 * Represents the reasoning effort levels.
 */
export class ReasoningEffort {
  static LOW = 'low';
  static MEDIUM = 'medium';
  static HIGH = 'high';
}

/**
 * Configuration class for t3.chat requests.
 */
export class Config {
  constructor(reasoningEffort = ReasoningEffort.MEDIUM, includeSearch = false) {
    this.reasoningEffort = reasoningEffort;
    this.includeSearch = includeSearch;
  }

  /**
   * Creates a new Config with default settings.
   * 
   * @returns {Config} A new Config instance with default values
   */
  static new() {
    return new Config();
  }

  /**
   * Creates a config builder for fluent configuration.
   * 
   * @returns {ConfigBuilder} A new ConfigBuilder instance
   */
  static builder() {
    return new ConfigBuilder();
  }
}

/**
 * Builder class for creating Config instances with fluent API.
 */
export class ConfigBuilder {
  constructor() {
    this.reasoningEffort = ReasoningEffort.MEDIUM;
    this.includeSearch = false;
  }

  /**
   * Sets the reasoning effort level.
   * 
   * @param {string} effort - The reasoning effort level
   * @returns {ConfigBuilder} This builder instance for chaining
   */
  setReasoningEffort(effort) {
    this.reasoningEffort = effort;
    return this;
  }

  /**
   * Sets whether to include search in requests.
   * 
   * @param {boolean} include - Whether to include search
   * @returns {ConfigBuilder} This builder instance for chaining
   */
  setIncludeSearch(include) {
    this.includeSearch = include;
    return this;
  }

  /**
   * Builds the final Config instance.
   * 
   * @returns {Config} A new Config instance with the specified settings
   */
  build() {
    return new Config(this.reasoningEffort, this.includeSearch);
  }
}