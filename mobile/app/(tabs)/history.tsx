import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  TouchableWithoutFeedback,
  Modal,
  TextInput,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { mockTransactions, formatCurrency, formatDate } from '../../data/mockData';
import { useGuard } from '../../contexts/GuardContext';
import { getTransactions, Transaction } from '../../services/mobileApiService';

export default function HistoryScreen() {
  const { guard: authGuard, token, logoutWithMessage } = useAuth();
  const { guardData, isLoading: guardLoading } = useGuard();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('All Time');
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const periodOptions = [
    'Today',
    'Yesterday',
    'This Week',
    'This Month',
    'Last 7 Days',
    'Last 30 Days',
    'All Time'
  ];

  // Load transactions when guard data is available
  useEffect(() => {
    if (token && authGuard) {
      loadData();
    } else if (!token) {
      setError('Not authenticated. Please sign in again.');
      setLoading(false);
    }
  }, [token, authGuard]);

  const loadData = async () => {
    if (!token) {
      setError('Not authenticated. Please sign in again.');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      setLoading(true);

      const response = await getTransactions('', { limit: 100 }, token);

      if (!response.success) {
        const err = response.error || '';
        if (err.includes('Unauthorised') || err.includes('expired') || err.includes('invalid')) {
          await logoutWithMessage('Your session has expired. Please sign in again with a new access code from your manager.');
          return;
        }
        setError(err || 'Failed to load transactions');
        setLoading(false);
        return;
      }

      setTransactions(response.data?.transactions || []);
      console.log(`✅ Loaded ${response.data?.transactions?.length || 0} transactions`);
    } catch (err) {
      console.error('❌ Error loading data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data. Please check your connection.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [token]);

  // Helper function to check if a date falls within a specific period
  const isDateInPeriod = (dateString: string, period: string): boolean => {
    const transactionDate = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Handle custom date range
    if (period.startsWith('Custom:') && customStartDate && customEndDate) {
      const startDate = new Date(customStartDate);
      const endDate = new Date(customEndDate);
      endDate.setHours(23, 59, 59, 999); // Include the entire end date
      return transactionDate >= startDate && transactionDate <= endDate;
    }

    switch (period) {
      case 'Today':
        return transactionDate.toDateString() === today.toDateString();
      
      case 'Yesterday':
        return transactionDate.toDateString() === yesterday.toDateString();
      
      case 'This Week':
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        return transactionDate >= startOfWeek && transactionDate <= today;
      
      case 'This Month':
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        return transactionDate >= startOfMonth && transactionDate <= today;
      
      case 'Last 7 Days':
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);
        return transactionDate >= sevenDaysAgo && transactionDate <= today;
      
      case 'Last 30 Days':
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        return transactionDate >= thirtyDaysAgo && transactionDate <= today;
      
      case 'All Time':
      default:
        return true;
    }
  };

  // Apply filters
  const filteredTransactions = transactions.filter((tx) => {
    // Period filter
    if (!isDateInPeriod(tx.date, selectedPeriod)) {
      return false;
    }

    // Type filter
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'income') return ['TIP'].includes(tx.type.toUpperCase());
    if (selectedFilter === 'expenses') return ['PAYOUT', 'AIRTIME', 'ELECTRICITY', 'VOUCHER'].includes(tx.type.toUpperCase());

    return true;
  });

  // Calculate summary stats for filtered transactions
  const income = filteredTransactions
    .filter(tx => ['TIP'].includes(tx.type.toUpperCase()))
    .reduce((sum, tx) => sum + tx.amount, 0);

  const expenses = filteredTransactions
    .filter(tx => ['PAYOUT', 'AIRTIME', 'ELECTRICITY', 'VOUCHER'].includes(tx.type.toUpperCase()))
    .reduce((sum, tx) => sum + tx.amount, 0);
  
  const netAmount = income - expenses;

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handler for applying custom date range
  const handleApplyCustomRange = () => {
    if (!customStartDate || !customEndDate) {
      Alert.alert('Invalid Date Range', 'Please select both start and end dates.');
      return;
    }

    const startDate = new Date(customStartDate);
    const endDate = new Date(customEndDate);

    if (startDate > endDate) {
      Alert.alert('Invalid Date Range', 'Start date must be before end date.');
      return;
    }

    const customPeriodLabel = `Custom: ${formatDate(customStartDate)} - ${formatDate(customEndDate)}`;
    setSelectedPeriod(customPeriodLabel);
    setCurrentPage(1);
    setShowCustomModal(false);
  };

  // Helper to format date for input (YYYY-MM-DD format)
  const formatDateForInput = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  // Helper to validate date format
  const isValidDate = (dateString: string): boolean => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  };

  const getTransactionIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'TIP':
        return { name: 'cash', color: '#10B981' };
      case 'PAYOUT':
        return { name: 'wallet', color: '#B01519' };
      case 'AIRTIME':
        return { name: 'phone-portrait', color: '#5B94D3' };
      case 'ELECTRICITY':
        return { name: 'flash', color: '#F59E0B' };
      default:
        return { name: 'swap-horizontal', color: '#5B94D3' };
    }
  };

  const renderTransaction = ({ item }: any) => {
    const icon = getTransactionIcon(item.type);
    const hasCommission = item.metadata?.commissionAmount && item.metadata.commissionAmount > 0;

    return (
      <TouchableOpacity className="bg-white border-b border-gray-100 px-4 py-3">
        <View className="flex-row items-center">
          <View className={`w-8 h-8 rounded-full items-center justify-center mr-3`}
            style={{ backgroundColor: `${icon.color}20` }}>
            <Ionicons name={icon.name as any} size={16} color={icon.color} />
          </View>

          <View className="flex-1">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1 gap-2 mr-2">
                <Text className="text-sm font-semibold text-gray-900 flex-shrink">
                  {item.description || (item.type === 'TIP' ? 'Tip received' : item.type)}
                </Text>
                {item.isAutomatic && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, gap: 3 }}>
                    <Ionicons name="flash" size={10} color="#059669" />
                    <Text style={{ fontSize: 10, fontWeight: '700', fontFamily: 'Nunito-Bold', color: '#059669' }}>Auto</Text>
                  </View>
                )}
              </View>
              <Text
                className="text-sm font-bold"
                style={{ color: item.amount > 0 ? '#10B981' : '#B01519' }}
              >
                {item.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(item.amount))}
              </Text>
            </View>
            <View className="flex-row items-center justify-between mt-1">
              <Text className="text-xs text-gray-500">
                {formatDate(item.date)} at {item.time}
              </Text>
              <Text className="text-xs text-gray-500">
                Balance: {formatCurrency(item.balance)}
              </Text>
            </View>
            {item.reference && (
              <Text className="text-xs text-gray-400 mt-1">
                Ref: {item.reference}
              </Text>
            )}

            {/* Commission Breakdown */}
            {hasCommission && (
              <View className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-100">
                <View className="flex-row items-center mb-1">
                  <View className="bg-blue-500 px-2 py-0.5 rounded">
                    <Text className="text-xs font-semibold text-white">
                      {item.metadata.commissionRate}% commission
                    </Text>
                  </View>
                </View>
                <Text className="text-xs text-blue-800">
                  Original: {formatCurrency(item.metadata.originalAmount)} |
                  Commission: -{formatCurrency(item.metadata.commissionAmount)} |
                  Received: {formatCurrency(item.metadata.guardReceivesAmount)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Quick month ranges (last 3 months)
  const quickMonths = Array.from({ length: 3 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const y = d.getFullYear();
    const m = d.getMonth();
    const label = d.toLocaleString('default', { month: 'long', year: 'numeric' });
    const start = `${y}-${String(m + 1).padStart(2, '0')}-01`;
    const end = new Date(y, m + 1, 0).toISOString().split('T')[0];
    return { label, start, end };
  });

  return (
    <TouchableWithoutFeedback onPress={() => setShowPeriodDropdown(false)}>
      <SafeAreaView style={hStyles.container} edges={['top', 'left', 'right']}>

        {/* ── Gradient header with summary ── */}
        <LinearGradient colors={['#5B94D3', '#11468F']} style={hStyles.header}>
          <Text style={hStyles.headerTitle}>History</Text>
          <Text style={hStyles.headerSub}>Your transaction overview</Text>

          <View style={hStyles.summaryRow}>
            <View style={hStyles.summaryCard}>
              <View style={hStyles.summaryIconRow}>
                <Ionicons name="arrow-down-circle-outline" size={14} color="#6EE7B7" />
                <Text style={hStyles.summaryLabel}>Income</Text>
              </View>
              <Text style={[hStyles.summaryAmount, { color: '#6EE7B7' }]}>{formatCurrency(income)}</Text>
            </View>

            <View style={hStyles.summaryDivider} />

            <View style={hStyles.summaryCard}>
              <View style={hStyles.summaryIconRow}>
                <Ionicons name="arrow-up-circle-outline" size={14} color="#FCA5A5" />
                <Text style={hStyles.summaryLabel}>Expenses</Text>
              </View>
              <Text style={[hStyles.summaryAmount, { color: '#FCA5A5' }]}>{formatCurrency(expenses)}</Text>
            </View>

            <View style={hStyles.summaryDivider} />

            <View style={hStyles.summaryCard}>
              <View style={hStyles.summaryIconRow}>
                <Ionicons name={netAmount >= 0 ? 'trending-up-outline' : 'trending-down-outline'} size={14} color="#E0F2FE" />
                <Text style={hStyles.summaryLabel}>Net</Text>
              </View>
              <Text style={[hStyles.summaryAmount, { color: '#E0F2FE' }]}>{formatCurrency(Math.abs(netAmount))}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* ── Filter bar ── */}
        <View style={hStyles.filterBar}>
          {/* Period picker */}
          <View style={{ position: 'relative', flex: 1, marginRight: 10 }}>
            <TouchableOpacity
              style={hStyles.periodBtn}
              onPress={() => setShowPeriodDropdown(!showPeriodDropdown)}
              activeOpacity={0.7}
            >
              <Ionicons name="calendar-outline" size={15} color="#5B94D3" />
              <Text style={hStyles.periodBtnText}>{selectedPeriod}</Text>
              <Ionicons name={showPeriodDropdown ? 'chevron-up' : 'chevron-down'} size={14} color="#9CA3AF" />
            </TouchableOpacity>

            {showPeriodDropdown && (
              <View style={hStyles.dropdown}>
                {periodOptions.map(p => (
                  <TouchableOpacity
                    key={p}
                    onPress={() => { setSelectedPeriod(p); setShowPeriodDropdown(false); setCurrentPage(1); }}
                    style={[hStyles.dropdownItem, p === selectedPeriod && hStyles.dropdownItemActive]}
                  >
                    <Text style={[hStyles.dropdownText, p === selectedPeriod && hStyles.dropdownTextActive]}>{p}</Text>
                    {p === selectedPeriod && <Ionicons name="checkmark" size={14} color="#5B94D3" />}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Custom range */}
          <TouchableOpacity style={hStyles.customBtn} onPress={() => setShowCustomModal(true)} activeOpacity={0.7}>
            <Ionicons name="options-outline" size={15} color="#5B94D3" />
            <Text style={hStyles.customBtnText}>Custom</Text>
          </TouchableOpacity>
        </View>

        {/* ── Type pills ── */}
        <View style={hStyles.pillRow}>
          {[{ key: 'all', label: 'All' }, { key: 'income', label: 'Income' }, { key: 'expenses', label: 'Expenses' }].map(f => {
            const active = selectedFilter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                onPress={() => { setSelectedFilter(f.key); setCurrentPage(1); }}
                style={[hStyles.pill, active && hStyles.pillActive]}
                activeOpacity={0.7}
              >
                <Text style={[hStyles.pillText, active && hStyles.pillTextActive]}>{f.label}</Text>
              </TouchableOpacity>
            );
          })}
          <Text style={hStyles.countText}>{filteredTransactions.length} txn{filteredTransactions.length !== 1 ? 's' : ''}</Text>
        </View>

        {/* ── List ── */}
        <FlatList
          data={paginatedTransactions}
          renderItem={renderTransaction}
          keyExtractor={item => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#5B94D3" />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            loading ? (
              <View style={hStyles.centeredState}>
                <ActivityIndicator size="large" color="#5B94D3" />
                <Text style={hStyles.stateText}>Loading transactions...</Text>
              </View>
            ) : error ? (
              <View style={hStyles.centeredState}>
                <View style={hStyles.stateIconBg}>
                  <Ionicons name="alert-circle-outline" size={32} color="#DC2626" />
                </View>
                <Text style={[hStyles.stateTitle, { color: '#DC2626' }]}>Unable to load</Text>
                <Text style={hStyles.stateText}>{error}</Text>
                <TouchableOpacity style={hStyles.retryBtn} onPress={loadData}>
                  <Text style={hStyles.retryText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={hStyles.centeredState}>
                <View style={hStyles.stateIconBg}>
                  <Ionicons name="receipt-outline" size={32} color="#9CA3AF" />
                </View>
                <Text style={hStyles.stateTitle}>No transactions</Text>
                <Text style={hStyles.stateText}>
                  No {selectedFilter !== 'all' ? selectedFilter : ''} transactions for {selectedPeriod}.
                </Text>
              </View>
            )
          }
        />

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <View style={hStyles.pagination}>
            <TouchableOpacity
              style={[hStyles.pageBtn, currentPage === 1 && hStyles.pageBtnDisabled]}
              onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              <Ionicons name="chevron-back" size={16} color={currentPage === 1 ? '#9CA3AF' : '#5B94D3'} />
            </TouchableOpacity>
            <Text style={hStyles.pageText}>Page {currentPage} of {totalPages}</Text>
            <TouchableOpacity
              style={[hStyles.pageBtn, currentPage === totalPages && hStyles.pageBtnDisabled]}
              onPress={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              <Ionicons name="chevron-forward" size={16} color={currentPage === totalPages ? '#9CA3AF' : '#5B94D3'} />
            </TouchableOpacity>
          </View>
        )}

        {/* ── Custom date range bottom sheet ── */}
        <Modal visible={showCustomModal} animationType="slide" transparent statusBarTranslucent onRequestClose={() => setShowCustomModal(false)}>
          <View style={hStyles.sheetBackdrop}>
            <View style={hStyles.sheet}>
              <View style={hStyles.sheetHandle} />
              <View style={hStyles.sheetHeader}>
                <Text style={hStyles.sheetTitle}>Custom Date Range</Text>
                <TouchableOpacity onPress={() => setShowCustomModal(false)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                  <Ionicons name="close-circle" size={26} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              <Text style={hStyles.inputLabel}>Start Date</Text>
              <TextInput
                style={hStyles.dateInput}
                value={customStartDate}
                onChangeText={setCustomStartDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />

              <Text style={hStyles.inputLabel}>End Date</Text>
              <TextInput
                style={hStyles.dateInput}
                value={customEndDate}
                onChangeText={setCustomEndDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />

              <Text style={[hStyles.inputLabel, { marginTop: 16 }]}>Quick Select</Text>
              <View style={hStyles.quickRow}>
                {quickMonths.map(m => (
                  <TouchableOpacity
                    key={m.label}
                    style={hStyles.quickChip}
                    onPress={() => { setCustomStartDate(m.start); setCustomEndDate(m.end); }}
                    activeOpacity={0.7}
                  >
                    <Text style={hStyles.quickChipText}>{m.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={hStyles.sheetActions}>
                <TouchableOpacity
                  style={hStyles.cancelBtn}
                  onPress={() => { setCustomStartDate(''); setCustomEndDate(''); setShowCustomModal(false); }}
                >
                  <Text style={hStyles.cancelText}>Clear</Text>
                </TouchableOpacity>
                <TouchableOpacity style={hStyles.applyBtn} onPress={handleApplyCustomRange}>
                  <Text style={hStyles.applyText}>Apply</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const hStyles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#F9FAFB' },

  // Header
  header:       { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 28 },
  headerTitle:  { fontSize: 26, fontWeight: '800', fontFamily: 'Nunito-Bold', color: '#fff', marginBottom: 2 },
  headerSub:    { fontSize: 13, fontFamily: 'Nunito-Regular', color: 'rgba(255,255,255,0.7)', marginBottom: 20 },

  summaryRow:   { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 16, padding: 16 },
  summaryCard:  { flex: 1, alignItems: 'center' },
  summaryIconRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  summaryLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '500', fontFamily: 'Nunito-Medium' },
  summaryAmount:{ fontSize: 17, fontWeight: '800', fontFamily: 'Nunito-Bold' },
  summaryDivider:{ width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 8 },

  // Filter bar
  filterBar:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  periodBtn:    { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EFF6FF', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 },
  periodBtnText:{ fontSize: 13, color: '#1D4ED8', fontWeight: '600', fontFamily: 'Nunito-SemiBold', flex: 1 },
  customBtn:    { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#EFF6FF', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 },
  customBtnText:{ fontSize: 13, color: '#1D4ED8', fontWeight: '600', fontFamily: 'Nunito-SemiBold' },

  dropdown:     { position: 'absolute', top: 44, left: 0, right: 0, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', zIndex: 50, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 8 },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  dropdownItemActive: { backgroundColor: '#EFF6FF' },
  dropdownText: { fontSize: 14, fontFamily: 'Nunito-Regular', color: '#374151' },
  dropdownTextActive: { color: '#5B94D3', fontWeight: '600', fontFamily: 'Nunito-SemiBold' },

  // Pills
  pillRow:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  pill:         { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, backgroundColor: '#F3F4F6' },
  pillActive:   { backgroundColor: '#5B94D3' },
  pillText:     { fontSize: 13, fontWeight: '600', fontFamily: 'Nunito-SemiBold', color: '#6B7280' },
  pillTextActive:{ color: '#fff' },
  countText:    { marginLeft: 'auto' as any, fontSize: 12, fontFamily: 'Nunito-Regular', color: '#9CA3AF' },

  // Empty / error states
  centeredState:{ alignItems: 'center', justifyContent: 'center', paddingVertical: 64, paddingHorizontal: 32 },
  stateIconBg:  { width: 64, height: 64, borderRadius: 32, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  stateTitle:   { fontSize: 16, fontWeight: '700', fontFamily: 'Nunito-Bold', color: '#374151', marginBottom: 6 },
  stateText:    { fontSize: 13, fontFamily: 'Nunito-Regular', color: '#9CA3AF', textAlign: 'center', lineHeight: 20 },
  retryBtn:     { marginTop: 16, backgroundColor: '#5B94D3', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 10 },
  retryText:    { color: '#fff', fontWeight: '600', fontFamily: 'Nunito-SemiBold', fontSize: 14 },

  // Pagination
  pagination:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  pageBtn:      { width: 36, height: 36, borderRadius: 18, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  pageBtnDisabled: { backgroundColor: '#F3F4F6' },
  pageText:     { fontSize: 13, color: '#6B7280', fontWeight: '500', fontFamily: 'Nunito-Medium' },

  // Bottom sheet
  sheetBackdrop:{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet:        { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  sheetHandle:  { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  sheetTitle:   { fontSize: 18, fontWeight: '700', fontFamily: 'Nunito-Bold', color: '#111827' },
  inputLabel:   { fontSize: 13, fontWeight: '600', fontFamily: 'Nunito-SemiBold', color: '#374151', marginBottom: 8 },
  dateInput:    { backgroundColor: '#F9FAFB', borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E7EB', paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, fontFamily: 'Nunito-Regular', color: '#111827', marginBottom: 16 },
  quickRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  quickChip:    { backgroundColor: '#EFF6FF', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  quickChipText:{ fontSize: 13, color: '#1D4ED8', fontWeight: '500', fontFamily: 'Nunito-Medium' },
  sheetActions: { flexDirection: 'row', gap: 12 },
  cancelBtn:    { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  cancelText:   { color: '#6B7280', fontWeight: '600', fontFamily: 'Nunito-SemiBold', fontSize: 15 },
  applyBtn:     { flex: 1, backgroundColor: '#5B94D3', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  applyText:    { color: '#fff', fontWeight: '700', fontFamily: 'Nunito-Bold', fontSize: 15 },
});