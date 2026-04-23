import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
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
  const { guard: authGuard } = useAuth();
  const { guardData, refreshGuardData } = useGuard();
  const [activeModal, setActiveModal] = useState<ServiceType>(null);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [comingSoonFeature, setComingSoonFeature] = useState('');

  const handleServicePress = (serviceId: ServiceType) => {
    const labels: Record<string, string> = {
      airtime: 'Airtime Purchase',
      electricity: 'Electricity Purchase',
      voucher: 'Cash Voucher',
    };
    if (serviceId && labels[serviceId]) {
      setComingSoonFeature(labels[serviceId]);
      setShowComingSoon(true);
    }
  };

  const handleCloseModal = () => {
    setActiveModal(null);
  };

  const handlePurchaseSuccess = (_newBalance: number) => {
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
              {formatCurrency(guardData?.balance || 0)}
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
        balance={guardData?.balance || 0}
        clerkUserId={authGuard?.guardId || ''}
      />

      <ElectricityPurchaseModal
        visible={activeModal === 'electricity'}
        onClose={handleCloseModal}
        onSuccess={handlePurchaseSuccess}
        balance={guardData?.balance || 0}
        clerkUserId={authGuard?.guardId || ''}
      />

      <VoucherPurchaseModal
        visible={activeModal === 'voucher'}
        onClose={handleCloseModal}
        onSuccess={handlePurchaseSuccess}
        balance={guardData?.balance || 0}
        clerkUserId={authGuard?.guardId || ''}
      />

      {/* Coming Soon Modal */}
      <Modal
        visible={showComingSoon}
        transparent
        animationType="fade"
        onRequestClose={() => setShowComingSoon(false)}
        statusBarTranslucent
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 28, width: '100%', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 10 }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Ionicons name="rocket-outline" size={32} color="#5B94D3" />
            </View>
            <Text style={{ fontSize: 20, fontWeight: '700', fontFamily: 'Nunito-Bold', color: '#111827', marginBottom: 8 }}>Coming Soon</Text>
            <Text style={{ fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 22, marginBottom: 8 }}>
              <Text style={{ fontWeight: '600', fontFamily: 'Nunito-SemiBold', color: '#374151' }}>{comingSoonFeature}</Text> is not yet available.
            </Text>
            <Text style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', lineHeight: 20, marginBottom: 24 }}>
              We're working on it and it will be available in a future update. Stay tuned!
            </Text>
            <TouchableOpacity
              onPress={() => setShowComingSoon(false)}
              style={{ backgroundColor: '#5B94D3', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 40 }}
              activeOpacity={0.8}
            >
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700', fontFamily: 'Nunito-Bold' }}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    fontFamily: 'Nunito-Bold',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Nunito-Regular',
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
    fontFamily: 'Nunito-Regular',
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '700',
    fontFamily: 'Nunito-Bold',
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
    fontFamily: 'Nunito-SemiBold',
    color: '#111827',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    fontFamily: 'Nunito-Regular',
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
    fontFamily: 'Nunito-Regular',
  },
});
