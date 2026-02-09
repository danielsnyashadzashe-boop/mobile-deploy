import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type AlertType = 'error' | 'success' | 'info' | 'warning';

interface AlertModalProps {
  visible: boolean;
  type?: AlertType;
  title: string;
  message: string;
  buttonText?: string;
  onClose: () => void;
}

const alertConfig: Record<AlertType, { icon: keyof typeof Ionicons.glyphMap; color: string; bgColor: string }> = {
  error: { icon: 'close-circle', color: '#DC2626', bgColor: '#FEE2E2' },
  success: { icon: 'checkmark-circle', color: '#16A34A', bgColor: '#DCFCE7' },
  info: { icon: 'information-circle', color: '#2563EB', bgColor: '#DBEAFE' },
  warning: { icon: 'warning', color: '#D97706', bgColor: '#FEF3C7' },
};

export function AlertModal({
  visible,
  type = 'error',
  title,
  message,
  buttonText = 'OK',
  onClose,
}: AlertModalProps) {
  const config = alertConfig[type];

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black/50 px-6">
        <View className="bg-white rounded-2xl p-6 w-full max-w-sm">
          {/* Icon */}
          <View className="items-center mb-4">
            <View
              className="w-16 h-16 rounded-full items-center justify-center"
              style={{ backgroundColor: config.bgColor }}
            >
              <Ionicons name={config.icon} size={36} color={config.color} />
            </View>
          </View>

          {/* Title */}
          <Text className="text-center text-xl font-bold text-gray-900 mb-2">
            {title}
          </Text>

          {/* Message */}
          <Text className="text-center text-gray-600 text-base mb-6 leading-6">
            {message}
          </Text>

          {/* Button */}
          <TouchableOpacity
            onPress={onClose}
            className="py-4 rounded-xl items-center"
            style={{ backgroundColor: config.color }}
          >
            <Text className="text-white font-semibold text-base">{buttonText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default AlertModal;
