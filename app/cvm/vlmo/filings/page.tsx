"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import {
  ValidationBadge,
  ValidationStatusFilter,
  asValidationStatus,
} from "@/components/validation";
import { formatDate, formatDateTime } from "@/lib/formatters";
import { listVLMOFilings } from "@/lib/services/admin/cvm-vlmo";
import type { VLMOFilingSummary } from "@/lib/services/admin/types";

const CURRENT_YEAR = new Date().getUTCFullYear();
const YEAR_OPTIONS = Array.from({ length: 8 }, (_, i) => CURRENT_YEAR - i);

const columns: DataTableColumn<VLMOFilingSummary>[] = [
  {
    key: "ref",
    header: "Referencia",
    render: (row) => (
      <div className="space-y-1">
        <p className="text-sm">{formatDate(row.data_referencia)}</p>
        <p className="text-xs text-muted-foreground">v{row.versao}</p>
      </div>
    ),
  },
  {
    key: "empresa",
    header: "Empresa",
    render: (row) => (
      <div className="space-y-1">
        <p className="font-medium text-foreground">{row.nome_companhia}</p>
        <p className="text-xs text-muted-foreground">
          CNPJ {row.cnpj_companhia}
          {row.cd_cvm ? ` · cd_cvm ${row.cd_cvm}` : ""}
        </p>
      </div>
    ),
  },
  {
    key: "protocolo",
    header: "Protocolo",
    render: (row) => <span className="font-mono text-xs">{row.protocolo_entrega}</span>,
  },
  {
    key: "categoria",
    header: "Categoria",
    render: (row) =>
      row.categoria ? <Badge variant="secondary">{row.categoria}</Badge> : "—",
  },
  {
    key: "entrega",
    header: "Entrega",
    render: (row) => formatDate(row.data_entrega),
  },
  {
    key: "status",
    header: "Status",
    // O backend pode ainda nao materializar `validation` na lista — tratamos
    // ausencia como pendente para nao quebrar a tela.
    render: (row) => <ValidationBadge status={row.validation?.status ?? "pending"} />,
  },
  {
    key: "validate",
    header: "Validacao",
    render: (row) => (
      <Link
        className="text-primary underline-offset-4 hover:underline"
        href={`/cvm/vlmo/validate?id=${encodeURIComponent(row.id)}`}
      >
        Abrir
      </Link>
    ),
  },
];

export default function VLMOFilingsPage() {
  const [page, setPage] = useState(1);
  const [cnpj, setCnpj] = useState("");
  const [cdCvm, setCdCvm] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [validationStatus, setValidationStatus] = useState("");

  const filingsQuery = useQuery({
    queryKey: [
      "cvm",
      "vlmo",
      "filings",
      { page, cnpj, cdCvm, yearFilter, validationStatus },
    ],
    queryFn: () =>
      listVLMOFilings({
        page,
        page_size: 25,
        cnpj: cnpj || undefined,
        cd_cvm: cdCvm ? Number(cdCvm) : undefined,
        year: yearFilter ? Number(yearFilter) : undefined,
        validation_status: asValidationStatus(validationStatus),
      }),
  });

  return (
    <div className="flex flex-col gap-4">
      <Card className="metric-tile">
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <CardTitle>Validacao de filings VLMO</CardTitle>
              <CardDescription>
                O filing (header/protocolo) e a unidade de validacao do VLMO — o selo vive aqui, nao
                nas movimentacoes. Para auditar as movimentacoes brutas, use a{" "}
                <Link className="text-primary underline-offset-4 hover:underline" href="/cvm/vlmo">
                  tela de movimentacoes
                </Link>
                .
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Recorte por empresa, ano e status de validacao.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
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
            <Label htmlFor="filter-year">Ano</Label>
            <Select
              id="filter-year"
              value={yearFilter}
              onChange={(event) => {
                setPage(1);
                setYearFilter(event.target.value);
              }}
            >
              <option value="">todos</option>
              {YEAR_OPTIONS.map((year) => (
                <option key={year} value={year}>
                  {year}
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
        data={filingsQuery.data?.items ?? []}
        loading={filingsQuery.isLoading}
        pagination={filingsQuery.data?.pagination}
        onPageChange={setPage}
        getRowKey={(row) => row.id}
        emptyMessage="Nenhum filing VLMO encontrado para os filtros informados."
      />

      <p className="text-xs text-muted-foreground">
        Capturado mais recente refletido em {formatDateTime(filingsQuery.data?.items?.[0]?.captured_at)}.
      </p>
    </div>
  );
}
