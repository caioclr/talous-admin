import type {
  AdminCompanyDetail,
  AdminCompanySummary,
  AdminPagedResponse,
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
  FREFilingDetail,
  FREFilingSummary,
  FRESyncStatusResponse,
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
};

export const FRE_FILINGS_LIST = {
  items: [FRE_FILING_PETROBRAS_SUMMARY],
  pagination: { page: 1, page_size: 25, total: 1, total_pages: 1 },
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
