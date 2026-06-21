"use client";

import { useState } from "react";
import { Check, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDateTime, formatValidatedBy } from "@/lib/formatters";
import type { ReportType, ReportValidation } from "@/lib/services/admin/types";
import { useReportValidation } from "./use-report-validation";

/**
 * Estado pendente default. O endpoint de DETALHE de FRE/FCA/ICBGC pode devolver
 * `validation: null` (a validacao so e materializada na LISTA); tratamos null
 * como pendente para nao quebrar a tela de validacao.
 */
const PENDING_VALIDATION: ReportValidation = {
  status: "pending",
  validated_by: null,
  validated_at: null,
};

interface ValidationActionPanelProps {
  reportType: ReportType;
  /** id de documento do tipo (FRE/FCA/ICBGC). Nome `reportRef` evita o prop reservado `ref`. */
  reportRef: string;
  /** Pode vir `null` do endpoint de detalhe — tratado como pendente. */
  validation: ReportValidation | null | undefined;
  /** Query keys a invalidar apos a acao (lista + detalhe do tipo). */
  invalidateKeys?: unknown[][];
}

/**
 * Bloco reutilizavel "selo + marcar valido / reverter", parametrizado por
 * `(report_type, ref)`. Mostra o selo (quem/quando) quando validado, ou o botao
 * de marcar quando pendente. Toda a logica de mutation/toast vem do hook
 * `useReportValidation` — serve FRE/FCA/ICBGC sem reescrita.
 */
export function ValidationActionPanel({
  reportType,
  reportRef,
  validation,
  invalidateKeys,
}: ValidationActionPanelProps) {
  // Override local do selo, definido SO pelo retorno do POST. Necessario porque
  // o endpoint de detalhe de FRE/FCA/ICBGC pode devolver `validation: null`
  // mesmo apos validar — sem isso o selo nunca refletiria a acao do usuario.
  // O override e atrelado ao `reportRef` atual; ao trocar de documento ele e
  // descartado (derivacao em render, sem efeito), voltando a confiar no prop.
  const [override, setOverride] = useState<{
    ref: string;
    validation: ReportValidation;
  } | null>(null);

  const current =
    override?.ref === reportRef
      ? override.validation
      : (validation ?? PENDING_VALIDATION);

  const { validateMutation, invalidateMutation } = useReportValidation({
    reportType,
    reportRef,
    invalidateKeys,
    onValidationChange: (next) => setOverride({ ref: reportRef, validation: next }),
  });

  const isValidated = current.status === "valid";

  return (
    <div className="flex flex-col items-end gap-2">
      <ValidationSeal validation={current} />
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
  );
}

/** Selo "Validado por X em ..." / "Pendente de validacao". Reutilizavel. */
export function ValidationSeal({
  validation,
}: {
  validation: ReportValidation | null | undefined;
}) {
  if (!validation || validation.status !== "valid") {
    return (
      <span className="inline-flex items-center rounded-sm border border-warning/20 bg-warning-dim px-3 py-1 text-xs font-medium text-warning">
        Pendente de validacao
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-sm border border-success/20 bg-success-dim px-3 py-1 text-success">
      <Check className="size-3.5" />
      <span className="text-xs font-medium">
        Validado por {formatValidatedBy(validation.validated_by)}
        {validation.validated_at
          ? ` em ${formatDateTime(validation.validated_at)}`
          : ""}
      </span>
    </div>
  );
}
