import { useQuery } from '@tanstack/react-query';

export type PartyOption = {
  value: string;
  label: string;
};

export function useResponsibleParties() {
  const { data, isLoading, error } = useQuery<string[], Error, PartyOption[]>({
    queryKey: ['/api/obligations/responsible-parties'],
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    refetchOnWindowFocus: false,
    select: (responsibleParties) => {
      // Convert to options format with value and label
      return responsibleParties.map(party => ({
        value: party,
        label: party
      }));
    }
  });
  
  return {
    responsibleParties: data || [],
    isLoading,
    error,
  };
}