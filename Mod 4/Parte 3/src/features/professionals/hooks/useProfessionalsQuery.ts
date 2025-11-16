/*
 * Arquivo de Destino: /packages/web/src/features/professionals/hooks/useProfessionalsQuery.ts
 *
 * Tarefa 1.1: Criar um hook useQuery para buscar a lista completa de profissionais.
 *
 * De Onde (Refatoração): Lógica de fetchProfessionals em src/shared/store.ts.
 * Princípios:
 * - PGEC (2.13) / CQRS (2.12): Implementado como um hook useQuery.
 * - PTE (2.15): Hook auto-contido.
 * - O RLS (Row Level Security) habilitado no Supabase (conforme migrações)
 * garante que o usuário só veja seus próprios dados,
 * removendo a necessidade de filtrar manualmente por `user_id`.
 */

import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/packages/supabase/supabase-client" // Assumindo caminho padrão do cliente
import { ProfessionalType } from "@/packages/shared-types" // Assumindo novo caminho de tipos
import { PostgrestError } from "@supabase/supabase-js"

/**
 * Define a chave de query para a lista de profissionais.
 */
export const professionalsQueryKey = ["professionals"]

/**
 * Função de busca (queryFn) que busca a lista de profissionais no Supabase.
 * Exportada para ser reutilizável, se necessário.
 */
export const fetchProfessionals = async (): Promise<ProfessionalType[]> => {
  const { data, error } = await supabase
    .from("professionals")
    .select("*")
    .order("name", { ascending: true })

  if (error) {
    console.error("Erro ao buscar profissionais:", error)
    throw new Error(error.message)
  }

  return data || []
}

/**
 * Hook customizado (useQuery) para buscar e armazenar em cache a lista de
 * profissionais do usuário autenticado.
 */
export const useProfessionalsQuery = () => {
  return useQuery<ProfessionalType[], PostgrestError>({
    queryKey: professionalsQueryKey,
    queryFn: fetchProfessionals,
  })
}