import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useUser } from '@clerk/clerk-expo'

export default function RegistrationVerification() {
  const router = useRouter()
  const { user } = useUser()
  const [loading, setLoading] = useState(false)
  const [verificationMethod, setVerificationMethod] = useState<'video' | 'in-person' | null>(null)

  const handleScheduleVideoCall = async () => {
    setVerificationMethod('video')
    Alert.alert(
      'Schedule Video Call',
      'Our team will contact you via email to schedule a video verification call. Please check your inbox.',
      [{ text: 'OK' }]
    )
    // TODO: Call API to request video verification
  }

  const handleScheduleInPerson = async () => {
    setVerificationMethod('in-person')
    Alert.alert(
      'Schedule In-Person Meeting',
      'Please contact our office to arrange an in-person verification. We will send you available locations via email.',
      [{ text: 'OK' }]
    )
    // TODO: Call API to request in-person verification
  }

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@tippa.co.za?subject=Verification%20Assistance')
  }

  const handleCallSupport = () => {
    Linking.openURL('tel:+27123456789')
  }

  const checkVerificationStatus = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001'
      const response = await fetch(`${apiUrl}/api/registration/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clerkUserId: user.id }),
      })

      if (response.ok) {
        const data = await response.json()

        // If verification is complete and user can access app
        if (data.canAccessApp) {
          Alert.alert(
            'Verification Complete!',
            'Your account has been activated. You can now access the app.',
            [{ text: 'Continue', onPress: () => router.replace('/(tabs)') }]
          )
        } else {
          Alert.alert(
            'Verification Pending',
            `Your verification is still in progress. Current status: ${data.currentStatus}`,
            [{ text: 'OK' }]
          )
        }
      }
    } catch (error) {
      console.error('Error checking verification status:', error)
      Alert.alert('Error', 'Could not check verification status. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="shield-checkmark" size={64} color="#10B981" />
        </View>
        <Text style={styles.title}>Identity Verification</Text>
        <Text style={styles.subtitle}>
          Your registration has been approved! Complete the final step to activate your account.
        </Text>
      </View>

      {/* Why Verification */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="information-circle" size={24} color="#5B94D3" />
          <Text style={styles.cardTitle}>Why Verification?</Text>
        </View>
        <Text style={styles.cardText}>
          To ensure the safety and security of our platform, we need to verify your identity. This helps protect both you and our customers.
        </Text>
      </View>

      {/* Verification Options */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Choose Verification Method</Text>

        {/* Video Call Option */}
        <TouchableOpacity
          style={[
            styles.optionCard,
            verificationMethod === 'video' && styles.optionCardSelected
          ]}
          onPress={handleScheduleVideoCall}
          disabled={loading}
        >
          <View style={styles.optionIcon}>
            <Ionicons name="videocam" size={32} color="#5B94D3" />
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Video Call Verification</Text>
            <Text style={styles.optionDescription}>
              Quick and convenient. Schedule a 10-minute video call with our team.
            </Text>
            <View style={styles.optionBadge}>
              <Ionicons name="time-outline" size={16} color="#059669" />
              <Text style={styles.optionBadgeText}>~10 minutes</Text>
            </View>
          </View>
          <Ionicons
            name={verificationMethod === 'video' ? 'checkmark-circle' : 'chevron-forward'}
            size={24}
            color={verificationMethod === 'video' ? '#10B981' : '#9CA3AF'}
          />
        </TouchableOpacity>

        {/* In-Person Option */}
        <TouchableOpacity
          style={[
            styles.optionCard,
            verificationMethod === 'in-person' && styles.optionCardSelected
          ]}
          onPress={handleScheduleInPerson}
          disabled={loading}
        >
          <View style={styles.optionIcon}>
            <Ionicons name="location" size={32} color="#5B94D3" />
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>In-Person Verification</Text>
            <Text style={styles.optionDescription}>
              Visit one of our offices. Bring your ID and proof of address.
            </Text>
            <View style={styles.optionBadge}>
              <Ionicons name="calendar-outline" size={16} color="#059669" />
              <Text style={styles.optionBadgeText}>By appointment</Text>
            </View>
          </View>
          <Ionicons
            name={verificationMethod === 'in-person' ? 'checkmark-circle' : 'chevron-forward'}
            size={24}
            color={verificationMethod === 'in-person' ? '#10B981' : '#9CA3AF'}
          />
        </TouchableOpacity>
      </View>

      {/* Required Documents */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="document-text" size={24} color="#5B94D3" />
          <Text style={styles.cardTitle}>Required Documents</Text>
        </View>
        <View style={styles.documentsList}>
          <View style={styles.documentItem}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.documentText}>Valid ID or Passport</Text>
          </View>
          <View style={styles.documentItem}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.documentText}>Proof of Address (recent)</Text>
          </View>
          <View style={styles.documentItem}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.documentText}>Clear, well-lit space (for video calls)</Text>
          </View>
        </View>
      </View>

      {/* Check Status Button */}
      <TouchableOpacity
        style={styles.checkStatusButton}
        onPress={checkVerificationStatus}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#5B94D3" />
        ) : (
          <>
            <Ionicons name="refresh" size={20} color="#5B94D3" />
            <Text style={styles.checkStatusText}>Check Verification Status</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Support Section */}
      <View style={styles.supportSection}>
        <Text style={styles.supportTitle}>Need Help?</Text>
        <View style={styles.supportButtons}>
          <TouchableOpacity
            style={styles.supportButton}
            onPress={handleCallSupport}
          >
            <Ionicons name="call" size={20} color="#5B94D3" />
            <Text style={styles.supportButtonText}>Call Us</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.supportButton}
            onPress={handleContactSupport}
          >
            <Ionicons name="mail" size={20} color="#5B94D3" />
            <Text style={styles.supportButtonText}>Email Us</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Info Box */}
      <View style={styles.infoBox}>
        <Ionicons name="shield-checkmark-outline" size={20} color="#059669" />
        <Text style={styles.infoText}>
          Your personal information is encrypted and secure. We never share your data with third parties.
        </Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 24,
    paddingBottom: 48,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  cardText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  optionCardSelected: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 8,
  },
  optionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  optionBadgeText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
  },
  documentsList: {
    gap: 12,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  documentText: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  checkStatusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#5B94D3',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 8,
  },
  checkStatusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5B94D3',
  },
  supportSection: {
    marginBottom: 24,
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
    textAlign: 'center',
  },
  supportButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  supportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#5B94D3',
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  supportButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5B94D3',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#D1FAE5',
    borderRadius: 12,
    padding: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#065F46',
    lineHeight: 20,
    marginLeft: 12,
  },
})
