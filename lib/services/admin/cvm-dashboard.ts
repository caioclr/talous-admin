import { apiClient } from "@/lib/services/client";
import type { CVMDashboardResponse, DashboardReportType } from "./types";

/**
 * Dashboard CVM consolidado.
 *
 * `GET /admin/cvm/dashboard` devolve KPIs + grid por tipo. Tudo ja vem agregado
 * pelo backend (computed on-read) — o front so exibe, sem recalcular nada.
 */
export function getCVMDashboard() {
  return apiClient<CVMDashboardResponse>("/admin/cvm/dashboard");
}

/** Rotulos PT-BR amigaveis por `report_type` do grid "Documentos por tipo". */
export const DASHBOARD_TYPE_LABELS: Record<DashboardReportType, string> = {
  itr_dfp: "ITR/DFP",
  fre: "FRE",
  fca: "FCA",
  ipe: "IPE",
  buyback: "Recompras",
  vlmo: "VLMO",
  capital: "Composição",
  icbgc: "ICBGC",
  participantes: "Participantes",
};

/** Linha descritiva (contexto) por tipo, exibida no rodape do card. */
export const DASHBOARD_TYPE_DESCRIPTIONS: Record<DashboardReportType, string> = {
  itr_dfp: "Demonstrações financeiras trimestrais e anuais",
  fre: "Formulário de Referência",
  fca: "Formulário Cadastral",
  ipe: "Informes periódicos e eventuais",
  buyback: "Programas de recompra de ações",
  vlmo: "Valores mobiliários — negociações de insiders",
  capital: "Composição de capital social",
  icbgc: "Informe de governança corporativa",
  participantes: "Auditores · Intermediários · Adm. carteira",
};

/** Rota do dataset de origem por tipo, para cross-link a partir do card. */
export const DASHBOARD_TYPE_ROUTE: Record<DashboardReportType, string> = {
  itr_dfp: "/cvm/itr-dfp",
  fre: "/cvm/fre",
  fca: "/cvm/fca",
  ipe: "/cvm/ipe",
  buyback: "/cvm/buybacks",
  vlmo: "/cvm/vlmo",
  capital: "/cvm/capital-composition",
  icbgc: "/cvm/icbgc",
  participantes: "/cvm/participantes",
};

/** Rotulo amigavel; cai no proprio `report_type` se for desconhecido. */
export function dashboardTypeLabel(reportType: string): string {
  return DASHBOARD_TYPE_LABELS[reportType as DashboardReportType] ?? reportType;
}

/** Descricao amigavel; vazia se o tipo for desconhecido. */
export function dashboardTypeDescription(reportType: string): string {
  return DASHBOARD_TYPE_DESCRIPTIONS[reportType as DashboardReportType] ?? "";
}

/** Rota de origem; null se o tipo for desconhecido. */
export function dashboardTypeRoute(reportType: string): string | null {
  return DASHBOARD_TYPE_ROUTE[reportType as DashboardReportType] ?? null;
}
