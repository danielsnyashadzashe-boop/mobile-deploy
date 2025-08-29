export interface CarGuard {
  id: string;
  name: string;
  guardId: string;
  location: string;
  locationId?: string;
  balance: number;
  minPayoutThreshold: number;
  qrCode: string;
  managerId?: string;
  phoneNumber?: string;
  bankName?: string;
  accountNumber?: string;
  bankDetails?: string;
}

export interface Tip {
  id: string;
  amount: number;
  guardId: string;
  guardName: string;
  paymentMethod?: string; // SnapScan, Zapper, Bank App, etc.
  timestamp: string;
  location: string;
  locationId?: string;
}

export interface Payout {
  id: string;
  guardId: string;
  amount: number;
  voucherCode: string;
  issueDate: string;
  status: 'Issued' | 'Redeemed' | 'Expired' | 'Pending';
}


export interface Location {
  id: string;
  name: string;
  address: string;
  guardsCount: number;
}

export interface Manager {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  locationId?: string;
  guardsCount: number;
}

export interface PendingRegistration {
  id: string;
  fullName: string;
  idNumber: string;
  phoneNumber: string;
  email?: string;
  preferredLocation: string;
  preferredLocationName?: string;
  bankName?: string;
  accountNumber?: string;
  accountType?: string;
  branchCode?: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  assignedGuardId?: string;
}

// Transaction interface for all financial movements
export interface Transaction {
  id: string;
  type: 'tip' | 'withdrawal' | 'purchase' | 'deposit' | 'fee' | 'refund' | 'airtime' | 'electricity' | 'payout';
  amount: number;
  guardId?: string;
  guardName?: string;
  paymentMethod?: string; // For tips - SnapScan, Zapper, Bank App
  managerId?: string;
  timestamp: string;
  location?: string;
  locationId?: string;
  description: string;
  status?: string;
  reference?: string;
}

// Mock Car Guards
export const mockCarGuards: CarGuard[] = [
  {
    id: 'g1',
    name: 'John Mokoena',
    guardId: 'NG001',
    location: 'Mall of Africa - Entrance 3',
    locationId: 'l1',
    balance: 85.50,
    minPayoutThreshold: 100,
    qrCode: 'NG001-QR',
    managerId: 'm1',
    phoneNumber: '073 456 7890',
    bankName: 'FNB',
    accountNumber: '1234567890',
    bankDetails: 'Bank Details'
  },
  {
    id: 'g2',
    name: 'Sipho Ndlovu',
    guardId: 'NG002',
    location: 'Sandton City - Parking Level 2',
    locationId: 'l2',
    balance: 120.75,
    minPayoutThreshold: 100,
    qrCode: 'NG002-QR',
    managerId: 'm2',
    phoneNumber: '082 345 6789',
    bankName: 'Standard Bank',
    accountNumber: '0987654321',
    bankDetails: 'Bank Details'
  },
  {
    id: 'g3',
    name: 'Michael Khumalo',
    guardId: 'NG003',
    location: 'Eastgate Mall - Main Entrance',
    locationId: 'l3',
    balance: 65.25,
    minPayoutThreshold: 100,
    qrCode: 'NG003-QR',
    managerId: 'm3',
    phoneNumber: '061 234 5678',
    bankName: 'Capitec',
    accountNumber: '5678901234',
    bankDetails: 'Bank Details'
  }
];


// Mock Tips (from QR code scans via payment apps)
export const mockTips: Tip[] = [
  {
    id: 't1',
    amount: 20.00,
    guardId: 'g1',
    guardName: 'John Mokoena',
    paymentMethod: 'SnapScan',
    timestamp: '2025-05-21T09:30:00',
    location: 'Mall of Africa - Entrance 3',
    locationId: 'l1'
  },
  {
    id: 't2',
    amount: 15.50,
    guardId: 'g1',
    guardName: 'John Mokoena',
    paymentMethod: 'Zapper',
    timestamp: '2025-05-21T11:45:00',
    location: 'Mall of Africa - Entrance 3',
    locationId: 'l1'
  },
  {
    id: 't3',
    amount: 10.00,
    guardId: 'g2',
    guardName: 'Sipho Ndlovu',
    paymentMethod: 'FNB App',
    timestamp: '2025-05-21T14:15:00',
    location: 'Sandton City - Parking Level 2',
    locationId: 'l2'
  },
  {
    id: 't4',
    amount: 25.00,
    guardId: 'g3',
    guardName: 'Michael Khumalo',
    paymentMethod: 'SnapScan',
    timestamp: '2025-05-20T16:30:00',
    location: 'Eastgate Mall - Main Entrance',
    locationId: 'l3'
  },
  {
    id: 't5',
    amount: 5.25,
    guardId: 'g1',
    guardName: 'John Mokoena',
    paymentMethod: 'Standard Bank App',
    timestamp: '2025-05-20T10:20:00',
    location: 'Mall of Africa - Entrance 3',
    locationId: 'l1'
  }
];

// Mock Payouts
export const mockPayouts: Payout[] = [
  // Recent payouts for g1 (current guard)
  {
    id: 'p1',
    guardId: 'g1',
    amount: 150.00,
    voucherCode: 'VC-98765',
    issueDate: '2025-08-28T14:30:00',
    status: 'Pending'
  },
  {
    id: 'p2',
    guardId: 'g1',
    amount: 100.00,
    voucherCode: 'VC-12346',
    issueDate: '2025-08-25T12:00:00',
    status: 'Issued'
  },
  {
    id: 'p3',
    guardId: 'g1',
    amount: 200.00,
    voucherCode: 'VC-55432',
    issueDate: '2025-08-20T16:45:00',
    status: 'Redeemed'
  },
  {
    id: 'p4',
    guardId: 'g1',
    amount: 75.00,
    voucherCode: 'VC-77889',
    issueDate: '2025-08-15T09:30:00',
    status: 'Redeemed'
  },
  {
    id: 'p5',
    guardId: 'g1',
    amount: 125.00,
    voucherCode: 'VC-44321',
    issueDate: '2025-08-10T11:15:00',
    status: 'Expired'
  },
  {
    id: 'p6',
    guardId: 'g1',
    amount: 180.00,
    voucherCode: 'VC-99100',
    issueDate: '2025-08-05T13:20:00',
    status: 'Redeemed'
  },
  {
    id: 'p7',
    guardId: 'g1',
    amount: 100.00,
    voucherCode: 'VC-66677',
    issueDate: '2025-07-30T10:00:00',
    status: 'Issued'
  },
  {
    id: 'p8',
    guardId: 'g1',
    amount: 90.00,
    voucherCode: 'VC-33445',
    issueDate: '2025-07-25T15:45:00',
    status: 'Redeemed'
  },
  {
    id: 'p9',
    guardId: 'g1',
    amount: 250.00,
    voucherCode: 'VC-11223',
    issueDate: '2025-07-15T08:30:00',
    status: 'Redeemed'
  },
  {
    id: 'p10',
    guardId: 'g1',
    amount: 300.00,
    voucherCode: 'VC-88999',
    issueDate: '2025-07-01T12:00:00',
    status: 'Redeemed'
  },
  // Other guards' payouts
  {
    id: 'p11',
    guardId: 'g2',
    amount: 100.00,
    voucherCode: 'VC-12345',
    issueDate: '2025-05-18T12:00:00',
    status: 'Redeemed'
  },
  {
    id: 'p12',
    guardId: 'g3',
    amount: 100.00,
    voucherCode: 'VC-12347',
    issueDate: '2025-05-10T12:00:00',
    status: 'Issued'
  }
];

// Mock Locations
export const mockLocations: Location[] = [
  {
    id: 'l1',
    name: 'Mall of Africa',
    address: '123 Magwa Crescent, Midrand',
    guardsCount: 8
  },
  {
    id: 'l2',
    name: 'Sandton City',
    address: '83 Rivonia Rd, Sandton',
    guardsCount: 12
  },
  {
    id: 'l3',
    name: 'Eastgate Mall',
    address: '43 Bradford Rd, Bedfordview',
    guardsCount: 6
  }
];

// Mock Managers
export const mockManagers: Manager[] = [
  {
    id: 'm1',
    name: 'Thomas Molefe',
    email: 'thomas.m@nogada.co.za',
    phone: '072 123 4567',
    location: 'Mall of Africa',
    locationId: 'l1',
    guardsCount: 5
  },
  {
    id: 'm2',
    name: 'Sarah Nkosi',
    email: 'sarah.n@nogada.co.za',
    phone: '083 765 4321',
    location: 'Sandton City',
    locationId: 'l2',
    guardsCount: 8
  },
  {
    id: 'm3',
    name: 'Jacob Dlamini',
    email: 'jacob.d@nogada.co.za',
    phone: '061 987 6543',
    location: 'Eastgate Mall',
    locationId: 'l3',
    guardsCount: 4
  }
];

// Mock Transactions to include all transaction types
export const mockTransactions: Transaction[] = [
  // Tips (inflows from QR code scans)
  {
    id: 'tr1',
    type: 'tip',
    amount: 20.00,
    guardId: 'g1',
    guardName: 'John Mokoena',
    paymentMethod: 'SnapScan',
    timestamp: '2025-05-21T09:30:00',
    location: 'Mall of Africa - Entrance 3',
    locationId: 'l1',
    description: 'Tip received via SnapScan'
  },
  {
    id: 'tr2',
    type: 'tip',
    amount: 15.50,
    guardId: 'g1',
    guardName: 'John Mokoena',
    paymentMethod: 'Zapper',
    timestamp: '2025-05-21T11:45:00',
    location: 'Mall of Africa - Entrance 3',
    locationId: 'l1',
    description: 'Tip received via Zapper'
  },
  // Payouts (outflows)
  {
    id: 'tr3',
    type: 'payout',
    amount: -100.00,
    guardId: 'g2',
    guardName: 'Sipho Ndlovu',
    timestamp: '2025-05-18T12:00:00',
    description: 'Weekly payout voucher',
    status: 'Redeemed',
    reference: 'VC-12345'
  },
  // Airtime purchases (outflows)
  {
    id: 'tr4',
    type: 'airtime',
    amount: -50.00,
    guardId: 'g1',
    guardName: 'John Mokoena',
    timestamp: '2025-05-19T14:25:00',
    description: 'MTN Airtime Purchase',
    reference: 'AT-78901'
  },
  // Electricity purchases (outflows)
  {
    id: 'tr5',
    type: 'electricity',
    amount: -200.00,
    guardId: 'g3',
    guardName: 'Michael Khumalo',
    timestamp: '2025-05-20T09:15:00',
    description: 'Eskom Prepaid Electricity',
    reference: 'EL-34567'
  }
];

// Mock Pending Registrations
export const mockPendingRegistrations: PendingRegistration[] = [
  {
    id: 'reg1',
    fullName: 'Thabo Dlamini',
    idNumber: '9005125800084',
    phoneNumber: '072 234 5678',
    email: 'thabo.d@gmail.com',
    preferredLocation: 'l1',
    preferredLocationName: 'Mall of Africa',
    bankName: 'FNB',
    accountNumber: '62734567890',
    accountType: 'savings',
    branchCode: '250655',
    submittedAt: '2025-05-26T10:30:00',
    status: 'pending'
  },
  {
    id: 'reg2',
    fullName: 'Bongani Nkosi',
    idNumber: '8807156789084',
    phoneNumber: '083 345 6789',
    preferredLocation: 'l2',
    preferredLocationName: 'Sandton City',
    submittedAt: '2025-05-26T09:15:00',
    status: 'pending'
  },
  {
    id: 'reg3',
    fullName: 'Lerato Mbatha',
    idNumber: '9203045678084',
    phoneNumber: '071 456 7890',
    email: 'lerato.m@yahoo.com',
    preferredLocation: 'l3',
    preferredLocationName: 'Eastgate Mall',
    bankName: 'Capitec',
    accountNumber: '1234567890',
    accountType: 'savings',
    submittedAt: '2025-05-25T14:20:00',
    status: 'approved',
    reviewedBy: 'Admin',
    reviewedAt: '2025-05-25T16:45:00',
    assignedGuardId: 'NG004'
  },
  {
    id: 'reg4',
    fullName: 'Sibusiso Zulu',
    idNumber: '8506125800084',
    phoneNumber: '060 567 8901',
    preferredLocation: 'l1',
    preferredLocationName: 'Mall of Africa',
    submittedAt: '2025-05-24T11:00:00',
    status: 'rejected',
    reviewedBy: 'Admin',
    reviewedAt: '2025-05-24T15:30:00',
    rejectionReason: 'Invalid ID number provided'
  }
];

// Mock Payout Requests
export const mockPayoutRequests = [
  {
    id: 'pr1',
    guardId: 'g1',
    guardName: 'John Mokoena',
    location: 'Mall of Africa - Entrance 3',
    amount: 100.00,
    requestDate: '2025-05-26T09:30:00',
    status: 'pending' as const,
    reason: 'Weekly payout request'
  },
  {
    id: 'pr2',
    guardId: 'g2',
    guardName: 'Sipho Ndlovu',
    location: 'Sandton City - Parking Level 2',
    amount: 150.75,
    requestDate: '2025-05-26T11:15:00',
    status: 'pending' as const,
    reason: 'Emergency payout needed'
  },
  {
    id: 'pr3',
    guardId: 'g3',
    guardName: 'Michael Khumalo',
    location: 'Eastgate Mall - Main Entrance',
    amount: 100.00,
    requestDate: '2025-05-25T14:20:00',
    status: 'approved' as const,
    reason: 'Regular payout',
    adminNotes: 'Approved after verification'
  },
  {
    id: 'pr4',
    guardId: 'g1',
    guardName: 'John Mokoena',
    location: 'Mall of Africa - Entrance 3',
    amount: 200.00,
    requestDate: '2025-05-24T16:45:00',
    status: 'rejected' as const,
    reason: 'Large amount request',
    adminNotes: 'Amount exceeds weekly limit'
  }
];

// Helper function to get tips for a specific guard
export const getTipsByGuardId = (guardId: string): Tip[] => {
  return mockTips.filter(tip => tip.guardId === guardId);
};


// Helper function to get payouts for a specific guard
export const getPayoutsByGuardId = (guardId: string): Payout[] => {
  return mockPayouts.filter(payout => payout.guardId === guardId);
};

// Helper function to get guards by manager
export const getGuardsByManagerId = (managerId: string): CarGuard[] => {
  return mockCarGuards.filter(guard => guard.managerId === managerId);
};

// Helper function to get guards by location
export const getGuardsByLocationId = (locationId: string): CarGuard[] => {
  return mockCarGuards.filter(guard => guard.locationId === locationId);
};

// Helper function to get managers by location
export const getManagersByLocationId = (locationId: string): Manager[] => {
  return mockManagers.filter(manager => manager.locationId === locationId);
};

// Helper function to get transactions by guard
export const getTransactionsByGuardId = (guardId: string): Transaction[] => {
  return mockTransactions.filter(transaction => transaction.guardId === guardId);
};

// Helper function to format currency
export const formatCurrency = (amount: number): string => {
  return `R${Math.abs(amount).toFixed(2)}`;
};

// Helper function to format dates
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Helper function to format time
export const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-ZA', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Helper function to format date and time
export const formatDateTime = (dateString: string): string => {
  return `${formatDate(dateString)} ${formatTime(dateString)}`;
};
