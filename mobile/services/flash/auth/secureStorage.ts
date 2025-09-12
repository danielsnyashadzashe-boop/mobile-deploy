import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Flash API Secure Storage Service
 * Handles secure storage of sensitive authentication data
 * 
 * SECURITY NOTES:
 * - On iOS/Android: Uses expo-secure-store (hardware-encrypted keychain/keystore)
 * - On Web (DEV ONLY): Falls back to localStorage for testing purposes
 * 
 * WARNING: Web fallback is for development/testing only and should NEVER be used in production
 */

// Storage keys for Flash API credentials
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'flash_access_token',
  REFRESH_TOKEN: 'flash_refresh_token', 
  TOKEN_EXPIRES_AT: 'flash_token_expires_at',
  AUTH_HEADER: 'flash_auth_header',
  ACCOUNT_NUMBER: 'flash_account_number',
} as const;

/**
 * Platform-aware storage adapter
 * Detects runtime platform and uses appropriate storage mechanism
 */
class StorageAdapter {
  private isWeb: boolean;
  private hasWarnedAboutWeb: boolean = false;
  
  constructor() {
    this.isWeb = Platform.OS === 'web';
    
    if (this.isWeb && !this.hasWarnedAboutWeb) {
      console.warn(
        '⚠️ Flash API: Using localStorage fallback for web development.\n' +
        'This is insecure and should only be used for testing.\n' +
        'Production builds must run on iOS/Android with expo-secure-store.'
      );
      this.hasWarnedAboutWeb = true;
      
      // Initialize default credentials in web for easier testing
      this.initializeWebDefaults();
    }
  }

  /**
   * Initialize default credentials for web testing
   */
  private async initializeWebDefaults(): Promise<void> {
    if (this.isWeb && typeof window !== 'undefined' && window.localStorage) {
      // Check if already initialized
      const authHeader = window.localStorage.getItem(STORAGE_KEYS.AUTH_HEADER);
      if (!authHeader) {
        console.log('🔧 Initializing Flash API test credentials for web development...');
        // These are the QA sandbox credentials from the documentation
        window.localStorage.setItem(
          STORAGE_KEYS.AUTH_HEADER, 
          'UF92SGh4Q1RjZnNYMUJFNmZkTGdTcl9JeVRRYTpaSTN4TjkwN2ZHbjB4X0dqOWdCNGkyTWc0V29h'
        );
        window.localStorage.setItem(
          STORAGE_KEYS.ACCOUNT_NUMBER, 
          '8058-7467-3755-5732'
        );
        console.log('✅ Flash API test credentials initialized for web');
      }
    }
  }

  /**
   * Set an item in storage
   */
  async setItem(key: string, value: string, options?: any): Promise<void> {
    if (this.isWeb) {
      // Web fallback: Use localStorage (DEV ONLY)
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, value);
          console.log(`💾 [Web Storage] Saved ${key}`);
        } else {
          throw new Error('localStorage is not available');
        }
      } catch (error) {
        console.error(`❌ Failed to store ${key} in localStorage:`, error);
        throw new Error(`Storage error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      // Native: Use expo-secure-store
      try {
        await SecureStore.setItemAsync(key, value, options);
      } catch (error) {
        console.error(`❌ Failed to store ${key} in SecureStore:`, error);
        throw new Error(`Secure storage error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  /**
   * Get an item from storage
   */
  async getItem(key: string, options?: any): Promise<string | null> {
    if (this.isWeb) {
      // Web fallback: Use localStorage (DEV ONLY)
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const value = window.localStorage.getItem(key);
          if (value) {
            console.log(`📖 [Web Storage] Retrieved ${key}`);
          }
          return value;
        }
        return null;
      } catch (error) {
        console.error(`❌ Failed to retrieve ${key} from localStorage:`, error);
        return null;
      }
    } else {
      // Native: Use expo-secure-store
      try {
        return await SecureStore.getItemAsync(key, options);
      } catch (error) {
        console.error(`❌ Failed to retrieve ${key} from SecureStore:`, error);
        return null;
      }
    }
  }

  /**
   * Delete an item from storage
   */
  async deleteItem(key: string, options?: any): Promise<void> {
    if (this.isWeb) {
      // Web fallback: Use localStorage (DEV ONLY)
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
          console.log(`🗑️ [Web Storage] Deleted ${key}`);
        }
      } catch (error) {
        console.error(`❌ Failed to delete ${key} from localStorage:`, error);
        // Don't throw on delete errors - best effort
      }
    } else {
      // Native: Use expo-secure-store
      try {
        await SecureStore.deleteItemAsync(key, options);
      } catch (error) {
        console.error(`❌ Failed to delete ${key} from SecureStore:`, error);
        // Don't throw on delete errors - best effort
      }
    }
  }

  /**
   * Check if we're in a secure environment
   */
  isSecure(): boolean {
    return !this.isWeb;
  }

  /**
   * Get platform name for debugging
   */
  getPlatform(): string {
    return this.isWeb ? 'web (localStorage)' : 'native (SecureStore)';
  }
}

// Create singleton storage adapter instance
const storage = new StorageAdapter();

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
        storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, credentials.accessToken, options),
        storage.setItem(STORAGE_KEYS.TOKEN_EXPIRES_AT, credentials.expiresAt.toString(), options),
        storage.setItem(STORAGE_KEYS.AUTH_HEADER, credentials.authHeader, options),
        storage.setItem(STORAGE_KEYS.ACCOUNT_NUMBER, credentials.accountNumber, options),
        credentials.refreshToken ? 
          storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, credentials.refreshToken, options) : 
          Promise.resolve()
      ]);
      
      console.log(`✅ Flash credentials stored successfully on ${storage.getPlatform()}`);
    } catch (error) {
      console.error('❌ Failed to store Flash credentials:', error);
      throw new Error(`Failed to store credentials: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
        storage.getItem(STORAGE_KEYS.ACCESS_TOKEN, options),
        storage.getItem(STORAGE_KEYS.REFRESH_TOKEN, options),
        storage.getItem(STORAGE_KEYS.TOKEN_EXPIRES_AT, options),
        storage.getItem(STORAGE_KEYS.AUTH_HEADER, options),
        storage.getItem(STORAGE_KEYS.ACCOUNT_NUMBER, options),
      ]);

      // For initial setup, we might only have authHeader and accountNumber
      if (!authHeader || !accountNumber) {
        console.log('⚠️ No Flash credentials found in storage');
        return null;
      }

      // If we have auth header but no access token, return partial credentials
      // This allows the auth service to request a new token
      if (!accessToken) {
        console.log('📝 Found auth header but no access token - will request new token');
        return {
          accessToken: '', // Empty token will trigger refresh
          refreshToken: refreshToken || undefined,
          expiresAt: 0, // Expired timestamp will trigger refresh
          authHeader,
          accountNumber,
        };
      }

      return {
        accessToken,
        refreshToken: refreshToken || undefined,
        expiresAt: parseInt(expiresAt || '0', 10),
        authHeader,
        accountNumber,
      };
    } catch (error) {
      console.error('❌ Failed to retrieve Flash credentials:', error);
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
        storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken, options),
        storage.setItem(STORAGE_KEYS.TOKEN_EXPIRES_AT, expiresAt.toString(), options),
      ]);
      
      console.log(`✅ Flash token updated successfully on ${storage.getPlatform()}`);
    } catch (error) {
      console.error('❌ Failed to update Flash token:', error);
      throw new Error(`Failed to update token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if stored token is expired
   */
  static async isTokenExpired(): Promise<boolean> {
    try {
      const credentials = await this.getCredentials();
      if (!credentials || !credentials.accessToken) {
        return true; // No token means expired
      }

      // Add 5-minute buffer before actual expiration
      const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
      const currentTime = Date.now();
      
      const isExpired = currentTime >= (credentials.expiresAt - bufferTime);
      if (isExpired) {
        console.log('⏰ Token is expired or about to expire');
      }
      
      return isExpired;
    } catch (error) {
      console.error('❌ Failed to check token expiration:', error);
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
        console.log('⚠️ Token is expired, need to refresh');
        return null;
      }

      const credentials = await this.getCredentials();
      const token = credentials?.accessToken || null;
      
      if (token) {
        console.log('✅ Found valid access token');
      }
      
      return token;
    } catch (error) {
      console.error('❌ Failed to get valid access token:', error);
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
        storage.deleteItem(STORAGE_KEYS.ACCESS_TOKEN, options).catch(() => {}),
        storage.deleteItem(STORAGE_KEYS.REFRESH_TOKEN, options).catch(() => {}),
        storage.deleteItem(STORAGE_KEYS.TOKEN_EXPIRES_AT, options).catch(() => {}),
        storage.deleteItem(STORAGE_KEYS.AUTH_HEADER, options).catch(() => {}),
        storage.deleteItem(STORAGE_KEYS.ACCOUNT_NUMBER, options).catch(() => {}),
      ]);
      
      console.log(`✅ Flash credentials cleared from ${storage.getPlatform()}`);
    } catch (error) {
      console.error('❌ Failed to clear Flash credentials:', error);
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
      if (existingCredentials?.authHeader && existingCredentials?.accountNumber) {
        console.log('✅ Flash credentials already initialized');
        return;
      }

      // Initialize with sandbox credentials from QA document
      const initialCredentials: Partial<FlashCredentials> = {
        authHeader: 'UF92SGh4Q1RjZnNYMUJFNmZkTGdTcl9JeVRRYTpaSTN4TjkwN2ZHbjB4X0dqOWdCNGkyTWc0V29h', // Base64 auth header from QA doc
        accountNumber: '8058-7467-3755-5732', // Account number from QA doc
      };

      // Store initial setup - access token will be obtained via OAuth flow
      await storage.setItem(STORAGE_KEYS.AUTH_HEADER, initialCredentials.authHeader!, {
        requireAuthentication: false,
        keychainService: 'flash-api-credentials',
      });
      
      await storage.setItem(STORAGE_KEYS.ACCOUNT_NUMBER, initialCredentials.accountNumber!, {
        requireAuthentication: false,
        keychainService: 'flash-api-credentials', 
      });

      console.log(`✅ Flash credentials initialized successfully on ${storage.getPlatform()}`);
    } catch (error) {
      console.error('❌ Failed to initialize Flash credentials:', error);
      throw new Error(`Failed to initialize credentials: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
        storage.getItem(STORAGE_KEYS.AUTH_HEADER, options),
        storage.getItem(STORAGE_KEYS.ACCOUNT_NUMBER, options),
      ]);

      const isInit = !!(authHeader && accountNumber);
      console.log(`📊 Flash API initialized: ${isInit} on ${storage.getPlatform()}`);
      
      return isInit;
    } catch (error) {
      console.error('❌ Failed to check initialization status:', error);
      return false;
    }
  }
  
  /**
   * Get security status (for debugging)
   */
  static isSecureEnvironment(): boolean {
    return storage.isSecure();
  }

  /**
   * Get storage platform (for debugging)
   */
  static getStoragePlatform(): string {
    return storage.getPlatform();
  }
}