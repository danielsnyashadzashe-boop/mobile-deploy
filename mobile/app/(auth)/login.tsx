import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Link, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSignIn } from '@clerk/clerk-expo';
import { TippaLogo } from '../../components/TippaLogo';

export default function LoginScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!isLoaded) return;

    if (!email || !password) {
      Alert.alert('Error', 'Please enter your email and password');
      return;
    }

    setIsLoading(true);

    try {
      const signInAttempt = await signIn.create({
        identifier: email,
        password,
      });

      if (signInAttempt.status === 'complete') {
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace('/(tabs)/dashboard');
      } else {
        Alert.alert('Error', 'Sign-in process incomplete. Please try again.');
      }
    } catch (err: any) {
      Alert.alert('Login Failed', err.errors?.[0]?.message || 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 px-6 py-8">
            {/* Logo Section */}
            <View className="items-center mb-8">
              <View className="mb-4">
                <TippaLogo size={80} />
              </View>
              <Text className="text-2xl font-bold text-gray-900">Car Guard Login</Text>
              <Text className="text-gray-600 mt-2">Welcome back!</Text>
            </View>

            {/* Login Form */}
            <View className="space-y-4">
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                />
              </View>

              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">
                  Password
                </Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base"
                  secureTextEntry
                />
                <TouchableOpacity className="mt-2">
                  <Text style={{ color: '#5B94D3' }} className="text-xs">Forgot Password?</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={handleLogin}
                disabled={isLoading}
                style={{ backgroundColor: isLoading ? '#9CA3AF' : '#5B94D3' }}
                className="w-full py-4 rounded-lg mt-6"
              >
                <Text className="text-white text-center font-semibold text-base">
                  {isLoading ? 'Signing In...' : 'Login'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Register Link */}
            <View className="mt-8 pt-6 border-t border-gray-200">
              <Text className="text-center text-gray-600 mb-2">
                Don't have an account?
              </Text>
              <Link href="/register" asChild>
                <TouchableOpacity>
                  <Text style={{ color: '#5B94D3' }} className="text-center font-semibold">
                    Apply to become a Car Guard
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>

            {/* Help Text */}
            <Text className="text-xs text-center text-gray-500 mt-6">
              Contact your Nogada administrator if you need assistance.
            </Text>

            {/* Demo Hint */}
            <View className="mt-8 p-4 bg-gray-50 rounded-lg">
              <Text className="text-xs text-gray-600 text-center">
                Sign in with your Clerk account credentials
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}