import { expect, test } from "@playwright/test";
import { mockAuth } from "./helpers/mock-api";
import { CvmRoutes, mockGet, mockMethod } from "./helpers/mock-cvm";
import {
  VLMO_AGGREGATES_PETROBRAS,
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
