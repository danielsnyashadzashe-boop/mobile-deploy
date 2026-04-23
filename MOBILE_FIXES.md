# Tippa Mobile — Fix Spec

## Context

Tips come in via Netcash → webhook → guard balance updates in DB. The mobile app reads that real
balance via `clerkUserId`. The link between Netcash and the logged-in user is already established
and working. These fixes clean up what's broken or stale on top of that foundation.

---

## Fix 1 — Remove sandbox/dummy balance

**Problem:** `GuardContext.tsx` substitutes `R5,000` whenever the real balance is `0` in `__DEV__`
mode. This hides real zero balances during development and could mask bugs.

**Files to change:**

### `mobile/contexts/GuardContext.tsx`

Remove the sandbox balance constant and all three places it is applied:

```diff
- const SANDBOX_TEST_BALANCE = 5000;

  const loadStoredData = async () => {
    const parsed = JSON.parse(stored);
-   if (IS_DEV && parsed.balance === 0) {
-     parsed.balance = SANDBOX_TEST_BALANCE;
-   }
    setGuardDataState(parsed);
  };

  const setGuardData = async (data: GuardData | null) => {
-   if (data && IS_DEV && data.balance === 0) {
-     data = { ...data, balance: SANDBOX_TEST_BALANCE };
-   }
    ...
  };
```

Remove `resetSandboxBalance` from the context type, implementation, and provider value. It is no
longer needed.

### `mobile/app/(tabs)/dashboard.tsx`

Remove the "Reset Balance" dev button (lines ~456–464) and the `handleResetSandboxBalance`
function. Remove `resetSandboxBalance` from the `useGuard()` destructure.

---

## Fix 2 — Populate Transaction records on the backend

**Problem:** When a tip is processed, `Transaction.create` only sets `guardId`, `type`, and
`amount`. The fields `description`, `reference`, `status`, and `balance` are all left null. The
mobile endpoint then hardcodes them as `null` in the response regardless.

### `backend/src/routes/tips.ts` — `processTipInternal()` (line ~349)

Do the balance update first, then create the transaction using the returned new balance:

```ts
// 1. Update balance first so we can capture the new balance in the transaction
const updatedGuard = await prisma.carGuard.update({
  where: { id: guard.id },
  data: {
    balance: { increment: guardReceivesAmount },
    lifetimeEarnings: { increment: guardReceivesAmount },
  },
})

// 2. Create transaction with full fields
const transaction = await prisma.transaction.create({
  data: {
    guardId: guard.id,
    type: 'TIP',
    amount: guardReceivesAmount,
    status: 'COMPLETED',
    description: customerEmail
      ? `Tip received from ${customerEmail}`
      : 'Tip received',
    reference: reference || transactionId || null,
    balance: updatedGuard.balance,
  },
})
```

Apply the same change to the main `POST /api/tips` handler (around line 81–100) — it has the same
sparse `transaction.create` call.

### `backend/src/routes/mobile.ts` — transaction endpoint (line ~407)

Replace hardcoded nulls with real fields:

```ts
transactions: transactions.map(t => ({
  id: t.id,
  type: t.type,
  amount: t.amount,
  description: t.description,        // was: null
  status: t.status || 'COMPLETED',
  reference: t.reference,             // was: null
  balance: t.balance,                 // was: null
  date: t.createdAt.toISOString().split('T')[0],
  time: t.createdAt.toISOString().split('T')[1].split('.')[0],
  createdAt: t.createdAt.toISOString(),
}))
```

---

## Fix 3 — Fix hardcoded date in history screen

**Problem:** `mobile/app/(tabs)/history.tsx` line 98 has:

```ts
const today = new Date('2025-09-02'); // Current date from environment
```

This means "Today", "This Week", "This Month" filters are all broken — they always resolve relative
to 2 September 2025.

**Fix:**

```diff
- const today = new Date('2025-09-02');
+ const today = new Date();
```

---

## Fix 4 — Netcash webhook security

**Problem:** `backend/src/routes/tips.ts` line ~276 has a comment placeholder for signature
verification. Anyone who knows the endpoint URL can POST to it and credit a guard's balance.

**How the service key is stored:** Both the NogadaCarGuard web backend and the Tippa backend connect
to the same MongoDB (same `DATABASE_URL`). The NogadaCarGuard schema has a `Settings` collection
designed for exactly this. On web app startup, seed the service key from its own env var into the
`Settings` collection if the record doesn't exist. The Tippa backend then reads it from there —
no `NETCASH_SERVICE_KEY` env var needed in the Tippa `.env` at all.

### Step A — Add `Settings` model to Tippa backend schema

The NogadaCarGuard web app already has a `Settings` model (same MongoDB). Add the same model to
`backend/prisma/schema.prisma` so the Tippa backend can read from the same collection. Append
before the final closing of the schema file:

```prisma
model Settings {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  key         String   @unique
  value       String
  type        String   @default("STRING")
  category    String
  description String?
  isPublic    Boolean  @default(false)
  isEditable  Boolean  @default(true)
  updatedBy   String?  @db.ObjectId
  updatedAt   DateTime @updatedAt
}
```

Then run:

```bash
npx prisma db push
```

This does NOT migrate data — it just tells Prisma the collection exists. Since the collection is
already in MongoDB (created by the web app), this is safe.

### Step B — Web app: seed the key into `Settings` on startup

In the NogadaCarGuard web backend (`web/server.js`), after the DB connection is established,
add a one-time upsert so the key gets written to the shared DB from the web app's env var:

```ts
// Seed Netcash service key into Settings if not already there
await prisma.settings.upsert({
  where: { key: 'netcash_service_key' },
  update: {},  // never overwrite once set — change it via admin UI
  create: {
    key: 'netcash_service_key',
    value: process.env.NETCASH_SERVICE_KEY,
    type: 'STRING',
    category: 'PAYMENT',
    description: 'Netcash Pay Now service key for webhook verification',
    isPublic: false,
  },
})
```

### Step D — Tippa backend: read the key from the DB

Create `backend/src/lib/settings.ts`:

```ts
import prisma from './prisma'

let cachedServiceKey: string | null = null

export async function getNetcashServiceKey(): Promise<string | null> {
  if (cachedServiceKey) return cachedServiceKey

  const setting = await prisma.settings.findUnique({
    where: { key: 'netcash_service_key' }
  })

  cachedServiceKey = setting?.value || null
  return cachedServiceKey
}
```

### Step E — Use it in the webhook handler

```ts
router.post('/webhooks/netcash', async (req: Request, res: Response) => {
  const expectedKey = await getNetcashServiceKey()
  const receivedKey = req.body.ServiceKey || req.headers['x-netcash-service-key']

  if (!expectedKey || !receivedKey || receivedKey !== expectedKey) {
    console.warn('⚠️ Netcash webhook rejected: invalid service key')
    return res.status(401).json({ success: false, error: 'Unauthorized' })
  }
  ...
```

The cache means the DB is only hit once per server restart. If the key is rotated in the web app,
restart the Tippa backend to pick up the new value (or add a cache TTL if needed later).

Note on Netcash webhook payload: confirm the exact field names (`amount`, `reference`, `status`,
`transactionId`) against a real Netcash sandbox test before going live — these may differ from
what the current handler expects.

---

## Fix 5 — Payout flow: remove 1Voucher, use bank transfer request

**Problem:** The dashboard Quick Actions still shows a "Buy Voucher" button routed to
`/voucher-purchase`. The payout model has shifted — guards now request a bank transfer payout
(goes to admin approval queue), not a 1Voucher.

### `mobile/app/(tabs)/dashboard.tsx`

Replace the voucher quick action with a "Request Payout" action:

```diff
- <TouchableOpacity
-   onPress={() => handleQuickAction('voucher')}
-   ...
- >
-   <Ionicons name="ticket-outline" ... />
-   <Text>Buy Voucher</Text>
-   <Text>Cash at stores</Text>
- </TouchableOpacity>

+ <TouchableOpacity
+   onPress={() => router.push('/payouts')}
+   className="bg-emerald-50 rounded-xl p-4 shadow-sm mb-4 border border-emerald-200"
+   style={{ width: '48%' }}
+ >
+   <View className="bg-emerald-100 w-10 h-10 rounded-full items-center justify-center mb-2">
+     <Ionicons name="arrow-up-circle-outline" size={20} color="#059669" />
+   </View>
+   <Text className="text-sm font-medium text-gray-900">Request Payout</Text>
+   <Text className="text-xs text-gray-500">Bank transfer</Text>
+ </TouchableOpacity>
```

Remove `case 'voucher': router.push('/airtime-purchase')` from `handleQuickAction`. Remove the
`purchaseVoucher` import from `mobileApiService` if no other screen uses it.

---

## Fix 6 — Transaction type casing mismatch

**Problem:** The backend creates transactions with `type: 'TIP'` (uppercase). The history screen's
`getTransactionIcon` function checks `case 'tip'` (lowercase). Tips will always fall through to the
default icon.

### `mobile/app/(tabs)/history.tsx` — `getTransactionIcon` (line ~211)

```diff
  const getTransactionIcon = (type: string) => {
-   switch (type) {
-     case 'tip':
-     case 'payout':
-     case 'airtime':
-     case 'electricity':
+   switch (type.toUpperCase()) {
+     case 'TIP':
+     case 'PAYOUT':
+     case 'AIRTIME':
+     case 'ELECTRICITY':
```

Also fix the income/expense detection in `history.tsx` which currently relies on `amount > 0`
vs `amount < 0`. Since payouts are stored as positive amounts in the DB (not negative), add
type-based logic:

```ts
// Income = tips received
if (selectedFilter === 'income') return ['TIP'].includes(tx.type.toUpperCase());
// Expenses = payouts and purchases
if (selectedFilter === 'expenses') return ['PAYOUT', 'AIRTIME', 'ELECTRICITY', 'VOUCHER'].includes(tx.type.toUpperCase());
```

---

## Summary of files to change

| File | What changes |
|------|-------------|
| `backend/src/routes/tips.ts` | Populate `description`, `reference`, `status`, `balance` in `Transaction.create` (both handlers); add webhook service key check |
| `backend/prisma/schema.prisma` | Add `Settings` model (mirrors the web app's schema — same MongoDB collection); run `prisma db push` after |
| `backend/src/lib/settings.ts` | New file — reads `netcash_service_key` from shared MongoDB `Settings` collection with in-memory cache |
| `web/server.js` | Seed `netcash_service_key` into `Settings` on startup (upsert, never overwrites) |
| `backend/src/routes/mobile.ts` | Return real transaction fields instead of hardcoded nulls |
| `mobile/contexts/GuardContext.tsx` | Remove sandbox balance entirely |
| `mobile/app/(tabs)/dashboard.tsx` | Remove sandbox reset button; replace voucher quick action with payout |
| `mobile/app/(tabs)/history.tsx` | Fix hardcoded date; fix type casing; fix income/expense filter logic |

No schema changes needed. No new dependencies needed.
