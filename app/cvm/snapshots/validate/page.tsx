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
import { getSnapshot } from "@/lib/services/admin/cvm-registry";

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

export default function SnapshotValidatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";

  const snapshotQuery = useQuery({
    queryKey: ["cvm", "snapshot", id],
    queryFn: () => getSnapshot(id),
    enabled: Boolean(id),
  });

  const snapshot = snapshotQuery.data;

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

  if (!snapshot) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-sm text-muted-foreground">
            Snapshot cadastral nao encontrado para o id informado.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => router.push("/cvm/snapshots")}
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
            onClick={() => router.push("/cvm/snapshots")}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Validacao de snapshot cadastral</span>
              <ChevronRight className="size-3" />
              <span>{formatDateTime(snapshot.captured_at)}</span>
            </div>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
              {snapshot.denom_social}
            </h2>
            <p className="mt-1 max-w-xl text-xs text-muted-foreground">
              Conferencia por amostragem do snapshot do cadastro CVM (dados cadastrais legiveis).
              Marcar como valido nao altera o dado nem o app do usuario final — e metadado interno de QA.
            </p>
          </div>
        </div>

        <ValidationActionPanel
          reportType="registry"
          reportRef={String(snapshot.id)}
          validation={snapshot.validation}
          invalidateKeys={[
            ["cvm", "snapshot", id],
            ["cvm", "snapshots"],
          ]}
        />
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4 text-xs text-muted-foreground">
          <span>
            id: <span className="font-mono text-foreground">{snapshot.id}</span>
          </span>
          <span>
            cd_cvm: <span className="text-foreground">{snapshot.cd_cvm}</span>
          </span>
          <span>
            CNPJ: <span className="font-mono text-foreground">{snapshot.cnpj_cia}</span>
          </span>
          <Badge>{snapshot.categoria_registro}</Badge>
          <Badge variant="secondary">{snapshot.tipo_mercado}</Badge>
          <Link
            className="font-medium text-primary underline-offset-4 hover:underline"
            href={`/cvm/companies/detail?cd_cvm=${snapshot.cd_cvm}`}
          >
            Ir para empresa
          </Link>
          <Link
            className="font-medium text-primary underline-offset-4 hover:underline"
            href={`/cvm/snapshots/detail?id=${snapshot.id}`}
          >
            Ver snapshot completo
          </Link>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Identificacao</CardTitle>
            <CardDescription>Base legivel da conferencia cadastral.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <DetailRow label="Razao social" value={snapshot.denom_social} />
            <DetailRow label="Nome comercial" value={snapshot.denom_comercial} />
            <DetailRow label="CNPJ" value={snapshot.cnpj_cia} mono />
            <DetailRow label="Categoria de registro" value={snapshot.categoria_registro} />
            <DetailRow label="Registro CVM" value={formatDate(snapshot.dt_registro)} />
            <DetailRow label="Constituicao" value={formatDate(snapshot.dt_constituicao)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status e governanca</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <DetailRow label="Situacao" value={snapshot.situacao} />
            <DetailRow label="Situacao emissor" value={snapshot.situacao_emissor} />
            <DetailRow label="Inicio situacao" value={formatDate(snapshot.dt_ini_situacao)} />
            <DetailRow label="Cancelamento" value={formatDate(snapshot.dt_cancel)} />
            <DetailRow label="Motivo cancelamento" value={snapshot.motivo_cancel} />
            <DetailRow label="Controlador" value={snapshot.controle_acionario} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Endereco</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <DetailRow label="Logradouro" value={snapshot.addr_logradouro} />
            <DetailRow label="Complemento" value={snapshot.addr_compl} />
            <DetailRow label="Bairro" value={snapshot.addr_bairro} />
            <DetailRow label="Municipio" value={snapshot.addr_municipio} />
            <DetailRow label="UF" value={snapshot.addr_uf} />
            <DetailRow label="E-mail" value={snapshot.addr_email} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Responsavel</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <DetailRow label="Nome" value={snapshot.resp_nome} />
            <DetailRow label="Tipo" value={snapshot.resp_tipo} />
            <DetailRow label="Inicio" value={formatDate(snapshot.resp_dt_inicio)} />
            <DetailRow label="Municipio" value={snapshot.resp_municipio} />
            <DetailRow label="UF" value={snapshot.resp_uf} />
            <DetailRow label="E-mail" value={snapshot.resp_email} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Auditoria e hash</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <DetailRow label="Setor atividade" value={snapshot.setor_atividade} />
          <DetailRow label="Auditor" value={snapshot.auditor} />
          <DetailRow label="CNPJ auditor" value={snapshot.cnpj_auditor} mono />
          <DetailRow label="Capturado em" value={formatDateTime(snapshot.captured_at)} />
          <DetailRow label="File hash" value={truncateHash(snapshot.file_version_hash, 10)} mono />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>raw_data</CardTitle>
          <CardDescription>JSONB completo retornado pelo endpoint de detalhe.</CardDescription>
        </CardHeader>
        <CardContent>
          <JsonViewer value={snapshot.raw_data ?? {}} />
        </CardContent>
      </Card>
    </div>
  );
}
