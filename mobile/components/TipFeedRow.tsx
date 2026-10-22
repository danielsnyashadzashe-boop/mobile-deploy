/**
 * One tip in the tip feed, from either lanyard: which QR it came through, what
 * happened (status), the amount, and one plain sentence explaining it. Tippa QR tips
 * can be opened to see each step the customer took and when.
 */
import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CHANNEL_STYLE, STATUS_STYLE, STEP_LABEL, FeedItem, rand, when } from '../src/lib/tips';

export function TipFeedRow({ item, compact = false }: { item: FeedItem; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const s = STATUS_STYLE[item.status];
  const c = CHANNEL_STYLE[item.channel];
  const paid = item.status === 'SUCCESS';
  const steps = item.attempt?.steps || [];
  const canOpen = !compact && steps.length > 0;

  return (
    <TouchableOpacity activeOpacity={canOpen ? 0.7 : 1} onPress={() => canOpen && setOpen(o => !o)}
      style={{ backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', flexDirection: 'row', gap: 12 }}>
      <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: s.bg, alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
        <Ionicons name={s.icon as any} size={19} color={s.color} />
      </View>

      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 }}>
            <View style={{ backgroundColor: s.bg, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 }}>
              <Text style={{ fontSize: 11, fontFamily: 'Nunito-Bold', color: s.color }}>{s.label}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: c.bg, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
              <Ionicons name={c.icon as any} size={10} color={c.color} />
              <Text style={{ fontSize: 10, fontFamily: 'Nunito-Bold', color: c.color }}>{c.label}</Text>
            </View>
          </View>
          <Text style={{ fontSize: 15, fontFamily: 'Nunito-Bold', color: paid ? '#059669' : '#9CA3AF', textDecorationLine: paid || item.status === 'PENDING' || item.status === 'IN_PROGRESS' ? 'none' : 'line-through' }}>
            {paid ? `+${rand(item.received ?? item.amount)}` : rand(item.amount)}
          </Text>
        </View>

        <Text style={{ fontSize: 13, fontFamily: 'Nunito-Regular', color: '#374151', marginTop: 5, lineHeight: 18 }} numberOfLines={compact ? 2 : undefined}>
          {item.explanation}
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 5 }}>
          <Text style={{ fontSize: 11, fontFamily: 'Nunito-Regular', color: '#9CA3AF' }}>{when(item.at)}</Text>
          {canOpen && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
              <Text style={{ fontSize: 11, fontFamily: 'Nunito-SemiBold', color: '#5B94D3' }}>{open ? 'Hide steps' : 'See steps'}</Text>
              <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={12} color="#5B94D3" />
            </View>
          )}
        </View>

        {open && (
          <View style={{ marginTop: 10, borderLeftWidth: 2, borderLeftColor: '#DBEAFE', paddingLeft: 10, gap: 6 }}>
            {steps.map((st, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 8 }}>
                <Text style={{ fontSize: 11, fontFamily: 'Nunito-SemiBold', color: '#6B7280', width: 54 }}>
                  {new Date(st.at).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </Text>
                <Text style={{ fontSize: 12, fontFamily: 'Nunito-Regular', color: '#374151', flex: 1 }}>
                  {STEP_LABEL[st.kind] || st.kind}{st.kind === 'AMOUNT_CHOSEN' && st.amount ? ` · R${Number(st.amount).toFixed(2)}` : ''}
                </Text>
              </View>
            ))}
            {item.attempt?.secondsToPay != null && (
              <Text style={{ fontSize: 11, fontFamily: 'Nunito-Regular', color: '#9CA3AF' }}>Took {item.attempt.secondsToPay}s from opening the page to pressing Pay.</Text>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default TipFeedRow;
