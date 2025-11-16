Aqui está um prompt detalhado, projetado para ser fornecido a um assistente de LLM, com o objetivo de corrigir as violações do Princípio da Inversão de Dependência (DIP) que identificámos.

O prompt é autossuficiente, define o problema, a solução e fornece exemplos claros de "antes" e "depois" para garantir uma refatoração precisa.

-----

## Prompt para o Assistente de Refatoração de Código

**Objetivo:** Corrigir violações do Princípio da Inversão de Dependência (DIP)

**Contexto:**
Você é um assistente de refatoração de código. Sua tarefa é corrigir uma violação grave do Princípio da Inversão de Dependência (DIP - 2.9) nos arquivos de hook da feature `professionals`, localizados em `Mod 4/Parte 3/src/features/professionals/hooks/`.

**O Problema (Anti-Pattern):**
Atualmente, os hooks nesta pasta (`useProfessionalsQuery`, `useAddProfessionalMutation`, etc.) importam e dependem diretamente do cliente `supabase` de baixo nível (`@/packages/supabase/supabase-client`). Isso acopla firmemente a lógica da feature a um detalhe de implementação.

**A Solução (Pattern Correto):**
Eles devem ser refatorados para depender da abstração da API Hono RPC (alto nível), que é importada como `api` de `  '@/packages/web/src/lib/api' `. A feature `products` (ex: `features/products/hook/useProductsQuery.ts`) já foi corrigida e serve como o exemplo de "bom" código que você deve replicar.

-----

### Tarefa: Refatorar os Seguintes Arquivos

Você deve aplicar as seguintes transformações em **TODOS** os hooks dentro de `Mod 4/Parte 3/src/features/professionals/hooks/`:

1.  **`useProfessionalsQuery.ts`**
2.  **`useProfessionalByIdQuery.ts`**
3.  **`useAddProfessionalMutation.ts`**
4.  **`useUpdateProfessionalMutation.ts`**
5.  **`useDeleteProfessionalMutation.ts`**

### Instruções de Refatoração (DE/PARA)

Para cada arquivo, siga este padrão:

1.  **Remova a Importação (DE):**

    ```typescript
    import { supabase } from '@/packages/supabase/supabase-client'
    ```

2.  **Adicione a Importação (PARA):**

    ```typescript
    import { api } from '@/packages/web/src/lib/api';
    ```

3.  **Adapte a Lógica da Função de Fetching:**

    -----

    #### **Padrão 1: Query (Listar Todos)**

    (Aplicar em `useProfessionalsQuery.ts`)

    **DE (Lógica Supabase):**

    ```typescript
    const fetchProfessionals = async (): Promise<ProfessionalType[]> => {
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
    ```

    **PARA (Lógica Hono RPC `api`):**

    ```typescript
    const fetchProfessionals = async (): Promise<ProfessionalType[]> => {
      // 1. Chama a abstração 'api' (Hono RPC)
      const res = await api.professionals.$get();

      // 2. Implementa o tratamento de erro padrão da API
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: res.statusText }));
        const errorMessage = errorData?.message || 'Failed to fetch professionals';
        console.error('Error fetching professionals:', errorMessage);
        throw new Error(errorMessage);
      }

      // 3. Retorna o JSON
      const data = await res.json();
      return (data as ProfessionalType[]) || [];
    };
    ```

    -----

    #### **Padrão 2: Query (Buscar por ID)**

    (Aplicar em `useProfessionalByIdQuery.ts`)

    **DE (Lógica Supabase):**

    ```typescript
    // ...
    queryFn: async () => {
      const { data, error } = await supabase
        .from('professionals')
        .select('*')
        .eq('id', id!)
        .single();
    // ...
    ```

    **PARA (Lógica Hono RPC `api`):**

    ```typescript
    // ...
    queryFn: async () => {
      // 1. Chama o endpoint dinâmico
      const res = await api.professionals[':id'].$get({
        param: { id: id!.toString() } // Passa o ID como param
      });

      // 2. Tratamento de erro
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: res.statusText }));
        const errorMessage = errorData?.message || 'Failed to fetch professional';
        console.error(`Error fetching professional ${id}:`, errorMessage);
        throw new Error(errorMessage);
      }

      // 3. Retorna o JSON
      return await res.json();
    },
    // ...
    ```

    -----

    #### **Padrão 3: Mutação (Criar)**

    (Aplicar em `useAddProfessionalMutation.ts`)

    **DE (Lógica Supabase):**

    ```typescript
    const addProfessional = async (professionalData: AddProfessionalInput) => {
      const { data, error } = await supabase
        .from('professionals')
        .insert(professionalData)
        .select()
        .single();
      // ...
    ```

    **PARA (Lógica Hono RPC `api`):**

    ```typescript
    const addProfessional = async (professionalData: AddProfessionalInput) => {
      // 1. Chama a abstração com o payload
      const res = await api.professionals.$post({ json: professionalData });

      // 2. Tratamento de erro
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: res.statusText }));
        const errorMessage = errorData?.message || 'Failed to add professional';
        console.error('Error adding professional:', errorMessage);
        throw new Error(errorMessage);
      }

      // 3. Retorna o JSON
      return await res.json();
    };
    ```

    -----

    #### **Padrão 4: Mutação (Atualizar)**

    (Aplicar em `useUpdateProfessionalMutation.ts`)

    **DE (Lógica Supabase):**

    ```typescript
    const updateProfessional = async (professionalData: UpdateProfessionalInput) => {
      const { id, ...dataToUpdate } = professionalData;
      // ...
      const { data, error } = await supabase
        .from('professionals')
        .update(dataToUpdate)
        .eq('id', id)
        .select()
        .single();
      // ...
    ```

    **PARA (Lógica Hono RPC `api`):**

    ```typescript
    const updateProfessional = async (professionalData: UpdateProfessionalInput) => {
      const { id, ...dataToUpdate } = professionalData;

      if (!id) {
        throw new Error('Professional ID is required for an update operation.');
      }

      // 1. Chama o endpoint dinâmico com 'param' e 'json'
      const res = await api.professionals[':id'].$put({
        param: { id: id.toString() },
        json: dataToUpdate,
      });

      // 2. Tratamento de erro
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: res.statusText }));
        const errorMessage = errorData?.message || 'Failed to update professional';
        console.error('Error updating professional:', errorMessage);
        throw new Error(errorMessage);
      }

      // 3. Retorna o JSON
      return await res.json();
    };
    ```

    -----

    #### **Padrão 5: Mutação (Excluir)**

    (Aplicar em `useDeleteProfessionalMutation.ts`)

    **DE (Lógica Supabase):**

    ```typescript
    const deleteProfessional = async (id: number) => {
      const { error } = await supabase.from('professionals').delete().eq('id', id);
      // ...
    ```

    **PARA (Lógica Hono RPC `api`):**

    ```typescript
    const deleteProfessional = async (id: number) => {
      // 1. Chama o endpoint dinâmico com 'param'
      const res = await api.professionals[':id'].$delete({
        param: { id: id.toString() },
      });

      // 2. Tratamento de erro
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: res.statusText }));
        const errorMessage = errorData?.message || 'Failed to delete professional';
        console.error('Error deleting professional:', errorMessage);
        throw new Error(errorMessage);
      }

      // 3. Delete não retorna corpo, apenas sucesso
      return { success: true };
    };
    ```