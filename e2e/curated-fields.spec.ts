import { expect, test } from "@playwright/test";
import { mockAuth } from "./helpers/mock-api";
import { CvmRoutes, mockGet, mockMethod } from "./helpers/mock-cvm";
import {
  CHANGES_PETROBRAS,
  COMPANY_DETAIL_PETROBRAS,
  CURATED_CATALOG,
  CURATED_FIELDS_EMPTY,
  CURATED_GMV_DRAFT,
  CURATED_GMV_PUBLISHED,
  HISTORY_PETROBRAS,
  IPE_DISCLOSURES_LIST,
  IPE_RELEASE_GMV_DETAIL,
  IPE_RELEASE_OK_SUMMARY,
  IPE_RELEASES_BY_COMPANY,
} from "./fixtures/cvm";

/**
 * Ler o release e levar o trecho para o campo — o fluxo inteiro, na tela.
 *
 * Os testes de unidade cobrem o servico (que caminho, que metodo) e o viewer
 * (busca, destaque, contagem) isoladamente. O que so o e2e prova e a **fiacao**:
 * que o trecho selecionado no documento chega ao formulario, que a proveniencia
 * vai no corpo do PUT sem o operador digitar nada, e que publicar e um segundo
 * ato com o periodo certo na query.
 *
 * O texto do release e o do 2T26 da BHIA3, documento real: "GMV R$ 10,5 Bi
 * total (+0,5% a/a)".
 */

const DETAIL_URL = "/cvm/companies/detail?cd_cvm=9512";
const COMPANY_ID = COMPANY_DETAIL_PETROBRAS.id;

function mockTudo(page: import("@playwright/test").Page) {
  return {
    company: mockGet(page, CvmRoutes.companyDetail, COMPANY_DETAIL_PETROBRAS),
    history: mockGet(page, CvmRoutes.companyHistory, HISTORY_PETROBRAS),
    changes: mockGet(page, CvmRoutes.companyChanges, CHANGES_PETROBRAS),
    ipe: mockGet(page, CvmRoutes.ipeByCompany, IPE_DISCLOSURES_LIST),
    releases: mockGet(page, CvmRoutes.ipeReleasesByCompany, IPE_RELEASES_BY_COMPANY),
    releaseDetail: mockGet(page, CvmRoutes.ipeReleaseById, IPE_RELEASE_GMV_DETAIL),
    catalog: mockGet(page, CvmRoutes.curatedCatalog, CURATED_CATALOG),
    // Registrado por ULTIMO entre as rotas de curadoria com o mesmo prefixo,
    // porque `curatedField` (dois segmentos) tambem casaria com a lista.
    list: mockGet(page, CvmRoutes.curatedByCompany, CURATED_FIELDS_EMPTY),
  };
}

/**
 * Seleciona todo o texto do viewer, como o operador faria com o mouse.
 *
 * O `mouseup` no fim nao e enfeite: o viewer captura a selecao nesse evento, de
 * proposito — guarda o trecho porque o clique no botao pode colapsar a selecao
 * do navegador. Uma selecao programatica sem o evento nao existe para ele, e
 * simular o arraste sem o soltar seria simular metade do gesto.
 */
async function selecionaTextoDoViewer(page: import("@playwright/test").Page) {
  await page.evaluate(() => {
    const el = document.querySelector('[data-testid="viewer-text"]');
    if (!el) throw new Error("viewer-text ausente");
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    el.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
  });
}

async function abreOReleaseComGmv(page: import("@playwright/test").Page) {
  await page.getByRole("tab", { name: "Moderar" }).click();
  const linha = page
    .getByRole("main")
    .getByRole("listitem")
    .filter({ hasText: "Release de Resultados 1T26" });
  await linha.getByRole("button", { name: "Abrir texto" }).click();
  await expect(linha.getByTestId("viewer-text")).toBeVisible();
  return linha;
}

test.describe("Curadoria — do release para o campo", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, { authenticated: true });
  });

  test("busca no documento acha o GMV e conta as ocorrencias", async ({ page }) => {
    mockTudo(page);
    await page.goto(DETAIL_URL);
    const linha = await abreOReleaseComGmv(page);

    // O gargalo de quem cura nao e ler, e localizar: o release real tem ~44 mil
    // caracteres.
    await linha.getByTestId("viewer-search").fill("GMV");
    await expect(linha.getByTestId("viewer-matches")).toContainText("2");
    await expect(linha.getByTestId("viewer-text").locator("mark")).toHaveCount(2);
  });

  test("o trecho selecionado chega ao formulario, e a proveniencia vai sozinha", async ({
    page,
  }) => {
    const calls = mockTudo(page);
    const put = mockMethod(page, "PUT", CvmRoutes.curatedField, {
      body: CURATED_GMV_DRAFT,
    });
    await page.goto(DETAIL_URL);
    const linha = await abreOReleaseComGmv(page);

    await selecionaTextoDoViewer(page);
    await linha.getByTestId("viewer-copy-selection").click();

    const painel = page.getByTestId("curated-fields-panel");
    // A origem aparece declarada, sem o operador digitar nada.
    await expect(painel.getByTestId("curated-provenance")).toBeVisible();

    // O campo numerico: o trecho colado nao serve de valor, o operador digita o
    // numero que leu. Trocar de campo troca o formulario.
    await painel.getByTestId("curated-field-select").selectOption("gmv");
    await expect(painel.getByTestId("curated-period")).toBeVisible();
    await painel.getByTestId("curated-period").fill("2T26");
    await painel.getByTestId("curated-value-num").fill("10500000000");

    await painel.getByTestId("curated-save").click();

    await expect.poll(() => put.length).toBe(1);
    expect(put[0].url).toContain(`/curated-fields/companies/${COMPANY_ID}/gmv`);
    expect(put[0].body).toMatchObject({
      period: "2T26",
      value_num: 10500000000,
      source_kind: "release",
      source_release_id: IPE_RELEASE_OK_SUMMARY.id,
    });
    // Salvar recarrega a lista da empresa.
    await expect.poll(() => calls.list.length).toBeGreaterThanOrEqual(2);
  });

  test("campo de texto leva o trecho do documento como valor", async ({ page }) => {
    mockTudo(page);
    const put = mockMethod(page, "PUT", CvmRoutes.curatedField, {
      body: CURATED_GMV_DRAFT,
    });
    await page.goto(DETAIL_URL);
    const linha = await abreOReleaseComGmv(page);

    await selecionaTextoDoViewer(page);
    await linha.getByTestId("viewer-copy-selection").click();

    const painel = page.getByTestId("curated-fields-panel");
    await painel.getByTestId("curated-field-select").selectOption("quarter_highlights");

    // Aqui o trecho E o valor — e o campo avisa que sera atribuido a companhia.
    await expect(painel.getByTestId("curated-value-text")).toHaveValue(/GMV R\$ 10,5 Bi/);
    await expect(painel.getByText(/fala da companhia/i)).toBeVisible();

    await painel.getByTestId("curated-period").fill("2T26");
    await painel.getByTestId("curated-save").click();

    await expect.poll(() => put.length).toBe(1);
    expect(put[0].url).toContain("/quarter_highlights");
    expect(String((put[0].body as { value_text: string }).value_text)).toContain("GMV");
  });

  test("salvar nao publica: publicar e um segundo ato, com o periodo na query", async ({
    page,
  }) => {
    mockTudo(page);
    // A lista volta com o rascunho — o estado em que o operador confere antes de
    // publicar.
    await page.unroute(CvmRoutes.curatedByCompany).catch(() => {});
    mockGet(page, CvmRoutes.curatedByCompany, [CURATED_GMV_DRAFT]);
    const publish = mockMethod(page, "POST", CvmRoutes.curatedPublish, {
      body: CURATED_GMV_PUBLISHED,
    });

    await page.goto(DETAIL_URL);
    await abreOReleaseComGmv(page);

    const painel = page.getByTestId("curated-fields-panel");
    const linhaDoCampo = painel.getByTestId("curated-row-gmv");
    await expect(linhaDoCampo).toContainText("Rascunho");

    await painel.getByTestId("curated-publish-gmv").click();

    await expect.poll(() => publish.length).toBe(1);
    expect(publish[0].url).toContain("/gmv/publish");
    // Sem o periodo, publicar o GMV do 2T26 poderia publicar o do 1T26.
    expect(publish[0].query.period).toBe("2T26");
  });

  test("campo publicado oferece despublicar, nao publicar de novo", async ({ page }) => {
    mockTudo(page);
    await page.unroute(CvmRoutes.curatedByCompany).catch(() => {});
    mockGet(page, CvmRoutes.curatedByCompany, [CURATED_GMV_PUBLISHED]);
    const unpublish = mockMethod(page, "DELETE", CvmRoutes.curatedPublish, { status: 204 });

    await page.goto(DETAIL_URL);
    await abreOReleaseComGmv(page);

    const painel = page.getByTestId("curated-fields-panel");
    await expect(painel.getByTestId("curated-row-gmv")).toContainText("Publicado");
    await expect(painel.getByTestId("curated-publish-gmv")).toHaveCount(0);

    await painel.getByTestId("curated-unpublish-gmv").click();
    await expect.poll(() => unpublish.length).toBe(1);
    expect(unpublish[0].query.period).toBe("2T26");
  });

  test("salvar fica bloqueado enquanto o periodo obrigatorio esta vazio", async ({ page }) => {
    mockTudo(page);
    await page.goto(DETAIL_URL);
    await abreOReleaseComGmv(page);

    const painel = page.getByTestId("curated-fields-panel");
    await painel.getByTestId("curated-field-select").selectOption("gmv");
    await painel.getByTestId("curated-value-num").fill("10500000000");

    // O backend recusa com 422; a tela nao deixa chegar la.
    await expect(painel.getByTestId("curated-save")).toBeDisabled();
    await painel.getByTestId("curated-period").fill("2T26");
    await expect(painel.getByTestId("curated-save")).toBeEnabled();
  });
});
