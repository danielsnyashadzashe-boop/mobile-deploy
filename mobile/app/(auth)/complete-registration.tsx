import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { useUser } from '@clerk/clerk-expo'
import { useRouter } from 'expo-router'
import DateTimePicker from '@react-native-community/datetimepicker'
import { Picker } from '@react-native-picker/picker'
import {
  registrationSchema,
  RegistrationFormData,
  LANGUAGES,
  PROVINCES,
  NATIONALITIES,
  DOCUMENT_TYPES,
} from '../../src/utils/registrationValidation'
import DocumentUpload from '../../components/DocumentUpload'

export default function CompleteRegistrationScreen() {
  const { user } = useUser()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date(2000, 0, 1))

  // Check if user has already registered
  useEffect(() => {
    async function checkExistingRegistration() {
      if (!user?.primaryEmailAddress?.emailAddress) {
        console.log('No user email, showing registration form')
        setChecking(false)
        return
      }

      console.log('Checking registration for:', user.primaryEmailAddress.emailAddress)

      try {
        const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001'
        console.log('API URL:', apiUrl)

        const response = await fetch(`${apiUrl}/api/registration/check`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clerkUserId: user.id,
            email: user.primaryEmailAddress.emailAddress
          }),
        })

        console.log('Registration check response status:', response.status)

        if (response.ok) {
          const data = await response.json()
          console.log('Registration check data:', data)

          // If user already has a registration, redirect appropriately
          if (data.hasCompletedRegistration) {
            console.log('User has completed registration, redirecting...')

            // If approved or can access app, go to dashboard
            if (data.currentStatus === 'approved' || data.canAccessApp) {
              console.log('User approved or can access app, redirecting to dashboard')
              router.replace('/(tabs)')
              return
            }

            // If pending approval, go to pending screen
            if (data.currentStatus === 'pending_approval') {
              console.log('Redirecting to pending screen')
              router.replace({
                pathname: '/(auth)/registration-pending',
                params: { registrationId: data.registrationId || 'N/A' }
              })
              return
            }

            // If rejected, show alert and stay (they shouldn't see this screen anyway)
            if (data.currentStatus === 'rejected') {
              Alert.alert(
                'Registration Rejected',
                'Your registration was rejected. Please contact support.',
                [{ text: 'OK', onPress: () => router.replace('/(auth)/sign-in') }]
              )
              return
            }
          } else {
            console.log('User has NOT completed registration, showing form')
          }
        } else {
          console.error('Registration check failed with status:', response.status)
          const errorData = await response.text()
          console.error('Error response:', errorData)
        }
      } catch (error) {
        console.error('❌ Error checking registration:', error)
        Alert.alert(
          'Connection Error',
          'Could not check registration status. Please check your internet connection.',
          [
            { text: 'Retry', onPress: () => checkExistingRegistration() },
            { text: 'Continue', onPress: () => setChecking(false) }
          ]
        )
        return
      }

      setChecking(false)
    }

    checkExistingRegistration()
  }, [user])

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    trigger,
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      phone: '',
      alternatePhone: '',
      idNumber: '',
      passportNumber: '',
      dateOfBirth: '',
      gender: 'Male',
      nationality: 'South African',
      addressLine1: '',
      addressLine2: '',
      suburb: '',
      city: '',
      province: 'Gauteng',
      postalCode: '',
      languages: [],
      bankName: '',
      accountNumber: '',
      accountHolder: '',
      branchCode: '',
      emergencyName: '',
      emergencyRelation: '',
      emergencyPhone: '',
      idDocumentUrl: '',
      passportPhotoUrl: '',
      proofOfResidenceUrl: '',
      bankStatementUrl: '',
      criminalRecordUrl: '',
      referenceLetterUrl: '',
    },
  })

  const totalSteps = 5

  const onSubmit = async (data: RegistrationFormData) => {
    setLoading(true)

    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001'

      const response = await fetch(`${apiUrl}/api/registration/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          name: user?.firstName || '',
          surname: user?.lastName || '',
          email: user?.primaryEmailAddress?.emailAddress || '',
          source: 'mobile_app',
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        Alert.alert(
          'Registration Submitted!',
          'Your registration has been submitted successfully. Please wait for admin approval.',
          [
            {
              text: 'OK',
              onPress: () => router.replace({
                pathname: '/(auth)/registration-pending',
                params: { registrationId: result.registrationId }
              }),
            },
          ]
        )
      } else {
        Alert.alert('Registration Failed', result.error || 'Please try again')
      }
    } catch (error) {
      console.error('Registration error:', error)
      Alert.alert('Error', 'Failed to submit registration. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleNext = async () => {
    let fieldsToValidate: any[] = []

    switch (currentStep) {
      case 1:
        fieldsToValidate = [
          'phone',
          'dateOfBirth',
          'gender',
          'nationality',
          'idNumber',
          'passportNumber',
        ]
        break
      case 2:
        fieldsToValidate = [
          'addressLine1',
          'suburb',
          'city',
          'province',
          'postalCode',
        ]
        break
      case 3:
        fieldsToValidate = ['languages']
        break
      case 4:
        fieldsToValidate = ['emergencyName', 'emergencyRelation', 'emergencyPhone']
        break
    }

    const isValid = await trigger(fieldsToValidate as any)

    if (isValid) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1)
  }

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3, 4, 5].map((step) => (
        <View key={step} style={styles.stepItem}>
          <View
            style={[
              styles.stepCircle,
              currentStep >= step && styles.stepCircleActive,
            ]}
          >
            <Text
              style={[
                styles.stepNumber,
                currentStep >= step && styles.stepNumberActive,
              ]}
            >
              {step}
            </Text>
          </View>
          {step < 5 && (
            <View
              style={[
                styles.stepLine,
                currentStep > step && styles.stepLineActive,
              ]}
            />
          )}
        </View>
      ))}
    </View>
  )

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Personal Information</Text>

      {/* User Info Badge */}
      <View style={styles.infoBadge}>
        <Ionicons name="checkmark-circle" size={20} color="#10B981" />
        <Text style={styles.infoBadgeText}>
          {user?.firstName} {user?.lastName} • {user?.primaryEmailAddress?.emailAddress}
        </Text>
      </View>

      <Controller
        control={control}
        name="phone"
        render={({ field: { onChange, onBlur, value } }) => (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number *</Text>
            <TextInput
              style={[styles.input, errors.phone && styles.inputError]}
              placeholder="0812345678"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              keyboardType="phone-pad"
            />
            {errors.phone && (
              <Text style={styles.errorText}>{errors.phone.message}</Text>
            )}
          </View>
        )}
      />

      <Controller
        control={control}
        name="alternatePhone"
        render={({ field: { onChange, onBlur, value } }) => (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Alternate Phone (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="0823456789"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              keyboardType="phone-pad"
            />
          </View>
        )}
      />

      {/* ID or Passport */}
      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={20} color="#5B94D3" />
        <Text style={styles.infoText}>
          Provide either SA ID Number OR Passport Number
        </Text>
      </View>

      <Controller
        control={control}
        name="idNumber"
        render={({ field: { onChange, onBlur, value } }) => (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>SA ID Number</Text>
            <TextInput
              style={[styles.input, errors.idNumber && styles.inputError]}
              placeholder="13-digit ID number"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              keyboardType="numeric"
              maxLength={13}
            />
          </View>
        )}
      />

      <Controller
        control={control}
        name="passportNumber"
        render={({ field: { onChange, onBlur, value } }) => (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Passport Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Passport number"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
            />
            {errors.idNumber && (
              <Text style={styles.errorText}>{errors.idNumber.message}</Text>
            )}
          </View>
        )}
      />

      <Controller
        control={control}
        name="dateOfBirth"
        render={({ field: { onChange, value } }) => (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date of Birth * (YYYY-MM-DD)</Text>
            <TouchableOpacity
              style={[styles.input, styles.datePickerButton, errors.dateOfBirth && styles.inputError]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={[styles.datePickerText, !value && styles.placeholderText]}>
                {value || '2002-10-21'}
              </Text>
              <Ionicons name="calendar-outline" size={20} color="#6B7280" />
            </TouchableOpacity>
            {errors.dateOfBirth && (
              <Text style={styles.errorText}>{errors.dateOfBirth.message}</Text>
            )}
            {showDatePicker && (
              <DateTimePicker
                value={value ? new Date(value) : selectedDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, date) => {
                  setShowDatePicker(Platform.OS === 'ios')
                  if (date) {
                    setSelectedDate(date)
                    const formattedDate = date.toISOString().split('T')[0]
                    onChange(formattedDate)
                  }
                }}
                maximumDate={new Date()}
                minimumDate={new Date(1900, 0, 1)}
              />
            )}
          </View>
        )}
      />

      <Controller
        control={control}
        name="gender"
        render={({ field: { onChange, value } }) => (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Gender *</Text>
            <View style={styles.radioGroup}>
              {['Male', 'Female', 'Other'].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={styles.radioButton}
                  onPress={() => onChange(option)}
                >
                  <View
                    style={[
                      styles.radioCircle,
                      value === option && styles.radioCircleSelected,
                    ]}
                  >
                    {value === option && <View style={styles.radioInner} />}
                  </View>
                  <Text style={styles.radioLabel}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      />

      <Controller
        control={control}
        name="nationality"
        render={({ field: { onChange, value } }) => (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nationality *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={value}
                onValueChange={onChange}
                style={styles.picker}
              >
                {NATIONALITIES.map((nationality) => (
                  <Picker.Item
                    key={nationality}
                    label={nationality}
                    value={nationality}
                  />
                ))}
              </Picker>
            </View>
            {errors.nationality && (
              <Text style={styles.errorText}>{errors.nationality.message}</Text>
            )}
          </View>
        )}
      />
    </View>
  )

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Address Information</Text>

      <Controller
        control={control}
        name="addressLine1"
        render={({ field: { onChange, onBlur, value } }) => (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address Line 1 *</Text>
            <TextInput
              style={[styles.input, errors.addressLine1 && styles.inputError]}
              placeholder="123 Main Street"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
            />
            {errors.addressLine1 && (
              <Text style={styles.errorText}>{errors.addressLine1.message}</Text>
            )}
          </View>
        )}
      />

      <Controller
        control={control}
        name="addressLine2"
        render={({ field: { onChange, onBlur, value } }) => (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address Line 2 (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Unit 4B"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
            />
          </View>
        )}
      />

      <Controller
        control={control}
        name="suburb"
        render={({ field: { onChange, onBlur, value } }) => (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Suburb *</Text>
            <TextInput
              style={[styles.input, errors.suburb && styles.inputError]}
              placeholder="Sandton"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
            />
            {errors.suburb && (
              <Text style={styles.errorText}>{errors.suburb.message}</Text>
            )}
          </View>
        )}
      />

      <Controller
        control={control}
        name="city"
        render={({ field: { onChange, onBlur, value } }) => (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>City *</Text>
            <TextInput
              style={[styles.input, errors.city && styles.inputError]}
              placeholder="Johannesburg"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
            />
            {errors.city && (
              <Text style={styles.errorText}>{errors.city.message}</Text>
            )}
          </View>
        )}
      />

      <Controller
        control={control}
        name="province"
        render={({ field: { onChange, value } }) => (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Province *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={value}
                onValueChange={onChange}
                style={styles.picker}
              >
                {PROVINCES.map((province) => (
                  <Picker.Item
                    key={province}
                    label={province}
                    value={province}
                  />
                ))}
              </Picker>
            </View>
            {errors.province && (
              <Text style={styles.errorText}>{errors.province.message}</Text>
            )}
          </View>
        )}
      />

      <Controller
        control={control}
        name="postalCode"
        render={({ field: { onChange, onBlur, value } }) => (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Postal Code *</Text>
            <TextInput
              style={[styles.input, errors.postalCode && styles.inputError]}
              placeholder="2196"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              keyboardType="numeric"
              maxLength={4}
            />
            {errors.postalCode && (
              <Text style={styles.errorText}>{errors.postalCode.message}</Text>
            )}
          </View>
        )}
      />
    </View>
  )

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Languages Spoken</Text>
      <Text style={styles.subtitle}>Select at least one language</Text>

      <Controller
        control={control}
        name="languages"
        render={({ field: { onChange, value } }) => (
          <View style={styles.languagesGrid}>
            {LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[
                  styles.languageButton,
                  value.includes(lang) && styles.languageButtonSelected,
                ]}
                onPress={() => {
                  const newValue = value.includes(lang)
                    ? value.filter((l) => l !== lang)
                    : [...value, lang]
                  onChange(newValue)
                }}
              >
                <Text
                  style={[
                    styles.languageText,
                    value.includes(lang) && styles.languageTextSelected,
                  ]}
                >
                  {lang}
                </Text>
                {value.includes(lang) && (
                  <Ionicons name="checkmark" size={16} color="#5B94D3" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      />
      {errors.languages && (
        <Text style={styles.errorText}>{errors.languages.message}</Text>
      )}
    </View>
  )

  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Emergency Contact & Banking</Text>

      {/* Emergency Contact */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Emergency Contact *</Text>

        <Controller
          control={control}
          name="emergencyName"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contact Name *</Text>
              <TextInput
                style={[styles.input, errors.emergencyName && styles.inputError]}
                placeholder="Jane Doe"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
              />
              {errors.emergencyName && (
                <Text style={styles.errorText}>{errors.emergencyName.message}</Text>
              )}
            </View>
          )}
        />

        <Controller
          control={control}
          name="emergencyRelation"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Relationship *</Text>
              <TextInput
                style={[styles.input, errors.emergencyRelation && styles.inputError]}
                placeholder="Mother"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
              />
              {errors.emergencyRelation && (
                <Text style={styles.errorText}>
                  {errors.emergencyRelation.message}
                </Text>
              )}
            </View>
          )}
        />

        <Controller
          control={control}
          name="emergencyPhone"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number *</Text>
              <TextInput
                style={[styles.input, errors.emergencyPhone && styles.inputError]}
                placeholder="0834567890"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                keyboardType="phone-pad"
              />
              {errors.emergencyPhone && (
                <Text style={styles.errorText}>{errors.emergencyPhone.message}</Text>
              )}
            </View>
          )}
        />
      </View>

      {/* Banking Details */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Banking Details (Optional)</Text>

        <Controller
          control={control}
          name="bankName"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bank Name</Text>
              <TextInput
                style={styles.input}
                placeholder="FNB"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
              />
            </View>
          )}
        />

        <Controller
          control={control}
          name="accountNumber"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Account Number</Text>
              <TextInput
                style={styles.input}
                placeholder="1234567890"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                keyboardType="numeric"
              />
            </View>
          )}
        />

        <Controller
          control={control}
          name="accountHolder"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Account Holder Name</Text>
              <TextInput
                style={styles.input}
                placeholder="John Doe"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
              />
            </View>
          )}
        />

        <Controller
          control={control}
          name="branchCode"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Branch Code</Text>
              <TextInput
                style={styles.input}
                placeholder="250655"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                keyboardType="numeric"
              />
            </View>
          )}
        />
      </View>
    </View>
  )

  const renderStep5 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Upload Documents</Text>
      <Text style={styles.subtitle}>
        All documents are optional but recommended for faster verification
      </Text>

      {DOCUMENT_TYPES.map((doc) => (
        <DocumentUpload
          key={doc.key}
          documentType={doc.type}
          label={doc.label}
          onUploadComplete={(url) => setValue(doc.key as any, url)}
          existingUrl={watch(doc.key as any)}
        />
      ))}
    </View>
  )

  // Show loading while checking existing registration
  if (checking) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5B94D3" />
        <Text style={styles.loadingText}>Checking registration status...</Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        {/* Header */}
        <LinearGradient
          colors={['#5B94D3', '#11468F']}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.headerTitle}>Complete Registration</Text>
          <Text style={styles.headerSubtitle}>Step {currentStep} of {totalSteps}</Text>
        </LinearGradient>

        {renderStepIndicator()}

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          {currentStep === 5 && renderStep5()}
        </ScrollView>

        {/* Navigation Buttons */}
        <View style={styles.footer}>
          {currentStep > 1 && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handlePrevious}
              disabled={loading}
            >
              <Text style={styles.secondaryButtonText}>Previous</Text>
            </TouchableOpacity>
          )}

          {currentStep < totalSteps ? (
            <TouchableOpacity
              style={[styles.primaryButton, currentStep === 1 && styles.fullWidth]}
              onPress={handleNext}
              disabled={loading}
            >
              <Text style={styles.primaryButtonText}>Next</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleSubmit(onSubmit)}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Submit Registration</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  flex: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E0E7FF',
    marginTop: 4,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleActive: {
    backgroundColor: '#5B94D3',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  stepNumberActive: {
    color: '#FFFFFF',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 4,
  },
  stepLineActive: {
    backgroundColor: '#5B94D3',
  },
  scrollView: {
    flex: 1,
  },
  stepContent: {
    padding: 24,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  infoBadgeText: {
    fontSize: 13,
    color: '#10B981',
    marginLeft: 8,
    flex: 1,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 13,
    color: '#1E40AF',
    marginLeft: 8,
    flex: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#DC2626',
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 4,
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 16,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  radioCircleSelected: {
    borderColor: '#5B94D3',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#5B94D3',
  },
  radioLabel: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  pickerText: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  datePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  datePickerText: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  languagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 6,
  },
  languageButtonSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#5B94D3',
  },
  languageText: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  languageTextSelected: {
    color: '#5B94D3',
    fontWeight: '600',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#5B94D3',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  fullWidth: {
    flex: 1,
  },
})
