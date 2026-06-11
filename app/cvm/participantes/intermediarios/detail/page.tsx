"use client";

import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { situacaoBadgeVariant } from "@/components/participantes-sync-cards";
import { formatDate, formatDateTime } from "@/lib/formatters";
import { getIntermediario } from "@/lib/services/admin/cvm-participantes";

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

export default function IntermediarioDetailPage() {
  const searchParams = useSearchParams();
  const cnpj = searchParams.get("cnpj") ?? "";

  const intermediarioQuery = useQuery({
    queryKey: ["cvm", "participantes", "intermediario", cnpj],
    queryFn: () => getIntermediario(cnpj),
  });

  const intermediario = intermediarioQuery.data;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardTitle>{intermediario?.denom_social ?? `Intermediario ${cnpj}`}</CardTitle>
              <CardDescription className="mt-1">
                Intermediario · CNPJ {cnpj}
              </CardDescription>
            </div>

            {intermediario ? (
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{intermediario.tipo_participante}</Badge>
                <Badge variant={situacaoBadgeVariant(intermediario.situacao)}>
                  {intermediario.situacao}
                </Badge>
              </div>
            ) : null}
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Identificacao</CardTitle>
          <CardDescription>
            Registro mais recente do intermediario no cadastro CVM de participantes do mercado.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <DetailRow label="CNPJ" value={intermediario?.cnpj} mono />
          <DetailRow label="cd_cvm" value={intermediario?.cd_cvm} mono />
          <DetailRow label="Tipo de participante" value={intermediario?.tipo_participante} />
          <DetailRow label="Denominacao social" value={intermediario?.denom_social} />
          <DetailRow label="Denominacao comercial" value={intermediario?.denom_comerc} />
          <DetailRow label="Situacao" value={intermediario?.situacao} />
          <DetailRow label="Registrado em" value={formatDate(intermediario?.dt_reg)} />
          <DetailRow label="Cancelado em" value={formatDate(intermediario?.dt_cancel)} />
          <DetailRow label="Motivo do cancelamento" value={intermediario?.motivo_cancel} />
          <DetailRow label="Setor de atividade" value={intermediario?.setor_ativ} />
          <DetailRow label="Municipio" value={intermediario?.municipio} />
          <DetailRow label="UF" value={intermediario?.uf} />
          <DetailRow label="Capturado em" value={formatDateTime(intermediario?.captured_at)} />
        </CardContent>
      </Card>
    </div>
  );
}
