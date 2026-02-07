/**
 * Example Usage of Flash API with Authenticated Requests
 * This file demonstrates how to use the authenticated request helper
 */

import { authenticatedApi, formatApiError } from './authenticatedRequest';
import { FlashAuthService } from '../auth/authService';
import { API_ENDPOINTS } from '../utils/constants';

/**
 * Example 1: Get municipalities for electricity purchase
 */
export async function getMunicipalities() {
  try {
    const response = await authenticatedApi.get(
      API_ENDPOINTS.ELECTRICITY.MUNICIPALITIES
    );
    
    console.log('✅ Municipalities fetched:', response);
    return response;
  } catch (error) {
    console.error('❌ Failed to fetch municipalities:', formatApiError(error));
    throw error;
  }
}

/**
 * Example 2: Lookup meter details
 */
export async function lookupMeter(meterNumber: string, municipalityCode: string) {
  try {
    const response = await authenticatedApi.post(
      API_ENDPOINTS.ELECTRICITY.METER_LOOKUP,
      {
        meterNumber,
        municipalityCode,
      }
    );
    
    console.log('✅ Meter details:', response);
    return response;
  } catch (error) {
    console.error('❌ Meter lookup failed:', formatApiError(error));
    throw error;
  }
}

/**
 * Example 3: Purchase electricity
 */
export async function purchaseElectricity(
  meterNumber: string,
  amount: number,
  municipalityCode: string,
  reference: string
) {
  try {
    const response = await authenticatedApi.post(
      API_ENDPOINTS.ELECTRICITY.PURCHASE,
      {
        meterNumber,
        amount,
        municipalityCode,
        reference,
        accountNumber: await FlashAuthService.getInstance().getAccountNumber(),
      },
      {
        timeout: 60000, // 60 second timeout for purchases
      }
    );
    
    console.log('✅ Electricity purchase successful:', response);
    return response;
  } catch (error) {
    console.error('❌ Electricity purchase failed:', formatApiError(error));
    throw error;
  }
}

/**
 * Example 4: Get transaction history
 */
export async function getElectricityHistory(
  startDate?: string,
  endDate?: string,
  limit: number = 50
) {
  try {
    const response = await authenticatedApi.get(
      API_ENDPOINTS.ELECTRICITY.HISTORY,
      {
        startDate,
        endDate,
        limit,
        accountNumber: await FlashAuthService.getInstance().getAccountNumber(),
      }
    );
    
    console.log('✅ Electricity history:', response);
    return response;
  } catch (error) {
    console.error('❌ Failed to fetch history:', formatApiError(error));
    throw error;
  }
}

/**
 * Example 5: Initialize Flash API and test authentication
 */
export async function initializeAndTest() {
  try {
    console.log('🔐 Initializing Flash API...');
    
    // Initialize authentication
    const authService = FlashAuthService.getInstance();
    await authService.initialize();
    
    // Test if we're authenticated
    const isAuthenticated = await authService.isAuthenticated();
    console.log('✅ Authentication status:', isAuthenticated);
    
    if (!isAuthenticated) {
      console.log('🔄 Requesting new token...');
      await authService.requestNewToken();
    }
    
    // Test with a simple API call
    console.log('🧪 Testing API connection...');
    const municipalities = await getMunicipalities();
    
    console.log('✅ Flash API initialized and working!');
    return true;
  } catch (error) {
    console.error('❌ Flash API initialization failed:', formatApiError(error));
    return false;
  }
}

/**
 * Example 6: Handle authentication errors gracefully
 */
export async function safeApiCall<T>(
  apiCall: () => Promise<T>,
  errorMessage: string = 'API call failed'
): Promise<T | null> {
  try {
    return await apiCall();
  } catch (error: any) {
    // Check if it's an authentication error
    if (error.code === 'AUTH_FAILED' || error.httpStatus === 401) {
      console.error('🔐 Authentication error - please check credentials');
      // You could trigger a re-login flow here
    } else if (error.code === 'NETWORK_ERROR') {
      console.error('🌐 Network error - please check connection');
    } else {
      console.error(`❌ ${errorMessage}:`, formatApiError(error));
    }
    
    // Return null or throw based on your error handling strategy
    return null;
  }
}

/**
 * Example 7: Use with React Query
 */
export const flashApiQueries = {
  municipalities: () => ({
    queryKey: ['flash', 'municipalities'],
    queryFn: getMunicipalities,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
    retry: 2,
  }),
  
  meterLookup: (meterNumber: string, municipalityCode: string) => ({
    queryKey: ['flash', 'meter', meterNumber, municipalityCode],
    queryFn: () => lookupMeter(meterNumber, municipalityCode),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    enabled: !!meterNumber && !!municipalityCode,
  }),
  
  history: (startDate?: string, endDate?: string) => ({
    queryKey: ['flash', 'electricity', 'history', startDate, endDate],
    queryFn: () => getElectricityHistory(startDate, endDate),
    staleTime: 1000 * 60 * 2, // Cache for 2 minutes
  }),
};

/**
 * Example 8: Test with QA data
 */
export async function testWithQAData() {
  try {
    console.log('🧪 Testing with QA data...');
    
    // Initialize first
    await initializeAndTest();
    
    // Test meter lookup with QA meter
    const meterDetails = await lookupMeter(
      '04004444884', // QA test meter
      'CPT' // City of Cape Town code
    );
    
    console.log('✅ QA meter validated:', meterDetails);
    
    // Simulate purchase (sandbox won't actually charge)
    const purchase = await purchaseElectricity(
      '04004444884',
      50.00,
      'CPT',
      `TEST-${Date.now()}`
    );
    
    console.log('✅ QA purchase simulated:', purchase);
    
    return true;
  } catch (error) {
    console.error('❌ QA test failed:', formatApiError(error));
    return false;
  }
}