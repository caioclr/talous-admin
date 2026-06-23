"use client";

import * as React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getCvmAcronym } from "@/lib/cvm-glossary";
import { cn } from "@/lib/utils";

interface CvmAcronymProps {
  /** A sigla a explicar (ex.: "IPE", "ITR/DFP", "cd_cvm"). */
  sigla: string;
  /**
   * Texto a renderizar no lugar da sigla. Quando ausente, usa `sigla`.
   * Util quando o rotulo visivel difere da chave do glossario.
   */
  children?: React.ReactNode;
  /**
   * Quando `true` (padrao), o trigger e focavel por teclado (`tabIndex`).
   * Use `false` ao aninhar dentro de um elemento ja interativo (ex.: um
   * link de navegacao), evitando conteudo interativo aninhado e duplo tab
   * stop. Nesse caso o tooltip ainda abre no hover e no focus do elemento pai.
   */
  interactive?: boolean;
  className?: string;
}

/**
 * Wrapper acessivel que explica uma sigla padrao da CVM via tooltip.
 *
 * - Consulta o glossario central (`lib/cvm-glossary.ts`).
 * - Se a sigla nao estiver no glossario, renderiza o texto puro (sem quebrar).
 * - Acessivel: indicacao visual sutil (underline tracejado) e `aria` adequado;
 *   por padrao o trigger e focavel por teclado e o tooltip abre no hover/focus.
 * - Inline (`span`): nao quebra headings, links ou labels onde for aplicado.
 * - O conteudo textual renderizado e identico a `children`/`sigla`, preservando
 *   o nome acessivel de headings e links que o envolvem.
 *
 * Reusa `components/ui/tooltip.tsx` (radix), que ja trata teclado e touch.
 */
export function CvmAcronym({
  sigla,
  children,
  interactive = true,
  className,
}: CvmAcronymProps) {
  const entry = getCvmAcronym(sigla);
  const label = children ?? sigla;

  // Sigla desconhecida: degrada para texto puro, preservando o conteudo.
  if (!entry) {
    return <>{label}</>;
  }

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            {...(interactive ? { tabIndex: 0 } : {})}
            className={cn(
              "cursor-help underline decoration-dotted decoration-muted-foreground/60 underline-offset-4 outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
              className,
            )}
          >
            {label}
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="font-semibold text-foreground">{entry.termo}</p>
          <p className="mt-0.5 text-muted-foreground">{entry.descricao}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
