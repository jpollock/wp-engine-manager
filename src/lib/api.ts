import { Logger } from './logger';
import type { 
  Account, 
  Installation, 
  Site, 
  AccountUser,
  ListAccounts200Response,
  ListSites200Response,
  ListInstalls200Response,
  ListAccountUsers200Response
} from '@elasticapi/wpengine-typescript-sdk';

export class APIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'APIError';
  }
}

class API {
  private baseUrl = 'https://api.wpengineapi.com/v1';
  private credentials: { username: string; password: string } | null = null;

  setCredentials(username: string, password: string) {
    this.credentials = { username, password };
    Logger.info('API credentials set');
  }

  private getHeaders() {
    if (!this.credentials) {
      throw new APIError(401, 'API credentials not set');
    }

    const { username, password } = this.credentials;
    return {
      'Authorization': `Basic ${btoa(`${username}:${password}`)}`,
      'Content-Type': 'application/json',
    };
  }

  async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const method = options.method?.toLowerCase() || 'get';

    try {
      Logger.info(`API Request: ${method.toUpperCase()} ${endpoint}`);

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new APIError(response.status, error.message || 'API request failed');
      }

      const responseData = await response.json();

      // Handle list endpoints that return paginated results
      if (responseData.results) {
        return responseData as T;
      }

      // Handle single resource endpoints
      const [resource] = endpoint.split('/').filter(Boolean);
      switch (resource) {
        case 'accounts':
          return { results: [responseData] } as T;
        case 'sites':
          return { results: [responseData] } as T;
        case 'installs':
          return { results: [responseData] } as T;
        case 'account_users':
          return { results: [responseData] } as T;
        default:
          return responseData as T;
      }
    } catch (error) {
      Logger.error(
        `API Error: ${method.toUpperCase()} ${endpoint}`,
        error instanceof Error ? error : new Error(String(error))
      );
      
      if (error instanceof APIError) {
        throw error;
      }
      
      if (error instanceof Error) {
        throw new APIError(
          500,
          error.message || 'An error occurred while making the request'
        );
      }
      
      throw new APIError(500, 'Unknown error occurred');
    }
  }
}

export const api = new API();
