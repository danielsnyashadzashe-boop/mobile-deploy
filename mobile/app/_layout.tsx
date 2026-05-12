import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { AuthProvider } from '../contexts/AuthContext';
import { GuardProvider } from '../contexts/GuardContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import '../global.css';

// Configure foreground notification handler — only runs if native module is present
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Notifications = require('expo-notifications');
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch {
  // Native module not available in this build — will work after rebuild
}


export default function RootLayout() {
  const [loaded] = useFonts({
    'Nunito-Regular': require('../assets/fonts/Nunito-Regular.ttf'),
    'Nunito-Medium': require('../assets/fonts/Nunito-Medium.ttf'),
    'Nunito-SemiBold': require('../assets/fonts/Nunito-SemiBold.ttf'),
    'Nunito-Bold': require('../assets/fonts/Nunito-Bold.ttf'),
  });

  useEffect(() => {
    if (Platform.OS === 'web') {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  if (!loaded && Platform.OS !== 'web') {
    return null;
  }

  return (
    <AuthProvider>
      <GuardProvider>
        <NotificationProvider>
          <SafeAreaProvider>
            <StatusBar style="dark" backgroundColor="#ffffff" translucent={false} />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen
                name="notifications"
                options={{
                  headerShown: true,
                  title: 'Notifications',
                  headerStyle: { backgroundColor: '#5B94D3' },
                  headerTintColor: '#fff',
                  headerTitleStyle: { fontFamily: 'Nunito-Bold', fontSize: 18 },
                  presentation: 'card',
                }}
              />
            </Stack>
          </SafeAreaProvider>
        </NotificationProvider>
      </GuardProvider>
    </AuthProvider>
  );
}
