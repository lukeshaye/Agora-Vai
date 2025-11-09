/**
 * TAREFA: 1.1. Hook: useAuth.ts
 *
 * Onde: /packages/web/src/features/auth/hooks/useAuth.ts
 * De: src/react-app/auth/SupabaseAuthProvider.tsx
 *
 * Lógica:
 * 1. Gerencia o estado global de autenticação (usuário, sessão, carregamento) usando Zustand (PGEC 2.13, Nível 4).
 * 2. Migra a lógica de `onAuthStateChange` e `getSession` do `SupabaseAuthProvider.tsx` para
 * ouvir as mudanças do Supabase e atualizar o estado global.
 * 3. Separa o gerenciamento de estado (este hook) da UI (LoginForm.tsx) (SoC 2.5).
 *
 * Conexões:
 * - import { create } from 'zustand'
 * - import { supabase } from '@/packages/core-supabase/db-client'
 * - import { Session, User } from '@supabase/supabase-js'
 */

import { create } from 'zustand';
import { supabase } from '@/packages/core-supabase/db-client';
import type { Session, User } from '@supabase/supabase-js';

/**
 * Interface para o estado global de autenticação.
 */
interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

/**
 * Hook (store Zustand) para gerenciar o estado global de autenticação.
 * Este hook expõe o usuário, a sessão e o status de carregamento.
 */
export const useAuth = create<AuthState>(() => ({
  user: null,
  session: null,
  loading: true, // Inicia como 'true' até que a sessão inicial seja verificada.
}));

// --- Lógica de Sincronização de Estado ---
// Esta lógica é migrada diretamente do `useEffect` no `SupabaseAuthProvider.tsx`.
// Ela é executada uma vez quando o módulo é importado, inicializando o estado.

// 1. Busca a sessão inicial (que pode estar no localStorage)
supabase.auth.getSession().then(({ data: { session } }) => {
  useAuth.setState({
    session,
    user: session?.user ?? null,
    loading: false, // Marca como 'false' após a verificação inicial.
  });
});

// 2. Ouve mudanças no estado de autenticação (login, logout)
supabase.auth.onAuthStateChange((_event, session) => {
  useAuth.setState({
    session,
    user: session?.user ?? null,
    loading: false, // Marca como 'false' em qualquer mudança de auth.
  });
});