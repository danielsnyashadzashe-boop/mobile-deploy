import { useAuth, useUser } from '@clerk/clerk-expo';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator, Text } from 'react-native';
import { useState, useEffect } from 'react';
import { useGuard } from '../contexts/GuardContext';
import { checkLink } from '../services/mobileApiService';

export default function Index() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const { guardData, setGuardData, isLoading: guardLoading } = useGuard();
  const [checking, setChecking] = useState(true);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  useEffect(() => {
    async function checkAuthAndLinkStatus() {
      // Wait for Clerk and Guard context to load
      if (!isLoaded || guardLoading) {
        return;
      }

      // Not signed in - go to sign-in
      if (!isSignedIn || !user) {
        setRedirectTo('/(auth)/sign-in');
        setChecking(false);
        return;
      }

      // Already have guard data locally - go to dashboard
      if (guardData) {
        setRedirectTo('/(tabs)');
        setChecking(false);
        return;
      }

      // Check if the Clerk user is linked to a guard profile
      try {
        const response = await checkLink(user.id);

        if (response.success && response.data?.isLinked && response.data?.guard) {
          // User is linked - save data and go to dashboard
          await setGuardData(response.data.guard);
          setRedirectTo('/(tabs)');
        } else {
          // User is not linked - go to link account screen
          setRedirectTo('/(auth)/link-account');
        }
      } catch (error) {
        console.error('Error checking link status:', error);
        // On error, send to link account screen
        setRedirectTo('/(auth)/link-account');
      }

      setChecking(false);
    }

    checkAuthAndLinkStatus();
  }, [isSignedIn, isLoaded, user, guardData, guardLoading]);

  if (!isLoaded || guardLoading || checking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' }}>
        <ActivityIndicator size="large" color="#5B94D3" />
        <Text style={{ marginTop: 16, color: '#6B7280', fontSize: 16 }}>
          Loading...
        </Text>
      </View>
    );
  }

  if (redirectTo) {
    return <Redirect href={redirectTo as any} />;
  }

  return <Redirect href="/(auth)/sign-in" />;
}
