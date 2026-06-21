import { apiClient } from "@/lib/services/client";
import type {
  ReportType,
  ReportValidationParams,
  ReportValidationResult,
} from "./types";

/**
 * S02 — API generica de validacao de relatorios CVM (contrato T01).
 *
 * Vale para qualquer tipo com referencia propria: FRE/FCA/ICBGC (id_documento),
 * capital (id UUID do snapshot) e buyback (id_programa). O `report_uid` e montado
 * no backend a partir de `{report_type}:{ref}`; o frontend so envia o par
 * `(report_type, ref)` — `ref` aceita numero ou UUID, sempre como string. O selo
 * e metadado interno de QA: nao altera o dado nem o app do usuario final.
 *
 * IMPORTANTE: o `apiClient` do admin usa `body:` (nao `data:`) para o corpo do
 * POST. Manter `body: JSON.stringify(params)` — `data:` faz o corpo sumir.
 */

/** Marca o relatorio como valido (idempotente; registra admin atual + timestamp). */
export function validateReport(reportType: ReportType, ref: string) {
  const params: ReportValidationParams = { report_type: reportType, ref };
  return apiClient<ReportValidationResult>("/admin/cvm/validations/validate", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

/** Reverte o relatorio para pendente (limpa quem/quando). */
export function invalidateReport(reportType: ReportType, ref: string) {
  const params: ReportValidationParams = { report_type: reportType, ref };
  return apiClient<ReportValidationResult>("/admin/cvm/validations/invalidate", {
    method: "POST",
    body: JSON.stringify(params),
  });
}
