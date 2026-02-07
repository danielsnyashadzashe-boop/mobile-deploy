/**
 * Flash Partner API v4 Authentication Types
 * Based on Flash Partner API V4 - V2.pdf documentation
 */

// OAuth Token Request/Response Types
export interface TokenRequest {
  grant_type: 'client_credentials';
  scope?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number; // 3600 seconds (60 minutes)
  scope: string;
}

export interface TokenRefreshRequest {
  grant_type: 'refresh_token';
  refresh_token: string;
}

// Authentication State Types
export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  accessToken: string | null;
  expiresAt: number | null;
}

// Auth Service Configuration
export interface FlashAuthConfig {
  baseUrl: string;
  tokenEndpoint: string;
  clientCredentials: {
    authHeader: string; // Base64 encoded Basic auth
    accountNumber: string;
  };
}

// Auth Service Error Types
export interface AuthError {
  code: 'TOKEN_EXPIRED' | 'INVALID_CREDENTIALS' | 'NETWORK_ERROR' | 'UNKNOWN_ERROR';
  message: string;
  originalError?: any;
}

// Flash API Error Response Structure
export interface FlashApiErrorResponse {
  error: string;
  error_description?: string;
  error_code?: string;
  timestamp?: string;
}

// Auth Hook Return Type
export interface UseFlashAuthReturn {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: AuthError | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  clearError: () => void;
}

// Constants for authentication
export const AUTH_CONSTANTS = {
  TOKEN_ENDPOINT: '/oauth/token',
  GRANT_TYPE: 'client_credentials',
  TOKEN_EXPIRY_BUFFER: 5 * 60 * 1000, // 5 minutes in milliseconds
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
} as const;

// Environment Configuration
export interface FlashEnvironment {
  name: 'sandbox' | 'production';
  baseUrl: string;
  description: string;
}

export const FLASH_ENVIRONMENTS: Record<string, FlashEnvironment> = {
  sandbox: {
    name: 'sandbox',
    baseUrl: 'https://api-flashswitch-sandbox.flash-group.com',
    description: 'Sandbox environment for testing',
  },
  production: {
    name: 'production', 
    baseUrl: 'https://api.flashswitch.flash-group.com',
    description: 'Production environment',
  },
} as const;