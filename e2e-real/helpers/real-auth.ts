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
 */
export async function realLogin(page: Page, email: string = REAL_ADMIN_EMAIL) {
  await page.goto("/login");

  const emailInput = page.getByLabel("E-mail");
  await emailInput.waitFor();
  await emailInput.fill(email);

  await page.getByRole("button", { name: "Entrar no admin" }).click();

  // Redirect para /cvm so acontece quando o dev-login real retorna 200.
  await page.waitForURL("**/cvm");
  await expect(page.getByText("Sessao administrativa iniciada.")).toBeVisible();
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
