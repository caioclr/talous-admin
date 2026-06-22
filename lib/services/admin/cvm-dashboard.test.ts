import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DASHBOARD_TYPE_LABELS,
  dashboardTypeLabel,
  dashboardTypeRoute,
  getCVMDashboard,
} from "@/lib/services/admin/cvm-dashboard";
import { setAccessToken } from "@/lib/services/client";

describe("cvm-dashboard service", () => {
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

  it("hits the dashboard endpoint without params", async () => {
    const fetchMock = mockOk({ kpis: {}, by_type: [] });

    await getCVMDashboard();

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8001/api/v1/admin/cvm/dashboard",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("maps every backend report_type to a PT-BR label", () => {
    // Mesma taxonomia (e ordem) do backend: cvm_dashboard.DASHBOARD_REPORT_TYPES.
    const backendTypes = [
      "itr_dfp",
      "fre",
      "fca",
      "ipe",
      "buyback",
      "vlmo",
      "capital",
      "icbgc",
      "participantes",
    ];
    for (const type of backendTypes) {
      expect(DASHBOARD_TYPE_LABELS).toHaveProperty(type);
    }
    expect(Object.keys(DASHBOARD_TYPE_LABELS)).toHaveLength(backendTypes.length);
  });

  it("falls back to the raw report_type for unknown labels/routes", () => {
    expect(dashboardTypeLabel("desconhecido")).toBe("desconhecido");
    expect(dashboardTypeRoute("desconhecido")).toBeNull();
    expect(dashboardTypeRoute("fre")).toBe("/cvm/fre");
  });
});
