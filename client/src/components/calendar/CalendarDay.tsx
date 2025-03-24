import React from 'react';
import { format } from 'date-fns';
import { Obligation } from '@/types';
import { truncateText } from '@/lib/utils';
import ObligationBadge from '../obligations/ObligationBadge';

interface CalendarDayProps {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  obligations: Obligation[];
  onSelect?: () => void;
  onSelectObligation?: (obligation: Obligation) => void;
}

const CalendarDay: React.FC<CalendarDayProps> = ({ 
  date, 
  isCurrentMonth, 
  isToday,
  obligations,
  onSelect,
  onSelectObligation
}) => {
  const dayNumber = date.getDate();
  const monthShort = format(date, 'MMM');
  
  const handleSelectObligation = (e: React.MouseEvent, obligation: Obligation) => {
    e.stopPropagation();
    if (onSelectObligation) {
      onSelectObligation(obligation);
    }
  };
  
  return (
    <div 
      className={`
        lg:p-2 p-3 rounded-lg border 
        ${isToday ? 'border-[#0F2B46] bg-[#E6F0F5]' : 'border-[#E6F0F5]'} 
        ${!isCurrentMonth ? 'opacity-40' : ''} 
        hover:border-[#26E07F] transition-colors cursor-pointer
      `}
      onClick={onSelect}
    >
      <div className="lg:text-center">
        <div className="flex lg:block items-center">
          <span className="font-semibold lg:mb-2 lg:text-lg">
            {isToday ? 'Today ' : ''}{dayNumber}
          </span>
          <span className="ml-2 lg:ml-0 text-sm text-gray-500 lg:block">
            {monthShort}
          </span>
        </div>
        
        {obligations.length > 0 && (
          <div className="mt-2 space-y-1">
            {obligations.slice(0, 2).map(obligation => (
              <div 
                key={obligation.id}
                className={`text-xs p-1 rounded cursor-pointer ${
                  obligation.type === 'payment' ? 'bg-blue-100 text-blue-800' :
                  obligation.type === 'delivery' ? 'bg-green-100 text-green-800' :
                  obligation.type === 'reporting' ? 'bg-purple-100 text-purple-800' :
                  obligation.type === 'compliance' ? 'bg-teal-100 text-teal-800' :
                  obligation.type === 'renewal' ? 'bg-orange-100 text-orange-800' :
                  obligation.type === 'termination' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}
                onClick={(e) => handleSelectObligation(e, obligation)}
              >
                <div className="flex items-center">
                  <span className={`w-2 h-2 rounded-full mr-1 ${
                    obligation.type === 'payment' ? 'bg-blue-800' :
                    obligation.type === 'delivery' ? 'bg-green-800' :
                    obligation.type === 'reporting' ? 'bg-purple-800' :
                    obligation.type === 'compliance' ? 'bg-teal-800' :
                    obligation.type === 'renewal' ? 'bg-orange-800' :
                    obligation.type === 'termination' ? 'bg-red-800' :
                    'bg-gray-800'
                  }`}></span>
                  <span className="truncate">{truncateText(obligation.text, 30)}</span>
                </div>
              </div>
            ))}
            
            {obligations.length > 2 && (
              <div className="text-xs text-gray-500 mt-1 text-center">
                +{obligations.length - 2} more
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarDay;
