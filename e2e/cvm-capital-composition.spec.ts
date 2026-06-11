import { expect, test } from "@playwright/test";
import { mockAuth } from "./helpers/mock-api";
import { CvmRoutes, mockGet, mockMethod } from "./helpers/mock-cvm";
import {
  CAPITAL_COMPOSITION_DETAIL,
  CAPITAL_COMPOSITION_PETROBRAS_SERIES,
  CAPITAL_COMPOSITION_SYNC_STATUS,
} from "./fixtures/cvm";

const PAGED_LIST = {
  items: CAPITAL_COMPOSITION_PETROBRAS_SERIES,
  pagination: {
    page: 1,
    page_size: 20,
    total: CAPITAL_COMPOSITION_PETROBRAS_SERIES.length,
    total_pages: 1,
  },
};

test.describe("Capital composition — list", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, { authenticated: true });
  });

  test("renders sync-status KPIs and snapshot table", async ({ page }) => {
    mockGet(page, CvmRoutes.capitalCompositionSyncStatus, CAPITAL_COMPOSITION_SYNC_STATUS);
    mockGet(page, CvmRoutes.capitalCompositionSnapshots, PAGED_LIST);

    await page.goto("/cvm/capital-composition");

    await expect(page.getByRole("heading", { name: "Composicao de capital" })).toBeVisible();
    // KPIs
    await expect(
      page.locator("text=Snapshots").first().locator("..").getByText("8"),
    ).toBeVisible();
    await expect(
      page.locator("text=Empresas com dado").locator("..").getByText("2", { exact: false }),
    ).toBeVisible();
    // Tabela
    await expect(page.getByText("Petroleo Brasileiro S.A. - Petrobras").first()).toBeVisible();
    await expect(page.getByText("ITR").first()).toBeVisible();
  });

  test("filters by source forwards the param", async ({ page }) => {
    mockGet(page, CvmRoutes.capitalCompositionSyncStatus, CAPITAL_COMPOSITION_SYNC_STATUS);
    const captured = mockGet(page, CvmRoutes.capitalCompositionSnapshots, PAGED_LIST);

    await page.goto("/cvm/capital-composition");
    await expect.poll(() => captured.length).toBeGreaterThanOrEqual(1);

    await page.getByLabel("Source").selectOption("itr");

    await expect.poll(() => captured.at(-1)?.query.source).toBe("itr");
  });

  test("filtering by cd_cvm enables the time-series chart", async ({ page }) => {
    mockGet(page, CvmRoutes.capitalCompositionSyncStatus, CAPITAL_COMPOSITION_SYNC_STATUS);
    mockGet(page, CvmRoutes.capitalCompositionSnapshots, PAGED_LIST);

    await page.goto("/cvm/capital-composition");

    await page.getByLabel("cd_cvm", { exact: true }).fill("9512");

    await expect(
      page.getByRole("heading", { name: /Serie temporal · cd_cvm 9512/ }),
    ).toBeVisible();
  });

  test("trigger sync sends source + force and shows toast", async ({ page }) => {
    mockGet(page, CvmRoutes.capitalCompositionSyncStatus, CAPITAL_COMPOSITION_SYNC_STATUS);
    mockGet(page, CvmRoutes.capitalCompositionSnapshots, PAGED_LIST);
    const triggered = mockMethod(page, "POST", CvmRoutes.capitalCompositionSync, {
      status: 202,
      body: { task_id: "task-cc-1", status: "queued" },
    });

    await page.goto("/cvm/capital-composition");

    await page.getByRole("button", { name: "Sincronizar" }).click();
    await page.getByLabel("Forcar reprocessar").check();
    await page.getByRole("button", { name: "Confirmar" }).click();

    await expect(page.getByText("Sync agendado (task_id task-cc-1).")).toBeVisible();
    expect(triggered).toHaveLength(1);
    expect(triggered[0]?.query).toEqual({ source: "itr", force: "true" });
  });
});

test.describe("Capital composition — detail", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, { authenticated: true });
  });

  test("renders ON/PN breakdown + raw_data", async ({ page }) => {
    mockGet(page, CvmRoutes.capitalCompositionSnapshotById, CAPITAL_COMPOSITION_DETAIL);

    await page.goto(`/cvm/capital-composition/snapshots/detail?id=${CAPITAL_COMPOSITION_DETAIL.id}`);

    await expect(
      page.getByRole("heading", { name: CAPITAL_COMPOSITION_DETAIL.denom_cia }),
    ).toBeVisible();
    await expect(page.getByText("ON integralizado")).toBeVisible();
    await expect(page.getByText("PN integralizado")).toBeVisible();
    await expect(page.getByText("ON tesouraria")).toBeVisible();
    await expect(page.getByText("PN tesouraria")).toBeVisible();
    await expect(page.getByText("raw_data")).toBeVisible();
    await expect(page.getByText("DT_REFER", { exact: false })).toBeVisible();
  });
});
