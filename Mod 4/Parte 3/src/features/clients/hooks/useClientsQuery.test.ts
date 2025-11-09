// /packages/web/src/features/clients/hooks/useClientsQuery.test.ts

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiClient } from '@/packages/api-client';
import type { ClientType } from '@/packages/shared-types';
import { useClientsQuery } from './useClientsQuery';

[cite_start]// Mock do apiClient [cite: 63]
vi.mock('@/packages/api-client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

// Tipo para o mock tipado
const mockApiClientGet = vi.mocked(apiClient.get);

// Dados mockados para os testes
const mockClients: ClientType[] = [
  {
    id: '1',
    name: 'Cliente Teste 1',
    phone: '11999998888',
    email: 'cliente1@teste.com',
  },
  {
    id: '2',
    name: 'Cliente Teste 2',
    phone: '11777776666',
    email: 'cliente2@teste.com',
  },
];

// Função helper para criar o wrapper com QueryClientProvider
// Isso é necessário para qualquer hook do React Query
const createWrapper = () => {
  // Cria uma nova instância do QueryClient para cada teste garantir o isolamento
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Desliga retentativas para os testes serem mais rápidos e previsíveis
        retry: false,
      },
    },
  });
  
  // eslint-disable-next-line react/display-name
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

// Limpa os mocks antes de cada teste
beforeEach(() => {
  vi.resetAllMocks();
  // Esconde logs de erro esperados (ex: falha na API)
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useClientsQuery', () => {
  [cite_start]// Teste conforme PTE 2.15 [cite: 117, 118]
  it('deve buscar e retornar os dados dos clientes com sucesso', async () => {
    // Arrange
    // Configura o mock do apiClient.get para retornar os dados com sucesso
    mockApiClientGet.mockResolvedValue(mockClients);

    // Act
    // Renderiza o hook dentro do provider
    const { result } = renderHook(() => useClientsQuery(), {
      wrapper: createWrapper(),
    });

    // Assert
    // Espera o hook mudar para o estado 'isSuccess'
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verifica se os dados retornados são os dados mockados
    expect(result.current.data).toEqual(mockClients);
    // Verifica se a função de API correta foi chamada
    expect(mockApiClientGet).toHaveBeenCalledTimes(1);
    expect(mockApiClientGet).toHaveBeenCalledWith('/api/clients');
    // Verifica os estados
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  [cite_start]// Teste conforme PTE 2.15 [cite: 117, 118]
  it('deve retornar um estado de erro se a chamada da API falhar', async () => {
    // Arrange
    // Configura o mock do apiClient.get para rejeitar com um erro
    const mockError = new Error('Falha na API');
    mockApiClientGet.mockRejectedValue(mockError);

    // Act
    const { result } = renderHook(() => useClientsQuery(), {
      wrapper: createWrapper(),
    });

    // Assert
    // Espera o hook mudar para o estado 'isError'
    await waitFor(() => expect(result.current.isError).toBe(true));

    // Verifica se o erro é o erro mockado
    expect(result.current.error).toBe(mockError);
    // Verifica os estados
    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSuccess).toBe(false);
    // Verifica se a função de API foi chamada
    expect(mockApiClientGet).toHaveBeenCalledTimes(1);
    expect(mockApiClientGet).toHaveBeenCalledWith('/api/clients');
  });
});