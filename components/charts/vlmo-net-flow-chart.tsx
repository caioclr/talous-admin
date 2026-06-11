"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { VLMOAggregateRow } from "@/lib/services/admin/types";

interface VLMONetFlowChartProps {
  rows: VLMOAggregateRow[];
  height?: number;
}

const PALETTE = [
  "hsl(217 91% 60%)",
  "hsl(20 90% 55%)",
  "hsl(160 70% 45%)",
  "hsl(280 70% 60%)",
  "hsl(45 90% 55%)",
  "hsl(0 80% 60%)",
];

const formatNumber = new Intl.NumberFormat("pt-BR", {
  notation: "compact",
  maximumFractionDigits: 1,
});

function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

interface PivotedRow {
  reference_month: string;
  [tipo_cargo: string]: string | number;
}

export function VLMONetFlowChart({ rows, height = 320 }: VLMONetFlowChartProps) {
  const { data, cargos } = useMemo(() => {
    const cargoSet = new Set<string>();
    const grouped = new Map<string, PivotedRow>();

    for (const row of rows) {
      if (!row.reference_month) continue;
      cargoSet.add(row.tipo_cargo);
      const bucket = grouped.get(row.reference_month) ?? {
        reference_month: row.reference_month,
      };
      bucket[row.tipo_cargo] = toNumber(row.net_flow_quantity);
      grouped.set(row.reference_month, bucket);
    }

    const sorted = [...grouped.values()].sort((a, b) =>
      a.reference_month.localeCompare(b.reference_month),
    );

    return {
      data: sorted,
      cargos: [...cargoSet].sort(),
    };
  }, [rows]);

  if (data.length === 0 || cargos.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-3xl border border-dashed border-border/80 bg-background/70 text-sm text-muted-foreground"
        style={{ height }}
      >
        Sem agregacao mensal disponivel para esta empresa.
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-border/80 bg-background/70 p-4">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 12, right: 24, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.25} />
          <XAxis dataKey="reference_month" stroke="currentColor" tick={{ fontSize: 12 }} />
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
            labelFormatter={(label) => `Mes ${String(label ?? "—")}`}
            contentStyle={{
              background: "var(--background)",
              border: "1px solid var(--border)",
              borderRadius: 12,
            }}
          />
          <Legend />
          <ReferenceLine y={0} stroke="currentColor" strokeOpacity={0.4} />
          {cargos.map((cargo, idx) => (
            <Bar
              key={cargo}
              dataKey={cargo}
              fill={PALETTE[idx % PALETTE.length]}
              name={cargo}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
