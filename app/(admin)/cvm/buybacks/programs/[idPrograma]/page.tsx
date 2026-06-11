"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { JsonViewer } from "@/components/json-viewer";
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

export default function BuybackProgramDetailPage() {
  const params = useParams<{ idPrograma: string }>();
  const idPrograma = decodeURIComponent(params.idPrograma);

  const programQuery = useQuery({
    queryKey: ["cvm", "buybacks", "program", idPrograma],
    queryFn: () => getBuybackProgram(idPrograma),
  });

  const program = programQuery.data;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardTitle>{program?.nome_companhia ?? "Programa de recompra"}</CardTitle>
              <CardDescription className="mt-1">
                <span className="font-mono">id_programa</span> {idPrograma}
              </CardDescription>
            </div>

            {program ? (
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={program.situacao === "ATIVO" ? "success" : "secondary"}>
                  {program.situacao ?? "—"}
                </Badge>
                {program.tipo_operacao ? (
                  <Badge variant="secondary">{program.tipo_operacao}</Badge>
                ) : null}
                {program.cd_cvm ? (
                  <Link
                    className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                    href={`/cvm/companies/${program.cd_cvm}`}
                  >
                    Ir para empresa
                  </Link>
                ) : null}
              </div>
            ) : null}
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Programa</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <DetailRow label="cd_cvm" value={program?.cd_cvm} mono />
          <DetailRow label="CNPJ" value={program?.cnpj_companhia} mono />
          <DetailRow label="Deliberacao" value={formatDate(program?.data_deliberacao)} />
          <DetailRow label="Final do prazo" value={formatDate(program?.data_final_prazo)} />
          <DetailRow label="Tipo de operacao" value={program?.tipo_operacao} />
          <DetailRow label="Finalidade" value={program?.finalidade_compra} />
          <DetailRow
            label="ON anunciadas"
            value={formatDecimal(program?.qt_acoes_ordinarias, { maximumFractionDigits: 0 })}
            mono
          />
          <DetailRow
            label="PN anunciadas"
            value={formatDecimal(program?.qt_acoes_preferenciais, { maximumFractionDigits: 0 })}
            mono
          />
          <DetailRow label="Capturado em" value={formatDateTime(program?.captured_at)} />
          <DetailRow label="File hash" value={truncateHash(program?.file_version_hash, 10)} mono />
          <DetailRow label="Motivo" value={program?.motivo} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quantidades por tipo / classe</CardTitle>
          <CardDescription>
            Tabela <span className="font-mono">cvm_buyback_quantities</span> · pode haver multiplas linhas por programa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={quantityColumns}
            data={program?.quantities ?? []}
            loading={programQuery.isLoading}
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
            data={program?.intermediaries ?? []}
            loading={programQuery.isLoading}
            getRowKey={(row, index) => `${row.cnpj_intermediario}-${index}`}
            emptyMessage="Sem intermediarios cadastrados."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>raw_data</CardTitle>
          <CardDescription>Linha bruta CVM preservada para auditoria.</CardDescription>
        </CardHeader>
        <CardContent>
          {program ? <JsonViewer value={program.raw_data} /> : (
            <p className="text-sm text-muted-foreground">Carregando programa...</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
