"use client";

import { useQuery } from "@tanstack/react-query";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/formatters";
import { getParticipantesSyncStatus } from "@/lib/services/admin/cvm-participantes";

/**
 * Situacoes vem da CVM com capitalizacoes diferentes por dataset
 * ("ATIVO", "Ativo", "CANCELADA", "Cancelada"...) — normaliza antes de mapear.
 */
export function situacaoBadgeVariant(
  situacao: string | null | undefined,
): NonNullable<BadgeProps["variant"]> {
  const normalized = (situacao ?? "").toUpperCase();

  if (normalized.includes("CANCELADA")) {
    return "destructive";
  }
  if (normalized.includes("SUSPENSO")) {
    return "warning";
  }
  if (normalized.includes("ATIVO")) {
    return "success";
  }
  return "secondary";
}

function BreakdownRow({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/70 px-3 py-1.5">
      <span className="truncate text-xs text-muted-foreground" title={label}>
        {label}
      </span>
      <span className="font-mono text-sm text-foreground">{count}</span>
    </div>
  );
}

/**
 * Cards consolidados de /admin/cvm/participantes/sync-status, exibidos no topo
 * das tres listas de participantes (auditores, intermediarios, adm. carteira).
 * A queryKey e compartilhada para reusar o cache entre as paginas.
 */
export function ParticipantesSyncCards() {
  const syncStatusQuery = useQuery({
    queryKey: ["cvm", "participantes", "sync-status"],
    queryFn: getParticipantesSyncStatus,
  });

  const status = syncStatusQuery.data;

  return (
    <div className="grid gap-3 md:grid-cols-3">
      <Card className="metric-tile">
        <CardHeader>
          <CardDescription>
            Auditores · {formatDateTime(status?.auditor_last_captured_at)}
          </CardDescription>
          <CardTitle>{status?.auditor_total ?? "—"}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Badge variant="success">Ativos {status?.auditor_ativo ?? "—"}</Badge>
          <Badge variant="warning">Suspensos {status?.auditor_suspenso ?? "—"}</Badge>
          <Badge variant="destructive">Cancelados {status?.auditor_cancelada ?? "—"}</Badge>
        </CardContent>
      </Card>

      <Card className="metric-tile">
        <CardHeader>
          <CardDescription>
            Intermediarios · {formatDateTime(status?.intermediario_last_captured_at)}
          </CardDescription>
          <CardTitle>{status?.intermediario_total ?? "—"}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1.5">
          {Object.entries(status?.intermediario_by_tipo ?? {}).map(([tipo, count]) => (
            <BreakdownRow key={tipo} label={tipo} count={count} />
          ))}
        </CardContent>
      </Card>

      <Card className="metric-tile">
        <CardHeader>
          <CardDescription>
            Adm. carteira · {formatDateTime(status?.adm_carteira_last_captured_at)}
          </CardDescription>
          <CardTitle>{status?.adm_carteira_total ?? "—"}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1.5">
          {Object.entries(status?.adm_carteira_by_categoria ?? {}).map(([categoria, count]) => (
            <BreakdownRow key={categoria} label={categoria} count={count} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
