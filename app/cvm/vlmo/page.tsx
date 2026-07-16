"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCcw, ShieldCheck } from "lucide-react";
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
import { CvmAcronym } from "@/components/cvm-acronym";
import { formatDate, formatDateTime, formatDecimal, truncateHash } from "@/lib/formatters";
import {
  getVLMOSyncStatus,
  listVLMOMovimentacoes,
  triggerVLMOSync,
} from "@/lib/services/admin/cvm-vlmo";
import type { VLMOMovimentacaoSummary } from "@/lib/services/admin/types";

const CURRENT_YEAR = new Date().getUTCFullYear();
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

const columns: DataTableColumn<VLMOMovimentacaoSummary>[] = [
  {
    key: "data",
    header: "Movimentacao",
    render: (row) => (
      <div className="space-y-1">
        <p className="text-sm">{formatDate(row.data_movimentacao)}</p>
        <p className="text-xs text-muted-foreground">ref {formatDate(row.data_referencia)}</p>
      </div>
    ),
  },
  {
    key: "empresa",
    header: "Empresa",
    render: (row) => (
      <div className="space-y-1">
        <p className="font-medium text-foreground">{row.nome_companhia}</p>
        <p className="text-xs text-muted-foreground">CNPJ {row.cnpj_companhia}</p>
      </div>
    ),
  },
  {
    key: "cargo",
    header: "Cargo / Tipo",
    render: (row) => (
      <div className="space-y-1">
        <p>{row.tipo_cargo ?? "—"}</p>
        <p className="text-xs text-muted-foreground">{row.tipo_empresa ?? row.empresa ?? "—"}</p>
      </div>
    ),
  },
  {
    key: "operacao",
    header: "Operacao",
    render: (row) => (
      <div className="flex flex-col gap-1">
        <Badge
          variant={
            row.is_position_snapshot
              ? "secondary"
              : row.tipo_movimentacao === "Compra"
                ? "success"
                : row.tipo_movimentacao === "Venda"
                  ? "warning"
                  : "default"
          }
        >
          {row.tipo_movimentacao ?? "—"}
        </Badge>
        {row.tipo_operacao ? (
          <span className="text-xs text-muted-foreground">{row.tipo_operacao}</span>
        ) : null}
      </div>
    ),
  },
  {
    key: "ativo",
    header: "Ativo",
    render: (row) => row.tipo_ativo ?? "—",
  },
  {
    key: "qty",
    header: "Qtd · Preco",
    render: (row) => (
      <div className="space-y-1 font-mono text-xs">
        <p>{formatDecimal(row.quantidade, { maximumFractionDigits: 0 })}</p>
        <p className="text-muted-foreground">
          {formatDecimal(row.preco_unitario, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
        </p>
      </div>
    ),
  },
  {
    key: "volume",
    header: "Volume",
    render: (row) => (
      <span className="font-mono text-xs">{formatDecimal(row.volume, { maximumFractionDigits: 2 })}</span>
    ),
  },
];

export default function VLMOPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [cnpj, setCnpj] = useState("");
  const [tipoCargo, setTipoCargo] = useState("");
  const [tipoMovimentacao, setTipoMovimentacao] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [includeSnapshot, setIncludeSnapshot] = useState(false);
  const [forceSync, setForceSync] = useState(false);
  const [syncYear, setSyncYear] = useState(String(CURRENT_YEAR));

  const syncStatusQuery = useQuery({
    queryKey: ["cvm", "vlmo", "sync-status"],
    queryFn: getVLMOSyncStatus,
  });

  const movQuery = useQuery({
    queryKey: [
      "cvm",
      "vlmo",
      "movimentacoes",
      { page, pageSize, cnpj, tipoCargo, tipoMovimentacao, yearFilter, includeSnapshot },
    ],
    queryFn: () =>
      listVLMOMovimentacoes({
        page,
        page_size: pageSize,
        cnpj: cnpj || undefined,
        tipo_cargo: tipoCargo || undefined,
        tipo_movimentacao: tipoMovimentacao || undefined,
        year: yearFilter ? Number(yearFilter) : undefined,
        is_position_snapshot: includeSnapshot ? undefined : false,
      }),
  });

  const triggerSyncMutation = useMutation({
    mutationFn: () =>
      triggerVLMOSync({ year: Number(syncYear), force: forceSync }),
    onSuccess: (data) => {
      toast.success(`Sync VLMO agendado (task_id ${data.task_id}).`);
      queryClient.invalidateQueries({ queryKey: ["cvm", "vlmo"] });
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
              <CardTitle>
                Insider trading · <CvmAcronym sigla="VLMO" />
              </CardTitle>
              <CardDescription>
                Movimentacoes de controlador, conselho, diretoria e gestao.
                <strong className="ml-1">Saldos iniciais escondidos por padrao</strong> — toggle abaixo se quiser auditar fotografias.
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button asChild variant="outline" className="rounded-full">
                <Link href="/cvm/vlmo/filings">
                  <ShieldCheck className="size-4" />
                  Validar filings
                </Link>
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="rounded-full">
                    <RefreshCcw className="size-4" />
                    Sincronizar
                  </Button>
                </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Disparar sync de VLMO?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Envia <span className="font-mono">POST /admin/cvm/vlmo/sync</span> para o ano informado.
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="sync-year">Ano</Label>
                    <Select
                      id="sync-year"
                      value={syncYear}
                      onChange={(event) => setSyncYear(event.target.value)}
                    >
                      {YEAR_OPTIONS.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <label className="flex items-center gap-3 self-end rounded-2xl border border-border/80 bg-background/80 px-4 py-2.5 text-sm">
                    <input
                      type="checkbox"
                      className="size-4"
                      checked={forceSync}
                      onChange={(event) => setForceSync(event.target.checked)}
                    />
                    Forcar reprocessar
                  </label>
                </div>

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
          </div>
        </CardHeader>

        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Card className="metric-tile">
            <CardHeader>
              <CardDescription>Movimentacoes</CardDescription>
              <CardTitle>{status?.total_movimentacoes ?? "—"}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="metric-tile">
            <CardHeader>
              <CardDescription>Empresas distintas</CardDescription>
              <CardTitle>{status?.distinct_companies ?? "—"}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="metric-tile">
            <CardHeader>
              <CardDescription>Anos disponiveis</CardDescription>
              <CardTitle>{status?.distinct_years ?? "—"}</CardTitle>
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
          <CardTitle>Distribuicao por cargo · ultimo capturado</CardTitle>
          <CardDescription>
            Snapshot direto do <span className="font-mono">/sync-status.movimentacoes_by_cargo</span>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status && Object.keys(status.movimentacoes_by_cargo).length > 0 ? (
            <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-4">
              {Object.entries(status.movimentacoes_by_cargo).map(([cargo, count]) => (
                <div
                  key={cargo}
                  className="rounded-2xl border border-border/80 bg-background/70 px-4 py-3"
                >
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {cargo}
                  </p>
                  <p className="mt-1.5 font-mono text-lg text-foreground">{count}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sem dados de cargos no momento.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Trades reais por padrao. Toggle para incluir saldos iniciais (fotografia, nao trade).
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div className="space-y-1.5">
            <Label htmlFor="filter-cnpj">CNPJ</Label>
            <Input
              id="filter-cnpj"
              placeholder="33000167000101"
              value={cnpj}
              onChange={(event) => {
                setPage(1);
                setCnpj(event.target.value);
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="filter-cargo">Cargo</Label>
            <Input
              id="filter-cargo"
              placeholder="Diretor"
              value={tipoCargo}
              onChange={(event) => {
                setPage(1);
                setTipoCargo(event.target.value);
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="filter-mov">Movimentacao</Label>
            <Input
              id="filter-mov"
              placeholder="Compra | Venda"
              value={tipoMovimentacao}
              onChange={(event) => {
                setPage(1);
                setTipoMovimentacao(event.target.value);
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="filter-year">Ano</Label>
            <Select
              id="filter-year"
              value={yearFilter}
              onChange={(event) => {
                setPage(1);
                setYearFilter(event.target.value);
              }}
            >
              <option value="">todos</option>
              {YEAR_OPTIONS.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </Select>
          </div>
          <label className="flex items-end gap-3 rounded-2xl border border-border/80 bg-background/80 px-4 py-2.5 text-sm">
            <input
              type="checkbox"
              className="size-4"
              checked={includeSnapshot}
              onChange={(event) => {
                setPage(1);
                setIncludeSnapshot(event.target.checked);
              }}
            />
            Incluir saldos iniciais
          </label>
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        data={movQuery.data?.items ?? []}
        loading={movQuery.isLoading}
        pagination={movQuery.data?.pagination}
        onPageChange={setPage}
        pageSizeOptions={DEFAULT_PAGE_SIZE_OPTIONS}
        onPageSizeChange={(size) => {
          setPage(1);
          setPageSize(size);
        }}
        getRowKey={(row) => row.id}
        emptyMessage="Nenhuma movimentacao encontrada para os filtros informados."
      />
    </div>
  );
}
