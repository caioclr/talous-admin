import { apiClient } from "@/lib/services/client";

/**
 * Centro de notificacoes do operador (`/admin/notifications`).
 *
 * Feed de eventos de operacao (novos releases/ITR ingeridos, futuramente falhas
 * de job). Somente leitura + dispensa (marcar lida). Polling, sem tempo real.
 */

export interface AdminNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  company_id: string | null;
  meta: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
}

export interface AdminNotificationsResponse {
  items: AdminNotification[];
  unread_count: number;
}

export function getAdminNotifications(
  params: { limit?: number; unread_only?: boolean } = {},
) {
  return apiClient<AdminNotificationsResponse>("/admin/notifications", { params });
}

export function markAdminNotificationRead(id: string) {
  return apiClient<{ ok: boolean }>(`/admin/notifications/${id}/read`, {
    method: "PATCH",
  });
}

export function markAllAdminNotificationsRead() {
  return apiClient<{ marked_read: number }>("/admin/notifications/read-all", {
    method: "POST",
  });
}

/** Rotulos PT-BR por tipo de notificacao admin. */
export const ADMIN_NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  new_releases: "Releases de resultados",
  new_itr_filings: "Dados ITR/DFP",
  job_failed: "Falha de job",
};
