# Registration Approval Flow

## Overview

This document describes the complete registration approval flow for the NogadaCarGuard platform. When a user registers through the mobile app, their registration goes through an approval process before they can access the app with a CarGuard profile.

## Flow Diagram

```
User Registration (Mobile App)
    ↓
POST /api/registration/complete
    ↓
Registration Status: PENDING
    ↓
Admin Reviews Registration
    ↓
POST /api/admin/registration/:id/approve
    ↓
System Creates CarGuard Profile
    ↓
Registration Status: APPROVED
    ↓
User Can Access App & Receive Tips
```

## API Endpoints

### 1. User Registration

**Endpoint**: `POST /api/registration/complete`

**Description**: User submits their registration through the mobile app.

**Request Body**:
```json
{
  "name": "John",
  "surname": "Doe",
  "email": "john@example.com",
  "phone": "0671234567",
  "idNumber": "9001015800087",
  "dateOfBirth": "1990-01-01",
  "gender": "Male",
  "nationality": "South African",
  "addressLine1": "123 Main Street",
  "suburb": "CBD",
  "city": "Johannesburg",
  "province": "Gauteng",
  "postalCode": "2000",
  "languages": ["English", "Zulu"],
  "emergencyName": "Jane Doe",
  "emergencyRelation": "Spouse",
  "emergencyPhone": "0677654321",
  "bankName": "FNB",
  "accountNumber": "1234567890",
  "accountHolder": "John Doe",
  "branchCode": "250655"
}
```

**Response** (Success):
```json
{
  "success": true,
  "registrationId": "REG1760614835683KU",
  "message": "Registration submitted successfully"
}
```

**What Happens**:
1. System validates all required fields
2. Checks for duplicate registrations (email, phone, ID)
3. Creates Registration record with status: PENDING
4. Creates User record (if doesn't exist) with role: GUARD
5. Stores document URLs if provided

---

### 2. Check Registration Status

**Endpoint**: `POST /api/registration/check`

**Description**: Mobile app checks if user can access the app.

**Request Body**:
```json
{
  "email": "john@example.com"
}
```

**Response** (Approved):
```json
{
  "hasCompletedRegistration": true,
  "canAccessApp": true,
  "currentStatus": "approved",
  "registrationStatus": "APPROVED",
  "guardId": "GRD1760614880022Y49C",
  "registrationId": "REG1760614835683KU"
}
```

**Response** (Pending):
```json
{
  "hasCompletedRegistration": true,
  "canAccessApp": false,
  "currentStatus": "pending_approval",
  "registrationStatus": "PENDING",
  "guardId": null,
  "registrationId": "REG1760614835683KU"
}
```

---

### 3. Admin Approval

**Endpoint**: `POST /api/admin/registration/:id/approve`

**Description**: Admin approves a pending registration. This automatically creates a CarGuard profile.

**Parameters**:
- `:id` - MongoDB ObjectId of the registration (not registrationId)

**Response** (Success):
```json
{
  "success": true,
  "data": {
    "guard": {
      "id": "68f0d9e0462a255faa6ed7cc",
      "guardId": "GRD1760614880022Y49C",
      "name": "John",
      "surname": "Doe",
      "email": "john@example.com",
      "status": "ACTIVE",
      "qrCode": "QR1760614880022FR92K"
    }
  }
}
```

**What Happens**:
1. Finds registration by ID
2. Validates registration status (must be PENDING)
3. Finds or creates User record
4. Generates unique identifiers:
   - `guardId`: GRD{timestamp}{random} (e.g., GRD1760614880022Y49C)
   - `qrCode`: QR{timestamp}{random} (e.g., QR1760614880022FR92K)
   - `nfcTag`: NFC{timestamp}{random} (e.g., NFC1760614880022ABCDE)
5. Creates CarGuard record with:
   - Personal details from registration
   - Bank details from registration
   - Emergency contact from registration
   - Initial balance: R0.00
   - Status: ACTIVE
6. Updates registration status to APPROVED

---

### 4. Admin Rejection

**Endpoint**: `POST /api/admin/registration/:id/reject`

**Description**: Admin rejects a pending registration.

**Request Body**:
```json
{
  "reason": "Documents not clear"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Registration rejected successfully"
}
```

---

## Data Flow

### Registration Table
```
Status: PENDING → APPROVED (or REJECTED)
```

Fields updated on approval:
- `status`: 'APPROVED'
- `approvedAt`: timestamp
- `approvedBy`: admin ID (currently null)
- `guardId`: generated guard ID
- `guardCreatedAt`: timestamp

### CarGuard Table
Created automatically when registration is approved:
```javascript
{
  userId: ObjectId,
  guardId: "GRD1760614880022Y49C",
  name: "John",
  surname: "Doe",
  phone: "0671234567",
  idNumber: "9001015800087",
  qrCode: "QR1760614880022FR92K",
  nfcTag: "NFC1760614880022ABCDE",
  balance: 0,
  lifetimeEarnings: 0,
  locationId: ObjectId,
  status: "ACTIVE",
  verificationLevel: "BASIC",
  onboardingStatus: "COMPLETED",
  // ... bank details
  // ... emergency contact
}
```

---

## QR Code Integration

Once a CarGuard profile is created, the QR code endpoints become available:

### Get Guard Details
**Endpoint**: `GET /api/guards/by-email/:email`
**Returns**: Complete guard profile including location

### Get QR Code
**Endpoint**: `GET /api/qr/:guardId`
**Returns**: Netcash PayNow URL for QR code
```json
{
  "success": true,
  "data": {
    "guardId": "GRD1760614880022Y49C",
    "guardName": "John Doe",
    "qrCode": "https://paynow.netcash.co.za/site/paynow.aspx?m1=...&m2=...&p2=TIP_GRD1760614880022Y49C_...",
    "balance": 0,
    "status": "ACTIVE"
  }
}
```

The QR code URL contains:
- Netcash service and vendor keys
- Payment reference: `TIP_{guardId}_{timestamp}_QR`
- Payment description: "Tip for {name}"
- Default amount: R20.00
- Return and notify URLs
- Budget payment enabled

---

## Mobile App Integration

### Registration Flow (app/(auth)/sign-up.tsx → complete-registration.tsx)
1. User signs up with Clerk
2. User completes registration form
3. POST /api/registration/complete
4. Navigate to registration-pending.tsx

### Login Flow (app/(auth)/sign-in.tsx)
1. User signs in with Clerk
2. POST /api/registration/check
3. If `canAccessApp: true` → Navigate to dashboard
4. If `currentStatus: 'pending_approval'` → Show pending screen
5. If `hasCompletedRegistration: false` → Navigate to registration

### Dashboard (app/(tabs)/dashboard.tsx)
1. Fetch guard data: GET /api/guards/by-email/:email
2. Fetch QR code: GET /api/qr/:guardId
3. Display QR code with color #404040
4. Show guard balance and details

---

## Utility Scripts

Located in `backend/scripts/`:

### List Pending Approvals
```bash
node scripts/list-pending-approvals.js
```
Shows all registrations by status and identifies approved registrations without CarGuard profiles.

### Fix Existing Approved Registrations
```bash
node scripts/fix-all-approved.js
```
Creates CarGuard profiles for all approved registrations that don't have one.

### Link Guard to User
```bash
node scripts/link-guard-to-user.js user@example.com
```
Links an existing CarGuard to the correct user (useful for duplicate scenarios).

### Manually Approve Registration
```bash
node scripts/approve-and-create-guard.js user@example.com
```
Approves a registration and creates CarGuard profile via script instead of API.

### Find Guard by Email
```bash
node scripts/find-guard.js user@example.com
```
Displays complete guard details for a user.

### Create Test Registration
```bash
node scripts/create-test-registration.js
```
Creates a test registration with PENDING status for testing approval flow.

---

## Important Notes

1. **Duplicate Detection**: System checks for duplicates on email, phone, and ID number during registration.

2. **User Creation**: User record is created during registration with password: "clerk_managed" (Clerk handles actual authentication).

3. **Guard ID Format**:
   - Guard ID: `GRD{timestamp}{4 random chars}`
   - QR Code: `QR{timestamp}{5 random chars}`
   - NFC Tag: `NFC{timestamp}{6 random chars}`

4. **Default Location**: Registrations use DEFAULT_LOCATION_ID from .env file.

5. **Bank Details**: Optional during registration but can be added later for payouts.

6. **Emergency Contact**: Required during registration.

7. **Documents**: Optional document URLs can be attached to registration (ID, photo, proof of address, bank statement, police clearance, reference letter).

8. **Mobile App API URL**: Configure EXPO_PUBLIC_API_URL in mobile/.env for backend connection.

---

## Error Handling

### Registration Errors
- Missing required fields → 400 Bad Request
- Duplicate registration → 400 with alreadyRegistered flag
- Default location not configured → 500 Server Error

### Approval Errors
- Registration not found → 404 Not Found
- Already approved → 400 Bad Request
- CarGuard already exists → 400 Bad Request
- Database errors → 500 Internal Server Error

---

## Future Enhancements

1. **Admin Authentication**: Currently `approvedBy` is set to null. Will be updated to actual admin ID from auth system.

2. **Document Verification**: Add document review step before approval.

3. **Email Notifications**: Send email to user when registration is approved/rejected.

4. **Push Notifications**: Notify mobile app when status changes.

5. **Admin Portal**: Web interface for reviewing and approving registrations.

6. **Bulk Approval**: Approve multiple registrations at once.

7. **Verification Levels**: Progressive verification levels (BASIC → VERIFIED → PREMIUM).
