import { expect, test } from "@playwright/test";
import { mockAuth } from "./helpers/mock-api";
import { CvmRoutes, mockGet } from "./helpers/mock-cvm";
import {
  BUYBACK_BY_COMPANY_PETROBRAS,
  CAPITAL_BY_COMPANY_PETROBRAS,
  CHANGES_PETROBRAS,
  COMPANY_DETAIL_PETROBRAS,
  DIVIDEND_POLICY_BY_COMPANY,
  DIVIDEND_POLICY_OK_DETAIL,
  FCA_BY_COMPANY_PETROBRAS,
  FRE_BY_COMPANY_PETROBRAS,
  HISTORY_PETROBRAS,
  ICBGC_BY_COMPANY_PETROBRAS,
  IPE_DISCLOSURES_LIST,
  IPE_RELEASE_OK_DETAIL,
  IPE_RELEASES_BY_COMPANY,
  ITR_DFP_FILINGS_WITH_VALIDATION,
  VLMO_BY_COMPANY_PETROBRAS,
} from "./fixtures/cvm";

const DETAIL_URL = "/cvm/companies/detail?cd_cvm=9512";

const VALIDATED_BLOCK = {
  status: "valid" as const,
  validated_by: {
    id: "00000000-0000-0000-0000-000000000001",
    name: "Caio Moderador",
    email: "caio@talous.ai",
  },
  validated_at: "2026-05-02T13:45:00Z",
};

/**
 * Registra todos os mocks GET do detalhe consolidado. As listas by-company sao
 * carregadas LAZY (so quando a aba/sub-aba e ativada), mas registrar tudo aqui e
 * inofensivo — o `captured` de cada rota prova se/quando foi chamada.
 */
function mockCompanyDetail(page: import("@playwright/test").Page) {
  return {
    company: mockGet(page, CvmRoutes.companyDetail, COMPANY_DETAIL_PETROBRAS),
    history: mockGet(page, CvmRoutes.companyHistory, HISTORY_PETROBRAS),
    changes: mockGet(page, CvmRoutes.companyChanges, CHANGES_PETROBRAS),
    ipe: mockGet(page, CvmRoutes.ipeByCompany, IPE_DISCLOSURES_LIST),
    releases: mockGet(page, CvmRoutes.ipeReleasesByCompany, IPE_RELEASES_BY_COMPANY),
    releaseDetail: mockGet(page, CvmRoutes.ipeReleaseById, IPE_RELEASE_OK_DETAIL),
    itrDfp: mockGet(page, CvmRoutes.itrDfpFilings, ITR_DFP_FILINGS_WITH_VALIDATION),
    fre: mockGet(page, CvmRoutes.freByCompany, FRE_BY_COMPANY_PETROBRAS),
    dividendPolicy: mockGet(
      page,
      CvmRoutes.freDividendPolicyByCompany,
      DIVIDEND_POLICY_BY_COMPANY,
    ),
    dividendPolicyDetail: mockGet(
      page,
      CvmRoutes.freDividendPolicyById,
      DIVIDEND_POLICY_OK_DETAIL,
    ),
    fca: mockGet(page, CvmRoutes.fcaByCompany, FCA_BY_COMPANY_PETROBRAS),
    buybacks: mockGet(page, CvmRoutes.buybacksByCompany, BUYBACK_BY_COMPANY_PETROBRAS),
    vlmo: mockGet(page, CvmRoutes.vlmoByCompany, VLMO_BY_COMPANY_PETROBRAS),
    capital: mockGet(page, CvmRoutes.capitalCompositionByCompany, CAPITAL_BY_COMPANY_PETROBRAS),
    icbgc: mockGet(page, CvmRoutes.icbgcByCompany, ICBGC_BY_COMPANY_PETROBRAS),
  };
}

test.describe("CVM company detail — header e abas", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, { authenticated: true });
  });

  test("header mostra breadcrumb, nome, tickers e codigo CVM", async ({ page }) => {
    mockCompanyDetail(page);
    await page.goto(DETAIL_URL);

    await expect(page.getByRole("heading", { name: COMPANY_DETAIL_PETROBRAS.name })).toBeVisible();
    await expect(page.getByRole("link", { name: "Empresas" })).toBeVisible();
    await expect(page.getByText("PETR3, PETR4")).toBeVisible();
    await expect(page.getByText("Codigo CVM: 9512")).toBeVisible();
  });

  test("carrega as abas Moderar/Verificar de forma LAZY (so ao ativar)", async ({ page }) => {
    const calls = mockCompanyDetail(page);
    await page.goto(DETAIL_URL);

    // A aba Info (default) nao deve disparar nenhuma lista by-company.
    await expect(page.getByText("Setor interno")).toBeVisible();
    expect(calls.ipe.length).toBe(0);
    expect(calls.fre.length).toBe(0);
    expect(calls.buybacks.length).toBe(0);

    // Abrir Moderar dispara apenas a sub-aba ativa (IPE), nao FRE/FCA/ITR.
    await page.getByRole("tab", { name: "Moderar" }).click();
    await expect.poll(() => calls.ipe.length).toBeGreaterThanOrEqual(1);
    expect(calls.fre.length).toBe(0);
    expect(calls.fca.length).toBe(0);
    expect(calls.itrDfp.length).toBe(0);

    // Trocar para a sub-aba FRE dispara o by-company de FRE.
    await page.getByRole("tab", { name: "FRE" }).click();
    await expect.poll(() => calls.fre.length).toBeGreaterThanOrEqual(1);

    // Verificar so dispara ao abrir, e so a sub-aba default (Recompras).
    expect(calls.buybacks.length).toBe(0);
    await page.getByRole("tab", { name: "Verificar" }).click();
    await expect.poll(() => calls.buybacks.length).toBeGreaterThanOrEqual(1);
    expect(calls.vlmo.length).toBe(0);
    expect(calls.capital.length).toBe(0);
    expect(calls.icbgc.length).toBe(0);
  });
});

test.describe("CVM company detail — Moderar (validar/reverter)", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, { authenticated: true });
  });

  test("valida e reverte um IPE pela aba Moderar", async ({ page }) => {
    mockCompanyDetail(page);

    const validateCalls: Array<unknown> = [];
    await page.route(CvmRoutes.validationsValidate, async (route) => {
      if (route.request().method() !== "POST") {
        await route.fallback();
        return;
      }
      validateCalls.push(JSON.parse(route.request().postData() ?? "null"));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          report_type: "ipe",
          ref: "ipe00001-0000-0000-0000-000000000001",
          cd_cvm: 9512,
          validation: VALIDATED_BLOCK,
        }),
      });
    });

    const invalidateCalls: Array<unknown> = [];
    await page.route(CvmRoutes.validationsInvalidate, async (route) => {
      if (route.request().method() !== "POST") {
        await route.fallback();
        return;
      }
      invalidateCalls.push(JSON.parse(route.request().postData() ?? "null"));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          report_type: "ipe",
          ref: "ipe00001-0000-0000-0000-000000000001",
          cd_cvm: 9512,
          validation: { status: "pending", validated_by: null, validated_at: null },
        }),
      });
    });

    await page.goto(DETAIL_URL);
    await page.getByRole("tab", { name: "Moderar" }).click();

    // Escopar na LINHA do disclosure pendente da Petrobras (Vale ja vem
    // validado), para nao colidir o `.first()` entre as duas linhas.
    const petrRow = page
      .getByRole("main")
      .getByRole("row")
      .filter({ hasText: "novo plano estrategico" });

    await petrRow.getByRole("button", { name: "Marcar como valido" }).click();

    await expect.poll(() => validateCalls.length).toBe(1);
    expect(validateCalls[0]).toEqual({
      report_type: "ipe",
      ref: "ipe00001-0000-0000-0000-000000000001",
    });

    // Selo reflete a acao na hora (POST devolveu o bloco validation).
    await expect(petrRow.getByText(/Validado por Caio Moderador em/)).toBeVisible();

    // Reverter volta a pendente na MESMA linha.
    await petrRow.getByRole("button", { name: "Reverter validacao" }).click();
    await expect.poll(() => invalidateCalls.length).toBe(1);
    expect(invalidateCalls[0]).toEqual({
      report_type: "ipe",
      ref: "ipe00001-0000-0000-0000-000000000001",
    });
  });

  test("valida um FRE pela sub-aba Moderar > FRE", async ({ page }) => {
    mockCompanyDetail(page);

    const validateCalls: Array<unknown> = [];
    await page.route(CvmRoutes.validationsValidate, async (route) => {
      if (route.request().method() !== "POST") {
        await route.fallback();
        return;
      }
      validateCalls.push(JSON.parse(route.request().postData() ?? "null"));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          report_type: "fre",
          ref: "FRE-PETR-2025",
          cd_cvm: 9512,
          validation: VALIDATED_BLOCK,
        }),
      });
    });

    await page.goto(DETAIL_URL);
    await page.getByRole("tab", { name: "Moderar" }).click();
    await page.getByRole("tab", { name: "FRE" }).click();

    const main = page.getByRole("main");
    await expect(main.getByText("Pendente de validacao").first()).toBeVisible();

    await main.getByRole("button", { name: "Marcar como valido" }).first().click();

    await expect.poll(() => validateCalls.length).toBe(1);
    expect(validateCalls[0]).toEqual({ report_type: "fre", ref: "FRE-PETR-2025" });
    await expect(main.getByText(/Validado por Caio Moderador em/).first()).toBeVisible();
  });

  test("ITR/DFP linka para a tela bespoke de validacao", async ({ page }) => {
    mockCompanyDetail(page);
    await page.goto(DETAIL_URL);

    await page.getByRole("tab", { name: "Moderar" }).click();
    await page.getByRole("tab", { name: "ITR/DFP" }).click();

    const link = page.getByRole("main").getByRole("link", { name: "Validar" }).first();
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", /\/cvm\/itr-dfp\/validate\?cd_cvm=9512/);
  });
});

test.describe("CVM company detail — Verificar (leitura + selo)", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, { authenticated: true });
  });

  test("Recompras mostra selo e link Abrir (sem botao de validar inline)", async ({ page }) => {
    mockCompanyDetail(page);
    await page.goto(DETAIL_URL);

    await page.getByRole("tab", { name: "Verificar" }).click();

    const main = page.getByRole("main");
    await expect(main.getByText("Pendente").first()).toBeVisible();
    await expect(main.getByText("Validado").first()).toBeVisible();
    await expect(main.getByRole("link", { name: "Abrir" }).first()).toBeVisible();
    // Verificar e leitura: nao ha acao inline de validar.
    await expect(main.getByRole("button", { name: "Marcar como valido" })).toHaveCount(0);
  });

  test("VLMO lista movimentacoes e aponta para os filings", async ({ page }) => {
    mockCompanyDetail(page);
    await page.goto(DETAIL_URL);

    await page.getByRole("tab", { name: "Verificar" }).click();
    await page.getByRole("tab", { name: "VLMO" }).click();

    const main = page.getByRole("main");
    await expect(main.getByRole("link", { name: "Abrir filings VLMO" })).toBeVisible();
    await expect(main.getByText("Petrobras").first()).toBeVisible();
  });
});

test.describe("CVM company detail — estados de erro/vazio", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, { authenticated: true });
  });

  test("erro na lista da aba mostra retry", async ({ page }) => {
    mockGet(page, CvmRoutes.companyDetail, COMPANY_DETAIL_PETROBRAS);
    await page.route(CvmRoutes.freByCompany, async (route) => {
      if (route.request().method() !== "GET") {
        await route.fallback();
        return;
      }
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ detail: "boom" }),
      });
    });

    // A sub-aba FRE tem o erro do by-company de FRE; mockamos tambem a politica
    // de dividendos (S18) com OK para isolar o erro da lista de filings.
    mockGet(page, CvmRoutes.freDividendPolicyByCompany, DIVIDEND_POLICY_BY_COMPANY);

    await page.goto(DETAIL_URL);
    await page.getByRole("tab", { name: "Moderar" }).click();
    await page.getByRole("tab", { name: "FRE" }).click();

    await expect(page.getByText("Falha ao carregar os dados: boom")).toBeVisible();
    await expect(page.getByRole("button", { name: "Tentar novamente" })).toBeVisible();
  });

  test("lista vazia mostra empty state da aba", async ({ page }) => {
    mockGet(page, CvmRoutes.companyDetail, COMPANY_DETAIL_PETROBRAS);
    mockGet(page, CvmRoutes.fcaByCompany, {
      cd_cvm: 9512,
      company_name: "Petroleo Brasileiro S.A. - Petrobras",
      documentos: [],
    });

    await page.goto(DETAIL_URL);
    await page.getByRole("tab", { name: "Moderar" }).click();
    await page.getByRole("tab", { name: "FCA" }).click();

    await expect(page.getByText("Nenhum documento FCA para esta empresa.")).toBeVisible();
  });
});

test.describe("CVM company detail — releases de resultados (S16)", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, { authenticated: true });
  });

  test("lista os releases na sub-aba IPE de forma lazy", async ({ page }) => {
    const calls = mockCompanyDetail(page);
    await page.goto(DETAIL_URL);

    // Info (default) nao busca releases.
    await expect(page.getByText("Setor interno")).toBeVisible();
    expect(calls.releases.length).toBe(0);

    // Abrir Moderar (sub-aba IPE default) dispara a lista de releases.
    await page.getByRole("tab", { name: "Moderar" }).click();
    await expect.poll(() => calls.releases.length).toBeGreaterThanOrEqual(1);

    const main = page.getByRole("main");
    await expect(main.getByRole("heading", { name: "Releases de resultados" })).toBeVisible();
    await expect(main.getByText("Release de Resultados 1T26")).toBeVisible();
    await expect(main.getByText("Release de Resultados 4T25")).toBeVisible();

    // Detalhe so e buscado ao abrir um item.
    expect(calls.releaseDetail.length).toBe(0);
  });

  test("abrir um release ok busca e mostra o full_text", async ({ page }) => {
    const calls = mockCompanyDetail(page);
    await page.goto(DETAIL_URL);
    await page.getByRole("tab", { name: "Moderar" }).click();

    const okRow = page
      .getByRole("main")
      .getByRole("listitem")
      .filter({ hasText: "Release de Resultados 1T26" });

    await okRow.getByRole("button", { name: "Abrir texto" }).click();

    // Detalhe foi buscado lazy ao abrir.
    await expect.poll(() => calls.releaseDetail.length).toBeGreaterThanOrEqual(1);
    await expect(okRow.getByText(/lucro liquido recorde/)).toBeVisible();
  });

  test("release no_text mostra aviso, nao viewer vazio nem fetch de detalhe", async ({ page }) => {
    const calls = mockCompanyDetail(page);
    await page.goto(DETAIL_URL);
    await page.getByRole("tab", { name: "Moderar" }).click();

    const noTextRow = page
      .getByRole("main")
      .getByRole("listitem")
      .filter({ hasText: "Release de Resultados 4T25" });

    await noTextRow.getByRole("button", { name: "Abrir texto" }).click();

    await expect(noTextRow.getByText("Sem texto extraivel para este release.")).toBeVisible();
    // Sem texto => nao busca o detalhe.
    expect(calls.releaseDetail.length).toBe(0);
  });

  test("release failed mostra aviso de falha na extracao", async ({ page }) => {
    mockCompanyDetail(page);
    await page.goto(DETAIL_URL);
    await page.getByRole("tab", { name: "Moderar" }).click();

    const failedRow = page
      .getByRole("main")
      .getByRole("listitem")
      .filter({ hasText: "Release de Resultados 3T25" });

    await failedRow.getByRole("button", { name: "Abrir texto" }).click();
    await expect(failedRow.getByText("Falha na extracao do texto deste release.")).toBeVisible();
  });

  test("empresa sem releases mostra estado vazio coerente", async ({ page }) => {
    mockGet(page, CvmRoutes.companyDetail, COMPANY_DETAIL_PETROBRAS);
    mockGet(page, CvmRoutes.ipeByCompany, IPE_DISCLOSURES_LIST);
    mockGet(page, CvmRoutes.ipeReleasesByCompany, {
      items: [],
      pagination: { page: 1, page_size: 50, total: 0, total_pages: 0 },
    });

    await page.goto(DETAIL_URL);
    await page.getByRole("tab", { name: "Moderar" }).click();

    await expect(
      page.getByText("Nenhum release de resultados extraido para esta empresa."),
    ).toBeVisible();
  });
});

test.describe("CVM company detail — politica de dividendos (S18)", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, { authenticated: true });
  });

  test("lista as politicas na sub-aba FRE de forma lazy", async ({ page }) => {
    const calls = mockCompanyDetail(page);
    await page.goto(DETAIL_URL);

    // Info (default) nao busca politica de dividendos.
    await expect(page.getByText("Setor interno")).toBeVisible();
    expect(calls.dividendPolicy.length).toBe(0);

    // Abrir Moderar (sub-aba IPE default) ainda nao busca FRE/politica.
    await page.getByRole("tab", { name: "Moderar" }).click();
    await expect.poll(() => calls.ipe.length).toBeGreaterThanOrEqual(1);
    expect(calls.dividendPolicy.length).toBe(0);

    // Trocar para a sub-aba FRE dispara a lista de politicas de dividendos.
    await page.getByRole("tab", { name: "FRE" }).click();
    await expect.poll(() => calls.dividendPolicy.length).toBeGreaterThanOrEqual(1);

    const main = page.getByRole("main");
    await expect(
      main.getByRole("heading", { name: "Politica de dividendos" }),
    ).toBeVisible();

    // Detalhe so e buscado ao abrir um item.
    expect(calls.dividendPolicyDetail.length).toBe(0);
  });

  test("abrir uma politica ok busca e mostra o policy_text", async ({ page }) => {
    const calls = mockCompanyDetail(page);
    await page.goto(DETAIL_URL);
    await page.getByRole("tab", { name: "Moderar" }).click();
    await page.getByRole("tab", { name: "FRE" }).click();

    // Identificamos a linha pela badge de status (estavel; a data de referencia
    // varia com o fuso do runner — ver fixtures).
    const okRow = page
      .getByRole("main")
      .getByRole("listitem")
      .filter({ hasText: "Texto extraido" });

    await okRow.getByRole("button", { name: "Abrir texto" }).click();

    // Detalhe foi buscado lazy ao abrir.
    await expect.poll(() => calls.dividendPolicyDetail.length).toBeGreaterThanOrEqual(1);
    await expect(okRow.getByText(/disciplina de capital/)).toBeVisible();
  });

  test("politica not_found mostra aviso, nao viewer vazio nem fetch de detalhe", async ({
    page,
  }) => {
    const calls = mockCompanyDetail(page);
    await page.goto(DETAIL_URL);
    await page.getByRole("tab", { name: "Moderar" }).click();
    await page.getByRole("tab", { name: "FRE" }).click();

    const notFoundRow = page
      .getByRole("main")
      .getByRole("listitem")
      .filter({ hasText: "Nao localizada" });

    await notFoundRow.getByRole("button", { name: "Abrir texto" }).click();

    await expect(
      notFoundRow.getByText("Politica de dividendos nao localizada neste FRE."),
    ).toBeVisible();
    // Sem texto => nao busca o detalhe.
    expect(calls.dividendPolicyDetail.length).toBe(0);
  });

  test("politica failed mostra aviso de falha na extracao", async ({ page }) => {
    mockCompanyDetail(page);
    await page.goto(DETAIL_URL);
    await page.getByRole("tab", { name: "Moderar" }).click();
    await page.getByRole("tab", { name: "FRE" }).click();

    const failedRow = page
      .getByRole("main")
      .getByRole("listitem")
      .filter({ hasText: "Falha na extracao" });

    await failedRow.getByRole("button", { name: "Abrir texto" }).click();
    await expect(
      failedRow.getByText("Falha na extracao do texto desta politica de dividendos."),
    ).toBeVisible();
  });

  test("empresa sem politica de dividendos mostra estado vazio coerente", async ({ page }) => {
    mockGet(page, CvmRoutes.companyDetail, COMPANY_DETAIL_PETROBRAS);
    mockGet(page, CvmRoutes.freByCompany, FRE_BY_COMPANY_PETROBRAS);
    mockGet(page, CvmRoutes.freDividendPolicyByCompany, {
      items: [],
      pagination: { page: 1, page_size: 50, total: 0, total_pages: 0 },
    });

    await page.goto(DETAIL_URL);
    await page.getByRole("tab", { name: "Moderar" }).click();
    await page.getByRole("tab", { name: "FRE" }).click();

    await expect(
      page.getByText("Nenhuma politica de dividendos extraida para esta empresa."),
    ).toBeVisible();
  });
});
