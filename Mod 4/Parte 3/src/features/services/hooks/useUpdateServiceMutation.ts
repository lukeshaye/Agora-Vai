import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/packages/api-client';
import { ServiceType } from '@/packages/shared-types';
import { useToast } from '@/components/ui/use-toast';

export const useUpdateServiceMutation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: ServiceType) => {
      const response = await apiClient.put(`/api/services/${data.id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast({
        title: 'Sucesso',
        description: 'Serviço atualizado com sucesso!',
        variant: 'default',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: `Erro ao atualizar serviço: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
};