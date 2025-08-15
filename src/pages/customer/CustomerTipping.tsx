
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { mockCarGuards, mockCustomers, formatCurrency } from '@/data/mockData';

const CustomerTipping = () => {
  const { guardId } = useParams<{ guardId: string }>();
  const navigate = useNavigate();
  
  // Get guard and customer data
  const guard = mockCarGuards.find(g => g.id === guardId);
  const customer = mockCustomers[0]; // Using first customer as logged in
  
  // State for tip amount
  const [tipAmount, setTipAmount] = useState<string>('');
  const [insufficientFunds, setInsufficientFunds] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);
  
  // Predefined tip amounts
  const suggestedAmounts = [5, 10, 20, 50];
  
  useEffect(() => {
    // Check if guard exists
    if (!guard) {
      navigate('/customer/dashboard');
    }
  }, [guard, navigate]);
  
  const handleSelectAmount = (amount: number) => {
    setTipAmount(amount.toString());
    setInsufficientFunds(amount > customer.walletBalance);
  };
  
  const handleTipAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTipAmount(value);
    setInsufficientFunds(parseFloat(value) > customer.walletBalance);
  };
  
  const handleConfirmTip = () => {
    if (!tipAmount || isNaN(parseFloat(tipAmount))) {
      return;
    }
    
    if (parseFloat(tipAmount) > customer.walletBalance) {
      setInsufficientFunds(true);
      return;
    }
    
    setIsProcessing(true);
    
    // Simulate processing
    setTimeout(() => {
      setIsProcessing(false);
      setIsConfirmed(true);
    }, 1500);
  };
  
  const handleDone = () => {
    navigate('/customer/dashboard');
  };
  
  const handleTipAnother = () => {
    navigate('/customer/dashboard');
  };
  
  if (!guard) {
    return null;
  }
  
  if (isConfirmed) {
    return (
      <div className="max-w-md mx-auto">
        <div className="nogada-card text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-nogada-dark mb-2">Thank You!</h2>
          <p className="mb-4">
            You've successfully tipped {formatCurrency(parseFloat(tipAmount))} to {guard.name}.
          </p>
          
          <div className="flex flex-col space-y-3 mt-6">
            <button
              onClick={handleDone}
              className="nogada-btn-primary"
            >
              Done
            </button>
            <button
              onClick={handleTipAnother}
              className="nogada-btn-secondary"
            >
              Tip Another Guard
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-nogada-dark text-center mb-6">Tip a Car Guard</h1>
      
      <div className="nogada-card">
        <div className="text-center mb-6">
          <div className="text-sm text-gray-500 mb-1">You are tipping</div>
          <div className="font-bold text-lg">{guard.name}</div>
          <div className="text-sm text-gray-500 mb-1">{guard.location}</div>
          <div className="text-xs text-gray-400">Guard ID: {guard.guardId}</div>
        </div>
        
        <div className="mb-6">
          <div className="text-sm font-medium mb-2">Select Tip Amount (R)</div>
          <div className="grid grid-cols-4 gap-2 mb-3">
            {suggestedAmounts.map(amount => (
              <button
                key={amount}
                onClick={() => handleSelectAmount(amount)}
                className={`py-2 rounded-md text-center ${
                  tipAmount === amount.toString()
                    ? 'bg-nogada-primary text-white'
                    : 'bg-nogada-light text-nogada-dark'
                }`}
              >
                R{amount}
              </button>
            ))}
          </div>
          
          <div className="relative">
            <input
              type="number"
              value={tipAmount}
              onChange={handleTipAmountChange}
              className="nogada-input pl-8"
              placeholder="Custom amount"
            />
            <div className="absolute top-0 left-0 h-full flex items-center pl-3 text-gray-500">
              R
            </div>
          </div>
          
          <div className="flex justify-between text-sm mt-2">
            <div>Your Wallet Balance:</div>
            <div className="font-medium">{formatCurrency(customer.walletBalance)}</div>
          </div>
          
          {insufficientFunds && (
            <div className="mt-2 text-sm text-red-600">
              Insufficient funds. Please load your wallet or reduce tip amount.
            </div>
          )}
        </div>
        
        <button
          onClick={handleConfirmTip}
          disabled={!tipAmount || isNaN(parseFloat(tipAmount)) || parseFloat(tipAmount) <= 0 || insufficientFunds || isProcessing}
          className={`w-full py-3 rounded-md font-medium transition-colors ${
            !tipAmount || isNaN(parseFloat(tipAmount)) || parseFloat(tipAmount) <= 0 || insufficientFunds || isProcessing
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-nogada-primary text-white hover:bg-opacity-90'
          }`}
        >
          {isProcessing ? 'Processing...' : `Pay ${tipAmount ? formatCurrency(parseFloat(tipAmount)) : 'R0.00'}`}
        </button>
      </div>
      
      <div className="text-center mt-6">
        <button
          onClick={() => navigate('/customer/dashboard')}
          className="text-sm nogada-link"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default CustomerTipping;
