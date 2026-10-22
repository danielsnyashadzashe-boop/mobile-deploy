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
import Reanimated, { FadeInDown, FadeIn, ZoomIn } from 'react-native-reanimated';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency, formatDate } from '../../data/mockData';
import { useGuard } from '../../contexts/GuardContext';
import { getTransactions, Transaction } from '../../services/mobileApiService';
import { CHANNEL_STYLE } from '../../src/lib/tips';

// ── Helpers ───────────────────────────────────────────────────────────────────

function isFailed(tx: Transaction) {
  return tx.status === 'FAILED' || tx.status === 'REVERSED';
}

/** Netcash replied but the old system misread it: not a confirmed failure. */
function isUnconfirmed(tx: Transaction) {
  return tx.status === 'UNCONFIRMED';
}

/** Money that actually moved. Failed, unconfirmed and pending items never count. */
function isCompleted(tx: Transaction) {
  return (tx.status || 'COMPLETED') === 'COMPLETED';
}

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
    <Reanimated.View entering={ZoomIn.duration(400)} style={hStyles.spinnerWrap}>
      <Animated.View style={[hStyles.spinnerRing, { transform: [{ rotate }] }]} />
      <View style={hStyles.spinnerInner}>
        <Ionicons name="receipt-outline" size={24} color="#5B94D3" />
      </View>
      <Reanimated.Text entering={FadeIn.delay(300).duration(600)} style={hStyles.spinnerText}>
        Loading transactions...
      </Reanimated.Text>
    </Reanimated.View>
  );
}

// ── Failed payment info banner ────────────────────────────────────────────────
function FailedBanner({ count }: { count: number }) {
  return (
    <Reanimated.View entering={FadeInDown.duration(350)} style={hStyles.bannerWrap}>
      <LinearGradient colors={['#FEF3C7', '#FDE68A']} style={hStyles.bannerGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        <View style={hStyles.bannerIcon}>
          <Ionicons name="warning" size={20} color="#B45309" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={hStyles.bannerTitle}>
            {count} failed payment{count !== 1 ? 's' : ''}
          </Text>
          <Text style={hStyles.bannerBody}>
            These were attempts by customers that didn't go through their bank. No funds reached your account for these — it's not money the company is holding back.
          </Text>
        </View>
      </LinearGradient>
    </Reanimated.View>
  );
}

// ── Transaction row ───────────────────────────────────────────────────────────
function TxRow({ item, index }: { item: Transaction; index: number }) {
  const failed = isFailed(item);
  const unconfirmed = isUnconfirmed(item);
  const channel = item.channel ? CHANNEL_STYLE[item.channel] : null;

  const iconMap: Record<string, { name: string; color: string }> = {
    TIP:         { name: 'cash',            color: '#10B981' },
    PAYOUT:      { name: 'wallet',          color: '#B01519' },
    AIRTIME:     { name: 'phone-portrait',  color: '#5B94D3' },
    ELECTRICITY: { name: 'flash',           color: '#F59E0B' },
  };
  const baseIcon = iconMap[item.type?.toUpperCase()] ?? { name: 'swap-horizontal', color: '#5B94D3' };
  const icon = failed
    ? { name: 'close-circle', color: '#EF4444' }
    : unconfirmed
      ? { name: 'help-circle', color: '#B45309' }
      : baseIcon;

  const isIncome = item.amount > 0;
  const hasCommission = (item as any).metadata?.commissionAmount > 0;
  const reason = item.explanation || item.failureReason || 'Payment didn\'t go through';
  const pill = item.status === 'REVERSED' ? 'Reversed' : 'Failed';

  const metaParts = [
    formatDate(item.date),
    item.time,
    item.paymentMethod,
  ].filter(Boolean).join(' · ');

  return (
    <Reanimated.View
      entering={FadeInDown.delay(index * 40).springify().damping(18)}
      style={[hStyles.txRow, failed && hStyles.txRowFailed, unconfirmed && hStyles.txRowUnconfirmed]}
    >
      <View style={[hStyles.txIcon, { backgroundColor: failed ? '#FEE2E2' : unconfirmed ? '#FEF3C7' : icon.color + '20' }]}>
        <Ionicons name={icon.name as any} size={16} color={icon.color} />
      </View>

      <View style={{ flex: 1 }}>
        {/* top row: description + badge + amount */}
        <View style={hStyles.txTopRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 6 }}>
            <Text
              style={[hStyles.txDesc, failed && hStyles.txDescFailed]}
              numberOfLines={1}
            >
              {(item as any).description || (item.type === 'TIP' ? 'Tip received' : item.type)}
            </Text>
            {failed && (
              <View style={hStyles.failedBadge}>
                <Text style={hStyles.failedBadgeText}>{pill}</Text>
              </View>
            )}
            {unconfirmed && (
              <View style={hStyles.unconfirmedBadge}>
                <Text style={hStyles.unconfirmedBadgeText}>Unconfirmed</Text>
              </View>
            )}
            {channel && (
              <View style={[hStyles.channelBadge, { backgroundColor: channel.bg }]}>
                <Ionicons name={channel.icon as any} size={9} color={channel.color} />
                <Text style={[hStyles.channelBadgeText, { color: channel.color }]}>{channel.short}</Text>
              </View>
            )}
            {!failed && (item as any).isAutomatic && (
              <View style={hStyles.autoBadge}>
                <Ionicons name="flash" size={9} color="#059669" />
                <Text style={hStyles.autoBadgeText}>Auto</Text>
              </View>
            )}
          </View>
          {failed || unconfirmed ? (
            <Text style={hStyles.txAmountStruck}>
              {isIncome ? '+' : ''}{formatCurrency(Math.abs(item.amount))}
            </Text>
          ) : (
            <Text style={[hStyles.txAmount, { color: isIncome ? '#10B981' : '#B01519' }]}>
              {isIncome ? '+' : ''}{formatCurrency(Math.abs(item.amount))}
            </Text>
          )}
        </View>

        {/* meta: date · time · payment method */}
        <View style={hStyles.txBottomRow}>
          <Text style={hStyles.txMeta}>{metaParts}</Text>
          {!failed && item.balance != null && (
            <Text style={hStyles.txMeta}>Bal: {formatCurrency(item.balance)}</Text>
          )}
        </View>

        {/* unconfirmed: say plainly what it is */}
        {unconfirmed && (
          <View style={hStyles.unconfirmedBox}>
            <Ionicons name="information-circle-outline" size={13} color="#B45309" style={{ marginTop: 1 }} />
            <Text style={hStyles.unconfirmedText}>{item.explanation}</Text>
          </View>
        )}

        {/* completed tips: how much reached the balance */}
        {!failed && !unconfirmed && item.type?.toUpperCase() === 'TIP' && !!item.explanation && (
          <Text style={hStyles.txExplain}>{item.explanation}</Text>
        )}

        {/* failure reason callout */}
        {failed && (
          <View style={hStyles.reasonBox}>
            <Ionicons name="information-circle-outline" size={13} color="#B91C1C" style={{ marginTop: 1 }} />
            <Text style={hStyles.reasonText}>{reason}</Text>
          </View>
        )}

        {!failed && (item as any).reference && (
          <Text style={hStyles.txRef}>Ref: {(item as any).reference}</Text>
        )}
        {!failed && !unconfirmed && hasCommission && !item.explanation && (
          <View style={hStyles.commissionBadge}>
            <Text style={hStyles.commissionText}>
              {(item as any).metadata.commissionRate}% commission · received {formatCurrency((item as any).metadata.guardReceivesAmount)}
            </Text>
          </View>
        )}
      </View>
    </Reanimated.View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function HistoryScreen() {
  const { token, logoutWithMessage } = useAuth();
  const { } = useGuard();

  const [refreshing, setRefreshing]         = useState(false);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState<string | null>(null);
  const [transactions, setTransactions]     = useState<Transaction[]>([]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('All Time');
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [currentPage, setCurrentPage]       = useState(1);
  const itemsPerPage = 10;
  const [showCalendar, setShowCalendar]     = useState(false);
  const [calendarStep, setCalendarStep]     = useState<'start' | 'end'>('start');
  const [markedDates, setMarkedDates]       = useState<Record<string, any>>({});
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
        setCustomStartDate(d);
        setMarkedDates({ [d]: { startingDay: true, color: '#5B94D3', textColor: '#fff' } });
        setCalendarStep('end');
        return;
      }
      setCustomEndDate(d);
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
    setSelectedPeriod(`Custom: ${customStartDate} → ${customEndDate}`);
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
      case 'This Week':  { const s = new Date(today); s.setDate(today.getDate() - today.getDay()); return txDate >= s && txDate <= today; }
      case 'This Month': { const s = new Date(today.getFullYear(), today.getMonth(), 1); return txDate >= s && txDate <= today; }
      case 'Last 7 Days':  { const s = new Date(today); s.setDate(today.getDate() - 7); return txDate >= s && txDate <= today; }
      case 'Last 30 Days': { const s = new Date(today); s.setDate(today.getDate() - 30); return txDate >= s && txDate <= today; }
      default: return true;
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    if (!isDateInPeriod(tx.date, selectedPeriod)) return false;
    switch (selectedFilter) {
      case 'successful': return isCompleted(tx);
      case 'failed':     return isFailed(tx);
      case 'tips':       return tx.type.toUpperCase() === 'TIP';
      case 'payouts':    return tx.type.toUpperCase() === 'PAYOUT';
      default:           return true;
    }
  });

  // Summary: only money that actually moved (not failed, unconfirmed or pending)
  const completedTxs = filteredTransactions.filter(isCompleted);
  const income   = completedTxs.filter(t => t.type.toUpperCase() === 'TIP').reduce((s, t) => s + t.amount, 0);
  const expenses = completedTxs.filter(t => ['PAYOUT','AIRTIME','ELECTRICITY','VOUCHER'].includes(t.type.toUpperCase())).reduce((s, t) => s + Math.abs(t.amount), 0);
  const netAmount = income - expenses;

  // Failed count across full unfiltered list (for banner + badge)
  const totalFailedCount = transactions.filter(isFailed).length;

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

  // ── Filter chips config ─────────────────────────────────────────────────────
  const filterChips = [
    { key: 'all',        label: 'All' },
    { key: 'successful', label: 'Successful' },
    { key: 'failed',     label: 'Failed', badge: totalFailedCount > 0 ? totalFailedCount : undefined, danger: true },
    { key: 'tips',       label: 'Tips' },
    { key: 'payouts',    label: 'Payouts' },
  ];

  // ── List header ─────────────────────────────────────────────────────────────
  const ListHeader = () => (
    <>
      {totalFailedCount > 0 && selectedFilter !== 'failed' && (
        <FailedBanner count={totalFailedCount} />
      )}
    </>
  );

  // ── Empty state label ────────────────────────────────────────────────────────
  const emptyLabel = selectedFilter === 'failed'
    ? 'No failed payments — all good!'
    : `No ${selectedFilter !== 'all' ? selectedFilter + ' ' : ''}transactions for ${selectedPeriod}.`;

  return (
    <TouchableWithoutFeedback onPress={() => setShowPeriodDropdown(false)}>
      <SafeAreaView style={hStyles.container} edges={['top', 'left', 'right']}>

        {/* ── Gradient header ── */}
        <LinearGradient colors={['#5B94D3', '#11468F']} style={hStyles.header}>
          <Text style={hStyles.headerTitle}>History</Text>
          <Text style={hStyles.headerSub}>Your transaction overview</Text>
          <Reanimated.View entering={FadeInDown.delay(100).springify()} style={hStyles.summaryRow}>
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
          </Reanimated.View>
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
              <Reanimated.View entering={FadeInDown.duration(180)} style={hStyles.dropdown}>
                {periodOptions.map(p => (
                  <TouchableOpacity key={p} onPress={() => { setSelectedPeriod(p); setShowPeriodDropdown(false); setCurrentPage(1); }} style={[hStyles.dropdownItem, p === selectedPeriod && hStyles.dropdownItemActive]}>
                    <Text style={[hStyles.dropdownText, p === selectedPeriod && hStyles.dropdownTextActive]}>{p}</Text>
                    {p === selectedPeriod && <Ionicons name="checkmark" size={14} color="#5B94D3" />}
                  </TouchableOpacity>
                ))}
              </Reanimated.View>
            )}
          </View>
          <TouchableOpacity style={hStyles.customBtn} onPress={() => { clearCalendar(); setShowCalendar(true); }} activeOpacity={0.7}>
            <Ionicons name="calendar" size={15} color="#5B94D3" />
            <Text style={hStyles.customBtnText}>Calendar</Text>
          </TouchableOpacity>
        </View>

        {/* ── Type filter chips ── */}
        <View style={hStyles.pillRow}>
          {filterChips.map(f => {
            const active = selectedFilter === f.key;
            const isDanger = f.danger;
            return (
              <TouchableOpacity
                key={f.key}
                onPress={() => { setSelectedFilter(f.key); setCurrentPage(1); }}
                style={[
                  hStyles.pill,
                  active && (isDanger ? hStyles.pillActiveDanger : hStyles.pillActive),
                  !active && isDanger && hStyles.pillDanger,
                ]}
                activeOpacity={0.7}
              >
                <Text style={[
                  hStyles.pillText,
                  active && hStyles.pillTextActive,
                  !active && isDanger && hStyles.pillTextDanger,
                ]}>
                  {f.label}
                </Text>
                {f.badge != null && (
                  <View style={[hStyles.pillBadge, active && { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
                    <Text style={hStyles.pillBadgeText}>{f.badge}</Text>
                  </View>
                )}
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
          ListHeaderComponent={<ListHeader />}
          ListEmptyComponent={
            loading ? <Spinner /> : error ? (
              <Reanimated.View entering={FadeIn} style={hStyles.centeredState}>
                <View style={hStyles.stateIconBg}><Ionicons name="alert-circle-outline" size={32} color="#DC2626" /></View>
                <Text style={[hStyles.stateTitle, { color: '#DC2626' }]}>Unable to load</Text>
                <View style={hStyles.errorCard}>
                  <Text style={hStyles.errorCardText}>{error}</Text>
                </View>
                <TouchableOpacity style={hStyles.retryBtn} onPress={loadData}>
                  <Text style={hStyles.retryText}>Try Again</Text>
                </TouchableOpacity>
              </Reanimated.View>
            ) : (
              <Reanimated.View entering={ZoomIn.springify()} style={hStyles.centeredState}>
                <View style={[hStyles.stateIconBg, selectedFilter === 'failed' && { backgroundColor: '#FEF2F2' }]}>
                  <Ionicons
                    name={selectedFilter === 'failed' ? 'checkmark-circle-outline' : 'receipt-outline'}
                    size={32}
                    color={selectedFilter === 'failed' ? '#10B981' : '#9CA3AF'}
                  />
                </View>
                <Text style={hStyles.stateTitle}>
                  {selectedFilter === 'failed' ? 'No failed payments — all good!' : 'No transactions'}
                </Text>
                <Text style={hStyles.stateText}>{emptyLabel}</Text>
              </Reanimated.View>
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
            <Reanimated.View entering={FadeInDown.springify().damping(20)} style={hStyles.sheet}>
              <View style={hStyles.sheetHandle} />
              <View style={hStyles.sheetHeader}>
                <Text style={hStyles.sheetTitle}>Pick Date Range</Text>
                <TouchableOpacity onPress={() => setShowCalendar(false)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                  <Ionicons name="close-circle" size={26} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              <Reanimated.View entering={FadeIn.delay(100).duration(300)} style={hStyles.stepRow}>
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
              </Reanimated.View>

              {(customStartDate || customEndDate) && (
                <Reanimated.View entering={ZoomIn.springify().damping(16)} style={hStyles.rangeDisplay}>
                  <View style={hStyles.rangeItem}>
                    <Text style={hStyles.rangeLabel}>From</Text>
                    <Text style={hStyles.rangeDate}>{customStartDate || '—'}</Text>
                  </View>
                  <Ionicons name="arrow-forward" size={16} color="#9CA3AF" />
                  <View style={hStyles.rangeItem}>
                    <Text style={hStyles.rangeLabel}>To</Text>
                    <Text style={hStyles.rangeDate}>{customEndDate || '—'}</Text>
                  </View>
                </Reanimated.View>
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

              <Text style={[hStyles.inputLabel, { marginTop: 12 }]}>Quick Select</Text>
              <View style={hStyles.quickRow}>
                {quickMonths.map(m => (
                  <TouchableOpacity
                    key={m.start}
                    style={hStyles.quickChip}
                    onPress={() => {
                      setCustomStartDate(m.start);
                      setCustomEndDate(m.end);
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
            </Reanimated.View>
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

  // Failed banner
  bannerWrap:       { marginHorizontal: 12, marginTop: 12, marginBottom: 4, borderRadius: 14, overflow: 'hidden' },
  bannerGradient:   { flexDirection: 'row', alignItems: 'flex-start', padding: 12, gap: 10 },
  bannerIcon:       { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(180,83,9,0.15)', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  bannerTitle:      { fontSize: 13, fontFamily: 'Nunito-Bold', color: '#92400E', marginBottom: 4 },
  bannerBody:       { fontSize: 12, fontFamily: 'Nunito-Regular', color: '#78350F', lineHeight: 17 },

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
  pillRow:           { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 12, paddingBottom: 12, paddingTop: 4, gap: 6, flexWrap: 'nowrap' },
  pill:              { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: '#F3F4F6' },
  pillActive:        { backgroundColor: '#5B94D3' },
  pillActiveDanger:  { backgroundColor: '#DC2626' },
  pillDanger:        { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
  pillText:          { fontSize: 12, fontFamily: 'Nunito-SemiBold', color: '#6B7280' },
  pillTextActive:    { color: '#fff' },
  pillTextDanger:    { color: '#DC2626' },
  pillBadge:         { backgroundColor: '#DC2626', borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  pillBadgeText:     { fontSize: 10, fontFamily: 'Nunito-Bold', color: '#fff' },
  countText:         { marginLeft: 'auto' as any, fontSize: 11, fontFamily: 'Nunito-Regular', color: '#9CA3AF' },

  // Transaction rows
  txRow:         { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  txRowFailed:   { backgroundColor: '#FFF5F5' },
  txRowUnconfirmed: { backgroundColor: '#FFFBEB' },
  txExplain:     { fontSize: 12, fontFamily: 'Nunito-Regular', color: '#4B5563', marginTop: 4, lineHeight: 17 },
  txIcon:        { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  txTopRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  txDesc:        { fontSize: 14, fontFamily: 'Nunito-SemiBold', color: '#111827', flex: 1 },
  txDescFailed:  { color: '#B91C1C' },
  txAmount:      { fontSize: 14, fontFamily: 'Nunito-Bold' },
  txAmountStruck:{ fontSize: 14, fontFamily: 'Nunito-Bold', color: '#9CA3AF', textDecorationLine: 'line-through' },
  txBottomRow:   { flexDirection: 'row', justifyContent: 'space-between' },
  txMeta:        { fontSize: 12, fontFamily: 'Nunito-Regular', color: '#9CA3AF' },
  txRef:         { fontSize: 11, fontFamily: 'Nunito-Regular', color: '#D1D5DB', marginTop: 2 },

  // Badges
  autoBadge:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, gap: 3 },
  autoBadgeText: { fontSize: 10, fontFamily: 'Nunito-Bold', color: '#059669' },
  failedBadge:   { backgroundColor: '#FEE2E2', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  unconfirmedBadge:{ backgroundColor: '#FEF3C7', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  unconfirmedBadgeText:{ fontSize: 10, fontFamily: 'Nunito-Bold', color: '#B45309', textTransform: 'uppercase', letterSpacing: 0.3 },
  channelBadge:  { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  channelBadgeText:{ fontSize: 10, fontFamily: 'Nunito-Bold' },
  unconfirmedBox:{ flexDirection: 'row', alignItems: 'flex-start', gap: 5, marginTop: 6, backgroundColor: '#FFFBEB', borderRadius: 8, padding: 8, borderWidth: 1, borderColor: '#FDE68A' },
  unconfirmedText:{ fontSize: 11, fontFamily: 'Nunito-Regular', color: '#92400E', flex: 1, lineHeight: 16 },
  failedBadgeText:{ fontSize: 10, fontFamily: 'Nunito-Bold', color: '#DC2626', textTransform: 'uppercase', letterSpacing: 0.3 },

  // Failure reason callout
  reasonBox:    { flexDirection: 'row', alignItems: 'flex-start', gap: 5, marginTop: 6, backgroundColor: '#FEF2F2', borderRadius: 8, padding: 8 },
  reasonText:   { fontSize: 11, fontFamily: 'Nunito-Regular', color: '#B91C1C', flex: 1, lineHeight: 16 },

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
  errorCard:    { borderWidth: 1, borderColor: '#FECACA', backgroundColor: '#FEF2F2', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10, marginBottom: 12, width: '100%' },
  errorCardText:{ fontSize: 13, fontFamily: 'Nunito-Regular', color: '#DC2626', textAlign: 'center' },
  retryBtn:     { marginTop: 4, backgroundColor: '#5B94D3', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 10 },
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
  stepRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  stepDot:      { width: 26, height: 26, borderRadius: 13, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#E5E7EB' },
  stepDotActive:{ backgroundColor: '#5B94D3', borderColor: '#5B94D3' },
  stepDotText:  { fontSize: 12, fontFamily: 'Nunito-Bold', color: '#9CA3AF' },
  stepLine:     { flex: 1, height: 2, backgroundColor: '#E5E7EB', maxWidth: 20 },
  stepHint:     { fontSize: 12, fontFamily: 'Nunito-Regular', color: '#9CA3AF', flex: 1 },
  rangeDisplay: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', backgroundColor: '#EFF6FF', borderRadius: 12, padding: 12, marginBottom: 12 },
  rangeItem:    { alignItems: 'center' },
  rangeLabel:   { fontSize: 11, fontFamily: 'Nunito-Regular', color: '#6B7280', marginBottom: 2 },
  rangeDate:    { fontSize: 14, fontFamily: 'Nunito-Bold', color: '#1D4ED8' },
  quickRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  quickChip:    { backgroundColor: '#EFF6FF', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  quickChipText:{ fontSize: 13, color: '#1D4ED8', fontFamily: 'Nunito-Medium' },
  sheetActions: { flexDirection: 'row', gap: 12 },
  cancelBtn:    { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  cancelText:   { color: '#6B7280', fontFamily: 'Nunito-SemiBold', fontSize: 15 },
  applyBtn:     { flex: 1, backgroundColor: '#5B94D3', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  applyText:    { color: '#fff', fontFamily: 'Nunito-Bold', fontSize: 15 },
});
