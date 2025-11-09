/*
 * TAREFA: /packages/web/src/features/auth/components/LoginForm.test.ts
 * [cite_start]PLANO: Testar a validação (Zod) e a submissão do formulário (LoginForm.test.ts). [cite: 49]
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';

// Mockar o cliente Supabase
const mockSignInWithPassword = vi.fn();
vi.mock('@/packages/core-supabase/db-client', () => ({
  supabase: {
    auth: {
      signInWithPassword: mockSignInWithPassword,
    },
  },
}));

// Mockar os ícones lucide-react para testes limpos
vi.mock('lucide-react', async (importOriginal) => {
  const mod = await importOriginal<typeof import('lucide-react')>();
  return {
    ...mod,
    Mail: () => <svg data-testid="mail-icon" />,
    Lock: () => <svg data-testid="lock-icon" />,
    AlertCircle: () => <svg data-testid="alert-icon" />,
    Scissors: () => <svg data-testid="scissors-icon" />,
  };
});

describe('LoginForm.tsx', () => {

  beforeEach(() => {
    vi.clearAllMocks(); // Limpa mocks entre os testes
    mockSignInWithPassword.mockResolvedValue({ error: null }); // Sucesso por padrão
  });

  it('deve renderizar o formulário de login corretamente', () => {
    render(<LoginForm />);

    // Verifica o header
    expect(screen.getByText('SalonFlow')).toBeInTheDocument();
    expect(screen.getByText('Bem-vindo de volta!')).toBeInTheDocument();
    
    // Verifica os campos do formulário
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('voce@exemplo.com')).toBeInTheDocument();
    
    expect(screen.getByLabelText(/Senha/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();

    // Verifica o botão
    expect(screen.getByRole('button', { name: /Entrar/i })).toBeInTheDocument();

    // Verifica os ícones
    expect(screen.getByTestId('mail-icon')).toBeInTheDocument();
    expect(screen.getByTestId('lock-icon')).toBeInTheDocument();
    expect(screen.getByTestId('scissors-icon')).toBeInTheDocument();
  });

  it('deve mostrar erros de validação (Zod) para campos inválidos', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    
    const submitButton = screen.getByRole('button', { name: /Entrar/i });
    
    // 1. Tenta submeter vazio
    await user.click(submitButton);

    // Espera os erros aparecerem
    expect(await screen.findByText('Email inválido')).toBeInTheDocument();
    expect(await screen.findByText('A senha deve ter no mínimo 6 caracteres')).toBeInTheDocument();

    // 2. Digita email inválido
    const emailInput = screen.getByLabelText(/Email/i);
    await user.type(emailInput, 'email-invalido');
    await user.click(submitButton);
    expect(await screen.findByText('Email inválido')).toBeInTheDocument();

    // 3. Digita senha curta
    const passwordInput = screen.getByLabelText(/Senha/i);
    await user.type(passwordInput, '123');
    await user.click(submitButton);
    expect(await screen.findByText('A senha deve ter no mínimo 6 caracteres')).toBeInTheDocument();
  });

  it('deve chamar supabase.auth.signInWithPassword com os dados corretos ao submeter', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/Senha/i);
    const submitButton = screen.getByRole('button', { name: /Entrar/i });

    // Preenche o formulário
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    // Submete
    await user.click(submitButton);

    // Verifica o estado de loading no botão
    await waitFor(() => {
      expect(screen.getByText('Aguarde...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    // Verifica se a função do Supabase foi chamada corretamente
    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledTimes(1);
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    // Verifica se o loading terminou (o auth provider faria o redirect)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Entrar/i })).toBeInTheDocument();
      expect(screen.queryByText('Aguarde...')).not.toBeInTheDocument();
    });
  });

  it('deve exibir uma mensagem de erro se a autenticação falhar', async () => {
    const user = userEvent.setup();
    
    // Configura o mock para retornar um erro
    const authErrorMessage = 'Invalid login credentials';
    mockSignInWithPassword.mockResolvedValue({ 
      error: { message: authErrorMessage } 
    });

    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/Senha/i);
    const submitButton = screen.getByRole('button', { name: /Entrar/i });

    // Preenche o formulário
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'wrongpassword');
    
    // Submete
    await user.click(submitButton);

    // Espera o loading...
    await waitFor(() => {
      expect(screen.getByText('Aguarde...')).toBeInTheDocument();
    });

    // Espera a mensagem de erro aparecer
    await waitFor(() => {
      expect(screen.getByText(authErrorMessage)).toBeInTheDocument();
      expect(screen.getByTestId('alert-icon')).toBeInTheDocument();
    });

    // Verifica se o loading terminou
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Entrar/i })).toBeInTheDocument();
      expect(screen.queryByText('Aguarde...')).not.toBeInTheDocument();
    });
  });
});