import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/packages/supabase/supabase-client';
import { ProfessionalType } from '@/packages/shared-types';

/**
 * Hook to fetch a single professional by their ID.
 *
 * Implements PGEC (2.13) and CQRS (2.12) by encapsulating the read
 * operation in a dedicated React Query hook.
 *
 * @param id - The ID of the professional to fetch.
 * @returns The result of the useQuery hook.
 */
export const useProfessionalByIdQuery = (id: string | number | undefined) => {
  const query = useQuery<ProfessionalType, Error>({
    /**
     * The queryKey uniquely identifies this query.
     * It includes the 'id' so that React Query refetches when the id changes.
     */
    queryKey: ['professional', id],

    /**
     * The queryFn is the asynchronous function that fetches the data.
     */
    queryFn: async () => {
      // The 'enabled' flag (below) ensures that 'id' is defined when this function runs.
      const { data, error } = await supabase
        .from('professionals')
        .select('*')
        .eq('id', id!)
        .single(); // .single() throws an error if 0 or >1 rows are found

      if (error) {
        console.error(`Error fetching professional with id ${id}:`, error.message);
        throw error; // Re-throw the error to be handled by React Query
      }

      return data;
    },

    /**
     * The query will only execute if 'id' is a truthy value (not undefined, null, 0, or '').
     */
    enabled: !!id,
  });

  return query;
};