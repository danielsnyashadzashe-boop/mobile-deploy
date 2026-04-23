import React from 'react';
import { Text as RNText, TextProps, StyleSheet } from 'react-native';

// Weight → Nunito font family map
const weightToFont: Record<string, string> = {
  '400': 'Nunito-Regular',
  'normal': 'Nunito-Regular',
  '500': 'Nunito-Medium',
  '600': 'Nunito-SemiBold',
  '700': 'Nunito-Bold',
  '800': 'Nunito-Bold',
  'bold': 'Nunito-Bold',
};

export function Text({ style, ...props }: TextProps) {
  const flatStyle = StyleSheet.flatten(style) || {};
  const weight = String(flatStyle.fontWeight || 'normal');
  const fontFamily = flatStyle.fontFamily || weightToFont[weight] || 'Nunito-Regular';

  return (
    <RNText
      style={[{ fontFamily }, style]}
      {...props}
    />
  );
}
