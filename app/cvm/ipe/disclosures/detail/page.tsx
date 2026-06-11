"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { JsonViewer } from "@/components/json-viewer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatDateTime, truncateHash } from "@/lib/formatters";
import { getIPEDisclosure } from "@/lib/services/admin/cvm-ipe";

export default function IPEDisclosureDetailPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";
  const disclosureQuery = useQuery({
    queryKey: ["cvm", "ipe", "detail", id],
    queryFn: () => getIPEDisclosure(id),
  });

  const disclosure = disclosureQuery.data;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardTitle>{disclosure?.nome_companhia ?? "Disclosure IPE"}</CardTitle>
              <CardDescription className="mt-1">
                {disclosure?.assunto ?? "Carregando assunto..."}
              </CardDescription>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge>{disclosure?.categoria ?? "—"}</Badge>
              <Badge variant={disclosure?.notification_dispatched ? "success" : "warning"}>
                {disclosure?.notification_dispatched ? "Notificado" : "Pendente"}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <DisclosureSection
          title="Metadados"
          items={[
            ["cd_cvm", String(disclosure?.cd_cvm ?? "—")],
            ["CNPJ", disclosure?.cnpj_cia ?? "—"],
            ["Categoria", disclosure?.categoria ?? "—"],
            ["Tipo", disclosure?.tipo ?? "—"],
            ["Especie", disclosure?.especie ?? "—"],
            ["Tipo apresentacao", disclosure?.tipo_apresentacao ?? "—"],
          ]}
        />

        <DisclosureSection
          title="Entrega e processamento"
          items={[
            ["Data entrega", formatDate(disclosure?.data_entrega)],
            ["Data referencia", formatDate(disclosure?.data_referencia)],
            ["Capturado em", formatDateTime(disclosure?.captured_at)],
            ["Processado em", formatDateTime(disclosure?.processed_at)],
            ["Versao", String(disclosure?.versao ?? "—")],
            ["Hash", truncateHash(disclosure?.file_version_hash, 10)],
          ]}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contexto operacional</CardTitle>
          <CardDescription>
            Acesso rapido ao historico da empresa e ao arquivo original.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {disclosure?.cd_cvm ? (
            <Link
              href={`/cvm/ipe/companies/detail?cd_cvm=${disclosure.cd_cvm}`}
              className="rounded-2xl border border-border bg-background/70 px-4 py-3 text-sm font-medium text-foreground transition hover:bg-muted/40"
            >
              Ver historico da empresa
            </Link>
          ) : null}

          {disclosure?.link_download ? (
            <a
              href={disclosure.link_download}
              target="_blank"
              rel="noreferrer"
              className="rounded-2xl border border-border bg-background/70 px-4 py-3 text-sm font-medium text-foreground transition hover:bg-muted/40"
            >
              Abrir link de download
            </a>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>raw_data</CardTitle>
          <CardDescription>Payload bruto persistido no backend.</CardDescription>
        </CardHeader>
        <CardContent>
          <JsonViewer value={disclosure?.raw_data ?? {}} />
        </CardContent>
      </Card>
    </div>
  );
}

function DisclosureSection({
  title,
  items,
}: {
  title: string;
  items: Array<[string, string]>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {items.map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl border border-border/80 bg-background/70 px-4 py-3"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {label}
            </p>
            <p className="mt-1 text-sm text-foreground">{value}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
