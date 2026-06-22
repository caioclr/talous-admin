import { expect, test, type Page } from "@playwright/test";
import { mockAuth } from "./helpers/mock-api";
import { CvmRoutes, mockGet } from "./helpers/mock-cvm";
import {
  ITR_DFP_ACCOUNT_LINES_DRE,
  ITR_DFP_ACCOUNT_LINES_DRE_PRIOR,
  ITR_DFP_ACCOUNT_LINES_EMPTY,
  ITR_DFP_FILINGS_WITH_VALIDATION,
  ITR_DFP_FILING_PETROBRAS_INDIVIDUAL,
  ITR_DFP_FILING_PETROBRAS_PENDING,
} from "./fixtures/cvm";

/**
 * Account-lines responde por `ordem_exerc`: ULTIMO recebe `ultimo`,
 * PENULTIMO recebe `penultimo` (default `{ items: [] }`). Permite exercitar a
 * comparacao de periodo e o fallback de coluna unica.
 */
function mockAccountLinesByOrdem(
  page: Page,
  ultimo: unknown,
  penultimo: unknown = ITR_DFP_ACCOUNT_LINES_EMPTY,
) {
  void page.route(CvmRoutes.itrDfpAccountLines, async (route) => {
    if (route.request().method() !== "GET") {
      await route.fallback();
      return;
    }
    const url = new URL(route.request().url());
    const ordem = url.searchParams.get("ordem_exerc");
    const body = ordem === "PENULTIMO" ? penultimo : ultimo;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  });
}

const VALIDATE_URL =
  "/cvm/itr-dfp/validate?cd_cvm=9512&doc_type=itr&reference_date=2025-03-31&grupo_dfr=consolidado&version=1";

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

    // Status badges (escopados na tabela; "Pendente" tambem existe como option
    // e ha varios filings pendentes na fixture).
    const table = page.getByRole("table");
    await expect(table.getByText("Pendente", { exact: true }).first()).toBeVisible();
    await expect(table.getByText("Validado", { exact: true })).toBeVisible();

    // Link de validacao carrega a identidade do filing (ITR Q1/2025 consolidado).
    const link = page.locator(
      'a[href="/cvm/itr-dfp/validate?cd_cvm=9512&doc_type=itr&reference_date=2025-03-31&grupo_dfr=consolidado&version=1"]',
    );
    await expect(link).toBeVisible();
  });

  test("filtro de status envia validation_status ao backend", async ({ page }) => {
    const captured = mockGet(page, CvmRoutes.itrDfpFilings, ITR_DFP_FILINGS_WITH_VALIDATION);

    await page.goto("/cvm/itr-dfp");
    await expect.poll(() => captured.length).toBeGreaterThanOrEqual(1);

    await page.getByLabel("Status de validacao").selectOption("pending");

    await expect.poll(() => captured.at(-1)?.query.validation_status).toBe("pending");
  });

  test("envia page/page_size e pagina pela barra de paginacao", async ({ page }) => {
    // S09 T02: a listagem virou envelope paginado. Fixture com 2 paginas para
    // exercitar o controle de paginacao (Proxima -> page=2).
    const captured: Array<Record<string, string>> = [];
    await page.route(CvmRoutes.itrDfpFilings, async (route) => {
      if (route.request().method() !== "GET") {
        await route.fallback();
        return;
      }
      const url = new URL(route.request().url());
      const requestedPage = Number(url.searchParams.get("page") ?? "1");
      captured.push(Object.fromEntries(url.searchParams));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: ITR_DFP_FILINGS_WITH_VALIDATION.items,
          pagination: { page: requestedPage, page_size: 50, total: 80, total_pages: 2 },
        }),
      });
    });

    await page.goto("/cvm/itr-dfp");

    // Load inicial: page=1 e page_size explicito (50).
    await expect.poll(() => captured.length).toBeGreaterThanOrEqual(1);
    expect(captured[0]?.page).toBe("1");
    expect(captured[0]?.page_size).toBe("50");

    // KPI "Filings (total)" reflete o total do envelope, nao a pagina.
    await expect(page.getByRole("heading", { name: "80", exact: true })).toBeVisible();

    // Barra de paginacao avanca para page=2.
    await page.getByRole("button", { name: "Proxima" }).click();
    await expect.poll(() => captured.at(-1)?.page).toBe("2");
  });
});

test.describe("ITR/DFP — tela de validacao", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, { authenticated: true });
  });

  test("header rico: eyebrow, nome da empresa e label por trimestre", async ({ page }) => {
    mockGet(page, CvmRoutes.itrDfpFilings, ITR_DFP_FILINGS_WITH_VALIDATION);
    mockAccountLinesByOrdem(page, ITR_DFP_ACCOUNT_LINES_DRE, ITR_DFP_ACCOUNT_LINES_DRE_PRIOR);

    await page.goto(VALIDATE_URL);

    // Titulo = nome completo da empresa; eyebrow = "VALIDACAO DE FILING".
    await expect(
      page.getByRole("heading", { name: "Petroleo Brasileiro S.A. - Petrobras" }),
    ).toBeVisible();
    await expect(page.getByText("Validacao de filing", { exact: true })).toBeVisible();
    await expect(page.getByText(/metadado interno de QA/)).toBeVisible();

    // Label por trimestre no eyebrow (ITR Q1/2025), nao a data crua.
    await expect(page.getByText("ITR Q1/2025").first()).toBeVisible();
  });

  test("renderiza DRE formatado com comparacao de periodo e Var%", async ({ page }) => {
    mockGet(page, CvmRoutes.itrDfpFilings, ITR_DFP_FILINGS_WITH_VALIDATION);
    mockAccountLinesByOrdem(page, ITR_DFP_ACCOUNT_LINES_DRE, ITR_DFP_ACCOUNT_LINES_DRE_PRIOR);

    await page.goto(VALIDATE_URL);

    // Conta de topo + numero formatado do periodo atual.
    await expect(page.getByText("Receita de Venda de Bens e/ou Servicos")).toBeVisible();
    await expect(page.getByText("123.456.789", { exact: true })).toBeVisible();

    // Cabecalhos das duas colunas rotulados por trimestre/ano.
    const table = page.getByRole("table");
    await expect(table.getByText("ITR Q1/2025", { exact: true })).toBeVisible();
    await expect(table.getByText("ITR Q1/2024", { exact: true })).toBeVisible();
    await expect(table.getByText("Var%", { exact: true })).toBeVisible();

    // Valor do periodo anterior e Var% (123.456.789 vs 100.000.000 => +23,5%).
    await expect(page.getByText("100.000.000", { exact: true })).toBeVisible();
    await expect(page.getByText("+23,5%", { exact: true })).toBeVisible();
  });

  test("sem PENULTIMO: cai para coluna unica (sem comparacao)", async ({ page }) => {
    mockGet(page, CvmRoutes.itrDfpFilings, ITR_DFP_FILINGS_WITH_VALIDATION);
    mockAccountLinesByOrdem(page, ITR_DFP_ACCOUNT_LINES_DRE, ITR_DFP_ACCOUNT_LINES_EMPTY);

    await page.goto(VALIDATE_URL);

    await expect(page.getByText("123.456.789", { exact: true })).toBeVisible();
    // Sem dados anteriores, a coluna de comparacao e a Var% nao aparecem.
    await expect(page.getByText("Var%", { exact: true })).toHaveCount(0);
  });

  test("navega entre filings da mesma empresa (ITR + DFP por data)", async ({ page }) => {
    mockGet(page, CvmRoutes.itrDfpFilings, ITR_DFP_FILINGS_WITH_VALIDATION);
    mockAccountLinesByOrdem(page, ITR_DFP_ACCOUNT_LINES_DRE, ITR_DFP_ACCOUNT_LINES_DRE_PRIOR);

    await page.goto(VALIDATE_URL);

    // 3 filings consolidados (ITR 2024Q1, DFP 2024, ITR 2025Q1); atual e o 3o.
    await expect(page.getByText("3 de 3")).toBeVisible();

    // Botao do trimestre anterior leva ao filing por router.push (mesma query).
    await page.getByRole("button", { name: "DFP 2024", exact: true }).click();
    await expect(page).toHaveURL(/doc_type=dfp&reference_date=2024-12-31/);
    await expect(page.getByText("2 de 3")).toBeVisible();

    // Seta "anterior" recua para o ITR 2024Q1.
    await page.getByRole("button", { name: "Filing anterior" }).click();
    await expect(page).toHaveURL(/doc_type=itr&reference_date=2024-03-31/);
    await expect(page.getByText("1 de 3")).toBeVisible();
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
      // S09 T02: a listagem agora e um envelope paginado.
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: [filing],
          pagination: { page: 1, page_size: 200, total: 1, total_pages: 1 },
        }),
      });
    });

    mockAccountLinesByOrdem(page, ITR_DFP_ACCOUNT_LINES_DRE, ITR_DFP_ACCOUNT_LINES_DRE_PRIOR);

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

    await page.goto(VALIDATE_URL);

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
