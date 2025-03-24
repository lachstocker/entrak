import { useQuery } from '@tanstack/react-query';
import { Document } from '@/types';

export function useDocuments(userId?: number) {
  const queryParams = new URLSearchParams();
  
  if (userId) {
    queryParams.append('userId', userId.toString());
  }
  
  const endpoint = `/api/documents${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  
  const { data, isLoading, error } = useQuery<Document[]>({
    queryKey: [endpoint],
    refetchOnWindowFocus: false,
    staleTime: 60000, // 1 minute
  });
  
  return {
    documents: data,
    isLoading,
    error
  };
}
