import { expect, test, type Page, type Locator } from "@playwright/test";
import { realLogin, reportTypeSupported } from "./helpers/real-auth";

/**
 * E2E REAL — fluxo de validacao das 6 telas CVM
 * (ITR/DFP, FRE, FCA, ICBGC, Capital, Recompras).
 *
 * Bate no backend real (8001, dev-login) — NAO ha `page.route`/mock. Cada teste:
 *   1. login real (dev-login com admin conhecido);
 *   2. abre a lista do tipo, confere badge de status + filtro pendente/validado;
 *   3. pega o 1o item, abre a tela de validacao, le que renderiza secoes;
 *   4. marca como valido -> assert do selo "Validado por ...";
 *   5. reverte -> assert que voltou a "Pendente".
 *
 * AUTO-LIMPEZA (estado persiste no banco real): cada teste captura o status
 * ORIGINAL do item e, ao final, restaura esse estado. Assim e re-rodavel sem
 * sujar o banco, independentemente de uma run anterior ter deixado validado.
 *
 * Skip com mensagem clara quando o tipo nao tem dado no banco.
 */

type Tipo = "itr-dfp" | "fre" | "fca" | "icbgc" | "capital-composition" | "buybacks";

interface TipoConfig {
  tipo: Tipo;
  /** `report_type` enviado a API generica de validacao (T01). */
  reportType: string;
  /** Path da lista. */
  listPath: string;
  /**
   * Fragmento de path da tela de validacao (sem query), usado no waitForURL.
   * Por padrao coincide com `tipo`, mas Capital/Recompras tem path proprio.
   */
  validatePath?: string;
  /** Heading que prova que a lista renderizou. */
  listHeading: RegExp;
  /**
   * Localiza, a partir da 1a linha da tabela, o link que abre a tela de
   * validacao daquele item. Cada tipo tem uma coluna "Validacao" com "Abrir".
   */
  openValidateLink: (firstRow: Locator) => Locator;
  /** Trecho do conteudo da tela de validacao que prova que as secoes renderizaram. */
  validateContent: RegExp;
}

const CONFIGS: TipoConfig[] = [
  {
    tipo: "itr-dfp",
    reportType: "itr-dfp",
    listPath: "/cvm/itr-dfp",
    listHeading: /Validacao de filings ITR\/DFP/,
    // ITR/DFP tem uma unica coluna-link "Validacao" -> "Abrir".
    openValidateLink: (row) => row.getByRole("link", { name: "Abrir" }),
    // A tela renderiza o card "Demonstrativos" (DRE/DFC/BP).
    validateContent: /Demonstrativos/,
  },
  {
    tipo: "fre",
    reportType: "fre",
    listPath: "/cvm/fre",
    listHeading: /Formulario de Referencia/,
    openValidateLink: (row) => row.getByRole("link", { name: "Abrir" }),
    // A tela do FRE tem o card "Identificacao do filing".
    validateContent: /Identificacao do filing/,
  },
  {
    tipo: "fca",
    reportType: "fca",
    listPath: "/cvm/fca",
    listHeading: /Formulario Cadastral/,
    // FCA tem DUAS colunas "Abrir" (Documento + Validacao). A ultima e a de validacao.
    openValidateLink: (row) => row.getByRole("link", { name: "Abrir" }).last(),
    validateContent: /Identificacao do documento/,
  },
  {
    tipo: "icbgc",
    reportType: "icbgc",
    listPath: "/cvm/icbgc",
    listHeading: /Governanca corporativa/,
    // ICBGC tambem tem duas "Abrir" (Informe + Validacao). A ultima e a de validacao.
    openValidateLink: (row) => row.getByRole("link", { name: "Abrir" }).last(),
    validateContent: /Identificacao do informe/,
  },
  {
    tipo: "capital-composition",
    reportType: "capital",
    listPath: "/cvm/capital-composition",
    validatePath: "capital-composition",
    listHeading: /Composicao de capital/,
    // Capital tem DUAS "Abrir" (Snapshot + Validacao). A ultima e a de validacao.
    openValidateLink: (row) => row.getByRole("link", { name: "Abrir" }).last(),
    // A tela de capital tem o card "Quantidades".
    validateContent: /Quantidades/,
  },
  {
    tipo: "buybacks",
    reportType: "buyback",
    listPath: "/cvm/buybacks",
    validatePath: "buybacks",
    listHeading: /Recompras de acoes/,
    // A lista de recompras tem duas "Abrir" (Programa + Conferir). A ultima valida.
    openValidateLink: (row) => row.getByRole("link", { name: "Abrir" }).last(),
    // A tela de recompra tem o card "Programa".
    validateContent: /Programa/,
  },
];

/** Selo "Validado por ..." (estado valido) na tela de validacao. */
function seloValidado(page: Page) {
  return page.getByText(/Validado por .+/);
}

/** Selo "Pendente de validacao" (estado pendente) na tela de validacao. */
function seloPendente(page: Page) {
  return page.getByText("Pendente de validacao", { exact: true });
}

/** True se a tela esta no estado validado (selo "Validado por ..." visivel). */
async function estaValidado(page: Page): Promise<boolean> {
  return seloValidado(page).isVisible();
}

/** Garante estado PENDENTE na tela de validacao (reverte se vier validado). */
async function garantirPendente(page: Page) {
  if (await estaValidado(page)) {
    await page.getByRole("button", { name: "Reverter validacao" }).click();
    await expect(seloPendente(page)).toBeVisible();
  }
  await expect(seloPendente(page)).toBeVisible();
}

/** Restaura o estado ORIGINAL do item (auto-limpeza). */
async function restaurarEstado(page: Page, eraValidado: boolean) {
  const validadoAgora = await estaValidado(page);
  if (eraValidado && !validadoAgora) {
    await page.getByRole("button", { name: "Marcar como valido" }).click();
    await expect(seloValidado(page)).toBeVisible();
  } else if (!eraValidado && validadoAgora) {
    await page.getByRole("button", { name: "Reverter validacao" }).click();
    await expect(seloPendente(page)).toBeVisible();
  }
}

for (const config of CONFIGS) {
  test.describe(`CVM validacao real — ${config.tipo.toUpperCase()}`, () => {
    test.beforeEach(async ({ page }) => {
      await realLogin(page);
    });

    test("lista, abre a tela e valida/reverte ponta-a-ponta", async ({ page }) => {
      // --- 1/2. Lista do tipo: heading + badges + filtro ---
      await page.goto(config.listPath);
      await expect(page.getByRole("heading", { name: config.listHeading })).toBeVisible();

      const table = page.getByRole("table");
      const firstRow = table.locator("tbody tr").first();

      // Skip claro quando o tipo nao tem dado no banco real.
      const rowCount = await table.locator("tbody tr").count();
      test.skip(
        rowCount === 0,
        `Sem dado de ${config.tipo} no banco real — nada para validar.`,
      );
      await expect(firstRow).toBeVisible();

      // Badge de status na 1a linha: "Validado" ou "Pendente" (escopado na tabela).
      const statusBadge = firstRow.getByText(/^(Validado|Pendente)$/);
      await expect(statusBadge.first()).toBeVisible();

      // Filtro pendente/validado existe e e operavel (envia ao backend e re-renderiza).
      const statusFilter = page.getByLabel("Status de validacao");
      await statusFilter.selectOption("pending");
      await expect(statusFilter).toHaveValue("pending");
      await statusFilter.selectOption("valid");
      await expect(statusFilter).toHaveValue("valid");

      // Reset do filtro: recarrega a lista sem filtro para reaver a 1a linha
      // (o filtro nao persiste na URL; reload volta a "todos"). Mais robusto que
      // depender da re-populacao assincrona da tabela.
      await page.goto(config.listPath);
      await expect(page.getByRole("heading", { name: config.listHeading })).toBeVisible();
      const rowForOpen = table.locator("tbody tr").first();
      await expect(rowForOpen).toBeVisible();

      // --- 3. Abre a tela de validacao do 1o item ---
      await config.openValidateLink(rowForOpen).click();
      await page.waitForURL(`**/cvm/${config.validatePath ?? config.tipo}/validate**`);

      // Renderiza as secoes/demonstrativos do tipo.
      await expect(page.getByText(config.validateContent).first()).toBeVisible();
      // O selo (validado ou pendente) sempre aparece.
      await expect(seloValidado(page).or(seloPendente(page)).first()).toBeVisible();

      // Skip do fluxo validar/reverter quando o backend real ainda NAO aceita
      // esse report_type na API generica de validacao (T01 Onda 2 nao mergeado).
      // A UI ja foi exercitada acima (lista, badge, filtro, tela, selo pendente);
      // so a mutation depende do backend. Mantemos o teste re-rodavel e honesto.
      // ITR/DFP usa o endpoint bespoke /itr-dfp/filings/validate (nao a API
      // generica), entao nao passa pelo probe.
      if (config.reportType !== "itr-dfp") {
        const supported = await reportTypeSupported(config.reportType);
        test.skip(
          !supported,
          `Backend real ainda nao aceita report_type="${config.reportType}" na API generica de validacao (T01 Onda 2 nao mergeado).`,
        );
      }

      // Captura o estado ORIGINAL para restaurar no fim (auto-limpeza).
      const eraValidado = await estaValidado(page);

      // Garante pendente para um ponto de partida deterministico.
      await garantirPendente(page);

      // --- 4. Marca como valido -> selo "Validado por ..." ---
      await page.getByRole("button", { name: "Marcar como valido" }).click();
      await expect(seloValidado(page)).toBeVisible();

      // --- 5. Reverte -> volta a "Pendente" ---
      await page.getByRole("button", { name: "Reverter validacao" }).click();
      await expect(seloPendente(page)).toBeVisible();

      // --- Auto-limpeza: restaura o estado original do item ---
      await restaurarEstado(page, eraValidado);
    });
  });
}
