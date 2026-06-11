"use client";

import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { situacaoBadgeVariant } from "@/components/participantes-sync-cards";
import { formatDate, formatDateTime } from "@/lib/formatters";
import { getAuditor } from "@/lib/services/admin/cvm-participantes";

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

export default function AuditorDetailPage() {
  const searchParams = useSearchParams();
  const cdCvm = searchParams.get("cd_cvm") ?? "";
  const tipo = (searchParams.get("tipo") ?? "PJ") as "PJ" | "PF";

  const auditorQuery = useQuery({
    queryKey: ["cvm", "participantes", "auditor", cdCvm, tipo],
    queryFn: () => getAuditor(cdCvm, { tipo }),
  });

  const auditor = auditorQuery.data;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardTitle>{auditor?.nome ?? `Auditor ${cdCvm}`}</CardTitle>
              <CardDescription className="mt-1">
                Auditor independente · cd_cvm {cdCvm} · {tipo}
              </CardDescription>
            </div>

            {auditor ? (
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{auditor.tipo}</Badge>
                <Badge variant={situacaoBadgeVariant(auditor.situacao)}>{auditor.situacao}</Badge>
              </div>
            ) : null}
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Identificacao</CardTitle>
          <CardDescription>
            Registro mais recente do auditor no cadastro CVM de participantes do mercado.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <DetailRow label="cd_cvm" value={auditor?.cd_cvm} mono />
          <DetailRow label="Tipo" value={auditor?.tipo} />
          <DetailRow label="Nome" value={auditor?.nome} />
          <DetailRow label="CNPJ" value={auditor?.cnpj} mono />
          <DetailRow label="Situacao" value={auditor?.situacao} />
          <DetailRow label="Inicio da situacao" value={formatDate(auditor?.dt_ini_sit)} />
          <DetailRow label="Municipio" value={auditor?.municipio} />
          <DetailRow label="UF" value={auditor?.uf} />
          <DetailRow label="Capturado em" value={formatDateTime(auditor?.captured_at)} />
        </CardContent>
      </Card>
    </div>
  );
}
