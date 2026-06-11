"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { JsonViewer } from "@/components/json-viewer";
import { formatDate, formatDateTime, formatDecimal, truncateHash } from "@/lib/formatters";
import { getCapitalCompositionSnapshot } from "@/lib/services/admin/cvm-capital-composition";

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

export default function CapitalCompositionSnapshotDetailPage() {
  const params = useParams<{ id: string }>();
  const snapshotQuery = useQuery({
    queryKey: ["cvm", "capital-composition", "snapshot", params.id],
    queryFn: () => getCapitalCompositionSnapshot(params.id),
  });

  const snap = snapshotQuery.data;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardTitle>{snap?.denom_cia ?? "Snapshot de composicao"}</CardTitle>
              <CardDescription className="mt-1">
                {snap ? `${formatDate(snap.reference_date)} · v${snap.versao}` : "Carregando..."}
              </CardDescription>
            </div>

            {snap ? (
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{snap.source.toUpperCase()}</Badge>
                <Badge variant="secondary">{snap.period_type}</Badge>
                <Link
                  className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                  href={`/cvm/capital-composition?cdCvm=${snap.cd_cvm}`}
                >
                  Ver historico (cd_cvm {snap.cd_cvm})
                </Link>
              </div>
            ) : null}
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quantidades</CardTitle>
          <CardDescription>
            Detalhamento ON / PN para integralizacao e tesouraria.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <DetailRow
            label="ON integralizado"
            value={formatDecimal(snap?.qt_on_integralized, { maximumFractionDigits: 0 })}
            mono
          />
          <DetailRow
            label="PN integralizado"
            value={formatDecimal(snap?.qt_pn_integralized, { maximumFractionDigits: 0 })}
            mono
          />
          <DetailRow
            label="ON tesouraria"
            value={formatDecimal(snap?.qt_on_treasury, { maximumFractionDigits: 0 })}
            mono
          />
          <DetailRow
            label="PN tesouraria"
            value={formatDecimal(snap?.qt_pn_treasury, { maximumFractionDigits: 0 })}
            mono
          />
          <DetailRow
            label="Total integralizado"
            value={formatDecimal(snap?.qt_total_integralized, { maximumFractionDigits: 0 })}
            mono
          />
          <DetailRow
            label="Total tesouraria"
            value={formatDecimal(snap?.qt_total_treasury, { maximumFractionDigits: 0 })}
            mono
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Identificacao</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <DetailRow label="cd_cvm" value={snap?.cd_cvm} mono />
          <DetailRow label="CNPJ" value={snap?.cnpj_cia} mono />
          <DetailRow label="Reference date" value={formatDate(snap?.reference_date)} />
          <DetailRow label="Versao" value={snap?.versao} />
          <DetailRow label="Source" value={snap?.source} />
          <DetailRow label="Period type" value={snap?.period_type} />
          <DetailRow label="Capturado em" value={formatDateTime(snap?.captured_at)} />
          <DetailRow label="File hash" value={truncateHash(snap?.file_version_hash, 10)} mono />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>raw_data</CardTitle>
          <CardDescription>Linha bruta do CSV CVM preservada para auditoria.</CardDescription>
        </CardHeader>
        <CardContent>
          {snap ? <JsonViewer value={snap.raw_data} /> : (
            <p className="text-sm text-muted-foreground">Carregando snapshot...</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
