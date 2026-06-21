"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check, ChevronRight, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  formatDateTime,
  formatDecimal,
  formatFilingPeriodLabel,
  formatValidatedBy,
  priorYearReferenceDate,
} from "@/lib/formatters";
import {
  getITRDFPAccountLines,
  invalidateITRDFPFiling,
  listITRDFPFilingsWithValidation,
  validateITRDFPFiling,
} from "@/lib/services/admin/cvm-itr-dfp";
import type {
  AccountLineResponse,
  FilingSummaryWithValidation,
  ValidateFilingParams,
} from "@/lib/services/admin/types";
import { cn } from "@/lib/utils";

/**
 * Nivel hierarquico derivado do codigo da conta CVM (ex.: "3.01.01" => nivel 2).
 * Usado apenas para indentar a exibicao — nenhum calculo sobre o dado.
 */
function getAccountLevel(cdConta: string): number {
  if (!cdConta) {
    return 0;
  }
  return Math.min(cdConta.split(".").length - 1, 4);
}

/**
 * Linha de comparacao: conta + valor atual (ULTIMO) e valor do mesmo periodo
 * do ano anterior (PENULTIMO). A juncao e por `cd_conta`.
 */
interface ComparisonRow {
  cd_conta: string;
  ds_conta: string;
  current: number | null;
  prior: number | null;
}

function toNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * VAR% e APENAS exibicao: delta percentual entre dois valores ja mostrados.
 * Nao e calculo de dominio. Retorna null quando nao ha base valida.
 */
function variationPct(current: number | null, prior: number | null): number | null {
  if (current === null || prior === null || prior === 0) {
    return null;
  }
  return ((current - prior) / Math.abs(prior)) * 100;
}

/**
 * Junta as linhas de ULTIMO e PENULTIMO por `cd_conta`, preservando a ordem do
 * periodo atual. Contas que so existem no periodo anterior entram no fim.
 */
function buildComparisonRows(
  current: AccountLineResponse[],
  prior: AccountLineResponse[],
): ComparisonRow[] {
  const priorByConta = new Map<string, AccountLineResponse>();
  for (const line of prior) {
    priorByConta.set(line.cd_conta, line);
  }

  const seen = new Set<string>();
  const rows: ComparisonRow[] = [];

  for (const line of current) {
    seen.add(line.cd_conta);
    const priorLine = priorByConta.get(line.cd_conta);
    rows.push({
      cd_conta: line.cd_conta,
      ds_conta: line.ds_conta,
      current: toNumber(line.vl_conta),
      prior: priorLine ? toNumber(priorLine.vl_conta) : null,
    });
  }

  for (const line of prior) {
    if (seen.has(line.cd_conta)) {
      continue;
    }
    rows.push({
      cd_conta: line.cd_conta,
      ds_conta: line.ds_conta,
      current: null,
      prior: toNumber(line.vl_conta),
    });
  }

  return rows;
}

function ComparisonCell({ value }: { value: number | null }) {
  return (
    <span className="font-mono text-sm tabular-nums text-foreground/80">
      {formatDecimal(value, { maximumFractionDigits: 2 })}
    </span>
  );
}

function VariationCell({ value }: { value: number | null }) {
  if (value === null) {
    return <span className="font-mono text-sm tabular-nums text-muted-foreground">—</span>;
  }

  const tone = value > 0 ? "text-success" : value < 0 ? "text-destructive" : "text-muted-foreground";
  const sign = value > 0 ? "+" : "";

  return (
    <span className={cn("font-mono text-sm tabular-nums", tone)}>
      {sign}
      {formatDecimal(value, { maximumFractionDigits: 1 })}%
    </span>
  );
}

function StatementTable({
  rows,
  loading,
  currentLabel,
  priorLabel,
  showComparison,
}: {
  rows: ComparisonRow[];
  loading: boolean;
  currentLabel: string;
  priorLabel: string;
  showComparison: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-5 w-full" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-muted-foreground">
          Nenhuma linha contabil para este demonstrativo.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="py-2 pl-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Conta
            </th>
            <th className="py-2 pl-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {currentLabel}
            </th>
            {showComparison ? (
              <>
                <th className="py-2 pl-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {priorLabel}
                </th>
                <th className="py-2 pr-3 pl-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Var%
                </th>
              </>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const level = getAccountLevel(row.cd_conta);
            const isTitle = level === 0;
            return (
              <tr
                key={row.cd_conta}
                className="border-b border-border/50 transition-colors hover:bg-muted/30"
              >
                <td className="py-2 pr-3" style={{ paddingLeft: `${level * 18 + 12}px` }}>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {row.cd_conta}
                    </span>
                    <span
                      className={cn(
                        "text-sm",
                        isTitle ? "font-semibold text-foreground" : "text-foreground/90",
                      )}
                    >
                      {row.ds_conta}
                    </span>
                  </div>
                </td>
                <td className="py-2 pl-3 text-right">
                  <ComparisonCell value={row.current} />
                </td>
                {showComparison ? (
                  <>
                    <td className="py-2 pl-3 text-right">
                      <ComparisonCell value={row.prior} />
                    </td>
                    <td className="py-2 pr-3 pl-3 text-right">
                      <VariationCell value={variationPct(row.current, row.prior)} />
                    </td>
                  </>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function ValidateFilingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const cdCvm = searchParams.get("cd_cvm") ?? "";
  const docType = searchParams.get("doc_type") ?? "";
  const referenceDate = searchParams.get("reference_date") ?? "";
  const grupoDfr = searchParams.get("grupo_dfr") ?? "";
  const version = searchParams.get("version") ?? "1";

  const filingsQuery = useQuery({
    queryKey: ["cvm", "itr-dfp", "filings-validation", cdCvm],
    queryFn: () =>
      listITRDFPFilingsWithValidation({
        cd_cvm: Number(cdCvm),
        limit: 200,
      }),
    enabled: Boolean(cdCvm),
  });

  // Filings da MESMA empresa e MESMO grupo_dfr, ordenados por reference_date,
  // misturando doc_types (ITR e DFP). Base da faixa de navegacao.
  const sameGroupFilings = useMemo(() => {
    return (filingsQuery.data ?? [])
      .filter((filing) => filing.grupo_dfr === grupoDfr)
      .slice()
      .sort(
        (a, b) =>
          new Date(a.reference_date).getTime() - new Date(b.reference_date).getTime(),
      );
  }, [filingsQuery.data, grupoDfr]);

  const currentIndex = useMemo(() => {
    return sameGroupFilings.findIndex(
      (filing) =>
        filing.doc_type === docType &&
        filing.reference_date === referenceDate &&
        filing.version === Number(version),
    );
  }, [sameGroupFilings, docType, referenceDate, version]);

  const currentFiling = currentIndex >= 0 ? sameGroupFilings[currentIndex] : undefined;
  const prevFiling = currentIndex > 0 ? sameGroupFilings[currentIndex - 1] : null;
  const nextFiling =
    currentIndex >= 0 && currentIndex < sameGroupFilings.length - 1
      ? sameGroupFilings[currentIndex + 1]
      : null;

  const statementTypes = currentFiling?.statement_types ?? [];
  const [activeStatement, setActiveStatement] = useState(0);
  const selectedStatement = statementTypes[activeStatement] ?? statementTypes[0] ?? "";

  const currentLinesQuery = useQuery({
    queryKey: [
      "cvm",
      "itr-dfp",
      "account-lines",
      cdCvm,
      selectedStatement,
      referenceDate,
      grupoDfr,
      "ULTIMO",
    ],
    queryFn: () =>
      getITRDFPAccountLines(cdCvm, {
        statement_type: selectedStatement,
        reference_date: referenceDate,
        grupo_dfr: grupoDfr,
        ordem_exerc: "ULTIMO",
      }),
    enabled: Boolean(cdCvm && selectedStatement && referenceDate),
  });

  // PENULTIMO = mesmo periodo do ano anterior, conforme contrato do endpoint.
  // So exibimos a comparacao se o backend devolver dados; nada e fabricado.
  const priorLinesQuery = useQuery({
    queryKey: [
      "cvm",
      "itr-dfp",
      "account-lines",
      cdCvm,
      selectedStatement,
      referenceDate,
      grupoDfr,
      "PENULTIMO",
    ],
    queryFn: () =>
      getITRDFPAccountLines(cdCvm, {
        statement_type: selectedStatement,
        reference_date: referenceDate,
        grupo_dfr: grupoDfr,
        ordem_exerc: "PENULTIMO",
      }),
    enabled: Boolean(cdCvm && selectedStatement && referenceDate),
  });

  const priorLines = priorLinesQuery.data?.items ?? [];
  const hasComparison = priorLines.length > 0;

  const comparisonRows = useMemo(
    () =>
      buildComparisonRows(
        currentLinesQuery.data?.items ?? [],
        priorLinesQuery.data?.items ?? [],
      ),
    [currentLinesQuery.data, priorLinesQuery.data],
  );

  const validationParams: ValidateFilingParams = {
    cd_cvm: Number(cdCvm),
    doc_type: docType,
    reference_date: referenceDate,
    grupo_dfr: grupoDfr,
    version: Number(version),
  };

  function invalidateFilings() {
    void queryClient.invalidateQueries({
      queryKey: ["cvm", "itr-dfp", "filings-validation", cdCvm],
    });
  }

  const validateMutation = useMutation({
    mutationFn: () => validateITRDFPFiling(validationParams),
    onSuccess: () => {
      toast.success("Filing marcado como valido.");
      invalidateFilings();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const invalidateMutation = useMutation({
    mutationFn: () => invalidateITRDFPFiling(validationParams),
    onSuccess: () => {
      toast.success("Validacao revertida. Filing voltou a pendente.");
      invalidateFilings();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  function navigateTo(filing: FilingSummaryWithValidation | null) {
    if (!filing) {
      return;
    }
    const query = new URLSearchParams({
      cd_cvm: String(filing.cd_cvm),
      doc_type: filing.doc_type,
      reference_date: filing.reference_date,
      grupo_dfr: filing.grupo_dfr,
      version: String(filing.version),
    });
    router.push(`/cvm/itr-dfp/validate?${query.toString()}`);
  }

  if (filingsQuery.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-64" />
        <Card>
          <CardContent className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-6 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (filingsQuery.isError) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-sm text-destructive">
            Falha ao carregar os filings: {filingsQuery.error.message}
          </p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => filingsQuery.refetch()}>
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!currentFiling) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-sm text-muted-foreground">
            Filing nao encontrado para a identidade informada.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => router.push("/cvm/itr-dfp")}
          >
            Voltar para a lista
          </Button>
        </CardContent>
      </Card>
    );
  }

  const isValidated = currentFiling.validation.status === "valid";
  const currentPeriodLabel = formatFilingPeriodLabel(
    currentFiling.doc_type,
    currentFiling.reference_date,
  );
  const priorPeriodLabel = formatFilingPeriodLabel(
    currentFiling.doc_type,
    priorYearReferenceDate(currentFiling.reference_date),
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Voltar"
            onClick={() => router.push("/cvm/itr-dfp")}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Validacao de filing</span>
              <ChevronRight className="size-3" />
              <span>{currentPeriodLabel}</span>
            </div>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
              {currentFiling.denom_cia}
            </h2>
            <p className="mt-1 max-w-xl text-xs text-muted-foreground">
              Conferencia por amostragem. Marcar como valido nao altera o dado nem o resultado da
              analise — e metadado interno de QA.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <FilingStatus filing={currentFiling} />
          {isValidated ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => invalidateMutation.mutate()}
              disabled={invalidateMutation.isPending}
            >
              <Undo2 className="size-4" />
              {invalidateMutation.isPending ? "Revertendo..." : "Reverter validacao"}
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => validateMutation.mutate()}
              disabled={validateMutation.isPending}
            >
              <Check className="size-4" />
              {validateMutation.isPending ? "Marcando..." : "Marcar como valido"}
            </Button>
          )}
        </div>
      </div>

      {/* Navegacao entre filings da mesma empresa/grupo (ITR + DFP por data) */}
      <Card>
        <CardContent className="flex items-center gap-2 p-3">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Filing anterior"
            disabled={!prevFiling}
            onClick={() => navigateTo(prevFiling)}
          >
            <ArrowLeft className="size-3.5" />
          </Button>
          <div className="flex flex-1 items-center gap-1 overflow-x-auto">
            {sameGroupFilings.map((filing, index) => {
              const isActive = index === currentIndex;
              return (
                <button
                  key={`${filing.doc_type}-${filing.reference_date}-${filing.version}`}
                  type="button"
                  aria-current={isActive ? "true" : undefined}
                  onClick={() => navigateTo(filing)}
                  className={cn(
                    "whitespace-nowrap rounded-sm px-2 py-1 text-[11px] font-medium transition",
                    isActive
                      ? "bg-accent-dim text-primary"
                      : "text-muted-foreground hover:bg-muted/30 hover:text-foreground",
                  )}
                >
                  {formatFilingPeriodLabel(filing.doc_type, filing.reference_date)}
                </button>
              );
            })}
          </div>
          <span className="whitespace-nowrap text-[11px] text-muted-foreground">
            {currentIndex + 1} de {sameGroupFilings.length}
          </span>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Proximo filing"
            disabled={!nextFiling}
            onClick={() => navigateTo(nextFiling)}
          >
            <ArrowRight className="size-3.5" />
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>
            cd_cvm: <span className="text-foreground">{currentFiling.cd_cvm}</span>
          </span>
          <span>
            doc_type: <span className="text-foreground">{currentFiling.doc_type}</span>
          </span>
          <span>
            reference_date: <span className="text-foreground">{currentFiling.reference_date}</span>
          </span>
          <span>
            grupo_dfr: <span className="text-foreground">{currentFiling.grupo_dfr}</span>
          </span>
          <span>
            version: <span className="text-foreground">{currentFiling.version}</span>
          </span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Demonstrativos</CardTitle>
          <CardDescription>
            Hierarquia de contas por demonstrativo, comparando {currentPeriodLabel} com{" "}
            {priorPeriodLabel}. Numeros sao exibidos formatados; o valor original permanece intacto
            no backend. A coluna Var% e apenas o delta entre os dois valores exibidos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {statementTypes.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">
                Este filing nao expoe demonstrativos.
              </p>
            </div>
          ) : (
            <Tabs
              value={String(activeStatement)}
              onValueChange={(value) => setActiveStatement(Number(value))}
            >
              <TabsList>
                {statementTypes.map((type, index) => (
                  <TabsTrigger key={type} value={String(index)}>
                    {type}
                  </TabsTrigger>
                ))}
              </TabsList>
              {statementTypes.map((type, index) => (
                <TabsContent key={type} value={String(index)}>
                  <StatementTable
                    rows={comparisonRows}
                    loading={currentLinesQuery.isLoading || priorLinesQuery.isLoading}
                    currentLabel={currentPeriodLabel}
                    priorLabel={priorPeriodLabel}
                    showComparison={hasComparison}
                  />
                </TabsContent>
              ))}
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function FilingStatus({ filing }: { filing: FilingSummaryWithValidation }) {
  if (filing.validation.status !== "valid") {
    return <Badge variant="warning">Pendente de validacao</Badge>;
  }

  return (
    <div className="flex items-center gap-2 rounded-sm border border-success/20 bg-success-dim px-3 py-1 text-success">
      <Check className="size-3.5" />
      <span className="text-xs font-medium">
        Validado por {formatValidatedBy(filing.validation.validated_by)}
        {filing.validation.validated_at
          ? ` em ${formatDateTime(filing.validation.validated_at)}`
          : ""}
      </span>
    </div>
  );
}
