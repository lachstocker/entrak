import React, { useState } from 'react';
import { Link } from 'wouter';
import { ArrowRight, Upload } from 'lucide-react';
import TopNavbar from '@/components/layout/TopNavbar';
import StatsCards from '@/components/dashboard/StatsCards';
import DocumentUpload from '@/components/upload/DocumentUpload';
import ObligationsTable from '@/components/obligations/ObligationsTable';
import Calendar from '@/components/calendar/Calendar';
import FilterBar from '@/components/obligations/FilterBar';
import { Button } from '@/components/ui/button';
import { FilterState, Obligation } from '@/types';
import { STATS } from '@/constants';
import { useObligations } from '@/hooks/useObligations';

const Dashboard: React.FC = () => {
  const [filters, setFilters] = useState<FilterState>({ type: 'all', status: 'all' });
  const { obligations, isLoading, error } = useObligations(filters);
  
  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };
  
  const handleExport = (format: 'csv' | 'json' | 'pdf') => {
    // Export logic is already implemented in the FilterBar component
  };
  
  const handleEditObligation = (obligation: Obligation) => {
    // Obligation edit dialog is triggered in ObligationsTable component
  };
  
  const handleUploadSuccess = (documentId: number) => {
    // Refresh obligations list
  };
  
  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      <TopNavbar title="Dashboard" />
      
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="font-montserrat font-bold text-3xl text-[#0F2B46] mb-2">Contract Obligations</h1>
              <p className="text-gray-600">Extract, manage, and track your contractual obligations</p>
            </div>
            <div className="mt-4 md:mt-0">
              <Button className="flex items-center">
                <Upload className="mr-2" size={18} />
                Upload Document
              </Button>
            </div>
          </div>
          
          {/* Stats Cards */}
          <StatsCards stats={STATS} />
          
          {/* Document Upload Section */}
          <DocumentUpload onUploadSuccess={handleUploadSuccess} />
          
          {/* Obligations Section */}
          <div className="bg-white rounded-lg shadow-[0px_4px_20px_rgba(0,0,0,0.1)] p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <h2 className="font-montserrat font-semibold text-xl">Recent Obligations</h2>
              
              <FilterBar 
                onFilterChange={handleFilterChange}
                onExport={handleExport}
                obligations={obligations || []}
              />
            </div>
            
            <ObligationsTable 
              obligations={obligations || []}
              isLoading={isLoading}
              onEditObligation={handleEditObligation}
            />
          </div>
          
          {/* Upcoming Deadlines Section */}
          <div className="bg-white rounded-lg shadow-[0px_4px_20px_rgba(0,0,0,0.1)] p-6">
            <h2 className="font-montserrat font-semibold text-xl mb-6">Upcoming Deadlines</h2>
            
            <Calendar obligations={obligations || []} />
            
            <div className="mt-6">
              <Link href="/calendar">
                <Button variant="link" className="text-[#26E07F] hover:text-[#26E07F] hover:underline flex items-center font-semibold p-0">
                  View full calendar
                  <ArrowRight className="ml-1" size={18} />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Dashboard;
