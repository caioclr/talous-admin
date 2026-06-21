import { expect, test } from "@playwright/test";
import { mockAuth } from "./helpers/mock-api";
import { CvmRoutes, mockGet } from "./helpers/mock-cvm";
import {
  ITR_DFP_ACCOUNT_LINES_DRE,
  ITR_DFP_FILINGS_WITH_VALIDATION,
  ITR_DFP_FILING_PETROBRAS_INDIVIDUAL,
  ITR_DFP_FILING_PETROBRAS_PENDING,
} from "./fixtures/cvm";

test.describe("ITR/DFP — lista de validacao", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, { authenticated: true });
  });

  test("renderiza badges de status e linka para a tela de validacao", async ({ page }) => {
    mockGet(page, CvmRoutes.itrDfpFilings, ITR_DFP_FILINGS_WITH_VALIDATION);

    await page.goto("/cvm/itr-dfp");

    await expect(
      page.getByRole("heading", { name: "Validacao de filings ITR/DFP" }),
    ).toBeVisible();

    // Status badges (escopados na tabela; "Pendente" tambem existe como option).
    const table = page.getByRole("table");
    await expect(table.getByText("Pendente", { exact: true })).toBeVisible();
    await expect(table.getByText("Validado", { exact: true })).toBeVisible();

    // Link de validacao carrega a identidade do filing.
    const link = page.getByRole("link", { name: "Abrir" }).first();
    await expect(link).toHaveAttribute(
      "href",
      "/cvm/itr-dfp/validate?cd_cvm=9512&doc_type=itr&reference_date=2025-03-31&grupo_dfr=consolidado&version=1",
    );
  });

  test("filtro de status envia validation_status ao backend", async ({ page }) => {
    const captured = mockGet(page, CvmRoutes.itrDfpFilings, ITR_DFP_FILINGS_WITH_VALIDATION);

    await page.goto("/cvm/itr-dfp");
    await expect.poll(() => captured.length).toBeGreaterThanOrEqual(1);

    await page.getByLabel("Status de validacao").selectOption("pending");

    await expect.poll(() => captured.at(-1)?.query.validation_status).toBe("pending");
  });
});

test.describe("ITR/DFP — tela de validacao", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, { authenticated: true });
    mockGet(page, CvmRoutes.itrDfpAccountLines, ITR_DFP_ACCOUNT_LINES_DRE);
  });

  test("renderiza DRE formatado com hierarquia de contas", async ({ page }) => {
    mockGet(page, CvmRoutes.itrDfpFilings, ITR_DFP_FILINGS_WITH_VALIDATION);

    await page.goto(
      "/cvm/itr-dfp/validate?cd_cvm=9512&doc_type=itr&reference_date=2025-03-31&grupo_dfr=consolidado&version=1",
    );

    await expect(
      page.getByRole("heading", { name: /ITR · .* · consolidado/ }),
    ).toBeVisible();

    // Conta de topo + numero formatado em pt-BR (separador de milhar) + escala.
    await expect(page.getByText("Receita de Venda de Bens e/ou Servicos")).toBeVisible();
    await expect(page.getByText("123.456.789", { exact: true })).toBeVisible();
    await expect(page.getByText("Valor (escala: MILHAR)")).toBeVisible();
    await expect(page.getByText("Custo de Materias-primas")).toBeVisible();
  });

  test("marca como valido (POST), exibe selo e permite reverter", async ({ page }) => {
    // Estado server-side: a transicao acontece no proprio handler do POST,
    // evitando corrida com o refetch disparado pela mutation.
    const state = { validated: false };

    await page.route(CvmRoutes.itrDfpFilings, async (route) => {
      if (route.request().method() !== "GET") {
        await route.fallback();
        return;
      }
      const filing = state.validated
        ? { ...ITR_DFP_FILING_PETROBRAS_PENDING, validation: ITR_DFP_FILING_PETROBRAS_INDIVIDUAL.validation }
        : ITR_DFP_FILING_PETROBRAS_PENDING;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([filing]),
      });
    });

    const validateCalls: Array<unknown> = [];
    await page.route(CvmRoutes.itrDfpValidate, async (route) => {
      if (route.request().method() !== "POST") {
        await route.fallback();
        return;
      }
      validateCalls.push(JSON.parse(route.request().postData() ?? "null"));
      state.validated = true;
      await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });

    const invalidateCalls: Array<unknown> = [];
    await page.route(CvmRoutes.itrDfpInvalidate, async (route) => {
      if (route.request().method() !== "POST") {
        await route.fallback();
        return;
      }
      invalidateCalls.push(JSON.parse(route.request().postData() ?? "null"));
      state.validated = false;
      await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });

    await page.goto(
      "/cvm/itr-dfp/validate?cd_cvm=9512&doc_type=itr&reference_date=2025-03-31&grupo_dfr=consolidado&version=1",
    );

    // Comeca pendente.
    await expect(page.getByText("Pendente de validacao")).toBeVisible();

    await page.getByRole("button", { name: "Marcar como valido" }).click();

    // Body do POST carrega a identidade do filing.
    await expect.poll(() => validateCalls.length).toBe(1);
    expect(validateCalls[0]).toEqual({
      cd_cvm: 9512,
      doc_type: "itr",
      reference_date: "2025-03-31",
      grupo_dfr: "consolidado",
      version: 1,
    });

    // Selo "Validado por X em ..." aparece apos refetch.
    await expect(page.getByText(/Validado por Caio Moderador em/)).toBeVisible();

    // Reverter volta a pendente.
    await page.getByRole("button", { name: "Reverter validacao" }).click();
    await expect.poll(() => invalidateCalls.length).toBe(1);
    await expect(page.getByText("Pendente de validacao")).toBeVisible();
  });
});
