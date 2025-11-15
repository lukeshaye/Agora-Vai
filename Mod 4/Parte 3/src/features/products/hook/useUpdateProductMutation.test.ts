import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';

import { supabase } from '@/packages/lib/supabase';
import { ProductType } from '@/packages/shared-types';
import { useUpdateProductMutation } from './useUpdateProductMutation';

// 1. Mockar a chamada ao supabase (Princípio PTE 2.15)
// A implementação de updateProduct chama:
// supabase.from('products').update(updateData).eq('id', id).select().single()
vi.mock('@/packages/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
      })),
    })),
  },
}));

// Typecasting para facilitar o uso do mock
const mockedSupabase = supabase as vi.Mocked<typeof supabase>;
const mockFrom = mockedSupabase.from as vi.Mock;
const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockSelect = vi.fn();
const mockSingle = vi.fn();

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
    update: mockUpdate.mockReturnValue({
      eq: mockEq.mockReturnValue({
        select: mockSelect.mockReturnValue({
          single: mockSingle,
        }),
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
describe('useUpdateProductMutation (Teste de Hook - PTE 2.15)', () => {
  
  // Mock de dados para o teste
  const originalProduct: ProductType = {
    id: 1,
    name: 'Produto Antigo',
    price: 1000,
    quantity: 10,
    description: 'Desc Antiga',
    image_url: 'url_antiga',
    tenant_id: 't1',
  };

  const updatedProductData: ProductType = {
    ...originalProduct,
    name: 'Produto Atualizado',
    price: 1500,
  };

  // O que a função de mutação espera (sem o ID)
  const { id: _, ...updateData } = updatedProductData;


  it('DEVE atualizar um produto com sucesso e invalidar o cache de "products" (CQRS Command)', async () => {
    // Arrange
    // Configura o mock para um retorno de sucesso
    mockSingle.mockResolvedValue({ data: updatedProductData, error: null });

    // Espiona o método invalidateQueries
    const wrapper = createWrapper();
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateProductMutation(), {
      wrapper,
    });

    // Act
    result.current.mutate(updatedProductData);

    // Assert
    // Aguarda a mutação ser concluída com sucesso
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // 1. Verifica se o supabase foi chamado corretamente
    expect(mockFrom).toHaveBeenCalledWith('products');
    // Verifica se o 'id' foi removido dos dados de atualização
    expect(mockUpdate).toHaveBeenCalledWith(updateData); 
    expect(mockEq).toHaveBeenCalledWith('id', updatedProductData.id);
    expect(mockSelect).toHaveBeenCalled();
    expect(mockSingle).toHaveBeenCalled();

    // 2. Verifica se a mutação retornou os dados atualizados
    expect(result.current.data).toEqual(updatedProductData);

    // 3. Verifica se o cache foi invalidado (CQRS)
    expect(invalidateQueriesSpy).toHaveBeenCalledTimes(1);
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['products'] });
    
    expect(result.current.isError).toBe(false);
  });

  it('DEVE retornar um erro se a chamada ao supabase falhar e NÃO invalidar o cache', async () => {
    // Arrange
    const mockError = new Error('Falha na atualização (ex: RLS)');
    mockSingle.mockResolvedValue({ data: null, error: mockError });

    // Espiona o método invalidateQueries
    const wrapper = createWrapper();
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateProductMutation(), {
      wrapper,
    });

    // Act
    result.current.mutate(updatedProductData);

    // Assert
    await waitFor(() => expect(result.current.isError).toBe(true));

    // 1. Verifica se o erro foi propagado
    expect(result.current.error).toEqual(mockError);

    // 2. Verifica se a mutação não foi bem-sucedida
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.data).toBeUndefined();

    // 3. Verifica se o cache NÃO foi invalidado
    expect(invalidateQueriesSpy).not.toHaveBeenCalled();
  });

  it('DEVE retornar um erro se o ID do produto não for fornecido', async () => {
    // Arrange
    const productMissingId = {
      name: 'Produto sem ID',
      price: 100,
      quantity: 1,
    } as any; // Força a tipagem para o teste

    const wrapper = createWrapper();
    const { result } = renderHook(() => useUpdateProductMutation(), {
      wrapper,
    });

    // Act
    // A função `updateProduct` lança um erro síncrono antes mesmo do supabase ser chamado
    result.current.mutate(productMissingId);

    // Assert
    await waitFor(() => expect(result.current.isError).toBe(true));

    // Verifica se a mensagem de erro específica foi lançada
    expect(result.current.error?.message).toBe('ID do produto é necessário para atualização.');

    // Garante que nenhuma chamada ao supabase foi feita
    expect(mockFrom).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});