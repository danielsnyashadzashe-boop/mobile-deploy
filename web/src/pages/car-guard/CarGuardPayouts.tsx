import React, { useState, useMemo, useEffect } from 'react';
import BottomNavigation from '@/components/car-guard/BottomNavigation';
import { mockCarGuards, mockPayouts, formatCurrency, formatDate, getTransactionsByGuardId } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar, 
  Clock, 
  TrendingUp, 
  Wallet, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Gift,
  Loader2,
  Settings,
  Filter,
  Search,
  CalendarIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, addDays, format, subDays } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';

const CarGuardPayouts = () => {
  // Using the first mock guard as the logged-in guard
  const guard = mockCarGuards[0];
  
  // Get payouts for this guard
  const guardPayouts = mockPayouts.filter(payout => payout.guardId === 'g1');
  
  // Get all transactions for earnings calculation
  const guardTransactions = getTransactionsByGuardId('g1');
  
  // Calculate progress percentage towards payout threshold
  const progressPercentage = (guard.balance / guard.minPayoutThreshold) * 100;
  
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutReason, setPayoutReason] = useState('');
  const [payoutFrequency, setPayoutFrequency] = useState('weekly');
  const [isLoading, setIsLoading] = useState(false);
  
  // Filter states
  const [dateFilter, setDateFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [customDateRange, setCustomDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  
  const { toast } = useToast();

  // Calculate earnings breakdown
  const earningsBreakdown = useMemo(() => {
    const now = new Date();
    const today = { from: startOfDay(now), to: endOfDay(now) };
    const thisWeek = { from: startOfWeek(now, { weekStartsOn: 1 }), to: endOfWeek(now, { weekStartsOn: 1 }) };
    const thisMonth = { from: startOfMonth(now), to: endOfMonth(now) };

    const calculatePeriodEarnings = (period: { from: Date; to: Date }) => {
      return guardTransactions
        .filter(t => t.amount > 0) // Only income
        .filter(t => {
          const transactionDate = new Date(t.timestamp);
          return isWithinInterval(transactionDate, { start: period.from, end: period.to });
        })
        .reduce((sum, t) => sum + t.amount, 0);
    };

    return {
      today: calculatePeriodEarnings(today),
      thisWeek: calculatePeriodEarnings(thisWeek),
      thisMonth: calculatePeriodEarnings(thisMonth)
    };
  }, [guardTransactions]);

  // Calculate next payout estimate
  const nextPayoutEstimate = useMemo(() => {
    const remaining = guard.minPayoutThreshold - guard.balance;
    if (remaining <= 0) return null;

    // Calculate average daily earnings from last 7 days
    const last7Days = guardTransactions
      .filter(t => t.amount > 0)
      .filter(t => {
        const transactionDate = new Date(t.timestamp);
        const sevenDaysAgo = addDays(new Date(), -7);
        return transactionDate >= sevenDaysAgo;
      })
      .reduce((sum, t) => sum + t.amount, 0) / 7;

    if (last7Days <= 0) return null;

    const daysToTarget = Math.ceil(remaining / last7Days);
    const estimatedDate = addDays(new Date(), daysToTarget);

    return {
      amount: remaining,
      days: daysToTarget,
      date: estimatedDate
    };
  }, [guard.balance, guard.minPayoutThreshold, guardTransactions]);

  // Get date range for filtering
  const getDateRange = () => {
    const now = new Date();
    const today = startOfDay(now);
    
    switch (dateFilter) {
      case 'today':
        return { from: today, to: endOfDay(now) };
      case 'yesterday':
        const yesterday = subDays(today, 1);
        return { from: yesterday, to: endOfDay(yesterday) };
      case 'week':
        return { from: startOfWeek(now, { weekStartsOn: 1 }), to: endOfWeek(now, { weekStartsOn: 1 }) };
      case 'month':
        return { from: startOfMonth(now), to: endOfMonth(now) };
      case 'last7':
        return { from: subDays(today, 7), to: now };
      case 'last30':
        return { from: subDays(today, 30), to: now };
      case 'custom':
        return { 
          from: customDateRange.from || subDays(today, 30), 
          to: customDateRange.to || now 
        };
      case 'all':
      default:
        return { from: new Date(2020, 0, 1), to: now };
    }
  };

  // Filter payouts based on criteria
  const filteredPayouts = useMemo(() => {
    const { from, to } = getDateRange();
    
    return guardPayouts.filter(payout => {
      // Date filter
      const payoutDate = new Date(payout.issueDate);
      const inDateRange = isWithinInterval(payoutDate, { start: from, end: to });
      if (!inDateRange) return false;
      
      // Status filter
      if (statusFilter !== 'all' && payout.status.toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
      
      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        return (
          payout.voucherCode.toLowerCase().includes(searchLower) ||
          payout.amount.toString().includes(searchLower) ||
          formatCurrency(payout.amount).toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    }).sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
  }, [guardPayouts, dateFilter, customDateRange, statusFilter, searchQuery]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredPayouts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPayouts = filteredPayouts.slice(startIndex, endIndex);
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [dateFilter, statusFilter, searchQuery]);

  // Quick date filters
  const quickDateFilters = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'last7', label: 'Last 7 Days' },
    { value: 'last30', label: 'Last 30 Days' },
  ];

  const handleRequestPayout = async () => {
    const amount = parseFloat(payoutAmount);
    
    if (amount <= 0 || amount > guard.balance) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount within your available balance.",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast({
      title: "Payout Requested! 🎉",
      description: `Your payout request for ${formatCurrency(amount)} has been submitted and is awaiting approval.`,
      className: "bg-green-50 border-green-200 text-green-800"
    });
    
    setIsLoading(false);
    setPayoutDialogOpen(false);
    setPayoutAmount('');
    setPayoutReason('');
  };


  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'redeemed':
      case 'approved':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'pending':
      case 'issued':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'expired':
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-orange-600" />;
    }
  };

  // Get status color class
  const getStatusColorClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'redeemed':
      case 'approved':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'pending':
      case 'issued':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'expired':
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-orange-100 text-orange-700 border-orange-200';
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 flex-1 overflow-y-auto">
        <h1 className="text-xl font-bold text-tippa-dark mb-4">Payouts</h1>
        
        {/* Enhanced Balance Card */}
        <div className="bg-gradient-to-r from-tippa-primary to-tippa-secondary rounded-lg shadow-lg p-4 mb-6 text-white">
          <div className="text-center mb-4">
            <div className="text-sm opacity-90 mb-1">Current Balance</div>
            <div className="text-3xl font-bold mb-2">
              {formatCurrency(guard.balance)}
            </div>
            
            {/* Earnings Breakdown */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                <div className="flex items-center justify-center mb-1">
                  <Calendar className="w-4 h-4 mr-1" />
                  <span className="text-xs font-medium">Today</span>
                </div>
                <div className="text-lg font-bold">{formatCurrency(earningsBreakdown.today)}</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                <div className="flex items-center justify-center mb-1">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <span className="text-xs font-medium">This Week</span>
                </div>
                <div className="text-lg font-bold">{formatCurrency(earningsBreakdown.thisWeek)}</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                <div className="flex items-center justify-center mb-1">
                  <Wallet className="w-4 h-4 mr-1" />
                  <span className="text-xs font-medium">This Month</span>
                </div>
                <div className="text-lg font-bold">{formatCurrency(earningsBreakdown.thisMonth)}</div>
              </div>
            </div>
          </div>
          
          {/* Payout Progress */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2 opacity-90">
              <span>Payout Progress</span>
              <span>
                {formatCurrency(guard.balance)} / {formatCurrency(guard.minPayoutThreshold)}
              </span>
            </div>
            <div className="w-full bg-white/30 rounded-full h-3">
              <div
                className={cn(
                  "bg-white rounded-full h-3 transition-all duration-500 ease-out",
                  progressPercentage >= 100 && "animate-pulse"
                )}
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              ></div>
            </div>
            
            {/* Next Payout Estimate */}
            {nextPayoutEstimate ? (
              <div className="text-xs opacity-90 mt-2 text-center">
                <div className="flex items-center justify-center">
                  <Clock className="w-3 h-3 mr-1" />
                  Need {formatCurrency(nextPayoutEstimate.amount)} more
                </div>
                <div className="mt-1">
                  Estimated: {nextPayoutEstimate.days} days ({format(nextPayoutEstimate.date, 'MMM d')})
                </div>
              </div>
            ) : progressPercentage >= 100 ? (
              <div className="text-xs mt-2 text-center animate-bounce">
                <div className="flex items-center justify-center">
                  <Gift className="w-3 h-3 mr-1" />
                  Ready for payout! 🎉
                </div>
              </div>
            ) : (
              <div className="text-xs opacity-90 mt-2 text-center">
                Next Payout: Voucher when {formatCurrency(guard.minPayoutThreshold)} reached
              </div>
            )}
          </div>
          
          {/* Payout Frequency Selector */}
          <div className="mb-4">
            <Label className="text-xs text-white/90 mb-2 block">Auto-Payout Settings</Label>
            <Select value={payoutFrequency} onValueChange={setPayoutFrequency}>
              <SelectTrigger className="bg-white/20 backdrop-blur-sm border-white/30 text-white">
                <div className="flex items-center">
                  <Settings className="w-4 h-4 mr-2" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual Requests Only</SelectItem>
                <SelectItem value="daily">Daily Auto-Payout</SelectItem>
                <SelectItem value="weekly">Weekly Auto-Payout</SelectItem>
                <SelectItem value="monthly">Monthly Auto-Payout</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Dialog open={payoutDialogOpen} onOpenChange={setPayoutDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="w-full bg-white text-tippa-primary hover:bg-white/90 font-semibold shadow-md transition-all duration-200 hover:shadow-lg" 
                disabled={guard.balance < 50}
              >
                <Wallet className="w-4 h-4 mr-2" />
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
              
              <DialogFooter className="flex flex-col sm:flex-row gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setPayoutDialogOpen(false)}
                  disabled={isLoading}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleRequestPayout}
                  disabled={isLoading}
                  className="w-full sm:w-auto bg-tippa-primary text-tippa-accent hover:bg-tippa-secondary"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Submit Request
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Filters Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6">
          <div className="mb-2">
            <h2 className="text-lg font-semibold flex items-center">
              <Gift className="w-5 h-5 mr-2 text-tippa-primary" />
              Payout History
            </h2>
          </div>

          {/* Search Bar */}
          <div className="mb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by voucher code or amount..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex flex-col sm:flex-row gap-2 mb-2">
            {/* Status Filter */}
            <div className="flex-1 min-w-[140px]">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full h-9">
                  <div className="flex items-center">
                    <Filter className="w-4 h-4 mr-1" />
                    <SelectValue placeholder="All Status" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="issued">Issued</SelectItem>
                  <SelectItem value="redeemed">Redeemed</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Date Filters Dropdown */}
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-auto min-w-[100px] h-9">
                <div className="flex items-center">
                  <CalendarIcon className="w-4 h-4 mr-1" />
                  <span className="text-xs">
                    {dateFilter === 'custom' && customDateRange.from && customDateRange.to
                      ? `${format(customDateRange.from, 'MMM d')} - ${format(customDateRange.to, 'MMM d')}`
                      : dateFilter === 'all'
                      ? 'All Time'
                      : quickDateFilters.find(f => f.value === dateFilter)?.label || 'More'
                    }
                  </span>
                  <ChevronDown className="w-3 h-3 ml-1" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {quickDateFilters.map(filter => (
                  <SelectItem key={filter.value} value={filter.value}>{filter.label}</SelectItem>
                ))}
                <SelectItem value="custom">Custom Range</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Custom Date Picker */}
            {dateFilter === 'custom' && (
              <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="text-xs h-9">
                    <CalendarIcon className="w-3 h-3 mr-1" />
                    Pick Dates
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="range"
                    selected={{
                      from: customDateRange.from,
                      to: customDateRange.to,
                    }}
                    onSelect={(range: any) => {
                      setCustomDateRange({
                        from: range?.from,
                        to: range?.to,
                      });
                      if (range?.from && range?.to) {
                        setShowDatePicker(false);
                      }
                    }}
                    numberOfMonths={1}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>

          {/* Results Count */}
          <div className="text-xs text-gray-500 pt-1 border-t border-gray-100">
            {filteredPayouts.length > 0 ? (
              `Showing ${startIndex + 1}-${Math.min(endIndex, filteredPayouts.length)} of ${filteredPayouts.length} vouchers`
            ) : (
              `No vouchers found matching your criteria`
            )}
          </div>
        </div>
        
        {paginatedPayouts.length > 0 ? (
          <div className="space-y-3">
            {paginatedPayouts.map(payout => (
              <div
                key={payout.id}
                className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <div className="font-bold text-lg text-tippa-dark mr-3">
                        {formatCurrency(payout.amount)}
                      </div>
                      <Badge 
                        variant="outline" 
                        className={cn("flex items-center gap-1", getStatusColorClass(payout.status))}
                      >
                        {getStatusIcon(payout.status)}
                        {payout.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        Issued: {formatDate(payout.issueDate)}
                      </div>
                      <div className="flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Voucher: <span className="font-mono ml-1">{payout.voucherCode}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-8 text-gray-500">
            <Gift className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <div className="text-xl mb-2">
              {guardPayouts.length === 0 
                ? "No payouts yet" 
                : "No vouchers match your filters"
              }
            </div>
            <p className="text-sm">
              {guardPayouts.length === 0 
                ? `When your balance reaches ${formatCurrency(guard.minPayoutThreshold)}, you'll receive a voucher`
                : "Try adjusting your search or filter criteria"
              }
            </p>
            {guardPayouts.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDateFilter('all');
                  setStatusFilter('all');
                  setSearchQuery('');
                }}
                className="mt-4"
              >
                Clear Filters
              </Button>
            )}
          </div>
        )}
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className="w-8 h-8 p-0"
                >
                  {page}
                </Button>
              ))}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="flex items-center"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
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