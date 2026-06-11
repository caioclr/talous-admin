"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate, formatDecimal } from "@/lib/formatters";
import {
  getITRDFPAccountLines,
  getITRDFPReconciliation,
  listITRDFPFilings,
} from "@/lib/services/admin/cvm-itr-dfp";
import type { AccountLineResponse, FilingSummary, ReconciliationField } from "@/lib/services/admin/types";

const accountColumns: DataTableColumn<AccountLineResponse>[] = [
  {
    key: "conta",
    header: "Conta",
    render: (row) => (
      <div className="space-y-1">
        <p className="font-mono text-xs text-muted-foreground">{row.cd_conta}</p>
        <p className="text-sm text-foreground">{row.ds_conta}</p>
      </div>
    ),
  },
  {
    key: "valor",
    header: "Valor",
    render: (row) => <span className="font-mono text-sm">{formatDecimal(row.vl_conta)}</span>,
  },
  {
    key: "escala",
    header: "Escala",
    render: (row) => row.escala_moeda,
  },
  {
    key: "versao",
    header: "Versao",
    render: (row) => row.version,
  },
];

const reconciliationColumns: DataTableColumn<ReconciliationField>[] = [
  {
    key: "field",
    header: "Campo",
    render: (row) => row.field,
  },
  {
    key: "sources",
    header: "Fontes",
    render: (row) => (
      <div className="space-y-1">
        {row.sources.map((source) => (
          <div key={source.source} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">{source.source}</span>
            <span className="font-mono text-foreground">{source.value ?? "—"}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    key: "divergence",
    header: "Divergencia max.",
    render: (row) =>
      row.max_divergence_pct !== null && row.max_divergence_pct !== undefined
        ? `${(row.max_divergence_pct * 100).toFixed(2)}%`
        : "—",
  },
];

export default function ITRDFPCompanyExplorerPage() {
  const params = useParams<{ cdCvm: string }>();
  const [selectedKey, setSelectedKey] = useState("");
  const [selectedStatement, setSelectedStatement] = useState("");
  const [periodType, setPeriodType] = useState("quarterly");

  const filingsQuery = useQuery({
    queryKey: ["cvm", "itr-dfp", "company-filings", params.cdCvm],
    queryFn: () =>
      listITRDFPFilings({
        cd_cvm: Number(params.cdCvm),
        limit: 200,
      }),
  });

  const filingOptions = useMemo(() => {
    return (filingsQuery.data ?? []).map((filing) => ({
      key: `${filing.doc_type}|${filing.reference_date}|${filing.grupo_dfr}|${filing.version}`,
      filing,
    }));
  }, [filingsQuery.data]);

  const effectiveSelectedKey =
    filingOptions.some((item) => item.key === selectedKey) ? selectedKey : (filingOptions[0]?.key ?? "");

  const selectedFiling = filingOptions.find((item) => item.key === effectiveSelectedKey)?.filing;

  const effectiveSelectedStatement =
    selectedFiling?.statement_types.includes(selectedStatement)
      ? selectedStatement
      : (selectedFiling?.statement_types[0] ?? "");

  const accountLinesQuery = useQuery({
    queryKey: [
      "cvm",
      "itr-dfp",
      "account-lines",
      params.cdCvm,
      effectiveSelectedStatement,
      selectedFiling?.reference_date,
      selectedFiling?.grupo_dfr,
    ],
    queryFn: () =>
      getITRDFPAccountLines(params.cdCvm, {
        statement_type: effectiveSelectedStatement,
        reference_date: selectedFiling?.reference_date ?? "",
        grupo_dfr: selectedFiling?.grupo_dfr ?? "consolidado",
        ordem_exerc: "ULTIMO",
      }),
    enabled: Boolean(selectedFiling && effectiveSelectedStatement),
  });

  const reconciliationQuery = useQuery({
    queryKey: [
      "cvm",
      "itr-dfp",
      "reconciliation",
      params.cdCvm,
      selectedFiling?.reference_date,
      periodType,
    ],
    queryFn: () =>
      getITRDFPReconciliation(params.cdCvm, selectedFiling?.reference_date ?? "", {
        period_type: periodType,
      }),
    enabled: Boolean(selectedFiling?.reference_date),
  });

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardTitle>Explorer ITR/DFP · empresa {params.cdCvm}</CardTitle>
              <CardDescription>
                Selecione um filing e navegue entre linhas contábeis e reconciliação entre fontes.
              </CardDescription>
            </div>

            {selectedFiling ? (
              <div className="flex flex-wrap gap-2">
                <Badge>{selectedFiling.doc_type.toUpperCase()}</Badge>
                <Badge variant="secondary">{selectedFiling.grupo_dfr}</Badge>
                <Badge variant="secondary">{formatDate(selectedFiling.reference_date)}</Badge>
              </div>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-foreground" htmlFor="filing-selector">
              Filing
            </label>
            <Select
              id="filing-selector"
              value={effectiveSelectedKey}
              onChange={(event) => setSelectedKey(event.target.value)}
            >
              <option value="">Selecione um filing</option>
              {filingOptions.map(({ key, filing }) => (
                <option key={key} value={key}>
                  {filing.doc_type.toUpperCase()} · {formatDate(filing.reference_date)} · {filing.grupo_dfr} · v{filing.version}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="statement-selector">
              Demonstrativo
            </label>
            <Select
              id="statement-selector"
              value={effectiveSelectedStatement}
              onChange={(event) => setSelectedStatement(event.target.value)}
              disabled={!selectedFiling}
            >
              <option value="">Selecione</option>
              {(selectedFiling?.statement_types ?? []).map((statement) => (
                <option key={statement} value={statement}>
                  {statement}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="lines">
        <TabsList>
          <TabsTrigger value="lines">Linhas contabeis</TabsTrigger>
          <TabsTrigger value="reconciliation">Reconciliacao</TabsTrigger>
          <TabsTrigger value="filings">Filings da empresa</TabsTrigger>
        </TabsList>

        <TabsContent value="lines">
          <Card>
            <CardHeader>
              <CardTitle>Árvore contábil</CardTitle>
              <CardDescription>
                O backend devolve os itens da versão mais recente para o filtro selecionado.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={accountColumns}
                data={accountLinesQuery.data?.items ?? []}
                loading={accountLinesQuery.isLoading}
                getRowKey={(row) => row.id}
                emptyMessage="Selecione um filing e um demonstrativo para carregar as linhas contábeis."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reconciliation">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <CardTitle>Reconciliação entre fontes</CardTitle>
                  <CardDescription>
                    Compara `cvm_official`, `cvm_document` e `api_provider` para o período selecionado.
                  </CardDescription>
                </div>

                <div className="w-full max-w-[220px] space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="period-type">
                    Period type
                  </label>
                  <Select
                    id="period-type"
                    value={periodType}
                    onChange={(event) => setPeriodType(event.target.value)}
                  >
                    <option value="quarterly">quarterly</option>
                    <option value="annual">annual</option>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={reconciliationColumns}
                data={reconciliationQuery.data?.fields ?? []}
                loading={reconciliationQuery.isLoading}
                getRowKey={(row) => row.field}
                emptyMessage="Selecione um filing para carregar a reconciliação."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="filings">
          <DataTable
            columns={[
              {
                key: "doc",
                header: "Doc",
                render: (row: FilingSummary) => row.doc_type.toUpperCase(),
              },
              {
                key: "ref",
                header: "Referencia",
                render: (row: FilingSummary) => formatDate(row.reference_date),
              },
              {
                key: "grupo",
                header: "Grupo",
                render: (row: FilingSummary) => row.grupo_dfr,
              },
              {
                key: "statements",
                header: "Statements",
                render: (row: FilingSummary) => row.statement_types.join(", "),
              },
            ]}
            data={filingsQuery.data ?? []}
            loading={filingsQuery.isLoading}
            getRowKey={(row, index) => `${row.cd_cvm}-${row.reference_date}-${row.version}-${index}`}
            emptyMessage="Nenhum filing encontrado para esta empresa."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
