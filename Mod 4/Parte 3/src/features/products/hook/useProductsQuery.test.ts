import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';

import { supabase } from '@/packages/lib/supabase';
import { ProductType } from '@/packages/shared-types';
import { useProductsQuery } from './useProductsQuery';

// 1. Mockar a chamada ao supabase (Princípio PTE 2.15)
// A implementação de useProductsQuery chama supabase.from('products').select('*').order(...)
vi.mock('@/packages/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(),
      })),
    })),
  },
}));

// Typecasting para facilitar o uso do mock
const mockedSupabase = supabase as vi.Mocked<typeof supabase>;

// 2. Criar um wrapper de teste para o React Query
// Isso garante que cada teste tenha um cache limpo e um QueryClient
const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Desabilita retries para testes mais rápidos
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
  if (queryClient) {
    queryClient.clear();
  }
});

afterEach(() => {
  vi.clearAllMocks();
});

// 4. Descrever os testes para o hook
describe('useProductsQuery (Teste de Hook - PTE 2.15)', () => {
  
  it('DEVE estar no estado "isLoading" inicialmente', () => {
    // Arrange
    // Configura um mock que ainda não resolveu
    const mockOrder = vi.fn().mockReturnValue(new Promise(() => {})); // Nunca resolve
    const mockSelect = vi.fn().mockReturnValue({ order: mockOrder });
    mockedSupabase.from.mockReturnValue({ select: mockSelect } as any);

    // Act
    const { result } = renderHook(() => useProductsQuery(), {
      wrapper: createWrapper(),
    });

    // Assert
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it('DEVE buscar e retornar os dados dos produtos com sucesso (CQRS Query)', async () => {
    // Arrange
    const mockProducts: ProductType[] = [
      { id: 1, name: 'Produto A', price: 1000, quantity: 10, description: 'Desc A', image_url: 'url_a', tenant_id: 't1' },
      { id: 2, name: 'Produto B', price: 2000, quantity: 5, description: 'Desc B', image_url: 'url_b', tenant_id: 't1' },
    ];

    // Mockar a cadeia completa da queryFn (fetchProducts)
    const mockOrder = vi.fn().mockResolvedValue({ data: mockProducts, error: null });
    const mockSelect = vi.fn().mockReturnValue({ order: mockOrder });
    mockedSupabase.from.mockReturnValue({ select: mockSelect } as any);

    // Act
    const { result } = renderHook(() => useProductsQuery(), {
      wrapper: createWrapper(),
    });

    // Assert
    // Aguarda a query resolver (PGEC Nível 3)
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verifica se os dados corretos foram retornados
    expect(result.current.data).toEqual(mockProducts);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);

    // Verifica se o supabase foi chamado com os parâmetros corretos
    expect(mockedSupabase.from).toHaveBeenCalledWith('products');
    expect(mockSelect).toHaveBeenCalledWith('*');
    expect(mockOrder).toHaveBeenCalledWith('name', { ascending: true });
  });

  it('DEVE retornar um erro se a chamada ao supabase falhar', async () => {
    // Arrange
    const mockError = new Error('Falha na conexão com o banco de dados');

    // Mockar a cadeia para retornar um erro
    const mockOrder = vi.fn().mockResolvedValue({ data: null, error: mockError });
    const mockSelect = vi.fn().mockReturnValue({ order: mockOrder });
    mockedSupabase.from.mockReturnValue({ select: mockSelect } as any);

    // Act
    const { result } = renderHook(() => useProductsQuery(), {
      wrapper: createWrapper(),
    });

    // Assert
    // Aguarda o estado de erro
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(mockError);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it('DEVE retornar um array vazio se o supabase retornar "data" como null mas sem erro', async () => {
    // Arrange
    // (Cenário onde a query funciona mas não há dados, e o Supabase retorna null)
    const mockOrder = vi.fn().mockResolvedValue({ data: null, error: null });
    const mockSelect = vi.fn().mockReturnValue({ order: mockOrder });
    mockedSupabase.from.mockReturnValue({ select: mockSelect } as any);

    // Act
    const { result } = renderHook(() => useProductsQuery(), {
      wrapper: createWrapper(),
    });

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // A lógica de fetchProducts garante que `|| []` seja retornado
    expect(result.current.data).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
  });
});