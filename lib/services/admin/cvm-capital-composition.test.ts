import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getCapitalCompositionSnapshot,
  getCapitalCompositionSyncStatus,
  listCapitalCompositionByCompany,
  listCapitalCompositionSnapshots,
  triggerCapitalCompositionSync,
} from "@/lib/services/admin/cvm-capital-composition";
import { setAccessToken } from "@/lib/services/client";

describe("cvm-capital-composition service", () => {
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

  it("builds list URL with filters", async () => {
    const fetchMock = mockOk({
      items: [],
      pagination: { page: 1, page_size: 50, total: 0, total_pages: 0 },
    });

    await listCapitalCompositionSnapshots({
      cd_cvm: 9512,
      source: "itr",
      period_type: "quarterly",
      page: 2,
      page_size: 25,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8001/api/v1/admin/cvm/capital-composition/snapshots?cd_cvm=9512&source=itr&period_type=quarterly&page=2&page_size=25",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("forwards validation_status filter (S02 T02)", async () => {
    const fetchMock = mockOk({
      items: [],
      pagination: { page: 1, page_size: 20, total: 0, total_pages: 0 },
    });

    await listCapitalCompositionSnapshots({
      validation_status: "pending",
      page: 1,
      page_size: 20,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8001/api/v1/admin/cvm/capital-composition/snapshots?validation_status=pending&page=1&page_size=20",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("builds detail URL using snapshot id", async () => {
    const fetchMock = mockOk({});

    await getCapitalCompositionSnapshot("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8001/api/v1/admin/cvm/capital-composition/snapshots/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("builds by-company URL with optional source filter", async () => {
    const fetchMock = mockOk({
      items: [],
      pagination: { page: 1, page_size: 50, total: 0, total_pages: 0 },
    });

    await listCapitalCompositionByCompany(9512, { source: "dfp", page_size: 100 });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8001/api/v1/admin/cvm/capital-composition/by-company/9512?source=dfp&page_size=100",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("hits sync-status endpoint", async () => {
    const fetchMock = mockOk({});

    await getCapitalCompositionSyncStatus();

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8001/api/v1/admin/cvm/capital-composition/sync-status",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("sends POST with source/year for sync trigger", async () => {
    const fetchMock = mockOk({ task_id: "task-1", status: "queued" });

    await triggerCapitalCompositionSync({ source: "itr", year: 2026, force: true });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8001/api/v1/admin/cvm/capital-composition/sync?source=itr&year=2026&force=true",
      expect.objectContaining({ method: "POST", credentials: "include" }),
    );
  });
});
