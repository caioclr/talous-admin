import { expect, test } from "@playwright/test";
import { mockAuth } from "./helpers/mock-api";
import { CvmRoutes, mockGet } from "./helpers/mock-cvm";
import {
  ALERTS_LIST,
  CVM_DASHBOARD_DEFAULT,
  OPS_JOBS_DEFAULT,
  OPS_JOBS_EMPTY,
  OPS_JOBS_SELIC_FILTERED,
} from "./fixtures/cvm";

test.describe("Operação / Jobs page", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, { authenticated: true });
  });

  test("renders the per-job status cards covering ok/running/failed/stale", async ({ page }) => {
    mockGet(page, CvmRoutes.opsJobs, OPS_JOBS_DEFAULT);

    await page.goto("/cvm/jobs");

    const main = page.getByRole("main");

    await expect(page.getByRole("heading", { name: "Jobs / Sync" })).toBeVisible();
    await expect(main.getByRole("heading", { name: "Status por job" })).toBeVisible();

    // PT-BR labels for the main pipeline jobs (status card titles are headings).
    await expect(main.getByRole("heading", { name: "Pipeline EOD" })).toBeVisible();
    await expect(main.getByRole("heading", { name: "Preços intraday" })).toBeVisible();
    await expect(main.getByRole("heading", { name: "Taxa Selic" })).toBeVisible();

    // The 4 status badges appear (ok / running / failed / stale -> "Atrasado").
    await expect(main.getByText("OK").first()).toBeVisible();
    await expect(main.getByText("Rodando").first()).toBeVisible();
    await expect(main.getByText("Falha").first()).toBeVisible();
    await expect(main.getByText("Atrasado").first()).toBeVisible();

    // Summary tiles are present (counts derived in the backend-fed payload).
    await expect(main.getByText("Em falha", { exact: true })).toBeVisible();
    await expect(main.getByText("Atrasados (stale)", { exact: true })).toBeVisible();
  });

  test("EOD card notes Score/Ranking are internal steps", async ({ page }) => {
    mockGet(page, CvmRoutes.opsJobs, OPS_JOBS_DEFAULT);

    await page.goto("/cvm/jobs");

    await expect(
      page.getByRole("main").getByText(/Score e Ranking são steps internos do EOD/),
    ).toBeVisible();
  });

  test("loads history with the default history_limit", async ({ page }) => {
    const captured = mockGet(page, CvmRoutes.opsJobs, OPS_JOBS_DEFAULT);

    await page.goto("/cvm/jobs");
    await expect.poll(() => captured.length).toBeGreaterThanOrEqual(1);

    expect(captured.at(-1)?.query.history_limit).toBe("50");
    // No job filter on initial load.
    expect(captured.at(-1)?.query.job_name).toBeUndefined();

    await expect(page.getByRole("main").getByRole("heading", { name: "Histórico de execuções" }))
      .toBeVisible();
  });

  test("filtering by job forwards job_name to the backend", async ({ page }) => {
    const captured = mockGet(page, CvmRoutes.opsJobs, OPS_JOBS_DEFAULT);

    await page.goto("/cvm/jobs");
    await expect.poll(() => captured.length).toBeGreaterThanOrEqual(1);

    await page.getByRole("combobox").selectOption("jobs.update_selic_rate");

    await expect.poll(() => captured.at(-1)?.query.job_name).toBe("jobs.update_selic_rate");
    expect(captured.at(-1)?.query.history_limit).toBe("50");
  });

  test("shows the filtered history when a single job is selected", async ({ page }) => {
    // First load returns the full set; once filtered, return only Selic runs.
    void page.route(CvmRoutes.opsJobs, async (route) => {
      const url = new URL(route.request().url());
      const body = url.searchParams.get("job_name")
        ? OPS_JOBS_SELIC_FILTERED
        : OPS_JOBS_DEFAULT;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(body),
      });
    });

    await page.goto("/cvm/jobs");
    await page.getByRole("combobox").selectOption("jobs.update_selic_rate");

    const main = page.getByRole("main");
    // Selic detail message from the failed run is present in the table.
    await expect(main.getByText("Timeout ao consultar BCB").first()).toBeVisible();
  });

  test("handles an empty environment (no jobs)", async ({ page }) => {
    mockGet(page, CvmRoutes.opsJobs, OPS_JOBS_EMPTY);

    await page.goto("/cvm/jobs");

    const main = page.getByRole("main");
    await expect(main.getByText("Nenhum job registrado ainda.")).toBeVisible();
    await expect(
      main.getByText("Nenhuma execução no histórico para o filtro informado."),
    ).toBeVisible();
  });

  test("surfaces a backend error", async ({ page }) => {
    void page.route(CvmRoutes.opsJobs, async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Falha ao ler status dos jobs" }),
      });
    });

    await page.goto("/cvm/jobs");

    await expect(page.getByRole("main").getByText("Falha ao ler status dos jobs")).toBeVisible();
  });
});

test.describe("Dashboard pipeline panel (S12 — replaces the S06 placeholder)", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, { authenticated: true });
  });

  test("renders real pipeline status instead of the 'em breve' placeholder", async ({ page }) => {
    mockGet(page, CvmRoutes.dashboard, CVM_DASHBOARD_DEFAULT);
    mockGet(page, CvmRoutes.alertsList, ALERTS_LIST);
    mockGet(page, CvmRoutes.opsJobs, OPS_JOBS_DEFAULT);

    await page.goto("/cvm");

    const main = page.getByRole("main");

    await expect(main.getByRole("heading", { name: "Status do pipeline" })).toBeVisible();
    // Placeholder gone.
    await expect(main.getByText("Operação em breve")).toHaveCount(0);

    // Main pipeline jobs shown by PT-BR label.
    await expect(main.getByText("Pipeline EOD", { exact: true })).toBeVisible();
    await expect(main.getByText("Preços intraday", { exact: true })).toBeVisible();

    // Condensed cvm_sync_* line: 2 syncs in fixture, 1 needs attention (fre failed).
    await expect(main.getByText(/Syncs CVM \(2\)/)).toBeVisible();
    await expect(main.getByText(/1 requer atenção/)).toBeVisible();

    // Cross-link to the ops page.
    await expect(main.getByRole("link", { name: "Ver jobs →" })).toHaveAttribute(
      "href",
      "/cvm/jobs",
    );
  });

  test("surfaces an ops error inside the pipeline panel without breaking the dashboard", async ({
    page,
  }) => {
    mockGet(page, CvmRoutes.dashboard, CVM_DASHBOARD_DEFAULT);
    mockGet(page, CvmRoutes.alertsList, ALERTS_LIST);
    void page.route(CvmRoutes.opsJobs, async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Falha ao ler status dos jobs" }),
      });
    });

    await page.goto("/cvm");

    const main = page.getByRole("main");
    // Dashboard still renders.
    await expect(main.getByRole("heading", { name: "Dashboard CVM" })).toBeVisible();
    // Pipeline panel shows its own error.
    await expect(main.getByText(/Não foi possível carregar o status do pipeline/)).toBeVisible();
  });
});
