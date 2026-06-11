import { expect, test } from "@playwright/test";
import { mockAuth } from "./helpers/mock-api";
import { CvmRoutes, mockGet, mockMethod } from "./helpers/mock-cvm";
import {
  ICBGC_BY_COMPANY_PETROBRAS,
  ICBGC_REPORTS_LIST,
  ICBGC_REPORT_PETROBRAS_DETAIL,
  ICBGC_SYNC_STATUS,
} from "./fixtures/cvm";

test.describe("ICBGC — list", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, { authenticated: true });
    mockGet(page, CvmRoutes.icbgcSyncStatus, ICBGC_SYNC_STATUS);
  });

  test("renders sync KPIs and adoption distribution", async ({ page }) => {
    mockGet(page, CvmRoutes.icbgcReportsList, ICBGC_REPORTS_LIST);

    await page.goto("/cvm/icbgc");

    await expect(
      page.getByRole("heading", { name: "Governanca corporativa (ICBGC)" }),
    ).toBeVisible();

    // KPIs
    await expect(
      page.getByText("Informes", { exact: true }).locator("..").getByText("318"),
    ).toBeVisible();
    await expect(
      page.getByText("Empresas distintas", { exact: true }).locator("..").getByText("295"),
    ).toBeVisible();
    await expect(
      page.getByText("Anos disponiveis", { exact: true }).locator("..").getByText("3"),
    ).toBeVisible();
    await expect(
      page.getByText("Itens de pratica", { exact: true }).locator("..").getByText("17172"),
    ).toBeVisible();

    // Adoption distribution badges + counts
    await expect(page.getByText("Sim", { exact: true })).toBeVisible();
    await expect(page.getByText("11420")).toBeVisible();
    await expect(page.getByText("Parcial", { exact: true })).toBeVisible();
    await expect(page.getByText("Nao aplicavel", { exact: true })).toBeVisible();

    // Reports table
    await expect(page.getByText("Petroleo Brasileiro S.A. - Petrobras")).toBeVisible();
    await expect(page.getByText("Vale S.A.")).toBeVisible();
  });

  test("filters forward year and cd_cvm to the API", async ({ page }) => {
    const captured = mockGet(page, CvmRoutes.icbgcReportsList, ICBGC_REPORTS_LIST);

    await page.goto("/cvm/icbgc");
    await expect.poll(() => captured.length).toBeGreaterThanOrEqual(1);

    await page.getByLabel("cd_cvm", { exact: true }).fill("9512");
    await page.getByLabel("Ano", { exact: true }).selectOption("2025");

    await expect.poll(() => captured.at(-1)?.query.cd_cvm).toBe("9512");
    await expect.poll(() => captured.at(-1)?.query.year).toBe("2025");
  });

  test("navigates from list to report detail", async ({ page }) => {
    mockGet(page, CvmRoutes.icbgcReportsList, ICBGC_REPORTS_LIST);
    mockGet(page, CvmRoutes.icbgcReportById, ICBGC_REPORT_PETROBRAS_DETAIL);

    await page.goto("/cvm/icbgc");

    await page.getByRole("link", { name: "Abrir" }).first().click();

    await expect(page).toHaveURL(/\/cvm\/icbgc\/reports\/detail\?id_documento=123456/);
    await expect(
      page.getByRole("heading", { name: ICBGC_REPORT_PETROBRAS_DETAIL.nome_empresarial }),
    ).toBeVisible();
  });

  test("sync trigger sends year + force and toasts", async ({ page }) => {
    mockGet(page, CvmRoutes.icbgcReportsList, ICBGC_REPORTS_LIST);
    const triggered = mockMethod(page, "POST", CvmRoutes.icbgcSync, {
      status: 202,
      body: { task_id: "task-icbgc-1", status: "queued" },
    });

    await page.goto("/cvm/icbgc");

    await page.getByRole("button", { name: "Sincronizar" }).click();
    await page.getByLabel("Forcar reprocessar").check();
    await page.getByRole("button", { name: "Confirmar" }).click();

    await expect(page.getByText("Sync ICBGC agendado (task_id task-icbgc-1).")).toBeVisible();
    expect(triggered).toHaveLength(1);
    expect(triggered[0]?.query.force).toBe("true");
    expect(triggered[0]?.query.year).toBeDefined();
  });
});

test.describe("ICBGC — report detail", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, { authenticated: true });
    mockGet(page, CvmRoutes.icbgcReportById, ICBGC_REPORT_PETROBRAS_DETAIL);
  });

  test("renders identification, adoption badges and raw data", async ({ page }) => {
    await page.goto(
      `/cvm/icbgc/reports/detail?id_documento=${ICBGC_REPORT_PETROBRAS_DETAIL.id_documento}`,
    );

    await expect(
      page.getByRole("heading", { name: ICBGC_REPORT_PETROBRAS_DETAIL.nome_empresarial }),
    ).toBeVisible();

    // Identification card
    await expect(page.getByText(ICBGC_REPORT_PETROBRAS_DETAIL.cnpj_companhia)).toBeVisible();
    await expect(
      page.getByText("Correcao de item do capitulo de fiscalizacao"),
    ).toBeVisible();

    // One badge per normalized bucket in the items table
    await expect(page.getByText("Sim", { exact: true })).toHaveCount(2);
    await expect(page.getByText("Parcial", { exact: true })).toBeVisible();
    await expect(page.getByText("Nao", { exact: true })).toBeVisible();
    await expect(page.getByText("Nao aplicavel", { exact: true })).toBeVisible();

    // Explicacao rendered for explained items
    await expect(
      page.getByText("A maioria dos conselheiros e indicada pelo acionista controlador."),
    ).toBeVisible();

    // Cross-links
    await expect(page.getByRole("link", { name: "Ver no cadastro" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Documento na CVM/ })).toBeVisible();

    // Raw data viewer
    await expect(page.getByText('"ID_Documento": 123456')).toBeVisible();
  });
});

test.describe("ICBGC — company page", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, { authenticated: true });
    mockGet(page, CvmRoutes.icbgcByCompany, ICBGC_BY_COMPANY_PETROBRAS);
  });

  test("renders company header and yearly report history", async ({ page }) => {
    await page.goto("/cvm/icbgc/companies/detail?cd_cvm=9512");

    await expect(
      page.getByRole("heading", { name: ICBGC_BY_COMPANY_PETROBRAS.company_name }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Historico de informes" })).toBeVisible();

    // Two reports, each with a link to the detail page
    await expect(page.getByRole("link", { name: "Abrir" })).toHaveCount(2);
    await expect(
      page.getByRole("link", { name: "Abrir" }).first(),
    ).toHaveAttribute("href", "/cvm/icbgc/reports/detail?id_documento=123456");
  });
});
