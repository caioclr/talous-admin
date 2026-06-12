import { expect, test } from "@playwright/test";
import { mockAuth } from "./helpers/mock-api";
import { CvmRoutes, mockGet } from "./helpers/mock-cvm";
import {
  ALERT_AUDITOR_CHANGE_SEM_CADASTRO,
  ALERTS_LIST,
  ALERTS_SUMMARY,
} from "./fixtures/cvm";

test.describe("Alertas operacionais — list", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, { authenticated: true });
    mockGet(page, CvmRoutes.alertsSummary, ALERTS_SUMMARY);
  });

  test("renders summary KPIs and by-type distribution", async ({ page }) => {
    mockGet(page, CvmRoutes.alertsList, ALERTS_LIST);

    await page.goto("/cvm/alerts");

    await expect(
      page.getByRole("heading", { name: "Alertas operacionais (CVM)" }),
    ).toBeVisible();

    // KPI cards from /summary
    await expect(
      page.getByText("Total de alertas", { exact: true }).locator("..").getByText("42"),
    ).toBeVisible();
    await expect(
      page.getByText("Alta", { exact: true }).first().locator("../..").getByText("12"),
    ).toBeVisible();
    await expect(
      page.getByText("Media", { exact: true }).first().locator("../..").getByText("19"),
    ).toBeVisible();
    await expect(
      page.getByText("Baixa", { exact: true }).first().locator("../..").getByText("11"),
    ).toBeVisible();

    // By-type card with pt-BR labels + counts
    await expect(
      page.getByText("FRE desatualizado", { exact: true }).first().locator("..").getByText("7"),
    ).toBeVisible();
    await expect(
      page
        .getByText("Recompra vencida em aberto", { exact: true })
        .first()
        .locator("..")
        .getByText("6"),
    ).toBeVisible();
    await expect(
      page
        .getByText("Inativa na CVM, ativa no sistema", { exact: true })
        .first()
        .locator("..")
        .getByText("4"),
    ).toBeVisible();
  });

  test("filters forward severity, alert_type and cd_cvm to the API", async ({ page }) => {
    const captured = mockGet(page, CvmRoutes.alertsList, ALERTS_LIST);

    await page.goto("/cvm/alerts");
    await expect.poll(() => captured.length).toBeGreaterThanOrEqual(1);

    await page.getByLabel("Severidade", { exact: true }).selectOption("alta");
    await expect.poll(() => captured.at(-1)?.query.severity).toBe("alta");

    await page.getByLabel("Tipo", { exact: true }).selectOption("fre_stale");
    await expect.poll(() => captured.at(-1)?.query.alert_type).toBe("fre_stale");

    await page.getByLabel("cd_cvm", { exact: true }).fill("9512");
    await expect.poll(() => captured.at(-1)?.query.cd_cvm).toBe("9512");
  });

  test("renders severity badges, company links and origin cross-links", async ({ page }) => {
    mockGet(page, CvmRoutes.alertsList, ALERTS_LIST);

    await page.goto("/cvm/alerts");

    const table = page.locator("table");

    // Severity badges per row (1 alta, 1 media, 2 baixa in the fixture)
    await expect(table.getByText("Alta", { exact: true })).toHaveCount(1);
    await expect(table.getByText("Media", { exact: true })).toHaveCount(1);
    await expect(table.getByText("Baixa", { exact: true })).toHaveCount(2);

    // pt-BR type labels
    await expect(table.getByText("FRE desatualizado", { exact: true })).toBeVisible();
    await expect(table.getByText("Venda insider relevante", { exact: true })).toBeVisible();

    // Company link when cd_cvm is present
    await expect(
      table.getByRole("link", { name: /Petroleo Brasileiro/ }).first(),
    ).toHaveAttribute("href", "/cvm/companies/detail?cd_cvm=9512");

    // No company link when cd_cvm is null
    await expect(
      table.getByText(ALERT_AUDITOR_CHANGE_SEM_CADASTRO.nome_empresarial ?? ""),
    ).toBeVisible();
    await expect(
      table.getByRole("link", { name: /Companhia Sem Cadastro/ }),
    ).toHaveCount(0);

    // Origin cross-link points to the source dataset route
    await expect(table.getByRole("link", { name: "Origem" }).first()).toHaveAttribute(
      "href",
      "/cvm/fre",
    );
  });

  test("opens payload dialog with JsonViewer", async ({ page }) => {
    mockGet(page, CvmRoutes.alertsList, ALERTS_LIST);

    await page.goto("/cvm/alerts");

    await page.getByRole("button", { name: "Detalhes" }).first().click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole("heading", { name: "FRE desatualizado" }),
    ).toBeVisible();
    await expect(dialog.getByText('"months_stale": 18')).toBeVisible();
    await expect(dialog.getByText('"last_fre_reference": "2024-12-31"')).toBeVisible();
  });
});
