
import React from 'react';
import CustomerNavigation from '@/components/customer/CustomerNavigation';
import { mockTips, formatCurrency, formatDateTime } from '@/data/mockData';

const CustomerHistory = () => {
  // Filter tips for the current customer (using c1 as the logged-in customer)
  const customerTips = mockTips.filter(tip => tip.customerId === 'c1');
  
  // Calculate total tipped amount
  const totalTipped = customerTips.reduce((sum, tip) => sum + tip.amount, 0);
  
  return (
    <div>
      <h1 className="text-2xl font-bold text-nogada-dark mb-4">Tip History</h1>
      
      <CustomerNavigation />
      
      <div className="mb-6 nogada-card">
        <div className="text-center">
          <div className="text-sm text-gray-500 mb-1">Total Amount Tipped</div>
          <div className="text-2xl font-bold text-nogada-dark">
            {formatCurrency(totalTipped)}
          </div>
        </div>
      </div>
      
      <div className="nogada-card">
        <h2 className="font-semibold mb-4">Your Tips</h2>
        
        {customerTips.length > 0 ? (
          <div className="space-y-4">
            {customerTips.map(tip => (
              <div
                key={tip.id}
                className="border-b border-gray-100 last:border-0 pb-4 last:pb-0"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{formatCurrency(tip.amount)}</div>
                    <div className="text-sm">To: {tip.guardName}</div>
                    <div className="text-xs text-gray-500">
                      {formatDateTime(tip.timestamp)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">{tip.location}</div>
                    <div className="text-xs text-gray-400">
                      Transaction ID: {tip.id}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-6 text-gray-500">
            <p>You haven't made any tips yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerHistory;
