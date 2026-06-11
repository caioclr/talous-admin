"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BellRing, RefreshCcw, Search } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatDate, formatDateTime, truncateHash } from "@/lib/formatters";
import {
  getIPESyncStatus,
  listIPECategories,
  listIPEDisclosures,
  triggerIPESync,
} from "@/lib/services/admin/cvm-ipe";
import type { IPEDisclosureSummary } from "@/lib/services/admin/types";

const columns: DataTableColumn<IPEDisclosureSummary>[] = [
  {
    key: "empresa",
    header: "Empresa",
    render: (row) => (
      <div className="space-y-1">
        <p className="font-medium text-foreground">{row.nome_companhia}</p>
        <p className="text-xs text-muted-foreground">cd_cvm {row.cd_cvm}</p>
      </div>
    ),
  },
  {
    key: "assunto",
    header: "Assunto",
    render: (row) => (
      <div className="space-y-1">
        <p className="line-clamp-2">{row.assunto}</p>
        <p className="text-xs text-muted-foreground">{row.protocolo_entrega}</p>
      </div>
    ),
  },
  {
    key: "categoria",
    header: "Categoria",
    render: (row) => row.categoria,
  },
  {
    key: "signal",
    header: "Sinal",
    render: (row) => (
      <Badge variant={row.signal_classification === "material_fact" ? "destructive" : "secondary"}>
        {row.signal_classification ?? "—"}
      </Badge>
    ),
  },
  {
    key: "delivery",
    header: "Entrega",
    render: (row) => formatDate(row.data_entrega),
  },
  {
    key: "notified",
    header: "Notificado",
    render: (row) => (
      <Badge variant={row.notification_dispatched ? "success" : "warning"}>
        {row.notification_dispatched ? "Sim" : "Pendente"}
      </Badge>
    ),
  },
  {
    key: "detail",
    header: "Detalhe",
    render: (row) => (
      <Link
        className="text-primary underline-offset-4 hover:underline"
        href={`/cvm/ipe/disclosures/${row.id}`}
      >
        Abrir
      </Link>
    ),
  },
];

function toIsoDate(value: string) {
  return value ? new Date(value).toISOString().slice(0, 10) : undefined;
}

export default function IPEPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [cdCvm, setCdCvm] = useState("");
  const [categoria, setCategoria] = useState("");
  const [tipoApresentacao, setTipoApresentacao] = useState("");
  const [signal, setSignal] = useState("");
  const [notified, setNotified] = useState("");
  const [deliveredFrom, setDeliveredFrom] = useState("");
  const [deliveredTo, setDeliveredTo] = useState("");
  const [syncYear, setSyncYear] = useState(new Date().getFullYear().toString());

  const syncStatusQuery = useQuery({
    queryKey: ["cvm", "ipe", "sync-status"],
    queryFn: getIPESyncStatus,
  });

  const categoriesQuery = useQuery({
    queryKey: ["cvm", "ipe", "categories"],
    queryFn: () => listIPECategories(90),
  });

  const disclosuresQuery = useQuery({
    queryKey: [
      "cvm",
      "ipe",
      "disclosures",
      { page, search, cdCvm, categoria, tipoApresentacao, signal, notified, deliveredFrom, deliveredTo },
    ],
    queryFn: () =>
      listIPEDisclosures({
        page,
        page_size: 20,
        search: search || undefined,
        cd_cvm: cdCvm ? Number(cdCvm) : undefined,
        categoria: categoria || undefined,
        tipo_apresentacao: tipoApresentacao || undefined,
        signal: signal || undefined,
        notified: notified === "" ? undefined : notified === "true",
        delivered_at_from: toIsoDate(deliveredFrom),
        delivered_at_to: toIsoDate(deliveredTo),
      }),
  });

  const triggerSyncMutation = useMutation({
    mutationFn: (year?: number) => triggerIPESync(year),
    onSuccess: (data) => {
      toast.success(`Sincronizacao IPE enfileirada com task_id ${truncateHash(data.task_id, 6)}.`);
      queryClient.invalidateQueries({ queryKey: ["cvm", "ipe", "sync-status"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const syncStatus = syncStatusQuery.data;

  return (
    <div className="flex flex-col gap-4">
      <section className="panel-surface metric-tile flex flex-col gap-5 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
              Sprint 2 · IPE
            </p>
            <h2 className="text-2xl font-semibold text-foreground">
              Fatos relevantes, comunicados e avisos ao mercado
            </h2>
            <p className="max-w-3xl text-sm text-muted-foreground">
              Consome `cvm_ipe` para monitorar disclosures, classificacao de sinal e pendencias de notificacao.
            </p>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="rounded-full">
                <RefreshCcw className="size-4" />
                Sincronizar IPE
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Disparar sincronizacao de IPE?</AlertDialogTitle>
                <AlertDialogDescription>
                  O backend usa `POST /admin/cvm/ipe/sync` e aceita um ano alvo opcional.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="sync-year">
                  Ano
                </label>
                <Input
                  id="sync-year"
                  type="number"
                  value={syncYear}
                  onChange={(event) => setSyncYear(event.target.value)}
                />
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() =>
                    triggerSyncMutation.mutate(syncYear ? Number(syncYear) : undefined)
                  }
                  disabled={triggerSyncMutation.isPending}
                >
                  {triggerSyncMutation.isPending ? "Enfileirando..." : "Confirmar sync"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Ultima captura"
            value={formatDateTime(syncStatus?.last_captured_at)}
          />
          <MetricCard
            label="Total de disclosures"
            value={String(syncStatus?.total_disclosures ?? "—")}
          />
          <MetricCard
            label="Pendentes de notificacao"
            value={String(syncStatus?.pending_notification_count ?? "—")}
          />
          <MetricCard
            label="Ultimos 30 dias"
            value={String(syncStatus?.last_30_days_count ?? "—")}
          />
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <Card>
          <CardHeader>
            <CardTitle>Filtros de disclosures</CardTitle>
            <CardDescription>
              Busca textual por assunto e recortes por empresa, categoria, tipo, sinal e notificacao.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="relative md:col-span-2 xl:col-span-2">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-10"
                placeholder="Buscar no assunto"
                value={search}
                onChange={(event) => {
                  setPage(1);
                  setSearch(event.target.value);
                }}
              />
            </div>

            <Input
              type="number"
              placeholder="cd_cvm"
              value={cdCvm}
              onChange={(event) => {
                setPage(1);
                setCdCvm(event.target.value);
              }}
            />

            <Input
              placeholder="Categoria"
              value={categoria}
              onChange={(event) => {
                setPage(1);
                setCategoria(event.target.value);
              }}
            />

            <Select
              value={tipoApresentacao}
              onChange={(event) => {
                setPage(1);
                setTipoApresentacao(event.target.value);
              }}
            >
              <option value="">Tipo apresentacao</option>
              <option value="AP">AP</option>
              <option value="RE">RE</option>
            </Select>

            <Select
              value={signal}
              onChange={(event) => {
                setPage(1);
                setSignal(event.target.value);
              }}
            >
              <option value="">Signal</option>
              <option value="material_fact">material_fact</option>
              <option value="communication_critical">communication_critical</option>
              <option value="general">general</option>
            </Select>

            <Select
              value={notified}
              onChange={(event) => {
                setPage(1);
                setNotified(event.target.value);
              }}
            >
              <option value="">Notificado?</option>
              <option value="true">Sim</option>
              <option value="false">Nao</option>
            </Select>

            <Input
              type="date"
              value={deliveredFrom}
              onChange={(event) => {
                setPage(1);
                setDeliveredFrom(event.target.value);
              }}
            />

            <Input
              type="date"
              value={deliveredTo}
              onChange={(event) => {
                setPage(1);
                setDeliveredTo(event.target.value);
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Categorias mais recentes</CardTitle>
            <CardDescription>
              Distribuicao agregada dos ultimos 90 dias.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(categoriesQuery.data ?? []).slice(0, 8).map((item) => (
              <div
                key={item.categoria}
                className="flex items-center justify-between rounded-2xl border border-border/80 bg-background/70 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{item.categoria}</p>
                </div>
                <Badge variant="secondary">{item.count}</Badge>
              </div>
            ))}

            {categoriesQuery.data?.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem categorias agregadas ainda.</p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Classificacao por sinal</CardTitle>
          <CardDescription>
            Agregado atual retornado por `GET /admin/cvm/ipe/sync-status`.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {syncStatus
            ? Object.entries(syncStatus.by_signal_classification).map(([key, value]) => (
                <div
                  key={key}
                  className="rounded-2xl border border-border/80 bg-background/70 px-4 py-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-2 text-primary">
                      <BellRing className="size-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        {key}
                      </p>
                      <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
                    </div>
                  </div>
                </div>
              ))
            : (
              <p className="text-sm text-muted-foreground">Carregando classificacoes...</p>
            )}
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        data={disclosuresQuery.data?.items ?? []}
        loading={disclosuresQuery.isLoading}
        pagination={disclosuresQuery.data?.pagination}
        onPageChange={setPage}
        getRowKey={(row) => row.id}
        emptyMessage="Nenhum disclosure encontrado."
      />
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="metric-tile">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle>{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}
