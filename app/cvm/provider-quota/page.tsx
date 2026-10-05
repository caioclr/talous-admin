"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { ProviderQuotaChart } from "@/components/charts/provider-quota-chart";
import {
  ProviderQuotaSummary,
  QUOTA_LEVEL_TEXT,
  QuotaBar,
  QuotaLevelBadge,
  formatQuotaCheckedAt,
  formatQuotaInteger,
  formatQuotaPercent,
} from "@/components/ops/provider-quota-summary";
import {
  formatQuotaDay,
  getProviderQuota,
  groupProviderQuota,
  quotaLevel,
  quotaRatio,
  todayQuotaDay,
} from "@/lib/services/admin/ops-provider-quota";
import type { ProviderQuotaDay } from "@/lib/services/admin/types";
import { cn } from "@/lib/utils";

const HISTORY_DAYS = 30;

const dayColumns: DataTableColumn<ProviderQuotaDay>[] = [
  {
    key: "day",
    header: "Dia",
    render: (row) => (
      <span className="font-mono text-xs tabular-nums">{formatQuotaDay(row.day)}</span>
    ),
  },
  {
    key: "used",
    header: "Consumo",
    className: "min-w-48",
    render: (row) => {
      const ratio = quotaRatio(row.used, row.daily_limit);
      const level = quotaLevel(ratio);
      return (
        <div className="flex items-center gap-3">
          <span className="w-14 text-right font-mono text-xs tabular-nums">
            {formatQuotaInteger(row.used)}
          </span>
          <QuotaBar
            ratio={ratio}
            level={level}
            label={`Consumo em ${formatQuotaDay(row.day)}`}
            className="h-1.5 max-w-40"
          />
        </div>
      );
    },
  },
  {
    key: "limit",
    header: "Limite",
    render: (row) => (
      <span className="font-mono text-xs tabular-nums">{formatQuotaInteger(row.daily_limit)}</span>
    ),
  },
  {
    key: "percent",
    header: "% do limite",
    render: (row) => {
      const ratio = quotaRatio(row.used, row.daily_limit);
      const level = quotaLevel(ratio);
      return (
        <div className="flex items-center gap-2">
          <span className={cn("font-mono text-xs tabular-nums", QUOTA_LEVEL_TEXT[level])}>
            {formatQuotaPercent(ratio)}
          </span>
          {level === "warning" || level === "danger" ? <QuotaLevelBadge level={level} /> : null}
        </div>
      );
    },
  },
  {
    key: "tier",
    header: "Plano",
    render: (row) => <span className="text-xs text-muted-foreground">{row.tier ?? "—"}</span>,
  },
  {
    key: "checked",
    header: "Última leitura",
    render: (row) => (
      <span className="font-mono text-xs tabular-nums" title={`${row.checked_at} UTC`}>
        {formatQuotaCheckedAt(row.checked_at)}
      </span>
    ),
  },
];

export default function ProviderQuotaPage() {
  const quotaQuery = useQuery({
    queryKey: ["cvm", "ops", "provider-quota", { days: HISTORY_DAYS }],
    queryFn: () => getProviderQuota({ days: HISTORY_DAYS }),
  });

  const series = useMemo(
    () => groupProviderQuota(quotaQuery.data?.days ?? []),
    [quotaQuery.data],
  );
  const today = todayQuotaDay();

  return (
    <div className="flex flex-col gap-4">
      <section className="panel-surface metric-tile flex flex-col gap-5 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
              Operação
            </p>
            <h2 className="text-2xl font-semibold text-foreground">Cota do provedor</h2>
            <p className="max-w-3xl text-sm text-muted-foreground">
              Consumo diário da cota de requisições do provedor de dados, lido de hora em hora pelo
              job <span className="font-mono">jobs.record_provider_quota</span>. O dia é o da cota do
              provedor, que vira à meia-noite UTC (21h em Brasília). Apenas leitura.
            </p>
          </div>

          <Button
            variant="secondary"
            className="rounded-full"
            onClick={() => {
              void quotaQuery.refetch();
            }}
            disabled={quotaQuery.isFetching}
          >
            <RefreshCcw className="size-4" />
            {quotaQuery.isFetching ? "Atualizando..." : "Atualizar"}
          </Button>
        </div>
      </section>

      {quotaQuery.isError ? (
        <Card className="metric-tile">
          <CardContent className="p-6 text-sm text-destructive">
            Não foi possível carregar a cota do provedor. {quotaQuery.error?.message}
          </CardContent>
        </Card>
      ) : quotaQuery.isLoading ? (
        <div className="grid gap-4">
          <Card className="metric-tile h-56" />
          <Card className="metric-tile h-72" />
        </div>
      ) : series.length === 0 ? (
        <Card className="metric-tile">
          <CardContent className="space-y-1 p-6 text-sm">
            <p className="text-foreground">Nenhuma leitura de cota registrada ainda.</p>
            <p className="text-[11px] text-muted-foreground">
              O job grava a primeira linha no minuto 55 da próxima hora. Se continuar vazio, confira
              o status de <span className="font-mono">jobs.record_provider_quota</span> em Jobs /
              Sync.
            </p>
          </CardContent>
        </Card>
      ) : (
        series.map((item) => (
          <div key={item.provider} className="flex flex-col gap-4">
            <ProviderQuotaSummary series={item} today={today} />

            <Card>
              <CardHeader>
                <CardTitle>Últimos {HISTORY_DAYS} dias</CardTitle>
                <CardDescription>
                  Consumo por dia contra o limite diário (linha tracejada). Barras em amarelo a
                  partir de 80% do limite e em vermelho a partir de 95%.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProviderQuotaChart days={item.days} />
              </CardContent>
            </Card>

            <DataTable
              columns={dayColumns}
              data={item.days}
              getRowKey={(row) => `${row.provider}-${row.day}`}
              emptyMessage="Nenhuma leitura registrada."
            />
          </div>
        ))
      )}
    </div>
  );
}
