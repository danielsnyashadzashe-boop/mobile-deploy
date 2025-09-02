
import React, { useState } from 'react';
import { mockTransactions, formatCurrency, formatDateTime } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { toast } from "sonner";

const AdminTransactions = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [dateRange, setDateRange] = useState('all');
  const [transactionType, setTransactionType] = useState('all');
  
  // Get unique locations for filter
  const locations = Array.from(
    new Set(mockTransactions.filter(t => t.location).map(t => t.location))
  );
  
  // Filter transactions based on filters
  const filteredTransactions = mockTransactions.filter(transaction => {
    const matchesSearch = 
      (transaction.guardName && transaction.guardName.toLowerCase().includes(searchTerm.toLowerCase())) || 
      (transaction.paymentMethod && transaction.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase())) ||
      transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLocation = !selectedLocation || transaction.location === selectedLocation;
    
    const matchesType = transactionType === 'all' || transaction.type === transactionType;
    
    // Filter by date range (simplified for mockup)
    const transactionDate = new Date(transaction.timestamp);
    const now = new Date();
    let dateMatch = true;
    
    if (dateRange === 'today') {
      dateMatch = transactionDate.toDateString() === now.toDateString();
    } else if (dateRange === 'week') {
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      dateMatch = transactionDate >= weekAgo;
    } else if (dateRange === 'month') {
      const monthAgo = new Date(now);
      monthAgo.setMonth(now.getMonth() - 1);
      dateMatch = transactionDate >= monthAgo;
    }
    
    return matchesSearch && matchesLocation && dateMatch && matchesType;
  });
  
  // Calculate totals
  const totalInflows = filteredTransactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalOutflows = filteredTransactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + t.amount, 0);
  
  const netAmount = totalInflows + totalOutflows;
  
  const handleExportData = () => {
    // In a real app, this would generate and download a CSV/Excel file
    console.log('Exporting data:', filteredTransactions);
    toast.success("Transaction data exported successfully");
  };

  const handlePagination = (direction: 'prev' | 'next') => {
    // In a real app, this would handle pagination
    toast.info(`Navigating to ${direction === 'prev' ? 'previous' : 'next'} page`);
  };
  
  // Helper function to determine transaction style
  const getTransactionStyle = (transaction: typeof mockTransactions[0]) => {
    if (transaction.amount > 0) {
      return {
        amountClass: 'text-green-600',
        typeLabel: 'Inflow',
        typeClass: 'bg-green-100 text-green-800'
      };
    } else {
      return {
        amountClass: 'text-red-600',
        typeLabel: 'Outflow',
        typeClass: 'bg-red-100 text-red-800'
      };
    }
  };
  
  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-nogada-dark">Transaction Management</h1>
        <Button 
          className="nogada-btn-secondary mt-2 md:mt-0"
          onClick={handleExportData}
        >
          Export Data
        </Button>
      </div>
      
      <div className="nogada-card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search transactions..."
              className="nogada-input"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Filter by Location</label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="nogada-input"
            >
              <option value="">All Locations</option>
              {locations.map(location => location && (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="nogada-input"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Transaction Type</label>
            <select
              value={transactionType}
              onChange={(e) => setTransactionType(e.target.value)}
              className="nogada-input"
            >
              <option value="all">All Types</option>
              <option value="tip">Tips</option>
              <option value="payout">Payouts</option>
              <option value="airtime">Airtime</option>
              <option value="electricity">Electricity</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="nogada-card">
          <div className="text-sm text-gray-500 mb-1">Total Inflows</div>
          <div className="text-xl font-bold text-green-600">{formatCurrency(totalInflows)}</div>
        </div>
        
        <div className="nogada-card">
          <div className="text-sm text-gray-500 mb-1">Total Outflows</div>
          <div className="text-xl font-bold text-red-600">{formatCurrency(Math.abs(totalOutflows))}</div>
        </div>
        
        <div className="nogada-card">
          <div className="text-sm text-gray-500 mb-1">Net Amount</div>
          <div className={`text-xl font-bold ${netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(netAmount)}
          </div>
        </div>
      </div>
      
      <div className="nogada-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Transaction ID</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Date & Time</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Type</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Description</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Guard</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Payment Method</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Reference</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map(transaction => {
                const style = getTransactionStyle(transaction);
                
                return (
                  <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">{transaction.id}</td>
                    <td className="py-3 px-4">{formatDateTime(transaction.timestamp)}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-1 rounded ${style.typeClass}`}>
                        {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4">{transaction.description}</td>
                    <td className="py-3 px-4">{transaction.guardName || 'N/A'}</td>
                    <td className="py-3 px-4">{transaction.paymentMethod || 'N/A'}</td>
                    <td className="py-3 px-4">{transaction.reference || 'N/A'}</td>
                    <td className={`py-3 px-4 text-right font-medium ${style.amountClass}`}>
                      {formatCurrency(Math.abs(transaction.amount))}
                      <span className="ml-1 text-xs text-gray-500">{style.typeLabel}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        <div className="flex justify-between items-center mt-4 px-4 py-2 border-t border-gray-100">
          <div className="text-sm text-gray-500">
            Showing {filteredTransactions.length} of {mockTransactions.length} transactions
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="px-3 py-1"
              onClick={() => handlePagination('prev')}
            >
              Previous
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              className="px-3 py-1"
            >
              1
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="px-3 py-1"
              onClick={() => handlePagination('next')}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminTransactions;
