import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useServicesQuery } from './useServicesQuery';
import { apiClient } from '@/packages/api-client';

// Mock do apiClient conforme seção 3.1 do Plano
vi.mock('@/packages/api-client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe('useServicesQuery', () => {
  // Limpa os mocks antes de cada teste
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Wrapper com QueryClientProvider necessário para hooks do React Query
  const createWrapper = () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false, // Desabilita retentativas para testes mais rápidos de erro
        },
      },
    });
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  it('deve buscar e retornar a lista de serviços com sucesso', async () => {
    const mockData = [
      { id: 1, name: 'Corte de Cabelo', price: 50, duration: 30, color: '#000000' },
      { id: 2, name: 'Barba', price: 30, duration: 20, color: '#ffffff' },
    ];

    // Simula resposta de sucesso da API
    (apiClient.get as any).mockResolvedValueOnce({ data: mockData });

    const { result } = renderHook(() => useServicesQuery(), {
      wrapper: createWrapper(),
    });

    // Aguarda o hook resolver com sucesso
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verificações
    expect(result.current.data).toEqual(mockData);
    expect(apiClient.get).toHaveBeenCalledWith('/api/services');
  });

  it('deve lidar com erros quando a chamada da API falhar', async () => {
    const mockError = new Error('Erro ao buscar serviços');

    // Simula erro da API
    (apiClient.get as any).mockRejectedValueOnce(mockError);

    const { result } = renderHook(() => useServicesQuery(), {
      wrapper: createWrapper(),
    });

    // Aguarda o hook entrar em estado de erro
    await waitFor(() => expect(result.current.isError).toBe(true));

    // Verificações
    expect(result.current.error).toBeDefined();
    expect(apiClient.get).toHaveBeenCalledWith('/api/services');
  });
});