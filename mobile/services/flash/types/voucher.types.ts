/**
 * Flash Partner API v4 - 1Voucher Service Types
 * Based on Flash Partner API V4 - V2.pdf documentation
 */

// 1Voucher Purchase Request
export interface VoucherPurchaseRequest {
  Amount: number;
  AccountNumber: string;
  Reference1?: string;
  Reference2?: string;
  Reference3?: string;
  Reference4?: string;
}

// 1Voucher Purchase Response
export interface VoucherPurchaseResponse {
  TransactionId: string;
  Amount: number;
  VoucherPIN: string;
  SerialNumber: string;
  ExpiryDate: string; // ISO date string
  Reference1?: string;
  Reference2?: string;
  Reference3?: string;
  Reference4?: string;
  TransactionDate: string; // ISO date string
  Status: 'Success' | 'Failed' | 'Pending';
}

// 1Voucher History Request
export interface VoucherHistoryRequest {
  AccountNumber: string;
  StartDate?: string; // ISO date string
  EndDate?: string; // ISO date string
  PageNumber?: number;
  PageSize?: number;
}

// 1Voucher History Response
export interface VoucherHistoryResponse {
  Transactions: VoucherTransaction[];
  TotalRecords: number;
  PageNumber: number;
  PageSize: number;
  TotalPages: number;
}

// Individual Voucher Transaction
export interface VoucherTransaction {
  TransactionId: string;
  Amount: number;
  VoucherPIN: string;
  SerialNumber: string;
  ExpiryDate: string;
  TransactionDate: string;
  Status: 'Success' | 'Failed' | 'Pending';
  Reference1?: string;
  Reference2?: string;
  Reference3?: string;
  Reference4?: string;
}

// Voucher Details Request
export interface VoucherDetailsRequest {
  TransactionId: string;
  AccountNumber: string;
}

// Voucher Status Types
export type VoucherStatus = 'Success' | 'Failed' | 'Pending';

// Voucher Service Error Types
export interface VoucherError {
  code: 'INSUFFICIENT_FUNDS' | 'INVALID_AMOUNT' | 'INVALID_ACCOUNT' | 'TRANSACTION_FAILED' | 'NETWORK_ERROR';
  message: string;
  transactionId?: string;
}

// Voucher Form Data (for UI)
export interface VoucherPurchaseForm {
  amount: string;
  reference?: string;
}

// Voucher Receipt Data (for sharing)
export interface VoucherReceipt {
  transactionId: string;
  amount: number;
  voucherPIN: string;
  serialNumber: string;
  expiryDate: string;
  transactionDate: string;
  guardName: string;
  location: string;
  reference?: string;
}

// Voucher Filter Options (for UI)
export interface VoucherFilterOptions {
  status: VoucherStatus | 'all';
  startDate?: string;
  endDate?: string;
  amountRange?: {
    min: number;
    max: number;
  };
}

// Voucher Summary (for dashboard)
export interface VoucherSummary {
  totalPurchases: number;
  totalAmount: number;
  successfulTransactions: number;
  pendingTransactions: number;
  failedTransactions: number;
  lastTransactionDate?: string;
}

// Constants for voucher service
export const VOUCHER_CONSTANTS = {
  MIN_AMOUNT: 5, // Minimum voucher amount
  MAX_AMOUNT: 5000, // Maximum voucher amount
  DEFAULT_PAGE_SIZE: 20,
  PIN_DISPLAY_FORMAT: /(\d{4})(\d{4})(\d{4})(\d{4})/, // For formatting 16-digit PIN
  EXPIRY_WARNING_DAYS: 30, // Days before expiry to show warning
} as const;

// Voucher API Endpoints
export const VOUCHER_ENDPOINTS = {
  PURCHASE: '/1Voucher/Purchase',
  HISTORY: '/1Voucher/History', 
  DETAILS: '/1Voucher/Details',
} as const;