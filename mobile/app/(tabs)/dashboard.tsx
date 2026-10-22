import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
  Modal,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { formatCurrency } from '../../data/mockData';
import { TippaLogo } from '../../components/TippaLogo';
import { useAuth } from '../../contexts/AuthContext';
import { useGuard } from '../../contexts/GuardContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { getTransactions, getTipActivity, TipAttempt } from '../../services/mobileApiService';
import { QrCodesCard } from '../../components/QrCodesCard';
import { TipFeedRow } from '../../components/TipFeedRow';
import { buildTipFeed, localDay, tipLinkFor } from '../../src/lib/tips';

type AlertModalState = { visible: boolean; type: 'success' | 'error' | 'info'; title: string; message: string };

export default function DashboardScreen() {
  const router = useRouter();
  const { guard: authGuard, token, refreshGuard } = useAuth();
  const { guardData: rawGuardData, isLoading: guardLoading } = useGuard();
  const { unreadCount } = useNotifications();
  const guardData = rawGuardData ?? (authGuard ? {
    id: authGuard.guardId,
    guardId: authGuard.guardPublicId,
    name: authGuard.phone,
    surname: '',
    fullName: authGuard.phone,
    email: null,
    phone: authGuard.phone,
    balance: 0,
    totalEarnings: 0,
    status: 'ACTIVE',
    qrCode: null,
    qrCodeUrl: null,
    tipLink: null,
    location: null,
  } : null);

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [comingSoonFeature, setComingSoonFeature] = useState('');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [weekEarnings, setWeekEarnings] = useState(0);
  const [totalTips, setTotalTips] = useState(0);
  const [attempts, setAttempts] = useState<TipAttempt[]>([]);
  const [alertModal, setAlertModal] = useState<AlertModalState>({
    visible: false, type: 'info', title: '', message: '',
  });

  const showAlert = (type: AlertModalState['type'], title: string, message: string) =>
    setAlertModal({ visible: true, type, title, message });

  useEffect(() => {
    if (authGuard && token) {
      loadAdditionalData();
    } else if (!authGuard && !token) {
      setError('Guard profile not found. Please sign in again.');
      setLoading(false);
    }
  }, [authGuard, token]);

  const loadAdditionalData = async () => {
    if (!authGuard) return;
    try {
      setError(null);

      if (token) {
        const [txResponse, activity] = await Promise.all([
          getTransactions('', { limit: 100 }, token),
          getTipActivity(token, 30),
        ]);
        if (activity.success && activity.data) setAttempts(activity.data.attempts);
        if (txResponse.success && txResponse.data?.transactions) {
          const txList = txResponse.data.transactions;
          setTransactions(txList);

          // Only tips that were actually paid count. Failed, unconfirmed and pending
          // ones are listed in Tip activity but never added up as money.
          const paidTips = txList.filter((t: any) => t.type === 'TIP' && t.status === 'COMPLETED');
          const today = localDay();
          setTodayEarnings(paidTips.filter((t: any) => localDay(new Date(t.createdAt)) === today).reduce((sum: number, t: any) => sum + (t.amount || 0), 0));

          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          setWeekEarnings(paidTips.filter((t: any) => new Date(t.createdAt) >= weekAgo).reduce((sum: number, t: any) => sum + (t.amount || 0), 0));

          setTotalTips(paidTips.length);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data. Please check your connection.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshGuard();
      await loadAdditionalData();
    } finally {
      setRefreshing(false);
    }
  }, [authGuard, refreshGuard]);

  const handleQuickAction = (action: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (action === 'airtime') { setComingSoonFeature('Airtime Purchase'); setShowComingSoon(true); }
    if (action === 'electricity') { setComingSoonFeature('Electricity Purchase'); setShowComingSoon(true); }
  };

  const calculateInsAndOuts = () => {
    // Completed money only: a failed or unconfirmed tip never reached the balance.
    const done = transactions.filter(t => (t.status || 'COMPLETED') === 'COMPLETED');
    const income = done.filter(t => t.type === 'TIP').reduce((sum, t) => sum + (t.amount || 0), 0);
    const expenses = done.filter(t => t.type !== 'TIP').reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);
    return { income, expenses };
  };

  const { income, expenses } = calculateInsAndOuts();
  const maxAmount = Math.max(income, expenses, 1);
  const incomeWidth = maxAmount > 0 ? (income / maxAmount) * 100 : 0;
  const expenseWidth = maxAmount > 0 ? (expenses / maxAmount) * 100 : 0;

  const alertIcon = alertModal.type === 'success' ? 'checkmark-circle' : alertModal.type === 'error' ? 'alert-circle' : 'information-circle';
  const alertColor = alertModal.type === 'success' ? '#10B981' : alertModal.type === 'error' ? '#EF4444' : '#5B94D3';

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right']}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {/* Header with Logo */}
        <LinearGradient colors={['#5B94D3', '#11468F']} className="px-6 pt-4 pb-8">
          {/* Bell icon row */}
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 4 }}>
            <TouchableOpacity
              onPress={() => router.push('/notifications')}
              style={bellStyles.btn}
              activeOpacity={0.7}
            >
              <Ionicons name="notifications-outline" size={22} color="#fff" />
              {unreadCount > 0 && (
                <View style={bellStyles.badge}>
                  <Text style={bellStyles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View className="items-center mb-6">
            <TippaLogo size={160} />
          </View>
          <View className="items-center mb-6">
            <Text className="text-white/80 text-sm">Tippa Payment Solutions</Text>
            <Text className="text-white text-2xl font-bold">
              {guardData?.fullName || authGuard?.phone || 'Guard'}
            </Text>
          </View>

          {/* Your QR codes: the Tippa QR (new lanyard) and the Netcash QR (original lanyard) */}
          {(loading || guardLoading) ? (
            <View className="bg-white rounded-2xl p-6 shadow-md items-center">
              <View className="py-20 items-center">
                <ActivityIndicator size="large" color="#5B94D3" />
                <Text className="text-sm text-gray-500 mt-4">Loading your QR codes...</Text>
              </View>
            </View>
          ) : error ? (
            <View className="bg-white rounded-2xl p-6 shadow-md items-center">
              <View className="py-16 items-center">
                <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
                <Text className="text-red-600 font-semibold mt-4 text-center">Unable to load data</Text>
                <Text className="text-sm text-gray-500 mt-2 text-center px-8">{error}</Text>
                <TouchableOpacity
                  onPress={() => { setLoading(true); setError(null); loadAdditionalData(); }}
                  className="mt-4 bg-tippa-secondary px-6 py-2 rounded-lg"
                >
                  <Text className="text-white text-sm font-medium">Retry</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <QrCodesCard
              name={guardData?.fullName || authGuard?.phone || 'Guard'}
              guardId={guardData?.guardId || ''}
              siteName={guardData?.location?.name || null}
              status={guardData?.status}
              tipLink={tipLinkFor(guardData?.guardId, guardData?.tipLink)}
              netcashQrUrl={guardData?.qrCodeUrl || null}
              onOpenActivity={() => router.push('/tip-activity')}
              onMessage={(type, title, message) => showAlert(type, title, message)}
            />
          )}
        </LinearGradient>

        {/* Tip Stats Card */}
        <View className="px-6 mt-6">
          <View className="bg-blue-50 rounded-2xl p-4 shadow-sm border border-blue-100">
            <View className="flex-row items-center mb-3">
              <Ionicons name="stats-chart" size={20} color="#3B82F6" />
              <Text className="text-blue-900 font-semibold text-base ml-2">Your Tip Stats</Text>
            </View>
            <View className="flex-row justify-between">
              <View className="items-center flex-1">
                <Text className="text-2xl font-bold text-blue-700">{totalTips}</Text>
                <Text className="text-xs text-blue-500 mt-1">Total Tips</Text>
              </View>
              <View style={{ width: 1, backgroundColor: '#BFDBFE' }} />
              <View className="items-center flex-1">
                <Text className="text-2xl font-bold text-green-600">{formatCurrency(todayEarnings)}</Text>
                <Text className="text-xs text-blue-500 mt-1">Today</Text>
              </View>
              <View style={{ width: 1, backgroundColor: '#BFDBFE' }} />
              <View className="items-center flex-1">
                <Text className="text-2xl font-bold text-green-600">{formatCurrency(weekEarnings)}</Text>
                <Text className="text-xs text-blue-500 mt-1">This Week</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Recent tips from both lanyards, each explained */}
        <View className="px-6 mt-6">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-lg font-semibold text-gray-900">Recent tips</Text>
            <TouchableOpacity onPress={() => router.push('/tip-activity')}>
              <Text className="text-sm text-tippa-secondary">See all</Text>
            </TouchableOpacity>
          </View>
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 }}>
            {(() => {
              const recent = buildTipFeed(attempts, transactions).slice(0, 5);
              if (!recent.length) {
                return (
                  <View style={{ padding: 20, alignItems: 'center' }}>
                    <Ionicons name="qr-code-outline" size={26} color="#9CA3AF" />
                    <Text style={{ fontSize: 13, fontFamily: 'Nunito-SemiBold', color: '#374151', marginTop: 6 }}>No tips yet</Text>
                    <Text style={{ fontSize: 12, fontFamily: 'Nunito-Regular', color: '#9CA3AF', marginTop: 2, textAlign: 'center' }}>When customers scan your QR codes, their tips show up here.</Text>
                  </View>
                );
              }
              return recent.map(item => <TipFeedRow key={item.key} item={item} compact />);
            })()}
          </View>
        </View>

        {/* Balance Card */}
        <View className="px-6 mt-6">
          <View className="bg-white rounded-2xl p-4 shadow-lg">
            <View className="flex-row justify-between items-start">
              <View>
                <Text className="text-gray-600 text-sm mb-1">Available Balance</Text>
                <Text className="text-3xl font-bold text-gray-900">{formatCurrency(guardData?.balance || 0)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="px-6 mt-6">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</Text>
          <View className="flex-row flex-wrap justify-between">
            <TouchableOpacity onPress={() => router.push('/payouts')} className="bg-emerald-50 rounded-xl p-4 shadow-sm mb-4 border border-emerald-200" style={{ width: '48%' }}>
              <View className="bg-emerald-100 w-10 h-10 rounded-full items-center justify-center mb-2">
                <Ionicons name="arrow-up-circle-outline" size={20} color="#059669" />
              </View>
              <Text className="text-sm font-medium text-gray-900">Request Payout</Text>
              <Text className="text-xs text-gray-500">Bank transfer</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => handleQuickAction('airtime')} className="bg-white rounded-xl p-4 shadow-sm mb-4" style={{ width: '48%' }}>
              <View className="bg-blue-100 w-10 h-10 rounded-full items-center justify-center mb-2">
                <Ionicons name="phone-portrait-outline" size={20} color="#3B82F6" />
              </View>
              <Text className="text-sm font-medium text-gray-900">Buy Airtime</Text>
              <Text className="text-xs text-gray-500">Instant top-up</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => handleQuickAction('electricity')} className="bg-white rounded-xl p-4 shadow-sm mb-4" style={{ width: '48%' }}>
              <View className="bg-yellow-100 w-10 h-10 rounded-full items-center justify-center mb-2">
                <Ionicons name="flash-outline" size={20} color="#F59E0B" />
              </View>
              <Text className="text-sm font-medium text-gray-900">Buy Electricity</Text>
              <Text className="text-xs text-gray-500">Prepaid tokens</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/how-to-tip')} className="rounded-xl p-4 shadow-sm mb-4" style={{ width: '48%', backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE' }}>
              <View className="w-10 h-10 rounded-full items-center justify-center mb-2" style={{ backgroundColor: '#DBEAFE' }}>
                <Ionicons name="help-circle-outline" size={20} color="#3B82F6" />
              </View>
              <Text className="text-sm font-medium text-gray-900">How to Tip</Text>
              <Text className="text-xs text-gray-500">Show customer</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Money Flow Chart */}
        <View className="px-6 mt-6 mb-8">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-semibold text-gray-900">Money Flow</Text>
            <TouchableOpacity onPress={() => router.push('/history')}>
              <Text className="text-sm text-tippa-secondary">See all</Text>
            </TouchableOpacity>
          </View>
          <View className="bg-white rounded-xl shadow-sm p-6">
            <View className="mb-6">
              <View className="flex-row justify-between items-center mb-2">
                <View className="flex-row items-center">
                  <View className="w-3 h-3 rounded-full bg-tippa-success mr-2" />
                  <Text className="text-sm font-medium text-gray-700">Income</Text>
                </View>
                <Text className="text-base font-bold text-tippa-success">+{formatCurrency(income)}</Text>
              </View>
              <View className="h-8 bg-gray-100 rounded-lg overflow-hidden">
                <View className="h-full bg-tippa-success rounded-lg" style={{ width: `${incomeWidth}%` }} />
              </View>
            </View>
            <View>
              <View className="flex-row justify-between items-center mb-2">
                <View className="flex-row items-center">
                  <View className="w-3 h-3 rounded-full bg-tippa-danger mr-2" />
                  <Text className="text-sm font-medium text-gray-700">Expenses</Text>
                </View>
                <Text className="text-base font-bold text-tippa-danger">-{formatCurrency(expenses)}</Text>
              </View>
              <View className="h-8 bg-gray-100 rounded-lg overflow-hidden">
                <View className="h-full bg-tippa-danger rounded-lg" style={{ width: `${expenseWidth}%` }} />
              </View>
            </View>
            <View className="mt-6 pt-6 border-t border-gray-100">
              <View className="flex-row justify-between items-center">
                <Text className="text-sm font-medium text-gray-600">Net Flow</Text>
                <Text className="text-lg font-bold" style={{ color: income - expenses >= 0 ? '#10B981' : '#B01519' }}>
                  {income - expenses >= 0 ? '+' : ''}{formatCurrency(income - expenses)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Coming Soon Modal */}
      <Modal visible={showComingSoon} transparent animationType="fade" onRequestClose={() => setShowComingSoon(false)} statusBarTranslucent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 28, width: '100%', alignItems: 'center', elevation: 10 }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Ionicons name="rocket-outline" size={32} color="#5B94D3" />
            </View>
            <Text style={{ fontSize: 20, fontWeight: '700', fontFamily: 'Nunito-Bold', color: '#111827', marginBottom: 8 }}>Coming Soon</Text>
            <Text style={{ fontSize: 15, fontFamily: 'Nunito-Regular', color: '#6B7280', textAlign: 'center', lineHeight: 22, marginBottom: 24 }}>
              <Text style={{ fontWeight: '600', fontFamily: 'Nunito-SemiBold', color: '#374151' }}>{comingSoonFeature}</Text> is not yet available. We're working on it!
            </Text>
            <TouchableOpacity onPress={() => setShowComingSoon(false)} style={{ backgroundColor: '#5B94D3', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 40 }} activeOpacity={0.8}>
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700', fontFamily: 'Nunito-Bold' }}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Alert Modal */}
      <Modal visible={alertModal.visible} transparent animationType="fade" onRequestClose={() => setAlertModal(a => ({ ...a, visible: false }))} statusBarTranslucent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 28, width: '100%', alignItems: 'center', elevation: 10 }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: alertColor + '20', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Ionicons name={alertIcon as any} size={36} color={alertColor} />
            </View>
            <Text style={{ fontSize: 20, fontWeight: '700', fontFamily: 'Nunito-Bold', color: '#111827', marginBottom: 8 }}>{alertModal.title}</Text>
            <Text style={{ fontSize: 14, fontFamily: 'Nunito-Regular', color: '#6B7280', textAlign: 'center', lineHeight: 22, marginBottom: 24 }}>{alertModal.message}</Text>
            <TouchableOpacity onPress={() => setAlertModal(a => ({ ...a, visible: false }))} style={{ backgroundColor: alertColor, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 40 }} activeOpacity={0.8}>
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700', fontFamily: 'Nunito-Bold' }}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const bellStyles = StyleSheet.create({
  btn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
    fontFamily: 'Nunito-Bold',
  },
});
