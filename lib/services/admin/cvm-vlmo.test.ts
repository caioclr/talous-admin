import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getVLMOAggregates,
  getVLMOFiling,
  getVLMOSyncStatus,
  listVLMOByCompany,
  listVLMOFilings,
  listVLMOMovimentacoes,
  triggerVLMOSync,
} from "@/lib/services/admin/cvm-vlmo";
import { setAccessToken } from "@/lib/services/client";

describe("cvm-vlmo service", () => {
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

  it("builds filings URL with full filter set incl. validation_status", async () => {
    const fetchMock = mockOk({
      items: [],
      pagination: { page: 1, page_size: 25, total: 0, total_pages: 0 },
    });

    await listVLMOFilings({
      cnpj: "33000167000101",
      cd_cvm: 9512,
      year: 2026,
      validation_status: "pending",
      page: 2,
      page_size: 25,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8001/api/v1/admin/cvm/vlmo/filings?cnpj=33000167000101&cd_cvm=9512&year=2026&validation_status=pending&page=2&page_size=25",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("builds filing detail URL by UUID", async () => {
    const fetchMock = mockOk({});

    await getVLMOFiling("vfil0001-0000-0000-0000-000000000001");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8001/api/v1/admin/cvm/vlmo/filings/vfil0001-0000-0000-0000-000000000001",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("builds movimentacoes URL with full filter set", async () => {
    const fetchMock = mockOk({
      items: [],
      pagination: { page: 1, page_size: 50, total: 0, total_pages: 0 },
    });

    await listVLMOMovimentacoes({
      cnpj: "33000167000101",
      tipo_cargo: "Diretor",
      tipo_movimentacao: "Compra",
      is_position_snapshot: false,
      year: 2026,
      page: 2,
      page_size: 25,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8001/api/v1/admin/cvm/vlmo/movimentacoes?cnpj=33000167000101&tipo_cargo=Diretor&tipo_movimentacao=Compra&is_position_snapshot=false&year=2026&page=2&page_size=25",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("builds by-company URL with optional snapshot filter", async () => {
    const fetchMock = mockOk({
      items: [],
      pagination: { page: 1, page_size: 50, total: 0, total_pages: 0 },
    });

    await listVLMOByCompany(9512, { is_position_snapshot: false, page: 1, page_size: 100 });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8001/api/v1/admin/cvm/vlmo/by-company/9512?is_position_snapshot=false&page=1&page_size=100",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("builds aggregates URL with year filter", async () => {
    const fetchMock = mockOk({});

    await getVLMOAggregates(9512, { year: 2026 });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8001/api/v1/admin/cvm/vlmo/aggregates/9512?year=2026",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("hits sync-status endpoint", async () => {
    const fetchMock = mockOk({});

    await getVLMOSyncStatus();

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8001/api/v1/admin/cvm/vlmo/sync-status",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("POSTs sync trigger with year + force", async () => {
    const fetchMock = mockOk({ task_id: "task-vlmo-1", status: "queued" });

    await triggerVLMOSync({ year: 2026, force: true });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8001/api/v1/admin/cvm/vlmo/sync?year=2026&force=true",
      expect.objectContaining({ method: "POST", credentials: "include" }),
    );
  });
});
