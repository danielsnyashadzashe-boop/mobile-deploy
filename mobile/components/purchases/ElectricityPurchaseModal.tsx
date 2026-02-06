import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { purchaseElectricity } from '../../services/mobileApiService';

interface ElectricityPurchaseModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (newBalance: number) => void;
  balance: number;
  clerkUserId: string;
}

const amounts = [50, 100, 200, 500, 1000];

export default function ElectricityPurchaseModal({
  visible,
  onClose,
  onSuccess,
  balance,
  clerkUserId,
}: ElectricityPurchaseModalProps) {
  const [meterNumber, setMeterNumber] = useState('');
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const getAmount = () => {
    if (customAmount) return parseInt(customAmount, 10);
    return selectedAmount;
  };

  const isValid = () => {
    const amount = getAmount();
    return (
      meterNumber.length >= 11 &&
      amount &&
      amount >= 20 &&
      amount <= 2000 &&
      amount <= balance
    );
  };

  const handlePurchase = async () => {
    const amount = getAmount();
    if (!amount || !clerkUserId) return;

    setLoading(true);

    const response = await purchaseElectricity({
      clerkUserId,
      meterNumber: meterNumber.trim(),
      amount,
    });

    setLoading(false);

    if (response.success && response.data) {
      setSuccessData(response.data);
      setSuccess(true);
    } else {
      Alert.alert('Error', response.error || 'Failed to purchase electricity');
    }
  };

  const handleCopyToken = async () => {
    if (successData?.token) {
      await Clipboard.setStringAsync(successData.token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    if (success && successData) {
      onSuccess(successData.newBalance);
    }
    // Reset state
    setMeterNumber('');
    setSelectedAmount(null);
    setCustomAmount('');
    setSuccess(false);
    setSuccessData(null);
    setCopied(false);
    onClose();
  };

  const formatCurrency = (amount: number) => `R${amount.toFixed(2)}`;

  if (success && successData) {
    return (
      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.successContainer}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark-circle" size={64} color="#10B981" />
              </View>
              <Text style={styles.successTitle}>Electricity Purchased!</Text>
              <Text style={styles.successMessage}>{successData.message}</Text>

              {/* Token Display - LARGE */}
              <View style={styles.tokenContainer}>
                <Text style={styles.tokenLabel}>Your Electricity Token</Text>
                <Text style={styles.tokenValue}>{successData.token}</Text>
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={handleCopyToken}
                >
                  <Ionicons
                    name={copied ? 'checkmark' : 'copy-outline'}
                    size={20}
                    color="#FFFFFF"
                  />
                  <Text style={styles.copyButtonText}>
                    {copied ? 'Copied!' : 'Copy Token'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.successDetails}>
                <View style={styles.successRow}>
                  <Text style={styles.successLabel}>Customer</Text>
                  <Text style={styles.successValue}>{successData.customerName}</Text>
                </View>
                <View style={styles.successRow}>
                  <Text style={styles.successLabel}>Meter Number</Text>
                  <Text style={styles.successValue}>{successData.meterNumber}</Text>
                </View>
                <View style={styles.successRow}>
                  <Text style={styles.successLabel}>Units</Text>
                  <Text style={styles.successValue}>{successData.units}</Text>
                </View>
                <View style={styles.successRow}>
                  <Text style={styles.successLabel}>Amount Paid</Text>
                  <Text style={styles.successValue}>{formatCurrency(successData.amount)}</Text>
                </View>
                <View style={styles.successRow}>
                  <Text style={styles.successLabel}>New Balance</Text>
                  <Text style={styles.successValue}>{formatCurrency(successData.newBalance)}</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.doneButton} onPress={handleClose}>
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Buy Electricity</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Balance */}
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Your Balance</Text>
              <Text style={styles.balanceAmount}>{formatCurrency(balance)}</Text>
            </View>

            {/* Meter Number */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Meter Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter meter number (11+ digits)"
                value={meterNumber}
                onChangeText={setMeterNumber}
                keyboardType="number-pad"
                maxLength={20}
              />
              <Text style={styles.helperText}>
                Enter the prepaid meter number on your electricity meter
              </Text>
            </View>

            {/* Amount Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select Amount</Text>
              <View style={styles.amountGrid}>
                {amounts.map((amount) => (
                  <TouchableOpacity
                    key={amount}
                    style={[
                      styles.amountButton,
                      selectedAmount === amount && !customAmount && styles.amountButtonSelected,
                      amount > balance && styles.amountButtonDisabled,
                    ]}
                    onPress={() => {
                      setSelectedAmount(amount);
                      setCustomAmount('');
                    }}
                    disabled={amount > balance}
                  >
                    <Text style={[
                      styles.amountText,
                      selectedAmount === amount && !customAmount && styles.amountTextSelected,
                      amount > balance && styles.amountTextDisabled,
                    ]}>
                      R{amount}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.orText}>Or enter custom amount</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter amount (R20 - R2000)"
                value={customAmount}
                onChangeText={(text) => {
                  setCustomAmount(text.replace(/\D/g, ''));
                  setSelectedAmount(null);
                }}
                keyboardType="number-pad"
              />
            </View>

            {/* Validation Messages */}
            {getAmount() && getAmount()! < 20 && (
              <Text style={styles.errorText}>Minimum amount is R20</Text>
            )}
            {getAmount() && getAmount()! > 2000 && (
              <Text style={styles.errorText}>Maximum amount is R2000</Text>
            )}
            {getAmount() && getAmount()! > balance && (
              <Text style={styles.errorText}>Insufficient balance</Text>
            )}
          </ScrollView>

          {/* Purchase Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.purchaseButton, !isValid() && styles.purchaseButtonDisabled]}
              onPress={handlePurchase}
              disabled={!isValid() || loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="flash" size={20} color="#FFFFFF" />
                  <Text style={styles.purchaseButtonText}>
                    Buy Electricity {getAmount() ? `- ${formatCurrency(getAmount()!)}` : ''}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  balanceCard: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111827',
  },
  helperText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
  },
  amountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  amountButton: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    minWidth: '30%',
    alignItems: 'center',
  },
  amountButtonSelected: {
    backgroundColor: '#5B94D3',
    borderColor: '#5B94D3',
  },
  amountButtonDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
    opacity: 0.5,
  },
  amountText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  amountTextSelected: {
    color: '#FFFFFF',
  },
  amountTextDisabled: {
    color: '#9CA3AF',
  },
  orText: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 14,
    marginVertical: 12,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  purchaseButton: {
    backgroundColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  purchaseButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  purchaseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  successContainer: {
    padding: 32,
    alignItems: 'center',
  },
  successIcon: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  tokenContainer: {
    width: '100%',
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  tokenLabel: {
    fontSize: 14,
    color: '#92400E',
    marginBottom: 8,
  },
  tokenValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#92400E',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 16,
  },
  copyButton: {
    backgroundColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 6,
  },
  copyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  successDetails: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  successRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  successLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  successValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  doneButton: {
    backgroundColor: '#5B94D3',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
