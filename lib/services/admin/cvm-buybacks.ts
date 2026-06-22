import { apiClient } from "@/lib/services/client";
import type {
  AdminPagedResponse,
  BuybackByCompanyResponse,
  BuybackProgramDetail,
  BuybackProgramSummary,
  BuybackSyncStatusResponse,
  ListBuybackProgramsParams,
  TriggerBuybackSyncResponse,
} from "./types";

export function listBuybackPrograms(params: ListBuybackProgramsParams) {
  return apiClient<AdminPagedResponse<BuybackProgramSummary>>(
    "/admin/cvm/buybacks/programs",
    { params },
  );
}

export function getBuybackProgram(idPrograma: string) {
  return apiClient<BuybackProgramDetail>(
    `/admin/cvm/buybacks/programs/${encodeURIComponent(idPrograma)}`,
  );
}

export function listBuybackProgramsByCompany(
  cdCvm: string | number,
  params?: { situacao?: string; page?: number; page_size?: number },
) {
  return apiClient<BuybackByCompanyResponse>(
    `/admin/cvm/buybacks/programs/by-company/${cdCvm}`,
    { params },
  );
}

export function listActiveBuybackPrograms(params?: { page?: number; page_size?: number }) {
  return apiClient<AdminPagedResponse<BuybackProgramSummary>>(
    "/admin/cvm/buybacks/active",
    { params },
  );
}

export function getBuybacksSyncStatus() {
  return apiClient<BuybackSyncStatusResponse>("/admin/cvm/buybacks/sync-status");
}

export function triggerBuybacksSync(force = false) {
  return apiClient<TriggerBuybackSyncResponse>("/admin/cvm/buybacks/sync", {
    method: "POST",
    params: { force },
  });
}
