import React, { useState } from 'react';
import { mockPendingRegistrations, mockLocations, formatDate, formatTime } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Clock, Eye, UserCheck, UserX } from 'lucide-react';

const AdminRegistrations = () => {
  const [registrations, setRegistrations] = useState(mockPendingRegistrations);
  const [selectedRegistration, setSelectedRegistration] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showApproval, setShowApproval] = useState(false);
  const [showRejection, setShowRejection] = useState(false);
  const [guardId, setGuardId] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Filter registrations by status
  const filteredRegistrations = registrations.filter(reg => {
    if (filterStatus === 'all') return true;
    return reg.status === filterStatus;
  });

  // Count registrations by status
  const pendingCount = registrations.filter(r => r.status === 'pending').length;
  const approvedCount = registrations.filter(r => r.status === 'approved').length;
  const rejectedCount = registrations.filter(r => r.status === 'rejected').length;

  const handleViewDetails = (registration: any) => {
    setSelectedRegistration(registration);
    setShowDetails(true);
  };

  const handleApproveClick = (registration: any) => {
    setSelectedRegistration(registration);
    // Generate a new guard ID
    const nextId = `NG${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}`;
    setGuardId(nextId);
    setShowApproval(true);
  };

  const handleRejectClick = (registration: any) => {
    setSelectedRegistration(registration);
    setRejectionReason('');
    setShowRejection(true);
  };

  const handleApprove = () => {
    if (!guardId) {
      toast.error('Please enter a Guard ID');
      return;
    }

    // Update registration status
    setRegistrations(prev => prev.map(reg => 
      reg.id === selectedRegistration.id 
        ? { 
            ...reg, 
            status: 'approved' as const, 
            assignedGuardId: guardId,
            reviewedBy: 'Admin',
            reviewedAt: new Date().toISOString()
          }
        : reg
    ));

    toast.success(`Registration approved! Guard ID: ${guardId}`);
    setShowApproval(false);
    setSelectedRegistration(null);
    setGuardId('');
  };

  const handleReject = () => {
    if (!rejectionReason) {
      toast.error('Please provide a rejection reason');
      return;
    }

    // Update registration status
    setRegistrations(prev => prev.map(reg => 
      reg.id === selectedRegistration.id 
        ? { 
            ...reg, 
            status: 'rejected' as const, 
            rejectionReason,
            reviewedBy: 'Admin',
            reviewedAt: new Date().toISOString()
          }
        : reg
    ));

    toast.success('Registration rejected');
    setShowRejection(false);
    setSelectedRegistration(null);
    setRejectionReason('');
  };

  const getLocationName = (locationId: string) => {
    const location = mockLocations.find(loc => loc.id === locationId);
    return location ? location.name : 'Unknown Location';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Guard Registrations</h1>
        <p className="text-gray-600 mt-1">Review and approve guard registration applications</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending</CardDescription>
            <CardTitle className="text-2xl text-yellow-600">{pendingCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Approved</CardDescription>
            <CardTitle className="text-2xl text-green-600">{approvedCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Rejected</CardDescription>
            <CardTitle className="text-2xl text-red-600">{rejectedCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={filterStatus === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterStatus('all')}
        >
          All ({registrations.length})
        </Button>
        <Button
          variant={filterStatus === 'pending' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterStatus('pending')}
        >
          Pending ({pendingCount})
        </Button>
        <Button
          variant={filterStatus === 'approved' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterStatus('approved')}
        >
          Approved ({approvedCount})
        </Button>
        <Button
          variant={filterStatus === 'rejected' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterStatus('rejected')}
        >
          Rejected ({rejectedCount})
        </Button>
      </div>

      {/* Registrations List */}
      <div className="grid gap-4">
        {filteredRegistrations.map((registration) => (
          <Card key={registration.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{registration.fullName}</h3>
                    {getStatusBadge(registration.status)}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">ID Number:</span> {registration.idNumber}
                    </div>
                    <div>
                      <span className="font-medium">Phone:</span> {registration.phoneNumber}
                    </div>
                    <div>
                      <span className="font-medium">Location:</span> {getLocationName(registration.preferredLocation)}
                    </div>
                    <div>
                      <span className="font-medium">Submitted:</span> {formatDate(registration.submittedAt)} at {formatTime(registration.submittedAt)}
                    </div>
                    {registration.email && (
                      <div>
                        <span className="font-medium">Email:</span> {registration.email}
                      </div>
                    )}
                    {registration.assignedGuardId && (
                      <div>
                        <span className="font-medium">Guard ID:</span> {registration.assignedGuardId}
                      </div>
                    )}
                  </div>
                  {registration.rejectionReason && (
                    <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-700">
                      <span className="font-medium">Rejection Reason:</span> {registration.rejectionReason}
                    </div>
                  )}
                  {registration.reviewedBy && (
                    <div className="mt-2 text-xs text-gray-500">
                      Reviewed by {registration.reviewedBy} on {formatDate(registration.reviewedAt!)} at {formatTime(registration.reviewedAt!)}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(registration)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  {registration.status === 'pending' && (
                    <>
                      <Button
                        variant="default"
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleApproveClick(registration)}
                      >
                        <UserCheck className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => handleRejectClick(registration)}
                      >
                        <UserX className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* View Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Registration Details</DialogTitle>
            <DialogDescription>
              Complete registration information for {selectedRegistration?.fullName}
            </DialogDescription>
          </DialogHeader>
          {selectedRegistration && (
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Full Name</Label>
                  <div className="font-medium">{selectedRegistration.fullName}</div>
                </div>
                <div>
                  <Label>ID Number</Label>
                  <div className="font-medium">{selectedRegistration.idNumber}</div>
                </div>
                <div>
                  <Label>Phone Number</Label>
                  <div className="font-medium">{selectedRegistration.phoneNumber}</div>
                </div>
                <div>
                  <Label>Email</Label>
                  <div className="font-medium">{selectedRegistration.email || 'Not provided'}</div>
                </div>
                <div>
                  <Label>Preferred Location</Label>
                  <div className="font-medium">{getLocationName(selectedRegistration.preferredLocation)}</div>
                </div>
                <div>
                  <Label>Status</Label>
                  <div>{getStatusBadge(selectedRegistration.status)}</div>
                </div>
              </div>
              {selectedRegistration.bankName && (
                <>
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-2">Banking Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Bank Name</Label>
                        <div className="font-medium">{selectedRegistration.bankName}</div>
                      </div>
                      <div>
                        <Label>Account Number</Label>
                        <div className="font-medium">{selectedRegistration.accountNumber}</div>
                      </div>
                      <div>
                        <Label>Account Type</Label>
                        <div className="font-medium">{selectedRegistration.accountType}</div>
                      </div>
                      <div>
                        <Label>Branch Code</Label>
                        <div className="font-medium">{selectedRegistration.branchCode}</div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog open={showApproval} onOpenChange={setShowApproval}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Registration</DialogTitle>
            <DialogDescription>
              Assign a Guard ID to complete the approval for {selectedRegistration?.fullName}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="guardId">Guard ID</Label>
              <Input
                id="guardId"
                value={guardId}
                onChange={(e) => setGuardId(e.target.value)}
                placeholder="e.g., NG004"
              />
              <p className="text-xs text-gray-500 mt-1">This will be the guard's permanent ID</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproval(false)}>
              Cancel
            </Button>
            <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700">
              Approve & Assign ID
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={showRejection} onOpenChange={setShowRejection}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Registration</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting {selectedRegistration?.fullName}'s application
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="reason">Rejection Reason</Label>
              <Textarea
                id="reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., Invalid ID number, Incomplete information, etc."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejection(false)}>
              Cancel
            </Button>
            <Button onClick={handleReject} variant="destructive">
              Reject Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminRegistrations;