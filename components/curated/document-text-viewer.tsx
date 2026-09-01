"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Visualizador de texto longo de documento, com busca.
 *
 * ## Por que existe
 *
 * O padrao estava DUPLICADO literalmente no mesmo arquivo
 * (`app/cvm/companies/detail/page.tsx`): `ReleaseRow` para o texto do release e
 * `DividendPolicyRow` para a politica de dividendos do FRE — cujo docstring
 * admite "espelha o viewer de release". Mesmo `<pre>`, mesma altura, mesmo
 * lazy-load.
 *
 * ## A busca nao e enfeite
 *
 * O release tem ~44 mil caracteres em media. Achar "GMV" a olho num `<pre>`
 * rolavel e o gargalo real de quem vai curar — nao a leitura, a localizacao.
 *
 * ## Selecao para copiar
 *
 * `onCopySelection` recebe o trecho que o operador selecionou no proprio texto.
 * E o que liga o documento ao campo curado sem obrigar a copiar e colar entre
 * telas — e o trecho vem com a proveniencia do documento aberto.
 */

interface Props {
  text: string;
  onCopySelection?: (trecho: string) => void;
}

export function DocumentTextViewer({ text, onCopySelection }: Props) {
  const [termo, setTermo] = useState("");
  const [selecao, setSelecao] = useState("");

  const ocorrencias = useMemo(() => {
    const t = termo.trim();
    if (t.length < 2) return 0;
    // `split` conta ocorrencias sem regex: o termo pode ter parenteses, ponto,
    // qualquer coisa que um release escreve.
    return text.toLowerCase().split(t.toLowerCase()).length - 1;
  }, [text, termo]);

  const pedacos = useMemo(() => {
    const t = termo.trim();
    if (t.length < 2) return [{ texto: text, destaque: false }];
    const partes: { texto: string; destaque: boolean }[] = [];
    const baixo = text.toLowerCase();
    const alvo = t.toLowerCase();
    let i = 0;
    while (i < text.length) {
      const achou = baixo.indexOf(alvo, i);
      if (achou === -1) {
        partes.push({ texto: text.slice(i), destaque: false });
        break;
      }
      if (achou > i) partes.push({ texto: text.slice(i, achou), destaque: false });
      partes.push({ texto: text.slice(achou, achou + t.length), destaque: true });
      i = achou + t.length;
    }
    return partes;
  }, [text, termo]);

  function capturaSelecao() {
    const s = typeof window !== "undefined" ? window.getSelection()?.toString() ?? "" : "";
    setSelecao(s.trim());
  }

  return (
    <div className="space-y-2" data-testid="document-text-viewer">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          className="h-9 max-w-xs"
          placeholder="Buscar no texto (min. 2 caracteres)"
          aria-label="Buscar no texto"
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          data-testid="viewer-search"
        />
        {termo.trim().length >= 2 && (
          <span className="text-xs text-muted-foreground" data-testid="viewer-matches">
            {ocorrencias} ocorrencia(s)
          </span>
        )}
        {onCopySelection && (
          <Button
            size="sm"
            variant="outline"
            disabled={selecao.length === 0}
            onClick={() => onCopySelection(selecao)}
            data-testid="viewer-copy-selection"
            title="Selecione um trecho no texto e clique para levar ao campo."
          >
            Copiar trecho para campo
          </Button>
        )}
      </div>

      <pre
        onMouseUp={capturaSelecao}
        onKeyUp={capturaSelecao}
        className="max-h-[28rem] overflow-auto whitespace-pre-wrap break-words rounded-xl bg-muted/40 p-4 font-mono text-xs leading-relaxed text-foreground"
        data-testid="viewer-text"
      >
        {pedacos.map((p, i) =>
          p.destaque ? (
            <mark key={i} className="bg-warning-dim text-warning">
              {p.texto}
            </mark>
          ) : (
            <span key={i}>{p.texto}</span>
          ),
        )}
      </pre>
    </div>
  );
}
