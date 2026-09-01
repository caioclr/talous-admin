import { expect, test } from "@playwright/test";
import { mockAuth } from "./helpers/mock-api";
import { CvmRoutes, mockGet, mockMethod } from "./helpers/mock-cvm";
import {
  COMPANIES_LIST,
  COMPANY_ASSIGNMENT_PETROBRAS,
  SECTORS_WITH_SUBSECTORS,
  SECTOR_ENERGIA_ID,
  SECTOR_MAPPINGS,
  SUBSECTOR_REFINO_ID,
  UNMAPPED_SECTORS,
} from "./fixtures/cvm";

// Cobre o escopo S10 T02: CRUD de setor + subsetor, reatribuicao de empresa e a
// guarda de DELETE (409). A pagina vive em /cvm/sector-mapping (mesma rota
// expandida). As rotas de taxonomia ficam sob /admin/sectors, NAO /admin/cvm.
test.describe("CVM sectors CRUD + reassignment", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, { authenticated: true });
    mockGet(page, CvmRoutes.sectorsList, SECTORS_WITH_SUBSECTORS);
    mockGet(page, CvmRoutes.sectorMappingList, SECTOR_MAPPINGS);
    mockGet(page, CvmRoutes.sectorMappingUnmapped, UNMAPPED_SECTORS);
    mockGet(page, CvmRoutes.companiesList, COMPANIES_LIST);
  });

  test("renders sectors with nested subsectors and company counts", async ({ page }) => {
    await page.goto("/cvm/sector-mapping");

    const energia = page.getByTestId("sector-card").filter({ hasText: "Energia" });
    await expect(energia).toBeVisible();
    await expect(energia).toContainText("3 empresa(s)");
    await expect(energia).toContainText("2 subsetor(es)");

    // Subsetor aninhado com sua propria contagem.
    await expect(energia.getByTestId("subsector-row").filter({ hasText: "Refino" })).toContainText(
      "0 empresa(s)",
    );
    await expect(
      energia.getByTestId("subsector-row").filter({ hasText: "Exploracao e Producao" }),
    ).toContainText("1 empresa(s)");
  });

  test("creates a new sector (POST /admin/sectors, slug omitted when empty)", async ({ page }) => {
    const captured = mockMethod(page, "POST", CvmRoutes.sectorsList, {
      status: 201,
      body: {
        id: "99999999-9999-9999-9999-999999999999",
        name: "Saude",
        slug: "saude",
        created_at: "2026-06-22T00:00:00Z",
      },
    });

    await page.goto("/cvm/sector-mapping");
    await page.getByRole("button", { name: "Novo setor" }).click();
    await expect(page.getByRole("heading", { name: "Novo setor" })).toBeVisible();

    await page.getByLabel("Nome").fill("Saude");
    await page.getByRole("button", { name: "Salvar" }).click();

    await expect(page.getByText("Taxonomia atualizada.")).toBeVisible();
    expect(captured).toHaveLength(1);
    // Slug vazio nao deve ir no body (backend deriva do nome).
    expect(captured[0]?.body).toEqual({ name: "Saude" });
  });

  test("creates a subsector nested under a sector", async ({ page }) => {
    const captured = mockMethod(page, "POST", CvmRoutes.subsectorsList, {
      status: 201,
      body: {
        id: "88888888-8888-8888-8888-888888888888",
        sector_id: SECTOR_ENERGIA_ID,
        name: "Distribuicao",
        slug: "distribuicao",
        company_count: 0,
        created_at: "2026-06-22T00:00:00Z",
        updated_at: "2026-06-22T00:00:00Z",
      },
    });

    await page.goto("/cvm/sector-mapping");
    await page
      .getByTestId("sector-card")
      .filter({ hasText: "Energia" })
      .getByRole("button", { name: "Subsetor" })
      .click();
    await expect(page.getByRole("heading", { name: "Novo subsetor" })).toBeVisible();

    await page.getByLabel("Nome").fill("Distribuicao");
    await page.getByLabel("Slug (opcional)").fill("distribuicao");
    await page.getByRole("button", { name: "Salvar" }).click();

    await expect(page.getByText("Taxonomia atualizada.")).toBeVisible();
    expect(captured).toHaveLength(1);
    expect(captured[0]?.url).toContain(`/admin/sectors/${SECTOR_ENERGIA_ID}/subsectors`);
    expect(captured[0]?.body).toEqual({ name: "Distribuicao", slug: "distribuicao" });
  });

  test("surfaces the 409 guard when deleting a sector with dependencies", async ({ page }) => {
    mockMethod(page, "DELETE", CvmRoutes.sectorItem, {
      status: 409,
      body: {
        detail:
          "Setor não pode ser removido: há dependências apontando para ele (2 empresa(s)). Reatribua antes de remover.",
      },
    });

    await page.goto("/cvm/sector-mapping");
    await page
      .getByTestId("sector-card")
      .filter({ hasText: "Materiais" })
      .getByRole("button", { name: "Excluir" })
      .click();
    await expect(page.getByRole("heading", { name: /Remover setor/ })).toBeVisible();
    await page.getByRole("button", { name: "Confirmar" }).click();

    // O detail da guarda 409 deve aparecer (nao engolido).
    await expect(page.getByText(/dependências apontando para ele/)).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // Reatribuicao — agora pela ARVORE, na propria linha da empresa.
  //
  // O card "Reatribuir empresa" (busca por texto, dialog) foi removido: ele
  // achava a empresa uma a uma e nunca revelaria os 37 setores errados nem as 98
  // sem subsetor. As ASSERCOES DE CORPO abaixo sao as mesmas — elas sao o lock do
  // contrato, e sobrevivem intactas a troca de interacao.
  // ---------------------------------------------------------------------------

  async function abreEditorDaPetrobras(page: import("@playwright/test").Page) {
    await page.goto("/cvm/sector-mapping");
    await page.getByTestId("sector-toggle-energia").click();
    // A Petrobras do fixture esta SEM subsetor: cai no no "(sem subsetor)", que e
    // exatamente o caminho para as 98 empresas nessa situacao na base real.
    const semSubsetor = page
      .getByTestId("tree-subsector-row")
      .filter({ hasText: "(sem subsetor)" });
    await semSubsetor.getByRole("button").first().click();
    await expect(page.getByText("Petrobras", { exact: false }).first()).toBeVisible();
    await page.locator('[data-testid^="company-reassign-"]').first().click();
    await expect(page.getByTestId("company-assignment-editor")).toBeVisible();
  }

  test("reassigns a company to a new sector + subsector (PATCH assignment)", async ({ page }) => {
    const captured = mockMethod(page, "PATCH", CvmRoutes.companyAssignment, {
      status: 200,
      body: COMPANY_ASSIGNMENT_PETROBRAS,
    });

    await abreEditorDaPetrobras(page);
    await page.getByTestId("assignment-sector").selectOption({ label: "Energia" });
    await page.getByTestId("assignment-subsector").selectOption({ label: "Refino" });
    await page.getByTestId("assignment-save").click();

    expect(captured).toHaveLength(1);
    expect(captured[0]?.url).toContain("/admin/sectors/companies/");
    expect(captured[0]?.url).toContain("/assignment");
    expect(captured[0]?.body).toHaveProperty("subsector_id", SUBSECTOR_REFINO_ID);
  });

  async function abreEditorDaRefinaria(page: import("@playwright/test").Page) {
    await page.goto("/cvm/sector-mapping");
    await page.getByTestId("sector-toggle-energia").click();
    const refino = page.getByTestId("tree-subsector-row").filter({ hasText: "Refino" });
    await refino.getByRole("button").first().click();
    await expect(page.getByText("Refinaria Exemplo", { exact: false })).toBeVisible();
    await page.locator('[data-testid^="company-reassign-"]').first().click();
    await expect(page.getByTestId("company-assignment-editor")).toBeVisible();
  }

  test("clearing the subsector sends subsector_id: null explicitly", async ({ page }) => {
    const captured = mockMethod(page, "PATCH", CvmRoutes.companyAssignment, {
      status: 200,
      body: { ...COMPANY_ASSIGNMENT_PETROBRAS, subsector_id: null, subsector_slug: null },
    });

    await abreEditorDaRefinaria(page);
    await page.getByTestId("assignment-subsector").selectOption({ label: "(sem subsetor)" });
    await page.getByTestId("assignment-save").click();

    expect(captured).toHaveLength(1);
    // Chave PRESENTE com null => backend limpa o subsetor. Mesma asercao de antes.
    expect(captured[0]?.body).toHaveProperty("subsector_id", null);
  });

  test("surfaces the 422 and keeps the editor open", async ({ page }) => {
    mockMethod(page, "PATCH", CvmRoutes.companyAssignment, {
      status: 422,
      body: {
        detail:
          "Subsetor não pertence ao setor da empresa. Envie um subsetor do setor final ou limpe o subsetor.",
      },
    });

    await abreEditorDaRefinaria(page);
    await page.getByTestId("assignment-subsector").selectOption({ label: "(sem subsetor)" });
    await page.getByTestId("assignment-save").click();

    await expect(page.getByText(/Subsetor não pertence ao setor/)).toBeVisible();
    // O fluxo antigo fechava o dialog e engolia o contexto.
    await expect(page.getByTestId("company-assignment-editor")).toBeVisible();
  });

  test("a arvore so busca empresas quando o setor e expandido", async ({ page }) => {
    let chamadas = 0;
    await page.route(CvmRoutes.companiesList, async (route) => {
      chamadas += 1;
      await route.fulfill({ json: COMPANIES_LIST });
    });

    await page.goto("/cvm/sector-mapping");
    await expect(page.getByTestId("sector-tree")).toBeVisible();
    expect(chamadas).toBe(0);

    await page.getByTestId("sector-toggle-energia").click();
    await expect.poll(() => chamadas).toBe(1);
  });
});
