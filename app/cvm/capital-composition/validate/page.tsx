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
import { ValidationActionPanel } from "@/components/validation";
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

export default function CapitalCompositionValidatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";

  const snapshotQuery = useQuery({
    queryKey: ["cvm", "capital-composition", "snapshot", id],
    queryFn: () => getCapitalCompositionSnapshot(id),
    enabled: Boolean(id),
  });

  const snap = snapshotQuery.data;

  if (snapshotQuery.isLoading) {
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

  if (snapshotQuery.isError) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-sm text-destructive">
            Falha ao carregar o snapshot: {snapshotQuery.error.message}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => snapshotQuery.refetch()}
          >
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!snap) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-sm text-muted-foreground">
            Snapshot de composicao nao encontrado para o id informado.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => router.push("/cvm/capital-composition")}
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
            onClick={() => router.push("/cvm/capital-composition")}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Validacao de composicao de capital</span>
              <ChevronRight className="size-3" />
              <span>{formatDate(snap.reference_date)}</span>
            </div>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
              {snap.denom_cia}
            </h2>
            <p className="mt-1 max-w-xl text-xs text-muted-foreground">
              Conferencia por amostragem do snapshot de shares outstanding ON/PN + tesouraria. Marcar
              como valido nao altera o dado nem o app do usuario final — e metadado interno de QA.
            </p>
          </div>
        </div>

        <ValidationActionPanel
          reportType="capital"
          reportRef={String(snap.id)}
          validation={snap.validation}
          invalidateKeys={[
            ["cvm", "capital-composition", "snapshot", id],
            ["cvm", "capital-composition", "snapshots"],
          ]}
        />
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4 text-xs text-muted-foreground">
          <span>
            id: <span className="font-mono text-foreground">{snap.id}</span>
          </span>
          <span>
            cd_cvm: <span className="text-foreground">{snap.cd_cvm}</span>
          </span>
          <span>
            CNPJ: <span className="font-mono text-foreground">{snap.cnpj_cia}</span>
          </span>
          <span>
            versao: <span className="text-foreground">v{snap.versao}</span>
          </span>
          <Badge>{snap.source.toUpperCase()}</Badge>
          <Badge variant="secondary">{snap.period_type}</Badge>
          <Link
            className="font-medium text-primary underline-offset-4 hover:underline"
            href={`/cvm/companies/detail?cd_cvm=${snap.cd_cvm}`}
          >
            Ir para empresa
          </Link>
          <Link
            className="font-medium text-primary underline-offset-4 hover:underline"
            href={`/cvm/capital-composition/snapshots/detail?id=${snap.id}`}
          >
            Ver snapshot completo
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quantidades</CardTitle>
          <CardDescription>
            Detalhamento ON / PN para integralizacao e tesouraria — base do free float usado no
            valuation.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <DetailRow
            label="ON integralizado"
            value={formatDecimal(snap.qt_on_integralized, { maximumFractionDigits: 0 })}
            mono
          />
          <DetailRow
            label="PN integralizado"
            value={formatDecimal(snap.qt_pn_integralized, { maximumFractionDigits: 0 })}
            mono
          />
          <DetailRow
            label="ON tesouraria"
            value={formatDecimal(snap.qt_on_treasury, { maximumFractionDigits: 0 })}
            mono
          />
          <DetailRow
            label="PN tesouraria"
            value={formatDecimal(snap.qt_pn_treasury, { maximumFractionDigits: 0 })}
            mono
          />
          <DetailRow
            label="Total integralizado"
            value={formatDecimal(snap.qt_total_integralized, { maximumFractionDigits: 0 })}
            mono
          />
          <DetailRow
            label="Total tesouraria"
            value={formatDecimal(snap.qt_total_treasury, { maximumFractionDigits: 0 })}
            mono
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Identificacao</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <DetailRow label="Reference date" value={formatDate(snap.reference_date)} />
          <DetailRow label="Source" value={snap.source} />
          <DetailRow label="Period type" value={snap.period_type} />
          <DetailRow label="Capturado em" value={formatDateTime(snap.captured_at)} />
          <DetailRow label="File hash" value={truncateHash(snap.file_version_hash, 10)} mono />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>raw_data</CardTitle>
          <CardDescription>Linha bruta do CSV CVM preservada para auditoria.</CardDescription>
        </CardHeader>
        <CardContent>
          <JsonViewer value={snap.raw_data} />
        </CardContent>
      </Card>
    </div>
  );
}
