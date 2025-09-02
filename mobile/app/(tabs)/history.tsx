import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { mockTransactions, formatCurrency, formatDate } from '../../data/mockData';

export default function HistoryScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

  const filteredTransactions = mockTransactions.filter((tx) => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'tips') return tx.type === 'tip';
    if (selectedFilter === 'payouts') return tx.type === 'payout';
    if (selectedFilter === 'utilities') return tx.type === 'airtime' || tx.type === 'electricity';
    return true;
  });

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'tip':
        return { name: 'cash', color: '#10B981' };
      case 'payout':
        return { name: 'wallet', color: '#EF4444' };
      case 'airtime':
        return { name: 'phone-portrait', color: '#3B82F6' };
      case 'electricity':
        return { name: 'flash', color: '#F59E0B' };
      default:
        return { name: 'swap-horizontal', color: '#9333EA' };
    }
  };

  const renderTransaction = ({ item }: any) => {
    const icon = getTransactionIcon(item.type);
    
    return (
      <TouchableOpacity className="bg-white mx-4 mb-3 rounded-xl p-4 shadow-sm">
        <View className="flex-row items-center">
          <View className={`w-12 h-12 rounded-full items-center justify-center`}
            style={{ backgroundColor: `${icon.color}20` }}>
            <Ionicons name={icon.name as any} size={24} color={icon.color} />
          </View>
          
          <View className="flex-1 ml-3">
            <Text className="text-base font-semibold text-gray-900">
              {item.description}
            </Text>
            <Text className="text-sm text-gray-500">
              {formatDate(item.date)} at {item.time}
            </Text>
            {item.reference && (
              <Text className="text-xs text-gray-400 mt-1">
                Ref: {item.reference}
              </Text>
            )}
          </View>
          
          <View className="items-end">
            <Text className={`text-base font-bold ${
              item.amount > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {item.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(item.amount))}
            </Text>
            <Text className="text-xs text-gray-500 mt-1">
              Balance: {formatCurrency(item.balance)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-4 border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-900">Transaction History</Text>
      </View>

      {/* Filters */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        className="bg-white px-4 py-3 border-b border-gray-100"
      >
        {['all', 'tips', 'payouts', 'utilities'].map((filter) => (
          <TouchableOpacity
            key={filter}
            onPress={() => setSelectedFilter(filter)}
            className={`px-4 py-2 rounded-full mr-2 ${
              selectedFilter === filter 
                ? 'bg-tippa-500' 
                : 'bg-gray-100'
            }`}
          >
            <Text className={`text-sm font-medium capitalize ${
              selectedFilter === filter ? 'text-white' : 'text-gray-700'
            }`}>
              {filter === 'all' ? 'All' : filter}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Summary Cards */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        className="px-4 py-4"
      >
        <View className="bg-white rounded-xl p-4 mr-3 shadow-sm" style={{ width: 140 }}>
          <Text className="text-xs text-gray-500 mb-1">Today's Tips</Text>
          <Text className="text-xl font-bold text-tippa-600">R 150.00</Text>
          <Text className="text-xs text-gray-400">5 transactions</Text>
        </View>
        
        <View className="bg-white rounded-xl p-4 mr-3 shadow-sm" style={{ width: 140 }}>
          <Text className="text-xs text-gray-500 mb-1">This Week</Text>
          <Text className="text-xl font-bold text-tippa-600">R 850.00</Text>
          <Text className="text-xs text-gray-400">23 transactions</Text>
        </View>
        
        <View className="bg-white rounded-xl p-4 shadow-sm" style={{ width: 140 }}>
          <Text className="text-xs text-gray-500 mb-1">This Month</Text>
          <Text className="text-xl font-bold text-tippa-600">R 3,250.00</Text>
          <Text className="text-xs text-gray-400">89 transactions</Text>
        </View>
      </ScrollView>

      {/* Transactions List */}
      <FlatList
        data={filteredTransactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Ionicons name="document-text-outline" size={48} color="#9CA3AF" />
            <Text className="text-gray-500 mt-2">No transactions found</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </SafeAreaView>
  );
}