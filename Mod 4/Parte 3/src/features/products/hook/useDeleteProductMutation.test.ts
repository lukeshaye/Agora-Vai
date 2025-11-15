import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';

import { supabase } from '@/packages/lib/supabase';
import { useDeleteProductMutation } from './useDeleteProductMutation';

// 1. Mockar a chamada ao supabase (Princípio PTE 2.15)
// A implementação de deleteProduct chama:
// supabase.from('products').delete().eq('id', productId)
vi.mock('@/packages/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      delete: vi.fn(() => ({
        eq: vi.fn(),
      })),
    })),
  },
}));

// Typecasting para facilitar o uso do mock
const mockedSupabase = supabase as vi.Mocked<typeof supabase>;
const mockFrom = mockedSupabase.from as vi.Mock;
const mockDelete = vi.fn();
const mockEq = vi.fn();

// 2. Criar um wrapper de teste para o React Query
const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
};

let queryClient: QueryClient;

const createWrapper = () => {
  queryClient = createTestQueryClient();
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

// 3. Limpar mocks antes de cada teste
beforeEach(() => {
  vi.resetAllMocks();

  // Reconfigurar a cadeia de mocks do Supabase
  mockFrom.mockReturnValue({
    delete: mockDelete.mockReturnValue({
      eq: mockEq,
    }),
  } as any);

  if (queryClient) {
    queryClient.clear();
  }
});

afterEach(() => {
  vi.clearAllMocks();
});

// 4. Descrever os testes para o hook de mutação
describe('useDeleteProductMutation (Teste de Hook - PTE 2.15)', () => {
  
  const productIdToDelete = 42;

  it('DEVE excluir um produto com sucesso e invalidar o cache de "products" (CQRS Command)', async () => {
    // Arrange
    // Configura o mock para um retorno de sucesso (sem dados, sem erro)
    mockEq.mockResolvedValue({ data: null, error: null });

    // Espiona o método invalidateQueries
    const wrapper = createWrapper();
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDeleteProductMutation(), {
      wrapper,
    });

    // Act
    result.current.mutate(productIdToDelete);

    // Assert
    // Aguarda a mutação ser concluída com sucesso
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // 1. Verifica se o supabase foi chamado corretamente
    expect(mockFrom).toHaveBeenCalledWith('products');
    expect(mockDelete).toHaveBeenCalled();
    expect(mockEq).toHaveBeenCalledWith('id', productIdToDelete);

    // 2. Verifica se a mutação foi bem-sucedida (sem retorno de dados)
    expect(result.current.data).toBeUndefined();
    expect(result.current.isError).toBe(false);

    // 3. Verifica se o cache foi invalidado (CQRS)
    expect(invalidateQueriesSpy).toHaveBeenCalledTimes(1);
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['products'] });
  });

  it('DEVE retornar um erro se a chamada ao supabase falhar e NÃO invalidar o cache', async () => {
    // Arrange
    const mockError = new Error('Falha na exclusão (ex: RLS, violação de FK)');
    
    // Configura o mock para um retorno de erro
    mockEq.mockResolvedValue({ data: null, error: mockError });

    // Espiona o método invalidateQueries
    const wrapper = createWrapper();
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDeleteProductMutation(), {
      wrapper,
    });

    // Act
    result.current.mutate(productIdToDelete);

    // Assert
    // Aguarda a mutação falhar
    await waitFor(() => expect(result.current.isError).toBe(true));

    // 1. Verifica se o erro foi propagado
    expect(result.current.error).toEqual(mockError);

    // 2. Verifica se a mutação não foi bem-sucedida
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.data).toBeUndefined();

    // 3. (MAIS IMPORTANTE) Verifica se o cache NÃO foi invalidado
    expect(invalidateQueriesSpy).not.toHaveBeenCalled();
  });
});