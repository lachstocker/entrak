import React, { useEffect, useState } from 'react';
import { Download, X, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FilterState } from '@/types';
import { OBLIGATION_STATUSES } from '@/constants';
import { useProjects } from '@/hooks/useProjects';
import { useResponsibleParties } from '@/hooks/useResponsibleParties';

interface FilterBarProps {
  onFilterChange: (filters: FilterState) => void;
  onExport: (format: 'csv' | 'json' | 'pdf') => void;
  initialFilters?: FilterState;
  obligations: any[];
}

const FilterBar: React.FC<FilterBarProps> = ({ 
  onFilterChange, 
  onExport, 
  initialFilters = { status: 'all', responsibleParty: 'all' },
  obligations 
}) => {
  const { projects, isLoading: isLoadingProjects } = useProjects();
  const { responsibleParties, isLoading: isLoadingParties } = useResponsibleParties();
  
  // Maintain internal state for filters
  const [internalFilters, setInternalFilters] = useState<FilterState>({
    status: initialFilters.status || 'all',
    responsibleParty: initialFilters.responsibleParty || 'all',
    isRecurring: initialFilters.isRecurring,
    projectId: initialFilters.projectId
  });
  
  // Sync internal state when initialFilters changes
  useEffect(() => {
    setInternalFilters({
      status: initialFilters.status || 'all',
      responsibleParty: initialFilters.responsibleParty || 'all',
      isRecurring: initialFilters.isRecurring,
      projectId: initialFilters.projectId
    });
  }, [initialFilters]);

  // Handle filter changes while preserving other active filters
  const handleStatusFilterChange = (value: string) => {
    const newFilters = { 
      ...internalFilters, 
      status: value 
    };
    setInternalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleResponsibleChange = (value: string) => {
    const newFilters = { 
      ...internalFilters, 
      responsibleParty: value 
    };
    setInternalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleRecurringChange = (value: string) => {
    const isRecurring = value === 'true' 
      ? true 
      : value === 'false' 
        ? false 
        : undefined;
        
    const newFilters = { 
      ...internalFilters, 
      isRecurring 
    };
    setInternalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleProjectChange = (value: string) => {
    const projectId = value === 'all' 
      ? undefined 
      : parseInt(value, 10);
      
    const newFilters = { 
      ...internalFilters, 
      projectId 
    };
    setInternalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleExport = (format: 'csv' | 'json' | 'pdf') => {
    onExport(format);
  };
  
  // Clear all active filters
  const handleClearFilters = () => {
    const defaultFilters = { 
      status: 'all', 
      responsibleParty: 'all',
      isRecurring: undefined,
      projectId: undefined 
    };
    setInternalFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };

  // Check if a filter is active (not set to default/all value)
  const isFilterActive = (filterName: string): boolean => {
    switch(filterName) {
      case 'status':
        return internalFilters.status !== undefined && internalFilters.status !== 'all';
      case 'responsibleParty':
        return internalFilters.responsibleParty !== undefined && internalFilters.responsibleParty !== 'all';
      case 'isRecurring':
        return internalFilters.isRecurring !== undefined;
      case 'projectId':
        return internalFilters.projectId !== undefined;
      default:
        return false;
    }
  };
  
  // Check if any filter is active
  const hasActiveFilters = (): boolean => {
    return isFilterActive('status') || 
           isFilterActive('responsibleParty') || 
           isFilterActive('isRecurring') || 
           isFilterActive('projectId');
  };
  
  // Calculate values for the Select components
  const statusValue = internalFilters.status || 'all';
  const responsibleValue = internalFilters.responsibleParty || 'all';
  const recurringValue = internalFilters.isRecurring === true 
    ? 'true' 
    : internalFilters.isRecurring === false 
      ? 'false' 
      : 'all';
  const projectValue = internalFilters.projectId 
    ? internalFilters.projectId.toString() 
    : 'all';

  return (
    <div className="flex flex-wrap items-center mt-4 md:mt-0 gap-3">
      <Select onValueChange={handleStatusFilterChange} value={statusValue}>
        <SelectTrigger 
          className={`w-[140px] ${isFilterActive('status') 
            ? 'bg-[#D0E7F5] text-[#0F2B46] border-[#2D88D3] border-2 font-medium' 
            : 'bg-[#E6F0F5] text-[#0F2B46]'
          }`}
        >
          <div className="flex justify-between items-center w-full">
            <SelectValue placeholder="All Status" />
            {isFilterActive('status') && <Check className="h-4 w-4 ml-1 text-[#2D88D3]" />}
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          {OBLIGATION_STATUSES.map(status => (
            <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select onValueChange={handleResponsibleChange} value={responsibleValue}>
        <SelectTrigger 
          className={`w-[180px] ${isFilterActive('responsibleParty') 
            ? 'bg-[#D0E7F5] text-[#0F2B46] border-[#2D88D3] border-2 font-medium' 
            : 'bg-[#E6F0F5] text-[#0F2B46]'
          }`}
        >
          <div className="flex justify-between items-center w-full">
            <SelectValue placeholder="Responsible Party" />
            {isFilterActive('responsibleParty') && <Check className="h-4 w-4 ml-1 text-[#2D88D3]" />}
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Responsible Parties</SelectItem>
          {isLoadingParties ? (
            <div className="flex items-center justify-center py-2">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span>Loading...</span>
            </div>
          ) : responsibleParties.length > 0 ? (
            responsibleParties.map(party => (
              <SelectItem key={party.value} value={party.value}>{party.label}</SelectItem>
            ))
          ) : (
            <SelectItem value="none" disabled>No responsible parties found</SelectItem>
          )}
        </SelectContent>
      </Select>

      <Select onValueChange={handleRecurringChange} value={recurringValue}>
        <SelectTrigger 
          className={`w-[160px] ${isFilterActive('isRecurring') 
            ? 'bg-[#D0E7F5] text-[#0F2B46] border-[#2D88D3] border-2 font-medium' 
            : 'bg-[#E6F0F5] text-[#0F2B46]'
          }`}
        >
          <div className="flex justify-between items-center w-full">
            <SelectValue placeholder="Recurrence" />
            {isFilterActive('isRecurring') && <Check className="h-4 w-4 ml-1 text-[#2D88D3]" />}
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Obligations</SelectItem>
          <SelectItem value="true">Recurring Only</SelectItem>
          <SelectItem value="false">Non-recurring Only</SelectItem>
        </SelectContent>
      </Select>

      <Select onValueChange={handleProjectChange} value={projectValue}>
        <SelectTrigger 
          className={`w-[180px] ${isFilterActive('projectId') 
            ? 'bg-[#D0E7F5] text-[#0F2B46] border-[#2D88D3] border-2 font-medium' 
            : 'bg-[#E6F0F5] text-[#0F2B46]'
          }`}
        >
          <div className="flex justify-between items-center w-full">
            <SelectValue placeholder="Project" />
            {isFilterActive('projectId') && <Check className="h-4 w-4 ml-1 text-[#2D88D3]" />}
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Projects</SelectItem>
          {!isLoadingProjects && projects?.map(project => (
            <SelectItem key={project.id} value={project.id.toString()}>{project.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters() && (
        <Button 
          variant="outline" 
          onClick={handleClearFilters}
          className="bg-[#F5E6E6] text-[#D32D2D] border-[#D32D2D] border-2 hover:bg-[#F5D0D0]"
        >
          <X className="mr-2 h-4 w-4" />
          Clear Filters
        </Button>
      )}

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