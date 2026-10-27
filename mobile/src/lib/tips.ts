/**
 * Shared tip helpers for the CTA app. To a CTA a tip is a tip, whichever QR the
 * customer scanned: one list, one total, one set of statuses. Which QR was used is
 * kept only as a small "via" note.
 *
 *   Tippa QR (Auto, the new lanyard): the customer scans, picks an amount and pays.
 *     Every step is visible, including tips that do not finish.
 *   Netcash QR (Manual, the original lanyard): payments go straight to Netcash. A tip
 *     only appears once the money reaches the Netcash statement.
 */
import type { AttemptStatus, TipAttempt, TipChannel, Transaction } from '../../services/mobileApiService';

export const LIVE_SITE = 'https://www.tippapaymentsolutions.com';

/** The Tippa link printed on new lanyards. Built here too, in case an older cached profile lacks it. */
export function tipLinkFor(guardPublicId?: string | null, fromServer?: string | null) {
  if (fromServer) return fromServer;
  return guardPublicId ? `${LIVE_SITE}/t/${encodeURIComponent(guardPublicId)}` : null;
}

export type FeedStatus = AttemptStatus | 'UNCONFIRMED';

export const STATUS_STYLE: Record<FeedStatus, { label: string; color: string; bg: string; icon: string }> = {
  SUCCESS: { label: 'Confirmed', color: '#047857', bg: '#D1FAE5', icon: 'checkmark-circle' },
  PENDING: { label: 'Pending', color: '#1D4ED8', bg: '#DBEAFE', icon: 'time' },
  IN_PROGRESS: { label: 'Pending', color: '#1D4ED8', bg: '#DBEAFE', icon: 'time' },
  INCOMPLETE: { label: 'Not completed', color: '#B45309', bg: '#FEF3C7', icon: 'return-down-back' },
  ABANDONED: { label: 'Not completed', color: '#B45309', bg: '#FEF3C7', icon: 'return-down-back' },
  FAILED: { label: 'Failed', color: '#B91C1C', bg: '#FEE2E2', icon: 'close-circle' },
  UNCONFIRMED: { label: 'Pending', color: '#1D4ED8', bg: '#DBEAFE', icon: 'time' },
};

export const CHANNEL_STYLE: Record<TipChannel, { label: string; short: string; color: string; bg: string; icon: string }> = {
  TIPPA_QR: { label: 'Tippa QR', short: 'Tippa', color: '#11468F', bg: '#DBEAFE', icon: 'qr-code' },
  NETCASH_QR: { label: 'Netcash QR', short: 'Netcash', color: '#0F172A', bg: '#E2E8F0', icon: 'card' },
  OTHER: { label: 'Other', short: 'Other', color: '#4B5563', bg: '#F3F4F6', icon: 'swap-horizontal' },
};

/** What each label means, shown in the app so nothing is a mystery. */
export const STATUS_HELP: { status: FeedStatus; text: string }[] = [
  { status: 'SUCCESS', text: 'The money is on your balance. Checked twice: it was credited to you, and it is matched to this payment by its reference or by Netcash.' },
  { status: 'PENDING', text: 'Not money yet. The customer went to pay but has not approved it in their banking app or on Netcash, or Netcash has not confirmed it. It updates by itself within 15 minutes.' },
  { status: 'INCOMPLETE', text: 'The customer started a tip but did not pay. No money was taken. If they tried again and paid, the earlier try shows here and the paid one shows as Confirmed.' },
  { status: 'FAILED', text: 'The payment was tried but did not go through, for example declined by the bank. The reason is shown on the tip.' },
];

export interface FeedItem {
  key: string;
  at: string;
  channel: TipChannel;
  status: FeedStatus;
  amount: number | null;
  received: number | null;
  explanation: string;
  attempt?: TipAttempt;
}

/**
 * One list of tip activity from both lanyards, newest first:
 *   - every Tippa QR attempt (paid or not), from tip activity
 *   - every Netcash QR tip from transactions (only paid ones exist there)
 * Tippa QR tips are not taken from transactions too, so nothing appears twice.
 */
export function buildTipFeed(attempts: TipAttempt[], transactions: Transaction[]): FeedItem[] {
  const feed: FeedItem[] = attempts.map(a => ({
    key: `a-${a.id}`,
    at: a.status === 'SUCCESS' && a.paidAt ? a.paidAt : a.startedAt,
    channel: 'TIPPA_QR',
    status: a.status,
    amount: a.amount,
    received: a.received,
    explanation: a.explanation,
    attempt: a,
  }));
  for (const t of transactions) {
    if (t.type?.toUpperCase() !== 'TIP' || t.channel === 'TIPPA_QR') continue;
    const status: FeedStatus = t.status === 'COMPLETED' ? 'SUCCESS' : t.status === 'UNCONFIRMED' ? 'UNCONFIRMED' : t.status === 'FAILED' || t.status === 'REVERSED' ? 'FAILED' : 'PENDING';
    const original = Number((t.metadata as any)?.originalAmount ?? t.amount);
    feed.push({
      key: `t-${t.id}`,
      at: t.createdAt,
      channel: t.channel || 'NETCASH_QR',
      status,
      amount: Number.isFinite(original) ? original : t.amount,
      received: status === 'SUCCESS' ? t.amount : null,
      explanation: t.explanation || (status === 'SUCCESS' ? `R${t.amount.toFixed(2)} added to your balance.` : t.failureReason || ''),
    });
  }
  return feed.sort((x, y) => new Date(y.at).getTime() - new Date(x.at).getTime());
}

/** The small grey note under a tip saying which QR the customer scanned. */
export const viaLabel = (channel?: TipChannel | null) =>
  channel === 'TIPPA_QR' ? 'via Tippa QR' : channel === 'NETCASH_QR' ? 'via Netcash QR' : null;

export const rand = (v: number | null | undefined) => (v == null ? 'No amount chosen' : `R${Number(v).toFixed(2)}`);

/** "Just now", "12 min ago", "Today 14:05", "Yesterday 09:30", "3 Oct 16:20" */
export function when(iso: string) {
  const d = new Date(iso);
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const time = d.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
  const today = new Date();
  const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return `Today ${time}`;
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday ${time}`;
  return `${d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })} ${time}`;
}

/** Local calendar date as YYYY-MM-DD (the phone's own day, not UTC). */
export const localDay = (d: Date = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const STEP_LABEL: Record<string, string> = {
  OPENED: 'Opened your tip page',
  AMOUNT_CHOSEN: 'Chose an amount',
  PAY_PRESSED: 'Pressed Pay and went to Netcash',
  PAY_ERROR: 'The payment could not start',
  PAGE_HIDDEN: 'Left the page',
  PAGE_VISIBLE: 'Came back to the page',
  RETURNED_FROM_NETCASH: 'Came back from Netcash without paying',
  NETCASH_ACCEPTED: 'Netcash approved the payment',
  NETCASH_DECLINED: 'Netcash declined the payment',
};
