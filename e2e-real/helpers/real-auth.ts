import { expect, request, type Page } from "@playwright/test";

/**
 * Admin conhecido para o login real. O backend dev (`is_production=false`)
 * expoe `POST /auth/dev-login`; estes e-mails estao marcados `is_admin=true`
 * no banco real (ver README de e2e-real). Sobreponivel via env para stage.
 */
export const REAL_ADMIN_EMAIL = process.env.E2E_REAL_ADMIN_EMAIL ?? "dev@talous.ai";

/**
 * Faz login real pelo formulario de dev-login (sem mock). Preenche o e-mail,
 * submete, e espera o redirect para /cvm — confirmando que o backend aceitou as
 * credenciais e o token ficou em memoria para o resto do contexto da pagina.
 *
 * Resiliente a mudanca de classe: seleciona por label/role e pelo texto do toast.
 *
 * ESTABILIDADE (anti-flake): NAO esperamos o evento `load` de /cvm. O dashboard
 * dispara queries pesadas contra o backend real e o `load` completo pode passar
 * de 30s, estourando o timeout do `waitForURL` padrao (que espera `load`). Aqui:
 *   1. `waitForURL("**\/cvm", { waitUntil: "commit" })` resolve assim que o
 *      `router.replace("/cvm")` aplica a navegacao — sem aguardar a rede do
 *      dashboard, que e a parte lenta;
 *   2. assercoes em elementos ESTAVEIS com timeout proprio: o toast de sucesso
 *      (prova que o dev-login retornou 200) e o brand do shell autenticado.
 * Assim o login deixa de depender do tempo de carregamento do dashboard.
 */
export async function realLogin(page: Page, email: string = REAL_ADMIN_EMAIL) {
  await page.goto("/login");

  const emailInput = page.getByLabel("E-mail");
  await emailInput.waitFor();
  await emailInput.fill(email);

  await page.getByRole("button", { name: "Entrar no admin" }).click();

  // O sucesso do login se prova por sinais PERSISTENTES, nao pela navegacao:
  //
  // 1) URL muda para /cvm. O redirect e client-side (router.replace), entao
  //    usamos expect.toHaveURL (polling de URL) em vez de page.waitForURL — este
  //    ultimo herda o navigationTimeout global (30s, atrelado ao evento de
  //    navegacao) e estourava de forma intermitente quando o dashboard pesado
  //    segurava o commit. O polling de URL nao depende do `load` da pagina.
  await expect(page).toHaveURL(/\/cvm(\?|$|\/)/, { timeout: 30_000 });

  // 2) Shell autenticado renderizou: brand "Talous Admin" e estavel, persistente
  //    e independe das queries do dashboard. E a prova mais robusta de que
  //    estamos de fato na area logada.
  await expect(page.getByText("Talous Admin", { exact: true })).toBeVisible({
    timeout: 20_000,
  });

  // 3) (Best-effort) O toast "Sessao administrativa iniciada." confirma o 200 do
  //    dev-login, mas e EFEMERO (sonner auto-dismiss ~4s): em runs lentas ele
  //    pode sumir antes da assercao. Tratamos como sinal informativo e nao
  //    bloqueante — os asserts duros acima ja garantem a sessao autenticada.
  await page
    .getByText("Sessao administrativa iniciada.")
    .waitFor({ state: "visible", timeout: 2_000 })
    .catch(() => {
      /* toast ja dispensado: ok, a sessao ja foi confirmada pela URL + shell */
    });
}

/**
 * Origem do backend para chamadas diretas (probe de capacidade). O admin fala
 * com o backend via rewrite do Next (`/api/v1` -> BACKEND_API_ORIGIN); aqui
 * batemos direto no backend para inspecionar o contrato sem passar pela UI.
 */
const BACKEND_ORIGIN =
  process.env.BACKEND_API_ORIGIN ?? "http://localhost:8001";

/**
 * True se o backend real ja aceita esse `report_type` na API generica de
 * validacao (T01). Enquanto a Onda 2 nao mergeia, capital/buyback sao recusados
 * com `report_type must be one of [...]` — nesse caso o teste real deve SKIPAR
 * (a UI esta correta contra o contrato futuro; quem nao chegou e o backend).
 *
 * Probe nao-destrutivo: usa um `ref` NUMERICO claramente inexistente. O backend
 * tipa `ref` como inteiro e valida o parse ANTES do report_type — por isso o ref
 * precisa ser numerico para alcancar a checagem de report_type. Se o tipo NAO
 * for suportado, responde 422 com `report_type must be one of [...]`. Se for
 * suportado, responde 404 "not found" (o tipo ja passou) — tratado como
 * suportado.
 */
export async function reportTypeSupported(
  reportType: string,
): Promise<boolean> {
  const email = REAL_ADMIN_EMAIL;
  const ctx = await request.newContext({ baseURL: BACKEND_ORIGIN });
  try {
    const login = await ctx.post("/api/v1/auth/dev-login", {
      data: { email },
    });
    if (!login.ok()) return false;
    const token = (await login.json())?.access_token as string | undefined;
    if (!token) return false;

    const res = await ctx.post("/api/v1/admin/cvm/validations/validate", {
      headers: { Authorization: `Bearer ${token}` },
      // ref numerico inexistente: passa o int_parsing e alcanca a checagem de tipo.
      data: { report_type: reportType, ref: 999999999 },
    });
    const bodyText = await res.text();
    // Sinal inequivoco de tipo nao suportado pelo backend atual.
    return !/report_type must be one of/i.test(bodyText);
  } catch {
    return false;
  } finally {
    await ctx.dispose();
  }
}
