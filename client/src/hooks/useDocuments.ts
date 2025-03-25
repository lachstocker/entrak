import { useQuery } from '@tanstack/react-query';
import { Document } from '@/types';

export function useDocuments(userId?: number, projectId?: number) {
  const queryParams = new URLSearchParams();
  
  if (userId) {
    queryParams.append('userId', userId.toString());
  }
  
  if (projectId) {
    queryParams.append('projectId', projectId.toString());
  }
  
  const endpoint = `/api/documents${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  
  const { data, isLoading, error } = useQuery<Document[]>({
    queryKey: ['/api/documents', userId, projectId],
    refetchOnWindowFocus: false,
    staleTime: 60000, // 1 minute
  });
  
  return {
    documents: data,
    isLoading,
    error
  };
}
