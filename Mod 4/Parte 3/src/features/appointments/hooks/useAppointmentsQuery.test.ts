/**
 * Testes para o hook useAppointmentsQuery.
 *
 * Em conformidade com:
 * - Plano de Feature 3.4
 * - Princípio PTE (2.15): Testar hooks (Queries) isoladamente
 */
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import { apiClient } from '@/packages/api-client';
import { useAppointmentsQuery } from './useAppointmentsQuery';
import { AppointmentType } from '@/packages/shared-types';
import React from 'react';

// 1. MOCKS
// =================================================================

// Mock do apiClient
vi.mock('@/packages/api-client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

// Mock da resposta da API (lista de agendamentos)
const mockAppointmentsResponse: AppointmentType[] = [
  {
    id: 'appt-uuid-1',
    clientId: 'client-id-123',
    professionalId: 'prof-id-456',
    serviceId: 'service-id-789',
    startTime: '2025-12-01T10:00:00Z',
    endTime: '2025-12-01T11:00:00Z',
    status: 'confirmed',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'appt-uuid-2',
    clientId: 'client-id-abc',
    professionalId: 'prof-id-xyz',
    serviceId: 'service-id-rsq',
    startTime: '2025-12-01T14:00:00Z',
    endTime: '2025-12-01T15:00:00Z',
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// 2. HELPERS
// =================================================================

/**
 * Cria um wrapper de teste com QueryClientProvider para que o hook
 * tenha o contexto necessário do React Query.
 */
const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Desabilita retentativas em testes
      },
    },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { wrapper, queryClient };
};

// 3. TEST SUITE
// =================================================================

describe('useAppointmentsQuery', () => {
  beforeEach(() => {
    // Limpa todos os mocks antes de cada teste
    vi.clearAllMocks();
  });

  it('deve buscar e retornar os dados dos agendamentos com sucesso', async () => {
    // Testar o hook de Query isoladamente (cenário de sucesso)

    // Arrange
    (apiClient.get as vi.Mock).mockResolvedValue(mockAppointmentsResponse);
    const { wrapper } = createTestWrapper();
    const { result } = renderHook(() => useAppointmentsQuery(), {
      wrapper,
    });

    // Act
    // Aguarda a query ser resolvida
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Assert
    // 1. Verifica se a API foi chamada corretamente
    expect(apiClient.get).toHaveBeenCalledTimes(1);
    expect(apiClient.get).toHaveBeenCalledWith('/api/appointments');

    // 2. Verifica o estado final do hook
    expect(result.current.data).toEqual(mockAppointmentsResponse);
    expect(result.current.isSuccess).toBe(true);
    expect(result.current.isError).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('deve lidar com erros ao buscar agendamentos', async () => {
    // Testar o hook de Query isoladamente (cenário de erro)

    // Arrange
    const mockError = new Error('Erro 404: Não encontrado');
    (apiClient.get as vi.Mock).mockRejectedValue(mockError);
    const { wrapper } = createTestWrapper();
    const { result } = renderHook(() => useAppointmentsQuery(), {
      wrapper,
    });

    // Act
    // Aguarda a query falhar
    await waitFor(() => expect(result.current.isError).toBe(true));

    // Assert
    // 1. Verifica se a API foi chamada
    expect(apiClient.get).toHaveBeenCalledTimes(1);
    expect(apiClient.get).toHaveBeenCalledWith('/api/appointments');

    // 2. Verifica o estado final do hook
    expect(result.current.data).toBeUndefined();
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBe(mockError);
  });

  it('deve usar a queryKey "appointments"', async () => {
    // Testar se a queryKey está correta para fins de cache e invalidação

    // Arrange
    (apiClient.get as vi.Mock).mockResolvedValue(mockAppointmentsResponse);
    const { wrapper, queryClient } = createTestWrapper();
    renderHook(() => useAppointmentsQuery(), {
      wrapper,
    });

    // Act
    await waitFor(() => {
      // Verifica se o cache do React Query contém a chave esperada
      const queryCache = queryClient.getQueryCache();
      const query = queryCache.find({ queryKey: ['appointments'] });
      expect(query).toBeDefined();
      expect(query?.queryKey).toEqual(['appointments']);
    });
  });
});