import { apiClient } from "@/lib/services/client";
import type {
  AdminPagedResponse,
  GovernanceByCompanyResponse,
  GovernanceReportDetail,
  GovernanceReportSummary,
  GovernanceSyncStatusResponse,
  ListICBGCReportsParams,
  TriggerICBGCSyncResponse,
} from "./types";

export function listICBGCReports(params: ListICBGCReportsParams) {
  return apiClient<AdminPagedResponse<GovernanceReportSummary>>(
    "/admin/cvm/icbgc/reports",
    { params },
  );
}

export function getICBGCReport(idDocumento: string | number) {
  return apiClient<GovernanceReportDetail>(
    `/admin/cvm/icbgc/reports/${idDocumento}`,
  );
}

export function getICBGCByCompany(cdCvm: string | number) {
  return apiClient<GovernanceByCompanyResponse>(
    `/admin/cvm/icbgc/by-company/${cdCvm}`,
  );
}

export function getICBGCSyncStatus() {
  return apiClient<GovernanceSyncStatusResponse>("/admin/cvm/icbgc/sync-status");
}

export function triggerICBGCSync(params: { year?: number; force?: boolean } = {}) {
  return apiClient<TriggerICBGCSyncResponse>("/admin/cvm/icbgc/sync", {
    method: "POST",
    params,
  });
}
