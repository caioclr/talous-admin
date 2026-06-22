import { expect, test } from "@playwright/test";
import { mockAuth } from "./helpers/mock-api";
import { CvmRoutes, mockGet } from "./helpers/mock-cvm";
import {
  ALERTS_LIST,
  CVM_DASHBOARD_DEFAULT,
  CVM_DASHBOARD_EMPTY,
  OPS_JOBS_DEFAULT,
} from "./fixtures/cvm";

test.describe("CVM dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, { authenticated: true });
    // S12: the dashboard now reads real pipeline status; mock the ops endpoint
    // for every dashboard test so the panel does not fire an un-stubbed request.
    mockGet(page, CvmRoutes.opsJobs, OPS_JOBS_DEFAULT);
  });

  test("renders the 6 KPIs from the dashboard endpoint", async ({ page }) => {
    mockGet(page, CvmRoutes.dashboard, CVM_DASHBOARD_DEFAULT);
    mockGet(page, CvmRoutes.alertsList, ALERTS_LIST);

    await page.goto("/cvm");

    const main = page.getByRole("main");

    await expect(page.getByRole("heading", { name: "Dashboard CVM" })).toBeVisible();

    // KPI cards (scoped to main + by label to avoid sidebar/grid collisions).
    await expect(main.locator("text=Total filings").locator("..").getByText("2.847")).toBeVisible();
    await expect(
      main.locator("text=Alertas ativos").locator("..").getByText("12", { exact: true }),
    ).toBeVisible();
    await expect(
      main.locator("text=Empresas").locator("..").getByText("196", { exact: true }),
    ).toBeVisible();
    // last_eod present: assert the EOD card shows a 2026 date (TZ-safe — avoids
    // hard-coding the day, which shifts with the runner timezone).
    await expect(
      main.locator("text=Última EOD").locator("..").getByText(/\/2026$/),
    ).toBeVisible();
  });

  test("renders the 9 document-type cards with validados/pendentes and freshness", async ({
    page,
  }) => {
    mockGet(page, CvmRoutes.dashboard, CVM_DASHBOARD_DEFAULT);
    mockGet(page, CvmRoutes.alertsList, ALERTS_LIST);

    await page.goto("/cvm");

    const main = page.getByRole("main");

    await expect(main.getByRole("heading", { name: "Documentos por tipo" })).toBeVisible();

    // PT-BR labels for the 9 backend report_type strings (card titles in main).
    for (const label of [
      "ITR/DFP",
      "FRE",
      "FCA",
      "IPE",
      "Recompras",
      "VLMO",
      "Composição",
      "ICBGC",
      "Participantes",
    ]) {
      await expect(main.getByText(label, { exact: true })).toBeVisible();
    }

    // FCA card is "atraso"; the others in the fixture are "em dia".
    await expect(main.getByText("atraso").first()).toBeVisible();
    await expect(main.getByText("em dia").first()).toBeVisible();

    // ITR/DFP totals (total 842 / validados 412 / pendentes 430).
    const itrCard = main.locator("a", { hasText: "ITR/DFP" });
    await expect(itrCard.getByText("842")).toBeVisible();
    await expect(itrCard.getByText("412")).toBeVisible();
    await expect(itrCard.getByText("430")).toBeVisible();

    // Cards link to their dataset route.
    await expect(itrCard).toHaveAttribute("href", "/cvm/itr-dfp");
  });

  test("lists operational alerts reusing the alerts endpoint", async ({ page }) => {
    mockGet(page, CvmRoutes.dashboard, CVM_DASHBOARD_DEFAULT);
    mockGet(page, CvmRoutes.alertsList, ALERTS_LIST);

    await page.goto("/cvm");

    const main = page.getByRole("main");

    await expect(main.getByRole("heading", { name: "Alertas operacionais" })).toBeVisible();
    await expect(
      main.getByText("FRE mais recente esta desatualizado ha mais de 12 meses."),
    ).toBeVisible();
    // "Ver todos" cross-links to the full alerts page.
    await expect(main.getByRole("link", { name: "Ver todos →" })).toHaveAttribute(
      "href",
      "/cvm/alerts",
    );
  });

  test("shows real pipeline status (S12 replaced the 'em breve' placeholder)", async ({ page }) => {
    mockGet(page, CvmRoutes.dashboard, CVM_DASHBOARD_DEFAULT);
    mockGet(page, CvmRoutes.alertsList, ALERTS_LIST);

    await page.goto("/cvm");

    const main = page.getByRole("main");

    await expect(main.getByRole("heading", { name: "Status do pipeline" })).toBeVisible();
    await expect(main.getByText("Operação em breve")).toHaveCount(0);
    await expect(main.getByText("Pipeline EOD", { exact: true })).toBeVisible();
  });

  test("handles an empty environment (no EOD, no documents)", async ({ page }) => {
    mockGet(page, CvmRoutes.dashboard, CVM_DASHBOARD_EMPTY);
    mockGet(page, CvmRoutes.alertsList, {
      items: [],
      pagination: { page: 1, page_size: 6, total: 0, total_pages: 0 },
    });

    await page.goto("/cvm");

    const main = page.getByRole("main");

    // last_eod null -> em-dash + hint.
    await expect(main.getByText("Nenhuma EOD registrada")).toBeVisible();
    await expect(main.getByText("Nenhum documento CVM agregado ainda.")).toBeVisible();
    await expect(main.getByText("Nenhum alerta operacional ativo.")).toBeVisible();
  });

  test("surfaces a backend error on the dashboard endpoint", async ({ page }) => {
    void page.route(CvmRoutes.dashboard, async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Falha ao agregar dashboard" }),
      });
    });
    mockGet(page, CvmRoutes.alertsList, ALERTS_LIST);

    await page.goto("/cvm");

    await expect(page.getByRole("main").getByText("Falha ao agregar dashboard")).toBeVisible();
  });
});
