import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  details?: { label: string; value: string }[];
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationModal({
  visible,
  title,
  message,
  details,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmColor = '#F59E0B',
  icon = 'alert-circle-outline',
  iconColor = '#F59E0B',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onCancel}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-white rounded-t-3xl p-6 pb-10">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold text-gray-900">{title}</Text>
            <TouchableOpacity onPress={onCancel} disabled={loading}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Icon */}
          <View className="items-center mb-4">
            <View
              className="w-16 h-16 rounded-full items-center justify-center"
              style={{ backgroundColor: `${iconColor}20` }}
            >
              <Ionicons name={icon} size={32} color={iconColor} />
            </View>
          </View>

          {/* Message */}
          <Text className="text-center text-gray-600 text-base mb-4">
            {message}
          </Text>

          {/* Details */}
          {details && details.length > 0 && (
            <View className="bg-gray-50 rounded-xl p-4 mb-6">
              {details.map((detail, index) => (
                <View
                  key={index}
                  className={`flex-row justify-between items-center ${
                    index < details.length - 1 ? 'mb-3 pb-3 border-b border-gray-200' : ''
                  }`}
                >
                  <Text className="text-gray-500 text-sm">{detail.label}</Text>
                  <Text className="text-gray-900 font-semibold text-sm">{detail.value}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Buttons */}
          <View className="flex-row space-x-3">
            <TouchableOpacity
              onPress={onCancel}
              disabled={loading}
              className="flex-1 py-4 rounded-xl bg-gray-100 items-center mr-2"
            >
              <Text className="text-gray-700 font-semibold text-base">{cancelText}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onConfirm}
              disabled={loading}
              className="flex-1 py-4 rounded-xl items-center ml-2"
              style={{ backgroundColor: confirmColor }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-semibold text-base">{confirmText}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default ConfirmationModal;
