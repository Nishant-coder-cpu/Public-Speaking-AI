/**
 * Error handling utilities for consistent user-facing error messages
 * Provides helpful messages without exposing internal details
 */

export interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
}

export type ErrorCategory = 
  | 'validation'
  | 'configuration'
  | 'network'
  | 'timeout'
  | 'processing'
  | 'storage'
  | 'database'
  | 'unknown';

/**
 * Create a user-friendly error response
 * @param category - Category of error
 * @param internalMessage - Internal error message (for logging)
 * @returns User-friendly error response
 */
export function createErrorResponse(
  category: ErrorCategory,
  internalMessage?: string
): ErrorResponse {
  const errorMessages: Record<ErrorCategory, string> = {
    validation: 'Invalid request. Please check your input and try again.',
    configuration: 'Service is temporarily unavailable. Please try again later.',
    network: 'Unable to connect to the service. Please check your connection and try again.',
    timeout: 'The request is taking longer than expected. Please try again.',
    processing: 'Failed to process your request. Please try again.',
    storage: 'Failed to access video storage. Please try again.',
    database: 'Failed to save your data. Please try again.',
    unknown: 'An unexpected error occurred. Please try again.',
  };

  return {
    success: false,
    error: errorMessages[category],
    code: category,
  };
}

/**
 * Categorize an error based on its message or type
 * @param error - Error to categorize
 * @returns Error category
 */
export function categorizeError(error: unknown): ErrorCategory {
  if (!(error instanceof Error)) {
    return 'unknown';
  }

  const message = error.message.toLowerCase();

  // Timeout errors
  if (
    message.includes('timeout') ||
    message.includes('timed out') ||
    message.includes('etimedout') ||
    error.name === 'AbortError'
  ) {
    return 'timeout';
  }

  // Network errors
  if (
    message.includes('network') ||
    message.includes('econnrefused') ||
    message.includes('enotfound') ||
    message.includes('fetch failed') ||
    message.includes('failed to fetch')
  ) {
    return 'network';
  }

  // Configuration errors
  if (
    message.includes('not configured') ||
    message.includes('missing') ||
    message.includes('api key') ||
    message.includes('environment variable')
  ) {
    return 'configuration';
  }

  // Storage errors
  if (
    message.includes('s3') ||
    message.includes('storage') ||
    message.includes('download') ||
    message.includes('upload')
  ) {
    return 'storage';
  }

  // Database errors
  if (
    message.includes('database') ||
    message.includes('supabase') ||
    message.includes('insert') ||
    message.includes('query')
  ) {
    return 'database';
  }

  // Processing errors
  if (
    message.includes('process') ||
    message.includes('analyze') ||
    message.includes('gemini') ||
    message.includes('external ai') ||
    message.includes('invalid json') ||
    message.includes('malformed')
  ) {
    return 'processing';
  }

  // Validation errors
  if (
    message.includes('invalid') ||
    message.includes('required') ||
    message.includes('validation')
  ) {
    return 'validation';
  }

  return 'unknown';
}

/**
 * Get HTTP status code for error category
 * @param category - Error category
 * @returns HTTP status code
 */
export function getStatusCode(category: ErrorCategory): number {
  const statusCodes: Record<ErrorCategory, number> = {
    validation: 400,
    configuration: 500,
    network: 503,
    timeout: 504,
    processing: 503,
    storage: 500,
    database: 500,
    unknown: 500,
  };

  return statusCodes[category];
}

/**
 * Handle error and return appropriate response
 * @param error - Error to handle
 * @returns Error response with status code
 */
export function handleError(error: unknown): {
  response: ErrorResponse;
  statusCode: number;
} {
  const category = categorizeError(error);
  const response = createErrorResponse(category, error instanceof Error ? error.message : String(error));
  const statusCode = getStatusCode(category);

  return { response, statusCode };
}
