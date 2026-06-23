export interface PaginationMeta {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface AdminPagedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

export interface SyncStatusResponse {
  last_captured_at: string | null;
  last_file_hash: string | null;
  total_snapshots: number;
  situation_counts: Record<string, number>;
  unmapped_sectors_count: number;
}

export interface TriggerSyncResponse {
  task_id: string;
  status: string;
}

export interface CVMSnapshotSummary {
  id: string;
  captured_at: string;
  cd_cvm: number;
  denom_social: string;
  situacao: string;
  categoria_registro: string;
  tipo_mercado: string;
  file_version_hash: string;
  // S02 T04: selo de validacao por snapshot cadastral (API generica,
  // report_type="registry", ref=id UUID). Pode nao vir materializado na lista —
  // tratamos ausencia como pendente na UI (defensivo, igual aos demais tipos).
  validation?: ReportValidation | null;
}

export interface CVMSnapshotDetail extends CVMSnapshotSummary {
  cnpj_cia: string;
  denom_comercial: string | null;
  situacao_emissor: string | null;
  dt_ini_situacao: string | null;
  dt_ini_sit_emissor: string | null;
  dt_cancel: string | null;
  motivo_cancel: string | null;
  dt_ini_categoria: string | null;
  dt_registro: string | null;
  dt_constituicao: string | null;
  controle_acionario: string | null;
  setor_atividade: string | null;
  auditor: string | null;
  cnpj_auditor: string | null;
  addr_logradouro: string | null;
  addr_compl: string | null;
  addr_bairro: string | null;
  addr_municipio: string | null;
  addr_uf: string | null;
  addr_cep: string | null;
  addr_pais: string | null;
  addr_telefone: string | null;
  addr_email: string | null;
  addr_tipo: string | null;
  resp_nome: string | null;
  resp_tipo: string | null;
  resp_dt_inicio: string | null;
  resp_logradouro: string | null;
  resp_municipio: string | null;
  resp_uf: string | null;
  resp_cep: string | null;
  resp_email: string | null;
  raw_data: Record<string, unknown>;
  created_at: string;
}

export interface AdminCompanySummary {
  id: string;
  cd_cvm: number | null;
  name: string;
  cnpj: string | null;
  sector_slug: string | null;
  cvm_situation: string | null;
  cvm_category: string | null;
  cvm_market_type: string | null;
  is_active: boolean;
  primary_ticker: string | null;
  cvm_last_synced_at: string | null;
}

export interface AdminCompanyDetail extends AdminCompanySummary {
  cvm_situation_started_at: string | null;
  cvm_registration_date: string | null;
  cvm_constitution_date: string | null;
  cvm_cancellation_date: string | null;
  cvm_cancellation_reason: string | null;
  cvm_controlling_shareholder: string | null;
  cvm_setor_atividade: string | null;
  tickers: string[];
}

export interface RegistryChangeEventResponse {
  cd_cvm: number;
  field: string;
  old: unknown;
  new: unknown;
  captured_at: string;
}

export interface CVMSectorMappingRequest {
  cvm_setor_atividade: string;
  internal_sector_slug: string;
  notes?: string;
}

export interface CVMSectorMappingResponse {
  cvm_setor_atividade: string;
  internal_sector_id: string;
  internal_sector_slug: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface UnmappedSectorResponse {
  cvm_setor_atividade: string;
  company_count: number;
  sample_company_names: string[];
}

export interface ListCompaniesParams {
  situation?: string;
  category?: string;
  market_type?: string;
  sector_slug?: string;
  is_active?: boolean;
  // Termo unico de busca: backend faz OR entre nome (acento-insensivel),
  // CNPJ (substring), ticker e cd_cvm (match exato quando numerico).
  search?: string;
  // true retorna apenas empresas com >= 1 ticker B3. Backend default e false;
  // o admin envia explicitamente (tela inicia com b3_only=true).
  b3_only?: boolean;
  page?: number;
  page_size?: number;
}

export interface ListSnapshotsParams {
  cd_cvm?: number;
  captured_at_from?: string;
  captured_at_to?: string;
  // S02 T04: filtro de amostragem por status de validacao.
  validation_status?: ValidationStatus;
  page?: number;
  page_size?: number;
}

export interface IPEDisclosureSummary {
  id: string;
  cd_cvm: number;
  nome_companhia: string;
  categoria: string;
  assunto: string;
  data_entrega: string | null;
  data_referencia: string | null;
  protocolo_entrega: string;
  versao: number;
  tipo_apresentacao: string | null;
  signal_classification: string | null;
  notification_dispatched: boolean;
  // S02 T03: selo de validacao embutido por item (API generica, report_type="ipe").
  // O backend pode ainda nao materializar `validation` na lista — tratamos
  // ausencia como pendente na UI (defensivo, igual aos demais tipos).
  validation?: ReportValidation | null;
}

export interface IPEDisclosureDetail extends IPEDisclosureSummary {
  cnpj_cia: string;
  tipo: string | null;
  especie: string | null;
  link_download: string | null;
  captured_at: string;
  file_version_hash: string;
  processed_at: string | null;
  raw_data: Record<string, unknown>;
}

export interface IPECategoryCount {
  categoria: string;
  count: number;
}

export interface IPESyncStatusResponse {
  last_captured_at: string | null;
  total_disclosures: number;
  pending_notification_count: number;
  by_signal_classification: Record<string, number>;
  last_30_days_count: number;
}

export interface TriggerIPESyncResponse {
  task_id: string;
  status: string;
}

export interface ListIPEDisclosuresParams {
  cd_cvm?: number;
  categoria?: string;
  tipo_apresentacao?: string;
  delivered_at_from?: string;
  delivered_at_to?: string;
  signal?: string;
  notified?: boolean;
  search?: string;
  validation_status?: ValidationStatus;
  page?: number;
  page_size?: number;
}

// S15/S16: release de resultados (IPE) com texto extraido. Status de extracao
// e literal do backend (`ok` | `no_text` | `failed`) — a UI trata != "ok" como
// aviso (sem texto), nunca viewer vazio.
export type IPEReleaseExtractionStatus = "ok" | "no_text" | "failed";

export interface IPEReleaseSummary {
  id: string;
  ipe_disclosure_id: string;
  cd_cvm: number;
  company_id: string | null;
  reference_date: string | null;
  title: string;
  extraction_status: IPEReleaseExtractionStatus;
  char_count: number;
  extracted_at: string | null;
  // Primeiros ~300 chars (sem full_text). Pode ser null quando nao ha texto.
  excerpt: string | null;
}

export interface IPEReleaseDetail {
  id: string;
  ipe_disclosure_id: string;
  cd_cvm: number;
  company_id: string | null;
  reference_date: string | null;
  title: string;
  full_text: string | null;
  s3_key: string | null;
  char_count: number;
  extraction_status: IPEReleaseExtractionStatus;
  extracted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FilingSummary {
  cd_cvm: number;
  denom_cia: string;
  doc_type: string;
  reference_date: string;
  grupo_dfr: string;
  version: number;
  statement_types: string[];
  // S09 T02: o backend passou a embutir o bloco de validacao por filing na
  // listagem paginada (`AdminPagedResponse[FilingSummary]`). Mantemos defensivo
  // (pode vir ausente em respostas legadas) — a UI trata ausencia como pendente.
  validation?: FilingValidation | null;
}

export interface AccountLineResponse {
  id: string;
  cd_cvm: number;
  statement_type: string;
  grupo_dfr: string;
  ordem_exerc: string;
  version: number;
  reference_date: string;
  cd_conta: string;
  ds_conta: string;
  vl_conta: string | number;
  escala_moeda: string;
}

export interface AccountLinesTreeResponse {
  cd_cvm: number;
  statement_type: string;
  reference_date: string;
  grupo_dfr: string;
  items: AccountLineResponse[];
}

export interface FundamentalSourceValue {
  source: string;
  value: number | null;
}

export interface ReconciliationField {
  field: string;
  sources: FundamentalSourceValue[];
  max_divergence_pct: number | null;
}

export interface ReconciliationReport {
  cd_cvm: number;
  reference_date: string;
  period_type: string;
  fields: ReconciliationField[];
}

export interface TriggerITRDFPSyncResponse {
  task_id: string;
  status: string;
}

export interface ListFilingsParams {
  cd_cvm?: number;
  doc_type?: string;
  ref_date_from?: string;
  ref_date_to?: string;
  grupo_dfr?: string;
  // S09 T02: `limit` foi removido do backend; a listagem agora e paginada
  // (`page` >= 1 default 1, `page_size` 1..200 default 50).
  page?: number;
  page_size?: number;
}

// ----------------------------------------------------------------------------
// S01 — Moderacao CVM: validacao de filings ITR/DFP
//
// Shapes alinhados ao contrato do backend (T02). O status e metadado interno
// de moderacao (flag consultiva); nao toca cvm_account_lines nem o app final.
// ----------------------------------------------------------------------------

export type ValidationStatus = "pending" | "valid";

export interface ValidatedBy {
  id: string;
  name: string | null;
  email: string | null;
}

export interface FilingValidation {
  status: ValidationStatus;
  validated_by: ValidatedBy | null;
  validated_at: string | null;
}

/**
 * Filing com o bloco de validacao garantido (non-null). O backend embute
 * `validation` em cada item da listagem paginada (S09 T02); este tipo torna o
 * campo obrigatorio para os consumidores que renderizam selo/status sem guarda.
 */
export interface FilingSummaryWithValidation extends FilingSummary {
  validation: FilingValidation;
}

export interface ValidateFilingParams {
  cd_cvm: number;
  doc_type: string;
  reference_date: string;
  grupo_dfr: string;
  version: number;
}

export interface ListFilingsWithValidationParams extends ListFilingsParams {
  validation_status?: ValidationStatus;
}

// ----------------------------------------------------------------------------
// S02 — Validacao generica de relatorios CVM (contrato T01)
//
// API generica (substitui a abordagem bespoke do ITR/DFP para os novos tipos):
//   POST /admin/cvm/validations/validate    body { report_type, ref }
//   POST /admin/cvm/validations/invalidate  body { report_type, ref }
// `report_type` ∈ {fre, fca, icbgc}; `ref` = id_documento do tipo.
// O bloco `validation` (mesmo shape do ITR/DFP) passa a vir embutido em cada
// item das listagens FRE/FCA/ICBGC, e o filtro `validation_status` ja existe.
// ----------------------------------------------------------------------------

export type ReportType =
  | "fre"
  | "fca"
  | "icbgc"
  | "capital"
  | "buyback"
  | "vlmo"
  | "ipe"
  | "registry"
  | "participante_auditor"
  | "participante_intermediario"
  | "participante_adm_carteira";

/**
 * Bloco de validacao generico, reutilizado pelos tipos com id_documento.
 * Mesmo shape de `FilingValidation` (status + quem/quando) — mantido como tipo
 * separado para deixar explicito que e o contrato da API generica T01.
 */
export interface ReportValidation {
  status: ValidationStatus;
  validated_by: ValidatedBy | null;
  validated_at: string | null;
}

/** Corpo dos POST validate/invalidate da API generica. */
export interface ReportValidationParams {
  report_type: ReportType;
  ref: string;
}

/**
 * Resposta dos POST validate/invalidate. O backend devolve o bloco `validation`
 * atualizado (quem/quando) junto da identidade do relatorio. Util para refletir
 * o selo na hora, sem depender do endpoint de detalhe (que pode nao materializar
 * `validation`).
 */
export interface ReportValidationResult {
  report_type: ReportType;
  ref: number | string;
  cd_cvm: number | null;
  validation: ReportValidation;
}

// ----------------------------------------------------------------------------
// Capital composition (Sprint 4)
// ----------------------------------------------------------------------------

export interface CapitalCompositionSnapshotSummary {
  id: string;
  captured_at: string;
  cnpj_cia: string;
  cd_cvm: number;
  denom_cia: string;
  reference_date: string;
  versao: number;
  source: string; // "itr" | "dfp"
  period_type: string;
  qt_total_integralized: string | number | null;
  qt_total_treasury: string | number | null;
  file_version_hash: string;
  // S02 T02: bloco de validacao embutido por item (API generica, report_type=capital).
  validation: ReportValidation;
}

export interface CapitalCompositionSnapshotDetail extends CapitalCompositionSnapshotSummary {
  qt_on_integralized: string | number | null;
  qt_pn_integralized: string | number | null;
  qt_on_treasury: string | number | null;
  qt_pn_treasury: string | number | null;
  raw_data: Record<string, unknown>;
}

/**
 * Histórico de snapshots de composição de capital de uma empresa
 * (`GET /admin/cvm/capital-composition/by-company/{cd_cvm}`). NÃO é paginado —
 * o backend devolve `CapitalCompositionByCompanyResponse` (envelope `snapshots`).
 */
export interface CapitalCompositionByCompanyResponse {
  cd_cvm: number;
  company_name: string;
  snapshots: CapitalCompositionSnapshotSummary[];
}

export interface CapitalCompositionSyncStatusResponse {
  last_captured_at: string | null;
  last_file_hash: string | null;
  total_snapshots: number;
  distinct_companies: number;
  companies_with_data: number;
  companies_missing_data: number;
  snapshots_by_source: Record<string, number>;
}

export interface TriggerCapitalCompositionSyncResponse {
  task_id: string;
  status: string;
}

export interface ListCapitalCompositionParams {
  cd_cvm?: number;
  cnpj?: string;
  source?: string;
  period_type?: string;
  // S02 T02: filtro de amostragem pendente/validado (resolvido em lote no backend).
  validation_status?: ValidationStatus;
  page?: number;
  page_size?: number;
}

// ----------------------------------------------------------------------------
// Buybacks (Sprint 5)
// ----------------------------------------------------------------------------

export interface BuybackProgramSummary {
  id: string;
  id_programa: string;
  cnpj_companhia: string;
  cd_cvm: number | null;
  nome_companhia: string;
  data_deliberacao: string | null;
  data_final_prazo: string | null;
  situacao: string | null;
  tipo_operacao: string | null;
  finalidade_compra: string | null;
  qt_acoes_ordinarias: string | number | null;
  qt_acoes_preferenciais: string | number | null;
  captured_at: string;
  // S02 T02: bloco de validacao embutido por item (API generica, report_type=buyback).
  validation: ReportValidation;
}

export interface BuybackQuantitySummary {
  tipo_acao: string | null;
  classe_acao: string | null;
  quantidade_circulacao: string | number | null;
  quantidade_operacao: string | number | null;
}

export interface BuybackIntermediarySummary {
  cnpj_intermediario: string;
  nome_intermediario: string;
}

export interface BuybackProgramDetail extends BuybackProgramSummary {
  motivo: string | null;
  file_version_hash: string;
  raw_data: Record<string, unknown>;
  quantities: BuybackQuantitySummary[];
  intermediaries: BuybackIntermediarySummary[];
}

/**
 * Histórico de programas de recompra de uma empresa
 * (`GET /admin/cvm/buybacks/programs/by-company/{cd_cvm}`). NÃO é paginado —
 * o backend devolve `BuybackByCompanyResponse` (envelope `programs`).
 */
export interface BuybackByCompanyResponse {
  cd_cvm: number;
  company_name: string;
  programs: BuybackProgramSummary[];
}

export interface BuybackSyncStatusResponse {
  total_programs: number;
  active_programs: number;
  closed_programs: number;
  total_quantities: number;
  total_intermediaries: number;
  distinct_companies: number;
  last_captured_at: string | null;
  last_file_hash: string | null;
}

export interface TriggerBuybackSyncResponse {
  task_id: string;
  status: string;
}

export interface ListBuybackProgramsParams {
  cd_cvm?: number;
  cnpj?: string;
  situacao?: string;
  tipo_operacao?: string;
  // S02 T02: filtro de amostragem pendente/validado (resolvido em lote no backend).
  validation_status?: ValidationStatus;
  page?: number;
  page_size?: number;
}

// ----------------------------------------------------------------------------
// VLMO insider trading (Sprint 8)
// ----------------------------------------------------------------------------

export interface VLMOMovimentacaoSummary {
  id: string;
  cnpj_companhia: string;
  nome_companhia: string;
  data_referencia: string;
  versao: number;
  tipo_empresa: string | null;
  empresa: string | null;
  tipo_cargo: string | null;
  tipo_movimentacao: string | null;
  tipo_operacao: string | null;
  tipo_ativo: string | null;
  caracteristica_valor_mobiliario: string | null;
  data_movimentacao: string | null;
  quantidade: string | number | null;
  preco_unitario: string | number | null;
  volume: string | number | null;
  is_position_snapshot: boolean;
}

/**
 * Filing VLMO — a *unidade de validacao* do VLMO (S02 T03). O selo vive aqui,
 * no header/protocolo, NAO nas movimentacoes individuais. `id` e UUID e e o
 * `ref` da API generica (report_type="vlmo").
 */
export interface VLMOFilingSummary {
  id: string;
  protocolo_entrega: string;
  cnpj_companhia: string;
  cd_cvm: number | null;
  nome_companhia: string;
  data_referencia: string;
  versao: number;
  categoria: string | null;
  tipo: string | null;
  data_entrega: string | null;
  tipo_apresentacao: string | null;
  link_download: string | null;
  captured_at: string;
  // Selo de validacao embutido por item (API generica). Pode vir ausente do
  // backend — tratamos como pendente na UI.
  validation?: ReportValidation | null;
}

export interface VLMOFilingDetail extends VLMOFilingSummary {
  file_version_hash: string;
  raw_data: Record<string, unknown>;
}

/**
 * Movimentações VLMO de uma empresa (`GET /admin/cvm/vlmo/by-company/{cd_cvm}`).
 * NÃO é paginado no envelope — aceita `page`/`page_size` como filtro de janela,
 * mas o backend devolve `VLMOByCompanyResponse` (envelope `movimentacoes`), não
 * `AdminPagedResponse`. O selo de validação vive no FILING (`/vlmo/filings`), não
 * na movimentação — por isso `VLMOMovimentacaoSummary` não traz `validation`.
 */
export interface VLMOByCompanyResponse {
  cd_cvm: number;
  company_name: string;
  movimentacoes: VLMOMovimentacaoSummary[];
}

export interface ListVLMOFilingsParams {
  cnpj?: string;
  cd_cvm?: number;
  year?: number;
  validation_status?: ValidationStatus;
  page?: number;
  page_size?: number;
}

export interface VLMOAggregateRow {
  reference_month: string;
  tipo_cargo: string;
  total_credit_quantity: string | number | null;
  total_debit_quantity: string | number | null;
  net_flow_quantity: string | number | null;
  total_volume: string | number | null;
}

export interface VLMOAggregatesResponse {
  cd_cvm: number;
  company_name: string;
  rows: VLMOAggregateRow[];
}

export interface VLMOSyncStatusResponse {
  last_captured_at: string | null;
  last_file_hash: string | null;
  total_filings: number;
  total_movimentacoes: number;
  distinct_companies: number;
  distinct_years: number;
  movimentacoes_by_cargo: Record<string, number>;
  movimentacoes_by_movimentacao: Record<string, number>;
}

export interface TriggerVLMOSyncResponse {
  task_id: string;
  status: string;
}

export interface ListVLMOMovimentacoesParams {
  cnpj?: string;
  tipo_cargo?: string;
  tipo_movimentacao?: string;
  is_position_snapshot?: boolean;
  year?: number;
  page?: number;
  page_size?: number;
}

// ----------------------------------------------------------------------------
// FRE — Formulário de Referência (Sprint 7)
// ----------------------------------------------------------------------------

export interface FREFilingSummary {
  id: string;
  id_documento: string;
  cnpj_companhia: string;
  cd_cvm: number | null;
  nome_companhia: string;
  data_referencia: string;
  versao: number;
  categoria_documento: string | null;
  data_recebimento: string | null;
  captured_at: string;
  // S02 T01: bloco de validacao embutido por item (API generica).
  validation: ReportValidation;
}

export interface FREAuditorSummary {
  id_auditor: string | null;
  auditor: string | null;
  cnpj_auditor: string | null;
  tipo_origem_auditor: string | null;
  data_inicio_contratacao: string | null;
  data_fim_contratacao: string | null;
  remuneracao_auditor: string | number | null;
}

export interface FREValorMobiliarioSummary {
  valor_mobiliario: string | null;
  identificacao_valor_mobiliario: string | null;
  data_emissao: string | null;
  data_vencimento: string | null;
  quantidade: string | number | null;
  saldo_devedor: string | number | null;
  origem: string | null;
}

export interface FREFilingDetail extends FREFilingSummary {
  data_inicio_exercicio_social: string | null;
  data_fim_exercicio_social: string | null;
  link_documento: string | null;
  file_version_hash: string;
  capital_social: Record<string, unknown>[];
  distribuicao_capital: Record<string, unknown> | null;
  posicao_acionaria: Record<string, unknown>[];
  auditores: FREAuditorSummary[];
  responsaveis: Record<string, unknown>[];
  participacoes: Record<string, unknown>[];
  remuneracao_orgao: Record<string, unknown>[];
  remuneracao_max_min_media: Record<string, unknown>[];
  valores_mobiliarios: FREValorMobiliarioSummary[];
  mercado_estrangeiro: Record<string, unknown>[];
  transacoes_parte_relacionada: Record<string, unknown>[];
}

/**
 * Histórico anual de FREs de uma empresa (`GET /admin/cvm/fre/by-company/{cd_cvm}`).
 * NÃO é paginado — o backend devolve `FREByCompanyResponse` (envelope com a lista
 * `filings`), não `AdminPagedResponse`.
 */
export interface FREByCompanyResponse {
  cd_cvm: number;
  company_name: string;
  filings: FREFilingSummary[];
}

export interface FRESyncStatusResponse {
  last_captured_at: string | null;
  last_file_hash: string | null;
  total_filings: number;
  distinct_companies: number;
  distinct_years: number;
  rows_by_section: Record<string, number>;
}

export interface TriggerFRESyncResponse {
  task_id: string;
  status: string;
}

export interface ListFREFilingsParams {
  cd_cvm?: number;
  cnpj?: string;
  year?: number;
  // S02 T01: filtro de amostragem pendente/validado (resolvido em lote no backend).
  validation_status?: ValidationStatus;
  page?: number;
  page_size?: number;
}

// ----------------------------------------------------------------------------
// ICBGC — Informe do Codigo Brasileiro de Governanca Corporativa
// ----------------------------------------------------------------------------

export interface GovernanceReportSummary {
  id: string;
  id_documento: number;
  cnpj_companhia: string;
  cd_cvm: number | null;
  nome_empresarial: string;
  data_referencia: string;
  versao: number;
  motivo_reapresentacao: string | null;
  data_entrega: string | null;
  captured_at: string;
  // S02 T04: bloco de validacao embutido por item (API generica, report_type=icbgc).
  validation: ReportValidation;
}

export interface GovernanceComplianceItemSummary {
  id_item: string;
  capitulo: string;
  principio: string;
  pratica_recomendada: string;
  pratica_adotada_raw: string | null;
  pratica_adotada_normalized: string;
  explicacao: string | null;
}

export interface GovernanceReportDetail extends GovernanceReportSummary {
  data_inicio_exercicio_social: string | null;
  data_fim_exercicio_social: string | null;
  link_download: string | null;
  file_version_hash: string;
  raw_data: Record<string, unknown>;
  items: GovernanceComplianceItemSummary[];
}

export interface GovernanceByCompanyResponse {
  cd_cvm: number;
  company_name: string;
  reports: GovernanceReportSummary[];
}

export interface GovernanceSyncStatusResponse {
  last_captured_at: string | null;
  last_file_hash: string | null;
  total_reports: number;
  distinct_companies: number;
  distinct_years: number;
  total_items: number;
  items_by_normalized: Record<string, number>;
}

export interface TriggerICBGCSyncResponse {
  task_id: string;
  status: string;
}

export interface ListICBGCReportsParams {
  cd_cvm?: number;
  cnpj?: string;
  year?: number;
  // S02 T04: filtro de amostragem pendente/validado (resolvido em lote no backend).
  validation_status?: ValidationStatus;
  page?: number;
  page_size?: number;
}

// ----------------------------------------------------------------------------
// FCA — Formulario Cadastral
// ----------------------------------------------------------------------------

export interface FCADocumentoSummary {
  id: string;
  id_documento: number;
  cnpj_companhia: string;
  cd_cvm: number | null;
  nome_empresarial: string;
  data_referencia: string;
  versao: number;
  categoria_documento: string | null;
  data_recebimento: string | null;
  captured_at: string;
  // S02 T03: bloco de validacao embutido por item (API generica, report_type=fca).
  validation: ReportValidation;
}

export interface FCAGeralSummary {
  setor_atividade: string | null;
  descricao_atividade: string | null;
  situacao_emissor: string | null;
  pais_origem: string | null;
  pagina_web: string | null;
  nome_empresarial_anterior: string | null;
  data_constituicao: string | null;
}

export interface FCADriSummary {
  tipo_responsavel: string;
  responsavel: string;
  email: string | null;
  cidade: string | null;
  sigla_uf: string | null;
  data_inicio_atuacao: string | null;
  data_fim_atuacao: string | null;
}

export interface FCAValorMobiliarioSummary {
  valor_mobiliario: string;
  codigo_negociacao: string | null;
  mercado: string | null;
  sigla_entidade_administradora: string | null;
  segmento: string | null;
  data_inicio_listagem: string | null;
  data_fim_listagem: string | null;
}

export interface FCAAuditorSummary {
  auditor: string;
  codigo_cvm_auditor: string | null;
  responsavel_tecnico: string | null;
  data_inicio_atuacao_auditor: string | null;
  data_fim_atuacao_auditor: string | null;
}

export interface FCADocumentoDetail extends FCADocumentoSummary {
  file_version_hash: string;
  geral: FCAGeralSummary | null;
  dri: FCADriSummary[];
  valores_mobiliarios: FCAValorMobiliarioSummary[];
  auditores: FCAAuditorSummary[];
}

export interface FCAByCompanyResponse {
  cd_cvm: number;
  company_name: string;
  documentos: FCADocumentoSummary[];
}

export interface FCASyncStatusResponse {
  last_captured_at: string | null;
  last_file_hash: string | null;
  total_documentos: number;
  distinct_companies: number;
  distinct_years: number;
  rows_by_section: Record<string, number>;
}

export interface TriggerFCASyncResponse {
  task_id: string;
  status: string;
}

export interface ListFCADocumentosParams {
  cd_cvm?: number;
  cnpj?: string;
  year?: number;
  // S02 T03: filtro de amostragem pendente/validado (resolvido em lote no backend).
  validation_status?: ValidationStatus;
  page?: number;
  page_size?: number;
}

// ----------------------------------------------------------------------------
// Participantes do mercado — auditores, intermediarios, adm. de carteira
// ----------------------------------------------------------------------------

export interface AuditorRegistrySummary {
  id: string;
  cd_cvm: number;
  tipo: string;
  nome: string;
  cnpj: string | null;
  situacao: string;
  dt_ini_sit: string | null;
  municipio: string | null;
  uf: string | null;
  captured_at: string;
  // S02 T04: selo de validacao por registro cadastral (API generica,
  // report_type="participante_auditor", ref=id UUID). Defensivo: ausencia = pendente.
  validation?: ReportValidation | null;
}

export interface IntermediarioRegistrySummary {
  id: string;
  cnpj: string;
  cd_cvm: number | null;
  tipo_participante: string;
  denom_social: string;
  denom_comerc: string | null;
  situacao: string;
  dt_reg: string | null;
  dt_cancel: string | null;
  motivo_cancel: string | null;
  setor_ativ: string | null;
  municipio: string | null;
  uf: string | null;
  captured_at: string;
  // S02 T04: selo de validacao (report_type="participante_intermediario", ref=id UUID).
  validation?: ReportValidation | null;
}

export interface AdmCarteiraRegistrySummary {
  id: string;
  cnpj: string;
  denom_social: string;
  denom_comerc: string | null;
  situacao: string;
  categoria_registro: string;
  subcategoria_registro: string | null;
  dt_reg: string | null;
  dt_cancel: string | null;
  municipio: string | null;
  uf: string | null;
  captured_at: string;
  // S02 T04: selo de validacao (report_type="participante_adm_carteira", ref=id UUID).
  validation?: ReportValidation | null;
}

export interface ParticipantesSyncStatusResponse {
  auditor_total: number;
  auditor_ativo: number;
  auditor_suspenso: number;
  auditor_cancelada: number;
  auditor_last_captured_at: string | null;
  intermediario_total: number;
  intermediario_by_tipo: Record<string, number>;
  intermediario_last_captured_at: string | null;
  adm_carteira_total: number;
  adm_carteira_by_categoria: Record<string, number>;
  adm_carteira_last_captured_at: string | null;
}

export type ParticipantesSyncDataset = "auditor" | "intermed" | "adm_cart" | "all";

export interface TriggerParticipantesSyncResponse {
  task_id: string;
  status: string;
  dataset: string;
}

export interface ListAuditoresParams {
  situacao?: string;
  tipo?: "PJ" | "PF";
  validation_status?: ValidationStatus;
  page?: number;
  page_size?: number;
}

export interface ListIntermediariosParams {
  situacao?: string;
  tipo_participante?: string;
  validation_status?: ValidationStatus;
  page?: number;
  page_size?: number;
}

export interface ListAdmCarteiraParams {
  situacao?: string;
  categoria_registro?: string;
  validation_status?: ValidationStatus;
  page?: number;
  page_size?: number;
}

// ----------------------------------------------------------------------------
// Alertas operacionais CVM
// ----------------------------------------------------------------------------

export type AlertSeverity = "alta" | "media" | "baixa";

export interface OperationalAlert {
  alert_type: string;
  severity: AlertSeverity;
  cd_cvm: number | null;
  cnpj: string | null;
  nome_empresarial: string | null;
  message: string;
  payload: Record<string, unknown>;
  reference_date: string | null;
  detected_at: string;
}

export interface AlertsSummaryResponse {
  total: number;
  by_severity: Record<string, number>;
  by_type: Record<string, number>;
}

export interface ListAlertsParams {
  severity?: string;
  alert_type?: string;
  cd_cvm?: number;
  page?: number;
  page_size?: number;
}

// ----------------------------------------------------------------------------
// Dashboard CVM consolidado (S06)
// ----------------------------------------------------------------------------

/** Frescor do dataset por tipo. `em_dia` quando dentro da janela de recencia. */
export type DashboardFreshness = "em_dia" | "atraso";

/** Tipos de documento exibidos no grid "Documentos por tipo" do dashboard. */
export type DashboardReportType =
  | "itr_dfp"
  | "fre"
  | "fca"
  | "ipe"
  | "buyback"
  | "vlmo"
  | "capital"
  | "icbgc"
  | "participantes";

/** KPIs do topo do dashboard CVM. Numeros sao calculados no backend (on-read). */
export interface DashboardKPIs {
  total_filings: number;
  validated: number;
  pending: number;
  active_alerts: number;
  companies: number;
  /** Data ISO da ultima EOD (ranking, fallback score) ou null. */
  last_eod: string | null;
}

/** Rollup por tipo de documento (uma linha do grid "Documentos por tipo"). */
export interface DashboardByType {
  report_type: string;
  total: number;
  validated: number;
  pending: number;
  freshness: DashboardFreshness | string;
}

/** Resposta de `GET /admin/cvm/dashboard`. */
export interface CVMDashboardResponse {
  kpis: DashboardKPIs;
  by_type: DashboardByType[];
}

// ---------------------------------------------------------------------------
// Taxonomia setor/subsetor (S10 T02) — endpoints `/admin/sectors/*` (NAO sob
// `/admin/cvm`). Subsetor e camada organizacional/visual: score e DCF
// continuam por `sector_id`. Slugs: derivados do `name` quando ausentes;
// setor name/slug unicos globais; subsetor slug unico por setor.
// ---------------------------------------------------------------------------

/** Subsetor aninhado dentro de um setor (GET) ou retorno de create/update. */
export interface SubsectorResponse {
  id: string;
  sector_id: string;
  name: string;
  slug: string;
  company_count: number;
  created_at: string;
  updated_at: string;
}

/** Item de `GET /admin/sectors`: setor com subsetores aninhados e contagens. */
export interface SectorWithSubsectorsResponse {
  id: string;
  name: string;
  slug: string;
  company_count: number;
  created_at: string;
  subsectors: SubsectorResponse[];
}

/** Retorno de create/update de setor (sem subsetores aninhados). */
export interface SectorResponse {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

/** Body de `POST /admin/sectors`. Slug derivado do name quando ausente. */
export interface SectorCreateRequest {
  name: string;
  slug?: string;
}

/** Body de `PATCH /admin/sectors/{id}`. Renomear sem slug re-deriva o slug. */
export interface SectorUpdateRequest {
  name?: string;
  slug?: string;
}

/** Body de `POST /admin/sectors/{id}/subsectors`. */
export interface SubsectorCreateRequest {
  name: string;
  slug?: string;
}

/** Body de `PATCH /admin/sectors/{id}/subsectors/{subsector_id}`. */
export interface SubsectorUpdateRequest {
  name?: string;
  slug?: string;
}

/**
 * Body de `PATCH /admin/sectors/companies/{company_id}/assignment`.
 *
 * Semantica do backend (distingue "nao enviado" de "enviado null" via
 * `model_fields_set`):
 *   - `sector_id` omitido => mantem o setor atual.
 *   - `subsector_id` omitido (chave ausente) => mantem o subsetor atual.
 *   - `subsector_id: null` (chave PRESENTE com null) => limpa o subsetor.
 * O subsetor final deve pertencer ao setor final, senao 422.
 */
export interface CompanyReassignRequest {
  sector_id?: string;
  subsector_id?: string | null;
}

/** Retorno de `PATCH .../assignment`. */
export interface CompanyAssignmentResponse {
  id: string;
  cd_cvm: number | null;
  name: string;
  sector_id: string;
  sector_slug: string;
  subsector_id: string | null;
  subsector_slug: string | null;
}

// ----------------------------------------------------------------------------
// S12 — Operacao / Status do pipeline (jobs Celery instrumentados)
// `GET /admin/cvm/ops/jobs` => { jobs, history }. APENAS LEITURA — sem disparo/retry.
// Tudo computado no backend (stale, duration_ms). O front so exibe.
// ----------------------------------------------------------------------------

/** Estado de uma execucao de job. */
export type JobStatus = "running" | "ok" | "failed";

/**
 * Uma linha de execucao de job (mesmo shape em `jobs` e `history`).
 *
 * - `jobs[]` = ultima linha por `job_name` (status atual).
 * - `history[]` = execucoes recentes (mais novas primeiro, filtraveis por job).
 *
 * Regras do backend (NAO recalcular no front):
 * - `stale` = ultimo sucesso alem da janela esperada. `running` nunca e stale.
 * - `expected_window_seconds: null` = job sob demanda (nunca stale).
 */
export interface OpsJobRun {
  job_name: string;
  status: JobStatus;
  started_at: string | null;
  finished_at: string | null;
  duration_ms: number | null;
  detail: string | null;
  last_ok_at: string | null;
  stale: boolean;
  expected_window_seconds: number | null;
}

/** Resposta de `GET /admin/cvm/ops/jobs`. */
export interface OpsJobsResponse {
  jobs: OpsJobRun[];
  history: OpsJobRun[];
}

/** Params de `GET /admin/cvm/ops/jobs`. `history_limit` 1–200 (default 20). */
export interface ListOpsJobsParams {
  job_name?: string;
  history_limit?: number;
}
