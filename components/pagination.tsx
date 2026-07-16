"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PaginationMeta } from "@/lib/services/admin/types";

/** Opções padrão de itens-por-página para as listas do admin. */
export const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

interface PaginationControlsProps {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
  /** Quando ambos são passados, renderiza o seletor de itens-por-página. */
  pageSizeOptions?: number[];
  onPageSizeChange?: (size: number) => void;
}

export function PaginationControls({
  pagination,
  onPageChange,
  pageSizeOptions,
  onPageSizeChange,
}: PaginationControlsProps) {
  const hasPrevious = pagination.page > 1;
  const hasNext = pagination.page < pagination.total_pages;
  const showPageSize = pageSizeOptions && pageSizeOptions.length > 0 && onPageSizeChange;

  return (
    <div className="flex flex-col gap-3 border-t border-border/80 px-4 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="text-muted-foreground">
        Pagina {pagination.page} de {Math.max(pagination.total_pages, 1)} · {pagination.total} itens
      </p>

      <div className="flex items-center gap-3">
        {showPageSize ? (
          <div className="flex items-center gap-2">
            <label htmlFor="page-size" className="text-muted-foreground">
              Por pagina
            </label>
            <select
              id="page-size"
              className="h-9 rounded-lg border border-border bg-background px-2 text-sm outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
              value={pagination.page_size}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!hasPrevious}
            onClick={() => onPageChange(pagination.page - 1)}
          >
            <ChevronLeft className="size-4" />
            Anterior
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!hasNext}
            onClick={() => onPageChange(pagination.page + 1)}
          >
            Proxima
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
