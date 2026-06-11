import { expect, test } from "@playwright/test";
import { mockAuth } from "./helpers/mock-api";
import { CvmRoutes, mockGet, mockMethod } from "./helpers/mock-cvm";
import { SYNC_STATUS_DEFAULT } from "./fixtures/cvm";

test.describe("CVM dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, { authenticated: true });
  });

  test("renders KPIs and situation counts from sync-status", async ({ page }) => {
    mockGet(page, CvmRoutes.syncStatus, SYNC_STATUS_DEFAULT);

    await page.goto("/cvm");

    // Header
    await expect(
      page.getByRole("heading", { name: "Visao operacional do cadastro CVM" }),
    ).toBeVisible();

    // KPI cards (look up by description to avoid ambiguity)
    await expect(
      page.locator("text=Total de snapshots").locator("..").getByText("412"),
    ).toBeVisible();
    await expect(
      page.locator("text=Setores sem mapeamento").locator("..").getByText("2"),
    ).toBeVisible();

    // Truncated hash starts with first 8 chars
    await expect(page.getByText("01234567", { exact: false })).toBeVisible();

    // Situation counts grid
    await expect(page.getByText("ATIVO", { exact: true })).toBeVisible();
    await expect(page.getByText("350", { exact: true })).toBeVisible();
    await expect(page.getByText("CANCELADO", { exact: true })).toBeVisible();
    await expect(page.getByText("SUSPENSO", { exact: true })).toBeVisible();
  });

  test("shows empty placeholders when backend has no snapshots", async ({ page }) => {
    mockGet(page, CvmRoutes.syncStatus, {
      last_captured_at: null,
      last_file_hash: null,
      total_snapshots: 0,
      situation_counts: {},
      unmapped_sectors_count: 0,
    });

    await page.goto("/cvm");

    await expect(
      page.getByText("Nenhuma pendencia de mapeamento encontrada."),
    ).toBeVisible();
    // Hash placeholder
    await expect(
      page.locator("text=Hash do ultimo arquivo").locator("..").getByText("—"),
    ).toBeVisible();
  });

  test("triggers manual sync with force=false and shows toast with task_id", async ({ page }) => {
    mockGet(page, CvmRoutes.syncStatus, SYNC_STATUS_DEFAULT);
    const triggerCaptured = mockMethod(page, "POST", CvmRoutes.triggerSync, {
      body: { task_id: "task-abc-123", status: "queued" },
      status: 202,
    });

    await page.goto("/cvm");

    await page.getByRole("button", { name: "Sincronizar agora" }).click();
    await expect(
      page.getByRole("heading", { name: "Disparar sincronizacao manual?" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Confirmar sync" }).click();

    await expect(
      page.getByText("Sincronizacao enfileirada com task_id task-abc-123."),
    ).toBeVisible();

    expect(triggerCaptured).toHaveLength(1);
    expect(triggerCaptured[0]?.query).toEqual({ force: "false" });
  });

  test("sends force=true when the checkbox is enabled before confirming", async ({ page }) => {
    mockGet(page, CvmRoutes.syncStatus, SYNC_STATUS_DEFAULT);
    const triggerCaptured = mockMethod(page, "POST", CvmRoutes.triggerSync, {
      body: { task_id: "task-force-001", status: "queued" },
      status: 202,
    });

    await page.goto("/cvm");
    await page.getByRole("button", { name: "Sincronizar agora" }).click();

    await page.getByLabel("Forcar persistencia mesmo se o hash ja existir.").check();
    await page.getByRole("button", { name: "Confirmar sync" }).click();

    await expect(page.getByText("task-force-001", { exact: false })).toBeVisible();
    expect(triggerCaptured[0]?.query).toEqual({ force: "true" });
  });

  test("surfaces backend error when sync trigger fails", async ({ page }) => {
    mockGet(page, CvmRoutes.syncStatus, SYNC_STATUS_DEFAULT);
    mockMethod(page, "POST", CvmRoutes.triggerSync, {
      status: 500,
      body: { detail: "Celery broker indisponivel" },
    });

    await page.goto("/cvm");
    await page.getByRole("button", { name: "Sincronizar agora" }).click();
    await page.getByRole("button", { name: "Confirmar sync" }).click();

    await expect(page.getByText("Celery broker indisponivel")).toBeVisible();
  });
});
