import React from 'react';
import { Badge } from '@/components/ui/badge';
import { OBLIGATION_TYPES } from '@/constants';

interface ObligationBadgeProps {
  type: string;
}

const ObligationBadge: React.FC<ObligationBadgeProps> = ({ type }) => {
  const getTypeLabel = () => {
    const typeObj = OBLIGATION_TYPES.find(t => t.value === type);
    return typeObj ? typeObj.label : type.charAt(0).toUpperCase() + type.slice(1);
  };
  
  return (
    <Badge variant={type as any}>
      {getTypeLabel()}
    </Badge>
  );
};

export default ObligationBadge;
