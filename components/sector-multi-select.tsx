"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { listSectors } from "@/lib/services/admin/sectors";

export interface SectorSelection {
  sectorSlugs: string[];
  subsectorSlugs: string[];
}

interface SectorMultiSelectProps {
  value: SectorSelection;
  onChange: (value: SectorSelection) => void;
}

const EMPTY: SectorSelection = { sectorSlugs: [], subsectorSlugs: [] };

/**
 * Filtro hierárquico de setor + subsetor com múltipla escolha, sobre o
 * DropdownMenu do Radix. Setores no nível 0, subsetores indentados no nível 1.
 * Emite listas de slugs; a seleção de setor e a de subsetor combinam via OR no
 * backend (ver GET /admin/cvm/companies).
 */
export function SectorMultiSelect({ value, onChange }: SectorMultiSelectProps) {
  const sectorsQuery = useQuery({
    queryKey: ["admin", "sectors"],
    queryFn: listSectors,
  });
  const sectors = sectorsQuery.data ?? [];

  const totalSelected = value.sectorSlugs.length + value.subsectorSlugs.length;
  const label =
    totalSelected === 0
      ? "Todos os setores"
      : `${totalSelected} selecionado${totalSelected > 1 ? "s" : ""}`;

  const toggleSector = (slug: string) => {
    const has = value.sectorSlugs.includes(slug);
    onChange({
      ...value,
      sectorSlugs: has
        ? value.sectorSlugs.filter((s) => s !== slug)
        : [...value.sectorSlugs, slug],
    });
  };

  const toggleSubsector = (slug: string) => {
    const has = value.subsectorSlugs.includes(slug);
    onChange({
      ...value,
      subsectorSlugs: has
        ? value.subsectorSlugs.filter((s) => s !== slug)
        : [...value.subsectorSlugs, slug],
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-between font-normal">
          <span className={totalSelected === 0 ? "text-muted-foreground" : undefined}>
            {label}
          </span>
          <ChevronDown className="size-4 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-80 w-72 overflow-y-auto">
        {totalSelected > 0 ? (
          <>
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                onChange(EMPTY);
              }}
              className="justify-center text-xs text-muted-foreground"
            >
              Limpar seleção
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        ) : null}

        {sectorsQuery.isLoading ? (
          <DropdownMenuLabel>Carregando…</DropdownMenuLabel>
        ) : sectors.length === 0 ? (
          <DropdownMenuLabel>Nenhum setor</DropdownMenuLabel>
        ) : (
          sectors.map((sector) => (
            <div key={sector.id}>
              <DropdownMenuCheckboxItem
                checked={value.sectorSlugs.includes(sector.slug)}
                onCheckedChange={() => toggleSector(sector.slug)}
                onSelect={(event) => event.preventDefault()}
                className="font-medium"
              >
                {sector.name}
              </DropdownMenuCheckboxItem>
              {sector.subsectors.map((sub) => (
                <DropdownMenuCheckboxItem
                  key={sub.id}
                  checked={value.subsectorSlugs.includes(sub.slug)}
                  onCheckedChange={() => toggleSubsector(sub.slug)}
                  onSelect={(event) => event.preventDefault()}
                  className="pl-12 text-muted-foreground"
                >
                  {sub.name}
                </DropdownMenuCheckboxItem>
              ))}
            </div>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
