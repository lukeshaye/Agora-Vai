/packages/web/src/features/appointments/hooks/useAddAppointmentMutation.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/packages/api-client';
import { AppointmentFormSchema, AppointmentType } from '@/packages/shared-types';
import { z } from 'zod';

// Define o tipo de dados que o formulário enviará, com base no Zod schema
[cite_start]// Conforme DSpP (2.16) e dependências [cite: 133, 168]
type AppointmentCreateData = z.infer<typeof AppointmentFormSchema>;

/**
 * Define a função de mutação que será usada pelo React Query.
 * Esta função envia os dados do novo agendamento para a API.
 * @param newAppointmentData Os dados validados do formulário.
 */
const addAppointment = async (
  newAppointmentData: AppointmentCreateData,
): Promise<AppointmentType> => {
  try {
    // A rota POST /api/appointments é definida no worker
    const data = await apiClient.post<AppointmentType>(
      '/api/appointments',
      newAppointmentData,
    );
    return data;
  } catch (error) {
    console.error('Erro ao adicionar agendamento:', error);
    throw new Error('Não foi possível adicionar o agendamento.');
  }
};

/**
 * Hook (Mutation) para adicionar um novo agendamento.
 *
 * Em conformidade com:
 * - Plano de Feature 3.1 
 * - Princípio PGEC (2.13): Nível 3 (Estado do Servidor) 
 * - Princípio CQRS (2.12): Este é um "Command" (Escrita) 
 * - Refatora a lógica de `addAppointment` do `store.ts` 
 */
export const useAddAppointmentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<AppointmentType, Error, AppointmentCreateData>({
    mutationFn: addAppointment,
    onSuccess: (data) => {
      // Invalida a query de agendamentos para atualizar a UI (o calendário)
      [cite_start]// Conforme Princípio PTE (2.15) [cite: 76]
      queryClient.invalidateQueries({ queryKey: ['appointments'] });

      // Opcionalmente, pode-se adicionar o novo agendamento ao cache manualmente
      // queryClient.setQueryData(['appointments'], (oldData: AppointmentType[] | undefined) => {
      //   return oldData ? [...oldData, data] : [data];
      // });
    },
    onError: (error) => {
      // Aqui você pode disparar um toast de erro
      console.error('Falha ao criar agendamento:', error.message);
    },
  });
};