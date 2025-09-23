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
  Switch,
  TouchableWithoutFeedback,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { mockPayouts, mockCarGuard, formatCurrency, formatDate } from '../../data/mockData';
// import ElectricityPurchaseModal from '../../components/flash/ElectricityPurchaseModal';

export default function PayoutsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showElectricityModal, setShowElectricityModal] = useState(false);
  const [payoutType, setPayoutType] = useState('bank_transfer');
  const [amount, setAmount] = useState('');
  const [autoPayoutEnabled, setAutoPayoutEnabled] = useState(true);
  const [autoPayoutThreshold, setAutoPayoutThreshold] = useState('500');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDateRange, setSelectedDateRange] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const itemsPerPage = 5;

  // Mock data for enhanced features
  const todayEarnings = 150.00;
  const weekEarnings = 850.00;
  const monthEarnings = 3200.00;
  const payoutThreshold = 500.00;
  const nextPayoutDate = '2025-09-05';

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

  const handleRequestPayout = () => {
    // Handle electricity purchases through Flash API
    if (payoutType === 'electricity') {
      setShowRequestModal(false);
      setAmount('');
      setShowElectricityModal(true);
      return;
    }

    // Handle other payout types with original logic
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
      <TouchableOpacity className="p-4">
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center flex-1">
            <View className="w-10 h-10 bg-tippa-100 rounded-full items-center justify-center mr-3">
              <Ionicons name={getPayoutIcon(item.type) as any} size={20} color="#10B981" />
            </View>
            <View className="flex-1">
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
        
        <View className="flex-row justify-between items-center">
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

  // Filter and pagination logic
  const filteredPayouts = mockPayouts.filter(payout => {
    const matchesSearch = payout.voucherNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         payout.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || payout.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredPayouts.length / itemsPerPage);
  const paginatedPayouts = filteredPayouts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const progressPercentage = Math.min((mockCarGuard.balance / payoutThreshold) * 100, 100);

  const getStatusBarHeight = () => {
    if (Platform.OS === 'ios') {
      return StatusBar.currentHeight || 44; // iOS status bar height
    }
    return StatusBar.currentHeight || 24; // Android status bar height
  };

  return (
    <SafeAreaView 
      className="flex-1 bg-gray-50" 
      style={{ 
        paddingTop: Platform.OS === 'ios' ? getStatusBarHeight() : 0,
        flex: 1,
      }}
    >
      <TouchableWithoutFeedback onPress={() => setShowStatusDropdown(false)}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{ 
            paddingBottom: Platform.OS === 'ios' ? 120 : 100,
            flexGrow: 1,
          }}
        >
        {/* Header */}
        <View className="bg-white px-4 py-6 border-b border-gray-100">
          <View className="flex-row justify-between items-center">
            <Text className="text-2xl font-bold text-gray-900">Payouts</Text>
            <TouchableOpacity onPress={() => setShowSettingsModal(true)}>
              <Ionicons name="settings-outline" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Simplified Balance Card */}
        <View className="mx-4 mt-4 mb-4">
          <View className="bg-white rounded-xl p-6 shadow-sm">
            <View className="items-center mb-6">
              <Text className="text-gray-500 text-sm mb-2">Available for Payout</Text>
              <Text className="text-gray-900 text-4xl font-bold">
                {formatCurrency(mockCarGuard.balance)}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => setShowRequestModal(true)}
              className="bg-tippa-500 rounded-lg py-4 items-center"
            >
              <Text className="text-white font-semibold text-base">Request Payout</Text>
            </TouchableOpacity>
          </View>
        </View>

      {/* Search and Filters */}
      <View className="mx-4 mb-4">
        <View className="bg-white rounded-xl p-4 shadow-sm">
          {/* Search Bar */}
          <View className="bg-gray-50 rounded-lg px-4 py-3 mb-3 flex-row items-center">
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by voucher number or type..."
              className="flex-1 ml-3 text-sm"
            />
          </View>

          {/* Filter Dropdown */}
          <View style={{ 
            position: 'relative', 
            zIndex: showStatusDropdown ? 999 : 1,
            marginBottom: showStatusDropdown ? 200 : 0 
          }}>
            <Text className="text-sm font-medium text-gray-700 mb-2">Status Filter</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                console.log('Dropdown clicked, current state:', showStatusDropdown);
                setShowStatusDropdown(!showStatusDropdown);
              }}
              style={{
                backgroundColor: '#F9FAFB',
                borderRadius: 8,
                paddingHorizontal: 16,
                paddingVertical: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderWidth: 1,
                borderColor: '#E5E7EB',
              }}
            >
              <Text style={{ color: '#374151', fontSize: 14 }}>
                {selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)}
              </Text>
              <Ionicons 
                name={showStatusDropdown ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#6B7280" 
              />
            </TouchableOpacity>
            
            {showStatusDropdown && (
              <View 
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: 'white',
                  borderRadius: 8,
                  marginTop: 4,
                  zIndex: 1000,
                  elevation: 15,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 12,
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                }}
              >
                {['all', 'pending', 'processing', 'completed', 'failed'].map((status, index) => (
                  <TouchableOpacity
                    key={status}
                    activeOpacity={0.7}
                    onPress={() => {
                      console.log('Status selected:', status);
                      setSelectedStatus(status);
                      setShowStatusDropdown(false);
                      setCurrentPage(1);
                    }}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      backgroundColor: selectedStatus === status ? '#F0FDF4' : 'white',
                      borderBottomWidth: index < 4 ? 1 : 0,
                      borderBottomColor: '#F3F4F6',
                    }}
                  >
                    <Text style={{
                      fontSize: 14,
                      color: selectedStatus === status ? '#059669' : '#374151',
                      fontWeight: selectedStatus === status ? '500' : '400',
                    }}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
      </View>

        {/* Payouts List */}
        <View className="mx-4 mb-4">
          <View className="bg-white rounded-xl shadow-sm">
            <View className="px-4 py-3 border-b border-gray-100">
              <Text className="text-lg font-semibold text-gray-900">Payout History</Text>
              <Text className="text-sm text-gray-500">
                Showing {paginatedPayouts.length} of {filteredPayouts.length} results
              </Text>
            </View>

            {paginatedPayouts.length > 0 ? (
              <View>
                {paginatedPayouts.map((item, index) => (
                  <View key={item.id}>
                    {renderPayout({ item })}
                    {index < paginatedPayouts.length - 1 && (
                      <View className="border-b border-gray-100" />
                    )}
                  </View>
                ))}
              </View>
            ) : (
              <View className="items-center justify-center py-20">
                <Ionicons name="wallet-outline" size={48} color="#9CA3AF" />
                <Text className="text-gray-500 mt-2">No payout history found</Text>
              </View>
            )}
          </View>

          {/* Pagination - History Page Style */}
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
        </ScrollView>
      </TouchableWithoutFeedback>

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

      {/* Settings Modal */}
      <Modal
        visible={showSettingsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6 pb-10">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold">Payout Settings</Text>
              <TouchableOpacity onPress={() => setShowSettingsModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Auto Payout Settings */}
            <View className="mb-6">
              <Text className="text-lg font-semibold text-gray-900 mb-4">Auto Payout</Text>
              
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-1">
                  <Text className="text-base text-gray-700">Enable Auto Payout</Text>
                  <Text className="text-sm text-gray-500">
                    Automatically request payouts when threshold is reached
                  </Text>
                </View>
                <Switch
                  value={autoPayoutEnabled}
                  onValueChange={setAutoPayoutEnabled}
                  trackColor={{ false: '#d1d5db', true: '#10B981' }}
                  thumbColor={autoPayoutEnabled ? '#ffffff' : '#ffffff'}
                />
              </View>

              {autoPayoutEnabled && (
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    Auto Payout Threshold
                  </Text>
                  <View className="flex-row items-center bg-gray-50 rounded-lg px-4 py-3">
                    <Text className="text-lg font-bold text-gray-700 mr-2">R</Text>
                    <TextInput
                      value={autoPayoutThreshold}
                      onChangeText={setAutoPayoutThreshold}
                      placeholder="500"
                      keyboardType="numeric"
                      className="flex-1 text-lg"
                    />
                  </View>
                  <Text className="text-xs text-gray-500 mt-2">
                    Minimum threshold: R100.00
                  </Text>
                </View>
              )}
            </View>

            {/* Payout Schedule */}
            <View className="mb-6">
              <Text className="text-lg font-semibold text-gray-900 mb-4">Payout Schedule</Text>
              <View className="bg-blue-50 rounded-lg p-4">
                <View className="flex-row items-center mb-2">
                  <Ionicons name="information-circle" size={20} color="#3B82F6" />
                  <Text className="text-blue-800 font-medium ml-2">Next Payout</Text>
                </View>
                <Text className="text-blue-700">
                  Your next automatic payout is scheduled for {formatDate(nextPayoutDate)}
                </Text>
              </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              onPress={() => {
                Alert.alert('Settings Saved', 'Your payout settings have been updated.');
                setShowSettingsModal(false);
              }}
              className="bg-tippa-500 rounded-lg py-4 items-center"
            >
              <Text className="text-white font-semibold text-base">Save Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Electricity Purchase Modal - Temporarily disabled due to React Query compatibility issue */}
      {/* <ElectricityPurchaseModal
        visible={showElectricityModal}
        onClose={() => setShowElectricityModal(false)}
        onSuccess={(transaction) => {
          console.log('Electricity purchase successful:', transaction);
          // Could add transaction to local state or trigger a refresh
        }}
      /> */}
    </SafeAreaView>
  );
}