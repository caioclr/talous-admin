import { apiClient } from "@/lib/services/client";
import type {
  AccountLinesTreeResponse,
  FilingSummary,
  ListFilingsParams,
  ReconciliationReport,
  TriggerITRDFPSyncResponse,
} from "./types";

export function listITRDFPFilings(params: ListFilingsParams) {
  return apiClient<FilingSummary[]>("/admin/cvm/itr-dfp/filings", {
    params,
  });
}

export function getITRDFPAccountLines(
  cdCvm: string | number,
  params: {
    statement_type: string;
    reference_date: string;
    grupo_dfr?: string;
    ordem_exerc?: string;
  },
) {
  return apiClient<AccountLinesTreeResponse>(`/admin/cvm/itr-dfp/account-lines/${cdCvm}`, {
    params,
  });
}

export function getITRDFPReconciliation(
  cdCvm: string | number,
  referenceDate: string,
  params?: {
    period_type?: string;
  },
) {
  return apiClient<ReconciliationReport>(
    `/admin/cvm/itr-dfp/reconciliation/${cdCvm}/${referenceDate}`,
    {
      params,
    },
  );
}

export function triggerITRDFPSync(docType = "itr", year?: number) {
  return apiClient<TriggerITRDFPSyncResponse>("/admin/cvm/itr-dfp/sync", {
    method: "POST",
    params: { doc_type: docType, year },
  });
}
