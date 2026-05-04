import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  TouchableWithoutFeedback,
  Modal,
  ActivityIndicator,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Calendar, DateData } from 'react-native-calendars';
import { MotiView, MotiText } from 'moti';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency, formatDate } from '../../data/mockData';
import { useGuard } from '../../contexts/GuardContext';
import { getTransactions, Transaction } from '../../services/mobileApiService';

// ── Animated spinner ─────────────────────────────────────────────────────────
function Spinner() {
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', duration: 400 }}
      style={hStyles.spinnerWrap}
    >
      <Animated.View style={[hStyles.spinnerRing, { transform: [{ rotate }] }]} />
      <View style={hStyles.spinnerInner}>
        <Ionicons name="receipt-outline" size={24} color="#5B94D3" />
      </View>
      <MotiText
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: 'timing', duration: 600, delay: 200 }}
        style={hStyles.spinnerText}
      >
        Loading transactions...
      </MotiText>
    </MotiView>
  );
}

// ── Animated transaction row ──────────────────────────────────────────────────
function TxRow({ item, index }: { item: Transaction; index: number }) {
  const iconMap: Record<string, { name: string; color: string }> = {
    TIP:         { name: 'cash',            color: '#10B981' },
    PAYOUT:      { name: 'wallet',          color: '#B01519' },
    AIRTIME:     { name: 'phone-portrait',  color: '#5B94D3' },
    ELECTRICITY: { name: 'flash',           color: '#F59E0B' },
  };
  const icon = iconMap[item.type?.toUpperCase()] ?? { name: 'swap-horizontal', color: '#5B94D3' };
  const isIncome = item.amount > 0;
  const hasCommission = (item as any).metadata?.commissionAmount > 0;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 16 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', delay: index * 40, damping: 18 }}
      style={hStyles.txRow}
    >
      <View style={[hStyles.txIcon, { backgroundColor: icon.color + '20' }]}>
        <Ionicons name={icon.name as any} size={16} color={icon.color} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={hStyles.txTopRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 6 }}>
            <Text style={hStyles.txDesc} numberOfLines={1}>
              {(item as any).description || (item.type === 'TIP' ? 'Tip received' : item.type)}
            </Text>
            {(item as any).isAutomatic && (
              <View style={hStyles.autoBadge}>
                <Ionicons name="flash" size={9} color="#059669" />
                <Text style={hStyles.autoBadgeText}>Auto</Text>
              </View>
            )}
          </View>
          <Text style={[hStyles.txAmount, { color: isIncome ? '#10B981' : '#B01519' }]}>
            {isIncome ? '+' : ''}{formatCurrency(Math.abs(item.amount))}
          </Text>
        </View>
        <View style={hStyles.txBottomRow}>
          <Text style={hStyles.txMeta}>{formatDate(item.date)} · {item.time}</Text>
          <Text style={hStyles.txMeta}>Bal: {formatCurrency((item as any).balance)}</Text>
        </View>
        {(item as any).reference && (
          <Text style={hStyles.txRef}>Ref: {(item as any).reference}</Text>
        )}
        {hasCommission && (
          <View style={hStyles.commissionBadge}>
            <Text style={hStyles.commissionText}>
              {(item as any).metadata.commissionRate}% commission · received {formatCurrency((item as any).metadata.guardReceivesAmount)}
            </Text>
          </View>
        )}
      </View>
    </MotiView>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function HistoryScreen() {
  const { token, logoutWithMessage } = useAuth();
  const { } = useGuard();

  const [refreshing, setRefreshing]       = useState(false);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const [transactions, setTransactions]   = useState<Transaction[]>([]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('All Time');
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [currentPage, setCurrentPage]     = useState(1);
  const itemsPerPage = 10;
  const [showCalendar, setShowCalendar]   = useState(false);
  const [calendarStep, setCalendarStep]   = useState<'start' | 'end'>('start');
  const [markedDates, setMarkedDates]     = useState<Record<string, any>>({});
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate]     = useState('');

  const periodOptions = ['Today', 'Yesterday', 'This Week', 'This Month', 'Last 7 Days', 'Last 30 Days', 'All Time'];

  useEffect(() => {
    if (token) loadData();
    else { setError('Not authenticated. Please sign in again.'); setLoading(false); }
  }, [token]);

  const loadData = async () => {
    if (!token) return;
    try {
      setError(null);
      setLoading(true);
      const response = await getTransactions('', { limit: 100 }, token);
      if (!response.success) {
        const err = response.error || '';
        if (err.includes('Unauthorised') || err.includes('expired') || err.includes('invalid')) {
          await logoutWithMessage('Your session has expired. Please sign in again.');
          return;
        }
        setError(err || 'Failed to load transactions');
        return;
      }
      setTransactions(response.data?.transactions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [token]);

  // ── Calendar helpers ────────────────────────────────────────────────────────
  const onDayPress = (day: DateData) => {
    const d = day.dateString;
    if (calendarStep === 'start') {
      setCustomStartDate(d);
      setCustomEndDate('');
      setMarkedDates({ [d]: { startingDay: true, color: '#5B94D3', textColor: '#fff' } });
      setCalendarStep('end');
    } else {
      if (d < customStartDate) {
        // swap
        setCustomStartDate(d);
        setMarkedDates({ [d]: { startingDay: true, color: '#5B94D3', textColor: '#fff' } });
        setCalendarStep('end');
        return;
      }
      setCustomEndDate(d);
      // Fill range
      const marks: Record<string, any> = {};
      const cursor = new Date(customStartDate);
      const end = new Date(d);
      while (cursor <= end) {
        const key = cursor.toISOString().split('T')[0];
        const isStart = key === customStartDate;
        const isEnd = key === d;
        marks[key] = {
          ...(isStart ? { startingDay: true } : {}),
          ...(isEnd ? { endingDay: true } : {}),
          color: isStart || isEnd ? '#5B94D3' : '#BFDBFE',
          textColor: isStart || isEnd ? '#fff' : '#1D4ED8',
        };
        cursor.setDate(cursor.getDate() + 1);
      }
      setMarkedDates(marks);
      setCalendarStep('start');
    }
  };

  const applyCalendarRange = () => {
    if (!customStartDate || !customEndDate) return;
    const label = `${customStartDate} → ${customEndDate}`;
    setSelectedPeriod(`Custom: ${label}`);
    setCurrentPage(1);
    setShowCalendar(false);
  };

  const clearCalendar = () => {
    setCustomStartDate(''); setCustomEndDate('');
    setMarkedDates({}); setCalendarStep('start');
  };

  // ── Filtering ───────────────────────────────────────────────────────────────
  const isDateInPeriod = (dateString: string, period: string): boolean => {
    const txDate = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    if (period.startsWith('Custom:') && customStartDate && customEndDate) {
      const end = new Date(customEndDate); end.setHours(23, 59, 59, 999);
      return txDate >= new Date(customStartDate) && txDate <= end;
    }
    switch (period) {
      case 'Today':      return txDate.toDateString() === today.toDateString();
      case 'Yesterday':  return txDate.toDateString() === yesterday.toDateString();
      case 'This Week': { const s = new Date(today); s.setDate(today.getDate() - today.getDay()); return txDate >= s && txDate <= today; }
      case 'This Month':{ const s = new Date(today.getFullYear(), today.getMonth(), 1); return txDate >= s && txDate <= today; }
      case 'Last 7 Days':{ const s = new Date(today); s.setDate(today.getDate() - 7); return txDate >= s && txDate <= today; }
      case 'Last 30 Days':{ const s = new Date(today); s.setDate(today.getDate() - 30); return txDate >= s && txDate <= today; }
      default: return true;
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    if (!isDateInPeriod(tx.date, selectedPeriod)) return false;
    if (selectedFilter === 'income')   return ['TIP'].includes(tx.type.toUpperCase());
    if (selectedFilter === 'expenses') return ['PAYOUT', 'AIRTIME', 'ELECTRICITY', 'VOUCHER'].includes(tx.type.toUpperCase());
    return true;
  });

  const income   = filteredTransactions.filter(t => t.type.toUpperCase() === 'TIP').reduce((s, t) => s + t.amount, 0);
  const expenses = filteredTransactions.filter(t => ['PAYOUT','AIRTIME','ELECTRICITY','VOUCHER'].includes(t.type.toUpperCase())).reduce((s, t) => s + t.amount, 0);
  const netAmount = income - expenses;

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Quick month chips
  const quickMonths = Array.from({ length: 3 }, (_, i) => {
    const now = new Date();
    const month = now.getMonth() - i;
    const adjustedYear = now.getFullYear() + Math.floor(month / 12);
    const adjustedMonth = ((month % 12) + 12) % 12;
    const label = new Date(adjustedYear, adjustedMonth, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
    const start = `${adjustedYear}-${String(adjustedMonth + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(adjustedYear, adjustedMonth + 1, 0).getDate();
    const end = `${adjustedYear}-${String(adjustedMonth + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    return { label, start, end };
  });

  return (
    <TouchableWithoutFeedback onPress={() => setShowPeriodDropdown(false)}>
      <SafeAreaView style={hStyles.container} edges={['top', 'left', 'right']}>

        {/* ── Gradient header ── */}
        <LinearGradient colors={['#5B94D3', '#11468F']} style={hStyles.header}>
          <Text style={hStyles.headerTitle}>History</Text>
          <Text style={hStyles.headerSub}>Your transaction overview</Text>
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', delay: 100 }}
            style={hStyles.summaryRow}
          >
            {[
              { label: 'Income',   amount: income,            color: '#6EE7B7', icon: 'arrow-down-circle-outline' },
              { label: 'Expenses', amount: expenses,          color: '#FCA5A5', icon: 'arrow-up-circle-outline' },
              { label: 'Net',      amount: Math.abs(netAmount), color: '#E0F2FE', icon: netAmount >= 0 ? 'trending-up-outline' : 'trending-down-outline' },
            ].map((s, i) => (
              <React.Fragment key={s.label}>
                {i > 0 && <View style={hStyles.summaryDivider} />}
                <View style={hStyles.summaryCard}>
                  <View style={hStyles.summaryIconRow}>
                    <Ionicons name={s.icon as any} size={13} color={s.color} />
                    <Text style={hStyles.summaryLabel}>{s.label}</Text>
                  </View>
                  <Text style={[hStyles.summaryAmount, { color: s.color }]}>{formatCurrency(s.amount)}</Text>
                </View>
              </React.Fragment>
            ))}
          </MotiView>
        </LinearGradient>

        {/* ── Filter bar ── */}
        <View style={hStyles.filterBar}>
          <View style={{ position: 'relative', flex: 1, marginRight: 10 }}>
            <TouchableOpacity style={hStyles.periodBtn} onPress={() => setShowPeriodDropdown(!showPeriodDropdown)} activeOpacity={0.7}>
              <Ionicons name="calendar-outline" size={15} color="#5B94D3" />
              <Text style={hStyles.periodBtnText} numberOfLines={1}>{selectedPeriod}</Text>
              <Ionicons name={showPeriodDropdown ? 'chevron-up' : 'chevron-down'} size={14} color="#9CA3AF" />
            </TouchableOpacity>
            {showPeriodDropdown && (
              <MotiView
                from={{ opacity: 0, translateY: -8 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 180 }}
                style={hStyles.dropdown}
              >
                {periodOptions.map(p => (
                  <TouchableOpacity key={p} onPress={() => { setSelectedPeriod(p); setShowPeriodDropdown(false); setCurrentPage(1); }} style={[hStyles.dropdownItem, p === selectedPeriod && hStyles.dropdownItemActive]}>
                    <Text style={[hStyles.dropdownText, p === selectedPeriod && hStyles.dropdownTextActive]}>{p}</Text>
                    {p === selectedPeriod && <Ionicons name="checkmark" size={14} color="#5B94D3" />}
                  </TouchableOpacity>
                ))}
              </MotiView>
            )}
          </View>
          <TouchableOpacity style={hStyles.customBtn} onPress={() => { clearCalendar(); setShowCalendar(true); }} activeOpacity={0.7}>
            <Ionicons name="calendar" size={15} color="#5B94D3" />
            <Text style={hStyles.customBtnText}>Calendar</Text>
          </TouchableOpacity>
        </View>

        {/* ── Type pills ── */}
        <View style={hStyles.pillRow}>
          {[{ key: 'all', label: 'All' }, { key: 'income', label: 'Income' }, { key: 'expenses', label: 'Expenses' }].map(f => {
            const active = selectedFilter === f.key;
            return (
              <TouchableOpacity key={f.key} onPress={() => { setSelectedFilter(f.key); setCurrentPage(1); }} style={[hStyles.pill, active && hStyles.pillActive]} activeOpacity={0.7}>
                <Text style={[hStyles.pillText, active && hStyles.pillTextActive]}>{f.label}</Text>
              </TouchableOpacity>
            );
          })}
          <Text style={hStyles.countText}>{filteredTransactions.length} txn{filteredTransactions.length !== 1 ? 's' : ''}</Text>
        </View>

        {/* ── List ── */}
        <FlatList
          data={paginatedTransactions}
          renderItem={({ item, index }) => <TxRow item={item} index={index} />}
          keyExtractor={item => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#5B94D3" />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20, flexGrow: 1 }}
          ListEmptyComponent={
            loading ? <Spinner /> : error ? (
              <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} style={hStyles.centeredState}>
                <View style={hStyles.stateIconBg}><Ionicons name="alert-circle-outline" size={32} color="#DC2626" /></View>
                <Text style={[hStyles.stateTitle, { color: '#DC2626' }]}>Unable to load</Text>
                <Text style={hStyles.stateText}>{error}</Text>
                <TouchableOpacity style={hStyles.retryBtn} onPress={loadData}>
                  <Text style={hStyles.retryText}>Try Again</Text>
                </TouchableOpacity>
              </MotiView>
            ) : (
              <MotiView from={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring' }} style={hStyles.centeredState}>
                <View style={hStyles.stateIconBg}><Ionicons name="receipt-outline" size={32} color="#9CA3AF" /></View>
                <Text style={hStyles.stateTitle}>No transactions</Text>
                <Text style={hStyles.stateText}>No {selectedFilter !== 'all' ? selectedFilter + ' ' : ''}transactions for {selectedPeriod}.</Text>
              </MotiView>
            )
          }
        />

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <View style={hStyles.pagination}>
            <TouchableOpacity style={[hStyles.pageBtn, currentPage === 1 && hStyles.pageBtnDisabled]} onPress={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>
              <Ionicons name="chevron-back" size={16} color={currentPage === 1 ? '#9CA3AF' : '#5B94D3'} />
            </TouchableOpacity>
            <Text style={hStyles.pageText}>Page {currentPage} of {totalPages}</Text>
            <TouchableOpacity style={[hStyles.pageBtn, currentPage === totalPages && hStyles.pageBtnDisabled]} onPress={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}>
              <Ionicons name="chevron-forward" size={16} color={currentPage === totalPages ? '#9CA3AF' : '#5B94D3'} />
            </TouchableOpacity>
          </View>
        )}

        {/* ── Calendar Modal ── */}
        <Modal visible={showCalendar} animationType="slide" transparent statusBarTranslucent onRequestClose={() => setShowCalendar(false)}>
          <View style={hStyles.sheetBackdrop}>
            <MotiView
              from={{ translateY: 80, opacity: 0 }}
              animate={{ translateY: 0, opacity: 1 }}
              transition={{ type: 'spring', damping: 20, stiffness: 200 }}
              style={hStyles.sheet}
            >
              <View style={hStyles.sheetHandle} />
              <View style={hStyles.sheetHeader}>
                <Text style={hStyles.sheetTitle}>Pick Date Range</Text>
                <TouchableOpacity onPress={() => setShowCalendar(false)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                  <Ionicons name="close-circle" size={26} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              {/* Step indicator */}
              <MotiView
                from={{ opacity: 0, translateX: -10 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ type: 'timing', duration: 300, delay: 100 }}
                style={hStyles.stepRow}
              >
                <View style={[hStyles.stepDot, calendarStep === 'start' && hStyles.stepDotActive]}>
                  <Text style={[hStyles.stepDotText, calendarStep === 'start' && { color: '#fff' }]}>1</Text>
                </View>
                <View style={hStyles.stepLine} />
                <View style={[hStyles.stepDot, calendarStep === 'end' && hStyles.stepDotActive]}>
                  <Text style={[hStyles.stepDotText, calendarStep === 'end' && { color: '#fff' }]}>2</Text>
                </View>
                <Text style={hStyles.stepHint}>
                  {calendarStep === 'start' ? 'Tap to select start date' : 'Tap to select end date'}
                </Text>
              </MotiView>

              {/* Selected range display */}
              {(customStartDate || customEndDate) && (
                <MotiView
                  from={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', damping: 16 }}
                  style={hStyles.rangeDisplay}
                >
                  <View style={hStyles.rangeItem}>
                    <Text style={hStyles.rangeLabel}>From</Text>
                    <Text style={hStyles.rangeDate}>{customStartDate || '—'}</Text>
                  </View>
                  <Ionicons name="arrow-forward" size={16} color="#9CA3AF" />
                  <View style={hStyles.rangeItem}>
                    <Text style={hStyles.rangeLabel}>To</Text>
                    <Text style={hStyles.rangeDate}>{customEndDate || '—'}</Text>
                  </View>
                </MotiView>
              )}

              <Calendar
                onDayPress={onDayPress}
                markingType="period"
                markedDates={markedDates}
                theme={{
                  backgroundColor: '#fff',
                  calendarBackground: '#fff',
                  textSectionTitleColor: '#5B94D3',
                  selectedDayBackgroundColor: '#5B94D3',
                  selectedDayTextColor: '#fff',
                  todayTextColor: '#5B94D3',
                  dayTextColor: '#111827',
                  textDisabledColor: '#D1D5DB',
                  arrowColor: '#5B94D3',
                  monthTextColor: '#111827',
                  textDayFontFamily: 'Nunito-Regular',
                  textMonthFontFamily: 'Nunito-Bold',
                  textDayHeaderFontFamily: 'Nunito-SemiBold',
                  textDayFontSize: 14,
                  textMonthFontSize: 16,
                  textDayHeaderFontSize: 12,
                }}
              />

              {/* Quick month chips */}
              <Text style={[hStyles.inputLabel, { marginTop: 12 }]}>Quick Select</Text>
              <View style={hStyles.quickRow}>
                {quickMonths.map(m => (
                  <TouchableOpacity
                    key={m.start}
                    style={hStyles.quickChip}
                    onPress={() => {
                      setCustomStartDate(m.start);
                      setCustomEndDate(m.end);
                      // Build marks for whole month
                      const marks: Record<string, any> = {};
                      const cursor = new Date(m.start);
                      const end = new Date(m.end);
                      while (cursor <= end) {
                        const key = cursor.toISOString().split('T')[0];
                        marks[key] = {
                          ...(key === m.start ? { startingDay: true } : {}),
                          ...(key === m.end ? { endingDay: true } : {}),
                          color: key === m.start || key === m.end ? '#5B94D3' : '#BFDBFE',
                          textColor: key === m.start || key === m.end ? '#fff' : '#1D4ED8',
                        };
                        cursor.setDate(cursor.getDate() + 1);
                      }
                      setMarkedDates(marks);
                      setCalendarStep('start');
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={hStyles.quickChipText}>{m.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={hStyles.sheetActions}>
                <TouchableOpacity style={hStyles.cancelBtn} onPress={clearCalendar}>
                  <Text style={hStyles.cancelText}>Clear</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[hStyles.applyBtn, (!customStartDate || !customEndDate) && { opacity: 0.5 }]}
                  onPress={applyCalendarRange}
                  disabled={!customStartDate || !customEndDate}
                >
                  <Text style={hStyles.applyText}>Apply Range</Text>
                </TouchableOpacity>
              </View>
            </MotiView>
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
  summaryIconRow:{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  summaryLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontFamily: 'Nunito-Medium' },
  summaryAmount:{ fontSize: 17, fontWeight: '800', fontFamily: 'Nunito-Bold' },
  summaryDivider:{ width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 8 },

  // Filter bar
  filterBar:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  periodBtn:    { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EFF6FF', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, flex: 1 },
  periodBtnText:{ fontSize: 13, color: '#1D4ED8', fontFamily: 'Nunito-SemiBold', flex: 1 },
  customBtn:    { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#EFF6FF', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 },
  customBtnText:{ fontSize: 13, color: '#1D4ED8', fontFamily: 'Nunito-SemiBold' },
  dropdown:     { position: 'absolute', top: 44, left: 0, right: 0, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', zIndex: 50, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 8 },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  dropdownItemActive: { backgroundColor: '#EFF6FF' },
  dropdownText: { fontSize: 14, fontFamily: 'Nunito-Regular', color: '#374151' },
  dropdownTextActive: { color: '#5B94D3', fontFamily: 'Nunito-SemiBold' },

  // Pills
  pillRow:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  pill:         { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, backgroundColor: '#F3F4F6' },
  pillActive:   { backgroundColor: '#5B94D3' },
  pillText:     { fontSize: 13, fontFamily: 'Nunito-SemiBold', color: '#6B7280' },
  pillTextActive:{ color: '#fff' },
  countText:    { marginLeft: 'auto' as any, fontSize: 12, fontFamily: 'Nunito-Regular', color: '#9CA3AF' },

  // Transaction row
  txRow:        { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  txIcon:       { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  txTopRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  txDesc:       { fontSize: 14, fontFamily: 'Nunito-SemiBold', color: '#111827', flex: 1 },
  txAmount:     { fontSize: 14, fontFamily: 'Nunito-Bold' },
  txBottomRow:  { flexDirection: 'row', justifyContent: 'space-between' },
  txMeta:       { fontSize: 12, fontFamily: 'Nunito-Regular', color: '#9CA3AF' },
  txRef:        { fontSize: 11, fontFamily: 'Nunito-Regular', color: '#D1D5DB', marginTop: 2 },
  autoBadge:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, gap: 3 },
  autoBadgeText:{ fontSize: 10, fontFamily: 'Nunito-Bold', color: '#059669' },
  commissionBadge:{ marginTop: 6, backgroundColor: '#EFF6FF', borderRadius: 8, padding: 6 },
  commissionText: { fontSize: 11, fontFamily: 'Nunito-Regular', color: '#1D4ED8' },

  // Spinner
  spinnerWrap:  { alignItems: 'center', justifyContent: 'center', paddingVertical: 64 },
  spinnerRing:  { width: 56, height: 56, borderRadius: 28, borderWidth: 3, borderColor: '#5B94D3', borderTopColor: 'transparent', position: 'absolute' },
  spinnerInner: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
  spinnerText:  { marginTop: 24, fontSize: 14, fontFamily: 'Nunito-Regular', color: '#9CA3AF' },

  // Empty / error states
  centeredState:{ alignItems: 'center', justifyContent: 'center', paddingVertical: 64, paddingHorizontal: 32, flexGrow: 1 },
  stateIconBg:  { width: 64, height: 64, borderRadius: 32, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  stateTitle:   { fontSize: 16, fontFamily: 'Nunito-Bold', color: '#374151', marginBottom: 6 },
  stateText:    { fontSize: 13, fontFamily: 'Nunito-Regular', color: '#9CA3AF', textAlign: 'center', lineHeight: 20 },
  retryBtn:     { marginTop: 16, backgroundColor: '#5B94D3', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 10 },
  retryText:    { color: '#fff', fontFamily: 'Nunito-SemiBold', fontSize: 14 },

  // Pagination
  pagination:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  pageBtn:      { width: 36, height: 36, borderRadius: 18, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  pageBtnDisabled:{ backgroundColor: '#F3F4F6' },
  pageText:     { fontSize: 13, color: '#6B7280', fontFamily: 'Nunito-Medium' },

  // Calendar bottom sheet
  sheetBackdrop:{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet:        { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40, maxHeight: '90%' },
  sheetHandle:  { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  sheetTitle:   { fontSize: 18, fontFamily: 'Nunito-Bold', color: '#111827' },
  inputLabel:   { fontSize: 13, fontFamily: 'Nunito-SemiBold', color: '#374151', marginBottom: 8 },

  // Step indicator
  stepRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  stepDot:      { width: 26, height: 26, borderRadius: 13, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#E5E7EB' },
  stepDotActive:{ backgroundColor: '#5B94D3', borderColor: '#5B94D3' },
  stepDotText:  { fontSize: 12, fontFamily: 'Nunito-Bold', color: '#9CA3AF' },
  stepLine:     { flex: 1, height: 2, backgroundColor: '#E5E7EB', maxWidth: 20 },
  stepHint:     { fontSize: 12, fontFamily: 'Nunito-Regular', color: '#9CA3AF', flex: 1 },

  // Range display
  rangeDisplay: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', backgroundColor: '#EFF6FF', borderRadius: 12, padding: 12, marginBottom: 12 },
  rangeItem:    { alignItems: 'center' },
  rangeLabel:   { fontSize: 11, fontFamily: 'Nunito-Regular', color: '#6B7280', marginBottom: 2 },
  rangeDate:    { fontSize: 14, fontFamily: 'Nunito-Bold', color: '#1D4ED8' },

  // Quick chips
  quickRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  quickChip:    { backgroundColor: '#EFF6FF', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  quickChipText:{ fontSize: 13, color: '#1D4ED8', fontFamily: 'Nunito-Medium' },

  // Sheet actions
  sheetActions: { flexDirection: 'row', gap: 12 },
  cancelBtn:    { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  cancelText:   { color: '#6B7280', fontFamily: 'Nunito-SemiBold', fontSize: 15 },
  applyBtn:     { flex: 1, backgroundColor: '#5B94D3', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  applyText:    { color: '#fff', fontFamily: 'Nunito-Bold', fontSize: 15 },
});
