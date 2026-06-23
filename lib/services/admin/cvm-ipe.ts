import { apiClient } from "@/lib/services/client";
import type {
  AdminPagedResponse,
  IPECategoryCount,
  IPEDisclosureDetail,
  IPEDisclosureSummary,
  IPEReleaseDetail,
  IPEReleaseSummary,
  IPESyncStatusResponse,
  ListIPEDisclosuresParams,
  TriggerIPESyncResponse,
} from "./types";

export function listIPEDisclosures(params: ListIPEDisclosuresParams) {
  return apiClient<AdminPagedResponse<IPEDisclosureSummary>>("/admin/cvm/ipe/disclosures", {
    params,
  });
}

export function getIPEDisclosure(disclosureId: string) {
  return apiClient<IPEDisclosureDetail>(`/admin/cvm/ipe/disclosures/${disclosureId}`);
}

export function listIPEByCompany(cdCvm: string | number, params?: { categoria?: string; page?: number; page_size?: number }) {
  return apiClient<AdminPagedResponse<IPEDisclosureSummary>>(
    `/admin/cvm/ipe/disclosures/by-company/${cdCvm}`,
    {
      params,
    },
  );
}

// S16: releases de resultados extraidos de uma empresa (resumo + excerpt, sem
// full_text). Envelope paginado `AdminPagedResponse<IPEReleaseSummary>`.
export function listReleasesByCompany(
  cdCvm: string | number,
  params?: { page?: number; page_size?: number },
) {
  return apiClient<AdminPagedResponse<IPEReleaseSummary>>(
    `/admin/cvm/ipe/releases/by-company/${cdCvm}`,
    {
      params,
    },
  );
}

// S16: detalhe de um release (inclui full_text). Buscado LAZY, so ao abrir o item.
export function getRelease(releaseId: string) {
  return apiClient<IPEReleaseDetail>(`/admin/cvm/ipe/releases/${releaseId}`);
}

export function listIPECategories(days = 90) {
  return apiClient<IPECategoryCount[]>("/admin/cvm/ipe/categories", {
    params: { days },
  });
}

export function getIPESyncStatus() {
  return apiClient<IPESyncStatusResponse>("/admin/cvm/ipe/sync-status");
}

export function triggerIPESync(year?: number) {
  return apiClient<TriggerIPESyncResponse>("/admin/cvm/ipe/sync", {
    method: "POST",
    params: { year },
  });
}
