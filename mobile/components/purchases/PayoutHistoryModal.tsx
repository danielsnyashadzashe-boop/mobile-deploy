import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { getPayoutRequests } from '../../services/mobileApiService';

interface PayoutHistoryModalProps {
  visible: boolean;
  onClose: () => void;
  guardId: string;
}

interface PayoutRequest {
  id: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'COMPLETED' | 'REJECTED';
  requestDate: string;
  processDate: string | null;
  notes: string | null;
  rejectionReason: string | null;
  voucherPin: string | null;
}

const statusConfig = {
  PENDING: {
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    textColor: '#92400E',
    icon: 'time-outline' as const,
    label: 'Pending',
  },
  APPROVED: {
    color: '#3B82F6',
    bgColor: '#DBEAFE',
    textColor: '#1E40AF',
    icon: 'checkmark-circle-outline' as const,
    label: 'Approved',
  },
  COMPLETED: {
    color: '#10B981',
    bgColor: '#D1FAE5',
    textColor: '#065F46',
    icon: 'checkmark-done-circle' as const,
    label: 'Completed',
  },
  REJECTED: {
    color: '#EF4444',
    bgColor: '#FEE2E2',
    textColor: '#991B1B',
    icon: 'close-circle-outline' as const,
    label: 'Rejected',
  },
};

export default function PayoutHistoryModal({
  visible,
  onClose,
  guardId,
}: PayoutHistoryModalProps) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState<PayoutRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadRequests = async () => {
    if (!guardId) {
      setError('Guard ID not available');
      setLoading(false);
      return;
    }

    try {
      const response = await getPayoutRequests(guardId);
      if (response.success && response.data) {
        setRequests(response.data);
        setError(null);
      } else {
        setError(response.error || 'Failed to load payout requests');
      }
    } catch (err) {
      setError('Failed to load payout requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (visible && guardId) {
      setLoading(true);
      loadRequests();
    }
  }, [visible, guardId]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadRequests();
  };

  const handleCopyPin = async (pin: string, id: string) => {
    await Clipboard.setStringAsync(pin);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatCurrency = (amount: number) => `R${amount.toFixed(2)}`;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderRequest = (request: PayoutRequest) => {
    const config = statusConfig[request.status];

    return (
      <View key={request.id} style={styles.requestCard}>
        <View style={styles.requestHeader}>
          <View style={styles.requestAmount}>
            <Text style={styles.amountLabel}>Amount</Text>
            <Text style={styles.amountValue}>{formatCurrency(request.amount)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: config.bgColor }]}>
            <Ionicons name={config.icon} size={14} color={config.color} />
            <Text style={[styles.statusText, { color: config.textColor }]}>
              {config.label}
            </Text>
          </View>
        </View>

        <View style={styles.requestDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Requested</Text>
            <Text style={styles.detailValue}>{formatDate(request.requestDate)}</Text>
          </View>

          {request.processDate && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Processed</Text>
              <Text style={styles.detailValue}>{formatDate(request.processDate)}</Text>
            </View>
          )}

          {request.notes && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Notes</Text>
              <Text style={styles.detailValue}>{request.notes}</Text>
            </View>
          )}
        </View>

        {/* Show rejection reason */}
        {request.status === 'REJECTED' && request.rejectionReason && (
          <View style={styles.rejectionBox}>
            <Ionicons name="alert-circle" size={16} color="#991B1B" />
            <Text style={styles.rejectionText}>{request.rejectionReason}</Text>
          </View>
        )}

        {/* Show voucher PIN for completed requests */}
        {request.status === 'COMPLETED' && request.voucherPin && (
          <View style={styles.voucherBox}>
            <Text style={styles.voucherLabel}>Voucher PIN</Text>
            <View style={styles.voucherPinRow}>
              <Text style={styles.voucherPin}>{request.voucherPin}</Text>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={() => handleCopyPin(request.voucherPin!, request.id)}
              >
                <Ionicons
                  name={copiedId === request.id ? 'checkmark' : 'copy-outline'}
                  size={16}
                  color="#065F46"
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Payout Requests</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#5B94D3" />
              <Text style={styles.loadingText}>Loading requests...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={loadRequests}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : requests.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No Requests Yet</Text>
              <Text style={styles.emptyText}>
                When you request a payout, it will appear here.
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.content}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
              }
            >
              {/* Status Legend */}
              <View style={styles.legend}>
                {Object.entries(statusConfig).map(([status, config]) => (
                  <View key={status} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: config.color }]} />
                    <Text style={styles.legendText}>{config.label}</Text>
                  </View>
                ))}
              </View>

              {/* Request List */}
              {requests.map(renderRequest)}

              <View style={{ height: 40 }} />
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    minHeight: '50%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  errorText: {
    marginTop: 12,
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#5B94D3',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#6B7280',
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  requestAmount: {},
  amountLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  amountValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  requestDetails: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  rejectionBox: {
    flexDirection: 'row',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'flex-start',
  },
  rejectionText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#991B1B',
    lineHeight: 18,
  },
  voucherBox: {
    backgroundColor: '#D1FAE5',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  voucherLabel: {
    fontSize: 12,
    color: '#065F46',
    marginBottom: 6,
  },
  voucherPinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  voucherPin: {
    fontSize: 18,
    fontWeight: '700',
    color: '#065F46',
    letterSpacing: 2,
    fontFamily: 'monospace',
  },
  copyButton: {
    padding: 8,
    backgroundColor: '#A7F3D0',
    borderRadius: 6,
  },
});
