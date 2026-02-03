import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import { useGuard } from '../contexts/GuardContext';
import { AirtimeApiService } from '../services/flash/api/airtimeApi';
import { NETWORK_PROVIDERS, BUSINESS_RULES } from '../services/flash/utils/constants';
import { formatPhoneNumber, validatePhoneNumber } from '../services/flash/utils/validators';

type NetworkKey = keyof typeof NETWORK_PROVIDERS;

const AIRTIME_AMOUNTS = [10, 25, 50, 100, 200, 500];

export default function AirtimePurchaseScreen() {
  const router = useRouter();
  const { guardData, updateBalance } = useGuard();
  const airtimeApi = AirtimeApiService.getInstance();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkKey | null>(null);
  const [loading, setLoading] = useState(false);
  const [useOwnNumber, setUseOwnNumber] = useState(true);

  const networks: NetworkKey[] = ['MTN', 'VODACOM', 'CELL_C', 'TELKOM'];
  const balance = guardData?.balance || 0;

  const handleAmountSelect = (value: number) => {
    setAmount(value);
    setCustomAmount('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleCustomAmountChange = (text: string) => {
    const numericValue = text.replace(/[^0-9]/g, '');
    setCustomAmount(numericValue);
    setAmount(numericValue ? parseInt(numericValue, 10) : 0);
  };

  const getEffectiveAmount = (): number => {
    return customAmount ? parseInt(customAmount, 10) : amount;
  };

  const isValidPhone = (): boolean => {
    if (!phoneNumber) return false;
    const validation = validatePhoneNumber(phoneNumber);
    return validation.isValid;
  };

  const canPurchase = (): boolean => {
    const effectiveAmount = getEffectiveAmount();
    return (
      selectedNetwork !== null &&
      isValidPhone() &&
      effectiveAmount >= BUSINESS_RULES.AIRTIME.MIN_AMOUNT &&
      effectiveAmount <= BUSINESS_RULES.AIRTIME.MAX_AMOUNT &&
      effectiveAmount <= balance
    );
  };

  const handlePurchase = async () => {
    if (!canPurchase() || !selectedNetwork || !guardData) return;

    const effectiveAmount = getEffectiveAmount();
    const networkInfo = NETWORK_PROVIDERS[selectedNetwork];
    const formattedPhone = formatPhoneNumber(phoneNumber);

    Alert.alert(
      'Confirm Purchase',
      `Purchase R${effectiveAmount} ${networkInfo.name} airtime for ${formattedPhone}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setLoading(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

            try {
              const result = await airtimeApi.purchaseAirtime(
                phoneNumber,
                effectiveAmount,
                networkInfo.code,
                `AIRTIME_${guardData.guardId}_${Date.now()}`
              );

              if (result.success) {
                // Update local balance
                const newBalance = balance - effectiveAmount;
                await updateBalance(newBalance);

                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Toast.show({
                  type: 'success',
                  text1: 'Airtime Purchased!',
                  text2: `R${effectiveAmount} sent to ${formattedPhone}`,
                  position: 'top',
                  visibilityTime: 3000,
                });

                // Go back after success
                setTimeout(() => router.back(), 1500);
              } else {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                Toast.show({
                  type: 'error',
                  text1: 'Purchase Failed',
                  text2: result.error?.message || 'Please try again',
                  position: 'top',
                  visibilityTime: 4000,
                });
              }
            } catch (error: any) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.message || 'Something went wrong',
                position: 'top',
                visibilityTime: 4000,
              });
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View className="flex-row items-center justify-between px-4 py-3">
            <TouchableOpacity onPress={() => router.back()} className="p-2">
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text className="text-lg font-semibold text-gray-900">Buy Airtime</Text>
            <View className="w-10" />
          </View>

          {/* Balance Card */}
          <View className="bg-blue-900 mx-4 my-3 p-5 rounded-xl items-center">
            <Text className="text-blue-200 text-sm">Available Balance</Text>
            <Text className="text-white text-3xl font-bold mt-1">R{balance.toFixed(2)}</Text>
          </View>

          {/* Network Selection */}
          <Text className="text-sm font-semibold text-gray-600 mx-4 mt-4 mb-2">Select Network</Text>
          <View className="flex-row flex-wrap px-3">
            {networks.map((network) => {
              const info = NETWORK_PROVIDERS[network];
              const isSelected = selectedNetwork === network;
              return (
                <TouchableOpacity
                  key={network}
                  className={`w-[46%] m-[2%] p-4 bg-white rounded-xl border flex-row items-center ${
                    isSelected ? 'border-2' : 'border-gray-200'
                  }`}
                  style={isSelected ? { borderColor: info.color, backgroundColor: `${info.color}15` } : {}}
                  onPress={() => {
                    setSelectedNetwork(network);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <View
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: info.color }}
                  />
                  <Text className="text-sm font-medium text-gray-900">{info.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Phone Number */}
          <Text className="text-sm font-semibold text-gray-600 mx-4 mt-4 mb-2">Phone Number</Text>
          <View className="flex-row mx-4 mb-3">
            <TouchableOpacity
              className={`flex-1 py-2.5 items-center rounded-l-lg ${
                useOwnNumber ? 'bg-blue-900' : 'bg-gray-200'
              }`}
              onPress={() => setUseOwnNumber(true)}
            >
              <Text className={`font-medium ${useOwnNumber ? 'text-white' : 'text-gray-600'}`}>
                My Number
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-2.5 items-center rounded-r-lg ${
                !useOwnNumber ? 'bg-blue-900' : 'bg-gray-200'
              }`}
              onPress={() => setUseOwnNumber(false)}
            >
              <Text className={`font-medium ${!useOwnNumber ? 'text-white' : 'text-gray-600'}`}>
                Other Number
              </Text>
            </TouchableOpacity>
          </View>

          <TextInput
            className="bg-white mx-4 px-4 py-3.5 rounded-xl border border-gray-200 text-base"
            placeholder="e.g. 0831234567"
            placeholderTextColor="#999"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            maxLength={12}
          />
          {phoneNumber.length > 0 && !isValidPhone() && (
            <Text className="text-xs text-red-500 mx-4 mt-1">Enter a valid SA phone number</Text>
          )}

          {/* Amount Selection */}
          <Text className="text-sm font-semibold text-gray-600 mx-4 mt-4 mb-2">Select Amount</Text>
          <View className="flex-row flex-wrap px-3">
            {AIRTIME_AMOUNTS.map((value) => {
              const isSelected = amount === value && !customAmount;
              const isDisabled = value > balance;
              return (
                <TouchableOpacity
                  key={value}
                  className={`w-[29%] m-[2%] py-3.5 rounded-xl items-center border ${
                    isSelected
                      ? 'bg-blue-900 border-blue-900'
                      : isDisabled
                      ? 'bg-gray-100 border-gray-200'
                      : 'bg-white border-gray-200'
                  }`}
                  onPress={() => handleAmountSelect(value)}
                  disabled={isDisabled}
                >
                  <Text
                    className={`text-base font-semibold ${
                      isSelected ? 'text-white' : isDisabled ? 'text-gray-400' : 'text-gray-900'
                    }`}
                  >
                    R{value}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Custom Amount */}
          <Text className="text-sm font-semibold text-gray-600 mx-4 mt-4 mb-2">Or Enter Custom Amount</Text>
          <View className="flex-row items-center bg-white mx-4 px-4 rounded-xl border border-gray-200">
            <Text className="text-lg font-semibold text-gray-500 mr-2">R</Text>
            <TextInput
              className="flex-1 py-3.5 text-lg font-semibold"
              placeholder="0"
              placeholderTextColor="#999"
              keyboardType="number-pad"
              value={customAmount}
              onChangeText={handleCustomAmountChange}
              maxLength={4}
            />
          </View>
          <Text className="text-xs text-gray-500 mx-4 mt-1">
            Min R{BUSINESS_RULES.AIRTIME.MIN_AMOUNT} - Max R{BUSINESS_RULES.AIRTIME.MAX_AMOUNT}
          </Text>

          {/* Purchase Button */}
          <TouchableOpacity
            className={`flex-row items-center justify-center mx-4 mt-6 mb-6 py-4 rounded-xl ${
              canPurchase() ? 'bg-blue-600' : 'bg-gray-400'
            }`}
            onPress={handlePurchase}
            disabled={!canPurchase() || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="phone-portrait-outline" size={20} color="#fff" />
                <Text className="text-white text-base font-semibold ml-2">
                  Buy R{getEffectiveAmount()} Airtime
                </Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
