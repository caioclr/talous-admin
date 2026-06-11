import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getFREFiling,
  getFRESyncStatus,
  listFREByCompany,
  listFREFilings,
  triggerFRESync,
} from "@/lib/services/admin/cvm-fre";
import { setAccessToken } from "@/lib/services/client";

describe("cvm-fre service", () => {
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

  it("builds filings list URL with filters", async () => {
    const fetchMock = mockOk({
      items: [],
      pagination: { page: 1, page_size: 50, total: 0, total_pages: 0 },
    });

    await listFREFilings({ cd_cvm: 9512, year: 2025, page: 2, page_size: 25 });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8001/api/v1/admin/cvm/fre/filings?cd_cvm=9512&year=2025&page=2&page_size=25",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("URL-encodes id_documento on detail", async () => {
    const fetchMock = mockOk({});

    await getFREFiling("DOC/2026 #1");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8001/api/v1/admin/cvm/fre/filings/DOC%2F2026%20%231",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("builds by-company URL", async () => {
    const fetchMock = mockOk({
      items: [],
      pagination: { page: 1, page_size: 50, total: 0, total_pages: 0 },
    });

    await listFREByCompany(9512, { page: 1, page_size: 50 });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8001/api/v1/admin/cvm/fre/by-company/9512?page=1&page_size=50",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("hits sync-status endpoint", async () => {
    const fetchMock = mockOk({});

    await getFRESyncStatus();

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8001/api/v1/admin/cvm/fre/sync-status",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("POSTs sync trigger with year + force", async () => {
    const fetchMock = mockOk({ task_id: "task-fre-1", status: "queued" });

    await triggerFRESync({ year: 2026, force: true });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8001/api/v1/admin/cvm/fre/sync?year=2026&force=true",
      expect.objectContaining({ method: "POST", credentials: "include" }),
    );
  });
});
