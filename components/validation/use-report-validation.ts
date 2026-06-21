"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  invalidateReport,
  validateReport,
} from "@/lib/services/admin/cvm-validations";
import type {
  ReportType,
  ReportValidation,
} from "@/lib/services/admin/types";

interface UseReportValidationOptions {
  reportType: ReportType;
  reportRef: string;
  /**
   * Query keys a invalidar apos validar/reverter (ex.: a lista e o detalhe do
   * tipo). Recebe o array bruto que vai para `invalidateQueries`.
   */
  invalidateKeys?: unknown[][];
  /**
   * Recebe o bloco `validation` atualizado retornado pelo POST. Permite refletir
   * o selo na hora, mesmo quando o endpoint de detalhe nao materializa
   * `validation` (caso de FRE/FCA/ICBGC).
   */
  onValidationChange?: (validation: ReportValidation) => void;
  onSettled?: () => void;
}

/**
 * Hook reutilizavel de validacao por `(report_type, ref)`. Encapsula as
 * mutations validate/invalidate da API generica T01 + toast + invalidacao de
 * cache. Serve T03 (FCA) e T04 (ICBGC) sem reescrita — basta trocar reportType.
 */
export function useReportValidation({
  reportType,
  reportRef,
  invalidateKeys = [],
  onValidationChange,
  onSettled,
}: UseReportValidationOptions) {
  const queryClient = useQueryClient();

  function refresh() {
    for (const key of invalidateKeys) {
      void queryClient.invalidateQueries({ queryKey: key });
    }
    onSettled?.();
  }

  const validateMutation = useMutation({
    mutationFn: () => validateReport(reportType, reportRef),
    onSuccess: (result) => {
      toast.success("Relatorio marcado como valido.");
      // So reflete localmente se o POST devolveu o bloco `validation` (backend
      // real). Sem isso, deixamos o refetch da lista/detalhe atualizar o selo.
      if (result?.validation) {
        onValidationChange?.(result.validation);
      }
      refresh();
    },
    onError: (error) => toast.error(error.message),
  });

  const invalidateMutation = useMutation({
    mutationFn: () => invalidateReport(reportType, reportRef),
    onSuccess: (result) => {
      toast.success("Validacao revertida. Relatorio voltou a pendente.");
      if (result?.validation) {
        onValidationChange?.(result.validation);
      }
      refresh();
    },
    onError: (error) => toast.error(error.message),
  });

  return {
    validateMutation,
    invalidateMutation,
    isPending: validateMutation.isPending || invalidateMutation.isPending,
  };
}
