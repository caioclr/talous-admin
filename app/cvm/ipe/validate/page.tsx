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
import { formatDate, formatDateTime, truncateHash } from "@/lib/formatters";
import { getIPEDisclosure } from "@/lib/services/admin/cvm-ipe";

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

export default function IPEValidatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";

  const disclosureQuery = useQuery({
    queryKey: ["cvm", "ipe", "detail", id],
    queryFn: () => getIPEDisclosure(id),
    enabled: Boolean(id),
  });

  const disclosure = disclosureQuery.data;

  if (disclosureQuery.isLoading) {
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

  if (disclosureQuery.isError) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-sm text-destructive">
            Falha ao carregar o disclosure: {disclosureQuery.error.message}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => disclosureQuery.refetch()}
          >
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!disclosure) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-sm text-muted-foreground">
            Disclosure IPE nao encontrado para o id informado.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => router.push("/cvm/ipe")}
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
            onClick={() => router.push("/cvm/ipe")}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Validacao de disclosure IPE</span>
              <ChevronRight className="size-3" />
              <span>{formatDate(disclosure.data_entrega)}</span>
            </div>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
              {disclosure.nome_companhia}
            </h2>
            <p className="mt-1 max-w-xl text-xs text-muted-foreground">
              Conferencia por amostragem do fato relevante / comunicado ao mercado. Marcar como
              valido nao altera o dado nem o app do usuario final — e metadado interno de QA.
            </p>
          </div>
        </div>

        <ValidationActionPanel
          reportType="ipe"
          reportRef={String(disclosure.id)}
          validation={disclosure.validation}
          invalidateKeys={[
            ["cvm", "ipe", "detail", id],
            ["cvm", "ipe", "disclosures"],
          ]}
        />
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4 text-xs text-muted-foreground">
          <span>
            id: <span className="font-mono text-foreground">{disclosure.id}</span>
          </span>
          <span>
            cd_cvm: <span className="text-foreground">{disclosure.cd_cvm}</span>
          </span>
          <span>
            protocolo: <span className="font-mono text-foreground">{disclosure.protocolo_entrega}</span>
          </span>
          <span>
            versao: <span className="text-foreground">v{disclosure.versao}</span>
          </span>
          <Badge>{disclosure.categoria}</Badge>
          {disclosure.signal_classification ? (
            <Badge
              variant={
                disclosure.signal_classification === "material_fact" ? "destructive" : "secondary"
              }
            >
              {disclosure.signal_classification}
            </Badge>
          ) : null}
          <Link
            className="font-medium text-primary underline-offset-4 hover:underline"
            href={`/cvm/ipe/disclosures/detail?id=${encodeURIComponent(disclosure.id)}`}
          >
            Ver disclosure completo
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assunto e categoria</CardTitle>
          <CardDescription>
            Conteudo declarado pela companhia — base legivel da conferencia.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <DetailRow label="Assunto" value={disclosure.assunto} />
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <DetailRow label="Categoria" value={disclosure.categoria} />
            <DetailRow label="Tipo" value={disclosure.tipo} />
            <DetailRow label="Especie" value={disclosure.especie} />
            <DetailRow label="Tipo apresentacao" value={disclosure.tipo_apresentacao} />
            <DetailRow label="Sinal" value={disclosure.signal_classification} />
            <DetailRow
              label="Notificado"
              value={disclosure.notification_dispatched ? "Sim" : "Pendente"}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Entrega e processamento</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <DetailRow label="Data entrega" value={formatDate(disclosure.data_entrega)} />
          <DetailRow label="Data referencia" value={formatDate(disclosure.data_referencia)} />
          <DetailRow label="Capturado em" value={formatDateTime(disclosure.captured_at)} />
          <DetailRow label="Processado em" value={formatDateTime(disclosure.processed_at)} />
          <DetailRow label="CNPJ" value={disclosure.cnpj_cia} mono />
          <DetailRow label="File hash" value={truncateHash(disclosure.file_version_hash, 10)} mono />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>raw_data</CardTitle>
          <CardDescription>Payload bruto persistido no backend.</CardDescription>
        </CardHeader>
        <CardContent>
          <JsonViewer value={disclosure.raw_data ?? {}} />
        </CardContent>
      </Card>
    </div>
  );
}
