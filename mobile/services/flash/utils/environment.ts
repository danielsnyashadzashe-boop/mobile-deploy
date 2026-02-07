/**
 * Environment-specific configuration for Flash API
 * Handles different configurations for web development, mobile, and production
 */

import { Platform } from 'react-native';
import { FLASH_ENVIRONMENTS } from './constants';

export type Environment = 'development' | 'staging' | 'production';

/**
 * Get the current environment based on build configuration
 */
export function getCurrentEnvironment(): Environment {
  // @ts-ignore
  if (__DEV__) {
    return 'development';
  }
  return 'production';
}

/**
 * Get the API base URL based on the current platform and environment
 */
export function getApiBaseUrl(): string {
  const env = getCurrentEnvironment();
  const isWeb = Platform.OS === 'web';

  // In web development, use local proxy to avoid CORS
  if (env === 'development' && isWeb) {
    // Use local proxy endpoint that forwards to Flash API
    return '/api/flash';
  }

  // For mobile (iOS/Android) or production web, use direct API URL
  return FLASH_ENVIRONMENTS.sandbox.baseUrl;
}

/**
 * Check if we're running in web browser
 */
export function isWebPlatform(): boolean {
  return Platform.OS === 'web';
}

/**
 * Check if we should use the proxy (web dev only)
 */
export function shouldUseProxy(): boolean {
  return getCurrentEnvironment() === 'development' && isWebPlatform();
}

/**
 * Get request timeout based on environment
 */
export function getRequestTimeout(): number {
  const env = getCurrentEnvironment();
  // Longer timeout in development for debugging
  return env === 'development' ? 60000 : 30000;
}

/**
 * Configuration for different environments
 */
export const ENV_CONFIG = {
  development: {
    logLevel: 'debug',
    enableDetailedLogs: true,
    maxRetries: 3,
    retryDelay: 1000,
    tokenExpiryBuffer: 5 * 60 * 1000, // 5 minutes
  },
  staging: {
    logLevel: 'info',
    enableDetailedLogs: false,
    maxRetries: 3,
    retryDelay: 2000,
    tokenExpiryBuffer: 10 * 60 * 1000, // 10 minutes
  },
  production: {
    logLevel: 'error',
    enableDetailedLogs: false,
    maxRetries: 2,
    retryDelay: 3000,
    tokenExpiryBuffer: 15 * 60 * 1000, // 15 minutes
  },
} as const;

/**
 * Get configuration for current environment
 */
export function getEnvConfig() {
  const env = getCurrentEnvironment();
  return ENV_CONFIG[env];
}

/**
 * Enhanced logging based on environment
 */
export const logger = {
  debug: (...args: any[]) => {
    if (getEnvConfig().logLevel === 'debug') {
      console.log('[DEBUG]', ...args);
    }
  },
  info: (...args: any[]) => {
    if (['debug', 'info'].includes(getEnvConfig().logLevel)) {
      console.log('[INFO]', ...args);
    }
  },
  warn: (...args: any[]) => {
    console.warn('[WARN]', ...args);
  },
  error: (...args: any[]) => {
    console.error('[ERROR]', ...args);
  },
};