"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PaginationMeta } from "@/lib/services/admin/types";

interface PaginationControlsProps {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
}

export function PaginationControls({
  pagination,
  onPageChange,
}: PaginationControlsProps) {
  const hasPrevious = pagination.page > 1;
  const hasNext = pagination.page < pagination.total_pages;

  return (
    <div className="flex flex-col gap-3 border-t border-border/80 px-4 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="text-muted-foreground">
        Pagina {pagination.page} de {Math.max(pagination.total_pages, 1)} · {pagination.total} itens
      </p>

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
  );
}
