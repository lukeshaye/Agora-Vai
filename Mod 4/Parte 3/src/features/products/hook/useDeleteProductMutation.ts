import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/packages/lib/supabase';

/**
 * Função de mutação para excluir um produto.
 * Recebe o ID do produto e executa a operação de exclusão no Supabase.
 */
const deleteProduct = async (productId: number) => {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId);

  if (error) {
    throw new Error(error.message);
  }

  // A exclusão bem-sucedida não retorna dados
};

/**
 * Hook (useMutation) para excluir um produto.
 *
 * Este hook encapsula a lógica de exclusão (Command no CQRS) e gerencia
 * a invalidação do cache do React Query (PGEC Nível 3).
 *
 * @returns Uma mutação do React Query.
 *
 * @exemplo
 * const { mutate, isPending } = useDeleteProductMutation();
 * mutate(productIdToDelete);
 */
export const useDeleteProductMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      // Invalida o cache de 'products' para forçar um refetch na UI (PGEC/CQRS)
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error) => {
      // Implementação de feedback de erro (conforme plano)
      console.error('Erro ao excluir produto:', error);
      // Aqui seria um bom lugar para adicionar um toast de erro
    },
  });
};