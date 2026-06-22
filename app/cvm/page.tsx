"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Clock, RefreshCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/formatters";
import {
  ALERT_TYPE_LABELS,
  ALERT_TYPE_ORIGIN,
  listOperationalAlerts,
} from "@/lib/services/admin/cvm-alerts";
import {
  dashboardTypeDescription,
  dashboardTypeLabel,
  dashboardTypeRoute,
  getCVMDashboard,
} from "@/lib/services/admin/cvm-dashboard";
import type {
  AlertSeverity,
  DashboardByType,
  OperationalAlert,
} from "@/lib/services/admin/types";

const ALERTS_PREVIEW_SIZE = 6;

const SEVERITY_BADGES: Record<
  AlertSeverity,
  { label: string; variant: "destructive" | "warning" | "secondary" }
> = {
  alta: { label: "Alta", variant: "destructive" },
  media: { label: "Media", variant: "warning" },
  baixa: { label: "Baixa", variant: "secondary" },
};

/** Inteiros no padrao pt-BR (separador de milhar). Sem casas decimais. */
function formatInteger(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "—";
  }
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(value);
}

function freshnessBadge(freshness: string) {
  if (freshness === "em_dia") {
    return <Badge variant="success">em dia</Badge>;
  }
  if (freshness === "atraso") {
    return <Badge variant="warning">atraso</Badge>;
  }
  return <Badge variant="secondary">{freshness}</Badge>;
}

function DocTypeCard({ item }: { item: DashboardByType }) {
  const label = dashboardTypeLabel(item.report_type);
  const description = dashboardTypeDescription(item.report_type);
  const route = dashboardTypeRoute(item.report_type);

  const body = (
    <Card className="metric-tile h-full transition hover:border-primary/40">
      <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="font-mono">{label}</CardTitle>
        {freshnessBadge(item.freshness)}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-6">
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Total</p>
            <p className="font-mono text-base font-medium tabular-nums text-foreground">
              {formatInteger(item.total)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              Validados
            </p>
            <p className="font-mono text-base font-medium tabular-nums text-success">
              {formatInteger(item.validated)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              Pendentes
            </p>
            <p className="font-mono text-base font-medium tabular-nums text-warning">
              {formatInteger(item.pending)}
            </p>
          </div>
        </div>
        {description ? (
          <p className="border-t border-border/60 pt-2 text-[11px] text-muted-foreground">
            {description}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );

  if (!route) {
    return body;
  }

  return (
    <Link href={route} className="block focus-visible:outline-none">
      {body}
    </Link>
  );
}

function KpiCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "success" | "warning" | "destructive";
}) {
  const toneClass =
    tone === "success"
      ? "text-success"
      : tone === "warning"
        ? "text-warning"
        : tone === "destructive"
          ? "text-destructive"
          : "text-foreground";

  return (
    <Card className="metric-tile">
      <CardHeader className="gap-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className={`font-mono text-2xl tabular-nums ${toneClass}`}>{value}</CardTitle>
        {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
      </CardHeader>
    </Card>
  );
}

function AlertRow({ alert }: { alert: OperationalAlert }) {
  const badge = SEVERITY_BADGES[alert.severity] ?? {
    label: alert.severity,
    variant: "secondary" as const,
  };
  const typeLabel = ALERT_TYPE_LABELS[alert.alert_type] ?? alert.alert_type;
  const origin = ALERT_TYPE_ORIGIN[alert.alert_type];

  return (
    <div className="flex items-start gap-3 border-b border-border/60 px-4 py-3 last:border-b-0">
      <Badge variant={badge.variant}>{badge.label}</Badge>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="truncate text-sm text-foreground" title={alert.message}>
          {alert.message}
        </p>
        <p className="font-mono text-[11px] text-muted-foreground">
          {typeLabel}
          {alert.nome_empresarial ? ` · ${alert.nome_empresarial}` : ""}
          {alert.cd_cvm !== null ? ` · cd_cvm ${alert.cd_cvm}` : ""}
          {alert.reference_date ? ` · ${formatDate(alert.reference_date)}` : ""}
        </p>
      </div>
      {origin ? (
        <Link
          href={origin}
          className="shrink-0 text-muted-foreground transition hover:text-foreground"
          aria-label={`Abrir origem do alerta ${typeLabel}`}
        >
          <ArrowUpRight className="size-4" />
        </Link>
      ) : null}
    </div>
  );
}

export default function CVMDashboardPage() {
  const dashboardQuery = useQuery({
    queryKey: ["cvm", "dashboard"],
    queryFn: getCVMDashboard,
  });

  const alertsQuery = useQuery({
    queryKey: ["cvm", "dashboard", "alerts", ALERTS_PREVIEW_SIZE],
    queryFn: () => listOperationalAlerts({ page: 1, page_size: ALERTS_PREVIEW_SIZE }),
  });

  const dashboard = dashboardQuery.data;
  const kpis = dashboard?.kpis;
  const byType = dashboard?.by_type ?? [];

  return (
    <div className="flex flex-col gap-4">
      <section className="panel-surface metric-tile flex flex-col gap-5 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
              Moderação CVM
            </p>
            <h2 className="text-2xl font-semibold text-foreground">Dashboard CVM</h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Visão consolidada dos documentos CVM, status de moderação e alertas operacionais.
              Painel interno de inspeção — os números são calculados no backend.
            </p>
          </div>

          <Button
            variant="secondary"
            className="rounded-full"
            onClick={() => {
              void dashboardQuery.refetch();
              void alertsQuery.refetch();
            }}
            disabled={dashboardQuery.isFetching}
          >
            <RefreshCcw className="size-4" />
            {dashboardQuery.isFetching ? "Atualizando..." : "Atualizar"}
          </Button>
        </div>
      </section>

      <section className="space-y-2">
        {dashboardQuery.isError ? (
          <Card className="metric-tile">
            <CardContent className="p-6 text-sm text-destructive">
              Não foi possível carregar o dashboard CVM. {dashboardQuery.error?.message}
            </CardContent>
          </Card>
        ) : dashboardQuery.isLoading ? (
          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={`kpi-skeleton-${index}`} className="metric-tile">
                <CardHeader className="gap-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-7 w-16" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : kpis ? (
          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            <KpiCard label="Total filings" value={formatInteger(kpis.total_filings)} />
            <KpiCard label="Validados" value={formatInteger(kpis.validated)} tone="success" />
            <KpiCard label="Pendentes" value={formatInteger(kpis.pending)} tone="warning" />
            <KpiCard
              label="Alertas ativos"
              value={formatInteger(kpis.active_alerts)}
              tone={kpis.active_alerts > 0 ? "destructive" : undefined}
            />
            <KpiCard label="Empresas" value={formatInteger(kpis.companies)} />
            <KpiCard
              label="Última EOD"
              value={kpis.last_eod ? formatDate(kpis.last_eod) : "—"}
              hint={kpis.last_eod ? undefined : "Nenhuma EOD registrada"}
            />
          </div>
        ) : null}
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Documentos por tipo</h3>
        </div>
        {dashboardQuery.isError ? null : dashboardQuery.isLoading ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 9 }).map((_, index) => (
              <Card key={`doc-skeleton-${index}`} className="metric-tile">
                <CardHeader>
                  <Skeleton className="h-4 w-20" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : byType.length === 0 ? (
          <Card className="metric-tile">
            <CardContent className="p-6 text-sm text-muted-foreground">
              Nenhum documento CVM agregado ainda.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {byType.map((item) => (
              <DocTypeCard key={item.report_type} item={item} />
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Alertas operacionais</h3>
            <Link
              href="/cvm/alerts"
              className="font-mono text-[11px] text-primary underline-offset-4 hover:underline"
            >
              Ver todos →
            </Link>
          </div>
          <Card className="panel-surface overflow-hidden p-0">
            {alertsQuery.isError ? (
              <div className="p-6 text-sm text-destructive">
                Não foi possível carregar os alertas. {alertsQuery.error?.message}
              </div>
            ) : alertsQuery.isLoading ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={`alert-skeleton-${index}`} className="h-10 w-full" />
                ))}
              </div>
            ) : (alertsQuery.data?.items.length ?? 0) === 0 ? (
              <div className="p-6 text-sm text-muted-foreground">
                Nenhum alerta operacional ativo.
              </div>
            ) : (
              <div>
                {alertsQuery.data?.items.map((alert, index) => (
                  <AlertRow key={`${alert.alert_type}-${alert.cd_cvm}-${index}`} alert={alert} />
                ))}
              </div>
            )}
          </Card>
        </section>

        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Status do pipeline</h3>
          </div>
          <Card className="panel-surface flex min-h-[160px] flex-col items-center justify-center gap-2 p-6 text-center">
            <div className="rounded-full bg-muted p-3 text-muted-foreground">
              <Clock className="size-5" />
            </div>
            <p className="text-sm font-medium text-foreground">Operação em breve</p>
            <p className="max-w-xs text-[11px] text-muted-foreground">
              O monitoramento de jobs e do pipeline EOD chega em uma sprint futura.
            </p>
          </Card>
        </section>
      </div>
    </div>
  );
}
