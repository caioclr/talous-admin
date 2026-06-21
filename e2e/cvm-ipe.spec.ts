import { expect, test } from "@playwright/test";
import { mockAuth } from "./helpers/mock-api";
import { CvmRoutes, mockGet } from "./helpers/mock-cvm";
import {
  IPE_CATEGORIES,
  IPE_DISCLOSURE_PETROBRAS_DETAIL,
  IPE_DISCLOSURES_LIST,
  IPE_SYNC_STATUS,
} from "./fixtures/cvm";

test.describe("IPE — list + validacao na lista", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, { authenticated: true });
    // Detail (by-company UUID) e categorias sao menos especificos; registramos a
    // lista por ultimo para que ela vença o match em /disclosures.
    mockGet(page, CvmRoutes.ipeCategories, IPE_CATEGORIES);
    mockGet(page, CvmRoutes.ipeSyncStatus, IPE_SYNC_STATUS);
    mockGet(page, CvmRoutes.ipeDisclosuresList, IPE_DISCLOSURES_LIST);
  });

  test("renderiza KPIs, lista, badges de status e link de validacao", async ({ page }) => {
    await page.goto("/cvm/ipe");

    await expect(
      page.getByRole("heading", { name: /Fatos relevantes, comunicados e avisos/ }),
    ).toBeVisible();

    // Empresas das duas linhas.
    await expect(page.getByText("Petroleo Brasileiro S.A. - Petrobras")).toBeVisible();
    await expect(page.getByText("Vale S.A.")).toBeVisible();

    // Badges de status na tabela.
    const table = page.getByRole("table");
    await expect(table.getByText("Pendente", { exact: true }).first()).toBeVisible();
    await expect(table.getByText("Validado", { exact: true })).toBeVisible();

    // Link de validacao aponta para /cvm/ipe/validate pelo id (UUID).
    const link = page.locator(
      `a[href="/cvm/ipe/validate?id=${encodeURIComponent("ipe00002-0000-0000-0000-000000000002")}"]`,
    );
    await expect(link.first()).toBeVisible();
  });

  test("filtro de status envia validation_status ao backend", async ({ page }) => {
    await page.goto("/cvm/ipe");

    const updated: string[] = [];
    await page.route(CvmRoutes.ipeDisclosuresList, async (route) => {
      updated.push(
        new URL(route.request().url()).searchParams.get("validation_status") ?? "",
      );
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(IPE_DISCLOSURES_LIST),
      });
    });

    await page.getByLabel("Status de validacao").selectOption("valid");

    await expect.poll(() => updated.at(-1)).toBe("valid");
  });
});

test.describe("IPE — tela de validacao", () => {
  const VALIDATE_URL = `/cvm/ipe/validate?id=${encodeURIComponent(IPE_DISCLOSURE_PETROBRAS_DETAIL.id)}`;

  test.beforeEach(async ({ page }) => {
    await mockAuth(page, { authenticated: true });
  });

  test("renderiza header, assunto/categoria/conteudo e selo pendente", async ({ page }) => {
    mockGet(page, CvmRoutes.ipeDisclosureById, IPE_DISCLOSURE_PETROBRAS_DETAIL);

    await page.goto(VALIDATE_URL);

    await expect(
      page.getByRole("heading", { name: IPE_DISCLOSURE_PETROBRAS_DETAIL.nome_companhia }),
    ).toBeVisible();
    await expect(page.getByText("Validacao de disclosure IPE", { exact: true })).toBeVisible();
    await expect(page.getByText(/metadado interno de QA/)).toBeVisible();

    // Comeca pendente.
    await expect(page.getByText("Pendente de validacao")).toBeVisible();

    // Secoes legiveis: assunto/categoria + conteudo declarado.
    await expect(page.getByRole("heading", { name: "Assunto e categoria" })).toBeVisible();
    await expect(
      page.getByText(IPE_DISCLOSURE_PETROBRAS_DETAIL.assunto).first(),
    ).toBeVisible();
  });

  test("marca como valido (POST generico), exibe selo e permite reverter", async ({ page }) => {
    const state = { validated: false };

    await page.route(CvmRoutes.ipeDisclosureById, async (route) => {
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
        : IPE_DISCLOSURE_PETROBRAS_DETAIL.validation;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ...IPE_DISCLOSURE_PETROBRAS_DETAIL, validation }),
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

    // Body do POST generico: { report_type: "ipe", ref: id (UUID) como string }.
    await expect.poll(() => validateCalls.length).toBe(1);
    expect(validateCalls[0]).toEqual({
      report_type: "ipe",
      ref: String(IPE_DISCLOSURE_PETROBRAS_DETAIL.id),
    });

    await expect(page.getByText(/Validado por Caio Moderador em/)).toBeVisible();

    await page.getByRole("button", { name: "Reverter validacao" }).click();
    await expect.poll(() => invalidateCalls.length).toBe(1);
    expect(invalidateCalls[0]).toEqual({
      report_type: "ipe",
      ref: String(IPE_DISCLOSURE_PETROBRAS_DETAIL.id),
    });
    await expect(page.getByText("Pendente de validacao")).toBeVisible();
  });
});
