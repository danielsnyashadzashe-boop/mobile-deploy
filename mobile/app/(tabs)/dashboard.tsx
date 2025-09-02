import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { mockCarGuard, mockTransactions, formatCurrency } from '../../data/mockData';
import { TippaLogo } from '../../components/TippaLogo';

export default function DashboardScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [showAirtimeModal, setShowAirtimeModal] = useState(false);
  const [showElectricityModal, setShowElectricityModal] = useState(false);
  const [downloadingQR, setDownloadingQR] = useState(false);
  const [airtimeAmount, setAirtimeAmount] = useState('');
  const [electricityAmount, setElectricityAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [meterNumber, setMeterNumber] = useState('');
  const qrViewRef = useRef(null);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

  const downloadQRCode = async () => {
    if (!qrViewRef.current) {
      Alert.alert('Error', 'QR code not ready. Please try again.');
      return;
    }
    
    try {
      setDownloadingQR(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Add a small delay to ensure QR code is fully rendered
      await new Promise(resolve => setTimeout(resolve, 100));

      // Capture QR code at 300 DPI for high-quality printing
      // 300 DPI = ~1181 pixels for 4-inch print size
      const uri = await captureRef(qrViewRef.current, {
        format: 'png',
        quality: 1.0, // Maximum quality
        width: 1181,  // 300 DPI equivalent for ~4 inch print
        height: 1181,
        result: 'tmpfile', // Use tmpfile for better compatibility
      });

      // Create filename with guard info
      const guardName = mockCarGuard.name.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `TippaQR_${guardName}_${mockCarGuard.id}_300DPI.png`;
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
      Alert.alert(
        'Download Error', 
        `Failed to save QR code: ${error.message || 'Unknown error'}\n\nPlease try again or contact support if the issue persists.`,
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
          colors={['#10B981', '#059669']}
          className="px-6 pt-4 pb-8"
        >
          {/* Logo Section */}
          <View className="items-center mb-6">
            <TippaLogo size={80} />
          </View>

          {/* Welcome Message */}
          <View className="items-center mb-6">
            <Text className="text-white/80 text-sm">Welcome back,</Text>
            <Text className="text-white text-2xl font-bold">{mockCarGuard.name}</Text>
          </View>

          {/* QR Code Section - Prominent */}
          <View className="bg-white rounded-2xl p-6 shadow-md items-center">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              Your QR Code
            </Text>
            <Text className="text-sm text-gray-600 mb-4 text-center">
              Show this to customers for tips
            </Text>
            <Text className="text-xs text-gray-500 mb-4">
              This is your permanent QR code
            </Text>
            <View 
              ref={qrViewRef} 
              className="p-4 bg-white rounded-xl border-2 border-gray-100"
              style={{ backgroundColor: '#ffffff' }}
            >
              <QRCode
                value={`tippa://guard/${mockCarGuard.id}`}
                size={200}
                color="#10B981"
                backgroundColor="#ffffff"
                enableLinearGradient={false}
                logo={null}
              />
            </View>
            
            {/* Guard Info */}
            <View className="items-center mt-4">
              <Text className="text-lg font-bold text-gray-900">{mockCarGuard.name}</Text>
              <Text className="text-sm text-gray-500">ID: {mockCarGuard.id}</Text>
              <Text className="text-xs text-gray-400 mt-1">Scan to leave a tip</Text>
            </View>

            <View className="flex-row items-center mt-3 px-3 py-1 bg-tippa-50 rounded-full">
              <View className="w-2 h-2 bg-tippa-500 rounded-full mr-2" />
              <Text className="text-xs text-tippa-700">Active</Text>
            </View>

            {/* Download Button */}
            <TouchableOpacity
              onPress={downloadQRCode}
              disabled={downloadingQR}
              className={`flex-row items-center justify-center mt-4 px-4 py-3 rounded-xl ${
                downloadingQR 
                  ? 'bg-gray-100' 
                  : 'bg-blue-50 hover:bg-blue-100 active:bg-blue-200'
              }`}
            >
              {downloadingQR ? (
                <View className="flex-row items-center">
                  <Text className="text-blue-600 text-sm font-medium mr-2">Preparing...</Text>
                  <View className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </View>
              ) : (
                <View className="flex-row items-center">
                  <Ionicons name="download-outline" size={18} color="#2563EB" />
                  <Text className="text-blue-600 text-sm font-medium ml-2">
                    Download for Printing
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Balance Card - Moved Down */}
        <View className="px-6 mt-6">
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
              Available balance: {formatCurrency(mockCarGuard.balance)}
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
                Alert.alert('Purchase Airtime', 'Airtime purchase feature coming soon!');
                setShowAirtimeModal(false);
                setAirtimeAmount('');
                setPhoneNumber('');
              }}
              className="bg-tippa-500 rounded-lg py-4 items-center"
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
              Available balance: {formatCurrency(mockCarGuard.balance)}
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
                Alert.alert('Purchase Electricity', 'Electricity purchase feature coming soon!');
                setShowElectricityModal(false);
                setElectricityAmount('');
                setMeterNumber('');
              }}
              className="bg-tippa-500 rounded-lg py-4 items-center"
            >
              <Text className="text-white font-semibold text-base">Purchase Electricity</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}