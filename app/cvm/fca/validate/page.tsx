"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { ValidationActionPanel } from "@/components/validation";
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

export default function FCAValidatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idDocumento = searchParams.get("id_documento") ?? "";

  const documentoQuery = useQuery({
    queryKey: ["cvm", "fca", "documento", idDocumento],
    queryFn: () => getFCADocumento(idDocumento),
    enabled: Boolean(idDocumento),
  });

  const documento = documentoQuery.data;
  const geral = documento?.geral ?? null;

  if (documentoQuery.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-64" />
        <Card>
          <CardContent className="space-y-3 py-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-6 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (documentoQuery.isError) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-sm text-destructive">
            Falha ao carregar o FCA: {documentoQuery.error.message}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => documentoQuery.refetch()}
          >
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!documento) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-sm text-muted-foreground">
            FCA nao encontrado para o id_documento informado.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => router.push("/cvm/fca")}
          >
            Voltar para a lista
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Voltar"
            onClick={() => router.push("/cvm/fca")}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Validacao de FCA</span>
              <ChevronRight className="size-3" />
              <span>{formatDate(documento.data_referencia)}</span>
            </div>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
              {documento.nome_empresarial}
            </h2>
            <p className="mt-1 max-w-xl text-xs text-muted-foreground">
              Conferencia por amostragem das secoes do Formulario Cadastral. Marcar como valido
              nao altera o dado nem o app do usuario final — e metadado interno de QA.
            </p>
          </div>
        </div>

        <ValidationActionPanel
          reportType="fca"
          reportRef={String(documento.id_documento)}
          validation={documento.validation}
          invalidateKeys={[
            ["cvm", "fca", "documento", idDocumento],
            ["cvm", "fca", "documentos"],
          ]}
        />
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4 text-xs text-muted-foreground">
          <span>
            id_documento: <span className="font-mono text-foreground">{documento.id_documento}</span>
          </span>
          <span>
            cd_cvm: <span className="text-foreground">{documento.cd_cvm ?? "—"}</span>
          </span>
          <span>
            CNPJ: <span className="font-mono text-foreground">{documento.cnpj_companhia}</span>
          </span>
          <span>
            versao: <span className="text-foreground">v{documento.versao}</span>
          </span>
          {documento.categoria_documento ? (
            <Badge variant="secondary">{documento.categoria_documento}</Badge>
          ) : null}
          {documento.cd_cvm !== null ? (
            <Link
              className="font-medium text-primary underline-offset-4 hover:underline"
              href={`/cvm/companies/detail?cd_cvm=${documento.cd_cvm}`}
            >
              Ir para empresa
            </Link>
          ) : null}
          <Link
            className="font-medium text-primary underline-offset-4 hover:underline"
            href={`/cvm/fca/documentos/detail?id_documento=${documento.id_documento}`}
          >
            Ver documento completo
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Identificacao do documento</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <DetailRow label="Referencia" value={formatDate(documento.data_referencia)} />
          <DetailRow label="Recebido em" value={formatDate(documento.data_recebimento)} />
          <DetailRow label="Capturado em" value={formatDateTime(documento.captured_at)} />
          <DetailRow label="File hash" value={truncateHash(documento.file_version_hash, 10)} mono />
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

      <Tabs defaultValue="dri">
        <TabsList className="flex w-full flex-wrap">
          <TabsTrigger value="dri">DRI</TabsTrigger>
          <TabsTrigger value="tickers">Valores mobiliarios</TabsTrigger>
          <TabsTrigger value="auditores">Auditores</TabsTrigger>
        </TabsList>

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
                data={documento.dri ?? []}
                getRowKey={(row, index) => `${row.responsavel}-${index}`}
                emptyMessage="Sem responsaveis cadastrados."
              />
            </CardContent>
          </Card>
        </TabsContent>

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
                data={documento.valores_mobiliarios ?? []}
                getRowKey={(row, index) =>
                  `${row.codigo_negociacao ?? row.valor_mobiliario}-${index}`
                }
                emptyMessage="Sem valores mobiliarios cadastrados."
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
                data={documento.auditores ?? []}
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
