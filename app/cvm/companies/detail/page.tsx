"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { PageBreadcrumb } from "@/components/page-breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CompanyTickerControls } from "@/components/cvm/company-ticker-controls";
import { CuratedFieldsPanel } from "@/components/curated/curated-fields-panel";
import { DocumentTextViewer } from "@/components/curated/document-text-viewer";
import { ValidationActionPanel, ValidationBadge } from "@/components/validation";
import { formatDate, formatDateTime, formatDecimal, formatList } from "@/lib/formatters";
import { tickerSymbols } from "@/lib/tickers";
import {
  getAdminCompany,
  getCompanyChanges,
  getCompanyHistory,
} from "@/lib/services/admin/cvm-registry";
import {
  getRelease,
  listIPEByCompany,
  listReleasesByCompany,
} from "@/lib/services/admin/cvm-ipe";
import { listITRDFPFilingsWithValidation } from "@/lib/services/admin/cvm-itr-dfp";
import {
  getDividendPolicy,
  listDividendPolicyByCompany,
  listFREByCompany,
} from "@/lib/services/admin/cvm-fre";
import { getFCAByCompany } from "@/lib/services/admin/cvm-fca";
import { listBuybackProgramsByCompany } from "@/lib/services/admin/cvm-buybacks";
import { listVLMOByCompany } from "@/lib/services/admin/cvm-vlmo";
import { listCapitalCompositionByCompany } from "@/lib/services/admin/cvm-capital-composition";
import { getICBGCByCompany } from "@/lib/services/admin/cvm-icbgc";
import type {
  AdminPagedResponse,
  BuybackProgramSummary,
  CapitalCompositionSnapshotSummary,
  CVMSnapshotSummary,
  FCADocumentoSummary,
  FilingSummaryWithValidation,
  FREDividendPolicySummary,
  FREFilingSummary,
  GovernanceReportSummary,
  IPEDisclosureSummary,
  IPEReleaseSummary,
  RegistryChangeEventResponse,
  VLMOMovimentacaoSummary,
} from "@/lib/services/admin/types";

// Quanto carregar por aba lazy. As listas by-company nao paginam no envelope; a
// janela serve para nao puxar centenas de linhas de uma vez.
const BY_COMPANY_PAGE_SIZE = 50;

type TopTab = "info" | "tickers" | "history" | "changes" | "moderar" | "verificar";
type ModerarTab = "ipe" | "itr-dfp" | "fre" | "fca";
type VerificarTab = "buybacks" | "vlmo" | "capital" | "icbgc";

const historyColumns: DataTableColumn<CVMSnapshotSummary>[] = [
  {
    key: "captured_at",
    header: "Capturado em",
    render: (row) => formatDateTime(row.captured_at),
  },
  {
    key: "situacao",
    header: "Situacao",
    render: (row) => row.situacao,
  },
  {
    key: "mercado",
    header: "Mercado",
    render: (row) => row.tipo_mercado,
  },
  {
    key: "link",
    header: "Snapshot",
    render: (row) => (
      <Link className="text-primary underline-offset-4 hover:underline" href={`/cvm/snapshots/detail?id=${row.id}`}>
        Abrir detalhe
      </Link>
    ),
  },
];

const changesColumns: DataTableColumn<RegistryChangeEventResponse>[] = [
  {
    key: "captured_at",
    header: "Capturado em",
    render: (row) => formatDateTime(row.captured_at),
  },
  {
    key: "field",
    header: "Campo",
    render: (row) => row.field,
  },
  {
    key: "old",
    header: "Valor anterior",
    render: (row) => String(row.old ?? "—"),
  },
  {
    key: "new",
    header: "Novo valor",
    render: (row) => String(row.new ?? "—"),
  },
];

export default function CompanyDetailPage() {
  const searchParams = useSearchParams();
  const cdCvm = searchParams.get("cd_cvm") ?? "";
  const hasCdCvm = Boolean(cdCvm);

  // Controle de aba (lazy load): so a query da aba ativa e disparada.
  const [tab, setTab] = useState<TopTab>("info");
  const [moderarSub, setModerarSub] = useState<ModerarTab>("ipe");
  /**
   * Trecho trazido de um release para o painel de curadoria, com o documento de
   * origem. E o que liga o documento ao campo sem copiar e colar entre telas — e
   * o backend recusa origem "release" sem o documento, porque essa proveniencia
   * e publicada ao usuario.
   */
  const [curadoria, setCuradoria] = useState<{ releaseId: string; trecho: string } | null>(
    null,
  );
  const [verificarSub, setVerificarSub] = useState<VerificarTab>("buybacks");

  const companyQuery = useQuery({
    queryKey: ["cvm", "company", cdCvm],
    queryFn: () => getAdminCompany(cdCvm),
    enabled: hasCdCvm,
  });

  const historyQuery = useQuery({
    queryKey: ["cvm", "company", cdCvm, "history"],
    queryFn: () => getCompanyHistory(cdCvm),
    enabled: hasCdCvm && tab === "history",
  });

  const changesQuery = useQuery({
    queryKey: ["cvm", "company", cdCvm, "changes"],
    queryFn: () => getCompanyChanges(cdCvm),
    enabled: hasCdCvm && tab === "changes",
  });

  // ---- Moderar (lazy por sub-aba) ----
  const ipeQuery = useQuery({
    queryKey: ["cvm", "company", cdCvm, "ipe"],
    queryFn: () => listIPEByCompany(cdCvm, { page: 1, page_size: BY_COMPANY_PAGE_SIZE }),
    enabled: hasCdCvm && tab === "moderar" && moderarSub === "ipe",
  });

  // S16: releases de resultados extraidos (texto qualitativo). Lazy junto da
  // sub-aba IPE; o full_text e buscado item a item ao expandir (ver
  // ReleasesSection / ReleaseRow).
  const releasesQuery = useQuery({
    queryKey: ["cvm", "company", cdCvm, "ipe-releases"],
    queryFn: () => listReleasesByCompany(cdCvm, { page: 1, page_size: BY_COMPANY_PAGE_SIZE }),
    enabled: hasCdCvm && tab === "moderar" && moderarSub === "ipe",
  });

  const itrDfpQuery = useQuery({
    queryKey: ["cvm", "company", cdCvm, "itr-dfp"],
    queryFn: () =>
      listITRDFPFilingsWithValidation({
        cd_cvm: Number(cdCvm),
        page: 1,
        page_size: BY_COMPANY_PAGE_SIZE,
      }),
    enabled: hasCdCvm && tab === "moderar" && moderarSub === "itr-dfp",
  });

  const freQuery = useQuery({
    queryKey: ["cvm", "company", cdCvm, "fre"],
    queryFn: () => listFREByCompany(cdCvm, { page: 1, page_size: BY_COMPANY_PAGE_SIZE }),
    enabled: hasCdCvm && tab === "moderar" && moderarSub === "fre",
  });

  // S18: politica de dividendos extraida do FRE (texto qualitativo). Lazy junto
  // da sub-aba FRE; o policy_text e buscado item a item ao expandir (ver
  // DividendPolicySection / DividendPolicyRow).
  const dividendPolicyQuery = useQuery({
    queryKey: ["cvm", "company", cdCvm, "fre-dividend-policy"],
    queryFn: () =>
      listDividendPolicyByCompany(cdCvm, { page: 1, page_size: BY_COMPANY_PAGE_SIZE }),
    enabled: hasCdCvm && tab === "moderar" && moderarSub === "fre",
  });

  const fcaQuery = useQuery({
    queryKey: ["cvm", "company", cdCvm, "fca"],
    queryFn: () => getFCAByCompany(cdCvm),
    enabled: hasCdCvm && tab === "moderar" && moderarSub === "fca",
  });

  // ---- Verificar (lazy por sub-aba) ----
  const buybacksQuery = useQuery({
    queryKey: ["cvm", "company", cdCvm, "buybacks"],
    queryFn: () =>
      listBuybackProgramsByCompany(cdCvm, { page: 1, page_size: BY_COMPANY_PAGE_SIZE }),
    enabled: hasCdCvm && tab === "verificar" && verificarSub === "buybacks",
  });

  const vlmoQuery = useQuery({
    queryKey: ["cvm", "company", cdCvm, "vlmo"],
    queryFn: () => listVLMOByCompany(cdCvm, { page: 1, page_size: BY_COMPANY_PAGE_SIZE }),
    enabled: hasCdCvm && tab === "verificar" && verificarSub === "vlmo",
  });

  const capitalQuery = useQuery({
    queryKey: ["cvm", "company", cdCvm, "capital"],
    queryFn: () =>
      listCapitalCompositionByCompany(cdCvm, { page: 1, page_size: BY_COMPANY_PAGE_SIZE }),
    enabled: hasCdCvm && tab === "verificar" && verificarSub === "capital",
  });

  const icbgcQuery = useQuery({
    queryKey: ["cvm", "company", cdCvm, "icbgc"],
    queryFn: () => getICBGCByCompany(cdCvm),
    enabled: hasCdCvm && tab === "verificar" && verificarSub === "icbgc",
  });

  // ---- Colunas que dependem do cdCvm (links/refs) ----
  const ipeColumns: DataTableColumn<IPEDisclosureSummary>[] = [
    { key: "delivery", header: "Entrega", render: (row) => formatDate(row.data_entrega) },
    { key: "categoria", header: "Categoria", render: (row) => row.categoria },
    {
      key: "assunto",
      header: "Assunto",
      render: (row) => (
        <div className="max-w-[280px] space-y-1">
          <p className="line-clamp-2">{row.assunto}</p>
          <p className="text-xs text-muted-foreground">{row.signal_classification ?? "sem sinal"}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <ValidationBadge status={row.validation?.status ?? "pending"} />,
    },
    {
      key: "acao",
      header: "Acao",
      render: (row) => (
        <ValidationActionPanel
          reportType="ipe"
          reportRef={String(row.id)}
          validation={row.validation}
          invalidateKeys={[["cvm", "company", cdCvm, "ipe"]]}
        />
      ),
    },
  ];

  const itrDfpColumns: DataTableColumn<FilingSummaryWithValidation>[] = [
    { key: "doc", header: "Tipo", render: (row) => row.doc_type.toUpperCase() },
    { key: "reference_date", header: "Referencia", render: (row) => formatDate(row.reference_date) },
    { key: "grupo", header: "Grupo DFR", render: (row) => row.grupo_dfr },
    { key: "version", header: "Versao", render: (row) => `v${row.version}` },
    {
      key: "statements",
      header: "Statements",
      render: (row) => row.statement_types.join(", "),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <ValidationBadge status={row.validation.status} />,
    },
    {
      key: "acao",
      header: "Acao",
      render: (row) => (
        <Link
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          href={
            `/cvm/itr-dfp/validate?cd_cvm=${row.cd_cvm}` +
            `&doc_type=${encodeURIComponent(row.doc_type)}` +
            `&reference_date=${encodeURIComponent(row.reference_date)}` +
            `&grupo_dfr=${encodeURIComponent(row.grupo_dfr)}` +
            `&version=${row.version}`
          }
        >
          Validar
        </Link>
      ),
    },
  ];

  const freColumns: DataTableColumn<FREFilingSummary>[] = [
    { key: "reference", header: "Referencia", render: (row) => formatDate(row.data_referencia) },
    { key: "version", header: "Versao", render: (row) => `v${row.versao}` },
    {
      key: "categoria",
      header: "Categoria",
      render: (row) => row.categoria_documento ?? "—",
    },
    {
      key: "recebimento",
      header: "Recebimento",
      render: (row) => formatDate(row.data_recebimento),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <ValidationBadge status={row.validation?.status ?? "pending"} />,
    },
    {
      key: "acao",
      header: "Acao",
      render: (row) => (
        <ValidationActionPanel
          reportType="fre"
          reportRef={String(row.id_documento)}
          validation={row.validation}
          invalidateKeys={[["cvm", "company", cdCvm, "fre"]]}
        />
      ),
    },
  ];

  const fcaColumns: DataTableColumn<FCADocumentoSummary>[] = [
    { key: "reference", header: "Referencia", render: (row) => formatDate(row.data_referencia) },
    { key: "version", header: "Versao", render: (row) => `v${row.versao}` },
    {
      key: "categoria",
      header: "Categoria",
      render: (row) =>
        row.categoria_documento ? (
          <Badge variant="secondary">{row.categoria_documento}</Badge>
        ) : (
          "—"
        ),
    },
    {
      key: "recebimento",
      header: "Recebimento",
      render: (row) => formatDate(row.data_recebimento),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <ValidationBadge status={row.validation?.status ?? "pending"} />,
    },
    {
      key: "acao",
      header: "Acao",
      render: (row) => (
        <ValidationActionPanel
          reportType="fca"
          reportRef={String(row.id_documento)}
          validation={row.validation}
          invalidateKeys={[["cvm", "company", cdCvm, "fca"]]}
        />
      ),
    },
  ];

  const buybackColumns: DataTableColumn<BuybackProgramSummary>[] = [
    { key: "deliberacao", header: "Deliberacao", render: (row) => formatDate(row.data_deliberacao) },
    { key: "situacao", header: "Situacao", render: (row) => row.situacao ?? "—" },
    { key: "tipo", header: "Tipo", render: (row) => row.tipo_operacao ?? "—" },
    { key: "finalidade", header: "Finalidade", render: (row) => row.finalidade_compra ?? "—" },
    {
      key: "status",
      header: "Status",
      render: (row) => <ValidationBadge status={row.validation?.status ?? "pending"} />,
    },
    {
      key: "detail",
      header: "Programa",
      render: (row) => (
        <Link
          className="text-primary underline-offset-4 hover:underline"
          href={`/cvm/buybacks/programs/detail?id_programa=${encodeURIComponent(row.id_programa)}`}
        >
          Abrir
        </Link>
      ),
    },
  ];

  const vlmoColumns: DataTableColumn<VLMOMovimentacaoSummary>[] = [
    { key: "data", header: "Data", render: (row) => formatDate(row.data_movimentacao) },
    { key: "insider", header: "Insider", render: (row) => row.empresa ?? row.tipo_empresa ?? "—" },
    { key: "tipo", header: "Tipo", render: (row) => row.tipo_movimentacao ?? "—" },
    {
      key: "quantidade",
      header: "Quantidade",
      render: (row) => (
        <span className="font-mono text-xs">{formatDecimal(row.quantidade, { maximumFractionDigits: 0 })}</span>
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

  const capitalColumns: DataTableColumn<CapitalCompositionSnapshotSummary>[] = [
    { key: "reference", header: "Referencia", render: (row) => formatDate(row.reference_date) },
    { key: "source", header: "Fonte", render: (row) => row.source.toUpperCase() },
    { key: "period", header: "Periodo", render: (row) => row.period_type },
    {
      key: "total",
      header: "Total integralizado",
      render: (row) => (
        <span className="font-mono text-xs">
          {formatDecimal(row.qt_total_integralized, { maximumFractionDigits: 0 })}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <ValidationBadge status={row.validation?.status ?? "pending"} />,
    },
    {
      key: "detail",
      header: "Snapshot",
      render: (row) => (
        <Link
          className="text-primary underline-offset-4 hover:underline"
          href={`/cvm/capital-composition/snapshots/detail?id=${encodeURIComponent(row.id)}`}
        >
          Abrir
        </Link>
      ),
    },
  ];

  const icbgcColumns: DataTableColumn<GovernanceReportSummary>[] = [
    { key: "reference", header: "Referencia", render: (row) => formatDate(row.data_referencia) },
    { key: "version", header: "Versao", render: (row) => `v${row.versao}` },
    { key: "entrega", header: "Entrega", render: (row) => formatDate(row.data_entrega) },
    {
      key: "status",
      header: "Status",
      render: (row) => <ValidationBadge status={row.validation?.status ?? "pending"} />,
    },
    {
      key: "detail",
      header: "Informe",
      render: (row) => (
        <Link
          className="text-primary underline-offset-4 hover:underline"
          href={`/cvm/icbgc/reports/detail?id_documento=${encodeURIComponent(String(row.id_documento))}`}
        >
          Abrir
        </Link>
      ),
    },
  ];

  const company = companyQuery.data;

  if (!hasCdCvm) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-sm text-muted-foreground">
            Informe um `cd_cvm` na query string para abrir o detalhe da empresa.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageBreadcrumb
        backHref="/cvm/companies"
        trail={[
          { label: "Empresas", href: "/cvm/companies" },
          { label: String(company?.primary_ticker ?? cdCvm) },
        ]}
        title={company?.name ?? `Empresa ${cdCvm}`}
        subtitle={
          company
            ? `${formatList(tickerSymbols(company.tickers))}${
                company.cvm_setor_atividade ? ` · ${company.cvm_setor_atividade}` : ""
              }`
            : "Carregando tickers..."
        }
        actions={
          <>
            <Badge>{company?.cvm_situation ?? "—"}</Badge>
            <Badge variant={company?.is_active ? "success" : "warning"}>
              {company?.is_active ? "Ativa" : "Inativa"}
            </Badge>
            <Badge variant="secondary">Codigo CVM: {company?.cd_cvm ?? cdCvm}</Badge>
          </>
        }
      />

      <Tabs value={tab} onValueChange={(value) => setTab(value as TopTab)}>
        <TabsList>
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="tickers">Tickers</TabsTrigger>
          <TabsTrigger value="history">Historico</TabsTrigger>
          <TabsTrigger value="changes">Mudancas</TabsTrigger>
          <TabsTrigger value="moderar">Moderar</TabsTrigger>
          <TabsTrigger value="verificar">Verificar</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>Estado atual</CardTitle>
              <CardDescription>
                Dados de `GET /admin/cvm/companies/{cdCvm}`.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <DetailItem label="CNPJ" value={company?.cnpj} />
              <DetailItem label="Setor interno" value={company?.sector_slug} />
              <DetailItem label="Setor CVM" value={company?.cvm_setor_atividade} />
              <DetailItem label="Categoria" value={company?.cvm_category} />
              <DetailItem label="Mercado" value={company?.cvm_market_type} />
              <DetailItem label="Controlador" value={company?.cvm_controlling_shareholder} />
              <DetailItem label="Registro CVM" value={formatDate(company?.cvm_registration_date)} />
              <DetailItem label="Constituicao" value={formatDate(company?.cvm_constitution_date)} />
              <DetailItem label="Inicio da situacao" value={formatDate(company?.cvm_situation_started_at)} />
              <DetailItem label="Cancelamento" value={formatDate(company?.cvm_cancellation_date)} />
              <DetailItem label="Motivo do cancelamento" value={company?.cvm_cancellation_reason} />
              <DetailItem label="Ultimo sync" value={formatDateTime(company?.cvm_last_synced_at)} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tickers">
          <Card>
            <CardHeader>
              <CardTitle>Tickers da empresa</CardTitle>
              <CardDescription>
                Estado de cada ticker e delisting manual. Desabilitar marca o ticker como
                deslistado (via <span className="font-mono">PATCH</span> em{" "}
                <span className="font-mono">/admin/cvm/companies/{cdCvm}/tickers</span>) e o
                esconde do Rastreador do app. A acao e reversivel.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {company ? (
                <CompanyTickerControls
                  cdCvm={cdCvm}
                  tickers={company.tickers}
                  primaryTicker={company.primary_ticker}
                />
              ) : (
                <p className="text-sm text-muted-foreground">Carregando tickers...</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <TabSection query={historyQuery}>
            <DataTable
              columns={historyColumns}
              data={historyQuery.data ?? []}
              loading={historyQuery.isLoading}
              getRowKey={(row) => row.id}
              emptyMessage="Nao ha historico suficiente para esta empresa."
            />
          </TabSection>
        </TabsContent>

        <TabsContent value="changes">
          <TabSection query={changesQuery}>
            <DataTable
              columns={changesColumns}
              data={changesQuery.data ?? []}
              loading={changesQuery.isLoading}
              getRowKey={(row, index) => `${row.field}-${index}`}
              emptyMessage="Nenhuma mudanca detectada entre snapshots consecutivos."
            />
          </TabSection>
        </TabsContent>

        <TabsContent value="moderar">
          <Card>
            <CardHeader>
              <CardTitle>Moderar documentos</CardTitle>
              <CardDescription>
                Conferencia por amostragem dos documentos da empresa. Marcar como valido e metadado
                interno de QA — nao altera o dado nem o app do usuario final.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={moderarSub} onValueChange={(value) => setModerarSub(value as ModerarTab)}>
                <TabsList>
                  <TabsTrigger value="ipe">IPE</TabsTrigger>
                  <TabsTrigger value="itr-dfp">ITR/DFP</TabsTrigger>
                  <TabsTrigger value="fre">FRE</TabsTrigger>
                  <TabsTrigger value="fca">FCA</TabsTrigger>
                </TabsList>

                <TabsContent value="ipe" className="space-y-8">
                  <TabSection query={ipeQuery}>
                    <DataTable
                      columns={ipeColumns}
                      data={ipeQuery.data?.items ?? []}
                      loading={ipeQuery.isLoading}
                      getRowKey={(row) => row.id}
                      emptyMessage="Nenhum disclosure IPE para esta empresa."
                    />
                  </TabSection>

                  <ReleasesSection
                    query={releasesQuery}
                    onCurate={(releaseId, trecho) => setCuradoria({ releaseId, trecho })}
                  />

                  {/* Painel de curadoria: aparece quando o operador leva um
                      trecho do release para ca. Salvar cria RASCUNHO — publicar e
                      um segundo ato, porque `published_at` nulo e o default e
                      nada chega ao usuario sem alguem decidir. */}
                  {company?.id && (
                    <section className="space-y-3 pt-2" aria-label="Conteudo curado">
                      <div className="space-y-1">
                        <h3 className="text-sm font-semibold text-foreground">
                          Conteudo curado
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          O que for publicado aqui aparece nas secoes Visao Geral e
                          Negocio da empresa, com a proveniencia do documento.
                        </p>
                      </div>
                      <CuratedFieldsPanel
                        companyId={company.id}
                        sourceReleaseId={curadoria?.releaseId ?? null}
                        initialText={curadoria?.trecho}
                      />
                    </section>
                  )}
                </TabsContent>

                <TabsContent value="itr-dfp">
                  <TabSection query={itrDfpQuery}>
                    <DataTable
                      columns={itrDfpColumns}
                      data={itrDfpQuery.data?.items ?? []}
                      loading={itrDfpQuery.isLoading}
                      getRowKey={(row, index) =>
                        `${row.doc_type}-${row.reference_date}-${row.version}-${index}`
                      }
                      emptyMessage="Nenhum filing ITR/DFP para esta empresa."
                    />
                  </TabSection>
                </TabsContent>

                <TabsContent value="fre" className="space-y-8">
                  <TabSection query={freQuery}>
                    <DataTable
                      columns={freColumns}
                      data={freQuery.data?.filings ?? []}
                      loading={freQuery.isLoading}
                      getRowKey={(row) => row.id}
                      emptyMessage="Nenhum FRE para esta empresa."
                    />
                  </TabSection>

                  <DividendPolicySection query={dividendPolicyQuery} />
                </TabsContent>

                <TabsContent value="fca">
                  <TabSection query={fcaQuery}>
                    <DataTable
                      columns={fcaColumns}
                      data={fcaQuery.data?.documentos ?? []}
                      loading={fcaQuery.isLoading}
                      getRowKey={(row) => row.id}
                      emptyMessage="Nenhum documento FCA para esta empresa."
                    />
                  </TabSection>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verificar">
          <Card>
            <CardHeader>
              <CardTitle>Verificar documentos</CardTitle>
              <CardDescription>
                Leitura dos demais documentos CVM da empresa, com selo de validacao por item. Abra o
                documento para inspecionar e validar quando aplicavel.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={verificarSub} onValueChange={(value) => setVerificarSub(value as VerificarTab)}>
                <TabsList>
                  <TabsTrigger value="buybacks">Recompras</TabsTrigger>
                  <TabsTrigger value="vlmo">VLMO</TabsTrigger>
                  <TabsTrigger value="capital">Capital</TabsTrigger>
                  <TabsTrigger value="icbgc">ICBGC</TabsTrigger>
                </TabsList>

                <TabsContent value="buybacks">
                  <TabSection query={buybacksQuery}>
                    <DataTable
                      columns={buybackColumns}
                      data={buybacksQuery.data?.programs ?? []}
                      loading={buybacksQuery.isLoading}
                      getRowKey={(row) => row.id}
                      emptyMessage="Nenhum programa de recompra para esta empresa."
                    />
                  </TabSection>
                </TabsContent>

                <TabsContent value="vlmo">
                  <div className="flex flex-col gap-3">
                    <p className="text-xs text-muted-foreground">
                      O selo de validacao do VLMO vive no <em>filing</em> (protocolo), nao na
                      movimentacao.{" "}
                      <Link
                        href="/cvm/vlmo/filings"
                        className="font-medium text-primary underline-offset-4 hover:underline"
                      >
                        Abrir filings VLMO
                      </Link>
                      .
                    </p>
                    <TabSection query={vlmoQuery}>
                      <DataTable
                        columns={vlmoColumns}
                        data={vlmoQuery.data?.movimentacoes ?? []}
                        loading={vlmoQuery.isLoading}
                        getRowKey={(row) => row.id}
                        emptyMessage="Nenhuma movimentacao VLMO para esta empresa."
                      />
                    </TabSection>
                  </div>
                </TabsContent>

                <TabsContent value="capital">
                  <TabSection query={capitalQuery}>
                    <DataTable
                      columns={capitalColumns}
                      data={capitalQuery.data?.snapshots ?? []}
                      loading={capitalQuery.isLoading}
                      getRowKey={(row) => row.id}
                      emptyMessage="Nenhum snapshot de composicao de capital para esta empresa."
                    />
                  </TabSection>
                </TabsContent>

                <TabsContent value="icbgc">
                  <TabSection query={icbgcQuery}>
                    <DataTable
                      columns={icbgcColumns}
                      data={icbgcQuery.data?.reports ?? []}
                      loading={icbgcQuery.isLoading}
                      getRowKey={(row) => row.id}
                      emptyMessage="Nenhum informe ICBGC para esta empresa."
                    />
                  </TabSection>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Envolve o conteudo de uma aba lazy: mostra o erro (com retry) quando a query
 * falha; caso contrario renderiza os filhos (a propria `DataTable` cuida do
 * loading e do vazio). Mantem os estados loading/erro/vazio por aba.
 */
function TabSection({
  query,
  children,
}: {
  query: UseQueryResult<unknown>;
  children: React.ReactNode;
}) {
  if (query.isError) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-sm text-destructive">
            Falha ao carregar os dados: {(query.error as Error).message}
          </p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => query.refetch()}>
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}

const RELEASE_STATUS_LABEL: Record<IPEReleaseSummary["extraction_status"], string> = {
  ok: "Texto extraido",
  no_text: "Sem texto",
  failed: "Falha na extracao",
};

function ReleaseStatusBadge({ status }: { status: IPEReleaseSummary["extraction_status"] }) {
  const variant = status === "ok" ? "default" : status === "failed" ? "destructive" : "secondary";
  return <Badge variant={variant}>{RELEASE_STATUS_LABEL[status]}</Badge>;
}

/**
 * S16: lista os releases de resultados (IPE) extraidos da empresa. Reutiliza o
 * envelope paginado (le `items`); o `full_text` NAO vem aqui — cada linha o
 * busca LAZY ao expandir (ver `ReleaseRow`). Estados loading/erro/vazio
 * coerentes com as demais sub-abas.
 */
function ReleasesSection({
  query,
  onCurate,
}: {
  query: UseQueryResult<AdminPagedResponse<IPEReleaseSummary>>;
  /** Leva o trecho selecionado ao painel de curadoria, com a proveniencia. */
  onCurate?: (releaseId: string, trecho: string) => void;
}) {
  const releases = query.data?.items ?? [];

  return (
    <section className="space-y-3" aria-label="Releases de resultados">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground">Releases de resultados</h3>
        <p className="text-xs text-muted-foreground">
          Texto extraido dos releases de resultados (IPE). Abra um item para ler o conteudo completo.
        </p>
      </div>

      <TabSection query={query}>
        {query.isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando releases…</p>
        ) : releases.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum release de resultados extraido para esta empresa.
          </p>
        ) : (
          <ul className="space-y-3">
            {releases.map((release) => (
              <ReleaseRow key={release.id} release={release} onCurate={onCurate} />
            ))}
          </ul>
        )}
      </TabSection>
    </section>
  );
}

/**
 * Uma linha de release: cabecalho sempre visivel (titulo/data/status/char_count)
 * e viewer expansivel. O detalhe (`full_text`) so e buscado quando o usuario
 * abre o item (`enabled: open`). Quando `extraction_status != "ok"` mostramos um
 * aviso claro em vez de viewer vazio.
 */
function ReleaseRow({
  release,
  onCurate,
}: {
  release: IPEReleaseSummary;
  onCurate?: (releaseId: string, trecho: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const hasText = release.extraction_status === "ok";

  const detailQuery = useQuery({
    queryKey: ["cvm", "release", release.id],
    queryFn: () => getRelease(release.id),
    enabled: open && hasText,
  });

  return (
    <li className="rounded-2xl border border-border/80 bg-background/70">
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
        <div className="min-w-0 space-y-1">
          <p className="truncate text-sm font-medium text-foreground">{release.title}</p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>Referencia: {formatDate(release.reference_date)}</span>
            <span aria-hidden>·</span>
            <span>{release.char_count.toLocaleString("pt-BR")} caracteres</span>
            <ReleaseStatusBadge status={release.extraction_status} />
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "Fechar" : "Abrir texto"}
        </Button>
      </div>

      {open ? (
        <div className="border-t border-border/60 px-4 py-3">
          {!hasText ? (
            <p className="text-sm text-muted-foreground">
              {release.extraction_status === "failed"
                ? "Falha na extracao do texto deste release."
                : "Sem texto extraivel para este release."}
            </p>
          ) : detailQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando texto…</p>
          ) : detailQuery.isError ? (
            <div className="space-y-3">
              <p className="text-sm text-destructive">
                Falha ao carregar o texto: {(detailQuery.error as Error).message}
              </p>
              <Button variant="outline" size="sm" onClick={() => detailQuery.refetch()}>
                Tentar novamente
              </Button>
            </div>
          ) : detailQuery.data?.full_text ? (
            // O viewer saiu para componente proprio: o mesmo `<pre>` estava
            // duplicado aqui e em `DividendPolicyRow`, cujo docstring admite
            // "espelha o viewer de release". E ele ganhou busca, porque achar
            // "GMV" a olho em ~44 mil caracteres e o gargalo de quem cura.
            <DocumentTextViewer
              text={detailQuery.data.full_text}
              onCopySelection={
                onCurate ? (trecho) => onCurate(release.id, trecho) : undefined
              }
            />
          ) : (
            <p className="text-sm text-muted-foreground">Texto vazio para este release.</p>
          )}
        </div>
      ) : null}
    </li>
  );
}

const DIVIDEND_POLICY_STATUS_LABEL: Record<
  FREDividendPolicySummary["extraction_status"],
  string
> = {
  ok: "Texto extraido",
  not_found: "Nao localizada",
  no_text: "Sem texto",
  failed: "Falha na extracao",
};

function DividendPolicyStatusBadge({
  status,
}: {
  status: FREDividendPolicySummary["extraction_status"];
}) {
  const variant =
    status === "ok" ? "default" : status === "failed" ? "destructive" : "secondary";
  return <Badge variant={variant}>{DIVIDEND_POLICY_STATUS_LABEL[status]}</Badge>;
}

/**
 * S18: lista as politicas de dividendos extraidas do FRE da empresa. Espelha o
 * viewer de release (S16): le `items` do envelope paginado e o `policy_text`
 * NAO vem aqui — cada linha o busca LAZY ao expandir (ver `DividendPolicyRow`).
 * Estados loading/erro/vazio coerentes com as demais sub-abas.
 */
function DividendPolicySection({
  query,
}: {
  query: UseQueryResult<AdminPagedResponse<FREDividendPolicySummary>>;
}) {
  const policies = query.data?.items ?? [];

  return (
    <section className="space-y-3" aria-label="Politica de dividendos">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground">Politica de dividendos</h3>
        <p className="text-xs text-muted-foreground">
          Texto extraido da politica de dividendos (FRE). Abra um item para ler o conteudo completo.
        </p>
      </div>

      <TabSection query={query}>
        {query.isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando politicas de dividendos…</p>
        ) : policies.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma politica de dividendos extraida para esta empresa.
          </p>
        ) : (
          <ul className="space-y-3">
            {policies.map((policy) => (
              <DividendPolicyRow key={policy.id} policy={policy} />
            ))}
          </ul>
        )}
      </TabSection>
    </section>
  );
}

/**
 * Uma linha de politica de dividendos: cabecalho sempre visivel (data de
 * referencia/status/char_count) e viewer expansivel. O detalhe (`policy_text`)
 * so e buscado quando o usuario abre o item (`enabled: open`). Quando
 * `extraction_status != "ok"` mostramos um aviso claro em vez de viewer vazio.
 */
function DividendPolicyRow({ policy }: { policy: FREDividendPolicySummary }) {
  const [open, setOpen] = useState(false);
  const hasText = policy.extraction_status === "ok";

  const detailQuery = useQuery({
    queryKey: ["cvm", "dividend-policy", policy.id],
    queryFn: () => getDividendPolicy(policy.id),
    enabled: open && hasText,
  });

  const unavailableMessage =
    policy.extraction_status === "failed"
      ? "Falha na extracao do texto desta politica de dividendos."
      : policy.extraction_status === "not_found"
        ? "Politica de dividendos nao localizada neste FRE."
        : "Sem texto extraivel para esta politica de dividendos.";

  return (
    <li className="rounded-2xl border border-border/80 bg-background/70">
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
        <div className="min-w-0 space-y-1">
          <p className="truncate text-sm font-medium text-foreground">
            Referencia: {formatDate(policy.reference_date)}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>{policy.char_count.toLocaleString("pt-BR")} caracteres</span>
            <DividendPolicyStatusBadge status={policy.extraction_status} />
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "Fechar" : "Abrir texto"}
        </Button>
      </div>

      {open ? (
        <div className="border-t border-border/60 px-4 py-3">
          {!hasText ? (
            <p className="text-sm text-muted-foreground">{unavailableMessage}</p>
          ) : detailQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando texto…</p>
          ) : detailQuery.isError ? (
            <div className="space-y-3">
              <p className="text-sm text-destructive">
                Falha ao carregar o texto: {(detailQuery.error as Error).message}
              </p>
              <Button variant="outline" size="sm" onClick={() => detailQuery.refetch()}>
                Tentar novamente
              </Button>
            </div>
          ) : detailQuery.data?.policy_text ? (
            <pre className="max-h-[28rem] overflow-auto whitespace-pre-wrap break-words rounded-xl bg-muted/40 p-4 font-mono text-xs leading-relaxed text-foreground">
              {detailQuery.data.policy_text}
            </pre>
          ) : (
            <p className="text-sm text-muted-foreground">
              Texto vazio para esta politica de dividendos.
            </p>
          )}
        </div>
      ) : null}
    </li>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="rounded-2xl border border-border/80 bg-background/70 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm text-foreground">{value || "—"}</p>
    </div>
  );
}
