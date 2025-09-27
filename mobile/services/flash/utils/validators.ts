/**
 * Flash Partner API v4 - Input Validation Utilities
 * Validation functions for Flash API inputs
 */

import { REGEX_PATTERNS, BUSINESS_RULES } from './constants';

// Validation Result Type
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate South African phone number
 */
export const validatePhoneNumber = (phoneNumber: string): ValidationResult => {
  if (!phoneNumber) {
    return { isValid: false, error: 'Phone number is required' };
  }

  const cleanNumber = phoneNumber.replace(/\s/g, '');
  
  if (!REGEX_PATTERNS.PHONE_NUMBER.test(cleanNumber)) {
    return { 
      isValid: false, 
      error: 'Please enter a valid South African phone number (e.g., 0821234567 or +27821234567)' 
    };
  }

  return { isValid: true };
};

/**
 * Format phone number to standard format
 */
export const formatPhoneNumber = (phoneNumber: string): string => {
  const cleanNumber = phoneNumber.replace(/\s/g, '');
  
  if (cleanNumber.startsWith('+27')) {
    return cleanNumber;
  } else if (cleanNumber.startsWith('0')) {
    return '+27' + cleanNumber.substring(1);
  } else if (cleanNumber.length === 9) {
    return '+27' + cleanNumber;
  }
  
  return phoneNumber; // Return original if can't format
};

/**
 * Validate meter number
 */
export const validateMeterNumber = (meterNumber: string): ValidationResult => {
  if (!meterNumber) {
    return { isValid: false, error: 'Meter number is required' };
  }

  const cleanMeter = meterNumber.replace(/\s/g, '');
  
  if (!REGEX_PATTERNS.METER_NUMBER.test(cleanMeter)) {
    return { 
      isValid: false, 
      error: `Please enter a valid ${BUSINESS_RULES.ELECTRICITY.METER_NUMBER_LENGTH}-digit meter number` 
    };
  }

  return { isValid: true };
};

/**
 * Format meter number with spaces for readability
 */
export const formatMeterNumber = (meterNumber: string): string => {
  const cleanMeter = meterNumber.replace(/\s/g, '');
  
  if (cleanMeter.length === 11) {
    return cleanMeter.replace(/(\d{5})(\d{6})/, '$1 $2');
  }
  
  return meterNumber;
};

/**
 * Validate amount for different transaction types
 */
export const validateAmount = (
  amount: string | number, 
  type: 'voucher' | 'electricity' | 'airtime'
): ValidationResult => {
  if (!amount) {
    return { isValid: false, error: 'Amount is required' };
  }

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount) || numAmount <= 0) {
    return { isValid: false, error: 'Please enter a valid amount' };
  }

  let minAmount: number;
  let maxAmount: number;

  switch (type) {
    case 'voucher':
      minAmount = BUSINESS_RULES.VOUCHER.MIN_AMOUNT;
      maxAmount = BUSINESS_RULES.VOUCHER.MAX_AMOUNT;
      break;
    case 'electricity':
      minAmount = BUSINESS_RULES.ELECTRICITY.MIN_AMOUNT;
      maxAmount = BUSINESS_RULES.ELECTRICITY.MAX_AMOUNT;
      break;
    case 'airtime':
      minAmount = BUSINESS_RULES.AIRTIME.MIN_AMOUNT;
      maxAmount = BUSINESS_RULES.AIRTIME.MAX_AMOUNT;
      break;
    default:
      return { isValid: false, error: 'Invalid transaction type' };
  }

  if (numAmount < minAmount) {
    return { 
      isValid: false, 
      error: `Minimum amount is R${minAmount}` 
    };
  }

  if (numAmount > maxAmount) {
    return { 
      isValid: false, 
      error: `Maximum amount is R${maxAmount}` 
    };
  }

  return { isValid: true };
};

/**
 * Validate reference field
 */
export const validateReference = (reference: string): ValidationResult => {
  if (!reference) {
    return { isValid: true }; // Reference is optional
  }

  if (reference.length > 50) {
    return { isValid: false, error: 'Reference must be 50 characters or less' };
  }

  if (!REGEX_PATTERNS.REFERENCE.test(reference)) {
    return { 
      isValid: false, 
      error: 'Reference can only contain letters, numbers, spaces, and basic punctuation' 
    };
  }

  return { isValid: true };
};

/**
 * Validate account number format
 */
export const validateAccountNumber = (accountNumber: string): ValidationResult => {
  if (!accountNumber) {
    return { isValid: false, error: 'Account number is required' };
  }

  if (!REGEX_PATTERNS.ACCOUNT_NUMBER.test(accountNumber)) {
    return { 
      isValid: false, 
      error: 'Account number must be in format: 0000-0000-0000-0000' 
    };
  }

  return { isValid: true };
};

/**
 * Format account number with dashes
 */
export const formatAccountNumber = (accountNumber: string): string => {
  const cleanNumber = accountNumber.replace(/[^0-9]/g, '');
  
  if (cleanNumber.length === 16) {
    return cleanNumber.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, '$1-$2-$3-$4');
  }
  
  return accountNumber;
};

/**
 * Validate form data before submission
 */
export const validateFormData = (
  data: Record<string, any>, 
  requiredFields: string[]
): ValidationResult => {
  const missingFields: string[] = [];
  
  for (const field of requiredFields) {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      missingFields.push(field);
    }
  }

  if (missingFields.length > 0) {
    return { 
      isValid: false, 
      error: `Please fill in the following required fields: ${missingFields.join(', ')}` 
    };
  }

  return { isValid: true };
};

/**
 * Check if amount is in available denominations (for vouchers)
 */
export const isValidDenomination = (amount: number, type: 'voucher' | 'airtime'): boolean => {
  const denominations = type === 'voucher'
    ? BUSINESS_RULES.VOUCHER.DENOMINATIONS
    : BUSINESS_RULES.AIRTIME.COMMON_DENOMINATIONS;

  return denominations.includes(amount as any);
};

/**
 * Get suggested amounts for quick selection
 */
export const getSuggestedAmounts = (type: 'voucher' | 'electricity' | 'airtime'): number[] => {
  switch (type) {
    case 'voucher':
      return [...BUSINESS_RULES.VOUCHER.DENOMINATIONS].slice(0, 8); // First 8 denominations
    case 'electricity':
      return [20, 50, 100, 200, 300, 500, 1000, 2000];
    case 'airtime':
      return [...BUSINESS_RULES.AIRTIME.COMMON_DENOMINATIONS];
    default:
      return [];
  }
};

/**
 * Clean and normalize input strings
 */
export const cleanInput = (input: string): string => {
  return input.trim().replace(/\s+/g, ' ');
};

/**
 * Validate date string (YYYY-MM-DD format)
 */
export const validateDateString = (dateString: string): ValidationResult => {
  if (!dateString) {
    return { isValid: false, error: 'Date is required' };
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return { 
      isValid: false, 
      error: 'Date must be in YYYY-MM-DD format' 
    };
  }

  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return { isValid: false, error: 'Please enter a valid date' };
  }

  return { isValid: true };
};

/**
 * Validate date range
 */
export const validateDateRange = (startDate: string, endDate: string): ValidationResult => {
  const startValidation = validateDateString(startDate);
  if (!startValidation.isValid) {
    return { isValid: false, error: `Start date: ${startValidation.error}` };
  }

  const endValidation = validateDateString(endDate);
  if (!endValidation.isValid) {
    return { isValid: false, error: `End date: ${endValidation.error}` };
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start > end) {
    return { isValid: false, error: 'Start date must be before end date' };
  }

  // Check if date range is not too far in the future
  const today = new Date();
  if (start > today) {
    return { isValid: false, error: 'Start date cannot be in the future' };
  }

  return { isValid: true };
};