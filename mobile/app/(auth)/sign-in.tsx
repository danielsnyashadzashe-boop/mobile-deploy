import React, { useState, useEffect } from 'react';
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
import { useSignIn, useAuth } from '@clerk/clerk-expo';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { signInSchema } from '../../src/utils/validation';
import { getFriendlyErrorMessage } from '../../src/utils/clerkErrorHandler';
import { TippaLogo } from '../../components/TippaLogo';
import { AlertModal } from '../../components/AlertModal';

type AlertType = 'error' | 'success' | 'info' | 'warning';

export default function SignInScreen() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [needsTwoFactor, setNeedsTwoFactor] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorStrategy, setTwoFactorStrategy] = useState<'totp' | 'phone_code' | 'backup_code'>('totp');
  const [modal, setModal] = useState<{ visible: boolean; type: AlertType; title: string; message: string }>({
    visible: false, type: 'error', title: '', message: '',
  });

  const showModal = (type: AlertType, title: string, message: string) => {
    setModal({ visible: true, type, title, message });
  };

  // Redirect if already signed in
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace('/');
    }
  }, [isLoaded, isSignedIn]);

  const checkRegistrationStatus = async (userId: string) => {
    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
      console.log('🔍 API URL being used:', apiUrl);
      console.log('🔍 Full URL:', `${apiUrl}/api/registration/check`);
      const response = await fetch(`${apiUrl}/api/registration/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clerkUserId: userId }),
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      }

      // If API call fails, allow access to app
      return { canAccessApp: true };
    } catch (error) {
      // On error, allow access to app
      return { canAccessApp: true };
    }
  };

  const onSignInPress = async () => {
    if (!isLoaded) return;

    setError('');

    // Validate inputs with Zod
    const validation = signInSchema.safeParse({
      emailAddress,
      password,
    });

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      setError(firstError.message);
      showModal('warning', 'Validation Error', firstError.message);
      return;
    }

    setLoading(true);

    try {
      const completeSignIn = await signIn.create({
        identifier: emailAddress,
        password,
      });

      console.log('✅ Sign in response status:', completeSignIn.status);
      console.log('✅ Created session ID:', completeSignIn.createdSessionId);

      // If sign-in is complete, activate session and go to app
      if (completeSignIn.status === 'complete') {
        await setActive({ session: completeSignIn.createdSessionId });
        // SIMPLIFIED: Go directly to app, skip registration flow
        router.replace('/(tabs)');
        return;
      }

      // Handle 2FA requirement
      if (completeSignIn.status === 'needs_second_factor') {
        const supportedFactors = completeSignIn.supportedSecondFactors;
        console.log('🔐 Supported 2FA factors:', JSON.stringify(supportedFactors));

        // Prefer phone_code (SMS), then totp, then whatever is available
        const phoneFactor = supportedFactors?.find((f: any) => f.strategy === 'phone_code');
        const totpFactor = supportedFactors?.find((f: any) => f.strategy === 'totp');
        const chosenFactor = phoneFactor || totpFactor || supportedFactors?.[0];
        const strategy = chosenFactor?.strategy;
        console.log('🔐 Using 2FA strategy:', strategy);

        if (strategy === 'phone_code') {
          setTwoFactorStrategy('phone_code');
          const result = await signIn.prepareSecondFactor({ strategy: 'phone_code' });
          console.log('🔐 SMS sent, prepare result:', JSON.stringify(result));
        } else if (strategy === 'totp') {
          setTwoFactorStrategy('totp');
        } else if (strategy) {
          setTwoFactorStrategy(strategy as any);
        }
        setNeedsTwoFactor(true);
        setError('');
        setLoading(false);
        return;
      }

      // Handle unexpected status
      console.error('❌ Unexpected sign-in status:', completeSignIn.status);
      const errorMsg = `Unable to complete sign in. Status: ${completeSignIn.status}. Please try again.`;
      setError(errorMsg);
      showModal('error', 'Error', errorMsg);

    } catch (err: any) {
      // Show friendly error message
      console.log('🔴 Sign in error:', err);
      console.log('🔴 Error details:', JSON.stringify(err, null, 2));
      const errorMessage = getFriendlyErrorMessage(err);
      setError(errorMessage);
      showModal('error', 'Sign In Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onVerifyTwoFactor = async () => {
    if (!isLoaded || !signIn) return;
    if (!twoFactorCode || twoFactorCode.length < 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const result = await signIn.attemptSecondFactor({
        strategy: twoFactorStrategy,
        code: twoFactorCode,
      });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.replace('/(tabs)');
      } else {
        const errorMsg = `Verification incomplete. Status: ${result.status}`;
        setError(errorMsg);
        showModal('error', 'Verification Failed', errorMsg);
      }
    } catch (err: any) {
      const errorMessage = getFriendlyErrorMessage(err);
      setError(errorMessage || 'Invalid verification code. Please try again.');
      showModal('error', 'Verification Failed', errorMessage || 'Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <LinearGradient
          colors={['#5B94D3', '#11468F']}
          style={styles.header}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}>
          <View style={styles.logoContainer}>
            <TippaLogo size={60} />
          </View>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to Tippa CarGuard</Text>
        </LinearGradient>

        <View style={styles.formContainer}>
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {needsTwoFactor ? (
            <>
              <View style={styles.twoFactorHeader}>
                <Ionicons name="shield-checkmark" size={48} color="#5B94D3" />
                <Text style={styles.twoFactorTitle}>Two-Factor Authentication</Text>
                <Text style={styles.twoFactorSubtitle}>
                  {twoFactorStrategy === 'totp'
                    ? 'Enter the 6-digit code from your authenticator app.'
                    : twoFactorStrategy === 'phone_code'
                    ? 'A 6-digit code has been sent to your registered phone number.'
                    : 'Enter the 6-digit verification code.'}
                </Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Verification Code</Text>
                <TextInput
                  style={[styles.input, styles.codeInput]}
                  placeholder="000000"
                  placeholderTextColor="#9CA3AF"
                  value={twoFactorCode}
                  onChangeText={(text) => setTwoFactorCode(text.replace(/[^0-9]/g, '').slice(0, 6))}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                  editable={!loading}
                />
              </View>

              <TouchableOpacity
                style={[styles.button, loading && styles.disabledButton]}
                onPress={onVerifyTwoFactor}
                disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>Verify</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backButton}
                onPress={() => {
                  setNeedsTwoFactor(false);
                  setTwoFactorCode('');
                  setError('');
                }}
                disabled={loading}>
                <Text style={styles.linkText}>Back to Sign In</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="your@email.com"
                  placeholderTextColor="#9CA3AF"
                  value={emailAddress}
                  onChangeText={setEmailAddress}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Enter your password"
                    placeholderTextColor="#9CA3AF"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowPassword(!showPassword)}
                    disabled={loading}>
                    <Ionicons
                      name={showPassword ? 'eye-off' : 'eye'}
                      size={24}
                      color="#6B7280"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.button, loading && styles.disabledButton]}
                onPress={onSignInPress}
                disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>Sign In</Text>
                )}
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Don't have an account? </Text>
                <Link href="/(auth)/sign-up" asChild>
                  <TouchableOpacity disabled={loading}>
                    <Text style={styles.linkText}>Sign Up</Text>
                  </TouchableOpacity>
                </Link>
              </View>
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
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 60,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#E0E7FF',
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 16,
  },
  button: {
    backgroundColor: '#5B94D3',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#5B94D3',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
  },
  linkText: {
    fontSize: 14,
    color: '#5B94D3',
    fontWeight: '600',
  },
  twoFactorHeader: {
    alignItems: 'center' as const,
    marginBottom: 24,
  },
  twoFactorTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    marginTop: 12,
    marginBottom: 8,
  },
  twoFactorSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center' as const,
    lineHeight: 20,
  },
  codeInput: {
    textAlign: 'center' as const,
    fontSize: 24,
    fontWeight: '700' as const,
    letterSpacing: 8,
  },
  backButton: {
    alignItems: 'center' as const,
    marginTop: 20,
    padding: 12,
  },
});
