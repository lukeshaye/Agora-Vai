// /packages/web/src/features/clients/hooks/useUpdateClientMutation.test.ts

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiClient } from '@/packages/api-client';
import { ClientType } from '@/packages/shared-types';
import { useUpdateClientMutation } from './useUpdateClientMutation';

// Mock do apiClient
vi.mock('@/packages/api-client', () => ({
  apiClient: {
    put: vi.fn(),
  },
}));

// Tipo para o mock tipado
const mockApiClientPut = vi.mocked(apiClient.put);

// Dados de entrada e saída mockados
const validClientData: ClientType = {
  id: '1',
  name: 'Cliente Atualizado',
  phone: '11911112222',
  email: 'cliente@atualizado.com',
};

const updatedClientResponse: ClientType = {
  ...validClientData,
};

// Instância real do QueryClient para testes
let queryClient: QueryClient;

// Função helper para criar o wrapper
const createWrapper = () => {
  queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  // Mock da função de invalidação
  vi.spyOn(queryClient, 'invalidateQueries');

  // eslint-disable-next-line react/display-name
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

// Limpa os mocks
beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useUpdateClientMutation', () => {
  // Teste conforme PTE 2.15
  it('deve atualizar um cliente e invalidar a query "clients" com sucesso', async () => {
    // Arrange
    // Configura o mock da API para sucesso
    mockApiClientPut.mockResolvedValue({ data: updatedClientResponse });
    const wrapper = createWrapper();
    const { result } = renderHook(() => useUpdateClientMutation(), { wrapper });

    // Act
    await result.current.mutateAsync(validClientData);

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verifica se a API foi chamada corretamente
    expect(mockApiClientPut).toHaveBeenCalledTimes(1);
    expect(mockApiClientPut).toHaveBeenCalledWith(
      `/clients/${validClientData.id}`,
      validClientData,
    );

    // Verifica se os dados retornados estão corretos
    expect(result.current.data).toEqual(updatedClientResponse);

    // Verifica se a query 'clients' foi invalidada (PTE 2.15)
    expect(queryClient.invalidateQueries).toHaveBeenCalledTimes(1);
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['clients'],
    });
  });

  // Teste conforme DSpP 2.16 (validação Zod falha)
  it('deve falhar na validação Zod antes de chamar a API', async () => {
    // Arrange
    // Dados inválidos (email inválido)
    const invalidData: ClientType = {
      id: '2',
      name: 'Cliente Inválido',
      phone: '123456',
      email: 'email-invalido',
    };
    
    const wrapper = createWrapper();
    const { result } = renderHook(() => useUpdateClientMutation(), { wrapper });

    // Act & Assert
    // Espera que a mutação seja rejeitada (devido ao Zod.parse)
    await expect(result.current.mutateAsync(invalidData)).rejects.toThrow();

    // Espera o estado do hook refletir o erro
    await waitFor(() => expect(result.current.isError).toBe(true));

    // Verifica se a API NUNCA foi chamada
    expect(mockApiClientPut).not.toHaveBeenCalled();

    // Verifica se a query NUNCA foi invalidada
    expect(queryClient.invalidateQueries).not.toHaveBeenCalled();
  });

  // Teste da guarda interna (validação de ID)
  it('deve falhar se o ID do cliente não for fornecido', async () => {
    // Arrange
    const dataWithoutId = {
      name: 'Cliente Sem ID',
      phone: '123456789',
      email: 'semid@teste.com',
    };
    
    const wrapper = createWrapper();
    const { result } = renderHook(() => useUpdateClientMutation(), { wrapper });

    // Act & Assert
    // Espera que a mutação seja rejeitada com a mensagem específica
    await expect(result.current.mutateAsync(dataWithoutId as any)).rejects.toThrow(
      'O ID do cliente é obrigatório para atualização.'
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockApiClientPut).not.toHaveBeenCalled();
    expect(queryClient.invalidateQueries).not.toHaveBeenCalled();
  });

  it('deve falhar se a chamada da API falhar', async () => {
    // Arrange
    const mockError = new Error('Falha na API');
    mockApiClientPut.mockRejectedValue(mockError); // Configura o mock da API para falha

    const wrapper = createWrapper();
    const { result } = renderHook(() => useUpdateClientMutation(), { wrapper });

    // Act & Assert
    // Espera que a mutação seja rejeitada
    await expect(result.current.mutateAsync(validClientData)).rejects.toThrow(mockError);

    // Espera o estado do hook refletir o erro
    await waitFor(() => expect(result.current.isError).toBe(true));

    // Verifica se a API foi chamada
    expect(mockApiClientPut).toHaveBeenCalledTimes(1);

    // Verifica se a query NUNCA foi invalidada
    expect(queryClient.invalidateQueries).not.toHaveBeenCalled();
  });
});