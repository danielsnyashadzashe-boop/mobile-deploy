/**
 * React Query hooks for Flash API Electricity service
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ElectricityApiService } from '../api/electricityApi';
import { 
  Municipality, 
  MeterLookupResponse, 
  ElectricityPurchaseResponse,
  ElectricityHistoryResponse,
  ElectricityTransaction,
  ElectricitySummary 
} from '../types/electricity.types';

const electricityService = ElectricityApiService.getInstance();

// Query keys
export const electricityQueryKeys = {
  all: ['flash', 'electricity'] as const,
  municipalities: ['flash', 'electricity', 'municipalities'] as const,
  meterLookup: (meterNumber: string, municipalityCode?: string) => 
    ['flash', 'electricity', 'meter', meterNumber, municipalityCode] as const,
  history: (filters?: any) => 
    ['flash', 'electricity', 'history', filters] as const,
  transaction: (id: string) => 
    ['flash', 'electricity', 'transaction', id] as const,
  summary: (dateRange?: any) => 
    ['flash', 'electricity', 'summary', dateRange] as const,
};

/**
 * Hook to get list of municipalities
 */
export const useElectricityMunicipalities = () => {
  return useQuery({
    queryKey: electricityQueryKeys.municipalities,
    queryFn: async () => {
      const response = await electricityService.getMunicipalities();
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to get municipalities');
      }
      return response.data;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes - municipalities don't change often
    gcTime: 60 * 60 * 1000, // 60 minutes
  });
};

/**
 * Hook to lookup meter details
 */
export const useElectricityMeterLookup = (meterNumber?: string, municipalityCode?: string) => {
  return useQuery({
    queryKey: electricityQueryKeys.meterLookup(meterNumber || '', municipalityCode),
    queryFn: async () => {
      if (!meterNumber) {
        throw new Error('Meter number is required');
      }
      
      const response = await electricityService.lookupMeter(meterNumber, municipalityCode);
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to lookup meter');
      }
      return response.data;
    },
    enabled: !!meterNumber && meterNumber.length >= 11, // Only run if meter number is complete
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook to purchase electricity
 */
export const useElectricityPurchase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      meterNumber: string;
      amount: number;
      municipalityCode: string;
      reference?: string;
    }) => {
      const response = await electricityService.purchaseElectricity(
        params.meterNumber,
        params.amount,
        params.municipalityCode,
        params.reference
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to purchase electricity');
      }
      
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate relevant queries after successful purchase
      queryClient.invalidateQueries({
        queryKey: electricityQueryKeys.history(),
      });
      queryClient.invalidateQueries({
        queryKey: electricityQueryKeys.summary(),
      });
      
      // Update specific transaction query if we have the ID
      if (data.TransactionId) {
        queryClient.setQueryData(
          electricityQueryKeys.transaction(data.TransactionId),
          data
        );
      }
    },
    onError: (error: any) => {
      console.error('Electricity purchase failed:', error);
    },
  });
};

/**
 * Hook to get electricity transaction history
 */
export const useElectricityHistory = (filters?: {
  meterNumber?: string;
  startDate?: string;
  endDate?: string;
  pageNumber?: number;
  pageSize?: number;
}) => {
  return useQuery({
    queryKey: electricityQueryKeys.history(filters),
    queryFn: async () => {
      const response = await electricityService.getElectricityHistory(filters);
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to get electricity history');
      }
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to get electricity transaction by ID
 */
export const useElectricityTransaction = (transactionId?: string) => {
  return useQuery({
    queryKey: electricityQueryKeys.transaction(transactionId || ''),
    queryFn: async () => {
      if (!transactionId) {
        throw new Error('Transaction ID is required');
      }
      
      const response = await electricityService.getElectricityTransaction(transactionId);
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to get electricity transaction');
      }
      return response.data;
    },
    enabled: !!transactionId,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to get electricity summary statistics
 */
export const useElectricitySummary = (dateRange?: { startDate: string; endDate: string }) => {
  return useQuery({
    queryKey: electricityQueryKeys.summary(dateRange),
    queryFn: async () => {
      const response = await electricityService.getElectricitySummary(dateRange);
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to get electricity summary');
      }
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook to search electricity transactions
 */
export const useElectricitySearch = () => {
  return useMutation({
    mutationFn: async (params: {
      query: {
        meterNumber?: string;
        customerName?: string;
        amount?: number;
        minAmount?: number;
        maxAmount?: number;
        municipalityCode?: string;
      };
      options?: {
        pageNumber?: number;
        pageSize?: number;
      };
    }) => {
      const response = await electricityService.searchElectricityTransactions(
        params.query,
        params.options
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to search electricity transactions');
      }
      
      return response.data;
    },
    onError: (error: any) => {
      console.error('Electricity search failed:', error);
    },
  });
};

/**
 * Hook to validate meter number
 */
export const useElectricityMeterValidation = () => {
  return useMutation({
    mutationFn: async (params: {
      meterNumber: string;
      municipalityCode?: string;
    }) => {
      const response = await electricityService.validateMeterNumber(
        params.meterNumber,
        params.municipalityCode
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to validate meter number');
      }
      
      return response.data;
    },
    onError: (error: any) => {
      console.error('Meter validation failed:', error);
    },
  });
};

/**
 * Hook to get transaction status
 */
export const useElectricityTransactionStatus = () => {
  return useMutation({
    mutationFn: async (transactionId: string) => {
      const response = await electricityService.getTransactionStatus(transactionId);
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to get transaction status');
      }
      return response.data;
    },
    onError: (error: any) => {
      console.error('Get transaction status failed:', error);
    },
  });
};

/**
 * Main electricity hook that combines common functionality
 */
export const useElectricity = () => {
  const municipalities = useElectricityMunicipalities();
  const purchase = useElectricityPurchase();
  const search = useElectricitySearch();
  const meterValidation = useElectricityMeterValidation();
  const transactionStatus = useElectricityTransactionStatus();

  return {
    // Data
    municipalities: municipalities.data,
    
    // Loading states
    isLoadingMunicipalities: municipalities.isLoading,
    isPurchasing: purchase.isPending,
    isSearching: search.isPending,
    isValidatingMeter: meterValidation.isPending,
    isCheckingStatus: transactionStatus.isPending,

    // Error states
    municipalitiesError: municipalities.error,
    purchaseError: purchase.error,
    searchError: search.error,
    validationError: meterValidation.error,
    statusError: transactionStatus.error,

    // Actions
    purchaseElectricity: purchase.mutate,
    searchTransactions: search.mutate,
    validateMeter: meterValidation.mutate,
    checkTransactionStatus: transactionStatus.mutate,

    // Utilities
    refetchMunicipalities: municipalities.refetch,
    getBusinessRules: () => electricityService.getBusinessRules(),
    getQAMeterNumbers: () => electricityService.getQAMeterNumbers(),
    validateAmount: (amount: number) => electricityService.validateElectricityAmount(amount),
    clearMunicipalitiesCache: () => electricityService.clearMunicipalitiesCache(),
  };
};