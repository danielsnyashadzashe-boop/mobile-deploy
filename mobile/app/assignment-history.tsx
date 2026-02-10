import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useGuard } from '../contexts/GuardContext';

interface LocationHistory {
  id: string;
  locationId: string;
  locationName: string;
  assignedAt: string;
  removedAt?: string | null;
  reason?: string | null;
  changedBy: string;
}

interface ManagerHistory {
  id: string;
  managerId: string;
  managerName: string;
  assignedAt: string;
  removedAt?: string | null;
  reason?: string | null;
  changedBy: string;
}

interface HistoryData {
  locationHistory: LocationHistory[];
  managerHistory: ManagerHistory[];
}

export default function AssignmentHistoryScreen() {
  const { guardData } = useGuard();
  const [historyData, setHistoryData] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'location' | 'manager'>('location');

  const fetchHistory = async () => {
    if (!guardData?.id) return;

    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/guards/${guardData.id}/assignment-history`
      );

      if (!response.ok) throw new Error('Failed to fetch assignment history');

      const data = await response.json();
      setHistoryData(data);
    } catch (error) {
      console.error('Error fetching assignment history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [guardData?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const calculateDuration = (assignedAt: string, removedAt?: string | null) => {
    const start = new Date(assignedAt);
    const end = removedAt ? new Date(removedAt) : new Date();
    const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    if (days < 30) return `${days} days`;
    if (days < 365) return `${Math.floor(days / 30)} months`;
    return `${Math.floor(days / 365)} years`;
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#5B94D3" />
          <Text className="text-gray-600 mt-4">Loading assignment history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-4 border-b border-gray-200 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">Assignment History</Text>
      </View>

      {/* Tab Selector */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <View className="flex-row bg-gray-100 rounded-lg p-1">
          <TouchableOpacity
            onPress={() => setActiveTab('location')}
            className={`flex-1 py-2 rounded-md ${
              activeTab === 'location' ? 'bg-white' : 'bg-transparent'
            }`}
          >
            <Text
              className={`text-center font-medium ${
                activeTab === 'location' ? 'text-gray-900' : 'text-gray-600'
              }`}
            >
              Locations
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('manager')}
            className={`flex-1 py-2 rounded-md ${
              activeTab === 'manager' ? 'bg-white' : 'bg-transparent'
            }`}
          >
            <Text
              className={`text-center font-medium ${
                activeTab === 'manager' ? 'text-gray-900' : 'text-gray-600'
              }`}
            >
              Managers
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#5B94D3']} />
        }
      >
        <View className="px-4 py-4">
          {/* Location History Tab */}
          {activeTab === 'location' && (
            <>
              {historyData?.locationHistory && historyData.locationHistory.length > 0 ? (
                <View className="space-y-3">
                  {historyData.locationHistory.map((item, index) => (
                    <View
                      key={item.id}
                      className="bg-white rounded-xl p-4 border border-gray-200"
                    >
                      {/* Current/Past Badge */}
                      <View className="flex-row items-center justify-between mb-2">
                        {!item.removedAt && index === 0 && (
                          <View className="bg-green-50 px-3 py-1 rounded-full">
                            <Text className="text-xs font-medium text-green-700">Current</Text>
                          </View>
                        )}
                        <View className="flex-1" />
                        <Text className="text-xs text-gray-500">
                          {calculateDuration(item.assignedAt, item.removedAt)}
                        </Text>
                      </View>

                      {/* Location Name */}
                      <View className="flex-row items-center mb-3">
                        <View className="bg-blue-50 rounded-full p-2 mr-3">
                          <Ionicons name="location" size={20} color="#5B94D3" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-lg font-semibold text-gray-900">
                            {item.locationName}
                          </Text>
                          <Text className="text-sm text-gray-600">
                            ID: {item.locationId}
                          </Text>
                        </View>
                      </View>

                      {/* Timeline */}
                      <View className="border-t border-gray-100 pt-3 space-y-2">
                        <View className="flex-row items-center">
                          <Ionicons name="calendar-outline" size={16} color="#6b7280" />
                          <Text className="text-sm text-gray-600 ml-2">
                            Assigned: {formatDate(item.assignedAt)}
                          </Text>
                        </View>

                        {item.removedAt && (
                          <View className="flex-row items-center">
                            <Ionicons name="close-circle-outline" size={16} color="#ef4444" />
                            <Text className="text-sm text-gray-600 ml-2">
                              Removed: {formatDate(item.removedAt)}
                            </Text>
                          </View>
                        )}

                        {item.reason && (
                          <View className="mt-2 bg-gray-50 rounded-lg p-3">
                            <Text className="text-xs text-gray-500 mb-1">Reason:</Text>
                            <Text className="text-sm text-gray-700">{item.reason}</Text>
                          </View>
                        )}

                        <View className="flex-row items-center mt-2">
                          <Ionicons name="person-outline" size={16} color="#6b7280" />
                          <Text className="text-xs text-gray-500 ml-2">
                            Changed by: {item.changedBy}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View className="bg-white rounded-xl p-8 items-center border border-gray-200">
                  <Ionicons name="location-outline" size={48} color="#9ca3af" />
                  <Text className="text-lg font-semibold text-gray-900 mt-4">
                    No Location History
                  </Text>
                  <Text className="text-sm text-gray-600 mt-2 text-center">
                    Your location assignment history will appear here.
                  </Text>
                </View>
              )}
            </>
          )}

          {/* Manager History Tab */}
          {activeTab === 'manager' && (
            <>
              {historyData?.managerHistory && historyData.managerHistory.length > 0 ? (
                <View className="space-y-3">
                  {historyData.managerHistory.map((item, index) => (
                    <View
                      key={item.id}
                      className="bg-white rounded-xl p-4 border border-gray-200"
                    >
                      {/* Current/Past Badge */}
                      <View className="flex-row items-center justify-between mb-2">
                        {!item.removedAt && index === 0 && (
                          <View className="bg-green-50 px-3 py-1 rounded-full">
                            <Text className="text-xs font-medium text-green-700">Current</Text>
                          </View>
                        )}
                        <View className="flex-1" />
                        <Text className="text-xs text-gray-500">
                          {calculateDuration(item.assignedAt, item.removedAt)}
                        </Text>
                      </View>

                      {/* Manager Name */}
                      <View className="flex-row items-center mb-3">
                        <View className="bg-purple-50 rounded-full p-2 mr-3">
                          <Ionicons name="person" size={20} color="#8b5cf6" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-lg font-semibold text-gray-900">
                            {item.managerName}
                          </Text>
                          <Text className="text-sm text-gray-600">
                            Manager ID: {item.managerId}
                          </Text>
                        </View>
                      </View>

                      {/* Timeline */}
                      <View className="border-t border-gray-100 pt-3 space-y-2">
                        <View className="flex-row items-center">
                          <Ionicons name="calendar-outline" size={16} color="#6b7280" />
                          <Text className="text-sm text-gray-600 ml-2">
                            Assigned: {formatDate(item.assignedAt)}
                          </Text>
                        </View>

                        {item.removedAt && (
                          <View className="flex-row items-center">
                            <Ionicons name="close-circle-outline" size={16} color="#ef4444" />
                            <Text className="text-sm text-gray-600 ml-2">
                              Removed: {formatDate(item.removedAt)}
                            </Text>
                          </View>
                        )}

                        {item.reason && (
                          <View className="mt-2 bg-gray-50 rounded-lg p-3">
                            <Text className="text-xs text-gray-500 mb-1">Reason:</Text>
                            <Text className="text-sm text-gray-700">{item.reason}</Text>
                          </View>
                        )}

                        <View className="flex-row items-center mt-2">
                          <Ionicons name="person-outline" size={16} color="#6b7280" />
                          <Text className="text-xs text-gray-500 ml-2">
                            Changed by: {item.changedBy}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View className="bg-white rounded-xl p-8 items-center border border-gray-200">
                  <Ionicons name="people-outline" size={48} color="#9ca3af" />
                  <Text className="text-lg font-semibold text-gray-900 mt-4">
                    No Manager History
                  </Text>
                  <Text className="text-sm text-gray-600 mt-2 text-center">
                    Your manager assignment history will appear here.
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
