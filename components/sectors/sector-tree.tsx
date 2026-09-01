"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CompanyTreeRow } from "@/components/sectors/company-tree-row";
import {
  buildGroups,
  nomesRepetidos,
  useSectorCompanies,
  type SectorTreeGroup,
} from "@/components/sectors/use-sector-companies";
import { reassignCompany } from "@/lib/services/admin/sectors";
import type {
  CompanyReassignRequest,
  SectorWithSubsectorsResponse,
} from "@/lib/services/admin/types";

/**
 * A arvore Setor → Subsetor → Empresas.
 *
 * ## Por que arvore, e nao busca
 *
 * O fluxo antigo achava a empresa por texto, uma a uma. Isso nunca revelaria os
 * problemas que medimos: 37 empresas com setor provavelmente errado (a RANI3,
 * que e papel, dentro de "Bancos"), 98 sem subsetor, 25 nomes de subsetor
 * repetidos entre setores. Para ver isso e preciso ver o CONJUNTO.
 *
 * ## Carregamento sob demanda, com fronteira no SETOR
 *
 * Expandir um setor dispara UMA chamada; os subsetores sao agrupados no cliente.
 * A razao esta em `use-sector-companies.ts`: `subsector_slugs` nao e escopado por
 * setor no backend, e com 25 homonimos pedir um subsetor por slug traria os de
 * outro setor junto.
 */

interface Props {
  sectors: SectorWithSubsectorsResponse[];
  loading: boolean;
}

export function SectorTree({ sectors, loading }: Props) {
  const [abertos, setAbertos] = useState<Set<string>>(new Set());
  const repetidos = nomesRepetidos(sectors);

  function alterna(id: string) {
    setAbertos((atual) => {
      const novo = new Set(atual);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  }

  if (loading) {
    return (
      <div className="space-y-2" data-testid="sector-tree-loading">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2" data-testid="sector-tree">
      {sectors.map((sector) => (
        <SectorNode
          key={sector.id}
          sector={sector}
          sectors={sectors}
          expanded={abertos.has(sector.id)}
          onToggle={() => alterna(sector.id)}
          repetidos={repetidos}
        />
      ))}
    </div>
  );
}

function SectorNode({
  sector,
  sectors,
  expanded,
  onToggle,
  repetidos,
}: {
  sector: SectorWithSubsectorsResponse;
  sectors: SectorWithSubsectorsResponse[];
  expanded: boolean;
  onToggle: () => void;
  repetidos: Map<string, number>;
}) {
  const queryClient = useQueryClient();
  const [subAbertos, setSubAbertos] = useState<Set<string>>(new Set());
  const [editando, setEditando] = useState<string | null>(null);

  const { data, isLoading } = useSectorCompanies(sector.slug, expanded);
  const empresas = data?.items ?? [];
  const grupos = buildGroups(sector, empresas);
  const total = data?.pagination?.total ?? empresas.length;

  const mover = useMutation({
    mutationFn: ({ id, body }: { id: string; body: CompanyReassignRequest }) =>
      reassignCompany(id, body),
    onSuccess: (resposta) => {
      toast.success(
        `${resposta.name} movida para ${resposta.sector_slug}` +
          (resposta.subsector_slug ? ` › ${resposta.subsector_slug}` : ""),
      );
      setEditando(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "sectors"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "sector-companies"] });
    },
    onError: (erro: Error) => {
      // O editor continua aberto com os valores escolhidos: o fluxo antigo
      // engolia o contexto ao fechar o dialog no erro.
      toast.error(erro.message);
    },
  });

  return (
    <div className="rounded-xl border border-border" data-testid="sector-tree-node">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full items-center gap-2 px-4 py-3 text-left"
        data-testid={`sector-toggle-${sector.slug}`}
      >
        {expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        <span className="font-medium">{sector.name}</span>
        <span className="text-xs text-muted-foreground">
          {sector.company_count} empresa(s) · {sector.subsectors.length} subsetor(es)
        </span>
      </button>

      {expanded && (
        <div className="border-t border-border px-4 py-3">
          {isLoading ? (
            <Skeleton className="h-8 w-full" />
          ) : sector.company_count === 0 ? (
            // Setor vazio e renderizado sem estilo de alerta: manter os 6 setores
            // sem empresa foi decisao, entao nada na tela pode sugerir defeito.
            <p className="text-sm text-muted-foreground" data-testid="sector-empty">
              Nenhuma empresa neste setor.
            </p>
          ) : (
            <div className="space-y-2">
              {grupos.map((grupo) => (
                <SubsectorGroup
                  key={grupo.key}
                  grupo={grupo}
                  sectors={sectors}
                  sectorId={sector.id}
                  expanded={subAbertos.has(grupo.key)}
                  onToggle={() =>
                    setSubAbertos((atual) => {
                      const novo = new Set(atual);
                      if (novo.has(grupo.key)) novo.delete(grupo.key);
                      else novo.add(grupo.key);
                      return novo;
                    })
                  }
                  repetidoEm={grupo.subsector ? repetidos.get(grupo.subsector.name) : undefined}
                  editando={editando}
                  setEditando={setEditando}
                  saving={mover.isPending}
                  onSubmit={(id, body) => mover.mutate({ id, body })}
                />
              ))}
              {total > empresas.length && (
                <p className="text-xs text-muted-foreground" data-testid="sector-truncado">
                  Mostrando {empresas.length} de {total}.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SubsectorGroup({
  grupo,
  sectors,
  sectorId,
  expanded,
  onToggle,
  repetidoEm,
  editando,
  setEditando,
  saving,
  onSubmit,
}: {
  grupo: SectorTreeGroup;
  sectors: SectorWithSubsectorsResponse[];
  sectorId: string;
  expanded: boolean;
  onToggle: () => void;
  repetidoEm?: number;
  editando: string | null;
  setEditando: (id: string | null) => void;
  saving: boolean;
  onSubmit: (id: string, body: CompanyReassignRequest) => void;
}) {
  const divergente = grupo.expectedCount !== grupo.companies.length;
  return (
    <div className="rounded-lg bg-muted/30" data-testid="tree-subsector-row">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm"
        data-testid={`subsector-toggle-${grupo.key}`}
      >
        {expanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
        <span>{grupo.label}</span>
        {grupo.subsector && (
          <span className="text-xs text-muted-foreground">({grupo.subsector.slug})</span>
        )}
        <span className="text-xs text-muted-foreground">
          {/* `expectedCount` vem do backend; o array vem da query. Quando
              divergem (pagina truncada), mostra os dois em vez de escolher um. */}
          {divergente
            ? `${grupo.companies.length} de ${grupo.expectedCount} empresa(s)`
            : `${grupo.expectedCount} empresa(s)`}
        </span>
        {grupo.subsector?.peer_eligible === false && (
          <Badge variant="secondary" title="Pares caem para o setor: menos de 5 empresas.">
            poucos pares
          </Badge>
        )}
        {repetidoEm !== undefined && (
          <span className="text-xs text-muted-foreground">
            · nome usado em {repetidoEm} setores
          </span>
        )}
      </button>

      {expanded && (
        <ul className="divide-y divide-border/50 px-3 pb-2">
          {grupo.companies.length === 0 ? (
            <li className="py-2 text-sm text-muted-foreground">Nenhuma empresa aqui.</li>
          ) : (
            grupo.companies.map((c) => (
              <CompanyTreeRow
                key={c.id}
                company={c}
                sectors={sectors}
                sectorId={sectorId}
                subsectorId={grupo.subsector?.id ?? null}
                editing={editando === c.id}
                saving={saving}
                onStartEdit={() => setEditando(c.id)}
                onCancelEdit={() => setEditando(null)}
                onSubmit={(body) => onSubmit(c.id, body)}
              />
            ))
          )}
        </ul>
      )}
    </div>
  );
}
