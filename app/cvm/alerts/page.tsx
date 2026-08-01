"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { DEFAULT_PAGE_SIZE_OPTIONS } from "@/components/pagination";
import { JsonViewer } from "@/components/json-viewer";
import { formatDate, formatDateTime } from "@/lib/formatters";
import {
  ALERT_TYPE_LABELS,
  alertOrigin,
  getAlertsSummary,
  listOperationalAlerts,
} from "@/lib/services/admin/cvm-alerts";
import type { AlertSeverity, OperationalAlert } from "@/lib/services/admin/types";

const SEVERITY_BADGES: Record<
  AlertSeverity,
  { label: string; variant: "destructive" | "warning" | "secondary" }
> = {
  alta: { label: "Alta", variant: "destructive" },
  media: { label: "Media", variant: "warning" },
  baixa: { label: "Baixa", variant: "secondary" },
};

const SEVERITY_ORDER: AlertSeverity[] = ["alta", "media", "baixa"];

export default function AlertsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [severity, setSeverity] = useState("");
  const [alertType, setAlertType] = useState("");
  const [cdCvm, setCdCvm] = useState("");
  const [selected, setSelected] = useState<OperationalAlert | null>(null);

  const cdCvmNumber = Number(cdCvm) || undefined;

  const summaryQuery = useQuery({
    queryKey: ["cvm", "alerts", "summary"],
    queryFn: getAlertsSummary,
  });

  const alertsQuery = useQuery({
    queryKey: ["cvm", "alerts", "list", { page, pageSize, severity, alertType, cdCvmNumber }],
    queryFn: () =>
      listOperationalAlerts({
        page,
        page_size: pageSize,
        severity: severity || undefined,
        alert_type: alertType || undefined,
        cd_cvm: cdCvmNumber,
      }),
  });

  const columns = useMemo<DataTableColumn<OperationalAlert>[]>(
    () => [
      {
        key: "severity",
        header: "Severidade",
        render: (row) => {
          const badge = SEVERITY_BADGES[row.severity] ?? {
            label: row.severity,
            variant: "secondary" as const,
          };
          return <Badge variant={badge.variant}>{badge.label}</Badge>;
        },
      },
      {
        key: "type",
        header: "Tipo",
        render: (row) => (
          <p className="text-sm">{ALERT_TYPE_LABELS[row.alert_type] ?? row.alert_type}</p>
        ),
      },
      {
        key: "company",
        header: "Empresa",
        render: (row) =>
          row.cd_cvm !== null ? (
            <Link
              className="space-y-1 underline-offset-4 hover:underline"
              href={`/cvm/companies/detail?cd_cvm=${row.cd_cvm}`}
              onClick={(event) => event.stopPropagation()}
            >
              <p className="font-medium text-foreground">{row.nome_empresarial ?? "—"}</p>
              <p className="text-xs text-muted-foreground">
                cd_cvm {row.cd_cvm}
                {row.cnpj ? ` · CNPJ ${row.cnpj}` : ""}
              </p>
            </Link>
          ) : (
            <div className="space-y-1">
              <p className="font-medium text-foreground">{row.nome_empresarial ?? "—"}</p>
              {row.cnpj ? (
                <p className="text-xs text-muted-foreground">CNPJ {row.cnpj}</p>
              ) : null}
            </div>
          ),
      },
      {
        key: "message",
        header: "Mensagem",
        render: (row) => (
          <p className="line-clamp-2 max-w-md text-sm" title={row.message}>
            {row.message}
          </p>
        ),
      },
      {
        key: "reference",
        header: "Referencia",
        render: (row) => formatDate(row.reference_date),
      },
      {
        key: "detected",
        header: "Detectado em",
        render: (row) => formatDateTime(row.detected_at),
      },
      {
        key: "origin",
        header: "Origem",
        render: (row) => {
          const origin = alertOrigin(row);
          return origin ? (
            <Link
              className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
              href={origin}
              onClick={(event) => event.stopPropagation()}
            >
              Origem
              <ArrowUpRight className="size-3.5" />
            </Link>
          ) : (
            "—"
          );
        },
      },
      {
        key: "details",
        header: "Payload",
        render: (row) => (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={(event) => {
              event.stopPropagation();
              setSelected(row);
            }}
          >
            Detalhes
          </Button>
        ),
      },
    ],
    [],
  );

  const summary = summaryQuery.data;

  return (
    <div className="flex flex-col gap-4">
      <Card className="metric-tile">
        <CardHeader>
          <CardTitle>Alertas operacionais (CVM)</CardTitle>
          <CardDescription>Inconsistencias e atrasos detectados entre os datasets CVM — derivados dos dados ja sincronizados, ordenados por severidade.</CardDescription>
        </CardHeader>

        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Card className="metric-tile">
            <CardHeader>
              <CardDescription>Total de alertas</CardDescription>
              <CardTitle>{summary?.total ?? "—"}</CardTitle>
            </CardHeader>
          </Card>
          {SEVERITY_ORDER.map((sev) => (
            <Card key={sev} className="metric-tile">
              <CardHeader>
                <div>
                  <Badge variant={SEVERITY_BADGES[sev].variant}>
                    {SEVERITY_BADGES[sev].label}
                  </Badge>
                </div>
                <CardTitle>{summary?.by_severity[sev] ?? 0}</CardTitle>
              </CardHeader>
            </Card>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Por tipo</CardTitle>
          <CardDescription>
            Distribuicao do <span className="font-mono">/summary.by_type</span> — cada tipo
            aponta para o dataset de origem.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {summary && Object.keys(summary.by_type).length > 0 ? (
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
              {Object.entries(summary.by_type).map(([type, count]) => (
                <div
                  key={type}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-border/80 bg-background/70 px-4 py-3"
                >
                  <p className="text-sm">{ALERT_TYPE_LABELS[type] ?? type}</p>
                  <p className="font-mono text-lg text-foreground">{count}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum alerta por tipo no momento.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="filter-severity">Severidade</Label>
            <Select
              id="filter-severity"
              value={severity}
              onChange={(event) => {
                setPage(1);
                setSeverity(event.target.value);
              }}
            >
              <option value="">todas</option>
              {SEVERITY_ORDER.map((sev) => (
                <option key={sev} value={sev}>
                  {SEVERITY_BADGES[sev].label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="filter-alert-type">Tipo</Label>
            <Select
              id="filter-alert-type"
              value={alertType}
              onChange={(event) => {
                setPage(1);
                setAlertType(event.target.value);
              }}
            >
              <option value="">todos</option>
              {Object.entries(ALERT_TYPE_LABELS).map(([type, label]) => (
                <option key={type} value={type}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
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
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        data={alertsQuery.data?.items ?? []}
        loading={alertsQuery.isLoading}
        pagination={alertsQuery.data?.pagination}
        onPageChange={setPage}
        pageSizeOptions={DEFAULT_PAGE_SIZE_OPTIONS}
        onPageSizeChange={(size) => {
          setPage(1);
          setPageSize(size);
        }}
        getRowKey={(row, index) => `${row.alert_type}-${row.detected_at}-${index}`}
        onRowClick={setSelected}
        emptyMessage="Nenhum alerta operacional encontrado para os filtros informados."
      />

      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelected(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selected ? ALERT_TYPE_LABELS[selected.alert_type] ?? selected.alert_type : ""}
            </DialogTitle>
            <DialogDescription>{selected?.message}</DialogDescription>
          </DialogHeader>
          <JsonViewer className="mt-4 max-h-[60vh] overflow-y-auto" value={selected?.payload ?? {}} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
