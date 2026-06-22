"use client";

import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { VLMONetFlowChart } from "@/components/charts/vlmo-net-flow-chart";
import { formatDate, formatDecimal } from "@/lib/formatters";
import { getVLMOAggregates, listVLMOByCompany } from "@/lib/services/admin/cvm-vlmo";
import type { VLMOMovimentacaoSummary } from "@/lib/services/admin/types";

const CURRENT_YEAR = new Date().getUTCFullYear();
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

const movColumns: DataTableColumn<VLMOMovimentacaoSummary>[] = [
  {
    key: "data",
    header: "Movimentacao",
    render: (row) => (
      <div className="space-y-1">
        <p className="text-sm">{formatDate(row.data_movimentacao)}</p>
        <p className="text-xs text-muted-foreground">ref {formatDate(row.data_referencia)}</p>
      </div>
    ),
  },
  {
    key: "cargo",
    header: "Cargo",
    render: (row) => (
      <div className="space-y-1">
        <p>{row.tipo_cargo ?? "—"}</p>
        <p className="text-xs text-muted-foreground">{row.tipo_empresa ?? row.empresa ?? "—"}</p>
      </div>
    ),
  },
  {
    key: "operacao",
    header: "Movimentacao",
    render: (row) => (
      <Badge
        variant={
          row.is_position_snapshot
            ? "secondary"
            : row.tipo_movimentacao === "Compra"
              ? "success"
              : row.tipo_movimentacao === "Venda"
                ? "warning"
                : "default"
        }
      >
        {row.tipo_movimentacao ?? "—"}
      </Badge>
    ),
  },
  {
    key: "ativo",
    header: "Ativo",
    render: (row) => row.tipo_ativo ?? "—",
  },
  {
    key: "qty",
    header: "Qtd · Preco",
    render: (row) => (
      <div className="space-y-1 font-mono text-xs">
        <p>{formatDecimal(row.quantidade, { maximumFractionDigits: 0 })}</p>
        <p className="text-muted-foreground">
          {formatDecimal(row.preco_unitario, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
        </p>
      </div>
    ),
  },
  {
    key: "volume",
    header: "Volume",
    render: (row) => (
      <span className="font-mono text-xs">{formatDecimal(row.volume, { maximumFractionDigits: 2 })}</span>
    ),
  },
];

export default function VLMOCompanyPage() {
  const searchParams = useSearchParams();
  const cdCvm = searchParams.get("cd_cvm") ?? "";
  const [page, setPage] = useState(1);
  const [year, setYear] = useState<string>("");
  const [includeSnapshot, setIncludeSnapshot] = useState(false);

  const aggregatesQuery = useQuery({
    queryKey: ["cvm", "vlmo", "aggregates", cdCvm, year],
    queryFn: () =>
      getVLMOAggregates(cdCvm, year ? { year: Number(year) } : undefined),
  });

  const movsQuery = useQuery({
    queryKey: ["cvm", "vlmo", "by-company", cdCvm, { page, year, includeSnapshot }],
    queryFn: () =>
      listVLMOByCompany(cdCvm, {
        page,
        page_size: 25,
        year: year ? Number(year) : undefined,
        is_position_snapshot: includeSnapshot ? undefined : false,
      }),
  });

  const aggregates = aggregatesQuery.data;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardTitle>{aggregates?.company_name ?? `Empresa ${cdCvm}`}</CardTitle>
              <CardDescription className="mt-1">
                VLMO insider trading · cd_cvm {cdCvm}
              </CardDescription>
            </div>

            <Link
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              href={`/cvm/companies/detail?cd_cvm=${cdCvm}`}
            >
              Ir para cadastro da empresa
            </Link>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <CardTitle>Net flow mensal por cargo</CardTitle>
              <CardDescription>
                Saldo de quantidade (creditos − debitos) somado por mes e cargo. Saldos iniciais nao entram aqui.
              </CardDescription>
            </div>

            <div className="w-full max-w-[180px] space-y-1.5">
              <Label htmlFor="year">Ano</Label>
              <Select
                id="year"
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
          </div>
        </CardHeader>
        <CardContent>
          <VLMONetFlowChart rows={aggregates?.rows ?? []} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <CardTitle>Movimentacoes detalhadas</CardTitle>
              <CardDescription>
                Trades reais por padrao. Toggle para incluir saldos iniciais.
              </CardDescription>
            </div>

            <label className="flex items-center gap-3 rounded-2xl border border-border/80 bg-background/80 px-4 py-2.5 text-sm">
              <input
                type="checkbox"
                className="size-4"
                checked={includeSnapshot}
                onChange={(event) => {
                  setPage(1);
                  setIncludeSnapshot(event.target.checked);
                }}
              />
              Incluir saldos iniciais
            </label>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={movColumns}
            data={movsQuery.data?.movimentacoes ?? []}
            loading={movsQuery.isLoading}
            getRowKey={(row) => row.id}
            emptyMessage="Sem movimentacoes para a empresa nos filtros aplicados."
          />
        </CardContent>
      </Card>
    </div>
  );
}
