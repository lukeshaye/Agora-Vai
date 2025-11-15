import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { z } from 'zod';

import { supabase } from '@/packages/lib/supabase';
import { CreateProductSchema } from '@/packages/shared-types';
import { useAddProductMutation } from './useAddProductMutation';

// 1. Mockar a chamada ao supabase (Princípio PTE 2.15)
// A implementação de addProduct chama supabase.from('products').insert(...).select().single()
vi.mock('@/packages/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
  },
}));

// Typecasting para facilitar o uso do mock
const mockedSupabase = supabase as vi.Mocked<typeof supabase>;
const mockFrom = mockedSupabase.from as vi.Mock;
const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockSingle = vi.fn();

// O tipo de dados que a mutationFn receberá
type ProductData = z.infer<typeof CreateProductSchema>;

// 2. Criar um wrapper de teste para o React Query
const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Desabilita retries para testes
      },
      mutations: {
        retry: false, // Desabilita retries para testes
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

  // Reconfigurar a cadeia de mocks do Supabase para cada teste
  mockFrom.mockReturnValue({
    insert: mockInsert.mockReturnValue({
      select: mockSelect.mockReturnValue({
        single: mockSingle,
      }),
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
describe('useAddProductMutation (Teste de Hook - PTE 2.15)', () => {
  
  // Mock de dados para o teste
  const newProductData: ProductData = {
    name: 'Produto Teste',
    description: 'Descrição de teste',
    price: 1500, // 15.00
    quantity: 50,
    image_url: 'http://example.com/image.png',
  };

  const newlyCreatedProduct = {
    ...newProductData,
    id: 123, // O que o supabase retornaria
    tenant_id: 'mock-tenant-id', // O que o RLS/DB adicionaria
  };

  it('DEVE adicionar um produto com sucesso e invalidar o cache de "products" (CQRS Command)', async () => {
    // Arrange
    // Configura o mock para um retorno de sucesso
    mockSingle.mockResolvedValue({ data: newlyCreatedProduct, error: null });

    // Espiona o método invalidateQueries para verificar se foi chamado
    // (Conforme 3.1.2.4 do Plano)
    const wrapper = createWrapper(); // Cria o client
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useAddProductMutation(), {
      wrapper,
    });

    // Act
    // Chama a função de mutação
    result.current.mutate(newProductData);

    // Assert
    // Aguarda a mutação ser concluída com sucesso
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // 1. Verifica se o supabase foi chamado corretamente
    expect(mockFrom).toHaveBeenCalledWith('products');
    expect(mockInsert).toHaveBeenCalledWith(newProductData);
    expect(mockSelect).toHaveBeenCalled();
    expect(mockSingle).toHaveBeenCalled();

    // 2. Verifica se a mutação retornou os dados corretos
    expect(result.current.data).toEqual(newlyCreatedProduct);

    // 3. (MAIS IMPORTANTE) Verifica se o cache foi invalidado (CQRS)
    expect(invalidateQueriesSpy).toHaveBeenCalledTimes(1);
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['products'] });
    
    expect(result.current.isError).toBe(false);
  });

  it('DEVE retornar um erro se a chamada ao supabase falhar e NÃO invalidar o cache', async () => {
    // Arrange
    const mockError = new Error('Falha na inserção no Supabase');

    // Configura o mock para um retorno de erro
    mockSingle.mockResolvedValue({ data: null, error: mockError });

    // Espiona o método invalidateQueries
    const wrapper = createWrapper();
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useAddProductMutation(), {
      wrapper,
    });

    // Act
    result.current.mutate(newProductData);

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