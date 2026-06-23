/**
 * Glossario central de siglas padrao da CVM e do mercado de capitais.
 *
 * Fonte unica para os tooltips explicativos exibidos na navegacao e nos
 * cabecalhos/labels das telas. As descricoes sao curtas (1 frase) e em PT-BR.
 *
 * Uso: ver `components/cvm-acronym.tsx`, que consulta este mapa por sigla.
 * A busca e case-insensitive e ignora espacos nas extremidades; se a sigla
 * nao existir aqui, o componente renderiza o texto puro (sem quebrar).
 */

export interface CvmAcronymEntry {
  /** Termo por extenso. */
  termo: string;
  /** Descricao curta (1 frase) em PT-BR. */
  descricao: string;
}

/**
 * Mapa sigla -> { termo, descricao }.
 *
 * As chaves sao normalizadas em maiusculas (exceto identificadores tecnicos
 * como `cd_cvm`, resolvidos via normalizacao no lookup). Prefira consultar
 * por `getCvmAcronym` em vez de acessar este objeto diretamente.
 */
export const CVM_GLOSSARY: Record<string, CvmAcronymEntry> = {
  CVM: {
    termo: "Comissao de Valores Mobiliarios",
    descricao: "Orgao regulador do mercado de capitais brasileiro.",
  },
  ITR: {
    termo: "Informacoes Trimestrais",
    descricao: "Demonstracoes financeiras trimestrais da companhia.",
  },
  DFP: {
    termo: "Demonstracoes Financeiras Padronizadas",
    descricao: "Demonstracoes financeiras anuais padronizadas.",
  },
  "ITR/DFP": {
    termo: "Informacoes Trimestrais / Demonstracoes Financeiras Padronizadas",
    descricao: "Demonstracoes financeiras trimestrais (ITR) e anuais (DFP).",
  },
  FRE: {
    termo: "Formulario de Referencia",
    descricao:
      "Cadastro anual com estrutura societaria, governanca e remuneracao.",
  },
  FCA: {
    termo: "Formulario Cadastral",
    descricao: "Dados cadastrais da companhia mantidos atualizados na CVM.",
  },
  IPE: {
    termo: "Informacoes Periodicas e Eventuais",
    descricao: "Fatos relevantes, comunicados ao mercado e atas.",
  },
  ICBGC: {
    termo: "Informe sobre o Codigo Brasileiro de Governanca Corporativa",
    descricao: "Adesao no modelo \"pratique ou explique\" de governanca.",
  },
  VLMO: {
    termo: "Valores Mobiliarios negociados por insiders",
    descricao:
      "Negociacoes de administradores e pessoas ligadas a companhia.",
  },
  DRE: {
    termo: "Demonstracao do Resultado do Exercicio",
    descricao: "Receitas, custos e lucro do periodo.",
  },
  BP: {
    termo: "Balanco Patrimonial",
    descricao: "Posicao de ativos, passivos e patrimonio liquido.",
  },
  BPA: {
    termo: "Balanco Patrimonial Ativo",
    descricao: "Lado do ativo do balanco patrimonial.",
  },
  BPP: {
    termo: "Balanco Patrimonial Passivo",
    descricao: "Lado do passivo do balanco patrimonial.",
  },
  DFC: {
    termo: "Demonstracao dos Fluxos de Caixa",
    descricao: "Entradas e saidas de caixa do periodo.",
  },
  DVA: {
    termo: "Demonstracao do Valor Adicionado",
    descricao: "Riqueza gerada e sua distribuicao entre os agentes.",
  },
  cd_cvm: {
    termo: "Codigo CVM",
    descricao: "Identificador estavel da companhia junto a CVM.",
  },
  CNPJ: {
    termo: "Cadastro Nacional da Pessoa Juridica",
    descricao: "Identificador fiscal da pessoa juridica.",
  },
  ON: {
    termo: "Acoes Ordinarias",
    descricao: "Acoes com direito a voto na companhia.",
  },
  PN: {
    termo: "Acoes Preferenciais",
    descricao: "Acoes com preferencia em dividendos, em regra sem voto.",
  },
  UNIT: {
    termo: "Units",
    descricao: "Pacote de acoes ordinarias e preferenciais negociado em conjunto.",
  },
};

/**
 * Resolve uma sigla no glossario de forma tolerante.
 *
 * Aceita variacoes de caixa e espacos nas extremidades. Identificadores
 * tecnicos como `cd_cvm` sao resolvidos pela chave original quando o lookup
 * em maiusculas falha. Retorna `undefined` se a sigla nao existir.
 */
export function getCvmAcronym(sigla: string): CvmAcronymEntry | undefined {
  const trimmed = sigla.trim();
  if (!trimmed) {
    return undefined;
  }

  const upper = trimmed.toUpperCase();
  return CVM_GLOSSARY[upper] ?? CVM_GLOSSARY[trimmed];
}
