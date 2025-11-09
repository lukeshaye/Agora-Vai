// /packages/web/src/features/clients/hooks/useAddClientMutation.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/packages/api-client';
import { CreateClientSchema, ClientType } from '@/packages/shared-types';
import { z } from 'zod';

// O tipo de entrada para a mutação é inferido do schema Zod
type AddClientInput = z.infer<typeof CreateClientSchema>;

/**
 * Define a função de mutação assíncrona que envia os dados para a API.
 * Esta é a implementação do "Command" (Escrita)
 * A rota da API (conforme src/worker/index.ts) é POST /api/clients.
 */
const addClient = async (clientData: AddClientInput): Promise<ClientType> => {
  try {
    // CORREÇÃO: Validação executada dentro da função de mutação (DSpP 2.16)
    // Esta camada não deve confiar que a camada de UI (formulário)
    // realizou a validação.
    const validatedData = CreateClientSchema.parse(clientData);

    // O apiClient faz a chamada POST para o backend com os dados validados
    const newClient = await apiClient.post<ClientType>('/api/clients', validatedData);
    return newClient;
  } catch (error) {
    console.error('Erro ao adicionar cliente (validação ou API):', error);
    // Lança o erro (seja de validação Zod ou da API)
    throw new Error('Não foi possível adicionar o cliente.');
  }
};

/**
 * Hook (Mutation) para adicionar um novo cliente.
 * * Este hook encapsula a lógica de escrita (INSERT)
 * e implementa o Nível 3 (Estado do Servidor) do PGEC (2.13) usando useMutation.
 * Ele substitui a lógica de `addClient` que existia no `store.ts` (Zustand).
 */
export const useAddClientMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<ClientType, Error, AddClientInput>({
    mutationFn: addClient,

    /**
     * Em caso de sucesso (onSuccess), invalida a query 'clients'.
     * Isso atende ao princípio PTE (2.15), garantindo que
     * qualquer componente que usa `useClientsQuery` (como a `ClientsDataTable.tsx`)
     * buscará os dados atualizados automaticamente.
     */
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
};