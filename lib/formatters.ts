export function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatDate(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
  }).format(new Date(value));
}

export function truncateHash(value: string | null | undefined, size = 10) {
  if (!value) {
    return "—";
  }

  if (value.length <= size * 2) {
    return value;
  }

  return `${value.slice(0, size)}...${value.slice(-size)}`;
}

export function formatBoolean(value: boolean | null | undefined) {
  if (value === null || value === undefined) {
    return "—";
  }

  return value ? "Sim" : "Nao";
}

export function formatList(values: string[]) {
  return values.length ? values.join(", ") : "—";
}

export function formatValidatedBy(
  validatedBy: { name: string | null; email: string | null } | null | undefined,
) {
  if (!validatedBy) {
    return "—";
  }

  return validatedBy.name ?? validatedBy.email ?? "—";
}

/**
 * Rotulo de periodo por trimestre/ano, derivado da identidade do filing.
 *
 * Apenas APRESENTACAO — nao calcula nem reinterpreta o dado:
 * - ITR com mes 03 -> Q1, 06 -> Q2, 09 -> Q3, 12 -> Q4 -> `ITR Q{n}/{ano}`
 * - DFP -> `DFP {ano}` (demonstracao anual)
 * - mes nao mapeado -> usa o mes cru (`ITR M{mes}/{ano}`) para nao mentir
 */
export function formatFilingPeriodLabel(
  docType: string | null | undefined,
  referenceDate: string | null | undefined,
) {
  if (!referenceDate) {
    return docType ? docType.toUpperCase() : "—";
  }

  const match = /^(\d{4})-(\d{2})/.exec(referenceDate);
  if (!match) {
    return docType ? docType.toUpperCase() : "—";
  }

  const year = match[1];
  const month = match[2];
  const type = (docType ?? "").toLowerCase();

  if (type === "dfp") {
    return `DFP ${year}`;
  }

  const quarterByMonth: Record<string, string> = {
    "03": "Q1",
    "06": "Q2",
    "09": "Q3",
    "12": "Q4",
  };
  const quarter = quarterByMonth[month] ?? `M${month}`;
  const prefix = type ? type.toUpperCase() : "ITR";

  return `${prefix} ${quarter}/${year}`;
}

/**
 * Mesma identidade de periodo, recuada exatamente um ano. Usado apenas para
 * rotular a coluna de comparacao (PENULTIMO) — nao busca nem altera dado.
 */
export function priorYearReferenceDate(referenceDate: string | null | undefined) {
  if (!referenceDate) {
    return null;
  }

  const match = /^(\d{4})(-\d{2}-\d{2})/.exec(referenceDate);
  if (!match) {
    return null;
  }

  return `${Number(match[1]) - 1}${match[2]}`;
}

export function formatDecimal(
  value: string | number | null | undefined,
  options: Intl.NumberFormatOptions = { minimumFractionDigits: 2, maximumFractionDigits: 2 },
) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const parsed = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(parsed)) {
    return "—";
  }

  return new Intl.NumberFormat("pt-BR", options).format(parsed);
}
