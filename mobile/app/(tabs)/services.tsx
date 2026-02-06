import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@clerk/clerk-expo';
import { useGuard } from '../../contexts/GuardContext';
import AirtimePurchaseModal from '../../components/purchases/AirtimePurchaseModal';
import ElectricityPurchaseModal from '../../components/purchases/ElectricityPurchaseModal';
import VoucherPurchaseModal from '../../components/purchases/VoucherPurchaseModal';

type ServiceType = 'airtime' | 'electricity' | 'voucher' | null;

const services = [
  {
    id: 'airtime' as const,
    title: 'Buy Airtime',
    description: 'Purchase airtime for any SA network',
    icon: 'phone-portrait-outline' as const,
    color: '#5B94D3',
    bgColor: '#DBEAFE',
  },
  {
    id: 'electricity' as const,
    title: 'Buy Electricity',
    description: 'Purchase prepaid electricity tokens',
    icon: 'flash-outline' as const,
    color: '#F59E0B',
    bgColor: '#FEF3C7',
  },
  {
    id: 'voucher' as const,
    title: 'Cash Voucher',
    description: 'Get a PIN to collect cash at stores',
    icon: 'cash-outline' as const,
    color: '#10B981',
    bgColor: '#D1FAE5',
  },
];

export default function ServicesScreen() {
  const { user } = useUser();
  const { guard, refreshGuard } = useGuard();
  const [activeModal, setActiveModal] = useState<ServiceType>(null);

  const handleServicePress = (serviceId: ServiceType) => {
    setActiveModal(serviceId);
  };

  const handleCloseModal = () => {
    setActiveModal(null);
  };

  const handlePurchaseSuccess = (newBalance: number) => {
    // Refresh guard data to update balance
    if (user?.id) {
      refreshGuard();
    }
    setActiveModal(null);
  };

  const formatCurrency = (amount: number) => {
    return `R${amount.toFixed(2)}`;
  };

  const getStatusBarHeight = () => {
    if (Platform.OS === 'ios') {
      return StatusBar.currentHeight || 44;
    }
    return StatusBar.currentHeight || 24;
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { paddingTop: Platform.OS === 'ios' ? getStatusBarHeight() : 0 }
      ]}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: Platform.OS === 'ios' ? 120 : 100,
          flexGrow: 1,
        }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Services</Text>
          <Text style={styles.headerSubtitle}>
            Use your balance to purchase services
          </Text>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceContent}>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <Text style={styles.balanceAmount}>
              {formatCurrency(guard?.balance || 0)}
            </Text>
          </View>
          <Ionicons name="wallet" size={32} color="#5B94D3" />
        </View>

        {/* Services Grid */}
        <View style={styles.servicesGrid}>
          {services.map((service) => (
            <TouchableOpacity
              key={service.id}
              style={styles.serviceCard}
              onPress={() => handleServicePress(service.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.serviceIconContainer, { backgroundColor: service.bgColor }]}>
                <Ionicons name={service.icon} size={28} color={service.color} />
              </View>
              <View style={styles.serviceTextContainer}>
                <Text style={styles.serviceTitle}>{service.title}</Text>
                <Text style={styles.serviceDescription}>{service.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Ionicons name="information-circle-outline" size={20} color="#6B7280" />
          <Text style={styles.infoText}>
            All purchases are deducted from your balance. Make sure you have sufficient funds before making a purchase.
          </Text>
        </View>
      </ScrollView>

      {/* Modals */}
      <AirtimePurchaseModal
        visible={activeModal === 'airtime'}
        onClose={handleCloseModal}
        onSuccess={handlePurchaseSuccess}
        balance={guard?.balance || 0}
        clerkUserId={user?.id || ''}
      />

      <ElectricityPurchaseModal
        visible={activeModal === 'electricity'}
        onClose={handleCloseModal}
        onSuccess={handlePurchaseSuccess}
        balance={guard?.balance || 0}
        clerkUserId={user?.id || ''}
      />

      <VoucherPurchaseModal
        visible={activeModal === 'voucher'}
        onClose={handleCloseModal}
        onSuccess={handlePurchaseSuccess}
        balance={guard?.balance || 0}
        clerkUserId={user?.id || ''}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  balanceCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  balanceContent: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
  },
  servicesGrid: {
    paddingHorizontal: 16,
    gap: 12,
  },
  serviceCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    marginBottom: 12,
  },
  serviceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  serviceTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  serviceTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F9FAFB',
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
});
