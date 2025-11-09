// /packages/web/src/features/clients/hooks/useDeleteClientMutation.test.ts

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiClient } from '@/packages/api-client';
import { useDeleteClientMutation } from './useDeleteClientMutation';

// Mock do apiClient
vi.mock('@/packages/api-client', () => ({
  apiClient: {
    delete: vi.fn(),
  },
}));

// Tipo para o mock tipado
const mockApiClientDelete = vi.mocked(apiClient.delete);

// ID mockado para os testes
const clientIdToDelete = 123;

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

describe('useDeleteClientMutation', () => {
  // Teste conforme PTE 2.15
  it('deve excluir um cliente e invalidar a query "clients" com sucesso', async () => {
    // Arrange
    // Configura o mock da API para sucesso
    mockApiClientDelete.mockResolvedValue({ data: { success: true } });
    const wrapper = createWrapper();
    const { result } = renderHook(() => useDeleteClientMutation(), { wrapper });

    // Act
    await result.current.mutateAsync(clientIdToDelete);

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verifica se a API foi chamada corretamente
    expect(mockApiClientDelete).toHaveBeenCalledTimes(1);
    expect(mockApiClientDelete).toHaveBeenCalledWith(
      `/clients/${clientIdToDelete}`,
    );

    [cite_start]// Verifica se a query 'clients' foi invalidada (PTE 2.15) [cite: 76]
    expect(queryClient.invalidateQueries).toHaveBeenCalledTimes(1);
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['clients'],
    });
  });

  it('deve falhar se a chamada da API falhar', async () => {
    // Arrange
    const mockError = new Error('Falha na API');
    mockApiClientDelete.mockRejectedValue(mockError); // Configura o mock da API para falha

    const wrapper = createWrapper();
    const { result } = renderHook(() => useDeleteClientMutation(), { wrapper });

    // Act & Assert
    // Espera que a mutação seja rejeitada
    await expect(result.current.mutateAsync(clientIdToDelete)).rejects.toThrow(mockError);

    // Espera o estado do hook refletir o erro
    await waitFor(() => expect(result.current.isError).toBe(true));

    // Verifica se a API foi chamada
    expect(mockApiClientDelete).toHaveBeenCalledTimes(1);

    // Verifica se a query NUNCA foi invalidada
    expect(queryClient.invalidateQueries).not.toHaveBeenCalled();
  });
});