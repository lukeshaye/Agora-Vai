"use client";

import React, { useState } from "react";
import {
  ColumnDef,
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import { z } from "zod";
import { MoreHorizontal, Edit, Trash } from "lucide-react";

// [CORREÇÃO 1 (CDA 2.17)]: Importando os componentes de tabela corretos,
// conforme especificado no plano (CDA 2.17).
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/packages/ui/table";
// [CORREÇÃO 2 (CDA 2.17)]: Importando o componente Skeleton para o estado de loading.
import { Skeleton } from "@/packages/ui/skeleton";

import { Button } from "@/packages/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/packages/ui/dropdown-menu";

import { ClientSchema } from "@/packages/shared-types";
import { useClientsQuery } from "../hooks/useClientsQuery";
import { useDeleteClientMutation } from "../hooks/useDeleteClientMutation";
import { ClientFormModal } from "./ClientFormModal";

// Infer the type from the Zod schema as specified in the feature plan context
type ClientType = z.infer<typeof ClientSchema>;

// Definição das colunas movida para fora para clareza, mas os handlers
// serão passados da instância do componente.
const getColumns = (
  onEdit: (client: ClientType) => void,
  onDelete: (id: number) => void,
): ColumnDef<ClientType>[] => [
  {
    accessorKey: "name",
    header: "Nome",
  },
  {
    accessorKey: "phone",
    header: "Telefone",
    cell: ({ row }) => row.original.phone || "N/A",
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => row.original.email || "N/A",
  },
  {
    accessorKey: "gender",
    header: "Gênero",
    cell: ({ row }) => row.original.gender || "N/A",
  },
  {
    accessorKey: "birth_date",
    header: "Nascimento",
    cell: ({ row }) =>
      row.original.birth_date
        // Garantindo que a data seja tratada corretamente
        ? new Date(row.original.birth_date + "T00:00:00").toLocaleDateString(
            "pt-BR",
            { timeZone: "UTC" },
          )
        : "N/A",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const client = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onEdit(client)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              // [CORREÇÃO 3 (DSpP 2.16)]: Adicionada verificação de segurança.
              // Remove o uso do operador '!' (non-null assertion).
              onClick={() => {
                if (client.id) {
                  onDelete(client.id);
                }
              }}
            >
              <Trash className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

/**
 * ClientsDataTable
 * Conforme Plano 2.4 / Princípios SoC (2.5), PGEC (2.13), CDA (2.17).
 * - Exibe dados do Nível 3 (useClientsQuery).
 * - Chama mutações do Nível 3 (useDeleteClientMutation).
 * - Gerencia estado local (Nível 1) para o modal de edição.
 * - Usa componentes de @/packages/ui/table (CDA 2.17).
 */
export function ClientsDataTable() {
  // Estado para controlar o modal de edição (PGEC Nível 1)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientType | null>(null);

  // Hooks de Query e Mutation (PGEC Nível 3)
  const { data: clients, isLoading } = useClientsQuery();
  const { mutate: deleteClient } = useDeleteClientMutation();

  // Handlers para as ações da tabela
  const handleEdit = (client: ClientType) => {
    setEditingClient(client);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    // A lógica de confirmação (modal) deve ser tratada
    // antes de chamar a mutação, idealmente.
    deleteClient(id);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingClient(null);
  };

  // Memoiza as colunas para evitar recálculo
  const columns = React.useMemo(
    () => getColumns(handleEdit, handleDelete),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const table = useReactTable({
    data: clients || [], // Garante que os dados nunca sejam undefined
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  // [CORREÇÃO 2 (CDA 2.17)]: Substitui <div> por Skeleton
  // para um estado de carregamento consistente com o Design System.
  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  // [CORREÇÃO 1 (CDA 2.17)]: Renderiza a tabela usando os componentes
  // de @/packages/ui/table, conforme o plano.
  return (
    <div>
      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  Nenhum cliente encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {isModalOpen && (
        <ClientFormModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          editingClient={editingClient}
          onClientCreated={() => {
            /* Não aplicável no contexto de edição */
          }}
        />
      )}
    </div>
  );
}