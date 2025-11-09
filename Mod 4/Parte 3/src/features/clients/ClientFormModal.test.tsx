// /packages/web/src/features/clients/components/ClientFormModal.test.tsx

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event'; // Usar userEvent para interações complexas
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
const user = userEvent.setup();

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
  phone: '11999998888', // Valor bruto, sem máscara
  email: 'maria@email.com',
  notes: 'Preferência por chás.',
  birth_date: '1990-05-15T00:00:00.000Z', // 15 de Maio de 1990
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
    
    // Campos Shadcn (Select e Calendar)
    expect(
      screen.getByRole('button', { name: /DD\/MM\/AAAA/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /Gênero/i })).toHaveTextContent(
      'Selecione',
    );
  });

  it('deve renderizar o título "Editar Cliente" e preencher os campos no modo de edição', async () => {
    renderComponent({ isOpen: true, editingClient: mockClient });

    expect(
      screen.getByRole('heading', { name: /Editar Cliente/i }),
    ).toBeInTheDocument();

    // Campos de texto
    expect(screen.getByLabelText(/Nome \*/i)).toHaveValue(mockClient.name);
    expect(screen.getByLabelText(/Telefone/i)).toHaveValue(mockClient.phone);
    expect(screen.getByLabelText(/Email/i)).toHaveValue(mockClient.email);
    expect(screen.getByLabelText(/Notas/i)).toHaveValue(mockClient.notes);

    // Shadcn Calendar (PopoverTrigger)
    // O valor é formatado para 'dd/MM/yyyy'
    expect(
      screen.getByRole('button', { name: /15\/05\/1990/i }),
    ).toBeInTheDocument();

    // Shadcn Select (SelectTrigger)
    expect(screen.getByRole('combobox', { name: /Gênero/i })).toHaveTextContent(
      /Feminino/i,
    );
  });

  it('deve exibir erros de validação do Zod ao tentar submeter um formulário inválido', async () => {
    renderComponent({ isOpen: true, editingClient: null });

    // Tenta submeter sem preencher o nome (obrigatório)
    await user.click(screen.getByRole('button', { name: /Salvar Cliente/i }));

    // Aguarda a exibição da mensagem de erro do Zod (Renderizada pelo <FormMessage />)
    await waitFor(() => {
      // Assumindo que a mensagem do Zod para 'name' seja "Nome é obrigatório"
      expect(screen.getByText(/Nome é obrigatório/i)).toBeInTheDocument();
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
      phone: '21987654321', // Valor bruto
      email: 'teste@email.com',
    };

    // Preenche o formulário
    await user.type(
      screen.getByLabelText(/Nome \*/i),
      newClientData.name,
    );
    await user.type(
      screen.getByLabelText(/Telefone/i),
      newClientData.phone,
    );
    await user.type(
      screen.getByLabelText(/Email/i),
      newClientData.email,
    );

    // Seleciona Gênero
    await user.click(screen.getByRole('combobox', { name: /Gênero/i }));
    await user.click(screen.getByRole('option', { name: /Masculino/i }));

    // Seleciona Data (ex: 10º dia do mês visível)
    await user.click(
      screen.getByRole('button', { name: /DD\/MM\/AAAA/i }),
    );
    await user.click(screen.getByRole('gridcell', { name: /10/i }));

    // Submete
    await user.click(screen.getByRole('button', { name: /Salvar Cliente/i }));

    // Aguarda a chamada da mutação
    await waitFor(() => {
      expect(mockAddClient).toHaveBeenCalledTimes(1);
      // Verifica se os dados (com defaults do Zod) foram enviados
      expect(mockAddClient).toHaveBeenCalledWith(
        expect.objectContaining({
          name: newClientData.name,
          phone: newClientData.phone,
          email: newClientData.email,
          gender: 'masculino',
          birth_date: expect.any(Date), // Verifica se uma data foi enviada
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
    const nameInput = screen.getByLabelText(/Nome \*/i);
    await user.clear(nameInput);
    await user.type(nameInput, updatedName);

    // Submete
    await user.click(screen.getByRole('button', { name: /Salvar Cliente/i }));

    // Aguarda a chamada da mutação
    await waitFor(() => {
      expect(mockUpdateClient).toHaveBeenCalledTimes(1);
      expect(mockUpdateClient).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockClient, // ID e dados originais
          name: updatedName, // Dado atualizado
          // O RHF envia o estado completo, incluindo a Data
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
    await user.type(screen.getByLabelText(/Nome \*/i), 'Cliente Falho');

    // Submete
    await user.click(screen.getByRole('button', { name: /Salvar Cliente/i }));

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

  it('deve chamar onClose ao clicar no botão "Cancelar"', async () => {
    const mockOnClose = vi.fn();
    renderComponent({ isOpen: true, onClose: mockOnClose });

    await user.click(screen.getByRole('button', { name: /Cancelar/i }));

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});