import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/packages/lib/supabase';
import { CreateProductSchema } from '@/packages/shared-types';
import { z } from 'zod';

// O tipo de dados que a mutationFn receberá, derivado do Zod schema
type ProductData = z.infer<typeof CreateProductSchema>;

/**
 * Define a função assíncrona para adicionar um novo produto no Supabase.
 * A lógica é migrada do store.ts (addProduct).
 */
const addProduct = async (productData: ProductData) => {
  const { data, error } = await supabase
    .from('products')
    .insert(productData)
    .select() // Retorna o registro inserido
    .single(); // Espera um único objeto de retorno

  if (error) {
    console.error('Error adding product:', error.message);
    throw new Error(error.message);
  }

  return data;
};

/**
 * Hook customizado (Nível 3 - Server State) para a mutação de adicionar produto.
 * Utiliza @tanstack/react-query para gerenciar a escrita de dados.
 *
 * @returns A mutação para adicionar um novo produto.
 */
export const useAddProductMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addProduct,
    onSuccess: () => {
      // Invalida o cache de 'products' para forçar um refetch da lista
      // (Princípio CQRS e PGEC)
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error) => {
      // Implementação de feedback de erro (Princípio 3.1.2.5)
      console.error('Erro ao adicionar produto:', error.message);
      // Aqui poderia ser integrado um toast, por exemplo:
      // toast.error("Falha ao adicionar produto", error.message);
    },
  });
};