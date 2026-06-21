import { expect, test } from "@playwright/test";
import { mockAuth } from "./helpers/mock-api";
import { CvmRoutes, mockGet } from "./helpers/mock-cvm";
import {
  SNAPSHOT_PETROBRAS,
  SNAPSHOT_PETROBRAS_DETAIL,
  SNAPSHOTS_LIST,
} from "./fixtures/cvm";

test.describe("Registry snapshots — validacao na lista", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, { authenticated: true });
  });

  test("renderiza lista, badges de status e link de validacao", async ({ page }) => {
    mockGet(page, CvmRoutes.snapshotsList, SNAPSHOTS_LIST);

    await page.goto("/cvm/snapshots");

    await expect(
      page.getByRole("heading", { name: "Snapshots do cadastro CVM" }),
    ).toBeVisible();

    await expect(page.getByText("Petroleo Brasileiro S.A. - Petrobras")).toBeVisible();
    await expect(page.getByText("Vale S.A.")).toBeVisible();

    const table = page.getByRole("table");
    await expect(table.getByText("Pendente", { exact: true }).first()).toBeVisible();
    await expect(table.getByText("Validado", { exact: true })).toBeVisible();

    // Link de validacao aponta para /cvm/snapshots/validate pelo id (UUID).
    const link = page.locator(
      `a[href="/cvm/snapshots/validate?id=${encodeURIComponent(SNAPSHOT_PETROBRAS.id)}"]`,
    );
    await expect(link.first()).toBeVisible();
  });

  test("filtro de status envia validation_status ao backend", async ({ page }) => {
    const captured = mockGet(page, CvmRoutes.snapshotsList, SNAPSHOTS_LIST);

    await page.goto("/cvm/snapshots");
    await expect.poll(() => captured.length).toBeGreaterThanOrEqual(1);

    await page.getByLabel("Status de validacao").selectOption("valid");

    await expect.poll(() => captured.at(-1)?.query.validation_status).toBe("valid");
  });
});

test.describe("Registry snapshots — tela de validacao", () => {
  const VALIDATE_URL = `/cvm/snapshots/validate?id=${encodeURIComponent(SNAPSHOT_PETROBRAS_DETAIL.id)}`;

  test.beforeEach(async ({ page }) => {
    await mockAuth(page, { authenticated: true });
  });

  test("renderiza header, dados cadastrais legiveis e selo pendente", async ({ page }) => {
    mockGet(page, CvmRoutes.snapshotById, SNAPSHOT_PETROBRAS_DETAIL);

    await page.goto(VALIDATE_URL);

    await expect(
      page.getByRole("heading", { name: SNAPSHOT_PETROBRAS_DETAIL.denom_social }),
    ).toBeVisible();
    await expect(
      page.getByText("Validacao de snapshot cadastral", { exact: true }),
    ).toBeVisible();
    await expect(page.getByText(/metadado interno de QA/)).toBeVisible();

    // Comeca pendente.
    await expect(page.getByText("Pendente de validacao")).toBeVisible();

    // Dados cadastrais legiveis.
    await expect(page.getByRole("heading", { name: "Identificacao" })).toBeVisible();
    await expect(page.getByText("Razao social")).toBeVisible();
    await expect(page.getByText("Controlador")).toBeVisible();
    await expect(page.getByText("Uniao Federal", { exact: true })).toBeVisible();
  });

  test("marca como valido (POST generico), exibe selo e permite reverter", async ({ page }) => {
    const state = { validated: false };

    await page.route(CvmRoutes.snapshotById, async (route) => {
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
            validated_at: "2026-06-09T13:45:00Z",
          }
        : SNAPSHOT_PETROBRAS_DETAIL.validation;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ...SNAPSHOT_PETROBRAS_DETAIL, validation }),
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

    // Body do POST generico: { report_type: "registry", ref: id (UUID) como string }.
    await expect.poll(() => validateCalls.length).toBe(1);
    expect(validateCalls[0]).toEqual({
      report_type: "registry",
      ref: String(SNAPSHOT_PETROBRAS_DETAIL.id),
    });

    await expect(page.getByText(/Validado por Caio Moderador em/)).toBeVisible();

    await page.getByRole("button", { name: "Reverter validacao" }).click();
    await expect.poll(() => invalidateCalls.length).toBe(1);
    expect(invalidateCalls[0]).toEqual({
      report_type: "registry",
      ref: String(SNAPSHOT_PETROBRAS_DETAIL.id),
    });
    await expect(page.getByText("Pendente de validacao")).toBeVisible();
  });
});
