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
import { listAuditores } from "@/lib/services/admin/cvm-participantes";
import type { AuditorRegistrySummary } from "@/lib/services/admin/types";

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

export default function AuditorValidatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";
  // `situacao`/`tipo` apenas estreitam a busca na lista (nao ha endpoint de
  // detalhe por id de registro); o `id` UUID e a chave de validacao (ref).
  const situacao = searchParams.get("situacao") ?? "";
  const tipo = searchParams.get("tipo") ?? "";

  const auditoresQuery = useQuery({
    queryKey: ["cvm", "participantes", "auditores", "validate", { id, situacao, tipo }],
    queryFn: () =>
      listAuditores({
        page: 1,
        page_size: 100,
        situacao: situacao || undefined,
        tipo: tipo ? (tipo as "PJ" | "PF") : undefined,
      }),
    enabled: Boolean(id),
  });

  const auditor: AuditorRegistrySummary | undefined = auditoresQuery.data?.items.find(
    (item) => item.id === id,
  );

  if (auditoresQuery.isLoading) {
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

  if (auditoresQuery.isError) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-sm text-destructive">
            Falha ao carregar o auditor: {auditoresQuery.error.message}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => auditoresQuery.refetch()}
          >
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!auditor) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-sm text-muted-foreground">
            Auditor nao encontrado para o id informado.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => router.push("/cvm/participantes/auditores")}
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
            onClick={() => router.push("/cvm/participantes/auditores")}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Validacao de auditor independente</span>
              <ChevronRight className="size-3" />
              <span>{auditor.tipo}</span>
            </div>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
              {auditor.nome}
            </h2>
            <p className="mt-1 max-w-xl text-xs text-muted-foreground">
              Conferencia por amostragem do registro cadastral. Marcar como valido nao altera o dado
              nem o app do usuario final — e metadado interno de QA.
            </p>
          </div>
        </div>

        <ValidationActionPanel
          reportType="participante_auditor"
          reportRef={String(auditor.id)}
          validation={auditor.validation}
          invalidateKeys={[
            ["cvm", "participantes", "auditores", "validate"],
            ["cvm", "participantes", "auditores"],
          ]}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados cadastrais</CardTitle>
          <CardDescription>Campos do cadastro CVM de auditores independentes.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <DetailRow label="Nome" value={auditor.nome} />
          <DetailRow label="Tipo" value={auditor.tipo} />
          <DetailRow label="cd_cvm" value={auditor.cd_cvm} />
          <DetailRow label="CNPJ" value={auditor.cnpj} mono />
          <DetailRow label="Situacao" value={auditor.situacao} />
          <DetailRow label="Inicio da situacao" value={formatDate(auditor.dt_ini_sit)} />
          <DetailRow label="Municipio" value={auditor.municipio} />
          <DetailRow label="UF" value={auditor.uf} />
          <DetailRow label="Capturado em" value={formatDateTime(auditor.captured_at)} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4 text-xs text-muted-foreground">
          <span>
            id: <span className="font-mono text-foreground">{auditor.id}</span>
          </span>
          <Badge variant="secondary">{auditor.tipo}</Badge>
        </CardContent>
      </Card>
    </div>
  );
}
