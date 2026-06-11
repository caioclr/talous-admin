import { expect, test } from "@playwright/test";
import { mockAuth } from "./helpers/mock-api";
import { CvmRoutes, mockGet, mockMethod } from "./helpers/mock-cvm";
import {
  FRE_FILINGS_LIST,
  FRE_FILING_PETROBRAS_DETAIL,
  FRE_SYNC_STATUS,
} from "./fixtures/cvm";

test.describe("FRE — list", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, { authenticated: true });
    mockGet(page, CvmRoutes.freSyncStatus, FRE_SYNC_STATUS);
  });

  test("renders sync KPIs and rows-by-section grid", async ({ page }) => {
    mockGet(page, CvmRoutes.freFilingsList, FRE_FILINGS_LIST);

    await page.goto("/cvm/fre");

    await expect(
      page.getByRole("heading", { name: "Formulario de Referencia (FRE)" }),
    ).toBeVisible();

    // KPIs
    await expect(
      page.getByText("Filings", { exact: true }).locator("..").getByText("412"),
    ).toBeVisible();
    await expect(
      page.getByText("Empresas distintas", { exact: true }).locator("..").getByText("380"),
    ).toBeVisible();

    // rows_by_section card mostra ao menos uma seção
    await expect(page.getByText("posicao_acionaria")).toBeVisible();
    await expect(page.getByText("1280")).toBeVisible();

    // Tabela de filings
    await expect(page.getByText("Petroleo Brasileiro S.A. - Petrobras")).toBeVisible();
  });

  test("filters forward year and cd_cvm", async ({ page }) => {
    const captured = mockGet(page, CvmRoutes.freFilingsList, FRE_FILINGS_LIST);

    await page.goto("/cvm/fre");
    await expect.poll(() => captured.length).toBeGreaterThanOrEqual(1);

    await page.getByLabel("cd_cvm", { exact: true }).fill("9512");
    await page.getByLabel("Ano", { exact: true }).selectOption("2025");

    await expect.poll(() => captured.at(-1)?.query.cd_cvm).toBe("9512");
    await expect.poll(() => captured.at(-1)?.query.year).toBe("2025");
  });

  test("sync trigger sends year + force and toasts", async ({ page }) => {
    mockGet(page, CvmRoutes.freFilingsList, FRE_FILINGS_LIST);
    const triggered = mockMethod(page, "POST", CvmRoutes.freSync, {
      status: 202,
      body: { task_id: "task-fre-1", status: "queued" },
    });

    await page.goto("/cvm/fre");

    await page.getByRole("button", { name: "Sincronizar" }).click();
    await page.getByLabel("Forcar reprocessar").check();
    await page.getByRole("button", { name: "Confirmar" }).click();

    await expect(page.getByText("Sync FRE agendado (task_id task-fre-1).")).toBeVisible();
    expect(triggered).toHaveLength(1);
    expect(triggered[0]?.query.force).toBe("true");
  });
});

test.describe("FRE — filing detail", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, { authenticated: true });
    mockGet(page, CvmRoutes.freFilingById, FRE_FILING_PETROBRAS_DETAIL);
  });

  test("renders identification + capital tab by default", async ({ page }) => {
    await page.goto(
      `/cvm/fre/filings/detail?id_documento=${encodeURIComponent(FRE_FILING_PETROBRAS_DETAIL.id_documento)}`,
    );

    await expect(
      page.getByRole("heading", { name: FRE_FILING_PETROBRAS_DETAIL.nome_companhia }),
    ).toBeVisible();

    // Identification card
    await expect(page.getByText(FRE_FILING_PETROBRAS_DETAIL.cnpj_companhia)).toBeVisible();

    // Capital tab is the default
    await expect(page.getByRole("heading", { name: "Capital social" })).toBeVisible();
    await expect(page.getByText("Distribuicao de capital")).toBeVisible();

    // Cross-link
    await expect(page.getByRole("link", { name: "Ir para empresa" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Documento na CVM/ })).toBeVisible();
  });

  test("Auditores tab lists typed columns", async ({ page }) => {
    await page.goto(
      `/cvm/fre/filings/detail?id_documento=${encodeURIComponent(FRE_FILING_PETROBRAS_DETAIL.id_documento)}`,
    );

    await page.getByRole("tab", { name: "Auditores" }).click();

    await expect(page.getByText("KPMG Auditores Independentes")).toBeVisible();
    await expect(page.getByText("57755217000122")).toBeVisible();
  });

  test("Valores mobiliarios tab shows typed table", async ({ page }) => {
    await page.goto(
      `/cvm/fre/filings/detail?id_documento=${encodeURIComponent(FRE_FILING_PETROBRAS_DETAIL.id_documento)}`,
    );

    await page.getByRole("tab", { name: "Valores mobiliarios" }).click();

    // Header from typed columns
    await expect(page.getByRole("columnheader", { name: "Valor mobiliario" })).toBeVisible();
    await expect(page.getByText("PETR4")).toBeVisible();
  });

  test("Outros tab shows the dynamic sub-tables", async ({ page }) => {
    await page.goto(
      `/cvm/fre/filings/detail?id_documento=${encodeURIComponent(FRE_FILING_PETROBRAS_DETAIL.id_documento)}`,
    );

    await page.getByRole("tab", { name: "Outros" }).click();

    await expect(page.getByRole("heading", { name: "Responsaveis" })).toBeVisible();
    await expect(page.getByText("Joao da Silva")).toBeVisible();
    await expect(page.getByText("NYSE")).toBeVisible();
  });
});
