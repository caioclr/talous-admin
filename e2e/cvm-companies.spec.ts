import { expect, test } from "@playwright/test";
import { mockAuth } from "./helpers/mock-api";
import { CvmRoutes, mockGet } from "./helpers/mock-cvm";
import {
  CHANGES_PETROBRAS,
  COMPANIES_LIST,
  COMPANY_DETAIL_PETROBRAS,
  COMPANY_PETROBRAS,
  HISTORY_PETROBRAS,
} from "./fixtures/cvm";

const EMPTY_PAGED = {
  items: [],
  pagination: { page: 1, page_size: 20, total: 0, total_pages: 0 },
};

test.describe("CVM companies — list", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, { authenticated: true });
  });

  test("renders the table with companies and pagination meta", async ({ page }) => {
    mockGet(page, CvmRoutes.companiesList, COMPANIES_LIST);

    await page.goto("/cvm/companies");

    await expect(page.getByRole("heading", { name: "Empresas CVM" })).toBeVisible();
    await expect(page.getByText(COMPANY_PETROBRAS.name)).toBeVisible();
    await expect(page.getByText("Vale S.A.")).toBeVisible();
    await expect(page.getByText("PETR4")).toBeVisible();
    await expect(page.getByText("Pagina 1 de 1 · 2 itens")).toBeVisible();
  });

  test("filtering by situation forwards the query param to the backend", async ({ page }) => {
    const captured = mockGet(page, CvmRoutes.companiesList, COMPANIES_LIST);

    await page.goto("/cvm/companies");
    await expect.poll(() => captured.length).toBeGreaterThanOrEqual(1);

    await page.getByRole("combobox").nth(0).selectOption("ATIVO");

    await expect.poll(() => captured.at(-1)?.query.situation).toBe("ATIVO");
    expect(captured.at(-1)?.query.page).toBe("1");
  });

  test("toggling is_active filter sends is_active=true", async ({ page }) => {
    const captured = mockGet(page, CvmRoutes.companiesList, COMPANIES_LIST);

    await page.goto("/cvm/companies");
    await expect.poll(() => captured.length).toBeGreaterThanOrEqual(1);

    // 4 selects: situation, category, active. The active one is the last.
    const selects = page.getByRole("combobox");
    await selects.nth(2).selectOption("true");

    await expect.poll(() => captured.at(-1)?.query.is_active).toBe("true");
  });

  test("search input forwards query to backend after typing", async ({ page }) => {
    const captured = mockGet(page, CvmRoutes.companiesList, COMPANIES_LIST);

    await page.goto("/cvm/companies");
    await expect.poll(() => captured.length).toBeGreaterThanOrEqual(1);

    await page.getByPlaceholder("Buscar por nome ou CNPJ").fill("Petro");

    await expect.poll(() => captured.at(-1)?.query.search).toBe("Petro");
  });

  test("clicking a row navigates to the company detail by cd_cvm", async ({ page }) => {
    mockGet(page, CvmRoutes.companiesList, COMPANIES_LIST);
    mockGet(page, CvmRoutes.companyDetail, COMPANY_DETAIL_PETROBRAS);
    mockGet(page, CvmRoutes.companyHistory, HISTORY_PETROBRAS);
    mockGet(page, CvmRoutes.companyChanges, CHANGES_PETROBRAS);
    mockGet(page, CvmRoutes.ipeByCompany, {
      items: [],
      pagination: { page: 1, page_size: 5, total: 0, total_pages: 0 },
    });
    mockGet(page, CvmRoutes.itrDfpFilings, []);

    await page.goto("/cvm/companies");

    await page.getByRole("row", { name: /Petroleo Brasileiro/ }).click();

    await page.waitForURL(/\/cvm\/companies\/detail\?cd_cvm=9512/);
    await expect(
      page.getByRole("heading", { name: COMPANY_DETAIL_PETROBRAS.name }),
    ).toBeVisible();
  });

  test("renders empty state when backend returns zero results", async ({ page }) => {
    mockGet(page, CvmRoutes.companiesList, EMPTY_PAGED);

    await page.goto("/cvm/companies");

    await expect(
      page.getByText("Nenhuma empresa encontrada para os filtros informados."),
    ).toBeVisible();
  });
});

test.describe("CVM companies — detail", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, { authenticated: true });
    mockGet(page, CvmRoutes.companyDetail, COMPANY_DETAIL_PETROBRAS);
    mockGet(page, CvmRoutes.companyHistory, HISTORY_PETROBRAS);
    mockGet(page, CvmRoutes.companyChanges, CHANGES_PETROBRAS);
    mockGet(page, CvmRoutes.ipeByCompany, {
      items: [],
      pagination: { page: 1, page_size: 5, total: 0, total_pages: 0 },
    });
    mockGet(page, CvmRoutes.itrDfpFilings, []);
  });

  test("Info tab shows denormalized company fields", async ({ page }) => {
    await page.goto("/cvm/companies/detail?cd_cvm=9512");

    await expect(page.getByText("CNPJ")).toBeVisible();
    await expect(page.getByText(COMPANY_DETAIL_PETROBRAS.cnpj!)).toBeVisible();
    // O setor aparece tambem no header (descricao); casa o valor exato do card.
    await expect(
      page.getByText(COMPANY_DETAIL_PETROBRAS.cvm_setor_atividade!, { exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Uniao Federal")).toBeVisible();
  });

  test("Historico tab lists snapshots and links to detail", async ({ page }) => {
    await page.goto("/cvm/companies/detail?cd_cvm=9512");
    await page.getByRole("tab", { name: "Historico" }).click();

    await expect(page.getByRole("link", { name: "Abrir detalhe" }).first()).toBeVisible();
    // Two snapshots in the fixture
    await expect(page.getByRole("link", { name: "Abrir detalhe" })).toHaveCount(2);
  });

  test("Mudancas tab renders field-level diff between snapshots", async ({ page }) => {
    await page.goto("/cvm/companies/detail?cd_cvm=9512");
    await page.getByRole("tab", { name: "Mudancas" }).click();

    await expect(page.getByText("controle_acionario")).toBeVisible();
    await expect(page.getByText("Uniao Federal (50,5%)")).toBeVisible();
    await expect(page.getByText("Uniao Federal (50,7%)")).toBeVisible();
  });

  test("Empty Mudancas shows the no-changes message", async ({ page }) => {
    // Override changes with empty array using a regex more specific than the
    // default suite-level mock — the latest registered handler wins in
    // Playwright route ordering.
    await page.unroute(CvmRoutes.companyChanges);
    mockGet(page, CvmRoutes.companyChanges, []);

    await page.goto("/cvm/companies/detail?cd_cvm=9512");
    await page.getByRole("tab", { name: "Mudancas" }).click();

    await expect(
      page.getByText("Nenhuma mudanca detectada entre snapshots consecutivos."),
    ).toBeVisible();
  });
});
