/**
 * Flash Partner API v4 Base API Service
 * Provides common functionality for all Flash API services
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { FlashAuthService } from '../auth/authService';
import { 
  FLASH_CONFIG, 
  HTTP_STATUS, 
  ERROR_MESSAGES,
  FLASH_ERROR_CODES 
} from '../utils/constants';

// Base API Response Type
export interface BaseApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// API Error Type
export interface ApiError {
  code: string;
  message: string;
  httpStatus?: number;
  originalError?: any;
}

/**
 * Base API service with common functionality
 */
export class BaseApiService {
  protected axiosInstance: AxiosInstance;
  protected authService: FlashAuthService;

  constructor() {
    this.authService = FlashAuthService.getInstance();
    
    this.axiosInstance = axios.create({
      baseURL: FLASH_CONFIG.BASE_URL,
      timeout: FLASH_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Setup axios interceptors for common functionality
   */
  private setupInterceptors(): void {
    // Request interceptor - add authentication and logging
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        try {
          // Add authentication headers (except for token endpoint)
          if (!config.url?.includes('/oauth/token')) {
            const authHeaders = await this.authService.getAuthHeaders();
            config.headers = { ...config.headers, ...authHeaders };
          }

          // Log request in development
          if (__DEV__) {
            console.log(`🚀 API Request [${config.method?.toUpperCase()}] ${config.url}`, {
              headers: config.headers,
              data: config.data,
            });
          }

          return config;
        } catch (error) {
          console.error('Request interceptor error:', error);
          return Promise.reject(error);
        }
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor - handle common errors and logging
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        // Log response in development
        if (__DEV__) {
          console.log(`✅ API Response [${response.status}] ${response.config.url}`, {
            data: response.data,
          });
        }

        return response;
      },
      async (error) => {
        if (__DEV__) {
          console.error(`❌ API Error [${error.response?.status}] ${error.config?.url}`, {
            error: error.response?.data,
            message: error.message,
          });
        }

        // Handle specific HTTP status codes
        if (error.response?.status === HTTP_STATUS.UNAUTHORIZED) {
          // Token expired - try to refresh and retry
          try {
            await this.authService.refreshToken();
            
            // Retry original request with new token
            if (error.config) {
              const authHeaders = await this.authService.getAuthHeaders();
              error.config.headers = { ...error.config.headers, ...authHeaders };
              return this.axiosInstance.request(error.config);
            }
          } catch (refreshError) {
            console.error('Token refresh failed during retry:', refreshError);
            // Return original error if refresh fails
          }
        }

        return Promise.reject(this.normalizeError(error));
      }
    );
  }

  /**
   * Make authenticated API request with error handling
   */
  protected async makeRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
    options: {
      retries?: number;
      customHeaders?: Record<string, string>;
      timeout?: number;
    } = {}
  ): Promise<BaseApiResponse<T>> {
    const { retries = FLASH_CONFIG.RETRY_ATTEMPTS, customHeaders, timeout } = options;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const config = {
          method,
          url: endpoint,
          timeout: timeout || FLASH_CONFIG.TIMEOUT,
          ...(data && { data }),
          ...(customHeaders && { headers: customHeaders }),
        };

        const response = await this.axiosInstance.request<T>(config);
        
        return {
          success: true,
          data: response.data,
        };

      } catch (error: any) {
        // If this is the last attempt or a non-retryable error, throw
        if (attempt === retries || !this.isRetryableError(error)) {
          return {
            success: false,
            error: this.normalizeError(error),
          };
        }

        // Wait before retry
        if (attempt < retries) {
          await this.delay(FLASH_CONFIG.RETRY_DELAY * attempt);
          console.log(`Retrying request (attempt ${attempt + 1}/${retries}): ${endpoint}`);
        }
      }
    }

    // This should never be reached, but just in case
    return {
      success: false,
      error: {
        code: 'MAX_RETRIES_EXCEEDED',
        message: 'Maximum retry attempts exceeded',
      },
    };
  }

  /**
   * GET request
   */
  protected async get<T>(
    endpoint: string, 
    options?: { 
      retries?: number; 
      timeout?: number;
      params?: Record<string, any>;
    }
  ): Promise<BaseApiResponse<T>> {
    const url = options?.params 
      ? `${endpoint}?${new URLSearchParams(options.params).toString()}`
      : endpoint;
      
    return this.makeRequest<T>('GET', url, undefined, options);
  }

  /**
   * POST request
   */
  protected async post<T>(
    endpoint: string, 
    data?: any, 
    options?: { 
      retries?: number; 
      timeout?: number;
      customHeaders?: Record<string, string>;
    }
  ): Promise<BaseApiResponse<T>> {
    return this.makeRequest<T>('POST', endpoint, data, options);
  }

  /**
   * PUT request
   */
  protected async put<T>(
    endpoint: string, 
    data?: any, 
    options?: { 
      retries?: number; 
      timeout?: number;
    }
  ): Promise<BaseApiResponse<T>> {
    return this.makeRequest<T>('PUT', endpoint, data, options);
  }

  /**
   * DELETE request
   */
  protected async delete<T>(
    endpoint: string, 
    options?: { 
      retries?: number; 
      timeout?: number;
    }
  ): Promise<BaseApiResponse<T>> {
    return this.makeRequest<T>('DELETE', endpoint, undefined, options);
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any): boolean {
    // Don't retry authentication errors or client errors (4xx)
    if (error.response?.status >= 400 && error.response?.status < 500) {
      return false;
    }

    // Retry network errors and server errors (5xx)
    return (
      !error.response || // Network error
      error.response.status >= 500 || // Server error
      error.code === 'ECONNABORTED' || // Timeout
      error.code === 'ENOTFOUND' || // DNS error
      error.code === 'ECONNREFUSED' // Connection refused
    );
  }

  /**
   * Normalize error to consistent format
   */
  private normalizeError(error: any): ApiError {
    // Network errors
    if (!error.response) {
      return {
        code: 'NETWORK_ERROR',
        message: ERROR_MESSAGES.NETWORK,
        originalError: error,
      };
    }

    const { status, data } = error.response;

    // Flash API specific errors
    if (data && typeof data === 'object') {
      if (data.error) {
        return {
          code: this.mapFlashErrorCode(data.error),
          message: data.error_description || data.message || ERROR_MESSAGES.GENERAL_ERROR,
          httpStatus: status,
          originalError: error,
        };
      }

      if (data.message) {
        return {
          code: 'API_ERROR',
          message: data.message,
          httpStatus: status,
          originalError: error,
        };
      }
    }

    // HTTP status based errors
    switch (status) {
      case HTTP_STATUS.UNAUTHORIZED:
        return {
          code: 'UNAUTHORIZED',
          message: ERROR_MESSAGES.AUTHENTICATION,
          httpStatus: status,
          originalError: error,
        };

      case HTTP_STATUS.FORBIDDEN:
        return {
          code: 'FORBIDDEN',
          message: 'Access denied',
          httpStatus: status,
          originalError: error,
        };

      case HTTP_STATUS.NOT_FOUND:
        return {
          code: 'NOT_FOUND',
          message: 'Resource not found',
          httpStatus: status,
          originalError: error,
        };

      case HTTP_STATUS.INTERNAL_SERVER_ERROR:
        return {
          code: 'SERVER_ERROR',
          message: 'Internal server error',
          httpStatus: status,
          originalError: error,
        };

      default:
        return {
          code: 'HTTP_ERROR',
          message: `HTTP ${status} error`,
          httpStatus: status,
          originalError: error,
        };
    }
  }

  /**
   * Map Flash API error codes to our standard codes
   */
  private mapFlashErrorCode(flashErrorCode: string): string {
    const errorCodeMap: Record<string, string> = {
      [FLASH_ERROR_CODES.INVALID_CREDENTIALS]: 'INVALID_CREDENTIALS',
      [FLASH_ERROR_CODES.INVALID_GRANT]: 'INVALID_CREDENTIALS',
      [FLASH_ERROR_CODES.INSUFFICIENT_FUNDS]: 'INSUFFICIENT_FUNDS',
      [FLASH_ERROR_CODES.INVALID_METER]: 'INVALID_METER',
      [FLASH_ERROR_CODES.METER_BLOCKED]: 'METER_BLOCKED',
      [FLASH_ERROR_CODES.NETWORK_UNAVAILABLE]: 'NETWORK_UNAVAILABLE',
      [FLASH_ERROR_CODES.TRANSACTION_LIMIT_EXCEEDED]: 'TRANSACTION_LIMIT_EXCEEDED',
    };

    return errorCodeMap[flashErrorCode] || 'UNKNOWN_ERROR';
  }

  /**
   * Delay utility for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current account number
   */
  protected async getAccountNumber(): Promise<string> {
    const accountNumber = await this.authService.getAccountNumber();
    if (!accountNumber) {
      throw new Error('No account number available');
    }
    return accountNumber;
  }

  /**
   * Build query parameters string
   */
  protected buildQueryParams(params: Record<string, any>): string {
    const cleanParams = Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== null && value !== '')
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

    return new URLSearchParams(cleanParams).toString();
  }

  /**
   * Validate required fields
   */
  protected validateRequiredFields(
    data: Record<string, any>, 
    requiredFields: string[]
  ): void {
    const missingFields = requiredFields.filter(field => 
      !data[field] || (typeof data[field] === 'string' && data[field].trim() === '')
    );

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
  }
}