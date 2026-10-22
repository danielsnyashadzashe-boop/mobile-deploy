/**
 * The Tippa logo at an exact width.
 *
 * TippaLogoPNG.png is a 596 x 842 canvas with the logo in a 362 x 146 box at (117, 349)
 * and transparent padding around it. Cropping to that box exactly (instead of zooming
 * the whole image) keeps the logo sharp and the right size anywhere, including small
 * spots like the middle of a QR code or a printed lanyard card.
 */
import React from 'react';
import { View, Image } from 'react-native';

const SRC_W = 596, SRC_H = 842;
const BOX = { x: 117, y: 349, w: 362, h: 146 };

export function BrandLogo({ width }: { width: number }) {
  const k = width / BOX.w;
  return (
    <View style={{ width, height: BOX.h * k, overflow: 'hidden' }}>
      <Image
        source={require('../assets/images/TippaLogoPNG.png')}
        style={{ position: 'absolute', left: -BOX.x * k, top: -BOX.y * k, width: SRC_W * k, height: SRC_H * k }}
        resizeMode="stretch"
      />
    </View>
  );
}

export default BrandLogo;
