import React from 'react';
import { View } from 'react-native';
import Svg, { Rect, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';

interface TippaLogoProps {
  size?: number;
}

export function TippaLogo({ size = 80 }: TippaLogoProps) {
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 80 80">
        <Defs>
          <LinearGradient id="tippaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#10B981" />
            <Stop offset="100%" stopColor="#059669" />
          </LinearGradient>
        </Defs>
        {/* Background square with rounded corners */}
        <Rect
          x="0"
          y="0"
          width="80"
          height="80"
          rx="16"
          ry="16"
          fill="url(#tippaGradient)"
        />
        {/* Yellow accent square */}
        <Rect
          x="12"
          y="12"
          width="16"
          height="16"
          rx="4"
          ry="4"
          fill="#FCD34D"
        />
        {/* Tippa text */}
        <SvgText
          x="40"
          y="35"
          fontSize="18"
          fontWeight="bold"
          fill="white"
          textAnchor="middle"
          fontFamily="System"
        >
          tippa
        </SvgText>
        {/* Subtitle */}
        <SvgText
          x="40"
          y="55"
          fontSize="10"
          fill="rgba(255,255,255,0.9)"
          textAnchor="middle"
          fontFamily="System"
        >
          Car Guard App
        </SvgText>
      </Svg>
    </View>
  );
}