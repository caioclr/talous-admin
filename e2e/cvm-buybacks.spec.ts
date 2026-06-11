import { expect, test } from "@playwright/test";
import { mockAuth } from "./helpers/mock-api";
import { CvmRoutes, mockGet, mockMethod } from "./helpers/mock-cvm";
import {
  BUYBACK_PROGRAM_DETAIL,
  BUYBACKS_ACTIVE,
  BUYBACKS_LIST,
  BUYBACKS_SYNC_STATUS,
} from "./fixtures/cvm";

test.describe("Buybacks — list", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, { authenticated: true });
    // Order matters: most recently registered handler wins. Programs list is
    // less specific than /active, so we register it first and let /active win.
    mockGet(page, CvmRoutes.buybacksProgramsList, BUYBACKS_LIST);
    mockGet(page, CvmRoutes.buybacksActive, BUYBACKS_ACTIVE);
    mockGet(page, CvmRoutes.buybacksSyncStatus, BUYBACKS_SYNC_STATUS);
  });

  test("renders sync KPIs, active programs and full list", async ({ page }) => {
    await page.goto("/cvm/buybacks");

    await expect(page.getByRole("heading", { name: "Recompras de acoes" })).toBeVisible();

    // KPIs
    await expect(page.locator("text=Programas totais").locator("..").getByText("12")).toBeVisible();
    await expect(page.locator("text=Ativos").locator("..").getByText("3")).toBeVisible();

    // Active programs section + general list both render Petrobras (2 rows)
    await expect(page.getByText("Petroleo Brasileiro S.A. - Petrobras")).toHaveCount(2);
    // Vale only in general list
    await expect(page.getByText("Vale S.A.")).toBeVisible();
  });

  test("filtering by situacao forwards the param", async ({ page }) => {
    await page.goto("/cvm/buybacks");

    // The /programs route already received an initial request; track the next.
    const updated: string[] = [];
    await page.route(CvmRoutes.buybacksProgramsList, async (route) => {
      updated.push(new URL(route.request().url()).searchParams.get("situacao") ?? "");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(BUYBACKS_LIST),
      });
    });

    await page.getByLabel("Situacao").selectOption("ATIVO");

    await expect.poll(() => updated.at(-1)).toBe("ATIVO");
  });

  test("trigger sync sends force flag and shows toast", async ({ page }) => {
    const triggered = mockMethod(page, "POST", CvmRoutes.buybacksSync, {
      status: 202,
      body: { task_id: "task-bb-1", status: "queued" },
    });

    await page.goto("/cvm/buybacks");
    await page.getByRole("button", { name: "Sincronizar" }).click();
    await page.getByLabel("Forcar reprocessar").check();
    await page.getByRole("button", { name: "Confirmar" }).click();

    await expect(page.getByText("Sync agendado (task_id task-bb-1).")).toBeVisible();
    expect(triggered).toHaveLength(1);
    expect(triggered[0]?.query).toEqual({ force: "true" });
  });
});

test.describe("Buybacks — detail", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, { authenticated: true });
    mockGet(page, CvmRoutes.buybacksProgramById, BUYBACK_PROGRAM_DETAIL);
  });

  test("renders program data, quantities and intermediaries", async ({ page }) => {
    await page.goto(
      `/cvm/buybacks/programs/detail?id_programa=${encodeURIComponent(BUYBACK_PROGRAM_DETAIL.id_programa)}`,
    );

    await expect(
      page.getByRole("heading", { name: BUYBACK_PROGRAM_DETAIL.nome_companhia }),
    ).toBeVisible();
    // ID echoed in description (first occurrence — also appears in raw_data)
    await expect(page.getByText(BUYBACK_PROGRAM_DETAIL.id_programa).first()).toBeVisible();

    // Situacao badge — first occurrence (text may also appear in JSON raw_data)
    await expect(page.getByText("ATIVO", { exact: true }).first()).toBeVisible();

    // Quantities table
    await expect(page.getByRole("heading", { name: "Quantidades por tipo / classe" })).toBeVisible();
    await expect(page.getByText("ON", { exact: true }).first()).toBeVisible();

    // Intermediaries
    await expect(page.getByText("BTG Pactual")).toBeVisible();
    await expect(page.getByText("Itau BBA")).toBeVisible();

    // Cross-link to company
    await expect(page.getByRole("link", { name: "Ir para empresa" })).toBeVisible();
  });
});
