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
import { purchaseVoucher } from '../../services/mobileApiService';

interface VoucherPurchaseModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (newBalance: number) => void;
  balance: number;
  clerkUserId: string;
}

const amounts = [50, 100, 200, 500, 1000];

export default function VoucherPurchaseModal({
  visible,
  onClose,
  onSuccess,
  balance,
  clerkUserId,
}: VoucherPurchaseModalProps) {
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
      amount &&
      amount >= 10 &&
      amount <= 3000 &&
      amount <= balance
    );
  };

  const handlePurchase = async () => {
    const amount = getAmount();
    if (!amount || !clerkUserId) return;

    setLoading(true);

    const response = await purchaseVoucher({
      clerkUserId,
      amount,
    });

    setLoading(false);

    if (response.success && response.data) {
      setSuccessData(response.data);
      setSuccess(true);
    } else {
      Alert.alert('Error', response.error || 'Failed to purchase voucher');
    }
  };

  const handleCopyPin = async () => {
    if (successData?.voucherPin) {
      await Clipboard.setStringAsync(successData.voucherPin);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    if (success && successData) {
      onSuccess(successData.newBalance);
    }
    // Reset state
    setSelectedAmount(null);
    setCustomAmount('');
    setSuccess(false);
    setSuccessData(null);
    setCopied(false);
    onClose();
  };

  const formatCurrency = (amount: number) => `R${amount.toFixed(2)}`;

  const formatPin = (pin: string) => {
    // Format as XXXX XXXX XXXX XXXX
    return pin.replace(/(.{4})/g, '$1 ').trim();
  };

  if (success && successData) {
    return (
      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.successContainer}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark-circle" size={64} color="#10B981" />
              </View>
              <Text style={styles.successTitle}>Voucher Ready!</Text>
              <Text style={styles.successMessage}>
                Use this PIN to collect cash at Pick n Pay, Shoprite, Checkers, or any participating store.
              </Text>

              {/* PIN Display - LARGE */}
              <View style={styles.pinContainer}>
                <Text style={styles.pinLabel}>Your Voucher PIN</Text>
                <Text style={styles.pinValue}>{formatPin(successData.voucherPin)}</Text>
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={handleCopyPin}
                >
                  <Ionicons
                    name={copied ? 'checkmark' : 'copy-outline'}
                    size={20}
                    color="#FFFFFF"
                  />
                  <Text style={styles.copyButtonText}>
                    {copied ? 'Copied!' : 'Copy PIN'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.successDetails}>
                <View style={styles.successRow}>
                  <Text style={styles.successLabel}>Amount</Text>
                  <Text style={styles.successValue}>{formatCurrency(successData.amount)}</Text>
                </View>
                <View style={styles.successRow}>
                  <Text style={styles.successLabel}>Serial Number</Text>
                  <Text style={styles.successValue}>{successData.voucherSerial}</Text>
                </View>
                <View style={styles.successRow}>
                  <Text style={styles.successLabel}>Expiry Date</Text>
                  <Text style={styles.successValue}>{successData.expiryDate}</Text>
                </View>
                <View style={styles.successRow}>
                  <Text style={styles.successLabel}>New Balance</Text>
                  <Text style={styles.successValue}>{formatCurrency(successData.newBalance)}</Text>
                </View>
              </View>

              <View style={styles.warningBox}>
                <Ionicons name="warning-outline" size={20} color="#92400E" />
                <Text style={styles.warningText}>
                  Save this PIN! Once you close this screen, you won't be able to see it again.
                </Text>
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
            <Text style={styles.title}>Cash Voucher</Text>
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

            {/* Info Box */}
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={24} color="#3B82F6" />
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>How it works</Text>
                <Text style={styles.infoText}>
                  Get a 16-digit PIN that you can use to collect cash at Pick n Pay, Shoprite, Checkers, and other participating retailers.
                </Text>
              </View>
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
                placeholder="Enter amount (R10 - R3000)"
                value={customAmount}
                onChangeText={(text) => {
                  setCustomAmount(text.replace(/\D/g, ''));
                  setSelectedAmount(null);
                }}
                keyboardType="number-pad"
              />
            </View>

            {/* Validation Messages */}
            {getAmount() && getAmount()! < 10 && (
              <Text style={styles.errorText}>Minimum amount is R10</Text>
            )}
            {getAmount() && getAmount()! > 3000 && (
              <Text style={styles.errorText}>Maximum amount is R3000</Text>
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
                  <Ionicons name="cash" size={20} color="#FFFFFF" />
                  <Text style={styles.purchaseButtonText}>
                    Get Voucher {getAmount() ? `- ${formatCurrency(getAmount()!)}` : ''}
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
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#3B82F6',
    lineHeight: 18,
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
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111827',
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
    backgroundColor: '#3B82F6',
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
    lineHeight: 20,
  },
  pinContainer: {
    width: '100%',
    backgroundColor: '#DBEAFE',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  pinLabel: {
    fontSize: 14,
    color: '#1E40AF',
    marginBottom: 8,
  },
  pinValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E40AF',
    letterSpacing: 3,
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'monospace',
  },
  copyButton: {
    backgroundColor: '#3B82F6',
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
    marginBottom: 16,
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
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  warningText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
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
