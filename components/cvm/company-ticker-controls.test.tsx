import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CompanyTickerControls } from "@/components/cvm/company-ticker-controls";
import type { AdminDetailTicker } from "@/lib/services/admin/types";

function renderControls(tickers: AdminDetailTicker[], primaryTicker: string | null = "PETR4") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <CompanyTickerControls cdCvm="9512" tickers={tickers} primaryTicker={primaryTicker} />
    </QueryClientProvider>,
  );
}

function row(ticker: string) {
  return within(
    screen.getAllByRole("listitem").find((item) => item.textContent?.includes(ticker))!,
  );
}

describe("CompanyTickerControls", () => {
  it("mostra o estado real de cada ticker no primeiro render (sem nenhum clique)", () => {
    // Forma nova do detalhe: primario primeiro, ativos, depois inativos.
    renderControls([
      { ticker: "PETR4", is_active: true, is_primary: true, delisted_at: null },
      { ticker: "PETR3", is_active: false, is_primary: false, delisted_at: "2026-07-30T12:00:00Z" },
    ]);

    const active = row("PETR4");
    expect(active.getByText("Ativo")).toBeInTheDocument();
    expect(active.getByText("Primario")).toBeInTheDocument();
    expect(active.getByRole("button", { name: /Desabilitar/ })).toBeInTheDocument();

    // O ponto do bug: sem clicar em nada, o ticker deslistado ja aparece como
    // Desabilitado, com botao de reabilitar e a data do delisting.
    const delisted = row("PETR3");
    expect(delisted.getByText("Desabilitado")).toBeInTheDocument();
    expect(delisted.getByRole("button", { name: /Reabilitar/ })).toBeInTheDocument();
    expect(delisted.getByText(/Desabilitado em \d{2}\/\d{2}\/\d{4}/)).toBeInTheDocument();
    expect(delisted.queryByRole("button", { name: /^Desabilitar/ })).not.toBeInTheDocument();
  });

  it("nao mostra data quando o ticker esta desabilitado sem delisted_at", () => {
    renderControls([
      { ticker: "PETR3", is_active: false, is_primary: false, delisted_at: null },
    ]);

    expect(screen.getByText("Desabilitado")).toBeInTheDocument();
    expect(screen.queryByText(/Desabilitado em/)).not.toBeInTheDocument();
  });

  it("tolera a forma antiga do contrato (string[]) tratando todo ticker como ativo", () => {
    // Backend anterior ao enriquecimento do detalhe: so os simbolos. Sem
    // is_active no payload nao ha como distinguir — comportamento de antes.
    renderControls(["PETR4", "PETR3"]);

    expect(screen.getAllByText("Ativo")).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: /Desabilitar/ })).toHaveLength(2);
    expect(screen.queryByText("Desabilitado")).not.toBeInTheDocument();
    // `is_primary` derivado do primary_ticker da empresa.
    expect(row("PETR4").getByText("Primario")).toBeInTheDocument();
    expect(row("PETR3").queryByText("Primario")).not.toBeInTheDocument();
  });

  it("mostra o vazio quando a empresa nao tem ticker", () => {
    renderControls([]);

    expect(screen.getByText("Nenhum ticker cadastrado para esta empresa.")).toBeInTheDocument();
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  });
});
