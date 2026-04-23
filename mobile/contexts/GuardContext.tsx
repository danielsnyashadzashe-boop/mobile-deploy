import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

// Reads from the same key AuthContext writes to
const GUARD_KEY = 'tippa_guard';

export function GuardProvider({ children }: { children: ReactNode }) {
  const [guardData, setGuardDataState] = useState<GuardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFromStorage();
  }, []);

  const loadFromStorage = async () => {
    try {
      const stored = await AsyncStorage.getItem(GUARD_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setGuardDataState(parsed);
      }
    } catch (e) {
      console.error('GuardContext: error loading from storage', e);
    } finally {
      setIsLoading(false);
    }
  };

  const setGuardData = async (data: GuardData | null) => {
    setGuardDataState(data);
    try {
      if (data) await AsyncStorage.setItem(GUARD_KEY, JSON.stringify(data));
      else await AsyncStorage.removeItem(GUARD_KEY);
    } catch (e) {
      console.error('GuardContext: error saving to storage', e);
    }
  };

  const clearGuardData = async () => {
    setGuardDataState(null);
    await AsyncStorage.removeItem(GUARD_KEY).catch(() => {});
  };

  // refreshGuardData is kept for compatibility — screens call it after profile updates
  const refreshGuardData = async (_clerkUserId?: string) => {
    await loadFromStorage();
  };

  const updateBalance = async (newBalance: number) => {
    if (!guardData) return;
    const updated = { ...guardData, balance: newBalance };
    setGuardDataState(updated);
    await AsyncStorage.setItem(GUARD_KEY, JSON.stringify(updated)).catch(() => {});
  };

  return (
    <GuardContext.Provider value={{
      guardData,
      setGuardData,
      clearGuardData,
      isLinked: !!guardData,
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
