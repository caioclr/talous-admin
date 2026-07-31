import type { AdminDetailTicker, AdminTicker } from "@/lib/services/admin/types";

/**
 * Helpers para consumir `AdminCompanyDetail.tickers`.
 *
 * `GET /admin/cvm/companies/{cd_cvm}` devolve o historico completo de tickers
 * (deslistados inclusive) como objetos `AdminTicker` — com `is_active`,
 * `is_primary` e `delisted_at`. Um backend anterior a essa mudanca devolve a
 * mesma lista como `string[]` (so os simbolos). Todo consumidor do detalhe usa
 * estes helpers para tolerar as duas formas, o que torna o admin deployavel
 * antes ou depois do backend.
 */

/** Simbolos na ordem recebida — para rotulos, contagens e concatenacoes. */
export function tickerSymbols(tickers: readonly AdminDetailTicker[]): string[] {
  return tickers.map((ticker) => (typeof ticker === "string" ? ticker : ticker.ticker));
}

/**
 * Materializa o estado por ticker.
 *
 * Na forma antiga (so simbolos) o estado real nao vem no payload: assume-se
 * ativo e `is_primary` derivado do `primary_ticker` da empresa. Isso reproduz o
 * comportamento anterior — um ticker ja desabilitado aparece como Ativo, porque
 * aquele backend nao permite distinguir. Com a forma nova o objeto passa direto.
 */
export function normalizeDetailTickers(
  tickers: readonly AdminDetailTicker[],
  primaryTicker: string | null,
): AdminTicker[] {
  return tickers.map((ticker) =>
    typeof ticker === "string"
      ? {
          ticker,
          is_active: true,
          is_primary: ticker === primaryTicker,
          delisted_at: null,
        }
      : ticker,
  );
}
