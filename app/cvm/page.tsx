"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  ArrowUpRight,
  CheckCircle2,
  CircleAlert,
  Loader2,
  RefreshCcw,
} from "lucide-react";
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
import { formatDate, formatDateTime, formatDuration } from "@/lib/formatters";
import {
  ALERT_TYPE_LABELS,
  alertOrigin,
  listOperationalAlerts,
} from "@/lib/services/admin/cvm-alerts";
import {
  dashboardTypeDescription,
  dashboardTypeLabel,
  dashboardTypeRoute,
  getCVMDashboard,
} from "@/lib/services/admin/cvm-dashboard";
import {
  PIPELINE_JOB_NAMES,
  getOpsJobs,
  isCvmSyncJob,
  jobDescription,
  jobLabel,
} from "@/lib/services/admin/ops-jobs";
import type {
  AlertSeverity,
  DashboardByType,
  OperationalAlert,
  OpsJobRun,
} from "@/lib/services/admin/types";

const ALERTS_PREVIEW_SIZE = 6;

// TODO i18n: rotulos de severidade derivados de dados (migracao progressiva).
const SEVERITY_BADGES: Record<
  AlertSeverity,
  { label: string; variant: "destructive" | "warning" | "secondary" }
> = {
  alta: { label: "Alta", variant: "destructive" },
  media: { label: "Media", variant: "warning" },
  baixa: { label: "Baixa", variant: "secondary" },
};

function JobStatusBadge({ run }: { run: OpsJobRun }) {
  const t = useTranslations("admin.dashboard");
  if (run.status === "running") {
    return (
      <Badge variant="default" className="gap-1">
        <Loader2 className="size-3 animate-spin" />
        {t("jobRunning")}
      </Badge>
    );
  }
  if (run.status === "failed") {
    return (
      <Badge variant="destructive" className="gap-1">
        <CircleAlert className="size-3" />
        {t("jobFailed")}
      </Badge>
    );
  }
  if (run.stale) {
    return (
      <Badge variant="warning" className="gap-1">
        <CircleAlert className="size-3" />
        {t("jobStale")}
      </Badge>
    );
  }
  return (
    <Badge variant="success" className="gap-1">
      <CheckCircle2 className="size-3" />
      {t("jobOk")}
    </Badge>
  );
}

function PipelineJobRow({ run }: { run: OpsJobRun }) {
  const description = jobDescription(run.job_name);
  return (
    <div className="flex items-start gap-3 border-b border-border/60 px-4 py-3 last:border-b-0">
      <div className="min-w-0 flex-1 space-y-1">
        <p className="truncate text-sm font-medium text-foreground">{jobLabel(run.job_name)}</p>
        <p className="font-mono text-[11px] text-muted-foreground">
          {formatDateTime(run.started_at)}
          {run.duration_ms !== null ? ` · ${formatDuration(run.duration_ms)}` : ""}
          {description ? ` · ${description}` : ""}
        </p>
      </div>
      <JobStatusBadge run={run} />
    </div>
  );
}

/** Inteiros no padrao pt-BR (separador de milhar). Sem casas decimais. */
function formatInteger(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "—";
  }
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(value);
}

function FreshnessBadge({ freshness }: { freshness: string }) {
  const t = useTranslations("admin.dashboard");
  if (freshness === "em_dia") {
    return <Badge variant="success">{t("freshnessOnTime")}</Badge>;
  }
  if (freshness === "atraso") {
    return <Badge variant="warning">{t("freshnessLate")}</Badge>;
  }
  // TODO i18n: freshness desconhecido renderiza o valor cru do backend (progressivo).
  return <Badge variant="secondary">{freshness}</Badge>;
}

function DocTypeCard({ item }: { item: DashboardByType }) {
  const t = useTranslations("admin.dashboard");
  const label = dashboardTypeLabel(item.report_type);
  const description = dashboardTypeDescription(item.report_type);
  const route = dashboardTypeRoute(item.report_type);

  const body = (
    <Card className="metric-tile h-full transition hover:border-primary/40">
      <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="font-mono">{label}</CardTitle>
        <FreshnessBadge freshness={item.freshness} />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-6">
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{t("total")}</p>
            <p className="font-mono text-base font-medium tabular-nums text-foreground">
              {formatInteger(item.total)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              {t("validated")}
            </p>
            <p className="font-mono text-base font-medium tabular-nums text-success">
              {formatInteger(item.validated)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              {t("pending")}
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
  const t = useTranslations("admin.dashboard");
  // TODO i18n: severity e ALERT_TYPE_LABELS derivam de dados do backend (progressivo).
  const badge = SEVERITY_BADGES[alert.severity] ?? {
    label: alert.severity,
    variant: "secondary" as const,
  };
  const typeLabel = ALERT_TYPE_LABELS[alert.alert_type] ?? alert.alert_type;
  const origin = alertOrigin(alert);

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
          aria-label={t("openAlertOrigin", { type: typeLabel })}
        >
          <ArrowUpRight className="size-4" />
        </Link>
      ) : null}
    </div>
  );
}

export default function CVMDashboardPage() {
  const t = useTranslations("admin.dashboard");

  const dashboardQuery = useQuery({
    queryKey: ["cvm", "dashboard"],
    queryFn: getCVMDashboard,
  });

  const alertsQuery = useQuery({
    queryKey: ["cvm", "dashboard", "alerts", ALERTS_PREVIEW_SIZE],
    queryFn: () => listOperationalAlerts({ page: 1, page_size: ALERTS_PREVIEW_SIZE }),
  });

  const opsQuery = useQuery({
    queryKey: ["cvm", "dashboard", "ops-jobs"],
    queryFn: () => getOpsJobs(),
  });

  const dashboard = dashboardQuery.data;
  const kpis = dashboard?.kpis;
  const byType = dashboard?.by_type ?? [];

  // Jobs principais do pipeline para o painel do dashboard, na ordem definida.
  // Os ~10 cvm_sync_* ficam condensados num contador; o detalhe vai p/ /cvm/jobs.
  const allJobs = opsQuery.data?.jobs ?? [];
  const jobsByName = new Map(allJobs.map((job) => [job.job_name, job]));
  const pipelineJobs = PIPELINE_JOB_NAMES.map((name) => jobsByName.get(name)).filter(
    (job): job is OpsJobRun => job !== undefined,
  );
  const cvmSyncJobs = allJobs.filter((job) => isCvmSyncJob(job.job_name));
  const cvmSyncAttention = cvmSyncJobs.filter(
    (job) => job.status === "failed" || (job.status === "ok" && job.stale),
  ).length;

  return (
    <div className="flex flex-col gap-4">
      <section className="panel-surface metric-tile flex flex-col gap-5 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
              {t("kicker")}
            </p>
            <h2 className="text-2xl font-semibold text-foreground">{t("title")}</h2>
            <p className="max-w-2xl text-sm text-muted-foreground">{t("description")}</p>
          </div>

          <Button
            variant="secondary"
            className="rounded-full"
            onClick={() => {
              void dashboardQuery.refetch();
              void alertsQuery.refetch();
              void opsQuery.refetch();
            }}
            disabled={dashboardQuery.isFetching}
          >
            <RefreshCcw className="size-4" />
            {dashboardQuery.isFetching ? t("refreshing") : t("refresh")}
          </Button>
        </div>
      </section>

      <section className="space-y-2">
        {dashboardQuery.isError ? (
          <Card className="metric-tile">
            <CardContent className="p-6 text-sm text-destructive">
              {t("dashboardError")} {dashboardQuery.error?.message}
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
            <KpiCard label={t("kpiTotalFilings")} value={formatInteger(kpis.total_filings)} />
            <KpiCard label={t("validated")} value={formatInteger(kpis.validated)} tone="success" />
            <KpiCard label={t("pending")} value={formatInteger(kpis.pending)} tone="warning" />
            <KpiCard
              label={t("kpiActiveAlerts")}
              value={formatInteger(kpis.active_alerts)}
              tone={kpis.active_alerts > 0 ? "destructive" : undefined}
            />
            <KpiCard label={t("kpiCompanies")} value={formatInteger(kpis.companies)} />
            <KpiCard
              label={t("kpiLastEod")}
              value={kpis.last_eod ? formatDate(kpis.last_eod) : "—"}
              hint={kpis.last_eod ? undefined : t("kpiNoEod")}
            />
          </div>
        ) : null}
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">{t("docByTypeTitle")}</h3>
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
              {t("noDocs")}
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
            <h3 className="text-sm font-semibold text-foreground">{t("alertsTitle")}</h3>
            <Link
              href="/cvm/alerts"
              className="font-mono text-[11px] text-primary underline-offset-4 hover:underline"
            >
              {t("seeAll")}
            </Link>
          </div>
          <Card className="panel-surface overflow-hidden p-0">
            {alertsQuery.isError ? (
              <div className="p-6 text-sm text-destructive">
                {t("alertsError")} {alertsQuery.error?.message}
              </div>
            ) : alertsQuery.isLoading ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={`alert-skeleton-${index}`} className="h-10 w-full" />
                ))}
              </div>
            ) : (alertsQuery.data?.items.length ?? 0) === 0 ? (
              <div className="p-6 text-sm text-muted-foreground">
                {t("noActiveAlerts")}
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
            <h3 className="text-sm font-semibold text-foreground">{t("pipelineTitle")}</h3>
            <Link
              href="/cvm/jobs"
              className="font-mono text-[11px] text-primary underline-offset-4 hover:underline"
            >
              {t("seeJobs")}
            </Link>
          </div>
          <Card className="panel-surface overflow-hidden p-0">
            {opsQuery.isError ? (
              <div className="p-6 text-sm text-destructive">
                {t("pipelineError")} {opsQuery.error?.message}
              </div>
            ) : opsQuery.isLoading ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={`pipeline-skeleton-${index}`} className="h-10 w-full" />
                ))}
              </div>
            ) : pipelineJobs.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground">
                {t("noPipelineJobs")}
              </div>
            ) : (
              <div>
                {pipelineJobs.map((job) => (
                  <PipelineJobRow key={job.job_name} run={job} />
                ))}
                {cvmSyncJobs.length > 0 ? (
                  <Link
                    href="/cvm/jobs"
                    className="flex items-center justify-between gap-3 px-4 py-3 text-[11px] text-muted-foreground transition hover:bg-card-raised hover:text-foreground"
                  >
                    <span>
                      {t("syncs", { count: cvmSyncJobs.length })}
                      {cvmSyncAttention > 0 ? ` · ${t("syncsAttention", { count: cvmSyncAttention })}` : ""}
                    </span>
                    {cvmSyncAttention > 0 ? (
                      <Badge variant="warning">{cvmSyncAttention}</Badge>
                    ) : (
                      <Badge variant="secondary">{t("seeDetail")}</Badge>
                    )}
                  </Link>
                ) : null}
              </div>
            )}
          </Card>
        </section>
      </div>
    </div>
  );
}
