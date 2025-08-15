
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import CustomerNavigation from '@/components/customer/CustomerNavigation';
import { mockCustomers, mockTips, formatCurrency, formatDateTime } from '@/data/mockData';

const CustomerDashboard = () => {
  // Using first mock customer as the logged-in customer
  const customer = mockCustomers[0];
  
  // Get recent tips for this customer
  const customerTips = mockTips
    .filter(tip => tip.customerId === 'c1')
    .slice(0, 3);
  
  // State for fund loading
  const [loadAmount, setLoadAmount] = useState('');
  const [showLoadFunds, setShowLoadFunds] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  
  const handleLoadFunds = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would trigger payment gateway
    alert(`Loading R${loadAmount} to your wallet`);
    setShowLoadFunds(false);
  };
  
  const handleScanQR = () => {
    // In a real app, this would activate the camera for QR scanning
    // For this mockup, we'll just simulate a redirect to the tipping page
    setShowQRScanner(true);
    
    // Simulate QR scan after 2 seconds
    setTimeout(() => {
      setShowQRScanner(false);
      window.location.href = '/customer/tip/g1';
    }, 2000);
  };
  
  return (
    <div>
      <h1 className="text-2xl font-bold text-nogada-dark mb-4">My Dashboard</h1>
      
      <CustomerNavigation />
      
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <div className="nogada-card mb-6">
            <div className="text-center mb-4">
              <div className="text-sm text-gray-500">Your Wallet Balance</div>
              <div className="text-3xl font-bold text-nogada-dark">
                {formatCurrency(customer.walletBalance)}
              </div>
            </div>
            
            <div className="space-y-3">
              <button 
                onClick={() => setShowLoadFunds(!showLoadFunds)}
                className="nogada-btn-secondary w-full"
              >
                {showLoadFunds ? 'Cancel' : 'Load Funds / Top-Up Wallet'}
              </button>
              
              <button 
                onClick={handleScanQR}
                className="nogada-btn-primary w-full"
              >
                Scan QR to Tip
              </button>
            </div>
            
            {showLoadFunds && (
              <div className="mt-4 p-4 border border-gray-200 rounded-md bg-gray-50">
                <h3 className="font-medium mb-2">Load Funds to Your Wallet</h3>
                <form onSubmit={handleLoadFunds}>
                  <div className="mb-3">
                    <label htmlFor="amount" className="block text-sm mb-1">
                      Amount (R)
                    </label>
                    <input
                      id="amount"
                      type="number"
                      min="10"
                      step="10"
                      value={loadAmount}
                      onChange={(e) => setLoadAmount(e.target.value)}
                      className="nogada-input"
                      placeholder="Enter amount to load"
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="block text-sm mb-1">
                      Payment Method
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="flex items-center bg-white p-2 border border-gray-200 rounded cursor-pointer">
                        <input 
                          type="radio" 
                          name="paymentMethod"
                          className="mr-2" 
                          defaultChecked 
                        />
                        <span className="text-sm">Credit/Debit Card</span>
                      </label>
                      <label className="flex items-center bg-white p-2 border border-gray-200 rounded cursor-pointer">
                        <input 
                          type="radio" 
                          name="paymentMethod"
                          className="mr-2" 
                        />
                        <span className="text-sm">Instant EFT</span>
                      </label>
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    className="nogada-btn-primary w-full"
                  >
                    Proceed to Payment
                  </button>
                </form>
              </div>
            )}
            
            {showQRScanner && (
              <div className="mt-4 p-4 border border-gray-200 rounded-md bg-gray-50 text-center">
                <div className="h-48 bg-gray-200 flex items-center justify-center mb-3">
                  <div className="text-gray-500">Scanning QR Code...</div>
                </div>
                <div className="text-sm text-gray-600">
                  Position the QR code within the scanner frame
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div>
          <div className="nogada-card">
            <h2 className="font-semibold mb-4">Recent Tip Activity</h2>
            
            {customerTips.length > 0 ? (
              <div className="space-y-3">
                {customerTips.map(tip => (
                  <div
                    key={tip.id}
                    className="border-b border-gray-100 last:border-0 pb-3 last:pb-0"
                  >
                    <div className="flex justify-between">
                      <div>
                        <div className="font-medium">{formatCurrency(tip.amount)}</div>
                        <div className="text-xs text-gray-500">
                          To: {tip.guardName}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">
                          {tip.location}
                        </div>
                        <div className="text-xs text-gray-400">
                          {formatDateTime(tip.timestamp)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-6 text-gray-500">
                <p className="text-sm">No tip activity yet</p>
              </div>
            )}
            
            <div className="mt-4 text-center">
              <Link to="/customer/history" className="nogada-link text-sm">
                View All Tip History
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-3">Quick Tips</h2>
        <div className="nogada-card">
          <div className="text-sm text-gray-600">
            <p className="mb-2">
              <strong>How it works:</strong> Scan a car guard's QR code to tip them directly through Nogada.
            </p>
            <p className="mb-2">
              <strong>Load funds:</strong> Keep your wallet topped up to make tipping quick and easy.
            </p>
            <p>
              <strong>Safety:</strong> All transactions are secure and you'll receive a confirmation for each tip.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
