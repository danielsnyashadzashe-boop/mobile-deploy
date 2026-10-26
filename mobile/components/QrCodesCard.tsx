/**
 * "Your QR codes" on the home screen: both lanyards in one place.
 *
 *   Auto · Tippa QR      the new lanyard. Customers scan, choose an amount and pay; every
 *                        tip shows up in Tip activity, even ones that do not finish.
 *   Manual · Netcash QR  the original lanyard (the Netcash code uploaded for the CTA).
 *                        Payments go straight to Netcash; tips appear once the money
 *                        reaches the Netcash statement.
 *
 * Either code can be shown full screen for a customer, and either lanyard card can be
 * previewed and saved or shared as an image.
 */
import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Image, Modal, ScrollView, ActivityIndicator, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import QRCode from 'react-native-qrcode-svg';
import { BrandLogo } from './BrandLogo';
import { LanyardCard } from './LanyardCard';

type Which = 'tippa' | 'netcash';

interface Props {
  name: string;
  guardId: string;
  siteName?: string | null;
  status?: string | null;
  tipLink: string | null;
  netcashQrUrl: string | null;
  onOpenActivity: () => void;
  onMessage: (type: 'success' | 'error', title: string, message: string) => void;
}

const BLUE = '#5B94D3';
const NAVY = '#11468F';

const COPY: Record<Which, { title: string; tag: string; how: string; when: string }> = {
  tippa: {
    title: 'Tippa QR',
    tag: 'Auto · New lanyard',
    how: 'Customers scan, choose an amount and pay with Netcash. You see every tip in Tip activity, even ones that do not finish.',
    when: 'The money is added as soon as Netcash confirms it.',
  },
  netcash: {
    title: 'Netcash QR',
    tag: 'Manual · Original lanyard',
    how: 'Customers pay straight through Netcash with their banking or wallet app.',
    when: 'A tip shows here once the money reaches the Netcash statement. Card payments can take up to 2 days.',
  },
};

export function QrCodesCard({ name, guardId, siteName, status, tipLink, netcashQrUrl, onOpenActivity, onMessage }: Props) {
  const { width: screenW } = useWindowDimensions();
  // CTAs with a Netcash QR have both codes; everyone else has only the Tippa QR,
  // which the system makes for them, so there is nothing to switch between.
  const hasBoth = !!netcashQrUrl && !!tipLink;
  const [which, setWhich] = useState<Which>(tipLink ? 'tippa' : 'netcash');
  const [fullScreen, setFullScreen] = useState(false);
  const [lanyardOpen, setLanyardOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imgError, setImgError] = useState(false);
  const cardRef = useRef<View>(null);

  const available = which === 'tippa' ? !!tipLink : !!netcashQrUrl && !imgError;
  const copy = COPY[which];

  const pick = (w: Which) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setWhich(w);
  };

  const renderCode = (size: number) => {
    if (which === 'tippa') {
      return tipLink ? (
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
          {/* White margin (quiet zone) of about four squares so phone cameras lock on fast. */}
          <QRCode value={tipLink} size={size - Math.round(size * 0.14)} color="#1E1B4B" backgroundColor="#FFFFFF" ecl="H" quietZone={Math.round(size * 0.07)} />
          <View style={{ position: 'absolute', backgroundColor: '#FFFFFF', borderRadius: 6, paddingHorizontal: size * 0.015, paddingVertical: size * 0.012 }}>
            <BrandLogo width={size * 0.17} />
          </View>
        </View>
      ) : (
        <Empty size={size} text={'Tippa QR not available yet.\nPull down to refresh.'} />
      );
    }
    return netcashQrUrl && !imgError ? (
      <Image source={{ uri: netcashQrUrl }} style={{ width: size, height: size }} resizeMode="contain" onError={() => setImgError(true)} />
    ) : (
      <Empty size={size} text={'No Netcash QR on file.\nUse your Tippa QR, or ask your manager.'} />
    );
  };

  const saveLanyard = async () => {
    if (!cardRef.current) return;
    try {
      setSaving(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      // A5 at 300 DPI, ready to print.
      const uri = await captureRef(cardRef.current, { format: 'png', quality: 1, width: 1748, height: 2480, result: 'tmpfile' });
      const safe = (name || 'CTA').replace(/[^a-zA-Z0-9]/g, '_');
      const path = `${FileSystem.documentDirectory}Tippa_Lanyard_${which === 'tippa' ? 'Auto' : 'Manual'}_${safe}.png`;
      await FileSystem.copyAsync({ from: uri, to: path });
      try { await FileSystem.deleteAsync(uri, { idempotent: true }); } catch {}
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(path, { mimeType: 'image/png', dialogTitle: 'Save or share your lanyard card' });
      }
      onMessage('success', 'Lanyard card ready', 'Your card is saved as a print-ready A5 image (300 DPI).');
    } catch (e) {
      onMessage('error', 'Could not save the card', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const cardW = Math.min(screenW - 48, 420);

  return (
    <View style={{ backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 17, fontFamily: 'Nunito-Bold', color: '#111827' }}>Your QR codes</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#10B981', marginRight: 6 }} />
          <Text style={{ fontSize: 11, fontFamily: 'Nunito-SemiBold', color: '#047857' }}>{status === 'ACTIVE' || !status ? 'Active' : status}</Text>
        </View>
      </View>
      <Text style={{ fontSize: 12, fontFamily: 'Nunito-Regular', color: '#6B7280', marginTop: 2 }}>
        {hasBoth ? 'Both pay into the same balance. Customers can use either one.' : 'Customers scan this code to tip you. The money goes to your balance.'}
      </Text>

      {/* Toggle, only when there are two codes */}
      {hasBoth && <View style={{ flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 12, padding: 4, marginTop: 14 }}>
        {(['tippa', 'netcash'] as Which[]).map(w => {
          const on = which === w;
          return (
            <TouchableOpacity key={w} onPress={() => pick(w)} activeOpacity={0.8}
              style={{ flex: 1, paddingVertical: 9, borderRadius: 9, alignItems: 'center', backgroundColor: on ? (w === 'tippa' ? BLUE : '#0F172A') : 'transparent' }}>
              <Text style={{ fontSize: 13, fontFamily: 'Nunito-Bold', color: on ? '#FFFFFF' : '#4B5563' }}>{COPY[w].title}</Text>
              <Text style={{ fontSize: 10, fontFamily: 'Nunito-Regular', color: on ? 'rgba(255,255,255,0.8)' : '#9CA3AF' }}>{COPY[w].tag.split(' · ')[0]}</Text>
            </TouchableOpacity>
          );
        })}
      </View>}

      {/* The code */}
      <TouchableOpacity activeOpacity={0.85} disabled={!available} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setFullScreen(true); }}
        style={{ alignSelf: 'center', marginTop: 16, padding: 14, borderRadius: 16, borderWidth: 3, borderColor: which === 'tippa' ? BLUE : '#0F172A', backgroundColor: '#FFFFFF' }}>
        {renderCode(220)}
      </TouchableOpacity>
      <Text style={{ textAlign: 'center', marginTop: 8, fontSize: 15, fontFamily: 'Nunito-Bold', color: '#111827' }}>{name}</Text>
      <Text style={{ textAlign: 'center', fontSize: 11, fontFamily: 'Nunito-Regular', color: '#9CA3AF' }}>ID: {guardId || 'N/A'}{available ? '  ·  Tap the code to enlarge' : ''}</Text>

      {/* How this one works */}
      <View style={{ marginTop: 14, backgroundColor: which === 'tippa' ? '#EFF6FF' : '#F1F5F9', borderRadius: 12, padding: 12 }}>
        <Text style={{ fontSize: 12, fontFamily: 'Nunito-Bold', color: which === 'tippa' ? NAVY : '#0F172A' }}>{copy.tag}</Text>
        <Text style={{ fontSize: 12, fontFamily: 'Nunito-Regular', color: '#374151', marginTop: 4, lineHeight: 17 }}>{copy.how}</Text>
        <Text style={{ fontSize: 12, fontFamily: 'Nunito-Regular', color: '#6B7280', marginTop: 4, lineHeight: 17 }}>{copy.when}</Text>
      </View>

      {/* Actions */}
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
        <TouchableOpacity onPress={() => setLanyardOpen(true)} disabled={!available} activeOpacity={0.8}
          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, backgroundColor: available ? BLUE : '#E5E7EB' }}>
          <Ionicons name="id-card-outline" size={17} color={available ? '#FFFFFF' : '#9CA3AF'} />
          <Text style={{ fontSize: 13, fontFamily: 'Nunito-Bold', color: available ? '#FFFFFF' : '#9CA3AF' }}>Lanyard card</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onOpenActivity} activeOpacity={0.8}
          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE' }}>
          <Ionicons name="pulse-outline" size={17} color={NAVY} />
          <Text style={{ fontSize: 13, fontFamily: 'Nunito-Bold', color: NAVY }}>Tip activity</Text>
        </TouchableOpacity>
      </View>

      {/* Full screen code for a customer */}
      <Modal visible={fullScreen} animationType="fade" onRequestClose={() => setFullScreen(false)}>
        <View style={{ flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <TouchableOpacity onPress={() => setFullScreen(false)} style={{ position: 'absolute', top: 56, right: 20, backgroundColor: '#F3F4F6', borderRadius: 24, padding: 10 }}>
            <Ionicons name="close" size={26} color="#374151" />
          </TouchableOpacity>
          <BrandLogo width={150} />
          <Text style={{ fontSize: 22, fontFamily: 'Nunito-Bold', color: '#111827', marginTop: 10 }}>{which === 'tippa' ? 'Scan to tip' : 'Pay with your bank app'}</Text>
          <Text style={{ fontSize: 14, fontFamily: 'Nunito-Regular', color: '#6B7280', marginTop: 2 }}>{name}</Text>
          <View style={{ marginTop: 22, padding: 16, borderRadius: 24, borderWidth: 4, borderColor: which === 'tippa' ? BLUE : '#0F172A' }}>
            {renderCode(Math.min(screenW - 100, 330))}
          </View>
          <Text style={{ fontSize: 13, fontFamily: 'Nunito-Regular', color: '#9CA3AF', marginTop: 18, textAlign: 'center' }}>
            {which === 'tippa' ? 'Open your camera and point it at the code' : 'Scan with your banking or wallet app'}
          </Text>
        </View>
      </Modal>

      {/* Lanyard card preview and save */}
      <Modal visible={lanyardOpen} animationType="slide" onRequestClose={() => setLanyardOpen(false)}>
        <View style={{ flex: 1, backgroundColor: '#E5E7EB' }}>
          <View style={{ paddingTop: 54, paddingHorizontal: 20, paddingBottom: 12, backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, fontFamily: 'Nunito-Bold', color: '#111827' }}>Lanyard card</Text>
              <Text style={{ fontSize: 12, fontFamily: 'Nunito-Regular', color: '#6B7280' }}>{copy.title} · {copy.tag.split(' · ')[1]}</Text>
            </View>
            <TouchableOpacity onPress={() => setLanyardOpen(false)} style={{ backgroundColor: '#F3F4F6', borderRadius: 20, padding: 8 }}>
              <Ionicons name="close" size={22} color="#374151" />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ alignItems: 'center', padding: 24 }}>
            <View style={{ shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6 }}>
              <LanyardCard ref={cardRef} variant={which} name={name} guardId={guardId} siteName={siteName} tipLink={tipLink} netcashQrUrl={netcashQrUrl} width={cardW} />
            </View>
            <Text style={{ fontSize: 12, fontFamily: 'Nunito-Regular', color: '#4B5563', textAlign: 'center', marginTop: 16, lineHeight: 17, paddingHorizontal: 12 }}>
              Saved as an A5 image ready to print. Your manager can also print both cards back to back from the admin portal.
            </Text>
          </ScrollView>
          <View style={{ padding: 16, paddingBottom: 32, backgroundColor: '#FFFFFF' }}>
            <TouchableOpacity onPress={saveLanyard} disabled={saving} activeOpacity={0.85}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, backgroundColor: saving ? '#93C5FD' : BLUE }}>
              {saving ? <ActivityIndicator color="#FFFFFF" /> : <Ionicons name="download-outline" size={19} color="#FFFFFF" />}
              <Text style={{ fontSize: 15, fontFamily: 'Nunito-Bold', color: '#FFFFFF' }}>{saving ? 'Preparing…' : 'Save or share card'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Empty({ size, text }: { size: number; text: string }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name="qr-code-outline" size={size * 0.3} color="#D1D5DB" />
      <Text style={{ fontSize: 12, fontFamily: 'Nunito-Regular', color: '#9CA3AF', textAlign: 'center', marginTop: 8 }}>{text}</Text>
    </View>
  );
}

export default QrCodesCard;
