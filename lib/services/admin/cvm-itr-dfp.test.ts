import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getITRDFPAccountLines,
  getITRDFPReconciliation,
  listITRDFPFilings,
  triggerITRDFPSync,
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
});
