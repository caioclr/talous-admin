import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ValidationStatus } from "@/lib/services/admin/types";

/**
 * Badge de status de validacao — reutilizavel por qualquer tipo (FRE/FCA/ICBGC).
 * `valid` -> selo de sucesso com check; `pending` -> aviso.
 */
export function ValidationBadge({ status }: { status: ValidationStatus }) {
  if (status === "valid") {
    return (
      <Badge variant="success" className="gap-1">
        <Check className="size-3" />
        Validado
      </Badge>
    );
  }

  return <Badge variant="warning">Pendente</Badge>;
}
