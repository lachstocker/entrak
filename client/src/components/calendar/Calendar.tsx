import React, { useState, useMemo } from 'react';
import { format, getMonth, getYear, isSameDay, isSameMonth } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CalendarDay from './CalendarDay';
import { getMonthDays } from '@/lib/utils';
import { MONTHS, WEEKDAYS } from '@/constants';
import { Obligation } from '@/types';

interface CalendarProps {
  obligations: Obligation[];
  onSelectDate?: (date: Date) => void;
  onSelectObligation?: (obligation: Obligation) => void;
}

const Calendar: React.FC<CalendarProps> = ({ 
  obligations, 
  onSelectDate,
  onSelectObligation
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const currentMonth = getMonth(currentDate);
  const currentYear = getYear(currentDate);
  
  const daysInMonth = useMemo(() => 
    getMonthDays(currentYear, currentMonth), 
    [currentYear, currentMonth]
  );
  
  // Group obligations by date for easier access
  const obligationsByDate = useMemo(() => {
    const map = new Map<string, Obligation[]>();
    
    obligations.forEach(obligation => {
      if (obligation.due_date) {
        const date = new Date(obligation.due_date);
        const dateStr = format(date, 'yyyy-MM-dd');
        
        if (!map.has(dateStr)) {
          map.set(dateStr, []);
        }
        
        map.get(dateStr)?.push(obligation);
      }
    });
    
    return map;
  }, [obligations]);
  
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
  
  const getObligationsForDay = (day: Date): Obligation[] => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return obligationsByDate.get(dateStr) || [];
  };
  
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-montserrat font-semibold text-lg">
          {MONTHS[currentMonth]} {currentYear}
        </h3>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handlePreviousMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleNextMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {WEEKDAYS.map(day => (
          <div key={day} className="text-center text-sm font-semibold text-gray-500 hidden lg:block">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-2">
        {daysInMonth.map((day, index) => (
          <CalendarDay 
            key={index}
            date={day}
            isCurrentMonth={isSameMonth(day, currentDate)}
            isToday={isSameDay(day, new Date())}
            obligations={getObligationsForDay(day)}
            onSelect={() => onSelectDate && onSelectDate(day)}
            onSelectObligation={onSelectObligation}
          />
        ))}
      </div>
    </div>
  );
};

export default Calendar;
