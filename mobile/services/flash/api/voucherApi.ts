/**
 * Flash Partner API v4 - 1Voucher Service
 * Handles voucher purchases, history, and details
 */

import { BaseApiService, BaseApiResponse } from './baseApi';
import {
  VoucherPurchaseRequest,
  VoucherPurchaseResponse,
  VoucherHistoryRequest,
  VoucherHistoryResponse,
  VoucherDetailsRequest,
  VoucherTransaction,
  VoucherError,
  VoucherSummary,
  VoucherStatus,
} from '../types/voucher.types';
import { API_ENDPOINTS, BUSINESS_RULES } from '../utils/constants';
import { validateAmount, validateReference } from '../utils/validators';

/**
 * 1Voucher API Service
 * Handles all 1Voucher related API operations
 */
export class VoucherApiService extends BaseApiService {
  private static instance: VoucherApiService;

  public static getInstance(): VoucherApiService {
    if (!VoucherApiService.instance) {
      VoucherApiService.instance = new VoucherApiService();
    }
    return VoucherApiService.instance;
  }

  /**
   * Purchase a 1Voucher
   */
  async purchaseVoucher(
    amount: number,
    reference?: string
  ): Promise<BaseApiResponse<VoucherPurchaseResponse>> {
    try {
      // Validate input
      const amountValidation = validateAmount(amount, 'voucher');
      if (!amountValidation.isValid) {
        throw new Error(amountValidation.error);
      }

      if (reference) {
        const referenceValidation = validateReference(reference);
        if (!referenceValidation.isValid) {
          throw new Error(referenceValidation.error);
        }
      }

      // Get account number
      const accountNumber = await this.getAccountNumber();

      // Prepare request
      const requestData: VoucherPurchaseRequest = {
        Amount: amount,
        AccountNumber: accountNumber,
        ...(reference && { Reference1: reference }),
      };

      // Make API call
      const response = await this.post<VoucherPurchaseResponse>(
        API_ENDPOINTS.VOUCHER.PURCHASE,
        requestData,
        {
          timeout: 45000, // Longer timeout for purchase operations
        }
      );

      if (response.success && response.data) {
        console.log(`Successfully purchased voucher: ${response.data.TransactionId}`);
      }

      return response;

    } catch (error: any) {
      console.error('Voucher purchase failed:', error);
      return {
        success: false,
        error: this.mapVoucherError(error),
      };
    }
  }

  /**
   * Get voucher transaction history
   */
  async getVoucherHistory(
    options: {
      startDate?: string;
      endDate?: string;
      pageNumber?: number;
      pageSize?: number;
    } = {}
  ): Promise<BaseApiResponse<VoucherHistoryResponse>> {
    try {
      // Get account number
      const accountNumber = await this.getAccountNumber();

      // Prepare request parameters
      const params: VoucherHistoryRequest = {
        AccountNumber: accountNumber,
        PageNumber: options.pageNumber || 1,
        PageSize: options.pageSize || BUSINESS_RULES.PAGINATION.DEFAULT_PAGE_SIZE,
        ...(options.startDate && { StartDate: options.startDate }),
        ...(options.endDate && { EndDate: options.endDate }),
      };

      // Make API call
      const response = await this.get<VoucherHistoryResponse>(
        API_ENDPOINTS.VOUCHER.HISTORY,
        { params }
      );

      return response;

    } catch (error: any) {
      console.error('Get voucher history failed:', error);
      return {
        success: false,
        error: this.mapVoucherError(error),
      };
    }
  }

  /**
   * Get voucher details by transaction ID
   */
  async getVoucherDetails(
    transactionId: string
  ): Promise<BaseApiResponse<VoucherTransaction>> {
    try {
      if (!transactionId) {
        throw new Error('Transaction ID is required');
      }

      // Get account number
      const accountNumber = await this.getAccountNumber();

      // Prepare request
      const requestData: VoucherDetailsRequest = {
        TransactionId: transactionId,
        AccountNumber: accountNumber,
      };

      // Make API call
      const response = await this.post<VoucherTransaction>(
        API_ENDPOINTS.VOUCHER.DETAILS,
        requestData
      );

      return response;

    } catch (error: any) {
      console.error('Get voucher details failed:', error);
      return {
        success: false,
        error: this.mapVoucherError(error),
      };
    }
  }

  /**
   * Get voucher summary statistics
   */
  async getVoucherSummary(
    dateRange?: { startDate: string; endDate: string }
  ): Promise<BaseApiResponse<VoucherSummary>> {
    try {
      // Get voucher history
      const historyResponse = await this.getVoucherHistory({
        ...dateRange,
        pageSize: 1000, // Get a large number to calculate summary
      });

      if (!historyResponse.success || !historyResponse.data) {
        return {
          success: false,
          error: historyResponse.error || { code: 'SUMMARY_ERROR', message: 'Failed to get voucher summary' },
        };
      }

      const transactions = historyResponse.data.Transactions;

      // Calculate summary statistics
      const summary: VoucherSummary = {
        totalPurchases: transactions.length,
        totalAmount: transactions.reduce((sum, tx) => sum + tx.Amount, 0),
        successfulTransactions: transactions.filter(tx => tx.Status === 'Success').length,
        pendingTransactions: transactions.filter(tx => tx.Status === 'Pending').length,
        failedTransactions: transactions.filter(tx => tx.Status === 'Failed').length,
        lastTransactionDate: transactions.length > 0 ? transactions[0].TransactionDate : undefined,
      };

      return {
        success: true,
        data: summary,
      };

    } catch (error: any) {
      console.error('Get voucher summary failed:', error);
      return {
        success: false,
        error: this.mapVoucherError(error),
      };
    }
  }

  /**
   * Get vouchers by status
   */
  async getVouchersByStatus(
    status: VoucherStatus,
    options: {
      pageNumber?: number;
      pageSize?: number;
    } = {}
  ): Promise<BaseApiResponse<VoucherTransaction[]>> {
    try {
      // Get all vouchers
      const historyResponse = await this.getVoucherHistory({
        pageNumber: options.pageNumber,
        pageSize: options.pageSize,
      });

      if (!historyResponse.success || !historyResponse.data) {
        return {
          success: false,
          error: historyResponse.error || { code: 'FILTER_ERROR', message: 'Failed to filter vouchers' },
        };
      }

      // Filter by status
      const filteredTransactions = historyResponse.data.Transactions.filter(
        tx => tx.Status === status
      );

      return {
        success: true,
        data: filteredTransactions,
      };

    } catch (error: any) {
      console.error('Get vouchers by status failed:', error);
      return {
        success: false,
        error: this.mapVoucherError(error),
      };
    }
  }

  /**
   * Search vouchers by reference or amount
   */
  async searchVouchers(
    query: {
      reference?: string;
      amount?: number;
      minAmount?: number;
      maxAmount?: number;
    },
    options: {
      pageNumber?: number;
      pageSize?: number;
    } = {}
  ): Promise<BaseApiResponse<VoucherTransaction[]>> {
    try {
      // Get all vouchers
      const historyResponse = await this.getVoucherHistory({
        pageNumber: options.pageNumber,
        pageSize: options.pageSize,
      });

      if (!historyResponse.success || !historyResponse.data) {
        return {
          success: false,
          error: historyResponse.error || { code: 'SEARCH_ERROR', message: 'Failed to search vouchers' },
        };
      }

      // Apply filters
      let filteredTransactions = historyResponse.data.Transactions;

      if (query.reference) {
        filteredTransactions = filteredTransactions.filter(tx =>
          tx.Reference1?.toLowerCase().includes(query.reference!.toLowerCase()) ||
          tx.Reference2?.toLowerCase().includes(query.reference!.toLowerCase()) ||
          tx.Reference3?.toLowerCase().includes(query.reference!.toLowerCase()) ||
          tx.Reference4?.toLowerCase().includes(query.reference!.toLowerCase())
        );
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
      console.error('Search vouchers failed:', error);
      return {
        success: false,
        error: this.mapVoucherError(error),
      };
    }
  }

  /**
   * Check if voucher is expired or expiring soon
   */
  async checkVoucherExpiry(
    transactionId: string
  ): Promise<BaseApiResponse<{ isExpired: boolean; isExpiringSoon: boolean; daysUntilExpiry: number }>> {
    try {
      const detailsResponse = await this.getVoucherDetails(transactionId);

      if (!detailsResponse.success || !detailsResponse.data) {
        return {
          success: false,
          error: detailsResponse.error || { code: 'EXPIRY_CHECK_ERROR', message: 'Failed to check voucher expiry' },
        };
      }

      const voucher = detailsResponse.data;
      const expiryDate = new Date(voucher.ExpiryDate);
      const today = new Date();
      const timeDiff = expiryDate.getTime() - today.getTime();
      const daysUntilExpiry = Math.ceil(timeDiff / (1000 * 3600 * 24));

      const isExpired = daysUntilExpiry < 0;
      const isExpiringSoon = !isExpired && daysUntilExpiry <= BUSINESS_RULES.VOUCHER.EXPIRY_WARNING_DAYS;

      return {
        success: true,
        data: {
          isExpired,
          isExpiringSoon,
          daysUntilExpiry: Math.max(0, daysUntilExpiry),
        },
      };

    } catch (error: any) {
      console.error('Check voucher expiry failed:', error);
      return {
        success: false,
        error: this.mapVoucherError(error),
      };
    }
  }

  /**
   * Map error to voucher-specific error format
   */
  private mapVoucherError(error: any): VoucherError {
    if (error.message) {
      // Handle validation errors
      if (error.message.includes('amount') || error.message.includes('Amount')) {
        return { code: 'INVALID_AMOUNT', message: error.message };
      }
      if (error.message.includes('account') || error.message.includes('Account')) {
        return { code: 'INVALID_ACCOUNT', message: error.message };
      }
      if (error.message.includes('funds') || error.message.includes('balance')) {
        return { code: 'INSUFFICIENT_FUNDS', message: error.message };
      }
    }

    // Handle API errors
    if (error.code) {
      switch (error.code) {
        case 'INSUFFICIENT_FUNDS':
          return { code: 'INSUFFICIENT_FUNDS', message: error.message || 'Insufficient balance for this transaction' };
        case 'INVALID_CREDENTIALS':
          return { code: 'INVALID_ACCOUNT', message: error.message || 'Invalid account credentials' };
        case 'NETWORK_ERROR':
          return { code: 'NETWORK_ERROR', message: error.message || 'Network connection failed' };
        default:
          return { code: 'TRANSACTION_FAILED', message: error.message || 'Transaction failed' };
      }
    }

    // Default error
    return {
      code: 'TRANSACTION_FAILED',
      message: error.message || 'Voucher transaction failed',
    };
  }

  /**
   * Get available voucher denominations
   */
  getAvailableDenominations(): number[] {
    return [...BUSINESS_RULES.VOUCHER.DENOMINATIONS];
  }

  /**
   * Validate voucher amount
   */
  validateVoucherAmount(amount: number): { isValid: boolean; error?: string } {
    return validateAmount(amount, 'voucher');
  }

  /**
   * Get voucher business rules
   */
  getBusinessRules() {
    return {
      minAmount: BUSINESS_RULES.VOUCHER.MIN_AMOUNT,
      maxAmount: BUSINESS_RULES.VOUCHER.MAX_AMOUNT,
      denominations: BUSINESS_RULES.VOUCHER.DENOMINATIONS,
      pinLength: BUSINESS_RULES.VOUCHER.PIN_LENGTH,
    };
  }
}