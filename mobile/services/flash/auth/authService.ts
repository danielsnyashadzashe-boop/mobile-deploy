/**
 * Flash Partner API v4 Authentication Service
 * Handles OAuth 2.0 authentication with automatic token refresh
 */

import axios, { AxiosInstance } from 'axios';
import { FlashSecureStorage, FlashCredentials } from './secureStorage';
import {
  TokenRequest,
  TokenResponse,
  AuthError,
  FlashApiErrorResponse
} from '../types/auth.types';
import {
  FLASH_CONFIG,
  AUTH_CONFIG,
  QA_CREDENTIALS,
  HTTP_STATUS,
  ERROR_MESSAGES
} from '../utils/constants';
import { getApiBaseUrl, getEnvConfig, logger, getRequestTimeout } from '../utils/environment';
import { withRetry } from '../utils/retryHelper';

/**
 * Flash API Authentication Service
 * Manages OAuth tokens, automatic refresh, and secure credential storage
 */
export class FlashAuthService {
  private static instance: FlashAuthService;
  private axiosInstance: AxiosInstance;
  private refreshPromise: Promise<string> | null = null;

  private constructor() {
    // Use environment-specific base URL
    const baseURL = getApiBaseUrl();
    const timeout = getRequestTimeout();

    logger.info(`Initializing Flash Auth Service with base URL: ${baseURL}`);

    this.axiosInstance = axios.create({
      baseURL,
      timeout,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): FlashAuthService {
    if (!FlashAuthService.instance) {
      FlashAuthService.instance = new FlashAuthService();
    }
    return FlashAuthService.instance;
  }

  /**
   * Setup axios interceptors for automatic token handling
   */
  private setupInterceptors(): void {
    // Request interceptor - add authorization header
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // Don't add auth header to token endpoint requests
        if (config.url?.includes(AUTH_CONFIG.TOKEN_ENDPOINT)) {
          return config;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle token expiration
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === HTTP_STATUS.UNAUTHORIZED) {
          // Token might be expired, try to refresh
          try {
            const newToken = await this.refreshToken();
            if (newToken && error.config) {
              // Retry original request with new token
              error.config.headers.Authorization = `Bearer ${newToken}`;
              return this.axiosInstance.request(error.config);
            }
          } catch (refreshError) {
            logger.error('Token refresh failed:', refreshError);
          }
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Initialize authentication - set up credentials if needed
   */
  public async initialize(): Promise<void> {
    try {
      const isInitialized = await FlashSecureStorage.isInitialized();
      
      if (!isInitialized) {
        logger.info('Initializing Flash API credentials...');
        await FlashSecureStorage.initializeCredentials();
      }

      // Try to get existing valid token
      const validToken = await FlashSecureStorage.getValidAccessToken();
      if (!validToken) {
        logger.info('No valid token found, requesting new token...');
        await this.requestNewToken();
      }
    } catch (error) {
      logger.error('Failed to initialize Flash authentication:', error);
      throw this.createAuthError('UNKNOWN_ERROR', 'Failed to initialize authentication', error);
    }
  }

  /**
   * Request new access token using OAuth client credentials flow
   */
  public async requestNewToken(): Promise<string> {
    const envConfig = getEnvConfig();

    return withRetry(async () => {
      const credentials = await FlashSecureStorage.getCredentials();

      if (!credentials?.authHeader || !credentials?.accountNumber) {
        throw new Error('Missing authentication credentials');
      }

      const requestData: TokenRequest = {
        grant_type: AUTH_CONFIG.GRANT_TYPE,
      };

      const formData = new URLSearchParams();
      formData.append('grant_type', requestData.grant_type);

      logger.debug('Requesting new access token from Flash API');

      const response = await this.axiosInstance.post<TokenResponse>(
        AUTH_CONFIG.TOKEN_ENDPOINT,
        formData,
        {
          headers: {
            'Authorization': `Basic ${credentials.authHeader}`,
          },
        }
      );

      if (!response.data.access_token) {
        throw new Error('No access token in response');
      }

      // Calculate expiration timestamp (current time + expires_in seconds - buffer)
      const expiresAt = Date.now() + (response.data.expires_in * 1000) - envConfig.tokenExpiryBuffer;

      // Update stored credentials with new token
      await FlashSecureStorage.updateToken(response.data.access_token, expiresAt);

      logger.info('Successfully obtained new access token');
      return response.data.access_token;

    }, {
      maxAttempts: envConfig.maxRetries,
      initialDelay: envConfig.retryDelay,
      shouldRetry: (error) => {
        // Don't retry on authentication errors (401/403)
        if (error.response?.status === 401 || error.response?.status === 403) {
          return false;
        }
        // Retry on network errors and server errors
        return !error.response || error.response.status >= 500;
      },
      onRetry: (error, attempt, nextDelay) => {
        logger.warn(`Token request failed (attempt ${attempt}), retrying in ${nextDelay}ms:`, error.message);
      },
    }).catch((error: any) => {
      logger.error('Failed to request new token:', error);

      if (error.response?.data) {
        const flashError: FlashApiErrorResponse = error.response.data;
        throw this.createAuthError(
          'INVALID_CREDENTIALS',
          flashError.error_description || flashError.error || ERROR_MESSAGES.AUTHENTICATION,
          error
        );
      }

      throw this.createAuthError('NETWORK_ERROR', ERROR_MESSAGES.NETWORK, error);
    });
  }

  /**
   * Refresh access token (with deduplication)
   */
  public async refreshToken(): Promise<string> {
    // Prevent multiple simultaneous refresh requests
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performTokenRefresh();
    
    try {
      const token = await this.refreshPromise;
      this.refreshPromise = null;
      return token;
    } catch (error) {
      this.refreshPromise = null;
      throw error;
    }
  }

  /**
   * Perform actual token refresh
   */
  private async performTokenRefresh(): Promise<string> {
    try {
      const isExpired = await FlashSecureStorage.isTokenExpired();
      
      if (!isExpired) {
        const validToken = await FlashSecureStorage.getValidAccessToken();
        if (validToken) {
          return validToken;
        }
      }

      logger.debug('Token expired or invalid, requesting new token...');
      return await this.requestNewToken();

    } catch (error) {
      logger.error('Token refresh failed:', error);
      throw this.createAuthError('TOKEN_EXPIRED', 'Failed to refresh authentication token', error);
    }
  }

  /**
   * Get valid access token (with automatic refresh if needed)
   */
  public async getValidAccessToken(): Promise<string> {
    try {
      const isExpired = await FlashSecureStorage.isTokenExpired();
      
      if (isExpired) {
        return await this.refreshToken();
      }

      const validToken = await FlashSecureStorage.getValidAccessToken();
      if (!validToken) {
        return await this.refreshToken();
      }

      return validToken;
    } catch (error) {
      logger.error('Failed to get valid access token:', error);
      throw this.createAuthError('TOKEN_EXPIRED', 'Unable to obtain valid access token', error);
    }
  }

  /**
   * Check if currently authenticated
   */
  public async isAuthenticated(): Promise<boolean> {
    try {
      const validToken = await FlashSecureStorage.getValidAccessToken();
      return !!validToken;
    } catch (error) {
      logger.error('Authentication check failed:', error);
      return false;
    }
  }

  /**
   * Get authentication headers for API requests
   */
  public async getAuthHeaders(): Promise<Record<string, string>> {
    try {
      const token = await this.getValidAccessToken();
      return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };
    } catch (error) {
      logger.error('Failed to get auth headers:', error);
      throw this.createAuthError('TOKEN_EXPIRED', 'Unable to get authentication headers', error);
    }
  }

  /**
   * Clear all authentication data (logout)
   */
  public async logout(): Promise<void> {
    try {
      await FlashSecureStorage.clearCredentials();
      logger.info('Successfully logged out and cleared credentials');
    } catch (error) {
      logger.error('Failed to logout:', error);
      // Don't throw here - logout should be best effort
    }
  }

  /**
   * Get current account number
   */
  public async getAccountNumber(): Promise<string | null> {
    try {
      const credentials = await FlashSecureStorage.getCredentials();
      return credentials?.accountNumber || null;
    } catch (error) {
      logger.error('Failed to get account number:', error);
      return null;
    }
  }

  /**
   * Test authentication with a simple API call
   */
  public async testAuthentication(): Promise<boolean> {
    try {
      const headers = await this.getAuthHeaders();
      
      // Make a simple test request (you can replace this with an actual Flash API endpoint)
      const response = await this.axiosInstance.get('/test', { headers });
      
      return response.status === HTTP_STATUS.OK;
    } catch (error: any) {
      logger.error('Authentication test failed:', error);
      
      if (error.response?.status === HTTP_STATUS.UNAUTHORIZED) {
        return false;
      }
      
      // If endpoint doesn't exist but we got a different error, auth might be working
      return error.response?.status !== HTTP_STATUS.UNAUTHORIZED;
    }
  }

  /**
   * Make authenticated request with automatic token handling
   */
  public async makeAuthenticatedRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
    customHeaders?: Record<string, string>
  ): Promise<T> {
    try {
      const headers = {
        ...(await this.getAuthHeaders()),
        ...customHeaders,
      };

      const config = {
        method,
        url: endpoint,
        headers,
        ...(data && { data }),
      };

      const response = await this.axiosInstance.request(config);
      return response.data;
    } catch (error: any) {
      logger.error(`API request failed [${method} ${endpoint}]:`, error);
      
      if (error.response?.data) {
        throw error.response.data;
      }
      
      throw this.createAuthError('NETWORK_ERROR', ERROR_MESSAGES.NETWORK, error);
    }
  }

  /**
   * Create standardized auth error
   */
  private createAuthError(
    code: AuthError['code'], 
    message: string, 
    originalError?: any
  ): AuthError {
    return {
      code,
      message,
      originalError,
    };
  }

  /**
   * Get axios instance for direct use (with interceptors)
   */
  public getAxiosInstance(): AxiosInstance {
    return this.axiosInstance;
  }
}