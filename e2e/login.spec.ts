import { expect, test } from "@playwright/test";
import {
  captureDevLoginRequests,
  mockAdminEndpointsEmpty,
  mockAuth,
  tokenResponse,
} from "./helpers/mock-api";
import { CVM_DASHBOARD_EMPTY } from "./fixtures/cvm";

test.describe("Login screen", () => {
  test("renders the dev-login form when unauthenticated", async ({ page }) => {
    await mockAuth(page);

    await page.goto("/login");

    await expect(page.getByRole("heading", { name: "Login de desenvolvimento" })).toBeVisible();
    await expect(page.getByLabel("E-mail")).toHaveValue("admin@talous.ai");
    await expect(page.getByRole("button", { name: "Entrar no admin" })).toBeEnabled();
  });

  test("blocks submit with an invalid e-mail (zod validation)", async ({ page }) => {
    await mockAuth(page);
    const captured = captureDevLoginRequests(page);

    await page.goto("/login");

    const emailInput = page.getByLabel("E-mail");
    await expect(emailInput).toHaveValue("admin@talous.ai");
    await emailInput.clear();
    await emailInput.fill("not-an-email");
    await page.getByRole("button", { name: "Entrar no admin" }).click();

    await expect(page.getByText("Informe um e-mail valido.")).toBeVisible();
    expect(captured).toHaveLength(0);
    await expect(page).toHaveURL(/\/login/);
  });

  test("submits dev-login, stores token and redirects to /cvm", async ({ page }) => {
    await mockAuth(page);
    await mockAdminEndpointsEmpty(page);
    const captured = captureDevLoginRequests(page);

    await page.goto("/login");

    const emailInput = page.getByLabel("E-mail");
    await expect(emailInput).toHaveValue("admin@talous.ai");
    await emailInput.clear();
    await emailInput.fill("operator@talous.ai");
    await page.getByRole("button", { name: "Entrar no admin" }).click();

    await page.waitForURL("**/cvm");
    await expect(page.getByText("Sessao administrativa iniciada.")).toBeVisible();

    expect(captured).toHaveLength(1);
    expect(captured[0]?.body).toEqual({ email: "operator@talous.ai" });
  });

  test("respects ?next= when redirecting after login", async ({ page }) => {
    await mockAuth(page);
    await mockAdminEndpointsEmpty(page);

    await page.goto("/login?next=%2Fcvm%2Fcompanies");

    await page.getByRole("button", { name: "Entrar no admin" }).click();

    await page.waitForURL("**/cvm/companies");
  });

  test("shows toast when backend rejects dev-login", async ({ page }) => {
    await mockAuth(page, {
      devLogin: { status: 401, body: { detail: "Credenciais invalidas" } },
    });

    await page.goto("/login");

    await page.getByRole("button", { name: "Entrar no admin" }).click();

    await expect(page.getByText("Credenciais invalidas")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("sends Authorization Bearer when token is set after login", async ({ page }) => {
    await mockAuth(page);
    await mockAdminEndpointsEmpty(page);

    // Escuta o /dashboard, que e o que /cvm chama hoje. Antes escutava
    // `registry/sync-status`, endpoint que a home do admin deixou de pedir — e um
    // observador que nunca dispara nao prova nada: o teste passava a falhar por
    // "cabecalho nulo" sem que houvesse requisicao alguma para inspecionar.
    let observedAuthHeader: string | null = null;
    await page.route("**/api/v1/admin/cvm/dashboard", async (route) => {
      observedAuthHeader = route.request().headers()["authorization"] ?? null;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(CVM_DASHBOARD_EMPTY),
      });
    });

    await page.goto("/login");
    await page.getByRole("button", { name: "Entrar no admin" }).click();
    await page.waitForURL("**/cvm");

    await expect.poll(() => observedAuthHeader).toBe(`Bearer ${tokenResponse().access_token}`);
  });

  test("redirects to /cvm when already authenticated and visiting /login", async ({ page }) => {
    await mockAuth(page, { authenticated: true });
    await mockAdminEndpointsEmpty(page);

    await page.goto("/login");

    await page.waitForURL("**/cvm");
  });

  test("AdminGuard redirects to /login when refresh fails", async ({ page }) => {
    await mockAuth(page);
    await mockAdminEndpointsEmpty(page);

    await page.goto("/cvm");

    await page.waitForURL((url) => url.pathname === "/login" && url.search.includes("next=%2Fcvm"));
    await expect(page.getByRole("heading", { name: "Login de desenvolvimento" })).toBeVisible();
  });
});
