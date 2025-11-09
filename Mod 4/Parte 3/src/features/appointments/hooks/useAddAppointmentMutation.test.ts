/**
 * Testes para o hook useAddAppointmentMutation.
 *
 * Em conformidade com:
 * - [cite_start]Plano de Feature 3.4 [cite: 170]
 * - [cite_start]Princípio PTE (2.15): Testar hooks (Mutations) isoladamente [cite: 171]
 */
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import { apiClient } from '@/packages/api-client';
import { useAddAppointmentMutation } from './useAddAppointmentMutation';
import { AppointmentType } from '@/packages/shared-types';
import React from 'react';

// Tipagem para os dados de criação, inferida do hook original
type AppointmentCreateData = {
  clientId: string;
  professionalId: string;
  serviceId: string;
  startTime: Date;
  endTime: Date;
};

// 1. MOCKS
// =================================================================

[cite_start]// Mock do apiClient [cite: 135]
vi.mock('@/packages/api-client', () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

// Mock dos dados de entrada
const mockNewAppointmentData: AppointmentCreateData = {
  clientId: 'client-id-123',
  professionalId: 'prof-id-456',
  serviceId: 'service-id-789',
  startTime: new Date('2025-12-01T10:00:00Z'),
  endTime: new Date('2025-12-01T11:00:00Z'),
};

[cite_start]// Mock da resposta da API [cite: 135]
const mockApiResponse: AppointmentType = {
  id: 'new-appointment-uuid',
  status: 'confirmed',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  // O restante dos dados seria um merge do mockNewAppointmentData
  clientId: 'client-id-123',
  professionalId: 'prof-id-456',
  serviceId: 'service-id-789',
  startTime: '2025-12-01T10:00:00Z',
  endTime: '2025-12-01T11:00:00Z',
};

// 2. HELPERS
// =================================================================

/**
 * Cria um wrapper de teste com QueryClientProvider para que o hook
 * tenha o contexto necessário do React Query.
 */
const createTestWrapper = () => {
  // Cria uma nova instância do QueryClient para cada teste
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Desabilita retentativas em testes
      },
    },
  });

  [cite_start]// Espiona a função invalidateQueries para verificar se ela é chamada [cite: 76]
  vi.spyOn(queryClient, 'invalidateQueries');

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { wrapper, queryClient };
};

// 3. TEST SUITE
// =================================================================

describe('useAddAppointmentMutation', () => {
  beforeEach(() => {
    // Limpa todos os mocks antes de cada teste
    vi.clearAllMocks();
  });

  it('deve chamar apiClient.post e invalidar a query "appointments" em caso de sucesso', async () => {
    [cite_start]// [cite: 171] Testar o hook de Mutation isoladamente
    [cite_start]// [cite: 76] Testar a invalidação da query no onSuccess

    // Arrange
    (apiClient.post as vi.Mock).mockResolvedValue(mockApiResponse);
    const { wrapper, queryClient } = createTestWrapper();
    const { result } = renderHook(() => useAddAppointmentMutation(), {
      wrapper,
    });

    // Act
    // Chama a mutação usando mutateAsync para poder aguardar a conclusão
    await result.current.mutateAsync(mockNewAppointmentData);

    // Assert
    // 1. Verifica se a API foi chamada com os dados corretos
    expect(apiClient.post).toHaveBeenCalledTimes(1);
    expect(apiClient.post).toHaveBeenCalledWith(
      '/api/appointments',
      mockNewAppointmentData,
    );

    [cite_start]// 2. Verifica se a query 'appointments' foi invalidada (Princípio PTE) [cite: 76]
    await waitFor(() => {
      expect(queryClient.invalidateQueries).toHaveBeenCalledTimes(1);
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['appointments'],
      });
    });

    // 3. Verifica o estado final do hook
    expect(result.current.isSuccess).toBe(true);
    expect(result.current.data).toEqual(mockApiResponse);
    expect(result.current.isError).toBe(false);
  });

  it('deve lidar com erros da API e não invalidar a query', async () => {
    [cite_start]// [cite: 171] Testar o cenário de erro do hook isoladamente

    // Arrange
    const mockError = new Error('Erro 500: Falha no servidor');
    (apiClient.post as vi.Mock).mockRejectedValue(mockError);
    const { wrapper, queryClient } = createTestWrapper();
    const { result } = renderHook(() => useAddAppointmentMutation(), {
      wrapper,
    });

    // Act
    try {
      // Chama a mutação, esperando que ela rejeite
      await result.current.mutateAsync(mockNewAppointmentData);
    } catch (error) {
      // Erro esperado, capturado para continuar a execução do teste
    }

    // Assert
    // 1. Verifica se a API foi chamada
    expect(apiClient.post).toHaveBeenCalledTimes(1);
    expect(apiClient.post).toHaveBeenCalledWith(
      '/api/appointments',
      mockNewAppointmentData,
    );

    // 2. Verifica se a invalidação de query NÃO foi chamada
    await waitFor(() => {
      expect(queryClient.invalidateQueries).not.toHaveBeenCalled();
    });

    // 3. Verifica o estado final do hook
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBe(mockError);
    expect(result.current.data).toBeUndefined();
  });
});