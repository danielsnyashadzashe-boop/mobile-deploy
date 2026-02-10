import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Linking, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useGuard } from '../../contexts/GuardContext';

interface TeamGuard {
  id: string;
  guardId: string;
  name: string;
  surname: string;
  phone: string;
  email?: string | null;
  status: string;
  balance: number;
  location?: {
    id: string;
    name: string;
    address: string;
  } | null;
  assignedAt?: string;
}

interface TeamStats {
  totalGuards: number;
  activeGuards: number;
  locationName?: string;
  totalTipsToday: number;
}

export default function TeamScreen() {
  const { guardData } = useGuard();
  const [teamGuards, setTeamGuards] = useState<TeamGuard[]>([]);
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTeamData = async () => {
    if (!guardData?.id) return;

    try {
      // Fetch supervised guards
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/managers/${guardData.id}/team`
      );

      if (!response.ok) throw new Error('Failed to fetch team data');

      const data = await response.json();
      setTeamGuards(data.guards || []);
      setStats(data.stats || null);
    } catch (error) {
      console.error('Error fetching team data:', error);
      Alert.alert('Error', 'Failed to load team data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTeamData();
  }, [guardData?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTeamData();
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleSMS = (phone: string) => {
    Linking.openURL(`sms:${phone}`);
  };

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  if (!guardData?.isManager) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="people-outline" size={64} color="#9ca3af" />
          <Text className="text-xl font-semibold text-gray-900 mt-4 text-center">
            Manager Access Only
          </Text>
          <Text className="text-base text-gray-600 mt-2 text-center">
            This feature is only available for guards with manager privileges.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#5B94D3" />
          <Text className="text-gray-600 mt-4">Loading team data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#5B94D3']} />
        }
      >
        {/* Header */}
        <View className="bg-white px-6 py-6 border-b border-gray-200">
          <Text className="text-2xl font-bold text-gray-900">My Team</Text>
          {guardData?.location && (
            <Text className="text-sm text-gray-600 mt-1">
              {guardData.location.name}
            </Text>
          )}
        </View>

        {/* Stats Cards */}
        {stats && (
          <View className="px-6 py-4">
            <View className="flex-row space-x-3">
              <View className="flex-1 bg-white rounded-xl p-4 border border-gray-200">
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-2xl font-bold text-gray-900">{stats.totalGuards}</Text>
                    <Text className="text-sm text-gray-600 mt-1">Total Guards</Text>
                  </View>
                  <View className="bg-blue-50 rounded-full p-3">
                    <Ionicons name="people" size={24} color="#5B94D3" />
                  </View>
                </View>
              </View>

              <View className="flex-1 bg-white rounded-xl p-4 border border-gray-200">
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-2xl font-bold text-green-600">{stats.activeGuards}</Text>
                    <Text className="text-sm text-gray-600 mt-1">Active</Text>
                  </View>
                  <View className="bg-green-50 rounded-full p-3">
                    <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                  </View>
                </View>
              </View>
            </View>

            {stats.totalTipsToday > 0 && (
              <View className="bg-white rounded-xl p-4 border border-gray-200 mt-3">
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-sm text-gray-600">Team Tips Today</Text>
                    <Text className="text-2xl font-bold text-green-600 mt-1">
                      R {stats.totalTipsToday.toFixed(2)}
                    </Text>
                  </View>
                  <View className="bg-green-50 rounded-full p-3">
                    <Ionicons name="trending-up" size={24} color="#10b981" />
                  </View>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Team Members List */}
        <View className="px-6 pb-6">
          {teamGuards.length === 0 ? (
            <View className="bg-white rounded-xl p-8 items-center border border-gray-200">
              <Ionicons name="people-outline" size={48} color="#9ca3af" />
              <Text className="text-lg font-semibold text-gray-900 mt-4">No Team Members Yet</Text>
              <Text className="text-sm text-gray-600 mt-2 text-center">
                Guards will appear here once they are assigned to your team.
              </Text>
            </View>
          ) : (
            <View className="space-y-3">
              <Text className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                Team Members ({teamGuards.length})
              </Text>

              {teamGuards.map((guard) => (
                <View
                  key={guard.id}
                  className="bg-white rounded-xl p-4 border border-gray-200"
                >
                  {/* Guard Info */}
                  <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-1">
                      <View className="flex-row items-center">
                        <Text className="text-lg font-semibold text-gray-900">
                          {guard.name} {guard.surname}
                        </Text>
                        {guard.status === 'ACTIVE' && (
                          <View className="ml-2 bg-green-50 px-2 py-1 rounded-full">
                            <Text className="text-xs font-medium text-green-700">Active</Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-sm text-gray-600 mt-1">ID: {guard.guardId}</Text>
                      {guard.location && (
                        <View className="flex-row items-center mt-2">
                          <Ionicons name="location" size={14} color="#6b7280" />
                          <Text className="text-xs text-gray-600 ml-1">
                            {guard.location.name}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View className="items-end">
                      <Text className="text-sm text-gray-600">Balance</Text>
                      <Text className="text-lg font-bold text-green-600">
                        R {guard.balance.toFixed(2)}
                      </Text>
                    </View>
                  </View>

                  {/* Contact Actions */}
                  <View className="flex-row space-x-2 pt-3 border-t border-gray-100">
                    <TouchableOpacity
                      onPress={() => handleCall(guard.phone)}
                      className="flex-1 flex-row items-center justify-center bg-blue-50 rounded-lg py-3"
                    >
                      <Ionicons name="call" size={18} color="#5B94D3" />
                      <Text className="text-sm font-medium text-blue-700 ml-2">Call</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleSMS(guard.phone)}
                      className="flex-1 flex-row items-center justify-center bg-green-50 rounded-lg py-3"
                    >
                      <Ionicons name="chatbubble" size={18} color="#10b981" />
                      <Text className="text-sm font-medium text-green-700 ml-2">SMS</Text>
                    </TouchableOpacity>

                    {guard.email && (
                      <TouchableOpacity
                        onPress={() => handleEmail(guard.email!)}
                        className="flex-1 flex-row items-center justify-center bg-purple-50 rounded-lg py-3"
                      >
                        <Ionicons name="mail" size={18} color="#8b5cf6" />
                        <Text className="text-sm font-medium text-purple-700 ml-2">Email</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Assignment Date */}
                  {guard.assignedAt && (
                    <View className="mt-3 pt-3 border-t border-gray-100">
                      <Text className="text-xs text-gray-500">
                        Assigned: {new Date(guard.assignedAt).toLocaleDateString('en-ZA', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
