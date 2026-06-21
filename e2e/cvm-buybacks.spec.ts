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

test.describe("Buybacks — validacao na lista", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, { authenticated: true });
    mockGet(page, CvmRoutes.buybacksProgramsList, BUYBACKS_LIST);
    mockGet(page, CvmRoutes.buybacksActive, BUYBACKS_ACTIVE);
    mockGet(page, CvmRoutes.buybacksSyncStatus, BUYBACKS_SYNC_STATUS);
  });

  test("mostra badges de status e linka para a tela de validacao", async ({ page }) => {
    await page.goto("/cvm/buybacks");

    // Petrobras (pendente) aparece em ativos + lista; Vale (validado) so na lista.
    const table = page.getByRole("table").last();
    await expect(table.getByText("Pendente", { exact: true }).first()).toBeVisible();
    await expect(table.getByText("Validado", { exact: true })).toBeVisible();

    // Link de validacao aponta para /cvm/buybacks/validate pelo id_programa.
    const link = page.locator(
      `a[href="/cvm/buybacks/validate?id_programa=${encodeURIComponent("VALE-2025-04")}"]`,
    );
    await expect(link.first()).toBeVisible();
  });

  test("filtro de status envia validation_status ao backend", async ({ page }) => {
    await page.goto("/cvm/buybacks");

    const updated: string[] = [];
    await page.route(CvmRoutes.buybacksProgramsList, async (route) => {
      updated.push(
        new URL(route.request().url()).searchParams.get("validation_status") ?? "",
      );
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(BUYBACKS_LIST),
      });
    });

    await page.getByLabel("Status de validacao").selectOption("valid");

    await expect.poll(() => updated.at(-1)).toBe("valid");
  });
});

test.describe("Buybacks — tela de validacao", () => {
  const VALIDATE_URL = `/cvm/buybacks/validate?id_programa=${encodeURIComponent(BUYBACK_PROGRAM_DETAIL.id_programa)}`;

  test.beforeEach(async ({ page }) => {
    await mockAuth(page, { authenticated: true });
  });

  test("renderiza header, programa e selo pendente", async ({ page }) => {
    mockGet(page, CvmRoutes.buybacksProgramById, BUYBACK_PROGRAM_DETAIL);

    await page.goto(VALIDATE_URL);

    await expect(
      page.getByRole("heading", { name: BUYBACK_PROGRAM_DETAIL.nome_companhia }),
    ).toBeVisible();
    await expect(page.getByText("Validacao de recompra", { exact: true })).toBeVisible();
    await expect(page.getByText(/metadado interno de QA/)).toBeVisible();

    // Comeca pendente (detail spreads o programa pendente).
    await expect(page.getByText("Pendente de validacao")).toBeVisible();

    // Secoes legiveis.
    await expect(
      page.getByRole("heading", { name: "Quantidades por tipo / classe" }),
    ).toBeVisible();
    await expect(page.getByText("BTG Pactual")).toBeVisible();
  });

  test("marca como valido (POST generico), exibe selo e permite reverter", async ({ page }) => {
    const state = { validated: false };

    await page.route(CvmRoutes.buybacksProgramById, async (route) => {
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
        : BUYBACK_PROGRAM_DETAIL.validation;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ...BUYBACK_PROGRAM_DETAIL, validation }),
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

    // Body do POST generico: { report_type: "buyback", ref: id_programa como string }.
    await expect.poll(() => validateCalls.length).toBe(1);
    expect(validateCalls[0]).toEqual({
      report_type: "buyback",
      ref: String(BUYBACK_PROGRAM_DETAIL.id_programa),
    });

    await expect(page.getByText(/Validado por Caio Moderador em/)).toBeVisible();

    await page.getByRole("button", { name: "Reverter validacao" }).click();
    await expect.poll(() => invalidateCalls.length).toBe(1);
    expect(invalidateCalls[0]).toEqual({
      report_type: "buyback",
      ref: String(BUYBACK_PROGRAM_DETAIL.id_programa),
    });
    await expect(page.getByText("Pendente de validacao")).toBeVisible();
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
