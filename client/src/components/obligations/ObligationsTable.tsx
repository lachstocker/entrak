import React, { useState } from 'react';
import { Edit, Bell, Eye, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { formatDate, getTimeUntil, getInitials } from '@/lib/utils';
import { Obligation } from '@/types';
import { OBLIGATION_TYPES } from '@/constants';
import EditObligationDialog from './EditObligationDialog';
import ObligationBadge from './ObligationBadge';

interface ObligationsTableProps {
  obligations: Obligation[];
  isLoading?: boolean;
  onEditObligation?: (obligation: Obligation) => void;
  onViewDetails?: (obligation: Obligation) => void;
  onSetReminder?: (obligation: Obligation) => void;
}

const ObligationsTable: React.FC<ObligationsTableProps> = ({ 
  obligations,
  isLoading = false,
  onEditObligation,
  onViewDetails,
  onSetReminder
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedObligation, setSelectedObligation] = useState<Obligation | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  const itemsPerPage = 5;
  const totalPages = Math.ceil(obligations.length / itemsPerPage);
  
  const paginatedObligations = obligations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  const handleEditObligation = (obligation: Obligation) => {
    setSelectedObligation(obligation);
    setIsEditDialogOpen(true);
    if (onEditObligation) {
      onEditObligation(obligation);
    }
  };
  
  const handleEditSave = (updatedObligation: Obligation) => {
    // Logic to update the obligation will be handled by the parent component
    setIsEditDialogOpen(false);
  };
  
  const handleSetReminder = (obligation: Obligation) => {
    if (onSetReminder) {
      onSetReminder(obligation);
    }
  };
  
  const handleViewDetails = (obligation: Obligation) => {
    if (onViewDetails) {
      onViewDetails(obligation);
    }
  };
  
  const getResponsibleInitials = (responsibleParty: string | undefined) => {
    if (!responsibleParty) return 'NA';
    return getInitials(responsibleParty);
  };
  
  const getResponsibleColor = (responsibleParty: string | undefined) => {
    if (!responsibleParty) return 'bg-gray-500';
    
    const colors = [
      'bg-[#1E4265]', // Medium Blue
      'bg-purple-600',
      'bg-orange-600',
      'bg-teal-600',
      'bg-pink-600',
      'bg-indigo-600'
    ];
    
    // Simple hash function to consistently map responsible party to a color
    const hash = responsibleParty.split('').reduce((acc, char) => 
      acc + char.charCodeAt(0), 0
    );
    
    return colors[hash % colors.length];
  };
  
  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-[180px]">Due Date</TableHead>
              <TableHead className="w-[180px]">Responsible</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Loading obligations...
                </TableCell>
              </TableRow>
            ) : paginatedObligations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No obligations found
                </TableCell>
              </TableRow>
            ) : (
              paginatedObligations.map((obligation) => (
                <TableRow key={obligation.id} className="hover:bg-[#E6F0F5] transition-colors">
                  <TableCell>
                    <ObligationBadge type={obligation.type} />
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium text-gray-900">{obligation.text}</div>
                    <div className="text-sm text-gray-500">
                      {obligation.document?.title || `Document #${obligation.document_id}`}
                      {(obligation.clause_number || obligation.section_name) && (
                        <span className="ml-1">
                          {obligation.clause_number && `| Clause ${obligation.clause_number}`}
                          {obligation.section_name && obligation.clause_number && ' - '}
                          {obligation.section_name && `${obligation.section_name}`}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDate(obligation.due_date)}</div>
                    <div className={`text-sm ${
                      obligation.status === 'overdue' ? 'text-red-500' : 'text-gray-500'
                    }`}>
                      {getTimeUntil(obligation.due_date)}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`h-8 w-8 rounded-full ${
                        getResponsibleColor(obligation.responsible_party)
                      } text-white flex items-center justify-center`}>
                        <span>{getResponsibleInitials(obligation.responsible_party)}</span>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {obligation.responsible_party || 'Not Assigned'}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={obligation.status}>{
                      obligation.status.charAt(0).toUpperCase() + obligation.status.slice(1)
                    }</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex space-x-2 justify-end">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-[#0F2B46] hover:text-[#1E4265] transition-colors" 
                        title="Edit"
                        onClick={() => handleEditObligation(obligation)}
                      >
                        <Edit size={18} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-[#0F2B46] hover:text-[#1E4265] transition-colors" 
                        title="Set reminder"
                        onClick={() => handleSetReminder(obligation)}
                      >
                        <Bell size={18} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-[#0F2B46] hover:text-[#1E4265] transition-colors" 
                        title="View details"
                        onClick={() => handleViewDetails(obligation)}
                      >
                        <Eye size={18} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, obligations.length)} of {obligations.length} obligations
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(old => Math.max(old - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            {[...Array(Math.min(totalPages, 5))].map((_, i) => {
              const pageNumber = i + 1;
              return (
                <Button
                  key={i}
                  variant={pageNumber === currentPage ? 'default' : 'outline'}
                  className={`w-8 h-8 p-0 ${pageNumber === currentPage ? 'bg-[#0F2B46]' : 'bg-[#E6F0F5] text-[#0F2B46]'}`}
                  onClick={() => setCurrentPage(pageNumber)}
                >
                  {pageNumber}
                </Button>
              );
            })}
            
            {totalPages > 5 && (
              <>
                <span className="text-gray-500">...</span>
                <Button
                  variant="outline"
                  className="w-8 h-8 p-0 bg-[#E6F0F5] text-[#0F2B46]"
                  onClick={() => setCurrentPage(totalPages)}
                >
                  {totalPages}
                </Button>
              </>
            )}
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(old => Math.min(old + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      
      {selectedObligation && (
        <EditObligationDialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          obligation={selectedObligation}
          onSave={handleEditSave}
        />
      )}
    </>
  );
};

export default ObligationsTable;
