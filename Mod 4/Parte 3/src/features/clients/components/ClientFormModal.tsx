// /packages/web/src/features/clients/components/ClientFormModal.tsx

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/packages/ui/use-toast'; // Substituindo o context legado
import {
  ClientType,
  CreateClientSchema,
} from '@/packages/shared-types'; // Importando dos tipos compartilhados
import { useAddClientMutation } from '../hooks/useAddClientMutation';
import { useUpdateClientMutation } from '../hooks/useUpdateClientMutation';

// --- Componentes de UI ---
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/packages/ui/dialog';
import { Button } from '@/packages/ui/button';
import { Input } from '@/packages/ui/input'; // Usando o novo Input
import { Label } from '@/packages/ui/label';

// --- Componentes PrimeReact ---
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputMask } from 'primereact/inputmask';
import { Calendar, CalendarChangeParams } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';

// --- Ícones ---
import { User, Mail, Phone, Cake } from 'lucide-react';

// --- Definição de Tipos ---

// O Zod schema já define a forma, podemos inferi-la
type ClientFormData = z.infer<typeof CreateClientSchema>;

interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingClient: ClientType | null;
}

const genderOptions = [
  { label: 'Masculino', value: 'masculino' },
  { label: 'Feminino', value: 'feminino' },
  { label: 'Outro', value: 'outro' },
];

/**
 * Componente de modal para criar ou editar um Cliente.
 * Refatorado de src/react-app/components/ClientFormModal.tsx
 *
 * Princípios Aplicados:
 * - CDA (2.17): Usa os novos tokens de design (bg-card, text-foreground, etc) e componentes de UI.
 * - PGEC (2.13): O estado do formulário é Nível 1 (Local), gerenciado por react-hook-form.
 * - DSpP (2.16): Usa zodResolver com CreateClientSchema dos tipos compartilhados.
 * - CQRS (2.12): Chama os hooks de Mutation (Commands) para escrita.
 */
export function ClientFormModal({
  isOpen,
  onClose,
  editingClient,
}: ClientFormModalProps) {
  const { toast } = useToast();
  const addClientMutation = useAddClientMutation();
  const updateClientMutation = useUpdateClientMutation();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormData>({
    resolver: zodResolver(CreateClientSchema),
    mode: 'onChange',
  });

  // Carrega os dados do cliente no formulário ao abrir o modal em modo de edição
  useEffect(() => {
    if (isOpen) {
      if (editingClient) {
        reset({
          name: editingClient.name,
          phone: editingClient.phone || undefined,
          email: editingClient.email || undefined,
          notes: editingClient.notes || undefined,
          birth_date: editingClient.birth_date
            ? new Date(editingClient.birth_date)
            : undefined,
          gender: editingClient.gender || undefined,
        });
      } else {
        reset({
          name: '',
          phone: undefined,
          email: undefined,
          notes: undefined,
          birth_date: undefined,
          gender: undefined,
        });
      }
    }
  }, [isOpen, editingClient, reset]);

  const onSubmit = async (formData: ClientFormData) => {
    try {
      if (editingClient) {
        // Lógica de Atualização (Mutation)
        await updateClientMutation.mutateAsync({
          ...editingClient,
          ...formData,
        });
        toast({
          title: 'Cliente atualizado!',
          description: 'Os dados do cliente foram salvos com sucesso.',
        });
      } else {
        // Lógica de Criação (Mutation)
        // O `user_id` será adicionado no backend (api-client ou hook)
        await addClientMutation.mutateAsync(formData);
        toast({
          title: 'Cliente adicionado!',
          description: 'O novo cliente foi salvo com sucesso.',
        });
      }
      onClose();
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description:
          'Não foi possível salvar os dados do cliente. Tente novamente.',
        variant: 'destructive',
      });
      console.error('Erro ao salvar cliente:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          {/* Campo Nome */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Controller
              name="name"
              control={control}
              render={({ field, fieldState }) => (
                <span className="p-input-icon-left w-full">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <InputText
                    id={field.name}
                    {...field}
                    placeholder="Ex: Maria Silva"
                    className={`w-full pl-10 ${fieldState.error ? 'p-invalid' : ''}`}
                  />
                </span>
              )}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Campo Telefone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Controller
              name="phone"
              control={control}
              render={({ field, fieldState }) => (
                <span className="p-input-icon-left w-full">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <InputMask
                    id={field.name}
                    {...field}
                    value={field.value || ''}
                    mask="(99) 99999-9999"
                    placeholder="(11) 99999-9999"
                    className={`w-full pl-10 ${fieldState.error ? 'p-invalid' : ''}`}
                    unmask={true}
                  />
                </span>
              )}
            />
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone.message}</p>
            )}
          </div>

          {/* Campo Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Controller
              name="email"
              control={control}
              render={({ field, fieldState }) => (
                <span className="p-input-icon-left w-full">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <InputText
                    id={field.name}
                    {...field}
                    value={field.value || ''}
                    type="email"
                    placeholder="Ex: maria@email.com"
                    className={`w-full pl-10 ${fieldState.error ? 'p-invalid' : ''}`}
                  />
                </span>
              )}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          {/* Campos: Data de Nascimento e Gênero */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="birth_date">Data de Nascimento</Label>
              <Controller
                name="birth_date"
                control={control}
                render={({ field, fieldState }) => (
                  <Calendar
                    id={field.name}
                    value={field.value ? new Date(field.value) : null}
                    onChange={(e: CalendarChangeParams) =>
                      field.onChange(e.value)
                    }
                    dateFormat="dd/mm/yy"
                    placeholder="DD/MM/AAAA"
                    mask="99/99/9999"
                    showOnFocus={false}
                    className={`w-full ${fieldState.error ? 'p-invalid' : ''}`}
                    // Os estilos do PrimeReact são aplicados globalmente para usar tokens CSS
                  />
                )}
              />
              {errors.birth_date && (
                <p className="text-sm text-destructive">
                  {errors.birth_date.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gênero</Label>
              <Controller
                name="gender"
                control={control}
                render={({ field, fieldState }) => (
                  <Dropdown
                    id={field.name}
                    value={field.value}
                    options={genderOptions}
                    onChange={(e) => field.onChange(e.value)}
                    placeholder="Selecione"
                    className={`w-full ${fieldState.error ? 'p-invalid' : ''}`}
                  />
                )}
              />
              {errors.gender && (
                <p className="text-sm text-destructive">
                  {errors.gender.message}
                </p>
              )}
            </div>
          </div>

          {/* Campo Notas */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Controller
              name="notes"
              control={control}
              render={({ field }) => (
                <InputTextarea
                  id={field.name}
                  {...field}
                  value={field.value || ''}
                  rows={3}
                  className="w-full"
                  placeholder="Preferências, observações..."
                  autoResize
                />
              )}
            />
            {errors.notes && (
              <p className="text-sm text-destructive">{errors.notes.message}</p>
            )}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={isSubmitting || addClientMutation.isPending || updateClientMutation.isPending}
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Cliente'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}