import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useUser, useAuth } from '@clerk/clerk-expo'

export default function RegistrationPending() {
  const router = useRouter()
  const { user } = useUser()
  const { signOut } = useAuth()
  const params = useLocalSearchParams()

  const [registrationId, setRegistrationId] = useState<string>(params.registrationId as string || 'Loading...')
  const [status, setStatus] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING')
  const [loading, setLoading] = useState(false)

  // Auto-check status every 30 seconds
  useEffect(() => {
    const checkStatus = async () => {
      if (!user?.primaryEmailAddress?.emailAddress) return

      try {
        setLoading(true)
        const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001'
        const response = await fetch(`${apiUrl}/api/registration/check`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user.primaryEmailAddress.emailAddress
          }),
        })

        if (response.ok) {
          const data = await response.json()

          // Update registration ID if available from API
          if (data.registrationId) {
            setRegistrationId(data.registrationId)
          }

          if (data.currentStatus) {
            setStatus(data.currentStatus)

            // If approved and can access app, redirect to dashboard
            if (data.currentStatus === 'approved' && data.canAccessApp) {
              Alert.alert(
                'Registration Approved!',
                'Your registration has been approved. You can now access the app.',
                [{ text: 'Continue', onPress: () => router.replace('/(tabs)') }]
              )
            }
          }
        }
      } catch (error) {
        console.error('Error checking registration status:', error)
      } finally {
        setLoading(false)
      }
    }

    // Check immediately
    checkStatus()

    // Then check every 30 seconds
    const interval = setInterval(checkStatus, 30000)
    return () => clearInterval(interval)
  }, [user?.primaryEmailAddress?.emailAddress])

  const handleReturnToSignIn = async () => {
    try {
      await signOut()
      router.replace('/(auth)/sign-in')
    } catch (error) {
      console.error('Error signing out:', error)
      router.replace('/(auth)/sign-in')
    }
  }

  const handleContactSupport = () => {
    // TODO: Implement contact support (email, phone, etc.)
    console.log('Contact support')
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="time-outline" size={64} color="#5B94D3" />
        </View>
        <Text style={styles.title}>Registration Submitted</Text>
        <Text style={styles.subtitle}>
          Thank you for completing your registration. Your application is now being reviewed.
        </Text>
      </View>

      {/* Registration ID */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Registration ID</Text>
        <View style={styles.registrationIdContainer}>
          <Text style={styles.registrationId}>{registrationId}</Text>
          {loading && <ActivityIndicator size="small" color="#5B94D3" />}
        </View>
        <Text style={styles.cardHint}>
          Keep this ID for your records. You'll need it to track your application status.
        </Text>
      </View>

      {/* Status */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Current Status</Text>
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, styles.statusPending]}>
            <Text style={styles.statusText}>Pending Review</Text>
          </View>
        </View>
      </View>

      {/* Timeline */}
      <View style={styles.infoBox}>
        <Ionicons name="information-circle-outline" size={20} color="#5B94D3" />
        <Text style={styles.infoText}>
          The review process typically takes 2-3 business days. We'll notify you via email once your application has been reviewed.
        </Text>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleReturnToSignIn}
        >
          <Text style={styles.primaryButtonText}>Return to Sign In</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleContactSupport}
        >
          <Ionicons name="mail-outline" size={20} color="#5B94D3" />
          <Text style={styles.secondaryButtonText}>Contact Support</Text>
        </TouchableOpacity>
      </View>

      {/* Auto-refresh indicator */}
      {loading && (
        <View style={styles.refreshIndicator}>
          <ActivityIndicator size="small" color="#5B94D3" />
          <Text style={styles.refreshText}>Checking status...</Text>
        </View>
      )}
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
    backgroundColor: '#EFF6FF',
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
  cardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  registrationIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  registrationId: {
    fontSize: 20,
    fontWeight: '700',
    color: '#5B94D3',
    letterSpacing: 1,
  },
  cardHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    lineHeight: 18,
  },
  statusContainer: {
    alignItems: 'flex-start',
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
    marginLeft: 12,
  },
  actions: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#5B94D3',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#5B94D3',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5B94D3',
  },
  refreshIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
  },
  refreshText: {
    fontSize: 12,
    color: '#6B7280',
  },
})
