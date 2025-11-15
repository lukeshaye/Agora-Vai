import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/packages/lib/supabase';
import { ProductType } from '@/packages/shared-types';

/**
 * Define a função assíncrona para buscar os produtos no Supabase.
 * A lógica é migrada do store.ts (fetchProducts), mas alinhada com o RLS.
 */
const fetchProducts = async (): Promise<ProductType[]> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching products:', error.message);
    throw new Error(error.message);
  }

  // Garante que estamos retornando um array, mesmo que data seja null
  return (data as ProductType[]) || [];
};

/**
 * Hook customizado (Nível 3 - Server State) para buscar a lista de produtos.
 * Utiliza @tanstack/react-query para gerenciar cache, isLoading e isError.
 *
 * @returns O resultado da query de produtos.
 */
export const useProductsQuery = () => {
  return useQuery<ProductType[], Error>({
    queryKey: ['products'],
    queryFn: fetchProducts,
  });
};