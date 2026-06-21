"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ValidationActionPanel } from "@/components/validation";
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
  not_applicable: { label: "N.A.", variant: "secondary" },
};

function adoptionBadge(item: GovernanceComplianceItemSummary) {
  return (
    ADOPTION_BADGES[item.pratica_adotada_normalized] ?? {
      label: item.pratica_adotada_raw ?? item.pratica_adotada_normalized,
      variant: "default" as const,
    }
  );
}

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

function ComplianceItemCard({ item }: { item: GovernanceComplianceItemSummary }) {
  const badge = adoptionBadge(item);
  return (
    <div className="rounded-2xl border border-border/80 bg-background/70 px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <p className="font-mono text-xs text-muted-foreground">{item.id_item}</p>
        <Badge variant={badge.variant}>{badge.label}</Badge>
      </div>
      <p className="mt-2 text-sm font-medium text-foreground">{item.principio}</p>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Pratica recomendada
          </p>
          <p className="mt-1 text-sm text-foreground">{item.pratica_recomendada}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Pratica adotada
          </p>
          <p className="mt-1 text-sm text-foreground">
            {item.pratica_adotada_raw ?? "—"}
          </p>
          {item.explicacao ? (
            <p className="mt-2 text-xs text-muted-foreground">{item.explicacao}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function ICBGCValidatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idDocumento = searchParams.get("id_documento") ?? "";

  const reportQuery = useQuery({
    queryKey: ["cvm", "icbgc", "report", idDocumento],
    queryFn: () => getICBGCReport(idDocumento),
    enabled: Boolean(idDocumento),
  });

  const report = reportQuery.data;

  // Agrupa por capitulo para leitura por amostragem; nada e calculado, so agrupado.
  const grouped = useMemo(() => {
    const map = new Map<string, GovernanceComplianceItemSummary[]>();
    for (const item of report?.items ?? []) {
      const list = map.get(item.capitulo) ?? [];
      list.push(item);
      map.set(item.capitulo, list);
    }
    return Array.from(map.entries());
  }, [report]);

  if (reportQuery.isLoading) {
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

  if (reportQuery.isError) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-sm text-destructive">
            Falha ao carregar o informe ICBGC: {reportQuery.error.message}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => reportQuery.refetch()}
          >
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!report) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-sm text-muted-foreground">
            Informe ICBGC nao encontrado para o id_documento informado.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => router.push("/cvm/icbgc")}
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
            onClick={() => router.push("/cvm/icbgc")}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Validacao de ICBGC</span>
              <ChevronRight className="size-3" />
              <span>{formatDate(report.data_referencia)}</span>
            </div>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
              {report.nome_empresarial}
            </h2>
            <p className="mt-1 max-w-xl text-xs text-muted-foreground">
              Conferencia por amostragem dos itens de conformidade pratique-ou-explique. Marcar como
              valido nao altera o dado nem o app do usuario final — e metadado interno de QA.
            </p>
          </div>
        </div>

        <ValidationActionPanel
          reportType="icbgc"
          reportRef={String(report.id_documento)}
          validation={report.validation}
          invalidateKeys={[
            ["cvm", "icbgc", "report", idDocumento],
            ["cvm", "icbgc", "reports"],
          ]}
        />
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4 text-xs text-muted-foreground">
          <span>
            id_documento: <span className="font-mono text-foreground">{report.id_documento}</span>
          </span>
          <span>
            cd_cvm: <span className="text-foreground">{report.cd_cvm ?? "—"}</span>
          </span>
          <span>
            CNPJ: <span className="font-mono text-foreground">{report.cnpj_companhia}</span>
          </span>
          <span>
            versao: <span className="text-foreground">v{report.versao}</span>
          </span>
          {report.cd_cvm !== null ? (
            <Link
              className="font-medium text-primary underline-offset-4 hover:underline"
              href={`/cvm/companies/detail?cd_cvm=${report.cd_cvm}`}
            >
              Ir para empresa
            </Link>
          ) : null}
          <Link
            className="font-medium text-primary underline-offset-4 hover:underline"
            href={`/cvm/icbgc/reports/detail?id_documento=${report.id_documento}`}
          >
            Ver informe completo
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Identificacao do informe</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <DetailRow label="Referencia" value={formatDate(report.data_referencia)} />
          <DetailRow label="Entregue em" value={formatDate(report.data_entrega)} />
          <DetailRow label="Motivo da reapresentacao" value={report.motivo_reapresentacao} />
          <DetailRow
            label="Inicio do exercicio social"
            value={formatDate(report.data_inicio_exercicio_social)}
          />
          <DetailRow
            label="Fim do exercicio social"
            value={formatDate(report.data_fim_exercicio_social)}
          />
          <DetailRow label="Capturado em" value={formatDateTime(report.captured_at)} />
          <DetailRow label="File hash" value={truncateHash(report.file_version_hash, 10)} mono />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Itens de conformidade</CardTitle>
          <CardDescription>
            Adocao pratique-ou-explique item a item — {report.items.length} praticas reportadas,
            agrupadas por capitulo.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {grouped.length > 0 ? (
            grouped.map(([capitulo, items]) => (
              <div key={capitulo} className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">{capitulo}</h3>
                  <Badge variant="secondary">{items.length}</Badge>
                </div>
                <div className="grid gap-3">
                  {items.map((item, index) => (
                    <ComplianceItemCard key={`${item.id_item}-${index}`} item={item} />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Sem itens de pratica neste informe.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
