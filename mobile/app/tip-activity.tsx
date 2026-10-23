/**
 * Tip activity: everything that happened with the CTA's tips, from both lanyards.
 *
 * Tippa QR tips show every attempt, including ones that did not finish, with the reason
 * and each step the customer took. Netcash QR tips show once the money reaches the
 * Netcash statement. Totals per QR make it easy to compare the two lanyards.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { getTipActivity, getTransactions, TipActivity, Transaction } from '../services/mobileApiService';
import { TipFeedRow } from '../components/TipFeedRow';
import { buildTipFeed, STATUS_HELP, STATUS_STYLE, FeedItem, rand } from '../src/lib/tips';
import { useLiveRefresh } from '../src/lib/useLiveRefresh';

const PERIODS = [7, 30, 90];
const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'paid', label: 'Confirmed' },
  { key: 'pending', label: 'Pending' },
  { key: 'not', label: 'Not completed' },
  { key: 'failed', label: 'Failed' },
] as const;
type FilterKey = (typeof FILTERS)[number]['key'];

export default function TipActivityScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [days, setDays] = useState(30);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [activity, setActivity] = useState<TipActivity | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setError(null);
    const [a, t] = await Promise.all([getTipActivity(token, days), getTransactions('', { limit: 100, type: 'TIP' }, token)]);
    if (!a.success) setError(a.error || 'Could not load tip activity');
    else setActivity(a.data!);
    if (t.success) setTransactions(t.data?.transactions || []);
    setLoading(false);
  }, [token, days]);

  useEffect(() => { setLoading(true); load(); }, [load]);
  useLiveRefresh(load);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const feed = useMemo(() => {
    if (!activity) return [];
    const since = Date.now() - days * 86400000;
    return buildTipFeed(activity.attempts, transactions).filter(i => new Date(i.at).getTime() >= since);
  }, [activity, transactions, days]);

  // Filters and counts go by the label, so tips from both QR codes are grouped the same way.
  const shown = useMemo(() => feed.filter(i => {
    const label = STATUS_STYLE[i.status].label;
    if (filter === 'paid') return label === 'Confirmed';
    if (filter === 'pending') return label === 'Pending';
    if (filter === 'not') return label === 'Not completed';
    if (filter === 'failed') return label === 'Failed';
    return true;
  }), [feed, filter]);

  const count = (label: string) => feed.filter(i => STATUS_STYLE[i.status].label === label).length;
  const paidTotal = feed.filter(i => i.status === 'SUCCESS').reduce((sum, i) => sum + (i.received ?? i.amount ?? 0), 0);

  const Header = (
    <View>
      <LinearGradient colors={['#5B94D3', '#11468F']} style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 22 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <TouchableOpacity onPress={() => router.back()} style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: 8 }}>
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowHelp(h => !h)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 }}>
            <Ionicons name="help-circle-outline" size={16} color="#FFFFFF" />
            <Text style={{ color: '#FFFFFF', fontSize: 12, fontFamily: 'Nunito-SemiBold' }}>What do these mean?</Text>
          </TouchableOpacity>
        </View>
        <Text style={{ color: '#FFFFFF', fontSize: 26, fontFamily: 'Nunito-Bold', marginTop: 14 }}>Tip activity</Text>
        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, fontFamily: 'Nunito-Regular', marginTop: 2 }}>Every tip you received or nearly received, and what happened to it.</Text>

        <View style={{ flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 16, padding: 14, marginTop: 16 }}>
          {[
            { label: 'Confirmed', value: count('Confirmed'), color: '#6EE7B7' },
            { label: 'Pending', value: count('Pending'), color: '#BFDBFE' },
            { label: 'Not completed', value: count('Not completed'), color: '#FDE68A' },
            { label: 'Failed', value: count('Failed'), color: '#FCA5A5' },
          ].map((x, i) => (
            <View key={x.label} style={{ flex: 1, alignItems: 'center', borderLeftWidth: i ? 1 : 0, borderLeftColor: 'rgba(255,255,255,0.2)' }}>
              <Text style={{ fontSize: 22, fontFamily: 'Nunito-Bold', color: x.color }}>{x.value}</Text>
              <Text style={{ fontSize: 11, fontFamily: 'Nunito-Regular', color: 'rgba(255,255,255,0.8)' }}>{x.label}</Text>
            </View>
          ))}
        </View>
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontFamily: 'Nunito-Regular', marginTop: 8, textAlign: 'center' }}>
          {rand(paidTotal)} received in the last {days} days
        </Text>
      </LinearGradient>

      {showHelp && (
        <View style={{ backgroundColor: '#FFFFFF', margin: 12, borderRadius: 14, padding: 14, gap: 9, borderWidth: 1, borderColor: '#E5E7EB' }}>
          {STATUS_HELP.map(h => (
            <View key={h.status} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
              <View style={{ backgroundColor: STATUS_STYLE[h.status].bg, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, minWidth: 86, alignItems: 'center' }}>
                <Text style={{ fontSize: 11, fontFamily: 'Nunito-Bold', color: STATUS_STYLE[h.status].color }}>{STATUS_STYLE[h.status].label}</Text>
              </View>
              <Text style={{ flex: 1, fontSize: 12, fontFamily: 'Nunito-Regular', color: '#374151', lineHeight: 17 }}>{h.text}</Text>
            </View>
          ))}
          <Text style={{ fontSize: 12, fontFamily: 'Nunito-Regular', color: '#6B7280', lineHeight: 17, marginTop: 2 }}>
            If a tip was not completed, no money was taken from the customer and nothing is owed to you for it.
          </Text>
        </View>
      )}

      {/* Period and filter */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 12, marginTop: 12, gap: 6 }}>
        {PERIODS.map(p => (
          <TouchableOpacity key={p} onPress={() => setDays(p)} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: days === p ? '#11468F' : '#E5E7EB' }}>
            <Text style={{ fontSize: 12, fontFamily: 'Nunito-SemiBold', color: days === p ? '#FFFFFF' : '#4B5563' }}>{p} days</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, marginTop: 8, marginBottom: 8, gap: 6 }}>
        {FILTERS.map(f => (
          <TouchableOpacity key={f.key} onPress={() => setFilter(f.key)} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: filter === f.key ? '#5B94D3' : '#FFFFFF', borderWidth: 1, borderColor: filter === f.key ? '#5B94D3' : '#E5E7EB' }}>
            <Text style={{ fontSize: 12, fontFamily: 'Nunito-SemiBold', color: filter === f.key ? '#FFFFFF' : '#4B5563' }}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }} edges={['top', 'left', 'right']}>
      <FlatList
        data={shown}
        keyExtractor={(i: FeedItem) => i.key}
        renderItem={({ item }) => <TipFeedRow item={item} />}
        ListHeaderComponent={Header}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#5B94D3" />}
        contentContainerStyle={{ paddingBottom: 30 }}
        ListEmptyComponent={
          loading ? (
            <View style={{ paddingVertical: 50, alignItems: 'center' }}><ActivityIndicator color="#5B94D3" /></View>
          ) : error ? (
            <View style={{ paddingVertical: 40, alignItems: 'center', paddingHorizontal: 30 }}>
              <Ionicons name="alert-circle-outline" size={32} color="#DC2626" />
              <Text style={{ fontSize: 14, fontFamily: 'Nunito-SemiBold', color: '#DC2626', marginTop: 8, textAlign: 'center' }}>{error}</Text>
              <TouchableOpacity onPress={onRefresh} style={{ marginTop: 12, backgroundColor: '#5B94D3', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 9 }}>
                <Text style={{ color: '#FFFFFF', fontFamily: 'Nunito-SemiBold' }}>Try again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ paddingVertical: 40, alignItems: 'center', paddingHorizontal: 30 }}>
              <Ionicons name="qr-code-outline" size={32} color="#9CA3AF" />
              <Text style={{ fontSize: 14, fontFamily: 'Nunito-SemiBold', color: '#374151', marginTop: 8 }}>No tips here yet</Text>
              <Text style={{ fontSize: 12, fontFamily: 'Nunito-Regular', color: '#9CA3AF', marginTop: 4, textAlign: 'center' }}>
                When customers scan your QR codes, every tip shows up here with what happened.
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}
