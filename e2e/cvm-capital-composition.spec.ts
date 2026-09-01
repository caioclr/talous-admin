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
    // KPIs. Escopo em `main` e texto exato: a sidebar tem "Snapshots cadastrais",
    // e `text=Snapshots` (substring, sem escopo) casava com o link de navegacao.
    const main = page.getByRole("main");
    await expect(
      main.getByText("Snapshots", { exact: true }).locator("..").getByText("8"),
    ).toBeVisible();
    await expect(
      main.getByText("Empresas com dado", { exact: true }).locator("..").getByText("2", {
        exact: false,
      }),
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

test.describe("Capital composition — validacao na lista", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, { authenticated: true });
    mockGet(page, CvmRoutes.capitalCompositionSyncStatus, CAPITAL_COMPOSITION_SYNC_STATUS);
  });

  test("mostra badges de status e linka para a tela de validacao", async ({ page }) => {
    mockGet(page, CvmRoutes.capitalCompositionSnapshots, PAGED_LIST);

    await page.goto("/cvm/capital-composition");

    const table = page.getByRole("table");
    await expect(table.getByText("Pendente", { exact: true }).first()).toBeVisible();
    await expect(table.getByText("Validado", { exact: true })).toBeVisible();

    // Link de validacao aponta para /cvm/capital-composition/validate pelo id (UUID).
    const link = page.locator(
      `a[href="/cvm/capital-composition/validate?id=${CAPITAL_COMPOSITION_PETROBRAS_SERIES[0].id}"]`,
    );
    await expect(link).toBeVisible();
  });

  test("filtro de status envia validation_status ao backend", async ({ page }) => {
    const captured = mockGet(page, CvmRoutes.capitalCompositionSnapshots, PAGED_LIST);

    await page.goto("/cvm/capital-composition");
    await expect.poll(() => captured.length).toBeGreaterThanOrEqual(1);

    await page.getByLabel("Status de validacao").selectOption("pending");

    await expect.poll(() => captured.at(-1)?.query.validation_status).toBe("pending");
  });
});

test.describe("Capital composition — tela de validacao", () => {
  const VALIDATE_URL = `/cvm/capital-composition/validate?id=${CAPITAL_COMPOSITION_DETAIL.id}`;

  test.beforeEach(async ({ page }) => {
    await mockAuth(page, { authenticated: true });
  });

  test("renderiza header, quantidades e selo pendente", async ({ page }) => {
    mockGet(page, CvmRoutes.capitalCompositionSnapshotById, CAPITAL_COMPOSITION_DETAIL);

    await page.goto(VALIDATE_URL);

    await expect(
      page.getByRole("heading", { name: CAPITAL_COMPOSITION_DETAIL.denom_cia }),
    ).toBeVisible();
    await expect(
      page.getByText("Validacao de composicao de capital", { exact: true }),
    ).toBeVisible();
    await expect(page.getByText(/metadado interno de QA/)).toBeVisible();

    // Comeca pendente (detail spreads o snapshot pendente).
    await expect(page.getByText("Pendente de validacao")).toBeVisible();

    // Quantidades legiveis.
    await expect(page.getByText("ON integralizado")).toBeVisible();
    await expect(page.getByText("PN tesouraria")).toBeVisible();
  });

  test("marca como valido (POST generico), exibe selo e permite reverter", async ({ page }) => {
    const state = { validated: false };

    await page.route(CvmRoutes.capitalCompositionSnapshotById, async (route) => {
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
        : CAPITAL_COMPOSITION_DETAIL.validation;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ...CAPITAL_COMPOSITION_DETAIL, validation }),
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

    // Body do POST generico: { report_type: "capital", ref: id (UUID) como string }.
    await expect.poll(() => validateCalls.length).toBe(1);
    expect(validateCalls[0]).toEqual({
      report_type: "capital",
      ref: String(CAPITAL_COMPOSITION_DETAIL.id),
    });

    await expect(page.getByText(/Validado por Caio Moderador em/)).toBeVisible();

    await page.getByRole("button", { name: "Reverter validacao" }).click();
    await expect.poll(() => invalidateCalls.length).toBe(1);
    expect(invalidateCalls[0]).toEqual({
      report_type: "capital",
      ref: String(CAPITAL_COMPOSITION_DETAIL.id),
    });
    await expect(page.getByText("Pendente de validacao")).toBeVisible();
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
