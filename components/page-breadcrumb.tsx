"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface BreadcrumbSegment {
  label: string;
  /** Quando presente, o segmento vira link. O ultimo (atual) normalmente omite. */
  href?: string;
}

interface PageBreadcrumbProps {
  /** Destino da seta "Voltar" (e do primeiro segmento, quando linkado). */
  backHref: string;
  /** Trilha de navegacao; o ultimo item e a pagina atual (sem link). */
  trail: BreadcrumbSegment[];
  title?: string;
  subtitle?: string;
  /** Slot alinhado a direita (badges, acoes, cross-links). */
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Cabecalho de navegacao para paginas de detalhe: seta "Voltar" + trilha de
 * breadcrumbs + titulo/subtitulo, com slot de acoes a direita. Consolida o
 * padrao antes replicado nas telas de validacao.
 */
export function PageBreadcrumb({
  backHref,
  trail,
  title,
  subtitle,
  actions,
  className,
}: PageBreadcrumbProps) {
  const router = useRouter();

  return (
    <div
      className={cn(
        "flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between",
        className,
      )}
    >
      <div className="flex items-start gap-2">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Voltar"
          onClick={() => router.push(backHref)}
        >
          <ArrowLeft className="size-4" />
        </Button>

        <div className="min-w-0">
          <nav className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {trail.map((segment, index) => (
              <span key={`${segment.label}-${index}`} className="flex items-center gap-1.5">
                {index > 0 ? <ChevronRight className="size-3" /> : null}
                {segment.href ? (
                  <Link href={segment.href} className="transition hover:text-foreground">
                    {segment.label}
                  </Link>
                ) : (
                  <span className={index === trail.length - 1 ? "text-foreground" : undefined}>
                    {segment.label}
                  </span>
                )}
              </span>
            ))}
          </nav>

          {title ? (
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">{title}</h2>
          ) : null}

          {subtitle ? (
            <p className="mt-1 max-w-xl text-xs text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
      </div>

      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
