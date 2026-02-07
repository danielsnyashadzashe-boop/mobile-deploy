import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useUser } from '@clerk/clerk-expo';
import { useGuard } from '../contexts/GuardContext';
import { SANDBOX_TEST_DATA, IS_SANDBOX_MODE, NETWORK_PRODUCTS } from '../src/config/api';
import { formatPhoneNumber, isValidPhoneNumber, purchaseAirtime } from '../src/services/flashApi';
import { ConfirmationModal } from '../components/ConfirmationModal';

// Network providers
const NETWORK_PROVIDERS = {
  MTN: { code: 'MTN', name: 'MTN', color: '#FFCC00' },
  VODACOM: { code: 'VDC', name: 'Vodacom', color: '#FF0000' },
  CELL_C: { code: 'CLC', name: 'Cell C', color: '#0066CC' },
  TELKOM: { code: 'TLK', name: 'Telkom', color: '#00A650' },
};

type NetworkKey = keyof typeof NETWORK_PROVIDERS;

const AIRTIME_AMOUNTS = [5, 10, 20, 50, 100, 200];
const MIN_AMOUNT = 2;
const MAX_AMOUNT = 999;

export default function AirtimePurchaseScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { guardData, updateBalance } = useGuard();
  const clerkUserId = user?.id;

  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkKey | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

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

  const canPurchase = (): boolean => {
    const effectiveAmount = getEffectiveAmount();
    return (
      selectedNetwork !== null &&
      isValidPhoneNumber(phoneNumber) &&
      effectiveAmount >= MIN_AMOUNT &&
      effectiveAmount <= MAX_AMOUNT &&
      effectiveAmount <= balance
    );
  };

  const handlePurchase = async () => {
    console.log('🔴 handlePurchase called!');
    const effectiveAmount = getEffectiveAmount();
    console.log('Balance:', balance, 'Amount:', effectiveAmount, 'Network:', selectedNetwork, 'Phone:', phoneNumber);

    // Debug: Show why purchase can't proceed
    if (!selectedNetwork) {
      console.log('❌ No network selected');
      Alert.alert('Select Network', 'Please select a network provider');
      return;
    }
    if (!isValidPhoneNumber(phoneNumber)) {
      console.log('❌ Invalid phone');
      Alert.alert('Invalid Phone', 'Please enter a valid SA phone number');
      return;
    }
    if (effectiveAmount < MIN_AMOUNT) {
      console.log('❌ Amount too low');
      Alert.alert('Invalid Amount', `Minimum amount is R${MIN_AMOUNT}`);
      return;
    }
    if (effectiveAmount > MAX_AMOUNT) {
      console.log('❌ Amount too high');
      Alert.alert('Invalid Amount', `Maximum amount is R${MAX_AMOUNT}`);
      return;
    }
    if (effectiveAmount > balance) {
      console.log('❌ Insufficient balance');
      Alert.alert('Insufficient Balance', `Your balance is R${balance.toFixed(2)}. Reset from dashboard.`);
      return;
    }
    if (!guardData) {
      console.log('❌ No guard data');
      Alert.alert('Error', 'Guard profile not loaded');
      return;
    }
    // Show confirmation modal
    setShowConfirmModal(true);
  };

  const executePurchase = async () => {
    if (!selectedNetwork || !guardData) return;

    const effectiveAmount = getEffectiveAmount();
    const formattedPhone = formatPhoneNumber(phoneNumber);

    // Map our network keys to NETWORK_PRODUCTS keys
    const networkMapping: Record<NetworkKey, keyof typeof NETWORK_PRODUCTS> = {
      MTN: 'MTN',
      VODACOM: 'VODACOM',
      CELL_C: 'CELLC',
      TELKOM: 'TELKOM',
    };
    const networkCode = networkMapping[selectedNetwork];

    setPurchasing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Use new dual-mode purchaseAirtime function
      // In production: uses clerkUserId, deducts from guard balance
      // In sandbox: uses guardId, no balance deduction on backend
      const result = await purchaseAirtime({
        phoneNumber: formattedPhone,
        amount: effectiveAmount,
        networkCode,
        guardId: guardData.guardId,
        clerkUserId: clerkUserId,
      });

      if (result.success) {
        // Update local balance
        // In production, use newBalance from response; in sandbox, calculate locally
        const newBalance = result.data?.newBalance !== undefined
          ? result.data.newBalance
          : balance - effectiveAmount;
        await updateBalance(newBalance);

        setShowConfirmModal(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Airtime Purchased!', `R${effectiveAmount} sent to ${formattedPhone}`);

        // Log mode for debugging
        console.log(`✅ Airtime purchase complete (${IS_SANDBOX_MODE ? 'SANDBOX' : 'PRODUCTION'} mode)`);

        setTimeout(() => router.back(), 1500);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Purchase Failed', result.error || 'Please try again');
      }
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error.message || 'Something went wrong');
    } finally {
      setPurchasing(false);
    }
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
          <TextInput
            className="bg-white mx-4 px-4 py-3.5 rounded-xl border border-gray-200 text-base"
            placeholder="e.g. 0812345678"
            placeholderTextColor="#999"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            maxLength={12}
          />
          {phoneNumber.length > 0 && !isValidPhoneNumber(phoneNumber) && (
            <Text className="text-xs text-red-500 mx-4 mt-1">Enter a valid SA phone number</Text>
          )}

          {/* Sandbox Test Phone Numbers */}
          <View className="mx-4 mt-3 p-3 bg-orange-50 rounded-xl border border-orange-200">
            <Text className="text-xs font-semibold text-orange-800 mb-2">Sandbox Test Phone Numbers</Text>
            <View className="flex-row flex-wrap">
              {SANDBOX_TEST_DATA.PHONE_NUMBERS.map((test, index) => (
                <TouchableOpacity
                  key={index}
                  className="flex-row items-center bg-white px-2 py-1.5 rounded-lg mr-2 mb-2 border border-orange-200"
                  onPress={() => {
                    setPhoneNumber(test.number);
                    // Auto-select network
                    const networkKey = test.network === 'MTN' ? 'MTN' :
                                       test.network === 'VODACOM' ? 'VODACOM' :
                                       test.network === 'TELKOM' ? 'TELKOM' : null;
                    if (networkKey) setSelectedNetwork(networkKey as NetworkKey);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Text className="text-xs text-gray-700">{test.number}</Text>
                  <Text className="text-[10px] text-gray-500 ml-1">({test.network})</Text>
                  <Text className="text-xs text-orange-600 font-semibold ml-2">Use</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

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
            Min R{MIN_AMOUNT} - Max R{MAX_AMOUNT}
          </Text>

          {/* Purchase Button */}
          <Pressable
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              marginHorizontal: 16,
              marginTop: 24,
              marginBottom: 24,
              paddingVertical: 16,
              borderRadius: 12,
              backgroundColor: canPurchase() ? '#2563EB' : '#9CA3AF',
              opacity: pressed ? 0.7 : 1,
            })}
            onPress={() => {
              console.log('🟢 Button pressed!');
              handlePurchase();
            }}
          >
            <Ionicons name="phone-portrait-outline" size={20} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 8 }}>
              Buy R{getEffectiveAmount()} Airtime
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Confirmation Modal */}
      <ConfirmationModal
        visible={showConfirmModal}
        title="Confirm Purchase"
        message={`Purchase airtime for ${formatPhoneNumber(phoneNumber)}?`}
        details={[
          { label: 'Network', value: selectedNetwork ? NETWORK_PROVIDERS[selectedNetwork].name : '-' },
          { label: 'Phone Number', value: formatPhoneNumber(phoneNumber) },
          { label: 'Amount', value: `R${getEffectiveAmount().toFixed(2)}` },
        ]}
        icon="phone-portrait-outline"
        iconColor="#2563EB"
        confirmText="Buy Airtime"
        confirmColor="#2563EB"
        loading={purchasing}
        onConfirm={executePurchase}
        onCancel={() => setShowConfirmModal(false)}
      />
    </SafeAreaView>
  );
}
