"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate, formatDateTime, formatList } from "@/lib/formatters";
import {
  getAdminCompany,
  getCompanyChanges,
  getCompanyHistory,
} from "@/lib/services/admin/cvm-registry";
import { listIPEByCompany } from "@/lib/services/admin/cvm-ipe";
import { listITRDFPFilings } from "@/lib/services/admin/cvm-itr-dfp";
import type {
  CVMSnapshotSummary,
  FilingSummary,
  IPEDisclosureSummary,
  RegistryChangeEventResponse,
} from "@/lib/services/admin/types";

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
      <Link className="text-primary underline-offset-4 hover:underline" href={`/cvm/snapshots/${row.id}`}>
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

const ipeColumns: DataTableColumn<IPEDisclosureSummary>[] = [
  {
    key: "delivery",
    header: "Entrega",
    render: (row) => formatDate(row.data_entrega),
  },
  {
    key: "categoria",
    header: "Categoria",
    render: (row) => row.categoria,
  },
  {
    key: "assunto",
    header: "Assunto",
    render: (row) => (
      <div className="space-y-1">
        <p className="line-clamp-2">{row.assunto}</p>
        <p className="text-xs text-muted-foreground">{row.signal_classification ?? "sem sinal"}</p>
      </div>
    ),
  },
  {
    key: "detail",
    header: "Detalhe",
    render: (row) => (
      <Link className="text-primary underline-offset-4 hover:underline" href={`/cvm/ipe/disclosures/${row.id}`}>
        Abrir
      </Link>
    ),
  },
];

const filingsColumns: DataTableColumn<FilingSummary>[] = [
  {
    key: "doc",
    header: "Doc",
    render: (row) => (
      <div className="space-y-1">
        <p className="font-medium text-foreground">{row.doc_type.toUpperCase()}</p>
        <p className="text-xs text-muted-foreground">versao {row.version}</p>
      </div>
    ),
  },
  {
    key: "reference_date",
    header: "Referencia",
    render: (row) => formatDate(row.reference_date),
  },
  {
    key: "grupo",
    header: "Grupo",
    render: (row) => row.grupo_dfr,
  },
  {
    key: "statements",
    header: "Statements",
    render: (row) => row.statement_types.join(", "),
  },
];

export default function CompanyDetailPage() {
  const params = useParams<{ cdCvm: string }>();
  const cdCvm = params.cdCvm;

  const companyQuery = useQuery({
    queryKey: ["cvm", "company", cdCvm],
    queryFn: () => getAdminCompany(cdCvm),
  });

  const historyQuery = useQuery({
    queryKey: ["cvm", "company", cdCvm, "history"],
    queryFn: () => getCompanyHistory(cdCvm),
  });

  const changesQuery = useQuery({
    queryKey: ["cvm", "company", cdCvm, "changes"],
    queryFn: () => getCompanyChanges(cdCvm),
  });

  const ipeQuery = useQuery({
    queryKey: ["cvm", "company", cdCvm, "ipe"],
    queryFn: () =>
      listIPEByCompany(cdCvm, {
        page: 1,
        page_size: 5,
      }),
  });

  const filingsQuery = useQuery({
    queryKey: ["cvm", "company", cdCvm, "itr-dfp"],
    queryFn: () =>
      listITRDFPFilings({
        cd_cvm: Number(cdCvm),
        limit: 5,
      }),
  });

  const company = companyQuery.data;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardTitle>{company?.name ?? `Empresa ${cdCvm}`}</CardTitle>
              <CardDescription className="mt-1">
                {company ? formatList(company.tickers) : "Carregando tickers..."}
              </CardDescription>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge>{company?.cvm_situation ?? "—"}</Badge>
              <Badge variant={company?.is_active ? "success" : "warning"}>
                {company?.is_active ? "Ativa" : "Inativa"}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="history">Historico</TabsTrigger>
          <TabsTrigger value="changes">Mudancas</TabsTrigger>
          <TabsTrigger value="ipe">IPE</TabsTrigger>
          <TabsTrigger value="itr-dfp">ITR/DFP</TabsTrigger>
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

        <TabsContent value="history">
          <DataTable
            columns={historyColumns}
            data={historyQuery.data ?? []}
            loading={historyQuery.isLoading}
            getRowKey={(row) => row.id}
            emptyMessage="Nao ha historico suficiente para esta empresa."
          />
        </TabsContent>

        <TabsContent value="changes">
          <DataTable
            columns={changesColumns}
            data={changesQuery.data ?? []}
            loading={changesQuery.isLoading}
            getRowKey={(row, index) => `${row.field}-${index}`}
            emptyMessage="Nenhuma mudanca detectada entre snapshots consecutivos."
          />
        </TabsContent>

        <TabsContent value="ipe">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <CardTitle>Disclosures IPE recentes</CardTitle>
                  <CardDescription>
                    Ultimos comunicados retornados por `GET /admin/cvm/ipe/disclosures/by-company/{cdCvm}`.
                  </CardDescription>
                </div>

                <Link
                  href={`/cvm/ipe/companies/${cdCvm}`}
                  className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  Ver historico completo
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={ipeColumns}
                data={ipeQuery.data?.items ?? []}
                loading={ipeQuery.isLoading}
                getRowKey={(row) => row.id}
                emptyMessage="Nenhum disclosure IPE encontrado para esta empresa."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="itr-dfp">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <CardTitle>Filings ITR/DFP recentes</CardTitle>
                  <CardDescription>
                    Atalho para o explorer contábil da empresa usando `GET /admin/cvm/itr-dfp/filings`.
                  </CardDescription>
                </div>

                <Link
                  href={`/cvm/itr-dfp/companies/${cdCvm}`}
                  className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  Abrir explorer completo
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={filingsColumns}
                data={filingsQuery.data ?? []}
                loading={filingsQuery.isLoading}
                getRowKey={(row, index) => `${row.cd_cvm}-${row.reference_date}-${row.version}-${index}`}
                emptyMessage="Nenhum filing ITR/DFP encontrado para esta empresa."
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
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
