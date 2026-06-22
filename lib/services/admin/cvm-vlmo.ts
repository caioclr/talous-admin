import { apiClient } from "@/lib/services/client";
import type {
  AdminPagedResponse,
  ListVLMOFilingsParams,
  ListVLMOMovimentacoesParams,
  TriggerVLMOSyncResponse,
  VLMOAggregatesResponse,
  VLMOByCompanyResponse,
  VLMOFilingDetail,
  VLMOFilingSummary,
  VLMOMovimentacaoSummary,
  VLMOSyncStatusResponse,
} from "./types";

/**
 * Filings VLMO — superficie de validacao do VLMO (S02 T03). O selo vive no
 * filing (header/protocolo), nao nas movimentacoes (`/movimentacoes` segue sem
 * selo). `ref` da API generica = `id` (UUID) do filing.
 */
export function listVLMOFilings(params: ListVLMOFilingsParams) {
  return apiClient<AdminPagedResponse<VLMOFilingSummary>>("/admin/cvm/vlmo/filings", {
    params,
  });
}

export function getVLMOFiling(filingId: string) {
  return apiClient<VLMOFilingDetail>(`/admin/cvm/vlmo/filings/${filingId}`);
}

export function listVLMOMovimentacoes(params: ListVLMOMovimentacoesParams) {
  return apiClient<AdminPagedResponse<VLMOMovimentacaoSummary>>(
    "/admin/cvm/vlmo/movimentacoes",
    { params },
  );
}

export function listVLMOByCompany(
  cdCvm: string | number,
  params?: { is_position_snapshot?: boolean; year?: number; page?: number; page_size?: number },
) {
  return apiClient<VLMOByCompanyResponse>(
    `/admin/cvm/vlmo/by-company/${cdCvm}`,
    { params },
  );
}

export function getVLMOAggregates(
  cdCvm: string | number,
  params?: { year?: number },
) {
  return apiClient<VLMOAggregatesResponse>(
    `/admin/cvm/vlmo/aggregates/${cdCvm}`,
    { params },
  );
}

export function getVLMOSyncStatus() {
  return apiClient<VLMOSyncStatusResponse>("/admin/cvm/vlmo/sync-status");
}

export function triggerVLMOSync(params: { year?: number; force?: boolean } = {}) {
  return apiClient<TriggerVLMOSyncResponse>("/admin/cvm/vlmo/sync", {
    method: "POST",
    params,
  });
}
