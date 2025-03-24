import React, { useState } from 'react';
import { Download, ChevronDown, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { FilterState } from '@/types';
import { OBLIGATION_TYPES, OBLIGATION_STATUSES, RESPONSIBLE_PARTIES } from '@/constants';
import { downloadCSV, downloadJSON } from '@/lib/utils';

interface FilterBarProps {
  onFilterChange: (filters: FilterState) => void;
  onExport: (format: 'csv' | 'json' | 'pdf') => void;
  initialFilters?: FilterState;
  obligations: any[]; // Used for export functionality
}

const FilterBar: React.FC<FilterBarProps> = ({ 
  onFilterChange, 
  onExport, 
  initialFilters = { type: 'all', status: 'all' },
  obligations 
}) => {
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [dateRange, setDateRange] = useState<{
    from?: Date;
    to?: Date;
  }>({});
  
  const handleTypeFilterChange = (value: string) => {
    const newFilters = { ...filters, type: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };
  
  const handleStatusFilterChange = (value: string) => {
    const newFilters = { ...filters, status: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };
  
  const handleResponsibleChange = (value: string) => {
    const newFilters = { ...filters, responsibleParty: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };
  
  const handleDateRangeChange = (range: { from?: Date; to?: Date }) => {
    setDateRange(range);
    
    const newFilters = { 
      ...filters, 
      dueDateStart: range.from?.toISOString(),
      dueDateEnd: range.to?.toISOString() 
    };
    
    setFilters(newFilters);
    
    if (range.from || range.to) {
      onFilterChange(newFilters);
    }
  };
  
  const clearDateFilter = () => {
    setDateRange({});
    const { dueDateStart, dueDateEnd, ...restFilters } = filters;
    setFilters(restFilters);
    onFilterChange(restFilters);
  };
  
  const handleExport = (format: 'csv' | 'json' | 'pdf') => {
    if (format === 'csv') {
      downloadCSV(obligations, 'obligations.csv');
    } else if (format === 'json') {
      downloadJSON(obligations, 'obligations.json');
    } else {
      // PDF export handled by parent component
      onExport(format);
    }
  };
  
  return (
    <div className="flex flex-wrap items-center mt-4 md:mt-0 gap-3">
      <Select onValueChange={handleTypeFilterChange} defaultValue={filters.type}>
        <SelectTrigger className="bg-[#E6F0F5] text-[#0F2B46] w-[140px]">
          <SelectValue placeholder="All Types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          {OBLIGATION_TYPES.map(type => (
            <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Select onValueChange={handleStatusFilterChange} defaultValue={filters.status}>
        <SelectTrigger className="bg-[#E6F0F5] text-[#0F2B46] w-[140px]">
          <SelectValue placeholder="All Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          {OBLIGATION_STATUSES.map(status => (
            <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className="bg-[#E6F0F5] text-[#0F2B46] border-[#E6F0F5]"
          >
            <Calendar className="mr-2 h-4 w-4" />
            {dateRange.from || dateRange.to ? (
              <span>
                {dateRange.from ? dateRange.from.toLocaleDateString() : ''} 
                {dateRange.to ? ` - ${dateRange.to.toLocaleDateString()}` : ''}
              </span>
            ) : (
              <span>Date Range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <CalendarComponent
            mode="range"
            selected={dateRange}
            onSelect={handleDateRangeChange}
            initialFocus
          />
          <div className="p-3 border-t border-gray-100 flex justify-end">
            <Button variant="ghost" size="sm" onClick={clearDateFilter}>
              Clear
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      
      <Select onValueChange={handleResponsibleChange} defaultValue={filters.responsibleParty || ''}>
        <SelectTrigger className="bg-[#E6F0F5] text-[#0F2B46] w-[180px]">
          <SelectValue placeholder="Responsible Party" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Responsible Parties</SelectItem>
          {RESPONSIBLE_PARTIES.map(party => (
            <SelectItem key={party.value} value={party.value}>{party.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="bg-[#E6F0F5] text-[#0F2B46] border-[#E6F0F5]"
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => handleExport('csv')}>
            Export as CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport('json')}>
            Export as JSON
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport('pdf')}>
            Export as PDF
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default FilterBar;
