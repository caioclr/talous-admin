"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { JsonViewer } from "@/components/json-viewer";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { ValidationActionPanel } from "@/components/validation";
import { formatDate, formatDateTime, formatDecimal, truncateHash } from "@/lib/formatters";
import { getVLMOFiling, listVLMOMovimentacoes } from "@/lib/services/admin/cvm-vlmo";
import type { VLMOMovimentacaoSummary } from "@/lib/services/admin/types";

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
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className={mono ? "mt-1.5 font-mono text-sm" : "mt-1.5 text-sm text-foreground"}>
        {value === null || value === undefined || value === "" ? "—" : String(value)}
      </p>
    </div>
  );
}

const movimentacaoColumns: DataTableColumn<VLMOMovimentacaoSummary>[] = [
  {
    key: "data",
    header: "Movimentacao",
    render: (row) => formatDate(row.data_movimentacao),
  },
  {
    key: "cargo",
    header: "Cargo / Tipo",
    render: (row) => (
      <div className="space-y-1">
        <p>{row.tipo_cargo ?? "—"}</p>
        <p className="text-xs text-muted-foreground">{row.tipo_empresa ?? row.empresa ?? "—"}</p>
      </div>
    ),
  },
  {
    key: "operacao",
    header: "Operacao",
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
];

export default function VLMOValidatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";

  const filingQuery = useQuery({
    queryKey: ["cvm", "vlmo", "filing", id],
    queryFn: () => getVLMOFiling(id),
    enabled: Boolean(id),
  });

  const filing = filingQuery.data;
  const referenceYear = filing?.data_referencia
    ? Number(filing.data_referencia.slice(0, 4))
    : undefined;

  // Movimentacoes do filing (legiveis para a conferencia por amostragem). O
  // filing nao traz as linhas embutidas; resolvemos pelo par (cnpj, ano da
  // referencia), que e a chave natural do filing VLMO.
  const movimentacoesQuery = useQuery({
    queryKey: ["cvm", "vlmo", "filing-movs", filing?.cnpj_companhia, referenceYear],
    queryFn: () =>
      listVLMOMovimentacoes({
        cnpj: filing?.cnpj_companhia,
        year: referenceYear,
        page: 1,
        page_size: 100,
      }),
    enabled: Boolean(filing?.cnpj_companhia && referenceYear),
  });

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
            Falha ao carregar o filing: {filingQuery.error.message}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => filingQuery.refetch()}
          >
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
            Filing VLMO nao encontrado para o id informado.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => router.push("/cvm/vlmo/filings")}
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
            onClick={() => router.push("/cvm/vlmo/filings")}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Validacao de filing VLMO</span>
              <ChevronRight className="size-3" />
              <span>{formatDate(filing.data_referencia)}</span>
            </div>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
              {filing.nome_companhia}
            </h2>
            <p className="mt-1 max-w-xl text-xs text-muted-foreground">
              Conferencia por amostragem do filing de movimentacoes de insiders. Marcar como valido
              nao altera o dado nem o app do usuario final — e metadado interno de QA.
            </p>
          </div>
        </div>

        <ValidationActionPanel
          reportType="vlmo"
          reportRef={String(filing.id)}
          validation={filing.validation}
          invalidateKeys={[
            ["cvm", "vlmo", "filing", id],
            ["cvm", "vlmo", "filings"],
          ]}
        />
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4 text-xs text-muted-foreground">
          <span>
            id: <span className="font-mono text-foreground">{filing.id}</span>
          </span>
          <span>
            protocolo: <span className="font-mono text-foreground">{filing.protocolo_entrega}</span>
          </span>
          <span>
            CNPJ: <span className="font-mono text-foreground">{filing.cnpj_companhia}</span>
          </span>
          <span>
            versao: <span className="text-foreground">v{filing.versao}</span>
          </span>
          {filing.categoria ? <Badge variant="secondary">{filing.categoria}</Badge> : null}
          {filing.cd_cvm ? (
            <Link
              className="font-medium text-primary underline-offset-4 hover:underline"
              href={`/cvm/vlmo/companies/detail?cd_cvm=${filing.cd_cvm}`}
            >
              Ir para empresa
            </Link>
          ) : null}
          {filing.link_download ? (
            <a
              className="font-medium text-primary underline-offset-4 hover:underline"
              href={filing.link_download}
              target="_blank"
              rel="noreferrer"
            >
              Abrir link de download
            </a>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Identificacao do filing</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <DetailRow label="Data referencia" value={formatDate(filing.data_referencia)} />
          <DetailRow label="Data entrega" value={formatDate(filing.data_entrega)} />
          <DetailRow label="Categoria" value={filing.categoria} />
          <DetailRow label="Tipo" value={filing.tipo} />
          <DetailRow label="Tipo apresentacao" value={filing.tipo_apresentacao} />
          <DetailRow label="Capturado em" value={formatDateTime(filing.captured_at)} />
          <DetailRow label="File hash" value={truncateHash(filing.file_version_hash, 10)} mono />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Movimentacoes do filing</CardTitle>
          <CardDescription>
            Linhas de <span className="font-mono">cvm_vlmo_movimentacoes</span> da empresa no ano de
            referencia ({referenceYear ?? "—"}) — base legivel da conferencia. As movimentacoes nao
            tem selo proprio; o selo e do filing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={movimentacaoColumns}
            data={movimentacoesQuery.data?.items ?? []}
            loading={movimentacoesQuery.isLoading}
            getRowKey={(row) => row.id}
            emptyMessage="Sem movimentacoes para a empresa no ano de referencia."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>raw_data</CardTitle>
          <CardDescription>Linha bruta do CSV CVM preservada para auditoria.</CardDescription>
        </CardHeader>
        <CardContent>
          <JsonViewer value={filing.raw_data} />
        </CardContent>
      </Card>
    </div>
  );
}
