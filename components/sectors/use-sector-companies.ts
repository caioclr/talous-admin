"use client";

import { useQuery } from "@tanstack/react-query";

import { listAdminCompanies } from "@/lib/services/admin/cvm-registry";
import type {
  AdminCompanySummary,
  SectorWithSubsectorsResponse,
  SubsectorResponse,
} from "@/lib/services/admin/types";

/**
 * Carregamento das empresas de um setor, e o agrupamento por subsetor.
 *
 * ## A fronteira de carregamento e o SETOR, nao o subsetor
 *
 * E a decisao central desta tela, e ela contorna um defeito de contrato:
 * `subsector_slugs` em `GET /admin/cvm/companies` filtra por
 * `Subsector.slug.in_(...)` SEM escopo de setor, e a unicidade e
 * `(sector_id, slug)`. Com 25 nomes de subsetor repetidos entre setores, pedir o
 * no "Embalagens" de Bancos traria tambem as de "Embalagens" de Materiais
 * Basicos.
 *
 * Carregar por setor e agrupar no cliente mata a colisao, dispensa parametro
 * novo no backend, resolve o no "(sem subsetor)" de graca, e limita as
 * requisicoes a no maximo uma por setor expandido.
 *
 * ## Duas chamadas deliberadamente SEM filtro
 *
 * Sem `b3_only`: e o que faz a empresa sem ticker B3 aparecer e poder ser
 * reatribuida — uma das limitacoes do fluxo antigo, que buscava com
 * `b3_only: true` e escondia essas empresas.
 *
 * Sem `is_active`: e o que faz o numero de linhas fechar com o `company_count`
 * do cabecalho, que tambem conta tudo.
 */

/** O backend limita `page_size` a 200. Acima disso o no precisa paginar. */
export const PAGE_SIZE = 200;

export interface SectorTreeGroup {
  key: string;
  kind: "subsector" | "unassigned";
  label: string;
  subsector: SubsectorResponse | null;
  /**
   * Quantas empresas o BACKEND diz que existem aqui. Nunca deduzido do tamanho
   * do array: com pagina truncada os dois divergem, e a linha mostra os dois.
   */
  expectedCount: number;
  companies: AdminCompanySummary[];
}

export function sectorCompaniesKey(sectorSlug: string) {
  return ["admin", "sector-companies", sectorSlug] as const;
}

export function useSectorCompanies(sectorSlug: string | null, enabled: boolean) {
  return useQuery({
    queryKey: sectorCompaniesKey(sectorSlug ?? ""),
    queryFn: () =>
      listAdminCompanies({ sector_slugs: sectorSlug!, page: 1, page_size: PAGE_SIZE }),
    enabled: enabled && !!sectorSlug,
    staleTime: 30_000,
  });
}

/**
 * Agrupa as empresas do setor por subsetor, acrescentando o no "(sem subsetor)".
 *
 * O no sintetico existe SO aqui, na montagem da arvore. O backend devolve
 * `unassigned_company_count` como inteiro justamente para nao vazar um
 * `SubsectorResponse` falso para quem itera `subsectors` — inclusive o `<select>`
 * de reatribuicao, que ofereceria um destino com id inexistente.
 */
export function buildGroups(
  sector: SectorWithSubsectorsResponse,
  companies: AdminCompanySummary[],
): SectorTreeGroup[] {
  const porSlug = new Map<string, AdminCompanySummary[]>();
  const semSubsetor: AdminCompanySummary[] = [];
  for (const c of companies) {
    if (!c.subsector_slug) {
      semSubsetor.push(c);
      continue;
    }
    const atual = porSlug.get(c.subsector_slug) ?? [];
    atual.push(c);
    porSlug.set(c.subsector_slug, atual);
  }

  const grupos: SectorTreeGroup[] = sector.subsectors.map((sub) => ({
    key: sub.id,
    kind: "subsector" as const,
    label: sub.name,
    subsector: sub,
    expectedCount: sub.company_count,
    companies: porSlug.get(sub.slug) ?? [],
  }));

  // O nó "(sem subsetor)" só aparece quando há alguém nele. Um nó vazio
  // permanente seria ruído em todo setor já organizado.
  const esperadoSemSubsetor =
    sector.unassigned_company_count ??
    Math.max(0, sector.company_count - sector.subsectors.reduce((a, s) => a + s.company_count, 0));
  if (esperadoSemSubsetor > 0 || semSubsetor.length > 0) {
    grupos.push({
      key: `${sector.id}:unassigned`,
      kind: "unassigned",
      label: "(sem subsetor)",
      subsector: null,
      expectedCount: esperadoSemSubsetor,
      companies: semSubsetor,
    });
  }
  return grupos;
}

/**
 * Nomes de subsetor que se repetem em setores diferentes.
 *
 * Medido em 2026-08-31: 25 nomes repetidos. A lista plana escondia isso; a
 * arvore mostra, porque e sintoma do mesmo mecanismo que pos "Embalagens" dentro
 * de "Bancos".
 */
export function nomesRepetidos(sectors: SectorWithSubsectorsResponse[]): Map<string, number> {
  const contagem = new Map<string, number>();
  for (const s of sectors) {
    for (const sub of s.subsectors) {
      contagem.set(sub.name, (contagem.get(sub.name) ?? 0) + 1);
    }
  }
  return new Map([...contagem].filter(([, n]) => n > 1));
}
