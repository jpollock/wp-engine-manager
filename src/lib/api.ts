import { Logger } from './logger';

export class APIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'APIError';
  }
}

export const api = {
  baseUrl: 'https://api.wpengineapi.com/v1',
  credentials: {
    username: '',
    password: ''
  },

  setCredentials(username: string, password: string) {
    this.credentials = { username, password };
  },

  getHeaders() {
    return {
      'Authorization': `Basic ${btoa(`${this.credentials.username}:${this.credentials.password}`)}`,
      'Content-Type': 'application/json',
    };
  },

  async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = this.getHeaders();

    try {
      Logger.info(`API Request: ${options.method || 'GET'} ${endpoint}`);
      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new APIError(response.status, error.message || 'API request failed');
      }

      const data = await response.json();
      Logger.info(`API Response: ${options.method || 'GET'} ${endpoint} - Success`);
      return data as T;
    } catch (error) {
      Logger.error(`API Error: ${options.method || 'GET'} ${endpoint}`, error);
      throw error;
    }
  }
};
