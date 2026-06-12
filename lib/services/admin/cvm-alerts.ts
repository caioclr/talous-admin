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

/** Rota do dataset de origem de cada alert_type, para cross-link. */
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

export function listOperationalAlerts(params: ListAlertsParams = {}) {
  return apiClient<AdminPagedResponse<OperationalAlert>>("/admin/cvm/alerts", {
    params,
  });
}

export function getAlertsSummary() {
  return apiClient<AlertsSummaryResponse>("/admin/cvm/alerts/summary");
}
