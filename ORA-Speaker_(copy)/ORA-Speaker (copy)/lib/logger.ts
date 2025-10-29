/**
 * Structured logging utility for AI model integration
 * Provides consistent logging format across the application
 */

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogContext {
  [key: string]: any;
}

export interface PerformanceMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  operation: string;
}

/**
 * Structured logger for external AI operations
 */
export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  /**
   * Log a message with structured context
   */
  private log(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      context: this.context,
      message,
      ...context,
    };

    const logMethod = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    logMethod(`[${this.context}] ${message}`, JSON.stringify(logEntry, null, 2));
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  }

  error(message: string, context?: LogContext) {
    this.log('error', message, context);
  }

  debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV === 'development') {
      this.log('debug', message, context);
    }
  }

  /**
   * Log external API request details
   */
  logAPIRequest(details: {
    url: string;
    method: string;
    headers?: Record<string, string>;
    bodySize?: number;
    timeout?: number;
  }) {
    this.info('External API request initiated', {
      type: 'api_request',
      ...details,
    });
  }

  /**
   * Log external API response details
   */
  logAPIResponse(details: {
    url: string;
    statusCode: number;
    statusText?: string;
    responseSize?: number;
    duration: number;
    success: boolean;
  }) {
    const level = details.success ? 'info' : 'error';
    this.log(level, 'External API response received', {
      type: 'api_response',
      ...details,
    });
  }

  /**
   * Log fallback trigger with context
   */
  logFallback(details: {
    reason: string;
    originalError?: string;
    fallbackMethod: string;
    triggeredBy: string;
  }) {
    this.warn('Fallback triggered', {
      type: 'fallback',
      ...details,
    });
  }

  /**
   * Log performance metrics
   */
  logPerformance(metrics: PerformanceMetrics) {
    const duration = metrics.duration || (metrics.endTime ? metrics.endTime - metrics.startTime : 0);
    this.info('Performance metric', {
      type: 'performance',
      operation: metrics.operation,
      duration: `${duration}ms`,
      startTime: new Date(metrics.startTime).toISOString(),
      endTime: metrics.endTime ? new Date(metrics.endTime).toISOString() : undefined,
    });
  }

  /**
   * Start a performance timer
   */
  startTimer(operation: string): PerformanceMetrics {
    return {
      startTime: Date.now(),
      operation,
    };
  }

  /**
   * End a performance timer and log the result
   */
  endTimer(metrics: PerformanceMetrics): number {
    metrics.endTime = Date.now();
    metrics.duration = metrics.endTime - metrics.startTime;
    this.logPerformance(metrics);
    return metrics.duration;
  }
}

/**
 * Create a logger instance for a specific context
 */
export function createLogger(context: string): Logger {
  return new Logger(context);
}
