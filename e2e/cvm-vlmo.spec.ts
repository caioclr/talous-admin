import { expect, test } from "@playwright/test";
import { mockAuth } from "./helpers/mock-api";
import { CvmRoutes, mockGet, mockMethod } from "./helpers/mock-cvm";
import {
  VLMO_AGGREGATES_PETROBRAS,
  VLMO_FILING_PETROBRAS_DETAIL,
  VLMO_FILINGS_LIST,
  VLMO_MOVS_INCLUDING_SNAPSHOT,
  VLMO_MOVS_TRADES_ONLY,
  VLMO_SYNC_STATUS,
} from "./fixtures/cvm";

test.describe("VLMO — list", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, { authenticated: true });
  });

  test("renders sync KPIs and trades by default (saldo inicial hidden)", async ({ page }) => {
    mockGet(page, CvmRoutes.vlmoSyncStatus, VLMO_SYNC_STATUS);
    const captured = mockGet(page, CvmRoutes.vlmoMovimentacoes, VLMO_MOVS_TRADES_ONLY);

    await page.goto("/cvm/vlmo");

    await expect(page.getByRole("heading", { name: "Insider trading · VLMO" })).toBeVisible();

    // KPIs from sync-status — use exact match on the card description label
    await expect(
      page.getByText("Movimentacoes", { exact: true }).locator("..").getByText("1542"),
    ).toBeVisible();
    await expect(
      page.getByText("Empresas distintas", { exact: true }).locator("..").getByText("124"),
    ).toBeVisible();

    // Cargo distribution card
    await expect(page.getByText("Diretor", { exact: true }).first()).toBeVisible();

    // First call must filter out saldos iniciais
    await expect.poll(() => captured.length).toBeGreaterThanOrEqual(1);
    expect(captured.at(-1)?.query.is_position_snapshot).toBe("false");

    // Trade visible
    await expect(page.getByText("Compra").first()).toBeVisible();
  });

  test("toggling 'Incluir saldos iniciais' drops the is_position_snapshot filter", async ({ page }) => {
    mockGet(page, CvmRoutes.vlmoSyncStatus, VLMO_SYNC_STATUS);
    const captured = mockGet(page, CvmRoutes.vlmoMovimentacoes, VLMO_MOVS_INCLUDING_SNAPSHOT);

    await page.goto("/cvm/vlmo");
    await expect.poll(() => captured.length).toBeGreaterThanOrEqual(1);

    await page.getByLabel("Incluir saldos iniciais").check();

    await expect.poll(
      () => captured.at(-1)?.query.is_position_snapshot ?? "missing",
    ).toBe("missing");
  });

  test("sync trigger sends year + force and shows toast", async ({ page }) => {
    mockGet(page, CvmRoutes.vlmoSyncStatus, VLMO_SYNC_STATUS);
    mockGet(page, CvmRoutes.vlmoMovimentacoes, VLMO_MOVS_TRADES_ONLY);
    const triggered = mockMethod(page, "POST", CvmRoutes.vlmoSync, {
      status: 202,
      body: { task_id: "task-vlmo-1", status: "queued" },
    });

    await page.goto("/cvm/vlmo");

    await page.getByRole("button", { name: "Sincronizar" }).click();
    await page.getByLabel("Forcar reprocessar").check();
    await page.getByRole("button", { name: "Confirmar" }).click();

    await expect(page.getByText("Sync VLMO agendado (task_id task-vlmo-1).")).toBeVisible();
    expect(triggered).toHaveLength(1);
    expect(triggered[0]?.query.force).toBe("true");
    expect(triggered[0]?.query.year).toBeDefined();
  });
});

test.describe("VLMO filings — validacao na lista", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, { authenticated: true });
    mockGet(page, CvmRoutes.vlmoFilingsList, VLMO_FILINGS_LIST);
  });

  test("mostra badges de status e linka para a tela de validacao", async ({ page }) => {
    await page.goto("/cvm/vlmo/filings");

    await expect(
      page.getByRole("heading", { name: "Validacao de filings VLMO" }),
    ).toBeVisible();

    const table = page.getByRole("table");
    await expect(table.getByText("Pendente", { exact: true })).toBeVisible();
    await expect(table.getByText("Validado", { exact: true })).toBeVisible();

    // Link de validacao aponta para /cvm/vlmo/validate pelo id (UUID) do filing.
    const link = page.locator(
      `a[href="/cvm/vlmo/validate?id=${encodeURIComponent("vfil0002-0000-0000-0000-000000000002")}"]`,
    );
    await expect(link.first()).toBeVisible();
  });

  test("filtro de status envia validation_status ao backend", async ({ page }) => {
    await page.goto("/cvm/vlmo/filings");

    const updated: string[] = [];
    await page.route(CvmRoutes.vlmoFilingsList, async (route) => {
      updated.push(
        new URL(route.request().url()).searchParams.get("validation_status") ?? "",
      );
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(VLMO_FILINGS_LIST),
      });
    });

    await page.getByLabel("Status de validacao").selectOption("valid");

    await expect.poll(() => updated.at(-1)).toBe("valid");
  });
});

test.describe("VLMO filings — tela de validacao", () => {
  const VALIDATE_URL = `/cvm/vlmo/validate?id=${encodeURIComponent(VLMO_FILING_PETROBRAS_DETAIL.id)}`;

  test.beforeEach(async ({ page }) => {
    await mockAuth(page, { authenticated: true });
    // Movimentacoes do filing (legiveis) — resolvidas por cnpj + ano.
    mockGet(page, CvmRoutes.vlmoMovimentacoes, VLMO_MOVS_TRADES_ONLY);
  });

  test("renderiza header, filing, movimentacoes legiveis e selo pendente", async ({ page }) => {
    mockGet(page, CvmRoutes.vlmoFilingById, VLMO_FILING_PETROBRAS_DETAIL);

    await page.goto(VALIDATE_URL);

    await expect(
      page.getByRole("heading", { name: VLMO_FILING_PETROBRAS_DETAIL.nome_companhia }),
    ).toBeVisible();
    await expect(page.getByText("Validacao de filing VLMO", { exact: true })).toBeVisible();
    await expect(page.getByText(/metadado interno de QA/)).toBeVisible();

    // Comeca pendente (detail traz o filing pendente).
    await expect(page.getByText("Pendente de validacao")).toBeVisible();

    // Secoes legiveis: identificacao + movimentacoes do filing.
    await expect(
      page.getByRole("heading", { name: "Identificacao do filing" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Movimentacoes do filing" }),
    ).toBeVisible();
    await expect(page.getByText("Compra").first()).toBeVisible();
  });

  test("marca como valido (POST generico), exibe selo e permite reverter", async ({ page }) => {
    const state = { validated: false };

    await page.route(CvmRoutes.vlmoFilingById, async (route) => {
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
            validated_at: "2026-05-30T13:45:00Z",
          }
        : VLMO_FILING_PETROBRAS_DETAIL.validation;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ...VLMO_FILING_PETROBRAS_DETAIL, validation }),
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

    await page.goto(VALIDATE_URL);

    await expect(page.getByText("Pendente de validacao")).toBeVisible();

    await page.getByRole("button", { name: "Marcar como valido" }).click();

    // Body do POST generico: { report_type: "vlmo", ref: id (UUID) como string }.
    await expect.poll(() => validateCalls.length).toBe(1);
    expect(validateCalls[0]).toEqual({
      report_type: "vlmo",
      ref: String(VLMO_FILING_PETROBRAS_DETAIL.id),
    });

    await expect(page.getByText(/Validado por Caio Moderador em/)).toBeVisible();

    await page.getByRole("button", { name: "Reverter validacao" }).click();
    await expect.poll(() => invalidateCalls.length).toBe(1);
    expect(invalidateCalls[0]).toEqual({
      report_type: "vlmo",
      ref: String(VLMO_FILING_PETROBRAS_DETAIL.id),
    });
    await expect(page.getByText("Pendente de validacao")).toBeVisible();
  });
});

test.describe("VLMO — company page", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, { authenticated: true });
    mockGet(page, CvmRoutes.vlmoAggregates, VLMO_AGGREGATES_PETROBRAS);
    mockGet(page, CvmRoutes.vlmoByCompany, VLMO_MOVS_TRADES_ONLY);
  });

  test("renders aggregates header, chart and detail table", async ({ page }) => {
    await page.goto("/cvm/vlmo/companies/detail?cd_cvm=9512");

    await expect(
      page.getByRole("heading", { name: VLMO_AGGREGATES_PETROBRAS.company_name }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Net flow mensal por cargo" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Movimentacoes detalhadas" })).toBeVisible();
    await expect(page.getByText("Compra").first()).toBeVisible();
  });

  test("year selector forwards filter to aggregates and movs endpoints", async ({ page }) => {
    const aggregateRequests: string[] = [];
    await page.unroute(CvmRoutes.vlmoAggregates);
    await page.route(CvmRoutes.vlmoAggregates, async (route) => {
      aggregateRequests.push(new URL(route.request().url()).searchParams.get("year") ?? "");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(VLMO_AGGREGATES_PETROBRAS),
      });
    });

    await page.goto("/cvm/vlmo/companies/detail?cd_cvm=9512");
    await expect.poll(() => aggregateRequests.length).toBeGreaterThanOrEqual(1);

    await page.getByLabel("Ano").selectOption(String(new Date().getUTCFullYear()));

    await expect.poll(() => aggregateRequests.at(-1)).toBe(String(new Date().getUTCFullYear()));
  });
});
