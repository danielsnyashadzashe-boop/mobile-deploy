/**
 * Flash Partner API v4 - Data Formatting Utilities
 * Formatters for displaying Flash API data in UI
 */

import { BUSINESS_RULES } from './constants';

/**
 * Format currency amount for display
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format currency without symbol (for input fields)
 */
export const formatCurrencyValue = (amount: number): string => {
  return new Intl.NumberFormat('en-ZA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format large numbers with thousand separators
 */
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-ZA').format(num);
};

/**
 * Format date for display (DD/MM/YYYY)
 */
export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch (error) {
    return dateString; // Return original if formatting fails
  }
};

/**
 * Format date and time for display
 */
export const formatDateTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleString('en-ZA', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch (error) {
    return dateString;
  }
};

/**
 * Format time only
 */
export const formatTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-ZA', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch (error) {
    return dateString;
  }
};

/**
 * Format relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 7) {
      return formatDate(dateString);
    } else if (days > 0) {
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  } catch (error) {
    return formatDate(dateString);
  }
};

/**
 * Format voucher PIN with spaces for readability
 * 16-digit PIN: 1234 5678 9012 3456
 */
export const formatVoucherPIN = (pin: string): string => {
  const cleanPin = pin.replace(/\s/g, '');
  
  if (cleanPin.length === BUSINESS_RULES.VOUCHER.PIN_LENGTH) {
    return cleanPin.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, '$1 $2 $3 $4');
  }
  
  return pin;
};

/**
 * Format electricity token for display
 * 20-digit token: 1234 5678 9012 3456 7890
 */
export const formatElectricityToken = (token: string): string => {
  const cleanToken = token.replace(/\s/g, '');
  
  if (cleanToken.length === BUSINESS_RULES.ELECTRICITY.TOKEN_LENGTH) {
    return cleanToken.replace(/(\d{4})(\d{4})(\d{4})(\d{4})(\d{4})/, '$1 $2 $3 $4 $5');
  }
  
  return token;
};

/**
 * Format meter number for display
 * 11-digit meter: 12345 678901
 */
export const formatMeterNumber = (meterNumber: string): string => {
  const cleanMeter = meterNumber.replace(/\s/g, '');
  
  if (cleanMeter.length === BUSINESS_RULES.ELECTRICITY.METER_NUMBER_LENGTH) {
    return cleanMeter.replace(/(\d{5})(\d{6})/, '$1 $2');
  }
  
  return meterNumber;
};

/**
 * Format phone number for display
 * +27821234567 -> +27 82 123 4567
 */
export const formatPhoneNumber = (phoneNumber: string): string => {
  const cleanNumber = phoneNumber.replace(/\s/g, '');
  
  if (cleanNumber.startsWith('+27') && cleanNumber.length === 12) {
    return cleanNumber.replace(/(\+27)(\d{2})(\d{3})(\d{4})/, '$1 $2 $3 $4');
  } else if (cleanNumber.startsWith('0') && cleanNumber.length === 10) {
    return cleanNumber.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
  }
  
  return phoneNumber;
};

/**
 * Format transaction status for display
 */
export const formatTransactionStatus = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'success':
      return 'Completed';
    case 'failed':
      return 'Failed';
    case 'pending':
      return 'Pending';
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
};

/**
 * Get status color for UI display
 */
export const getStatusColor = (status: string): { text: string; background: string } => {
  switch (status.toLowerCase()) {
    case 'success':
    case 'completed':
      return { text: 'text-green-600', background: 'bg-green-50' };
    case 'failed':
      return { text: 'text-red-600', background: 'bg-red-50' };
    case 'pending':
      return { text: 'text-yellow-600', background: 'bg-yellow-50' };
    default:
      return { text: 'text-gray-600', background: 'bg-gray-50' };
  }
};

/**
 * Format transaction type for display
 */
export const formatTransactionType = (type: string): string => {
  switch (type.toLowerCase()) {
    case 'voucher':
    case '1voucher':
      return '1Voucher';
    case 'electricity':
      return 'Prepaid Electricity';
    case 'airtime':
      return 'Airtime';
    case 'data':
      return 'Data Bundle';
    default:
      return type.charAt(0).toUpperCase() + type.slice(1);
  }
};

/**
 * Format units for electricity display
 */
export const formatElectricityUnits = (units: number): string => {
  return `${formatNumber(units)} kWh`;
};

/**
 * Format data allowance for display
 */
export const formatDataAllowance = (allowance: string): string => {
  // Handle different formats: 1GB, 500MB, 1024MB -> 1GB
  const upperAllowance = allowance.toUpperCase();
  
  if (upperAllowance.includes('MB')) {
    const mb = parseInt(upperAllowance.replace(/[^0-9]/g, ''));
    if (mb >= 1024) {
      const gb = (mb / 1024).toFixed(mb % 1024 === 0 ? 0 : 1);
      return `${gb}GB`;
    }
  }
  
  return upperAllowance;
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Format account number for display
 */
export const formatAccountNumber = (accountNumber: string): string => {
  const cleanNumber = accountNumber.replace(/[^0-9]/g, '');
  
  if (cleanNumber.length === 16) {
    return cleanNumber.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, '$1-$2-$3-$4');
  }
  
  return accountNumber;
};

/**
 * Format reference for display (capitalize first letter)
 */
export const formatReference = (reference: string): string => {
  if (!reference) return '';
  return reference.charAt(0).toUpperCase() + reference.slice(1);
};

/**
 * Generate shareable receipt text
 */
export const generateReceiptText = (transaction: any): string => {
  const lines = [
    '🧾 TRANSACTION RECEIPT',
    '========================',
    '',
    `Transaction ID: ${transaction.transactionId}`,
    `Date: ${formatDateTime(transaction.transactionDate)}`,
    `Amount: ${formatCurrency(transaction.amount)}`,
    '',
  ];

  // Add transaction-specific details
  if (transaction.voucherPIN) {
    lines.push(`1Voucher PIN: ${formatVoucherPIN(transaction.voucherPIN)}`);
    lines.push(`Serial: ${transaction.serialNumber}`);
    lines.push(`Expires: ${formatDate(transaction.expiryDate)}`);
  } else if (transaction.tokenValue) {
    lines.push(`Meter: ${formatMeterNumber(transaction.meterNumber)}`);
    lines.push(`Token: ${formatElectricityToken(transaction.tokenValue)}`);
    lines.push(`Units: ${formatElectricityUnits(transaction.unitsIssued)}`);
    lines.push(`Customer: ${transaction.customerName}`);
  } else if (transaction.phoneNumber) {
    lines.push(`Phone: ${formatPhoneNumber(transaction.phoneNumber)}`);
    lines.push(`Network: ${transaction.networkName}`);
    if (transaction.bundleDescription) {
      lines.push(`Bundle: ${transaction.bundleDescription}`);
    }
  }

  lines.push('');
  lines.push('Status: ✅ Completed');
  lines.push('');
  lines.push('Thank you for using Tippa CarGuard!');

  return lines.join('\n');
};