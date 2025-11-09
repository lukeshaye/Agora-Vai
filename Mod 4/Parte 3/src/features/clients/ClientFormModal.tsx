// /packages/web/src/features/clients/components/ClientFormModal.tsx

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/packages/ui/use-toast';
import { ClientType, CreateClientSchema } from '@/packages/shared-types'; // [cite: 41, 46]
import { useAddClientMutation } from '../hooks/useAddClientMutation'; // 
import { useUpdateClientMutation } from '../hooks/useUpdateClientMutation'; // 
import { format } from 'date-fns'; // Necessário para formatar a data no Popover

// --- Componentes de UI (Shadcn) ---
// 
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/packages/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/packages/ui/form';
import { Button } from '@/packages/ui/button';
import { Input } from '@/packages/ui/input';
import { Textarea } from '@/packages/ui/textarea'; // Substituindo InputTextarea
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/packages/ui/popover'; // Para o Calendar
import { Calendar } from '@/packages/ui/calendar'; // Para seletor de data
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/packages/ui/select'; // Para dropdowns

// --- Ícones ---
import { User, Mail, Phone, CalendarIcon } from 'lucide-react';

// --- Definição de Tipos ---
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
 * - CDA (2.17): Usa os novos tokens de design e componentes de UI (Shadcn). [cite: 44]
 * - PGEC (2.13): O estado do formulário é Nível 1 (Local), gerenciado por react-hook-form. [cite: 45]
 * - DSpP (2.16): Usa zodResolver com CreateClientSchema dos tipos compartilhados. [cite: 46]
 * - CQRS (2.12): Chama os hooks de Mutation (Commands) para escrita. [cite: 43]
 */
export function ClientFormModal({
  isOpen,
  onClose,
  editingClient,
}: ClientFormModalProps) {
  const { toast } = useToast();
  const addClientMutation = useAddClientMutation();
  const updateClientMutation = useUpdateClientMutation();

  const form = useForm<ClientFormData>({
    resolver: zodResolver(CreateClientSchema), // [cite: 46]
    mode: 'onChange',
  });

  // Carrega os dados do cliente no formulário ao abrir o modal em modo de edição
  useEffect(() => {
    if (isOpen) {
      if (editingClient) {
        form.reset({
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
        form.reset({
          name: '',
          phone: undefined,
          email: undefined,
          notes: undefined,
          birth_date: undefined,
          gender: undefined,
        });
      }
    }
  }, [isOpen, editingClient, form]);

  const onSubmit = async (formData: ClientFormData) => {
    try {
      if (editingClient) {
        // Lógica de Atualização (Mutation) [cite: 43]
        await updateClientMutation.mutateAsync({
          ...editingClient,
          ...formData,
        });
        toast({
          title: 'Cliente atualizado!',
          description: 'Os dados do cliente foram salvos com sucesso.',
        });
      } else {
        // Lógica de Criação (Mutation) [cite: 43]
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

  const isSubmitting = form.formState.isSubmitting || addClientMutation.isPending || updateClientMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
          </DialogTitle>
        </DialogHeader>

        {/* Usando o wrapper <Form> do Shadcn para integração automática 
          com react-hook-form (PGEC 2.13 Nível 1) [cite: 45]
        */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            {/* Campo Nome */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Ex: Maria Silva" className="pl-10" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Campo Telefone (Substituindo InputMask por Input) */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      {/* InputMask foi removido conforme CDA 2.17[cite: 9]. 
                          Se a máscara for essencial, uma lib como 'react-input-mask' 
                          deve ser usada, não primereact. */}
                      <Input placeholder="(11) 99999-9999" className="pl-10" {...field} value={field.value || ''} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Campo Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input type="email" placeholder="Ex: maria@email.com" className="pl-10" {...field} value={field.value || ''} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Campos: Data de Nascimento e Gênero */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Data de Nascimento (Usando Popover e Calendar)  */}
              <FormField
                control={form.control}
                name="birth_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col space-y-2">
                    <FormLabel>Data de Nascimento</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={`
                              w-full justify-start text-left font-normal
                              ${!field.value && 'text-muted-foreground'}
                            `}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? (
                              format(field.value, 'dd/MM/yyyy')
                            ) : (
                              <span>DD/MM/AAAA</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date('1900-01-01')
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Gênero (Usando Select)  */}
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gênero</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {genderOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Campo Notas (Usando Textarea) */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Preferências, observações..."
                      className="resize-none"
                      rows={3}
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : 'Salvar Cliente'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}