import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  listIPEByCompany,
  listIPEDisclosures,
  triggerIPESync,
} from "@/lib/services/admin/cvm-ipe";
import { setAccessToken } from "@/lib/services/client";

describe("cvm-ipe service", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setAccessToken("test-token");
  });

  afterEach(() => {
    setAccessToken(null);
  });

  it("builds disclosures list URL with filters", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        items: [],
        pagination: {
          page: 1,
          page_size: 20,
          total: 0,
          total_pages: 0,
        },
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    await listIPEDisclosures({
      page: 1,
      page_size: 20,
      cd_cvm: 9512,
      signal: "material_fact",
      notified: false,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8001/api/v1/admin/cvm/ipe/disclosures?page=1&page_size=20&cd_cvm=9512&signal=material_fact&notified=false",
      expect.objectContaining({
        credentials: "include",
        headers: expect.any(Headers),
      }),
    );
  });

  it("builds by-company URL", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        items: [],
        pagination: {
          page: 1,
          page_size: 5,
          total: 0,
          total_pages: 0,
        },
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    await listIPEByCompany(9512, {
      categoria: "Fato Relevante",
      page: 1,
      page_size: 5,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8001/api/v1/admin/cvm/ipe/disclosures/by-company/9512?categoria=Fato+Relevante&page=1&page_size=5",
      expect.objectContaining({
        credentials: "include",
      }),
    );
  });

  it("sends POST for IPE sync trigger", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ task_id: "task-123", status: "queued" }),
    });

    vi.stubGlobal("fetch", fetchMock);

    await triggerIPESync(2026);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8001/api/v1/admin/cvm/ipe/sync?year=2026",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
      }),
    );
  });
});
