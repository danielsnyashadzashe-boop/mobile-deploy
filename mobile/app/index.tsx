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
    async function checkRegistrationStatus() {
      if (!isSignedIn || !user) {
        setRedirectTo('/(auth)/sign-in');
        setChecking(false);
        return;
      }

      try {
        const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
        const response = await fetch(`${apiUrl}/api/registration/check`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clerkUserId: user.id,
            email: user.primaryEmailAddress?.emailAddress
          }),
        });

        if (response.ok) {
          const data = await response.json();

          // Route based on registration status
          if (!data.hasCompletedRegistration) {
            setRedirectTo('/(auth)/complete-registration');
          } else if (data.currentStatus === 'pending_approval') {
            setRedirectTo('/(auth)/registration-pending');
          } else if (data.canAccessApp) {
            // If user can access app (APPROVED or has active CarGuard), go to dashboard
            setRedirectTo('/(tabs)');
          } else {
            // Fallback to complete registration
            setRedirectTo('/(auth)/complete-registration');
          }
        } else {
          // If API call fails, allow access to app
          setRedirectTo('/(tabs)');
        }
      } catch (error) {
        console.error('Error checking registration:', error);
        // On error, allow access to app
        setRedirectTo('/(tabs)');
      } finally {
        setChecking(false);
      }
    }

    if (isLoaded) {
      checkRegistrationStatus();
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