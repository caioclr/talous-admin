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
import { DynamicTable } from "@/components/dynamic-table";
import { JsonViewer } from "@/components/json-viewer";
import { ValidationActionPanel } from "@/components/validation";
import { formatDate, formatDateTime, formatDecimal, truncateHash } from "@/lib/formatters";
import { getFREFiling } from "@/lib/services/admin/cvm-fre";
import type {
  FREAuditorSummary,
  FREValorMobiliarioSummary,
} from "@/lib/services/admin/types";

const auditorColumns: DataTableColumn<FREAuditorSummary>[] = [
  {
    key: "auditor",
    header: "Auditor",
    render: (row) => (
      <div className="space-y-1">
        <p className="font-medium text-foreground">{row.auditor ?? "—"}</p>
        <p className="text-xs text-muted-foreground">{row.tipo_origem_auditor ?? "—"}</p>
      </div>
    ),
  },
  {
    key: "cnpj",
    header: "CNPJ",
    render: (row) => <span className="font-mono text-xs">{row.cnpj_auditor ?? "—"}</span>,
  },
  {
    key: "inicio",
    header: "Inicio",
    render: (row) => formatDate(row.data_inicio_contratacao),
  },
  {
    key: "fim",
    header: "Fim",
    render: (row) => formatDate(row.data_fim_contratacao),
  },
  {
    key: "remuneracao",
    header: "Remuneracao",
    render: (row) => (
      <span className="font-mono text-sm">
        {formatDecimal(row.remuneracao_auditor, { maximumFractionDigits: 2 })}
      </span>
    ),
  },
];

const valorMobiliarioColumns: DataTableColumn<FREValorMobiliarioSummary>[] = [
  {
    key: "valor",
    header: "Valor mobiliario",
    render: (row) => (
      <div className="space-y-1">
        <p>{row.valor_mobiliario ?? "—"}</p>
        <p className="text-xs text-muted-foreground">{row.identificacao_valor_mobiliario ?? "—"}</p>
      </div>
    ),
  },
  {
    key: "emissao",
    header: "Emissao",
    render: (row) => formatDate(row.data_emissao),
  },
  {
    key: "vencimento",
    header: "Vencimento",
    render: (row) => formatDate(row.data_vencimento),
  },
  {
    key: "qty",
    header: "Quantidade",
    render: (row) => (
      <span className="font-mono text-sm">
        {formatDecimal(row.quantidade, { maximumFractionDigits: 0 })}
      </span>
    ),
  },
  {
    key: "saldo",
    header: "Saldo devedor",
    render: (row) => (
      <span className="font-mono text-sm">
        {formatDecimal(row.saldo_devedor, { maximumFractionDigits: 2 })}
      </span>
    ),
  },
  {
    key: "origem",
    header: "Origem",
    render: (row) => row.origem ?? "—",
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

export default function FREValidatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idDocumento = searchParams.get("id_documento") ?? "";

  const filingQuery = useQuery({
    queryKey: ["cvm", "fre", "filing", idDocumento],
    queryFn: () => getFREFiling(idDocumento),
    enabled: Boolean(idDocumento),
  });

  const filing = filingQuery.data;

  if (filingQuery.isLoading) {
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

  if (filingQuery.isError) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-sm text-destructive">
            Falha ao carregar o FRE: {filingQuery.error.message}
          </p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => filingQuery.refetch()}>
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!filing) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-sm text-muted-foreground">
            FRE nao encontrado para o id_documento informado.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => router.push("/cvm/fre")}
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
            onClick={() => router.push("/cvm/fre")}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Validacao de FRE</span>
              <ChevronRight className="size-3" />
              <span>{formatDate(filing.data_referencia)}</span>
            </div>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
              {filing.nome_companhia}
            </h2>
            <p className="mt-1 max-w-xl text-xs text-muted-foreground">
              Conferencia por amostragem das secoes do Formulario de Referencia. Marcar como valido
              nao altera o dado nem o app do usuario final — e metadado interno de QA.
            </p>
          </div>
        </div>

        <ValidationActionPanel
          reportType="fre"
          reportRef={filing.id_documento}
          validation={filing.validation}
          invalidateKeys={[
            ["cvm", "fre", "filing", idDocumento],
            ["cvm", "fre", "filings"],
          ]}
        />
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4 text-xs text-muted-foreground">
          <span>
            id_documento: <span className="font-mono text-foreground">{filing.id_documento}</span>
          </span>
          <span>
            cd_cvm: <span className="text-foreground">{filing.cd_cvm ?? "—"}</span>
          </span>
          <span>
            CNPJ: <span className="font-mono text-foreground">{filing.cnpj_companhia}</span>
          </span>
          <span>
            versao: <span className="text-foreground">v{filing.versao}</span>
          </span>
          {filing.categoria_documento ? (
            <Badge variant="secondary">{filing.categoria_documento}</Badge>
          ) : null}
          {filing.cd_cvm ? (
            <Link
              className="font-medium text-primary underline-offset-4 hover:underline"
              href={`/cvm/companies/detail?cd_cvm=${filing.cd_cvm}`}
            >
              Ir para empresa
            </Link>
          ) : null}
          {filing.link_documento ? (
            <a
              className="font-medium text-primary underline-offset-4 hover:underline"
              href={filing.link_documento}
              target="_blank"
              rel="noreferrer"
            >
              Documento na CVM ↗
            </a>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Identificacao do filing</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <DetailRow label="Referencia" value={formatDate(filing.data_referencia)} />
          <DetailRow label="Recebido em" value={formatDate(filing.data_recebimento)} />
          <DetailRow
            label="Inicio do exercicio social"
            value={formatDate(filing.data_inicio_exercicio_social)}
          />
          <DetailRow
            label="Fim do exercicio social"
            value={formatDate(filing.data_fim_exercicio_social)}
          />
          <DetailRow label="Capturado em" value={formatDateTime(filing.captured_at)} />
          <DetailRow label="File hash" value={truncateHash(filing.file_version_hash, 10)} mono />
        </CardContent>
      </Card>

      <Tabs defaultValue="capital">
        <TabsList className="flex w-full flex-wrap">
          <TabsTrigger value="capital">Capital social</TabsTrigger>
          <TabsTrigger value="acionaria">Posicao acionaria</TabsTrigger>
          <TabsTrigger value="auditores">Auditores</TabsTrigger>
          <TabsTrigger value="remuneracao">Remuneracao</TabsTrigger>
          <TabsTrigger value="valores">Valores mobiliarios</TabsTrigger>
          <TabsTrigger value="partes">Partes relacionadas</TabsTrigger>
          <TabsTrigger value="outros">Outros</TabsTrigger>
        </TabsList>

        <TabsContent value="capital">
          <Card>
            <CardHeader>
              <CardTitle>Capital social</CardTitle>
              <CardDescription>
                Linhas de <span className="font-mono">capital_social</span> +{" "}
                <span className="font-mono">distribuicao_capital</span> (objeto unico).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <DynamicTable
                rows={filing.capital_social ?? []}
                emptyMessage="Sem linhas de capital social."
              />
              {filing.distribuicao_capital ? (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Distribuicao de capital
                  </p>
                  <JsonViewer value={filing.distribuicao_capital} />
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="acionaria">
          <Card>
            <CardHeader>
              <CardTitle>Posicao acionaria</CardTitle>
              <CardDescription>
                Acionistas com participacao relevante reportada no FRE.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DynamicTable
                rows={filing.posicao_acionaria ?? []}
                emptyMessage="Sem linhas de posicao acionaria."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="auditores">
          <Card>
            <CardHeader>
              <CardTitle>Auditores</CardTitle>
              <CardDescription>
                Historico de contratacao + remuneracao do auditor independente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={auditorColumns}
                data={filing.auditores ?? []}
                getRowKey={(row, index) => `${row.id_auditor ?? row.cnpj_auditor ?? "—"}-${index}`}
                emptyMessage="Sem auditores cadastrados."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="remuneracao">
          <Card>
            <CardHeader>
              <CardTitle>Remuneracao por orgao</CardTitle>
              <CardDescription>
                <span className="font-mono">remuneracao_orgao</span> + max/min/media.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Por orgao
                </p>
                <DynamicTable
                  rows={filing.remuneracao_orgao ?? []}
                  emptyMessage="Sem dados de remuneracao por orgao."
                />
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Max / min / media
                </p>
                <DynamicTable
                  rows={filing.remuneracao_max_min_media ?? []}
                  emptyMessage="Sem dados agregados."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="valores">
          <Card>
            <CardHeader>
              <CardTitle>Valores mobiliarios</CardTitle>
              <CardDescription>
                Emissoes (acoes, debentures, bonus de subscricao) reportadas pela companhia.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={valorMobiliarioColumns}
                data={filing.valores_mobiliarios ?? []}
                getRowKey={(row, index) =>
                  `${row.identificacao_valor_mobiliario ?? row.valor_mobiliario ?? "—"}-${index}`
                }
                emptyMessage="Sem valores mobiliarios cadastrados."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="partes">
          <Card>
            <CardHeader>
              <CardTitle>Transacoes com partes relacionadas</CardTitle>
              <CardDescription>
                <span className="font-mono">transacoes_parte_relacionada</span> — prazo, contraparte, valor.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DynamicTable
                rows={filing.transacoes_parte_relacionada ?? []}
                emptyMessage="Sem transacoes com partes relacionadas."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="outros">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Responsaveis</CardTitle>
                <CardDescription>DRI e demais responsaveis pelo FRE.</CardDescription>
              </CardHeader>
              <CardContent>
                <DynamicTable
                  rows={filing.responsaveis ?? []}
                  emptyMessage="Sem responsaveis cadastrados."
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Participacoes</CardTitle>
              </CardHeader>
              <CardContent>
                <DynamicTable
                  rows={filing.participacoes ?? []}
                  emptyMessage="Sem participacoes cadastradas."
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Mercado estrangeiro</CardTitle>
              </CardHeader>
              <CardContent>
                <DynamicTable
                  rows={filing.mercado_estrangeiro ?? []}
                  emptyMessage="Sem listagem em mercado estrangeiro."
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
