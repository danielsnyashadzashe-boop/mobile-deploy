export interface CarGuard {
  id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  location: string;
  locationId: string;
  managerId: string;
  balance: number;
  totalEarnings: number;
  qrCode: string;
  status: 'active' | 'inactive' | 'suspended';
  rating: number;
  joinedDate: string;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    accountType: string;
    branchCode: string;
  };
  profileImage?: string;
}

export interface Tip {
  id: string;
  guardId: string;
  guardName: string;
  customerId: string;
  customerName: string;
  amount: number;
  date: string;
  time: string;
  location: string;
  paymentMethod: 'card' | 'cash' | 'wallet';
  status: 'pending' | 'completed' | 'failed';
}

export interface Payout {
  id: string;
  voucherNumber: string;
  guardId: string;
  guardName: string;
  amount: number;
  type: 'bank_transfer' | 'cash' | 'airtime' | 'electricity' | 'groceries';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  requestDate: string;
  processDate?: string;
  reference?: string;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
  };
  utilityDetails?: {
    meterNumber?: string;
    phoneNumber?: string;
    provider?: string;
  };
}

export interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  numberOfGuards: number;
  activeGuards: number;
  managerId: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface Transaction {
  id: string;
  guardId: string;
  guardName: string;
  type: 'tip' | 'payout' | 'airtime' | 'electricity' | 'transfer' | 'adjustment';
  amount: number;
  balance: number;
  description: string;
  date: string;
  time: string;
  status: 'pending' | 'completed' | 'failed';
  reference?: string;
  metadata?: {
    originalAmount?: number;
    commissionRate?: number;
    commissionAmount?: number;
    guardReceivesAmount?: number;
  };
}