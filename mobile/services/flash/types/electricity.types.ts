/**
 * Flash Partner API v4 - Prepaid Electricity Service Types
 * Based on Flash Partner API V4 - V2.pdf documentation
 */

// Municipality/Utility Provider Types
export interface Municipality {
  Code: string;
  Name: string;
  IsActive: boolean;
}

// Meter Lookup Request
export interface MeterLookupRequest {
  MeterNumber: string;
  MunicipalityCode: string;
}

// Meter Lookup Response  
export interface MeterLookupResponse {
  MeterNumber: string;
  CustomerName: string;
  CustomerAddress: string;
  MunicipalityCode: string;
  MunicipalityName: string;
  AccountType: string;
  TariffCode?: string;
  Status: 'Active' | 'Inactive' | 'Blocked';
  LastPurchaseDate?: string;
  DebtAmount?: number;
  IsValid: boolean;
}

// Electricity Purchase Request
export interface ElectricityPurchaseRequest {
  MeterNumber: string;
  MunicipalityCode: string;
  Amount: number;
  AccountNumber: string;
  Reference1?: string;
  Reference2?: string;
  Reference3?: string;
  Reference4?: string;
}

// Electricity Purchase Response
export interface ElectricityPurchaseResponse {
  TransactionId: string;
  MeterNumber: string;
  Amount: number;
  UnitsIssued: number;
  TokenValue: string; // The 20-digit electricity token
  CustomerName: string;
  CustomerAddress: string;
  MunicipalityName: string;
  TransactionDate: string;
  Reference1?: string;
  Reference2?: string;
  Reference3?: string;
  Reference4?: string;
  Status: 'Success' | 'Failed' | 'Pending';
  DebtRecovery?: number;
  ServiceCharge?: number;
  VAT?: number;
}

// Electricity Transaction History Request
export interface ElectricityHistoryRequest {
  AccountNumber: string;
  MeterNumber?: string;
  StartDate?: string;
  EndDate?: string;
  PageNumber?: number;
  PageSize?: number;
}

// Electricity Transaction History Response
export interface ElectricityHistoryResponse {
  Transactions: ElectricityTransaction[];
  TotalRecords: number;
  PageNumber: number;
  PageSize: number;
  TotalPages: number;
}

// Individual Electricity Transaction
export interface ElectricityTransaction {
  TransactionId: string;
  MeterNumber: string;
  Amount: number;
  UnitsIssued: number;
  TokenValue: string;
  CustomerName: string;
  MunicipalityName: string;
  TransactionDate: string;
  Status: 'Success' | 'Failed' | 'Pending';
  Reference1?: string;
  Reference2?: string;
  Reference3?: string;
  Reference4?: string;
  DebtRecovery?: number;
  ServiceCharge?: number;
  VAT?: number;
}

// Electricity Service Error Types
export interface ElectricityError {
  code: 'INVALID_METER' | 'METER_BLOCKED' | 'INSUFFICIENT_FUNDS' | 'INVALID_AMOUNT' | 'MUNICIPALITY_UNAVAILABLE' | 'TRANSACTION_FAILED';
  message: string;
  meterNumber?: string;
  transactionId?: string;
}

// Electricity Purchase Form Data (for UI)
export interface ElectricityPurchaseForm {
  meterNumber: string;
  amount: string;
  municipalityCode: string;
  reference?: string;
}

// Electricity Receipt Data (for sharing)
export interface ElectricityReceipt {
  transactionId: string;
  meterNumber: string;
  amount: number;
  unitsIssued: number;
  tokenValue: string;
  customerName: string;
  customerAddress: string;
  municipalityName: string;
  transactionDate: string;
  guardName: string;
  location: string;
  reference?: string;
  charges: {
    debtRecovery?: number;
    serviceCharge?: number;
    vat?: number;
  };
}

// Electricity Filter Options (for UI)
export interface ElectricityFilterOptions {
  status: 'Success' | 'Failed' | 'Pending' | 'all';
  meterNumber?: string;
  startDate?: string;
  endDate?: string;
  amountRange?: {
    min: number;
    max: number;
  };
}

// Electricity Summary (for dashboard)
export interface ElectricitySummary {
  totalPurchases: number;
  totalAmount: number;
  totalUnits: number;
  uniqueMeters: number;
  successfulTransactions: number;
  pendingTransactions: number;
  failedTransactions: number;
  lastTransactionDate?: string;
}

// Meter Status Types
export type MeterStatus = 'Active' | 'Inactive' | 'Blocked';

// Constants for electricity service
export const ELECTRICITY_CONSTANTS = {
  MIN_AMOUNT: 5, // Minimum electricity purchase amount
  MAX_AMOUNT: 5000, // Maximum electricity purchase amount
  METER_NUMBER_LENGTH: 11, // Standard meter number length
  TOKEN_LENGTH: 20, // Standard electricity token length
  DEFAULT_PAGE_SIZE: 20,
  TOKEN_DISPLAY_FORMAT: /(\d{4})(\d{4})(\d{4})(\d{4})(\d{4})/, // For formatting 20-digit token
} as const;

// Common QA Meter Numbers (from documentation)
export const QA_METER_NUMBERS = [
  '04004444884',
  '75835368301',
] as const;

// Electricity API Endpoints
export const ELECTRICITY_ENDPOINTS = {
  MUNICIPALITIES: '/PrepaidElectricity/Municipalities',
  METER_LOOKUP: '/PrepaidElectricity/MeterLookup',
  PURCHASE: '/PrepaidElectricity/Purchase',
  HISTORY: '/PrepaidElectricity/History',
  TRANSACTION_STATUS: '/PrepaidElectricity/TransactionStatus',
} as const;