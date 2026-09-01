"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  getCuratedFieldsCatalog,
  listCuratedFields,
  publishCuratedField,
  unpublishCuratedField,
  upsertCuratedField,
} from "@/lib/services/admin/curated-fields";
import type { CuratedFieldCatalogItem } from "@/lib/services/admin/types";

/**
 * Painel de conteudo curado de uma empresa.
 *
 * ## Salvar e publicar sao atos diferentes
 *
 * Nao e cerimonia: `published_at` nulo e o default no backend, entao rascunho
 * existe na tabela e NAO chega ao usuario. O operador salva, ve o texto na lista,
 * e so entao publica. Um passo unico tiraria dele a chance de conferir.
 *
 * ## A proveniencia entra sozinha
 *
 * Quando o painel e aberto com `sourceReleaseId`, o formulario nasce com
 * `source_kind: "release"` e o documento preenchido. Sem isso o operador teria de
 * lembrar de declarar de onde veio — e o backend recusa origem "release" sem o
 * documento, justamente porque essa proveniencia e publicada ao usuario.
 */

interface Props {
  companyId: string;
  /** Preenchido quando o painel e aberto a partir de um release. */
  sourceReleaseId?: string | null;
  /** Trecho trazido do visualizador de documento. */
  initialText?: string;
  /** Chave sugerida ao abrir (ex.: o operador escolheu no visualizador). */
  initialFieldKey?: string;
}

export function CuratedFieldsPanel({
  companyId,
  sourceReleaseId,
  initialText,
  initialFieldKey,
}: Props) {
  const queryClient = useQueryClient();
  const [fieldKey, setFieldKey] = useState(initialFieldKey ?? "");
  const [period, setPeriod] = useState("");
  const [valueText, setValueText] = useState(initialText ?? "");
  const [valueNum, setValueNum] = useState("");

  const catalogo = useQuery({
    queryKey: ["admin", "curated-catalog"],
    queryFn: getCuratedFieldsCatalog,
    staleTime: 60 * 60_000,
  });
  const campos = useQuery({
    queryKey: ["admin", "curated-fields", companyId],
    queryFn: () => listCuratedFields(companyId),
  });

  // O trecho vindo do visualizador substitui o texto em edicao: o operador
  // acabou de escolher aquele pedaco, e sobrescrever e o que ele espera.
  useEffect(() => {
    if (initialText) setValueText(initialText);
  }, [initialText]);
  useEffect(() => {
    if (initialFieldKey) setFieldKey(initialFieldKey);
  }, [initialFieldKey]);

  const definicao: CuratedFieldCatalogItem | undefined = catalogo.data?.find(
    (c) => c.key === fieldKey,
  );

  function invalida() {
    queryClient.invalidateQueries({ queryKey: ["admin", "curated-fields", companyId] });
  }

  const salvar = useMutation({
    mutationFn: () =>
      upsertCuratedField(companyId, fieldKey, {
        period: period.trim() || null,
        value_text: definicao?.kind === "text" ? valueText : null,
        value_num: definicao?.kind === "number" ? Number(valueNum) : null,
        source_kind: sourceReleaseId ? "release" : "admin",
        source_release_id: sourceReleaseId ?? null,
      }),
    onSuccess: () => {
      toast.success("Rascunho salvo. Publique para aparecer no app.");
      invalida();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const publicar = useMutation({
    mutationFn: (v: { key: string; period: string | null }) =>
      publishCuratedField(companyId, v.key, v.period),
    onSuccess: () => {
      toast.success("Publicado.");
      invalida();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const despublicar = useMutation({
    mutationFn: (v: { key: string; period: string | null }) =>
      unpublishCuratedField(companyId, v.key, v.period),
    onSuccess: () => {
      toast.success("Despublicado. O rascunho continua aqui.");
      invalida();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const podeSalvar =
    !!definicao &&
    (!definicao.requires_period || period.trim().length > 0) &&
    (definicao.kind === "text" ? valueText.trim().length > 0 : valueNum.trim().length > 0);

  return (
    <div className="space-y-4" data-testid="curated-fields-panel">
      <div className="space-y-3 rounded-2xl border border-border/70 p-4">
        <div className="space-y-1.5">
          <Label htmlFor="curated-field-key">Campo</Label>
          <Select
            id="curated-field-key"
            value={fieldKey}
            onChange={(e) => setFieldKey(e.target.value)}
            data-testid="curated-field-select"
          >
            <option value="">Escolha o campo…</option>
            {(catalogo.data ?? []).map((c) => (
              <option key={c.key} value={c.key}>
                {c.label} · {c.section === "visao_geral" ? "Visao Geral" : "Negocio"}
              </option>
            ))}
          </Select>
          {definicao?.help_text && (
            <p className="text-xs text-muted-foreground">{definicao.help_text}</p>
          )}
          {definicao?.is_company_statement && (
            <p className="text-xs text-warning">
              Este campo e exibido como fala da companhia, com atribuicao explicita.
            </p>
          )}
        </div>

        {definicao?.requires_period && (
          <div className="space-y-1.5">
            <Label htmlFor="curated-period">Periodo</Label>
            <Input
              id="curated-period"
              placeholder="2T26"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              data-testid="curated-period"
            />
          </div>
        )}

        {definicao?.kind === "number" ? (
          <div className="space-y-1.5">
            <Label htmlFor="curated-num">Valor{definicao.unit ? ` (${definicao.unit})` : ""}</Label>
            <Input
              id="curated-num"
              inputMode="decimal"
              value={valueNum}
              onChange={(e) => setValueNum(e.target.value)}
              data-testid="curated-value-num"
            />
          </div>
        ) : definicao ? (
          <div className="space-y-1.5">
            <Label htmlFor="curated-text">Texto</Label>
            <Textarea
              id="curated-text"
              rows={6}
              value={valueText}
              onChange={(e) => setValueText(e.target.value)}
              data-testid="curated-value-text"
            />
          </div>
        ) : null}

        {sourceReleaseId && (
          <p className="text-xs text-muted-foreground" data-testid="curated-provenance">
            Origem: release aberto. A proveniencia e publicada ao usuario.
          </p>
        )}

        <Button
          size="sm"
          disabled={!podeSalvar || salvar.isPending}
          onClick={() => salvar.mutate()}
          data-testid="curated-save"
        >
          {salvar.isPending ? "Salvando..." : "Salvar rascunho"}
        </Button>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-medium">Campos desta empresa</h4>
        {campos.isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : (campos.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground" data-testid="curated-empty">
            Nenhum campo curado ainda.
          </p>
        ) : (
          <ul className="divide-y divide-border/60" data-testid="curated-list">
            {(campos.data ?? []).map((c) => (
              <li
                key={`${c.field_key}:${c.period ?? ""}`}
                className="flex flex-wrap items-center gap-2 py-2 text-sm"
                data-testid={`curated-row-${c.field_key}`}
              >
                <span className="font-medium">{c.label}</span>
                {c.period && <span className="text-xs text-muted-foreground">{c.period}</span>}
                <Badge variant={c.published ? "success" : "secondary"}>
                  {c.published ? "Publicado" : "Rascunho"}
                </Badge>
                <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                  {c.kind === "number"
                    ? (c.value_num?.toLocaleString("pt-BR") ?? "—")
                    : (c.value_text ?? "—")}
                </span>
                {c.published ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => despublicar.mutate({ key: c.field_key, period: c.period })}
                    data-testid={`curated-unpublish-${c.field_key}`}
                  >
                    Despublicar
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => publicar.mutate({ key: c.field_key, period: c.period })}
                    data-testid={`curated-publish-${c.field_key}`}
                  >
                    Publicar
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
