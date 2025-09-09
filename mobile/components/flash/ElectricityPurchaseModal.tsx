/**
 * Flash API - Electricity Purchase Modal
 * Handles electricity purchases with meter lookup functionality
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Share,
  Clipboard,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useElectricity, useElectricityMeterLookup } from '../../services/flash/hooks/useElectricity';
import { useFlashAuth } from '../../services/flash/hooks/useFlashAuth';
import { 
  formatCurrency, 
  formatElectricityToken, 
  formatMeterNumber,
  generateReceiptText 
} from '../../services/flash/utils/formatters';
import { validateMeterNumber, validateAmount } from '../../services/flash/utils/validators';
import { mockCarGuard } from '../../data/mockData';

interface ElectricityPurchaseModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (transaction: any) => void;
}

export default function ElectricityPurchaseModal({ 
  visible, 
  onClose, 
  onSuccess 
}: ElectricityPurchaseModalProps) {
  // Form state
  const [meterNumber, setMeterNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  
  // UI state
  const [step, setStep] = useState<'input' | 'confirm' | 'success'>('input');
  const [purchaseResult, setPurchaseResult] = useState<any>(null);
  
  // Hooks
  const { isAuthenticated, initialize } = useFlashAuth();
  const { 
    municipalities,
    isLoadingMunicipalities,
    purchaseElectricity,
    isPurchasing,
    purchaseError,
    getBusinessRules,
    getQAMeterNumbers
  } = useElectricity();

  // Meter lookup hook - only run when meter number is valid
  const meterLookup = useElectricityMeterLookup(
    meterNumber.length >= 11 ? meterNumber : undefined,
    municipalities?.[0]?.Code // Use first municipality as default
  );

  // Business rules
  const businessRules = getBusinessRules();
  const suggestedAmounts = [20, 50, 100, 200, 300, 500, 1000, 2000];

  // Initialize Flash API on modal open
  useEffect(() => {
    if (visible && !isAuthenticated) {
      initialize();
    }
  }, [visible, isAuthenticated, initialize]);

  // Reset form when modal closes
  useEffect(() => {
    if (!visible) {
      setStep('input');
      setMeterNumber('');
      setAmount('');
      setReference('');
      setSelectedAmount(null);
      setPurchaseResult(null);
    }
  }, [visible]);

  // Handle meter number input
  const handleMeterNumberChange = (text: string) => {
    // Only allow digits and format with space
    const cleanNumber = text.replace(/\s/g, '').replace(/\D/g, '');
    if (cleanNumber.length <= 11) {
      setMeterNumber(cleanNumber);
    }
  };

  // Handle amount selection
  const handleAmountSelect = (selectedAmount: number) => {
    setSelectedAmount(selectedAmount);
    setAmount(selectedAmount.toString());
  };

  // Handle amount input
  const handleAmountInput = (text: string) => {
    // Only allow numbers and decimal point
    const cleanText = text.replace(/[^0-9.]/g, '');
    setAmount(cleanText);
    setSelectedAmount(null);
  };

  // Validate form
  const validateForm = () => {
    // Validate meter number
    const meterValidation = validateMeterNumber(meterNumber);
    if (!meterValidation.isValid) {
      Alert.alert('Invalid Meter Number', meterValidation.error);
      return false;
    }

    // Validate amount
    const numAmount = parseFloat(amount);
    const amountValidation = validateAmount(numAmount, 'electricity');
    if (!amountValidation.isValid) {
      Alert.alert('Invalid Amount', amountValidation.error);
      return false;
    }

    // Check user balance
    if (numAmount > mockCarGuard.balance) {
      Alert.alert('Insufficient Balance', 'You do not have enough balance for this transaction.');
      return false;
    }

    return true;
  };

  // Handle purchase confirmation
  const handleConfirmPurchase = () => {
    if (!validateForm()) return;

    // Check if meter lookup was successful
    if (meterLookup.data && !meterLookup.data.IsValid) {
      Alert.alert('Invalid Meter', 'This meter number is not valid or active.');
      return;
    }

    setStep('confirm');
  };

  // Handle purchase execution
  const handleExecutePurchase = () => {
    if (!municipalities?.[0]) {
      Alert.alert('Error', 'Municipality information not available');
      return;
    }

    purchaseElectricity({
      meterNumber: meterNumber,
      amount: parseFloat(amount),
      municipalityCode: municipalities[0].Code,
      reference: reference || undefined,
    }, {
      onSuccess: (data) => {
        setPurchaseResult(data);
        setStep('success');
        if (onSuccess) {
          onSuccess(data);
        }
      },
      onError: (error: any) => {
        console.error('Purchase failed:', error);
        Alert.alert('Purchase Failed', error.message || 'Failed to purchase electricity. Please try again.');
      },
    });
  };

  // Handle sharing receipt
  const handleShareReceipt = async () => {
    if (!purchaseResult) return;

    const receiptText = generateReceiptText({
      ...purchaseResult,
      guardName: mockCarGuard.name,
      location: mockCarGuard.location,
    });

    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      try {
        await Share.share({
          message: receiptText,
          title: 'Electricity Purchase Receipt',
        });
      } catch (error) {
        console.error('Share failed:', error);
      }
    }
  };

  // Handle copying token
  const handleCopyToken = async () => {
    if (!purchaseResult?.TokenValue) return;

    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Clipboard.setString(purchaseResult.TokenValue);
      Alert.alert('Copied', 'Electricity token copied to clipboard');
    }
  };

  // Render input step
  const renderInputStep = () => (
    <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-6">
        <Text className="text-xl font-bold text-gray-900">Buy Electricity</Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* QA Testing Helper */}
      <View className="bg-blue-50 rounded-lg p-4 mb-6">
        <View className="flex-row items-center mb-2">
          <Ionicons name="information-circle" size={20} color="#3B82F6" />
          <Text className="text-blue-800 font-medium ml-2">QA Testing</Text>
        </View>
        <Text className="text-blue-700 text-sm mb-2">
          Use these test meter numbers:
        </Text>
        <View className="flex-row flex-wrap">
          {getQAMeterNumbers().map((testMeter) => (
            <TouchableOpacity
              key={testMeter}
              onPress={() => setMeterNumber(testMeter)}
              className="bg-blue-100 rounded px-2 py-1 mr-2 mb-2"
            >
              <Text className="text-blue-800 text-xs">{formatMeterNumber(testMeter)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Meter Number Input */}
      <View className="mb-6">
        <Text className="text-sm font-medium text-gray-700 mb-2">
          Meter Number <Text className="text-red-500">*</Text>
        </Text>
        <View className="bg-gray-50 rounded-lg px-4 py-3 flex-row items-center">
          <Ionicons name="flash" size={20} color="#10B981" className="mr-3" />
          <TextInput
            value={formatMeterNumber(meterNumber)}
            onChangeText={handleMeterNumberChange}
            placeholder="Enter 11-digit meter number"
            keyboardType="numeric"
            maxLength={12} // 11 digits + 1 space
            className="flex-1 text-base"
          />
          {meterLookup.isLoading && (
            <ActivityIndicator size="small" color="#10B981" />
          )}
        </View>
        
        {/* Meter lookup result */}
        {meterLookup.data && (
          <View className={`mt-2 p-3 rounded-lg ${
            meterLookup.data.IsValid ? 'bg-green-50' : 'bg-red-50'
          }`}>
            <Text className={`font-medium ${
              meterLookup.data.IsValid ? 'text-green-800' : 'text-red-800'
            }`}>
              {meterLookup.data.IsValid ? '✓ Valid Meter' : '✗ Invalid Meter'}
            </Text>
            {meterLookup.data.IsValid && (
              <>
                <Text className="text-green-700 text-sm">
                  Customer: {meterLookup.data.CustomerName}
                </Text>
                <Text className="text-green-700 text-sm">
                  Address: {meterLookup.data.CustomerAddress}
                </Text>
              </>
            )}
          </View>
        )}
      </View>

      {/* Amount Selection */}
      <View className="mb-6">
        <Text className="text-sm font-medium text-gray-700 mb-3">
          Amount <Text className="text-red-500">*</Text>
        </Text>
        
        {/* Quick amount buttons */}
        <View className="flex-row flex-wrap mb-3">
          {suggestedAmounts.map((suggestedAmount) => (
            <TouchableOpacity
              key={suggestedAmount}
              onPress={() => handleAmountSelect(suggestedAmount)}
              className={`px-4 py-2 rounded-lg mr-2 mb-2 ${
                selectedAmount === suggestedAmount ? 'bg-tippa-500' : 'bg-gray-100'
              }`}
            >
              <Text className={`text-sm font-medium ${
                selectedAmount === suggestedAmount ? 'text-white' : 'text-gray-700'
              }`}>
                {formatCurrency(suggestedAmount)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Custom amount input */}
        <View className="bg-gray-50 rounded-lg px-4 py-3 flex-row items-center">
          <Text className="text-lg font-bold text-gray-700 mr-2">R</Text>
          <TextInput
            value={amount}
            onChangeText={handleAmountInput}
            placeholder="0.00"
            keyboardType="numeric"
            className="flex-1 text-lg"
          />
        </View>
        
        <View className="flex-row justify-between mt-2">
          <Text className="text-xs text-gray-500">
            Min: {formatCurrency(businessRules.minAmount)}
          </Text>
          <Text className="text-xs text-gray-500">
            Max: {formatCurrency(businessRules.maxAmount)}
          </Text>
        </View>
      </View>

      {/* Reference (Optional) */}
      <View className="mb-6">
        <Text className="text-sm font-medium text-gray-700 mb-2">
          Reference (Optional)
        </Text>
        <View className="bg-gray-50 rounded-lg px-4 py-3">
          <TextInput
            value={reference}
            onChangeText={setReference}
            placeholder="Personal reference"
            maxLength={50}
            className="text-base"
          />
        </View>
      </View>

      {/* Balance Info */}
      <View className="bg-green-50 rounded-lg p-4 mb-6">
        <Text className="text-green-800 font-medium mb-1">Available Balance</Text>
        <Text className="text-green-900 text-2xl font-bold">
          {formatCurrency(mockCarGuard.balance)}
        </Text>
      </View>

      {/* Continue Button */}
      <TouchableOpacity
        onPress={handleConfirmPurchase}
        disabled={!meterNumber || !amount || meterLookup.isLoading}
        className={`rounded-lg py-4 items-center ${
          meterNumber && amount && !meterLookup.isLoading
            ? 'bg-tippa-500' 
            : 'bg-gray-300'
        }`}
      >
        <Text className={`font-semibold text-base ${
          meterNumber && amount && !meterLookup.isLoading
            ? 'text-white' 
            : 'text-gray-500'
        }`}>
          Continue
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // Render confirmation step
  const renderConfirmStep = () => (
    <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
      <View className="flex-row justify-between items-center mb-6">
        <Text className="text-xl font-bold text-gray-900">Confirm Purchase</Text>
        <TouchableOpacity onPress={() => setStep('input')}>
          <Ionicons name="arrow-back" size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Purchase Details */}
      <View className="bg-white rounded-lg p-4 mb-6 border border-gray-200">
        <Text className="font-semibold text-gray-900 mb-4">Purchase Details</Text>
        
        <View className="space-y-3">
          <View className="flex-row justify-between">
            <Text className="text-gray-600">Meter Number</Text>
            <Text className="font-medium">{formatMeterNumber(meterNumber)}</Text>
          </View>
          
          {meterLookup.data && (
            <>
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Customer</Text>
                <Text className="font-medium">{meterLookup.data.CustomerName}</Text>
              </View>
              
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Municipality</Text>
                <Text className="font-medium">{meterLookup.data.MunicipalityName}</Text>
              </View>
            </>
          )}
          
          <View className="flex-row justify-between">
            <Text className="text-gray-600">Amount</Text>
            <Text className="font-bold text-lg text-tippa-600">
              {formatCurrency(parseFloat(amount))}
            </Text>
          </View>
          
          {reference && (
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Reference</Text>
              <Text className="font-medium">{reference}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Action Buttons */}
      <View className="flex-row space-x-3">
        <TouchableOpacity
          onPress={() => setStep('input')}
          className="flex-1 bg-gray-100 rounded-lg py-4 items-center"
        >
          <Text className="text-gray-700 font-semibold text-base">Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleExecutePurchase}
          disabled={isPurchasing}
          className="flex-1 bg-tippa-500 rounded-lg py-4 items-center flex-row justify-center"
        >
          {isPurchasing && (
            <ActivityIndicator size="small" color="white" className="mr-2" />
          )}
          <Text className="text-white font-semibold text-base">
            {isPurchasing ? 'Processing...' : 'Confirm Purchase'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  // Render success step
  const renderSuccessStep = () => (
    <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
      {/* Success Header */}
      <View className="items-center mb-6">
        <View className="w-16 h-16 bg-green-100 rounded-full items-center justify-center mb-4">
          <Ionicons name="checkmark-circle" size={40} color="#059669" />
        </View>
        <Text className="text-xl font-bold text-gray-900">Purchase Successful!</Text>
        <Text className="text-gray-600 text-center mt-2">
          Your electricity has been purchased successfully
        </Text>
      </View>

      {/* Token Display */}
      {purchaseResult?.TokenValue && (
        <View className="bg-tippa-50 rounded-lg p-6 mb-6 border-2 border-tippa-200">
          <Text className="text-tippa-800 font-semibold mb-2 text-center">
            ELECTRICITY TOKEN
          </Text>
          <TouchableOpacity 
            onPress={handleCopyToken}
            className="bg-white rounded-lg p-4 border border-tippa-300"
          >
            <Text className="text-2xl font-bold text-center text-tippa-900 tracking-wider">
              {formatElectricityToken(purchaseResult.TokenValue)}
            </Text>
            <Text className="text-tippa-600 text-xs text-center mt-2">
              Tap to copy
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Purchase Summary */}
      <View className="bg-white rounded-lg p-4 mb-6 border border-gray-200">
        <Text className="font-semibold text-gray-900 mb-4">Purchase Summary</Text>
        
        <View className="space-y-3">
          <View className="flex-row justify-between">
            <Text className="text-gray-600">Transaction ID</Text>
            <Text className="font-mono text-sm">{purchaseResult?.TransactionId}</Text>
          </View>
          
          <View className="flex-row justify-between">
            <Text className="text-gray-600">Units Issued</Text>
            <Text className="font-bold">{purchaseResult?.UnitsIssued} kWh</Text>
          </View>
          
          <View className="flex-row justify-between">
            <Text className="text-gray-600">Amount</Text>
            <Text className="font-bold">{formatCurrency(purchaseResult?.Amount || 0)}</Text>
          </View>
          
          <View className="flex-row justify-between">
            <Text className="text-gray-600">Customer</Text>
            <Text className="font-medium">{purchaseResult?.CustomerName}</Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View className="space-y-3">
        <TouchableOpacity
          onPress={handleShareReceipt}
          className="bg-tippa-500 rounded-lg py-4 flex-row items-center justify-center"
        >
          <Ionicons name="share" size={20} color="white" className="mr-2" />
          <Text className="text-white font-semibold text-base">Share Receipt</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            onClose();
          }}
          className="bg-gray-100 rounded-lg py-4 items-center"
        >
          <Text className="text-gray-700 font-semibold text-base">Done</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  // Don't render if not authenticated and not initializing
  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-white rounded-t-3xl p-6 pb-10 max-h-[90%]">
          {step === 'input' && renderInputStep()}
          {step === 'confirm' && renderConfirmStep()}
          {step === 'success' && renderSuccessStep()}
        </View>
      </View>
    </Modal>
  );
}