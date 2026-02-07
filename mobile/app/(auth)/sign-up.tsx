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
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSignUp, useAuth } from '@clerk/clerk-expo';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { signUpSchema, verificationCodeSchema } from '../../src/utils/validation';
import { getFriendlyErrorMessage } from '../../src/utils/clerkErrorHandler';
import { TippaLogo } from '../../components/TippaLogo';

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already signed in
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace('/');
    }
  }, [isLoaded, isSignedIn]);

  const onSignUpPress = async () => {
    if (!isLoaded) return;

    setError('');
    console.log('Sign up button pressed');

    // Validate inputs with Zod
    const validation = signUpSchema.safeParse({
      firstName,
      lastName,
      username,
      emailAddress,
      password,
    });

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      console.log('Validation error:', firstError.message);
      setError(firstError.message);
      Alert.alert('Validation Error', firstError.message);
      return;
    }

    setLoading(true);

    try {
      console.log('Creating sign up...');
      const result = await signUp.create({
        emailAddress,
        password,
        firstName,
        lastName,
        username,
      });

      console.log('Sign up result:', result.status);

      // Check if sign up is complete (no verification needed)
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        // SIMPLIFIED: Go directly to app, skip registration flow
        router.replace('/(tabs)');
        return;
      }

      // If verification is needed
      if (result.status === 'missing_requirements') {
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
        setPendingVerification(true);
        setError('');
        Alert.alert('Check Your Email', 'We sent you a 6-digit verification code. Please enter it below.');
      }
    } catch (err: any) {
      console.error('Sign up error:', JSON.stringify(err, null, 2));
      const errorMessage = getFriendlyErrorMessage(err);
      setError(errorMessage);
      Alert.alert('Sign Up Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onPressVerify = async () => {
    if (!isLoaded) return;

    setError('');
    console.log('Verify button pressed');

    // Validate code with Zod
    const validation = verificationCodeSchema.safeParse({ code });

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      console.log('Validation error:', firstError.message);
      setError(firstError.message);
      Alert.alert('Invalid Code', firstError.message);
      return;
    }

    setLoading(true);

    try {
      console.log('Verifying code...');
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      console.log('Sign up status after verification:', completeSignUp.status);
      console.log('Missing fields:', completeSignUp.missingFields);
      console.log('Unverified fields:', completeSignUp.unverifiedFields);
      console.log('Created session ID:', completeSignUp.createdSessionId);

      // If status is complete, create session
      if (completeSignUp.status === 'complete' && completeSignUp.createdSessionId) {
        await setActive({ session: completeSignUp.createdSessionId });
        // SIMPLIFIED: Go directly to app, skip registration flow
        router.replace('/(tabs)');
        return;
      }

      // If verification succeeded but status is still missing_requirements
      if (completeSignUp.status === 'missing_requirements') {
        console.log('Missing requirements after verification:', completeSignUp.missingFields);

        // Check if there's a session we can activate
        if (completeSignUp.createdSessionId) {
          await setActive({ session: completeSignUp.createdSessionId });
          // SIMPLIFIED: Go directly to app, skip registration flow
        router.replace('/(tabs)');
          return;
        }

        // If no session, alert user about missing fields
        const missing = completeSignUp.missingFields || [];
        const errorMsg = `Please complete: ${missing.join(', ')}. Contact support if this persists.`;
        setError(errorMsg);
        Alert.alert('Additional Information Required', errorMsg);
        return;
      }

      // Fallback error
      console.error('Unexpected sign up state:', JSON.stringify(completeSignUp, null, 2));
      const errorMsg = 'Unable to complete sign up. Please try again or contact support.';
      setError(errorMsg);
      Alert.alert('Error', errorMsg);

    } catch (err: any) {
      console.error('Verification error:', JSON.stringify(err, null, 2));

      // Handle already verified case
      if (err.errors?.[0]?.code === 'verification_already_verified') {
        try {
          await signUp.reload();

          if (signUp.status === 'complete' && signUp.createdSessionId) {
            await setActive({ session: signUp.createdSessionId });
            // SIMPLIFIED: Go directly to app, skip registration flow
        router.replace('/(tabs)');
            return;
          }

          Alert.alert('Already Verified', 'Your account is already verified. Please sign in.');
          router.push('/(auth)/sign-in');
        } catch (reloadErr) {
          console.error('Reload error:', reloadErr);
          Alert.alert('Account Exists', 'Please try signing in with your credentials.');
          router.push('/(auth)/sign-in');
        }
        return;
      }

      // Show friendly error message
      const errorMessage = getFriendlyErrorMessage(err);
      setError(errorMessage);
      Alert.alert('Verification Failed', errorMessage);
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
          <Text style={styles.title}>
            {pendingVerification ? 'Verify Email' : 'Create Account'}
          </Text>
          <Text style={styles.subtitle}>
            {pendingVerification
              ? 'Enter the code sent to your email'
              : 'Join Tippa CarGuard'}
          </Text>
        </LinearGradient>

        <View style={styles.formContainer}>
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {!pendingVerification ? (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>First Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="John"
                  placeholderTextColor="#9CA3AF"
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                  editable={!loading}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Last Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Mokoena"
                  placeholderTextColor="#9CA3AF"
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                  editable={!loading}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Username</Text>
                <TextInput
                  style={styles.input}
                  placeholder="johndoe"
                  placeholderTextColor="#9CA3AF"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>

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
                    placeholder="Create a strong password"
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
                onPress={onSignUpPress}
                disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>Sign Up</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Verification Code</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter 6-digit code"
                  placeholderTextColor="#9CA3AF"
                  value={code}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                  maxLength={6}
                  editable={!loading}
                />
              </View>

              <TouchableOpacity
                style={[styles.button, loading && styles.disabledButton]}
                onPress={onPressVerify}
                disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>Verify Email</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Link href="/(auth)/sign-in" asChild>
              <TouchableOpacity disabled={loading}>
                <Text style={styles.linkText}>Sign In</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
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
});
