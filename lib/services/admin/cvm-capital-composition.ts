import { apiClient } from "@/lib/services/client";
import type {
  AdminPagedResponse,
  CapitalCompositionByCompanyResponse,
  CapitalCompositionSnapshotDetail,
  CapitalCompositionSnapshotSummary,
  CapitalCompositionSyncStatusResponse,
  ListCapitalCompositionParams,
  TriggerCapitalCompositionSyncResponse,
} from "./types";

export function listCapitalCompositionSnapshots(params: ListCapitalCompositionParams) {
  return apiClient<AdminPagedResponse<CapitalCompositionSnapshotSummary>>(
    "/admin/cvm/capital-composition/snapshots",
    { params },
  );
}

export function getCapitalCompositionSnapshot(snapshotId: string) {
  return apiClient<CapitalCompositionSnapshotDetail>(
    `/admin/cvm/capital-composition/snapshots/${snapshotId}`,
  );
}

export function listCapitalCompositionByCompany(
  cdCvm: string | number,
  params?: { source?: string; period_type?: string; page?: number; page_size?: number },
) {
  return apiClient<CapitalCompositionByCompanyResponse>(
    `/admin/cvm/capital-composition/by-company/${cdCvm}`,
    { params },
  );
}

export function getCapitalCompositionSyncStatus() {
  return apiClient<CapitalCompositionSyncStatusResponse>(
    "/admin/cvm/capital-composition/sync-status",
  );
}

export function triggerCapitalCompositionSync(params: { source?: string; year?: number; force?: boolean } = {}) {
  return apiClient<TriggerCapitalCompositionSyncResponse>(
    "/admin/cvm/capital-composition/sync",
    {
      method: "POST",
      params,
    },
  );
}
