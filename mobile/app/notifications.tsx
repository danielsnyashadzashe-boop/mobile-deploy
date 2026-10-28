import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useNotifications, AppNotification } from '../contexts/NotificationContext';

// ─── type config ────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
  label: string;
}> = {
  PAYOUT_APPROVED: { icon: 'checkmark-circle', color: '#10B981', bg: '#ECFDF5', label: 'Payout Approved' },
  PAYOUT_REJECTED: { icon: 'close-circle',     color: '#EF4444', bg: '#FEF2F2', label: 'Payout Rejected' },
  PAYOUT_SENT:     { icon: 'paper-plane',       color: '#5B94D3', bg: '#EFF6FF', label: 'Payout Sent'     },
  TIP_RECEIVED:    { icon: 'checkmark-circle',  color: '#059669', bg: '#ECFDF5', label: 'Tip confirmed · money on your balance' },
  // Sent for every Tippa QR tip, so the CTA knows what happened to each one. A
  // "waiting" message is never money: the customer still has to approve the payment.
  TIP_STARTED:       { icon: 'time',            color: '#3B82F6', bg: '#EFF6FF', label: 'Waiting for payment · not money yet' },
  TIP_FAILED:        { icon: 'close-circle',    color: '#EF4444', bg: '#FEF2F2', label: 'Payment failed · no money' },
  TIP_NOT_COMPLETED: { icon: 'return-down-back', color: '#6B7280', bg: '#F3F4F6', label: 'Not paid · no money' },
  TIP_UPDATE:        { icon: 'refresh-circle',  color: '#B45309', bg: '#FEF3C7', label: 'Tip update'        },
  TIP_APPROVED:      { icon: 'shield-checkmark', color: '#0E7490', bg: '#ECFEFF', label: 'Approved by Netcash · not on your balance yet' },
  ADMIN_MESSAGE:   { icon: 'megaphone',         color: '#8B5CF6', bg: '#F5F3FF', label: 'Message'         },
  DEFAULT:         { icon: 'notifications',     color: '#6B7280', bg: '#F3F4F6', label: 'Notification'    },
};

function cfg(type: string) {
  return TYPE_CONFIG[type] ?? TYPE_CONFIG.DEFAULT;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)  return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7)  return `${days} days ago`;
  return new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
}

// ─── notification row ────────────────────────────────────────────────────────

/** What finally happened to a tip, shown on its "waiting for payment" message. */
const OUTCOME: Record<string, { text: string; color: string; bg: string; icon: keyof typeof Ionicons.glyphMap }> = {
  TIP_RECEIVED:      { text: 'Now: confirmed, money on your balance', color: '#047857', bg: '#D1FAE5', icon: 'checkmark-circle' },
  TIP_NOT_COMPLETED: { text: 'Now: not paid, no money received',      color: '#4B5563', bg: '#F3F4F6', icon: 'return-down-back' },
  TIP_FAILED:        { text: 'Now: payment failed, no money',          color: '#B91C1C', bg: '#FEE2E2', icon: 'close-circle' },
  TIP_APPROVED:      { text: 'Now: approved by Netcash, being added',  color: '#0E7490', bg: '#CFFAFE', icon: 'shield-checkmark' },
  WAITING:           { text: 'Still waiting: not money yet',           color: '#1D4ED8', bg: '#DBEAFE', icon: 'time' },
};

/** Older messages said "Tip started", which read like money arrived. */
const clearTitle = (item: AppNotification) =>
  item.type === 'TIP_STARTED' ? item.title.replace(/^Tip started/i, 'Waiting for payment') : item.title;

function NotifRow({ item, last, outcome }: { item: AppNotification; last?: boolean; outcome?: string }) {
  const c = cfg(item.type);
  const o = item.type === 'TIP_STARTED' ? OUTCOME[outcome || 'WAITING'] || OUTCOME.WAITING : null;
  const timestamp = (item.metadata?.eventAt as string | undefined) ?? item.createdAt;
  return (
    <View style={[s.row, !last && s.rowBorder, !item.read && s.rowUnread]}>
      {/* unread accent bar */}
      {!item.read && <View style={s.accentBar} />}

      {/* icon */}
      <View style={[s.iconWrap, { backgroundColor: c.bg }]}>
        <Ionicons name={c.icon} size={22} color={c.color} />
      </View>

      {/* body */}
      <View style={s.rowBody}>
        <View style={s.rowTop}>
          <Text style={s.rowTitle} numberOfLines={1}>{clearTitle(item)}</Text>
          <Text style={s.rowTime}>{timeAgo(timestamp)}</Text>
        </View>
        <Text style={s.rowType}>{c.label}</Text>
        <Text style={s.rowMessage} numberOfLines={item.type.startsWith('TIP_') ? 5 : 2}>{item.message}</Text>
        {o && (
          <View style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 4, marginTop: 6, backgroundColor: o.bg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
            <Ionicons name={o.icon} size={12} color={o.color} />
            <Text style={{ fontSize: 11, fontFamily: 'Nunito-Bold', color: o.color }}>{o.text}</Text>
          </View>
        )}
      </View>

      {/* unread dot */}
      {!item.read && <View style={s.unreadDot} />}
    </View>
  );
}

// ─── screen ──────────────────────────────────────────────────────────────────

export default function NotificationsScreen() {
  const router = useRouter();
  const { notifications, unreadCount, isLoading, fetchNotifications, markAllRead } = useNotifications();

  // attempt id -> newest outcome (confirmed, not paid, failed) for that tip.
  const outcomes = React.useMemo(() => {
    const m = new Map<string, { type: string; at: number }>();
    for (const n of notifications) {
      const id = n.metadata?.attemptId as string | undefined;
      if (!id || !['TIP_RECEIVED', 'TIP_NOT_COMPLETED', 'TIP_FAILED', 'TIP_APPROVED'].includes(n.type)) continue;
      const at = new Date((n.metadata?.eventAt as string) || n.createdAt).getTime();
      if (!m.has(id) || m.get(id)!.at < at) m.set(id, { type: n.type, at });
    }
    return m;
  }, [notifications]);
  const outcomeFor = (n: AppNotification) => outcomes.get(n.metadata?.attemptId as string)?.type;

  useEffect(() => {
    fetchNotifications();
    if (unreadCount > 0) markAllRead();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0D2F6E' }} edges={['top', 'left', 'right']}>

      {/* ── GRADIENT HEADER ─────────────────────────────────── */}
      <LinearGradient colors={['#0D2F6E', '#1A56A5', '#5B94D3']} style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>

        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={s.headerBadge}>
              <Text style={s.headerBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          onPress={markAllRead}
          style={[s.readAllBtn, unreadCount === 0 && { opacity: 0.4 }]}
          disabled={unreadCount === 0}
          activeOpacity={0.7}
        >
          <Ionicons name="checkmark-done" size={14} color="#fff" />
          <Text style={s.readAllText}>Read all</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* ── CONTENT ─────────────────────────────────────────── */}
      <View style={s.body}>
        {isLoading && notifications.length === 0 ? (
          <View style={s.center}>
            <ActivityIndicator size="large" color="#5B94D3" />
            <Text style={s.loadingText}>Loading notifications…</Text>
          </View>

        ) : notifications.length === 0 ? (
          <View style={s.center}>
            <View style={s.emptyIconWrap}>
              <Ionicons name="notifications-off-outline" size={40} color="#9CA3AF" />
            </View>
            <Text style={s.emptyTitle}>All caught up</Text>
            <Text style={s.emptySub}>
              You'll be notified here about payouts and every tip: when a customer goes to pay, and whether it was paid or not.
            </Text>
          </View>

        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
            {/* summary strip */}
            {unreadCount > 0 && (
              <View style={s.summaryStrip}>
                <View style={s.summaryDot} />
                <Text style={s.summaryText}>{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</Text>
              </View>
            )}

            {/* group into a card */}
            <View style={s.listCard}>
              {notifications.map((n, i) => (
                <NotifRow key={n.id} item={n} last={i === notifications.length - 1} outcome={outcomeFor(n)} />
              ))}
            </View>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

// ─── styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  // header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  headerCenter: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  headerTitle: {
    fontSize: 18, fontFamily: 'Nunito-Bold', color: '#fff',
  },
  headerBadge: {
    backgroundColor: '#EF4444', borderRadius: 10,
    minWidth: 20, height: 20,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 5,
  },
  headerBadgeText: {
    fontSize: 11, fontFamily: 'Nunito-Bold', color: '#fff',
  },
  readAllBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6,
    flexShrink: 0,
  },
  readAllText: {
    fontSize: 12, fontFamily: 'Nunito-SemiBold', color: '#fff',
  },

  // body
  body: { flex: 1, backgroundColor: '#F1F5F9' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  loadingText: {
    marginTop: 12, fontSize: 13, fontFamily: 'Nunito-Regular', color: '#9CA3AF',
  },

  // empty state
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#F3F4F6',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18, fontFamily: 'Nunito-Bold', color: '#374151', marginBottom: 8,
  },
  emptySub: {
    fontSize: 13, fontFamily: 'Nunito-Regular', color: '#6B7280',
    textAlign: 'center', lineHeight: 20,
  },

  // summary strip
  summaryStrip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginHorizontal: 16, marginTop: 16, marginBottom: 8,
  },
  summaryDot: {
    width: 7, height: 7, borderRadius: 4, backgroundColor: '#5B94D3',
  },
  summaryText: {
    fontSize: 11, fontFamily: 'Nunito-SemiBold',
    color: '#5B94D3', letterSpacing: 0.3,
  },

  // notification list card
  listCard: {
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },

  // row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    position: 'relative',
  },
  rowBorder: {
    borderBottomWidth: 1, borderBottomColor: '#F8FAFC',
  },
  rowUnread: {
    backgroundColor: '#FAFCFF',
  },
  accentBar: {
    position: 'absolute',
    left: 0, top: 0, bottom: 0,
    width: 3,
    backgroundColor: '#5B94D3',
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
  },

  iconWrap: {
    width: 46, height: 46, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12, flexShrink: 0,
  },

  rowBody: { flex: 1, minWidth: 0 },
  rowTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 1,
  },
  rowTitle: {
    flex: 1, fontSize: 14, fontFamily: 'Nunito-Bold', color: '#111827', marginRight: 8,
  },
  rowTime: {
    fontSize: 11, fontFamily: 'Nunito-Regular', color: '#9CA3AF', flexShrink: 0,
  },
  rowType: {
    fontSize: 10, fontFamily: 'Nunito-SemiBold',
    color: '#9CA3AF', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 3,
  },
  rowMessage: {
    fontSize: 13, fontFamily: 'Nunito-Regular', color: '#4B5563', lineHeight: 18,
  },

  unreadDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#5B94D3',
    marginLeft: 8, flexShrink: 0,
  },
});
