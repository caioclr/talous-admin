import {
  listAdminCompanies,
  listSnapshots,
  setTickerActive,
  triggerRegistrySync,
} from "@/lib/services/admin/cvm-registry";
import { setAccessToken } from "@/lib/services/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("cvm-registry service", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setAccessToken("test-token");
  });

  afterEach(() => {
    setAccessToken(null);
  });

  it("builds the companies list URL with params", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        items: [],
        pagination: {
          page: 2,
          page_size: 20,
          total: 0,
          total_pages: 0,
        },
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    await listAdminCompanies({
      page: 2,
      page_size: 20,
      search: "PETR",
      situation: "ATIVO",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8001/api/v1/admin/cvm/companies?page=2&page_size=20&search=PETR&situation=ATIVO",
      expect.objectContaining({
        credentials: "include",
        headers: expect.any(Headers),
      }),
    );

    const headers = fetchMock.mock.calls[0]?.[1]?.headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer test-token");
  });

  it("forwards b3_only on the companies list (S08 T02)", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        items: [],
        pagination: { page: 1, page_size: 20, total: 0, total_pages: 0 },
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    await listAdminCompanies({ page: 1, page_size: 20, search: "PETR4", b3_only: true });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8001/api/v1/admin/cvm/companies?page=1&page_size=20&search=PETR4&b3_only=true",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("forwards validation_status on the snapshots list (S02 T04)", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        items: [],
        pagination: { page: 1, page_size: 20, total: 0, total_pages: 0 },
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    await listSnapshots({ page: 1, page_size: 20, cd_cvm: 9512, validation_status: "pending" });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8001/api/v1/admin/cvm/registry/snapshots?page=1&page_size=20&cd_cvm=9512&validation_status=pending",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("sends PATCH with is_active body to toggle a ticker (delisting manual)", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        ticker: "PETR3",
        is_active: false,
        is_primary: false,
        delisted_at: "2026-07-26T12:00:00Z",
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await setTickerActive(9512, "PETR3", false);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8001/api/v1/admin/cvm/companies/9512/tickers/PETR3",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ is_active: false }),
        credentials: "include",
      }),
    );
    expect(result).toEqual({
      ticker: "PETR3",
      is_active: false,
      is_primary: false,
      delisted_at: "2026-07-26T12:00:00Z",
    });
  });

  it("sends POST for registry sync trigger", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ task_id: "abc", status: "queued" }),
    });

    vi.stubGlobal("fetch", fetchMock);

    await triggerRegistrySync(true);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8001/api/v1/admin/cvm/registry/sync?force=true",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
      }),
    );
  });
});
