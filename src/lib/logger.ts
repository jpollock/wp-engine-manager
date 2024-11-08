type LogLevel = 'info' | 'warn' | 'error';

export class Logger {
  static log(level: LogLevel, message: string, ...args: any[]) {
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

  static info(message: string, ...args: any[]) {
    this.log('info', message, ...args);
  }

  static warn(message: string, ...args: any[]) {
    this.log('warn', message, ...args);
  }

  static error(message: string, ...args: any[]) {
    this.log('error', message, ...args);
  }
}