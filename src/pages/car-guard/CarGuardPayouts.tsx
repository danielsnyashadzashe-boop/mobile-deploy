
import React, { useState } from 'react';
import BottomNavigation from '@/components/car-guard/BottomNavigation';
import { mockCarGuards, mockPayouts, formatCurrency, formatDate } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const CarGuardPayouts = () => {
  // Using the first mock guard as the logged-in guard
  const guard = mockCarGuards[0];
  
  // Get payouts for this guard
  const guardPayouts = mockPayouts.filter(payout => payout.guardId === 'g1');
  
  // Calculate progress percentage towards payout threshold
  const progressPercentage = (guard.balance / guard.minPayoutThreshold) * 100;
  
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutReason, setPayoutReason] = useState('');
  const { toast } = useToast();

  const handleRequestPayout = () => {
    const amount = parseFloat(payoutAmount);
    
    if (amount <= 0 || amount > guard.balance) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount within your available balance.",
        variant: "destructive"
      });
      return;
    }
    
    // In a real app, this would make an API call
    toast({
      title: "Payout Requested",
      description: `Your payout request for ${formatCurrency(amount)} has been submitted and is awaiting approval.`,
    });
    
    setPayoutDialogOpen(false);
    setPayoutAmount('');
    setPayoutReason('');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 flex-1 overflow-y-auto">
        <h1 className="text-xl font-bold text-tippa-dark mb-4">Payouts</h1>
        
        <div className="bg-white rounded-lg shadow-md p-4 mb-6 border border-tippa-primary/20">
          <div className="text-center mb-2">
            <div className="text-sm text-tippa-neutral">Current Balance</div>
            <div className="text-2xl font-bold text-tippa-dark">
              {formatCurrency(guard.balance)}
            </div>
          </div>
          
          <div className="mt-3">
            <div className="flex justify-between text-sm mb-1">
              <span>Payout Progress</span>
              <span>
                {formatCurrency(guard.balance)} / {formatCurrency(guard.minPayoutThreshold)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-tippa-primary rounded-full h-2"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <div className="text-xs text-tippa-neutral mt-1 text-center">
              Next Payout: Voucher when {formatCurrency(guard.minPayoutThreshold)} reached
            </div>
          </div>
          
          <Dialog open={payoutDialogOpen} onOpenChange={setPayoutDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="w-full mt-4 bg-tippa-primary text-tippa-accent hover:bg-tippa-secondary" 
                disabled={guard.balance < 50}
              >
                Request Payout
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request Payout</DialogTitle>
                <DialogDescription>
                  Request a payout from your available balance. Your request will be reviewed by an administrator.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label>Available Balance</Label>
                  <p className="text-lg font-semibold">{formatCurrency(guard.balance)}</p>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="payout-amount">Payout Amount</Label>
                  <Input
                    id="payout-amount"
                    type="number"
                    placeholder="Enter amount"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    max={guard.balance}
                    min="1"
                    step="0.01"
                    className="focus:ring-tippa-primary"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="payout-reason">Reason (Optional)</Label>
                  <Input
                    id="payout-reason"
                    placeholder="e.g., Weekly payout, Emergency"
                    value={payoutReason}
                    onChange={(e) => setPayoutReason(e.target.value)}
                    className="focus:ring-tippa-primary"
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setPayoutDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleRequestPayout}
                  className="bg-tippa-primary text-tippa-accent hover:bg-tippa-secondary"
                >
                  Submit Request
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="mb-4">
          <h2 className="text-md font-semibold">Past Vouchers</h2>
        </div>
        
        {guardPayouts.length > 0 ? (
          <div className="space-y-3">
            {guardPayouts.map(payout => (
              <div
                key={payout.id}
                className="bg-white rounded-lg shadow-sm border border-tippa-primary/10 p-3"
              >
                <div className="flex justify-between">
                  <div>
                    <div className="font-medium">{formatCurrency(payout.amount)}</div>
                    <div className="text-xs text-tippa-neutral">
                      Issued: {formatDate(payout.issueDate)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">
                      <span className={`px-2 py-1 rounded text-xs ${
                        payout.status === 'Redeemed' 
                          ? 'bg-green-100 text-green-800'
                          : payout.status === 'Issued'
                          ? 'bg-tippa-light text-tippa-accent'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {payout.status}
                      </span>
                    </div>
                    <div className="text-xs mt-1">Voucher: {payout.voucherCode}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-6 text-tippa-neutral">
            <div className="text-xl mb-2">No payouts yet</div>
            <p className="text-sm">When your balance reaches {formatCurrency(guard.minPayoutThreshold)}, you'll receive a voucher</p>
          </div>
        )}
        
        <div className="mt-6 text-sm text-center text-tippa-neutral">
          <p>Vouchers can be redeemed at partner locations or via your allocated bank card.</p>
        </div>
      </div>
      
      <BottomNavigation />
    </div>
  );
};

export default CarGuardPayouts;
