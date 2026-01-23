import { useAuth, useUser } from '@clerk/clerk-expo';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';

export default function Index() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const [checking, setChecking] = useState(true);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  useEffect(() => {
    async function checkAuthStatus() {
      if (!isSignedIn || !user) {
        // Not signed in, go to sign-in
        setRedirectTo('/(auth)/sign-in');
        setChecking(false);
        return;
      }

      // SIMPLIFIED: Skip registration check, go directly to app
      setRedirectTo('/(tabs)');
      setChecking(false);
    }

    if (isLoaded) {
      checkAuthStatus();
    }
  }, [isSignedIn, isLoaded, user]);

  if (!isLoaded || checking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' }}>
        <ActivityIndicator size="large" color="#5B94D3" />
      </View>
    );
  }

  if (redirectTo) {
    return <Redirect href={redirectTo as any} />;
  }

  return <Redirect href="/(auth)/sign-in" />;
}