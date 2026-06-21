"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { ValidationActionPanel } from "@/components/validation";
import { formatDate, formatDateTime, formatDecimal, truncateHash } from "@/lib/formatters";
import { getBuybackProgram } from "@/lib/services/admin/cvm-buybacks";
import type {
  BuybackIntermediarySummary,
  BuybackQuantitySummary,
} from "@/lib/services/admin/types";

const quantityColumns: DataTableColumn<BuybackQuantitySummary>[] = [
  {
    key: "tipo",
    header: "Tipo",
    render: (row) => row.tipo_acao ?? "—",
  },
  {
    key: "classe",
    header: "Classe",
    render: (row) => row.classe_acao ?? "—",
  },
  {
    key: "circulacao",
    header: "Em circulacao",
    render: (row) => (
      <span className="font-mono text-sm">
        {formatDecimal(row.quantidade_circulacao, { maximumFractionDigits: 0 })}
      </span>
    ),
  },
  {
    key: "operacao",
    header: "Da operacao",
    render: (row) => (
      <span className="font-mono text-sm">
        {formatDecimal(row.quantidade_operacao, { maximumFractionDigits: 0 })}
      </span>
    ),
  },
];

const intermediaryColumns: DataTableColumn<BuybackIntermediarySummary>[] = [
  {
    key: "name",
    header: "Intermediario",
    render: (row) => row.nome_intermediario,
  },
  {
    key: "cnpj",
    header: "CNPJ",
    render: (row) => <span className="font-mono text-xs">{row.cnpj_intermediario}</span>,
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
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className={mono ? "mt-1.5 font-mono text-sm" : "mt-1.5 text-sm text-foreground"}>
        {value === null || value === undefined || value === "" ? "—" : String(value)}
      </p>
    </div>
  );
}

export default function BuybackValidatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idPrograma = searchParams.get("id_programa") ?? "";

  const programQuery = useQuery({
    queryKey: ["cvm", "buybacks", "program", idPrograma],
    queryFn: () => getBuybackProgram(idPrograma),
    enabled: Boolean(idPrograma),
  });

  const program = programQuery.data;

  if (programQuery.isLoading) {
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

  if (programQuery.isError) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-sm text-destructive">
            Falha ao carregar o programa: {programQuery.error.message}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => programQuery.refetch()}
          >
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!program) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-sm text-muted-foreground">
            Programa de recompra nao encontrado para o id_programa informado.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => router.push("/cvm/buybacks")}
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
            onClick={() => router.push("/cvm/buybacks")}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Validacao de recompra</span>
              <ChevronRight className="size-3" />
              <span>{formatDate(program.data_deliberacao)}</span>
            </div>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
              {program.nome_companhia}
            </h2>
            <p className="mt-1 max-w-xl text-xs text-muted-foreground">
              Conferencia por amostragem do programa oficial de recompra. Marcar como valido nao
              altera o dado nem o app do usuario final — e metadado interno de QA.
            </p>
          </div>
        </div>

        <ValidationActionPanel
          reportType="buyback"
          reportRef={String(program.id_programa)}
          validation={program.validation}
          invalidateKeys={[
            ["cvm", "buybacks", "program", idPrograma],
            ["cvm", "buybacks", "programs"],
          ]}
        />
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4 text-xs text-muted-foreground">
          <span>
            id_programa: <span className="font-mono text-foreground">{program.id_programa}</span>
          </span>
          <span>
            cd_cvm: <span className="text-foreground">{program.cd_cvm ?? "—"}</span>
          </span>
          <span>
            CNPJ: <span className="font-mono text-foreground">{program.cnpj_companhia}</span>
          </span>
          <Badge variant={program.situacao === "ATIVO" ? "success" : "secondary"}>
            {program.situacao ?? "—"}
          </Badge>
          {program.tipo_operacao ? (
            <Badge variant="secondary">{program.tipo_operacao}</Badge>
          ) : null}
          {program.cd_cvm ? (
            <Link
              className="font-medium text-primary underline-offset-4 hover:underline"
              href={`/cvm/companies/detail?cd_cvm=${program.cd_cvm}`}
            >
              Ir para empresa
            </Link>
          ) : null}
          <Link
            className="font-medium text-primary underline-offset-4 hover:underline"
            href={`/cvm/buybacks/programs/detail?id_programa=${encodeURIComponent(program.id_programa)}`}
          >
            Ver programa completo
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Programa</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <DetailRow label="Deliberacao" value={formatDate(program.data_deliberacao)} />
          <DetailRow label="Final do prazo" value={formatDate(program.data_final_prazo)} />
          <DetailRow label="Tipo de operacao" value={program.tipo_operacao} />
          <DetailRow label="Finalidade" value={program.finalidade_compra} />
          <DetailRow
            label="ON anunciadas"
            value={formatDecimal(program.qt_acoes_ordinarias, { maximumFractionDigits: 0 })}
            mono
          />
          <DetailRow
            label="PN anunciadas"
            value={formatDecimal(program.qt_acoes_preferenciais, { maximumFractionDigits: 0 })}
            mono
          />
          <DetailRow label="Capturado em" value={formatDateTime(program.captured_at)} />
          <DetailRow label="File hash" value={truncateHash(program.file_version_hash, 10)} mono />
          <DetailRow label="Motivo" value={program.motivo} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quantidades por tipo / classe</CardTitle>
          <CardDescription>
            Tabela <span className="font-mono">cvm_buyback_quantities</span> · pode haver multiplas
            linhas por programa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={quantityColumns}
            data={program.quantities ?? []}
            getRowKey={(row, index) => `${row.tipo_acao ?? "—"}-${row.classe_acao ?? "—"}-${index}`}
            emptyMessage="Sem quantidades detalhadas."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Intermediarios</CardTitle>
          <CardDescription>Corretoras / instituicoes contratadas para a operacao.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={intermediaryColumns}
            data={program.intermediaries ?? []}
            getRowKey={(row, index) => `${row.cnpj_intermediario}-${index}`}
            emptyMessage="Sem intermediarios cadastrados."
          />
        </CardContent>
      </Card>
    </div>
  );
}
