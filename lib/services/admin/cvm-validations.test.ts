import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  invalidateReport,
  validateReport,
} from "@/lib/services/admin/cvm-validations";
import { setAccessToken } from "@/lib/services/client";

describe("cvm-validations service (API generica T01)", () => {
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

  it("POSTs { report_type, ref } no body ao validar (usa body, nao data)", async () => {
    const fetchMock = mockOk({ status: "valid", validated_by: null, validated_at: null });

    await validateReport("fre", "FRE-PETR-2025");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://localhost:8001/api/v1/admin/cvm/validations/validate");
    expect(init.method).toBe("POST");
    expect(init.credentials).toBe("include");
    expect(JSON.parse(init.body as string)).toEqual({
      report_type: "fre",
      ref: "FRE-PETR-2025",
    });
    expect((init.headers as Headers).get("Content-Type")).toBe("application/json");
  });

  it("POSTs { report_type, ref } no body ao reverter", async () => {
    const fetchMock = mockOk({ status: "pending", validated_by: null, validated_at: null });

    await invalidateReport("fca", "778899");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://localhost:8001/api/v1/admin/cvm/validations/invalidate");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      report_type: "fca",
      ref: "778899",
    });
  });

  it("propaga report_type para outros tipos (icbgc) sem reescrita", async () => {
    const fetchMock = mockOk({ status: "valid", validated_by: null, validated_at: null });

    await validateReport("icbgc", "123456");

    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body as string)).toEqual({
      report_type: "icbgc",
      ref: "123456",
    });
  });
});
