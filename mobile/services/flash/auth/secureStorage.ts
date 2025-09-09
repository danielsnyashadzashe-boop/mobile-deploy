import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Flash API Secure Storage Service
 * Handles secure storage of sensitive authentication data using expo-secure-store
 */

// Storage keys for Flash API credentials
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'flash_access_token',
  REFRESH_TOKEN: 'flash_refresh_token', 
  TOKEN_EXPIRES_AT: 'flash_token_expires_at',
  AUTH_HEADER: 'flash_auth_header',
  ACCOUNT_NUMBER: 'flash_account_number',
} as const;

export interface FlashCredentials {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number; // Unix timestamp
  authHeader: string; // Base64 encoded Basic auth header
  accountNumber: string;
}

/**
 * Secure storage wrapper for Flash API credentials
 */
export class FlashSecureStorage {
  /**
   * Store Flash API credentials securely
   */
  static async storeCredentials(credentials: FlashCredentials): Promise<void> {
    try {
      const options = {
        requireAuthentication: false, // Don't require biometric auth for better UX
        keychainService: 'flash-api-credentials',
        showModal: false,
      };

      await Promise.all([
        SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, credentials.accessToken, options),
        SecureStore.setItemAsync(STORAGE_KEYS.TOKEN_EXPIRES_AT, credentials.expiresAt.toString(), options),
        SecureStore.setItemAsync(STORAGE_KEYS.AUTH_HEADER, credentials.authHeader, options),
        SecureStore.setItemAsync(STORAGE_KEYS.ACCOUNT_NUMBER, credentials.accountNumber, options),
        credentials.refreshToken ? 
          SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, credentials.refreshToken, options) : 
          Promise.resolve()
      ]);
    } catch (error) {
      console.error('Failed to store Flash credentials:', error);
      throw new Error('Failed to securely store credentials');
    }
  }

  /**
   * Retrieve Flash API credentials from secure storage
   */
  static async getCredentials(): Promise<FlashCredentials | null> {
    try {
      const options = {
        requireAuthentication: false,
        keychainService: 'flash-api-credentials',
        showModal: false,
      };

      const [accessToken, refreshToken, expiresAt, authHeader, accountNumber] = await Promise.all([
        SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN, options),
        SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN, options),
        SecureStore.getItemAsync(STORAGE_KEYS.TOKEN_EXPIRES_AT, options),
        SecureStore.getItemAsync(STORAGE_KEYS.AUTH_HEADER, options),
        SecureStore.getItemAsync(STORAGE_KEYS.ACCOUNT_NUMBER, options),
      ]);

      if (!accessToken || !expiresAt || !authHeader || !accountNumber) {
        return null;
      }

      return {
        accessToken,
        refreshToken: refreshToken || undefined,
        expiresAt: parseInt(expiresAt, 10),
        authHeader,
        accountNumber,
      };
    } catch (error) {
      console.error('Failed to retrieve Flash credentials:', error);
      return null;
    }
  }

  /**
   * Update access token and expiration time
   */
  static async updateToken(accessToken: string, expiresAt: number): Promise<void> {
    try {
      const options = {
        requireAuthentication: false,
        keychainService: 'flash-api-credentials',
        showModal: false,
      };

      await Promise.all([
        SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, accessToken, options),
        SecureStore.setItemAsync(STORAGE_KEYS.TOKEN_EXPIRES_AT, expiresAt.toString(), options),
      ]);
    } catch (error) {
      console.error('Failed to update Flash token:', error);
      throw new Error('Failed to update authentication token');
    }
  }

  /**
   * Check if stored token is expired
   */
  static async isTokenExpired(): Promise<boolean> {
    try {
      const credentials = await this.getCredentials();
      if (!credentials) {
        return true;
      }

      // Add 5-minute buffer before actual expiration
      const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
      const currentTime = Date.now();
      
      return currentTime >= (credentials.expiresAt - bufferTime);
    } catch (error) {
      console.error('Failed to check token expiration:', error);
      return true; // Assume expired if we can't check
    }
  }

  /**
   * Get current access token if valid
   */
  static async getValidAccessToken(): Promise<string | null> {
    try {
      const isExpired = await this.isTokenExpired();
      if (isExpired) {
        return null;
      }

      const credentials = await this.getCredentials();
      return credentials?.accessToken || null;
    } catch (error) {
      console.error('Failed to get valid access token:', error);
      return null;
    }
  }

  /**
   * Clear all Flash API credentials from secure storage
   */
  static async clearCredentials(): Promise<void> {
    try {
      const options = {
        requireAuthentication: false,
        keychainService: 'flash-api-credentials',
      };

      await Promise.all([
        SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN, options).catch(() => {}),
        SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN, options).catch(() => {}),
        SecureStore.deleteItemAsync(STORAGE_KEYS.TOKEN_EXPIRES_AT, options).catch(() => {}),
        SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_HEADER, options).catch(() => {}),
        SecureStore.deleteItemAsync(STORAGE_KEYS.ACCOUNT_NUMBER, options).catch(() => {}),
      ]);
    } catch (error) {
      console.error('Failed to clear Flash credentials:', error);
      // Don't throw here - clearing should be best effort
    }
  }

  /**
   * Initialize Flash API credentials (for first-time setup)
   * This should be called with the sandbox credentials
   */
  static async initializeCredentials(): Promise<void> {
    try {
      // Check if credentials already exist
      const existingCredentials = await this.getCredentials();
      if (existingCredentials) {
        console.log('Flash credentials already initialized');
        return;
      }

      // Initialize with sandbox credentials from QA document
      const initialCredentials: Partial<FlashCredentials> = {
        authHeader: 'UF92SGh4Q1RjZnNYMUJFNmZkTGdTcl9JeVRRYTpaSTN4TjkwN2ZHbjB4X0dqOWdCNGkyTWc0V29h', // Base64 auth header from QA doc
        accountNumber: '8058-7467-3755-5732', // Account number from QA doc
      };

      // Store initial setup - access token will be obtained via OAuth flow
      await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_HEADER, initialCredentials.authHeader!, {
        requireAuthentication: false,
        keychainService: 'flash-api-credentials',
      });
      
      await SecureStore.setItemAsync(STORAGE_KEYS.ACCOUNT_NUMBER, initialCredentials.accountNumber!, {
        requireAuthentication: false,
        keychainService: 'flash-api-credentials', 
      });

      console.log('Flash credentials initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Flash credentials:', error);
      throw new Error('Failed to initialize Flash API credentials');
    }
  }

  /**
   * Get initialization status
   */
  static async isInitialized(): Promise<boolean> {
    try {
      const options = {
        requireAuthentication: false,
        keychainService: 'flash-api-credentials',
      };

      const [authHeader, accountNumber] = await Promise.all([
        SecureStore.getItemAsync(STORAGE_KEYS.AUTH_HEADER, options),
        SecureStore.getItemAsync(STORAGE_KEYS.ACCOUNT_NUMBER, options),
      ]);

      return !!(authHeader && accountNumber);
    } catch (error) {
      console.error('Failed to check initialization status:', error);
      return false;
    }
  }
}