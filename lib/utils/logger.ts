/**
 * Production-safe logging utility
 * Replaces console.log statements throughout the application
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: string;
  context?: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isClient = typeof window !== 'undefined';

  private formatMessage(level: LogLevel, message: string, context?: string): string {
    const timestamp = new Date().toISOString();
    const prefix = context ? `[${context}]` : '';
    return `${timestamp} ${level.toUpperCase()} ${prefix} ${message}`;
  }

  private shouldLog(level: LogLevel): boolean {
    // In production, only log warnings and errors
    if (!this.isDevelopment) {
      return level === 'warn' || level === 'error';
    }
    return true;
  }

  private logToConsole(level: LogLevel, message: string, data?: any): void {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(level, message);
    
    switch (level) {
      case 'debug':
        console.debug(formattedMessage, data);
        break;
      case 'info':
        console.info(formattedMessage, data);
        break;
      case 'warn':
        console.warn(formattedMessage, data);
        break;
      case 'error':
        console.error(formattedMessage, data);
        break;
    }
  }

  debug(message: string, data?: any, context?: string): void {
    this.logToConsole('debug', message, data);
  }

  info(message: string, data?: any, context?: string): void {
    this.logToConsole('info', message, data);
  }

  warn(message: string, data?: any, context?: string): void {
    this.logToConsole('warn', message, data);
  }

  error(message: string, error?: any, context?: string): void {
    this.logToConsole('error', message, error);
    
    // In production, could send to error tracking service
    if (!this.isDevelopment && this.isClient) {
      // TODO: Integrate with Sentry or similar
    }
  }
}

export const logger = new Logger();
export default logger;