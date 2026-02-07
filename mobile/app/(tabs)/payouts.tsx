import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  Switch,
  TouchableWithoutFeedback,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@clerk/clerk-expo';
import * as Clipboard from 'expo-clipboard';
import { formatCurrency, formatDate } from '../../data/mockData';
import { useGuard } from '../../contexts/GuardContext';
import {
  getPayouts,
  Payout,
  purchaseVoucher,
  requestPayout,
  PayoutRequest,
  getPayoutRequests,
  VoucherData,
} from '../../services/mobileApiService';

// Quick amount buttons for payout
const QUICK_AMOUNTS = [50, 100, 200, 500];

export default function PayoutsScreen() {
  const { user } = useUser();
  const { guardData, isLoading: guardLoading, updateBalance, refreshGuardData } = useGuard();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);

  // Modal states
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showVoucherResultModal, setShowVoucherResultModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);

  // Payout request state
  const [payoutMethod, setPayoutMethod] = useState<'voucher' | 'bank_transfer' | null>(null);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Result state (success/error feedback)
  const [resultType, setResultType] = useState<'success' | 'error'>('success');
  const [resultTitle, setResultTitle] = useState('');
  const [resultMessage, setResultMessage] = useState('');

  // Voucher result state
  const [voucherResult, setVoucherResult] = useState<VoucherData | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Settings state
  const [autoPayoutEnabled, setAutoPayoutEnabled] = useState(true);
  const [autoPayoutThreshold, setAutoPayoutThreshold] = useState('500');

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState<'history' | 'requests'>('history');
  const itemsPerPage = 5;

  const payoutThreshold = 500.00;
  const nextPayoutDate = '2025-09-05';

  // Load payouts when guard data is available
  useEffect(() => {
    if (guardData && !guardLoading && user?.id) {
      loadData();
    } else if (!guardLoading && !guardData) {
      setError('Guard profile not found. Please link your account.');
      setLoading(false);
    }
  }, [guardData, guardLoading, user]);

  const loadData = async () => {
    if (!user?.id || !guardData) {
      setError('Not authenticated. Please sign in again.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch payouts (main data)
      const payoutsResponse = await getPayouts(user.id);

      if (payoutsResponse.success) {
        setPayouts(payoutsResponse.data || []);
      } else {
        setError('Failed to load payout data');
      }

      // Try to fetch payout requests (may not be implemented on backend yet)
      try {
        const requestsResponse = await getPayoutRequests(guardData.guardId);
        if (requestsResponse.success) {
          setPayoutRequests(requestsResponse.data || []);
        }
        // Silently fail if endpoint doesn't exist yet
      } catch (requestErr) {
        console.log('Payout requests endpoint not available yet');
        setPayoutRequests([]);
      }
    } catch (err) {
      setError('Failed to load data. Please check your connection.');
      console.error('Error loading payouts:', err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([
      loadData(),
      user?.id ? refreshGuardData(user.id) : Promise.resolve(),
    ]).finally(() => setRefreshing(false));
  }, [user?.id]);

  const handleSelectMethod = (method: 'voucher' | 'bank_transfer') => {
    setPayoutMethod(method);
  };

  const handleQuickAmount = (quickAmount: number) => {
    setAmount(quickAmount.toString());
  };

  const validateAmount = (): boolean => {
    const numAmount = parseFloat(amount);

    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return false;
    }

    if (!guardData) {
      Alert.alert('Error', 'Guard data not loaded. Please try again.');
      return false;
    }

    if (numAmount > guardData.balance) {
      Alert.alert('Insufficient Balance', 'You cannot request more than your available balance');
      return false;
    }

    if (payoutMethod === 'voucher' && numAmount < 5) {
      Alert.alert('Minimum Amount', 'Minimum voucher amount is R5');
      return false;
    }

    if (payoutMethod === 'bank_transfer' && numAmount < 50) {
      Alert.alert('Minimum Amount', 'Minimum bank transfer amount is R50');
      return false;
    }

    return true;
  };

  const handleProceedToConfirm = () => {
    if (!payoutMethod) {
      Alert.alert('Error', 'Please select a payout method');
      return;
    }

    if (!validateAmount()) return;

    setShowRequestModal(false);
    setShowConfirmModal(true);
  };

  const handleConfirmPayout = async () => {
    if (!guardData || !payoutMethod) return;

    setIsProcessing(true);
    const numAmount = parseFloat(amount);

    try {
      if (payoutMethod === 'voucher') {
        // Instant voucher purchase
        const result = await purchaseVoucher(guardData.guardId, numAmount, notes || undefined);

        if (result.success && result.data) {
          // Update local balance
          await updateBalance(result.data.newBalance);

          // Store voucher result for display
          if (result.data.voucher) {
            setVoucherResult(result.data.voucher);
          }

          setShowConfirmModal(false);
          setShowVoucherResultModal(true);

          // Refresh data
          loadData();
        } else {
          setShowConfirmModal(false);
          setResultType('error');
          setResultTitle('Voucher Error');
          setResultMessage(result.error || 'Failed to purchase voucher');
          setShowResultModal(true);
        }
      } else {
        // Bank transfer request (requires admin approval)
        const result = await requestPayout(guardData.guardId, numAmount, notes || undefined);

        setShowConfirmModal(false);

        if (result.success && result.data) {
          resetForm();
          setResultType('success');
          setResultTitle('Request Submitted');
          setResultMessage('Your bank transfer request has been submitted for admin approval. You will be notified when it is processed.');
          setShowResultModal(true);
          loadData();
        } else {
          setResultType('error');
          setResultTitle('Request Failed');
          setResultMessage(result.error || 'Failed to submit payout request');
          setShowResultModal(true);
        }
      }
    } catch (err) {
      console.error('Payout error:', err);
      setShowConfirmModal(false);
      setResultType('error');
      setResultTitle('Error');
      setResultMessage('Something went wrong. Please try again.');
      setShowResultModal(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setAmount('');
    setNotes('');
    setPayoutMethod(null);
  };

  const handleCopyToClipboard = async (text: string, field: string) => {
    await Clipboard.setStringAsync(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatVoucherPin = (pin: string): string => {
    // Format as XXXX XXXX XXXX XXXX
    return pin.replace(/(.{4})/g, '$1 ').trim();
  };

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'processing':
      case 'approved':
        return 'text-yellow-600 bg-yellow-50';
      case 'pending':
        return 'text-blue-600 bg-blue-50';
      case 'failed':
      case 'rejected':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getPayoutIcon = (type: string) => {
    switch (type) {
      case 'bank_transfer':
      case 'BANK_TRANSFER':
        return 'business';
      case 'cash':
      case 'VOUCHER':
        return 'card';
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

  const renderPayout = ({ item }: { item: Payout }) => {
    const statusColors = getStatusColor(item.status);

    return (
      <TouchableOpacity className="p-4">
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center flex-1">
            <View style={{ backgroundColor: '#5B94D333' }} className="w-10 h-10 rounded-full items-center justify-center mr-3">
              <Ionicons name={getPayoutIcon(item.type) as any} size={20} color="#5B94D3" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-900">
                {item.type.replace(/_/g, ' ').split(' ').map(word =>
                  word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                ).join(' ')}
              </Text>
              <Text className="text-xs text-gray-500">
                {item.voucherNumber || item.reference || 'No reference'}
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
      </TouchableOpacity>
    );
  };

  const renderPayoutRequest = ({ item }: { item: PayoutRequest }) => {
    const statusColors = getStatusColor(item.status);
    const hasVoucher = item.status === 'COMPLETED' && item.voucherPin;

    return (
      <TouchableOpacity
        className="p-4"
        onPress={() => {
          if (hasVoucher && item.voucherPin) {
            setVoucherResult({
              pin: item.voucherPin,
              serialNumber: item.voucherSerial || '',
              expiryDate: item.voucherExpiry || '',
              amount: item.amount,
              transactionId: item.id,
              reference: item.payoutId,
            });
            setShowVoucherResultModal(true);
          }
        }}
      >
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center flex-1">
            <View style={{ backgroundColor: item.method === 'VOUCHER' ? '#10B98133' : '#5B94D333' }} className="w-10 h-10 rounded-full items-center justify-center mr-3">
              <Ionicons
                name={item.method === 'VOUCHER' ? 'card' : 'business'}
                size={20}
                color={item.method === 'VOUCHER' ? '#10B981' : '#5B94D3'}
              />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-900">
                {item.method === 'VOUCHER' ? '1Voucher' : 'Bank Transfer'}
              </Text>
              <Text className="text-xs text-gray-500">
                {item.payoutId}
              </Text>
            </View>
          </View>
          <View className={`px-3 py-1 rounded-full ${statusColors.split(' ')[1]}`}>
            <Text className={`text-xs font-medium ${statusColors.split(' ')[0]}`}>
              {item.status}
            </Text>
          </View>
        </View>

        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-xs text-gray-500">Requested</Text>
            <Text className="text-sm text-gray-700">{formatDate(item.requestedAt)}</Text>
          </View>
          <View className="items-end">
            <Text className="text-xs text-gray-500">Amount</Text>
            <Text className="text-lg font-bold text-gray-900">
              {formatCurrency(item.amount)}
            </Text>
          </View>
        </View>

        {item.rejectionReason && (
          <View className="mt-2 p-2 bg-red-50 rounded-lg">
            <Text className="text-xs text-red-600">Rejected: {item.rejectionReason}</Text>
          </View>
        )}

        {hasVoucher && (
          <View className="mt-2 p-2 bg-green-50 rounded-lg flex-row items-center">
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text className="text-xs text-green-600 ml-1">Tap to view voucher PIN</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Filter and pagination logic for payouts
  const filteredPayouts = payouts.filter(payout => {
    const matchesSearch = (payout.voucherNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         payout.type.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = selectedStatus === 'all' || payout.status.toLowerCase() === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  // Filter payout requests
  const filteredRequests = payoutRequests.filter(request => {
    const matchesSearch = request.payoutId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || request.status.toLowerCase() === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const currentItems = activeTab === 'history' ? filteredPayouts : filteredRequests;
  const totalPages = Math.ceil(currentItems.length / itemsPerPage);
  const paginatedItems = currentItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusBarHeight = () => {
    if (Platform.OS === 'ios') {
      return StatusBar.currentHeight || 44;
    }
    return StatusBar.currentHeight || 24;
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

        {/* Balance Card */}
        <View className="mx-4 mt-4 mb-4">
          <View className="bg-white rounded-xl p-6 shadow-sm">
            {loading ? (
              <View className="items-center justify-center py-6">
                <ActivityIndicator size="large" color="#5B94D3" />
              </View>
            ) : error ? (
              <View className="items-center justify-center py-6">
                <Ionicons name="alert-circle-outline" size={40} color="#EF4444" />
                <Text className="text-red-500 mt-2 text-center">{error}</Text>
              </View>
            ) : (
              <View className="items-center mb-6">
                <Text className="text-gray-500 text-sm mb-2">Available for Payout</Text>
                <Text className="text-gray-900 text-4xl font-bold">
                  {formatCurrency(guardData?.balance || 0)}
                </Text>
              </View>
            )}

            <TouchableOpacity
              onPress={() => setShowRequestModal(true)}
              style={{ backgroundColor: '#DEFF00' }}
              className="rounded-lg py-4 items-center"
            >
              <Text style={{ color: '#11468F' }} className="font-semibold text-base">Request Payout</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View className="mx-4 mb-4">
          <View className="bg-white rounded-xl p-1 flex-row shadow-sm">
            <TouchableOpacity
              onPress={() => { setActiveTab('history'); setCurrentPage(1); }}
              className={`flex-1 py-3 rounded-lg items-center ${activeTab === 'history' ? 'bg-gray-100' : ''}`}
            >
              <Text className={`font-medium ${activeTab === 'history' ? 'text-gray-900' : 'text-gray-500'}`}>
                History
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { setActiveTab('requests'); setCurrentPage(1); }}
              className={`flex-1 py-3 rounded-lg items-center ${activeTab === 'requests' ? 'bg-gray-100' : ''}`}
            >
              <View className="flex-row items-center">
                <Text className={`font-medium ${activeTab === 'requests' ? 'text-gray-900' : 'text-gray-500'}`}>
                  Requests
                </Text>
                {payoutRequests.filter(r => r.status === 'PENDING').length > 0 && (
                  <View className="ml-2 bg-blue-500 rounded-full w-5 h-5 items-center justify-center">
                    <Text className="text-white text-xs font-bold">
                      {payoutRequests.filter(r => r.status === 'PENDING').length}
                    </Text>
                  </View>
                )}
              </View>
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
                placeholder="Search..."
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
                onPress={() => setShowStatusDropdown(!showStatusDropdown)}
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
                  {['all', 'pending', 'approved', 'processing', 'completed', 'rejected'].map((status, index) => (
                    <TouchableOpacity
                      key={status}
                      activeOpacity={0.7}
                      onPress={() => {
                        setSelectedStatus(status);
                        setShowStatusDropdown(false);
                        setCurrentPage(1);
                      }}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        backgroundColor: selectedStatus === status ? '#F0FDF4' : 'white',
                        borderBottomWidth: index < 5 ? 1 : 0,
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

        {/* List */}
        <View className="mx-4 mb-4">
          <View className="bg-white rounded-xl shadow-sm">
            <View className="px-4 py-3 border-b border-gray-100">
              <Text className="text-lg font-semibold text-gray-900">
                {activeTab === 'history' ? 'Payout History' : 'Payout Requests'}
              </Text>
              <Text className="text-sm text-gray-500">
                Showing {paginatedItems.length} of {currentItems.length} results
              </Text>
            </View>

            {paginatedItems.length > 0 ? (
              <View>
                {paginatedItems.map((item, index) => (
                  <View key={item.id}>
                    {activeTab === 'history'
                      ? renderPayout({ item: item as Payout })
                      : renderPayoutRequest({ item: item as PayoutRequest })
                    }
                    {index < paginatedItems.length - 1 && (
                      <View className="border-b border-gray-100" />
                    )}
                  </View>
                ))}
              </View>
            ) : (
              <View className="items-center justify-center py-20">
                <Ionicons name="wallet-outline" size={48} color="#9CA3AF" />
                <Text className="text-gray-500 mt-2">
                  {activeTab === 'history' ? 'No payout history found' : 'No payout requests found'}
                </Text>
              </View>
            )}
          </View>

          {/* Pagination */}
          {totalPages > 1 && (
            <View className="px-4 py-3 border-t border-gray-100 bg-gray-50 mt-2 rounded-xl">
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

                <Text className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </Text>

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
        </ScrollView>
      </TouchableWithoutFeedback>

      {/* Request Payout Modal - Method Selection */}
      <Modal
        visible={showRequestModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => { setShowRequestModal(false); resetForm(); }}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6 pb-10">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold">Request Payout</Text>
              <TouchableOpacity onPress={() => { setShowRequestModal(false); resetForm(); }}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Balance Display */}
            <View className="bg-gray-50 rounded-xl p-4 mb-6">
              <Text className="text-sm text-gray-500 mb-1">Available Balance</Text>
              <Text className="text-2xl font-bold text-gray-900">
                {formatCurrency(guardData?.balance || 0)}
              </Text>
            </View>

            {/* Payout Method Selection */}
            <Text className="text-sm font-medium text-gray-700 mb-3">Choose Payout Method</Text>

            {/* 1Voucher Option */}
            <TouchableOpacity
              onPress={() => handleSelectMethod('voucher')}
              className={`border-2 rounded-xl p-4 mb-3 ${
                payoutMethod === 'voucher' ? 'border-green-500 bg-green-50' : 'border-gray-200'
              }`}
            >
              <View className="flex-row items-center">
                <View className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${
                  payoutMethod === 'voucher' ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  <Ionicons
                    name="card"
                    size={24}
                    color={payoutMethod === 'voucher' ? '#10B981' : '#6B7280'}
                  />
                </View>
                <View className="flex-1">
                  <Text className={`text-base font-semibold ${
                    payoutMethod === 'voucher' ? 'text-green-700' : 'text-gray-900'
                  }`}>
                    1Voucher (Instant)
                  </Text>
                  <Text className="text-sm text-gray-500">
                    Get a cash voucher PIN immediately
                  </Text>
                  <Text className="text-xs text-gray-400 mt-1">
                    Min: R5 | Max: R5,000
                  </Text>
                </View>
                {payoutMethod === 'voucher' && (
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                )}
              </View>
            </TouchableOpacity>

            {/* Bank Transfer Option */}
            <TouchableOpacity
              onPress={() => handleSelectMethod('bank_transfer')}
              className={`border-2 rounded-xl p-4 mb-6 ${
                payoutMethod === 'bank_transfer' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <View className="flex-row items-center">
                <View className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${
                  payoutMethod === 'bank_transfer' ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  <Ionicons
                    name="business"
                    size={24}
                    color={payoutMethod === 'bank_transfer' ? '#3B82F6' : '#6B7280'}
                  />
                </View>
                <View className="flex-1">
                  <Text className={`text-base font-semibold ${
                    payoutMethod === 'bank_transfer' ? 'text-blue-700' : 'text-gray-900'
                  }`}>
                    Bank Transfer
                  </Text>
                  <Text className="text-sm text-gray-500">
                    Request transfer to your bank account
                  </Text>
                  <Text className="text-xs text-gray-400 mt-1">
                    Min: R50 | Requires approval (1-3 days)
                  </Text>
                </View>
                {payoutMethod === 'bank_transfer' && (
                  <Ionicons name="checkmark-circle" size={24} color="#3B82F6" />
                )}
              </View>
            </TouchableOpacity>

            {/* Amount Input (shown when method selected) */}
            {payoutMethod && (
              <>
                <Text className="text-sm font-medium text-gray-700 mb-2">Amount</Text>
                <View className="flex-row items-center bg-gray-50 rounded-lg px-4 py-3 mb-3">
                  <Text className="text-xl font-bold text-gray-700 mr-2">R</Text>
                  <TextInput
                    value={amount}
                    onChangeText={setAmount}
                    placeholder="0.00"
                    keyboardType="numeric"
                    className="flex-1 text-xl"
                  />
                </View>

                {/* Quick Amount Buttons */}
                <View className="flex-row flex-wrap mb-4">
                  {QUICK_AMOUNTS.map((quickAmount) => (
                    <TouchableOpacity
                      key={quickAmount}
                      onPress={() => handleQuickAmount(quickAmount)}
                      className={`px-4 py-2 rounded-lg mr-2 mb-2 ${
                        amount === quickAmount.toString()
                          ? 'bg-gray-800'
                          : 'bg-gray-100'
                      }`}
                    >
                      <Text className={`font-medium ${
                        amount === quickAmount.toString() ? 'text-white' : 'text-gray-700'
                      }`}>
                        R{quickAmount}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Notes (optional) */}
                <Text className="text-sm font-medium text-gray-700 mb-2">Notes (Optional)</Text>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Add a note for this request..."
                  multiline
                  numberOfLines={2}
                  className="bg-gray-50 rounded-lg px-4 py-3 mb-6 text-base"
                  style={{ minHeight: 60, textAlignVertical: 'top' }}
                />
              </>
            )}

            {/* Continue Button */}
            <TouchableOpacity
              onPress={handleProceedToConfirm}
              disabled={!payoutMethod || !amount}
              style={{
                backgroundColor: payoutMethod && amount ? '#5B94D3' : '#E5E7EB',
              }}
              className="rounded-lg py-4 items-center"
            >
              <Text style={{
                color: payoutMethod && amount ? '#FFFFFF' : '#9CA3AF',
              }} className="font-semibold text-base">
                Continue
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50 px-6">
          <View className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <View className="items-center mb-6">
              <View className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${
                payoutMethod === 'voucher' ? 'bg-green-100' : 'bg-blue-100'
              }`}>
                <Ionicons
                  name={payoutMethod === 'voucher' ? 'card' : 'business'}
                  size={32}
                  color={payoutMethod === 'voucher' ? '#10B981' : '#3B82F6'}
                />
              </View>
              <Text className="text-xl font-bold text-gray-900 mb-2">Confirm Payout</Text>
              <Text className="text-gray-500 text-center">
                {payoutMethod === 'voucher'
                  ? 'You will receive a 1Voucher PIN instantly'
                  : 'Your request will be sent for admin approval'
                }
              </Text>
            </View>

            <View className="bg-gray-50 rounded-xl p-4 mb-6">
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-500">Method</Text>
                <Text className="font-medium text-gray-900">
                  {payoutMethod === 'voucher' ? '1Voucher' : 'Bank Transfer'}
                </Text>
              </View>
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-500">Amount</Text>
                <Text className="font-bold text-gray-900 text-lg">
                  {formatCurrency(parseFloat(amount) || 0)}
                </Text>
              </View>
              {notes && (
                <View className="mt-2 pt-2 border-t border-gray-200">
                  <Text className="text-gray-500 text-sm">Note: {notes}</Text>
                </View>
              )}
            </View>

            <View className="flex-row space-x-3">
              <TouchableOpacity
                onPress={() => { setShowConfirmModal(false); setShowRequestModal(true); }}
                className="flex-1 bg-gray-100 rounded-lg py-3 items-center mr-2"
                disabled={isProcessing}
              >
                <Text className="font-medium text-gray-700">Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmPayout}
                disabled={isProcessing}
                style={{ backgroundColor: payoutMethod === 'voucher' ? '#10B981' : '#3B82F6' }}
                className="flex-1 rounded-lg py-3 items-center ml-2"
              >
                {isProcessing ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text className="font-semibold text-white">
                    {payoutMethod === 'voucher' ? 'Get Voucher' : 'Submit Request'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Voucher Result Modal */}
      <Modal
        visible={showVoucherResultModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => { setShowVoucherResultModal(false); setVoucherResult(null); resetForm(); }}
      >
        <View className="flex-1 justify-center items-center bg-black/50 px-6">
          <View className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <View className="items-center mb-6">
              <View className="w-16 h-16 rounded-full bg-green-100 items-center justify-center mb-4">
                <Ionicons name="checkmark-circle" size={40} color="#10B981" />
              </View>
              <Text className="text-xl font-bold text-gray-900 mb-2">Voucher Ready!</Text>
              <Text className="text-gray-500 text-center">
                Your 1Voucher has been generated. Use the PIN below to redeem your cash.
              </Text>
            </View>

            {voucherResult && (
              <View className="bg-gray-50 rounded-xl p-4 mb-4">
                {/* PIN Display */}
                <View className="mb-4">
                  <Text className="text-sm text-gray-500 mb-2">Voucher PIN</Text>
                  <TouchableOpacity
                    onPress={() => handleCopyToClipboard(voucherResult.pin, 'pin')}
                    className="bg-white border border-gray-200 rounded-lg p-3 flex-row items-center justify-between"
                  >
                    <Text className="text-lg font-mono font-bold text-gray-900">
                      {formatVoucherPin(voucherResult.pin)}
                    </Text>
                    <View className="flex-row items-center">
                      {copiedField === 'pin' ? (
                        <Ionicons name="checkmark" size={20} color="#10B981" />
                      ) : (
                        <Ionicons name="copy-outline" size={20} color="#6B7280" />
                      )}
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Serial Number */}
                <View className="mb-4">
                  <Text className="text-sm text-gray-500 mb-2">Serial Number</Text>
                  <TouchableOpacity
                    onPress={() => handleCopyToClipboard(voucherResult.serialNumber, 'serial')}
                    className="bg-white border border-gray-200 rounded-lg p-3 flex-row items-center justify-between"
                  >
                    <Text className="text-sm font-medium text-gray-700">
                      {voucherResult.serialNumber}
                    </Text>
                    {copiedField === 'serial' ? (
                      <Ionicons name="checkmark" size={18} color="#10B981" />
                    ) : (
                      <Ionicons name="copy-outline" size={18} color="#6B7280" />
                    )}
                  </TouchableOpacity>
                </View>

                {/* Amount & Expiry */}
                <View className="flex-row justify-between">
                  <View>
                    <Text className="text-sm text-gray-500">Amount</Text>
                    <Text className="font-bold text-gray-900">
                      {formatCurrency(voucherResult.amount)}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-sm text-gray-500">Expires</Text>
                    <Text className="font-medium text-gray-700">
                      {formatDate(voucherResult.expiryDate)}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            <View className="bg-yellow-50 rounded-lg p-3 mb-4">
              <View className="flex-row items-start">
                <Ionicons name="warning" size={20} color="#D97706" />
                <Text className="text-sm text-yellow-800 ml-2 flex-1">
                  Save this PIN securely. You will need it to redeem your voucher at any Flash retailer.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => { setShowVoucherResultModal(false); setVoucherResult(null); resetForm(); }}
              style={{ backgroundColor: '#10B981' }}
              className="rounded-lg py-4 items-center"
            >
              <Text className="font-semibold text-white">Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Result Modal (Success/Error feedback) */}
      <Modal
        visible={showResultModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowResultModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50 px-6">
          <View className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <View className="items-center mb-6">
              <View className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${
                resultType === 'success' ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <Ionicons
                  name={resultType === 'success' ? 'checkmark-circle' : 'close-circle'}
                  size={40}
                  color={resultType === 'success' ? '#10B981' : '#EF4444'}
                />
              </View>
              <Text className="text-xl font-bold text-gray-900 mb-2">{resultTitle}</Text>
              <Text className="text-gray-500 text-center">{resultMessage}</Text>
            </View>

            <TouchableOpacity
              onPress={() => {
                setShowResultModal(false);
                if (resultType === 'success') {
                  loadData();
                }
              }}
              style={{ backgroundColor: resultType === 'success' ? '#10B981' : '#5B94D3' }}
              className="rounded-lg py-4 items-center"
            >
              <Text className="font-semibold text-white">OK</Text>
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
                  trackColor={{ false: '#d1d5db', true: '#5B94D3' }}
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
              style={{ backgroundColor: '#5B94D3' }}
              className="rounded-lg py-4 items-center"
            >
              <Text className="text-white font-semibold text-base">Save Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
