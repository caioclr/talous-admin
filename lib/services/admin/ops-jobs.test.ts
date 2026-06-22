import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  JOB_LABELS,
  PIPELINE_JOB_NAMES,
  getOpsJobs,
  isCvmSyncJob,
  jobDescription,
  jobLabel,
} from "@/lib/services/admin/ops-jobs";
import { setAccessToken } from "@/lib/services/client";

describe("ops-jobs service", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setAccessToken("test-token");
  });

  afterEach(() => {
    setAccessToken(null);
  });

  function mockOk(payload: unknown) {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => payload,
    });
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  }

  it("hits the ops jobs endpoint without params", async () => {
    const fetchMock = mockOk({ jobs: [], history: [] });

    await getOpsJobs();

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8001/api/v1/admin/ops/jobs",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("forwards job_name and history_limit as query params", async () => {
    const fetchMock = mockOk({ jobs: [], history: [] });

    await getOpsJobs({ job_name: "jobs.run_eod_pipeline", history_limit: 50 });

    const calledUrl = fetchMock.mock.calls[0][0] as string;
    expect(calledUrl).toContain("/admin/ops/jobs?");
    expect(calledUrl).toContain("job_name=jobs.run_eod_pipeline");
    expect(calledUrl).toContain("history_limit=50");
  });

  it("maps every instrumented job_name to a PT-BR label", () => {
    // Mesma taxonomia do backend (handoff S12): 5 principais + 10 cvm_sync_*.
    const backendJobs = [
      "jobs.run_eod_pipeline",
      "jobs.update_intraday_prices",
      "jobs.update_selic_rate",
      "jobs.refresh_fundamentals_after_release",
      "jobs.cvm_structural_change_trigger",
      "jobs.cvm_sync_company_registry",
      "jobs.cvm_sync_ipe",
      "jobs.cvm_sync_itr_dfp",
      "jobs.cvm_sync_capital_composition",
      "jobs.cvm_sync_buyback",
      "jobs.cvm_sync_governance",
      "jobs.cvm_sync_fre",
      "jobs.cvm_sync_vlmo",
      "jobs.cvm_sync_fca",
      "jobs.cvm_sync_participantes",
    ];
    for (const name of backendJobs) {
      expect(JOB_LABELS).toHaveProperty(name);
    }
    expect(Object.keys(JOB_LABELS)).toHaveLength(backendJobs.length);
  });

  it("notes that Score/Ranking are EOD steps", () => {
    expect(jobDescription("jobs.run_eod_pipeline")).toContain("Score");
    expect(jobDescription("jobs.run_eod_pipeline")).toContain("Ranking");
  });

  it("identifies cvm_sync_* jobs", () => {
    expect(isCvmSyncJob("jobs.cvm_sync_ipe")).toBe(true);
    expect(isCvmSyncJob("jobs.run_eod_pipeline")).toBe(false);
  });

  it("keeps the EOD job out of the cvm_sync bucket but in the pipeline panel", () => {
    expect(PIPELINE_JOB_NAMES).toContain("jobs.run_eod_pipeline");
    for (const name of PIPELINE_JOB_NAMES) {
      expect(isCvmSyncJob(name)).toBe(false);
    }
  });

  it("falls back to the raw job_name for unknown labels", () => {
    expect(jobLabel("jobs.unknown")).toBe("jobs.unknown");
    expect(jobDescription("jobs.unknown")).toBe("");
  });
});
