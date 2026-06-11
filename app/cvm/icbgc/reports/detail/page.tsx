"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { JsonViewer } from "@/components/json-viewer";
import { formatDate, formatDateTime, truncateHash } from "@/lib/formatters";
import { getICBGCReport } from "@/lib/services/admin/cvm-icbgc";
import type { GovernanceComplianceItemSummary } from "@/lib/services/admin/types";

const ADOPTION_BADGES: Record<
  string,
  { label: string; variant: "success" | "warning" | "destructive" | "secondary" | "default" }
> = {
  yes: { label: "Sim", variant: "success" },
  partial: { label: "Parcial", variant: "warning" },
  no: { label: "Nao", variant: "destructive" },
  not_applicable: { label: "Nao aplicavel", variant: "secondary" },
};

const itemColumns: DataTableColumn<GovernanceComplianceItemSummary>[] = [
  {
    key: "capitulo",
    header: "Capitulo",
    render: (row) => (
      <div className="space-y-1">
        <p className="text-sm">{row.capitulo}</p>
        <p className="font-mono text-xs text-muted-foreground">{row.id_item}</p>
      </div>
    ),
  },
  {
    key: "principio",
    header: "Principio",
    render: (row) => (
      <p className="line-clamp-2 text-xs" title={row.principio}>
        {row.principio}
      </p>
    ),
  },
  {
    key: "pratica",
    header: "Pratica recomendada",
    render: (row) => (
      <p className="line-clamp-3 text-xs" title={row.pratica_recomendada}>
        {row.pratica_recomendada}
      </p>
    ),
  },
  {
    key: "adocao",
    header: "Adocao",
    render: (row) => {
      const badge =
        ADOPTION_BADGES[row.pratica_adotada_normalized] ?? {
          label: row.pratica_adotada_raw ?? row.pratica_adotada_normalized,
          variant: "default" as const,
        };
      return <Badge variant={badge.variant}>{badge.label}</Badge>;
    },
  },
  {
    key: "explicacao",
    header: "Explicacao",
    render: (row) =>
      row.explicacao ? (
        <p className="line-clamp-3 text-xs text-muted-foreground" title={row.explicacao}>
          {row.explicacao}
        </p>
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

export default function ICBGCReportDetailPage() {
  const searchParams = useSearchParams();
  const idDocumento = searchParams.get("id_documento") ?? "";

  const reportQuery = useQuery({
    queryKey: ["cvm", "icbgc", "report", idDocumento],
    queryFn: () => getICBGCReport(idDocumento),
  });

  const report = reportQuery.data;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardTitle>{report?.nome_empresarial ?? "Informe ICBGC"}</CardTitle>
              <CardDescription className="mt-1">
                <span className="font-mono">id_documento</span> {idDocumento}
              </CardDescription>
            </div>

            {report ? (
              <div className="flex flex-wrap items-center gap-2">
                <Badge>v{report.versao}</Badge>
                {report.cd_cvm !== null ? (
                  <Link
                    className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                    href={`/cvm/companies/detail?cd_cvm=${report.cd_cvm}`}
                  >
                    Ver no cadastro
                  </Link>
                ) : null}
                {report.link_download ? (
                  <a
                    className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                    href={report.link_download}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Documento na CVM ↗
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Identificacao do informe</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <DetailRow label="cd_cvm" value={report?.cd_cvm} mono />
          <DetailRow label="CNPJ" value={report?.cnpj_companhia} mono />
          <DetailRow label="Referencia" value={formatDate(report?.data_referencia)} />
          <DetailRow label="Entregue em" value={formatDate(report?.data_entrega)} />
          <DetailRow label="Motivo da reapresentacao" value={report?.motivo_reapresentacao} />
          <DetailRow
            label="Inicio do exercicio social"
            value={formatDate(report?.data_inicio_exercicio_social)}
          />
          <DetailRow
            label="Fim do exercicio social"
            value={formatDate(report?.data_fim_exercicio_social)}
          />
          <DetailRow label="Capturado em" value={formatDateTime(report?.captured_at)} />
          <DetailRow label="File hash" value={truncateHash(report?.file_version_hash, 10)} mono />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Praticas de governanca</CardTitle>
          <CardDescription>
            Adocao pratique-ou-explique item a item — {report?.items.length ?? 0} praticas reportadas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={itemColumns}
            data={report?.items ?? []}
            loading={reportQuery.isLoading}
            getRowKey={(row, index) => `${row.id_item}-${index}`}
            emptyMessage="Sem itens de pratica neste informe."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Raw data</CardTitle>
          <CardDescription>
            Payload original capturado do arquivo da CVM (append-only).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <JsonViewer value={report?.raw_data ?? {}} />
        </CardContent>
      </Card>
    </div>
  );
}
