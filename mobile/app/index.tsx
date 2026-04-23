import { useAuth } from '../contexts/AuthContext';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator, Text } from 'react-native';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' }}>
        <ActivityIndicator size="large" color="#5B94D3" />
        <Text style={{ marginTop: 16, color: '#6B7280', fontSize: 16 }}>Loading...</Text>
      </View>
    );
  }

  return <Redirect href={isAuthenticated ? '/(tabs)' : '/(auth)/sign-in'} />;
}
