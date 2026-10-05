import { expect, test } from "@playwright/test";
import { mockAuth } from "./helpers/mock-api";
import { CvmRoutes, mockGet } from "./helpers/mock-cvm";
import {
  PROVIDER_QUOTA_CRITICAL,
  PROVIDER_QUOTA_DEFAULT,
  PROVIDER_QUOTA_EMPTY,
  PROVIDER_QUOTA_STALE,
  PROVIDER_QUOTA_WARNING,
} from "./fixtures/cvm";

test.describe("Operação / Cota do provedor", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, { authenticated: true });
  });

  test("shows today's consumption against the daily limit", async ({ page }) => {
    const captured = mockGet(page, CvmRoutes.providerQuota, PROVIDER_QUOTA_DEFAULT);

    await page.goto("/cvm/provider-quota");

    const main = page.getByRole("main");
    await expect(main.getByRole("heading", { name: "Cota do provedor" })).toBeVisible();

    // Requests the last 30 days.
    await expect.poll(() => captured.length).toBeGreaterThanOrEqual(1);
    expect(captured.at(-1)?.query.days).toBe("30");

    await expect(main.getByRole("heading", { name: "Consumo hoje" })).toBeVisible();
    await expect(main.getByTestId("quota-used")).toHaveText("616");
    await expect(main.getByText("/ 10.000 requisições")).toBeVisible();
    await expect(main.getByText("6,2%", { exact: true }).first()).toBeVisible();
    await expect(main.getByText("9.384", { exact: true })).toBeVisible();
    await expect(main.getByText("plano pro", { exact: true })).toBeVisible();
    await expect(main.getByText("Sem leitura hoje")).toHaveCount(0);
  });

  test("lists the daily history with per-day warning and danger badges", async ({ page }) => {
    mockGet(page, CvmRoutes.providerQuota, PROVIDER_QUOTA_DEFAULT);

    await page.goto("/cvm/provider-quota");

    const main = page.getByRole("main");
    await expect(main.getByRole("heading", { name: "Últimos 30 dias" })).toBeVisible();

    const table = main.getByRole("table");
    // One row per day in the fixture (+ header row).
    await expect(table.getByRole("row")).toHaveCount(PROVIDER_QUOTA_DEFAULT.days.length + 1);
    await expect(table.getByText("96,0%", { exact: true })).toBeVisible();
    await expect(table.getByText("Crítico", { exact: true })).toBeVisible();
    await expect(table.getByText("82,0%", { exact: true })).toBeVisible();
    await expect(table.getByText("Atenção", { exact: true })).toBeVisible();
  });

  test("warns in the header at 80% of the limit", async ({ page }) => {
    mockGet(page, CvmRoutes.providerQuota, PROVIDER_QUOTA_WARNING);

    await page.goto("/cvm/provider-quota");

    const used = page.getByRole("main").getByTestId("quota-used");
    await expect(used).toHaveText("8.500");
    await expect(used).toHaveClass(/text-warning/);
  });

  test("flags danger in the header at 95% of the limit", async ({ page }) => {
    mockGet(page, CvmRoutes.providerQuota, PROVIDER_QUOTA_CRITICAL);

    await page.goto("/cvm/provider-quota");

    const main = page.getByRole("main");
    const used = main.getByTestId("quota-used");
    await expect(used).toHaveText("9.730");
    await expect(used).toHaveClass(/text-destructive/);
    await expect(main.getByText("97,3%", { exact: true }).first()).toBeVisible();
    await expect(main.getByText("270", { exact: true })).toBeVisible();
  });

  test("does not present an old reading as today's", async ({ page }) => {
    mockGet(page, CvmRoutes.providerQuota, PROVIDER_QUOTA_STALE);

    await page.goto("/cvm/provider-quota");

    const main = page.getByRole("main");
    await expect(main.getByRole("heading", { name: /^Consumo em \d{2}\/\d{2}\/\d{4}$/ })).toBeVisible();
    await expect(main.getByText(/Sem leitura hoje/)).toBeVisible();
  });

  test("handles an environment with no readings yet", async ({ page }) => {
    mockGet(page, CvmRoutes.providerQuota, PROVIDER_QUOTA_EMPTY);

    await page.goto("/cvm/provider-quota");

    const main = page.getByRole("main");
    await expect(main.getByText("Nenhuma leitura de cota registrada ainda.")).toBeVisible();
    await expect(main.getByRole("table")).toHaveCount(0);
  });

  test("surfaces a backend error", async ({ page }) => {
    void page.route(CvmRoutes.providerQuota, async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Falha ao ler a cota" }),
      });
    });

    await page.goto("/cvm/provider-quota");

    await expect(page.getByRole("main").getByText(/Falha ao ler a cota/)).toBeVisible();
  });

  test("is reachable from the Operação nav group", async ({ page }) => {
    mockGet(page, CvmRoutes.providerQuota, PROVIDER_QUOTA_DEFAULT);

    await page.goto("/cvm/provider-quota");

    await expect(
      page.getByRole("navigation").getByRole("link", { name: "Cota do provedor" }).first(),
    ).toHaveAttribute("href", "/cvm/provider-quota");
  });
});
