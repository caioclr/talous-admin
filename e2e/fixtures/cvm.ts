import type {
  AdmCarteiraRegistrySummary,
  AdminCompanyDetail,
  AdminCompanySummary,
  AdminPagedResponse,
  AlertsSummaryResponse,
  OperationalAlert,
  AuditorRegistrySummary,
  IntermediarioRegistrySummary,
  ParticipantesSyncStatusResponse,
  BuybackProgramDetail,
  BuybackProgramSummary,
  BuybackSyncStatusResponse,
  CapitalCompositionSnapshotDetail,
  CapitalCompositionSnapshotSummary,
  CapitalCompositionSyncStatusResponse,
  CVMSectorMappingResponse,
  CVMSnapshotSummary,
  RegistryChangeEventResponse,
  SyncStatusResponse,
  UnmappedSectorResponse,
  VLMOAggregatesResponse,
  VLMOMovimentacaoSummary,
  VLMOSyncStatusResponse,
  FCAByCompanyResponse,
  FCADocumentoDetail,
  FCADocumentoSummary,
  FCASyncStatusResponse,
  FREFilingDetail,
  FREFilingSummary,
  FRESyncStatusResponse,
  GovernanceByCompanyResponse,
  GovernanceReportDetail,
  GovernanceReportSummary,
  GovernanceSyncStatusResponse,
  AccountLinesTreeResponse,
  FilingSummaryWithValidation,
} from "@/lib/services/admin/types";

export const SYNC_STATUS_DEFAULT: SyncStatusResponse = {
  last_captured_at: "2026-04-29T08:00:00Z",
  last_file_hash: "0123456789abcdef0123456789abcdef01234567",
  total_snapshots: 412,
  situation_counts: { ATIVO: 350, CANCELADO: 50, SUSPENSO: 12 },
  unmapped_sectors_count: 2,
};

export const COMPANY_PETROBRAS: AdminCompanySummary = {
  id: "11111111-1111-1111-1111-111111111111",
  cd_cvm: 9512,
  name: "Petroleo Brasileiro S.A. - Petrobras",
  cnpj: "33000167000101",
  sector_slug: "energy",
  cvm_situation: "ATIVO",
  cvm_category: "A",
  cvm_market_type: "BOLSA",
  is_active: true,
  primary_ticker: "PETR4",
  cvm_last_synced_at: "2026-04-29T08:00:00Z",
};

export const COMPANY_VALE: AdminCompanySummary = {
  id: "22222222-2222-2222-2222-222222222222",
  cd_cvm: 4170,
  name: "Vale S.A.",
  cnpj: "33592510000154",
  sector_slug: "materials",
  cvm_situation: "ATIVO",
  cvm_category: "A",
  cvm_market_type: "BOLSA",
  is_active: true,
  primary_ticker: "VALE3",
  cvm_last_synced_at: "2026-04-29T08:00:00Z",
};

export const COMPANIES_LIST: AdminPagedResponse<AdminCompanySummary> = {
  items: [COMPANY_PETROBRAS, COMPANY_VALE],
  pagination: { page: 1, page_size: 20, total: 2, total_pages: 1 },
};

export const COMPANY_DETAIL_PETROBRAS: AdminCompanyDetail = {
  ...COMPANY_PETROBRAS,
  cvm_situation_started_at: "2010-05-12",
  cvm_registration_date: "1977-12-21",
  cvm_constitution_date: "1953-10-03",
  cvm_cancellation_date: null,
  cvm_cancellation_reason: null,
  cvm_controlling_shareholder: "Uniao Federal",
  cvm_setor_atividade: "PETROLEO E GAS",
  tickers: ["PETR3", "PETR4"],
};

export const HISTORY_PETROBRAS: CVMSnapshotSummary[] = [
  {
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    captured_at: "2026-04-29T08:00:00Z",
    cd_cvm: 9512,
    denom_social: "Petroleo Brasileiro S.A. - Petrobras",
    situacao: "ATIVO",
    categoria_registro: "A",
    tipo_mercado: "BOLSA",
    file_version_hash: "hash-2026-04-29",
  },
  {
    id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    captured_at: "2026-04-22T08:00:00Z",
    cd_cvm: 9512,
    denom_social: "Petroleo Brasileiro S.A. - Petrobras",
    situacao: "ATIVO",
    categoria_registro: "A",
    tipo_mercado: "BOLSA",
    file_version_hash: "hash-2026-04-22",
  },
];

export const CHANGES_PETROBRAS: RegistryChangeEventResponse[] = [
  {
    cd_cvm: 9512,
    field: "controle_acionario",
    old: "Uniao Federal (50,5%)",
    new: "Uniao Federal (50,7%)",
    captured_at: "2026-04-29T08:00:00Z",
  },
];

export const SECTOR_MAPPINGS: CVMSectorMappingResponse[] = [
  {
    cvm_setor_atividade: "PETROLEO E GAS",
    internal_sector_id: "33333333-3333-3333-3333-333333333333",
    internal_sector_slug: "energy",
    notes: "Setor de petroleo, gas e energia",
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-04-15T00:00:00Z",
  },
];

export const CAPITAL_COMPOSITION_SYNC_STATUS: CapitalCompositionSyncStatusResponse = {
  last_captured_at: "2026-04-29T08:00:00Z",
  last_file_hash: "ccccaaaaa11111000099998888777766665555444",
  total_snapshots: 8,
  distinct_companies: 2,
  companies_with_data: 2,
  companies_missing_data: 0,
  snapshots_by_source: { itr: 6, dfp: 2 },
};

export const CAPITAL_COMPOSITION_PETROBRAS_SERIES: CapitalCompositionSnapshotSummary[] = [
  {
    id: "cccc1111-1111-1111-1111-111111111111",
    captured_at: "2026-04-29T08:00:00Z",
    cnpj_cia: "33000167000101",
    cd_cvm: 9512,
    denom_cia: "Petroleo Brasileiro S.A. - Petrobras",
    reference_date: "2025-03-31",
    versao: 1,
    source: "itr",
    period_type: "quarterly",
    qt_total_integralized: "13044496930",
    qt_total_treasury: "12000000",
    file_version_hash: "hash-q1-2025",
  },
  {
    id: "cccc2222-2222-2222-2222-222222222222",
    captured_at: "2026-04-29T08:00:00Z",
    cnpj_cia: "33000167000101",
    cd_cvm: 9512,
    denom_cia: "Petroleo Brasileiro S.A. - Petrobras",
    reference_date: "2025-06-30",
    versao: 1,
    source: "itr",
    period_type: "quarterly",
    qt_total_integralized: "13044496930",
    qt_total_treasury: "10500000",
    file_version_hash: "hash-q2-2025",
  },
  {
    id: "cccc3333-3333-3333-3333-333333333333",
    captured_at: "2026-04-29T08:00:00Z",
    cnpj_cia: "33000167000101",
    cd_cvm: 9512,
    denom_cia: "Petroleo Brasileiro S.A. - Petrobras",
    reference_date: "2025-09-30",
    versao: 1,
    source: "itr",
    period_type: "quarterly",
    qt_total_integralized: "13044496930",
    qt_total_treasury: "9800000",
    file_version_hash: "hash-q3-2025",
  },
];

export const CAPITAL_COMPOSITION_DETAIL: CapitalCompositionSnapshotDetail = {
  ...CAPITAL_COMPOSITION_PETROBRAS_SERIES[0],
  qt_on_integralized: "7442454142",
  qt_pn_integralized: "5602042788",
  qt_on_treasury: "8000000",
  qt_pn_treasury: "4000000",
  raw_data: {
    CNPJ_CIA: "33000167000101",
    DT_REFER: "2025-03-31",
    QT_TOTAL_ACOES_ON: "7442454142",
    QT_TOTAL_ACOES_PN: "5602042788",
    QT_TESOURARIA_ON: "8000000",
    QT_TESOURARIA_PN: "4000000",
  },
};

export const BUYBACKS_SYNC_STATUS: BuybackSyncStatusResponse = {
  total_programs: 12,
  active_programs: 3,
  closed_programs: 9,
  total_quantities: 24,
  total_intermediaries: 7,
  distinct_companies: 8,
  last_captured_at: "2026-04-29T08:00:00Z",
  last_file_hash: "bbbbbbbbcccccccccddddddddeeeeeeeefffffff",
};

export const BUYBACK_PROGRAM_PETROBRAS: BuybackProgramSummary = {
  id: "bbbb1111-1111-1111-1111-111111111111",
  id_programa: "PETR-2026-01",
  cnpj_companhia: "33000167000101",
  cd_cvm: 9512,
  nome_companhia: "Petroleo Brasileiro S.A. - Petrobras",
  data_deliberacao: "2026-02-15",
  data_final_prazo: "2026-08-15",
  situacao: "ATIVO",
  tipo_operacao: "COMPRA",
  finalidade_compra: "Cancelamento",
  qt_acoes_ordinarias: "100000000",
  qt_acoes_preferenciais: "50000000",
  captured_at: "2026-04-29T08:00:00Z",
};

export const BUYBACK_PROGRAM_VALE: BuybackProgramSummary = {
  id: "bbbb2222-2222-2222-2222-222222222222",
  id_programa: "VALE-2025-04",
  cnpj_companhia: "33592510000154",
  cd_cvm: 4170,
  nome_companhia: "Vale S.A.",
  data_deliberacao: "2025-10-01",
  data_final_prazo: "2025-12-31",
  situacao: "ENCERRADO",
  tipo_operacao: "COMPRA",
  finalidade_compra: "Recompra para tesouraria",
  qt_acoes_ordinarias: "200000000",
  qt_acoes_preferenciais: null,
  captured_at: "2026-04-29T08:00:00Z",
};

export const BUYBACKS_ACTIVE: AdminPagedResponse<BuybackProgramSummary> = {
  items: [BUYBACK_PROGRAM_PETROBRAS],
  pagination: { page: 1, page_size: 10, total: 1, total_pages: 1 },
};

export const BUYBACKS_LIST: AdminPagedResponse<BuybackProgramSummary> = {
  items: [BUYBACK_PROGRAM_PETROBRAS, BUYBACK_PROGRAM_VALE],
  pagination: { page: 1, page_size: 20, total: 2, total_pages: 1 },
};

export const BUYBACK_PROGRAM_DETAIL: BuybackProgramDetail = {
  ...BUYBACK_PROGRAM_PETROBRAS,
  motivo: "Programa anunciado em fato relevante de 15/fev/2026",
  file_version_hash: "hash-buybacks-petr-2026",
  raw_data: {
    ID_PROGRAMA: "PETR-2026-01",
    CNPJ_COMPANHIA: "33000167000101",
    DATA_DELIBERACAO: "2026-02-15",
    DATA_FINAL_PRAZO: "2026-08-15",
  },
  quantities: [
    {
      tipo_acao: "ON",
      classe_acao: null,
      quantidade_circulacao: "5000000000",
      quantidade_operacao: "100000000",
    },
    {
      tipo_acao: "PN",
      classe_acao: null,
      quantidade_circulacao: "3000000000",
      quantidade_operacao: "50000000",
    },
  ],
  intermediaries: [
    { cnpj_intermediario: "12345678000111", nome_intermediario: "BTG Pactual" },
    { cnpj_intermediario: "98765432000122", nome_intermediario: "Itau BBA" },
  ],
};

export const VLMO_SYNC_STATUS: VLMOSyncStatusResponse = {
  last_captured_at: "2026-04-29T08:00:00Z",
  last_file_hash: "vvvv1111ddddeeeeffffaaaabbbbcccc99998888",
  total_filings: 87,
  total_movimentacoes: 1542,
  distinct_companies: 124,
  distinct_years: 5,
  movimentacoes_by_cargo: {
    Diretor: 612,
    "Conselheiro de Administracao": 488,
    "Conselheiro Fiscal": 142,
    Controlador: 240,
    "Membro do Comite": 60,
  },
  movimentacoes_by_movimentacao: {
    "Saldo Inicial": 868,
    Compra: 412,
    Venda: 255,
    Subscricao: 7,
  },
};

export const VLMO_MOV_TRADE: VLMOMovimentacaoSummary = {
  id: "vmov0001-0000-0000-0000-000000000001",
  cnpj_companhia: "33000167000101",
  nome_companhia: "Petroleo Brasileiro S.A. - Petrobras",
  data_referencia: "2026-03-31",
  versao: 1,
  tipo_empresa: "Companhia",
  empresa: "Petrobras",
  tipo_cargo: "Diretor",
  tipo_movimentacao: "Compra",
  tipo_operacao: "A vista",
  tipo_ativo: "Acoes",
  caracteristica_valor_mobiliario: "ON",
  data_movimentacao: "2026-03-15",
  quantidade: "10000",
  preco_unitario: "32.5",
  volume: "325000",
  is_position_snapshot: false,
};

export const VLMO_MOV_SNAPSHOT: VLMOMovimentacaoSummary = {
  id: "vmov0002-0000-0000-0000-000000000002",
  cnpj_companhia: "33000167000101",
  nome_companhia: "Petroleo Brasileiro S.A. - Petrobras",
  data_referencia: "2026-03-31",
  versao: 1,
  tipo_empresa: "Companhia",
  empresa: "Petrobras",
  tipo_cargo: "Conselheiro de Administracao",
  tipo_movimentacao: "Saldo Inicial",
  tipo_operacao: null,
  tipo_ativo: "Acoes",
  caracteristica_valor_mobiliario: "ON",
  data_movimentacao: "2026-01-01",
  quantidade: "120000",
  preco_unitario: null,
  volume: null,
  is_position_snapshot: true,
};

export const VLMO_MOVS_TRADES_ONLY: AdminPagedResponse<VLMOMovimentacaoSummary> = {
  items: [VLMO_MOV_TRADE],
  pagination: { page: 1, page_size: 25, total: 1, total_pages: 1 },
};

export const VLMO_MOVS_INCLUDING_SNAPSHOT: AdminPagedResponse<VLMOMovimentacaoSummary> = {
  items: [VLMO_MOV_TRADE, VLMO_MOV_SNAPSHOT],
  pagination: { page: 1, page_size: 25, total: 2, total_pages: 1 },
};

export const VLMO_AGGREGATES_PETROBRAS: VLMOAggregatesResponse = {
  cd_cvm: 9512,
  company_name: "Petroleo Brasileiro S.A. - Petrobras",
  rows: [
    {
      reference_month: "2026-01",
      tipo_cargo: "Diretor",
      total_credit_quantity: "5000",
      total_debit_quantity: "1500",
      net_flow_quantity: "3500",
      total_volume: "115000",
    },
    {
      reference_month: "2026-02",
      tipo_cargo: "Diretor",
      total_credit_quantity: "4000",
      total_debit_quantity: "0",
      net_flow_quantity: "4000",
      total_volume: "130000",
    },
    {
      reference_month: "2026-01",
      tipo_cargo: "Conselheiro de Administracao",
      total_credit_quantity: "0",
      total_debit_quantity: "2000",
      net_flow_quantity: "-2000",
      total_volume: "65000",
    },
  ],
};

export const FRE_SYNC_STATUS: FRESyncStatusResponse = {
  last_captured_at: "2026-04-29T08:00:00Z",
  last_file_hash: "fre1111ddddccccbbbbaaaa9999888877776666",
  total_filings: 412,
  distinct_companies: 380,
  distinct_years: 4,
  rows_by_section: {
    capital_social: 412,
    posicao_acionaria: 1280,
    auditores: 745,
    remuneracao_orgao: 905,
    remuneracao_max_min_media: 280,
    valores_mobiliarios: 612,
    transacoes_parte_relacionada: 188,
    responsaveis: 412,
    participacoes: 305,
    mercado_estrangeiro: 22,
  },
};

export const FRE_FILING_PETROBRAS_SUMMARY: FREFilingSummary = {
  id: "fff1111-1111-1111-1111-111111111111",
  id_documento: "FRE-PETR-2025",
  cnpj_companhia: "33000167000101",
  cd_cvm: 9512,
  nome_companhia: "Petroleo Brasileiro S.A. - Petrobras",
  data_referencia: "2025-12-31",
  versao: 1,
  categoria_documento: "Formulario de Referencia",
  data_recebimento: "2026-04-29",
  captured_at: "2026-04-29T08:00:00Z",
  validation: {
    status: "pending",
    validated_by: null,
    validated_at: null,
  },
};

// Segundo FRE ja validado — exercita o badge de "Validado" na lista + o selo.
export const FRE_FILING_VALE_SUMMARY_VALID: FREFilingSummary = {
  id: "fff2222-2222-2222-2222-222222222222",
  id_documento: "FRE-VALE-2025",
  cnpj_companhia: "33592510000154",
  cd_cvm: 4170,
  nome_companhia: "Vale S.A.",
  data_referencia: "2025-12-31",
  versao: 1,
  categoria_documento: "Formulario de Referencia",
  data_recebimento: "2026-04-20",
  captured_at: "2026-04-20T08:00:00Z",
  validation: {
    status: "valid",
    validated_by: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Caio Moderador",
      email: "caio@talous.ai",
    },
    validated_at: "2026-05-02T13:45:00Z",
  },
};

export const FRE_FILINGS_LIST = {
  items: [FRE_FILING_PETROBRAS_SUMMARY, FRE_FILING_VALE_SUMMARY_VALID],
  pagination: { page: 1, page_size: 25, total: 2, total_pages: 1 },
};

export const FRE_FILING_PETROBRAS_DETAIL: FREFilingDetail = {
  ...FRE_FILING_PETROBRAS_SUMMARY,
  data_inicio_exercicio_social: "2025-01-01",
  data_fim_exercicio_social: "2025-12-31",
  link_documento: "https://www.rad.cvm.gov.br/exemplo/fre-petr-2025",
  file_version_hash: "freversionhashpetr2025aaaaaaaaaaaaaaaaaaaaaa",
  capital_social: [
    {
      tipo_capital: "Integralizado",
      valor_capital: 205431500000,
      data_aprovacao: "2025-04-30",
      qtd_acoes_ord: 7442454142,
      qtd_acoes_pref: 5602042788,
    },
  ],
  distribuicao_capital: {
    qtd_acionistas_ord: 451200,
    qtd_acionistas_pref: 318900,
    qtd_acoes_total_treasury: 12000000,
  },
  posicao_acionaria: [
    {
      acionista: "Uniao Federal",
      cpf_cnpj: "00000000000191",
      qt_acoes_ord: 3754000000,
      qt_acoes_pref: 0,
      pct_total: 28.7,
      acao_acordo_acionistas: true,
    },
  ],
  auditores: [
    {
      id_auditor: "AUD-12345",
      auditor: "KPMG Auditores Independentes",
      cnpj_auditor: "57755217000122",
      tipo_origem_auditor: "Reconhecida pela CVM",
      data_inicio_contratacao: "2022-04-01",
      data_fim_contratacao: null,
      remuneracao_auditor: "12500000",
    },
  ],
  responsaveis: [
    {
      tipo_responsavel: "DRI",
      nome: "Joao da Silva",
      cargo: "Diretor de Relacoes com Investidores",
    },
  ],
  participacoes: [],
  remuneracao_orgao: [
    {
      orgao: "Diretoria estatutaria",
      qtd_membros: 8,
      remuneracao_total: "65000000",
      participacao_resultados: "12000000",
    },
  ],
  remuneracao_max_min_media: [
    {
      orgao: "Diretoria estatutaria",
      remuneracao_maxima: "8500000",
      remuneracao_minima: "3200000",
      remuneracao_media: "5400000",
    },
  ],
  valores_mobiliarios: [
    {
      valor_mobiliario: "Acao",
      identificacao_valor_mobiliario: "PETR4",
      data_emissao: "1953-10-03",
      data_vencimento: null,
      quantidade: "5602042788",
      saldo_devedor: null,
      origem: "Capital social",
    },
  ],
  mercado_estrangeiro: [
    {
      mercado: "NYSE",
      simbolo: "PBR",
      pais: "Estados Unidos",
    },
  ],
  transacoes_parte_relacionada: [
    {
      contraparte: "BR Distribuidora",
      relacao: "Subsidiaria",
      valor: 2500000000,
      data_transacao: "2025-08-15",
    },
  ],
};

export const ICBGC_SYNC_STATUS: GovernanceSyncStatusResponse = {
  last_captured_at: "2026-05-30T08:00:00Z",
  last_file_hash: "icbgc111ddddccccbbbbaaaa9999888877776666",
  total_reports: 318,
  distinct_companies: 295,
  distinct_years: 3,
  total_items: 17172,
  items_by_normalized: {
    yes: 11420,
    partial: 2105,
    no: 2890,
    not_applicable: 757,
  },
};

export const ICBGC_REPORT_PETROBRAS_SUMMARY: GovernanceReportSummary = {
  id: "gggg1111-1111-1111-1111-111111111111",
  id_documento: 123456,
  cnpj_companhia: "33000167000101",
  cd_cvm: 9512,
  nome_empresarial: "Petroleo Brasileiro S.A. - Petrobras",
  data_referencia: "2025-12-31",
  versao: 2,
  motivo_reapresentacao: "Correcao de item do capitulo de fiscalizacao",
  data_entrega: "2026-05-28",
  captured_at: "2026-05-30T08:00:00Z",
};

export const ICBGC_REPORT_VALE_SUMMARY: GovernanceReportSummary = {
  id: "gggg2222-2222-2222-2222-222222222222",
  id_documento: 654321,
  cnpj_companhia: "33592510000154",
  cd_cvm: 4170,
  nome_empresarial: "Vale S.A.",
  data_referencia: "2025-12-31",
  versao: 1,
  motivo_reapresentacao: null,
  data_entrega: "2026-05-20",
  captured_at: "2026-05-30T08:00:00Z",
};

export const ICBGC_REPORTS_LIST = {
  items: [ICBGC_REPORT_PETROBRAS_SUMMARY, ICBGC_REPORT_VALE_SUMMARY],
  pagination: { page: 1, page_size: 25, total: 2, total_pages: 1 },
};

export const ICBGC_REPORT_PETROBRAS_DETAIL: GovernanceReportDetail = {
  ...ICBGC_REPORT_PETROBRAS_SUMMARY,
  data_inicio_exercicio_social: "2025-01-01",
  data_fim_exercicio_social: "2025-12-31",
  link_download: "https://www.rad.cvm.gov.br/exemplo/icbgc-petr-2025",
  file_version_hash: "icbgcversionhashpetr2025aaaaaaaaaaaaaaaaaaaa",
  raw_data: {
    ID_Documento: 123456,
    CNPJ_Companhia: "33.000.167/0001-01",
    Versao: 2,
  },
  items: [
    {
      id_item: "1.1.1",
      capitulo: "Acionistas",
      principio: "Cada acao deve corresponder a um voto",
      pratica_recomendada: "O capital social da companhia deve ser composto apenas por acoes ordinarias.",
      pratica_adotada_raw: "Sim",
      pratica_adotada_normalized: "yes",
      explicacao: null,
    },
    {
      id_item: "1.2.1",
      capitulo: "Acionistas",
      principio: "Acordos de acionistas transparentes",
      pratica_recomendada: "Acordos de acionistas nao devem vincular voto de administradores.",
      pratica_adotada_raw: "Parcialmente",
      pratica_adotada_normalized: "partial",
      explicacao: "Acordo vigente preve indicacao de conselheiros pelo controlador.",
    },
    {
      id_item: "2.1.1",
      capitulo: "Conselho de Administracao",
      principio: "Composicao diversa e independente",
      pratica_recomendada: "O conselho deve ser composto em sua maioria por membros externos.",
      pratica_adotada_raw: "Nao",
      pratica_adotada_normalized: "no",
      explicacao: "A maioria dos conselheiros e indicada pelo acionista controlador.",
    },
    {
      id_item: "3.1.1",
      capitulo: "Diretoria",
      principio: "Avaliacao da diretoria",
      pratica_recomendada: "O diretor-presidente deve ser avaliado anualmente por processo formal.",
      pratica_adotada_raw: "Nao se aplica",
      pratica_adotada_normalized: "not_applicable",
      explicacao: "Mandato iniciado ha menos de um ano.",
    },
    {
      id_item: "5.1.1",
      capitulo: "Etica e Conflito de Interesses",
      principio: "Codigo de conduta efetivo",
      pratica_recomendada: "A companhia deve ter comite de conduta dotado de independencia.",
      pratica_adotada_raw: "Sim",
      pratica_adotada_normalized: "yes",
      explicacao: null,
    },
  ],
};

export const ICBGC_BY_COMPANY_PETROBRAS: GovernanceByCompanyResponse = {
  cd_cvm: 9512,
  company_name: "Petroleo Brasileiro S.A. - Petrobras",
  reports: [
    ICBGC_REPORT_PETROBRAS_SUMMARY,
    {
      ...ICBGC_REPORT_PETROBRAS_SUMMARY,
      id: "gggg3333-3333-3333-3333-333333333333",
      id_documento: 111222,
      data_referencia: "2024-12-31",
      versao: 1,
      motivo_reapresentacao: null,
      data_entrega: "2025-05-30",
      captured_at: "2025-06-01T08:00:00Z",
    },
  ],
};

export const FCA_SYNC_STATUS: FCASyncStatusResponse = {
  last_captured_at: "2026-06-01T08:00:00Z",
  last_file_hash: "fca9999aaaabbbbccccdddd1111222233334444",
  total_documentos: 642,
  distinct_companies: 410,
  distinct_years: 2,
  rows_by_section: {
    geral: 642,
    dri: 815,
    valor_mobiliario: 1530,
    auditor: 705,
  },
};

export const FCA_DOCUMENTO_PETROBRAS_SUMMARY: FCADocumentoSummary = {
  id: "ffff1111-1111-1111-1111-111111111111",
  id_documento: 778899,
  cnpj_companhia: "33000167000101",
  cd_cvm: 9512,
  nome_empresarial: "Petroleo Brasileiro S.A. - Petrobras",
  data_referencia: "2025-12-31",
  versao: 2,
  categoria_documento: "FCA",
  data_recebimento: "2026-05-25",
  captured_at: "2026-06-01T08:00:00Z",
};

export const FCA_DOCUMENTO_VALE_SUMMARY: FCADocumentoSummary = {
  id: "ffff2222-2222-2222-2222-222222222222",
  id_documento: 998877,
  cnpj_companhia: "33592510000154",
  cd_cvm: 4170,
  nome_empresarial: "Vale S.A.",
  data_referencia: "2025-12-31",
  versao: 1,
  categoria_documento: "FCA",
  data_recebimento: "2026-05-18",
  captured_at: "2026-06-01T08:00:00Z",
};

export const FCA_DOCUMENTOS_LIST = {
  items: [FCA_DOCUMENTO_PETROBRAS_SUMMARY, FCA_DOCUMENTO_VALE_SUMMARY],
  pagination: { page: 1, page_size: 25, total: 2, total_pages: 1 },
};

export const FCA_DOCUMENTO_PETROBRAS_DETAIL: FCADocumentoDetail = {
  ...FCA_DOCUMENTO_PETROBRAS_SUMMARY,
  file_version_hash: "fcaversionhashpetr2025aaaaaaaaaaaaaaaaaaaa",
  geral: {
    setor_atividade: "Petroleo e Gas",
    descricao_atividade: "Exploracao, producao e refino de petroleo e gas natural.",
    situacao_emissor: "Fase Operacional",
    pais_origem: "Brasil",
    pagina_web: "https://www.petrobras.com.br",
    nome_empresarial_anterior: null,
    data_constituicao: "1953-10-03",
  },
  dri: [
    {
      tipo_responsavel: "Diretor de Relacoes com Investidores",
      responsavel: "Fernando Sabbi Melgarejo",
      email: "ri@petrobras.com.br",
      cidade: "Rio de Janeiro",
      sigla_uf: "RJ",
      data_inicio_atuacao: "2023-07-01",
      data_fim_atuacao: null,
    },
  ],
  valores_mobiliarios: [
    {
      valor_mobiliario: "Acoes Ordinarias",
      codigo_negociacao: "PETR3",
      mercado: "Bolsa",
      sigla_entidade_administradora: "B3",
      segmento: "Novo Mercado",
      data_inicio_listagem: "1977-01-05",
      data_fim_listagem: null,
    },
    {
      valor_mobiliario: "Acoes Preferenciais",
      codigo_negociacao: "PETR4",
      mercado: "Bolsa",
      sigla_entidade_administradora: "B3",
      segmento: "Tradicional",
      data_inicio_listagem: "1977-01-05",
      data_fim_listagem: null,
    },
  ],
  auditores: [
    {
      auditor: "KPMG Auditores Independentes",
      codigo_cvm_auditor: "418-9",
      responsavel_tecnico: "Carlos Augusto Pires",
      data_inicio_atuacao_auditor: "2019-01-01",
      data_fim_atuacao_auditor: "2023-12-31",
    },
    {
      auditor: "PricewaterhouseCoopers Auditores Independentes",
      codigo_cvm_auditor: "287-9",
      responsavel_tecnico: "Mariana Lima Souza",
      data_inicio_atuacao_auditor: "2024-01-01",
      data_fim_atuacao_auditor: null,
    },
  ],
};

export const FCA_BY_COMPANY_PETROBRAS: FCAByCompanyResponse = {
  cd_cvm: 9512,
  company_name: "Petroleo Brasileiro S.A. - Petrobras",
  documentos: [
    FCA_DOCUMENTO_PETROBRAS_SUMMARY,
    {
      ...FCA_DOCUMENTO_PETROBRAS_SUMMARY,
      id: "ffff3333-3333-3333-3333-333333333333",
      id_documento: 556677,
      data_referencia: "2024-12-31",
      versao: 1,
      data_recebimento: "2025-05-28",
      captured_at: "2025-06-01T08:00:00Z",
    },
  ],
};

export const PARTICIPANTES_SYNC_STATUS: ParticipantesSyncStatusResponse = {
  auditor_total: 387,
  auditor_ativo: 301,
  auditor_suspenso: 24,
  auditor_cancelada: 62,
  auditor_last_captured_at: "2026-06-08T08:00:00Z",
  intermediario_total: 512,
  intermediario_by_tipo: {
    CORRETORA: 290,
    DISTRIBUIDORA: 180,
    "BANCO MULTIPLO": 42,
  },
  intermediario_last_captured_at: "2026-06-08T08:05:00Z",
  adm_carteira_total: 778,
  adm_carteira_by_categoria: {
    "Pessoa Juridica": 690,
    "Pessoa Fisica": 88,
  },
  adm_carteira_last_captured_at: "2026-06-08T08:10:00Z",
};

export const PARTICIPANTES_AUDITOR_PJ: AuditorRegistrySummary = {
  id: "aaaa1111-aaaa-1111-aaaa-111111111111",
  cd_cvm: 4189,
  tipo: "PJ",
  nome: "KPMG Auditores Independentes",
  cnpj: "57755217000129",
  situacao: "ATIVO",
  dt_ini_sit: "1990-03-12",
  municipio: "Sao Paulo",
  uf: "SP",
  captured_at: "2026-06-08T08:00:00Z",
};

export const PARTICIPANTES_AUDITOR_PF: AuditorRegistrySummary = {
  id: "aaaa2222-aaaa-2222-aaaa-222222222222",
  cd_cvm: 7712,
  tipo: "PF",
  nome: "Joao Carlos Auditor",
  cnpj: null,
  situacao: "Cancelada",
  dt_ini_sit: "2021-09-30",
  municipio: "Curitiba",
  uf: "PR",
  captured_at: "2026-06-08T08:00:00Z",
};

export const PARTICIPANTES_AUDITORES_LIST: AdminPagedResponse<AuditorRegistrySummary> = {
  items: [PARTICIPANTES_AUDITOR_PJ, PARTICIPANTES_AUDITOR_PF],
  pagination: { page: 1, page_size: 25, total: 2, total_pages: 1 },
};

export const PARTICIPANTES_INTERMEDIARIO_XP: IntermediarioRegistrySummary = {
  id: "bbbb1111-bbbb-1111-bbbb-111111111111",
  cnpj: "02332886000104",
  cd_cvm: 3247,
  tipo_participante: "CORRETORA",
  denom_social: "XP Investimentos CCTVM S.A.",
  denom_comerc: "XP Investimentos",
  situacao: "EM FUNCIONAMENTO NORMAL",
  dt_reg: "2008-04-15",
  dt_cancel: null,
  motivo_cancel: null,
  setor_ativ: "Intermediacao de valores mobiliarios",
  municipio: "Sao Paulo",
  uf: "SP",
  captured_at: "2026-06-08T08:05:00Z",
};

export const PARTICIPANTES_INTERMEDIARIO_MODAL: IntermediarioRegistrySummary = {
  id: "bbbb2222-bbbb-2222-bbbb-222222222222",
  cnpj: "30723886000162",
  cd_cvm: null,
  tipo_participante: "DISTRIBUIDORA",
  denom_social: "Modal DTVM Ltda",
  denom_comerc: null,
  situacao: "CANCELADA",
  dt_reg: "1995-08-21",
  dt_cancel: "2023-02-10",
  motivo_cancel: "Incorporacao",
  setor_ativ: null,
  municipio: "Rio de Janeiro",
  uf: "RJ",
  captured_at: "2026-06-08T08:05:00Z",
};

export const PARTICIPANTES_INTERMEDIARIOS_LIST: AdminPagedResponse<IntermediarioRegistrySummary> = {
  items: [PARTICIPANTES_INTERMEDIARIO_XP, PARTICIPANTES_INTERMEDIARIO_MODAL],
  pagination: { page: 1, page_size: 25, total: 2, total_pages: 1 },
};

export const PARTICIPANTES_ADM_CARTEIRA_PJ: AdmCarteiraRegistrySummary = {
  id: "cccc1111-cccc-1111-cccc-111111111111",
  cnpj: "11699657000186",
  denom_social: "Verde Asset Management S.A.",
  denom_comerc: "Verde Asset",
  situacao: "ATIVO",
  categoria_registro: "Pessoa Juridica",
  subcategoria_registro: "Gestor de Recursos",
  dt_reg: "2014-12-01",
  dt_cancel: null,
  municipio: "Sao Paulo",
  uf: "SP",
  captured_at: "2026-06-08T08:10:00Z",
};

export const PARTICIPANTES_ADM_CARTEIRA_PF: AdmCarteiraRegistrySummary = {
  id: "cccc2222-cccc-2222-cccc-222222222222",
  cnpj: "00000000000191",
  denom_social: "Maria Gestora da Silva",
  denom_comerc: null,
  situacao: "Suspenso",
  categoria_registro: "Pessoa Fisica",
  subcategoria_registro: null,
  dt_reg: "2019-06-20",
  dt_cancel: null,
  municipio: "Belo Horizonte",
  uf: "MG",
  captured_at: "2026-06-08T08:10:00Z",
};

export const PARTICIPANTES_ADM_CARTEIRA_LIST: AdminPagedResponse<AdmCarteiraRegistrySummary> = {
  items: [PARTICIPANTES_ADM_CARTEIRA_PJ, PARTICIPANTES_ADM_CARTEIRA_PF],
  pagination: { page: 1, page_size: 25, total: 2, total_pages: 1 },
};

export const ALERTS_SUMMARY: AlertsSummaryResponse = {
  total: 42,
  by_severity: { alta: 12, media: 19, baixa: 11 },
  by_type: {
    fre_stale: 7,
    fca_stale: 5,
    needs_data_refresh: 3,
    icbgc_stale: 9,
    registry_inactive_with_active_data: 4,
    buyback_expired_open: 6,
    vlmo_heavy_selling: 5,
    auditor_change: 3,
  },
};

export const ALERT_FRE_STALE_PETROBRAS: OperationalAlert = {
  alert_type: "fre_stale",
  severity: "alta",
  cd_cvm: 9512,
  cnpj: "33000167000101",
  nome_empresarial: "Petroleo Brasileiro S.A. - Petrobras",
  message: "FRE mais recente esta desatualizado ha mais de 12 meses.",
  payload: { last_fre_reference: "2024-12-31", months_stale: 18 },
  reference_date: "2024-12-31",
  detected_at: "2026-06-09T03:00:00Z",
};

export const ALERT_BUYBACK_EXPIRED_VALE: OperationalAlert = {
  alert_type: "buyback_expired_open",
  severity: "media",
  cd_cvm: 4170,
  cnpj: "33592510000154",
  nome_empresarial: "Vale S.A.",
  message: "Programa de recompra vencido continua marcado como aberto.",
  payload: { program_id: "rb-2024-07", data_termino: "2025-12-20" },
  reference_date: "2025-12-20",
  detected_at: "2026-06-09T03:00:00Z",
};

export const ALERT_VLMO_HEAVY_SELLING_PETROBRAS: OperationalAlert = {
  alert_type: "vlmo_heavy_selling",
  severity: "baixa",
  cd_cvm: 9512,
  cnpj: "33000167000101",
  nome_empresarial: "Petroleo Brasileiro S.A. - Petrobras",
  message: "Vendas de insiders superaram compras nos ultimos 3 meses.",
  payload: { net_volume: -1250000, window_months: 3 },
  reference_date: "2026-05-31",
  detected_at: "2026-06-09T03:00:00Z",
};

export const ALERT_AUDITOR_CHANGE_SEM_CADASTRO: OperationalAlert = {
  alert_type: "auditor_change",
  severity: "baixa",
  cd_cvm: null,
  cnpj: "11222333000144",
  nome_empresarial: "Companhia Sem Cadastro S.A.",
  message: "Troca de auditor identificada no FCA mais recente.",
  payload: { auditor_anterior: "KPMG", auditor_atual: "EY" },
  reference_date: null,
  detected_at: "2026-06-09T03:05:00Z",
};

export const ALERTS_LIST: AdminPagedResponse<OperationalAlert> = {
  items: [
    ALERT_FRE_STALE_PETROBRAS,
    ALERT_BUYBACK_EXPIRED_VALE,
    ALERT_VLMO_HEAVY_SELLING_PETROBRAS,
    ALERT_AUDITOR_CHANGE_SEM_CADASTRO,
  ],
  pagination: { page: 1, page_size: 25, total: 4, total_pages: 1 },
};

export const UNMAPPED_SECTORS: UnmappedSectorResponse[] = [
  {
    cvm_setor_atividade: "TELECOMUNICACOES",
    company_count: 4,
    sample_company_names: ["Tim Brasil", "Vivo", "Oi"],
  },
  {
    cvm_setor_atividade: "AGRICULTURA",
    company_count: 2,
    sample_company_names: ["SLC Agricola", "BrasilAgro"],
  },
];

// ----------------------------------------------------------------------------
// S01 — Moderacao CVM: validacao de filings ITR/DFP
// ----------------------------------------------------------------------------

export const ITR_DFP_FILING_PETROBRAS_PENDING: FilingSummaryWithValidation = {
  cd_cvm: 9512,
  denom_cia: "Petroleo Brasileiro S.A. - Petrobras",
  doc_type: "itr",
  reference_date: "2025-03-31",
  grupo_dfr: "consolidado",
  version: 1,
  statement_types: ["DRE", "DFC", "BP"],
  validation: {
    status: "pending",
    validated_by: null,
    validated_at: null,
  },
};

export const ITR_DFP_FILING_PETROBRAS_INDIVIDUAL: FilingSummaryWithValidation = {
  cd_cvm: 9512,
  denom_cia: "Petroleo Brasileiro S.A. - Petrobras",
  doc_type: "itr",
  reference_date: "2025-03-31",
  grupo_dfr: "individual",
  version: 1,
  statement_types: ["DRE", "BP"],
  validation: {
    status: "valid",
    validated_by: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Caio Moderador",
      email: "caio@talous.ai",
    },
    validated_at: "2026-05-02T13:45:00Z",
  },
};

// Mais filings consolidados da MESMA empresa, misturando ITR e DFP em datas
// distintas — cobre a faixa de navegacao entre periodos.
export const ITR_DFP_FILING_PETROBRAS_DFP_2024: FilingSummaryWithValidation = {
  cd_cvm: 9512,
  denom_cia: "Petroleo Brasileiro S.A. - Petrobras",
  doc_type: "dfp",
  reference_date: "2024-12-31",
  grupo_dfr: "consolidado",
  version: 1,
  statement_types: ["DRE", "DFC", "BP"],
  validation: {
    status: "pending",
    validated_by: null,
    validated_at: null,
  },
};

export const ITR_DFP_FILING_PETROBRAS_ITR_2024Q1: FilingSummaryWithValidation = {
  cd_cvm: 9512,
  denom_cia: "Petroleo Brasileiro S.A. - Petrobras",
  doc_type: "itr",
  reference_date: "2024-03-31",
  grupo_dfr: "consolidado",
  version: 1,
  statement_types: ["DRE", "DFC", "BP"],
  validation: {
    status: "pending",
    validated_by: null,
    validated_at: null,
  },
};

export const ITR_DFP_FILINGS_WITH_VALIDATION: FilingSummaryWithValidation[] = [
  ITR_DFP_FILING_PETROBRAS_ITR_2024Q1,
  ITR_DFP_FILING_PETROBRAS_DFP_2024,
  ITR_DFP_FILING_PETROBRAS_PENDING,
  ITR_DFP_FILING_PETROBRAS_INDIVIDUAL,
];

export const ITR_DFP_ACCOUNT_LINES_DRE: AccountLinesTreeResponse = {
  cd_cvm: 9512,
  statement_type: "DRE",
  reference_date: "2025-03-31",
  grupo_dfr: "consolidado",
  items: [
    {
      id: "acc-1",
      cd_cvm: 9512,
      statement_type: "DRE",
      grupo_dfr: "consolidado",
      ordem_exerc: "ULTIMO",
      version: 1,
      reference_date: "2025-03-31",
      cd_conta: "3",
      ds_conta: "Receita de Venda de Bens e/ou Servicos",
      vl_conta: 123456789,
      escala_moeda: "MILHAR",
    },
    {
      id: "acc-2",
      cd_cvm: 9512,
      statement_type: "DRE",
      grupo_dfr: "consolidado",
      ordem_exerc: "ULTIMO",
      version: 1,
      reference_date: "2025-03-31",
      cd_conta: "3.01",
      ds_conta: "Custo dos Bens e/ou Servicos Vendidos",
      vl_conta: -50000000,
      escala_moeda: "MILHAR",
    },
    {
      id: "acc-3",
      cd_cvm: 9512,
      statement_type: "DRE",
      grupo_dfr: "consolidado",
      ordem_exerc: "ULTIMO",
      version: 1,
      reference_date: "2025-03-31",
      cd_conta: "3.01.01",
      ds_conta: "Custo de Materias-primas",
      vl_conta: -22000000,
      escala_moeda: "MILHAR",
    },
  ],
};

// PENULTIMO = mesmo trimestre do ano anterior. Mesmas contas (cd_conta) com
// valores menores — alimenta a coluna de comparacao e a Var%.
export const ITR_DFP_ACCOUNT_LINES_DRE_PRIOR: AccountLinesTreeResponse = {
  cd_cvm: 9512,
  statement_type: "DRE",
  reference_date: "2025-03-31",
  grupo_dfr: "consolidado",
  items: [
    {
      id: "acc-prior-1",
      cd_cvm: 9512,
      statement_type: "DRE",
      grupo_dfr: "consolidado",
      ordem_exerc: "PENULTIMO",
      version: 1,
      reference_date: "2024-03-31",
      cd_conta: "3",
      ds_conta: "Receita de Venda de Bens e/ou Servicos",
      vl_conta: 100000000,
      escala_moeda: "MILHAR",
    },
    {
      id: "acc-prior-2",
      cd_cvm: 9512,
      statement_type: "DRE",
      grupo_dfr: "consolidado",
      ordem_exerc: "PENULTIMO",
      version: 1,
      reference_date: "2024-03-31",
      cd_conta: "3.01",
      ds_conta: "Custo dos Bens e/ou Servicos Vendidos",
      vl_conta: -40000000,
      escala_moeda: "MILHAR",
    },
    {
      id: "acc-prior-3",
      cd_cvm: 9512,
      statement_type: "DRE",
      grupo_dfr: "consolidado",
      ordem_exerc: "PENULTIMO",
      version: 1,
      reference_date: "2024-03-31",
      cd_conta: "3.01.01",
      ds_conta: "Custo de Materias-primas",
      vl_conta: -20000000,
      escala_moeda: "MILHAR",
    },
  ],
};

// Resposta vazia de PENULTIMO — usada para verificar o fallback de coluna unica
// (sem comparacao) quando o backend nao tem o periodo anterior.
export const ITR_DFP_ACCOUNT_LINES_EMPTY: AccountLinesTreeResponse = {
  cd_cvm: 9512,
  statement_type: "DRE",
  reference_date: "2025-03-31",
  grupo_dfr: "consolidado",
  items: [],
};
