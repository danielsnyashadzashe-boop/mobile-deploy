// src/config/api.ts

import { Platform } from 'react-native';

// Determine the API base URL based on platform
const getBaseUrl = (): string => {
  // @ts-ignore
  if (__DEV__) {
    // Development
    if (Platform.OS === 'android') {
      // Android emulator uses 10.0.2.2 to access host machine
      return 'http://10.0.2.2:3001';
    }
    // iOS simulator can use localhost
    if (Platform.OS === 'ios') {
      return 'http://localhost:3001';
    }
    // Web or physical device - use environment variable or local IP
    return process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
  }
  // Production
  return 'https://api.nogadacarguard.co.za';
};

export const API_CONFIG = {
  BASE_URL: getBaseUrl(),
  ENDPOINTS: {
    // 1Voucher endpoints
    VOUCHER_AUTH: '/api/1voucher/auth',
    VOUCHER_PURCHASE: '/api/1voucher/purchase',
    VOUCHER_BALANCE: '/api/1voucher/balance',
    VOUCHER_REDEEM: '/api/1voucher/redeem',

    // Flash API endpoints
    AIRTIME_PURCHASE: '/api/flash/airtime/purchase',
    ELECTRICITY_LOOKUP: '/api/flash/electricity/lookup',
    ELECTRICITY_PURCHASE: '/api/flash/electricity/purchase',

    // Guard profile
    GUARD_PROFILE: '/api/guards/profile',
    MOBILE_LINK: '/api/mobile/link',
    MOBILE_PROFILE: '/api/mobile/profile',
  },
};

// Network product codes for airtime
export const NETWORK_PRODUCTS = {
  MTN: { code: 'MTN', name: 'MTN', color: '#FFCC00' },
  VODACOM: { code: 'VDC', name: 'Vodacom', color: '#E60000' },
  TELKOM: { code: 'TLK', name: 'Telkom', color: '#0066CC' },
  CELLC: { code: 'CLC', name: 'Cell C', color: '#000000' },
};

// Quick amount presets
export const AIRTIME_AMOUNTS = [5, 10, 20, 50, 100, 200];
export const ELECTRICITY_AMOUNTS = [50, 100, 200, 300, 500, 1000];
export const PAYOUT_AMOUNTS = [50, 100, 200, 500, 1000, 2000];

// Validation
export const VALIDATION = {
  MIN_AIRTIME: 2,
  MAX_AIRTIME: 999,
  MIN_ELECTRICITY: 10,
  MAX_ELECTRICITY: 4000,
  MIN_VOUCHER: 1,
  MAX_VOUCHER: 4000,
  METER_NUMBER_LENGTH: 11,
};

// Sandbox Test Data
export const SANDBOX_TEST_DATA = {
  // Official Flash Sandbox Test Phone Numbers
  PHONE_NUMBERS: [
    { number: '0831234567', network: 'MTN', international: '27831234567' },
    { number: '0821234567', network: 'VODACOM', international: '27821234567' },
    { number: '0811234567', network: 'TELKOM', international: '27811234567' },
  ],
  // Official Flash Sandbox Test Meters
  METERS: [
    { number: '01012345678', provider: 'Eskom', minAmount: 10 },
    { number: '07062575753', provider: 'Bloemfontein', minAmount: 40 },
    { number: '05012345678', provider: 'Ethekwini', minAmount: 90 },
    { number: '04287715629', provider: 'Cape Town', minAmount: 10 },
  ],
};

export default API_CONFIG;
