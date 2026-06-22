"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, CheckCircle2, CircleAlert, Loader2, RefreshCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { formatDateTime, formatDuration } from "@/lib/formatters";
import {
  JOB_LABELS,
  getOpsJobs,
  jobDescription,
  jobLabel,
} from "@/lib/services/admin/ops-jobs";
import type { OpsJobRun } from "@/lib/services/admin/types";

const HISTORY_LIMIT = 50;

/** Ordem amigavel da lista de jobs no filtro (mesma do mapa de labels). */
const JOB_FILTER_OPTIONS = Object.keys(JOB_LABELS);

function StatusBadge({ run }: { run: OpsJobRun }) {
  if (run.status === "running") {
    return (
      <Badge variant="default" className="gap-1">
        <Loader2 className="size-3 animate-spin" />
        Rodando
      </Badge>
    );
  }

  if (run.status === "failed") {
    return (
      <Badge variant="destructive" className="gap-1">
        <CircleAlert className="size-3" />
        Falha
      </Badge>
    );
  }

  // status === "ok"
  if (run.stale) {
    return (
      <Badge variant="warning" className="gap-1">
        <CircleAlert className="size-3" />
        Atrasado
      </Badge>
    );
  }

  return (
    <Badge variant="success" className="gap-1">
      <CheckCircle2 className="size-3" />
      OK
    </Badge>
  );
}

function JobStatusCard({ run }: { run: OpsJobRun }) {
  const description = jobDescription(run.job_name);

  return (
    <Card className="metric-tile h-full">
      <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-sm">{jobLabel(run.job_name)}</CardTitle>
          <p className="font-mono text-[10px] text-muted-foreground">{run.job_name}</p>
        </div>
        <StatusBadge run={run} />
      </CardHeader>
      <CardContent className="space-y-2 text-[11px] text-muted-foreground">
        <div className="flex justify-between gap-3">
          <span>Última execução</span>
          <span className="font-mono tabular-nums text-foreground">
            {formatDateTime(run.started_at)}
          </span>
        </div>
        <div className="flex justify-between gap-3">
          <span>Duração</span>
          <span className="font-mono tabular-nums text-foreground">
            {formatDuration(run.duration_ms)}
          </span>
        </div>
        <div className="flex justify-between gap-3">
          <span>Último sucesso</span>
          <span className="font-mono tabular-nums text-foreground">
            {formatDateTime(run.last_ok_at)}
          </span>
        </div>
        {description ? (
          <p className="border-t border-border/60 pt-2 text-[11px]">{description}</p>
        ) : null}
        {run.detail ? (
          <p className="break-words border-t border-border/60 pt-2 text-[11px] text-foreground">
            {run.detail}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

const historyColumns: DataTableColumn<OpsJobRun>[] = [
  {
    key: "job",
    header: "Job",
    render: (row) => (
      <div className="space-y-1">
        <p className="font-medium text-foreground">{jobLabel(row.job_name)}</p>
        <p className="font-mono text-[10px] text-muted-foreground">{row.job_name}</p>
      </div>
    ),
  },
  {
    key: "status",
    header: "Status",
    render: (row) => <StatusBadge run={row} />,
  },
  {
    key: "started",
    header: "Início",
    render: (row) => (
      <span className="font-mono text-xs tabular-nums">{formatDateTime(row.started_at)}</span>
    ),
  },
  {
    key: "finished",
    header: "Fim",
    render: (row) => (
      <span className="font-mono text-xs tabular-nums">{formatDateTime(row.finished_at)}</span>
    ),
  },
  {
    key: "duration",
    header: "Duração",
    render: (row) => (
      <span className="font-mono text-xs tabular-nums">{formatDuration(row.duration_ms)}</span>
    ),
  },
  {
    key: "detail",
    header: "Detalhe",
    render: (row) => (
      <span className="text-xs text-muted-foreground" title={row.detail ?? undefined}>
        {row.detail ?? "—"}
      </span>
    ),
  },
];

export default function OpsJobsPage() {
  const [jobName, setJobName] = useState("");

  const jobsQuery = useQuery({
    queryKey: ["cvm", "ops", "jobs", { jobName, historyLimit: HISTORY_LIMIT }],
    queryFn: () =>
      getOpsJobs({
        job_name: jobName || undefined,
        history_limit: HISTORY_LIMIT,
      }),
  });

  const jobs = useMemo(() => jobsQuery.data?.jobs ?? [], [jobsQuery.data]);
  const history = jobsQuery.data?.history ?? [];

  const summary = useMemo(() => {
    return {
      running: jobs.filter((job) => job.status === "running").length,
      failed: jobs.filter((job) => job.status === "failed").length,
      stale: jobs.filter((job) => job.status === "ok" && job.stale).length,
    };
  }, [jobs]);

  return (
    <div className="flex flex-col gap-4">
      <section className="panel-surface metric-tile flex flex-col gap-5 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
              Operação
            </p>
            <h2 className="text-2xl font-semibold text-foreground">Jobs / Sync</h2>
            <p className="max-w-3xl text-sm text-muted-foreground">
              Estado atual e histórico de execução dos jobs Celery instrumentados (pipeline EOD,
              intraday, syncs CVM e gatilhos). Apenas leitura — o backend calcula status, duração e
              o sinal de atraso (stale). Sem disparo ou retry pelo painel.
            </p>
          </div>

          <Button
            variant="secondary"
            className="rounded-full"
            onClick={() => {
              void jobsQuery.refetch();
            }}
            disabled={jobsQuery.isFetching}
          >
            <RefreshCcw className="size-4" />
            {jobsQuery.isFetching ? "Atualizando..." : "Atualizar"}
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <SummaryTile label="Rodando" value={String(summary.running)} icon={<Activity className="size-4" />} />
          <SummaryTile label="Em falha" value={String(summary.failed)} tone="destructive" />
          <SummaryTile label="Atrasados (stale)" value={String(summary.stale)} tone="warning" />
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Status por job</h3>
        {jobsQuery.isError ? (
          <Card className="metric-tile">
            <CardContent className="p-6 text-sm text-destructive">
              Não foi possível carregar os jobs. {jobsQuery.error?.message}
            </CardContent>
          </Card>
        ) : jobsQuery.isLoading ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={`job-skeleton-${index}`} className="metric-tile h-28" />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <Card className="metric-tile">
            <CardContent className="p-6 text-sm text-muted-foreground">
              Nenhum job registrado ainda.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {jobs.map((job) => (
              <JobStatusCard key={job.job_name} run={job} />
            ))}
          </div>
        )}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de execuções</CardTitle>
          <CardDescription>
            Execuções recentes (mais novas primeiro). Filtre por job para inspecionar uma série.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:max-w-md">
          <Select
            aria-label="Filtrar por job"
            value={jobName}
            onChange={(event) => setJobName(event.target.value)}
          >
            <option value="">Todos os jobs</option>
            {JOB_FILTER_OPTIONS.map((name) => (
              <option key={name} value={name}>
                {jobLabel(name)}
              </option>
            ))}
          </Select>
        </CardContent>
      </Card>

      {jobsQuery.isError ? null : (
        <DataTable
          columns={historyColumns}
          data={history}
          loading={jobsQuery.isLoading}
          getRowKey={(row, index) => `${row.job_name}-${row.started_at}-${index}`}
          emptyMessage="Nenhuma execução no histórico para o filtro informado."
        />
      )}
    </div>
  );
}

function SummaryTile({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: string;
  tone?: "warning" | "destructive";
  icon?: React.ReactNode;
}) {
  const toneClass =
    tone === "destructive"
      ? "text-destructive"
      : tone === "warning"
        ? "text-warning"
        : "text-foreground";

  return (
    <Card className="metric-tile">
      <CardHeader className="gap-2">
        <CardDescription className="flex items-center gap-2">
          {icon}
          {label}
        </CardDescription>
        <CardTitle className={`font-mono text-2xl tabular-nums ${toneClass}`}>{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}
