"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type {
  CompanyReassignRequest,
  SectorWithSubsectorsResponse,
} from "@/lib/services/admin/types";

/**
 * Edicao de setor/subsetor NA PROPRIA LINHA da empresa.
 *
 * Nao e dialog: o ponto da arvore e ver o conjunto, e um modal tapa exatamente o
 * que se quer olhar.
 *
 * ## As tres limitacoes que este componente mata
 *
 * O fluxo antigo (card "Reatribuir empresa", removido) tinha:
 *
 * 1. **Sem pre-preenchimento** — abria em "Manter setor atual"/"Manter subsetor
 *    atual", entao era preciso lembrar onde a empresa estava.
 * 2. **Select de subsetor desabilitado** ate escolher um setor — nao dava para
 *    mudar SO o subsetor, que e o caso mais comum.
 * 3. **Erro de runtime** para um estado que a UI podia impedir: se nada mudasse,
 *    o submit lancava `Error("Escolha um novo setor ou subsetor")`.
 *
 * ## O corpo preserva a semantica do contrato
 *
 * O backend distingue "chave ausente" (mantem) de "chave presente com null"
 * (limpa), via `model_fields_set`. `JSON.stringify` omite `undefined` e preserva
 * `null`, entao a regra e: **chave presente se e so se mudou**.
 *
 * O caso que exige atencao: setor mudou E a empresa tinha subsetor. Mandar so
 * `sector_id` deixaria a empresa apontando para um subsetor do setor antigo —
 * 422 na melhor hipotese. A regra cobre isso naturalmente, porque o subsetor
 * tambem mudou (para nulo).
 */

export const SEM_SUBSETOR = "__none__";

interface Props {
  sectors: SectorWithSubsectorsResponse[];
  initialSectorId: string;
  initialSubsectorId: string | null;
  saving: boolean;
  onSubmit: (body: CompanyReassignRequest) => void;
  onCancel: () => void;
}

export function CompanyAssignmentEditor({
  sectors,
  initialSectorId,
  initialSubsectorId,
  saving,
  onSubmit,
  onCancel,
}: Props) {
  const [sectorId, setSectorId] = useState(initialSectorId);
  const [subsectorId, setSubsectorId] = useState<string>(initialSubsectorId ?? SEM_SUBSETOR);

  const subsetores = useMemo(
    () => sectors.find((s) => s.id === sectorId)?.subsectors ?? [],
    [sectors, sectorId],
  );

  const trocouSetor = sectorId !== initialSectorId;
  const subsetorNormalizado = subsectorId === SEM_SUBSETOR ? null : subsectorId;
  const trocouSubsetor = subsetorNormalizado !== initialSubsectorId;
  const mudouAlgo = trocouSetor || trocouSubsetor;

  function handleSectorChange(novo: string) {
    setSectorId(novo);
    // Trocar de setor reseta o subsetor. Deliberadamente NAO caso por nome no
    // setor novo: com 25 nomes repetidos entre setores, isso moveria a empresa
    // para um subsetor homonimo em silencio.
    if (novo !== initialSectorId) setSubsectorId(SEM_SUBSETOR);
    else setSubsectorId(initialSubsectorId ?? SEM_SUBSETOR);
  }

  function handleSubmit() {
    const body: CompanyReassignRequest = {};
    if (trocouSetor) body.sector_id = sectorId;
    if (trocouSubsetor) body.subsector_id = subsetorNormalizado;
    onSubmit(body);
  }

  return (
    <div
      className="flex flex-wrap items-end gap-3 rounded-lg border border-dashed p-3"
      data-testid="company-assignment-editor"
    >
      <div className="min-w-[12rem] flex-1">
        <Label className="text-xs">Setor</Label>
        <Select
          aria-label="Setor"
          data-testid="assignment-sector"
          value={sectorId}
          onChange={(e) => handleSectorChange(e.target.value)}
        >
          {sectors.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="min-w-[12rem] flex-1">
        <Label className="text-xs">Subsetor</Label>
        {/* Nunca desabilitado: da para mudar so o subsetor. */}
        <Select
          aria-label="Subsetor"
          data-testid="assignment-subsector"
          value={subsectorId}
          onChange={(e) => setSubsectorId(e.target.value)}
        >
          <option value={SEM_SUBSETOR}>(sem subsetor)</option>
          {subsetores.map((sub) => (
            <option key={sub.id} value={sub.id}>
              {sub.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!mudouAlgo || saving}
          data-testid="assignment-save"
        >
          {saving ? "Salvando..." : "Salvar"}
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel} data-testid="assignment-cancel">
          Cancelar
        </Button>
      </div>

      {trocouSetor && (
        <p className="w-full text-xs text-muted-foreground">
          Escolha um subsetor de &quot;{sectors.find((s) => s.id === sectorId)?.name}&quot; ou
          deixe sem subsetor.
        </p>
      )}
    </div>
  );
}
