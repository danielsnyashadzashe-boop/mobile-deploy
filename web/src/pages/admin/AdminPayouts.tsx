
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, Clock, User, MapPin, DollarSign } from 'lucide-react';
import { mockPayoutRequests, formatCurrency, formatDateTime } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';

interface PayoutRequest {
  id: string;
  guardId: string;
  guardName: string;
  location: string;
  amount: number;
  requestDate: string;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
  adminNotes?: string;
}

const AdminPayouts = () => {
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>(mockPayoutRequests);
  const [selectedRequest, setSelectedRequest] = useState<PayoutRequest | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const { toast } = useToast();

  const handleApprove = (requestId: string) => {
    setPayoutRequests(prev => 
      prev.map(req => 
        req.id === requestId 
          ? { ...req, status: 'approved' as const, adminNotes }
          : req
      )
    );
    
    toast({
      title: "Payout Approved",
      description: "The payout request has been approved successfully.",
    });
    
    setDialogOpen(false);
    setAdminNotes('');
    setSelectedRequest(null);
  };

  const handleReject = (requestId: string) => {
    setPayoutRequests(prev => 
      prev.map(req => 
        req.id === requestId 
          ? { ...req, status: 'rejected' as const, adminNotes }
          : req
      )
    );
    
    toast({
      title: "Payout Rejected",
      description: "The payout request has been rejected.",
    });
    
    setDialogOpen(false);
    setAdminNotes('');
    setSelectedRequest(null);
  };

  const getStatusBadge = (status: PayoutRequest['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="text-red-600 border-red-600"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return null;
    }
  };

  const pendingRequests = payoutRequests.filter(req => req.status === 'pending');
  const totalPendingAmount = pendingRequests.reduce((sum, req) => sum + req.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Payout Management</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRequests.length}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pending Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPendingAmount)}</div>
            <p className="text-xs text-muted-foreground">
              Across all pending requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processed Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {payoutRequests.filter(req => req.status !== 'pending').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Approved + Rejected
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payout Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payout Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Guard</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Request Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payoutRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{request.guardName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{request.location}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{formatCurrency(request.amount)}</TableCell>
                  <TableCell>{formatDateTime(request.requestDate)}</TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell>
                    {request.status === 'pending' ? (
                      <Dialog open={dialogOpen && selectedRequest?.id === request.id} onOpenChange={(open) => {
                        setDialogOpen(open);
                        if (open) {
                          setSelectedRequest(request);
                        } else {
                          setSelectedRequest(null);
                          setAdminNotes('');
                        }
                      }}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">Review</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Review Payout Request</DialogTitle>
                            <DialogDescription>
                              Review and approve or reject this payout request for {request.guardName}.
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-4">
                            <div className="grid gap-2">
                              <Label>Guard</Label>
                              <p className="text-sm">{request.guardName}</p>
                            </div>
                            
                            <div className="grid gap-2">
                              <Label>Location</Label>
                              <p className="text-sm">{request.location}</p>
                            </div>
                            
                            <div className="grid gap-2">
                              <Label>Amount Requested</Label>
                              <p className="text-lg font-semibold">{formatCurrency(request.amount)}</p>
                            </div>
                            
                            <div className="grid gap-2">
                              <Label>Request Date</Label>
                              <p className="text-sm">{formatDateTime(request.requestDate)}</p>
                            </div>
                            
                            {request.reason && (
                              <div className="grid gap-2">
                                <Label>Reason</Label>
                                <p className="text-sm">{request.reason}</p>
                              </div>
                            )}
                            
                            <div className="grid gap-2">
                              <Label htmlFor="admin-notes">Admin Notes (Optional)</Label>
                              <Input
                                id="admin-notes"
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                placeholder="Add notes about this decision..."
                              />
                            </div>
                          </div>
                          
                          <DialogFooter className="gap-2">
                            <Button variant="outline" onClick={() => handleReject(request.id)}>
                              <XCircle className="w-4 h-4 mr-2" />
                              Reject
                            </Button>
                            <Button onClick={() => handleApprove(request.id)}>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Approve
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {request.status === 'approved' ? 'Approved' : 'Rejected'}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPayouts;
