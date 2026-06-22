import {
  createSector,
  createSubsector,
  deleteSector,
  deleteSubsector,
  listSectors,
  reassignCompany,
  updateSector,
  updateSubsector,
} from "@/lib/services/admin/sectors";
import { setAccessToken } from "@/lib/services/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const BASE = "http://localhost:8001/api/v1";

function jsonOk(body: unknown, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status < 400,
    status,
    json: async () => body,
  });
}

describe("sectors service", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setAccessToken("test-token");
  });

  afterEach(() => {
    setAccessToken(null);
  });

  it("lists sectors at /admin/sectors", async () => {
    const fetchMock = jsonOk([]);
    vi.stubGlobal("fetch", fetchMock);

    await listSectors();

    expect(fetchMock).toHaveBeenCalledWith(`${BASE}/admin/sectors`, expect.any(Object));
  });

  it("creates a sector with a JSON body", async () => {
    const fetchMock = jsonOk({ id: "s1", name: "Energia", slug: "energia", created_at: "x" });
    vi.stubGlobal("fetch", fetchMock);

    await createSector({ name: "Energia" });

    const [, init] = fetchMock.mock.calls[0]!;
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({ name: "Energia" });
  });

  it("patches a sector by id", async () => {
    const fetchMock = jsonOk({ id: "s1", name: "X", slug: "x", created_at: "x" });
    vi.stubGlobal("fetch", fetchMock);

    await updateSector("s1", { name: "X" });

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe(`${BASE}/admin/sectors/s1`);
    expect(init.method).toBe("PATCH");
  });

  it("deletes a sector and returns undefined on 204", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 204 });
    vi.stubGlobal("fetch", fetchMock);

    const result = await deleteSector("s1");

    expect(result).toBeUndefined();
    expect(fetchMock.mock.calls[0]![1].method).toBe("DELETE");
  });

  it("surfaces the 409 detail when a sector delete is blocked", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({
        detail: "Setor não pode ser removido: há dependências apontando para ele.",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(deleteSector("s1")).rejects.toThrow(/dependências apontando/);
  });

  it("creates a subsector nested under a sector", async () => {
    const fetchMock = jsonOk({});
    vi.stubGlobal("fetch", fetchMock);

    await createSubsector("s1", { name: "E&P" });

    expect(fetchMock.mock.calls[0]![0]).toBe(`${BASE}/admin/sectors/s1/subsectors`);
  });

  it("updates and deletes a subsector under the parent sector path", async () => {
    const patchMock = jsonOk({});
    vi.stubGlobal("fetch", patchMock);
    await updateSubsector("s1", "sub1", { name: "Refino" });
    expect(patchMock.mock.calls[0]![0]).toBe(`${BASE}/admin/sectors/s1/subsectors/sub1`);

    const delMock = vi.fn().mockResolvedValue({ ok: true, status: 204 });
    vi.stubGlobal("fetch", delMock);
    await deleteSubsector("s1", "sub1");
    expect(delMock.mock.calls[0]![0]).toBe(`${BASE}/admin/sectors/s1/subsectors/sub1`);
    expect(delMock.mock.calls[0]![1].method).toBe("DELETE");
  });

  it("reassigns a company hitting the assignment endpoint", async () => {
    const fetchMock = jsonOk({});
    vi.stubGlobal("fetch", fetchMock);

    await reassignCompany("c1", { sector_id: "s2", subsector_id: "sub2" });

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe(`${BASE}/admin/sectors/companies/c1/assignment`);
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(init.body as string)).toEqual({ sector_id: "s2", subsector_id: "sub2" });
  });

  it("serializes subsector_id: null explicitly to clear the subsector", async () => {
    const fetchMock = jsonOk({});
    vi.stubGlobal("fetch", fetchMock);

    await reassignCompany("c1", { sector_id: "s2", subsector_id: null });

    const body = JSON.parse(fetchMock.mock.calls[0]![1].body as string);
    // chave PRESENTE com null => backend limpa o subsetor (model_fields_set).
    expect(body).toHaveProperty("subsector_id", null);
    expect(body.subsector_id).toBeNull();
  });

  it("omits subsector_id when keeping the current subsector", async () => {
    const fetchMock = jsonOk({});
    vi.stubGlobal("fetch", fetchMock);

    await reassignCompany("c1", { sector_id: "s2" });

    const body = JSON.parse(fetchMock.mock.calls[0]![1].body as string);
    // chave AUSENTE => backend mantem o subsetor atual.
    expect(body).not.toHaveProperty("subsector_id");
  });
});
