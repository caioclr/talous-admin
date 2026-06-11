import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getICBGCByCompany,
  getICBGCReport,
  getICBGCSyncStatus,
  listICBGCReports,
  triggerICBGCSync,
} from "@/lib/services/admin/cvm-icbgc";
import { setAccessToken } from "@/lib/services/client";

describe("cvm-icbgc service", () => {
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

  it("builds reports URL with full filter set", async () => {
    const fetchMock = mockOk({
      items: [],
      pagination: { page: 1, page_size: 50, total: 0, total_pages: 0 },
    });

    await listICBGCReports({
      cd_cvm: 9512,
      cnpj: "33000167000101",
      year: 2025,
      page: 2,
      page_size: 25,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8001/api/v1/admin/cvm/icbgc/reports?cd_cvm=9512&cnpj=33000167000101&year=2025&page=2&page_size=25",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("builds report detail URL by id_documento", async () => {
    const fetchMock = mockOk({});

    await getICBGCReport(123456);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8001/api/v1/admin/cvm/icbgc/reports/123456",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("builds by-company URL", async () => {
    const fetchMock = mockOk({ cd_cvm: 9512, company_name: "Petrobras", reports: [] });

    await getICBGCByCompany(9512);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8001/api/v1/admin/cvm/icbgc/by-company/9512",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("hits sync-status endpoint", async () => {
    const fetchMock = mockOk({});

    await getICBGCSyncStatus();

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8001/api/v1/admin/cvm/icbgc/sync-status",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("POSTs sync trigger with year + force", async () => {
    const fetchMock = mockOk({ task_id: "task-icbgc-1", status: "queued" });

    await triggerICBGCSync({ year: 2025, force: true });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8001/api/v1/admin/cvm/icbgc/sync?year=2025&force=true",
      expect.objectContaining({ method: "POST", credentials: "include" }),
    );
  });
});
