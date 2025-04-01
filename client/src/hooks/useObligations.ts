import { useQuery } from '@tanstack/react-query';
import { Obligation, FilterState } from '@/types';

export function useObligations(filters: FilterState) {
  const queryParams = new URLSearchParams();
  
  if (filters.type && filters.type !== 'all') {
    queryParams.append('type', filters.type);
  }
  
  if (filters.status && filters.status !== 'all') {
    queryParams.append('status', filters.status);
  }
  
  if (filters.dueDateStart) {
    queryParams.append('dueDateStart', filters.dueDateStart);
  }
  
  if (filters.dueDateEnd) {
    queryParams.append('dueDateEnd', filters.dueDateEnd);
  }
  
  if (filters.responsibleParty) {
    queryParams.append('responsibleParty', filters.responsibleParty);
  }
  
  if (filters.documentId) {
    queryParams.append('documentId', filters.documentId.toString());
  }

  if (filters.isRecurring !== undefined) {
    queryParams.append('isRecurring', filters.isRecurring.toString());
  }
  
  const endpoint = `/api/obligations${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  
  const { data, isLoading, error } = useQuery<Obligation[]>({
    queryKey: [endpoint],
    refetchOnWindowFocus: false,
    staleTime: 60000, // 1 minute
  });
  
  return {
    obligations: data,
    isLoading,
    error
  };
}
