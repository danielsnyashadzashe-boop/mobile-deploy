import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
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
      statusBarTranslucent={true}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Icon */}
          <View style={styles.iconWrapper}>
            <View style={[styles.iconCircle, { backgroundColor: config.bgColor }]}>
              <Ionicons name={config.icon} size={36} color={config.color} />
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>{title}</Text>

          {/* Message */}
          <Text style={styles.message}>{message}</Text>

          {/* Button */}
          <TouchableOpacity
            onPress={onClose}
            style={[styles.button, { backgroundColor: config.color }]}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>{buttonText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  iconWrapper: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Nunito-Bold',
    color: '#111827',
    marginBottom: 8,
  },
  message: {
    textAlign: 'center',
    fontSize: 15,
    fontFamily: 'Nunito-Regular',
    color: '#6B7280',
    lineHeight: 22,
    marginBottom: 24,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Nunito-SemiBold',
  },
});

export default AlertModal;
