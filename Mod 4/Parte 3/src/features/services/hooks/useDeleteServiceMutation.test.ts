import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useDeleteServiceMutation } from './useDeleteServiceMutation';
import { apiClient } from '@/packages/api-client';

// Mock do apiClient
vi.mock('@/packages/api-client', () => ({
  apiClient: {
    delete: vi.fn(),
  },
}));

// Mock do useToast
const mockToast = vi.fn();
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

describe('useDeleteServiceMutation', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  const createWrapper = () => ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('deve chamar a API com o ID correto e invalidar a query no sucesso', async () => {
    const serviceId = 123;

    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');
    
    // Mock da resposta da API
    (apiClient.delete as any).mockResolvedValueOnce({ data: { success: true } });

    const { result } = renderHook(() => useDeleteServiceMutation(), {
      wrapper: createWrapper(),
    });

    // Executa a mutação
    result.current.mutate(serviceId);

    // Verificações
    await waitFor(() => {
      expect(apiClient.delete).toHaveBeenCalledWith(`/api/services/${serviceId}`);
    });

    await waitFor(() => {
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['services'] });
    });

    expect(mockToast).toHaveBeenCalledWith({
      title: 'Sucesso',
      description: 'Serviço removido!',
      variant: 'default',
    });
  });

  it('deve exibir toast de erro quando a API falhar', async () => {
    const serviceId = 456;
    const errorMessage = 'Erro ao deletar registro';

    // Mock do erro da API
    (apiClient.delete as any).mockRejectedValueOnce(new Error(errorMessage));

    const { result } = renderHook(() => useDeleteServiceMutation(), {
      wrapper: createWrapper(),
    });

    // Executa a mutação
    result.current.mutate(serviceId);

    // Verificações
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Erro',
        description: `Erro ao remover serviço: ${errorMessage}`,
        variant: 'destructive',
      });
    });
  });
});