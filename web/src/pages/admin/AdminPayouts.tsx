import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  CheckCircle, XCircle, Clock, User, MapPin, DollarSign,
  Smartphone, Building2, Send, RefreshCw, AlertCircle,
} from 'lucide-react';
import { formatCurrency } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'https://api.nogadacarguard.co.za';

// ─── Types ────────────────────────────────────────────────────────────────────

type PayoutStatus = 'PENDING' | 'APPROVED' | 'PROCESSING' | 'COMPLETED' | 'REJECTED' | 'CANCELLED' | 'FAILED';
type PayoutMethod = 'VOUCHER' | 'BANK_TRANSFER';

interface GuardInfo {
  guardId: string;
  name: string;
  surname: string;
  phone: string;
  bankName: string | null;
  accountNumber: string | null;
  branchCode: string | null;
  accountType: string | null;
  balance: number;
}

interface PayoutRequest {
  id: string;
  payoutId: string;
  amount: number;
  status: PayoutStatus;
  method: PayoutMethod | null;
  notes: string | null;
  adminNotes: string | null;
  rejectionReason: string | null;
  requestedAt: string;
  approvedAt: string | null;
  completedAt: string | null;
  guard: GuardInfo;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function methodLabel(m?: PayoutMethod | null) {
  return m === 'BANK_TRANSFER' ? 'Bank Transfer' : 'eWallet';
}

function MethodBadge({ method }: { method?: PayoutMethod | null }) {
  const isBank = method === 'BANK_TRANSFER';
  return (
    <Badge
      variant="outline"
      className={isBank
        ? 'text-emerald-700 border-emerald-400 bg-emerald-50'
        : 'text-blue-700 border-blue-400 bg-blue-50'}
    >
      {isBank
        ? <Building2 className="w-3 h-3 mr-1" />
        : <Smartphone className="w-3 h-3 mr-1" />}
      {methodLabel(method)}
    </Badge>
  );
}

function StatusBadge({ status }: { status: PayoutStatus }) {
  switch (status) {
    case 'PENDING':
      return <Badge variant="outline" className="text-yellow-600 border-yellow-500 bg-yellow-50"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    case 'APPROVED':
    case 'PROCESSING':
      return <Badge variant="outline" className="text-blue-600 border-blue-500 bg-blue-50"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
    case 'COMPLETED':
      return <Badge variant="outline" className="text-green-600 border-green-500 bg-green-50"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
    case 'REJECTED':
    case 'CANCELLED':
      return <Badge variant="outline" className="text-red-600 border-red-500 bg-red-50"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
    case 'FAILED':
      return <Badge variant="outline" className="text-orange-600 border-orange-500 bg-orange-50"><AlertCircle className="w-3 h-3 mr-1" />Failed</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function fmt(dt: string | null) {
  if (!dt) return '—';
  return new Date(dt).toLocaleString('en-ZA', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─── API calls ────────────────────────────────────────────────────────────────

async function apiPost(path: string, body: Record<string, unknown>) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

// ─── Component ────────────────────────────────────────────────────────────────

const AdminPayouts = () => {
  const { toast } = useToast();

  const [loading, setLoading]     = useState(true);
  const [payouts, setPayouts]     = useState<PayoutRequest[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Review (approve/reject) dialog
  const [reviewTarget, setReviewTarget] = useState<PayoutRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [reviewBusy, setReviewBusy] = useState(false);

  // Mark-as-sent dialog
  const [sentTarget, setSentTarget]   = useState<PayoutRequest | null>(null);
  const [ewalletNotes, setEwalletNotes] = useState('');
  const [bankRef, setBankRef]         = useState('');
  const [sentBusy, setSentBusy]       = useState(false);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchPayouts = useCallback(async () => {
    setFetchError(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/payout-requests?limit=200`);
      const json = await res.json();
      if (json.success) {
        setPayouts(json.data.payouts as PayoutRequest[]);
      } else {
        setFetchError(json.error || 'Failed to load payouts');
      }
    } catch (e) {
      setFetchError('Could not connect to the API. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPayouts(); }, [fetchPayouts]);

  // ── Approve / Reject ──────────────────────────────────────────────────────
  const handleReviewSubmit = async () => {
    if (!reviewTarget || !reviewAction) return;
    setReviewBusy(true);
    try {
      const path = reviewAction === 'approve'
        ? `/api/admin/payout-requests/${reviewTarget.id}/approve`
        : `/api/admin/payout-requests/${reviewTarget.id}/reject`;
      const body = reviewAction === 'approve'
        ? { adminNotes: reviewNotes || undefined }
        : { reason: rejectionReason || 'No reason provided' };

      const json = await apiPost(path, body);
      if (json.success) {
        toast({ title: reviewAction === 'approve' ? 'Payout Approved' : 'Payout Rejected', description: json.message });
        setReviewTarget(null);
        setReviewAction(null);
        setReviewNotes('');
        setRejectionReason('');
        await fetchPayouts();
      } else {
        toast({ title: 'Error', description: json.error || 'Action failed', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Request failed. Check your connection.', variant: 'destructive' });
    } finally {
      setReviewBusy(false);
    }
  };

  // ── Mark as sent ──────────────────────────────────────────────────────────
  const handleMarkSent = async () => {
    if (!sentTarget) return;
    setSentBusy(true);
    const isBank = sentTarget.method === 'BANK_TRANSFER';
    try {
      const path = isBank
        ? `/api/admin/payout-requests/${sentTarget.id}/bank-transfer-sent`
        : `/api/admin/payout-requests/${sentTarget.id}/ewallet-sent`;
      const body = isBank
        ? { reference: bankRef || undefined }
        : { notes: ewalletNotes || undefined };

      const json = await apiPost(path, body);
      if (json.success) {
        toast({
          title: isBank ? 'Bank Transfer Confirmed' : 'eWallet Sent',
          description: json.message,
        });
        setSentTarget(null);
        setEwalletNotes('');
        setBankRef('');
        await fetchPayouts();
      } else {
        toast({ title: 'Error', description: json.error || 'Action failed', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Request failed. Check your connection.', variant: 'destructive' });
    } finally {
      setSentBusy(false);
    }
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const pending    = payouts.filter(p => p.status === 'PENDING');
  const approved   = payouts.filter(p => p.status === 'APPROVED' || p.status === 'PROCESSING');
  const totalPending  = pending.reduce((s, p) => s + p.amount, 0);
  const totalApproved = approved.reduce((s, p) => s + p.amount, 0);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Payout Management</h1>
        <Button variant="outline" size="sm" onClick={() => { setLoading(true); fetchPayouts(); }} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '—' : pending.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '—' : formatCurrency(totalPending)}</div>
            <p className="text-xs text-muted-foreground">Across all pending requests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Awaiting Payment</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '—' : formatCurrency(totalApproved)}</div>
            <p className="text-xs text-muted-foreground">{approved.length} approved — not yet sent</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payout Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {fetchError ? (
            <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p className="text-sm">{fetchError}</p>
            </div>
          ) : loading ? (
            <div className="py-12 text-center text-muted-foreground">Loading payout requests…</div>
          ) : payouts.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">No payout requests found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Guard</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.map(req => (
                  <TableRow key={req.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{req.guard.name} {req.guard.surname}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <User className="w-3 h-3" />{req.guard.guardId}
                          {req.guard.phone && <> · {req.guard.phone}</>}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">{formatCurrency(req.amount)}</TableCell>
                    <TableCell><MethodBadge method={req.method} /></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{fmt(req.requestedAt)}</TableCell>
                    <TableCell><StatusBadge status={req.status} /></TableCell>
                    <TableCell>
                      <div className="flex gap-2 flex-wrap">
                        {req.status === 'PENDING' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => { setReviewTarget(req); setReviewNotes(''); setRejectionReason(''); setReviewAction(null); }}
                          >
                            Review
                          </Button>
                        )}
                        {(req.status === 'APPROVED' || req.status === 'PROCESSING') && (
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => { setSentTarget(req); setEwalletNotes(''); setBankRef(''); }}
                          >
                            <Send className="w-3 h-3 mr-1" />
                            Mark Sent
                          </Button>
                        )}
                        {(req.status === 'COMPLETED' || req.status === 'REJECTED' || req.status === 'FAILED') && (
                          <span className="text-xs text-muted-foreground italic">
                            {req.status === 'COMPLETED'
                              ? (req.method === 'BANK_TRANSFER' ? 'Transfer sent' : 'eWallet sent')
                              : req.status === 'REJECTED' ? 'Declined' : 'Failed'}
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── Review dialog (approve / reject) ─────────────────────────────── */}
      <Dialog open={!!reviewTarget} onOpenChange={open => { if (!open) { setReviewTarget(null); setReviewAction(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Review Payout Request</DialogTitle>
            <DialogDescription>
              {reviewTarget && `${reviewTarget.guard.name} ${reviewTarget.guard.surname} — ${formatCurrency(reviewTarget.amount)}`}
            </DialogDescription>
          </DialogHeader>

          {reviewTarget && (
            <div className="space-y-4">
              <div className="rounded-lg border p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Guard ID</span>
                  <span className="font-mono">{reviewTarget.guard.guardId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-bold text-base">{formatCurrency(reviewTarget.amount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Method</span>
                  <MethodBadge method={reviewTarget.method} />
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Balance</span>
                  <span>{formatCurrency(reviewTarget.guard.balance)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Requested</span>
                  <span>{fmt(reviewTarget.requestedAt)}</span>
                </div>
                {reviewTarget.notes && (
                  <div className="pt-1 border-t">
                    <span className="text-muted-foreground">Guard note: </span>
                    <span className="italic">{reviewTarget.notes}</span>
                  </div>
                )}
              </div>

              {/* Bank details for reference if it's a bank transfer */}
              {reviewTarget.method === 'BANK_TRANSFER' && reviewTarget.guard.accountNumber && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm space-y-1">
                  <p className="font-medium text-emerald-800 text-xs uppercase tracking-wide mb-2">Banking Details</p>
                  <div className="flex justify-between"><span className="text-muted-foreground">Bank</span><span>{reviewTarget.guard.bankName || '—'}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Account</span><span className="font-mono">{reviewTarget.guard.accountNumber}</span></div>
                  {reviewTarget.guard.branchCode && <div className="flex justify-between"><span className="text-muted-foreground">Branch</span><span className="font-mono">{reviewTarget.guard.branchCode}</span></div>}
                  {reviewTarget.guard.accountType && <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span>{reviewTarget.guard.accountType}</span></div>}
                </div>
              )}

              {/* Action-specific inputs */}
              {reviewAction === 'reject' ? (
                <div className="space-y-2">
                  <Label htmlFor="rejection-reason">Reason for rejection <span className="text-red-500">*</span></Label>
                  <Input
                    id="rejection-reason"
                    value={rejectionReason}
                    onChange={e => setRejectionReason(e.target.value)}
                    placeholder="e.g. Insufficient documentation, balance discrepancy…"
                  />
                </div>
              ) : reviewAction === 'approve' ? (
                <div className="space-y-2">
                  <Label htmlFor="review-notes">Admin notes (optional)</Label>
                  <Input
                    id="review-notes"
                    value={reviewNotes}
                    onChange={e => setReviewNotes(e.target.value)}
                    placeholder="Internal notes…"
                  />
                </div>
              ) : null}

              {/* Choose action */}
              {!reviewAction ? (
                <DialogFooter className="gap-2 sm:gap-2">
                  <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50" onClick={() => setReviewAction('reject')}>
                    <XCircle className="w-4 h-4 mr-2" />
                    Decline
                  </Button>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setReviewAction('approve')}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                </DialogFooter>
              ) : (
                <DialogFooter className="gap-2 sm:gap-2">
                  <Button variant="ghost" onClick={() => setReviewAction(null)} disabled={reviewBusy}>Back</Button>
                  <Button
                    variant={reviewAction === 'reject' ? 'destructive' : 'default'}
                    className={reviewAction === 'approve' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                    onClick={handleReviewSubmit}
                    disabled={reviewBusy || (reviewAction === 'reject' && !rejectionReason.trim())}
                  >
                    {reviewBusy ? 'Processing…' : reviewAction === 'approve' ? 'Confirm Approval' : 'Confirm Decline'}
                  </Button>
                </DialogFooter>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Mark as Sent dialog ───────────────────────────────────────────── */}
      <Dialog open={!!sentTarget} onOpenChange={open => { if (!open) setSentTarget(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {sentTarget?.method === 'BANK_TRANSFER' ? 'Confirm Bank Transfer' : 'Mark eWallet Sent'}
            </DialogTitle>
            <DialogDescription>
              {sentTarget && `${sentTarget.guard.name} ${sentTarget.guard.surname} — ${formatCurrency(sentTarget.amount)}`}
            </DialogDescription>
          </DialogHeader>

          {sentTarget && (
            <div className="space-y-4">
              {sentTarget.method === 'BANK_TRANSFER' ? (
                <>
                  {sentTarget.guard.accountNumber ? (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm space-y-2">
                      <p className="font-semibold text-emerald-800 text-xs uppercase tracking-wide mb-1">Transfer to</p>
                      <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">{sentTarget.guard.name} {sentTarget.guard.surname}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Bank</span><span>{sentTarget.guard.bankName || '—'}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Account</span><span className="font-mono">{sentTarget.guard.accountNumber}</span></div>
                      {sentTarget.guard.branchCode && <div className="flex justify-between"><span className="text-muted-foreground">Branch</span><span className="font-mono">{sentTarget.guard.branchCode}</span></div>}
                      {sentTarget.guard.accountType && <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span>{sentTarget.guard.accountType}</span></div>}
                      <div className="flex justify-between border-t pt-2 mt-1"><span className="text-muted-foreground font-medium">Amount</span><span className="font-bold text-base">{formatCurrency(sentTarget.amount)}</span></div>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-700">
                      <AlertCircle className="w-4 h-4 inline mr-2" />
                      No banking details on file for this guard.
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="bank-ref">EFT Reference (optional)</Label>
                    <Input
                      id="bank-ref"
                      value={bankRef}
                      onChange={e => setBankRef(e.target.value)}
                      placeholder="Bank transaction reference…"
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setSentTarget(null)} disabled={sentBusy}>Cancel</Button>
                    <Button
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={handleMarkSent}
                      disabled={sentBusy}
                    >
                      <Building2 className="w-4 h-4 mr-2" />
                      {sentBusy ? 'Confirming…' : 'Mark Bank Transfer Sent'}
                    </Button>
                  </DialogFooter>
                </>
              ) : (
                <>
                  <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Guard</span><span>{sentTarget.guard.name} {sentTarget.guard.surname}</span></div>
                    <div className="flex justify-between mt-1"><span className="text-muted-foreground">Phone</span><span>{sentTarget.guard.phone}</span></div>
                    <div className="flex justify-between mt-1 border-t pt-2"><span className="text-muted-foreground font-medium">Amount</span><span className="font-bold">{formatCurrency(sentTarget.amount)}</span></div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ewallet-notes">Notes (optional)</Label>
                    <Input
                      id="ewallet-notes"
                      value={ewalletNotes}
                      onChange={e => setEwalletNotes(e.target.value)}
                      placeholder="e.g. eWallet reference, time sent…"
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setSentTarget(null)} disabled={sentBusy}>Cancel</Button>
                    <Button
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={handleMarkSent}
                      disabled={sentBusy}
                    >
                      <Smartphone className="w-4 h-4 mr-2" />
                      {sentBusy ? 'Marking…' : 'Mark eWallet Sent'}
                    </Button>
                  </DialogFooter>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPayouts;
