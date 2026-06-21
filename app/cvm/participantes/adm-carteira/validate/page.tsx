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
import { listAdmCarteira } from "@/lib/services/admin/cvm-participantes";
import type { AdmCarteiraRegistrySummary } from "@/lib/services/admin/types";

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

export default function AdmCarteiraValidatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";
  const situacao = searchParams.get("situacao") ?? "";
  const categoriaRegistro = searchParams.get("categoria_registro") ?? "";

  const admCarteiraQuery = useQuery({
    queryKey: [
      "cvm",
      "participantes",
      "adm-carteira",
      "validate",
      { id, situacao, categoriaRegistro },
    ],
    queryFn: () =>
      listAdmCarteira({
        page: 1,
        page_size: 100,
        situacao: situacao || undefined,
        categoria_registro: categoriaRegistro || undefined,
      }),
    enabled: Boolean(id),
  });

  const admin: AdmCarteiraRegistrySummary | undefined = admCarteiraQuery.data?.items.find(
    (item) => item.id === id,
  );

  if (admCarteiraQuery.isLoading) {
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

  if (admCarteiraQuery.isError) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-sm text-destructive">
            Falha ao carregar o administrador de carteira: {admCarteiraQuery.error.message}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => admCarteiraQuery.refetch()}
          >
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!admin) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-sm text-muted-foreground">
            Administrador de carteira nao encontrado para o id informado.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => router.push("/cvm/participantes/adm-carteira")}
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
            onClick={() => router.push("/cvm/participantes/adm-carteira")}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Validacao de administrador de carteira</span>
              <ChevronRight className="size-3" />
              <span>{admin.categoria_registro}</span>
            </div>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
              {admin.denom_social}
            </h2>
            <p className="mt-1 max-w-xl text-xs text-muted-foreground">
              Conferencia por amostragem do registro cadastral. Marcar como valido nao altera o dado
              nem o app do usuario final — e metadado interno de QA.
            </p>
          </div>
        </div>

        <ValidationActionPanel
          reportType="participante_adm_carteira"
          reportRef={String(admin.id)}
          validation={admin.validation}
          invalidateKeys={[
            ["cvm", "participantes", "adm-carteira", "validate"],
            ["cvm", "participantes", "adm-carteira"],
          ]}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados cadastrais</CardTitle>
          <CardDescription>
            Campos do cadastro CVM de administradores de carteira de valores mobiliarios.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <DetailRow label="Denominacao social" value={admin.denom_social} />
          <DetailRow label="Denominacao comercial" value={admin.denom_comerc} />
          <DetailRow label="CNPJ" value={admin.cnpj} mono />
          <DetailRow label="Categoria de registro" value={admin.categoria_registro} />
          <DetailRow label="Subcategoria" value={admin.subcategoria_registro} />
          <DetailRow label="Situacao" value={admin.situacao} />
          <DetailRow label="Registrado em" value={formatDate(admin.dt_reg)} />
          <DetailRow label="Cancelado em" value={formatDate(admin.dt_cancel)} />
          <DetailRow label="Municipio" value={admin.municipio} />
          <DetailRow label="UF" value={admin.uf} />
          <DetailRow label="Capturado em" value={formatDateTime(admin.captured_at)} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4 text-xs text-muted-foreground">
          <span>
            id: <span className="font-mono text-foreground">{admin.id}</span>
          </span>
          <Badge variant="secondary">{admin.categoria_registro}</Badge>
        </CardContent>
      </Card>
    </div>
  );
}
