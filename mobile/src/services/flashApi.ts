// src/services/flashApi.ts
// Dual-mode Flash API service:
// - Sandbox mode: Uses guardId with /api/flash/* endpoints (no balance deduction)
// - Production mode: Uses clerkUserId with /api/mobile/purchase/* endpoints (deducts from guard balance)

import { API_CONFIG, NETWORK_PRODUCTS, IS_SANDBOX_MODE } from '../config/api';

// Response types
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AirtimePurchaseResponse {
  reference: string;
  status: string;
  message: string;
  network: string;
  amount: number;
  phoneNumber: string;
  previousBalance?: number;
  newBalance?: number;
  transactionId?: string;
}

export interface ElectricityLookupResponse {
  CustomerName: string;
  Address: string;
  MeterNumber: string;
  CanVend: boolean;
  MunicipalityCode?: string;
  MinimumAmount?: number;
  MaximumAmount?: number;
  guardBalance?: number;
}

export interface ElectricityPurchaseResponse {
  token: string;
  units: number;
  reference: string;
  meterNumber: string;
  amount: number;
  status: string;
  previousBalance?: number;
  newBalance?: number;
  customerName?: string;
}

export interface VoucherPurchaseResponse {
  voucherCode: string;
  serialNumber: string;
  pin: string;
  amount: number;
  expiryDate: string;
  previousBalance?: number;
  newBalance?: number;
  reference?: string;
  redemptionInfo?: string;
}

// Error handler
const handleApiError = (error: any): string => {
  if (error.response?.data) {
    return error.response.data.error || error.response.data.message || 'Request failed';
  }
  if (error.name === 'AbortError') {
    return 'Request timed out. Please try again.';
  }
  if (error.message === 'Network request failed') {
    return 'Network error. Please check your connection.';
  }
  return error.message || 'An unexpected error occurred';
};

// Phone number formatter (converts to SA format: 27XXXXXXXXX)
export const formatPhoneNumber = (phone: string): string => {
  // Remove all non-digits
  let cleaned = phone.replace(/\D/g, '');

  // Handle different formats
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    // 0XX XXX XXXX -> 27XX XXX XXXX
    cleaned = '27' + cleaned.substring(1);
  } else if (cleaned.startsWith('27') && cleaned.length === 11) {
    // Already in correct format
  } else if (cleaned.length === 9) {
    // XX XXX XXXX -> 27XX XXX XXXX
    cleaned = '27' + cleaned;
  }

  return cleaned;
};

// Validate phone number
export const isValidPhoneNumber = (phone: string): boolean => {
  const formatted = formatPhoneNumber(phone);
  return /^27\d{9}$/.test(formatted);
};

// Validate meter number
export const isValidMeterNumber = (meter: string): boolean => {
  const cleaned = meter.replace(/\D/g, '');
  return cleaned.length === 11;
};

// ==========================================
// AIRTIME API
// Sandbox: Uses guardId, no balance deduction
// Production: Uses clerkUserId, deducts from guard balance
// ==========================================

export interface AirtimePurchaseParams {
  phoneNumber: string;
  amount: number;
  networkCode: keyof typeof NETWORK_PRODUCTS;
  // For sandbox mode
  guardId?: string;
  // For production mode
  clerkUserId?: string;
}

export const purchaseAirtime = async (
  params: AirtimePurchaseParams
): Promise<ApiResponse<AirtimePurchaseResponse>> => {
  try {
    const { phoneNumber, amount, networkCode, guardId, clerkUserId } = params;
    const formattedPhone = formatPhoneNumber(phoneNumber);

    if (!isValidPhoneNumber(formattedPhone)) {
      return { success: false, error: 'Invalid phone number format' };
    }

    if (amount < 2 || amount > 999) {
      return { success: false, error: 'Amount must be between R2 and R999' };
    }

    // Use production endpoint if clerkUserId is provided and not in sandbox mode
    const useProduction = clerkUserId && !IS_SANDBOX_MODE;
    const endpoint = useProduction
      ? API_CONFIG.ENDPOINTS.MOBILE_AIRTIME
      : API_CONFIG.ENDPOINTS.FLASH_AIRTIME;

    const body = useProduction
      ? {
          clerkUserId,
          phoneNumber: formattedPhone,
          amount,
          networkCode,
        }
      : {
          phoneNumber: formattedPhone,
          amount,
          network: NETWORK_PRODUCTS[networkCode].code,
          guardId,
        };

    console.log(`📱 Airtime purchase (${useProduction ? 'PRODUCTION' : 'SANDBOX'}):`, { endpoint, body });

    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const result = await response.json();
    console.log('📱 Airtime purchase result:', result);
    return result;
  } catch (error) {
    console.error('❌ Airtime purchase error:', error);
    return { success: false, error: handleApiError(error) };
  }
};

// Legacy function for backward compatibility
export const purchaseAirtimeLegacy = async (
  phoneNumber: string,
  amount: number,
  network: keyof typeof NETWORK_PRODUCTS,
  guardId?: string
): Promise<ApiResponse<AirtimePurchaseResponse>> => {
  return purchaseAirtime({
    phoneNumber,
    amount,
    networkCode: network,
    guardId,
  });
};

// ==========================================
// ELECTRICITY API
// Sandbox: Uses guardId, no balance deduction
// Production: Uses clerkUserId, deducts from guard balance
// ==========================================

export interface ElectricityLookupParams {
  meterNumber: string;
  amount?: number;
  // For production mode
  clerkUserId?: string;
}

export const lookupMeter = async (
  params: ElectricityLookupParams | string,
  amountLegacy?: number
): Promise<ApiResponse<ElectricityLookupResponse>> => {
  try {
    // Support both new object param and legacy positional params
    const isLegacy = typeof params === 'string';
    const meterNumber = isLegacy ? params : params.meterNumber;
    const amount = isLegacy ? (amountLegacy || 100) : (params.amount || 100);
    const clerkUserId = isLegacy ? undefined : params.clerkUserId;

    const cleanedMeter = meterNumber.replace(/\D/g, '');

    if (!isValidMeterNumber(cleanedMeter)) {
      return { success: false, error: 'Meter number must be 11 digits' };
    }

    // Use production endpoint if clerkUserId is provided and not in sandbox mode
    const useProduction = clerkUserId && !IS_SANDBOX_MODE;
    const endpoint = useProduction
      ? API_CONFIG.ENDPOINTS.MOBILE_ELECTRICITY_LOOKUP
      : API_CONFIG.ENDPOINTS.FLASH_ELECTRICITY_LOOKUP;

    const body = useProduction
      ? { clerkUserId, meterNumber: cleanedMeter, amount }
      : { meterNumber: cleanedMeter, amount };

    console.log(`⚡ Electricity lookup (${useProduction ? 'PRODUCTION' : 'SANDBOX'}):`, { endpoint, body });

    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const result = await response.json();
    console.log('⚡ Electricity lookup result:', result);
    return result;
  } catch (error) {
    console.error('❌ Electricity lookup error:', error);
    return { success: false, error: handleApiError(error) };
  }
};

export interface ElectricityPurchaseParams {
  meterNumber: string;
  amount: number;
  municipalityCode?: string;
  // For sandbox mode
  guardId?: string;
  vendorRef?: string;
  // For production mode
  clerkUserId?: string;
}

export const purchaseElectricity = async (
  params: ElectricityPurchaseParams | string,
  amountLegacy?: number,
  municipalityCodeLegacy?: string,
  guardIdLegacy?: string,
  vendorRefLegacy?: string
): Promise<ApiResponse<ElectricityPurchaseResponse>> => {
  try {
    // Support both new object param and legacy positional params
    const isLegacy = typeof params === 'string';
    const meterNumber = isLegacy ? params : params.meterNumber;
    const amount = isLegacy ? amountLegacy! : params.amount;
    const municipalityCode = isLegacy ? municipalityCodeLegacy : params.municipalityCode;
    const guardId = isLegacy ? guardIdLegacy : params.guardId;
    const vendorRef = isLegacy ? vendorRefLegacy : params.vendorRef;
    const clerkUserId = isLegacy ? undefined : params.clerkUserId;

    const cleanedMeter = meterNumber.replace(/\D/g, '');

    if (!isValidMeterNumber(cleanedMeter)) {
      return { success: false, error: 'Meter number must be 11 digits' };
    }

    if (amount < 10 || amount > 4000) {
      return { success: false, error: 'Amount must be between R10 and R4000' };
    }

    // Use production endpoint if clerkUserId is provided and not in sandbox mode
    const useProduction = clerkUserId && !IS_SANDBOX_MODE;
    const endpoint = useProduction
      ? API_CONFIG.ENDPOINTS.MOBILE_ELECTRICITY
      : API_CONFIG.ENDPOINTS.FLASH_ELECTRICITY;

    const body = useProduction
      ? { clerkUserId, meterNumber: cleanedMeter, amount }
      : {
          meterNumber: cleanedMeter,
          amount,
          municipalityCode,
          guardId,
          vendorRef: vendorRef || `ELEC_${Date.now()}`,
        };

    console.log(`⚡ Electricity purchase (${useProduction ? 'PRODUCTION' : 'SANDBOX'}):`, { endpoint, body });

    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const result = await response.json();
    console.log('⚡ Electricity purchase result:', result);
    return result;
  } catch (error) {
    console.error('❌ Electricity purchase error:', error);
    return { success: false, error: handleApiError(error) };
  }
};

// ==========================================
// VOUCHER API (for cash-out payouts)
// Sandbox: Uses guardId with /api/payouts/process, no balance deduction
// Production: Uses clerkUserId with /api/mobile/purchase/voucher, deducts from guard balance
// ==========================================

export interface VoucherPurchaseParams {
  amount: number;
  // For sandbox mode
  guardId?: string;
  reference?: string;
  // For production mode
  clerkUserId?: string;
}

export const purchaseVoucher = async (
  params: VoucherPurchaseParams | number,
  guardIdLegacy?: string,
  referenceLegacy?: string
): Promise<ApiResponse<VoucherPurchaseResponse>> => {
  try {
    // Support both new object param and legacy positional params
    const isLegacy = typeof params === 'number';
    const amount = isLegacy ? params : params.amount;
    const guardId = isLegacy ? guardIdLegacy : params.guardId;
    const reference = isLegacy ? referenceLegacy : params.reference;
    const clerkUserId = isLegacy ? undefined : params.clerkUserId;

    if (amount < 1 || amount > 4000) {
      return { success: false, error: 'Amount must be between R1 and R4000' };
    }

    // Use production endpoint if clerkUserId is provided and not in sandbox mode
    const useProduction = clerkUserId && !IS_SANDBOX_MODE;
    const endpoint = useProduction
      ? API_CONFIG.ENDPOINTS.MOBILE_VOUCHER
      : API_CONFIG.ENDPOINTS.PAYOUT_PROCESS;

    const body = useProduction
      ? { clerkUserId, amount }
      : {
          guardId,
          amount,
          method: 'VOUCHER',
          reference: reference || `VOUCHER_${Date.now()}`,
        };

    console.log(`🎫 Voucher purchase (${useProduction ? 'PRODUCTION' : 'SANDBOX'}):`, { endpoint, body });

    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const result = await response.json();
    console.log('🎫 Voucher purchase result:', result);

    // Normalize response format between sandbox and production
    if (result.success && result.data) {
      // Sandbox response has voucher nested inside data
      // Production response has voucher directly
      const voucher = result.data.voucher || result.data;
      return {
        ...result,
        data: {
          voucherCode: voucher.pin || voucher.voucherCode,
          pin: voucher.pin,
          serialNumber: voucher.serialNumber,
          amount: result.data.amount || amount,
          expiryDate: voucher.expiryDate,
          previousBalance: result.data.previousBalance,
          newBalance: result.data.newBalance,
          reference: result.data.reference || voucher.reference,
          redemptionInfo: result.data.redemptionInfo || 'Redeem at Shoprite, Checkers, Pick n Pay, or any Netcash partner store',
        },
      };
    }

    return result;
  } catch (error) {
    console.error('❌ Voucher purchase error:', error);
    return { success: false, error: handleApiError(error) };
  }
};

export const checkVoucherBalance = async (
  serialNumber: string
): Promise<ApiResponse<{ balance: number; status: string }>> => {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.VOUCHER_BALANCE}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serialNumber: serialNumber.replace(/\s/g, ''),
      }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

export default {
  purchaseAirtime,
  purchaseAirtimeLegacy,
  lookupMeter,
  purchaseElectricity,
  purchaseVoucher,
  checkVoucherBalance,
  formatPhoneNumber,
  isValidPhoneNumber,
  isValidMeterNumber,
};
