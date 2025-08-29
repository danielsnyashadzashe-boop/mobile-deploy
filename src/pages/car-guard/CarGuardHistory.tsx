import React, { useState, useMemo } from 'react';
import BottomNavigation from '@/components/car-guard/BottomNavigation';
import { mockTransactions, formatCurrency, formatDate, formatTime } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format, startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { 
  Calendar as CalendarIcon, 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Bolt, 
  CreditCard, 
  Gift,
  ArrowUpCircle,
  ArrowDownCircle,
  Filter,
  ChevronDown
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type DateRangeFilter = 'today' | 'yesterday' | 'week' | 'month' | 'last7' | 'last30' | 'custom' | 'all';
type TransactionTypeFilter = 'all' | 'income' | 'expenses';

const CarGuardHistory = () => {
  // Filter states
  const [dateFilter, setDateFilter] = useState<DateRangeFilter>('week');
  const [transactionFilter, setTransactionFilter] = useState<TransactionTypeFilter>('all');
  const [customDateRange, setCustomDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Get guard's transactions (using g1 as logged-in guard)
  const guardTransactions = mockTransactions.filter(t => t.guardId === 'g1');

  // Filter transactions by date range
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

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    const { from, to } = getDateRange();
    
    return guardTransactions.filter(transaction => {
      const transactionDate = new Date(transaction.timestamp);
      
      // Date filter
      const inDateRange = isWithinInterval(transactionDate, { start: from, end: to });
      if (!inDateRange) return false;
      
      // Transaction type filter
      const isIncome = transaction.amount > 0;
      if (transactionFilter === 'income' && !isIncome) return false;
      if (transactionFilter === 'expenses' && isIncome) return false;
      
      return true;
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [dateFilter, customDateRange, transactionFilter, guardTransactions]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = filteredTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const net = income - expenses;
    
    return { income, expenses, net };
  }, [filteredTransactions]);

  // Get transaction icon and color
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'tip':
        return <Gift className="w-4 h-4" />;
      case 'payout':
        return <CreditCard className="w-4 h-4" />;
      case 'airtime':
        return <Zap className="w-4 h-4" />;
      case 'electricity':
        return <Bolt className="w-4 h-4" />;
      default:
        return <ArrowDownCircle className="w-4 h-4" />;
    }
  };

  const getTransactionBadge = (type: string, amount: number) => {
    const isIncome = amount > 0;
    
    const config = {
      tip: { label: 'Tip', color: 'bg-green-100 text-green-700 border-green-200' },
      payout: { label: 'Payout', color: 'bg-blue-100 text-blue-700 border-blue-200' },
      airtime: { label: 'Airtime', color: 'bg-purple-100 text-purple-700 border-purple-200' },
      electricity: { label: 'Electricity', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
      withdrawal: { label: 'Withdrawal', color: 'bg-gray-100 text-gray-700 border-gray-200' },
      fee: { label: 'Fee', color: 'bg-red-100 text-red-700 border-red-200' },
    };

    const { label, color } = config[type] || { label: type, color: 'bg-gray-100 text-gray-700 border-gray-200' };
    
    return (
      <Badge variant="outline" className={cn(color, "text-xs")}>
        {getTransactionIcon(type)}
        <span className="ml-1">{label}</span>
      </Badge>
    );
  };

  const quickDateFilters = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'last7', label: 'Last 7 Days' },
    { value: 'last30', label: 'Last 30 Days' },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 flex-1 overflow-y-auto">
        <h1 className="text-xl font-bold text-nogada-dark mb-4">Transaction History</h1>
        
        {/* Statistics Cards */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-green-50 rounded-lg p-3 border border-green-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-green-600">Income</span>
              <ArrowUpCircle className="w-3 h-3 text-green-600" />
            </div>
            <div className="text-lg font-bold text-green-700">
              {formatCurrency(statistics.income)}
            </div>
          </div>
          
          <div className="bg-red-50 rounded-lg p-3 border border-red-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-red-600">Expenses</span>
              <ArrowDownCircle className="w-3 h-3 text-red-600" />
            </div>
            <div className="text-lg font-bold text-red-700">
              {formatCurrency(statistics.expenses)}
            </div>
          </div>
          
          <div className={cn(
            "rounded-lg p-3 border",
            statistics.net >= 0 
              ? "bg-blue-50 border-blue-200" 
              : "bg-orange-50 border-orange-200"
          )}>
            <div className="flex items-center justify-between mb-1">
              <span className={cn(
                "text-xs",
                statistics.net >= 0 ? "text-blue-600" : "text-orange-600"
              )}>Net</span>
              {statistics.net >= 0 ? (
                <TrendingUp className="w-3 h-3 text-blue-600" />
              ) : (
                <TrendingDown className="w-3 h-3 text-orange-600" />
              )}
            </div>
            <div className={cn(
              "text-lg font-bold",
              statistics.net >= 0 ? "text-blue-700" : "text-orange-700"
            )}>
              {formatCurrency(Math.abs(statistics.net))}
            </div>
          </div>
        </div>

        {/* Date Range Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-3 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium flex items-center">
              <Filter className="w-4 h-4 mr-1" />
              Filters
            </h3>
            {dateFilter === 'custom' && customDateRange.from && customDateRange.to && (
              <span className="text-xs text-gray-500">
                {format(customDateRange.from, 'MMM d')} - {format(customDateRange.to, 'MMM d, yyyy')}
              </span>
            )}
          </div>
          
          {/* Quick Date Filters */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {quickDateFilters.map(filter => (
              <Button
                key={filter.value}
                variant={dateFilter === filter.value ? "default" : "outline"}
                size="sm"
                onClick={() => setDateFilter(filter.value as DateRangeFilter)}
                className="text-xs"
              >
                {filter.label}
              </Button>
            ))}
          </div>
          
          {/* Custom Date Range */}
          <div className="flex gap-2">
            <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
              <PopoverTrigger asChild>
                <Button
                  variant={dateFilter === 'custom' ? "default" : "outline"}
                  size="sm"
                  className="flex-1 justify-start text-left font-normal"
                  onClick={() => setDateFilter('custom')}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFilter === 'custom' && customDateRange.from && customDateRange.to ? (
                    <span className="text-xs">
                      {format(customDateRange.from, 'MMM d')} - {format(customDateRange.to, 'MMM d')}
                    </span>
                  ) : (
                    <span className="text-xs">Custom Range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
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
                      setDateFilter('custom');
                      setShowDatePicker(false);
                    }
                  }}
                  numberOfMonths={1}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDateFilter('all')}
              className={cn(
                "px-3",
                dateFilter === 'all' && "bg-primary text-primary-foreground"
              )}
            >
              All Time
            </Button>
          </div>
        </div>

        {/* Transaction Type Tabs */}
        <Tabs value={transactionFilter} onValueChange={(v) => setTransactionFilter(v as TransactionTypeFilter)}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="income" className="data-[state=active]:text-green-600">
              Income
            </TabsTrigger>
            <TabsTrigger value="expenses" className="data-[state=active]:text-red-600">
              Expenses
            </TabsTrigger>
          </TabsList>

          {/* Transactions List */}
          <TabsContent value={transactionFilter} className="mt-0">
            {filteredTransactions.length > 0 ? (
              <div className="space-y-3">
                {filteredTransactions.map(transaction => {
                  const isIncome = transaction.amount > 0;
                  return (
                    <div
                      key={transaction.id}
                      className="bg-white rounded-lg shadow-sm border border-gray-100 p-3"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {getTransactionBadge(transaction.type, transaction.amount)}
                            {transaction.paymentMethod && (
                              <Badge variant="secondary" className="text-xs">
                                {transaction.paymentMethod}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {transaction.description}
                          </p>
                          <div className="text-xs text-gray-500 mt-1">
                            {formatDate(transaction.timestamp)} at {formatTime(transaction.timestamp)}
                          </div>
                        </div>
                        <div className={cn(
                          "text-lg font-bold",
                          isIncome ? "text-green-600" : "text-red-600"
                        )}>
                          {isIncome ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                        </div>
                      </div>
                      {transaction.reference && (
                        <div className="text-xs text-gray-400 mt-2">
                          Ref: {transaction.reference}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center p-6 text-gray-500">
                <div className="text-xl mb-2">No transactions found</div>
                <p className="text-sm">Try adjusting your filters</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      <BottomNavigation />
    </div>
  );
};

export default CarGuardHistory;