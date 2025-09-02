import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { mockCarGuard, mockTransactions, formatCurrency } from '../../data/mockData';

export default function DashboardScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [showAirtimeModal, setShowAirtimeModal] = useState(false);
  const [showElectricityModal, setShowElectricityModal] = useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

  const handleQuickAction = (action: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    switch (action) {
      case 'airtime':
        setShowAirtimeModal(true);
        break;
      case 'electricity':
        setShowElectricityModal(true);
        break;
      case 'payout':
        Alert.alert('Payout Request', 'Navigate to Payouts tab to request a payout');
        break;
      case 'transfer':
        Alert.alert('Transfer', 'Transfer feature coming soon!');
        break;
    }
  };

  const recentTransactions = mockTransactions.slice(0, 3);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <LinearGradient
          colors={['#10B981', '#059669']}
          className="px-6 pt-4 pb-8"
        >
          <View className="flex-row justify-between items-center mb-4">
            <View>
              <Text className="text-white/80 text-sm">Welcome back,</Text>
              <Text className="text-white text-2xl font-bold">{mockCarGuard.name}</Text>
            </View>
            <TouchableOpacity className="bg-white/20 p-2 rounded-full">
              <Ionicons name="notifications-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Balance Card */}
          <View className="bg-white rounded-2xl p-4 shadow-lg">
            <Text className="text-gray-600 text-sm mb-1">Available Balance</Text>
            <Text className="text-3xl font-bold text-gray-900">
              {formatCurrency(mockCarGuard.balance)}
            </Text>
            <View className="flex-row justify-between mt-4">
              <View>
                <Text className="text-xs text-gray-500">Today's Earnings</Text>
                <Text className="text-base font-semibold text-tippa-600">R 150.00</Text>
              </View>
              <View>
                <Text className="text-xs text-gray-500">This Week</Text>
                <Text className="text-base font-semibold text-tippa-600">R 850.00</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* QR Code Section */}
        <View className="px-6 -mt-4">
          <View className="bg-white rounded-2xl p-6 shadow-md items-center">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              Your QR Code
            </Text>
            <View className="p-4 bg-gray-50 rounded-xl">
              <QRCode
                value={`tippa://guard/${mockCarGuard.id}`}
                size={200}
                color="#10B981"
                backgroundColor="transparent"
              />
            </View>
            <Text className="text-sm text-gray-600 mt-4 text-center">
              Show this code to customers for instant tips
            </Text>
            <View className="flex-row items-center mt-2 px-3 py-1 bg-tippa-50 rounded-full">
              <View className="w-2 h-2 bg-tippa-500 rounded-full mr-2" />
              <Text className="text-xs text-tippa-700">Active</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="px-6 mt-6">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</Text>
          <View className="flex-row flex-wrap justify-between">
            <TouchableOpacity
              onPress={() => handleQuickAction('airtime')}
              className="bg-white rounded-xl p-4 shadow-sm mb-4"
              style={{ width: '48%' }}
            >
              <View className="bg-blue-100 w-10 h-10 rounded-full items-center justify-center mb-2">
                <Ionicons name="phone-portrait-outline" size={20} color="#3B82F6" />
              </View>
              <Text className="text-sm font-medium text-gray-900">Buy Airtime</Text>
              <Text className="text-xs text-gray-500">Instant top-up</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleQuickAction('electricity')}
              className="bg-white rounded-xl p-4 shadow-sm mb-4"
              style={{ width: '48%' }}
            >
              <View className="bg-yellow-100 w-10 h-10 rounded-full items-center justify-center mb-2">
                <Ionicons name="flash-outline" size={20} color="#F59E0B" />
              </View>
              <Text className="text-sm font-medium text-gray-900">Buy Electricity</Text>
              <Text className="text-xs text-gray-500">Prepaid tokens</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleQuickAction('payout')}
              className="bg-white rounded-xl p-4 shadow-sm mb-4"
              style={{ width: '48%' }}
            >
              <View className="bg-green-100 w-10 h-10 rounded-full items-center justify-center mb-2">
                <Ionicons name="cash-outline" size={20} color="#10B981" />
              </View>
              <Text className="text-sm font-medium text-gray-900">Request Payout</Text>
              <Text className="text-xs text-gray-500">To bank or cash</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleQuickAction('transfer')}
              className="bg-white rounded-xl p-4 shadow-sm mb-4"
              style={{ width: '48%' }}
            >
              <View className="bg-purple-100 w-10 h-10 rounded-full items-center justify-center mb-2">
                <Ionicons name="swap-horizontal-outline" size={20} color="#9333EA" />
              </View>
              <Text className="text-sm font-medium text-gray-900">Transfer</Text>
              <Text className="text-xs text-gray-500">Send to others</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Transactions */}
        <View className="px-6 mt-6 mb-8">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-semibold text-gray-900">Recent Activity</Text>
            <TouchableOpacity>
              <Text className="text-sm text-tippa-600">See all</Text>
            </TouchableOpacity>
          </View>

          <View className="bg-white rounded-xl shadow-sm">
            {recentTransactions.map((transaction, index) => (
              <View
                key={transaction.id}
                className={`flex-row items-center justify-between p-4 ${
                  index < recentTransactions.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <View className="flex-row items-center flex-1">
                  <View
                    className={`w-10 h-10 rounded-full items-center justify-center ${
                      transaction.type === 'tip' ? 'bg-green-100' : 'bg-red-100'
                    }`}
                  >
                    <Ionicons
                      name={transaction.type === 'tip' ? 'arrow-down' : 'arrow-up'}
                      size={20}
                      color={transaction.type === 'tip' ? '#10B981' : '#EF4444'}
                    />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-sm font-medium text-gray-900">
                      {transaction.description}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      {transaction.date} at {transaction.time}
                    </Text>
                  </View>
                </View>
                <Text
                  className={`text-base font-semibold ${
                    transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {transaction.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(transaction.amount))}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Airtime Modal Placeholder */}
      <Modal
        visible={showAirtimeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAirtimeModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6 pb-10">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold">Buy Airtime</Text>
              <TouchableOpacity onPress={() => setShowAirtimeModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <Text className="text-gray-600">Airtime purchase feature coming soon!</Text>
          </View>
        </View>
      </Modal>

      {/* Electricity Modal Placeholder */}
      <Modal
        visible={showElectricityModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowElectricityModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6 pb-10">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold">Buy Electricity</Text>
              <TouchableOpacity onPress={() => setShowElectricityModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <Text className="text-gray-600">Electricity purchase feature coming soon!</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}