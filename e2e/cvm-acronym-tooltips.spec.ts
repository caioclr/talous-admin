import { expect, test } from "@playwright/test";
import { mockAuth } from "./helpers/mock-api";
import { CvmRoutes, mockGet } from "./helpers/mock-cvm";
import { VLMO_MOVS_TRADES_ONLY, VLMO_SYNC_STATUS } from "./fixtures/cvm";

/**
 * Cobre os tooltips explicativos das siglas CVM:
 * - na navegacao (label de item que e sigla pura, ex.: VLMO);
 * - no cabecalho de uma tela (sigla embutida no titulo, ex.: VLMO).
 *
 * O tooltip reusa o radix (`components/ui/tooltip.tsx`) e abre no hover e no
 * focus. O texto renderizado da sigla permanece identico, preservando os nomes
 * acessiveis de links e headings.
 */
test.describe("Tooltips de siglas CVM", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, { authenticated: true });
    mockGet(page, CvmRoutes.vlmoSyncStatus, VLMO_SYNC_STATUS);
    mockGet(page, CvmRoutes.vlmoMovimentacoes, VLMO_MOVS_TRADES_ONLY);
  });

  test("nav: sigla mantem o link navegavel e mostra a definicao no hover", async ({ page }) => {
    await page.goto("/cvm/vlmo");

    const nav = page.getByRole("navigation");
    const vlmoLink = nav.getByRole("link", { name: "VLMO" });

    // O link de navegacao continua existindo com o mesmo nome acessivel.
    await expect(vlmoLink).toBeVisible();
    await expect(vlmoLink).toHaveAttribute("href", "/cvm/vlmo");

    // Hover sobre a sigla revela o tooltip com o termo por extenso.
    await vlmoLink.getByText("VLMO", { exact: true }).hover();
    await expect(
      page.getByText("Valores Mobiliarios negociados por insiders").first(),
    ).toBeVisible();
  });

  test("cabecalho: focar a sigla por teclado abre o tooltip", async ({ page }) => {
    await page.goto("/cvm/vlmo");

    // Heading preserva o texto completo apesar do wrapper inline.
    await expect(
      page.getByRole("heading", { name: "Insider trading · VLMO" }),
    ).toBeVisible();

    // O trigger no titulo e focavel por teclado (acessibilidade).
    const headingAcronym = page
      .getByRole("heading", { name: "Insider trading · VLMO" })
      .getByText("VLMO", { exact: true });

    await headingAcronym.focus();
    await expect(
      page.getByText("Valores Mobiliarios negociados por insiders").first(),
    ).toBeVisible();
  });
});
