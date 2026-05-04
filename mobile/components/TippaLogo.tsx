import React from 'react';
import { View, Image } from 'react-native';

interface TippaLogoProps {
  size?: number;
}

export function TippaLogo({ size = 80 }: TippaLogoProps) {
  // The PNG has large transparent/white padding — scale up and clip to show only the logo
  const containerW = size * 2;
  const containerH = size * 0.5;
  const imageW = containerW * 2.2;
  const imageH = containerH * 2.2;
  return (
    <View style={{ width: containerW, height: containerH, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
      <Image
        source={require('../assets/images/TippaLogoPNG.png')}
        style={{ width: imageW, height: imageH, resizeMode: 'contain' }}
      />
    </View>
  );
}