import { expect, test } from "@playwright/test";
import { mockAuth } from "./helpers/mock-api";
import { CvmRoutes, mockGet, mockMethod } from "./helpers/mock-cvm";
import {
  FCA_BY_COMPANY_PETROBRAS,
  FCA_DOCUMENTOS_LIST,
  FCA_DOCUMENTO_PETROBRAS_DETAIL,
  FCA_SYNC_STATUS,
} from "./fixtures/cvm";

test.describe("FCA — list", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, { authenticated: true });
    mockGet(page, CvmRoutes.fcaSyncStatus, FCA_SYNC_STATUS);
  });

  test("renders sync KPIs and rows by section", async ({ page }) => {
    mockGet(page, CvmRoutes.fcaDocumentosList, FCA_DOCUMENTOS_LIST);

    await page.goto("/cvm/fca");

    await expect(
      page.getByRole("heading", { name: "Formulario Cadastral (FCA)" }),
    ).toBeVisible();

    // KPIs
    await expect(
      page.getByText("Documentos", { exact: true }).locator("..").getByText("642"),
    ).toBeVisible();
    await expect(
      page.getByText("Empresas distintas", { exact: true }).locator("..").getByText("410"),
    ).toBeVisible();
    await expect(
      page.getByText("Anos disponiveis", { exact: true }).locator("..").getByText("2", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Ultimo hash", { exact: false }).locator("..").getByText(/fca9999/),
    ).toBeVisible();

    // rows_by_section card
    await expect(page.getByRole("heading", { name: "Volume por secao" })).toBeVisible();
    await expect(page.getByText("valor_mobiliario", { exact: true })).toBeVisible();
    await expect(page.getByText("1530")).toBeVisible();
    await expect(page.getByText("auditor", { exact: true })).toBeVisible();
    await expect(page.getByText("705")).toBeVisible();

    // Documentos table
    await expect(page.getByText("Petroleo Brasileiro S.A. - Petrobras")).toBeVisible();
    await expect(page.getByText("Vale S.A.")).toBeVisible();
  });

  test("filters forward year and cd_cvm to the API", async ({ page }) => {
    const captured = mockGet(page, CvmRoutes.fcaDocumentosList, FCA_DOCUMENTOS_LIST);

    await page.goto("/cvm/fca");
    await expect.poll(() => captured.length).toBeGreaterThanOrEqual(1);

    await page.getByLabel("cd_cvm", { exact: true }).fill("9512");
    await page.getByLabel("Ano", { exact: true }).selectOption("2025");

    await expect.poll(() => captured.at(-1)?.query.cd_cvm).toBe("9512");
    await expect.poll(() => captured.at(-1)?.query.year).toBe("2025");
  });

  test("navigates from list to documento detail", async ({ page }) => {
    mockGet(page, CvmRoutes.fcaDocumentosList, FCA_DOCUMENTOS_LIST);
    mockGet(page, CvmRoutes.fcaDocumentoById, FCA_DOCUMENTO_PETROBRAS_DETAIL);

    await page.goto("/cvm/fca");

    await page.getByRole("link", { name: "Abrir" }).first().click();

    await expect(page).toHaveURL(/\/cvm\/fca\/documentos\/detail\?id_documento=778899/);
    await expect(
      page.getByRole("heading", { name: FCA_DOCUMENTO_PETROBRAS_DETAIL.nome_empresarial }),
    ).toBeVisible();
  });

  test("sync trigger sends year + force and toasts", async ({ page }) => {
    mockGet(page, CvmRoutes.fcaDocumentosList, FCA_DOCUMENTOS_LIST);
    const triggered = mockMethod(page, "POST", CvmRoutes.fcaSync, {
      status: 202,
      body: { task_id: "task-fca-1", status: "queued" },
    });

    await page.goto("/cvm/fca");

    await page.getByRole("button", { name: "Sincronizar" }).click();
    await page.getByLabel("Forcar reprocessar").check();
    await page.getByRole("button", { name: "Confirmar" }).click();

    await expect(page.getByText("Sync FCA agendado (task_id task-fca-1).")).toBeVisible();
    expect(triggered).toHaveLength(1);
    expect(triggered[0]?.query.force).toBe("true");
    expect(triggered[0]?.query.year).toBeDefined();
  });
});

test.describe("FCA — documento detail", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, { authenticated: true });
    mockGet(page, CvmRoutes.fcaDocumentoById, FCA_DOCUMENTO_PETROBRAS_DETAIL);
  });

  test("renders identification, geral card and section tabs", async ({ page }) => {
    await page.goto(
      `/cvm/fca/documentos/detail?id_documento=${FCA_DOCUMENTO_PETROBRAS_DETAIL.id_documento}`,
    );

    await expect(
      page.getByRole("heading", { name: FCA_DOCUMENTO_PETROBRAS_DETAIL.nome_empresarial }),
    ).toBeVisible();

    // Identification card
    await expect(page.getByText(FCA_DOCUMENTO_PETROBRAS_DETAIL.cnpj_companhia)).toBeVisible();

    // Geral card
    await expect(page.getByRole("heading", { name: "Geral" })).toBeVisible();
    await expect(page.getByText("Petroleo e Gas", { exact: true })).toBeVisible();
    await expect(page.getByText("Fase Operacional", { exact: true })).toBeVisible();

    // Tickers tab is the default — segments are highlighted
    await expect(page.getByText("PETR3")).toBeVisible();
    await expect(page.getByText("PETR4")).toBeVisible();
    await expect(page.getByText("Novo Mercado", { exact: true })).toBeVisible();
    await expect(page.getByText("Tradicional", { exact: true })).toBeVisible();

    // DRI tab
    await page.getByRole("tab", { name: "DRI" }).click();
    await expect(page.getByText("Fernando Sabbi Melgarejo")).toBeVisible();
    await expect(page.getByText("ri@petrobras.com.br")).toBeVisible();

    // Auditores tab — auditor with data_fim filled gets an "Encerrado" badge
    await page.getByRole("tab", { name: "Auditores" }).click();
    await expect(page.getByText("KPMG Auditores Independentes")).toBeVisible();
    await expect(
      page.getByText("PricewaterhouseCoopers Auditores Independentes"),
    ).toBeVisible();
    await expect(page.getByText("Encerrado", { exact: true })).toHaveCount(1);

    // Cross-link
    await expect(page.getByRole("link", { name: "Ver no cadastro" })).toBeVisible();
  });
});

test.describe("FCA — company page", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, { authenticated: true });
    mockGet(page, CvmRoutes.fcaByCompany, FCA_BY_COMPANY_PETROBRAS);
  });

  test("renders company header and document history", async ({ page }) => {
    await page.goto("/cvm/fca/companies/detail?cd_cvm=9512");

    await expect(
      page.getByRole("heading", { name: FCA_BY_COMPANY_PETROBRAS.company_name }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Historico de documentos" })).toBeVisible();

    // Two documents, each with a link to the detail page
    await expect(page.getByRole("link", { name: "Abrir" })).toHaveCount(2);
    await expect(
      page.getByRole("link", { name: "Abrir" }).first(),
    ).toHaveAttribute("href", "/cvm/fca/documentos/detail?id_documento=778899");
  });
});
