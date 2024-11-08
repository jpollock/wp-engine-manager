// src/lib/logger.ts
type LogLevel = 'info' | 'warn' | 'error';
type LogArgs = string | number | boolean | null | undefined | object | Error;

export class Logger {
  static log(level: LogLevel, message: string, ...args: LogArgs[]) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    switch (level) {
      case 'info':
        console.log(logMessage, ...args);
        break;
      case 'warn':
        console.warn(logMessage, ...args);
        break;
      case 'error':
        console.error(logMessage, ...args);
        break;
    }
  }

  static info(message: string, ...args: LogArgs[]) {
    this.log('info', message, ...args);
  }

  static warn(message: string, ...args: LogArgs[]) {
    this.log('warn', message, ...args);
  }

  static error(message: string, ...args: LogArgs[]) {
    this.log('error', message, ...args);
  }
}