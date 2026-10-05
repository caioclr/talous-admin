import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { ProviderQuotaSummary } from "./provider-quota-summary";
import { groupProviderQuota } from "@/lib/services/admin/ops-provider-quota";
import type { ProviderQuotaDay } from "@/lib/services/admin/types";

function montar(over: Partial<ProviderQuotaDay> = {}, today = "2026-10-05") {
  const [series] = groupProviderQuota([
    {
      provider: "bolsai",
      day: "2026-10-05",
      tier: "pro",
      used: 616,
      daily_limit: 10000,
      checked_at: "2026-10-05T12:55:00",
      ...over,
    },
  ]);
  render(<ProviderQuotaSummary series={series} today={today} />);
}

describe("ProviderQuotaSummary", () => {
  it("mostra consumo, limite, percentual, restante, plano e a hora da leitura", () => {
    montar();

    expect(screen.getByRole("heading", { name: "Consumo hoje" })).toBeInTheDocument();
    expect(screen.getByTestId("quota-used")).toHaveTextContent("616");
    expect(screen.getByText(/10\.000 requisições/)).toBeInTheDocument();
    expect(screen.getByText("6,2%")).toBeInTheDocument();
    expect(screen.getByText("9.384")).toBeInTheDocument();
    expect(screen.getByText("plano pro")).toBeInTheDocument();
    // checked_at chega em UTC sem fuso: 12:55 UTC = 09:55 em Sao Paulo.
    expect(screen.getByText("05/10/2026, 09:55")).toBeInTheDocument();
    expect(screen.getByText("OK")).toBeInTheDocument();
    expect(screen.getByRole("meter", { name: "Consumo da cota diária" })).toHaveAttribute(
      "aria-valuenow",
      "6",
    );
  });

  it("avisa a partir de 80% do limite", () => {
    montar({ used: 8000 });

    expect(screen.getByText("Atenção")).toBeInTheDocument();
    expect(screen.getByTestId("quota-used")).toHaveClass("text-warning");
  });

  it("sinaliza perigo a partir de 95% do limite", () => {
    montar({ used: 9500 });

    expect(screen.getByText("Crítico")).toBeInTheDocument();
    expect(screen.getByTestId("quota-used")).toHaveClass("text-destructive");
  });

  it("diz quanto passou quando o consumo excede o limite", () => {
    montar({ used: 10250 });

    expect(screen.getByText("Excedido em 250")).toBeInTheDocument();
    expect(screen.getByRole("meter", { name: "Consumo da cota diária" })).toHaveAttribute(
      "aria-valuenow",
      "100",
    );
  });

  it("nao apresenta o dia anterior como hoje quando ainda nao ha leitura no dia", () => {
    montar({ day: "2026-10-04", checked_at: "2026-10-05T02:55:00" }, "2026-10-05");

    expect(screen.getByRole("heading", { name: "Consumo em 04/10/2026" })).toBeInTheDocument();
    expect(screen.getByText(/Sem leitura hoje \(05\/10\/2026\)/)).toBeInTheDocument();
  });

  it("degrada sem limite nem plano informados", () => {
    montar({ daily_limit: null, tier: null });

    expect(screen.getByText("Sem limite")).toBeInTheDocument();
    expect(screen.queryByText(/plano/)).not.toBeInTheDocument();
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(2);
  });
});
