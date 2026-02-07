/**
 * Flash Partner API v4 - Prepaid Electricity Service
 * Handles electricity meter lookup, purchases, and history
 */

import { BaseApiService, BaseApiResponse } from './baseApi';
import {
  Municipality,
  MeterLookupRequest,
  MeterLookupResponse,
  ElectricityPurchaseRequest,
  ElectricityPurchaseResponse,
  ElectricityHistoryRequest,
  ElectricityHistoryResponse,
  ElectricityTransaction,
  ElectricityError,
  ElectricitySummary,
} from '../types/electricity.types';
import { API_ENDPOINTS, BUSINESS_RULES, QA_TEST_DATA } from '../utils/constants';
import { validateAmount, validateMeterNumber, validateReference } from '../utils/validators';

/**
 * Prepaid Electricity API Service
 * Handles all electricity related API operations
 */
export class ElectricityApiService extends BaseApiService {
  private static instance: ElectricityApiService;
  private municipalitiesCache: Municipality[] | null = null;

  public static getInstance(): ElectricityApiService {
    if (!ElectricityApiService.instance) {
      ElectricityApiService.instance = new ElectricityApiService();
    }
    return ElectricityApiService.instance;
  }

  /**
   * Get list of available municipalities/utility providers
   */
  async getMunicipalities(): Promise<BaseApiResponse<Municipality[]>> {
    try {
      // Return cached data if available
      if (this.municipalitiesCache) {
        return {
          success: true,
          data: this.municipalitiesCache,
        };
      }

      // Make API call
      const response = await this.get<Municipality[]>(
        API_ENDPOINTS.ELECTRICITY.MUNICIPALITIES
      );

      // Cache successful response
      if (response.success && response.data) {
        this.municipalitiesCache = response.data;
      }

      return response;

    } catch (error: any) {
      console.error('Get municipalities failed:', error);
      return {
        success: false,
        error: this.mapElectricityError(error),
      };
    }
  }

  /**
   * Lookup meter details
   */
  async lookupMeter(
    meterNumber: string,
    municipalityCode?: string
  ): Promise<BaseApiResponse<MeterLookupResponse>> {
    try {
      // Validate meter number
      const meterValidation = validateMeterNumber(meterNumber);
      if (!meterValidation.isValid) {
        throw new Error(meterValidation.error);
      }

      // If no municipality code provided, try to detect or use default
      let finalMunicipalityCode = municipalityCode;
      if (!finalMunicipalityCode) {
        // For QA testing, use a default municipality code
        finalMunicipalityCode = QA_TEST_DATA.MUNICIPALITY_CODES[0]; // CPT as default
      }

      // Prepare request
      const requestData: MeterLookupRequest = {
        MeterNumber: meterNumber.replace(/\s/g, ''), // Remove spaces
        MunicipalityCode: finalMunicipalityCode,
      };

      // Make API call
      const response = await this.post<MeterLookupResponse>(
        API_ENDPOINTS.ELECTRICITY.METER_LOOKUP,
        requestData
      );

      return response;

    } catch (error: any) {
      console.error('Meter lookup failed:', error);
      return {
        success: false,
        error: this.mapElectricityError(error),
      };
    }
  }

  /**
   * Purchase prepaid electricity
   */
  async purchaseElectricity(
    meterNumber: string,
    amount: number,
    municipalityCode: string,
    reference?: string
  ): Promise<BaseApiResponse<ElectricityPurchaseResponse>> {
    try {
      // Validate input
      const meterValidation = validateMeterNumber(meterNumber);
      if (!meterValidation.isValid) {
        throw new Error(meterValidation.error);
      }

      const amountValidation = validateAmount(amount, 'electricity');
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
      const requestData: ElectricityPurchaseRequest = {
        MeterNumber: meterNumber.replace(/\s/g, ''), // Remove spaces
        MunicipalityCode: municipalityCode,
        Amount: amount,
        AccountNumber: accountNumber,
        ...(reference && { Reference1: reference }),
      };

      // Make API call with longer timeout for purchases
      const response = await this.post<ElectricityPurchaseResponse>(
        API_ENDPOINTS.ELECTRICITY.PURCHASE,
        requestData,
        {
          timeout: 60000, // 60 seconds for electricity purchases
        }
      );

      if (response.success && response.data) {
        console.log(`Successfully purchased electricity: ${response.data.TransactionId}`);
      }

      return response;

    } catch (error: any) {
      console.error('Electricity purchase failed:', error);
      return {
        success: false,
        error: this.mapElectricityError(error),
      };
    }
  }

  /**
   * Get electricity transaction history
   */
  async getElectricityHistory(
    options: {
      meterNumber?: string;
      startDate?: string;
      endDate?: string;
      pageNumber?: number;
      pageSize?: number;
    } = {}
  ): Promise<BaseApiResponse<ElectricityHistoryResponse>> {
    try {
      // Get account number
      const accountNumber = await this.getAccountNumber();

      // Prepare request parameters
      const params: ElectricityHistoryRequest = {
        AccountNumber: accountNumber,
        PageNumber: options.pageNumber || 1,
        PageSize: options.pageSize || BUSINESS_RULES.PAGINATION.DEFAULT_PAGE_SIZE,
        ...(options.meterNumber && { MeterNumber: options.meterNumber.replace(/\s/g, '') }),
        ...(options.startDate && { StartDate: options.startDate }),
        ...(options.endDate && { EndDate: options.endDate }),
      };

      // Make API call
      const response = await this.get<ElectricityHistoryResponse>(
        API_ENDPOINTS.ELECTRICITY.HISTORY,
        { params }
      );

      return response;

    } catch (error: any) {
      console.error('Get electricity history failed:', error);
      return {
        success: false,
        error: this.mapElectricityError(error),
      };
    }
  }

  /**
   * Get electricity transaction by ID
   */
  async getElectricityTransaction(
    transactionId: string
  ): Promise<BaseApiResponse<ElectricityTransaction>> {
    try {
      if (!transactionId) {
        throw new Error('Transaction ID is required');
      }

      // Get account number
      const accountNumber = await this.getAccountNumber();

      // Make API call
      const response = await this.get<ElectricityTransaction>(
        `${API_ENDPOINTS.ELECTRICITY.TRANSACTION_STATUS}/${transactionId}`,
        {
          params: { AccountNumber: accountNumber },
        }
      );

      return response;

    } catch (error: any) {
      console.error('Get electricity transaction failed:', error);
      return {
        success: false,
        error: this.mapElectricityError(error),
      };
    }
  }

  /**
   * Get electricity summary statistics
   */
  async getElectricitySummary(
    dateRange?: { startDate: string; endDate: string }
  ): Promise<BaseApiResponse<ElectricitySummary>> {
    try {
      // Get electricity history
      const historyResponse = await this.getElectricityHistory({
        ...dateRange,
        pageSize: 1000, // Get a large number to calculate summary
      });

      if (!historyResponse.success || !historyResponse.data) {
        return {
          success: false,
          error: historyResponse.error || { code: 'SUMMARY_ERROR', message: 'Failed to get electricity summary' },
        };
      }

      const transactions = historyResponse.data.Transactions;

      // Calculate summary statistics
      const uniqueMeters = new Set(transactions.map(tx => tx.MeterNumber));
      
      const summary: ElectricitySummary = {
        totalPurchases: transactions.length,
        totalAmount: transactions.reduce((sum, tx) => sum + tx.Amount, 0),
        totalUnits: transactions.reduce((sum, tx) => sum + tx.UnitsIssued, 0),
        uniqueMeters: uniqueMeters.size,
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
      console.error('Get electricity summary failed:', error);
      return {
        success: false,
        error: this.mapElectricityError(error),
      };
    }
  }

  /**
   * Search electricity transactions
   */
  async searchElectricityTransactions(
    query: {
      meterNumber?: string;
      customerName?: string;
      amount?: number;
      minAmount?: number;
      maxAmount?: number;
      municipalityCode?: string;
    },
    options: {
      pageNumber?: number;
      pageSize?: number;
    } = {}
  ): Promise<BaseApiResponse<ElectricityTransaction[]>> {
    try {
      // Get all transactions
      const historyResponse = await this.getElectricityHistory({
        meterNumber: query.meterNumber,
        pageNumber: options.pageNumber,
        pageSize: options.pageSize,
      });

      if (!historyResponse.success || !historyResponse.data) {
        return {
          success: false,
          error: historyResponse.error || { code: 'SEARCH_ERROR', message: 'Failed to search electricity transactions' },
        };
      }

      // Apply additional filters
      let filteredTransactions = historyResponse.data.Transactions;

      if (query.customerName) {
        filteredTransactions = filteredTransactions.filter(tx =>
          tx.CustomerName.toLowerCase().includes(query.customerName!.toLowerCase())
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

      if (query.municipalityCode) {
        filteredTransactions = filteredTransactions.filter(tx =>
          tx.MunicipalityName.toLowerCase().includes(query.municipalityCode!.toLowerCase())
        );
      }

      return {
        success: true,
        data: filteredTransactions,
      };

    } catch (error: any) {
      console.error('Search electricity transactions failed:', error);
      return {
        success: false,
        error: this.mapElectricityError(error),
      };
    }
  }

  /**
   * Validate meter number format and checksum (if applicable)
   */
  async validateMeterNumber(
    meterNumber: string,
    municipalityCode?: string
  ): Promise<BaseApiResponse<{ isValid: boolean; municipality?: string }>> {
    try {
      const validation = validateMeterNumber(meterNumber);
      if (!validation.isValid) {
        return {
          success: true,
          data: { isValid: false },
        };
      }

      // If municipality code provided, we could do additional validation
      // For now, just return basic validation result
      return {
        success: true,
        data: { 
          isValid: true,
          municipality: municipalityCode,
        },
      };

    } catch (error: any) {
      console.error('Meter validation failed:', error);
      return {
        success: false,
        error: this.mapElectricityError(error),
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
      const transactionResponse = await this.getElectricityTransaction(transactionId);
      
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
        error: this.mapElectricityError(error),
      };
    }
  }

  /**
   * Map error to electricity-specific error format
   */
  private mapElectricityError(error: any): ElectricityError {
    if (error.message) {
      // Handle validation errors
      if (error.message.includes('meter') || error.message.includes('Meter')) {
        return { code: 'INVALID_METER', message: error.message };
      }
      if (error.message.includes('amount') || error.message.includes('Amount')) {
        return { code: 'INVALID_AMOUNT', message: error.message };
      }
      if (error.message.includes('funds') || error.message.includes('balance')) {
        return { code: 'INSUFFICIENT_FUNDS', message: error.message };
      }
      if (error.message.includes('blocked') || error.message.includes('Blocked')) {
        return { code: 'METER_BLOCKED', message: error.message };
      }
    }

    // Handle API errors
    if (error.code) {
      switch (error.code) {
        case 'INVALID_METER':
          return { code: 'INVALID_METER', message: error.message || 'Invalid meter number' };
        case 'METER_BLOCKED':
          return { code: 'METER_BLOCKED', message: error.message || 'Meter is blocked' };
        case 'INSUFFICIENT_FUNDS':
          return { code: 'INSUFFICIENT_FUNDS', message: error.message || 'Insufficient balance for this transaction' };
        case 'MUNICIPALITY_UNAVAILABLE':
          return { code: 'MUNICIPALITY_UNAVAILABLE', message: error.message || 'Municipality service unavailable' };
        case 'NETWORK_ERROR':
          return { code: 'TRANSACTION_FAILED', message: error.message || 'Network connection failed' };
        default:
          return { code: 'TRANSACTION_FAILED', message: error.message || 'Transaction failed' };
      }
    }

    // Default error
    return {
      code: 'TRANSACTION_FAILED',
      message: error.message || 'Electricity transaction failed',
    };
  }

  /**
   * Clear municipalities cache (useful for testing or data refresh)
   */
  clearMunicipalitiesCache(): void {
    this.municipalitiesCache = null;
  }

  /**
   * Get QA test meter numbers
   */
  getQAMeterNumbers(): string[] {
    return [...QA_TEST_DATA.METER_NUMBERS];
  }

  /**
   * Get electricity business rules
   */
  getBusinessRules() {
    return {
      minAmount: BUSINESS_RULES.ELECTRICITY.MIN_AMOUNT,
      maxAmount: BUSINESS_RULES.ELECTRICITY.MAX_AMOUNT,
      meterNumberLength: BUSINESS_RULES.ELECTRICITY.METER_NUMBER_LENGTH,
      tokenLength: BUSINESS_RULES.ELECTRICITY.TOKEN_LENGTH,
    };
  }

  /**
   * Validate electricity amount
   */
  validateElectricityAmount(amount: number): { isValid: boolean; error?: string } {
    return validateAmount(amount, 'electricity');
  }
}