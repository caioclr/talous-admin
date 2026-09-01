import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getCuratedFieldsCatalog,
  listCuratedFields,
  publishCuratedField,
  unpublishCuratedField,
  upsertCuratedField,
} from "./curated-fields";

/**
 * O lock do contrato: publicar e um PUT/POST separado do salvar, e o periodo vai
 * na query string. Errar isso publicaria o campo errado, ou nao publicaria nada.
 */

const CO = "11111111-1111-1111-1111-111111111111";

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn(async () =>
    new Response(JSON.stringify({}), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  );
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function chamada() {
  const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
  return { url: String(url), method: init?.method ?? "GET", body: init?.body };
}

describe("servico de campos curados", () => {
  it("o catalogo e um GET", async () => {
    await getCuratedFieldsCatalog();
    const c = chamada();
    expect(c.url).toContain("/admin/curated-fields/catalog");
    expect(c.method).toBe("GET");
  });

  it("lista por empresa", async () => {
    await listCuratedFields(CO);
    expect(chamada().url).toContain(`/admin/curated-fields/companies/${CO}`);
  });

  it("salvar e PUT no campo, com o corpo", async () => {
    await upsertCuratedField(CO, "gmv", {
      period: "2T26",
      value_num: 10_500_000_000,
      source_kind: "release",
      source_release_id: "aaaa",
    });
    const c = chamada();
    expect(c.method).toBe("PUT");
    expect(c.url).toContain(`/companies/${CO}/gmv`);
    expect(JSON.parse(String(c.body))).toMatchObject({
      period: "2T26",
      value_num: 10_500_000_000,
      source_kind: "release",
      source_release_id: "aaaa",
    });
  });

  it("publicar e POST separado — nao vem junto com o salvar", async () => {
    await publishCuratedField(CO, "business_summary");
    const c = chamada();
    expect(c.method).toBe("POST");
    expect(c.url).toContain("/business_summary/publish");
    expect(c.url).not.toContain("period=");
  });

  it("publicar campo com periodo leva o periodo na query", async () => {
    // Sem isso, publicar o GMV do 2T26 poderia publicar o do 1T26.
    await publishCuratedField(CO, "gmv", "2T26");
    expect(chamada().url).toContain("period=2T26");
  });

  it("despublicar e DELETE no mesmo caminho", async () => {
    await unpublishCuratedField(CO, "gmv", "2T26");
    const c = chamada();
    expect(c.method).toBe("DELETE");
    expect(c.url).toContain("/gmv/publish?period=2T26");
  });

  it("periodo com caractere especial e codificado", async () => {
    await publishCuratedField(CO, "gmv", "1T26 e 2T26");
    expect(chamada().url).toContain("period=1T26%20e%202T26");
  });
});
