import { apiClient } from "@/lib/services/client";
import type {
  AdminPagedResponse,
  ListVLMOMovimentacoesParams,
  TriggerVLMOSyncResponse,
  VLMOAggregatesResponse,
  VLMOMovimentacaoSummary,
  VLMOSyncStatusResponse,
} from "./types";

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
  return apiClient<AdminPagedResponse<VLMOMovimentacaoSummary>>(
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
