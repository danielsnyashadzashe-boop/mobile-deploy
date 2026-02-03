import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import Toast from 'react-native-toast-message';
import { useGuard } from '../contexts/GuardContext';
import { purchaseVoucher, PayoutResult } from '../services/mobileApiService';
import { formatCurrency } from '../data/mockData';

// Quick amount buttons
const QUICK_AMOUNTS = [50, 100, 200, 500, 1000];

// Voucher limits
const MIN_VOUCHER_AMOUNT = 1;
const MAX_VOUCHER_AMOUNT = 4000;

export default function VoucherPurchaseScreen() {
  const router = useRouter();
  const { guardData, updateBalance } = useGuard();

  // Form state
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PayoutResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pinCopied, setPinCopied] = useState(false);

  // Animation for loading spinner
  const spinAnim = useRef(new Animated.Value(0)).current;

  // Spinning animation for loading
  useEffect(() => {
    if (loading) {
      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    } else {
      spinAnim.setValue(0);
    }
  }, [loading]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Parse and validate amount
  const parsedAmount = parseFloat(amount) || 0;
  const balance = guardData?.balance || 0;

  const isValidAmount =
    parsedAmount >= MIN_VOUCHER_AMOUNT &&
    parsedAmount <= MAX_VOUCHER_AMOUNT &&
    parsedAmount <= balance;

  const getAmountError = (): string | null => {
    if (!amount) return null;
    if (parsedAmount < MIN_VOUCHER_AMOUNT) return `Minimum amount is R${MIN_VOUCHER_AMOUNT}`;
    if (parsedAmount > MAX_VOUCHER_AMOUNT) return `Maximum amount is R${MAX_VOUCHER_AMOUNT}`;
    if (parsedAmount > balance) return 'Insufficient balance';
    return null;
  };

  // Handle voucher purchase
  const handlePurchase = async () => {
    if (!guardData || !isValidAmount) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Confirmation alert
    Alert.alert(
      'Confirm Purchase',
      `Purchase a R${parsedAmount.toFixed(2)} voucher?\n\nYour balance will be reduced from R${balance.toFixed(2)} to R${(balance - parsedAmount).toFixed(2)}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Purchase',
          style: 'default',
          onPress: async () => {
            setLoading(true);
            setError(null);

            try {
              const response = await purchaseVoucher(
                guardData.guardId,
                parsedAmount,
                notes || undefined
              );

              if (response.success && response.data) {
                setResult(response.data);
                // Update local balance
                await updateBalance(response.data.newBalance);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Toast.show({
                  type: 'success',
                  text1: 'Voucher Purchased!',
                  text2: `Your R${parsedAmount.toFixed(2)} voucher is ready`,
                  position: 'top',
                  visibilityTime: 3000,
                });
              } else {
                setError(response.error || 'Failed to purchase voucher');
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                Toast.show({
                  type: 'error',
                  text1: 'Purchase Failed',
                  text2: response.error || 'Please try again',
                  position: 'top',
                  visibilityTime: 4000,
                });
              }
            } catch (err: any) {
              setError(err.message || 'Something went wrong');
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: err.message || 'Something went wrong',
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

  // Copy PIN to clipboard
  const copyPin = async () => {
    if (result?.voucher?.pin) {
      await Clipboard.setStringAsync(result.voucher.pin);
      setPinCopied(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Toast.show({
        type: 'success',
        text1: 'Copied!',
        text2: 'PIN copied to clipboard',
        position: 'top',
        visibilityTime: 2000,
      });
      setTimeout(() => setPinCopied(false), 2000);
    }
  };

  // Reset for another purchase
  const handleReset = () => {
    setResult(null);
    setError(null);
    setAmount('');
    setNotes('');
    setPinCopied(false);
  };

  // Purchase in progress state
  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center px-6">
          <View className="w-20 h-20 justify-center items-center mb-6">
            <View className="absolute w-20 h-20 rounded-full border-4 border-emerald-100" />
            <Animated.View
              style={{ transform: [{ rotate: spin }] }}
              className="absolute w-20 h-20 rounded-full border-4 border-emerald-600 border-t-transparent"
            />
            <Ionicons name="ticket-outline" size={28} color="#059669" />
          </View>
          <Text className="text-xl font-bold text-emerald-600 mb-2">
            Purchasing Voucher...
          </Text>
          <Text className="text-base text-gray-700 mb-2">
            R{parsedAmount.toFixed(2)} for {guardData?.name}
          </Text>
          <Text className="text-sm text-gray-500">
            Please wait, this may take a few seconds
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Success state - show voucher PIN
  if (result?.voucher) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right']}>
        <ScrollView className="flex-1 px-4 py-4">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-5">
            <TouchableOpacity
              onPress={() => router.back()}
              className="p-2"
            >
              <Ionicons name="arrow-back" size={24} color="#1e3a5f" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-gray-900">Voucher Purchased</Text>
            <View className="w-10" />
          </View>

          {/* Success Card */}
          <View className="items-center mb-6">
            <View className="mb-4">
              <Ionicons name="checkmark-circle" size={64} color="#059669" />
            </View>
            <Text className="text-2xl font-bold text-emerald-800 mb-1">
              Purchase Successful!
            </Text>
            <Text className="text-base text-gray-600">
              Your voucher is ready to redeem
            </Text>
          </View>

          {/* PIN Display */}
          <View className="bg-white rounded-2xl p-5 mb-4 border-2 border-dashed border-emerald-200 items-center">
            <Text className="text-xs text-gray-500 mb-2 uppercase tracking-wider">
              16-Digit Voucher PIN
            </Text>
            <View className="flex-row items-center gap-3">
              <Text
                className="text-xl font-bold text-emerald-800 tracking-wider"
                style={{ fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}
              >
                {result.voucher.pin}
              </Text>
              <TouchableOpacity onPress={copyPin} className="p-2">
                <Ionicons
                  name={pinCopied ? 'checkmark' : 'copy-outline'}
                  size={20}
                  color={pinCopied ? '#059669' : '#6b7280'}
                />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={copyPin}
              className="flex-row items-center bg-emerald-600 rounded-lg px-5 py-2.5 mt-4 gap-2"
            >
              <Ionicons
                name={pinCopied ? 'checkmark-circle' : 'copy'}
                size={18}
                color="#fff"
              />
              <Text className="text-sm font-semibold text-white">
                {pinCopied ? 'Copied!' : 'Copy PIN'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Voucher Details */}
          <View className="bg-white rounded-2xl p-4 mb-4">
            <View className="flex-row justify-between items-center py-3">
              <Text className="text-sm text-gray-500">Amount</Text>
              <Text className="text-sm font-semibold text-gray-900">
                R{result.amount.toFixed(2)}
              </Text>
            </View>
            <View className="h-px bg-gray-100" />
            <View className="flex-row justify-between items-center py-3">
              <Text className="text-sm text-gray-500">New Balance</Text>
              <Text className="text-sm font-semibold text-gray-900">
                R{result.newBalance.toFixed(2)}
              </Text>
            </View>
            <View className="h-px bg-gray-100" />
            <View className="flex-row justify-between items-center py-3">
              <Text className="text-sm text-gray-500">Serial Number</Text>
              <Text
                className="text-xs font-semibold text-gray-900"
                style={{ fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}
              >
                {result.voucher.serialNumber}
              </Text>
            </View>
            <View className="h-px bg-gray-100" />
            <View className="flex-row justify-between items-center py-3">
              <Text className="text-sm text-gray-500">Expiry Date</Text>
              <Text className="text-sm font-semibold text-gray-900">
                {result.voucher.expiryDate}
              </Text>
            </View>
          </View>

          {/* Info Box */}
          <View className="flex-row bg-blue-50 rounded-xl p-3 mb-5 border border-blue-200">
            <Ionicons name="information-circle" size={20} color="#2563eb" />
            <Text className="flex-1 ml-2 text-sm text-blue-800 leading-5">
              Redeem this PIN at any Netcash channel: Shoprite, Checkers, Pick n
              Pay, Spar, and more. Save or screenshot this PIN!
            </Text>
          </View>

          {/* Actions */}
          <View className="flex-row gap-3 mb-8">
            <TouchableOpacity
              className="flex-1 flex-row items-center justify-center bg-white rounded-xl py-3.5 border-2 border-emerald-600 gap-2"
              onPress={handleReset}
            >
              <Ionicons name="add-circle-outline" size={20} color="#059669" />
              <Text className="text-base font-semibold text-emerald-600">Buy Another</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 flex-row items-center justify-center bg-emerald-600 rounded-xl py-3.5 gap-2"
              onPress={() => router.back()}
            >
              <Ionicons name="home-outline" size={20} color="#fff" />
              <Text className="text-base font-semibold text-white">Done</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Main purchase form
  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right']}>
      <ScrollView className="flex-1 px-4 py-4">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-5">
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-2"
          >
            <Ionicons name="arrow-back" size={24} color="#1e3a5f" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900">Buy 1Voucher</Text>
          <View className="w-10" />
        </View>

        {/* Balance Card */}
        <View className="bg-emerald-50 rounded-2xl p-5 items-center mb-5 border border-emerald-200">
          <Text className="text-sm text-emerald-700 mb-1">Available Balance</Text>
          <Text className="text-4xl font-bold text-emerald-800">
            {formatCurrency(balance)}
          </Text>
        </View>

        {/* Error Message */}
        {error && (
          <View className="flex-row items-center bg-red-50 rounded-xl p-3 mb-4 border border-red-200">
            <Ionicons name="alert-circle" size={20} color="#dc2626" />
            <Text className="flex-1 ml-2 text-sm text-red-600">{error}</Text>
          </View>
        )}

        {/* Amount Input */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-gray-700 mb-2">
            Voucher Amount (R)
          </Text>
          <View className="flex-row items-center bg-white rounded-xl border-2 border-gray-200 px-4">
            <Text className="text-2xl font-bold text-gray-500 mr-1">R</Text>
            <TextInput
              className="flex-1 text-2xl font-bold text-gray-900 py-4"
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor="#9ca3af"
              keyboardType="decimal-pad"
              maxLength={7}
            />
          </View>
          {getAmountError() && (
            <Text className="text-xs text-red-600 mt-1">{getAmountError()}</Text>
          )}
          <Text className="text-xs text-gray-500 mt-1">Min R1 - Max R4,000</Text>
        </View>

        {/* Quick Amount Buttons */}
        <View className="flex-row flex-wrap gap-2 mb-5">
          {QUICK_AMOUNTS.map((quickAmount) => {
            const isDisabled = quickAmount > balance;
            const isSelected = amount === String(quickAmount);
            return (
              <TouchableOpacity
                key={quickAmount}
                className={`px-4 py-2.5 rounded-lg border ${
                  isSelected
                    ? 'bg-emerald-600 border-emerald-600'
                    : isDisabled
                    ? 'bg-gray-100 border-gray-200'
                    : 'bg-white border-gray-200'
                }`}
                onPress={() => {
                  if (!isDisabled) {
                    setAmount(String(quickAmount));
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                }}
                disabled={isDisabled}
              >
                <Text
                  className={`text-sm font-semibold ${
                    isSelected
                      ? 'text-white'
                      : isDisabled
                      ? 'text-gray-400'
                      : 'text-gray-700'
                  }`}
                >
                  R{quickAmount}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Notes Input (Optional) */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-gray-700 mb-2">
            Notes (optional)
          </Text>
          <TextInput
            className="bg-white rounded-xl border border-gray-200 px-4 py-3 text-base text-gray-900"
            value={notes}
            onChangeText={setNotes}
            placeholder="e.g., Weekly payout"
            placeholderTextColor="#9ca3af"
            maxLength={100}
          />
        </View>

        {/* Info Box */}
        <View className="flex-row bg-blue-50 rounded-xl p-3 mb-5 border border-blue-200">
          <Ionicons name="ticket" size={20} color="#2563eb" />
          <Text className="flex-1 ml-2 text-sm text-blue-800 leading-5">
            You'll receive a 16-digit PIN that can be redeemed for cash at
            Shoprite, Checkers, Pick n Pay, Spar, and other Netcash partners.
          </Text>
        </View>

        {/* Purchase Button */}
        <TouchableOpacity
          className={`flex-row items-center justify-center rounded-xl py-4 gap-2 ${
            isValidAmount ? 'bg-emerald-600' : 'bg-gray-400'
          }`}
          onPress={handlePurchase}
          disabled={!isValidAmount}
          style={
            isValidAmount
              ? {
                  shadowColor: '#059669',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 4,
                }
              : undefined
          }
        >
          <Ionicons name="ticket-outline" size={22} color="#fff" />
          <Text className="text-lg font-bold text-white">
            Purchase R{parsedAmount > 0 ? parsedAmount.toFixed(2) : '0.00'} Voucher
          </Text>
        </TouchableOpacity>

        {/* Balance After Purchase */}
        {isValidAmount && (
          <Text className="text-center text-sm text-gray-500 mt-3 mb-8">
            Balance after purchase: R{(balance - parsedAmount).toFixed(2)}
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
