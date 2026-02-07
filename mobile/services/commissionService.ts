import axios from 'axios';

// IMPORTANT: Change this to your production URL when deploying
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
const API_BASE_URL = `${BASE_URL}/api`;

export interface CommissionSetting {
  id: string;
  name: string;
  percentage: number;
  description?: string;
  isActive: boolean;
  appliesTo: string;
  setByAdminName?: string;
  setByAdminEmail?: string;
}

export interface CommissionInfo {
  originalAmount: number;
  commissionRate: number;
  commissionAmount: number;
  guardReceivesAmount: number;
}

export const commissionService = {
  /**
   * Get all commission settings
   */
  async getCommissionSettings(): Promise<CommissionSetting[]> {
    try {
      const url = `${API_BASE_URL}/commission-settings`;
      console.log('📡 Fetching commission settings from:', url);
      const response = await axios.get(url);
      console.log('✅ Commission settings received:', response.data.data?.length || 0, 'settings');
      return response.data.data;
    } catch (error: any) {
      // Only log error if it's not a 404 (endpoint might not exist yet)
      if (error.response?.status !== 404) {
        console.error('Error fetching commission settings:', error.message);
      } else {
        console.log('ℹ️ Commission endpoint not available (404) - using default 0% commission');
      }
      return [];
    }
  },

  /**
   * Get active commission rate for tips
   */
  async getActiveCommissionRate(): Promise<number> {
    try {
      const settings = await this.getCommissionSettings();
      const activeSetting = settings.find(
        s => s.isActive && (s.appliesTo === 'TIPS' || s.appliesTo === 'ALL')
      );
      const rate = activeSetting ? activeSetting.percentage : 0;

      if (rate === 0) {
        console.log('ℹ️ No active commission rate found - defaulting to 0%');
      }

      return rate;
    } catch (error: any) {
      console.error('Error getting active commission rate:', error.message);
      return 0;
    }
  },

  /**
   * Calculate commission for a tip amount
   */
  calculateCommission(tipAmount: number, commissionRate: number): CommissionInfo {
    const commissionAmount = tipAmount * (commissionRate / 100);
    const guardReceivesAmount = tipAmount - commissionAmount;

    return {
      originalAmount: tipAmount,
      commissionRate: commissionRate,
      commissionAmount: parseFloat(commissionAmount.toFixed(2)),
      guardReceivesAmount: parseFloat(guardReceivesAmount.toFixed(2))
    };
  },

  /**
   * Format commission display text
   */
  formatCommissionDisplay(info: CommissionInfo): string {
    if (info.commissionRate === 0) {
      return `You will receive: R${info.guardReceivesAmount.toFixed(2)}`;
    }
    return `Tip: R${info.originalAmount.toFixed(2)} - Commission (${info.commissionRate}%): R${info.commissionAmount.toFixed(2)} = You receive: R${info.guardReceivesAmount.toFixed(2)}`;
  }
};
