"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCcw } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { DEFAULT_PAGE_SIZE_OPTIONS } from "@/components/pagination";
import {
  ValidationBadge,
  ValidationStatusFilter,
  asValidationStatus,
} from "@/components/validation";
import { formatDate, formatDateTime, formatDecimal, truncateHash } from "@/lib/formatters";
import {
  getBuybacksSyncStatus,
  listActiveBuybackPrograms,
  listBuybackPrograms,
  triggerBuybacksSync,
} from "@/lib/services/admin/cvm-buybacks";
import type { BuybackProgramSummary } from "@/lib/services/admin/types";

function programDetailHref(row: BuybackProgramSummary) {
  return `/cvm/buybacks/programs/detail?id_programa=${encodeURIComponent(row.id_programa)}`;
}

function programValidateHref(row: BuybackProgramSummary) {
  return `/cvm/buybacks/validate?id_programa=${encodeURIComponent(String(row.id_programa))}`;
}

const baseColumns: DataTableColumn<BuybackProgramSummary>[] = [
  {
    key: "company",
    header: "Empresa",
    render: (row) => (
      <div className="space-y-1">
        <p className="font-medium text-foreground">{row.nome_companhia}</p>
        <p className="text-xs text-muted-foreground">cd_cvm {row.cd_cvm ?? "—"}</p>
      </div>
    ),
  },
  {
    key: "deliberacao",
    header: "Deliberacao",
    render: (row) => formatDate(row.data_deliberacao),
  },
  {
    key: "prazo",
    header: "Final do prazo",
    render: (row) => formatDate(row.data_final_prazo),
  },
  {
    key: "tipo",
    header: "Tipo",
    render: (row) => row.tipo_operacao ?? "—",
  },
  {
    key: "qts",
    header: "ON / PN",
    render: (row) => (
      <span className="font-mono text-xs">
        {formatDecimal(row.qt_acoes_ordinarias, { maximumFractionDigits: 0 })} /{" "}
        {formatDecimal(row.qt_acoes_preferenciais, { maximumFractionDigits: 0 })}
      </span>
    ),
  },
  {
    key: "status",
    header: "Situacao",
    render: (row) => (
      <Badge variant={row.situacao === "ATIVO" ? "success" : "secondary"}>
        {row.situacao ?? "—"}
      </Badge>
    ),
  },
  {
    key: "validation",
    header: "Validacao",
    // O backend pode ainda nao materializar `validation` na lista (T01 Onda 2 nao
    // mergeado) — tratamos ausencia como pendente para nao quebrar a tela.
    render: (row) => <ValidationBadge status={row.validation?.status ?? "pending"} />,
  },
  {
    key: "detail",
    header: "Programa",
    render: (row) => (
      <Link className="text-primary underline-offset-4 hover:underline" href={programDetailHref(row)}>
        Abrir
      </Link>
    ),
  },
  {
    key: "validate",
    header: "Conferir",
    render: (row) => (
      <Link className="text-primary underline-offset-4 hover:underline" href={programValidateHref(row)}>
        Abrir
      </Link>
    ),
  },
];

export default function BuybacksPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [cdCvm, setCdCvm] = useState("");
  const [situacao, setSituacao] = useState("");
  const [tipoOperacao, setTipoOperacao] = useState("");
  const [validationStatus, setValidationStatus] = useState("");
  const [forceSync, setForceSync] = useState(false);

  const cdCvmNumber = Number(cdCvm) || undefined;

  const syncStatusQuery = useQuery({
    queryKey: ["cvm", "buybacks", "sync-status"],
    queryFn: getBuybacksSyncStatus,
  });

  const activeQuery = useQuery({
    queryKey: ["cvm", "buybacks", "active"],
    queryFn: () => listActiveBuybackPrograms({ page: 1, page_size: 10 }),
  });

  const programsQuery = useQuery({
    queryKey: [
      "cvm",
      "buybacks",
      "programs",
      { page, pageSize, cdCvmNumber, situacao, tipoOperacao, validationStatus },
    ],
    queryFn: () =>
      listBuybackPrograms({
        page,
        page_size: pageSize,
        cd_cvm: cdCvmNumber,
        situacao: situacao || undefined,
        tipo_operacao: tipoOperacao || undefined,
        validation_status: asValidationStatus(validationStatus),
      }),
  });

  const triggerSyncMutation = useMutation({
    mutationFn: () => triggerBuybacksSync(forceSync),
    onSuccess: (data) => {
      toast.success(`Sync agendado (task_id ${data.task_id}).`);
      queryClient.invalidateQueries({ queryKey: ["cvm", "buybacks"] });
    },
    onError: (error) => toast.error(error.message),
  });

  const status = syncStatusQuery.data;

  return (
    <div className="flex flex-col gap-4">
      <Card className="metric-tile">
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <CardTitle>Recompras de acoes</CardTitle>
              <CardDescription>
                Programas oficiais (CSV <span className="font-mono">recompra_acoes</span>) com quantidades + intermediarios.
              </CardDescription>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="rounded-full">
                  <RefreshCcw className="size-4" />
                  Sincronizar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Disparar sync de recompras?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Envia <span className="font-mono">POST /admin/cvm/buybacks/sync</span> (truncate-and-reload por hash).
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <label className="flex items-center gap-3 rounded-2xl border border-border/80 bg-background/80 px-4 py-2.5 text-sm">
                  <input
                    type="checkbox"
                    className="size-4"
                    checked={forceSync}
                    onChange={(event) => setForceSync(event.target.checked)}
                  />
                  Forcar reprocessar
                </label>

                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => triggerSyncMutation.mutate()}
                    disabled={triggerSyncMutation.isPending}
                  >
                    {triggerSyncMutation.isPending ? "Enfileirando..." : "Confirmar"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardHeader>

        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Card className="metric-tile">
            <CardHeader>
              <CardDescription>Programas totais</CardDescription>
              <CardTitle>{status?.total_programs ?? "—"}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="metric-tile">
            <CardHeader>
              <CardDescription>Ativos</CardDescription>
              <CardTitle className="text-emerald-300">{status?.active_programs ?? "—"}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="metric-tile">
            <CardHeader>
              <CardDescription>Encerrados</CardDescription>
              <CardTitle>{status?.closed_programs ?? "—"}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="metric-tile">
            <CardHeader>
              <CardDescription>Ultimo hash · {formatDateTime(status?.last_captured_at)}</CardDescription>
              <CardTitle className="font-mono text-base">
                {truncateHash(status?.last_file_hash, 8)}
              </CardTitle>
            </CardHeader>
          </Card>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Programas ativos</CardTitle>
          <CardDescription>
            Endpoint <span className="font-mono">GET /admin/cvm/buybacks/active</span> · prazo final no futuro.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={baseColumns}
            data={activeQuery.data?.items ?? []}
            loading={activeQuery.isLoading}
            getRowKey={(row) => `active-${row.id}`}
            emptyMessage="Nenhum programa de recompra ativo no momento."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Todos os programas</CardTitle>
          <CardDescription>
            Use os filtros para buscar por empresa, situacao ou tipo de operacao.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="filter-cd-cvm">cd_cvm</Label>
            <Input
              id="filter-cd-cvm"
              inputMode="numeric"
              placeholder="9512"
              value={cdCvm}
              onChange={(event) => {
                setPage(1);
                setCdCvm(event.target.value);
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="filter-situacao">Situacao</Label>
            <Select
              id="filter-situacao"
              value={situacao}
              onChange={(event) => {
                setPage(1);
                setSituacao(event.target.value);
              }}
            >
              <option value="">todas</option>
              <option value="ATIVO">ATIVO</option>
              <option value="ENCERRADO">ENCERRADO</option>
              <option value="CANCELADO">CANCELADO</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="filter-tipo">Tipo de operacao</Label>
            <Input
              id="filter-tipo"
              placeholder="COMPRA"
              value={tipoOperacao}
              onChange={(event) => {
                setPage(1);
                setTipoOperacao(event.target.value);
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="filter-validation-status">Status de validacao</Label>
            <ValidationStatusFilter
              id="filter-validation-status"
              value={validationStatus}
              onChange={(value) => {
                setPage(1);
                setValidationStatus(value);
              }}
            />
          </div>
        </CardContent>
      </Card>

      <DataTable
        columns={baseColumns}
        data={programsQuery.data?.items ?? []}
        loading={programsQuery.isLoading}
        pagination={programsQuery.data?.pagination}
        onPageChange={setPage}
        pageSizeOptions={DEFAULT_PAGE_SIZE_OPTIONS}
        onPageSizeChange={(size) => {
          setPage(1);
          setPageSize(size);
        }}
        getRowKey={(row) => row.id}
        emptyMessage="Nenhum programa encontrado para os filtros informados."
      />
    </div>
  );
}
