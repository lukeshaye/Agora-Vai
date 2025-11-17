import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useUpdateServiceMutation } from './useUpdateServiceMutation';
import { apiClient } from '@/packages/api-client';
import { ServiceType } from '@/packages/shared-types';

// Mock do apiClient
vi.mock('@/packages/api-client', () => ({
  apiClient: {
    put: vi.fn(),
  },
}));

// Mock do useToast
const mockToast = vi.fn();
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

describe('useUpdateServiceMutation', () => {
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

  it('deve chamar a API com os dados corretos e invalidar a query no sucesso', async () => {
    const updateData: ServiceType = {
      id: 1,
      name: 'Serviço Atualizado',
      price: 150,
      duration: 45,
      color: '#ABCDEF',
      image_url: 'http://example.com/updated.png'
    };

    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');
    
    // Mock da resposta da API
    (apiClient.put as any).mockResolvedValueOnce({ data: updateData });

    const { result } = renderHook(() => useUpdateServiceMutation(), {
      wrapper: createWrapper(),
    });

    // Executa a mutação
    result.current.mutate(updateData);

    // Verificações
    await waitFor(() => {
      expect(apiClient.put).toHaveBeenCalledWith(`/api/services/${updateData.id}`, updateData);
    });

    await waitFor(() => {
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['services'] });
    });

    expect(mockToast).toHaveBeenCalledWith({
      title: 'Sucesso',
      description: 'Serviço atualizado com sucesso!',
      variant: 'default',
    });
  });

  it('deve exibir toast de erro quando a API falhar', async () => {
    const updateData: ServiceType = {
      id: 2,
      name: 'Serviço Falha',
      price: 10,
      duration: 10,
    };
    const errorMessage = 'Erro de validação';

    // Mock do erro da API
    (apiClient.put as any).mockRejectedValueOnce(new Error(errorMessage));

    const { result } = renderHook(() => useUpdateServiceMutation(), {
      wrapper: createWrapper(),
    });

    // Executa a mutação
    result.current.mutate(updateData);

    // Verificações
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Erro',
        description: `Erro ao atualizar serviço: ${errorMessage}`,
        variant: 'destructive',
      });
    });
  });
});