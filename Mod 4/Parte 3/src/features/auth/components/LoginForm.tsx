import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/packages/ui/button';
import { Input } from '@/packages/ui/input';
import { Label } from '@/packages/ui/label';
import { useAuth } from '../hooks/useAuth';
import { Mail, Lock, AlertCircle, Scissors } from 'lucide-react';
import { supabase } from '@/packages/core-supabase/db-client'; // Assumindo o novo path do cliente supabase

// DSpP (2.16): Usar zod e zodResolver para validar o formato do email e a senha mínima.
const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

/**
 * Componente de formulário de login, migrado de Home.tsx.
 * Gerencia o estado local do formulário e chama a lógica de autenticação.
 */
export function LoginForm() {
  // PGEC (2.13): O estado do formulário é Nível 1 (Estado Local).
  // O estado de erro da *tentativa* de auth é local para este formulário.
  const [authError, setAuthError] = useState<string | null>(null);
  
  // A lógica de auth (signIn) é abstraída, mas o estado de submissão é local.
  // const { signIn } = useAuth(); [cite_start]// O plano [cite: 251] é ambíguo se `useAuth` provê `signIn` ou se chamamos direto.
  [cite_start]// Refatorando de Home.tsx[cite: 247], que chama o supabase direto.
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  [cite_start]// Migrado de handleAuth em Home.tsx [cite: 250]
  const onSubmit = async (data: LoginFormValues) => {
    setAuthError(null);
    try {
      [cite_start]// O plano [cite: 251] permite chamar diretamente.
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (error) throw error;
      [cite_start]// O hook useAuth (baseado no SupabaseAuthProvider) detectará a mudança de estado [cite: 235]
    } catch (err: any) {
      setAuthError(err.error_description || err.message || "Ocorreu um erro.");
    }
  };

  return (
    [cite_start]// UI migrada de Home.tsx [cite: 249]
    <div className="w-full max-w-md">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center bg-gradient-to-r from-primary to-secondary rounded-2xl p-4 mb-6 shadow-lg">
          <Scissors className="w-10 h-10 text-primary-foreground" />
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
          SalonFlow
        </h1>
        <p className="text-muted-foreground text-lg">
          Bem-vindo de volta!
        </p>
        <p className="text-muted-foreground text-sm mt-1">
          Faça login para acessar sua conta
        </p>
      </div>

      [cite_start]{/* CDA (2.17): Tradução de classes para tokens (bg-card, border-border) [cite: 254] */}
      <div className="bg-card p-8 rounded-2xl shadow-xl border border-border backdrop-blur-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Campo Email */}
          <div>
            <Label htmlFor="email" className="block text-sm font-semibold text-foreground mb-2">
              Email
            </Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-muted-foreground" />
              </div>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                {...register("email")}
                [cite_start]// CDA (2.17): Inputs com focus:ring-ring, focus:border-ring [cite: 255]
                className="w-full pl-12 pr-4 py-3 border border-border rounded-xl shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all"
                placeholder="voce@exemplo.com"
              />
            </div>
            {errors.email && <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>}
          </div>

          {/* Campo Senha */}
          <div>
            <Label htmlFor="password" className="block text-sm font-semibold text-foreground mb-2">
              Senha
            </Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-muted-foreground" />
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register("password")}
                className="w-full pl-12 pr-4 py-3 border border-border rounded-xl shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all"
                placeholder="••••••••"
              />
            </div>
            {errors.password && <p className="mt-1 text-sm text-destructive">{errors.password.message}</p>}
          </div>
          
          {/* Exibição de erro de autenticação (migrado do Home.tsx) */}
          {authError && (
            <div className="bg-destructive/10 border border-destructive/30 p-4 rounded-xl flex items-start">
              <AlertCircle className="h-5 w-5 text-destructive mr-3 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-destructive">{authError}</p>
            </div>
          )}

          {/* Botão de Submissão */}
          <div className="pt-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              [cite_start]// CDA (2.17): Botão com gradiente e cores de foreground [cite: 256]
              className="w-full flex justify-center items-center py-3 px-6 border border-transparent rounded-xl shadow-lg text-base font-semibold text-primary-foreground bg-gradient-to-r from-primary to-secondary hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Aguarde...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </div>
        </form>
      </div>
      
      {/* Footer (migrado do Home.tsx) */}
      <div className="text-center mt-8">
        <p className="text-sm text-muted-foreground">
          Sistema de gestão para salões de beleza
        </p>
      </div>
    </div>
  );
}