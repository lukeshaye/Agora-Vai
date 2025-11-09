/packages/web/src/features/appointments/hooks/useUpdateAppointmentMutation.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/packages/api-client';
import { AppointmentFormSchema, AppointmentType } from '@/packages/shared-types';
import { z } from 'zod';

// Define o tipo de dados que o formulário enviará, com base no Zod schema
[cite_start]// Conforme DSpP (2.16) [cite: 183]
type AppointmentUpdateData = z.infer<typeof AppointmentFormSchema>;

// Interface para os dados que a mutação espera: o ID do agendamento e os dados a atualizar
interface UpdateAppointmentVariables {
  id: number;
  data: AppointmentUpdateData;
}

/**
 * Define a função de mutação que será usada pelo React Query.
 * Esta função envia os dados atualizados do agendamento para a API.
 * @param variables Um objeto contendo o ID e os dados do agendamento.
 */
const updateAppointment = async ({
  id,
  data,
}: UpdateAppointmentVariables): Promise<AppointmentType> => {
  try {
    // A rota PUT /api/appointments/:id é definida no worker
    const response = await apiClient.put<AppointmentType>(
      `/api/appointments/${id}`,
      data,
    );
    return response;
  } catch (error) {
    console.error('Erro ao atualizar agendamento:', error);
    throw new Error('Não foi possível atualizar o agendamento.');
  }
};

/**
 * Hook (Mutation) para atualizar um agendamento existente.
 *
 * Em conformidade com:
 * - [cite_start]Plano de Feature 3.1 [cite: 177]
 * - [cite_start]Princípio PGEC (2.13): Nível 3 (Estado do Servidor) [cite: 182]
 * - [cite_start]Princípio CQRS (2.12): Este é um "Command" (Escrita) [cite: 182]
 * - [cite_start]Refatora a lógica de `updateAppointment` do `store.ts` [cite: 178]
 */
export const useUpdateAppointmentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<AppointmentType, Error, UpdateAppointmentVariables>({
    mutationFn: updateAppointment,
    onSuccess: (data, variables) => {
      // Invalida a query de agendamentos para atualizar a UI (o calendário)
      [cite_start]// Conforme Princípio PTE (2.15) [cite: 126]
      queryClient.invalidateQueries({ queryKey: ['appointments'] });

      // Opcionalmente, pode-se atualizar o cache manualmente
      // queryClient.setQueryData(['appointments'], (oldData: AppointmentType[] | undefined) => {
      //   return oldData?.map((app) => (app.id === variables.id ? data : app)) ?? [];
      // });
    },
    onError: (error) => {
      // Aqui você pode disparar um toast de erro
      console.error('Falha ao atualizar agendamento:', error.message);
    },
  });
};