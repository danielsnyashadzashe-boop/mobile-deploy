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
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const locations = [
  { id: 'loc1', name: 'Sandton City Mall', address: 'Sandton' },
  { id: 'loc2', name: 'V&A Waterfront', address: 'Cape Town' },
  { id: 'loc3', name: 'Menlyn Park Shopping Centre', address: 'Pretoria' },
  { id: 'loc4', name: 'Gateway Theatre of Shopping', address: 'Durban' },
];

const banks = [
  { value: 'fnb', label: 'FNB' },
  { value: 'standardbank', label: 'Standard Bank' },
  { value: 'absa', label: 'ABSA' },
  { value: 'nedbank', label: 'Nedbank' },
  { value: 'capitec', label: 'Capitec' },
  { value: 'tymebank', label: 'TymeBank' },
];

export default function RegisterScreen() {
  const [formData, setFormData] = useState({
    fullName: '',
    idNumber: '',
    phoneNumber: '',
    email: '',
    preferredLocation: '',
    bankName: '',
    accountNumber: '',
    accountType: '',
    branchCode: '',
  });

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.fullName || !formData.idNumber || !formData.phoneNumber || !formData.preferredLocation) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      // Store registration in AsyncStorage
      const pendingRegistrations = JSON.parse(await AsyncStorage.getItem('pendingRegistrations') || '[]');
      pendingRegistrations.push({
        ...formData,
        id: `pr-${Date.now()}`,
        submittedAt: new Date().toISOString(),
        status: 'pending',
      });
      await AsyncStorage.setItem('pendingRegistrations', JSON.stringify(pendingRegistrations));

      Alert.alert(
        'Success',
        "Registration submitted! You'll receive an SMS once approved.",
        [{ text: 'OK', onPress: () => router.replace('/login') }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit registration. Please try again.');
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
              <View className="w-16 h-16 bg-tippa-500 rounded-full items-center justify-center mb-3">
                <Text className="text-white text-xl font-bold">TG</Text>
              </View>
              <Text className="text-2xl font-bold text-gray-900">Guard Registration</Text>
              <Text className="text-gray-600 mt-1 text-center">
                Apply to become a Nogada car guard
              </Text>
            </View>

            {/* Personal Information */}
            <View className="mb-6">
              <Text className="text-lg font-semibold text-gray-800 mb-4">
                Personal Information
              </Text>

              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-1">Full Name *</Text>
                <TextInput
                  value={formData.fullName}
                  onChangeText={(text) => setFormData({ ...formData, fullName: text })}
                  placeholder="John Mokoena"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                />
              </View>

              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-1">ID Number *</Text>
                <TextInput
                  value={formData.idNumber}
                  onChangeText={(text) => setFormData({ ...formData, idNumber: text })}
                  placeholder="9001015800084"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  keyboardType="numeric"
                  maxLength={13}
                />
              </View>

              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-1">Phone Number *</Text>
                <TextInput
                  value={formData.phoneNumber}
                  onChangeText={(text) => setFormData({ ...formData, phoneNumber: text })}
                  placeholder="073 456 7890"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  keyboardType="phone-pad"
                />
              </View>

              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-1">
                  Email (Optional)
                </Text>
                <TextInput
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  placeholder="john@example.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Work Location */}
            <View className="mb-6">
              <Text className="text-lg font-semibold text-gray-800 mb-4">Work Location</Text>

              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-1">
                  Preferred Location *
                </Text>
                <View className="border border-gray-300 rounded-lg">
                  <Picker
                    selectedValue={formData.preferredLocation}
                    onValueChange={(value) =>
                      setFormData({ ...formData, preferredLocation: value })
                    }
                  >
                    <Picker.Item label="Select a location" value="" />
                    {locations.map((location) => (
                      <Picker.Item
                        key={location.id}
                        label={`${location.name} - ${location.address}`}
                        value={location.id}
                      />
                    ))}
                  </Picker>
                </View>
              </View>
            </View>

            {/* Banking Details */}
            <View className="mb-6">
              <Text className="text-lg font-semibold text-gray-800 mb-2">
                Banking Details (Optional)
              </Text>
              <Text className="text-xs text-gray-500 mb-4">
                You can add or update these later
              </Text>

              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-1">Bank Name</Text>
                <View className="border border-gray-300 rounded-lg">
                  <Picker
                    selectedValue={formData.bankName}
                    onValueChange={(value) => setFormData({ ...formData, bankName: value })}
                  >
                    <Picker.Item label="Select your bank" value="" />
                    {banks.map((bank) => (
                      <Picker.Item key={bank.value} label={bank.label} value={bank.value} />
                    ))}
                  </Picker>
                </View>
              </View>

              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-1">Account Number</Text>
                <TextInput
                  value={formData.accountNumber}
                  onChangeText={(text) => setFormData({ ...formData, accountNumber: text })}
                  placeholder="1234567890"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  keyboardType="numeric"
                />
              </View>

              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-1">Account Type</Text>
                <View className="border border-gray-300 rounded-lg">
                  <Picker
                    selectedValue={formData.accountType}
                    onValueChange={(value) => setFormData({ ...formData, accountType: value })}
                  >
                    <Picker.Item label="Select account type" value="" />
                    <Picker.Item label="Savings" value="savings" />
                    <Picker.Item label="Cheque" value="cheque" />
                    <Picker.Item label="Transmission" value="transmission" />
                  </Picker>
                </View>
              </View>

              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-1">Branch Code</Text>
                <TextInput
                  value={formData.branchCode}
                  onChangeText={(text) => setFormData({ ...formData, branchCode: text })}
                  placeholder="250655"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              className="w-full bg-tippa-500 py-4 rounded-lg mb-4"
            >
              <Text className="text-white text-center font-semibold text-base">
                Submit Registration
              </Text>
            </TouchableOpacity>

            {/* Login Link */}
            <View className="items-center">
              <Text className="text-gray-600">Already have an account? </Text>
              <Link href="/login" asChild>
                <TouchableOpacity>
                  <Text className="text-tippa-600 font-semibold">Sign In</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}