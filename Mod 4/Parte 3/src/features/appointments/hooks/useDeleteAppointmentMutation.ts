/packages/web/src/features/appointments/hooks/useDeleteAppointmentMutation.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/packages/api-client';
import { AppointmentType } from '@/packages/shared-types';

/**
 * Define a função de mutação que será usada pelo React Query.
 * Esta função envia a requisição para deletar um agendamento pelo ID.
 * @param appointmentId O ID do agendamento a ser deletado.
 */
const deleteAppointment = async (
  appointmentId: number,
): Promise<{ success: boolean }> => {
  try {
    // A rota DELETE /api/appointments/:id é definida no worker
    const data = await apiClient.delete<{ success: boolean }>(
      `/api/appointments/${appointmentId}`,
    );
    return data;
  } catch (error) {
    console.error('Erro ao deletar agendamento:', error);
    throw new Error('Não foi possível deletar o agendamento.');
  }
};

/**
 * Hook (Mutation) para deletar um agendamento existente.
 *
 * Em conformidade com:
 * - [cite_start]Plano de Feature 3.1 [cite: 177]
 * - [cite_start]Princípio PGEC (2.13): Nível 3 (Estado do Servidor) [cite: 182]
 * - [cite_start]Princípio CQRS (2.12): Este é um "Command" (Escrita) [cite: 182]
 * - [cite_start]Refatora a lógica de `deleteAppointment` do `store.ts` [cite: 178, 221]
 */
export const useDeleteAppointmentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, number>({
    mutationFn: deleteAppointment,
    onSuccess: () => {
      // Invalida a query de agendamentos para atualizar a UI (o calendário)
      [cite_start]// Conforme Princípio PTE (2.15) [cite: 126]
      queryClient.invalidateQueries({ queryKey: ['appointments'] });

      // Opcionalmente, pode-se remover o item do cache manualmente
      // queryClient.setQueryData(['appointments'], (oldData: AppointmentType[] | undefined) => {
      //   return oldData?.filter((app) => app.id !== variables) ?? [];
      // });
    },
    onError: (error) => {
      // Aqui você pode disparar um toast de erro
      console.error('Falha ao deletar agendamento:', error.message);
    },
  });
};