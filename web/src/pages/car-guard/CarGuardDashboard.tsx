
import React, { useState, useEffect } from 'react';
import BottomNavigation from '@/components/car-guard/BottomNavigation';
import QRCodeDisplay from '@/components/car-guard/QRCodeDisplay';
import AirtimePurchaseModal from '@/components/car-guard/AirtimePurchaseModal';
import ElectricityPurchaseModal from '@/components/car-guard/ElectricityPurchaseModal';
import { mockCarGuards, mockTips, formatCurrency, formatTime, mockTransactions } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Zap, Bolt } from 'lucide-react';
import { toast } from 'sonner';

const CarGuardDashboard = () => {
  // Using the first mock guard as the logged-in guard
  const guard = mockCarGuards[0];
  
  // Get last tip
  const guardTips = mockTips.filter(tip => tip.guardId === 'g1');
  const lastTip = guardTips.length > 0 ? guardTips[0] : null;
  
  // Get guard transactions
  const guardTransactions = mockTransactions.filter(t => t.guardId === 'g1');
  
  // Calculate today's tips
  const today = new Date().toISOString().split('T')[0];
  const todayTips = guardTips
    .filter(tip => tip.timestamp.startsWith(today))
    .reduce((sum, tip) => sum + tip.amount, 0);
  
  // Calculate progress percentage towards payout threshold
  const progressPercentage = (guard.balance / guard.minPayoutThreshold) * 100;

  // States for service dialogs
  const [isAirtimeDialogOpen, setIsAirtimeDialogOpen] = useState(false);
  const [isElectricityDialogOpen, setIsElectricityDialogOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const handleAirtimePurchase = (data: any) => {
    // In a real app, this would call an API to purchase airtime
    console.log('Airtime purchase:', data);
    toast.success(`R${data.amount} airtime purchased successfully for ${data.phoneNumber}`);
    setIsAirtimeDialogOpen(false);
  };

  const handleElectricityPurchase = (data: any) => {
    // In a real app, this would call an API to purchase electricity
    console.log('Electricity purchase:', data);
    toast.success(`R${data.amount} electricity token purchased successfully. Token will be sent via SMS.`);
    setIsElectricityDialogOpen(false);
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 flex-1 overflow-y-auto">
        <h1 className="text-xl font-bold text-nogada-dark mb-4">Welcome, {guard.name}</h1>
        
        <QRCodeDisplay
          qrCode={guard.qrCode}
          guardName={guard.name}
          guardId={guard.guardId}
        />
        
        <div className="mt-6 bg-white rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-500 mb-1">Current Balance</div>
          <div className="text-2xl font-bold text-nogada-dark">
            {formatCurrency(guard.balance)}
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
                className="bg-nogada-primary rounded-full h-2"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Next Payout: Voucher when {formatCurrency(guard.minPayoutThreshold)} reached
            </div>
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-sm text-gray-500 mb-1">Tips Today</div>
            <div className="text-lg font-semibold text-nogada-dark">
              {formatCurrency(todayTips)}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-sm text-gray-500 mb-1">Last Tip Received</div>
            {lastTip ? (
              <div>
                <div className="text-lg font-semibold text-nogada-dark">
                  {formatCurrency(lastTip.amount)}
                </div>
                <div className="text-xs text-gray-500">
                  at {formatTime(lastTip.timestamp)}
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-400">No tips yet</div>
            )}
          </div>
        </div>
        
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-3">Services</h2>
          <div className="grid grid-cols-2 gap-4">
            <Button 
              onClick={() => setIsAirtimeDialogOpen(true)}
              variant="outline" 
              className="py-6 flex flex-col items-center justify-center text-nogada-dark border-gray-200 hover:bg-gray-50"
            >
              <Zap className="h-8 w-8 text-nogada-primary mb-2" />
              <span>Buy Airtime</span>
            </Button>
            
            <Button 
              onClick={() => setIsElectricityDialogOpen(true)}
              variant="outline" 
              className="py-6 flex flex-col items-center justify-center text-nogada-dark border-gray-200 hover:bg-gray-50"
            >
              <Bolt className="h-8 w-8 text-nogada-primary mb-2" />
              <span>Buy Electricity</span>
            </Button>
          </div>
        </div>
        
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-3">Recent Transactions</h2>
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {guardTransactions.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {guardTransactions.slice(0, 5).map(transaction => {
                  const isInflow = transaction.amount > 0;
                  return (
                    <div key={transaction.id} className="px-4 py-3 flex items-center justify-between">
                      <div>
                        <div className="font-medium">{transaction.description}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(transaction.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                      <div className={`font-semibold ${isInflow ? 'text-green-600' : 'text-red-600'}`}>
                        {isInflow ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500">No transactions yet</div>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile-Optimized Airtime Purchase Modal */}
      <AirtimePurchaseModal
        isOpen={isAirtimeDialogOpen}
        onClose={() => setIsAirtimeDialogOpen(false)}
        onPurchase={handleAirtimePurchase}
        balance={guard.balance}
        isMobile={isMobile}
      />
      
      {/* Mobile-Optimized Electricity Purchase Modal */}
      <ElectricityPurchaseModal
        isOpen={isElectricityDialogOpen}
        onClose={() => setIsElectricityDialogOpen(false)}
        onPurchase={handleElectricityPurchase}
        balance={guard.balance}
        isMobile={isMobile}
      />
      
      <BottomNavigation />
    </div>
  );
};

export default CarGuardDashboard;
