import React, { useState } from 'react';
import TopNavbar from '@/components/layout/TopNavbar';
import ObligationsTable from '@/components/obligations/ObligationsTable';
import FilterBar from '@/components/obligations/FilterBar';
import EditObligationDialog from '@/components/obligations/EditObligationDialog';
import { FilterState, Obligation } from '@/types';
import { useObligations } from '@/hooks/useObligations';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NOTIFICATION_METHODS } from '@/constants';

const Obligations: React.FC = () => {
  const [filters, setFilters] = useState<FilterState>({ status: 'all' });
  const { obligations, isLoading, error } = useObligations(filters);
  const [selectedObligation, setSelectedObligation] = useState<Obligation | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [reminderDate, setReminderDate] = useState('');
  const [reminderMethod, setReminderMethod] = useState('in-app');
  const [reminderMessage, setReminderMessage] = useState('');
  const [isSavingReminder, setIsSavingReminder] = useState(false);
  const { toast } = useToast();
  
  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };
  
  const handleExport = (format: 'csv' | 'json' | 'pdf') => {
    // Export functionality is handled in FilterBar component
  };
  
  const handleEditObligation = (obligation: Obligation) => {
    setSelectedObligation(obligation);
    setIsEditDialogOpen(true);
  };
  
  const handleEditSave = async (updatedObligation: Obligation) => {
    try {
      await apiRequest({
        method: 'PUT',
        url: `/api/obligations/${updatedObligation.id}`,
        data: updatedObligation
      });
      
      toast({
        title: 'Obligation updated',
        description: 'The obligation has been updated successfully',
      });
      
      // Refresh obligations list
      queryClient.invalidateQueries({ queryKey: ['/api/obligations'] });
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating obligation:', error);
      toast({
        title: 'Update failed',
        description: 'Failed to update obligation. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  const handleSetReminder = (obligation: Obligation) => {
    setSelectedObligation(obligation);
    
    // Set default reminder date to tomorrow since due_date is no longer available
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setReminderDate(tomorrow.toISOString().split('T')[0]);
    
    setReminderMethod('in-app');
    setReminderMessage(`Reminder: ${obligation.text}`);
    setIsReminderDialogOpen(true);
  };
  
  const handleSaveReminder = async () => {
    if (!selectedObligation || !reminderDate) return;
    
    try {
      setIsSavingReminder(true);
      
      await apiRequest({
        method: 'POST',
        url: '/api/reminders',
        data: {
          obligation_id: selectedObligation.id,
          user_id: 1, // Using default user ID
          reminder_date: new Date(reminderDate).toISOString(),
          notification_method: reminderMethod,
          message: reminderMessage,
          active: true
        }
      });
      
      toast({
        title: 'Reminder set',
        description: 'Reminder has been set successfully',
      });
      
      setIsReminderDialogOpen(false);
    } catch (error) {
      console.error('Error setting reminder:', error);
      toast({
        title: 'Error',
        description: 'Failed to set reminder. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingReminder(false);
    }
  };
  
  const handleViewDetails = (obligation: Obligation) => {
    setSelectedObligation(obligation);
    setIsDetailsDialogOpen(true);
  };
  
  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      <TopNavbar title="Obligations" />
      
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="font-montserrat font-bold text-3xl text-[#0F2B46] mb-2">Obligations</h1>
              <p className="text-gray-600">Manage and track all contractual obligations</p>
            </div>
          </div>
          
          {/* Obligations Section */}
          <div className="bg-white rounded-lg shadow-[0px_4px_20px_rgba(0,0,0,0.1)] p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <h2 className="font-montserrat font-semibold text-xl">All Obligations</h2>
              
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
              onSetReminder={handleSetReminder}
              onViewDetails={handleViewDetails}
            />
          </div>
        </div>
      </div>
      
      {/* Edit Dialog */}
      {selectedObligation && (
        <EditObligationDialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          obligation={selectedObligation}
          onSave={handleEditSave}
        />
      )}
      
      {/* Set Reminder Dialog */}
      <Dialog open={isReminderDialogOpen} onOpenChange={setIsReminderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Reminder</DialogTitle>
            <DialogDescription>
              Create a reminder for this obligation
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="reminder-date" className="text-sm font-medium">
                Reminder Date
              </label>
              <Input
                id="reminder-date"
                type="date"
                value={reminderDate}
                onChange={(e) => setReminderDate(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <label htmlFor="notification-method" className="text-sm font-medium">
                Notification Method
              </label>
              <Select value={reminderMethod} onValueChange={setReminderMethod}>
                <SelectTrigger id="notification-method">
                  <SelectValue placeholder="Select notification method" />
                </SelectTrigger>
                <SelectContent>
                  {NOTIFICATION_METHODS.map(method => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <label htmlFor="reminder-message" className="text-sm font-medium">
                Message
              </label>
              <Input
                id="reminder-message"
                value={reminderMessage}
                onChange={(e) => setReminderMessage(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReminderDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveReminder}
              disabled={!reminderDate || isSavingReminder}
            >
              {isSavingReminder ? 'Saving...' : 'Set Reminder'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Obligation Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Obligation Details</DialogTitle>
          </DialogHeader>
          
          {selectedObligation && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Status</h3>
                  <p className="mt-1">{selectedObligation.status.charAt(0).toUpperCase() + selectedObligation.status.slice(1)}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Responsible Party</h3>
                  <p className="mt-1">{selectedObligation.responsible_party || 'Not assigned'}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Clause Number</h3>
                  <p className="mt-1">{selectedObligation.clause_number || 'Not specified'}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Section Name</h3>
                  <p className="mt-1">{selectedObligation.section_name || 'Not specified'}</p>
                </div>
              </div>
              
              <div className="mt-2">
                <h3 className="text-sm font-medium text-gray-500">Description</h3>
                <p className="mt-1 text-lg font-semibold">{selectedObligation.text}</p>
              </div>
              
              {selectedObligation.original_text && (
                <div className="mt-2">
                  <h3 className="text-sm font-medium text-gray-500">Original Text from Document</h3>
                  <div className="mt-1 p-4 bg-gray-50 rounded-md border border-gray-200 max-h-40 overflow-y-auto">
                    <p className="text-sm">{selectedObligation.original_text}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between bg-[#E6F0F5] p-4 rounded-md mt-4">
                <div>
                  <p className="font-semibold">Created</p>
                  <p className="text-sm text-gray-600">{new Date(selectedObligation.created_at).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">Last Modified</p>
                  <p className="text-sm text-gray-600">{new Date(selectedObligation.last_modified).toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
              Close
            </Button>
            <Button 
              onClick={() => {
                setIsDetailsDialogOpen(false);
                setIsEditDialogOpen(true);
              }}
            >
              Edit Obligation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default Obligations;
