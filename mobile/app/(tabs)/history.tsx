import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  TouchableWithoutFeedback,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@clerk/clerk-expo';
import { mockTransactions, formatCurrency, formatDate } from '../../data/mockData';
import apiService from '../../services/apiService';
import { Transaction } from '../../types';

interface GuardData {
  guardId: string;
  name: string;
}

export default function HistoryScreen() {
  const { user } = useUser();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guardData, setGuardData] = useState<GuardData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('All Time');
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const periodOptions = [
    'Today',
    'Yesterday',
    'This Week',
    'This Month',
    'Last 7 Days',
    'Last 30 Days',
    'All Time'
  ];

  // Load guard data and transactions
  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user?.primaryEmailAddress?.emailAddress) {
      setError('No email found. Please sign in again.');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      setLoading(true);

      // First fetch guard profile to get guardId
      const guard = await apiService.fetchGuardProfile(user.primaryEmailAddress.emailAddress);

      if (!guard) {
        setError('Guard profile not found. Please contact support.');
        setLoading(false);
        return;
      }

      setGuardData({ guardId: guard.id, name: guard.name });

      // Then fetch transactions
      const txs = await apiService.fetchTransactions(guard.id);
      setTransactions(txs);

      console.log(`✅ Loaded ${txs.length} transactions`);
    } catch (err) {
      console.error('❌ Error loading data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data. Please check your connection.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [user]);

  // Helper function to check if a date falls within a specific period
  const isDateInPeriod = (dateString: string, period: string): boolean => {
    const transactionDate = new Date(dateString);
    const today = new Date('2025-09-02'); // Current date from environment
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Handle custom date range
    if (period.startsWith('Custom:') && customStartDate && customEndDate) {
      const startDate = new Date(customStartDate);
      const endDate = new Date(customEndDate);
      endDate.setHours(23, 59, 59, 999); // Include the entire end date
      return transactionDate >= startDate && transactionDate <= endDate;
    }

    switch (period) {
      case 'Today':
        return transactionDate.toDateString() === today.toDateString();
      
      case 'Yesterday':
        return transactionDate.toDateString() === yesterday.toDateString();
      
      case 'This Week':
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        return transactionDate >= startOfWeek && transactionDate <= today;
      
      case 'This Month':
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        return transactionDate >= startOfMonth && transactionDate <= today;
      
      case 'Last 7 Days':
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);
        return transactionDate >= sevenDaysAgo && transactionDate <= today;
      
      case 'Last 30 Days':
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        return transactionDate >= thirtyDaysAgo && transactionDate <= today;
      
      case 'All Time':
      default:
        return true;
    }
  };

  // Apply filters
  const filteredTransactions = transactions.filter((tx) => {
    // Period filter
    if (!isDateInPeriod(tx.date, selectedPeriod)) {
      return false;
    }

    // Type filter
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'income') return tx.amount > 0; // Tips are income
    if (selectedFilter === 'expenses') return tx.amount < 0; // Payouts/purchases are expenses
    
    return true;
  });

  // Calculate summary stats for filtered transactions
  const income = filteredTransactions
    .filter(tx => tx.amount > 0)
    .reduce((sum, tx) => sum + tx.amount, 0);
  
  const expenses = Math.abs(filteredTransactions
    .filter(tx => tx.amount < 0)
    .reduce((sum, tx) => sum + tx.amount, 0));
  
  const netAmount = income - expenses;

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handler for applying custom date range
  const handleApplyCustomRange = () => {
    if (!customStartDate || !customEndDate) {
      Alert.alert('Invalid Date Range', 'Please select both start and end dates.');
      return;
    }

    const startDate = new Date(customStartDate);
    const endDate = new Date(customEndDate);

    if (startDate > endDate) {
      Alert.alert('Invalid Date Range', 'Start date must be before end date.');
      return;
    }

    const customPeriodLabel = `Custom: ${formatDate(customStartDate)} - ${formatDate(customEndDate)}`;
    setSelectedPeriod(customPeriodLabel);
    setCurrentPage(1);
    setShowCustomModal(false);
  };

  // Helper to format date for input (YYYY-MM-DD format)
  const formatDateForInput = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  // Helper to validate date format
  const isValidDate = (dateString: string): boolean => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'tip':
        return { name: 'cash', color: '#10B981' };
      case 'payout':
        return { name: 'wallet', color: '#B01519' };
      case 'airtime':
        return { name: 'phone-portrait', color: '#5B94D3' };
      case 'electricity':
        return { name: 'flash', color: '#F59E0B' };
      default:
        return { name: 'swap-horizontal', color: '#5B94D3' };
    }
  };

  const renderTransaction = ({ item }: any) => {
    const icon = getTransactionIcon(item.type);
    const hasCommission = item.metadata?.commissionAmount && item.metadata.commissionAmount > 0;

    return (
      <TouchableOpacity className="bg-white border-b border-gray-100 px-4 py-3">
        <View className="flex-row items-center">
          <View className={`w-8 h-8 rounded-full items-center justify-center mr-3`}
            style={{ backgroundColor: `${icon.color}20` }}>
            <Ionicons name={icon.name as any} size={16} color={icon.color} />
          </View>

          <View className="flex-1">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-semibold text-gray-900">
                {item.description}
              </Text>
              <Text
                className="text-sm font-bold"
                style={{ color: item.amount > 0 ? '#10B981' : '#B01519' }}
              >
                {item.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(item.amount))}
              </Text>
            </View>
            <View className="flex-row items-center justify-between mt-1">
              <Text className="text-xs text-gray-500">
                {formatDate(item.date)} at {item.time}
              </Text>
              <Text className="text-xs text-gray-500">
                Balance: {formatCurrency(item.balance)}
              </Text>
            </View>
            {item.reference && (
              <Text className="text-xs text-gray-400 mt-1">
                Ref: {item.reference}
              </Text>
            )}

            {/* Commission Breakdown */}
            {hasCommission && (
              <View className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-100">
                <View className="flex-row items-center mb-1">
                  <View className="bg-blue-500 px-2 py-0.5 rounded">
                    <Text className="text-xs font-semibold text-white">
                      {item.metadata.commissionRate}% commission
                    </Text>
                  </View>
                </View>
                <Text className="text-xs text-blue-800">
                  Original: {formatCurrency(item.metadata.originalAmount)} |
                  Commission: -{formatCurrency(item.metadata.commissionAmount)} |
                  Received: {formatCurrency(item.metadata.guardReceivesAmount)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <TouchableWithoutFeedback onPress={() => setShowPeriodDropdown(false)}>
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right']}>
      {/* Header */}
      <View className="bg-white px-4 py-4">
        <Text className="text-xl font-bold text-gray-900">Transaction History</Text>
      </View>

      {/* Summary Overview - Like Original */}
      <View className="bg-white px-4 pb-4">
        <View className="flex-row justify-between">
          <View className="items-center bg-green-50 rounded-lg px-3 py-2 flex-1 mr-2">
            <View className="flex-row items-center mb-1">
              <Text className="text-xs text-green-600 font-medium">Income</Text>
              <Ionicons name="information-circle-outline" size={12} color="#059669" className="ml-1" />
            </View>
            <Text className="text-lg font-bold text-green-600">{formatCurrency(income)}</Text>
          </View>
          
          <View className="items-center bg-red-50 rounded-lg px-3 py-2 flex-1 mx-1">
            <View className="flex-row items-center mb-1">
              <Text className="text-xs text-red-600 font-medium">Expenses</Text>
              <Ionicons name="information-circle-outline" size={12} color="#DC2626" className="ml-1" />
            </View>
            <Text className="text-lg font-bold text-red-600">{formatCurrency(expenses)}</Text>
          </View>
          
          <View className="items-center bg-gray-50 rounded-lg px-3 py-2 flex-1 ml-2">
            <View className="flex-row items-center mb-1">
              <Text className="text-xs text-gray-600 font-medium">Net</Text>
              <Ionicons name={netAmount >= 0 ? "trending-up-outline" : "trending-down-outline"} size={12} color="#6B7280" className="ml-1" />
            </View>
            <Text
              className="text-lg font-bold"
              style={{ color: netAmount >= 0 ? '#10B981' : '#B01519' }}
            >
              {formatCurrency(Math.abs(netAmount))}
            </Text>
          </View>
        </View>
      </View>

      {/* Filters Section */}
      <View className="bg-white border-t border-gray-100 px-4 py-3">
        <Text className="text-sm font-semibold text-gray-700 mb-3">Filters</Text>
        
        {/* Dropdown and Custom Range Row */}
        <View className="flex-row items-center justify-between mb-3">
          {/* Period Dropdown */}
          <View className="relative flex-1 mr-3">
            <TouchableOpacity 
              onPress={() => setShowPeriodDropdown(!showPeriodDropdown)}
              className="bg-gray-100 rounded-lg px-3 py-2.5 flex-row items-center justify-between"
            >
              <Text className="text-sm text-gray-700">{selectedPeriod}</Text>
              <Ionicons 
                name={showPeriodDropdown ? "chevron-up" : "chevron-down"} 
                size={16} 
                color="#6B7280" 
              />
            </TouchableOpacity>
            
            {/* Dropdown Menu */}
            {showPeriodDropdown && (
              <View className="absolute top-11 left-0 right-0 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                {periodOptions.map((period) => (
                  <TouchableOpacity
                    key={period}
                    onPress={() => {
                      setSelectedPeriod(period);
                      setShowPeriodDropdown(false);
                      setCurrentPage(1); // Reset pagination
                    }}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      borderBottomWidth: 1,
                      borderBottomColor: '#F3F4F6',
                      backgroundColor: period === selectedPeriod ? '#F0F8FF' : 'transparent'
                    }}
                  >
                    <Text style={{
                      fontSize: 14,
                      color: period === selectedPeriod ? '#5B94D3' : '#374151',
                      fontWeight: period === selectedPeriod ? '500' : '400'
                    }}>
                      {period}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Custom Range Button */}
          <TouchableOpacity 
            onPress={() => setShowCustomModal(true)}
            className="bg-gray-100 rounded-lg px-3 py-2.5"
          >
            <View className="flex-row items-center">
              <Ionicons name="calendar-outline" size={16} color="#6B7280" />
              <Text className="text-sm text-gray-700 ml-1">Custom</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Type Filters */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 16 }}
        >
          {['All', 'Income', 'Expenses'].map((type) => (
            <TouchableOpacity
              key={type}
              onPress={() => {
                setSelectedFilter(type.toLowerCase());
                setCurrentPage(1); // Reset pagination
              }}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 8,
                marginRight: 8,
                backgroundColor: (selectedFilter === type.toLowerCase() || (selectedFilter === 'all' && type === 'All'))
                  ? '#5B94D3'
                  : '#F3F4F6'
              }}
            >
              <Text style={{
                fontSize: 14,
                fontWeight: '500',
                color: (selectedFilter === type.toLowerCase() || (selectedFilter === 'all' && type === 'All'))
                  ? '#FFFFFF'
                  : '#374151'
              }}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Transactions List */}
      <View className="flex-1 bg-white">
        <View className="px-4 py-3 border-b border-gray-100">
          <Text className="text-sm text-gray-600">
            Showing {paginatedTransactions.length} of {filteredTransactions.length} transactions ({selectedPeriod})
          </Text>
        </View>
        
        <FlatList
          data={paginatedTransactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            loading ? (
              <View className="items-center justify-center py-20">
                <ActivityIndicator size="large" color="#5B94D3" />
                <Text className="text-gray-500 mt-4">Loading transactions...</Text>
              </View>
            ) : error ? (
              <View className="items-center justify-center py-20 px-8">
                <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
                <Text className="text-red-600 font-semibold mt-4 text-center">Unable to load transactions</Text>
                <Text className="text-sm text-gray-500 mt-2 text-center">{error}</Text>
                <TouchableOpacity
                  onPress={loadData}
                  className="mt-4 bg-tippa-secondary px-6 py-2 rounded-lg"
                >
                  <Text className="text-white text-sm font-medium">Retry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="items-center justify-center py-20">
                <Ionicons name="document-text-outline" size={48} color="#9CA3AF" />
                <Text className="text-gray-500 mt-2 text-center">
                  No {selectedFilter !== 'all' ? selectedFilter : 'transactions'} found for {selectedPeriod}
                </Text>
                <Text className="text-gray-400 text-sm mt-1 text-center">
                  Try adjusting your filters
                </Text>
              </View>
            )
          }
          showsVerticalScrollIndicator={false}
        />

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <View className="px-4 py-3 border-t border-gray-100 bg-gray-50">
            <View className="flex-row justify-between items-center">
              <TouchableOpacity
                onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor: currentPage === 1 ? '#E5E7EB' : '#5B94D3'
                }}
              >
                <Text style={{
                  fontWeight: '500',
                  color: currentPage === 1 ? '#9CA3AF' : '#FFFFFF'
                }}>
                  Previous
                </Text>
              </TouchableOpacity>

              <View className="flex-row space-x-2">
                <Text className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor: currentPage === totalPages ? '#E5E7EB' : '#5B94D3'
                }}
              >
                <Text style={{
                  fontWeight: '500',
                  color: currentPage === totalPages ? '#9CA3AF' : '#FFFFFF'
                }}>
                  Next
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
      
      {/* Custom Date Range Modal */}
      <Modal
      visible={showCustomModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowCustomModal(false)}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-white rounded-t-3xl p-6 pb-10">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-xl font-bold">Custom Date Range</Text>
            <TouchableOpacity onPress={() => setShowCustomModal(false)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Start Date Input */}
          <Text className="text-sm font-medium text-gray-700 mb-2">Start Date</Text>
          <View className="bg-gray-50 rounded-lg px-4 py-3 mb-4">
            <TextInput
              value={customStartDate}
              onChangeText={setCustomStartDate}
              placeholder="YYYY-MM-DD (e.g., 2025-08-01)"
              className="text-base"
              keyboardType="numeric"
            />
          </View>

          {/* End Date Input */}
          <Text className="text-sm font-medium text-gray-700 mb-2">End Date</Text>
          <View className="bg-gray-50 rounded-lg px-4 py-3 mb-6">
            <TextInput
              value={customEndDate}
              onChangeText={setCustomEndDate}
              placeholder="YYYY-MM-DD (e.g., 2025-09-02)"
              className="text-base"
              keyboardType="numeric"
            />
          </View>

          {/* Quick Date Buttons */}
          <Text className="text-sm font-medium text-gray-700 mb-3">Quick Ranges</Text>
          <View className="flex-row flex-wrap mb-6">
            <TouchableOpacity
              onPress={() => {
                setCustomStartDate('2025-08-01');
                setCustomEndDate('2025-08-31');
              }}
              className="px-3 py-2 rounded-lg mr-2 mb-2 bg-gray-100"
            >
              <Text className="text-sm font-medium text-gray-700">August 2025</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => {
                setCustomStartDate('2025-07-01');
                setCustomEndDate('2025-07-31');
              }}
              className="px-3 py-2 rounded-lg mr-2 mb-2 bg-gray-100"
            >
              <Text className="text-sm font-medium text-gray-700">July 2025</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setCustomStartDate('2025-06-01');
                setCustomEndDate('2025-06-30');
              }}
              className="px-3 py-2 rounded-lg mr-2 mb-2 bg-gray-100"
            >
              <Text className="text-sm font-medium text-gray-700">June 2025</Text>
            </TouchableOpacity>
          </View>

          {/* Info Note */}
          <View className="bg-blue-50 rounded-lg p-4 mb-6">
            <View className="flex-row items-center mb-2">
              <Ionicons name="information-circle" size={20} color="#3B82F6" />
              <Text className="text-blue-800 font-medium ml-2">Date Format</Text>
            </View>
            <Text className="text-blue-700 text-sm">
              Please use YYYY-MM-DD format (e.g., 2025-09-02). Both dates are inclusive.
            </Text>
          </View>

          {/* Action Buttons */}
          <View className="flex-row space-x-3">
            <TouchableOpacity
              onPress={() => {
                setCustomStartDate('');
                setCustomEndDate('');
                setShowCustomModal(false);
              }}
              className="flex-1 bg-gray-100 rounded-lg py-4 items-center"
            >
              <Text className="text-gray-700 font-semibold text-base">Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleApplyCustomRange}
              style={{ backgroundColor: '#5B94D3' }}
              className="flex-1 rounded-lg py-4 items-center"
            >
              <Text className="text-white font-semibold text-base">Apply Range</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      </Modal>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}