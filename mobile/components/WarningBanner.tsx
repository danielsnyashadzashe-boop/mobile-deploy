import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';

type BannerType = 'error' | 'warning' | 'info';

interface WarningBannerProps {
  type: BannerType;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  action?: {
    label: string;
    onPress: () => void;
  };
  contactPhone?: string;  // For "call manager/admin" actions
}

export function WarningBanner({
  type,
  icon,
  title,
  message,
  action,
  contactPhone
}: WarningBannerProps) {
  // Determine colors based on type
  const colors = {
    error: {
      bg: '#FEE2E2',        // red-100
      border: '#FCA5A5',     // red-300
      text: '#991B1B',       // red-800
      icon: '#DC2626',       // red-600
    },
    warning: {
      bg: '#FEF3C7',        // amber-100
      border: '#FCD34D',     // amber-300
      text: '#92400E',       // amber-800
      icon: '#F59E0B',       // amber-500
    },
    info: {
      bg: '#DBEAFE',        // blue-100
      border: '#93C5FD',     // blue-300
      text: '#1E40AF',       // blue-800
      icon: '#3B82F6',       // blue-500
    },
  };

  const color = colors[type];

  const handleAction = () => {
    if (contactPhone) {
      // If contact phone is provided, open phone dialer
      Linking.openURL(`tel:${contactPhone}`);
    } else if (action) {
      // Otherwise use custom action
      action.onPress();
    }
  };

  return (
    <View
      style={{
        backgroundColor: color.bg,
        borderWidth: 1,
        borderColor: color.border,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
      }}
    >
      {/* Header with icon */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}>
        <Ionicons
          name={icon}
          size={24}
          color={color.icon}
          style={{ marginRight: 12, marginTop: 2 }}
        />
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: color.text,
              marginBottom: 4
            }}
          >
            {title}
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: color.text,
              lineHeight: 20
            }}
          >
            {message}
          </Text>
        </View>
      </View>

      {/* Action button */}
      {(action || contactPhone) && (
        <TouchableOpacity
          onPress={handleAction}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: color.icon,
            paddingVertical: 10,
            paddingHorizontal: 16,
            borderRadius: 8,
            marginTop: 12,
          }}
        >
          <Ionicons
            name={contactPhone ? "call" : "arrow-forward"}
            size={18}
            color="#FFFFFF"
            style={{ marginRight: 8 }}
          />
          <Text
            style={{
              fontSize: 14,
              fontWeight: '600',
              color: '#FFFFFF'
            }}
          >
            {contactPhone ? "Call Now" : action?.label}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// Pre-configured banner components for common scenarios
export function NoLocationBanner({ onContactPress }: { onContactPress?: () => void }) {
  return (
    <WarningBanner
      type="error"
      icon="location-outline"
      title="Location Not Assigned"
      message="You haven't been assigned to a location yet. Please contact your manager or admin to get started."
      action={onContactPress ? {
        label: "Contact Support",
        onPress: onContactPress
      } : undefined}
    />
  );
}

export function NoManagerBanner({ onContactPress }: { onContactPress?: () => void }) {
  return (
    <WarningBanner
      type="warning"
      icon="people-outline"
      title="No Manager Assigned"
      message="You don't have a manager assigned. Contact admin for support and approvals."
      action={onContactPress ? {
        label: "Contact Admin",
        onPress: onContactPress
      } : undefined}
    />
  );
}

export function ManagerContactCard({
  manager
}: {
  manager: {
    name: string;
    phone: string;
    email?: string | null;
  }
}) {
  return (
    <View
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: '#3B82F6',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
        >
          <Ionicons name="person" size={24} color="#FFFFFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 2 }}>
            YOUR MANAGER
          </Text>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827' }}>
            {manager.name}
          </Text>
        </View>
      </View>

      {/* Contact buttons */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TouchableOpacity
          onPress={() => Linking.openURL(`tel:${manager.phone}`)}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#3B82F6',
            paddingVertical: 10,
            borderRadius: 8,
          }}
        >
          <Ionicons name="call" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF' }}>
            Call
          </Text>
        </TouchableOpacity>

        {manager.email && (
          <TouchableOpacity
            onPress={() => Linking.openURL(`mailto:${manager.email}`)}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#10B981',
              paddingVertical: 10,
              borderRadius: 8,
            }}
          >
            <Ionicons name="mail" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF' }}>
              Email
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={() => Linking.openURL(`sms:${manager.phone}`)}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#8B5CF6',
            paddingVertical: 10,
            borderRadius: 8,
          }}
        >
          <Ionicons name="chatbubble" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF' }}>
            SMS
          </Text>
        </TouchableOpacity>
      </View>

      {/* Phone number display */}
      <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E5E7EB' }}>
        <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>
          Phone Number
        </Text>
        <Text style={{ fontSize: 14, fontWeight: '500', color: '#111827' }}>
          {manager.phone}
        </Text>
      </View>
    </View>
  );
}
