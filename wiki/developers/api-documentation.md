# API Documentation

## Overview

This document outlines the API structure and data interfaces for the **NogadaCarGuard** multi-portal tipping application. Currently, the application uses mock data structures that will be replaced with actual API endpoints in production.

**Stakeholder Relevance:** 🛠️ Senior Dev, 🌐 Full-Stack Dev, 👨‍💻 Frontend Dev, 📊 Project Manager, 🗄️ Database Admin

---

## Current Implementation

### Mock Data Architecture

The application currently uses comprehensive mock data defined in `src/data/mockData.ts` with full TypeScript interfaces and helper functions. This serves as the API contract for future backend implementation.

```typescript
// Core data models location
import { 
  CarGuard, 
  Customer, 
  Tip, 
  Payout, 
  Location, 
  Manager, 
  Transaction 
} from '@/data/mockData';
```

---

## Data Models

### CarGuard Interface

```typescript
export interface CarGuard {
  id: string;                    // Unique identifier
  name: string;                  // Full name
  guardId: string;               // Display ID (e.g., "CG001")
  location: string;              // Location name
  locationId?: string;           // Location reference
  balance: number;               // Current tip balance
  minPayoutThreshold: number;    // Minimum payout amount
  qrCode: string;                // QR code data for tipping
  managerId?: string;            // Assigned manager
  phoneNumber?: string;          // Contact number
  bankName?: string;             // Bank name
  accountNumber?: string;        // Account number
  bankDetails?: string;          // Additional bank info
}
```

**Example:**
```json
{
  "id": "guard1",
  "name": "John Doe",
  "guardId": "CG001",
  "location": "Century City Mall",
  "locationId": "loc1",
  "balance": 250.75,
  "minPayoutThreshold": 100,
  "qrCode": "https://nogada.tip/guard1",
  "managerId": "mgr1",
  "phoneNumber": "+27123456789",
  "bankName": "FNB",
  "accountNumber": "1234567890",
  "bankDetails": "Cheque Account"
}
```

### Tip Interface

```typescript
export interface Tip {
  id: string;           // Unique tip identifier
  amount: number;       // Tip amount in currency
  guardId: string;      // Guard receiving tip
  guardName: string;    // Guard display name
  customerId?: string;  // Customer giving tip (optional)
  customerName?: string; // Customer display name
  timestamp: string;    // ISO datetime string
  location: string;     // Location name
  locationId?: string;  // Location reference
}
```

**Example:**
```json
{
  "id": "tip_001",
  "amount": 25.00,
  "guardId": "guard1",
  "guardName": "John Doe",
  "customerId": "customer1",
  "customerName": "Jane Smith",
  "timestamp": "2024-01-15T10:30:00Z",
  "location": "Century City Mall",
  "locationId": "loc1"
}
```

### Payout Interface

```typescript
export interface Payout {
  id: string;                              // Unique payout identifier
  guardId: string;                         // Guard receiving payout
  amount: number;                          // Payout amount
  voucherCode: string;                     // Voucher redemption code
  issueDate: string;                       // ISO datetime string
  status: 'Issued' | 'Redeemed' | 'Expired'; // Payout status
}
```

**Example:**
```json
{
  "id": "payout_001",
  "guardId": "guard1",
  "amount": 150.00,
  "voucherCode": "VOUCHER123456",
  "issueDate": "2024-01-15T14:00:00Z",
  "status": "Issued"
}
```

### Customer Interface

```typescript
export interface Customer {
  id: string;           // Unique customer identifier
  name: string;         // Full name
  email: string;        // Email address
  walletBalance: number; // Digital wallet balance
}
```

### Location Interface

```typescript
export interface Location {
  id: string;        // Unique location identifier
  name: string;      // Location name
  address: string;   // Physical address
  guardsCount: number; // Number of assigned guards
}
```

### Manager Interface

```typescript
export interface Manager {
  id: string;           // Unique manager identifier
  name: string;         // Full name
  email: string;        // Email address
  locationIds: string[]; // Assigned locations
  phoneNumber?: string;  // Contact number
}
```

### Transaction Interface

```typescript
export interface Transaction {
  id: string;                    // Unique transaction identifier
  type: 'tip' | 'payout' | 'airtime' | 'electricity' | 'data' | 'voucher' | 'transfer';
  amount: number;                // Transaction amount
  guardId?: string;              // Associated guard (if applicable)
  guardName?: string;            // Guard display name
  customerId?: string;           // Associated customer (if applicable)
  customerName?: string;         // Customer display name
  timestamp: string;             // ISO datetime string
  status: 'completed' | 'pending' | 'failed' | 'cancelled';
  location?: string;             // Location name
  locationId?: string;           // Location reference
  description?: string;          // Additional details
  voucherCode?: string;          // Voucher code (for voucher types)
  provider?: string;             // Service provider (for utilities)
}
```

---

## Helper Functions

### Data Access Functions

The mock data includes comprehensive helper functions that define the expected API patterns:

```typescript
// Guard-related queries
getTipsByGuardId(guardId: string): Tip[]
getPayoutsByGuardId(guardId: string): Payout[]
getTransactionsByGuardId(guardId: string): Transaction[]

// Customer-related queries  
getTipsByCustomerId(customerId: string): Tip[]

// Location-related queries
getGuardsByLocationId(locationId: string): CarGuard[]
getManagersByLocationId(locationId: string): Manager[]

// Manager-related queries
getGuardsByManagerId(managerId: string): CarGuard[]

// Utility functions
formatCurrency(amount: number): string
formatDate(dateString: string): string
formatTime(dateString: string): string
formatDateTime(dateString: string): string
```

### Usage Examples

```typescript
import { 
  mockCarGuards, 
  getTipsByGuardId, 
  formatCurrency 
} from '@/data/mockData';

// Get guard's tips
const guardTips = getTipsByGuardId('guard1');

// Format currency for display
const formattedAmount = formatCurrency(150.75); // "R 150.75"

// Get guard balance
const guard = mockCarGuards.find(g => g.id === 'guard1');
console.log(`Balance: ${formatCurrency(guard?.balance || 0)}`);
```

---

## Planned API Endpoints

### Authentication Endpoints

```typescript
// Car Guard Authentication
POST /api/car-guard/login
{
  "guardId": "CG001",
  "pin": "1234"
}

// Customer Authentication
POST /api/customer/login
{
  "email": "customer@example.com",
  "password": "password123"
}

// Admin Authentication
POST /api/admin/login
{
  "email": "admin@nogada.com",
  "password": "securePassword"
}
```

### Car Guard API

```typescript
// Get guard profile
GET /api/car-guard/profile/:guardId

// Get guard balance
GET /api/car-guard/balance/:guardId

// Get tip history
GET /api/car-guard/tips/:guardId?page=1&limit=20

// Get payout history
GET /api/car-guard/payouts/:guardId?page=1&limit=20

// Request payout
POST /api/car-guard/payout/request
{
  "guardId": "guard1",
  "amount": 150.00,
  "voucherType": "electricity" // or "airtime", "data", "cash"
}

// Update profile
PUT /api/car-guard/profile/:guardId
{
  "phoneNumber": "+27123456789",
  "bankName": "FNB",
  "accountNumber": "1234567890"
}
```

### Customer API

```typescript
// Process tip
POST /api/customer/tip
{
  "guardId": "guard1",
  "amount": 25.00,
  "customerId": "customer1"
}

// Get customer tips
GET /api/customer/tips/:customerId?page=1&limit=20

// Get wallet balance
GET /api/customer/wallet/:customerId

// Top up wallet
POST /api/customer/wallet/topup
{
  "customerId": "customer1",
  "amount": 100.00,
  "paymentMethod": "card"
}
```

### Admin API

```typescript
// Dashboard analytics
GET /api/admin/dashboard/stats

// Location management
GET /api/admin/locations
POST /api/admin/locations
PUT /api/admin/locations/:locationId
DELETE /api/admin/locations/:locationId

// Guard management
GET /api/admin/guards?locationId=loc1&managerId=mgr1
POST /api/admin/guards
PUT /api/admin/guards/:guardId
DELETE /api/admin/guards/:guardId

// Manager management
GET /api/admin/managers
POST /api/admin/managers
PUT /api/admin/managers/:managerId

// Transaction monitoring
GET /api/admin/transactions?type=tip&status=completed&startDate=2024-01-01

// Payout processing
GET /api/admin/payouts?status=pending
POST /api/admin/payouts/approve/:payoutId
POST /api/admin/payouts/reject/:payoutId

// Reports
GET /api/admin/reports/tips?period=monthly&locationId=loc1
GET /api/admin/reports/performance?managerId=mgr1
```

---

## Response Formats

### Standard Response Structure

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

// Success response
{
  "success": true,
  "data": { /* response data */ },
  "timestamp": "2024-01-15T10:30:00Z"
}

// Error response  
{
  "success": false,
  "error": "INVALID_GUARD_ID",
  "message": "Guard not found",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Paginated Response Structure

```typescript
interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  timestamp: string;
}
```

---

## Error Codes

### Common Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `INVALID_CREDENTIALS` | Authentication failed | 401 |
| `INSUFFICIENT_FUNDS` | Not enough balance | 400 |
| `GUARD_NOT_FOUND` | Guard ID not found | 404 |
| `CUSTOMER_NOT_FOUND` | Customer ID not found | 404 |
| `INVALID_AMOUNT` | Amount below/above limits | 400 |
| `PAYOUT_THRESHOLD_NOT_MET` | Balance below minimum payout | 400 |
| `VOUCHER_EXPIRED` | Voucher past expiry date | 400 |
| `RATE_LIMIT_EXCEEDED` | Too many requests | 429 |
| `SERVER_ERROR` | Internal server error | 500 |

### Portal-Specific Errors

**Car Guard Portal:**
```typescript
// Payout request errors
{
  "success": false,
  "error": "PAYOUT_THRESHOLD_NOT_MET", 
  "message": "Minimum payout amount is R 100.00",
  "data": {
    "currentBalance": 75.50,
    "minThreshold": 100.00
  }
}
```

**Customer Portal:**
```typescript
// Insufficient wallet balance
{
  "success": false,
  "error": "INSUFFICIENT_FUNDS",
  "message": "Wallet balance insufficient for tip amount",
  "data": {
    "walletBalance": 15.00,
    "requestedAmount": 25.00
  }
}
```

---

## Data Validation

### Input Validation Rules

```typescript
// Tip amount validation
const tipValidation = z.object({
  amount: z.number()
    .min(1, "Minimum tip is R 1.00")
    .max(1000, "Maximum tip is R 1,000.00"),
  guardId: z.string()
    .min(1, "Guard ID is required")
    .uuid("Invalid guard ID format"),
});

// Payout request validation
const payoutValidation = z.object({
  amount: z.number()
    .min(100, "Minimum payout is R 100.00")
    .max(10000, "Maximum payout is R 10,000.00"),
  voucherType: z.enum(['electricity', 'airtime', 'data', 'cash']),
});

// Guard registration validation
const guardValidation = z.object({
  name: z.string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name too long"),
  phoneNumber: z.string()
    .regex(/^\+27[0-9]{9}$/, "Invalid South African phone number"),
  bankAccount: z.string()
    .min(8, "Invalid account number")
    .max(15, "Invalid account number"),
});
```

---

## Rate Limiting

### Planned Rate Limits

| Endpoint Category | Limit | Window |
|------------------|--------|---------|
| Authentication | 5 attempts | 15 minutes |
| Tipping | 10 tips | 1 minute |
| Payout Requests | 3 requests | 1 hour |
| General API | 100 requests | 1 minute |
| Report Generation | 5 reports | 1 minute |

---

## WebSocket Events

### Real-time Updates

```typescript
// Tip received event
{
  "event": "tip_received",
  "data": {
    "guardId": "guard1",
    "amount": 25.00,
    "customerId": "customer1",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}

// Payout processed event
{
  "event": "payout_processed", 
  "data": {
    "payoutId": "payout_001",
    "guardId": "guard1",
    "status": "completed",
    "voucherCode": "VOUCHER123456"
  }
}

// Balance updated event
{
  "event": "balance_updated",
  "data": {
    "guardId": "guard1",
    "newBalance": 200.75,
    "change": -25.00,
    "reason": "payout_processed"
  }
}
```

---

## Integration with Current Components

### React Query Integration

```typescript
// hooks/useCarGuardData.ts
import { useQuery, useMutation } from '@tanstack/react-query';

export function useCarGuardBalance(guardId: string) {
  return useQuery({
    queryKey: ['guard', guardId, 'balance'],
    queryFn: () => fetchGuardBalance(guardId),
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: 1000 * 30, // 30 seconds
  });
}

export function useTipMutation() {
  return useMutation({
    mutationFn: (tipData: TipRequest) => processTip(tipData),
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries(['guard']);
      queryClient.invalidateQueries(['customer']);
    },
  });
}
```

### Component Integration Example

```typescript
// pages/car-guard/CarGuardDashboard.tsx
import { useCarGuardBalance } from '@/hooks/useCarGuardData';
import { formatCurrency } from '@/data/mockData';

export function CarGuardDashboard() {
  const guardId = 'guard1'; // From authentication context
  const { data: balance, isLoading } = useCarGuardBalance(guardId);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-tippa-dark">
        Current Balance: {formatCurrency(balance || 0)}
      </h1>
    </div>
  );
}
```

---

## Testing Mock Data

### Development Testing

The current mock data provides comprehensive test scenarios:

```typescript
// Test different guard states
const activeGuard = mockCarGuards.find(g => g.balance >= g.minPayoutThreshold);
const lowBalanceGuard = mockCarGuards.find(g => g.balance < g.minPayoutThreshold);

// Test tip scenarios
const recentTips = mockTips.filter(t => 
  new Date(t.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
);

// Test payout scenarios
const pendingPayouts = mockPayouts.filter(p => p.status === 'Issued');
const expiredPayouts = mockPayouts.filter(p => p.status === 'Expired');
```

### API Contract Validation

```typescript
// Validate mock data matches expected API contracts
import { CarGuard, Tip, Payout } from '@/data/mockData';

function validateApiContract() {
  // Ensure all required fields are present
  mockCarGuards.forEach(guard => {
    assert(guard.id, 'Guard ID required');
    assert(guard.balance >= 0, 'Balance must be non-negative');
    assert(guard.qrCode, 'QR code required');
  });
  
  mockTips.forEach(tip => {
    assert(tip.amount > 0, 'Tip amount must be positive');
    assert(tip.timestamp, 'Timestamp required');
  });
}
```

---

## Future Considerations

### API Versioning
```
/api/v1/car-guard/...
/api/v2/car-guard/...
```

### Caching Strategy
- Redis for session management
- CDN for static assets
- Query result caching for dashboards

### Performance Optimization
- Database indexing on frequently queried fields
- Pagination for large datasets
- Background job processing for reports

### Security Considerations
- JWT token authentication
- API key management for mobile apps
- Input sanitization and validation
- HTTPS enforcement

---

## Conclusion

This API documentation serves as the contract between frontend and backend development. The mock data structure provides a solid foundation for the actual API implementation, ensuring type safety and consistent data handling across the multi-portal application.

For implementation questions, refer to the mock data in `src/data/mockData.ts` or consult the development team.

---

**Document Information:**
- **Version:** 1.0
- **Last Updated:** 2025-01-25
- **Maintainer:** Full-Stack Development Team
- **Review Cycle:** Bi-weekly during API development
- **Related Documents:** 
  - `/wiki/developers/development-standards.md`
  - `/wiki/analysis/tech-stack.md`
  - `/src/data/mockData.ts`