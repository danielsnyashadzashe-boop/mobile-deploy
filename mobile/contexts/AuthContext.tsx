import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { GuardData } from './GuardContext';

const TOKEN_KEY = 'tippa_jwt';
const GUARD_KEY = 'tippa_guard';
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3003';

interface AuthContextType {
  token: string | null;
  guard: GuardData | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  sessionExpiredMessage: string | null;
  login: (phoneNumber: string, accessCode: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  logoutWithMessage: (message: string) => Promise<void>;
  refreshGuard: () => Promise<void>;
  updateGuardBalance: (newBalance: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken]   = useState<string | null>(null);
  const [guard, setGuard]   = useState<GuardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState<string | null>(null);

  // ── Load session on mount ──
  useEffect(() => {
    loadSession();
  }, []);

  const loadSession = async () => {
    try {
      const [storedToken, storedGuard] = await Promise.all([
        SecureStore.getItemAsync(TOKEN_KEY),
        AsyncStorage.getItem(GUARD_KEY),
      ]);

      if (storedToken && storedGuard) {
        // Verify token is not expired by decoding payload (no network needed)
        const payload = decodeToken(storedToken);
        if (payload && payload.exp * 1000 > Date.now()) {
          setToken(storedToken);
          setGuard(JSON.parse(storedGuard));
          // Silently refresh guard data in background
          refreshGuardInBackground(storedToken);
        } else {
          // Token expired — clear session
          await clearSession();
        }
      }
    } catch (e) {
      console.error('Error loading session:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshGuardInBackground = async (jwt: string) => {
    try {
      const res = await fetch(`${API_URL}/api/mobile/me`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      if (res.status === 401) {
        // JWT expired or invalid — force logout
        await clearSession();
        setSessionExpiredMessage('Your session has expired. Please sign in again with a new access code from your manager.');
        return;
      }
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          await saveGuard(data.data);
          setGuard(data.data);
        }
      }
    } catch {
      // Non-fatal — use cached data
    }
  };

  const login = async (phoneNumber: string, accessCode: string): Promise<{ success: boolean; error?: string }> => {
    setSessionExpiredMessage(null); // clear any previous session message on new login attempt
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, accessCode }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Login failed. Please try again.' };
      }

      await SecureStore.setItemAsync(TOKEN_KEY, data.token);
      await saveGuard(data.guard);
      setToken(data.token);
      setGuard(data.guard);

      // Register push token in background (non-blocking)
      registerPushToken(data.token).catch(() => {});

      return { success: true };
    } catch (e) {
      console.error('Login error:', e);
      return { success: false, error: 'Could not connect to server. Please check your connection.' };
    }
  };

  const registerPushToken = async (jwt: string) => {
    try {
      if (Platform.OS === 'web') return;

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') return;

      const tokenData = await Notifications.getExpoPushTokenAsync();
      const pushToken = tokenData.data;

      await fetch(`${API_URL}/api/mobile/me/push-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
        body: JSON.stringify({ pushToken }),
      });

      console.log('📱 Push token registered');
    } catch (e) {
      console.log('Push token registration skipped:', e);
    }
  };

  const logout = async () => {
    setSessionExpiredMessage(null);
    await clearSession();
  };

  const logoutWithMessage = async (message: string) => {
    await clearSession();
    setSessionExpiredMessage(message);
  };

  const refreshGuard = async () => {
    if (!token) return;
    await refreshGuardInBackground(token);
  };

  const updateGuardBalance = (newBalance: number) => {
    if (!guard) return;
    const updated = { ...guard, balance: newBalance };
    setGuard(updated);
    AsyncStorage.setItem(GUARD_KEY, JSON.stringify(updated)).catch(() => {});
  };

  const saveGuard = async (data: GuardData) => {
    await AsyncStorage.setItem(GUARD_KEY, JSON.stringify(data));
  };

  const clearSession = async () => {
    setToken(null);
    setGuard(null);
    await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
    await AsyncStorage.removeItem(GUARD_KEY).catch(() => {});
  };

  return (
    <AuthContext.Provider value={{
      token,
      guard,
      isLoading,
      isAuthenticated: !!token && !!guard,
      sessionExpiredMessage,
      login,
      logoutWithMessage,
      logout,
      refreshGuard,
      updateGuardBalance,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

// Decode JWT payload without verification (for expiry check only)
function decodeToken(token: string): { exp: number } | null {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch {
    return null;
  }
}
