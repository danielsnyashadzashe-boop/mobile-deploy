import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { formatCurrency } from '../../data/mockData';
import { useGuard } from '../../contexts/GuardContext';
import { updateGuardProfile } from '../../services/mobileApiService';

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const { guardData, clearGuardData, isLoading: guardLoading } = useGuard();
  const [isEditing, setIsEditing] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState({
    name: user?.fullName || '',
    phoneNumber: user?.primaryPhoneNumber?.phoneNumber || '',
    email: user?.primaryEmailAddress?.emailAddress || '',
    bankName: '',
    accountNumber: '',
    accountType: '',
    branchCode: '',
  });

  // Update profile data when guard data is available from context
  useEffect(() => {
    if (guardData && !guardLoading) {
      setProfileData({
        name: guardData.fullName || '',
        phoneNumber: guardData.phone || '',
        email: guardData.email || '',
        bankName: '',
        accountNumber: '',
        accountType: '',
        branchCode: '',
      });
      setError(null);
    } else if (!guardLoading && !guardData) {
      setError('Guard profile not found. Please link your account.');
    }
  }, [guardData, guardLoading]);

  const handleSave = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'Not authenticated. Please sign in again.');
      return;
    }

    setLoading(true);
    try {
      // Parse name into first and last name
      const nameParts = profileData.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const response = await updateGuardProfile(user.id, {
        name: firstName,
        surname: lastName,
        phone: profileData.phoneNumber,
        bankName: profileData.bankName || undefined,
        accountNumber: profileData.accountNumber || undefined,
        branchCode: profileData.branchCode || undefined,
        accountType: profileData.accountType || undefined,
      });

      if (response.success) {
        setIsEditing(false);
        Alert.alert('Success', 'Profile updated successfully');
      } else {
        Alert.alert('Error', response.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearGuardData(); // Clear guard data from context and storage
              await signOut();
              router.replace('/(auth)/sign-in');
            } catch (error) {
              console.error('Sign out error:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="bg-white px-4 py-5 border-b border-gray-100 flex-row justify-between items-center">
          <Text className="text-2xl font-bold text-gray-900">Profile</Text>
          <TouchableOpacity
            onPress={() => isEditing ? handleSave() : setIsEditing(true)}
            style={{ backgroundColor: '#5B94D3' }}
            className="px-4 py-2 rounded-lg"
          >
            <Text className="text-white font-medium">
              {isEditing ? 'Save' : 'Edit'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View className="bg-white mx-4 mt-4 rounded-xl p-6 shadow-sm items-center">
          {loading ? (
            <View className="items-center justify-center py-6">
              <ActivityIndicator size="large" color="#5B94D3" />
            </View>
          ) : error ? (
            <View className="items-center justify-center py-6">
              <Ionicons name="alert-circle-outline" size={40} color="#EF4444" />
              <Text className="text-red-500 mt-2 text-center">{error}</Text>
            </View>
          ) : guardData ? (
            <>
              {user?.imageUrl ? (
                <Image
                  source={{ uri: user.imageUrl }}
                  style={{ width: 96, height: 96, borderRadius: 48 }}
                  className="mb-4"
                />
              ) : (
                <View style={{ backgroundColor: '#5B94D333' }} className="w-24 h-24 rounded-full items-center justify-center mb-4">
                  <Text style={{ color: '#5B94D3' }} className="text-3xl font-bold">
                    {(user?.fullName || guardData.name).split(' ').map(n => n[0]).join('')}
                  </Text>
                </View>
              )}

              <Text className="text-xl font-bold text-gray-900">{user?.fullName || guardData.name}</Text>
              <Text className="text-sm text-gray-500">{user?.primaryEmailAddress?.emailAddress || 'Guard ID: ' + guardData.id}</Text>

              <View className="flex-row items-center mt-2">
                <View className="flex-row items-center px-3 py-1 bg-green-50 rounded-full">
                  <View className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                  <Text className="text-xs text-green-700">Active</Text>
                </View>
                <View className="flex-row items-center ml-2 px-3 py-1 bg-yellow-50 rounded-full">
                  <Ionicons name="star" size={12} color="#F59E0B" />
                  <Text className="text-xs text-yellow-700 ml-1">{guardData.rating}</Text>
                </View>
              </View>

              <View className="flex-row justify-around w-full mt-6 pt-6 border-t border-gray-100">
                <View className="items-center">
                  <Text className="text-2xl font-bold text-gray-900">
                    {formatCurrency(guardData.totalEarnings)}
                  </Text>
                  <Text className="text-xs text-gray-500">Total Earnings</Text>
                </View>
                <View className="items-center">
                  <Text style={{ color: '#5B94D3' }} className="text-2xl font-bold">
                    {formatCurrency(guardData.balance)}
                  </Text>
                  <Text className="text-xs text-gray-500">Available</Text>
                </View>
              </View>
            </>
          ) : null}
        </View>

        {/* Personal Information */}
        <View className="bg-white mx-4 mt-4 rounded-xl p-4 shadow-sm">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Personal Information</Text>
          
          <View className="mb-4">
            <Text className="text-sm text-gray-500 mb-1">Full Name</Text>
            <TextInput
              value={profileData.name}
              onChangeText={(text) => setProfileData({ ...profileData, name: text })}
              editable={isEditing}
              className={`px-3 py-2 rounded-lg ${
                isEditing ? 'bg-gray-50 border border-gray-200' : 'bg-transparent'
              }`}
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm text-gray-500 mb-1">Phone Number</Text>
            <TextInput
              value={profileData.phoneNumber}
              onChangeText={(text) => setProfileData({ ...profileData, phoneNumber: text })}
              editable={isEditing}
              keyboardType="phone-pad"
              className={`px-3 py-2 rounded-lg ${
                isEditing ? 'bg-gray-50 border border-gray-200' : 'bg-transparent'
              }`}
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm text-gray-500 mb-1">Email</Text>
            <TextInput
              value={profileData.email}
              onChangeText={(text) => setProfileData({ ...profileData, email: text })}
              editable={isEditing}
              keyboardType="email-address"
              placeholder="Add email address"
              className={`px-3 py-2 rounded-lg ${
                isEditing ? 'bg-gray-50 border border-gray-200' : 'bg-transparent'
              }`}
            />
          </View>

          <View>
            <Text className="text-sm text-gray-500 mb-1">Work Location</Text>
            <Text className="px-3 py-2 text-gray-900">{guardData?.location?.name || 'Not assigned'}</Text>
          </View>
        </View>

        {/* Banking Details */}
        <View className="bg-white mx-4 mt-4 rounded-xl p-4 shadow-sm">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Banking Details</Text>
          
          <View className="mb-4">
            <Text className="text-sm text-gray-500 mb-1">Bank Name</Text>
            <TextInput
              value={profileData.bankName}
              onChangeText={(text) => setProfileData({ ...profileData, bankName: text })}
              editable={isEditing}
              placeholder="Add bank name"
              className={`px-3 py-2 rounded-lg ${
                isEditing ? 'bg-gray-50 border border-gray-200' : 'bg-transparent'
              }`}
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm text-gray-500 mb-1">Account Number</Text>
            <TextInput
              value={profileData.accountNumber}
              onChangeText={(text) => setProfileData({ ...profileData, accountNumber: text })}
              editable={isEditing}
              keyboardType="numeric"
              placeholder="Add account number"
              secureTextEntry={!isEditing}
              className={`px-3 py-2 rounded-lg ${
                isEditing ? 'bg-gray-50 border border-gray-200' : 'bg-transparent'
              }`}
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm text-gray-500 mb-1">Account Type</Text>
            <TextInput
              value={profileData.accountType}
              onChangeText={(text) => setProfileData({ ...profileData, accountType: text })}
              editable={isEditing}
              placeholder="Add account type"
              className={`px-3 py-2 rounded-lg ${
                isEditing ? 'bg-gray-50 border border-gray-200' : 'bg-transparent'
              }`}
            />
          </View>

          <View>
            <Text className="text-sm text-gray-500 mb-1">Branch Code</Text>
            <TextInput
              value={profileData.branchCode}
              onChangeText={(text) => setProfileData({ ...profileData, branchCode: text })}
              editable={isEditing}
              keyboardType="numeric"
              placeholder="Add branch code"
              className={`px-3 py-2 rounded-lg ${
                isEditing ? 'bg-gray-50 border border-gray-200' : 'bg-transparent'
              }`}
            />
          </View>
        </View>

        {/* Settings */}
        <View className="bg-white mx-4 mt-4 rounded-xl p-4 shadow-sm">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Settings</Text>
          
          <View className="flex-row justify-between items-center py-3 border-b border-gray-100">
            <View className="flex-row items-center">
              <Ionicons name="notifications-outline" size={20} color="#6B7280" />
              <Text className="ml-3 text-gray-700">Push Notifications</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: '#D1D5DB', true: '#5B94D3' }}
              thumbColor="#ffffff"
            />
          </View>

          <TouchableOpacity className="flex-row justify-between items-center py-3 border-b border-gray-100">
            <View className="flex-row items-center">
              <Ionicons name="lock-closed-outline" size={20} color="#6B7280" />
              <Text className="ml-3 text-gray-700">Change PIN</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row justify-between items-center py-3 border-b border-gray-100">
            <View className="flex-row items-center">
              <Ionicons name="help-circle-outline" size={20} color="#6B7280" />
              <Text className="ml-3 text-gray-700">Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row justify-between items-center py-3">
            <View className="flex-row items-center">
              <Ionicons name="information-circle-outline" size={20} color="#6B7280" />
              <Text className="ml-3 text-gray-700">About</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          onPress={handleLogout}
          style={{ backgroundColor: '#B0151933' }}
          className="mx-4 mt-6 mb-8 rounded-xl p-4 items-center"
        >
          <Text style={{ color: '#B01519' }} className="font-semibold">Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}