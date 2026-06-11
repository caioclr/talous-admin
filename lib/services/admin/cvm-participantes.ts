import { apiClient } from "@/lib/services/client";
import type {
  AdminPagedResponse,
  AdmCarteiraRegistrySummary,
  AuditorRegistrySummary,
  IntermediarioRegistrySummary,
  ListAdmCarteiraParams,
  ListAuditoresParams,
  ListIntermediariosParams,
  ParticipantesSyncDataset,
  ParticipantesSyncStatusResponse,
  TriggerParticipantesSyncResponse,
} from "./types";

export function listAuditores(params: ListAuditoresParams) {
  return apiClient<AdminPagedResponse<AuditorRegistrySummary>>(
    "/admin/cvm/participantes/auditores",
    { params },
  );
}

export function getAuditor(
  cdCvm: string | number,
  options: { tipo?: "PJ" | "PF" } = {},
) {
  return apiClient<AuditorRegistrySummary>(
    `/admin/cvm/participantes/auditores/${cdCvm}`,
    { params: { tipo: options.tipo } },
  );
}

export function listIntermediarios(params: ListIntermediariosParams) {
  return apiClient<AdminPagedResponse<IntermediarioRegistrySummary>>(
    "/admin/cvm/participantes/intermediarios",
    { params },
  );
}

export function getIntermediario(cnpj: string) {
  return apiClient<IntermediarioRegistrySummary>(
    `/admin/cvm/participantes/intermediarios/${cnpj}`,
  );
}

export function listAdmCarteira(params: ListAdmCarteiraParams) {
  return apiClient<AdminPagedResponse<AdmCarteiraRegistrySummary>>(
    "/admin/cvm/participantes/adm-carteira",
    { params },
  );
}

export function getParticipantesSyncStatus() {
  return apiClient<ParticipantesSyncStatusResponse>(
    "/admin/cvm/participantes/sync-status",
  );
}

export function triggerParticipantesSync(
  params: { dataset?: ParticipantesSyncDataset; force?: boolean } = {},
) {
  return apiClient<TriggerParticipantesSyncResponse>(
    "/admin/cvm/participantes/sync",
    {
      method: "POST",
      params,
    },
  );
}
