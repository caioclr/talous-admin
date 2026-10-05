"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  formatQuotaDay,
  quotaLevel,
  quotaRatio,
  type QuotaLevel,
} from "@/lib/services/admin/ops-provider-quota";
import type { ProviderQuotaDay } from "@/lib/services/admin/types";

interface ProviderQuotaChartProps {
  /** Linhas de UM provedor, em qualquer ordem (o grafico ordena por dia). */
  days: ProviderQuotaDay[];
  height?: number;
}

/** Cor da barra pela faixa do dia — mesmos tokens de status dos badges. */
const LEVEL_FILL: Record<QuotaLevel, string> = {
  ok: "var(--success)",
  warning: "var(--warning)",
  danger: "var(--destructive)",
  unknown: "var(--muted-foreground)",
};

const integerFormat = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const compactFormat = new Intl.NumberFormat("pt-BR", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const percentFormat = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

interface ChartRow {
  day: string;
  label: string;
  used: number;
  dailyLimit: number | null;
  level: QuotaLevel;
}

/**
 * Consumo diario (barras) contra o limite (linha de referencia) — uma serie,
 * sem legenda. A linha usa o limite da leitura mais recente; o limite de cada
 * dia aparece no tooltip e na tabela.
 */
export function ProviderQuotaChart({ days, height = 260 }: ProviderQuotaChartProps) {
  const { data, referenceLimit, yMax } = useMemo(() => {
    const rows: ChartRow[] = [...days]
      .sort((a, b) => a.day.localeCompare(b.day))
      .map((row) => ({
        day: row.day,
        label: formatQuotaDay(row.day, { short: true }),
        used: row.used,
        dailyLimit: row.daily_limit,
        level: quotaLevel(quotaRatio(row.used, row.daily_limit)),
      }));
    const latestLimit = rows.at(-1)?.dailyLimit ?? null;
    const peak = Math.max(0, ...rows.map((row) => row.used), latestLimit ?? 0);
    return { data: rows, referenceLimit: latestLimit, yMax: Math.ceil(peak * 1.12) || 1 };
  }, [days]);

  return (
    <div className="rounded-lg border border-border/80 bg-background/70 p-4">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 16, right: 24, left: 0, bottom: 4 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.2} />
          <XAxis
            dataKey="label"
            stroke="currentColor"
            strokeOpacity={0.4}
            tick={{ fontSize: 11 }}
            tickLine={false}
            interval="preserveStartEnd"
            minTickGap={12}
          />
          <YAxis
            stroke="currentColor"
            strokeOpacity={0.4}
            domain={[0, yMax]}
            tickFormatter={(value: number) => compactFormat.format(value)}
            tick={{ fontSize: 11 }}
            tickLine={false}
            width={56}
          />
          <Tooltip
            cursor={{ fill: "currentColor", fillOpacity: 0.06 }}
            content={({ active, payload }) => {
              const row = active ? (payload?.[0]?.payload as ChartRow | undefined) : undefined;
              if (!row) {
                return null;
              }
              const ratio = quotaRatio(row.used, row.dailyLimit);
              return (
                <div className="rounded-md border border-border bg-background px-3 py-2 text-[11px] shadow-sm">
                  <p className="font-medium text-foreground">{formatQuotaDay(row.day)}</p>
                  <p className="font-mono tabular-nums text-foreground">
                    {integerFormat.format(row.used)}
                    {row.dailyLimit !== null
                      ? ` / ${integerFormat.format(row.dailyLimit)}`
                      : ""}
                  </p>
                  <p className="text-muted-foreground">
                    {ratio === null ? "Sem limite informado" : `${percentFormat.format(ratio)} do limite`}
                  </p>
                </div>
              );
            }}
          />
          {referenceLimit !== null ? (
            <ReferenceLine
              y={referenceLimit}
              stroke="var(--muted-foreground)"
              strokeDasharray="4 4"
              label={{
                value: `Limite ${integerFormat.format(referenceLimit)}`,
                position: "insideBottomLeft",
                fontSize: 11,
                fill: "var(--muted-foreground)",
              }}
            />
          ) : null}
          <Bar dataKey="used" name="Consumo" radius={[4, 4, 0, 0]} maxBarSize={28}>
            {data.map((row) => (
              <Cell key={row.day} fill={LEVEL_FILL[row.level]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
