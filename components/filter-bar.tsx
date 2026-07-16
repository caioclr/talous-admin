"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface FilterBarSearch {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

interface FilterBarProps {
  /** Controles de filtro renderizados em grid responsivo. */
  children?: React.ReactNode;
  /** Slot de busca textual renderizado em destaque no topo (largura total). */
  search?: FilterBarSearch;
  className?: string;
}

/**
 * Barra de filtros compacta posicionada diretamente acima da lista. Substitui o
 * padrao `<Card><CardHeader>Filtros</CardHeader>...` (visualmente destacado da
 * tabela). Uso: envolver `<FilterBar>` + `<DataTable>` num wrapper
 * `flex flex-col gap-2` para que leiam como uma unidade.
 */
export function FilterBar({ children, search, className }: FilterBarProps) {
  return (
    <div className={cn("panel-surface flex flex-col gap-3 p-3 md:p-4", className)}>
      {search ? (
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-10"
            value={search.value}
            placeholder={search.placeholder ?? "Buscar"}
            onChange={(event) => search.onChange(event.target.value)}
          />
        </div>
      ) : null}

      {children ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{children}</div>
      ) : null}
    </div>
  );
}
