"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { listSectorMappings, listUnmappedSectors, upsertSectorMapping, deleteSectorMapping } from "@/lib/services/admin/cvm-registry";
import type { CVMSectorMappingResponse } from "@/lib/services/admin/types";

const mappingSchema = z.object({
  cvm_setor_atividade: z
    .string()
    .min(1, "Informe o setor CVM.")
    .max(255, "Use no maximo 255 caracteres."),
  internal_sector_slug: z
    .string()
    .min(1, "Informe o slug interno.")
    .max(100, "Use no maximo 100 caracteres."),
  notes: z.string().max(500, "Use no maximo 500 caracteres.").optional().or(z.literal("")),
});

type MappingValues = z.infer<typeof mappingSchema>;

export default function SectorMappingPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const form = useForm<MappingValues>({
    resolver: zodResolver(mappingSchema),
    defaultValues: {
      cvm_setor_atividade: "",
      internal_sector_slug: "",
      notes: "",
    },
  });

  const mappingsQuery = useQuery({
    queryKey: ["cvm", "sector-mapping"],
    queryFn: listSectorMappings,
  });

  const unmappedQuery = useQuery({
    queryKey: ["cvm", "sector-mapping", "unmapped"],
    queryFn: listUnmappedSectors,
  });

  const upsertMutation = useMutation({
    mutationFn: (values: MappingValues) =>
      upsertSectorMapping({
        ...values,
        notes: values.notes || undefined,
      }),
    onSuccess: () => {
      toast.success("Mapeamento salvo.");
      queryClient.invalidateQueries({ queryKey: ["cvm", "sector-mapping"] });
      setOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (cvmSetor: string) => deleteSectorMapping(cvmSetor),
    onSuccess: () => {
      toast.success("Mapeamento removido.");
      queryClient.invalidateQueries({ queryKey: ["cvm", "sector-mapping"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const columns: DataTableColumn<CVMSectorMappingResponse>[] = [
    {
      key: "cvm",
      header: "Setor CVM",
      render: (row) => row.cvm_setor_atividade,
    },
    {
      key: "slug",
      header: "Slug interno",
      render: (row) => row.internal_sector_slug,
    },
    {
      key: "notes",
      header: "Notas",
      render: (row) => row.notes ?? "—",
    },
    {
      key: "actions",
      header: "Acoes",
      render: (row) => (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              form.reset({
                cvm_setor_atividade: row.cvm_setor_atividade,
                internal_sector_slug: row.internal_sector_slug,
                notes: row.notes ?? "",
              });
              setOpen(true);
            }}
          >
            <Pencil className="size-4" />
            Editar
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(event) => event.stopPropagation()}
              >
                <Trash2 className="size-4" />
                Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remover mapeamento?</AlertDialogTitle>
                <AlertDialogDescription>
                  O setor `{row.cvm_setor_atividade}` voltara a aparecer como pendente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => deleteMutation.mutate(row.cvm_setor_atividade)}>
                  Confirmar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <CardTitle>Mapeamento setorial CVM</CardTitle>
            <CardDescription>
              O backend nao expoe lista de setores internos, entao o slug e informado diretamente no form.
            </CardDescription>
          </div>

          <Button
            type="button"
            className="rounded-full"
            onClick={() => {
              form.reset();
              setOpen(true);
            }}
          >
            <Plus className="size-4" />
            Novo mapeamento
          </Button>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Setores pendentes</CardTitle>
          <CardDescription>
            Amostra dos setores CVM detectados em empresas, mas ainda sem slug interno associado.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {(unmappedQuery.data ?? []).map((item) => (
            <button
              type="button"
              key={item.cvm_setor_atividade}
              className="rounded-3xl border border-dashed border-border/80 bg-background/70 p-4 text-left transition hover:border-primary/30 hover:bg-primary/5"
              onClick={() => {
                form.reset({
                  cvm_setor_atividade: item.cvm_setor_atividade,
                  internal_sector_slug: "",
                  notes: item.sample_company_names.join(", "),
                });
                setOpen(true);
              }}
            >
              <p className="font-medium text-foreground">{item.cvm_setor_atividade}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {item.company_count} empresas · {item.sample_company_names.join(", ")}
              </p>
            </button>
          ))}

          {unmappedQuery.data?.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum setor pendente de mapeamento.</p>
          ) : null}
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        data={mappingsQuery.data ?? []}
        loading={mappingsQuery.isLoading}
        getRowKey={(row) => row.cvm_setor_atividade}
        emptyMessage="Nenhum mapeamento cadastrado."
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Salvar mapeamento</DialogTitle>
            <DialogDescription>
              Faz upsert em `POST /admin/cvm/sector-mapping`.
            </DialogDescription>
          </DialogHeader>

          <form
            className="space-y-4"
            onSubmit={form.handleSubmit((values) => upsertMutation.mutate(values))}
          >
            <div className="space-y-2">
              <Label htmlFor="cvm_setor_atividade">Setor CVM</Label>
              <Input id="cvm_setor_atividade" {...form.register("cvm_setor_atividade")} />
              {form.formState.errors.cvm_setor_atividade ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.cvm_setor_atividade.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="internal_sector_slug">Slug interno</Label>
              <Input id="internal_sector_slug" {...form.register("internal_sector_slug")} />
              {form.formState.errors.internal_sector_slug ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.internal_sector_slug.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea id="notes" {...form.register("notes")} />
              {form.formState.errors.notes ? (
                <p className="text-sm text-destructive">{form.formState.errors.notes.message}</p>
              ) : null}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={upsertMutation.isPending}>
                {upsertMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
