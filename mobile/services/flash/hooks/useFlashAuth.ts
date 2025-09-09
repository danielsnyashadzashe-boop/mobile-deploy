/**
 * React Query hooks for Flash API authentication
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FlashAuthService } from '../auth/authService';
import { AuthError } from '../types/auth.types';

const authService = FlashAuthService.getInstance();

// Query keys
export const authQueryKeys = {
  authentication: ['flash', 'auth'] as const,
  isAuthenticated: ['flash', 'auth', 'status'] as const,
  accountNumber: ['flash', 'auth', 'account'] as const,
};

/**
 * Hook to get authentication status
 */
export const useFlashAuthStatus = () => {
  return useQuery({
    queryKey: authQueryKeys.isAuthenticated,
    queryFn: async () => {
      const isAuthenticated = await authService.isAuthenticated();
      const accountNumber = isAuthenticated ? await authService.getAccountNumber() : null;
      
      return {
        isAuthenticated,
        accountNumber,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
};

/**
 * Hook to initialize Flash API authentication
 */
export const useFlashAuthInitialize = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await authService.initialize();
      return true;
    },
    onSuccess: () => {
      // Invalidate auth queries after successful initialization
      queryClient.invalidateQueries({
        queryKey: authQueryKeys.authentication,
      });
    },
    onError: (error: any) => {
      console.error('Flash API initialization failed:', error);
    },
  });
};

/**
 * Hook to request new access token
 */
export const useFlashAuthLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const token = await authService.requestNewToken();
      return token;
    },
    onSuccess: () => {
      // Invalidate all auth-related queries after successful login
      queryClient.invalidateQueries({
        queryKey: authQueryKeys.authentication,
      });
    },
    onError: (error: any) => {
      console.error('Flash API login failed:', error);
    },
  });
};

/**
 * Hook to refresh access token
 */
export const useFlashAuthRefresh = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const token = await authService.refreshToken();
      return token;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: authQueryKeys.authentication,
      });
    },
    onError: (error: any) => {
      console.error('Flash API token refresh failed:', error);
    },
  });
};

/**
 * Hook to logout and clear credentials
 */
export const useFlashAuthLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await authService.logout();
      return true;
    },
    onSuccess: () => {
      // Clear all cached queries after logout
      queryClient.clear();
    },
    onError: (error: any) => {
      console.error('Flash API logout failed:', error);
    },
  });
};

/**
 * Hook to test authentication
 */
export const useFlashAuthTest = () => {
  return useMutation({
    mutationFn: async () => {
      const isValid = await authService.testAuthentication();
      return isValid;
    },
    onError: (error: any) => {
      console.error('Flash API authentication test failed:', error);
    },
  });
};

/**
 * Hook to get account number
 */
export const useFlashAccountNumber = () => {
  return useQuery({
    queryKey: authQueryKeys.accountNumber,
    queryFn: async () => {
      return await authService.getAccountNumber();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: true, // Always enabled since account number doesn't change often
  });
};

/**
 * Main authentication hook that combines all auth functionality
 */
export const useFlashAuth = () => {
  const authStatus = useFlashAuthStatus();
  const initialize = useFlashAuthInitialize();
  const login = useFlashAuthLogin();
  const refresh = useFlashAuthRefresh();
  const logout = useFlashAuthLogout();
  const test = useFlashAuthTest();

  return {
    // Status
    isAuthenticated: authStatus.data?.isAuthenticated ?? false,
    accountNumber: authStatus.data?.accountNumber,
    isLoading: authStatus.isLoading || initialize.isPending || login.isPending,
    error: authStatus.error || initialize.error || login.error || refresh.error,

    // Actions
    initialize: initialize.mutate,
    login: login.mutate,
    refresh: refresh.mutate,
    logout: logout.mutate,
    testAuth: test.mutate,

    // States
    isInitializing: initialize.isPending,
    isLoggingIn: login.isPending,
    isRefreshing: refresh.isPending,
    isLoggingOut: logout.isPending,
    isTesting: test.isPending,

    // Refetch
    refetch: authStatus.refetch,
  };
};