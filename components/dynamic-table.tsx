import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DynamicTableProps {
  rows: Record<string, unknown>[];
  loading?: boolean;
  emptyMessage?: string;
  /**
   * Optional column ordering — keys listed here come first; remaining keys are
   * appended in insertion order from the first row.
   */
  preferredKeys?: string[];
  maxRows?: number;
}

function stringifyCell(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function humanize(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function DynamicTable({
  rows,
  loading = false,
  emptyMessage = "Sem registros.",
  preferredKeys,
  maxRows,
}: DynamicTableProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border/80 bg-background/60 px-4 py-6 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  const allKeys = new Set<string>();
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      allKeys.add(key);
    }
  }
  const orderedKeys = preferredKeys
    ? [
        ...preferredKeys.filter((k) => allKeys.has(k)),
        ...[...allKeys].filter((k) => !preferredKeys.includes(k)),
      ]
    : [...allKeys];

  const visibleRows = maxRows ? rows.slice(0, maxRows) : rows;

  return (
    <div className="overflow-hidden rounded-2xl border border-border/80">
      <div className="max-h-[480px] overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {orderedKeys.map((key) => (
                <TableHead key={key} className="whitespace-nowrap">
                  {humanize(key)}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleRows.map((row, index) => (
              <TableRow key={index}>
                {orderedKeys.map((key) => (
                  <TableCell key={key} className="align-top text-sm">
                    {stringifyCell(row[key])}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {maxRows && rows.length > maxRows ? (
        <p className="border-t border-border/80 px-4 py-2 text-xs text-muted-foreground">
          Mostrando {maxRows} de {rows.length} linhas. Use filtros do dataset para refinar.
        </p>
      ) : null}
    </div>
  );
}
