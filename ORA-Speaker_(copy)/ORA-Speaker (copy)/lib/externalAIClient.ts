/**
 * External AI Client for video analysis
 * Handles communication with the external AI model API endpoint
 */

import { ExternalAIAnalysis } from './types';
import { createLogger } from './logger';

/**
 * Retry a function with exponential backoff
 * @param fn - Function to retry
 * @param maxRetries - Maximum number of retry attempts
 * @param baseDelay - Base delay in milliseconds (default: 1000ms)
 * @returns Result of the function
 */
/**
 * Validate the structure of the external AI response
 * @param data - Response data to validate
 * @returns true if valid, false otherwise
 */
function isValidExternalAIResponse(data: any): data is ExternalAIAnalysis {
  // Basic validation - ensure it's an object
  if (!data || typeof data !== 'object') {
    return false;
  }

  // Allow flexible structure but ensure it's not empty
  const hasContent = Object.keys(data).length > 0;
  
  return hasContent;
}

// Create logger instance for external AI client
const logger = createLogger('ExternalAI');

/**
 * Retry a function with exponential backoff
 * @param fn - Function to retry
 * @param maxRetries - Maximum number of retry attempts
 * @param baseDelay - Base delay in milliseconds (default: 1000ms)
 * @returns Result of the function
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      // Don't retry on the last attempt
      if (attempt === maxRetries - 1) {
        break;
      }

      // Check if error is retryable (network errors, timeouts, 5xx status codes)
      const isRetryable = 
        lastError.message.includes('timed out') ||
        lastError.message.includes('network') ||
        lastError.message.includes('ECONNREFUSED') ||
        lastError.message.includes('ETIMEDOUT') ||
        lastError.message.includes('status 5');

      if (!isRetryable) {
        // Don't retry on client errors (4xx) or other non-retryable errors
        logger.error('Non-retryable error encountered', {
          error: lastError.message,
          attempt: attempt + 1,
          maxRetries,
        });
        throw lastError;
      }

      // Calculate delay with exponential backoff: 1s, 2s, 4s
      const delay = baseDelay * Math.pow(2, attempt);
      logger.warn('Retrying after error', {
        attempt: attempt + 1,
        maxRetries,
        delay: `${delay}ms`,
        error: lastError.message,
      });
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

export interface ExternalAIClientConfig {
  apiUrl: string;
  apiKey?: string;
  timeout: number;
  maxRetries: number;
}

export class ExternalAIClient {
  private config: ExternalAIClientConfig;

  constructor(config: ExternalAIClientConfig) {
    this.config = config;
  }

  /**
   * Send video to external AI model for analysis
   * @param videoBuffer - Video file as Buffer
   * @param mimeType - Video MIME type (e.g., 'video/mp4')
   * @returns Structured JSON analysis
   */
  async analyzeVideo(
    videoBuffer: Buffer,
    mimeType: string
  ): Promise<ExternalAIAnalysis> {
    const timer = logger.startTimer('external_ai_analysis');
    
    logger.logAPIRequest({
      url: this.config.apiUrl,
      method: 'POST',
      bodySize: videoBuffer.length,
      timeout: this.config.timeout,
    });

    return withRetry(
      async () => {
        const formData = new FormData();
        
        // Create a Blob from the buffer for multipart/form-data
        // Use Buffer.from to ensure we have a proper Buffer, then cast to any to satisfy TypeScript
        const blob = new Blob([Buffer.from(videoBuffer) as any], { type: mimeType });
        formData.append('file', blob, 'video.mp4');

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        try {
          const headers: HeadersInit = {};
          if (this.config.apiKey) {
            headers['Authorization'] = `Bearer ${this.config.apiKey}`;
          }

          const response = await fetch(this.config.apiUrl, {
            method: 'POST',
            headers,
            body: formData,
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          const statusCode = response.status;
          const statusText = response.statusText;

          if (!response.ok) {
            const duration = Date.now() - timer.startTime;
            logger.logAPIResponse({
              url: this.config.apiUrl,
              statusCode,
              statusText,
              duration,
              success: false,
            });
            throw new Error(
              `External AI API returned status ${statusCode}: ${statusText}`
            );
          }

          // Parse JSON response
          let data: any;
          try {
            data = await response.json();
          } catch (parseError) {
            const duration = Date.now() - timer.startTime;
            logger.error('Failed to parse JSON response', {
              error: parseError instanceof Error ? parseError.message : 'Unknown parse error',
              statusCode,
              duration,
            });
            throw new Error('External AI API returned malformed JSON response');
          }

          // Validate response structure
          if (!isValidExternalAIResponse(data)) {
            const duration = Date.now() - timer.startTime;
            logger.error('Invalid response structure', {
              statusCode,
              responseKeys: Object.keys(data || {}),
              duration,
            });
            throw new Error('External AI API returned invalid response structure');
          }

          const duration = logger.endTimer(timer);
          logger.logAPIResponse({
            url: this.config.apiUrl,
            statusCode,
            responseSize: JSON.stringify(data).length,
            duration,
            success: true,
          });

          return data as ExternalAIAnalysis;
        } catch (error) {
          clearTimeout(timeoutId);
          
          if (error instanceof Error) {
            if (error.name === 'AbortError') {
              const duration = Date.now() - timer.startTime;
              logger.error('Request timeout', {
                timeout: this.config.timeout,
                duration,
              });
              const timeoutError = new Error(
                `External AI API request timed out after ${this.config.timeout}ms`
              );
              throw timeoutError;
            }
            throw error;
          }
          throw new Error('Unknown error occurred during external AI analysis');
        }
      },
      this.config.maxRetries,
      1000 // 1 second base delay
    );
  }

  /**
   * Check if external AI service is available
   * @returns true if service is healthy, false otherwise
   */
  async healthCheck(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout for health check

      const healthUrl = this.config.apiUrl.replace('/analyze/', '/health');
      
      const response = await fetch(healthUrl, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.error('External AI health check failed:', error);
      return false;
    }
  }
}
