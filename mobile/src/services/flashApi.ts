// src/services/flashApi.ts

import { API_CONFIG, NETWORK_PRODUCTS } from '../config/api';

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
}

export interface ElectricityLookupResponse {
  CustomerName: string;
  Address: string;
  MeterNumber: string;
  CanVend: boolean;
  MunicipalityCode?: string;
  MinimumAmount?: number;
  MaximumAmount?: number;
}

export interface ElectricityPurchaseResponse {
  token: string;
  units: number;
  reference: string;
  meterNumber: string;
  amount: number;
  status: string;
}

export interface VoucherPurchaseResponse {
  voucherCode: string;
  serialNumber: string;
  pin: string;
  amount: number;
  expiryDate: string;
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
// ==========================================

export const purchaseAirtime = async (
  phoneNumber: string,
  amount: number,
  network: keyof typeof NETWORK_PRODUCTS,
  guardId?: string
): Promise<ApiResponse<AirtimePurchaseResponse>> => {
  try {
    const formattedPhone = formatPhoneNumber(phoneNumber);

    if (!isValidPhoneNumber(formattedPhone)) {
      return { success: false, error: 'Invalid phone number format' };
    }

    if (amount < 2 || amount > 999) {
      return { success: false, error: 'Amount must be between R2 and R999' };
    }

    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AIRTIME_PURCHASE}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: formattedPhone,
        amount,
        network: NETWORK_PRODUCTS[network].code,
        guardId,
      }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

// ==========================================
// ELECTRICITY API
// ==========================================

export const lookupMeter = async (
  meterNumber: string,
  amount: number = 100
): Promise<ApiResponse<ElectricityLookupResponse>> => {
  try {
    const cleanedMeter = meterNumber.replace(/\D/g, '');

    if (!isValidMeterNumber(cleanedMeter)) {
      return { success: false, error: 'Meter number must be 11 digits' };
    }

    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ELECTRICITY_LOOKUP}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        meterNumber: cleanedMeter,
        amount,
      }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

export const purchaseElectricity = async (
  meterNumber: string,
  amount: number,
  municipalityCode?: string,
  guardId?: string,
  vendorRef?: string
): Promise<ApiResponse<ElectricityPurchaseResponse>> => {
  try {
    const cleanedMeter = meterNumber.replace(/\D/g, '');

    if (!isValidMeterNumber(cleanedMeter)) {
      return { success: false, error: 'Meter number must be 11 digits' };
    }

    if (amount < 10 || amount > 4000) {
      return { success: false, error: 'Amount must be between R10 and R4000' };
    }

    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ELECTRICITY_PURCHASE}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        meterNumber: cleanedMeter,
        amount,
        municipalityCode,
        guardId,
        vendorRef: vendorRef || `ELEC_${Date.now()}`,
      }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

// ==========================================
// VOUCHER API (for payouts)
// ==========================================

export const purchaseVoucher = async (
  amount: number,
  guardId?: string,
  reference?: string
): Promise<ApiResponse<VoucherPurchaseResponse>> => {
  try {
    if (amount < 1 || amount > 4000) {
      return { success: false, error: 'Amount must be between R1 and R4000' };
    }

    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.VOUCHER_PURCHASE}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount,
        guardId,
        reference: reference || `VOUCHER_${Date.now()}`,
      }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
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
  lookupMeter,
  purchaseElectricity,
  purchaseVoucher,
  checkVoucherBalance,
  formatPhoneNumber,
  isValidPhoneNumber,
  isValidMeterNumber,
};
