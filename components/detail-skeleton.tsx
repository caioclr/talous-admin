import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton do cabecalho de uma pagina de detalhe (titulo largo + linha curta). */
export function DetailHeaderSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-7 w-64 max-w-full" />
      <Skeleton className="h-4 w-40 max-w-full" />
    </div>
  );
}

/** Grade de pares label/valor em skeleton para o card de metadados. */
export function FieldGridSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="rounded-2xl border border-border/80 bg-background/70 px-4 py-3"
        >
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-2 h-4 w-full max-w-[160px]" />
        </div>
      ))}
    </div>
  );
}
