import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Função utilitária para mesclar classes do Tailwind CSS de forma inteligente.
 * Permite a aplicação condicional de classes.
 [cite_start]* [cite: 229]
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formata um valor numérico (em cêntimos) para uma string de moeda no padrão BRL.
 * @param value O valor em cêntimos (ex: 12345 para R$ 123,45)
 * @returns A string formatada (ex: "R$ 123,45")
 [cite_start]* [cite: 229]
 */
export const formatCurrency = (value: number) => {
  const amountInReais = value / 100;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(amountInReais);
};

/**
 * Formata uma string de data (YYYY-MM-DD) ou objeto Date para o formato local (pt-BR).
 * @param dateString A data no formato "YYYY-MM-DD" ou um objeto Date
 * @returns A data formatada (ex: "dd/mm/aaaa")
 [cite_start]* [cite: 229]
 */
export const formatDate = (dateString: string | Date) => {
  if (typeof dateString === 'string') {
    // Adiciona T00:00:00 para garantir que a data seja interpretada como local,
    // evitando problemas de fuso horário que podem alterar o dia.
    return new Date(`${dateString}T00:00:00`).toLocaleDateString('pt-BR');
  }
  // Se já for um objeto Date
  return dateString.toLocaleDateString('pt-BR');
};