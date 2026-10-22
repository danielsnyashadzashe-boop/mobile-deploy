/**
 * The printed lanyard card, drawn in the app.
 *
 * Matches the admin portal's printed cards (web/src/lib/ctaCard.ts): white A5 card,
 * "CTA QR Code", the CTA's name, "Tippa Digital Payment Solutions", the Tippa logo,
 * then the code, the help panel and the CTA ID. Two faces:
 *   - tippa:   the Auto card, with the Tippa QR and the three steps
 *   - netcash: the Manual card, with the uploaded Netcash QR artwork
 * All sizes are millimetres on the A5 card (148.5 x 210) scaled to `width`, so the
 * card looks the same at any size and saves cleanly as an image.
 */
import React, { forwardRef } from 'react';
import { View, Text, Image } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { BrandLogo } from './BrandLogo';

const A5_W = 148.5;
const A5_H = 210;

const SUPPORT_PHONE = '+27 11 454 1581';
const SUPPORT_EMAILS = 'support@tippa.co.za  ·  info@tippa.co.za';

interface Props {
  variant: 'tippa' | 'netcash';
  name: string;
  guardId: string;
  siteName?: string | null;
  tipLink?: string | null;
  netcashQrUrl?: string | null;
  width: number;
}

const titleCase = (s: string) => (s || '').replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

export const LanyardCard = forwardRef<View, Props>(function LanyardCard({ variant, name, guardId, siteName, tipLink, netcashQrUrl, width }, ref) {
  const mm = (v: number) => v * (width / A5_W);
  const pt = (v: number) => v * 0.3528 * (width / A5_W); // point sizes, as on the printed card
  const ink = '#0F172A';
  const indigo = '#4F46E5';
  const font = (size: number, bold = false, color = ink) => ({
    fontSize: pt(size), color, fontFamily: bold ? 'Nunito-Bold' : 'Nunito-Regular', fontWeight: (bold ? '700' : '400') as any, textAlign: 'center' as const,
  });

  return (
    <View ref={ref} collapsable={false} style={{ width, height: mm(A5_H), backgroundColor: '#FFFFFF', alignItems: 'center', paddingHorizontal: mm(9) }}>
      {/* Title block, the same on both faces */}
      <Text style={[font(19, true), { marginTop: mm(10) }]}>CTA QR Code</Text>
      <Text style={[font(12), { marginTop: mm(2) }]} numberOfLines={1}>CTA: {titleCase(name) || 'Unnamed'}</Text>
      {!!siteName && <Text style={[font(8, false, '#64748B'), { marginTop: mm(0.8) }]} numberOfLines={1}>{siteName}</Text>}
      <Text style={[font(13, true, indigo), { marginTop: mm(siteName ? 3.5 : 5.5) }]}>Tippa Digital Payment Solutions</Text>
      <View style={{ marginTop: mm(1.5) }}><BrandLogo width={mm(32)} /></View>

      {variant === 'tippa' ? (
        <>
          <Text style={[font(15, true, indigo), { marginTop: mm(2.5) }]}>Scan to tip</Text>
          <Text style={[font(7.6, false, '#64748B'), { marginTop: mm(0.6) }]}>No app needed. Tip in seconds with your phone.</Text>

          {/* The code in a thin grey frame, Tippa logo in the middle (highest error correction keeps it scannable) */}
          <View style={{ marginTop: mm(3), padding: mm(1), borderWidth: Math.max(1, mm(0.35)), borderColor: '#CBD5E1', backgroundColor: '#FFFFFF' }}>
            {tipLink ? (
              <View style={{ width: mm(78), height: mm(78), alignItems: 'center', justifyContent: 'center' }}>
                {/* A white margin of about four squares round the code, as scanners expect. */}
                <QRCode value={tipLink} size={mm(70)} color="#1E1B4B" backgroundColor="#FFFFFF" ecl="H" quietZone={mm(4)} />
                <View style={{ position: 'absolute', backgroundColor: '#FFFFFF', borderRadius: mm(2.5), paddingHorizontal: mm(1.8), paddingVertical: mm(1.2) }}>
                  <BrandLogo width={mm(14)} />
                </View>
              </View>
            ) : (
              <View style={{ width: mm(78), height: mm(78), alignItems: 'center', justifyContent: 'center' }}>
                <Text style={font(9, true, '#94A3B8')}>Tippa QR not available</Text>
              </View>
            )}
          </View>

          {/* How it works */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: mm(3.5) }}>
            {['Scan', 'Choose amount', 'Pay securely'].map((label, i) => (
              <View key={label} style={{ flexDirection: 'row', alignItems: 'center' }}>
                {i > 0 && <Text style={[font(10, true, '#94A3B8'), { marginHorizontal: mm(2) }]}>›</Text>}
                <View style={{ width: mm(6), height: mm(6), borderRadius: mm(3), backgroundColor: indigo, alignItems: 'center', justifyContent: 'center', marginRight: mm(1.6) }}>
                  <Text style={font(7, true, '#FFFFFF')}>{i + 1}</Text>
                </View>
                <Text style={font(7.8, true)}>{label}</Text>
              </View>
            ))}
          </View>
        </>
      ) : (
        <View style={{ marginTop: mm(4), width: mm(128), height: mm(110), alignItems: 'center', justifyContent: 'center' }}>
          {netcashQrUrl ? (
            <Image source={{ uri: netcashQrUrl }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
          ) : (
            <Text style={font(9, true, '#94A3B8')}>No Netcash QR on file</Text>
          )}
        </View>
      )}

      {/* Help panel, CTA ID and website: pinned to the bottom like the printed card */}
      <View style={{ position: 'absolute', bottom: mm(15), left: mm(13), right: mm(13), backgroundColor: '#EEF2FF', borderColor: '#C7D2FE', borderWidth: Math.max(1, mm(0.35)), borderRadius: mm(3), paddingVertical: mm(2.4), alignItems: 'center' }}>
        <Text style={font(8.6, true, '#4338CA')}>Need help or more information?</Text>
        <Text style={[font(7.2, false, '#64748B'), { marginTop: mm(0.5) }]}>Get in touch with the Tippa team any time.</Text>
        <Text style={[font(9, true), { marginTop: mm(0.6) }]}>{SUPPORT_PHONE}</Text>
        <Text style={[font(7.4, false, indigo), { marginTop: mm(0.4) }]}>{SUPPORT_EMAILS}</Text>
      </View>
      <Text style={[font(7, false, '#94A3B8'), { position: 'absolute', bottom: mm(8) }]}>{guardId}</Text>
      <Text style={[font(6.4, false, '#CBD5E1'), { position: 'absolute', bottom: mm(4.5) }]}>www.tippapaymentsolutions.com</Text>
    </View>
  );
});

export default LanyardCard;
