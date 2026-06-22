import { apiClient } from "@/lib/services/client";
import type { ListOpsJobsParams, OpsJobsResponse } from "./types";

/**
 * Status operacional dos jobs Celery instrumentados.
 *
 * `GET /admin/ops/jobs` devolve `{ jobs, history }`. APENAS LEITURA de status —
 * sem botoes de disparo/retry. `stale`, `duration_ms` e o status atual ja vem
 * computados pelo backend; o front so exibe.
 *
 * - `job_name`: filtra o `history` (e o `jobs`) por um job especifico.
 * - `history_limit`: 1–200 (default 20 no backend).
 */
export function getOpsJobs(params: ListOpsJobsParams = {}) {
  return apiClient<OpsJobsResponse>("/admin/ops/jobs", { params });
}

/**
 * Rotulos PT-BR amigaveis por `job_name` instrumentado no backend.
 *
 * EOD agrega Score e Ranking como steps internos (NAO ha `job_name` proprio
 * para Score/Ranking). Os ~10 `cvm_sync_*` aparecem condensados na tela de
 * Operacao; o painel do dashboard mostra so os jobs principais do pipeline.
 */
export const JOB_LABELS: Record<string, string> = {
  "jobs.run_eod_pipeline": "Pipeline EOD",
  "jobs.update_intraday_prices": "Preços intraday",
  "jobs.update_selic_rate": "Taxa Selic",
  "jobs.refresh_fundamentals_after_release": "Refresh pós-release",
  "jobs.cvm_structural_change_trigger": "Mudança estrutural",
  "jobs.cvm_sync_company_registry": "Sync cadastro de empresas",
  "jobs.cvm_sync_ipe": "Sync IPE",
  "jobs.cvm_sync_itr_dfp": "Sync ITR/DFP",
  "jobs.cvm_sync_capital_composition": "Sync composição de capital",
  "jobs.cvm_sync_buyback": "Sync recompras",
  "jobs.cvm_sync_governance": "Sync governança",
  "jobs.cvm_sync_fre": "Sync FRE",
  "jobs.cvm_sync_vlmo": "Sync VLMO",
  "jobs.cvm_sync_fca": "Sync FCA",
  "jobs.cvm_sync_participantes": "Sync participantes",
};

/** Nota de contexto por job (linha auxiliar). Vazia se nao houver. */
export const JOB_DESCRIPTIONS: Record<string, string> = {
  "jobs.run_eod_pipeline": "Score e Ranking são steps internos do EOD",
  "jobs.update_intraday_prices": "Atualização de preços durante o pregão",
  "jobs.update_selic_rate": "Taxa básica de juros (BCB)",
  "jobs.refresh_fundamentals_after_release": "Reprocessa fundamentos após divulgação",
  "jobs.cvm_structural_change_trigger": "Detecta mudança estrutural (ignora preço isolado)",
};

/**
 * Jobs principais do pipeline exibidos no painel do Dashboard, na ordem.
 * Os `cvm_sync_*` ficam fora do painel (vão para a tela de Operação).
 */
export const PIPELINE_JOB_NAMES = [
  "jobs.update_intraday_prices",
  "jobs.run_eod_pipeline",
  "jobs.refresh_fundamentals_after_release",
  "jobs.update_selic_rate",
  "jobs.cvm_structural_change_trigger",
] as const;

/** Prefixo dos jobs de sync CVM, condensados na tela de Operação. */
const CVM_SYNC_PREFIX = "jobs.cvm_sync_";

/** True para os ~10 `jobs.cvm_sync_*`. */
export function isCvmSyncJob(jobName: string): boolean {
  return jobName.startsWith(CVM_SYNC_PREFIX);
}

/** Rotulo amigavel; cai no proprio `job_name` se for desconhecido. */
export function jobLabel(jobName: string): string {
  return JOB_LABELS[jobName] ?? jobName;
}

/** Nota de contexto; vazia se o job nao tiver descricao. */
export function jobDescription(jobName: string): string {
  return JOB_DESCRIPTIONS[jobName] ?? "";
}
