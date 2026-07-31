import { describe, expect, it } from "vitest";
import { formatList } from "@/lib/formatters";
import { normalizeDetailTickers, tickerSymbols } from "@/lib/tickers";
import type { AdminDetailTicker } from "@/lib/services/admin/types";

const RICH: AdminDetailTicker[] = [
  { ticker: "PETR4", is_active: true, is_primary: true, delisted_at: null },
  { ticker: "PETR3", is_active: false, is_primary: false, delisted_at: "2026-07-30T12:00:00Z" },
];

describe("tickerSymbols", () => {
  it("extrai os simbolos da forma nova (objetos) preservando a ordem", () => {
    expect(tickerSymbols(RICH)).toEqual(["PETR4", "PETR3"]);
  });

  it("passa a forma antiga (strings) direto", () => {
    expect(tickerSymbols(["PETR4", "PETR3"])).toEqual(["PETR4", "PETR3"]);
  });

  it("aceita as duas formas na mesma lista", () => {
    expect(tickerSymbols(["VALE3", RICH[0]])).toEqual(["VALE3", "PETR4"]);
  });

  it("alimenta o subtitulo do breadcrumb sem virar [object Object]", () => {
    // Regressao: o subtitulo fazia formatList(company.tickers) direto.
    expect(formatList(tickerSymbols(RICH))).toBe("PETR4, PETR3");
    expect(formatList(tickerSymbols([]))).toBe("—");
  });
});

describe("normalizeDetailTickers", () => {
  it("mantem o estado por ticker da forma nova", () => {
    expect(normalizeDetailTickers(RICH, "PETR4")).toEqual(RICH);
  });

  it("assume ativo e deriva is_primary na forma antiga", () => {
    expect(normalizeDetailTickers(["PETR4", "PETR3"], "PETR4")).toEqual([
      { ticker: "PETR4", is_active: true, is_primary: true, delisted_at: null },
      { ticker: "PETR3", is_active: true, is_primary: false, delisted_at: null },
    ]);
  });

  it("nao marca primario quando a empresa nao tem primary_ticker", () => {
    expect(normalizeDetailTickers(["PETR3"], null)).toEqual([
      { ticker: "PETR3", is_active: true, is_primary: false, delisted_at: null },
    ]);
  });
});
