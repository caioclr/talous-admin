import { apiClient } from "@/lib/services/client";
import type {
  CompanyAssignmentResponse,
  CompanyReassignRequest,
  PeerExclusionRequest,
  PeerExclusionResponse,
  SectorCreateRequest,
  SectorResponse,
  SectorUpdateRequest,
  SectorWithSubsectorsResponse,
  SubsectorCreateRequest,
  SubsectorResponse,
  SubsectorUpdateRequest,
} from "./types";

// Taxonomia setor/subsetor (S10 T02). Endpoints sob `/admin/sectors` (NAO
// `/admin/cvm`). Guardas de DELETE devolvem 409; reatribuicao de subsetor de
// outro setor devolve 422. O apiClient repassa `detail` do backend como
// `error.message`, entao a UI mostra a mensagem da guarda diretamente.

export function listSectors() {
  return apiClient<SectorWithSubsectorsResponse[]>("/admin/sectors");
}

export function createSector(body: SectorCreateRequest) {
  return apiClient<SectorResponse>("/admin/sectors", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateSector(sectorId: string, body: SectorUpdateRequest) {
  return apiClient<SectorResponse>(`/admin/sectors/${sectorId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function deleteSector(sectorId: string) {
  return apiClient<void>(`/admin/sectors/${sectorId}`, {
    method: "DELETE",
  });
}

export function createSubsector(sectorId: string, body: SubsectorCreateRequest) {
  return apiClient<SubsectorResponse>(`/admin/sectors/${sectorId}/subsectors`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateSubsector(
  sectorId: string,
  subsectorId: string,
  body: SubsectorUpdateRequest,
) {
  return apiClient<SubsectorResponse>(
    `/admin/sectors/${sectorId}/subsectors/${subsectorId}`,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    },
  );
}

export function deleteSubsector(sectorId: string, subsectorId: string) {
  return apiClient<void>(`/admin/sectors/${sectorId}/subsectors/${subsectorId}`, {
    method: "DELETE",
  });
}

/**
 * Reatribui setor/subsetor de uma empresa.
 *
 * O contrato distingue "nao enviado" (mantem) de "enviado null" (limpa). Como
 * `JSON.stringify` omite chaves `undefined` e preserva chaves `null`, o caller
 * controla a semantica montando o `body`:
 *   - sem `subsector_id`            => mantem o subsetor atual;
 *   - `subsector_id: null`          => limpa o subsetor;
 *   - `subsector_id: "<uuid>"`      => define o subsetor (deve pertencer ao setor).
 */
export function reassignCompany(companyId: string, body: CompanyReassignRequest) {
  return apiClient<CompanyAssignmentResponse>(
    `/admin/sectors/companies/${companyId}/assignment`,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    },
  );
}


/**
 * Devolve a empresa ao controle do job semanal da B3.
 *
 * NAO e so soltar o controle: restaura o setor e o subsetor que o job havia
 * atribuido antes da PRIMEIRA curadoria. `previous_sector_restored: false`
 * significa que o setor anterior foi apagado desde entao e o ATUAL foi mantido
 * — a tela precisa dizer isso.
 */
export function revertCompanyCuration(companyId: string) {
  return apiClient<CompanyAssignmentResponse>(
    `/admin/sectors/companies/${companyId}/curation`,
    { method: "DELETE" },
  );
}

/**
 * Exclui a empresa das estatisticas de pares de TODO MUNDO.
 *
 * Ela continua com pagina propria, pares proprios, lista e ranking. Motivo e
 * obrigatorio: a tela declara por que a companhia saiu, e um selo sem texto nao
 * explica nada.
 */
export function setCompanyPeerExclusion(companyId: string, body: PeerExclusionRequest) {
  return apiClient<PeerExclusionResponse>(
    `/admin/sectors/companies/${companyId}/peer-exclusion`,
    { method: "PUT", body: JSON.stringify(body) },
  );
}

export function clearCompanyPeerExclusion(companyId: string) {
  return apiClient<void>(`/admin/sectors/companies/${companyId}/peer-exclusion`, {
    method: "DELETE",
  });
}
