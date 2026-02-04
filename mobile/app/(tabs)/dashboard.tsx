import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Alert,
  TextInput,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import QRCode from 'react-native-qrcode-svg';
import { mockCarGuard, mockTransactions, formatCurrency } from '../../data/mockData';
import { TippaLogo } from '../../components/TippaLogo';
import { useUser } from '@clerk/clerk-expo';
import { commissionService, CommissionInfo } from '../../services/commissionService';
import { useGuard } from '../../contexts/GuardContext';
import { getGuardProfile } from '../../services/mobileApiService';

export default function DashboardScreen() {
  const { user } = useUser();
  const { guardData, refreshGuardData, isLoading: guardLoading } = useGuard();
  const [refreshing, setRefreshing] = useState(false);
  const [showAirtimeModal, setShowAirtimeModal] = useState(false);
  const [showElectricityModal, setShowElectricityModal] = useState(false);
  const [downloadingQR, setDownloadingQR] = useState(false);
  const [airtimeAmount, setAirtimeAmount] = useState('');
  const [electricityAmount, setElectricityAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [meterNumber, setMeterNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const qrViewRef = useRef(null);
  const [commissionRate, setCommissionRate] = useState(0);
  const [exampleTip] = useState(20); // Show example for R20 tip
  const [commissionInfo, setCommissionInfo] = useState<CommissionInfo | null>(null);
  const [qrImageLoading, setQrImageLoading] = useState(true);
  const [qrImageError, setQrImageError] = useState(false);

  // Load QR code and commission data when guard data is available
  useEffect(() => {
    if (guardData && !guardLoading) {
      loadAdditionalData();
    } else if (!guardLoading && !guardData) {
      setError('Guard profile not found. Please link your account.');
      setLoading(false);
    }
  }, [guardData, guardLoading]);

  const loadAdditionalData = async () => {
    if (!guardData) return;

    try {
      setError(null);
      console.log('🔍 Loading additional data for guard:', guardData.guardId);
      console.log('🔗 Raw QR Code (payment URL):', guardData.qrCode);
      console.log('📷 QR Code URL from Cloudinary:', guardData.qrCodeUrl);

      // Reset QR image state when loading new data
      setQrImageLoading(true);
      setQrImageError(false);

      // Fetch commission rate from admin API
      const rate = await commissionService.getActiveCommissionRate();
      setCommissionRate(rate);

      // Calculate example commission
      const info = commissionService.calculateCommission(exampleTip, rate);
      setCommissionInfo(info);
      console.log('✅ Commission rate loaded:', rate + '%');
    } catch (err) {
      console.error('❌ Error loading additional data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data. Please check your connection.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      // Refresh guard data from admin API
      if (user?.id) {
        await refreshGuardData(user.id);
      }
      // Reload QR code and commission data
      await loadAdditionalData();
    } finally {
      setRefreshing(false);
    }
  }, [user, refreshGuardData]);

  const downloadQRCode = async () => {
    if (!qrViewRef.current) {
      Alert.alert('Error', 'QR code not ready. Please try again.');
      return;
    }
    
    try {
      setDownloadingQR(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Add delay to ensure QR code is fully rendered
      await new Promise(resolve => setTimeout(resolve, 500));

      // Capture QR code at 300 DPI for high-quality printing
      // 300 DPI = ~1181 pixels for 4-inch print size
      const uri = await captureRef(qrViewRef.current, {
        format: 'png',
        quality: 1.0, // Maximum quality
        width: 1200,  // High resolution for printing
        height: 1200,
        result: 'tmpfile', // Use tmpfile for better compatibility
      });

      // Create filename with guard info
      const displayName = guardData?.fullName || user?.fullName || mockCarGuard.name;
      const guardName = displayName.replace(/[^a-zA-Z0-9]/g, '_');
      const guardId = guardData?.guardId || mockCarGuard.id;
      const filename = `TippaQR_${guardName}_${guardId}_300DPI.png`;
      const downloadPath = `${FileSystem.documentDirectory}${filename}`;

      // Copy to permanent location (use copyAsync instead of moveAsync)
      await FileSystem.copyAsync({
        from: uri,
        to: downloadPath,
      });

      // Clean up temp file
      try {
        await FileSystem.deleteAsync(uri, { idempotent: true });
      } catch (cleanupError) {
        console.log('Temp file cleanup failed:', cleanupError);
      }

      // Share the high-quality QR code
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(downloadPath, {
          mimeType: 'image/png',
          dialogTitle: 'Save QR Code for Printing (300 DPI)',
        });
        
        Alert.alert(
          'Success!', 
          'QR Code ready for download!\n\nOptimized for 300 DPI printing - perfect for high-quality prints.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Success!', 
          `QR Code saved as:\n${filename}\n\nOptimized for 300 DPI printing`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error downloading QR code:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert(
        'Download Error',
        `Failed to save QR code: ${errorMessage}\n\nPlease try again or contact support if the issue persists.`,
        [{ text: 'OK' }]
      );
    } finally {
      setDownloadingQR(false);
    }
  };

  const handleQuickAction = (action: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    switch (action) {
      case 'airtime':
        setShowAirtimeModal(true);
        break;
      case 'electricity':
        setShowElectricityModal(true);
        break;
    }
  };

  const recentTransactions = mockTransactions.slice(0, 3);

  // Calculate ins and outs from transactions
  const calculateInsAndOuts = () => {
    const income = mockTransactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = mockTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    return { income, expenses };
  };

  const { income, expenses } = calculateInsAndOuts();
  const maxAmount = Math.max(income, expenses);
  const incomeWidth = maxAmount > 0 ? (income / maxAmount) * 100 : 0;
  const expenseWidth = maxAmount > 0 ? (expenses / maxAmount) * 100 : 0;

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right']}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {/* Header with Logo */}
        <LinearGradient
          colors={['#5B94D3', '#11468F']}
          className="px-6 pt-4 pb-8"
        >
          {/* Logo Section */}
          <View className="items-center mb-6">
            <TippaLogo size={80} />
          </View>

          {/* Welcome Message */}
          <View className="items-center mb-6">
            <Text className="text-white/80 text-sm">Welcome back,</Text>
            <Text className="text-white text-2xl font-bold">
              {guardData?.fullName || user?.fullName || mockCarGuard.name}
            </Text>
          </View>

          {/* QR Code Section - Prominent */}
          <View className="bg-white rounded-2xl p-6 shadow-md items-center">
            {(loading || guardLoading) ? (
              <View className="py-20">
                <ActivityIndicator size="large" color="#5B94D3" />
                <Text className="text-sm text-gray-500 mt-4">Loading QR code...</Text>
              </View>
            ) : error ? (
              <View className="py-20 items-center">
                <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
                <Text className="text-red-600 font-semibold mt-4 text-center">Unable to load data</Text>
                <Text className="text-sm text-gray-500 mt-2 text-center px-8">{error}</Text>
                <TouchableOpacity
                  onPress={() => {
                    setLoading(true);
                    setError(null);
                    loadAdditionalData();
                  }}
                  className="mt-4 bg-tippa-secondary px-6 py-2 rounded-lg"
                >
                  <Text className="text-white text-sm font-medium">Retry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text className="text-lg font-semibold text-gray-900 mb-4">
                  Your QR Code
                </Text>
                <Text className="text-sm text-gray-600 mb-4 text-center">
                  Show this to customers for tips
                </Text>
                <Text className="text-xs text-gray-500 mb-4">
                  Scan to tip
                </Text>
                <View
                  ref={qrViewRef}
                  collapsable={false}
                  style={{
                    backgroundColor: '#ffffff',
                    padding: 16,
                    borderRadius: 16,
                    borderWidth: 3,
                    borderColor: '#5B94D3',
                    width: 280,
                    height: 280,
                    justifyContent: 'center',
                    alignItems: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                >
                  {guardData?.qrCode ? (
                    // Generate clean QR code from payment URL - no branding, optimal for scanning
                    <QRCode
                      value={guardData.qrCode}
                      size={240}
                      backgroundColor="#ffffff"
                      color="#000000"
                      ecl="M"
                    />
                  ) : guardData?.qrCodeUrl ? (
                    // Fallback to Cloudinary image if raw URL not available
                    <>
                      {qrImageLoading && (
                        <View style={{ position: 'absolute', justifyContent: 'center', alignItems: 'center' }}>
                          <ActivityIndicator size="large" color="#5B94D3" />
                        </View>
                      )}
                      {qrImageError ? (
                        <View style={{ alignItems: 'center' }}>
                          <Ionicons name="qr-code-outline" size={80} color="#ccc" />
                          <Text style={{ color: '#999', fontSize: 12, marginTop: 8, textAlign: 'center' }}>
                            QR code not available
                          </Text>
                        </View>
                      ) : (
                        <Image
                          source={{ uri: guardData.qrCodeUrl }}
                          style={{ width: 240, height: 240 }}
                          resizeMode="contain"
                          onLoadStart={() => setQrImageLoading(true)}
                          onLoadEnd={() => setQrImageLoading(false)}
                          onError={() => {
                            setQrImageLoading(false);
                            setQrImageError(true);
                          }}
                        />
                      )}
                    </>
                  ) : (
                    <View style={{ alignItems: 'center' }}>
                      <Ionicons name="qr-code-outline" size={80} color="#ccc" />
                      <Text style={{ color: '#999', fontSize: 12, marginTop: 8, textAlign: 'center' }}>
                        No QR code available{'\n'}Contact your administrator
                      </Text>
                    </View>
                  )}
                </View>

                {/* Guard Info */}
                <View className="items-center mt-4">
                  <Text className="text-lg font-bold text-gray-900">
                    {guardData?.fullName || user?.fullName || mockCarGuard.name}
                  </Text>
                  <Text className="text-sm text-gray-500">
                    ID: {guardData?.guardId || mockCarGuard.id}
                  </Text>
                  <Text className="text-xs text-gray-400 mt-1">Scan to leave a tip</Text>
                </View>

                <View className="flex-row items-center mt-3 px-3 py-1 bg-green-50 rounded-full">
                  <View className="w-2 h-2 bg-tippa-success rounded-full mr-2" />
                  <Text className="text-xs text-green-700">
                    {guardData?.status || 'Active'}
                  </Text>
                </View>
              </>
            )}

            {/* Download Button */}
            <TouchableOpacity
              onPress={downloadQRCode}
              disabled={downloadingQR}
              style={{
                backgroundColor: downloadingQR ? '#F3F4F6' : '#5B94D3'
              }}
              className="flex-row items-center justify-center mt-4 px-4 py-3 rounded-xl"
            >
              {downloadingQR ? (
                <View className="flex-row items-center">
                  <Text className="text-tippa-secondary text-sm font-medium mr-2">Preparing...</Text>
                  <View className="w-4 h-4 border-2 border-tippa-secondary border-t-transparent rounded-full animate-spin" />
                </View>
              ) : (
                <View className="flex-row items-center">
                  <Ionicons name="download-outline" size={18} color="#FFFFFF" />
                  <Text className="text-white text-sm font-medium ml-2">
                    Download for Printing
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Commission Info Card */}
        {commissionRate > 0 && commissionInfo && (
          <View className="px-6 mt-6">
            <View className="bg-blue-50 rounded-2xl p-4 shadow-sm border border-blue-100">
              <View className="flex-row items-center mb-2">
                <Ionicons name="information-circle" size={20} color="#3B82F6" />
                <Text className="text-blue-900 font-semibold text-base ml-2">
                  Commission Rate: {commissionRate}%
                </Text>
              </View>
              <Text className="text-sm text-blue-800">
                For a R{exampleTip.toFixed(2)} tip, you will receive{' '}
                <Text className="font-bold text-green-600">
                  R{commissionInfo.guardReceivesAmount.toFixed(2)}
                </Text>
              </Text>
              <Text className="text-xs text-blue-600 mt-1">
                Commission: R{commissionInfo.commissionAmount.toFixed(2)}
              </Text>
            </View>
          </View>
        )}

        {/* Balance Card - Moved Down */}
        <View className="px-6 mt-6">
          <View className="bg-white rounded-2xl p-4 shadow-lg">
            <Text className="text-gray-600 text-sm mb-1">Available Balance</Text>
            <Text className="text-3xl font-bold text-gray-900">
              {formatCurrency(guardData?.balance || mockCarGuard.balance)}
            </Text>
            <View className="flex-row justify-between mt-4">
              <View>
                <Text className="text-xs text-gray-500">Today's Earnings</Text>
                <Text className="text-base font-semibold text-tippa-success">R 150.00</Text>
              </View>
              <View>
                <Text className="text-xs text-gray-500">This Week</Text>
                <Text className="text-base font-semibold text-tippa-success">R 850.00</Text>
              </View>
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
          </View>
        </View>

        {/* Money Flow Chart */}
        <View className="px-6 mt-6 mb-8">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-semibold text-gray-900">Money Flow</Text>
            <TouchableOpacity>
              <Text className="text-sm text-tippa-secondary">See all</Text>
            </TouchableOpacity>
          </View>

          <View className="bg-white rounded-xl shadow-sm p-6">
            {/* Income Bar */}
            <View className="mb-6">
              <View className="flex-row justify-between items-center mb-2">
                <View className="flex-row items-center">
                  <View className="w-3 h-3 rounded-full bg-tippa-success mr-2" />
                  <Text className="text-sm font-medium text-gray-700">Income</Text>
                </View>
                <Text className="text-base font-bold text-tippa-success">
                  +{formatCurrency(income)}
                </Text>
              </View>
              <View className="h-8 bg-gray-100 rounded-lg overflow-hidden">
                <View
                  className="h-full bg-tippa-success rounded-lg"
                  style={{ width: `${incomeWidth}%` }}
                />
              </View>
            </View>

            {/* Expenses Bar */}
            <View>
              <View className="flex-row justify-between items-center mb-2">
                <View className="flex-row items-center">
                  <View className="w-3 h-3 rounded-full bg-tippa-danger mr-2" />
                  <Text className="text-sm font-medium text-gray-700">Expenses</Text>
                </View>
                <Text className="text-base font-bold text-tippa-danger">
                  -{formatCurrency(expenses)}
                </Text>
              </View>
              <View className="h-8 bg-gray-100 rounded-lg overflow-hidden">
                <View
                  className="h-full bg-tippa-danger rounded-lg"
                  style={{ width: `${expenseWidth}%` }}
                />
              </View>
            </View>

            {/* Net Summary */}
            <View className="mt-6 pt-6 border-t border-gray-100">
              <View className="flex-row justify-between items-center">
                <Text className="text-sm font-medium text-gray-600">Net Flow</Text>
                <Text
                  className="text-lg font-bold"
                  style={{
                    color: income - expenses >= 0 ? '#10B981' : '#B01519'
                  }}
                >
                  {income - expenses >= 0 ? '+' : ''}{formatCurrency(income - expenses)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Airtime Modal */}
      <Modal
        visible={showAirtimeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAirtimeModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6 pb-10">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold">Buy Airtime</Text>
              <TouchableOpacity onPress={() => setShowAirtimeModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Phone Number Input */}
            <Text className="text-sm font-medium text-gray-700 mb-2">Phone Number</Text>
            <View className="bg-gray-50 rounded-lg px-4 py-3 mb-4">
              <TextInput
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="Enter phone number (e.g., 0812345678)"
                keyboardType="phone-pad"
                className="text-base"
              />
            </View>

            {/* Amount Input */}
            <Text className="text-sm font-medium text-gray-700 mb-2">Amount</Text>
            <View className="flex-row items-center bg-gray-50 rounded-lg px-4 py-3 mb-2">
              <Text className="text-xl font-bold text-gray-700 mr-2">R</Text>
              <TextInput
                value={airtimeAmount}
                onChangeText={setAirtimeAmount}
                placeholder="0.00"
                keyboardType="numeric"
                className="flex-1 text-xl"
              />
            </View>
            <Text className="text-xs text-gray-500 mb-6">
              Available balance: {formatCurrency(guardData?.balance || mockCarGuard.balance)}
            </Text>

            {/* Quick Amount Buttons */}
            <Text className="text-sm font-medium text-gray-700 mb-3">Quick Amounts</Text>
            <View className="flex-row flex-wrap mb-6">
              {['10', '20', '50', '100', '200'].map((quickAmount) => (
                <TouchableOpacity
                  key={quickAmount}
                  onPress={() => setAirtimeAmount(quickAmount)}
                  className="px-4 py-2 rounded-lg mr-2 mb-2 bg-gray-100"
                >
                  <Text className="text-sm font-medium text-gray-700">
                    R{quickAmount}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={() => {
                Alert.alert('Airtime Purchased Successfully!', 'The airtime voucher will be sent to your registered number.');
                setShowAirtimeModal(false);
                setAirtimeAmount('');
                setPhoneNumber('');
              }}
              style={{ backgroundColor: '#5B94D3' }}
              className="rounded-lg py-4 items-center"
            >
              <Text className="text-white font-semibold text-base">Purchase Airtime</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Electricity Modal */}
      <Modal
        visible={showElectricityModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowElectricityModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6 pb-10">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold">Buy Electricity</Text>
              <TouchableOpacity onPress={() => setShowElectricityModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Meter Number Input */}
            <Text className="text-sm font-medium text-gray-700 mb-2">Meter Number</Text>
            <View className="bg-gray-50 rounded-lg px-4 py-3 mb-4">
              <TextInput
                value={meterNumber}
                onChangeText={setMeterNumber}
                placeholder="Enter meter number (e.g., 12345678901)"
                keyboardType="numeric"
                className="text-base"
              />
            </View>

            {/* Amount Input */}
            <Text className="text-sm font-medium text-gray-700 mb-2">Amount</Text>
            <View className="flex-row items-center bg-gray-50 rounded-lg px-4 py-3 mb-2">
              <Text className="text-xl font-bold text-gray-700 mr-2">R</Text>
              <TextInput
                value={electricityAmount}
                onChangeText={setElectricityAmount}
                placeholder="0.00"
                keyboardType="numeric"
                className="flex-1 text-xl"
              />
            </View>
            <Text className="text-xs text-gray-500 mb-6">
              Available balance: {formatCurrency(guardData?.balance || mockCarGuard.balance)}
            </Text>

            {/* Quick Amount Buttons */}
            <Text className="text-sm font-medium text-gray-700 mb-3">Quick Amounts</Text>
            <View className="flex-row flex-wrap mb-6">
              {['50', '100', '200', '300', '500'].map((quickAmount) => (
                <TouchableOpacity
                  key={quickAmount}
                  onPress={() => setElectricityAmount(quickAmount)}
                  className="px-4 py-2 rounded-lg mr-2 mb-2 bg-gray-100"
                >
                  <Text className="text-sm font-medium text-gray-700">
                    R{quickAmount}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Info Note */}
            <View className="bg-blue-50 rounded-lg p-4 mb-6">
              <View className="flex-row items-center mb-2">
                <Ionicons name="information-circle" size={20} color="#3B82F6" />
                <Text className="text-blue-800 font-medium ml-2">Electricity Purchase</Text>
              </View>
              <Text className="text-blue-700 text-sm">
                You'll receive a prepaid electricity token via SMS after purchase.
              </Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={() => {
                Alert.alert('Electricity Purchased Successfully!', 'The electricity token will be sent to your registered number.');
                setShowElectricityModal(false);
                setElectricityAmount('');
                setMeterNumber('');
              }}
              style={{ backgroundColor: '#5B94D3' }}
              className="rounded-lg py-4 items-center"
            >
              <Text className="text-white font-semibold text-base">Purchase Electricity</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}