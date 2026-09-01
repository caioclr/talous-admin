import { describe, expect, it } from "vitest";

import { buildGroups, nomesRepetidos } from "./use-sector-companies";
import type {
  AdminCompanySummary,
  SectorWithSubsectorsResponse,
  SubsectorResponse,
} from "@/lib/services/admin/types";

function sub(over: Partial<SubsectorResponse> & { id: string; slug: string }): SubsectorResponse {
  return {
    sector_id: "sec",
    name: over.slug,
    company_count: 0,
    created_at: "",
    updated_at: "",
    ...over,
  } as SubsectorResponse;
}

function empresa(
  over: Partial<AdminCompanySummary> & { id: string },
): AdminCompanySummary {
  return {
    cd_cvm: null,
    name: over.id,
    cnpj: null,
    sector_slug: "bancos",
    sector_name: "Bancos",
    subsector_slug: null,
    subsector_name: null,
    cvm_situation: null,
    cvm_category: null,
    cvm_market_type: null,
    is_active: true,
    primary_ticker: null,
    tickers: [],
    cvm_last_synced_at: null,
    ...over,
  } as AdminCompanySummary;
}

function setor(
  over: Partial<SectorWithSubsectorsResponse> = {},
): SectorWithSubsectorsResponse {
  return {
    id: "sec",
    name: "Bancos",
    slug: "bancos",
    company_count: 0,
    created_at: "",
    subsectors: [],
    ...over,
  };
}

describe("buildGroups", () => {
  it("agrupa as empresas pelo subsetor delas", () => {
    const s = setor({
      company_count: 3,
      subsectors: [
        sub({ id: "a", slug: "inter", name: "Intermediários", company_count: 2 }),
        sub({ id: "b", slug: "seguros", name: "Seguros", company_count: 1 }),
      ],
    });
    const grupos = buildGroups(s, [
      empresa({ id: "1", subsector_slug: "inter" }),
      empresa({ id: "2", subsector_slug: "inter" }),
      empresa({ id: "3", subsector_slug: "seguros" }),
    ]);
    expect(grupos.map((g) => g.key)).toEqual(["a", "b"]);
    expect(grupos[0].companies).toHaveLength(2);
  });

  it("cria o nó '(sem subsetor)' — o caminho para as 98 da base", () => {
    const s = setor({
      company_count: 3,
      unassigned_company_count: 2,
      subsectors: [sub({ id: "a", slug: "inter", company_count: 1 })],
    });
    const grupos = buildGroups(s, [
      empresa({ id: "1", subsector_slug: "inter" }),
      empresa({ id: "2" }),
      empresa({ id: "3" }),
    ]);
    const semSub = grupos.find((g) => g.kind === "unassigned");
    expect(semSub).toBeDefined();
    expect(semSub!.expectedCount).toBe(2);
    expect(semSub!.companies.map((c) => c.id)).toEqual(["2", "3"]);
  });

  it("o nó '(sem subsetor)' não aparece em setor já organizado", () => {
    const s = setor({
      company_count: 1,
      unassigned_company_count: 0,
      subsectors: [sub({ id: "a", slug: "inter", company_count: 1 })],
    });
    const grupos = buildGroups(s, [empresa({ id: "1", subsector_slug: "inter" })]);
    expect(grupos.every((g) => g.kind === "subsector")).toBe(true);
  });

  it("deduz o 'sem subsetor' por subtração quando o backend é antigo", () => {
    // Retrocompatibilidade: `unassigned_company_count` é opcional no tipo.
    const s = setor({
      company_count: 5,
      subsectors: [sub({ id: "a", slug: "inter", company_count: 3 })],
    });
    const grupos = buildGroups(s, []);
    expect(grupos.find((g) => g.kind === "unassigned")?.expectedCount).toBe(2);
  });

  it("expectedCount vem do backend, não do tamanho do array", () => {
    // Página truncada: o backend diz 30, chegaram 2. A linha mostra os dois em
    // vez de deduzir a contagem do que coube.
    const s = setor({
      company_count: 30,
      subsectors: [sub({ id: "a", slug: "inter", company_count: 30 })],
    });
    const grupos = buildGroups(s, [
      empresa({ id: "1", subsector_slug: "inter" }),
      empresa({ id: "2", subsector_slug: "inter" }),
    ]);
    expect(grupos[0].expectedCount).toBe(30);
    expect(grupos[0].companies).toHaveLength(2);
  });
});

describe("nomesRepetidos", () => {
  it("acha o nome de subsetor usado em mais de um setor", () => {
    // Medido: 25 nomes repetidos. É sintoma do mesmo mecanismo que pôs
    // "Embalagens" dentro de "Bancos", e a lista plana escondia.
    const a = setor({ id: "1", subsectors: [sub({ id: "x", slug: "emb", name: "Embalagens" })] });
    const b = setor({
      id: "2",
      slug: "materiais",
      subsectors: [
        sub({ id: "y", slug: "emb", name: "Embalagens" }),
        sub({ id: "z", slug: "papel", name: "Papel" }),
      ],
    });
    const repetidos = nomesRepetidos([a, b]);
    expect(repetidos.get("Embalagens")).toBe(2);
    expect(repetidos.has("Papel")).toBe(false);
  });
});
