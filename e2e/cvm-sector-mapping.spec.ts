import { expect, test } from "@playwright/test";
import { mockAuth } from "./helpers/mock-api";
import { CvmRoutes, mockGet, mockMethod } from "./helpers/mock-cvm";
import { SECTORS_WITH_SUBSECTORS, SECTOR_MAPPINGS, UNMAPPED_SECTORS } from "./fixtures/cvm";

test.describe("CVM sector mapping", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, { authenticated: true });
    // A pagina agora carrega tambem a taxonomia (/admin/sectors) na montagem.
    mockGet(page, CvmRoutes.sectorsList, SECTORS_WITH_SUBSECTORS);
    // Registered last so that GET /sector-mapping/unmapped wins over the
    // /sector-mapping/{item} catch-all when matching.
    mockGet(page, CvmRoutes.sectorMappingList, SECTOR_MAPPINGS);
    mockGet(page, CvmRoutes.sectorMappingUnmapped, UNMAPPED_SECTORS);
  });

  test("renders existing mappings and pending sectors", async ({ page }) => {
    await page.goto("/cvm/sector-mapping");

    // Existing mappings table
    await expect(page.getByText("PETROLEO E GAS")).toBeVisible();
    await expect(page.getByText("energy")).toBeVisible();

    // Pending sectors card
    await expect(page.getByRole("button", { name: /TELECOMUNICACOES/ })).toBeVisible();
    await expect(page.getByText("4 empresas · Tim Brasil")).toBeVisible();
  });

  test("opens an empty form when clicking 'Novo mapeamento'", async ({ page }) => {
    await page.goto("/cvm/sector-mapping");

    await page.getByRole("button", { name: "Novo mapeamento" }).click();

    await expect(page.getByRole("heading", { name: "Salvar mapeamento" })).toBeVisible();
    await expect(page.getByLabel("Setor CVM")).toHaveValue("");
    await expect(page.getByLabel("Slug interno")).toHaveValue("");
  });

  test("clicking a pending sector pre-fills the upsert form", async ({ page }) => {
    await page.goto("/cvm/sector-mapping");

    await page.getByRole("button", { name: /TELECOMUNICACOES/ }).click();

    await expect(page.getByRole("heading", { name: "Salvar mapeamento" })).toBeVisible();
    await expect(page.getByLabel("Setor CVM")).toHaveValue("TELECOMUNICACOES");
    await expect(page.getByLabel("Slug interno")).toHaveValue("");
    await expect(page.getByLabel("Notas")).toHaveValue("Tim Brasil, Vivo, Oi");
  });

  test("zod blocks submit when required fields are missing", async ({ page }) => {
    await page.goto("/cvm/sector-mapping");

    await page.getByRole("button", { name: "Novo mapeamento" }).click();
    await page.getByRole("button", { name: "Salvar", exact: true }).click();

    await expect(page.getByText("Informe o setor CVM.")).toBeVisible();
    await expect(page.getByText("Informe o slug interno.")).toBeVisible();
  });

  test("submits a new mapping (POST) and shows success toast", async ({ page }) => {
    const upsertCaptured = mockMethod(page, "POST", CvmRoutes.sectorMappingList, {
      body: {
        cvm_setor_atividade: "TELECOMUNICACOES",
        internal_sector_id: "44444444-4444-4444-4444-444444444444",
        internal_sector_slug: "telecom",
        notes: "Tim, Vivo, Oi",
        created_at: "2026-04-29T10:00:00Z",
        updated_at: "2026-04-29T10:00:00Z",
      },
    });

    await page.goto("/cvm/sector-mapping");

    await page.getByRole("button", { name: /TELECOMUNICACOES/ }).click();
    await page.getByLabel("Slug interno").fill("telecom");
    await page.getByLabel("Notas").clear();
    await page.getByLabel("Notas").fill("Tim, Vivo, Oi");
    await page.getByRole("button", { name: "Salvar", exact: true }).click();

    await expect(page.getByText("Mapeamento salvo.")).toBeVisible();
    expect(upsertCaptured).toHaveLength(1);
    expect(upsertCaptured[0]?.body).toEqual({
      cvm_setor_atividade: "TELECOMUNICACOES",
      internal_sector_slug: "telecom",
      notes: "Tim, Vivo, Oi",
    });
  });

  test("editing an existing row pre-fills the form with current values", async ({ page }) => {
    await page.goto("/cvm/sector-mapping");

    // Escopa na linha do mapeamento CVM (ha botoes "Editar" tambem nos cards de
    // setor/subsetor da taxonomia, que renderizam antes na pagina).
    await page
      .getByRole("row")
      .filter({ hasText: "PETROLEO E GAS" })
      .getByRole("button", { name: "Editar" })
      .click();

    await expect(page.getByLabel("Setor CVM")).toHaveValue("PETROLEO E GAS");
    await expect(page.getByLabel("Slug interno")).toHaveValue("energy");
    await expect(page.getByLabel("Notas")).toHaveValue("Setor de petroleo, gas e energia");
  });

  test("deleting a mapping confirms and calls DELETE with the encoded sector id", async ({ page }) => {
    const deleteCaptured = mockMethod(page, "DELETE", CvmRoutes.sectorMappingItem);

    await page.goto("/cvm/sector-mapping");

    await page
      .getByRole("row")
      .filter({ hasText: "PETROLEO E GAS" })
      .getByRole("button", { name: "Excluir" })
      .click();
    await expect(
      page.getByRole("heading", { name: "Remover mapeamento?" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Confirmar" }).click();

    await expect(page.getByText("Mapeamento removido.")).toBeVisible();
    expect(deleteCaptured).toHaveLength(1);
    // "PETROLEO E GAS" is encoded as PETROLEO%20E%20GAS
    expect(deleteCaptured[0]?.url).toContain("/sector-mapping/PETROLEO%20E%20GAS");
    expect(deleteCaptured[0]?.method).toBe("DELETE");
  });

  test("surfaces backend error when upsert fails", async ({ page }) => {
    mockMethod(page, "POST", CvmRoutes.sectorMappingList, {
      status: 422,
      body: { detail: "Internal sector slug not found: foobar" },
    });

    await page.goto("/cvm/sector-mapping");

    await page.getByRole("button", { name: "Novo mapeamento" }).click();
    await page.getByLabel("Setor CVM").fill("UNKNOWN");
    await page.getByLabel("Slug interno").fill("foobar");
    await page.getByRole("button", { name: "Salvar", exact: true }).click();

    await expect(
      page.getByText("Internal sector slug not found: foobar"),
    ).toBeVisible();
  });
});
