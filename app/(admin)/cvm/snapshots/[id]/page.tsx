"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { JsonViewer } from "@/components/json-viewer";
import { formatDate, formatDateTime, truncateHash } from "@/lib/formatters";
import { getSnapshot } from "@/lib/services/admin/cvm-registry";

export default function SnapshotDetailPage() {
  const params = useParams<{ id: string }>();
  const snapshotQuery = useQuery({
    queryKey: ["cvm", "snapshot", params.id],
    queryFn: () => getSnapshot(params.id),
  });

  const snapshot = snapshotQuery.data;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{snapshot?.denom_social ?? "Snapshot CVM"}</CardTitle>
          <CardDescription>
            Capturado em {formatDateTime(snapshot?.captured_at)} · hash {truncateHash(snapshot?.file_version_hash, 8)}
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <SnapshotSection
          title="Identificacao"
          items={[
            ["cd_cvm", String(snapshot?.cd_cvm ?? "—")],
            ["CNPJ", snapshot?.cnpj_cia ?? "—"],
            ["Nome comercial", snapshot?.denom_comercial ?? "—"],
            ["Categoria", snapshot?.categoria_registro ?? "—"],
            ["Registro CVM", formatDate(snapshot?.dt_registro)],
            ["Constituicao", formatDate(snapshot?.dt_constituicao)],
          ]}
        />

        <SnapshotSection
          title="Status e governanca"
          items={[
            ["Situacao", snapshot?.situacao ?? "—"],
            ["Situacao emissor", snapshot?.situacao_emissor ?? "—"],
            ["Inicio situacao", formatDate(snapshot?.dt_ini_situacao)],
            ["Cancelamento", formatDate(snapshot?.dt_cancel)],
            ["Motivo", snapshot?.motivo_cancel ?? "—"],
            ["Controlador", snapshot?.controle_acionario ?? "—"],
          ]}
        />

        <SnapshotSection
          title="Endereco"
          items={[
            ["Logradouro", snapshot?.addr_logradouro ?? "—"],
            ["Complemento", snapshot?.addr_compl ?? "—"],
            ["Bairro", snapshot?.addr_bairro ?? "—"],
            ["Municipio", snapshot?.addr_municipio ?? "—"],
            ["UF", snapshot?.addr_uf ?? "—"],
            ["E-mail", snapshot?.addr_email ?? "—"],
          ]}
        />

        <SnapshotSection
          title="Responsavel"
          items={[
            ["Nome", snapshot?.resp_nome ?? "—"],
            ["Tipo", snapshot?.resp_tipo ?? "—"],
            ["Inicio", formatDate(snapshot?.resp_dt_inicio)],
            ["Municipio", snapshot?.resp_municipio ?? "—"],
            ["UF", snapshot?.resp_uf ?? "—"],
            ["E-mail", snapshot?.resp_email ?? "—"],
          ]}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>raw_data</CardTitle>
          <CardDescription>JSONB completo retornado pelo endpoint de detalhe.</CardDescription>
        </CardHeader>
        <CardContent>
          <JsonViewer value={snapshot?.raw_data ?? {}} />
        </CardContent>
      </Card>
    </div>
  );
}

function SnapshotSection({
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
