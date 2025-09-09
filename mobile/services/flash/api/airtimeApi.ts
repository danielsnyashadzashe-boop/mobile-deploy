/**
 * Flash Partner API v4 - Airtime/eeziVoucher Service
 * Handles airtime and data purchases, phone validation, and history
 */

import { BaseApiService, BaseApiResponse } from './baseApi';
import {
  NetworkProvider,
  PhoneValidationRequest,
  PhoneValidationResponse,
  AirtimePurchaseRequest,
  AirtimePurchaseResponse,
  DataBundle,
  DataPurchaseRequest,
  DataPurchaseResponse,
  AirtimeHistoryRequest,
  AirtimeHistoryResponse,
  AirtimeTransaction,
  AirtimeError,
  AirtimeSummary,
  AirtimeTransactionType,
} from '../types/airtime.types';
import { API_ENDPOINTS, BUSINESS_RULES, NETWORK_PROVIDERS, QA_TEST_DATA } from '../utils/constants';
import { validateAmount, validatePhoneNumber, validateReference, formatPhoneNumber } from '../utils/validators';

/**
 * Airtime/eeziVoucher API Service
 * Handles all airtime and data related API operations
 */
export class AirtimeApiService extends BaseApiService {
  private static instance: AirtimeApiService;
  private networkProvidersCache: NetworkProvider[] | null = null;
  private dataBundlesCache: Map<string, DataBundle[]> = new Map();

  public static getInstance(): AirtimeApiService {
    if (!AirtimeApiService.instance) {
      AirtimeApiService.instance = new AirtimeApiService();
    }
    return AirtimeApiService.instance;
  }

  /**
   * Get list of available network providers
   */
  async getNetworkProviders(): Promise<BaseApiResponse<NetworkProvider[]>> {
    try {
      // Return cached data if available
      if (this.networkProvidersCache) {
        return {
          success: true,
          data: this.networkProvidersCache,
        };
      }

      // Make API call
      const response = await this.get<NetworkProvider[]>(
        API_ENDPOINTS.AIRTIME.NETWORKS
      );

      // Cache successful response
      if (response.success && response.data) {
        this.networkProvidersCache = response.data;
      }

      return response;

    } catch (error: any) {
      console.error('Get network providers failed:', error);
      return {
        success: false,
        error: this.mapAirtimeError(error),
      };
    }
  }

  /**
   * Validate phone number and detect network
   */
  async validatePhoneNumber(
    phoneNumber: string
  ): Promise<BaseApiResponse<PhoneValidationResponse>> {
    try {
      // Basic client-side validation first
      const validation = validatePhoneNumber(phoneNumber);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Format phone number
      const formattedNumber = formatPhoneNumber(phoneNumber);

      // Prepare request
      const requestData: PhoneValidationRequest = {
        PhoneNumber: formattedNumber,
      };

      // Make API call
      const response = await this.post<PhoneValidationResponse>(
        API_ENDPOINTS.AIRTIME.PHONE_VALIDATION,
        requestData
      );

      return response;

    } catch (error: any) {
      console.error('Phone validation failed:', error);
      return {
        success: false,
        error: this.mapAirtimeError(error),
      };
    }
  }

  /**
   * Get data bundles for a specific network
   */
  async getDataBundles(
    networkCode: string
  ): Promise<BaseApiResponse<DataBundle[]>> {
    try {
      // Return cached data if available
      const cachedBundles = this.dataBundlesCache.get(networkCode);
      if (cachedBundles) {
        return {
          success: true,
          data: cachedBundles,
        };
      }

      // Make API call
      const response = await this.get<DataBundle[]>(
        API_ENDPOINTS.AIRTIME.DATA_BUNDLES,
        {
          params: { NetworkCode: networkCode },
        }
      );

      // Cache successful response
      if (response.success && response.data) {
        this.dataBundlesCache.set(networkCode, response.data);
      }

      return response;

    } catch (error: any) {
      console.error('Get data bundles failed:', error);
      return {
        success: false,
        error: this.mapAirtimeError(error),
      };
    }
  }

  /**
   * Purchase airtime
   */
  async purchaseAirtime(
    phoneNumber: string,
    amount: number,
    networkCode?: string,
    reference?: string
  ): Promise<BaseApiResponse<AirtimePurchaseResponse>> {
    try {
      // Validate input
      const phoneValidation = validatePhoneNumber(phoneNumber);
      if (!phoneValidation.isValid) {
        throw new Error(phoneValidation.error);
      }

      const amountValidation = validateAmount(amount, 'airtime');
      if (!amountValidation.isValid) {
        throw new Error(amountValidation.error);
      }

      if (reference) {
        const referenceValidation = validateReference(reference);
        if (!referenceValidation.isValid) {
          throw new Error(referenceValidation.error);
        }
      }

      // Format phone number
      const formattedPhoneNumber = formatPhoneNumber(phoneNumber);

      // Detect network if not provided
      let finalNetworkCode = networkCode;
      if (!finalNetworkCode) {
        const phoneValidationResponse = await this.validatePhoneNumber(formattedPhoneNumber);
        if (phoneValidationResponse.success && phoneValidationResponse.data) {
          finalNetworkCode = phoneValidationResponse.data.NetworkCode;
        } else {
          throw new Error('Unable to detect network. Please specify network code.');
        }
      }

      // Get account number
      const accountNumber = await this.getAccountNumber();

      // Prepare request
      const requestData: AirtimePurchaseRequest = {
        PhoneNumber: formattedPhoneNumber,
        NetworkCode: finalNetworkCode,
        Amount: amount,
        AccountNumber: accountNumber,
        ...(reference && { Reference1: reference }),
      };

      // Make API call with longer timeout for purchases
      const response = await this.post<AirtimePurchaseResponse>(
        API_ENDPOINTS.AIRTIME.PURCHASE_AIRTIME,
        requestData,
        {
          timeout: 45000, // 45 seconds for airtime purchases
        }
      );

      if (response.success && response.data) {
        console.log(`Successfully purchased airtime: ${response.data.TransactionId}`);
      }

      return response;

    } catch (error: any) {
      console.error('Airtime purchase failed:', error);
      return {
        success: false,
        error: this.mapAirtimeError(error),
      };
    }
  }

  /**
   * Purchase data bundle
   */
  async purchaseDataBundle(
    phoneNumber: string,
    bundleCode: string,
    networkCode?: string,
    reference?: string
  ): Promise<BaseApiResponse<DataPurchaseResponse>> {
    try {
      // Validate input
      const phoneValidation = validatePhoneNumber(phoneNumber);
      if (!phoneValidation.isValid) {
        throw new Error(phoneValidation.error);
      }

      if (!bundleCode) {
        throw new Error('Bundle code is required');
      }

      if (reference) {
        const referenceValidation = validateReference(reference);
        if (!referenceValidation.isValid) {
          throw new Error(referenceValidation.error);
        }
      }

      // Format phone number
      const formattedPhoneNumber = formatPhoneNumber(phoneNumber);

      // Detect network if not provided
      let finalNetworkCode = networkCode;
      if (!finalNetworkCode) {
        const phoneValidationResponse = await this.validatePhoneNumber(formattedPhoneNumber);
        if (phoneValidationResponse.success && phoneValidationResponse.data) {
          finalNetworkCode = phoneValidationResponse.data.NetworkCode;
        } else {
          throw new Error('Unable to detect network. Please specify network code.');
        }
      }

      // Get account number
      const accountNumber = await this.getAccountNumber();

      // Prepare request
      const requestData: DataPurchaseRequest = {
        PhoneNumber: formattedPhoneNumber,
        NetworkCode: finalNetworkCode,
        BundleCode: bundleCode,
        AccountNumber: accountNumber,
        ...(reference && { Reference1: reference }),
      };

      // Make API call with longer timeout for purchases
      const response = await this.post<DataPurchaseResponse>(
        API_ENDPOINTS.AIRTIME.PURCHASE_DATA,
        requestData,
        {
          timeout: 45000, // 45 seconds for data purchases
        }
      );

      if (response.success && response.data) {
        console.log(`Successfully purchased data bundle: ${response.data.TransactionId}`);
      }

      return response;

    } catch (error: any) {
      console.error('Data purchase failed:', error);
      return {
        success: false,
        error: this.mapAirtimeError(error),
      };
    }
  }

  /**
   * Get airtime transaction history
   */
  async getAirtimeHistory(
    options: {
      phoneNumber?: string;
      networkCode?: string;
      startDate?: string;
      endDate?: string;
      pageNumber?: number;
      pageSize?: number;
    } = {}
  ): Promise<BaseApiResponse<AirtimeHistoryResponse>> {
    try {
      // Get account number
      const accountNumber = await this.getAccountNumber();

      // Prepare request parameters
      const params: AirtimeHistoryRequest = {
        AccountNumber: accountNumber,
        PageNumber: options.pageNumber || 1,
        PageSize: options.pageSize || BUSINESS_RULES.PAGINATION.DEFAULT_PAGE_SIZE,
        ...(options.phoneNumber && { PhoneNumber: formatPhoneNumber(options.phoneNumber) }),
        ...(options.networkCode && { NetworkCode: options.networkCode }),
        ...(options.startDate && { StartDate: options.startDate }),
        ...(options.endDate && { EndDate: options.endDate }),
      };

      // Make API call
      const response = await this.get<AirtimeHistoryResponse>(
        API_ENDPOINTS.AIRTIME.HISTORY,
        { params }
      );

      return response;

    } catch (error: any) {
      console.error('Get airtime history failed:', error);
      return {
        success: false,
        error: this.mapAirtimeError(error),
      };
    }
  }

  /**
   * Get airtime transaction by ID
   */
  async getAirtimeTransaction(
    transactionId: string
  ): Promise<BaseApiResponse<AirtimeTransaction>> {
    try {
      if (!transactionId) {
        throw new Error('Transaction ID is required');
      }

      // Get account number
      const accountNumber = await this.getAccountNumber();

      // Make API call
      const response = await this.get<AirtimeTransaction>(
        `${API_ENDPOINTS.AIRTIME.TRANSACTION_STATUS}/${transactionId}`,
        {
          params: { AccountNumber: accountNumber },
        }
      );

      return response;

    } catch (error: any) {
      console.error('Get airtime transaction failed:', error);
      return {
        success: false,
        error: this.mapAirtimeError(error),
      };
    }
  }

  /**
   * Get airtime summary statistics
   */
  async getAirtimeSummary(
    dateRange?: { startDate: string; endDate: string }
  ): Promise<BaseApiResponse<AirtimeSummary>> {
    try {
      // Get airtime history
      const historyResponse = await this.getAirtimeHistory({
        ...dateRange,
        pageSize: 1000, // Get a large number to calculate summary
      });

      if (!historyResponse.success || !historyResponse.data) {
        return {
          success: false,
          error: historyResponse.error || { code: 'SUMMARY_ERROR', message: 'Failed to get airtime summary' },
        };
      }

      const transactions = historyResponse.data.Transactions;

      // Calculate summary statistics
      const uniqueNumbers = new Set(transactions.map(tx => tx.PhoneNumber));
      const networkCounts = new Map<string, { name: string; count: number; amount: number }>();

      transactions.forEach(tx => {
        const networkKey = tx.NetworkCode;
        const existing = networkCounts.get(networkKey) || { name: tx.NetworkName, count: 0, amount: 0 };
        networkCounts.set(networkKey, {
          name: existing.name,
          count: existing.count + 1,
          amount: existing.amount + tx.Amount,
        });
      });

      const topNetworks = Array.from(networkCounts.entries())
        .map(([code, data]) => ({
          networkCode: code,
          networkName: data.name,
          transactionCount: data.count,
          totalAmount: data.amount,
        }))
        .sort((a, b) => b.transactionCount - a.transactionCount);

      const summary: AirtimeSummary = {
        totalPurchases: transactions.length,
        totalAmount: transactions.reduce((sum, tx) => sum + tx.Amount, 0),
        airtimeTransactions: transactions.filter(tx => tx.TransactionType === 'Airtime').length,
        dataTransactions: transactions.filter(tx => tx.TransactionType === 'Data').length,
        uniqueNumbers: uniqueNumbers.size,
        successfulTransactions: transactions.filter(tx => tx.Status === 'Success').length,
        pendingTransactions: transactions.filter(tx => tx.Status === 'Pending').length,
        failedTransactions: transactions.filter(tx => tx.Status === 'Failed').length,
        lastTransactionDate: transactions.length > 0 ? transactions[0].TransactionDate : undefined,
        topNetworks,
      };

      return {
        success: true,
        data: summary,
      };

    } catch (error: any) {
      console.error('Get airtime summary failed:', error);
      return {
        success: false,
        error: this.mapAirtimeError(error),
      };
    }
  }

  /**
   * Search airtime transactions
   */
  async searchAirtimeTransactions(
    query: {
      phoneNumber?: string;
      networkCode?: string;
      transactionType?: AirtimeTransactionType;
      amount?: number;
      minAmount?: number;
      maxAmount?: number;
    },
    options: {
      pageNumber?: number;
      pageSize?: number;
    } = {}
  ): Promise<BaseApiResponse<AirtimeTransaction[]>> {
    try {
      // Get transactions with basic filters
      const historyResponse = await this.getAirtimeHistory({
        phoneNumber: query.phoneNumber,
        networkCode: query.networkCode,
        pageNumber: options.pageNumber,
        pageSize: options.pageSize,
      });

      if (!historyResponse.success || !historyResponse.data) {
        return {
          success: false,
          error: historyResponse.error || { code: 'SEARCH_ERROR', message: 'Failed to search airtime transactions' },
        };
      }

      // Apply additional filters
      let filteredTransactions = historyResponse.data.Transactions;

      if (query.transactionType) {
        filteredTransactions = filteredTransactions.filter(tx => tx.TransactionType === query.transactionType);
      }

      if (query.amount !== undefined) {
        filteredTransactions = filteredTransactions.filter(tx => tx.Amount === query.amount);
      }

      if (query.minAmount !== undefined) {
        filteredTransactions = filteredTransactions.filter(tx => tx.Amount >= query.minAmount!);
      }

      if (query.maxAmount !== undefined) {
        filteredTransactions = filteredTransactions.filter(tx => tx.Amount <= query.maxAmount!);
      }

      return {
        success: true,
        data: filteredTransactions,
      };

    } catch (error: any) {
      console.error('Search airtime transactions failed:', error);
      return {
        success: false,
        error: this.mapAirtimeError(error),
      };
    }
  }

  /**
   * Get transaction status by ID
   */
  async getTransactionStatus(
    transactionId: string
  ): Promise<BaseApiResponse<{ status: string; message?: string }>> {
    try {
      const transactionResponse = await this.getAirtimeTransaction(transactionId);
      
      if (!transactionResponse.success || !transactionResponse.data) {
        return {
          success: false,
          error: transactionResponse.error || { code: 'STATUS_ERROR', message: 'Failed to get transaction status' },
        };
      }

      return {
        success: true,
        data: {
          status: transactionResponse.data.Status,
          message: `Transaction ${transactionResponse.data.Status.toLowerCase()}`,
        },
      };

    } catch (error: any) {
      console.error('Get transaction status failed:', error);
      return {
        success: false,
        error: this.mapAirtimeError(error),
      };
    }
  }

  /**
   * Map error to airtime-specific error format
   */
  private mapAirtimeError(error: any): AirtimeError {
    if (error.message) {
      // Handle validation errors
      if (error.message.includes('phone') || error.message.includes('Phone')) {
        return { code: 'INVALID_PHONE', message: error.message };
      }
      if (error.message.includes('amount') || error.message.includes('Amount')) {
        return { code: 'INVALID_AMOUNT', message: error.message };
      }
      if (error.message.includes('funds') || error.message.includes('balance')) {
        return { code: 'INSUFFICIENT_FUNDS', message: error.message };
      }
      if (error.message.includes('network') || error.message.includes('Network')) {
        return { code: 'NETWORK_UNAVAILABLE', message: error.message };
      }
      if (error.message.includes('bundle') || error.message.includes('Bundle')) {
        return { code: 'INVALID_BUNDLE', message: error.message };
      }
    }

    // Handle API errors
    if (error.code) {
      switch (error.code) {
        case 'INVALID_PHONE':
          return { code: 'INVALID_PHONE', message: error.message || 'Invalid phone number' };
        case 'NETWORK_UNAVAILABLE':
          return { code: 'NETWORK_UNAVAILABLE', message: error.message || 'Network service unavailable' };
        case 'INSUFFICIENT_FUNDS':
          return { code: 'INSUFFICIENT_FUNDS', message: error.message || 'Insufficient balance for this transaction' };
        case 'INVALID_BUNDLE':
          return { code: 'INVALID_BUNDLE', message: error.message || 'Invalid data bundle selected' };
        case 'NETWORK_ERROR':
          return { code: 'TRANSACTION_FAILED', message: error.message || 'Network connection failed' };
        default:
          return { code: 'TRANSACTION_FAILED', message: error.message || 'Transaction failed' };
      }
    }

    // Default error
    return {
      code: 'TRANSACTION_FAILED',
      message: error.message || 'Airtime transaction failed',
    };
  }

  /**
   * Clear cache (useful for testing or data refresh)
   */
  clearCache(): void {
    this.networkProvidersCache = null;
    this.dataBundlesCache.clear();
  }

  /**
   * Get QA test phone numbers
   */
  getQAPhoneNumbers(): string[] {
    return [...QA_TEST_DATA.PHONE_NUMBERS];
  }

  /**
   * Get network provider info by code
   */
  getNetworkProviderInfo(code: string) {
    return NETWORK_PROVIDERS[code as keyof typeof NETWORK_PROVIDERS] || null;
  }

  /**
   * Get airtime business rules
   */
  getBusinessRules() {
    return {
      minAmount: BUSINESS_RULES.AIRTIME.MIN_AMOUNT,
      maxAmount: BUSINESS_RULES.AIRTIME.MAX_AMOUNT,
      commonDenominations: BUSINESS_RULES.AIRTIME.COMMON_DENOMINATIONS,
    };
  }

  /**
   * Validate airtime amount
   */
  validateAirtimeAmount(amount: number): { isValid: boolean; error?: string } {
    return validateAmount(amount, 'airtime');
  }

  /**
   * Detect network from phone number (basic client-side detection)
   */
  detectNetworkFromPhone(phoneNumber: string): string | null {
    const cleanNumber = phoneNumber.replace(/\s/g, '');
    
    // Basic South African network detection (simplified)
    if (cleanNumber.match(/^(\+27|0)(82|83|84)/)) {
      return NETWORK_PROVIDERS.VODACOM.code;
    } else if (cleanNumber.match(/^(\+27|0)(81|76|77)/)) {
      return NETWORK_PROVIDERS.MTN.code;
    } else if (cleanNumber.match(/^(\+27|0)(74)/)) {
      return NETWORK_PROVIDERS.CELL_C.code;
    } else if (cleanNumber.match(/^(\+27|0)(67)/)) {
      return NETWORK_PROVIDERS.TELKOM.code;
    }
    
    return null; // Unknown network
  }
}