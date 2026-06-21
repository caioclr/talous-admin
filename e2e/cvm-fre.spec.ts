import { expect, test } from "@playwright/test";
import { mockAuth } from "./helpers/mock-api";
import { CvmRoutes, mockGet, mockMethod } from "./helpers/mock-cvm";
import {
  FRE_FILINGS_LIST,
  FRE_FILING_PETROBRAS_DETAIL,
  FRE_SYNC_STATUS,
} from "./fixtures/cvm";

const FRE_VALIDATE_URL = `/cvm/fre/validate?id_documento=${encodeURIComponent(
  FRE_FILING_PETROBRAS_DETAIL.id_documento,
)}`;

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

  test("mostra badges de status e linka para a tela de validacao", async ({ page }) => {
    mockGet(page, CvmRoutes.freFilingsList, FRE_FILINGS_LIST);

    await page.goto("/cvm/fre");

    const table = page.getByRole("table");
    await expect(table.getByText("Pendente", { exact: true }).first()).toBeVisible();
    await expect(table.getByText("Validado", { exact: true })).toBeVisible();

    // Link de validacao aponta para a rota /cvm/fre/validate por id_documento.
    const link = page.locator(
      `a[href="/cvm/fre/validate?id_documento=${encodeURIComponent(
        FRE_FILING_PETROBRAS_DETAIL.id_documento,
      )}"]`,
    );
    await expect(link).toBeVisible();
  });

  test("filtro de status envia validation_status ao backend", async ({ page }) => {
    const captured = mockGet(page, CvmRoutes.freFilingsList, FRE_FILINGS_LIST);

    await page.goto("/cvm/fre");
    await expect.poll(() => captured.length).toBeGreaterThanOrEqual(1);

    await page.getByLabel("Status de validacao").selectOption("pending");

    await expect.poll(() => captured.at(-1)?.query.validation_status).toBe("pending");
  });
});

test.describe("FRE — tela de validacao", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, { authenticated: true });
  });

  test("renderiza header, secoes legiveis e selo pendente", async ({ page }) => {
    mockGet(page, CvmRoutes.freFilingById, FRE_FILING_PETROBRAS_DETAIL);

    await page.goto(FRE_VALIDATE_URL);

    await expect(
      page.getByRole("heading", { name: FRE_FILING_PETROBRAS_DETAIL.nome_companhia }),
    ).toBeVisible();
    await expect(page.getByText("Validacao de FRE", { exact: true })).toBeVisible();
    await expect(page.getByText(/metadado interno de QA/)).toBeVisible();

    // Comeca pendente.
    await expect(page.getByText("Pendente de validacao")).toBeVisible();

    // Secao default (capital social) legivel.
    await expect(page.getByRole("heading", { name: "Capital social" })).toBeVisible();

    // Outra secao por aba (auditores).
    await page.getByRole("tab", { name: "Auditores" }).click();
    await expect(page.getByText("KPMG Auditores Independentes")).toBeVisible();
  });

  test("marca como valido (POST generico), exibe selo e permite reverter", async ({ page }) => {
    const state = { validated: false };

    await page.route(CvmRoutes.freFilingById, async (route) => {
      if (route.request().method() !== "GET") {
        await route.fallback();
        return;
      }
      const validation = state.validated
        ? {
            status: "valid",
            validated_by: {
              id: "00000000-0000-0000-0000-000000000001",
              name: "Caio Moderador",
              email: "caio@talous.ai",
            },
            validated_at: "2026-05-02T13:45:00Z",
          }
        : FRE_FILING_PETROBRAS_DETAIL.validation;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ...FRE_FILING_PETROBRAS_DETAIL, validation }),
      });
    });

    const validateCalls: Array<unknown> = [];
    await page.route(CvmRoutes.validationsValidate, async (route) => {
      if (route.request().method() !== "POST") {
        await route.fallback();
        return;
      }
      validateCalls.push(JSON.parse(route.request().postData() ?? "null"));
      state.validated = true;
      await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });

    const invalidateCalls: Array<unknown> = [];
    await page.route(CvmRoutes.validationsInvalidate, async (route) => {
      if (route.request().method() !== "POST") {
        await route.fallback();
        return;
      }
      invalidateCalls.push(JSON.parse(route.request().postData() ?? "null"));
      state.validated = false;
      await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });

    await page.goto(FRE_VALIDATE_URL);

    await expect(page.getByText("Pendente de validacao")).toBeVisible();

    await page.getByRole("button", { name: "Marcar como valido" }).click();

    // Body do POST generico carrega { report_type, ref }.
    await expect.poll(() => validateCalls.length).toBe(1);
    expect(validateCalls[0]).toEqual({
      report_type: "fre",
      ref: FRE_FILING_PETROBRAS_DETAIL.id_documento,
    });

    // Selo "Validado por X em ..." aparece apos refetch.
    await expect(page.getByText(/Validado por Caio Moderador em/)).toBeVisible();

    // Reverter volta a pendente.
    await page.getByRole("button", { name: "Reverter validacao" }).click();
    await expect.poll(() => invalidateCalls.length).toBe(1);
    expect(invalidateCalls[0]).toEqual({
      report_type: "fre",
      ref: FRE_FILING_PETROBRAS_DETAIL.id_documento,
    });
    await expect(page.getByText("Pendente de validacao")).toBeVisible();
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
