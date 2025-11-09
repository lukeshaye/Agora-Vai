// /packages/web/src/features/clients/components/ClientFormModal.test.tsx

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ClientFormModal } from './ClientFormModal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClientType } from '@/packages/shared-types';
import 'vitest-dom/extend-expect';

// --- Mocks ---

// Mock das mutações
const mockAddClient = vi.fn();
const mockUpdateClient = vi.fn();

vi.mock('../hooks/useAddClientMutation', () => ({
  useAddClientMutation: () => ({
    mutateAsync: mockAddClient,
    isPending: false,
  }),
}));

vi.mock('../hooks/useUpdateClientMutation', () => ({
  useUpdateClientMutation: () => ({
    mutateAsync: mockUpdateClient,
    isPending: false,
  }),
}));

// Mock do hook de toast
const mockToast = vi.fn();
vi.mock('@/packages/ui/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// --- Test Setup ---

const queryClient = new QueryClient();

// Helper para renderizar o componente com os provedores necessários
const renderComponent = (
  props: Partial<React.ComponentProps<typeof ClientFormModal>>,
) => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    editingClient: null,
  };

  return render(
    <QueryClientProvider client={queryClient}>
      <ClientFormModal {...defaultProps} {...props} />
    </QueryClientProvider>,
  );
};

// Mock de um cliente para testes de edição
const mockClient: ClientType = {
  id: 'client-1',
  user_id: 'user-123',
  name: 'Maria Silva',
  phone: '11999998888',
  email: 'maria@email.com',
  notes: 'Preferência por chás.',
  birth_date: '1990-05-15T00:00:00.000Z',
  gender: 'feminino',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// Limpar mocks antes de cada teste
beforeEach(() => {
  vi.clearAllMocks();
  // Resetar implementações de mock para o estado de sucesso padrão
  mockAddClient.mockResolvedValue({});
  mockUpdateClient.mockResolvedValue({});
});

// --- Test Suites ---

describe('ClientFormModal', () => {
  it('deve renderizar o título "Novo Cliente" e campos vazios no modo de criação', () => {
    renderComponent({ isOpen: true, editingClient: null });

    expect(
      screen.getByRole('heading', { name: /Novo Cliente/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Nome \*/i)).toHaveValue('');
    expect(screen.getByLabelText(/Telefone/i)).toHaveValue('');
    expect(screen.getByLabelText(/Email/i)).toHaveValue('');
    expect(screen.getByLabelText(/Notas/i)).toHaveValue('');
  });

  it('deve renderizar o título "Editar Cliente" e preencher os campos no modo de edição', () => {
    renderComponent({ isOpen: true, editingClient: mockClient });

    expect(
      screen.getByRole('heading', { name: /Editar Cliente/i }),
    ).toBeInTheDocument();
    
    // Os campos do PrimeReact com `value={field.value || ''}` são preenchidos
    expect(screen.getByLabelText(/Nome \*/i)).toHaveValue(mockClient.name);
    // InputMask formata o valor, então verificamos o valor formatado esperado
    expect(screen.getByLabelText(/Telefone/i)).toHaveValue('(11) 99999-8888');
    expect(screen.getByLabelText(/Email/i)).toHaveValue(mockClient.email);
    expect(screen.getByLabelText(/Notas/i)).toHaveValue(mockClient.notes);
    // O Calendar e Dropdown são mais complexos de testar o valor exibido,
    // mas o `useEffect` garante que o `reset` do react-hook-form foi chamado.
  });

  it('deve exibir erros de validação do Zod ao tentar submeter um formulário inválido', async () => {
    renderComponent({ isOpen: true, editingClient: null });

    // Tenta submeter sem preencher o nome (obrigatório)
    fireEvent.click(screen.getByRole('button', { name: /Salvar Cliente/i }));

    // Aguarda a exibição da mensagem de erro do Zod
    await waitFor(() => {
      // O CreateClientSchema (do shared-types) define a mensagem
      // Assumindo que a mensagem para nome obrigatório seja algo como "obrigatório"
      expect(screen.getByText(/obrigatório/i)).toBeInTheDocument();
    });

    // Verifica que nenhuma mutação foi chamada
    expect(mockAddClient).not.toHaveBeenCalled();
    expect(mockUpdateClient).not.toHaveBeenCalled();
  });

  it('deve chamar a mutação de adicionar, exibir toast e fechar ao submeter um novo cliente válido', async () => {
    const mockOnClose = vi.fn();
    renderComponent({ isOpen: true, editingClient: null, onClose: mockOnClose });

    const newClientData = {
      name: 'Cliente Teste',
      phone: '21987654321', // O InputMask deve lidar com a máscara
      email: 'teste@email.com',
    };

    // Preenche o formulário
    fireEvent.change(screen.getByLabelText(/Nome \*/i), {
      target: { value: newClientData.name },
    });
    // O InputMask do PrimeReact precisa de um evento `input` para `unmask`
    fireEvent.input(screen.getByLabelText(/Telefone/i), {
      target: { value: newClientData.phone },
    });
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: newClientData.email },
    });

    // Submete
    fireEvent.click(screen.getByRole('button', { name: /Salvar Cliente/i }));

    // Aguarda a chamada da mutação
    await waitFor(() => {
      expect(mockAddClient).toHaveBeenCalledTimes(1);
      // Verifica se os dados (com defaults do Zod para campos vazios) foram enviados
      expect(mockAddClient).toHaveBeenCalledWith(
        expect.objectContaining({
          name: newClientData.name,
          phone: newClientData.phone,
          email: newClientData.email,
        }),
      );
    });

    // Aguarda o toast e o fechamento
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Cliente adicionado!' }),
      );
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  it('deve chamar a mutação de atualizar, exibir toast e fechar ao submeter um cliente editado', async () => {
    const mockOnClose = vi.fn();
    renderComponent({
      isOpen: true,
      editingClient: mockClient,
      onClose: mockOnClose,
    });

    const updatedName = 'Maria Silva Atualizada';

    // Edita o nome
    fireEvent.change(screen.getByLabelText(/Nome \*/i), {
      target: { value: updatedName },
    });

    // Submete
    fireEvent.click(screen.getByRole('button', { name: /Salvar Cliente/i }));

    // Aguarda a chamada da mutação
    await waitFor(() => {
      expect(mockUpdateClient).toHaveBeenCalledTimes(1);
      expect(mockUpdateClient).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockClient,
          name: updatedName,
          // O RHF envia o estado completo do formulário
          birth_date: new Date(mockClient.birth_date!), 
        }),
      );
    });

    // Aguarda o toast e o fechamento
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Cliente atualizado!' }),
      );
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  it('deve exibir um toast de erro se a mutação falhar', async () => {
    const mockOnClose = vi.fn();
    const error = new Error('Falha na API');
    mockAddClient.mockRejectedValue(error); // Simula falha na API

    renderComponent({ isOpen: true, editingClient: null, onClose: mockOnClose });

    // Preenche o campo obrigatório
    fireEvent.change(screen.getByLabelText(/Nome \*/i), {
      target: { value: 'Cliente Falho' },
    });

    // Submete
    fireEvent.click(screen.getByRole('button', { name: /Salvar Cliente/i }));

    // Aguarda o toast de erro
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Erro ao salvar',
          variant: 'destructive',
        }),
      );
    });

    // O modal NÃO deve fechar em caso de erro
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('deve chamar onClose ao clicar no botão "Cancelar"', () => {
    const mockOnClose = vi.fn();
    renderComponent({ isOpen: true, onClose: mockOnClose });

    fireEvent.click(screen.getByRole('button', { name: /Cancelar/i }));

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});