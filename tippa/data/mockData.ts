import { CarGuard, Tip, Payout, Location, Transaction } from '../types';

export const mockCarGuard: CarGuard = {
  id: 'NG001',
  name: 'John Mokoena',
  phoneNumber: '073 456 7890',
  email: 'john.mokoena@example.com',
  location: 'Sandton City Mall',
  locationId: 'loc1',
  managerId: 'mgr1',
  balance: 450.50,
  totalEarnings: 12500.00,
  qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=tippa://guard/NG001',
  status: 'active',
  rating: 4.8,
  joinedDate: '2023-01-15',
  bankDetails: {
    bankName: 'FNB',
    accountNumber: '62345678901',
    accountType: 'Savings',
    branchCode: '250655',
  },
};

export const mockTips: Tip[] = [
  {
    id: 't1',
    guardId: 'NG001',
    guardName: 'John Mokoena',
    customerId: 'c1',
    customerName: 'Sarah Johnson',
    amount: 20,
    date: '2024-01-20',
    time: '14:30',
    location: 'Sandton City Mall',
    paymentMethod: 'card',
    status: 'completed',
  },
  {
    id: 't2',
    guardId: 'NG001',
    guardName: 'John Mokoena',
    customerId: 'c2',
    customerName: 'Mike Peters',
    amount: 10,
    date: '2024-01-20',
    time: '15:45',
    location: 'Sandton City Mall',
    paymentMethod: 'wallet',
    status: 'completed',
  },
  {
    id: 't3',
    guardId: 'NG001',
    guardName: 'John Mokoena',
    customerId: 'c3',
    customerName: 'Emma Wilson',
    amount: 15,
    date: '2024-01-19',
    time: '11:20',
    location: 'Sandton City Mall',
    paymentMethod: 'card',
    status: 'completed',
  },
];

export const mockPayouts: Payout[] = [
  {
    id: 'p1',
    voucherNumber: 'VCH-2024-001',
    guardId: 'NG001',
    guardName: 'John Mokoena',
    amount: 500,
    type: 'bank_transfer',
    status: 'completed',
    requestDate: '2024-01-15',
    processDate: '2024-01-16',
    reference: 'PAY-001-2024',
    bankDetails: {
      bankName: 'FNB',
      accountNumber: '62345678901',
    },
  },
  {
    id: 'p2',
    voucherNumber: 'VCH-2024-002',
    guardId: 'NG001',
    guardName: 'John Mokoena',
    amount: 100,
    type: 'airtime',
    status: 'completed',
    requestDate: '2024-01-18',
    processDate: '2024-01-18',
    utilityDetails: {
      phoneNumber: '073 456 7890',
      provider: 'Vodacom',
    },
  },
  {
    id: 'p3',
    voucherNumber: 'VCH-2024-003',
    guardId: 'NG001',
    guardName: 'John Mokoena',
    amount: 200,
    type: 'electricity',
    status: 'processing',
    requestDate: '2024-01-20',
    utilityDetails: {
      meterNumber: '1234567890',
      provider: 'Eskom',
    },
  },
];

export const mockTransactions: Transaction[] = [
  {
    id: 'tx1',
    guardId: 'NG001',
    guardName: 'John Mokoena',
    type: 'tip',
    amount: 20,
    balance: 470.50,
    description: 'Tip from Sarah Johnson',
    date: '2024-01-20',
    time: '14:30',
    status: 'completed',
  },
  {
    id: 'tx2',
    guardId: 'NG001',
    guardName: 'John Mokoena',
    type: 'tip',
    amount: 10,
    balance: 480.50,
    description: 'Tip from Mike Peters',
    date: '2024-01-20',
    time: '15:45',
    status: 'completed',
  },
  {
    id: 'tx3',
    guardId: 'NG001',
    guardName: 'John Mokoena',
    type: 'payout',
    amount: -30,
    balance: 450.50,
    description: 'Airtime purchase - Vodacom',
    date: '2024-01-20',
    time: '16:00',
    status: 'completed',
    reference: 'AIR-001',
  },
];

export const mockLocations: Location[] = [
  {
    id: 'loc1',
    name: 'Sandton City Mall',
    address: '83 Rivonia Road',
    city: 'Sandton',
    numberOfGuards: 25,
    activeGuards: 20,
    managerId: 'mgr1',
    coordinates: {
      lat: -26.1076,
      lng: 28.0567,
    },
  },
  {
    id: 'loc2',
    name: 'V&A Waterfront',
    address: 'Victoria & Alfred Waterfront',
    city: 'Cape Town',
    numberOfGuards: 30,
    activeGuards: 28,
    managerId: 'mgr2',
    coordinates: {
      lat: -33.9036,
      lng: 18.4210,
    },
  },
  {
    id: 'loc3',
    name: 'Menlyn Park Shopping Centre',
    address: 'Atterbury Road',
    city: 'Pretoria',
    numberOfGuards: 20,
    activeGuards: 18,
    managerId: 'mgr3',
    coordinates: {
      lat: -25.7826,
      lng: 28.2753,
    },
  },
];

// Helper functions
export const formatCurrency = (amount: number): string => {
  return `R ${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
};

export const formatDate = (date: string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-ZA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatTime = (time: string): string => {
  return time;
};