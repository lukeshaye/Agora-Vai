import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/packages/api-client';

/**
 * Define a função assíncrona para excluir um cliente.
 * Recebe o ID do cliente a ser excluído.
 */
const deleteClient = async (clientId: number) => {
  // 1. Chamar a API (ex: DELETE /api/clients/:id)
  const { data } = await apiClient.delete(`/clients/${clientId}`);
  return data;
};

/**
 * Hook (Command/Mutation) para excluir um cliente existente.
 *
 * Implementa os princípios:
 * - CQRS (2.12): Este é um "Command" (Escrita).
 * - PGEC (2.13): Nível 3 (Estado do Servidor) usando useMutation.
 * - PTE (2.15): Invalida a query 'clients' no onSuccess.
 */
export const useDeleteClientMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteClient,
    onSuccess: () => {
      // 2. Invalidar a query de clientes para atualizar a UI (Princípio PTE 2.15)
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
    onError: (error) => {
      // O componente que usa este hook pode tratar o erro (ex: exibir toast)
      console.error('Erro ao excluir cliente:', error);
    },
  });
};