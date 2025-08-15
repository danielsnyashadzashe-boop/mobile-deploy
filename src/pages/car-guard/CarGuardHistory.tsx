
import React from 'react';
import BottomNavigation from '@/components/car-guard/BottomNavigation';
import { mockTips, formatCurrency, formatDate, formatTime } from '@/data/mockData';

const CarGuardHistory = () => {
  // Filter tips for the current guard (using g1 as the logged-in guard)
  const guardTips = mockTips.filter(tip => tip.guardId === 'g1');
  
  // Calculate total tips this week
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  const weeklyTotal = guardTips
    .filter(tip => new Date(tip.timestamp) >= oneWeekAgo)
    .reduce((sum, tip) => sum + tip.amount, 0);
  
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 flex-1 overflow-y-auto">
        <h1 className="text-xl font-bold text-nogada-dark mb-4">Tip History</h1>
        
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="text-sm text-gray-500 mb-1">Total Tips This Week</div>
          <div className="text-2xl font-bold text-nogada-dark">
            {formatCurrency(weeklyTotal)}
          </div>
        </div>
        
        <div className="mb-2">
          <h2 className="text-md font-semibold">Recent Tips</h2>
        </div>
        
        {guardTips.length > 0 ? (
          <div className="space-y-3">
            {guardTips.map(tip => (
              <div
                key={tip.id}
                className="bg-white rounded-lg shadow-sm border border-gray-100 p-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{formatCurrency(tip.amount)}</div>
                    <div className="text-xs text-gray-500">
                      {formatDate(tip.timestamp)} at {formatTime(tip.timestamp)}
                    </div>
                  </div>
                  <div className="text-sm text-right">
                    <div className="text-nogada-neutral">Tip #{tip.id}</div>
                    {tip.customerName && (
                      <div className="text-xs text-gray-500">From: {tip.customerName}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-6 text-gray-500">
            <div className="text-xl mb-2">No tips yet</div>
            <p className="text-sm">When you receive tips, they'll appear here</p>
          </div>
        )}
      </div>
      
      <BottomNavigation />
    </div>
  );
};

export default CarGuardHistory;
