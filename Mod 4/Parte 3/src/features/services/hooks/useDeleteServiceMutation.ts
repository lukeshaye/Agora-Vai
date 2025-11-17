import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/packages/api-client';
import { useToast } from '@/components/ui/use-toast';

export const useDeleteServiceMutation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (serviceId: number) => {
      const response = await apiClient.delete(`/api/services/${serviceId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast({
        title: 'Sucesso',
        description: 'Serviço removido!',
        variant: 'default',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: `Erro ao remover serviço: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
};