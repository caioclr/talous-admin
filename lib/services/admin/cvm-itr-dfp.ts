import { apiClient } from "@/lib/services/client";
import type {
  AccountLinesTreeResponse,
  AdminPagedResponse,
  FilingSummary,
  FilingSummaryWithValidation,
  ListFilingsParams,
  ListFilingsWithValidationParams,
  ReconciliationReport,
  TriggerITRDFPSyncResponse,
  ValidateFilingParams,
} from "./types";

export function listITRDFPFilings(params: ListFilingsParams) {
  return apiClient<AdminPagedResponse<FilingSummary>>("/admin/cvm/itr-dfp/filings", {
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

// ----------------------------------------------------------------------------
// S01 — Moderacao CVM: validacao de filings ITR/DFP (contrato T02)
// ----------------------------------------------------------------------------

/**
 * Lista filings com o bloco de validacao (status + quem/quando). Aceita o
 * filtro `validation_status` para conferencia por amostragem.
 */
export function listITRDFPFilingsWithValidation(params: ListFilingsWithValidationParams) {
  return apiClient<AdminPagedResponse<FilingSummaryWithValidation>>("/admin/cvm/itr-dfp/filings", {
    params,
  });
}

/** Marca o filing como valido (idempotente; registra admin atual + timestamp). */
export function validateITRDFPFiling(params: ValidateFilingParams) {
  return apiClient<FilingSummaryWithValidation>("/admin/cvm/itr-dfp/filings/validate", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

/** Reverte o filing para pendente (limpa quem/quando). */
export function invalidateITRDFPFiling(params: ValidateFilingParams) {
  return apiClient<FilingSummaryWithValidation>("/admin/cvm/itr-dfp/filings/invalidate", {
    method: "POST",
    body: JSON.stringify(params),
  });
}
