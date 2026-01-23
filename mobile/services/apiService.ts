/**
 * API Service for fetching guard data from backend
 * Replaces mock data with live database calls
 */

import { CarGuard, Transaction, Payout } from '../types';
import { formatCurrency, formatDate, formatTime } from '../data/mockData';

// API Base URL - uses production URL by default
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.nogadacarguard.co.za';

/**
 * Fetch guard profile by email
 */
export const fetchGuardProfile = async (email: string): Promise<CarGuard | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/guards/by-email/${encodeURIComponent(email)}`);

    if (!response.ok) {
      console.error('Failed to fetch guard profile:', response.status);
      return null;
    }

    const result = await response.json();

    if (!result.success) {
      console.error('API error:', result.error);
      return null;
    }

    const data = result.data;

    // Transform API response to CarGuard type
    return {
      id: data.guardId,
      name: data.name,
      phoneNumber: data.phone,
      email: data.email,
      location: data.location?.name || 'Unknown',
      locationId: data.locationId,
      managerId: data.managerId || '',
      balance: data.balance,
      totalEarnings: data.lifetimeEarnings,
      qrCode: data.qrCode,
      status: data.status?.toLowerCase() || 'active',
      rating: 0,
      joinedDate: formatDate(data.createdAt),
      bankDetails: data.bankName ? {
        bankName: data.bankName,
        accountNumber: data.accountNumber || '',
        accountType: data.accountType || 'savings',
        branchCode: data.branchCode || ''
      } : undefined
    };
  } catch (error) {
    console.error('Error fetching guard profile:', error);
    throw new Error('Failed to fetch guard profile. Please check your connection.');
  }
};

/**
 * Fetch transactions for a guard
 */
export const fetchTransactions = async (guardId: string): Promise<Transaction[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/transactions/guard/${guardId}?limit=100`);

    if (!response.ok) {
      console.error('Failed to fetch transactions:', response.status);
      return [];
    }

    const result = await response.json();

    if (!result.success) {
      console.error('API error:', result.error);
      return [];
    }

    const transactions = result.data.transactions || [];

    // Transform API response to Transaction type
    return transactions.map((t: any) => ({
      id: t.id,
      guardId: t.guardId,
      guardName: t.guardName,
      type: t.type,
      amount: t.amount,
      balance: t.balance,
      description: t.description,
      date: t.date,
      time: t.time,
      status: t.status,
      reference: t.reference,
      metadata: t.metadata
    }));
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw new Error('Failed to fetch transactions. Please check your connection.');
  }
};

/**
 * Fetch payouts for a guard
 */
export const fetchPayouts = async (guardId: string): Promise<Payout[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/payouts/guard/${guardId}`);

    if (!response.ok) {
      console.error('Failed to fetch payouts:', response.status);
      return [];
    }

    const result = await response.json();

    if (!result.success) {
      console.error('API error:', result.error);
      return [];
    }

    const payouts = result.data || [];

    // Transform API response to Payout type
    return payouts.map((p: any) => ({
      id: p.id,
      voucherNumber: p.voucherNumber,
      guardId: p.guardId,
      guardName: p.guardName,
      amount: p.amount,
      type: p.type,
      status: p.status,
      requestDate: p.requestDate,
      processDate: p.processDate,
      reference: p.reference,
      bankDetails: p.bankDetails,
      utilityDetails: p.utilityDetails
    }));
  } catch (error) {
    console.error('Error fetching payouts:', error);
    throw new Error('Failed to fetch payouts. Please check your connection.');
  }
};

/**
 * Create a new payout request
 */
export const createPayout = async (
  guardId: string,
  amount: number,
  type: 'bank_transfer' | 'cash' | 'airtime' | 'electricity',
  details?: {
    meterNumber?: string;
    phoneNumber?: string;
    bankName?: string;
    accountNumber?: string;
    reference?: string;
  }
): Promise<{ success: boolean; voucherNumber?: string; error?: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/payouts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        guardId,
        amount,
        type,
        ...details
      }),
    });

    const result = await response.json();

    if (!result.success) {
      return { success: false, error: result.error };
    }

    return {
      success: true,
      voucherNumber: result.data.voucherNumber
    };
  } catch (error) {
    console.error('Error creating payout:', error);
    return { success: false, error: 'Failed to create payout. Please check your connection.' };
  }
};

/**
 * Create a transaction (for airtime, electricity)
 */
export const createTransaction = async (
  guardId: string,
  type: 'AIRTIME' | 'ELECTRICITY',
  amount: number,
  details?: {
    description?: string;
    reference?: string;
    metadata?: any;
  }
): Promise<{ success: boolean; newBalance?: number; error?: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        guardId,
        type,
        amount,
        ...details
      }),
    });

    const result = await response.json();

    if (!result.success) {
      return { success: false, error: result.error };
    }

    return {
      success: true,
      newBalance: result.data.newBalance
    };
  } catch (error) {
    console.error('Error creating transaction:', error);
    return { success: false, error: 'Failed to create transaction. Please check your connection.' };
  }
};

/**
 * Health check for the API
 */
export const healthCheck = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
};

export default {
  fetchGuardProfile,
  fetchTransactions,
  fetchPayouts,
  createPayout,
  createTransaction,
  healthCheck
};
