import React, { createContext, useContext, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

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
  qrCode: string | null;
  qrCodeUrl: string | null;
  location?: { id: string; name: string; address: string } | null;
  bankName?: string | null;
  accountNumber?: string | null;
  accountHolder?: string | null;
  branchCode?: string | null;
  accountType?: string | null;
}

interface GuardContextType {
  guardData: GuardData | null;
  setGuardData: (data: GuardData | null) => Promise<void>;
  clearGuardData: () => Promise<void>;
  isLinked: boolean;
  isLoading: boolean;
  refreshGuardData: (clerkUserId?: string) => Promise<void>;
  updateBalance: (newBalance: number) => Promise<void>;
}

const GuardContext = createContext<GuardContextType | undefined>(undefined);

const GUARD_KEY = 'tippa_guard';

export function GuardProvider({ children }: { children: ReactNode }) {
  // Derive all state from AuthContext — no separate loading from storage needed.
  // This ensures guard data is available immediately after login without a refresh.
  const { guard, isLoading, refreshGuard, updateGuardBalance } = useAuth();

  const setGuardData = async (data: GuardData | null) => {
    try {
      if (data) await AsyncStorage.setItem(GUARD_KEY, JSON.stringify(data));
      else await AsyncStorage.removeItem(GUARD_KEY);
    } catch (e) {
      console.error('GuardContext: error saving to storage', e);
    }
  };

  const clearGuardData = async () => {
    await AsyncStorage.removeItem(GUARD_KEY).catch(() => {});
  };

  const refreshGuardData = async (_clerkUserId?: string) => {
    await refreshGuard();
  };

  const updateBalance = async (newBalance: number) => {
    updateGuardBalance(newBalance);
  };

  return (
    <GuardContext.Provider value={{
      guardData: guard,
      setGuardData,
      clearGuardData,
      isLinked: !!guard,
      isLoading,
      refreshGuardData,
      updateBalance,
    }}>
      {children}
    </GuardContext.Provider>
  );
}

export function useGuard() {
  const ctx = useContext(GuardContext);
  if (!ctx) throw new Error('useGuard must be used within GuardProvider');
  return ctx;
}

export default GuardContext;
