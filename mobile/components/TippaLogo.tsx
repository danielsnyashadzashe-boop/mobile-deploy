import React from 'react';
import { View, Image } from 'react-native';

interface TippaLogoProps {
  size?: number;
}

export function TippaLogo({ size = 80 }: TippaLogoProps) {
  return (
    <View 
      style={{ 
        width: size * 1.5, 
        height: size, 
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Image
        source={require('../assets/images/Tippa Logo.png')}
        style={{
          width: size * 1.5,
          height: size * 0.75,
          resizeMode: 'contain',
        }}
      />
    </View>
  );
}