import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getITRDFPAccountLines,
  getITRDFPReconciliation,
  invalidateITRDFPFiling,
  listITRDFPFilings,
  listITRDFPFilingsWithValidation,
  triggerITRDFPSync,
  validateITRDFPFiling,
} from "@/lib/services/admin/cvm-itr-dfp";
import { setAccessToken } from "@/lib/services/client";

describe("cvm-itr-dfp service", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setAccessToken("test-token");
  });

  afterEach(() => {
    setAccessToken(null);
  });

  it("builds filings URL with filters", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [],
    });

    vi.stubGlobal("fetch", fetchMock);

    await listITRDFPFilings({
      cd_cvm: 9512,
      doc_type: "itr",
      grupo_dfr: "consolidado",
      limit: 25,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8001/api/v1/admin/cvm/itr-dfp/filings?cd_cvm=9512&doc_type=itr&grupo_dfr=consolidado&limit=25",
      expect.objectContaining({
        credentials: "include",
        headers: expect.any(Headers),
      }),
    );
  });

  it("builds account lines URL", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        cd_cvm: 9512,
        statement_type: "DRE",
        reference_date: "2025-12-31",
        grupo_dfr: "consolidado",
        items: [],
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    await getITRDFPAccountLines(9512, {
      statement_type: "DRE",
      reference_date: "2025-12-31",
      grupo_dfr: "consolidado",
      ordem_exerc: "ULTIMO",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8001/api/v1/admin/cvm/itr-dfp/account-lines/9512?statement_type=DRE&reference_date=2025-12-31&grupo_dfr=consolidado&ordem_exerc=ULTIMO",
      expect.objectContaining({
        credentials: "include",
      }),
    );
  });

  it("builds reconciliation URL", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        cd_cvm: 9512,
        reference_date: "2025-12-31",
        period_type: "annual",
        fields: [],
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    await getITRDFPReconciliation(9512, "2025-12-31", {
      period_type: "annual",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8001/api/v1/admin/cvm/itr-dfp/reconciliation/9512/2025-12-31?period_type=annual",
      expect.objectContaining({
        credentials: "include",
      }),
    );
  });

  it("sends POST for sync trigger", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ task_id: "task-999", status: "queued" }),
    });

    vi.stubGlobal("fetch", fetchMock);

    await triggerITRDFPSync("dfp", 2025);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8001/api/v1/admin/cvm/itr-dfp/sync?doc_type=dfp&year=2025",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
      }),
    );
  });

  it("forwards validation_status filter on filings-with-validation", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [],
    });

    vi.stubGlobal("fetch", fetchMock);

    await listITRDFPFilingsWithValidation({
      cd_cvm: 9512,
      validation_status: "pending",
      limit: 50,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8001/api/v1/admin/cvm/itr-dfp/filings?cd_cvm=9512&validation_status=pending&limit=50",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("POSTs the filing identity body when validating", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    });

    vi.stubGlobal("fetch", fetchMock);

    const params = {
      cd_cvm: 9512,
      doc_type: "itr",
      reference_date: "2025-03-31",
      grupo_dfr: "consolidado",
      version: 1,
    };

    await validateITRDFPFiling(params);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://localhost:8001/api/v1/admin/cvm/itr-dfp/filings/validate");
    expect(init.method).toBe("POST");
    expect(init.credentials).toBe("include");
    expect(JSON.parse(init.body as string)).toEqual(params);
    expect((init.headers as Headers).get("Content-Type")).toBe("application/json");
  });

  it("POSTs the filing identity body when reverting", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    });

    vi.stubGlobal("fetch", fetchMock);

    const params = {
      cd_cvm: 9512,
      doc_type: "dfp",
      reference_date: "2024-12-31",
      grupo_dfr: "individual",
      version: 2,
    };

    await invalidateITRDFPFiling(params);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://localhost:8001/api/v1/admin/cvm/itr-dfp/filings/invalidate");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual(params);
  });
});
