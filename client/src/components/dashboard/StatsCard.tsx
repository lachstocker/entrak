import React from 'react';
import { FileText, ClipboardList, Calendar, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: 'document' | 'obligation' | 'deadline' | 'success';
  trend?: {
    value: string;
    isPositive: boolean;
    text: string;
  };
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, trend }) => {
  const getIcon = () => {
    switch (icon) {
      case 'document':
        return <FileText className="text-[#0F2B46]" />;
      case 'obligation':
        return <ClipboardList className="text-[#0F2B46]" />;
      case 'deadline':
        return <Calendar className="text-[#0F2B46]" />;
      case 'success':
        return <CheckCircle className="text-[#0F2B46]" />;
      default:
        return <FileText className="text-[#0F2B46]" />;
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-[0px_4px_20px_rgba(0,0,0,0.1)] p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-500 mb-1">{title}</p>
          <h3 className="font-montserrat font-bold text-2xl">{value}</h3>
        </div>
        <div className="bg-[#E6F0F5] p-3 rounded-full">
          {getIcon()}
        </div>
      </div>
      
      {trend && (
        <div className="mt-4 text-sm">
          <span className={`${trend.isPositive ? 'text-[#26E07F]' : 'text-red-500'} font-semibold flex items-center`}>
            {trend.isPositive ? (
              <TrendingUp size={16} className="mr-1" />
            ) : (
              <TrendingDown size={16} className="mr-1" />
            )}
            {trend.value}
          </span>
          <span className="text-gray-500"> {trend.text}</span>
        </div>
      )}
    </div>
  );
};

export default StatsCard;
