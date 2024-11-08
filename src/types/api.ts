export interface User {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number?: string;
  }
  
  export interface Account {
    id: string;
    name: string;
    users?: AccountUser[];
    sites?: Site[];
    installs?: Installation[];
  }
  
  export interface AccountUser {
    user_id: string;
    account_id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    invite_accepted: boolean;
    mfa_enabled: boolean;
    roles: string;
    last_owner?: boolean;
    installs?: {
      id: string;
      name: string;
    }[];
  }
  
  export interface Site {
    id: string;
    name: string;
    account: {
      id: string;
    };
    group_name?: string;
    tags?: string[];
    installs?: Installation[];
  }
  
  export interface Installation {
    id: string;
    name: string;
    account: {
      id: string;
    };
    php_version?: string;
    status?: string;
    environment?: string;
  }
  
  export interface PaginatedResponse<T> {
    results: T[];
    count: number;
    next?: string;
    previous?: string;
  }