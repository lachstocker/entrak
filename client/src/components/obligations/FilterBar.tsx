import React, { useState } from 'react';
import { Download } from 'lucide-react';
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
import { OBLIGATION_STATUSES, RESPONSIBLE_PARTIES } from '@/constants';
import { useProjects } from '@/hooks/useProjects';

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
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const { projects, isLoading: isLoadingProjects } = useProjects();

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

  const handleRecurringChange = (value: string) => {
    const newFilters = { ...filters, isRecurring: value === 'true' ? true : value === 'false' ? false : undefined };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleProjectChange = (value: string) => {
    const projectId = value === 'all' ? undefined : parseInt(value, 10);
    const newFilters = { ...filters, projectId };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleExport = (format: 'csv' | 'json' | 'pdf') => {
    onExport(format);
  };

  return (
    <div className="flex flex-wrap items-center mt-4 md:mt-0 gap-3">
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

      <Select onValueChange={handleResponsibleChange} defaultValue={filters.responsibleParty || 'all'}>
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

      <Select onValueChange={handleRecurringChange} defaultValue="all">
        <SelectTrigger className="bg-[#E6F0F5] text-[#0F2B46] w-[160px]">
          <SelectValue placeholder="Recurrence" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Obligations</SelectItem>
          <SelectItem value="true">Recurring Only</SelectItem>
          <SelectItem value="false">Non-recurring Only</SelectItem>
        </SelectContent>
      </Select>

      <Select onValueChange={handleProjectChange} defaultValue="all">
        <SelectTrigger className="bg-[#E6F0F5] text-[#0F2B46] w-[180px]">
          <SelectValue placeholder="Project" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Projects</SelectItem>
          {!isLoadingProjects && projects.map(project => (
            <SelectItem key={project.id} value={project.id.toString()}>{project.name}</SelectItem>
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