import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  formatQuotaDay,
  getProviderQuota,
  groupProviderQuota,
  parseProviderQuotaCheckedAt,
  quotaLevel,
  quotaRatio,
  quotaRemaining,
  todayQuotaDay,
} from "@/lib/services/admin/ops-provider-quota";
import type { ProviderQuotaDay } from "@/lib/services/admin/types";
import { setAccessToken } from "@/lib/services/client";

function row(over: Partial<ProviderQuotaDay> = {}): ProviderQuotaDay {
  return {
    provider: "bolsai",
    day: "2026-10-05",
    tier: "pro",
    used: 616,
    daily_limit: 10000,
    checked_at: "2026-10-05T12:55:00",
    ...over,
  };
}

describe("ops-provider-quota service", () => {
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

  it("hits the provider-quota endpoint under /admin/ops (not /admin/cvm)", async () => {
    const fetchMock = mockOk({ days: [] });

    await getProviderQuota();

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8001/api/v1/admin/ops/provider-quota",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("forwards days as a query param", async () => {
    const fetchMock = mockOk({ days: [row()] });

    const response = await getProviderQuota({ days: 30 });

    expect(fetchMock.mock.calls[0][0]).toBe(
      "http://localhost:8001/api/v1/admin/ops/provider-quota?days=30",
    );
    expect(response.days[0].used).toBe(616);
  });
});

describe("quota thresholds", () => {
  it("computes the consumed ratio and remaining against the daily limit", () => {
    expect(quotaRatio(616, 10000)).toBeCloseTo(0.0616);
    expect(quotaRemaining(616, 10000)).toBe(9384);
    expect(quotaRemaining(10200, 10000)).toBe(-200);
  });

  it("has no ratio nor remaining without a daily limit", () => {
    expect(quotaRatio(616, null)).toBeNull();
    expect(quotaRatio(616, 0)).toBeNull();
    expect(quotaRemaining(616, null)).toBeNull();
    expect(quotaLevel(null)).toBe("unknown");
  });

  it("warns at 80% and flags danger at 95% (inclusive)", () => {
    expect(quotaLevel(0.7999)).toBe("ok");
    expect(quotaLevel(0.8)).toBe("warning");
    expect(quotaLevel(0.9499)).toBe("warning");
    expect(quotaLevel(0.95)).toBe("danger");
    expect(quotaLevel(1.2)).toBe("danger");
  });
});

describe("quota dates", () => {
  it("reads the zone-less checked_at as UTC", () => {
    expect(parseProviderQuotaCheckedAt("2026-10-05T12:55:00").toISOString()).toBe(
      "2026-10-05T12:55:00.000Z",
    );
    // Se o backend passar a mandar o fuso, ele e respeitado.
    expect(parseProviderQuotaCheckedAt("2026-10-05T12:55:00-03:00").toISOString()).toBe(
      "2026-10-05T15:55:00.000Z",
    );
    expect(parseProviderQuotaCheckedAt("2026-10-05T12:55:00Z").toISOString()).toBe(
      "2026-10-05T12:55:00.000Z",
    );
  });

  it("formats the day string without shifting it through the timezone", () => {
    expect(formatQuotaDay("2026-10-05")).toBe("05/10/2026");
    expect(formatQuotaDay("2026-10-05", { short: true })).toBe("05/10");
  });

  it("derives today in Sao Paulo, not in UTC", () => {
    // 02:30 UTC de 06/10 ainda e 05/10 em Sao Paulo (UTC-3).
    // A cota vira a meia-noite UTC: 21:30 em Brasilia de 05/10 ja e o dia 06.
    expect(todayQuotaDay(new Date("2026-10-06T00:30:00Z"))).toBe("2026-10-06");
    expect(todayQuotaDay(new Date("2026-10-05T23:30:00Z"))).toBe("2026-10-05");
  });
});

describe("groupProviderQuota", () => {
  it("groups rows per provider with the most recent day as latest", () => {
    const series = groupProviderQuota([
      row({ day: "2026-10-05", used: 616 }),
      row({ provider: "outro", day: "2026-10-05", used: 10 }),
      row({ day: "2026-10-04", used: 9100 }),
    ]);

    expect(series.map((item) => item.provider)).toEqual(["bolsai", "outro"]);
    expect(series[0].latest.used).toBe(616);
    expect(series[0].days.map((item) => item.day)).toEqual(["2026-10-05", "2026-10-04"]);
  });

  it("returns no series for an empty response", () => {
    expect(groupProviderQuota([])).toEqual([]);
  });
});
