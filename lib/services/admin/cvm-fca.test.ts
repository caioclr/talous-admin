import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getFCAByCompany,
  getFCADocumento,
  getFCASyncStatus,
  listFCADocumentos,
  triggerFCASync,
} from "@/lib/services/admin/cvm-fca";
import { setAccessToken } from "@/lib/services/client";

describe("cvm-fca service", () => {
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

  it("builds documentos URL with full filter set", async () => {
    const fetchMock = mockOk({
      items: [],
      pagination: { page: 1, page_size: 50, total: 0, total_pages: 0 },
    });

    await listFCADocumentos({
      cd_cvm: 9512,
      cnpj: "33000167000101",
      year: 2025,
      page: 2,
      page_size: 25,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8001/api/v1/admin/cvm/fca/documentos?cd_cvm=9512&cnpj=33000167000101&year=2025&page=2&page_size=25",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("builds documento detail URL by id_documento", async () => {
    const fetchMock = mockOk({});

    await getFCADocumento(123456);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8001/api/v1/admin/cvm/fca/documentos/123456",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("builds by-company URL", async () => {
    const fetchMock = mockOk({ cd_cvm: 9512, company_name: "Petrobras", documentos: [] });

    await getFCAByCompany(9512);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8001/api/v1/admin/cvm/fca/by-company/9512",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("hits sync-status endpoint", async () => {
    const fetchMock = mockOk({});

    await getFCASyncStatus();

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8001/api/v1/admin/cvm/fca/sync-status",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("POSTs sync trigger with year + force", async () => {
    const fetchMock = mockOk({ task_id: "task-fca-1", status: "queued" });

    await triggerFCASync({ year: 2025, force: true });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8001/api/v1/admin/cvm/fca/sync?year=2025&force=true",
      expect.objectContaining({ method: "POST", credentials: "include" }),
    );
  });
});
