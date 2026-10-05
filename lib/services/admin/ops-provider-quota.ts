import { apiClient } from "@/lib/services/client";
import type { ProviderQuotaDay, ProviderQuotaParams, ProviderQuotaResponse } from "./types";

/**
 * Consumo diario de cota do provedor de dados (bolsai).
 *
 * `GET /admin/ops/provider-quota?days=` devolve `{ days }`, mais recente
 * primeiro, uma linha por provedor e dia. O job `jobs.record_provider_quota`
 * grava `/keys/usage` de hora em hora (minuto 55), entao a linha de hoje e a
 * leitura mais recente — parcial ate o fim do dia. APENAS LEITURA.
 *
 * - `days`: 1–365 (default 30 no backend). O backend limita LINHAS, nao dias:
 *   com mais de um provedor, `days=30` traz menos de 30 dias de cada.
 */
export function getProviderQuota(params: ProviderQuotaParams = {}) {
  return apiClient<ProviderQuotaResponse>("/admin/ops/provider-quota", { params });
}

/** A partir de 80% do limite diario a cota pede atencao. */
export const QUOTA_WARNING_RATIO = 0.8;
/** A partir de 95% do limite diario a cota e critica. */
export const QUOTA_DANGER_RATIO = 0.95;

export type QuotaLevel = "ok" | "warning" | "danger" | "unknown";

/** Fracao consumida (`used / daily_limit`); `null` sem limite informado. */
export function quotaRatio(used: number, dailyLimit: number | null): number | null {
  if (dailyLimit === null || !Number.isFinite(dailyLimit) || dailyLimit <= 0) {
    return null;
  }
  return used / dailyLimit;
}

/** Faixa de alerta da cota — apresentacao apenas (limiares 80% / 95%). */
export function quotaLevel(ratio: number | null): QuotaLevel {
  if (ratio === null || !Number.isFinite(ratio)) {
    return "unknown";
  }
  if (ratio >= QUOTA_DANGER_RATIO) {
    return "danger";
  }
  if (ratio >= QUOTA_WARNING_RATIO) {
    return "warning";
  }
  return "ok";
}

/** Cota restante no dia; negativo quando o consumo passou do limite. */
export function quotaRemaining(used: number, dailyLimit: number | null): number | null {
  return dailyLimit === null ? null : dailyLimit - used;
}

/**
 * `checked_at` chega em UTC sem sufixo de fuso (`2026-10-05T12:55:00`) — o job
 * remove o tzinfo antes de gravar. `new Date()` leria como hora LOCAL e
 * adiantaria a leitura em 3 h no Brasil; aqui o valor e ancorado em UTC.
 */
export function parseProviderQuotaCheckedAt(value: string): Date {
  const hasZone = /(Z|[+-]\d{2}:?\d{2})$/i.test(value);
  return new Date(hasZone ? value : `${value}Z`);
}

/** Data `YYYY-MM-DD` de hoje em Sao Paulo — o fuso em que o backend grava `day`. */
export function todayInSaoPaulo(now: Date = new Date()): string {
  // en-CA formata como YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/**
 * `YYYY-MM-DD` -> `DD/MM/YYYY` (ou `DD/MM` com `short`), sem passar por `Date`
 * (evita o recuo de um dia do fuso).
 */
export function formatQuotaDay(day: string, { short = false }: { short?: boolean } = {}): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(day);
  if (!match) {
    return day;
  }
  const [, year, month, date] = match;
  return short ? `${date}/${month}` : `${date}/${month}/${year}`;
}

export interface ProviderQuotaSeries {
  provider: string;
  /** Mais recente primeiro, como o backend devolve. */
  days: ProviderQuotaDay[];
  /** A leitura mais recente do provedor (`days[0]`). */
  latest: ProviderQuotaDay;
}

/** Agrupa as linhas por provedor, preservando a ordem do backend. */
export function groupProviderQuota(days: ProviderQuotaDay[]): ProviderQuotaSeries[] {
  const grouped = new Map<string, ProviderQuotaDay[]>();
  for (const row of days) {
    const bucket = grouped.get(row.provider) ?? [];
    bucket.push(row);
    grouped.set(row.provider, bucket);
  }
  return [...grouped.entries()].map(([provider, rows]) => {
    const sorted = [...rows].sort((a, b) => b.day.localeCompare(a.day));
    return { provider, days: sorted, latest: sorted[0] };
  });
}
