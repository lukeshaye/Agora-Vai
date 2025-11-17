import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/packages/api-client';
import { ServiceType } from '@/packages/shared-types';

export const useServicesQuery = () => {
  return useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const response = await apiClient.get<ServiceType[]>('/api/services');
      return response.data;
    },
  });
};