import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency } from '../../data/mockData';
import { useGuard } from '../../contexts/GuardContext';
import { AlertModal } from '../../components/AlertModal';
import { updateMyProfile } from '../../services/mobileApiService';

// ─── helpers ────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0].toUpperCase())
    .join('');
}

function maskAccount(n: string) {
  return n.length > 4 ? '•••• ' + n.slice(-4) : n;
}

// ─── sub-components ──────────────────────────────────────────────────────────

interface RowProps {
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string;
  editing: boolean;
  placeholder?: string;
  keyboard?: 'default' | 'numeric' | 'phone-pad' | 'email-address';
  secure?: boolean;
  onChange?: (v: string) => void;
  editable?: boolean;
  badge?: React.ReactNode;
  last?: boolean;
}

function InfoRow({
  iconName, iconColor, iconBg, label, value,
  editing, placeholder, keyboard, secure, onChange,
  editable = true, badge, last,
}: RowProps) {
  return (
    <View style={[s.row, !last && s.rowBorder]}>
      <View style={[s.iconBox, { backgroundColor: iconBg }]}>
        <Ionicons name={iconName} size={16} color={iconColor} />
      </View>
      <View style={s.rowBody}>
        <Text style={s.rowLabel}>{label}</Text>
        {editing && editable ? (
          <TextInput
            value={value}
            onChangeText={onChange}
            placeholder={placeholder || '—'}
            placeholderTextColor="#9CA3AF"
            keyboardType={keyboard || 'default'}
            secureTextEntry={secure}
            style={s.rowInput}
          />
        ) : (
          <Text style={[s.rowValue, !value && s.rowEmpty]}>
            {value || (editable ? 'Not added' : '—')}
          </Text>
        )}
      </View>
      {badge}
    </View>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <Text style={s.sectionHeader}>{title.toUpperCase()}</Text>
  );
}

// ─── main screen ─────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const { guard: authGuard, token, logout, refreshGuard } = useAuth();
  const { guardData, clearGuardData, isLoading: guardLoading } = useGuard();
  const [isEditing, setIsEditing] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<{
    visible: boolean; type: 'info' | 'warning' | 'error' | 'success';
    title: string; message: string;
  }>({ visible: false, type: 'info', title: '', message: '' });

  const [form, setForm] = useState({
    name: '', phoneNumber: '', email: '',
    bankName: '', accountNumber: '', accountHolder: '', accountType: '', branchCode: '',
  });

  useEffect(() => { refreshGuard(); }, []);

  useEffect(() => {
    if (guardData && !guardLoading) {
      setForm({
        name: guardData.fullName || '',
        phoneNumber: guardData.phone || '',
        email: guardData.email || '',
        bankName: guardData.bankName || '',
        accountNumber: guardData.accountNumber || '',
        accountHolder: guardData.accountHolder || '',
        accountType: guardData.accountType || '',
        branchCode: guardData.branchCode || '',
      });
    }
  }, [guardData, guardLoading]);

  const patch = (key: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [key]: v }));

  const handleSave = async () => {
    if (!token) {
      setModal({ visible: true, type: 'error', title: 'Not Authenticated', message: 'Please sign in again.' });
      return;
    }
    setSaving(true);
    try {
      const parts = form.name.trim().split(' ');
      const res = await updateMyProfile({
        name: parts[0] || '',
        surname: parts.slice(1).join(' ') || '',
        phone: form.phoneNumber,
        bankName: form.bankName || undefined,
        accountNumber: form.accountNumber || undefined,
        accountHolder: form.accountHolder || undefined,
        branchCode: form.branchCode || undefined,
        accountType: form.accountType || undefined,
      }, token);

      if (res.success) {
        setIsEditing(false);
        setModal({ visible: true, type: 'success', title: 'Saved', message: 'Your profile has been updated.' });
        refreshGuard();
      } else {
        setModal({ visible: true, type: 'error', title: 'Error', message: res.error || 'Failed to update.' });
      }
    } catch {
      setModal({ visible: true, type: 'error', title: 'Error', message: 'Something went wrong. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive',
        onPress: async () => {
          try {
            await clearGuardData();
            await logout();
            router.replace('/(auth)/sign-in');
          } catch {
            Alert.alert('Error', 'Failed to sign out. Please try again.');
          }
        },
      },
    ]);
  };

  const hasBanking = !!(form.bankName || form.accountNumber);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0D2F6E' }} edges={['top', 'left', 'right']}>
      <ScrollView style={{ flex: 1, backgroundColor: '#F1F5F9' }} showsVerticalScrollIndicator={false}>

        {/* ── GRADIENT HERO ─────────────────────────────────────────── */}
        <LinearGradient colors={['#0D2F6E', '#1A56A5', '#5B94D3']} style={s.hero}>
          {/* top bar */}
          <View style={s.heroBar}>
            <Text style={s.heroTitle}>My Profile</Text>
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <TouchableOpacity
                onPress={() => isEditing ? handleSave() : setIsEditing(true)}
                style={isEditing ? s.saveBtn : s.editBtn}
                activeOpacity={0.8}
              >
                <Ionicons name={isEditing ? 'checkmark' : 'pencil'} size={14} color={isEditing ? '#fff' : '#11468F'} />
                <Text style={isEditing ? s.saveBtnText : s.editBtnText}>
                  {isEditing ? 'Save' : 'Edit'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* avatar */}
          {guardLoading ? (
            <View style={{ alignItems: 'center', paddingBottom: 72, paddingTop: 8 }}>
              <ActivityIndicator color="#fff" size="large" />
            </View>
          ) : guardData ? (
            <View style={s.avatarSection}>
              <View style={s.avatarRing}>
                <LinearGradient colors={['#5B94D3', '#11468F']} style={s.avatarInner}>
                  <Text style={s.avatarText}>{initials(guardData.fullName)}</Text>
                </LinearGradient>
              </View>
              <Text style={s.heroName}>{guardData.fullName}</Text>
              <Text style={s.heroId} numberOfLines={1} ellipsizeMode="middle">
                ID · {guardData.guardId}
              </Text>
              <View style={s.heroBadgeRow}>
                <View style={s.activeBadge}>
                  <View style={s.activeDot} />
                  <Text style={s.activeBadgeText}>Active</Text>
                </View>
                <View style={s.ratingBadge}>
                  <Ionicons name="star" size={11} color="#F59E0B" />
                  <Text style={s.ratingText}>{guardData.rating ?? 0}</Text>
                </View>
              </View>
            </View>
          ) : null}
        </LinearGradient>

        {/* ── BALANCE CARD (overlaps gradient) ─────────────────────── */}
        {guardData && (
          <View style={s.balanceCard}>
            <View style={s.balanceCol}>
              <Text style={s.balanceLabel}>TOTAL EARNINGS</Text>
              <Text style={s.balanceAmount}>{formatCurrency(guardData.totalEarnings)}</Text>
            </View>
            <View style={s.balanceDivider} />
            <View style={s.balanceCol}>
              <Text style={s.balanceLabel}>AVAILABLE</Text>
              <Text style={[s.balanceAmount, { color: '#5B94D3' }]}>
                {formatCurrency(guardData.balance)}
              </Text>
            </View>
          </View>
        )}

        <View style={{ height: 8 }} />

        {/* ── PERSONAL INFORMATION ─────────────────────────────────── */}
        <SectionHeader title="Personal Information" />
        <View style={s.card}>
          <InfoRow
            iconName="person" iconColor="#5B94D3" iconBg="#EFF6FF"
            label="Full Name" value={form.name}
            editing={isEditing} placeholder="Full name"
            onChange={patch('name')}
          />
          <InfoRow
            iconName="call" iconColor="#059669" iconBg="#ECFDF5"
            label="Phone Number" value={form.phoneNumber}
            editing={isEditing} keyboard="phone-pad" placeholder="+27..."
            onChange={patch('phoneNumber')}
          />
          <InfoRow
            iconName="mail" iconColor="#7C3AED" iconBg="#F5F3FF"
            label="Email Address" value={form.email}
            editing={isEditing} keyboard="email-address" placeholder="name@email.com"
            onChange={patch('email')}
          />
          <InfoRow
            iconName="location" iconColor="#D97706" iconBg="#FFF7ED"
            label="Work Location" value={guardData?.location?.name || 'Not assigned'}
            editing={false} editable={false} last
          />
        </View>

        {/* ── BANKING DETAILS ──────────────────────────────────────── */}
        <SectionHeader title="Banking Details" />
        <View style={s.bankingCard}>
          {/* card header */}
          <LinearGradient colors={['#0D2F6E', '#1A56A5']} style={s.bankingHeader}>
            <View style={s.bankingHeaderLeft}>
              <View style={s.bankingChip}>
                <Ionicons name="card" size={18} color="#fff" />
              </View>
              <View>
                <Text style={s.bankingHeaderTitle}>Bank Account</Text>
                <Text style={s.bankingHeaderSub}>Payout destination</Text>
              </View>
            </View>
            {!hasBanking && (
              <View style={s.notSetBadge}>
                <Text style={s.notSetText}>Not set</Text>
              </View>
            )}
            {hasBanking && !isEditing && (
              <View style={s.linkedBadge}>
                <Ionicons name="checkmark-circle" size={13} color="#10B981" />
                <Text style={s.linkedText}>Linked</Text>
              </View>
            )}
          </LinearGradient>

          {/* fields */}
          <View style={s.bankingFields}>
            <InfoRow
              iconName="business" iconColor="#5B94D3" iconBg="#EFF6FF"
              label="Bank Name" value={form.bankName}
              editing={isEditing} placeholder="e.g. Standard Bank"
              onChange={patch('bankName')}
            />
            <InfoRow
              iconName="person" iconColor="#5B94D3" iconBg="#EFF6FF"
              label="Account Holder" value={form.accountHolder}
              editing={isEditing} placeholder="Full name on account"
              onChange={patch('accountHolder')}
            />
            <InfoRow
              iconName="lock-closed" iconColor="#059669" iconBg="#ECFDF5"
              label="Account Number"
              value={isEditing ? form.accountNumber : (form.accountNumber ? maskAccount(form.accountNumber) : '')}
              editing={isEditing} keyboard="numeric" placeholder="Enter account number"
              onChange={patch('accountNumber')}
              badge={
                !isEditing && form.accountNumber ? (
                  <View style={s.verifiedBadge}>
                    <Text style={s.verifiedText}>Verified</Text>
                  </View>
                ) : undefined
              }
            />
            <InfoRow
              iconName="layers" iconColor="#D97706" iconBg="#FFF7ED"
              label="Account Type" value={form.accountType}
              editing={isEditing} placeholder="e.g. Savings / Cheque"
              onChange={patch('accountType')}
            />
            <InfoRow
              iconName="git-branch" iconColor="#7C3AED" iconBg="#F5F3FF"
              label="Branch Code" value={form.branchCode}
              editing={isEditing} keyboard="numeric" placeholder="e.g. 051001"
              onChange={patch('branchCode')} last
            />
          </View>
        </View>

        {/* ── SETTINGS ─────────────────────────────────────────────── */}
        <SectionHeader title="Settings" />
        <View style={s.card}>
          {/* notifications toggle */}
          <View style={[s.row, s.rowBorder]}>
            <View style={[s.iconBox, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="notifications" size={16} color="#5B94D3" />
            </View>
            <Text style={[s.rowBody, { fontSize: 14, color: '#111827' }]}>Push Notifications</Text>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: '#D1D5DB', true: '#5B94D3' }}
              thumbColor="#fff"
            />
          </View>

          {[
            {
              icon: 'shield-checkmark' as const, iconColor: '#DC2626', iconBg: '#FEF2F2',
              label: 'Change Access Code',
              msg: 'Access codes are managed by your administrator.\n\nTo get a new code, ask your manager to generate one from the admin portal.',
            },
            {
              icon: 'help-buoy' as const, iconColor: '#0891B2', iconBg: '#ECFEFF',
              label: 'Help & Support',
              msg: 'For any issues, contact your manager or supervisor directly.\n\nThey can assist with:\n• Account issues\n• Balance queries\n• Payout requests\n• Access code resets\n\nFor technical issues, ask your manager to contact Ionic Innovate support.',
            },
            {
              icon: 'information-circle' as const, iconColor: '#6B7280', iconBg: '#F3F4F6',
              label: 'About',
              msg: 'Tippa Mobile Solutions v1.0\n\nA digital tipping platform for car guards.\n\nDeveloped by Ionic Innovate.',
            },
          ].map((item, i, arr) => (
            <TouchableOpacity
              key={item.label}
              style={[s.row, i < arr.length - 1 && s.rowBorder]}
              onPress={() => setModal({ visible: true, type: 'info', title: item.label, message: item.msg })}
              activeOpacity={0.6}
            >
              <View style={[s.iconBox, { backgroundColor: item.iconBg }]}>
                <Ionicons name={item.icon} size={16} color={item.iconColor} />
              </View>
              <Text style={[s.rowBody, { fontSize: 14, color: '#111827', flex: 1 }]}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
            </TouchableOpacity>
          ))}
        </View>

        {/* ── LOGOUT ───────────────────────────────────────────────── */}
        <TouchableOpacity onPress={handleLogout} style={s.logoutBtn} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={18} color="#DC2626" />
          <Text style={s.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>

      <AlertModal
        visible={modal.visible}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onClose={() => setModal(m => ({ ...m, visible: false }))}
      />
    </SafeAreaView>
  );
}

// ─── styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  // hero
  hero: { paddingHorizontal: 20, paddingBottom: 72, paddingTop: 8 },
  heroBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  heroTitle: { fontSize: 20, fontFamily: 'Nunito-Bold', color: '#fff' },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6,
  },
  editBtnText: { fontSize: 13, fontFamily: 'Nunito-SemiBold', color: '#11468F' },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#10B981', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6,
  },
  saveBtnText: { fontSize: 13, fontFamily: 'Nunito-SemiBold', color: '#fff' },

  avatarSection: { alignItems: 'center', paddingBottom: 8 },
  avatarRing: {
    width: 92, height: 92, borderRadius: 46,
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)',
    padding: 3, marginBottom: 14,
  },
  avatarInner: { flex: 1, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 30, fontFamily: 'Nunito-Bold', color: '#fff' },
  heroName: { fontSize: 22, fontFamily: 'Nunito-Bold', color: '#fff', marginBottom: 4 },
  heroId: { fontSize: 11, fontFamily: 'Nunito-Regular', color: 'rgba(255,255,255,0.6)', marginBottom: 12, maxWidth: 280 },
  heroBadgeRow: { flexDirection: 'row', gap: 8 },
  activeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(16,185,129,0.2)', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(16,185,129,0.4)',
  },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  activeBadgeText: { fontSize: 11, fontFamily: 'Nunito-SemiBold', color: '#A7F3D0' },
  ratingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(245,158,11,0.2)', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)',
  },
  ratingText: { fontSize: 11, fontFamily: 'Nunito-SemiBold', color: '#FCD34D' },

  // balance card
  balanceCard: {
    marginHorizontal: 16,
    marginTop: -52,
    backgroundColor: '#fff',
    borderRadius: 20,
    flexDirection: 'row',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  balanceCol: { flex: 1, alignItems: 'center' },
  balanceDivider: { width: 1, backgroundColor: '#F1F5F9', marginVertical: 4 },
  balanceLabel: { fontSize: 10, fontFamily: 'Nunito-SemiBold', color: '#9CA3AF', letterSpacing: 0.8, marginBottom: 6 },
  balanceAmount: { fontSize: 22, fontFamily: 'Nunito-Bold', color: '#111827' },

  // section header
  sectionHeader: {
    fontSize: 11, fontFamily: 'Nunito-SemiBold', color: '#9CA3AF',
    letterSpacing: 1, marginHorizontal: 20, marginTop: 20, marginBottom: 8,
  },

  // cards
  card: {
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },

  // rows
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  iconBox: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12, flexShrink: 0,
  },
  rowBody: { flex: 1 },
  rowLabel: { fontSize: 11, fontFamily: 'Nunito-SemiBold', color: '#9CA3AF', marginBottom: 2 },
  rowValue: { fontSize: 14, fontFamily: 'Nunito-SemiBold', color: '#111827' },
  rowEmpty: { color: '#C4CDD6', fontFamily: 'Nunito-Regular' },
  rowInput: {
    fontSize: 14, fontFamily: 'Nunito-SemiBold', color: '#111827',
    padding: 0, borderBottomWidth: 1, borderBottomColor: '#5B94D3', paddingBottom: 2,
  },

  // banking card
  bankingCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  bankingHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  bankingHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bankingChip: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  bankingHeaderTitle: { fontSize: 15, fontFamily: 'Nunito-Bold', color: '#fff' },
  bankingHeaderSub: { fontSize: 11, fontFamily: 'Nunito-Regular', color: 'rgba(255,255,255,0.6)', marginTop: 1 },
  notSetBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  notSetText: { fontSize: 11, fontFamily: 'Nunito-SemiBold', color: 'rgba(255,255,255,0.8)' },
  linkedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(16,185,129,0.2)', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(16,185,129,0.4)',
  },
  linkedText: { fontSize: 11, fontFamily: 'Nunito-SemiBold', color: '#A7F3D0' },
  bankingFields: { backgroundColor: '#fff' },

  verifiedBadge: {
    backgroundColor: '#DCFCE7', borderRadius: 20,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  verifiedText: { fontSize: 10, fontFamily: 'Nunito-SemiBold', color: '#166534' },

  // logout
  logoutBtn: {
    marginHorizontal: 16, marginTop: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 16, paddingVertical: 16,
    borderWidth: 1, borderColor: '#FECACA',
  },
  logoutText: { fontSize: 15, fontFamily: 'Nunito-Bold', color: '#DC2626' },
});
