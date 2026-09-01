"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CompanyAssignmentEditor } from "@/components/sectors/company-assignment-editor";
import type {
  AdminCompanySummary,
  CompanyReassignRequest,
  SectorWithSubsectorsResponse,
} from "@/lib/services/admin/types";

/**
 * Uma empresa na arvore: identidade, caminho atual, selos e a acao de mover.
 *
 * Em repouso e uma linha; ao clicar em "Mover" ela vira o editor NO LUGAR, sem
 * dialog. So uma linha fica em edicao por vez — quem controla e a raiz da
 * arvore, o que tambem mantem os seletores sem ambiguidade nos testes.
 */

interface Props {
  company: AdminCompanySummary;
  sectors: SectorWithSubsectorsResponse[];
  sectorId: string;
  subsectorId: string | null;
  editing: boolean;
  saving: boolean;
  curated?: boolean;
  curatedBy?: string | null;
  peerExcluded?: boolean;
  peerExclusionReason?: string | null;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSubmit: (body: CompanyReassignRequest) => void;
  onRevertCuration?: () => void;
  onTogglePeerExclusion?: () => void;
}

export function CompanyTreeRow({
  company,
  sectors,
  sectorId,
  subsectorId,
  editing,
  saving,
  curated,
  curatedBy,
  peerExcluded,
  peerExclusionReason,
  onStartEdit,
  onCancelEdit,
  onSubmit,
  onRevertCuration,
  onTogglePeerExclusion,
}: Props) {
  if (editing) {
    return (
      <li className="py-2" data-testid={`company-row-${company.id}`}>
        <div className="mb-2 text-sm font-medium">
          {company.primary_ticker ?? "—"} · {company.name}
        </div>
        <CompanyAssignmentEditor
          sectors={sectors}
          initialSectorId={sectorId}
          initialSubsectorId={subsectorId}
          saving={saving}
          onSubmit={onSubmit}
          onCancel={onCancelEdit}
        />
      </li>
    );
  }

  return (
    <li
      className="flex flex-wrap items-center gap-2 py-1.5 text-sm"
      data-testid={`company-row-${company.id}`}
    >
      <span className="font-mono text-xs text-muted-foreground">
        {company.primary_ticker ?? "—"}
      </span>
      <span className="min-w-0 flex-1 truncate">{company.name}</span>
      <span className="text-xs text-muted-foreground">
        {company.sector_name ?? "—"}
        {company.subsector_name ? ` › ${company.subsector_name}` : ""}
      </span>
      {curated && (
        <Badge variant="secondary" title={curatedBy ? `por ${curatedBy}` : undefined}>
          Curado
        </Badge>
      )}
      {peerExcluded && (
        <Badge variant="warning" title={peerExclusionReason ?? undefined}>
          Fora dos pares
        </Badge>
      )}
      <Button
        size="sm"
        variant="outline"
        onClick={onStartEdit}
        data-testid={`company-reassign-${company.id}`}
      >
        Mover
      </Button>
      {curated && onRevertCuration && (
        <Button
          size="sm"
          variant="ghost"
          onClick={onRevertCuration}
          data-testid={`company-revert-${company.id}`}
          title="A empresa volta a ser atribuida pelo job semanal da B3."
        >
          Devolver ao job
        </Button>
      )}
      {onTogglePeerExclusion && (
        <Button
          size="sm"
          variant="ghost"
          onClick={onTogglePeerExclusion}
          data-testid={`company-peer-${company.id}`}
        >
          {peerExcluded ? "Reincluir nos pares" : "Excluir dos pares"}
        </Button>
      )}
    </li>
  );
}
