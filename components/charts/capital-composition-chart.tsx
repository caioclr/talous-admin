"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CapitalCompositionSnapshotSummary } from "@/lib/services/admin/types";

interface CapitalCompositionChartProps {
  snapshots: CapitalCompositionSnapshotSummary[];
  height?: number;
}

function toNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

const formatNumber = new Intl.NumberFormat("pt-BR", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function CapitalCompositionChart({ snapshots, height = 280 }: CapitalCompositionChartProps) {
  const data = useMemo(() => {
    return [...snapshots]
      .filter((s) => Boolean(s.reference_date))
      .sort((a, b) => a.reference_date.localeCompare(b.reference_date))
      .map((s) => ({
        reference_date: s.reference_date,
        integralized: toNumber(s.qt_total_integralized),
        treasury: toNumber(s.qt_total_treasury),
      }));
  }, [snapshots]);

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-3xl border border-dashed border-border/80 bg-background/70 text-sm text-muted-foreground"
        style={{ height }}
      >
        Sem snapshots suficientes para plotar a série.
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-border/80 bg-background/70 p-4">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 12, right: 24, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.25} />
          <XAxis
            dataKey="reference_date"
            stroke="currentColor"
            tickMargin={8}
            tick={{ fontSize: 12 }}
          />
          <YAxis
            stroke="currentColor"
            tickFormatter={(value: number) => formatNumber.format(value)}
            tick={{ fontSize: 12 }}
            width={64}
          />
          <Tooltip
            formatter={(value) => {
              const n = typeof value === "number" ? value : Number(value);
              return Number.isFinite(n) ? formatNumber.format(n) : "—";
            }}
            labelFormatter={(label) => `Referência ${String(label ?? "—")}`}
            contentStyle={{
              background: "var(--background)",
              border: "1px solid var(--border)",
              borderRadius: 12,
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="integralized"
            name="Integralizado total"
            stroke="hsl(217 91% 60%)"
            strokeWidth={2}
            dot={false}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="treasury"
            name="Tesouraria total"
            stroke="hsl(20 90% 55%)"
            strokeWidth={2}
            dot={false}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
