"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { formatDate, formatDateTime, truncateHash } from "@/lib/formatters";
import { getFCADocumento } from "@/lib/services/admin/cvm-fca";
import type {
  FCAAuditorSummary,
  FCADriSummary,
  FCAValorMobiliarioSummary,
} from "@/lib/services/admin/types";

const valorMobiliarioColumns: DataTableColumn<FCAValorMobiliarioSummary>[] = [
  {
    key: "ticker",
    header: "Ticker",
    render: (row) => (
      <div className="space-y-1">
        <p className="font-mono font-semibold text-foreground">
          {row.codigo_negociacao ?? "—"}
        </p>
        <p className="text-xs text-muted-foreground">{row.valor_mobiliario}</p>
      </div>
    ),
  },
  {
    key: "segmento",
    header: "Segmento",
    render: (row) =>
      row.segmento ? (
        row.segmento.includes("Novo Mercado") ? (
          <Badge variant="success">{row.segmento}</Badge>
        ) : (
          <Badge variant="secondary">{row.segmento}</Badge>
        )
      ) : (
        "—"
      ),
  },
  {
    key: "mercado",
    header: "Mercado",
    render: (row) => (
      <div className="space-y-1">
        <p className="text-sm">{row.mercado ?? "—"}</p>
        <p className="text-xs text-muted-foreground">
          {row.sigla_entidade_administradora ?? "—"}
        </p>
      </div>
    ),
  },
  {
    key: "inicio",
    header: "Inicio da listagem",
    render: (row) => formatDate(row.data_inicio_listagem),
  },
  {
    key: "fim",
    header: "Fim da listagem",
    render: (row) => formatDate(row.data_fim_listagem),
  },
];

const driColumns: DataTableColumn<FCADriSummary>[] = [
  {
    key: "responsavel",
    header: "Responsavel",
    render: (row) => (
      <div className="space-y-1">
        <p className="font-medium text-foreground">{row.responsavel}</p>
        <p className="text-xs text-muted-foreground">{row.tipo_responsavel}</p>
      </div>
    ),
  },
  {
    key: "email",
    header: "Email",
    render: (row) =>
      row.email ? <span className="font-mono text-xs">{row.email}</span> : "—",
  },
  {
    key: "local",
    header: "Local",
    render: (row) =>
      row.cidade || row.sigla_uf
        ? [row.cidade, row.sigla_uf].filter(Boolean).join(" / ")
        : "—",
  },
  {
    key: "inicio",
    header: "Inicio da atuacao",
    render: (row) => formatDate(row.data_inicio_atuacao),
  },
  {
    key: "fim",
    header: "Fim da atuacao",
    render: (row) => formatDate(row.data_fim_atuacao),
  },
];

const auditorColumns: DataTableColumn<FCAAuditorSummary>[] = [
  {
    key: "auditor",
    header: "Auditor",
    render: (row) => (
      <div className="space-y-1">
        <p className="font-medium text-foreground">{row.auditor}</p>
        <p className="text-xs text-muted-foreground">
          Codigo CVM {row.codigo_cvm_auditor ?? "—"}
        </p>
      </div>
    ),
  },
  {
    key: "responsavel",
    header: "Responsavel tecnico",
    render: (row) => row.responsavel_tecnico ?? "—",
  },
  {
    key: "inicio",
    header: "Inicio da atuacao",
    render: (row) => formatDate(row.data_inicio_atuacao_auditor),
  },
  {
    key: "fim",
    header: "Fim da atuacao",
    render: (row) =>
      row.data_fim_atuacao_auditor ? (
        <div className="flex items-center gap-2">
          <span>{formatDate(row.data_fim_atuacao_auditor)}</span>
          <Badge variant="warning">Encerrado</Badge>
        </div>
      ) : (
        "—"
      ),
  },
];

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string | number | null | undefined;
  mono?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border/80 bg-background/70 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className={mono ? "mt-1.5 font-mono text-sm" : "mt-1.5 text-sm text-foreground"}>
        {value === null || value === undefined || value === "" ? "—" : String(value)}
      </p>
    </div>
  );
}

export default function FCADocumentoDetailPage() {
  const searchParams = useSearchParams();
  const idDocumento = searchParams.get("id_documento") ?? "";

  const documentoQuery = useQuery({
    queryKey: ["cvm", "fca", "documento", idDocumento],
    queryFn: () => getFCADocumento(idDocumento),
  });

  const documento = documentoQuery.data;
  const geral = documento?.geral ?? null;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardTitle>{documento?.nome_empresarial ?? "Documento FCA"}</CardTitle>
              <CardDescription className="mt-1">
                <span className="font-mono">id_documento</span> {idDocumento}
              </CardDescription>
            </div>

            {documento ? (
              <div className="flex flex-wrap items-center gap-2">
                {documento.categoria_documento ? (
                  <Badge variant="secondary">{documento.categoria_documento}</Badge>
                ) : null}
                <Badge>v{documento.versao}</Badge>
                {documento.cd_cvm !== null ? (
                  <Link
                    className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                    href={`/cvm/companies/detail?cd_cvm=${documento.cd_cvm}`}
                  >
                    Ver no cadastro
                  </Link>
                ) : null}
              </div>
            ) : null}
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Identificacao do documento</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <DetailRow label="cd_cvm" value={documento?.cd_cvm} mono />
          <DetailRow label="CNPJ" value={documento?.cnpj_companhia} mono />
          <DetailRow label="Referencia" value={formatDate(documento?.data_referencia)} />
          <DetailRow label="Recebido em" value={formatDate(documento?.data_recebimento)} />
          <DetailRow label="Capturado em" value={formatDateTime(documento?.captured_at)} />
          <DetailRow label="File hash" value={truncateHash(documento?.file_version_hash, 10)} mono />
        </CardContent>
      </Card>

      {geral ? (
        <Card>
          <CardHeader>
            <CardTitle>Geral</CardTitle>
            <CardDescription>
              Dados gerais da companhia reportados no formulario cadastral.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <DetailRow label="Setor de atividade" value={geral.setor_atividade} />
            <DetailRow label="Descricao da atividade" value={geral.descricao_atividade} />
            <DetailRow label="Situacao do emissor" value={geral.situacao_emissor} />
            <DetailRow label="Pais de origem" value={geral.pais_origem} />
            <DetailRow label="Pagina web" value={geral.pagina_web} mono />
            <DetailRow
              label="Nome empresarial anterior"
              value={geral.nome_empresarial_anterior}
            />
            <DetailRow label="Constituida em" value={formatDate(geral.data_constituicao)} />
          </CardContent>
        </Card>
      ) : null}

      <Tabs defaultValue="tickers">
        <TabsList className="flex w-full flex-wrap">
          <TabsTrigger value="tickers">Tickers</TabsTrigger>
          <TabsTrigger value="dri">DRI</TabsTrigger>
          <TabsTrigger value="auditores">Auditores</TabsTrigger>
        </TabsList>

        <TabsContent value="tickers">
          <Card>
            <CardHeader>
              <CardTitle>Valores mobiliarios</CardTitle>
              <CardDescription>
                Tickers e segmentos de listagem reportados pela companhia.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={valorMobiliarioColumns}
                data={documento?.valores_mobiliarios ?? []}
                loading={documentoQuery.isLoading}
                getRowKey={(row, index) =>
                  `${row.codigo_negociacao ?? row.valor_mobiliario}-${index}`
                }
                emptyMessage="Sem valores mobiliarios cadastrados."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dri">
          <Card>
            <CardHeader>
              <CardTitle>Diretor de Relacoes com Investidores</CardTitle>
              <CardDescription>
                Historico de DRI e responsaveis pelo formulario.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={driColumns}
                data={documento?.dri ?? []}
                loading={documentoQuery.isLoading}
                getRowKey={(row, index) => `${row.responsavel}-${index}`}
                emptyMessage="Sem responsaveis cadastrados."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="auditores">
          <Card>
            <CardHeader>
              <CardTitle>Auditores</CardTitle>
              <CardDescription>
                Auditor independente — fim de atuacao preenchido sinaliza troca de auditor.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={auditorColumns}
                data={documento?.auditores ?? []}
                loading={documentoQuery.isLoading}
                getRowKey={(row, index) =>
                  `${row.codigo_cvm_auditor ?? row.auditor}-${index}`
                }
                emptyMessage="Sem auditores cadastrados."
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
