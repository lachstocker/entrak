import React, { useState, useEffect } from 'react';
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
import { Switch } from "@/components/ui/switch";
import { Obligation } from '@/types';
import { OBLIGATION_STATUSES, RESPONSIBLE_PARTIES, RECURRENCE_TYPES, MONTHS, WEEKDAYS } from '@/constants';

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
  const [status, setStatus] = useState(obligation.status);
  const [responsibleParty, setResponsibleParty] = useState(obligation.responsible_party || 'not_assigned');
  const [notes, setNotes] = useState(obligation.original_text || '');
  const [clauseNumber, setClauseNumber] = useState(obligation.clause_number || '');
  const [sectionName, setSectionName] = useState(obligation.section_name || '');
  const [isRecurring, setIsRecurring] = useState(obligation.is_recurring || false);
  const [recurrenceType, setRecurrenceType] = useState<string>(obligation.recurrence_type || 'none');
  const [recurrenceInterval, setRecurrenceInterval] = useState(obligation.recurrence_interval?.toString() || '1');
  const [recurrenceDay, setRecurrenceDay] = useState(obligation.recurrence_day?.toString() || '');
  const [recurrenceMonth, setRecurrenceMonth] = useState(obligation.recurrence_month?.toString() || '');
  const [recurrenceCustomText, setRecurrenceCustomText] = useState(obligation.recurrence_custom_text || '');
  const [isSaving, setIsSaving] = useState(false);
  
  // Reset recurrence fields when recurrence type changes
  useEffect(() => {
    if (recurrenceType === 'none') {
      setIsRecurring(false);
    } else if (!isRecurring) {
      setIsRecurring(true);
    }
  }, [recurrenceType]);
  
  // Update recurrence type when isRecurring changes
  useEffect(() => {
    if (!isRecurring && recurrenceType !== 'none') {
      setRecurrenceType('none');
    } else if (isRecurring && recurrenceType === 'none') {
      setRecurrenceType('monthly');
    }
  }, [isRecurring]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Convert string form values to appropriate types
    const recurrenceIntervalNum = recurrenceInterval ? parseInt(recurrenceInterval, 10) : undefined;
    const recurrenceDayNum = recurrenceDay ? parseInt(recurrenceDay, 10) : undefined;
    const recurrenceMonthNum = recurrenceMonth ? parseInt(recurrenceMonth, 10) : undefined;
    
    // If not recurring, make sure all recurrence fields are set to default values
    const finalRecurrenceType = isRecurring ? recurrenceType : 'none';
    
    const updatedObligation: Obligation = {
      ...obligation,
      text,
      status: status as any,
      responsible_party: responsibleParty === 'not_assigned' ? undefined : responsibleParty,
      original_text: notes || undefined,
      clause_number: clauseNumber || undefined,
      section_name: sectionName || undefined,
      is_recurring: isRecurring,
      recurrence_type: finalRecurrenceType as any,
      recurrence_interval: isRecurring && recurrenceIntervalNum ? recurrenceIntervalNum : undefined,
      recurrence_day: isRecurring && recurrenceDayNum ? recurrenceDayNum : undefined,
      recurrence_month: isRecurring && recurrenceMonthNum ? recurrenceMonthNum : undefined,
      recurrence_custom_text: isRecurring && recurrenceType === 'custom' ? recurrenceCustomText : undefined,
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
                placeholder="All contractual clause wording for the obligation"
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:border-[#26E07F] focus:ring focus:ring-[#26E07F] focus:ring-opacity-50"
              />
            </div>
            
            {/* Recurrence Section */}
            <div className="md:col-span-2 border-t pt-4 mt-2">
              <h3 className="font-medium text-lg mb-4">Recurrence Settings</h3>
              
              <div className="flex items-center space-x-2 mb-4">
                <Switch 
                  id="is-recurring" 
                  checked={isRecurring} 
                  onCheckedChange={setIsRecurring} 
                />
                <Label htmlFor="is-recurring">This obligation is recurring</Label>
              </div>
              
              {isRecurring && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="recurrence-type" className="block text-sm font-semibold mb-2">
                      Recurrence Pattern
                    </Label>
                    <Select 
                      value={recurrenceType} 
                      onValueChange={(value: string) => setRecurrenceType(value)}
                    >
                      <SelectTrigger id="recurrence-type">
                        <SelectValue placeholder="Select recurrence type" />
                      </SelectTrigger>
                      <SelectContent>
                        {RECURRENCE_TYPES.filter(rt => rt.value !== 'none').map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {recurrenceType !== 'custom' && recurrenceType !== 'none' && recurrenceType !== 'ongoing' && (
                    <div>
                      <Label htmlFor="recurrence-interval" className="block text-sm font-semibold mb-2">
                        Repeat every
                      </Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          id="recurrence-interval"
                          type="number"
                          min="1"
                          value={recurrenceInterval}
                          onChange={(e) => setRecurrenceInterval(e.target.value)}
                          className="w-20"
                        />
                        <span>{recurrenceType === 'daily' 
                          ? 'day(s)' 
                          : recurrenceType === 'weekly' 
                            ? 'week(s)' 
                            : recurrenceType === 'monthly' 
                              ? 'month(s)' 
                              : 'year(s)'}</span>
                      </div>
                    </div>
                  )}
                  
                  {recurrenceType === 'ongoing' && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-600">
                        This obligation is ongoing without a specific recurring schedule. 
                        It continues indefinitely until explicitly marked as completed.
                      </p>
                    </div>
                  )}
                  
                  {recurrenceType === 'weekly' && (
                    <div className="md:col-span-2">
                      <Label className="block text-sm font-semibold mb-2">
                        On which day(s)
                      </Label>
                      <Select value={recurrenceDay.toString()} onValueChange={setRecurrenceDay}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select day" />
                        </SelectTrigger>
                        <SelectContent>
                          {WEEKDAYS.map((day, index) => (
                            <SelectItem key={index} value={index.toString()}>
                              {day}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  {recurrenceType === 'monthly' && (
                    <div>
                      <Label htmlFor="recurrence-day-month" className="block text-sm font-semibold mb-2">
                        Day of month
                      </Label>
                      <Input
                        id="recurrence-day-month"
                        type="number"
                        min="1"
                        max="31"
                        value={recurrenceDay}
                        onChange={(e) => setRecurrenceDay(e.target.value)}
                        placeholder="1-31"
                      />
                    </div>
                  )}
                  
                  {recurrenceType === 'yearly' && (
                    <>
                      <div>
                        <Label htmlFor="recurrence-month" className="block text-sm font-semibold mb-2">
                          Month
                        </Label>
                        <Select value={recurrenceMonth.toString()} onValueChange={setRecurrenceMonth}>
                          <SelectTrigger id="recurrence-month">
                            <SelectValue placeholder="Select month" />
                          </SelectTrigger>
                          <SelectContent>
                            {MONTHS.map((month, index) => (
                              <SelectItem key={index} value={(index + 1).toString()}>
                                {month}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="recurrence-day-year" className="block text-sm font-semibold mb-2">
                          Day
                        </Label>
                        <Input
                          id="recurrence-day-year"
                          type="number"
                          min="1"
                          max="31"
                          value={recurrenceDay}
                          onChange={(e) => setRecurrenceDay(e.target.value)}
                          placeholder="1-31"
                        />
                      </div>
                    </>
                  )}
                  
                  {recurrenceType === 'custom' && (
                    <div className="md:col-span-2">
                      <Label htmlFor="recurrence-custom" className="block text-sm font-semibold mb-2">
                        Custom Recurrence Pattern
                      </Label>
                      <Textarea
                        id="recurrence-custom"
                        value={recurrenceCustomText}
                        onChange={(e) => setRecurrenceCustomText(e.target.value)}
                        placeholder="Describe the recurrence pattern (e.g., 'Every third Tuesday of the month')"
                        rows={2}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
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