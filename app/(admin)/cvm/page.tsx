"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCcw, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime, truncateHash } from "@/lib/formatters";
import { getSyncStatus, triggerRegistrySync } from "@/lib/services/admin/cvm-registry";

export default function CVMDashboardPage() {
  const queryClient = useQueryClient();
  const [forceSync, setForceSync] = useState(false);
  const syncStatusQuery = useQuery({
    queryKey: ["cvm", "sync-status"],
    queryFn: getSyncStatus,
  });

  const triggerSyncMutation = useMutation({
    mutationFn: (force: boolean) => triggerRegistrySync(force),
    onSuccess: (data) => {
      toast.success(`Sincronizacao enfileirada com task_id ${data.task_id}.`);
      queryClient.invalidateQueries({ queryKey: ["cvm", "sync-status"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const status = syncStatusQuery.data;

  return (
    <div className="flex flex-col gap-4">
      <section className="panel-surface metric-tile flex flex-col gap-5 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
              Sprint 1 · Registry CVM
            </p>
            <h2 className="text-2xl font-semibold text-foreground">Visao operacional do cadastro CVM</h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              O dashboard consolida status da ultima captura, hash do arquivo e pendencias de mapeamento setorial.
            </p>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="rounded-full">
                <RefreshCcw className="size-4" />
                Sincronizar agora
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Disparar sincronizacao manual?</AlertDialogTitle>
                <AlertDialogDescription>
                  Isso envia `POST /admin/cvm/registry/sync` e retorna um `task_id` para acompanhamento posterior.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <label className="flex items-center gap-3 rounded-2xl border border-border/80 bg-background/80 px-4 py-3 text-sm">
                <input
                  type="checkbox"
                  className="size-4"
                  checked={forceSync}
                  onChange={(event) => setForceSync(event.target.checked)}
                />
                Forcar persistencia mesmo se o hash ja existir.
              </label>

              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => triggerSyncMutation.mutate(forceSync)}
                  disabled={triggerSyncMutation.isPending}
                >
                  {triggerSyncMutation.isPending ? "Enfileirando..." : "Confirmar sync"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="metric-tile">
            <CardHeader>
              <CardDescription>Ultima captura</CardDescription>
              <CardTitle>{formatDateTime(status?.last_captured_at)}</CardTitle>
            </CardHeader>
          </Card>

          <Card className="metric-tile">
            <CardHeader>
              <CardDescription>Hash do ultimo arquivo</CardDescription>
              <CardTitle className="font-mono text-base">
                {truncateHash(status?.last_file_hash, 8)}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="metric-tile">
            <CardHeader>
              <CardDescription>Total de snapshots</CardDescription>
              <CardTitle>{status?.total_snapshots ?? "—"}</CardTitle>
            </CardHeader>
          </Card>

          <Card className="metric-tile">
            <CardHeader>
              <CardDescription>Setores sem mapeamento</CardDescription>
              <CardTitle>{status?.unmapped_sectors_count ?? "—"}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Contagem por situacao</CardTitle>
            <CardDescription>
              Agregacao baseada na versao atual denormalizada das empresas.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {status ? (
              Object.entries(status.situation_counts).map(([key, value]) => (
                <div
                  key={key}
                  className="rounded-2xl border border-border/80 bg-background/70 px-4 py-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    {key}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                {syncStatusQuery.isLoading
                  ? "Carregando indicadores..."
                  : "Nao foi possivel carregar o status de sync."}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Atencao operacional</CardTitle>
            <CardDescription>
              Leitura rapida para quem esta acompanhando a saude do dataset.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-border/80 bg-background/70 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2 text-primary">
                  <ShieldAlert className="size-4" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Pendencias de setor</p>
                  <p className="text-sm text-muted-foreground">
                    {status?.unmapped_sectors_count
                      ? `${status.unmapped_sectors_count} setores CVM ainda precisam de slug interno.`
                      : "Nenhuma pendencia de mapeamento encontrada."}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Auth via refresh cookie</Badge>
              <Badge variant="secondary">12 endpoints consumidos</Badge>
              <Badge variant="secondary">Next.js 16 + Query v5</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
