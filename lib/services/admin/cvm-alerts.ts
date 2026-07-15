import { apiClient } from "@/lib/services/client";
import type {
  AdminPagedResponse,
  AlertsSummaryResponse,
  ListAlertsParams,
  OperationalAlert,
} from "./types";

/** Labels pt-BR por alert_type, para KPIs, filtros e tabela. */
export const ALERT_TYPE_LABELS: Record<string, string> = {
  fre_stale: "FRE desatualizado",
  fca_stale: "FCA desatualizado",
  needs_data_refresh: "Dados desatualizados",
  icbgc_stale: "ICBGC desatualizado",
  registry_inactive_with_active_data: "Inativa na CVM, ativa no sistema",
  buyback_expired_open: "Recompra vencida em aberto",
  vlmo_heavy_selling: "Venda insider relevante",
  auditor_change: "Troca de auditor",
};

/** Rota do dataset de origem de cada alert_type (fallback sem contexto de empresa). */
export const ALERT_TYPE_ORIGIN: Record<string, string> = {
  fre_stale: "/cvm/fre",
  fca_stale: "/cvm/fca",
  needs_data_refresh: "/cvm/companies",
  icbgc_stale: "/cvm/icbgc",
  registry_inactive_with_active_data: "/cvm/companies",
  buyback_expired_open: "/cvm/buybacks",
  vlmo_heavy_selling: "/cvm/vlmo",
  auditor_change: "/cvm/fca",
};

/**
 * Tela de detalhe por empresa de cada alert_type — recebe `?cd_cvm=` e hidrata
 * o filtro pela empresa do alerta. Tipos sem tela específica (FRE, recompra,
 * cadastro) caem no detalhe geral da empresa.
 */
const ALERT_TYPE_COMPANY_DETAIL: Record<string, string> = {
  fca_stale: "/cvm/fca/companies/detail",
  auditor_change: "/cvm/fca/companies/detail",
  icbgc_stale: "/cvm/icbgc/companies/detail",
  vlmo_heavy_selling: "/cvm/vlmo/companies/detail",
  fre_stale: "/cvm/companies/detail",
  needs_data_refresh: "/cvm/companies/detail",
  registry_inactive_with_active_data: "/cvm/companies/detail",
  buyback_expired_open: "/cvm/companies/detail",
};

/**
 * Monta a rota de origem do alerta já com o contexto da empresa (`cd_cvm`),
 * para que a seta do alerta abra a tela filtrada e não a lista crua do dataset.
 * Sem `cd_cvm`, cai no cross-link estático do dataset.
 */
export function alertOrigin(
  alert: Pick<OperationalAlert, "alert_type" | "cd_cvm">,
): string | null {
  const detailBase = ALERT_TYPE_COMPANY_DETAIL[alert.alert_type];
  if (detailBase && alert.cd_cvm != null) {
    return `${detailBase}?cd_cvm=${encodeURIComponent(String(alert.cd_cvm))}`;
  }
  return ALERT_TYPE_ORIGIN[alert.alert_type] ?? null;
}

export function listOperationalAlerts(params: ListAlertsParams = {}) {
  return apiClient<AdminPagedResponse<OperationalAlert>>("/admin/cvm/alerts", {
    params,
  });
}

export function getAlertsSummary() {
  return apiClient<AlertsSummaryResponse>("/admin/cvm/alerts/summary");
}
