import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/packages/lib/supabase';
import { ProductType } from '@/packages/shared-types';

/**
 * Define a função assíncrona para atualizar um produto existente no Supabase.
 * A lógica é migrada do store.ts (updateProduct).
 * A função espera receber o objeto completo do produto, incluindo seu ID.
 */
const updateProduct = async (productData: ProductType) => {
  const { id, ...updateData } = productData;

  if (!id) {
    throw new Error('ID do produto é necessário para atualização.');
  }

  const { data, error } = await supabase
    .from('products')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating product:', error.message);
    throw new Error(error.message);
  }

  return data;
};

/**
 * Hook customizado (Nível 3 - Server State) para a mutação de atualizar produto.
 * Utiliza @tanstack/react-query para gerenciar a escrita de dados.
 *
 * @returns A mutação para atualizar um produto.
 */
export const useUpdateProductMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProduct,
    onSuccess: () => {
      // Invalida o cache de 'products' para forçar um refetch da lista
      // (Princípio CQRS e PGEC)
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error) => {
      console.error('Erro ao atualizar produto:', error.message);
      // Aqui poderia ser integrado um toast
      // toast.error("Falha ao atualizar produto", error.message);
    },
  });
};