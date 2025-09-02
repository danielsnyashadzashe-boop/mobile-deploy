import React, { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { mockTransactions, formatCurrency, formatDate } from '../../data/mockData';

export default function HistoryScreen() {
  const [refreshing, setRefreshing] = useState(false);
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

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

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
  const filteredTransactions = mockTransactions.filter((tx) => {
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
              <Text className={`text-sm font-bold ${
                item.amount > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
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
            <Text className={`text-lg font-bold ${netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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
                    className={`px-3 py-2.5 border-b border-gray-100 ${
                      period === selectedPeriod ? 'bg-tippa-50' : ''
                    }`}
                  >
                    <Text className={`text-sm ${
                      period === selectedPeriod ? 'text-tippa-600 font-medium' : 'text-gray-700'
                    }`}>
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
              className={`px-4 py-2 rounded-lg mr-2 ${
                selectedFilter === type.toLowerCase() || (selectedFilter === 'all' && type === 'All')
                  ? 'bg-tippa-500' 
                  : 'bg-gray-100'
              }`}
            >
              <Text className={`text-sm font-medium ${
                selectedFilter === type.toLowerCase() || (selectedFilter === 'all' && type === 'All')
                  ? 'text-white' 
                  : 'text-gray-700'
              }`}>
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
            <View className="items-center justify-center py-20">
              <Ionicons name="document-text-outline" size={48} color="#9CA3AF" />
              <Text className="text-gray-500 mt-2 text-center">
                No {selectedFilter !== 'all' ? selectedFilter : 'transactions'} found for {selectedPeriod}
              </Text>
              <Text className="text-gray-400 text-sm mt-1 text-center">
                Try adjusting your filters
              </Text>
            </View>
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
                className={`px-4 py-2 rounded-lg ${
                  currentPage === 1 ? 'bg-gray-200' : 'bg-tippa-500'
                }`}
              >
                <Text className={`font-medium ${
                  currentPage === 1 ? 'text-gray-400' : 'text-white'
                }`}>
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
                className={`px-4 py-2 rounded-lg ${
                  currentPage === totalPages ? 'bg-gray-200' : 'bg-tippa-500'
                }`}
              >
                <Text className={`font-medium ${
                  currentPage === totalPages ? 'text-gray-400' : 'text-white'
                }`}>
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
              className="flex-1 bg-tippa-500 rounded-lg py-4 items-center"
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