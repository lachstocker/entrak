import { useQuery } from '@tanstack/react-query';
import { Project } from '@shared/schema';

export function useProjects() {
  const { data, isLoading, error } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    refetchOnWindowFocus: false,
    staleTime: 60000, // 1 minute
  });

  return {
    projects: data || [],
    isLoading,
    error
  };
}