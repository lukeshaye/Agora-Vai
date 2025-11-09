import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/packages/api-client';
import { ClientSchema, ClientType } from '@/packages/shared-types';

/**
 * Define a função assíncrona para atualizar um cliente.
 * Valida os dados usando o ClientSchema antes de enviar para a API.
 */
const updateClient = async (clientData: ClientType) => {
  // 1. Garantir que temos um ID para a rota PUT/PATCH
  if (!clientData.id) {
    throw new Error('O ID do cliente é obrigatório para atualização.');
  }

  // 2. Validar os dados com Zod (Princípio DSpP 2.16)
  const validatedData = ClientSchema.parse(clientData);

  // 3. Chamar a API (ex: PUT /api/clients/:id)
  const { data } = await apiClient.put(
    `/clients/${validatedData.id}`,
    validatedData,
  );
  return data;
};

/**
 * Hook (Command/Mutation) para atualizar um cliente existente.
 *
 * Implementa os princípios:
 * - CQRS (2.12): Este é um "Command" (Escrita).
 * - PGEC (2.13): Nível 3 (Estado do Servidor) usando useMutation.
 * - DSpP (2.16): Valida os dados com ClientSchema.
 * - PTE (2.15): Invalida a query 'clients' no onSuccess.
 */
export const useUpdateClientMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateClient,
    onSuccess: () => {
      // 4. Invalidar a query de clientes para atualizar a UI (Princípio PTE 2.15)
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
    onError: (error) => {
      // O componente que usa este hook pode tratar o erro (ex: exibir toast)
      console.error('Erro ao atualizar cliente:', error);
    },
  });
};