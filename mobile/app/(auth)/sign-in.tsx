import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { TippaLogo } from '../../components/TippaLogo';
import { AlertModal } from '../../components/AlertModal';

type AlertType = 'error' | 'success' | 'info' | 'warning';

export default function SignInScreen() {
  const { login, sessionExpiredMessage } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<{ visible: boolean; type: AlertType; title: string; message: string }>({
    visible: false, type: 'error', title: '', message: '',
  });

  // Show session expiry message as soon as the screen loads
  React.useEffect(() => {
    if (sessionExpiredMessage) {
      setModal({ visible: true, type: 'warning', title: 'Session Ended', message: sessionExpiredMessage });
    }
  }, [sessionExpiredMessage]);

  const showModal = (type: AlertType, title: string, message: string) =>
    setModal({ visible: true, type, title, message });

  const formatPhone = (raw: string) => raw.replace(/[^\d+]/g, '');

  const handlePhoneNext = () => {
    const p = formatPhone(phone);
    if (p.length < 9) {
      showModal('warning', 'Invalid Number', 'Please enter a valid South African phone number.');
      return;
    }
    setStep('code');
  };

  const handleLogin = async () => {
    if (accessCode.length !== 6) {
      showModal('warning', 'Invalid Code', 'Please enter the 6-digit access code from your manager.');
      return;
    }

    setLoading(true);
    const result = await login(phone, accessCode);
    setLoading(false);

    if (result.success) {
      router.replace('/(tabs)');
    } else {
      const raw = result.error || '';
      let title = 'Sign In Failed';
      let message = raw;
      let type: AlertType = 'error';

      if (raw.includes('expired')) {
        title = 'Access Code Expired';
        message = 'Your access code has expired. Please contact your manager to generate a new one — it only takes a moment.';
        type = 'warning';
      } else if (raw.includes('No access code')) {
        title = 'No Access Code Set';
        message = 'Your account does not have an active access code. Please ask your manager to generate one for you from the admin portal.';
        type = 'info';
      } else if (raw.includes('Invalid phone') || raw.includes('Invalid phone number or access code')) {
        title = 'Incorrect Details';
        message = 'The phone number or access code you entered is incorrect. Please double-check and try again.';
        type = 'error';
      } else if (raw.includes('not active') || raw.includes('inactive') || raw.includes('suspended')) {
        title = 'Account Inactive';
        message = 'Your account is currently inactive. Please contact your manager to have it reactivated.';
        type = 'warning';
      } else if (raw.includes('connect') || raw.includes('network') || raw.includes('connection')) {
        title = 'Connection Problem';
        message = 'Could not reach the server. Please check your internet connection and try again.';
        type = 'warning';
      }

      showModal(type, title, message);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <LinearGradient
          colors={['#5B94D3', '#11468F']}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.logoContainer}>
            <TippaLogo size={220} />
          </View>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Tippa Payment Solutions</Text>
        </LinearGradient>

        <View style={styles.formContainer}>
          {/* Step indicator */}
          <View style={styles.stepRow}>
            <View style={[styles.stepDot, styles.stepDotActive]} />
            <View style={[styles.stepLine, step === 'code' && styles.stepLineActive]} />
            <View style={[styles.stepDot, step === 'code' && styles.stepDotActive]} />
          </View>

          {step === 'phone' ? (
            <>
              <Text style={styles.stepTitle}>Step 1 of 2</Text>
              <Text style={styles.stepSubtitle}>Enter your registered phone number</Text>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Phone Number</Text>
                <View style={styles.phoneWrapper}>
                  <Text style={styles.phonePrefix}>🇿🇦</Text>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="082 123 4567"
                    placeholderTextColor="#9CA3AF"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    autoFocus
                  />
                </View>
              </View>

              <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={18} color="#2563EB" />
                <Text style={styles.infoText}>
                  Use the phone number you registered with. Your manager will have given you an access code.
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.button, phone.length < 9 && styles.buttonDisabled]}
                onPress={handlePhoneNext}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonText}>Next</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.stepTitle}>Step 2 of 2</Text>
              <Text style={styles.stepSubtitle}>Enter the 6-digit access code from your manager</Text>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Access Code</Text>
                <TextInput
                  style={styles.codeInput}
                  placeholder="000000"
                  placeholderTextColor="#9CA3AF"
                  value={accessCode}
                  onChangeText={t => setAccessCode(t.replace(/[^0-9]/g, '').slice(0, 6))}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                />
              </View>

              <View style={styles.infoBox}>
                <Ionicons name="key-outline" size={18} color="#2563EB" />
                <Text style={styles.infoText}>
                  Your access code is provided by your manager when your account is set up. You can use it to sign in on any device.
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.button, (loading || accessCode.length !== 6) && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={loading || accessCode.length !== 6}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.buttonText}>Sign In</Text>
                    <Ionicons name="log-in-outline" size={18} color="#fff" />
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.backButton} onPress={() => { setStep('phone'); setAccessCode(''); }}>
                <Ionicons name="arrow-back" size={16} color="#5B94D3" />
                <Text style={styles.backText}>Back</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>

      <AlertModal
        visible={modal.visible}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onClose={() => setModal(prev => ({ ...prev, visible: false }))}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#F8F9FA' },
  scrollContainer: { flexGrow: 1 },
  header: {
    paddingTop: 32, paddingBottom: 24, paddingHorizontal: 24,
    borderBottomLeftRadius: 30, borderBottomRightRadius: 30, alignItems: 'center',
  },
  logoContainer: { marginBottom: 16 },
  title:    { fontSize: 36, fontWeight: '700', fontFamily: 'Nunito-Bold', color: '#FFFFFF', marginBottom: 8 },
  subtitle: { fontSize: 16, fontFamily: 'Nunito-Regular', color: '#E0E7FF' },

  formContainer: { flex: 1, paddingHorizontal: 24, paddingTop: 32 },

  stepRow:         { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  stepDot:         { width: 12, height: 12, borderRadius: 6, backgroundColor: '#D1D5DB' },
  stepDotActive:   { backgroundColor: '#5B94D3' },
  stepLine:        { flex: 1, height: 2, backgroundColor: '#D1D5DB', marginHorizontal: 6 },
  stepLineActive:  { backgroundColor: '#5B94D3' },

  stepTitle:    { fontSize: 13, fontFamily: 'Nunito-Regular', color: '#6B7280', marginBottom: 4 },
  stepSubtitle: { fontSize: 18, fontWeight: '700', fontFamily: 'Nunito-Bold', color: '#111827', marginBottom: 24 },

  inputContainer: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', fontFamily: 'Nunito-SemiBold', color: '#1A1A1A', marginBottom: 8 },

  phoneWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E7EB',
    paddingHorizontal: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  phonePrefix: { fontSize: 20, fontFamily: 'Nunito-Regular', marginRight: 10 },
  phoneInput:  { flex: 1, fontSize: 16, fontFamily: 'Nunito-Regular', paddingVertical: 14, color: '#111827' },

  codeInput: {
    backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E7EB',
    padding: 16, fontSize: 32, fontWeight: '700', fontFamily: 'Nunito-Bold', color: '#111827',
    textAlign: 'center', letterSpacing: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },

  infoBox: {
    flexDirection: 'row', gap: 10, backgroundColor: '#EFF6FF',
    borderRadius: 12, padding: 14, marginBottom: 24,
  },
  infoText: { flex: 1, fontSize: 13, fontFamily: 'Nunito-Regular', color: '#3B82F6', lineHeight: 20 },

  button: {
    backgroundColor: '#5B94D3', borderRadius: 12, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: '#5B94D3', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  buttonDisabled: { backgroundColor: '#9CA3AF', shadowOpacity: 0 },
  buttonText:     { color: '#FFFFFF', fontSize: 16, fontWeight: '700', fontFamily: 'Nunito-Bold' },

  backButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 20, padding: 12 },
  backText:   { color: '#5B94D3', fontSize: 14, fontWeight: '600', fontFamily: 'Nunito-SemiBold' },
});
