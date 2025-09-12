/**
 * Flash API Authenticated Request Helper
 * Provides a centralized way to make authenticated API requests with proper error handling
 */

import axios, { AxiosRequestConfig, AxiosResponse, Method } from 'axios';
import { FlashAuthService } from '../auth/authService';
import { FLASH_CONFIG } from '../utils/constants';

/**
 * Standard API Error Response
 */
export interface ApiErrorResponse {
  code: string;
  message: string;
  httpStatus?: number;
  url?: string;
  method?: string;
  originalError?: any;
}

/**
 * Make an authenticated request to Flash API
 * Handles authentication, retries, and error formatting
 */
export async function makeAuthenticatedRequest<T = any>(
  method: Method,
  endpoint: string,
  data?: any,
  config?: Partial<AxiosRequestConfig>
): Promise<T> {
  const authService = FlashAuthService.getInstance();
  
  // Build full URL
  const url = endpoint.startsWith('http') 
    ? endpoint 
    : `${FLASH_CONFIG.BASE_URL}${endpoint}`;

  try {
    // Initialize auth if needed
    const isInitialized = await authService.isAuthenticated();
    if (!isInitialized) {
      console.log('🔐 Initializing Flash API authentication...');
      await authService.initialize();
    }

    // Get auth headers - this will throw if credentials are missing
    let authHeaders: Record<string, string>;
    try {
      authHeaders = await authService.getAuthHeaders();
    } catch (error) {
      console.error(`❌ API Error [NO_AUTH] ${method} ${url}`, {
        error: 'Unable to get authentication headers',
        message: error instanceof Error ? error.message : 'Unknown auth error'
      });
      throw {
        code: 'AUTH_FAILED',
        message: 'Unable to get authentication headers. Please ensure Flash API credentials are configured.',
        httpStatus: 401,
        url,
        method,
        originalError: error
      } as ApiErrorResponse;
    }

    // Ensure we have a valid Bearer token
    if (!authHeaders.Authorization || !authHeaders.Authorization.startsWith('Bearer ')) {
      console.error(`❌ API Error [INVALID_TOKEN] ${method} ${url}`, {
        error: 'Invalid or missing Bearer token',
        headers: authHeaders
      });
      throw {
        code: 'INVALID_TOKEN',
        message: 'Invalid or missing Bearer token in authorization header',
        httpStatus: 401,
        url,
        method
      } as ApiErrorResponse;
    }

    // Build request configuration
    const requestConfig: AxiosRequestConfig = {
      method,
      url,
      headers: {
        ...authHeaders,
        ...config?.headers,
      },
      timeout: config?.timeout || FLASH_CONFIG.TIMEOUT,
      ...config,
    };

    // Add data for POST/PUT/PATCH requests
    if (data && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
      requestConfig.data = data;
    }

    // Add params for GET requests
    if (data && method.toUpperCase() === 'GET') {
      requestConfig.params = data;
    }

    // Log request in development
    if (__DEV__) {
      console.log(`🚀 API Request [${method}] ${url}`, {
        headers: {
          ...requestConfig.headers,
          Authorization: 'Bearer [REDACTED]' // Don't log actual token
        },
        data: requestConfig.data,
        params: requestConfig.params,
      });
    }

    // Make the request
    const response: AxiosResponse<T> = await axios.request(requestConfig);

    // Log success in development
    if (__DEV__) {
      console.log(`✅ API Response [${response.status}] ${url}`, {
        data: response.data,
      });
    }

    return response.data;

  } catch (error: any) {
    // Format error for better debugging
    const status = error.response?.status || error.code || 'UNKNOWN';
    const errorMessage = error.response?.data?.message 
      || error.response?.data?.error 
      || error.message 
      || 'Unknown error occurred';

    console.error(`❌ API Error [${status}] ${method} ${url}`, {
      status,
      message: errorMessage,
      response: error.response?.data,
      error: error.message,
    });

    // Handle 401 - Try to refresh token and retry once
    if (error.response?.status === 401 && !config?.skipRetry) {
      console.log('🔄 Token expired, attempting to refresh...');
      try {
        await authService.refreshToken();
        // Retry the request once with skipRetry flag
        return makeAuthenticatedRequest(method, endpoint, data, { 
          ...config, 
          skipRetry: true 
        });
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);
      }
    }

    // Throw formatted error
    throw {
      code: error.response?.data?.code || error.code || 'API_ERROR',
      message: errorMessage,
      httpStatus: error.response?.status,
      url,
      method,
      originalError: error.response?.data || error,
    } as ApiErrorResponse;
  }
}

/**
 * Helper functions for common HTTP methods
 */
export const authenticatedApi = {
  /**
   * Make a GET request
   */
  async get<T = any>(
    endpoint: string, 
    params?: any, 
    config?: Partial<AxiosRequestConfig>
  ): Promise<T> {
    return makeAuthenticatedRequest<T>('GET', endpoint, params, config);
  },

  /**
   * Make a POST request
   */
  async post<T = any>(
    endpoint: string, 
    data?: any, 
    config?: Partial<AxiosRequestConfig>
  ): Promise<T> {
    return makeAuthenticatedRequest<T>('POST', endpoint, data, config);
  },

  /**
   * Make a PUT request
   */
  async put<T = any>(
    endpoint: string, 
    data?: any, 
    config?: Partial<AxiosRequestConfig>
  ): Promise<T> {
    return makeAuthenticatedRequest<T>('PUT', endpoint, data, config);
  },

  /**
   * Make a DELETE request
   */
  async delete<T = any>(
    endpoint: string, 
    config?: Partial<AxiosRequestConfig>
  ): Promise<T> {
    return makeAuthenticatedRequest<T>('DELETE', endpoint, undefined, config);
  },

  /**
   * Make a PATCH request
   */
  async patch<T = any>(
    endpoint: string, 
    data?: any, 
    config?: Partial<AxiosRequestConfig>
  ): Promise<T> {
    return makeAuthenticatedRequest<T>('PATCH', endpoint, data, config);
  },
};

/**
 * Check if an error is an API error
 */
export function isApiError(error: any): error is ApiErrorResponse {
  return error && typeof error === 'object' && 'code' in error && 'message' in error;
}

/**
 * Format error message for display
 */
export function formatApiError(error: any): string {
  if (isApiError(error)) {
    const status = error.httpStatus ? `[${error.httpStatus}] ` : '';
    return `${status}${error.message}`;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
}