import { apiClient } from "@/lib/services/client";
import type {
  AdminPagedResponse,
  FCAByCompanyResponse,
  FCADocumentoDetail,
  FCADocumentoSummary,
  FCASyncStatusResponse,
  ListFCADocumentosParams,
  TriggerFCASyncResponse,
} from "./types";

export function listFCADocumentos(params: ListFCADocumentosParams) {
  return apiClient<AdminPagedResponse<FCADocumentoSummary>>(
    "/admin/cvm/fca/documentos",
    { params },
  );
}

export function getFCADocumento(idDocumento: string | number) {
  return apiClient<FCADocumentoDetail>(
    `/admin/cvm/fca/documentos/${idDocumento}`,
  );
}

export function getFCAByCompany(cdCvm: string | number) {
  return apiClient<FCAByCompanyResponse>(
    `/admin/cvm/fca/by-company/${cdCvm}`,
  );
}

export function getFCASyncStatus() {
  return apiClient<FCASyncStatusResponse>("/admin/cvm/fca/sync-status");
}

export function triggerFCASync(params: { year?: number; force?: boolean } = {}) {
  return apiClient<TriggerFCASyncResponse>("/admin/cvm/fca/sync", {
    method: "POST",
    params,
  });
}
