import { apiClient } from "@/lib/services/client";
import type {
  AdminPagedResponse,
  FREFilingDetail,
  FREFilingSummary,
  FRESyncStatusResponse,
  ListFREFilingsParams,
  TriggerFRESyncResponse,
} from "./types";

export function listFREFilings(params: ListFREFilingsParams) {
  return apiClient<AdminPagedResponse<FREFilingSummary>>(
    "/admin/cvm/fre/filings",
    { params },
  );
}

export function getFREFiling(idDocumento: string) {
  return apiClient<FREFilingDetail>(
    `/admin/cvm/fre/filings/${encodeURIComponent(idDocumento)}`,
  );
}

export function listFREByCompany(
  cdCvm: string | number,
  params?: { page?: number; page_size?: number },
) {
  return apiClient<AdminPagedResponse<FREFilingSummary>>(
    `/admin/cvm/fre/by-company/${cdCvm}`,
    { params },
  );
}

export function getFRESyncStatus() {
  return apiClient<FRESyncStatusResponse>("/admin/cvm/fre/sync-status");
}

export function triggerFRESync(params: { year?: number; force?: boolean } = {}) {
  return apiClient<TriggerFRESyncResponse>("/admin/cvm/fre/sync", {
    method: "POST",
    params,
  });
}
