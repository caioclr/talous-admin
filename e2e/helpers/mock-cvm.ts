import type { Page, Route } from "@playwright/test";

async function fulfillJson(route: Route, status: number, body: unknown) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

interface CapturedRequest {
  method: string;
  url: string;
  query: Record<string, string>;
  body: unknown;
}

function recordRequest(route: Route, sink: CapturedRequest[]) {
  const request = route.request();
  const url = new URL(request.url());
  let parsedBody: unknown = null;
  const raw = request.postData();
  if (raw) {
    try {
      parsedBody = JSON.parse(raw);
    } catch {
      parsedBody = raw;
    }
  }
  sink.push({
    method: request.method(),
    url: request.url(),
    query: Object.fromEntries(url.searchParams),
    body: parsedBody,
  });
}

export function mockGet(page: Page, urlPattern: RegExp, body: unknown) {
  const captured: CapturedRequest[] = [];
  void page.route(urlPattern, async (route) => {
    if (route.request().method() !== "GET") {
      await route.fallback();
      return;
    }
    recordRequest(route, captured);
    await fulfillJson(route, 200, body);
  });
  return captured;
}

interface MockMethodOptions {
  status?: number;
  body?: unknown;
}

export function mockMethod(
  page: Page,
  method: "POST" | "PATCH" | "DELETE",
  urlPattern: RegExp,
  options: MockMethodOptions = {},
) {
  const captured: CapturedRequest[] = [];
  void page.route(urlPattern, async (route) => {
    if (route.request().method() !== method) {
      await route.fallback();
      return;
    }
    recordRequest(route, captured);
    const status = options.status ?? (method === "DELETE" ? 204 : 200);
    if (status === 204) {
      await route.fulfill({ status: 204, body: "" });
      return;
    }
    await fulfillJson(route, status, options.body ?? {});
  });
  return captured;
}

/**
 * Stricter URL patterns for CVM admin endpoints. Use these with `mockGet`
 * / `mockMethod` so that overlapping routes (e.g. /companies vs
 * /companies/9512) don't collide.
 */
export const CvmRoutes = {
  dashboard: /\/api\/v1\/admin\/cvm\/dashboard$/,
  syncStatus: /\/api\/v1\/admin\/cvm\/registry\/sync-status$/,
  triggerSync: /\/api\/v1\/admin\/cvm\/registry\/sync(\?.*)?$/,
  snapshotsList: /\/api\/v1\/admin\/cvm\/registry\/snapshots(\?.*)?$/,
  snapshotById: /\/api\/v1\/admin\/cvm\/registry\/snapshots\/[0-9a-fA-F-]+$/,
  companiesList: /\/api\/v1\/admin\/cvm\/companies(\?.*)?$/,
  companyDetail: /\/api\/v1\/admin\/cvm\/companies\/\d+$/,
  companyHistory: /\/api\/v1\/admin\/cvm\/companies\/\d+\/history$/,
  companyChanges: /\/api\/v1\/admin\/cvm\/companies\/\d+\/changes$/,
  sectorMappingList: /\/api\/v1\/admin\/cvm\/sector-mapping(\?.*)?$/,
  sectorMappingUnmapped: /\/api\/v1\/admin\/cvm\/sector-mapping\/unmapped$/,
  sectorMappingItem: /\/api\/v1\/admin\/cvm\/sector-mapping\/[^/?]+$/,
  ipeByCompany: /\/api\/v1\/admin\/cvm\/ipe\/disclosures\/by-company\/\d+(\?.*)?$/,
  ipeSyncStatus: /\/api\/v1\/admin\/cvm\/ipe\/sync-status$/,
  ipeSync: /\/api\/v1\/admin\/cvm\/ipe\/sync(\?.*)?$/,
  ipeCategories: /\/api\/v1\/admin\/cvm\/ipe\/categories(\?.*)?$/,
  ipeDisclosuresList: /\/api\/v1\/admin\/cvm\/ipe\/disclosures(\?.*)?$/,
  ipeDisclosureById: /\/api\/v1\/admin\/cvm\/ipe\/disclosures\/[^/?]+$/,
  itrDfpFilings: /\/api\/v1\/admin\/cvm\/itr-dfp\/filings(\?.*)?$/,
  itrDfpAccountLines: /\/api\/v1\/admin\/cvm\/itr-dfp\/account-lines\/\d+(\?.*)?$/,
  itrDfpValidate: /\/api\/v1\/admin\/cvm\/itr-dfp\/filings\/validate$/,
  itrDfpInvalidate: /\/api\/v1\/admin\/cvm\/itr-dfp\/filings\/invalidate$/,
  capitalCompositionSyncStatus: /\/api\/v1\/admin\/cvm\/capital-composition\/sync-status$/,
  capitalCompositionSync: /\/api\/v1\/admin\/cvm\/capital-composition\/sync(\?.*)?$/,
  capitalCompositionSnapshots: /\/api\/v1\/admin\/cvm\/capital-composition\/snapshots(\?.*)?$/,
  capitalCompositionSnapshotById: /\/api\/v1\/admin\/cvm\/capital-composition\/snapshots\/[0-9a-fA-F-]+$/,
  capitalCompositionByCompany: /\/api\/v1\/admin\/cvm\/capital-composition\/by-company\/\d+(\?.*)?$/,
  buybacksSyncStatus: /\/api\/v1\/admin\/cvm\/buybacks\/sync-status$/,
  buybacksSync: /\/api\/v1\/admin\/cvm\/buybacks\/sync(\?.*)?$/,
  buybacksActive: /\/api\/v1\/admin\/cvm\/buybacks\/active(\?.*)?$/,
  buybacksProgramsList: /\/api\/v1\/admin\/cvm\/buybacks\/programs(\?.*)?$/,
  buybacksProgramById: /\/api\/v1\/admin\/cvm\/buybacks\/programs\/[^/?]+$/,
  buybacksByCompany: /\/api\/v1\/admin\/cvm\/buybacks\/programs\/by-company\/\d+(\?.*)?$/,
  vlmoSyncStatus: /\/api\/v1\/admin\/cvm\/vlmo\/sync-status$/,
  vlmoSync: /\/api\/v1\/admin\/cvm\/vlmo\/sync(\?.*)?$/,
  vlmoFilingsList: /\/api\/v1\/admin\/cvm\/vlmo\/filings(\?.*)?$/,
  vlmoFilingById: /\/api\/v1\/admin\/cvm\/vlmo\/filings\/[^/?]+$/,
  vlmoMovimentacoes: /\/api\/v1\/admin\/cvm\/vlmo\/movimentacoes(\?.*)?$/,
  vlmoByCompany: /\/api\/v1\/admin\/cvm\/vlmo\/by-company\/\d+(\?.*)?$/,
  vlmoAggregates: /\/api\/v1\/admin\/cvm\/vlmo\/aggregates\/\d+(\?.*)?$/,
  validationsValidate: /\/api\/v1\/admin\/cvm\/validations\/validate$/,
  validationsInvalidate: /\/api\/v1\/admin\/cvm\/validations\/invalidate$/,
  freSyncStatus: /\/api\/v1\/admin\/cvm\/fre\/sync-status$/,
  freSync: /\/api\/v1\/admin\/cvm\/fre\/sync(\?.*)?$/,
  freFilingsList: /\/api\/v1\/admin\/cvm\/fre\/filings(\?.*)?$/,
  freFilingById: /\/api\/v1\/admin\/cvm\/fre\/filings\/[^/?]+$/,
  freByCompany: /\/api\/v1\/admin\/cvm\/fre\/by-company\/\d+(\?.*)?$/,
  fcaSyncStatus: /\/api\/v1\/admin\/cvm\/fca\/sync-status$/,
  fcaSync: /\/api\/v1\/admin\/cvm\/fca\/sync(\?.*)?$/,
  fcaDocumentosList: /\/api\/v1\/admin\/cvm\/fca\/documentos(\?.*)?$/,
  fcaDocumentoById: /\/api\/v1\/admin\/cvm\/fca\/documentos\/\d+$/,
  fcaByCompany: /\/api\/v1\/admin\/cvm\/fca\/by-company\/\d+(\?.*)?$/,
  icbgcSyncStatus: /\/api\/v1\/admin\/cvm\/icbgc\/sync-status$/,
  icbgcSync: /\/api\/v1\/admin\/cvm\/icbgc\/sync(\?.*)?$/,
  icbgcReportsList: /\/api\/v1\/admin\/cvm\/icbgc\/reports(\?.*)?$/,
  icbgcReportById: /\/api\/v1\/admin\/cvm\/icbgc\/reports\/\d+$/,
  icbgcByCompany: /\/api\/v1\/admin\/cvm\/icbgc\/by-company\/\d+(\?.*)?$/,
  participantesSyncStatus: /\/api\/v1\/admin\/cvm\/participantes\/sync-status$/,
  participantesSync: /\/api\/v1\/admin\/cvm\/participantes\/sync(\?.*)?$/,
  participantesAuditoresList: /\/api\/v1\/admin\/cvm\/participantes\/auditores(\?.*)?$/,
  participantesAuditorDetail: /\/api\/v1\/admin\/cvm\/participantes\/auditores\/\d+(\?.*)?$/,
  participantesIntermediariosList: /\/api\/v1\/admin\/cvm\/participantes\/intermediarios(\?.*)?$/,
  participantesIntermediarioDetail: /\/api\/v1\/admin\/cvm\/participantes\/intermediarios\/\d+$/,
  participantesAdmCarteiraList: /\/api\/v1\/admin\/cvm\/participantes\/adm-carteira(\?.*)?$/,
  alertsList: /\/api\/v1\/admin\/cvm\/alerts(\?.*)?$/,
  alertsSummary: /\/api\/v1\/admin\/cvm\/alerts\/summary$/,
  // S12 — Operacao / status do pipeline. Sob `/admin/ops`, NAO `/admin/cvm`.
  opsJobs: /\/api\/v1\/admin\/ops\/jobs(\?.*)?$/,
  // Taxonomia setor/subsetor (S10 T02) — sob `/admin/sectors`, NAO `/admin/cvm`.
  // Ordem importa: registre os mais especificos por ultimo (vencem o match).
  sectorsList: /\/api\/v1\/admin\/sectors$/,
  sectorItem: /\/api\/v1\/admin\/sectors\/[0-9a-fA-F-]+$/,
  subsectorsList: /\/api\/v1\/admin\/sectors\/[0-9a-fA-F-]+\/subsectors$/,
  subsectorItem: /\/api\/v1\/admin\/sectors\/[0-9a-fA-F-]+\/subsectors\/[0-9a-fA-F-]+$/,
  companyAssignment: /\/api\/v1\/admin\/sectors\/companies\/[0-9a-fA-F-]+\/assignment$/,
} as const;
