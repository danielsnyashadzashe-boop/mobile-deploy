
import React, { useState } from 'react';
import { Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger 
} from '@/components/ui/collapsible';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import { 
  ToggleGroup,
  ToggleGroupItem 
} from '@/components/ui/toggle-group';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger 
} from '@/components/ui/accordion';
import { mockLocations } from '@/data/mockData';

export interface FilterValues {
  location: string;
  dateRange: string;
  transactionTypes: string[];
  guardStatus: string;
  searchTerm: string;
}

interface FilterSectionProps {
  filters: FilterValues;
  onFilterChange: (filters: FilterValues) => void;
  onReset: () => void;
}

const FilterSection: React.FC<FilterSectionProps> = ({
  filters,
  onFilterChange,
  onReset
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const handleFilterChange = (
    key: keyof FilterValues,
    value: string | string[]
  ) => {
    onFilterChange({
      ...filters,
      [key]: value
    });
  };
  
  const handleToggleTransactionType = (types: string[]) => {
    handleFilterChange('transactionTypes', types);
  };
  
  return (
    <div className="mb-6 border rounded-md">
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="w-full"
      >
        <div className="flex justify-between items-center px-4 py-3 bg-gray-50">
          <div className="flex items-center">
            <Filter size={18} className="mr-2 text-nogada-primary" />
            <h3 className="font-medium">Filters</h3>
            {filters.location || filters.transactionTypes.length > 0 || filters.dateRange || filters.guardStatus || filters.searchTerm ? (
              <div className="ml-2 px-2 py-1 bg-nogada-primary/10 text-xs rounded-full text-nogada-primary">
                Active filters
              </div>
            ) : null}
          </div>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="p-1 h-auto">
              {isOpen ? 
                <ChevronUp size={18} /> : 
                <ChevronDown size={18} />
              }
            </Button>
          </CollapsibleTrigger>
        </div>
        
        <CollapsibleContent>
          <div className="p-4 border-t">
            <Accordion type="multiple" className="w-full">
              <AccordionItem value="search">
                <AccordionTrigger className="py-2">Search</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    <Label htmlFor="search">Search by guard, location or transaction ID</Label>
                    <Input
                      id="search"
                      placeholder="Search..."
                      value={filters.searchTerm}
                      onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="location">
                <AccordionTrigger className="py-2">Location</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    <Select 
                      value={filters.location} 
                      onValueChange={(value) => handleFilterChange('location', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Locations" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Locations</SelectItem>
                        {mockLocations.map((location) => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="transaction-types">
                <AccordionTrigger className="py-2">Transaction Types</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    <ToggleGroup 
                      type="multiple" 
                      value={filters.transactionTypes}
                      onValueChange={handleToggleTransactionType}
                      className="flex flex-wrap gap-1"
                    >
                      <ToggleGroupItem value="tip" className="text-xs">Tips</ToggleGroupItem>
                      <ToggleGroupItem value="payout" className="text-xs">Payouts</ToggleGroupItem>
                      <ToggleGroupItem value="airtime" className="text-xs">Airtime</ToggleGroupItem>
                      <ToggleGroupItem value="electricity" className="text-xs">Electricity</ToggleGroupItem>
                      <ToggleGroupItem value="withdrawal" className="text-xs">Withdrawals</ToggleGroupItem>
                      <ToggleGroupItem value="deposit" className="text-xs">Deposits</ToggleGroupItem>
                    </ToggleGroup>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="date-range">
                <AccordionTrigger className="py-2">Date Range</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    <RadioGroup 
                      value={filters.dateRange}
                      onValueChange={(value) => handleFilterChange('dateRange', value)}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="today" id="today" />
                        <Label htmlFor="today">Today</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="week" id="week" />
                        <Label htmlFor="week">This Week</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="month" id="month" />
                        <Label htmlFor="month">This Month</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="all" id="all" />
                        <Label htmlFor="all">All Time</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="guard-status">
                <AccordionTrigger className="py-2">Guard Status</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    <RadioGroup 
                      value={filters.guardStatus}
                      onValueChange={(value) => handleFilterChange('guardStatus', value)}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="all" id="status-all" />
                        <Label htmlFor="status-all">All Guards</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="eligible" id="eligible" />
                        <Label htmlFor="eligible">Eligible for Payout</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="ineligible" id="ineligible" />
                        <Label htmlFor="ineligible">Not Eligible</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            <div className="flex justify-end mt-4 pt-2 border-t">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onReset} 
                className="mr-2"
              >
                Reset
              </Button>
              <Button 
                size="sm" 
                onClick={() => setIsOpen(false)}
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default FilterSection;
