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

  it("aceita report_type=capital com ref UUID do snapshot (S02 T02)", async () => {
    const fetchMock = mockOk({
      report_type: "capital",
      ref: "cccc1111-1111-1111-1111-111111111111",
      cd_cvm: 9512,
      validation: { status: "valid", validated_by: null, validated_at: null },
    });

    await validateReport("capital", "cccc1111-1111-1111-1111-111111111111");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://localhost:8001/api/v1/admin/cvm/validations/validate");
    expect(JSON.parse(init.body as string)).toEqual({
      report_type: "capital",
      ref: "cccc1111-1111-1111-1111-111111111111",
    });
  });

  it("aceita report_type=buyback com ref id_programa (S02 T02)", async () => {
    const fetchMock = mockOk({
      report_type: "buyback",
      ref: "PETR-2026-01",
      cd_cvm: 9512,
      validation: { status: "pending", validated_by: null, validated_at: null },
    });

    await invalidateReport("buyback", "PETR-2026-01");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://localhost:8001/api/v1/admin/cvm/validations/invalidate");
    expect(JSON.parse(init.body as string)).toEqual({
      report_type: "buyback",
      ref: "PETR-2026-01",
    });
  });

  it("aceita report_type=registry com ref UUID do snapshot cadastral (S02 T04)", async () => {
    const fetchMock = mockOk({
      report_type: "registry",
      ref: "5e9b1111-0000-4000-8000-000000000001",
      cd_cvm: 9512,
      validation: { status: "valid", validated_by: null, validated_at: null },
    });

    await validateReport("registry", "5e9b1111-0000-4000-8000-000000000001");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://localhost:8001/api/v1/admin/cvm/validations/validate");
    expect(JSON.parse(init.body as string)).toEqual({
      report_type: "registry",
      ref: "5e9b1111-0000-4000-8000-000000000001",
    });
  });

  it.each([
    "participante_auditor",
    "participante_intermediario",
    "participante_adm_carteira",
  ] as const)("aceita report_type=%s com ref UUID do registro (S02 T04)", async (reportType) => {
    const fetchMock = mockOk({
      report_type: reportType,
      ref: "aaaa1111-aaaa-1111-aaaa-111111111111",
      cd_cvm: null,
      validation: { status: "valid", validated_by: null, validated_at: null },
    });

    await validateReport(reportType, "aaaa1111-aaaa-1111-aaaa-111111111111");

    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body as string)).toEqual({
      report_type: reportType,
      ref: "aaaa1111-aaaa-1111-aaaa-111111111111",
    });
  });
});
