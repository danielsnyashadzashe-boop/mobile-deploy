import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
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
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from '@clerk/clerk-expo';
import { useGuard } from '../contexts/GuardContext';
import { SANDBOX_TEST_DATA, IS_SANDBOX_MODE } from '../src/config/api';
import { isValidMeterNumber, lookupMeter, purchaseElectricity } from '../src/services/flashApi';
import { ConfirmationModal } from '../components/ConfirmationModal';

interface SavedMeter {
  meterNumber: string;
  label: string;
  customerName?: string;
}

interface MeterDetails {
  CustomerName: string;
  Address: string;
  MeterNumber: string;
  CanVend: boolean;
  MunicipalityCode?: string;
}

const ELECTRICITY_AMOUNTS = [50, 100, 200, 300, 500, 1000];
const SAVED_METERS_KEY = '@saved_meters';
const MIN_AMOUNT = 5;
const MAX_AMOUNT = 5000;

export default function ElectricityPurchaseScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { guardData, updateBalance } = useGuard();
  const clerkUserId = user?.id;

  const [meterNumber, setMeterNumber] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [customAmount, setCustomAmount] = useState('');
  const [lookingUp, setLookingUp] = useState(false);
  const [meterDetails, setMeterDetails] = useState<MeterDetails | null>(null);
  const [savedMeters, setSavedMeters] = useState<SavedMeter[]>([]);
  const [meterLabel, setMeterLabel] = useState('');
  const [showSaveOption, setShowSaveOption] = useState(false);
  const [purchaseResult, setPurchaseResult] = useState<{ token: string; units: string } | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  const balance = guardData?.balance || 0;

  useEffect(() => {
    loadSavedMeters();
  }, []);

  const loadSavedMeters = async () => {
    try {
      const stored = await AsyncStorage.getItem(SAVED_METERS_KEY);
      if (stored) {
        setSavedMeters(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load saved meters:', error);
    }
  };

  const saveMeter = async () => {
    if (!meterNumber || !meterLabel) return;

    const newMeter: SavedMeter = {
      meterNumber,
      label: meterLabel,
      customerName: meterDetails?.CustomerName,
    };

    const updated = [...savedMeters.filter(m => m.meterNumber !== meterNumber), newMeter];
    setSavedMeters(updated);
    await AsyncStorage.setItem(SAVED_METERS_KEY, JSON.stringify(updated));
    setShowSaveOption(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Meter Saved', 'Meter saved for quick access');
  };

  const selectSavedMeter = (meter: SavedMeter) => {
    setMeterNumber(meter.meterNumber);
    setMeterLabel(meter.label);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleLookup = async () => {
    if (!isValidMeterNumber(meterNumber)) {
      Alert.alert('Invalid Meter', 'Please enter an 11-digit meter number');
      return;
    }

    setLookingUp(true);
    setMeterDetails(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Use dual-mode lookupMeter function
      const result = await lookupMeter({
        meterNumber: meterNumber.replace(/\D/g, ''),
        amount: 100,
        clerkUserId: clerkUserId,
      });

      if (result.success && result.data) {
        setMeterDetails(result.data);
        setShowSaveOption(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        console.log(`✅ Meter lookup complete (${IS_SANDBOX_MODE ? 'SANDBOX' : 'PRODUCTION'} mode)`);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Lookup Failed', result.error || 'Could not find meter details');
      }
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to lookup meter. Please try again.');
    } finally {
      setLookingUp(false);
    }
  };

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
      isValidMeterNumber(meterNumber) &&
      meterDetails?.CanVend === true &&
      effectiveAmount >= MIN_AMOUNT &&
      effectiveAmount <= MAX_AMOUNT &&
      effectiveAmount <= balance
    );
  };

  const handlePurchase = async () => {
    console.log('🔴 handlePurchase called!');
    const effectiveAmount = getEffectiveAmount();
    console.log('Balance:', balance, 'Amount:', effectiveAmount, 'Meter:', meterNumber, 'Details:', meterDetails);

    // Debug: Show why purchase can't proceed
    if (!isValidMeterNumber(meterNumber)) {
      console.log('❌ Invalid meter');
      Alert.alert('Invalid Meter', 'Please enter a valid 11-digit meter number');
      return;
    }
    if (!meterDetails) {
      console.log('❌ No meter details');
      Alert.alert('Lookup Required', 'Please lookup the meter first');
      return;
    }
    if (!meterDetails.CanVend) {
      console.log('❌ Cannot vend');
      Alert.alert('Cannot Vend', 'This meter cannot be vended to');
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
    const effectiveAmount = getEffectiveAmount();

    setPurchasing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Use dual-mode purchaseElectricity function
      // In production: uses clerkUserId, deducts from guard balance
      // In sandbox: uses guardId, no balance deduction on backend
      const result = await purchaseElectricity({
        meterNumber: meterNumber.replace(/\D/g, ''),
        amount: effectiveAmount,
        municipalityCode: meterDetails?.MunicipalityCode,
        guardId: guardData?.guardId,
        clerkUserId: clerkUserId,
      });

      if (result.success && result.data) {
        // Update local balance
        // In production, use newBalance from response; in sandbox, calculate locally
        const newBalance = result.data.newBalance !== undefined
          ? result.data.newBalance
          : balance - effectiveAmount;
        await updateBalance(newBalance);

        // Show success with token
        setPurchaseResult({
          token: result.data.token || 'Token sent via SMS',
          units: result.data.units?.toString() || 'N/A',
        });

        setShowConfirmModal(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Electricity Purchased!', 'Token has been generated');

        // Log mode for debugging
        console.log(`✅ Electricity purchase complete (${IS_SANDBOX_MODE ? 'SANDBOX' : 'PRODUCTION'} mode)`);
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

  const copyToken = async () => {
    if (purchaseResult?.token) {
      await Clipboard.setStringAsync(purchaseResult.token);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Alert.alert('Copied!', 'Token copied to clipboard');
    }
  };

  // Success Screen
  if (purchaseResult) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
          <View className="items-center">
            <View className="w-20 h-20 bg-green-100 rounded-full items-center justify-center mb-4">
              <Ionicons name="checkmark-circle" size={48} color="#22c55e" />
            </View>
            <Text className="text-2xl font-bold text-gray-900 mb-2">Purchase Successful!</Text>
            <Text className="text-gray-600 text-center mb-6">Your electricity token is ready</Text>
          </View>

          <View className="bg-white rounded-2xl p-5 mb-4 border border-gray-200">
            <Text className="text-xs text-gray-500 uppercase tracking-wider mb-2">Electricity Token</Text>
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-bold text-gray-900 flex-1" style={{ fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}>
                {purchaseResult.token}
              </Text>
              <TouchableOpacity onPress={copyToken} className="p-2">
                <Ionicons name="copy-outline" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View className="h-px bg-gray-200 my-3" />

            <View className="flex-row justify-between">
              <Text className="text-sm text-gray-500">Units</Text>
              <Text className="text-sm font-semibold text-gray-900">{purchaseResult.units} kWh</Text>
            </View>
          </View>

          <View className="flex-row bg-blue-50 rounded-xl p-3 mb-6 border border-blue-200">
            <Ionicons name="information-circle" size={20} color="#2563eb" />
            <Text className="flex-1 ml-2 text-sm text-blue-800">
              Enter this token on your prepaid meter to load your electricity units.
            </Text>
          </View>

          <TouchableOpacity
            className="bg-amber-500 py-4 rounded-xl items-center"
            onPress={() => router.back()}
          >
            <Text className="text-white text-base font-semibold">Done</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          {/* Header */}
          <View className="flex-row items-center justify-between px-4 py-3">
            <TouchableOpacity onPress={() => router.back()} className="p-2">
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text className="text-lg font-semibold text-gray-900">Buy Electricity</Text>
            <View className="w-10" />
          </View>

          {/* Balance Card */}
          <View className="bg-amber-600 mx-4 my-3 p-5 rounded-xl items-center">
            <Text className="text-amber-100 text-sm">Available Balance</Text>
            <Text className="text-white text-3xl font-bold mt-1">R{balance.toFixed(2)}</Text>
          </View>

          {/* Saved Meters */}
          {savedMeters.length > 0 && (
            <>
              <Text className="text-sm font-semibold text-gray-600 mx-4 mt-4 mb-2">Saved Meters</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-3">
                {savedMeters.map((meter, index) => (
                  <TouchableOpacity
                    key={index}
                    className={`bg-white p-3 rounded-xl mr-2 items-center min-w-[100px] border ${
                      meterNumber === meter.meterNumber ? 'border-amber-500 bg-amber-50' : 'border-gray-200'
                    }`}
                    onPress={() => selectSavedMeter(meter)}
                  >
                    <Ionicons name="flash" size={20} color="#f59e0b" />
                    <Text className="text-xs font-semibold text-gray-900 mt-1">{meter.label}</Text>
                    <Text className="text-[10px] text-gray-500 mt-0.5">{meter.meterNumber}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}

          {/* Meter Number Input */}
          <Text className="text-sm font-semibold text-gray-600 mx-4 mt-4 mb-2">Meter Number</Text>
          <View className="flex-row mx-4">
            <TextInput
              className="flex-1 bg-white px-4 py-3.5 rounded-l-xl border border-gray-200 text-base"
              placeholder="Enter 11-digit meter number"
              placeholderTextColor="#999"
              keyboardType="number-pad"
              value={meterNumber}
              onChangeText={(text) => {
                setMeterNumber(text.replace(/\D/g, ''));
                setMeterDetails(null);
              }}
              maxLength={11}
            />
            <TouchableOpacity
              className={`px-5 rounded-r-xl justify-center ${
                lookingUp || !isValidMeterNumber(meterNumber) ? 'bg-gray-400' : 'bg-amber-600'
              }`}
              onPress={handleLookup}
              disabled={lookingUp || !isValidMeterNumber(meterNumber)}
            >
              {lookingUp ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className="text-white font-semibold">Lookup</Text>
              )}
            </TouchableOpacity>
          </View>
          {/* Sandbox Test Meters */}
          <View className="mx-4 mt-3 p-3 bg-orange-50 rounded-xl border border-orange-200">
            <Text className="text-xs font-semibold text-orange-800 mb-2">Sandbox Test Meters</Text>
            <View className="flex-row flex-wrap">
              {SANDBOX_TEST_DATA.METERS.map((test, index) => (
                <TouchableOpacity
                  key={index}
                  className="flex-row items-center bg-white px-2 py-1.5 rounded-lg mr-2 mb-2 border border-orange-200"
                  onPress={() => {
                    setMeterNumber(test.number);
                    setMeterDetails(null);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Text className="text-xs text-gray-700">{test.number}</Text>
                  <Text className="text-[10px] text-gray-500 ml-1">({test.provider})</Text>
                  <Text className="text-xs text-orange-600 font-semibold ml-2">Use</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Meter Details */}
          {meterDetails && (
            <View className="bg-white mx-4 mt-3 p-4 rounded-xl border border-gray-200">
              <View className="flex-row items-center mb-2">
                <Ionicons name="person-outline" size={18} color="#666" />
                <Text className="ml-2 text-sm text-gray-900">{meterDetails.CustomerName}</Text>
              </View>
              <View className="flex-row items-center mb-2">
                <Ionicons name="location-outline" size={18} color="#666" />
                <Text className="ml-2 text-sm text-gray-900">{meterDetails.Address}</Text>
              </View>
              {meterDetails.CanVend && (
                <View className="flex-row items-center bg-green-50 p-2 rounded-lg mt-2">
                  <Ionicons name="checkmark-circle" size={18} color="#22c55e" />
                  <Text className="ml-2 text-green-700 font-semibold">Ready to vend</Text>
                </View>
              )}

              {/* Save Meter Option */}
              {showSaveOption && (
                <View className="flex-row mt-3 pt-3 border-t border-gray-200">
                  <TextInput
                    className="flex-1 bg-gray-100 px-3 py-2 rounded-lg mr-2"
                    placeholder="Label (e.g., Home)"
                    value={meterLabel}
                    onChangeText={setMeterLabel}
                  />
                  <TouchableOpacity
                    className="flex-row items-center bg-gray-200 px-3 rounded-lg"
                    onPress={saveMeter}
                  >
                    <Ionicons name="bookmark-outline" size={18} color="#1a365d" />
                    <Text className="ml-1 text-blue-900 font-semibold">Save</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* Amount Selection */}
          <Text className="text-sm font-semibold text-gray-600 mx-4 mt-4 mb-2">Select Amount</Text>
          <View className="flex-row flex-wrap px-3">
            {ELECTRICITY_AMOUNTS.map((value) => {
              const isSelected = amount === value && !customAmount;
              const isDisabled = value > balance;
              return (
                <TouchableOpacity
                  key={value}
                  className={`w-[29%] m-[2%] py-3.5 rounded-xl items-center border ${
                    isSelected
                      ? 'bg-amber-500 border-amber-500'
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

          {/* Spacer for bottom button */}
          <View style={{ height: 80 }} />
        </ScrollView>

        {/* Fixed Purchase Button at Bottom */}
        <View style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#F8F9FA',
          paddingHorizontal: 16,
          paddingBottom: 16,
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
        }}>
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 16,
              borderRadius: 12,
              backgroundColor: canPurchase() ? '#F59E0B' : '#9CA3AF',
            }}
            onPress={() => {
              console.log('🟢 Button pressed!');
              handlePurchase();
            }}
            disabled={!canPurchase()}
          >
            <Ionicons name="flash" size={20} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 8 }}>
              Buy R{getEffectiveAmount()} Electricity
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Confirmation Modal */}
      <ConfirmationModal
        visible={showConfirmModal}
        title="Confirm Purchase"
        message={`Purchase electricity for meter ${meterNumber}?`}
        details={[
          { label: 'Customer', value: meterDetails?.CustomerName || '-' },
          { label: 'Meter Number', value: meterNumber },
          { label: 'Amount', value: `R${getEffectiveAmount().toFixed(2)}` },
        ]}
        icon="flash"
        iconColor="#F59E0B"
        confirmText="Buy Electricity"
        confirmColor="#F59E0B"
        loading={purchasing}
        onConfirm={executePurchase}
        onCancel={() => setShowConfirmModal(false)}
      />
    </SafeAreaView>
  );
}
