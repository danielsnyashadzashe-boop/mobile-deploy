import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import StatsCard from '@/components/admin/StatsCard';
import FilterSection, { FilterValues } from '@/components/admin/FilterSection';
import TipVolumeChart from '@/components/admin/charts/TipVolumeChart';
import LocationPerformanceChart from '@/components/admin/charts/LocationPerformanceChart';
import { 
  mockTips, 
  mockCarGuards,
  mockTransactions,
  mockLocations,
  formatCurrency,
  formatDateTime
} from '@/data/mockData';
import { Users, Clock, ArrowRight, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  
  // Define default filter values
  const defaultFilters: FilterValues = {
    location: 'all',
    dateRange: 'all',
    transactionTypes: [],
    guardStatus: 'all',
    searchTerm: ''
  };
  
  // State for filters
  const [filters, setFilters] = useState<FilterValues>(defaultFilters);
  
  // Reset filters
  const resetFilters = () => {
    setFilters(defaultFilters);
  };
  
  // Apply filters to data
  const filteredTransactions = useMemo(() => {
    return mockTransactions.filter(transaction => {
      // Filter by location
      if (filters.location && filters.location !== 'all' && transaction.locationId !== filters.location) {
        return false;
      }
      
      // Filter by transaction type
      if (filters.transactionTypes.length > 0 && !filters.transactionTypes.includes(transaction.type)) {
        return false;
      }
      
      // Filter by date range
      if (filters.dateRange !== 'all') {
        const txDate = new Date(transaction.timestamp);
        const today = new Date();
        
        if (filters.dateRange === 'today') {
          if (
            txDate.getDate() !== today.getDate() ||
            txDate.getMonth() !== today.getMonth() ||
            txDate.getFullYear() !== today.getFullYear()
          ) {
            return false;
          }
        } else if (filters.dateRange === 'week') {
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          if (txDate < oneWeekAgo) {
            return false;
          }
        } else if (filters.dateRange === 'month') {
          const oneMonthAgo = new Date();
          oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
          if (txDate < oneMonthAgo) {
            return false;
          }
        }
      }
      
      // Filter by search term
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const hasMatch = 
          transaction.guardName?.toLowerCase().includes(searchLower) ||
          transaction.id.toLowerCase().includes(searchLower) ||
          transaction.location?.toLowerCase().includes(searchLower);
          
        if (!hasMatch) {
          return false;
        }
      }
      
      return true;
    });
  }, [filters]);
  
  // Apply filters to guards
  const filteredGuards = useMemo(() => {
    return mockCarGuards.filter(guard => {
      // Filter by location
      if (filters.location && filters.location !== 'all' && guard.locationId !== filters.location) {
        return false;
      }
      
      // Filter by guard status
      if (filters.guardStatus === 'eligible' && guard.balance < guard.minPayoutThreshold) {
        return false;
      } else if (filters.guardStatus === 'ineligible' && guard.balance >= guard.minPayoutThreshold) {
        return false;
      }
      
      // Filter by search term
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const hasMatch = 
          guard.name.toLowerCase().includes(searchLower) ||
          guard.guardId.toLowerCase().includes(searchLower) ||
          guard.location.toLowerCase().includes(searchLower);
          
        if (!hasMatch) {
          return false;
        }
      }
      
      return true;
    });
  }, [filters]);
  
  // Calculate filtered metrics for the dashboard
  const totalTips = useMemo(() => {
    const tipsTransactions = filteredTransactions.filter(tx => tx.type === 'tip');
    return tipsTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  }, [filteredTransactions]);
  
  const avgTipAmount = useMemo(() => {
    const tipsTransactions = filteredTransactions.filter(tx => tx.type === 'tip');
    return tipsTransactions.length > 0 ? totalTips / tipsTransactions.length : 0;
  }, [filteredTransactions, totalTips]);
  
  const activeGuards = filteredGuards.length;
  
  const pendingPayouts = filteredGuards.filter(g => g.balance >= g.minPayoutThreshold).length;
  
  // Navigation handlers
  const navigateToTransactions = () => {
    navigate('/admin/transactions');
  };
  
  const navigateToGuards = () => {
    navigate('/admin/guards');
  };

  // View transaction details
  const handleViewTransaction = (id: string) => {
    setSelectedTransactionId(id);
    setIsTransactionDialogOpen(true);
  };
  
  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-nogada-dark">Dashboard</h1>
        <div className="text-sm text-gray-500 mt-1 md:mt-0">
          Last updated: {new Date().toLocaleString('en-ZA')}
        </div>
      </div>
      
      {/* Filters Section */}
      <FilterSection 
        filters={filters}
        onFilterChange={setFilters}
        onReset={resetFilters}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title="Total Tips (This Month)"
          value={formatCurrency(totalTips)}
          change="12.5%"
          positive={true}
          icon={<ArrowRight className="text-nogada-primary" size={24} />}
        />
        
        <StatsCard
          title="Average Tip Amount"
          value={formatCurrency(avgTipAmount)}
          change="3.2%"
          positive={true}
          icon={<ArrowDown className="text-nogada-primary" size={24} />}
        />
        
        <StatsCard
          title="Active Car Guards"
          value={activeGuards.toString()}
          icon={<Users className="text-nogada-primary" size={24} />}
        />
        
        <StatsCard
          title="Pending Payouts"
          value={pendingPayouts.toString()}
          icon={<Clock className="text-nogada-primary" size={24} />}
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="nogada-card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold">Tip Volume (Last 7 Days)</h2>
            {filters.location && filters.location !== 'all' && (
              <div className="text-sm text-nogada-primary">
                {mockLocations.find(l => l.id === filters.location)?.name || 'All Locations'}
              </div>
            )}
          </div>
          
          <TipVolumeChart locationFilter={filters.location} />
        </div>
        
        <div className="nogada-card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold">Top Performing Locations</h2>
            {filters.transactionTypes.length > 0 && (
              <div className="text-sm text-nogada-primary">
                Filtered by {filters.transactionTypes.join(', ')}
              </div>
            )}
          </div>
          
          <LocationPerformanceChart transactionTypes={filters.transactionTypes} />
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="nogada-card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold">Recent Transactions</h2>
            <Button 
              variant="link" 
              className="text-sm nogada-link flex items-center"
              onClick={navigateToTransactions}
            >
              View All <ArrowRight className="ml-1" size={14} />
            </Button>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Guard</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.slice(0, 5).map(transaction => {
                  // Determine transaction display style
                  const isNegative = ['payout', 'withdrawal', 'airtime', 'electricity'].includes(transaction.type);
                  const amountClass = isNegative ? 'text-red-600' : 'text-green-600';
                  
                  return (
                    <TableRow key={transaction.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleViewTransaction(transaction.id)}>
                      <TableCell>{new Date(transaction.timestamp).toLocaleDateString('en-ZA')}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize bg-gray-100">
                          {transaction.type}
                        </span>
                      </TableCell>
                      <TableCell>{transaction.guardName || 'System'}</TableCell>
                      <TableCell>{transaction.location || 'N/A'}</TableCell>
                      <TableCell className={`text-right ${amountClass}`}>
                        {formatCurrency(Math.abs(transaction.amount))}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredTransactions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                      No transactions match your filters
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
        
        <div className="nogada-card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold">Guards Eligible for Payout</h2>
            <Button 
              variant="link" 
              className="text-sm nogada-link flex items-center"
              onClick={navigateToGuards}
            >
              View All <ArrowRight className="ml-1" size={14} />
            </Button>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Guard ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGuards
                  .filter(guard => guard.balance >= guard.minPayoutThreshold)
                  .slice(0, 5)
                  .map(guard => (
                    <TableRow 
                      key={guard.id} 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => navigate(`/admin/guards?id=${guard.id}`)}
                    >
                      <TableCell>{guard.guardId}</TableCell>
                      <TableCell>{guard.name}</TableCell>
                      <TableCell>{guard.location}</TableCell>
                      <TableCell className="text-right">{formatCurrency(guard.balance)}</TableCell>
                    </TableRow>
                  ))}
                {filteredGuards.filter(g => g.balance >= g.minPayoutThreshold).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                      No guards eligible for payout
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
      
      {/* Transaction Details Dialog */}
      <Dialog open={isTransactionDialogOpen} onOpenChange={setIsTransactionDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
          </DialogHeader>
          {selectedTransactionId && (
            <div className="space-y-4">
              {(() => {
                const transaction = mockTransactions.find(t => t.id === selectedTransactionId) ||
                                   mockTips.find(t => t.id === selectedTransactionId);
                
                return transaction ? (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-sm font-medium">Transaction ID:</div>
                    <div>{transaction.id}</div>
                    
                    <div className="text-sm font-medium">Date & Time:</div>
                    <div>{formatDateTime(transaction.timestamp)}</div>
                    
                    <div className="text-sm font-medium">Type:</div>
                    <div className="capitalize">
                      {'type' in transaction ? transaction.type : 'tip'}
                    </div>
                    
                    <div className="text-sm font-medium">Amount:</div>
                    <div>{formatCurrency('amount' in transaction ? Math.abs(transaction.amount) : 0)}</div>
                    
                    <div className="text-sm font-medium">Guard:</div>
                    <div>{transaction.guardName || 'N/A'}</div>
                    
                    <div className="text-sm font-medium">Guard ID:</div>
                    <div>{transaction.guardId || 'N/A'}</div>
                    
                    <div className="text-sm font-medium">Location:</div>
                    <div>{transaction.location || 'N/A'}</div>
                    
                    {'customerName' in transaction && (
                      <>
                        <div className="text-sm font-medium">Customer:</div>
                        <div>{transaction.customerName || 'Anonymous'}</div>
                      </>
                    )}
                    
                    {'description' in transaction && (
                      <>
                        <div className="text-sm font-medium">Description:</div>
                        <div>{transaction.description}</div>
                      </>
                    )}
                    
                    {'reference' in transaction && transaction.reference && (
                      <>
                        <div className="text-sm font-medium">Reference:</div>
                        <div>{transaction.reference}</div>
                      </>
                    )}
                  </div>
                ) : <p>Transaction not found</p>;
              })()}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsTransactionDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
