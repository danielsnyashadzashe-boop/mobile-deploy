/**
 * Flash Partner API v4 - Constants and Configuration
 * Based on Flash Partner API V4 - V2.pdf documentation
 */

import { FlashEnvironment } from '../types/auth.types';

// Flash API Environment Configuration
export const FLASH_ENVIRONMENTS: Record<string, FlashEnvironment> = {
  sandbox: {
    name: 'sandbox',
    baseUrl: 'https://api-flashswitch-sandbox.flash-group.com',
    description: 'Sandbox environment for testing with QA credentials',
  },
  production: {
    name: 'production',
    baseUrl: 'https://api.flashswitch.flash-group.com', 
    description: 'Production environment',
  },
} as const;

// Current Environment (configurable)
export const CURRENT_ENVIRONMENT: keyof typeof FLASH_ENVIRONMENTS = 'sandbox';

// Flash API Base Configuration
export const FLASH_CONFIG = {
  BASE_URL: FLASH_ENVIRONMENTS[CURRENT_ENVIRONMENT].baseUrl,
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
} as const;

// Authentication Configuration
export const AUTH_CONFIG = {
  TOKEN_ENDPOINT: '/oauth/token',
  GRANT_TYPE: 'client_credentials',
  TOKEN_EXPIRY_BUFFER: 5 * 60 * 1000, // 5 minutes in milliseconds
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

// QA Credentials (from V4 QA.pdf)
export const QA_CREDENTIALS = {
  AUTH_HEADER: 'UF92SGh4Q1RjZnNYMUJFNmZkTGdTcl9JeVRRYTpaSTN4TjkwN2ZHbjB4X0dqOWdCNGkyTWc0V29h',
  ACCOUNT_NUMBER: '8058-7467-3755-5732',
} as const;

// QA Test Data
export const QA_TEST_DATA = {
  METER_NUMBERS: [
    '04004444884',
    '75835368301',
  ],
  PHONE_NUMBERS: [
    '0812345678',
    '0723456789',
    '0834567890',
  ],
  MUNICIPALITY_CODES: [
    'CPT', // Cape Town
    'JHB', // Johannesburg
    'DBN', // Durban
    'EKU', // Ekurhuleni
  ],
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    TOKEN: '/oauth/token',
  },

  // 1Voucher Service
  VOUCHER: {
    PURCHASE: '/1Voucher/Purchase',
    HISTORY: '/1Voucher/History',
    DETAILS: '/1Voucher/Details',
  },

  // Prepaid Electricity Service
  ELECTRICITY: {
    MUNICIPALITIES: '/PrepaidElectricity/Municipalities',
    METER_LOOKUP: '/PrepaidElectricity/MeterLookup',
    PURCHASE: '/PrepaidElectricity/Purchase',
    HISTORY: '/PrepaidElectricity/History',
    TRANSACTION_STATUS: '/PrepaidElectricity/TransactionStatus',
  },

  // Airtime/eeziVoucher Service
  AIRTIME: {
    NETWORKS: '/Airtime/Networks',
    PHONE_VALIDATION: '/Airtime/PhoneValidation',
    DATA_BUNDLES: '/Airtime/DataBundles',
    PURCHASE_AIRTIME: '/Airtime/Purchase',
    PURCHASE_DATA: '/Airtime/PurchaseData',
    HISTORY: '/Airtime/History',
    TRANSACTION_STATUS: '/Airtime/TransactionStatus',
  },
} as const;

// Business Rules and Limits
export const BUSINESS_RULES = {
  // 1Voucher
  VOUCHER: {
    MIN_AMOUNT: 5,
    MAX_AMOUNT: 5000,
    DENOMINATIONS: [5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000],
    PIN_LENGTH: 16,
  },

  // Prepaid Electricity
  ELECTRICITY: {
    MIN_AMOUNT: 5,
    MAX_AMOUNT: 5000,
    METER_NUMBER_LENGTH: 11,
    TOKEN_LENGTH: 20,
  },

  // Airtime/Data
  AIRTIME: {
    MIN_AMOUNT: 5,
    MAX_AMOUNT: 1000,
    COMMON_DENOMINATIONS: [5, 10, 20, 30, 50, 100, 200, 500],
  },

  // Pagination
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
  },
} as const;

// Network Provider Codes (South African)
export const NETWORK_PROVIDERS = {
  MTN: { code: 'MTN', name: 'MTN', color: '#FFCC00' },
  VODACOM: { code: 'VDC', name: 'Vodacom', color: '#FF0000' },
  CELL_C: { code: 'CLC', name: 'Cell C', color: '#0066CC' },
  TELKOM: { code: 'TLK', name: 'Telkom Mobile', color: '#00A650' },
  RAIN: { code: 'RAIN', name: 'Rain Mobile', color: '#8A2BE2' },
} as const;

// Regular Expressions for Validation
export const REGEX_PATTERNS = {
  // South African phone number (with or without country code)
  PHONE_NUMBER: /^(\+27|0)([0-9]{9})$/,
  
  // Meter number (11 digits)
  METER_NUMBER: /^\d{11}$/,
  
  // Amount (positive numbers with up to 2 decimal places)
  AMOUNT: /^\d+(\.\d{1,2})?$/,
  
  // Account number format
  ACCOUNT_NUMBER: /^\d{4}-\d{4}-\d{4}-\d{4}$/,
  
  // Reference fields (alphanumeric, spaces allowed)
  REFERENCE: /^[a-zA-Z0-9\s-_.,]{0,50}$/,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK: 'Network connection failed. Please check your internet connection.',
  AUTHENTICATION: 'Authentication failed. Please try again.',
  INVALID_CREDENTIALS: 'Invalid credentials provided.',
  TOKEN_EXPIRED: 'Session expired. Please refresh the app.',
  INSUFFICIENT_FUNDS: 'Insufficient balance for this transaction.',
  INVALID_AMOUNT: 'Please enter a valid amount.',
  INVALID_PHONE: 'Please enter a valid phone number.',
  INVALID_METER: 'Please enter a valid meter number.',
  TRANSACTION_FAILED: 'Transaction failed. Please try again.',
  GENERAL_ERROR: 'An unexpected error occurred. Please try again.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  VOUCHER_PURCHASED: 'Voucher purchased successfully!',
  ELECTRICITY_PURCHASED: 'Electricity purchased successfully!',
  AIRTIME_PURCHASED: 'Airtime purchased successfully!',
  DATA_PURCHASED: 'Data bundle purchased successfully!',
} as const;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

// Flash API Specific Error Codes
export const FLASH_ERROR_CODES = {
  INVALID_CREDENTIALS: 'invalid_client',
  INVALID_GRANT: 'invalid_grant',
  UNSUPPORTED_GRANT_TYPE: 'unsupported_grant_type',
  INSUFFICIENT_FUNDS: 'insufficient_funds',
  INVALID_METER: 'invalid_meter_number',
  METER_BLOCKED: 'meter_blocked',
  NETWORK_UNAVAILABLE: 'network_unavailable',
  TRANSACTION_LIMIT_EXCEEDED: 'transaction_limit_exceeded',
} as const;