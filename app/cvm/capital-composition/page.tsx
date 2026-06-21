"use client";

import { useMemo, useState } from "react";
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
import { CapitalCompositionChart } from "@/components/charts/capital-composition-chart";
import {
  ValidationBadge,
  ValidationStatusFilter,
  asValidationStatus,
} from "@/components/validation";
import { formatDate, formatDateTime, formatDecimal, truncateHash } from "@/lib/formatters";
import {
  getCapitalCompositionSyncStatus,
  listCapitalCompositionSnapshots,
  triggerCapitalCompositionSync,
} from "@/lib/services/admin/cvm-capital-composition";
import type { CapitalCompositionSnapshotSummary } from "@/lib/services/admin/types";

const columns: DataTableColumn<CapitalCompositionSnapshotSummary>[] = [
  {
    key: "ref",
    header: "Referencia",
    render: (row) => formatDate(row.reference_date),
  },
  {
    key: "company",
    header: "Empresa",
    render: (row) => (
      <div className="space-y-1">
        <p className="font-medium text-foreground">{row.denom_cia}</p>
        <p className="text-xs text-muted-foreground">cd_cvm {row.cd_cvm} · v{row.versao}</p>
      </div>
    ),
  },
  {
    key: "source",
    header: "Origem",
    render: (row) => <Badge variant="secondary">{row.source.toUpperCase()}</Badge>,
  },
  {
    key: "integralized",
    header: "Integralizado",
    render: (row) => (
      <span className="font-mono text-sm">{formatDecimal(row.qt_total_integralized, { maximumFractionDigits: 0 })}</span>
    ),
  },
  {
    key: "treasury",
    header: "Tesouraria",
    render: (row) => (
      <span className="font-mono text-sm">{formatDecimal(row.qt_total_treasury, { maximumFractionDigits: 0 })}</span>
    ),
  },
  {
    key: "captured_at",
    header: "Capturado",
    render: (row) => formatDateTime(row.captured_at),
  },
  {
    key: "status",
    header: "Status",
    // O backend pode ainda nao materializar `validation` na lista (T01 Onda 2 nao
    // mergeado) — tratamos ausencia como pendente para nao quebrar a tela.
    render: (row) => <ValidationBadge status={row.validation?.status ?? "pending"} />,
  },
  {
    key: "detail",
    header: "Snapshot",
    render: (row) => (
      <Link
        className="text-primary underline-offset-4 hover:underline"
        href={`/cvm/capital-composition/snapshots/detail?id=${row.id}`}
      >
        Abrir
      </Link>
    ),
  },
  {
    key: "validate",
    header: "Validacao",
    render: (row) => (
      <Link
        className="text-primary underline-offset-4 hover:underline"
        href={`/cvm/capital-composition/validate?id=${encodeURIComponent(row.id)}`}
      >
        Abrir
      </Link>
    ),
  },
];

export default function CapitalCompositionPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [cdCvmInput, setCdCvmInput] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [source, setSource] = useState("");
  const [periodType, setPeriodType] = useState("");
  const [validationStatus, setValidationStatus] = useState("");
  const [forceSync, setForceSync] = useState(false);
  const [syncSource, setSyncSource] = useState("itr");

  const cdCvm = useMemo(() => {
    const n = Number(cdCvmInput);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  }, [cdCvmInput]);

  const syncStatusQuery = useQuery({
    queryKey: ["cvm", "capital-composition", "sync-status"],
    queryFn: getCapitalCompositionSyncStatus,
  });

  const snapshotsQuery = useQuery({
    queryKey: [
      "cvm",
      "capital-composition",
      "snapshots",
      { page, cdCvm, cnpj, source, periodType, validationStatus },
    ],
    queryFn: () =>
      listCapitalCompositionSnapshots({
        page,
        page_size: 20,
        cd_cvm: cdCvm,
        cnpj: cnpj || undefined,
        source: source || undefined,
        period_type: periodType || undefined,
        validation_status: asValidationStatus(validationStatus),
      }),
  });

  // For the chart, fetch a wider window when a single company is selected.
  const seriesQuery = useQuery({
    queryKey: ["cvm", "capital-composition", "series", cdCvm, source],
    queryFn: () =>
      listCapitalCompositionSnapshots({
        cd_cvm: cdCvm,
        source: source || undefined,
        page: 1,
        page_size: 80,
      }),
    enabled: Boolean(cdCvm),
  });

  const triggerSyncMutation = useMutation({
    mutationFn: () => triggerCapitalCompositionSync({ source: syncSource, force: forceSync }),
    onSuccess: (data) => {
      toast.success(`Sync agendado (task_id ${data.task_id}).`);
      queryClient.invalidateQueries({ queryKey: ["cvm", "capital-composition"] });
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
              <CardTitle>Composicao de capital</CardTitle>
              <CardDescription>
                Shares outstanding ON/PN + tesouraria, do CSV de composicao em ITR/DFP. Append-only por
                {" "}<span className="font-mono text-xs">(cnpj_cia, reference_date, versao, source)</span>.
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
                  <AlertDialogTitle>Disparar sync de composicao?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Envia <span className="font-mono">POST /admin/cvm/capital-composition/sync</span>.
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="sync-source">Source</Label>
                    <Select
                      id="sync-source"
                      value={syncSource}
                      onChange={(event) => setSyncSource(event.target.value)}
                    >
                      <option value="itr">itr</option>
                      <option value="dfp">dfp</option>
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
        </CardHeader>

        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Card className="metric-tile">
            <CardHeader>
              <CardDescription>Snapshots</CardDescription>
              <CardTitle>{status?.total_snapshots ?? "—"}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="metric-tile">
            <CardHeader>
              <CardDescription>Empresas com dado</CardDescription>
              <CardTitle>
                {status?.companies_with_data ?? "—"}
                <span className="ml-1 text-sm font-normal text-muted-foreground">
                  / {status?.distinct_companies ?? "—"}
                </span>
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="metric-tile">
            <CardHeader>
              <CardDescription>Empresas sem dado</CardDescription>
              <CardTitle className={status?.companies_missing_data ? "text-amber-300" : undefined}>
                {status?.companies_missing_data ?? "—"}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="metric-tile">
            <CardHeader>
              <CardDescription>Ultimo hash</CardDescription>
              <CardTitle className="font-mono text-base">
                {truncateHash(status?.last_file_hash, 8)}
              </CardTitle>
            </CardHeader>
          </Card>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Selecione uma empresa por <span className="font-mono">cd_cvm</span> para habilitar a serie temporal.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="filter-cd-cvm">cd_cvm</Label>
            <Input
              id="filter-cd-cvm"
              inputMode="numeric"
              placeholder="9512"
              value={cdCvmInput}
              onChange={(event) => {
                setPage(1);
                setCdCvmInput(event.target.value);
              }}
            />
          </div>
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
            <Label htmlFor="filter-source">Source</Label>
            <Select
              id="filter-source"
              value={source}
              onChange={(event) => {
                setPage(1);
                setSource(event.target.value);
              }}
            >
              <option value="">todos</option>
              <option value="itr">itr</option>
              <option value="dfp">dfp</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="filter-period">Period type</Label>
            <Select
              id="filter-period"
              value={periodType}
              onChange={(event) => {
                setPage(1);
                setPeriodType(event.target.value);
              }}
            >
              <option value="">todos</option>
              <option value="quarterly">quarterly</option>
              <option value="annual">annual</option>
            </Select>
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

      {cdCvm ? (
        <Card>
          <CardHeader>
            <CardTitle>Serie temporal · cd_cvm {cdCvm}</CardTitle>
            <CardDescription>
              Quantidades totais (integralizado e tesouraria) por data de referencia.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CapitalCompositionChart snapshots={seriesQuery.data?.items ?? []} />
          </CardContent>
        </Card>
      ) : null}

      <DataTable
        columns={columns}
        data={snapshotsQuery.data?.items ?? []}
        loading={snapshotsQuery.isLoading}
        pagination={snapshotsQuery.data?.pagination}
        onPageChange={setPage}
        getRowKey={(row) => row.id}
        emptyMessage="Nenhum snapshot encontrado para os filtros informados."
      />
    </div>
  );
}
