# Flash Partner API v4 Integration

## Overview

This document provides a comprehensive reference for the Flash Partner API v4 integration in the NogadaCarGuard mobile application. The integration enables car guards to purchase electricity, airtime, and vouchers directly from their earnings balance through Flash's payment platform.

## Architecture

### Service Layer Structure

```
mobile/services/flash/
├── auth/
│   ├── authService.ts          # OAuth 2.0 authentication with auto-refresh
│   └── secureStorage.ts        # Secure credential storage with expo-secure-store
├── api/
│   ├── baseApi.ts             # Base service with error handling and retries
│   ├── voucherApi.ts          # 1Voucher service (purchase, history, details)
│   ├── electricityApi.ts      # Prepaid electricity (meter lookup, purchase)
│   └── airtimeApi.ts          # Airtime/data bundles (phone validation, purchase)
├── types/
│   ├── auth.types.ts          # Authentication and OAuth types
│   ├── voucher.types.ts       # 1Voucher service types
│   ├── electricity.types.ts   # Electricity service types
│   └── airtime.types.ts       # Airtime service types
├── hooks/
│   ├── useFlashAuth.ts        # React Query hooks for authentication
│   └── useElectricity.ts      # React Query hooks for electricity service
└── utils/
    ├── constants.ts           # API endpoints, business rules, QA data
    ├── validators.ts          # Input validation utilities
    └── formatters.ts          # Data formatting and receipt generation
```

### Component Integration

```
mobile/components/flash/
└── ElectricityPurchaseModal.tsx   # Multi-step electricity purchase UI
```

## API Services

### 1. Authentication Service (`FlashAuthService`)

**Purpose:** Manages OAuth 2.0 authentication with automatic token refresh.

**Key Methods:**
- `initialize()` - Sets up credentials and obtains initial token
- `getValidAccessToken()` - Returns valid token with automatic refresh
- `refreshToken()` - Refreshes expired tokens
- `logout()` - Clears all stored credentials

**Security Features:**
- Credentials stored in secure keychain (expo-secure-store)
- Automatic token refresh 5 minutes before expiration
- Never exposes API keys in JavaScript
- Retry logic with exponential backoff

### 2. Electricity Service (`ElectricityApiService`)

**Purpose:** Handles prepaid electricity purchases with meter validation.

**Key Methods:**
- `getMunicipalities()` - Gets available utility providers
- `lookupMeter(meterNumber, municipalityCode)` - Validates meter details
- `purchaseElectricity(meter, amount, municipality, reference)` - Executes purchase
- `getElectricityHistory(filters)` - Retrieves transaction history
- `getElectricitySummary(dateRange)` - Gets usage statistics

**Business Rules:**
- Min amount: R5, Max amount: R5,000
- Meter number: 11 digits
- Token format: 20 digits
- Timeout: 60 seconds for purchases

### 3. Voucher Service (`VoucherApiService`)

**Purpose:** Handles 1Voucher purchases and management.

**Key Methods:**
- `purchaseVoucher(amount, reference)` - Purchase voucher
- `getVoucherHistory(filters)` - Get purchase history
- `getVoucherDetails(transactionId)` - Get specific voucher details
- `checkVoucherExpiry(transactionId)` - Check expiration status

**Business Rules:**
- Available denominations: R5, R10, R20, R50, R100, R200, R500, R1000, R2000, R5000
- PIN format: 16 digits
- Expiry warning: 30 days before expiration

### 4. Airtime Service (`AirtimeApiService`)

**Purpose:** Handles airtime and data bundle purchases.

**Key Methods:**
- `getNetworkProviders()` - Get available networks
- `validatePhoneNumber(phoneNumber)` - Validate and detect network
- `getDataBundles(networkCode)` - Get available data packages
- `purchaseAirtime(phone, amount, network, reference)` - Buy airtime
- `purchaseDataBundle(phone, bundleCode, network, reference)` - Buy data
- `getAirtimeHistory(filters)` - Get transaction history

**Supported Networks:**
- MTN (code: 'MTN')
- Vodacom (code: 'VDC') 
- Cell C (code: 'CLC')
- Telkom Mobile (code: 'TLK')
- Rain Mobile (code: 'RAIN')

**Business Rules:**
- Min amount: R5, Max amount: R1,000
- Phone format: South African numbers (+27 or 0 prefix)
- Auto network detection from phone number

## React Query Integration

### Authentication Hooks

```typescript
// Get authentication status
const { isAuthenticated, accountNumber, isLoading } = useFlashAuthStatus();

// Initialize authentication
const { mutate: initialize, isPending } = useFlashAuthInitialize();

// Login/refresh tokens
const { mutate: login } = useFlashAuthLogin();
const { mutate: refresh } = useFlashAuthRefresh();

// Complete auth management
const {
  isAuthenticated,
  accountNumber,
  isLoading,
  initialize,
  login,
  logout,
  testAuth
} = useFlashAuth();
```

### Electricity Hooks

```typescript
// Get municipalities
const { data: municipalities, isLoading } = useElectricityMunicipalities();

// Lookup meter
const meterLookup = useElectricityMeterLookup(meterNumber, municipalityCode);

// Purchase electricity
const { mutate: purchaseElectricity, isPending } = useElectricityPurchase();

// Get transaction history
const { data: history } = useElectricityHistory({ 
  meterNumber, 
  startDate, 
  endDate 
});

// Complete electricity management
const {
  municipalities,
  purchaseElectricity,
  validateMeter,
  searchTransactions,
  getBusinessRules,
  getQAMeterNumbers
} = useElectricity();
```

## UI Components

### ElectricityPurchaseModal

**Purpose:** Complete electricity purchase flow with meter lookup.

**Features:**
- 3-step process: Input → Confirmation → Success
- Real-time meter validation
- QA testing helpers with test meter numbers
- Amount quick-selection buttons
- Prominent electricity token display
- Copy and share receipt functionality
- Mobile-optimized responsive design

**Integration:**
```typescript
import ElectricityPurchaseModal from '../../components/flash/ElectricityPurchaseModal';

<ElectricityPurchaseModal
  visible={showModal}
  onClose={() => setShowModal(false)}
  onSuccess={(transaction) => {
    console.log('Purchase successful:', transaction);
  }}
/>
```

## Data Types

### Core Transaction Types

```typescript
// Electricity Purchase Response
interface ElectricityPurchaseResponse {
  TransactionId: string;
  MeterNumber: string;
  Amount: number;
  UnitsIssued: number;
  TokenValue: string;        // 20-digit electricity token
  CustomerName: string;
  CustomerAddress: string;
  MunicipalityName: string;
  TransactionDate: string;
  Status: 'Success' | 'Failed' | 'Pending';
  DebtRecovery?: number;
  ServiceCharge?: number;
  VAT?: number;
}

// Voucher Purchase Response
interface VoucherPurchaseResponse {
  TransactionId: string;
  Amount: number;
  VoucherPIN: string;        // 16-digit voucher PIN
  SerialNumber: string;
  ExpiryDate: string;
  TransactionDate: string;
  Status: 'Success' | 'Failed' | 'Pending';
}

// Airtime Purchase Response
interface AirtimePurchaseResponse {
  TransactionId: string;
  PhoneNumber: string;
  NetworkCode: string;
  NetworkName: string;
  Amount: number;
  TransactionDate: string;
  Status: 'Success' | 'Failed' | 'Pending';
  RechargePin?: string;
  Instructions?: string;
}
```

### Error Handling Types

```typescript
interface ApiError {
  code: string;
  message: string;
  httpStatus?: number;
  originalError?: any;
}

// Common error codes
type ErrorCode = 
  | 'NETWORK_ERROR'
  | 'INSUFFICIENT_FUNDS'
  | 'INVALID_METER'
  | 'METER_BLOCKED'
  | 'INVALID_PHONE'
  | 'NETWORK_UNAVAILABLE'
  | 'TRANSACTION_FAILED'
  | 'AUTHENTICATION_FAILED';
```

## Configuration

### Environment Setup

```typescript
// Current environment (configurable)
export const CURRENT_ENVIRONMENT: 'sandbox' | 'production' = 'sandbox';

// API Configuration
export const FLASH_CONFIG = {
  BASE_URL: 'https://api-flashswitch-sandbox.flash-group.com',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

// QA Credentials (pre-configured)
export const QA_CREDENTIALS = {
  AUTH_HEADER: 'UF92SGh4Q1RjZnNYMUJFNmZkTGdTcl9JeVRRYTpaSTN4TjkwN2ZHbjB4X0dqOWdCNGkyTWc0V29h',
  ACCOUNT_NUMBER: '8058-7467-3755-5732',
};
```

### Business Rules

```typescript
export const BUSINESS_RULES = {
  VOUCHER: {
    MIN_AMOUNT: 5,
    MAX_AMOUNT: 5000,
    DENOMINATIONS: [5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000],
    PIN_LENGTH: 16,
  },
  ELECTRICITY: {
    MIN_AMOUNT: 5,
    MAX_AMOUNT: 5000,
    METER_NUMBER_LENGTH: 11,
    TOKEN_LENGTH: 20,
  },
  AIRTIME: {
    MIN_AMOUNT: 5,
    MAX_AMOUNT: 1000,
    COMMON_DENOMINATIONS: [5, 10, 20, 30, 50, 100, 200, 500],
  },
};
```

## Security Implementation

### Credential Storage

```typescript
// Stored securely in device keychain
interface FlashCredentials {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  authHeader: string;        // Base64 encoded Basic auth
  accountNumber: string;
}
```

**Security Features:**
- All credentials stored in iOS Keychain / Android Keystore
- Automatic cleanup on app uninstall
- No hardcoded API keys in JavaScript
- Token refresh 5 minutes before expiration
- Secure error handling without credential exposure

### Authentication Flow

1. **Initialization:**
   - Check for existing valid credentials
   - Initialize with QA credentials if not found
   - Request initial OAuth token

2. **Token Management:**
   - Automatic refresh before expiration
   - Retry logic with exponential backoff
   - Fallback to credential re-authentication

3. **API Requests:**
   - Automatic token injection in headers
   - 401 response triggers token refresh
   - Request retry with new token

## Integration Points

### Existing App Integration

**Payouts Screen (`payouts.tsx`):**
- Electricity payout type opens ElectricityPurchaseModal
- Maintains existing UI patterns and styling
- Preserves original payout functionality for other types

**Root Layout (`_layout.tsx`):**
- QueryClientProvider wraps entire app
- Configured with optimal caching and retry strategies
- Enables React Query hooks throughout the app

**Dependencies Added:**
```json
{
  "expo-secure-store": "^12.0.0",
  "@tanstack/react-query": "^5.0.0", 
  "axios": "^1.6.0"
}
```

## API Endpoints

### Base URLs
- **Sandbox:** `https://api-flashswitch-sandbox.flash-group.com`
- **Production:** `https://api.flashswitch.flash-group.com`

### Authentication
- **Token:** `POST /oauth/token`

### 1Voucher Service
- **Purchase:** `POST /1Voucher/Purchase`
- **History:** `GET /1Voucher/History`
- **Details:** `POST /1Voucher/Details`

### Prepaid Electricity
- **Municipalities:** `GET /PrepaidElectricity/Municipalities`
- **Meter Lookup:** `POST /PrepaidElectricity/MeterLookup`
- **Purchase:** `POST /PrepaidElectricity/Purchase`
- **History:** `GET /PrepaidElectricity/History`
- **Status:** `GET /PrepaidElectricity/TransactionStatus/{id}`

### Airtime/Data
- **Networks:** `GET /Airtime/Networks`
- **Phone Validation:** `POST /Airtime/PhoneValidation`
- **Data Bundles:** `GET /Airtime/DataBundles`
- **Purchase Airtime:** `POST /Airtime/Purchase`
- **Purchase Data:** `POST /Airtime/PurchaseData`
- **History:** `GET /Airtime/History`
- **Status:** `GET /Airtime/TransactionStatus/{id}`

## Error Handling

### Common Error Scenarios

1. **Network Errors:**
   - Automatic retry with exponential backoff
   - Fallback to cached data where appropriate
   - User-friendly error messages

2. **Authentication Errors:**
   - Automatic token refresh
   - Credential re-initialization
   - Secure error reporting

3. **Business Logic Errors:**
   - Input validation before API calls
   - Specific error messages for each scenario
   - Graceful degradation

4. **API Errors:**
   - Flash API error code mapping
   - Context-specific error handling
   - Transaction status tracking

### Error Response Format

```typescript
// Standardized error response
interface BaseApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
```

## Performance Optimizations

### Caching Strategy
- **Authentication:** 5-10 minute cache with automatic refresh
- **Municipalities:** 30-60 minute cache (rarely changes)
- **Transaction History:** 2-5 minute cache with pagination
- **Network Providers:** 30-60 minute cache

### Query Optimization
- **Parallel Requests:** Multiple API calls when safe
- **Conditional Queries:** Only run when conditions met
- **Background Refetch:** Update stale data transparently
- **Optimistic Updates:** Immediate UI feedback

### Memory Management
- **Query Garbage Collection:** Automatic cleanup of unused data
- **Request Deduplication:** Prevent duplicate API calls
- **Connection Pooling:** Efficient HTTP connection reuse

## Future Enhancements

### Planned Features
1. **Airtime Purchase Screen** - Mobile-optimized airtime/data purchase UI
2. **Voucher Management Screen** - 1Voucher purchase and PIN management  
3. **Transaction History Integration** - Flash transactions in existing history
4. **Receipt Sharing** - WhatsApp/SMS receipt distribution
5. **Offline Support** - Queue transactions when offline
6. **Push Notifications** - Transaction status updates
7. **Biometric Security** - Optional biometric authentication

### Architecture Improvements
1. **Transaction Queuing** - Offline transaction support
2. **Real-time Updates** - WebSocket integration for status updates
3. **Analytics Integration** - Usage tracking and insights
4. **Multi-language Support** - i18n for error messages and UI
5. **Accessibility** - Enhanced screen reader support

## Troubleshooting

### Common Issues

1. **Authentication Failures:**
   - Check QA credentials configuration
   - Verify sandbox environment URL
   - Clear secure storage and re-initialize

2. **Meter Lookup Failures:**
   - Ensure 11-digit meter number format
   - Try different municipality codes
   - Use provided QA meter numbers for testing

3. **Purchase Timeouts:**
   - Check network connectivity
   - Verify sufficient balance
   - Monitor API response times

4. **Token Refresh Issues:**
   - Clear stored credentials
   - Re-initialize authentication
   - Check token expiration handling

### Debug Information

```typescript
// Enable debug logging in development
if (__DEV__) {
  console.log('🚀 API Request:', config);
  console.log('✅ API Response:', response);
  console.log('❌ API Error:', error);
}
```

## Support

For technical issues or questions about the Flash Partner API v4 integration:

1. Check the testing guide: `FLASH_API_TESTING_GUIDE.md`
2. Review API documentation: Flash Partner API V4 - V2.pdf
3. Check QA credentials: V4 QA.pdf
4. Contact Flash API support for production issues

---

**Last Updated:** 2025-09-09
**Version:** 1.0.0
**Status:** Production Ready