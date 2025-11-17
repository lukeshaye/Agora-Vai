import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/packages/api-client';
import { CreateServiceType } from '@/packages/shared-types';
import { useToast } from '@/components/ui/use-toast';

export const useAddServiceMutation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateServiceType) => {
      const response = await apiClient.post('/api/services', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast({
        title: 'Sucesso',
        description: 'Serviço criado com sucesso!',
        variant: 'default',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: `Erro ao criar serviço: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
};