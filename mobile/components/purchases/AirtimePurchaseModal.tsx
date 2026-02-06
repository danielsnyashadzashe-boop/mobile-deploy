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
  Clipboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { purchaseAirtime, NETWORK_CODES } from '../../services/mobileApiService';

interface AirtimePurchaseModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (newBalance: number) => void;
  balance: number;
  clerkUserId: string;
}

const networks = [
  { id: 'MTN', name: 'MTN', code: NETWORK_CODES.MTN, color: '#FFCC00' },
  { id: 'VODACOM', name: 'Vodacom', code: NETWORK_CODES.VODACOM, color: '#E60000' },
  { id: 'CELL_C', name: 'Cell C', code: NETWORK_CODES.CELL_C, color: '#000000' },
  { id: 'TELKOM', name: 'Telkom', code: NETWORK_CODES.TELKOM, color: '#0066CC' },
];

const amounts = [5, 10, 20, 50, 100, 200];

export default function AirtimePurchaseModal({
  visible,
  onClose,
  onSuccess,
  balance,
  clerkUserId,
}: AirtimePurchaseModalProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);

  const formatPhoneNumber = (text: string) => {
    // Remove non-digits
    const cleaned = text.replace(/\D/g, '');
    // Format as 0XX XXX XXXX
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 10)}`;
  };

  const handlePhoneChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    setPhoneNumber(formatted);
  };

  const getAmount = () => {
    if (customAmount) return parseInt(customAmount, 10);
    return selectedAmount;
  };

  const isValid = () => {
    const amount = getAmount();
    const cleanPhone = phoneNumber.replace(/\s/g, '');
    return (
      selectedNetwork &&
      amount &&
      amount >= 5 &&
      amount <= 500 &&
      amount <= balance &&
      cleanPhone.length === 10
    );
  };

  const handlePurchase = async () => {
    const amount = getAmount();
    const network = networks.find(n => n.id === selectedNetwork);

    if (!amount || !network || !clerkUserId) return;

    setLoading(true);

    const response = await purchaseAirtime({
      clerkUserId,
      phoneNumber: phoneNumber.replace(/\s/g, ''),
      amount,
      productCode: network.code,
    });

    setLoading(false);

    if (response.success && response.data) {
      setSuccessData(response.data);
      setSuccess(true);
    } else {
      Alert.alert('Error', response.error || 'Failed to purchase airtime');
    }
  };

  const handleClose = () => {
    if (success && successData) {
      onSuccess(successData.newBalance);
    }
    // Reset state
    setPhoneNumber('');
    setSelectedNetwork(null);
    setSelectedAmount(null);
    setCustomAmount('');
    setSuccess(false);
    setSuccessData(null);
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
              <Text style={styles.successTitle}>Airtime Purchased!</Text>
              <Text style={styles.successMessage}>{successData.message}</Text>

              <View style={styles.successDetails}>
                <View style={styles.successRow}>
                  <Text style={styles.successLabel}>Amount</Text>
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
            <Text style={styles.title}>Buy Airtime</Text>
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

            {/* Phone Number */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="0XX XXX XXXX"
                value={phoneNumber}
                onChangeText={handlePhoneChange}
                keyboardType="phone-pad"
                maxLength={12}
              />
            </View>

            {/* Network Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select Network</Text>
              <View style={styles.networkGrid}>
                {networks.map((network) => (
                  <TouchableOpacity
                    key={network.id}
                    style={[
                      styles.networkButton,
                      selectedNetwork === network.id && styles.networkButtonSelected,
                    ]}
                    onPress={() => setSelectedNetwork(network.id)}
                  >
                    <View style={[styles.networkDot, { backgroundColor: network.color }]} />
                    <Text style={[
                      styles.networkName,
                      selectedNetwork === network.id && styles.networkNameSelected,
                    ]}>
                      {network.name}
                    </Text>
                  </TouchableOpacity>
                ))}
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
                placeholder="Enter amount (R5 - R500)"
                value={customAmount}
                onChangeText={(text) => {
                  setCustomAmount(text.replace(/\D/g, ''));
                  setSelectedAmount(null);
                }}
                keyboardType="number-pad"
              />
            </View>

            {/* Validation Message */}
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
                  <Ionicons name="phone-portrait" size={20} color="#FFFFFF" />
                  <Text style={styles.purchaseButtonText}>
                    Buy Airtime {getAmount() ? `- ${formatCurrency(getAmount()!)}` : ''}
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
  networkGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  networkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minWidth: '45%',
  },
  networkButtonSelected: {
    backgroundColor: '#EBF5FF',
    borderColor: '#5B94D3',
  },
  networkDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  networkName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  networkNameSelected: {
    color: '#5B94D3',
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
    backgroundColor: '#10B981',
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
