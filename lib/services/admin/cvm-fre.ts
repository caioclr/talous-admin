import { apiClient } from "@/lib/services/client";
import type {
  AdminPagedResponse,
  FREByCompanyResponse,
  FREDividendPolicyDetail,
  FREDividendPolicySummary,
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
  return apiClient<FREByCompanyResponse>(
    `/admin/cvm/fre/by-company/${cdCvm}`,
    { params },
  );
}

// S18: politicas de dividendos extraidas do FRE de uma empresa (resumo +
// excerpt, sem policy_text). Envelope paginado
// `AdminPagedResponse<FREDividendPolicySummary>`.
export function listDividendPolicyByCompany(
  cdCvm: string | number,
  params?: { page?: number; page_size?: number },
) {
  return apiClient<AdminPagedResponse<FREDividendPolicySummary>>(
    `/admin/cvm/fre/dividend-policy/by-company/${cdCvm}`,
    { params },
  );
}

// S18: detalhe de uma politica de dividendos (inclui policy_text). Buscado
// LAZY, so ao abrir o item.
export function getDividendPolicy(policyId: string) {
  return apiClient<FREDividendPolicyDetail>(
    `/admin/cvm/fre/dividend-policy/${policyId}`,
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
