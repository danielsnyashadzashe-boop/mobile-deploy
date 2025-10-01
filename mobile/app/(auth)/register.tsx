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
import { useSignUp } from '@clerk/clerk-expo';
import { TippaLogo } from '../../components/TippaLogo';

export default function RegisterScreen() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async () => {
    if (!isLoaded) return;

    if (!firstName || !lastName || !email || !password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsLoading(true);

    try {
      await signUp.create({
        firstName,
        lastName,
        emailAddress: email,
        password,
        phoneNumber: phoneNumber || undefined,
      });

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });

      setPendingVerification(true);
      Alert.alert('Verification Required', 'Please check your email for a verification code.');
    } catch (err: any) {
      Alert.alert('Registration Failed', err.errors?.[0]?.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!isLoaded) return;

    setIsLoading(true);

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status === 'complete') {
        await setActive({ session: completeSignUp.createdSessionId });
        router.replace('/(tabs)/dashboard');
      } else {
        Alert.alert('Error', 'Verification incomplete. Please try again.');
      }
    } catch (err: any) {
      Alert.alert('Verification Failed', err.errors?.[0]?.message || 'Invalid code. Please try again.');
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
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="px-6 py-6">
            {/* Header */}
            <View className="items-center mb-6">
              <View className="mb-3">
                <TippaLogo size={64} />
              </View>
              <Text className="text-2xl font-bold text-gray-900">Guard Registration</Text>
              <Text className="text-gray-600 mt-1 text-center">
                Apply to become a Nogada car guard
              </Text>
            </View>

            {!pendingVerification ? (
              <>
                {/* Personal Information */}
                <View className="mb-6">
                  <Text className="text-lg font-semibold text-gray-800 mb-4">
                    Personal Information
                  </Text>

                  <View className="mb-4">
                    <Text className="text-sm font-medium text-gray-700 mb-1">First Name *</Text>
                    <TextInput
                      value={firstName}
                      onChangeText={setFirstName}
                      placeholder="John"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                    />
                  </View>

                  <View className="mb-4">
                    <Text className="text-sm font-medium text-gray-700 mb-1">Last Name *</Text>
                    <TextInput
                      value={lastName}
                      onChangeText={setLastName}
                      placeholder="Mokoena"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                    />
                  </View>

                  <View className="mb-4">
                    <Text className="text-sm font-medium text-gray-700 mb-1">Email Address *</Text>
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      placeholder="john@example.com"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>

                  <View className="mb-4">
                    <Text className="text-sm font-medium text-gray-700 mb-1">Password *</Text>
                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Enter a secure password"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                      secureTextEntry
                    />
                  </View>

                  <View className="mb-4">
                    <Text className="text-sm font-medium text-gray-700 mb-1">
                      Phone Number (Optional)
                    </Text>
                    <TextInput
                      value={phoneNumber}
                      onChangeText={setPhoneNumber}
                      placeholder="+27734567890"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>
              </>
            ) : (
              <>
                {/* Verification Code */}
                <View className="mb-6">
                  <Text className="text-lg font-semibold text-gray-800 mb-4">
                    Email Verification
                  </Text>
                  <Text className="text-sm text-gray-600 mb-4">
                    We've sent a verification code to {email}. Please enter it below.
                  </Text>

                  <View className="mb-4">
                    <Text className="text-sm font-medium text-gray-700 mb-1">Verification Code *</Text>
                    <TextInput
                      value={code}
                      onChangeText={setCode}
                      placeholder="Enter 6-digit code"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                      keyboardType="numeric"
                      maxLength={6}
                    />
                  </View>
                </View>
              </>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              onPress={pendingVerification ? handleVerify : handleSignUp}
              disabled={isLoading}
              style={{ backgroundColor: isLoading ? '#9CA3AF' : '#5B94D3' }}
              className="w-full py-4 rounded-lg mb-4"
            >
              <Text className="text-white text-center font-semibold text-base">
                {isLoading
                  ? pendingVerification ? 'Verifying...' : 'Creating Account...'
                  : pendingVerification ? 'Verify Email' : 'Create Account'}
              </Text>
            </TouchableOpacity>

            {/* Login Link */}
            <View className="items-center">
              <Text className="text-gray-600">Already have an account? </Text>
              <Link href="/login" asChild>
                <TouchableOpacity>
                  <Text style={{ color: '#5B94D3' }} className="font-semibold">Sign In</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}