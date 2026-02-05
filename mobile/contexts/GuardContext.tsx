import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getGuardProfile } from '../services/mobileApiService';

// Sandbox test balance for development/testing
// @ts-ignore
const IS_DEV = __DEV__;
const SANDBOX_TEST_BALANCE = 5000; // R5000 for testing

export interface GuardData {
  id: string;
  guardId: string;
  name: string;
  surname: string;
  fullName: string;
  email: string | null;
  phone: string;
  balance: number;
  totalEarnings: number;
  status: string;
  rating?: number;
  qrCode: string | null;  // Raw payment URL for generating clean QR code
  qrCodeUrl: string | null;  // Cloudinary URL with branding
  location?: {
    id: string;
    name: string;
    address: string;
  } | null;
}

interface GuardContextType {
  guardData: GuardData | null;
  setGuardData: (data: GuardData | null) => Promise<void>;
  clearGuardData: () => Promise<void>;
  isLinked: boolean;
  isLoading: boolean;
  refreshGuardData: (clerkUserId?: string) => Promise<void>;
  updateBalance: (newBalance: number) => Promise<void>;
  resetSandboxBalance: () => Promise<void>;
}

const GuardContext = createContext<GuardContextType | undefined>(undefined);

const GUARD_STORAGE_KEY = '@nogada_guard_data';

export function GuardProvider({ children }: { children: ReactNode }) {
  const [guardData, setGuardDataState] = useState<GuardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredData();
  }, []);

  const loadStoredData = async () => {
    try {
      const stored = await AsyncStorage.getItem(GUARD_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // In development/sandbox mode, use test balance if balance is 0
        if (IS_DEV && parsed.balance === 0) {
          parsed.balance = SANDBOX_TEST_BALANCE;
          console.log('🧪 Sandbox mode: Using test balance of R', SANDBOX_TEST_BALANCE);
        }
        setGuardDataState(parsed);
        console.log('Loaded guard data from storage:', parsed.guardId);
      }
    } catch (error) {
      console.error('Error loading guard data from storage:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setGuardData = async (data: GuardData | null) => {
    // In development/sandbox mode, use test balance if balance is 0
    if (data && IS_DEV && data.balance === 0) {
      data = { ...data, balance: SANDBOX_TEST_BALANCE };
      console.log('🧪 Sandbox mode: Using test balance of R', SANDBOX_TEST_BALANCE);
    }
    setGuardDataState(data);
    try {
      if (data) {
        await AsyncStorage.setItem(GUARD_STORAGE_KEY, JSON.stringify(data));
        console.log('Saved guard data to storage:', data.guardId);
      } else {
        await AsyncStorage.removeItem(GUARD_STORAGE_KEY);
        console.log('Cleared guard data from storage');
      }
    } catch (error) {
      console.error('Error saving guard data to storage:', error);
    }
  };

  const clearGuardData = async () => {
    setGuardDataState(null);
    try {
      await AsyncStorage.removeItem(GUARD_STORAGE_KEY);
      console.log('Cleared guard data from storage');
    } catch (error) {
      console.error('Error clearing guard data from storage:', error);
    }
  };

  const refreshGuardData = async (clerkUserId?: string) => {
    if (!clerkUserId) {
      // If no clerkUserId provided, just reload from storage
      await loadStoredData();
      return;
    }

    try {
      const response = await getGuardProfile(clerkUserId);
      if (response.success && response.data) {
        await setGuardData(response.data);
      }
    } catch (error) {
      console.error('Error refreshing guard data:', error);
      // Fall back to stored data on error
      await loadStoredData();
    }
  };

  const updateBalance = async (newBalance: number) => {
    if (!guardData) return;

    const updatedData = { ...guardData, balance: newBalance };
    // Don't apply sandbox balance here - this is an explicit update
    setGuardDataState(updatedData);
    try {
      await AsyncStorage.setItem(GUARD_STORAGE_KEY, JSON.stringify(updatedData));
    } catch (error) {
      console.error('Error saving updated balance:', error);
    }
    console.log('Updated guard balance to:', newBalance);
  };

  const resetSandboxBalance = async () => {
    if (!guardData) return;

    const updatedData = { ...guardData, balance: SANDBOX_TEST_BALANCE };
    setGuardDataState(updatedData);
    try {
      await AsyncStorage.setItem(GUARD_STORAGE_KEY, JSON.stringify(updatedData));
      console.log('🧪 Sandbox balance reset to R', SANDBOX_TEST_BALANCE);
    } catch (error) {
      console.error('Error resetting sandbox balance:', error);
    }
  };

  return (
    <GuardContext.Provider
      value={{
        guardData,
        setGuardData,
        clearGuardData,
        isLinked: !!guardData,
        isLoading,
        refreshGuardData,
        updateBalance,
        resetSandboxBalance,
      }}
    >
      {children}
    </GuardContext.Provider>
  );
}

export function useGuard() {
  const context = useContext(GuardContext);
  if (context === undefined) {
    throw new Error('useGuard must be used within a GuardProvider');
  }
  return context;
}

export default GuardContext;
