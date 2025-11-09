// /packages/web/src/features/clients/hooks/useAddClientMutation.test.ts

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiClient } from '@/packages/api-client';
import { CreateClientSchema, ClientType } from '@/packages/shared-types';
import { useAddClientMutation } from './useAddClientMutation';
import { z } from 'zod';

// Mock do apiClient
vi.mock('@/packages/api-client', () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

// Tipo para o mock tipado
const mockApiClientPost = vi.mocked(apiClient.post);

// Dados de entrada e saída mockados
const validInput: z.infer<typeof CreateClientSchema> = {
  name: 'Novo Cliente',
  phone: '11987654321',
  email: 'novo@cliente.com',
};

const mockNewClient: ClientType = {
  id: '3',
  ...validInput,
};

// Instância real do QueryClient para testes
let queryClient: QueryClient;

// Função helper para criar o wrapper
const createWrapper = () => {
  // Cria uma nova instância para isolar os testes
  queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Desliga retentativas
      },
      mutations: {
        retry: false, // Desliga retentativas
      },
    },
  });

  // Mock da função de invalidação para podermos espioná-la
  vi.spyOn(queryClient, 'invalidateQueries');

  // eslint-disable-next-line react/display-name
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

// Limpa os mocks
beforeEach(() => {
  vi.resetAllMocks();
  // Esconde logs de erro esperados (ex: falha na API ou validação)
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useAddClientMutation', () => {
  // Teste conforme PTE 2.15 e 2.16
  it('deve adicionar um cliente e invalidar a query "clients" com sucesso', async () => {
    // Arrange
    // Configura o mock da API para sucesso
    mockApiClientPost.mockResolvedValue(mockNewClient);
    const wrapper = createWrapper();
    const { result } = renderHook(() => useAddClientMutation(), { wrapper });

    // Act
    // Chama a função de mutação
    await result.current.mutateAsync(validInput);

    // Assert
    // Espera a mutação ser concluída
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verifica se a API foi chamada corretamente
    expect(mockApiClientPost).toHaveBeenCalledTimes(1);
    expect(mockApiClientPost).toHaveBeenCalledWith('/api/clients', validInput);

    // Verifica se os dados retornados estão corretos
    expect(result.current.data).toEqual(mockNewClient);

    // Verifica se a query 'clients' foi invalidada (PTE 2.15)
    expect(queryClient.invalidateQueries).toHaveBeenCalledTimes(1);
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['clients'],
    });
  });

  // Teste conforme DSpP 2.16 (validação falha)
  it('deve falhar na validação Zod antes de chamar a API', async () => {
    // Arrange
    // Dados inválidos (ex: nome faltando)
    const invalidInput = { phone: '123456', email: 'invalido' };
    
    const wrapper = createWrapper();
    const { result } = renderHook(() => useAddClientMutation(), { wrapper });

    // Act & Assert
    // Espera que a mutação seja rejeitada
    await expect(result.current.mutateAsync(invalidInput as any)).rejects.toThrow(
      'Não foi possível adicionar o cliente.'
    );

    // Espera o estado do hook refletir o erro
    await waitFor(() => expect(result.current.isError).toBe(true));

    // Verifica se a API NUNCA foi chamada
    expect(mockApiClientPost).not.toHaveBeenCalled();

    // Verifica se a query NUNCA foi invalidada
    expect(queryClient.invalidateQueries).not.toHaveBeenCalled();
  });

  it('deve falhar se a chamada da API falhar', async () => {
    // Arrange
    const mockError = new Error('Falha na API');
    mockApiClientPost.mockRejectedValue(mockError); // Configura o mock da API para falha

    const wrapper = createWrapper();
    const { result } = renderHook(() => useAddClientMutation(), { wrapper });

    // Act & Assert
    // Espera que a mutação seja rejeitada
    await expect(result.current.mutateAsync(validInput)).rejects.toThrow(
      'Não foi possível adicionar o cliente.'
    );

    // Espera o estado do hook refletir o erro
    await waitFor(() => expect(result.current.isError).toBe(true));

    // Verifica se a API foi chamada
    expect(mockApiClientPost).toHaveBeenCalledTimes(1);

    // Verifica se a query NUNCA foi invalidada
    expect(queryClient.invalidateQueries).not.toHaveBeenCalled();
  });
});