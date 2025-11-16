import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/packages/supabase/supabase-client';
import { CreateProfessionalSchema } from '@/packages/shared-types';
import { z } from 'zod';

// Define the input type for the mutation based on the Zod schema
type AddProfessionalInput = z.infer<typeof CreateProfessionalSchema>;

/**
 * Asynchronous function to add a new professional to the database.
 * This is the "mutation function" that useMutation will call.
 *
 * @param professionalData - The data for the new professional, adhering to CreateProfessionalSchema.
 * @returns The newly created professional object from the database.
 */
const addProfessional = async (professionalData: AddProfessionalInput) => {
  const { data, error } = await supabase
    .from('professionals')
    .insert(professionalData)
    .select() // Select the newly created row
    .single(); // Expect a single object back

  if (error) {
    console.error('Error adding professional:', error.message);
    throw error; // Re-throw the error to be handled by React Query's onError
  }

  return data;
};

/**
 * Hook to add a new professional.
 *
 * Implements CQRS (2.12) by encapsulating the create operation in a dedicated
 * mutation hook. It handles cache invalidation via PTE (2.15).
 *
 * @returns The result of the useMutation hook.
 */
export const useAddProfessionalMutation = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    /**
     * mutationFn: The function that performs the async task.
     */
    mutationFn: addProfessional,

    /**
     * onSuccess: Executed after a successful mutation.
     * PTE (2.15): Invalidates the main 'professionals' cache to force a refetch,
     * ensuring the UI (e.g., data table) displays the new professional.
     */
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professionals'] });
    },

    /**
     * onError: Executed if the mutation function throws an error.
     * (Optional but good practice for global error handling or specific logging)
     */
    onError: (error) => {
      console.error('Failed to add professional:', error.message);
      // Here you could show a toast notification to the user
    },
  });

  return mutation;
};