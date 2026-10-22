/**
 * Tip activity for the CTA app: every Tippa QR tip attempt with what happened and
 * why, and which QR every tip came through.
 *
 * The admin server (web/server.js) records each step a payer takes on the tip page as
 * an ActivityLog row (entityType "NetcashQrTest", entityId = attempt id, entityName =
 * the CTA's public id). This reads those rows from the shared database and applies the
 * SAME status rules as the admin server's summariseQrTestAttempt, so the app, the
 * admin Tip Journey page and the CTA's notifications always agree. If those rules
 * change there, change them here too.
 *
 * Two lanyards, one balance:
 *   - Tippa QR (Auto): every step is visible here, from scan to payment.
 *   - Netcash QR (Manual): payments go straight to Netcash. Nothing is visible until
 *     the money reaches the Netcash statement, when it appears as a completed tip.
 */
import prisma from './prisma'

export type AttemptStatus = 'SUCCESS' | 'PENDING' | 'FAILED' | 'INCOMPLETE' | 'ABANDONED' | 'IN_PROGRESS'
export type TipChannel = 'TIPPA_QR' | 'NETCASH_QR' | 'OTHER'

const QR_TEST_ENTITY = 'NetcashQrTest'
const NETCASH_TIMEOUT_MS = 15 * 60 * 1000 // no word from Netcash this long after Pay -> abandoned
const IDLE_TIMEOUT_MS = 5 * 60 * 1000 // tip page untouched this long without Pay -> abandoned
const MISREAD = /result code: undefined/ // old admin code saved every Netcash reply as failed

export const LIVE_SITE = process.env.PUBLIC_TIP_BASE_URL || 'https://www.tippapaymentsolutions.com'
export const tipLinkFor = (guardPublicId: string) => `${LIVE_SITE.replace(/\/$/, '')}/t/${encodeURIComponent(guardPublicId)}`

interface AttemptEvent { at: Date; kind: string; amount: string | null; reference: string | null; reason: string | null; source: string; device: string | null }
interface TipRow { id: string; reference: string | null; status: string | null; amount: number; description: string | null; failureReason: string | null; createdAt: Date; metadata: any }

// ── Mongo extended JSON helpers (rows come back from $runCommandRaw) ──────────
const asDate = (v: any): Date => new Date(v && typeof v === 'object' && '$date' in v ? (typeof v.$date === 'object' ? Number(v.$date.$numberLong) : v.$date) : v)

async function readAttemptEvents(guardPublicId: string, since: Date) {
  const res: any = await prisma.$runCommandRaw({
    find: 'ActivityLog',
    filter: { entityType: QR_TEST_ENTITY, entityName: guardPublicId, timestamp: { $gte: { $date: since.toISOString() } } },
    sort: { timestamp: 1 },
    limit: 2000,
    projection: { entityId: 1, timestamp: 1, metadata: 1, errorMessage: 1, userAgent: 1 },
  })
  const docs: any[] = res?.cursor?.firstBatch || []
  const byAttempt = new Map<string, AttemptEvent[]>()
  for (const d of docs) {
    const m = d.metadata || {}
    const list = byAttempt.get(d.entityId) || []
    list.push({ at: asDate(d.timestamp), kind: m.kind, amount: m.amount || null, reference: m.reference || null, reason: d.errorMessage || null, source: m.source || 'PHONE', device: d.userAgent || null })
    byAttempt.set(d.entityId, list)
  }
  return byAttempt
}

/** Same rules as the admin server's summariseQrTestAttempt. */
function summarise(allEvents: AttemptEvent[], tips: TipRow[], now: number, claimed: Set<string>) {
  const events = allEvents.filter(e => e.kind !== 'CTA_NOTIFIED')
  const last = (k: string) => [...events].reverse().find(e => e.kind === k)
  const lastEvent = events[events.length - 1]
  const pay = last('PAY_PRESSED')
  const amount = pay?.amount || last('AMOUNT_CHOSEN')?.amount || null
  const base = { reference: pay?.reference || null, amount, tip: null as TipRow | null }

  if (pay) {
    const payAt = pay.at.getTime()
    const carriesRef = (t: TipRow) => t.reference === pay.reference || t.metadata?.tippaReference === pay.reference || (t.description || '').includes(pay.reference || '\u0000')
    const paid = (t: TipRow) => Number(t.metadata?.originalAmount ?? t.amount)
    const byRef = tips.filter(carriesRef)
    const refCompleted = byRef.find(t => t.status === 'COMPLETED')
    const byAmount = refCompleted ? null : [...tips].reverse().find(t => {
      const at = t.createdAt.getTime()
      return t.status === 'COMPLETED' && !claimed.has(t.id) && at >= payAt && at - payAt <= 7 * 86400000 && Math.abs(paid(t) - parseFloat(pay.amount || '0')) < 0.005
    })
    const done = refCompleted || byAmount
    if (done) {
      claimed.add(done.id)
      return { ...base, tip: done, status: 'SUCCESS' as AttemptStatus, reason: 'Paid' }
    }
    const other = byRef[0]
    if (other) {
      claimed.add(other.id)
      if (other.status === 'FAILED' && MISREAD.test(other.failureReason || other.description || '')) {
        return { ...base, tip: other, status: 'PENDING' as AttemptStatus, reason: 'Waiting for Netcash to confirm' }
      }
      return { ...base, tip: other, status: (other.status === 'FAILED' ? 'FAILED' : 'PENDING') as AttemptStatus, reason: other.failureReason || 'Netcash did not accept the payment' }
    }
  }

  const declined = last('NETCASH_DECLINED')
  if (declined) return { ...base, status: 'FAILED' as AttemptStatus, reason: declined.reason || 'Netcash declined the payment' }
  if (last('NETCASH_ACCEPTED')) return { ...base, status: 'PENDING' as AttemptStatus, reason: 'Netcash approved it, being added to your balance' }

  const payError = last('PAY_ERROR')
  if (payError && (!pay || payError.at > pay.at)) return { ...base, status: 'FAILED' as AttemptStatus, reason: payError.reason || 'The payment could not start' }

  if (pay) {
    const returned = last('RETURNED_FROM_NETCASH')
    if (returned && returned.at > pay.at) return { ...base, status: 'INCOMPLETE' as AttemptStatus, reason: 'Came back without paying' }
    const waited = now - pay.at.getTime()
    if (waited >= NETCASH_TIMEOUT_MS) return { ...base, status: 'ABANDONED' as AttemptStatus, reason: 'Did not finish paying on Netcash' }
    return { ...base, status: 'PENDING' as AttemptStatus, reason: 'Paying on Netcash now' }
  }
  if (lastEvent?.kind === 'PAGE_HIDDEN') return { ...base, status: 'ABANDONED' as AttemptStatus, reason: 'Left without paying' }
  const idle = now - (lastEvent?.at.getTime() || 0)
  if (idle >= IDLE_TIMEOUT_MS) return { ...base, status: 'ABANDONED' as AttemptStatus, reason: 'Opened your tip page but did not pay' }
  return { ...base, status: 'IN_PROGRESS' as AttemptStatus, reason: 'On your tip page now' }
}

const rand = (v: number | string | null | undefined) => `R${Number(v || 0).toFixed(2)}`

/** One sentence a CTA can read and understand, for each outcome. */
function explain(status: AttemptStatus, a: { amount: string | null; reason: string; tip: TipRow | null; paid: boolean }) {
  const amt = a.amount ? rand(a.amount) : 'a'
  switch (status) {
    case 'SUCCESS': {
      const got = a.tip?.metadata?.guardReceivesAmount ?? a.tip?.amount
      const fee = Number(a.tip?.metadata?.commissionAmount || 0)
      return fee > 0 ? `Paid. ${rand(got)} was added to your balance (${rand(a.amount)} tip less ${rand(fee)} fee).` : `Paid. ${rand(got ?? a.amount)} was added to your balance.`
    }
    case 'PENDING':
      return a.reason === 'Paying on Netcash now'
        ? `The customer is paying ${amt} on Netcash right now. This updates as soon as Netcash confirms.`
        : `Netcash is still confirming this ${amt} payment. Card payments can take up to 2 days to land. It will update by itself.`
    case 'FAILED':
      return `The ${amt} payment did not go through (${a.reason.replace(/^Netcash did not accept the payment: ?/i, '') || 'declined'}). No money was taken from the customer.`
    case 'INCOMPLETE':
      return `The customer went to the payment page for ${amt} but came back without paying. No money was taken.`
    case 'ABANDONED':
      return a.paid
        ? `The customer started paying ${amt} but did not finish. No money was taken.`
        : `A customer opened your tip page${a.amount ? ` and chose ${amt}` : ''} but left without paying. No money was taken.`
    default:
      return 'A customer is on your tip page right now.'
  }
}

export const STATUS_LABEL: Record<AttemptStatus, string> = {
  SUCCESS: 'Paid', PENDING: 'Waiting', FAILED: 'Failed', INCOMPLETE: 'Not finished', ABANDONED: 'Left', IN_PROGRESS: 'In progress',
}

async function tipsFor(guardMongoId: string, since: Date): Promise<TipRow[]> {
  const rows = await prisma.transaction.findMany({
    where: { guardId: guardMongoId, type: 'TIP', createdAt: { gte: since } },
    orderBy: { createdAt: 'desc' },
    take: 500,
    select: { id: true, reference: true, status: true, amount: true, description: true, failureReason: true, createdAt: true, metadata: true },
  })
  return rows as TipRow[]
}

/**
 * Attempts for one CTA since a date, newest first, plus which tip transaction ids
 * belong to Tippa QR attempts (so History can label every tip's QR).
 */
export async function loadTipActivity(guardMongoId: string, guardPublicId: string, since: Date) {
  const [byAttempt, tips] = await Promise.all([readAttemptEvents(guardPublicId, since), tipsFor(guardMongoId, since)])
  const now = Date.now()

  // Tips carrying an attempt's own reference belong to that attempt only; the rest are
  // handed out by amount in Pay order, so one tip never counts for two attempts.
  const refs = [...byAttempt.values()].flat().map(e => e.reference).filter(Boolean) as string[]
  const claimed = new Set(tips.filter(t => refs.some(r => t.reference === r || t.metadata?.tippaReference === r || (t.description || '').includes(r))).map(t => t.id))
  const payAt = (ev: AttemptEvent[]) => { const p = ev.filter(e => e.kind === 'PAY_PRESSED').pop(); return p ? p.at.getTime() : Infinity }

  const tippaTipIds = new Set<string>()
  const attempts = [...byAttempt.entries()]
    .sort((x, y) => payAt(x[1]) - payAt(y[1]))
    .map(([id, ev]) => {
      const s = summarise(ev, tips, now, claimed)
      if (s.tip && s.status === 'SUCCESS') tippaTipIds.add(s.tip.id)
      const paid = ev.some(e => e.kind === 'PAY_PRESSED')
      const phone = ev.filter(e => e.kind !== 'CTA_NOTIFIED')
      const opened = phone.find(e => e.kind === 'OPENED')?.at || phone[0]?.at || ev[0].at
      const payEv = phone.find(e => e.kind === 'PAY_PRESSED')
      return {
        id,
        status: s.status,
        statusLabel: STATUS_LABEL[s.status],
        explanation: explain(s.status, { amount: s.amount, reason: s.reason, tip: s.tip, paid }),
        amount: s.amount ? Number(s.amount) : null,
        received: s.status === 'SUCCESS' ? Number(s.tip?.metadata?.guardReceivesAmount ?? s.tip?.amount ?? 0) : null,
        reference: s.reference,
        startedAt: opened.toISOString(),
        updatedAt: ev[ev.length - 1].at.toISOString(),
        paidAt: s.status === 'SUCCESS' && s.tip ? s.tip.createdAt.toISOString() : null,
        secondsToPay: payEv ? Math.round((payEv.at.getTime() - opened.getTime()) / 1000) : null,
        steps: phone.map(e => ({ at: e.at.toISOString(), kind: e.kind, amount: e.amount })),
      }
    })
    .sort((x, y) => new Date(y.updatedAt).getTime() - new Date(x.updatedAt).getTime())

  return { attempts, tips, tippaTipIds }
}

/** Which QR a tip transaction came through. */
export function channelOf(t: { id: string; reference?: string | null; metadata?: any }, tippaTipIds: Set<string>): TipChannel {
  const ref = String(t.reference || '')
  const tippaRef = String(t.metadata?.tippaReference || '')
  if (tippaTipIds.has(t.id) || ref.startsWith('QRT') || tippaRef.startsWith('QRT')) return 'TIPPA_QR'
  const provider = String(t.metadata?.paymentProvider || '').toUpperCase()
  if (provider === 'NETCASH' || t.metadata?.autoReconciled || t.metadata?.netcashRequestTrace) return 'NETCASH_QR'
  return 'OTHER'
}

export const CHANNEL_LABEL: Record<TipChannel, string> = { TIPPA_QR: 'Tippa QR', NETCASH_QR: 'Netcash QR', OTHER: 'Other' }

/** True for the failed records the old admin code wrote by misreading Netcash. */
export const isMisreadFailure = (t: { status?: string | null; failureReason?: string | null; description?: string | null }) =>
  t.status === 'FAILED' && MISREAD.test(t.failureReason || t.description || '')

/** South African date and time for display (the server runs in UTC). */
export function sast(d: Date) {
  const s = new Date(d.getTime() + 2 * 3600 * 1000).toISOString()
  return { date: s.slice(0, 10), time: s.slice(11, 19) }
}
