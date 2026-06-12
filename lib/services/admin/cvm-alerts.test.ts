import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getAlertsSummary,
  listOperationalAlerts,
} from "@/lib/services/admin/cvm-alerts";
import { setAccessToken } from "@/lib/services/client";

describe("cvm-alerts service", () => {
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

  it("builds alerts URL with full filter set", async () => {
    const fetchMock = mockOk({
      items: [],
      pagination: { page: 1, page_size: 50, total: 0, total_pages: 0 },
    });

    await listOperationalAlerts({
      severity: "alta",
      alert_type: "fre_stale",
      cd_cvm: 9512,
      page: 2,
      page_size: 25,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8001/api/v1/admin/cvm/alerts?severity=alta&alert_type=fre_stale&cd_cvm=9512&page=2&page_size=25",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("builds alerts URL without filters when params are empty", async () => {
    const fetchMock = mockOk({
      items: [],
      pagination: { page: 1, page_size: 50, total: 0, total_pages: 0 },
    });

    await listOperationalAlerts();

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8001/api/v1/admin/cvm/alerts",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("hits summary endpoint", async () => {
    const fetchMock = mockOk({ total: 0, by_severity: {}, by_type: {} });

    await getAlertsSummary();

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8001/api/v1/admin/cvm/alerts/summary",
      expect.objectContaining({ credentials: "include" }),
    );
  });
});
