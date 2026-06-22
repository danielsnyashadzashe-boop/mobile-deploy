import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency } from '../../data/mockData';
import { useGuard } from '../../contexts/GuardContext';
import { submitPayoutRequest, getMyPayouts, getAutoPayoutSettings, PayoutRequest, AutoPayoutSettings } from '../../services/mobileApiService';
import { useAuth } from '../../contexts/AuthContext';
import { AlertModal } from '../../components/AlertModal';

const MIN_PAYOUT = 10;
const QUICK_AMOUNTS = [10, 20, 50, 100, 200, 500];

type PayoutMethod = 'VOUCHER' | 'BANK_TRANSFER';
type AlertType = 'error' | 'success' | 'info' | 'warning';

function methodLabel(m?: string | null) {
  return m === 'BANK_TRANSFER' ? 'Bank Transfer' : 'eWallet';
}

function getStatusConfig(status: string, method?: string | null) {
  const isBankTransfer = method === 'BANK_TRANSFER';
  const configs: Record<string, { label: string; color: string; bg: string; icon: string }> = {
    PENDING:    { label: 'Pending — awaiting admin review',    color: '#D97706', bg: '#FEF3C7', icon: 'time-outline' },
    APPROVED:   {
      label: isBankTransfer ? 'Approved — bank transfer pending' : 'Approved — eWallet being prepared',
      color: '#2563EB', bg: '#DBEAFE', icon: 'checkmark-circle-outline',
    },
    PROCESSING: { label: 'Processing',                         color: '#2563EB', bg: '#DBEAFE', icon: 'sync-outline' },
    COMPLETED:  {
      label: isBankTransfer ? 'Bank Transfer Sent' : 'eWallet Sent',
      color: '#059669', bg: '#D1FAE5', icon: 'checkmark-done-outline',
    },
    REJECTED:   { label: 'Declined',                           color: '#DC2626', bg: '#FEE2E2', icon: 'close-circle-outline' },
    CANCELLED:  { label: 'Declined',                           color: '#DC2626', bg: '#FEE2E2', icon: 'close-circle-outline' },
    FAILED:     { label: 'Could not be sent — balance refunded', color: '#EA580C', bg: '#FFF7ED', icon: 'alert-circle-outline' },
  };
  return configs[status] ?? configs['PENDING'];
}

export default function PayoutsScreen() {
  const { guard: authGuard, token } = useAuth();
  const { guardData, isLoading: guardLoading } = useGuard();

  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests]     = useState<PayoutRequest[]>([]);
  const [error, setError]           = useState<string | null>(null);
  const [autoPayoutSettings, setAutoPayoutSettings] = useState<AutoPayoutSettings | null>(null);

  // Request form state
  const [amount, setAmount]           = useState('');
  const [notes, setNotes]             = useState('');
  const [method, setMethod]           = useState<PayoutMethod>('VOUCHER');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm]       = useState(false);

  // Alert modal
  const [modal, setModal] = useState<{ visible: boolean; type: AlertType; title: string; message: string }>({
    visible: false, type: 'success', title: '', message: '',
  });

  const showModal = (type: AlertType, title: string, message: string) =>
    setModal({ visible: true, type, title, message });

  const balance = guardData?.balance ?? 0;

  const hasBankingDetails = !!(guardData?.accountNumber);

  // ─── Load requests ────────────────────────────────────────────────────────
  const loadRequests = useCallback(async () => {
    if (!token) return;
    try {
      const [payoutsRes, autoRes] = await Promise.all([
        getMyPayouts(token),
        getAutoPayoutSettings(token),
      ]);
      if (payoutsRes.success && payoutsRes.data) setRequests(payoutsRes.data);
      if (autoRes.success && autoRes.data) setAutoPayoutSettings(autoRes.data);
    } catch (e) {
      console.error('loadRequests error:', e);
    }
  }, [token]);

  useEffect(() => {
    if (!guardLoading && guardData) {
      loadRequests().finally(() => setLoading(false));
    } else if (!guardLoading && !guardData) {
      setError('Guard profile not found. Please link your account.');
      setLoading(false);
    }
  }, [guardData, guardLoading]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  }, [loadRequests]);

  // Reset method to eWallet whenever form closes
  const closeForm = () => {
    setShowForm(false);
    setAmount('');
    setNotes('');
    setMethod('VOUCHER');
  };

  // ─── Validation ───────────────────────────────────────────────────────────
  const parsedAmount = parseFloat(amount) || 0;
  const maxWithdrawable = Math.floor(balance / 10) * 10;

  const getAmountError = (): string | null => {
    if (!amount) return null;
    if (parsedAmount < MIN_PAYOUT) return `Minimum payout is ${formatCurrency(MIN_PAYOUT)}`;
    if (parsedAmount > balance) {
      return maxWithdrawable >= MIN_PAYOUT
        ? `You can withdraw up to ${formatCurrency(maxWithdrawable)}. The remaining ${formatCurrency(balance - maxWithdrawable)} stays in your account.`
        : `Insufficient balance. You need at least ${formatCurrency(MIN_PAYOUT)} to request a payout.`;
    }
    if (parsedAmount % 10 !== 0) {
      const roundedDown = Math.floor(parsedAmount / 10) * 10;
      return roundedDown >= MIN_PAYOUT
        ? `Payouts must be in whole multiples of R10. You can withdraw ${formatCurrency(roundedDown)} — the remaining ${formatCurrency(parsedAmount - roundedDown)} stays in your account.`
        : `Payouts must be in whole multiples of R10 (e.g. R10, R20, R30...)`;
    }
    return null;
  };

  const amountError = getAmountError();
  const canSubmit   = parsedAmount >= MIN_PAYOUT && parsedAmount <= balance && parsedAmount % 10 === 0 && !isSubmitting;
  const hasPending  = requests.some(r => r.status === 'PENDING' || r.status === 'PROCESSING');

  // ─── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!token || !canSubmit) return;

    if (hasPending) {
      showModal('warning', 'Request Already Pending',
        'You have a payout request that is still being processed. Please wait for it to be completed before submitting a new one.');
      return;
    }

    if (parsedAmount > balance) {
      showModal('error', 'Insufficient Balance', `You can only request up to ${formatCurrency(balance)}.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitPayoutRequest(parsedAmount, token, notes.trim() || undefined, method);

      if (res.success) {
        const methodText = method === 'BANK_TRANSFER'
          ? 'Bank transfer — funds will reflect within 1–2 business days once approved.'
          : 'eWallet — you will receive an SMS once sent.';
        showModal('success', 'Request Submitted',
          `Your ${formatCurrency(parsedAmount)} payout request has been submitted. ${methodText}`);
        closeForm();
        await loadRequests();
      } else {
        showModal('error', 'Request Failed', res.error || 'Failed to submit payout request. Please try again.');
      }
    } catch {
      showModal('error', 'Request Failed', 'Something went wrong. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#5B94D3" />
        <Text style={styles.loadingText}>Loading payouts...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color="#DC2626" />
        <Text style={styles.errorText}>{error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#5B94D3" />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Payouts</Text>
          <Text style={styles.headerSub}>Request a payout to your eWallet or bank account</Text>
        </View>

        {/* ── Balance card ── */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceRow}>
            <View>
              <Text style={styles.balanceLabel}>Available Balance</Text>
              <Text style={styles.balanceAmount}>{formatCurrency(balance)}</Text>
            </View>
            <View style={styles.balanceIcon}>
              <Ionicons name="wallet-outline" size={28} color="#5B94D3" />
            </View>
          </View>

          {hasPending && (
            <View style={styles.pendingBanner}>
              <Ionicons name="time-outline" size={16} color="#D97706" />
              <Text style={styles.pendingBannerText}>You have a pending payout request</Text>
            </View>
          )}

          {balance < MIN_PAYOUT && !hasPending && (
            <View style={styles.insufficientBanner}>
              <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
              <Text style={styles.insufficientBannerText}>
                Minimum payout is {formatCurrency(MIN_PAYOUT)}. Keep earning to unlock payouts.
              </Text>
            </View>
          )}
        </View>

        {/* ── Auto-payout info card ── */}
        {autoPayoutSettings?.enabled && (
          <View style={styles.autoPayoutCard}>
            <View style={styles.autoPayoutHeader}>
              <Ionicons name="flash" size={16} color="#059669" />
              <Text style={styles.autoPayoutTitle}>Auto-Payout Active</Text>
            </View>
            {autoPayoutSettings.amountUntilAutoPayout > 0 ? (
              <Text style={styles.autoPayoutText}>
                Your eWallet will be sent automatically when your balance reaches{' '}
                <Text style={styles.autoPayoutBold}>{formatCurrency(autoPayoutSettings.threshold)}</Text>.
                {' '}You are{' '}
                <Text style={styles.autoPayoutBold}>{formatCurrency(autoPayoutSettings.amountUntilAutoPayout)}</Text>
                {' '}away.
              </Text>
            ) : (
              <Text style={styles.autoPayoutText}>
                Your balance has reached the auto-payout threshold of{' '}
                <Text style={styles.autoPayoutBold}>{formatCurrency(autoPayoutSettings.threshold)}</Text>.
                {' '}An automatic eWallet payout will be processed shortly.
              </Text>
            )}
            {autoPayoutSettings.isCustom && (
              <Text style={styles.autoPayoutCustom}>Custom threshold set for your account</Text>
            )}
          </View>
        )}

        {/* ── Request payout button / form ── */}
        {!showForm ? (
          <TouchableOpacity
            style={[styles.requestBtn, (balance < MIN_PAYOUT || hasPending) && styles.requestBtnDisabled]}
            onPress={() => {
              if (hasPending) {
                showModal('warning', 'Request Already Pending',
                  'Please wait for your current payout request to be processed before submitting a new one.');
              } else if (balance < MIN_PAYOUT) {
                showModal('info', 'Insufficient Balance',
                  `You need at least ${formatCurrency(MIN_PAYOUT)} to request a payout. Your current balance is ${formatCurrency(balance)}.`);
              } else {
                setShowForm(true);
              }
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-up-circle-outline" size={22} color="#fff" />
            <Text style={styles.requestBtnText}>Request Payout</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>Request Payout</Text>
              <TouchableOpacity onPress={closeForm}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* ── Method selection ── */}
            <Text style={styles.fieldLabel}>How would you like to receive it?</Text>
            <View style={styles.methodRow}>
              {/* eWallet option */}
              <TouchableOpacity
                style={[styles.methodCard, method === 'VOUCHER' && styles.methodCardActive]}
                onPress={() => setMethod('VOUCHER')}
                activeOpacity={0.8}
              >
                <View style={[styles.methodIcon, method === 'VOUCHER' && styles.methodIconActive]}>
                  <Ionicons name="phone-portrait-outline" size={22} color={method === 'VOUCHER' ? '#fff' : '#5B94D3'} />
                </View>
                <Text style={[styles.methodTitle, method === 'VOUCHER' && styles.methodTitleActive]}>eWallet</Text>
                <Text style={[styles.methodSub, method === 'VOUCHER' && styles.methodSubActive]}>Sent via SMS</Text>
                {method === 'VOUCHER' && (
                  <View style={styles.methodCheck}>
                    <Ionicons name="checkmark-circle" size={16} color="#5B94D3" />
                  </View>
                )}
              </TouchableOpacity>

              {/* Bank Transfer option */}
              <TouchableOpacity
                style={[
                  styles.methodCard,
                  method === 'BANK_TRANSFER' && styles.methodCardActive,
                  !hasBankingDetails && styles.methodCardDisabled,
                ]}
                onPress={() => {
                  if (!hasBankingDetails) {
                    showModal('info', 'Banking Details Required',
                      'Add your bank account details in the Profile tab to enable bank transfers.');
                    return;
                  }
                  setMethod('BANK_TRANSFER');
                }}
                activeOpacity={hasBankingDetails ? 0.8 : 1}
              >
                <View style={[styles.methodIcon, method === 'BANK_TRANSFER' && styles.methodIconActive, !hasBankingDetails && styles.methodIconDisabled]}>
                  <Ionicons name="business-outline" size={22} color={method === 'BANK_TRANSFER' ? '#fff' : hasBankingDetails ? '#5B94D3' : '#9CA3AF'} />
                </View>
                <Text style={[styles.methodTitle, method === 'BANK_TRANSFER' && styles.methodTitleActive, !hasBankingDetails && styles.methodTitleDisabled]}>
                  Bank Transfer
                </Text>
                <Text style={[styles.methodSub, method === 'BANK_TRANSFER' && styles.methodSubActive, !hasBankingDetails && styles.methodSubDisabled]}>
                  {hasBankingDetails
                    ? `${guardData?.bankName ?? 'Bank'} · ••••${(guardData?.accountNumber ?? '').slice(-4)}`
                    : 'Add details in Profile'}
                </Text>
                {method === 'BANK_TRANSFER' && (
                  <View style={styles.methodCheck}>
                    <Ionicons name="checkmark-circle" size={16} color="#5B94D3" />
                  </View>
                )}
                {!hasBankingDetails && (
                  <View style={styles.methodLock}>
                    <Ionicons name="lock-closed-outline" size={12} color="#9CA3AF" />
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Quick amounts */}
            <Text style={styles.fieldLabel}>Quick Select</Text>
            <View style={styles.quickRow}>
              {QUICK_AMOUNTS.filter(a => a <= balance).map(a => (
                <TouchableOpacity
                  key={a}
                  style={[styles.quickBtn, parsedAmount === a && styles.quickBtnActive]}
                  onPress={() => setAmount(String(a))}
                >
                  <Text style={[styles.quickBtnText, parsedAmount === a && styles.quickBtnTextActive]}>R{a}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.quickBtn, amount === String(maxWithdrawable) && styles.quickBtnActive]}
                onPress={() => setAmount(String(maxWithdrawable))}
              >
                <Text style={[styles.quickBtnText, amount === String(maxWithdrawable) && styles.quickBtnTextActive]}>
                  Max ({formatCurrency(maxWithdrawable)})
                </Text>
              </TouchableOpacity>
            </View>

            {/* Amount input */}
            <Text style={styles.fieldLabel}>Amount (R)</Text>
            <View style={[styles.inputWrapper, amountError ? styles.inputWrapperError : null]}>
              <Text style={styles.currencyPrefix}>R</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {amountError ? (
              <View style={styles.fieldError}>
                <Ionicons name="alert-circle-outline" size={14} color="#DC2626" />
                <Text style={styles.fieldErrorText}>{amountError}</Text>
              </View>
            ) : parsedAmount >= MIN_PAYOUT && parsedAmount <= balance ? (
              <View style={styles.fieldSuccess}>
                <Ionicons name="checkmark-circle-outline" size={14} color="#059669" />
                <Text style={styles.fieldSuccessText}>
                  {method === 'BANK_TRANSFER'
                    ? `${formatCurrency(parsedAmount)} will be transferred to your bank account`
                    : `${formatCurrency(parsedAmount)} will be sent to your eWallet`}
                </Text>
              </View>
            ) : null}

            {/* Notes */}
            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Notes (optional)</Text>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Any additional notes for the admin..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              maxLength={200}
            />

            {/* Info box */}
            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={18} color="#2563EB" />
              <View style={{ flex: 1 }}>
                <Text style={styles.infoTitle}>How payouts work</Text>
                <Text style={styles.infoText}>
                  {method === 'BANK_TRANSFER'
                    ? 'Your request goes to admin for approval. Once approved, funds are manually transferred to your bank account. This typically takes 1–2 business days.'
                    : 'Your request goes to admin for approval. Once approved, the amount is sent to your phone as an eWallet. You will receive an SMS confirmation.'}
                </Text>
              </View>
            </View>

            {/* Submit */}
            <TouchableOpacity
              style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={!canSubmit}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name={method === 'BANK_TRANSFER' ? 'business-outline' : 'phone-portrait-outline'} size={18} color="#fff" />
                  <Text style={styles.submitBtnText}>
                    {method === 'BANK_TRANSFER' ? 'Request Bank Transfer' : 'Request eWallet'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* ── Payout history ── */}
        <Text style={styles.sectionTitle}>Payout History</Text>

        {requests.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No payout requests yet</Text>
            <Text style={styles.emptySub}>Your payout history will appear here</Text>
          </View>
        ) : (
          requests.map(req => {
            const cfg = getStatusConfig(req.status, req.method);
            return (
              <View key={req.id ?? req.payoutId} style={styles.requestCard}>
                <View style={styles.requestRow}>
                  <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                    <Ionicons name={cfg.icon as any} size={14} color={cfg.color} />
                    <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                  </View>
                  <Text style={styles.requestAmount}>{formatCurrency(req.amount)}</Text>
                </View>

                {/* Method badge */}
                <View style={styles.methodBadgeRow}>
                  <View style={[styles.methodBadge, req.method === 'BANK_TRANSFER' ? styles.methodBadgeBank : styles.methodBadgeEwallet]}>
                    <Ionicons
                      name={req.method === 'BANK_TRANSFER' ? 'business-outline' : 'phone-portrait-outline'}
                      size={11}
                      color={req.method === 'BANK_TRANSFER' ? '#059669' : '#2563EB'}
                    />
                    <Text style={[styles.methodBadgeText, req.method === 'BANK_TRANSFER' ? styles.methodBadgeTextBank : styles.methodBadgeTextEwallet]}>
                      {methodLabel(req.method)}
                    </Text>
                  </View>
                  <Text style={styles.requestDate}>
                    {new Date(req.requestedAt ?? '').toLocaleDateString('en-ZA', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </Text>
                </View>

                {req.notes ? (
                  <Text style={styles.requestNotes}>Note: {req.notes}</Text>
                ) : null}

                {(req.status === 'REJECTED' || req.status === 'CANCELLED') && req.rejectionReason ? (
                  <View style={styles.rejectionBox}>
                    <Ionicons name="close-circle-outline" size={14} color="#DC2626" />
                    <Text style={styles.rejectionText}>Reason: {req.rejectionReason}</Text>
                  </View>
                ) : null}

                {req.status === 'FAILED' ? (
                  <View style={styles.failedBox}>
                    <Ionicons name="refresh-circle-outline" size={14} color="#EA580C" />
                    <Text style={styles.failedText}>
                      Your balance of {formatCurrency(req.amount)} has been credited back. Please try again.
                      {req.rejectionReason ? `\nReason: ${req.rejectionReason}` : ''}
                    </Text>
                  </View>
                ) : null}

                {req.status === 'COMPLETED' && req.adminNotes ? (
                  <View style={styles.approvalBox}>
                    <Ionicons name="checkmark-circle-outline" size={14} color="#059669" />
                    <Text style={styles.approvalText}>
                      {req.method === 'BANK_TRANSFER' ? 'Ref: ' : 'Ref: '}{req.adminNotes}
                    </Text>
                  </View>
                ) : null}
              </View>
            );
          })
        )}
      </ScrollView>

      <AlertModal
        visible={modal.visible}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onClose={() => setModal(prev => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#F9FAFB' },
  centered:   { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB', gap: 12 },
  loadingText:{ marginTop: 8, color: '#6B7280', fontSize: 15, fontFamily: 'Nunito-Regular' },
  errorText:  { marginTop: 8, color: '#DC2626', fontSize: 15, fontFamily: 'Nunito-Regular', textAlign: 'center', paddingHorizontal: 24 },

  header:      { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  headerTitle: { fontSize: 26, fontWeight: '700', fontFamily: 'Nunito-Bold', color: '#111827' },
  headerSub:   { fontSize: 14, fontFamily: 'Nunito-Regular', color: '#6B7280', marginTop: 2 },

  balanceCard:   { margin: 16, backgroundColor: '#fff', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  balanceRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  balanceLabel:  { fontSize: 13, fontFamily: 'Nunito-Regular', color: '#6B7280', marginBottom: 4 },
  balanceAmount: { fontSize: 32, fontWeight: '800', fontFamily: 'Nunito-Bold', color: '#111827' },
  balanceIcon:   { width: 52, height: 52, borderRadius: 26, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },

  pendingBanner:        { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14, backgroundColor: '#FEF3C7', borderRadius: 8, padding: 10 },
  pendingBannerText:    { color: '#D97706', fontSize: 13, fontWeight: '500', fontFamily: 'Nunito-Medium', flex: 1 },
  insufficientBanner:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14, backgroundColor: '#F3F4F6', borderRadius: 8, padding: 10 },
  insufficientBannerText: { color: '#6B7280', fontSize: 13, fontFamily: 'Nunito-Regular', flex: 1 },

  requestBtn:         { marginHorizontal: 16, backgroundColor: '#5B94D3', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: '#5B94D3', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  requestBtnDisabled: { backgroundColor: '#9CA3AF', shadowOpacity: 0 },
  requestBtnText:     { color: '#fff', fontSize: 16, fontWeight: '700', fontFamily: 'Nunito-Bold' },

  formCard:    { margin: 16, backgroundColor: '#fff', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  formHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  formTitle:   { fontSize: 18, fontWeight: '700', fontFamily: 'Nunito-Bold', color: '#111827' },
  fieldLabel:  { fontSize: 13, fontWeight: '600', fontFamily: 'Nunito-SemiBold', color: '#374151', marginBottom: 8 },

  // Method selection cards
  methodRow:         { flexDirection: 'row', gap: 10, marginBottom: 20 },
  methodCard:        { flex: 1, borderRadius: 14, borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB', padding: 14, alignItems: 'center', gap: 6, position: 'relative' },
  methodCardActive:  { borderColor: '#5B94D3', backgroundColor: '#EFF6FF' },
  methodCardDisabled:{ opacity: 0.6 },
  methodIcon:        { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  methodIconActive:  { backgroundColor: '#5B94D3' },
  methodIconDisabled:{ backgroundColor: '#F3F4F6' },
  methodTitle:       { fontSize: 14, fontFamily: 'Nunito-Bold', color: '#374151' },
  methodTitleActive: { color: '#1D4ED8' },
  methodTitleDisabled:{ color: '#9CA3AF' },
  methodSub:         { fontSize: 11, fontFamily: 'Nunito-Regular', color: '#9CA3AF', textAlign: 'center' },
  methodSubActive:   { color: '#3B82F6' },
  methodSubDisabled: { color: '#D1D5DB' },
  methodCheck:       { position: 'absolute', top: 8, right: 8 },
  methodLock:        { position: 'absolute', top: 8, right: 8 },

  quickRow:    { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 16 },
  quickBtn:    { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  quickBtnActive: { backgroundColor: '#EFF6FF', borderColor: '#5B94D3' },
  quickBtnText:   { fontSize: 14, color: '#374151', fontWeight: '500', fontFamily: 'Nunito-Medium' },
  quickBtnTextActive: { color: '#5B94D3', fontWeight: '700', fontFamily: 'Nunito-Bold' },

  inputWrapper:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E7EB', paddingHorizontal: 14 },
  inputWrapperError: { borderColor: '#FCA5A5' },
  currencyPrefix:    { fontSize: 20, fontWeight: '700', fontFamily: 'Nunito-Bold', color: '#374151', marginRight: 4 },
  amountInput:       { flex: 1, fontSize: 24, fontWeight: '700', fontFamily: 'Nunito-Bold', color: '#111827', paddingVertical: 14 },

  fieldError:       { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  fieldErrorText:   { color: '#DC2626', fontSize: 13, fontFamily: 'Nunito-Regular' },
  fieldSuccess:     { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  fieldSuccessText: { color: '#059669', fontSize: 13, fontFamily: 'Nunito-Regular' },

  notesInput: { backgroundColor: '#F9FAFB', borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E7EB', padding: 14, fontSize: 14, fontFamily: 'Nunito-Regular', color: '#111827', textAlignVertical: 'top', minHeight: 80 },

  infoBox:   { flexDirection: 'row', gap: 10, backgroundColor: '#EFF6FF', borderRadius: 12, padding: 14, marginTop: 16 },
  infoTitle: { fontSize: 13, fontWeight: '600', fontFamily: 'Nunito-SemiBold', color: '#1D4ED8', marginBottom: 2 },
  infoText:  { fontSize: 12, fontFamily: 'Nunito-Regular', color: '#3B82F6', lineHeight: 18 },

  submitBtn:         { backgroundColor: '#5B94D3', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20 },
  submitBtnDisabled: { backgroundColor: '#9CA3AF' },
  submitBtnText:     { color: '#fff', fontSize: 16, fontWeight: '700', fontFamily: 'Nunito-Bold' },

  sectionTitle: { fontSize: 17, fontWeight: '700', fontFamily: 'Nunito-Bold', color: '#111827', marginHorizontal: 16, marginTop: 24, marginBottom: 12 },

  emptyState: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 16, fontWeight: '600', fontFamily: 'Nunito-SemiBold', color: '#6B7280', marginTop: 12 },
  emptySub:   { fontSize: 13, fontFamily: 'Nunito-Regular', color: '#9CA3AF', marginTop: 4 },

  requestCard:   { marginHorizontal: 16, marginBottom: 10, backgroundColor: '#fff', borderRadius: 14, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  requestRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  statusBadge:   { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText:    { fontSize: 12, fontWeight: '600', fontFamily: 'Nunito-SemiBold' },
  requestAmount: { fontSize: 18, fontWeight: '800', fontFamily: 'Nunito-Bold', color: '#111827' },

  methodBadgeRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  methodBadge:         { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  methodBadgeBank:     { backgroundColor: '#ECFDF5' },
  methodBadgeEwallet:  { backgroundColor: '#EFF6FF' },
  methodBadgeText:     { fontSize: 11, fontFamily: 'Nunito-SemiBold' },
  methodBadgeTextBank: { color: '#059669' },
  methodBadgeTextEwallet: { color: '#2563EB' },
  requestDate:   { fontSize: 12, fontFamily: 'Nunito-Regular', color: '#9CA3AF' },
  requestNotes:  { fontSize: 13, fontFamily: 'Nunito-Regular', color: '#6B7280', marginTop: 6, fontStyle: 'italic' },

  rejectionBox:  { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 8, backgroundColor: '#FEE2E2', borderRadius: 8, padding: 8 },
  rejectionText: { fontSize: 12, fontFamily: 'Nunito-Regular', color: '#DC2626', flex: 1 },
  failedBox:     { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 8, backgroundColor: '#FFF7ED', borderRadius: 8, padding: 8 },
  failedText:    { fontSize: 12, fontFamily: 'Nunito-Regular', color: '#EA580C', flex: 1, lineHeight: 18 },
  approvalBox:   { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 8, backgroundColor: '#D1FAE5', borderRadius: 8, padding: 8 },
  approvalText:  { fontSize: 12, fontFamily: 'Nunito-Regular', color: '#059669', flex: 1 },

  autoPayoutCard:   { marginHorizontal: 16, marginBottom: 12, backgroundColor: '#ECFDF5', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#A7F3D0' },
  autoPayoutHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  autoPayoutTitle:  { fontSize: 13, fontWeight: '700', fontFamily: 'Nunito-Bold', color: '#059669' },
  autoPayoutText:   { fontSize: 13, fontFamily: 'Nunito-Regular', color: '#065F46', lineHeight: 19 },
  autoPayoutBold:   { fontWeight: '700', fontFamily: 'Nunito-Bold' },
  autoPayoutCustom: { fontSize: 11, fontFamily: 'Nunito-Regular', color: '#6EE7B7', marginTop: 6 },
});
