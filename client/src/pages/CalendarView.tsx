import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import TopNavbar from '@/components/layout/TopNavbar';
import Calendar from '@/components/calendar/Calendar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Obligation } from '@/types';
import { useObligations } from '@/hooks/useObligations';
import { getMonthDays } from '@/lib/utils';
import { MONTHS } from '@/constants';

const CalendarView: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedObligation, setSelectedObligation] = useState<Obligation | null>(null);
  const { obligations, isLoading } = useObligations({});
  const [filteredObligations, setFilteredObligations] = useState<Obligation[]>([]);
  
  // Get current month and year
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  useEffect(() => {
    if (!obligations) return;
    
    let filtered = [...obligations];
    
    if (selectedDate) {
      filtered = obligations.filter(obligation => {
        if (!obligation.due_date) return false;
        
        const dueDate = new Date(obligation.due_date);
        return (
          dueDate.getDate() === selectedDate.getDate() &&
          dueDate.getMonth() === selectedDate.getMonth() &&
          dueDate.getFullYear() === selectedDate.getFullYear()
        );
      });
    }
    
    setFilteredObligations(filtered);
  }, [obligations, selectedDate]);
  
  const handlePreviousMonth = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };
  
  const handleNextMonth = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };
  
  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
  };
  
  const handleSelectObligation = (obligation: Obligation) => {
    setSelectedObligation(obligation);
  };
  
  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      <TopNavbar title="Calendar" />
      
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="font-montserrat font-bold text-3xl text-[#0F2B46] mb-2">Calendar</h1>
              <p className="text-gray-600">View and manage obligation deadlines</p>
            </div>
            <div className="mt-4 md:mt-0 flex items-center">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePreviousMonth}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="mx-4 font-semibold">
                {MONTHS[currentMonth]} {currentYear}
              </h2>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNextMonth}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Calendar */}
            <div className="lg:col-span-3 bg-white rounded-lg shadow-[0px_4px_20px_rgba(0,0,0,0.1)] p-6">
              <Calendar 
                obligations={obligations || []} 
                onSelectDate={handleSelectDate}
                onSelectObligation={handleSelectObligation}
              />
            </div>
            
            {/* Sidebar */}
            <div className="bg-white rounded-lg shadow-[0px_4px_20px_rgba(0,0,0,0.1)] p-6 overflow-auto">
              <h2 className="font-montserrat font-semibold text-xl mb-4">
                {selectedDate 
                  ? `Obligations for ${selectedDate.toLocaleDateString()}`
                  : 'All Obligations'
                }
              </h2>
              
              {isLoading ? (
                <div className="text-center py-8">Loading obligations...</div>
              ) : filteredObligations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {selectedDate 
                    ? 'No obligations for the selected date'
                    : 'No obligations found'
                  }
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredObligations.map(obligation => (
                    <div 
                      key={obligation.id}
                      className={`
                        p-4 rounded-lg border border-gray-100 hover:border-[#26E07F] cursor-pointer
                        ${selectedObligation?.id === obligation.id ? 'bg-[#E6F0F5] border-[#26E07F]' : ''}
                      `}
                      onClick={() => setSelectedObligation(obligation)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`
                          w-3 h-3 rounded-full mt-1.5
                          ${obligation.type === 'payment' ? 'bg-blue-500' :
                            obligation.type === 'delivery' ? 'bg-green-500' :
                            obligation.type === 'reporting' ? 'bg-purple-500' :
                            obligation.type === 'compliance' ? 'bg-teal-500' :
                            obligation.type === 'renewal' ? 'bg-orange-500' :
                            obligation.type === 'termination' ? 'bg-red-500' :
                            'bg-gray-500'}
                        `} />
                        <div>
                          <p className="font-medium">{obligation.text}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-sm text-gray-500">
                              {obligation.responsible_party || 'Not assigned'}
                            </span>
                            <span className={`
                              text-xs px-2 py-1 rounded-full
                              ${obligation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                obligation.status === 'completed' ? 'bg-green-100 text-green-800' :
                                'bg-red-100 text-red-800'}
                            `}>
                              {obligation.status.charAt(0).toUpperCase() + obligation.status.slice(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default CalendarView;
