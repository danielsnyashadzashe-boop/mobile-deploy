# 1Voucher / Flash API — Current Settings

## Provider

Flash Group — Flash Switch API  
Product: 1Voucher (prepaid cash voucher redeemable at retail stores)

---

## Environment

Currently configured in **sandbox mode**.  
The sandbox URL contains the string `sandbox` which triggers `IS_SANDBOX = true` in `backend/src/routes/payouts.ts` and `mobile.ts`, relaxing balance and DB validation checks.

---

## Environment Variables (backend/.env)

| Variable | Current Value | Description |
|----------|--------------|-------------|
| `ONEVOUCHER_ACCOUNT_NUMBER` | `8058-7467-3755-5732` | Flash account number used in purchase requests |
| `ONEVOUCHER_SANDBOX_BASE_URL` | `https://api-flashswitch-sandbox.flash-group.com` | Sandbox API base URL |
| `ONEVOUCHER_TOKEN_URL` | `https://api-flashswitch-sandbox.flash-group.com/token` | OAuth token endpoint |
| `ONEVOUCHER_API_KEY` | `UF92SGh4Q1RjZnNYMUJFNmZkTGdTcl9JeVRRYTpaSTN4TjkwN2ZHbjB4X0dqOWdCNGkyTWc0V29h` | Base64-encoded `client_id:client_secret` for Basic Auth |

---

## How Authentication Works

The Flash API uses OAuth2 client credentials flow.

1. POST to `ONEVOUCHER_TOKEN_URL` with:
   - Header: `Authorization: Basic <ONEVOUCHER_API_KEY>`
   - Body: `grant_type=client_credentials`
2. Returns `access_token` valid for `expires_in` seconds
3. Token is cached in memory with a 5-minute buffer before expiry
4. All purchase requests use `Authorization: Bearer <access_token>`

---

## Purchase Endpoint

```
POST <ONEVOUCHER_BASE_URL>/onevoucher/purchase
Authorization: Bearer <token>
Content-Type: application/json

{
  "accountNumber": "<ONEVOUCHER_ACCOUNT_NUMBER>",
  "amount": <amount_in_cents>,   // multiply rands × 100
  "reference": "<unique_ref>",
  "productCode": "1VOUCHER"
}
```

Response fields used:
- `pin` / `voucherPin` / `voucher.pin` — the voucher PIN shown to guard
- `serialNumber` / `voucherSerial` / `voucher.serialNumber`
- `expiryDate` / `voucher.expiryDate`
- `transactionId` / `txnId`

---

## Sandbox Behaviour

When `IS_SANDBOX = true` (detected from URL containing "sandbox"):

- If the Flash API purchase call fails, the backend **falls back to mock data** (randomly generated PIN and serial) rather than returning an error
- Balance checks and DB guard lookups are skipped on the payout process endpoint
- Payout records are NOT written to the database
- The mock fallback generates:
  - 16-digit random PIN
  - 10-digit random serial number
  - Expiry date = 1 year from now

---

## Production Switch

To go live, update `.env`:

```env
# Remove or replace the sandbox URL:
ONEVOUCHER_BASE_URL=https://api-flashswitch.flash-group.com

# Remove the sandbox URL variable:
# ONEVOUCHER_SANDBOX_BASE_URL=...

# Update account number and API key to production credentials
ONEVOUCHER_ACCOUNT_NUMBER=<production_account_number>
ONEVOUCHER_API_KEY=<production_base64_client_id:secret>
```

`IS_SANDBOX` will become `false` automatically since the URL no longer contains "sandbox", enabling:
- Real balance checks
- Real DB writes for payout records
- No mock fallback on Flash API failure

---

## Where This Is Used in Code

| File | What it does |
|------|-------------|
| `backend/src/routes/payouts.ts` | `POST /api/payouts/process` — purchases a 1Voucher via Flash API, stores result in Payout record |
| `backend/src/routes/mobile.ts` | `IS_SANDBOX` constant — controls whether validation is skipped |
| `mobile/services/mobileApiService.ts` | `purchaseVoucher()` — calls `POST /api/payouts/process` with `method: VOUCHER` |
| `mobile/components/purchases/VoucherPurchaseModal.tsx` | UI for guard to request a voucher (still active via Services tab) |

---

## Current Status

- Airtime and Electricity purchase buttons on Dashboard and Services tabs now show a **Coming Soon** modal — those features are not yet live
- 1Voucher (Cash Voucher) is still accessible via the Services tab
- All voucher purchases are currently running in sandbox mode with mock fallback

---

## Token Cache

The OAuth token is cached in a module-level variable in `payouts.ts`:

```ts
let cachedToken: { token: string; expiresAt: number } | null = null
```

This cache is process-scoped. A server restart clears it and forces a fresh token fetch on the next purchase.
