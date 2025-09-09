/**
 * Flash Partner API v4 - Airtime/eeziVoucher Service Types
 * Based on Flash Partner API V4 - V2.pdf documentation
 */

// Network Provider Types
export interface NetworkProvider {
  Code: string;
  Name: string;
  Type: 'Airtime' | 'Data' | 'SMS';
  IsActive: boolean;
  MinAmount: number;
  MaxAmount: number;
  Denominations?: number[]; // Fixed denominations if applicable
}

// Phone Number Validation Request
export interface PhoneValidationRequest {
  PhoneNumber: string;
  NetworkCode?: string;
}

// Phone Number Validation Response
export interface PhoneValidationResponse {
  PhoneNumber: string;
  FormattedNumber: string; // E.164 format
  NetworkCode: string;
  NetworkName: string;
  IsValid: boolean;
  NumberType: 'Mobile' | 'Landline' | 'Unknown';
}

// Airtime Purchase Request
export interface AirtimePurchaseRequest {
  PhoneNumber: string;
  NetworkCode: string;
  Amount: number;
  AccountNumber: string;
  Reference1?: string;
  Reference2?: string;
  Reference3?: string;
  Reference4?: string;
}

// Airtime Purchase Response
export interface AirtimePurchaseResponse {
  TransactionId: string;
  PhoneNumber: string;
  NetworkCode: string;
  NetworkName: string;
  Amount: number;
  TransactionDate: string;
  Status: 'Success' | 'Failed' | 'Pending';
  Reference1?: string;
  Reference2?: string;
  Reference3?: string;
  Reference4?: string;
  RechargePin?: string; // For voucher-based networks
  Instructions?: string; // Recharge instructions
}

// Data Bundle Types
export interface DataBundle {
  Code: string;
  Description: string;
  Amount: number;
  DataAllowance: string; // e.g., "1GB", "500MB"
  ValidityPeriod: string; // e.g., "30 days", "7 days"
  NetworkCode: string;
}

// Data Purchase Request
export interface DataPurchaseRequest {
  PhoneNumber: string;
  NetworkCode: string;
  BundleCode: string;
  AccountNumber: string;
  Reference1?: string;
  Reference2?: string;
  Reference3?: string;
  Reference4?: string;
}

// Data Purchase Response
export interface DataPurchaseResponse {
  TransactionId: string;
  PhoneNumber: string;
  NetworkCode: string;
  NetworkName: string;
  BundleCode: string;
  BundleDescription: string;
  Amount: number;
  DataAllowance: string;
  ValidityPeriod: string;
  TransactionDate: string;
  Status: 'Success' | 'Failed' | 'Pending';
  Reference1?: string;
  Reference2?: string;
  Reference3?: string;
  Reference4?: string;
  ActivationInstructions?: string;
}

// Airtime History Request
export interface AirtimeHistoryRequest {
  AccountNumber: string;
  PhoneNumber?: string;
  NetworkCode?: string;
  StartDate?: string;
  EndDate?: string;
  PageNumber?: number;
  PageSize?: number;
}

// Airtime History Response
export interface AirtimeHistoryResponse {
  Transactions: AirtimeTransaction[];
  TotalRecords: number;
  PageNumber: number;
  PageSize: number;
  TotalPages: number;
}

// Individual Airtime Transaction
export interface AirtimeTransaction {
  TransactionId: string;
  PhoneNumber: string;
  NetworkCode: string;
  NetworkName: string;
  Amount: number;
  TransactionType: 'Airtime' | 'Data' | 'SMS';
  TransactionDate: string;
  Status: 'Success' | 'Failed' | 'Pending';
  Reference1?: string;
  Reference2?: string;
  Reference3?: string;
  Reference4?: string;
  BundleDescription?: string; // For data purchases
  RechargePin?: string;
}

// Airtime Service Error Types
export interface AirtimeError {
  code: 'INVALID_PHONE' | 'NETWORK_UNAVAILABLE' | 'INSUFFICIENT_FUNDS' | 'INVALID_AMOUNT' | 'INVALID_BUNDLE' | 'TRANSACTION_FAILED';
  message: string;
  phoneNumber?: string;
  networkCode?: string;
  transactionId?: string;
}

// Airtime Purchase Form Data (for UI)
export interface AirtimePurchaseForm {
  phoneNumber: string;
  networkCode: string;
  amount: string;
  purchaseType: 'airtime' | 'data';
  bundleCode?: string; // For data purchases
  reference?: string;
}

// Airtime Receipt Data (for sharing)
export interface AirtimeReceipt {
  transactionId: string;
  phoneNumber: string;
  networkName: string;
  amount: number;
  transactionType: 'Airtime' | 'Data' | 'SMS';
  transactionDate: string;
  guardName: string;
  location: string;
  reference?: string;
  bundleDescription?: string;
  rechargePin?: string;
  instructions?: string;
}

// Airtime Filter Options (for UI)
export interface AirtimeFilterOptions {
  status: 'Success' | 'Failed' | 'Pending' | 'all';
  networkCode?: string;
  transactionType?: 'Airtime' | 'Data' | 'SMS' | 'all';
  startDate?: string;
  endDate?: string;
  amountRange?: {
    min: number;
    max: number;
  };
}

// Airtime Summary (for dashboard)
export interface AirtimeSummary {
  totalPurchases: number;
  totalAmount: number;
  airtimeTransactions: number;
  dataTransactions: number;
  uniqueNumbers: number;
  successfulTransactions: number;
  pendingTransactions: number;
  failedTransactions: number;
  lastTransactionDate?: string;
  topNetworks: Array<{
    networkCode: string;
    networkName: string;
    transactionCount: number;
    totalAmount: number;
  }>;
}

// Transaction Type
export type AirtimeTransactionType = 'Airtime' | 'Data' | 'SMS';

// Phone Number Type
export type PhoneNumberType = 'Mobile' | 'Landline' | 'Unknown';

// Constants for airtime service
export const AIRTIME_CONSTANTS = {
  MIN_AIRTIME_AMOUNT: 5, // Minimum airtime amount
  MAX_AIRTIME_AMOUNT: 1000, // Maximum airtime amount
  PHONE_NUMBER_REGEX: /^(\+27|0)([0-9]{9})$/, // South African phone number format
  DEFAULT_PAGE_SIZE: 20,
  COMMON_DENOMINATIONS: [5, 10, 20, 30, 50, 100, 200, 500], // Common airtime amounts
} as const;

// Common Network Codes (for South Africa)
export const NETWORK_CODES = {
  MTN: 'MTN',
  VODACOM: 'VDC',
  CELL_C: 'CLC',
  TELKOM: 'TLK',
  RAIN: 'RAIN',
} as const;

// Airtime API Endpoints
export const AIRTIME_ENDPOINTS = {
  NETWORKS: '/Airtime/Networks',
  PHONE_VALIDATION: '/Airtime/PhoneValidation',
  DATA_BUNDLES: '/Airtime/DataBundles',
  PURCHASE_AIRTIME: '/Airtime/Purchase',
  PURCHASE_DATA: '/Airtime/PurchaseData',
  HISTORY: '/Airtime/History',
  TRANSACTION_STATUS: '/Airtime/TransactionStatus',
} as const;