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
  search?: string;
  page?: number;
  page_size?: number;
}

export interface ListSnapshotsParams {
  cd_cvm?: number;
  captured_at_from?: string;
  captured_at_to?: string;
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
  page?: number;
  page_size?: number;
}

export interface FilingSummary {
  cd_cvm: number;
  denom_cia: string;
  doc_type: string;
  reference_date: string;
  grupo_dfr: string;
  version: number;
  statement_types: string[];
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
  limit?: number;
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

export type ReportType = "fre" | "fca" | "icbgc";

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
}

export interface CapitalCompositionSnapshotDetail extends CapitalCompositionSnapshotSummary {
  qt_on_integralized: string | number | null;
  qt_pn_integralized: string | number | null;
  qt_on_treasury: string | number | null;
  qt_pn_treasury: string | number | null;
  raw_data: Record<string, unknown>;
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
  page?: number;
  page_size?: number;
}

export interface ListIntermediariosParams {
  situacao?: string;
  tipo_participante?: string;
  page?: number;
  page_size?: number;
}

export interface ListAdmCarteiraParams {
  situacao?: string;
  categoria_registro?: string;
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
