import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PaginationMeta } from "@/lib/services/admin/types";
import { cn } from "@/lib/utils";
import { PaginationControls } from "./pagination";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  pagination?: PaginationMeta;
  loading?: boolean;
  emptyMessage?: string;
  onPageChange?: (page: number) => void;
  pageSizeOptions?: number[];
  onPageSizeChange?: (size: number) => void;
  getRowKey?: (row: T, index: number) => string;
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({
  columns,
  data,
  pagination,
  loading = false,
  emptyMessage = "Nenhum registro encontrado.",
  onPageChange,
  pageSizeOptions,
  onPageSizeChange,
  getRowKey,
  onRowClick,
}: DataTableProps<T>) {
  return (
    <div className="panel-surface overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key} className={column.className}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading
              ? Array.from({ length: 6 }).map((_, index) => (
                  <TableRow key={`skeleton-${index}`}>
                    {columns.map((column) => (
                      <TableCell key={column.key}>
                        <Skeleton className="h-4 w-full max-w-[180px]" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : null}

            {!loading && data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="py-12 text-center text-sm text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : null}

            {!loading
              ? data.map((row, index) => (
                  <TableRow
                    key={getRowKey ? getRowKey(row, index) : String(index)}
                    className={cn(onRowClick ? "cursor-pointer hover:bg-muted/40" : undefined)}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                  >
                    {columns.map((column) => (
                      <TableCell key={column.key} className={column.className}>
                        {column.render(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : null}
          </TableBody>
        </Table>
      </div>

      {pagination && onPageChange ? (
        <PaginationControls
          pagination={pagination}
          onPageChange={onPageChange}
          pageSizeOptions={pageSizeOptions}
          onPageSizeChange={onPageSizeChange}
        />
      ) : null}
    </div>
  );
}
