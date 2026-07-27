import { apiClient } from "@/lib/services/client";
import type {
  AdminCompanyDetail,
  AdminCompanySummary,
  AdminPagedResponse,
  AdminTicker,
  CVMSectorMappingRequest,
  CVMSectorMappingResponse,
  CVMSnapshotDetail,
  CVMSnapshotSummary,
  ListCompaniesParams,
  ListSnapshotsParams,
  RegistryChangeEventResponse,
  SyncStatusResponse,
  TickerToggleRequest,
  TriggerSyncResponse,
  UnmappedSectorResponse,
} from "./types";

export function getSyncStatus() {
  return apiClient<SyncStatusResponse>("/admin/cvm/registry/sync-status");
}

export function triggerRegistrySync(force = false) {
  return apiClient<TriggerSyncResponse>("/admin/cvm/registry/sync", {
    method: "POST",
    params: { force },
  });
}

export function listAdminCompanies(params: ListCompaniesParams) {
  return apiClient<AdminPagedResponse<AdminCompanySummary>>("/admin/cvm/companies", {
    params,
  });
}

export function getAdminCompany(cdCvm: string | number) {
  return apiClient<AdminCompanyDetail>(`/admin/cvm/companies/${cdCvm}`);
}

export function getCompanyHistory(cdCvm: string | number) {
  return apiClient<CVMSnapshotSummary[]>(`/admin/cvm/companies/${cdCvm}/history`);
}

export function getCompanyChanges(cdCvm: string | number) {
  return apiClient<RegistryChangeEventResponse[]>(`/admin/cvm/companies/${cdCvm}/changes`);
}

/**
 * Habilita/desabilita um ticker manualmente (delisting manual). Ao desativar
 * (`is_active=false`) o backend carimba `delisted_at = agora` e o ticker some do
 * Rastreador do app; ao reativar (`true`) zera `delisted_at`. Retorna o ticker
 * persistido. PATCH /admin/cvm/companies/{cd_cvm}/tickers/{ticker}.
 */
export function setTickerActive(cdCvm: string | number, ticker: string, isActive: boolean) {
  const body: TickerToggleRequest = { is_active: isActive };
  return apiClient<AdminTicker>(
    `/admin/cvm/companies/${cdCvm}/tickers/${encodeURIComponent(ticker)}`,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    },
  );
}

export function listSnapshots(params: ListSnapshotsParams) {
  return apiClient<AdminPagedResponse<CVMSnapshotSummary>>("/admin/cvm/registry/snapshots", {
    params,
  });
}

export function getSnapshot(id: string) {
  return apiClient<CVMSnapshotDetail>(`/admin/cvm/registry/snapshots/${id}`);
}

export function listSectorMappings() {
  return apiClient<CVMSectorMappingResponse[]>("/admin/cvm/sector-mapping");
}

export function upsertSectorMapping(body: CVMSectorMappingRequest) {
  return apiClient<CVMSectorMappingResponse>("/admin/cvm/sector-mapping", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function deleteSectorMapping(cvmSetor: string) {
  return apiClient<void>(`/admin/cvm/sector-mapping/${encodeURIComponent(cvmSetor)}`, {
    method: "DELETE",
  });
}

export function listUnmappedSectors() {
  return apiClient<UnmappedSectorResponse[]>("/admin/cvm/sector-mapping/unmapped");
}
