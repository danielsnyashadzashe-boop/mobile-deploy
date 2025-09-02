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

export default function LoginScreen() {
  const [guardId, setGuardId] = useState('');
  const [pin, setPin] = useState('');

  const handleLogin = () => {
    // Simple mock authentication
    if (guardId === 'NG001' && pin === '1234') {
      router.replace('/(tabs)/dashboard');
    } else {
      Alert.alert('Login Failed', 'Invalid credentials. Please try again.');
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
              <View className="w-20 h-20 bg-tippa-500 rounded-full items-center justify-center mb-4">
                <Text className="text-white text-2xl font-bold">TG</Text>
              </View>
              <Text className="text-2xl font-bold text-gray-900">Tippa Guard</Text>
              <Text className="text-gray-600 mt-2">Welcome back!</Text>
            </View>

            {/* Login Form */}
            <View className="space-y-4">
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">
                  Guard ID / Phone Number
                </Text>
                <TextInput
                  value={guardId}
                  onChangeText={setGuardId}
                  placeholder="Enter your Guard ID"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">
                  PIN / Password
                </Text>
                <TextInput
                  value={pin}
                  onChangeText={setPin}
                  placeholder="Enter your PIN"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base"
                  secureTextEntry
                  keyboardType="numeric"
                />
                <TouchableOpacity className="mt-2">
                  <Text className="text-xs text-tippa-600">Forgot PIN/Password?</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={handleLogin}
                className="w-full bg-tippa-500 py-4 rounded-lg mt-6"
              >
                <Text className="text-white text-center font-semibold text-base">
                  Login
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
                  <Text className="text-center text-tippa-600 font-semibold">
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
                Demo Login: Guard ID: NG001, PIN: 1234
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}