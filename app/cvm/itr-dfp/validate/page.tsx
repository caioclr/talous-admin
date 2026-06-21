"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, ChevronRight, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate, formatDateTime, formatDecimal, formatValidatedBy } from "@/lib/formatters";
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

function AccountRow({ item }: { item: AccountLineResponse }) {
  const level = getAccountLevel(item.cd_conta);
  const isTitle = level === 0;

  return (
    <tr className="border-b border-border/50 transition-colors hover:bg-muted/30">
      <td className="py-2 pr-3" style={{ paddingLeft: `${level * 18 + 12}px` }}>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-muted-foreground">{item.cd_conta}</span>
          <span
            className={cn(
              "text-sm",
              isTitle ? "font-semibold text-foreground" : "text-foreground/90",
            )}
          >
            {item.ds_conta}
          </span>
        </div>
      </td>
      <td className="py-2 pl-3 text-right">
        <span
          className={cn(
            "font-mono text-sm tabular-nums",
            isTitle ? "font-semibold text-foreground" : "text-foreground/80",
          )}
        >
          {formatDecimal(item.vl_conta, { maximumFractionDigits: 2 })}
        </span>
      </td>
    </tr>
  );
}

function StatementTable({
  items,
  loading,
}: {
  items: AccountLineResponse[];
  loading: boolean;
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

  if (items.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-muted-foreground">
          Nenhuma linha contabil para este demonstrativo.
        </p>
      </div>
    );
  }

  const escala = items[0]?.escala_moeda;

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="py-2 pl-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Conta
            </th>
            <th className="py-2 pr-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Valor{escala ? ` (escala: ${escala})` : ""}
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <AccountRow key={item.id} item={item} />
          ))}
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

  const currentFiling = useMemo(() => {
    return (filingsQuery.data ?? []).find(
      (filing) =>
        filing.doc_type === docType &&
        filing.reference_date === referenceDate &&
        filing.grupo_dfr === grupoDfr &&
        filing.version === Number(version),
    );
  }, [filingsQuery.data, docType, referenceDate, grupoDfr, version]);

  const statementTypes = currentFiling?.statement_types ?? [];
  const [activeStatement, setActiveStatement] = useState(0);
  const selectedStatement = statementTypes[activeStatement] ?? statementTypes[0] ?? "";

  const accountLinesQuery = useQuery({
    queryKey: [
      "cvm",
      "itr-dfp",
      "account-lines",
      cdCvm,
      selectedStatement,
      referenceDate,
      grupoDfr,
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
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>ITR/DFP</span>
              <ChevronRight className="size-3" />
              <span className="text-foreground">{currentFiling.denom_cia}</span>
            </div>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
              {currentFiling.doc_type.toUpperCase()} · {formatDate(currentFiling.reference_date)} ·{" "}
              {currentFiling.grupo_dfr}
            </h2>
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
            Hierarquia de contas por demonstrativo. Numeros sao exibidos formatados; o valor original
            permanece intacto no backend.
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
                    items={accountLinesQuery.data?.items ?? []}
                    loading={accountLinesQuery.isLoading}
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
    <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-emerald-700 dark:text-emerald-300">
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
