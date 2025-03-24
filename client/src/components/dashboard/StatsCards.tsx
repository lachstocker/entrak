import React from 'react';
import StatsCard from './StatsCard';
import { StatsData } from '@/types';

interface StatsCardsProps {
  stats: StatsData;
}

const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatsCard 
        title="Total Documents" 
        value={stats.totalDocuments} 
        icon="document"
        trend={{
          value: "+3 new",
          isPositive: true,
          text: "this month"
        }}
      />
      
      <StatsCard 
        title="Active Obligations" 
        value={stats.activeObligations} 
        icon="obligation"
        trend={{
          value: "64%",
          isPositive: true,
          text: "on schedule"
        }}
      />
      
      <StatsCard 
        title="Upcoming Deadlines" 
        value={stats.upcomingDeadlines} 
        icon="deadline"
        trend={{
          value: "3",
          isPositive: false,
          text: "due this week"
        }}
      />
      
      <StatsCard 
        title="Processing Success" 
        value={`${stats.processingSuccess}%`} 
        icon="success"
        trend={{
          value: "+2.5%",
          isPositive: true,
          text: "from last month"
        }}
      />
    </div>
  );
};

export default StatsCards;
