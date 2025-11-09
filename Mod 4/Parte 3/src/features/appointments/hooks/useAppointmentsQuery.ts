/packages/web/src/features/appointments/hooks/useAppointmentsQuery.ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/packages/api-client';
import { AppointmentType } from '@/packages/shared-types';

/**
 * Define a função de busca que será usada pelo React Query.
 * Esta função chama o endpoint da API para buscar os agendamentos.
 */
const fetchAppointments = async (): Promise<AppointmentType[]> => {
  try {
    // Utiliza o apiClient (conforme o plano) para buscar os dados da API
    // O worker (src/worker/index.ts) expõe a rota GET /api/appointments
    const data = await apiClient.get<AppointmentType[]>('/api/appointments');
    return data;
  } catch (error) {
    console.error('Erro ao buscar agendamentos:', error);
    throw new Error('Não foi possível carregar os agendamentos.');
  }
};

/**
 * Hook (Query) para buscar a lista de todos os agendamentos.
 *
 * Em conformidade com:
 * - Plano de Feature 3.1 
 * - Princípio PGEC (2.13): Nível 3 (Estado do Servidor) 
 * - Princípio CQRS (2.12): Esta é a "Query" (Leitura) 
 * - Dependências: @tanstack/react-query, @/packages/api-client, @/packages/shared-types 
 */
export const useAppointmentsQuery = () => {
  return useQuery<AppointmentType[], Error>({
    queryKey: ['appointments'],
    queryFn: fetchAppointments,
  });
};