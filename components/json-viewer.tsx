import { cn } from "@/lib/utils";

export function JsonViewer({
  value,
  className,
}: {
  value: unknown;
  className?: string;
}) {
  return (
    <pre
      className={cn(
        "overflow-x-auto rounded-3xl border border-border/80 bg-slate-950/95 p-4 font-mono text-xs leading-6 text-slate-100",
        className,
      )}
    >
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}
