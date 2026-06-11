import { apiClient } from "@/lib/services/client";
import type {
  AdminPagedResponse,
  IPECategoryCount,
  IPEDisclosureDetail,
  IPEDisclosureSummary,
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
