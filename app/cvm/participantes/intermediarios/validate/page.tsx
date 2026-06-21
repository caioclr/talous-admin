"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ValidationActionPanel } from "@/components/validation";
import { formatDate, formatDateTime } from "@/lib/formatters";
import { listIntermediarios } from "@/lib/services/admin/cvm-participantes";
import type { IntermediarioRegistrySummary } from "@/lib/services/admin/types";

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

export default function IntermediarioValidatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";
  const situacao = searchParams.get("situacao") ?? "";
  const tipoParticipante = searchParams.get("tipo_participante") ?? "";

  const intermediariosQuery = useQuery({
    queryKey: [
      "cvm",
      "participantes",
      "intermediarios",
      "validate",
      { id, situacao, tipoParticipante },
    ],
    queryFn: () =>
      listIntermediarios({
        page: 1,
        page_size: 100,
        situacao: situacao || undefined,
        tipo_participante: tipoParticipante || undefined,
      }),
    enabled: Boolean(id),
  });

  const intermediario: IntermediarioRegistrySummary | undefined =
    intermediariosQuery.data?.items.find((item) => item.id === id);

  if (intermediariosQuery.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-64" />
        <Card>
          <CardContent className="space-y-3 py-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-6 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (intermediariosQuery.isError) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-sm text-destructive">
            Falha ao carregar o intermediario: {intermediariosQuery.error.message}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => intermediariosQuery.refetch()}
          >
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!intermediario) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-sm text-muted-foreground">
            Intermediario nao encontrado para o id informado.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => router.push("/cvm/participantes/intermediarios")}
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
            onClick={() => router.push("/cvm/participantes/intermediarios")}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Validacao de intermediario</span>
              <ChevronRight className="size-3" />
              <span>{intermediario.tipo_participante}</span>
            </div>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
              {intermediario.denom_social}
            </h2>
            <p className="mt-1 max-w-xl text-xs text-muted-foreground">
              Conferencia por amostragem do registro cadastral. Marcar como valido nao altera o dado
              nem o app do usuario final — e metadado interno de QA.
            </p>
          </div>
        </div>

        <ValidationActionPanel
          reportType="participante_intermediario"
          reportRef={String(intermediario.id)}
          validation={intermediario.validation}
          invalidateKeys={[
            ["cvm", "participantes", "intermediarios", "validate"],
            ["cvm", "participantes", "intermediarios"],
          ]}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados cadastrais</CardTitle>
          <CardDescription>Campos do cadastro CVM de intermediarios.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <DetailRow label="Denominacao social" value={intermediario.denom_social} />
          <DetailRow label="Denominacao comercial" value={intermediario.denom_comerc} />
          <DetailRow label="CNPJ" value={intermediario.cnpj} mono />
          <DetailRow label="cd_cvm" value={intermediario.cd_cvm} />
          <DetailRow label="Tipo de participante" value={intermediario.tipo_participante} />
          <DetailRow label="Situacao" value={intermediario.situacao} />
          <DetailRow label="Registrado em" value={formatDate(intermediario.dt_reg)} />
          <DetailRow label="Cancelado em" value={formatDate(intermediario.dt_cancel)} />
          <DetailRow label="Motivo cancelamento" value={intermediario.motivo_cancel} />
          <DetailRow label="Setor de atividade" value={intermediario.setor_ativ} />
          <DetailRow label="Municipio" value={intermediario.municipio} />
          <DetailRow label="UF" value={intermediario.uf} />
          <DetailRow label="Capturado em" value={formatDateTime(intermediario.captured_at)} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4 text-xs text-muted-foreground">
          <span>
            id: <span className="font-mono text-foreground">{intermediario.id}</span>
          </span>
          <Badge variant="secondary">{intermediario.tipo_participante}</Badge>
        </CardContent>
      </Card>
    </div>
  );
}
