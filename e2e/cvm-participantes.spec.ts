import { expect, test } from "@playwright/test";
import { mockAuth } from "./helpers/mock-api";
import { CvmRoutes, mockGet, mockMethod } from "./helpers/mock-cvm";
import {
  PARTICIPANTES_ADM_CARTEIRA_LIST,
  PARTICIPANTES_ADM_CARTEIRA_PJ,
  PARTICIPANTES_AUDITOR_PF,
  PARTICIPANTES_AUDITOR_PJ,
  PARTICIPANTES_AUDITORES_LIST,
  PARTICIPANTES_INTERMEDIARIO_XP,
  PARTICIPANTES_INTERMEDIARIOS_LIST,
  PARTICIPANTES_SYNC_STATUS,
} from "./fixtures/cvm";

async function expectSyncCards(page: import("@playwright/test").Page) {
  // Auditores card — total + situacao breakdown
  await expect(page.getByText("387", { exact: true })).toBeVisible();
  await expect(page.getByText("Ativos 301")).toBeVisible();
  await expect(page.getByText("Suspensos 24")).toBeVisible();
  await expect(page.getByText("Cancelados 62")).toBeVisible();

  // Intermediarios card — total + by_tipo
  await expect(page.getByText("512", { exact: true })).toBeVisible();
  await expect(page.getByText("290", { exact: true })).toBeVisible();
  await expect(page.getByText("180", { exact: true })).toBeVisible();

  // Adm. carteira card — total + by_categoria
  await expect(page.getByText("778", { exact: true })).toBeVisible();
  await expect(page.getByText("690", { exact: true })).toBeVisible();
  await expect(page.getByText("88", { exact: true })).toBeVisible();
}

test.describe("Participantes — auditores", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, { authenticated: true });
    mockGet(page, CvmRoutes.participantesSyncStatus, PARTICIPANTES_SYNC_STATUS);
    mockGet(page, CvmRoutes.participantesAuditoresList, PARTICIPANTES_AUDITORES_LIST);
  });

  test("renders consolidated sync cards and auditor rows", async ({ page }) => {
    await page.goto("/cvm/participantes/auditores");

    await expect(
      page.getByRole("heading", { name: "Auditores independentes" }),
    ).toBeVisible();

    await expectSyncCards(page);

    await expect(page.getByText("KPMG Auditores Independentes")).toBeVisible();
    await expect(page.getByText("Joao Carlos Auditor")).toBeVisible();
    await expect(page.getByText("ATIVO", { exact: true })).toBeVisible();
    await expect(page.getByText("Cancelada", { exact: true })).toBeVisible();
  });

  test("forwards situacao and tipo filters to the API", async ({ page }) => {
    const captured = mockGet(
      page,
      CvmRoutes.participantesAuditoresList,
      PARTICIPANTES_AUDITORES_LIST,
    );

    await page.goto("/cvm/participantes/auditores");
    await expect.poll(() => captured.length).toBeGreaterThanOrEqual(1);

    await page.getByLabel("Situacao", { exact: true }).fill("ATIVO");
    await page.getByLabel("Tipo", { exact: true }).selectOption("PJ");

    await expect.poll(() => captured.at(-1)?.query.situacao).toBe("ATIVO");
    await expect.poll(() => captured.at(-1)?.query.tipo).toBe("PJ");
  });

  test("navigates from list to auditor detail carrying tipo", async ({ page }) => {
    const detailCaptured = mockGet(
      page,
      CvmRoutes.participantesAuditorDetail,
      PARTICIPANTES_AUDITOR_PF,
    );

    await page.goto("/cvm/participantes/auditores");

    await page.getByRole("link", { name: "Joao Carlos Auditor" }).click();

    await expect(page).toHaveURL(
      /\/cvm\/participantes\/auditores\/detail\?cd_cvm=7712&tipo=PF/,
    );
    await expect(
      page.getByRole("heading", { name: PARTICIPANTES_AUDITOR_PF.nome }),
    ).toBeVisible();
    await expect.poll(() => detailCaptured.at(-1)?.query.tipo).toBe("PF");

    // Identification card fields
    await expect(page.getByText("Curitiba", { exact: true })).toBeVisible();
    await expect(page.getByText("PR", { exact: true })).toBeVisible();
  });

  test("sync trigger sends selected dataset + force and toasts", async ({ page }) => {
    const triggered = mockMethod(page, "POST", CvmRoutes.participantesSync, {
      status: 202,
      body: { task_id: "task-participantes-1", status: "queued", dataset: "intermed" },
    });

    await page.goto("/cvm/participantes/auditores");

    await page.getByRole("button", { name: "Sincronizar" }).click();
    await page.getByLabel("Dataset", { exact: true }).selectOption("intermed");
    await page.getByLabel("Forcar reprocessar").check();
    await page.getByRole("button", { name: "Confirmar" }).click();

    await expect(
      page.getByText("Sync de participantes agendado (task_id task-participantes-1)."),
    ).toBeVisible();
    expect(triggered).toHaveLength(1);
    expect(triggered[0]?.query.dataset).toBe("intermed");
    expect(triggered[0]?.query.force).toBe("true");
  });
});

test.describe("Participantes — intermediarios", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, { authenticated: true });
    mockGet(page, CvmRoutes.participantesSyncStatus, PARTICIPANTES_SYNC_STATUS);
    mockGet(
      page,
      CvmRoutes.participantesIntermediariosList,
      PARTICIPANTES_INTERMEDIARIOS_LIST,
    );
  });

  test("renders consolidated sync cards and intermediario rows", async ({ page }) => {
    await page.goto("/cvm/participantes/intermediarios");

    await expect(page.getByRole("heading", { name: "Intermediarios" })).toBeVisible();

    await expectSyncCards(page);

    await expect(page.getByText("XP Investimentos CCTVM S.A.")).toBeVisible();
    await expect(page.getByText("Modal DTVM Ltda")).toBeVisible();
    await expect(page.getByText("EM FUNCIONAMENTO NORMAL", { exact: true })).toBeVisible();
    await expect(page.getByText("CANCELADA", { exact: true })).toBeVisible();
  });

  test("forwards situacao and tipo_participante filters to the API", async ({ page }) => {
    const captured = mockGet(
      page,
      CvmRoutes.participantesIntermediariosList,
      PARTICIPANTES_INTERMEDIARIOS_LIST,
    );

    await page.goto("/cvm/participantes/intermediarios");
    await expect.poll(() => captured.length).toBeGreaterThanOrEqual(1);

    await page.getByLabel("Situacao", { exact: true }).fill("CANCELADA");
    await page.getByLabel("Tipo de participante", { exact: true }).fill("DISTRIBUIDORA");

    await expect.poll(() => captured.at(-1)?.query.situacao).toBe("CANCELADA");
    await expect
      .poll(() => captured.at(-1)?.query.tipo_participante)
      .toBe("DISTRIBUIDORA");
  });

  test("navigates from list to intermediario detail by cnpj", async ({ page }) => {
    mockGet(
      page,
      CvmRoutes.participantesIntermediarioDetail,
      PARTICIPANTES_INTERMEDIARIO_XP,
    );

    await page.goto("/cvm/participantes/intermediarios");

    await page.getByRole("link", { name: "XP Investimentos CCTVM S.A." }).click();

    await expect(page).toHaveURL(
      /\/cvm\/participantes\/intermediarios\/detail\?cnpj=02332886000104/,
    );
    await expect(
      page.getByRole("heading", { name: PARTICIPANTES_INTERMEDIARIO_XP.denom_social }),
    ).toBeVisible();

    // Identification card fields
    await expect(
      page.getByText("Intermediacao de valores mobiliarios", { exact: true }),
    ).toBeVisible();
    await expect(page.getByText("XP Investimentos", { exact: true })).toBeVisible();
  });
});

test.describe("Participantes — administradores de carteira", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, { authenticated: true });
    mockGet(page, CvmRoutes.participantesSyncStatus, PARTICIPANTES_SYNC_STATUS);
    mockGet(
      page,
      CvmRoutes.participantesAdmCarteiraList,
      PARTICIPANTES_ADM_CARTEIRA_LIST,
    );
  });

  test("renders consolidated sync cards and adm. carteira rows", async ({ page }) => {
    await page.goto("/cvm/participantes/adm-carteira");

    await expect(
      page.getByRole("heading", { name: "Administradores de carteira" }),
    ).toBeVisible();

    await expectSyncCards(page);

    await expect(page.getByText("Verde Asset Management S.A.")).toBeVisible();
    await expect(page.getByText("Maria Gestora da Silva")).toBeVisible();
    await expect(page.getByText("Gestor de Recursos", { exact: true })).toBeVisible();
    await expect(page.getByText("Suspenso", { exact: true })).toBeVisible();
  });

  test("forwards situacao and categoria_registro filters to the API", async ({ page }) => {
    const captured = mockGet(
      page,
      CvmRoutes.participantesAdmCarteiraList,
      PARTICIPANTES_ADM_CARTEIRA_LIST,
    );

    await page.goto("/cvm/participantes/adm-carteira");
    await expect.poll(() => captured.length).toBeGreaterThanOrEqual(1);

    await page.getByLabel("Situacao", { exact: true }).fill("ATIVO");
    await page.getByLabel("Categoria de registro", { exact: true }).fill("Pessoa Fisica");

    await expect.poll(() => captured.at(-1)?.query.situacao).toBe("ATIVO");
    await expect
      .poll(() => captured.at(-1)?.query.categoria_registro)
      .toBe("Pessoa Fisica");
  });
});

// ---------------------------------------------------------------------------
// S02 T04 — validacao de participantes (API generica report_type/ref)
// ---------------------------------------------------------------------------

test.describe("Participantes — validacao na lista (badge + filtro + link)", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, { authenticated: true });
    mockGet(page, CvmRoutes.participantesSyncStatus, PARTICIPANTES_SYNC_STATUS);
  });

  test("auditores: badges, filtro envia validation_status e link de validacao", async ({ page }) => {
    const captured = mockGet(
      page,
      CvmRoutes.participantesAuditoresList,
      PARTICIPANTES_AUDITORES_LIST,
    );

    await page.goto("/cvm/participantes/auditores");

    const table = page.getByRole("table");
    await expect(table.getByText("Pendente", { exact: true }).first()).toBeVisible();
    await expect(table.getByText("Validado", { exact: true })).toBeVisible();

    const link = page.locator(
      `a[href^="/cvm/participantes/auditores/validate?id=${encodeURIComponent(PARTICIPANTES_AUDITOR_PJ.id)}"]`,
    );
    await expect(link.first()).toBeVisible();

    await page.getByLabel("Status de validacao").selectOption("valid");
    await expect.poll(() => captured.at(-1)?.query.validation_status).toBe("valid");
  });

  test("intermediarios: badges, filtro envia validation_status e link de validacao", async ({ page }) => {
    const captured = mockGet(
      page,
      CvmRoutes.participantesIntermediariosList,
      PARTICIPANTES_INTERMEDIARIOS_LIST,
    );

    await page.goto("/cvm/participantes/intermediarios");

    const table = page.getByRole("table");
    await expect(table.getByText("Pendente", { exact: true }).first()).toBeVisible();
    await expect(table.getByText("Validado", { exact: true })).toBeVisible();

    const link = page.locator(
      `a[href^="/cvm/participantes/intermediarios/validate?id=${encodeURIComponent(PARTICIPANTES_INTERMEDIARIO_XP.id)}"]`,
    );
    await expect(link.first()).toBeVisible();

    await page.getByLabel("Status de validacao").selectOption("pending");
    await expect.poll(() => captured.at(-1)?.query.validation_status).toBe("pending");
  });

  test("adm-carteira: badges, filtro envia validation_status e link de validacao", async ({ page }) => {
    const captured = mockGet(
      page,
      CvmRoutes.participantesAdmCarteiraList,
      PARTICIPANTES_ADM_CARTEIRA_LIST,
    );

    await page.goto("/cvm/participantes/adm-carteira");

    const table = page.getByRole("table");
    await expect(table.getByText("Pendente", { exact: true }).first()).toBeVisible();
    await expect(table.getByText("Validado", { exact: true })).toBeVisible();

    const link = page.locator(
      `a[href^="/cvm/participantes/adm-carteira/validate?id=${encodeURIComponent(PARTICIPANTES_ADM_CARTEIRA_PJ.id)}"]`,
    );
    await expect(link.first()).toBeVisible();

    await page.getByLabel("Status de validacao").selectOption("valid");
    await expect.poll(() => captured.at(-1)?.query.validation_status).toBe("valid");
  });
});

test.describe("Participantes — tela de validacao (marcar + reverter)", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, { authenticated: true });
  });

  test("auditores: header legivel, marca como valido (POST generico) e reverte", async ({ page }) => {
    // A tela de validacao le a LISTA (estreitada por situacao/tipo) e acha por id.
    mockGet(page, CvmRoutes.participantesAuditoresList, PARTICIPANTES_AUDITORES_LIST);

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
          report_type: "participante_auditor",
          ref: PARTICIPANTES_AUDITOR_PJ.id,
          cd_cvm: PARTICIPANTES_AUDITOR_PJ.cd_cvm,
          validation: {
            status: "valid",
            validated_by: {
              id: "00000000-0000-0000-0000-000000000001",
              name: "Caio Moderador",
              email: "caio@talous.ai",
            },
            validated_at: "2026-06-09T13:45:00Z",
          },
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
          report_type: "participante_auditor",
          ref: PARTICIPANTES_AUDITOR_PJ.id,
          cd_cvm: PARTICIPANTES_AUDITOR_PJ.cd_cvm,
          validation: { status: "pending", validated_by: null, validated_at: null },
        }),
      });
    });

    await page.goto(
      `/cvm/participantes/auditores/validate?id=${encodeURIComponent(PARTICIPANTES_AUDITOR_PJ.id)}&situacao=ATIVO&tipo=PJ`,
    );

    // Header legivel + campos cadastrais.
    await expect(
      page.getByRole("heading", { name: PARTICIPANTES_AUDITOR_PJ.nome }),
    ).toBeVisible();
    await expect(page.getByText("Validacao de auditor independente", { exact: true })).toBeVisible();
    await expect(page.getByText("Dados cadastrais", { exact: true })).toBeVisible();

    // O PJ comeca pendente.
    await expect(page.getByText("Pendente de validacao")).toBeVisible();

    await page.getByRole("button", { name: "Marcar como valido" }).click();
    await expect.poll(() => validateCalls.length).toBe(1);
    expect(validateCalls[0]).toEqual({
      report_type: "participante_auditor",
      ref: String(PARTICIPANTES_AUDITOR_PJ.id),
    });
    await expect(page.getByText(/Validado por Caio Moderador em/)).toBeVisible();

    await page.getByRole("button", { name: "Reverter validacao" }).click();
    await expect.poll(() => invalidateCalls.length).toBe(1);
    expect(invalidateCalls[0]).toEqual({
      report_type: "participante_auditor",
      ref: String(PARTICIPANTES_AUDITOR_PJ.id),
    });
    await expect(page.getByText("Pendente de validacao")).toBeVisible();
  });
});
