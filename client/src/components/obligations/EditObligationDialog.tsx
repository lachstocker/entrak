import React, { useState } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Obligation } from '@/types';
import { OBLIGATION_TYPES, OBLIGATION_STATUSES, OBLIGATION_PRIORITIES, RESPONSIBLE_PARTIES } from '@/constants';

interface EditObligationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  obligation: Obligation;
  onSave: (updatedObligation: Obligation) => void;
}

const EditObligationDialog: React.FC<EditObligationDialogProps> = ({ 
  isOpen, 
  onClose, 
  obligation,
  onSave
}) => {
  const [text, setText] = useState(obligation.text);
  const [type, setType] = useState(obligation.type);
  const [status, setStatus] = useState(obligation.status);
  const [dueDate, setDueDate] = useState(
    obligation.due_date 
      ? new Date(obligation.due_date).toISOString().split('T')[0] 
      : ''
  );
  const [responsibleParty, setResponsibleParty] = useState(obligation.responsible_party || 'not_assigned');
  const [priority, setPriority] = useState(obligation.priority);
  const [notes, setNotes] = useState(obligation.original_text || '');
  const [clauseNumber, setClauseNumber] = useState(obligation.clause_number || '');
  const [sectionName, setSectionName] = useState(obligation.section_name || '');
  const [isSaving, setIsSaving] = useState(false);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const updatedObligation: Obligation = {
      ...obligation,
      text,
      type: type as any,
      status: status as any,
      due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
      responsible_party: responsibleParty === 'not_assigned' ? undefined : responsibleParty,
      priority: priority as any,
      original_text: notes || undefined,
      clause_number: clauseNumber || undefined,
      section_name: sectionName || undefined,
      modified_by: 1 // Default user ID
    };
    
    onSave(updatedObligation);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Edit Obligation</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            <div className="md:col-span-2">
              <Label htmlFor="obligation-text" className="block text-sm font-semibold mb-2">
                Obligation Description
              </Label>
              <Textarea
                id="obligation-text"
                rows={3}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter obligation description"
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:border-[#26E07F] focus:ring focus:ring-[#26E07F] focus:ring-opacity-50"
              />
            </div>
            
            <div>
              <Label htmlFor="obligation-type" className="block text-sm font-semibold mb-2">
                Type
              </Label>
              <Select value={type} onValueChange={value => setType(value as any)}>
                <SelectTrigger id="obligation-type" className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {OBLIGATION_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="obligation-status" className="block text-sm font-semibold mb-2">
                Status
              </Label>
              <Select value={status} onValueChange={value => setStatus(value as any)}>
                <SelectTrigger id="obligation-status" className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {OBLIGATION_STATUSES.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="obligation-date" className="block text-sm font-semibold mb-2">
                Due Date
              </Label>
              <Input
                type="date"
                id="obligation-date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:border-[#26E07F] focus:ring focus:ring-[#26E07F] focus:ring-opacity-50"
              />
            </div>
            
            <div>
              <Label htmlFor="obligation-responsible" className="block text-sm font-semibold mb-2">
                Responsible Party
              </Label>
              <Select value={responsibleParty} onValueChange={setResponsibleParty}>
                <SelectTrigger id="obligation-responsible" className="w-full">
                  <SelectValue placeholder="Select responsible party" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_assigned">Not Assigned</SelectItem>
                  {RESPONSIBLE_PARTIES.map(party => (
                    <SelectItem key={party.value} value={party.value}>
                      {party.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="obligation-priority" className="block text-sm font-semibold mb-2">
                Priority
              </Label>
              <Select value={priority} onValueChange={value => setPriority(value as any)}>
                <SelectTrigger id="obligation-priority" className="w-full">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {OBLIGATION_PRIORITIES.map(priority => (
                    <SelectItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="obligation-clause" className="block text-sm font-semibold mb-2">
                Clause Number
              </Label>
              <Input
                id="obligation-clause"
                value={clauseNumber}
                onChange={(e) => setClauseNumber(e.target.value)}
                placeholder="e.g., 5.2.1"
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:border-[#26E07F] focus:ring focus:ring-[#26E07F] focus:ring-opacity-50"
              />
            </div>
            
            <div>
              <Label htmlFor="obligation-section" className="block text-sm font-semibold mb-2">
                Section Name
              </Label>
              <Input
                id="obligation-section"
                value={sectionName}
                onChange={(e) => setSectionName(e.target.value)}
                placeholder="e.g., Termination Rights"
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:border-[#26E07F] focus:ring focus:ring-[#26E07F] focus:ring-opacity-50"
              />
            </div>
            
            <div className="md:col-span-2">
              <Label htmlFor="obligation-notes" className="block text-sm font-semibold mb-2">
                Original Text
              </Label>
              <Textarea
                id="obligation-notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Original text from document"
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:border-[#26E07F] focus:ring focus:ring-[#26E07F] focus:ring-opacity-50"
              />
            </div>
            
            {obligation.confidence_score !== undefined && (
              <div className="md:col-span-2">
                <div className="flex items-center justify-between bg-[#E6F0F5] p-4 rounded-md">
                  <div>
                    <p className="font-semibold">AI Confidence Score</p>
                    <p className="text-sm text-gray-600">How confident the AI was in extracting this obligation</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-[#0F2B46]">{obligation.confidence_score}%</span>
                    <p className="text-sm text-gray-600">
                      {obligation.confidence_score >= 90 ? 'High Confidence' :
                       obligation.confidence_score >= 70 ? 'Medium Confidence' :
                       'Low Confidence'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isSaving || !text}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditObligationDialog;
