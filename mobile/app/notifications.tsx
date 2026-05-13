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
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useNotifications, AppNotification } from '../contexts/NotificationContext';

const TYPE_CONFIG: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }> = {
  PAYOUT_APPROVED: { icon: 'checkmark-circle', color: '#10B981', bg: '#ECFDF5' },
  PAYOUT_REJECTED: { icon: 'close-circle', color: '#EF4444', bg: '#FEF2F2' },
  PAYOUT_SENT:     { icon: 'send', color: '#5B94D3', bg: '#EFF6FF' },
  TIP_RECEIVED:    { icon: 'cash', color: '#F59E0B', bg: '#FFFBEB' },
  ADMIN_MESSAGE:   { icon: 'megaphone', color: '#8B5CF6', bg: '#F5F3FF' },
  DEFAULT:         { icon: 'notifications', color: '#6B7280', bg: '#F3F4F6' },
};

function getConfig(type: string) {
  return TYPE_CONFIG[type] || TYPE_CONFIG.DEFAULT;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function NotificationRow({ item }: { item: AppNotification }) {
  const cfg = getConfig(item.type);
  return (
    <View style={[styles.row, !item.read && styles.rowUnread]}>
      <View style={[styles.iconWrap, { backgroundColor: cfg.bg }]}>
        <Ionicons name={cfg.icon} size={22} color={cfg.color} />
      </View>
      <View style={styles.rowContent}>
        <View style={styles.rowHeader}>
          <Text style={styles.rowTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.rowTime}>{timeAgo(item.createdAt)}</Text>
        </View>
        <Text style={styles.rowMessage}>{item.message}</Text>
      </View>
      {!item.read && <View style={styles.unreadDot} />}
    </View>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { notifications, unreadCount, isLoading, fetchNotifications, markAllRead } = useNotifications();

  useEffect(() => {
    fetchNotifications();
    if (unreadCount > 0) {
      markAllRead();
    }
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      {unreadCount > 0 && (
        <View style={styles.topBar}>
          <Text style={styles.topBarText}>{unreadCount} unread</Text>
          <TouchableOpacity onPress={markAllRead} activeOpacity={0.7}>
            <Text style={styles.markReadBtn}>Mark all read</Text>
          </TouchableOpacity>
        </View>
      )}

      {isLoading && notifications.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#5B94D3" />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="notifications-off-outline" size={56} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No notifications yet</Text>
          <Text style={styles.emptySubtitle}>
            You'll be notified here when your payout is approved or sent.
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
          {notifications.map(n => (
            <NotificationRow key={n.id} item={n} />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#EFF6FF',
    borderBottomWidth: 1,
    borderBottomColor: '#BFDBFE',
  },
  topBarText:   { fontSize: 13, color: '#3B82F6', fontFamily: 'Nunito-SemiBold' },
  markReadBtn:  { fontSize: 13, color: '#5B94D3', fontFamily: 'Nunito-Bold' },

  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  rowUnread: { borderLeftWidth: 3, borderLeftColor: '#5B94D3' },

  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },

  rowContent: { flex: 1 },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  rowTitle:   { flex: 1, fontSize: 14, fontFamily: 'Nunito-Bold', color: '#111827', marginRight: 8 },
  rowTime:    { fontSize: 11, fontFamily: 'Nunito-Regular', color: '#9CA3AF', flexShrink: 0 },
  rowMessage: { fontSize: 13, fontFamily: 'Nunito-Regular', color: '#4B5563', lineHeight: 18 },

  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#5B94D3',
    marginLeft: 8,
    marginTop: 6,
    flexShrink: 0,
  },

  emptyTitle:    { fontSize: 17, fontFamily: 'Nunito-Bold', color: '#374151', marginTop: 16 },
  emptySubtitle: { fontSize: 13, fontFamily: 'Nunito-Regular', color: '#6B7280', textAlign: 'center', marginTop: 8, lineHeight: 20 },
});
