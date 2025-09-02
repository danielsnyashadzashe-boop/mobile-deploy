import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { mockPayouts, mockCarGuard, formatCurrency, formatDate } from '../../data/mockData';

export default function PayoutsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [payoutType, setPayoutType] = useState('bank_transfer');
  const [amount, setAmount] = useState('');

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

  const handleRequestPayout = () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    
    if (parseFloat(amount) > mockCarGuard.balance) {
      Alert.alert('Insufficient Balance', 'You cannot request more than your available balance');
      return;
    }

    Alert.alert(
      'Confirm Payout',
      `Request ${formatCurrency(parseFloat(amount))} via ${payoutType.replace('_', ' ')}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          onPress: () => {
            setShowRequestModal(false);
            setAmount('');
            Alert.alert('Success', 'Your payout request has been submitted');
          }
        }
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'processing':
        return 'text-yellow-600 bg-yellow-50';
      case 'pending':
        return 'text-blue-600 bg-blue-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getPayoutIcon = (type: string) => {
    switch (type) {
      case 'bank_transfer':
        return 'business';
      case 'cash':
        return 'cash';
      case 'airtime':
        return 'phone-portrait';
      case 'electricity':
        return 'flash';
      case 'groceries':
        return 'cart';
      default:
        return 'wallet';
    }
  };

  const renderPayout = ({ item }: any) => {
    const statusColors = getStatusColor(item.status);
    
    return (
      <TouchableOpacity className="bg-white mx-4 mb-3 rounded-xl p-4 shadow-sm">
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center">
            <View className="w-10 h-10 bg-tippa-100 rounded-full items-center justify-center mr-3">
              <Ionicons name={getPayoutIcon(item.type) as any} size={20} color="#10B981" />
            </View>
            <View>
              <Text className="text-base font-semibold text-gray-900">
                {item.type.replace('_', ' ').charAt(0).toUpperCase() + item.type.slice(1).replace('_', ' ')}
              </Text>
              <Text className="text-xs text-gray-500">
                {item.voucherNumber}
              </Text>
            </View>
          </View>
          <View className={`px-3 py-1 rounded-full ${statusColors.split(' ')[1]}`}>
            <Text className={`text-xs font-medium capitalize ${statusColors.split(' ')[0]}`}>
              {item.status}
            </Text>
          </View>
        </View>
        
        <View className="flex-row justify-between items-center mt-2">
          <View>
            <Text className="text-xs text-gray-500">Request Date</Text>
            <Text className="text-sm text-gray-700">{formatDate(item.requestDate)}</Text>
          </View>
          <View className="items-end">
            <Text className="text-xs text-gray-500">Amount</Text>
            <Text className="text-lg font-bold text-gray-900">
              {formatCurrency(item.amount)}
            </Text>
          </View>
        </View>
        
        {item.reference && (
          <Text className="text-xs text-gray-400 mt-2">
            Reference: {item.reference}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-4 border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-900">Payouts</Text>
      </View>

      {/* Balance Card */}
      <View className="mx-4 mt-4 mb-4">
        <View className="bg-gradient-to-r from-tippa-500 to-tippa-600 rounded-xl p-4 shadow-lg">
          <Text className="text-white/90 text-sm mb-1">Available for Payout</Text>
          <Text className="text-white text-3xl font-bold mb-3">
            {formatCurrency(mockCarGuard.balance)}
          </Text>
          <TouchableOpacity
            onPress={() => setShowRequestModal(true)}
            className="bg-white/20 rounded-lg py-3 items-center"
          >
            <Text className="text-white font-semibold">Request Payout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Stats */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        className="px-4 mb-4"
      >
        <View className="bg-white rounded-xl p-4 mr-3 shadow-sm" style={{ width: 140 }}>
          <Text className="text-xs text-gray-500 mb-1">Pending</Text>
          <Text className="text-xl font-bold text-yellow-600">R 200.00</Text>
          <Text className="text-xs text-gray-400">1 request</Text>
        </View>
        
        <View className="bg-white rounded-xl p-4 mr-3 shadow-sm" style={{ width: 140 }}>
          <Text className="text-xs text-gray-500 mb-1">This Month</Text>
          <Text className="text-xl font-bold text-green-600">R 1,500.00</Text>
          <Text className="text-xs text-gray-400">3 payouts</Text>
        </View>
        
        <View className="bg-white rounded-xl p-4 shadow-sm" style={{ width: 140 }}>
          <Text className="text-xs text-gray-500 mb-1">Total Payouts</Text>
          <Text className="text-xl font-bold text-tippa-600">R 12,050.00</Text>
          <Text className="text-xs text-gray-400">28 payouts</Text>
        </View>
      </ScrollView>

      {/* Payouts List */}
      <FlatList
        data={mockPayouts}
        renderItem={renderPayout}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Ionicons name="wallet-outline" size={48} color="#9CA3AF" />
            <Text className="text-gray-500 mt-2">No payout history</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      {/* Request Payout Modal */}
      <Modal
        visible={showRequestModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRequestModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6 pb-10">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold">Request Payout</Text>
              <TouchableOpacity onPress={() => setShowRequestModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Payout Type Selection */}
            <Text className="text-sm font-medium text-gray-700 mb-3">Payout Method</Text>
            <View className="flex-row flex-wrap mb-6">
              {['bank_transfer', 'cash', 'airtime', 'electricity'].map((type) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => setPayoutType(type)}
                  className={`px-4 py-2 rounded-lg mr-2 mb-2 ${
                    payoutType === type ? 'bg-tippa-500' : 'bg-gray-100'
                  }`}
                >
                  <Text className={`text-sm font-medium ${
                    payoutType === type ? 'text-white' : 'text-gray-700'
                  }`}>
                    {type.replace('_', ' ').charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Amount Input */}
            <Text className="text-sm font-medium text-gray-700 mb-2">Amount</Text>
            <View className="flex-row items-center bg-gray-50 rounded-lg px-4 py-3 mb-2">
              <Text className="text-xl font-bold text-gray-700 mr-2">R</Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                keyboardType="numeric"
                className="flex-1 text-xl"
              />
            </View>
            <Text className="text-xs text-gray-500 mb-6">
              Available balance: {formatCurrency(mockCarGuard.balance)}
            </Text>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleRequestPayout}
              className="bg-tippa-500 rounded-lg py-4 items-center"
            >
              <Text className="text-white font-semibold text-base">Submit Request</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}