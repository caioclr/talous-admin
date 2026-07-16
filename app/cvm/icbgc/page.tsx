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
import { CvmAcronym } from "@/components/cvm-acronym";
import { formatDate, formatDateTime, truncateHash } from "@/lib/formatters";
import {
  getICBGCSyncStatus,
  listICBGCReports,
  triggerICBGCSync,
} from "@/lib/services/admin/cvm-icbgc";
import type { GovernanceReportSummary } from "@/lib/services/admin/types";

const CURRENT_YEAR = new Date().getUTCFullYear();
const YEAR_OPTIONS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - i);

const ADOPTION_BADGES: Record<
  string,
  { label: string; variant: "success" | "warning" | "destructive" | "secondary" | "default" }
> = {
  yes: { label: "Sim", variant: "success" },
  partial: { label: "Parcial", variant: "warning" },
  no: { label: "Nao", variant: "destructive" },
  not_applicable: { label: "Nao aplicavel", variant: "secondary" },
};

const columns: DataTableColumn<GovernanceReportSummary>[] = [
  {
    key: "ref",
    header: "Referencia",
    render: (row) => (
      <div className="space-y-1">
        <p>{formatDate(row.data_referencia)}</p>
        <p className="text-xs text-muted-foreground">v{row.versao}</p>
      </div>
    ),
  },
  {
    key: "company",
    header: "Empresa",
    render: (row) =>
      row.cd_cvm !== null ? (
        <Link
          className="space-y-1 underline-offset-4 hover:underline"
          href={`/cvm/icbgc/companies/detail?cd_cvm=${row.cd_cvm}`}
        >
          <p className="font-medium text-foreground">{row.nome_empresarial}</p>
          <p className="text-xs text-muted-foreground">
            cd_cvm {row.cd_cvm} · CNPJ {row.cnpj_companhia}
          </p>
        </Link>
      ) : (
        <div className="space-y-1">
          <p className="font-medium text-foreground">{row.nome_empresarial}</p>
          <p className="text-xs text-muted-foreground">CNPJ {row.cnpj_companhia}</p>
        </div>
      ),
  },
  {
    key: "reapresentacao",
    header: "Reapresentacao",
    render: (row) =>
      row.motivo_reapresentacao ? (
        <p className="line-clamp-2 text-xs" title={row.motivo_reapresentacao}>
          {row.motivo_reapresentacao}
        </p>
      ) : (
        "—"
      ),
  },
  {
    key: "entrega",
    header: "Entregue em",
    render: (row) => formatDate(row.data_entrega),
  },
  {
    key: "captured",
    header: "Capturado",
    render: (row) => formatDateTime(row.captured_at),
  },
  {
    key: "status",
    header: "Status",
    render: (row) => <ValidationBadge status={row.validation.status} />,
  },
  {
    key: "detail",
    header: "Informe",
    render: (row) => (
      <Link
        className="text-primary underline-offset-4 hover:underline"
        href={`/cvm/icbgc/reports/detail?id_documento=${row.id_documento}`}
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
        href={`/cvm/icbgc/validate?id_documento=${encodeURIComponent(
          String(row.id_documento),
        )}`}
      >
        Abrir
      </Link>
    ),
  },
];

export default function ICBGCPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [cdCvm, setCdCvm] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [year, setYear] = useState("");
  const [validationStatus, setValidationStatus] = useState("");
  const [forceSync, setForceSync] = useState(false);
  const [syncYear, setSyncYear] = useState(String(CURRENT_YEAR));

  const cdCvmNumber = Number(cdCvm) || undefined;

  const syncStatusQuery = useQuery({
    queryKey: ["cvm", "icbgc", "sync-status"],
    queryFn: getICBGCSyncStatus,
  });

  const reportsQuery = useQuery({
    queryKey: [
      "cvm",
      "icbgc",
      "reports",
      { page, pageSize, cdCvmNumber, cnpj, year, validationStatus },
    ],
    queryFn: () =>
      listICBGCReports({
        page,
        page_size: pageSize,
        cd_cvm: cdCvmNumber,
        cnpj: cnpj || undefined,
        year: year ? Number(year) : undefined,
        validation_status: asValidationStatus(validationStatus),
      }),
  });

  const triggerSyncMutation = useMutation({
    mutationFn: () =>
      triggerICBGCSync({ year: Number(syncYear), force: forceSync }),
    onSuccess: (data) => {
      toast.success(`Sync ICBGC agendado (task_id ${data.task_id}).`);
      queryClient.invalidateQueries({ queryKey: ["cvm", "icbgc"] });
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
                Governanca corporativa (<CvmAcronym sigla="ICBGC" />)
              </CardTitle>
              <CardDescription>
                Informe do Codigo Brasileiro de Governanca Corporativa — adocao pratique-ou-explique,
                item a item, das ~54 praticas recomendadas.
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
                  <AlertDialogTitle>Disparar sync de ICBGC?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Envia <span className="font-mono">POST /admin/cvm/icbgc/sync</span> para o ano informado.
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
                      {YEAR_OPTIONS.map((y) => (
                        <option key={y} value={y}>
                          {y}
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
        </CardHeader>

        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <Card className="metric-tile">
            <CardHeader>
              <CardDescription>Informes</CardDescription>
              <CardTitle>{status?.total_reports ?? "—"}</CardTitle>
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
              <CardDescription>Itens de pratica</CardDescription>
              <CardTitle>{status?.total_items ?? "—"}</CardTitle>
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
          <CardTitle>Distribuicao de adocao</CardTitle>
          <CardDescription>
            Snapshot direto do <span className="font-mono">/sync-status.items_by_normalized</span> —
            como o mercado responde as praticas recomendadas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status && Object.keys(status.items_by_normalized).length > 0 ? (
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
              {Object.entries(status.items_by_normalized).map(([bucket, count]) => {
                const badge = ADOPTION_BADGES[bucket] ?? { label: bucket, variant: "default" as const };
                return (
                  <div
                    key={bucket}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-border/80 bg-background/70 px-4 py-3"
                  >
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                    <p className="font-mono text-lg text-foreground">{count}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sem distribuicao de adocao no momento.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
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
            <Label htmlFor="filter-year">Ano</Label>
            <Select
              id="filter-year"
              value={year}
              onChange={(event) => {
                setPage(1);
                setYear(event.target.value);
              }}
            >
              <option value="">todos</option>
              {YEAR_OPTIONS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
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

      <DataTable
        columns={columns}
        data={reportsQuery.data?.items ?? []}
        loading={reportsQuery.isLoading}
        pagination={reportsQuery.data?.pagination}
        onPageChange={setPage}
        pageSizeOptions={DEFAULT_PAGE_SIZE_OPTIONS}
        onPageSizeChange={(size) => {
          setPage(1);
          setPageSize(size);
        }}
        getRowKey={(row) => row.id}
        emptyMessage="Nenhum informe ICBGC encontrado para os filtros informados."
      />
    </div>
  );
}
