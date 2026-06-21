import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getBuybackProgram,
  getBuybacksSyncStatus,
  listActiveBuybackPrograms,
  listBuybackPrograms,
  listBuybackProgramsByCompany,
  triggerBuybacksSync,
} from "@/lib/services/admin/cvm-buybacks";
import { setAccessToken } from "@/lib/services/client";

describe("cvm-buybacks service", () => {
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

  it("builds programs list URL with filters", async () => {
    const fetchMock = mockOk({
      items: [],
      pagination: { page: 1, page_size: 50, total: 0, total_pages: 0 },
    });

    await listBuybackPrograms({
      cd_cvm: 9512,
      situacao: "ATIVO",
      tipo_operacao: "COMPRA",
      page: 1,
      page_size: 20,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8001/api/v1/admin/cvm/buybacks/programs?cd_cvm=9512&situacao=ATIVO&tipo_operacao=COMPRA&page=1&page_size=20",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("forwards validation_status filter (S02 T02)", async () => {
    const fetchMock = mockOk({
      items: [],
      pagination: { page: 1, page_size: 20, total: 0, total_pages: 0 },
    });

    await listBuybackPrograms({
      validation_status: "valid",
      page: 1,
      page_size: 20,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8001/api/v1/admin/cvm/buybacks/programs?validation_status=valid&page=1&page_size=20",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("URL-encodes id_programa on detail", async () => {
    const fetchMock = mockOk({});

    await getBuybackProgram("PROG/2026 #1");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8001/api/v1/admin/cvm/buybacks/programs/PROG%2F2026%20%231",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("builds by-company URL", async () => {
    const fetchMock = mockOk({
      items: [],
      pagination: { page: 1, page_size: 50, total: 0, total_pages: 0 },
    });

    await listBuybackProgramsByCompany(9512, { page: 1, page_size: 50 });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8001/api/v1/admin/cvm/buybacks/programs/by-company/9512?page=1&page_size=50",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("hits /active endpoint", async () => {
    const fetchMock = mockOk({
      items: [],
      pagination: { page: 1, page_size: 50, total: 0, total_pages: 0 },
    });

    await listActiveBuybackPrograms({ page: 1, page_size: 10 });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8001/api/v1/admin/cvm/buybacks/active?page=1&page_size=10",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("hits sync-status endpoint", async () => {
    const fetchMock = mockOk({});

    await getBuybacksSyncStatus();

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8001/api/v1/admin/cvm/buybacks/sync-status",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("POSTs sync trigger with force flag", async () => {
    const fetchMock = mockOk({ task_id: "task-9", status: "queued" });

    await triggerBuybacksSync(true);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8001/api/v1/admin/cvm/buybacks/sync?force=true",
      expect.objectContaining({ method: "POST", credentials: "include" }),
    );
  });
});
