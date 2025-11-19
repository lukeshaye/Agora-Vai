import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { ptBR } from "date-fns/locale";
import { z } from "zod";

import { CreateFinancialEntrySchema } from "@/packages/shared-types";
import type { FinancialEntry, CreateFinancialEntry } from "@/packages/shared-types";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Schema local estendido para lidar com a coerção de string para número no input
// Isso permite uma UX fluida para digitação de decimais (ex: "10.")
const FormSchema = CreateFinancialEntrySchema.extend({
  amount: z.coerce.number().positive("O valor deve ser positivo"),
});

type FormData = z.infer<typeof FormSchema>;

interface FinancialFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: FinancialEntry | null;
  onSubmit: (data: CreateFinancialEntry) => Promise<void>;
  isSubmitting?: boolean;
}

export function FinancialFormModal({
  open,
  onOpenChange,
  initialData,
  onSubmit,
  isSubmitting = false,
}: FinancialFormModalProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      description: "",
      amount: 0,
      type: "receita",
      entry_type: "pontual",
      entry_date: new Date(),
    },
  });

  // Resetar o formulário quando o modal abre ou os dados iniciais mudam
  useEffect(() => {
    if (open) {
      if (initialData) {
        form.reset({
          description: initialData.description,
          // Converte centavos para reais para edição no input
          amount: initialData.amount / 100,
          type: initialData.type,
          entry_type: initialData.entry_type,
          entry_date: new Date(initialData.entry_date),
        });
      } else {
        form.reset({
          description: "",
          amount: 0,
          type: "receita",
          entry_type: "pontual",
          entry_date: new Date(),
        });
      }
    }
  }, [open, initialData, form]);

  const handleSubmit = async (values: FormData) => {
    // Converter o valor de volta para centavos antes de enviar (ex: 12.34 -> 1234)
    // O valor já chega aqui como número graças ao z.coerce.number()
    const payload: CreateFinancialEntry = {
      ...values,
      amount: Math.round(values.amount * 100),
    };
    await onSubmit(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Editar Lançamento" : "Novo Lançamento"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Campo: Descrição */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Venda de Produtos" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Campo: Valor */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor (R$)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      {...field}
                      // Removemos o onChange manual. O {...field} já gerencia o evento corretamente.
                      // A coerção para número é feita pelo Zod no submit/validação.
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              {/* Campo: Tipo (Receita/Despesa) */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="receita">Receita</SelectItem>
                        <SelectItem value="despesa">Despesa</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Campo: Frequência (Pontual/Fixa) */}
              <FormField
                control={form.control}
                name="entry_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequência</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pontual">Pontual</SelectItem>
                        <SelectItem value="fixa">Fixa</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Campo: Data (Date-fns + Locale pt-BR) */}
            <FormField
              control={form.control}
              name="entry_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data do Lançamento</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP", { locale: ptBR })
                          ) : (
                            <span>Selecione uma data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {initialData ? "Salvar Alterações" : "Criar Lançamento"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}