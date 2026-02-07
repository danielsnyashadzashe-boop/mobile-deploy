/**
 * Mobile API Service for guard linking and profile management
 * Uses the existing admin API endpoints
 */

import { GuardData } from '../contexts/GuardContext';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.nogadacarguard.co.za';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  isLinked?: boolean;
}

interface VerifyCodeResponse {
  guardId: string;
  id: string;
  name: string;
  surname: string;
  phone: string;
  email: string;
  location: {
    id: string;
    name: string;
    address: string;
  };
  status: string;
}

interface LinkAccountResponse {
  guardId: string;
  id: string;
  name: string;
  surname: string;
  phone: string;
  email: string;
  balance: number;
  lifetimeEarnings: number;
  qrCode: string;
  qrCodeUrl: string | null;
  accessCode: string;
  accessCodeExpiry: string;
  location: {
    id: string;
    name: string;
    address: string;
  };
  status: string;
  rating: number;
  totalRatings: number;
  profileImage: string | null;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  status: string;
  reference: string | null;
  balance: number | null;
  date: string;
  time: string;
  createdAt: string;
}

interface Payout {
  id: string;
  voucherNumber: string | null;
  amount: number;
  type: string;
  status: string;
  requestDate: string;
  processDate: string | null;
  reference: string | null;
  bankName: string | null;
  accountNumber: string | null;
  meterNumber: string | null;
  phoneNumber: string | null;
  provider: string | null;
}

/**
 * Step 1: Verify the 6-digit access code
 * Validates code is real, not expired, and guard is active
 */
export async function verifyAccessCode(accessCode: string): Promise<ApiResponse<VerifyCodeResponse>> {
  try {
    console.log('Verifying access code:', accessCode);

    const response = await fetch(`${API_BASE_URL}/api/guards/verify-access-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessCode })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      return {
        success: false,
        error: result.error || 'Invalid access code'
      };
    }

    return result;
  } catch (error) {
    console.error('Error verifying access code:', error);
    return {
      success: false,
      error: 'Something went wrong. Please check your connection and try again.'
    };
  }
}

/**
 * Step 2: Link mobile account to guard profile
 * Verifies email OR phone matches admin records
 */
export async function linkMobileAccount(params: {
  accessCode: string;
  clerkUserId: string;
  clerkEmail?: string | null;
  clerkPhone?: string | null;
}): Promise<ApiResponse<LinkAccountResponse>> {
  try {
    console.log('Linking mobile account:', params.accessCode);

    const response = await fetch(`${API_BASE_URL}/api/guards/link-mobile-account`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      return {
        success: false,
        error: result.error || 'Failed to link account'
      };
    }

    return result;
  } catch (error) {
    console.error('Error linking account:', error);
    return {
      success: false,
      error: 'Something went wrong. Please check your connection and try again.'
    };
  }
}

/**
 * Check if a Clerk user is already linked to a guard profile
 */
export async function checkLink(clerkUserId: string): Promise<ApiResponse<{ isLinked: boolean; guard?: GuardData }>> {
  try {
    console.log('Checking link for Clerk user:', clerkUserId);

    const response = await fetch(`${API_BASE_URL}/api/mobile/check-link/${clerkUserId}`);
    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Failed to check link status'
      };
    }

    // Transform response to match expected format
    if (result.success && result.data?.isLinked) {
      return {
        success: true,
        isLinked: true,
        data: {
          isLinked: true,
          guard: transformGuardData(result.data)
        }
      };
    }

    return {
      success: true,
      isLinked: false,
      data: { isLinked: false }
    };
  } catch (error) {
    console.error('Error checking link:', error);
    return {
      success: false,
      error: 'Failed to check link status'
    };
  }
}

/**
 * Get guard profile by Clerk user ID
 */
export async function getGuardProfile(clerkUserId: string): Promise<ApiResponse<GuardData>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/mobile/guard/${clerkUserId}`);
    const result = await response.json();

    if (!response.ok || !result.success) {
      return {
        success: false,
        error: result.error || 'Failed to fetch guard profile'
      };
    }

    return {
      success: true,
      data: transformGuardData(result.data)
    };
  } catch (error) {
    console.error('Error fetching guard profile:', error);
    return {
      success: false,
      error: 'Failed to fetch guard profile'
    };
  }
}

/**
 * Get transactions for a guard by Clerk user ID
 */
export async function getTransactions(
  clerkUserId: string,
  params?: { limit?: number; offset?: number; type?: string }
): Promise<ApiResponse<{ transactions: Transaction[]; pagination: { total: number; hasMore: boolean } }>> {
  try {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.offset) queryParams.set('offset', params.offset.toString());
    if (params?.type) queryParams.set('type', params.type);

    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/api/mobile/guard/${clerkUserId}/transactions${queryString}`);
    const result = await response.json();

    if (!response.ok || !result.success) {
      return {
        success: false,
        error: result.error || 'Failed to fetch transactions'
      };
    }

    return result;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return {
      success: false,
      error: 'Failed to fetch transactions'
    };
  }
}

/**
 * Get payouts for a guard by Clerk user ID
 */
export async function getPayouts(clerkUserId: string): Promise<ApiResponse<Payout[]>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/mobile/guard/${clerkUserId}/payouts`);
    const result = await response.json();

    if (!response.ok || !result.success) {
      return {
        success: false,
        error: result.error || 'Failed to fetch payouts'
      };
    }

    return result;
  } catch (error) {
    console.error('Error fetching payouts:', error);
    return {
      success: false,
      error: 'Failed to fetch payouts'
    };
  }
}

/**
 * Update guard's last active timestamp
 */
export async function updateActivity(clerkUserId: string): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/api/mobile/guard/${clerkUserId}/update-activity`, {
      method: 'POST',
    });
  } catch (error) {
    // Silently fail - not critical
    console.log('Failed to update activity:', error);
  }
}

/**
 * Update guard profile (personal info and banking details)
 * NOTE: Requires backend endpoint PUT /api/mobile/guard/:clerkUserId/profile
 */
export async function updateGuardProfile(
  clerkUserId: string,
  updates: {
    name?: string;
    surname?: string;
    phone?: string;
    alternatePhone?: string;
    bankName?: string;
    accountNumber?: string;
    accountHolder?: string;
    branchCode?: string;
    accountType?: string;
  }
): Promise<ApiResponse<GuardData>> {
  try {
    console.log('Updating guard profile for:', clerkUserId);

    const response = await fetch(`${API_BASE_URL}/api/mobile/guard/${clerkUserId}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      return {
        success: false,
        error: result.error || 'Failed to update profile'
      };
    }

    return {
      success: true,
      data: transformGuardData(result.data)
    };
  } catch (error) {
    console.error('Error updating guard profile:', error);
    return {
      success: false,
      error: 'Failed to update profile. Please check your connection.'
    };
  }
}

/**
 * Transform API response to GuardData format
 */
function transformGuardData(data: any): GuardData {
  return {
    id: data.id,
    guardId: data.guardId,
    name: data.name,
    surname: data.surname,
    fullName: `${data.name} ${data.surname}`,
    email: data.email,
    phone: data.phone,
    balance: data.balance || 0,
    totalEarnings: data.lifetimeEarnings || 0,
    status: data.status,
    rating: data.rating || 0,
    qrCode: data.qrCode || null,  // Raw payment URL
    qrCodeUrl: data.qrCodeUrl || null,  // Cloudinary branded image
    location: data.location || null
  };
}

// ============================================
// Purchase API Functions
// ============================================

interface AirtimePurchaseRequest {
  clerkUserId: string;
  phoneNumber: string;
  amount: number;
  productCode: string;
}

interface AirtimePurchaseResponse {
  message: string;
  amount: number;
  previousBalance: number;
  newBalance: number;
}

interface ElectricityPurchaseRequest {
  clerkUserId: string;
  meterNumber: string;
  amount: number;
}

interface ElectricityPurchaseResponse {
  message: string;
  meterNumber: string;
  amount: number;
  token: string;
  units: string;
  previousBalance: number;
  newBalance: number;
  customerName: string;
}

interface VoucherPurchaseRequest {
  clerkUserId: string;
  amount: number;
}

interface VoucherPurchaseResponse {
  message: string;
  amount: number;
  voucherPin: string;
  voucherSerial: string;
  expiryDate: string;
  previousBalance: number;
  newBalance: number;
}

interface PayoutRequestData {
  guardId: string;
  amount: number;
  notes?: string;
}

interface PayoutRequestResponse {
  payoutId: string;
  amount: number;
  status: string;
  note: string;
}

interface PayoutHistoryItem {
  id: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'COMPLETED' | 'REJECTED';
  requestDate: string;
  processDate: string | null;
  notes: string | null;
  rejectionReason: string | null;
  voucherPin: string | null;
}

// Network product codes
export const NETWORK_CODES = {
  MTN: '304',
  VODACOM: '305',
  CELL_C: '306',
  TELKOM: '307',
} as const;

/**
 * Purchase airtime for a phone number
 */
export async function purchaseAirtime(
  params: AirtimePurchaseRequest
): Promise<ApiResponse<AirtimePurchaseResponse>> {
  try {
    console.log('Purchasing airtime:', params);

    const response = await fetch(`${API_BASE_URL}/api/mobile/purchase/airtime`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      return {
        success: false,
        error: result.error || 'Failed to purchase airtime'
      };
    }

    return result;
  } catch (error) {
    console.error('Error purchasing airtime:', error);
    return {
      success: false,
      error: 'Something went wrong. Please check your connection and try again.'
    };
  }
}

/**
 * Purchase electricity for a meter
 */
export async function purchaseElectricity(
  params: ElectricityPurchaseRequest
): Promise<ApiResponse<ElectricityPurchaseResponse>> {
  try {
    console.log('Purchasing electricity:', params);

    const response = await fetch(`${API_BASE_URL}/api/mobile/purchase/electricity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      return {
        success: false,
        error: result.error || 'Failed to purchase electricity'
      };
    }

    return result;
  } catch (error) {
    console.error('Error purchasing electricity:', error);
    return {
      success: false,
      error: 'Something went wrong. Please check your connection and try again.'
    };
  }
}

/**
 * Purchase a cash voucher
 */
export async function purchaseVoucher(
  params: VoucherPurchaseRequest
): Promise<ApiResponse<VoucherPurchaseResponse>> {
  try {
    console.log('Purchasing voucher:', params);

    const response = await fetch(`${API_BASE_URL}/api/mobile/purchase/voucher`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      return {
        success: false,
        error: result.error || 'Failed to purchase voucher'
      };
    }

    return result;
  } catch (error) {
    console.error('Error purchasing voucher:', error);
    return {
      success: false,
      error: 'Something went wrong. Please check your connection and try again.'
    };
  }
}

/**
 * Request a payout (admin approval flow)
 */
export async function requestPayout(
  params: PayoutRequestData
): Promise<ApiResponse<PayoutRequestResponse>> {
  try {
    console.log('Requesting payout:', params);

    const response = await fetch(`${API_BASE_URL}/api/mobile/payout/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      return {
        success: false,
        error: result.error || 'Failed to submit payout request'
      };
    }

    return result;
  } catch (error) {
    console.error('Error requesting payout:', error);
    return {
      success: false,
      error: 'Something went wrong. Please check your connection and try again.'
    };
  }
}

/**
 * Get payout request history for a guard
 */
export async function getPayoutRequests(
  guardId: string
): Promise<ApiResponse<PayoutHistoryItem[]>> {
  try {
    console.log('Getting payout requests for guard:', guardId);

    const response = await fetch(`${API_BASE_URL}/api/mobile/payout/requests?guardId=${guardId}`);
    const result = await response.json();

    if (!response.ok || !result.success) {
      return {
        success: false,
        error: result.error || 'Failed to fetch payout requests'
      };
    }

    return result;
  } catch (error) {
    console.error('Error fetching payout requests:', error);
    return {
      success: false,
      error: 'Failed to fetch payout requests'
    };
  }
}

export default {
  verifyAccessCode,
  linkMobileAccount,
  checkLink,
  getGuardProfile,
  getTransactions,
  getPayouts,
  updateActivity,
  updateGuardProfile,
  purchaseAirtime,
  purchaseElectricity,
  purchaseVoucher,
  requestPayout,
  getPayoutRequests,
  NETWORK_CODES,
};
