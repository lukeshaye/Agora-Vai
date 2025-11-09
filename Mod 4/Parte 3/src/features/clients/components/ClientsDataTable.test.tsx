// /packages/web/src/features/clients/components/ClientsDataTable.test.tsx

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ClientsDataTable } from './ClientsDataTable';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClientSchema } from '@/packages/shared-types';
import { z } from 'zod';
import 'vitest-dom/extend-expect';
import React from 'react';

// Infer the type from the Zod schema, as done in the component
type ClientType = z.infer<typeof ClientSchema>;

// --- Mocks ---

// Mock dos hooks
const mockUseClientsQuery = vi.fn();
vi.mock('../hooks/useClientsQuery', () => ({
  useClientsQuery: () => mockUseClientsQuery(),
}));

const mockDeleteMutate = vi.fn();
vi.mock('../hooks/useDeleteClientMutation', () => ({
  useDeleteClientMutation: () => ({
    mutate: mockDeleteMutate,
  }),
}));

// Mock do Modal (para isolar o teste na DataTable)
// Plano (PTE 2.15): Testar componentes de UI com dados mockados.
vi.mock('./ClientFormModal', () => ({
  ClientFormModal: ({
    isOpen,
    onClose,
    editingClient,
  }: {
    isOpen: boolean;
    onClose: () => void;
    editingClient: ClientType | null;
  }) => {
    if (!isOpen) return null;
    return (
      <div data-testid="mock-client-form-modal">
        <span data-testid="editing-client-name">{editingClient?.name}</span>
        <button onClick={onClose}>Fechar Modal</button>
      </div>
    );
  },
}));

// Mock do Skeleton (CDA 2.17)
vi.mock('@/packages/ui/skeleton', () => ({
  Skeleton: () => <div data-testid="skeleton-loader" />,
}));

// --- Test Setup ---

const queryClient = new QueryClient();

// Dados mockados
const mockClients: ClientType[] = [
  {
    id: 1,
    user_id: 'user-123',
    name: 'Alice Teste',
    phone: '11911111111',
    email: 'alice@teste.com',
    notes: '',
    birth_date: '1990-01-01',
    gender: 'feminino',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    user_id: 'user-123',
    name: 'Bob Teste',
    phone: '11922222222',
    email: 'bob@teste.com',
    notes: 'Cliente VIP',
    birth_date: '1995-02-02',
    gender: 'masculino',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Helper de renderização
const renderComponent = () => {
  return render(
    <QueryClientProvider client={queryClient}>
      <ClientsDataTable />
    </QueryClientProvider>,
  );
};

// Limpar mocks antes de cada teste
beforeEach(() => {
  vi.clearAllMocks();
  queryClient.clear();
});

// --- Test Suites ---

describe('ClientsDataTable', () => {
  it('deve renderizar os Skeletons durante o carregamento (isLoading)', () => {
    // Princípio: Testar estado de carregamento (PGEC 2.13 / CDA 2.17)
    mockUseClientsQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    renderComponent();

    // O componente renderiza 4 Skeletons no estado de loading
    expect(screen.getAllByTestId('skeleton-loader')).toHaveLength(4);
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('deve renderizar a mensagem "Nenhum cliente encontrado" quando não há dados', () => {
    // Princípio: Testar estado vazio
    mockUseClientsQuery.mockReturnValue({ data: [], isLoading: false });

    renderComponent();

    expect(
      screen.getByText('Nenhum cliente encontrado.'),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('skeleton-loader')).not.toBeInTheDocument();
  });

  it('deve renderizar a tabela com os dados dos clientes', () => {
    // Princípio: Testar renderização de dados (PGEC 2.13)
    mockUseClientsQuery.mockReturnValue({ data: mockClients, isLoading: false });

    renderComponent();

    expect(screen.getByRole('table')).toBeInTheDocument();
    // Verifica se os nomes dos clientes estão na tela
    expect(screen.getByText('Alice Teste')).toBeInTheDocument();
    expect(screen.getByText('Bob Teste')).toBeInTheDocument();
    // Verifica se os emails estão na tela
    expect(screen.getByText('alice@teste.com')).toBeInTheDocument();
    expect(screen.getByText('bob@teste.com')).toBeInTheDocument();
  });

  it('deve abrir o modal de edição com o cliente correto ao clicar em "Editar"', async () => {
    // Princípio: Testar interação de UI (Abertura do Modal Nível 1)
    mockUseClientsQuery.mockReturnValue({ data: mockClients, isLoading: false });

    renderComponent();

    // Modal não deve estar visível
    expect(
      screen.queryByTestId('mock-client-form-modal'),
    ).not.toBeInTheDocument();

    // Encontra todos os botões de menu (um por linha)
    const actionButtons = screen.getAllByRole('button', {
      name: /Abrir menu/i,
    });
    // Clica no botão da primeira linha (Alice Teste)
    fireEvent.click(actionButtons[0]);

    // Clica em "Editar"
    const editButton = await screen.findByRole('menuitem', { name: /Editar/i });
    fireEvent.click(editButton);

    // Aguarda o modal aparecer
    await waitFor(() => {
      expect(
        screen.getByTestId('mock-client-form-modal'),
      ).toBeInTheDocument();
    });

    // Verifica se o modal foi aberto com os dados corretos (Alice)
    expect(screen.getByTestId('editing-client-name')).toHaveTextContent(
      'Alice Teste',
    );
  });

  it('deve fechar o modal ao simular o evento onClose', async () => {
    // Princípio: Testar gerenciamento de estado (Nível 1)
    mockUseClientsQuery.mockReturnValue({ data: mockClients, isLoading: false });

    renderComponent();

    // Abre o modal (mesma lógica do teste anterior)
    fireEvent.click(
      screen.getAllByRole('button', { name: /Abrir menu/i })[0],
    );
    fireEvent.click(await screen.findByRole('menuitem', { name: /Editar/i }));
    await waitFor(() => {
      expect(
        screen.getByTestId('mock-client-form-modal'),
      ).toBeInTheDocument();
    });

    // Simula o fechamento do modal (chamando a prop onClose)
    // O botão "Fechar Modal" está no nosso mock
    fireEvent.click(screen.getByRole('button', { name: /Fechar Modal/i }));

    // Aguarda o modal desaparecer
    await waitFor(() => {
      expect(
        screen.queryByTestId('mock-client-form-modal'),
      ).not.toBeInTheDocument();
    });
  });

  it('deve chamar a mutação de exclusão com o ID correto ao clicar em "Excluir"', async () => {
    // Princípio: Testar chamada de Mutation (CQRS 2.12 / PGEC 2.13)
    mockUseClientsQuery.mockReturnValue({ data: mockClients, isLoading: false });

    renderComponent();

    // Encontra todos os botões de menu
    const actionButtons = screen.getAllByRole('button', {
      name: /Abrir menu/i,
    });
    // Clica no botão da segunda linha (Bob Teste)
    fireEvent.click(actionButtons[1]);

    // Clica em "Excluir"
    const deleteButton = await screen.findByRole('menuitem', {
      name: /Excluir/i,
    });
    fireEvent.click(deleteButton);

    // Verifica se a mutação foi chamada com o ID correto (ID do Bob = 2)
    await waitFor(() => {
      expect(mockDeleteMutate).toHaveBeenCalledTimes(1);
      expect(mockDeleteMutate).toHaveBeenCalledWith(mockClients[1].id); // ID 2
    });
  });
});