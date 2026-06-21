import { expect, type Page } from "@playwright/test";

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
