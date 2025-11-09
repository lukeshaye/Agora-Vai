/*
 * TAREFA: /packages/web/src/features/auth/hooks/useAuth.test.ts
 * [cite_start]PLANO: [cite: 45, 46, 47, 48, 49]
 *
 * Testar o hook (store Zustand) useAuth.
 * [cite_start]O objetivo é [cite: 48] garantir que o estado (usuário, sessão, loading)
 * é inicializado corretamente e reage a eventos de autenticação
 * (login/logout) disparados pelo listener onAuthStateChange.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// 1. Mocks
// Mockar o cliente Supabase ANTES de importar o store,
// pois o store chama o supabase na inicialização.

let authStateChangeListener: ((_event: string, session: any) => void) | null = null;
const mockGetSession = vi.fn();
const mockOnAuthStateChange = vi.fn((_event, callback) => {
  authStateChangeListener = callback; // Armazena o callback para dispararmos eventos
  return {
    data: {
      subscription: {
        unsubscribe: vi.fn(),
      },
    },
  };
});

[cite_start]// Mock do novo caminho do cliente Supabase [cite: 20]
vi.mock('@/packages/core-supabase/db-client', () => ({
  supabase: {
    auth: {
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
    },
  },
}));

// 2. Imports dinâmicos
// Tipar o store que vamos importar
type AuthStore = typeof import('../hooks/useAuth').useAuth;
let useAuth: AuthStore;

// Helper para aguardar a resolução de promessas (ex: getSession)
const flushPromises = () => new Promise(setImmediate);

[cite_start]// Helper para simular um evento de auth (login/logout) [cite: 48]
const triggerAuthStateChange = (session: any) => {
  if (authStateChangeListener) {
    authStateChangeListener('MOCKED_EVENT', session);
  }
};

// 3. Setup dos Testes
beforeEach(async () => {
  // Limpa mocks e o listener
  vi.clearAllMocks();
  authStateChangeListener = null;
  
  // Define o mock padrão para getSession (usuário deslogado)
  mockGetSession.mockResolvedValue({ data: { session: null } });
  
  // Reseta os módulos do Vitest para forçar a re-importação do store,
  // o que fará com que ele use os mocks frescos desta execução.
  vi.resetModules();
  useAuth = (await import('../hooks/useAuth')).useAuth;
  
  // Na importação, o store define loading=true
  expect(useAuth.getState().loading).toBe(true);

  // Aguarda a resolução do mockGetSession()
  await flushPromises();
});

afterEach(() => {
  vi.clearAllMocks();
});

// 4. Suíte de Testes
describe('useAuth (Zustand Hook)', () => {

  it('deve inicializar deslogado e parar o loading após getSession', async () => {
    // Verificações pós-flush (no beforeEach)
    expect(useAuth.getState().loading).toBe(false);
    expect(useAuth.getState().user).toBe(null);
    expect(useAuth.getState().session).toBe(null);
    
    [cite_start]// Verifica se os métodos do Supabase foram chamados na inicialização [cite: 12, 181, 185]
    expect(mockGetSession).toHaveBeenCalledTimes(1);
    expect(mockOnAuthStateChange).toHaveBeenCalledTimes(1);
  });

  it('deve inicializar logado se getSession retornar uma sessão ativa', async () => {
    const mockUser = { id: '123', email: 'test@test.com' };
    const mockSession = { access_token: 'abc', user: mockUser };
    
    // Configura o mock ANTES da importação
    mockGetSession.mockResolvedValue({ data: { session: mockSession } });
    
    // Re-importa o store para usar o novo mock de getSession
    vi.resetModules();
    useAuth = (await import('../hooks/useAuth')).useAuth;
    
    // Estado inicial (antes do async)
    expect(useAuth.getState().loading).toBe(true);
    
    // Aguarda o async
    await flushPromises();

    // Estado final
    expect(useAuth.getState().loading).toBe(false);
    expect(useAuth.getState().user).toBe(mockUser);
    expect(useAuth.getState().session).toBe(mockSession);
  });

  it('deve atualizar o estado para logado em um evento SIGNED_IN (login)', () => {
    // Estado inicial (garantido pelo beforeEach)
    expect(useAuth.getState().user).toBe(null);

    const mockUser = { id: '456', email: 'login@test.com' };
    const mockSession = { access_token: 'xyz', user: mockUser };

    [cite_start]// Simula o evento de login [cite: 48]
    triggerAuthStateChange(mockSession);

    // Verifica o novo estado
    expect(useAuth.getState().user).toBe(mockUser);
    expect(useAuth.getState().session).toBe(mockSession);
  });

  it('deve atualizar o estado para deslogado em um evento SIGNED_OUT (logout)', () => {
    // 1. Simula o login primeiro
    const mockUser = { id: '456', email: 'login@test.com' };
    const mockSession = { access_token: 'xyz', user: mockUser };
    triggerAuthStateChange(mockSession);
    expect(useAuth.getState().user).toBe(mockUser); // Garante que estava logado

    [cite_start]// 2. Simula o evento de logout [cite: 48]
    triggerAuthStateChange(null);

    // Verifica o estado final
    expect(useAuth.getState().user).toBe(null);
    expect(useAuth.getState().session).toBe(null);
  });
});